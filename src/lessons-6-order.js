/* ========== 最终课程顺序 ==========
   阶段 2 按 react.dev 的顺序：先管理 state（状态提升 → reducer → Context），再学逃生舱（ref → effect）。
   实战项目放到所需知识学完的阶段末尾，让练习分散在整个课程中。 */
const LESSON_ORDER = [
  // 01 入门
  'what-is-react', 'jsx', 'components-props', 'state', 'events', 'conditional', 'lists-keys', 'forms', 'project-todo',
  // 02 进阶
  'lifting-state', 'use-reducer', 'context', 'use-ref', 'use-effect', 'custom-hooks', 'escape-hatches', 'project-search', 'project-kanban',
  // 03 高级
  'rendering', 'performance', 'closures', 'suspense', 'concurrent', 'profiling',
  // 04 专家
  'patterns', 'accessibility', 'state-architecture', 'react-19', 'server-components', 'mini-react', 'engineering',
  // 05 生态与实战
  'typescript', 'router', 'tanstack-query', 'testing', 'nextjs',
  // 06 专家（lessons-7-*.js）
  'scheduler', 'suspense-data', 'streaming-ssr', 'state-at-scale', 'headless-components', 'form-architecture', 'error-handling', 'perf-clinic',
  'portfolio',
];
const STAGE_OF = { 'project-todo': 0, 'project-search': 1, 'project-kanban': 1, 'portfolio': 5 };
LESSONS.sort((a, b) => {
  const ia = LESSON_ORDER.indexOf(a.id), ib = LESSON_ORDER.indexOf(b.id);
  return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
});
LESSONS.forEach(l => { if (l.id in STAGE_OF) l.stage = STAGE_OF[l.id]; });
