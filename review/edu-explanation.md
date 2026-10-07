# 讲解质量审查：《React 从零到专家》（2026-10-05）

审查范围：概念讲解与心智模型、示例代码的教学质量、中文文字（STE 风格）、视觉与信息结构。不重复技术正确性问题（见 README.md、expert-summary.md）。

细读课程（每阶段至少 2 课）：
- 阶段 1：what-is-react、jsx、state、events、conditional、lists-keys、forms
- 阶段 2：use-effect、lifting-state、use-ref、context、use-reducer、custom-hooks、escape-hatches
- 阶段 3：rendering、performance、closures、suspense、concurrent、profiling
- 阶段 4：patterns、accessibility、state-architecture、react-19、server-components、mini-react
- 阶段 5：typescript、router、tanstack-query、testing、nextjs、project-search、project-kanban、portfolio

另外核对了 lessons-predict.js、glossary.js、lessons-6-order.js、app.js 的渲染逻辑，并在 Chromium 中查看了 state、use-effect、server-components 三课的桌面与手机布局。

---

## 1. 总评

**总分：8 / 10。** 这是一套讲解水准明显高于平均的中文 React 课程。它的核心优势是：几乎每个关键概念都先给出"为什么"（失败的计数器 → useState；父组件渲染带动子组件 → memo；递归 render 不可中断 → Fiber），再给出可运行的最小演示，最后用预测题、测验、练习和"用自己的话讲一遍"闭环。心智模型（快照、状态跟着位置走、渲染 ≠ 提交、effect 是同步、key 是身份证）与 react.dev 一致，没有误导性的简化。

主要短板集中在四处：① "先预测再运行"的设计被演示代码里的注释和标签大面积剧透；② useEffect 课先教生命周期表、后否定它，示例和测验又把生命周期模型强化回来；③ 阶段 2 重排后留下了前向依赖和错误课号；④ 术语表定的规则（"set 函数"、"属性"只指 attribute）课文自己没有完全遵守。

| 分项 | 分数 | 依据 |
|---|---|---|
| 概念讲解与心智模型 | 8.5 | 为什么→怎么做的顺序贯彻得好；比喻绝大多数恰当；useEffect 课的模型顺序和一个比喻（遥控器）有问题 |
| 示例代码的教学质量 | 8 | 示例最小、聚焦、可运行，演示与正文配合；但预测题被代码剧透，生态课的"迷你实现"与学习目标错位，常见报错信息讲得少 |
| 中文文字质量 | 7.5 | STE 执行到位，短句、主动语态、编号步骤，几乎没有翻译腔；术语一致性有漏洞，少数地方碎片化 |
| 视觉与信息结构 | 7 | 页面结构清晰、手机端可读；但标题只有一级，步骤列表常用 `<p>` + `<br>` 冒充，新增三课篇幅是旧课的 3 倍而标注时长相同 |

---

## 2. 主要优点（有证据）

1. **先"为什么"再"怎么做"是课程的默认结构。**
   - state 课先让读者运行一个失败的计数器（lessons-1.js:307–318），再给出两条失败原因，然后才引入 useState："`useState` 解决这两个问题。第一，React 替你保存这个值……第二，你得到一个 set 函数"（:320）。
   - performance 课开头："上一课我们知道：父组件渲染会带动所有子组件渲染。大多数时候这很快，不用担心。但如果某个子组件渲染代价很高……就值得优化了"（lessons-3.js:163），再讲 memo。
   - mini-react 第四步："上面的 render 是递归的，一旦开始就必须一口气做完……Fiber 架构为解决这个问题打下了基础"（lessons-4.js:674）。
   - profiling 课开篇即立场："所以优化的第一步永远是测量"（lessons-6-profiling.js:8），并用四步流程图固定方法。

