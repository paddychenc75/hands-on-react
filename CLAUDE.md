# CLAUDE.md：维护“动手学 React”课程

这是一套中文交互式 React 课程：45 课，6 个阶段，构建成**一个 HTML 文件**。没有打包器，没有框架工程。课程数据和引擎都是普通的浏览器 JS，由 `src/build.py` 拼进一个页面。

用户用中文交流。回复、提交信息和课程文字都用中文。

## 常用命令

```bash
npm install                      # 只装 Playwright（测试用）
npx playwright install chromium  # 第一次需要
npm run check                    # node --check 全部 src/*.js（语法检查，几秒）
npm run build                    # 生成 index.html 和 dist/react-course.html
npm test                         # 构建 + 逐课测试 + 学习机制测试（约 3–5 分钟）
node tests/lessons.mjs dist/react-course.html scheduler perf-clinic   # 只测指定课
```

- 测试需要网络：页面从 cdn.jsdelivr.net 加载 React、Babel、Prism。离线时可以把库下载到本地目录，再用 `python3 src/build.py file:///绝对路径/libs/ out.html` 构建（目录结构与 jsdelivr 相同，例如 `libs/react@18.3.1/umd/react.development.js`），然后 `node tests/lessons.mjs out.html`。
- 想用本机 Chrome 而不是 Playwright 的 Chromium：`CHROMIUM=/path/to/chrome npm test`。
- 期望结果：`lessons.mjs` 每道练习 `PASS`，最后一行 `with issues 0`；`mechanics.mjs` 最后一行 `全部通过`。`PAGEERR` 行（boom、网络错误、天气服务超时、toUpperCase）是课程示例故意抛出的错误，不算问题。
- 改完任何课程或引擎文件，至少运行 `npm run check` 和相关课的 `tests/lessons.mjs`；改引擎（app.js）要跑完整 `npm test`。

## 文件

| 文件 | 作用 |
|---|---|
| `src/build.py` | 按固定顺序拼接 style.css 和全部 JS，输出 `index.html`（发布到 claude.ai Artifact 用，无 doctype，平台会补）和 `dist/react-course.html`（独立网页，带 doctype/viewport）。可选参数：`build.py <库地址前缀> <输出文件>`。 |
| `src/app.js` | 引擎：路由、侧栏、渲染课文、实验台（Babel 现场编译）、预测题、测验、练习检查、提示阶梯、自我解释、热身复习、阶段测验、进度存储（localStorage）。`STAGES` 数组定义 6 个阶段。 |
| `src/lessons-1.js` … `lessons-5.js` | 第 1–5 组课程。`lessons-1.js` 开头定义 `LESSONS` 和块函数。 |
| `src/lessons-6*.js` | 后加的课（escape、profiling、a11y、生态练习等）。 |
| `src/lessons-7-*.js` | 第 6 阶段第 37–44 课，每课一个文件。build.py 自动按文件名排序加载 `lessons-7-*.js`。 |
| `src/lessons-6-order.js` | `LESSON_ORDER`（课程顺序）和 `STAGE_OF`（课 → 阶段）。**课号 = 在 LESSON_ORDER 中的位置**。 |
| `src/lessons-predict.js` | 预测题表 `PREDICTIONS`，键是 `'课id|示例标题'`。 |
| `src/lessons-6-checks.js` | 阶段测验专用读代码题 `CHECK_ONLY` + `CHECK_MORE`，合并进各课的 `checkOnly`。 |
| `src/glossary.js` | 术语表（45 条）。课文里第一次出现的术语会自动加注。 |
| `src/style.css` | 全部样式。 |
| `tests/` | Playwright 测试：`lessons.mjs`（逐课）、`mechanics.mjs`（学习机制和手机宽度）。 |
| `review/` | 历次评审报告。`edu-summary.md` 末尾有修改记录；`depth.md` 是深度评估。只读参考，不是代码。 |

运行时是 **React 18.3.1 开发版 UMD**（全局 `React`、`ReactDOM`）+ Babel standalone 7.25.6。React 19 API 和服务端内容在实验台里跑不了，只能用 `code` 块展示，并在文字里说明“只能阅读”。

## 课程数据格式

`src/lessons-1.js` 开头的块函数：`h(标题)`、`p(html)`、`ul(items)`、`code(src, cap)`、`play(src, title, note)`、`tip`、`warn`、`like`、`deep`、`table(head, rows)`、`fig(html, cap)`；`lesson(o)` 把一课推入 `LESSONS`。

```js
lesson({
  id: 'scheduler', stage: 5, title: '…', mins: 40,
  summary: '一句话',
  goals: ['能写出…', '能解释…', '能诊断…'],   // 3–4 条，可观察的动词开头
  keyPoints: ['…'],                          // 4–5 条，自我解释后展示对照
  body: [h('…'), p('…'), play(src, '标题', '运行后再看的说明'), …],
  quiz: [{ q: 'html', options: ['纯文本', …], answer: 1, explain: 'html' }],
  exercise: { task, starter, solution, hint, faded, test: async (t) => {…}, exports: ['名字'] },
  checkOnly: [{ q, options, answer, explain }],  // 阶段测验专用
});
```

