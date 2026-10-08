const app = `
function App() {
  return (
    <UserContext value={{ name: '小李' }}>
      <p>外层：<UserBadge /></p>
      <UserContext value={{ name: '小王' }}>
        <p>里层：<UserBadge /></p>
      </UserContext>
    </UserContext>
  );
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /放在 Provider 外面时报错了/ },
  {
    name: '错误 A：默认值改成了“小李”，没有 Provider 时不是游客',
    expect: 'fail',
    match: /应显示“游客”，实际是“小李”/,
    code: `import { createContext, useContext } from 'react';
const UserContext = createContext({ name: '小李' });
function UserBadge() { const user = useContext(UserContext); return <span className="badge">{user.name}</span>; }${app}`,
  },
  {
    name: '错误 B：默认值修好了，但里层没有嵌套 Provider，两个 badge 都是小李',
    expect: 'fail',
    match: /第二个 \.badge 应显示“小王”/,
    code: `import { createContext, useContext } from 'react';
const UserContext = createContext({ name: '游客' });
function UserBadge() { const user = useContext(UserContext); return <span className="badge">{user.name}</span>; }
function App() {
  return (
    <UserContext value={{ name: '小李' }}>
      <p>外层：<UserBadge /></p>
      <p>里层：<UserBadge /></p>
    </UserContext>
  );
}`,
  },
  {
    name: '错误 C：投机，UserBadge 不读 Context，直接写死“游客”',
    expect: 'fail',
    match: /应显示“小陈”/,
    code: `import { createContext } from 'react';
const UserContext = createContext(null);
function UserBadge() { return <span className="badge">游客</span>; }${app}`,
  },
  {
    name: '不同写法：默认值仍是 null，读取处兜底',
    expect: 'pass',
    code: `import { createContext, useContext } from 'react';
const UserContext = createContext(null);
function UserBadge() { const user = useContext(UserContext); return <span className="badge">{user ? user.name : '游客'}</span>; }${app}`,
  },
  {
    name: '不同写法：.Provider 写法，里层用变量构造值',
    expect: 'pass',
    code: `import { createContext, useContext } from 'react';
const UserContext = createContext({ name: '游客' });
function UserBadge() { const { name } = useContext(UserContext); return <span className="badge">{name}</span>; }
const li = { name: '小李' };
const wang = { name: '小王' };
function App() {
  return (
    <UserContext.Provider value={li}>
      <p>外层：<UserBadge /></p>
      <UserContext.Provider value={wang}><p>里层：<UserBadge /></p></UserContext.Provider>
    </UserContext.Provider>
  );
}`,
  },
];
