const data = `  const groups = [
    { id: 'fruit', name: '水果', items: [{ id: 'a', name: '苹果' }, { id: 'b', name: '香蕉' }] },
    { id: 'veg', name: '蔬菜', items: [{ id: 'a', name: '白菜' }, { id: 'b', name: '土豆' }] },
  ];`;
const app = body => `import { Fragment } from 'react';
function App() {
${data}
  return (
    <div>
${body}
    </div>
  );
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /应渲染 2 个 <section>/ },
  {
    name: '错误 A：两层都没写 key',
    expect: 'fail',
    match: /没有 key/,
    code: app(`      {groups.map(g => (
        <section>
          <h3>{g.name}</h3>
          <ul>{g.items.map(item => <li>{item.name}</li>)}</ul>
        </section>
      ))}`),
  },
  {
    name: '错误 B：内层用下标当 key',
    expect: 'fail',
    match: /数组下标/,
    code: app(`      {groups.map(g => (
        <section key={g.id}>
          <h3>{g.name}</h3>
          <ul>{g.items.map((item, i) => <li key={i}>{item.name}</li>)}</ul>
        </section>
      ))}`),
  },
  {
    name: '错误 C：外层用下标当 key',
    expect: 'fail',
    match: /这一组的 key 是 0/,
    code: app(`      {groups.map((g, gi) => (
        <section key={gi}>
          <h3>{g.name}</h3>
          <ul>{g.items.map(item => <li key={item.id}>{item.name}</li>)}</ul>
        </section>
      ))}`),
  },
  {
    name: '错误 D：key 写在 ul 上，li 没有',
    expect: 'fail',
    match: /“苹果”没有 key/,
    code: app(`      {groups.map(g => (
        <section key={g.id}>
          <h3>{g.name}</h3>
          <ul key={g.id}>{g.items.map(item => <li>{item.name}</li>)}</ul>
        </section>
      ))}`),
  },
  {
    name: '错误 E：用商品名当 key',
    expect: 'fail',
    match: /里面没有它的 id/,
    code: app(`      {groups.map(g => (
        <section key={g.id}>
          <h3>{g.name}</h3>
          <ul>{g.items.map(item => <li key={item.name}>{item.name}</li>)}</ul>
        </section>
      ))}`),
  },
  {
    name: '不同写法：Group 和 Item 子组件，key 写在组件上',
    expect: 'pass',
    code: `function Item({ item }) {
  return <li>{item.name}</li>;
}

function Group({ group }) {
  return (
    <section>
      <h3>{group.name}</h3>
      <ul>
        {group.items.map(item => (
          <Item key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

function App() {
${data}
  return (
    <div>
      {groups.map(g => (
        <Group key={g.id} group={g} />
      ))}
    </div>
  );
}`,
  },
  {
    name: '不同写法：key 带组名前缀（fruit-a）',
    expect: 'pass',
    code: app(`      {groups.map(g => (
        <section key={'group-' + g.id}>
          <h3>{g.name}</h3>
          <ul>{g.items.map(item => <li key={g.id + '-' + item.id}>{item.name}</li>)}</ul>
        </section>
      ))}`),
  },
  {
    name: '不同写法：Fragment 包住 section 并写 key',
    expect: 'pass',
    code: app(`      {groups.map(g => (
        <Fragment key={g.id}>
          <section>
            <h3>{g.name}</h3>
            <ul>{g.items.map(item => <li key={item.id}>{item.name}</li>)}</ul>
          </section>
        </Fragment>
      ))}`),
  },
];
