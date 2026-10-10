// 跨设备同步的浏览器测试。全部用 Playwright 的 route 拦截 api.github.com，接一个内存里的假 Gist 服务（_fakegithub.mjs）：
// 不发任何真实请求，不用真实令牌（令牌是带标记的假字符串，全程搜索它有没有泄露）。
// 两个浏览器上下文模拟两台设备。覆盖：未开启时不加载同步 chunk、不发请求；两台设备互相同步；离线各学一课后合并；同一张复习卡取较新；
// 401 / 403 限速 / 404 / 云端内容损坏 / 断网恢复的提示和行为（失败后本地进度不变）；多标签页只有一个负责推送；
// 令牌不出现在 DOM、日志、URL、Referer、断开后的 localStorage；导出导入；恢复备份；截图 tests/screenshots/sync-*.png。
// 用法：node tests/e2e/sync.mjs      （先 npm run build）
import fs from 'node:fs';
import path from 'node:path';
import { launch, openSite, lessonUrl, lessonOrder, checker, KEY, ROOT } from './_site.mjs';
import { fakeGitHub } from './_fakegithub.mjs';

const { site, close } = await openSite();
const b = await launch();
const { ok, done } = checker();
const SHOTS = path.join(ROOT, 'tests/screenshots');
const ids = await lessonOrder();
const TOKEN = 'ghp_ZZTESTMARKERTOKEN0123456789abcdef';
const _TOKEN_B = 'github_pat_ZZTESTMARKERTOKENB0123456789';
// 测试里把防抖、退避、心跳缩短；真实时长另有一组断言（见"真实时长"一节）。
// SYNC_THROTTLE=4 node tests/e2e/sync.mjs 用 CDP 给每个页面降 CPU（模拟 GitHub 的 2 核 runner）；等待条件一律轮询到成立或超时（超时按降速倍数放大）
const TUNE = { debounce: 250, maxWait: 500, pullAfter: 0, initialDelay: 100, backoff: 150, heartbeat: 500, periodic: 3000, leaseTtl: 3000 };
const K = Math.max(1, Number(process.env.SYNC_THROTTLE) || 1);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const until = async (fn, ms = 30000, step = 100) => {
  ms = Math.max(ms, 30000) * Math.max(1, K / 2);
  const t = Date.now();
  while (Date.now() - t < ms) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {}
    await sleep(step);
  }
  return false;
};
const all = { texts: [], reqs: [], pages: [] };

/** 新的"设备"：独立的浏览器上下文，记录请求、控制台、页面错误 */
async function device(gh, { viewport = { width: 1280, height: 900 }, tune = TUNE, colorScheme = 'light', hasTouch = false } = {}) {
  const ctx = await b.newContext({ viewport, colorScheme, acceptDownloads: true, hasTouch, isMobile: hasTouch });
  await ctx.addInitScript(t => {
    if (t) window.__hocSyncTest = t;
  }, tune);
  if (gh) await gh.install(ctx);
  const d = { ctx, errs: [], logs: [], reqs: [] };
  ctx.on('page', p => {
    all.pages.push(p);
    p.on('console', m => d.logs.push(m.text()));
    p.on('pageerror', e => d.errs.push(e.message));
    p.on('request', r => d.reqs.push({ url: r.url(), headers: r.headers() }));
    if (K > 1)
      ctx
        .newCDPSession(p)
        .then(c => c.send('Emulation.setCPUThrottlingRate', { rate: K }))
        .catch(() => {});
  });
  d.page = await ctx.newPage();
  return d;
}
const prog = p => p.evaluate(k => JSON.parse(localStorage.getItem(k) || '{}'), KEY);
const doneIds = async p =>
  Object.entries(await prog(p))
    .filter(([k, v]) => !k.startsWith('__') && v && v.done)
    .map(([k]) => k)
    .sort();
const cards = async p => (await prog(p)).__srs || {};
const canon = v =>
  JSON.stringify(v, (_k, x) =>
    x && typeof x === 'object' && !Array.isArray(x)
      ? Object.fromEntries(
          Object.keys(x)
            .sort()
            .map(k2 => [k2, x[k2]]),
        )
      : x,
  );

/** 在课文页点"我已掌握，跳过"，再答第 1 题：写进完成状态、测验答案和一张复习卡 */
async function learn(p, id) {
  await p.goto(lessonUrl(site, id));
  await p.waitForSelector('#finish .btn', { timeout: 30000 });
  await p.waitForSelector('.quiz .q .opt', { timeout: 30000 });
  await p.click('.quiz .q .opt');
  await p.click('#finish .btn');
  await p.waitForSelector('#finish.is-done');
}
async function openPanel(p) {
  await p.goto(site + 'roadmap.html#sync');
  await p.waitForSelector('#sync-token, .sync-status', { timeout: 20000 });
}
async function enable(p, token = TOKEN) {
  await openPanel(p);
  await p.fill('#sync-token', token);
  await p.click('button:has-text("开启同步")');
  await p.waitForSelector('.sync-result .sync-msg', { timeout: 20000 });
  return p.textContent('.sync-result .sync-msg');
}
const _badgeState = p => p.getAttribute('.sync-badge', 'data-state').catch(() => null);
const foreground = async p => {
  await p.bringToFront();
  await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
};

