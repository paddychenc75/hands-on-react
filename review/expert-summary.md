# 专家审查汇总：质量与完整性（2026-10-04）

4 位 React 专家子代理分别审查了课程覆盖面、阶段 1–2、阶段 3–4、阶段 5。
明细见同一文件夹：
- [expert-coverage.md](expert-coverage.md)：覆盖面与课程顺序
- [expert-stage-1-2.md](expert-stage-1-2.md)：入门与 Hooks（56 条）
- [expert-stage-3-4.md](expert-stage-3-4.md)：渲染、性能与专家（26 条）
- [expert-stage-5.md](expert-stage-5.md)：生态与实战（31 条）

## 总体评价

- 心智模型讲得好：快照、位置决定 state、闭包、渲染与提交。
- “亲手实现”系列（迷你 React、迷你 Zustand、迷你路由）有特色。
- 主要短板：
  1. 很多练习的自动检查太松，错误答案也能通过。
  2. 部分示例本身有反模式（用下标做 key、reducer 里用 Date.now()）。
  3. 测验偏记忆题，干扰项太明显。
  4. 缺少专家必备主题：DOM 逃生舱、无障碍、性能测量、安全、表单进阶。

## 已完成的修改（已发布）

### 运行环境
- 改用 React 开发版。实验台现在显示 React 警告（缺少 key、受控输入框缺 onChange 等），常见警告附中文说明。
- 被错误边界接住的错误不再重复显示成“运行时错误”。
- 支持 `import { createPortal, flushSync } from 'react-dom'`，以及 `<Profiler>`。
- 预测题的选项顺序按题目打乱。原来 12 题里有 11 题答案是 B。
- 练习检查先去掉注释。把答案写在注释里不再能通过。
- 第 5 阶段测验通过后，提示去做毕业设计，而不是“进入下一阶段”。

### 新增 3 课（共 37 课）
| 课 | 位置 | 内容 |
|---|---|---|
| 15 DOM 逃生舱 | 自定义 Hook 之后 | forwardRef、useImperativeHandle、useLayoutEffect、createPortal、useId、flushSync；练习：用 Portal 做可访问的弹窗 |
| 21 性能测量 | 并发特性之后 | DevTools Profiler、`<Profiler>`、Performance 面板、Web Vitals、虚拟列表、React Compiler；练习：手写虚拟列表 |
| 23 无障碍 | 设计模式之后 | 语义化 HTML、可访问名称、表单标签、焦点管理、实时区域、减少动画；练习：可访问的折叠面板 |

课程中所有“第 N 课”的引用都已按新编号更新。

### 新增小节
- JSX 课：XSS 与 dangerouslySetInnerHTML、`javascript:` 链接。
- Server Components 课：Server Function 的安全规则、密钥不能进客户端、2025 年 12 月的 RSC 漏洞与修复版本；水合不匹配的原因与修法。
- React 19 课：表单进阶（FormData、字段错误、aria-invalid）；React 19.2 / 19.3 新特性一览。
- 组件课：组件纯度；State 课：Hook 不能放在 if 或提前 return 之后。
- useEffect 课：用“开始同步 / 停止同步”理解 effect；无限循环的坑。
- 渲染课：自动批处理与相同值跳过。
- 并发课：可运行的 useTransition 标签页演示。
- 生态课：Query 的常见坑、乐观更新回滚；Router 的模式选择、受保护路由、懒加载、刷新 404；MSW 2 与自定义 render；Next.js 的“数据从哪里来”。
- 作品集：完成标准清单、`VITE_` 变量是公开的、鉴权要用成熟的库、面试准备。

### 练习与测验
- 收紧了约 20 道练习的检查。每一条都用错误答案实测过，确认会被拒绝；合理的另一种写法仍能通过。
- 第一级提示改为“指方向”，不再直接给出答案。
- 替换了重复或过于简单的测验题，改成推理题；新增 4 道预测题。
- 修正示例中的反模式：key、id 生成、reducer 纯度、定时器清理、fetch 检查 `res.ok`、参考答案的无障碍属性。
- 新增术语：set 函数、Portal、浏览器绘制、无障碍、可访问名称、焦点管理、实时区域、Profiler、虚拟列表、长任务。

### 验证
- 37 课的全部示例在 Chromium 中运行，没有意外报错。
- 28 道练习的参考答案全部通过自动检查。

## 未做（需要时再定）

- 阶段测验只从课内测验抽题。专家建议每个阶段加 6–10 道只在阶段测验出现的读代码题。
- Router、TanStack Query、测试、Next.js 课没有动手练习。可以基于迷你版各加一道。
- 课程顺序：专家建议阶段 2 按 react.dev 的顺序排（状态提升 → reducer → Context → ref → effect）；3 个实战项目只用到阶段 1–2 的知识，可以提前到对应阶段末尾。
- 部分练习偏简单（闭包、迷你 React），专家给了更有挑战的替代练习。
- 课 25“工程化”和阶段 5 的 TypeScript、测试课有重复，可以改成“项目搭建与交付”。

## 2026-10-05 追加：上面“未做”的 4 项已完成

- 阶段测验：每次 10 题，5 道是只在阶段测验出现的读代码新题（共 49 道），5 道来自课内测验。
- Router、TanStack Query、测试、Next.js 课各加一道练习（测试课要求自己写测试，并能抓住两个有 bug 的版本）。
- 阶段 2 改为 react.dev 的顺序：状态提升 → useReducer → Context → useRef → useEffect → 自定义 Hook → DOM 逃生舱。
- 实战项目提前：待办应用放在阶段 1 末尾，异步搜索和看板放在阶段 2 末尾。相关文字和课号引用已更新。
- 32 道练习的参考答案全部通过自动检查。
