# 讲解质量复评（第 10 版）：《React 从零到专家》（2026-10-06）

复评范围与上一轮相同：概念讲解与心智模型、示例代码的教学质量、预测题是否仍被剧透、中文文字质量与 STE 风格、术语一致性、视觉与信息结构。上一轮报告：review/edu-explanation.md（8/10）。

本轮做法：
- 通读 src/ 下全部课程数据（lessons-1~5.js、lessons-6-*.js、lessons-predict.js、glossary.js、lessons-6-order.js）和 app.js 的渲染逻辑，不依赖修改说明。
- 写脚本在 Node 里加载 37 课数据，统计每课的字数、H2 数、“选读”数、步骤段落写法、“第 N 课”引用是否指向正确的课、术语表“不使用的说法”在课文中的出现。
- 用 Playwright 打开 v10.html：逐个检查 19 个预测题演示的可见代码、说明（note）是否在预测前隐藏；检查“选读”折叠；检查桌面与 390px 宽度下的表格和流程图；检查文档模式。

---

## 1. 总评

**总分：8.5 / 10（上一轮 8）。**

这一轮改写的方向是对的，而且改得细：useEffect 课从“同步”模型讲起并把表格降为“从结果上看”；React 19 课有了“一次提交要管 4 件事”的主线和“它解决了 18 里的什么麻烦”；Server Components 课补了“水合 / RSC Payload”的先行定义和 6 步流程图；19 个预测题的代码、按钮、console 字样全部中性化，说明只在预测后显示；学习目标 116 条全部改成“能……”；每课新增 3–5 条参考要点；课号引用 46 处全部核对无误；术语 setState / setter / 真相来源 / 通过属性 全部清零；5 课补了“你可能看到的报错”。

剩下的问题集中在两处：① **视觉层的一个硬伤**：build.py 生成的页面没有 `<!doctype html>` 和 `<meta name="viewport">`，页面运行在怪异模式，在真实手机上所有响应式 CSS 都不会生效（见 N1）；② **信息结构的旧问题基本没动**：步骤仍用 `<p>` 里的 `<br>1.` 冒充列表（28 处），标题只有一级，序号风格 7 种并存。

| 分项 | 上一轮 | 本轮 | 依据 |
|---|---|---|---|
| 概念讲解与心智模型 | 8.5 | 9 | useEffect 同步模型成为主线；React 19 有了“为什么”；Server Components 有图有定义；遥控器比喻改对了。残留：遥控器比喻现在用于两个概念；profiling 课标题“四个步骤”对应的图只有三步 |
| 示例代码的教学质量 | 8 | 8.5 | 预测题剧透基本清除（19/19 说明隐藏，代码中性）；迷你 useQuery 的依赖数组有了解释。残留：state-architecture 代码注释仍提示答案；迷你路由仍是数组路由表 |
| 中文文字质量（含术语） | 7.5 | 8.5 | 术语表执行到位，新写的课文短句、主动语态、编号步骤都保持住了。残留：“可访问性”“缓存（指记忆化）”“销毁”“重渲染”各几处；“18 里”作 React 18 的缩略出现 12 次 |
| 视觉与信息结构 | 7 | 7 | 加分：选读折叠、参考要点、先修说明、课时重估。减分：无 doctype / viewport（新发现）；`<br>1.` 步骤、单级标题、序号风格不统一都未改；术语首次标注可能落在折叠的选读里 |

---

## 2. 上一轮问题逐条核实

### 高

#### H1. 预测题演示剧透 —— 已解决

用 Playwright 在新浏览器上下文里打开含预测题的 17 课，读取 19 个 PREDICT 框的编辑器内容和 DOM 状态，结果全部为：`noteHidden=true`、预测卡片存在、预览区隐藏。代码中原来的剧透全部改掉，证据：

