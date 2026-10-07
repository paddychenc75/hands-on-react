# AGENTS.md：维护“动手学 React”课程

这是一套中文交互式 React 课程：46 课，6 个阶段（入门、进阶、高级、原理与架构、生态与实战、深入）。站点用 **Rspress 2**（React + MDX）构建，静态发布到 GitHub Pages。课文是 MDX，每课的非正文数据（测验、练习、预测题等）在 TypeScript 数据文件里，引擎逻辑在 `course/engine/`。

用户用中文交流。回复、提交信息和课程文字都用中文。本文件是唯一的规则源：`CLAUDE.md` 只导入它，Codex 等其他 agent 直接读它。

## 先记住这几条

1. **加课用脚手架**：`npm run new-lesson -- …`（见「怎样加一课」），不要手工拼多处。
2. **提交前跑 `npm run check`**（约 2 秒）：类型、Biome、内容校验、单元测试。`npm test` 是完整流程（还要构建和浏览器测试）。
3. **复习卡片键 `课id#N` / `课id#cN` 不能变**：已有题的顺序不能调换、不能删中间的题，新题只追加到 `quiz` / `checkOnly` 的末尾（见「卡片键快照」）。
4. **改引擎先改单元测试**，再改代码，最后跑 `npm run test:e2e -- mechanics`（见「改引擎的流程」）。
5. **“学习机制”一节的规则不能破坏**，那是用户明确要求保留的。

## 命令

```bash
npm install                        # 第一次；会自动启用提交前钩子（见下）
npx playwright install chromium    # 第一次（浏览器测试用）
```

| 命令 | 什么时候用 | 耗时 |
|---|---|---|
| `npm run dev` | 写课、改样式、改组件。热更新。端口默认 4321，已有人开着就别杀它，换端口：`npm run dev -- --port 4400` | 启动几秒 |
| `npm run build` | 构建到 `doc_build/`（base 是 `/hands-on-react/`）。MDX 编译错误和死链接都会让构建失败 | 约 2 秒 |
| `npm run preview` | 预览构建结果（`http://localhost:4173/hands-on-react/`） | 即时 |
| `npm run typecheck` | `tsc --noEmit`。数据文件字段写错、漏字段、类型不对会在这里报错 | 约 1 秒 |
| `npm run lint` | Biome：格式 + 静态检查。要自动修格式：`npm run format` | 不到 1 秒 |
| `npm run check:content` | 内容校验（不需要浏览器）：课与 MDX 一一对应、play 示例的键、题目选项和答案、卡片键快照、“第 N 课”引用等 | 不到 1 秒 |
| `npm run test:unit` | Vitest 单元测试：SRS、提示阶梯、自我解释、阶段测验等纯逻辑 | 不到 1 秒 |
| **`npm run check`** | typecheck + lint + check:content + test:unit。**每次提交前跑** | 约 2 秒 |
| `npm run test:e2e` | 浏览器测试（Playwright），读 `doc_build/`，**先 `npm run build`**；需要联网 | 全部约 2.5 分钟 |
| `npm run test:e2e -- lessons state use-effect` | 只测指定课（逐课测试） | 每课几秒 |
| `npm run test:e2e -- mechanics smoke` | 只跑学习机制 / 冒烟测试 | 各约 1 分钟 |
| **`npm test`** | check + build + test:e2e，**完整验收**。改引擎、主题组件、样式后必跑 | 约 3 分钟 |
| `npm run new-lesson -- <课id> --stage <0-5> --after <已有课id> --title "标题"` | 加一课 | 即时 |
| `npm run gen` | 重新生成 `course/lessons.generated.ts`（dev、build 会自动跑；一般不用手动） | 即时 |
| `npm run screenshots` | 重新生成 `tests/screenshots/` 里的截图，改版面后人工看一眼 | 约 1 分钟 |