2. **心智模型准确，而且被反复串联。** "一次渲染 = 一张快照"在 state 课建立（lessons-1.js:337–338），在 closures 课复用（lessons-3.js:321–343），在 mini-react 课用 20 行 useState 实现解释（lessons-4.js:633–672）。"状态跟着位置走"在 rendering 课演示（lessons-3.js:66–89），在 mini-react 课给出 Fiber 层面的原因（:672）。这种跨课回指是记忆模型最有效的方式。

3. **比喻普遍贴切、不越界。** 命令式/声明式 = 指路/说目的地（lessons-1.js:48）；渲染/提交 = 厨师做菜/服务员上菜，并明确"只做计算，可以重做"（lessons-3.js:12）；state 像公告栏、ref 像私人口袋（lessons-2.js:334）；错误边界像保险丝（lessons-3.js:518）；读屏软件像"通过电话帮你看网页的朋友"，只能读角色、名字、状态（lessons-6-a11y.js:15）。每个比喻都只映射一个属性，没有过度延伸。

4. **示例最小且聚焦一个点，演示与正文说明配合。** "哪个 memo 生效了？"用三个 Child 分别隔离"内联函数、内联对象、全部稳定"三个变量（lessons-3.js:179–207）；"状态跟着位置走"用三种情况并列（lessons-3.js:68–89）；useLayoutEffect 演示用 `slow(300)` 放大闪烁，让肉眼能看到（lessons-6-escape.js:87–139）。练习的第一级提示"指方向"而不给答案，例如："分两步想：哪个数组方法能'留下'一部分元素？哪个能把每一项'变成'一个 `<li>`？"（lessons-1.js:733）。

5. **常见误区覆盖广，且给出错误写法与正确写法的对照。** `onClick={handleClick()}`（lessons-1.js:469）、`0 && x` 渲染出 0（:580–590）、`user.age++; setUser(user)`（:387）、`value` 没有 `onChange` 变只读（:765）、组件内定义组件（lessons-3.js:90）、实时区域必须先存在（lessons-6-a11y.js:197）、`{saved && <p role="status">}` 不会被播报（quiz :244）。

6. **STE 风格落实得很自然。** 短句、一句一事、主动语态、编号步骤到处可见，而且没有牺牲可读性。例如 forms 课："输入框只做两件事：显示 state；值变化时通知我们。这就叫受控组件"（lessons-1.js:749）。全文只出现 1 次"实际上"，没有"值得注意的是""换句话说"这类翻译腔。

7. **学习闭环设计到位。** 预测题（19 道，选项已打乱）、课内测验、练习（含收紧后的自动检查）、课前热身（间隔复习）、"用自己的话讲一遍"后对照学习目标自查（app.js:652–668）。这些是被研究验证的学习策略，在国内教程里少见。

---

## 3. 问题清单（按严重度）

### 高

#### H1. "先预测再运行"的演示，答案写在代码里

app.js:319–321 把 `note` 藏到预测之后才显示，设计意图正确。但代码本身始终可见，而 19 个预测题演示里，至少 12 个在注释、按钮文字、console 字符串或小标题里直接写出了答案：

