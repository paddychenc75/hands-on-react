// 第三方库（react-router、@tanstack/react-query、zustand）在实验台里的浏览器测试：
//   按需加载（只用到 React 的课不请求库文件）、版本标记、三课的真库示例无错误且行为符合课文和预测题的答案、
//   库文件被拦截时的失败提示（其余部分正常、可以重试）、tanstack-query 练习（参考答案、起始代码、常见错误、不同写法）。
// 用法：node tests/e2e/libs.mjs      （先 npm run build）
import fs from 'node:fs';
import path from 'node:path';
import { launch, openSite, lessonUrl, lessonData, checker, ROOT } from './_site.mjs';

const { site, close } = await openSite();
const b = await launch();
const { ok, done } = checker();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ROUTER = 'react-router 8.4.0';
const QUERY = '@tanstack/react-query 5.104.1';
const ZUSTAND = 'zustand 5.0.15';
const ALL_SLUGS = ['react-router', 'tanstack-query', 'zustand'];

async function open(ctx, id) {
  const p = await ctx.newPage();
  const errs = [];
  const reqs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('request', r => reqs.push(r.url()));
  p.errs = errs;
  p.reqs = reqs;
  await p.goto(lessonUrl(site, id));
  await p.evaluate(() => localStorage.clear());
  reqs.length = 0;
  await p.reload();
  await p.waitForSelector('.selfx', { timeout: 60000 });
  await p.waitForFunction(() => [...document.querySelectorAll('.pg')].some(x => x._editor), null, { timeout: 60000 });
  return p;
}
// 回答所有预测题（都选第一项），滚动让所有示例运行
async function reveal(p) {
  await p.evaluate(async () => {
    for (const pg of document.querySelectorAll('.pg')) {
      pg.scrollIntoView();
      await new Promise(r => setTimeout(r, 80));
    }
    document.querySelectorAll('.predict .opts .opt:first-child').forEach(x => x.click());
    await new Promise(r => setTimeout(r, 50));
    document.querySelectorAll('.predict .btn.primary').forEach(x => x.click());
    await new Promise(r => setTimeout(r, 1500));
  });
}
const inPg = (p, title, fn, arg) =>
  p.evaluate(
    ({ title, fn, arg }) => {
      const pg = [...document.querySelectorAll('.pg')].find(x => x.querySelector('.pg-title').textContent.includes(title));
      if (!pg) return 'NO PG ' + title;
      return new Function('pg', 'arg', 'return (' + fn + ')(pg, arg)')(pg, arg);
    },
    { title, fn: fn.toString(), arg },
  );
// 点预览区里文字完全等于 text 的按钮或链接，等 ms 毫秒，返回预览区文字（行用 | 连接）
const clickIn = (p, title, text, ms = 150) =>
  inPg(
    p,
    title,
    async (pg, { text, ms }) => {
      const el = [...pg.querySelectorAll('.preview button, .preview a')].find(x => x.textContent.trim() === text);
      if (!el) return 'NO EL ' + text;
      el.click();
      await new Promise(r => setTimeout(r, ms));
      return pg.querySelector('.preview').innerText.replace(/[\n\t]+/g, '|');
    },
    { text, ms },
  );
const preview = (p, title) => inPg(p, title, pg => pg.querySelector('.preview').innerText.replace(/[\n\t]+/g, '|'));
const consoleOf = (p, title) => inPg(p, title, pg => pg.querySelector('.console').innerText);
const runCodeIn = (p, title, code, ms = 600) =>
  inPg(
    p,
    title,
    async (pg, { code, ms }) => {
      pg._editor.value = code;
      pg._run();
      await new Promise(r => setTimeout(r, ms));
      return { text: pg.querySelector('.preview').innerText.replace(/[\n\t]+/g, '|'), cons: pg.querySelector('.console').innerText };
    },
    { code, ms },
  );
const codeOf = (p, title) => inPg(p, title, pg => pg._editor.value);
const isLib = (u, slug) => new RegExp(`/runtime/${slug}-[\\d.]+\\.dev\\.js`).test(u);

