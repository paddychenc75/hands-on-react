// 由 scripts/convert.mjs 从旧版 src/*.js 生成。
// 非正文数据。课文在 docs/lessons/context.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'context',
  stage: 1,
  title: 'Context：跨层级共享数据',
  mins: 19,
  summary: '不用层层传递 props，也能让深层组件读到数据。',
  goals: [
    '能用 createContext、Provider、useContext 三步，让深层组件读到数据',
    '能把 state 和修改它的函数放进 value，让深层组件既能读也能改',
    '能说出 useContext 读到的是哪个值：最近的 Provider，或默认值',
    '能判断一份数据该用 Context，还是直接通过 props 传入',
  ],
  keyPoints: [
    'Context 解决 prop drilling：父组件把数据“广播”给整棵子树，任何深度的后代都能直接读取。',
    '三步：<code>createContext(默认值)</code> 创建；<code>&lt;Ctx.Provider value={…}&gt;</code> 提供；<code>useContext(Ctx)</code> 读取。',
    'useContext 读的是离它最近的上层 Provider 的 value。找不到 Provider 时，才用默认值。',
    '把 state 和修改它的函数一起放进 value，后代组件就既能读也能改。',
    '代价：value 变化时，所有读取它的组件都会重新渲染。适合主题、语言、当前用户这类不常变的数据。',
  ],
  quiz: [
    {
      q: '两个 ThemeContext.Provider 嵌套：外层 value="light"，内层 value="dark"。内层里面的组件调用 useContext(ThemeContext)，读到什么？',
      options: [
        '"light"：最外层的 Provider 说了算',
        '"dark"：离它最近的 Provider 说了算',
        'createContext 时写的默认值',
        '报错：同一个 Context 不能嵌套提供',
      ],
      answer: 1,
      explain: 'React 从组件往上找，用最近的那个 Provider 的 value；一个都找不到时才用默认值。最迷惑的是第一项：Provider 可以嵌套，内层会覆盖外层，常用来给某一块区域换主题。',
    },
    {
      q: '一个 Context 的 value 里同时放了“当前用户”和“每秒变化多次的鼠标坐标”。会有什么问题？',
      options: ['坐标一变，只读用户的组件也会重新渲染', 'value 里不能放对象，只能放字符串', '读用户的组件拿不到最新的用户', '没问题：React 只重新渲染用到坐标的组件'],
      answer: 0,
      explain: 'value 变了，所有读取这个 Context 的组件都会重新渲染，不管它用的是哪个字段。最迷惑的是最后一项：React 不按字段追踪。解决方法：拆成两个 Context。',
    },
    {
      q: '<code>const UserContext = createContext(\'游客\')</code>。App 渲染 <code>&lt;Welcome /&gt;</code> 和 <code>&lt;UserContext.Provider value="小李"&gt;…&lt;/UserContext.Provider&gt;</code>，第一个 Welcome 在 Provider 外面。它读到什么？',
      options: ['"游客"', '"小李"', 'undefined', '报错：找不到 Provider'],
      answer: 0,
      explain: '它上面没有 Provider，所以用默认值。最迷惑的是“小李”：Provider 只对它包住的子树生效，兄弟组件读不到。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>用 <code>createContext</code> 创建 <code>UserContext</code>。默认值写 <b>游客</b>。</li><li>在 <code>App</code> 中用 Provider 提供值 <code>"小李"</code>。</li><li>在深层组件 <code>Welcome</code> 中，用 <code>useContext</code> 读取用户名。</li><li>渲染 <code>&lt;p id="welcome"&gt;欢迎，小李&lt;/p&gt;</code>。不要通过 props 传递用户名。</li></ol>',
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
    <UserContext.Provider value="小李">
      <Layout />
    </UserContext.Provider>
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
    /* ✏️ 用 UserContext 的 Provider 包住 Layout，提供 "小李" */
  );
}`,
    test: async (t) => {
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
      } finally { root.unmount(); }
      t.assert(alone === '欢迎，游客', `Welcome 放在 Provider 外面时应显示默认值“欢迎，游客”，实际是“${alone}”。默认值写在 createContext('游客') 里，Welcome 要用 useContext 读取，不要把名字写死`);
      // 再把 Welcome 放进另一个 Provider：它应读到这个 Provider 的值
      const Ctx = t.exports.UserContext;
      t.assert(Ctx && Ctx.Provider, '找不到 UserContext。请用 const UserContext = createContext(\'游客\') 创建它');
      const box2 = document.createElement('div');
      const root2 = ReactDOM.createRoot(box2);
      let inner = '';
      try {
        ReactDOM.flushSync(() => root2.render(React.createElement(Ctx.Provider, { value: '小王' }, React.createElement(t.exports.Welcome))));
        inner = box2.textContent.replace(/\s/g, '');
      } finally { root2.unmount(); }
      t.assert(inner === '欢迎，小王', `把 Welcome 放进 value 为“小王”的 Provider，应显示“欢迎，小王”，实际是“${inner}”。Welcome 要用 useContext(UserContext) 读取最近的 Provider 的值`);
    },
  },
  checkOnly: [
    {
      q: `Footer 里调用 <code>useContext(ThemeCtx)</code>，读到什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const ThemeCtx = createContext('light');

