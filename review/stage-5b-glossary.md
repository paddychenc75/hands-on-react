# 技术审校：实战项目、预测题、术语表、app.js 文案

范围：`src/lessons-5.js` 第 643 行至末尾（project-todo、project-search、project-kanban、portfolio）、`src/lessons-predict.js`、`src/glossary.js`、`src/app.js` 中的用户可见教学文案。
对照来源：react.dev（主）、legacy.reactjs.org、vite.dev。审校日期：2026-10-04。

总体结论：四个实战项目的参考答案、13 道预测题的答案都正确，没有发现会让学习者写出错误代码的硬伤。问题集中在术语表的几条定义（说法过时或太窄），以及两处细节表述。

---

## 发现的问题

### 1.【过时】JSX 编译结果
- 位置：`src/glossary.js:4`
- 原文：`编译后是 createElement 调用。`
- 问题：从 React 17 起，新的 JSX 转换默认把 JSX 编译成 `react/jsx-runtime` 的 `jsx()` / `jsxs()` 调用，不再是 `React.createElement`。Vite、Next.js 等工具链都默认用新转换。本站沙箱用 Babel standalone 的 classic 运行时，所以沙箱里确实是 createElement，但这条定义写的是普遍事实，用在真实项目里就不对了。
- 来源：https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html
- 建议改为：`在 JavaScript 中描述界面的语法。编译后是普通的函数调用（新版工具链用 react/jsx-runtime 的 jsx()，旧写法是 React.createElement），返回描述界面的对象。`

### 2.【有歧义】“重新渲染”的触发条件
- 位置：`src/glossary.js:8`
- 原文：`state、props 或 Context 变化后，React 再次调用组件函数。`
- 问题：这句话会让人以为“props 变了才重新渲染”。课程第 15 课（`lessons-3.js` 的 warn）专门纠正过这个误解：父组件渲染时，子组件默认都会重新渲染，不管 props 变没变。react.dev 列出的触发原因是“组件自身或某个祖先的 state 更新了”（再加上它读取的 Context 变了）。
- 来源：https://react.dev/learn/render-and-commit
- 建议改为：`组件自己的 state 更新、父组件重新渲染，或它读取的 Context 变化后，React 再次调用组件函数。`

### 3.【有歧义】服务端组件“只在服务器上运行”
- 位置：`src/glossary.js:32`
- 原文：`只在服务器上运行的组件。它的代码不发送到浏览器。`
- 问题：react.dev 的定义是“在打包之前、在和客户端应用（以及 SSR 服务器）分开的环境中提前渲染”，可以在**构建时**运行一次，也可以**每次请求**时在 Web 服务器上运行。“只在服务器上”会让人忽略构建时渲染（静态生成）这种情况。后半句“代码不发送到浏览器”是对的。
- 来源：https://react.dev/reference/rsc/server-components
- 建议改为：`在独立于浏览器的环境中提前渲染的组件，可以在构建时或每次请求时运行。它的代码不发送到浏览器。`

### 4.【有歧义】客户端组件的定义
- 位置：`src/glossary.js:33`
- 原文：`用 'use client' 标记、在浏览器中运行的组件。`
- 问题：有两处不准确。(1) `'use client'` 标记的是模块边界。被 `'use client'` 模块导入的组件，即使自己的文件没写这个指令，也会成为客户端组件。(2) 客户端组件也会在服务器上做 SSR 预渲染生成 HTML，不是“只在浏览器中运行”。术语表里的“水合”条目，讲的正是浏览器接管这份 HTML 的过程。按现在的写法，学习者会以为客户端组件不参与服务端渲染。
- 来源：https://react.dev/reference/rsc/use-client
- 建议改为：`'use client' 边界之后的组件。它的代码会发送到浏览器，可以使用 state 和事件；首次加载时通常也会在服务器上预渲染成 HTML。`

### 5.【有歧义】Hook 的定义没有覆盖自定义 Hook 和 `use`
- 位置：`src/glossary.js:13`
- 原文：`以 use 开头、只能在组件顶层调用的函数，例如 useState。`
- 问题：(1) Hook 也可以在**自定义 Hook 的顶层**调用，不只是组件顶层。(2) React 19 的 `use` 以 use 开头，但官方明确说明它“不是 Hook”，可以在 if 和循环里调用。按这条定义，学习者会以为 `use` 也受顶层调用的限制。
- 来源：https://react.dev/reference/rules/rules-of-hooks ，https://react.dev/reference/react/use
- 建议改为：`以 use 开头、只能在组件或自定义 Hook 的顶层调用的函数，例如 useState。（React 19 的 use 是例外，它不是 Hook，可以在条件中调用。）`

