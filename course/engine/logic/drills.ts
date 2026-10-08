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
