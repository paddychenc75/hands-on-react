const app = (handler, link = `<a id="toggle" href="#" onClick={toggle}>{open ? '收起' : '展开'}</a>`, extra = '') => `import { useState } from 'react';
${extra}
function App() {
  const [open, setOpen] = useState(false);
${handler}
  return (
    <div>
      ${link}
      {open && <p id="more">这是更多内容。</p>}
    </div>
  );
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /默认行为.*没有被阻止/ },
  {
    name: '错误 A：用 stopPropagation 代替 preventDefault',
    expect: 'fail',
    match: /默认行为.*没有被阻止/,
    code: app(`  function toggle(e) { e.stopPropagation(); setOpen(o => !o); }`),
  },
  {
    name: '错误 B：return false（HTML 习惯）',
    expect: 'fail',
    match: /默认行为.*没有被阻止/,
    code: app(`  function toggle() { setOpen(o => !o); return false; }`),
  },
  {
    name: '错误 C：只第一次阻止',
    expect: 'fail',
    match: /第二次点击/,
    code: app(`  function toggle(e) { if (!open) e.preventDefault(); setOpen(o => !o); }`),
  },
  {
    name: '错误 D：换成按钮（没有保留链接）',
    expect: 'fail',
    match: /保留 <a> 链接/,
    code: app(`  function toggle() { setOpen(o => !o); }`, `<button id="toggle" onClick={toggle}>{open ? '收起' : '展开'}</button>`),
  },
  {
    name: '不同写法：内联箭头函数，非函数式更新',
    expect: 'pass',
    code: app(``, `<a id="toggle" href="#" onClick={e => { e.preventDefault(); setOpen(!open); }}>{open ? '收起' : '展开'}</a>`),
  },
  {
    name: '不同写法：拆出 ToggleLink 子组件，在子组件里阻止默认行为',
    expect: 'pass',
    code: `import { useState } from 'react';

function ToggleLink({ label, onToggle }) {
  return (
    <a id="toggle" href="#" onClick={e => { e.preventDefault(); onToggle(); }}>
      {label}
    </a>
  );
}

function App() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <ToggleLink label={open ? '收起' : '展开'} onToggle={() => setOpen(o => !o)} />
      {open && <p id="more">这是更多内容。</p>}
    </div>
  );
}`,
  },
];
