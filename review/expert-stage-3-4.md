# 第三、四阶段教学质量审查（专家视角）

范围：`src/lessons-3.js`（rendering、performance、closures、suspense、concurrent）、`src/lessons-4.js`（patterns、state-architecture、react-19、server-components、mini-react、engineering），以及 `src/lessons-predict.js` 中相关条目。
角度：教学质量，不是技术勘误。`review/stage-3.md`、`review/stage-4.md` 已列出的技术问题，本文不再重复。
前提：尊重课程设计（先预测再运行、课前热身、间隔复习、阶段测验 80%、渐进提示、自我解释、ASD-STE100 风格中文）。运行环境是 React 18.3.1，没有 StrictMode（`app.js:152` 直接 `createRoot().render`），所以模块级计数器在本课程中是准确的。

优先级：**高** = 学生会学到错误的心智模型，或练习可以用错误代码通过；**中** = 缺少专家级关键洞见，或测验只考记忆；**低** = 润色。

---

## 一、总体评价

1. 第三阶段的骨架很好。“触发 → 渲染 → 提交”、内联对象让 memo 失效、过期闭包、useDeferredValue + memo，这些演示都能直接看到效果（渲染计数、闪烁）。预测题挑选得当。
2. 主要短板有三类：
   - **练习偏简单，且没有练到本课的核心洞见。** performance 的练习只需加一个 `memo(...)`，不涉及“引用相等”。mini-react 的练习只有一行代码，而且提示直接给出答案。
   - **多个 test(t) 可以用错误代码通过**（rendering、patterns、suspense、state-architecture），mini-react 还有“照课文演示写反而不通过”的情况。
   - **测验多数考记忆**。不少干扰项明显不成立（“改用类组件”“随机决定”“jQuery”）。closures 第 1 题和预测题、练习完全重复。
3. 第四阶段有 3 课（react-19、server-components、engineering）没有任何可运行内容，也没有预测题。concurrent 也没有练习。这几课只能靠读，和课程“先预测再运行”的设计不一致。
4. 缺少几个专家级必讲点：自动批处理；“单独用 useCallback 没有收益”；memo 组件接收 `children` 时会失效；用 transition 避免 Suspense 回退到 fallback；Hook 状态存在组件实例（树中位置）上，这正是“状态跟着位置走”的原因；RSC 与 SSR 不是二选一；流式渲染。

---

## 二、小而安全的修改（建议先做）

| # | 优先级 | 位置 | 问题 | 修改 |
|---|---|---|---|---|
| 1 | 高 | lessons-4.js:649 | mini-react 练习要求 `children[0] === '你好'`。但本课第一个演示（:511-513）教的是把文本包成 `{ type: 'TEXT', ... }`。照演示写的学生会失败 | 测试同时接受两种写法，见第四节 mini-react 第 1 条 |
| 2 | 高 | lessons-3.js:145-149 | rendering 练习可以用 `useMemo(() => <Slow />, [])` 通过（正则 `/memo/` 区分大小写，匹配不到 `useMemo`）；删掉 `<p>{text}</p>` 也能通过 | 正则改为 `/memo/i`；补一条断言检查 `<p>` 显示 `abc` |
| 3 | 高 | lessons-3.js:555-558 | suspense 练习：`render() { return <p id="fallback">出错了</p>; }` 直接通过，完全没有错误边界 | 加一个“不出错的子树必须正常显示”的用例，并检查源码含 `getDerivedStateFromError` |
| 4 | 高 | lessons-4.js:138-143 | patterns 练习：`useState(false)`（忽略 defaultValue）可以通过；`isControlled = !!onChange`（用错误的判断依据）也可以通过 | 在 App 中加 `<Toggle id="free2" defaultValue={true} onChange={() => {}} />` 并测试 |
| 5 | 中 | lessons-4.js:277-282 | state-architecture 练习：`subscribe` 不返回取消函数也能通过 | 通过 `exports` 直接测试取消订阅 |
| 6 | 中 | lessons-3.js:363 | closures 测验第 1 题与预测题“计数器卡在 1”（lessons-predict.js:53-58）、练习起始代码完全相同，三次考同一件事 | 换成一道迁移题，见第三节 closures 第 2 条 |
| 7 | 中 | lessons-4.js:353 | react-19 示例用 `key={i}`，与第一阶段 lists-keys 课的教导相反。乐观项被真实项替换时，下标 key 会让 DOM 状态错位 | 给乐观项一个临时 id：`{ id: 'tmp-' + Date.now(), text, sending: true }`，渲染 `key={m.id}` |
| 8 | 中 | lessons-4.js:336 | `useFormStatus` 的最大坑没讲：它只能读取**上层** `<form>` 的状态。在渲染 `<form>` 的同一个组件里调用，永远是 `pending: false` | tip 末尾加一句：“注意：useFormStatus 必须在 form 内部的子组件中调用。在渲染 form 的那个组件里调用，读不到它的状态。” |
| 9 | 低 | lessons-4.js:696 | “本应用的‘检查答案’按钮也是这样工作的”不准确。检查器用 `#id` 查找元素（`app.js:296-312`），不是按文字或角色 | 改为：“本应用的检查答案按钮思路相同：渲染组件，模拟点击和输入，再检查页面。为了简单，它用 id 定位元素。真实测试应优先按角色和文字查找。” |
| 10 | 低 | lessons-4.js:692 | `await userEvent.click(...)` 与第五阶段 testing 课（lessons-5.js:438）的 `const user = userEvent.setup()` 写法不一致 | 改为 `const user = userEvent.setup(); … await user.click(...)` |
| 11 | 低 | lessons-4.js:700 | 路线图仍写“Server Actions”，与本阶段统一的术语“Server Function”不一致 | 改为“Server Functions” |
| 12 | 低 | lessons-3.js:282、:554；lessons-4.js:641 | 第一级“提示”直接给出完整答案，后面的“半成品示例”失去作用 | 第一级只给方向，例如 performance：“memo 是一个函数。它接收一个组件，返回一个新组件。” |

