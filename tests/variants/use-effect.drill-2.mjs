export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /连接还留在房间 a.*依赖数组/ },
  {
    name: '错误 A：不写依赖数组',
    expect: 'fail',
    match: /无关按钮不该重新连接.*依赖数组/,
    code: `import { useState, useEffect } from 'react';
const log = [];
function connect(room) {
  log.push('连接 ' + room);
  return () => log.push('断开 ' + room);
}
function App() {
  const [room, setRoom] = useState('a');
  const [n, setN] = useState(0);
  useEffect(() => {
    return connect(room);
  });
  return (
    <div>
      <p>当前房间：<span id="room">{room}</span></p>
      <button id="to-a" onClick={() => setRoom('a')}>房间 a</button>
      <button id="to-b" onClick={() => setRoom('b')}>房间 b</button>
      <button id="bump" onClick={() => setN(n + 1)}>无关按钮 {n}</button>
    </div>
  );
}`,
  },
  {
    name: '错误 B：依赖对了但丢了清理函数',
    expect: 'fail',
    match: /应依次新增“断开 a”“连接 b”.*清理函数/,
    code: `import { useState, useEffect } from 'react';
const log = [];
function connect(room) {
  log.push('连接 ' + room);
  return () => log.push('断开 ' + room);
}
function App() {
  const [room, setRoom] = useState('a');
  const [n, setN] = useState(0);
  useEffect(() => {
    connect(room);
  }, [room]);
  return (
    <div>
      <p>当前房间：<span id="room">{room}</span></p>
      <button id="to-a" onClick={() => setRoom('a')}>房间 a</button>
      <button id="to-b" onClick={() => setRoom('b')}>房间 b</button>
      <button id="bump" onClick={() => setN(n + 1)}>无关按钮 {n}</button>
    </div>
  );
}`,
  },
  {
    name: '不同写法：effect 放进 Room 子组件',
    expect: 'pass',
    code: `import { useState, useEffect } from 'react';
const log = [];
function connect(room) {
  log.push('连接 ' + room);
  return () => log.push('断开 ' + room);
}
function Room({ room }) {
  useEffect(() => connect(room), [room]);
  return <p>当前房间：<span id="room">{room}</span></p>;
}
function App() {
  const [room, setRoom] = useState('a');
  const [n, setN] = useState(0);
  return (
    <div>
      <Room room={room} />
      <button id="to-a" onClick={() => setRoom('a')}>房间 a</button>
      <button id="to-b" onClick={() => setRoom('b')}>房间 b</button>
      <button id="bump" onClick={() => setN(n + 1)}>无关按钮 {n}</button>
    </div>
  );
}`,
  },
];
