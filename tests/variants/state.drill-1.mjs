const app = (body, state = "useState({ name: '小美', age: 20 })", imp = "import { useState } from 'react';") => `${imp}

function App() {
  const [user, setUser] = ${state};
${body}
  return (
    <div>
      <p id="info">{user.name}，{user.age} 岁</p>
      <button onClick={birthday}>过生日</button>
      <button onClick={rename}>改名</button>
    </div>
  );
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /同一个对象，React 认为 state 没变/ },
  {
    name: '错误 A：改名时只传 name，丢了 age',
    expect: 'fail',
    match: /带上没改的字段/,
    code: app(`  function birthday() { setUser({ ...user, age: user.age + 1 }); }
  function rename() { setUser({ name: '小强' }); }`),
  },
  {
    name: '错误 B：年龄写死成 21',
    expect: 'fail',
    match: /不能写死/,
    code: app(`  function birthday() { setUser({ name: user.name, age: 21 }); }
  function rename() { setUser({ ...user, name: '小强' }); }`),
  },
  {
    name: '错误 C：先修改再传同一个对象（改名也是）',
    expect: 'fail',
    match: /同一个对象|新对象/,
    code: app(`  function birthday() { user.age += 1; setUser(user); }
  function rename() { user.name = '小强'; setUser(user); }`),
  },
  {
    name: '不同写法：useReducer',
    expect: 'pass',
    code: `import { useReducer } from 'react';

function reducer(user, action) {
  if (action.type === 'birthday') return { ...user, age: user.age + 1 };
  if (action.type === 'rename') return { ...user, name: action.name };
  return user;
}

function App() {
  const [user, dispatch] = useReducer(reducer, { name: '小美', age: 20 });
  return (
    <div>
      <p id="info">{user.name}，{user.age} 岁</p>
      <button onClick={() => dispatch({ type: 'birthday' })}>过生日</button>
      <button onClick={() => dispatch({ type: 'rename', name: '小强' })}>改名</button>
    </div>
  );
}`,
  },
  {
    name: '不同写法：拆成两个独立的 state',
    expect: 'pass',
    code: `import { useState } from 'react';

function App() {
  const [name, setName] = useState('小美');
  const [age, setAge] = useState(20);
  return (
    <div>
      <p id="info">{name}，{age} 岁</p>
      <button onClick={() => setAge(a => a + 1)}>过生日</button>
      <button onClick={() => setName('小强')}>改名</button>
    </div>
  );
}`,
  },
];