---

## 三、第三阶段逐课

### rendering（lessons-3.js:4-152）

**1. 【高】练习可以用错误代码通过** · lessons-3.js:145-149
- 问题：
  1. `/memo/` 区分大小写。`const slow = useMemo(() => <Slow />, []);` 里只有 `Memo`，不会命中。元素引用不变，React 跳过 Slow，测试通过。学生没有学到“状态下移”。
  2. 测试不检查 `<p>{text}</p>`。删掉这一行也能通过。
  3. 反过来，学生写注释“// 不用 memo”会被误判失败。
- 修改：
```js
test: async (t) => {
  const code = t.source.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '');
  t.assert(!/memo/i.test(code), '这道题请不要使用 memo 或 useMemo');
  const before = t.text('#slow-renders');
  await t.type('#box', 'a'); await t.type('#box', 'ab'); await t.type('#box', 'abc');
  t.assert(t.q('#box').value === 'abc', '输入框要能正常输入');
  t.assert(t.qa('p').some(p => p.textContent.trim() === 'abc'), '输入框下方的 <p> 应显示输入的文字');
  t.assert(t.text('#slow-renders') === before, `打字时 Slow 仍在重新渲染（${before} → ${t.text('#slow-renders')}）`);
}
```
- 说明：`<TextInput><Slow /></TextInput>`（children 写法）也会通过。这是正确的结构性优化，应该接受。

**2. 【中】缺少“自动批处理”和“同值跳过”** · lessons-3.js:13-15
- 问题：全课程没有讲批处理（grep 无“批处理/batch”）。“什么会触发重新渲染”只讲了来源，没讲两个专家必知的细节：
  1. React 18 起，同一事件（包括 setTimeout、Promise 回调）中的多次 setState 合并为一次渲染。
  2. `setState` 的新值与旧值 `Object.is` 相等时，React 会跳过这次更新。
- 为什么重要：学生会以为“调用 3 次 setState 就渲染 3 次”，进而错误地合并 state 或滥用 ref。
- 修改：在 :14 的列表后加一段：
  `p('两个细节：1. 同一个事件中的多次 setState 会被<b>合并为一次渲染</b>（自动批处理，React 18 起在 setTimeout 和 Promise 中也生效）。2. 新值与旧值用 Object.is 比较相等时，React 会跳过这次更新。')`
  可再加一道测验：“一次点击中调用 setA(1)、setB(2)、setC(3)，组件渲染几次？”答案 1 次；干扰项 3 次、2 次、0 次。

**3. 【中】测验第 3 题只考定义** · lessons-3.js:95
- 问题：“渲染指的是？”与正文图注、预测题重复，干扰项（发送网络请求）不成立。
- 修改：换成推理题：
  `{ q: 'App 中写了 function Input() { … }，并渲染 <Input />。在 Input 里打一个字，会怎样？', options: ['正常输入', '输入框失去焦点，已输入内容被清空', '报错', '只渲染 Input'], answer: 1, explain: 'App 每次渲染都创建一个新的 Input 函数。类型变了，React 销毁旧组件，重新挂载新组件。' }`
  这道题考的是 :89 的警告，并把它和“类型不同就重建”联系起来。

### performance（lessons-3.js:155-291）

**1. 【高】练习没有练到本课的核心** · lessons-3.js:247-289
- 问题：本课核心是“引用相等决定 memo 是否生效”。练习只需给 Child 加 `memo`，props 只有一个字符串，与 useCallback/useMemo 无关。对“高级”阶段来说太简单。
- 修改：起始代码给 Child 传一个内联函数。学生必须先发现 memo 不够，再用 useCallback：
```js
// starter 中的 App
function App() {
  const [n, setN] = useState(0);
  const [pings, setPings] = useState(0);
  const handlePing = () => setPings(p => p + 1);
  return (
    <div>
      <button id="parent" onClick={() => setN(n + 1)}>父组件 {n}</button>
      <Child title="子组件" onPing={handlePing} />
      <p>收到 <span id="pings">{pings}</span> 次 ping</p>
    </div>
  );
}
// Child 内：<button id="ping" onClick={onPing}>ping</button>
```
  任务步骤：1. 用 memo 包裹 Child。2. 点击父组件按钮，观察 memo 为什么没生效。3. 用 useCallback 修复。
  测试：
