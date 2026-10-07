# 课程完整性审查：离“专家”还差什么（2026-10-04）

审查范围：`src/lessons-1.js` 到 `lessons-5.js`、`lessons-predict.js`、`app.js`。
对照标准：react.dev 的 Learn 和 Reference 目录、React 19.0–19.3 博客、资深 React 岗位的常见要求。
本报告只看**覆盖面和顺序**。技术准确性已在 [README.md](README.md) 中审查，这里不重复。

课号按 `LESSONS` 顺序计算（第 1 课 = `what-is-react`，第 34 课 = `portfolio`）。

---

## 一、现有内容地图

| 阶段 | 课号 | id | 主要内容 |
|---|---|---|---|
| 01 入门 | 1–8 | what-is-react, jsx, components-props, state, events, conditional, lists-keys, forms | UI = f(state)、JSX 规则、props/children、useState 与快照、不可变更新、事件与冒泡、条件渲染、key、受控表单 |
| 02 进阶 | 9–14 | use-effect, lifting-state, use-ref, context, use-reducer, custom-hooks | 依赖数组、清理、竞态、“你可能不需要 effect”、状态提升、ref 操作 DOM、Context 拆分、reducer、自定义 Hook |
| 03 高级 | 15–19 | rendering, performance, closures, suspense, concurrent | 触发/渲染/提交、协调与位置、memo 系列、Compiler 简介、过期闭包、useEffectEvent、lazy、错误边界、useTransition、useDeferredValue |
| 04 专家 | 20–25 | patterns, state-architecture, react-19, server-components, mini-react, engineering | 复合组件、受控/非受控双模式、状态分类、useSyncExternalStore、Actions、useOptimistic、use()、RSC 边界、迷你 React、工具链概览 |
| 05 生态与实战 | 26–34 | typescript, router, tanstack-query, testing, nextjs, project-todo, project-search, project-kanban, portfolio | TS 类型、React Router v8、TanStack Query、Vitest + RTL、Next.js App Router、三个实战、毕业设计 |

**强项**：
- 心智模型扎实：快照、位置与状态、闭包、渲染与提交，都有可运行的演示和预测题。
- “自己实现一遍”很多：迷你 React、迷你 Zustand、迷你路由、迷你 useQuery、迷你测试运行器。
- 状态分类（`state-architecture`）讲得清楚，接近资深水平。

**关键词扫描结果（在全部课程正文中出现 0 次）**：
`useId`、`useImperativeHandle`、`createPortal`、`dangerouslySetInnerHTML`、`XSS`、`<Activity>`、`<ViewTransition>`、动画、i18n、状态机、`useDebugValue`、`Children`/`cloneElement`、Storybook、monorepo、Web Vitals/INP、虚拟化库。
`useLayoutEffect` 只作为测验的干扰项出现一次（`lessons-3.js:634`）。

---

## 二、缺口清单（按优先级）

### A 级：必须补。缺了它们，“专家”这个说法站不住

#### A1. 组件纯度与 React 规则（Rules of React）+ 严格模式

- 现状：react.dev Learn 把 “Keeping Components Pure” 放在第一章。本课程只在 reducer 里讲纯函数（`lessons-2.js:601`），以及工程化课的一条要点（`lessons-4.js:698`）。严格模式只在 `lessons-2.js:120` 的“深入一点”里提到 effect 多跑一轮。
- 为什么必须：React Compiler（课程已推荐）、并发渲染、严格模式的双重调用，都以“渲染必须纯”为前提。不懂这一条，学员看不懂 Compiler 为什么跳过某个组件，也看不懂严格模式下的“两次渲染”。
- 放在哪里：扩展第 3 课 `components-props`，加一节“组件必须是纯函数”；在第 15 课 `rendering` 加一节“React 的三条规则与严格模式”。
- 大纲：
  - 纯函数的两条要求：同样输入得到同样输出；渲染时不修改外部变量。
  - 预测题：渲染中修改模块顶层计数变量，严格模式下数字为什么翻倍（课程演示里本来就有这个现象，可以直接利用）。
  - 严格模式做的三件事：双重渲染、effect 多跑一轮、ref 回调多跑一轮；只在开发环境。
  - 副作用该放哪里：事件处理函数优先，effect 最后。
  - 和 Compiler 的关系：违反规则的组件，Compiler 会跳过；eslint-plugin-react-hooks v6 会报出来。

