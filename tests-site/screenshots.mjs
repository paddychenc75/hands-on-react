// 给 state 课在浅色和深色模式下各截几张图，存到 tests-site/screenshots/，用来人工确认文字清晰可读。
// 用法：npm run docs:build && node tests-site/screenshots.mjs（复用 smoke.mjs 的静态服务器思路，这里直接用 rspress preview 的地址或 SITE_URL）
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'screenshots');
const site = process.env.SITE_URL || 'http://localhost:4173/hands-on-react/';
const b = await chromium.launch();
for (const scheme of ['light', 'dark']) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
  const p = await ctx.newPage();
  await p.goto(site + 'lessons/state.html'); await p.waitForSelector('.selfx');
  const isDark = await p.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log(scheme, 'html.dark =', isDark);
  // 让实验台都运行；预测题先答一个选项再运行，再做一道测验题、填一段自我解释，展开各种状态
  await p.evaluate(async () => { for (const pg of document.querySelectorAll('.pg')) { pg.scrollIntoView(); await new Promise((r) => setTimeout(r, 120)); } });
  await p.evaluate(async () => { document.querySelectorAll('.predict .opts .opt:first-child').forEach((x) => x.click()); await new Promise((r) => setTimeout(r, 50)); document.querySelectorAll('.predict .btn.primary').forEach((x) => x.click()); });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.quiz .q').forEach((q) => q.querySelector('.opt').click()); });
  const ta = p.locator('.selfx textarea'); await ta.fill('state 是组件的记忆。调用 set 函数会请求重新渲染，同一次渲染里读到的值是一张快照，新值要等下一次渲染才能看到。');
  await p.getByRole('button', { name: '写好了，对照本课要点' }).click();
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(OUT, `state-${scheme}.png`), fullPage: true });
  await ctx.close();
}
await b.close();
