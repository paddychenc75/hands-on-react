/* ========== 课程内容 · 第三阶段：高级 ========== */

/* ---------- 15 ---------- */
lesson({
  id: 'rendering', stage: 2, title: '渲染机制：React 到底做了什么', mins: 22,
  summary: '理解触发、渲染、提交三个阶段，以及虚拟 DOM 与协调算法。',
  goals: ['能解释“渲染”和“更新 DOM”的区别', '能判断一次更新会让哪些组件重新渲染', '能根据位置、类型和 key 预测 state 是保留还是丢失', '能用“把 state 下移”减少不必要的渲染'],
  keyPoints: [
    '一次更新分三步：触发 → 渲染 → 提交。渲染只是调用组件函数并算出差异，提交才修改 DOM。',
    '组件的 state 变化时，它和它的全部后代都会重新渲染。props 没变的子组件也一样，除非用了 memo。',
    'React 按“树中的位置 + 元素类型”保存 state。位置和类型不变，state 保留；类型变了或 key 变了，state 被丢弃。',
    '最常见的坑：在组件内部定义组件。每次渲染它都是新类型，state 和焦点都会丢失。',
    '先试结构性优化：把 state 下移到真正用它的小组件里，其他组件就不会跟着重新渲染。',
  ],
  body: [
    p('很多性能问题和奇怪的 bug 都有同一个根源。那就是没搞清楚 React 的渲染过程。这一课我们打开引擎盖看一看。'),
    h('三个阶段：触发 → 渲染 → 提交'),
    fig(`<div class="steps"><div class="step"><b>① 触发 Trigger</b><span>首次挂载，或某个组件的 state 被更新</span></div><div class="step"><b>② 渲染 Render</b><span>React 调用组件函数，得到新的 React 元素树，与上一次对比算出差异</span></div><div class="step"><b>③ 提交 Commit</b><span>只把<em>差异</em>应用到真实 DOM，然后运行 effect</span></div></div>`, '在 React 里，“渲染”指的是调用你的组件函数，并不等于修改页面'),
    like('像餐厅点菜。顾客点单，这是触发。厨师在后厨做菜，这是渲染，只做计算，可以重做。服务员把菜端上桌，这是提交，真正改变外部世界。'),
    h('什么会触发重新渲染？'),
    ul(['组件自己的 <b>state 变化</b>', '<b>父组件重新渲染</b>（默认情况下，所有子组件也会跟着重新渲染，不管 props 有没有变！）', '它读取的 <b>Context 值变化</b>']),
    p('还有两个细节：'),
    p('<ol class="task-steps"><li><b>自动批处理</b>：同一个事件中多次调用 set 函数，只触发一次渲染。React 18 起，setTimeout 和 Promise 回调中也是这样。</li><li><b>同值跳过</b>：新值与旧值用 <code>Object.is</code> 比较相等时，React 跳过这次更新。</li></ol>'),
    warn('一个常见误解是“props 变了组件才会重新渲染”。实际上，<b>父组件渲染时，子组件默认一律重新渲染</b>。React 在渲染阶段算出差异，提交阶段只修改变化的 DOM。所以多数时候这并不会造成问题。只有当子组件非常“重”时，才需要用下一课的 memo 来优化。'),
    p('下面的演示会让每次渲染的组件<b>闪烁</b>一下。点击不同的按钮，观察哪些组件被重新渲染：'),
    play(`
import { useState, useRef, useEffect } from 'react';

// 一个会在每次渲染后闪烁的小盒子
function Box({ name, children }) {
  const ref = useRef(null);
  const count = useRef(0);
  count.current++; // 仅用于演示计数：正式代码不要在渲染时读写 ref
  useEffect(() => {
    const el = ref.current;
    el.animate([{ background: '#ffd36b' }, { background: 'transparent' }], { duration: 600 });
  });
  return (
    <div ref={ref} style={{ border: '1px solid #8aa', borderRadius: 8, padding: 8, margin: 6 }}>
      <b>{name}</b> <small>渲染 {count.current} 次</small>
      {children}
    </div>
  );
}

function Child({ label }) {
  return <Box name={'Child ' + label} />;
}

function Counter() {
  const [n, setN] = useState(0);
  return (
    <Box name="Counter（自带 state）">
      <button onClick={() => setN(n + 1)}>Counter 内部 +1：{n}</button>
    </Box>
  );
}

function App() {
  const [count, setCount] = useState(0);
  return (
    <Box name="App">
      <button onClick={() => setCount(count + 1)}>App 的 state +1：{count}</button>
      <Child label="A" />
      <Child label={'B ' + count} />
      <Counter />
    </Box>
  );
}`, '谁被重新渲染了？', '点 App 的按钮：所有组件都闪烁。Child A 的 props 一直没变，也照样重新渲染。点 Counter 的按钮：只有 Counter 闪烁。'),
    h('虚拟 DOM 与协调（Reconciliation）'),
    p('组件返回的 React 元素树常被称为<b>虚拟 DOM</b>：它是用普通 JS 对象描述的界面结构。每次渲染后，React 对比新树和旧树，找出需要的改动，再修改真实 DOM。这个过程叫<b>协调</b>。'),
    p('完美地比较两棵树，复杂度是 O(n³)。n 是元素数量，n³ 意味着 1000 个元素要比较 10 亿次，太慢了。React 基于两个假设，把它降到了 O(n)，也就是 1000 个元素大约比较 1000 次：'),
    ul(['<b>类型不同的元素会产生完全不同的树</b>。如果 <code>&lt;div&gt;</code> 变成了 <code>&lt;section&gt;</code>，或 <code>&lt;Counter&gt;</code> 变成了 <code>&lt;Timer&gt;</code>，React 会卸载整棵旧子树，丢弃其中所有 state。然后它挂载新的子树。', '<b>通过 key 识别列表中的元素</b>。同一层级中，key 相同就认为是同一个元素。']),
    h('状态与位置绑定'),
    p('这两个假设决定了一件事：组件切换时，它的 state 是保留还是丢弃？先看演示，预测三种情况的结果。'),
    play(`
import { useState } from 'react';

function Counter({ color }) {
  const [n, setN] = useState(0);
  return <button style={{ color }} onClick={() => setN(n + 1)}>{color} 计数：{n}</button>;
}

function App() {
  const [red, setRed] = useState(false);
  return (
    <div>
      <label><input type="checkbox" checked={red} onChange={e => setRed(e.target.checked)} /> 红色</label>
      <h4>情况 1</h4>
      {red ? <Counter color="red" /> : <Counter color="blue" />}
      <h4>情况 2</h4>
      {red ? <div><Counter color="red" /></div> : <section><Counter color="blue" /></section>}
      <h4>情况 3</h4>
      {red ? <Counter key="r" color="red" /> : <Counter key="b" color="blue" />}
    </div>
  );
}`, '状态跟着位置走', '情况 1：同一位置、同一类型，state 保留。情况 2：外层从 section 变成 div，整棵子树重建，state 丢失。情况 3：key 不同，React 把它们当成两个组件，各自的 state 独立。'),
    p('结论：<b>React 根据组件在树中的“位置”来保存它的 state</b>。同一位置渲染同一类型的组件，state 会被保留。位置、类型或 key 变了，state 就会丢失。'),
    warn('<b>永远不要在组件内部定义组件</b>。例如在 App 函数体里写 <code>function Input() {...}</code>。每次 App 渲染，都会创建一个“新类型”的 Input。结果是每次输入后，Input 的 state 和焦点都会丢失。'),
    deep('React 16 起使用名为 <b>Fiber</b> 的新架构来执行协调。它把渲染工作拆成一个个小单元，可以暂停、恢复、按优先级调度，这是并发特性的基础。第 30 课会再讲。'),
  ],
  quiz: [
    { q: '父组件重新渲染时，props 没变的子组件会怎样（未使用 memo）？', options: ['跳过渲染，因为 props 没变', '也会重新渲染', '只更新 DOM，不调用组件函数', '被卸载后重新挂载'], answer: 1, explain: '默认情况下，父组件渲染会带动所有子组件渲染。“props 没变就跳过”是 memo 的行为。没有 memo 时，React 根本不比较 props。' },
    { q: '某位置的元素从 &lt;div&gt;&lt;Counter/&gt;&lt;/div&gt; 变成 &lt;span&gt;&lt;Counter/&gt;&lt;/span&gt;，Counter 的 state？', options: ['保留，因为 Counter 的类型没变', '丢失并重置为初始值', '保留，但 DOM 节点重新创建', '报错'], answer: 1, explain: '父元素类型变了，React 卸载整棵旧子树，再挂载新的子树。Counter 自己的类型没变也没有用：它所在的 div 被卸载了，它也跟着被卸载。' },
    { q: 'App 有 state text。App 函数体里定义了 function Input() { … }，输入框读写 App 的 text。在输入框打一个字，会怎样？', options: ['正常输入，焦点不变', '字被输入，但输入框失去焦点', '字输不进去，输入框一直为空', '只有 Input 重新渲染，App 不受影响'], answer: 1, explain: 'App 每次渲染都创建一个新的 Input 函数。类型变了，React 卸载旧输入框，挂载新输入框，新输入框没有焦点。字能输入进去，因为 text 存在 App 里，新输入框拿到的是最新值。' },
    { q: '一次点击中依次调用 setA(1)、setB(2)、setC(3)。组件渲染几次？', options: ['3 次', '1 次', '1 次，但只有最后的 setC(3) 生效', '在事件处理函数里 1 次；放进 setTimeout 里就是 3 次'], answer: 1, explain: '自动批处理：同一个事件中的多次 set 函数调用合并为一次渲染，三个更新都生效。最后一项是 React 17 的行为。React 18 起，setTimeout 和 Promise 回调里也会批处理。' },
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
    test: async (t) => {
      t.assert(!/memo/i.test(t.source), '这道题请不要使用 memo 或 useMemo');
      const before = t.text('#slow-renders');
      await t.type('#box', 'a'); await t.type('#box', 'ab'); await t.type('#box', 'abc');
      t.assert(t.q('#box').value === 'abc', '输入框要能正常输入');
      t.assert(t.qa('p').some(p => p.textContent.trim() === 'abc'), '输入框下方的 <p> 应显示输入的文字');
      t.assert(t.text('#slow-renders') === before, `打字时 Slow 仍在重新渲染（${before} → ${t.text('#slow-renders')}）。text 的 state 是不是还在 Slow 的父组件里？父组件渲染会带动 Slow 一起渲染`);
    }
  }
});

