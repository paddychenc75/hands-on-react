/* ========== 课程内容 · 第二阶段：进阶 ========== */

/* ---------- 9 ---------- */
lesson({
  id: 'use-effect', stage: 1, title: 'useEffect 与副作用', mins: 24,
  summary: '让组件与外部世界同步：定时器、网络请求、订阅、修改标题。',
  goals: ['能说出 effect 的用途：让组件与外部系统保持同步', '能根据 effect 读到的值写出依赖数组，并预测它什么时候重新同步', '能写出清理函数，停止上一次的同步', '能判断一个需求该用 effect，还是该在渲染时计算或写进事件处理函数'],
  keyPoints: [
    'effect 让组件与外部系统（定时器、网络请求、订阅、document.title）保持同步。它在渲染提交到页面之后运行。',
    '每个 effect 回答两个问题：怎样开始同步（函数体）？怎样停止同步（返回的清理函数）？',
    '依赖数组由 effect 读到的 props 和 state 决定，不是你挑的。依赖变了，React 先运行清理函数停止旧的同步，再运行 effect 开始新的同步。',
    '<code>[]</code> 的意思是“effect 不读任何会变的值”，不是“我想只执行一次”。漏写依赖，effect 会一直读到旧值。',
    '能在渲染时算出来的值、由用户操作引起的逻辑，都不需要 effect。',
  ],
  body: [
    p('组件函数应该是“纯”的。它只根据 props 和 state 计算 JSX。但真实应用必须和<b>外部系统</b>交互，例如：发网络请求、设定时器、订阅 WebSocket、修改 document.title。这些操作叫<b>副作用（side effect）</b>。'),
    p('<code>useEffect</code> 让组件<b>与外部系统保持同步</b>。它在渲染完成、页面更新之后运行。'),
    h('effect 描述一次同步'),
    p('每个 effect 只回答两个问题：'),
    p('<ol class="task-steps"><li>怎样<b>开始同步</b>？写在 effect 的函数体里。</li><li>怎样<b>停止同步</b>？写在 effect 返回的清理函数里。</li></ol>'),
    code(`useEffect(() => {
  // 开始同步：渲染提交到页面后运行
  return () => {
    // 停止同步（可选的清理函数）：重新同步之前、或组件从页面上消失时运行
  };
}, [依赖1, 依赖2]); // 依赖数组：effect 读到的、会变的值`),
    p('依赖数组不是你挑的。effect 里读到的每个 props 和 state，都要写进去。每次渲染后，React 比较这些值：'),
    p('<ol class="task-steps"><li>都没变：什么也不做，上一次的同步继续。</li><li>有一个变了：先运行上一次的清理函数，停止旧的同步；再运行 effect，开始新的同步。</li></ol>'),
    p('你可能听过“挂载时执行、更新时执行”的说法。它来自旧的 class 组件。在函数组件里，按“开始同步 / 停止同步”来想更不容易出错。'),
    h('从结果上看：三种依赖写法'),
    p('下面的演示有三个 effect，依赖数组各不相同。先想一想：在输入框里打字时，哪些 effect 会运行？'),
    play(`
import { useState, useEffect } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  useEffect(() => {
    console.log('effect ①（没有依赖数组）');
  });

  useEffect(() => {
    console.log('effect ②（依赖 []）');
  }, []);

  useEffect(() => {
    console.log('effect ③（依赖 [count]）：count =', count);
    document.title = '点击了 ' + count + ' 次';
  }, [count]);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>count: {count}</button>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="输入，观察控制台" />
    </div>
  );
}`, '观察三种 effect 的执行时机', '在输入框打字时，只有 ① 会运行：打字改变的是 name。① 没有依赖数组，每次渲染后都重新同步；② 不读任何会变的值，第一次渲染后同步一次就够了；③ 只读 count，count 没变，就不重新同步。点按钮时 ① 和 ③ 运行。'),
    table(['写法', '什么时候运行', '典型用途'], [
      ['<code>useEffect(fn)</code>', '每次渲染后都重新同步', '很少用，容易造成性能问题'],
      ['<code>useEffect(fn, [])</code>', 'effect 不读任何会变的值，所以第一次渲染后同步一次就够了', '连接不依赖 props 和 state 的外部系统，例如 window 事件'],
      ['<code>useEffect(fn, [a, b])</code>', '第一次渲染后开始同步；a 或 b 变化后，先停止旧的同步，再开始新的', '根据 id 请求数据、同步某个值'],
    ]),
    p('<code>[]</code> 的意思是“effect 不读任何会变的值”，不是“我想只执行一次”。如果 effect 读了 count，却写 <code>[]</code>，它会一直用第一次渲染时的 count。'),
    h('清理函数：善始善终'),
    p('effect 可能开启一个持续运行的东西。例如定时器、事件监听或订阅。这时，必须在清理函数里关闭它。否则组件卸载后它还在运行，造成<b>内存泄漏</b>或奇怪的 bug。'),
    play(`
import { useState, useEffect } from 'react';

function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    console.log('⏱ 开始同步：启动定时器');
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => {
      console.log('🧹 停止同步：清理定时器');
      clearInterval(id);
    };
  }, []);

  return <h2>{now.toLocaleTimeString('zh-CN')}</h2>;
}

function App() {
  const [show, setShow] = useState(true);
  return (
    <div>
      <button onClick={() => setShow(!show)}>{show ? '移除' : '显示'}时钟</button>
      {show && <Clock />}
    </div>
  );
}`, '定时器的启动与清理'),
    like('effect 就像进房间开灯，清理函数就是出房间关灯。React 保证：每次“再次进房间”之前，都会先替你执行上一次的“关灯”。'),
    h('请求数据'),
    p('数据请求是 effect 最常见的用途。注意要处理<b>竞态问题</b>：用户快速切换时，旧请求可能比新请求晚返回，覆盖掉正确的数据。用一个 <code>ignore</code> 标记即可解决。'),
    play(`
import { useState, useEffect } from 'react';

// 模拟一个网络请求：随机延迟返回
function fakeFetch(id) {
  return new Promise(r => setTimeout(() => r({ id, name: '用户 #' + id }), 300 + Math.random() * 1200));
}

function App() {
  const [userId, setUserId] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;           // 标记这次请求是否已过期
    setLoading(true);
    fakeFetch(userId).then(data => {
      if (!ignore) {              // 只采用最新一次请求的结果
        setUser(data);
        setLoading(false);
      }
    });
    return () => { ignore = true; }; // userId 变化时，旧请求作废
  }, [userId]);

  return (
    <div>
      {[1, 2, 3, 4].map(id => (
        <button key={id} onClick={() => setUserId(id)} disabled={id === userId}>用户 {id}</button>
      ))}
      <p>{loading ? '加载中…' : user && user.name}</p>
    </div>
  );
}`, '带竞态处理的数据请求', '试着快速连续点击不同用户，结果始终和选中的按钮一致。'),
    warn('<b>依赖数组不要撒谎</b>。effect 中用到的 props、state，以及由它们算出的值，都要写进依赖数组。漏写会导致 effect 读到旧值（“闭包陷阱”），第 21 课会深入讲解。在真实项目里，ESLint 插件 <code>react-hooks/exhaustive-deps</code> 会帮你检查。'),
    warn('effect 里调用 set 函数，又不写依赖数组，会<b>无限循环</b>：渲染 → effect → set → 渲染……依赖里放每次渲染都新建的对象或数组，结果一样。'),
    h('你可能不需要 effect'),
    p('effect 是用来与<b>外部系统</b>同步的“逃生舱”。下面这些情况都<b>不需要</b> effect：'),
    ul(['<b>根据 props/state 计算出的值</b>：直接在渲染时计算。比如 <code>const fullName = first + \' \' + last</code>，不要用 effect 去 setFullName', '<b>响应用户操作</b>：直接写在事件处理函数里，比如点击购买后发请求', '<b>props 变化时重置状态</b>：给组件换一个 key']),
    deep('开发环境中，严格模式（StrictMode）会在组件第一次出现时多做一轮同步。顺序是：<b>开始同步 → 停止同步 → 再开始同步</b>。这样做是为了检查你的清理函数。如果你在控制台看到 effect 运行了两次，这是正常的，生产环境不会这样。本课练习的检查也会用严格模式运行你的代码。'),
  ],
  quiz: [
    { q: '<code>useEffect(fn, [])</code> 里的 fn 什么时候运行？', options: ['每次渲染后都运行', '第一次渲染后运行，之后不再重新同步', '组件从页面上消失时运行，用来做收尾工作', '只在你手动调用 fn() 时运行'], answer: 1, explain: '空数组表示 effect 不读任何会变的值，所以同步一次就够了（开发环境的严格模式会额外多做一轮“开始 → 停止 → 开始”）。最迷惑的是第三项：组件消失时运行的是 fn 返回的清理函数，不是 fn 本身。' },
    { q: 'effect 用 roomId 连接聊天室，返回的清理函数会断开连接，依赖写 <code>[roomId]</code>。roomId 从 "a" 变成 "b" 时，会发生什么？', options: ['先断开 "a"，再连接 "b"', '先连接 "b"，再断开 "a"', '只连接 "b"；"a" 要等组件消失才断开', '什么都不发生，effect 已经运行过了'], answer: 0, explain: '依赖变了，React 先运行上一次的清理函数，停止旧的同步；再运行 effect，开始新的同步。最迷惑的是第三项：如果清理只在组件消失时运行，切换房间后会同时连着两个房间。' },
    { q: '清理函数会在什么时候运行？', options: ['只在组件从页面上消失、被卸载的时候', '每次重新同步之前，以及组件消失时', '每次渲染之前', '浏览器刷新页面时'], answer: 1, explain: '依赖变化、effect 重新运行之前，React 会先清理上一次的同步；组件消失时也会清理。最迷惑的是第一项：只记住“卸载时清理”，就会漏掉依赖变化时的清理。' },
    { q: 'fullName 由 firstName 和 lastName 拼接而成，最好怎么写？', options: ['用 useEffect 监听两者，再调用 setFullName', '渲染时直接计算 const fullName = first + " " + last', '再加一个 fullName state，在两个输入框的 onChange 里都更新它', '用 useEffect 计算，依赖写 [] 只算一次'], answer: 1, explain: '能从现有 props 和 state 算出来的值，直接在渲染时计算。最迷惑的是第一项：它能工作，但每次都多一次渲染，而且中间有一帧显示的是旧值。第三项多出一份要手动保持一致的 state。' },
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
    test: async (t) => {
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
        t.assert(v !== 1, '2.5 秒后应为 2，实际一直是 1：每秒都在执行 setSeconds(0 + 1)。定时器回调记住的是第一次渲染的 seconds。请用函数式更新 setSeconds(s => s + 1)');
        t.assert(v >= 2 && v <= 3, `2.5 秒后应为 2，实际是 ${v}。是不是同时启动了不止一个定时器？`);
        t.assert(sv === 2, `在严格模式下，2.5 秒后应为 2，实际是 ${sv}。React 做了“开始 → 停止 → 再开始”，但第一个定时器没有被停掉，两个定时器在一起加。请让 effect 返回清理函数：return () => clearInterval(id)`);
        // 卸载这个根，再等 1.2 秒：定时器如果还在跑，就会继续调用 App 的 set 函数
        const ck = Object.keys(box).find(k => k.startsWith('__reactContainer$'));
        let app = null;
        const find = (f) => { for (; f && !app; f = f.sibling) { if (f.type === t.exports.App) app = f; else find(f.child); } };
        find(ck && box[ck]);
        const queues = [];
        for (let h = app && app.memoizedState; h; h = h.next) if (h.queue && typeof h.queue.dispatch === 'function') queues.push(h.queue);
        let calls = 0;
        const before = queues.map(q => { const r = q.lastRenderedReducer; q.lastRenderedReducer = function () { calls++; return r.apply(this, arguments); }; return [q.interleaved, q.pending]; });
        root.unmount();
        await t.wait(1200);
        const moved = queues.some((q, i) => q.interleaved !== before[i][0] || q.pending !== before[i][1]);
        t.assert(!calls && !moved, '组件卸载 1.2 秒后，定时器还在调用 setSeconds：卸载时它没有被停掉。在启动前清除旧定时器不够，组件消失时也要停止同步。请让 effect 返回清理函数：return () => clearInterval(id)');
      } finally {
        root.unmount();
      }
    }
  }
});