| 预测题 | 上一轮剧透位置 | 现在 |
|---|---|---|
| state｜失败的计数器 | 按钮文字“（不会变！）” | `点击了 {count} 次`（lessons-1.js:366） |
| use-effect｜三种 effect | console 写“只在挂载时执行一次” | `'effect ②（依赖 []）'`（lessons-2.js:42） |
| events｜事件对象与冒泡 | “外层 div 收到点击（冒泡）”“按钮：会冒泡” | “按钮 A / 按钮 B”，日志文字中性（lessons-1.js:561–564） |
| lists-keys｜两列只差 key | 小标题 ❌/✅ | “左列 key=index / 右列 key=id”（:801、:805），题干本身就说明左列是 index |
| rendering｜状态跟着位置走 | h4 写“状态保留 / 丢失” | `<h4>情况 1</h4>` 等（lessons-3.js:88–92） |
| performance｜哪个 memo 生效了 | label “传入内联函数 / 全部稳定引用” | “Child 1/2/3”（:243–245） |
| closures｜计数器卡在 1 | JSX “（永远停在 1）”和注释 | 代码无注释，标题被 predict.title 覆盖为“这个计数器会怎样？”（lessons-predict.js:55，实测标题正确） |
| suspense｜错误边界 | `<p>` 写结论 | 结论移到 note（lessons-3.js:721） |
| concurrent｜useTransition | 注释“可以被打断 / 必须一次做完” | `// 勾选时 / // 未勾选时`（:914–915） |
| state-architecture｜Zustand | `// 只订阅 bears` | 已删 |
| tanstack-query｜迷你 useQuery | 注释“去重：同一个 key 只发一次”、`<p>` | `// ① 这个 key 已有 promise 时`（lessons-5.js:486），结论进 note |
| escape-hatches｜Portal | 预测题前一段写结论 | 前一段改为“先预测，再运行”（lessons-6-escape.js:161），结论在 note（:196） |

两处轻微残留（不影响判定）：
- state-architecture 演示里仍有注释 `// 返回一个 Hook，支持 selector 只订阅需要的部分`（lessons-4.js:225），读到这行基本能推出“只有 HoneyPot 渲染”。
- profiling 课预测题前一段（lessons-6-profiling.js:57）正文已经写了“actual 接近 base：记忆化没有生效 / actual 远小于 base：大部分组件被跳过”，预测题问的正是这个。这是讲解顺序造成的，可把这段移到演示之后。

#### H2. useEffect 课先教生命周期表再否定 —— 已解决

lessons-2.js:18–27 新顺序：H2“effect 描述一次同步”→ 两个问题（开始 / 停止）→ 带注释的骨架代码 → “依赖数组不是你挑的……都没变 / 有一个变了”→ 一句话交代“挂载时执行”是 class 组件的说法。表格降级为“从结果上看：三种依赖写法”（:28、:57–61），第二行改成“effect 不读任何会变的值，所以第一次渲染后同步一次就够了”。演示 console 改为 `effect ①（没有依赖数组）` 等。测验第一题正确项改为“第一次渲染后运行，之后不再重新同步”（:137），第二、三题考“先停止旧同步再开始新同步”（:138–139）。练习提示也用同步语言（:165）。keyPoints 第 4 条明确“`[]` 的意思是……不是‘我想只执行一次’”（:12）。整课与 react.dev“Lifecycle of Reactive Effects”一致。

#### H3. 阶段 2 重排后的前向依赖 —— 已解决

- useRef 课（第 13 课）秒表演示不再用 useEffect（lessons-2.js:404–431），改为正文一句“这个秒表还差一件事：组件从页面上消失时，定时器也该停下。这需要第 14 课的‘清理函数’。学完那一课，可以回来补上”（:432）。写法很好：既不前跳，又埋了回看的钩子。
- Context 课（第 12 课）购物车示例直接 `useContext(CartContext)`（:634、:639、:655），`useCart` 封装移到“深入一点”并注明“第 15 课会讲它，学完可以回来看这个写法”（:658）。
- 复核全部 37 课的前后引用：第 N 课 46 处全部指向正确的课（脚本输出见本报告附注）。

#### H4. 毕业设计课课号错误 —— 已解决

lessons-5.js:1577–1597 全部核对：第 8 课=表单、第 32 课=TypeScript、第 22 课=Suspense、第 20 课=性能优化、第 24 课=性能测量、第 28 课=React 19、第 11 课=useReducer、第 29/36 课=Server Components / Next.js、第 27 课=状态架构、第 35 课=测试、第 17 课=异步搜索……无一错误。但 build.py 没有加课号校验，下次重排仍可能出错（见建议 5）。

### 中

#### M1. 术语一致性 —— 部分解决（主要问题已清零，残留 4 类）

已清零（全文 grep，排除代码标识符）：`setState` 作为概念 0 处（仅剩 mini-react 的变量名和 `this.setState`）、`setter` 0 处、“真相来源 / 单一数据源” 0 处、“通过属性传入” 0 处。术语表新增“唯一数据源”条目（glossary.js:8），课文统一用它（lessons-1.js:905、lessons-2.js:209、:254 等）。

