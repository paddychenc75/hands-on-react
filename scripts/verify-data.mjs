#!/usr/bin/env node
// 一次性核对：旧数据（src/*.js）和新数据（docs/lessons/*.mdx + course/lessons/*.js）是否一致。迁移完成后删除。
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const files = ['lessons-1.js', 'lessons-2.js', 'lessons-3.js', 'lessons-4.js', 'lessons-5.js', 'lessons-predict.js',
  'lessons-6.js', 'lessons-6-escape.js', 'lessons-6-a11y.js', 'lessons-6-profiling.js',
  'lessons-6-ex-router.js', 'lessons-6-ex-query.js', 'lessons-6-ex-testing.js', 'lessons-6-ex-nextjs.js',
  ...fs.readdirSync(SRC).filter((f) => f.startsWith('lessons-7-') && f.endsWith('.js')).sort(),
  'lessons-6-checks.js', 'lessons-6-order.js', 'glossary.js'];
const js = files.filter((f) => fs.existsSync(path.join(SRC, f))).map((f) => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
const old = vm.runInNewContext(js + '\n;({ LESSONS, LESSON_ORDER, STAGE_OF, GLOSSARY })', { console });

const ENT = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', times: '×', rarr: '→', larr: '←', middot: '·', laquo: '«', raquo: '»', copy: '©' };
const dec = (s) => s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e] ?? m));
const plain = (html) => dec(html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, ''));
const sq = (s) => s.replace(/[\s ]+/g, '');

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMdx);
const attrVal = (n, name) => { const a = (n.attributes || []).find((x) => x.name === name); if (!a) return undefined; return typeof a.value === 'string' || a.value == null ? a.value : JSON.parse(a.value.value); };

function newSide(mdx) {
  const tree = parser.parse(mdx);
  const c = { h: 0, play: 0, code: 0, table: 0, fig: 0, list: 0, call: {} };
  const codes = []; const plays = []; let text = '';
  const walk = (n) => {
    switch (n.type) {
      case 'heading': if (n.depth === 2) { c.h++; text += txt(n); } return;
      case 'code': if (/(^|\s)play(\s|$)/.test(n.meta || '')) { c.play++; plays.push({ src: n.value, meta: n.meta }); } else { c.code++; codes.push({ src: n.value, meta: n.meta }); } return;
      case 'table': c.table++; text += txt(n); return;
      case 'list': c.list++; break;
      case 'mdxJsxFlowElement': {
        if (n.name === 'Playground') { c.play++; plays.push({ src: attrVal(n, 'code'), title: attrVal(n, 'title'), key: attrVal(n, 'playKey') }); return; }
        if (n.name === 'Raw') {
          const tag = attrVal(n, 'tag'); const cls = attrVal(n, 'className') || '';
          const html = attrVal(n, 'html') || '';
          if (tag === 'figure') c.fig++; else if (/tbl/.test(cls)) c.table++;
          text += plain(html); return;
        }
        if (n.name === 'CallBox') { const k = attrVal(n, 'kind'); c.call[k] = (c.call[k] || 0) + 1; }
        if (n.name === 'details') {
          c.h++;
          const sum = n.children[0];
          text += txt(sum).replace('选读', '').replace('可以先跳过，需要时再展开', '');
          n.children.filter((x) => x !== sum).forEach(walk); return;
        }
        break;
      }
      case 'text': case 'inlineCode': text += n.value; return;
      case 'mdxJsxTextElement': break;
    }
    (n.children || []).forEach(walk);
  };
  const txt = (n) => { let s = ''; const w = (x) => { if (x.value !== undefined && x.type !== 'mdxjsEsm') s += x.value; (x.children || []).forEach(w); }; w(n); return s; };
  // 只统计 <LessonProse> 里的内容
  const prose = tree.children.find((x) => x.type === 'mdxJsxFlowElement' && x.name === 'LessonProse');
  if (!prose) throw new Error('没有 LessonProse');
  prose.children.forEach(walk);
  return { c, codes, plays, text };
}

