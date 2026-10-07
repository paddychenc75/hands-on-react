import * as path from 'node:path';
import { existsSync } from 'node:fs';
import { defineConfig } from '@rspress/core';
import remarkPlay from './plugins/remark-play.mjs';
import { BASE, SITE_TITLE } from './course/site.js';

const here = import.meta.dirname;
const component = (name: string) => path.join(here, 'theme/components', name + '.tsx');

// 第一阶段只转换了几课：指向还没有页面的课、阶段测验、复习页、术语表的链接先不报“死链接”。
// 第二阶段全部做完后，把 excludes 去掉，让死链接检查恢复。
const PENDING = /^\/(glossary|review|check\/\d)$/;
const pendingLink = (url: string) => {
  const lesson = url.match(/^\/lessons\/([^/#?]+)/);
  if (lesson) return !existsSync(path.join(here, 'docs/lessons', lesson[1] + '.mdx'));
  return PENDING.test(url.split(/[#?]/)[0]);
};

export default defineConfig({
  root: 'docs',
  base: BASE,
  lang: 'zh',
  title: SITE_TITLE,
  description: '中文交互式 React 课程：先预测再运行，边做边学。',
  globalStyles: path.join(here, 'theme/style.css'),
  outDir: 'doc_build',
  // 课文里的 <Playground>、<Quiz> 等组件，在 MDX 里不用逐个 import
  markdown: {
    remarkPlugins: [remarkPlay],
    globalComponents: [
      'Playground', 'Quiz', 'Exercise', 'Warmup', 'SelfExplain', 'CallBox', 'Raw',
      'LessonHeader', 'LessonGoals', 'LessonProse', 'LessonFooter',
    ].map(component),
    link: { checkDeadLinks: { excludes: pendingLink } },
  },
  // 全局挂载：读进度，给侧栏里学完的课加标记
  globalUIComponents: [component('ProgressMarks')],
  themeConfig: {
    lastUpdated: false,
  },
});