/* ---------- 10 ---------- */
lesson({
  id: 'lifting-state', stage: 1, title: '状态提升与组件通信', mins: 18,
  summary: '当多个组件需要共享数据时，把状态放到它们最近的共同父组件里。',
  goals: ['能找出几个组件共用的 state，并把它提升到最近的共同父组件', '能通过 props 传入数据和回调，让子组件请求父组件修改 state', '能按“唯一数据源”原则判断哪些值该存成 state、哪些该算出来', '能说出 prop drilling 是什么，以及什么时候该考虑 Context'],
  keyPoints: [
    '两个组件要共用同一份数据时，把 state 移到它们最近的共同父组件。这叫状态提升。',
    '数据向下流：父组件通过 props 传入值。事件向上传：父组件通过 props 传入回调，子组件调用它，请求父组件修改。',
    '唯一数据源：同一份数据只存一份 state。能算出来的值（例如华氏度）不要再存一份。',
    '常见的坑：子组件自己再存一份 state，它就和父组件的数据对不上了。',
    '层级很深、每层都要转发 props 时，叫 prop drilling。这时可以考虑第 12 课的 Context。',
  ],
  body: [
    p('React 的数据是<b>单向流动</b>的：父组件通过 props 把数据传给子组件。那么两个兄弟组件要共享数据怎么办？答案是：<b>把状态移到它们最近的共同父组件中</b>，再分别通过 props 传下去。这叫<b>状态提升（Lifting State Up）</b>。'),
    fig(`<svg viewBox="0 0 420 170" class="tree" role="img" aria-label="状态提升示意图">
      <g class="t-edge"><line x1="210" y1="44" x2="110" y2="116"/><line x1="210" y1="44" x2="310" y2="116"/></g>
      <g class="t-node t-hot"><rect x="140" y="14" width="140" height="44" rx="10"/><text x="210" y="34">Parent</text><text x="210" y="50" class="t-small">state: value</text></g>
      <g class="t-node"><rect x="40" y="116" width="140" height="40" rx="10"/><text x="110" y="141">摄氏度输入</text></g>
      <g class="t-node"><rect x="240" y="116" width="140" height="40" rx="10"/><text x="310" y="141">华氏度输入</text></g>
      <text x="128" y="84" class="t-small t-lbl">↓ props 数据</text><text x="292" y="84" class="t-small t-lbl">↑ onChange 回调</text>
    </svg>`, '数据向下流（props），事件向上传（回调函数）'),
    play(`
import { useState } from 'react';

function TempInput({ label, value, onChange }) {
  return (
    <p>
      <label>{label}：
        <input value={value} onChange={e => onChange(e.target.value)} />
      </label>
    </p>
  );
}

function App() {
  // 唯一数据源：只存用户刚输入的值，以及它的单位
  const [temp, setTemp] = useState({ value: '20', scale: 'c' });

  const n = parseFloat(temp.value);
  const round = x => String(Math.round(x * 10) / 10);
  // 两个框各自显示的值
  const celsius = temp.scale === 'c' ? temp.value : (isNaN(n) ? '' : round((n - 32) * 5 / 9));
  const fahrenheit = temp.scale === 'f' ? temp.value : (isNaN(n) ? '' : round(n * 9 / 5 + 32));
  const c = parseFloat(celsius);

  return (
    <div>
      <TempInput label="摄氏度 °C" value={celsius} onChange={v => setTemp({ value: v, scale: 'c' })} />
      <TempInput label="华氏度 °F" value={fahrenheit} onChange={v => setTemp({ value: v, scale: 'f' })} />
      <p>{c >= 100 ? '💨 水会沸腾' : '💧 水不会沸腾'}</p>
    </div>
  );
}`, '温度转换器：两个输入框共享一份状态', '在任意一个输入框里改数字，另一个都会同步更新。App 只存一份 state：用户刚输入的值和它的单位。正在输入的框显示原文，另一个框在每次渲染时由它算出来。两个 TempInput 都没有自己的 state。'),
    tip('<b>唯一数据源</b>：同一份数据只存一份 state。另一个单位的温度可以算出来。所以不要同时存 celsius 和 fahrenheit 两个 state，否则两者很容易不同步。'),
    h('state 该放在哪里？'),
    p('一个实用的判断流程：'),
    ul(['找出所有<b>用到</b>这个 state 的组件', '找到它们<b>最近的共同父组件</b>', '把 state 放在那个父组件（或更上层）里', '如果只有一个组件用到，就留在那个组件里，不要过早提升']),
    h('Props 层层传递的问题'),
    p('共同父组件可能离使用者很远。这时，中间的每层组件都要接收并转发 props。即使它们自己不用，也要转发。这叫 <b>prop drilling（逐层传递 props）</b>。小范围可以接受；层级很深时，可以用第 12 课的 <b>Context</b> 解决。'),
    like('状态提升像家里的电视遥控器。遥控器只有一个，放在客厅（共同的父组件）。哥哥和妹妹（子组件）不能各自藏一个遥控器。想换台时，他们对客厅喊一声“换到 5 台”（调用回调）。电视显示什么（props），由客厅那个遥控器决定。'),
  ],
  quiz: [
    { q: '两个兄弟组件要显示同一份数据，并且都能修改它。最常见的做法是？', options: ['各存一份 state，再用 effect 互相同步', '把 state 提升到共同父组件，再通过 props 传入', '把 state 放在其中一个组件里，另一个用 ref 去读', '放进模块顶层的变量，两个组件直接读写'], answer: 1, explain: '状态提升让数据只有一个来源。最迷惑的是第一项：两份 state 靠 effect 同步，中间总有一次渲染是不一致的，还会多渲染一次。模块变量被修改时，React 不知道，不会重新渲染。' },
    { q: 'TempInput 通过 props 收到 <code>value</code> 和 <code>onChange</code>。用户在输入框里打字时，TempInput 应该怎么做？', options: ['调用 onChange(新值)，由父组件更新 state', '直接给 props.value 赋新值', '在 TempInput 里再声明一个 state 存新值', '用 document.querySelector 改另一个输入框'], answer: 0, explain: '数据向下流，事件向上传。子组件调用父组件传入的回调，请求父组件修改。最迷惑的是第三项：子组件自己再存一份，它和父组件的数据就对不上了，另一个输入框也不会更新。' },
    { q: '温度转换器为什么不同时存 celsius 和 fahrenheit 两个 state？', options: ['华氏度能由摄氏度算出来；存两份就要处处同时更新', '一个组件最多只能调用一次 useState', '两个 state 会让每次输入都渲染两遍', '存两份也可以，只是多占一点内存'], answer: 0, explain: '这是唯一数据源原则：能算出来的值不存成 state。最迷惑的是最后一项：问题不在内存，而在两份数据随时可能对不上。第三项也不对：同一个事件里的多次更新会合并成一次渲染。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>现在每个 <code>Panel</code> 自己保存 <code>isActive</code>，两个面板可以同时展开。</li><li>在 <code>App</code> 中声明 state <code>activeId</code>，初始值为 <code>\'p1\'</code>。</li><li>删掉 Panel 里的 isActive state。改为通过 props 传入 <code>isActive</code> 和 <code>onShow</code>。</li><li>App 给每个 Panel 传入：isActive（它是不是当前展开的那个）、onShow（点“展开”时，把 activeId 改成它的 id）。</li><li>结果：同一时间只展开一个面板。点另一个面板的“展开”，原来展开的那个自动收起。</li></ol>',
    starter: `import { useState } from 'react';

function Panel({ id, title, children }) {
  const [isActive, setIsActive] = useState(false);
  return (
    <section id={id}>
      <h3>{title}</h3>
      {isActive ? (
        <p className="content">{children}</p>
      ) : (
        <button onClick={() => setIsActive(true)}>展开</button>
      )}
    </section>
  );
}

function App() {
  return (
    <div>
      <Panel id="p1" title="关于">杭州的一家小书店。</Panel>
      <Panel id="p2" title="营业时间">每天 9:00 到 21:00。</Panel>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

function Panel({ id, title, isActive, onShow, children }) {
  return (
    <section id={id}>
      <h3>{title}</h3>
      {isActive ? (
        <p className="content">{children}</p>
      ) : (
        <button onClick={onShow}>展开</button>
      )}
    </section>
  );
}

function App() {
  const [activeId, setActiveId] = useState('p1');
  return (
    <div>
      <Panel id="p1" title="关于" isActive={activeId === 'p1'} onShow={() => setActiveId('p1')}>
        杭州的一家小书店。
      </Panel>
      <Panel id="p2" title="营业时间" isActive={activeId === 'p2'} onShow={() => setActiveId('p2')}>
        每天 9:00 到 21:00。
      </Panel>
    </div>
  );
}`,
    exports: ['App'],
    hint: '先问：哪个组件需要知道“现在展开的是哪一个”？两个 Panel 都要知道，所以 state 要放在它们的共同父组件 App 里。Panel 只负责按 isActive 显示，并在点击时调用 onShow。',
    faded: `import { useState } from 'react';

function Panel({ id, title, /* ✏️ 通过 props 接收 isActive 和 onShow */ children }) {
  return (
    <section id={id}>
      <h3>{title}</h3>
      {isActive ? (
        <p className="content">{children}</p>
      ) : (
        <button onClick={/* ✏️ 请求父组件展开自己 */}>展开</button>
      )}
    </section>
  );
}

function App() {
  /* ✏️ 声明 activeId 和它的 set 函数，初始值为 'p1' */
  return (
    <div>
      <Panel id="p1" title="关于" isActive={/* ✏️ p1 是不是当前展开的那个？ */} onShow={() => setActiveId('p1')}>
        杭州的一家小书店。
      </Panel>
      <Panel id="p2" title="营业时间" isActive={activeId === 'p2'} onShow={/* ✏️ 把 activeId 改成 'p2' */}>
        每天 9:00 到 21:00。
      </Panel>
    </div>
  );
}`,
    test: async (t) => {
      const sec = (id) => t.q('#' + id);
      const isOpen = (id) => !!sec(id).querySelector('.content');
      const showBtn = (id) => [...sec(id).querySelectorAll('button')].find(b => b.textContent.trim() === '展开');
      t.assert(sec('p1') && sec('p2'), '找不到 id 为 p1 和 p2 的面板。请保留 <section id={id}>');
      t.assert(isOpen('p1') && !isOpen('p2'), '一开始应只展开 p1。App 里 activeId 的初始值应为 \'p1\'');
      t.assert(showBtn('p2'), '没展开的面板应显示“展开”按钮');
      await t.click(showBtn('p2'));
      t.assert(isOpen('p2'), '点 p2 的“展开”后，p2 应展开。Panel 的按钮要调用 onShow，App 再更新 activeId');
      t.assert(!isOpen('p1'), '点 p2 的“展开”后，p1 应自动收起。两个面板各自保存 isActive 时，互相不知道对方的状态。请把 state 提升到 App，由 App 决定哪个面板展开');
      t.assert(showBtn('p1'), 'p1 收起后应显示“展开”按钮');
      await t.click(showBtn('p1'));
      t.assert(isOpen('p1') && !isOpen('p2'), '再点 p1 的“展开”，应只展开 p1，p2 收起');
      // 检查 state 放在哪里：渲染 <section> 的组件（Panel）不应再有自己的 state，它的上层组件（App）要有
      const fiberOf = (node) => { const k = Object.keys(node).find(k => k.startsWith('__reactFiber$')); return k && node[k]; };
      const isComp = (f) => !!f && [0, 11, 15].includes(f.tag); // 函数组件、forwardRef、memo
      const hasState = (f) => { for (let h = f.memoizedState; h && typeof h === 'object' && 'next' in h; h = h.next) if (h.queue && typeof h.queue.dispatch === 'function') return true; return false; };
      let panel = fiberOf(sec('p1'));
      while (panel && !isComp(panel)) panel = panel.return;
      t.assert(panel, '找不到渲染 <section> 的组件。请保留 Panel 组件');
      t.assert(!hasState(panel), 'Panel 里还有自己的 state。这样 Panel 和 App 各存一份“是否展开”，两份数据随时可能对不上（用 effect 同步也会慢一拍）。请删掉 Panel 的 useState，只通过 props 接收 isActive');
      let owner = panel.return;
      while (owner && !(isComp(owner) && hasState(owner))) owner = owner.return;
      t.assert(owner, '找不到保存 activeId 的组件。请在 App 里用 useState 声明 activeId，再通过 props 传给 Panel');
      // 再渲染一份 App：两份应各管各的。state 如果放在了组件外面（模块变量），两份会互相影响
      t.assert(typeof t.exports.App === 'function', '请保留名为 App 的组件');
      const box = document.createElement('div');
      const root = ReactDOM.createRoot(box);
      try {
        ReactDOM.flushSync(() => root.render(React.createElement(t.exports.App)));
        const b2 = [...box.querySelectorAll('#p2 button')].find(b => b.textContent.trim() === '展开');
        t.assert(b2, '再渲染一份 App 时，p2 应显示“展开”按钮');
        ReactDOM.flushSync(() => b2.click());
        await t.wait(40);
        t.assert(box.querySelector('#p2 .content') && !box.querySelector('#p1 .content'), '再渲染一份 App，点 p2 的“展开”，这一份没有按预期切换');
        const shared = 'App 的不同实例互相影响：“展开的是哪一个”存在了组件外面（模块变量），被所有 App 共用。请把它存成 App 的 state';
        t.assert(isOpen('p1') && !isOpen('p2'), '在另一份 App 里展开 p2，页面上这一份也跟着变了。' + shared);
        const box3 = document.createElement('div');
        const root3 = ReactDOM.createRoot(box3);
        try {
          ReactDOM.flushSync(() => root3.render(React.createElement(t.exports.App)));
          t.assert(box3.querySelector('#p1 .content') && !box3.querySelector('#p2 .content'), '在另一份 App 里展开 p2 之后，新渲染的 App 一开始就展开了 p2，应展开 p1。' + shared);
        } finally { root3.unmount(); }
      } finally { root.unmount(); }
    }
  }
});

/* ---------- 11 ---------- */
lesson({
  id: 'use-ref', stage: 1, title: 'useRef：不触发渲染的“口袋”', mins: 20,
  summary: '用 ref 访问 DOM 元素，或保存不需要显示在界面上的可变值。',
  goals: ['能用 ref 拿到 DOM 节点，完成聚焦、测量这类操作', '能用 ref 保存定时器 id 这类不需要显示的可变值', '能根据“改了之后界面要不要变”，在 ref 和 state 之间做选择', '能找出在渲染期间读写 ref.current 的问题'],
  keyPoints: [
    '<code>useRef(初始值)</code> 返回 <code>{ current }</code>。每次渲染拿到的都是同一个对象。',
    '修改 <code>ref.current</code> 不会触发重新渲染。',
    '用途一：把 ref 交给 JSX 的 <code>ref</code> 属性，React 会把 DOM 节点放进 <code>ref.current</code>。',
    '用途二：跨渲染保存不需要显示的值，例如定时器 id。普通变量做不到：每次渲染它都会被重置。',
    '要显示在界面上的值用 state。不要在渲染期间读写 ref.current。',
  ],
  body: [
    p('<code>useRef</code> 返回一个对象 <code>{ current: 初始值 }</code>。在组件存在的整个期间，这个对象都是<b>同一个</b>。你可以随时修改 <code>.current</code>。<b>修改它不会触发重新渲染</b>。'),
    h('用途一：访问 DOM 元素'),
    p('把 ref 传给 JSX 元素的 <code>ref</code> 属性，React 会在挂载后把真实 DOM 节点放进 <code>ref.current</code>。'),
    play(`
import { useRef } from 'react';

function App() {
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  return (
    <div>
      <input ref={inputRef} placeholder="点按钮让我获得焦点" />
      <button onClick={() => inputRef.current.focus()}>聚焦</button>
      <button onClick={() => {
        const r = boxRef.current.getBoundingClientRect();
        console.log('盒子尺寸：', Math.round(r.width), 'x', Math.round(r.height));
      }}>测量盒子</button>
      <div ref={boxRef} style={{ marginTop: 8, padding: 20, background: '#e3f3f9' }}>我是一个盒子</div>
    </div>
  );
}`, 'ref 操作 DOM'),
    h('用途二：保存可变值'),
    p('有些值需要跨渲染保留，但不显示在界面上。例如定时器 id、上一次的值、是否已初始化的标记。用 state 保存，会造成不必要的重新渲染。用普通变量保存，每次渲染时值会被重置。这时应该用 ref。'),
    play(`
import { useState, useRef } from 'react';

function App() {
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);   // 存定时器 id，不需要显示
  const renders = useRef(0);       // 记录渲染次数
  renders.current++;

  function start() {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setTime(t => t + 1), 100);
  }
  function stop() {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  return (
    <div>
      <h2>{(time / 10).toFixed(1)} 秒</h2>
      <button onClick={start}>开始</button>
      <button onClick={stop}>停止</button>
      <button onClick={() => { stop(); setTime(0); }}>重置</button>
      <p style={{ color: 'gray' }}>组件已渲染 {renders.current} 次</p>
    </div>
  );
}`, '用 ref 保存定时器 id 的秒表', '渲染次数跟着时间一起增加：每 0.1 秒调用一次 setTime，每次都重新渲染。存定时器 id 的 timerRef 不会触发渲染，点“开始”和“停止”本身也不改 state。'),
    p('这个秒表还差一件事：组件从页面上消失时，定时器也该停下。这需要第 14 课的“清理函数”。学完那一课，可以回来补上。'),
    h('ref 和 state 的对比'),
    table(['', 'useState', 'useRef'], [
      ['修改后是否重新渲染', '是', '<b>否</b>'],
      ['修改方式', '调用 set 函数，下次渲染才看到新值', '直接 <code>ref.current = x</code>，立即生效'],
      ['适合存什么', '需要显示在界面上的数据', 'DOM 节点、定时器 id 等“幕后”数据'],
    ]),
    warn('<b>不要在渲染期间读写 ref.current</b>。上面的 renders 计数只用于演示。渲染应该是纯的；ref 应该在事件处理函数里使用，或在第 14 课会讲的 effect 里使用。如果某个值要显示在界面上，就该用 state。'),
    like('state 像公告栏，一改大家（界面）都看到；ref 像你的私人口袋，往里放东西谁也不会被通知，但需要时随时能掏出来。'),
    deep('在 React 18 中，要把 ref 传给你<b>自己写的组件</b>，需要用 <code>forwardRef</code> 包装。React 19 简化了这一点：ref 可以像普通 prop 一样直接传递，第 28 课会讲。'),
  ],
  quiz: [
    { q: '<code>const ref = useRef(0)</code>。按钮点击时执行 <code>ref.current++</code>，JSX 里显示 <code>{ref.current}</code>。点 3 次后，页面上显示几？', options: ['3', '0', '1', '先显示 1，每点一次加 1'], answer: 1, explain: '修改 ref.current 不会触发重新渲染，所以页面一直停在第一次渲染的 0。值其实已经是 3，等别的原因引起重新渲染时才会显示出来。最迷惑的是“3”：ref 的值确实变了，但 React 不知道。' },
    { q: '下面哪个最适合用 useRef 存储？', options: ['购物车商品列表（需要显示）', 'setInterval 返回的定时器 id', '用户输入的搜索词（需要显示）', '当前选中的标签页（决定显示哪一页）'], answer: 1, explain: '定时器 id 只在内部使用，不需要显示，改了也不需要重新渲染。最迷惑的是最后一项：它不显示成文字，但它决定界面显示什么，改了界面必须更新，所以要用 state。' },
    { q: '把定时器 id 存在组件里的普通变量 <code>let timerId</code> 中。点“开始”后，数字每 100 毫秒更新一次。再点“停止”，为什么停不下来？', options: ['每次渲染都重新执行组件函数，timerId 变回 undefined', 'clearInterval 只能在 effect 的清理函数里调用，事件里调用无效', '定时器 id 必须用 state 保存', '“停止”按钮的点击被定时器挡住了'], answer: 0, explain: '每次 setTime 都会重新渲染，组件函数重新执行，timerId 被重新声明。停止时拿到的是 undefined。最迷惑的是第三项：用 state 也能停下来，但每次存 id 都多一次无用的渲染；ref 正是为这种“幕后数据”准备的。' },
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
    test: async (t) => {
      const b = t.byText('button', '聚焦'); t.assert(b, '找不到“聚焦”按钮');
      const code = t.source.replace(/^\s*import.*$/gm, '');
      t.assert(/useRef\(/.test(code), '请调用 useRef() 创建 ref');
      t.assert(/<input[^>]*\bref=\{/.test(code), '请把 ref 绑定到 <input> 的 ref 属性');
      t.assert(!/getElementById|querySelector/.test(code), '不要直接查询 DOM。请通过 ref.current 访问');
      b.focus();
      await t.click(b);
      t.assert(document.activeElement === t.q('#field'), '点击“聚焦”后输入框没有获得焦点。点击时调用 ref.current.focus()');
      const n = () => Number(t.text('#ticks'));
      const go = t.byText('button', '开始'), halt = t.byText('button', '停止');
      t.assert(go && halt, '需要“开始”和“停止”两个按钮');
      t.assert(n() === 0, '初始应为 0');
      await t.click(go);
      await t.wait(450);
      const a = n();
      t.assert(a >= 3, `点“开始”0.45 秒后应约为 4，实际是 ${a}。start 里要启动定时器：每 100 毫秒把 ticks 加 1`);
      await t.click(halt);
      const s0 = n(); await t.wait(350);
      t.assert(n() === s0, `点“停止”后数字还在变（${s0} → ${n()}）。停止时要用 ref 里的 id 调用 clearInterval。如果 id 存在组件里的普通变量中，重新渲染后它就变回了 undefined`);
      await t.click(go); await t.click(go);
      const c0 = n(); await t.wait(520);
      const d = n() - c0;
      // 定时器在跑：它的 id 应该在 App 的某个 ref 里
      const fk = Object.keys(t.q('#ticks')).find(k => k.startsWith('__reactFiber$'));
      let app = fk && t.q('#ticks')[fk];
      while (app && ![0, 11, 15].includes(app.tag)) app = app.return;
      const hooks = [];
      for (let h = app && app.memoizedState; h && typeof h === 'object' && 'next' in h; h = h.next) hooks.push(h);
      const refVals = hooks.filter(h => !h.queue && h.memoizedState && typeof h.memoizedState === 'object' && !Array.isArray(h.memoizedState) && Object.keys(h.memoizedState).join() === 'current').map(h => h.memoizedState.current);
      const idInRef = refVals.some(v => v != null && v !== false && !(v instanceof Element));
      const extraState = hooks.filter(h => h.queue && typeof h.queue.dispatch === 'function').some(h => typeof h.memoizedState === 'number' && h.memoizedState !== n() && h.memoizedState !== n() - 1 && h.memoizedState !== n() + 1);
      t.assert(idInRef, extraState
        ? '定时器在跑，但 ref 里没有它的 id：id 存在了 state 里。这样也能停下来，但每次存 id 都会多一次无用的重新渲染。id 不需要显示，请用 useRef 保存它：timerRef.current = setInterval(…)'
        : '定时器在跑，但 App 的 ref 里没有它的 id。如果 id 存在组件外面的变量里，页面上有两个秒表时，它们会共用这一个 id，互相干扰。请用 useRef 保存它：timerRef.current = setInterval(…)');
      await t.click(halt);
      const e0 = n(); await t.wait(300);
      t.assert(d <= 7, `连点两次“开始”后，0.5 秒内加了 ${d}，应约为 5：第二次点击又启动了一个定时器。start 开头先检查 ref 里是否已有 id`);
      t.assert(n() === e0, '连点两次“开始”再点“停止”，数字还在变：有一个定时器没被停掉。start 开头先检查 ref 里是否已有 id');
      // 再渲染一个秒表：两个秒表应该各走各的
      t.assert(typeof t.exports.App === 'function', '请保留名为 App 的组件');
      const box = document.createElement('div');
      const root = ReactDOM.createRoot(box);
      try {
        ReactDOM.flushSync(() => root.render(React.createElement(t.exports.App)));
        const btn2 = (txt) => [...box.querySelectorAll('button')].find(x => x.textContent.trim() === txt);
        const n2 = () => Number(box.querySelector('#ticks').textContent);
        await t.click(go); btn2('开始').click(); await t.wait(350);
        const m1 = n(), m2 = n2();
        btn2('停止').click(); await t.wait(300);
        const k1 = n() - m1;
        await t.click(halt);
        t.assert(m2 >= 2, '页面上有两个秒表。第一个在跑时，第二个点“开始”没有反应：两个秒表共用了同一个定时器 id。请把 id 存进每个组件自己的 ref');
        t.assert(k1 >= 2, '页面上有两个秒表。停止第二个时，第一个也停了：两个秒表共用了同一个定时器 id。请把 id 存进每个组件自己的 ref');
      } finally { root.unmount(); }
    }
  }
});

/* ---------- 12 ---------- */
lesson({
  id: 'context', stage: 1, title: 'Context：跨层级共享数据', mins: 19,
  summary: '不用层层传递 props，也能让深层组件读到数据。',
  goals: ['能用 createContext、Provider、useContext 三步，让深层组件读到数据', '能把 state 和修改它的函数放进 value，让深层组件既能读也能改', '能说出 useContext 读到的是哪个值：最近的 Provider，或默认值', '能判断一份数据该用 Context，还是直接通过 props 传入'],
  keyPoints: [
    'Context 解决 prop drilling：父组件把数据“广播”给整棵子树，任何深度的后代都能直接读取。',
    '三步：<code>createContext(默认值)</code> 创建；<code>&lt;Ctx.Provider value={…}&gt;</code> 提供；<code>useContext(Ctx)</code> 读取。',
    'useContext 读的是离它最近的上层 Provider 的 value。找不到 Provider 时，才用默认值。',
    '把 state 和修改它的函数一起放进 value，后代组件就既能读也能改。',
    '代价：value 变化时，所有读取它的组件都会重新渲染。适合主题、语言、当前用户这类不常变的数据。',
  ],
  body: [
    p('主题色、当前用户、语言设置这类数据，会被<b>很多层的很多个组件</b>使用。一层一层传 props 非常繁琐。<b>Context</b> 让父组件把数据“广播”给整棵子树。任何深度的组件都能直接读取。'),
    h('三步使用 Context'),
    code(`// ① 创建：给一个默认值
const ThemeContext = createContext('light');

// ② 提供：用 Provider 包住子树，传入 value
// （React 19 也可以直接写 <ThemeContext value="dark">，本课运行环境是 React 18）
<ThemeContext.Provider value="dark">
  <Page />
</ThemeContext.Provider>

// ③ 消费：在任意后代组件中读取
const theme = useContext(ThemeContext); // 'dark'`),
    play(`
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext('light');

function App() {
  const [theme, setTheme] = useState('light');
  return (
    <>
      <ThemeContext.Provider value={theme}>
        <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>切换主题</button>
        <Page />
      </ThemeContext.Provider>
      <ThemedCard title="卡片 C（在 Provider 外面）" />
    </>
  );
}

// 中间层组件：完全不需要知道 theme 的存在
function Page() {
  return <Sidebar />;
}
function Sidebar() {
  return <div><ThemedCard title="卡片 A" /><ThemedCard title="卡片 B" /></div>;
}

// 深层组件：直接读取
function ThemedCard({ title }) {
  const theme = useContext(ThemeContext);
  const style = theme === 'dark'
    ? { background: '#1e2a30', color: '#e6f1f5' }
    : { background: '#f2f6f8', color: '#14222a' };
  return <div style={{ ...style, padding: 12, margin: 6, borderRadius: 8 }}>{title}：当前是 {theme} 主题</div>;
}`, '主题切换', 'Page 和 Sidebar 没有接收任何 theme prop，卡片 A 和 B 却能读到。卡片 C 在 Provider 外面，useContext 找不到上层的 Provider，只能读到 createContext 的默认值 light。切换主题只改变 Provider 的 value，影响不到它。'),
    h('Context + State：可修改的全局数据'),
    p('Context 本身只是“传递”数据的通道。把 state 和修改它的函数一起放进 value，后代组件就既能读也能改。下面把 state 和 Provider 一起封装成 <code>CartProvider</code> 组件，后代组件直接用 <code>useContext(CartContext)</code> 读取：'),
    play(`
import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const add = (name) => setItems(list => [...list, name]);
  const clear = () => setItems([]);
  return (
    <CartContext.Provider value={{ items, add, clear }}>
      {children}
    </CartContext.Provider>
  );
}

function Header() {
  const { items } = useContext(CartContext);
  return <h3>🛒 购物车（{items.length}）</h3>;
}

function Product({ name }) {
  const { add } = useContext(CartContext);
  return <button onClick={() => add(name)}>加入 {name}</button>;
}

function App() {
  return (
    <CartProvider>
      <Header />
      <Product name="键盘" />
      <Product name="鼠标" />
      <ClearButton />
    </CartProvider>
  );
}

function ClearButton() {
  const { clear } = useContext(CartContext);
  return <button onClick={clear}>清空</button>;
}`, '购物车 Context'),
    deep('真实项目常再写一个 <code>useCart()</code> 函数：里面调用 <code>useContext(CartContext)</code>，找不到 Provider 时抛出错误，提醒“必须在 CartProvider 里使用”。这种以 use 开头、内部调用 Hook 的函数叫自定义 Hook。第 15 课会讲它，学完可以回来看这个写法。'),
    warn('<b>Context 的 value 变化时，所有读取它的组件都会重新渲染</b>。不要把变化频繁、又互不相关的数据都塞进一个巨大的 Context。解决方法：拆成多个 Context，例如把数据和修改数据的函数分开；或使用专门的状态管理库。'),
    tip('Context 适合<b>变化不频繁的“全局”数据</b>：主题、语言、当前用户、权限。对于只隔了两三层的数据，直接传 props 往往更清晰。'),
  ],
  quiz: [
    { q: '两个 ThemeContext.Provider 嵌套：外层 value="light"，内层 value="dark"。内层里面的组件调用 useContext(ThemeContext)，读到什么？', options: ['"light"：最外层的 Provider 说了算', '"dark"：离它最近的 Provider 说了算', 'createContext 时写的默认值', '报错：同一个 Context 不能嵌套提供'], answer: 1, explain: 'React 从组件往上找，用最近的那个 Provider 的 value；一个都找不到时才用默认值。最迷惑的是第一项：Provider 可以嵌套，内层会覆盖外层，常用来给某一块区域换主题。' },
    { q: '一个 Context 的 value 里同时放了“当前用户”和“每秒变化多次的鼠标坐标”。会有什么问题？', options: ['坐标一变，只读用户的组件也会重新渲染', 'value 里不能放对象，只能放字符串', '读用户的组件拿不到最新的用户', '没问题：React 只重新渲染用到坐标的组件'], answer: 0, explain: 'value 变了，所有读取这个 Context 的组件都会重新渲染，不管它用的是哪个字段。最迷惑的是最后一项：React 不按字段追踪。解决方法：拆成两个 Context。' },
    { q: '<code>const UserContext = createContext(\'游客\')</code>。App 渲染 <code>&lt;Welcome /&gt;</code> 和 <code>&lt;UserContext.Provider value="小李"&gt;…&lt;/UserContext.Provider&gt;</code>，第一个 Welcome 在 Provider 外面。它读到什么？', options: ['"游客"', '"小李"', 'undefined', '报错：找不到 Provider'], answer: 0, explain: '它上面没有 Provider，所以用默认值。最迷惑的是“小李”：Provider 只对它包住的子树生效，兄弟组件读不到。' },
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
    }
  }
});

/* ---------- 13 ---------- */
lesson({
  id: 'use-reducer', stage: 1, title: 'useReducer：集中管理复杂状态', mins: 17,
  summary: '当状态更新逻辑变复杂时，把它们集中到一个 reducer 函数里。',
  goals: ['能说出 action、reducer、dispatch 各自负责什么', '能把分散在多个事件处理函数里的 state 更新，改写成一个 reducer', '能写出纯的 reducer：返回新对象，不修改旧 state，不发请求', '能根据场景在 useState 和 useReducer 之间做选择'],
  keyPoints: [
    'reducer 把所有“state 怎么变”的逻辑集中到一个纯函数：<code>(state, action) =&gt; 新 state</code>。',
    '组件只调用 <code>dispatch({ type: \'added\', … })</code>，描述“发生了什么”。React 调用 reducer 算出新 state。',
    'reducer 必须纯：返回新对象，不修改旧 state，不发请求，不用随机数或 Date.now()。需要这些值时，先算好再放进 action。',
    '简单的独立值用 useState；多个相关的值一起变、更新种类多时，用 useReducer。',
  ],
  body: [
    p('有的组件有很多种修改 state 的方式，例如添加、删除、编辑、切换、清空。这些逻辑分散在多个事件处理函数里，代码会越来越难维护。<code>useReducer</code> 让你把所有“状态如何变化”的逻辑<b>集中到一个纯函数</b>里。'),
    code(`const [state, dispatch] = useReducer(reducer, initialState);

// reducer：接收旧状态和一个“动作”，返回新状态
function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    default: return state;
  }
}

// 组件中只需要“派发”动作，描述发生了什么
dispatch({ type: 'increment' });`),
    like('reducer 像银行柜台。你不能自己进金库拿钱。你填一张单子（action：“取款 100 元”），交给柜员（dispatch）。柜员按规定流程（reducer）更新账户（state）。所有账户变动都遵守同一套规则。'),
    play(`
import { useReducer, useState } from 'react';

const initialTodos = [
  { id: 1, text: '学习 useReducer', done: false },
  { id: 2, text: '喝杯咖啡', done: true },
];

let nextId = 3; // 放在组件外

function todosReducer(todos, action) {
  switch (action.type) {
    case 'added':
      return [...todos, { id: action.id, text: action.text, done: false }];
    case 'toggled':
      return todos.map(t => t.id === action.id ? { ...t, done: !t.done } : t);
    case 'deleted':
      return todos.filter(t => t.id !== action.id);
    case 'clearedDone':
      return todos.filter(t => !t.done);
    default:
      throw new Error('未知的 action: ' + action.type);
  }
}

function App() {
  const [todos, dispatch] = useReducer(todosReducer, initialTodos);
  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!text) return;
    dispatch({ type: 'added', id: nextId++, text });
    setText('');
    console.log('todos.length =', todos.length);
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="新待办" />
        <button>添加</button>
      </form>
      <ul>
        {todos.map(t => (
          <li key={t.id}>
            <label style={{ textDecoration: t.done ? 'line-through' : 'none' }}>
              <input type="checkbox" checked={t.done} onChange={() => dispatch({ type: 'toggled', id: t.id })} />
              {t.text}
            </label>
            <button onClick={() => dispatch({ type: 'deleted', id: t.id })}>删除</button>
          </li>
        ))}
      </ul>
      <button onClick={() => dispatch({ type: 'clearedDone' })}>清除已完成</button>
    </div>
  );
}`, '待办清单 reducer', '控制台打印的是添加之前的长度。dispatch 和 set 函数一样，只是请求 React 用新的 state 重新渲染。这次渲染里的 todos 是一个快照，不会在 dispatch 之后立刻改变。'),
    h('useState 还是 useReducer？'),
    table(['场景', '推荐'], [
      ['简单的独立值（开关、输入框文本、数字）', 'useState'],
      ['多个相互关联的状态需要一起变化', 'useReducer'],
      ['更新逻辑复杂、种类多', 'useReducer'],
      ['需要单独测试状态逻辑', 'useReducer（reducer 是纯函数，极易测试）'],
    ]),
    tip('reducer 必须是<b>纯函数</b>。同样的输入必须得到同样的输出。reducer 不发请求，不修改原来的 state，不使用随机数或 Date.now()。所以上例在 dispatch 之前生成 id，再放进 action。'),
    deep('useReducer 和下一课的 Context 可以组合使用，学完 Context 可以回来看这一段。把 state 和 dispatch 分别放进两个 Context。这样，任何深层组件都能读取 state 和派发 action。这正是 Redux 的核心思想，只不过用的是 React 内置能力。'),
  ],
  quiz: [
    { q: '改用 useReducer 后，点击“删除”按钮时，组件应该怎么请求更新？', options: ['调用 dispatch({ type: \'deleted\', id })', '直接调用 todosReducer(todos, action)', '用 todos.splice 删掉那一项', '再声明一个 set 函数，传入新数组'], answer: 0, explain: '组件只派发描述“发生了什么”的 action，由 React 调用 reducer 算出新 state。最迷惑的是第二项：自己调用 reducer 只会得到一个返回值，React 不知道，界面不会更新。' },
    { q: '下列哪项不应该出现在 reducer 中？', options: ['用 switch 判断 action.type', '用 Date.now() 给新待办生成 id', '返回一个新数组', '遇到未知的 action 时抛出错误'], answer: 1, explain: 'reducer 必须是纯函数：同样的输入，同样的输出。Date.now() 每次都不同，所以要在 dispatch 之前生成，再放进 action。发请求也一样，放在事件处理函数里。最迷惑的是最后一项：抛出错误不改变任何外部的东西，它是纯的，还能帮你尽早发现拼错的 action。' },
    { q: 'reducer 里写 <code>case \'increment\': state.count++; return state;</code>。点“加”之后界面会怎样？', options: ['不变，因为返回的还是同一个对象', '正常加 1', '加 2，因为改了两次', '报错：reducer 收到的 state 是只读对象，不能修改'], answer: 0, explain: 'React 用 Object.is 比较新旧 state。返回同一个对象，就判定“没变”，跳过渲染。最迷惑的是“正常加 1”：值确实改了，但 React 不知道。要返回新对象：return { count: state.count + 1 }。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>在 reducer 中用 <code>switch (action.type)</code> 区分 action。</li><li><code>increment</code>：count 加 1。</li><li><code>decrement</code>：count 减 1。</li><li><code>reset</code>：count 变为 0。</li><li>每个分支都返回一个新对象。按钮已经写好。</li></ol>',
    starter: `import { useReducer } from 'react';

function reducer(state, action) {
  // 在这里实现
  return state;
}

function App() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <div>
      <p id="count">{state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>加</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>减</button>
      <button onClick={() => dispatch({ type: 'reset' })}>重置</button>
    </div>
  );
}`,
    solution: `import { useReducer } from 'react';

function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'decrement': return { count: state.count - 1 };
    case 'reset': return { count: 0 };
    default: return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <div>
      <p id="count">{state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>加</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>减</button>
      <button onClick={() => dispatch({ type: 'reset' })}>重置</button>
    </div>
  );
}`,
    hint: '用 <code>switch (action.type)</code>，每个分支返回一个新对象，例如 <code>return { count: state.count + 1 }</code>。',
    faded: `import { useReducer } from 'react';

function reducer(state, action) {
  switch (action.type) {
    case 'increment': /* ✏️ 返回一个新对象：count 加 1 */
    case 'decrement': /* ✏️ 返回一个新对象：count 减 1 */
    case 'reset': /* ✏️ 返回一个新对象：count 为 0 */
    default: return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <div>
      <p id="count">{state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>加</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>减</button>
      <button onClick={() => dispatch({ type: 'reset' })}>重置</button>
    </div>
  );
}`,
    test: async (t) => {
      const c = () => t.text('#count');
      const add = t.byText('button', '加'), sub = t.byText('button', '减'), rst = t.byText('button', '重置');
      await t.click(add); await t.click(add); await t.click(add);
      t.assert(c() === '3', `加 3 次后应为 3，实际是 ${c()}`);
      await t.click(sub); t.assert(c() === '2', '减 1 次后应为 2');
      await t.click(rst); t.assert(c() === '0', '重置后应为 0');
    }
  }
});

/* ---------- 14 ---------- */
lesson({
  id: 'custom-hooks', stage: 1, title: '自定义 Hook：复用逻辑', mins: 19,
  summary: '把组件中的状态逻辑抽取成以 use 开头的函数，在多个组件间复用。',
  goals: ['能说出 Hooks 的两条规则，并找出违反规则的代码', '能把几个组件里重复的状态逻辑抽成一个自定义 Hook', '能解释两个组件调用同一个自定义 Hook 时，state 为什么互相独立', '能为自定义 Hook 设计参数和返回值'],
  keyPoints: [
    '两条规则：只在最顶层调用 Hook；只在函数组件或自定义 Hook 里调用。React 按调用顺序识别每个 Hook。',
    '自定义 Hook 是名字以 use 加大写字母开头、内部调用其他 Hook 的函数。',
    '它共享的是逻辑，不是 state：每个组件每调用一次，都有一份独立的 state。',
    '常见用法：把 useState 和 useEffect 的组合（窗口宽度、请求数据、localStorage）封装起来，组件只拿结果。',
  ],
  body: [
    h('先记住 Hooks 的两条规则'),
    ul(['<b>只在最顶层调用 Hook</b>：不要在 if、for、嵌套函数中调用。', '<b>只在 React 函数中调用 Hook</b>：即函数组件或自定义 Hook 中。']),
    deep('为什么不能放在 if 里？因为 React <b>按调用顺序</b>识别每个 Hook。第 1 个 useState 是 1 号，第 2 个是 2 号，依此类推。React 用一个链表，按顺序保存每个 Hook 的 state。如果某次渲染跳过了一个 Hook，后面所有 Hook 的顺序都会错位，读到别人的状态。第 30 课会亲手实现这个机制。'),
    warn('你可能看到的报错：<code>Rendered more hooks than during the previous render.</code>（或 <code>Rendered fewer hooks than expected</code>）<br>原因：这次渲染调用的 Hook 数量和上次不同。<br>去看：有没有 Hook 写在 if、循环里，或者写在提前 return 之后。把它们移到组件最上面。'),
    h('什么是自定义 Hook'),
    p('自定义 Hook 就是一个<b>名字以 use 加大写字母开头、内部调用了其他 Hook 的普通函数</b>。当你发现几个组件里有相同的状态逻辑时，就可以把它抽出来。'),
    play(`
import { useState, useEffect } from 'react';

// 自定义 Hook：追踪窗口宽度
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}

// 自定义 Hook：开关
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn(o => !o);
  return [on, toggle];
}

// 自定义 Hook：与 localStorage 同步的 state
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try { const s = localStorage.getItem(key); return s !== null ? JSON.parse(s) : initial; }
    catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}

function App() {
  const width = useWindowWidth();
  const [showDetail, toggleDetail] = useToggle();
  const [note, setNote] = useLocalStorage('demo-note', '');

  return (
    <div>
      <p>窗口宽度：{width}px（{width < 600 ? '手机' : '桌面'}布局）</p>
      <button onClick={toggleDetail}>{showDetail ? '收起' : '展开'}详情</button>
      {showDetail && <p>这里是详情内容……</p>}
      <p><input value={note} onChange={e => setNote(e.target.value)} placeholder="输入后刷新页面，内容还在" /></p>
    </div>
  );
}`, '三个实用的自定义 Hook', '调整浏览器窗口大小试试看。'),
    tip('<b>自定义 Hook 共享的是逻辑，不是状态</b>。两个组件都调用 <code>useToggle()</code>，它们各自拥有独立的 on 状态，互不影响。就像两个人用同一份菜谱，做出的是两盘菜。'),
    h('一个更完整的例子：useFetch'),
    code(`function useFetch(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch(url)
      .then(res => {
        // fetch 遇到 404、500 不会报错，要自己检查
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(json => { if (!ignore) { setData(json); setError(null); } })
      .catch(err => { if (!ignore) setError(err); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [url]);

  return { data, error, loading };
}

// 使用：组件变得极其简洁
function UserList() {
  const { data, loading, error } = useFetch('/api/users');
  if (loading) return <p>加载中…</p>;
  if (error) return <p>出错了</p>;
  return <ul>{data.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}`, '把请求逻辑封装成 Hook'),
    p('真实项目通常用 TanStack Query 或 SWR 请求数据。这些库本质上是功能完善的自定义 Hook。它们增加了缓存、重试和去重。'),
  ],
  quiz: [
    { q: '下面哪种写法违反了 Hooks 规则？', options: ['在组件顶层调用 useState', 'if (show) { useEffect(...) }', '在自定义 Hook 中调用 useState', '在组件里调用自定义 Hook'], answer: 1, explain: '不能在条件语句中调用 Hook，否则 show 变化时 Hook 的调用顺序会变。最迷惑的是第三项：自定义 Hook 本来就是“在函数里调用 Hook”，只要它自己在组件顶层被调用，就是合法的。' },
    { q: '组件 A 和 B 都调用了 useCounter()。A 中计数增加，B 的计数会怎样？', options: ['同步增加，因为两个组件调用的是同一个 useCounter 函数', '不变，每次调用 Hook 都有自己的 state', '要等 B 下一次重新渲染才同步', '只有两个组件写在同一个文件里才同步'], answer: 1, explain: '自定义 Hook 复用的是逻辑，不是 state。每次调用里的 useState 都创建一份独立的 state。最迷惑的是第一项：想共享同一份数据，要做状态提升或用 Context。' },
    { q: '同事写了 <code>function getCounter() { const [n, setN] = useState(0); … }</code>，在组件顶层调用它，能正常运行。为什么还要把它改名为 <code>useCounter</code>？', options: ['React 和 lint 工具靠“use + 大写字母”开头的名字认出 Hook，才会检查它有没有被写进 if 或循环', '没有实际作用，只是团队的命名习惯', '改名后，调用它的几个组件会共享同一份 n', '改名后 React 会把它当成组件，单独渲染一次'], answer: 0, explain: '名字是工具识别 Hook 的唯一依据。叫 getCounter 时，有人把它写进 if 里，lint 不会报错，运行时 Hook 顺序就会错乱。最迷惑的是第二项：今天能运行，不代表以后改代码时不出错。第三项也不对：改名不会改变“每次调用各有一份 state”。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li><code>Likes</code> 和 <code>Stock</code> 里有重复的计数逻辑。把它抽成自定义 Hook <code>useCounter(initial)</code>。</li><li>useCounter 用 <code>useState(initial)</code> 保存 count，并定义 <code>inc</code>（加 1）、<code>dec</code>（减 1）、<code>reset</code>（恢复为 initial）。</li><li>返回 <code>{ count, inc, dec, reset }</code>。</li><li>改写 Likes 和 Stock：删掉它们自己的 useState，改为调用 <code>useCounter(0)</code> 和 <code>useCounter(10)</code>。</li><li>两个组件的计数必须互相独立。</li></ol>',
    starter: `import { useState } from 'react';

function useCounter(initial = 0) {
  // 在这里实现：返回 { count, inc, dec, reset }
  return { count: initial, inc: () => {}, dec: () => {}, reset: () => {} };
}

function Likes() {
  const [count, setCount] = useState(0);
  return (
    <p>
      👍 <span id="likes">{count}</span>
      <button id="likes-inc" onClick={() => setCount(c => c + 1)}>赞</button>
      <button id="likes-reset" onClick={() => setCount(0)}>清零</button>
    </p>
  );
}

function Stock() {
  const [count, setCount] = useState(10);
  return (
    <p>
      📦 库存 <span id="stock">{count}</span>
      <button id="stock-dec" onClick={() => setCount(c => c - 1)}>卖出一件</button>
      <button id="stock-reset" onClick={() => setCount(10)}>补满</button>
    </p>
  );
}

function App() {
  return <div><Likes /><Stock /></div>;
}`,
    solution: `import { useState } from 'react';

function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const inc = () => setCount(c => c + 1);
  const dec = () => setCount(c => c - 1);
  const reset = () => setCount(initial);
  return { count, inc, dec, reset };
}

function Likes() {
  const { count, inc, reset } = useCounter(0);
  return (
    <p>
      👍 <span id="likes">{count}</span>
      <button id="likes-inc" onClick={inc}>赞</button>
      <button id="likes-reset" onClick={reset}>清零</button>
    </p>
  );
}

function Stock() {
  const { count, dec, reset } = useCounter(10);
  return (
    <p>
      📦 库存 <span id="stock">{count}</span>
      <button id="stock-dec" onClick={dec}>卖出一件</button>
      <button id="stock-reset" onClick={reset}>补满</button>
    </p>
  );
}

function App() {
  return <div><Likes /><Stock /></div>;
}`,
    exports: ['useCounter'],
    hint: '先写 useCounter：它就是把 Likes 里的 useState 和几个更新函数原样搬进去，再把它们放进一个对象返回。然后让两个组件从 useCounter 的返回值里解构出自己要用的那几个。',
    faded: `import { useState } from 'react';

function useCounter(initial = 0) {
  /* ✏️ 用 useState 保存 count，初始值是 initial */
  const inc = () => setCount(c => c + 1);
  const dec = () => setCount(c => c - 1);
  /* ✏️ 定义 reset：把 count 恢复为 initial */
  return { count, inc, dec, reset };
}

function Likes() {
  /* ✏️ 调用 useCounter，初始值 0，解构出 count、inc、reset */
  return (
    <p>
      👍 <span id="likes">{count}</span>
      <button id="likes-inc" onClick={inc}>赞</button>
      <button id="likes-reset" onClick={reset}>清零</button>
    </p>
  );
}

function Stock() {
  const { count, dec, reset } = useCounter(10);
  return (
    <p>
      📦 库存 <span id="stock">{count}</span>
      <button id="stock-dec" onClick={dec}>卖出一件</button>
      <button id="stock-reset" onClick={reset}>补满</button>
    </p>
  );
}

function App() {
  return <div><Likes /><Stock /></div>;
}`,
    test: async (t) => {
      const useCounter = t.exports.useCounter;
      t.assert(typeof useCounter === 'function', '请保留名为 useCounter 的函数');
      // 单独测试 Hook 本身：在一个探针组件里调用它
      let api = null;
      const Probe = () => { api = useCounter(5); return null; };
      const box = document.createElement('div');
      const root = ReactDOM.createRoot(box);
      try {
        ReactDOM.flushSync(() => root.render(React.createElement(Probe)));
        t.assert(api && api.count === 5, `useCounter(5) 返回的 count 应为 5，实际是 ${api && api.count}。count 要用 useState(initial) 保存`);
        t.assert(['inc', 'dec', 'reset'].every(k => typeof api[k] === 'function'), 'useCounter 应返回 { count, inc, dec, reset }，其中 inc、dec、reset 都是函数');
        ReactDOM.flushSync(() => api.inc()); ReactDOM.flushSync(() => api.inc());
        t.assert(api.count === 7, `调用两次 inc 后应为 7，实际是 ${api.count}`);
        ReactDOM.flushSync(() => api.dec());
        t.assert(api.count === 6, `再调用一次 dec 后应为 6，实际是 ${api.count}`);
        ReactDOM.flushSync(() => api.reset());
        t.assert(api.count === 5, `调用 reset 后应恢复为初始值 5，实际是 ${api.count}。reset 要设回 initial，不是 0`);
      } finally { root.unmount(); }
      // 只看 Likes 和 Stock 两个函数的代码：它们要调用 useCounter，不再自己调用 useState。useCounter 内部怎么写不限制
      const bodyOf = (name) => {
        const m = new RegExp('^[ \\t]*(?:export\\s+)?(?:function\\s+' + name + '\\b|(?:const|let|var)\\s+' + name + '\\s*=)', 'm').exec(t.source);
        if (!m) return null;
        const rest = t.source.slice(m.index + m[0].length);
        const end = rest.search(/^(?:export\s+)?(?:function|const|let|var|class)\s/m);
        return end < 0 ? rest : rest.slice(0, end);
      };
      for (const [name, init] of [['Likes', 0], ['Stock', 10]]) {
        const body = bodyOf(name);
        t.assert(body != null, `找不到组件 ${name}。请保留它的名字`);
        t.assert(/\buseCounter\s*\(/.test(body), `${name} 里没有调用 useCounter。请把它自己的计数逻辑换成 useCounter(${init})`);
        t.assert(!/\b(useState|useReducer)\s*\(/.test(body), `${name} 里还直接调用了 useState。计数逻辑应只写在 useCounter 里一次，${name} 只调用 useCounter(${init})`);
      }
      t.assert(t.text('#likes') === '0' && t.text('#stock') === '10', `初始值应分别为 0 和 10，实际是 ${t.text('#likes')} 和 ${t.text('#stock')}`);
      await t.click('#likes-inc'); await t.click('#likes-inc'); await t.click('#stock-dec');
      t.assert(t.text('#likes') === '2', `点两次“赞”后应为 2，实际是 ${t.text('#likes')}`);
      t.assert(t.text('#stock') === '9', `点一次“卖出一件”后库存应为 9，实际是 ${t.text('#stock')}。两个组件的计数应互相独立`);
      await t.click('#likes-reset');
      t.assert(t.text('#likes') === '0' && t.text('#stock') === '9', '点“清零”只应清零点赞数，库存应保持 9');
      await t.click('#stock-reset');
      t.assert(t.text('#stock') === '10', `点“补满”后库存应恢复为 10，实际是 ${t.text('#stock')}`);
    }
  }
});
