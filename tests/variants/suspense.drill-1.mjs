const head = `import { Suspense, use } from 'react';
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
const gates = { post: deferred(), side: deferred() };
function Header() { return <h1 id="header">我的博客</h1>; }
function Post() { return <article id="post">{use(gates.post.promise)}</article>; }
function Side() { return <aside id="side">{use(gates.side.promise)}</aside>; }
const buttons = (
  <>
    <button id="arrive-post" onClick={() => gates.post.resolve('文章正文')}>文章到了</button>
    <button id="arrive-side" onClick={() => gates.side.resolve('相关推荐')}>侧栏到了</button>
  </>
);
`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /页头 #header 不见了/ },
  {
    name: '错误 A：页头挪出来了，但文章和侧栏共用一个边界',
    expect: 'fail',
    match: /共用了一个 Suspense 边界/,
    code:
      head +
      `function App() {
  return (
    <div>
      <Header />
      <Suspense fallback={<><p id="post-loading">文章加载中…</p><p id="side-loading">侧栏加载中…</p></>}>
        <Post />
        <Side />
      </Suspense>
      {buttons}
    </div>
  );
}`,
  },
  {
    name: '错误 B：投机，不用 use()，也不用 Suspense',
    expect: 'fail',
    match: /应显示 <p id="post-loading">/,
    code: `import { useState } from 'react';
function App() {
  const [post, setPost] = useState('');
  const [side, setSide] = useState('');
  return (
    <div>
      <h1 id="header">我的博客</h1>
      {post && <article id="post">{post}</article>}
      {side && <aside id="side">{side}</aside>}
      <button id="arrive-post" onClick={() => setPost('文章正文')}>文章到了</button>
      <button id="arrive-side" onClick={() => setSide('相关推荐')}>侧栏到了</button>
    </div>
  );
}`,
  },
  {
    name: '不同写法：抽成带边界的 Slot 组件，嵌套在外层容器里',
    expect: 'pass',
    code:
      head +
      `function Slot({ fallback, children }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
function Page() {
  return (
    <main>
      <Header />
      <section>
        <Slot fallback={<p id="post-loading">加载中</p>}><Post /></Slot>
        <Slot fallback={<p id="side-loading">加载中</p>}><Side /></Slot>
      </section>
    </main>
  );
}
function App() {
  return <div><Page />{buttons}</div>;
}`,
  },
];
