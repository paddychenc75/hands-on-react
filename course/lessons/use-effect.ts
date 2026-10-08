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
      // 另开一个严格模式的根：React 会做“开始 → 停止 → 再开始”。清理函数没停掉第一个定时器，就会有两个定时器一起加。
      // 段落自己创建根，才能被 t.retry 整段重测；2.5 秒内的计数偏少可能只是设备忙，所以算计时断言
      const kept: { box?: HTMLElement; root?: any } = {};
      await t.retry(async () => {
        const box = document.createElement('div');
        const root = ReactDOM.createRoot(box);
        ReactDOM.flushSync(() => root.render(React.createElement(React.StrictMode, null, React.createElement(t.exports.App))));
        try {
          await t.wait(2500);
          const v = Number(t.text('#seconds'));
          const sv = Number((box.querySelector('#seconds') || {}).textContent);
          t.assert(v !== 0, '2.5 秒后还是 0。定时器启动了吗？请在 useEffect 里调用 setInterval');
          const stale =
            '2.5 秒后应为 2，实际一直是 1：每秒都在执行 setSeconds(0 + 1)。定时器回调记住的是第一次渲染的 seconds。请用函数式更新 setSeconds(s => s + 1)';
          t.timing(v !== 1, stale);
          t.assert(v >= 2 && v <= 3, `2.5 秒后应为 2，实际是 ${v}。是不是同时启动了不止一个定时器？`);
          const dup = `在严格模式下，2.5 秒后应为 2，实际是 ${sv}。React 做了“开始 → 停止 → 再开始”，但第一个定时器没有被停掉，两个定时器在一起加。请让 effect 返回清理函数：return () => clearInterval(id)`;
          t.timing(sv >= 2, dup);
          t.assert(sv === 2, dup);
        } catch (e) {
          root.unmount();
          throw e;
        }
        kept.box = box;
        kept.root = root;
      });
      const box = kept.box as HTMLElement;
      const root = kept.root;
      try {
        // 卸载这个根，再等 1.2 秒：定时器如果还在跑，就会继续调用 App 的 set 函数。
        // 这一步读 React 19.3.x 的 fiber 结构（FiberRoot.current → 子树里的 App fiber → Hook 链表的 queue）；
        // 结构不认识就跳过，上面严格模式下的计数检查已经能发现没写清理函数
        const inter = t.internals;
        const fiberRoot = inter.rootOf(box);
        let app: any = null;
        const find = f => {
          for (; f && !app; f = f.sibling) {
            if (f.type === t.exports.App) app = f;
            else find(f.child);
          }
        };
        find(fiberRoot && fiberRoot.current);
        const hooks = app ? inter.hooksOf(app) : null;
        if (hooks) {
          const queues = hooks.filter(h => h.queue && typeof h.queue.dispatch === 'function').map(h => h.queue);
          let calls = 0;
          const before = queues.map(q => {
            const r = q.lastRenderedReducer;
            q.lastRenderedReducer = function () {
              calls++;
              return r.apply(this, arguments);
            };
            return q.pending;
          });
          root.unmount();
          await t.wait(1200);
          const moved = queues.some((q, i) => q.pending !== before[i]);
          t.assert(
            !calls && !moved,
            '组件卸载 1.2 秒后，定时器还在调用 setSeconds：卸载时它没有被停掉。在启动前清除旧定时器不够，组件消失时也要停止同步。请让 effect 返回清理函数：return () => clearInterval(id)',
          );
        }
      } finally {
        root.unmount();
      }
    },
  },
  drillMins: 11,
  drills: [
    {
      title: '订阅按键事件：加上清理，再修掉旧的 count',
      task: '<ol class="task-steps"><li>下面的 App 在 <code>window</code> 上监听 keydown，按 Enter 就把 count 加 1。现在有两个问题：监听器从不移除；多按几次后数字停在 1。</li><li>让 effect 在停止同步时移除监听器。</li><li>让每按一次 Enter 都加 1，按其他键不计数。</li><li>检查时，App 会在严格模式下再挂载一次，也会被卸载：严格模式之后 <code>window</code> 上只应剩 1 个 keydown 监听器，卸载之后应剩 0 个。</li></ol>',
      starter: `import { useState, useEffect } from 'react';

function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Enter') setCount(count + 1);
    }
    window.addEventListener('keydown', onKey);
  }, []);

  return <p>按 Enter 的次数：<span id="count">{count}</span></p>;
}`,
      solution: `import { useState, useEffect } from 'react';

function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Enter') setCount(c => c + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return <p>按 Enter 的次数：<span id="count">{count}</span></p>;
}`,
      hint: '两个问题分开想。监听器是 effect 开始同步时添加的，停止同步时谁来移除它？监听器里的 count 是哪一次渲染的值？可以让 set 函数基于最新值计算，也可以让 effect 在 count 变化时重新同步。',
      exports: ['App'],
      test: async t => {
        const { React, ReactDOM } = t;
        t.assert(typeof t.exports.App === 'function', '请保留名为 App 的组件');
        const live = new Set();
        const add = window.addEventListener;
        const rem = window.removeEventListener;
        window.addEventListener = function (type, fn, ...rest) {
          if (type === 'keydown') {
            live.add(fn);
            // 用 AbortController 的 signal 移除监听器也算清理
            const signal = rest[0] && rest[0].signal;
            if (signal) signal.addEventListener('abort', () => live.delete(fn));
          }
          return add.call(this, type, fn, ...rest);
        };
        window.removeEventListener = function (type, fn, ...rest) {
          if (type === 'keydown') live.delete(fn);
          return rem.call(this, type, fn, ...rest);
        };
        const press = key => ReactDOM.flushSync(() => window.dispatchEvent(new KeyboardEvent('keydown', { key })));
        const box = document.createElement('div');
        const root = ReactDOM.createRoot(box);
        const shown = () => (box.querySelector('#count') || {}).textContent;
        try {
          // 页面上已经挂着的那份 App 也会收到按键。先按一次，让它重新订阅（如果它会重新订阅），记下它占用的监听器数
          press('Enter');
          const other = live.size;
          ReactDOM.flushSync(() => root.render(React.createElement(React.StrictMode, null, React.createElement(t.exports.App))));
          t.assert(
            live.size - other === 1,
            `严格模式做完“开始 → 停止 → 再开始”之后，window 上应只剩 1 个 keydown 监听器，实际有 ${live.size - other} 个。effect 开始同步时添加了监听器，停止同步时没有移除它。请让 effect 返回清理函数`,
          );
          press('a');
          t.assert(shown() === '0', `按 a 键不该计数，实际显示 ${shown()}`);
          press('Enter');
          press('Enter');
          press('Enter');
          t.assert(
            shown() === '3',
            `按 3 次 Enter 应显示 3，实际是 ${shown()}。监听器只在第一次渲染后添加，记住的是那一次的 count。让 set 函数基于最新值计算，或让 effect 随 count 重新同步`,
          );
          root.unmount();
          await t.wait(50);
          t.assert(live.size - other === 0, `组件卸载后，window 上还剩 ${live.size - other} 个 keydown 监听器：卸载时没有停止同步`);
        } finally {
          delete window.addEventListener;
          delete window.removeEventListener;
          try {
            root.unmount();
          } catch {}
        }
      },
    },
    {
      title: '依赖数组漏了 room：房间换了，连接没跟着换',
      task: '<ol class="task-steps"><li><code>connect(room)</code> 会往 <code>log</code> 里记“连接 房间”，它返回的清理函数会记“断开 房间”。</li><li>现在点“房间 b”，日志里什么都没新增：连接还留在房间 a。找出原因并修好。</li><li>切到 b 之后，日志应依次新增“断开 a”“连接 b”。</li><li>点“无关按钮”只改了 n，不能触发重新连接。</li></ol>',
      starter: `import { useState, useEffect } from 'react';

const log = [];
function connect(room) {
  log.push('连接 ' + room);
  return () => log.push('断开 ' + room);
}

function App() {
  const [room, setRoom] = useState('a');
  const [n, setN] = useState(0);

  useEffect(() => {
    return connect(room);
  }, []);

  return (
    <div>
      <p>当前房间：<span id="room">{room}</span></p>
      <button id="to-a" onClick={() => setRoom('a')}>房间 a</button>
      <button id="to-b" onClick={() => setRoom('b')}>房间 b</button>
      <button id="bump" onClick={() => setN(n + 1)}>无关按钮 {n}</button>
    </div>
  );
}`,
      solution: `import { useState, useEffect } from 'react';

const log = [];
function connect(room) {
  log.push('连接 ' + room);
  return () => log.push('断开 ' + room);
}

function App() {
  const [room, setRoom] = useState('a');
  const [n, setN] = useState(0);

  useEffect(() => {
    return connect(room);
  }, [room]);

  return (
    <div>
      <p>当前房间：<span id="room">{room}</span></p>
      <button id="to-a" onClick={() => setRoom('a')}>房间 a</button>
      <button id="to-b" onClick={() => setRoom('b')}>房间 b</button>
      <button id="bump" onClick={() => setN(n + 1)}>无关按钮 {n}</button>
    </div>
  );
}`,
      hint: '这个 effect 读了哪个会变的值？依赖数组要列出 effect 读到的全部响应式值。也想想：依赖数组整个不写，会发生什么？',
      exports: ['App', 'log'],
      test: async t => {
        const log = t.exports.log;
        t.assert(Array.isArray(log), '请保留名为 log 的数组和 connect 函数');
        t.assert(typeof t.exports.App === 'function', '请保留名为 App 的组件');
        const run = async sel => {
          const n0 = log.length;
          await t.click(sel);
          return log.slice(n0).join('，');
        };
        const bump = await run('#bump');
        t.assert(bump === '', `点无关按钮不该重新连接，实际日志新增：${bump}。这个 effect 只读 room，没有依赖数组时，每次渲染后都会重新同步。请写上依赖数组`);
        const toB = await run('#to-b');
        t.assert(t.text('#room') === 'b', '点“房间 b”后，界面应显示当前房间 b');
        t.assert(toB !== '', '切到房间 b 后日志没有变化：连接还留在房间 a。effect 读了 room，却没有把它列进依赖数组，所以 room 变了也不会重新同步');
        t.assert(
          toB === '断开 a，连接 b',
          `切到房间 b 后，日志应依次新增“断开 a”“连接 b”，实际新增：${toB}。重新同步前要先停止上一次的同步：effect 需要返回清理函数`,
        );
        const toA = await run('#to-a');
        t.assert(toA === '断开 b，连接 a', `切回房间 a 后，日志应依次新增“断开 b”“连接 a”，实际新增：${toA}`);
        const bump2 = await run('#bump');
        t.assert(bump2 === '', `点无关按钮不该重新连接，实际日志新增：${bump2}`);
      },
    },
    {
      title: '不需要 effect：把派生数据挪到渲染中',
      task: '<ol class="task-steps"><li>下面的列表由 <code>kind</code> 筛选出来，现在靠 <code>useEffect</code> 和 <code>visible</code> state 同步。</li><li>点一次筛选按钮，App 会渲染两次：先用旧的 visible 渲染，effect 再设置新值，又渲染一次。</li><li>去掉多余的 state 和 effect，让 <code>visible</code> 在渲染时直接算出来。点一次按钮 App 只渲染一次。</li><li>三个按钮的筛选结果要保持正确。</li></ol>',
      starter: `import { useState, useEffect } from 'react';

const ALL = [
  { id: 1, name: '苹果', kind: '水果' },
  { id: 2, name: '西瓜', kind: '水果' },
  { id: 3, name: '黄瓜', kind: '蔬菜' },
  { id: 4, name: '白菜', kind: '蔬菜' },
];

let renders = 0;
function App() {
  renders++;
  const [kind, setKind] = useState('全部');
  const [visible, setVisible] = useState(ALL);

  useEffect(() => {
    setVisible(kind === '全部' ? ALL : ALL.filter(x => x.kind === kind));
  }, [kind]);

  return (
    <div>
      <button id="all" onClick={() => setKind('全部')}>全部</button>
      <button id="fruit" onClick={() => setKind('水果')}>水果</button>
      <button id="veg" onClick={() => setKind('蔬菜')}>蔬菜</button>
      <ul id="list">{visible.map(x => <li key={x.id}>{x.name}</li>)}</ul>
      <p>App 渲染了 <span id="renders">{renders}</span> 次</p>
    </div>
  );
}`,
      solution: `import { useState } from 'react';

const ALL = [
  { id: 1, name: '苹果', kind: '水果' },
  { id: 2, name: '西瓜', kind: '水果' },
  { id: 3, name: '黄瓜', kind: '蔬菜' },
  { id: 4, name: '白菜', kind: '蔬菜' },
];

let renders = 0;
function App() {
  renders++;
  const [kind, setKind] = useState('全部');
  const visible = kind === '全部' ? ALL : ALL.filter(x => x.kind === kind);

  return (
    <div>
      <button id="all" onClick={() => setKind('全部')}>全部</button>
      <button id="fruit" onClick={() => setKind('水果')}>水果</button>
      <button id="veg" onClick={() => setKind('蔬菜')}>蔬菜</button>
      <ul id="list">{visible.map(x => <li key={x.id}>{x.name}</li>)}</ul>
      <p>App 渲染了 <span id="renders">{renders}</span> 次</p>
    </div>
  );
}`,
      hint: 'visible 完全由 kind 决定，它不是需要单独记住的 state。直接在组件函数体里算出它，就不需要 effect 来同步了。',
      exports: ['App'],
      test: async t => {
        const list = () =>
          t
            .qa('#list li')
            .map(li => li.textContent.trim())
            .join('、');
        const cases = [
          ['#fruit', '苹果、西瓜'],
          ['#veg', '黄瓜、白菜'],
          ['#all', '苹果、西瓜、黄瓜、白菜'],
        ];
        for (const [sel, want] of cases) {
          const before = Number(t.text('#renders'));
          await t.click(sel);
          await t.wait(30);
          t.assert(list() === want, `点“${t.q(sel).textContent}”后，列表应为“${want}”，实际是“${list() || '空'}”`);
          const delta = Number(t.text('#renders')) - before;
          t.assert(
            delta === 1,
            `点一次“${t.q(sel).textContent}”，App 渲染了 ${delta} 次，应只有 1 次。visible 能由 kind 直接算出来，不需要 state，也不需要 effect。请在渲染时计算它`,
          );
        }
      },
    },
  ],
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