### 6.【有歧义】看板测验的解析和题目没有对上
- 位置：`src/lessons-5.js:938`
- 原文：`explain: 'dispatch 的引用是稳定的，放进 Context 不会引起额外渲染。'`
- 问题：题目问的是“主要好处”，正确选项是“避免层层传递回调”，但解析讲的是另一回事（引用稳定）。而且“不会引起额外渲染”在这个练习里容易被误解：Provider 放在 App 里，每次 dispatch 后 App 都会重新渲染，所有 Card 也会跟着父组件重新渲染。dispatch 引用稳定只能保证 **Context 的值本身**不会额外触发消费者更新，不能保证子组件不渲染。react.dev 用 dispatch Context 的理由是避免逐层传递（prop drilling）。
- 来源：https://react.dev/learn/scaling-up-with-reducer-and-context ，https://react.dev/reference/react/useReducer （dispatch 引用稳定）
- 建议改为：`深层组件可以直接拿到 dispatch，不用每层都传回调。另外，dispatch 的引用始终不变，所以这个 Context 的值不会因为 state 变化而变化。`

### 7.【有歧义】竞态时间线和模拟接口的数字不一致
- 位置：`src/lessons-5.js:793`（对照 `:822` 的 `Math.max(100, 900 - q.length * 300)`）
- 原文：`输入“李” → 发出请求 A（需要 700 ms）` 和 `350 → 700 ms`
- 问题：按模拟接口的公式，“李”（1 个字）需要 900 − 300 = **600 ms**，不是 700 ms；A 应在 600 ms 返回。结论（B 先返回、A 后返回）不变，但细心的学习者对照代码时会困惑。
- 建议改为：`输入“李” → 发出请求 A（需要 600 ms）`，时间轴改为 `350 → 600 ms`。

### 8.【过时（轻微）】“Server Actions”的叫法
- 位置：`src/lessons-5.js:1158`
- 原文：`Server Actions 中的权限校验（第 30 课）`
- 问题：React 19 文档从 2024 年 9 月起把这类函数统称为 **Server Functions**，只有作为 action 使用（传给 form 的 action 等）时才叫 Server Action。Next.js 文档两种叫法都在用，所以这里不算错，但最好和 React 19 的术语保持一致。此外，要强调**每个** Server Function 内部都要单独做鉴权，因为它们本质上是公开的 HTTP 接口。
- 来源：https://react.dev/reference/rsc/server-functions
- 建议改为：`Server Functions（Server Actions）内部的权限校验（第 30 课）`

### 9.【有歧义（轻微）】“竞态”的定义过窄
- 位置：`src/glossary.js:35`
- 原文：`多个异步请求的返回顺序与发出顺序不同，导致显示旧数据。`
- 问题：这只是竞态在前端最常见的一种表现。竞态的一般含义是“结果依赖于多个异步操作完成的先后顺序”。作为课程术语可以接受，但最好说明这是在请求场景下的定义。
- 建议改为：`结果取决于多个异步操作完成的先后顺序。在本课程中，指旧请求比新请求晚返回、覆盖了新数据。`

---

## 已核对且正确的内容

- **project-todo**：只存 todos、text、filter 三个状态，其余派生，符合 react.dev“选择 state 结构”的原则；`map` + 展开的不可变更新正确；`form onSubmit` + `preventDefault` 正确；两道测验的答案正确。
- **project-search**：参考答案用 `ignore` 标记，成功和失败两个分支都检查了，竞态处理正确（https://react.dev/learn/synchronizing-with-effects#fetching-data ）；空查询时重置为 idle；用单个 status 字段代替多个布尔值的说法正确；提到 AbortController 是可选的进阶写法，表述恰当。测试的等待时长和模拟接口的延迟匹配。
- **project-kanban**：reducer 每个分支都返回新对象，越界判断正确；只存 `col` 字段（规范化）的解释正确；`dispatch` 引用稳定这一事实本身符合 useReducer 文档。
- **portfolio**：`npm create vite@latest my-app -- --template react-ts`、端口 5173 与 vite.dev 一致（Vite 要求 Node 20.19+/22.12+，“建议 LTS”满足要求）；useOptimistic“失败自动回滚”与 react.dev 一致（失败时基础 state 没变，界面恢复原样；官方建议同时 catch 错误并提示用户）；“先用 Profiler 测量再优化”的测验正确；交叉引用的课号（第 6–33 课）都对得上。
- **lessons-predict.js**：13 道预测题逐一对照了对应的示例代码，答案全部正确：失败的计数器（0）、快照 +3（1）、冒泡（2 条）、`0 &&`（显示 0）、index 当 key（输入内容错位）、三种 effect（只有 ①）、谁被重新渲染（只有 Counter）、状态跟着位置走（只有情况 1）、memo（只有第三个）、闭包快照（0）、计数器卡在 1（停在 1）、迷你 useState（`[2,"小红"]`）、迷你 useQuery 去重（1 次）。
- **glossary.js 其余条目**：组件、props、state、渲染、提交、挂载、卸载、事件处理函数、自定义 Hook、effect、依赖数组、清理函数、受控组件、key、ref、Context、reducer、action、dispatch、纯函数、闭包、记忆化、协调、Fiber、错误边界、过渡更新、水合、乐观更新，定义都没有技术错误。
- **app.js 文案**：首页组件树的说明（点击节点时，它和它的后代重新渲染，兄弟和祖先不受影响；对应第 15 课）正确；五个阶段的描述、复习间隔、阶段测验 80% 等文案不涉及技术错误。
