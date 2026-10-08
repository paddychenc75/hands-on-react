# 动手学 React

中文交互式 React 课程：47 课，6 个阶段（入门、Hooks 与数据流、渲染与性能、应用架构与全栈 React、生态与实战、深入专题与毕业设计），约 25 小时。可运行示例、先预测再运行、练习自动判分、间隔复习和阶段测验。站点用 [Rspress 2](https://rspress.rs)（React + MDX）构建，静态发布到 GitHub Pages。

学习进度只存在你的浏览器里（`localStorage`），不上传到任何地方。

## 本地运行

需要 Node 24 以上（`.nvmrc` 是 24）。

```bash
npm install
npx playwright install chromium   # 第一次，浏览器测试用
npm run dev                       # 开发服务器（热更新）
npm run build                     # 构建到 doc_build/
npm run preview                   # 预览构建结果
```

实验台跑的是 React 19.3.0 开发版（站内自带，构建时由 `scripts/build-react19.mjs` 生成）。Babel 和 Prism 按需从 cdn.jsdelivr.net 加载，所以实验台需要联网。

## 检查和测试

```bash
npm run check      # 类型检查 + Biome + 内容校验 + 单元测试，约 2 秒，每次提交前跑
npm test           # check + 构建 + 浏览器测试，约 3 分钟
npm run test:e2e -- lessons state use-effect   # 浏览器测试只测指定的课
```

`npm install` 会自动启用提交前钩子（提交前跑 lint 和内容校验，几秒）。每个命令何时用、多久跑完，见 [AGENTS.md](AGENTS.md) 的“命令”一节。

## 目录

- `docs/`：课文（`lessons/*.mdx`）、首页、复习页、术语表、阶段测验页
- `course/`：课程数据（`lessons/*.ts`）、课程顺序（`order.ts`）、类型（`types.ts`）、引擎（`engine/`，纯逻辑在 `engine/logic/`）
- `theme/`：React 薄包装组件和样式
- `scripts/`：内容校验、新建一课、生成注册表
- `tests/`：`unit/`（Vitest）、`e2e/`（Playwright）、截图
- `review/`：历次评审报告

## 加一课

```bash
npm run new-lesson -- <课id> --stage <0-5> --after <已有课id> --title "标题"
```

脚本会生成课文和数据文件的骨架，并登记到课程顺序里。之后把“【待写】”占位换成内容，跑 `npm run check`。完整步骤、MDX 和数据文件的写法、练习检查工具、复习卡片键的规则、学习机制和写作规范，都在 [AGENTS.md](AGENTS.md)。

## 部署到 GitHub Pages

1. 把仓库推到 GitHub，仓库名是 `hands-on-react`（换名字要同步改 `course/site.ts` 里的 `BASE`）。
2. 在仓库 **Settings → Pages**，把 **Source** 设为 **GitHub Actions**。
3. 推送到 `main`。`.github/workflows/ci.yml` 先跑检查、构建和浏览器测试；全部通过后 `deploy.yml` 发布站点，地址是 `https://paddychenc75.github.io/hands-on-react/`。

Pull request 只跑 CI，不会部署。

## 许可证

本仓库有两种许可证：

- **代码**用 [MIT](LICENSE)：`course/engine/`、`theme/`、`plugins/`、`scripts/`、`tests/` 和各配置文件。
- **课程内容**用 [CC BY-NC-SA 4.0](LICENSE-CONTENT)：`docs/`、`course/lessons/`、`course/glossary.ts` 和 `review/`。你可以转载和改编，但要署名、不能商用，改编后的作品要用同样的许可证。

课文里的示例代码片段可以按 MIT 使用。

## 交给 AI 助手维护

项目规则全部在 [AGENTS.md](AGENTS.md)（Claude Code 通过 `CLAUDE.md` 导入它，Codex 等其他助手直接读它）：目录约定、命令表、加课步骤、改引擎的流程、学习机制和写作规范。