```js
test: async (t) => {
  t.assert(/memo\(/.test(t.source), '请用 memo 包裹 Child');
  const before = t.text('#child-renders');
  await t.click('#parent'); await t.click('#parent'); await t.click('#parent');
  t.assert(t.text('#child-renders') === before, `Child 仍在重新渲染（${before} → ${t.text('#child-renders')}）。检查传给它的函数是不是每次都是新的`);
  await t.click('#ping'); await t.click('#ping');
  t.assert(t.text('#pings') === '2', 'ping 按钮要能正常工作，计数应为 2');
}
```
  第二个断言能抓住 `useCallback(() => setPings(pings + 1), [])` 这种过期闭包写法（只会停在 1），顺带衔接下一课。

**2. 【中】没有说“单独使用 useCallback 没有任何收益”** · lessons-3.js:168
- 问题：这是最常见的滥用。学生读完 :168 后，容易给所有函数套 useCallback。
- 修改：在 :168 后加 warn：“useCallback 本身不会让任何东西变快。只有两种情况它才有用：1. 函数传给了 memo 组件。2. 函数是某个 effect 或 useMemo 的依赖。其他情况下，它只增加开销。”

**3. 【中】缺少 memo + children 陷阱** · lessons-3.js:167
- 问题：`<MemoCard><p>内容</p></MemoCard>` 中，children 是每次新建的元素对象，memo 永远失效。这是 memo 失效的第三大原因，与 :238 的“children 技巧”正好相反，学生容易混淆。
- 修改：在 :167 的段落末尾加一句：“JSX 也是对象。把 &lt;p&gt;…&lt;/p&gt; 作为 children 传给 memo 组件，每次也都是新引用。”演示（:175-203）可加第四个 Child：`<Child label="传入 children" onClick={stableFn} style={stableStyle}><i>!</i></Child>`，并把预测题选项相应调整。

**4. 【中】稳定回调会带来过期闭包，未提醒** · lessons-3.js:192
- 问题：`useCallback(() => …, [])` 中如果读取 state，就会读到旧值。本课排在 closures 之前，学生先学会“依赖写空最稳定”，后一课才知道代价。
- 修改：在 :192 后加注释 `// 注意：依赖为 []，回调里读到的 state 永远是第一次渲染的值（下一课详解）`。或者把 closures 课调到 performance 之前（“每次渲染都是快照”是理解依赖数组的前提）。

**5. 【中】测验第 2、3 题考记忆，干扰项太弱** · lessons-3.js:243-244
- 问题：“没有区别”“用于类组件”“只能缓存数字”“改用类组件”不会让任何人犹豫。
- 修改：第 2 题换成：
  `{ q: 'Child 没有用 memo。父组件用 useCallback 包好 onClick 再传给 Child。父组件渲染时 Child 会怎样？', options: ['跳过渲染', '照样重新渲染', '只在 onClick 变化时渲染', '报错'], answer: 1, explain: '没有 memo，子组件总会随父组件渲染。useCallback 只是让引用稳定，它本身不阻止渲染。' }`

**6. 【低】useMemo 演示的差异感受不到** · lessons-3.js:205-234
- 问题：本机测得 `slowPrimes(20000)` 约 40–60 ms，只在控制台显示。没有对照组，学生看不到“不用 useMemo 会怎样”。
- 修改：仿照 concurrent 课，加一个“使用 useMemo”复选框，并把耗时显示在页面上：`const primes = useMemoOn ? memoPrimes : slowPrimes(count);`（两者都要计算时注意 Hook 顺序：先无条件调用 useMemo）。可配预测题：“关闭 useMemo 后点切换主题，控制台会打印计算耗时吗？”

### closures（lessons-3.js:294-401）

**1. 【中】练习与演示、预测题、测验完全相同，没有迁移** · lessons-3.js:367-399
- 问题：同一个“interval 卡在 1”出现了 4 次（演示 :323、预测题、测验 :363、练习）。函数式更新这个答案在课文表格里已标为“最佳”，练习只是复制。
- 修改：换成需要 ref 或 useReducer 的情况。起始代码：
```js
function App() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setCount(c => c + step), 1000);
    return () => clearInterval(id);
  }, []);
  return (<div>
    <input id="step" type="number" value={step} onChange={e => setStep(Number(e.target.value))} />
    <h2 id="count">{count}</h2>
  </div>);
}
```
  任务：改变 step 后，每秒增加新的 step；依赖数组保持 `[]`（定时器不重建）。可接受的解法：ref 保存最新 step，或 useReducer（reducer 在渲染时读取 step）。
  测试：
```js
test: async (t) => {
  t.assert(/\}\s*,\s*\[\s*\]\s*\)/.test(t.source), '请保持 interval 所在 effect 的依赖为 []');
  await t.type('#step', '5');
  const a = Number(t.text('#count'));
  await t.wait(2100);
  const b = Number(t.text('#count'));
  t.assert(b - a >= 10, `step 为 5 时，2 秒应至少增加 10，实际增加 ${b - a}`);
}
```
  这道题真正考到 :347-358 的“用 ref 读取最新值”，现在这一节没有任何练习。

