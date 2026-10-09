# AGENTS.md：维护“动手学 React”课程

这是一套中文交互式 React 课程：50 课，6 个阶段（入门、Hooks 与数据流、渲染与性能、应用架构与全栈 React、生态与实战、深入专题与毕业设计）。站点用 **Rspress 2**（React + MDX）构建，静态发布到 GitHub Pages。课文是 MDX，每课的非正文数据（测验、练习、预测题等）在 TypeScript 数据文件里，引擎逻辑在 `course/engine/`。

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
| `npm run test:variants [-- 课id]` | 回归 `tests/variants/` 里记录的练习/变式练习变体（参考答案通过、起始代码被拒、常见错误被拒、不同写法通过）。不需要 build，较慢，不在 `npm test` 里 | 约 1–5 分钟 |
| `node tests/e2e/try.mjs <课id> <ex \| drill:N> <变体文件>` | 写或改练习检查时的快速试验台：不需要 build，几秒出结果；`--throttle 4` 降 CPU，`--reps 3` 重复 | 几秒 |
| `npm run test:e2e -- mechanics smoke` | 只跑学习机制 / 冒烟测试 | 各约 1 分钟 |
| **`npm test`** | check + build + test:e2e，**完整验收**。改引擎、主题组件、样式后必跑 | 约 3 分钟 |
| `npm run new-lesson -- <课id> --stage <0-5> --after <已有课id> --title "标题"` | 加一课 | 即时 |
| `npm run mins [-- --write] [课id …]` | 按公式重新计算每课 `mins`，输出“现值 / 公式值 / 偏差”；`--write` 只回写偏差超过 ±20% 的课（写完要 `npm run gen`） | 即时 |
| `npm run gen` | 重新生成 `course/lessons.*generated.ts`（Node 端课表、轻量目录、课 chunk 映射；dev、build 会自动跑；一般不用手动） | 即时 |
| `npm run screenshots` | 重新生成 `tests/screenshots/` 里的截图，改版面后人工看一眼 | 约 1 分钟 |

- `npm run test:e2e` 的用法：`-- <套件> [课id …]`，套件是 `lessons`（课 id 跟在后面）、`mechanics`、`smoke`、`runtime`（实验台运行时：版本固定为 19.3.0、全局没有 `window.React`、跳转后仍正常、警告显示、资源被拦截、react-19 一课的示例和练习）、`libs`（第三方库：按需加载、版本标记、router、tanstack-query、state-architecture、form-architecture 四课的真库示例与预测题答案、库文件被拦截、tanstack-query 的练习），`drillhub`（变式练习的入口与标记：侧栏“变式 x/y”随进度变化、`/drills` 总览页列出全部变式并跳转到位、首页统计与阶段变式数、课头的变式时间、打开总览页和首页不加载课数据 chunk、手机宽度无横向滚动；截图存 `tests/screenshots/drills-*.png`），`drills`（变式练习区的显示、简化提示规则、变式通过不影响本课完成、旧进度没有 `dr` 字段时一切正常、手机宽度无横向滚动）、`throttle`（4 倍 CPU 节流下 scheduler、concurrent、use-effect、suspense-data、animation 的参考答案仍通过），`sync`（跨设备同步：两个设备上下文、假 Gist 服务、各类错误、令牌不泄露、导出导入、多标签页；截图存 `tests/screenshots/sync-*.png`），`split`（课数据按课拆分：首页不加载课数据、一课只请求自己的 chunk、复习页和阶段测验页只请求需要的课、静态 HTML 里有课标题摘要目标、无水合警告、慢网和拦截 chunk 时的加载状态与重试、旧进度显示一致；截图存 `tests/screenshots/split-*.png`），`animation`（动画与过渡一课：六个示例的行为、四道预测题的答案、没有 View Transition API 时更新照常、开启减少动画后 React 不会自动关动画；用 Chromium 的 View Transition API，共享元素用真实鼠标点击），`hero`（回首页和课程地图的入口：顶栏站名、侧栏和手机菜单里的“课程首页”、面包屑阶段链接指向 `/roadmap#stage-N`；rendering 一课里的组件树：自动演示只播一次、点击范围与计数、memo、连点、键盘、减少动画、手机宽度、离开再回来、切后台、长任务；`HERO_SHOTS=1 node tests/e2e/hero.mjs` 还会重拍 `tests/screenshots/hero-*.png`），`home`（首页短片：静态 HTML 里有全部幕的文案、没有 JS 时可读、首次进入约 1.2 秒后自动播放且整片真实速度放完用时 45–60 秒、用户接管不抢滚动、控制条各项功能、各种不自动播放的情形、自动与手动同一画面、390/360/横屏无横向滚动、Tab 走完、CLS/长任务/帧间隔、首页 chunk 与主包体积；约 3 分钟），可以写多个；不写就十二个都跑。`lessons` 现在对每道变式练习也填参考答案要求通过、填起始代码要求被拒。
- 浏览器测试需要网络：实验台从 cdn.jsdelivr.net 加载 Babel、Prism；React 19.3.0 的开发版是站内静态文件（`doc_build/runtime/`，构建时生成），不走 CDN。
- 测试默认用内置静态服务器托管 `doc_build`（按 base 挂载）；也可以 `SITE_URL=http://localhost:4173/hands-on-react/ npm run test:e2e` 测已运行的站点。想用本机 Chrome：`CHROMIUM=/path/to/chrome npm run test:e2e`。
- 期望结果：`lessons` 最后一行 `lessons 50 with issues 0`；`mechanics`（8 项）和 `smoke`（50 项）最后一行 `全部通过`。`PAGEERR` 行（boom、网络错误、天气服务超时、toUpperCase、测试用的渲染错误）是课程示例故意抛出的错误，不算问题。
- Node 版本：`.nvmrc` 是 24，`engines` 要求 `>=24`。脚本（`check:content`、`new-lesson`）靠 Node 的类型剥离直接读 `.ts`，所以需要 Node 24 以上。
- **提交前钩子**：`npm install` 的 `prepare` 会把 `core.hooksPath` 设为 `.githooks/`，每次提交前自动跑 `npm run lint` 和 `npm run check:content`（几秒）。CI 里和没有 `.git` 的环境不会启用。紧急跳过：`git commit --no-verify`。
- **格式化提交**：`.git-blame-ignore-revs` 记着“只改格式”的提交；本地用 `git config blame.ignoreRevsFile .git-blame-ignore-revs`，GitHub 网页会自动读取。

## 目录约定