function oldSide(L) {
  const c = { h: 0, play: 0, code: 0, table: 0, fig: 0, list: 0, call: {} };
  const codes = []; const plays = []; let text = '';
  for (const b of L.body) {
    switch (b.t) {
      case 'h': c.h++; text += b.text.replace('（选读）', ''); break;
      case 'p': {
        text += plain(b.html);
        const tbl = /^\s*<table\b/.test(b.html); if (tbl) c.table++;
        break;
      }
      case 'ul': text += b.items.map(plain).join(''); break;
      case 'call': c.call[b.kind] = (c.call[b.kind] || 0) + 1; text += plain(b.html); break;
      case 'code': c.code++; codes.push({ src: b.src, cap: b.cap }); break;
      case 'play': c.play++; plays.push(b); break;
      case 'table': c.table++; text += b.head.map(plain).join('') + b.rows.flat().map(plain).join(''); break;
      case 'fig': c.fig++; text += plain(b.html) + (b.cap ? plain(b.cap) : ''); break;
    }
  }
  return { c, codes, plays, text };
}

const norm = (v) => JSON.stringify(v, (k, x) => (typeof x === 'function' ? x.toString() : x));
const problems = [];
const bad = (id, msg) => { problems.push(id + ': ' + msg); };
const order = (await import(pathToFileURL(path.join(ROOT, 'course/order.js')).href)).LESSON_ORDER;
if (norm(order) !== norm(old.LESSON_ORDER)) bad('*', 'LESSON_ORDER 不一致');
if (order.length !== 45) bad('*', '课数不是 45：' + order.length);
const gl = (await import(pathToFileURL(path.join(ROOT, 'course/glossary.js')).href)).GLOSSARY;
if (norm(gl) !== norm(old.GLOSSARY)) bad('*', '术语表不一致');
const stages = (await import(pathToFileURL(path.join(ROOT, 'course/stages.js')).href)).STAGES;
if (stages.length !== 6 || stages[5].name !== '深入') bad('*', '阶段');

