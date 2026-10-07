# 教育测评复评：练习、测验与反馈（第 10 版，2026-10-06）

审查对象：《React 从零到专家》第 10 版的 33 道动手练习、111 道课内测验题、92 道阶段测验专用读代码题，以及 app.js 中的测评机制（提示阶梯、答案原文拦截、测验重答、首答统计、间隔复习、12 题阶段测验与 30 分钟冷却、自我解释要点）。

方法：
- 通读全部练习的 task / starter / solution / hint / faded / test，以及全部 203 道选择题。
- 在 Chromium（Playwright，`scratchpad/v10.html`，每次实验用新的浏览器上下文）对 **113 种写法**提交检查：33 道练习的参考答案 + 80 种“合理变体 / 常见错误 / 投机写法”，记录判定与失败信息（完整表见附录；脚本在 scratchpad/edu2/asm/）。
- 对新机制逐一实测：课内测验答错后的界面与存储、不改代码连点检查、微改后连点、参考答案原文与微改、阶段测验答一题后离开再回来、全错后的冷却、全对后的“换一组题”、第二组题与第一组的重叠。
- 用二项分布重新估算“12 题答对 10 题”的判定可靠性。

---

## 1. 总评与评分

**总分：7.5 / 10（上一轮 6.5）。** 这一轮把上一轮点名的问题几乎逐条处理了：5 处能被投机绕过或误拒合理写法的字面检查全部改成了行为或 AST 检查并经实测成立；7 道过轻的练习加量，closures、mini-react、lifting-state、state-architecture 现在练的确实是课程目标里的动作；并发课补了练习；半成品示例全部人工挖空；课内测验的解析普遍点出最迷惑的错误项，“正确项最长”的比例从 62% 降到 14%；阶段测验扩到每阶段 18–20 道新题、每次 12 题、失败后冷却 30 分钟，结果列出错题；首次作答正确率单独记录，答错不再亮出正确答案。

剩下的短板集中在两点。第一，**“掌握”标记仍然可以不靠掌握拿到**：测验最多重答 3 次就必然全对，课的“完成”仍只看最终选择；提示阶梯只要每次加一个分号就能三步解锁答案；阶段测验在答完 12 题之前离开页面不留任何记录，于是可以“答一题看一题答案、离开、再进”，三轮就把本阶段 18 道新题连同答案看完。第二，**新写的检查又带进了一批新漏洞和误拒**：lifting-state 不检查 state 是否真的提升；use-ref 的定时器 id 放模块变量或 useState 也通过；project-search 的“自定义 Hook”只认名字；concurrent 的字面正则能用空的 `startTransition(() => {})` 绕开；lists-keys 对无 key 的 `<>` 包裹放行；typescript 误拒 `| undefined` 和 `Readonly<>`；看过参考答案后，只有一种写法的练习（what-is-react）再也写不出能通过的代码。

| 分项 | 上一轮 | 本轮 | 依据 |
|---|---|---|---|
| 练习任务的真实性与难度梯度 | 7 | 8 | lifting-state 真正提升 state、closures 改成切换房间的过期闭包、mini-react 实现带游标的 useState/useRef、state-architecture 补 setState/selector、use-ref 两个 ref、concurrent 新增；仍有 4 课无练习（react-19、server-components、engineering、portfolio） |
| 自动检查：验证行为还是字面 | 6 | 8 | 上一轮 5 处漏洞全部修复并实测；113 种写法中 14 种判定不符预期（9 处放行、5 处误拒），其中 lifting-state、use-ref、project-search 的放行会让练习失去目标 |
| 失败信息与提示阶梯 | 6 | 7.5 | 失败信息几乎都能说出原因和方向（use-effect、lists-keys、closures、state-architecture 尤其好）；半成品示例人工编写、挖的是关键行；但阶梯的“改过代码”判定只看字面差异，一个分号就算；fails 从不清零；答案原文拦截会永久误拒一行题 |
| 课内测验质量 | 6 | 8 | 111 题解析中位 103 字、无 30 字以下；59 题解析明确说“最迷惑的是…”；正确项最长 14%；仍有 4 组跨课重复题 |
| 阶段测验新题（checkOnly） | 8 | 8 | 92 道（+43），新题延续“预测结果 / 找 bug / 选修法”模板；少数与课内题重复 |
| 测评体系（掌握标准、复习、总结性评估） | 5 | 6.5 | 首答统计、答错隔天复习、12 题 + 8 新题 + 冷却、错题列表都做了；但课的“完成”仍可暴力重答、阶段测验可预览式刷题、复习/热身仍是原题、毕业设计验收清单不进记录 |
| 构建式对齐 | 7 | 8 | 目标全部改成可观察动词；concurrent 有练习；engineering 有 4 道新题；但 lifting-state 的检查没有验证“提升”这个动作，use-ref 的检查没有验证“用 ref 存” |

---

## 2. 上一轮问题逐条核实

