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

/* ===== 首页组件树动画 ===== */
const IDS = ['App', 'Header', 'TodoList', 'Logo', 'Search', 'Item1', 'Item2', 'Box1', 'Box2'];
const base = Object.fromEntries(IDS.map(i => [i, 1]));
const plus = (...ids) => {
  const c = { ...base };
  for (const i of ids) c[i] += 1;
  return c;
};
const TODO_SUB = ['TodoList', 'Item1', 'Item2', 'Box1', 'Box2'];
const newCtx = (opts = {}) => browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
/** 打开首页并等树激活。demo=false 时先记成“本会话已自动演示过”，免得它改动要断言的计数。 */
async function openHome(page, { demo = false, fresh = false } = {}) {
  await page.goto(site);
  await page.evaluate(
    ([d, f]) => {
      if (f) localStorage.clear();
      if (!d) sessionStorage.setItem('hoc-hero-demo', '1');
      else sessionStorage.removeItem('hoc-hero-demo');
    },
    [demo, fresh],
  );
  await page.reload();
  await page.waitForSelector('.hero-tree[data-ready]');
}
const counts = page =>
  page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.home .tnode')].map(b => [b.dataset.id, +b.querySelector('.n').textContent])));
const idle = page => page.waitForFunction(() => document.querySelector('.hero-tree').dataset.active === '0', null, { timeout: 5000 });
const node = (page, id) => page.locator(`.home .tnode[data-id="${id}"]`);

/* 3. 自动演示：进入页面后自动从 TodoList 触发一次，本会话只播一次 */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  track(page);
  await openHome(page, { demo: true, fresh: true });
  const first = await counts(page);
  ok(Object.values(first).every(n => n === 1) || first.TodoList === 2, '动画. 刚进页面时计数是 1（自动演示约 0.6 秒后才开始）', JSON.stringify(first));
  await page.waitForFunction(() => document.querySelector('.tnode[data-id="TodoList"] .n').textContent === '2', null, { timeout: 4000 });
  await idle(page);
  const after = await counts(page);
  const note = await page.textContent('.ht-note');
  const live = await page.textContent('.ht-live');
  ok(JSON.stringify(after) === JSON.stringify(plus(...TODO_SUB)), '动画. 自动演示从 TodoList 触发：它和 4 个后代 +1，其余不变', JSON.stringify(after));
  ok(
    /TodoList 调用了 set 函数/.test(note) && live.replace(/​/g, '') === 'TodoList 和它的 4 个后代重新渲染了，共 5 个组件',
    '动画. 旁白一行小字和读屏播报各一句',
    note + ' | ' + live,
  );
  ok((await page.evaluate(() => sessionStorage.getItem('hoc-hero-demo'))) === '1', '动画. 本会话记住“已演示”（sessionStorage）');
  const keys = await page.evaluate(() => Object.keys(localStorage));
  ok(!keys.some(k => /hero|hoc-/.test(k)), '动画. 自动演示不写学习进度的 localStorage 键', keys.join(','));
  // 离开再回来、刷新：不重播
  await page.click('a.hoc-site-title');
  await page.goto(lessonUrl(site, 'state'));
  await page.waitForSelector('.rp-doc');
  await page.click('a.hoc-site-title');
  await page.waitForSelector('.hero-tree[data-ready]');
  await page.waitForTimeout(2200);
  ok(JSON.stringify(await counts(page)) === JSON.stringify(base), '动画. 同一会话内再回首页不重播自动演示', JSON.stringify(await counts(page)));
  await page.goto(site);
  await page.waitForSelector('.hero-tree[data-ready]');
  await page.waitForTimeout(2200);
  ok(JSON.stringify(await counts(page)) === JSON.stringify(base), '动画. 刷新后同一会话仍不重播');
  await ctx.close();
}