/* =============== 0. 没开启同步：不加载同步 chunk、不发任何 github 请求 =============== */
{
  const d = await device(null);
  await d.page.goto(site + 'roadmap.html');
  await d.page.waitForSelector('.roadmap');
  await d.page.waitForTimeout(1500);
  await learn(d.page, ids[0]);
  await d.page.goto(site + 'roadmap.html');
  await d.page.waitForSelector('#sync');
  await d.page.waitForTimeout(1500);
  const urls = d.reqs.map(r => r.url);
  ok(!urls.some(u => /github\.com|githubusercontent\.com/.test(u)), '未开启同步：不发任何到 github.com 的请求');
  ok(!urls.some(u => /sync-engine/.test(u)), '未开启同步：不加载同步引擎 chunk');
  ok(!urls.some(u => /sync-panel/.test(u)), '面板收起时不加载面板 chunk');
  ok((await d.page.locator('.sync-badge').count()) === 0, '未开启同步：顶栏不显示同步图标');
  const closed = await d.page.evaluate(() => !document.querySelector('#sync').open);
  ok(closed, '"跨设备同步"面板默认收起');
  const p0 = await prog(d.page);
  const l = p0[ids[0]];
  ok(l && l.done && l.ts === undefined, '没开启同步时进度照常保存；没改过代码草稿或笔记，就没有多余的时间戳字段', JSON.stringify(l));
  await d.page.screenshot({ path: path.join(SHOTS, 'sync-panel-closed-light.png'), clip: undefined });
  await d.page.click('#sync > summary');
  await d.page.waitForSelector('#sync-token');
  ok(d.reqs.some(r => /sync-panel/.test(r.url)) && !d.reqs.some(r => /sync-engine/.test(r.url)), '展开面板只加载面板 chunk，仍不加载同步引擎');
  ok(!d.reqs.some(r => /github\.com/.test(r.url)), '展开面板也不发 github 请求');
  const inp = await d.page.getAttribute('#sync-token', 'type');
  const ac = await d.page.getAttribute('#sync-token', 'autocomplete');
  ok(inp === 'password' && ac === 'off', '令牌输入框是 type=password、autocomplete=off');
  const hasLabel = await d.page.evaluate(() => !!document.querySelector('label[for="sync-token"]'));
  ok(hasLabel, '令牌输入框有 label');
  const live = await d.page.evaluate(() => !!document.querySelector('.sync-result[aria-live="polite"]'));
  ok(live, '结果区 aria-live=polite');
  const html = await d.page.content();
  ok(
    (await d.page.locator('.sync-steps a').first().getAttribute('href')) ===
      'https://github.com/settings/tokens/new?scopes=gist&description=hands-on-react-sync',
    '第一步的链接是预填 scopes=gist 的经典令牌创建页',
  );
  ok(
    /改回“未完成”.*带回来/.test(await d.page.textContent('.sync-notes')) && /备选：细粒度令牌/.test(await d.page.textContent('.sync-fine')),
    '面板说明里有“改回未完成会被带回来”，细粒度令牌是备选',
  );
  ok(
    /细粒度|personal-access-tokens\/new\?name=/.test(html) && /gists=write/.test(html) && /tokens\/new\?scopes=gist/.test(html),
    '面板里有预填好的令牌创建链接（细粒度 gists=write；经典 scopes=gist）',
  );
  await d.page.screenshot({ path: path.join(SHOTS, 'sync-panel-off-light.png'), fullPage: false });
  await d.ctx.close();
}