残留：
- “可访问性”仍出现 2 处（术语表规定用“无障碍”）：lessons-4.js:94 patterns 课“其他设计原则”；lessons-6-escape.js:205。
- “缓存”用于记忆化（术语表：缓存只用于数据请求）：lessons-3.js:213 `// useMemo：缓存“计算结果”`、:216、:249 H2“useMemo 缓存昂贵计算”；lessons-6-checks.js 的 performance 读代码题也用“用 useMemo 缓存”。
- “销毁”（术语表：用“卸载”）：lessons-1.js:817、lessons-3.js:72、:103。
- “重渲染”（术语表：用“重新渲染”）：lessons-2.js:664 测验选项。
- 新矛盾：术语表“组件”条目的不使用说法含“控件”，而无障碍课按正确含义（form control）用了“控件”9 次（lessons-6-a11y.js:14、:61、:62、:205 等）。应给“控件（control）”单独立条，或把它从“组件”的禁用词里删掉。

#### M2. 两个误导性比喻 —— 部分解决，改出一个新问题

- 遥控器比喻已按建议改写（lessons-2.js:260）：“遥控器只有一个，放在客厅……对客厅喊一声‘换到 5 台’（调用回调）。电视显示什么（props），由客厅那个遥控器决定”。现在与单向数据流一致。
- 银行柜台不再重复：useImperativeHandle 改成“电视机的遥控器。遥控器上只有几个键……电路板怎么接，你看不到也碰不到”（lessons-6-escape.js:79）。
- 新问题：**“电视遥控器”现在同时用于状态提升（第 10 课）和 useImperativeHandle（第 16 课）**。两次映射的属性不同（“只有一个、放在共同的地方” vs “只有几个键”），但同一物体绑定两个概念，正是上一轮 M2 反对的做法。建议把 useImperativeHandle 换成“前台只受理几项业务”之外的另一个物体，例如“自动售货机只给你几个按钮，机器内部你碰不到”。

#### M3. React 19 课缺“为什么” —— 已解决

lessons-4.js:465–471 开头加了对照表“要管理的事 / React 18 的写法 / React 19 的 API”，四行分别是 pending、错误和结果、成功后重置、乐观值；之后每个 H2 下都有一段“**它解决了 18 里的什么麻烦：**”（:474、:495、:517、:520、:605）。React 18 模拟演示标题改为“用 React 18 模拟乐观更新的效果”，前一段明确“代码写法和 useOptimistic 不同。演示后面有逐行对照”（:541）；演示代码用 ①②③ 标注，紧随其后的 useOptimistic 版本用“对应 ①/②/③”注释逐行对应（:585–592），并说明“await 之后的 set 函数调用不再属于这个 Action，所以 ② 要再包一层 startTransition”（:603），这一点与 React 文档一致。19.2/19.3 表加了“它解决了 18 里的什么麻烦”列（:648）。

残留：19.2/19.3 表仍是 8 行 4 列的发布说明，没有标“选读”；390px 宽度下第 4 列要横向滚动才能看到（实测表格 scrollWidth 504 / clientWidth 340）。

#### M4. Server Components 课没有图 —— 已解决（无演示这一点未变）

- “水合”和“RSC Payload”在课首单独定义（lessons-4.js:680–681），先于表格出现。
- 新增 6 步流程图 fig（:689）：请求 → 运行服务端组件（RSC Payload）→ SSR → 显示 HTML → 下载 JS → 水合，图注说明“② ③ 在服务器上进行，④ ⑤ ⑥ 在浏览器里进行。服务端组件只参与 ② 和 ③，所以它不需要水合”。桌面 3×2、手机单列，实测均无溢出。
- 学习目标第 1 条改为“能按顺序说出一次页面请求经过的步骤”，与图对应。
- “哪些文件要 'use client'”做成了测验第 3 题（:773），没有做成预测题；本课仍无可运行演示。可接受。

#### M5. 生态课迷你实现与目标错位 —— 部分解决

- 迷你路由的 note 明确“这是原理演示。真实项目从 react-router 导入……迷你版和真库有三点不同：1. 路由表用数组传入……2. 不支持嵌套路由和 Outlet；3. 不同步浏览器地址栏”（lessons-5.js:372）。学习目标里去掉了“嵌套路由”（:240–245），与可运行内容对齐。
- 迷你 useQuery 的 `[key]` 依赖有了专门一段解释（:474）：“依赖规则没有消失，它搬到了 queryKey 上……queryFn 每次渲染都是新函数，写进依赖会让 effect 每次渲染都重新执行”，代码行也加了注释（:503）。解释正确，且顺带复习了第 14 课。
- 未做：迷你路由没有改成 `<Routes><Route/></Routes>` 形态，仍与真实 API 不同。

