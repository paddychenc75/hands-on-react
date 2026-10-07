// Rspress 站点的冒烟测试：对构建产物（doc_build）做端到端检查。
// 用法：npm run docs:build && node tests-site/smoke.mjs
//   SITE_URL=http://localhost:4173/hands-on-react/ node tests-site/smoke.mjs   测试已经在运行的站点（例如 rspress preview）
// 默认用内置的静态服务器托管 doc_build，并按 base（/hands-on-react/）挂载。
// 需要网络：实验台从 cdn.jsdelivr.net 加载 React 18 开发版、Babel、Prism。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = '/hands-on-react/';
const KEY = 'hands-on-react-v1';
const OLD_KEY = 'react-zero-to-expert-v1';
const LESSONS = ['what-is-react', 'state', 'lists-keys'];
const data = async (id) => (await import(pathToFileURL(path.join(ROOT, 'course/lessons', id + '.js')).href)).default;

/* ---------- 静态服务器 ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain', '.woff2': 'font/woff2' };
function serve(dir) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!p.startsWith(BASE)) { res.writeHead(404); return res.end('outside base'); }
    p = p.slice(BASE.length);
    let f = path.join(dir, p);
    if (!f.startsWith(dir)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
    if (!fs.existsSync(f)) { res.writeHead(404, { 'content-type': TYPES['.html'] }); return res.end(fs.readFileSync(path.join(dir, '404.html'))); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => server.listen(0, () => r({ server, url: `http://localhost:${server.address().port}${BASE}` })));
}

/* ---------- 断言 ---------- */
const fails = [];
const ok = (cond, name, extra = '') => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (!cond && extra ? '  → ' + extra : '')); if (!cond) fails.push(name); };

