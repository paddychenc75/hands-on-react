/* 变式练习的提示规则和进度统计（纯函数）。
   变式练习是正式练习之外的小任务：不影响“本课完成”，提示规则比正式练习简单——失败 1 次给提示，失败 2 次可看参考答案，没有时间门槛。
   “代码是否真的改了”沿用 ladder.ts 的 isAttempt / isPastedSolution。 */
import type { DrillProgress } from '../../types.ts';

export interface DrillLevel {
  name: string;
  need: number;
}
export const DRILL_LADDER: DrillLevel[] = [
  { name: '提示', need: 1 },
  { name: '参考答案', need: 2 },
];

/** 某一级现在能不能点，以及按钮上的文字。通过之后全部开放 */
export function drillLadderButton(level: DrillLevel, rec: Partial<Pick<DrillProgress, 'ok' | 'fails'>>): { open: boolean; text: string } {
  const f = rec.fails || 0;
  const open = !!(rec.ok || f >= level.need);
  return { open, text: open ? level.name : `🔒 ${level.name}（再改代码检查 ${level.need - f} 次解锁）` };
}

/** 一课的变式练习完成了几道。dr 是 LessonProgress.dr，旧数据里没有它；下标超出 total 的记录不计入 */
export function drillStat(dr: Record<number, DrillProgress> | undefined, total: number): { done: number; total: number } {
  let done = 0;
  for (let i = 0; i < total; i++) if (dr && dr[i] && dr[i].ok) done++;
  return { done, total };
}

/** 总览页的一行：一课的变式练习，每道是否完成 */
export interface DrillRow {
  id: string;
  done: number;
  total: number;
  oks: boolean[];
}

/** 只靠目录（id、nDrills）和进度算总览；没有变式的课不出现。drOf 取一课的 LessonProgress.dr */
export function drillRows(metas: { id: string; nDrills: number }[], drOf: (id: string) => Record<number, DrillProgress> | undefined): DrillRow[] {
  return metas
    .filter(m => m.nDrills > 0)
    .map(m => {
      const dr = drOf(m.id);
      const oks = Array.from({ length: m.nDrills }, (_, i) => !!(dr && dr[i] && dr[i].ok));
      return { id: m.id, done: oks.filter(Boolean).length, total: m.nDrills, oks };
    });
}

export const drillTotals = (rows: DrillRow[]): { done: number; total: number } => ({
  done: rows.reduce((s, r) => s + r.done, 0),
  total: rows.reduce((s, r) => s + r.total, 0),
});
