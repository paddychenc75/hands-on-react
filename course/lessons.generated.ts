// 由 scripts/gen-registry.mjs 生成，不要手改。运行 npm run gen 更新（dev、build 会自动运行；check:content 会检查它是否最新）。
// Node 端收集 course/lessons 里的所有课；课程顺序在 course/order.ts。浏览器代码不要 import 这个文件（见 course/lessons.loaders.generated.ts）。
import type { Lesson } from './types.ts';
import l_accessibility from './lessons/accessibility.ts';
import l_animation from './lessons/animation.ts';
import l_closures from './lessons/closures.ts';
import l_components_props from './lessons/components-props.ts';
import l_concurrent from './lessons/concurrent.ts';
import l_conditional from './lessons/conditional.ts';
import l_context from './lessons/context.ts';
import l_custom_hooks from './lessons/custom-hooks.ts';
import l_delivery from './lessons/delivery.ts';
import l_engineering from './lessons/engineering.ts';
import l_error_handling from './lessons/error-handling.ts';
import l_escape_hatches from './lessons/escape-hatches.ts';
import l_events from './lessons/events.ts';
import l_form_architecture from './lessons/form-architecture.ts';
import l_forms from './lessons/forms.ts';
import l_headless_components from './lessons/headless-components.ts';
import l_jsx from './lessons/jsx.ts';
import l_lifting_state from './lessons/lifting-state.ts';
import l_lists_keys from './lessons/lists-keys.ts';
import l_mini_react from './lessons/mini-react.ts';
import l_nextjs from './lessons/nextjs.ts';
import l_patterns from './lessons/patterns.ts';
import l_perf_clinic from './lessons/perf-clinic.ts';
import l_performance from './lessons/performance.ts';
import l_portfolio from './lessons/portfolio.ts';
import l_profiling from './lessons/profiling.ts';
import l_project_actions from './lessons/project-actions.ts';
import l_project_kanban from './lessons/project-kanban.ts';
import l_project_search from './lessons/project-search.ts';
import l_project_todo from './lessons/project-todo.ts';
import l_project_weather from './lessons/project-weather.ts';
import l_react_19 from './lessons/react-19.ts';
import l_rendering from './lessons/rendering.ts';
import l_router from './lessons/router.ts';
import l_scheduler from './lessons/scheduler.ts';
import l_server_components from './lessons/server-components.ts';
import l_state_architecture from './lessons/state-architecture.ts';
import l_state_at_scale from './lessons/state-at-scale.ts';
import l_state from './lessons/state.ts';
import l_streaming_ssr from './lessons/streaming-ssr.ts';
import l_styling from './lessons/styling.ts';
import l_suspense_data from './lessons/suspense-data.ts';
import l_suspense from './lessons/suspense.ts';
import l_tanstack_query from './lessons/tanstack-query.ts';
import l_testing from './lessons/testing.ts';
import l_typescript from './lessons/typescript.ts';
import l_use_effect from './lessons/use-effect.ts';
import l_use_reducer from './lessons/use-reducer.ts';
import l_use_ref from './lessons/use-ref.ts';
import l_what_is_react from './lessons/what-is-react.ts';

export const LESSON_MODULES: Record<string, Lesson> = {
  'accessibility': l_accessibility,
  'animation': l_animation,
  'closures': l_closures,
  'components-props': l_components_props,
  'concurrent': l_concurrent,
  'conditional': l_conditional,
  'context': l_context,
  'custom-hooks': l_custom_hooks,
  'delivery': l_delivery,
  'engineering': l_engineering,
  'error-handling': l_error_handling,
  'escape-hatches': l_escape_hatches,
  'events': l_events,
  'form-architecture': l_form_architecture,
  'forms': l_forms,
  'headless-components': l_headless_components,
  'jsx': l_jsx,
  'lifting-state': l_lifting_state,
  'lists-keys': l_lists_keys,
  'mini-react': l_mini_react,
  'nextjs': l_nextjs,
  'patterns': l_patterns,
  'perf-clinic': l_perf_clinic,
  'performance': l_performance,
  'portfolio': l_portfolio,
  'profiling': l_profiling,
  'project-actions': l_project_actions,
  'project-kanban': l_project_kanban,
  'project-search': l_project_search,
  'project-todo': l_project_todo,
  'project-weather': l_project_weather,
  'react-19': l_react_19,
  'rendering': l_rendering,
  'router': l_router,
  'scheduler': l_scheduler,
  'server-components': l_server_components,
  'state-architecture': l_state_architecture,
  'state-at-scale': l_state_at_scale,
  'state': l_state,
  'streaming-ssr': l_streaming_ssr,
  'styling': l_styling,
  'suspense-data': l_suspense_data,
  'suspense': l_suspense,
  'tanstack-query': l_tanstack_query,
  'testing': l_testing,
  'typescript': l_typescript,
  'use-effect': l_use_effect,
  'use-reducer': l_use_reducer,
  'use-ref': l_use_ref,
  'what-is-react': l_what_is_react,
};