| 位置 | 放什么 | 不放什么 |
|---|---|---|
| `docs/` | Rspress 文档根。`lessons/<id>.mdx` 课文；`index.mdx` 首页（滚动叙事）；`roadmap.mdx` 课程地图（统计、学习方法、六阶段地图和各阶段进度，原来首页的内容）；`review.mdx` 今日复习；`glossary.mdx` 术语表；`drills.mdx` 变式练习总览；`check/0..5.mdx` 六个阶段测验页；`_nav.json` 顶部导航 | 题目、练习、预测题（放数据文件） |
| `course/types.ts` | 课程数据和进度存储的**全部类型**（`Lesson`、`QuizItem`、`Exercise`、`Predict`、`PlayMeta`、`GlossaryEntry`、`Stage`、`Progress`、`SrsCard`…） | 逻辑 |
| `course/order.ts` | **唯一的课程顺序**（课 id 数组，课号 = 位置）。阶段归属在每课数据文件的 `stage` | 课的内容 |
| `course/lessons/<id>.ts` | 每课的非正文数据，`export default {…} satisfies Lesson`。只放课文件 | 共用的辅助模块（会被当成一课收集进注册表） |
| `course/lessons.generated.ts`、`lessons.catalog.generated.ts`、`lessons.loaders.generated.ts` | **自动生成**（`npm run gen`），不要手改。`generated`：Node 端静态 import 全部课（单元测试、脚本用，**浏览器代码不能 import**）；`catalog`：轻量课程目录（进主包）；`loaders`：课 id → 动态 import，每课一个异步 chunk | — |
| `course/registry.ts` | 轻量目录：`LESSONS: LessonMeta[]`（按顺序）、`lessonNo(id)`、`lessonById(id)`、`LESSON_ORDER`。**只有目录，没有题目和练习**；要完整的一课用 `course/engine/lessonData.ts` 的 `loadLesson(id)` | 课的重数据 |
| `course/stages.ts`、`glossary.ts`、`site.ts` | 6 个阶段、术语表、站点常量（base、链接工具） | — |
| `course/card-keys.snapshot.json` | 复习卡片键快照，**提交进仓库**，由脚本更新（见「卡片键快照」） | 手改 |
| `course/engine/logic/` | **纯函数**：不碰 DOM、localStorage，不读 `Date.now()`（时间由参数传入）。有单元测试，`tests/unit/purity.test.ts` 会挡住副作用；`tests/unit/cycles.test.ts` 检查全仓库没有循环依赖 | DOM、存储、`window` |
| `course/engine/*.ts` | 会碰 DOM / 存储的引擎模块，模块清单见下面「引擎模块」 | 业务规则（放进 `logic/` 并写测试） |
| `plugins/remark-play.mjs` | 把 ```` ```jsx play ```` 代码块变成 `<Playground>` | — |
| `theme/` | React 薄包装组件（`components/`，在 `rspress.config.ts` 的 `globalComponents` 里注册，MDX 里不用 import）、`lib/` 钩子、`index.tsx`（顶栏加总进度）、`style.css`（全部样式，浅色 `:root`、深色 `html.dark`） | 学习机制的逻辑 |
| `scripts/` | `check-content.mjs`、`new-lesson.mjs`、`gen-registry.mjs`、`lesson-mins.mjs`（`npm run mins`，时长公式）、`setup-hooks.mjs`，`lib/` 是它们共用的 | — |
| `tests/unit/` | Vitest 单元测试（`*.test.ts`） | 需要浏览器的测试 |
| `tests/e2e/` | Playwright 测试：`lessons.mjs`、`mechanics.mjs`、`smoke.mjs`、`split.mjs`（课数据拆分：网络请求、慢网、旧进度），`screenshots.mjs`，`run.mjs` 是入口，`_site.mjs` 是共用的静态服务器和浏览器启动 | — |
| `tests/screenshots/` | 截图（人工看版面用） | — |
| `review/` | 历次评审报告。只读参考，不是代码，不检查 | — |
| `.github/` | `workflows/ci.yml`（check + e2e）、`deploy.yml`（CI 通过后部署）、`dependabot.yml` | — |
| `doc_build/` | 构建产物，不提交 | — |

### 引擎模块（`course/engine/`）

| 模块 | 职责 |
|---|---|
| `index.ts` | 对外出口：`theme/` 只从这里 import |
| `lessonData.ts` | 按课加载重数据：`loadLesson(id)`（同一课只请求一次，失败可重试）、`loadLessons(ids)`、`loadedLesson(id)`（同步取已加载的） |
| `store.ts` | 进度存储（`localStorage['hands-on-react-v1']`）、`lp(id)`、进度变化事件、保存时给改动的组盖时间戳（`logic/stamp.ts`）、保存后发 `hoc-saved` |
| `syncState.ts` | 跨设备同步的本地状态（配置键、状态键、备份键）和 `bootSync()`：**主包里只放这个小文件**，本机开启了同步才动态加载 `syncEngine.ts` |
| `syncEngine.ts` | 同步引擎（独立 chunk `sync-engine`，只有开启同步的人才加载）：请求、合并并写回、防抖推送、多标签页选主、备份与恢复、导入导出、错误处理。见「进度同步」 |
| `util.ts` | DOM 小工具（`el`、`toast`、`highlight`…） |
| `exec.ts` | 代码预处理和编译（`prepare`、`compile`、`stripComments`）。练习的检查函数也 import 它 |
| `runtime.ts` | 按需加载 React 19.3.0 开发版（站内文件）+ Babel + Prism；`loadRuntime()` 返回 `Runtime`，`getRuntime()` 同步取已加载的 |
| `runner.ts` | 执行学习者的代码、收集控制台和错误（`Runner`） |
| `editor.ts` | 代码编辑器（textarea 叠加高亮） |
| `playground.ts` | 实验台，含“先预测再运行” |
| `tester.ts` | 练习检查工具 `t.*`（`makeTester`） |
| `exercise.ts` | 练习：任务、检查答案、提示阶梯 |
| `drills.ts` | 变式练习：每道独立的实验台和检查答案，进度记在 `LessonProgress.dr`，不影响本课完成 |
| `question.ts` / `quiz.ts` / `warmup.ts` / `review.ts` / `stageCheck.ts` | 题目共用组件 / 课内测验 / 课前热身 / 复习页 / 阶段测验 |
| `cards.ts` | 间隔复习卡片的读写（`__srs`）。卡片键先对应成**引用**（`cardRefOf`、`dueRefs`、`learnedRefs`：只用目录和进度，同步），要显示题目时才 `resolveCards(refs)` 按课加载 |
| `completion.ts` | 一课的完成判定和“掌握标准”条 |
| `selfExplain.ts` | 自我解释 |
| `terms.ts` | 术语标注 |
| `home.ts` / `reading.ts` / `counts.ts` | 课文组件树的按需加载入口 `attachHeroTree`（动态 import `heroTree.ts`）、首页叙事的按需加载入口 `attachStory`（动态 import `story.ts`）和静态数据的出口 / 阅读位置 / 侧栏和顶栏的数字 |
| `story.ts` | 首页短片的浏览器端（自己的异步 chunk）：把 `logic/filmTracks.ts` 的轨道建成 Web Animations 并按影片时间擦洗、自动播放器、播放控制条、幕进度圆点、用户接管、后台标签页暂停、清理。不改滚动速度，不拦截滚轮/触摸/键盘 |
| `heroTree.ts` | 课文组件树（`<RenderTree />`）的动画和交互（光点沿连线、节点亮起回弹、计数滚动、memo、自动演示、切后台收尾、卸载清理）。只在首页自己的异步 chunk 里，**不能被主包静态 import** |
| `logic/heroTree.ts` / `logic/heroTreeData.ts` | 组件树的纯逻辑：谁渲染、按什么顺序和延迟（`planPulse`）、计数、读屏播报和旁白 / 树的静态数据（节点、坐标，服务端渲染的静态版本只用它）。单元测试 `tests/unit/heroTree.test.ts` |
| `logic/srs.ts` | SRS 间隔推进、到期判断、热身选题 |
| `logic/ladder.ts` | 提示阶梯解锁、“代码是否真的改了”、半成品示例 |
| `logic/selfExplain.ts` | 自我解释有效字数 |
| `logic/drills.ts` | 变式练习的两级提示规则、完成数统计 |
| `logic/timing.ts` | 计时类检查的基线换算：相对阈值、设备忙的判断、失败信息 |
| `logic/internals.ts` | `t.internals`：安全读 React 内部结构，字段不在返回 null |
| `logic/stageCheck.ts` | 阶段测验抽题、及格、冷却、复测、交卷记录 |
| `logic/merge.ts` | 两份进度的合并（`mergeProgress`）。幂等、可交换、可结合，见「进度同步」 |
| `logic/stamp.ts` | 保存时给改动的字段组盖时间戳（在主包里，所以不 import `merge.ts`） |
| `logic/syncFormat.ts` / `syncPlan.ts` / `syncView.ts` | 同步文件格式与 schema 校验 / 防抖、退避、限速等待、地址白名单、响应分类 / 顶栏显示用的小函数（相对时间、令牌末四位，主包里用） |
| `logic/runtime.ts` / `warnings.ts` | 运行时版本号常量 `REACT_VERSION` 和资源路径 / 识别 React 19 的警告 |
| `logic/random.ts` / `text.ts` / `errors.ts` | 洗牌和种子随机 / 转义和选项格式 / 错误信息中文解释 |

**不允许循环依赖**：`logic/` 只依赖 `logic/` 里的纯文件、类型和 `exec.ts`；DOM 模块之间只能单向依赖（例如 `quiz.ts` → `completion.ts`，反过来不行）。数据文件只能 import `../engine/exec.ts`（不要 import 引擎别的模块：会形成循环引用）。

## 怎样加一课

```bash
npm run new-lesson -- hooks-recap --stage 1 --after custom-hooks --title "Hook 复盘"
```

脚本做的事：生成 `docs/lessons/<id>.mdx`（含 `LessonHeader`/`Warmup`/`LessonGoals`/`LessonProse`、一个 `play` 示例、`Quiz`/`Exercise`/`SelfExplain`/`LessonFooter`）和 `course/lessons/<id>.ts`（所有字段都有，文字是“【待写】”占位，练习是一个能通过的小例子），在 `course/order.ts` 里 `--after` 那一课后面登记，更新 `lessons.*generated.ts`（含轻量目录）和卡片键快照。侧栏、首页、翻页、热身、阶段测验自动生效。

然后：

1. 把所有“【待写】”换成真内容（`npm run check:content` 会提示哪些课还有占位）。写作规范见下。
2. **课号是位置**：插在中间会让后面的课号 +1。脚本会列出写了“第 N 课”且 N ≥ 新课号的位置；`check:content` 也会报“第 N 课《标题》”和“第 N 课“词””对不上的引用。逐个核对。毕业设计（portfolio）的验收表引用了很多课号；首页的组件树说明文字用课 id（`rendering`、`performance`）取课名做链接，不写课号。另外，`engineering`（第 34 课，第 5 阶段第一课）和 `delivery`（第 35 课）和 `project-weather`（第 41 课，第 5 阶段最后一课）有本机操作的命令、配置和版本要求，写进去前要对照官方文档核对。
3. 估算 `mins`（公式在 `scripts/lesson-mins.mjs`，`npm run mins` 看全部课的“现值 / 公式值 / 偏差”）：
   - 正文每 300 字约 1 分钟（字数不含代码块和标签），可运行示例每个 +2，测验每题 +1，一道正式练习 +15（原写“+10~20”，取中值）。
   - **项目课**（有练习、没有可运行示例，整课就是一个分步完成的项目，现有 `project-todo`、`project-search`、`project-kanban`）的综合练习按 **30 分钟**计，代替上面的 +15。有可运行示例的项目课（`project-actions`、`project-weather`）按普通课算。
   - `mins` 与公式值相差在 **±20% 以内**算合理，不用改；超出就改成公式值（`npm run mins -- --write`），`check:content` 也会拦。变式练习不计入 `mins`（见下 `drillMins`）。毕业设计 `portfolio` 的本机时间另记在 `localMins`。
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
- 浏览器里的 `window.Babel/Prism` 和练习里的 `t.q()` 结果按 `any` 声明（边界），其余尽量不用 `any`。

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
<Drills />   {/* 可选：数据里有 drills 时 */}
<SelfExplain />
<LessonFooter />
```

