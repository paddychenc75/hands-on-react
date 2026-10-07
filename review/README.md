# 课程技术审查汇总（2026-10-04）

6 个子代理分阶段，把课程内容和官方文档逐条对照：react.dev、MDN、React Router、TanStack Query、Testing Library、Vitest、Next.js、DefinitelyTyped。
核对时的最新版本：React 19.2/19.3、@types/react 19.3.0、react-router 8.4.0、@tanstack/react-query 5.104、next 16.3.8。

明细（每条都有原文、问题、来源链接、建议改法）：
- [stage-1.md](stage-1.md)：入门 8 课
- [stage-2.md](stage-2.md)：Hooks 进阶 6 课
- [stage-3.md](stage-3.md)：渲染与性能 5 课
- [stage-4.md](stage-4.md)：专家 6 课
- [stage-5a.md](stage-5a.md)：生态 5 课（TS、Router、Query、测试、Next.js）
- [stage-5b-glossary.md](stage-5b-glossary.md)：实战 4 课、预测题、术语表、app.js 文案

## 结论

- 全部测验答案都正确。只有一道题的措辞有歧义（“反例”），已改。
- 全部 25 道练习的参考答案，修改后在浏览器里重新跑过测试，全部通过。
- 没有发现大面积的过时 API。没有 ReactDOM.render、class 组件或 TanStack Query v4 写法。
- 问题集中在三类：
  1. 示例代码跑不通，或行为与说明不符。
  2. 版本信息过时（Compiler、useEffectEvent、CRA、React Router v8、Next.js 16）。
  3. 术语表定义过窄（重新渲染、Hook、客户端组件）。

## 已修正（已发布到原链接）

| 位置 | 修正 |
|---|---|
| 术语表 | JSX 编译产物（jsx()/createElement）；重新渲染的触发条件；Hook 命名和调用位置；依赖数组用 Object.is 比较；action 区分三种含义；服务端组件和客户端组件定义；竞态的定义 |
| 第 2 课 JSX | 片段演示里的 `<> </>` 在页面上看不到，改为 `{'<></>'}`；createElement 改为“创建元素的函数调用”，测验选项同步；补充 aria-*/data-* 例外 |
| 第 5 课 事件 | 合成事件“所有浏览器行为一致”改为“遵循 DOM 标准并修复部分差异” |
| useEffect | 严格模式只在挂载时多跑一轮 effect |
| 状态提升 | 温度转换器输入华氏度时会被四舍五入改写。改为保存 `{ value, scale }` |
| Context | 补充 React 19 的 `<Ctx value>` 写法；测验选项改为“最近的上层 Provider” |
| 自定义 Hook | useFetch 补上 `res.ok` 检查（fetch 遇到 404/500 不会报错）；命名规则改为“use 加大写字母开头” |
| 渲染机制 | 差异在渲染阶段算出，不是提交阶段；“最少的改动”改为“需要的改动”；渲染时读写 ref 的演示加注释 |
| 性能优化 | React Compiler 1.0 已稳定；children 技巧只对“包裹组件自己的 state”成立 |
| 闭包陷阱 | useEffectEvent 已在 19.2 稳定，并写明两条限制 |
| Suspense | 补充数据加载的前提；错误边界补充 effect、SSR，以及 React 19 的两个例外 |
| 并发特性 | useDeferredValue 不等空闲，而是提交后立即后台渲染 |
| React 19 | use 不是 Hook；useOptimistic 必须在 Action 中调用 |
| Server Components | Client Component 不能连数据库；Server Action 改为 Server Function（并说明两个名字的关系） |
| 迷你 React | Fiber 本身不等于可中断；React 18 起只有过渡更新可中断 |
| 工程化 | CRA 已于 2025-02 正式弃用；Remix v2 已并入 React Router；补充 React Compiler 和 eslint-plugin-react-hooks v6 |
| TypeScript | `React.FormEvent` 已标记 deprecated，改为 `React.SubmitEvent`（已在 @types/react 19.3.0 源码中确认） |
| React Router | 当前是 v8，不再有 react-router-dom；loader/action 数据模式也支持；迷你路由不再声称“API 完全一致” |
| 测试 | 补上 Vitest 运行所需配置（jsdom、globals、jest-dom）；查询优先级补全；测试奖杯补上“静态检查”层；测验题干去掉歧义 |
| Next.js | Server Action 示例的返回值会被丢弃，改为不返回，并说明 useActionState；补上 db 导入；补充 Next.js 16 的 cacheComponents 模型；去掉 “v7” |
| 实战二 | 竞态时间线 700 ms 改为 600 ms，与模拟接口一致 |
| 实战三 | dispatch 放进 Context 的测验解析改为先讲“免去层层传递” |

## 未修改（可选，留给你决定）

- 第 4 阶段 React 19 课只讲 19.0。可加一段 19.2/19.3 新内容（`<Activity>`、`cacheSignal`、`<ViewTransition>` 等）。
- 可提醒读者及时升级 React 和框架版本（2025 年 12 月修复过严重的 RSC 安全漏洞）。
- 部分演示在模块顶层用计数变量。严格模式下计数会翻倍。只在说明里提示，没有改代码。
- 课程运行环境仍是 React 18.3.1。React 19 和生态库示例只能阅读，不能运行。这是原设计，没有改动。