- `npm run test:e2e` 的用法：`-- <套件> [课id …]`，套件是 `lessons`（课 id 跟在后面）、`mechanics`、`smoke`，可以写多个；不写就三个都跑。
- 浏览器测试需要网络：实验台从 cdn.jsdelivr.net 加载 React 18.3.1 开发版、Babel、Prism。
- 测试默认用内置静态服务器托管 `doc_build`（按 base 挂载）；也可以 `SITE_URL=http://localhost:4173/hands-on-react/ npm run test:e2e` 测已运行的站点。想用本机 Chrome：`CHROMIUM=/path/to/chrome npm run test:e2e`。
- 期望结果：`lessons` 最后一行 `lessons 46 with issues 0`；`mechanics`（8 项）和 `smoke`（49 项）最后一行 `全部通过`。`PAGEERR` 行（boom、网络错误、天气服务超时、toUpperCase、测试用的渲染错误）是课程示例故意抛出的错误，不算问题。
- Node 版本：`.nvmrc` 是 24，`engines` 要求 `>=24`。脚本（`check:content`、`new-lesson`）靠 Node 的类型剥离直接读 `.ts`，所以需要 Node 24 以上。
- **提交前钩子**：`npm install` 的 `prepare` 会把 `core.hooksPath` 设为 `.githooks/`，每次提交前自动跑 `npm run lint` 和 `npm run check:content`（几秒）。CI 里和没有 `.git` 的环境不会启用。紧急跳过：`git commit --no-verify`。
- **格式化提交**：`.git-blame-ignore-revs` 记着“只改格式”的提交；本地用 `git config blame.ignoreRevsFile .git-blame-ignore-revs`，GitHub 网页会自动读取。

## 目录约定

