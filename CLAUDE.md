# CLAUDE.md：维护“动手学 React”课程

这是一套中文交互式 React 课程：45 课，6 个阶段（入门、进阶、高级、原理与架构、生态与实战、深入）。站点用 **Rspress 2**（React + MDX）构建，静态发布到 GitHub Pages。课文是 MDX，每课的非正文数据（测验、练习、预测题等）在 JS 数据文件里，引擎逻辑在 `course/engine/`。

用户用中文交流。回复、提交信息和课程文字都用中文。

## 常用命令

```bash
npm install
npx playwright install chromium   # 第一次（测试用）
npm run dev                       # 开发服务器（热更新）
npm run build                     # 构建到 doc_build/（base 是 /hands-on-react/）；MDX 编译错误和死链接都会让构建失败
npm run preview                   # 预览构建结果（http://localhost:4173/hands-on-react/）
npm test                          # 构建 + 逐课测试 + 学习机制测试 + 冒烟测试（约 3 分钟）
node tests/lessons.mjs scheduler perf-clinic   # 只测指定课
npm run screenshots               # 重新生成 tests/screenshots/ 里的截图
```

- 测试需要网络：实验台从 cdn.jsdelivr.net 加载 React 18.3.1 开发版、Babel、Prism。
- 测试默认用内置静态服务器托管 `doc_build`（按 base 挂载）；也可以 `SITE_URL=http://localhost:4173/hands-on-react/ node tests/xxx.mjs` 测试已运行的站点。
- 想用本机 Chrome 而不是 Playwright 的 Chromium：`CHROMIUM=/path/to/chrome npm test`。
- 期望结果：`lessons.mjs` 最后一行 `lessons 45 with issues 0`；`mechanics.mjs` 和 `smoke.mjs` 最后一行 `全部通过`。`PAGEERR` 行（boom、网络错误、天气服务超时、toUpperCase、测试用的渲染错误）是课程示例故意抛出的错误，不算问题。
- 改完任何课程，至少 `npm run build` 加 `node tests/lessons.mjs <课id>`；改引擎（`course/engine/`）或主题组件要跑完整 `npm test`。

## 目录

| 位置 | 作用 |
|---|---|
| `rspress.config.ts` | 站点配置：base、中文、remark 插件、全局组件、侧栏（由 `course/registry.js` 和 `stages.js` 生成）、压缩时保留函数名 |
| `docs/` | Rspress 文档根。`lessons/<id>.mdx` 是课文；`index.mdx` 首页；`review.mdx` 今日复习；`glossary.mdx` 术语表；`check/0..5.mdx` 六个阶段测验；`_nav.json` 顶部导航 |
| `course/lessons/<id>.js` | 每课的非正文数据：id、stage、title、mins、summary、goals、keyPoints、quiz、exercise、checkOnly、plays |
| `course/registry.js` | 课程注册表：`LESSONS`（按课程顺序）、`lessonNo(id)`、`lessonById(id)`。**课号 = 在 LESSONS 里的位置** |
| `course/stages.js`、`glossary.js`、`site.js` | 6 个阶段、术语表（46 条）、站点常量（base、链接工具） |
| `course/engine/` | 引擎：`engine.js`（实验台、练习、题目、间隔复习、测验、热身、自我解释、术语标注）、`shell.js`（复习页、阶段测验、首页组件树、阅读位置）、`exec.js`（代码预处理和编译，练习的检查函数也会 import 它）、`store.js`（进度，键 `hands-on-react-v1`）、`runtime.js`（按需加载 React 18 开发版 + Babel + Prism） |
| `plugins/remark-play.mjs` | 把 ```` ```jsx play ```` 代码块变成 `<Playground>` |
| `theme/` | React 薄包装组件（`components/`，在 `rspress.config.ts` 的 `globalComponents` 里注册，MDX 里不用 import）、`index.tsx`（顶栏加总进度）、`style.css`（全部样式，浅色 `:root`、深色 `html.dark`） |
| `tests/` | Playwright 测试：`lessons.mjs`（逐课）、`mechanics.mjs`（学习机制和手机宽度）、`smoke.mjs`（站点功能）、`screenshots.mjs`；`_site.mjs` 是共用的静态服务器和浏览器启动 |
| `review/` | 历次评审报告。`edu-summary.md` 末尾有修改记录；`depth.md` 是深度评估。只读参考，不是代码 |

## 架构要点

- **React 组件只是薄包装**：服务端渲染只输出占位元素；浏览器里 `useEffect` 调用引擎函数，把返回的 DOM 挂进去（`theme/lib/useSlot.ts`、`useDomSlot.ts`）。学习机制的逻辑都在引擎里，不在组件里。
- **实验台不用 iframe**：页面内按需加载 React 18.3.1 **开发版** UMD（全局 `React`、`ReactDOM`），站点自己的 React 19 与它互不干扰。必须是开发版：引擎靠拦截 `Warning:` 开头的 `console.error` 向学习者显示 React 警告。React 19 API 和服务端内容在实验台里跑不了，只能用 `code` 块展示，并在文字里说明“只能阅读”。
- **进度**只存在浏览器 `localStorage['hands-on-react-v1']`；服务端渲染时为空。依赖进度的组件挂载后才显示真实数字（`theme/lib/useProgress.ts`），避免水合不一致。进度变化发 `hoc-progress` 事件。
- **侧栏动态标记**由全局组件 `ProgressMarks` 写成属性（`data-hoc-done`、`data-hoc-due`、`data-hoc-cnt`），样式在 `theme/style.css`。
- **站内链接**：引擎拼出来的 `<a>` 带 base 和 `.html`（`course/site.js` 的 `lessonHref` 等）；全局组件 `LinkRouter` 拦截点击，交给 Rspress 的客户端路由，页面不整页刷新。
- **实验台版面**：`.hoc-slot` 是 CSS 容器，宽度不足 900px 时编辑器在上、预览在下，保证 60 字符的代码行不折行。
- **压缩不能改函数名**：练习的检查函数有依赖函数名的写法（例如 React 的组件栈要能看到 `Thrower`），所以 `rspress.config.ts` 里给压缩器设了 `keep_fnames`。不要去掉。
- **Rspress 文档表格样式**（外边距、圆角、边框）会作用于 `.rp-doc` 里的所有 `table`。自带外框的 `.tbl` 要加 `rp-not-doc` 类，否则表头上方会多出空白。

## 怎样加一课

1. 新建 `docs/lessons/<id>.mdx`，结构照抄一个现有的课（见下面“课文 MDX”）。
2. 新建 `course/lessons/<id>.js`，写数据（见“数据文件格式”）。
3. 在 `course/registry.js` 加一行 `import`，并把它放进 `LESSONS` 数组的正确位置（课号就是位置）。侧栏、首页、翻页、阶段归属（数据文件里的 `stage`，0–5）自动生效。
4. **课号是位置**：插入或移动课程后，全文搜索“第 N 课”并重新编号（`grep -rn "第 [0-9]* 课" docs course`）。毕业设计（portfolio，第 45 课）的验收表和“加分项”表引用了很多课号；首页组件树说明里写了“第 19 课”（渲染机制）。
5. 新阶段要同时改 `course/stages.js`、各阶段测验页（`docs/check/N.mdx`）和 `docs/check` 的数量。
6. 估算 `mins`：正文每 300 字约 1 分钟，可运行示例 +2，练习 +10~20，测验每题 +1。
7. `npm run build`，再 `node tests/lessons.mjs <id>`；练习必须 `PASS`。

**不要改动已有 checkOnly 题的顺序或删除中间的题**：阶段测验和间隔复习的卡片键是 `课id#cN`（N 是下标），改顺序会把学习者的复习记录错配。新题只追加到末尾。