**2. 【中】测验第 1 题与预测题重复** · lessons-3.js:363
- 修改：换成考“部分修复”的题：
  `{ q: 'interval 回调改成 setCount(c => c + 1); console.log(count)，依赖仍为 []。控制台每秒打印什么？', options: ['1, 2, 3…', '一直是 0', '一直是 1', 'undefined'], answer: 1, explain: '函数式更新修好了计数，但回调里的 count 仍是第一次渲染的快照。' }`
  这道题能区分“背下了答案”和“理解了快照”。

**3. 【低】测试可以用模块变量绕过** · lessons-3.js:394-399
- 问题：`let n = 0; … setCount(++n)` 能通过，而测验 :364 把“用全局变量”列为错误选项。
- 修改：加 `t.assert(!/setCount\(\s*count\s*\+/.test(t.source), '回调里不要再读取 count')`，并在任务中写明“不要用组件外的变量”。（若采用第 1 条的新练习，此条可忽略。）

### suspense（lessons-3.js:404-560）

**1. 【高】练习可以完全不写错误边界就通过** · lessons-3.js:555-558
- 反例：`render() { return <p id="fallback">出错了</p>; }`。Bomb 从未渲染，`#ok` 存在，`#fallback` 正确。
- 修改：起始代码 App 中加一个不出错的边界：`<ErrorBoundary><p id="safe">正常内容</p></ErrorBoundary>`。测试：
```js
test: async (t) => {
  t.assert(/getDerivedStateFromError/.test(t.source), '请实现 static getDerivedStateFromError');
  t.assert(t.q('#ok'), '“我不受影响”应该正常显示（说明错误没有被边界拦住）');
  t.assert(t.text('#fallback') === '出错了', '应显示 <p id="fallback">出错了</p>');
  t.assert(t.q('#safe'), '没有出错的子树应正常显示 children，而不是备用界面');
}
```

**2. 【中】缺少“用 transition 避免回退到 fallback”** · lessons-3.js:449 之后
- 问题：专家级 Suspense 的关键洞见：已经显示的内容再次挂起时，React 会把它换成 fallback（内容闪掉）。把触发更新放进 `startTransition`，React 会保留旧界面，直到新内容就绪。这也是通往下一课 concurrent 的最好衔接。
- 修改：加一段 deep：“已经显示的内容再次挂起（例如切换到一个未加载的懒加载标签页），默认会被 fallback 替换。把这次 setState 放进 startTransition，React 会保留旧界面，等新内容准备好再切换。下一课会讲 startTransition。”
  可以做成可运行演示（React 18 支持）：两个 lazy 标签页，复选框切换“用 startTransition”。

**3. 【中】测验只有两道，都偏记忆** · lessons-3.js:497-500
- 修改：加一道推理题：
  `{ q: '同一个 Suspense 中有两个 lazy 组件，分别需要 1 秒和 3 秒加载。fallback 显示多久？', options: ['1 秒', '3 秒，等全部就绪才一起显示', '4 秒', '先显示快的，慢的位置显示 fallback'], answer: 1, explain: '一个 Suspense 边界内的内容作为整体显示。想让它们分别出现，就各包一个 Suspense。' }`
  这道题考的是“边界放在哪里”的设计决策，比记住 fallback 更有用。

**4. 【低】演示的“重试”为什么有效没有说明** · lessons-3.js:471
- 修改：在 :471 加注释 `// 清空错误后，children 会重新挂载，BuggyCounter 的 state 从 0 开始`。这让学生理解“重试 = 重新挂载”，以及为什么真实项目用 resetKeys。

**5. 【低】错误边界演示缺预测题**
- 修改：在 lessons-predict.js 加：
```js
'suspense|错误边界隔离故障': {
  q: '把第一个计数器点到 3。第二个计数器会怎样？',
  options: ['也显示错误', '不受影响，仍可点击', '整个页面白屏', '被重置为 0'], answer: 1,
  explain: '每个计数器有自己的错误边界。错误只会让最近的边界显示备用界面。',
},
```

### concurrent（lessons-3.js:563-636）

**1. 【中】useTransition 只有只读代码，没有可运行演示** · lessons-3.js:609-623
- 问题：React 18.3.1 完全支持 `useTransition`。本课没有练习，useTransition 也没有演示，学生从未亲手看到 `isPending`。
- 修改：加一个可运行演示：三个标签页，其中一个渲染 SlowList；复选框“使用 startTransition”。关闭时点慢标签后再点别的标签，界面卡住；开启时可以立即切走，并显示 isPending。可直接复用本课的 `SlowList`。

