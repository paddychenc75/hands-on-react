// 第三方库（react-router、@tanstack/react-query）在实验台里的浏览器测试：
//   按需加载（只用到 React 的课不请求库文件）、版本标记、两课的真库示例无错误且行为符合课文和预测题的答案、
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

/* 0. 站点主包不含这两个库，体积在预算内（课文里记录的数字：react-router 约 470 KB、react-query 约 155 KB，都不在主包里） */
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
    !text.includes('element provided to render during initial hydration') && !text.includes('Missing queryFn'),
    '站点主包里没有 react-router 和 @tanstack/react-query 的代码',
  );
  ok(bytes < 1_000_000, '站点主包小于 1,000,000 字节（加库之前是 929,753，加库之后是 943,790）', String(bytes));
  const rt = path.join(ROOT, 'doc_build/runtime');
  const libs = fs.readdirSync(rt).filter(f => /^(react-router|tanstack-query)-[\d.]+\.dev\.js$/.test(f));
  ok(libs.length === 2, 'doc_build/runtime 里有两个库文件', libs.join(','));
  for (const f of libs) console.log(`     ${f}：${fs.statSync(path.join(rt, f)).size} 字节`);
}

/* 1. 按需加载：只用到 React 的课不请求库文件；router 课只请求 react-router；tanstack-query 课只请求 @tanstack/react-query */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, 'state');
  await reveal(p);
  ok(
    p.reqs.some(u => /react-19\.3\.0\.dev\.js/.test(u)),
    'state 一课加载了 React 运行时（对照）',
  );
  ok(
    !p.reqs.some(u => isLib(u, 'react-router') || isLib(u, 'tanstack-query')),
    'state 一课没有请求任何库文件',
    p.reqs.filter(u => /runtime/.test(u)).join(','),
  );
  const tags = await p.evaluate(() => [...document.querySelectorAll('.pg-head')].map(h => h.querySelector('.pg-lib')?.hidden));
  ok(
    tags.every(t => t === true),
    'state 一课的实验台没有库标记',
    tags.join(','),
  );
  ok(!(await p.evaluate(() => 'React' in window || '__hocLibs' in window)), '没有加载库时，页面全局没有 __hocLibs');
  await ctx.close();
}
for (const [id, want, notWant, name] of [
  ['router', 'react-router', 'tanstack-query', ROUTER],
  ['tanstack-query', 'tanstack-query', 'react-router', QUERY],
]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, id);
  await reveal(p);
  ok(
    p.reqs.some(u => isLib(u, want)),
    `${id} 一课请求了 ${want} 的库文件`,
    p.reqs.filter(u => /runtime/.test(u)).join(','),
  );
  ok(!p.reqs.some(u => isLib(u, notWant)), `${id} 一课没有请求 ${notWant} 的库文件`);
  const info = await p.evaluate(() =>
    [...document.querySelectorAll('.pg')].map(x => [
      x.querySelector('.pg-title').textContent,
      x.querySelector('.pg-rt')?.textContent,
      x.querySelector('.pg-lib')?.hidden ? '' : x.querySelector('.pg-lib')?.textContent,
    ]),
  );
  const real = info.filter(i => i[0].includes('真库'));
  ok(
    real.length >= 3 && real.every(i => i[1] === 'React 19.3.0' && i[2] === name),
    `${id} 一课的真库示例标题栏显示 React 版本和 ${name}`,
    JSON.stringify(real),
  );
  const mini = info.filter(i => !i[0].includes('真库') && !i[0].includes('你的代码'));
  ok(mini.length >= 2 && mini.every(i => i[2] === ''), `${id} 一课的迷你示例没有库标记`, JSON.stringify(mini));
  const bad = await p.evaluate(() => [...document.querySelectorAll('.pg .pv-err,.pg .console .err,.pg .console .warn')].map(e => e.textContent.slice(0, 120)));
  ok(bad.length === 0, `${id} 一课的全部示例运行无错误、无警告`, bad.join(' | '));
  ok(p.errs.length === 0, `${id} 一课没有页面错误`, p.errs.join('|'));
  ok(
    await p.evaluate(() => typeof window.React === 'undefined' && typeof window.ReactRouter === 'undefined' && typeof window.ReactQuery === 'undefined'),
    `${id} 一课：页面全局没有被库写入 React、ReactRouter、ReactQuery`,
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
  const T6 = '真库：分页与 keepPreviousData';
  v = await preview(p, T6);
  ok(v.includes('文章 1|文章 2|文章 3|文章 4|文章 5') && v.includes('第 1 页 / 共 5 页'), '查询 6：第 1 页加载完成', v);
  v = await clickIn(p, T6, '下一页', 150);
  ok(
    v.includes('文章 1|') && v.includes('第 2 页 / 共 5 页') && v.includes('请求中') && !v.includes('首次加载中'),
    '查询 6（预测题答案）：换页等待时，仍显示第 1 页的文章，页码已是 2',
    v,
  );
  await sleep(900);
  v = await preview(p, T6);
  ok(v.includes('文章 6|文章 7|文章 8|文章 9|文章 10') && !v.includes('请求中'), '查询 6：第 2 页回来后换成文章 6 到 10', v);
  v = await clickIn(p, T6, '上一页', 100);
  ok(v.includes('文章 1|') && !v.includes('首次加载中'), '查询 6：回到看过的第 1 页，立刻显示缓存', v);
  await sleep(900);
  for (let i = 0; i < 4; i++) {
    await clickIn(p, T6, '下一页', 100);
    await sleep(900);
  }
  v = await preview(p, T6);
  ok(
    v.includes('文章 21|文章 22|文章 23') &&
      v.includes('第 5 页 / 共 5 页') &&
      (await inPg(p, T6, pg => [...pg.querySelectorAll('.preview button')].find(x => x.textContent === '下一页').disabled)) === true,
    '查询 6：最后一页只有 3 篇，“下一页”被禁用',
    v,
  );
  const code6 = await codeOf(p, T6);
  await runCodeIn(p, T6, code6.replace(/ *placeholderData: keepPreviousData,[^\n]*\n/, ''), 1200);
  v = await clickIn(p, T6, '下一页', 150);
  ok(v.includes('首次加载中') && !v.includes('文章 1|'), '查询 6（课文说的改写）：去掉 keepPreviousData，换页时闪回“首次加载中…”', v);

  const T7 = '真库：useInfiniteQuery 加载更多';
  v = await preview(p, T7);
  ok(v.includes('动态 1|动态 2|动态 3|动态 4') && v.includes('已加载 1 页，共 4 条') && v.includes('加载更多'), '查询 7：第一页加载完成', v);
  v = await clickIn(p, T7, '加载更多', 100);
  ok(v.includes('加载中…') && v.includes('已加载 1 页'), '查询 7：请求下一页期间按钮显示“加载中…”', v);
  await sleep(800);
  v = await clickIn(p, T7, '加载更多', 900);
  const c7 = await consoleOf(p, T7);
  ok(
    v.includes('已加载 3 页，共 10 条') && v.includes('没有更多了') && (c7.match(/请求 cursor/g) || []).length === 3,
    '查询 7（预测题答案）：3 行请求、10 条，按钮变成“没有更多了”',
    v + ' / ' + c7,
  );
  const code7 = await codeOf(p, T7);
  const falsy = await runCodeIn(p, T7, code7.replace('next < ALL.length ? next : undefined', 'next < ALL.length ? next : false'), 800);
  void falsy;
  await clickIn(p, T7, '加载更多', 800);
  await clickIn(p, T7, '加载更多', 800);
  v = await clickIn(p, T7, '加载更多', 100);
  ok(v.includes('加载中…') || v.includes('已加载 4 页'), '查询 7（checkOnly 的答案）：getNextPageParam 返回 false 时 hasNextPage 仍为 true，还能继续请求', v);
  const withInv7 = code7.replace('<p>已加载', "<button onClick={() => queryClient.invalidateQueries({ queryKey: ['feed'] })}>刷新</button><p>已加载");
  await runCodeIn(p, T7, withInv7, 800);
  await clickIn(p, T7, '加载更多', 800);
  await clickIn(p, T7, '刷新', 2500);
  const c7b = await consoleOf(p, T7);
  ok(
    /cursor=0[\s\S]*cursor=4[\s\S]*cursor=0[\s\S]*cursor=4/.test(c7b.replace(/\n/g, ' ')) && (c7b.match(/请求 cursor/g) || []).length === 4,
    '查询 7（课文说的）：数据失效后，按顺序重新请求已加载的每一页',
    c7b,
  );
  ok(p.errs.length === 0, 'tanstack-query 一课没有页面错误', p.errs.join('|'));
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
