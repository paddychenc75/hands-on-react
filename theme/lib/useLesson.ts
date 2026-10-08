import { useLocation } from '@rspress/core/runtime';
import { lessonById } from '../../course/registry.ts';
import type { LessonMeta } from '../../course/types.ts';

/** 当前页对应的课（轻量目录里的一项：标题、摘要、目标、计数。同步，服务端渲染时就有）。课 id 从路由得到：/hands-on-react/lessons/state.html → state。
 *  要题目、练习、示例说明等重数据，用 useSlot（按课异步加载）。 */
export function useLesson(): LessonMeta | undefined {
  const { pathname } = useLocation();
  const id =
    decodeURIComponent(pathname)
      .replace(/\.html$/, '')
      .replace(/\/+$/, '')
      .split('/')
      .pop() || '';
  return lessonById(id);
}
