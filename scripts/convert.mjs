#!/usr/bin/env node
// 把旧版课程数据（src/*.js）转换成 Rspress 站点用的文件。
//
//   node scripts/convert.mjs                 转全部课
//   node scripts/convert.mjs state lists-keys   只转指定的课
//   node scripts/convert.mjs --meta          同时重新生成 course/order.js 和 course/glossary.js
//
// 每课生成两个文件：
//   docs/lessons/<id>.mdx     课文（MDX）
//   course/lessons/<id>.js    非正文数据：quiz、exercise、plays（示例的说明和预测题）等
// 每次运行还会按目录里已有的课重新生成：
//   course/registry.js        汇总注册表（引擎跨课取题用）
//   docs/lessons/_meta.json   侧栏：按阶段分组
// course/order.js、course/glossary.js 只在缺失或带 --meta 时生成。
//
// 加载旧数据的方式：按 src/build.py 的顺序把 lessons-*.js 拼起来，在 vm 里跑一遍（不含 app.js）。
// lessonAfter、PREDICTIONS、CHECK_ONLY/CHECK_MORE 的合并逻辑都在那些数据文件里，所以结果与旧页面一致。
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { toString } from 'mdast-util-to-string';
import remarkPlay from '../plugins/remark-play.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const DOCS_LESSONS = path.join(ROOT, 'docs', 'lessons');
const COURSE = path.join(ROOT, 'course');
const COURSE_LESSONS = path.join(COURSE, 'lessons');
const HEADER = '// 由 scripts/convert.mjs 从旧版 src/*.js 生成。\n';