- MDX 全局组件（不用 import）：`Playground`（由 `play` 代码块生成）、`Quiz`、`Exercise`、`Drills`、`Warmup`、`SelfExplain`、`CallBox`、`Raw`、`LessonHeader`、`LessonGoals`、`LessonProse`、`LessonFooter`；页面级的 `HomePage`、`RoadmapPage`、`ReviewPage`、`GlossaryPage`、`StageCheck` 只用在首页、课程地图、复习页、术语表和阶段测验页。`<RenderTree />`（`<RenderTree memo />` 是 memo 默认打开的版本）是课文里的可交互组件树示意图，目前用在 rendering 和 performance 两课。
- `<Quiz />`、`<Exercise />`、`<Drills />` 只在数据里有 `quiz`、`exercise`、`drills` 时写（`check:content` 会检查两边对得上）。
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
  goals: [...], keyPoints: [...], quiz: [...], exercise: {...}, drills: [...], localMins: 120, checkOnly: [...], plays: {...},
} satisfies Lesson;
```

**字段、含义和类型以 `course/types.ts` 为准**（不在这里重复抄字段表）。写法要点：

- `drillMins`（有 `drills` 就必填，否则不能写）：每道变式按任务大小在 **3–8 分钟**之间取值，写它们的和。取值参考：改动 ≤2 行的小修 3–4 分钟；改动 3–6 行、要想一想 5–6 分钟；要改写结构、改动 6–10 行 6–7 分钟；超过 10 行的重构或多步任务 8 分钟。`check:content` 检查它在 道数×3 到 道数×8 之间。它进轻量目录，课头显示成“约 X 分钟”后面淡色的“+ 变式练习约 Y 分钟”，首页“站内学习”旁显示全部变式的合计；**不并入 `mins`**，因为变式不是完成一课的必要条件。
- `localMins`（可选，正整数分钟）：这一课的本机任务或本机项目的预计时间，只算要在自己电脑上做、站内没有自动检查的部分（课文里写了“本机项目另需约 2–3 小时”就填 150）。首页把“站内学习（各课 `mins` 之和，不含毕业设计）”“本机任务与本机项目（各课 `localMins` 之和）”“毕业设计（portfolio 的 `mins` + `localMins`）”分三段显示；缺省按 0。`mins` 不含它。
- 预测题：写在 `plays[标题].predict`，`pkey` 是预测键（`课id|标题`，进度里 `__pred` 用它，别改）。示例从别的课搬来时 `pkey` 保持原样（例如 concurrent 里仍是 `rendering|三种隐藏方式`）：`check:content` 允许已经在快照里的 `pkey` 不以本课 id 开头。**被预测的代码、按钮文字、日志里不能剧透答案**，解释放进 `note`（预测后才显示）。
- `options` 是纯文本，不能写 HTML（会被转义）。`q`、`explain`、`task`、`hint` 按 HTML 渲染，写 JSX 或泛型时把 `<` 写成 `&lt;`。
- 步骤写成 Markdown 有序列表（课文）或 `<ol class="task-steps">`（`task` 里），不要用 `<br>1.` 手工编号。
- `goals` 3–4 条，可观察的动词开头；`keyPoints` 4–5 条，自我解释后展示对照。
- 检查函数用到的辅助函数写在数据文件顶部（模块作用域），需要引擎里的 `prepare`、`compile`、`stripComments` 就 `import … from '../engine/exec.ts'`。
- 字段写错会被 `npm run typecheck` 拦住；选项数、`answer` 下标、`explain` 非空等由 `npm run check:content` 检查。

### 变式练习（`drills`）

每课除了一道正式练习（`exercise`），可以有 2–3 道**小而快**的变式练习：同一个核心概念的不同情境（换数据形状、换交互、给一段有 bug 的代码让学习者修、把写法 A 改成写法 B），不是把正式练习换个名字。每道 3–8 分钟，任务比正式练习窄。

- **数据**：`drills: Drill[]`（类型在 `course/types.ts`）。每道有 `title`（一句话定位，显示在标题上）、`task`、`starter`、`solution`、`hint`、`test`，可选 `exports`。没有 `faded`（不提供半成品）。有 `drills` 必须有 `exercise`，MDX 里在 `<Exercise />` 后面写 `<Drills />`（`check:content` 检查两边对得上，并检查字段完整、2–3 道、标题不重复、`solution` 不能和正式练习相同）。`mins` 不含变式练习（选做）。
- **入口**：侧栏里有变式练习的课，课名后有很淡的“变式 x/y”（全部做完变成绿色“变式 ✓”；`ProgressMarks` 读目录的 `nDrills` 和进度写 `data-hoc-dr` / `data-hoc-dr-done`，不加载课数据）。侧栏“术语表”下面和顶部导航有“变式练习”总览页（`/drills`，`DrillsPage`）：按阶段列出每课每道变式的标题和完成情况，点击跳到该课的 `#sec-drills`；页面只用目录里的 `nDrills`、`drillTitles`、`drillMins` 和进度，同步渲染。首页统计有“道变式练习”，课程地图各阶段旁有“变式 x/y”。
- **界面**：“动手练习”之后是“变式练习”区，每道是独立的实验台和“检查答案”，标题行显示“变式 x/y”，本课跳转条里有“变式练习 x/y”，课末的掌握标准条也显示进度。
- **进度**：`LessonProgress.dr`（下标 → `DrillProgress`：`ok`、`code`、`fails`、`lastFail`、`sawSol`、`rewrite`、`exHelp`）。localStorage 的键 `hands-on-react-v1` 和已有字段都不变，旧数据没有 `dr` 时一切照常（`drillStat` 和 `drillRec` 都容错）。**变式练习不影响“本课完成”**：`maybeComplete` 仍然只看随堂测验全对和正式练习通过。
- **提示规则（简化，正式练习的阶梯一行没改）**：失败 1 次给提示，失败 2 次可看参考答案；没有半成品，也没有时间门槛。“代码是否真的改了”、粘贴参考答案原文不能通过、看过答案后点“重置”自己重写，规则和正式练习相同（`logic/drills.ts` 复用 `logic/ladder.ts`）。
- **写法**：行为检查为主，不查字面。每道都要用 `try.mjs` 实测五类：参考答案通过；起始代码被拒（信息指向概念）；两种常见错误被拒（信息指向概念）；一种合理的不同写法通过。把变体存成 `tests/variants/<课id>.drill-<序号>.mjs`（正式练习是 `<课id>.ex.mjs`），`npm run test:variants` 回归。逐课 e2e（`lessons.mjs`）对每道变式也填参考答案要求通过、填起始代码要求被拒。
- `new-lesson` 的数据模板里带一个注释掉的示例。

### 练习检查（`exercise.test`）

`test(t)` 拿到的工具（类型是 `course/types.ts` 的 `Tester`，实现在 `course/engine/tester.ts` 的 `makeTester`）：`t.q(sel)`、`t.qa(sel)`、`t.text(sel)`、`t.byText(tag, text)`、`t.click(x)`、`t.type(x, value)`、`t.wait(ms)`、`t.assert(cond, msg)`、`t.unpreventedSubmits()`、`t.source`（去注释的代码）、`t.rawSource`、`t.exports`（按 `exports` 字段导出的顶层名字）、`t.root`。

- **计时类检查和读 React 内部结构的检查，必须用下面这几个辅助**（评审指出绝对毫秒阈值和内部字段在慢设备、后台标签页、升级 React 后会误判）：
  - `await t.baseline()` 返回 `{ factor, lag, limit(ms) }`：检查开始时实测一次设备基线（固定计算量的耗时相对参考机慢几倍、事件循环的额外延迟）。**阈值写成 `bl.limit(10)`，不要写死 `10`**。`limit` 只加“额外开销”（`ms + 2·lag + 2·(factor−1)`），**不按倍数放大**：任务本身是按墙钟忙等的（例如每个单元忙等 1ms），设备慢不会让它变长，按倍数放大会让“一直占用主线程”的错误写法混过去。
  - `t.timing(cond, msg)`：计时类断言。失败抛出可重测的失败（普通 `t.assert` 不重测）。
  - `await t.retry(fn)`：运行一段含 `t.timing` 的检查；`t.timing` 失败就等 0.3 秒、重新测基线，再整体重跑一次，两次都失败才判失败。失败信息附一句区分：设备看起来忙（慢 3 倍以上或事件循环延迟 40ms 以上）写“可能不是代码的问题，再点一次检查”，否则写“更可能是代码的问题”。**`fn` 必须能重复执行**：段内自己创建 root、调度器、数据，不依赖上一次的残留。
  - 标签页在后台（`document.hidden`）：`t.baseline()` 和 `t.retry()` 会抛 `EnvFail`，界面提示“请保持本页在前台，再点一次检查”，**这次不计入失败次数、不解锁提示**（正式练习和变式练习都一样）。
  - `t.internals`：读 React 内部结构的唯一入口（`fiberOf`、`rootOf`、`componentOf`、`hooksOf`、`hasStateHook`、`refValues`、`stateValues`、`suspenseCount`、`inTransition`，实现和注释见 `logic/internals.ts`）。字段不存在或形状不对时返回 `null`，**检查要在 `null` 时退回纯行为断言并跳过结构断言**，这样升级 React 后不会抛异常或全盘误判。依赖的是 React 19.3.x 的 fiber 结构；位掩码（过渡车道）只在 `t.internals.known`（版本是 19.3.x）时才用。不要在 `exercise.test` 里直接写 `memoizedState`、`__reactFiber$`、`pendingLanes`。
  - 新写计时类检查后，用 `node tests/e2e/try.mjs <课> ex <变体> --throttle 4 --reps 3` 和 `--throttle 6` 验证：参考答案仍通过，起始代码和典型错误仍被拒。`tests/e2e/throttle.mjs` 把“4 倍 CPU 节流下参考答案通过”固定为回归。
  - **固定等待窗口**：`t.wait(固定毫秒)` 后马上断言“应该已经出现”的写法，在设备忙时会误判。改成轮询：循环到条件成立或超时，超时用 `(await t.baseline()).factor` 放宽（`suspense-data` 的 `until`、`use-ref` 的计数等待）。“等一段时间后确认**没有**变化”（例如停止后数字不再变、竞态里等过期请求回来）需要固定窗口，保留；设备慢只会让它更宽松。
  - 扫描有风险的写法时，下面几种不算：`performance.now()` / `Date.now()` 只用来设轮询截止时间、或是示例里模拟“很慢”的忙等；`streaming-ssr` 为了确定性而替换 `Date.now`；`lists-keys` 经 `t.internals.fiberOf` 拿到 fiber 后读通用字段 `tag`/`key`/`return`/`stateNode`（读不到时有退回）。
