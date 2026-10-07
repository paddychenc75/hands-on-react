# 第二阶段技术审校（src/lessons-2.js + glossary.js 相关条目）

审校范围：use-effect、lifting-state、use-ref、context、use-reducer、custom-hooks 六课的正文、代码、测验、练习与测试；术语表中相关条目。
参照：react.dev（React 19 为当前稳定版）、MDN。运行环境为 React 18.3.1 UMD，因此可运行代码保留 React 18 写法属于有意设计；本报告只要求正文说明与当前文档一致。

---

## 发现的问题

### 1. 【过时】context · src/lessons-2.js:385-388（另见 400、435、514、519 及测验 477）

原文：
```
// ② 提供：用 Provider 包住子树，传入 value
<ThemeContext.Provider value="dark">
```
测验 477：`离它最近的上层 Ctx.Provider 的 value；若没有则用默认值`

问题：React 19 起可以直接把 `<ThemeContext>` 当作 Provider 渲染。官方文档把 `<SomeContext.Provider>` 标为旧版本写法，并说明未来会弃用。课程全篇只讲 `.Provider`，没有提到 React 19 的写法。运行环境是 React 18，代码可以不改，但正文应补充说明。

来源：https://react.dev/reference/react/createContext ；https://react.dev/blog/2024/12/05/react-19#context-as-a-provider

建议补充（放在三步代码之后，用 tip 或 deep）：
> 本课的运行环境是 React 18，所以写 `ThemeContext.Provider`。
> React 19 起，可以直接写 `<ThemeContext value="dark">`。
> 新项目推荐 React 19 写法。`.Provider` 将来会被弃用。

测验 477 选项可改为：`离它最近的上层 Provider 的 value；若没有则用默认值`（去掉 `Ctx.` 前缀，同时适用两种写法）。

---

### 2. 【错误】custom-hooks · src/lessons-2.js:732-736、747-748

原文：
```js
fetch(url)
  .then(res => res.json())
  .then(json => { if (!ignore) { setData(json); setError(null); } })
  .catch(err => { if (!ignore) setError(err); })
```
以及使用处 `if (error) return <p>出错了</p>; return <ul>{data.map(...)}</ul>;`

问题：`fetch()` 只在网络错误时 reject。服务器返回 404、500 时，Promise 正常 resolve，不会进入 `.catch`。如果错误响应体是 JSON 对象，`data` 会被设为这个对象，`data.map` 会抛出 TypeError；如果响应体不是 JSON，错误信息也只是一个 JSON 解析错误。这个示例会让学习者以为 `.catch` 能处理 HTTP 错误。

来源：https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch （“A fetch() promise does not reject if the server responds with HTTP status codes that indicate errors”）

建议替换：
```js
fetch(url)
  .then(res => {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
```
并在代码后加一句：
> 注意：服务器返回 404 或 500 时，fetch 不会进入 catch。
> 所以要先检查 `res.ok`。

---

### 3. 【错误】lifting-state · src/lessons-2.js:192-205（及说明文字 209）

原文：
```js
onChange={f => {
  const n = parseFloat(f);
  setCelsius(isNaN(n) ? '' : String(Math.round(((n - 32) * 5 / 9) * 10) / 10));
}}
```
说明：`在任意一个输入框里改数字，另一个都会同步更新。`

问题：华氏度输入框的 value 是由“四舍五入后的摄氏度”再算回来的，不是用户输入的原文。实际效果：
- 在华氏度框输入 `51`，框里立刻变成 `51.1`（51 → 10.6 °C → 51.08 °F）。
- 输入 `1.`，小数点立刻消失（`1.` → -17.2 °C → `1`），无法输入小数。
- 输入 `-`，整个框被清空，无法输入负数。

正在输入的框被改写，这与“另一个会同步更新”的描述不符，会让学习者以为是自己操作出错。react.dev 的原版示例（Lifting State Up 旧版文档的温度计算器）同时存储“输入的字符串”和“输入的是哪种单位”，正是为了避免这个问题。

来源：https://react.dev/learn/sharing-state-between-components （状态提升的原则）；MDN parseFloat：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat

建议（任选其一）：
- 方案 A：state 改为 `{ value: '20', scale: 'c' }`。正在编辑的框显示原始字符串，另一个框显示换算值。
- 方案 B：保留代码，把说明改为：
> 在摄氏度框里改数字，华氏度框会同步更新。
> 华氏度框的值由摄氏度算出，所以输入时会被四舍五入。

---

### 4. 【有歧义】术语表 · src/glossary.js:8（重新渲染）

原文：`state、props 或 Context 变化后，React 再次调用组件函数。`

问题：组件重新渲染的原因是“自身 state 更新”或“某个祖先组件的 state 更新”（以及所读取的 Context 变化）。父组件重新渲染时，子组件默认也会重新渲染，**不管 props 是否变化**。“props 变化才重新渲染”是常见误解，后续讲 memo 时会造成冲突。

来源：https://react.dev/learn/render-and-commit （“The component's (or one of its ancestors') state has been updated.”）

建议替换：
> 组件的 state 或它读取的 Context 变化后，React 再次调用组件函数。
> 父组件重新渲染时，子组件默认也会重新渲染。

---