| 预测题（lessons-predict.js） | 剧透位置 | 原文 |
|---|---|---|
| `state\|失败的计数器`：点 3 次显示几？ | 按钮文字 lessons-1.js:316 | `点击了 {count} 次（不会变！）` |
| `use-effect\|观察三种 effect`：打字时哪些执行？ | console 字符串 lessons-2.js:32、36 | `'① 每次渲染后都执行'`、`'② 只在挂载时执行一次'` |
| `events\|事件对象与冒泡`：新增几条日志？ | 按钮文字 lessons-1.js:483、486 | `'外层 div 收到点击（冒泡）'`、`按钮：会冒泡` |
| `lists-keys\|index 当 key`：左列会怎样？ | 小标题 lessons-1.js:686、690 | `❌ key=index` / `✅ key=id` |
| `rendering\|状态跟着位置走`：哪些保留？ | `<h4>` 文字 lessons-3.js:81、83、85 | `情况 1：同位置同类型，状态保留`、`情况 2：……状态丢失` |
| `performance\|哪个 memo 生效了？` | 按钮 label 与注释 lessons-3.js:195–204 | `传入内联函数`、`全部稳定引用`、`// 每次都是新函数` |
| `closures\|计数器卡在 1`：几秒后数字是？ | JSX 与注释 lessons-3.js:353、359 | `{count}（永远停在 1）`、`// ❌ 这个回调创建于第一次渲染，它看到的 count 永远是 0` |
| `suspense\|错误边界隔离故障` | `<p>` lessons-3.js:513 | `每个计数器都有自己的错误边界，一个崩溃不影响另一个。` |
| `concurrent\|useTransition 切换标签页` | 注释 lessons-3.js:674–675 | `// 过渡更新：可以被打断`、`// 紧急更新：必须一次做完` |
| `state-architecture\|亲手实现 Zustand` | 注释 lessons-4.js:203、209 | `// 只订阅 bears` |
| `tanstack-query\|迷你 useQuery` | 注释与 `<p>` lessons-5.js:388、438 | `// 去重：同一个 key 只发一次`、`两个组件请求同一数据，只发一次请求` |
| `escape-hatches\|Portal 里的点击` | 预测题前一段正文 lessons-6-escape.js:155 | "它能读到上层的 Context，事件也按 React 树冒泡。" |

做得好的反例：a11y 课"三个'按钮'"的注释只写 `① 只有 onClick 的 div / ② 加了 role 和 tabIndex 的 div / ③ 真正的 button`（lessons-6-a11y.js:30–35），不含结论；mini-react 的 `20 行实现 useState` 需要真正推理。

**影响：** 预测题的价值来自"先在脑子里运行，猜错后记得更牢"（app.js:360 自己也这样说）。答案就在眼前时，它退化成"找到那行注释"，测试效应消失。

**改法：**
1. 预测题演示的代码只保留中性标签：`情况 1 / 情况 2 / 情况 3`、`按钮 A / 按钮 B`、`列表一 / 列表二`。结论性注释移到 `note`（预测后才显示）或移到演示后的正文。
2. console 输出用中性文字：`'effect ①'`、`'effect ②'`、`'effect ③'`。
3. 正文中紧邻预测题的结论句（如 escape-hatches :155）移到演示之后。
4. 改写示例（closures 课）：
   ```js
   useEffect(() => {
     const id = setInterval(() => {
       setCount(count + 1);
     }, 1000);
     return () => clearInterval(id);
   }, []);
   return <h2>{count}</h2>;
   ```
   把"回调创建于第一次渲染，看到的 count 永远是 0"放进 note，或放在演示下方的段落（lessons-3.js:361 已经有这段话，删掉代码里的重复即可）。

#### H2. useEffect 课：先教"挂载/更新"表，再说"不要这样想"

lessons-2.js:17–23 的顺序是：
1. 小标题"依赖数组的三种写法"，表格第二行写"只在组件**挂载**后执行一次"，第三行写"挂载后，以及 a 或 b 变化后"。
2. 紧接着一段："不要按'挂载时做什么、更新时做什么'来想。每个 effect 只回答两个问题：怎样开始同步？怎样停止同步？依赖数组不是你挑选的。它由 effect 里用到的值决定。"

然后演示的 console 输出是 `'② 只在挂载时执行一次'`（:36），测验第一题的正确选项是"只在组件挂载后执行一次"（:125），练习提示才回到"怎样开始同步……怎样停止同步"（:152）。

**影响：** 读者先用 5 行表格建立生命周期模型，再被一段话要求推翻它，随后的演示和测验又用生命周期语言。两套模型并排出现，初学者会记住更简单的那套（生命周期），这正是 react.dev 花整整一章（"Lifecycle of Reactive Effects"）要纠正的误区。闭包陷阱课（第 21 课）的"依赖数组撒谎了"要靠同步模型才讲得通。

