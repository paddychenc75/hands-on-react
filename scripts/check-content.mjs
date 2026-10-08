// 内容校验：不需要浏览器和网络，几秒内跑完。失败时给出"文件:行 + 哪里不对 + 怎么修"。
//
//   npm run check:content                        检查全部
//   npm run check:content -- --verbose           另外列出没法自动判断的"第 N 课"引用，供人工看
//   npm run check:content -- --update            课末尾追加了新题后，把新卡片键写进快照（只追加）
//   npm run check:content -- --update --force    确认改的是错别字（题目换了个说法）时，允许改已有键的指纹
//
// 检查项：
//   1. 课程登记：docs/lessons/*.mdx、course/lessons/*.ts、course/order.ts 一一对应；课 id 唯一；stage 在 0–5 且同阶段连续；
//      course/lessons.generated.ts 是最新的；每个阶段有 docs/check/N.mdx。
//   2. 课文与数据：MDX 里 play 代码块的键在本课内唯一；数据 plays 的每个键都能在 MDX 里找到；pkey 写对；
//      MDX 的 <Quiz />、<Exercise /> 和数据里的 quiz、exercise 对得上；MDX 标题和数据 title 一致。
//   3. 题目：每道 quiz / checkOnly / predict 题的 options ≥ 2、answer 是合法下标、explain 非空；有 exercise 的课有 starter、solution、test。
//   4. 复习卡片键快照 course/card-keys.snapshot.json：已有的键不能消失、不能换位置（题目文字的指纹不变），只能在每课末尾追加。
//   5. 站内引用："第 N 课《标题》"的课号和标题要一致；"词（第 N 课）""第 N 课“词”"里的词要出现在第 N 课里；站内链接指向存在的课。
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { GENERATED, LESSON_DIR, ROOT, readGenerated, renderRegistry } from './lib/registry-gen.mjs';
import { parsePlayMeta } from '../plugins/remark-play.mjs';

const args = process.argv.slice(2);
const UPDATE = args.includes('--update');
const FORCE = args.includes('--force');
const VERBOSE = args.includes('--verbose');

const rel = p => path.relative(ROOT, p).split(path.sep).join('/');
const DOCS = path.join(ROOT, 'docs');
const SNAPSHOT = path.join(ROOT, 'course/card-keys.snapshot.json');

const errors = [];
/** 记一条错误：where 是"文件"或"文件:行" */
const fail = (where, msg, fix = '') => errors.push(`${where}  ${msg}${fix ? '\n    → ' + fix : ''}`);

const { LESSON_ORDER } = await import('../course/order.ts');
const { STAGES } = await import('../course/stages.ts');

// ---------- 读文件 ----------
const mdxFiles = fs
  .readdirSync(path.join(DOCS, 'lessons'))
  .filter(f => f.endsWith('.mdx'))
  .sort();
const dataFiles = fs
  .readdirSync(LESSON_DIR)
  .filter(f => f.endsWith('.ts'))
  .sort();
const mdxIds = mdxFiles.map(f => f.replace(/\.mdx$/, ''));
const dataIds = dataFiles.map(f => f.replace(/\.ts$/, ''));

/** @type {Record<string, any>} */
const lessons = {};
for (const id of dataIds) {
  try {
    lessons[id] = (await import(path.join(LESSON_DIR, id + '.ts'))).default;
  } catch (e) {
    fail(`course/lessons/${id}.ts`, '读不进来：' + e.message.split('\n')[0], '先运行 npm run typecheck 看语法和类型错误');
  }
}
const mdx = Object.fromEntries(mdxIds.map(id => [id, fs.readFileSync(path.join(DOCS, 'lessons', id + '.mdx'), 'utf8')]));

// ---------- 1. 课程登记 ----------
for (const id of mdxIds)
  if (!dataIds.includes(id)) fail(`docs/lessons/${id}.mdx`, '没有对应的数据文件', `新建 course/lessons/${id}.ts（或用 npm run new-lesson）`);
