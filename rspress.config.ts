import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import remarkPlay from './plugins/remark-play.mjs';
import { BASE, SITE_TITLE } from './course/site.ts';
import { LESSONS, lessonNo } from './course/registry.ts';
import { STAGES } from './course/stages.ts';

const here = import.meta.dirname;
const component = (name: string) => path.join(here, 'theme/components', name + '.tsx');

// 侧栏：全站一份（课程页、复习页、术语表、阶段测验页都显示同一个目录），按阶段分组。
// 课的顺序来自 course/order.ts，阶段来自每课数据文件的 stage：加课不用改这里。
const lessonSidebar = [
  { text: '课程首页', link: '/' },
  { text: '课程地图', link: '/roadmap' },
  { text: '今日复习', link: '/review' },
  { text: '术语表', link: '/glossary' },
  { text: '变式练习', link: '/drills' },
  ...STAGES.flatMap((s, si) => [
    { sectionHeaderText: `${s.no} ${s.name}` },
    ...LESSONS.filter(l => l.stage === si).map(l => ({ text: `${lessonNo(l.id)}. ${l.title}`, link: '/lessons/' + l.id })),
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
  // 首页叙事的动态布局开关：浏览器支持 CSS 滚动驱动动画时，在首屏绘制前就打开，避免加载后版面跳动。没有 JS 时页面是静态长文。
  head: ['<script>try{if(CSS.supports("animation-timeline","view()"))document.documentElement.classList.add("story-dyn")}catch(e){}</script>'],
  // 课文里的 <Playground>、<Quiz> 等组件，在 MDX 里不用逐个 import
  markdown: {
    remarkPlugins: [remarkPlay],
    globalComponents: [
      'Playground',
      'Quiz',
      'Exercise',
      'Drills',
      'Warmup',
      'SelfExplain',
      'CallBox',
      'Raw',
      'LessonHeader',
      'LessonGoals',
      'LessonProse',
      'LessonFooter',
      'HomePage',
      'RoadmapPage',
      'RenderTree',
      'ReviewPage',
      'GlossaryPage',
      'DrillsPage',
      'StageCheck',
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