/* =============== 0b. 入口（与「动手学 Vue 3」一致）：侧栏“进度同步”、课程地图页头一行链接、直达地址；全程不加载同步引擎、不发 github 请求 =============== */
{
  const gitReqs = d => d.reqs.filter(r => /github\.com|githubusercontent\.com/.test(r.url)).length;
  const engine = d => d.reqs.some(r => /sync-engine/.test(r.url));
  const panelOpenAndFocused = async (d, label) => {
    ok(
      await until(() => d.page.evaluate(() => document.querySelector('#sync')?.open && !!document.querySelector('#sync-token'))),
      `${label}：落到展开的同步面板`,
    );
    ok(
      await until(() => d.page.evaluate(() => document.activeElement?.tagName === 'SUMMARY' && document.activeElement.parentElement.id === 'sync')),
      `${label}：焦点在面板标题上`,
    );
    ok(await until(async () => (await d.page.evaluate(() => document.querySelector('#sync').getBoundingClientRect().top)) < 400), `${label}：已滚动到面板`);
  };
  const d = await device(null);
  await d.page.goto(lessonUrl(site, ids[0]));
  const SIDE = '.rp-doc-layout__sidebar a[href$="#sync"]';
  await d.page.waitForSelector(SIDE, { state: 'attached' });
  const side = d.page.locator(SIDE);
  ok((await side.count()) === 1 && /进度同步/.test(await side.textContent()), '侧栏固定入口里有"进度同步"');
  ok(await until(async () => (await side.getAttribute('data-hoc-sync')) === 'off'), '未开启时侧栏项旁标记"未开启"');
  const order = await d.page.evaluate(() => [...document.querySelectorAll('.rp-doc-layout__sidebar a[href]')].slice(0, 6).map(a => a.textContent.trim()));
  ok(
    order.join('|').startsWith('课程首页|课程地图|今日复习|术语表|变式练习|进度同步'),
    '顺序：首页、课程地图、今日复习、术语表、变式练习，最后是进度同步',
    order.join('|'),
  );
  ok((await d.page.locator('a.sync-off, .sync-badge').count()) === 0, '未开启时顶栏什么也不显示（与 Vue 一致）');
  await d.page.screenshot({ path: path.join(SHOTS, 'sync-sidebar-entry-light.png'), clip: { x: 0, y: 0, width: 1280, height: 330 } });
  await d.page.evaluate(() => (window.__spa = 1));
  await side.click();
  await panelOpenAndFocused(d, '点侧栏');
  ok(await d.page.evaluate(() => window.__spa === 1 && /roadmap/.test(location.pathname)), '点侧栏走客户端路由（不整页刷新）并到了课程地图');
  ok(gitReqs(d) === 0 && !engine(d), '点侧栏前后：没有 github 请求，没有加载同步引擎');
  // 已经在课程地图页、面板被收起时再点，也要重新展开
  await d.page.click('#sync > summary');
  await d.page.waitForFunction(() => !document.querySelector('#sync').open);
  await side.click();
  await panelOpenAndFocused(d, '已在课程地图页再点侧栏');
  // 页头那一行
  await d.page.goto(site + 'roadmap.html');
  const hero = d.page.locator('.sync-hero');
  await hero.waitFor();
  ok(
    /想在手机和电脑之间接着学？开启跨设备同步（可选）/.test((await hero.textContent()).trim()),
    '课程地图页头有一行"想在手机和电脑之间接着学？开启跨设备同步（可选）"',
  );
  ok(await d.page.evaluate(() => document.querySelector('.sync-hero').getBoundingClientRect().top < 500), '页头那一行在页面上方');
  await d.page.screenshot({ path: path.join(SHOTS, 'sync-roadmap-hero-link-light.png') });
  await d.page.evaluate(() => (window.__spa = 1));
  await d.page.click('.sync-hero a');
  await panelOpenAndFocused(d, '点页头链接');
  ok(await d.page.evaluate(() => window.__spa === 1), '点页头链接走客户端路由');
  // 直接访问
  await d.page.goto(site + 'roadmap.html#sync');
  await panelOpenAndFocused(d, '直接访问 /roadmap#sync');
  ok((await d.page.locator('.sync-phone').count()) === 0, '桌面宽度：不显示手机引导块');
  const stepText = await d.page.textContent('.sync-steps');
  ok(/它只显示一次，离开那一页就再也看不到了。想在别的设备上用同一个，现在就存进密码管理器。/.test(stepText), '第 2 步末尾：令牌只显示一次、存进密码管理器');
  const notes = await d.page.textContent('.sync-notes');
  ok(
    /打开本站，把这三步再做一遍，新建一个令牌。旧令牌事后看不到，不用去找；存了旧令牌的话，直接重复第 3 步粘贴它也行。两个令牌只要来自同一个 GitHub 账号，用的就是同一份进度。/.test(
      notes,
    ) && /手动填 Gist/.test(notes),
    '“在另一台设备上”以新建为主，找 Gist 的句子保留',
  );
  await d.page.screenshot({ path: path.join(SHOTS, 'sync-roadmap-panel-open-light.png') });
  ok(gitReqs(d) === 0 && !engine(d), '直达、点链接之后：仍然没有 github 请求，没有加载同步引擎');
  ok(
    d.reqs.some(r => /sync-panel/.test(r.url)),
    '只加载了面板本身的 chunk',
  );
  await d.page.goto(site + 'roadmap.html');
  await d.page.waitForSelector('#sync');
  const summary = await d.page.textContent('#sync > summary');
  ok(/跨设备同步/.test(summary) && /未开启/.test(summary) && /可选/.test(summary), '收起的标题行：跨设备同步 · 未开启 · 可选', summary);
  ok(gitReqs(d) === 0 && !engine(d), '浏览课程地图页（面板收起）：没有 github 请求，没有同步引擎');
  await d.ctx.close();

  // 手机宽度：从菜单（侧栏）进入、页头链接都可达
  const m = await device(null, { viewport: { width: 390, height: 844 }, hasTouch: true });
  await m.page.goto(site + 'roadmap.html');
  await m.page.waitForSelector('.sync-hero a');
  await m.page.screenshot({ path: path.join(SHOTS, 'sync-roadmap-hero-link-mobile-light.png') });
  await m.page.click('.sync-hero a');
  await panelOpenAndFocused(m, '手机：点页头链接');
  const ph = m.page.locator('.sync-phone');
  await ph.waitFor();
  ok(
    /在手机上，或者这是第二台设备？直接新建一个令牌。电脑上那个令牌只在创建时显示一次，现在已经看不到了，不用去找。两个令牌只要来自同一个 GitHub 账号，用的就是同一份进度。/.test(
      (await ph.textContent()).trim(),
    ),
    '手机：三步上方显示提示块和文案',
  );
  ok(
    await m.page.evaluate(
      () => document.querySelector('.sync-phone').compareDocumentPosition(document.querySelector('.sync-steps')) & Node.DOCUMENT_POSITION_FOLLOWING,
    ),
    '手机：提示块在三步指引上方',
  );
  const pb = m.page.locator('.sync-phone a.btn');
  ok(
    (await pb.textContent()).trim() === '去 GitHub 新建令牌' &&
      (await pb.getAttribute('href')) === 'https://github.com/settings/tokens/new?scopes=gist&description=hands-on-react-sync' &&
      (await pb.getAttribute('target')) === '_blank' &&
      (await pb.getAttribute('rel')) === 'noopener noreferrer',
    '手机：按钮文字、链接地址、target 和 rel',
  );
  ok((await pb.boundingBox()).height >= 44, '手机：按钮高度不小于 44px');
  ok((await m.page.locator('.sync-steps a').first().getAttribute('href')) === (await pb.getAttribute('href')), '手机：按钮与第 1 步是同一个创建令牌链接');
  await m.page.evaluate(() => document.querySelector('.sync-phone').scrollIntoView({ block: 'center' }));
  await m.page.screenshot({ path: path.join(SHOTS, 'sync-panel-phone-guide-mobile-light.png') });
  await m.page.screenshot({ path: path.join(SHOTS, 'sync-roadmap-panel-open-mobile-light.png') });
  await m.page.goto(lessonUrl(site, ids[0]));
  await m.page.click('button:has-text("菜单")');
  const ms = m.page.locator(`${SIDE}:visible`);
  await ms.waitFor();
  await m.page.screenshot({ path: path.join(SHOTS, 'sync-sidebar-entry-mobile-light.png') });
  await ms.click();
  await panelOpenAndFocused(m, '手机：从菜单点"进度同步"');
  ok(gitReqs(m) === 0 && !engine(m), '手机：入口点击前后没有 github 请求，没有同步引擎');
  ok(!(await m.page.evaluate(() => document.documentElement.scrollWidth > innerWidth)), '手机：入口和面板没有横向滚动');
  await m.ctx.close();

  // 开启后侧栏项显示状态
  const ghn = fakeGitHub();
  ghn.st.valid.add(TOKEN);
  const n = await device(ghn);
  await enable(n.page);
  await n.page.goto(site + 'review.html');
  await n.page.waitForSelector('.hoc-slot');
  const sideState = await until(() =>
    n.page
      .locator(SIDE)
      .getAttribute('data-hoc-sync')
      .then(v => v && v !== 'off' && v),
  );
  ok(['synced', 'syncing', 'pending'].includes(sideState), '已开启时侧栏项显示状态（小圆点）', String(sideState));
  await n.page.screenshot({ path: path.join(SHOTS, 'sync-sidebar-entry-on-light.png'), clip: { x: 0, y: 0, width: 1280, height: 330 } });
  await n.ctx.close();
}