| 编号 | 问题 | 状态 | 证据 |
|---|---|---|---|
| H1 | “掌握”可零成本达成 | **部分解决** | 测验：答错不再显示正确答案（app.js:528-536，实测 `.opt.right` 不出现、解析不泄露）；首答结果记入 `p.first`（app.js:591）并在课末显示“首次作答答对 N/M”。但 `maybeComplete` 仍只看 `quizPassed`（app.js:599-607），实测 4 选项的题最多重答 3 次必然全对，`done` 照旧置 true。练习：参考答案原文被拦（app.js:468），看过答案后通过记为 `exHelp='solution'`（app.js:478），课末显示“借助参考答案完成”——这部分解决了；但首页和侧栏仍只有一个“已完成”，不区分独立/借助。阶段测验：失败后冷却 30 分钟（app.js:842-852），`passed` 仍一写永不撤销 |
| H2 | 字面检查被绕过 / 误拒合理写法 | **已解决（原 5 处）；新引入 9 处放行、5 处误拒** | 原 5 处实测：use-effect 无清理函数 → 拒（严格模式双定时器，sv=4）；closures 旧题已换成新题，按连接次数和消息内容判定，7 种写法全部判对；state 空操作凑次数 → 拒（快速连点应 11 实际 8）；typescript `any`/混入 `string` → 拒（AST）；lists-keys 组件上写 key → 过（读 fiber key）；context 解构 Provider → 过。新问题见第 3 节 N1–N6 |
| H3 | 阶段测验 10 题信度不足、一半旧题 | **部分解决** | 每次 12 题、8 道新题优先未见过（app.js:857-861，实测 fresh=8，第二组与第一组 0 重叠）；每阶段新题 18/18/18/20/18；失败冷却 30 分钟（实测生效）；结果列出错题锚点（实测 11 个 `data-jump`）。二项估算：新题掌握率 70% 的学生单次通过率 49%（旧版 76%），50% 的学生 3 次内 33%（旧版 81%），区分度明显改善。未解决：答完 12 题前离开不留记录（第 3 节 N2）；旧题仍是原题；练习通过率未纳入阶段判定 |
| M1 | 课内题识记为主、干扰项弱、解析不解释错项 | **已解决** | 抽查上一轮点名的 10 题全部重写：`what-is-react#0` 改为“React 怎样让页面显示 2”，`state#2` 改为“let 变量为什么不更新”，`use-ref#0` 改为“点 3 次显示几”，`patterns#2` 改为 HOC 命名冲突，`portfolio#0` 删除改为验收场景题；统计：解析 <30 字 0 题（原 34）、中位 103 字；59/111 题明确写“最迷惑的是…/…不对”；正确项为最长选项 14%（原 62%）；`performance#2` 与 `portfolio#0` 的重复已消除 |
| M2 | 7 道练习过轻 | **已解决（6/7）** | 参考答案相对 starter 的新行数：lifting-state 2→9（Panel 的 useState 删掉、App 持有 activeId）、closures 1→2 但任务改为真实聊天室切换房间的双 bug、mini-react 1→13（render/useState/useRef）、state-architecture 3→7（setState 合并 + selector）、use-ref 3→8（聚焦 + 定时器 + 防重复启动）、custom-hooks 4→11；performance 仍是 3 行 |
| M3 | 半成品示例机械隔行遮盖 | **已解决** | 33 道练习都有 `faded` 字段（app.js:421 优先使用）；抽查：use-effect 挖“启动定时器 / 返回清理函数 / 依赖”三处，closures 挖“追加 text / 依赖数组”两处，state 的 JSX 子节点位置用 `{/* ✏️ */}`；lifting-state 的 faded 把 p1 的 `isActive={activeId === 'p1'} onShow={…}` 整行给出，只挖 p2 的一半，属于挖得偏少 |
| M4 | 复习与热身只重放原题 | **部分解决** | 答错后 `due = 明天`（app.js:559），与文案一致（L1 解决）；复习页 `cardOf` 支持 checkOnly 题进入复习（app.js:567）。未解决：`makeWarmup` 的题池仍只含 `l.quiz`（app.js:656，实测 `makeWarmup.toString()` 不含 checkOnly）；没有变式 |
| M5 | 5 课无练习，engineering 无新题 | **部分解决** | concurrent 新增 useDeferredValue 练习（实测参考答案、useTransition 变体都通过，无 memo 被拒且信息指向 memo）；engineering 有 4 道 checkOnly；react-19、server-components、engineering、portfolio 仍无练习 |
| M6 | 失败信息只报症状 | **已解决** | use-effect 过期闭包：“实际一直是 1：每秒都在执行 setSeconds(0 + 1)…请用函数式更新”；lists-keys `key={i}`：“看起来是数组下标…state 会错位”，与“key 写在里层”“应该是它的 id”三条信息分开；patterns `#free2`：“它传了 onChange 但没传 value…你是用什么判断受控的？” |
| M7 | 毕业设计零评估、自我解释无对照 | **部分解决** | 每课 `keyPoints` 4–5 条，写满 30 字后并排显示（app.js:689-695，实测 29 字按钮禁用、30 字可用）；portfolio 有 15 条“操作 → 应该看到”的验收表（lessons-5.js:1601-1617）和 3 个测试的自测步骤。但验收表是纯文本，不可勾选、不进进度，首页也不展示 |
| L1 | 答错 due 与文案不一致 | **已解决** | app.js:559 |
| L2 | 答案位置偏置（源码层面） | **未解决** | 111 题中 81 题 `answer: 1`；展示时打乱，对学生无影响 |
| L3 | 提示阶梯计数从不清零 | **未解决** | `p.fails` 只在 app.js:483 递增；“重置”按钮（app.js:365-376）不碰它；通过后 `p.ex` 永久打开全部帮助 |
| L4 | 阶段测验只列课名 | **已解决** | app.js:880 列出“答错的题：第 N 题”并可跳转，同时列课名 |
| L5 | escape-hatches 只提一种导入写法 | **已解决** | lessons-6-escape.js 失败信息同时给出 `import * as ReactDOM` 和 `import { createPortal }`；实测两种写法都通过 |

统计：高/中/低 15 条中，已解决 8，部分解决 5，未解决 2。

---

## 3. 新发现的问题（本轮修改引入或本轮首次实测到）

### 高

