const list = (btn, extra = '', comp = '') => `import { useState } from 'react';
${comp}
function App() {
  const [fruits, setFruits] = useState([
    { id: 1, name: '苹果' },
    { id: 2, name: '香蕉' },
    { id: 3, name: '橙子' },
  ]);
  function remove(id) { setFruits(fruits.filter(f => f.id !== id)); }
${extra}
  return (
    <ul id="list">
      {fruits.map(f => (
        <li key={f.id}>
          <span>{f.name}</span>
          ${btn}
        </li>
      ))}
    </ul>
  );
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /把本行的 id 交给 remove/ },
  {
    name: '错误 A：永远删第一行（写死 id）',
    expect: 'fail',
    match: /点“香蕉”那一行/,
    code: list(`<button onClick={() => remove(1)}>删除</button>`),
  },
  {
    name: '错误 B：onClick={remove(f.id)}，渲染时就调用',
    expect: 'fail',
    code: list(`<button onClick={remove(f.id)}>删除</button>`),
  },
  {
    name: '错误 C：传了事件对象的某个属性而不是 id（e.target.id）',
    expect: 'fail',
    match: /把本行的 id 交给 remove/,
    code: list(`<button onClick={e => remove(e.target.id)}>删除</button>`),
  },
  {
    name: '不同写法：bind 预先绑定参数',
    expect: 'pass',
    code: list(`<button onClick={remove.bind(null, f.id)}>删除</button>`),
  },
  {
    name: '不同写法：data-id 属性加事件对象',
    expect: 'pass',
    code: list(`<button data-id={f.id} onClick={e => remove(Number(e.currentTarget.dataset.id))}>删除</button>`),
  },
  {
    name: '不同写法：子组件 Row 通过 onRemove 通知父组件',
    expect: 'pass',
    code: `import { useState } from 'react';

function Row({ fruit, onRemove }) {
  return (
    <li>
      <span>{fruit.name}</span>
      <button onClick={() => onRemove(fruit.id)}>删除</button>
    </li>
  );
}

function App() {
  const [fruits, setFruits] = useState([
    { id: 1, name: '苹果' },
    { id: 2, name: '香蕉' },
    { id: 3, name: '橙子' },
  ]);
  return (
    <ul id="list">
      {fruits.map(f => (
        <Row key={f.id} fruit={f} onRemove={id => setFruits(fs => fs.filter(x => x.id !== id))} />
      ))}
    </ul>
  );
}`,
  },
];
