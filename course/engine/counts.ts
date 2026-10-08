/* 侧栏与顶栏要显示的数字。只用轻量目录和进度，同步，不加载课的题目。 */
import { LESSONS } from '../registry.ts';
import { dueRefs } from './cards.ts';
import { drillRows, drillTotals } from './logic/drills.ts';
import { isDone, progress } from './store.ts';

export const doneCount = () => LESSONS.filter(l => isDone(l.id)).length;
export const stageCount = (si: number): [number, number] => {
  const ls = LESSONS.filter(l => l.stage === si);
  return [ls.filter(l => isDone(l.id)).length, ls.length];
};
export const dueCount = () => dueRefs().length;

/** 变式练习的完成数：只用目录和进度（只读，不给没记录的课建记录）。stage 缺省是全部课；返回 [已完成, 总数] */
export const drillCount = (stage?: number): [number, number] => {
  const t = drillTotals(
    drillRows(
      LESSONS.filter(l => stage === undefined || l.stage === stage),
      id => progress[id]?.dr,
    ),
  );
  return [t.done, t.total];
};
/** 一课的变式练习完成数 [已完成, 总数]；没有变式时总数为 0 */
export const lessonDrillCount = (id: string): [number, number] => {
  const l = LESSONS.find(x => x.id === id);
  if (!l?.nDrills) return [0, 0];
  const r = drillRows([l], x => progress[x]?.dr)[0];
  return [r.done, r.total];
};
