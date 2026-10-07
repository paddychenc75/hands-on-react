# 动手学 React

中文交互式 React 课程：45 课，6 个阶段（入门、进阶、高级、原理与架构、生态与实战、深入），约 20 小时。可运行示例、先预测再运行、练习自动判分、间隔复习和阶段测验。站点用 [Rspress 2](https://rspress.rs)（React + MDX）构建。

## 本地运行

需要 Node 22 以上（`.nvmrc` 是 24）。

```bash
npm install
npx playwright install chromium   # 第一次，测试用
npm run dev        # 开发服务器
npm run build      # 构建到 doc_build/
npm run preview    # 预览构建结果
npm test           # 构建 + 全部测试（逐课、学习机制、冒烟；需要联网）
```

实验台需要联网：页面按需从 cdn.jsdelivr.net 加载 React 18.3.1 开发版、Babel 和 Prism。

## 目录

- `docs/`：课文（`lessons/*.mdx`）、首页、复习页、术语表、阶段测验页
- `course/`：每课的数据（`lessons/*.js`）、注册表、引擎（`engine/`）
- `theme/`：React 组件和样式
- `tests/`：Playwright 测试和截图
- `review/`：历次评审报告

怎样加一课、MDX 和数据文件格式、练习检查工具和学习机制说明，见 `CLAUDE.md`。

## 发布

推送到 `main` 后，GitHub Actions 构建并部署到 GitHub Pages（见 `.github/workflows/deploy.yml`）。

## 交给 Claude Code 维护

Claude Code 会自动读取 `CLAUDE.md`，里面写了目录结构、加课步骤、数据格式、学习机制和写作规范。
