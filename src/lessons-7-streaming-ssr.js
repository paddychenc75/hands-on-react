/* ========== 第 39 课：流式 SSR、选择性水合与 RSC 缓存（阶段 6 深入） ========== */
(() => {
const pre = (src) => '<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">'
  + src.replace(/^\n/, '').replace(/\n\s*$/, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  + '</code></pre></div>';

lesson({
  id: 'streaming-ssr', stage: 5, title: '流式 SSR、选择性水合与 RSC 缓存', mins: 40,
  summary: 'HTML 怎样分批到达，哪一块先能点，服务端数据缓存多久。在浏览器里亲手水合一段“服务端 HTML”，再修好一个水合不匹配。',
  goals: [
    '能解释 renderToString 与 renderToPipeableStream 的区别，并说出 Suspense 边界怎样决定首批 HTML 包含什么',
    '能预测选择性水合的顺序：用户点击的区块先水合，其他区块的未完成工作被丢弃后重做',
    '能诊断水合不匹配的四类原因，并用 effect 或 getServerSnapshot 写出首次渲染与服务端一致的组件',
    '能判断一份数据该用哪种缓存与重新验证方式，并说出 Next.js 14、15、16 的默认行为差异',
  ],
  keyPoints: [
    'renderToString 一次性返回整页 HTML，不能流式发送。renderToPipeableStream 先发“外壳”（Suspense 边界之外的部分），每个边界的内容准备好后再单独发送。',
    'Suspense 边界是流式发送和水合的最小单位。React 18 逐个边界水合，用户与哪个边界交互，哪个边界就先水合。',
    '水合要求首次渲染与服务端 HTML 一致。React 18 遇到文字不一致时，把最近的 Suspense 边界（没有边界就是整个根）改为客户端渲染，并调用 onRecoverableError。属性不一致只在开发版警告一次，也不会被修正。',
    '修复方法：首次渲染输出服务端能算出的值，水合后再换成客户端的值。用 useEffect，或用 useSyncExternalStore 的 getServerSnapshot。id 用 useId，HTML 嵌套要有效。',
    'RSC 的缓存分层：React 的 cache() 只在一次请求内去重；Next.js 的数据缓存跨请求。默认值随版本变化：14 默认缓存 fetch，15 默认不缓存，16 用 \'use cache\' 显式声明。',
  ],
  body: [
    p('第 29 课讲了服务端组件的边界规则和一次请求的六个步骤。本课往下挖三个问题。'),
    p('<ol class="task-steps"><li>HTML 怎样分批到达浏览器？</li><li>哪一块先能点？</li><li>服务端拿到的数据，能缓存多久？</li></ol>'),
    p('<b>哪些能运行：</b><code>ReactDOM.hydrateRoot</code> 在本页的 React 18.3.1 中可以运行。本页没有加载 <code>react-dom/server</code>，所以示例里的“服务端 HTML”是手写的字符串，格式与 React 18 的真实输出相同。服务端 API 和 Next.js 的代码只能阅读。'),

    h('一、renderToString 与流式渲染'),
    p('<b>流式 SSR</b> 指服务器边渲染边发送 HTML，不等整页都准备好。React 18 提供了两类服务端 API：'),
    table(['', 'renderToString', 'renderToPipeableStream（Node）/ renderToReadableStream（Web Streams）'], [
      ['返回什么', '一个完整的字符串', '一个流，可以分多次写给浏览器'],
      ['遇到数据还没准备好的组件', '不等待。该 Suspense 边界输出 fallback，由浏览器再渲染内容', '先发 fallback，数据好了再把内容发出去，并附一段替换脚本'],
      ['首字节时间', '取决于最慢的那部分', '取决于外壳'],
      ['适合', '旧项目、无数据依赖的页面', '有慢数据的页面；框架（Next.js、Remix）内部都用它'],
    ]),
    p('<b>外壳</b>（shell）指所有 Suspense 边界之外的部分。外壳渲染完，<code>onShellReady</code> 就会被调用，服务器开始发送。'),
    code(`
import { renderToPipeableStream } from 'react-dom/server';

app.get('/product/:id', (req, res) => {
  let didError = false;
  const { pipe, abort } = renderToPipeableStream(<App url={req.url} />, {
    bootstrapScripts: ['/main.js'],      // 浏览器端：hydrateRoot(document, <App />)
    onShellReady() {
      // 外壳好了：状态码和响应头只能在这里决定，开始发送后就改不了
      res.statusCode = didError ? 500 : 200;
      res.setHeader('Content-Type', 'text/html');
      pipe(res);
    },
    onShellError() {
      res.statusCode = 500;               // 外壳都渲染不出来：发一个兜底页面
      res.send('<h1>出错了</h1>');
    },
    onError(err) {
      didError = true;                    // 边界内部出错：该边界改由浏览器渲染
      console.error(err);
    },
  });
  setTimeout(abort, 10000);               // 超时：还没完成的边界交给浏览器渲染
});`, '只能阅读：Node 服务端代码。给搜索引擎爬虫时，改在 onAllReady 里 pipe，等全部内容就绪'),
    p('流里的 HTML 大致分两批。第一批里，没准备好的边界只是一个占位：'),
    code(`
<!-- 第一批：外壳 + fallback -->
<header>…</header>
<!--$?--><template id="B:0"></template><p>评论加载中…</p><!--/$-->
<footer>…</footer>

<!-- 几秒后，同一个响应里的第二批：真正的内容 + 一段替换脚本 -->
<div hidden id="S:0"><ul><li>很好用</li>…</ul></div>
<script>$RC("B:0", "S:0")<\/script>`, '只能阅读：React 18 流式输出的简化形式。<!--$--> 表示已完成的边界，<!--$?--> 表示还在等待'),
    p('注意 footer 在第一批里。边界之后的内容不用等边界。所以边界放在哪里，决定了用户先看到什么。'),
    ul([
      '<b>边界太粗</b>：一个边界包住整页，等于没有流式。',
      '<b>边界太细</b>：十几个区块各自弹出，页面不停跳动。按“用户会一起看的内容”分组。',
      '<b>外壳里不要放慢数据</b>：外壳里有一个组件等 2 秒，整页的首字节就晚 2 秒。',
    ]),

    h('二、选择性水合：哪一块先能点'),
    p('React 17 的水合是整页一次完成。任何一块的 JS 没下载完，整页都不能交互。'),
    p('React 18 把每个 Suspense 边界当作独立的水合单位。外壳先水合，各边界随后以低优先级逐个水合。<b>选择性水合</b>指：用户点击一个还没水合的边界，React 就先水合这个边界。'),
    p('下面每个区块的渲染故意占用主线程 500 毫秒。点按钮开始水合，然后立刻点“页脚”。'),
    Object.assign(play(`
import { useState, useEffect, useRef, Suspense } from 'react';
import { hydrateRoot } from 'react-dom/client';

const BLOCKS = ['评论', '推荐', '页脚'];
let t0 = 0;
const stamp = () => Math.round(performance.now() - t0) + 'ms';

// 故意很慢的组件：每次渲染占用主线程 500 毫秒
function SlowBlock({ name }) {
  const [clicks, setClicks] = useState(0);
  const end = performance.now() + 500;
  while (performance.now() < end) {}
  useEffect(() => { console.log(stamp(), name + '：水合完成'); }, []);
  return (
    <button onClick={() => { console.log(stamp(), name + '：收到点击'); setClicks(clicks + 1); }}>
      {name + '（点击 ' + clicks + '）'}
    </button>
  );
}

// 手写的服务端 HTML。<!--$--> 和 <!--/$--> 是 React 给 Suspense 边界做的记号
const SERVER_HTML = BLOCKS
  .map(n => '<!--$--><button>' + n + '（点击 0）</button><!--/$-->')
  .join('');

function App() {
  const box = useRef(null);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (run === 0) return;
    const el = document.createElement('div');
    el.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
    el.innerHTML = SERVER_HTML;
    box.current.replaceChildren(el);
    t0 = performance.now();
    console.log('0ms 开始水合');
    const root = hydrateRoot(el, (
      <>
        {BLOCKS.map(n => (
          <Suspense key={n} fallback={null}><SlowBlock name={n} /></Suspense>
        ))}
      </>
    ), { onRecoverableError: (e) => console.log('可恢复错误：' + e.message) });
    return () => { Promise.resolve().then(() => root.unmount()); };
  }, [run]);
  return (
    <div>
      <button onClick={() => setRun(r => r + 1)}>载入服务端 HTML 并开始水合</button>
      <div ref={box} style={{ marginTop: 8 }} />
    </div>
  );
}`, '选择性水合：点哪块，哪块先水合', '只要在 1.5 秒内点了“页脚”，它就第一个“水合完成”，并立刻“收到点击”。过程是：React 每渲染完一个区块就让出主线程，浏览器趁机处理点击。React 发现目标在未水合的边界里，就同步水合这个边界，再把点击交给它。之前渲染了一半的区块还没有提交，要重新渲染。所以总时间变长了，但用户点的那块最早能用。不点的话，三块按顺序渲染，一起提交。'), {
      predict: {
        q: '点“载入服务端 HTML 并开始水合”，然后立刻点“页脚”按钮。控制台里哪一块最先打印“水合完成”？',
        options: ['评论：它排在第一个，React 按顺序水合', '页脚：用户点了它，它被提前', '三块同时打印：它们在同一次提交里完成', '都不会打印：点击打断了水合，需要刷新页面'],
        answer: 1,
        explain: '用户点击未水合的边界时，React 18 会同步水合这个边界，再分发这次点击。最迷惑的是“三块同时”：不点击时确实如此，因为三个边界在同一次低优先级渲染里完成。点击会打断这次渲染，“页脚”单独先提交。',
      },
      pkey: 'streaming-ssr|选择性水合：点哪块，哪块先水合',
    }),
    deep('React 18.3.1 的源码里，点击（离散事件）落在未水合的边界上时，React 尝试同步水合它。如果该边界的代码还没下载完（例如 <code>lazy</code> 组件），这次点击会被丢弃，React 只是提高该边界的优先级。悬停这类连续事件会排队，水合后重放。所以首屏关键按钮的代码不要放进懒加载的块里。'),

    h('三、水合不匹配：React 实际做了什么'),
    p('水合时，React 不重新创建 DOM。它沿着服务端 HTML 逐个节点“认领”，并假设内容一致。不一致时，React 18 的处理分两种：'),
    ul([
      '<b>文字或结构不一致</b>：抛出错误。React 丢弃最近的 Suspense 边界里的服务端 HTML，在浏览器重新渲染这一块。没有边界时，丢弃整个根。错误交给 <code>onRecoverableError</code>。',
      '<b>属性不一致</b>（className、href、id）：只在开发版里警告，生产版没有任何提示。React <b>不会修正</b>属性，DOM 里留着服务端的值。',
    ]),
    p('下面三个容器使用同一段服务端 HTML，客户端组件收到的数据不同。'),
    Object.assign(play(`
import { useState, useEffect, useRef, Suspense } from 'react';
import { hydrateRoot } from 'react-dom/client';

// 服务端 HTML：库存在边界外，评分在 Suspense 边界内
const SERVER_HTML = '<p>库存：<b>12</b></p><!--$--><p>评分：<b>4.8</b></p><!--/$-->';

const CASES = [
  { name: '甲：完全一致', stock: '12', rating: '4.8' },
  { name: '乙：边界外的库存不一致', stock: '11', rating: '4.8' },
  { name: '丙：边界内的评分不一致', stock: '12', rating: '4.9' },
];

function Product({ stock, rating }) {
  return (
    <>
      <p>库存：<b>{stock}</b></p>
      <Suspense fallback={<p>加载中…</p>}>
        <p>评分：<b>{rating}</b></p>
      </Suspense>
    </>
  );
}

function Case({ c }) {
  const box = useRef(null);
  const [report, setReport] = useState('水合中…');
  useEffect(() => {
    const el = document.createElement('div');
    el.innerHTML = SERVER_HTML;
    box.current.replaceChildren(el);
    const [stockP, ratingP] = el.querySelectorAll('p'); // 记住服务端生成的节点
    const errors = [];
    const root = hydrateRoot(el, <Product stock={c.stock} rating={c.rating} />, {
      onRecoverableError: (error) => errors.push(error.message),
    });
    const timer = setTimeout(() => {
      setReport('库存段落' + (stockP.isConnected ? '保留' : '被替换')
        + '，评分段落' + (ratingP.isConnected ? '保留' : '被替换')
        + '，可恢复错误 ' + errors.length + ' 条');
      errors.forEach(m => console.log(c.name + '：' + m));
    }, 300);
    return () => { clearTimeout(timer); Promise.resolve().then(() => root.unmount()); };
  }, [c]);
  return (
    <div style={{ borderTop: '1px solid #8884', padding: '4px 0' }}>
      <b>{c.name}</b>
      <div ref={box} />
      <small>{report}</small>
    </div>
  );
}

function App() {
  return <div>{CASES.map(c => <Case key={c.name} c={c} />)}</div>;
}`, '同一段 HTML，三种客户端数据', '甲：两个段落都保留，没有错误。乙：库存在边界外，不一致导致整个根改为客户端渲染，两个段落都被替换。丙：评分在边界内，只替换这个边界，库存段落保留。控制台列出了每条可恢复错误：第一条说文字不一致，最后一条说明 React 改为客户端渲染的范围（整个根，或这个边界）。Suspense 边界既是流式和水合的单位，也是“出错后重做多大范围”的单位。'), {
      predict: {
        q: '看“丙”：评分在 Suspense 边界内，客户端是 4.9，服务端是 4.8。水合后，哪些服务端节点还在页面上？',
        options: ['两个段落都保留，React 只把文字改成 4.9', '库存段落保留，评分段落被替换', '两个段落都被替换，整个根改为客户端渲染', '两个段落都保留，页面仍显示 4.8'],
        answer: 1,
        explain: '文字不一致时，React 18 不会就地修补文字，而是丢弃最近的 Suspense 边界里的服务端 HTML，在客户端重新渲染这一块。边界外的库存段落不受影响。“整个根”是乙的情况：错误发生在边界外。“只改文字”是最常见的误解：只有用了 suppressHydrationWarning 的那一层才会这样处理。',
      },
      pkey: 'streaming-ssr|同一段 HTML，三种客户端数据',
    }),
    p('客户端重新渲染一块，代价是：这块的服务端 HTML 白做了；用户可能看到内容闪一下；正在输入的文字可能丢失。所以开发时看到不匹配，要修，不要忽略。'),
    h('四、不匹配的常见原因和修法'),
    table(['原因', '为什么不一致', '修法'], [
      ['渲染时读 <code>Date.now()</code>、<code>new Date()</code>', '服务端和浏览器的“现在”不同。静态页面可能几天前就生成了', '首次渲染输出由数据算出的固定值（如发布日期）。水合后在 effect 里换成相对时间'],
      ['<code>toLocaleString()</code>、<code>Intl</code>', '服务器的时区和语言常是 UTC 和英文', '服务端和浏览器传入相同的 timeZone、locale；或水合后再格式化'],
      ['<code>Math.random()</code> 生成 id', '两边随机数不同', '用 <code>useId</code>。注意 id 是属性，不一致时不会报错，也不会被修正'],
      ['<code>typeof window</code>、<code>localStorage</code>、<code>innerWidth</code>', '服务端没有这些值', '<code>useSyncExternalStore</code> 的第三个参数 <code>getServerSnapshot</code> 返回服务端的值；或 effect 里再读'],
      ['无效的 HTML 嵌套', '浏览器解析 HTML 时会“修正”结构，和 React 的树对不上', '改成有效嵌套：<code>&lt;p&gt;</code> 里不放 <code>&lt;div&gt;</code>，表格写上 <code>&lt;tbody&gt;</code>'],
      ['浏览器扩展、第三方脚本改了 DOM', '水合前 DOM 已被修改', '先在无痕窗口排除。React 19 会跳过 head 和 body 里多出的标签'],
    ]),
    p('无效嵌套最难发现，因为 JSX 看起来没问题。浏览器解析服务端 HTML 时会改写结构：'),
    play(`
const SAMPLES = [
  '<p>价格<div>¥99</div></p>',
  '<table><tr><td>1</td></tr></table>',
  '<a href="#a">外层<a href="#b">内层</a></a>',
];

function App() {
  return (
    <ul>
      {SAMPLES.map(html => {
        const box = document.createElement('div');
        box.innerHTML = html; // 用浏览器的 HTML 解析器解析，和加载服务端页面时一样
        return (
          <li key={html} style={{ marginBottom: 8, wordBreak: 'break-all' }}>
            <div>服务端发出：<code>{html}</code></div>
            <div>浏览器得到：<code>{box.innerHTML}</code></div>
          </li>
        );
      })}
    </ul>
  );
}`, '浏览器会改写无效的 HTML', '第一行：<code>&lt;p&gt;</code> 遇到 <code>&lt;div&gt;</code> 会自动结束，多出一个空的 <code>&lt;p&gt;</code>。第二行：浏览器补上了 <code>&lt;tbody&gt;</code>。第三行：链接不能嵌套，被拆成两个。React 水合时按自己的树认领节点，结构对不上就报错。用 createRoot 在客户端渲染时，DOM 由 React 直接创建，不经过解析器，所以同样的 JSX 在纯客户端应用里不会出问题。'),
    p('读浏览器值的组件，推荐用 <code>useSyncExternalStore</code>。水合时 React 调用 <code>getServerSnapshot</code>，保证与服务端一致；水合后发现 <code>getSnapshot</code> 的值不同，再重新渲染一次。'),
    code(`
function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function useOnline() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,   // 浏览器的值
    () => true,               // 服务端和水合时用的值
  );
}`, '漏掉第三个参数时，React 18 在水合时报错：Missing getServerSnapshot'),
    warn('<code>suppressHydrationWarning</code> 只作用于一个元素的文字和属性，不作用于子元素。它适合“一个时间戳”这类无法避免的差异。把它加在外层容器上，下面的不匹配照样报错。用它掩盖结构差异，等于把问题留到生产环境。'),

    h('五、RSC 的序列化边界与组合'),
    p('第 29 课讲过：服务端组件传给客户端组件的 props 必须可序列化。这里补三点。'),
    p('<b>1. JSX 本身可以跨边界。</b>服务端组件渲染好的结果可以作为 children 或任意 prop 传给客户端组件。客户端组件拿到的是渲染结果，不是组件代码。'),
    code(`
// Tabs.jsx
'use client';
export function Tabs({ tabs }) {
  const [i, setI] = useState(0);
  return <>{tabs.map((t, k) => <button key={k} onClick={() => setI(k)}>{t.label}</button>)}{tabs[i].body}</>;
}

// page.jsx（服务端组件）
import { Tabs } from './Tabs';
import { SalesStats } from './SalesStats';   // async 服务端组件，直接查数据库

export default function Page() {
  return <Tabs tabs={[
    { label: '销售', body: <SalesStats /> },   // 在服务器渲染，结果放进 RSC Payload
    { label: '说明', body: <p>数据每小时更新</p> },
  ]} />;
}`, '只能阅读：客户端组件负责交互，服务端组件负责数据。Tabs 里不能 import SalesStats，否则它会变成客户端代码'),
    p('<b>2. Promise 也可以跨边界。</b>服务端组件不 await，直接把 Promise 传下去。客户端组件用 React 19 的 <code>use()</code> 读取，外面包 Suspense。页面外壳不用等这份数据。'),
    p('<b>3. 小心服务端的数据瀑布。</b>父组件 <code>await</code> 用户信息后才渲染子组件，子组件再 <code>await</code> 订单。两个请求串行了。修法与第 38 课相同：在父组件里同时发起请求（<code>Promise.all</code>，或先创建 Promise 再分别传下去）。'),

    h('六、缓存与重新验证'),
    p('服务端组件每次请求都查数据库，代价很高。缓存分几层，作用范围不同：'),
    table(['层', '范围', '怎样失效'], [
      ['React <code>cache(fn)</code>', '一次请求内。同一请求里多个组件调用同一个函数，只执行一次', '请求结束即丢弃'],
      ['Next.js 数据缓存（fetch / \'use cache\'）', '跨请求、跨用户，部署后仍可能保留', '按时间（revalidate）或按标签、路径手动失效'],
      ['Next.js 整页缓存', '静态生成的 HTML 和 RSC Payload', '页面用到的数据失效时重新生成'],
      ['浏览器端路由缓存', '一个用户的一个标签页', '刷新页面、router.refresh()、Server Action 里重新验证'],
    ]),
    p('Next.js 的默认值在几个大版本之间变过。读文章和旧代码时，先看版本：'),
    table(['版本', 'fetch 默认', '常用写法'], [
      ['13、14', '默认缓存（force-cache）', '<code>fetch(url, { next: { revalidate: 60 } })</code>；<code>{ next: { tags: [\'post-7\'] } }</code> 配合 <code>revalidateTag(\'post-7\')</code>'],
      ['15', '默认不缓存', '需要缓存时写 <code>cache: \'force-cache\'</code> 或 revalidate'],
      ['16（开启 cacheComponents）', '默认按请求动态渲染', '在函数或组件里写 <code>\'use cache\'</code>，用 <code>cacheLife()</code> 设时长，<code>cacheTag()</code> 打标签'],
    ]),
    code(`
// Next.js 16：缓存一个数据函数，并打上标签
async function getProduct(id) {
  'use cache';
  cacheTag('product-' + id);
  cacheLife('hours');
  return db.product.find(id);
}

// Server Action：改价格后让带这个标签的缓存失效
'use server';
export async function updatePrice(id, price) {
  await checkAdmin();                 // 先检查权限
  await db.product.update(id, { price });
  updateTag('product-' + id);         // 16：立即失效，本次操作的用户马上看到新值
  // revalidateTag('product-' + id, 'max'); // 另一种：先返回旧值，后台更新
}`, '只能阅读：API 名称以 Next.js 16 官方文档为准。13–15 用 fetch 的 next.tags 和 revalidateTag(tag)'),
    ul([
      '<b>按时间重新验证是“先给旧的，后台更新”</b>：revalidate 为 60，第 61 秒的第一个请求仍拿到旧数据，同时触发后台重新生成。下一个请求才拿到新数据。',
      '<b>按路径还是按标签</b>：<code>revalidatePath(\'/product/7\')</code> 只管这一条路由。同一个商品还出现在首页、搜索页时，给数据打标签，用标签失效。',
      '<b>个人数据不要放进跨用户的缓存</b>：读 cookies 或用户信息的函数，不要加 \'use cache\'。否则 A 用户的数据可能被 B 用户看到。',
    ]),

    h('七、迁移评估：什么时候不该用 SSR 或 RSC（选读）'),
    ul([
      '<b>登录后才能用的强交互应用</b>（编辑器、设计工具、后台表格）：SEO 没有意义，首屏之后全是客户端交互。CSR 加好的加载状态通常就够了。',
      '<b>没有 Node 服务器的团队</b>：SSR 和 RSC 需要运行、监控和扩容服务器。纯静态托管更省事。',
      '<b>依赖大量浏览器 API 的第三方库</b>：每个都要包进 \'use client\' 或推迟到水合后加载。',
      '<b>迁移成本清单</b>：Context Provider 要移到客户端组件；运行时 CSS-in-JS 要换方案；全局 store 要按请求创建，防止用户之间串数据；测试要分服务端和客户端；部署多了缓存失效这个新故障源。',
    ]),
    p('判断顺序：先问“首屏内容是否依赖每个请求的数据，是否需要被搜索引擎收录”。都不需要，用静态生成或 CSR。需要，再考虑流式 SSR。组件树里大量组件只展示数据、不交互时，RSC 才能明显减少 JS 体积。'),
  ],
  quiz: [
    {
      q: '商品页的评论区包在 Suspense 里，评论数据要 3 秒。服务器用 renderToPipeableStream。请求来自搜索引擎爬虫，它不执行 JS。应在哪个回调里调用 pipe(res)？',
      options: ['onShellReady：外壳好了就发，最快', 'onAllReady：等所有边界的内容都就绪再发', 'onError：评论出错时才需要发送', '不用流式，改回 renderToString 就能拿到评论'],
      answer: 1,
      explain: '爬虫不执行 JS，收不到替换脚本带来的评论内容，所以要等全部就绪再发。onShellReady 对真人用户最好，但给爬虫的是 fallback。renderToString 不会等待数据：遇到挂起的边界，它直接输出 fallback。',
    },
    {
      q: 'React 18 中，组件渲染 &lt;nav className={isMobile ? "m" : "d"}&gt;，isMobile 读的是 window.innerWidth。服务端输出 class="d"，用户用手机打开。水合后会怎样？',
      options: ['React 发现不一致，把 class 改成 m', '整个根改为客户端渲染，class 变成 m', 'class 仍是 d。开发版警告，生产版没有提示', '页面报错，nav 不显示'],
      answer: 2,
      explain: '属性不一致时，React 18 只在开发版警告（每页只警告第一次），不会修正属性。DOM 里留着服务端的 d，直到这个属性的值在之后的渲染中变化。文字不一致才会触发客户端重新渲染。所以属性不一致更隐蔽：它不报错，界面却是错的。',
    },
    {
      q: 'Next.js 14 中 fetch 设置了 next: { revalidate: 60 }。数据在第 0 秒被修改。第 70 秒来了一个请求，它拿到什么？',
      options: ['新数据：已经超过 60 秒，这个请求等待重新获取', '旧数据，同时触发后台重新生成；之后的请求拿到新数据', '新数据：数据一修改，缓存就失效', '报错：缓存过期期间页面不可用'],
      answer: 1,
      explain: '按时间重新验证是“先返回旧的，后台更新”。过期后的第一个请求仍拿到缓存，并触发重新获取。最迷惑的是第一项：很多人以为过期后的请求会等待新数据。需要改完马上可见时，在 Server Action 里按标签或路径手动失效。',
    },
    {
      q: '页面有三个 Suspense 边界，代码都已下载。React 18 正在水合第一个边界时，用户点了第三个边界里的按钮。会发生什么？',
      options: ['点击丢失，用户要等全部水合完再点一次', 'React 等三个边界按顺序都水合完，再重放这次点击', 'React 让出主线程后，同步水合第三个边界，再把点击交给它', '第三个边界的服务端 HTML 被丢弃，改为客户端渲染'],
      answer: 2,
      explain: '这就是选择性水合：用户交互的边界优先。React 完成当前工作单元后让出主线程，处理点击时同步水合目标边界，然后分发点击。第一项只在该边界的代码还没下载完时发生：18.3.1 会丢弃这次点击，只提高该边界的优先级。',
    },
    {
      q: '客户端组件 Tabs 要显示一个查数据库的服务端组件 SalesStats。下面哪种写法正确？',
      options: ['在 Tabs.jsx 里 import SalesStats，直接放进标签页', '在 SalesStats 顶部也写 \'use client\'，两边都在客户端', '由服务端父组件渲染 SalesStats，作为 prop 传给 Tabs', '在 Tabs 的 useEffect 里调用 SalesStats() 拿结果'],
      answer: 2,
      explain: '客户端组件不能导入服务端组件，但能接收已经渲染好的 JSX。在 Tabs.jsx 里 import，SalesStats 会变成客户端代码：它查数据库的代码会被打包进浏览器，并且无法运行。加 \'use client\' 同样如此。在 effect 里调用组件函数既违反 Hook 规则，也拿不到服务端数据。',
    },
  ],
  exercise: {
    task: '<p>博客文章在构建时生成静态 HTML，之后由 CDN 缓存很多天。<code>SERVER_HTML</code> 是构建时的输出。预览区会用它水合你的 <code>PostMeta</code>，并显示水合错误。</p>'
      + '<ol class="task-steps">'
      + '<li>修改 <code>PostMeta</code>，让它的首次渲染与 <code>SERVER_HTML</code> 完全一致：时间显示 <code>formatDate(PUBLISHED_AT)</code>，布局显示“宽屏”。</li>'
      + '<li>水合后，时间改为 <code>formatAgo(PUBLISHED_AT, Date.now())</code> 的相对时间。</li>'
      + '<li>水合后，布局按 <code>window.innerWidth</code> 显示：小于 600 为“窄屏”，否则为“宽屏”。窗口大小变化时，布局文字跟着变。</li>'
      + '<li>不要修改 <code>SERVER_HTML</code>、两个辅助函数和标记结构。不要用 <code>suppressHydrationWarning</code>。</li>'
      + '</ol>'
      + '<p>检查程序会把窗口宽度设为 375 和 1024，各水合一次。它检查三件事：<code>onRecoverableError</code> 没有被调用；服务端节点被保留；水合后显示客户端的值。</p>',
    starter: `import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { hydrateRoot } from 'react-dom/client';

// 2026-10-01 08:00（UTC）发布。服务端和浏览器拿到的是同一个值
const PUBLISHED_AT = Date.UTC(2026, 9, 1, 8, 0);

// 构建时生成的 HTML（不要修改）
const SERVER_HTML = '<p class="meta">发布于 <time dateTime="2026-10-01T08:00:00.000Z">2026-10-01</time></p>'
  + '<p class="layout">布局：<b>宽屏</b></p>';

// 辅助函数（不要修改）
function formatDate(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}
function formatAgo(ts, now) {
  const min = Math.floor((now - ts) / 60000);
  if (min < 60) return min + ' 分钟前';
  if (min < 1440) return Math.floor(min / 60) + ' 小时前';
  return Math.floor(min / 1440) + ' 天前';
}

function PostMeta() {
  const ago = formatAgo(PUBLISHED_AT, Date.now());
  const narrow = typeof window !== 'undefined' && window.innerWidth < 600;
  return (
    <>
      <p className="meta">发布于 <time dateTime={new Date(PUBLISHED_AT).toISOString()}>{ago}</time></p>
      <p className="layout">布局：<b>{narrow ? '窄屏' : '宽屏'}</b></p>
    </>
  );
}

// —— 以下是预览用的水合实验台，不用修改 ——
function App() {
  const box = useRef(null);
  const [log, setLog] = useState([]);
  useEffect(() => {
    const el = document.createElement('div');
    el.innerHTML = SERVER_HTML;
    box.current.replaceChildren(el);
    const errors = [];
    const root = hydrateRoot(el, <PostMeta />, { onRecoverableError: (e) => errors.push(e.message) });
    const timer = setTimeout(() => setLog(errors.length ? errors : ['没有水合错误']), 300);
    return () => { clearTimeout(timer); Promise.resolve().then(() => root.unmount()); };
  }, []);
  return (
    <div>
      <div ref={box} />
      <ul>{log.map((m, i) => <li key={i}><small>{m}</small></li>)}</ul>
    </div>
  );
}`,
    solution: `import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { hydrateRoot } from 'react-dom/client';

// 2026-10-01 08:00（UTC）发布。服务端和浏览器拿到的是同一个值
const PUBLISHED_AT = Date.UTC(2026, 9, 1, 8, 0);

// 构建时生成的 HTML（不要修改）
const SERVER_HTML = '<p class="meta">发布于 <time dateTime="2026-10-01T08:00:00.000Z">2026-10-01</time></p>'
  + '<p class="layout">布局：<b>宽屏</b></p>';

// 辅助函数（不要修改）
function formatDate(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}
function formatAgo(ts, now) {
  const min = Math.floor((now - ts) / 60000);
  if (min < 60) return min + ' 分钟前';
  if (min < 1440) return Math.floor(min / 60) + ' 小时前';
  return Math.floor(min / 1440) + ' 天前';
}

function subscribeResize(callback) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function PostMeta() {
  // 时间：首次渲染用固定的发布日期，水合后在 effect 里换成相对时间
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);
  const timeText = now === null ? formatDate(PUBLISHED_AT) : formatAgo(PUBLISHED_AT, now);

  // 布局：水合时用 getServerSnapshot 的值，之后跟着窗口变化
  const narrow = useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth < 600,
    () => false,
  );

  return (
    <>
      <p className="meta">发布于 <time dateTime={new Date(PUBLISHED_AT).toISOString()}>{timeText}</time></p>
      <p className="layout">布局：<b>{narrow ? '窄屏' : '宽屏'}</b></p>
    </>
  );
}

// —— 以下是预览用的水合实验台，不用修改 ——
function App() {
  const box = useRef(null);
  const [log, setLog] = useState([]);
  useEffect(() => {
    const el = document.createElement('div');
    el.innerHTML = SERVER_HTML;
    box.current.replaceChildren(el);
    const errors = [];
    const root = hydrateRoot(el, <PostMeta />, { onRecoverableError: (e) => errors.push(e.message) });
    const timer = setTimeout(() => setLog(errors.length ? errors : ['没有水合错误']), 300);
    return () => { clearTimeout(timer); Promise.resolve().then(() => root.unmount()); };
  }, []);
  return (
    <div>
      <div ref={box} />
      <ul>{log.map((m, i) => <li key={i}><small>{m}</small></li>)}</ul>
    </div>
  );
}`,
    faded: `import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { hydrateRoot } from 'react-dom/client';

// 2026-10-01 08:00（UTC）发布。服务端和浏览器拿到的是同一个值
const PUBLISHED_AT = Date.UTC(2026, 9, 1, 8, 0);

// 构建时生成的 HTML（不要修改）
const SERVER_HTML = '<p class="meta">发布于 <time dateTime="2026-10-01T08:00:00.000Z">2026-10-01</time></p>'
  + '<p class="layout">布局：<b>宽屏</b></p>';

// 辅助函数（不要修改）
function formatDate(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}
function formatAgo(ts, now) {
  const min = Math.floor((now - ts) / 60000);
  if (min < 60) return min + ' 分钟前';
  if (min < 1440) return Math.floor(min / 60) + ' 小时前';
  return Math.floor(min / 1440) + ' 天前';
}

function subscribeResize(callback) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function PostMeta() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    /* ✏️ 水合后记下浏览器的当前时间 */
  }, []);
  /* ✏️ now 还是 null 时用 formatDate，否则用 formatAgo */

  const narrow = useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth < 600,
    /* ✏️ 第三个参数：服务端和水合时用的值，要和 SERVER_HTML 一致 */
  );

  return (
    <>
      <p className="meta">发布于 <time dateTime={new Date(PUBLISHED_AT).toISOString()}>{timeText}</time></p>
      <p className="layout">布局：<b>{narrow ? '窄屏' : '宽屏'}</b></p>
    </>
  );
}

// —— 以下是预览用的水合实验台，不用修改 ——
function App() {
  const box = useRef(null);
  const [log, setLog] = useState([]);
  useEffect(() => {
    const el = document.createElement('div');
    el.innerHTML = SERVER_HTML;
    box.current.replaceChildren(el);
    const errors = [];
    const root = hydrateRoot(el, <PostMeta />, { onRecoverableError: (e) => errors.push(e.message) });
    const timer = setTimeout(() => setLog(errors.length ? errors : ['没有水合错误']), 300);
    return () => { clearTimeout(timer); Promise.resolve().then(() => root.unmount()); };
  }, []);
  return (
    <div>
      <div ref={box} />
      <ul>{log.map((m, i) => <li key={i}><small>{m}</small></li>)}</ul>
    </div>
  );
}`,
    hint: '问自己两个问题：服务端渲染时能算出什么值？浏览器的值最早什么时候可以用？时间只需要在水合后算一次；窗口宽度会变，需要订阅。回看第四节 useOnline 的三个参数。',
    exports: ['PostMeta'],
    test: async (t) => {
      const PostMeta = t.exports.PostMeta;
      t.assert(typeof PostMeta === 'function', '没有找到 PostMeta 组件。请保留这个名字');
      t.assert(!/suppressHydrationWarning/.test(t.source), '本题不用 suppressHydrationWarning。它只是不报错，首次渲染仍与服务端不同。请让首次渲染输出 SERVER_HTML 里的值');
      const SERVER = '<p class="meta">发布于 <time datetime="2026-10-01T08:00:00.000Z">2026-10-01</time></p><p class="layout">布局：<b>宽屏</b></p>';
      const PUB = Date.UTC(2026, 9, 1, 8, 0);
      const ago = (ts, now) => { const m = Math.floor((now - ts) / 60000); return m < 60 ? m + ' 分钟前' : m < 1440 ? Math.floor(m / 60) + ' 小时前' : Math.floor(m / 1440) + ' 天前'; };
      const realNow = Date.now;
      const fakeNow = PUB + 3 * 3600e3 + 5 * 60e3;
      const okTimes = [ago(PUB, fakeNow), ago(PUB, realNow.call(Date))];
      const wDesc = Object.getOwnPropertyDescriptor(window, 'innerWidth');
      const setW = (w) => Object.defineProperty(window, 'innerWidth', { value: w, configurable: true, writable: true });
      const roots = [];
      async function hydrate(width) {
        setW(width);
        const box = document.createElement('div');
        box.innerHTML = SERVER;
        const nodes = [box.querySelector('time'), box.querySelector('.layout b'), ...box.children];
        const errors = [];
        const root = ReactDOM.hydrateRoot(box, React.createElement(PostMeta), { onRecoverableError: (e) => errors.push(e && e.message || String(e)) });
        roots.push(root);
        await t.wait(200);
        const time = box.querySelector('time'), b = box.querySelector('.layout b');
        return { box, errors, kept: nodes.every(n => n && box.contains(n)), time: time ? time.textContent.trim() : '', layout: b ? b.textContent.trim() : '' };
      }
      const firstMsg = (errs) => {
        const m = errs.join(' ');
        if (/getServerSnapshot/.test(m)) return 'useSyncExternalStore 缺少第三个参数 getServerSnapshot。水合时 React 要用它得到与服务端相同的值';
        if (/does not match|did not match|Hydration failed/.test(m)) return '首次渲染的内容和 SERVER_HTML 不一致。时间要先显示 formatDate 的结果，布局要先显示“宽屏”，客户端的值留到水合之后';
        return '水合时出错：' + errs[0];
      };
      try {
        Date.now = () => fakeNow;
        const a = await hydrate(375);
        t.assert(a.errors.length === 0, '窗口宽 375 时水合出错（onRecoverableError 被调用 ' + a.errors.length + ' 次）。' + firstMsg(a.errors));
        t.assert(a.kept, '水合后服务端生成的节点不见了，说明 React 丢弃了服务端 HTML，改为客户端渲染。请不要修改标记结构');
        t.assert(okTimes.includes(a.time), '水合后时间应显示相对时间（例如“' + okTimes[0] + '”），实际是“' + a.time + '”。首次渲染用固定日期，水合后再换成 formatAgo(PUBLISHED_AT, Date.now()) 的结果');
        t.assert(a.layout === '窄屏', '窗口宽 375 时，水合后布局应显示“窄屏”，实际是“' + a.layout + '”。首次渲染显示“宽屏”，水合后再读 window.innerWidth');
        setW(1024); window.dispatchEvent(new Event('resize')); await t.wait(80);
        const l2 = a.box.querySelector('.layout b').textContent.trim();
        t.assert(l2 === '宽屏', '把窗口改宽到 1024 并触发 resize 后，布局应变为“宽屏”，实际是“' + l2 + '”。需要订阅 resize 事件');
        setW(375); window.dispatchEvent(new Event('resize')); await t.wait(80);
        const l3 = a.box.querySelector('.layout b').textContent.trim();
        t.assert(l3 === '窄屏', '再把窗口改窄到 375 并触发 resize 后，布局应变为“窄屏”，实际是“' + l3 + '”');
        const b = await hydrate(1024);
        t.assert(b.errors.length === 0, '窗口宽 1024 时水合出错。' + firstMsg(b.errors));
        t.assert(b.kept && b.layout === '宽屏', '窗口宽 1024 时，水合后布局应为“宽屏”，实际是“' + b.layout + '”');
        t.assert(okTimes.includes(b.time), '窗口宽 1024 时，水合后时间应显示相对时间，实际是“' + b.time + '”');
      } finally {
        Date.now = realNow;
        if (wDesc) Object.defineProperty(window, 'innerWidth', wDesc); else delete window.innerWidth;
        roots.forEach(r => { try { r.unmount(); } catch (e) {} });
      }
    },
  },
  checkOnly: [
    {
      q: '服务器的时区是 UTC。北京时间 15:00（UTC 07:00），用户打开页面，React 18 用 hydrateRoot 水合。页面上没有 Suspense 边界。结果是什么？' + pre(`
function Greeting() {
  const hour = new Date().getHours();
  return <p>{hour < 12 ? '早上好' : '下午好'}</p>;
}`),
      options: ['保留“早上好”，只在开发版控制台警告一次', '报告可恢复错误，整个根改为客户端渲染，显示“下午好”', '只把这段文字改成“下午好”，其他节点保留', '页面白屏，最近的错误边界显示出错界面'],
      answer: 1,
      explain: '服务器算出 7 点，输出“早上好”；浏览器算出 15 点，渲染“下午好”。文字不一致，React 18 在并发根上抛出错误，丢弃最近 Suspense 边界内的服务端 HTML。这里没有边界，所以整个根改为客户端渲染，并调用 onRecoverableError。它不会就地只改这段文字，也不会交给错误边界。',
    },
    {
      q: '服务器用 renderToPipeableStream，在 onShellReady 里 pipe。Reviews 要等 2 秒。第一批发出的 HTML 包含哪些内容？' + pre(`
<Layout>
  <Header />
  <Suspense fallback={<Spinner />}>
    <Reviews />
  </Suspense>
  <Footer />
</Layout>`),
      options: ['只有 Header，其余等 Reviews 好了按顺序发', 'Header、Spinner 和 Footer', 'Header、Reviews 和 Footer，等 2 秒后一次发完', '什么都不发，等全部就绪'],
      answer: 1,
      explain: '外壳是 Suspense 边界之外的部分，Footer 也在外壳里。边界的位置先发 fallback（Spinner）。Reviews 好了以后，作为隐藏的 div 加一段替换脚本追加到流里。第一项是常见误解：以为 HTML 必须按顺序发送，后面的内容要等前面的。',
    },
    {
      q: '用户离线时打开服务端渲染的页面。React 18 水合时，这个组件第一次渲染显示什么？之后呢？' + pre(`
const online = useSyncExternalStore(
  subscribe,
  () => navigator.onLine,
  () => true,
);
return <span>{online ? '在线' : '离线'}</span>;`),
      options: ['一直显示“在线”：getServerSnapshot 优先', '先显示“在线”，与服务端一致；水合后重新渲染为“离线”', '直接显示“离线”，并报告不匹配错误', '先显示“离线”，再变成“在线”'],
      answer: 1,
      explain: '水合时 React 调用第三个参数 getServerSnapshot，得到 true，与服务端 HTML 一致，不报错。水合完成后，React 发现 getSnapshot 返回 false，就重新渲染一次。第一项错在以为 getServerSnapshot 会一直生效：它只用于服务端渲染和水合。',
    },
    {
      q: '服务端组件把下面的 props 传给客户端组件 &lt;Chart&gt;。哪一个会导致报错？' + pre(`
<Chart
  createdAt={new Date()}
  tags={new Set(['新品'])}
  legend={<Legend items={items} />}
  format={(n) => n.toFixed(2)}
/>`),
      options: ['createdAt：Date 不能序列化', 'tags：Set 不能序列化', 'legend：JSX 不能跨边界', 'format：普通函数不能跨边界'],
      answer: 3,
      explain: 'RSC 的序列化格式支持 Date、Map、Set、Promise 和 JSX 元素。JSX 跨边界是组合模式的基础：Legend 在服务器渲染，客户端组件拿到的是结果。普通函数无法变成数据，只有 Server Function 可以传。需要格式化时，把函数写在客户端组件里，或传一个字符串参数（例如小数位数）。',
    },
  ],
});
})();