**改法：** 调换顺序，让同步模型成为主线，表格成为"从结果上看"的附注：
> **effect 描述一次同步。** 它回答两个问题：怎样开始同步？怎样停止同步？（清理函数）
>
> 依赖数组不是你挑的。effect 里读到的每个 props 和 state，都要写进去。React 用它判断：这些值变了，就先停止上一次同步，再开始新的同步。
>
> 从结果上看，三种写法的表现是：（表格，但把"只在挂载后执行一次"改成"不读任何会变的值，所以只需同步一次"）

演示的 console 改为 `'effect ①（没有依赖数组）'`、`'effect ②（依赖 []）'`、`'effect ③（依赖 [count]）'`，让读者自己得出"何时执行"。测验第一题的正确选项改为"只执行一次，因为它不读任何会变化的值"。

#### H3. 阶段 2 重排后的前向依赖

lessons-6-order.js 把阶段 2 改成"状态提升 → reducer → Context → ref → effect → 自定义 Hook"。课文大多已改成按标题引用，但两处示例仍然依赖后面的课：

- **useRef 课（第 13 课）的秒表演示用了 useEffect**（lessons-2.js:314–315）："`// 卸载时停表。useEffect 会在《useEffect 与副作用》中详细讲，这里先照着用`"。useEffect 是下一课（第 14 课）的主题，而且这里用的还是"返回清理函数"这个最难的形态。
- **Context 课（第 12 课）的购物车示例把 Context 封装成自定义 Hook `useCart`**（lessons-2.js:429、447–451），并在正文解释"自定义 Hook 就是以 use 开头、内部调用 Hook 的函数，《自定义 Hook：复用逻辑》会详细讲"。自定义 Hook 是第 15 课。同一示例里还用了 `throw new Error` 做守卫，对刚学完 useReducer 的读者是两个新概念叠加。

**影响：** "这里先照着用"打断了课程一贯的"先为什么再怎么做"节奏；读者要么跳过不懂的行，要么前跳两课。

**改法：**
- useRef 课：去掉 `useEffect` 行，用正文一句话说明"离开页面时要停表，这需要下一课的清理函数"；或把 useRef 课移到 useEffect 之后（react.dev 的顺序也是 ref 在 effect 之前，但它的 ref 示例不用 effect）。
- Context 课：第二个示例改成 `const { items, add } = useContext(CartContext)` 直接消费；把 `useCart` 封装放进"深入一点"，并注明"第 15 课会讲自定义 Hook，学完可以回来看这个写法"。

#### H4. 毕业设计课的课号引用错误（3 处）

portfolio 课（lessons-5.js）仍用重排前的课号：

| 行 | 原文 | 实际指向 | 应为 |
|---|---|---|---|
| :1298 | "受控表单、TypeScript 类型（第 8、29 课）" | 29 = Server Components | 第 8、32 课 |
| :1310 | "lazy、Suspense、性能优化（第 19、21 课）" | 19 = 渲染机制，21 = 闭包陷阱 | 第 20、22 课 |
| :1317 | "useOptimistic、reducer（第 25、36 课）" | 25 = 组件设计模式 | 第 28、11 课 |

其余引用（第 14、15、17、27、31、33、34、35、36 课等）核对无误。

**影响：** 这是读者最后一课、最需要"回去翻哪一课"的地方。

**改法：** 改成按标题引用（课程其他地方已这样做），或改为上表的课号。建议在 build.py 里加一步：解析所有"第 N 课"，和 LESSON_ORDER 比对，不一致时报错。

### 中

#### M1. 术语一致性：课文没有完全遵守术语表

glossary.js 规定：`set 函数`（避免"setter、修改函数"）；"属性"只用于 HTML attribute；"状态"只用于固定词组。课文的偏差：