**2. 【中】“memo 是关键”只有文字，可以做成预测题** · lessons-3.js:606
- 问题：这是本课最深的洞见：useDeferredValue 只是让 React 多做一次渲染，紧急渲染能否变快取决于 memo 能否跳过列表。没有 memo，开启 useDeferredValue 反而更慢。
- 修改：演示中加第二个复选框“SlowList 使用 memo”（`const List = useMemoList ? SlowList : SlowListRaw`，其中 `SlowListRaw` 是不包 memo 的同一个函数）。在 lessons-predict.js 加：
```js
'concurrent|对比开启与关闭的输入体验': {
  q: '保持勾选 useDeferredValue，但去掉 SlowList 的 memo。快速打字时输入框会怎样？',
  options: ['依然流畅', '仍然卡顿', '列表不再更新', '报错'], answer: 1,
  explain: '紧急渲染时 deferredText 是旧值，但没有 memo，SlowList 仍会被父组件带着重新渲染一遍，输入框照样要等它。',
},
```

**3. 【中】缺少“并发不会让渲染变快”的明确说法** · lessons-3.js:570、630
- 修改：在 :630 的 deep 末尾加：“并发特性不会减少计算量，它只是让慢的渲染可以被打断。真正减少计算，仍要靠 memo、虚拟列表或减少渲染的内容。”

**4. 【低】本课没有练习，阶段测验前缺少动手环节**
- 修改（可选）：练习“给搜索框加 useDeferredValue”。测试可检查：快速输入 5 个字符后，输入框 value 正确；源码含 `useDeferredValue` 和 `memo(`。行为层面的“流畅”难以稳定测试，所以只测结构即可。

---

## 四、第四阶段逐课

### patterns（lessons-4.js:4-145）

**1. 【高】练习测试漏掉 defaultValue 和判断依据** · lessons-4.js:138-143
- 反例 A：`const [inner, setInner] = useState(false);`（忽略 defaultValue）通过。测试从未用过 `defaultValue={true}`。
- 反例 B：`const isControlled = !!onChange;` 通过。三个用例中，受控的都传了 onChange，非受控的都没传。但这正是测验 :92 要排除的错误判断依据。
- 修改：起始代码和答案的 App 都加一行：
  `<p>非受控 + 默认开 + 监听：<Toggle id="free2" defaultValue={true} onChange={v => console.log(v)} /></p>`
  测试加：
```js
t.assert(t.text('#free2') === '开', 'defaultValue={true} 时，初始应为“开”');
await t.click('#free2'); t.assert(t.text('#free2') === '关', '传了 onChange 但没传 value，仍是非受控，点击后应变为“关”');
```

**2. 【中】复合组件缺少“在 Provider 外使用”的保护** · lessons-4.js:27、38
- 问题：`<Tabs.Tab>` 放在 `<Tabs>` 外时，`useContext` 返回 null，解构报一个难懂的错误。给别人用的组件库都会处理这一点（Radix 等）。这是“难以误用”（:9）的直接体现。
- 修改：
```js
function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('<Tabs.Tab> 必须放在 <Tabs> 内部');
  return ctx;
}
```
  Tab 和 TabPanel 改用 `useTabs()`。

**3. 【中】受控/非受控缺少两个专家要点** · lessons-4.js:60-74
- 问题：
  1. 组件的模式在挂载后不应改变。`value` 从 undefined 变成有值，原生 input 会警告。
  2. 把这段逻辑抽成自定义 Hook（Radix 称为 `useControllableState`），正好呼应 :83“今天用自定义 Hook”。
- 修改：在代码块后加 tip：“模式应在挂载时确定，之后不要在 value={undefined} 和有值之间切换。实际组件库会把这段逻辑抽成一个 Hook，例如 useControllableState({ value, defaultValue, onChange })。”

**4. 【中】测验第 2 题干扰项太弱** · lessons-4.js:92
- 问题：“组件名”“随机决定”没人会选。
- 修改：换成推理题：
  `{ q: '使用者写了 <Toggle value={true} />，没有传 onChange。点击按钮会怎样？', options: ['变为“关”', '保持“开”，因为它是受控的，父组件没有更新 value', '报错', '在开和关之间来回切换'], answer: 1, explain: '传了 value 就是受控模式。显示什么由父组件决定。这和只写 value 不写 onChange 的原生 input 一样是只读的。' }`

**5. 【低】Tabs 演示缺键盘支持，但正文要求“支持键盘操作”** · lessons-4.js:30、88
- 修改：在 Tab 上加注释 `// 真实组件还要支持左右方向键切换，并设置 aria-controls`。不必实现，避免学生以为这就是完整的无障碍 Tabs。

### state-architecture（lessons-4.js:148-284）

**1. 【中】练习测试不检查取消订阅** · lessons-4.js:277-282
- 反例：`subscribe(fn) { listeners.add(fn); }` 通过。组件卸载后监听器泄漏，这正是外部 store 最常见的 bug。
- 修改：加 `exports: ['store']`，测试末尾加：
```js
const s = t.exports.store;
let calls = 0;
const un = s.subscribe(() => calls++);
t.assert(typeof un === 'function', 'subscribe 应返回一个取消订阅的函数');
un(); s.inc();
t.assert(calls === 0, '取消订阅后，store 变化不应再通知这个函数');
```

