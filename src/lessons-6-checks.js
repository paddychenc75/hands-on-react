/* ========== 阶段测验专用的读代码题（lesson.checkOnly） ==========
   这些题不出现在课内，只在阶段测验中抽取，检验能否把核心概念迁移到新代码上。
   答错时，阶段测验会链接回题目所属的课。 */
const CHECK_PRE = (src) => '<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">'
  + src.replace(/^\n/, '').replace(/\n\s*$/, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  + '</code></pre></div>';

const CHECK_ONLY = {
  /* ---------- 01 入门 ---------- */
  'jsx': [
    {
      q: '下面的 <code>&lt;p&gt;</code> 在页面上显示什么文字？' + CHECK_PRE(`
<p>{true}{null}{undefined}{0}{''}{'ok'}</p>`),
      options: ['0ok', 'ok', 'truenullundefined0ok', 'true0ok'],
      answer: 0,
      explain: 'true、false、null、undefined 和空字符串都不会显示。数字 0 是一个普通的值，React 会把它显示出来。所以结果是“0ok”。这就是 <code>{count &amp;&amp; …}</code> 会多出一个 0 的原因。',
    },
  ],
  'components-props': [
    {
      q: '父组件写 <code>&lt;Badge label={null} count={3} /&gt;</code>。页面显示什么？' + CHECK_PRE(`
function Badge({ label = '新', count }) {
  return <span>{label}:{count}</span>;
}`),
      options: ['新:3', ':3', 'null:3', '报错：label 不能是 null'],
      answer: 1,
      explain: '解构的默认值只在值为 <code>undefined</code> 时生效。这里传的是 <code>null</code>，所以 label 就是 null。null 在 JSX 中不显示，结果是“:3”。想用默认值，就不要传这个 prop，或者传 <code>undefined</code>。',
    },
  ],
  'state': [
    {
      q: 'n 为 0。点击一次按钮后，界面显示几？控制台打印几？' + CHECK_PRE(`
const [n, setN] = useState(0);

function handle() {
  setN(n + 5);
  setN(m => m * 2);
  console.log(n);
}`),
      options: ['显示 10，打印 0', '显示 10，打印 10', '显示 5，打印 0', '显示 10，打印 5'],
      answer: 0,
      explain: 'React 按顺序处理更新队列：<ol class="task-steps"><li><code>setN(n + 5)</code>：这次渲染的 n 是 0，所以设为 5。</li><li><code>m =&gt; m * 2</code>：拿到上一步的 5，得到 10。</li></ol>console.log 读的是这次渲染的快照，n 仍是 0。',
    },
  ],
  'events': [
    {
      q: '运行这个组件，会发生什么？' + CHECK_PRE(`
function App() {
  const [count, setCount] = useState(0);
  return <button onClick={setCount(count + 1)}>+1</button>;
}`),
      options: ['每次点击加 1', '页面打开时显示 1，之后点击无效', 'React 报错：重新渲染次数过多，无限循环', '什么都不发生，按钮显示 +1'],
      answer: 2,
      explain: '<code>onClick={setCount(count + 1)}</code> 在<b>渲染时</b>就调用了 set 函数。set 函数触发重新渲染，重新渲染又调用 set 函数，形成无限循环。React 会报错“Too many re-renders”。应传入函数：<code>onClick={() =&gt; setCount(count + 1)}</code>。',
    },
    {
      q: '点击“提交”按钮，会怎样？' + CHECK_PRE(`
<form onSubmit={() => setMsg('已提交')}>
  <button type="submit" onClick={e => e.stopPropagation()}>
    提交
  </button>
</form>`),
      options: ['显示“已提交”，页面不刷新', 'onSubmit 不执行，因为点击事件被阻止冒泡', 'onSubmit 执行，但随后浏览器提交表单并刷新页面，看不到“已提交”', '什么都不发生'],
      answer: 2,
      explain: 'stopPropagation 只阻止<b>点击事件</b>继续冒泡。它不取消浏览器的默认行为。点击提交按钮仍会触发表单的 submit 事件，onSubmit 照常执行。随后浏览器提交表单，页面刷新。要阻止刷新，应在 onSubmit 中调用 <code>e.preventDefault()</code>。',
    },
  ],
  'conditional': [
    {
      q: '在 React 18 及以后，<code>&lt;Status online={false} /&gt;</code> 会渲染什么？' + CHECK_PRE(`
function Status({ online }) {
  if (online) return <b>在线</b>;
}`),
      options: ['什么都不渲染', '报错：组件必须返回 null，不能返回 undefined', '显示文字 undefined', '显示文字 false'],
      answer: 0,
      explain: 'online 为 false 时，函数没有 return，返回 undefined。从 React 18 开始，组件返回 undefined 和返回 null 一样，什么都不渲染。React 17 及以前会报错。为了让意图清楚，仍建议写 <code>return null</code>。',
    },
  ],
  'lists-keys': [
    {
      q: '每条待办要渲染两个 <code>&lt;li&gt;</code>。key 应该写在哪里？' + CHECK_PRE(`
{todos.map(t => (
  <>
    <li>{t.title}</li>
    <li>{t.due}</li>
  </>
))}`),
      options: ['写在第一个 <li> 上：<li key={t.id}>', '两个 <li> 都写 key={t.id}', '改用 <Fragment key={t.id}> 包住两个 <li>', '不需要：片段会自动生成 key'],
      answer: 2,
      explain: 'key 必须写在 map 直接返回的那个元素上。这里返回的是片段。简写 <code>&lt;&gt;&lt;/&gt;</code> 不能写属性，所以要改成 <code>&lt;Fragment key={t.id}&gt;</code>。两个 li 都写同一个 key 也不对：它们在同一个片段里，不是 map 的直接返回值。',
    },
  ],
  'forms': [
    {
      q: '在输入框里打第一个字时，会发生什么？' + CHECK_PRE(`
const [name, setName] = useState();

<input value={name} onChange={e => setName(e.target.value)} />`),
      options: ['输入框只读，打不了字', '能输入，但 React 警告：输入框从非受控变成受控；应写 useState(\'\')', '报错并崩溃', '完全正常，没有任何提示'],
      answer: 1,
      explain: '初始值是 undefined。<code>value={undefined}</code> 等于没写 value，输入框是非受控的。打字后 value 变成字符串，输入框又变成受控的。React 会警告这种切换。给 state 一个空字符串作为初始值即可。',
    },
  ],
  'project-todo': [
    {
      q: '添加一条未完成的待办后，“剩余”显示的数字会怎样？' + CHECK_PRE(`
const [todos, setTodos] = useState(initialTodos);
const [left, setLeft] = useState(
  todos.filter(t => !t.done).length
);

function add(todo) {
  setTodos([...todos, todo]);
}
// …
<p>剩余 {left} 项</p>`),
      options: ['自动加 1', '不变：useState 的初始值只在第一次渲染时使用', '变成 0', '报错：不能用 todos 计算初始值'],
      answer: 1,
      explain: 'useState 的参数只在第一次渲染时使用。之后 todos 变了，left 也不会跟着变。剩余数量可以由 todos 算出，就不要存成 state。直接在渲染时计算：<code>const left = todos.filter(t =&gt; !t.done).length</code>。',
    },
    {
      q: '列表里有 id 为 1、2、3 的三条待办。先删除 id 为 1 的，再添加“买菜”，然后点击“买菜”的切换按钮。结果是？' + CHECK_PRE(`
const add = title =>
  setTodos([...todos, { id: todos.length + 1, title, done: false }]);

const toggle = id =>
  setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));`),
      options: ['只有“买菜”被标记完成', '“买菜”和原来 id 为 3 的那条一起被切换', '原来 id 为 3 的那条被切换，“买菜”不变', '报错：找不到 id'],
      answer: 1,
      explain: '删除后只剩 2 条，<code>todos.length + 1</code> 等于 3。“买菜”的 id 与已有的一条重复。toggle 按 id 匹配，所以两条一起切换。重复的 key 也会让 React 发出警告。id 应该用独立的计数器或 <code>crypto.randomUUID()</code> 生成。',
    },
  ],

  /* ---------- 02 进阶 ---------- */
  'lifting-state': [
    {
      q: '父组件渲染 <code>&lt;Child value={count} /&gt;</code>。count 从 0 变成 5 后，Child 显示几？' + CHECK_PRE(`
function Child({ value }) {
  const [v, setV] = useState(value);
  return <p>{v}</p>;
}`),
      options: ['5', '0', '先显示 0，下一次渲染显示 5', '报错'],
      answer: 1,
      explain: 'useState(value) 只在第一次渲染时读取 value。之后 props 变了，v 不会更新。数据应该只有一个来源。Child 直接显示 <code>value</code> 就行，不要再复制一份到 state。',
    },
  ],
  'use-reducer': [
    {
      q: '点击按钮执行 <code>dispatch({ type: \'add\', item: \'b\' })</code>。列表会怎样？' + CHECK_PRE(`
function reducer(state, action) {
  switch (action.type) {
    case 'add':
      state.items.push(action.item);
      return state;
  }
}`),
      options: ['正常显示新的一项', '不更新：reducer 返回了同一个对象，React 认为 state 没变', '报错：reducer 不能修改数组', '新的一项显示两次'],
      answer: 1,
      explain: 'reducer 修改了原对象，然后把<b>同一个对象</b>返回。React 用 Object.is 比较新旧 state，发现相同，就跳过这次更新。界面不变。正确写法是返回新对象：<code>return { ...state, items: [...state.items, action.item] }</code>。',
    },
  ],
  'context': [
    {
      q: 'Footer 里调用 <code>useContext(ThemeCtx)</code>，读到什么？' + CHECK_PRE(`
const ThemeCtx = createContext('light');

function App() {
  const [theme, setTheme] = useState('dark');
  return (
    <>
      <ThemeCtx.Provider value={theme}>
        <Toolbar />
      </ThemeCtx.Provider>
      <Footer />
    </>
  );
}`),
      options: ['\'dark\'', '\'light\'', 'undefined', '报错：Footer 不在 Provider 里'],
      answer: 1,
      explain: 'useContext 向上查找最近的 Provider。Footer 是 Provider 的兄弟，不在它里面。所以 Footer 读到 createContext 的默认值 \'light\'。Toolbar 在 Provider 里面，读到 \'dark\'。',
    },
  ],
  'use-ref': [
    {
      q: '先点 3 次“+1”，再点 1 次“刷新”。<code>&lt;p&gt;</code> 依次显示什么？' + CHECK_PRE(`
const count = useRef(0);
const [, setTick] = useState(0);

<button onClick={() => { count.current++; }}>+1</button>
<button onClick={() => setTick(t => t + 1)}>刷新</button>
<p>{count.current}</p>`),
      options: ['点 +1 时一直是 0；点“刷新”后显示 3', '点 +1 时依次显示 1、2、3', '一直是 0，点“刷新”后也是 0', '点“刷新”后显示 1'],
      answer: 0,
      explain: '修改 ref.current 不会触发重新渲染，所以点 +1 时界面不变。但 ref 的值在渲染之间会保留，一直在增加。点“刷新”触发重新渲染，这时读到的 count.current 是 3。普通变量做不到这一点：每次渲染都会重新初始化。',
    },
  ],
  'use-effect': [
    {
      q: 'roomId 从 \'a\' 变成 \'b\'。变化后，控制台按顺序新增哪些输出？' + CHECK_PRE(`
useEffect(() => {
  console.log('连接', roomId);
  return () => console.log('断开', roomId);
}, [roomId]);`),
      options: ['断开 b，连接 b', '断开 a，连接 b', '连接 b，断开 a', '只有 连接 b'],
      answer: 1,
      explain: '依赖变化后，React 先运行<b>上一次</b> effect 的清理函数，再运行新的 effect。清理函数是上一次渲染创建的，它记住的 roomId 是 \'a\'。所以先“断开 a”，再“连接 b”。',
    },
  ],
  'custom-hooks': [
    {
      q: 'a 初始为 false。点击按钮后，a 是什么？' + CHECK_PRE(`
function useToggle(init) {
  const [on, setOn] = useState(init);
  return [on, () => setOn(!on)];
}

function App() {
  const [a, toggleA] = useToggle(false);
  return (
    <button onClick={() => { toggleA(); toggleA(); }}>
      {String(a)}
    </button>
  );
}`),
      options: ['false：切换了两次，回到原值', 'true', '报错：同一个 Hook 不能调用两次', 'a 在 true 和 false 之间不停闪烁'],
      answer: 1,
      explain: '两次 toggleA 是同一次渲染创建的函数，读到的 on 都是 false。两次都执行 <code>setOn(true)</code>，结果是 true。自定义 Hook 不会改变 state 的快照规则。想连续切换，应写 <code>setOn(o =&gt; !o)</code>。',
    },
    {
      q: 'id 一开始是 null，之后变成 5。Header 会怎样？' + CHECK_PRE(`
function useCurrentUser(id) {
  if (id == null) return null;
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetchUser(id).then(setUser);
  }, [id]);
  return user;
}

function Header({ id }) {
  const user = useCurrentUser(id);
  const [open, setOpen] = useState(false);
  // …
}`),
      options: ['正常：先得到 null，请求完成后得到用户', '报错：这次渲染调用的 Hook 比上次多', '不报错，但 open 读到了 user 的 state', '报错：自定义 Hook 不能返回 null'],
      answer: 1,
      explain: '自定义 Hook 里的 Hook 都算在调用它的组件头上。id 为 null 时，Header 只调用了 1 个 Hook（open 的 useState）。id 变成 5 后，Header 依次调用 useState、useEffect、useState，一共 3 个。React 按调用顺序对应 Hook，数量变了就报错“Rendered more hooks than during the previous render”。最迷惑的是第一项：Hooks 规则同样适用于自定义 Hook 内部。修法：先调用所有 Hook，再在 effect 里判断 <code>if (id == null) return;</code>。',
    },
  ],
  'escape-hatches': [
    {
      q: '父组件写 <code>&lt;MyInput ref={inputRef} label="邮箱" /&gt;</code>，然后在 effect 中调用 <code>inputRef.current.focus()</code>。结果是？' + CHECK_PRE(`
function MyInput({ label }) {
  return <input aria-label={label} />;
}`),
      options: ['输入框获得焦点', 'inputRef.current 是 null，调用 focus 时报错', 'inputRef.current 是 MyInput 组件对象', 'focus 被调用，但没有效果'],
      answer: 1,
      explain: 'ref 没有被交给 <code>&lt;input&gt;</code>。在 React 18 中，函数组件收不到 ref，要用 forwardRef 转发。在 React 19 中，ref 是普通 prop，但这里没有用到它。两种情况下 inputRef.current 都是 null。修复：把 ref 传给 <code>&lt;input ref={ref} /&gt;</code>。',
    },
  ],
  'project-search': [
    {
      q: '这个组件第一次显示的用户是对的。之后 id 从 1 变成 2，会怎样？' + CHECK_PRE(`
useEffect(() => {
  let ignore = false;
  fetchUser(id).then(u => {
    if (!ignore) setUser(u);
  });
  return () => { ignore = true; };
}, []);`),
      options: ['显示用户 2', '仍然显示用户 1：依赖数组漏了 id，effect 不会重新运行', '先显示用户 2，再被用户 1 覆盖', '报错：ignore 必须放到组件外面'],
      answer: 1,
      explain: '依赖数组是空的，effect 只在挂载后运行一次。id 变了，不会重新请求。修复：写成 <code>[id]</code>。这时 ignore 才发挥作用：id 变化时，清理函数把旧请求标记为过期，旧结果不会覆盖新结果。',
    },
  ],
  'project-kanban': [
    {
      q: '应用包在 <code>&lt;StrictMode&gt;</code> 里，在开发环境运行。点一次“右移”，卡片会怎样？' + CHECK_PRE(`
case 'move':
  return {
    ...state,
    cards: state.cards.map(c =>
      c.id === action.id ? (c.col += action.dir, c) : c
    ),
  };`),
      options: ['右移一列', '右移两列', '不移动：返回的还是同一个数组', '报错：reducer 不能用逗号表达式'],
      answer: 1,
      explain: '<code>c.col += action.dir</code> 直接修改了旧的卡片对象。严格模式在开发环境会把 reducer 调用两次，用来暴露这种副作用。两次调用改的是同一个对象，所以卡片移动了两列。纯函数写法：<code>c.id === action.id ? { ...c, col: c.col + action.dir } : c</code>。',
    },
  ],

  /* ---------- 03 高级 ---------- */
  'rendering': [
    {
      q: '点击按钮后，组件会渲染几次（不算第一次挂载）？' + CHECK_PRE(`
const [a, setA] = useState(0);
const [b, setB] = useState(0);
console.log('render', a, b);

<button onClick={() => {
  setTimeout(() => {
    setA(1);
    setB(2);
  }, 0);
}}>更新</button>`),
      options: ['1 次，打印 render 1 2', '2 次：在 setTimeout 里不会批处理', '0 次', '3 次'],
      answer: 0,
      explain: '从 React 18 开始，批处理是自动的。在事件处理函数、setTimeout、Promise 回调中，同一时刻的多次 set 函数都会合并成一次渲染。React 17 在 setTimeout 里会渲染 2 次。',
    },
    {
      q: '先把 Counter 点到 2，再让 showBanner 变成 true。Counter 显示几？' + CHECK_PRE(`
<div>
  {showBanner && <Banner />}
  <Counter />
</div>`),
      options: ['2：Counter 的位置没有变', '0：前面多了一个元素，Counter 被重新创建', '1', '报错'],
      answer: 0,
      explain: '<code>{showBanner &amp;&amp; …}</code> 在 false 时也占着一个“空位”。所以 Counter 一直是 div 的第二个子节点，位置不变，state 保留。如果改成 if/else 返回两棵结构不同的树，Counter 的位置才可能改变。',
    },
  ],
  'performance': [
    {
      q: '父组件每次渲染都写 <code>&lt;Card&gt;&lt;p&gt;hi&lt;/p&gt;&lt;/Card&gt;</code>。父组件重新渲染时，Card 会怎样？' + CHECK_PRE(`
const Card = memo(function Card({ children }) {
  return <div className="card">{children}</div>;
});`),
      options: ['跳过渲染：内容没有变', '照样重新渲染：children 每次都是新创建的元素对象', '只渲染第一次', '报错：memo 组件不能接收 children'],
      answer: 1,
      explain: 'children 也是一个 prop。<code>&lt;p&gt;hi&lt;/p&gt;</code> 每次渲染都会创建一个新的元素对象。memo 做浅比较，发现 children 变了，于是重新渲染。要让 memo 生效，可以用 useMemo 记忆化这段 JSX，或者把它放到不会重新渲染的组件里创建。',
    },
    {
      q: '在输入框里输入“你好”，再点击“保存”。<code>save</code> 收到什么？' + CHECK_PRE(`
const [text, setText] = useState('');

const handleSave = useCallback(() => {
  save(text);
}, []);`),
      options: ['\'你好\'', '\'\'（空字符串）', 'undefined', '每次输入都会调用 save'],
      answer: 1,
      explain: '依赖数组是空的，useCallback 一直返回第一次渲染创建的函数。这个函数记住的 text 是空字符串。这是过期闭包。修复：把 text 写进依赖数组 <code>[text]</code>。',
    },
  ],
  'closures': [
    {
      q: '在输入框里输入“hi”，然后按 Enter。控制台打印什么？' + CHECK_PRE(`
const [text, setText] = useState('');

useEffect(() => {
  const onKey = e => {
    if (e.key === 'Enter') console.log(text);
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, []);`),
      options: ['hi', '\'\'（空字符串）', 'undefined', '每按一个键打印一次'],
      answer: 1,
      explain: 'effect 只在挂载时运行一次，onKey 是第一次渲染创建的。它记住的 text 永远是空字符串。修复方式：把 text 加入依赖数组，让 effect 重新注册监听；或者用 ref 保存最新值，在 onKey 中读 ref.current。',
    },
    {
      q: '这个计数器运行起来会怎样？' + CHECK_PRE(`
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, [count]);`),
      options: ['停在 1', '能每秒加 1，但 count 每变一次，定时器就被清除并重建一次', '越来越快，因为定时器越来越多', '只加一次，之后报错'],
      answer: 1,
      explain: 'count 在依赖数组里。每次 count 变化，React 先运行清理函数清除旧定时器，再用新的 count 创建新定时器。所以计数正确，也不会堆积定时器。缺点是定时器不断重建。用 <code>setCount(c =&gt; c + 1)</code> 配合 <code>[]</code> 更简单。',
    },
  ],
  'suspense': [
    {
      q: 'Chart 是 lazy 组件。网络断开，加载它的 import 失败了。页面依次显示什么？' + CHECK_PRE(`
<ErrorBoundary fallback={<p>出错了</p>}>
  <Suspense fallback={<p>加载中…</p>}>
    <Chart />
  </Suspense>
</ErrorBoundary>`),
      options: ['先显示“加载中…”，然后显示“出错了”', '一直显示“加载中…”', '直接显示“出错了”', '整个页面白屏'],
      answer: 0,
      explain: '加载期间，Chart 挂起，最近的 Suspense 显示 fallback。import 失败后，lazy 在渲染时抛出错误。错误向上找到最近的错误边界，显示“出错了”。Suspense 负责“等待”，错误边界负责“失败”，两者常常一起用。',
    },
  ],
  'concurrent': [
    {
      q: '第一次渲染时 text 是空字符串。输入一个字母“a”后，控制台依次新增哪些输出（不考虑严格模式）？' + CHECK_PRE(`
const [text, setText] = useState('');
const deferred = useDeferredValue(text);
console.log(JSON.stringify(text), JSON.stringify(deferred));`),
      options: ['"a" ""，然后 "a" "a"', '只有 "a" "a"', '"" "a"，然后 "a" "a"', '只有 "a" ""'],
      answer: 0,
      explain: 'useDeferredValue 让 React 先做一次紧急渲染：text 已是新值，deferred 仍是旧值。然后 React 在后台再渲染一次，这次 deferred 也更新为 "a"。所以输入框立刻响应，依赖 deferred 的慢列表稍后更新。',
    },
    {
      q: '同事想让输入更流畅，这样写了受控输入框。会出现什么问题？' + CHECK_PRE(`
const [query, setQuery] = useState('');
const [isPending, startTransition] = useTransition();

<input
  value={query}
  onChange={e => startTransition(() => setQuery(e.target.value))}
/>`),
      options: ['没有问题，输入更流畅了', '输入框的值也变成了不紧急的更新，可能显示滞后或卡顿；输入框的 state 应该同步更新', '报错：onChange 里不能调用 startTransition', 'isPending 永远是 false'],
      answer: 1,
      explain: '受控输入框的 value 必须立刻更新，否则用户会感到输入延迟。React 文档明确说明：不要用过渡更新控制文本输入。正确做法：<ol class="task-steps"><li>用普通的 set 函数更新输入框的 state。</li><li>把昂贵的结果列表放进 startTransition，或者用 useDeferredValue。</li></ol>',
    },
  ],
  'profiling': [
    {
      q: 'Clock 每秒更新一次。BigList 用 memo 包裹，props 不变，渲染一次要 20ms。每秒控制台会怎样？' + CHECK_PRE(`
<Profiler id="App" onRender={(id, phase, actual, base) =>
  console.log(phase, actual, base)}>
  <Clock />
  <BigList />
</Profiler>`),
      options: ['每秒打印一次 update；actual 很小，base 约 20 多 ms', '不打印：Profiler 只记录挂载', '每秒打印一次 update；actual 和 base 都约 20 多 ms', '只有 BigList 变化时才打印'],
      answer: 0,
      explain: 'Profiler 内任何组件提交更新，都会调用 onRender。actualDuration 只算这次真正渲染的组件：只有 Clock，所以很小。baseDuration 估算整棵子树不用 memo 时的耗时，包含 BigList。两者差距大，说明 memo 生效了。',
    },
  ],

  /* ---------- 04 专家 ---------- */
  'patterns': [
    {
      q: '有人在 <code>&lt;Tabs&gt;</code> 外面单独渲染了 <code>&lt;Tab id="a" /&gt;</code>。会怎样？' + CHECK_PRE(`
const TabsCtx = createContext(null);

function Tab({ id }) {
  const { active, setActive } = useContext(TabsCtx);
  // …
}`),
      options: ['正常显示，active 为 undefined', '报错：无法从 null 中解构 active', 'Tab 自动创建一个新的 Tabs', '什么都不渲染'],
      answer: 1,
      explain: '没有 Provider，useContext 返回默认值 null。从 null 解构会抛出 TypeError，错误信息不容易看懂。常见做法：写一个 <code>useTabs()</code> Hook，在值为 null 时抛出清楚的错误，例如“Tab 必须放在 Tabs 里”。',
    },
    {
      q: '父组件渲染 <code>&lt;Toggle defaultValue={on} /&gt;</code>。父组件把 on 从 false 改为 true，按钮显示什么？' + CHECK_PRE(`
function Toggle({ defaultValue = false }) {
  const [on, setOn] = useState(defaultValue);
  return (
    <button onClick={() => setOn(!on)}>{on ? '开' : '关'}</button>
  );
}`),
      options: ['开', '关：defaultValue 只决定初始值', '在开和关之间切换', '报错'],
      answer: 1,
      explain: '这是非受控模式：组件自己保存值，defaultValue 只在第一次渲染时使用。父组件想随时控制显示，应改用受控模式：传 value 和 onChange。或者在 defaultValue 变化时换一个 key，让组件重新挂载。',
    },
  ],
  'accessibility': [
    {
      q: '下面四个图标按钮中，哪一个<b>没有</b>可访问名称？（<code>sr-only</code> 是视觉隐藏、读屏软件可读的样式。）',
      options: [
        '<button aria-label="关闭"><svg aria-hidden="true" /></button>',
        '<button><svg aria-hidden="true" /><span className="sr-only">关闭</span></button>',
        '<button><img src="close.svg" alt="" /></button>',
        '<button><img src="close.svg" alt="关闭" /></button>',
      ],
      answer: 2,
      explain: '按钮的名称来自 aria-label 或它里面的文字内容。图片的 alt 也算文字内容。<code>alt=""</code> 表示“这是装饰图片”，读屏软件会跳过它。这样按钮里没有任何文字，读屏软件只会读“按钮”。',
    },
  ],
  'state-architecture': [
    {
      q: '把第一项改名为“青苹果”后，<code>&lt;p&gt;</code> 显示什么？' + CHECK_PRE(`
const [items, setItems] = useState([
  { id: 1, name: '苹果' }, { id: 2, name: '香蕉' },
]);
const [selected, setSelected] = useState(items[0]);

function rename() {
  setItems(items.map(i => i.id === 1 ? { ...i, name: '青苹果' } : i));
}
// …
<p>{items[0].name} | 已选：{selected.name}</p>`),
      options: ['青苹果 | 已选：青苹果', '青苹果 | 已选：苹果', '苹果 | 已选：苹果', '报错'],
      answer: 1,
      explain: 'selected 保存的是旧对象。改名时创建了新对象，selected 仍指向旧的。同一份数据存了两处，就会不同步。更好的设计：只存 <code>selectedId</code>，渲染时用 <code>items.find(i =&gt; i.id === selectedId)</code> 算出选中项。',
    },
    {
      q: '组件用 <code>useSyncExternalStore(store.subscribe, store.get)</code> 读取 store。调用 <code>store.inc()</code> 后，界面会怎样？' + CHECK_PRE(`
const state = { count: 0 };
const store = {
  get: () => state,
  inc() {
    state.count++;
    listeners.forEach(l => l());
  },
  // subscribe 省略
};`),
      options: ['正常显示新数字', '不更新：get 返回的仍是同一个对象，React 认为快照没变', '报错：state 必须是数组', '无限循环'],
      answer: 1,
      explain: 'useSyncExternalStore 用 Object.is 比较前后两次 getSnapshot 的返回值。这里修改了原对象，返回的还是同一个引用，React 就跳过渲染。修复：每次更新创建新对象，例如 <code>state = { ...state, count: state.count + 1 }</code>（state 改用 let 声明）。',
    },
  ],
  'react-19': [
    {
      q: '提交表单时报错 <code>formData.get is not a function</code>。问题出在哪里？' + CHECK_PRE(`
const [message, formAction, isPending] = useActionState(
  async (formData) => {
    const name = formData.get('name');
    return '已保存 ' + name;
  },
  null
);

<form action={formAction}>…</form>`),
      options: ['action 函数的第一个参数是上一次的 state，第二个参数才是 formData', 'useActionState 的初始值不能是 null', '<form action> 只接受字符串 URL', 'action 函数不能是 async'],
      answer: 0,
      explain: 'useActionState 调用 action 时，传入 <code>(previousState, formData)</code>。这里第一个参数其实是上一次的 state（第一次是 null）。改成 <code>async (prev, formData) =&gt; …</code> 即可。',
    },
    {
      q: '评论区一直显示 fallback，不停地重新请求。哪种改法是对的？' + CHECK_PRE(`
'use client';

function Comments({ postId }) {
  const comments = use(fetchComments(postId)); // 返回新的 Promise
  return comments.map(c => <p key={c.id}>{c.text}</p>);
}`),
      options: ['在服务端组件里调用 fetchComments(postId)，把 Promise 作为 prop 传给 Comments，再 use 它', '改成 use(useMemo(() => fetchComments(postId), [postId]))', '把 use(fetchComments(postId)) 移进 useEffect 里调用', '用 try/catch 包住 use(…)，出错时返回空列表'],
      answer: 0,
      explain: '问题在于每次渲染都新建 Promise。Promise 完成后 React 重新渲染 Comments，又得到一个未完成的新 Promise，于是再次挂起。Promise 要在渲染之外创建，并且保持同一个对象：由服务端组件创建后传入，或者用按 postId 缓存请求的函数。最迷惑的是 useMemo：组件第一次挂载就挂起，这次渲染没有提交，useMemo 记住的值会被丢掉，重试时又新建一个 Promise。use 也不能在 effect 里调用，也不能放在 try/catch 里。',
    },
  ],
  'server-components': [
    {
      q: '<code>page.js</code> 是服务端组件，<code>Tabs</code> 是客户端组件。这样写可以吗？' + CHECK_PRE(`
// Tabs.js
'use client';
export default function Tabs({ children }) { /* 用了 useState */ }

// page.js（服务端组件）
import Tabs from './Tabs';
import Stats from './Stats'; // 服务端组件，会查数据库

export default function Page() {
  return <Tabs><Stats /></Tabs>;
}`),
      options: ['可以：Stats 仍在服务器上渲染，结果作为 children 传给 Tabs', '报错：客户端组件里不能出现服务端组件', '可以，但 Stats 会变成客户端组件，在浏览器中查数据库', '只能把 Stats 改成 props 而不是 children'],
      answer: 0,
      explain: '客户端组件不能 <b>import</b> 服务端组件，但可以通过 children 接收它。Stats 由服务端组件 Page 创建，在服务器上渲染。Tabs 收到的只是渲染结果。这样交互部分在客户端，数据部分留在服务器。',
    },
  ],
  'mini-react': [
    {
      q: '用本课的迷你 useState 渲染两次。第二次渲染前，<b>忘了</b>把 i 重置为 0。第二次渲染时，组件读到什么？' + CHECK_PRE(`
let hooks = [], i = 0;
function useState(init) {
  const j = i++;
  hooks[j] ??= init;
  return [hooks[j], v => { hooks[j] = v; }];
}
function Comp() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('小明');
  // …
}
// 第一次渲染后调用 setCount(5)、setName('小红')`),
      options: ['5 和 \'小红\'', '0 和 \'小明\'：下标从 2 开始，占用了新的格子', '\'小红\' 和 undefined', '报错'],
      answer: 1,
      explain: '第二次渲染时 i 从 2 开始，两个 useState 用的是 hooks[2] 和 hooks[3]。这两格是空的，于是被填入初始值。hooks 变成 <code>[5, "小红", 0, "小明"]</code>。所以真实的 React 在每次渲染组件前，都会把 Hook 指针重置到开头。',
    },
  ],

  /* ---------- 05 生态与实战 ---------- */
  'typescript': [
    {
      q: 'TypeScript 会在哪一行报错？' + CHECK_PRE(`
type State =
  | { status: 'loading' }
  | { status: 'ok'; data: string[] }
  | { status: 'error'; error: string };

function View({ s }: { s: State }) {
  if (s.status === 'loading') return <Spinner />;  // 第 7 行
  return <ul>{s.data.map(d => <li key={d}>{d}</li>)}</ul>; // 第 8 行
}`),
      options: ['第 7 行：s 上没有 status', '第 8 行：s 还可能是 error 状态，它没有 data', '第 1 行：联合类型不能包含对象', '不报错'],
      answer: 1,
      explain: '第 7 行排除了 loading。到第 8 行，s 仍可能是 ok 或 error。error 没有 data 字段，所以 TypeScript 报错。这正是可辨识联合的价值：漏处理的状态在编译时就会被发现。加上 <code>if (s.status === \'error\') return …</code> 即可。',
    },
    {
      q: '<code>const [n, setN] = useState(0)</code>。下面的事件处理函数有什么问题？' + CHECK_PRE(`
<input
  type="number"
  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
    setN(e.target.value)}
/>`),
      options: ['没有问题：type="number" 的 value 是数字', 'TypeScript 报错：e.target.value 是 string，不能传给 number 类型的 setN', 'e 的类型应该写 MouseEvent', '运行时报错，编译通过'],
      answer: 1,
      explain: 'useState(0) 推断出 n 是 number。输入框的 value 永远是字符串，即使 type="number"。所以 TypeScript 在编译时报错。修复：<code>setN(Number(e.target.value))</code>，或者用 <code>e.target.valueAsNumber</code>。',
    },
  ],
  'router': [
    {
      q: '路由这样配置。访问 <code>/users/2</code> 时，页面上看不到 UserDetail。最可能的原因是？' + CHECK_PRE(`
<Route path="/users" element={<Users />}>
  <Route path=":id" element={<UserDetail />} />
</Route>`),
      options: ['路径应写成 "/users/:id"，嵌套路由不能用相对路径', 'Users 组件里没有渲染 <Outlet />', 'UserDetail 必须用 useParams 才会显示', '嵌套路由必须放在 <Link> 里'],
      answer: 1,
      explain: '嵌套路由匹配后，父路由的组件先渲染。子路由的内容会显示在父组件中 <code>&lt;Outlet /&gt;</code> 的位置。Users 没有放 Outlet，子路由就没有地方显示。',
    },
    {
      q: 'URL 是 <code>?page=2</code>。点击“下一页”后，URL 变成什么？' + CHECK_PRE(`
const [params, setParams] = useSearchParams();
const page = params.get('page') ?? 1;

<button onClick={() => setParams({ page: page + 1 })}>
  下一页
</button>`),
      options: ['?page=3', '?page=21', '?page=NaN', '?page=2，不变'],
      answer: 1,
      explain: '查询参数读出来永远是字符串。<code>\'2\' + 1</code> 是字符串拼接，结果是 \'21\'。读取后要先转成数字：<code>Number(params.get(\'page\') ?? 1)</code>。',
    },
  ],
  'tanstack-query': [
    {
      q: '先查用户，再查这个用户的文章。第一次渲染时会怎样？' + CHECK_PRE(`
const { data: user } = useQuery({
  queryKey: ['user', id],
  queryFn: () => getUser(id),
});
const { data: posts } = useQuery({
  queryKey: ['posts', user.id],
  queryFn: () => getPosts(user.id),
});`),
      options: ['等 user 到了，自动再查 posts', '报错：第一次渲染时 user 是 undefined，读 user.id 失败', '两个请求同时发出，都成功', 'posts 用 user 的缓存'],
      answer: 1,
      explain: '第一次渲染时数据还没回来，data 是 undefined。读取 user.id 会抛出 TypeError。依赖查询的写法：<code>queryKey: [\'posts\', user?.id]</code>，并加上 <code>enabled: !!user</code>，等 user 有值后再请求。',
    },
    {
      q: '缓存里有 <code>[\'todos\', \'list\', 1]</code>、<code>[\'todos\', \'list\', 2]</code>、<code>[\'todos\', \'detail\', 5]</code> 和 <code>[\'user\']</code>。执行下面的代码，哪些查询会失效？' + CHECK_PRE(`
queryClient.invalidateQueries({ queryKey: ['todos'] });`),
      options: ['一个都不会：没有查询的 key 正好等于 [\'todos\']', '所有以 \'todos\' 开头的三个查询', '只有 [\'todos\', \'list\', 1]', '全部四个'],
      answer: 1,
      explain: 'invalidateQueries 默认按<b>前缀</b>匹配。所有 key 以 \'todos\' 开头的查询都会失效，正在显示的会在后台重新请求。<code>[\'user\']</code> 不受影响。只想匹配完全相同的 key，可以加 <code>exact: true</code>。',
    },
  ],
  'testing': [
    {
      q: 'Search 组件在输入后请求数据，结果稍后才显示。这个测试会怎样？' + CHECK_PRE(`
render(<Search />);
await user.type(screen.getByRole('textbox'), 'react');
expect(screen.getByText('3 条结果')).toBeInTheDocument();`),
      options: ['通过', '失败：getByText 立刻查找，结果还没显示；应改用 await screen.findByText', '失败：getByRole 找不到输入框', '通过，但会有警告'],
      answer: 1,
      explain: 'getBy 系列只查一次，找不到就立刻报错。数据是异步返回的，断言时结果还没渲染。findBy 系列会等待并重试，直到元素出现或超时。所以要写 <code>expect(await screen.findByText(\'3 条结果\'))…</code>。',
    },
    {
      q: '页面上有 <code>&lt;button aria-label="关闭"&gt;×&lt;/button&gt;</code>。哪个查询能找到它？',
      options: ['screen.getByRole(\'button\', { name: \'关闭\' })', 'screen.getByText(\'关闭\')', 'screen.getByRole(\'button\', { name: \'×\' })', 'screen.getByTitle(\'关闭\')'],
      answer: 0,
      explain: 'aria-label 决定了按钮的可访问名称，它会覆盖按钮里的文字“×”。getByRole 按可访问名称查找，所以用“关闭”能找到。getByText 只看页面上的文字，找不到“关闭”。getByTitle 查找 title 属性，这里没有。',
    },
  ],
  'nextjs': [
    {
      q: '文件 <code>app/(shop)/cart/page.tsx</code> 对应哪个 URL？',
      options: ['/(shop)/cart', '/cart', '/shop/cart', '/shop?page=cart'],
      answer: 1,
      explain: '用圆括号包住的文件夹是<b>路由组</b>。它只用来组织文件，或者让几个页面共用一个 layout，不会出现在 URL 中。所以 URL 是 <code>/cart</code>。',
    },
  ],
  'portfolio': [
    {
      q: '记账本这样读取本地数据。这行代码有什么问题？' + CHECK_PRE(`
const [items, setItems] = useState(
  JSON.parse(localStorage.getItem('items')) ?? []
);`),
      options: ['第一次运行时报错：getItem 返回 null，JSON.parse(null) 会抛出异常', '每次渲染都会读取并解析 localStorage；应写成 useState(() => …)', 'localStorage 里的数据改了，界面也会自动更新', '没有问题'],
      answer: 1,
      explain: 'useState 的参数只在第一次渲染时使用，但表达式每次渲染都会执行。数据多时会浪费时间。传入函数 <code>useState(() =&gt; …)</code>，React 只在第一次调用它。另外，<code>JSON.parse(null)</code> 返回 null，不会报错，所以 <code>?? []</code> 能正常兜底。',
    },
  ],
};
/* ---------- 扩充题池：每阶段再加 8 道（追加在各课原有题目之后，旧题的序号 c0、c1… 不变） ---------- */
const CHECK_MORE = {
  /* 01 入门 */
  'what-is-react': [
    {
      q: '先点“直接改 DOM”，span 显示 99。再点“改 state”。span 显示什么？' + CHECK_PRE(`
function Counter() {
  const [n, setN] = useState(0);
  return (
    <>
      <span id="n">{n}</span>
      <button onClick={() => {
        document.getElementById('n').textContent = '99';
      }}>直接改 DOM</button>
      <button onClick={() => setN(n + 1)}>改 state</button>
    </>
  );
}`),
      options: ['1', '100：React 在页面上的当前值上加 1', '99：React 不会再动被手动改过的元素', '0'],
      answer: 0,
      explain: 'React 不读取 DOM 里的值。它只根据 state 算出界面应该是什么样子。点“改 state”后 n 变成 1，React 发现文字从 0 变成 1，就把 span 改成“1”，手动写的 99 被覆盖。选“100”是把 React 当成了“在 DOM 上修改”的命令式工具。反过来，如果 n 没变，React 不会碰这个节点，99 会一直留着，和 state 对不上。所以在 React 里只改数据，不直接改 DOM。',
    },
  ],
  'jsx': [
    {
      q: '运行下面的 JSX，会怎样？' + CHECK_PRE(`
<p style="color: red; font-size: 20px">提示</p>`),
      options: ['显示红色、20px 的“提示”', '显示“提示”，样式被忽略，控制台只有警告', '只有 color 生效，font-size 要写成 fontSize', '报错：style 不能是字符串'],
      answer: 3,
      explain: 'JSX 里的 style 接收一个 JavaScript 对象，不接收 CSS 字符串。传字符串时，React 直接抛出错误，不是只给警告。写法：<code>style={{ color: \'red\', fontSize: 20 }}</code>。外层花括号表示“这里是表达式”，内层花括号是对象。属性名用驼峰，数字默认单位是 px。“只有 color 生效”混淆了两件事：驼峰命名是对象写法的规则，字符串在这里整个都不被接受。',
    },
  ],
  'components-props': [
    {
      q: '父组件写 <code>&lt;Avatar user={me} /&gt;</code>，me 有 url 和 name。页面上会怎样？' + CHECK_PRE(`
function Avatar(user) {
  return <img src={user.url} alt={user.name} />;
}`),
      options: ['正常显示头像', '图片不显示：user 其实是整个 props 对象', '报错：props 不能叫 user', '报错：user 是 undefined，读取 user.url 时抛出 TypeError'],
      answer: 1,
      explain: '组件只收到一个参数：props 对象。这里它被命名为 user，内容是 <code>{ user: me }</code>。所以 <code>user.url</code> 是 undefined，img 没有 src。修复：解构 <code>function Avatar({ user })</code>，或者写 <code>props.user.url</code>。“user 是 undefined”不对：参数一定有值，只是它不是你以为的那个对象，所以不会报错，图片只是悄悄地不显示。',
    },
  ],
  'state': [
    {
      q: '在姓名输入框里输入“a”。下面的 <code>&lt;p&gt;</code> 显示什么？' + CHECK_PRE(`
const [form, setForm] = useState({ name: '', email: 'a@b.c' });

<input
  value={form.name}
  onChange={e => setForm({ name: e.target.value })}
/>
<p>{form.email}</p>`),
      options: ['空白：email 没有了', 'a@b.c：set 函数会把新对象合并进旧对象', '报错：缺少 email 字段', 'a@b.c，但输入框里打不进字'],
      answer: 0,
      explain: 'useState 的 set 函数用新值<b>替换</b>旧值，不做合并。新对象只有 name，email 变成 undefined，所以 p 什么都不显示。修复：<code>setForm({ ...form, name: e.target.value })</code>。“会合并”来自 class 组件的 <code>this.setState</code>，它会浅合并；函数组件的 set 函数不会。',
    },
  ],
  'events': [
    {
      q: '点击“删除”按钮，哪些函数会被调用？' + CHECK_PRE(`
<li onClick={() => open(item)}>
  {item.title}
  <button onClick={() => remove(item.id)}>删除</button>
</li>`),
      options: ['只有 remove', '先 open，再 remove', '只有 open：外层的处理函数优先', '先 remove，再 open'],
      answer: 3,
      explain: '点击事件从按钮开始向上冒泡。先执行按钮的 onClick（remove），再执行 li 的 onClick（open）。结果是删除之后又打开了这一项。只想删除时，在按钮的处理函数里调用 <code>e.stopPropagation()</code>。“只有 remove”是最常见的误解：React 的事件和浏览器一样会冒泡，不会因为里面的元素处理过就停下。',
    },
  ],
  'conditional': [
    {
      q: 'loading 为 true、error 为 null 时，页面显示什么？' + CHECK_PRE(`
return (
  <>
    {loading && <Spinner />}
    {error && <ErrorMsg text={error} />}
    <List items={items} />
  </>
);`),
      options: ['只显示 Spinner', '只显示 List', 'Spinner 和 List 同时显示', 'Spinner、ErrorMsg 和 List 都显示'],
      answer: 2,
      explain: '<code>&amp;&amp;</code> 只控制它后面那一项。List 没有条件，所以一直显示。加载中时，用户同时看到加载图标和旧的（或空的）列表。想三选一，用提前 return：<code>if (loading) return &lt;Spinner /&gt;;</code>，再处理 error，最后返回 List。“只显示 Spinner”是把三行当成了 if/else，但 JSX 里并列的表达式各自独立。',
    },
  ],
  'lists-keys': [
    {
      q: '在第一项的备注框里输入“急”，然后删除第一项。“急”会出现在哪里？' + CHECK_PRE(`
{todos.map((t, i) => (
  <li key={i}>
    {t.title} <input placeholder="备注" />
  </li>
))}`),
      options: ['随第一项一起消失', '在原第二项的备注框里', '所有备注框都被清空', '出现在最后一项的备注框里'],
      answer: 1,
      explain: 'key 是下标。删除后，原来的第二项下标变成 0，React 认为“key 为 0 的那一项还在”，只更新了它的文字。输入框是同一个 DOM 节点，里面的“急”留了下来。结果备注挂到了错的待办上。改成 <code>key={t.id}</code> 即可。“随第一项消失”是用 id 做 key 时的行为；用下标时，React 删掉的是 key 最大的最后一项。',
    },
  ],
  'forms': [
    {
      q: '连续点击这个复选框两次，会怎样？' + CHECK_PRE(`
const [agree, setAgree] = useState(false);

<input
  type="checkbox"
  checked={agree}
  onChange={e => setAgree(e.target.value)}
/>`),
      options: ['第一次勾上，第二次取消不了', '勾上，再取消', '两次都勾不上', '报错：checked 必须是布尔值'],
      answer: 0,
      explain: '复选框的 <code>value</code> 默认是字符串 "on"，和是否勾选无关。第一次点击，agree 变成 "on"，它是真值，所以勾上了。第二次点击，agree 仍是 "on"，受控的复选框保持勾选。复选框要读 <code>e.target.checked</code>。“报错”不对：React 不检查 checked 的类型，非空字符串被当作 true。',
    },
  ],

  /* 02 进阶 */
  'lifting-state': [
    {
      q: 'Celsius 和 Fahrenheit 各自保存温度。需求：改一个，另一个跟着变。最好的做法是？' + CHECK_PRE(`
function Celsius() {
  const [c, setC] = useState(0); /* … */
}
function Fahrenheit() {
  const [f, setF] = useState(32); /* … */
}
function App() {
  return <><Celsius /><Fahrenheit /></>;
}`),
      options: ['两个组件保留各自的 state，再各写一个 useEffect，监听对方的值并同步更新自己', '用一个 useRef 在两个组件之间共享温度', '保留两个组件的 state，再在 App 里多存一份，三处一起更新', '只在 App 里存摄氏度；两个组件通过 props 拿值和回调，华氏度在渲染时算出'],
      answer: 3,
      explain: '两个组件要显示同一份数据，就把 state 提升到最近的共同父组件，只存一处。子组件通过 props 拿到值，改动时调用父组件传入的回调。华氏度能由摄氏度算出，不必再存。用 effect 互相同步，看起来能工作，但每次修改都多渲染一轮，两边还可能互相触发、短暂不一致。ref 的修改不会触发重新渲染，另一个组件看不到变化。',
    },
  ],
  'use-reducer': [
    {
      q: '某处执行了 <code>dispatch({ type: \'reset\' })</code>。会怎样？' + CHECK_PRE(`
function reducer(state, action) {
  switch (action.type) {
    case 'inc':
      return { count: state.count + 1 };
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0 });
// …
<p>{state.count}</p>`),
      options: ['state 变成 undefined，渲染时报错', 'React 报错：未知的 action type', 'count 变回 0', 'React 忽略不认识的 action，state 不变'],
      answer: 0,
      explain: 'switch 没有匹配的分支，函数执行到末尾，返回 undefined。React 把返回值当作新的 state，不会替你“忽略”。下一次渲染读 <code>state.count</code> 时抛出 TypeError。所以 reducer 要有 <code>default</code> 分支：返回原 state，或者抛出一个清楚的错误。“React 报错：未知的 action type”不对：React 不知道你有哪些 type，报的是读取 undefined 属性的错误。',
    },
  ],
  'context': [
    {
      q: 'Header 用 <code>useContext(UserCtx)</code> 显示用户名。点击“登录”后，Header 显示什么？' + CHECK_PRE(`
function App() {
  let user = { name: '游客' };
  return (
    <UserCtx.Provider value={user}>
      <button onClick={() => { user = { name: '小明' }; }}>
        登录
      </button>
      <Header />
    </UserCtx.Provider>
  );
}`),
      options: ['小明：Provider 的 value 变了，Header 会更新', 'null：变量被重新赋值后 Context 丢失', '游客', '报错：value 必须是 state'],
      answer: 2,
      explain: '给普通变量重新赋值，不会触发重新渲染。App 没有重新渲染，Provider 的 value 还是旧对象，Header 仍显示“游客”。Context 只负责把值传下去，它不会让普通变量变成 state。修复：<code>const [user, setUser] = useState(…)</code>，点击时调用 setUser。“报错”不对：value 可以是任何值，只是它不会自己变化。',
    },
  ],
  'use-ref': [
    {
      q: '组件第一次渲染时会怎样？' + CHECK_PRE(`
function Search() {
  const inputRef = useRef(null);
  inputRef.current.focus();
  return <input ref={inputRef} />;
}`),
      options: ['输入框获得焦点', '报错：current 是 null', '没有效果：ref 会等 DOM 创建好再执行 focus', '每次渲染都调用一次 focus，能用但浪费性能'],
      answer: 1,
      explain: '组件函数运行时，React 还没创建 input 的 DOM 节点。ref 要等到提交阶段才被赋值。所以第一次渲染时 <code>inputRef.current</code> 是 null，调用 focus 抛出 TypeError。操作 DOM 要放在 effect 或事件处理函数里：<code>useEffect(() =&gt; { inputRef.current.focus(); }, [])</code>。“ref 会等 DOM 创建好”是误解：ref 不会等待，渲染期间它就是 null。',
    },
  ],
  'use-effect': [
    {
      q: '应用包在 <code>&lt;StrictMode&gt;</code> 里，在开发环境运行。组件挂载后，按一次 Enter 键，count 怎么变化？' + CHECK_PRE(`
const [count, setCount] = useState(0);

useEffect(() => {
  function onKey(e) {
    if (e.key === 'Enter') setCount(c => c + 1);
  }
  window.addEventListener('keydown', onKey);
}, []);`),
      options: ['加 1', '加 2', '加 1：浏览器会忽略重复添加的监听器', '报错：effect 添加了监听器，就必须返回清理函数'],
      answer: 1,
      explain: '严格模式在开发环境中会挂载、卸载、再挂载一次组件，用来检查清理是否正确。effect 运行了两次，每次都新建一个 onKey 函数并添加到 window。这里没有清理函数，第一个监听器没被移除。于是按一次 Enter，两个监听器各加 1，一共加 2。最迷惑的是“浏览器会忽略重复添加”：这只对<b>同一个</b>函数成立，这里两次是不同的函数。修复：在 effect 里 <code>return () =&gt; window.removeEventListener(\'keydown\', onKey);</code>。生产环境只加 1，但组件卸载后监听器仍在。',
    },
    {
      q: '代码评审时，你会怎样评价这段代码？' + CHECK_PRE(`
const [visible, setVisible] = useState([]);

useEffect(() => {
  setVisible(items.filter(i => i.type === filter));
}, [items, filter]);

return <List items={visible} />;`),
      options: ['会无限循环：effect 里调用 set 函数会触发渲染，渲染又触发 effect', '依赖数组漏了 setVisible', '没问题，这是派生数据的标准写法', '多一轮渲染，先显示旧结果；应在渲染时直接计算'],
      answer: 3,
      explain: 'visible 可以由 items 和 filter 算出，不需要 state，也不需要 effect。现在的流程是：先用旧的 visible 渲染并显示，effect 再设置新值，又渲染一次。直接写 <code>const visible = items.filter(…)</code> 即可；计算很慢时再用 useMemo。“无限循环”不对：依赖是 items 和 filter，setVisible 不会改变它们，所以 effect 不会反复执行。set 函数是稳定的，不需要写进依赖。',
    },
  ],
  'escape-hatches': [
    {
      q: '点击“确定”按钮，控制台会打印“外层”吗？' + CHECK_PRE(`
<div onClick={() => console.log('外层')}>
  {createPortal(
    <button>确定</button>,
    document.body
  )}
</div>`),
      options: ['不会：按钮在 DOM 上不在这个 div 里', '会打印两次', '会：按 React 树冒泡', '报错：Portal 里的元素不能触发事件'],
      answer: 2,
      explain: 'Portal 只改变 DOM 节点放在哪里。在 React 树中，按钮仍是这个 div 的子元素。React 的事件按 React 树冒泡，所以 div 的 onClick 会执行。这和 Context 能穿过 Portal 是同一个道理。“不会”是按 DOM 结构推理的结果，原生 <code>addEventListener</code> 确实是这样，但 React 的 onClick 不是。不想让弹窗里的点击影响外层时，在 Portal 内部调用 <code>e.stopPropagation()</code>。',
    },
  ],
  'project-search': [
    {
      q: '第一次搜索失败，第二次搜索成功。页面会怎样？' + CHECK_PRE(`
async function run() {
  setLoading(true);
  try {
    setResults(await search(q));
  } catch (e) {
    setError(e.message);
  }
  setLoading(false);
}
// 渲染：error 有值时显示错误提示，下面显示 results`),
      options: ['只显示新结果', '新结果和上一次的错误提示同时显示', '只显示错误提示，因为 error 优先', 'loading 一直是 true'],
      answer: 1,
      explain: '成功的分支没有清空 error。第二次搜索成功后，results 有了新值，error 还是第一次的消息，两者同时显示。这就是用多个独立变量表示请求状态的风险：容易出现矛盾的组合。修复：开始请求时 <code>setError(null)</code>；更好的是用一个 <code>status</code> 字段（"loading" | "success" | "error"），一次只能处于一种状态。“loading 一直是 true”不对：最后一行在 try/catch 之后，无论成败都会执行。',
    },
  ],

  /* 03 高级 */
  'rendering': [
    {
      q: '先把计数器点到 3，再把 isAdmin 从 true 改为 false。计数器显示几？' + CHECK_PRE(`
{isAdmin
  ? <Counter label="管理员" />
  : <Counter label="访客" />}`),
      options: ['0：换成了另一个 Counter，state 重置', '两个计数器各自记数，切回来时恢复', '报错：同一位置不能条件渲染两个组件', '3'],
      answer: 3,
      explain: 'React 按组件在树中的<b>位置和类型</b>决定是否保留 state，不看 JSX 写在哪一行。两个分支都在同一位置渲染 Counter，React 认为是同一个组件，只是 label 变了，计数保持 3。想让两者各自独立，给它们不同的 key：<code>&lt;Counter key="admin" … /&gt;</code> 和 <code>&lt;Counter key="guest" … /&gt;</code>。“重置为 0”是只看代码写法、没看树结构的结果。',
    },
    {
      q: '没有使用 StrictMode。先点“切换”，再点“主题”。控制台依次新增哪些输出？' + CHECK_PRE(`
function Tabs({ children }) {
  const [tab, setTab] = useState(0);
  console.log('Tabs');
  return (
    <div>
      <button onClick={() => setTab(tab + 1)}>切换</button>
      {children}
    </div>
  );
}

function Clock() {
  console.log('Clock');
  return <p>12:00</p>;
}

function App() {
  const [dark, setDark] = useState(false);
  return (
    <>
      <button onClick={() => setDark(!dark)}>主题</button>
      <Tabs><Clock /></Tabs>
    </>
  );
}`),
      options: ['点“切换”：Tabs、Clock；点“主题”：Tabs、Clock', '点“切换”：Tabs；点“主题”：Tabs、Clock', '点“切换”：Tabs；点“主题”：Tabs', '点“切换”：Tabs；点“主题”：Clock'],
      answer: 1,
      explain: '<code>&lt;Clock /&gt;</code> 这个元素是 App 创建的，作为 children 传给 Tabs。<ol class="task-steps"><li>点“切换”：只有 Tabs 的 state 变了。App 没有重新渲染，children 还是同一个元素对象，React 跳过 Clock。</li><li>点“主题”：App 重新渲染，创建了新的 <code>&lt;Clock /&gt;</code> 元素。Tabs 没有用 memo，所以 Tabs 和 Clock 都重新渲染。</li></ol>最迷惑的是第一项：“父组件重新渲染，子组件都重新渲染”只适用于组件在自己的 JSX 里写出来的子组件。第三项也不对：children 不是永远跳过，创建它的组件重新渲染时，它就会重新渲染。',
    },
  ],
  'performance': [
    {
      q: '输入框打字时 SlowChart 每次都重新渲染。data 是在组件外定义的常量。下面哪个改法<b>不能</b>减少 SlowChart 的渲染？' + CHECK_PRE(`
function App() {
  const [text, setText] = useState('');
  return (
    <>
      <input value={text} onChange={e => setText(e.target.value)} />
      <SlowChart data={data} />
    </>
  );
}`),
      options: ['用 memo 包裹 SlowChart', '把输入框和 text 移到一个单独的 SearchBox 组件里', '用 useCallback 包住传给 onChange 的函数', '用 useMemo 记忆化 <SlowChart data={data} /> 这个元素'],
      answer: 2,
      explain: 'onChange 传给的是原生 input，不是 SlowChart。把它记忆化，App 仍然重新渲染，SlowChart 也照样渲染。其他三种都有效：memo 让 props 不变的 SlowChart 跳过渲染（data 是常量，引用不变）；把 state 移到 SearchBox，App 就不再重新渲染；记忆化元素对象，React 发现元素没变就跳过。很多人看到“函数”就想用 useCallback，但它只在函数被传给 memo 组件或作为依赖时才有用。',
    },
    {
      q: '某个与 tab 无关的 state 变化，导致组件重新渲染。heavyFilter 会重新运行吗？' + CHECK_PRE(`
const filter = { type: tab };
const visible = useMemo(
  () => heavyFilter(items, filter),
  [items, filter]
);`),
      options: ['不会：items 和 tab 都没变', '会：filter 每次渲染都是新对象', '不会：useMemo 会深比较依赖数组里的对象', '只在开发环境会'],
      answer: 1,
      explain: '依赖用 Object.is 比较。<code>{ type: tab }</code> 每次渲染都创建一个新对象，和上一次不相等，所以每次都重新计算，useMemo 白写了。修复：依赖写原始值 <code>[items, tab]</code>，在计算函数里再创建对象。“useMemo 会深比较”是常见误解：React 的所有依赖数组都只做浅比较。',
    },
  ],
  'closures': [
    {
      q: '点击“稍后提示”，然后在 3 秒内点 3 次“+1”。弹窗显示什么？' + CHECK_PRE(`
const [count, setCount] = useState(0);

function alertLater() {
  setTimeout(() => alert(count), 3000);
}

<button onClick={() => setCount(c => c + 1)}>+1</button>
<button onClick={alertLater}>稍后提示</button>`),
      options: ['0', '3', '1', '3 次弹窗，分别是 1、2、3'],
      answer: 0,
      explain: 'alertLater 是第一次渲染创建的函数，它读到的 count 是那次渲染的快照 0。定时器回调记住的就是这个 0。之后的点击创建了新的渲染和新的 count，但旧的回调看不到。“3”是把 count 当成了一个会被修改的变量；实际上每次渲染都有自己的 count 常量。想读到最新值，可以把最新值存进 ref，在回调里读 <code>ref.current</code>。',
    },
  ],
  'suspense': [
    {
      q: 'Article 加载要 1 秒，Comments 要 3 秒，Header 不需要加载。第 1 到第 3 秒之间，页面显示什么？' + CHECK_PRE(`
<Suspense fallback={<Spinner />}>
  <Header />
  <Suspense fallback={<p>评论加载中…</p>}>
    <Comments />
  </Suspense>
  <Article />
</Suspense>`),
      options: ['Spinner：要等所有内容都就绪', 'Header 和 Article，评论的位置暂时空着，什么都不显示', '只有“评论加载中…”', 'Header、“评论加载中…”和 Article'],
      answer: 3,
      explain: '组件挂起时，只有离它最近的 Suspense 显示 fallback。Comments 被内层边界接住，不影响外层。外层只等 Header 和 Article，1 秒后就显示内容，Comments 的位置显示内层 fallback。所以嵌套 Suspense 可以让页面分批出现。“要等所有内容”是只有一个边界时的行为。',
    },
  ],
  'concurrent': [
    {
      q: 'SlowPosts 由几百个小组件组成，渲染一共要 1 秒。点击“文章”后的这 1 秒内，页面怎样？' + CHECK_PRE(`
const [tab, setTab] = useState('about');
const [isPending, startTransition] = useTransition();

<button onClick={() => startTransition(() => setTab('posts'))}>
  文章
</button>
{isPending && <span>切换中…</span>}
{tab === 'posts' ? <SlowPosts /> : <About />}`),
      options: ['页面卡住 1 秒，然后显示文章', '先显示空白，1 秒后显示文章', '仍显示 About 和“切换中…”，可被打断', '立刻显示文章的框架，后台再慢慢补全每一行内容'],
      answer: 2,
      explain: '过渡更新不紧急。React 先做一次紧急渲染：tab 还是旧值，isPending 为 true，所以显示 About 和“切换中…”。然后在后台渲染 SlowPosts。它在组件之间会让出主线程，所以用户还能点击，新的点击会打断这次渲染。“页面卡住 1 秒”是不用 startTransition 时的表现。注意：如果 SlowPosts 是一个耗时 1 秒的单个组件，React 也无法在它中间打断。',
    },
  ],
  'profiling': [
    {
      q: 'Row 用 memo 包裹。Profiler 显示每打一个字，500 行 Row 都重新渲染，而且每行的“展开/收起”状态被重置。最可能的原因是？' + CHECK_PRE(`
{rows.map(r => (
  <Row key={Math.random()} row={r} />
))}`),
      options: ['key 每次都不同，行被重新挂载', 'row 每次都是新对象，memo 的浅比较失败', '开发模式下 Profiler 的结果不准', 'memo 对列表中的组件不起作用'],
      answer: 0,
      explain: 'key 每次渲染都是新的随机数，React 认为所有行都是新组件。它卸载旧的 Row，挂载新的 Row，memo 根本没有机会比较 props，state 也随之丢失。用稳定的 <code>key={r.id}</code>。“row 是新对象”有迷惑性：它确实会让 memo 失效，但只会导致重新渲染，不会重置 state。state 被重置，说明组件被重新挂载了。',
    },
  ],

  /* 04 专家 */
  'patterns': [
    {
      q: 'Tabs 用 cloneElement 给每个 Tab 传 selected。使用者这样写，哪个 Tab 会高亮？' + CHECK_PRE(`
function Tabs({ active, children }) {
  return Children.map(children, (child, i) =>
    cloneElement(child, { selected: i === active })
  );
}

<Tabs active={0}>
  <div className="row">
    <Tab>一</Tab>
    <Tab>二</Tab>
  </div>
</Tabs>`),
      options: ['“一”', '都不高亮', '两个都高亮', '“二”'],
      answer: 1,
      explain: 'Children.map 只遍历<b>直接</b>子元素。这里唯一的直接子元素是 div，selected 加到了 div 上，两个 Tab 都没收到。所以 cloneElement 写的复合组件很脆弱：使用者多包一层就失效。用 Context 共享状态，Tab 通过 useContext 读取，就不受嵌套层级影响。选“一”的人默认 Tab 是直接子元素，但中间多了一层 div。',
    },
  ],
  'accessibility': [
    {
      q: '读屏软件把焦点移到这个输入框时，会读出什么？' + CHECK_PRE(`
<label>邮箱</label>
<input type="email" />`),
      options: ['只读“编辑框”，没有名称', '“邮箱，编辑框”：label 就在它前面', '读出 type 的值“email”', '“邮箱”读两次'],
      answer: 0,
      explain: 'label 没有和 input 关联，挨在一起也不算。输入框没有可访问名称，读屏软件只读出“编辑框”。点击“邮箱”文字也不会聚焦输入框。关联方法：<code>&lt;label htmlFor="email"&gt;</code> 配合 <code>&lt;input id="email"&gt;</code>，或者把 input 放进 label 里。“label 就在它前面”是看界面得出的结论，读屏软件看的是可访问名称。',
    },
    {
      q: '页面上渲染了 <code>&lt;Field label="姓名" /&gt;</code> 和 <code>&lt;Field label="电话" /&gt;</code>。点击文字“电话”，会怎样？' + CHECK_PRE(`
function Field({ label }) {
  return (
    <>
      <label htmlFor="field">{label}</label>
      <input id="field" />
    </>
  );
}`),
      options: ['电话输入框获得焦点', '什么都不发生', '姓名输入框获得焦点', '报错：页面上有重复的 id'],
      answer: 2,
      explain: '两个 input 的 id 都是 "field"。浏览器按 id 查找时，只找到第一个，也就是姓名输入框。所以两个 label 都指向它，电话输入框没有名称。可复用的组件不能写死 id，要用 <code>const id = useId()</code> 生成唯一的 id。“报错”不对：重复 id 是无效的 HTML，但浏览器和 React 都不会报错，问题只在使用时暴露。',
    },
  ],
  'state-architecture': [
    {
      q: 'mousePos 每秒变化 60 次。很多组件只读 theme，却也跟着每秒重新渲染 60 次。最合适的改法是？' + CHECK_PRE(`
<AppCtx.Provider value={{ user, theme, mousePos }}>
  <Page />
</AppCtx.Provider>`),
      options: ['用 useMemo 包住 value 对象', '用 memo 包裹所有只读 theme 的组件', '把 value 改成数组 [user, theme, mousePos]', '把 mousePos 拆到单独的 Context 或外部 store'],
      answer: 3,
      explain: 'Context 的 value 一变，所有读取它的组件都会重新渲染，不管它们用到哪个字段。mousePos 一直在变，所以 useMemo 也拦不住：它的依赖里有 mousePos。memo 也没用：memo 只比较 props，Context 变化会绕过它。把变化频繁的数据拆出去，只订阅它的组件才更新。useMemo 是最有迷惑性的选项，它只在“value 内容没变、对象却是新的”时有用。',
    },
  ],
  'react-19': [
    {
      q: '在 React 19 中，输入“买菜”并提交，saveTodo 成功完成后，输入框里是什么？' + CHECK_PRE(`
async function add(formData) {
  await saveTodo(formData.get('title'));
}

<form action={add}>
  <input name="title" />
  <button>添加</button>
</form>`),
      options: ['仍然是“买菜”：没有代码清空它', '空的', '整个页面刷新，输入框为空', '报错：form 的 action 只能是 URL 字符串'],
      answer: 1,
      explain: '在 React 19 中，把函数传给 <code>&lt;form action&gt;</code> 后，action 成功完成时，React 会自动重置表单里的非受控字段。所以输入框被清空，页面也不会刷新。“没有代码清空它”是 React 18 和普通 onSubmit 的经验。“只能是 URL”是原生 HTML 的规则；React 19 允许传函数，React 18 不支持这种写法。',
    },
  ],
  'server-components': [
    {
      q: '这个组件能运行吗？' + CHECK_PRE(`
'use client';
import { db } from './db';

export default async function Cart() {
  const items = await db.cart.findMany();
  return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}`),
      options: ['不能：客户端组件不能是 async 函数', '能：框架会自动把它放到服务器上运行', '能运行，但每次渲染都会在浏览器里查一次数据库', '能：客户端组件也可以 await'],
      answer: 0,
      explain: '<code>\'use client\'</code> 表示这个文件及它导入的模块都会发送到浏览器。客户端组件不支持 async/await，React 会报错。即使能运行，浏览器里也拿不到数据库连接，而且密钥可能泄露。修复：去掉 <code>\'use client\'</code>，让它成为服务端组件；需要交互的部分再拆成小的客户端组件。“框架会自动放到服务器上运行”是最常见的误解：这条指令正好表示相反的意思。',
    },
  ],
  'mini-react': [
    {
      q: '用本课 20 行的 render 函数。同事想实现“更新”：state 变化后，再调用一次 <code>render(app, box)</code>。会怎样？' + CHECK_PRE(`
function render(element, container) {
  // …根据 element 创建 dom，设置属性，递归渲染子元素
  container.appendChild(dom);
}

render(app, box);
// state 变化后：
render(app, box);`),
      options: ['只更新变化的部分', '报错：同一个容器不能渲染两次', '先清空 box，再画新的界面', 'box 里出现两份界面'],
      answer: 3,
      explain: '这个 render 每次都创建全新的 DOM，然后追加到容器里。它不记得上次画了什么，也不比较。所以第二次调用后出现两份界面。即使先清空再画，也会丢掉输入框的焦点和文字。真实的 React 保存上一次的元素树，在协调阶段比较新旧两棵树，只修改变化的 DOM。“只更新变化的部分”正是这 20 行代码没有实现的功能。',
    },
  ],
  'engineering': [
    {
      q: 'count 初始为 0，step 初始为 1。ESLint 对下面的依赖数组发出警告，同事加了一行注释把警告关掉。之后会怎样？' + CHECK_PRE(`
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + step);
  }, 1000);
  return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);`),
      options: ['一切正常，警告只是建议', '每秒加 1，改了 step 也不变', '停在 1，不再变化', '关掉警告后，effect 每次渲染都运行'],
      answer: 2,
      explain: '定时器回调是第一次渲染创建的，它读到的 count 和 step 永远是初始值。每秒都执行 <code>setCount(0 + 1)</code>，所以计数停在 1。ESLint 的 react-hooks 规则正是用来发现这种过期闭包的。“每秒加 1”有迷惑性：那是写成 <code>setCount(c =&gt; c + 1)</code> 时的行为，这里用的是旧的 count。正确的修法：<code>setCount(c =&gt; c + step)</code>，并把 step 写进依赖。',
    },
  ],

  /* 05 生态与实战 */
  'typescript': [
    {
      q: 'TypeScript 会怎样处理最后一行？' + CHECK_PRE(`
function List<T>({ items, render }: {
  items: T[];
  render: (item: T) => React.ReactNode;
}) {
  return <ul>{items.map((it, i) => <li key={i}>{render(it)}</li>)}</ul>;
}

<List items={[1, 2]} render={u => u.name} />`),
      options: ['不报错：u 的类型是 any', '报错：number 上没有 name', '报错：必须写成 <List<number> …>', '编译通过，运行时报错'],
      answer: 1,
      explain: 'TypeScript 先从 items 推断出 T 是 number，再用 T 给 render 的参数定类型。所以 u 是 number，读 <code>u.name</code> 报错。这正是泛型组件的价值：同一个组件能适配任何数据，但数据和回调的类型必须一致。“u 是 any”不对：u 的类型由上下文推断出来，不是 any。泛型参数也不需要手写，能推断时可以省略。',
    },
  ],
  'router': [
    {
      q: '用户已经登录，打开登录页。第一次渲染时会怎样？' + CHECK_PRE(`
function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (user) navigate('/home');
  return <LoginForm />;
}`),
      options: ['立即跳转到 /home', '无限循环：每次渲染都跳转', '报错：navigate 是 undefined', '不跳转，并在控制台警告'],
      answer: 3,
      explain: 'navigate 是一个副作用，不应在渲染时调用。React Router 在组件第一次渲染时会忽略这次调用，并警告“You should call navigate() in a React.useEffect()”。渲染时就要重定向，应返回 <code>&lt;Navigate to="/home" replace /&gt;</code>。“立即跳转”是最常见的预期，但渲染函数应该是纯函数，不能在里面改变 URL。',
    },
    {
      q: '路由是 <code>&lt;Route path="/users/:id" element={&lt;UserDetail /&gt;} /&gt;</code>。访问 <code>/users/2</code> 时，点击 UserDetail 里的这个链接，会去哪个地址？' + CHECK_PRE(`
<Link to="edit">编辑</Link>`),
      options: ['/users/2/edit', '/users/edit', '/edit', '/users/2edit'],
      answer: 0,
      explain: '不以 <code>/</code> 开头的路径是相对路径。React Router 把它解析为相对于<b>当前路由</b>的路径，这里是 /users/2，所以得到 /users/2/edit。想去根路径，写 <code>to="/edit"</code>；想去上一级，写 <code>to=".."</code>。“/users/edit”是按浏览器解析 <code>&lt;a href="edit"&gt;</code> 的规则推出来的：浏览器会替换最后一段，React Router 不会。',
    },
  ],
  'tanstack-query': [
    {
      q: 'Header 和 Sidebar 同时挂载，都调用下面的代码。会发出几次 getTodos 请求？' + CHECK_PRE(`
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: getTodos,
});`),
      options: ['2 次：每个组件各发一次', '1 次，但第二个组件拿到的是 undefined，不会更新', '1 次', '报错：同一个 queryKey 不能用两次'],
      answer: 2,
      explain: 'TanStack Query 按 queryKey 管理缓存。相同 key 的查询共享同一份数据和同一个请求。第一个组件发出请求后，第二个组件发现请求正在进行，就等这同一个结果。数据回来后，两个组件都会更新。所以在多个组件里直接调用同一个查询是推荐做法，不需要把数据层层传下去。“2 次”是用 useEffect 自己请求时的行为。',
    },
  ],
  'testing': [
    {
      q: 'Counter 点击后显示“计数：1”。这个测试会怎样？' + CHECK_PRE(`
test('点击加 1', () => {
  const user = userEvent.setup();
  render(<Counter />);
  user.click(screen.getByRole('button', { name: '+1' }));
  expect(screen.getByText('计数：1')).toBeInTheDocument();
});`),
      options: ['通过', '失败：click 没有 await', '失败：getByRole 不能用 name 查找', '通过，但控制台有警告'],
      answer: 1,
      explain: 'userEvent v14 的所有操作都是异步的。没有 await，点击还没发生，就执行了断言，页面上仍是“计数：0”，测试失败。修复：测试函数写成 <code>async</code>，并写 <code>await user.click(…)</code>。“通过”是 fireEvent 的经验：fireEvent 是同步的，但它不模拟完整的用户操作。',
    },
  ],
  'nextjs': [
    {
      q: '在 Next.js App Router 中，这个页面会怎样？' + CHECK_PRE(`
// app/counter/page.tsx
import { useState } from 'react';

export default function Page() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}`),
      options: ['正常运行，点击加 1', '能显示 0，但点击没有反应', 'Next.js 发现用了 useState，自动把它变成客户端组件', '报错：要在文件顶部加 \'use client\''],
      answer: 3,
      explain: 'app 目录下的组件默认是服务端组件。服务端组件不能使用 useState 等 Hook，也不能绑定事件，Next.js 会报错。在文件顶部写 <code>\'use client\'</code>，它才成为客户端组件。更好的做法是只把按钮拆成一个小的客户端组件，页面本身留在服务器上。“自动变成客户端组件”不对：边界必须由你声明，Next.js 不会猜。',
    },
    {
      q: '<code>app/dashboard/layout.tsx</code> 里有一个搜索框（客户端组件，用 state 保存文字）。用户输入“报表”后，从 /dashboard/a 跳到 /dashboard/b。搜索框里是什么？' + CHECK_PRE(`
app/dashboard/
  layout.tsx    ← 渲染 <SearchBox /> 和 {children}
  a/page.tsx
  b/page.tsx`),
      options: ['“报表”', '空的：layout 会从服务器重新获取并重新挂载', '空的：每次导航都重新渲染整棵树', '只有用 <a> 跳转时才保留'],
      answer: 0,
      explain: '在共用同一个 layout 的页面之间导航，layout 不会重新挂载，只有 children 部分被替换。所以 SearchBox 的 state 保留。用 <code>&lt;a&gt;</code> 会让整页刷新，state 反而全部丢失。需要每次导航都重置时，改用 <code>template.tsx</code>：它在每次导航时都创建新实例。',
    },
  ],
  'portfolio': [
    {
      q: '记账本（Vite + TypeScript）里，item 的类型是 <code>Item</code>，id 是 number。这行删除代码会怎样？' + CHECK_PRE(`
<button onClick={() =>
  setItems(items.filter(i => i !== item.id))
}>删除</button>`),
      options: ['正常删除这一项', 'TypeScript 编译报错', '把所有记录都删掉', '编译通过，运行时什么都没删，也没有提示'],
      answer: 1,
      explain: '<code>i</code> 是 Item 对象，<code>item.id</code> 是数字，两者永远不相等，filter 会保留所有记录。TypeScript 能发现这种比较：类型完全没有重叠时，它报错“This comparison appears to be unintentional”。正确写法：<code>i.id !== item.id</code>。“运行时什么都没删”是纯 JavaScript 项目里会发生的事；用了 TypeScript，这个 bug 在编译时就被拦下了。',
    },
  ],
};
Object.entries(CHECK_MORE).forEach(([id, items]) => { (CHECK_ONLY[id] = CHECK_ONLY[id] || []).push(...items); });
// 课程对象上自带的 checkOnly 排在前面，这里的题接在后面，序号不会错位
Object.entries(CHECK_ONLY).forEach(([id, items]) => { const l = LESSONS.find(x => x.id === id); if (l) l.checkOnly = [...(l.checkOnly || []), ...items]; });