let srv = null; let site = process.env.SITE_URL;
if (!site) {
  if (!fs.existsSync(path.join(ROOT, 'doc_build/index.html'))) { console.error('先运行 npm run docs:build'); process.exit(2); }
  srv = await serve(path.join(ROOT, 'doc_build')); site = srv.url;
}
const url = (id) => site + 'lessons/' + id + '.html';

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const pageErrors = []; const consoleBad = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('console', (m) => {
  const t = m.text();
  // 水合不一致：开发版是 "Hydration failed / text content does not match"，生产版是 Minified React error #418/#423/#425
  if (m.type() === 'error' && /hydrat|did not match|Minified React error #(418|419|422|423|425)/i.test(t)) consoleBad.push(t.slice(0, 200));
});

// 默认每次都从空进度开始（先清 localStorage 再刷新），各项检查互不影响
const openLesson = async (id, { fresh = true } = {}) => {
  await page.goto(url(id));
  if (fresh) { await page.evaluate(() => localStorage.clear()); await page.reload(); }
  await page.waitForSelector('.prose', { timeout: 30000 });
  await page.waitForSelector('.selfx', { timeout: 30000 });
};

/* a. 三课能打开，正文、测验、自我解释渲染出来 */
for (const id of LESSONS) {
  const L = await data(id);
  await openLesson(id);
  const r = await page.evaluate(() => ({
    h1: document.querySelector('.rp-doc h1')?.textContent || '', prose: document.querySelector('.prose')?.textContent.length || 0,
    quiz: document.querySelectorAll('.quiz .q').length, selfx: !!document.querySelector('.selfx textarea'),
    goals: document.querySelectorAll('.goals li').length, side: [...document.querySelectorAll('.rp-doc-layout__sidebar a')].length,
  }));
  ok(r.h1.includes(L.title.slice(0, 4)) && r.prose > 300 && r.quiz === L.quiz.length && r.selfx && r.goals === L.goals.length,
    `a. ${id}：标题、正文、测验(${r.quiz}/${L.quiz.length})、目标、自我解释都渲染`, JSON.stringify(r));
  if (id === 'state') ok(r.side === 3, 'a. 侧栏列出 3 课（按阶段分组）', String(r.side));
}

/* b. 每个实验台滚动到可见后运行出结果，没有 .pv-err */
for (const id of LESSONS) {
  await openLesson(id);
  const n = await page.locator('.pg').count();
  const res = [];
  for (let i = 0; i < n; i++) {
    const pg = page.locator('.pg').nth(i);
    await pg.scrollIntoViewIfNeeded();
    const title = await pg.locator('.pg-title').innerText();
    // 预测型示例先答题再运行（和学习者的操作一致）
    if (await pg.locator('.predict').count()) {
      await pg.locator('.predict .opt').first().click();
      await pg.locator('.predict .btn.primary').click();
    }
    await page.waitForFunction((i) => { const p = document.querySelectorAll('.pg')[i]; return p._ran && p.querySelector('.preview').innerHTML.length > 0; }, i, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(300);
    const st = await pg.evaluate((p) => ({ ran: !!p._ran, err: p.querySelectorAll('.pv-err').length, html: p.querySelector('.preview').innerHTML.length }));
    res.push({ title, ...st });
  }
  const bad = res.filter((r) => !r.ran || r.err || !r.html);
  ok(n > 0 && !bad.length, `b. ${id}：${n} 个实验台都运行出结果且没有 .pv-err`, JSON.stringify(bad));
}

/* c. state 课预测题：预测前说明隐藏，选项提交后才显示 */
{
  await openLesson('state');
  const pg = page.locator('.pg').first();
  await pg.scrollIntoViewIfNeeded();
  await pg.locator('.predict').waitFor();
  const before = await pg.evaluate((p) => ({ note: p.querySelector('.pg-note') ? !p.querySelector('.pg-note').hidden : false, verdict: !p.querySelector('.predict-result').hidden, ran: !!p._ran, previewHidden: p.querySelector('.preview').hidden }));
  ok(!before.note && !before.verdict && !before.ran && before.previewHidden, 'c. 预测前：说明、结果、预览都隐藏，代码没有运行', JSON.stringify(before));
  await pg.locator('.predict .opt').first().click();
  const picked = await pg.evaluate((p) => ({ note: !p.querySelector('.pg-note').hidden, ran: !!p._ran }));
  ok(!picked.note && !picked.ran, 'c. 只选了选项还不显示说明（要点“运行，验证我的预测”）', JSON.stringify(picked));
  await pg.locator('.predict .btn.primary').click();
  await page.waitForTimeout(500);
  const after = await pg.evaluate((p) => ({ note: !p.querySelector('.pg-note').hidden, verdict: !p.querySelector('.predict-result').hidden, text: p.querySelector('.predict-result').textContent.slice(0, 40) }));
  ok(after.note && after.verdict, 'c. 提交预测后显示说明和对错', JSON.stringify(after));
}

/* d. React 开发版警告被拦截并显示。
   lists-keys 课现有的示例都写了 key，不会触发警告（课文内容不能改）。所以在练习编辑器里写一个没有 key 的列表：
   这是学习者最常见的操作，同样走“实验台运行 → React 开发版 console.error → 引擎拦截”这条路径。 */
{
  await openLesson('lists-keys');
  const ex = page.locator('.pg', { has: page.locator('.pg-badge.ex') });
  await ex.scrollIntoViewIfNeeded();
  await ex.locator('.pv-err').waitFor({ state: 'detached', timeout: 20000 }).catch(() => {});
  await page.waitForFunction(() => { const p = document.querySelector('.pg .pg-badge.ex')?.closest('.pg'); return p && p._ran; }, null, { timeout: 30000 });
  const noKey = `function App() {
  const todos = [{ id: 1, title: 'a' }, { id: 2, title: 'b' }];
  return <ul>{todos.map(t => <li>{t.title}</li>)}</ul>;
}`;
  await ex.locator('textarea').fill(noKey);
  await ex.locator('textarea').press('Control+Enter');
  await page.waitForTimeout(1200);
  const warn = await ex.evaluate((p) => [...p.querySelectorAll('.console .warn')].map((e) => e.textContent));
  ok(warn.some((w) => /React 警告/.test(w) && /key/.test(w)), 'd. 缺 key 的列表：实验台控制台出现 React 的 key 警告', JSON.stringify(warn));
}

/* e. 练习：solution 通过，starter 不通过（每课都测） */
for (const id of LESSONS) {
  const L = await data(id);
  await openLesson(id);
  const pg = page.locator('.pg', { has: page.locator('.pg-badge.ex') });
  await pg.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => { const p = document.querySelector('.pg .pg-badge.ex')?.closest('.pg'); return p && p._ran; }, null, { timeout: 30000 });
  const check = async (code) => {
    await pg.locator('textarea').fill(code);
    await pg.getByRole('button', { name: '✓ 检查答案' }).click();
    await page.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('检查')); return b && !b.disabled; }, null, { timeout: 30000 });
    await page.waitForTimeout(300);
    return pg.locator('.result').innerText();
  };
  const bad = await check(L.exercise.starter);
  ok(/^✗/.test(bad), `e. ${id}：填 starter 点检查不通过`, bad.slice(0, 80));
  const good = await check(L.exercise.solution);
  ok(/通过|做得好/.test(good) && !/^✗/.test(good), `e. ${id}：填 solution 点检查通过`, good.slice(0, 80));
}

