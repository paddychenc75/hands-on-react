// 列表与 key 正式练习的变体
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /filter|应渲染 2 个/ },
  {
    name: '下标当 key',
    expect: 'fail',
    match: /下标/,
    code: `function App() {
  const todos = [
    { id: 1, title: '学习 JSX', done: true },
    { id: 2, title: '学习 State', done: false },
    { id: 3, title: '学习列表', done: false },
    { id: 4, title: '喝水', done: true },
  ];
  return (
    <ul>
      {todos.filter(t => !t.done).map((t, i) => (
        <li key={i}>{t.title}</li>
      ))}
    </ul>
  );
}`,
  },
  {
    name: 'map 返回的元素没有 key',
    expect: 'fail',
    match: /没有 key/,
    code: `function App() {
  const todos = [
    { id: 1, title: '学习 JSX', done: true },
    { id: 2, title: '学习 State', done: false },
    { id: 3, title: '学习列表', done: false },
    { id: 4, title: '喝水', done: true },
  ];
  return (
    <ul>
      {todos.filter(t => !t.done).map(t => (
        <li>{t.title}</li>
      ))}
    </ul>
  );
}`,
  },
  {
    name: 'key 写在里层元素上（Fragment 里的 li）',
    expect: 'fail',
    match: /里层|Fragment/,
    code: `function App() {
  const todos = [
    { id: 1, title: '学习 JSX', done: true },
    { id: 2, title: '学习 State', done: false },
    { id: 3, title: '学习列表', done: false },
    { id: 4, title: '喝水', done: true },
  ];
  return (
    <ul>
      {todos.filter(t => !t.done).map(t => (
        <><li key={t.id}>{t.title}</li></>
      ))}
    </ul>
  );
}`,
  },
  {
    name: '没过滤：全部渲染',
    expect: 'fail',
    match: /应渲染 2 个/,
    code: `function App() {
  const todos = [
    { id: 1, title: '学习 JSX', done: true },
    { id: 2, title: '学习 State', done: false },
    { id: 3, title: '学习列表', done: false },
    { id: 4, title: '喝水', done: true },
  ];
  return (
    <ul>
      {todos.map(t => (
        <li key={t.id}>{t.title}</li>
      ))}
    </ul>
  );
}`,
  },
  {
    name: '不同写法：for 循环攒数组，Fragment 带 key',
    expect: 'pass',
    code: `function App() {
  const todos = [
    { id: 1, title: '学习 JSX', done: true },
    { id: 2, title: '学习 State', done: false },
    { id: 3, title: '学习列表', done: false },
    { id: 4, title: '喝水', done: true },
  ];
  const rows = [];
  for (const t of todos) {
    if (t.done) continue;
    rows.push(<React.Fragment key={t.id}><li>{t.title}</li></React.Fragment>);
  }
  return <ul>{rows}</ul>;
}`,
  },
  {
    name: '不同写法：reduce 过滤并渲染',
    expect: 'pass',
    code: `function App() {
  const todos = [
    { id: 1, title: '学习 JSX', done: true },
    { id: 2, title: '学习 State', done: false },
    { id: 3, title: '学习列表', done: false },
    { id: 4, title: '喝水', done: true },
  ];
  return (
    <ul>
      {todos.reduce((acc, t) => (t.done ? acc : [...acc, <li key={'todo-' + t.id}>{t.title}</li>]), [])}
    </ul>
  );
}`,
  },
];
