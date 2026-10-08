export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /只剩 1 个 keydown 监听器.*清理函数/ },
  {
    name: '错误 A：改成函数式更新但没有清理',
    expect: 'fail',
    match: /监听器.*清理函数/,
    code: `import { useState, useEffect } from 'react';
function App() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Enter') setCount(c => c + 1);
    }
    window.addEventListener('keydown', onKey);
  }, []);
  return <p>按 Enter 的次数：<span id="count">{count}</span></p>;
}`,
  },
  {
    name: '错误 B：有清理但仍是旧 count',
    expect: 'fail',
    match: /按 3 次 Enter 应显示 3.*最新值/,
    code: `import { useState, useEffect } from 'react';
function App() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Enter') setCount(count + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <p>按 Enter 的次数：<span id="count">{count}</span></p>;
}`,
  },
  {
    name: '错误 C：任何键都计数',
    expect: 'fail',
    match: /按 a 键不该计数/,
    code: `import { useState, useEffect } from 'react';
function App() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    function onKey() {
      setCount(c => c + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <p>按 Enter 的次数：<span id="count">{count}</span></p>;
}`,
  },
  {
    name: '不同写法：依赖 [count]，每次重新订阅',
    expect: 'pass',
    code: `import { useState, useEffect } from 'react';
function App() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Enter') setCount(count + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count]);
  return <p>按 Enter 的次数：<span id="count">{count}</span></p>;
}`,
  },
];