**2. 【中】“优于单个大 Context”只有结论，没有对照** · lessons-4.js:218
- 问题：学生在 context 课只学过“value 变化让所有消费者重新渲染”。这里是把两课连起来的好机会，但演示只有一边。
- 修改：note 改为可预测的对照。在 lessons-predict.js 加：
```js
'state-architecture|亲手实现 Zustand': {
  q: '点击“吃蜂蜜”。控制台会新增哪些输出？',
  options: ['BearCounter 和 HoneyPot 都渲染', '只有 HoneyPot 渲染', '三个组件都渲染', '没有输出'], answer: 1,
  explain: '每个组件只订阅 selector 选出的值。bears 没变，BearCounter 的快照不变，React 跳过它。如果把整个 state 放进一个 Context，所有消费者都会重新渲染。',
},
```

**3. 【中】测验第 2 题可换成推理题** · lessons-4.js:223
- 修改：
  `{ q: '在本课的迷你 Zustand 中写 useBear(s => ({ bears: s.bears }))，会怎样？', options: ['正常工作', '每次 getSnapshot 都返回新对象，React 报错或无限渲染', '只渲染一次', '读到 undefined'], answer: 1, explain: 'getSnapshot 必须在没有变化时返回相同引用。返回新对象就要用 useShallow 这类浅比较工具。' }`
  这样 :219 的 deep 才有题目检验。

**4. 【低】store 方法用 `this` 会悄悄失败** · lessons-4.js:232-236
- 问题：`store.get` 作为未绑定函数传给 useSyncExternalStore，`onClick={store.inc}` 也一样。学生若写 `get() { return this.count }`，会得到空白显示，而错误信息只是“初始应都为 0”。
- 修改：在提示中加一句：“这几个方法会被单独传出去（例如 onClick={store.inc}），所以不要在里面用 this，直接用外面的 count 和 listeners。”

### react-19（lessons-4.js:287-416）

**1. 【中】下标作 key** · lessons-4.js:353 —— 见第二节第 7 条。

**2. 【中】useFormStatus 的位置要求** · lessons-4.js:336 —— 见第二节第 8 条。并可把测验第 1 题（:412，只考返回值顺序）换成：
  `{ q: 'Newsletter 组件渲染了 <form>，并在同一个组件里调用 useFormStatus()。提交时 pending 是？', options: ['true', '始终是 false', '报错', 'undefined'], answer: 1, explain: 'useFormStatus 读取的是上层 form 的状态。要把按钮拆成 form 内部的子组件。' }`

**3. 【中】没有把 Actions 和上一阶段连起来** · lessons-4.js:294
- 问题：Action 本质是“异步的过渡更新”。concurrent 课学的 isPending、可中断、不显示 fallback 都适用于 Action。课文只说了“自动追踪 pending”。另外，`await` 之后的 setState 不再属于这个过渡（需要再包一层 startTransition），:310 的 `setError` 就是这种情况，学生却看不到。
- 修改：在 :294 后加：“Action 就是第 19 课的过渡更新，只是可以是异步的。所以它同样有 isPending，同样不会让已显示的内容退回 fallback。注意：await 之后的 setState 不再属于这次过渡。需要的话，再用 startTransition 包一次。”

**4. 【低】乐观更新模拟缺预测题** · lessons-4.js:360-391
- 修改：
```js
'react-19|乐观更新的效果': {
  q: '点击“点赞（会失败）”。点击后立刻和 1.2 秒后，数字分别是？',
  options: ['42，42', '43，然后回到 42', '43，43', '42，然后变成 43'], answer: 1,
  explain: '乐观值立刻加 1。服务器失败后移除乐观值，界面回到真实值 42。',
},
```

### server-components（lessons-4.js:419-494）

**1. 【中】表格把 CSR、SSR、RSC 写成三选一** · lessons-4.js:426-430
- 问题：RSC 和 SSR 是正交的。在 Next.js 中，服务端组件先产生 RSC Payload，SSR 再用它和客户端组件一起生成首屏 HTML。客户端组件也会在服务器预渲染一次。表格把 RSC 写成第三种“渲染方式”，学生会以为“用了 RSC 就不需要 SSR”。
- 修改：表格后加一句：“RSC 不取代 SSR，两者通常一起用：服务端组件产生 RSC Payload，SSR 再把整棵树（包括客户端组件）渲染成首屏 HTML。区别在于：服务端组件的代码不会发到浏览器，也不需要水合。”

**2. 【中】缺少流式渲染（Suspense + async 服务端组件）** · lessons-4.js:451 之后
- 问题：RSC 的一大收益是：慢的数据部分用 Suspense 包起来，页面其余部分先发送，慢的部分就绪后再流式补上。第三阶段刚学过 Suspense，这里没有接上。
- 修改：加代码块：
```jsx
export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<p>评论加载中…</p>}>
        <Comments />   {/* async 服务端组件，慢的数据不阻塞整页 */}
      </Suspense>
    </>
  );
}
```
  配一句：“服务器先发送 Header 和 fallback。Comments 的数据就绪后，再把它流式发送到浏览器。”

