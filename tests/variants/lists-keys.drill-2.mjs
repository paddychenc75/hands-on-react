const app = liOpen => `import { useState } from 'react';
let nextId = 4;
function App() {
  const [rows, setRows] = useState([
    { id: 1, name: '苹果' },
    { id: 2, name: '香蕉' },
    { id: 3, name: '橙子' },
  ]);
  function addTop() { setRows([{ id: nextId, name: '新品' + nextId }, ...rows]); nextId += 1; }
  function remove(id) { setRows(rows.filter(r => r.id !== id)); }
  return (
    <div>
      <button onClick={addTop}>在顶部添加</button>
      <ul>
        {rows.map((r, i) => (
          ${liOpen}
            <span>{r.name}</span>
            <input placeholder="备注" />
            <button onClick={() => remove(r.id)}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /“香蕉”那一行的备注是“A”/ },
  {
    name: '错误 A：key 每次渲染都变（Math.random）',
    expect: 'fail',
    match: /备注没了/,
    code: app('<li key={Math.random()}>'),
  },
  {
    name: '错误 B：key 里混入下标（id + 下标）',
    expect: 'fail',
    match: /备注没了|备注是/,
    code: app('<li key={r.id + "-" + i}>'),
  },
  {
    name: '错误 C：删除了 key，只靠默认的位置',
    expect: 'fail',
    match: /“香蕉”那一行的备注是“A”/,
    code: app('<li>'),
  },
  {
    name: '不同写法：用名字当 key（本数据里名字唯一）',
    expect: 'pass',
    code: app('<li key={r.name}>'),
  },
  {
    name: '不同写法：Row 子组件自己持有受控备注 state，key 用 id',
    expect: 'pass',
    code: `import { useState } from 'react';
let nextId = 4;

function Row({ row, onRemove }) {
  const [note, setNote] = useState('');
  return (
    <li>
      <span>{row.name}</span>
      <input placeholder="备注" value={note} onChange={e => setNote(e.target.value)} />
      <button onClick={() => onRemove(row.id)}>删除</button>
    </li>
  );
}

function App() {
  const [rows, setRows] = useState([
    { id: 1, name: '苹果' },
    { id: 2, name: '香蕉' },
    { id: 3, name: '橙子' },
  ]);
  return (
    <div>
      <button onClick={() => { const id = nextId; nextId += 1; setRows(rs => [{ id, name: '新品' + id }, ...rs]); }}>在顶部添加</button>
      <ul>
        {rows.map(r => (
          <Row key={r.id} row={r} onRemove={id => setRows(rs => rs.filter(x => x.id !== id))} />
        ))}
      </ul>
    </div>
  );
}`,
  },
];
