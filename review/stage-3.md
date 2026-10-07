# 第三阶段（lessons-3.js）技术审校

范围：`src/lessons-3.js`（rendering、performance、closures、suspense、concurrent）以及 `src/glossary.js` 中的相关术语。
对照基准：react.dev 上 React 19.x 的当前文档。运行环境用 React 18.3.1 UMD，所以可运行代码是 React 18 写法，这一点是有意为之，不算问题。

共 10 条：错误 1 条，过时 3 条，有歧义 6 条。

---

## 1. 【错误】说差异是在提交阶段对比出来的

- 课程：`rendering`
- 位置：`src/lessons-3.js:15`
- 原文：「React 会在提交阶段对比差异，所以多数时候这并不会造成问题。」
- 问题：对比新旧树、算出差异发生在**渲染阶段**。提交阶段只是把已经算好的最少改动应用到 DOM。这句话和同一课第 11 行的图示（“渲染：……与上一次对比算出差异”）互相矛盾。
- 来源：https://react.dev/learn/render-and-commit （原话：“the minimal necessary operations (calculated while rendering!)”）
- 建议改为：「React 在渲染阶段算出差异，提交阶段只修改真正变化的 DOM。所以多数时候这并不会造成问题。」

## 2. 【过时】React Compiler 已经发布稳定版

- 课程：`performance`
- 位置：`src/lessons-3.js:239`
- 原文：「React 团队推出了 React Compiler。……以后需要手写 useMemo 和 useCallback 的地方会少很多。」
- 问题：React Compiler 1.0 已于 2025 年 10 月发布稳定版。官方现在建议：新代码默认依靠编译器做记忆化，useMemo/useCallback 只在需要精确控制时使用（例如作为 effect 依赖的值）。开启编译器后，组件会自动获得相当于 memo 的效果。“以后”的说法已经过时。
- 来源：https://react.dev/learn/react-compiler/introduction ；https://react.dev/blog/2025/10/07/react-compiler-1 ；https://react.dev/reference/react/memo
- 建议改为：「React Compiler 1.0 已经稳定。它在构建时自动记忆化组件和值。新项目建议开启它，只在需要精确控制时手写 useMemo、useCallback。本课的“引用相等”原理仍然是理解它的基础。」

## 3. 【过时】useEffectEvent 已是稳定 API

- 课程：`closures`
- 位置：`src/lessons-3.js:358`
- 原文：「React 正在推出 `useEffectEvent`。它从 effect 中提取不应成为依赖的逻辑。它是官方的“读取最新值”方案。」
- 问题：
  1. `useEffectEvent` 已在 React 19.2 中正式发布，“正在推出”的说法已经过时。
  2. 它不是通用的“读取最新值”工具。Effect Event 只能在 effect（或其他 Effect Event）内部调用，不能在渲染期间调用，不能传给其他组件，也不要写进依赖数组。它的引用每次渲染都会变。
- 来源：https://react.dev/blog/2025/10/01/react-19-2 ；https://react.dev/reference/react/useEffectEvent
- 建议改为：「React 19.2 起提供 `useEffectEvent`。它把 effect 中“需要读取最新值、但不应触发 effect 重新执行”的逻辑提取成 Effect Event。Effect Event 只能在 effect 内部调用，也不要放进依赖数组。在 React 19.2 以上，它取代上面的 ref 写法。」

## 4. 【过时 / 有歧义】错误边界无法捕获“Promise”中的错误

- 课程：`suspense`
- 位置：`src/lessons-3.js:494`
- 原文：「2. 异步代码中的错误，例如 setTimeout 和 Promise。……它只捕获渲染期间和生命周期中的错误。」
- 问题：setTimeout 的部分是对的。但在 React 19 中：
  1. 传给 `startTransition` 的函数抛出错误或返回被拒绝的 Promise 时，错误会交给错误边界处理。
  2. 用 `use()` 读取一个被拒绝的 Promise 时，错误也会交给最近的错误边界。
  
  笼统地说 Promise 中的错误都捕获不到，已经不准确。另外，官方列表中还有“服务端渲染中的错误”这一项。
