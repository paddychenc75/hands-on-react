// 动画与过渡 变式 1：让卡片挂载时淡入
const wrap = css => `import { useState } from 'react';

function App() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <style>{\`
        ${css}
      \`}</style>
      <button id="toggle" onClick={() => setOpen(!open)}>{open ? '关闭' : '打开'}</button>
      {open && <p id="box" className="box">我是一张卡片</p>}
    </div>
  );
}
`;
const BASE = '.box { padding: 12px; background: #cfe8f3; color: #0f1d24; transition: opacity 600ms; }';
export default [
  { name: '参考答案 (@starting-style)', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /淡入|起点/ },
  {
    name: '用 keyframes 动画代替过渡（合理的不同写法）',
    expect: 'pass',
    code: wrap(BASE + ' @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } } .box { animation: fade-in 600ms; }'),
  },
  {
    name: '下一帧改类名（两层 rAF）',
    expect: 'pass',
    code: `import { useState, useEffect } from 'react';

function Card() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let id = requestAnimationFrame(() => { id = requestAnimationFrame(() => setShown(true)); });
    return () => cancelAnimationFrame(id);
  }, []);
  return <p id="box" className={shown ? 'box shown' : 'box'}>我是一张卡片</p>;
}

function App() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <style>{\`
        .box { padding: 12px; background: #cfe8f3; color: #0f1d24; opacity: 0; transition: opacity 600ms; }
        .box.shown { opacity: 1; }
      \`}</style>
      <button id="toggle" onClick={() => setOpen(!open)}>{open ? '关闭' : '打开'}</button>
      {open && <Card />}
    </div>
  );
}
`,
  },
  {
    name: '错误：effect 里立刻改类名，浏览器没来得及算初始样式',
    expect: 'fail',
    match: /淡入|起点/,
    code: `import { useState, useEffect } from 'react';

function Card() {
  const [shown, setShown] = useState(false);
  useEffect(() => { setShown(true); }, []);
  return <p id="box" className={shown ? 'box shown' : 'box'}>我是一张卡片</p>;
}

function App() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <style>{\`
        .box { padding: 12px; background: #cfe8f3; color: #0f1d24; opacity: 0; transition: opacity 600ms; }
        .box.shown { opacity: 1; }
      \`}</style>
      <button id="toggle" onClick={() => setOpen(!open)}>{open ? '关闭' : '打开'}</button>
      {open && <Card />}
    </div>
  );
}
`,
  },
  {
    name: '错误：@starting-style 写了，但元素上没有 transition',
    expect: 'fail',
    match: /淡入|起点/,
    code: wrap('.box { padding: 12px; background: #cfe8f3; color: #0f1d24; } @starting-style { .box { opacity: 0; } }'),
  },
  {
    name: '错误：永远透明（起点对了，终点没设）',
    expect: 'fail',
    match: /opacity 应该是 1|淡入/,
    code: wrap('.box { padding: 12px; background: #cfe8f3; color: #0f1d24; opacity: 0; transition: opacity 600ms; }'),
  },
];
