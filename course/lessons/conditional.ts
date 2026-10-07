import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/conditional.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'conditional',
  stage: 0,
  title: '条件渲染',
  mins: 16,
  summary: '根据条件显示不同的内容。',
  goals: [
    '能根据场景选择 if 提前返回、三元运算符或 &amp;&amp; 来写条件渲染',
    '能找出 &amp;&amp; 左边是数字 0 时显示“0”的 bug，并修复它',
    '能写出 return null 让组件不渲染，并把它放在所有 Hook 之后',
  ],
  keyPoints: [
    '整个组件二选一时，用 if 提前 return；在 JSX 内部二选一，用三元运算符 <code>? :</code>。',
    '“满足条件才显示，否则什么都不显示”，用 <code>&amp;&amp;</code>。',
    '坑：<code>&amp;&amp;</code> 左边是数字 0 时，页面会显示“0”。写成 <code>count &gt; 0 &amp;&amp; …</code>。',
    '组件返回 <code>null</code> 就什么都不渲染。提前 return 要放在所有 Hook 之后。',
  ],
  quiz: [
    {
      q: 'const items = []; 渲染 {items.length && &lt;List /&gt;} 会显示？',
      options: ['什么都不显示', '0', '空的 List', '报错'],
      answer: 1,
      explain: 'items.length 是 0。0 && x 返回 0，React 会把数字 0 渲染出来。请写 items.length &gt; 0 &amp;&amp; ...。最容易误选的是“什么都不显示”：false、null、undefined 不会显示，但数字 0 会。',
    },
    {
      q: 'isAdmin 是布尔值。<code>{isAdmin ? &lt;Panel /&gt; : null}</code> 和 <code>{isAdmin &amp;&amp; &lt;Panel /&gt;}</code> 在 isAdmin 为 false 时有什么区别？',
      options: ['没有区别，都什么也不显示', '&& 版本会显示文字“false”', '三元版本会显示文字“null”', '&& 版本只能用在 if 里'],
      answer: 0,
      explain: 'React 不渲染 null、false、undefined 和 true，所以布尔值配 && 是安全的。最容易误选的是第二项：false 不会显示成文字。会出问题的是数字 0。',
    },
    {
      q: '<code>{show &amp;&amp; &lt;input /&gt;}</code>。在输入框里打几个字，把 show 改成 false，再改回 true。输入框里的字会怎样？',
      options: [
        '还在：React 记得输入框里的内容',
        '没了：show 为 false 时输入框被移除，改回来的是一个新的输入框',
        '输入框里显示文字“false”',
        '输入框一直都在，只是 show 为 false 时变灰',
      ],
      answer: 1,
      explain: 'show 为 false 时，&& 的结果是 false，React 把输入框从页面上移除。改回 true 时，React 新建一个输入框，内容是空的。最迷惑的是第一项：只有元素一直留在页面上，内容才会保留。想保留内容，可以一直渲染它，只用 CSS（display: none）把它藏起来。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>声明 state <code>loggedIn</code>，初始值为 false。</li><li>loggedIn 为 false 时，只显示按钮 <b>登录</b>。</li><li>点击 <b>登录</b> 后，显示 <code>&lt;h2&gt;欢迎回来&lt;/h2&gt;</code> 和按钮 <b>退出</b>。</li><li>点击 <b>退出</b> 后，回到第 2 步的界面。</li></ol>',
    starter: `import { useState } from 'react';

function App() {
  // 在这里实现
  return <button>登录</button>;
}`,
    solution: `import { useState } from 'react';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  if (!loggedIn) {
    return <button onClick={() => setLoggedIn(true)}>登录</button>;
  }
  return (
    <div>
      <h2>欢迎回来</h2>
      <button onClick={() => setLoggedIn(false)}>退出</button>
    </div>
  );
}`,
    hint: '可以用 if 提前 return，也可以用三元运算符。',
    faded: `import { useState } from 'react';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  if (/* ✏️ 什么情况下只显示“登录”按钮？ */) {
    return <button onClick={/* ✏️ 点击后变成已登录 */}>登录</button>;
  }
  return (
    <div>
      <h2>欢迎回来</h2>
      <button onClick={/* ✏️ 点击后变回未登录 */}>退出</button>
    </div>
  );
}`,
    test: async (t) => {
      t.assert(!t.q('h2'), '未登录时不应显示 h2');
      const login = t.byText('button', '登录'); t.assert(login, '未登录时应有“登录”按钮');
      await t.click(login);
      t.assert(t.text('h2') === '欢迎回来', '登录后应显示 <h2>欢迎回来</h2>');
      t.assert(!t.byText('button', '登录'), '登录后不应再显示“登录”按钮');
      const out = t.byText('button', '退出'); t.assert(out, '登录后应有“退出”按钮');
      await t.click(out);
      t.assert(!t.q('h2') && t.byText('button', '登录'), '退出后应回到未登录状态');
    },
  },
  checkOnly: [
    {
      q: `在 React 18 及以后，<code>&lt;Status online={false} /&gt;</code> 会渲染什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Status({ online }) {
  if (online) return &lt;b&gt;在线&lt;/b&gt;;
}</code></pre></div>`,
      options: ['什么都不渲染', '报错：组件必须返回 null，不能返回 undefined', '显示文字 undefined', '显示文字 false'],
      answer: 0,
      explain: 'online 为 false 时，函数没有 return，返回 undefined。从 React 18 开始，组件返回 undefined 和返回 null 一样，什么都不渲染。React 17 及以前会报错。为了让意图清楚，仍建议写 <code>return null</code>。',
    },
    {
      q: `loading 为 true、error 为 null 时，页面显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">return (
  &lt;&gt;
    {loading &amp;&amp; &lt;Spinner /&gt;}
    {error &amp;&amp; &lt;ErrorMsg text={error} /&gt;}
    &lt;List items={items} /&gt;
  &lt;/&gt;
);</code></pre></div>`,
      options: ['只显示 Spinner', '只显示 List', 'Spinner 和 List 同时显示', 'Spinner、ErrorMsg 和 List 都显示'],
      answer: 2,
      explain: '<code>&amp;&amp;</code> 只控制它后面那一项。List 没有条件，所以一直显示。加载中时，用户同时看到加载图标和旧的（或空的）列表。想三选一，用提前 return：<code>if (loading) return &lt;Spinner /&gt;;</code>，再处理 error，最后返回 List。“只显示 Spinner”是把三行当成了 if/else，但 JSX 里并列的表达式各自独立。',
    },
  ],
  plays: {
    '三元运算符与 &&': {},
    'count 为 0 时的两种写法': {
      note: '写法 A 显示了一个“0”。0 &amp;&amp; x 的结果是 0，而 React 会渲染数字。',
      predict: {
        q: '“写法 A：”这一行后面会显示什么？',
        options: ['什么都不显示', '0', 'false', '有 0 条'],
        answer: 1,
        explain: '0 && x 的结果是 0，而 React 会把数字渲染出来，所以页面上出现一个“0”。',
      },
      pkey: 'conditional|count 为 0 时的两种写法',
    },
  },
} satisfies Lesson;
