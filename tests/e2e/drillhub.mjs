// 变式练习的入口与标记的浏览器测试：
//   1. 侧栏：有变式练习的课，课名后有“变式 x/y”（来自目录的 nDrills 和进度），做完一道后随之变化，全部做完换成“变式 ✓”；没有变式的课没有标记。
//   2. 总览页 /drills：列出全部变式练习（条数、标题与目录一致），按进度显示完成，点击跳到该课的 #sec-drills；页面顶部说明不影响“本课完成”。
//   3. 首页：统计里有“道变式练习”，站内学习旁有淡色的“+ 变式练习约 X 小时”，课程地图各阶段显示“变式 x/y”。
//   4. 课头：有变式的课在“约 X 分钟”后追加“+ 变式练习约 Y 分钟”，没有变式的课不显示。
//   5. 打开总览页和首页不请求任何一课的数据 chunk；手机宽度（390px）无横向滚动；浅色深色都能读（截图存 tests/screenshots/drills-*.png）。
// 用法：node tests/e2e/drillhub.mjs      （先 npm run build）
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch, openSite, lessonUrl, lessonData, checker, KEY, ROOT } from './_site.mjs';

const { site, close } = await openSite();
const b = await launch();
const { ok, done } = checker();
const SHOTS = path.join(ROOT, 'tests/screenshots');
const { LESSONS } = await import(pathToFileURL(path.join(ROOT, 'course/registry.ts')).href);
const { STAGES } = await import(pathToFileURL(path.join(ROOT, 'course/stages.ts')).href);
const withDrills = LESSONS.filter(l => l.nDrills > 0);
const totalDrills = LESSONS.reduce((s, l) => s + l.nDrills, 0);
const totalMins = LESSONS.reduce((s, l) => s + (l.drillMins || 0), 0);
const CHUNK = /\/static\/js\/async\/lesson-([\w-]+)\.[0-9a-f]+\.js/;
const errs = [];

async function open(url, { seed, width = 1280, height = 900 } = {}) {
  const ctx = await b.newContext({ viewport: { width, height } });
  const p = await ctx.newPage();
  p.reqs = [];
  p.on('request', r => p.reqs.push(r.url()));
  p.on('pageerror', e => errs.push(e.message));
  if (seed)
    await p.addInitScript(
      ([k, s]) => {
        if (!sessionStorage.getItem('seeded')) {
          localStorage.setItem(k, JSON.stringify(s));
          sessionStorage.setItem('seeded', '1');
        }
      },
      [KEY, seed],
    );
  await p.goto(url);
  return p;
}
const chunks = p => [...new Set(p.reqs.map(u => CHUNK.exec(u)?.[1]).filter(Boolean))];
const noHScroll = p => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const sidebarLink = (p, id) => p.locator(`.rp-doc-layout__sidebar a[href$="lessons/${id}.html"], .rp-doc-layout__sidebar a[href$="lessons/${id}"]`).first();
const afterText = (p, id) =>
  p.evaluate(id => {
    const a = document.querySelector(`.rp-doc-layout__sidebar a[href$="lessons/${id}.html"], .rp-doc-layout__sidebar a[href$="lessons/${id}"]`);
    const s = a?.querySelector('.rp-sidebar-item__left > span');
    return s ? getComputedStyle(s, '::after').content : null;
  }, id);

// 种子进度：state 做了 1/2，closures 全做完，其余没有记录
const seed = {
  state: { quiz: {}, ex: false, done: false, dr: { 0: { ok: true } } },
  closures: { quiz: {}, ex: false, done: false, dr: { 0: { ok: true }, 1: { ok: true } } },
};
const mark = (p, id) => sidebarLink(p, id).getAttribute('data-hoc-dr');