/* =============== 1~2. 两台设备 A、B =============== */
const gh = fakeGitHub();
gh.st.valid.add(TOKEN);
const A = await device(gh);
const B = await device(gh, { colorScheme: 'dark' });
{
  await learn(A.page, ids[0]);
  const aBefore = await prog(A.page);
  const msgA = await enable(A.page);
  ok(/已开启/.test(msgA) && /上传/.test(msgA), 'A 开启同步：创建私密 Gist 并上传本机进度', msgA);
  const g = gh.gist();
  ok(g && !g.description.includes(TOKEN) && /动手学 React 学习进度/.test(g.description), 'Gist 描述固定且不含令牌');
  const remote = gh.remote();
  ok(
    remote && remote.schema === 1 && remote.app === 'hands-on-react' && typeof remote.updatedAt === 'number' && /^[0-9a-f]{8}$/.test(remote.device),
    '云端文件带 schema、updatedAt、随机设备标识',
  );
  ok(remote && remote.progress[ids[0]]?.done === true, '云端文件里有 A 的第 1 课进度');
  ok(JSON.stringify(remote).indexOf(TOKEN) < 0, '云端文件里没有令牌');
  const creates = gh.st.log.filter(r => r.method === 'POST');
  ok(creates.length === 1, '只创建了一个 Gist');
  ok(
    gh.st.log.every(r => r.method === 'OPTIONS' || r.host === 'api.github.com'),
    '所有请求都发往 api.github.com',
  );
  ok(
    gh.st.log.filter(r => r.host === 'api.github.com').every(r => r.referer === undefined),
    '请求不带 Referer（referrerPolicy: no-referrer）',
    JSON.stringify(gh.st.log.filter(r => r.referer).slice(0, 2)),
  );
  ok(
    gh.st.log.filter(r => r.auth).every(r => r.auth === 'Bearer ' + TOKEN && r.host === 'api.github.com'),
    '令牌只出现在发往 api.github.com 的 Authorization 头里',
  );
  ok(
    gh.st.log.every(r => !r.url.includes(TOKEN) && !r.url.includes('ZZTESTMARKER')),
    '请求地址里没有令牌',
  );
  const aAfter = await prog(A.page);
  ok(aAfter[ids[0]].done && JSON.stringify(aAfter.__srs) === JSON.stringify(aBefore.__srs), 'A 开启同步后本机进度没有变');
  // 状态区与顶栏图标
  const status = await A.page.textContent('.sync-status');
  ok(/已同步/.test(status) && /tester/.test(status) && /…cdef/.test(status) && !status.includes('ghp_'), '状态区显示账号名和令牌末四位，不显示令牌', status);
  ok(/gist\.github\.com\/tester\//.test((await A.page.getAttribute('.sync-on a[href*="gist.github.com"]', 'href')) || ''), '状态区有 Gist 链接');
  const tokenInDom = await A.page.evaluate(
    t => document.documentElement.outerHTML.includes(t) || [...document.querySelectorAll('input')].some(i => i.value.includes(t)),
    TOKEN,
  );
  ok(!tokenInDom, '开启后页面 DOM（含输入框的值）里没有令牌');
  ok((await A.page.getAttribute('.sync-badge', 'data-state')) === 'synced', '顶栏同步图标显示"已同步"');
  await A.page.screenshot({ path: path.join(SHOTS, 'sync-panel-on-light.png') });
  await A.page.screenshot({ path: path.join(SHOTS, 'sync-badge-light.png'), clip: { x: 700, y: 0, width: 580, height: 64 } });
  await A.page.click('.sync-btn');
  await A.page.waitForSelector('#sync-pop');
  const pop = await A.page.textContent('#sync-pop');
  ok(/上次同步/.test(pop) && /立即同步/.test(pop), '点击图标显示"上次同步"和"立即同步"');
  await A.page.screenshot({ path: path.join(SHOTS, 'sync-badge-popover-light.png'), clip: { x: 640, y: 0, width: 640, height: 220 } });
  await A.page.keyboard.press('Escape');
  ok((await A.page.locator('#sync-pop').count()) === 0, 'Esc 关闭弹层');

  // B 开启同步，看到第 1 课
  const msgB = await enable(B.page);
  ok(/已开启/.test(msgB) && /合并了 1 课/.test(msgB), 'B 开启同步：找到已有的 Gist 并合并了 1 课', msgB);
  ok(gh.st.log.filter(r => r.method === 'POST').length === 1, 'B 没有再创建新的 Gist（先列出账号的 gist 查找同名文件）');
  ok((await doneIds(B.page)).join() === ids[0], 'B 开启同步后第 1 课已完成');
  ok((await cards(B.page))[ids[0] + '#0'], 'B 也有了第 1 课测验的复习卡片');
  await B.page.screenshot({ path: path.join(SHOTS, 'sync-panel-on-dark.png') });
  const bk = await B.page.locator('.sync-backups li').count();
  ok(bk === 1, '合并改动了本机进度之前留了一份备份，面板里可以看到', String(bk));
  const topText = await B.page.textContent('#prog-text');
  ok(/已完成 1\//.test(topText), 'B 的顶栏进度更新为已完成 1 课', topText);

  // B 学第 2 课 → 防抖后自动推送 → A 回到前台后两课都完成
  const writesBefore = gh.writes().length;
  await learn(B.page, ids[1]);
  ok(await until(() => gh.remote()?.progress[ids[1]]?.done === true), 'B 学完第 2 课后几秒内自动推送到云端');
  const burst = gh.writes().length - writesBefore;
  ok(burst >= 1 && burst <= 3, '多次改动被防抖合并，没有逐次推送', String(burst));
  await A.page.goto(site + 'roadmap.html');
  ok(
    await until(async () => {
      await foreground(A.page);
      return (await doneIds(A.page)).join() === [ids[0], ids[1]].sort().join();
    }),
    'A 回到前台后拉取并合并，两课都完成',
  );
  ok(gh.st.n304 >= 0, 'ETag 条件请求已使用');
  const n304 = gh.st.n304;
  ok(
    await until(async () => {
      await foreground(A.page);
      return gh.st.n304 > n304;
    }),
    '远端没变时用 If-None-Match 得到 304，不重复下载',
  );
  ok(
    gh.st.log.some(r => r.ifNoneMatch),
    '请求带 If-None-Match',
  );
}

/* =============== 3. 多标签页：只有一个标签页负责推送；别的标签页的改动合并进来 =============== */
{
  const A2 = await A.ctx.newPage();
  A2.on('pageerror', e => A.errs.push(e.message));
  await A2.goto(site + 'roadmap.html');
  await A2.waitForSelector('.sync-badge');
  await A.page.bringToFront();
  await sleep(500);
  const w0 = gh.writes().length;
  await learn(A2, ids[2]);
  ok(await until(() => gh.remote()?.progress[ids[2]]?.done === true), '多标签页：另一个标签页学的内容推送到了云端');
  await sleep(1200);
  const w1 = gh.writes().length - w0;
  ok(w1 >= 1 && w1 <= 3, '多标签页：没有两个标签页同时推送（写入次数合理）', String(w1));
  await A.page.goto(site + 'roadmap.html');
  ok(await until(async () => /已完成 3\//.test(await A.page.textContent('#prog-text'))), '第一个标签页的界面随之更新（已完成 3 课）');
  await A2.close();
}

/* =============== 4. 离线各学一课、同一张卡两边都复习：上线后合并 =============== */
{
  const gh2 = fakeGitHub();
  gh2.st.valid.add(TOKEN);
  const X = await device(gh2);
  const Y = await device(gh2);
  await learn(X.page, ids[0]);
  await enable(X.page);
  await enable(Y.page);
  ok((await doneIds(Y.page)).join() === ids[0], '（第二组设备）Y 已有第 1 课');
  // 两边都离线
  gh2.st.mode = 'offline';
  await learn(X.page, ids[1]);
  await learn(Y.page, ids[2]);
  // 同一张卡（第 1 课第 1 题）两边都复习过：Y 的更新，box 更高
  const now = Date.now();
  const key = ids[0] + '#0';
  await X.page.evaluate(
    ([k, c, t]) => {
      const p = JSON.parse(localStorage.getItem(k));
      p.__srs[c] = { box: 1, n: 2, due: t + 864e5, last: t - 5000 };
      localStorage.setItem(k, JSON.stringify(p));
    },
    [KEY, key, now],
  );
  await Y.page.evaluate(
    ([k, c, t]) => {
      const p = JSON.parse(localStorage.getItem(k));
      p.__srs[c] = { box: 4, n: 5, due: t + 16 * 864e5, last: t };
      localStorage.setItem(k, JSON.stringify(p));
    },
    [KEY, key, now],
  );
  const st = await until(() => X.page.evaluate(() => localStorage.getItem('hands-on-react-v1:sync-status')).then(v => /pending/.test(v || '') && v));
  ok(/pending/.test(st || ''), '离线时状态是"有未同步的更改"');
  // 刷新让内存读到手改的卡片，再学一课触发保存
  await X.page.reload();
  await Y.page.reload();
  const xc = Object.keys(await cards(X.page)).length;
  gh2.st.mode = 'ok';
  await learn(X.page, ids[3]);
  await learn(Y.page, ids[4]);
  const want = [ids[0], ids[1], ids[2], ids[3], ids[4]].sort().join();
  ok(
    await until(async () => {
      await foreground(X.page);
      await foreground(Y.page);
      return (await doneIds(X.page)).join() === want && (await doneIds(Y.page)).join() === want;
    }, 45000),
    '离线各学后上线，最终两边都包含所有课',
    `${await doneIds(X.page)} | ${await doneIds(Y.page)}`,
  );
  const cx = await cards(X.page);
  const cy = await cards(Y.page);
  ok(canon(cx) === canon(cy), '两边的复习卡片完全一致（并集）');
  ok(Object.keys(cx).length >= xc && cx[ids[2] + '#0'] && cx[ids[1] + '#0'] && cx[ids[4] + '#0'], '复习卡片是并集：每台设备各自的卡都在');
  ok(cx[key].box === 4 && cx[key].n === 5, '同一张卡两边都复习过时保留较新的那条（整条取，不混拼）', JSON.stringify(cx[key]));
  ok(await until(async () => canon(gh2.remote()?.progress.__srs) === canon(await cards(X.page))), '云端也是合并后的结果');
  await X.ctx.close();
  await Y.ctx.close();
}

/* =============== 5. 错误处理（每种失败之后本地进度都不变） =============== */
{
  const gh3 = fakeGitHub();
  gh3.st.valid.add(TOKEN);
  const E = await device(gh3, { viewport: { width: 390, height: 844 } });
  await learn(E.page, ids[0]);
  // 无效令牌：提示、不保存任何配置
  await openPanel(E.page);
  await E.page.fill('#sync-token', 'ghp_ZZTESTMARKERINVALID00000000000000');
  await E.page.click('button:has-text("开启同步")');
  await E.page.waitForSelector('.sync-result .sync-msg.bad');
  const bad = await E.page.textContent('.sync-result .sync-msg');
  ok(/令牌/.test(bad) && !bad.includes('INVALID'), '令牌无效：提示重新填写，且提示里不含令牌', bad);
  ok(!(await E.page.evaluate(() => Object.keys(localStorage).some(k => k.endsWith(':sync')))), '令牌无效时不保存配置');
  await E.page.screenshot({ path: path.join(SHOTS, 'sync-error-enable-mobile-light.png') });
  // 格式不对
  await E.page.fill('#sync-token', 'abc');
  await E.page.click('button:has-text("开启同步")');
  await E.page.waitForSelector('.sync-result .sync-msg.bad');
  // 正常开启
  await E.page.fill('#sync-token', TOKEN);
  await E.page.click('button:has-text("开启同步")');
  await E.page.waitForSelector('.sync-result .sync-msg.good');
  const base = canon(await prog(E.page));
  const badgeIs = async s => until(async () => (await E.page.getAttribute('.sync-badge', 'data-state')) === s, 10000);
  const stText = () => E.page.textContent('.sync-status');

  // 5a. 401
  gh3.st.mode = '401';
  await E.page.click('.sync-actions button:has-text("立即同步")');
  ok(await badgeIs('error'), '401：状态图标变成"出错"');
  ok(/不认这个令牌/.test(await stText()), '401：提示令牌失效或被撤销，请重新填写', await stText());
  ok(canon(await prog(E.page)) === base, '401 之后本地进度不变');
  ok((await E.page.locator('#sync-token2').count()) === 1, '401：出现"换一个新令牌"的输入');
  const reqs401 = gh3.st.log.length;
  await sleep(1200);
  ok(gh3.st.log.length === reqs401, '401：停止自动同步，不再重试');
  await E.page.screenshot({ path: path.join(SHOTS, 'sync-error-401-mobile-light.png') });
  gh3.st.mode = 'ok';
  await E.page.fill('#sync-token2', TOKEN);
  await E.page.click('button:has-text("保存新令牌")');
  await E.page.waitForSelector('.sync-result .sync-msg.good');
  ok(await badgeIs('synced'), '换了新令牌后恢复同步');

  // 5b. 403 限速：读 x-ratelimit-reset，到点自动再试
  gh3.st.mode = 'rate';
  gh3.st.rateReset = Date.now() + 2500;
  await E.page.click('.sync-actions button:has-text("立即同步")');
  ok(await until(async () => /限制了请求次数/.test(await stText()), 5000), '403 限速：提示稍后自动重试', await stText());
  ok(canon(await prog(E.page)) === base, '限速之后本地进度不变');
  ok(await until(async () => (await E.page.getAttribute('.sync-badge', 'data-state')) === 'synced', 12000), '限速到点后自动恢复同步');

  // 5c. 404：Gist 被删
  gh3.st.gists.clear();
  await E.page.click('.sync-actions button:has-text("立即同步")');
  ok(await badgeIs('error'), '404：状态图标变成"出错"');
  ok(/找不到了/.test(await stText()), '404：提示 Gist 被删除', await stText());
  ok(canon(await prog(E.page)) === base, '404 之后本地进度不变');
  await E.page.click('button:has-text("重新创建云端 Gist")');
  ok(await until(() => gh3.gist() && gh3.remote()?.progress[ids[0]]?.done, 8000), '404：重新创建后云端有了本机进度');
  ok(await badgeIs('synced'), '重新创建后恢复同步');

  // 5d. 云端内容损坏
  const g = gh3.gist();
  g.files['hands-on-react-progress.json'] = '{"schema":1,"progress":{"x"';
  g.ver++;
  await E.page.click('.sync-actions button:has-text("立即同步")');
  ok(await badgeIs('error'), '内容损坏：状态图标变成"出错"');
  ok(/读不懂/.test(await stText()), '内容损坏：提示读不懂且没有覆盖', await stText());
  ok(gh3.gist().files['hands-on-react-progress.json'] === '{"schema":1,"progress":{"x"', '内容损坏：没有覆盖云端原文件');
  ok(
    Object.keys(gh3.gist().files).some(n => /backup/.test(n)),
    '内容损坏：在 Gist 里另存了原文件的备份',
  );
  ok(canon(await prog(E.page)) === base, '内容损坏之后本地进度不变');
  await E.page.screenshot({ path: path.join(SHOTS, 'sync-error-corrupt-mobile-light.png') });
  await E.page.click('button:has-text("用本机进度重建云端文件")');
  ok(await until(() => gh3.remote()?.progress[ids[0]]?.done, 8000), '内容损坏：点"重建"后云端恢复为本机进度');

  // 5e. 断网后恢复
  await badgeIs('synced');
  gh3.st.mode = 'offline';
  await E.page.goto(lessonUrl(site, ids[1]));
  await E.page.waitForSelector('#finish .btn');
  await E.page.waitForSelector('.quiz .q .opt');
  await E.page.click('#finish .btn');
  ok(
    await until(async () => (await E.page.evaluate(() => localStorage.getItem('hands-on-react-v1:sync-status') || '')).includes('"pending"'), 10000),
    '断网：状态是"有未同步的更改"并自动重试',
  );
  ok((await doneIds(E.page)).includes(ids[1]), '断网时学习进度照常保存在本机');
  gh3.st.mode = 'ok';
  ok(await until(() => gh3.remote()?.progress[ids[1]]?.done === true, 20000), '网络恢复后自动重试并推送');
  await E.page.goto(site + 'roadmap.html#sync');
  await E.page.waitForSelector('.sync-status');
  await E.page.screenshot({ path: path.join(SHOTS, 'sync-panel-on-mobile-light.png') });
  await E.ctx.close();
}

/* =============== 6. 导出、导入、恢复备份、断开 =============== */
{
  // 导出（A 已开启同步）
  await openPanel(A.page);
  const [dl] = await Promise.all([A.page.waitForEvent('download'), A.page.click('button:has-text("导出进度文件")')]);
  ok(/^hands-on-react-progress-\d{4}-\d{2}-\d{2}\.json$/.test(dl.suggestedFilename()), '导出的文件名带日期', dl.suggestedFilename());
  const tmp = path.join(ROOT, 'tests/.sync-export.json');
  await dl.saveAs(tmp);
  const text = fs.readFileSync(tmp, 'utf8');
  const exp = JSON.parse(text);
  ok(exp.schema === 1 && exp.progress[ids[0]]?.done, '导出文件带 schema 和进度');
  ok(!text.includes('ZZTESTMARKER'), '导出文件里没有令牌');
  // 导入到另一台没开同步的设备：本机有自己的一课
  const C = await device(null);
  await learn(C.page, ids[5]);
  await openPanel(C.page);
  await C.page.setInputFiles('#sync-import', tmp);
  await C.page.waitForSelector('.sync-import');
  await C.page.screenshot({ path: path.join(SHOTS, 'sync-import-light.png') });
  await C.page.click('button:has-text("与本机进度合并")');
  await C.page.waitForSelector('.sync-result .sync-msg.good');
  const merged = await doneIds(C.page);
  ok(merged.includes(ids[5]) && merged.includes(ids[0]) && merged.includes(ids[1]), '导入（合并）：本机和文件里的进度都在', merged.join());
  // 替换需要二次确认，并先备份
  await openPanel(C.page);
  await C.page.setInputFiles('#sync-import', tmp);
  await C.page.waitForSelector('.sync-import');
  await C.page.click('button:has-text("用文件替换本机进度")');
  ok((await C.page.locator('button:has-text("确认替换")').count()) === 1, '替换需要二次确认');
  await C.page.click('button:has-text("确认替换")');
  await C.page.waitForSelector('.sync-result .sync-msg.good');
  const rep = await doneIds(C.page);
  ok(!rep.includes(ids[5]) && rep.includes(ids[0]), '导入（替换）：本机进度被文件替换', rep.join());
  const bks = await C.page.evaluate(() => JSON.parse(localStorage.getItem('hands-on-react-v1:backup') || '[]'));
  ok(bks.length >= 1 && bks.length <= 2 && JSON.parse(bks[0].data)[ids[5]]?.done, '替换前自动备份了本机进度（最多留 2 份）', String(bks.length));
  // 坏文件
  fs.writeFileSync(tmp, '{"hello":1}');
  await openPanel(C.page);
  await C.page.setInputFiles('#sync-import', tmp);
  await C.page.waitForSelector('.sync-result .sync-msg.bad');
  ok(/不是“动手学 React”导出的进度文件/.test(await C.page.textContent('.sync-result')), '导入前校验：不是本站的文件会被拒绝');
  fs.writeFileSync(tmp, JSON.stringify({ schema: 99, progress: {} }));
  await C.page.setInputFiles('#sync-import', tmp);
  await C.page.waitForSelector('.sync-import');
  ok(
    /更新版本的站点/.test(await C.page.textContent('.sync-import')) && (await C.page.locator('button:has-text("与本机进度合并")').count()) === 0,
    '导入前校验 schema：比本站新的不让导入',
  );
  fs.unlinkSync(tmp);
  await C.ctx.close();

  // 恢复同步前的本地进度：B 开启同步时留了备份（备份里没有第 1 课）
  await openPanel(B.page);
  const before = await doneIds(B.page);
  gh.st.mode = 'offline';
  await B.page.click('.sync-backups li:last-child button:has-text("恢复")');
  await B.page.waitForSelector('.sync-result .sync-msg.good');
  const after = await doneIds(B.page);
  ok(after.length < before.length, '恢复同步前的本地进度：回到同步前的内容', `${before} → ${after}`);
  gh.st.mode = 'ok';
}

/* =============== 7. 断开同步 + 令牌泄露检查 =============== */
{
  await openPanel(A.page);
  await A.page.click('button:has-text("断开同步")');
  await A.page.check('.sync-check input'); // 同时删除云端 Gist
  await A.page.click('button:has-text("确认断开")');
  await A.page.waitForSelector('#sync-token');
  const ls = await A.page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  ok(!JSON.stringify(ls).includes('ZZTESTMARKER'), '断开同步后 localStorage 里没有令牌');
  ok(!Object.keys(ls).some(k => k.endsWith(':sync')), '断开同步后配置键已删除（令牌和 gist id）');
  ok(gh.st.gists.size === 0, '勾选后断开会删除云端 Gist');
  ok((await A.page.textContent('.sync-result')).includes('已断开'), '断开后给出提示');
  ok(JSON.parse(ls[KEY])[ids[0]].done, '断开同步不影响本机进度');
  const gitReqs = () => A.reqs.filter(r => /github\.com/.test(r.url)).length;
  const before = gitReqs();
  await learn(A.page, ids[6]);
  await sleep(1500);
  ok(gitReqs() === before, '断开后这个页面不再发任何到 github.com 的请求');
  ok(
    A.reqs.every(r => r.url.indexOf('ZZTESTMARKER') < 0),
    '页面请求的 URL 里从没出现令牌',
  );
  // B 断开时保留云端
  await openPanel(B.page);
  await B.page.click('button:has-text("断开同步")');
  await B.page.click('button:has-text("确认断开")');
  await B.page.waitForSelector('#sync-token');

  // 全程搜索令牌
  const leaks = [];
  for (const d of [A, B]) {
    for (const t of d.logs) if (/ZZTESTMARKER/.test(t)) leaks.push('console: ' + t);
    for (const t of d.errs) if (/ZZTESTMARKER/.test(t)) leaks.push('pageerror: ' + t);
    for (const r of d.reqs) {
      if (/ZZTESTMARKER/.test(r.url)) leaks.push('url: ' + r.url);
      if (/ZZTESTMARKER/.test(r.headers.referer || '')) leaks.push('referer');
      if (!/^https:\/\/api\.github\.com\//.test(r.url) && /ZZTESTMARKER/.test(JSON.stringify(r.headers))) leaks.push('header to ' + r.url);
    }
  }
  ok(!leaks.length, '控制台、页面错误、请求地址、Referer 和发往别处的请求头里都没有令牌', leaks.join(' | '));
  ok(!A.errs.concat(B.errs).some(e => !/boom|网络错误|天气服务超时|toUpperCase/.test(e)), '同步过程没有页面错误', A.errs.concat(B.errs).join(' | '));
}

/* =============== 7b. 后台同步不能只靠一个事件源（CI 上暴露的缺陷：引擎还没启动、锁被后台页面占着、定时器丢了） =============== */
{
  const ghs = fakeGitHub();
  ghs.st.valid.add(TOKEN);
  const remoteHas = (g, id) => g.remote()?.progress[id]?.done === true;

  // (1) 引擎还没加载好（慢设备）时就保存了进度：不能漏掉，引擎启动后要推上去
  const S = await device(ghs, { tune: { ...TUNE, bootDelay: 6000 } });
  await enable(S.page);
  await learn(S.page, ids[0]); // 整页跳转后引擎要 6 秒才启动，这期间已经保存
  ok(await until(() => remoteHas(ghs, ids[0]), 45000), '引擎启动前保存的进度，启动后也会推送到云端（不依赖启动前的事件）');
  await S.ctx.close();

  // (2) 持租约的页面被冻结（后台页面被浏览器冻结 / 丢弃）：另一个可见页面几秒内接管并推送
  const ghf = fakeGitHub();
  ghf.st.valid.add(TOKEN);
  const F = await device(ghf);
  await enable(F.page);
  await F.page.goto(site + 'roadmap.html');
  await F.page.waitForSelector('.sync-badge');
  const holder = async p => p.evaluate(() => JSON.parse(localStorage.getItem('hands-on-react-v1:sync-lease') || 'null')?.id);
  const first = await until(() => holder(F.page));
  ok(!!first, '有一个页面持有联网租约');
  const F2 = await F.ctx.newPage();
  F2.on('pageerror', e => F.errs.push(e.message));
  await F2.goto(site + 'roadmap.html');
  await F2.waitForSelector('.sync-badge');
  await F2.bringToFront();
  const cdp = await F.ctx.newCDPSession(F.page);
  await cdp.send('Page.enable');
  await cdp.send('Page.setWebLifecycleState', { state: 'frozen' }).catch(() => {});
  await sleep(300);
  await learn(F2, ids[1]);
  ok(await until(() => remoteHas(ghf, ids[1]), 45000), '持租约的页面被冻结后，另一个页面接管并把进度推送到云端');
  const second = await holder(F2);
  ok(second && second !== first, '租约换成了另一个页面', `${first} -> ${second}`);
  await cdp.send('Page.setWebLifecycleState', { state: 'active' }).catch(() => {});
  await F.ctx.close();

  // (3) 兜底：防抖定时器很久才到点（或事件丢了）时，低频检查也会把没推送的更改推出去
  const ghp = fakeGitHub();
  ghp.st.valid.add(TOKEN);
  const P = await device(ghp, { tune: { ...TUNE, debounce: 3_600_000, maxWait: 3_600_000, periodic: 2000 } });
  await enable(P.page);
  await learn(P.page, ids[0]);
  ok(await until(() => remoteHas(ghp, ids[0]), 45000), '防抖定时器没到点时，低频兜底检查也会推送没推送的更改');
  await P.ctx.close();

  // (4) 真实时长（不缩短防抖、心跳、轮询间隔）：学完一课后 6~10 秒防抖，最多半分钟内推送到云端
  const ghr = fakeGitHub();
  ghr.st.valid.add(TOKEN);
  const R = await device(ghr, { tune: null });
  await enable(R.page);
  await learn(R.page, ids[0]);
  ok(await until(() => remoteHas(ghr, ids[0]), 60000), '真实时长：学完一课后自动推送到云端');
  // 引擎已经在运行：再改一处（自我解释的笔记），推送要等防抖（6 秒，最长 10 秒）。
  // 不拿"学完一课"计时：慢设备上引擎启动晚于保存，启动后会立刻推送，那是对的
  await R.page.fill('.selfx textarea', '我的笔记：用来测试同步的防抖时长');
  const t0 = Date.now();
  const w0 = ghr.writes().length;
  ok(await until(() => ghr.remote()?.progress[ids[0]]?.note?.includes('防抖时长'), 60000), '真实时长：改动后自动推送');
  const dt = Date.now() - t0;
  ok(dt >= 4500 && dt <= 30000 * K, '真实时长：推送等了防抖（约 6 秒，不是每次改动立刻推送）', String(dt));
  ok(ghr.writes().length - w0 <= 2, '真实时长：多次输入合并成一次推送', String(ghr.writes().length - w0));
  await R.ctx.close();
}

/* =============== 8. 手机宽度与深色：面板和图标 =============== */
{
  const gh4 = fakeGitHub();
  gh4.st.valid.add(TOKEN);
  const M = await device(gh4, { viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
  await M.page.goto(site + 'roadmap.html');
  await M.page.evaluate(() => document.documentElement.classList.add('dark'));
  await learn(M.page, ids[0]);
  await enable(M.page);
  ok((await M.page.locator('.sync-phone').count()) === 0, '已开启同步后不显示手机引导块');
  await M.page.screenshot({ path: path.join(SHOTS, 'sync-panel-on-mobile-dark.png') });
  const wide = await M.page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  ok(!wide, '手机宽度（390px）下面板没有横向滚动');
  await M.page.goto(site + 'roadmap.html');
  await M.page.waitForSelector('.sync-badge');
  const box = await M.page.locator('.sync-btn').boundingBox();
  ok(box && box.x >= 0 && box.x + box.width <= 390 && box.width >= 24, '手机上顶栏同步图标可见且可点');
  await M.page.click('.sync-btn');
  await M.page.waitForSelector('#sync-pop');
  const pb = await M.page.locator('#sync-pop').boundingBox();
  ok(pb && pb.x >= 0 && pb.x + pb.width <= 390 + 1, '手机上弹层在屏幕内');
  await M.page.screenshot({ path: path.join(SHOTS, 'sync-badge-popover-mobile-dark.png'), clip: { x: 0, y: 0, width: 390, height: 260 } });
  await M.ctx.close();
}

await b.close();
close();
process.exit(done() ? 1 : 0);
