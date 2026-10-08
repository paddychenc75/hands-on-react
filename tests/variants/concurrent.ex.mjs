// 并发渲染正式练习的变体
const HEAD = `import { useState, useDeferredValue, useTransition, memo } from 'react';

const ITEMS = Array.from({ length: 400 }, (_, i) => '商品 ' + (i + 1));

// 一个故意很慢的列表项：每项渲染耗时 1ms（不要修改）
function SlowItem({ text }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}
  return <li>{text}</li>;
}
`;
const LIST = wrap => `
const ResultList = ${wrap ? 'memo(' : '('}function ResultList({ query }) {
  const shown = ITEMS.filter(x => x.includes(query));
  return (
    <>
      <p>找到 <span id="count">{shown.length}</span> 项</p>
      <ul style={{ height: 140, overflow: 'auto' }}>
        {shown.map(x => <SlowItem key={x} text={x} />)}
      </ul>
    </>
  );
});
`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail' },
  {
    name: '用 setTimeout 防抖，不用 transition',
    expect: 'fail',
    match: /过渡更新|setTimeout/,
    code:
      HEAD +
      LIST(true) +
      `
function App() {
  const [query, setQuery] = useState('');
  const [shownQuery, setShownQuery] = useState('');
  const stale = query !== shownQuery;
  return (
    <div>
      <input id="q" value={query} onChange={e => { setQuery(e.target.value); setTimeout(() => setShownQuery(e.target.value), 300); }} />
      <div id="results" style={{ opacity: stale ? 0.5 : 1 }}>
        <ResultList query={shownQuery} />
      </div>
    </div>
  );
}`,
  },
  {
    name: '用了 useDeferredValue 但没包 memo',
    expect: 'fail',
    match: /占用|memo/,
    code:
      HEAD +
      LIST(false) +
      `
function App() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const stale = query !== deferredQuery;
  return (
    <div>
      <input id="q" value={query} onChange={e => setQuery(e.target.value)} />
      <div id="results" style={{ opacity: stale ? 0.5 : 1 }}>
        <ResultList query={deferredQuery} />
      </div>
    </div>
  );
}`,
  },
  {
    name: '不同写法：useTransition 包住列表的 state',
    expect: 'pass',
    code:
      HEAD +
      LIST(true) +
      `
function App() {
  const [text, setText] = useState('');
  const [listQuery, setListQuery] = useState('');
  const [pending, startTransition] = useTransition();
  return (
    <div>
      <input id="q" value={text} onChange={e => { const v = e.target.value; setText(v); startTransition(() => setListQuery(v)); }} />
      <div id="results" style={{ opacity: pending || text !== listQuery ? 0.5 : 1 }}>
        <ResultList query={listQuery} />
      </div>
    </div>
  );
}`,
  },
];
