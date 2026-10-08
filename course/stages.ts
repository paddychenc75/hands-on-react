/* 6 个阶段（取自旧版 src/app.js 的 STAGES） */
import type { Stage } from './types.ts';

export const STAGES: Stage[] = [
  { no: '01', name: '入门', en: 'Foundations', desc: 'JSX、组件、Props、State、事件、列表和表单，最后做一个完整的待办应用。' },
  {
    no: '02',
    name: 'Hooks 与数据流',
    en: 'Hooks & data flow',
    desc: '状态提升、useReducer、Context、useRef、useEffect 与自定义 Hook，再用异步搜索和看板两个项目练手。',
  },
  {
    no: '03',
    name: '渲染与性能',
    en: 'Rendering & performance',
    desc: '渲染机制、DOM 逃生舱、性能优化、闭包陷阱、并发特性、Suspense 与性能测量，知其然更知其所以然。',
  },
  {
    no: '04',
    name: '应用架构与全栈 React',
    en: 'Architecture & full-stack',
    desc: '设计模式、无障碍、动画与过渡、状态架构、Actions、Server Components 与安全，亲手实现迷你 React，最后用一个看板综合练习把这一阶段串起来。',
  },
  {
    no: '05',
    name: '生态与实战',
    en: 'Ecosystem & projects',
    desc: '项目搭建与工具链、交付与升级、TypeScript、React Router、TanStack Query、测试与 Next.js，最后用一个综合项目把这些工具接在一起。',
  },
  {
    no: '06',
    name: '深入专题与毕业设计',
    en: 'Deep dives & capstone',
    desc: '调度与并发内核、Suspense 数据获取、流式渲染与水合、大型状态架构、组件库 API、表单架构、错误监控与性能诊断，最后用毕业设计做出自己的作品集。',
  },
];
