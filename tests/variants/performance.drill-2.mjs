const rowBody = `
  renders[item.id] = (renders[item.id] || 0) + 1;
  return (
    <li>
      <label>
        <input id={'c' + item.id} type="checkbox" checked={item.done} onChange={() => %CALL%} />
        {item.name}
      </label>
      <small> 渲染 <span id={'r' + item.id}>{renders[item.id]}</span> 次</small>
    </li>
  );`;
const head = `const INIT = [1, 2, 3, 4, 5].map(id => ({ id, name: '任务 ' + id, done: false }));
const renders = {};`;
const list = props => `
  return (
    <ul>
      {items.map(item => (
        <Row key={item.id} item={item} ${props} />
      ))}
    </ul>
  );`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /也重新渲染了.*memo/ },
  {
    name: '错误 A：只加了 memo，传的是每次新建的箭头函数',
    expect: 'fail',
    match: /也重新渲染了.*onToggle/,
    code: `import { useState, memo } from 'react';
${head}
const Row = memo(function Row({ item, onToggle }) {${rowBody.replace('%CALL%', 'onToggle()')}
});
function App() {
  const [items, setItems] = useState(INIT);
  const toggle = id => setItems(prev => prev.map(x => (x.id === id ? { ...x, done: !x.done } : x)));
${list('onToggle={() => toggle(item.id)}')}
}`,
  },
  {
    name: '错误 B：useCallback 依赖 items，每次勾选后函数都变',
    expect: 'fail',
    match: /也重新渲染了/,
    code: `import { useState, useCallback, memo } from 'react';
${head}
const Row = memo(function Row({ item, onToggle }) {${rowBody.replace('%CALL%', 'onToggle(item.id)')}
});
function App() {
  const [items, setItems] = useState(INIT);
  const toggle = useCallback(id => setItems(items.map(x => (x.id === id ? { ...x, done: !x.done } : x))), [items]);
${list('onToggle={toggle}')}
}`,
  },
  {
    name: '错误 C：useCallback 依赖 []，但仍读旧的 items',
    expect: 'fail',
    match: /稳定后的 toggle 是不是还在读旧的 items/,
    code: `import { useState, useCallback, memo } from 'react';
${head}
const Row = memo(function Row({ item, onToggle }) {${rowBody.replace('%CALL%', 'onToggle(item.id)')}
});
function App() {
  const [items, setItems] = useState(INIT);
  const toggle = useCallback(id => setItems(items.map(x => (x.id === id ? { ...x, done: !x.done } : x))), []);
${list('onToggle={toggle}')}
}`,
  },
  {
    name: '不同写法：useReducer，把稳定的 dispatch 传给 Row',
    expect: 'pass',
    code: `import { useReducer, memo } from 'react';
${head}
const Row = memo(function Row({ item, dispatch }) {${rowBody.replace('%CALL%', "dispatch({ type: 'toggle', id: item.id })")}
});
function reducer(items, action) {
  return items.map(x => (x.id === action.id ? { ...x, done: !x.done } : x));
}
function App() {
  const [items, dispatch] = useReducer(reducer, INIT);
${list('dispatch={dispatch}')}
}`,
  },
];