**N1. 练习帮助阶梯的“改过代码才计失败”只看字面差异，一个分号就算一次尝试。**
- 证据：`isAttempt` 只比较去空白、去注释后的字符串（app.js:461-462）。实测 what-is-react：起始代码连点 3 次 → `fails` 保持 0、三级全锁（机制有效）；之后依次提交“起始代码 + `;`”“+ `;;`”“再回到 + `;`”，三次都计入，`fails` = 3，三级全部解锁。`lastFail` 只记上一次，所以在两个版本之间来回切换也能计数。
- 影响：上一轮“连点 3 次拿答案”变成“点 3 次、每次敲一个分号拿答案”，成本几乎没变。
- 改法：至少要求代码**能运行**（`res.error` 为空）或检查器走到第一条断言之后才计入；更稳的做法是记录每次失败的断言信息，只有“失败点推进了”或“与之前所有失败版本都不同”才计数；也可以改为按时间解锁（首次失败后 2 分钟解锁提示）。

**N2. 阶段测验可以“预览式刷题”：答完 12 题之前离开页面不留任何记录，再进来重新抽题。**
- 证据：`finish()` 只在 `answered === picks.length` 时调用（app.js:869-877），`failedAt`/`last` 都在其中写入；每答一题就显示正确答案和解析（阶段测验的 `makeQuestion` 没有 `hideAnswer`）。实测 check-1：每轮答 11 题就切到别的课再回来，`__stage` 一直是 `undefined`、没有冷却，3 轮后本阶段 18 道新题全部看过（含答案），之后每轮都是见过的题。
- 影响：30 分钟冷却和“优先抽没见过的新题”都被绕开；新题池扩到 18 道的价值被削弱。
- 改法：进入测验时就写入一条“进行中”记录（抽到的题 key 和开始时间），离开后回来恢复同一组题而不是重抽；中途放弃视为一次失败（或至少把本组题标为已见、计入冷却）；答题过程不显示正确答案，只在交卷后统一显示。

**N3. 新写的行为检查有 4 处放行了与课程目标相反的写法。**
- `lifting-state`：Panel 保留 `useState(isActive)` 并用 `useEffect` 镜像 props（课内测验 Q0 明确说这是错的）→ **过**；完全不提升、用模块级数组收集各 Panel 的 set 函数互相关掉 → **过**。检查只看“同一时间只展开一个”（lessons-2.js test），没有验证 Panel 不再持有 state、App 持有 activeId。目标“能把 state 提升到最近的共同父组件”没有被测到。
- `use-ref`：定时器 id 存在模块级 `let timer` → **过**；存在 `useState` 里 → **过**。检查只要求源码里出现 `useRef(` 和 `<input ref=`（这两条被 inputRef 满足），定时器部分纯看行为。目标“能用 ref 保存定时器 id 这类不需要显示的可变值”和“在 ref 和 state 之间做选择”没有被测到；useState 版多出无用渲染正是课文反对的写法。
- `project-search`：定义一个空的 `function useUserSearch() {}` 在 App 里调用，请求逻辑留在 App → **过**。检查只用正则找“定义了 use 开头的函数并调用过”（lessons-2.js test 第 2–3 行）。
- `concurrent`：`setTimeout` 防抖 + 一句空的 `startTransition(() => {})` → **过**。字面正则 `useDeferredValue\(|startTransition\(` 被空调用满足，行为检查（输入 60ms 内响应、opacity 0.5、最终 14 项）防抖同样满足。
- 改法：lifting-state 用 `t.exports` 导出 Panel，单独渲染 `<Panel isActive={true}>` / `<Panel isActive={false}>`，再把同一个 Panel 的 `isActive` 从 true 改成 false 看它是否立刻跟着变；同时在 sandbox 里把 `React` 换成代理对象，记录 Panel 渲染期间 `useState` 的调用次数应为 0。use-ref 同理：记录 App 渲染期间 `useRef` 调用次数 ≥ 2、`useState` 调用次数 = 1（只有 ticks）。project-search：把 Hook 导出，在探针组件里直接调用 `useUserSearch('张')`，断言它自己返回 loading → success 的状态变化。concurrent：去掉字面正则，改为代理记录 `useDeferredValue`/`useTransition` 是否被调用且返回值被用到，并检查 sandbox 的 `setTimeout`（已包装，可计数）未被调用。

### 中

**N4. 看过参考答案后，“答案原文”拦截会永久误拒只有一种写法的练习。**
- 证据：拦截条件是 `p.sawSol && norm(code) === norm(solution)`（app.js:468），`sawSol` 永不清除。实测 what-is-react：看答案 → 加分号通过（记为借助答案）→ 重置 → 自己写出 `function App() { return <h1>你好，React</h1>; }` → “这还是参考答案的原文”。这道题（以及 jsx、events 这类 2–3 行题）独立写出来的正确代码必然和参考答案一致。
- 另外，`exHelp` 一旦写入也无法清除：学生几天后不看答案重写一遍并通过，课末仍显示“练习是借助参考答案完成的”，文案承诺的“过几天不看答案再写一遍，才算真正会了”在机制上没有出口。
- 改法：拦截只在“载入答案后未点过重置”期间生效（重置时清 `sawSol`）；通过时如果点过重置后独立通过（或距上次看答案超过 1 天），把 `exHelp` 清掉并记为独立通过。

