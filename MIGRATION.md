# 迁移到 Rspress：架构与接手指南

旧版（单文件网页）在 `src/`、`tests/`、`build.py`，**第一阶段保留不动**，新站点是并存的另一套。
第一阶段用 3 课（`what-is-react`、`state`、`lists-keys`，各带练习，`state` 有预测题）跑通全流程。

## 命令

```bash
npm run docs:convert [课id...]   # 旧数据 → MDX + 数据文件；不带参数转全部；--meta 重新生成 order.js / glossary.js
npm run docs:dev                 # 开发服务器
npm run docs:build               # 构建到 doc_build/（base 是 /hands-on-react/）
npm run docs:preview             # 预览构建结果
npm run test:site                # tests-site/smoke.mjs：对 doc_build 做端到端检查（需要网络，实验台从 jsdelivr 加载）
node tests-site/screenshots.mjs  # 浅色/深色截图（要先 docs:preview，或设 SITE_URL）
```

## 目录

| 位置 | 作用 |
|---|---|
| `rspress.config.ts` | 站点配置：base、中文、remark 插件、全局组件、死链接检查的临时豁免 |
| `docs/` | Rspress 的文档根。`docs/lessons/<id>.mdx` 由转换脚本生成；`_meta.json` 按阶段分组（脚本生成）；`_nav.json` 顶部导航；`index.md` 首页占位 |
| `course/lessons/<id>.js` | 每课的非正文数据（脚本生成）：id、stage、title、mins、summary、goals、keyPoints、quiz、exercise（含 test 函数源码）、checkOnly、plays |
| `course/registry.js` | 汇总注册表（脚本按已有的课生成）：`LESSONS`（按课程顺序）、`lessonNo(id)`、`lessonById` |
| `course/order.js`、`glossary.js`、`stages.js`、`site.js` | 课程顺序（课号 = 位置）、术语表、6 个阶段、站点常量（BASE） |
| `course/engine/` | 引擎，由旧 `src/app.js` 改造：`engine.js`（实验台、练习、题目、间隔复习、测验、热身、自我解释、术语标注）、`store.js`（进度，键 `hands-on-react-v1`）、`runtime.js`（`loadRuntime()`）、`util.js` |
| `plugins/remark-play.mjs` | 把 ```` ```jsx play title="…" ```` 变成 `<Playground code title />` |
| `theme/components/` | React 薄包装组件，都在 `rspress.config.ts` 的 `markdown.globalComponents` 里注册，MDX 里不用 import |
| `theme/style.css` | 组件样式（从旧 `style.css` 搬来），浅色 `:root`、深色 `html.dark` |
| `scripts/convert.mjs` | 转换脚本 |
| `tests-site/` | 站点冒烟测试和截图 |

## 数据流

- 课文：`## 标题`、段落、列表、表格、围栏代码块是普通 Markdown。`tip/warn/like/deep` → `<CallBox kind label>`；自定义 class 的 HTML（`<ol class="task-steps">`、`fig`、复杂表格）→ `<Raw html tag className />`。标题带“（选读）”的小节 → `<details className="optional">`。
- `play(src, title, note)` → ```` ```jsx play title="标题" ````；`note`、预测题放在 `course/lessons/<id>.js` 的 `plays[标题]`（`{ note, predict, pkey }`）。标题重名或没有标题时键是 `#序号`，MDX 里用 `key="#序号"`。`pkey` 是旧的预测键 `课id|原标题`（进度里 `__pred` 用它，别改）。
- 组件在服务端只输出占位元素；`useEffect` 里调引擎函数，把返回的 DOM 挂进去。课 id 从路由得到（`theme/lib/useLesson.ts`）。
- 实验台需要全局的 React 18.3.1 **开发版**、ReactDOM、Babel 7.25.6、Prism：`loadRuntime()` 第一次需要时从 jsdelivr 插入脚本（不放 iframe，站点自己的 React 19 和它互不干扰）。引擎靠拦截 `Warning:` 开头的 `console.error` 显示 React 警告，所以必须是开发版。
- 进度：`localStorage['hands-on-react-v1']`，结构和旧版一致；只在浏览器里读写。进度变化发 `hoc-progress` 事件（旧版的 `refreshChrome()`），`ProgressMarks`（全局组件）据此给侧栏已学完的课加 `data-hoc-done`。