#### M6. 长课篇幅与时长 —— 部分解决

- 三课 mins 已重估：escape-hatches 18→35、profiling 16→30、accessibility 18→30；首页总时长由 11.1 小时变为 14 小时（实测首页显示“14 小时（估算，含练习）”，842 分钟）。
- 次要小节折叠为“选读”：escape 1 节（flushSync）、profiling 3 节（Performance 面板、Web Vitals、React Compiler）、a11y 2 节（减少动画、怎样检查）。实测 `details.optional` 默认收起，摘要显示“选读 + 标题 + 可以先跳过”。
- 不一致之处：没有重新评估的课里，react-19（18 分钟，正文 2375 字 + 7 个代码块 + 1 演示 + 2 表）和 server-components（15 分钟，2101 字 + 5 代码块 + 3 表 + 流程图）的密度比 escape-hatches 还高，却仍是最短的标注之一；portfolio 15 分钟（2594 字）同理。按每课正文字数与 mins 的比值，这三课是 37 课中最“赶”的。

#### M7. 信息结构（步骤列表、标题层级、序号风格）—— 未解决

- `<p>` 里用 `<br>1.<br>2.` 冒充步骤列表的写法仍有 28 处（lessons-1.js 3、lessons-2.js 2、lessons-3.js 4、lessons-4.js 2、lessons-5.js 8、lessons-6-profiling.js 5、checks 2）。新写的内容反而用了更好的 `<ol class="task-steps">`（profiling :28、:130；a11y :123、:227；portfolio :1620），两种写法在同一课里并存（profiling 课：录制步骤是 ol，“怎样读这两个数字”和 Performance 面板录制步骤是 `<br>1.`）。app.js:615 其实已能把以 `<ol` 开头的 html 渲染成块，缺的只是把这 28 处改写。
- app.js:614 仍把 `h` 固定渲染为 `<h2>`，没有 level 参数。profiling 8 个 H2、a11y 9 个、react-19 7 个，仍无分组。
- 序号风格仍有 7 种：“一、二、三”（escape）、“工具一/二/三”（profiling）、“模式一”（patterns）、“方式一”（conditional）、“用途一”（use-ref）、“第一原则/第一步”（a11y、mini-react）、“① ② ③”（fig）。

#### M8. 真实报错信息讲得少 —— 已解决

新增“你可能看到的报错”块，格式统一为“报错原文 → 原因 → 去看”：
- jsx：`Adjacent JSX elements must be wrapped…`、`Objects are not valid as a React child`（lessons-1.js:152）
- state：`Too many re-renders`（:442）
- lists-keys：`Each child in a list should have a unique "key" prop`（:816）
- forms：`A component is changing an uncontrolled input to be controlled`（:932）
- custom-hooks：`Rendered more hooks than during the previous render`（lessons-2.js:927）
五条建议全部落实，写法符合 STE（一句一事、动词开头的“去看”）。

### 低

- **L1 条件渲染课空标题 —— 已解决。** 合并为“方式二和方式三：三元运算符 ? : 与逻辑与 &&”（lessons-1.js:651–652）。
- **L2 STE 过头的几处 —— 已解决。** use-effect 开头改为列表式“例如：发网络请求、设定时器、订阅 WebSocket、修改 document.title”（lessons-2.js:16）；router 版本史移到“选哪种模式？”之后（lessons-5.js:395）；escape 课改为“这暴露得太多了”（lessons-6-escape.js:32）。
- **L3 语气与未解释术语 —— 部分解决。** O(n³) 已解释（lessons-3.js:71）；第 1 课提示加了“标注‘React 19’的示例只能阅读”（lessons-1.js:64）。mini-react 课“还记得吗？”仍在（lessons-4.js:791）。
- **L4 术语标注跳过标题 —— 未解决。** markTerms 逻辑未变（app.js:703），术语表页说明也未补。并且选读折叠带来一个新副作用，见 N4。

**统计：16 条中，已解决 9 条（H1、H2、H3、H4、M3、M4、M8、L1、L2），部分解决 5 条（M1、M2、M5、M6、L3），未解决 2 条（M7、L4）。**

---

## 3. 本轮新发现的问题

### 高