**N5. 新检查的 4 处误拒。**
- `typescript`：`tone?: 'info' | 'success' | undefined` → 拒（“应只允许两个值”）；`type BadgeProps = Readonly<{…}>` → 拒（“应该是一个对象类型”）。前者是 `exactOptionalPropertyTypes` 下的常见写法，后者是课文鼓励的只读 props。
- `lists-keys`：`key={'todo-' + t.id}` → 拒（“应该是它的 id（2）”）。key 仍由 id 派生、稳定唯一，任务说“用 id 作为 key”并不排斥前缀。
- `custom-hooks`：useCounter 内部用两个 `useState`（一个存 initial 快照）→ 拒，而且失败信息是“Likes 和 Stock 里不要再直接调用 useState”，与实际情况不符（Likes/Stock 里没有 useState）。检查用的是全文 `useState(` 计数 ≤ 1（lessons-2.js test）。
- 改法：typescript 的 union 解析时忽略 `TSUndefinedKeyword`，`resolve` 对 `Readonly<X>` 这类单参数泛型取其参数；lists-keys 放宽为“key 含该项 id 且各项不同”，只拒下标、title、随机数；custom-hooks 只数 Likes/Stock 函数体内的 `useState`（用 AST 或按函数名切片）。

**N6. lists-keys 对“无 key 的 `<>` 包着带 key 的 `<li>`”放行。**
- 证据：`keyInfo` 里 `while (i > 0 && path[i].tag === 7 && path[i].key == null) i--` 主动跳过没有 key 的片段（lessons-1.js test 注释“跳过没有 key 的片段”）。实测 `map(t => <><li key={t.id}>…</li></>)` → 过，而 React 对这种写法会发出缺 key 警告，key 实际不起作用。课内 checkOnly `lists-keys#c0` 考的正是这一点，练习却放行。
- 顺带：不写 filter/map、手写两个带 key 的 `<li>` → 过。属于故意为之的投机写法，低优先。
- 改法：删掉那一行跳过逻辑；map 直接返回的 fiber（path 顶层）没有 key 就报“map 返回的元素没有 key”。

**N7. 课内“完成”仍可暴力重答；首页/侧栏不区分独立完成与借助答案。**
- 证据：实测 state 课第 1 题故意选错 → 重答 → 再错 → 第 3 次对，`p.quiz[0]` 变为正确、`first[0]=false`；其余题答对后 `quizPassed` 为 true。`renderHome` 的“课已完成”和阶段进度条（app.js:896、945-951）只看 `done`，没有读 `first` 或 `exHelp`。
- 改法：课的 `done` 改为“首答正确率 ≥ 2/3 且练习独立通过”，或在课程地图上把“首答 N/M、借助答案”画成第二种状态（例如半填充的圆点）。

**N8. 课内题与阶段新题有 4 组重复或近重复，复习时会连着出现。**
- `rendering#c3`（Layout + children，点菜单 SlowList 不渲染）与 `performance#2`（Layout + BigTable）同一题；`use-effect#c1` 与 `engineering#c1`（StrictMode 下无清理的 setInterval 每秒加 2）同一题；`react-19#2` 与 `react-19#c1`（`use(fetch…)` 每次渲染新 Promise）同一题；`conditional#2` 与 `custom-hooks#c1`（提前 return 后调用 useState 报错）同一题。
- 改法：各保留一道，另一道改成变式（例如 `engineering#c1` 改问“生产环境每秒加几”，`react-19#c1` 改为“怎样修”）。

### 低

**N9. escape-hatches 可以“调用 useId 但不用”。** `useId();` 加写死的 `id="modal-title"` → 过（检查只看源码出现 `useId(` 和 aria-labelledby 指向标题）。可改为断言标题 id 以 `:` 开头（React 18 的 useId 格式），或在 App 里渲染两个 Modal 看 id 不重复。

**N10. state 练习的“三次 setCount”未被验证。** 只调一次 `setCount(c => c + 3)` → 过。行为上正确，任务却写明“调用三次 setCount，每次加 1”。要么把任务改成“让 +3 在快速连点时也正确”，要么代理 useState 数一次点击内的 set 调用次数。

**N11. state-architecture 不用 useSyncExternalStore 也能过。** 用 `useState + useEffect` 订阅 + selector → 过。目标“能用 useSyncExternalStore 把外部 store 接入组件”没被测到；可用代理记录 `useSyncExternalStore` 被调用。

**N12. 正确项“最长”从 62% 降到 14%，低于随机的 25%。** 应试者反过来也能利用“最长的通常不对”。checkOnly 为 28%，正常。建议把课内题调回 20–30%。

**N13. 阶段测验每答一题就显示正确答案。** 与 N2 组合才构成漏洞；单独看也会提示后面同知识点的题。建议交卷后统一显示解析。

**N14. `p.fails` 不清零（上一轮 L3）与新阶梯叠加后更明显**：通过后重置再练，三级帮助全开；文案建议“过几天不看答案再写一遍”，但重写时提示和答案都在一键之内。

---

## 4. 主要优点（本轮新增或经实测确认）

