import { useLocation } from '@rspress/core/runtime';
import { lessonById } from '../../course/registry.js';

/** 当前页对应的课（数据文件的内容）。课 id 从路由得到：/hands-on-react/lessons/state.html → state */
export function useLesson(): any {
  const { pathname } = useLocation();
  const id = decodeURIComponent(pathname).replace(/\.html$/, '').replace(/\/+$/, '').split('/').pop() || '';
  return lessonById(id);
}