/* 0. 站点主包不含这三个库，体积在预算内（课文里记录的数字：react-router 约 470 KB、react-query 约 155 KB、zustand 约 24 KB，都不在主包里） */
{
  const dir = path.join(ROOT, 'doc_build/static/js');
  const main = fs.readdirSync(dir).filter(f => /^index\..*\.js$/.test(f));
  const text = main.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  const bytes = main.reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0);
  const total = fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.js'))
    .reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0);
  console.log(`     主包 ${main.join(',')}：${bytes} 字节；static/js 全部 ${total} 字节`);
  ok(
    !text.includes('element provided to render during initial hydration') && !text.includes('Missing queryFn') && !text.includes('zustand persist middleware'),
    '站点主包里没有 react-router、@tanstack/react-query 和 zustand 的代码',
  );
  ok(
    bytes < 1_300_000,
    '站点主包小于 1,300,000 字节（加库之前是 929,753，加 zustand 后是 943,790；之后课程数据里加了变式练习和新小节，增长到约 1,127,000）',
    String(bytes),
  );
  const rt = path.join(ROOT, 'doc_build/runtime');
  const libs = fs.readdirSync(rt).filter(f => /^(react-router|tanstack-query|zustand)-[\d.]+\.dev\.js$/.test(f));
  ok(libs.length === 3, 'doc_build/runtime 里有三个库文件', libs.join(','));
  for (const f of libs) console.log(`     ${f}：${fs.statSync(path.join(rt, f)).size} 字节`);
}

/* 1. 按需加载：只用到 React 的课不请求库文件；每个库的课只请求自己的库文件 */
for (const id of ['state', 'what-is-react']) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, id);
  await reveal(p);
  ok(
    p.reqs.some(u => /react-19\.3\.0\.dev\.js/.test(u)),
    `${id} 一课加载了 React 运行时（对照）`,
  );
  ok(
    !p.reqs.some(u => ALL_SLUGS.some(slug => isLib(u, slug))),
    `${id} 一课没有请求任何库文件（包括 zustand）`,
    p.reqs.filter(u => /runtime/.test(u)).join(','),
  );
  const tags = await p.evaluate(() => [...document.querySelectorAll('.pg-head')].map(h => h.querySelector('.pg-lib')?.hidden));
  ok(
    tags.every(t => t === true),
    `${id} 一课的实验台没有库标记`,
    tags.join(','),
  );
  ok(!(await p.evaluate(() => 'React' in window || '__hocLibs' in window)), `${id} 一课：没有加载库时，页面全局没有 __hocLibs`);
  await ctx.close();
}
for (const [id, want, name, minMini] of [
  ['router', 'react-router', ROUTER, 2],
  ['tanstack-query', 'tanstack-query', QUERY, 2],
  ['state-architecture', 'zustand', ZUSTAND, 1],
]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, id);
  await reveal(p);
  ok(
    p.reqs.some(u => isLib(u, want)),
    `${id} 一课请求了 ${want} 的库文件`,
    p.reqs.filter(u => /runtime/.test(u)).join(','),
  );
  const others = ALL_SLUGS.filter(slug => slug !== want);
  ok(!p.reqs.some(u => others.some(slug => isLib(u, slug))), `${id} 一课没有请求其他库的文件（${others.join('、')}）`);
  const info = await p.evaluate(() =>
    [...document.querySelectorAll('.pg')].map(x => [
      x.querySelector('.pg-title').textContent,
      x.querySelector('.pg-rt')?.textContent,
      x.querySelector('.pg-lib')?.hidden ? '' : x.querySelector('.pg-lib')?.textContent,
    ]),
  );
  const real = info.filter(i => i[0].includes('真库'));
  ok(
    real.length >= (id === 'router' ? 4 : id === 'tanstack-query' ? 5 : 3) && real.every(i => i[1] === 'React 19.3.0' && i[2] === name),
    `${id} 一课的真库示例标题栏显示 React 版本和 ${name}`,
    JSON.stringify(real),
  );
  const mini = info.filter(i => !i[0].includes('真库') && !i[0].includes('你的代码'));
  ok(mini.length >= minMini && mini.every(i => i[2] === ''), `${id} 一课的迷你示例没有库标记`, JSON.stringify(mini));
  const bad = await p.evaluate(() => [...document.querySelectorAll('.pg .pv-err,.pg .console .err,.pg .console .warn')].map(e => e.textContent.slice(0, 120)));
  ok(bad.length === 0, `${id} 一课的全部示例运行无错误、无警告`, bad.join(' | '));
  ok(p.errs.length === 0, `${id} 一课没有页面错误`, p.errs.join('|'));
  ok(
    await p.evaluate(
      () =>
        typeof window.React === 'undefined' &&
        typeof window.ReactRouter === 'undefined' &&
        typeof window.ReactQuery === 'undefined' &&
        typeof window.zustand === 'undefined' &&
        typeof window.Zustand === 'undefined',
    ),
    `${id} 一课：页面全局没有被库写入 React、ReactRouter、ReactQuery、zustand`,
  );
  await ctx.close();
}

