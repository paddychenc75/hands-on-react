// useRef 正式练习的变体
const VIEW = `
  return (
    <div>
      <input id="field" ref={inputRef} />
      <button onClick={() => inputRef.current.focus()}>聚焦</button>
      <p id="ticks">{ticks}</p>
      <button onClick={start}>开始</button>
      <button onClick={stop}>停止</button>
    </div>
  );
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /useRef|ref/ },
  {
    name: 'id 存在组件里的普通变量，重新渲染后丢失',
    expect: 'fail',
    match: /停止|普通变量|数字还在变/,
    code: `import { useState, useRef } from 'react';

function App() {
  const [ticks, setTicks] = useState(0);
  const inputRef = useRef(null);
  let timer = null;
  function start() {
    if (timer) return;
    timer = setInterval(() => setTicks(t => t + 1), 100);
  }
  function stop() {
    clearInterval(timer);
    timer = null;
  }
${VIEW}`,
  },
  {
    name: 'id 存在 state 里（能停，但多余的重新渲染）',
    expect: 'fail',
    match: /state 里|useRef/,
    code: `import { useState, useRef } from 'react';

function App() {
  const [ticks, setTicks] = useState(0);
  const [timerId, setTimerId] = useState(null);
  const inputRef = useRef(null);
  function start() {
    if (timerId) return;
    setTimerId(setInterval(() => setTicks(t => t + 1), 100));
  }
  function stop() {
    clearInterval(timerId);
    setTimerId(null);
  }
${VIEW}`,
  },
  {
    name: 'id 存在模块变量（两个秒表共用）',
    expect: 'fail',
    match: /共用|组件外面|互相干扰|ref/,
    code: `import { useState, useRef } from 'react';

let timer = null;
function App() {
  const [ticks, setTicks] = useState(0);
  const inputRef = useRef(null);
  function start() {
    if (timer) return;
    timer = setInterval(() => setTicks(t => t + 1), 100);
  }
  function stop() {
    clearInterval(timer);
    timer = null;
  }
${VIEW}`,
  },
  {
    name: '不同写法：回调 ref 取输入框，定时器 id 放在 ref 的对象里',
    expect: 'pass',
    code: `import { useState, useRef } from 'react';

function App() {
  const [ticks, setTicks] = useState(0);
  const field = useRef(null);
  const timer = useRef({ id: 0 });
  function start() {
    if (timer.current.id) return;
    timer.current.id = setInterval(() => setTicks(t => t + 1), 100);
  }
  function stop() {
    clearInterval(timer.current.id);
    timer.current.id = 0;
  }
  return (
    <div>
      <input id="field" ref={el => { field.current = el; }} />
      <button onClick={() => field.current && field.current.focus()}>聚焦</button>
      <p id="ticks">{ticks}</p>
      <button onClick={start}>开始</button>
      <button onClick={stop}>停止</button>
    </div>
  );
}`,
  },
];
