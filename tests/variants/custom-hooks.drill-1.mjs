const comps = `
function Nickname() {
  const [name, setName] = useLocalStorage('demo-nick', '访客');
  return <input id="nick" value={name} onChange={e => setName(e.target.value)} />;
}
function Theme() {
  const [dark, setDark] = useLocalStorage('demo-dark', false);
  return (
    <label>
      <input id="dark" type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} /> 深色
    </label>
  );
}
function App() {
  return <div><Nickname /><Theme /></div>;
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /第一次渲染应读到它/ },
  {
    name: '错误 A：只读不写',
    expect: 'fail',
    match: /应写回 localStorage/,
    code: `import { useState, useEffect } from 'react';
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved === null ? initial : JSON.parse(saved);
  });
  return [value, setValue];
}
${comps}`,
  },
  {
    name: '错误 B：只写不读，每次都用 initial',
    expect: 'fail',
    match: /第一次渲染应读到它/,
    code: `import { useState, useEffect } from 'react';
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}
${comps}`,
  },
  {
    name: '错误 C：Hook 写对了，但组件还在自己读写',
    expect: 'fail',
    match: /还在自己读写 localStorage/,
    code: `import { useState, useEffect } from 'react';
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved === null ? initial : JSON.parse(saved);
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}
function Nickname() {
  const [name, setName] = useLocalStorage('demo-nick', '访客');
  localStorage.getItem('demo-nick');
  return <input id="nick" value={name} onChange={e => setName(e.target.value)} />;
}
function Theme() {
  const [dark, setDark] = useLocalStorage('demo-dark', false);
  return (
    <label>
      <input id="dark" type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} /> 深色
    </label>
  );
}
function App() {
  return <div><Nickname /><Theme /></div>;
}`,
  },
  {
    name: '不同写法：在 setter 里同步写入（无 effect）',
    expect: 'pass',
    code: `import { useState, useCallback } from 'react';
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved === null ? initial : JSON.parse(saved);
    } catch {
      return initial;
    }
  });
  const set = useCallback(next => {
    setValue(next);
    localStorage.setItem(key, JSON.stringify(next));
  }, [key]);
  return [value, set];
}
${comps}`,
  },
];