for (const id of dataIds) if (!mdxIds.includes(id)) fail(`course/lessons/${id}.ts`, '没有对应的课文', `新建 docs/lessons/${id}.mdx，或删掉这个数据文件`);
const seenOrder = new Set();
LESSON_ORDER.forEach(id => {
  if (seenOrder.has(id)) fail('course/order.ts', `课 "${id}" 在课程顺序里出现了两次`, '删掉重复的一行');
  seenOrder.add(id);
  if (!dataIds.includes(id)) fail('course/order.ts', `课程顺序里的 "${id}" 不存在：找不到 course/lessons/${id}.ts`, '删掉这一行，或补上课的文件');
});
for (const id of dataIds)
  if (!seenOrder.has(id)) fail(`course/lessons/${id}.ts`, '没有登记在课程顺序里（course/order.ts）', `在 course/order.ts 里加一行 '${id}',`);

const idsSeen = new Map();
for (const [file, l] of Object.entries(lessons)) {
  const where = `course/lessons/${file}.ts`;
  if (l.id !== file) fail(where, `数据里的 id 是 "${l.id}"，和文件名 "${file}" 不一致`, '让 id 与文件名相同');
  if (idsSeen.has(l.id)) fail(where, `课 id "${l.id}" 和 ${idsSeen.get(l.id)} 重复`, '课 id 必须唯一');
  idsSeen.set(l.id, where);
  if (!Number.isInteger(l.stage) || l.stage < 0 || l.stage >= STAGES.length)
    fail(where, `stage 是 ${JSON.stringify(l.stage)}，必须是 0–${STAGES.length - 1} 的整数`);
}
{
  let last = -1;
  for (const id of LESSON_ORDER) {
    const s = lessons[id]?.stage;
    if (s === undefined) continue;
    if (s < last) fail('course/order.ts', `"${id}" 属于阶段 ${s}，却排在阶段 ${last} 的课后面`, '同一阶段的课要连续排列，阶段从小到大');
    last = Math.max(last, s);
  }
}
for (let s = 0; s < STAGES.length; s++) if (!fs.existsSync(path.join(DOCS, 'check', s + '.mdx'))) fail(`docs/check/${s}.mdx`, `阶段 ${s} 没有阶段测验页`);
if (readGenerated() !== renderRegistry()) fail(rel(GENERATED), '不是最新的（course/lessons 里的文件变了）', '运行 npm run gen');