- `t.unpreventedSubmits()`：本次运行里表单被提交、但学习者的处理函数没有调用 `preventDefault()` 的次数。实验台（`runner.ts`）在 mount 的父元素上挂了一个晚于 React 处理函数的 `submit` 兜底监听：没人调用 `preventDefault` 时它照样拦住页面刷新，同时在控制台警告并计数。所以界面上看不出漏写，要用这个计数断言（见 `project-todo`）。
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
- 课前热身（提取练习）和间隔复习：答错的题第二天再出（固定隔 1 天，不看盒子）；答对的题只有**到期**了才提升复习间隔，没到期的答对不改任何记录（盒子、到期时间、次数都不变）；答错不管到没到期都回到盒子 0。这条“到期才升级”的门由 `logic/srs.ts` 的 `shouldRecord` / `gatedNextCard`（引擎里的 `srsRecordGated`）实现，**课前热身、复习页的混合练习、阶段测验三处共用**。“今日复习”只出到期卡，所以不受影响。随堂测验（`quiz.ts`）是第一次作答，直接记录。
- “12 小时内答过的不再出”只适用于**课前热身**（`warmupPool`）。混合练习和阶段测验不过滤：阶段测验是固定 12 题的测验，不是复习，过滤会抽不满。
- 间隔序列：盒子 0..5 对应 0/1/3/7/16/35 天。答对进下一个盒子（到顶不再升）；答错回到盒子 0 并安排明天再出。`SRS_DAYS[0] = 0` 只是占位，不参与计算（用它的话答错的题当天就到期，会违反“答错第二天再出”）。
- 测验答错不亮正确答案，重试时隐藏上次选的项。
- 提示阶梯：`[提示, 失败 1 次], [半成品, 失败 2 次且 2 分钟], [参考答案, 失败 3 次且 5 分钟]`（分钟从第一次失败算起）；只有代码真的改了才算一次失败：去掉注释、空白、分号、逗号后，要和起始代码、**上一次失败的代码**都不同（所以来回切换两份不同的失败代码，每次都算一次失败；半成品和参考答案另有 2 分钟、5 分钟的时间门槛，刷失败次数绕不过时间）。粘贴参考答案原文不能通过，除非看过答案后按了“重置”自己重写；借助答案完成会单独标记。（实现：`logic/ladder.ts`。）
- 自我解释：至少 30 个有效字（去掉空白和标点，连续重复的字折叠；不同字少于 10 个会被压低到最多 9）才展示参考要点。（实现：`logic/selfExplain.ts`。）
- 阶段测验：12 题（8 道新题优先没见过的 + 4 道常规题），交卷后才显示解析，80% 通过（12 题要答对 10 题）；中途离开算未通过；未通过要等 30 分钟；以最近一次为准；通过后清掉之前未通过留下的“需要加强的课”（`weak`）；35 天后提示复测。（实现：`logic/stageCheck.ts`。）

改引擎后跑 `npm run test:unit` 和 `npm run test:e2e -- mechanics`；后者覆盖提示阶梯、自我解释门槛、阶段测验 12 题、交卷前不显示答案、中途离开冷却，以及 390px 宽度下无横向滚动。

## 进度同步（跨设备，可选）

没有后端，也不引入任何第三方库或服务：学习者自己开启后，进度存进**他自己 GitHub 账号下的一个私密 Gist**（接口 `https://api.github.com`，CORS 已核对可直接从浏览器调用）。不开启就一个请求也不发，同步引擎也不加载。

### 进度数据结构（`localStorage['hands-on-react-v1']`，类型见 `course/types.ts`）

| 键 | 内容 | 谁写 | 时间 |
|---|---|---|---|
| `<课id>.quiz / tried / first` | 随堂测验：题号 → 选项下标 / 是否答过 / 首答是否正确 | `quiz.ts` | 没有（卡片 `last` 间接记录） |
| `<课id>.ex`、`done`、`sx`、`can` | 练习通过 / 课完成 / 自我解释已展开 / 目标自查勾选 | `exercise.ts`、`completion.ts`、`selfExplain.ts` | 没有 |
| `<课id>.code fails firstFail lastFail sawSol rewrite exHelp` | 练习的代码草稿、失败记录、提示阶梯状态（`firstFail` 是阶梯时间门槛的起点） | `exercise.ts`、`playground.ts` | **新增 `ts.lad`** |
| `<课id>.note` | 自我解释的笔记 | `selfExplain.ts` | **新增 `ts.note`** |
| `<课id>.noteAlts`（**新增**） | 同步时被覆盖的另一份笔记，界面叫“另一台设备的版本” | 合并函数 | — |
| `<课id>.dr[i]` | 变式练习：`ok code fails lastFail sawSol rewrite exHelp` | `drills.ts` | **新增 `dr[i].t` ** |
| `__srs[课id#N]` | 间隔复习卡片 `{box n due last}` | `cards.ts` | `last` 就是最近一次复习的时间 |
| `__stage[阶段]` | 阶段测验记录 `{best last passed passedAt failedAt weak pending}` | `stageCheck.ts` | `passedAt / failedAt / pending.at`，**新增 `t`** |
| `__pred[预测键]` | 预测题：选中的选项下标 | `playground.ts` | 没有 |

不同步（单设备的界面状态，不是学习进度）：阅读位置 `hands-on-react-v1:pos`、首页短片的已看过 / 声音偏好、组件树演示标记。另有三个**同步自己的键**：`:sync`（令牌、Gist 编号、账号名、设备 id）、`:sync-status`（状态，不含令牌）、`:backup`（覆盖本机进度之前的备份，最多 2 份）。

**时间戳怎么来**：`store.ts` 的 `save()` 在写入前调用 `logic/stamp.ts`：为每组字段算一个指纹，和上次保存时的指纹不同就盖上 `Date.now()`。所以十几处写进度的代码一行都不用改。加载旧数据不盖章，旧数据没有时间戳，合并时按“更旧”（时间 0）处理。同步引擎整体替换本机进度后调用 `resyncStamps()`，避免把别人的内容盖成本机刚改的。新增的 `ts`、`t`、`noteAlts` 都是可选字段，不改任何现有字段的含义和类型，到期判断、提示阶梯、完成判定都不读它们。

文件格式（`logic/syncFormat.ts`）：`{ schema, app: 'hands-on-react', updatedAt, device, progress }`，文件名 `hands-on-react-progress.json`，Gist 描述固定。`schema`（`PROGRESS_SCHEMA`，现在是 1）读到比自己新的：只读合并，**不覆盖云端**，提示“另一台设备的站点版本更新，请刷新”。

### 逐字段合并规则（`logic/merge.ts` 的 `mergeProgress(a, b, ctx)`）

原则：两台设备各学各的，合并后谁的进度都不丢；同一条记录以更新的为准。每个字段都是“取并集 / 取或 / 取最大”，需要二选一的地方只用一个全序比大小（时间、进度、规范化文本），不看参数顺序。

| 字段 | 规则 |
|---|---|
| `done`、`ex`、`sx`、变式 `ok`、`tried`、`can` | 取“或”（一边完成就算完成） |
| `first`（首答是否正确） | 取“与”：一边首答错就算错（保守，答错的题会回来复习） |
| `quiz[题号]` | 按题合并；两边答案不同时优先取**正确的**（用目录里的 `quizAnswers`，由 `ctx` 传入），都对或都错取较大的下标 |
| 草稿与阶梯整组（`code fails firstFail lastFail sawSol rewrite exHelp`） | **整组**取更新的一边，不拼接：先比 `ts.lad`，没有时间戳比失败次数（进度更靠后），再比 `sawSol`，最后比规范化文本。没有任何这组字段的一边不参与竞争 |
| `exHelp`（借助答案完成） | 跟着“完成发生的那一边”：只有一边完成取它的；**两边都完成取最轻的**（没借助 < 重写 < 看答案，因为两边都是各自通过的，有一边没借助就是真的没借助）；都没完成跟着胜出的一组 |
| `note` / `noteAlts` | 正文取 `ts.note` 更新的（没有时间戳取更长的）；**另一份不丢**，进 `noteAlts`（所有出现过的文字减去正文，所以合并顺序不影响结果），自我解释区折叠显示，可“用这一版” |
| 变式 `dr[i]` | 每道独立，规则同上（`ok` 取或；草稿组按 `dr[i].t` / 失败次数；`exHelp` 同上） |
| `__srs[键]` | 按键并集；同一张卡**整条**取 `last` 更晚的（再比 `n`、规范化文本），不混拼字段 |
| `__stage[阶段]` | 按阶段取最近一次作答（`max(t, failedAt, passedAt, pending.at)`）的整条记录，“以最近一次为准”的现有语义不变；`best` 是历史最高分，取最大 |
| `__pred` | 键的并集（同一键两边不同取规范化文本较大者，只是为了确定） |
| 不认识的字段（课里或顶层） | 原样保留；两边都有且不同时逐键递归，标量取规范化文本较大者（向前兼容） |

