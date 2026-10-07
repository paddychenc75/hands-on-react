import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/state.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'state',
  stage: 0,
  title: 'State：让组件“记住”东西',
  mins: 22,
  summary: '用 useState 保存会变化的数据，理解为什么普通变量不行。',
  goals: [
    '能用 useState 声明 state，并在事件处理函数里调用 set 函数更新它',
    '能解释为什么修改普通变量不会更新界面',
    '能预测连续调用 set 函数后的结果，并在需要时改用函数式更新',
    '能写出对象和数组的不可变更新',
  ],
  keyPoints: [
    '普通变量不行：修改它不会通知 React；而且每次渲染时，它都会被重新初始化。',
    '<code>const [count, setCount] = useState(0)</code>：React 替你保存值。调用 set 函数，React 就会重新渲染。',
    '一次渲染 = 一张快照：调用 set 函数后，本次渲染里的 count 不会变，新值在下一次渲染才看到。',
    '新值依赖旧值时，用函数式更新 <code>setCount(c =&gt; c + 1)</code>。React 会按队列依次用最新值计算。',
    '对象和数组要换成新的（<code>{ ...user, age: 19 }</code>、<code>[...tags, x]</code>）。直接修改原来的，引用没变，界面不会更新。',
  ],
  quiz: [
    {
      q: 'count 为 0。点击时执行 setCount(count + 1); setCount(c => c + 1);，渲染后 count 是？',
      options: ['2', '1', '3', '0'],
      answer: 0,
      explain: '第一次请求“替换为 1”。第二次传的是函数，它在队列里拿到最新值 1，再加 1，所以是 2。最容易误选的是 1：第二次调用不读本次渲染的 count，而是读队列里的值。',
    },
    {
      q: '以下哪种更新对象 state 的方式能让界面更新？',
      options: [
        'user.name = "a"; setUser(user)',
        'setUser({ ...user, name: "a" })',
        'Object.assign(user, { name: "a" }); setUser(user)',
        'setUser(user); user.name = "a"',
      ],
      answer: 1,
      explain: '必须传入一个新对象。React 用 Object.is 比较新旧值，引用相同就判定“没变”，跳过更新。第三项最迷惑：name 确实改了，但改的是原对象，传回去的还是同一个引用。',
    },
    {
      q: '在组件里写 <code>let count = 0</code>，点击时执行 <code>count = count + 1</code>。为什么界面不变？',
      options: [
        '修改它不通知 React；就算重新渲染，它也会被重置为 0',
        'React 会重新渲染，但新值要等下一次点击才显示',
        '修改成功了，只是浏览器需要刷新才显示',
        'let 声明的变量在组件里是只读的',
      ],
      answer: 0,
      explain: '组件函数每次渲染都重新执行，局部变量会重置。修改它也不会通知 React。最容易误选的是第二项：那描述的是 state 的“快照”行为，而普通变量根本不会触发渲染。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>声明一个 state <code>count</code>，初始值为 0。</li><li>在 <code>&lt;span id="count"&gt;</code> 中显示 count。</li><li>点击按钮 <b>+1</b> 时，count 加 1。</li><li>点击按钮 <b>-1</b> 时，count 减 1。</li><li>点击按钮 <b>+3</b> 时，count 加 3。快速连点时结果也要正确。</li><li>建议这样写 +3：在处理函数里调用三次 <code>setCount</code>，每次加 1。想一想：哪种写法能让三次调用都生效？</li></ol>',
    starter: `import { useState } from 'react';

function App() {
  // 声明 count 状态

  return (
    <div>
      <button>-1</button>
      <span id="count">0</span>
      <button>+1</button>
      <button>+3</button>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c => c - 1)}>-1</button>
      <span id="count">{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <button onClick={() => {
        setCount(c => c + 1);
        setCount(c => c + 1);
        setCount(c => c + 1);
      }}>+3</button>
    </div>
  );
}`,
    hint: 'useState 返回两个值：一个用来显示，一个用来在点击时更新。+3 连续更新三次：每次都要基于最新值，该用哪种写法？',
    faded: `import { useState } from 'react';

function App() {
  /* ✏️ 声明 count 和它的 set 函数，初始值为 0 */
  return (
    <div>
      <button onClick={() => setCount(c => c - 1)}>-1</button>
      <span id="count">{/* ✏️ 显示 count */}</span>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <button onClick={() => {
        /* ✏️ 调用三次 set 函数，每次都基于最新值加 1 */
      }}>+3</button>
    </div>
  );
}`,
    test: async (t) => {
      const c = () => t.text('#count');
      t.assert(t.q('#count'), '找不到 id="count" 的元素');
      t.assert(c() === '0', '初始值应为 0');
      const plus = t.byText('button', '+1'), minus = t.byText('button', '-1');
      t.assert(plus && minus, '需要文字为 +1 和 -1 的两个按钮');
      await t.click(plus); await t.click(plus); await t.click(plus);
      t.assert(c() === '3', `点 3 次 +1 后应为 3，实际是 ${c()}`);
      await t.click(minus);
      t.assert(c() === '2', `再点一次 -1 后应为 2，实际是 ${c()}`);
      const plus3 = t.byText('button', '+3'); t.assert(plus3, '需要文字为 +3 的按钮');
      await t.click(plus3);
      t.assert(c() === '5', `点 +3 后应从 2 变成 5，实际是 ${c()}。连续调用三次 setCount(count + 1) 时，三次读到的是同一个 count。请用函数式更新 setCount(c => c + 1)`);
      // 同一轮里连点两次：第二次点击时 React 还没重新渲染。只有基于最新值的更新才能得到 11
      plus3.click(); plus3.click();
      await t.wait(60);
      t.assert(c() === '11', `快速连点两次 +3，应从 5 变成 11，实际是 ${c()}。第二次点击时，处理函数读到的还是旧的 count。每次加 1 都要基于最新值：setCount(c => c + 1)`);
    },
  },
  checkOnly: [
    {
      q: `n 为 0。点击一次按钮后，界面显示几？控制台打印几？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [n, setN] = useState(0);

function handle() {
  setN(n + 5);
  setN(m =&gt; m * 2);
  console.log(n);
}</code></pre></div>`,
      options: ['显示 10，打印 0', '显示 10，打印 10', '显示 5，打印 0', '显示 10，打印 5'],
      answer: 0,
      explain: 'React 按顺序处理更新队列：<ol class="task-steps"><li><code>setN(n + 5)</code>：这次渲染的 n 是 0，所以设为 5。</li><li><code>m =&gt; m * 2</code>：拿到上一步的 5，得到 10。</li></ol>console.log 读的是这次渲染的快照，n 仍是 0。',
    },
    {
      q: `在姓名输入框里输入“a”。下面的 <code>&lt;p&gt;</code> 显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [form, setForm] = useState({ name: '', email: 'a@b.c' });

&lt;input
  value={form.name}
  onChange={e =&gt; setForm({ name: e.target.value })}
/&gt;
&lt;p&gt;{form.email}&lt;/p&gt;</code></pre></div>`,
      options: ['空白：email 没有了', 'a@b.c：set 函数会把新对象合并进旧对象', '报错：缺少 email 字段', 'a@b.c，但输入框里打不进字'],
      answer: 0,
      explain: 'useState 的 set 函数用新值<b>替换</b>旧值，不做合并。新对象只有 name，email 变成 undefined，所以 p 什么都不显示。修复：<code>setForm({ ...form, name: e.target.value })</code>。“会合并”来自 class 组件的 <code>this.setState</code>，它会浅合并；函数组件的 set 函数不会。',
    },
  ],
  plays: {
    '失败的计数器': {
      note: '点几下按钮，看看下方控制台：变量确实增加了，但界面没变。',
      predict: {
        q: '连续点击按钮 3 次后，按钮上显示的数字是多少？',
        options: ['3', '0', '1', '报错'],
        answer: 1,
        explain: '修改普通变量不会通知 React 重新渲染，所以界面一直停在第一次渲染的 0。控制台里变量其实在增加。',
      },
      pkey: 'state|失败的计数器',
    },
    '正确的计数器': {},
    '快照 vs 函数式更新': {
      note: '写法 A 只加了 1。这次渲染里 count 是 0，三次调用都在请求“设为 1”。控制台也打印 0：调用 set 函数后，本次渲染里的 count 没有变。写法 B 传入的是函数，React 按队列依次计算：0 → 1 → 2 → 3。',
      predict: {
        q: '点一次“+3（写法 A）”后，count 会变成几？',
        options: ['3', '1', '0', '6'],
        answer: 1,
        explain: '这次渲染里 count 始终是 0，三次调用都在请求“设为 1”。函数式更新才会基于最新值累加。',
      },
      pkey: 'state|快照 vs 函数式更新',
    },
    '不可变更新': {},
  },
} satisfies Lesson;
