const TEXT = `const TEXT = { zh: '你好，欢迎回来', en: 'Hello, welcome back' };`;
const tail = provider => `
function Sidebar() { return <aside><Greeting /></aside>; }
function Layout() { return <main><Sidebar /></main>; }
function App() {
  const [lang, setLang] = useState('zh');
  return (
    ${provider.open}
      <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>切换语言</button>
      <Layout />
    ${provider.close}
  );
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /找不到 LangContext/ },
  {
    name: '错误 A：Provider 的 value 写死 "zh"，切换不了',
    expect: 'fail',
    match: /点“切换语言”后应显示“Hello, welcome back”/,
    code: `import { createContext, useContext, useState } from 'react';
${TEXT}
const LangContext = createContext('zh');
function Greeting() { const lang = useContext(LangContext); return <p id="greeting">{TEXT[lang]}</p>; }${tail({ open: '<LangContext value="zh">', close: '</LangContext>' })}`,
  },
  {
    name: '错误 B：建了 Context 但 Greeting 仍从 props 取，中间层继续转发',
    expect: 'fail',
    match: /不给 Layout 传任何 props/,
    code: `import { createContext, useState } from 'react';
${TEXT}
export const LangContext = createContext('zh');
function Greeting({ lang }) { return <p id="greeting">{TEXT[lang]}</p>; }
function Sidebar({ lang }) { return <aside><Greeting lang={lang} /></aside>; }
function Layout({ lang }) { return <main><Sidebar lang={lang} /></main>; }
function App() {
  const [lang, setLang] = useState('zh');
  return (
    <LangContext value={lang}>
      <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>切换语言</button>
      <Layout lang={lang} />
    </LangContext>
  );
}`,
  },
  {
    name: '错误 C：默认值写成 en，没有 Provider 时语言不对',
    expect: 'fail',
    match: /默认值“zh”|createContext 的默认值应是/,
    code: `import { createContext, useContext, useState } from 'react';
${TEXT}
const LangContext = createContext('en');
function Greeting() { const lang = useContext(LangContext); return <p id="greeting">{TEXT[lang]}</p>; }${tail({ open: '<LangContext value={lang}>', close: '</LangContext>' })}`,
  },
  {
    name: '不同写法：.Provider 写法 + 自定义 Hook useLang',
    expect: 'pass',
    code: `import { createContext, useContext, useState } from 'react';
${TEXT}
const LangContext = createContext('zh');
const useLang = () => useContext(LangContext);
function Greeting() { const lang = useLang(); return <p id="greeting">{TEXT[lang]}</p>; }${tail({ open: '<LangContext.Provider value={lang}>', close: '</LangContext.Provider>' })}`,
  },
  {
    name: '不同写法：用 React 19 的 use 读取',
    expect: 'pass',
    code: `import { createContext, use, useState } from 'react';
${TEXT}
const LangContext = createContext('zh');
function Greeting() { const lang = use(LangContext); return <p id="greeting">{TEXT[lang]}</p>; }${tail({ open: '<LangContext value={lang}>', close: '</LangContext>' })}`,
  },
];