性质由 `tests/unit/merge.test.ts` 用手写用例 + 随机生成的进度固定：幂等 `merge(a,a)=a`、可交换、可结合（试过 30000 组随机三元组）、合并结果包含两边（再和任何一边合并不变）、任何一边已完成的课 / 练习 / 变式 / 卡片 / 阶段都不会消失、旧数据合并不报错、未知字段保留、不改参数。

**已知取舍**：因为完成取“或”，“标记为未完成”在开启同步后会被另一台设备（或云端）上的“已完成”带回来，这是“谁的进度都不丢”的代价。时间取“较新”依赖设备时钟：两台设备时钟差几分钟，只影响草稿 / 笔记 / 阶段测验这几类二选一的记录谁赢（输的那份笔记仍保留在 `noteAlts`，草稿在合并前的备份里），不影响完成状态、复习卡片的并集。

### 同步时机与引擎（`syncEngine.ts`，按需加载）

- **开启**：校验令牌（`GET /user`；经典令牌看 `x-oauth-scopes` 有没有 `gist`；细粒度令牌没有这个头，权限留到读写时才知道）→ 在账号里列出 gist（分页，`Link` 头）找同名文件，没有才创建（`public: false`）→ 保存配置 → 立即同步一次，显示“从云端合并了 N 课 / 已把本机进度上传”。个别令牌列不出私密 Gist 时，面板里可以手动填 Gist 链接或编号。
- **一次同步** = 读云端（`If-None-Match` 条件请求，304 不计入限额）→ 和本机合并 → 合并结果写回本机和云端（内容有差别才写）。所以推送前总是先拉，不会覆盖另一台设备刚写的内容；两台设备写之间的极小空隙里 PATCH 可能覆盖对方，但对方的本机进度还在，下次拉取发现云端缺内容时会合并后再推，自愈。
- **时机**：页面加载后拉取；本机进度变化（`save()` 发 `hoc-saved`）后防抖 6 秒、最长 10 秒推送；页面隐藏 / 关闭时有未推送的改动，用 `fetch(..., { keepalive: true })` 尽力推一次（请求体上限 64 KB，超过就放弃，下次打开页面再同步）；回到前台且距上次拉取超过 5 分钟再拉；`online` 事件触发重试。
- **多标签页**：`navigator.locks`（Web Locks）选出一个标签页负责联网（没有这个 API 时每个标签页都联网，靠“先读后合并”保证正确）。其他标签页写进 localStorage 的进度，靠 `storage` 事件合并进负责的页面，内存与 localStorage 两边收敛（合并是幂等的，不会来回打架）；“立即同步”用 `BroadcastChannel` 转给负责的标签页。
- **界面不被冲掉**：用合并结果更新内存时**就地**写（保持页面里组件拿着的对象身份），只发 `hoc-progress` 让侧栏、顶栏、地图页刷新；课文 / 复习 / 阶段测验页打开时画好的内容不重绘，只提示“进度已从另一台设备更新”并给“刷新页面”按钮。
- **绝不丢本地数据**：用合并结果覆盖本机进度前先备份（`:backup`，最近 2 份；写不进去就不覆盖）；先写 localStorage，成功了才改内存；任何错误都不动本地进度。面板里可以“恢复同步前的本地进度”（恢复后下次同步仍会把云端的合并回来，想彻底回到那时先断开同步）。
- **错误**（`syncEngine.ts` 的 `MSG`）：断网 / 5xx → 状态“有未同步的更改”，指数退避（5 秒起、翻倍、最多 5 分钟、抖动 ±20%、连续 8 次后暂停自动重试，回到前台或点“立即同步”再试）；401 → 停止同步，提示重新填写令牌；403 且 `x-ratelimit-remaining: 0` 或带 `retry-after`（每小时 5000 次）→ 等到 `x-ratelimit-reset` 再试；其他 403 → 令牌没有 Gist 写权限；404 → Gist 被删，可一键重新创建；文件被截断（`truncated`，走 `raw_url`）读不全 / 内容不是合法进度 → **不覆盖**，另存原文件的备份文件到 Gist，提示并可“用本机进度重建”；存储空间不足 → 不动本机进度并提示。
- 测试用的时间调节：`window.__hocSyncTest = { debounce, maxWait, pullAfter, initialDelay, backoff }`（只在 e2e 里由 `addInitScript` 设置）。

### 令牌与安全约定（硬性）

- 令牌只存在本机 `localStorage['hands-on-react-v1:sync']`，只用于请求 `https://api.github.com`（`request()` 里用 `isAllowedUrl` 白名单校验：https、主机 `api.github.com`、无账号密码、无端口；读 Gist 原文的 `raw_url` 只允许 `gist.githubusercontent.com` / `gist.github.com`，且**不带令牌**）。`fetch` 一律 `referrerPolicy: 'no-referrer'`、`credentials: 'omit'`、`redirect: 'error'`、`cache: 'no-store'`。
- 令牌不进 URL、不写日志、不出现在错误提示和状态里（提示都是固定的中文，不回显服务器内容；状态键不含令牌；界面只显示末四位）。输入框 `type="password"`、`autocomplete="off"`，开启后立即清空。
- 界面上用平实的话写明：令牌存在这台设备的浏览器里；任何能在这个网站上运行脚本的东西都能读到它，所以**只给它 Gist 权限**；公用电脑上用完请断开。“断开同步”删除本机的令牌和 Gist 编号，云端 Gist 是否一并删除由用户选（默认保留）。
- 令牌类型（2026-10 对照 docs.github.com 核对）：**细粒度令牌**现在支持 Gist（账户权限 `Gists`，只有 `write`），创建链接可预填名称、说明、权限、有效期：`https://github.com/settings/personal-access-tokens/new?name=…&description=…&gists=write&expires_in=90`，界面优先推荐它（没有仓库权限、会过期）。备选**经典令牌**只勾 `gist`：`https://github.com/settings/tokens/new?scopes=gist&description=…`（`scopes` 参数是长期可用的写法，但官方文档没有写它）。
- 开发和测试里**不用任何真实令牌、不创建真实 Gist**：e2e 用 Playwright 的 `route` 拦截 `api.github.com`，接内存里的假 Gist 服务（`tests/e2e/_fakegithub.mjs`），令牌是带标记的假字符串，全程搜索它有没有出现在 DOM、控制台、请求地址、Referer、断开后的 localStorage。

### 改进度结构时怎样保持合并兼容

1. **加字段**：只加**可选**字段，不改旧字段的含义和类型，旧数据没有它时一切照常（学习机制代码不要读新增的时间戳字段）。不升 `PROGRESS_SCHEMA`。
2. 在 `logic/merge.ts` 给它定规则：能“取或 / 取并集 / 取最大”就这样做；必须二选一的，选一个全序（时间戳 > 进度 > 规范化文本），整组取，不拼接。**不写规则也不会丢**：不认识的字段走 `mergeAny`（并集、递归、标量取规范化文本较大者），但要想清楚这个默认是不是你要的。
3. 如果新字段属于一组“整体取更新的一边”的字段（例如练习草稿组），同时改 `merge.ts` 的 `LADDER_KEYS`（或 `DRILL_KEYS`）和 `logic/stamp.ts` 的 `STAMP_LADDER`（单元测试会核对两处一致）。需要时间戳的新分组：在 `stamp.ts` 的 `fingerprints` / `stamp` 里加一类指纹，在 `merge.ts` 里按它比较。
4. 补测试：`tests/unit/merge.test.ts` 加该字段的规则用例，并把它加进随机生成器 `genProgress`（性质测试会自动检查幂等、可交换、可结合、不丢）；有用户可见的行为再在 `tests/e2e/sync.mjs` 加一条。
5. **改了含义或类型**才升 `PROGRESS_SCHEMA`：旧版站点读到新 schema 只读合并、不覆盖云端；同时写迁移（读旧 schema 的数据）并补单元测试。
6. 不要让 `stamp.ts` 或其他主包文件 import `merge.ts` / `syncPlan.ts`：它们会整个被拖进主包（`libs.mjs` 的主包上限会拦）。主包里只放 `syncState.ts`、`stamp.ts`、`syncView.ts` 和顶栏 / 面板外壳；引擎和面板内容各自是异步 chunk（`sync-engine`、`sync-panel`）。

## 实验台运行时（React 19.3.0）

**只有一个运行时**：全站的实验台和练习都跑 React 19.3.0 开发版，没有按课选版本的开关（数据文件里写 `runtime` 字段会被 `check:content` 报错）。

