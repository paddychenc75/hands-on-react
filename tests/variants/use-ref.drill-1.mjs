const ui = prevExpr => `
  return (
    <div>
      <p>现在：<b id="now">{count}</b></p>
      <p>上一次：<b id="prev">{${prevExpr}}</b></p>
      <button onClick={() => setCount(count + 1)}>加 1</button>
      <button onClick={() => setTick(t => t + 1)}>刷新</button>
    </div>
  );
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /上一次应显示 0/ },
  {
    name: '错误 A：用组件里的普通变量，每次渲染都被重置',
    expect: 'fail',
    match: /上一次应显示 0/,
    code: `import { useState } from 'react';
function App() {
  const [count, setCount] = useState(0);
  const [, setTick] = useState(0);
  let last;
  const prev = last;
  last = count;${ui("prev === undefined ? '无' : prev")}`,
  },
  {
    name: '错误 B：把上一次的值存成 state，在 effect 里更新',
    expect: 'fail',
    match: /第一次渲染时“上一次”应显示“无”/,
    code: `import { useState, useEffect } from 'react';
function App() {
  const [count, setCount] = useState(0);
  const [, setTick] = useState(0);
  const [prev, setPrev] = useState(undefined);
  useEffect(() => { setPrev(count); }, [count]);${ui("prev === undefined ? '无' : prev")}`,
  },
  {
    name: '错误 C：渲染期间先把 ref 写成当前值再读（读到的就是现在）',
    expect: 'fail',
    match: /第一次渲染时“上一次”应显示“无”/,
    code: `import { useState, useRef } from 'react';
function App() {
  const [count, setCount] = useState(0);
  const [, setTick] = useState(0);
  const ref = useRef(undefined);
  ref.current = count;
  const prev = ref.current;${ui("prev === undefined ? '无' : prev")}`,
  },
  {
    name: '不同写法：effect 只在 [count] 变化时更新 ref',
    expect: 'pass',
    code: `import { useState, useRef, useEffect } from 'react';
function App() {
  const [count, setCount] = useState(0);
  const [, setTick] = useState(0);
  const ref = useRef(undefined);
  const prev = ref.current;
  useEffect(() => { ref.current = count; }, [count]);${ui("prev === undefined ? '无' : prev")}`,
  },
  {
    name: '不同写法：抽成 usePrevious 自定义 Hook，用 useLayoutEffect',
    expect: 'pass',
    code: `import { useState, useRef, useLayoutEffect } from 'react';
function usePrevious(value) {
  const ref = useRef();
  const previous = ref.current;
  useLayoutEffect(() => { ref.current = value; });
  return previous;
}
function App() {
  const [count, setCount] = useState(0);
  const [, setTick] = useState(0);
  const prev = usePrevious(count);${ui("prev ?? '无'")}`,
  },
];
