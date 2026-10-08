import { describe, expect, it } from 'vitest';
import { DRILL_LADDER, drillLadderButton, drillStat } from '../../course/engine/logic/drills.ts';
import { LADDER } from '../../course/engine/logic/ladder.ts';
import { isAttempt, isPastedSolution } from '../../course/engine/logic/ladder.ts';

const [hint, solution] = DRILL_LADDER;

describe('变式练习的简化提示规则', () => {
  it('两级：提示(失败 1 次)、参考答案(失败 2 次)，没有时间门槛', () => {
    expect(DRILL_LADDER).toEqual([
      { name: '提示', need: 1 },
      { name: '参考答案', need: 2 },
    ]);
  });
  it('失败 1 次给提示，失败 2 次可看参考答案', () => {
    expect(drillLadderButton(hint, {}).open).toBe(false);
    expect(drillLadderButton(hint, { fails: 1 }).open).toBe(true);
    expect(drillLadderButton(solution, { fails: 1 }).open).toBe(false);
    expect(drillLadderButton(solution, { fails: 2 }).open).toBe(true);
  });
  it('通过之后两级都开放', () => {
    expect(drillLadderButton(solution, { ok: true }).open).toBe(true);
  });
  it('按钮文字写还要改代码检查几次', () => {
    expect(drillLadderButton(solution, { fails: 1 }).text).toBe('🔒 参考答案（再改代码检查 1 次解锁）');
    expect(drillLadderButton(hint, { fails: 1 }).text).toBe('提示');
  });
  it('“代码是否真的改了”沿用正式练习的判断', () => {
    expect(isAttempt('a', 'b', undefined)).toBe(true);
    expect(isAttempt(' b; ', 'b', undefined)).toBe(false);
    expect(isAttempt('a', 'b', 'a')).toBe(false);
    expect(isPastedSolution('s', 's', { sawSol: true })).toBe(true);
  });
  it('正式练习的阶梯一行没变', () => {
    expect(LADDER.map(l => [l.need, l.wait])).toEqual([
      [1, 0],
      [2, 2],
      [3, 5],
    ]);
  });
});

describe('drillStat：变式练习进度，旧数据没有这个字段也正常', () => {
  it('没有 dr 字段', () => {
    expect(drillStat(undefined, 3)).toEqual({ done: 0, total: 3 });
  });
  it('只数通过的', () => {
    expect(drillStat({ 0: { ok: true }, 1: { ok: false, fails: 3 }, 2: { ok: true } }, 3)).toEqual({ done: 2, total: 3 });
  });
  it('下标超出总数的旧记录不计入（练习被删减后）', () => {
    expect(drillStat({ 0: { ok: true }, 5: { ok: true } }, 2)).toEqual({ done: 1, total: 2 });
  });
});