**怎么实现**：
- React 没有 UMD。`scripts/build-react19.mjs`（`predev`、`prebuild` 自动跑）把固定版本的 `react-runtime-19`、`react-dom-runtime-19`（npm 别名包，与站点自己的 `react`、`react-dom` 无关）里的开发版 CJS 文件包成一个自包含脚本 `docs/public/runtime/react-19.3.0.dev.js`（不提交，约 1.2 MB，gzip 后约 210 KB，不进主包，第一个实验台需要时才加载）。`react`、`react-dom`、`react-dom/client`、`scheduler` 在同一个模块表里，是同一个实例。只登记在 `window.__hocReact19`，不写 `window.React`、`window.ReactDOM`。Babel 和 Prism 照旧从 CDN 加载。
- **升级版本**：同时改 `package.json` 里两个别名包的版本和 `course/engine/logic/runtime.ts` 的 `REACT_VERSION`（版本号集中在这一处，构建脚本会核对两者一致），再 `npm install`，然后重新实测示例和练习。
- 显式传入：`loadRuntime()` 返回 `Runtime`（`React`、`ReactDOM`、`reactVersion`），`Runner`、`prepare`、`makeTester` 都显式拿着它；学习者代码里的 `React`、`ReactDOM`、`import … from 'react'` 都解析到它，引擎不读全局。
- 加载失败：实验台显示“运行环境加载失败，请检查网络后刷新页面。”，页面其余部分正常；之后再进入有实验台的页面会重试（`tests/e2e/runtime.mjs` 用 route 拦截验证）。
- 界面：实验台标题栏有一行不抢眼的灰字 `React 19.3.0`。

### 第三方库（react-router、@tanstack/react-query、zustand、react-hook-form、zod、@hookform/resolvers）

实验台的示例里可以 `import` 六个真库，其余的包不行（`import` 别的包会被悄悄忽略）：

| 库 | 版本 | 示例里的写法 | 说明 |
|---|---|---|---|
| react-router | 8.4.0 | `from 'react-router'`、`from 'react-router/dom'` | 路径 `react-router/dom` 里是 `RouterProvider`，和真实项目的写法一致 |
| @tanstack/react-query | 5.104.1 | `from '@tanstack/react-query'` | |
| zustand | 5.0.15 | `from 'zustand'`、`'zustand/middleware'`、`'zustand/react/shallow'`、`'zustand/shallow'`、`'zustand/vanilla'` | 暴露这五个子路径。`persist` 示例只写自己的键（`hoc-demo-zustand`），不碰 `hands-on-react-v1`；localStorage 不可用时用 `try/catch` 退回内存存储 |
| react-hook-form | 7.89.0 | `from 'react-hook-form'` | 表单库，见 form-architecture 一课。校验示例用 `zodResolver` |
| zod | 4.6.5 | `from 'zod'` | Zod 4 写法（`z.email()`、`z.flattenError`）。文件较大（见下），因为 `z.locales` 带了全部语言包 |
| @hookform/resolvers | 5.9.1 | `from '@hookform/resolvers/zod'` | 只暴露 zod 这一个适配器。**依赖 react-hook-form**（`LibInfo.deps`）：打包时对 `react-hook-form` 的 import 解析到那个库已加载的同一份模块，加载时先加载它 |

**三条约定**：
1. **路由用内存路由**：实验台不能改动页面的真实地址。示例用 `createMemoryRouter`（或 `MemoryRouter`），预览区里要显示当前的内存地址（`useLocation().pathname`），课文里写明“真实项目里用 `createBrowserRouter`，这里为了不改动页面地址用内存路由”。示例里不要用 `BrowserRouter`、`createBrowserRouter`、`createHashRouter`。
2. **不发真实网络请求**：Query 和 `loader` 的数据来自返回 Promise 的模拟函数（`setTimeout` 加 `resolve`），并在代码注释里写明是模拟。示例里不要 `fetch` 外部接口。
3. **存储只用自己的键**：zustand 的 `persist` 示例用独立的键（例如 `hoc-demo-zustand`），提供“清除”按钮（先 `setState` 重置，再 `persist.clearStorage()`）；不要读写 `hands-on-react-v1`。

**怎么实现**：
- 版本的唯一来源：`course/engine/logic/runtime.ts` 的 `LIBS`（包名、版本、打包文件名里的短名、可以 import 的路径）。`package.json` 的 `devDependencies` 里同名包写**精确版本**（不带 `^`），`tests/unit/runtime.test.ts` 和 `scripts/build-libs.mjs` 都会核对两处一致。`esbuild`（也是精确版本）只用来打包这些库，不进站点。
- `scripts/build-libs.mjs`（`predev`、`prebuild` 在 `build-react19.mjs` 之后自动跑）用 esbuild 把每个库的**开发版**（`development` 条件）打成一个自包含的 IIFE：`docs/public/runtime/<短名>-<版本>.dev.js`（不提交；react-router 约 470 KB，gzip 约 97 KB；react-query 约 155 KB，gzip 约 33 KB；zustand 约 24 KB，gzip 约 6 KB；react-hook-form 约 121 KB，gzip 约 24 KB；zod 约 782 KB，gzip 约 115 KB；@hookform/resolvers 约 8 KB，gzip 约 3 KB）。`react`、`react-dom`、`react-dom/client`、`react/jsx-runtime` 标成外部依赖，加载时解析到 `window.__hocReact19` 里实验台那一份 React（`React`、`ReactDOM`、`jsxRuntime`）：库**不自带第二份 React**，Hook 才不会报错。产物登记在 `window.__hocLibs[包名] = { version, modules }`，不写别的全局变量。库里的 `console.warn` / `console.error` 经 `window.__hocLibConsole` 显示在当前实验台的控制台里（前缀 `react-router 提示：` / `报告：`）。
- 按需加载：`logic/runtime.ts` 的 `libsInSource(代码)` 按 `import` 语句判断需要哪些库（注释和字符串里的不算）；`zustand/middleware` 这类子路径也算 zustand。`theme/lib/useSlot.ts` 在创建实验台前先 `loadLibs`；`Playground` 传 `[code]`，`Exercise` 传起始代码和参考答案。没有 `import` 这些库的课不请求任何库文件，用到哪个库的课只请求哪个库的文件。学习者在编辑器里新加 `import` 时，`makePlayground` 的 `run` 会先加载再运行。
- `prepare`（`exec.ts`）把这些包名和子路径的 `import` 解析到加载好的模块对象：具名导入写成 `const { … } = __libs["包名"]`，`import * as X` 和默认导入得到整个模块；`import type` 被忽略；库还没加载就 `import` 会报“还没有加载”。`Runner` 把 `runtime.libs` 作为 `__libs` 传进沙箱。
- 加载失败：该实验台显示“运行环境加载失败（react-router），请检查网络后刷新页面。”，课文、测验、不用库的示例都正常；之后再进入有这个库的页面会重试。
- 界面：实验台标题栏在 `React 19.3.0` 旁再显示一行同样风格的灰字，例如 `react-router 8.4.0`、`zustand 5.0.15`（`.pg-lib`，没用到库就隐藏；用到几个库就并列几个，用 `·` 隔开）。
- **库之间的依赖**：`LibInfo.deps` 写本库 import 了哪些别的库。`build-libs.mjs` 把对它们的 import 打成 `window.__hocLibs[包名].modules[路径]` 的引用（被依赖库的 `specifiers` 必须包含这个路径），并在打完后检查文件里没有被依赖库的代码（有就报错，说明悄悄打进了第二份实例）。`loadLibs` 先加载 `libDeps(lib)` 再加载本库；任何一个失败，提示的是失败的那个库的名字。标题栏只显示示例 `import` 到的库。
- 练习检查：`t.libs['react-router']`、`t.libs['@tanstack/react-query']`、`t.libs['zustand']`、`t.libs['react-hook-form']`、`t.libs['zod']`、`t.libs['@hookform/resolvers/zod']` 是加载好的模块对象（练习的代码 `import` 了才有）。键是 `import` 的路径，所以子路径是 `t.libs['zustand/middleware']`、`t.libs['react-router/dom']`。

**升级版本**：改 `package.json` 里的精确版本和 `LIBS` 里的 `version`（两处一致），`npm install`，重新跑 `npm run build` 和 `npm run test:e2e -- libs`，并重新实测用到它的课（router、tanstack-query、state-architecture）所有示例、预测题的答案和课文里对库行为的描述（课文里写了版本号的地方一起改）。

**再加一个库**（例如另一个状态库）：
1. `npm install -D -E <包名>@<版本>`，在 `LIBS` 里加一项（包名、版本、短名、可以 import 的路径）。
2. 如果库引用了 `build-libs.mjs` 里 `EXTERNAL` 没有的 React 子路径，先在那里登记，否则打包会报错。如果它 import 了已经在 `LIBS` 里的另一个库，在它的 `LibInfo` 里写 `deps`（见上）。
3. 在 `tests/unit/runtime.test.ts` 加 `libsInSource` 和 `prepare` 的断言；在 `tests/e2e/libs.mjs` 加按需加载、标记和示例行为的测试，并确认其余的课不会请求新库。
4. 在用到它的课里按“迷你实现 → 真库示例 → 本机任务”组织，示例里的网络请求一律模拟；在本节的表里补一行。
5. 看一下主包和库文件的体积，写进提交说明。