/* 2. router 一课：真库示例的行为 = 课文和预测题的答案 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, 'router');
  await reveal(p);
  // 库用的是实验台的那一份 React：路由里的组件能用 useState（Hook 没报错），说明没有第二份 React
  const T1 = '真库：声明路由';
  const nav = () =>
    inPg(p, T1, pg => [...pg.querySelectorAll('.preview nav a')].map(a => a.textContent + (a.getAttribute('aria-current') ? '*' : '')).join(' '));
  ok((await nav()) === '首页* 商品 商品（end） 商品 42 不存在的页面', '路由 1：首页时只有“首页”是当前页', await nav());
  let v = await clickIn(p, T1, '商品');
  ok(
    v.includes('内存地址：/products') && v.endsWith('商品列表') && (await nav()) === '首页 商品* 商品（end）* 商品 42 不存在的页面',
    '路由 1：点 NavLink，内存地址变化，两个商品链接都是当前页',
    await nav(),
  );
  v = await clickIn(p, T1, '商品 42');
  ok(
    v.includes('内存地址：/products/42') && v.endsWith('商品详情') && (await nav()) === '首页 商品* 商品（end） 商品 42 不存在的页面',
    '路由 1：/products/42 时，不加 end 的商品链接仍是当前页，加了 end 的不是，首页不是',
    await nav(),
  );
  v = await clickIn(p, T1, '不存在的页面');
  ok(v.endsWith('404：没有这个页面'), '路由 1：兜底路由 * 显示 404');

  const T2 = '真库：动态段与嵌套';
  const r2 = await inPg(p, T2, async pg => {
    const c = t => [...pg.querySelectorAll('.preview button')].find(x => x.textContent.startsWith(t));
    const wait = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 3; i++) {
      c('布局里的计数器').click();
      await wait(40);
    }
    for (let i = 0; i < 2; i++) {
      c('详情页里的计数器').click();
      await wait(40);
    }
    await wait(80);
    const before = pg.querySelector('.preview').innerText.replace(/[\n\t]+/g, '|');
    [...pg.querySelectorAll('.preview a')].find(a => a.textContent === '看用户 2').click();
    await new Promise(r => setTimeout(r, 100));
    return { before, after: pg.querySelector('.preview').innerText.replace(/[\n\t]+/g, '|') };
  });
  ok(
    r2.before.includes('/users/1') && r2.before.includes('布局里的计数器：3') && r2.before.includes('详情页里的计数器：2'),
    '路由 2：先点出 3 和 2',
    r2.before,
  );
  ok(
    r2.after.includes('/users/2') && r2.after.includes('李四') && r2.after.includes('布局里的计数器：3') && r2.after.includes('详情页里的计数器：2'),
    '路由 2（预测题答案）：切到用户 2，布局 3、详情页 2，两个 state 都保留',
    r2.after,
  );

  const T3 = '真库：loader 运行期间';
  const r3 = await inPg(p, T3, async pg => {
    const get = () => pg.querySelector('.preview').innerText.replace(/[\n\t]+/g, '|');
    [...pg.querySelectorAll('.preview a')].find(a => a.textContent === '用户 2').click();
    await new Promise(r => setTimeout(r, 300));
    const mid = get();
    await new Promise(r => setTimeout(r, 1000));
    return { mid, end: get(), cons: pg.querySelector('.console').innerText };
  });
  ok(
    r3.mid.includes('内存地址：/|') && r3.mid.includes('导航状态：loading') && r3.mid.includes('目标地址：/users/2') && r3.mid.endsWith('首页'),
    '路由 3（预测题答案）：loader 运行期间，地址和页面仍在首页，状态 loading，目标地址 /users/2',
    r3.mid,
  );
  ok(
    r3.end.includes('内存地址：/users/2') && r3.end.includes('导航状态：idle') && r3.end.includes('目标地址：（没有）') && r3.end.endsWith('李四（上海）'),
    '路由 3：loader 返回后一起切换，状态回到 idle',
    r3.end,
  );
  ok(r3.cons.includes('loader 开始：用户 2'), '路由 3：控制台记了 loader 开始', r3.cons);
  // 运行期间再点别的链接，只有最后一次生效
  const r3b = await inPg(p, T3, async pg => {
    const link = t => [...pg.querySelectorAll('.preview a')].find(a => a.textContent === t);
    link('首页').click();
    await new Promise(r => setTimeout(r, 100));
    link('用户 2').click();
    await new Promise(r => setTimeout(r, 300));
    link('用户 1').click();
    await new Promise(r => setTimeout(r, 1500));
    return pg.querySelector('.preview').innerText.replace(/[\n\t]+/g, '|');
  });
  ok(r3b.includes('内存地址：/users/1') && r3b.endsWith('张三（北京）'), '路由 3：loader 运行期间再点另一个链接，只有最后一次生效', r3b);

  const T4 = '真库：errorElement';
  const r4 = await inPg(p, T4, async pg => {
    const link = t => [...pg.querySelectorAll('.preview a')].find(a => a.textContent === t);
    link('用户 3（不存在）').click();
    await new Promise(r => setTimeout(r, 600));
    const bad = pg.querySelector('.preview').innerText.replace(/[\n\t]+/g, '|');
    link('用户 1').click();
    await new Promise(r => setTimeout(r, 600));
    return { bad, good: pg.querySelector('.preview').innerText.replace(/[\n\t]+/g, '|') };
  });
  ok(
    r4.bad.includes('用户 3（不存在）') && r4.bad.includes('用户 1') && r4.bad.endsWith('出错了：404 找不到用户 3'),
    '路由 4（预测题答案）：导航还在，只有内容区显示错误',
    r4.bad,
  );
  ok(r4.good.endsWith('用户：张三') && r4.good.includes('/users/1'), '路由 4：再点用户 1，错误消失', r4.good);
  // errorElement 移到最外层：整个布局被替换；完全不写：自带错误页和控制台报告
  const code4 = await codeOf(p, T4);
  const root = await runCodeIn(
    p,
    T4,
    code4
      .replace('element: <UserDetail />, errorElement: <UserError /> },', 'element: <UserDetail /> },')
      .replace('element: <Layout />,\n', 'element: <Layout />,\n      errorElement: <UserError />,\n'),
  );
  ok(root.text.startsWith('内存地址') && true, '路由 4（改写后）：先显示首页');
  const rootAfter = await inPg(p, T4, async pg => {
    [...pg.querySelectorAll('.preview a')].find(a => a.textContent === '用户 3（不存在）').click();
    await new Promise(r => setTimeout(r, 600));
    return pg.querySelector('.preview').innerText.replace(/[\n\t]+/g, '|');
  });
  ok(rootAfter === '出错了：404 找不到用户 3', '路由 4（课文说的改写）：errorElement 移到最外层，整个布局被错误信息替换', rootAfter);
  await runCodeIn(p, T4, code4.replace('element: <UserDetail />, errorElement: <UserError /> },', 'element: <UserDetail /> },'));
  const none = await inPg(p, T4, async pg => {
    [...pg.querySelectorAll('.preview a')].find(a => a.textContent === '用户 3（不存在）').click();
    await new Promise(r => setTimeout(r, 600));
    return { text: pg.querySelector('.preview').innerText, cons: pg.querySelector('.console').innerText };
  });
  ok(
    none.text.includes('Unexpected Application Error!') && none.cons.includes('react-router 报告'),
    '路由 4（课文说的）：没有 errorElement 时显示自带错误页，控制台有 react-router 的报告',
    none.text.slice(0, 80) + ' / ' + none.cons,
  );
  ok(p.errs.length === 0, 'router 一课没有页面错误', p.errs.join('|'));

  // 学习者在没有库的示例里新加 import：先加载再运行
  const miniTitle = '迷你路由（Link';
  const added = await runCodeIn(p, miniTitle, "import { Link } from 'react-router';\nfunction App(){ return <p>{typeof Link}</p> }", 1500);
  ok(added.text === 'function' || added.text === 'object', '在迷你示例里新加 import react-router：自动加载后运行', JSON.stringify(added));
  await ctx.close();
}

/* 3. tanstack-query 一课：真库示例的行为 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, 'tanstack-query');
  await reveal(p);
  const T1 = '真库：useQuery 的状态字段';
  let v = await preview(p, T1);
  ok(v.includes('status|success') && v.includes('fetchStatus|idle') && v.includes('data|张三'), '查询 1：用户 1 加载完成：success、idle', v);
  v = await clickIn(p, T1, '用户 2', 100);
  ok(v.includes('status|pending') && v.includes('fetchStatus|fetching') && v.includes('isPending|true'), '查询 1：切到没有缓存的用户 2：pending、fetching', v);
  await sleep(1000);
  v = await clickIn(p, T1, '用户 3', 1200);
  ok(v.includes('status|error') && v.includes('fetchStatus|idle') && v.includes('用户 3 不存在'), '查询 1：用户 3 失败（retry: false）：error、idle', v);
  v = await clickIn(p, T1, '用户 1', 100);
  ok(
    v.includes('status|success') && v.includes('fetchStatus|fetching') && v.includes('data|张三'),
    '查询 1：切回用户 1：先显示缓存（success），同时后台请求（fetching）',
    v,
  );

  const T2 = '真库：相同的 queryKey';
  const c2 = await consoleOf(p, T2);
  ok((c2.match(/请求用户/g) || []).length === 2 && /请求用户 1/.test(c2) && /请求用户 2/.test(c2), '查询 2（预测题答案）：三个组件只发 2 次请求', c2);
  v = await clickIn(p, T2, '再挂载一个用户 1', 400);
  ok(
    (v.match(/用户 1：张三/g) || []).length === 3 && ((await consoleOf(p, T2)).match(/请求用户/g) || []).length === 2,
    '查询 2：再挂载一个用户 1：立刻有数据，不发请求（staleTime 10 秒）',
    v,
  );
  const code2 = await codeOf(p, T2);
  await runCodeIn(p, T2, code2.replace(/ *staleTime: 10_000,[^\n]*\n/, ''), 1200);
  await clickIn(p, T2, '再挂载一个用户 1', 400);
  const c2b = await consoleOf(p, T2);
  ok((c2b.match(/请求用户/g) || []).length === 3, '查询 2（课文说的改写）：去掉 staleTime，再挂载一个用户 1 会多一次请求', c2b);

  const T3 = '真库：staleTime 决定';
  await runCodeIn(p, T3, await codeOf(p, T3), 1200);
  await clickIn(p, T3, '隐藏时钟', 100);
  v = await clickIn(p, T3, '显示时钟', 150);
  ok(v.includes('第 1 次请求') && v.includes('后台刷新中'), '查询 3：staleTime 为 0，重新显示：先显示旧数据，并在后台刷新', v);
  await sleep(900);
  ok(((await consoleOf(p, T3)).match(/请求服务器时间/g) || []).length === 2, '查询 3：重新显示后多了 1 次请求');
  await inPg(p, T3, pg => {
    const sel = pg.querySelector('.preview select');
    const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    set.call(sel, '30000');
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sleep(100);
  await clickIn(p, T3, '隐藏时钟', 100);
  v = await clickIn(p, T3, '显示时钟', 600);
  ok(
    v.includes('第 2 次请求') && !v.includes('后台刷新中') && ((await consoleOf(p, T3)).match(/请求服务器时间/g) || []).length === 2,
    '查询 3：staleTime 为 30 秒，重新显示：不请求',
    v,
  );

  const T4 = '真库：mutation 成功后不失效缓存';
  v = await clickIn(p, T4, '添加一条', 1100);
  const c4 = await consoleOf(p, T4);
  ok(
    v.split('|').filter(x => /^(读完这一课|写一个 useQuery|新任务)/.test(x)).length === 2 && c4.includes('POST 添加') && c4.includes('服务器里有 3 条'),
    '查询 4（预测题答案）：服务器有 3 条，列表仍是 2 项',
    v + ' / ' + c4,
  );
  const code4 = await codeOf(p, T4);
  const withInv = await runCodeIn(p, T4, code4.replace('// client.invalidateQueries', 'client.invalidateQueries'), 800);
  void withInv;
  v = await clickIn(p, T4, '添加一条', 1200);
  const c4b = await consoleOf(p, T4);
  ok(
    v.split('|').filter(x => /^(读完这一课|写一个 useQuery|新任务)/.test(x)).length === 3 && (c4b.match(/GET 待办/g) || []).length === 2,
    '查询 4（课文说的改写）：取消注释 invalidateQueries 后，列表自动变成 3 项，多一次 GET',
    v + ' / ' + c4b,
  );

  const T5 = '真库：乐观更新';
  const r5 = await inPg(p, T5, async pg => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const items = () => [...pg.querySelectorAll('.preview li')].map(l => l.textContent);
    const add = () => [...pg.querySelectorAll('.preview button')].find(x => x.textContent === '添加一条').click();
    await wait(400);
    add();
    await wait(150);
    const optimistic = items();
    await wait(1500);
    const settled = items();
    const box = pg.querySelector('.preview input[type=checkbox]');
    box.click();
    await wait(50);
    add();
    await wait(150);
    const optimistic2 = items();
    await wait(1500);
    return { optimistic, settled, optimistic2, rolled: items(), msg: pg.querySelector('.preview p').textContent };
  });
  ok(r5.optimistic.length === 2 && r5.optimistic[1].includes('保存中'), '查询 5：点添加，新项立刻出现（保存中）', JSON.stringify(r5));
  ok(r5.settled.length === 2 && !r5.settled[1].includes('保存中'), '查询 5：成功后换成服务器的正式数据', JSON.stringify(r5));
  ok(
    r5.optimistic2.length === 3 && r5.rolled.length === 2 && r5.msg.includes('已回滚'),
    '查询 5：服务器拒绝时，新项先出现，随后回滚并提示',
    JSON.stringify(r5),
  );
  ok(p.errs.length === 0, 'tanstack-query 一课没有页面错误', p.errs.join('|'));
  await ctx.close();
}

/* 3b. state-architecture 一课：zustand 真库示例的行为 = 课文和预测题的答案 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, 'state-architecture');
  await reveal(p);
  const wait = ms => sleep(ms);
  const T1 = '真库：create、选择器与组件外读写';
  let v = await preview(p, T1);
  ok(v.includes('熊：0') && v.includes('蜂蜜：10'), 'zustand 1：初始熊 0、蜂蜜 10', v);
  await inPg(p, T1, pg => {
    pg.querySelector('.console').innerHTML = '';
  });
  v = await clickIn(p, T1, '组件外：蜂蜜 +5', 200);
  let c = await consoleOf(p, T1);
  ok(
    v.includes('蜂蜜：15') && c.trim().split('\n').join('|') === 'store 变了：蜂蜜 10 → 15|HoneyPot 渲染',
    'zustand 1（预测题答案）：组件外 setState，先是 subscribe 的日志，然后只有 HoneyPot 渲染',
    v + ' / ' + c,
  );
  await inPg(p, T1, pg => {
    pg.querySelector('.console').innerHTML = '';
  });
  v = await clickIn(p, T1, '加一只熊', 200);
  c = await consoleOf(p, T1);
  ok(
    v.includes('熊：1') && c.trim().split('\n').join('|') === 'store 变了：蜂蜜 15 → 15|BearCounter 渲染',
    'zustand 1：加熊时蜂蜜没变，subscribe 仍被调用，只有 BearCounter 渲染',
    v + ' / ' + c,
  );
  await clickIn(p, T1, '组件外：读一下', 100);
  ok((await consoleOf(p, T1)).includes('getState： {"bears":1,"honey":15}'), 'zustand 1：getState 在组件外读到当前 state', await consoleOf(p, T1));

  const T2 = '真库：persist 持久化';
  const KEY = 'hoc-demo-zustand';
  const ls = k => p.evaluate(k => localStorage.getItem(k), k);
  ok((await ls(KEY)) === null, 'zustand 2：初始没有 hoc-demo-zustand 这个键');
  v = await preview(p, T2);
  ok(v.includes('计数：0') && v.includes('存储位置：localStorage'), 'zustand 2：初始计数 0，存储位置是 localStorage', v);
  const progressBefore = await ls('hands-on-react-v1');
  for (let i = 0; i < 3; i++) v = await clickIn(p, T2, '+1', 60);
  ok(v.includes('计数：3') && v.includes('{"state":{"count":3},"version":0}'), 'zustand 2：点三次，计数 3，存储里是 {"state":{"count":3},"version":0}', v);
  ok((await ls(KEY)) === '{"state":{"count":3},"version":0}', 'zustand 2：localStorage 里只写了 hoc-demo-zustand 这个键', await ls(KEY));
  ok((await ls('hands-on-react-v1')) === progressBefore, 'zustand 2：没有改动学习进度的键 hands-on-react-v1');
  // 重新运行 = 刷新页面：新 store 把存储读回来
  await inPg(p, T2, pg => pg._run());
  await wait(600);
  v = await preview(p, T2);
  ok(v.includes('计数：3'), 'zustand 2（预测题答案）：重新运行后计数仍是 3', v);
  v = await clickIn(p, T2, '清除存储并重置', 100);
  ok(v.includes('计数：0') && v.includes('存储里的内容：（没有）'), 'zustand 2：清除后计数回到 0，存储里没有内容', v);
  ok((await ls(KEY)) === null, 'zustand 2：清除后 hoc-demo-zustand 键被删除（没有被 setState 又写回去）', await ls(KEY));
  ok((await ls('hands-on-react-v1')) === progressBefore, 'zustand 2：清除没有动学习进度的键');
  await inPg(p, T2, pg => pg._run());
  await wait(600);
  v = await preview(p, T2);
  ok(v.includes('计数：0'), 'zustand 2：清除后重新运行，仍是初始值 0', v);
  // localStorage 不可用：退回内存存储，示例仍能用，重新运行后丢失
  await p.evaluate(() => {
    window.__lsDesc = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('denied');
      },
    });
  });
  await inPg(p, T2, pg => pg._run());
  await wait(600);
  await clickIn(p, T2, '+1', 60);
  v = await clickIn(p, T2, '+1', 60);
  ok(v.includes('计数：2') && v.includes('存储位置：内存（localStorage 不可用）'), 'zustand 2：localStorage 不可用时退回内存存储，仍能计数', v);
  await inPg(p, T2, pg => pg._run());
  await wait(600);
  v = await preview(p, T2);
  ok(v.includes('计数：0'), 'zustand 2：内存存储在重新运行后丢失', v);
  ok(!(await consoleOf(p, T2)).includes('unavailable'), 'zustand 2：退回内存存储时没有 persist 的“存储不可用”警告', await consoleOf(p, T2));
  await p.evaluate(() => {
    Object.defineProperty(window, 'localStorage', window.__lsDesc);
  });

  const T3 = '真库：选择器返回新对象与 useShallow';
  v = await clickIn(p, T3, '挂载写法 A', 500);
  c = await consoleOf(p, T3);
  ok(
    v.startsWith('捕获到：Maximum update depth exceeded'), // getSnapshot 的警告在 React 里每个页面只发一次，前面的示例可能已经触发过，所以不查控制台
    'zustand 3（预测题答案）：v5 里选择器返回新对象，无限渲染，超过上限报错，由 Box 接住',
    v + ' / ' + c.slice(0, 120),
  );
  await inPg(p, T3, pg => {
    pg.querySelector('.console').innerHTML = '';
  });
  v = await clickIn(p, T3, '挂载写法 B', 300);
  ok(v.startsWith('B：a = 1，b = 2'), 'zustand 3：写法 B（useShallow）正常显示', v);
  await inPg(p, T3, pg => {
    pg.querySelector('.console').innerHTML = '';
  });
  for (let i = 0; i < 3; i++) await clickIn(p, T3, '改 c', 60);
  await wait(100);
  ok(((await consoleOf(p, T3)).match(/PairB 渲染/g) || []).length === 0, 'zustand 3：改 c 三次，PairB 没有重新渲染');
  v = await clickIn(p, T3, '改 a', 100);
  ok(v.startsWith('B：a = 2，b = 2') && ((await consoleOf(p, T3)).match(/PairB 渲染/g) || []).length === 1, 'zustand 3：改 a 一次，PairB 重新渲染一次', v);
  ok(p.errs.length === 0, 'state-architecture 一课没有页面错误', p.errs.join('|'));
  await ctx.close();
}

/* 4. 库文件被拦截：真库示例显示加载失败提示，其余部分（课文、测验、迷你示例、练习）正常；放开后离开再回来可以重试 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const handler = r => r.abort();
  await ctx.route('**/runtime/react-router-*.js', handler);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(lessonUrl(site, 'router'));
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForSelector('.selfx', { timeout: 60000 });
  await p.waitForFunction(() => document.querySelectorAll('.pv-err').length >= 4, null, { timeout: 30000 });
  await sleep(1500);
  const Lr = await lessonData('router');
  const r = await p.evaluate(() => ({
    errs: [...document.querySelectorAll('.pv-err')].map(e => e.textContent),
    prose: document.querySelector('.prose').textContent.length,
    quiz: document.querySelectorAll('.quiz .q').length,
    pg: [...document.querySelectorAll('.pg')].map(x => x.querySelector('.pg-title').textContent),
  }));
  ok(
    r.errs.length === 4 && r.errs.every(e => e.includes('运行环境加载失败（react-router），请检查网络后刷新页面')),
    '库文件被拦截：4 个真库示例都显示“运行环境加载失败（react-router）…”',
    r.errs.join('|'),
  );
  ok(r.prose > 1000 && r.quiz === Lr.quiz.length, '拦截时课文、测验正常显示');
  ok(r.pg.length === 4 && r.pg.every(t => !t.includes('真库')), '拦截时迷你示例和练习的实验台仍然出现', r.pg.join(','));
  await p.evaluate(async () => {
    for (const pg of document.querySelectorAll('.pg')) {
      pg.scrollIntoView();
      await new Promise(r => setTimeout(r, 80));
    }
  });
  await sleep(800);
  await reveal(p);
  const miniOk = await p.evaluate(() =>
    [...document.querySelectorAll('.pg')].every(x => !x.querySelector('.pv-err') && x.querySelector('.preview').innerText.length > 0),
  );
  ok(miniOk, '拦截时迷你示例和练习照常运行');
  await ctx.unroute('**/runtime/react-router-*.js', handler);
  await p.locator('.rp-doc-layout__sidebar a[href$="lessons/closures.html"]').first().click();
  await p.waitForURL(/lessons\/closures/);
  await sleep(500);
  await p.locator('.rp-doc-layout__sidebar a[href$="lessons/router.html"]').first().click();
  await p.waitForURL(/lessons\/router/);
  await p.waitForFunction(() => [...document.querySelectorAll('.pg')].some(x => x._editor), null, { timeout: 60000 });
  await reveal(p);
  const again = await p.evaluate(() => ({
    errs: document.querySelectorAll('.pv-err').length,
    libs: [...document.querySelectorAll('.pg-lib')].filter(x => !x.hidden).length,
  }));
  ok(again.errs === 0 && again.libs === 4, '放开拦截后离开再回到本课：真库示例加载成功', JSON.stringify(again));
  ok(errs.length === 0, '拦截期间没有页面错误', errs.join('|'));
  await ctx.close();
}