#### N1. 页面没有 `<!doctype html>` 和 `<meta name="viewport">`，运行在怪异模式，手机上响应式布局不生效

build.py:20–42 拼出的 HTML 以 `<title>` 开头，没有 doctype，也没有 viewport meta。实测：
- 桌面 Chromium：`document.compatMode === 'BackCompat'`，`document.doctype === null`。怪异模式下盒模型、表格字号继承、行高等行为与标准模式不同，目前靠 CSS 碰巧成立。
- 用 Playwright 的 `isMobile: true`、视口 390×844 打开任意课：`document.documentElement.clientWidth === 980`。也就是说在真实手机上，页面按 980px 排版再缩小显示，style.css:354–368 的 `max-width: 860px / 480px` 媒体查询全部不触发：侧栏不收起、汉堡按钮不出现、演示框双栏并排、字号极小。
- 上一轮我写“手机端可读”，当时用的是桌面模式缩窄窗口，没有模拟真机，这一条是我上一轮漏掉的。

修法：build.py 的模板开头加 `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">`，然后在标准模式下重新过一遍桌面布局。

### 中

#### N2. profiling 课标题“优化的四个步骤”，图里只有三步

lessons-6-profiling.js:22 `h('优化的四个步骤')`，紧接着的 fig（:23）只有“① 复现 ② 测量 ③ 修改并再测量”。读者会找第四步。要么把“③ 修改并再测量”拆成“③ 修改 ④ 再测量”，要么改标题为“三个步骤”。

#### N3. 新 TV 遥控器比喻用于两个概念（见 M2）

#### N4. 术语的首次标注可能落在折叠的“选读”里

markTerms 对整个 prose 做“第一次出现”标注（app.js:701–720），不区分 `details.optional` 内外。实测 profiling 课：“长任务”“虚拟列表”的虚线释义都标在折叠的“工具三 / Web Vitals”里，正文“长列表：只渲染看得见的行”一节里的“虚拟列表”（本课主角之一）没有释义；escape 课“set 函数”“事件处理函数”的标注落在折叠的 flushSync 一节。跳过选读的读者看不到释义。修法：markTerms 先遍历 details 之外的节点，再遍历 details 内部；或对 details 内部单独再标一次。

#### N5. react-19、server-components、portfolio 三课时长未随密度重估（见 M6）

#### N6. “18 里”作为 React 18 的缩略出现 12 次

lessons-4.js:474、:495、:517、:520、:605、:622（×5）、:648。STE 要求用完整、固定的说法；“18 里”在读者第一次读到时要停一下才知道指 React 18（这一课同时在谈 19.2、19.3，数字很多）。改为“React 18 里”。

### 低

#### N7. 残留的轻微剧透（见 H1 残留两条）

#### N8. 术语表与课文的几处新摩擦（见 M1 残留）

#### N9. conditional 课（第 6 课）的测验第 3 题依赖第 15 课的知识

lessons-1.js:692 问“if (!user) return null 写在 useState 前面会怎样”，正确项是“Hook 数量变了，React 报错”。第 4 课只说“useState 要写在最上面，原因在第 15 课讲”，读者此时不知道“React 按调用顺序识别 Hook”。题目本身很好，但放在这里只能靠记规则作答。可以保留题目、把解析改成“原因第 15 课会讲，这里先记住规则”，或移到 custom-hooks 课。

#### N10. 新写的 keyPoints 与 goals 质量很高，但有两处可再紧

- react-19 keyPoint 2 一条里塞了 startTransition 和 useActionState 两件事（lessons-4.js:458），拆成两条更符合“一句一事”。
- server-components keyPoint 2 一条 70 字、三个句号（:673），是全部 keyPoints 里最长的，可拆。

---

## 4. 做得好的地方（新增）

