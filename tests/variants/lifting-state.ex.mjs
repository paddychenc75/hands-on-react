// 状态提升正式练习的变体
const PANEL = (extra = '') => `function Panel({ id, title, isActive, onShow, children }) {
${extra}  return (
    <section id={id}>
      <h3>{title}</h3>
      {isActive ? <p className="content">{children}</p> : <button onClick={onShow}>展开</button>}
    </section>
  );
}
`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /p1|收起|state|提升/ },
  {
    name: 'Panel 仍有自己的 state（各存一份）',
    expect: 'fail',
    match: /Panel 里还有自己的 state|自动收起|p1 应自动收起/,
    code: `import { useState } from 'react';

function Panel({ id, title, isActive, onShow, children }) {
  const [open, setOpen] = useState(isActive);
  return (
    <section id={id}>
      <h3>{title}</h3>
      {open ? <p className="content">{children}</p> : <button onClick={() => { setOpen(true); onShow(); }}>展开</button>}
    </section>
  );
}

function App() {
  const [activeId, setActiveId] = useState('p1');
  return (
    <div>
      <Panel id="p1" title="关于" isActive={activeId === 'p1'} onShow={() => setActiveId('p1')}>杭州的一家小书店。</Panel>
      <Panel id="p2" title="营业时间" isActive={activeId === 'p2'} onShow={() => setActiveId('p2')}>每天 9:00 到 21:00。</Panel>
    </div>
  );
}`,
  },
  {
    name: '展开的是哪一个存在组件外的模块变量',
    expect: 'fail',
    match: /互相影响|组件外面|没有按预期/,
    code: `import { useState } from 'react';

let activeId = 'p1';
${PANEL()}
function App() {
  const [, force] = useState(0);
  const show = id => { activeId = id; force(n => n + 1); };
  return (
    <div>
      <Panel id="p1" title="关于" isActive={activeId === 'p1'} onShow={() => show('p1')}>杭州的一家小书店。</Panel>
      <Panel id="p2" title="营业时间" isActive={activeId === 'p2'} onShow={() => show('p2')}>每天 9:00 到 21:00。</Panel>
    </div>
  );
}`,
  },
  {
    name: '不同写法：App 用 useReducer 和 map 渲染，Panel 用 memo 包裹',
    expect: 'pass',
    code: `import { useReducer, memo } from 'react';

const Panel = memo(function Panel({ id, title, isActive, onShow, children }) {
  return (
    <section id={id}>
      <h3>{title}</h3>
      {isActive ? <p className="content">{children}</p> : <button onClick={() => onShow(id)}>展开</button>}
    </section>
  );
});

const PANELS = [
  { id: 'p1', title: '关于', body: '杭州的一家小书店。' },
  { id: 'p2', title: '营业时间', body: '每天 9:00 到 21:00。' },
];

function App() {
  const [active, setActive] = useReducer((_, id) => id, 'p1');
  return (
    <div>
      {PANELS.map(p => (
        <Panel key={p.id} id={p.id} title={p.title} isActive={active === p.id} onShow={setActive}>{p.body}</Panel>
      ))}
    </div>
  );
}`,
  },
];
