/* ========== 第 37 课：调度、优先级与撕裂（第六阶段：专家） ========== */
lesson({
  id: 'scheduler', stage: 5, title: '调度、优先级与撕裂', mins: 40,
  summary: '看清 React 怎样把渲染切成小片、给更新排优先级、打断再重来，以及外部 store 为什么会在并发渲染中“撕裂”。',
  goals: [
    '能解释调度器为什么用 MessageChannel 每约 5ms 让出一次主线程，而不用微任务',
    '能判断一个更新属于哪一档优先级，并预测它在 React 18 中会不会被切片',
    '能诊断“过渡更新被打断后从头重来”带来的重复计算和渲染期副作用',
    '能写出一个带两档优先级、可打断并重新开始的迷你调度器，并用 useSyncExternalStore 消除撕裂',
  ],
  keyPoints: [
    '时间切片：渲染拆成很多小片，每片约 5ms。片与片之间，调度器用 MessageChannel 预约一个宏任务，浏览器趁机处理输入和绘制。微任务不会让出主线程。',
    '每个更新带一个 lane（优先级）。档位从高到低：同步/离散事件 → 连续事件 → 默认 → 过渡 → 空闲。React 18 只切片过渡、重试和空闲这几档，其余同步完成。',
    '高优先级更新到来时，React 丢弃过渡渲染的进度，先提交紧急更新，再从根开始重新渲染过渡更新。所以渲染函数可能执行多次而只提交一次。',
    '提交阶段一口气完成，不能被打断。否则用户会看到一半新、一半旧的 DOM。',
    '撕裂：同一次提交里，界面不同部分显示了同一数据源的不同版本。useSyncExternalStore 在提交前再读一次快照，不一致就同步重新渲染，代价是这部分更新失去并发能力。',
  ],
  body: [
    p('第 23 课说过：过渡更新“可以被打断”。这一课打开盖子，回答三个问题：React 怎样打断自己？多个更新谁先谁后？打断之后会出现什么新问题？'),
    p('学完这一课，你应该能从调度的角度解释一些“奇怪”的现象。例如：同一段慢代码，放进 setTimeout 就卡，放进 startTransition 就不卡；渲染函数里的日志打印了 10 次，界面却只更新了 1 次。'),

    h('一、为什么要时间切片'),
    p('浏览器的主线程一次只做一件事。一段 JS 在运行时，点击、按键和绘制都在排队。超过 50ms 的任务叫<b>长任务</b>（第 24 课），用户会明显感到卡顿。'),
    p('<b>时间切片</b>就是把一次长渲染拆成很多小片。每片只做约 5ms 的工作，然后把主线程还给浏览器。浏览器处理完排队的输入，再执行下一片。'),
    p('React 用一个独立的<b>调度器</b>（scheduler 包）做这件事。渲染每处理完一个 Fiber，就调用一次 <code>shouldYield()</code>，问“这一片的时间用完了吗”。用完了，就记住下一个要处理的 Fiber，预约下一片，然后返回。'),
    p('“预约下一片”用什么 API？这决定了浏览器有没有机会插进来：'),
    table(['让出方式', '属于', '浏览器能在两片之间处理输入吗', '问题'], [
      ['<code>Promise.then</code>、<code>queueMicrotask</code>', '微任务', '不能', '当前任务结束前，所有微任务都会执行完。浏览器根本插不进来'],
      ['<code>setTimeout(fn, 0)</code>', '宏任务', '能', '嵌套多层后，浏览器强制至少等 4ms。100 片就白等 400ms'],
      ['<code>requestAnimationFrame</code>', '帧回调', '能', '每帧只调用一次（约 16ms）；页面在后台时会暂停'],
      ['<code>MessageChannel</code>', '宏任务', '能', '没有 4ms 下限。React 18 的调度器在浏览器里用它'],
    ]),
    p('下面的示例把 300 个 1ms 的工作单元用三种方式执行。另有一个每 10ms 跳一次的“心跳”定时器。心跳次数越多，说明浏览器在中间越有机会做别的事。先预测，再运行。'),
    Object.assign(play(`
import { useState } from 'react';

function busy(ms) {
  const start = performance.now();
  while (performance.now() - start < ms) {}
}

const channel = new MessageChannel();
let onMessage = null;
channel.port1.onmessage = () => onMessage();

// 把 units 个 1ms 的工作单元分片执行，每片约 5ms
function runJob(mode, units, done) {
  let i = 0, slices = 0;
  const t0 = performance.now();
  function slice() {
    slices++;
    const deadline = performance.now() + 5;
    while (i < units) {
      busy(1);
      i++;
      if (mode !== 'sync' && performance.now() >= deadline) break;
    }
    if (i < units) {
      if (mode === 'micro') Promise.resolve().then(slice);
      else { onMessage = slice; channel.port2.postMessage(null); }
    } else {
      done({ slices, ms: Math.round(performance.now() - t0) });
    }
  }
  slice();
}

const NAMES = { sync: '一次做完', micro: '微任务让出', channel: 'MessageChannel 让出' };

function App() {
  const [text, setText] = useState('');
  const [log, setLog] = useState([]);

  function start(mode) {
    let beats = 0;
    const id = setInterval(() => beats++, 10); // 心跳：主线程空闲时才会跳
    runJob(mode, 300, ({ slices, ms }) => {
      clearInterval(id);
      setLog(l => [...l, NAMES[mode] + '：' + slices + ' 片，用时 ' + ms + 'ms，心跳 ' + beats + ' 次']);
    });
  }

  return (
    <div>
      <p>
        <button onClick={() => start('sync')}>一次做完</button>{' '}
        <button onClick={() => start('micro')}>微任务让出</button>{' '}
        <button onClick={() => start('channel')}>MessageChannel 让出</button>
      </p>
      <input value={text} onChange={e => setText(e.target.value)} placeholder="运行期间在这里打字" />
      <ul>{log.map((s, i) => <li key={i}>{s}</li>)}</ul>
    </div>
  );
}`, '三种让出方式的心跳对比', '三个按钮各点一次，看列表里的心跳次数。也可以点完按钮立刻在输入框里打字，比较手感。<br>“微任务让出”切成了 60 多片，但心跳仍是 0：每片结束后排队的是微任务，浏览器要等全部微任务执行完才能处理定时器和输入。只有宏任务之间，浏览器才能插进来。'), {
      predict: {
        q: '点“微任务让出”：工作同样被切成约 60 片。这 300ms 里，心跳定时器大约会跳几次？',
        options: ['0 次，和“一次做完”一样', '约 30 次，和 MessageChannel 一样', '约 60 次，每片之间跳一次', '约 15 次，比 MessageChannel 少一半'],
        answer: 0,
        explain: '微任务在当前宏任务结束前全部执行完。60 片连成一个 300ms 的长任务，定时器和输入事件都插不进来。切成多少片不重要，重要的是片与片之间有没有回到浏览器的事件循环。',
      },
      pkey: 'scheduler|三种让出方式的心跳对比',
    }),
    deep('调度器内部用最小堆保存任务，按过期时间排序。每片的长度是常量 <code>frameYieldMs = 5</code>。5ms 是一个折中：太短，调度本身的开销变大；太长，输入的延迟变大。这些都是 React 18.3.1 的实现细节，版本之间可能变化。'),

    h('二、优先级：lanes 的心智模型'),
    p('React 给每个更新分配一个 <b>lane</b>（车道）。lane 是一个 31 位二进制数中的某一位。位越低，优先级越高。用位运算，React 可以一次合并或比较很多组更新。'),
    p('你不必记住 31 条车道。记住下面 5 档，以及每档在 React 18 中会不会被切片：'),
    table(['档位（从高到低）', '谁会产生', '18.3.1 中的 lane', '会被切片吗'], [
      ['同步 / 离散事件', 'click、keydown、input 等事件里的 set 函数；<code>flushSync</code>', '<code>SyncLane</code>', '不会。当前事件结束后立刻同步完成'],
      ['连续事件', 'pointermove、scroll、wheel 等事件里的 set 函数', '<code>InputContinuousLane</code>', '不会'],
      ['默认', 'setTimeout、请求回调、effect 里的 set 函数', '<code>DefaultLane</code>', '不会'],
      ['过渡', '<code>startTransition</code>、<code>useDeferredValue</code>', '<code>TransitionLanes</code>（16 条）', '会，可以被打断'],
      ['空闲', '18 没有公开 API；隐藏的屏幕外内容', '<code>IdleLane</code>、<code>OffscreenLane</code>', '会'],
    ]),
    p('表里最容易被忽略的是第三行。在 React 18 中，setTimeout 或请求回调触发的更新<b>不会被切片</b>。一次 300ms 的“默认”渲染，就是一个 300ms 的长任务。想让它可以被打断，必须明确地放进 startTransition。'),
    p('低优先级的更新可能一直被高优先级的更新插队，这叫<b>饥饿</b>。React 给每个 lane 记一个过期时间：过渡更新等待超过约 5 秒，就被标为“已过期”，改用同步方式渲染完。输入类的更新约 250ms 就过期。'),
    tip('lane 的名字、数量和过期时间都是内部实现，不同版本会变。只记“档位顺序”和“只有过渡类更新可被切片”这两条结论。'),

    h('三、被打断的过渡更新会从头再来'),
    p('过渡渲染做到一半时，用户按了一个键。React 按下面的顺序处理：'),
    p('<ol class="task-steps">'
      + '<li>当前片结束，调度器让出主线程。</li>'
      + '<li>浏览器派发按键事件，组件调用 set 函数，产生一个 SyncLane 更新。</li>'
      + '<li>React 发现有更高优先级的工作，<b>丢弃</b>过渡渲染的进度（还没提交的那棵 Fiber 树）。</li>'
      + '<li>React 同步渲染并提交紧急更新。用户马上看到输入框里的新字。</li>'
      + '<li>React 从根开始，用最新的 state <b>重新</b>渲染过渡更新。</li>'
      + '</ol>'),
    p('为什么不接着做？紧急更新可能修改了过渡渲染读过的 state。旧进度建立在过期的数据上，接着做会得到前后矛盾的结果。从头再来更简单，也一定正确。'),
    p('代价是重复计算。下面的列表放在过渡更新里渲染。快速打字，看“开始”和“提交”的次数。'),
    play(`
import { useState, useEffect, useTransition, memo } from 'react';

const stats = { started: 0, committed: 0 };

function busy(ms) {
  const start = performance.now();
  while (performance.now() - start < ms) {}
}

function SlowRow({ text }) {
  busy(2);
  return <li>{text}</li>;
}

const SlowList = memo(function SlowList({ query }) {
  stats.started++; // 反例：只为演示。渲染期间不要修改外部变量
  useEffect(() => { stats.committed++; });
  const rows = [];
  for (let i = 0; i < 80; i++) rows.push(<SlowRow key={i} text={query + ' #' + i} />);
  return <ul style={{ height: 120, overflow: 'auto' }}>{rows}</ul>;
});

function Stats() {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 200);
    return () => clearInterval(id);
  }, []);
  return <p>列表渲染开始 <b>{stats.started}</b> 次，提交 <b>{stats.committed}</b> 次</p>;
}

function App() {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    setText(e.target.value);                         // 紧急：输入框
    startTransition(() => setQuery(e.target.value)); // 过渡：慢列表
  }

  return (
    <div>
      <input value={text} onChange={handleChange} placeholder="快速连续打字" />
      {isPending && <small> 列表更新中…</small>}
      <Stats />
      <SlowList query={query} />
    </div>
  );
}`, '打断一次，就重来一次', '每次渲染列表约需 160ms。快速打 10 个字，你会看到“开始”增加约 10 次，“提交”只增加 1～2 次。被打断的渲染全部作废。<br>这说明两件事：<ol class="task-steps"><li>并发渲染不减少计算量，反而可能增加。要减少计算，还要靠 memo、虚拟列表。</li><li>渲染函数可能执行多次而只提交一次。在渲染期间上报日志、修改外部变量，次数都会出错。</li></ol>'),
    p('<b>为什么提交不能被打断？</b>提交阶段在修改真实 DOM。如果改到一半让出主线程，浏览器就会绘制出一半新、一半旧的界面。所以只有渲染阶段可以切片，提交阶段总是同步一口气完成。渲染阶段能被随意丢弃，前提是渲染是纯的：它只计算，不修改外部世界。'),
    warn('StrictMode 在开发环境故意把组件渲染两次，就是在模拟“渲染被丢弃、再来一次”。如果组件在渲染时发请求、修改模块变量或上报日志，StrictMode 下会出错，并发渲染下也会出错。把这些代码放进 effect 或事件处理函数。'),

    h('四、批处理与 flushSync'),
    p('调用 set 函数时，React 不会马上渲染。它把更新放进组件的更新队列，标上 lane，再请求调度器“稍后渲染一次”。同一个任务里的多次 set 函数调用，共用这一次渲染。这就是<b>自动批处理</b>。在 React 18 中，用 createRoot 创建的根对事件、setTimeout 和 Promise 回调都自动批处理。'),
    p('批处理按 lane 分组。同一个事件里，紧急更新和过渡更新不会合并：React 先渲染并提交紧急的那一组，再单独渲染过渡的那一组。'),
    code(`
import { flushSync } from 'react-dom';

function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);            // 与上一行合并成一次渲染

  startTransition(() => {
    setFilter('done');         // 另一组：稍后单独渲染，可被打断
  });

  flushSync(() => {
    setOpen(true);             // 立刻以 SyncLane 渲染并提交
  });
  // 这里 DOM 已经更新；前面排队的同步更新也一并被冲刷了
}`, '一个事件里的四种更新'),
    p('<code>flushSync</code> 让 React 在函数返回前就同步渲染并提交。它会把排队中的同步更新一起冲刷掉，破坏批处理，还会让这次渲染无法切片。只在“下一行代码必须读到新 DOM”时使用，例如第 16 课里的滚动到新添加的一项。'),

    h('五、撕裂：外部数据在两片之间变了'),
    p('<b>撕裂</b>（tearing）指同一次提交里，界面的不同部分显示了同一个数据源的不同版本。'),
    p('React 自己的 state 不会撕裂。更新先进队列，一次渲染中所有组件读的都是同一份快照。可是组件如果在渲染时直接读一个<b>可变的外部变量</b>（模块变量、全局 store、<code>window</code> 上的值），情况就不同了：'),
    p('<ol class="task-steps">'
      + '<li>过渡渲染处理完前 10 行，读到的值是 5，然后让出主线程。</li>'
      + '<li>浏览器执行一个定时器，把外部变量改成 6。</li>'
      + '<li>下一片继续渲染第 11 行之后，读到的是 6。</li>'
      + '<li>提交后，同一个列表的前后两段显示不同的值。</li>'
      + '</ol>'),
    p('同步渲染中间不让出主线程，外部代码没机会修改变量，所以不会撕裂。撕裂是并发渲染才有的问题。下面在 React 18.3.1 中复现它。先预测，再运行。'),
    Object.assign(play(`
import { useState, useRef, useLayoutEffect, useTransition, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

// 一个最小的外部 store
let value = 0;
const listeners = new Set();
const store = {
  get: () => value,
  set(v) { value = v; listeners.forEach(l => l()); },
  subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
};

function busy(ms) {
  const start = performance.now();
  while (performance.now() - start < ms) {}
}

// 写法 A：渲染时直接读外部变量
function DirectRow({ i }) {
  busy(2);
  return <li>{i}：{store.get()}</li>;
}

// 写法 B：通过 useSyncExternalStore 读
function SafeRow({ i }) {
  const v = useSyncExternalStore(store.subscribe, store.get);
  busy(2);
  return <li>{i}：{v}</li>;
}

function App() {
  const [safe, setSafe] = useState(false);
  const [shown, setShown] = useState(false);
  const [round, setRound] = useState(0);
  const [report, setReport] = useState('');
  const [isPending, startTransition] = useTransition();
  const timer = useRef(null);
  const listRef = useRef(null);

  function start() {
    flushSync(() => setShown(false)); // 先清空列表
    clearInterval(timer.current);
    timer.current = setInterval(() => store.set(store.get() + 1), 4); // 渲染期间不停修改 store
    startTransition(() => {
      setShown(true);
      setRound(r => r + 1);
    });
  }

  useLayoutEffect(() => {
    clearInterval(timer.current); // 提交后立刻停止修改
    if (!round) return;
    const values = new Set(Array.from(listRef.current.children, li => li.textContent.split('：')[1]));
    setReport('第 ' + round + ' 轮：50 行里出现了 ' + values.size + ' 种不同的值');
  }, [round]);

  const Row = safe ? SafeRow : DirectRow;
  const rows = [];
  if (shown) for (let i = 0; i < 50; i++) rows.push(<Row key={i} i={i} />);

  return (
    <div>
      <label>
        <input type="checkbox" checked={safe} onChange={e => { setSafe(e.target.checked); setShown(false); }} />
        {' '}用 useSyncExternalStore 读取（写法 B）
      </label>
      <p><button onClick={start}>在过渡更新中渲染 50 行</button> {isPending && <small>渲染中…</small>}</p>
      <p><b>{report}</b></p>
      <ul ref={listRef} style={{ columns: 5, fontSize: 13, paddingLeft: 18 }}>{rows}</ul>
    </div>
  );
}`, '在过渡更新中读可变的外部变量', '默认是写法 A。点按钮，通常会看到 5～15 种不同的值：每一片读到的都是那一刻的 store。<br>勾选“写法 B”再点：只有 1 种值。useSyncExternalStore 在提交前再读一次快照，发现变了，就丢弃结果，用<b>同步</b>方式重新渲染。同步渲染中间不让出，store 没机会再变。'), {
      predict: {
        q: '默认是写法 A：每行在渲染时直接读 store.get()。渲染期间，定时器每 4ms 让 store 加 1。点按钮，提交后 50 行显示的数字会怎样？',
        options: ['全部相同：一次提交只能有一个值', '出现好几种不同的值，前面的行小、后面的行大', '全部是 0：渲染期间读不到定时器的修改', '页面报错：渲染期间外部数据被修改'],
        answer: 1,
        explain: '过渡渲染每 5ms 左右让出一次。让出期间定时器执行，store 变了，后面的行就读到更大的值。React 不知道你读了外部变量，所以没有检查，直接提交了不一致的结果。这就是撕裂。',
      },
      pkey: 'scheduler|在过渡更新中读可变的外部变量',
    }),
    p('<code>useSyncExternalStore(subscribe, getSnapshot)</code> 防止撕裂的方法分 3 步：'),
    p('<ol class="task-steps">'
      + '<li>渲染时，React 记下每个组件通过 getSnapshot 读到的值。</li>'
      + '<li>并发渲染完成后、提交之前，React 再调用一次 getSnapshot，用 <code>Object.is</code> 比较。</li>'
      + '<li>有任何一个不同，React 就丢弃这次结果，改用同步渲染重做一遍，再提交。</li>'
      + '</ol>'),
    p('另外，store 通过 subscribe 通知变化时，React 总是用 SyncLane 安排更新。所以<b>外部 store 的更新不能成为过渡更新</b>：<code>startTransition(() =&gt; store.set(x))</code> 仍然会同步渲染。想让依赖 store 的慢列表不阻塞输入，就把读到的值交给 <code>useDeferredValue</code>，再传给用 memo 包裹的慢组件。'),
    table(['数据放在哪里', '会撕裂吗', '能享受过渡更新吗'], [
      ['useState / useReducer / Context', '不会', '能'],
      ['外部 store + useSyncExternalStore', '不会', 'store 的更新不能；读到的值可以再交给 useDeferredValue'],
      ['外部可变变量，渲染时直接读', '会', '能，但结果可能不一致'],
      ['外部 store + useEffect 订阅 + useState 保存', '可能出现短暂不一致', '能，但每次变化多一轮渲染'],
    ]),
    tip('只有 React 自己用的数据，就放在 useState 或 useReducer 里，不需要外部 store。用 useSyncExternalStore 的典型场景：Redux、Zustand 这类库，浏览器 API（<code>navigator.onLine</code>、媒体查询），以及和非 React 代码共享的数据。getSnapshot 必须在数据没变时返回同一个引用（第 27 课）。'),

    h('六、读源码的路线（选读）'),
    p('想在 react-dom 18.3.1 的开发版源码里跟一遍流程，可以按下面的函数名搜索：'),
    p('<ol class="task-steps">'
      + '<li><code>requestUpdateLane</code>：set 函数被调用时，按“是否在 transition 中”“当前事件类型”决定 lane。</li>'
      + '<li><code>scheduleUpdateOnFiber</code> → <code>ensureRootIsScheduled</code>：把根节点上最高优先级的 lane 交给调度器。</li>'
      + '<li><code>performConcurrentWorkOnRoot</code>：按 lane 决定用 <code>workLoopSync</code> 还是 <code>workLoopConcurrent</code>。</li>'
      + '<li><code>workLoopConcurrent</code>：<code>while (workInProgress !== null &amp;&amp; !shouldYield()) performUnitOfWork(workInProgress)</code>。</li>'
      + '<li><code>prepareFreshStack</code>：丢弃进度、从根重新开始的地方。</li>'
      + '<li><code>isRenderConsistentWithExternalStores</code>：useSyncExternalStore 在提交前的一致性检查。</li>'
      + '<li><code>markStarvedLanesAsExpired</code>：把等待太久的 lane 标为过期。</li>'
      + '</ol>'),
    p('读源码时，先用一个最小示例在这些函数里打断点，比从头通读有效得多。'),
  ],
  quiz: [
    {
      q: '“导出报表”按钮先请求数据，在请求回调里调用 <code>setReport(data)</code>。这次渲染需要 300ms，期间页面卡住。同事说：“React 18 有并发渲染，应该会自动切片，卡顿一定另有原因。”哪个判断正确？',
      options: [
        '同事说得对：React 18 的所有更新都会被切片',
        '请求回调里的更新属于默认档，React 18 不会切片它；把 setReport 放进 startTransition 才会切片',
        '应该用 flushSync 包住 setReport，同步渲染就不会卡',
        '应该把 report 放进外部 store，用 useSyncExternalStore 读取',
      ],
      answer: 1,
      explain: 'React 18 只切片过渡、重试和空闲几档。请求回调中的更新是 DefaultLane，按同步方式一次渲染完，所以是一个 300ms 的长任务。最有迷惑性的是第一项：“并发渲染”是能力，不是默认行为，需要用 startTransition 或 useDeferredValue 开启。flushSync 和 useSyncExternalStore 都只会让渲染更同步。',
    },
    {
      q: '你写了一个把 1 万条数据分批处理的函数。每批处理后，要让浏览器有机会响应点击。下面哪种“让出”写法有效？',
      options: [
        '每批之后 <code>await Promise.resolve()</code>',
        '每批之后 <code>queueMicrotask(nextBatch)</code>',
        '每批之后 <code>await new Promise(r =&gt; setTimeout(r, 0))</code>',
        '每批之后检查 <code>performance.now()</code>，超过 5ms 就 <code>continue</code>',
      ],
      answer: 2,
      explain: 'setTimeout 预约的是宏任务。两个宏任务之间，浏览器可以处理点击和绘制。前两项都是微任务：当前任务结束前会全部执行完，等于没有让出。最后一项只是在循环里判断时间，没有真正把主线程交出去。MessageChannel 也有效，而且没有嵌套 setTimeout 的 4ms 下限。',
    },
    {
      q: '一个过渡渲染做到一半，用户按了一个键（紧急更新）。React 处理完按键后，过渡渲染会怎样？',
      options: [
        '从中断的那个 Fiber 继续做，已完成的部分保留',
        '丢弃已完成的部分，用最新的 state 从根重新渲染',
        '直接放弃这次过渡更新，等用户下次操作再渲染',
        '先提交已完成的一半，剩下的一半下一帧再提交',
      ],
      answer: 1,
      explain: '紧急更新可能改了过渡渲染读过的 state，旧进度可能已经过期。所以 React 丢弃没有提交的 Fiber 树，从根重新开始。过渡更新本身还在队列里，不会被放弃。最有迷惑性的是“继续做”：它看起来更省，但会把基于新旧两份 state 算出的结果拼在一起。提交一半更不可能：提交阶段不能被打断。',
    },
    {
      q: '团队自己写的购物车 store 是一个模块级的可变对象。组件在渲染时直接读 <code>cart.count</code>。升级到 React 18 并给商品列表加上 startTransition 后，偶尔看到页头和列表的数量不一致。最合适的修法是？',
      options: [
        '去掉 startTransition，回到同步渲染',
        '在每个组件里用 useEffect 订阅 store，把 count 存进 useState',
        '用 useSyncExternalStore(cart.subscribe, () =&gt; cart.count) 读取',
        '用 useMemo 缓存 cart.count，避免重复读取',
      ],
      answer: 2,
      explain: '这是撕裂：过渡渲染在两片之间让出时，store 被改了，前后读到的值不同。useSyncExternalStore 会在提交前再检查一次，不一致就同步重做。去掉 startTransition 能“修好”，但放弃了并发渲染的好处。useEffect + useState 的写法在提交和 effect 之间仍有一段不一致的窗口，还多一轮渲染。useMemo 和撕裂无关。',
    },
    {
      q: '筛选条件存在外部 store 里，组件用 useSyncExternalStore 读取。你写了 <code>startTransition(() =&gt; store.setFilter(v))</code>，希望慢列表不阻塞输入。结果输入仍然卡顿。为什么？怎么改？',
      options: [
        'startTransition 只对 useState 的 set 函数有效；外部 store 的更新总是同步渲染。把读到的 filter 交给 useDeferredValue，再传给 memo 包裹的慢列表',
        'startTransition 需要 isPending 才能生效，要改用 useTransition',
        'store.setFilter 是异步的，要在外面加 await',
        '要在 getSnapshot 里返回新对象，React 才知道值变了',
      ],
      answer: 0,
      explain: 'useSyncExternalStore 收到 store 的通知后，用 SyncLane 安排更新，以保证不撕裂。所以它的更新不能成为过渡更新。useDeferredValue 会先用旧值完成紧急渲染，再用新值做一次可打断的后台渲染。第二项的 useTransition 和 startTransition 机制相同。最后一项会导致无限渲染。',
    },
  ],
  checkOnly: (() => {
    const pre = (src) => '<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">'
      + src.replace(/^\n/, '').replace(/\n\s*$/, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre></div>';
    return [
      {
        q: '用户点击一次按钮。React 18 会进行几次渲染并提交？' + pre(`
function handleClick() {
  setA(1);
  startTransition(() => {
    setB(1);
  });
  setC(1);
}`),
        options: ['1 次：同一个事件里的更新全部合并', '2 次：A 和 C 一次，B 稍后单独一次', '3 次：每个 set 函数一次', '2 次：A 一次，B 和 C 一次'],
        answer: 1,
        explain: '批处理按 lane 分组。setA 和 setC 都是点击事件里的同步更新，合并成一次渲染并先提交。setB 在 transition 里，属于过渡 lane，稍后单独渲染。最后一项把“代码顺序”误当成了分组依据：setC 写在 startTransition 之后，但它不在回调里，仍是同步更新。',
      },
      {
        q: 'items 有 1000 项，每项 heavy() 耗时约 2ms。处理期间，用户点击页面上的按钮，点击会在什么时候得到响应？' + pre(`
async function processAll(items) {
  for (const item of items) {
    heavy(item);
    await null; // 想在每项之后让出主线程
  }
}`),
        options: ['每处理完一项，点击就有机会被处理', '大约 2 秒后，全部处理完才响应', '永远不会响应：await null 会抛错', '约 4ms 后：await 有最小延迟'],
        answer: 1,
        explain: '<code>await null</code> 后面的代码作为微任务继续执行。微任务在当前任务结束前全部跑完，所以 1000 项连成一个约 2 秒的长任务，点击只能排队。要真正让出，改用 <code>await new Promise(r =&gt; setTimeout(r, 0))</code>，或者用 MessageChannel 预约下一个宏任务，最好每 5ms 左右才让出一次。',
      },
      {
        q: 'query 由 <code>startTransition(() =&gt; setQuery(v))</code> 更新。用户快速输入了 5 个字。track 会被调用几次？' + pre(`
function Results({ query }) {
  analytics.track('results_viewed', query);
  const items = useMemo(() => search(query), [query]);
  return <List items={items} />;
}`),
        options: ['正好 1 次：只有最后一次被提交', '正好 5 次：每个字一次', '不确定，可能多于界面实际提交的次数', '0 次：过渡渲染不执行组件函数'],
        answer: 2,
        explain: '过渡渲染可能被新的输入打断，然后从头重来。被丢弃的渲染也执行了组件函数，所以 track 的次数取决于打断了几次，可能多于提交次数。上报“用户看到了结果”这类事，应该放进 effect：effect 只在提交后执行。',
      },
      {
        q: '下面的代码想让 store 的更新成为过渡更新，不阻塞输入。实际效果是？' + pre(`
const theme = useSyncExternalStore(store.subscribe, store.getTheme);

function handlePick(t) {
  startTransition(() => {
    store.setTheme(t); // 内部通知所有订阅者
  });
}`),
        options: ['成功：startTransition 里的更新都是过渡更新', '不成功：订阅通知触发的重新渲染总是同步的', '报错：startTransition 里不能调用外部函数', '成功，但只在 React 19 中有效'],
        answer: 1,
        explain: 'useSyncExternalStore 收到订阅通知后，用 SyncLane 安排重新渲染。这样才能保证不撕裂。startTransition 只把它回调里调用的 React set 函数标成过渡更新，管不到外部 store 的通知。想让依赖 theme 的慢组件不阻塞输入，可以对读到的值用 useDeferredValue。',
      },
    ];
  })(),
  exercise: {
    task: '<p>补全 <code>createScheduler</code>，写一个带两档优先级的迷你调度器。过渡任务是 <code>{ total, performUnit(i), commit(results) }</code>：依次执行 total 个工作单元，再一次提交所有结果。要求：</p>'
      + '<ol class="task-steps">'
      + '<li><code>scheduleTransition(job)</code> 只登记任务并预约执行，立刻返回。用 <code>MessageChannel</code> 预约下一个宏任务。</li>'
      + '<li>每片最多做约 5ms 的工作单元，然后让出主线程，预约下一片。不要用 Promise.then 让出。</li>'
      + '<li><code>scheduleUrgent(fn)</code>：紧急任务要在 30ms 内执行。它可能修改过渡任务读的数据：如果它在过渡任务做到一半时执行了，丢弃已完成的部分结果，下一片从第 0 个单元重新开始。</li>'
      + '<li>全部单元完成后，只调用一次 <code>commit(results)</code>。results 按单元顺序排列。</li>'
      + '<li>旧的过渡任务还没完成，又来了一个新的过渡任务：放弃旧任务，它永远不提交。</li>'
      + '</ol>'
      + '<p>预览里可以手动试：点“开始过渡任务”，再立刻连点“紧急任务”。</p>',
    starter: `import { useState, useRef } from 'react';

// 占住主线程 ms 毫秒，模拟一个工作单元
function busy(ms) {
  const start = performance.now();
  while (performance.now() - start < ms) {}
}

// 迷你调度器。现在的版本一口气做完所有工作，中间不让出主线程
function createScheduler() {
  return {
    // job = { total, performUnit(i), commit(results) }
    scheduleTransition(job) {
      const results = [];
      for (let i = 0; i < job.total; i++) results.push(job.performUnit(i));
      job.commit(results);
    },
    // fn：一个紧急任务
    scheduleUrgent(fn) {
      fn();
    },
  };
}

function App() {
  const sched = useRef(null);
  if (!sched.current) sched.current = createScheduler();
  const data = useRef({ version: 1 });
  const [log, setLog] = useState([]);
  const add = (s) => setLog(l => [...l.slice(-5), s]);

  function startJob() {
    const t0 = performance.now();
    let starts = 0;
    sched.current.scheduleTransition({
      total: 300,
      performUnit(i) {
        if (i === 0) starts++;
        busy(1);
        return data.current.version;
      },
      commit(results) {
        const versions = Array.from(new Set(results)).join('、');
        add('提交 ' + results.length + ' 项｜版本 ' + versions + '｜从头开始 ' + starts + ' 次｜用时 ' + Math.round(performance.now() - t0) + 'ms');
      },
    });
  }

  function urgent() {
    const t0 = performance.now();
    sched.current.scheduleUrgent(() => {
      data.current.version++;
      add('紧急任务：等了 ' + Math.round(performance.now() - t0) + 'ms，版本变为 ' + data.current.version);
    });
  }

  return (
    <div>
      <button onClick={startJob}>开始过渡任务（300 项）</button>{' '}
      <button onClick={urgent}>紧急任务：版本 +1</button>
      <ul>{log.map((s, i) => <li key={i}>{s}</li>)}</ul>
    </div>
  );
}`,
    solution: `import { useState, useRef } from 'react';

// 占住主线程 ms 毫秒，模拟一个工作单元
function busy(ms) {
  const start = performance.now();
  while (performance.now() - start < ms) {}
}

function createScheduler() {
  const urgentQueue = [];
  let job = null;       // 当前的过渡任务
  let index = 0;        // 下一个要做的单元
  let results = [];     // 还没提交的部分结果
  let scheduled = false;

  const channel = new MessageChannel();
  channel.port1.onmessage = workLoop;

  function requestRun() {
    if (scheduled) return;
    scheduled = true;
    channel.port2.postMessage(null); // 预约下一个宏任务
  }

  function workLoop() {
    scheduled = false;
    // 1. 紧急任务先做
    if (urgentQueue.length > 0) {
      while (urgentQueue.length > 0) urgentQueue.shift()();
      // 数据可能变了：做了一半的结果作废
      index = 0;
      results = [];
    }
    if (!job) return;
    // 2. 做一片，约 5ms
    const deadline = performance.now() + 5;
    while (index < job.total && performance.now() < deadline) {
      results.push(job.performUnit(index));
      index++;
    }
    if (index < job.total) {
      requestRun(); // 还没做完：让出主线程，预约下一片
      return;
    }
    // 3. 全部完成：一次提交
    const done = job, finished = results;
    job = null;
    index = 0;
    results = [];
    done.commit(finished);
  }

  return {
    scheduleTransition(next) {
      job = next;       // 新任务替换旧任务
      index = 0;
      results = [];
      requestRun();
    },
    scheduleUrgent(fn) {
      urgentQueue.push(fn);
      requestRun();
    },
  };
}

function App() {
  const sched = useRef(null);
  if (!sched.current) sched.current = createScheduler();
  const data = useRef({ version: 1 });
  const [log, setLog] = useState([]);
  const add = (s) => setLog(l => [...l.slice(-5), s]);

  function startJob() {
    const t0 = performance.now();
    let starts = 0;
    sched.current.scheduleTransition({
      total: 300,
      performUnit(i) {
        if (i === 0) starts++;
        busy(1);
        return data.current.version;
      },
      commit(results) {
        const versions = Array.from(new Set(results)).join('、');
        add('提交 ' + results.length + ' 项｜版本 ' + versions + '｜从头开始 ' + starts + ' 次｜用时 ' + Math.round(performance.now() - t0) + 'ms');
      },
    });
  }

  function urgent() {
    const t0 = performance.now();
    sched.current.scheduleUrgent(() => {
      data.current.version++;
      add('紧急任务：等了 ' + Math.round(performance.now() - t0) + 'ms，版本变为 ' + data.current.version);
    });
  }

  return (
    <div>
      <button onClick={startJob}>开始过渡任务（300 项）</button>{' '}
      <button onClick={urgent}>紧急任务：版本 +1</button>
      <ul>{log.map((s, i) => <li key={i}>{s}</li>)}</ul>
    </div>
  );
}`,
    exports: ['createScheduler'],
    hint: '调度器要记住 4 样东西：当前任务、下一个单元的序号、还没提交的部分结果、排队的紧急任务。每次收到 MessageChannel 的消息，就是“一片”：先清空紧急队列，再做到时间用完。想一想：紧急任务执行后，哪两样东西要清零？',
    faded: `import { useState, useRef } from 'react';

// 占住主线程 ms 毫秒，模拟一个工作单元
function busy(ms) {
  const start = performance.now();
  while (performance.now() - start < ms) {}
}

function createScheduler() {
  const urgentQueue = [];
  let job = null;       // 当前的过渡任务
  let index = 0;        // 下一个要做的单元
  let results = [];     // 还没提交的部分结果
  let scheduled = false;

  const channel = new MessageChannel();
  channel.port1.onmessage = workLoop;

  function requestRun() {
    if (scheduled) return;
    scheduled = true;
    /* ✏️ 通过 channel 的另一个端口发一条消息，预约下一个宏任务 */
  }

  function workLoop() {
    scheduled = false;
    if (urgentQueue.length > 0) {
      while (urgentQueue.length > 0) urgentQueue.shift()();
      /* ✏️ 紧急任务可能改了数据：哪两个变量要清零？ */
    }
    if (!job) return;
    const deadline = performance.now() + 5;
    while (/* ✏️ 还有单元没做，并且这一片的时间没用完 */) {
      results.push(job.performUnit(index));
      index++;
    }
    if (index < job.total) {
      /* ✏️ 还没做完：预约下一片，然后返回 */
    }
    const done = job, finished = results;
    job = null;
    index = 0;
    results = [];
    done.commit(finished);
  }

  return {
    scheduleTransition(next) {
      job = next;
      index = 0;
      results = [];
      requestRun();
    },
    scheduleUrgent(fn) {
      urgentQueue.push(fn);
      requestRun();
    },
  };
}

// App 与起始代码相同`,
    test: async (t) => {
      const create = t.exports.createScheduler;
      t.assert(typeof create === 'function', '请保留名为 createScheduler 的函数');
      const busy = (ms) => { const s = performance.now(); while (performance.now() - s < ms) {} };
      const waitFor = async (cond, ms) => { const end = performance.now() + ms; while (!cond() && performance.now() < end) await t.wait(10); return cond(); };
      const makeJob = (total, data, rec) => ({
        total,
        performUnit(i) { if (i === 0) rec.starts++; rec.calls++; busy(1); return { i, v: data.version }; },
        commit(results) { rec.commits.push(Array.from(results || [])); rec.commitAt = performance.now(); },
      });
      const newRec = () => ({ starts: 0, calls: 0, commits: [] });
      const checkOrder = (r, n, what) => {
        t.assert(r.length === n, what + '提交的结果应有 ' + n + ' 项，实际 ' + r.length + ' 项。commit 要在全部单元完成后一次收到所有结果（步骤 4）');
        t.assert(r.every((x, k) => x && x.i === k), what + '提交的结果顺序不对，或混进了别的值。results[i] 应是 performUnit(i) 的返回值（步骤 4）');
      };

      // 1. 不打断时：立刻返回、分片执行、一次提交
      {
        const s = create();
        const data = { version: 1 }, rec = newRec();
        const beats = [];
        const hb = setInterval(() => beats.push(performance.now()), 4);
        const t0 = performance.now();
        try {
          s.scheduleTransition(makeJob(100, data, rec));
          const dt = performance.now() - t0;
          t.assert(dt < 10 && rec.commits.length === 0,
            'scheduleTransition 在调用时就同步做完了全部工作，主线程被占用 ' + Math.round(dt) + 'ms。它应该只登记任务，用 MessageChannel 预约到之后的宏任务里一片一片地做（步骤 1）');
          await waitFor(() => rec.commits.length > 0, 3000);
        } finally { clearInterval(hb); }
        t.assert(rec.commits.length > 0, '3 秒后过渡任务还没有提交。做完全部单元后要调用 commit(results)（步骤 4）');
        await t.wait(60);
        t.assert(rec.commits.length === 1, '一个过渡任务提交了 ' + rec.commits.length + ' 次。提交必须一次完成：不能每片提交一部分（步骤 4）');
        checkOrder(rec.commits[0], 100, '');
        const pts = [t0, ...beats.filter(x => x > t0 && x < rec.commitAt), rec.commitAt];
        let gap = 0;
        for (let k = 1; k < pts.length; k++) gap = Math.max(gap, pts[k] - pts[k - 1]);
        t.assert(gap < 40, '过渡任务执行期间，主线程最长连续被占用约 ' + Math.round(gap) + 'ms，浏览器插不进来。每片约 5ms 后要让出。注意 Promise.then 和 queueMicrotask 是微任务，不算让出（步骤 2）');
        const total = rec.commitAt - t0;
        t.assert(total < 260, '100 个 1ms 的单元用了 ' + Math.round(total) + 'ms 才完成。让出太频繁，或者每次让出都要等 4ms 以上（例如每个单元都 setTimeout 一次）。每片做满约 5ms 再让出，并用 MessageChannel 预约（步骤 1、2）');
      }

      // 2. 紧急任务打断过渡任务
      {
        const s = create();
        const data = { version: 1 }, rec = newRec();
        const lat = [];
        const t0 = performance.now();
        s.scheduleTransition(makeJob(150, data, rec));
        const timers = [30, 75].map(at => setTimeout(() => {
          s.scheduleUrgent(() => { data.version++; lat.push(performance.now() - (t0 + at)); });
        }, at));
        await waitFor(() => rec.commits.length > 0 && lat.length === 2, 3000);
        timers.forEach(clearTimeout);
        t.assert(lat.length === 2, '3 秒内紧急任务没有全部执行。它们可能在排队等过渡任务做完，或者根本没有被执行。每一片开始时，先清空紧急队列（步骤 3）');
        const worst = Math.max(...lat);
        t.assert(worst < 30, '紧急任务等了约 ' + Math.round(worst) + 'ms 才执行，要求 30ms 以内。过渡任务要分片让出主线程，并且每片开始时先处理紧急队列（步骤 2、3）');
        t.assert(rec.commits.length > 0, '有紧急任务插队后，过渡任务 3 秒内没有提交');
        await t.wait(60);
        t.assert(rec.commits.length === 1, '有紧急任务插队后，过渡任务提交了 ' + rec.commits.length + ' 次，应只提交 1 次（步骤 4）');
        const r = rec.commits[0];
        checkOrder(r, 150, '有紧急任务插队后，');
        const versions = Array.from(new Set(r.map(x => x.v)));
        t.assert(versions.length === 1 && versions[0] === data.version,
          '撕裂了：提交的结果里混有版本 ' + versions.join('、') + '，最新版本是 ' + data.version + '。紧急任务改了数据后，做了一半的结果已经过期，要丢弃并从第 0 个单元重新开始（步骤 3）');
        t.assert(rec.starts >= 2, '紧急任务插队后，过渡任务没有从第 0 个单元重新开始（步骤 3）');
      }

      // 3. 没有过渡任务时，紧急任务也要尽快执行，并按顺序执行
      {
        const s = create();
        const order = [];
        const t0 = performance.now();
        s.scheduleUrgent(() => order.push(['a', performance.now() - t0]));
        s.scheduleUrgent(() => order.push(['b', performance.now() - t0]));
        await waitFor(() => order.length === 2, 500);
        t.assert(order.length === 2, '没有过渡任务时，紧急任务也要执行（步骤 3）');
        t.assert(order[0][0] === 'a' && order[1][0] === 'b', '两个紧急任务要按登记的顺序执行');
        t.assert(order[1][1] < 30, '没有过渡任务时，紧急任务等了 ' + Math.round(order[1][1]) + 'ms，要求 30ms 以内（步骤 3）');
      }

      // 4. 新的过渡任务替换旧的
      {
        const s = create();
        const data = { version: 1 }, oldRec = newRec(), newRecd = newRec();
        s.scheduleTransition(makeJob(120, data, oldRec));
        await t.wait(25);
        const callsBefore = oldRec.calls;
        s.scheduleTransition(makeJob(40, data, newRecd));
        await waitFor(() => newRecd.commits.length > 0, 3000);
        await t.wait(150);
        t.assert(newRecd.commits.length === 1, '新的过渡任务应提交 1 次，实际 ' + newRecd.commits.length + ' 次（步骤 5）');
        checkOrder(newRecd.commits[0], 40, '新的过渡任务');
        t.assert(oldRec.commits.length === 0, '被新任务替换的旧任务仍然提交了。旧任务要被放弃，永远不提交（步骤 5）');
        t.assert(oldRec.calls - callsBefore <= 8, '新任务登记后，旧任务又执行了 ' + (oldRec.calls - callsBefore) + ' 个单元。新任务到来时，旧任务应停止（步骤 5）');
      }
    },
  },
});