- 来源：https://react.dev/reference/react/Component （Catching rendering errors…）；https://react.dev/reference/react/useTransition
- 建议改为：「2. 异步回调中的错误，例如 setTimeout。例外：startTransition 中抛出的错误，以及 use() 读到的被拒绝的 Promise，会交给错误边界处理（React 19）。」最后一句改成：「它捕获子树在渲染、生命周期和 effect 中的错误。」

## 5. 【有歧义】把 Suspense 数据加载说得过于简单

- 课程：`suspense`
- 位置：`src/lessons-3.js:449`
- 原文：「Suspense 也可以用于数据加载。支持 Suspense 的工具有 Next.js、Relay、TanStack Query 和 React 19 的 `use()`。……你不需要在每个组件里写 `if (loading)`。」
- 问题：学生可能以为在组件里直接 `use(fetch(...))`，或在 useEffect 里请求数据，也能触发 Suspense。官方明确说明：Suspense **不会**检测在 effect 或事件处理函数中请求的数据。用 `use()` 读取的 Promise 必须被缓存，每次渲染都要拿到同一个实例。不能在渲染时新建 Promise。另外，TanStack Query 需要使用它的 Suspense 版 API（例如 `useSuspenseQuery`）。
- 来源：https://react.dev/reference/react/Suspense ；https://react.dev/reference/react/use
- 建议补充：「注意：在 useEffect 或事件处理函数中请求的数据不会触发 Suspense。用 use() 读取的 Promise 必须来自框架或缓存，不能在渲染时新建。」

## 6. 【有歧义】useDeferredValue “在 React 空闲时”才后台渲染

- 课程：`concurrent`
- 位置：`src/lessons-3.js:573`
- 原文：「紧急渲染时它保持旧值；React 空闲时再用新值进行后台渲染……」
- 问题：useDeferredValue 不会等浏览器空闲。官方原话是：原来的渲染一完成，React 就**立即**开始用新值做后台渲染。这次后台渲染可以被新的更新打断。“空闲时”容易被理解成类似 requestIdleCallback 的延迟，这和同一课第 630 行“没有固定的延迟”也有冲突。
- 来源：https://react.dev/reference/react/useDeferredValue
- 建议改为：「紧急渲染时它保持旧值。这次渲染一提交，React 立即在后台用新值再渲染一次。如果期间又有新输入，就丢弃这次后台渲染，用最新值重新开始。」

## 7. 【有歧义】“children 不会重新渲染”中的“父组件”指的是谁

- 课程：`performance`
- 位置：`src/lessons-3.js:238`
- 原文：「把内容作为 children 传入：children 中的 JSX 在更外层创建。所以父组件的 state 变化时，children 不会重新渲染」
- 问题：这里成立的前提是“**包裹 children 的那个组件**”自己的 state 变化。如果创建这段 JSX 的外层组件重新渲染，children 照样会重新渲染。按上一课的说法，“父组件”一般指外层组件，所以读者容易得出相反的理解。
- 来源：https://react.dev/reference/react/memo （“when the wrapper component updates its own state, React knows that its children don't need to re-render”）
- 建议改为：「……当包裹组件自己的 state 变化时，作为 children 传入的内容不会重新渲染。」

## 8. 【有歧义】术语表把“props 变化”列为重新渲染的原因

- 位置：`src/glossary.js:8`
- 原文：「重新渲染：state、props 或 Context 变化后，React 再次调用组件函数。」
- 问题：这正是 `rendering` 课第 15 行指出的“常见误解”。props 变化本身不会触发渲染。触发子组件重新渲染的是父组件的渲染（props 不变也会渲染）。术语表和课程正文互相矛盾。
- 来源：https://react.dev/learn/render-and-commit
- 建议改为：「组件自己的 state 或它读取的 Context 变化，或者父组件重新渲染后，React 再次调用组件函数。」

