/* ---------- 进度存储（仅保存在本浏览器） ----------
   数据结构见 course/types.ts 的 Progress；键名改为 hands-on-react-v1（用户还没有旧进度，不需要迁移）。
   只在浏览器里读写：静态生成（Node）时 progress 保持为空对象，也不会碰 localStorage。 */
import type { LessonProgress, Progress } from '../types.ts';

export const STORE_KEY = 'hands-on-react-v1';
export const progress: Progress = {};
if (typeof window !== 'undefined') {
  try { Object.assign(progress, JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}') || {}); } catch { /* 读不到就当空 */ }
}
export const save = () => { try { window.localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch {} };
export const lp = (id: string): LessonProgress => (progress[id] = progress[id] || { quiz: {}, ex: false, done: false });
export const isDone = (id: string): boolean => !!(progress[id] && progress[id].done);
/* 进度变化通知：旧版的 refreshChrome() 在这里变成一个事件，侧栏标记等组件监听它 */
export const PROGRESS_EVENT = 'hoc-progress';
export const emitProgress = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event(PROGRESS_EVENT)); };