/* 4b. zustand 库文件被拦截：三个真库示例显示加载失败提示，迷你示例和练习正常 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**/runtime/zustand-*.js', r => r.abort());
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(lessonUrl(site, 'state-architecture'));
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForSelector('.selfx', { timeout: 60000 });
  await p.waitForFunction(() => document.querySelectorAll('.pv-err').length >= 3, null, { timeout: 30000 });
  await sleep(1000);
  await reveal(p);
  const r = await p.evaluate(() => ({
    errs: [...document.querySelectorAll('.pv-err')].map(e => e.textContent),
    prose: document.querySelector('.prose').textContent.length,
    pg: [...document.querySelectorAll('.pg')].map(x => x.querySelector('.pg-title').textContent),
    mini: [...document.querySelectorAll('.pg')].filter(x => !x.querySelector('.pv-err')).every(x => x.querySelector('.preview').innerText.length > 0),
  }));
  ok(
    r.errs.length === 3 && r.errs.every(e => e.includes('运行环境加载失败（zustand），请检查网络后刷新页面')),
    '库文件被拦截：3 个 zustand 真库示例都显示“运行环境加载失败（zustand）…”',
    r.errs.join('|'),
  );
  ok(r.prose > 1000, '拦截 zustand 时课文正常显示');
  ok(r.mini, '拦截 zustand 时迷你示例和练习照常运行');
  ok(errs.length === 0, '拦截 zustand 期间没有页面错误', errs.join('|'));
  await ctx.close();
}