#### A2. DOM 逃生舱：ref 转发、useImperativeHandle、useLayoutEffect、Portal、flushSync、useId

- 现状：`lessons-2.js:331` 说 forwardRef “专家阶段会讲”。但第 22 课（`lessons-4.js:409`）只用一句话说 React 19 不再需要它。运行环境是 React 18.3.1，学员**从没写过一次 forwardRef**。`useImperativeHandle`、`createPortal`、`useId` 完全没有。`useLayoutEffect` 只是干扰项。
- 为什么必须：弹窗、下拉菜单、提示框、表单组件库，每天都会用到这些 API。它们全部能在 18.3.1 中运行，可以做成可运行的演示。
- 放在哪里：新增一课 “DOM 逃生舱”，放在第 17 课 `closures` 之后（需要先懂渲染与提交，才能讲 useLayoutEffect 的时机）。
- 大纲：
  - 把 ref 传给自己的组件：React 18 用 `forwardRef`，React 19 直接用 `ref` prop；`useImperativeHandle` 只暴露 `focus()` 等少数方法。
  - `useLayoutEffect`：先测量、再绘制。演示：提示框在 `useEffect` 中定位会闪一下，换成 `useLayoutEffect` 就不闪。
  - `createPortal`：把弹窗渲染到 `body` 下。重点：事件仍按 React 树冒泡，不按 DOM 树冒泡（适合做预测题）。
  - `useId`：给 label 和 input 生成稳定的关联 id，SSR 下也一致。不要用它做列表 key。
  - `flushSync`：添加列表项后立刻滚动到底部。说明它很少需要。

#### A3. 无障碍（Accessibility）

- 现状：只有代码里零散的 `aria-selected`（`lessons-4.js:30`）、`role="img"`，以及测试课的 `getByRole`（`lessons-5.js:447`）。没有讲语义化标签、label 关联、焦点管理和键盘操作。
- 为什么必须：毕业标准写着“能给团队设计一个好用的公共组件”（`lessons-5.js:1171`）。不可访问的组件不算好用。很多地区还有法律要求（例如欧盟《无障碍法案》2025 年 6 月起生效）。
- 放在哪里：第 8 课 `forms` 加一节 “label 与错误提示”；新增一课 “无障碍组件”，放在第 20 课 `patterns` 之后。复用 A2 的 Portal 弹窗。
- 大纲：
  - 先用原生元素：`<button>` 而不是 `<div onClick>`；用户和读屏软件能“免费”得到键盘和角色。
  - label 关联：`htmlFor` + `useId`；错误提示用 `aria-describedby` 和 `aria-invalid`。
  - 焦点管理：弹窗打开时聚焦、Tab 键困在弹窗内、关闭后焦点回到触发按钮；Esc 关闭。
  - 动态内容：`aria-live` 通知“已保存”。
  - 验收方法：只用键盘走一遍；用 `getByRole` 写测试（和第 29 课呼应）；介绍 axe 等检查工具。

#### A4. 性能测量：Profiler 与 DevTools