**警告识别**（`logic/warnings.ts`，有单元测试，样例是实测的）：19 的警告消息**没有 `Warning: ` 前缀**，链接是 `react.dev/link/…`，不再拼组件栈（标签嵌套类警告附 DOM 树）。所以不能靠前缀。19 的包里 `console` 是一份副本，React 发出的 `error`/`warn` 交给引擎，来源可靠；规则是“排除错误报告，其余都是警告”。错误报告：被错误边界接住的是 `console.error('%o\n\n%s\n\n%s\n', err, 'The above error occurred in the <X> component.', …)`，没接住的是 `console.warn('%s\n\n%s\n', 'An error occurred in the <X> component.', …)`。`createRoot` 的 `onUncaughtError` 把未接住的渲染错误记到对应的实验台；事件处理函数里抛的错误走 window 的 `error` 事件。学习者自己的 `console.error` 走实验台的假 console，永远不会被当成 React 警告。不要让 React 包写真正的 `console`（React 会为了屏蔽探测日志改写 `console` 方法，包里用副本就是为了避免它改到真的 console，否则会无限递归）。

**写示例和练习检查时**：
- 练习检查函数用 `t.React`、`t.ReactDOM`（`const { React, ReactDOM } = t;`），**不要读全局的** `React`、`ReactDOM`：全局没有。
- 示例里 `import { … } from 'react'`，只要运行时的 React 真有这个导出就能用（`use`、`useActionState`、`useOptimistic`、`useEffectEvent`、`Activity`、`ViewTransition`、`startTransition` 等）；`react-dom` 的具名导入（`useFormStatus`、`createPortal`、`flushSync`、`preload` 等）从合并后的 `ReactDOM` 取。`ViewTransition` 要放进 `startTransition` 才有动画。
- 19.3.0 实测可用：`<form action>`、`useActionState`、`useFormStatus`、`useOptimistic`、`use()` 读 Promise 配 Suspense、ref 作为 prop 和 ref 回调清理函数、`<Context value>` 当 Provider、`Activity`、`useEffectEvent`、`ViewTransition`。
- **不能用已移除的 API**：`ReactDOM.render`、`unmountComponentAtNode`、`findDOMNode`、字符串 ref、函数组件的 `defaultProps`/`propTypes`；`act` 从 `react` 导入。引擎和练习检查工具都没有用到它们。
- 19 的行为细节：`<form action={fn}>` 的 Action 结束后，React 重置表单里的非受控字段（出错返回时也一样）；未被错误边界接住的渲染错误不再触发 window 的 `error` 事件；`useId` 的格式在 19.1、19.2 改过，不要依赖具体格式；警告文字和链接已变，不要引用 `Warning: …` 或组件栈原文；严格模式下的重复渲染和 effect 次数、`useEffect` 里 ref 回调的行为，预测题的答案和 `note` 要按 19.3.0 实测。
- 写完实测：参考答案通过、起始代码被拒、两种常见错误被拒、一种合理的不同写法通过；`npm run test:e2e -- lessons <id> runtime`。

**课文以 19 为默认**：正文只写 19 的写法（`<Ctx value>`、ref 作为 prop、`use()`、Action 等）。React 18 的差异放进提示框，标题统一写 `维护 React 18 项目时`（`<CallBox kind="tip" label="维护 React 18 项目时">`，种类一律用 tip），一课最多一两个，内容是“18 里怎么写、读旧代码时怎么认”。差异的版本边界在 19.x 之内时，标题照同样的体例写成 `维护 React 19.2 之前的项目时`（见 `closures`），种类仍是 tip。从 18 升级的完整路线只在 `delivery` 的选读里讲。

**服务端内容只读**：`'use server'`、服务端组件、Next.js、`react-dom/server` 在实验台里跑不了：用只读 `code` 块展示，在文字里写明“只能阅读”，示例里的“服务器”用模拟的异步函数并说明是模拟。`hydrateRoot` 可以在实验台里跑（服务端 HTML 手写成字符串）。

## 写作规范

- 中文，约 80% 遵循 ASD-STE100 简化技术语言：一句一个意思，短句（尽量 ≤30 字），主动语态，固定术语。比喻和动机段落可以灵活，但同一个比喻不要用在两个概念上（已用过：遥控器、自动售货机、银行柜台等）。
- 步骤写成有序列表，不要用 `<br>1.` 手工编号。
- 术语与 `course/glossary.ts` 一致：set 函数（不写 setState/setter）、唯一数据源、无障碍（不写可访问性）、记忆化（指 memo/useMemo/useCallback 时不写缓存）、卸载（不写销毁）、重新渲染（不写重渲染）、渲染/提交、过渡更新、Action（异步提交函数，首字母大写，和 reducer 的 action 对象区分）。写“React 18 中”，不写“18 里”。新概念第一次出现给一句定义。
- 学习目标用“能写出 / 能解释 / 能诊断 / 能判断……”开头。
- 测验干扰项来自真实误解；正确项的位置和长度不要有规律；`explain` 说明为什么对，并点出最迷惑的错误项错在哪。
- 技术准确，区分 React 18 与 19。

## 架构要点

- **React 组件只是薄包装**：服务端渲染只输出占位元素；浏览器里 `useEffect` 调用引擎函数，把返回的 DOM 挂进去（`theme/lib/useSlot.ts`、`useDomSlot.ts`）。学习机制的逻辑都在引擎里，不在组件里。**不要把交互组件改写成纯 React**。
- **实验台不用 iframe**：页面内按需加载 React 19.3.0 **开发版**，站点自己的 React 与它互不干扰，见下面「实验台运行时」。必须是开发版：引擎靠拦截 React 的警告向学习者显示它们。服务端才有意义的内容（服务端组件、Server Function）在实验台里跑不了，只能用只读 `code` 块展示，并在文字里说明。
- **进度**默认只存在浏览器 `localStorage['hands-on-react-v1']`（键和已有字段不要改，结构见 `course/types.ts` 的 `Progress`）；可选的跨设备同步见「进度同步」；服务端渲染时为空。依赖进度的组件挂载后才显示真实数字（`theme/lib/useProgress.ts`），避免水合不一致。进度变化发 `hoc-progress` 事件。
- **侧栏**由 `rspress.config.ts` 从 `course/order.ts`（顺序）和每课的 `stage` 生成，不用手写；动态标记由全局组件 `ProgressMarks` 写成属性（`data-hoc-done`、`data-hoc-due`、`data-hoc-cnt`、`data-hoc-dr`、`data-hoc-dr-done`），样式在 `theme/style.css`。
- **课程数据按课拆分（主包只带轻量目录）**：浏览器主包（`static/js/index.*.js`）只含 `course/registry.ts` 的**轻量目录**（`LessonMeta`：id、stage、title、mins、localMins、summary、goals，以及生成脚本算好的计数：`quizAnswers`（测验正确答案下标，长度 = 题数）、`nCheck`、`hasExercise`、`nDrills`、`drillTitles`（每道变式的标题，总览页用）、`drillMins`、`nPlays`）。测验、练习、变式练习、示例说明、预测题、keyPoints 等重数据留在 `course/lessons/<id>.ts`，每课一个异步 chunk（`static/js/async/lesson-<id>.*.js`），打开那一课才加载。
  - **同步的只靠目录**：课头、学习目标、测验题数、跳转条、侧栏、首页统计、顶栏、翻页、课末“掌握标准”条（`completion.ts` 用 `quizAnswers` 判断是否全对）、复习到期数量、阶段进度。这些在静态 HTML 里照常输出，水合时不会不一致。**写这类组件时用 `useLesson()`（返回 `LessonMeta`），不要为了读一个字段去加载整课。**
  - **要重数据的用 `useSlot(build)`**（`theme/lib/useSlot.ts`）：先在占位里显示加载状态（`.hoc-loading`，0.15 秒后才淡入，数据很快到达时看不到），数据到了再 `build(lesson)`（拿到的是完整的 `Lesson`）；加载失败显示 `.hoc-loaderr`（原因和“重试”）。实验台、练习的运行时和课数据并行加载。只需要目录的占位用 `useMetaSlot`（例如课前热身）。
  - **跨课取题**（热身、复习、阶段测验）：先用目录和进度选题，得到 `CardRef`（键、课目录项、题号），选好之后才 `resolveCards(refs)`，**只加载选中的题所属的课**（并行），界面在这期间显示加载状态，失败给出重试。**不要在这些页面一次加载全部课。**
  - **新增或修改课的字段后**：生成的目录和映射由 `npm run gen` 更新（`dev`、`build` 启动时自动跑，`check:content` 检查是否最新）。dev 服务器运行期间改了某课的 `title`、`summary`、`goals`、`mins`、题数、有没有练习等目录里的字段，要手动 `npm run gen`（或重启 dev）页面才会变；改题干、练习、示例说明不用，那些在课自己的 chunk 里，热更新照常。
  - 体积由 `tests/e2e/libs.mjs` 守着：主包有上限，且主包里不能有任何课的测验题文字；`tests/e2e/split.mjs` 守着“只请求需要的课的 chunk”。