- **`setState` 当作通用术语用了 20 多次**，包括学习目标："理解 setState 会触发重新渲染"（lessons-1.js:303，在页面顶部学习目标里直接可见）；"同一个事件中的多次 setState 只触发一次渲染"（lessons-3.js:15）；"包装的是：一次 setState 调用"（:695）；forms 课的示意图节点写 `setState`（lessons-1.js:750）。`setState` 是 class 组件的 API，函数组件里不存在。初学者搜索这个词会搜到旧资料。
- **`setter`** 出现在 concurrent 课表格："能拿到 setter（自己的状态）"（lessons-3.js:696）、"拿不到 setter 时"（:704）——正是术语表列为"不使用"的说法。
- **"通过属性传入数据"** 作为演示标题（lessons-1.js:223）——用"属性"指 props。
- **"真相来源"没有术语条目，且有三种说法**："唯一真相来源"（lessons-1.js:746、:809）、"只存一份'真相'"（lessons-2.js:191）、"单一数据源原则"（:209）、"一个'真相来源'"（lessons-5.js:1084）。"真相来源"是 source of truth 的直译，中文里不自然。

**改法：** 全局把"setState"（作为概念时）改成"set 函数"或"调用 set 函数"；`setter` 改为"set 函数"；演示标题改为"通过 props 传入数据"；术语表新增条目 `唯一数据来源（single source of truth）：同一份数据只在一处保存，其他地方由它算出`，课文统一用"唯一数据来源"。

#### M2. 两个比喻会误导

- **遥控器比喻与单向数据流矛盾**（lessons-2.js:215）："状态提升就像家里的电视遥控器。如果哥哥和妹妹都要换台，遥控器就不能放在某个人兜里，而要放在客厅（共同的父级），谁要用谁去拿。""谁要用谁去拿"的含义是子组件直接拿到并修改 state，这恰恰是 props 只读规则禁止的。本课的核心是"数据向下流，事件向上传"（:176、:219），比喻应该体现"请求父组件改"。
  改写："状态提升像家里的电视遥控器。遥控器只有一个，放在客厅（共同的父组件）。哥哥和妹妹（子组件）不能各自藏一个遥控器，而是对客厅喊一声'换到 5 台'（调用回调）。电视显示什么（props），由客厅那个遥控器决定。"
- **"银行柜台"用于两个不同概念**：useReducer 课（lessons-2.js:554）"reducer 像银行柜台……你填一张单子（action）交给柜员（dispatch）"；escape-hatches 课（lessons-6-escape.js:73）"useImperativeHandle 像银行柜台的窗口。客户只能通过窗口办理几项业务，不能走进金库"。同一个比喻绑定两个概念会互相干扰。后者改成"像电视机只给你一个遥控器，上面只有几个键；电路板怎么接你看不到也碰不到"更贴近"只暴露少数方法"。

#### M3. React 19 课是功能清单，缺少贯穿的"为什么"，唯一可运行的演示是 React 18 模拟

lessons-4.js:300–463。课的结构是 7 个 H2（Actions、form action、useOptimistic、use()、其他改进、大型表单、19.2 与 19.3），5 个只读代码块，1 个 React 18 写的乐观更新演示（:372–403）。"为什么"只有一句："以前处理一次提交，你要手动管理 pending、error、成功后的状态"（:306）。

**影响：**
- 读者看到的是 API 列表，而不是"一次异步提交要管理 pending / 错误 / 重置 / 乐观值这 4 件事，React 19 用 Action 统一接管"这一条线。
- 唯一能动手的演示用 `pending` 计数器手工模拟（:383–392），代码形态与 `useOptimistic` 完全不同；预测题 `react-19|乐观更新的效果` 绑在这个模拟上。学完后读者对 useOptimistic 的"手感"来自一段不是 useOptimistic 的代码。
- 19.2/19.3 表格（:447–456）是发布说明，不是讲解，每行没有"它解决什么问题"。