**3. 【中】“通过 children 接收服务端组件”只有一句话，没有代码** · lessons-4.js:467
- 问题：这是 RSC 中最常用也最反直觉的组合模式。
- 修改：加代码块：
```jsx
// ClientTabs.jsx
'use client';
export default function ClientTabs({ children }) { const [open, setOpen] = useState(true); return open ? children : null; }

// page.jsx（服务端组件）
<ClientTabs>
  <ServerPosts />   {/* 在服务器渲染，结果作为 children 传给客户端组件 */}
</ClientTabs>
```

**4. 【中】测验第 1、2 题偏记忆；缺一道考序列化边界的题** · lessons-4.js:490-491
- 修改：把第 1 题换成：
  `{ q: '服务端组件写 <AddToCart onAdded={() => console.log("ok")} />，AddToCart 是客户端组件。会怎样？', options: ['正常工作', '报错：函数不能序列化，不能从服务端组件传给客户端组件', '函数在服务器上执行', '函数被忽略'], answer: 1, explain: 'props 要跨越网络。只有可序列化的值和 Server Function 可以传。' }`

**5. 【低】整课没有可运行内容**
- 建议（可选，工作量较大）：在浏览器里模拟“序列化”：写一个 `serialize(tree)`，遇到客户端组件输出 `{ $client: 'AddToCart', props }`，遇到函数 prop 抛错。结果打印到控制台。这能把 RSC Payload 的概念变成看得见的东西，也能和 mini-react 的“元素是对象”连起来。

### mini-react（lessons-4.js:497-654）

**1. 【高】按课文演示写，练习反而不通过** · lessons-4.js:649
- 问题：演示 1（:511-513）把文本子节点包成 `{ type: 'TEXT', props: { nodeValue } }`。练习的测试要求 `children[0] === '你好'`。照抄演示思路的学生收到“props.children 应为 ["你好"]”，会以为自己理解错了。
- 修改（任选其一）：
  - 测试接受两种写法：
```js
const c0 = a.props.children[0];
t.assert(Array.isArray(a.props.children) && (c0 === '你好' || (c0 && c0.props && c0.props.nodeValue === '你好')), 'props.children 的第一项应为文本“你好”（原样保留或包成 TEXT 节点都可以）');
```
  - 或在任务中写明：“文本子节点原样放进数组，不用包装。”

**2. 【高】练习太简单，没有练到本课最有价值的部分（Hooks）** · lessons-4.js:625-653
- 问题：答案只有一行，提示（:641）直接给出这行代码，渐进提示失去意义。本课 25 分钟，核心是“Hooks 为什么依赖调用顺序”，练习却在练 createElement，而 createElement 已在两个演示里写过。
- 修改：换成（或追加）“实现 useMemo”，复用 :565-585 的游标机制，同时检验依赖比较（衔接 closures 课）：
```js
// starter
let hooks = [], cursor = 0;
function useMemo(compute, deps) {
  // 1. 读取 hooks[cursor] 中保存的 { value, deps }
  // 2. 若没有保存过，或任一依赖与上次不同（用 Object.is），重新计算
  // 3. 保存并返回 value，cursor 加 1
}
function render(fn) { cursor = 0; return fn(); }
```
```js
exports: ['useMemo', 'render'],
test: async (t) => {
  const { useMemo, render } = t.exports;
  let runs = 0;
  const C = (a, b) => () => useMemo(() => (runs++, a + b), [a, b]);
  t.assert(render(C(1, 2)) === 3 && runs === 1, '第一次应计算并返回 3');
  render(C(1, 2)); t.assert(runs === 1, '依赖不变时不应重新计算');
  t.assert(render(C(1, 5)) === 6 && runs === 2, '依赖变化时应重新计算');
  render(C(NaN, 0)); render(C(NaN, 0)); t.assert(runs === 3, '请用 Object.is 比较依赖（NaN 与 NaN 视为相同）');
}
```
  NaN 用例能区分 `===` 和 `Object.is`，这正是术语表“依赖数组用 Object.is 比较”的落点。

**3. 【中】没有说明 Hook 状态存在“组件实例”上** · lessons-4.js:562、601
- 问题：演示用一个全局 `hooks` 数组服务一个组件。专家应知道：每个组件实例（Fiber）有自己的 Hook 链表。这就是 rendering 课“状态跟着位置走”的根本原因：位置相同 → 同一个 Fiber → 同一份 Hook 链表；类型或 key 变了 → 新 Fiber → 状态清空。课程把两课的结论分开讲，没有连起来。
- 修改：在 :601 后加一段：“真实 React 中，每个组件实例对应一个 Fiber，Hook 链表存在 Fiber 上。React 按树中的位置找到 Fiber，再按调用顺序找到 Hook。这就是第 15 课“状态跟着位置走”的原因：位置和类型不变，就是同一个 Fiber，状态保留；类型或 key 变了，就新建 Fiber，状态清空。”

