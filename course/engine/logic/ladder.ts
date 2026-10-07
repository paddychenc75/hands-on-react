/* 练习的提示阶梯和"代码是否真的改了"的判断（纯函数）。不读 Date.now()：当前时间由调用方传入。 */
import type { Exercise } from '../../types.ts';

export interface LadderLevel { name: string; need: number; wait: number }
/** 每一级要求：失败次数 + 从第一次失败起已经思考了多久（分钟） */
export const LADDER: LadderLevel[] = [
  { name: '提示', need: 1, wait: 0 },
  { name: '半成品示例', need: 2, wait: 2 },
  { name: '查看参考答案', need: 3, wait: 5 },
];

/** 从第一次失败起过了多少分钟（还没失败过是 0） */
export const minutesSinceFirstFail = (firstFail: number | undefined, now: number): number => firstFail ? (now - firstFail) / 60e3 : 0;

/** 某一级现在能不能点，以及按钮上的文字。p.ex 为真（练习已通过）时全部开放 */
export function ladderButton(level: LadderLevel, p: { ex?: boolean; fails?: number; firstFail?: number }, now: number): { open: boolean; text: string } {
  const { name, need, wait } = level;
  const f = p.fails || 0;
  const mins = minutesSinceFirstFail(p.firstFail, now);
  const open = !!(p.ex || (f >= need && mins >= wait));
  const text = open ? name
    : f < need ? `🔒 ${name}（再改代码检查 ${need - f} 次解锁）`
    : `🔒 ${name}（再想 ${Math.max(1, Math.ceil(wait - mins))} 分钟解锁）`;
  return { open, text };
}

/** 去掉注释、空白、分号、逗号：只改这些的修改不算"改过代码" */
export const normCode = (s: unknown): string => String(s).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/[\s;,]+/g, '');

/** 只有真的改过代码的失败才计入解锁次数，连点"检查"不会解锁答案 */
export const isAttempt = (code: string, starter: string, lastFail: string | undefined): boolean => normCode(code) !== normCode(starter) && normCode(code) !== lastFail;

/** 看过答案、没重置，就直接提交答案原文：不算通过 */
export const isPastedSolution = (code: string, solution: string, p: { sawSol?: boolean; rewrite?: boolean }): boolean => !!(p.sawSol && !p.rewrite && normCode(code) === normCode(solution));

/** 半成品示例（渐隐示例）：保留参考答案中一半的新代码，其余换成待补全的标记 */
export function fadedExample(ex: Pick<Exercise, 'faded' | 'starter' | 'solution'>): string {
  if (ex.faded) return ex.faded;  // 人工挑选要补全的关键行
  const starter = new Set(ex.starter.split('\n').map(s => s.trim()));
  let k = 0;
  return ex.solution.split('\n').map(line => {
    const t = line.trim();
    if (!t || starter.has(t) || /^[})\];,]+$/.test(t) || /^\/\//.test(t)) return line;
    return (k++ % 2 === 0) ? line.match(/^\s*/)[0] + '/* ✏️ 补全这一行 */' : line;
  }).join('\n');
}