## 9. 【有歧义】说 diff 能找出“最少的改动”

- 课程：`rendering`
- 位置：`src/lessons-3.js:62`
- 原文：「React 对比新树和旧树，找出最少的改动，再修改真实 DOM。」
- 问题：紧接着的第 63–64 行说明，React 是靠两个假设做的 O(n) 启发式算法，并不保证得到全局最少的改动（例如类型一变就整棵子树重建）。“最少”和下文矛盾。
- 来源：https://legacy.reactjs.org/docs/reconciliation.html
- 建议改为：「React 对比新树和旧树，找出需要的改动，再修改真实 DOM。」

## 10. 【有歧义】演示代码在渲染期间读写 ref 和模块变量

- 课程：`rendering`、`performance`
- 位置：`src/lessons-3.js:22-24`、`:31`、`:179-180`、`:183`（以及练习中的模块级计数器 `:101-103`、`:250-252`）
- 原文：`const count = useRef(0); count.current++;` 以及在 JSX 中读取 `{count.current}`
- 问题：官方明确要求：不要在渲染期间读写 `ref.current`，因为组件函数应该是纯函数。这里用来数渲染次数，作为演示可以接受。但课程没有说明这一点，学生可能把它当成正常写法。在 StrictMode 下（开发模式会把渲染执行两次），或开启 React Compiler 后，显示的次数会不准。
- 来源：https://react.dev/reference/react/useRef （Pitfall）
- 建议：在代码中加一行注释：「// 仅用于演示：真实代码不要在渲染期间读写 ref。StrictMode 下次数会翻倍。」

---

## 已核对且正确的内容

- 触发 → 渲染 → 提交三个阶段；“渲染”指调用组件函数（第 11、95 行，以及术语表“渲染”“提交”）。
- 父组件渲染时子组件默认也会渲染；Context 变化会触发渲染（第 14 行，测验第 93 行）。
- 类型不同的元素会重建整棵子树并丢失 state；key 的作用；state 跟着位置走的三个演示（第 64–88 行，测验第 94 行）。
- 不要在组件内部定义组件（第 89 行）。
- Fiber 从 React 16 开始使用，是并发特性的基础（第 90 行，术语表）。
- memo 用 Object.is 逐个浅比较 props；内联对象和函数会让 memo 失效；useCallback(fn, deps) 等价于 useMemo(() => fn, deps)（第 162–203 行，测验第 242–243 行）。
- “先测量再优化”、Profiler、把 state 下移（第 236–238 行，练习 rendering 和 performance 的答案与测试）。
- 每次渲染都是一张快照；interval 中的过期闭包会让计数停在 1；三种修复方法；dispatch 引用是稳定的；对象作为依赖会让 effect 每次渲染都执行（第 299–365 行及练习）。
- 用 ref 保存最新值的写法（第 349–357 行）：在 effect 中写 ref 是允许的。
- lazy 在组件第一次渲染时才加载；需要 default 导出；fallback 由最近的 Suspense 显示（第 411–448 行，测验第 498 行）。
- 错误边界目前仍然只能用 class 组件编写，或者使用 react-error-boundary（第 451 行）；getDerivedStateFromError 和 componentDidCatch 的用法；事件处理函数和 setTimeout 中的错误捕获不到；测验第 499 行的答案正确；练习的答案和测试正确。
- React 18 引入并发渲染；过渡更新可以被打断；useDeferredValue 配合 memo 列表的说明（第 606 行）；useTransition 返回 [isPending, startTransition]；Transition 不能用来控制输入框（第 629 行）；和防抖的区别（第 630 行）；对比表和两道测验。
- 术语表中“依赖数组”“清理函数”“记忆化”“协调”“Fiber”“错误边界”“过渡更新”的定义。