**4. 【中】迷你渲染器只有挂载，没有协调** · lessons-4.js:526-560
- 问题：渲染器每次从零创建 DOM。学生看到了“元素是对象”，但没看到第 15 课讲的“对比新旧树，只改需要的 DOM”。从 render 直接跳到 Fiber，中间缺了 diff。
- 修改（任选）：
  - 最小改动：在 :560 后加一句说明：“这个渲染器每次都从零创建 DOM。真实 React 会保留上一次的树：类型相同就复用 DOM 节点、只更新变化的属性；类型不同才删除重建。这就是第 15 课的协调。”
  - 完整做法：加一个 `update(dom, oldEl, newEl)` 演示，约 15 行，比较 type，相同则只改 props 和递归子节点，并打印“复用/新建”日志。

**5. 【低】迷你 useState 与真实行为的两处差异未注明** · lessons-4.js:572-575
- 问题：1. setState 立即同步重渲染（真实 React 会批处理）。2. 设为相同值也会重渲染（真实 React 会跳过）。3. `hooks[i] === undefined` 判断初始化，state 被设为 undefined 后会被重置为初始值。
- 修改：在 setState 处加注释 `// 简化：真实 React 会把更新放进队列、批量处理，值相同时还会跳过渲染`；初始化判断改为 `if (i >= hooks.length) hooks[i] = initial;`。

**6. 【低】测验偏记忆** · lessons-4.js:621-622
- 修改：把第 1 题换成直接基于演示的推理题：
  `{ q: '在迷你 useState 中，若第二次渲染时 if 跳过了第一个 useState，name 会读到什么？', options: ['"小红"', 'count 的值', 'undefined', '报错'], answer: 1, explain: '游标从 0 开始。跳过第一个调用后，name 的 useState 拿到了下标 0，也就是 count 的状态。' }`

### engineering（lessons-4.js:657-707）

**1. 【中】与第五阶段重复，定位不清** · lessons-4.js:669-696
- 问题：TypeScript 和测试两节，第五阶段各有一整课（lessons-5.js:5、:419）。本课放在“专家”阶段末尾，内容却是入门级概览；两道测验的干扰项（纯 HTML、jQuery、只做快照测试）没有区分度。阶段测验从本阶段抽题时，会稀释“专家”难度。
- 修改：本课定位为“从原理到工程”的过渡课。TS 和测试两节各压缩为两三句并链接到第五阶段；把篇幅留给“项目结构与好习惯”和学习路线。测验第 2 题换成有取舍的题：
  `{ q: '一个只在登录后使用的内部后台，不需要 SEO。更合适的起点是？', options: ['Next.js（App Router）', 'Vite + React Router（声明式路由）', 'Create React App', '服务端组件优先的框架'], answer: 1, explain: '没有 SEO 和首屏要求时，纯客户端应用更简单。框架的价值在 SSR、RSC 和数据加载。' }`

**2. 【低】检查器描述、userEvent 写法、“Server Actions”** · lessons-4.js:696、692、700 —— 见第二节第 9–11 条。

---

## 五、节奏与衔接

1. **【中】closures 放在 performance 之后，顺序颠倒** · lessons-3.js:155、294
   “每次渲染是快照”是理解 useCallback 依赖的前提。现在先学“依赖写 [] 最稳定”，下一课才学代价。建议调换两课顺序（id 不变，只改文件中的顺序，以及 `/* 16 */`、`/* 17 */` 编号）。若不调换，至少做第三节 performance 第 4 条。
2. **【中】suspense → concurrent 之间缺桥** · lessons-3.js:449、568
   见 suspense 第 2 条：用“transition 避免回退到 fallback”连接两课。
3. **【中】rendering ↔ mini-react 没有回扣** · lessons-4.js:601
   见 mini-react 第 3 条。“状态跟着位置走”的解释应在原理课揭晓，这是学生最有“原来如此”感觉的地方。
4. **【低】第四阶段开头缺少“为什么”** · lessons-4.js:9
   patterns 直接进入 API 设计。可在开头加一句：“前三个阶段你学会了用 React。这个阶段学三件事：设计别人用的组件，理解 React 的新方向，以及 React 内部如何工作。”
5. **【低】没有练习的课比例偏高**：concurrent、react-19、server-components、engineering 都没有练习，后三课也没有可运行演示和预测题。react-19 受运行环境限制可以理解，但可以用第四节建议的预测题、模拟演示补上“先预测”这一环。

---

## 六、新增预测题汇总（可直接加入 lessons-predict.js）

| 键 | 来源 |
|---|---|
| `suspense\|错误边界隔离故障` | 第三节 suspense 第 5 条 |
| `concurrent\|对比开启与关闭的输入体验` | 第三节 concurrent 第 2 条（需先给演示加 memo 开关） |
| `state-architecture\|亲手实现 Zustand` | 第四节 state-architecture 第 2 条 |
| `react-19\|乐观更新的效果` | 第四节 react-19 第 4 条 |
| `performance\|useMemo 跳过重复计算` | 第三节 performance 第 6 条（需先加开关） |

注意：预测题按“课程 id + 演示标题”挂载（lessons-predict.js:71-77）。如果修改演示标题，要同步修改键名。
