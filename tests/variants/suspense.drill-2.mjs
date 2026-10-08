const head = `import { Component, Suspense, use } from 'react';
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
const gates = { weather: deferred(), news: deferred() };
function Weather() { return <p id="weather">{use(gates.weather.promise)}</p>; }
function News() { return <p id="news">{use(gates.news.promise)}</p>; }
const buttons = (
  <>
    <button id="weather-fail" onClick={() => gates.weather.reject(new Error('天气请求失败'))}>天气失败</button>
    <button id="news-ok" onClick={() => gates.news.resolve('今日新闻')}>新闻到了</button>
  </>
);
const wf = <p id="weather-error">天气加载失败</p>;
const wl = <p id="weather-loading">天气加载中…</p>;
const nl = <p id="news-loading">新闻加载中…</p>;
`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /没有出现 #weather-error/ },
  {
    name: '错误 A：一个错误边界包住天气和新闻',
    expect: 'fail',
    match: /天气失败连累了新闻/,
    code:
      head +
      `function App() {
  return (
    <div>
      <h1 id="title">今日简报</h1>
      <ErrorBoundary fallback={wf}>
        <Suspense fallback={wl}><Weather /></Suspense>
        <Suspense fallback={nl}><News /></Suspense>
      </ErrorBoundary>
      {buttons}
    </div>
  );
}`,
  },
  {
    name: '错误 B：错误边界包住整个页面',
    expect: 'fail',
    match: /标题不见了|连累了新闻/,
    code:
      head +
      `function App() {
  return (
    <ErrorBoundary fallback={wf}>
      <div>
        <h1 id="title">今日简报</h1>
        <Suspense fallback={wl}><Weather /></Suspense>
        <Suspense fallback={nl}><News /></Suspense>
        {buttons}
      </div>
    </ErrorBoundary>
  );
}`,
  },
  {
    name: '错误 C：投机，天气永远显示“失败”',
    expect: 'fail',
    match: /天气加载期间应显示 #weather-loading/,
    code:
      head +
      `function App() {
  return (
    <div>
      <h1 id="title">今日简报</h1>
      {wf}
      <Suspense fallback={nl}><News /></Suspense>
      {buttons}
    </div>
  );
}`,
  },
  {
    name: '不同写法：Suspense 在外、错误边界在内，并抽成 Widget 组件',
    expect: 'pass',
    code:
      head +
      `function Widget({ loading, error, children }) {
  return (
    <Suspense fallback={loading}>
      <ErrorBoundary fallback={error}>{children}</ErrorBoundary>
    </Suspense>
  );
}
function App() {
  return (
    <div>
      <h1 id="title">今日简报</h1>
      <Widget loading={wl} error={wf}><Weather /></Widget>
      <Widget loading={nl} error={<p id="news-error">新闻加载失败</p>}><News /></Widget>
      {buttons}
    </div>
  );
}`,
  },
];
