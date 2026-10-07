# 第四阶段（lessons-4.js）技术审校

审校范围：`src/lessons-4.js`（patterns、state-architecture、react-19、server-components、mini-react、engineering）及 `src/glossary.js` 相关条目。
核对基准：react.dev 当前文档（最新版本 React 19.3，2026-09-09）。运行环境为 React 18.3.1，React 19 示例为只读代码，这一点不计为问题。

## 发现的问题

### 1. 【错误】server-components · lessons-4.js:463
- 原文：`['async/await 直接取数据', '✅', '❌（用 use() 或数据库）']`
- 问题：客户端组件在浏览器中运行，不能访问数据库。这与下一行“访问数据库……客户端组件 ❌ 会暴露”自相矛盾。原意可能是“数据请求库”（如 TanStack Query）。
- 来源：https://react.dev/reference/rsc/server-components ，https://react.dev/reference/rsc/use-client
- 建议改为：`❌（用 use() 读取服务端传来的 Promise，或用 TanStack Query 等数据请求库）`

### 2. 【过时】server-components · lessons-4.js:420、468、469、479、489
- 原文：`SSR、RSC、Server Actions 一次讲清`；`不能传函数，Server Action 除外`；`h('Server Actions：从客户端调用服务器函数')`；quiz 选项 `可以被客户端调用的服务器函数（Server Action）`
- 问题：React 官方自 2024 年 9 月起把 `'use server'` 标记的函数统称为 **Server Functions**。只有传给 `action` prop 或在 Action 中调用时才叫 Server Action，“并非所有 Server Function 都是 Server Action”。可序列化 props 列表中写的也是“Server Functions”。
- 来源：https://react.dev/reference/rsc/server-functions ，https://react.dev/reference/rsc/use-client#serializable-types
- 建议：统一用“Server Function（服务器函数）”。468 行改为“不能传函数，Server Function 除外”。quiz 选项改为“可以被客户端调用的服务器函数（Server Function）”。469 行标题可写成“Server Functions：从客户端调用服务器函数”，并补一句：“作为表单 action 使用时，也叫 Server Action。”

### 3. 【有歧义】react-19 · lessons-4.js:399（及 413 的 explain）
- 原文：`// 和其他 Hook 不同，use 可以写在条件语句里`
- 问题：官方明确说“Despite its name, `use` is not a Hook”。注释把 use 称为 Hook，与 413 行 explain（“use 是一个特殊的 API”）和术语表中 Hook 的定义（“只能在组件顶层调用”）相互矛盾。另外，官方警告 use 不能写在 try-catch 中，也不要传入在渲染中新建的 Promise。
- 来源：https://react.dev/reference/react/use
- 建议改为：`// use 不是 Hook，而是一个 API：它可以写在条件语句和循环里`。可补一句：“不要在渲染中新建 Promise 再传给 use（例如 use(fetch(...))），也不能把 use 写在 try-catch 里。”

### 4. 【有歧义】react-19 · lessons-4.js:337-357
- 原文：`点赞、发消息时，先立刻在界面上显示结果……如果失败，自动回滚。`
- 问题：没有说明 `useOptimistic` 的设置函数**必须在 Action 或 startTransition 中调用**。示例写在 form action 中，所以没问题。但读者若在普通 onClick 中调用，会得到警告，乐观值也会闪一下就消失。
- 来源：https://react.dev/reference/react/useOptimistic
- 建议补一句：“addOptimistic 必须在 Action（如 form 的 action）或 startTransition 中调用。Action 结束后，乐观值自动换回真实值。”

### 5. 【过时】react-19 · lessons-4.js:288-292、408
- 原文：`React 19（2024 年 12 月正式发布）带来了一批……新特性`
- 问题：这句话本身没错。但截至 2026 年 10 月，已有 19.1（2025-03）、19.2（2025-10-01）、19.3（2026-09-09）。19.2 新增 `<Activity>`、`useEffectEvent`、`cacheSignal`、部分预渲染（Partial Pre-rendering）。19.3 新增 `<ViewTransition>`、Fragment refs、`browser()`。本课完全没有提到这些版本，学生会以为 19.0 就是全部。
- 来源：https://react.dev/blog/2025/10/01/react-19-2 ，https://react.dev/blog/2026/09/09/react-19-3 ，https://react.dev/versions
- 建议：在“其他实用改进”后加一小段：“后续小版本：19.2 新增 &lt;Activity&gt;（隐藏但保留状态）和 useEffectEvent（从 effect 中提取非响应式逻辑）。19.3 新增 &lt;ViewTransition&gt; 动画和 Fragment refs。”

### 6. 【有歧义】mini-react · lessons-4.js:601-602
- 原文：`React 16 引入的 Fiber 架构解决了这个问题`；`每完成一个就检查：时间片用完了吗？……就让出主线程`
- 问题：Fiber 在 React 16 引入，但 React 16/17 的默认渲染仍然是同步的，不可中断。直到 React 18 的并发特性才真正启用可中断渲染。即使在 React 18/19 中，也只有过渡更新（startTransition、useDeferredValue 等）才会分时间片、可被打断。点击、输入等紧急更新仍然同步完成。原文容易让人以为所有渲染都可中断。
- 来源：https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react
- 建议补一句：“Fiber 让可中断成为可能。但只有并发更新（如 startTransition 中的更新）才会分片并让出主线程，紧急更新仍然一次做完。”