- 现状：课程反复要求“先用 Profiler 测量”（`lessons-3.js:236`、`lessons-3.js:244`、`lessons-5.js:1171`、`lessons-5.js:1176`），还把它作为测验正确答案。但没有一处教学员**怎样**测量。
- 为什么必须：这是测验答案依赖、却从未教过的知识（先决知识缺失）。也是资深开发者和初级开发者的主要区别之一。
- 放在哪里：扩展第 16 课 `performance`，加一节“怎样测量”；或者新增一课 “性能诊断”，放在第 19 课 `concurrent` 之后。
- 大纲：
  - `<Profiler id onRender>` 组件：在 18.3.1 中可运行。演示：记录每次提交的 `actualDuration`，对比加 memo 前后。
  - React DevTools：Components 面板查看 props/state/hooks；Profiler 面板看火焰图和“为什么渲染”。
  - React 19.2 的 Chrome Performance Tracks：Scheduler 轨道和 Components 轨道。
  - 用户感知指标：INP、LCP；长列表用虚拟化（如 TanStack Virtual）。
  - 常见瓶颈清单：Context value 每次是新对象、在组件内定义组件、大列表、频繁输入。

#### A5. 安全：XSS 与服务端边界

- 现状：`dangerouslySetInnerHTML`、XSS 都是 0 次。服务端只讲了“Server Action 必须校验权限”（`lessons-5.js:614`、`lessons-5.js:642`）。
- 为什么必须：React 默认转义文本，学员容易以为“React 天然安全”。2025 年 12 月 RSC 出过严重漏洞；19.3 新增 Trusted Types 支持。专家必须知道边界在哪里。
- 放在哪里：第 2 课 `jsx` 加一条“要点”（`{}` 中的字符串会被转义）；第 23 课 `server-components` 加一节 “安全边界”。
- 大纲：
  - React 默认转义文本；`dangerouslySetInnerHTML` 绕过转义，必须先用 DOMPurify 等库清洗。
  - `href={userInput}` 可能是 `javascript:` 链接；只允许 http/https。
  - Server Function 是公开接口：校验输入（例如用 zod）、校验身份、不要信任客户端传来的 id。
  - 不要把密钥传给客户端组件：props 会被序列化发给浏览器；`server-only` 包。
  - 及时升级 React 和框架；了解 CSP 与 Trusted Types（19.3）。

### B 级：应该补。补上后课程更接近真实项目

#### B1. 状态结构设计与“用状态描述界面”

- 现状：单一数据源（`lessons-2.js:207`）、派生数据（第 31 课）有涉及。但没有系统讲 react.dev 的 “Choosing the State Structure” 和 “Reacting to Input with State”。实战二要求“完整的状态”（`lessons-5.js:784`），却没有先教方法。
- 放在哪里：扩展第 13 课 `use-reducer`，加一节“先列出界面状态，再写 reducer”。
- 大纲：
  - 五条原则：合并相关状态、避免矛盾、避免冗余、避免重复、避免深层嵌套（必要时扁平化）。
  - 用一个 `status: 'idle' | 'loading' | 'success' | 'error'` 代替多个布尔值。
  - 画出状态转换图：这就是有限状态机的思想；提到 XState 作为延伸阅读。
  - 存 id，不存对象副本（避免选中项和列表不同步）。

#### B2. 大型表单

- 现状：第 8 课只讲受控组件；第 22 课讲 `<form action>`；React Hook Form 只在表格里出现（`lessons-4.js:158`）。没有校验、非受控读取和多步表单。
- 放在哪里：新增一课 “表单进阶”，放在第 22 课 `react-19` 之后，或作为第 26 课 `typescript` 之后的生态课。
- 大纲：
  - 受控与非受控的取舍：大表单每次按键都渲染整张表；用 `FormData` 读取非受控字段。
  - 校验的三个时机：输入时、失焦时、提交时；先用浏览器原生校验（`required`、`pattern`）。
  - 模式（schema）校验：zod 一份规则同时用于客户端和 Server Function。
  - React Hook Form 的基本用法和它为什么快（非受控 + ref）。
  - 可访问的错误提示（和 A3 呼应）；提交中禁用按钮（`useFormStatus`）。

#### B3. React 19.1–19.3 新内容