**改法：**
1. 开头加一个对照表："React 18 手写提交 vs React 19 Action"，列出 4 件事（pending、错误、成功后重置、乐观值），每件事对应一个新 API。后面各节按这 4 件事展开。
2. 把 React 18 模拟演示明确标题为"用 React 18 模拟 useOptimistic 的效果（不是它的写法）"，并在演示后并排放 useOptimistic 版本，逐行对应。
3. 只读代码也可以挂预测题（引擎已支持对 `play` 挂 predict；对 `code` 块加一个"读代码题"即可），例如 useFormStatus 代码问"在渲染 form 的组件里调用 useFormStatus 会读到什么"。
4. 19.2/19.3 表精简到 3 行，每行加"解决什么问题"列；其余移到"深入一点"。

#### M4. Server Components 课没有图、没有演示，三张表承担全部讲解

lessons-4.js:467–563。块统计：6 个 H2、4 段、3 张表、4 个代码块、0 个 fig、0 个 play。对比课程其他课都有图或演示。

- 三种渲染方式表（:473–477）在第一个表格单元格里首次引入"水合（hydration）"，没有先解释；"RSC Payload"在"深入一点"里才解释（:535），但表格第三行已经依赖它。
- "RSC 不取代 SSR"的两步流程（:478）用 `<br>1. <br>2.` 写在段落里。这是本课最难的一点（两种"服务端"怎么叠加），正是该画图的地方。课程已有 `fig`/`steps` 基础设施（rendering 课 :11、project-search 课 :925 用得很好）。
- 边界规则表（:510–516）信息密度高，但没有一个"看图识别哪些组件该是客户端组件"的练习。本课没有动手练习（expert-summary 已指出），至少可以给一道预测题："下面这棵组件树里，哪些文件需要 `'use client'`？"

**改法：** 加一张 `fig`：浏览器请求 → 服务端组件运行（产生 RSC Payload）→ SSR 把整棵树渲染成 HTML → 浏览器显示 HTML → 下载客户端组件的 JS → 水合。把"水合"的定义提到表格之前的一段里。

#### M5. 生态课的"迷你实现"占据唯一可运行位置，与课程目标错位

- Router 课目标是"会配置路由、动态参数和嵌套路由；会用 Link、useParams……"（lessons-5.js:168），但唯一可运行的是 80 行迷你路由实现（:206–288），真实 API 只在只读代码里。迷你版的 `<Routes routes={[...]}>` 和真实的 `<Routes><Route/></Routes>` 不同（正文 :205 已注明），而且不支持嵌套路由，而嵌套路由是学习目标之一。
- TanStack Query 课同样：目标是"会用 useQuery 和 useMutation"（:337），可运行的是 40 行 `useSyncExternalStore` 缓存实现（:377–441）。这段实现里 `useEffect(..., [key])` 省略了 `queryFn`（:401–405），与第 14 课反复强调的"依赖数组不要撒谎"（lessons-2.js:117）直接冲突，正文没有解释为什么这里可以省略。细心的读者会困惑；不细心的读者学到"依赖可以挑着写"。

**改法：**
1. 迷你实现的演示标题统一加前缀"原理演示："，并在 note 里写明"这是为了理解原理。真实项目用 `import { useQuery } from '@tanstack/react-query'`，用法见上面的代码块"。
2. 迷你 useQuery 加一行注释：`// 省略 queryFn：它每次渲染都是新函数，写进依赖会无限请求。真实库用 ref 保存最新的 queryFn`，或改用 ref 保存 queryFn，顺便回顾第 21 课"用 ref 读取最新值"。
3. 迷你路由改成 `<Routes><Route path element/></Routes>` 的形态（多 10 行即可），让可运行代码和真实 API 一致。

#### M6. 新增三课的篇幅是旧课的 3 倍，标注时长却相同

| 课 | 正文字符数 | 演示数 | 标注分钟 |
|---|---|---|---|
| state（第 4 课） | 5.5k | 4 | 15 |
| use-effect（第 14 课） | 6.0k | 3 | 18 |
| escape-hatches（第 16 课） | 16.5k | 4 + 练习 | 18 |
| profiling（第 24 课） | 15.5k | 2 + 练习 | 16 |
| accessibility（第 26 课） | 16.3k | 4 + 练习 | 18 |