/* 1. 侧栏 */
{
  const p = await open(lessonUrl(site, 'jsx'), { seed });
  await p.waitForSelector('.rp-doc-layout__sidebar a[data-hoc-dr]', { timeout: 30000 });
  ok((await p.locator('.rp-doc-layout__sidebar a[data-hoc-dr]').count()) === withDrills.length, `侧栏里 ${withDrills.length} 门有变式练习的课都有标记`);
  ok((await mark(p, 'state')) === '1/2', '进度里 state 做了 1 道：标记 1/2');
  ok((await mark(p, 'events')) === '0/2', '没有进度的课：标记 0/2');
  ok((await sidebarLink(p, 'closures').getAttribute('data-hoc-dr-done')) === '1', '全部做完的课：data-hoc-dr-done');
  ok((await sidebarLink(p, 'jsx').getAttribute('data-hoc-dr')) === null, '没有变式练习的课（jsx）没有标记');
  ok((await afterText(p, 'state')) === '"变式 1/2"', '标记的可见文字是“变式 1/2”', String(await afterText(p, 'state')));
  ok((await afterText(p, 'closures')) === '"变式 ✓"', '全部做完时换成“变式 ✓”', String(await afterText(p, 'closures')));
  ok(
    chunks(p).every(id => id === 'jsx'),
    '侧栏标记没有为别的课加载数据 chunk',
    chunks(p).join(','),
  );
  await p.screenshot({ path: path.join(SHOTS, 'drills-sidebar.png'), clip: { x: 0, y: 0, width: 360, height: 900 } });
  await p.context().close();
}
// 在 events 里真的做完两道变式，侧栏标记随之变化
{
  const L = await lessonData('events');
  const p = await open(lessonUrl(site, 'events'));
  await p.waitForFunction(n => document.querySelectorAll('.drill .pg').length >= n, L.drills.length, { timeout: 60000 });
  await p.waitForTimeout(500);
  const run = (i, code) =>
    p.evaluate(
      async ([i, code]) => {
        const box = document.querySelectorAll('.drill')[i];
        const btn = [...box.querySelectorAll('button')].find(x => x.textContent.trim() === '✓ 检查答案');
        box.querySelector('.pg')._editor.value = code;
        await new Promise(r => setTimeout(r, 400));
        btn.click();
        for (let k = 0; k < 100 && btn.disabled; k++) await new Promise(r => setTimeout(r, 200));
        await new Promise(r => setTimeout(r, 300));
        return box.querySelector('.result').classList.contains('ok');
      },
      [i, code],
    );
  ok((await mark(p, 'events')) === '0/2', 'events 一开始标记 0/2');
  ok(await run(0, L.drills[0].solution), '填参考答案，第 1 道变式通过');
  await p.waitForTimeout(300);
  ok((await mark(p, 'events')) === '1/2', '通过 1 道后，侧栏标记变成 1/2', String(await mark(p, 'events')));
  ok(await run(1, L.drills[1].solution), '填参考答案，第 2 道变式通过');
  await p.waitForTimeout(300);
  ok((await mark(p, 'events')) === '2/2' && (await sidebarLink(p, 'events').getAttribute('data-hoc-dr-done')) === '1', '全部通过后，标记变成完成样式');
  ok((await afterText(p, 'events')) === '"变式 ✓"', '完成样式的文字是“变式 ✓”');
  await p.context().close();
}

