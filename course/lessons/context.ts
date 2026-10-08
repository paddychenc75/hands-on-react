import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/context.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'context',
  stage: 1,
  title: 'Context：跨层级共享数据',
  mins: 29,
  summary: '不用层层传递 props，也能让深层组件读到数据。',
  goals: [
    '能用 createContext、<ThemeContext value> 和 useContext 三步，让深层组件读到数据',
    '能把 state 和修改它的函数放进 value，让深层组件既能读也能改',
    '能说出 useContext 读到的是哪个值：最近的 Provider，或默认值',
    '能判断一份数据该用 Context，还是直接通过 props 传入',
  ],
  keyPoints: [
    'Context 解决 prop drilling：父组件把数据“广播”给整棵子树，任何深度的后代都能直接读取。',
    '三步：<code>createContext(默认值)</code> 创建；<code>&lt;Ctx value={…}&gt;</code> 提供（React 19 里 Context 本身就是 Provider）；<code>useContext(Ctx)</code> 读取。',
    'useContext 读的是离它最近的上层 Provider 的 value。找不到 Provider 时，才用默认值。React 19 的 <code>use(Ctx)</code> 读到的值一样，还能放在提前 return 之后。',
    '把 state 和修改它的函数一起放进 value，后代组件就既能读也能改。',
    '代价：value 变化时，所有读取它的组件都会重新渲染。适合主题、语言、当前用户这类不常变的数据。',
  ],
  quiz: [
    {
      q: '两个 <code>&lt;ThemeContext value&gt;</code> 嵌套：外层 value="light"，内层 value="dark"。内层里面的组件调用 useContext(ThemeContext)，读到什么？',
      options: ['"light"：最外层的 Provider 说了算', '"dark"：离它最近的 Provider 说了算', 'createContext 时写的默认值', '报错：同一个 Context 不能嵌套提供'],
      answer: 1,
      explain:
        'React 从组件往上找，用最近的那个 Provider 的 value；一个都找不到时才用默认值。最迷惑的是第一项：Provider 可以嵌套，内层会覆盖外层，常用来给某一块区域换主题。',
    },
    {
      q: '一个 Context 的 value 里同时放了“当前用户”和“每秒变化多次的鼠标坐标”。会有什么问题？',
      options: [
        '坐标一变，只读用户的组件也会重新渲染',
        'value 里不能放对象，只能放字符串',
        '读用户的组件拿不到最新的用户',
        '没问题：React 只重新渲染用到坐标的组件',
      ],
      answer: 0,
      explain:
        'value 变了，所有读取这个 Context 的组件都会重新渲染，不管它用的是哪个字段。最迷惑的是最后一项：React 不按字段追踪。解决方法：拆成两个 Context。',
    },
    {
      q: '<code>const UserContext = createContext(\'游客\')</code>。App 渲染 <code>&lt;Welcome /&gt;</code> 和 <code>&lt;UserContext value="小李"&gt;…&lt;/UserContext&gt;</code>，第一个 Welcome 在 Provider 外面。它读到什么？',
      options: ['"游客"', '"小李"', 'undefined', '报错：找不到 Provider'],
      answer: 0,
      explain: '它上面没有 Provider，所以用默认值。最迷惑的是“小李”：Provider 只对它包住的子树生效，兄弟组件读不到。',
    },
    {
      q: 'ThemedNote 组件在 <code>visible</code> 为 false 时提前 <code>return null</code>。在 React 19 里，想在这个提前 return 之后读取 ThemeContext，并且不违反 Hooks 规则，应该用哪个？',
      options: [
        'useContext(ThemeContext)：Hook 写在哪里都行',
        'use(ThemeContext)：规则允许它出现在条件分支和提前 return 之后',
        '先 useState 存一份 Context 的值',
        '不可能，必须把提前 return 挪到读取 Context 之后',
      ],
      answer: 1,
      explain:
        'Hooks 规则要求 useContext 写在组件顶层，不能放在提前 return 之后；lint 会报错，即使运行时恰好没出问题。use 是例外，可以出现在条件分支、循环和提前 return 之后。最迷惑的是第一项：它在实验里能跑，但依靠的是实现细节，不是规则允许的写法。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>用 <code>createContext</code> 创建 <code>UserContext</code>。默认值写 <b>游客</b>。</li><li>在 <code>App</code> 中用 <code>&lt;UserContext value="小李"&gt;</code> 包住 Layout，提供值 <code>"小李"</code>。</li><li>在深层组件 <code>Welcome</code> 中，用 <code>useContext</code> 读取用户名。</li><li>渲染 <code>&lt;p id="welcome"&gt;欢迎，小李&lt;/p&gt;</code>。不要通过 props 传递用户名。</li></ol>',
    starter: `import { createContext, useContext } from 'react';

// ① 创建 UserContext

function Welcome() {
  // ③ 读取
  return <p id="welcome">欢迎，?</p>;
}

function Layout() {
  return <div><Welcome /></div>;
}

function App() {
  // ② 提供
  return <Layout />;
}`,
    solution: `import { createContext, useContext } from 'react';

const UserContext = createContext('游客');

function Welcome() {
  const user = useContext(UserContext);
  return <p id="welcome">欢迎，{user}</p>;
}

function Layout() {
  return <div><Welcome /></div>;
}

function App() {
  return (
    <UserContext value="小李">
      <Layout />
    </UserContext>
  );
}`,
    hint: '回到正文的“三步使用 Context”：创建、提供、消费。你缺的是哪一步？',
    exports: ['Welcome', 'UserContext'],
    faded: `import { createContext, useContext } from 'react';

/* ✏️ 创建 UserContext，默认值是“游客” */

function Welcome() {
  /* ✏️ 读取 UserContext 的值，存进 user */
  return <p id="welcome">欢迎，{user}</p>;
}

function Layout() {
  return <div><Welcome /></div>;
}

function App() {
  return (
    /* ✏️ 用 <UserContext value="小李"> 包住 Layout */
  );
}`,
    test: async t => {
      const { React, ReactDOM } = t;
      t.assert(t.text('#welcome').replace(/\s/g, '') === '欢迎，小李', `应显示“欢迎，小李”，实际是“${t.text('#welcome')}”`);
      t.assert(!/<Welcome\s+[\w{]/.test(t.source), '不要通过 props 传给 Welcome。用户名要从 Context 里读');
      t.assert(!/createContext\(\s*['"`]小李/.test(t.source), '默认值不要写“小李”。默认值是“游客”，“小李”要由 App 里的 Provider 提供');
      t.assert(typeof t.exports.Welcome === 'function', '请保留名为 Welcome 的组件');
      // 把 Welcome 单独渲染在 Provider 外面：它应读到默认值
      const box = document.createElement('div');
      const root = ReactDOM.createRoot(box);
      let alone = '';
      try {
        ReactDOM.flushSync(() => root.render(React.createElement(t.exports.Welcome)));
        alone = box.textContent.replace(/\s/g, '');
      } finally {
        root.unmount();
      }
      t.assert(
        alone === '欢迎，游客',
        `Welcome 放在 Provider 外面时应显示默认值“欢迎，游客”，实际是“${alone}”。默认值写在 createContext('游客') 里，Welcome 要用 useContext 读取，不要把名字写死`,
      );
      // 再把 Welcome 放进另一个 Provider：它应读到这个 Provider 的值
      const Ctx = t.exports.UserContext;
      t.assert(Ctx && Ctx.Provider, "找不到 UserContext。请用 const UserContext = createContext('游客') 创建它");
      // React 19 里 Context 本身就是 Provider（Ctx.Provider === Ctx），写 <UserContext value> 或 <UserContext.Provider value> 都行
      const box2 = document.createElement('div');
      const root2 = ReactDOM.createRoot(box2);
      let inner = '';
      try {
        ReactDOM.flushSync(() => root2.render(React.createElement(Ctx, { value: '小王' }, React.createElement(t.exports.Welcome))));
        inner = box2.textContent.replace(/\s/g, '');
      } finally {
        root2.unmount();
      }
      t.assert(
        inner === '欢迎，小王',
        `把 Welcome 放进 value 为“小王”的 Provider，应显示“欢迎，小王”，实际是“${inner}”。Welcome 要用 useContext(UserContext) 读取最近的 Provider 的值`,
      );
    },
  },
  drillMins: 12,
  drills: [
    {
      title: '把层层传递的 props 改成 Context',
      task: "<ol class=\"task-steps\"><li>现在 <code>lang</code> 从 <code>App</code> 一路经过 <code>Layout</code>、<code>Sidebar</code>，才到 <code>Greeting</code>。中间两层自己用不到它，只是在转发。</li><li>创建 <code>LangContext</code>，默认值写 <code>'zh'</code>。它的值就是语言字符串，<code>'zh'</code> 或 <code>'en'</code>。</li><li><code>App</code> 把自己的 <code>lang</code> state 作为 Provider 的值提供出去。</li><li><code>Greeting</code> 用 <code>useContext</code> 读取语言。<code>Layout</code> 和 <code>Sidebar</code> 不再接收、也不再转发 <code>lang</code>。</li><li>结果：点“切换语言”，问候语在中文和英文之间切换。</li></ol>",
      starter: `import { useState } from 'react';

const TEXT = { zh: '你好，欢迎回来', en: 'Hello, welcome back' };

function Greeting({ lang }) {
  return <p id="greeting">{TEXT[lang]}</p>;
}

function Sidebar({ lang }) {
  return <aside><Greeting lang={lang} /></aside>;
}

function Layout({ lang }) {
  return <main><Sidebar lang={lang} /></main>;
}

function App() {
  const [lang, setLang] = useState('zh');
  return (
    <div>
      <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>切换语言</button>
      <Layout lang={lang} />
    </div>
  );
}`,
      solution: `import { createContext, useContext, useState } from 'react';

const TEXT = { zh: '你好，欢迎回来', en: 'Hello, welcome back' };

const LangContext = createContext('zh');

function Greeting() {
  const lang = useContext(LangContext);
  return <p id="greeting">{TEXT[lang]}</p>;
}

function Sidebar() {
  return <aside><Greeting /></aside>;
}

function Layout() {
  return <main><Sidebar /></main>;
}

function App() {
  const [lang, setLang] = useState('zh');
  return (
    <LangContext value={lang}>
      <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>切换语言</button>
      <Layout />
    </LangContext>
  );
}`,
      hint: '回到“三步使用 Context”：创建、提供、消费。Provider 的 value 要放 App 里会变化的 <code>lang</code>，不要写死一个字符串。',
      exports: ['Layout', 'LangContext'],
      test: async t => {
        const { React, ReactDOM } = t;
        const g = () => t.text('#greeting');
        t.assert(g() === '你好，欢迎回来', '一开始应显示“你好，欢迎回来”，实际是“' + g() + '”。');
        await t.click(t.byText('button', '切换语言'));
        t.assert(
          g() === 'Hello, welcome back',
          '点“切换语言”后应显示“Hello, welcome back”，实际是“' + g() + '”。Provider 的 value 要用 App 里的 lang state，这样 lang 变化时读取它的组件才会更新。',
        );
        await t.click(t.byText('button', '切换语言'));
        t.assert(g() === '你好，欢迎回来', '再点一次“切换语言”应切回中文，实际是“' + g() + '”。');
        const Ctx = t.exports.LangContext;
        t.assert(Ctx && Ctx.Provider, "找不到 LangContext。请用 const LangContext = createContext('zh') 创建它");
        t.assert(typeof t.exports.Layout === 'function', '请保留名为 Layout 的组件');
        // 不给任何 props：Layout 放进 value 为 'en' 的 Provider，里面的 Greeting 应读到 'en'
        const renderText = value => {
          const box = document.createElement('div');
          const root = ReactDOM.createRoot(box);
          try {
            const layout = React.createElement(t.exports.Layout);
            ReactDOM.flushSync(() => root.render(value === undefined ? layout : React.createElement(Ctx, { value }, layout)));
            return box.textContent.trim();
          } finally {
            root.unmount();
          }
        };
        const inEn = renderText('en');
        t.assert(
          inEn === 'Hello, welcome back',
          '不给 Layout 传任何 props，把它放进 value 为“en”的 Provider，应显示“Hello, welcome back”，实际是“' +
            inEn +
            '”。Greeting 要用 useContext(LangContext) 读语言，不要再从 props 里取。',
        );
        const bare = renderText(undefined);
        t.assert(
          bare === '你好，欢迎回来',
          '把 Layout 放在任何 Provider 外面，应读到默认值“zh”并显示“你好，欢迎回来”，实际是“' + bare + "”。createContext 的默认值应是 'zh'。",
        );
      },
    },
    {
      title: '没有 Provider 时读到什么',
      task: '<ol class="task-steps"><li><code>UserContext</code> 的值是 <code>{ name }</code> 形状的对象。<code>UserBadge</code> 显示 <code>user.name</code>。</li><li>现在把 <code>UserBadge</code> 单独放在任何 Provider 外面会报错。想一想：<code>useContext</code> 找不到 Provider 时返回什么？</li><li>修复它：没有 Provider 时，<code>UserBadge</code> 显示“游客”。不要给 <code>UserBadge</code> 传 props。</li><li>在 <code>App</code> 外层 Provider 里面再嵌套一层 Provider，值为 <code>{ name: \'小王\' }</code>，里面放一个 <code>UserBadge</code>。</li><li>结果：页面上有两个 <code>.badge</code>，依次显示“小李”“小王”。里层的 Provider 覆盖外层的值。</li></ol>',
      starter: `import { createContext, useContext } from 'react';

const UserContext = createContext(null);

function UserBadge() {
  const user = useContext(UserContext);
  return <span className="badge">{user.name}</span>;
}

function App() {
  return (
    <UserContext value={{ name: '小李' }}>
      <p>外层：<UserBadge /></p>
      {/* 在这里再嵌套一层 Provider，值为 { name: '小王' }，里面放一个 UserBadge */}
    </UserContext>
  );
}`,
      solution: `import { createContext, useContext } from 'react';

const UserContext = createContext({ name: '游客' });

function UserBadge() {
  const user = useContext(UserContext);
  return <span className="badge">{user.name}</span>;
}

function App() {
  return (
    <UserContext value={{ name: '小李' }}>
      <p>外层：<UserBadge /></p>
      <UserContext value={{ name: '小王' }}>
        <p>里层：<UserBadge /></p>
      </UserContext>
    </UserContext>
  );
}`,
      hint: '没有 Provider 时，<code>useContext</code> 返回 <code>createContext</code> 的默认值。现在默认值是 <code>null</code>，读它的 <code>name</code> 就报错。把默认值换成合适的对象，或者在读取处处理 <code>null</code>，都可以。',
      exports: ['UserBadge', 'UserContext'],
      test: async t => {
        const { React, ReactDOM } = t;
        t.assert(typeof t.exports.UserBadge === 'function', '请保留名为 UserBadge 的组件');
        const Ctx = t.exports.UserContext;
        t.assert(Ctx && Ctx.Provider, '请保留名为 UserContext 的 Context');
        // 单独渲染，放在错误边界里，报错时给出原因
        class Boundary extends React.Component {
          constructor(p) {
            super(p);
            this.state = { err: null };
          }
          static getDerivedStateFromError(err) {
            return { err };
          }
          render() {
            return this.state.err ? React.createElement('i', { className: 'err' }, String(this.state.err.message)) : this.props.children;
          }
        }
        const renderBadge = value => {
          const box = document.createElement('div');
          const root = ReactDOM.createRoot(box);
          try {
            const badge = React.createElement(t.exports.UserBadge);
            const inner = value === undefined ? badge : React.createElement(Ctx, { value }, badge);
            ReactDOM.flushSync(() => root.render(React.createElement(Boundary, null, inner)));
            const err = box.querySelector('.err');
            return err ? { err: err.textContent } : { text: box.textContent.trim() };
          } finally {
            root.unmount();
          }
        };
        const originalError = console.error;
        let bare: any;
        try {
          console.error = () => {};
          bare = renderBadge(undefined);
        } finally {
          console.error = originalError;
        }
        t.assert(
          !bare.err,
          'UserBadge 放在 Provider 外面时报错了（' +
            bare.err +
            '）。useContext 找不到 Provider 时返回 createContext 的默认值，现在默认值是 null。让它在没有 Provider 时也能显示。',
        );
        t.assert(bare.text === '游客', 'UserBadge 放在 Provider 外面时应显示“游客”，实际是“' + bare.text + '”。');
        const withValue = renderBadge({ name: '小陈' });
        t.assert(
          withValue.text === '小陈',
          "放进值为 { name: '小陈' } 的 Provider，应显示“小陈”，实际是“" + (withValue.text || withValue.err) + '”。有 Provider 时要读 Provider 的值。',
        );
        const badges = t.qa('.badge').map(b => b.textContent.trim());
        t.assert(badges.length === 2, '页面上应有两个 .badge，实际有 ' + badges.length + ' 个。在外层 Provider 里再嵌套一层 Provider，放一个 UserBadge。');
        t.assert(badges[0] === '小李', '第一个 .badge 应显示“小李”，实际是“' + badges[0] + '”。');
        t.assert(badges[1] === '小王', '第二个 .badge 应显示“小王”，实际是“' + badges[1] + "”。里层的 Provider 会覆盖外层的值，值要写成 { name: '小王' }。");
      },
    },
  ],
  checkOnly: [
    {
      q: `Footer 里调用 <code>useContext(ThemeCtx)</code>，读到什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const ThemeCtx = createContext('light');

function App() {
  const [theme, setTheme] = useState('dark');
  return (
    &lt;&gt;
      &lt;ThemeCtx value={theme}&gt;
        &lt;Toolbar /&gt;
      &lt;/ThemeCtx&gt;
      &lt;Footer /&gt;
    &lt;/&gt;
  );
}</code></pre></div>`,
      options: ["'dark'", "'light'", 'undefined', '报错：Footer 不在 Provider 里'],
      answer: 1,
      explain:
        "useContext 向上查找最近的 Provider。Footer 是 Provider 的兄弟，不在它里面。所以 Footer 读到 createContext 的默认值 'light'。Toolbar 在 Provider 里面，读到 'dark'。",
    },
    {
      q: `Header 用 <code>useContext(UserCtx)</code> 显示用户名。点击“登录”后，Header 显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function App() {
  let user = { name: '游客' };
  return (
    &lt;UserCtx value={user}&gt;
      &lt;button onClick={() =&gt; { user = { name: '小明' }; }}&gt;
        登录
      &lt;/button&gt;
      &lt;Header /&gt;
    &lt;/UserCtx&gt;
  );
}</code></pre></div>`,
      options: ['小明：Provider 的 value 变了，Header 会更新', 'null：变量被重新赋值后 Context 丢失', '游客', '报错：value 必须是 state'],
      answer: 2,
      explain:
        '给普通变量重新赋值，不会触发重新渲染。App 没有重新渲染，Provider 的 value 还是旧对象，Header 仍显示“游客”。Context 只负责把值传下去，它不会让普通变量变成 state。修复：<code>const [user, setUser] = useState(…)</code>，点击时调用 setUser。“报错”不对：value 可以是任何值，只是它不会自己变化。',
    },
  ],
  plays: {
    主题切换: {
      note: 'Page 和 Sidebar 没有接收任何 theme prop，卡片 A 和 B 却能读到。卡片 C 在 Provider 外面，useContext 找不到上层的 Provider，只能读到 createContext 的默认值 light。切换主题只改变 Provider 的 value，影响不到它。',
      predict: {
        q: '点一次“切换主题”。卡片 C 显示的是哪个主题？',
        options: ['dark，和卡片 A、B 一样', '页面报错：卡片 C 找不到 Provider', 'undefined', 'light'],
        answer: 3,
        explain:
          "卡片 C 在 Provider 外面。useContext 找不到上层的 Provider，就用 createContext 的默认值 'light'。切换主题只改变 Provider 的 value，影响不到它。最迷惑的是“报错”：没有 Provider 不会报错，只会读到默认值。",
      },
      pkey: 'context|主题切换',
    },
    '用 use 读取 Context': {
      note: '点“显示备注”，ThemedNote 在提前 return 之后读取 Context，没有任何报错。use(ThemeContext) 读到的值和 useContext(ThemeContext) 一样：最近的 Provider 的 value，这里是 dark。',
    },
    '购物车 Context': {},
  },
} satisfies Lesson;