escape-hatches 课有 7 个 H2、16 段、5 个"常见坑"、2 个"深入一点"、1 张速查表；profiling 课有 8 个 H2、5 张表。按中文阅读速度加上运行演示和做练习，这三课各需要 40–50 分钟。

**影响：** 时长标注失真会打乱"每天先清空复习，再学新课"的节奏；一课内 5 个"常见坑"也稀释了警示的分量。

**改法：** 二选一：拆成两课（如"逃生舱 A：ref 与 useLayoutEffect / 逃生舱 B：Portal、useId、flushSync"；"性能测量 / 虚拟列表与 Web Vitals"）；或把速查表、"工具三：Performance 面板"、"React Compiler 改变了什么"这类参考性内容移到"深入一点"并折叠，同时把 mins 改为 35–40。

#### M7. 信息结构：步骤列表用段落冒充，标题只有一级，序号风格不统一

- **步骤写成 `<p>` 里的 `1.<br>2.<br>3.`** 而不是 `<ol>`：lessons-1.js:24（原生 JS 四步）、lessons-2.js:23（两个问题）、lessons-3.js:15、lessons-4.js:423（大型表单四条）、lessons-4.js:478、lessons-6-profiling.js:16（录制 8 步）、:97（6 步）、:117。而 a11y 课用了 `<ol class="task-steps">`（lessons-6-a11y.js:118、:222），样式明显更好。STE 要求"操作写成编号步骤"，课程做到了，但渲染成段落后视觉上还是一团文字。
- **标题层级只有 H1 + H2**（app.js:596 把 `h` 固定渲染为 `h2`）。短课没问题；escape-hatches、profiling、a11y 这种 7–9 个 H2 的长课缺少分组，右侧没有目录，读者无法扫视结构。
- **序号风格每课不同**："一、二、三"（escape-hatches）、"工具一/二/三"（profiling）、"模式一/二/三"（patterns）、"方式一/二/三"（conditional）、"用途一/二"（use-ref）、"第一步/第二步"（mini-react）、"① ② ③"（rendering 的 fig）。

**改法：** 给引擎加 `ol(items)` 块类型，把上述 `<p>` 改成 `ol`；给 `h` 加可选 level 参数（`h('…', 3)`），长课用 H3 分组；统一序号风格为"第一步/工具一"这种"量词 + 中文数字"，或统一用阿拉伯数字。

#### M8. 真实的报错信息讲得少

课程讲了很多"错误写法"，但很少告诉读者"你会在控制台看到什么"。全部课文里出现的真实报错只有：`Too many re-renders`（仅在阶段测验 lessons-6-checks.js）、水合不匹配（server-components 课）、`useCart 必须在 CartProvider 内使用`（自定义）。缺少：
- `Rendered more hooks than during the previous render`（Hook 放进 if 的后果，custom-hooks 课 lessons-2.js:681 只讲原理）
- `Each child in a list should have a unique "key" prop`（运行环境会显示，lists-keys 课正文没有告诉读者"看到这条就去检查 map 返回的元素"）
- `Objects are not valid as a React child`（JSX 课花括号里放对象，初学者第一周必遇）
- `Cannot update a component while rendering a different component`（渲染期间调用 set 函数）
- `A component is changing an uncontrolled input to be controlled`（forms 课的 `useState()` 没给初始值）

**影响：** 初学者卡住时的第一动作是复制报错去搜索；课程不教"怎么读报错"，就把读者推回搜索引擎。

**改法：** 在 state、custom-hooks、lists-keys、forms、jsx 五课各加一个 `warn` 块"你可能看到的报错"，格式固定：报错原文（英文）→ 一句话原因 → 去看哪一行。

### 低

