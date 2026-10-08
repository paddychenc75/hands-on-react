// 截图到 tests/screenshots/：首页、一课、复习页、术语表、阶段测验页（浅色和深色各一张），加一课的 390px 手机截图。
// 用来人工确认版面正常、文字清晰。用法：npm run build && node tests/e2e/screenshots.mjs
import path from 'node:path';
import { launch, openSite, ROOT, KEY } from './_site.mjs';

const OUT = path.join(ROOT, 'tests/screenshots');
const { site, close } = await openSite();
const b = await launch();
// 造几张已到期的复习卡，让复习页有内容
const seed = {
  __srs: { 'what-is-react#0': { due: 1, step: 1 }, 'state#0': { due: 1, step: 1 }, 'state#1': { due: 1, step: 1 } },
  'what-is-react': { quiz: {}, ex: false, done: true },
};
async function run(name, w, h, scheme, steps, clipSel) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
  const p = await ctx.newPage();
  await p.addInitScript(
    ([k, v]) => {
      if (!localStorage.getItem(k)) localStorage.setItem(k, v);
    },
    [KEY, JSON.stringify(seed)],
  );
  await steps(p);
  const clip = clipSel
    ? await p.evaluate(sel => {
        const r = document.querySelector(sel).getBoundingClientRect();
        return { x: Math.max(0, r.x - 16), y: Math.max(0, r.y - 40), width: Math.min(innerWidth - 0, r.width + 32), height: 220 };
      }, clipSel)
    : undefined;
  await p.screenshot({ path: path.join(OUT, `${name}-${scheme}.png`), clip });
  await ctx.close();
}
for (const scheme of ['light', 'dark']) {
  await run('home', 1280, 1300, scheme, async p => {
    await p.goto(site);
    await p.waitForSelector('.home .stage');
    await p.waitForTimeout(800);
  });
  await run('lesson', 1280, 1000, scheme, async p => {
    await p.goto(site + 'lessons/state.html');
    await p.waitForSelector('.selfx');
    const pg = p.locator('.pg').nth(1);
    await pg.scrollIntoViewIfNeeded();
    await p.waitForTimeout(2500);
    await p.evaluate(() => window.scrollBy(0, -80));
    await p.waitForTimeout(300);
  });
  await run('lesson-exercise', 1280, 1000, scheme, async p => {
    await p.goto(site + 'lessons/state.html');
    await p.waitForSelector('.selfx');
    const pg = p.locator('.pg', { has: p.locator('.pg-badge.ex') });
    await pg.scrollIntoViewIfNeeded();
    await p.waitForTimeout(2500);
    await p.evaluate(() => window.scrollBy(0, -60));
    await p.waitForTimeout(300);
  });
  await run('review', 1280, 900, scheme, async p => {
    await p.goto(site + 'review.html');
    await p.waitForSelector('.rv-progress');
    await p.locator('.q .opt').first().click();
    await p.waitForTimeout(500);
  });
  await run('glossary', 1280, 900, scheme, async p => {
    await p.goto(site + 'glossary.html');
    await p.waitForSelector('.tbl table');
    await p.waitForTimeout(500);
  });
  // 表格表头区域近景：外框内不能有多余空白，不能有双重边框和圆角
  await run(
    'glossary-header',
    1280,
    900,
    scheme,
    async p => {
      await p.goto(site + 'glossary.html');
      await p.waitForSelector('.tbl table');
      await p.waitForTimeout(500);
    },
    '.tbl',
  );
  await run(
    'lesson-table',
    1280,
    900,
    scheme,
    async p => {
      await p.goto(site + 'lessons/accessibility.html');
      await p.waitForSelector('.prose table');
      await p.locator('.prose table').first().scrollIntoViewIfNeeded();
      await p.evaluate(() => window.scrollBy(0, -120));
      await p.waitForTimeout(500);
    },
    '.prose table',
  );
  await run('check', 1280, 900, scheme, async p => {
    await p.goto(site + 'check/1.html');
    await p.waitForSelector('.quiz .q');
    await p.waitForTimeout(500);
  });
}
// 变式练习区（浅色、深色、390px 手机）:state 课
const drillShot = async p => {
  await p.goto(site + 'lessons/state.html');
  await p.waitForSelector('.selfx');
  await p.waitForFunction(() => document.querySelectorAll('.drill .pg').length >= 2, null, { timeout: 60000 });
  await p.locator('#sec-drills').scrollIntoViewIfNeeded();
  await p.waitForTimeout(2500);
  await p.evaluate(() => window.scrollBy(0, -20));
  await p.waitForTimeout(300);
};
for (const scheme of ['light', 'dark']) await run('drills', 1280, 1000, scheme, drillShot);
await run('drills-mobile', 390, 844, 'light', drillShot);
await run('home-time', 1280, 700, 'light', async p => {
  await p.goto(site);
  await p.waitForSelector('.home .stats');
  await p.waitForTimeout(800);
});
await run('lesson-mobile', 390, 844, 'light', async p => {
  await p.goto(site + 'lessons/state.html');
  await p.waitForSelector('.selfx');
  const pg = p.locator('.pg').nth(1);
  await pg.scrollIntoViewIfNeeded();
  await p.waitForTimeout(2500);
});
// 真库示例（浅色）：router 课的 loader 导航状态、tanstack-query 课的状态字段。先点开预测题，再点一下，让页面停在有内容的时刻
for (const [id, title, pick] of [
  [
    'router',
    '真库：loader 运行期间',
    async pg => {
      await pg.locator('.preview a', { hasText: '用户 2' }).click();
      await pg.page().waitForTimeout(350);
    },
  ],
  [
    'state-architecture',
    '真库：persist',
    async pg => {
      await pg.page().waitForTimeout(300);
    },
  ],
  [
    'tanstack-query',
    '真库：useQuery 的状态字段',
    async pg => {
      await pg.locator('.preview button', { hasText: '用户 2' }).click();
      await pg.page().waitForTimeout(300);
      await pg.locator('.preview table').scrollIntoViewIfNeeded();
      await pg.page().evaluate(() => window.scrollBy(0, 300));
    },
  ],
]) {
  await run(id, 1280, 1000, 'light', async p => {
    await p.goto(site + `lessons/${id}.html`);
    await p.waitForSelector('.selfx');
    const pg = p.locator('.pg', { has: p.locator('.pg-title', { hasText: title }) });
    await pg.scrollIntoViewIfNeeded();
    await p.waitForTimeout(2500);
    if (await pg.locator('.predict .opt').count()) {
      await pg.locator('.predict .opt').first().click();
      await pg.locator('.predict .btn.primary').click();
      await p.waitForTimeout(1500);
    }
    await pick(pg);
    await p.evaluate(() => window.scrollBy(0, -20));
  });
}
await b.close();
close();
console.log('截图已保存到', OUT);