## 转换脚本的验证

每课生成后脚本会自检：MDX 能用 `@mdx-js/mdx` 编译；数据文件能加载且字段与旧数据逐一相同（函数比较源码）；每个 Markdown 段落、列表、表格用 remark 解析回来，纯文本必须和原 HTML 的纯文本一致，不一致就退回 `<Raw>`（HTML 原样输出）。已用全部 45 课试跑：全部能转换、能编译，约 16 处段落退回 `<Raw>`。

## 第二阶段要注意的坑

**转换粗糙的地方**
- 段落里夹着 `<ol class="task-steps">` 的（“……：<ol>…</ol>”），整段退回 `<Raw tag="div">`：正文不进 Markdown，站内搜索搜不到，术语标注仍然有效。想改善可以把段落拆成“文字 + Raw”两块。
- 行内只支持 `code b strong em i a(href="#课id") br` 和无属性的 `kbd small sub sup mark u s del`；带属性的标签、`<span class>` 等整段退回 `<Raw>`。
- `**` 紧贴标点和英文字母时 Markdown 可能解析失败：脚本先试 `**`，不行就换 `<strong>`，再不行才退回 Raw。
- 站内链接：`#课id` → `/lessons/课id`，`#glossary`、`#review`、`#check-N` → `/glossary`、`/review`、`/check/N`（这些页面第一阶段不存在）。`rspress.config.ts` 里的 `pendingLink` 暂时豁免这些死链接；第二阶段做完后删掉豁免，让死链接检查恢复。
- 标题里不能同时含 `"` `'` `` ` `` 三种引号（代码块 `title=` 无法转义），脚本会报错。
- **练习的 `test` 函数**：脚本保留函数源码，但不检查它有没有引用数据文件之外的变量（旧文件里的辅助函数）。第二阶段转完后，务必对每课跑一遍“填 solution 点检查”（`tests/lessons.mjs` 的思路，可参照 `tests-site/smoke.mjs` 的 e 项）。
- `checkOnly` 已按旧逻辑合并（`CHECK_ONLY`、`CHECK_MORE`、课上自带的，顺序不变）。**不要改题的顺序**，复习卡片键是 `课id#cN`。
- 站内搜索只索引 MDX 正文（含代码块）；摘要、学习目标、测验题在数据文件里，搜不到。

**引擎里还没迁的旧外壳功能**
- 首页（hero、可点击的组件树 `buildHeroTree`、统计、学习方法、学习路线、前置要求）：现在 `docs/index.md` 只是占位。
- 复习页（`renderReview`：今日复习、混合练习）、侧栏“今日复习”到期角标。
- 术语表页（`renderGlossary`；数据在 `course/glossary.js`）。
- 阶段测验页（`renderCheck`：12 题交卷模式、30 分钟冷却、中途离开算未通过、35 天复测）和每阶段末尾的 `stage-cta`、侧栏“阶段测验”条目、阶段已掌握标记。需要 `progress.__stage`。
- 顶栏总进度（已完成 N/45）、侧栏每阶段 `n/m` 计数。
- 阅读进度条（`#read-bar`）、“继续上次位置”（`offerResume`，键 `<STORE_KEY>:pos`）。
- 键盘 ← → 翻课。
- 引擎里这些逻辑仍在旧 `src/app.js`，迁移时照搬并改成 `make…()` 函数：`renderReview`、`renderCheck`、`renderHome`、`renderGlossary`。`makeWarmup`、`srsRecord`、`dueCards`、`cardOf` 等已经导出。
- 引擎 `srcLine`（“回看这一课”）和复习卡片里的链接是普通 `<a>`，点击会整页跳转，不走站内路由。

**其他**
- 上一课/下一课按注册表里已有的课排；全部转换后与课程顺序一致。Rspress 自带的上下页已用 CSS 隐藏。
- 实验台依赖 CDN（jsdelivr），离线不能运行。
- 引擎对术语标注 `markTerms` 的唯一改动：跳过选择器里 `.tbl th` 改成 `th`（站点表格是普通 Markdown 表格，没有 `.tbl` 容器）。
- 旧 `src/` 在第二阶段结束前继续是转换脚本的数据来源，不要删。