/* ---------- 16 ---------- */
lesson({
  id: 'performance', stage: 2, title: '性能优化：memo、useMemo、useCallback', mins: 24,
  summary: '跳过不必要的渲染和计算，以及为什么不该到处使用它们。',
  goals: ['能用 memo 让 props 没变的子组件跳过渲染', '能找出让 memo 失效的 props（内联函数、对象、JSX）', '能用 useCallback 和 useMemo 固定引用，并写对依赖', '能判断一次优化值不值得做'],
  keyPoints: [
    '<code>memo</code> 在渲染前浅比较新旧 props。每个 prop 都用 <code>Object.is</code> 判定相等时，跳过这次渲染。',
    '组件每次渲染都会新建函数、对象和 JSX。把它们传给 memo 组件，浅比较判定“变了”，memo 失效。',
    '<code>useCallback</code> 固定函数，<code>useMemo</code> 固定计算结果。它们只在配合 memo 或作为依赖时才有用。',
    '常见坑：<code>useCallback(() =&gt; setX(x + 1), [])</code> 会读到旧的 x。用函数式更新，或把 x 写进依赖。',
    '先用 Profiler 测量，再优化。把 state 下移、把内容作为 children 传入，往往比 memo 更简单。',
  ],
  body: [
    p('上一课我们知道：父组件渲染会带动所有子组件渲染。大多数时候这很快，不用担心。但如果某个子组件渲染代价很高（比如渲染一个几千行的表格），就值得优化了。'),
    h('React.memo：props 没变就跳过'),
    p('<code>memo</code> 包裹一个组件后，React 会在渲染前<b>浅比较</b>新旧 props（逐个属性用 <code>Object.is</code> 比较）。全都相同就跳过这次渲染，直接复用上次的结果。'),
    code(`const ExpensiveList = memo(function ExpensiveList({ items }) {
  // ... 渲染很多内容
});`),
    h('陷阱：每次渲染都会创建新的函数和对象'),
    p('在 JavaScript 中，<code>{} !== {}</code>，<code>(() =&gt; {}) !== (() =&gt; {})</code>。组件每次渲染时，函数体里定义的对象、数组、函数都是<b>全新的</b>。把它们作为 props 传给 memo 组件，浅比较会判断为“变了”，memo 就失效了。JSX 也是对象。把 <code>&lt;p&gt;…&lt;/p&gt;</code> 作为 children 传给 memo 组件，每次也是新引用。'),
    p('这就是 <code>useCallback</code> 和 <code>useMemo</code> 的用武之地：它们能在依赖不变时<b>返回上一次的同一个引用</b>。'),
    code(`// useMemo：记忆化“计算结果”
const sorted = useMemo(() => items.slice().sort(compare), [items]);

// useCallback：记忆化“函数本身”
const handleClick = useCallback(() => { doSomething(id); }, [id]);
// 等价于：useMemo(() => () => { doSomething(id); }, [id])`),
    warn('useCallback 本身不会让任何东西变快。只有两种情况它才有用：<ol class="task-steps"><li>函数传给了 memo 组件。</li><li>函数是某个 effect 或 useMemo 的依赖。</li></ol>其他情况下，它只增加开销。'),
    play(`
import { useState, memo, useCallback, useMemo, useRef } from 'react';

const Child = memo(function Child({ label, onClick, style }) {
  const renders = useRef(0);
  renders.current++; // 仅用于演示计数：正式代码不要在渲染时读写 ref
  return (
    <p style={style}>
      <button onClick={onClick}>{label}</button> 渲染了 {renders.current} 次
    </p>
  );
});

function App() {
  const [count, setCount] = useState(0);

  const fnA = () => console.log('A');
  const fnB = useCallback(() => console.log('B'), []);
  const styleC = useMemo(() => ({ color: 'teal' }), []);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>让父组件渲染：{count}</button>
      <Child label="Child 1" onClick={fnA} />
      <Child label="Child 2" onClick={fnB} style={{ color: 'teal' }} />
      <Child label="Child 3" onClick={fnB} style={styleC} />
    </div>
  );
}`, '哪个 memo 生效了？', '只有 Child 3 的渲染次数保持不变。Child 1 收到的 fnA 每次渲染都是新函数。Child 2 的 onClick 稳定，但 style={{…}} 每次都是新对象。Child 3 的两个 props 都由 useCallback、useMemo 固定，浅比较全部相等，memo 才生效。'),
    h('useMemo：跳过昂贵的重复计算'),
    play(`
import { useState, useMemo } from 'react';

function slowPrimes(max) {
  const start = performance.now();
  const primes = [];
  for (let n = 2; primes.length < max; n++) {
    let ok = true;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) { ok = false; break; }
    if (ok) primes.push(n);
  }
  console.log('计算耗时', (performance.now() - start).toFixed(1), 'ms');
  return primes;
}

function App() {
  const [count, setCount] = useState(20000);
  const [dark, setDark] = useState(false);

  // 只有 count 变化时才重新计算；切换主题不会触发计算
  const primes = useMemo(() => slowPrimes(count), [count]);

  return (
    <div style={{ background: dark ? '#222' : '#fff', color: dark ? '#eee' : '#222', padding: 12 }}>
      <button onClick={() => setDark(!dark)}>切换主题（看控制台，不会重新计算）</button>
      <button onClick={() => setCount(count + 1000)}>多算 1000 个</button>
      <p>第 {count} 个质数是 {primes[primes.length - 1]}</p>
    </div>
  );
}`, 'useMemo 跳过重复计算'),
    h('什么时候该优化？'),
    tip('<b>先测量，再优化</b>。使用 React DevTools 的 Profiler 找出真正慢的组件。memo、useMemo、useCallback 也有成本。它们要比较依赖，还要占用内存。到处使用它们会让代码更难读，收益却很小。'),
    p('在动手 memo 之前，先试试这些<b>更简单的结构性优化</b>：'),
    ul(['<b>状态下移</b>：把 state 放到真正用到它的小组件里（上一课的练习）', '<b>把内容作为 children 传入</b>：children 中的 JSX 在更外层创建。所以包裹组件自己的 state 变化时，children 不会重新渲染', '<b>避免不必要的 effect</b>：不要让 effect 串成链（A 变 → effect 改 B → effect 改 C）。每一环都多一次渲染']),
    deep('<b>React Compiler</b> 1.0 已于 2025 年 10 月发布稳定版。它在编译时自动为组件和值添加记忆化。官方建议新项目依靠它，只在需要精确控制时手写 useMemo 和 useCallback。但理解它们背后的“引用相等”原理依然重要。'),
  ],
  quiz: [
    { q: '父组件每次渲染都传 onClick={() => {...}} 给 memo 子组件，会怎样？', options: ['memo 正常生效，因为函数体没变', 'memo 失效，因为每次都是新函数', 'memo 会深比较函数，只有函数体变了才渲染', '子组件永远不再渲染'], answer: 1, explain: '内联函数每次渲染都是新引用，浅比较认为 props 变了。memo 只比较引用，不看函数体写了什么。用 useCallback 固定它。' },
    { q: 'Child 没有用 memo。父组件用 useCallback 包好 onClick，再传给 Child。父组件渲染时，Child 会怎样？', options: ['跳过渲染', '照样重新渲染', '只在 onClick 变化时渲染', '报错'], answer: 1, explain: '没有 memo，子组件总会随父组件渲染。很多人以为 useCallback 能阻止渲染，其实它只让引用稳定，跳过渲染要靠 memo。' },
    { q: 'App 有 state count，渲染 &lt;Layout&gt;&lt;BigTable /&gt;&lt;/Layout&gt;。Layout 用 {children} 渲染 BigTable，BigTable 没有用 memo。点 App 里的“count +1”时，BigTable 会重新渲染吗？', options: ['不会：BigTable 作为 children 传入，所以总能跳过', '会：App 重新渲染时创建了新的 &lt;BigTable /&gt; 元素', '不会：BigTable 没有 props，没有东西会变', '不会：BigTable 的类型和位置都没变，React 复用上次的渲染结果'], answer: 1, explain: '&lt;BigTable /&gt; 这个元素是 App 创建的。App 重新渲染，就会创建一个新元素，BigTable 跟着渲染。“作为 children 传入”只在 Layout 自己的 state 变化时有用：那时 children 还是同一个对象。最有迷惑性的是“类型和位置没变”：这只决定 state 能不能保留，组件函数照样要调用。没有 memo 时，React 也根本不比较 props。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>观察：点击父组件的按钮时，<code>Child</code> 也重新渲染。</li><li>用 <code>memo</code> 包裹 <code>Child</code>。再点父组件按钮，<code>Child</code> 仍在重新渲染。找出原因：<code>items</code> 和 <code>onPing</code> 每次都是新的吗？</li><li>用 <code>useMemo</code> 固定 <code>items</code>：只在 <code>kw</code> 变化时重新筛选。</li><li>用 <code>useCallback</code> 固定 <code>handlePing</code> 的引用。</li><li>检查结果：点父组件按钮后，<code>#child-renders</code> 不变。输入“瓜”后，列表只剩西瓜和哈密瓜。点击 2 次 ping 后，<code>#pings</code> 是 2。</li></ol>',
    starter: `import { useState, useCallback, useMemo, memo } from 'react';

const FRUITS = ['苹果', '香蕉', '橙子', '葡萄', '西瓜', '哈密瓜'];

let childRenders = 0;
function Child({ items, onPing }) {
  childRenders++;
  return (
    <div>
      <p>子组件：渲染 <span id="child-renders">{childRenders}</span> 次 <button id="ping" onClick={onPing}>ping</button></p>
      <ul id="list">{items.map(x => <li key={x}>{x}</li>)}</ul>
    </div>
  );
}

function App() {
  const [n, setN] = useState(0);
  const [pings, setPings] = useState(0);
  const [kw, setKw] = useState('');
  const items = FRUITS.filter(x => x.includes(kw));
  const handlePing = () => setPings(pings + 1);
  return (
    <div>
      <button id="parent" onClick={() => setN(n + 1)}>父组件 {n}</button>
      <input id="kw" value={kw} onChange={e => setKw(e.target.value)} placeholder="筛选水果，例如 瓜" />
      <Child items={items} onPing={handlePing} />
      <p>收到 <span id="pings">{pings}</span> 次 ping</p>
    </div>
  );
}`,
    solution: `import { useState, useCallback, useMemo, memo } from 'react';

const FRUITS = ['苹果', '香蕉', '橙子', '葡萄', '西瓜', '哈密瓜'];

let childRenders = 0;
const Child = memo(function Child({ items, onPing }) {
  childRenders++;
  return (
    <div>
      <p>子组件：渲染 <span id="child-renders">{childRenders}</span> 次 <button id="ping" onClick={onPing}>ping</button></p>
      <ul id="list">{items.map(x => <li key={x}>{x}</li>)}</ul>
    </div>
  );
});

function App() {
  const [n, setN] = useState(0);
  const [pings, setPings] = useState(0);
  const [kw, setKw] = useState('');
  const items = useMemo(() => FRUITS.filter(x => x.includes(kw)), [kw]);
  const handlePing = useCallback(() => setPings(p => p + 1), []);
  return (
    <div>
      <button id="parent" onClick={() => setN(n + 1)}>父组件 {n}</button>
      <input id="kw" value={kw} onChange={e => setKw(e.target.value)} placeholder="筛选水果，例如 瓜" />
      <Child items={items} onPing={handlePing} />
      <p>收到 <span id="pings">{pings}</span> 次 ping</p>
    </div>
  );
}`,
    hint: 'memo 是一个函数。它接收一个组件，返回一个新组件。memo 用浅比较检查 props：<code>filter</code> 每次返回新数组，箭头函数每次都是新函数，所以还需要 useMemo 和 useCallback。注意两个依赖数组：筛选结果取决于哪个 state？回调里读到的 pings 来自哪一次渲染？',
    faded: `import { useState, useCallback, useMemo, memo } from 'react';

const FRUITS = ['苹果', '香蕉', '橙子', '葡萄', '西瓜', '哈密瓜'];

let childRenders = 0;
const Child = /* ✏️ 用什么把这个组件包起来，让 props 不变时跳过渲染？ */(function Child({ items, onPing }) {
  childRenders++;
  return (
    <div>
      <p>子组件：渲染 <span id="child-renders">{childRenders}</span> 次 <button id="ping" onClick={onPing}>ping</button></p>
      <ul id="list">{items.map(x => <li key={x}>{x}</li>)}</ul>
    </div>
  );
});

function App() {
  const [n, setN] = useState(0);
  const [pings, setPings] = useState(0);
  const [kw, setKw] = useState('');
  /* ✏️ 算出 items：只在 kw 变化时重新筛选，其他时候返回同一个数组 */
  /* ✏️ 定义 handlePing：引用要稳定，而且每次点击都要基于最新的 pings 加 1 */
  return (
    <div>
      <button id="parent" onClick={() => setN(n + 1)}>父组件 {n}</button>
      <input id="kw" value={kw} onChange={e => setKw(e.target.value)} placeholder="筛选水果，例如 瓜" />
      <Child items={items} onPing={handlePing} />
      <p>收到 <span id="pings">{pings}</span> 次 ping</p>
    </div>
  );
}`,
    test: async (t) => {
      t.assert(/\bmemo\s*\(/.test(t.source), '请用 memo 包裹 Child。memo(组件) 返回一个 props 不变时会跳过渲染的新组件');
      const list = () => t.qa('#list li').map(li => li.textContent.trim()).join('、');
      t.assert(list() === '苹果、香蕉、橙子、葡萄、西瓜、哈密瓜', `初始时列表应显示全部 6 种水果，实际是：${list() || '空'}`);
      const before = t.text('#child-renders');
      await t.click('#parent'); await t.click('#parent'); await t.click('#parent');
      t.assert(/父组件\s*3/.test(t.text('#parent')), '父组件按钮应正常计数');
      t.assert(t.text('#child-renders') === before, `点父组件按钮时，Child 仍在重新渲染（${before} → ${t.text('#child-renders')}）。memo 只做浅比较：传给它的 items 和 onPing 每次都是新的吗？数组用 useMemo 固定，函数用 useCallback 固定`);
      await t.type('#kw', '瓜');
      t.assert(list() === '西瓜、哈密瓜', `输入“瓜”后，列表应只剩“西瓜、哈密瓜”，实际是：${list() || '空'}。筛选结果取决于 kw：useMemo 的依赖数组里有 kw 吗？`);
      const after = t.text('#child-renders');
      await t.click('#parent');
      t.assert(t.text('#child-renders') === after, `筛选后再点父组件按钮，Child 又重新渲染了（${after} → ${t.text('#child-renders')}）。items 只应在 kw 变化时变成新数组`);
      await t.click('#ping'); await t.click('#ping');
      t.assert(t.text('#pings') === '2', `点击 2 次 ping 后应为 2，实际是 ${t.text('#pings')}。回调是否读到了旧的 pings？`);
      await t.type('#kw', '');
      t.assert(list() === '苹果、香蕉、橙子、葡萄、西瓜、哈密瓜', `清空输入框后，列表应恢复全部 6 种水果，实际是：${list() || '空'}`);
    }
  }
});

/* ---------- 17 ---------- */
lesson({
  id: 'closures', stage: 2, title: '闭包陷阱与 Effect 依赖', mins: 25,
  summary: '为什么定时器里的 state 总是旧值？彻底理解渲染、闭包与依赖。',
  goals: ['能解释为什么每次渲染都有自己的 props、state 和函数', '能找出 effect 和定时器回调里的“过期闭包”', '能用补全依赖、函数式更新或 ref 修复过期闭包', '能修改代码让 effect 少依赖一个值，而不是直接删掉依赖'],
  keyPoints: [
    '组件每次渲染都会新建一批变量和函数。函数通过闭包记住的是创建它的那次渲染里的值。',
    '过期闭包：effect 只在挂载时运行，它里面的回调就一直读第一次渲染的 state 和 props。',
    '依赖数组要写上 effect 用到的所有 props 和 state。不想依赖某个值，就改代码：用函数式更新、把函数移进 effect，或把常量移到组件外。',
    '长期存在的回调要读最新值，又不想重启 effect，可以用 ref 保存最新值。',
    '常见坑：把组件内定义的对象或函数写进依赖。它每次渲染都是新引用，effect 每次都会重新执行。',
  ],
  body: [
    p('这是从“会用 React”到“精通 React”必须跨过的一道坎。核心规则：<b>每一次渲染，都有自己的 props、state、事件处理函数和 effect</b>。先用一个演示检验这条规则。'),
    play(`
import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  function showLater() {
    setTimeout(() => {
      console.log('打印 count：' + count);
    }, 3000);
  }

  return (
    <div>
      <p>count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={showLater}>3 秒后打印 count</button>
    </div>
  );
}`, '每次渲染都是一张快照', '先点“3 秒后打印”，再快速点几次 +1。控制台打印的是点击时那次渲染的值。'),
    p('组件函数每次执行，都会创建一批新的局部变量和函数。这些函数通过<b>闭包</b>“记住”了创建它们的那次渲染中的值，并且永远不会改变。'),
    p('这不是 bug，而是一种可预测的特性：事件处理函数“属于”它被创建的那次渲染。'),
    h('经典陷阱：effect 中的过期闭包'),
    play(`
import { useState, useEffect } from 'react';

function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <h2>{count}</h2>;
}`, '计数器卡在 1', '数字停在 1。依赖数组“撒谎”了：effect 用到了 count，却没有写进依赖。'),
    p('effect 只在挂载时运行一次。所以 interval 回调中的 <code>count</code> 永远是第一次渲染时的 0。回调每秒都执行 <code>setCount(0 + 1)</code>。'),
    h('三种修复方式'),
    table(['方法', '代码', '评价'], [
      ['① 补全依赖', '<code>}, [count])</code>', '能用，但每秒都要清理并重建定时器'],
      ['② 函数式更新', '<code>setCount(c =&gt; c + 1)</code>', '<b>最佳</b>：不再读取 count，依赖可以为空'],
      ['③ useReducer', '<code>dispatch({ type: \'tick\' })</code>', '适合逻辑依赖多个状态时，dispatch 引用永远稳定'],
    ]),
    tip('减少依赖时，不要直接删掉依赖数组里的值。正确的做法是<b>修改代码，让 effect 不再需要那个值</b>。常用方法有三个：<ol class="task-steps"><li>使用函数式更新。</li><li>把函数移到 effect 内部。</li><li>把不依赖 props 和 state 的对象移到组件外部。</li></ol>'),
    h('用 ref 读取最新值'),
    p('有时，长期存在的回调需要读取最新的值。但你不想让这个值触发 effect 重新执行。这时可以用 ref 保存最新值：'),
    code(`const latestCount = useRef(count);
useEffect(() => { latestCount.current = count; }); // 每次渲染后同步

useEffect(() => {
  const id = setInterval(() => {
    console.log('最新的 count:', latestCount.current);
  }, 1000);
  return () => clearInterval(id);
}, []); // 依赖为空，但能读到最新值`),
    deep('React 19.2 起提供 <code>useEffectEvent</code>。它从 effect 中提取不应成为依赖的逻辑，总能读到最新的 props 和 state。限制有两条：<ol class="task-steps"><li>只能在 effect 内部调用。</li><li>不要把它放进依赖数组。</li></ol>在 19.2 及以上版本中，它可以代替上面的 ref 方案。'),
    h('对象和函数作为依赖'),
    warn('在组件内定义的对象或函数，每次渲染都是新引用。把它放进依赖数组后，effect 会<b>每次渲染都执行</b>。如果 effect 里又调用 set 函数，就会<b>无限循环</b>。解决方法：把它移到组件外部，或移到 effect 内部，或用 useMemo、useCallback 固定它的引用。'),
  ],
  quiz: [
    { q: 'interval 回调改成 setCount(c => c + 1); console.log(count)，依赖仍为 []。控制台每秒打印什么？', options: ['1, 2, 3…', '一直是 0', '一直是 1', 'undefined'], answer: 1, explain: '函数式更新修好了计数，屏幕上的数字会增长。但回调里的 count 仍是第一次渲染的快照，所以一直打印 0。选 1, 2, 3… 的人以为“界面在变，回调读到的值也在变”，其实回调从来没有被重新创建。' },
    { q: 'effect 依赖为 []，interval 回调中写 setCount(count + 1)，计数停在 1。最好的修复是？', options: ['把依赖改成 [count]', '改为 setCount(c => c + 1)，依赖保持 []', '删除依赖数组', '用 ref 保存最新的 count，回调里读 ref.current'], answer: 1, explain: '函数式更新不再读取 count，effect 就不需要依赖它，定时器只创建一次。改成 [count] 也能工作，但每秒都要清理并重建定时器。删除依赖数组更糟：每次渲染都重建。ref 方案能用，但这里没必要绕远。' },
    { q: 'effect 依赖了一个在组件内定义的对象 options = { roomId }。会怎样？', options: ['只在 options 的内容变化时执行', '每次渲染都执行', '只在挂载时执行一次', 'React 报错：依赖不能是对象'], answer: 1, explain: '依赖用 Object.is 比较。options 每次渲染都是新对象，永远“不相等”，所以 effect 每次都执行。最常见的误解是第一项：React 不会深比较对象内容。修法：把对象移进 effect，依赖写 roomId。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>运行代码，观察两个 bug：消息列表停在 1 条；点“旅行”后，收到的仍是“综合”的消息。</li><li>让消息不断累积。</li><li>切换房间时，断开旧房间，连接新房间。</li><li>切换房间后，保留已经收到的消息，只在后面追加新房间的消息。</li><li>收到新消息时，不要重新连接服务器。</li></ol>',
    starter: `import { useState, useEffect } from 'react';

// —— 模拟聊天服务器（不用修改）：连接后每 0.2 秒推送一条本房间的消息 ——
const server = { connects: 0, open: 0 };
function createConnection(roomId) {
  let timer = null, handler = null, n = 0;
  return {
    on(event, fn) { handler = fn; },
    connect() {
      server.connects++; server.open++;
      timer = setInterval(() => handler && handler('[' + roomId + '] 第 ' + (++n) + ' 条'), 200);
    },
    disconnect() { clearInterval(timer); server.open--; },
  };
}

function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on('message', (text) => {
      setMessages([...messages, text]);
    });
    conn.connect();
    return () => conn.disconnect();
  }, []);
  return (
    <ul id="log" style={{ maxHeight: 120, overflow: 'auto' }}>
      {messages.map((m, i) => <li key={i}>{m}</li>)}
    </ul>
  );
}

function App() {
  const [roomId, setRoomId] = useState('综合');
  return (
    <div>
      <button id="general" onClick={() => setRoomId('综合')}>综合</button>
      <button id="travel" onClick={() => setRoomId('旅行')}>旅行</button>
      <p>当前房间：{roomId}</p>
      <ChatRoom roomId={roomId} />
    </div>
  );
}`,
    solution: `import { useState, useEffect } from 'react';

// —— 模拟聊天服务器（不用修改）：连接后每 0.2 秒推送一条本房间的消息 ——
const server = { connects: 0, open: 0 };
function createConnection(roomId) {
  let timer = null, handler = null, n = 0;
  return {
    on(event, fn) { handler = fn; },
    connect() {
      server.connects++; server.open++;
      timer = setInterval(() => handler && handler('[' + roomId + '] 第 ' + (++n) + ' 条'), 200);
    },
    disconnect() { clearInterval(timer); server.open--; },
  };
}

function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on('message', (text) => {
      setMessages(m => [...m, text]);
    });
    conn.connect();
    return () => conn.disconnect();
  }, [roomId]);
  return (
    <ul id="log" style={{ maxHeight: 120, overflow: 'auto' }}>
      {messages.map((m, i) => <li key={i}>{m}</li>)}
    </ul>
  );
}

function App() {
  const [roomId, setRoomId] = useState('综合');
  return (
    <div>
      <button id="general" onClick={() => setRoomId('综合')}>综合</button>
      <button id="travel" onClick={() => setRoomId('旅行')}>旅行</button>
      <p>当前房间：{roomId}</p>
      <ChatRoom roomId={roomId} />
    </div>
  );
}`,
    hint: '两个 bug 都是过期闭包。1. 消息回调里的 <code>messages</code> 来自哪一次渲染？能不能不读它就追加一条？2. effect 用到了 <code>roomId</code>，依赖数组写了吗？依赖变化时，React 会先运行上一次的清理函数，再运行新的 effect。',
    faded: `import { useState, useEffect } from 'react';

// —— 模拟聊天服务器（不用修改）：连接后每 0.2 秒推送一条本房间的消息 ——
const server = { connects: 0, open: 0 };
function createConnection(roomId) {
  let timer = null, handler = null, n = 0;
  return {
    on(event, fn) { handler = fn; },
    connect() {
      server.connects++; server.open++;
      timer = setInterval(() => handler && handler('[' + roomId + '] 第 ' + (++n) + ' 条'), 200);
    },
    disconnect() { clearInterval(timer); server.open--; },
  };
}

function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on('message', (text) => {
      /* ✏️ 追加 text：不要读取这次渲染的 messages */
    });
    conn.connect();
    return () => conn.disconnect();
  }, /* ✏️ effect 用到了哪些 props 或 state？ */);
  return (
    <ul id="log" style={{ maxHeight: 120, overflow: 'auto' }}>
      {messages.map((m, i) => <li key={i}>{m}</li>)}
    </ul>
  );
}

function App() {
  const [roomId, setRoomId] = useState('综合');
  return (
    <div>
      <button id="general" onClick={() => setRoomId('综合')}>综合</button>
      <button id="travel" onClick={() => setRoomId('旅行')}>旅行</button>
      <p>当前房间：{roomId}</p>
      <ChatRoom roomId={roomId} />
    </div>
  );
}`,
    exports: ['server'],
    test: async (t) => {
      const srv = t.exports.server;
      t.assert(srv && typeof srv.connects === 'number', '没有找到 server 对象。请不要修改模拟服务器的代码');
      const items = () => t.qa('#log li').map(li => li.textContent);
      await t.wait(750);
      let got = items();
      t.assert(got.length >= 2, got.length === 1
        ? '0.75 秒后列表仍只有 1 条消息。回调里的 messages 永远是第一次渲染的 []，每次都在算 [...[], text]。试试函数式更新'
        : `0.75 秒后应至少有 2 条消息，实际是 ${got.length} 条。连接建立了吗？`);
      t.assert(got.every(x => x.includes('综合')), '还没切换房间，列表里就出现了别的房间的消息');
      t.assert(srv.connects === 1, `还没切换房间，就已经连接了 ${srv.connects} 次。每收到一条消息就重连了一次：effect 的依赖里是不是有 messages？用函数式更新，effect 就不必读 messages`);
      const before = got.length;
      await t.click('#travel');
      await t.wait(750);
      got = items();
      const kept = got.slice(0, before).every(x => x.includes('综合'));
      const later = got.slice(before);
      t.assert(got.length >= before && kept, `切换后，之前的 ${before} 条“综合”消息不见了。题目要求保留它们：ChatRoom 被重新挂载了，还是 messages 被清空了？`);
      t.assert(later.some(x => x.includes('旅行')), '切到“旅行”后，仍然只收到“综合”的消息。effect 里的 roomId 是哪一次渲染的？effect 用到的 roomId 要写进依赖数组');
      t.assert(srv.open === 1, `切换后有 ${srv.open} 个连接同时打开。effect 要返回清理函数，断开旧连接`);
      t.assert(later.every(x => x.includes('旅行')), '切换后还在收到“综合”的新消息。旧房间的连接断开了吗？');
      t.assert(later.length >= 2, `切换 0.75 秒后应至少追加 2 条“旅行”消息，实际是 ${later.length} 条`);
      t.assert(srv.connects === 2, `从开始到现在共连接了 ${srv.connects} 次，应为 2 次（综合 1 次 + 旅行 1 次）。收到消息时不要重新连接`);
    }
  }
});

/* ---------- 18 ---------- */
lesson({
  id: 'suspense', stage: 2, title: 'Suspense、懒加载与错误边界', mins: 20,
  summary: '优雅地处理“还没准备好”和“出错了”这两种状态。',
  goals: ['能用 lazy 和 Suspense 按需加载一个组件', '能写出一个错误边界组件', '能判断一个错误会不会被错误边界捕获', '能决定 Suspense 和错误边界包在哪一层'],
  keyPoints: [
    '<code>lazy</code> 让组件在第一次渲染时才加载代码。加载期间，最近的 <code>Suspense</code> 显示 fallback。',
    '一个 Suspense 里的内容作为整体显示：全部就绪才一起出现。想分别出现，就各包一个 Suspense。',
    '错误边界是带 <code>static getDerivedStateFromError</code> 的 class 组件。它捕获子树在渲染、生命周期和 effect 中抛出的错误，显示备用界面。',
    '常见坑：事件处理函数和 setTimeout 里的错误，错误边界捕获不到，要自己用 try/catch。',
    '边界放在哪一层，决定出错时“断电”的范围。给相互独立的模块各包一个边界。',
  ],
  body: [
    p('真实应用总有“等待”和“失败”。React 提供了两个<b>声明式</b>工具：<code>Suspense</code> 处理等待，<b>错误边界</b>处理失败。它们都像 try/catch 一样作用于整棵子树。'),
    h('lazy + Suspense：按需加载组件'),
    p('应用越大，打包出的 JS 越大，首屏越慢。<code>lazy</code> 让组件在<b>第一次被渲染时才去加载代码</b>。加载期间，最近的 <code>Suspense</code> 会显示 <code>fallback</code>。'),
    code(`import { lazy, Suspense } from 'react';

// 构建工具会把 Chart 打包成单独的文件
const Chart = lazy(() => import('./Chart.js'));

function Dashboard() {
  return (
    <Suspense fallback={<p>图表加载中…</p>}>
      <Chart />
    </Suspense>
  );
}`),
    play(`
import { lazy, Suspense, useState } from 'react';

// 用延迟模拟网络加载一个组件文件
const HeavyChart = lazy(() => new Promise(resolve => {
  setTimeout(() => resolve({
    default: function HeavyChart() {
      return <div style={{ fontSize: 30 }}>📊📈📉 图表组件加载完成！</div>;
    }
  }), 1500);
}));

function App() {
  const [show, setShow] = useState(false);
  return (
    <div>
      <button onClick={() => setShow(true)}>显示图表</button>
      {show && (
        <Suspense fallback={<p>⏳ 正在加载图表代码…</p>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}`, '懒加载组件', '只有第一次加载需要等待，之后会使用缓存。点“运行”可重置。'),
    tip('Suspense 也可以用于<b>数据加载</b>。支持 Suspense 的工具有 Next.js、Relay、TanStack Query 和 React 19 的 <code>use()</code>。使用它们时，组件会“暂停”，直到数据准备好。你不需要在每个组件里写 <code>if (loading)</code>。注意：在 effect 或事件处理函数里请求数据，不会触发 Suspense。传给 <code>use()</code> 的 Promise 要缓存，不能在渲染时新建。'),
    deep('已经显示的内容再次挂起时（例如切换到一个还没加载的懒加载标签页），默认会被 fallback 替换。把这次 set 函数调用放进 <code>startTransition</code>，React 会保留旧界面，等新内容准备好再切换。下一课会讲 startTransition。'),
    h('错误边界：防止一个组件崩溃拖垮整个页面'),
    p('如果某个组件在渲染时抛出错误，默认情况下<b>整个应用都会白屏</b>。错误边界可以捕获子树中的渲染错误，显示一个备用界面。目前错误边界<b>只能用 class 组件</b>编写。你也可以使用 react-error-boundary 库。'),
    play(`
import { Component, useState } from 'react';

class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };            // 更新 state，下次渲染显示备用界面
  }

  componentDidCatch(error, info) {
    console.log('上报错误：', error.message); // 可以发送到监控服务
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#fde8e8', padding: 10, borderRadius: 8 }}>
          😵 这个模块出错了：{this.state.error.message}
          <button onClick={() => this.setState({ error: null })}>重试</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function BuggyCounter() {
  const [n, setN] = useState(0);
  if (n === 3) throw new Error('计数到 3 就崩溃了');
  return <button onClick={() => setN(n + 1)}>点到 3 会崩溃：{n}</button>;
}

function App() {
  return (
    <div>
      <ErrorBoundary><BuggyCounter /></ErrorBoundary>
      <ErrorBoundary><BuggyCounter /></ErrorBoundary>
    </div>
  );
}`, '错误边界隔离故障', '每个计数器都有自己的错误边界。一个崩溃，只有它的边界显示备用界面，另一个不受影响。点“重试”会清空边界的 error，重新渲染计数器。'),
    warn('错误边界<b>不能</b>捕获以下错误：<ol class="task-steps"><li>事件处理函数中的错误。用普通的 try/catch 处理。</li><li>异步代码中的错误，例如 setTimeout 和普通的 Promise。</li><li>服务端渲染中的错误。</li><li>错误边界自身的错误。</li></ol>它捕获<b>渲染期间</b>、生命周期和 effect 中的错误。React 19 中有两个例外：<code>startTransition</code> 里抛出的错误，以及 <code>use()</code> 读取的被拒绝的 Promise，也会被错误边界捕获。'),
    like('错误边界像电路里的保险丝。某个房间短路了，只有这个房间断电，整栋楼依然灯火通明。'),
  ],
  quiz: [
    { q: 'Dashboard 写了 &lt;Suspense fallback={&lt;Spinner /&gt;}&gt;&lt;Chart /&gt;&lt;/Suspense&gt;，Chart 用 lazy 加载。第一次显示 Chart 时，页面上会依次出现什么？', options: ['空白，代码加载完成后再显示 Chart', 'Spinner，加载完替换为 Chart', '报错：组件还没有加载', 'Spinner 和 Chart 同时出现'], answer: 1, explain: 'Chart 的代码还没到时，它会“挂起”，最近的 Suspense 显示 fallback。代码加载完成后，React 用 Chart 替换 fallback。不会是空白：只有没有任何 Suspense 包着时，才会出错。' },
    { q: '错误边界能捕获以下哪种错误？', options: ['onClick 处理函数中抛出的错误', 'setTimeout 回调中的错误', '子组件渲染时抛出的错误', '错误边界自己 render 中的错误'], answer: 2, explain: '错误边界捕获子树在渲染、生命周期和 effect 中的错误。最容易误选 onClick：事件处理函数不在渲染过程中执行，React 不会把它的错误交给边界，要自己用 try/catch。' },
    { q: '同一个 Suspense 中有两个 lazy 组件，分别需要 1 秒和 3 秒加载。fallback 显示多久？', options: ['1 秒', '3 秒，等全部就绪后一起显示', '4 秒', '先显示快的，慢的位置显示 fallback'], answer: 1, explain: '一个 Suspense 边界内的内容作为整体显示。两个组件同时加载，所以是 3 秒，不是 4 秒。“先显示快的”需要给它们各包一个 Suspense。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>添加 <code>static getDerivedStateFromError</code>，出错时把 <code>hasError</code> 设为 true。</li><li><code>hasError</code> 为 true 时，渲染 <code>&lt;p id="fallback"&gt;出错了&lt;/p&gt;</code>。</li><li>否则渲染 <code>this.props.children</code>。</li><li>检查结果：第二个边界里没有错误，<code>#safe</code> 应正常显示。</li></ol>',
    starter: `import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  // 提示：static getDerivedStateFromError(error) { ... }

  render() {
    return this.props.children;
  }
}

function Bomb() {
  throw new Error('boom');
}

function App() {
  return (
    <div>
      <p id="ok">我不受影响</p>
      <ErrorBoundary><Bomb /></ErrorBoundary>
      <ErrorBoundary><p id="safe">正常内容</p></ErrorBoundary>
    </div>
  );
}`,
    solution: `import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <p id="fallback">出错了</p>;
    return this.props.children;
  }
}

function Bomb() {
  throw new Error('boom');
}

function App() {
  return (
    <div>
      <p id="ok">我不受影响</p>
      <ErrorBoundary><Bomb /></ErrorBoundary>
      <ErrorBoundary><p id="safe">正常内容</p></ErrorBoundary>
    </div>
  );
}`,
    hint: '错误边界分两步：1. 子树出错时，一个 static 方法返回新的 state。2. render 读取这个 state，决定显示备用界面还是 children。',
    faded: `import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    /* ✏️ 返回新的 state，记下“出错了” */
  }

  render() {
    /* ✏️ 出错时，返回 <p id="fallback">出错了</p> */
    return this.props.children;
  }
}

function Bomb() {
  throw new Error('boom');
}

function App() {
  return (
    <div>
      <p id="ok">我不受影响</p>
      <ErrorBoundary><Bomb /></ErrorBoundary>
      <ErrorBoundary><p id="safe">正常内容</p></ErrorBoundary>
    </div>
  );
}`,
    test: async (t) => {
      t.assert(/getDerivedStateFromError|componentDidCatch/.test(t.source), '请实现 static getDerivedStateFromError');
      t.assert(t.q('#ok'), '“我不受影响”应该正常显示（说明错误没有被边界拦住）');
      t.assert(t.text('#fallback') === '出错了', '应显示 <p id="fallback">出错了</p>');
      t.assert(t.q('#safe'), '没有出错的子树应正常显示 children，而不是备用界面');
    }
  }
});

/* ---------- 19 ---------- */
lesson({
  id: 'concurrent', stage: 2, title: '并发特性：useTransition 与 useDeferredValue', mins: 25,
  summary: '区分紧急和不紧急的更新，让界面在繁重新渲染时依然流畅。',
  goals: ['能判断一个更新是紧急更新还是过渡更新', '能用 useTransition 把一次 set 函数调用标记为过渡更新', '能用 useDeferredValue 和 memo 让输入框在慢列表重新渲染时保持流畅', '能在 useTransition 和 useDeferredValue 之间做出选择'],
  keyPoints: [
    '紧急更新（打字、点击）要立刻反馈。过渡更新（筛选大列表、切换标签页）可以慢一点，还可以被打断。',
    '<code>useTransition</code> 返回 <code>[isPending, startTransition]</code>。把不紧急的 set 函数调用放进 <code>startTransition</code>。',
    '<code>useDeferredValue(value)</code> 返回一个滞后的值。慢的子组件要用 <code>memo</code> 包裹，紧急渲染时才能跳过它。',
    '常见坑：把输入框自己的 state 放进 startTransition。输入框的 value 必须同步更新，否则会丢字或卡顿。',
    '并发特性不减少计算量，只让慢渲染可以被打断。要减少计算，还要靠 memo、虚拟列表或少渲染一些内容。',
  ],
  body: [
    p('React 18 引入了<b>并发渲染</b>。核心思想是：并非所有更新都同样紧急。'),
    ul(['<b>紧急更新</b>：打字、点击、按键。用户期望立刻有反馈，哪怕慢 100ms 都能感觉到卡顿。', '<b>过渡更新（Transition）</b>：根据输入筛选一个大列表、切换标签页内容。稍微慢一点用户可以接受。']),
    p('以前，所有更新都是同步的，不能中断。一次耗时的渲染会“冻住”整个页面，连输入框都不能打字。并发渲染让 React 可以<b>中断</b>正在进行的低优先级渲染，先处理紧急的用户输入。'),
    like('像医院急诊分诊：心脏骤停的病人（打字）必须立刻处理，而例行体检（渲染大列表）可以先等等，甚至做到一半被打断。'),
    h('useDeferredValue：延迟一个值'),
    p('<code>useDeferredValue(value)</code> 返回一个“滞后”的版本。紧急渲染时它保持旧值。这次渲染提交后，React 立即在后台用新值再渲染一次。如果期间又有新输入，就丢弃这次后台渲染。'),
    play(`
import { useState, useDeferredValue, memo } from 'react';

// 一个故意很慢的列表：每项渲染都要耗费一点时间
const SlowList = memo(function SlowList({ text }) {
  const items = [];
  for (let i = 0; i < 200; i++) items.push(<SlowItem key={i} text={text} />);
  return <ul style={{ height: 160, overflow: 'auto' }}>{items}</ul>;
});

function SlowItem({ text }) {
  const start = performance.now();
  while (performance.now() - start < 1) {} // 每项阻塞 1ms
  return <li>结果：{text}</li>;
}

function App() {
  const [text, setText] = useState('');
  const [useDeferred, setUseDeferred] = useState(true);
  const deferredText = useDeferredValue(text);
  const listText = useDeferred ? deferredText : text;

  return (
    <div>
      <label><input type="checkbox" checked={useDeferred} onChange={e => setUseDeferred(e.target.checked)} /> 使用 useDeferredValue</label>
      <p><input value={text} onChange={e => setText(e.target.value)} placeholder="快速打字，感受卡顿差异" /></p>
      <div style={{ opacity: text !== listText ? 0.5 : 1 }}>
        <SlowList text={listText} />
      </div>
    </div>
  );
}`, '对比开启与关闭的输入体验', '取消勾选后再快速打字，输入框会明显卡顿；勾选时输入始终流畅。'),
    tip('注意 SlowList 用了 <code>memo</code>。这一点很关键。紧急渲染时，deferredText 还是旧值。memo 让列表跳过这次渲染，所以输入框能立即更新。'),
    h('useTransition：标记一次状态更新为“不紧急”'),
    p('当你能控制 set 函数调用的位置时，用 <code>useTransition</code>。它返回 <code>isPending</code>（是否有过渡正在进行）和 <code>startTransition</code> 函数。'),
    code(`const [isPending, startTransition] = useTransition();

function selectTab(next) {
  startTransition(() => {
    setTab(next); // 这次更新可以被打断，旧界面保持可交互
  });
}

return (
  <>
    <TabButtons onSelect={selectTab} />
    {isPending && <Spinner />}
    <TabContent tab={tab} />
  </>
);`, '切换标签页时不阻塞界面'),
    play(`
import { useState, useTransition } from 'react';

// 一个故意很慢的标签页：500 项，每项阻塞 1ms
function SlowPosts() {
  const items = [];
  for (let i = 0; i < 500; i++) items.push(<SlowPost key={i} i={i} />);
  return <ul style={{ height: 160, overflow: 'auto' }}>{items}</ul>;
}

function SlowPost({ i }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}
  return <li>文章 #{i + 1}</li>;
}

function App() {
  const [tab, setTab] = useState('about');
  const [useT, setUseT] = useState(true);
  const [isPending, startTransition] = useTransition();

  function selectTab(next) {
    if (useT) startTransition(() => setTab(next)); // 勾选时
    else setTab(next);                             // 未勾选时
  }

  const btn = (id, label) => (
    <button onClick={() => selectTab(id)} style={{ fontWeight: tab === id ? 'bold' : 'normal' }}>{label}</button>
  );

  return (
    <div>
      <label><input type="checkbox" checked={useT} onChange={e => setUseT(e.target.checked)} /> 使用 startTransition</label>
      <p>{btn('about', '关于')} {btn('posts', '文章（很慢）')} {btn('contact', '联系')} {isPending && <small>加载中…</small>}</p>
      <div style={{ opacity: isPending ? 0.5 : 1 }}>
        {tab === 'about' && <p>这是关于页。</p>}
        {tab === 'posts' && <SlowPosts />}
        {tab === 'contact' && <p>邮箱：hi@example.com</p>}
      </div>
    </div>
  );
}`, '用 useTransition 切换标签页', '取消勾选，点“文章”，再立刻点“联系”：界面卡住约半秒。勾选后再试：可以立即切走，等待时显示“加载中…”。'),
    table(['', 'useTransition', 'useDeferredValue'], [
      ['包装的是', '一次 set 函数调用', '一个值'],
      ['适用场景', '能拿到这个 state 的 set 函数', '值来自 props 或第三方，拿不到 set 函数'],
      ['加载提示', '提供 isPending', '比较 value !== deferredValue'],
    ]),
    warn('不要把控制输入框的 state 放进 startTransition。输入框的 value 必须同步更新，否则会出现输入丢字。正确做法是用两个 state，或者用 useDeferredValue。'),
    deep('并发特性和防抖（debounce）不同，它没有固定的延迟。设备快，更新几乎立刻发生。设备慢，更新自动推迟。后台渲染还可以被中断，不浪费计算。注意：并发特性不会减少计算量，它只让慢的渲染可以被打断。要真正减少计算，仍要靠 memo、虚拟列表，或减少渲染的内容。'),
  ],
  quiz: [
    { q: '搜索页有一个输入框和一个 5000 条的结果列表。下面哪个更新最适合放进 startTransition？', options: ['输入框的 value', '根据搜索词筛选并渲染结果列表', '提交按钮的禁用状态', '“只看有货”复选框的勾选状态（checked）'], answer: 1, explain: '结果列表渲染很慢，晚一点出现用户可以接受，它是过渡更新。最容易误选输入框的 value：它必须同步更新，否则打字会丢字或卡顿。复选框的勾选是用户直接操作的反馈，也要立刻显示。' },
    { q: 'SearchResults 只通过 props 收到 query。父组件是别的团队维护的，你改不了它的 onChange。怎样在 SearchResults 里让慢列表不拖慢输入？', options: ['调用 useTransition，用 startTransition 包住 props.query', 'const deferred = useDeferredValue(query)，把 deferred 传给用 memo 包裹的慢列表', '用 useEffect 把 query 复制进自己的 state，再用 setTimeout 延迟 300ms 更新', '给慢列表加 key={query}，让它每次都重新挂载'], answer: 1, explain: '拿不到 set 函数时，就延迟“值”：useDeferredValue 返回滞后的 query，memo 让慢列表在紧急渲染时跳过。最有迷惑性的是第一项：startTransition 包的是一次 set 函数调用，读取 props 不是更新，包了也没有作用。setTimeout 有固定延迟，还多一轮渲染。key 会让列表每次都从头挂载，更慢。' },
    { q: '用了 useDeferredValue，但慢列表 &lt;SlowList text={deferredText} /&gt; 没有用 memo 包裹。快速打字时会怎样？', options: ['仍然流畅：deferredText 会延迟更新，慢列表自然也跟着延迟', '仍然卡顿：SlowList 照样随父组件重新渲染', '列表永远不更新', '报错：useDeferredValue 必须配合 memo'], answer: 1, explain: '紧急渲染时，deferredText 还是旧值，但没有 memo 的 SlowList 照样随父组件重新渲染，慢的工作一点也没少。memo 让它在 props 没变时跳过这次渲染，后台渲染才去处理新值。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>在输入框里快速打字，感受卡顿：每输入一个字，400 项的慢列表都要同步重新渲染。</li><li>让输入框保持流畅：输入框立刻显示新字，列表稍后再更新。用 <code>useDeferredValue</code> 或 <code>useTransition</code> 都可以。不要用 setTimeout 防抖。</li><li>列表还没跟上输入时，把 <code>#results</code> 的 <code>opacity</code> 设为 0.5；跟上后恢复为 1。</li><li>不要修改 <code>SlowItem</code>，也不要减少列表的项数。</li></ol>',
    starter: `import { useState, useDeferredValue, memo } from 'react';

const ITEMS = Array.from({ length: 400 }, (_, i) => '商品 ' + (i + 1));

// 一个故意很慢的列表项：每项渲染耗时 1ms（不要修改）
function SlowItem({ text }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}
  return <li>{text}</li>;
}

function ResultList({ query }) {
  const shown = ITEMS.filter(x => x.includes(query));
  return (
    <>
      <p>找到 <span id="count">{shown.length}</span> 项</p>
      <ul style={{ height: 140, overflow: 'auto' }}>
        {shown.map(x => <SlowItem key={x} text={x} />)}
      </ul>
    </>
  );
}

function App() {
  const [query, setQuery] = useState('');
  return (
    <div>
      <input id="q" value={query} onChange={e => setQuery(e.target.value)} placeholder="输入数字筛选，例如 12" />
      <div id="results">
        <ResultList query={query} />
      </div>
    </div>
  );
}`,
    solution: `import { useState, useDeferredValue, memo } from 'react';

const ITEMS = Array.from({ length: 400 }, (_, i) => '商品 ' + (i + 1));

// 一个故意很慢的列表项：每项渲染耗时 1ms（不要修改）
function SlowItem({ text }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}
  return <li>{text}</li>;
}

const ResultList = memo(function ResultList({ query }) {
  const shown = ITEMS.filter(x => x.includes(query));
  return (
    <>
      <p>找到 <span id="count">{shown.length}</span> 项</p>
      <ul style={{ height: 140, overflow: 'auto' }}>
        {shown.map(x => <SlowItem key={x} text={x} />)}
      </ul>
    </>
  );
});

function App() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const stale = query !== deferredQuery;
  return (
    <div>
      <input id="q" value={query} onChange={e => setQuery(e.target.value)} placeholder="输入数字筛选，例如 12" />
      <div id="results" style={{ opacity: stale ? 0.5 : 1 }}>
        <ResultList query={deferredQuery} />
      </div>
    </div>
  );
}`,
    hint: '1. 输入框的 state 要同步更新，慢列表用一个“滞后”的值。哪个 Hook 能给你这个值？2. 紧急渲染时，父组件仍会重新渲染。慢列表怎样才能跳过这次渲染？3. 新值和滞后的值不相等，就说明列表还没跟上。',
    faded: `import { useState, useDeferredValue, memo } from 'react';

const ITEMS = Array.from({ length: 400 }, (_, i) => '商品 ' + (i + 1));

// 一个故意很慢的列表项：每项渲染耗时 1ms（不要修改）
function SlowItem({ text }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}
  return <li>{text}</li>;
}

const ResultList = /* ✏️ 包一层什么，让 query 没变时跳过这个慢组件？ */(function ResultList({ query }) {
  const shown = ITEMS.filter(x => x.includes(query));
  return (
    <>
      <p>找到 <span id="count">{shown.length}</span> 项</p>
      <ul style={{ height: 140, overflow: 'auto' }}>
        {shown.map(x => <SlowItem key={x} text={x} />)}
      </ul>
    </>
  );
});

function App() {
  const [query, setQuery] = useState('');
  /* ✏️ 得到一个“滞后”的 query，交给慢列表使用 */
  /* ✏️ 算出列表是否还没跟上输入 */
  return (
    <div>
      <input id="q" value={query} onChange={e => setQuery(e.target.value)} placeholder="输入数字筛选，例如 12" />
      <div id="results" style={{ opacity: stale ? 0.5 : 1 }}>
        <ResultList query={deferredQuery} />
      </div>
    </div>
  );
}`,
    test: async (t) => {
      t.assert(/performance\.now\(\)\s*-\s*start\s*<\s*1\b/.test(t.source), '请不要修改 SlowItem：练习要在“列表就是很慢”的前提下让输入保持流畅');
      for (let i = 0; i < 50 && t.text('#count') !== '400'; i++) await t.wait(100);
      t.assert(t.text('#count') === '400', `输入框为空时，应找到 400 项，实际是 ${t.text('#count') || '（没有 #count）'}`);
      // 读 React 根节点上还没完成的更新：过渡更新（startTransition、useDeferredValue）有专门的优先级
      const ck = Object.keys(t.root).find(k => k.startsWith('__reactContainer$'));
      const fiberRoot = ck && t.root[ck] && t.root[ck].stateNode;
      t.assert(fiberRoot && typeof fiberRoot.pendingLanes === 'number', '（检查程序）找不到 React 的根节点，请点“运行”后再检查');
      const TRANSITION_LANES = 0b0000000001111111111111111000000;
      const inTransition = () => (fiberRoot.pendingLanes & TRANSITION_LANES) !== 0;
      const usesTimer = /setTimeout\s*\(/.test(t.source);
      const input = t.q('#q');
      t.assert(input, '找不到输入框 #q');
      const setVal = (v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, v); input.dispatchEvent(new Event('input', { bubbles: true })); };
      const t0 = performance.now();
      setVal('1');
      await Promise.resolve();
      const dt = performance.now() - t0;
      t.assert(input.value === '1', '输入后，输入框应立刻显示新字。不要把输入框自己的 state 放进 startTransition');
      const queued = inTransition();
      const results = t.q('#results');
      t.assert(results, '找不到 #results');
      const dim = getComputedStyle(results).opacity;
      setVal('12');
      await Promise.resolve();
      t.assert(input.value === '12', '连续输入时，输入框应显示 12');
      t.assert(dt < 60, `输入一个字时，主线程被占用了约 ${Math.round(dt)} ms，输入框会卡顿。` + (/memo\s*\(/.test(t.source) ? '列表是在紧急渲染里重新渲染的吗？检查传给慢列表的是不是滞后的值。' : '紧急渲染时，父组件重新渲染会带上慢列表。用 memo 包裹它，让它在 props 没变时跳过。'));
      t.assert(queued && inTransition(), '输入后，React 里没有排队的过渡更新：列表的更新没有交给 React 调度。' + (usesTimer
        ? 'setTimeout 防抖是按固定延迟推迟更新，不是本课的做法。请把列表用的值交给 useDeferredValue，或把列表的 set 函数调用直接放进 startTransition'
        : '请用 useDeferredValue 得到一个滞后的值传给列表，或把列表的 set 函数调用放进 startTransition'));
      t.assert(Number(dim) === 0.5, `列表还没跟上输入时，#results 的 opacity 应为 0.5，实际是 ${dim}。比较一下新值和滞后的值`);
      // 等过渡更新全部完成。完成的那一刻，列表必须已经是新结果，不能再等定时器
      const deadline = performance.now() + 6000;
      while (inTransition() && performance.now() < deadline) await t.wait(0);
      t.assert(!inTransition(), '6 秒后，过渡更新仍没有完成');
      t.assert(t.text('#count') === '14', `过渡更新完成时，列表应显示 14 项，实际是 ${t.text('#count')}。` + (usesTimer
        ? '列表是不是还在等一个定时器？startTransition 要直接包住列表的 set 函数调用，不要再用 setTimeout 推迟'
        : '滞后的值或过渡里的 state 有没有传给列表？'));
      t.assert(t.qa('#results li').length === 14, '列表的 li 数量应与“找到 N 项”一致');
      await t.wait(50);
      t.assert(Number(getComputedStyle(results).opacity) === 1, '列表跟上输入后，#results 的 opacity 应恢复为 1');
    }
  },
});