| 位置 | 放什么 | 不放什么 |
|---|---|---|
| `docs/` | Rspress 文档根。`lessons/<id>.mdx` 课文；`index.mdx` 首页；`review.mdx` 今日复习；`glossary.mdx` 术语表；`check/0..5.mdx` 六个阶段测验页；`_nav.json` 顶部导航 | 题目、练习、预测题（放数据文件） |
| `course/types.ts` | 课程数据和进度存储的**全部类型**（`Lesson`、`QuizItem`、`Exercise`、`Predict`、`PlayMeta`、`GlossaryEntry`、`Stage`、`Progress`、`SrsCard`…） | 逻辑 |
| `course/order.ts` | **唯一的课程顺序**（课 id 数组，课号 = 位置）。阶段归属在每课数据文件的 `stage` | 课的内容 |
| `course/lessons/<id>.ts` | 每课的非正文数据，`export default {…} satisfies Lesson`。只放课文件 | 共用的辅助模块（会被当成一课收集进注册表） |
| `course/lessons.generated.ts` | **自动生成**，收集 `course/lessons/*.ts`。不要手改 | — |
| `course/registry.ts` | `LESSONS`（按顺序）、`lessonNo(id)`、`lessonById(id)`、`LESSON_ORDER` | — |
| `course/stages.ts`、`glossary.ts`、`site.ts` | 6 个阶段、术语表、站点常量（base、链接工具） | — |
| `course/card-keys.snapshot.json` | 复习卡片键快照，**提交进仓库**，由脚本更新（见「卡片键快照」） | 手改 |
| `course/engine/logic/` | **纯函数**：不碰 DOM、localStorage，不读 `Date.now()`（时间由参数传入）。有单元测试，`tests/unit/purity.test.ts` 会挡住副作用；`tests/unit/cycles.test.ts` 检查全仓库没有循环依赖 | DOM、存储、`window` |
| `course/engine/*.ts` | 会碰 DOM / 存储的引擎模块，模块清单见下面「引擎模块」 | 业务规则（放进 `logic/` 并写测试） |
| `plugins/remark-play.mjs` | 把 ```` ```jsx play ```` 代码块变成 `<Playground>` | — |
| `theme/` | React 薄包装组件（`components/`，在 `rspress.config.ts` 的 `globalComponents` 里注册，MDX 里不用 import）、`lib/` 钩子、`index.tsx`（顶栏加总进度）、`style.css`（全部样式，浅色 `:root`、深色 `html.dark`） | 学习机制的逻辑 |
| `scripts/` | `check-content.mjs`、`new-lesson.mjs`、`gen-registry.mjs`、`setup-hooks.mjs`，`lib/` 是它们共用的 | — |
| `tests/unit/` | Vitest 单元测试（`*.test.ts`） | 需要浏览器的测试 |
| `tests/e2e/` | Playwright 测试：`lessons.mjs`、`mechanics.mjs`、`smoke.mjs`，`screenshots.mjs`，`run.mjs` 是入口，`_site.mjs` 是共用的静态服务器和浏览器启动 | — |
| `tests/screenshots/` | 截图（人工看版面用） | — |
| `review/` | 历次评审报告。只读参考，不是代码，不检查 | — |
| `.github/` | `workflows/ci.yml`（check + e2e）、`deploy.yml`（CI 通过后部署）、`dependabot.yml` | — |
| `doc_build/` | 构建产物，不提交 | — |

### 引擎模块（`course/engine/`）

| 模块 | 职责 |
|---|---|
| `index.ts` | 对外出口：`theme/` 只从这里 import |
| `store.ts` | 进度存储（`localStorage['hands-on-react-v1']`）、`lp(id)`、进度变化事件 |
| `util.ts` | DOM 小工具（`el`、`toast`、`highlight`…） |
| `exec.ts` | 代码预处理和编译（`prepare`、`compile`、`stripComments`）。练习的检查函数也 import 它 |
| `runtime.ts` | 按需加载 React 18 开发版 + Babel + Prism |
| `runner.ts` | 执行学习者的代码、收集控制台和错误（`Runner`） |
| `editor.ts` | 代码编辑器（textarea 叠加高亮） |
| `playground.ts` | 实验台，含“先预测再运行” |
| `tester.ts` | 练习检查工具 `t.*`（`makeTester`） |
| `exercise.ts` | 练习：任务、检查答案、提示阶梯 |
| `question.ts` / `quiz.ts` / `warmup.ts` / `review.ts` / `stageCheck.ts` | 题目共用组件 / 课内测验 / 课前热身 / 复习页 / 阶段测验 |
| `cards.ts` | 间隔复习卡片的读写（`__srs`），卡片键对应回题目 |
| `completion.ts` | 一课的完成判定和“掌握标准”条 |
| `selfExplain.ts` | 自我解释 |
| `terms.ts` | 术语标注 |
| `home.ts` / `reading.ts` / `counts.ts` | 首页组件树 / 阅读位置 / 侧栏和顶栏的数字 |
| `logic/srs.ts` | SRS 间隔推进、到期判断、热身选题 |
| `logic/ladder.ts` | 提示阶梯解锁、“代码是否真的改了”、半成品示例 |
| `logic/selfExplain.ts` | 自我解释有效字数 |
| `logic/stageCheck.ts` | 阶段测验抽题、及格、冷却、复测、交卷记录 |
| `logic/random.ts` / `text.ts` / `errors.ts` | 洗牌和种子随机 / 转义和选项格式 / 错误信息中文解释 |

**不允许循环依赖**：`logic/` 只依赖 `logic/` 里的纯文件、类型和 `exec.ts`；DOM 模块之间只能单向依赖（例如 `quiz.ts` → `completion.ts`，反过来不行）。数据文件只能 import `../engine/exec.ts`（不要 import 引擎别的模块：会形成循环引用）。

## 怎样加一课

```bash
npm run new-lesson -- hooks-recap --stage 1 --after custom-hooks --title "Hook 复盘"
```

脚本做的事：生成 `docs/lessons/<id>.mdx`（含 `LessonHeader`/`Warmup`/`LessonGoals`/`LessonProse`、一个 `play` 示例、`Quiz`/`Exercise`/`SelfExplain`/`LessonFooter`）和 `course/lessons/<id>.ts`（所有字段都有，文字是“【待写】”占位，练习是一个能通过的小例子），在 `course/order.ts` 里 `--after` 那一课后面登记，更新 `lessons.generated.ts` 和卡片键快照。侧栏、首页、翻页、热身、阶段测验自动生效。

然后：

1. 把所有“【待写】”换成真内容（`npm run check:content` 会提示哪些课还有占位）。写作规范见下。
2. **课号是位置**：插在中间会让后面的课号 +1。脚本会列出写了“第 N 课”且 N ≥ 新课号的位置；`check:content` 也会报“第 N 课《标题》”和“第 N 课“词””对不上的引用。逐个核对。毕业设计（portfolio）的验收表引用了很多课号；`theme/components/HomePage.tsx` 里写了“第 19 课”（渲染机制）。另外，`engineering`（第 31 课，第 5 阶段第一课）和 `project-weather`（第 37 课，第 5 阶段最后一课）有本机操作的命令、配置和版本要求，写进去前要对照官方文档核对。
3. 估算 `mins`：正文每 300 字约 1 分钟，可运行示例 +2，练习 +10~20，测验每题 +1。
4. 新阶段要同时改 `course/stages.ts` 和新建 `docs/check/N.mdx`（阶段测验页，照抄现有的）；`new-lesson` 和 `check:content` 读 `STAGES.length`，不用改。
5. `npm run check` → `npm run build` → `npm run test:e2e -- lessons <id>`（练习必须 `PASS`）。
6. 提交时新卡片键已经在快照里（脚本更新过），确认 `course/card-keys.snapshot.json` 一起提交。

手工加课也行：建 mdx 和数据文件、在 `order.ts` 加一行、`npm run gen`、`npm run check:content -- --update`。

## 改已有的课

- **不要改动已有 `quiz`、`checkOnly` 题的顺序，也不要删中间的题**。新题只追加到末尾。`check:content` 会拦住。
- 改题干的错别字：`npm run check:content -- --update --force`（它把已有键的指纹改成新的）。换了题就不是改错别字：追加新题，旧题留着或改成不会误导的说法。
- 改 `plays` 的键 / 示例标题 / `pkey`：`pkey` 是学习者进度里 `__pred` 的键，**不要改**；示例改名只改 `title`，`pkey` 保持原样（`predict.title` 可以覆盖显示的标题）。MDX 里 play 的标题和数据 `plays` 的键必须一致，`check:content` 会查。
- 改练习的检查函数：见下「练习检查」，必须实测（参考答案通过、起始代码被拒等）。
- 改了任何课：`npm run check` → `npm run build` → `npm run test:e2e -- lessons <id>`。
- 课文文字改动要遵守「写作规范」；术语与 `course/glossary.ts` 一致。

## 改引擎的流程

1. 先看这条规则属于哪一块。纯计算（不碰 DOM、存储、时间）放 `course/engine/logic/`；要读写进度或 DOM 的放对应 DOM 模块。
2. **先加/改单元测试**（`tests/unit/*.test.ts`），写出期望的新行为，跑 `npm run test:unit` 看它失败。
3. 改代码，让单元测试通过。时间用参数传入（`now`），不要在 `logic/` 里读 `Date.now()`。
4. `npm run check`（类型、Biome、校验、单元测试）。
5. `npm run build`，再 `npm run test:e2e -- mechanics smoke`；改动大就跑完整 `npm test`。
6. 如果代码行为和下面的「学习机制」描述不一致：不要悄悄改其中一边，先搞清楚哪个是用户要的，再同步两边。

## 类型检查的严格程度

`tsconfig.json`：`strict: true`，但 **`strictNullChecks: false`、`noImplicitAny: false`、`useUnknownInCatchVariables: false`**；另开 `verbatimModuleSyntax`、`erasableSyntaxOnly`（保证 Node 能直接读 `.ts`）。原因：

- 引擎是从旧 DOM 代码搬来的（`querySelector` 到处返回可能为空的元素），开 `strictNullChecks` 要加几百个断言，收益小。
- 每课 `exercise.test` 是几十行的旧式 DOM 检查脚本，局部辅助函数没有写参数类型，开 `noImplicitAny` 要给 200 多处补注解。
- 保留的检查已经能抓结构性错误：数据文件字段名写错、漏字段、类型不对（`satisfies Lesson`），引擎函数签名和 `Progress` 结构不匹配等。引擎模块的函数参数和返回值都写了类型。
- 浏览器里的 `window.React/ReactDOM/Babel/Prism` 和练习里的 `t.q()` 结果按 `any` 声明（边界），其余尽量不用 `any`。

以后收紧的顺序建议：先给 `logic/` 之外的引擎模块开 `noImplicitAny`，再考虑 `strictNullChecks`。

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

- MDX 全局组件（不用 import）：`Playground`（由 `play` 代码块生成）、`Quiz`、`Exercise`、`Warmup`、`SelfExplain`、`CallBox`、`Raw`、`LessonHeader`、`LessonGoals`、`LessonProse`、`LessonFooter`；页面级的 `HomePage`、`ReviewPage`、`GlossaryPage`、`StageCheck` 只用在首页、复习页、术语表和阶段测验页。
- `<Quiz />`、`<Exercise />` 只在数据里有 `quiz`、`exercise` 时写（`check:content` 会检查两边对得上）。
- `play` 代码块：`title="…"` 是示例标题，也是数据文件 `plays` 的键；标题重名或没有标题时用 `key="#序号"`（序号从 1 起，按本课示例出现顺序）。代码作为字符串传入，不用转义 `{`、`<`。同一课里键必须唯一。
- `<Raw html="…" tag className />`：只给带自定义结构的 HTML 用（`fig` 示意图、公式、路线图等）。能用 Markdown 写的一律用 Markdown。
- 站内链接：`[文字](/lessons/<id>)`、`/review`、`/glossary`、`/check/<0-5>`。构建会检查 MDX 里的死链接；`check:content` 另外检查数据文件和 `<Raw html>` 里的链接。
- 标题里不能同时含 `"` `'` `` ` `` 三种引号（代码块标记里的 `title=` 无法转义）。
- front matter 的 `title`、`# 一级标题`、数据文件的 `title` 三处必须一致（`check:content` 会检查）。

## 数据文件（`course/lessons/<id>.ts`）

```ts
import type { Lesson } from '../types.ts';
export default {
  id: 'scheduler', stage: 5, title: '…', mins: 40, summary: '…',
  goals: [...], keyPoints: [...], quiz: [...], exercise: {...}, checkOnly: [...], plays: {...},
} satisfies Lesson;
```

**字段、含义和类型以 `course/types.ts` 为准**（不在这里重复抄字段表）。写法要点：

- 预测题：写在 `plays[标题].predict`，`pkey` 是预测键（`课id|标题`，进度里 `__pred` 用它，别改）。**被预测的代码、按钮文字、日志里不能剧透答案**，解释放进 `note`（预测后才显示）。
- `options` 是纯文本，不能写 HTML（会被转义）。`q`、`explain`、`task`、`hint` 按 HTML 渲染，写 JSX 或泛型时把 `<` 写成 `&lt;`。
- 步骤写成 Markdown 有序列表（课文）或 `<ol class="task-steps">`（`task` 里），不要用 `<br>1.` 手工编号。
- `goals` 3–4 条，可观察的动词开头；`keyPoints` 4–5 条，自我解释后展示对照。
- 检查函数用到的辅助函数写在数据文件顶部（模块作用域），需要引擎里的 `prepare`、`compile`、`stripComments` 就 `import … from '../engine/exec.ts'`。
- 字段写错会被 `npm run typecheck` 拦住；选项数、`answer` 下标、`explain` 非空等由 `npm run check:content` 检查。

### 练习检查（`exercise.test`）

`test(t)` 拿到的工具（类型是 `course/types.ts` 的 `Tester`，实现在 `course/engine/tester.ts` 的 `makeTester`）：`t.q(sel)`、`t.qa(sel)`、`t.text(sel)`、`t.byText(tag, text)`、`t.click(x)`、`t.type(x, value)`、`t.wait(ms)`、`t.assert(cond, msg)`、`t.source`（去注释的代码）、`t.rawSource`、`t.exports`（按 `exports` 字段导出的顶层名字）、`t.root`。

- **检查行为，不查字面**：点按钮看界面变化、计渲染次数、另开 root、卸载后看定时器是否停止。`t.source` 只用作最后的补充。
- 每改一道检查，要实测：参考答案通过；起始代码被拒，失败信息指向概念；常见错误和投机写法被拒；至少一种合理的不同写法通过。
- 失败信息是纯文本（会被转义）。
- `faded` 是人工挖空的半成品，用 `/* ✏️ 说明 */` 标记要补的 2–4 个关键行。

## 卡片键快照（`course/card-keys.snapshot.json`）

间隔复习和阶段测验按卡片键存学习者的记录：随堂测验第 N 题是 `课id#N`，阶段测验读代码题（`checkOnly`）第 N 题是 `课id#cN`（N 是下标）。键一旦发布就**不能消失、不能换位置**，否则学习者的复习记录会错配到别的题上。

