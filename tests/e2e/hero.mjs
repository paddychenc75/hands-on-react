// 首页入口与首页主视觉：
//   回首页的入口（顶栏站名、侧栏“课程首页”、手机菜单、面包屑里的阶段名）
//   组件树动画（自动演示只播一次、点击范围与计数、memo、连点、减少动画、键盘、手机宽度、离开再回来、性能）
// 用法：npm run build && node tests/e2e/hero.mjs
import { launch, openSite, lessonUrl, checker } from './_site.mjs';

const { ok, done } = checker();
const { site, close: closeSite } = await openSite();
const browser = await launch();
const pageErrors = [];
const hydrationBad = [];
const track = p => {
  p.on('pageerror', e => pageErrors.push(e.message));
  p.on('console', m => {
    if (m.type() === 'error' && /hydrat|did not match|Minified React error #(418|419|422|423|425)/i.test(m.text())) hydrationBad.push(m.text().slice(0, 200));
  });
};
const homeUrl = site.replace(/\/$/, '');
const isHome = u => /\/hands-on-react(\/|\/index\.html)?(#.*)?$/.test(new URL(u).pathname + new URL(u).hash);

/* 1. 桌面：课页面顶栏站名是链接，点击回首页（客户端路由，不整页刷新） */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  track(page);
  await page.goto(lessonUrl(site, 'state'));
  await page.waitForSelector('.rp-doc');
  const t = await page.evaluate(() => {
    const a = document.querySelector('a.hoc-site-title');
    return { href: a?.getAttribute('href'), text: a?.textContent, atom: !!a?.querySelector('svg.hoc-atom'), label: a?.getAttribute('aria-label') };
  });
  ok(
    t.href === '/hands-on-react/' && t.text === '动手学 React' && t.atom && /课程首页/.test(t.label),
    '入口. 顶栏站名带原子图标、链到带 base 的首页、有读屏标签',
    JSON.stringify(t),
  );
  await page.evaluate(() => {
    window.__noReload = 1;
  });
  await page.click('a.hoc-site-title');
  await page.waitForSelector('.home .stage');
  ok(isHome(page.url()) && (await page.evaluate(() => window.__noReload)) === 1, '入口. 点站名回首页，且没有整页刷新', page.url());
  ok((await page.getAttribute('a.hoc-site-title', 'aria-current')) === 'page', '入口. 在首页时站名带 aria-current="page"');

  // 键盘：Tab 到站名，焦点样式可见，Enter 激活
  await page.goto(lessonUrl(site, 'state'));
  await page.waitForSelector('.rp-doc');
  await page.focus('a.hoc-site-title');
  const outline = await page.evaluate(() => getComputedStyle(document.querySelector('a.hoc-site-title')).outlineStyle);
  ok(outline !== 'none', '入口. 站名获得键盘焦点时有可见的焦点框', outline);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.home .stage');
  ok(isHome(page.url()), '入口. 站名能用 Enter 激活');

  // 侧栏第一项“课程首页”
  await page.goto(lessonUrl(site, 'state'));
  await page.waitForSelector('.rp-doc');
  const first = await page.evaluate(() => {
    const as = [...document.querySelectorAll('.rp-doc-layout__sidebar a')];
    return { text: as[0]?.textContent.trim(), second: as[1]?.textContent.trim(), href: as[0]?.getAttribute('href') };
  });
  ok(
    first.text === '课程首页' && first.second === '今日复习' && /^\/hands-on-react\/(index\.html)?$/.test(first.href),
    '入口. 侧栏第一项是“课程首页”，在“今日复习”之前',
    JSON.stringify(first),
  );
  await page.evaluate(() => {
    window.__noReload = 1;
  });
  await page.locator('.rp-doc-layout__sidebar a', { hasText: '课程首页' }).click();
  await page.waitForSelector('.home .stage');
  ok(isHome(page.url()) && (await page.evaluate(() => window.__noReload)) === 1, '入口. 点侧栏“课程首页”回首页，没有整页刷新', page.url());

  // 面包屑里的阶段名：链到首页课程地图里对应的阶段
  await page.goto(lessonUrl(site, 'state'));
  await page.waitForSelector('.rp-doc .crumb a.tag');
  const crumb = await page.evaluate(() => ({
    href: document.querySelector('.crumb a.tag').getAttribute('href'),
    text: document.querySelector('.crumb a.tag').textContent,
  }));
  ok(crumb.href === '/hands-on-react/#stage-0' && /入门/.test(crumb.text), '入口. 面包屑里的阶段名是链接，指向首页对应阶段的锚点', JSON.stringify(crumb));
  await page.evaluate(() => {
    window.__noReload = 1;
  });
  await page.click('.crumb a.tag');
  await page.waitForSelector('.home #stage-0');
  await page.waitForTimeout(800);
  const top = await page.evaluate(() => ({ top: Math.round(document.getElementById('stage-0').getBoundingClientRect().top), keep: window.__noReload }));
  ok(top.keep === 1 && top.top > 0 && top.top < 200, '入口. 点阶段名客户端跳到首页并滚到该阶段', JSON.stringify(top));
  await ctx.close();
}

/* 2. 手机宽度：顶栏菜单第一项是“课程首页”，顶栏站名可点；侧栏菜单第一项也是 */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const page = await ctx.newPage();
  track(page);
  await page.goto(lessonUrl(site, 'state'));
  await page.waitForSelector('.rp-doc');
  await page.click('.rp-nav-hamburger.rp-nav-hamburger__sm');
  await page.waitForSelector('.rp-nav-screen--open .hoc-nav-home');
  const firstItem = await page.evaluate(() => document.querySelector('.rp-nav-screen--open .rp-nav-screen__container').firstElementChild?.textContent.trim());
  ok(firstItem === '课程首页', '入口. 手机顶栏菜单的第一项是“课程首页”', firstItem);
  await page.evaluate(() => {
    window.__noReload = 1;
  });
  await page.click('.rp-nav-screen--open .hoc-nav-home');
  await page.waitForSelector('.home .stage');
  ok(isHome(page.url()) && (await page.evaluate(() => window.__noReload)) === 1, '入口. 点手机菜单的“课程首页”回首页，没有整页刷新', page.url());

  await page.goto(lessonUrl(site, 'state'));
  await page.waitForSelector('.rp-doc');
  await page.click('.rp-sidebar-menu__left');
  await page.waitForTimeout(400);
  const side = await page.evaluate(() => document.querySelector('.rp-doc-layout__sidebar a')?.textContent.trim());
  ok(side === '课程首页', '入口. 手机侧栏菜单的第一项是“课程首页”', side);
  await page.keyboard.press('Escape');

  await page.goto(lessonUrl(site, 'state'));
  await page.waitForSelector('.rp-doc');
  await page.click('a.hoc-site-title');
  await page.waitForSelector('.home .stage');
  const box = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(isHome(page.url()) && box.sw <= box.cw, '入口. 手机上点顶栏站名回首页，页面无横向滚动', JSON.stringify(box));
  await ctx.close();
}

ok(!pageErrors.length, '页面没有意外的 pageerror', pageErrors.join(' | '));
ok(!hydrationBad.length, '没有水合不一致的控制台错误', hydrationBad.join(' | '));
await browser.close();
closeSite();
process.exit(done() ? 1 : 0);
