/* ---------- 进度存储（仅保存在本浏览器） ----------
   数据结构见 course/types.ts 的 Progress；键名改为 hands-on-react-v1（用户还没有旧进度，不需要迁移）。
   只在浏览器里读写：静态生成（Node）时 progress 保持为空对象，也不会碰 localStorage。 */
import type { DrillProgress, LessonProgress, Progress } from '../types.ts';
import { type Fingerprints, fingerprints, stamp } from './logic/stamp.ts';

export const STORE_KEY = 'hands-on-react-v1';
export const progress: Progress = {};
if (typeof window !== 'undefined') {
  try {
    Object.assign(progress, JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}') || {});
  } catch {
    /* 读不到就当空 */
  }
}
/* 改动时间戳（跨设备同步合并时判断谁更新）：保存前把和上次不同的组盖上 Date.now()。只新增 ts / t 字段，见 logic/stamp.ts */
const snap: Fingerprints = typeof window !== 'undefined' ? fingerprints(progress) : {};
/** 进度被同步引擎整体换过之后调用：把新内容当作"已经保存过"，不要把它们盖成本机刚改的 */
export const resyncStamps = () => {
  for (const k of Object.keys(snap)) delete snap[k];
  Object.assign(snap, fingerprints(progress));
};
/** 每次保存后发出：同步引擎（开启同步时才加载）据此安排推送 */
export const SAVED_EVENT = 'hoc-saved';
export const save = () => {
  stamp(progress, snap, Date.now());
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(progress));
  } catch {}
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SAVED_EVENT));
};
export const lp = (id: string): LessonProgress => (progress[id] = progress[id] || { quiz: {}, ex: false, done: false });
/** 一道变式练习的记录（不存在就创建）。旧数据里没有 dr 字段，在这里补上 */
export const drillRec = (id: string, i: number): DrillProgress => {
  const p = lp(id);
  p.dr = p.dr || {};
  p.dr[i] = p.dr[i] || { ok: false };
  return p.dr[i];
};
export const isDone = (id: string): boolean => !!(progress[id] && progress[id].done);
/* 进度变化通知：旧版的 refreshChrome() 在这里变成一个事件，侧栏标记等组件监听它 */
export const PROGRESS_EVENT = 'hoc-progress';
export const emitProgress = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PROGRESS_EVENT));
};
