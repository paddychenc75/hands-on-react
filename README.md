# 动手学 React

中文交互式 React 课程：45 课，6 个阶段（入门、进阶、高级、原理与架构、生态与实战、深入），约 20 小时。可运行示例、预测题、练习自动判分、间隔复习和阶段测验都在一个 HTML 文件里。

## 直接使用

双击打开 `dist/react-course.html`（需要联网加载 React 和 Babel）。

## 修改和构建

```bash
npm install
npx playwright install chromium   # 第一次
npm run check    # 语法检查
npm run build    # 生成 index.html 和 dist/react-course.html
npm test         # 构建并跑全部测试
```

需要 Python 3 和 Node 18 以上。

## 交给 Claude Code 维护

```bash
cd react-learning
git init && git add -A && git commit -m "初始导入"   # 建议：方便回退
claude
```

Claude Code 会自动读取 `CLAUDE.md`，里面写了文件结构、课程数据格式、加课步骤、学习机制、写作规范和测试命令。

## 目录

- `src/`：源码（课程数据、引擎、样式、构建脚本）
- `tests/`：Playwright 测试
- `dist/react-course.html`：构建好的独立网页
- `index.html`：发布到 claude.ai Artifact 用的版本
- `review/`：历次评审报告