1. **use-effect 的清理检查是真正的行为检查。** 另开一个 `StrictMode` 根渲染学生的 App，2.5 秒后断言该根里的秒数为 2（lessons-2.js test）。实测：无清理函数 → 4，清理函数不传 id → 4，`[seconds]` 依赖 → 2，setTimeout 链 + clearTimeout → 2，不写依赖数组但有清理 → 2。失败信息直接说明“React 做了开始 → 停止 → 再开始，但第一个定时器没有被停掉”。唯一的漏网是“ref + 启动前先 clearInterval、不写清理函数”（E5），它在严格模式下恰好也只剩一个定时器，但卸载后定时器不会停。
2. **closures 练习是这一轮最好的新练习。** 模拟服务器暴露 `connects/open` 计数，检查同时覆盖“消息累积”“切换后只收新房间”“旧连接断开”“收到消息不重连”“切换后保留旧消息”。7 种写法全部按预期判定，每条失败信息都指出是哪一次渲染的值、该改依赖还是改更新方式。
3. **typescript 改用 Babel AST 检查类型本身。** `any`、`unknown`、混入 `string`、漏 `?`、`label` 非 string 分别有专门的信息，`interface`、`type Tone` 别名、`React.FC`、`props: BadgeProps`、箭头函数都能通过。
4. **lists-keys 读 fiber 上的 key**，所以 key 写在组件、`<Fragment key>` 上都通过，`key={i}`、`key={t.title}`、写在里层这三种错误各有各的信息。
5. **mini-react、state-architecture、custom-hooks 把被测函数导出后直接在探针组件里调用**，于是能测“setState 支持函数”“`0` 和 `''` 不被当成未初始化”“条件调用 Hook 后错位读到 'A'”“取消订阅后不再通知”这类课内测验很难覆盖的点。
6. **阶段测验结构合理。** 实测每次 12 题、8 道新题、通过后“换一组题”与上一组 0 重叠、失败后冷却页列出薄弱课和错题锚点；新题总量 92 道，质量与上一轮一致。
7. **课内测验的解析普遍带“最迷惑的是…”。** 例如 `events#1`（stopPropagation 不阻止提交）、`forms#c1`（复选框读 `e.target.value` 得到 "on"）、`lifting-state#c1`（effect 互相同步看似可行却多渲染一轮）。

---

## 5. 剩余问题清单

**高**
- N1 帮助阶梯：一个分号算一次尝试，三步拿答案。
- N2 阶段测验：中途离开不留记录，可预览式刷完整个新题池。
- N3 四处放行与目标相反的写法：lifting-state（不提升）、use-ref（模块变量 / useState 存定时器）、project-search（空 Hook）、concurrent（防抖 + 空 startTransition）。
- H1 残留：课的“完成”可暴力重答；首页不区分独立/借助。

**中**
- N4 看过答案后一行题永久被拦；`exHelp` 无出口。
- N5 误拒：TS `| undefined`、`Readonly<>`、`'todo-' + id`、Hook 内两个 useState（且信息错误）。
- N6 无 key 的 `<>` 包裹被放行。
- N8 四组重复题。
- M4 残留：热身只抽课内题，复习无变式。
- M5 残留：4 课无练习。
- M7 残留：毕业设计验收表不可勾选、不进记录。
- H3 残留：练习通过率未纳入阶段判定；旧题仍是原题。

**低**
- N9–N14、L2、L3。

---

## 6. 优先级最高的 5 条改进建议

1. **把“尝试”定义为“能运行且失败点不同”，并在中途离开阶段测验时保存状态。**（N1、N2、N13）阶梯：只有 `res.error` 为空且本次失败的断言信息与之前任一次都不同才计数；阶段测验：进入时写入 `{ keys, startedAt }`，回来时恢复同一组题，答题期间不显示正确答案，交卷或放弃才显示解析并计入冷却。两处都是 app.js 内不到 40 行的改动。
2. **给 lifting-state、use-ref、project-search、concurrent 补“过程”检查。**（N3）统一做法：在 sandbox 里把 `React` 换成代理对象，对 `useState / useRef / useDeferredValue / useTransition / useSyncExternalStore` 计数，并在 `makeTester` 里用 `t.exports` 单独渲染目标组件后读计数。这样 lifting-state 可断言 Panel 渲染期间 `useState` 为 0、use-ref 断言 App 的 `useRef` ≥ 2 且 `useState` = 1、concurrent 断言 `useDeferredValue` 或 `useTransition` 被调用且 `setTimeout` 未被调用、project-search 直接调用 Hook 看状态机。用本报告附录的 14 种写法回归。
3. **修 4 处误拒并删掉 lists-keys 的片段跳过。**（N5、N6）typescript 忽略 `undefined` 成员、展开 `Readonly<>`；lists-keys 接受含 id 的派生 key、不再跳过无 key 片段；custom-hooks 只数 Likes/Stock 函数体内的 useState 并修正信息。
4. **给“掌握”一个出口和一个入口。**（N4、N7、H1）重置时清 `sawSol`；点过重置后独立通过时清 `exHelp`；课的 `done` 要求首答 ≥ 2/3；课程地图用第二种标记显示“借助答案 / 重答后完成”，阶段“已掌握”同时要求本阶段练习独立通过 ≥ 80%。
5. **去重并补齐题库的边角。**（N8、M4、M5、M7）合并 4 组重复题；热身题池加入已答过的 checkOnly 题；为 react-19 / server-components 各补一道纯函数练习（例如“哪些 props 能跨越 server/client 边界”的校验函数、`useActionState` 的 reducer）；portfolio 的验收表做成可勾选并存入进度。

---

## 附录：113 种写法实测结果

说明：“期望”是审查者按任务要求判断应当通过还是拒绝；加粗带 ✗ 的是实际判定与期望不符的 14 种。失败信息已去掉“已解锁：…”后缀并截断。