function App() {
  const [theme, setTheme] = useState('dark');
  return (
    &lt;&gt;
      &lt;ThemeCtx.Provider value={theme}&gt;
        &lt;Toolbar /&gt;
      &lt;/ThemeCtx.Provider&gt;
      &lt;Footer /&gt;
    &lt;/&gt;
  );
}</code></pre></div>`,
      options: ['\'dark\'', '\'light\'', 'undefined', '报错：Footer 不在 Provider 里'],
      answer: 1,
      explain: 'useContext 向上查找最近的 Provider。Footer 是 Provider 的兄弟，不在它里面。所以 Footer 读到 createContext 的默认值 \'light\'。Toolbar 在 Provider 里面，读到 \'dark\'。',
    },
    {
      q: `Header 用 <code>useContext(UserCtx)</code> 显示用户名。点击“登录”后，Header 显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function App() {
  let user = { name: '游客' };
  return (
    &lt;UserCtx.Provider value={user}&gt;
      &lt;button onClick={() =&gt; { user = { name: '小明' }; }}&gt;
        登录
      &lt;/button&gt;
      &lt;Header /&gt;
    &lt;/UserCtx.Provider&gt;
  );
}</code></pre></div>`,
      options: [
        '小明：Provider 的 value 变了，Header 会更新',
        'null：变量被重新赋值后 Context 丢失',
        '游客',
        '报错：value 必须是 state',
      ],
      answer: 2,
      explain: '给普通变量重新赋值，不会触发重新渲染。App 没有重新渲染，Provider 的 value 还是旧对象，Header 仍显示“游客”。Context 只负责把值传下去，它不会让普通变量变成 state。修复：<code>const [user, setUser] = useState(…)</code>，点击时调用 setUser。“报错”不对：value 可以是任何值，只是它不会自己变化。',
    },
  ],
  plays: {
    '主题切换': {
      note: 'Page 和 Sidebar 没有接收任何 theme prop，卡片 A 和 B 却能读到。卡片 C 在 Provider 外面，useContext 找不到上层的 Provider，只能读到 createContext 的默认值 light。切换主题只改变 Provider 的 value，影响不到它。',
      predict: {
        q: '点一次“切换主题”。卡片 C 显示的是哪个主题？',
        options: ['dark，和卡片 A、B 一样', '页面报错：卡片 C 找不到 Provider', 'undefined', 'light'],
        answer: 3,
        explain: '卡片 C 在 Provider 外面。useContext 找不到上层的 Provider，就用 createContext 的默认值 \'light\'。切换主题只改变 Provider 的 value，影响不到它。最迷惑的是“报错”：没有 Provider 不会报错，只会读到默认值。',
      },
      pkey: 'context|主题切换',
    },
    '购物车 Context': {},
  },
};
