const heavy = `let heavyRenders = 0;
function Heavy() {
  heavyRenders++;
  return <p>Heavy 渲染次数：<span id="heavy">{heavyRenders}</span></p>;
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /Heavy 仍在重新渲染.*作为 children/ },
  {
    name: '错误 A：用 memo 包住 Heavy',
    expect: 'fail',
    match: /不要使用 memo/,
    code: `import { useState, memo } from 'react';
let heavyRenders = 0;
const Heavy = memo(function Heavy() {
  heavyRenders++;
  return <p>Heavy 渲染次数：<span id="heavy">{heavyRenders}</span></p>;
});
function Panel() {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button id="toggle" onClick={() => setOpen(!open)}>{open ? '收起' : '展开'}详情</button>
      {open && <p id="detail">这里是详情</p>}
      <Heavy />
    </section>
  );
}
function App() {
  return <Panel />;
}`,
  },
  {
    name: '错误 B：把 state 搬到 App，Panel 只接 props',
    expect: 'fail',
    match: /Heavy 仍在重新渲染/,
    code: `import { useState } from 'react';
${heavy}
function Panel({ open, onToggle, children }) {
  return (
    <section>
      <button id="toggle" onClick={onToggle}>{open ? '收起' : '展开'}详情</button>
      {open && <p id="detail">这里是详情</p>}
      {children}
    </section>
  );
}
function App() {
  const [open, setOpen] = useState(false);
  return (
    <Panel open={open} onToggle={() => setOpen(!open)}>
      <Heavy />
    </Panel>
  );
}`,
  },
  {
    name: '错误 C：Heavy 挪到 section 外面',
    expect: 'fail',
    match: /仍显示在 Panel 的 <section> 里面/,
    code: `import { useState } from 'react';
${heavy}
function Panel() {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button id="toggle" onClick={() => setOpen(!open)}>{open ? '收起' : '展开'}详情</button>
      {open && <p id="detail">这里是详情</p>}
    </section>
  );
}
function App() {
  return (
    <>
      <Panel />
      <Heavy />
    </>
  );
}`,
  },
  {
    name: '不同写法：用具名 prop（footer）传入元素',
    expect: 'pass',
    code: `import { useState } from 'react';
${heavy}
function Panel({ footer }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button id="toggle" onClick={() => setOpen(!open)}>{open ? '收起' : '展开'}详情</button>
      {open && <p id="detail">这里是详情</p>}
      {footer}
    </section>
  );
}
function App() {
  return <Panel footer={<Heavy />} />;
}`,
  },
];
