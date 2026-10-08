import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/rendering.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'rendering',
  stage: 2,
  title: '渲染机制：React 到底做了什么',
  mins: 32,
  summary: '理解触发、渲染、提交三个阶段，以及虚拟 DOM 与协调算法。',
  goals: [
    '能解释“渲染”和“更新 DOM”的区别',
    '能判断一次更新会让哪些组件重新渲染',
    '能根据位置、类型和 key 预测 state 是保留还是丢失',
    '能用“把 state 下移”减少不必要的渲染',
    '能用 <code>&lt;Activity&gt;</code> 隐藏一块界面并保留它的 state，并说出它和条件渲染、CSS 隐藏的区别',
    '能说出严格模式在开发环境多做了什么，以及为什么渲染必须是纯的',
  ],
  keyPoints: [
    '一次更新分三步：触发 → 渲染 → 提交。渲染只是调用组件函数并算出差异，提交才修改 DOM。',
    '组件的 state 变化时，它和它的全部后代都会重新渲染。props 没变的子组件也一样，除非用了 memo，或项目启用了 React Compiler。',
    'React 按“树中的位置 + 元素类型”保存 state。位置和类型不变，state 保留；类型变了或 key 变了，state 被丢弃。',
    '最常见的坑：在组件内部定义组件。每次渲染它都是新类型，state 和焦点都会丢失。',
    '先试结构性优化：把 state 下移到真正用它的小组件里，其他组件就不会跟着重新渲染。',
    '想隐藏界面又保留 state，用 <code>&lt;Activity mode="hidden"&gt;</code>：state 和 DOM 都留着，effect 被清理，显示时重新运行。条件渲染会丢 state，CSS 隐藏不会清理 effect。',
    '严格模式只在开发环境生效：多调用一次组件函数、初始化函数和更新函数，并让 effect 多做一轮。它用来暴露渲染里的副作用。',
  ],
  quiz: [
    {
      q: '父组件重新渲染时，props 没变的子组件会怎样（未使用 memo）？',
      options: ['跳过渲染，因为 props 没变', '也会重新渲染', '只更新 DOM，不调用组件函数', '被卸载后重新挂载'],
      answer: 1,
      explain:
        '默认情况下，父组件渲染会带动所有子组件渲染。“props 没变就跳过”是 memo 的行为。在没有 memo 且没有启用 React Compiler 时，React 根本不比较 props。',
    },
    {
      q: '某位置的元素从 &lt;div&gt;&lt;Counter/&gt;&lt;/div&gt; 变成 &lt;span&gt;&lt;Counter/&gt;&lt;/span&gt;，Counter 的 state？',
      options: ['保留，因为 Counter 的类型没变', '丢失并重置为初始值', '保留，但 DOM 节点重新创建', '报错'],
      answer: 1,
      explain: '父元素类型变了，React 卸载整棵旧子树，再挂载新的子树。Counter 自己的类型没变也没有用：它所在的 div 被卸载了，它也跟着被卸载。',
    },
    {
      q: 'App 有 state text。App 函数体里定义了 function Input() { … }，输入框读写 App 的 text。在输入框打一个字，会怎样？',
      options: ['正常输入，焦点不变', '字被输入，但输入框失去焦点', '字输不进去，输入框一直为空', '只有 Input 重新渲染，App 不受影响'],
      answer: 1,
      explain:
        'App 每次渲染都创建一个新的 Input 函数。类型变了，React 卸载旧输入框，挂载新输入框，新输入框没有焦点。字能输入进去，因为 text 存在 App 里，新输入框拿到的是最新值。',
    },
    {
      q: '一次点击中依次调用 setA(1)、setB(2)、setC(3)。组件渲染几次？',
      options: ['3 次', '1 次', '1 次，但只有最后的 setC(3) 生效', '在事件处理函数里 1 次；放进 setTimeout 里就是 3 次'],
      answer: 1,
      explain:
        '自动批处理：同一个事件中的多次 set 函数调用合并为一次渲染，三个更新都生效。最后一项是 React 17 的行为。React 18 起，setTimeout 和 Promise 回调里也会批处理。',
    },
    {
      q: '标签页 B 的内容放在 &lt;Activity mode={tab === "b" ? "visible" : "hidden"}&gt; 里，里面有一个输入框和一个订阅消息的 effect。用户在输入框里打了字，然后切到标签页 A。B 里的输入框和 effect 分别怎样？',
      options: [
        '输入框的文字保留，effect 被清理；切回 B 时 effect 重新运行',
        '输入框的文字丢失，effect 被清理',
        '输入框的文字保留，effect 继续运行，和 CSS 隐藏一样',
        '输入框的文字丢失，effect 继续运行',
      ],
      answer: 0,
      explain:
        'Activity 隐藏时保留 state 和 DOM，所以文字还在，但会清理 effect，订阅就不会在后台继续占资源。切回 visible 时，effect 重新运行。最迷惑的是第三项：它描述的是 CSS 隐藏（display: none）。CSS 只改样式，React 不知道界面被隐藏，effect 一直在运行。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>观察：在输入框打字时，<code>Slow</code> 的渲染次数在增加。</li><li>新建一个组件，把输入框、<code>&lt;p&gt;</code> 和它们的 state 移进去。这叫<b>把 state 下移</b>。</li><li>在 <code>App</code> 中渲染这个新组件和 <code>Slow</code>。</li><li>不要使用 memo 或 useMemo。</li></ol>',
    starter: `import { useState } from 'react';

let slowRenders = 0;
function Slow() {
  slowRenders++;
  return <p>Slow 组件渲染次数：<span id="slow-renders">{slowRenders}</span></p>;
}

function App() {
  const [text, setText] = useState('');
  return (
    <div>
      <input id="box" value={text} onChange={e => setText(e.target.value)} />
      <p>{text}</p>
      <Slow />
    </div>
  );
}`,
    solution: `import { useState } from 'react';

let slowRenders = 0;
function Slow() {
  slowRenders++;
  return <p>Slow 组件渲染次数：<span id="slow-renders">{slowRenders}</span></p>;
}

function TextInput() {
  const [text, setText] = useState('');
  return (
    <>
      <input id="box" value={text} onChange={e => setText(e.target.value)} />
      <p>{text}</p>
    </>
  );
}

function App() {
  return (
    <div>
      <TextInput />
      <Slow />
    </div>
  );
}`,
    hint: '先问自己：打字时，是谁的 state 在变？用到这个 state 的只有哪几个元素？把它们和 state 一起移进一个新组件。这样 App 自己没有 state，打字时就不会重新渲染。',
    faded: `import { useState } from 'react';

let slowRenders = 0;
function Slow() {
  slowRenders++;
  return <p>Slow 组件渲染次数：<span id="slow-renders">{slowRenders}</span></p>;
}

function TextInput() {
  /* ✏️ 把 text 这个 state 声明在这里，而不是 App 里 */
  return (
    <>
      <input id="box" value={text} onChange={e => setText(e.target.value)} />
      <p>{text}</p>
    </>
  );
}

function App() {
  return (
    <div>
      {/* ✏️ 在这里渲染新组件 */}
      <Slow />
    </div>
  );
}`,
    test: async t => {
      t.assert(!/memo/i.test(t.source), '这道题请不要使用 memo 或 useMemo');
      const before = t.text('#slow-renders');
      await t.type('#box', 'a');
      await t.type('#box', 'ab');
      await t.type('#box', 'abc');
      t.assert(t.q('#box').value === 'abc', '输入框要能正常输入');
      t.assert(
        t.qa('p').some(p => p.textContent.trim() === 'abc'),
        '输入框下方的 <p> 应显示输入的文字',
      );
      t.assert(
        t.text('#slow-renders') === before,
        `打字时 Slow 仍在重新渲染（${before} → ${t.text('#slow-renders')}）。text 的 state 是不是还在 Slow 的父组件里？父组件渲染会带动 Slow 一起渲染`,
      );
    },
  },
  checkOnly: [
    {
      q: `点击按钮后，组件会渲染几次（不算第一次挂载）？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [a, setA] = useState(0);
const [b, setB] = useState(0);
console.log('render', a, b);

&lt;button onClick={() =&gt; {
  setTimeout(() =&gt; {
    setA(1);
    setB(2);
  }, 0);
}}&gt;更新&lt;/button&gt;</code></pre></div>`,
      options: ['1 次，打印 render 1 2', '2 次：在 setTimeout 里不会批处理', '0 次', '3 次'],
      answer: 0,
      explain:
        '从 React 18 开始，批处理是自动的。在事件处理函数、setTimeout、Promise 回调中，同一时刻的多次 set 函数都会合并成一次渲染。React 17 在 setTimeout 里会渲染 2 次。',
    },
    {
      q: `先把 Counter 点到 2，再让 showBanner 变成 true。Counter 显示几？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;div&gt;
  {showBanner &amp;&amp; &lt;Banner /&gt;}
  &lt;Counter /&gt;
&lt;/div&gt;</code></pre></div>`,
      options: ['2：Counter 的位置没有变', '0：前面多了一个元素，Counter 被重新创建', '1', '报错'],
      answer: 0,
      explain:
        '<code>{showBanner &amp;&amp; …}</code> 在 false 时也占着一个“空位”。所以 Counter 一直是 div 的第二个子节点，位置不变，state 保留。如果改成 if/else 返回两棵结构不同的树，Counter 的位置才可能改变。',
    },
    {
      q: `先把计数器点到 3，再把 isAdmin 从 true 改为 false。计数器显示几？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">{isAdmin
  ? &lt;Counter label="管理员" /&gt;
  : &lt;Counter label="访客" /&gt;}</code></pre></div>`,
      options: ['0：换成了另一个 Counter，state 重置', '两个计数器各自记数，切回来时恢复', '报错：同一位置不能条件渲染两个组件', '3'],
      answer: 3,
      explain:
        'React 按组件在树中的<b>位置和类型</b>决定是否保留 state，不看 JSX 写在哪一行。两个分支都在同一位置渲染 Counter，React 认为是同一个组件，只是 label 变了，计数保持 3。想让两者各自独立，给它们不同的 key：<code>&lt;Counter key="admin" … /&gt;</code> 和 <code>&lt;Counter key="guest" … /&gt;</code>。“重置为 0”是只看代码写法、没看树结构的结果。',
    },
    {
      q: `没有使用 StrictMode。先点“切换”，再点“主题”。控制台依次新增哪些输出？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Tabs({ children }) {
  const [tab, setTab] = useState(0);
  console.log('Tabs');
  return (
    &lt;div&gt;
      &lt;button onClick={() =&gt; setTab(tab + 1)}&gt;切换&lt;/button&gt;
      {children}
    &lt;/div&gt;
  );
}

function Clock() {
  console.log('Clock');
  return &lt;p&gt;12:00&lt;/p&gt;;
}

function App() {
  const [dark, setDark] = useState(false);
  return (
    &lt;&gt;
      &lt;button onClick={() =&gt; setDark(!dark)}&gt;主题&lt;/button&gt;
      &lt;Tabs&gt;&lt;Clock /&gt;&lt;/Tabs&gt;
    &lt;/&gt;
  );
}</code></pre></div>`,
      options: [
        '点“切换”：Tabs、Clock；点“主题”：Tabs、Clock',
        '点“切换”：Tabs；点“主题”：Tabs、Clock',
        '点“切换”：Tabs；点“主题”：Tabs',
        '点“切换”：Tabs；点“主题”：Clock',
      ],
      answer: 1,
      explain:
        '<code>&lt;Clock /&gt;</code> 这个元素是 App 创建的，作为 children 传给 Tabs。<ol class="task-steps"><li>点“切换”：只有 Tabs 的 state 变了。App 没有重新渲染，children 还是同一个元素对象，React 跳过 Clock。</li><li>点“主题”：App 重新渲染，创建了新的 <code>&lt;Clock /&gt;</code> 元素。Tabs 没有用 memo，所以 Tabs 和 Clock 都重新渲染。</li></ol>最迷惑的是第一项：“父组件重新渲染，子组件都重新渲染”只适用于组件在自己的 JSX 里写出来的子组件。第三项也不对：children 不是永远跳过，创建它的组件重新渲染时，它就会重新渲染。',
    },
    {
      q: `应用包在 <code>&lt;StrictMode&gt;</code> 里，在开发环境第一次挂载 Page。挂载完成后，visits 是多少？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">let visits = 0;

function Page() {
  visits++;
  return &lt;p&gt;欢迎&lt;/p&gt;;
}</code></pre></div>`,
      options: ['2：严格模式把组件函数多调用一次', '1：组件函数只运行一次', '0：visits 只在 effect 里才会变', '3：函数调用两次，effect 再多一轮'],
      answer: 0,
      explain:
        '开发环境的严格模式会把组件函数多调用一次，所以 visits 变成 2。这正是它的用途：渲染里修改外部变量是副作用，多调用一次，结果就出错，你在开发时就能发现。生产环境没有这次额外调用。第四项把 effect 的多一轮和函数的多一次混在一起：这个组件没有 effect，所以不会多出调用。修法是别在渲染时修改外部变量。',
    },
  ],
  plays: {
    '谁被重新渲染了？': {
      note: '点 App 的按钮：所有组件都闪烁。Child A 的 props 一直没变，也照样重新渲染。点 Counter 的按钮：只有 Counter 闪烁。',
      predict: {
        q: '点击 Counter 内部的“+1”按钮，哪些组件会重新渲染（闪烁）？',
        options: ['所有组件', '只有 Counter', 'App 和 Counter', 'Counter 和两个 Child'],
        answer: 1,
        explain: 'state 属于 Counter，更新只会让 Counter 和它的后代重新渲染。父组件和兄弟组件不受影响。',
      },
      pkey: 'rendering|谁被重新渲染了？',
    },
    三种隐藏方式: {
      note: '条件渲染的输入框在隐藏时被卸载，文字丢失，effect 被清理，显示时重新开始。CSS 隐藏的输入框保留文字，但 effect 没有任何日志：React 不知道它被隐藏，effect 一直在运行。Activity 里的输入框保留文字，同时 effect 被清理，显示时又运行一次。',
      predict: {
        q: '在三个输入框里各打几个字，点“隐藏”，再点“显示”。哪些输入框里的字还在？',
        options: ['三个都在', '只有条件渲染的丢了，另外两个还在', '只有 Activity 里的还在', '三个都丢了'],
        answer: 1,
        explain: '条件渲染把组件卸载了，state 随之丢失。CSS 隐藏只改样式，组件一直挂载着。Activity 隐藏时保留 state 和 DOM，只清理 effect。',
      },
      pkey: 'rendering|三种隐藏方式',
    },
    严格模式下的组件函数: {
      note: '控制台里“Demo 函数被调用”会成对出现：严格模式把组件函数多调用一次。去掉 &lt;StrictMode&gt; 再运行，每次只打印一行。生产环境没有这次额外调用。',
      predict: {
        q: '运行后，页面第一次显示完。再点一下按钮。控制台一共打印了几行“Demo 函数被调用”？',
        options: ['2 行', '3 行', '4 行', '1 行'],
        answer: 2,
        explain: '挂载时调用 2 次，点击后重新渲染又调用 2 次，共 4 行。严格模式对每次渲染都多调用一次组件函数。',
      },
      pkey: 'rendering|严格模式下的组件函数',
    },
    状态跟着位置走: {
      note: '情况 1：同一位置、同一类型，state 保留。情况 2：外层从 section 变成 div，整棵子树重建，state 丢失。情况 3：key 不同，React 把它们当成两个组件。切换时旧的被卸载，state 丢弃；再切回来也是从 0 开始。',
      predict: {
        q: '把三个计数器都点到非 0 的数字，然后勾选“红色”。哪些计数器会保留原来的数字？',
        options: ['三个都保留', '只有情况 1', '情况 1 和 3', '都不保留'],
        answer: 1,
        explain: '情况 1 中同一位置、同一类型，状态保留；情况 2 外层从 section 变成 div，子树重建；情况 3 的 key 变了，被当成另一个组件。',
      },
      pkey: 'rendering|状态跟着位置走',
    },
  },
} satisfies Lesson;