#### L1. 条件渲染课"方式二"是空标题
lessons-1.js:556–559："方式二：三元运算符 ? :"下只有一句"适合在 JSX 内部'二选一'"，随后就是"方式三"的标题，两者共用后面的演示。标题有、内容无，读者会以为漏了代码。合并成"方式二、三：三元运算符与 &&"，或各给一行代码。

#### L2. STE 执行过头的几处
- lessons-2.js:9："例如发送网络请求和设置定时器。又如订阅 WebSocket 和修改 document.title。""又如"开头的独立句在口语中不自然。改为一个列表，或："例如：发网络请求、设定时器、订阅 WebSocket、修改 document.title。"
- lessons-5.js:170（router 课第一段）在读者还没见过路由时就讲"从 v7 起，原 Remix v2 的能力并入了它的'框架模式'。v8 起统一从 react-router 包导入，不再使用 react-router-dom"。版本史对首次接触的读者是噪音，移到"深入一点"或"选哪种模式"一节。
- lessons-6-escape.js:26："这样写，父组件拿到的是整个 input DOM 节点。父组件可以改它的样式、内容，甚至删除它。这通常给得太多了。""给得太多"缺主语，改为"这暴露得太多了"。

#### L3. 偶发的语气不一致与未解释的术语
- lessons-4.js:573 "还记得吗？JSX 会被编译成……"是全课程唯一一处对话式提问，其他课都用陈述句。
- lessons-3.js:64 "完美地比较两棵树的复杂度是 O(n³)，太慢了。React 基于两个假设，把它降到了 O(n)"——O 记号没有解释，课程面向零基础。可加半句："（n 是元素数量；n³ 意味着 1000 个元素要比较 10 亿次）"。
- lessons-1.js:58（第 1 课的提示）说"真实的 React 18 环境"，但读者此时不知道还有 React 19 和"只读示例"的存在。加一句："课程里标注'React 19'的示例只能阅读，不能运行。"

#### L4. 术语表的首次标注会跳过标题和表格
app.js:672 `markTerms` 跳过 `h2` 和 `th`。server-components 课"水合"第一次出现在表格 `td` 里（lessons-4.js:475）会被标注，但 lists-keys 课"key"这类英文术语在标题"key 是什么？"里出现时不标，到正文才标。规则合理，但建议在课程地图页说明"标题里的术语不带释义"，避免读者以为漏了。

---

## 4. 优先级最高的 5 条改进建议

1. **去掉预测题演示里的剧透（H1）。** 12 个演示的注释、按钮文字、console 字符串改成中性标签，结论移到 note 或演示后的正文。这是改动最小、对学习效果影响最大的一项。

2. **重写 useEffect 课的开头（H2）。** 把"开始同步 / 停止同步"模型放到第一节，依赖数组表格降级为"从结果上看"，演示 console 和测验选项改用同步模型的语言。闭包陷阱课和 TanStack Query 课都依赖读者先建立这个模型。

3. **修复重排留下的依赖与课号（H3、H4）。** useRef 课示例去掉 useEffect；Context 课的 `useCart` 封装移到"深入一点"；portfolio 课三处课号改正；build.py 加课号校验。

4. **术语统一，补术语表（M1）。** `setState`/`setter` → "set 函数"；"通过属性传入数据" → "通过 props 传入数据"；新增"唯一数据来源"条目并统一四种说法。可以用 build.py 做一次 grep 校验，把术语表的 `avoid` 列表当作禁用词检查。

5. **给 React 19 和 Server Components 两课补"为什么"和图示，给长课减负（M3、M4、M6）。** React 19 课围绕"一次提交要管理的 4 件事"重组，并把 React 18 模拟与 useOptimistic 版本并排；Server Components 课加一张"RSC → SSR → 水合"流程图和一道"哪些文件要 'use client'"预测题；escape-hatches、profiling、a11y 三课拆分或折叠参考内容，并把 mins 改为真实时长。
