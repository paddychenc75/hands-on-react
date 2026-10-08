const mk = (a, b) => `import { useState } from 'react';
function App() {
  const [count, setCount] = useState(2);
  function plusThree() {
${a}
  }
  function plusOneThenDouble() {
${b}
  }
  return (
    <div>
      <p id="count">{count}</p>
      <button id="plus3" onClick={plusThree}>加 3</button>
      <button id="double" onClick={plusOneThenDouble}>加 1 再翻倍</button>
    </div>
  );
}`;
const fnThree = '    setCount(c => c + 1); setCount(c => c + 1); setCount(c => c + 1);';
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /点“加 3”，应变成 5|同一次点击里/ },
  {
    name: '错误 A：只修了“加 3”，翻倍仍读快照',
    expect: 'fail',
    match: /加 1 再翻倍/,
    code: mk(fnThree, '    setCount(count + 1);\n    setCount(count * 2);'),
  },
  {
    name: '错误 B：翻倍和加 1 的顺序反了',
    expect: 'fail',
    match: /加 1 再翻倍/,
    code: mk(fnThree, '    setCount(c => c * 2);\n    setCount(c => c + 1);'),
  },
  {
    name: '错误 C：硬编码结果',
    expect: 'fail',
    match: /应变成 12|应变成 15|应变成 32/,
    code: mk('    setCount(count + 3);', '    setCount(12);'),
  },
  {
    name: '不同写法：直接用公式，一次 set 函数调用',
    expect: 'pass',
    code: mk('    setCount(count + 3);', '    setCount((count + 1) * 2);'),
  },
  {
    name: '不同写法：useReducer',
    expect: 'pass',
    code: `import { useReducer } from 'react';
function reducer(n, action) {
  if (action === 'inc') return n + 1;
  if (action === 'double') return n * 2;
  return n;
}
function App() {
  const [count, dispatch] = useReducer(reducer, 2);
  return (
    <div>
      <p id="count">{count}</p>
      <button id="plus3" onClick={() => { dispatch('inc'); dispatch('inc'); dispatch('inc'); }}>加 3</button>
      <button id="double" onClick={() => { dispatch('inc'); dispatch('double'); }}>加 1 再翻倍</button>
    </div>
  );
}`,
  },
];