- 现状：第 22 课只讲 19.0。已有审查也把它列为“未修改”（README 第 53 行）。
- 放在哪里：第 22 课 `react-19` 末尾加一节 “19.2 与 19.3”。全部只读。
- 大纲：
  - `<Activity mode="hidden">`：隐藏界面但保留 state，可以预渲染下一页。
  - `<ViewTransition>` 和 `addTransitionType`（19.3 稳定）：用浏览器 View Transition API 做进入、退出、共享元素动画。
  - Fragment ref（19.3）：给一组兄弟节点统一聚焦、监听、观察。
  - `useEffectEvent`（第 17 课已讲）、`cacheSignal`、Performance Tracks、部分预渲染。
  - `react-dom` 的 `browser()`（19.3）：让组件跳过服务端渲染。

#### B4. SSR 与水合错误

- 现状：水合只在第 23 课表格（`lessons-4.js:428`）和比喻里出现。没有讲水合不匹配的原因和修复。
- 放在哪里：第 23 课 `server-components` 加一节 “水合不匹配”。
- 大纲：
  - 什么是不匹配：服务端 HTML 和客户端第一次渲染结果不同。
  - 常见原因：`Date.now()`、`Math.random()`、`window`、`localStorage`、浏览器插件改了 DOM、非法嵌套（`<p>` 里放 `<div>`）。
  - 修复方法：两遍渲染（effect 后再显示客户端内容）、`useId`、`suppressHydrationWarning`（只用于时间戳等）、19.3 的 `browser()`。
  - 流式渲染与选择性水合：Suspense 边界决定哪块先可交互。

#### B5. 样式方案

- 现状：只有 `className`、内联 `style`（`lessons-1.js:123`），以及路线图里一个 “Tailwind”（`lessons-4.js:700`）。
- 放在哪里：扩展第 25 课 `engineering`，加一节 “样式方案怎么选”；或者放在 B7 拆出的新课里。
- 大纲：
  - CSS Modules：局部类名，零运行时。
  - Tailwind：原子类；和组件 variant 的组合（例如 `clsx`、`cva`）。
  - CSS-in-JS：运行时方案和 RSC 不兼容；零运行时方案的取舍。
  - 设计令牌（design tokens）和 CSS 变量：主题切换不需要重新渲染。
  - 组件库与无样式组件（Radix、React Aria）：自带无障碍行为。

#### B6. 错误处理与 class 组件阅读

- 现状：第 18 课的错误边界用 class 组件写（`lessons-3.js:452`），但课程从没讲过 class 组件的语法（state、`this`、生命周期）。这是“先用后教”。
- 放在哪里：第 18 课 `suspense` 加一个“读懂 class 组件”的小框（不用会写，能读懂即可）；同一课再加一节“生产环境的错误处理”。
- 大纲：
  - class 组件五分钟速读：`this.state`、`this.setState`、`render()`、三个常见生命周期与 Hook 的对应关系。
  - 错误边界的放置粒度：整页、路由、单个小部件。
  - 事件处理和异步代码中的错误：错误边界捕获不到，要自己 try/catch。
  - React 19 的 `createRoot` 选项：`onUncaughtError`、`onCaughtError`，接入 Sentry 等监控。

#### B7. 把第 25 课 `engineering` 拆开，并补上交付环节

- 现状：第 25 课同时讲建项目、TypeScript、测试、项目结构和“你的下一站”。紧接着第 26 课（TS）和第 29 课（测试）又完整讲一遍。路线图（`lessons-4.js:699`）出现在第五阶段之前，像是课程提前结束了。部署只在毕业设计里出现一次（`lessons-5.js:1166`）。
- 放在哪里：第 25 课改名为 “项目搭建与交付”，删去 TS 和测试小节（只留一句指向第 26、29 课）；“你的下一站”移到第 34 课 `portfolio`。
- 大纲：
  - Vite 项目结构、环境变量（`import.meta.env`，只有带前缀的变量会进入客户端包）。
  - ESLint（含 react-hooks v6 与 Compiler 规则）、Prettier、TypeScript 严格模式。
  - 构建与包体积：代码分割、分析包体积。
  - 部署：静态托管 vs Node 服务；SPA 路由的回退配置。
  - CI：每次提交运行类型检查、lint 和测试。

