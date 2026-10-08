const app = `
function App() {
  const [text, setText] = useState('');
  const keyword = useDebounce(text, 300);
  return (
    <div>
      <input id="q" value={text} onChange={e => setText(e.target.value)} />
      <p>输入：<span id="typed">{text}</span></p>
      <p>搜索词：<span id="keyword">{keyword}</span></p>
    </div>
  );
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /刚变成 'ab' 时，返回值应还是 'a'/ },
  {
    name: '错误 A：计时器不清理',
    expect: 'fail',
    match: /不该出现在返回值里.*清掉上一个计时器/,
    code: `import { useState, useEffect } from 'react';
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    setTimeout(() => setDebounced(value), delay);
  }, [value, delay]);
  return debounced;
}
${app}`,
  },
  {
    name: '错误 B：delay 写死成 3000，不随参数',
    expect: 'fail',
    match: /稳定超过 delay 之后.*写死/,
    code: `import { useState, useEffect } from 'react';
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), 3000);
    return () => clearTimeout(id);
  }, [value]);
  return debounced;
}
${app}`,
  },
  {
    name: '错误 C：依赖数组为空，之后永远不更新',
    expect: 'fail',
    match: /应更新为 'abc'/,
    code: `import { useState, useEffect } from 'react';
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, []);
  return debounced;
}
${app}`,
  },
  {
    name: '错误 D：立刻更新（没有延迟）',
    expect: 'fail',
    match: /还不到 delay|返回值应还是 'a'/,
    code: `import { useState, useEffect } from 'react';
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    setDebounced(value);
  }, [value]);
  return debounced;
}
${app}`,
  },
  {
    name: '不同写法：用 useRef 存计时器 id，清理放在 effect 返回值里',
    expect: 'pass',
    code: `import { useState, useEffect, useRef } from 'react';
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef(0);
  useEffect(() => {
    timer.current = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer.current);
  }, [value, delay]);
  return debounced;
}
${app}`,
  },
];