/* ---------- 1. 加载旧数据 ---------- */
function loadOld() {
  const files = ['lessons-1.js', 'lessons-2.js', 'lessons-3.js', 'lessons-4.js', 'lessons-5.js', 'lessons-predict.js',
    'lessons-6.js', 'lessons-6-escape.js', 'lessons-6-a11y.js', 'lessons-6-profiling.js',
    'lessons-6-ex-router.js', 'lessons-6-ex-query.js', 'lessons-6-ex-testing.js', 'lessons-6-ex-nextjs.js',
    ...fs.readdirSync(SRC).filter((f) => f.startsWith('lessons-7-') && f.endsWith('.js')).sort(),
    'lessons-6-checks.js', 'lessons-6-order.js', 'glossary.js'];
  const js = files.filter((f) => fs.existsSync(path.join(SRC, f))).map((f) => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
  return vm.runInNewContext(js + '\n;({ LESSONS, LESSON_ORDER, STAGE_OF, GLOSSARY })', { console }, { filename: 'old-src' });
}

/* ---------- 2. 输出 JS 值（保留函数源码） ---------- */
const isIdent = (k) => /^[A-Za-z_$][\w$]*$/.test(k);
function jsStr(s) {
  if (s.includes('\n') && !s.includes('\r') && !/[\u2028\u2029]/.test(s)) return '`' + s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
  if (/[\r\u2028\u2029]/.test(s)) return JSON.stringify(s);
  return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}
function toJS(v, ind = '') {
  const next = ind + '  ';
  if (typeof v === 'string') return jsStr(v);
  if (typeof v === 'function') {
    const src = v.toString();
    // 对象方法简写 test(t) { … } 在 `key: ` 后面不合法，转成 function 表达式
    return /^(async\s+)?(function\b|\(|[\w$]+\s*=>)/.test(src) || /^async\s+[\w$]+\s*=>/.test(src) ? src : src.replace(/^(async\s+)?([\w$]+)\s*\(/, (m, a, n) => (a || '') + 'function (');
  }
  if (v === null || typeof v !== 'object') return String(v);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    const items = v.map((x) => toJS(x, next));
    const flat = '[' + items.join(', ') + ']';
    if (v.every((x) => typeof x !== 'object' && typeof x !== 'function') && flat.length < 90 && !flat.includes('\n')) return flat;
    return '[\n' + items.map((x) => next + x).join(',\n') + ',\n' + ind + ']';
  }
  const entries = Object.entries(v).filter(([, x]) => x !== undefined);
  if (!entries.length) return '{}';
  return '{\n' + entries.map(([k, x]) => next + (isIdent(k) ? k : jsStr(k)) + ': ' + toJS(x, next)).join(',\n') + ',\n' + ind + '}';
}

/* ---------- 3. HTML 片段 → Markdown ---------- */
class Fallback extends Error {}
const ENT = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', times: '×', rarr: '→', larr: '←', middot: '·', laquo: '«', raquo: '»', copy: '©' };
const decode = (s) => s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1));
  if (e in ENT) return ENT[e];
  throw new Fallback('未知实体 ' + m);
});
const VOID = new Set(['br', 'img', 'hr', 'input']);
function parseHtml(html) {
  const root = { children: [] }; const stack = [root];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^'">])*?)(\/?)>/g;
  let last = 0, m;
  const top = () => stack[stack.length - 1];
  while ((m = re.exec(html))) {
    if (m.index > last) top().children.push({ text: html.slice(last, m.index) });
    last = re.lastIndex;
    if (m[0].startsWith('<!--')) continue;
    const [, close, name0, attrs, selfClose] = m; const name = name0.toLowerCase();
    if (close) {
      if (top().tag !== name) throw new Fallback('标签不配对 ' + name);
      stack.pop();
    } else {
      const node = { tag: name, attrs: attrs.trim(), children: [] };
      top().children.push(node);
      if (!VOID.has(name) && !selfClose) stack.push(node);
    }
  }
  if (last < html.length) top().children.push({ text: html.slice(last) });
  if (stack.length !== 1) throw new Fallback('标签未闭合');
  return root.children;
}
const plainOf = (nodes) => nodes.map((n) => (n.text !== undefined ? decode(n.text) : n.tag === 'br' ? ' ' : plainOf(n.children))).join('');
const escText = (s) => s.replace(/[\\`*_{}[\]<>#|~&]/g, (c) => '\\' + c);
const SIMPLE_JSX = new Set(['kbd', 'small', 'sub', 'sup', 'mark', 'u', 's', 'del']);

// 课号：#id → 站内路径
let KNOWN = new Set();
function hrefOf(h) {
  if (/^https?:\/\//.test(h)) return h;
  if (h === '#' || h === '') return '/';
  if (!h.startsWith('#')) throw new Fallback('未知链接 ' + h);
  const id = decodeURIComponent(h.slice(1));
  if (KNOWN.has(id)) return '/lessons/' + id;
  if (id === 'glossary' || id === 'review') return '/' + id;
  const c = id.match(/^check-(\d)$/);
  if (c) return '/check/' + c[1];
  throw new Fallback('未知锚点 ' + h);
}
function render(nodes, o) {
  return nodes.map((n) => {
    if (n.text !== undefined) return escText(decode(n.text).replace(/\s*\n\s*/g, ' '));
    const inner = () => render(n.children, o);
    switch (n.tag) {
      case 'code': {
        if (n.attrs) throw new Fallback('code 带属性');
        if (n.children.some((c) => c.text === undefined)) throw new Fallback('code 里有标签');
        let t = plainOf(n.children).replace(/\s*\n\s*/g, ' ');
        if (!t) throw new Fallback('空 code');
        if (o.table) t = t.replace(/\|/g, '\\|');
        const ticks = '`'.repeat(Math.max(0, ...[...t.matchAll(/`+/g)].map((x) => x[0].length)) + 1);
        return ticks + (/^`|`$|^ .* $/.test(t) ? ' ' + t + ' ' : t) + ticks;
      }
      case 'b': case 'strong': case 'em': case 'i': {
        if (n.attrs) throw new Fallback(n.tag + ' 带属性');
        const s = inner(); const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], core = s.trim();
        if (!core) return s;
        const strong = n.tag === 'b' || n.tag === 'strong';
        if (o.jsx) return lead + `<${strong ? 'strong' : 'em'}>` + core + `</${strong ? 'strong' : 'em'}>` + trail;
        const mark = strong ? '**' : '*';
        return lead + mark + core + mark + trail;
      }
      case 'a': {
        const hm = n.attrs.match(/^href="([^"]*)"$/);
        if (!hm) throw new Fallback('a 属性复杂');
        return '[' + inner() + '](' + hrefOf(hm[1]) + ')';
      }
      case 'br': return '<br />';
      default:
        if (SIMPLE_JSX.has(n.tag) && !n.attrs) return `<${n.tag}>` + inner() + `</${n.tag}>`;
        throw new Fallback('不支持的标签 ' + n.tag);
    }
  }).join('');
}
const lineStart = (s) => s.replace(/^(\s*)(\d+[.)]|[-+])(?=\s|$)/, '$1\\$2').replace(/^(\s*)(:::)/, '$1\\$2');