/* 4. 点击：本节点和后代 +1，兄弟和祖先不变（memo 关） */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  track(page);
  await openHome(page);
  await node(page, 'Header').click();
  await idle(page);
  ok(
    JSON.stringify(await counts(page)) === JSON.stringify(plus('Header', 'Logo', 'Search')),
    '动画. 点 Header：它和后代 +1，兄弟 TodoList 一支和祖先 App 不变',
    JSON.stringify(await counts(page)),
  );
  await node(page, 'Logo').click();
  await idle(page);
  ok((await counts(page)).Logo === 3 && (await counts(page)).Header === 2, '动画. 点叶子节点只加它自己');
  await node(page, 'TodoList').click();
  await idle(page);
  const c = await counts(page);
  ok(
    c.TodoList === 2 && c.Item1 === 2 && c.Item2 === 2 && c.Box1 === 2 && c.Box2 === 2 && c.App === 1 && c.Header === 2,
    '动画. 点 TodoList：它和 4 个后代 +1',
    JSON.stringify(c),
  );
  ok(
    (await page.textContent('.ht-live')).replace(/​/g, '') === 'TodoList 和它的 4 个后代重新渲染了，共 5 个组件' &&
      (await page.locator('.ht-live[aria-live="polite"][role="status"]').count()) === 1,
    '动画. 读屏只播一句总结（aria-live），不逐个节点播',
  );
  // 重置计数
  await page.click('.ht-reset');
  ok(JSON.stringify(await counts(page)) === JSON.stringify(base), '动画. “重置计数”把所有节点改回 1');
  ok((await page.getAttribute('.ht-reset', 'aria-disabled')) === 'true', '动画. 计数都是 1 时“重置计数”呈禁用状态');

  // 连点：同一节点连点两次（第二次在第一次还没结束时）
  await node(page, 'TodoList').click();
  await page.waitForTimeout(120);
  await node(page, 'TodoList').click();
  await idle(page);
  ok(
    JSON.stringify(await counts(page)) === JSON.stringify({ ...base, TodoList: 3, Item1: 3, Item2: 3, Box1: 3, Box2: 3 }),
    '动画. 连点两次：计数是 3，不丢不重',
    JSON.stringify(await counts(page)),
  );
  // 重叠的两个不同脉冲各自独立
  await page.click('.ht-reset');
  await node(page, 'App').click();
  await page.waitForTimeout(150);
  await node(page, 'Header').click();
  await idle(page);
  ok(
    JSON.stringify(await counts(page)) === JSON.stringify({ ...plus(...IDS), Header: 3, Logo: 3, Search: 3 }),
    '动画. 上一次脉冲没结束就点别的节点：各自独立，计数正确',
    JSON.stringify(await counts(page)),
  );
  await page.waitForTimeout(1100);
  ok((await page.evaluate(() => document.querySelectorAll('.tnode.on, .tnode.lit, .hero-tree.busy').length)) === 0, '动画. 全部结束后没有残留的高亮和压暗');
  await ctx.close();
}

/* 5. memo：挡住子树；点 memo 节点自己仍然渲染 */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  track(page);
  await openHome(page);
  await page.check('.ht-memo-input');
  ok(
    (await page.locator('.tnode[data-memoizable] .badge-memo').first().isVisible()) && (await page.locator('.tnode[data-id="Logo"] .badge-memo').isHidden()),
    '动画. 打开 memo：两个 Item 出现 memo 标记，其他节点没有',
  );
  await node(page, 'TodoList').click();
  await page.waitForSelector('.tnode.blocked', { timeout: 2000 });
  ok(
    /memo 跳过了这次渲染/.test(await page.textContent('.ht-note')),
    '动画. 被挡住时旁白说明“props 没变，memo 跳过了这次渲染”',
    await page.textContent('.ht-note'),
  );
  await idle(page);
  ok(
    JSON.stringify(await counts(page)) === JSON.stringify(plus('TodoList')),
    '动画. memo 开：点 TodoList，只有它自己 +1，Item 和 Checkbox 都不加',
    JSON.stringify(await counts(page)),
  );
  ok(/2 个 Item 被 memo 跳过/.test(await page.textContent('.ht-live')), '动画. 读屏播报说明 memo 跳过了 Item');
  await node(page, 'Item1').click();
  await idle(page);
  ok(
    JSON.stringify(await counts(page)) === JSON.stringify(plus('TodoList', 'Item1', 'Box1')),
    '动画. 直接点 memo 的 Item 自己：它和它的 Checkbox 照常渲染，另一个 Item 不变',
    JSON.stringify(await counts(page)),
  );
  await node(page, 'App').click();
  await idle(page);
  ok(
    JSON.stringify(await counts(page)) === JSON.stringify({ ...plus('TodoList', 'Item1', 'Box1', 'App', 'Header', 'Logo', 'Search', 'TodoList') }),
    '动画. memo 开：点 App，Header 一支照常，TodoList 加一，Item 一支被挡',
    JSON.stringify(await counts(page)),
  );
  await page.uncheck('.ht-memo-input');
  await node(page, 'TodoList').click();
  await idle(page);
  const c = await counts(page);
  ok(c.Item2 === 2 && c.Box2 === 2 && c.Item1 === 3, '动画. 关掉 memo 后，后代又会跟着渲染', JSON.stringify(c));
  const why = await page.getAttribute('.ht-why', 'href');
  ok(/\/lessons\/performance/.test(why), '动画. “为什么？”链到性能优化一课', why);
  const caps = await page.evaluate(() => [...document.querySelectorAll('.tree-card .cap a')].map(a => a.getAttribute('href')));
  ok(
    caps.length === 2 && /lessons\/rendering/.test(caps[0]) && /lessons\/performance/.test(caps[1]),
    '动画. 说明文字链到渲染机制和性能优化两课',
    JSON.stringify(caps),
  );
  await ctx.close();
}

