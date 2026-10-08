import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/rendering.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'rendering',
  stage: 2,
  title: '渲染机制：React 到底做了什么',
  mins: 26,
  summary: '理解触发、渲染、提交三个阶段，以及虚拟 DOM 与协调算法。',
  goals: [
    '能解释渲染、提交和更新 DOM 的区别',
    '能判断一次更新会让哪些组件重新渲染，并用“把 state 下移”减少不必要的渲染',
    '能根据位置、类型和 key 预测 state 是保留还是丢失',
    '能说出严格模式在开发环境多做了什么，以及为什么渲染必须是纯的',
  ],
  keyPoints: [
    '一次更新分三步：触发 → 渲染 → 提交。渲染只是调用组件函数并算出差异，提交才修改 DOM。',
    '组件的 state 变化时，它和它的全部后代都会重新渲染。props 没变的子组件也一样，除非用了 memo，或项目启用了 React Compiler。',
    'React 按“树中的位置 + 元素类型”保存 state。位置和类型不变，state 保留；类型变了或 key 变了，state 被丢弃。最常见的坑：在组件内部定义组件，每次渲染它都是新类型，state 和焦点都会丢失。',
    '先试结构性优化：把 state 下移到真正用它的小组件里，其他组件就不会跟着重新渲染。',
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
      q: '&lt;Profile key={userId} /&gt; 里有一个输入框，用户在里面打了字。userId 从 1 变成 2，Profile 的位置和类型都没变。输入框里的字？',
      options: [
        '保留，因为位置和类型没变',
        '丢失：key 变了就是另一个组件',
        '保留，但 Profile 的 props 更新为新的 userId',
        '保留一部分：React 只重置依赖 userId 的 state',
      ],
      answer: 1,
      explain:
        'key 是组件身份的一部分。key 变了，React 认为这是另一个组件：旧的卸载，state 随之丢弃，新的从初始值开始。这是“切换对象时重置表单”的惯用做法。第一项是没加 key 时的行为：位置和类型不变，state 保留。',
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
  drills: [
    {
      title: '换收件人，留言草稿要跟着清空',
      task: '<ol class="task-steps"><li>下面的 <code>Draft</code> 有自己的 state（留言草稿）。在输入框里写几个字，再切换收件人：草稿还留着，写给小明的话出现在了给小红的留言框里。</li><li>让切换收件人后，草稿从空白开始。</li><li>不要在 effect 里重置：那样会先用新收件人和旧草稿渲染一次，再渲染第二次。检查会查渲染记录 <code>seen</code>，里面不能出现“新收件人 + 旧草稿”的组合。</li><li>在输入框里打字时，已输入的内容不能丢。</li></ol>',
      starter: `import { useState } from 'react';

const seen = [];

function Draft({ user }) {
  const [text, setText] = useState('');
  seen.push(user + '|' + text);
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
      <button id="u1" onClick={() => setUser('小明')}>小明</button>
      <button id="u2" onClick={() => setUser('小红')}>小红</button>
      <Draft user={user} />
    </div>
  );
}`,
      solution: `import { useState } from 'react';

const seen = [];

function Draft({ user }) {
  const [text, setText] = useState('');
  seen.push(user + '|' + text);
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
      <button id="u1" onClick={() => setUser('小明')}>小明</button>
      <button id="u2" onClick={() => setUser('小红')}>小红</button>
      <Draft key={user} user={user} />
    </div>
  );
}`,
      hint: 'React 按“位置 + 类型”保存 state：两次渲染里 Draft 在同一个位置、是同一种组件，所以它的 state 被保留了。想让 React 把它当成另一个组件，可以改变什么？',
      exports: ['seen'],
      test: async t => {
        const seen = t.exports.seen;
        t.assert(Array.isArray(seen), '请保留名为 seen 的数组和 Draft 组件里的 seen.push(…) 记录');
        await t.type('#draft', 'hello');
        t.assert(t.q('#draft').value === 'hello', `在输入框里打字后，应显示 hello，实际是“${t.q('#draft').value}”。打字时草稿不能被清掉`);
        const n0 = seen.length;
        await t.click('#u2');
        t.assert(t.text('#to') === '小红', '点“小红”后，应显示“给 小红 写留言”');
        t.assert(
          t.q('#draft').value === '',
          `切换收件人后，草稿应从空白开始，实际还是“${t.q('#draft').value}”。Draft 在树里的位置和类型都没变，React 就保留了它的 state。请让 React 把它当成另一个组件`,
        );
        const stale = seen.slice(n0).filter(x => x === '小红|hello');
        t.assert(
          stale.length === 0,
          '切换后出现过一次“小红 + 旧草稿 hello”的渲染：state 是渲染之后才在 effect 里清掉的。重置 state 不要用 effect，让 React 直接丢掉旧组件的 state',
        );
        await t.type('#draft', '你好');
        await t.click('#u1');
        t.assert(t.q('#draft').value === '', `再切回小明，草稿也应从空白开始，实际是“${t.q('#draft').value}”`);
      },
    },
    {
      title: '有 state 的外壳，不要带着 Heavy 一起渲染',
      task: '<ol class="task-steps"><li><code>Panel</code> 自己有 state（展开/收起），里面包着很费时的 <code>Heavy</code>。点“展开”时，Heavy 的渲染次数也在增加。</li><li>这次 state 不能再下移：按钮和详情就在 Panel 里。改成让 Panel 接收 <code>children</code>，由 App 把 <code>&lt;Heavy /&gt;</code> 传进去。</li><li>Heavy 仍要显示在 Panel 的 <code>&lt;section&gt;</code> 里面。</li><li>不要使用 memo 或 useMemo，也不要把 state 搬到 App。</li></ol>',
      starter: `import { useState } from 'react';

let heavyRenders = 0;
function Heavy() {
  heavyRenders++;
  return <p>Heavy 渲染次数：<span id="heavy">{heavyRenders}</span></p>;
}

function Panel() {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button id="toggle" onClick={() => setOpen(!open)}>{open ? '收起' : '展开'}详情</button>
      {open && <p id="detail">这里是详情</p>}
      <Heavy />
    </section>
  );
}

function App() {
  return <Panel />;
}`,
      solution: `import { useState } from 'react';

let heavyRenders = 0;
function Heavy() {
  heavyRenders++;
  return <p>Heavy 渲染次数：<span id="heavy">{heavyRenders}</span></p>;
}

function Panel({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button id="toggle" onClick={() => setOpen(!open)}>{open ? '收起' : '展开'}详情</button>
      {open && <p id="detail">这里是详情</p>}
      {children}
    </section>
  );
}

function App() {
  return (
    <Panel>
      <Heavy />
    </Panel>
  );
}`,
      hint: '谁创建了 <code>&lt;Heavy /&gt;</code> 这个元素？现在是 Panel，所以 Panel 每次渲染都会创建一个新元素。如果元素由没有重新渲染的 App 创建，再从外面传进来，Panel 的 state 变化时，React 会看到同一个元素对象。',
      exports: ['Panel'],
      test: async t => {
        t.assert(!/memo/i.test(t.source), '这道题请不要使用 memo 或 useMemo');
        const before = t.text('#heavy');
        await t.click('#toggle');
        t.assert(t.q('#detail'), '点“展开详情”后，应显示详情');
        await t.click('#toggle');
        await t.click('#toggle');
        t.assert(
          t.text('#heavy') === before,
          `展开、收起时 Heavy 仍在重新渲染（${before} → ${t.text('#heavy')}）。Panel 的 state 一变，它自己重新渲染，里面写死的 <Heavy /> 也每次重新创建。请让 Heavy 由 App 创建，再作为 children 传给 Panel`,
        );
        t.assert(t.q('section #heavy'), 'Heavy 应仍显示在 Panel 的 <section> 里面');
        t.assert(t.q('section #toggle'), '按钮应仍在 Panel 的 <section> 里面');
        t.assert(t.qa('#heavy').length === 1, '页面上应只有一个 Heavy');
      },
    },
  ],
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