### 7. 【过时】engineering · lessons-4.js:661-666、703
- 原文：`官方已不再推荐 Create React App。`；quiz explain `CRA 已不再维护推荐`
- 问题：说法偏弱。React 团队已于 2025-02-14 正式宣布弃用（sunset）CRA。另外，react.dev 当前推荐的框架是 Next.js、React Router v7、Expo（以及 TanStack Start 等）。从零搭建时推荐 Vite、Parcel、Rsbuild。表格内容基本一致，“React Router（原 Remix）”也大致准确：Remix v2 已并入 React Router v7。但 Remix 3 现在是另一个独立项目，这个说法容易引起误会。
- 来源：https://react.dev/blog/2025/02/14/sunsetting-create-react-app ，https://react.dev/learn/creating-a-react-app
- 建议：改为“Create React App 已于 2025 年 2 月被官方正式弃用。”表格写“React Router v7（框架模式，Remix 已并入）”。explain 改为“CRA 已被官方弃用；全栈场景使用框架。”

### 8. 【过时】engineering · lessons-4.js:696
- 原文：`开启 StrictMode 和 ESLint（包括 react-hooks 插件）`；`先让它工作，再用 Profiler 测量，最后才优化。`
- 问题：内容没错，但缺少当前的关键工具信息。React Compiler 1.0 已于 2025-10-07 稳定发布，可以自动做记忆化。`eslint-plugin-react-hooks` v6+ 默认使用 flat config，并内置由编译器驱动的规则（`recommended` 预设）。
- 来源：https://react.dev/blog/2025/10/07/react-compiler-1 ，https://react.dev/blog/2025/10/01/react-19-2#eslint-plugin-react-hooks
- 建议补一条：“新项目可开启 React Compiler，它会自动做记忆化，大多数情况下不必手写 useMemo/useCallback。eslint-plugin-react-hooks 新版使用 flat config（eslint.config.js），recommended 预设已包含编译器相关规则。”

### 9. 【有歧义】server-components · lessons-4.js:484
- 原文：`框架会为这个函数自动生成一个 API 接口。所以务必在其中做权限校验和输入验证。`
- 问题：这句话正确。但 2025 年 12 月 RSC 曾曝出严重漏洞（远程代码执行、DoS、源码泄露）。建议顺带提醒保持依赖更新，这属于安全常识。
- 来源：https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components ，https://react.dev/reference/rsc/use-server#security
- 建议补一句：“同时及时升级 React 和框架版本。2025 年 12 月 RSC 曾修复过严重安全漏洞。”（可选）

### 10. 【有歧义】glossary.js:33（客户端组件）
- 原文：`用 'use client' 标记、在浏览器中运行的组件。`
- 问题：被 `'use client'` 模块导入的组件，即使自身没有标记，也是客户端组件。而且客户端组件在 SSR 时也会在服务器上预渲染一次。这个定义会让人以为每个客户端组件都要标记，并且只在浏览器运行。
- 来源：https://react.dev/reference/rsc/use-client
- 建议改为：“位于 'use client' 边界内的组件（在该模块中定义，或被它导入）。它的代码会发送到浏览器，可以使用 state 和事件。”

### 11. 【有歧义】glossary.js:13（Hook）
- 原文：`以 use 开头、只能在组件顶层调用的函数，例如 useState。`
- 问题：与 react-19 课中的 `use()` 冲突：它以 use 开头，却可以在条件中调用。另外，Hook 也可以在自定义 Hook 的顶层调用。
- 来源：https://react.dev/reference/rules/rules-of-hooks ，https://react.dev/reference/react/use
- 建议改为：“以 use 开头、只能在组件或自定义 Hook 顶层调用的函数，例如 useState。（use() 是例外，它不是 Hook。）”

## 已核对且正确的内容
- patterns：复合组件 + Context 示例；受控/非受控判断（`value !== undefined`）；练习的解答与测试（locked 用例行为正确）；Hooks 在 2019 年（16.8）之前靠 render props/HOC 复用逻辑。
- state-architecture：`useSyncExternalStore(subscribe, getSnapshot)` 的签名与“返回相同引用”的要求；撕裂（tearing）的解释；迷你 Zustand 中 selector 只让相关组件重新渲染（快照为原始值或稳定函数）；selector 返回新对象会导致无限循环，Zustand 提供 `useShallow`；练习解答正确。
- react-19：发布时间 2024-12-05；异步 transition 即 Action；`<form action={fn}>` 传入 FormData，成功后自动重置非受控字段；`useActionState` 从 'react' 导入，返回 `[state, formAction, isPending]`，reducer 签名为 `(prevState, formData)`；`useFormStatus` 来自 react-dom；`useOptimistic(value, updateFn)` 用法；`use(promise)` 配合 Suspense；ref 作为 prop；`<Context>` 直接作为 Provider；ref 回调清理函数；`<title>/<meta>` 自动提升；hydration 错误差异提示；quiz 答案均正确。
- server-components：CSR/SSR/RSC 对比；服务端组件可以是 async；`'use client'` 标记模块边界并影响其导入；客户端组件不能导入服务端组件，但可通过 children 接收；props 必须可序列化；`'use server'` 不标记服务端组件；RSC Payload 不是 HTML。
- mini-react：createElement 返回普通对象；渲染器示例可运行（`dom.style = 'color: teal'` 在浏览器中有效）；Hook 按调用顺序存储（实际是 Fiber 上的链表）；渲染阶段不改 DOM，提交阶段同步完成；Scheduler 与 requestIdleCallback 的说明；练习中展开 null 是安全的。
- engineering：`npm create vite@latest my-app -- --template react-ts` 命令正确；TS `React.ComponentProps<'button'>` 用法；RTL + user-event 测试示例（直接调用 `userEvent.click` 在 v14 中仍可用）；RTL 理念的 quiz。