1. **useEffect 课的“同步”主线贯穿到了练习和测验。** 练习的渐隐代码注释写“开始同步：启动……”“停止同步：返回一个清理函数”（lessons-2.js:173–174），测验三题都从“重新同步之前 / 组件消失时”出发。模型只有一套了。
2. **React 19 课的“对应 ①②③”对照是教学上最聪明的改法。** 读者先在能运行的 React 18 代码里看到三个步骤各自的效果，再在只读的 useOptimistic 代码里找到同一个序号，知道哪一步被 React 接管了（“对应 ③，不用自己写”）。
3. **“你可能看到的报错”块格式固定、措辞一致。** 五处都是“报错原文（英文）→ 原因：一句 → 去看：具体位置 + 改法”。这是 STE“同一类信息用同一种结构”的范例。
4. **参考要点（keyPoints）写得像要点卡而不是摘要。** 大多数条目以“问题 / 坑 / 做法”开头，每条一个动作，例如 tanstack-query：“最常见的坑：key 里漏了变量（切换 id 读到别人的缓存）；queryFn 里 fetch 失败不抛错（isError 永远是 false）”。
5. **Server Components 的图注把“服务端组件不需要水合”这一最难理解的点落在了图上**，而不是只在正文里说一遍。
6. **选读折叠的摘要文案（“可以先跳过，需要时再展开”）和紫色标签视觉上清楚**，三课的折叠都没有把必读内容误收进去（唯一可商榷的是 a11y 的“怎样检查”，它和毕业设计的验收清单直接相关）。

---

## 5. 剩余问题清单

**高**
- N1 无 doctype / viewport：怪异模式，真机上响应式失效（build.py:20）。

**中**
- M7 步骤用 `<br>1.` 冒充列表 28 处；标题单级；序号 7 种风格（app.js:614–615，各课）。
- M1 残留：可访问性 ×2、缓存（记忆化）×4、销毁 ×3、重渲染 ×1；“控件”与术语表冲突。
- M2 新问题：遥控器比喻绑定两个概念（lessons-2.js:260、lessons-6-escape.js:79）。
- N2 “四个步骤”对应三步图（lessons-6-profiling.js:22–23）。
- N4 术语首次标注落在折叠的选读里（app.js:701）。
- M6 / N5 react-19、server-components、portfolio 时长未按密度重估；19.2/19.3 表未标选读、手机上要横向滚动。
- M5 迷你路由仍是数组路由表。

**低**
- N6 “18 里”×12（lessons-4.js）。
- H1 残留：state-architecture 注释（lessons-4.js:225）、profiling 预测题前的解释段（lessons-6-profiling.js:57）。
- N9 conditional 测验第 3 题前向依赖（lessons-1.js:692）。
- L3 “还记得吗？”（lessons-4.js:791）。
- L4 术语表页未说明标题不标注。
- N10 两条过长的 keyPoint。

---

## 6. 优先级最高的 5 条改进建议

1. **给页面加 doctype 和 viewport（N1）。** build.py 模板第一行加 `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">`，再在标准模式下检查一遍桌面布局（怪异模式下的表格字号、行内块基线可能有变化）。这是一行改动、影响所有手机用户的问题。

2. **把 28 处 `<br>1.` 改成 `<ol>`，统一序号风格，给 `h` 加层级（M7）。** app.js:615 已支持以 `<ol` 开头的 p 块，只需在各课把 `p('…<br>1. …<br>2. …')` 改成 `p('<ol class="task-steps"><li>…</li></ol>')`；`h(text, level=2)` 允许 h3，让 profiling、a11y、react-19 的 7–9 个 H2 分成 2–3 组；序号统一为“第一步 / 工具一”这种“量词 + 中文数字”。

3. **术语收尾（M1）。** 全局替换：可访问性→无障碍；“useMemo 缓存”→“useMemo 记忆化”或“useMemo 保存计算结果”；销毁→卸载（“销毁整棵子树”改为“卸载整棵子树”）；重渲染→重新渲染；给“控件”立条或从“组件”的禁用词里删除。顺手把“18 里”改为“React 18 里”。建议把术语表的 avoid 列表做成 build.py 的禁用词检查（本轮我用脚本 5 分钟就查出了全部残留）。

4. **修两处讲解自相矛盾的小错（N2、M2）。** profiling 的“四个步骤”与三步图对齐；useImperativeHandle 换一个不与状态提升冲突的比喻。两处都是 1–2 句话的改动，但读者会在这里停下来怀疑自己。

5. **让 markTerms 跳过折叠内容，并补齐三课时长（N4、N5）。** markTerms 先标 `details` 之外的首次出现；react-19 改为 25 分钟并把 19.2/19.3 表标“选读”，server-components 改为 22 分钟，portfolio 维持 15 但说明“项目在课外完成”。同时在 build.py 加课号校验（解析“第 N 课”并与 LESSON_ORDER 比对），防止下次重排再出 H4 那类错误。

---

附注：本轮用到的脚本在 scratchpad/edu2/exp/（analyze.mjs：课程数据统计与术语扫描；pw.mjs / pw2.mjs：Playwright 检查预测题、选读、移动端与文档模式）。
