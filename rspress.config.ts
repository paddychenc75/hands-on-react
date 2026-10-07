import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import remarkPlay from './plugins/remark-play.mjs';
import { BASE, SITE_TITLE } from './course/site.js';
import { LESSONS, lessonNo } from './course/registry.js';
import { STAGES } from './course/stages.js';

const here = import.meta.dirname;
const component = (name: string) => path.join(here, 'theme/components', name + '.tsx');

// 侧栏：全站一份（课程页、复习页、术语表、阶段测验页都显示同一个目录），按阶段分组。
const lessonSidebar = [
  { text: '今日复习', link: '/review' },
  { text: '术语表', link: '/glossary' },
  ...STAGES.flatMap((s: any, si: number) => [
    { sectionHeaderText: `${s.no} ${s.name}` },
    ...LESSONS.filter((l: any) => l.stage === si).map((l: any) => ({ text: `${lessonNo(l.id)}. ${l.title}`, link: '/lessons/' + l.id })),
    { text: '阶段测验', link: '/check/' + si },
  ]),
];

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
      'HomePage', 'ReviewPage', 'GlossaryPage', 'StageCheck',
    ].map(component),
    link: { checkDeadLinks: true },
  },
  // 全局挂载：读进度，给侧栏里学完的课加标记
  globalUIComponents: ['ProgressMarks', 'ReadingAids', 'LinkRouter'].map(component),
  // 练习的检查函数里有依赖函数名的写法（例如 React 的组件栈要能看到 Thrower），所以压缩时不能改函数名和类名
  builderConfig: {
    output: {
      minify: {
        js: true,
        jsOptions: { minimizerOptions: { mangle: { keep_fnames: true, keep_classnames: true }, compress: { keep_fnames: true, keep_classnames: true } } },
      },
    },
  },
  themeConfig: {
    lastUpdated: false,
    sidebar: { '/': lessonSidebar },
  },
});
