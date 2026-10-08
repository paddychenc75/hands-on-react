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
      // 定时器在跑：它的 id 应该在 App 的某个 ref 里。
      // 依赖 React 19.3.x 的 fiber 结构（经 t.internals：componentOf / hooksOf / refValues）；结构不认识时跳过这一条，
      // 下面“两个秒表各走各的”的行为断言仍会发现 id 存在组件外面的写法
      const inter = t.internals;
      const tickFiber = inter.fiberOf(t.q('#ticks'));
      const app = tickFiber && inter.componentOf(tickFiber);
      const hooks = app ? inter.hooksOf(app) : null;
      const refVals = app ? inter.refValues(app) : null;
      if (hooks && refVals) {
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
      }
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
  drills: [
    {
      title: '记住上一次渲染时的值',
      task: '<ol class="task-steps"><li>页面显示“现在”的 <code>count</code>，还要显示“上一次”：上一次渲染时 <code>count</code> 是多少。第一次渲染时显示“无”。</li><li>用 <code>useRef</code> 记住上一次的值，在 <code>useEffect</code> 里更新它。不要把它存成 state。</li><li>结果：连点两次“加 1”，现在是 2，上一次是 1。点“刷新”会重新渲染但 count 没变，所以上一次会变得和现在一样。</li><li>点一次“加 1”只能重新渲染一次。</li></ol>',
      starter: `import { useState, useRef, useEffect } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const [, setTick] = useState(0);
  // 在这里记住上一次渲染时的 count

  return (
    <div>
      <p>现在：<b id="now">{count}</b></p>
      <p>上一次：<b id="prev">{'无'}</b></p>
      <button onClick={() => setCount(count + 1)}>加 1</button>
      <button onClick={() => setTick(t => t + 1)}>刷新</button>
    </div>
  );
}`,
      solution: `import { useState, useRef, useEffect } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const [, setTick] = useState(0);
  const prevRef = useRef(undefined);
  const prev = prevRef.current;

  useEffect(() => {
    prevRef.current = count;
  });

  return (
    <div>
      <p>现在：<b id="now">{count}</b></p>
      <p>上一次：<b id="prev">{prev === undefined ? '无' : prev}</b></p>
      <button onClick={() => setCount(count + 1)}>加 1</button>
      <button onClick={() => setTick(t => t + 1)}>刷新</button>
    </div>
  );
}`,
      hint: '渲染时先读 <code>ref.current</code>，那就是上一次渲染留下的值。渲染结束后，在 effect 里再把当前的 count 写进 ref。ref 改变不会触发重新渲染，所以界面这一次显示的还是旧值。',
      exports: ['App'],
      test: async t => {
        const { React, ReactDOM } = t;
        t.assert(typeof t.exports.App === 'function', '请保留名为 App 的组件');
        const box = document.createElement('div');
        document.body.appendChild(box);
        const root = ReactDOM.createRoot(box);
        let commits = 0;
        const onRender = () => {
          commits++;
        };
        try {
          ReactDOM.flushSync(() => root.render(React.createElement(React.Profiler, { id: 'drill', onRender }, React.createElement(t.exports.App))));
          await t.wait(40);
          const now = () => box.querySelector('#now').textContent.trim();
          const prev = () => box.querySelector('#prev').textContent.trim();
          const btn = name => [...box.querySelectorAll('button')].find(b => b.textContent.trim() === name);
          const press = async name => {
            btn(name).click();
            await t.wait(60);
          };
          t.assert(
            prev() === '无',
            '第一次渲染时“上一次”应显示“无”，实际是“' +
              prev() +
              '”。第一次渲染时还没有上一次，如果这里就有值，说明读到的已经是当前这次渲染的值：记录“上一次”要等渲染结束后再做。',
          );
          const hasProfiler = commits > 0;
          let before = commits;
          await press('加 1');
          t.assert(now() === '1', '点“加 1”后现在应为 1，实际是 ' + now() + '。');
          t.assert(
            prev() === '0',
            '点一次“加 1”后，上一次应显示 0，实际是“' + prev() + '”。如果显示的是新值，说明记录“上一次”这件事本身引起了重新渲染，或者每次渲染都被重置了。',
          );
          if (hasProfiler) {
            t.assert(
              commits - before === 1,
              '点一次“加 1”重新渲染了 ' + (commits - before) + ' 次，应只有 1 次。记住上一次的值不需要显示在界面上，存进 ref 不会触发渲染。',
            );
          }
          await press('加 1');
          t.assert(now() === '2' && prev() === '1', '再点一次后应是现在 2、上一次 1，实际是现在 ' + now() + '、上一次 ' + prev() + '。');
          before = commits;
          await press('刷新');
          t.assert(
            now() === '2' && prev() === '2',
            '点“刷新”后 count 没变，上一次渲染时它也是 2，所以应是现在 2、上一次 2，实际是现在 ' + now() + '、上一次 ' + prev() + '。',
          );
          await press('加 1');
          t.assert(now() === '3' && prev() === '2', '再点“加 1”应是现在 3、上一次 2，实际是现在 ' + now() + '、上一次 ' + prev() + '。');
        } finally {
          root.unmount();
          box.remove();
        }
      },
    },
    {
      title: '计数不触发渲染',
      task: '<ol class="task-steps"><li>页面有两个按钮：“记一次”和“显示次数”。现在每点“记一次”，组件都会重新渲染一次。</li><li>这个累计次数平时不需要显示，只在点“显示次数”时才亮出来。把它改成不触发渲染的存法。</li><li>结果：连点“记一次”，组件不重新渲染，<code>已显示</code> 也不变；点“显示次数”，<code>已显示</code> 变成累计次数。</li><li>再点几次“记一次”，再点“显示次数”，累计要接着上次算，不是从 0 重来。</li></ol>',
      starter: `import { useState } from 'react';

function App() {
  const [clicks, setClicks] = useState(0);
  const [shown, setShown] = useState(0);

  return (
    <div>
      <button onClick={() => setClicks(clicks + 1)}>记一次</button>
      <button onClick={() => setShown(clicks)}>显示次数</button>
      <p>已显示：<b id="shown">{shown}</b></p>
    </div>
  );
}`,
      solution: `import { useState, useRef } from 'react';

function App() {
  const clicksRef = useRef(0);
  const [shown, setShown] = useState(0);

  return (
    <div>
      <button onClick={() => { clicksRef.current += 1; }}>记一次</button>
      <button onClick={() => setShown(clicksRef.current)}>显示次数</button>
      <p>已显示：<b id="shown">{shown}</b></p>
    </div>
  );
}`,
      hint: '这个次数需要跨渲染保留，但点“记一次”时界面不需要变。普通变量每次渲染都会重新初始化，state 每次修改都会重新渲染。哪一种存法两者都满足？',
      exports: ['App'],
      test: async t => {
        const { React, ReactDOM } = t;
        t.assert(typeof t.exports.App === 'function', '请保留名为 App 的组件');
        const mount = () => {
          const box = document.createElement('div');
          document.body.appendChild(box);
          const root = ReactDOM.createRoot(box);
          const rec: any = { commits: 0, box, root };
          ReactDOM.flushSync(() =>
            root.render(
              React.createElement(
                React.Profiler,
                {
                  id: 'drill',
                  onRender: () => {
                    rec.commits++;
                  },
                },
                React.createElement(t.exports.App),
              ),
            ),
          );
          rec.press = async name => {
            [...box.querySelectorAll('button')].find(b => b.textContent.trim() === name).click();
            await t.wait(50);
          };
          rec.shown = () => box.querySelector('#shown').textContent.trim();
          return rec;
        };
        const a = mount();
        try {
          await t.wait(40);
          t.assert(a.shown() === '0', '一开始“已显示”应为 0，实际是“' + a.shown() + '”。');
          const hasProfiler = a.commits > 0;
          const before = a.commits;
          for (let i = 0; i < 5; i++) await a.press('记一次');
          if (hasProfiler) {
            t.assert(
              a.commits === before,
              '连点 5 次“记一次”，组件重新渲染了 ' +
                (a.commits - before) +
                ' 次，应为 0 次。累计次数不用显示，不要放进 state：用 useRef，修改 ref.current 不会触发重新渲染。',
            );
          }
          t.assert(a.shown() === '0', '只点“记一次”时“已显示”不该变，实际是“' + a.shown() + '”。点“显示次数”才把累计次数亮出来。');
          await a.press('显示次数');
          t.assert(a.shown() === '5', '点了 5 次“记一次”再点“显示次数”，应显示 5，实际是“' + a.shown() + '”。');
          for (let i = 0; i < 3; i++) await a.press('记一次');
          await a.press('显示次数');
          t.assert(
            a.shown() === '8',
            '重新渲染之后又点了 3 次“记一次”，累计应是 8，实际是“' +
              a.shown() +
              '”。如果用普通变量保存，每次渲染都会把它重新初始化成 0。要用 useRef，它在渲染之间保留。',
          );
          // 再渲染一个：两份各算各的
          const b = mount();
          try {
            await t.wait(40);
            await b.press('记一次');
            await b.press('记一次');
            await b.press('显示次数');
            t.assert(
              b.shown() === '2',
              '另一份 App 点了 2 次“记一次”，应显示 2，实际是“' + b.shown() + '”。次数被存在了组件外面，所有 App 共用。请把它存进每个组件自己的 ref。',
            );
          } finally {
            b.root.unmount();
            b.box.remove();
          }
        } finally {
          a.root.unmount();
          a.box.remove();
        }
      },
    },
    {
      title: '聚焦与滚动',
      task: '<ol class="task-steps"><li>页面有一个消息列表 <code>#box</code>（固定高度，内容超出会出现滚动条）、一个输入框和三个按钮。</li><li>点“发送”后，新消息加进列表，输入框清空，并且<b>输入框要重新获得焦点</b>，方便接着输入。</li><li>点“到最新”，让列表滚到最底部；点“回到顶部”，让列表滚回最上面。</li><li>用 <code>useRef</code> 拿到 DOM 节点，在事件处理函数里操作。不要用 <code>document.getElementById</code> 之类的查询。</li></ol>',
      starter: `import { useState } from 'react';

const INIT = Array.from({ length: 12 }, (_, i) => '第 ' + (i + 1) + ' 条消息');

function App() {
  const [msgs, setMsgs] = useState(INIT);
  const [text, setText] = useState('');

  function send(e) {
    e.preventDefault();
    if (!text) return;
    setMsgs([...msgs, text]);
    setText('');
  }

  return (
    <div>
      <ul id="box" style={{ height: 80, overflow: 'auto', margin: 0 }}>
        {msgs.map((m, i) => <li key={i}>{m}</li>)}
      </ul>
      <form onSubmit={send}>
        <input id="msg" value={text} onChange={e => setText(e.target.value)} />
        <button>发送</button>
      </form>
      <button type="button">到最新</button>
      <button type="button">回到顶部</button>
    </div>
  );
}`,
      solution: `import { useState, useRef } from 'react';

const INIT = Array.from({ length: 12 }, (_, i) => '第 ' + (i + 1) + ' 条消息');

function App() {
  const [msgs, setMsgs] = useState(INIT);
  const [text, setText] = useState('');
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  function send(e) {
    e.preventDefault();
    if (!text) return;
    setMsgs([...msgs, text]);
    setText('');
    inputRef.current.focus();
  }

  return (
    <div>
      <ul id="box" ref={boxRef} style={{ height: 80, overflow: 'auto', margin: 0 }}>
        {msgs.map((m, i) => <li key={i}>{m}</li>)}
      </ul>
      <form onSubmit={send}>
        <input id="msg" ref={inputRef} value={text} onChange={e => setText(e.target.value)} />
        <button>发送</button>
      </form>
      <button type="button" onClick={() => { boxRef.current.scrollTop = boxRef.current.scrollHeight; }}>到最新</button>
      <button type="button" onClick={() => { boxRef.current.scrollTop = 0; }}>回到顶部</button>
    </div>
  );
}`,
      hint: '两个 DOM 节点各要一个 ref：输入框用 <code>inputRef.current.focus()</code>，列表用 <code>boxRef.current.scrollTop</code>。滚到底部就是把 scrollTop 设成 scrollHeight。这些都是事件处理函数里的命令式操作，不要放在渲染期间。',
      exports: ['App'],
      test: async t => {
        const box = () => t.q('#box');
        const btn = name => t.byText('button', name);
        t.assert(box() && t.q('#msg') && btn('发送') && btn('到最新') && btn('回到顶部'), '请保留列表 #box、输入框 #msg 和“发送”“到最新”“回到顶部”三个按钮。');
        t.assert(box().scrollHeight > box().clientHeight + 10, '列表高度应固定且内容超出（出现滚动条）。请保留 #box 的 style。');
        const until = async (cond, ms = 800) => {
          for (let w = 0; w < ms && !cond(); w += 50) await t.wait(50);
          return cond();
        };
        const atBottom = () => box().scrollTop + box().clientHeight >= box().scrollHeight - 2;
        t.assert(box().scrollTop === 0, '一开始列表应在最上面。');
        await t.click(btn('到最新'));
        t.assert(await until(atBottom), '点“到最新”后列表没有滚到最底部。请通过 ref 拿到列表节点，设置它的 scrollTop，或者对最后一项调用 scrollIntoView。');
        await t.click(btn('回到顶部'));
        t.assert(await until(() => box().scrollTop === 0), '点“回到顶部”后列表没有回到最上面。');
        await t.type('#msg', '你好');
        btn('发送').focus();
        t.assert(document.activeElement === btn('发送'), '检查环境没能让“发送”按钮获得焦点，请再试一次。');
        await t.click(btn('发送'));
        t.assert(t.qa('#box li').some(li => li.textContent.trim() === '你好') && t.q('#msg').value === '', '点“发送”后，“你好”应加进列表，输入框应清空。');
        t.assert(
          document.activeElement === t.q('#msg'),
          '点“发送”后输入框没有重新获得焦点。点按钮会让焦点离开输入框，需要在事件处理函数里通过 ref 调用 inputRef.current.focus()。',
        );
        const code = t.source.replace(/^\s*import.*$/gm, '');
        t.assert(/useRef\(/.test(code), '请用 useRef 创建 ref。');
        t.assert(!/getElementById|querySelector|getElementsBy/.test(code), '不要直接查询 DOM。请通过 ref.current 访问节点。');
      },
    },
  ],
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