// 校验：把生成的 Markdown 用 remark 解析回来，纯文本必须和原 HTML 的纯文本一致（忽略空白）。
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMdx);
const squash = (s) => s.replace(/[\s ]+/g, '');
function textOfMd(md) { return toString(parser.parse(md)); }
function checked(md, expectedPlain) {
  let got;
  try { got = textOfMd(md); } catch (e) { throw new Fallback('Markdown 解析失败：' + e.message.split('\n')[0]); }
  if (squash(got) !== squash(expectedPlain)) throw new Fallback('文字不一致');
  return md;
}
// 行内 HTML → Markdown 行内文本；失败返回 null
function inlineMd(html, { table = false, expectedPlain } = {}) {
  try {
    const nodes = parseHtml(html);
    const plain = expectedPlain ?? plainOf(nodes);
    for (const jsx of [false, true]) {
      try {
        const md = lineStart(render(nodes, { table, jsx }));
        checked(md, plain);
        return md;
      } catch (e) { if (!(e instanceof Fallback) || jsx) throw e; }
    }
  } catch (e) { if (e instanceof Fallback) { stats.fallbacks.push(e.message + '：' + html.slice(0, 50)); return null; } throw e; }
  return null;
}

/* ---------- 4. 课文块 → MDX ---------- */
const stats = { fallbacks: [] };
const rawHtml = (html) => html.replace(/href="#([^"]*)"/g, (m, id) => { try { return 'href="' + hrefOf('#' + id) + '"'; } catch (e) { return m; } });
const rawEl = (html, { tag = 'div', className } = {}) =>
  `<Raw${tag !== 'div' ? ` tag=${JSON.stringify(tag)}` : ''}${className ? ` className=${JSON.stringify(className)}` : ''} html={${JSON.stringify(rawHtml(html))}} />`;
