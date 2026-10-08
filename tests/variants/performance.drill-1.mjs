const badge = `let badgeRenders = 0;
const Badge = memo(function Badge({ style, label }) {
  badgeRenders++;
  return (
    <p>
      <span id="badge" style={style}>{label}</span> 渲染 <b id="badge-renders">{badgeRenders}</b> 次
    </p>
  );
});`;
const btns = (extra = '') => `
    <div>
      <button id="parent" onClick={() => setN(n + 1)}>父组件 {n}</button>
      <button id="color" onClick={() => setColor(color === 'crimson' ? 'teal' : 'crimson')}>换颜色</button>
      ${extra}
    </div>`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /Badge 仍在重新渲染.*style/ },
  {
    name: '错误 A：useMemo 依赖写成空数组（颜色不更新）',
    expect: 'fail',
    match: /应显示新颜色.*color/,
    code: `import { useState, useMemo, memo } from 'react';
${badge}
function App() {
  const [n, setN] = useState(0);
  const [color, setColor] = useState('crimson');
  const style = useMemo(() => ({ color, fontWeight: 'bold' }), []);
  return (${btns('<Badge style={style} label="新品" />')});
}`,
  },
  {
    name: '错误 B：依赖里多放了无关的 n',
    expect: 'fail',
    match: /Badge 仍在重新渲染/,
    code: `import { useState, useMemo, memo } from 'react';
${badge}
function App() {
  const [n, setN] = useState(0);
  const [color, setColor] = useState('crimson');
  const style = useMemo(() => ({ color, fontWeight: 'bold' }), [color, n]);
  return (${btns('<Badge style={style} label="新品" />')});
}`,
  },
  {
    name: '错误 C：把 style 提到组件外的常量（不随颜色变）',
    expect: 'fail',
    match: /应显示新颜色/,
    code: `import { useState, useMemo, memo } from 'react';
${badge}
const STYLE = { color: 'crimson', fontWeight: 'bold' };
function App() {
  const [n, setN] = useState(0);
  const [color, setColor] = useState('crimson');
  return (${btns('<Badge style={STYLE} label="新品" />')});
}`,
  },
  {
    name: '不同写法：只传简单值 color，Badge 内部拼 style',
    expect: 'pass',
    code: `import { useState, memo } from 'react';
let badgeRenders = 0;
const Badge = memo(function Badge({ color, label }) {
  badgeRenders++;
  return (
    <p>
      <span id="badge" style={{ color, fontWeight: 'bold' }}>{label}</span> 渲染 <b id="badge-renders">{badgeRenders}</b> 次
    </p>
  );
});
function App() {
  const [n, setN] = useState(0);
  const [color, setColor] = useState('crimson');
  return (${btns('<Badge color={color} label="新品" />')});
}`,
  },
];
