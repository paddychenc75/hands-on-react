/* 6 个阶段（取自旧版 src/app.js 的 STAGES） */
import type { Stage } from './types.ts';

export const STAGES: Stage[] = [
  { no: '01', name: '入门', en: 'Foundations', desc: 'JSX、组件、Props、State、事件、列表和表单，最后做一个完整的待办应用。' },
  { no: '02', name: '进阶', en: 'Hooks in depth', desc: '状态提升、useReducer、Context、useRef、useEffect、自定义 Hook 与 DOM 逃生舱，再用异步搜索和看板两个项目练手。' },
  { no: '03', name: '高级', en: 'Under the hood', desc: '渲染机制、性能优化、闭包陷阱、Suspense、并发特性与性能测量，知其然更知其所以然。' },
  { no: '04', name: '原理与架构', en: 'Architecture', desc: '设计模式、无障碍、状态架构、React 19、Server Components 与安全，并亲手实现迷你 React。' },
  { no: '05', name: '生态与实战', en: 'Ecosystem & projects', desc: 'TypeScript、React Router、TanStack Query、测试与 Next.js：把 React 放进真实项目的工具链。' },
  { no: '06', name: '深入', en: 'In depth', desc: '调度与并发内核、Suspense 数据获取、流式渲染与水合、大型状态架构、组件库 API、表单架构、错误监控与性能诊断，最后用毕业设计做出自己的作品集。' },
];