/* 5. tanstack-query 的练习：参考答案通过；起始代码被拒；常见错误被拒；不同写法通过 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, 'tanstack-query');
  const L = await lessonData('tanstack-query');
  const check = code =>
    p.evaluate(async code => {
      const btn = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '✓ 检查答案');
      let pg = btn;
      while (pg && !pg._editor) pg = pg.parentElement;
      pg._editor.value = code;
      await new Promise(r => setTimeout(r, 300));
      btn.click();
      for (let i = 0; i < 150 && btn.disabled; i++) await new Promise(r => setTimeout(r, 100));
      await new Promise(r => setTimeout(r, 200));
      return pg.querySelector('.result').innerText;
    }, code);
  const sol = L.exercise.solution;
  const swap = (a, b2) => {
    if (!sol.includes(a)) throw new Error('测试用的替换片段不在参考答案里：' + a);
    return sol.replace(a, b2);
  };
  const pass = r => r.includes('通过') && !r.startsWith('✗');
  const r0 = await check(L.exercise.starter);
  ok(r0.startsWith('✗'), '练习：起始代码被拒', r0.slice(0, 120));
  const r1 = await check(sol);
  ok(pass(r1), '练习：参考答案通过', r1.slice(0, 160));
  const r2 = await check(swap("queryKey: ['user', id],", "queryKey: ['user'],"));
  ok(r2.startsWith('✗') && r2.includes('queryKey'), '练习：queryKey 漏了 id 被拒', r2.slice(0, 160));
  const r3 = await check(swap('    retry: false,\n', ''));
  ok(r3.startsWith('✗') && r3.includes('retry'), '练习：没有关掉重试，用户 4 的错误迟迟不出现，被拒', r3.slice(0, 200));
  const r4 = await check(swap('    staleTime: 60_000,\n', ''));
  ok(r4.startsWith('✗') && r4.includes('staleTime'), '练习：没有设置 staleTime，切回用户 1 会再请求，被拒', r4.slice(0, 160));
  const alt = swap(
    /function UserCard[\s\S]*?\n}\n/.exec(sol)[0],
    `function UserCard({ id }) {
  const q = useQuery({ queryKey: ['user', id], queryFn: () => fetchUser(id), staleTime: Infinity });
  if (q.status === 'pending') return <p id="loading">加载中…</p>;
  if (q.status === 'error') return <p id="error">出错了：{q.error.message}</p>;
  return <p id="user">{q.data.name}</p>;
}
`,
  ).replace('new QueryClient()', 'new QueryClient({ defaultOptions: { queries: { retry: false } } })');
  const r5 = await check(alt);
  ok(pass(r5), '练习：不同写法（status、staleTime: Infinity、在 QueryClient 里关重试）通过', r5.slice(0, 200));
  await ctx.close();
}

await b.close();
close();
process.exit(done() ? 1 : 0);