const tot = { lessons: 0, quiz: 0, checkOnly: 0, plays: 0, predict: 0, ex: 0 };
for (const L of old.LESSONS) {
  tot.lessons++;
  const mdx = fs.readFileSync(path.join(ROOT, 'docs/lessons', L.id + '.mdx'), 'utf8');
  const D = (await import(pathToFileURL(path.join(ROOT, 'course/lessons', L.id + '.js')).href)).default;
  const o = oldSide(L), n = newSide(mdx);
  if (order.indexOf(L.id) < 0) bad(L.id, '不在顺序里');
  if (old.STAGE_OF && old.STAGE_OF[L.id] !== undefined && old.STAGE_OF[L.id] !== D.stage) bad(L.id, '阶段不一致');
  if (L.stage !== D.stage) bad(L.id, 'stage');
  for (const k of ['h', 'play', 'code', 'table', 'fig']) if (o.c[k] !== n.c[k]) bad(L.id, `块数 ${k}：旧 ${o.c[k]} 新 ${n.c[k]}`);
  if (norm(o.c.call) !== norm(n.c.call)) bad(L.id, 'call 分布 ' + norm(o.c.call) + ' vs ' + norm(n.c.call));
  if (sq(o.text) !== sq(n.text)) {
    let i = 0; const a = sq(o.text), b = sq(n.text); while (i < a.length && a[i] === b[i]) i++;
    bad(L.id, `正文文字不一致，位置 ${i}：旧「${a.slice(i - 10, i + 30)}」新「${b.slice(i - 10, i + 30)}」`);
  }
  // 代码块逐字相等（顺序也要一致）
  if (o.codes.length === n.codes.length) o.codes.forEach((x, i) => { if (x.src !== n.codes[i].src) bad(L.id, `代码块 ${i} 内容不同`); if ((x.cap || '') !== ((n.codes[i].meta || '').match(/title=(["'`])(.*)\1/)?.[2] || '')) bad(L.id, `代码块 ${i} 标题不同`); });
  // play：源码、标题、说明、预测题
  o.plays.forEach((b, i) => {
    const m = n.plays[i];
    if (!m) return;
    if (b.src !== m.src) bad(L.id, `示例 ${i} 源码不同`);
    const meta = m.meta ? Object.fromEntries([...m.meta.matchAll(/(title|key)=(["'`])(.*?)\2/g)].map((x) => [x[1], x[3]])) : { title: m.title, key: m.key };
    if ((b.title ?? undefined) !== (meta.title ?? undefined)) bad(L.id, `示例 ${i} 标题不同`);
    const key = meta.key ?? meta.title ?? '';
    const d = D.plays[key];
    if (!d) { bad(L.id, `示例 ${i} 在 plays 里找不到键 ${key}`); return; }
    if (norm(d.note) !== norm(b.note)) bad(L.id, `示例 ${i} note 不同`);
    if (norm(d.predict) !== norm(b.predict)) bad(L.id, `示例 ${i} predict 不同`);
    if (b.predict) { tot.predict++; if (d.pkey !== b.pkey) bad(L.id, `示例 ${i} pkey 不同`); }
    tot.plays++;
  });
  if (Object.keys(D.plays).length !== o.plays.length) bad(L.id, 'plays 键数与示例数不同');
  // 测验、阶段测验题
  if (norm(L.quiz) !== norm(D.quiz)) bad(L.id, 'quiz 不同'); tot.quiz += (L.quiz || []).length;
  if (norm(L.checkOnly) !== norm(D.checkOnly)) bad(L.id, 'checkOnly 不同（内容或顺序）');
  tot.checkOnly += (L.checkOnly || []).length;
  // 练习
  if (!!L.exercise !== !!D.exercise) bad(L.id, 'exercise 有无不同');
  if (L.exercise) {
    tot.ex++;
    for (const k of Object.keys(L.exercise)) {
      if (k === 'test') { if (String(L.exercise.test).replace(/\s+/g, '') !== String(D.exercise.test).replace(/\s+/g, '')) bad(L.id, 'exercise.test 源码不同'); continue; }
      if (norm(L.exercise[k]) !== norm(D.exercise[k])) bad(L.id, `exercise.${k} 不同`);
    }
    for (const k of Object.keys(D.exercise)) if (!(k in L.exercise)) bad(L.id, `exercise 多了字段 ${k}`);
  }
  for (const k of ['id', 'title', 'mins', 'summary', 'goals', 'keyPoints']) if (norm(L[k]) !== norm(D[k])) bad(L.id, k + ' 不同');
  // 每个 Quiz/Exercise 组件有无与数据一致
  if (/<Quiz \/>/.test(mdx) !== !!(L.quiz && L.quiz.length)) bad(L.id, '<Quiz /> 有无与数据不一致');
  if (/<Exercise \/>/.test(mdx) !== !!L.exercise) bad(L.id, '<Exercise /> 有无与数据不一致');
}
console.log('核对课数', tot.lessons, '| 测验题', tot.quiz, '| 阶段测验专用题', tot.checkOnly, '| 示例', tot.plays, '| 预测题', tot.predict, '| 练习', tot.ex);
const raws = fs.readdirSync(path.join(ROOT, 'docs/lessons')).filter((f) => f.endsWith('.mdx')).reduce((s, f) => s + (fs.readFileSync(path.join(ROOT, 'docs/lessons', f), 'utf8').match(/<Raw /g) || []).length, 0);
console.log('<Raw> 数量', raws);
if (problems.length) { console.error('\n发现差异：'); problems.forEach((p) => console.error('  ✗ ' + p)); process.exit(1); }
console.log('数据核对全部一致');