## 课文 MDX

```mdx
---
title: "State：让组件“记住”东西"
---

# State：让组件“记住”东西

<LessonHeader />
<Warmup />
<LessonGoals />

<LessonProse>

## 小节标题

正文是普通 Markdown：段落、有序/无序列表、表格、围栏代码块、`行内代码`、**加粗**。

<CallBox kind="tip" label="要点">

提示框内容（Markdown）。kind 有 tip 要点 / warn 常见坑 / like 打个比方 / deep 深入一点。

</CallBox>

```jsx title="只读的代码块（带标题）"
const a = 1;
```

```jsx play title="示例标题"
// 可运行的实验台。说明和预测题放在数据文件的 plays 里
```

<details className="optional">
<summary><span className="opt-tag">选读</span>小节标题<small>可以先跳过，需要时再展开</small></summary>

选读内容……

</details>

</LessonProse>

<Quiz />
<Exercise />
<SelfExplain />
<LessonFooter />
```

- `<Quiz />`、`<Exercise />` 只在数据里有 `quiz`、`exercise` 时写。
- `play` 代码块：`title="…"` 是示例标题，也是数据文件 `plays` 的键；标题重名或没有标题时用 `key="#序号"`（序号从 1 起，按本课示例出现顺序）。代码作为字符串传入，不用转义 `{`、`<`。
- `<Raw html="…" tag className />`：只给带自定义结构的 HTML 用（`fig` 示意图、公式、路线图等）。能用 Markdown 写的一律用 Markdown。
- 站内链接：`[文字](/lessons/<id>)`、`/review`、`/glossary`、`/check/<0-5>`。构建会检查死链接。
- 标题里不能同时含 `"` `'` `` ` `` 三种引号（代码块标记里的 `title=` 无法转义）。

## 数据文件格式（`course/lessons/<id>.js`）

```js
export default {
  id: 'scheduler', stage: 5, title: '…', mins: 40,
  summary: '一句话',
  goals: ['能写出…', '能解释…', '能诊断…'],   // 3–4 条，可观察的动词开头
  keyPoints: ['…'],                          // 4–5 条，自我解释后展示对照
  quiz: [{ q: 'html', options: ['纯文本', …], answer: 1, explain: 'html' }],
  exercise: { task, starter, solution, hint, faded, test: async (t) => {…}, exports: ['名字'] },
  checkOnly: [{ q, options, answer, explain }],  // 阶段测验专用
  plays: {
    '示例标题': { note: '运行后再看的说明', predict: { q, options, answer, explain }, pkey: '课id|示例标题' },
  },
};
```

- 预测题：写在 `plays[标题].predict`，`pkey` 是预测键（`课id|标题`，进度里 `__pred` 用它，别改）。**被预测的代码、按钮文字、日志里不能剧透答案**，解释放进 `note`（预测后才显示）。
- `options` 是纯文本，不能写 HTML（会被转义）。`q`、`explain`、`task`、`hint` 按 HTML 渲染，写 JSX 或泛型时把 `<` 写成 `&lt;`。
- 步骤写成 Markdown 有序列表（课文）或 `<ol class="task-steps">`（`task` 里），不要用 `<br>1.` 手工编号。
- 检查函数用到的辅助函数写在数据文件顶部（模块作用域），需要引擎里的 `prepare`、`compile`、`stripComments` 就 `import … from '../engine/exec.js'`（不要 import `engine.js`：会形成循环引用）。

### 练习检查（exercise.test）

`test(t)` 拿到的工具（见 `course/engine/engine.js` 的 `makeTester`）：`t.q(sel)`、`t.qa(sel)`、`t.text(sel)`、`t.byText(tag, text)`、`t.click(x)`、`t.type(x, value)`、`t.wait(ms)`、`t.assert(cond, msg)`、`t.source`（去注释的代码）、`t.rawSource`、`t.exports`（按 `exports` 字段导出的顶层名字）、`t.root`。

- **检查行为，不查字面**：点按钮看界面变化、计渲染次数、另开 root、卸载后看定时器是否停止。`t.source` 只用作最后的补充。
- 每改一道检查，要实测：参考答案通过；起始代码被拒，失败信息指向概念；常见错误和投机写法被拒；至少一种合理的不同写法通过。
- 失败信息是纯文本（会被转义）。
- `faded` 是人工挖空的半成品，用 `/* ✏️ 说明 */` 标记要补的 2–4 个关键行。

## 学习机制（不要破坏）

课程按学习科学设计，用户明确要求保留：

- 先预测再运行：预测前隐藏说明。
- 课前热身（提取练习）和间隔复习：答错的题第二天再出；12 小时内答过的不再出；只有到期的卡片才提升复习间隔。
- 测验答错不亮正确答案，重试时隐藏上次选的项。
- 提示阶梯：`[提示, 失败 1 次], [半成品, 失败 2 次且 2 分钟], [参考答案, 失败 3 次且 5 分钟]`；只有代码真的改了（去掉注释、空白、分号、逗号后不同）才算一次失败。粘贴参考答案原文不能通过，除非看过答案后按了“重置”自己重写；借助答案完成会单独标记。
- 自我解释：至少 30 个有效字（重复字折叠，不同字少于 10 个会被压低）才展示参考要点。
- 阶段测验：12 题（8 道新题优先没见过的 + 4 道常规题），交卷后才显示解析，80% 通过；中途离开算未通过；未通过要等 30 分钟；以最近一次为准；35 天后提示复测。

改引擎后跑 `node tests/mechanics.mjs`，它覆盖了以上大部分规则和 390px 宽度下无横向滚动。

## 写作规范

- 中文，约 80% 遵循 ASD-STE100 简化技术语言：一句一个意思，短句（尽量 ≤30 字），主动语态，固定术语。比喻和动机段落可以灵活，但同一个比喻不要用在两个概念上（已用过：遥控器、自动售货机、银行柜台等）。
- 步骤写成有序列表，不要用 `<br>1.` 手工编号。
- 术语与 `course/glossary.js` 一致：set 函数（不写 setState/setter）、唯一数据源、无障碍（不写可访问性）、记忆化（指 memo/useMemo/useCallback 时不写缓存）、卸载（不写销毁）、重新渲染（不写重渲染）、渲染/提交、过渡更新。写“React 18 中”，不写“18 里”。新概念第一次出现给一句定义。
- 学习目标用“能写出 / 能解释 / 能诊断 / 能判断……”开头。
- 测验干扰项来自真实误解；正确项的位置和长度不要有规律；`explain` 说明为什么对，并点出最迷惑的错误项错在哪。
- 技术准确，区分 React 18 与 19。尚未联网核实的两处：第 39 课 Next.js 16 的缓存 API 名称、第 43 课 React 19 的 onCaughtError/onUncaughtError 细节。

## 发布

- 推送到 `main` 时，`.github/workflows/deploy.yml` 构建并部署到 GitHub Pages（仓库 Settings → Pages → Source 选 “GitHub Actions”）。站点地址 `https://<用户>.github.io/hands-on-react/`；base 在 `course/site.js`，换仓库名要同步改。
- `doc_build/` 是纯静态文件，也可以放到任何静态托管（注意保持 base 路径）。
- 学习进度存在浏览器 localStorage，不同网址的进度不互通。
