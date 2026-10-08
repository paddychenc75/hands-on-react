const list = (extra = '') => `
      <ul id="box" ${extra} style={{ height: 80, overflow: 'auto', margin: 0 }}>
        {msgs.map((m, i) => <li key={i}>{m}</li>)}
      </ul>`;
const head = `import { useState, useRef } from 'react';
const INIT = Array.from({ length: 12 }, (_, i) => '第 ' + (i + 1) + ' 条消息');
`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /点“到最新”后列表没有滚到最底部/ },
  {
    name: '错误 A：滚动都做了，发送后忘了重新聚焦',
    expect: 'fail',
    match: /没有重新获得焦点/,
    code: `${head}
function App() {
  const [msgs, setMsgs] = useState(INIT);
  const [text, setText] = useState('');
  const boxRef = useRef(null);
  function send(e) { e.preventDefault(); if (!text) return; setMsgs([...msgs, text]); setText(''); }
  return (
    <div>${list('ref={boxRef}')}
      <form onSubmit={send}>
        <input id="msg" value={text} onChange={e => setText(e.target.value)} />
        <button>发送</button>
      </form>
      <button type="button" onClick={() => { boxRef.current.scrollTop = boxRef.current.scrollHeight; }}>到最新</button>
      <button type="button" onClick={() => { boxRef.current.scrollTop = 0; }}>回到顶部</button>
    </div>
  );
}`,
  },
  {
    name: '错误 B：聚焦用 autoFocus（只在挂载时生效），不是每次发送后',
    expect: 'fail',
    match: /没有重新获得焦点|autoFocus|滚到最底部/,
    code: `${head}
function App() {
  const [msgs, setMsgs] = useState(INIT);
  const [text, setText] = useState('');
  const boxRef = useRef(null);
  function send(e) { e.preventDefault(); if (!text) return; setMsgs([...msgs, text]); setText(''); }
  return (
    <div>${list('ref={boxRef}')}
      <form onSubmit={send}>
        <input id="msg" autoFocus value={text} onChange={e => setText(e.target.value)} />
        <button>发送</button>
      </form>
      <button type="button" onClick={() => { boxRef.current.scrollTop = boxRef.current.scrollHeight; }}>到最新</button>
      <button type="button" onClick={() => { boxRef.current.scrollTop = 0; }}>回到顶部</button>
    </div>
  );
}`,
  },
  {
    name: '错误 C：行为都对，但用 document.getElementById 查询 DOM',
    expect: 'fail',
    match: /不要直接查询 DOM/,
    code: `import { useState, useRef } from 'react';
const INIT = Array.from({ length: 12 }, (_, i) => '第 ' + (i + 1) + ' 条消息');
function App() {
  const [msgs, setMsgs] = useState(INIT);
  const [text, setText] = useState('');
  const unused = useRef(null);
  function send(e) { e.preventDefault(); if (!text) return; setMsgs([...msgs, text]); setText(''); document.getElementById('msg').focus(); }
  return (
    <div>${list()}
      <form onSubmit={send}>
        <input id="msg" value={text} onChange={e => setText(e.target.value)} />
        <button>发送</button>
      </form>
      <button type="button" onClick={() => { const b = document.getElementById('box'); b.scrollTop = b.scrollHeight; }}>到最新</button>
      <button type="button" onClick={() => { document.getElementById('box').scrollTop = 0; }}>回到顶部</button>
    </div>
  );
}`,
  },
  {
    name: '错误 D：在渲染期间调用 focus（第一次渲染 ref 还是 null）',
    expect: 'fail',
    match: /EXCEPTION|null|报错|失败|没有/,
    code: `${head}
function App() {
  const [msgs, setMsgs] = useState(INIT);
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  inputRef.current.focus();
  function send(e) { e.preventDefault(); if (!text) return; setMsgs([...msgs, text]); setText(''); }
  return (
    <div>${list()}
      <form onSubmit={send}>
        <input id="msg" ref={inputRef} value={text} onChange={e => setText(e.target.value)} />
        <button>发送</button>
      </form>
      <button type="button">到最新</button>
      <button type="button">回到顶部</button>
    </div>
  );
}`,
  },
  {
    name: '不同写法：末尾放哨兵节点用 scrollIntoView，发送后在 setState 后聚焦',
    expect: 'pass',
    code: `${head}
function App() {
  const [msgs, setMsgs] = useState(INIT);
  const [text, setText] = useState('');
  const topRef = useRef(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  function send(e) {
    e.preventDefault();
    if (!text) return;
    inputRef.current.focus();
    setMsgs(m => [...m, text]);
    setText('');
  }
  return (
    <div>
      <ul id="box" style={{ height: 80, overflow: 'auto', margin: 0 }}>
        <li ref={topRef} style={{ listStyle: 'none', height: 0 }} />
        {msgs.map((m, i) => <li key={i}>{m}</li>)}
        <li ref={endRef} style={{ listStyle: 'none', height: 0 }} />
      </ul>
      <form onSubmit={send}>
        <input id="msg" ref={inputRef} value={text} onChange={e => setText(e.target.value)} />
        <button>发送</button>
      </form>
      <button type="button" onClick={() => endRef.current.scrollIntoView({ block: 'end' })}>到最新</button>
      <button type="button" onClick={() => { topRef.current.scrollIntoView({ block: 'start' }); document.documentElement.scrollTop = 0; }}>回到顶部</button>
    </div>
  );
}`,
  },
];
