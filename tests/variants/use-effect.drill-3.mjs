const head = `const ALL = [
  { id: 1, name: '苹果', kind: '水果' },
  { id: 2, name: '西瓜', kind: '水果' },
  { id: 3, name: '黄瓜', kind: '蔬菜' },
  { id: 4, name: '白菜', kind: '蔬菜' },
];
let renders = 0;`;
const view = `  return (
    <div>
      <button id="all" onClick={() => setKind('全部')}>全部</button>
      <button id="fruit" onClick={() => setKind('水果')}>水果</button>
      <button id="veg" onClick={() => setKind('蔬菜')}>蔬菜</button>
      <ul id="list">{visible.map(x => <li key={x.id}>{x.name}</li>)}</ul>
      <p>App 渲染了 <span id="renders">{renders}</span> 次</p>
    </div>
  );
}`;
const calc = `kind === '全部' ? ALL : ALL.filter(x => x.kind === kind)`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /渲染了 2 次，应只有 1 次/ },
  {
    name: '错误 A：换成 useLayoutEffect，仍是 state + effect',
    expect: 'fail',
    match: /渲染了 2 次.*不需要 state/,
    code: `import { useState, useLayoutEffect } from 'react';
${head}
function App() {
  renders++;
  const [kind, setKind] = useState('全部');
  const [visible, setVisible] = useState(ALL);
  useLayoutEffect(() => {
    setVisible(${calc});
  }, [kind]);
${view}`,
  },
  {
    name: '错误 B：在渲染中比较并 set（仍多一轮）',
    expect: 'fail',
    match: /渲染了 2 次/,
    code: `import { useState } from 'react';
${head}
function App() {
  renders++;
  const [kind, setKind] = useState('全部');
  const [prev, setPrev] = useState('全部');
  const [visible, setVisible] = useState(ALL);
  if (prev !== kind) {
    setPrev(kind);
    setVisible(${calc});
  }
${view}`,
  },
  {
    name: '错误 C：写死“全部”，不随 kind 变化',
    expect: 'fail',
    match: /列表应为“苹果、西瓜”/,
    code: `import { useState } from 'react';
${head}
function App() {
  renders++;
  const [kind, setKind] = useState('全部');
  const visible = ALL;
${view}`,
  },
  {
    name: '不同写法：useMemo 派生',
    expect: 'pass',
    code: `import { useState, useMemo } from 'react';
${head}
function App() {
  renders++;
  const [kind, setKind] = useState('全部');
  const visible = useMemo(() => ${calc}, [kind]);
${view}`,
  },
];