快照记录每个键，和这道题**题干文字的指纹**（8 位哈希）。`npm run check:content` 对照它：

- 键消失（删了题、删了课）→ 报错。
- 键的指纹变了（调换顺序、换了题）→ 报错，会指出“现在放的是原来 X 的题”。
- 预测键（`pkey`）消失（删了示例、改了 `pkey`）→ 报错。
- 追加了新题（或新课）→ 报错提示“还没记进快照”：确认都追加在末尾后，运行 **`npm run check:content -- --update`**（只追加新键），把快照一起提交。`new-lesson` 已经替你做了。
- 只是改了题干的错别字：`npm run check:content -- --update --force`，会重写已有键的指纹。换了题不要用它。

## 学习机制（不要破坏）

课程按学习科学设计，用户明确要求保留。实现在 `course/engine/`，纯逻辑部分有单元测试（`tests/unit/`）：

- 先预测再运行：预测前隐藏说明。
- 课前热身（提取练习）和间隔复习：答错的题第二天再出；12 小时内答过的不再出；只有到期的卡片才提升复习间隔。（实现：`logic/srs.ts`。注意这三条在代码里只对**课前热身**成立：复习页的“混合练习”和阶段测验答对任何卡片都会升盒，不管到没到期。见下面「已知的文档与代码差异」。）
- 间隔序列：盒子 0..5 对应 0/1/3/7/16/35 天。答对进下一个盒子（到顶不再升），答错回到盒子 0 并安排明天再出。
- 测验答错不亮正确答案，重试时隐藏上次选的项。
- 提示阶梯：`[提示, 失败 1 次], [半成品, 失败 2 次且 2 分钟], [参考答案, 失败 3 次且 5 分钟]`（分钟从第一次失败算起）；只有代码真的改了（去掉注释、空白、分号、逗号后不同）才算一次失败。粘贴参考答案原文不能通过，除非看过答案后按了“重置”自己重写；借助答案完成会单独标记。（实现：`logic/ladder.ts`。）
- 自我解释：至少 30 个有效字（去掉空白和标点，连续重复的字折叠；不同字少于 10 个会被压低到最多 9）才展示参考要点。（实现：`logic/selfExplain.ts`。）
- 阶段测验：12 题（8 道新题优先没见过的 + 4 道常规题），交卷后才显示解析，80% 通过（12 题要答对 10 题）；中途离开算未通过；未通过要等 30 分钟；以最近一次为准；35 天后提示复测。（实现：`logic/stageCheck.ts`。）