/* 6. 键盘和读屏 */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  track(page);
  await openHome(page);
  await page.focus('.hero .cta .btn.primary');
  let reached = false;
  for (let i = 0; i < 4 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => document.activeElement?.classList.contains('tnode'));
  }
  ok(reached, '键盘. 从“开始学习”按钮 Tab 几下就到组件树节点');
  const tag = await page.evaluate(() => document.activeElement.tagName + '|' + getComputedStyle(document.activeElement).outlineStyle);
  ok(/^BUTTON\|(solid|auto)/.test(tag), '键盘. 节点是 button，获得焦点时有可见的焦点框', tag);
  await node(page, 'Header').focus();
  await page.keyboard.press('Enter');
  await idle(page);
  await node(page, 'TodoList').focus();
  await page.keyboard.press('Space');
  await idle(page);
  ok(
    JSON.stringify(await counts(page)) === JSON.stringify(plus('Header', 'Logo', 'Search', ...TODO_SUB)),
    '键盘. Enter 和空格都能触发',
    JSON.stringify(await counts(page)),
  );
  const label = await node(page, 'Item1').getAttribute('aria-label');
  ok(/Item（第 1 个）.*已渲染 2 次/.test(label), '键盘. 节点的读屏名包含组件名、渲染次数', label);
  await ctx.close();
}

/* 7. 减少动画：不自动演示，没有流动的光点和回弹，点击后直接切到高亮状态并更新计数，约 1 秒后恢复 */
{
  const ctx = await newCtx({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  track(page);
  await openHome(page, { demo: true, fresh: true });
  await page.waitForTimeout(2000);
  ok(
    JSON.stringify(await counts(page)) === JSON.stringify(base) && !(await page.evaluate(() => sessionStorage.getItem('hoc-hero-demo'))),
    '减少动画. 不自动演示',
    JSON.stringify(await counts(page)),
  );
  await node(page, 'TodoList').click();
  await page.waitForTimeout(80);
  const r = await page.evaluate(() => ({
    lit: [...document.querySelectorAll('.tnode.lit')].map(b => b.dataset.id).sort(),
    anims: document.querySelector('.hero-tree').getAnimations({ subtree: true }).length,
    counts: Object.fromEntries([...document.querySelectorAll('.tnode')].map(b => [b.dataset.id, +b.querySelector('.n').textContent])),
    old: document.querySelectorAll('.n[data-old]').length,
  }));
  ok(
    JSON.stringify(r.lit) === JSON.stringify([...TODO_SUB].sort()) && r.anims === 0 && r.old === 0,
    '减少动画. 点击后 5 个节点立刻高亮，没有任何动画在跑',
    JSON.stringify(r),
  );
  ok(JSON.stringify(r.counts) === JSON.stringify(plus(...TODO_SUB)), '减少动画. 计数立刻更新', JSON.stringify(r.counts));
  await page.waitForTimeout(1400);
  ok((await page.evaluate(() => document.querySelectorAll('.tnode.lit').length)) === 0, '减少动画. 约 1 秒后高亮恢复');
  await page.check('.ht-memo-input');
  await node(page, 'TodoList').click();
  await page.waitForTimeout(80);
  ok((await page.evaluate(() => document.querySelectorAll('.tnode.blocked').length)) === 2, '减少动画. memo 挡住的节点用虚线和“跳过”标记表示');
  await ctx.close();
}

/* 8. 手机宽度：无横向滚动，节点点击区域不小于 40x40，节点互不重叠，触屏点击可用 */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  track(page);
  await openHome(page);
  const r = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('.tnode')].map(b => ({ id: b.dataset.id, ...b.getBoundingClientRect().toJSON() }));
    const overlap = [];
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) overlap.push(a.id + '&' + b.id);
      }
    const card = document.querySelector('.tree-card').getBoundingClientRect();
    return {
      small: boxes.filter(b => b.width < 40 || b.height < 40).map(b => `${b.id} ${Math.round(b.width)}x${Math.round(b.height)}`),
      overlap,
      outside: boxes.filter(b => b.left < card.left || b.right > card.right).map(b => b.id),
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    };
  });
  ok(
    !r.small.length && !r.overlap.length && !r.outside.length && r.sw <= r.cw,
    '手机. 390px：无横向滚动，节点都不小于 40x40，互不重叠，都在卡片内',
    JSON.stringify(r),
  );
  await node(page, 'Header').tap();
  await idle(page);
  ok(JSON.stringify(await counts(page)) === JSON.stringify(plus('Header', 'Logo', 'Search')), '手机. 触屏点击可用', JSON.stringify(await counts(page)));
  ok(
    (await page.evaluate(() => getComputedStyle(document.querySelector('.tnode')).touchAction)) === 'manipulation',
    '手机. 节点没有点击延迟（touch-action: manipulation）',
  );
  await ctx.close();
}