/* 2. 总览页 */
{
  const p = await open(site + 'drills.html', { seed });
  await p.waitForSelector('.drills-page', { timeout: 30000 });
  await p.waitForTimeout(800);
  ok((await p.locator('.dp-lesson li').count()) === totalDrills && totalDrills === 36, `总览页列出全部 ${totalDrills} 道变式（目前 17 课共 36 道）`);
  ok((await p.locator('.dp-lesson').count()) === withDrills.length, `按课分组：${withDrills.length} 门课`);
  const titles = await p.locator('.dp-title').allInnerTexts();
  ok(
    JSON.stringify(titles) === JSON.stringify(withDrills.flatMap(l => l.drillTitles.map(t => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>')))),
    '每道的标题与目录一致、顺序按课程顺序',
  );
  const stagesShown = await p.locator('.dp-stage h2').count();
  ok(stagesShown === new Set(withDrills.map(l => l.stage)).size, '按阶段分组：只列出有变式的阶段');
  ok(/不影响“本课完成”/.test(await p.locator('.dp-intro').innerText()), '页面顶部说明变式练习是什么、不影响“本课完成”');
  ok(
    (await p.locator('.dp-lesson li.done').count()) === 3,
    '进度里已完成的 3 道（state 1 道、closures 2 道）显示为完成',
    String(await p.locator('.dp-lesson li.done').count()),
  );
  ok(/已完成 3 道/.test(await p.locator('.dp-total').innerText()), '总计行显示“已完成 3 道”', await p.locator('.dp-total').innerText());
  ok((await p.locator('.dp-total').innerText()).includes(`合计约 ${totalMins} 分钟`), '总计行显示变式合计时间');
  ok(chunks(p).length === 0, '打开总览页不请求任何一课的数据 chunk', chunks(p).join(','));
  const bad = await p.evaluate(
    () => [...document.querySelectorAll('.dp-lesson li a')].filter(a => !/lessons\/[\w-]+(\.html)?#sec-drills$/.test(a.getAttribute('href'))).length,
  );
  ok(bad === 0, '每道变式的链接都指向 /lessons/<课>#sec-drills');
  ok(await noHScroll(p), '桌面宽度无横向滚动');
  await p.screenshot({ path: path.join(SHOTS, 'drills-page-light.png'), fullPage: true });
  await p.evaluate(() => document.documentElement.classList.add('dark'));
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(SHOTS, 'drills-page-dark.png'), fullPage: true });
  await p.evaluate(() => document.documentElement.classList.remove('dark'));
  // 点击跳到该课的变式练习区
  const target = withDrills.find(l => l.id === 'use-ref');
  await p.locator(`.dp-lesson li a[href*="lessons/use-ref"]`).first().click();
  await p.waitForSelector('#sec-drills', { timeout: 30000 });
  // 课的内容分几批加载，版面会变高；LinkRouter 会持续对齐到页面稳定
  await p.waitForFunction(() => document.querySelectorAll('.drill .pg').length > 0, null, { timeout: 30000 });
  await p
    .waitForFunction(
      () => {
        const t = document.querySelector('#sec-drills').getBoundingClientRect().top;
        return t >= -5 && t < innerHeight / 2;
      },
      null,
      { timeout: 8000 },
    )
    .catch(() => {});
  await p.waitForTimeout(500);
  const where = await p.evaluate(() => ({
    path: location.pathname,
    hash: location.hash,
    top: document.querySelector('#sec-drills').getBoundingClientRect().top,
    h: innerHeight,
  }));
  ok(where.path.includes('/lessons/use-ref') && where.hash === '#sec-drills', '点击后到了 use-ref 的 #sec-drills', JSON.stringify(where));
  ok(where.top >= -5 && where.top < where.h, '变式练习区在视口里（已滚动到位）', JSON.stringify(where));
  ok(!!target, 'use-ref 有变式练习');
  await p.context().close();
}
{
  const p = await open(site + 'drills.html', { seed, width: 390, height: 844 });
  await p.waitForSelector('.drills-page', { timeout: 30000 });
  await p.waitForTimeout(800);
  ok(await noHScroll(p), '390px 宽度下总览页无横向滚动');
  await p.screenshot({ path: path.join(SHOTS, 'drills-page-390.png'), fullPage: true });
  await p.context().close();
}
{
  const p = await open(site + 'drills.html');
  await p.waitForSelector('.drills-page', { timeout: 30000 });
  await p.waitForTimeout(500);
  ok(
    (await p.locator('.dp-lesson li.done').count()) === 0 && (await p.locator('.dp-lesson li').count()) === totalDrills,
    `没有进度时：${totalDrills} 道都显示未完成`,
  );
  ok((await p.locator('.rp-doc-layout__sidebar a[href*="drills"]').count()) > 0, '侧栏有“变式练习”入口');
  await p.context().close();
}

/* 3. 课程地图页（原首页的统计和阶段进度） */
{
  const p = await open(site + 'roadmap.html', { seed });
  await p.waitForSelector('.home .stats', { timeout: 30000 });
  await p.waitForTimeout(1000);
  const stats = await p.locator('.stats').innerText();
  ok(new RegExp(`${totalDrills}\\s*道变式练习`).test(stats), `课程地图统计有“${totalDrills} 道变式练习”`, stats.replace(/\n/g, ' '));
  const hours = Math.round((totalMins / 60) * 10) / 10;
  ok(stats.includes(`+ 变式练习约 ${hours} 小时`), `站内学习旁有“+ 变式练习约 ${hours} 小时”`);
  const meters = await p.locator('.stage .meter').allInnerTexts();
  const perStage = STAGES.map((_, si) => {
    const ls = LESSONS.filter(l => l.stage === si);
    return { n: ls.reduce((s, l) => s + l.nDrills, 0) };
  });
  ok(
    meters.every((m, si) => (perStage[si].n ? /变式 \d+\/\d+/.test(m) : !m.includes('变式'))),
    '课程地图各阶段显示“变式 x/y”（没有变式的阶段不显示）',
    meters.join(' | '),
  );
  ok(meters.some(m => /变式 3\/\d+/.test(m)) || meters.some(m => /变式 1\/\d+/.test(m)), '阶段的变式完成数来自进度', meters.join(' | '));
  ok(chunks(p).length === 0, '打开课程地图不请求任何一课的数据 chunk', chunks(p).join(','));
  await p.screenshot({ path: path.join(SHOTS, 'drills-home-stats.png'), clip: { x: 0, y: 380, width: 1280, height: 520 } });
  await p.context().close();
}
{
  const p = await open(site + 'roadmap.html', { width: 390, height: 844 });
  await p.waitForSelector('.home .stats', { timeout: 30000 });
  await p.waitForTimeout(800);
  ok(await noHScroll(p), '390px 宽度下课程地图无横向滚动');
  await p.context().close();
}

/* 4. 课头 */
{
  const s = LESSONS.find(l => l.id === 'state');
  const p = await open(lessonUrl(site, 'state'));
  await p.waitForSelector('.crumb', { timeout: 30000 });
  const crumb = await p.locator('.crumb').first().innerText();
  ok(
    crumb.includes(`约 ${s.mins} 分钟`) && crumb.includes(`+ 变式练习约 ${s.drillMins} 分钟`),
    `state 的课头：约 ${s.mins} 分钟 + 变式练习约 ${s.drillMins} 分钟`,
    crumb.replace(/\n/g, ' '),
  );
  ok(
    await p.evaluate(() => {
      const d = document.querySelector('.crumb .dim');
      return !!d && Number(getComputedStyle(d).opacity) < 1;
    }),
    '变式时间是淡色的',
  );
  await p
    .locator('.crumb')
    .first()
    .evaluate(el => el.scrollIntoView({ block: 'center' }));
  await p.screenshot({ path: path.join(SHOTS, 'drills-lesson-header.png'), clip: { x: 280, y: 0, width: 1000, height: 330 } });
  await p.context().close();
  const q = await open(lessonUrl(site, 'jsx'));
  await q.waitForSelector('.crumb', { timeout: 30000 });
  ok(!(await q.locator('.crumb').first().innerText()).includes('变式'), '没有变式练习的课（jsx）课头不显示变式时间');
  await q.context().close();
}

const unexpected = errs.filter(e => !/boom|Failed to load resource/.test(e));
ok(!unexpected.length, '没有意外的页面错误' + (unexpected.length ? '：' + unexpected.join(' / ') : ''));
await b.close();
close();
process.exit(done() ? 1 : 0);