### 5. 【有歧义】术语表 · src/glossary.js:16（依赖数组）

原文：`数组中的值变化时，Hook 重新执行。`

问题：Hook 本身每次渲染都会被调用。依赖变化时重新执行的是 effect 函数（或 useMemo 的计算函数）。另外“变化”是按 `Object.is` 比较的，对象和数组每次渲染新建就算变化。

来源：https://react.dev/reference/react/useEffect#parameters

建议替换：
> useEffect、useMemo 等的第二个参数。
> React 用 Object.is 逐项比较。
> 有一项变化，就重新执行 effect 或计算函数。

---

### 6. 【有歧义】custom-hooks · src/lessons-2.js:674、755；src/glossary.js:13

原文（674）：`自定义 Hook 就是一个名字以 use 开头、内部调用了其他 Hook 的普通函数。`
原文（755 解释）：`以 use 开头是约定，也是 lint 工具检查 Hook 规则的依据。`
原文（glossary:13）：`以 use 开头、只能在组件顶层调用的函数，例如 useState。`

问题：
- 官方规则是“`use` 后面紧跟一个**大写字母**”，如 `useOnlineStatus`。`user()`、`useless()` 不算 Hook；lint 也按这个规则识别。
- 术语表说“只能在组件顶层调用”，漏掉了自定义 Hook 的顶层。
- React 19 的 `use` API 也以 use 开头，但可以在 if 和循环中调用。官方文档特意说明它不同于 Hook。术语表的定义会让学习者在遇到 `use` 时困惑。

来源：https://react.dev/learn/reusing-logic-with-custom-hooks#hook-names-always-start-with-use ；https://react.dev/reference/react/use

建议替换：
- 674：`自定义 Hook 是一个名字以 use 加大写字母开头的函数，例如 useToggle。它内部调用了其他 Hook。`
- 755 解释：`名字必须是 use 加大写字母开头。lint 工具靠这个名字识别 Hook 并检查规则。`
- glossary:13：`名字以 use 加大写字母开头的函数，例如 useState。只能在组件或自定义 Hook 的顶层调用。`（可选补充：`React 19 的 use 是例外，它可以在条件语句中调用。`）

---

### 7. 【有歧义】use-effect · src/lessons-2.js:120

原文：`开发环境中，严格模式（StrictMode）会多运行一轮 effect。顺序是：执行 → 清理 → 再执行。`

问题：额外的一轮只发生在组件**挂载**时，不是每次 effect 执行都多一轮。原文没有限定，学习者可能以为依赖每次变化都会执行两次。另外，React 19 的严格模式也会对 ref 回调做同样的“挂载 → 清理 → 再挂载”检查。

来源：https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-re-running-effects-in-development ；https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development

建议替换：
> 开发环境中，严格模式会在组件挂载时多运行一轮 effect。
> 顺序是：执行 → 清理 → 再执行。
> 这样做是为了检查你的清理函数。生产环境不会这样。

---

## 已核对、未发现问题的内容

- use-effect：副作用的定义；effect 在提交后执行；依赖数组三种写法表格；示例 ①②③ 的执行时机说明（打字只触发 ①，点击触发 ①③）；清理函数在下次执行前和卸载时运行（测验 124 答案正确）；`ignore` 标记处理竞态（与 react.dev 写法一致）；`react-hooks/exhaustive-deps` 规则名；“你可能不需要 effect”三条（派生值直接计算、用户操作放事件处理函数、用 key 重置 state）均与 react.dev 一致；测验 123、125；练习与测试（函数式更新、`[]` 依赖、clearInterval）。
- lifting-state：单向数据流、状态提升、单一数据源、state 放置流程、prop drilling 说明；测验 219、220；练习与测试（+5、+1、+5 = 11）。
- use-ref：ref 对象在组件生命周期内是同一个；修改不触发渲染；挂载后 `ref.current` 指向 DOM 节点；“不要在渲染期间读写 ref.current”（官方另有“初始化除外”，不影响本课）；ref/state 对比表；React 18 需要 forwardRef、React 19 可将 ref 作为 prop 传递；测验 337、338；练习与测试。
- context：查找最近 Provider、找不到用默认值；value 变化时所有消费组件重新渲染；拆分 Context、自定义 Hook 封装（`useCart` 抛错检查）；适用场景建议；练习与测试。
- use-reducer：reducer/action/dispatch 概念；示例 reducer 返回新数组、未知 action 抛错（与 react.dev 一致）；reducer 必须纯，Date.now() 的说明与修正建议；useState 与 useReducer 选择表；state 与 dispatch 分别放入两个 Context；测验 607、608；练习与测试。
- custom-hooks：Hooks 两条规则；按调用顺序识别 Hook（内部链表的说法与实现一致）；自定义 Hook 共享逻辑而非状态（测验 754 正确）；useWindowWidth、useToggle、useLocalStorage 示例可运行（playground 与页面同源，localStorage 可用，且有 try/catch）；useFetch 的 `ignore` 竞态处理；TanStack Query / SWR 的描述；测验 753。
- glossary：组件、渲染、提交、挂载、卸载、effect、清理函数、ref、Context、reducer、action、dispatch、纯函数、竞态等条目与本阶段内容一致。
