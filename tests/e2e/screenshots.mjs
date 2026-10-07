// 截图到 tests/screenshots/：首页、一课、复习页、术语表、阶段测验页（浅色和深色各一张），加一课的 390px 手机截图。
// 用来人工确认版面正常、文字清晰。用法：npm run build && node tests/e2e/screenshots.mjs
import path from 'node:path';
import { launch, openSite, ROOT, KEY } from './_site.mjs';

const OUT = path.join(ROOT, 'tests/screenshots');
const { site, close } = await openSite();
const b = await launch();
// 造几张已到期的复习卡，让复习页有内容
const seed = { __srs: { 'what-is-react#0': { due: 1, step: 1 }, 'state#0': { due: 1, step: 1 }, 'state#1': { due: 1, step: 1 } }, 'what-is-react': { quiz: {}, ex: false, done: true } };
async function run(name, w, h, scheme, steps, clipSel) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
  const p = await ctx.newPage();
  await p.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [KEY, JSON.stringify(seed)]);
  await steps(p);
  const clip = clipSel ? await p.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: Math.max(0, r.x - 16), y: Math.max(0, r.y - 40), width: Math.min(innerWidth - 0, r.width + 32), height: 220 }; }, clipSel) : undefined;
  await p.screenshot({ path: path.join(OUT, `${name}-${scheme}.png`), clip });
  await ctx.close();
}
for (const scheme of ['light', 'dark']) {
  await run('home', 1280, 1300, scheme, async (p) => { await p.goto(site); await p.waitForSelector('.home .stage'); await p.waitForTimeout(800); });
  await run('lesson', 1280, 1000, scheme, async (p) => {
    await p.goto(site + 'lessons/state.html'); await p.waitForSelector('.selfx');
    const pg = p.locator('.pg').nth(1); await pg.scrollIntoViewIfNeeded(); await p.waitForTimeout(2500);
    await p.evaluate(() => window.scrollBy(0, -80)); await p.waitForTimeout(300);
  });
  await run('lesson-exercise', 1280, 1000, scheme, async (p) => {
    await p.goto(site + 'lessons/state.html'); await p.waitForSelector('.selfx');
    const pg = p.locator('.pg', { has: p.locator('.pg-badge.ex') }); await pg.scrollIntoViewIfNeeded(); await p.waitForTimeout(2500);
    await p.evaluate(() => window.scrollBy(0, -60)); await p.waitForTimeout(300);
  });
  await run('review', 1280, 900, scheme, async (p) => { await p.goto(site + 'review.html'); await p.waitForSelector('.rv-progress'); await p.locator('.q .opt').first().click(); await p.waitForTimeout(500); });
  await run('glossary', 1280, 900, scheme, async (p) => { await p.goto(site + 'glossary.html'); await p.waitForSelector('.tbl table'); await p.waitForTimeout(500); });
  // 表格表头区域近景：外框内不能有多余空白，不能有双重边框和圆角
  await run('glossary-header', 1280, 900, scheme, async (p) => { await p.goto(site + 'glossary.html'); await p.waitForSelector('.tbl table'); await p.waitForTimeout(500); }, '.tbl');
  await run('lesson-table', 1280, 900, scheme, async (p) => { await p.goto(site + 'lessons/accessibility.html'); await p.waitForSelector('.prose table'); await p.locator('.prose table').first().scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, -120)); await p.waitForTimeout(500); }, '.prose table');
  await run('check', 1280, 900, scheme, async (p) => { await p.goto(site + 'check/1.html'); await p.waitForSelector('.quiz .q'); await p.waitForTimeout(500); });
}
await run('lesson-mobile', 390, 844, 'light', async (p) => {
  await p.goto(site + 'lessons/state.html'); await p.waitForSelector('.selfx');
  const pg = p.locator('.pg').nth(1); await pg.scrollIntoViewIfNeeded(); await p.waitForTimeout(2500);
});
await b.close(); close();
console.log('截图已保存到', OUT);
