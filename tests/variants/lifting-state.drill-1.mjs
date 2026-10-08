export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /输入框 B 应同步显示|各存一份/ },
  {
    name: '错误 A：App 存了一份，Field 又把 props 抄进自己的 state',
    expect: 'fail',
    match: /输入框 [AB] 应同步显示/,
    code: `import { useState } from 'react';
function Field({ id, label, text, onChange }) {
  const [mine, setMine] = useState(text);
  return (
    <p><label>{label}：
      <input id={id} value={mine} onChange={e => { setMine(e.target.value); onChange(e.target.value); }} />
    </label></p>
  );
}
function App() {
  const [text, setText] = useState('');
  return (
    <div>
      <Field id="a" label="输入框 A" text={text} onChange={setText} />
      <Field id="b" label="输入框 B" text={text} onChange={setText} />
      <p id="len">字数：{text.length}</p>
    </div>
  );
}`,
  },
  {
    name: '错误 B：文字存在组件外面的变量里（同步了，但所有 App 共用）',
    expect: 'fail',
    match: /组件外面/,
    code: `import { useState } from 'react';
let shared = '';
function Field({ id, label, text, onChange }) {
  return (
    <p><label>{label}：
      <input id={id} value={text} onChange={e => onChange(e.target.value)} />
    </label></p>
  );
}
function App() {
  const [, bump] = useState(0);
  const set = v => { shared = v; bump(n => n + 1); };
  return (
    <div>
      <Field id="a" label="输入框 A" text={shared} onChange={set} />
      <Field id="b" label="输入框 B" text={shared} onChange={set} />
      <p id="len">字数：{shared.length}</p>
    </div>
  );
}`,
  },
  {
    name: '错误 C：两个框同步了，但字数写死没做',
    expect: 'fail',
    match: /字数/,
    code: `import { useState } from 'react';
function Field({ id, label, text, onChange }) {
  return (
    <p><label>{label}：
      <input id={id} value={text} onChange={e => onChange(e.target.value)} />
    </label></p>
  );
}
function App() {
  const [text, setText] = useState('');
  return (
    <div>
      <Field id="a" label="输入框 A" text={text} onChange={setText} />
      <Field id="b" label="输入框 B" text={text} onChange={setText} />
      <p id="len">字数：0</p>
    </div>
  );
}`,
  },
  {
    name: '错误 D：行为都对，但 Field 里仍留着一份 state，用 effect 同步',
    expect: 'fail',
    match: /还有自己的 state/,
    code: `import { useState, useEffect } from 'react';
function Field({ id, label, text, onChange }) {
  const [mine, setMine] = useState(text);
  useEffect(() => setMine(text), [text]);
  return (
    <p><label>{label}：
      <input id={id} value={mine} onChange={e => onChange(e.target.value)} />
    </label></p>
  );
}
function App() {
  const [text, setText] = useState('');
  return (
    <div>
      <Field id="a" label="输入框 A" text={text} onChange={setText} />
      <Field id="b" label="输入框 B" text={text} onChange={setText} />
      <p id="len">字数：{text.length}</p>
    </div>
  );
}`,
  },
  {
    name: '不同写法：useReducer 存文字，用数组 map 渲染两个 Field',
    expect: 'pass',
    code: `import { useReducer } from 'react';
function Field({ id, label, text, onChange }) {
  return (
    <p><label>{label}：
      <input id={id} value={text} onChange={e => onChange(e.target.value)} />
    </label></p>
  );
}
function App() {
  const [text, dispatch] = useReducer((_, next) => next, '');
  return (
    <div>
      {[['a', '输入框 A'], ['b', '输入框 B']].map(([id, label]) => (
        <Field key={id} id={id} label={label} text={text} onChange={dispatch} />
      ))}
      <p id="len">字数：{[...text].length}</p>
    </div>
  );
}`,
  },
];