改引擎后跑 `npm run test:unit` 和 `npm run test:e2e -- mechanics`；后者覆盖提示阶梯、自我解释门槛、阶段测验 12 题、交卷前不显示答案、中途离开冷却，以及 390px 宽度下无横向滚动。

### 已知的文档与代码差异（只记录，没有改）

- “12 小时内答过的不再出”“只有到期的卡片才提升复习间隔”只在课前热身里成立（`warmupPool`、`shouldRecordWarmup`）。复习页的混合练习和阶段测验对任意卡片调用 `srsRecord`，答对就升盒。如果想让它们也只在到期时才升盒，要同时改代码和测试。
- `SRS_DAYS[0] = 0` 没用上：答错固定“明天再出”（1 天），盒子 0 的间隔不参与计算。
- “以最近一次为准”：提示阶梯的“真的改了”只和起始代码、上一次失败的代码比较，来回改两份失败的代码，每次都算一次失败。
- 交卷通过后 `weak`（需要加强的课）不会清掉，旧的列表会留在记录里（不影响显示：只在未通过的冷却页用）。

## 写作规范

- 中文，约 80% 遵循 ASD-STE100 简化技术语言：一句一个意思，短句（尽量 ≤30 字），主动语态，固定术语。比喻和动机段落可以灵活，但同一个比喻不要用在两个概念上（已用过：遥控器、自动售货机、银行柜台等）。
- 步骤写成有序列表，不要用 `<br>1.` 手工编号。
- 术语与 `course/glossary.ts` 一致：set 函数（不写 setState/setter）、唯一数据源、无障碍（不写可访问性）、记忆化（指 memo/useMemo/useCallback 时不写缓存）、卸载（不写销毁）、重新渲染（不写重渲染）、渲染/提交、过渡更新。写“React 18 中”，不写“18 里”。新概念第一次出现给一句定义。
- 学习目标用“能写出 / 能解释 / 能诊断 / 能判断……”开头。
- 测验干扰项来自真实误解；正确项的位置和长度不要有规律；`explain` 说明为什么对，并点出最迷惑的错误项错在哪。
- 技术准确，区分 React 18 与 19。

