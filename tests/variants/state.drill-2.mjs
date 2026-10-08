const app = (fn, init = "['牛奶']") => `import { useState } from 'react';

function App() {
  const [items, setItems] = useState(${init});
${fn}
  return (
    <div>
      <button onClick={addTwo}>加两项</button>
      <ul id="list">
        {items.map((x, i) => <li key={i}>{x}</li>)}
      </ul>
    </div>
  );
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /同一份快照/ },
  {
    name: '错误 A：push 后传回同一个数组',
    expect: 'fail',
    match: /同一份快照|修改旧数组/,
    code: app(`  function addTwo() {
    items.push('面包');
    items.push('鸡蛋');
    setItems(items);
  }`),
  },
  {
    name: '错误 B：写死整个数组',
    expect: 'fail',
    match: /不能写死/,
    code: app(`  function addTwo() { setItems(['牛奶', '面包', '鸡蛋']); }`),
  },
  {
    name: '错误 C：只加了一项',
    expect: 'fail',
    match: /应是：牛奶、面包、鸡蛋/,
    code: app(`  function addTwo() { setItems([...items, '面包']); }`),
  },
  {
    name: '不同写法：一次 set 加两项',
    expect: 'pass',
    code: app(`  function addTwo() { setItems([...items, '面包', '鸡蛋']); }`),
  },
  {
    name: '不同写法：concat 的函数式更新',
    expect: 'pass',
    code: app(`  function addTwo() { setItems(prev => prev.concat('面包', '鸡蛋')); }`),
  },
];
