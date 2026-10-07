/* ========== 课程内容 · 第四阶段：原理与架构 ========== */

/* ---------- 20 ---------- */
lesson({
  id: 'patterns', stage: 3, title: '组件设计模式', mins: 20,
  summary: '复合组件、render props、受控/非受控双模式：写出别人爱用的组件 API。',
  goals: ['能用 Context 写出一组复合组件', '能写出同时支持受控和非受控模式的组件', '能读懂老代码里的 render props 和 HOC，并改写成自定义 Hook', '能判断一个组件 API 该用配置 props 还是组合'],
  keyPoints: [
    '复合组件：父组件用 Context 提供共享 state，子组件各自读取。使用者自由组合结构，不用传一长串配置 props。',
    '受控和非受控双模式：传了 <code>value</code> 就是受控，显示 value；没传就用内部 state，初始值来自 <code>defaultValue</code>。',
    '最常见的坑：用“有没有传 onChange”判断受控。只传 onChange、不传 value 的组件仍是非受控的。',
    'render props 和 HOC 是 Hooks 之前复用逻辑的方式。今天大多用自定义 Hook，render props 仍适合“让使用者决定怎么渲染”。',
  ],
  body: [
    p('当你开始写给别人用的组件（组件库、团队公共组件）时，API 设计就和实现一样重要。好的组件 API 应该<b>灵活、直观、难以误用</b>。'),
    h('模式一：复合组件（Compound Components）'),
    p('一组组件协同工作，共享隐式的状态。就像 HTML 的 <code>&lt;select&gt;</code> 和 <code>&lt;option&gt;</code>。使用者可以自由组合结构，而不用传一大堆配置 props。'),
    play(`
import { createContext, useContext, useState } from 'react';

const TabsContext = createContext(null);

function Tabs({ defaultValue, children }) {
  const [active, setActive] = useState(defaultValue);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}

function TabList({ children }) {
  return <div role="tablist" style={{ display: 'flex', gap: 4, borderBottom: '2px solid #ddd' }}>{children}</div>;
}

function Tab({ value, children }) {
  const { active, setActive } = useContext(TabsContext);
  const selected = active === value;
  return (
    <button role="tab" aria-selected={selected} onClick={() => setActive(value)}
      style={{ border: 0, padding: '6px 12px', background: selected ? '#087ea4' : 'transparent', color: selected ? '#fff' : 'inherit', borderRadius: '6px 6px 0 0' }}>
      {children}
    </button>
  );
}

function TabPanel({ value, children }) {
  const { active } = useContext(TabsContext);
  return active === value ? <div role="tabpanel" style={{ padding: 10 }}>{children}</div> : null;
}

// 挂载为静态属性，使用时更有“一家人”的感觉
Tabs.List = TabList; Tabs.Tab = Tab; Tabs.Panel = TabPanel;

function App() {
  return (
    <Tabs defaultValue="intro">
      <Tabs.List>
        <Tabs.Tab value="intro">简介</Tabs.Tab>
        <Tabs.Tab value="spec">规格</Tabs.Tab>
        <Tabs.Tab value="review">评价 ⭐</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="intro">这是一款机械键盘。</Tabs.Panel>
      <Tabs.Panel value="spec">87 键，热插拔，三模连接。</Tabs.Panel>
      <Tabs.Panel value="review">“手感很好！”</Tabs.Panel>
    </Tabs>
  );
}`, '复合组件：Tabs', 'Radix UI、Headless UI、shadcn/ui 等流行组件库大量使用这种模式。'),
    h('模式二：受控与非受控双模式'),
    p('好的组件支持两种模式。非受控模式：组件自己管理 state，开箱即用。受控模式：父组件管理 state，可以完全定制。判断依据是：使用者是否传入了 <code>value</code>。'),
    code(`function Toggle({ value, defaultValue = false, onChange }) {
  const [inner, setInner] = useState(defaultValue);
  const isControlled = value !== undefined;
  const on = isControlled ? value : inner;

  function toggle() {
    if (!isControlled) setInner(!on);
    onChange?.(!on);
  }
  return <button onClick={toggle}>{on ? '开' : '关'}</button>;
}

<Toggle defaultValue={true} />                 // 非受控：组件自己管
<Toggle value={on} onChange={setOn} />        // 受控：父组件说了算`, '原生 <input> 的 value / defaultValue 就是这种设计'),
    h('模式三：Render Props 与 HOC（了解历史）'),
    p('在 Hooks 出现之前（2019 年前），复用状态逻辑主要靠这两种模式。你仍会在老代码和一些库中看到它们：'),
    code(`// Render Props：通过一个返回 JSX 的函数 prop 共享数据
<MouseTracker render={({ x, y }) => <p>鼠标在 {x}, {y}</p>} />

// 高阶组件 HOC：接收一个组件，返回增强后的新组件
const UserProfileWithAuth = withAuth(UserProfile);

// 今天，绝大多数情况用自定义 Hook 更简单：
const { x, y } = useMouse();
const user = useAuth();`),
    tip('Render Props 现在仍然有用。如果组件要让<b>使用者决定如何渲染内部数据</b>，就用它，例如虚拟列表的 <code>renderItem={(item) =&gt; ...}</code>。'),
    h('其他设计原则'),
    ul(['<b>组合优于配置</b>：不要提供 <code>showIcon</code>、<code>iconPosition</code>、<code>iconColor</code> 这样一长串 props。让使用者传 children 或插槽。', '<b>透传原生属性</b>：<code>function Button({ variant, ...rest }) { return &lt;button {...rest} /&gt; }</code>，让使用者能传 aria-*、onClick、type 等。', '<b>无障碍</b>：用正确的语义标签和 ARIA 角色，支持键盘操作。']),
  ],
  quiz: [
    { q: '你写了 Tabs、Tabs.Tab、Tabs.Panel 三个组件。使用者可能在 Tab 外面再包一层 div。Tab 怎样拿到“当前选中哪个”？', options: ['Tabs 用 React.Children.map 和 cloneElement 给每个直接子元素注入 active', 'Tabs 用 Context 提供 active，Tab 用 useContext 读取', '使用者手动给每个 Tab 传 active', '把 active 放进模块级的全局变量'], answer: 1, explain: 'Context 能穿过任意层级，使用者怎么包都不影响。Children.map 是常见的老写法，但它只能处理直接子元素，中间多一层 div 就失效。全局变量会让同一页面上的两个 Tabs 互相干扰。' },
    { q: '使用者写了 &lt;Toggle value={true} /&gt;，没有传 onChange。点击按钮会怎样？', options: ['变为“关”', '保持“开”：它是受控的，父组件没有更新 value', '报错', '在开和关之间来回切换，因为组件内部有自己的 state'], answer: 1, explain: '传了 value 就是受控模式，显示什么由父组件决定。这和只写 value、不写 onChange 的原生 input 一样，是只读的。选“变为关”的人以为组件会自己记住点击，但受控模式下内部 state 不起作用。' },
    { q: '老代码用 withMouse(Component) 给组件注入 x、y，两个 HOC 叠加后 props 名字冲突了。今天更推荐怎样复用这段逻辑？', options: ['再写一个 HOC，把 props 重命名', '改成 render props：&lt;Mouse render={…} /&gt;', '写一个自定义 Hook：const { x, y } = useMouse()', '把 x、y 存进 Context'], answer: 2, explain: '自定义 Hook 直接返回值，名字由调用者决定，也没有多余的包装层。render props 能解决命名冲突，但多层嵌套会形成“回调地狱”。Context 用来共享同一份数据，不是用来复用逻辑的。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>判断模式：传了 <code>value</code> 就是受控模式，否则是非受控模式。</li><li>受控模式下，显示 <code>value</code>。</li><li>非受控模式下，用内部 state 保存值，初始值为 <code>defaultValue</code>。</li><li>点击时调用 <code>onChange(新值)</code>。非受控模式下，同时更新内部 state。</li><li>按钮文字为 <b>开</b> 或 <b>关</b>。</li></ol>',
    starter: `import { useState } from 'react';

function Toggle({ id, value, defaultValue = false, onChange }) {
  // 在这里实现
  return <button id={id}>关</button>;
}

function App() {
  const [on, setOn] = useState(true);
  return (
    <div>
      <p>非受控：<Toggle id="free" /></p>
      <p>受控：<Toggle id="ctrl" value={on} onChange={setOn} /> 父组件看到：<span id="parent">{on ? '开' : '关'}</span></p>
      <p>受控但父组件拒绝修改：<Toggle id="locked" value={false} onChange={() => {}} /></p>
      <p>非受控 + 默认开 + 监听：<Toggle id="free2" defaultValue={true} onChange={v => console.log(v)} /></p>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

function Toggle({ id, value, defaultValue = false, onChange }) {
  const [inner, setInner] = useState(defaultValue);
  const isControlled = value !== undefined;
  const on = isControlled ? value : inner;
  function toggle() {
    if (!isControlled) setInner(!on);
    if (onChange) onChange(!on);
  }
  return <button id={id} onClick={toggle}>{on ? '开' : '关'}</button>;
}

function App() {
  const [on, setOn] = useState(true);
  return (
    <div>
      <p>非受控：<Toggle id="free" /></p>
      <p>受控：<Toggle id="ctrl" value={on} onChange={setOn} /> 父组件看到：<span id="parent">{on ? '开' : '关'}</span></p>
      <p>受控但父组件拒绝修改：<Toggle id="locked" value={false} onChange={() => {}} /></p>
      <p>非受控 + 默认开 + 监听：<Toggle id="free2" defaultValue={true} onChange={v => console.log(v)} /></p>
    </div>
  );
}`,
    hint: '先回答一个问题：怎样知道使用者有没有传 value？传了，就显示 value。没传，就显示内部 state。注意：不能用“有没有传 onChange”来判断模式。',
    faded: `import { useState } from 'react';

function Toggle({ id, value, defaultValue = false, onChange }) {
  const [inner, setInner] = useState(defaultValue);
  /* ✏️ 判断是不是受控模式 */
  /* ✏️ 算出现在该显示开还是关 */
  function toggle() {
    /* ✏️ 非受控时，更新内部 state */
    if (onChange) onChange(!on);
  }
  return <button id={id} onClick={toggle}>{on ? '开' : '关'}</button>;
}

function App() {
  const [on, setOn] = useState(true);
  return (
    <div>
      <p>非受控：<Toggle id="free" /></p>
      <p>受控：<Toggle id="ctrl" value={on} onChange={setOn} /> 父组件看到：<span id="parent">{on ? '开' : '关'}</span></p>
      <p>受控但父组件拒绝修改：<Toggle id="locked" value={false} onChange={() => {}} /></p>
      <p>非受控 + 默认开 + 监听：<Toggle id="free2" defaultValue={true} onChange={v => console.log(v)} /></p>
    </div>
  );
}`,
    test: async (t) => {
      t.assert(t.text('#free') === '关' && t.text('#ctrl') === '开', '初始状态不对：非受控应为“关”，受控应为“开”');
      await t.click('#free'); t.assert(t.text('#free') === '开', '非受控 Toggle 点击后应变为“开”');
      await t.click('#ctrl'); t.assert(t.text('#ctrl') === '关' && t.text('#parent') === '关', '受控 Toggle 点击后，父组件和按钮都应变为“关”');
      await t.click('#locked'); t.assert(t.text('#locked') === '关', '父组件不更新 value 时，受控 Toggle 应保持“关”');
      t.assert(t.text('#free2') === '开', 'free2 的 defaultValue={true}，初始应为“开”。它传了 onChange 但没传 value，所以是非受控的。你是用什么判断受控的？只看 value 是不是 undefined');
      await t.click('#free2'); t.assert(t.text('#free2') === '关', 'free2 传了 onChange 但没传 value，它是非受控的，点击后应变为“关”。你用什么判断受控？非受控时要更新内部 state');
    }
  }
});

/* ---------- 21 ---------- */
lesson({
  id: 'state-architecture', stage: 3, title: '状态管理架构', mins: 22,
  summary: '区分服务端状态与客户端状态，理解外部 store 的原理并亲手实现一个。',
  goals: ['能把一个 state 归类（局部、服务端、全局客户端、URL、表单），并选出合适的工具', '能用 useSyncExternalStore 把外部 store 接入组件', '能写出支持 selector 的迷你 Zustand', '能解释 selector 为什么能减少重新渲染'],
  keyPoints: [
    '先给 state 分类。从 API 来的数据是服务端状态，交给 TanStack Query 这类库。搜索词、页码放进 URL。真正的全局客户端 state 通常很少。',
    '外部 store 要提供两样东西：<code>subscribe(callback)</code> 返回取消订阅的函数，<code>getSnapshot()</code> 返回当前值。<code>useSyncExternalStore</code> 用它们把 store 接入组件。',
    'selector 只选出组件需要的那一部分。React 用 <code>Object.is</code> 比较快照，选出的值没变，组件就不重新渲染。',
    '更新 store 时要创建新对象，不要修改旧对象。',
    '常见坑：selector 每次返回新对象，例如 <code>s =&gt; ({ a: s.a })</code>。快照永远“变了”，会无限渲染。',
  ],
  body: [
    p('“该用 Redux 还是 Zustand 还是 Context？”这个问题的答案，取决于你先把状态<b>分类</b>。'),
    table(['状态类型', '例子', '推荐方案'], [
      ['局部 UI 状态', '弹窗开关、输入框内容', 'useState / useReducer'],
      ['服务端状态（远程数据的缓存）', '用户列表、商品详情', '<b>TanStack Query</b>、SWR、框架自带的数据加载'],
      ['全局客户端状态', '主题、购物车、编辑器状态', 'Context（低频）、<b>Zustand</b>、Redux Toolkit、Jotai'],
      ['URL 状态', '搜索词、页码、筛选条件', '路由的查询参数（可分享、可刷新）'],
      ['表单状态', '复杂多步表单', 'React Hook Form 等'],
    ]),
    tip('一个重要的认知转变：大多数“全局状态”其实是<b>服务端数据的缓存</b>。把这些数据交给 TanStack Query 这类库管理。这类库自带缓存、重新验证、去重和乐观更新。之后，真正需要全局管理的客户端 state 通常很少。'),
    h('外部 Store 的原理'),
    p('Redux、Zustand 这类库把状态存在 React <b>外部</b>的一个普通 JS 对象里。组件需要：① 读取当前值；② 订阅变化，在变化时重新渲染。React 18 为此提供了专用 Hook：<code>useSyncExternalStore</code>。它还能避免并发渲染中的“撕裂”问题。撕裂指同一时刻不同组件读到不同的值。'),
    code(`const value = useSyncExternalStore(
  subscribe,   // (callback) => unsubscribe：store 变化时调用 callback
  getSnapshot  // () => 当前值：必须在没变化时返回相同的引用
);`),
    play(`
import { useSyncExternalStore } from 'react';

// —— 一个 20 行的迷你 Zustand ——
function create(initializer) {
  let state;
  const listeners = new Set();
  const setState = (partial) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
    listeners.forEach(l => l());
  };
  const getState = () => state;
  const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
  state = initializer(setState, getState);

  // 返回一个 Hook，组件用它读取 store
  return function useStore(selector = s => s) {
    return useSyncExternalStore(subscribe, () => selector(getState()));
  };
}

// —— 使用方式和真正的 Zustand 几乎一样 ——
const useBear = create((set) => ({
  bears: 0,
  honey: 10,
  addBear: () => set(s => ({ bears: s.bears + 1 })),
  eatHoney: () => set(s => ({ honey: s.honey - 1 })),
}));

function BearCounter() {
  const bears = useBear(s => s.bears);
  console.log('BearCounter 渲染');
  return <p>🐻 熊的数量：{bears}</p>;
}

function HoneyPot() {
  const honey = useBear(s => s.honey);
  console.log('HoneyPot 渲染');
  return <p>🍯 蜂蜜：{honey}</p>;
}

function Controls() {
  const addBear = useBear(s => s.addBear);
  const eatHoney = useBear(s => s.eatHoney);
  return <p><button onClick={addBear}>加一只熊</button> <button onClick={eatHoney}>吃蜂蜜</button></p>;
}

function App() {
  return <div><BearCounter /><HoneyPot /><Controls /></div>;
}`, '亲手实现 Zustand', '看控制台：吃蜂蜜时，只有 HoneyPot 重新渲染；加一只熊时，只有 BearCounter 重新渲染。每个组件只订阅 selector 选出的值，这个值没变，React 就跳过它。这是 selector 优于单个大 Context 的地方。'),
    deep('<code>getSnapshot</code> 必须在 store 没变化时返回<b>同一个引用</b>。如果 selector 每次都返回新对象（如 <code>s =&gt; ({ a: s.a, b: s.b })</code>），React 会认为值一直在变。结果是无限渲染。Zustand 为此提供了 <code>useShallow</code>。'),
  ],
  quiz: [
    { q: '“商品列表”从 API 获取，多个页面都要用，还要定时刷新。最适合用什么管理？', options: ['每个页面用 useState + useEffect 各自请求', 'TanStack Query 这类服务端状态库', '放进 Redux，自己写加载、缓存和失效逻辑', '在根组件请求一次，放进 Context'], answer: 1, explain: '服务端状态需要缓存、去重、失效和重新获取，专门的库都处理好了。Redux 也能做，但这些逻辑都要自己写。Context 方案不会自动刷新，而且数据一变，所有消费者都会重新渲染。' },
    { q: '在本课的迷你 Zustand 中写 useBear(s => ({ bears: s.bears }))，会怎样？', options: ['正常工作，只在 bears 变化时渲染，因为对象内容没变', '每次 getSnapshot 都返回新对象，React 报错或无限渲染', '只渲染一次，之后不再更新', '读到 undefined'], answer: 1, explain: 'getSnapshot 必须在没有变化时返回相同引用。这个 selector 每次都返回新对象，React 认为快照一直在变。第一项是常见误解：React 不会比较对象的内容。要返回对象时，用 useShallow 这类浅比较工具。' },
    { q: '用户搜索“键盘”，翻到第 3 页，把链接发给同事。同事打开后，看到的是空搜索的第 1 页。关键词和页码应该存在哪里？', options: ['Zustand 全局 store，整个应用都能读到', 'URL 查询参数，例如 ?q=键盘&amp;page=3', 'localStorage，刷新后也能保留', '组件 state，再用 Context 传给列表'], answer: 1, explain: '链接里只带着 URL。把关键词和页码放进查询参数，分享、刷新、前进后退都能还原同一个页面。最有迷惑性的是 localStorage：刷新后确实能保留，但它只存在你自己的浏览器里，同事打开链接时读不到。全局 store 和组件 state 在刷新后就丢了。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>补全 <code>getState</code> 和 <code>subscribe</code>。subscribe 返回一个取消订阅的函数。</li><li>补全 <code>setState(partial)</code>：partial 可以是对象，也可以是 <code>s =&gt; 要修改的部分</code>。把它合并进一个<b>新</b> state 对象，再通知所有 listeners。</li><li>补全 <code>useStore(selector)</code>：用 <code>useSyncExternalStore</code> 订阅 store，只返回 selector 选出的值。</li><li>检查结果：加一只熊时，HoneyPot 的渲染次数不变；吃蜂蜜时，BearCounter 的渲染次数不变。</li></ol>',
    starter: `import { useSyncExternalStore } from 'react';

// —— 迷你 Zustand ——
function create(initial) {
  let state = initial;
  const listeners = new Set();
  const store = {
    getState() {
      // 返回当前 state
    },
    setState(partial) {
      // 1. partial 可能是函数：用旧 state 算出要修改的部分
      // 2. 和旧 state 合并成一个新对象（不要修改旧对象）
      // 3. 通知所有 listeners
    },
    subscribe(fn) {
      // 添加 fn，并返回一个取消订阅的函数
    },
  };
  function useStore(selector) {
    // 用 useSyncExternalStore 订阅 store，只返回 selector 选出的值
  }
  return { store, useStore };
}

const { store, useStore } = create({ bears: 0, honey: 10 });

const renders = { bears: 0, honey: 0 };
function BearCounter() {
  const bears = useStore(s => s.bears);
  renders.bears++;
  return <p>熊：<span id="bears">{bears}</span>（渲染 <span id="bear-renders">{renders.bears}</span> 次）</p>;
}

function HoneyPot() {
  const honey = useStore(s => s.honey);
  renders.honey++;
  return <p>蜂蜜：<span id="honey">{honey}</span>（渲染 <span id="honey-renders">{renders.honey}</span> 次）</p>;
}

function App() {
  return (
    <div>
      <BearCounter />
      <HoneyPot />
      <button id="add-bear" onClick={() => store.setState(s => ({ bears: s.bears + 1 }))}>加一只熊</button>
      <button id="eat" onClick={() => store.setState({ honey: store.getState().honey - 1 })}>吃蜂蜜</button>
    </div>
  );
}`,
    solution: `import { useSyncExternalStore } from 'react';

// —— 迷你 Zustand ——
function create(initial) {
  let state = initial;
  const listeners = new Set();
  const store = {
    getState() {
      return state;
    },
    setState(partial) {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next };
      listeners.forEach(l => l());
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
  function useStore(selector) {
    return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
  }
  return { store, useStore };
}

const { store, useStore } = create({ bears: 0, honey: 10 });

const renders = { bears: 0, honey: 0 };
function BearCounter() {
  const bears = useStore(s => s.bears);
  renders.bears++;
  return <p>熊：<span id="bears">{bears}</span>（渲染 <span id="bear-renders">{renders.bears}</span> 次）</p>;
}

function HoneyPot() {
  const honey = useStore(s => s.honey);
  renders.honey++;
  return <p>蜂蜜：<span id="honey">{honey}</span>（渲染 <span id="honey-renders">{renders.honey}</span> 次）</p>;
}

function App() {
  return (
    <div>
      <BearCounter />
      <HoneyPot />
      <button id="add-bear" onClick={() => store.setState(s => ({ bears: s.bears + 1 }))}>加一只熊</button>
      <button id="eat" onClick={() => store.setState({ honey: store.getState().honey - 1 })}>吃蜂蜜</button>
    </div>
  );
}`,
    hint: '1. 合并用对象展开：<code>{ ...旧, ...新 }</code> 得到一个新对象。2. useSyncExternalStore 的第二个参数是 getSnapshot。React 用 Object.is 比较它前后两次的返回值。返回整个 state，每次 setState 后它都是新对象；返回 selector 选出的值，没变就不会重新渲染。',
    faded: `import { useSyncExternalStore } from 'react';

// —— 迷你 Zustand ——
function create(initial) {
  let state = initial;
  const listeners = new Set();
  const store = {
    getState() {
      return state;
    },
    setState(partial) {
      const next = typeof partial === 'function' ? partial(state) : partial;
      /* ✏️ 合并出一个新对象，赋给 state */
      /* ✏️ 通知所有 listeners */
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
  function useStore(selector) {
    /* ✏️ 调用 useSyncExternalStore：getSnapshot 要返回 selector 选出的值，而不是整个 state */
  }
  return { store, useStore };
}

const { store, useStore } = create({ bears: 0, honey: 10 });

const renders = { bears: 0, honey: 0 };
function BearCounter() {
  const bears = useStore(s => s.bears);
  renders.bears++;
  return <p>熊：<span id="bears">{bears}</span>（渲染 <span id="bear-renders">{renders.bears}</span> 次）</p>;
}

function HoneyPot() {
  const honey = useStore(s => s.honey);
  renders.honey++;
  return <p>蜂蜜：<span id="honey">{honey}</span>（渲染 <span id="honey-renders">{renders.honey}</span> 次）</p>;
}

function App() {
  return (
    <div>
      <BearCounter />
      <HoneyPot />
      <button id="add-bear" onClick={() => store.setState(s => ({ bears: s.bears + 1 }))}>加一只熊</button>
      <button id="eat" onClick={() => store.setState({ honey: store.getState().honey - 1 })}>吃蜂蜜</button>
    </div>
  );
}`,
    exports: ['store'],
    test: async (t) => {
      t.assert(t.text('#bears') === '0' && t.text('#honey') === '10', `初始应为熊 0、蜂蜜 10，实际是熊 ${t.text('#bears') || '空'}、蜂蜜 ${t.text('#honey') || '空'}。getState 和 useStore 返回了正确的值吗？`);
      const honeyR = t.text('#honey-renders'), bearR0 = t.text('#bear-renders');
      await t.click('#add-bear'); await t.click('#add-bear');
      t.assert(t.text('#bears') === '2', `点两次“加一只熊”后应为 2，实际是 ${t.text('#bears')}。setState 支持函数吗？通知 listeners 了吗？`);
      t.assert(t.text('#honey') === '10', `加熊后蜂蜜应仍为 10，实际是 ${t.text('#honey') || '空'}。setState 要把修改的部分合并进旧 state，而不是替换整个 state`);
      t.assert(t.text('#honey-renders') === honeyR, `加熊时 HoneyPot 也重新渲染了（${honeyR} → ${t.text('#honey-renders')}）。getSnapshot 返回的是整个 state 吗？它每次都是新对象。让 getSnapshot 返回 selector 选出的值`);
      const bearR = t.text('#bear-renders');
      t.assert(bearR !== bearR0, 'BearCounter 应该在熊的数量变化时重新渲染');
      await t.click('#eat');
      t.assert(t.text('#honey') === '9' && t.text('#bears') === '2', `吃蜂蜜后应为熊 2、蜂蜜 9，实际是熊 ${t.text('#bears') || '空'}、蜂蜜 ${t.text('#honey') || '空'}。setState 也要支持直接传对象`);
      t.assert(t.text('#bear-renders') === bearR, '吃蜂蜜时 BearCounter 也重新渲染了。它只选了 bears，bears 没变就不该渲染');
      const s = t.exports.store;
      t.assert(s && typeof s.subscribe === 'function' && typeof s.getState === 'function', '没有找到 store');
      const before = s.getState();
      s.setState({ bears: 5 });
      t.assert(s.getState() !== before && before.bears === 2, 'setState 修改了旧的 state 对象。要创建新对象：{ ...state, ...next }。否则用整个 state 当快照的组件不会更新');
      let calls = 0;
      const un = s.subscribe(() => calls++);
      t.assert(typeof un === 'function', 'subscribe 应返回一个取消订阅的函数');
      s.setState({ honey: 1 });
      t.assert(calls === 1, `订阅后 setState 一次，监听函数应被调用 1 次，实际是 ${calls} 次`);
      un(); s.setState({ honey: 0 });
      t.assert(calls === 1, '取消订阅后，store 变化不应再通知这个函数');
      await t.wait(50);
      s.setState({ bears: 7 });
      await Promise.resolve();
      t.assert(t.text('#bears') === '7', `在组件外调用 store.setState({ bears: 7 }) 后，界面没有在同一轮里更新（实际是 ${t.text('#bears')}）。useStore 是用 useSyncExternalStore 订阅的吗？自己用 useState + useEffect 订阅，更新会晚一步，并发渲染时还可能出现“撕裂”`);
    }
  }
});

/* ---------- 22 ---------- */
lesson({
  id: 'react-19', stage: 3, title: 'React 19 新特性', mins: 25,
  summary: 'Actions、useActionState、useOptimistic、use()、ref 作为 prop 等新能力。',
  goals: ['能说出一次异步提交要管理的 4 件事，以及 React 19 用哪个 API 接管每一件', '能把一个 React 18 的提交处理函数改写成 useActionState + form action', '能读懂 useOptimistic 代码，并预测成功和失败时界面的变化', '能判断 use() 和 useFormStatus 该在哪个组件里调用'],
  keyPoints: [
    '一次异步提交要管 4 件事：提交中（pending）、错误和结果、成功后重置表单、乐观值。React 18 要自己写 state；React 19 用 Action 统一接管。',
    '<code>startTransition</code> 可以接收异步函数，这类函数叫 Action。React 自动追踪它的 pending，提前 return 或抛错时也会结束 pending。',
    '<code>useActionState(action, 初始 state)</code> 返回 <code>[state, formAction, isPending]</code>。Action 的形状是 <code>(上一次的 state, formData) =&gt; 新的 state</code>。',
    '<code>useOptimistic</code> 在 Action 进行中显示预期结果。Action 结束后，乐观值自动丢弃，界面回到真实 state。',
    '常见坑：在渲染 form 的组件里调用 <code>useFormStatus</code>，读不到这个 form 的状态；在渲染时新建 Promise 传给 <code>use()</code>，组件会反复挂起。',
  ],
  body: [
    p('React 19（2024 年 12 月发布）带来了一批围绕<b>异步操作和表单</b>的新特性。<b>本课的 React 19 代码只能阅读</b>：本应用的运行环境是 React 18，运行不了 19 的 API。可运行的演示和练习用 React 18 模拟同样的思路。'),
    p('一次异步提交（例如“修改用户名”）要管理 4 件事。React 18 中，每一件都要自己写 state。React 19 为每一件提供了现成的 API：'),
    table(['要管的事', 'React 18', 'React 19'], [
      ['提交中（pending）', '<code>useState(false)</code>，提交前设为 true，结束后设回 false', '异步 <code>startTransition</code>、<code>useActionState</code>、<code>useFormStatus</code>'],
      ['错误和结果', '再加一个 <code>useState(null)</code>，在 try/catch 里设置', '<code>useActionState</code> 的返回值'],
      ['成功后重置表单', '手动清空每个受控字段的 state', '<code>&lt;form action&gt;</code> 自动重置非受控字段'],
      ['乐观值', '再加一个临时 state，失败时手动回滚', '<code>useOptimistic</code>'],
    ]),
    h('Actions：异步函数直接作为 transition'),
    p('React 19 允许在 <code>startTransition</code> 中使用<b>异步函数</b>。这类函数叫 <b>Action</b>。React 会自动追踪它的 pending 状态。'),
    p('<b>它解决了 React 18 中的什么麻烦：</b>每次提交都要成对地设置 isPending。中途 return 或抛错时，很容易忘了设回 false，按钮就一直显示“提交中”。'),
    code(`// React 18：手动管理一切
const [isPending, setIsPending] = useState(false);
const [error, setError] = useState(null);
async function handleSubmit() {
  setIsPending(true);
  const err = await updateName(name);
  setIsPending(false);
  if (err) setError(err); else redirect('/profile');
}

// React 19：异步 transition 自动处理 pending
const [isPending, startTransition] = useTransition();
function handleSubmit() {
  startTransition(async () => {
    const err = await updateName(name);
    if (err) { setError(err); return; }
    redirect('/profile');
  });
}`),
    h('&lt;form action&gt; 与 useActionState'),
    p('<b>它解决了 React 18 中的什么麻烦：</b>表单要写 onSubmit 和 <code>e.preventDefault()</code>，每个字段还要一个受控 state。结果和错误又各占一个 state。'),
    p('<code>&lt;form&gt;</code> 的 <code>action</code> 属性可以直接接收函数。提交时，React 调用它并传入 <code>FormData</code>，成功后自动重置非受控字段。<code>useActionState</code> 把 Action 的返回值和 pending 打包给你。Action 的第一个参数是上一次的 state：'),
    code(`import { useActionState } from 'react';

async function subscribe(prevState, formData) {
  const email = formData.get('email');
  if (!email.includes('@')) return { error: '邮箱格式不对' };
  await api.subscribe(email);
  return { ok: true };
}

function Newsletter() {
  const [state, formAction, isPending] = useActionState(subscribe, {});
  return (
    <form action={formAction}>
      <input name="email" />
      <button disabled={isPending}>{isPending ? '提交中…' : '订阅'}</button>
      {state.error && <p>{state.error}</p>}
      {state.ok && <p>订阅成功 🎉</p>}
    </form>
  );
}`),
    tip('深层的提交按钮可以调用 react-dom 的 <code>useFormStatus()</code>，读取所在表单的 pending。这样 isPending 就不用一层层传下去。注意：它必须在 form <b>内部</b>的子组件中调用。'),
    h('useOptimistic：乐观更新'),
    p('点赞、发消息时，先<b>立刻</b>显示结果，再等服务器确认。失败时自动回滚。'),
    p('<b>它解决了 React 18 中的什么麻烦：</b>你要自己多存一个“临时值”，成功时替换，失败时回滚，连续点击时还要处理多个临时值。'),
    code(`function Chat({ messages, sendMessage }) {
  const [optimistic, addOptimistic] = useOptimistic(
    messages,
    (current, newText) => [...current, { id: 'tmp-' + Date.now(), text: newText, sending: true }]
  );

  async function action(formData) {
    const text = formData.get('text');
    addOptimistic(text);        // 立即显示（带“发送中”标记）
    await sendMessage(text);    // 完成后 messages 更新，乐观值被真实值替换
  }

  return (
    <>
      {optimistic.map(m => <p key={m.id}>{m.text}{m.sending && ' (发送中…)'}</p>)}
      {/* addOptimistic 必须在 Action 或 startTransition 中调用；form 的 action 本身就是 Action */}
      <form action={action}><input name="text" /></form>
    </>
  );
}`),
    p('下面用 React 18 的 state <b>模拟它的效果</b>。演示后面是 useOptimistic 版本的逐行对照。'),
    play(`
import { useState } from 'react';

const fakeServer = (ok) => new Promise((res, rej) => setTimeout(() => ok ? res() : rej(new Error('网络错误')), 1200));

function App() {
  const [likes, setLikes] = useState(42);
  const [pending, setPending] = useState(0);
  const [msg, setMsg] = useState('');

  async function like(shouldSucceed) {
    setPending(p => p + 1);           // ①
    setMsg('');
    try {
      await fakeServer(shouldSucceed);
      setLikes(l => l + 1);           // ②
    } catch (e) {
      setMsg('点赞失败：' + e.message);
    } finally {
      setPending(p => p - 1);         // ③
    }
  }

  return (
    <div>
      <h2>❤️ {likes + pending} {pending > 0 && <small>（同步中…）</small>}</h2>
      <button onClick={() => like(true)}>点赞（会成功）</button>
      <button onClick={() => like(false)}>点赞（会失败）</button>
      <p style={{ color: 'crimson' }}>{msg}</p>
    </div>
  );
}`, '用 React 18 模拟乐观更新的效果', '① 点击时立刻把乐观值加 1，界面马上显示 43。② 服务器成功时，把真实值 likes 加 1。③ 无论成功或失败，最后都移除乐观值。失败时真实值没变，数字回到 42，这就是“回滚”。'),
    code(`// 同样的点赞，用 React 19 的 useOptimistic 写（只读代码）
import { useState, useOptimistic, startTransition } from 'react';

function LikeButton() {
  const [likes, setLikes] = useState(42);
  const [optimisticLikes, addOptimistic] = useOptimistic(likes, (current, n) => current + n);
  const [msg, setMsg] = useState('');

  function like(shouldSucceed) {
    setMsg('');
    startTransition(async () => {
      addOptimistic(1);                              // 对应 ①
      try {
        await fakeServer(shouldSucceed);
        startTransition(() => setLikes(l => l + 1)); // 对应 ②
      } catch (e) {
        setMsg('点赞失败：' + e.message);
      }
    }); // Action 结束时，乐观值自动丢弃：对应 ③，不用自己写
  }

  return (
    <div>
      <h2>❤️ {optimisticLikes}</h2>
      <button onClick={() => like(true)}>点赞（会成功）</button>
      <button onClick={() => like(false)}>点赞（会失败）</button>
      <p>{msg}</p>
    </div>
  );
}`, 'await 之后的 set 函数调用不再属于这个 Action，所以 ② 要再包一层 startTransition'),
    h('use()：在渲染中读取 Promise 和 Context'),
    p('<b>它解决了 React 18 中的什么麻烦：</b>读取一个 Promise，要写 useEffect 加三个 state（数据、加载中、错误）。Hook 又不能写在条件语句里，按条件读取 Context 很别扭。'),
    code(`import { use, Suspense } from 'react';

function Comments({ commentsPromise }) {
  const comments = use(commentsPromise); // 未完成时会“暂停”，交给 Suspense
  return comments.map(c => <p key={c.id}>{c.text}</p>);
}

// use 不是 Hook，而是 API：它可以写在条件语句里（但不能放在 try-catch 中）
function Heading({ show }) {
  if (show) {
    const theme = use(ThemeContext);
    return <h1 style={{ color: theme.color }}>标题</h1>;
  }
  return null;
}`),
    h('其他实用改进（选读）'),
    ul(['<b>ref 作为普通 prop</b>：函数组件可以直接接收 <code>ref</code>。React 18 中必须用 <code>forwardRef</code> 包一层。', '<b>&lt;Context&gt; 直接作为 Provider</b>：写 <code>&lt;ThemeContext value="dark"&gt;</code> 即可。React 18 中必须写 <code>.Provider</code>。', '<b>ref 回调支持返回清理函数</b>。React 18 中，卸载时 ref 回调会以 null 再调用一次，你要自己判断参数是不是 null。', '<b>文档元数据</b>：在组件里直接渲染 <code>&lt;title&gt;</code>、<code>&lt;meta&gt;</code>，React 会自动提升到 <code>&lt;head&gt;</code>。React 18 中要用 effect 修改 document.title，或引入第三方库。', '<b>更好的水合错误提示</b>。水合是服务端渲染后，React 在浏览器里接管 HTML 的过程，第 29 课会详细讲。React 18 中出错时只说“不匹配”；19 会列出服务器和浏览器渲染结果的差异。']),
    h('大型表单（选读）'),
    p('表单变大后，按这几条组织：'),
    p('<ol class="task-steps"><li>用 <code>FormData</code> 读取字段，例如 <code>formData.get(\'email\')</code>。</li><li>校验两次。客户端校验给出即时反馈。服务器校验保证安全，不能省略。</li><li>Action 返回每个字段的错误，例如 <code>{ errors: { email: \'…\' } }</code>。</li><li>让屏幕阅读器读到错误：出错的输入框加 <code>aria-invalid</code>，再用 <code>aria-describedby</code> 指向错误文字。</li></ol>'),
    code(`async function signup(prevState, formData) {
  const email = String(formData.get('email') ?? '');
  if (!email.includes('@')) return { errors: { email: '邮箱格式不对' }, email };
  await api.signup(email);
  return { ok: true };
}

function Signup() {
  const [state, formAction, isPending] = useActionState(signup, {});
  const err = state.errors?.email;
  return (
    <form action={formAction}>
      <label htmlFor="email">邮箱</label>
      {/* 提交后表单会重置，用 defaultValue 填回用户的输入 */}
      <input id="email" name="email" defaultValue={state.email}
        aria-invalid={err ? true : undefined} aria-describedby={err ? 'email-error' : undefined} />
      {err && <p id="email-error">{err}</p>}
      <button disabled={isPending}>注册</button>
    </form>
  );
}`, 'useActionState 返回字段错误'),
    tip('字段很多、字段之间有联动校验、需要边输入边提示时，用 <b>React Hook Form + Zod</b>。用 Zod 写一份 schema，客户端和服务器共用同一套规则。'),
    h('React 19.2 与 19.3 新增（选读）'),
    table(['版本与 API', '作用', '在 React 18 中的麻烦'], [
      ['19.2 <code>&lt;Activity mode="hidden"&gt;</code>', '隐藏一部分界面，但保留它的 state。也可以在后台预渲染', '条件渲染会卸载组件，state 全部丢失；用 CSS 隐藏，它的 effect 又一直在运行'],
      ['19.2 <code>useEffectEvent</code>', '从 effect 中提取事件逻辑。它总能读到最新值，不必写进依赖数组。见“闭包陷阱与 Effect 依赖”一课', '想读最新值又不想重启 effect，只能手动用 ref 同步'],
      ['19.2 <code>cacheSignal</code>', '只用于服务端组件。<code>cache()</code> 的结果失效时发出信号，可以中止请求', '渲染已经放弃了，发出的请求还在继续，浪费服务器资源'],
      ['19.2 Performance Tracks', 'Chrome DevTools 性能面板中新增 React 轨道，显示调度优先级、组件渲染和 effect', '性能面板只显示一堆 JS 函数，看不出是哪个组件、哪个优先级'],
      ['19.3 <code>&lt;ViewTransition&gt;</code>、<code>addTransitionType</code>', '用浏览器的 View Transition API，为元素的进入、离开、移动做动画', '离开的元素已被卸载，要做退场动画只能引入动画库'],
      ['19.3 Fragment ref', '给 <code>&lt;Fragment&gt;</code> 传 ref，操作它的 DOM 子节点', '要拿到一组子元素，只能多包一层 div，改变了 DOM 结构'],
      ['19.3 <code>use(browser())</code>', '让组件跳过服务端渲染，只在浏览器中渲染', '要写 useEffect + “已挂载” state，先渲染占位再渲染真实内容'],
      ['19.3 Trusted Types', '支持浏览器的 Trusted Types API，防止基于 DOM 的 XSS', '开启 Trusted Types 的网站上，React 写入 HTML 的部分会被浏览器拦截'],
    ]),
  ],
  quiz: [
    { q: 'Newsletter 组件渲染了 &lt;form&gt;，并在同一个组件里调用 useFormStatus()。提交时 pending 是？', options: ['提交期间为 true，完成后变回 false', '始终是 false', '报错', 'undefined'], answer: 1, explain: 'useFormStatus 读取的是<b>上层</b> form 的状态。Newsletter 在 form 外面，它上层没有 form，所以 pending 始终是 false。不会报错，这正是它难发现的地方。修法：把按钮拆成 form 内部的子组件。' },
    { q: '点赞按钮用 useOptimistic 实现，当前真实值是 42。点击后，Action 里 addOptimistic(1)，然后服务器返回失败，代码 catch 住错误。数字会怎样变化？', options: ['先变成 43，Action 结束后回到 42', '一直停在 43，要在 catch 里自己写代码回滚', '一直是 42，等服务器成功才变', '先变成 43，然后变成 41'], answer: 0, explain: '乐观值只在 Action 进行中有效。Action 结束后，React 丢弃它，界面显示真实值 42。真实值从来没变，所以不用自己回滚，这正是 useOptimistic 省掉的工作。不会变成 41：React 不会“减 1”，它只是不再叠加乐观值。' },
    { q: '客户端组件里写 const user = use(fetch(\'/api/user\').then(r =&gt; r.json()))，页面一直显示 Suspense 的 fallback。怎样修？', options: ['用 useMemo 包住这个 Promise，依赖写 []', '在组件外创建 Promise 并缓存（例如由服务端组件或数据请求库提供），通过 props 传入', '用 try/catch 包住 use()，出错时返回默认值', '把组件改成 async 函数，写 await fetch(…)'], answer: 1, explain: '每次渲染都新建一个 Promise，use() 每次都等新的 Promise，组件就反复挂起。Promise 要在渲染之外创建并缓存。最有迷惑性的是 useMemo：组件第一次挂载就挂起时，React 会丢掉这次渲染的 Hook 数据，useMemo 存不住它。use() 不能放进 try/catch；客户端组件也不能是 async 函数。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>补全 <code>useActionState(action, initialState)</code>，返回 <code>[state, dispatch, isPending]</code>。<code>dispatch(payload)</code> 调用 <code>action(上一次的 state, payload)</code>，把返回值存成新的 state。</li><li>等待 action 时，isPending 为 true。action 完成或抛错后，都要设回 false。</li><li>补全 <code>subscribeAction(prevState, formData)</code>：tries 加 1；邮箱不含 @，返回“邮箱格式不对”；服务器返回 false，返回“这个邮箱已经订阅过了”；成功时返回 <code>{ ok: true, tries }</code>。</li><li>不要修改 App。写完后，你的 subscribeAction 不用改，就能交给 React 19 真正的 useActionState。</li></ol>',
    starter: `import { useState } from 'react';

// 模拟服务器（不用修改）：0.3 秒后返回。这个邮箱已经订阅过，就返回 false
const api = {
  subscribe: (email) => new Promise(resolve => setTimeout(() => resolve(email !== 'taken@example.com'), 300)),
};

// —— 第 1 部分：用 React 18 写一个迷你 useActionState ——
// 返回 [state, dispatch, isPending]
function useActionState(action, initialState) {
  // 1. 用 state 保存 Action 的结果和 isPending
  // 2. dispatch(payload)：先把 isPending 设为 true，
  //    再调用 action(上一次的 state, payload)，等它完成，把返回值存成新的 state
  // 3. 无论 action 成功还是抛错，最后都把 isPending 设回 false
  return [initialState, () => {}, false]; // 占位：换成你的实现
}

// —— 第 2 部分：把提交逻辑写成 Action ——
// 参数：上一次的 state、表单的 FormData。返回值：新的 state
async function subscribeAction(prevState, formData) {
  // 1. tries 在上一次的基础上加 1
  // 2. email 不含 @：返回 { error: '邮箱格式不对', tries }
  // 3. 调用 api.subscribe(email)。返回 false：返回 { error: '这个邮箱已经订阅过了', tries }
  // 4. 成功：返回 { ok: true, tries }
  return prevState; // 占位：换成你的实现
}

function App() {
  const [state, formAction, isPending] = useActionState(subscribeAction, { tries: 0 });
  // React 19 中直接写 <form action={formAction}>。React 18 没有这个功能，这里用 onSubmit 模拟
  function handleSubmit(e) {
    e.preventDefault();
    formAction(new FormData(e.currentTarget));
  }
  return (
    <form onSubmit={handleSubmit}>
      <input id="email" name="email" placeholder="邮箱" />
      <button id="submit" disabled={isPending}>{isPending ? '提交中…' : '订阅'}</button>
      {state.error && <p id="error">{state.error}</p>}
      {state.ok && <p id="ok">订阅成功</p>}
      <p>已提交 <span id="tries">{state.tries}</span> 次</p>
    </form>
  );
}`,
    solution: `import { useState } from 'react';

// 模拟服务器（不用修改）：0.3 秒后返回。这个邮箱已经订阅过，就返回 false
const api = {
  subscribe: (email) => new Promise(resolve => setTimeout(() => resolve(email !== 'taken@example.com'), 300)),
};

// —— 第 1 部分：用 React 18 写一个迷你 useActionState ——
// 返回 [state, dispatch, isPending]
function useActionState(action, initialState) {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  async function dispatch(payload) {
    setIsPending(true);
    try {
      const next = await action(state, payload);
      setState(next);
    } finally {
      setIsPending(false);
    }
  }
  return [state, dispatch, isPending];
}

// —— 第 2 部分：把提交逻辑写成 Action ——
// 参数：上一次的 state、表单的 FormData。返回值：新的 state
async function subscribeAction(prevState, formData) {
  const tries = prevState.tries + 1;
  const email = String(formData.get('email') ?? '').trim();
  if (!email.includes('@')) return { error: '邮箱格式不对', tries };
  const ok = await api.subscribe(email);
  if (!ok) return { error: '这个邮箱已经订阅过了', tries };
  return { ok: true, tries };
}

function App() {
  const [state, formAction, isPending] = useActionState(subscribeAction, { tries: 0 });
  // React 19 中直接写 <form action={formAction}>。React 18 没有这个功能，这里用 onSubmit 模拟
  function handleSubmit(e) {
    e.preventDefault();
    formAction(new FormData(e.currentTarget));
  }
  return (
    <form onSubmit={handleSubmit}>
      <input id="email" name="email" placeholder="邮箱" />
      <button id="submit" disabled={isPending}>{isPending ? '提交中…' : '订阅'}</button>
      {state.error && <p id="error">{state.error}</p>}
      {state.ok && <p id="ok">订阅成功</p>}
      <p>已提交 <span id="tries">{state.tries}</span> 次</p>
    </form>
  );
}`,
    hint: '1. dispatch 做三件事：把 isPending 设为 true；<code>await action(state, payload)</code> 并保存结果；把 isPending 设回 false。抛错时也要设回 false，所以用 try/finally。2. Action 只依赖两个参数：tries 从 prevState 算，email 用 <code>formData.get(\'email\')</code> 读。',
    faded: `import { useState } from 'react';

// 模拟服务器（不用修改）：0.3 秒后返回。这个邮箱已经订阅过，就返回 false
const api = {
  subscribe: (email) => new Promise(resolve => setTimeout(() => resolve(email !== 'taken@example.com'), 300)),
};

// —— 第 1 部分：用 React 18 写一个迷你 useActionState ——
// 返回 [state, dispatch, isPending]
function useActionState(action, initialState) {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  async function dispatch(payload) {
    setIsPending(true);
    try {
      /* ✏️ 调用 action：传入上一次的 state 和 payload，等它完成，把返回值存成新的 state */
    } finally {
      /* ✏️ 无论成功还是抛错，最后都要做的一件事 */
    }
  }
  return [state, dispatch, isPending];
}

// —— 第 2 部分：把提交逻辑写成 Action ——
// 参数：上一次的 state、表单的 FormData。返回值：新的 state
async function subscribeAction(prevState, formData) {
  /* ✏️ 算出 tries：在上一次的基础上加 1 */
  const email = String(formData.get('email') ?? '').trim();
  if (!email.includes('@')) return { error: '邮箱格式不对', tries };
  const ok = await api.subscribe(email);
  /* ✏️ ok 为 false 时返回错误；否则返回 { ok: true, tries } */
}

function App() {
  const [state, formAction, isPending] = useActionState(subscribeAction, { tries: 0 });
  // React 19 中直接写 <form action={formAction}>。React 18 没有这个功能，这里用 onSubmit 模拟
  function handleSubmit(e) {
    e.preventDefault();
    formAction(new FormData(e.currentTarget));
  }
  return (
    <form onSubmit={handleSubmit}>
      <input id="email" name="email" placeholder="邮箱" />
      <button id="submit" disabled={isPending}>{isPending ? '提交中…' : '订阅'}</button>
      {state.error && <p id="error">{state.error}</p>}
      {state.ok && <p id="ok">订阅成功</p>}
      <p>已提交 <span id="tries">{state.tries}</span> 次</p>
    </form>
  );
}`,
    exports: ['useActionState', 'subscribeAction'],
    test: async (t) => {
      t.assert(t.text('#tries') === '0' && !t.q('#error') && !t.q('#ok'), `初始应显示“已提交 0 次”，没有错误和成功提示。实际是 ${t.text('#tries') || '空'} 次`);
      const btn = () => t.q('#submit');
      const waitIdle = async () => { for (let i = 0; i < 30 && btn() && btn().disabled; i++) await t.wait(50); };
      const submit = async (email) => { await t.type('#email', email); await t.click('#submit'); };
      await submit('abc'); await t.wait(60); await waitIdle();
      t.assert(t.text('#error') === '邮箱格式不对', `提交“abc”后应显示“邮箱格式不对”，实际是：${t.text('#error') || '没有 #error'}。dispatch 有没有调用 action，并把它的返回值存成新的 state？`);
      t.assert(t.text('#tries') === '1', `提交 1 次后，“已提交”应为 1，实际是 ${t.text('#tries')}。` + (t.text('#tries') === 'NaN' ? 'Action 读 prevState.tries 没有得到数字：dispatch 调用 action 时，第一个参数要传上一次的 state' : 'Action 要在上一次 state 的 tries 上加 1'));
      await submit('taken@example.com');
      t.assert(btn().disabled && t.text('#submit') === '提交中…', '等待服务器时，按钮应禁用并显示“提交中…”。dispatch 一开始就要把 isPending 设为 true');
      await waitIdle();
      t.assert(!btn().disabled, '服务器返回后，按钮应恢复可点。action 完成后要把 isPending 设回 false');
      t.assert(t.text('#error') === '这个邮箱已经订阅过了', `taken@example.com 已经订阅过，应显示“这个邮箱已经订阅过了”，实际是：${t.text('#error') || '没有 #error'}。Action 要 await api.subscribe(email)，再看它的返回值`);
      t.assert(t.text('#tries') === '2', `提交 2 次后，“已提交”应为 2，实际是 ${t.text('#tries')}`);
      await submit('a@b.com'); await waitIdle();
      t.assert(t.q('#ok') && !t.q('#error'), '提交 a@b.com 后，应显示“订阅成功”，并且不再显示错误。成功时返回的新 state 里不要带上旧的 error');
      t.assert(t.text('#tries') === '3', `提交 3 次后，“已提交”应为 3，实际是 ${t.text('#tries')}`);
      const { useActionState, subscribeAction } = t.exports;
      t.assert(typeof useActionState === 'function' && typeof subscribeAction === 'function', '没有找到 useActionState 和 subscribeAction');
      // Action 只依赖两个参数：直接调用它
      const fd = new FormData(); fd.set('email', 'xyz');
      const r = await subscribeAction({ tries: 41 }, fd);
      t.assert(r && r.error === '邮箱格式不对' && r.tries === 42, `subscribeAction({ tries: 41 }, 邮箱 xyz) 应返回 { error: '邮箱格式不对', tries: 42 }，实际是 ${JSON.stringify(r)}。tries 要从第一个参数 prevState 算出来，不要读组件外的变量`);
      // 单独测试 Hook：传上一次的 state；action 抛错时 isPending 也要恢复
      let probe;
      function Probe() {
        const [st, dispatch, pending] = useActionState(async (prev, x) => { await null; if (x === 'boom') throw new Error('boom'); return prev + x; }, 0);
        probe = { st, dispatch, pending };
        return null;
      }
      const box = document.createElement('div');
      const root = ReactDOM.createRoot(box);
      ReactDOM.flushSync(() => root.render(React.createElement(Probe)));
      const run = (x) => { try { const p = probe.dispatch(x); if (p && p.catch) p.catch(() => {}); } catch (e) {} };
      try {
        run(2); await t.wait(80);
        t.assert(probe.st === 2 && probe.pending === false, `用 action (prev, x) => prev + x、初始值 0 测试：dispatch(2) 后应为 2，实际是 ${probe.st}`);
        run(3); await t.wait(80);
        t.assert(probe.st === 5, `再 dispatch(3) 后应为 2 + 3 = 5，实际是 ${probe.st}。action 的第一个参数要传上一次的 state`);
        run('boom'); await t.wait(80);
        t.assert(probe.pending === false, 'action 抛错后，isPending 仍是 true：按钮会一直显示“提交中…”。用 try/finally，保证最后一定设回 false');
        t.assert(probe.st === 5, `action 抛错时，state 应保持 5，实际是 ${probe.st}`);
      } finally {
        root.unmount();
      }
    }
  },
});

/* ---------- 23 ---------- */
lesson({
  id: 'server-components', stage: 3, title: 'Server Components 与全栈 React', mins: 30,
  summary: '组件在服务器上运行意味着什么？SSR、RSC、Server Functions 一次讲清。',
  goals: ['能按顺序说出一次页面请求经过的步骤：服务端组件 → SSR → 水合', '能判断一个组件该是服务端组件还是客户端组件，并把 "use client" 放在叶子上', '能找出跨越服务端和客户端边界的不可序列化 props', '能为 Server Function 写上登录、权限和输入校验'],
  keyPoints: [
    'SSR 把组件渲染成 HTML，让首屏更快。水合让这份 HTML 变得可交互。',
    '组件默认是服务端组件：只在服务器运行，代码不发送到浏览器，也不需要水合。需要 state、effect 或事件处理函数时，才在文件顶部写 <code>"use client"</code>。',
    '<code>"use client"</code> 标记的是边界：被它导入的模块都会成为客户端代码，所以尽量放在叶子上。跨过边界的 props 必须可序列化，普通函数不行。',
    '<code>"use server"</code> 标记的是可以被客户端调用的服务器函数，不是服务端组件。每个 Server Function 都是公开接口，要自己检查登录、权限和输入。',
    '常见坑：水合不匹配。渲染时用了 <code>Date</code>、<code>Math.random()</code> 或 <code>window</code>，服务器和浏览器的结果就不一样。',
  ],
  body: [
    p('React 正在从“浏览器里的 UI 库”演进为<b>全栈架构</b>。理解这一课，你就能看懂 Next.js App Router 等现代框架的设计。'),
    p('<b>本课的示例代码只能阅读。</b>原因是：服务端组件和 Server Function 要在服务器上运行，还要由 Next.js 这类框架打包。本页的沙箱只是浏览器里的 React 18。课末的练习是纯 JavaScript，可以运行。想在真实项目里试，见“在本地动手试”。'),
    p('先认识本课反复出现的两个词：'),
    ul(['<b>水合（hydration）</b>：服务器发来的 HTML 只能看，不能交互。浏览器下载 JS 后，React 在这份现成的 HTML 上运行组件，绑定事件处理函数，接上 state。这个过程叫水合。水合完成后，按钮才能点。', '<b>RSC Payload</b>：服务端组件的渲染结果。它不是 HTML，而是一种描述界面的数据格式。客户端组件在里面只是一个“占位引用”，指向浏览器要下载的 JS 文件。']),
    h('三种渲染方式'),
    table(['', '做法', '优点', '缺点'], [
      ['CSR 客户端渲染', '服务器发一个空 HTML + 大 JS 包，浏览器执行 JS 生成界面', '交互丰富，服务器简单', '首屏白屏久，SEO 差，JS 包大'],
      ['SSR 服务端渲染', '服务器先把组件渲染成 HTML 发给浏览器，浏览器再下载 JS 进行<b>水合（hydration）</b>让它可交互', '首屏快，SEO 好', '所有组件的 JS 仍要下载并水合'],
      ['RSC 服务端组件', '部分组件<b>只在服务器运行</b>，它们的代码永远不会发送到浏览器', 'JS 包更小，可直接访问数据库/文件', '心智模型更复杂，需要框架支持'],
    ]),
    p('注意：RSC 不取代 SSR，两者通常一起用。下图是第一次打开页面时的完整流程：'),
    fig(`<div class="steps"><div class="step"><b>① 请求</b><span>浏览器请求页面，例如 /products</span></div><div class="step"><b>② 运行服务端组件</b><span>在服务器上查数据库、渲染，产生 <em>RSC Payload</em>。客户端组件在这里只是占位引用</span></div><div class="step"><b>③ SSR</b><span>在服务器上把整棵树（包括客户端组件）渲染成 <em>HTML</em></span></div><div class="step"><b>④ 显示 HTML</b><span>浏览器立刻显示内容。这时按钮还不能点</span></div><div class="step"><b>⑤ 下载 JS</b><span>只下载<em>客户端组件</em>的代码。服务端组件的代码不下载</span></div><div class="step"><b>⑥ 水合</b><span>React 给客户端组件绑定事件、接上 state。页面可以交互了</span></div></div>`, '② ③ 在服务器上进行，④ ⑤ ⑥ 在浏览器里进行。服务端组件只参与 ② 和 ③，所以它不需要水合'),
    p('之后在页面之间导航时，服务器只发送新的 RSC Payload。浏览器把它合并进现有界面，客户端组件的 state 会保留。'),
    like('SSR 像餐厅先给你端上一盘看起来做好的菜（HTML），但要等厨师到你桌边“通电”（水合）之后才能吃。RSC 则是有些菜在后厨就完全做好了，根本不需要厨师来你桌边。'),
    h('服务端组件长什么样'),
    code(`// app/products/page.jsx —— 默认就是服务端组件
import db from '@/lib/db';
import AddToCart from './AddToCart';

export default async function ProductsPage() {
  // 直接在组件里查数据库！这段代码不会出现在浏览器中
  const products = await db.product.findMany();

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>
          {p.name} - ¥{p.price}
          <AddToCart productId={p.id} />  {/* 需要交互的部分交给客户端组件 */}
        </li>
      ))}
    </ul>
  );
}`, '服务端组件可以是 async 函数'),
    code(`// app/products/AddToCart.jsx
'use client'; // 声明：这是客户端组件，它和它导入的模块会被打包到浏览器

import { useState } from 'react';

export default function AddToCart({ productId }) {
  const [added, setAdded] = useState(false);
  return <button onClick={() => setAdded(true)}>{added ? '已加入' : '加入购物车'}</button>;
}`, '需要 state、effect、事件的组件才标记为客户端组件'),
    h('边界规则'),
    table(['', '服务端组件', '客户端组件'], [
      ['useState / useEffect / 事件处理', '❌ 不能用', '✅'],
      ['async/await 直接取数据', '✅', '❌（用 use() 读取服务端传来的 Promise，或用 TanStack Query 等库）'],
      ['访问数据库、密钥、文件系统', '✅ 安全', '❌ 会暴露'],
      ['代码是否发送到浏览器', '否', '是'],
      ['可以导入对方吗', '可以导入并渲染客户端组件', '不能导入服务端组件，但可以通过 <b>children</b> 接收'],
    ]),
    warn('<code>"use client"</code> 标记的是<b>边界</b>，而不是单个组件：被它导入的所有模块都会成为客户端代码。所以要尽量把 "use client" 放在组件树的<b>叶子</b>上，让大部分组件留在服务器。另外，服务端传给客户端组件的 props 必须<b>可序列化</b>。不能传函数，Server Function 除外。'),
    h('Server Functions：从客户端调用服务器函数'),
    p('用 <code>"use server"</code> 标记的异步函数叫 <b>Server Function</b>。把它用作表单或按钮的 action 时，也叫 Server Action。Next.js 文档常用后一个名字。'),
    code(`// app/actions.js
'use server';

export async function addComment(formData) {
  const text = formData.get('text');
  await db.comment.create({ data: { text } }); // 在服务器执行
  revalidatePath('/post');                     // 刷新相关页面的数据
}

// 在任意组件中直接作为表单 action 使用，无需手写 API 路由
<form action={addComment}>
  <input name="text" />
  <button>发表评论</button>
</form>`),
    tip('<b>"use server" 不标记服务端组件</b>。组件默认就是服务端组件，不需要标记。它标记<b>可以被客户端调用的服务器函数</b>。框架会为这个函数自动生成一个 API 接口。所以务必在其中做权限校验和输入验证。'),
    deep('RSC 的传输格式不是 HTML。它是一种特殊的序列化格式，叫 RSC Payload。它描述服务端组件渲染出的树，以及客户端组件的“占位引用”。这让页面导航时可以只获取新的 RSC 数据并与现有客户端状态合并，而不用整页刷新。'),
    h('安全：服务器代码也要设防'),
    ul(['<b>每个 Server Function 都是一个公开的接口</b>。任何人都能直接发请求调用它，不必经过你的界面。所以在函数内部：1. 检查登录和权限。2. 验证每个输入。', '<b>不要把密钥放进 props</b>。传给客户端组件的 props 会发送到浏览器。在 Next.js 等框架中，只能在服务器用的模块顶部写 <code>import \'server-only\'</code>。客户端组件导入它时，构建会报错。', '<b>带公开前缀的环境变量会进入浏览器</b>，例如 Next.js 的 <code>NEXT_PUBLIC_</code>、Vite 的 <code>VITE_</code>。密钥不要用这些前缀。', '<b>及时升级 React 和框架</b>。2025 年 12 月，React 公布了多个 RSC 漏洞：一个可远程执行代码（CVE-2025-55182），还有拒绝服务和源码泄露。修复版本是 19.0.4、19.1.5、19.2.4 或更新的版本。没有服务器的纯客户端应用不受影响。']),
    code(`'use server';

export async function deletePost(postId) {
  const user = await getCurrentUser();                       // 1. 检查登录
  if (!user) throw new Error('请先登录');
  if (typeof postId !== 'string') throw new Error('参数错误'); // 2. 验证输入
  const post = await db.post.find(postId);
  if (!post || post.authorId !== user.id) throw new Error('没有权限'); // 3. 检查权限
  await db.post.delete(postId);
}`, '不要假设调用者一定来自你的界面'),
    h('水合不匹配'),
    p('水合时，浏览器第一次渲染的结果必须与服务器的 HTML 一致。不一致时，React 会报错，并在客户端重新渲染这部分。常见原因和修复：'),
    table(['原因', '修复'], [
      ['渲染时用了 <code>new Date()</code>、<code>Math.random()</code>', '在 useEffect 中计算客户端的值。只有时间戳这类情况，才加 <code>suppressHydrationWarning</code>（只作用于一层）'],
      ['渲染时读取 <code>window</code>、<code>localStorage</code> 等浏览器 API', '首次渲染输出与服务器相同的内容，再在 useEffect 中更新'],
      ['用随机数生成元素 id', '用 <code>useId</code>。它在服务器和浏览器上生成相同的 id'],
      ['无效的 HTML 嵌套，例如 <code>&lt;p&gt;</code> 里放 <code>&lt;div&gt;</code>', '浏览器会自动修正 HTML，结构就变了。改成有效的嵌套'],
      ['浏览器扩展在水合前修改了页面', '无法完全避免。先在无痕窗口中排除扩展的影响'],
    ]),
    h('在本地动手试（选读）'),
    p('需要 Node.js 18 或更新的版本。按下面的步骤，亲眼看看代码在哪里运行：'),
    p('<ol class="task-steps"><li>运行 <code>npx create-next-app@latest rsc-demo</code>，按默认选项创建项目，再运行 <code>npm run dev</code>。</li><li>在 <code>app/page.tsx</code> 的组件里加一行 <code>console.log(\'在哪里打印？\')</code>，刷新页面。这句话打印在运行 npm 的终端里：它在服务器上运行。开发模式下，浏览器控制台也会转发一份，前面带“Server”标记。</li><li>新建 <code>app/LikeButton.tsx</code>，顶部写 <code>\'use client\'</code>，用 useState 做一个点赞按钮，在 onClick 里 console.log 一句话。在 page.tsx 里渲染它。点击按钮，这句话只出现在浏览器控制台里。</li><li>把 <code>\'use client\'</code> 删掉再刷新。框架会报错：服务端组件不能使用 useState。</li></ol>'),
  ],
  quiz: [
    { q: '服务端组件写 &lt;AddToCart onAdded={() =&gt; console.log("ok")} /&gt;，AddToCart 是客户端组件。会怎样？', options: ['正常工作', '报错：函数不能序列化，不能从服务端组件传给客户端组件', '点击时，函数回到服务器上执行', '函数被悄悄忽略，onAdded 是 undefined'], answer: 1, explain: 'props 要从服务器经过网络发到浏览器，只有可序列化的值和 Server Function 可以传。普通函数无法序列化，React 会报错，而不是悄悄忽略。“回到服务器执行”是 Server Function 的行为，普通函数没有这个能力。' },
    { q: 'app/actions.js 顶部写了 "use server"，并导出 async function deletePost(id)。哪项说法正确？', options: ['deletePost 只能被服务端组件调用，浏览器里的代码调不到它', '它成了公开接口，任何人都能调用，要检查权限', 'deletePost 的代码会被打包进浏览器', '"use server" 让这个文件里的组件变成服务端组件'], answer: 1, explain: '"use server" 标记的是可以被客户端调用的服务器函数。框架为它生成接口，浏览器通过网络调用它，函数代码留在服务器。第一项是最危险的误解：以为“server”就代表外人调不到，于是省掉权限检查。组件默认就是服务端组件，不需要标记。' },
    { q: '商品页是服务端组件，里面只有“加入购物车”按钮需要点击。"use client" 写在哪里最好？', options: ['写在商品页 page.jsx 的顶部', '写在只包含按钮的 AddToCart.jsx 顶部', '写在根布局 layout.jsx 的顶部，一次覆盖所有页面', '每个文件都写'], answer: 1, explain: '"use client" 标记的是边界：被它导入的所有模块都会打包到浏览器。写在叶子 AddToCart 上，商品列表、数据库查询都留在服务器。写在 page.jsx 上，整个页面都变成客户端代码，还不能直接查数据库。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>服务端组件要把 <code>props</code> 里的值传给客户端组件。补全 <code>canCross(value)</code>，判断一个值能不能跨过这条边界。</li><li>规则：null、undefined、字符串、数字、布尔值可以；Date 可以；函数只有 Server Function 可以。</li><li>数组和普通对象：里面的每一项都可以，它才可以。要递归检查。</li><li>其他对象（例如 class 的实例）不可以。真实的 React 还支持 Map、Set、Promise 等少数内置类型，本题不考。</li><li>运行后，表格里 onBuy、owner、variants 三行应显示“❌ 不能传”，其余显示“✅ 可以传”。</li></ol>',
    starter: `// 模拟 Server Function：框架会给 'use server' 导出的函数打上标记（不用修改）
function serverFunction(fn) {
  fn.isServerFunction = true;
  return fn;
}

class User {
  constructor(name) { this.name = name; }
  greet() { return '你好，' + this.name; }
}

// 判断一个值能不能作为 props，从服务端组件传给客户端组件
function canCross(value) {
  // 1. null、undefined、字符串、数字、布尔值：可以
  // 2. 函数：只有 Server Function（isServerFunction 为 true）可以
  // 3. 数组：每一项都可以，整个数组才可以
  // 4. Date：可以
  // 5. 普通对象（原型是 Object.prototype 或 null）：每个属性值都可以，才可以
  // 6. 其他对象，例如 class 的实例：不可以
  return true; // 占位：换成你的实现
}

// 服务端组件想传给客户端组件 <ProductCard> 的 props
const props = {
  title: '机械键盘',
  price: 399,
  tags: ['新品', '包邮'],
  releasedAt: new Date('2025-01-01'),
  seller: { name: '小李', rating: 4.8 },
  onBuy: () => console.log('买！'),
  addToCart: serverFunction(async (id) => {}),
  owner: new User('小王'),
  variants: [{ color: '黑' }, { color: '白', onPick: () => {} }],
};

function App() {
  return (
    <table>
      <tbody>
        {Object.entries(props).map(([name, value]) => (
          <tr key={name}>
            <td>{name}</td>
            <td id={'row-' + name}>{canCross(value) ? '✅ 可以传' : '❌ 不能传'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}`,
    solution: `// 模拟 Server Function：框架会给 'use server' 导出的函数打上标记（不用修改）
function serverFunction(fn) {
  fn.isServerFunction = true;
  return fn;
}

class User {
  constructor(name) { this.name = name; }
  greet() { return '你好，' + this.name; }
}

// 判断一个值能不能作为 props，从服务端组件传给客户端组件
function canCross(value) {
  if (value === null || value === undefined) return true;
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return true;
  if (type === 'function') return value.isServerFunction === true;
  if (Array.isArray(value)) return value.every(canCross);
  if (value instanceof Date) return true;
  const proto = Object.getPrototypeOf(value);
  if (proto === Object.prototype || proto === null) return Object.values(value).every(canCross);
  return false;
}

// 服务端组件想传给客户端组件 <ProductCard> 的 props
const props = {
  title: '机械键盘',
  price: 399,
  tags: ['新品', '包邮'],
  releasedAt: new Date('2025-01-01'),
  seller: { name: '小李', rating: 4.8 },
  onBuy: () => console.log('买！'),
  addToCart: serverFunction(async (id) => {}),
  owner: new User('小王'),
  variants: [{ color: '黑' }, { color: '白', onPick: () => {} }],
};

function App() {
  return (
    <table>
      <tbody>
        {Object.entries(props).map(([name, value]) => (
          <tr key={name}>
            <td>{name}</td>
            <td id={'row-' + name}>{canCross(value) ? '✅ 可以传' : '❌ 不能传'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}`,
    hint: '1. 先处理简单值，再处理函数：看 <code>value.isServerFunction</code>。2. 数组用 <code>value.every(canCross)</code> 递归。3. 区分普通对象和 class 实例：<code>Object.getPrototypeOf(value)</code> 是 <code>Object.prototype</code> 或 null 的才是普通对象，再用 <code>Object.values(value).every(canCross)</code> 递归。Date 要在这一步之前判断。',
    faded: `// 模拟 Server Function：框架会给 'use server' 导出的函数打上标记（不用修改）
function serverFunction(fn) {
  fn.isServerFunction = true;
  return fn;
}

class User {
  constructor(name) { this.name = name; }
  greet() { return '你好，' + this.name; }
}

// 判断一个值能不能作为 props，从服务端组件传给客户端组件
function canCross(value) {
  if (value === null || value === undefined) return true;
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return true;
  /* ✏️ 函数：只有带 isServerFunction 标记的才可以 */
  /* ✏️ 数组：递归检查每一项 */
  if (value instanceof Date) return true;
  const proto = Object.getPrototypeOf(value);
  /* ✏️ 普通对象：递归检查每个属性值 */
  return false;
}

// 服务端组件想传给客户端组件 <ProductCard> 的 props
const props = {
  title: '机械键盘',
  price: 399,
  tags: ['新品', '包邮'],
  releasedAt: new Date('2025-01-01'),
  seller: { name: '小李', rating: 4.8 },
  onBuy: () => console.log('买！'),
  addToCart: serverFunction(async (id) => {}),
  owner: new User('小王'),
  variants: [{ color: '黑' }, { color: '白', onPick: () => {} }],
};

function App() {
  return (
    <table>
      <tbody>
        {Object.entries(props).map(([name, value]) => (
          <tr key={name}>
            <td>{name}</td>
            <td id={'row-' + name}>{canCross(value) ? '✅ 可以传' : '❌ 不能传'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}`,
    exports: ['canCross'],
    test: async (t) => {
      const cell = (name) => t.text('#row-' + name);
      const ok = (name) => cell(name).includes('✅');
      t.assert(['title', 'price', 'tags'].every(ok), 'title、price、tags 都只含字符串和数字，应该可以传');
      t.assert(!ok('onBuy'), 'onBuy 是一个普通函数，不能传：函数的代码没法变成数据发给浏览器。只有 Server Function（isServerFunction 为 true）可以');
      t.assert(ok('addToCart'), 'addToCart 是 Server Function，可以传：浏览器拿到的只是一个引用，调用时请求会回到服务器执行');
      t.assert(ok('releasedAt'), 'releasedAt 是 Date，可以传。检查 Date 的判断写在“其他对象”之前了吗？');
      t.assert(ok('seller'), 'seller 是普通对象，每个属性值都可以传，所以它也可以传');
      t.assert(!ok('owner'), 'owner 是 class User 的实例，不能传：浏览器只收到数据，原型和 greet 方法都会丢失。用 Object.getPrototypeOf 区分普通对象和 class 实例');
      t.assert(!ok('variants'), 'variants 数组里的第二个对象有一个函数 onPick，所以整个数组都不能传。数组和对象要递归检查每一项');
      const { canCross } = t.exports;
      t.assert(typeof canCross === 'function', '没有找到 canCross 函数');
      class Point { constructor() { this.x = 1; } }
      const cases = [
        [null, true, 'null'], [undefined, true, 'undefined'], [0, true, '0'], ['', true, '空字符串'], [false, true, 'false'],
        [[], true, '空数组'], [{}, true, '空对象'], [Object.assign(Object.create(null), { a: 1 }), true, '原型为 null 的对象 { a: 1 }'],
        [{ a: { b: [1, { c: () => 1 }] } }, false, '深层藏着一个函数的 { a: { b: [1, { c: () => 1 }] } }'],
        [{ when: new Date(0) }, true, '{ when: new Date(0) }'],
        [[new Point()], false, '[new Point()]（class 的实例）'],
        [function save() {}, false, '普通函数 save'],
      ];
      for (const [v, want, label] of cases) {
        const got = canCross(v);
        t.assert(got === want, `canCross(${label}) 应返回 ${want}，实际是 ${got}`);
      }
    }
  },
});

/* ---------- 24 ---------- */
lesson({
  id: 'mini-react', stage: 3, title: '原理：亲手实现迷你 React', mins: 28,
  summary: '从 createElement 到 Hooks 链表，揭开 React 的魔法。',
  goals: ['能写出 createElement，并解释 React 元素只是普通对象', '能用“数组 + 游标”实现 useState 和 useRef', '能解释为什么在 if 里调用 Hook 会让 state 错位', '能说出 Fiber 怎样让渲染可以中断，以及提交为什么必须一次完成'],
  keyPoints: [
    'JSX 编译成 <code>createElement(type, props, ...children)</code>，它只返回一个描述界面的普通对象。',
    '每个组件按调用顺序存放 Hook 的数据，再用一个游标记录“现在是第几个 Hook”。每次渲染前，游标归零。',
    'Hook 只认顺序，不认名字。在 if 里调用 Hook，某次渲染跳过一个，后面所有 Hook 都会读到别人的数据。',
    'Fiber 把渲染拆成小的工作单元，可以暂停、恢复和丢弃。渲染阶段不改 DOM；提交阶段一次性改完，用户不会看到画了一半的界面。',
  ],
  body: [
    p('理解原理最好的方式就是自己造一个。这一课我们用纯 JavaScript 实现 React 最核心的几个部分。下面的代码都可以直接运行，结果打印在控制台。'),
    h('第一步：createElement'),
    p('第 2 课讲过：JSX 会被编译成 <code>createElement(type, props, ...children)</code>。它只返回一个描述对象：'),
    play(`
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === 'object' ? child : { type: 'TEXT', props: { nodeValue: child, children: [] } }
      ),
    },
  };
}

// <div id="app"><h1>你好</h1>世界</div> 会被编译成：
const el = createElement('div', { id: 'app' },
  createElement('h1', null, '你好'),
  '世界'
);

console.log(JSON.stringify(el, null, 2));`, '元素就是一个普通对象'),
    h('第二步：render，把对象变成 DOM'),
    play(`
function createElement(type, props, ...children) {
  return { type, props: { ...props, children: children.flat().map(c => typeof c === 'object' ? c : { type: 'TEXT', props: { nodeValue: String(c), children: [] } }) } };
}

function render(element, container) {
  // 函数组件：调用它得到元素，再递归渲染
  if (typeof element.type === 'function') {
    return render(element.type(element.props), container);
  }
  const dom = element.type === 'TEXT'
    ? document.createTextNode('')
    : document.createElement(element.type);

  Object.keys(element.props).filter(k => k !== 'children').forEach(name => {
    if (name.startsWith('on')) dom.addEventListener(name.slice(2).toLowerCase(), element.props[name]);
    else dom[name] = element.props[name];
  });

  element.props.children.forEach(child => render(child, dom));
  container.appendChild(dom);
}

// —— 试试我们的迷你 React ——
function Greeting(props) {
  return createElement('h2', { style: 'color: teal' }, '你好，', props.name);
}

const box = document.createElement('div');
render(createElement('div', null,
  createElement(Greeting, { name: '迷你 React' }),
  createElement('button', { onClick: () => console.log('按钮能用！') }, '点我')
), box);

console.log(box.innerHTML);`, '一个 20 行的渲染器'),
    deep('这个迷你渲染器只会挂载：它每次都从零创建 DOM。真实 React 会保留上一次的树。类型相同，就复用 DOM 节点，只更新变化的属性。类型不同，才删除旧节点并重建。这就是第 19 课的协调。'),
    h('第三步：Hooks 的秘密'),
    p('React 是怎么知道 <code>useState</code> 调用对应哪个状态的？答案很简单。<b>每个组件有一个数组（实际是链表），按调用顺序存放 Hook 的 state</b>。React 再用一个游标记录“现在是第几个 Hook”。'),
    play(`
// —— 极简 Hooks 实现 ——
let hooks = [];      // 存放当前组件所有 Hook 的状态
let cursor = 0;      // 当前执行到第几个 Hook
let Component;       // 当前组件

function useState(initial) {
  const i = cursor;                       // 记住自己的位置
  if (hooks[i] === undefined) hooks[i] = initial;
  const setState = (v) => {
    hooks[i] = typeof v === 'function' ? v(hooks[i]) : v;
    rerender();
  };
  cursor++;
  return [hooks[i], setState];
}

function rerender() {
  cursor = 0;                             // 每次渲染前把游标归零
  const output = Component();
  console.log('渲染结果：', output);
  return output;
}

// —— 一个使用两个 useState 的“组件” ——
let api;
Component = function Counter() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('小明');
  api = { setCount, setName };
  return name + ' 点击了 ' + count + ' 次';
};

rerender();
api.setCount(c => c + 1);
api.setName('小红');
api.setCount(c => c + 1);
console.log('内部 hooks 数组：', JSON.stringify(hooks));`, '20 行实现 useState'),
    p('现在你知道为什么<b>不能在 if 里调用 Hook</b> 了。如果某次渲染跳过了第一个 useState，游标就会错位。结果 name 会读到 count 的值。'),
    p('上面的演示只有一个组件，所以只用一个全局 hooks 数组。真实 React 中，每个组件实例对应一个 Fiber，Hook 链表存在 Fiber 上。React 先按树中的位置找到 Fiber，再按调用顺序找到 Hook。这就是第 19 课“状态跟着位置走”的原因：'),
    p('<ol class="task-steps"><li>位置和类型不变，就是同一个 Fiber，state 保留。</li><li>类型或 key 变了，React 新建 Fiber，state 清空。</li></ol>'),
    h('第四步：Fiber 与可中断渲染'),
    p('上面的 render 是<b>递归</b>的，一旦开始就必须一口气做完。如果组件树很大，主线程会被长时间占用，用户的输入得不到响应。React 16 引入的 <b>Fiber</b> 架构为解决这个问题打下了基础。React 18 起，过渡更新等并发渲染才真正可以中断；紧急更新仍然一次做完：'),
    ul(['每个组件对应一个 <b>Fiber 节点</b>。节点用 child、sibling、return 指针连成一棵树。React 遍历这棵树时可以随时暂停。', '渲染被拆成一个个小的工作单元，每完成一个就检查：时间片用完了吗？有更高优先级的任务吗？如果有，就<b>让出主线程</b>，稍后从断点继续。', '渲染阶段只构建新的 Fiber 树（work-in-progress 树），<b>不修改 DOM</b>。所以 React 可以随时丢弃它并重来。', '所有单元完成后，进入<b>提交阶段</b>。React 一次性、同步地把所有变更应用到 DOM。用户不会看到“画了一半”的界面。']),
    code(`// Fiber 工作循环的核心思想（极简伪代码）
let nextUnitOfWork = rootFiber;

function workLoop(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork); // 处理一个 Fiber，返回下一个
  }
  if (!nextUnitOfWork && wipRoot) commitRoot();         // 全部完成，一次性提交
  requestIdleCallback(workLoop);                        // 让出主线程，空闲时继续
}
requestIdleCallback(workLoop);

// 遍历顺序：先 child，没有就 sibling，再没有就回到 return(父节点) 找它的 sibling`, 'React 实际使用自己的调度器 Scheduler，而非 requestIdleCallback'),
    tip('想深入学习，可以读两份材料：Rodrigo Pombo 的《Build your own React》；React 源码中的 <code>packages/react-reconciler</code>。理解了这一课，你就已经掌握了阅读源码的地图。'),
  ],
  quiz: [
    { q: '在迷你 useState 中，若第二次渲染时 if 跳过了第一个 useState，name 会读到什么？', options: ['"小红"', 'count 的值', 'undefined', '报错'], answer: 1, explain: '游标从 0 开始。跳过第一个调用后，name 的 useState 拿到了下标 0，也就是 count 的 state。不会是 "小红"：Hook 只认位置，不认变量名。也不会报错，这正是这类 bug 难发现的原因。' },
    { q: '一棵 3000 个组件的树正在渲染一次过渡更新，渲染到一半时用户按下了键盘。在 Fiber 架构下会怎样？', options: ['等整棵树渲染完，再处理按键', '在工作单元之间让出主线程，先处理按键', 'React 把已经渲染好的一半先提交到 DOM，再处理按键', '浏览器强制中断 JavaScript，渲染出错'], answer: 1, explain: 'Fiber 把渲染拆成小单元，每做完一个就检查有没有更紧急的任务。渲染阶段不改 DOM，所以可以随时暂停或丢弃。第三项是常见误解：React 从不提交“一半”的结果，提交阶段总是一次性完成。' },
    { q: '为什么提交阶段必须同步一次完成，而渲染阶段可以中断？', options: ['因为 DOM 操作很慢，必须一次做完才快', '渲染阶段不改 DOM，可以重来；提交中断会露出半新半旧的界面', '因为 effect 必须在渲染阶段执行', '因为浏览器不允许分多次修改 DOM，中途的修改会被浏览器拒绝'], answer: 1, explain: '能不能中断，取决于用户看不看得见。渲染阶段的工作对用户不可见，随时可以重来。提交阶段一旦中断，用户就会看到不一致的界面。第一项是常见误解：分多次改 DOM 也可以很快，问题在于一致性，而不是速度。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>补全 <code>render</code>：每次渲染前，处理好游标。</li><li>补全 <code>useState(initial)</code>：按游标位置存取 state。setState 支持新值和函数，更新后重新渲染。</li><li>补全 <code>useRef(initial)</code>：也占用一个位置，每次渲染返回同一个 <code>{ current }</code> 对象。修改 current 不会重新渲染。</li><li>运行自测，看控制台的输出和 hooks 数组。本题不需要 App 组件。</li><li>检查时还会测试一个“在 if 里调用 Hook”的组件。想一想，它会读到什么？</li></ol>',
    starter: `// —— 迷你 Hooks 运行时 ——
let hooks = [];      // 当前组件的所有 Hook 数据，按调用顺序存放
let cursor = 0;      // 现在执行到第几个 Hook
let Component = null;
let output = null;

function render() {
  // 每次渲染前，游标要怎样处理？
  output = Component();
  return output;
}

function mount(fn) {
  hooks = [];
  Component = fn;
  return render();
}

function useState(initial) {
  // 1. 用游标确定自己的位置 i
  // 2. 第一次渲染时，把 initial 存进 hooks[i]
  // 3. 定义 setState(v)：v 可以是新值，也可以是函数。写入 hooks[i]，然后重新渲染
  // 4. 游标前进一格
  // 5. 返回 [当前值, setState]
  return [initial, () => {}]; // 占位：换成你的实现
}

function useRef(initial) {
  // 返回一个 { current } 对象，每次渲染都返回同一个对象
  // 修改 ref.current 不会重新渲染
  return { current: initial }; // 占位：换成你的实现
}

// 自测：结果打印在控制台
let api;
mount(function Counter() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('小明');
  const renders = useRef(0);
  renders.current++;
  api = { setCount, setName };
  return name + ' 点击了 ' + count + ' 次（第 ' + renders.current + ' 次渲染）';
});
console.log(output);
api.setCount(c => c + 1);
api.setName('小红');
console.log(output);
console.log('hooks：', JSON.stringify(hooks));`,
    solution: `// —— 迷你 Hooks 运行时 ——
let hooks = [];      // 当前组件的所有 Hook 数据，按调用顺序存放
let cursor = 0;      // 现在执行到第几个 Hook
let Component = null;
let output = null;

function render() {
  cursor = 0;
  output = Component();
  return output;
}

function mount(fn) {
  hooks = [];
  Component = fn;
  return render();
}

function useState(initial) {
  const i = cursor;
  if (i >= hooks.length) hooks[i] = initial;
  const setState = (v) => {
    hooks[i] = typeof v === 'function' ? v(hooks[i]) : v;
    render();
  };
  cursor++;
  return [hooks[i], setState];
}

function useRef(initial) {
  const i = cursor;
  if (i >= hooks.length) hooks[i] = { current: initial };
  cursor++;
  return hooks[i];
}

// 自测：结果打印在控制台
let api;
mount(function Counter() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('小明');
  const renders = useRef(0);
  renders.current++;
  api = { setCount, setName };
  return name + ' 点击了 ' + count + ' 次（第 ' + renders.current + ' 次渲染）';
});
console.log(output);
api.setCount(c => c + 1);
api.setName('小红');
console.log(output);
console.log('hooks：', JSON.stringify(hooks));`,
    hint: '1. 每个 Hook 调用时，先记下 <code>const i = cursor</code>，再让 cursor 加 1。setState 是一个闭包，它记住的是自己的 i。2. 只在 hooks 里还没有这一格时才存 initial。用 <code>!hooks[i]</code> 判断会出错：state 是 0 或空字符串时，它会被当成“还没有”。3. 不把游标归零，第二次渲染的 Hook 会跑到新的格子里。',
    faded: `// —— 迷你 Hooks 运行时 ——
let hooks = [];      // 当前组件的所有 Hook 数据，按调用顺序存放
let cursor = 0;      // 现在执行到第几个 Hook
let Component = null;
let output = null;

function render() {
  /* ✏️ 每次渲染前，让游标回到第一个 Hook */
  output = Component();
  return output;
}

function mount(fn) {
  hooks = [];
  Component = fn;
  return render();
}

function useState(initial) {
  const i = cursor;
  /* ✏️ 只在第一次渲染时，把 initial 存进 hooks[i] */
  const setState = (v) => {
    hooks[i] = typeof v === 'function' ? v(hooks[i]) : v;
    render();
  };
  /* ✏️ 让下一个 Hook 用下一格 */
  return [hooks[i], setState];
}

function useRef(initial) {
  const i = cursor;
  /* ✏️ 第一次渲染时，在 hooks[i] 存一个 { current: initial } 对象 */
  cursor++;
  return hooks[i];
}

// 自测：结果打印在控制台
let api;
mount(function Counter() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('小明');
  const renders = useRef(0);
  renders.current++;
  api = { setCount, setName };
  return name + ' 点击了 ' + count + ' 次（第 ' + renders.current + ' 次渲染）';
});
console.log(output);
api.setCount(c => c + 1);
api.setName('小红');
console.log(output);
console.log('hooks：', JSON.stringify(hooks));`,
    exports: ['mount', 'useState', 'useRef'],
    test: async (t) => {
      const { mount, useState, useRef } = t.exports;
      t.assert([mount, useState, useRef].every(f => typeof f === 'function'), '没有找到 mount、useState 和 useRef');
      let last, api, refs = [];
      mount(function Probe() {
        const [count, setCount] = useState(0);
        const [name, setName] = useState('小明');
        const r = useRef(0);
        r.current++; refs.push(r);
        api = { setCount, setName, r };
        last = count + '|' + name + '|' + r.current;
        return last;
      });
      t.assert(last === '0|小明|1', `第一次渲染应得到 0|小明|1（count|name|ref），实际是 ${last}`);
      api.setCount(c => c + 1);
      t.assert(last !== '0|小明|1' || refs.length > 1, 'setCount 之后组件没有重新渲染。setState 要调用 render()');
      t.assert(!last.startsWith('0|小明|'), `setCount(c => c + 1) 后，count 仍是初始值（${last}）。游标在每次渲染前归零了吗？没有归零，第二次渲染的 Hook 会跑到新的格子里，读到 initial`);
      t.assert(last === '1|小明|2', `setCount(c => c + 1) 后应得到 1|小明|2，实际是 ${last}。setState 支持函数吗？ref 每次渲染都是同一个对象吗？`);
      api.setName('小红');
      t.assert(last === '1|小红|3', `setName('小红') 后应得到 1|小红|3，实际是 ${last}`);
      api.setCount(0); api.setName('');
      t.assert(last === '0||5', `setCount(0)、setName('') 后应得到 0||5，实际是 ${last}。判断“第一次渲染”时，是不是把 0 和空字符串也当成了“还没有值”？`);
      t.assert(refs.every(x => x === refs[0]), 'useRef 每次渲染都应返回同一个对象');
      const before = refs.length;
      api.r.current = 100;
      t.assert(refs.length === before, '修改 ref.current 不应触发重新渲染');
      let flag = true, seen, setB;
      mount(function Conditional() {
        if (flag) { useState('A'); }
        const [b, sb] = useState('B');
        seen = b; setB = sb;
        return b;
      });
      t.assert(seen === 'B', `第一次渲染，b 应为 B，实际是 ${seen}`);
      flag = false;
      setB(x => x);
      t.assert(seen === 'A', `跳过 if 里的 useState 后，b 应该错位，读到第 0 格的 'A'，实际是 ${seen}。你的实现是按调用顺序存取的吗？`);
    }
  }
});

/* ---------- 25 ---------- */
lesson({
  id: 'engineering', stage: 3, title: '工程化、测试与持续成长', mins: 8,
  summary: '把知识用于真实项目：工具链、TypeScript、测试，以及接下来的学习路线。',
  goals: ['能按项目需求选择 Next.js、React Router 框架模式、Vite 或 Expo', '能判断一个测试是在测用户行为还是在测实现细节', '能按功能组织项目文件，并开启 StrictMode 和 react-hooks 规则', '能列出自己下一步要学的生态工具'],
  keyPoints: [
    '需要 SEO、服务端渲染或 RSC，用 Next.js 或 React Router 框架模式。纯客户端应用用 Vite。Create React App 已被弃用。',
    'React Testing Library 的原则：按文字、角色、标签查找元素，模拟用户操作，断言界面结果。不要断言 state 的值或内部方法。',
    'StrictMode 在开发环境故意把 effect 执行两次，帮你发现缺少清理函数的 bug。react-hooks 规则帮你发现依赖数组的错误。',
    '常见坑：用 eslint-disable 让依赖警告“安静”。应该修改代码，让 effect 真正不需要那个值。',
  ],
  body: [
    p('这一课是阶段 4 的收尾，讲三件事：新项目用什么工具创建、项目怎样组织、哪些开发期工具能帮你提前发现 bug。'),
    p('<b>它和第 32–36 课的分工：</b>这里只给每个生态工具一句话定位。TypeScript、路由、数据请求、测试和 Next.js 分别在第 32、33、34、35、36 课动手学。'),
    h('创建项目'),
    p('Create React App 已于 2025 年 2 月被官方正式弃用。今天的主流选择是：'),
    table(['场景', '推荐'], [
      ['全栈应用、需要 SEO、需要 RSC', '<b>Next.js</b>（App Router）或 <b>React Router</b> 框架模式（Remix v2 已并入）'],
      ['纯客户端应用、后台管理系统、学习练手', '<b>Vite</b>：<code>npm create vite@latest my-app -- --template react-ts</code>'],
      ['移动端 App', '<b>React Native</b> + Expo'],
    ]),
    h('TypeScript 与测试：先记住一句话'),
    ul(['<b>TypeScript</b>：给 props 和 state 写上类型，组件 API 就自带文档，编辑器在你写代码时就标出错误。团队项目几乎都用它。详见第 32 课。', '<b>测试</b>：React Testing Library 的原则是<b>测试用户看到和做的事，不测试实现细节</b>。按文字、角色、标签查找元素，模拟点击和输入，断言界面结果。不要断言 state 的值或组件内部方法。详见第 35 课。']),
    tip('本应用的“检查答案”按钮思路相同：渲染组件，模拟点击和输入，再检查页面。为了简单，它用 id 查找元素。真实测试应优先按角色和文字查找。'),
    h('项目结构与好习惯'),
    ul(['<b>按功能组织文件</b>，例如 features/cart、features/auth。不要按类型把文件全堆在 components/、hooks/ 里。', '开启 <b>StrictMode</b> 和 <b>ESLint</b>（包括 react-hooks 插件，v6 起使用 flat config，并包含 React Compiler 的规则）。它们在开发阶段就能发现很多 bug。', '考虑启用 <b>React Compiler</b>（2025 年 10 月发布 1.0 稳定版），让它自动做记忆化。', '组件保持<b>纯函数</b>：同样的 props 和 state，返回同样的 JSX。', '先让它工作，再用 Profiler 测量，最后才优化。']),
    h('你的下一站'),
    fig(`<div class="roadmap"><div><b>巩固</b><span>做 2～3 个完整项目：待办应用 → 带登录的博客 → 实时协作看板</span></div><div><b>生态</b><span>React Router、TanStack Query、Zustand、React Hook Form、Tailwind CSS</span></div><div><b>全栈</b><span>Next.js App Router、Server Functions、数据库与鉴权</span></div><div><b>深入</b><span>阅读 react.dev 全部文档、React 源码、参与开源组件库</span></div></div>`, '学习永远不会结束，但现在你已经有了专家的思维方式'),
    p('从“UI = f(state)”到 Fiber 和 Server Components，你已经深入理解了 React 本身。第五阶段介绍实际工作中常用的生态工具。第六阶段再回到 React 本身，讲调度、数据获取、状态架构和性能诊断这些专家级主题，最后用毕业设计把所有知识串起来。'),
  ],
  // 阶段测验专用的读代码题（格式同 lessons-6-checks.js）
  checkOnly: (() => {
    const pre = (src) => '<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">'
      + src.replace(/^\n/, '').replace(/\n\s*$/, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre></div>';
    return [
      {
        q: 'LoginForm 提交后，要等一个 500 ms 的请求返回，才显示“登录成功”。这个测试会怎样？' + pre(`
render(<LoginForm />);
await user.type(screen.getByLabelText('邮箱'), 'a@b.com');
await user.click(screen.getByRole('button', { name: '登录' }));
expect(screen.getByText('登录成功')).toBeInTheDocument();`),
        options: ['通过：await user.click 会一直等到请求完成、界面更新', '失败：文字还没出现，应改用 await findByText', '失败：getByLabelText 只能找 id，找不到输入框', '通过，但会打印“没有用 act 包裹”的警告'],
        answer: 1,
        explain: 'user.click 只等点击事件处理完，不会等请求返回。getBy… 立刻查找，找不到就抛错。findBy… 会反复查找，默认最多等 1 秒，适合异步出现的内容。getByLabelText 按 &lt;label&gt; 的文字查找，不需要 id。',
      },
      {
        q: '开发环境开启了 StrictMode，下面的计数每秒加 2。同事说：“生产环境没有 StrictMode，每秒只加 1，所以不用改。”哪项判断正确？' + pre(`
useEffect(() => {
  setInterval(() => setCount(c => c + 1), 1000);
}, []);`),
        options: ['同事说得对：多出的定时器只在开发环境出现，生产环境没有 bug', '生产环境确实每秒加 1，但 bug 还在：组件卸载后，定时器仍在运行', '生产环境也每秒加 2：StrictMode 在生产环境同样生效', '应该关掉 StrictMode，让开发环境和生产环境表现一致'],
        answer: 1,
        explain: 'StrictMode 在开发环境故意多做一次“挂载 → 卸载 → 挂载”，正是为了暴露缺少清理函数的 bug。生产环境只挂载一次，所以每秒加 1。但组件卸载后，没有人停掉这个定时器：它会一直运行，每秒白白调用一次 set 函数。回调里如果还发请求，浪费会更明显。最有迷惑性的是第一项：StrictMode 没有制造 bug，只是让它提前出现。修法是保存 id，并返回清理函数 <code>() =&gt; clearInterval(id)</code>，而不是关掉 StrictMode。',
      },
      {
        q: '团队要做一个内部后台管理系统。不需要 SEO，只能部署到静态文件服务器（只能放 HTML、JS、CSS，不能运行 Node.js）。新项目该怎样创建？',
        options: ['Next.js App Router，用 Server Functions 处理表单', '用 Vite 创建纯客户端应用', '用 Create React App，它的配置最少', 'React Router 框架模式，开启服务端渲染'],
        answer: 1,
        explain: '纯客户端应用打包后只有静态文件，任何静态服务器都能部署。Server Functions 和服务端渲染都要在服务器上运行代码，静态服务器做不到。最有迷惑性的是 Create React App：它也能产出静态文件，但已于 2025 年 2 月被官方弃用，不再维护。',
      },
    ];
  })(),
  quiz: [
    { q: '同事的测试断言 Counter 内部的 count state 等于 1。后来把 Counter 改成 useReducer，界面行为完全没变，测试却失败了。说明什么？', options: ['重构引入了 bug，应该回滚', '测试绑定了实现细节，应断言用户看到的界面', '应该再给 reducer 写一个单独的 state 测试', '应该改用快照测试，它不怕重构，界面没变就不会失败'], answer: 1, explain: '用户看到的东西没变，测试就不该失败。断言内部 state 的测试，每次重构都会误报。快照测试也一样脆弱：任何无关的标记变化都会让它失败。按用户看得见的文字和角色去断言，重构时测试才稳定。' },
    { q: '要新建一个需要 SEO 和服务端渲染的全栈 React 应用，更合适的是？', options: ['Vite 创建项目，再加上 React Router 的组件', 'Next.js 或 React Router 框架模式', 'Create React App，它配置最少', 'Vite 创建项目，在 useEffect 里请求数据'], answer: 1, explain: '框架提供服务端渲染、路由和数据加载。Vite 默认是纯客户端渲染，服务器发出的 HTML 几乎是空的，对 SEO 不友好。加上 React Router 的组件也不会改变这一点。CRA 已于 2025 年 2 月正式弃用。' },
    { q: 'ESLint 的 react-hooks 规则报告：React Hook useEffect has a missing dependency: \'count\'。effect 里用了 count，依赖写的是 []。你应该？', options: ['在这一行上方加 eslint-disable 注释，让警告不再出现', '把 count 写进依赖，或改用函数式更新', '在 ESLint 配置里关闭这条规则', '把 count 移到组件外，变成模块级变量'], answer: 1, explain: '这条警告通常在提醒你一个过期闭包：effect 读到的永远是旧的 count。关掉警告，bug 还在。把 count 变成模块级变量，它就不再是 state，改了也不会重新渲染。' },
    { q: '项目里已有 features/cart 和 features/auth 两个目录。你要写一个“购物车角标”组件和它用到的 useCartCount Hook。放在哪里最合适？', options: ['组件放 components/，Hook 放 hooks/', '都放进 features/cart/', '都放进 utils/', '放进 features/auth/，因为角标在页头里'], answer: 1, explain: '按功能组织：和购物车有关的代码放在一起，改需求时只需要打开一个目录。按类型分到 components/ 和 hooks/，小项目还行；项目变大后，改一个功能要在多个目录之间跳来跳去。' },
  ],
});