// ---------- 2. 课文与数据 ----------
/** 扫描 MDX 的围栏代码块，返回 play 块：{ key, title, line }。跳过代码块以外的内容 */
function scanPlays(text) {
  const out = [];
  let fence = null;
  text.split('\n').forEach((line, i) => {
    if (fence) {
      const close = line.match(/^\s*(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fence.ch && close[1].length >= fence.len) fence = null;
      return;
    }
    const open = line.match(/^\s*(`{3,}|~{3,})(\S*)\s*(.*)$/);
    if (!open) return;
    fence = { ch: open[1][0], len: open[1].length };
    const meta = parsePlayMeta(open[3]);
    if (meta) out.push({ key: meta.key ?? meta.title ?? '', title: meta.title, line: i + 1 });
  });
  return out;
}
/** 去掉代码块后的 MDX 正文（用来找组件标签和引用） */
function proseOf(text) {
  const kept = [];
  let fence = null;
  text.split('\n').forEach(line => {
    if (fence) {
      const close = line.match(/^\s*(`{3,}|~{3,})\s*$/);
      if (close && close[1][0] === fence.ch && close[1].length >= fence.len) fence = null;
      kept.push('');
      return;
    }
    const open = line.match(/^\s*(`{3,}|~{3,})/);
    // 开头的 ``` 行带着标题（title="…"），保留它：标题里也会引用别的课
    if (open) {
      fence = { ch: open[1][0], len: open[1].length };
      kept.push(line);
      return;
    }
    kept.push(line);
  });
  return kept;
}

const playsByLesson = {};
const pkeys = new Map();
for (const id of mdxIds) {
  const where = `docs/lessons/${id}.mdx`;
  const l = lessons[id];
  const plays = scanPlays(mdx[id]);
  playsByLesson[id] = plays;
  const seen = new Map();
  for (const p of plays) {
    if (seen.has(p.key)) {
      fail(
        `${where}:${p.line}`,
        `play 示例的键 "${p.key || '（无标题）'}" 和第 ${seen.get(p.key)} 行重复`,
        `改标题，或加 key="#序号"（序号从 1 起，按示例出现顺序），并同步改数据文件 plays 的键`,
      );
    }
    seen.set(p.key, p.line);
    if (!p.key) fail(`${where}:${p.line}`, 'play 示例没有 title 也没有 key', '给代码块加 title="…"');
  }
  if (!l) continue;
  const keys = new Set(plays.map(p => p.key));
  for (const [k, meta] of Object.entries(l.plays || {})) {
    if (!keys.has(k))
      fail(
        `course/lessons/${id}.ts`,
        `plays 里的 "${k}" 在 ${where} 里找不到同名的 play 示例${meta?.predict ? '（它带预测题，删掉示例会丢掉这道预测题和学习者的预测记录）' : ''}`,
        '恢复 MDX 里的示例，或同步改/删 plays 的键',
      );
    else if (meta?.predict) {
      // pkey 是学习者进度里 __pred 的键，一旦发布就不能改，所以允许它和现在的标题不同（示例改过名），但必须有、以"课id|"开头、全站唯一
      if (typeof meta.pkey !== 'string' || !meta.pkey.startsWith(`${id}|`))
        fail(
          `course/lessons/${id}.ts`,
          `plays["${k}"] 有预测题，但 pkey 是 ${JSON.stringify(meta.pkey)}，应以 "${id}|" 开头`,
          '写成 课id|示例标题；没有 pkey 的预测题记不住学习者的选择',
        );
      else if (pkeys.has(meta.pkey)) fail(`course/lessons/${id}.ts`, `pkey "${meta.pkey}" 和 ${pkeys.get(meta.pkey)} 重复`);
      else pkeys.set(meta.pkey, `course/lessons/${id}.ts`);
    }
  }

  // 标题、组件标签与数据对应
  const front = mdx[id].match(/^---\n([\s\S]*?)\n---/);
  const fmTitle =
    front &&
    front[1]
      .match(/^title:\s*(.*)$/m)?.[1]
      .trim()
      .replace(/^["']|["']$/g, '');
  if (fmTitle !== l.title) fail(`${where}:2`, `front matter 的 title 是 "${fmTitle}"，数据文件里是 "${l.title}"`, '两处写成一样');
  const h1 = mdx[id].match(/^# (.*)$/m)?.[1].trim();
  if (h1 !== l.title) fail(where, `一级标题是 "${h1}"，数据文件里是 "${l.title}"`, '两处写成一样');
  const prose = proseOf(mdx[id]).join('\n');
  const has = tag => new RegExp(`<${tag}\\s*/>`).test(prose);
  for (const tag of ['LessonHeader', 'Warmup', 'LessonGoals', 'SelfExplain', 'LessonFooter'])
    if (!has(tag)) fail(where, `缺少 <${tag} />`, '照 npm run new-lesson 生成的骨架补上');
  if (!/<LessonProse>/.test(prose) || !/<\/LessonProse>/.test(prose)) fail(where, '缺少 <LessonProse> … </LessonProse>');
  if (l.quiz?.length && !has('Quiz')) fail(where, '数据里有 quiz，但课文里没有 <Quiz />');
  if (!l.quiz?.length && has('Quiz')) fail(where, '课文里有 <Quiz />，但数据里没有 quiz');
  if (l.exercise && !has('Exercise')) fail(where, '数据里有 exercise，但课文里没有 <Exercise />');
  if (!l.exercise && has('Exercise')) fail(where, '课文里有 <Exercise />，但数据里没有 exercise');
}

// ---------- 3. 题目与练习 ----------
function checkQuestion(where, label, q) {
  if (!q || typeof q !== 'object') return fail(where, `${label} 不是一个题目对象`);
  if (typeof q.q !== 'string' || !q.q.trim()) fail(where, `${label} 的题干 q 是空的`);
  if (!Array.isArray(q.options) || q.options.length < 2)
    fail(where, `${label} 的 options 至少要 2 个，现在是 ${Array.isArray(q.options) ? q.options.length : '没有'}`);
  else {
    q.options.forEach((o, i) => {
      if (typeof o !== 'string' || !o.trim()) fail(where, `${label} 的 options[${i}] 是空的`);
    });
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length)
      fail(where, `${label} 的 answer 是 ${JSON.stringify(q.answer)}，必须是 0–${q.options.length - 1} 的整数（options 的下标）`);
  }
  if (typeof q.explain !== 'string' || !q.explain.trim()) fail(where, `${label} 的 explain 是空的`, '解析要说明为什么对，并点出最迷惑的错误项');
}
for (const [id, l] of Object.entries(lessons)) {
  const where = `course/lessons/${id}.ts`;
  (l.quiz || []).forEach((q, i) => checkQuestion(where, `quiz[${i}]`, q));
  (l.checkOnly || []).forEach((q, i) => checkQuestion(where, `checkOnly[${i}]`, q));
  for (const [k, meta] of Object.entries(l.plays || {})) if (meta?.predict) checkQuestion(where, `plays["${k}"].predict`, meta.predict);
  for (const f of ['title', 'summary']) if (typeof l[f] !== 'string' || !l[f].trim()) fail(where, `${f} 是空的`);
  if (l.runtime !== undefined && l.runtime !== 18 && l.runtime !== 19) fail(where, `runtime 是 ${JSON.stringify(l.runtime)}，只能是 18 或 19（不写就是 18）`);
  if (!Number.isInteger(l.mins) || l.mins <= 0) fail(where, `mins 是 ${JSON.stringify(l.mins)}，必须是正整数`);
  for (const f of ['goals', 'keyPoints']) if (!Array.isArray(l[f]) || !l[f].length) fail(where, `${f} 是空的`);
  if (l.exercise) {
    const ex = l.exercise;
    for (const f of ['task', 'starter', 'solution', 'hint', 'faded']) if (typeof ex[f] !== 'string' || !ex[f].trim()) fail(where, `exercise.${f} 缺失或为空`);
    if (typeof ex.test !== 'function') fail(where, 'exercise.test 缺失，必须是 async (t) => { … }');
    if (ex.exports !== undefined && !Array.isArray(ex.exports)) fail(where, 'exercise.exports 必须是名字数组');
  }
}

// ---------- 4. 卡片键快照 ----------
// 复习卡片键：随堂测验是 `课id#N`，阶段测验读代码题是 `课id#cN`。学习者的复习记录按这些键存，所以
// 已有的键不能消失、不能换位置。指纹 = 题干文字的哈希：调换两道题的顺序或换掉一道题，指纹就对不上。
const fingerprint = q => createHash('sha1').update(String(q.q).trim()).digest('hex').slice(0, 8);
const currentCards = {};
for (const id of LESSON_ORDER) {
  const l = lessons[id];
  if (!l) continue;
  (l.quiz || []).forEach((q, i) => {
    currentCards[`${id}#${i}`] = fingerprint(q);
  });
  (l.checkOnly || []).forEach((q, i) => {
    currentCards[`${id}#c${i}`] = fingerprint(q);
  });
}
const currentPred = [];
for (const id of LESSON_ORDER) for (const [k, m] of Object.entries(lessons[id]?.plays || {})) if (m?.predict) currentPred.push(m.pkey ?? `${id}|${k}`);

const readSnapshot = () => (fs.existsSync(SNAPSHOT) ? JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8')) : null);
const writeSnapshot = (cards, predictions) => {
  const body = {
    说明: '复习卡片键快照，由 npm run check:content -- --update 生成，不要手改。键 = 课id#N（随堂测验第 N 题）或 课id#cN（阶段测验读代码题）；值 = 题干文字的指纹。已有的键不能消失、不能换位置，新题只能追加在每课 quiz / checkOnly 的末尾。predictions 是预测题的键（进度里 __pred 用），不能消失。',
    cards,
    predictions,
  };
  fs.writeFileSync(SNAPSHOT, JSON.stringify(body, null, 2) + '\n');
};

const snap = readSnapshot();
if (!snap) {
  if (UPDATE) {
    writeSnapshot(currentCards, currentPred);
    console.log(`已生成快照 ${rel(SNAPSHOT)}（${Object.keys(currentCards).length} 个卡片键，${currentPred.length} 个预测键）`);
  } else fail(rel(SNAPSHOT), '快照文件不存在', '运行 npm run check:content -- --update 生成，并提交它');
} else {
  const snapProblems = [];
  const tail = kind => (kind === 'c' ? 'checkOnly' : 'quiz');
  for (const [key, fp] of Object.entries(snap.cards)) {
    const [, qi] = key.split('#');
    const field = tail(qi[0]);
    if (!(key in currentCards)) {
      snapProblems.push(`${key} 消失了（${id} 的 ${field} 里没有这一题了）。学习者记录里的这张卡片会对不上。恢复这道题，不要删中间的题；要停用就留在原位。`);
    } else if (currentCards[key] !== fp) {
      const movedFrom = Object.entries(snap.cards).find(([k2, f2]) => k2 !== key && f2 === currentCards[key])?.[0];
      if (movedFrom) {
        snapProblems.push(`${key} 现在放的是原来 ${movedFrom} 的题：题的顺序被调换或移动了。把它们放回原来的位置；新题只能追加到 ${field} 的末尾。`);
        continue;
      }
      snapProblems.push(
        `${key} 的题干变了（指纹 ${fp} → ${currentCards[key]}）。是不是调换了顺序或换了题？${field} 的顺序不能动，新题追加到末尾。如果只是改错别字，运行 npm run check:content -- --update --force。`,
      );
    }
  }
  for (const p of snap.predictions || [])
    if (!currentPred.includes(p)) snapProblems.push(`预测题 ${p} 消失了：play 示例被删了或标题改了。学习者的预测记录会对不上。`);
  const added = Object.keys(currentCards).filter(k => !(k in snap.cards));
  const addedPred = currentPred.filter(p => !(snap.predictions || []).includes(p));
  if (UPDATE) {
    if (snapProblems.length && !FORCE) {
      for (const p of snapProblems) fail(rel(SNAPSHOT), p);
      fail(rel(SNAPSHOT), '--update 只追加新键；上面是对已有键的改动，没有写入', '确认是错别字修改后，加 --force');
    } else {
      const cards = FORCE ? currentCards : { ...snap.cards, ...Object.fromEntries(added.map(k => [k, currentCards[k]])) };
      const predictions = FORCE ? currentPred : [...(snap.predictions || []), ...addedPred];
      const ordered = Object.fromEntries(
        Object.keys(currentCards)
          .filter(k => k in cards)
          .map(k => [k, cards[k]]),
      );
      writeSnapshot(ordered, predictions);
      console.log(`快照已更新：新增 ${added.length} 个卡片键、${addedPred.length} 个预测键${FORCE ? '（--force：已有键的改动也已写入）' : ''}`);
    }
  } else {
    for (const p of snapProblems) fail(rel(SNAPSHOT), p);
    if (added.length || addedPred.length) {
      fail(
        rel(SNAPSHOT),
        `有 ${added.length + addedPred.length} 个新键还没记进快照：${[...added, ...addedPred].slice(0, 6).join('、')}${added.length + addedPred.length > 6 ? ' 等' : ''}`,
        '确认新题都追加在末尾后，运行 npm run check:content -- --update，并提交快照',
      );
    }
  }
}

// ---------- 5. 站内引用 ----------
const titleOf = no => lessons[LESSON_ORDER[no - 1]]?.title;
/** 课 id → 这一课的全部文字（课文 + 数据里的字符串），用来核对"词（第 N 课）" */
const textOf = {};
const strings = (v, out = []) => {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach(x => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach(x => strings(x, out));
  return out;
};
for (const id of LESSON_ORDER) {
  const l = lessons[id];
  textOf[id] = ((mdx[id] || '') + '\n' + (l ? strings({ ...l, exercise: l.exercise && { ...l.exercise, test: undefined } }).join('\n') : '')).toLowerCase();
}
const normTitle = s => s.replace(/[\s“”"'‘’「」『』《》：:，,。！!？?（）()·\-—]/g, '').toLowerCase();

/** 每个文件的"行"：课文去掉代码块，数据文件只看带中文引号文字的行（照原样扫整个文件） */
const sources = [
  ...mdxIds.map(id => ({ file: `docs/lessons/${id}.mdx`, lines: proseOf(mdx[id]) })),
  ...dataIds.map(id => ({ file: `course/lessons/${id}.ts`, lines: fs.readFileSync(path.join(LESSON_DIR, id + '.ts'), 'utf8').split('\n') })),
];
const refNotes = [];
let refCount = 0;
for (const { file, lines } of sources) {
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/第\s*(\d+)\s*课/g)) {
      refCount++;
      const no = +m[1];
      const where = `${file}:${i + 1}`;
      const here = line.slice(m.index);
      const id = LESSON_ORDER[no - 1];
      if (!id) {
        fail(where, `引用了第 ${no} 课，但课程只有 ${LESSON_ORDER.length} 课`);
        continue;
      }
      const title = titleOf(no);
      // 模式 A：第 N 课《标题》—— 课号和标题必须一致
      const titled = here.match(/^第\s*\d+\s*课\s*《([^》]+)》/);
      if (titled) {
        const ok = normTitle(title).includes(normTitle(titled[1])) || normTitle(titled[1]).includes(normTitle(title));
        if (!ok)
          fail(
            where,
            `写的是"第 ${no} 课《${titled[1]}》"，但第 ${no} 课的标题是《${title}》`,
            `按 course/order.ts 的顺序，《${titled[1]}》是第 ${LESSON_ORDER.findIndex(x => normTitle(titleOf(LESSON_ORDER.indexOf(x) + 1)).includes(normTitle(titled[1]))) + 1} 课（如果有）；改课号或标题`,
          );
        continue;
      }
      // 模式 B：第 N 课“词”/第 N 课的“词” —— 这个词要出现在第 N 课里
      const quoted = here.match(/^第\s*\d+\s*课(?:的)?[“"]([^”"]{2,20})[”"]/);
      if (quoted) {
        if (textOf[id].includes(quoted[1].toLowerCase())) continue;
        fail(
          where,
          `写的是"第 ${no} 课${/^第\s*\d+\s*课的/.test(here) ? '的' : ''}“${quoted[1]}”"，但第 ${no} 课《${title}》里找不到“${quoted[1]}”`,
          '核对课号（加课后课号会顺延）',
        );
        continue;
      }
      // 模式 C：词（第 N 课）—— 括号前面的词要出现在第 N 课里
      const before = line.slice(0, m.index);
      const parened = before.match(/([A-Za-z][A-Za-z0-9.]*|[一-龥]{2,8})[（(]$/);
      if (parened) {
        if (textOf[id].includes(parened[1].toLowerCase())) continue;
        refNotes.push({ where, no, title, why: `括号前的“${parened[1]}”没在第 ${no} 课里找到，可能是同义说法` });
        continue;
      }
      refNotes.push({ where, no, title, why: '没法自动判断' });
    }
  });
}
// 模式 C 没找到词的、和没法判断的，不报错，只在 --verbose 时列出

// ---------- 站内链接 ----------
const LINK = /\]\((\/[^)\s#?]*)|href="(\/[^"#?]*)"/g;
for (const { file, lines } of sources) {
  const raw = file.endsWith('.mdx') ? mdx[path.basename(file, '.mdx')].split('\n') : lines;
  raw.forEach((line, i) => {
    for (const m of line.matchAll(LINK)) {
      const p = m[1] || m[2];
      const lesson = p.match(/^\/lessons\/([^/]+)$/);
      const check = p.match(/^\/check\/(\d+)$/);
      if (lesson && !lessons[lesson[1]]) fail(`${file}:${i + 1}`, `链接 ${p} 指向不存在的课`, '检查课 id（docs/lessons 里的文件名）');
      else if (check && +check[1] >= STAGES.length) fail(`${file}:${i + 1}`, `链接 ${p} 指向不存在的阶段测验`);
    }
  });
}
// 说明：Rspress 构建（markdown.link.checkDeadLinks）也会查 MDX 里的死链接；这里补查了数据文件和 <Raw html> 里构建查不到的链接。

// ---------- 占位提示（不算错误） ----------
const TODO = '【待写】';
const todos = LESSON_ORDER.map(id => [id, (textOf[id].match(new RegExp(TODO, 'g')) || []).length]).filter(([, n]) => n);

// ---------- 输出 ----------
if (VERBOSE) {
  console.log(`\n"第 N 课"引用共 ${refCount} 处，下面 ${refNotes.length} 处没法自动核对课号，请人工看一眼：`);
  for (const n of refNotes) console.log(`  ${n.where}  第 ${n.no} 课《${n.title}》  ${n.why}`);
  console.log('');
}
if (errors.length) {
  console.error(`check:content 发现 ${errors.length} 个问题：\n`);
  for (const e of errors) console.error('✗ ' + e + '\n');
  process.exit(1);
}
if (todos.length) console.log(`提示：这些课还有【待写】占位，发布前要换成真内容：${todos.map(([id, n]) => `${id}（${n} 处）`).join('、')}`);
if (!UPDATE)
  console.log(
    `check:content 通过：${LESSON_ORDER.length} 课、${Object.keys(currentCards).length} 个复习卡片键、${refCount} 处"第 N 课"引用${VERBOSE ? '' : '（--verbose 可列出没法自动核对的引用）'}`,
  );