/* f. 答对一道测验题，刷新后作答状态还在；键是 hands-on-react-v1 */
{
  const L = await data('what-is-react');
  await openLesson('what-is-react');
  await page.waitForSelector('.quiz .q');
  const q0 = page.locator('.quiz .q').first();
  const want = L.quiz[0].options[L.quiz[0].answer];
  await q0.locator('.opt', { hasText: want.slice(0, 12) }).first().click();
  await page.waitForTimeout(200);
  const right1 = await q0.locator('.opt.right').count();
  const saved = await page.evaluate((k) => localStorage.getItem(k), KEY);
  ok(right1 === 1 && saved && JSON.parse(saved)['what-is-react'].quiz['0'] === L.quiz[0].answer, 'f. 答对后进度写进 localStorage 的 ' + KEY, String(saved).slice(0, 120));
  ok(await page.evaluate((k) => localStorage.getItem(k) === null, OLD_KEY), 'f. 没有写旧键 ' + OLD_KEY);
  await page.reload(); await page.waitForSelector('.quiz .q');
  const after = await page.locator('.quiz .q').first().evaluate((q) => ({ right: q.querySelectorAll('.opt.right').length, disabled: [...q.querySelectorAll('.opt')].every((b) => b.disabled), explain: !q.querySelector('.explain').hidden }));
  ok(after.right === 1 && after.disabled && after.explain, 'f. 刷新页面后答对的状态还在', JSON.stringify(after));
  // 侧栏标记：做完本课全部测验和练习后，侧栏里这一课有标记（data-hoc-done）
  const L2 = L;
  for (let i = 1; i < L2.quiz.length; i++) await page.locator('.quiz .q').nth(i).locator('.opt', { hasText: L2.quiz[i].options[L2.quiz[i].answer].slice(0, 12) }).first().click();
  const pg = page.locator('.pg', { has: page.locator('.pg-badge.ex') });
  await pg.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.pg .pg-badge.ex')?.closest('.pg')._ran, null, { timeout: 30000 });
  await pg.locator('textarea').fill(L2.exercise.solution);
  await pg.getByRole('button', { name: '✓ 检查答案' }).click();
  await page.waitForSelector('#finish.is-done', { timeout: 30000 });
  await page.waitForTimeout(300);
  const mark = await page.evaluate(() => [...document.querySelectorAll('.rp-doc-layout__sidebar a[data-hoc-done]')].map((a) => a.getAttribute('href')));
  ok(mark.length === 1 && /what-is-react/.test(mark[0]), 'f. 本课完成后侧栏里这一课有标记', JSON.stringify(mark));
}

/* g. 390px 宽度下没有横向滚动 */
{
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  m.on('pageerror', (e) => pageErrors.push(e.message));
  const wide = [];
  for (const id of ['', ...LESSONS.map((l) => 'lessons/' + l)]) {
    await m.goto(site + (id ? id + '.html' : ''));
    await m.waitForTimeout(id ? 2500 : 800);
    if (id) { // 让所有实验台都运行，再量宽度
      await m.evaluate(async () => { for (const pg of document.querySelectorAll('.pg')) { pg.scrollIntoView(); await new Promise((r) => setTimeout(r, 80)); } window.scrollTo(0, 0); });
      await m.waitForTimeout(1200);
    }
    const w = await m.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    if (w.sw > w.iw) wide.push(id + ':' + w.sw);
  }
  ok(!wide.length, 'g. 390px 宽：首页和三课的 scrollWidth <= innerWidth', wide.join(', '));
  await m.close();
}

/* h. 站内搜索：中文词 */
{
  await openLesson('state');
  await page.getByRole('button', { name: /搜索|Search/ }).first().click();
  await page.keyboard.type('声明式', { delay: 60 });
  await page.waitForTimeout(2500);
  const items = await page.evaluate(() => [...document.querySelectorAll('.rp-search-panel__results a, .rp-search-panel__results [class*=item]')].map((e) => e.textContent.trim().slice(0, 40)));
  ok(items.length > 0, 'h. 搜索“声明式”有结果', JSON.stringify(items));
}

ok(!pageErrors.length, '页面没有意外的 pageerror', pageErrors.join(' | '));
ok(!consoleBad.length, '没有水合不一致的控制台错误', consoleBad.join(' | '));

await browser.close();
if (srv) srv.server.close();
console.log(fails.length ? `\n${fails.length} 项失败` : '\n全部通过');
process.exit(fails.length ? 1 : 0);
