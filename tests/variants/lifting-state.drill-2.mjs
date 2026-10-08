export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /列表应只剩 3 项|各存了一份/ },
  {
    name: '错误 A：App 存了搜索词，列表又用 useState(props) 抄了一份',
    expect: 'fail',
    match: /列表应只剩 3 项/,
    code: `import { useState } from 'react';
const FRUITS = ['苹果', '香蕉', '苹果派', '橙子', '青苹果'];
function SearchBox({ query, onChange }) {
  return <input id="q" value={query} onChange={e => onChange(e.target.value)} />;
}
function FruitList({ query }) {
  const [q] = useState(query);
  const shown = FRUITS.filter(f => f.includes(q));
  return (<div><p id="count">共 {shown.length} 项</p><ul id="list">{shown.map(f => <li key={f}>{f}</li>)}</ul></div>);
}
function App() {
  const [query, setQuery] = useState('');
  return (<div><SearchBox query={query} onChange={setQuery} /><FruitList query={query} /></div>);
}`,
  },
  {
    name: '错误 B：投机，过滤条件写死“苹果”',
    expect: 'fail',
    match: /输入“橙”后列表应只剩“橙子”|不能写死/,
    code: `import { useState } from 'react';
const FRUITS = ['苹果', '香蕉', '苹果派', '橙子', '青苹果'];
function App() {
  const [query, setQuery] = useState('');
  const shown = FRUITS.filter(f => (query ? f.includes('苹果') : true));
  return (
    <div>
      <input id="q" value={query} onChange={e => setQuery(e.target.value)} />
      <p id="count">共 {shown.length} 项</p>
      <ul id="list">{shown.map(f => <li key={f}>{f}</li>)}</ul>
    </div>
  );
}`,
  },
  {
    name: '错误 C：搜索词存在组件外面的变量里',
    expect: 'fail',
    match: /组件外面/,
    code: `import { useState } from 'react';
const FRUITS = ['苹果', '香蕉', '苹果派', '橙子', '青苹果'];
let query = '';
function SearchBox({ onChange }) {
  return <input id="q" value={query} onChange={e => onChange(e.target.value)} />;
}
function FruitList() {
  const shown = FRUITS.filter(f => f.includes(query));
  return (<div><p id="count">共 {shown.length} 项</p><ul id="list">{shown.map(f => <li key={f}>{f}</li>)}</ul></div>);
}
function App() {
  const [, bump] = useState(0);
  return (<div><SearchBox onChange={v => { query = v; bump(n => n + 1); }} /><FruitList /></div>);
}`,
  },
  {
    name: '不同写法：App 过滤好再把数组交给只负责显示的列表',
    expect: 'pass',
    code: `import { useState } from 'react';
const FRUITS = ['苹果', '香蕉', '苹果派', '橙子', '青苹果'];
function SearchBox({ value, onInput }) {
  return <input id="q" value={value} onChange={onInput} />;
}
function FruitList({ items }) {
  return (<div><p id="count">共 {items.length} 项</p><ul id="list">{items.map(f => <li key={f}>{f}</li>)}</ul></div>);
}
function App() {
  const [text, setText] = useState('');
  const items = FRUITS.filter(f => f.includes(text));
  return (<div><SearchBox value={text} onInput={e => setText(e.target.value)} /><FruitList items={items} /></div>);
}`,
  },
];