function fence(src, lang, meta) {
  const n = Math.max(2, ...[...src.matchAll(/`{3,}/g)].map((m) => m[0].length)) + 1;
  const f = '`'.repeat(n);
  return `${f}${lang}${meta ? ' ' + meta : ''}\n${src}\n${f}`;
}
function quoted(name, v) {
  const q = ['"', "'", '`'].find((c) => !v.includes(c));
  if (!q || /[\n]/.test(v)) throw new Error('标题里引号太多，无法写进代码块标记：' + v);
  return `${name}=${q}${v}${q}`;
}
const headText = (t) => lineStart(escText(t));

function convertLesson(L) {
  const plays = {}; const out = []; let playNo = 0; let inDetails = false;
  const closeDetails = () => { if (inDetails) { out.push('</details>'); inDetails = false; } };
  for (const b of L.body) {
    switch (b.t) {
      case 'h': {
        closeDetails();
        if (/（选读）/.test(b.text)) {
          out.push(`<details className="optional">\n<summary><span className="opt-tag">选读</span>${escText(b.text.replace(/（选读）/, ''))}<small>可以先跳过，需要时再展开</small></summary>`);
          inDetails = true;
        } else out.push('## ' + headText(b.text));
        break;
      }
      case 'p': {
        if (/^\s*<(ol|ul|div|table|figure)\b/.test(b.html)) { out.push(rawEl(b.html, { className: 'p-block' })); break; }
        const md = inlineMd(b.html);
        // <p> 里不能放块级元素：浏览器解析服务端 HTML 时会提前关掉 <p>，造成水合不一致，所以含块级标签时用 div
        out.push(md ?? rawEl(b.html, { tag: /<(ol|ul|div|table|figure|p|pre)\b/i.test(b.html) ? 'div' : 'p' }));
        break;
      }
      case 'ul': {
        const items = b.items.map((i) => inlineMd(i));
        out.push(items.every((x) => x !== null) ? items.map((x) => '- ' + x).join('\n') : rawEl('<ul>' + b.items.map((i) => '<li>' + i + '</li>').join('') + '</ul>'));
        break;
      }
      case 'call': {
        const md = inlineMd(b.html);
        out.push(`<CallBox kind="${b.kind}" label="${b.label}">\n\n${md ?? rawEl(b.html, { tag: 'span' })}\n\n</CallBox>`);
        break;
      }
      case 'code': out.push(fence(b.src, 'jsx', b.cap ? quoted('title', b.cap) : '')); break;
      case 'play': {
        playNo++;
        const key = b.title !== undefined && !(b.title in plays) ? b.title : '#' + playNo;
        const meta = ['play'];
        if (b.title !== undefined) meta.push(quoted('title', b.title));
        if (key !== b.title) meta.push(quoted('key', key));
        out.push(fence(b.src, 'jsx', meta.join(' ')));
        plays[key] = { note: b.note, predict: b.predict, pkey: b.pkey };
        break;
      }
      case 'table': {
        const head = b.head.map((c) => inlineMd(c, { table: true }));
        const rows = b.rows.map((r) => r.map((c) => inlineMd(c, { table: true })));
        if (head.every((x) => x !== null) && rows.every((r) => r.every((x) => x !== null))) {
          out.push('| ' + head.join(' | ') + ' |\n|' + head.map(() => '---').join('|') + '|\n' + rows.map((r) => '| ' + r.join(' | ') + ' |').join('\n'));
        } else {
          out.push(rawEl('<table><thead><tr>' + b.head.map((x) => '<th>' + x + '</th>').join('') + '</tr></thead><tbody>' + b.rows.map((r) => '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>', { className: 'tbl wide' }));
        }
        break;
      }
      case 'fig': out.push(rawEl(b.html + (b.cap ? '<figcaption>' + b.cap + '</figcaption>' : ''), { tag: 'figure', className: 'fig wide' })); break;
      default: throw new Error('未知块类型 ' + b.t);
    }
  }
  closeDetails();
  for (const k of Object.keys(plays)) { const p = plays[k]; if (!p.predict) { delete p.predict; delete p.pkey; } }
  const parts = [
    `---\ntitle: ${JSON.stringify(L.title)}\n---`,
    '# ' + headText(L.title),
    '<LessonHeader />',
    '<Warmup />',
    '<LessonGoals />',
    '<LessonProse>\n\n' + out.join('\n\n') + '\n\n</LessonProse>',
  ];
  if (L.quiz && L.quiz.length) parts.push('<Quiz />');
  if (L.exercise) parts.push('<Exercise />');
  parts.push('<SelfExplain />', '<LessonFooter />');
  return { mdx: parts.join('\n\n') + '\n', plays };
}

/* ---------- 5. 写文件 ---------- */
function dataFile(L, plays) {
  const o = {};
  for (const k of ['id', 'stage', 'title', 'mins', 'summary', 'goals', 'keyPoints', 'quiz', 'exercise', 'checkOnly']) if (L[k] !== undefined) o[k] = L[k];
  o.plays = plays;
  return HEADER + '// 非正文数据。课文在 docs/lessons/' + L.id + '.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。\n'
    + 'export default ' + toJS(o) + ';\n';
}
const strip = (v) => JSON.stringify(v, (k, x) => (typeof x === 'function' ? x.toString() : x));

async function main() {
  const args = process.argv.slice(2);
  const forceMeta = args.includes('--meta');
  const ids = args.filter((a) => !a.startsWith('--'));
  const old = loadOld();
  KNOWN = new Set(old.LESSON_ORDER);
  const all = old.LESSONS;
  for (const id of ids) if (!all.some((l) => l.id === id)) throw new Error('找不到课：' + id);
  const targets = all.filter((l) => !ids.length || ids.includes(l.id));
  fs.mkdirSync(DOCS_LESSONS, { recursive: true }); fs.mkdirSync(COURSE_LESSONS, { recursive: true });

  const failures = [];
  for (const L of targets) {
    const before = stats.fallbacks.length;
    const { mdx, plays } = convertLesson(L);
    const mdxPath = path.join(DOCS_LESSONS, L.id + '.mdx');
    fs.writeFileSync(mdxPath, mdx);
    const dataPath = path.join(COURSE_LESSONS, L.id + '.js');
    fs.writeFileSync(dataPath, dataFile(L, plays));
    // 验证 1：MDX 能编译
    try { await compile(mdx, { remarkPlugins: [remarkGfm, remarkPlay], format: 'mdx' }); } catch (e) { failures.push(`${L.id}: MDX 编译失败：${e.message.split('\n')[0]}`); }
    // 验证 2：数据文件能加载，且和旧数据一致
    try {
      const mod = (await import(pathToFileURL(dataPath).href + '?t=' + Date.now())).default;
      const want = { ...L }; delete want.body;
      for (const k of Object.keys(want)) if (strip(want[k]) !== strip(mod[k])) failures.push(`${L.id}: 数据字段 ${k} 与旧数据不一致`);
    } catch (e) { failures.push(`${L.id}: 数据文件加载失败：${e.message}`); }
    console.log(`${L.id}: ${L.body.length} 块，${Object.keys(plays).length} 个示例，${stats.fallbacks.length - before} 处退回 <Raw>`);
  }

  // 按目录里已有的课生成注册表和侧栏
  const have = new Set(fs.readdirSync(COURSE_LESSONS).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3)));
  const haveMdx = new Set(fs.readdirSync(DOCS_LESSONS).filter((f) => f.endsWith('.mdx')).map((f) => f.slice(0, -4)));
  const present = old.LESSON_ORDER.filter((id) => have.has(id) && haveMdx.has(id));
  const camel = (id) => 'l_' + id.replace(/[^\w]/g, '_');
  fs.writeFileSync(path.join(COURSE, 'registry.js'), HEADER + '// 汇总全部已转换的课。引擎的热身、复习、阶段测验要跨课取题，都从这里拿。\n'
    + "import { LESSON_ORDER } from './order.js';\n"
    + present.map((id) => `import ${camel(id)} from './lessons/${id}.js';`).join('\n') + '\n\n'
    + 'const ALL = [' + present.map(camel).join(', ') + '];\n'
    + '// 按课程顺序排列。课号 = 在 LESSON_ORDER 里的位置（不是在 LESSONS 里的位置：未转换的课不在这里）\n'
    + "export const LESSONS = ALL.sort((a, b) => LESSON_ORDER.indexOf(a.id) - LESSON_ORDER.indexOf(b.id));\n"
    + "export const lessonNo = (id) => LESSON_ORDER.indexOf(id) + 1;\n"
    + "export const TOTAL_LESSONS = LESSON_ORDER.length;\n"
    + "export const lessonById = (id) => LESSONS.find((l) => l.id === id);\n");
  const stagesSrc = fs.readFileSync(path.join(COURSE, 'stages.js'), 'utf8');
  const stageNames = [...stagesSrc.matchAll(/no: '(\d+)', name: '([^']+)'/g)].map((m) => m[1] + ' ' + m[2]);
  const byId = new Map(all.map((l) => [l.id, l]));
  const meta = []; let cur = -1;
  for (const id of present) {
    const st = byId.get(id)?.stage ?? JSON.parse(strip(await import(pathToFileURL(path.join(COURSE_LESSONS, id + '.js')).href + '?m=' + Date.now()).then((m) => m.default.stage)));
    if (st !== cur) { cur = st; meta.push({ type: 'section-header', label: stageNames[st] }); }
    const title = byId.get(id)?.title;
    meta.push({ type: 'file', name: id, label: title });
  }
  fs.writeFileSync(path.join(DOCS_LESSONS, '_meta.json'), JSON.stringify(meta, null, 2) + '\n');

  if (forceMeta || !fs.existsSync(path.join(COURSE, 'order.js'))) {
    fs.writeFileSync(path.join(COURSE, 'order.js'), HEADER + '// 课程顺序。课号 = 在 LESSON_ORDER 中的位置（从 1 开始）。\nexport const LESSON_ORDER = ' + toJS(old.LESSON_ORDER) + ';\n');
  }
  if (forceMeta || !fs.existsSync(path.join(COURSE, 'glossary.js'))) {
    fs.writeFileSync(path.join(COURSE, 'glossary.js'), HEADER + '// 术语表：课文里第一次出现的术语会自动加注（引擎 markTerms）。\nexport const GLOSSARY = ' + toJS(old.GLOSSARY) + ';\n');
  }

  if (stats.fallbacks.length) { console.log('\n退回 <Raw> 的块（HTML 原样输出）：'); stats.fallbacks.forEach((f) => console.log('  - ' + f)); }
  if (failures.length) { console.error('\n失败：'); failures.forEach((f) => console.error('  ✗ ' + f)); process.exit(1); }
  console.log(`\n完成：转换 ${targets.length} 课，注册表里共 ${present.length} 课。`);
}
main().catch((e) => { console.error(e); process.exit(1); });
