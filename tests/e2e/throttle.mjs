// CPU 降速测试：4 倍节流下，计时类练习（scheduler、concurrent、use-effect、suspense-data、animation）的参考答案仍要通过。
// 做法同 lessons.mjs：打开课页、把 solution 填进练习点“检查答案”，要求 PASS；区别是检查前用 CDP 把 CPU 降速 4 倍。
// 用法：node tests/e2e/throttle.mjs [课 id ...]      （先 npm run build）
import { launch, openSite, lessonUrl, lessonData } from './_site.mjs';

const RATE = 4;
const IDS = ['scheduler', 'concurrent', 'use-effect', 'suspense-data', 'animation'];
const only = process.argv.slice(2);
const ids = IDS.filter(id => !only.length || only.includes(id));
const { site, close } = await openSite();
const b = await launch();

async function testLesson(id) {
  const L = await lessonData(id);
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const logs = [];
  p.on('pageerror', e => logs.push('PAGEERR ' + e.message));
  await p.goto(lessonUrl(site, id));
  await p.waitForSelector('.selfx', { timeout: 60000 });
  await p.waitForFunction(() => [...document.querySelectorAll('.pg')].some(x => x._editor && x.querySelector('.pg-badge.ex')), null, { timeout: 60000 });
  await p.waitForTimeout(800);
  await p.evaluate(async () => {
    document.querySelectorAll('.predict .opts .opt:first-child').forEach(b => b.click());
    await new Promise(r => setTimeout(r, 50));
    document.querySelectorAll('.predict .btn.primary').forEach(b => b.click());
  });
  await p.waitForTimeout(500);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const r = await p.evaluate(async solution => {
    const btn = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '✓ 检查答案');
    let pg = btn;
    while (pg && !pg._editor) pg = pg.parentElement;
    if (!btn || !pg) return 'NO BTN/PG';
    pg._editor.value = solution;
    await new Promise(r => setTimeout(r, 400));
    btn.click();
    for (let i = 0; i < 300 && btn.disabled; i++) await new Promise(r => setTimeout(r, 200));
    await new Promise(r => setTimeout(r, 300));
    const txt = pg.querySelector('.result').innerText;
    return txt.includes('通过') && !txt.startsWith('✗') ? 'PASS' : 'FAIL ' + txt.slice(0, 300);
  }, L.exercise.solution);
  await ctx.close();
  return { id, line: `${id} (CPU ×${RATE}) ${[...logs, r].join(' | ')}`, issue: r !== 'PASS' };
}

const results = await Promise.all(ids.map(id => testLesson(id).catch(e => ({ id, line: id + ' EXCEPTION ' + e.message.split('\n')[0], issue: true }))));
let bad = 0;
for (const r of results) {
  console.log(r.line);
  if (r.issue) bad++;
}
console.log('throttle', ids.length, 'with issues', bad);
await b.close();
close();
process.exit(bad ? 1 : 0);
