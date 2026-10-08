export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /点“稍后保存”那次渲染|回调只记得/ },
  {
    name: '错误 A：ref 只在创建时取一次初值，没有更新',
    expect: 'fail',
    match: /应是输入框此刻的“abc”|随每次输入更新/,
    code: `import { useState, useRef } from 'react';
const scheduler = { jobs: [], later(fn) { this.jobs.push(fn); }, flush() { const jobs = this.jobs; this.jobs = []; jobs.forEach(fn => fn()); } };
function App() {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('（未保存）');
  const latest = useRef(text);
  function saveLater() { scheduler.later(() => setSaved(latest.current)); }
  return (
    <div>
      <input id="text" value={text} onChange={e => setText(e.target.value)} />
      <button id="save" onClick={saveLater}>稍后保存</button>
      <button id="flush" onClick={() => scheduler.flush()}>时间到</button>
      <p id="saved">{saved}</p>
    </div>
  );
}`,
  },
  {
    name: '错误 B：点“稍后保存”时立刻保存',
    expect: 'fail',
    match: /还没点“时间到”/,
    code: `import { useState } from 'react';
const scheduler = { jobs: [], later(fn) { this.jobs.push(fn); }, flush() { const jobs = this.jobs; this.jobs = []; jobs.forEach(fn => fn()); } };
function App() {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('（未保存）');
  function saveLater() { setSaved(text); scheduler.later(() => setSaved(text)); }
  return (
    <div>
      <input id="text" value={text} onChange={e => setText(e.target.value)} />
      <button id="save" onClick={saveLater}>稍后保存</button>
      <button id="flush" onClick={() => scheduler.flush()}>时间到</button>
      <p id="saved">{saved}</p>
    </div>
  );
}`,
  },
  {
    name: '错误 C：硬编码输出',
    expect: 'fail',
    match: /应是最新输入“pqr”|应是输入框此刻/,
    code: `import { useState } from 'react';
const scheduler = { jobs: [], later(fn) { this.jobs.push(fn); }, flush() { const jobs = this.jobs; this.jobs = []; jobs.forEach(fn => fn()); } };
function App() {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('（未保存）');
  function saveLater() { scheduler.later(() => setSaved('abc')); }
  return (
    <div>
      <input id="text" value={text} onChange={e => setText(e.target.value)} />
      <button id="save" onClick={saveLater}>稍后保存</button>
      <button id="flush" onClick={() => scheduler.flush()}>时间到</button>
      <p id="saved">{saved}</p>
    </div>
  );
}`,
  },
  {
    name: '不同写法：在 onChange 里同步更新 ref',
    expect: 'pass',
    code: `import { useState, useRef } from 'react';
const scheduler = { jobs: [], later(fn) { this.jobs.push(fn); }, flush() { const jobs = this.jobs; this.jobs = []; jobs.forEach(fn => fn()); } };
function App() {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('（未保存）');
  const latest = useRef('');
  function onChange(e) {
    latest.current = e.target.value;
    setText(e.target.value);
  }
  function saveLater() { scheduler.later(() => setSaved(latest.current)); }
  return (
    <div>
      <input id="text" value={text} onChange={onChange} />
      <button id="save" onClick={saveLater}>稍后保存</button>
      <button id="flush" onClick={() => scheduler.flush()}>时间到</button>
      <p id="saved">{saved}</p>
    </div>
  );
}`,
  },
];