### C 级：可以补。作为延伸阅读或一节“深入一点”即可

| 主题 | 建议位置 | 说明 |
|---|---|---|
| 数据获取模式：瀑布流、预取、渲染时获取 | 第 28 课 `tanstack-query` 加一个“深入一点” | 解释为什么路由 loader 和 RSC 能消除瀑布流 |
| 动画 | B3 的 ViewTransition 一节，加一句 Motion 库 | CSS transition 足以覆盖多数场景 |
| 国际化（i18n） | 第 12 课 `context` 的练习可改成“切换语言” | `Intl` API、react-i18next；中文学员常需要 |
| 端到端测试 | 第 29 课 `testing` 末尾一段 | Playwright 已出现一次（`lessons-5.js`），可补一个最小示例 |
| 设计系统与 Storybook | 第 20 课 `patterns` 的“其他设计原则” | 组件文档、视觉回归 |
| monorepo 与工具链 | B7 新课的一个“深入一点” | pnpm workspace、Turborepo |
| `Children`、`cloneElement` | 第 20 课 `patterns` 的“了解历史” | 读旧代码时会遇到；说明为什么现在用 Context 代替 |
| `useDebugValue` | 第 14 课 `custom-hooks` 一句话 | 在 DevTools 中显示自定义 Hook 的值 |
| React Native | 不建议加 | 超出 Web 课程范围；第 25 课表格已指路 |

---

## 三、顺序与先决知识问题（具体位置）

| # | 位置 | 问题 | 建议 |
|---|---|---|---|
| 1 | `lessons-2.js:119`（第 9 课） | “props 变化时重置状态：给组件换一个 key”。但 key 能重置状态这件事，到第 15 课才解释（`lessons-3.js:65`–`87`）。 | 第 9 课加一个指向第 15 课的说明；或在第 7 课 `lists-keys` 先提一句“key 变了，组件会重新创建”。 |
| 2 | `lessons-2.js:120`（第 9 课） | 严格模式只出现在“深入一点”，之后没有正式讲解。 | 见 A1。 |
| 3 | `lessons-3.js:236`、`244`；`lessons-5.js:1171`、`1176` | Profiler 是测验正确答案，但从没教过用法。 | 见 A4。 |
| 4 | `lessons-3.js:452`（第 18 课） | 用 class 组件写错误边界，class 语法从没教过。 | 见 B6。 |
| 5 | `lessons-3.js:634`（第 19 课） | 测验干扰项 `useLayoutEffect` 从没讲过。干扰项本身没错，但学员无法判断它“为什么错”。 | 见 A2；或换成已学过的 Hook。 |
| 6 | `lessons-2.js:331` → `lessons-4.js:409` | 第 11 课承诺“专家阶段会讲” forwardRef，第 22 课只用一句话带过。运行环境是 18.3.1，学员无法练习 React 19 写法。 | 见 A2。 |
| 7 | `lessons-4.js:658`–`700`（第 25 课） | TS 和测试的简介，出现在完整的 TS 课（26）和测试课（29）之前；“你的下一站”放在第五阶段之前。 | 见 B7。 |
| 8 | 第 31–33 课（`lessons-5.js:648`、`782`、`915`） | 三个实战只用到第一、二阶段的知识（state、表单、effect、reducer、Context），却排在 Next.js 之后。练习被集中在课程末尾，与课程的“间隔练习”设计不一致。学员在第一阶段学完后，要隔 22 课才做综合练习。 | 把实战一移到第 8 课之后（阶段 01 结尾），实战二、三移到第 14 课之后（阶段 02 结尾）。如果担心改动阶段测验，至少在阶段 01、02 结尾加链接“现在可以做实战一/二”。 |
| 9 | 第 21 课 `state-architecture`（`lessons-4.js:156`） | 推荐 TanStack Query，但第 28 课才教。 | 可以接受（先给地图，后给细节）。加一句“第 28 课会动手用”。 |
| 10 | 第 26 课 `typescript` | TS 放在第五阶段开头，此前 25 课都是 JS。真实项目基本都是 TS。 | 保持现状可以接受（运行环境不支持 TS）。建议在第 20 课 `patterns` 之后，每课加一个“TS 写法”小框，做到交错练习。 |

