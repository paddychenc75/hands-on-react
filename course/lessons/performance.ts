import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/performance.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'performance',
  stage: 2,
  title: '性能优化：memo、useMemo、useCallback',
  mins: 24,
  summary: '跳过不必要的渲染和计算，以及为什么不该到处使用它们。',
  goals: [
    '能用 memo 让 props 没变的子组件跳过渲染',
    '能找出让 memo 失效的 props（内联函数、对象、JSX）',
    '能用 useCallback 和 useMemo 固定引用，并写对依赖',
    '能判断一次优化值不值得做',
  ],
  keyPoints: [
    '<code>memo</code> 在渲染前浅比较新旧 props。每个 prop 都用 <code>Object.is</code> 判定相等时，跳过这次渲染。',
    '组件每次渲染都会新建函数、对象和 JSX。把它们传给 memo 组件，浅比较判定“变了”，memo 失效。',
    '<code>useCallback</code> 固定函数，<code>useMemo</code> 固定计算结果。它们只在配合 memo 或作为依赖时才有用。',
    '常见坑：<code>useCallback(() =&gt; setX(x + 1), [])</code> 会读到旧的 x。用函数式更新，或把 x 写进依赖。',
    '先用 Profiler 测量，再优化。把 state 下移、把内容作为 children 传入，往往比 memo 更简单。',
  ],
  quiz: [
    {
      q: '父组件每次渲染都传 onClick={() => {...}} 给 memo 子组件，会怎样？',
      options: ['memo 正常生效，因为函数体没变', 'memo 失效，因为每次都是新函数', 'memo 会深比较函数，只有函数体变了才渲染', '子组件永远不再渲染'],
      answer: 1,
      explain: '内联函数每次渲染都是新引用，浅比较认为 props 变了。memo 只比较引用，不看函数体写了什么。用 useCallback 固定它。',
    },
    {
      q: 'Child 没有用 memo。父组件用 useCallback 包好 onClick，再传给 Child。父组件渲染时，Child 会怎样？',
      options: ['跳过渲染', '照样重新渲染', '只在 onClick 变化时渲染', '报错'],
      answer: 1,
      explain: '没有 memo，子组件总会随父组件渲染。很多人以为 useCallback 能阻止渲染，其实它只让引用稳定，跳过渲染要靠 memo。',
    },
    {
      q: 'App 有 state count，渲染 &lt;Layout&gt;&lt;BigTable /&gt;&lt;/Layout&gt;。Layout 用 {children} 渲染 BigTable，BigTable 没有用 memo。点 App 里的“count +1”时，BigTable 会重新渲染吗？',
      options: [
        '不会：BigTable 作为 children 传入，所以总能跳过',
        '会：App 重新渲染时创建了新的 &lt;BigTable /&gt; 元素',
        '不会：BigTable 没有 props，没有东西会变',
        '不会：BigTable 的类型和位置都没变，React 复用上次的渲染结果',
      ],
      answer: 1,
      explain: '&lt;BigTable /&gt; 这个元素是 App 创建的。App 重新渲染，就会创建一个新元素，BigTable 跟着渲染。“作为 children 传入”只在 Layout 自己的 state 变化时有用：那时 children 还是同一个对象。最有迷惑性的是“类型和位置没变”：这只决定 state 能不能保留，组件函数照样要调用。没有 memo 时，React 也根本不比较 props。',
    },
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
    },
  },
  checkOnly: [
    {
      q: `父组件每次渲染都写 <code>&lt;Card&gt;&lt;p&gt;hi&lt;/p&gt;&lt;/Card&gt;</code>。父组件重新渲染时，Card 会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const Card = memo(function Card({ children }) {
  return &lt;div className="card"&gt;{children}&lt;/div&gt;;
});</code></pre></div>`,
      options: ['跳过渲染：内容没有变', '照样重新渲染：children 每次都是新创建的元素对象', '只渲染第一次', '报错：memo 组件不能接收 children'],
      answer: 1,
      explain: 'children 也是一个 prop。<code>&lt;p&gt;hi&lt;/p&gt;</code> 每次渲染都会创建一个新的元素对象。memo 做浅比较，发现 children 变了，于是重新渲染。要让 memo 生效，可以用 useMemo 记忆化这段 JSX，或者把它放到不会重新渲染的组件里创建。',
    },
    {
      q: `在输入框里输入“你好”，再点击“保存”。<code>save</code> 收到什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [text, setText] = useState('');

const handleSave = useCallback(() =&gt; {
  save(text);
}, []);</code></pre></div>`,
      options: ['\'你好\'', '\'\'（空字符串）', 'undefined', '每次输入都会调用 save'],
      answer: 1,
      explain: '依赖数组是空的，useCallback 一直返回第一次渲染创建的函数。这个函数记住的 text 是空字符串。这是过期闭包。修复：把 text 写进依赖数组 <code>[text]</code>。',
    },
    {
      q: `输入框打字时 SlowChart 每次都重新渲染。data 是在组件外定义的常量。下面哪个改法<b>不能</b>减少 SlowChart 的渲染？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function App() {
  const [text, setText] = useState('');
  return (
    &lt;&gt;
      &lt;input value={text} onChange={e =&gt; setText(e.target.value)} /&gt;
      &lt;SlowChart data={data} /&gt;
    &lt;/&gt;
  );
}</code></pre></div>`,
      options: [
        '用 memo 包裹 SlowChart',
        '把输入框和 text 移到一个单独的 SearchBox 组件里',
        '用 useCallback 包住传给 onChange 的函数',
        '用 useMemo 记忆化 <SlowChart data={data} /> 这个元素',
      ],
      answer: 2,
      explain: 'onChange 传给的是原生 input，不是 SlowChart。把它记忆化，App 仍然重新渲染，SlowChart 也照样渲染。其他三种都有效：memo 让 props 不变的 SlowChart 跳过渲染（data 是常量，引用不变）；把 state 移到 SearchBox，App 就不再重新渲染；记忆化元素对象，React 发现元素没变就跳过。很多人看到“函数”就想用 useCallback，但它只在函数被传给 memo 组件或作为依赖时才有用。',
    },
    {
      q: `某个与 tab 无关的 state 变化，导致组件重新渲染。heavyFilter 会重新运行吗？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const filter = { type: tab };
const visible = useMemo(
  () =&gt; heavyFilter(items, filter),
  [items, filter]
);</code></pre></div>`,
      options: ['不会：items 和 tab 都没变', '会：filter 每次渲染都是新对象', '不会：useMemo 会深比较依赖数组里的对象', '只在开发环境会'],
      answer: 1,
      explain: '依赖用 Object.is 比较。<code>{ type: tab }</code> 每次渲染都创建一个新对象，和上一次不相等，所以每次都重新计算，useMemo 白写了。修复：依赖写原始值 <code>[items, tab]</code>，在计算函数里再创建对象。“useMemo 会深比较”是常见误解：React 的所有依赖数组都只做浅比较。',
    },
  ],
  plays: {
    '哪个 memo 生效了？': {
      note: '只有 Child 3 的渲染次数保持不变。Child 1 收到的 fnA 每次渲染都是新函数。Child 2 的 onClick 稳定，但 style={{…}} 每次都是新对象。Child 3 的两个 props 都由 useCallback、useMemo 固定，浅比较全部相等，memo 才生效。',
      predict: {
        q: '点几次“让父组件渲染”按钮，哪个 Child 的渲染次数会保持不变？',
        options: ['三个都不变', '只有 Child 1', 'Child 2 和 Child 3', '只有 Child 3'],
        answer: 3,
        explain: 'Child 1 收到每次都新建的函数。Child 2 的 style 每次都是新对象。浅比较判定它们的 props 变了。只有 Child 3 的 props 引用全都稳定，memo 才生效。',
      },
      pkey: 'performance|哪个 memo 生效了？',
    },
    'useMemo 跳过重复计算': {},
  },
} satisfies Lesson;
