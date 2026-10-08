// 动画与过渡 变式 2：usePrefersReducedMotion
const APP = `
function App() {
  const reduce = usePrefersReducedMotion();
  return <p>{reduce ? '已开启减少动画：不播放位移动画' : '正常播放动画'}</p>;
}
`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /matchMedia/ },
  {
    name: '错误：只读一次，不订阅',
    expect: 'fail',
    match: /change|订阅/,
    code:
      `import { useSyncExternalStore } from 'react';
function usePrefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}` + APP,
  },
  {
    name: '错误：useState(false) + effect，第一次渲染是错的',
    expect: 'fail',
    match: /第一次渲染/,
    code:
      `import { useState, useEffect } from 'react';
function usePrefersReducedMotion() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setV(m.matches);
    const on = () => setV(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return v;
}` + APP,
  },
  {
    name: '错误：订阅了但不取消',
    expect: 'fail',
    match: /取消/,
    code:
      `import { useSyncExternalStore } from 'react';
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    cb => { window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', cb); return () => {}; },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
}` + APP,
  },
  {
    name: '不同写法：useState 懒初始化 + effect 订阅',
    expect: 'pass',
    code:
      `import { useState, useEffect } from 'react';
function usePrefersReducedMotion() {
  const [v, setV] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setV(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return v;
}` + APP,
  },
  {
    name: '不同写法：subscribe 和 getSnapshot 提到模块级',
    expect: 'pass',
    code:
      `import { useSyncExternalStore } from 'react';
const Q = '(prefers-reduced-motion: reduce)';
const subscribe = cb => { const m = window.matchMedia(Q); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); };
const getSnapshot = () => window.matchMedia(Q).matches;
const usePrefersReducedMotion = () => useSyncExternalStore(subscribe, getSnapshot, () => false);
` + APP,
  },
];
