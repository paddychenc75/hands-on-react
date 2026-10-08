import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/use-ref.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'use-ref',
  stage: 1,
  title: 'useRef：不触发渲染的“口袋”',
  mins: 26,
  summary: '用 ref 访问 DOM 元素，或保存不需要显示在界面上的可变值。',
  goals: [
    '能用 ref 拿到 DOM 节点（包括自己写的组件里的节点），完成聚焦、测量这类操作',
    '能用 ref 保存定时器 id 这类不需要显示的可变值',
    '能根据“改了之后界面要不要变”，在 ref 和 state 之间做选择',
    '能找出在渲染期间读写 ref.current 的问题',
  ],
  keyPoints: [
    '<code>useRef(初始值)</code> 返回 <code>{ current }</code>。每次渲染拿到的都是同一个对象。',
    '修改 <code>ref.current</code> 不会触发重新渲染。',
    '用途一：把 ref 交给 JSX 的 <code>ref</code> 属性，React 会把 DOM 节点放进 <code>ref.current</code>。React 19 里 ref 是普通 prop，自己的组件取出它再交给 DOM 元素就行。ref 回调可以返回清理函数。',
    '用途二：跨渲染保存不需要显示的值，例如定时器 id。普通变量做不到：每次渲染它都会被重置。',
    '要显示在界面上的值用 state。不要在渲染期间读写 ref.current。',
  ],
  quiz: [
    {
      q: '<code>const ref = useRef(0)</code>。按钮点击时执行 <code>ref.current++</code>，JSX 里显示 <code>{ref.current}</code>。点 3 次后，页面上显示几？',
      options: ['3', '0', '1', '先显示 1，每点一次加 1'],
      answer: 1,
      explain:
        '修改 ref.current 不会触发重新渲染，所以页面一直停在第一次渲染的 0。值其实已经是 3，等别的原因引起重新渲染时才会显示出来。最迷惑的是“3”：ref 的值确实变了，但 React 不知道。',
    },
    {
      q: '下面哪个最适合用 useRef 存储？',
      options: ['购物车商品列表（需要显示）', 'setInterval 返回的定时器 id', '用户输入的搜索词（需要显示）', '当前选中的标签页（决定显示哪一页）'],
      answer: 1,
      explain:
        '定时器 id 只在内部使用，不需要显示，改了也不需要重新渲染。最迷惑的是最后一项：它不显示成文字，但它决定界面显示什么，改了界面必须更新，所以要用 state。',
    },
    {
      q: '把定时器 id 存在组件里的普通变量 <code>let timerId</code> 中。点“开始”后，数字每 100 毫秒更新一次。再点“停止”，为什么停不下来？',
      options: [
        '每次渲染都重新执行组件函数，timerId 变回 undefined',
        'clearInterval 只能在 effect 的清理函数里调用，事件里调用无效',
        '定时器 id 必须用 state 保存',
        '“停止”按钮的点击被定时器挡住了',
      ],
      answer: 0,
      explain:
        '每次 setTime 都会重新渲染，组件函数重新执行，timerId 被重新声明。停止时拿到的是 undefined。最迷惑的是第三项：用 state 也能停下来，但每次存 id 都多一次无用的渲染；ref 正是为这种“幕后数据”准备的。',
    },
    {
      q: "React 19 里，输入框带着 <code>ref={node => { console.log('挂载'); return () => console.log('清理'); }}</code>。输入框从页面上移除时，控制台打印什么？",
      options: ['清理', '挂载', '什么也不打印：只有 useEffect 才有清理', '先打印“挂载”，再打印“清理”'],
      answer: 0,
      explain:
        'React 19 允许 ref 回调返回清理函数。节点从页面移除时，React 调用这个清理函数，所以打印“清理”。React 18 没有这个能力：移除时会再用 null 调用一次 ref 回调。最迷惑的是第三项：ref 回调和 useEffect 一样，可以用返回的函数做清理。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>用 <code>useRef</code> 创建一个 ref，绑定到 <code>&lt;input id="field"&gt;</code>。点击 <b>聚焦</b> 时，让输入框获得焦点。</li><li>再用 <code>useRef</code> 创建一个 ref，保存定时器 id。</li><li>点击 <b>开始</b>：每 100 毫秒把 ticks 加 1。如果定时器已经在跑，就什么也不做。</li><li>点击 <b>停止</b>：用 ref 里的 id 停掉定时器，并把 ref 清空。</li></ol>',
    starter: `import { useState, useRef } from 'react';

function App() {
  const [ticks, setTicks] = useState(0);
  // ① 创建一个 ref，交给输入框
  // ② 创建一个 ref，保存定时器 id

  function start() {
    // 已经在跑就返回；否则启动定时器，并把 id 存进 ref
  }
  function stop() {
    // 用 ref 里的 id 停掉定时器，再把 ref 清空
  }

  return (
    <div>
      <input id="field" />
      <button>聚焦</button>
      <p id="ticks">{ticks}</p>
      <button onClick={start}>开始</button>
      <button onClick={stop}>停止</button>
    </div>
  );
}`,
    solution: `import { useState, useRef } from 'react';

function App() {
  const [ticks, setTicks] = useState(0);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  function start() {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setTicks(t => t + 1), 100);
  }
  function stop() {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  return (
    <div>
      <input id="field" ref={inputRef} />
      <button onClick={() => inputRef.current.focus()}>聚焦</button>
      <p id="ticks">{ticks}</p>
      <button onClick={start}>开始</button>
      <button onClick={stop}>停止</button>
    </div>
  );
}`,
    exports: ['App'],
    hint: '聚焦：把 ref 交给 input 的哪个属性？点击时，DOM 节点在 ref 的哪个字段里？计时：定时器 id 要跨渲染保存，又不需要显示。为什么普通变量不行？',
    faded: `import { useState, useRef } from 'react';

function App() {
  const [ticks, setTicks] = useState(0);
  const inputRef = useRef(null);
  /* ✏️ 再创建一个 ref，用来保存定时器 id */

  function start() {
    if (timerRef.current) return;
    /* ✏️ 启动每 100 毫秒一次的定时器（基于最新值加 1），把 id 存进 ref */
  }
  function stop() {
    /* ✏️ 用 ref 里的 id 停掉定时器 */
    timerRef.current = null;
  }

  return (
    <div>
      <input id="field" ref={inputRef} />
      <button onClick={/* ✏️ 通过 ref 让输入框获得焦点 */}>聚焦</button>
      <p id="ticks">{ticks}</p>
      <button onClick={start}>开始</button>
      <button onClick={stop}>停止</button>
    </div>
  );
}`,
    test: async t => {
      const { React, ReactDOM } = t;
      const b = t.byText('button', '聚焦');
      t.assert(b, '找不到“聚焦”按钮');
      const code = t.source.replace(/^\s*import.*$/gm, '');
      t.assert(/useRef\(/.test(code), '请调用 useRef() 创建 ref');
      t.assert(/<input[^>]*\bref=\{/.test(code), '请把 ref 绑定到 <input> 的 ref 属性');
      t.assert(!/getElementById|querySelector/.test(code), '不要直接查询 DOM。请通过 ref.current 访问');
      b.focus();
      await t.click(b);
      t.assert(document.activeElement === t.q('#field'), '点击“聚焦”后输入框没有获得焦点。点击时调用 ref.current.focus()');
      const n = () => Number(t.text('#ticks'));
      const go = t.byText('button', '开始'),
        halt = t.byText('button', '停止');
      t.assert(go && halt, '需要“开始”和“停止”两个按钮');
      t.assert(n() === 0, '初始应为 0');
      await t.click(go);
      await t.wait(450);
      const a = n();
      t.assert(a >= 3, `点“开始”0.45 秒后应约为 4，实际是 ${a}。start 里要启动定时器：每 100 毫秒把 ticks 加 1`);
      await t.click(halt);
      const s0 = n();
      await t.wait(350);
      t.assert(
        n() === s0,
        `点“停止”后数字还在变（${s0} → ${n()}）。停止时要用 ref 里的 id 调用 clearInterval。如果 id 存在组件里的普通变量中，重新渲染后它就变回了 undefined`,
      );
      await t.click(go);
      await t.click(go);
      const c0 = n();
      await t.wait(520);
      const d = n() - c0;
      // 定时器在跑：它的 id 应该在 App 的某个 ref 里
      const fk = Object.keys(t.q('#ticks')).find(k => k.startsWith('__reactFiber$'));
      let app = fk && t.q('#ticks')[fk];
      while (app && ![0, 11, 15].includes(app.tag)) app = app.return;
      const hooks = [];
      for (let h = app && app.memoizedState; h && typeof h === 'object' && 'next' in h; h = h.next) hooks.push(h);
      const refVals = hooks
        .filter(
          h =>
            !h.queue &&
            h.memoizedState &&
            typeof h.memoizedState === 'object' &&
            !Array.isArray(h.memoizedState) &&
            Object.keys(h.memoizedState).join() === 'current',
        )
        .map(h => h.memoizedState.current);
      const idInRef = refVals.some(v => v != null && v !== false && !(v instanceof Element));
      const extraState = hooks
        .filter(h => h.queue && typeof h.queue.dispatch === 'function')
        .some(h => typeof h.memoizedState === 'number' && h.memoizedState !== n() && h.memoizedState !== n() - 1 && h.memoizedState !== n() + 1);
      t.assert(
        idInRef,
        extraState
          ? '定时器在跑，但 ref 里没有它的 id：id 存在了 state 里。这样也能停下来，但每次存 id 都会多一次无用的重新渲染。id 不需要显示，请用 useRef 保存它：timerRef.current = setInterval(…)'
          : '定时器在跑，但 App 的 ref 里没有它的 id。如果 id 存在组件外面的变量里，页面上有两个秒表时，它们会共用这一个 id，互相干扰。请用 useRef 保存它：timerRef.current = setInterval(…)',
      );
      await t.click(halt);
      const e0 = n();
      await t.wait(300);
      t.assert(d <= 7, `连点两次“开始”后，0.5 秒内加了 ${d}，应约为 5：第二次点击又启动了一个定时器。start 开头先检查 ref 里是否已有 id`);
      t.assert(n() === e0, '连点两次“开始”再点“停止”，数字还在变：有一个定时器没被停掉。start 开头先检查 ref 里是否已有 id');
      // 再渲染一个秒表：两个秒表应该各走各的
      t.assert(typeof t.exports.App === 'function', '请保留名为 App 的组件');
      const box = document.createElement('div');
      const root = ReactDOM.createRoot(box);
      try {
        ReactDOM.flushSync(() => root.render(React.createElement(t.exports.App)));
        const btn2 = txt => [...box.querySelectorAll('button')].find(x => x.textContent.trim() === txt);
        const n2 = () => Number(box.querySelector('#ticks').textContent);
        await t.click(go);
        btn2('开始').click();
        await t.wait(350);
        const m1 = n(),
          m2 = n2();
        btn2('停止').click();
        await t.wait(300);
        const k1 = n() - m1;
        await t.click(halt);
        t.assert(m2 >= 2, '页面上有两个秒表。第一个在跑时，第二个点“开始”没有反应：两个秒表共用了同一个定时器 id。请把 id 存进每个组件自己的 ref');
        t.assert(k1 >= 2, '页面上有两个秒表。停止第二个时，第一个也停了：两个秒表共用了同一个定时器 id。请把 id 存进每个组件自己的 ref');
      } finally {
        root.unmount();
      }
    },
  },
  checkOnly: [
    {
      q: `先点 3 次“+1”，再点 1 次“刷新”。<code>&lt;p&gt;</code> 依次显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const count = useRef(0);
const [, setTick] = useState(0);

&lt;button onClick={() =&gt; { count.current++; }}&gt;+1&lt;/button&gt;
&lt;button onClick={() =&gt; setTick(t =&gt; t + 1)}&gt;刷新&lt;/button&gt;
&lt;p&gt;{count.current}&lt;/p&gt;</code></pre></div>`,
      options: ['点 +1 时一直是 0；点“刷新”后显示 3', '点 +1 时依次显示 1、2、3', '一直是 0，点“刷新”后也是 0', '点“刷新”后显示 1'],
      answer: 0,
      explain:
        '修改 ref.current 不会触发重新渲染，所以点 +1 时界面不变。但 ref 的值在渲染之间会保留，一直在增加。点“刷新”触发重新渲染，这时读到的 count.current 是 3。普通变量做不到这一点：每次渲染都会重新初始化。',
    },
    {
      q: `组件第一次渲染时会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Search() {
  const inputRef = useRef(null);
  inputRef.current.focus();
  return &lt;input ref={inputRef} /&gt;;
}</code></pre></div>`,
      options: ['输入框获得焦点', '报错：current 是 null', '没有效果：ref 会等 DOM 创建好再执行 focus', '每次渲染都调用一次 focus，能用但浪费性能'],
      answer: 1,
      explain:
        '组件函数运行时，React 还没创建 input 的 DOM 节点。ref 要等到提交阶段才被赋值。所以第一次渲染时 <code>inputRef.current</code> 是 null，调用 focus 抛出 TypeError。操作 DOM 要放在 effect 或事件处理函数里：<code>useEffect(() =&gt; { inputRef.current.focus(); }, [])</code>。“ref 会等 DOM 创建好”是误解：ref 不会等待，渲染期间它就是 null。',
    },
  ],
  plays: {
    'ref 操作 DOM': {},
    'ref 作为普通 prop': {
      note: 'React 19 里，FancyInput 直接从 props 里取出 ref，再交给内部的 input。父组件的 inputRef.current 就是那个 input 节点，所以 tagName 是 INPUT。ref 不是 FancyInput 组件本身的什么“实例”，函数组件没有实例。',
      predict: {
        q: '点“ref.current 是什么？”，控制台打印的 tagName 是什么？',
        options: ['INPUT', 'FANCYINPUT', 'null：ref 不能传给自己写的组件', 'undefined'],
        answer: 0,
        explain:
          'FancyInput 把 ref 交给了 input，所以 inputRef.current 是 input 的 DOM 节点，tagName 是 INPUT（大写）。最迷惑的是“null”：那是 React 18 的行为之一，函数组件收不到 ref；React 19 里 ref 是普通 prop，可以直接传。',
      },
      pkey: 'use-ref|ref 作为普通 prop',
    },
    'ref 回调：挂载与清理': {
      note: '输入框挂载时，ref 回调被调用，参数是 input 节点。隐藏输入框时，React 调用回调返回的清理函数，不再用 null 调用回调。点“重新渲染”再试一次：内联箭头函数每次渲染都是新函数，React 先清理旧的，再挂载新的。',
      predict: {
        q: '页面刚运行时，控制台有一行“挂载：INPUT”。点一次“隐藏输入框”，控制台新增什么？',
        options: ['清理：节点离开页面', '挂载：null', '什么也不新增：ref 回调只在挂载时调用', '先“清理”，再“挂载：null”'],
        answer: 0,
        explain:
          'React 19 里，ref 回调返回了清理函数，节点移除时只调用清理函数。最迷惑的是“挂载：null”：React 18 在移除时会用 null 再调用一次 ref 回调，所以那时回调里要判断 node 是否为空；回调返回清理函数之后，这个调用就没有了。',
      },
      pkey: 'use-ref|ref 回调：挂载与清理',
    },
    '用 ref 保存定时器 id 的秒表': {
      note: '渲染次数跟着时间一起增加：每 0.1 秒调用一次 setTime，每次都重新渲染。存定时器 id 的 timerRef 不会触发渲染，点“开始”和“停止”本身也不改 state。',
      predict: {
        q: '点“开始”，过 1 秒再点“停止”。灰色那行“组件已渲染 N 次”会怎样变？',
        options: ['一直不变：ref 的变化不会触发渲染', '大约增加 10 次', '只增加 2 次：点“开始”和点“停止”各一次', '大约增加 20 次'],
        answer: 1,
        explain:
          '每 0.1 秒调用一次 setTime，time 是 state，每次都会重新渲染，1 秒约 10 次。最迷惑的是第一项：存定时器 id 的 timerRef 确实不触发渲染，但渲染来自 setTime。点“开始”和“停止”本身不改 state。',
      },
      pkey: 'use-ref|用 ref 保存定时器 id 的秒表',
    },
  },
} satisfies Lesson;
