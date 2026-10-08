import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/streaming-ssr.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'streaming-ssr',
  stage: 5,
  runtime: 19,
  title: '流式 SSR、选择性水合与 RSC 缓存',
  mins: 40,
  summary: 'HTML 怎样分批到达，哪一块先能点，服务端数据缓存多久。在浏览器里亲手水合一段“服务端 HTML”，再修好一个水合不匹配。',
  goals: [
    '能解释 renderToString 与 renderToPipeableStream 的区别，并说出 Suspense 边界怎样决定首批 HTML 包含什么',
    '能预测选择性水合的顺序：用户点击的区块先水合，其他区块的未完成工作被丢弃后重做',
    '能诊断水合不匹配的常见原因，并用 effect 或 getServerSnapshot 写出首次渲染与服务端一致的组件',
    '能判断一份数据该用哪种缓存与重新验证方式',
  ],
  keyPoints: [
    'renderToString 一次性返回整页 HTML，不能流式发送。renderToPipeableStream 先发“外壳”（Suspense 边界之外的部分），每个边界的内容准备好后再单独发送。',
    'Suspense 边界是流式发送和水合的最小单位。每个边界独立水合，内容没准备好的边界保留服务端 HTML；用户与哪个边界交互，哪个边界就先水合。',
    '水合要求首次渲染与服务端 HTML 一致。React 遇到文字不一致时，把最近的 Suspense 边界（没有边界就是整个根）改为客户端渲染，并调用 onRecoverableError。属性不一致只在开发版警告一次，也不会被修正。',
    '修复方法：首次渲染输出服务端能算出的值，水合后再换成客户端的值。用 useEffect，或用 useSyncExternalStore 的 getServerSnapshot。id 用 useId，HTML 嵌套要有效。',
    "RSC 的缓存分层：React 的 cache() 只在一次请求内去重；Next.js 的数据缓存跨请求。默认值随版本变化：14 默认缓存 fetch，15 默认不缓存，16 用 'use cache' 显式声明。",
  ],
  quiz: [
    {
      q: '商品页的评论区包在 Suspense 里，评论数据要 3 秒。服务器用 renderToPipeableStream。请求来自搜索引擎爬虫，它不执行 JS。应在哪个回调里调用 pipe(res)？',
      options: [
        'onShellReady：外壳好了就发，最快',
        'onAllReady：等所有边界的内容都就绪再发',
        'onError：评论出错时才需要发送',
        '不用流式，改回 renderToString 就能拿到评论',
      ],
      answer: 1,
      explain:
        '爬虫不执行 JS，收不到替换脚本带来的评论内容，所以要等全部就绪再发。onShellReady 对真人用户最好，但给爬虫的是 fallback。renderToString 不会等待数据：遇到挂起的边界，它直接输出 fallback。',
    },
    {
      q: '组件渲染 &lt;nav className={isMobile ? "m" : "d"}&gt;，isMobile 读的是 window.innerWidth。服务端输出 class="d"，用户用手机打开。水合后会怎样？',
      options: ['React 发现不一致，把 class 改成 m', '整个根改为客户端渲染，class 变成 m', 'class 仍是 d。开发版警告，生产版没有提示', '页面报错，nav 不显示'],
      answer: 2,
      explain:
        '属性不一致时，React 只在开发版警告（每页只警告第一次），不会修正属性。DOM 里留着服务端的 d，直到这个属性的值在之后的渲染中变化。文字不一致才会触发客户端重新渲染。所以属性不一致更隐蔽：它不报错，界面却是错的。',
    },
    {
      q: 'Next.js 14 中 fetch 设置了 next: { revalidate: 60 }。数据在第 0 秒被修改。第 70 秒来了一个请求，它拿到什么？',
      options: [
        '新数据：已经超过 60 秒，这个请求等待重新获取',
        '旧数据，同时触发后台重新生成；之后的请求拿到新数据',
        '新数据：数据一修改，缓存就失效',
        '报错：缓存过期期间页面不可用',
      ],
      answer: 1,
      explain:
        '按时间重新验证是“先返回旧的，后台更新”。过期后的第一个请求仍拿到缓存，并触发重新获取。最迷惑的是第一项：很多人以为过期后的请求会等待新数据。需要改完马上可见时，在 Server Action 里按标签或路径手动失效。',
    },
    {
      q: '页面有三个 Suspense 边界，代码都已下载，但还没有水合完。React 正在水合第一个边界时，用户点了第三个边界里的按钮。会发生什么？',
      options: [
        '点击丢失，用户要等全部水合完再点一次',
        'React 等三个边界按顺序都水合完，再重放这次点击',
        'React 让出主线程后，同步水合第三个边界，再把点击交给它',
        '第三个边界的服务端 HTML 被丢弃，改为客户端渲染',
      ],
      answer: 2,
      explain:
        '这就是选择性水合：用户交互的边界优先。React 完成当前工作单元后让出主线程，处理点击时同步水合目标边界，然后分发点击。第一项只在该边界的代码还没下载完时发生：React 会丢弃这次点击，只提高该边界的优先级。',
    },
    {
      q: '客户端组件 Tabs 要显示一个查数据库的服务端组件 SalesStats。下面哪种写法正确？',
      options: [
        '在 Tabs.jsx 里 import SalesStats，直接放进标签页',
        "在 SalesStats 顶部也写 'use client'，两边都在客户端",
        '由服务端父组件渲染 SalesStats，作为 prop 传给 Tabs',
        '在 Tabs 的 useEffect 里调用 SalesStats() 拿结果',
      ],
      answer: 2,
      explain:
        "客户端组件不能导入服务端组件，但能接收已经渲染好的 JSX。在 Tabs.jsx 里 import，SalesStats 会变成客户端代码：它查数据库的代码会被打包进浏览器，并且无法运行。加 'use client' 同样如此。在 effect 里调用组件函数既违反 Hook 规则，也拿不到服务端数据。",
    },
  ],
  exercise: {
    task: '<p>博客文章在构建时生成静态 HTML，之后由 CDN 缓存很多天。<code>SERVER_HTML</code> 是构建时的输出。预览区会用它水合你的 <code>PostMeta</code>，并显示水合错误。</p><ol class="task-steps"><li>修改 <code>PostMeta</code>，让它的首次渲染与 <code>SERVER_HTML</code> 完全一致：时间显示 <code>formatDate(PUBLISHED_AT)</code>，布局显示“宽屏”。</li><li>水合后，时间改为 <code>formatAgo(PUBLISHED_AT, Date.now())</code> 的相对时间。</li><li>水合后，布局按 <code>window.innerWidth</code> 显示：小于 600 为“窄屏”，否则为“宽屏”。窗口大小变化时，布局文字跟着变。</li><li>不要修改 <code>SERVER_HTML</code>、两个辅助函数和标记结构。不要用 <code>suppressHydrationWarning</code>。</li></ol><p>检查程序会把窗口宽度设为 375 和 1024，各水合一次。它检查三件事：<code>onRecoverableError</code> 没有被调用；服务端节点被保留；水合后显示客户端的值。</p>',
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
    const root = hydrateRoot(el, <PostMeta />, { onRecoverableError: (e) => errors.push(e.message + (e.cause ? '：' + e.cause.message : '')) });
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
    const root = hydrateRoot(el, <PostMeta />, { onRecoverableError: (e) => errors.push(e.message + (e.cause ? '：' + e.cause.message : '')) });
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
    const root = hydrateRoot(el, <PostMeta />, { onRecoverableError: (e) => errors.push(e.message + (e.cause ? '：' + e.cause.message : '')) });
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
    test: async t => {
      const { React, ReactDOM } = t;
      const PostMeta = t.exports.PostMeta;
      t.assert(typeof PostMeta === 'function', '没有找到 PostMeta 组件。请保留这个名字');
      t.assert(
        !/suppressHydrationWarning/.test(t.source),
        '本题不用 suppressHydrationWarning。它只是不报错，首次渲染仍与服务端不同。请让首次渲染输出 SERVER_HTML 里的值',
      );
      const SERVER = '<p class="meta">发布于 <time datetime="2026-10-01T08:00:00.000Z">2026-10-01</time></p><p class="layout">布局：<b>宽屏</b></p>';
      const PUB = Date.UTC(2026, 9, 1, 8, 0);
      const ago = (ts, now) => {
        const m = Math.floor((now - ts) / 60000);
        return m < 60 ? m + ' 分钟前' : m < 1440 ? Math.floor(m / 60) + ' 小时前' : Math.floor(m / 1440) + ' 天前';
      };
      const realNow = Date.now;
      const fakeNow = PUB + 3 * 3600e3 + 5 * 60e3;
      const okTimes = [ago(PUB, fakeNow), ago(PUB, realNow.call(Date))];
      const wDesc = Object.getOwnPropertyDescriptor(window, 'innerWidth');
      const setW = w => Object.defineProperty(window, 'innerWidth', { value: w, configurable: true, writable: true });
      const roots = [];
      async function hydrate(width) {
        setW(width);
        const box = document.createElement('div');
        box.innerHTML = SERVER;
        const nodes = [box.querySelector('time'), box.querySelector('.layout b'), ...box.children];
        const errors = [];
        const root = ReactDOM.hydrateRoot(box, React.createElement(PostMeta), {
          onRecoverableError: e => errors.push(((e && e.message) || String(e)) + (e && e.cause ? ' ' + e.cause.message : '')),
        });
        roots.push(root);
        await t.wait(200);
        const time = box.querySelector('time'),
          b = box.querySelector('.layout b');
        return { box, errors, kept: nodes.every(n => n && box.contains(n)), time: time ? time.textContent.trim() : '', layout: b ? b.textContent.trim() : '' };
      }
      const firstMsg = errs => {
        const m = errs.join(' ');
        if (/getServerSnapshot/.test(m)) return 'useSyncExternalStore 缺少第三个参数 getServerSnapshot。水合时 React 要用它得到与服务端相同的值';
        if (/does not match|did not match|Hydration failed/.test(m))
          return '首次渲染的内容和 SERVER_HTML 不一致。时间要先显示 formatDate 的结果，布局要先显示“宽屏”，客户端的值留到水合之后';
        return '水合时出错：' + errs[0];
      };
      try {
        Date.now = () => fakeNow;
        const a = await hydrate(375);
        t.assert(a.errors.length === 0, '窗口宽 375 时水合出错（onRecoverableError 被调用 ' + a.errors.length + ' 次）。' + firstMsg(a.errors));
        t.assert(a.kept, '水合后服务端生成的节点不见了，说明 React 丢弃了服务端 HTML，改为客户端渲染。请不要修改标记结构');
        t.assert(
          okTimes.includes(a.time),
          '水合后时间应显示相对时间（例如“' +
            okTimes[0] +
            '”），实际是“' +
            a.time +
            '”。首次渲染用固定日期，水合后再换成 formatAgo(PUBLISHED_AT, Date.now()) 的结果',
        );
        t.assert(a.layout === '窄屏', '窗口宽 375 时，水合后布局应显示“窄屏”，实际是“' + a.layout + '”。首次渲染显示“宽屏”，水合后再读 window.innerWidth');
        setW(1024);
        window.dispatchEvent(new Event('resize'));
        await t.wait(80);
        const l2 = a.box.querySelector('.layout b').textContent.trim();
        t.assert(l2 === '宽屏', '把窗口改宽到 1024 并触发 resize 后，布局应变为“宽屏”，实际是“' + l2 + '”。需要订阅 resize 事件');
        setW(375);
        window.dispatchEvent(new Event('resize'));
        await t.wait(80);
        const l3 = a.box.querySelector('.layout b').textContent.trim();
        t.assert(l3 === '窄屏', '再把窗口改窄到 375 并触发 resize 后，布局应变为“窄屏”，实际是“' + l3 + '”');
        const b = await hydrate(1024);
        t.assert(b.errors.length === 0, '窗口宽 1024 时水合出错。' + firstMsg(b.errors));
        t.assert(b.kept && b.layout === '宽屏', '窗口宽 1024 时，水合后布局应为“宽屏”，实际是“' + b.layout + '”');
        t.assert(okTimes.includes(b.time), '窗口宽 1024 时，水合后时间应显示相对时间，实际是“' + b.time + '”');
      } finally {
        Date.now = realNow;
        if (wDesc) Object.defineProperty(window, 'innerWidth', wDesc);
        else delete window.innerWidth;
        roots.forEach(r => {
          try {
            r.unmount();
          } catch (e) {}
        });
      }
    },
  },
  checkOnly: [
    {
      q: `服务器的时区是 UTC。北京时间 15:00（UTC 07:00），用户打开页面，用 hydrateRoot 水合。页面上没有 Suspense 边界。结果是什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Greeting() {
  const hour = new Date().getHours();
  return &lt;p&gt;{hour &lt; 12 ? '早上好' : '下午好'}&lt;/p&gt;;
}</code></pre></div>`,
      options: [
        '保留“早上好”，只在开发版控制台警告一次',
        '报告可恢复错误，整个根改为客户端渲染，显示“下午好”',
        '只把这段文字改成“下午好”，其他节点保留',
        '页面白屏，最近的错误边界显示出错界面',
      ],
      answer: 1,
      explain:
        '服务器算出 7 点，输出“早上好”；浏览器算出 15 点，渲染“下午好”。文字不一致，React 抛出错误，丢弃最近 Suspense 边界内的服务端 HTML。这里没有边界，所以整个根改为客户端渲染，并调用 onRecoverableError。它不会就地只改这段文字，也不会交给错误边界。',
    },
    {
      q: `服务器用 renderToPipeableStream，在 onShellReady 里 pipe。Reviews 要等 2 秒。第一批发出的 HTML 包含哪些内容？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;Layout&gt;
  &lt;Header /&gt;
  &lt;Suspense fallback={&lt;Spinner /&gt;}&gt;
    &lt;Reviews /&gt;
  &lt;/Suspense&gt;
  &lt;Footer /&gt;
&lt;/Layout&gt;</code></pre></div>`,
      options: [
        '只有 Header，其余等 Reviews 好了按顺序发',
        'Header、Spinner 和 Footer',
        'Header、Reviews 和 Footer，等 2 秒后一次发完',
        '什么都不发，等全部就绪',
      ],
      answer: 1,
      explain:
        '外壳是 Suspense 边界之外的部分，Footer 也在外壳里。边界的位置先发 fallback（Spinner）。Reviews 好了以后，作为隐藏的 div 加一段替换脚本追加到流里。第一项是常见误解：以为 HTML 必须按顺序发送，后面的内容要等前面的。',
    },
    {
      q: `用户离线时打开服务端渲染的页面。水合时，这个组件第一次渲染显示什么？之后呢？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const online = useSyncExternalStore(
  subscribe,
  () =&gt; navigator.onLine,
  () =&gt; true,
);
return &lt;span&gt;{online ? '在线' : '离线'}&lt;/span&gt;;</code></pre></div>`,
      options: [
        '一直显示“在线”：getServerSnapshot 优先',
        '先显示“在线”，与服务端一致；水合后重新渲染为“离线”',
        '直接显示“离线”，并报告不匹配错误',
        '先显示“离线”，再变成“在线”',
      ],
      answer: 1,
      explain:
        '水合时 React 调用第三个参数 getServerSnapshot，得到 true，与服务端 HTML 一致，不报错。水合完成后，React 发现 getSnapshot 返回 false，就重新渲染一次。第一项错在以为 getServerSnapshot 会一直生效：它只用于服务端渲染和水合。',
    },
    {
      q: `服务端组件把下面的 props 传给客户端组件 &lt;Chart&gt;。哪一个会导致报错？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;Chart
  createdAt={new Date()}
  tags={new Set(['新品'])}
  legend={&lt;Legend items={items} /&gt;}
  format={(n) =&gt; n.toFixed(2)}
/&gt;</code></pre></div>`,
      options: ['createdAt：Date 不能序列化', 'tags：Set 不能序列化', 'legend：JSX 不能跨边界', 'format：普通函数不能跨边界'],
      answer: 3,
      explain:
        'RSC 的序列化格式支持 Date、Map、Set、Promise 和 JSX 元素。JSX 跨边界是组合模式的基础：Legend 在服务器渲染，客户端组件拿到的是结果。普通函数无法变成数据，只有 Server Function 可以传。需要格式化时，把函数写在客户端组件里，或传一个字符串参数（例如小数位数）。',
    },
  ],
  plays: {
    '选择性水合：点哪块，哪块先水合': {
      note: '只要在 1 秒内点了“页脚”，它就第一个“水合完成”，并立刻“收到点击”。过程是：区块由很多小组件组成，React 每渲染完一个小组件就让出主线程，浏览器趁机处理点击。React 发现目标在未水合的边界里，就同步水合这个边界，再把点击交给它。之前渲染了一半的区块还没有提交，要重新渲染，所以总时间变长了，但用户点的那块最早能用。不点的话，三块在同一次提交里一起完成。',
      predict: {
        q: '点“载入服务端 HTML 并开始水合”，然后立刻点“页脚”按钮。控制台里哪一块最先打印“水合完成”？',
        options: [
          '评论：它排在第一个，React 按顺序水合',
          '页脚：用户点了它，它被提前',
          '三块同时打印：它们在同一次提交里完成',
          '都不会打印：点击打断了水合，需要刷新页面',
        ],
        answer: 1,
        explain:
          '用户点击未水合的边界时，React 会同步水合这个边界，再分发这次点击。最迷惑的是“三块同时”：不点击时确实如此，三个边界在同一次提交里完成。点击会打断正在做的工作，“页脚”单独先提交。',
      },
      pkey: 'streaming-ssr|选择性水合：点哪块，哪块先水合',
    },
    '同一段 HTML，三种客户端数据': {
      note: '甲：两个段落都保留，没有错误。乙：库存在边界外，不一致导致整个根改为客户端渲染，两个段落都被替换。丙：评分在边界内，只替换这个边界，库存段落保留。控制台里每个案例有一条可恢复错误，后面的差异里，+ 行是客户端的值，- 行是服务端的值，组件路径能看出不一致发生在边界外还是边界内。Suspense 边界既是流式和水合的单位，也是“出错后重做多大范围”的单位。',
      predict: {
        q: '看“丙”：评分在 Suspense 边界内，客户端是 4.9，服务端是 4.8。水合后，哪些服务端节点还在页面上？',
        options: [
          '两个段落都保留，React 只把文字改成 4.9',
          '库存段落保留，评分段落被替换',
          '两个段落都被替换，整个根改为客户端渲染',
          '两个段落都保留，页面仍显示 4.8',
        ],
        answer: 1,
        explain:
          '文字不一致时，React 不会就地修补文字，而是丢弃最近的 Suspense 边界里的服务端 HTML，在客户端重新渲染这一块。边界外的库存段落不受影响。“整个根”是乙的情况：错误发生在边界外。“只改文字”是最常见的误解：连加了 suppressHydrationWarning 的元素，React 19 也只是不报错，保留服务端的文字。',
      },
      pkey: 'streaming-ssr|同一段 HTML，三种客户端数据',
    },
    '浏览器会改写无效的 HTML': {
      note: '第一行：<code>&lt;p&gt;</code> 遇到 <code>&lt;div&gt;</code> 会自动结束，多出一个空的 <code>&lt;p&gt;</code>。第二行：浏览器补上了 <code>&lt;tbody&gt;</code>。第三行：链接不能嵌套，被拆成两个。React 水合时按自己的树认领节点，结构对不上就报错。用 createRoot 在客户端渲染时，DOM 由 React 直接创建，不经过解析器，所以同样的 JSX 在纯客户端应用里不会出问题。',
    },
  },
} satisfies Lesson;