| # | 课 | 写法 | 期望 | 实际 | 失败信息（摘要） |
|---|---|---|---|---|---|
| 1 | state | S1 参考答案 | 过 | 过 |  |
| 2 | state | S2 投机：setCount(count+3) + 两个空操作 | 拒 | 拒 | 快速连点两次 +3，应从 5 变成 11，实际是 8。第二次点击时，处理函数读到的还是旧的 count。每次加 1 都要基于最新值：setCount(c => c + 1)  |
| 3 | state | S3 变体：只调一次 setCount(c => c + 3)（任务要求三次） | 过 | 过 |  |
| 4 | state | S4 常见错误：三次 setCount(count + 1) | 拒 | 拒 | 点 +3 后应从 2 变成 5，实际是 3。连续调用三次 setCount(count + 1) 时，三次读到的是同一个 count。请用函数式更新 setCount(c => c |
| 5 | state | S5 变体：具名处理函数 + prev 命名 | 过 | 过 |  |
| 6 | state | S6 投机：+3 用 setCount(count + 3) 单次（快速连点应 8） | 拒 | 拒 | 快速连点两次 +3，应从 5 变成 11，实际是 8。第二次点击时，处理函数读到的还是旧的 count。每次加 1 都要基于最新值：setCount(c => c + 1)  |
| 7 | lists-keys | L1 参考答案 | 过 | 过 |  |
| 8 | lists-keys | L2 变体：抽出 TodoItem，key 写在组件上 | 过 | 过 |  |
| 9 | lists-keys | L3 常见错误：key={i} | 拒 | 拒 | “学习 State”的 key 是 0，看起来是数组下标。列表插入、删除或重排时，下标会对应到别的数据，state 会错位。请用每项自带的 id：key={t.id}  |
| 10 | lists-keys | L4 变体：key 用 "todo-" + id（仍基于 id） | 过 | **拒** ✗ | “学习 State”的 key 是“todo-2”，应该是它的 id（2）。请用 key={t.id}  |
| 11 | lists-keys | L5 变体：<Fragment key={t.id}> 包住 li | 过 | 过 |  |
| 12 | lists-keys | L6 常见错误：key 写在 <></> 里层的 li 上 | 拒 | **过** ✗ |  |
| 13 | lists-keys | L7 常见错误：key={t.title} | 拒 | 拒 | “学习 State”的 key 是“学习 State”，应该是它的 id（2）。请用 key={t.id}  |
| 14 | lists-keys | L8 投机：不用 filter，手写两个 li 带 key | 拒 | **过** ✗ |  |
| 15 | use-effect | E1 参考答案 | 过 | 过 |  |
| 16 | use-effect | E2 投机：无清理函数，只写 const stop = clearInterval | 拒 | 拒 | 在严格模式下，2.5 秒后应为 2，实际是 4。React 做了“开始 → 停止 → 再开始”，但第一个定时器没有被停掉，两个定时器在一起加。请让 effect 返回清理函数：re |
| 17 | use-effect | E3 变体：依赖 [seconds]，每次重建 | 过 | 过 |  |
| 18 | use-effect | E4 常见错误：过期闭包 seconds + 1 与 [] | 拒 | 拒 | 2.5 秒后应为 2，实际一直是 1：每秒都在执行 setSeconds(0 + 1)。定时器回调记住的是第一次渲染的 seconds。请用函数式更新 setSeconds(s = |
| 19 | use-effect | E5 投机：ref + 启动前先清除，不写清理函数 | 拒 | **过** ✗ |  |
| 20 | use-effect | E6 变体：不写依赖数组，但有清理函数 | 过 | 过 |  |
| 21 | use-effect | E7 变体：setTimeout 链 + clearTimeout 清理 | 过 | 过 |  |
| 22 | use-effect | E8 常见错误：清理函数里 clearInterval 没传 id | 拒 | 拒 | 在严格模式下，2.5 秒后应为 2，实际是 4。React 做了“开始 → 停止 → 再开始”，但第一个定时器没有被停掉，两个定时器在一起加。请让 effect 返回清理函数：re |
| 23 | context | C1 参考答案 | 过 | 过 |  |
| 24 | context | C2 变体：const { Provider } = UserContext | 过 | 过 |  |
| 25 | context | C3 投机：调用了 useContext 但名字写死 | 拒 | 拒 | Welcome 放在 Provider 外面时应显示默认值“欢迎，游客”，实际是“欢迎，小李”。默认值写在 createContext('游客') 里，Welcome 要用 use |
| 26 | context | C4 常见错误：通过 props 传名字 | 拒 | 拒 | 不要通过 props 传给 Welcome。用户名要从 Context 里读  |
| 27 | context | C5 变体：createContext() 无默认值，Welcome 里 ?? 游客 | 过 | 过 |  |
| 28 | lifting-state | LS1 参考答案 | 过 | 过 |  |
| 29 | lifting-state | LS2 常见错误：Panel 保留 state，用 effect 镜像 props | 拒 | **过** ✗ |  |
| 30 | lifting-state | LS3 投机：不提升，模块级数组收集各 Panel 的 set 函数 | 拒 | **过** ✗ |  |
| 31 | lifting-state | LS4 变体：传 activeId 和 onShow(id)，Panel 自己比较 | 过 | 过 |  |
| 32 | use-ref | R1 参考答案 | 过 | 过 |  |
| 33 | use-ref | R2 变体/投机：定时器 id 存在模块级变量 let timer | 拒 | **过** ✗ |  |
| 34 | use-ref | R3 变体：定时器 id 存 useState | 拒 | **过** ✗ |  |
| 35 | use-ref | R4 常见错误：组件内普通变量 let timer | 拒 | 拒 | 点“停止”后数字还在变（5 → 8）。停止时要用 ref 里的 id 调用 clearInterval。如果 id 存在组件里的普通变量中，重新渲染后它就变回了 undefined |
| 36 | use-ref | R5 常见错误：start 不检查已在跑 | 拒 | 拒 | 连点两次“开始”后，0.5 秒内加了 11，应约为 5：第二次点击又启动了一个定时器。start 开头先检查 ref 里是否已有 id  |
| 37 | use-ref | R6 变体：聚焦用 autoFocus 风格 ref 回调 | 过 | 过 |  |
| 38 | custom-hooks | H1 参考答案 | 过 | 过 |  |
| 39 | custom-hooks | H2 变体：useCounter 内部用 useReducer | 过 | 过 |  |
| 40 | custom-hooks | H3 变体：useCounter 里用两个 useState（存 initial 快照） | 过 | **拒** ✗ | Likes 和 Stock 里不要再直接调用 useState。计数逻辑应只写在 useCounter 里一次  |
| 41 | custom-hooks | H4 常见错误：Likes 仍保留自己的 useState | 拒 | 拒 | Likes 和 Stock 都要调用 useCounter  |
| 42 | custom-hooks | H5 常见错误：reset 设为 0 而不是 initial | 拒 | 拒 | 调用 reset 后应恢复为初始值 5，实际是 0。reset 要设回 initial，不是 0  |
| 43 | closures | K1 参考答案 | 过 | 过 |  |
| 44 | closures | K2 常见错误：依赖 [roomId, messages]（每条消息重连） | 拒 | 拒 | 还没切换房间，就已经连接了 5 次。每收到一条消息就重连了一次：effect 的依赖里是不是有 messages？用函数式更新，effect 就不必读 messages  |
| 45 | closures | K3 常见错误：函数式更新 + 依赖 [] | 拒 | 拒 | 切到“旅行”后，仍然只收到“综合”的消息。effect 里的 roomId 是哪一次渲染的？effect 用到的 roomId 要写进依赖数组  |
| 46 | closures | K4 常见错误：依赖 [roomId] 但仍读 messages | 拒 | 拒 | 0.75 秒后列表仍只有 1 条消息。回调里的 messages 永远是第一次渲染的 []，每次都在算 [...[], text]。试试函数式更新  |
| 47 | closures | K5 变体：ref 保存最新 messages | 过 | 过 |  |
| 48 | closures | K6 常见错误：用 key={roomId} 重挂载（丢消息） | 拒 | 拒 | 切换后，之前的 4 条“综合”消息不见了。题目要求保留它们：ChatRoom 被重新挂载了，还是 messages 被清空了？  |
| 49 | closures | K7 常见错误：依赖 [roomId] 但不清理 | 拒 | 拒 | 切换后有 2 个连接同时打开。effect 要返回清理函数，断开旧连接  |
| 50 | concurrent | N1 参考答案 | 过 | 过 |  |
| 51 | concurrent | N2 变体：useTransition + 两份 state | 过 | 过 |  |
| 52 | concurrent | N3 常见错误：useDeferredValue 但没有 memo | 拒 | 拒 | 输入一个字时，主线程被占用了约 407 ms，输入框会卡顿。紧急渲染时，父组件重新渲染会带上慢列表。用 memo 包裹它，让它在 props 没变时跳过。  |
| 53 | concurrent | N4 投机：setTimeout 防抖 + 空的 startTransition(() => {}) | 拒 | **过** ✗ |  |
| 54 | concurrent | N5 常见错误：把输入框的 set 也放进 startTransition | 拒 | 拒 | 输入后，输入框应立刻显示新字。不要把输入框自己的 state 放进 startTransition  |
| 55 | state-architecture | A1 参考答案 | 过 | 过 |  |
| 56 | state-architecture | A2 常见错误：getSnapshot 返回整个 state 再 select | 拒 | 拒 | 加熊时 HoneyPot 也重新渲染了（1 → 3）。getSnapshot 返回的是整个 state 吗？它每次都是新对象。让 getSnapshot 返回 selector 选 |
| 57 | state-architecture | A3 变体：useState + useEffect 订阅（不用 useSyncExternalStore） | 过 | 过 |  |
| 58 | state-architecture | A4 常见错误：setState 原地修改 state | 拒 | 拒 | setState 修改了旧的 state 对象。要创建新对象：{ ...state, ...next }。否则用整个 state 当快照的组件不会更新  |
| 59 | mini-react | M1 参考答案 | 过 | 过 |  |
| 60 | mini-react | M2 常见错误：用 !hooks[i] 判断首次 | 拒 | 拒 | setCount(0)、setName('') 后应得到 0\|\|5，实际是 0\|小明\|5。判断“第一次渲染”时，是不是把 0 和空字符串也当成了“还没有值”？  |
| 61 | mini-react | M3 变体：hooks[i] === undefined 判断 + 对象槽 | 过 | 过 |  |
| 62 | mini-react | M4 常见错误：游标不归零 | 拒 | 拒 | setCount(c => c + 1) 后，count 仍是初始值（0\|小明\|1）。游标在每次渲染前归零了吗？没有归零，第二次渲染的 Hook 会跑到新的格子里，读到 ini |
| 63 | mini-react | M5 常见错误：setState 不支持函数 | 拒 | 拒 | setCount(c => c + 1) 后应得到 1\|小明\|2，实际是 c => c + 1\|小明\|2。setState 支持函数吗？ref 每次渲染都是同一个对象吗？  |
| 64 | typescript | T1 参考答案 | 过 | 过 |  |
| 65 | typescript | T2 投机：label: any | 拒 | 拒 | label 的类型写成了 any。any 等于关掉了检查：传数字、传对象都不会报错。请写成 string  |
| 66 | typescript | T3 投机：联合里混进 string | 拒 | 拒 | tone 的类型里有 string，它允许任意字符串，联合类型就失去了作用：tone="danger" 也不会报错。只保留 'info' \| 'success'  |
| 67 | typescript | T4 变体：interface + type Tone + React.FC | 过 | 过 |  |
| 68 | typescript | T5 变体：function Badge(props: BadgeProps) | 过 | 过 |  |
| 69 | typescript | T6 变体：tone?: "info" \| "success" \| undefined | 过 | **拒** ✗ | tone 的类型应只允许 'info' 和 'success' 两个值，现在是 'info' \| 'success' \| undefined（步骤 1）  |
| 70 | typescript | T7 变体：Readonly<{…}> | 过 | **拒** ✗ | BadgeProps 应该是一个对象类型，写成 { label: …; tone?: … }（步骤 1）  |
| 71 | typescript | T8 投机：tone 漏掉 ?（第一个 Badge 没传 tone） | 拒 | 拒 | tone 应该是可选的：写成 tone?:。第一个 Badge 没有传 tone，不加 ? 编辑器会报错  |
| 72 | typescript | T9 变体：箭头函数 + 解构标注 | 过 | 过 |  |
| 73 | escape-hatches | X1 参考答案 | 过 | 过 |  |
| 74 | escape-hatches | X2 变体：import { createPortal } | 过 | 过 |  |
| 75 | escape-hatches | X3 常见错误：没有清理函数 | 拒 | 拒 | 弹窗已经关闭，但 document 上还留着 1 个 keydown 监听。effect 的清理函数要用 removeEventListener 移除同一个函数。每次写一个新的箭头 |
| 76 | escape-hatches | X4 常见错误：移除时传了新的箭头函数 | 拒 | 拒 | 弹窗已经关闭，但 document 上还留着 1 个 keydown 监听。effect 的清理函数要用 removeEventListener 移除同一个函数。每次写一个新的箭头 |
| 77 | escape-hatches | X5 投机：调用了 useId 但 id 写死 | 拒 | **过** ✗ |  |
| 78 | escape-hatches | X6 变体：监听挂在 window 上 | 过 | 过 |  |
| 79 | escape-hatches | X7 常见错误：onKeyDown 只写在对话框 div 上 | 拒 | 拒 | 按 Escape 后弹窗没有关闭。请在 document 上监听 keydown  |
| 80 | project-search | P1 参考答案 | 过 | 过 |  |
| 81 | project-search | P2 投机：空的 useUserSearch，逻辑仍在 App | 拒 | **过** ✗ |  |
| 82 | project-search | P3 常见错误：没有 ignore 标记（竞态） | 拒 | 拒 | 快速输入“李”→“李四”后应只显示 李四，实际是：李四、李娜。过期请求的结果覆盖了新结果（需求 7）  |
| 83 | project-search | P4 变体：Hook 返回数组，用请求序号代替 ignore | 过 | 过 |  |
| 84 | performance | F1 参考答案 | 过 | 过 |  |
| 85 | performance | F2 变体：useCallback 依赖 [pings] 读 pings | 过 | 过 |  |
| 86 | performance | F3 常见错误：useCallback [] + pings + 1 | 拒 | 拒 | 点击 2 次 ping 后应为 2，实际是 1。回调是否读到了旧的 pings？  |
| 87 | performance | F4 常见错误：memo 但内联函数 | 拒 | 拒 | Child 仍在重新渲染（1 → 4）。检查传给它的函数是不是每次都是新的  |
| 88 | rendering | G1 参考答案 | 过 | 过 |  |
| 89 | rendering | G2 变体：Slow 作为 children 传给有 state 的组件 | 过 | 过 |  |
| 90 | rendering | G3 常见错误：state 仍在 App | 拒 | 拒 | 打字时 Slow 仍在重新渲染（1 → 4）。text 的 state 是不是还在 Slow 的父组件里？父组件渲染会带动 Slow 一起渲染  |
| 91 | patterns | Q1 参考答案 | 过 | 过 |  |
| 92 | patterns | Q2 常见错误：用 onChange 判断受控 | 拒 | 拒 | free2 的 defaultValue={true}，初始应为“开”。它传了 onChange 但没传 value，所以是非受控的。你是用什么判断受控的？只看 value 是不是 |
| 93 | patterns | Q3 变体：用 in 判断 + 函数式更新 | 过 | 过 |  |
| 94 | accessibility | Y1 参考答案 | 过 | 过 |  |
| 95 | accessibility | Y2 变体：收起时不渲染面板 | 过 | 过 |  |
| 96 | accessibility | Y3 常见错误：aria-expanded 只在展开时写 | 拒 | 拒 | “配送说明”按钮上没有 aria-expanded。收起时也要写，值为 false。  |
| 97 | profiling | Z1 参考答案 | 过 | 过 |  |
| 98 | profiling | Z2 变体：上下占位 div | 过 | 过 |  |
| 99 | suspense | U1 参考答案 | 过 | 过 |  |
| 100 | suspense | U2 变体：componentDidCatch + setState | 过 | 过 |  |
| 101 | what-is-react | 参考答案 | 过 | 过 |  |
| 102 | jsx | 参考答案 | 过 | 过 |  |
| 103 | components-props | 参考答案 | 过 | 过 |  |
| 104 | events | 参考答案 | 过 | 过 |  |
| 105 | conditional | 参考答案 | 过 | 过 |  |
| 106 | forms | 参考答案 | 过 | 过 |  |
| 107 | project-todo | 参考答案 | 过 | 过 |  |
| 108 | use-reducer | 参考答案 | 过 | 过 |  |
| 109 | project-kanban | 参考答案 | 过 | 过 |  |
| 110 | router | 参考答案 | 过 | 过 |  |
| 111 | tanstack-query | 参考答案 | 过 | 过 |  |
| 112 | testing | 参考答案 | 过 | 过 |  |
| 113 | nextjs | 参考答案 | 过 | 过 |  |
