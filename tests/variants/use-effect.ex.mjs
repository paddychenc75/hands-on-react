// useEffect 正式练习的变体
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /还是 0|setInterval/ },
  {
    name: '没写清理函数',
    expect: 'fail',
    match: /清理函数|严格模式/,
    code: `import { useState, useEffect } from 'react';

function App() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    setInterval(() => setSeconds(s => s + 1), 1000);
  }, []);
  return <p id="seconds">{seconds}</p>;
}`,
  },
  {
    name: '没用函数式更新（闭包里永远是 0）',
    expect: 'fail',
    match: /函数式更新/,
    code: `import { useState, useEffect } from 'react';

function App() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds(seconds + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <p id="seconds">{seconds}</p>;
}`,
  },
  {
    name: '不同写法：useReducer 加递归 setTimeout，清理里取消',
    expect: 'pass',
    code: `import { useReducer, useEffect } from 'react';

function App() {
  const [seconds, tick] = useReducer(n => n + 1, 0);
  useEffect(() => {
    let id;
    const loop = () => {
      id = setTimeout(() => { tick(); loop(); }, 1000);
    };
    loop();
    return () => clearTimeout(id);
  }, []);
  return <p id="seconds">{seconds}</p>;
}`,
  },
  {
    name: '用 ref 防重复启动但不清理：卸载后定时器还在',
    expect: 'fail',
    match: /卸载/,
    code: `import { useState, useEffect, useRef } from 'react';

function App() {
  const [seconds, setSeconds] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setInterval(() => setSeconds(s => s + 1), 1000);
  }, []);
  return <p id="seconds">{seconds}</p>;
}`,
  },
];
