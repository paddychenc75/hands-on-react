const draft = `
function Draft({ user }) {
  const [text, setText] = useState('');
  seen.push(user + '|' + text);
  return (
    <div>
      <p>给 <b id="to">{user}</b> 写留言：</p>
      <input id="draft" value={text} onChange={e => setText(e.target.value)} />
    </div>
  );
}`;
const btns = `<button id="u1" onClick={() => setUser('小明')}>小明</button>
      <button id="u2" onClick={() => setUser('小红')}>小红</button>`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /草稿应从空白开始.*位置和类型都没变/ },
  {
    name: '错误 A：用 effect 重置（多一次旧草稿渲染）',
    expect: 'fail',
    match: /旧草稿 hello.*不要用 effect/,
    code: `import { useState, useEffect } from 'react';
const seen = [];
function Draft({ user }) {
  const [text, setText] = useState('');
  seen.push(user + '|' + text);
  useEffect(() => {
    setText('');
  }, [user]);
  return (
    <div>
      <p>给 <b id="to">{user}</b> 写留言：</p>
      <input id="draft" value={text} onChange={e => setText(e.target.value)} />
    </div>
  );
}
function App() {
  const [user, setUser] = useState('小明');
  return (
    <div>
      ${btns}
      <Draft user={user} />
    </div>
  );
}`,
  },
  {
    name: '错误 B：三元表达式分支，但位置和类型没变',
    expect: 'fail',
    match: /草稿应从空白开始/,
    code: `import { useState } from 'react';
const seen = [];
${draft}
function App() {
  const [user, setUser] = useState('小明');
  return (
    <div>
      ${btns}
      {user === '小明' ? <Draft user="小明" /> : <Draft user="小红" />}
    </div>
  );
}`,
  },
  {
    name: '错误 C：key 加在 Draft 里面的 input 上，state 仍在 Draft',
    expect: 'fail',
    match: /草稿应从空白开始/,
    code: `import { useState } from 'react';
const seen = [];
function Draft({ user }) {
  const [text, setText] = useState('');
  seen.push(user + '|' + text);
  return (
    <div>
      <p>给 <b id="to">{user}</b> 写留言：</p>
      <input key={user} id="draft" value={text} onChange={e => setText(e.target.value)} />
    </div>
  );
}
function App() {
  const [user, setUser] = useState('小明');
  return (
    <div>
      ${btns}
      <Draft user={user} />
    </div>
  );
}`,
  },
  {
    name: '不同写法：两个收件人放在不同的位置',
    expect: 'pass',
    code: `import { useState } from 'react';
const seen = [];
${draft}
function App() {
  const [user, setUser] = useState('小明');
  return (
    <div>
      ${btns}
      {user === '小明' && <Draft user="小明" />}
      {user === '小红' && <Draft user="小红" />}
    </div>
  );
}`,
  },
];