## 架构要点

- **React 组件只是薄包装**：服务端渲染只输出占位元素；浏览器里 `useEffect` 调用引擎函数，把返回的 DOM 挂进去（`theme/lib/useSlot.ts`、`useDomSlot.ts`）。学习机制的逻辑都在引擎里，不在组件里。**不要把交互组件改写成纯 React**。
- **实验台不用 iframe**：页面内按需加载 React 18.3.1 **开发版** UMD（全局 `React`、`ReactDOM`），站点自己的 React 19 与它互不干扰。必须是开发版：引擎靠拦截 `Warning:` 开头的 `console.error` 向学习者显示 React 警告。React 19 API 和服务端内容在实验台里跑不了，只能用 `code` 块展示，并在文字里说明“只能阅读”。
- **进度**只存在浏览器 `localStorage['hands-on-react-v1']`（键和结构不要改，结构见 `course/types.ts` 的 `Progress`）；服务端渲染时为空。依赖进度的组件挂载后才显示真实数字（`theme/lib/useProgress.ts`），避免水合不一致。进度变化发 `hoc-progress` 事件。
- **侧栏**由 `rspress.config.ts` 从 `course/order.ts`（顺序）和每课的 `stage` 生成，不用手写；动态标记由全局组件 `ProgressMarks` 写成属性（`data-hoc-done`、`data-hoc-due`、`data-hoc-cnt`），样式在 `theme/style.css`。
- **课程注册表自动收集**：`course/lessons/*.ts` → `scripts/gen-registry.mjs` → `course/lessons.generated.ts`（提交进仓库）。选生成脚本而不是 `import.meta.webpackContext`：rspress dev/build、Vitest、node 脚本和 tsc 要读同一份课程表，没有一种目录收集写法四处都能用。`dev`/`build` 前自动重新生成，`check:content` 检查它是否最新。
- **站内链接**：引擎拼出来的 `<a>` 带 base 和 `.html`（`course/site.ts` 的 `lessonHref` 等）；全局组件 `LinkRouter` 拦截点击，交给 Rspress 的客户端路由，页面不整页刷新。
- **实验台版面**：`.hoc-slot` 是 CSS 容器，宽度不足 900px 时编辑器在上、预览在下，保证 60 字符的代码行不折行。
- **压缩不能改函数名**：练习的检查函数有依赖函数名的写法（例如 React 的组件栈要能看到 `Thrower`），所以 `rspress.config.ts` 里给压缩器设了 `keep_fnames`。不要去掉。
- **Rspress 文档表格样式**（外边距、圆角、边框）会作用于 `.rp-doc` 里的所有 `table`。自带外框的 `.tbl` 要加 `rp-not-doc` 类，否则表头上方会多出空白。
- **Biome 配置**（`biome.jsonc`）：2 空格、单引号、分号、尾逗号，行宽 160。`course/lessons/**` 只保留结构性检查（里面的 `exercise.test` 是旧式检查脚本，改写法有改变行为的风险）；`style.css`、MDX、快照、生成文件不检查。数据文件里的示例代码都在字符串里，格式化不会改变字符串内容。

## 发布

- 推送到 `main` 后，`ci.yml` 先跑 `check` 和 `e2e` 两个 job；全部通过后 `deploy.yml` 把 CI 构建好的站点发布到 GitHub Pages（不重复构建）。pull request 只跑 CI，不部署。
- 第一次要在仓库 **Settings → Pages → Source** 选 “GitHub Actions”。站点地址 `https://<用户>.github.io/hands-on-react/`；base 在 `course/site.ts`，换仓库名要同步改。
- 依赖更新：Dependabot（`.github/dependabot.yml`，npm 和 GitHub Actions，每周一次，同类合并成一个 PR）。
- `doc_build/` 是纯静态文件，也可以放到任何静态托管（注意保持 base 路径）。
- 学习进度存在浏览器 localStorage，不同网址的进度不互通。
- 仓库还没有 `LICENSE`：公开仓库之前由所有者自己选择许可证。