/* 9. 离开首页再回来：没有残留和报错；脉冲进行中离开也没事；切到后台不补播 */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  track(page);
  const errs = pageErrors.length;
  await openHome(page);
  await node(page, 'App').click();
  await page.waitForTimeout(150);
  await page.click('a.hoc-site-title'.replace('a.', 'a.')); // 站名链接在首页也可点；再用侧栏离开
  await page.goto(lessonUrl(site, 'state'));
  await page.waitForSelector('.rp-doc');
  await page.evaluate(() => {
    window.__nr = 1;
  });
  await page.click('a.hoc-site-title');
  await page.waitForSelector('.hero-tree[data-ready]');
  ok(
    JSON.stringify(await counts(page)) === JSON.stringify(base) && (await page.evaluate(() => window.__nr)) === 1,
    '离开再回来. 回到首页（客户端路由）计数是初始的，树能正常激活',
    JSON.stringify(await counts(page)),
  );
  await node(page, 'Header').click();
  await idle(page);
  ok((await counts(page)).Header === 2, '离开再回来. 回来后点击仍然可用');
  // 切到后台：进行中的脉冲立刻收尾（计数照加），不留残余
  await page.click('.ht-reset');
  await node(page, 'App').click();
  await page.waitForTimeout(120);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(50);
  const bg = await page.evaluate(() => ({
    active: document.querySelector('.hero-tree').dataset.active,
    lit: document.querySelectorAll('.tnode.lit, .tnode.on').length,
    anims: document
      .querySelector('.hero-tree')
      .getAnimations({ subtree: true })
      .filter(a => a.playState === 'running' && !(a instanceof CSSTransition) && !(a instanceof CSSAnimation)).length,
  }));
  ok(bg.active === '0' && bg.lit === 0 && bg.anims === 0, '后台. 切到后台时进行中的脉冲立刻收尾，没有残留动画', JSON.stringify(bg));
  ok(JSON.stringify(await counts(page)) === JSON.stringify(plus(...IDS)), '后台. 收尾时计数照常加完，不丢', JSON.stringify(await counts(page)));
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(1200);
  ok(JSON.stringify(await counts(page)) === JSON.stringify(plus(...IDS)), '后台. 回到前台不补播');
  ok(pageErrors.length === errs, '离开再回来. 没有新的页面错误', pageErrors.slice(errs).join(' | '));
  await ctx.close();
}

/* 10. 性能：一次完整脉冲（从 App 出发）期间没有超过 50ms 的长任务 */
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  track(page);
  await openHome(page);
  await page.evaluate(() => {
    window.__long = [];
    window.__frames = [];
    new PerformanceObserver(l => l.getEntries().forEach(e => window.__long.push(Math.round(e.duration)))).observe({ entryTypes: ['longtask'] });
    let last = performance.now();
    const tick = t => {
      window.__frames.push(t - last);
      last = t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await node(page, 'App').click();
  await page.waitForTimeout(1600);
  const perf = await page.evaluate(() => ({ long: window.__long, maxFrame: Math.round(Math.max(...window.__frames)) }));
  ok(!perf.long.some(d => d > 50), '性能. 一次完整脉冲期间没有超过 50ms 的长任务', JSON.stringify(perf));
  console.log('     性能：长任务', JSON.stringify(perf.long), '最长一帧', perf.maxFrame, 'ms');
  await ctx.close();
}

ok(!pageErrors.length, '页面没有意外的 pageerror', pageErrors.join(' | '));
ok(!hydrationBad.length, '没有水合不一致的控制台错误', hydrationBad.join(' | '));
await browser.close();
closeSite();
process.exit(done() ? 1 : 0);
