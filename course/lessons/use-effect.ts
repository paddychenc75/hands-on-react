import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/use-effect.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'use-effect',
  stage: 1,
  title: 'useEffect 与副作用',
  mins: 28,
  summary: '让组件与外部世界同步：定时器、网络请求、订阅、修改标题。',
  goals: [
    '能说出 effect 的用途：让组件与外部系统保持同步',
    '能根据 effect 读到的值写出依赖数组，并预测它什么时候重新同步',
    '能写出清理函数，停止上一次的同步',
    '能判断一个需求该用 effect，还是该在渲染时计算或写进事件处理函数',
  ],
  keyPoints: [
    'effect 让组件与外部系统（定时器、网络请求、订阅、document.title）保持同步。它在渲染提交到页面之后运行。',
    '每个 effect 回答两个问题：怎样开始同步（函数体）？怎样停止同步（返回的清理函数）？',
    '依赖数组由 effect 读到的 props 和 state 决定，不是你挑的。依赖变了，React 先运行清理函数停止旧的同步，再运行 effect 开始新的同步。',
    '<code>[]</code> 的意思是“effect 不读任何会变的值”，不是“我想只执行一次”。漏写依赖，effect 会一直读到旧值。',
    '能在渲染时算出来的值、由用户操作引起的逻辑，都不需要 effect。',
  ],
  quiz: [
    {
      q: '<code>useEffect(fn, [])</code> 里的 fn 什么时候运行？',
      options: ['每次渲染后都运行', '第一次渲染后运行，之后不再重新同步', '组件从页面上消失时运行，用来做收尾工作', '只在你手动调用 fn() 时运行'],
      answer: 1,
      explain:
        '空数组表示 effect 不读任何会变的值，所以同步一次就够了（开发环境的严格模式会额外多做一轮“开始 → 停止 → 开始”）。最迷惑的是第三项：组件消失时运行的是 fn 返回的清理函数，不是 fn 本身。',
    },
    {
      q: 'effect 用 roomId 连接聊天室，返回的清理函数会断开连接，依赖写 <code>[roomId]</code>。roomId 从 "a" 变成 "b" 时，会发生什么？',
      options: ['先断开 "a"，再连接 "b"', '先连接 "b"，再断开 "a"', '只连接 "b"；"a" 要等组件消失才断开', '什么都不发生，effect 已经运行过了'],
      answer: 0,
      explain:
        '依赖变了，React 先运行上一次的清理函数，停止旧的同步；再运行 effect，开始新的同步。最迷惑的是第三项：如果清理只在组件消失时运行，切换房间后会同时连着两个房间。',
    },
    {
      q: '清理函数会在什么时候运行？',
      options: ['只在组件从页面上消失、被卸载的时候', '每次重新同步之前，以及组件消失时', '每次渲染之前', '浏览器刷新页面时'],
      answer: 1,
      explain:
        '依赖变化、effect 重新运行之前，React 会先清理上一次的同步；组件消失时也会清理。最迷惑的是第一项：只记住“卸载时清理”，就会漏掉依赖变化时的清理。',
    },
    {
      q: 'fullName 由 firstName 和 lastName 拼接而成，最好怎么写？',
      options: [
        '用 useEffect 监听两者，再调用 setFullName',
        '渲染时直接计算 const fullName = first + " " + last',
        '再加一个 fullName state，在两个输入框的 onChange 里都更新它',
        '用 useEffect 计算，依赖写 [] 只算一次',
      ],
      answer: 1,
      explain:
        '能从现有 props 和 state 算出来的值，直接在渲染时计算。最迷惑的是第一项：它能工作，但每次都先用旧的 fullName 完整渲染一遍，再马上渲染第二遍。第三项多出一份要手动保持一致的 state。',
    },
    {
      q: '应用包在 <code>&lt;StrictMode&gt;</code> 里，在开发环境运行。effect 里写了 <code>setInterval(() =&gt; setN(n =&gt; n + 1), 1000)</code>，没有返回清理函数。数字大约怎么变化？',
      options: ['每秒加 1', '每秒加 2', '每秒加 1，但组件卸载后还会继续', '不增加：严格模式会阻止定时器'],
      answer: 1,
      explain:
        '严格模式做了“开始 → 停止 → 再开始”。第一个定时器没有被清理函数停掉，第二轮又启动了一个，两个定时器一起加，每秒加 2。生产环境只有一个定时器，每秒加 1。最迷惑的是第三项：卸载后继续运行确实是没有清理的后果，但开发环境里更早暴露的是数字加得太快。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>在 <code>useEffect</code> 中调用 <code>setInterval</code>，每秒把 seconds 加 1。</li><li>在清理函数中调用 <code>clearInterval</code>，停掉这个定时器。</li><li>在 <code>&lt;p id="seconds"&gt;</code> 中显示 seconds，从 0 开始。</li><li>检查时，你的 App 还会在严格模式下运行一次。React 会做“开始 → 停止 → 再开始”，只有清理函数真的停掉了定时器，数字才会正确。</li></ol>',
    starter: `import { useState, useEffect } from 'react';

function App() {
  const [seconds, setSeconds] = useState(0);

  // 在这里写 useEffect

  return <p id="seconds">{seconds}</p>;
}`,
    solution: `import { useState, useEffect } from 'react';

function App() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return <p id="seconds">{seconds}</p>;
}`,
    hint: '想两件事：怎样开始同步（启动定时器）？怎样停止同步（清理函数返回什么）？定时器回调里，怎样基于最新值加 1？',
    exports: ['App'],
    faded: `import { useState, useEffect } from 'react';

function App() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    /* ✏️ 开始同步：启动每秒一次的定时器，基于最新值把 seconds 加 1，记下它的 id */
    /* ✏️ 停止同步：返回一个清理函数，用这个 id 停掉定时器 */
  }, [/* ✏️ 这个 effect 读了哪些会变的值？ */]);

  return <p id="seconds">{seconds}</p>;
}`,
    test: async t => {
      const { React, ReactDOM } = t;
      t.assert(t.text('#seconds') === '0', '初始应为 0');
      t.assert(typeof t.exports.App === 'function', '请保留名为 App 的组件');
      // 另开一个严格模式的根：React 会做“开始 → 停止 → 再开始”。清理函数没停掉第一个定时器，就会有两个定时器一起加
      const box = document.createElement('div');
      const root = ReactDOM.createRoot(box);
      ReactDOM.flushSync(() => root.render(React.createElement(React.StrictMode, null, React.createElement(t.exports.App))));
      try {
        await t.wait(2500);
        const v = Number(t.text('#seconds'));
        const sv = Number((box.querySelector('#seconds') || {}).textContent);
        t.assert(v !== 0, '2.5 秒后还是 0。定时器启动了吗？请在 useEffect 里调用 setInterval');
        t.assert(
          v !== 1,
          '2.5 秒后应为 2，实际一直是 1：每秒都在执行 setSeconds(0 + 1)。定时器回调记住的是第一次渲染的 seconds。请用函数式更新 setSeconds(s => s + 1)',
        );
        t.assert(v >= 2 && v <= 3, `2.5 秒后应为 2，实际是 ${v}。是不是同时启动了不止一个定时器？`);
        t.assert(
          sv === 2,
          `在严格模式下，2.5 秒后应为 2，实际是 ${sv}。React 做了“开始 → 停止 → 再开始”，但第一个定时器没有被停掉，两个定时器在一起加。请让 effect 返回清理函数：return () => clearInterval(id)`,
        );
        // 卸载这个根，再等 1.2 秒：定时器如果还在跑，就会继续调用 App 的 set 函数
        const ck = Object.keys(box).find(k => k.startsWith('__reactContainer$'));
        let app = null;
        const find = f => {
          for (; f && !app; f = f.sibling) {
            if (f.type === t.exports.App) app = f;
            else find(f.child);
          }
        };
        find(ck && box[ck]);
        const queues = [];
        for (let h = app && app.memoizedState; h; h = h.next) if (h.queue && typeof h.queue.dispatch === 'function') queues.push(h.queue);
        let calls = 0;
        const before = queues.map(q => {
          const r = q.lastRenderedReducer;
          q.lastRenderedReducer = function () {
            calls++;
            return r.apply(this, arguments);
          };
          return [q.interleaved, q.pending];
        });
        root.unmount();
        await t.wait(1200);
        const moved = queues.some((q, i) => q.interleaved !== before[i][0] || q.pending !== before[i][1]);
        t.assert(
          !calls && !moved,
          '组件卸载 1.2 秒后，定时器还在调用 setSeconds：卸载时它没有被停掉。在启动前清除旧定时器不够，组件消失时也要停止同步。请让 effect 返回清理函数：return () => clearInterval(id)',
        );
      } finally {
        root.unmount();
      }
    },
  },
  checkOnly: [
    {
      q: `roomId 从 'a' 变成 'b'。变化后，控制台按顺序新增哪些输出？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">useEffect(() =&gt; {
  console.log('连接', roomId);
  return () =&gt; console.log('断开', roomId);
}, [roomId]);</code></pre></div>`,
      options: ['断开 b，连接 b', '断开 a，连接 b', '连接 b，断开 a', '只有 连接 b'],
      answer: 1,
      explain:
        "依赖变化后，React 先运行<b>上一次</b> effect 的清理函数，再运行新的 effect。清理函数是上一次渲染创建的，它记住的 roomId 是 'a'。所以先“断开 a”，再“连接 b”。",
    },
    {
      q: `应用包在 <code>&lt;StrictMode&gt;</code> 里，在开发环境运行。组件挂载后，按一次 Enter 键，count 怎么变化？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [count, setCount] = useState(0);

useEffect(() =&gt; {
  function onKey(e) {
    if (e.key === 'Enter') setCount(c =&gt; c + 1);
  }
  window.addEventListener('keydown', onKey);
}, []);</code></pre></div>`,
      options: ['加 1', '加 2', '加 1：浏览器会忽略重复添加的监听器', '报错：effect 添加了监听器，就必须返回清理函数'],
      answer: 1,
      explain:
        "严格模式在开发环境中会挂载、卸载、再挂载一次组件，用来检查清理是否正确。effect 运行了两次，每次都新建一个 onKey 函数并添加到 window。这里没有清理函数，第一个监听器没被移除。于是按一次 Enter，两个监听器各加 1，一共加 2。最迷惑的是“浏览器会忽略重复添加”：这只对<b>同一个</b>函数成立，这里两次是不同的函数。修复：在 effect 里 <code>return () =&gt; window.removeEventListener('keydown', onKey);</code>。生产环境只加 1，但组件卸载后监听器仍在。",
    },
    {
      q: `代码评审时，你会怎样评价这段代码？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [visible, setVisible] = useState([]);

useEffect(() =&gt; {
  setVisible(items.filter(i =&gt; i.type === filter));
}, [items, filter]);

return &lt;List items={visible} /&gt;;</code></pre></div>`,
      options: [
        '会无限循环：effect 里调用 set 函数会触发渲染，渲染又触发 effect',
        '依赖数组漏了 setVisible',
        '没问题，这是派生数据的标准写法',
        '多一轮渲染：先用旧结果渲染一遍；应在渲染时直接计算',
      ],
      answer: 3,
      explain:
        'visible 可以由 items 和 filter 算出，不需要 state，也不需要 effect。现在的流程是：先用旧的 visible 渲染一遍，effect 再设置新值，又渲染一次。直接写 <code>const visible = items.filter(…)</code> 即可；计算很慢时再用 useMemo。“无限循环”不对：依赖是 items 和 filter，setVisible 不会改变它们，所以 effect 不会反复执行。set 函数是稳定的，不需要写进依赖。',
    },
  ],
  plays: {
    '观察三种 effect 的执行时机': {
      note: '在输入框打字时，只有 ① 会运行：打字改变的是 name。① 没有依赖数组，每次渲染后都重新同步；② 不读任何会变的值，第一次渲染后同步一次就够了；③ 只读 count，count 没变，就不重新同步。点按钮时 ① 和 ③ 运行。',
      predict: {
        q: '在输入框里打一个字，控制台里会出现哪些 effect 的输出？',
        options: ['① 和 ③', '只有 ①', '①、② 和 ③', '都不会'],
        answer: 1,
        explain:
          '打字改变的是 name。① 没有依赖数组，每次渲染后都运行；② 不读任何会变的值，第一次渲染后同步一次就够了；③ 只读 count，count 没变，就不重新同步。',
      },
      pkey: 'use-effect|观察三种 effect 的执行时机',
    },
    '严格模式：开始 → 停止 → 再开始': {
      note: '点“进入房间”，StrictMode 随 Room 一起出现，React 把 effect 多做了一轮：连接 a、断开 a、再连接 a。这是检查清理函数是否真的能停止同步。再点“离开”，Room 卸载，打印最后一次“断开 a”。',
      predict: {
        q: '点一次“进入房间”，控制台依次打印什么？',
        options: ['连接 a', '连接 a、连接 a', '连接 a、断开 a、连接 a', '断开 a、连接 a'],
        answer: 2,
        explain:
          '严格模式在开发环境把组件第一次挂载时的 effect 多做一轮：开始 → 停止 → 再开始。所以是“连接 a、断开 a、连接 a”。最迷惑的是“连接 a、连接 a”：那是清理函数不存在或写得不对时的后果，不是 React 的做法；React 一定先运行清理函数，再开始新的同步。',
      },
      pkey: 'use-effect|严格模式：开始 → 停止 → 再开始',
    },
    定时器的启动与清理: {},
    带竞态处理的数据请求: {
      note: '试着快速连续点击不同用户，结果始终和选中的按钮一致。',
    },
  },
} satisfies Lesson;