- 标题含“（选读）”的小节会折叠成 `<details class="optional">`；术语首次标注会跳过折叠区。
- 以 `<ol|ul|div|table|figure>` 开头的 `p(...)` 会渲染成 div，不会非法嵌套。
- 预测题：直接写在示例上 `Object.assign(play(src, title, note), { predict: { q, options, answer, explain }, pkey: '课id|标题' })`，或写进 `lessons-predict.js`。**被预测的代码、按钮文字、日志里不能剧透答案**，解释放进 `note`（预测后才显示）。
- `options` 是纯文本，不能写 HTML（会被转义）。`q` 和 `explain` 按 HTML 渲染，写 JSX 或泛型时把 `<` 写成 `&lt;`。
- `lessons-7-*.js` 在 `lessons-6-checks.js` 之前加载，所以里面不能用 `CHECK_PRE` 等后定义的辅助函数；每个文件用块或 IIFE 包住自己的辅助函数。

### 练习检查（exercise.test）

`test(t)` 拿到的工具（见 app.js `makeTester`）：`t.q(sel)`、`t.qa(sel)`、`t.text(sel)`、`t.byText(tag, text)`、`t.click(x)`、`t.type(x, value)`、`t.wait(ms)`、`t.assert(cond, msg)`、`t.source`（去注释的代码）、`t.rawSource`、`t.exports`（按 `exports` 字段导出的顶层名字）、`t.root`。

- **检查行为，不查字面**：点按钮看界面变化、计渲染次数、另开 root、卸载后看定时器是否停止。`t.source` 只用作最后的补充。
- 每改一道检查，要实测：参考答案通过；起始代码被拒，失败信息指向概念；常见错误和投机写法被拒；至少一种合理的不同写法通过。
- 失败信息是纯文本（会被转义）。
- `faded` 是人工挖空的半成品，用 `/* ✏️ 说明 */` 标记要补的 2–4 个关键行。

## 加一课 / 调整顺序

1. 新建 `src/lessons-7-<id>.js`（或放进已有文件）。
2. 在 `src/lessons-6-order.js` 的 `LESSON_ORDER` 里放到正确位置，并在 `STAGE_OF` 里登记阶段（0–5）。
3. **课号是位置**：插入或移动课程后，全文搜索“第 N 课”并重新编号（`grep -n "第 [0-9]* 课" src/*.js`）。毕业设计（portfolio，第 45 课）的验收表和“加分项”表引用了很多课号。
4. 新阶段要同时改 app.js 的 `STAGES`。
5. 估算 `mins`：正文每 300 字约 1 分钟，可运行示例 +2，练习 +10~20，测验每题 +1。

**不要改动已有 checkOnly 题的顺序或删除中间的题**：阶段测验和间隔复习的卡片键是 `课id#cN`（N 是下标），改顺序会把学习者的复习记录错配。新题只追加到末尾。

## 学习机制（不要破坏）

课程按学习科学设计，用户明确要求保留：

- 先预测再运行：预测前隐藏说明。
- 课前热身（提取练习）和间隔复习：答错的题第二天再出；12 小时内答过的不再出；只有到期的卡片才提升复习间隔。
- 测验答错不亮正确答案，重试时隐藏上次选的项。
- 提示阶梯：`[提示, 失败 1 次], [半成品, 失败 2 次且 2 分钟], [参考答案, 失败 3 次且 5 分钟]`；只有代码真的改了（去掉注释、空白、分号、逗号后不同）才算一次失败。粘贴参考答案原文不能通过，除非看过答案后按了“重置”自己重写；借助答案完成会单独标记。
- 自我解释：至少 30 个有效字（重复字折叠，不同字少于 10 个会被压低）才展示参考要点。
- 阶段测验：12 题（8 道新题优先没见过的 + 4 道常规题），交卷后才显示解析，80% 通过；中途离开算未通过；未通过要等 30 分钟；以最近一次为准；35 天后提示复测。

改 app.js 后跑 `node tests/mechanics.mjs`，它覆盖了以上大部分规则和 390px 宽度下无横向滚动。

## 写作规范

- 中文，约 80% 遵循 ASD-STE100 简化技术语言：一句一个意思，短句（尽量 ≤30 字），主动语态，固定术语。比喻和动机段落可以灵活，但同一个比喻不要用在两个概念上（已用过：遥控器、自动售货机、银行柜台等）。
- 步骤写成 `p('<ol class="task-steps"><li>…</li></ol>')`，不要用 `<br>1.` 手工编号。
- 术语与 `glossary.js` 一致：set 函数（不写 setState/setter）、唯一数据源、无障碍（不写可访问性）、记忆化（指 memo/useMemo/useCallback 时不写缓存）、卸载（不写销毁）、重新渲染（不写重渲染）、渲染/提交、过渡更新。写“React 18 中”，不写“18 里”。新概念第一次出现给一句定义。
- 学习目标用“能写出 / 能解释 / 能诊断 / 能判断……”开头。
- 测验干扰项来自真实误解；正确项的位置和长度不要有规律；`explain` 说明为什么对，并点出最迷惑的错误项错在哪。
- 技术准确，区分 React 18 与 19。尚未联网核实的两处：第 39 课 Next.js 16 的缓存 API 名称、第 43 课 React 19 的 onCaughtError/onUncaughtError 细节。

## 发布

- 网页本身就是 `dist/react-course.html`：任何静态托管（GitHub Pages、Netlify、本地双击）都能打开。
- 原版发布在 claude.ai Artifact（https://claude.ai/artifact/B2em8mXwQEf2XVwfWjfHNE），用的是 `index.html`（没有 doctype，平台发布时会补）。
- 学习进度存在浏览器 localStorage，不同网址的进度不互通。