- **课程注册表自动收集**：`course/lessons/*.ts` → `scripts/gen-registry.mjs` → `course/lessons.generated.ts`、`lessons.catalog.generated.ts`、`lessons.loaders.generated.ts`（提交进仓库）。选生成脚本而不是 `import.meta.webpackContext`：rspress dev/build、Vitest、node 脚本和 tsc 要读同一份课程表，没有一种目录收集写法四处都能用。`dev`/`build` 前自动重新生成，`check:content` 检查它是否最新。
- **课文里的组件树**：`theme/components/RenderTree.tsx`（MDX 里写 `<RenderTree />`）在服务端渲染静态版本（9 个节点按钮、SVG 连线、memo 开关都在 HTML 里，开关先是 disabled），挂载后 `attachHeroTree` 动态加载 `course/engine/heroTree.ts` 去“激活”（根元素上出现 `data-ready`）。`<RenderTree memo />` 的开关默认选中，自动演示的记号用自己的键 `hoc-hero-demo-memo`。激活后树里的内容由它直接改 DOM，所以用 `memo` 包住，React 不会再重渲染它。动画只用 Web Animations API 动 `transform`、`opacity` 和 SVG 的 `stroke-dashoffset`，不引入动画库；减少动画、切后台、卸载的行为见 `heroTree.ts` 开头注释和 `tests/e2e/hero.mjs`（在 rendering 一课里测）。自动演示是否播过记在 `sessionStorage['hoc-hero-demo']`，用户点过节点记在 `localStorage['hoc-hero-touched']`（都不是学习进度的键）。**主包不能带这块的动画代码**：`libs.mjs` 的主包上限会盯着，改完看一眼 `static/js/index.*.js` 的大小。图放在带预测题的示例**之后**，不能在预测之前演出答案。
- **首页短片**：一段 55 秒的短片，讲“React 渲染方式的演变”，可以自动放映，也可以手动滚动。同一个三层空间（你的组件 / React 的树 / DOM 与屏幕）贯穿始终，用带透视的 3D 变换画成，没有任何业务界面。文件：`theme/components/HomePage.tsx`（静态结构和文案，服务端渲染进 HTML）、`theme/story.css`、`course/engine/story.ts`（异步 chunk：播放器、控制条、把轨道变成 Web Animations 并按时间擦洗）、`course/engine/logic/filmData.ts`（每幕时长、节点和色块坐标；**主包里的 HomePage 也 import 它，只放数据**）、`course/engine/logic/filmTracks.ts`（每个元素一条关键帧轨道，纯函数，有单元测试 `tests/unit/film.test.ts`）。
  - **一套画面逻辑**：画面是“影片时间” f 的函数；f = 滚动位置 / 最大滚动位置 × 总时长。手动滚动、拖进度条、自动播放全是同一条路：自动播放只是自己匀速滚动页面。每幕的年份、说明文字的出现和退场、三层空间的动画都在 `filmTracks.ts` 里（时间单位秒，幕的起点是 `MARKS`），只动 `transform`、`opacity` 和 SVG 描边；`story.ts` 把每条轨道变成暂停的 `el.animate`，每帧只更新这一刻值在变化的轨道。**改时长改 `filmData.ts` 的 `DURATIONS`**，别处不用动；整片要保持在 45–60 秒（单元测试会拦）。
  - **默认是静态长文**：没有 JS、减少动画时，三层空间是文档流里的一张“结论帧”（CSS 里元素的默认样式），后面是分节的文字。短片模式只在 `html.story-dyn` 且没有“减少动画”偏好时启用：`.world` 固定在顶栏下面，`.sc` 变成撑出滚动长度的空白段，文字 `.sc-copy` 固定在一侧。`story-dyn` 由 `rspress.config.ts` 的 `head` 里一小段脚本在首屏绘制前加上；动画脚本 6 秒内没起来（`.story` 上没出现 `.ready`）就自动去掉，页面退回静态长文。
  - **自动播放的规则**：首次进入（同一会话没放过 `sessionStorage['hoc-story-played']`、没有已完成的课、没有 hash、没有减少动画、在页面最上面）开场停约 1.2 秒后开始；其余情况只显示“▶ 播放 N 秒短片”。用户的滚轮、触摸、键盘滚动、拖滚动条（滚动位置被别人改了）立刻暂停，监听全是被动的，不 `preventDefault`；键盘快捷键（空格、左右方向键）只在播放器获得焦点时生效，不要全局劫持。标签页转到后台就暂停，回来不自动续播（按钮变“继续播放”）。测试可以设 `window.__storySpeed` 倍速。
  - **不要用 `scroll-snap-type: mandatory`、不要拦截 wheel/touch/键盘；CSS 类名都限定在 `.story` 下，且不要用 `.diff`、`.bar`、`.track`、`.fill` 这类会撞上 Rspress 或课文示例的名字**；3D 画面里不用 `filter: blur` 和 `backdrop-filter`，发光用渐变和 `box-shadow`。史实（年份、版本）改动前要对照 react.dev/blog 和 legacy.reactjs.org/blog。
  - **幕间的过渡元素**（`filmTracks.ts` 的 `flyerTracks`，起点终点由 `story.ts` 的 `buildDynamic` 在布局稳定后量出来、窗口尺寸变化时重算）：第 1→2 幕三条手工的线收拢成从根流入的 state；第 3→4 幕剩下的那一处差别标记飞到节拍线的第一格；收束幕三层空间缩成时间轴的最后一个点，其余各点依次从它拉出来。这些是绝对定位的独立节点，只动 transform 和 opacity。第 7 幕的服务器面板和弧形光路的 `d` 也是这时量出来写上去的。
  - **配乐和音效**（`course/engine/audio.ts`，自己的 chunk，**只在用户点开声音后才动态 import**；离线检查用的 `logic/scoreAnalysis.ts` 只在测试钩子里加载）：用 Web Audio 现场合成，没有音频文件。`scheduleScore(ctx, out, from, to, when)` 把影片时间 [from, to) 的声音排到任何 BaseAudioContext 上，在线（前瞻调度，`AudioContext.currentTime`，不用 setTimeout 发声）和离线（`renderOffline`）共用。要调听感改 `audio.ts` 开头的 `CHORDS`（调式和每一幕的和弦）、`LEVEL`（整体和各层音量）、`ARP`（每幕脉搏的速度、音色、八度）。音效的时间点都取自 `filmData.ts` 的 `CUE`，`filmTracks.ts` 的关键帧用同一批数，`tests/unit/score.test.ts` 会检查每个音效时间点 ±50ms 内画面轨道上有关键帧。默认静音；偏好记在 `localStorage['hoc-story-sound']`、提示是否点过记在 `hoc-story-tip`（都不是学习进度的键）；手动擦洗和暂停时直接静音。
  - 测试 `tests/e2e/home.mjs`（`HOME_SHOTS=1` 重拍 `tests/screenshots/home-story-*.png`，`SCORE_DIR=目录` 把离线渲染的配乐存成 `score.wav` 和 `stats.json`，`BROWSER=webkit` 换引擎；整个套件约 8 分钟，因为有四次真实速度的自动播放性能测量）。
- **站内链接**：引擎拼出来的 `<a>` 带 base 和 `.html`（`course/site.ts` 的 `lessonHref` 等）；全局组件 `LinkRouter` 拦截点击，交给 Rspress 的客户端路由，页面不整页刷新。
- **实验台版面**：`.hoc-slot` 是 CSS 容器，宽度不足 900px 时编辑器在上、预览在下，保证 60 字符的代码行不折行。
- **预览区的站点默认样式必须是零优先级**（`theme/style.css` 里 `:where(.preview button)` 这种写法，不要写成 `.preview button`）。因为实验台没有 iframe，站点样式和学习者的 `<style>` 在同一页面，优先级更高的默认样式会盖住示例里的单类选择器。示例里不要出现 `.preview`，选择器按真实项目的自然写法来；冒烟测试 b2 项守着这一条。示例的类名也别用站点自己的 `.btn`。
- **压缩不能改函数名**：练习的检查函数有依赖函数名的写法（例如 React 的组件栈要能看到 `Thrower`），所以 `rspress.config.ts` 里给压缩器设了 `keep_fnames`。不要去掉。
- **Rspress 文档表格样式**（外边距、圆角、边框）会作用于 `.rp-doc` 里的所有 `table`。自带外框的 `.tbl` 要加 `rp-not-doc` 类，否则表头上方会多出空白。
- **Biome 配置**（`biome.jsonc`）：2 空格、单引号、分号、尾逗号，行宽 160。`course/lessons/**` 只保留结构性检查（里面的 `exercise.test` 是旧式检查脚本，改写法有改变行为的风险）；`style.css`、MDX、快照、生成文件不检查。数据文件里的示例代码都在字符串里，格式化不会改变字符串内容。

## 发布

- 推送到 `main` 后，`ci.yml` 先跑 `check` 和 `e2e` 两个 job；全部通过后 `deploy.yml` 把 CI 构建好的站点发布到 GitHub Pages（不重复构建）。pull request 只跑 CI，不部署。
- 第一次要在仓库 **Settings → Pages → Source** 选 “GitHub Actions”。站点地址 `https://<用户>.github.io/hands-on-react/`；base 在 `course/site.ts`，换仓库名要同步改。
- 依赖更新：Dependabot（`.github/dependabot.yml`，npm 和 GitHub Actions，每周一次，同类合并成一个 PR）。
- `doc_build/` 是纯静态文件，也可以放到任何静态托管（注意保持 base 路径）。
- 学习进度存在浏览器 localStorage，不同网址的进度不互通（想跨设备要学习者自己开启「进度同步」，或用导出 / 导入文件）。
- 仓库还没有 `LICENSE`：公开仓库之前由所有者自己选择许可证。
