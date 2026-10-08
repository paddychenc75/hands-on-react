export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /重新渲染了 5 次|useRef/ },
  {
    name: '错误 A：用组件里的普通变量，渲染后被重置',
    expect: 'fail',
    match: /累计应是 8|普通变量/,
    code: `import { useState } from 'react';
function App() {
  let clicks = 0;
  const [shown, setShown] = useState(0);
  return (
    <div>
      <button onClick={() => { clicks += 1; }}>记一次</button>
      <button onClick={() => setShown(clicks)}>显示次数</button>
      <p>已显示：<b id="shown">{shown}</b></p>
    </div>
  );
}`,
  },
  {
    name: '错误 B：变量放在组件外面，两个 App 共用',
    expect: 'fail',
    match: /组件外面|共用/,
    code: `import { useState } from 'react';
let clicks = 0;
function App() {
  const [shown, setShown] = useState(0);
  return (
    <div>
      <button onClick={() => { clicks += 1; }}>记一次</button>
      <button onClick={() => setShown(clicks)}>显示次数</button>
      <p>已显示：<b id="shown">{shown}</b></p>
    </div>
  );
}`,
  },
  {
    name: '错误 C：投机，显示次数时直接显示 5 或 8（硬编码）',
    expect: 'fail',
    match: /应显示 5|累计应是 8|应显示 2|不该变/,
    code: `import { useState, useRef } from 'react';
function App() {
  const ref = useRef(0);
  const [shown, setShown] = useState(0);
  return (
    <div>
      <button onClick={() => { ref.current += 1; }}>记一次</button>
      <button onClick={() => setShown(s => s + 5)}>显示次数</button>
      <p>已显示：<b id="shown">{shown}</b></p>
    </div>
  );
}`,
  },
  {
    name: '错误 D：ref 记数，但记一次时顺手 setState，仍然触发渲染',
    expect: 'fail',
    match: /重新渲染了 5 次/,
    code: `import { useState, useRef } from 'react';
function App() {
  const ref = useRef(0);
  const [, setTick] = useState(0);
  const [shown, setShown] = useState(0);
  return (
    <div>
      <button onClick={() => { ref.current += 1; setTick(t => t + 1); }}>记一次</button>
      <button onClick={() => setShown(ref.current)}>显示次数</button>
      <p>已显示：<b id="shown">{shown}</b></p>
    </div>
  );
}`,
  },
  {
    name: '不同写法：次数存 ref，“显示”用强制重新渲染并在渲染时读 ref',
    expect: 'pass',
    code: `import { useReducer, useRef } from 'react';
function App() {
  const clicks = useRef(0);
  const shownAt = useRef(0);
  const [, force] = useReducer(n => n + 1, 0);
  return (
    <div>
      <button onClick={() => { clicks.current++; }}>记一次</button>
      <button onClick={() => { shownAt.current = clicks.current; force(); }}>显示次数</button>
      <p>已显示：<b id="shown">{shownAt.current}</b></p>
    </div>
  );
}`,
  },
];