---

## 四、重复或可以合并的内容

- **第 25 课与第 26、29 课重复**：TypeScript 和测试各讲了两次。见 B7。
- **“自己实现一遍”数量偏多**：迷你 React（24）、迷你 Zustand（21）、迷你路由（27）、迷你 useQuery（28）、迷你测试运行器（29）。前三个价值高。迷你测试运行器帮助不大：学员更需要多写几个真实测试。建议把第 29 课的这部分缩成“深入一点”，省下的时间用来练 `getByRole` 和异步查询。
- **竞态处理讲了三次**：第 9 课、第 14 课 useFetch、第 32 课实战二。作为间隔复习是合理的。但第 32 课可以升级为 `AbortController` 真正取消请求（目前只在 `lessons-5.js:799` 提了一句），避免学员觉得在重复。
- **Render Props 与 HOC**（`lessons-4.js:75`）：定位为“了解历史”，篇幅合适，不用改。

---

## 五、建议的新顺序（只列有变化的部分）

```
阶段 01：1–8 不变（第 3 课加“纯函数”，第 8 课加 label）
          → 实战一（原第 31 课）
阶段 02：9–14 不变（第 13 课加“状态结构”）
          → 实战二、实战三（原第 32、33 课）
阶段 03：15 rendering（加 React 规则与严格模式）
          16 performance（加“怎样测量”，或单独成课）
          17 closures
          新课：DOM 逃生舱（A2）
          18 suspense（加 class 速读和生产错误处理）
          19 concurrent
阶段 04：20 patterns
          新课：无障碍组件（A3）
          21 state-architecture
          22 react-19（加 19.2/19.3）
          新课：表单进阶（B2）
          23 server-components（加水合错误、安全边界）
          24 mini-react
          25 项目搭建与交付（原 engineering 改写，B7）
阶段 05：26 typescript、27 router、28 tanstack-query、29 testing、30 nextjs
          34 portfolio（接收原第 25 课的“你的下一站”）
```

新增 3 课，总数 37 课。如果想保持 34 课：把 A3 并入 A2 新课（同一个弹窗例子讲 Portal 和焦点管理），把 B2 并入第 22 课。

---

## 六、对学习设计的提示

- 新课全部可以沿用“先预测、再运行”。好题目举例：
  - Portal 里的点击事件，会不会触发外层 `div` 的 `onClick`？（会。按 React 树冒泡。）
  - 严格模式下，渲染中 `count++` 的模块变量最后显示几？（翻倍。）
  - `useEffect` 和 `useLayoutEffect` 定位的提示框，哪个会闪？
- A2、A3、A4 的演示都能在 React 18.3.1 中运行。B3 和 B4 只能阅读。
- 术语保持一致：建议在 `glossary.js` 新增“纯函数”“严格模式”“水合不匹配”“传送门（Portal）”“无障碍”。每个概念只用一个中文词。

---

## 参考

- react.dev Learn：Describing the UI（含 Keeping Components Pure）、Managing State（含 Choosing the State Structure、Reacting to Input with State）、Escape Hatches。
- react.dev Reference：Rules of React；`<Profiler>`、`<StrictMode>`、`<Activity>`、`<ViewTransition>`；`createPortal`、`flushSync`；`useId`、`useLayoutEffect`、`useImperativeHandle`。
- React 博客：React 19.2（2025-10-01）、React Compiler v1.0（2025-10-07）、RSC 安全公告（2025-12-03、2025-12-11）、React 19.3（2026-09-09）。
