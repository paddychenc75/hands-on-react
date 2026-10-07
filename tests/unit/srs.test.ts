import { describe, expect, it } from 'vitest';
import { DAY, SRS_DAYS, WARMUP_COOLDOWN, dueKeys, isDue, nextCard, nextDueAfter, pickWarmup, shouldRecordWarmup, warmupPool } from '../../course/engine/logic/srs.ts';
import type { SrsCard } from '../../course/types.ts';
import { HOUR, NOW, card, lesson, seq, srsCard } from './fixtures.ts';

describe('间隔序列', () => {
  it('SRS_DAYS 是 0/1/3/7/16/35 天，一天是 24 小时', () => {
    expect(SRS_DAYS).toEqual([0, 1, 3, 7, 16, 35]);
    expect(DAY).toBe(24 * HOUR);
  });

  it('新卡片连续答对：间隔依次是 1、3、7、16、35 天，盒子到顶后不再增加', () => {
    let c: SrsCard | undefined;
    const days: number[] = [];
    for (let i = 0; i < 7; i++) {
      c = nextCard(c, true, NOW);
      days.push((c.due - NOW) / DAY);
    }
    expect(days).toEqual([1, 3, 7, 16, 35, 35, 35]);
    expect(c.box).toBe(5);
    expect(c.n).toBe(7);
  });

  it('答错：回到盒子 0，明天再出（不管之前在哪个盒子）', () => {
    const c = nextCard(srsCard({ box: 4, n: 4 }), false, NOW);
    expect(c.box).toBe(0);
    expect(c.due).toBe(NOW + DAY);
    expect(c.n).toBe(5);
    expect(c.last).toBe(NOW);
  });

  it('新卡片第一次就答错：盒子 0，明天再出', () => {
    const c = nextCard(undefined, false, NOW);
    expect(c).toEqual({ box: 0, n: 1, due: NOW + DAY, last: NOW });
  });

  it('答错之后再答对：从盒子 1（1 天）重新开始', () => {
    const wrong = nextCard(srsCard({ box: 3 }), false, NOW);
    const right = nextCard(wrong, true, NOW + DAY);
    expect(right.box).toBe(1);
    expect(right.due).toBe(NOW + DAY + DAY);
  });

  it('不改传入的卡片对象（时间由调用方传入，函数没有副作用）', () => {
    const before = srsCard({ box: 2 });
    const copy = { ...before };
    nextCard(before, true, NOW);
    expect(before).toEqual(copy);
  });
});

describe('到期判断', () => {
  it('due 等于现在算到期，晚一毫秒不算', () => {
    expect(isDue(srsCard({ due: NOW }), NOW)).toBe(true);
    expect(isDue(srsCard({ due: NOW + 1 }), NOW)).toBe(false);
  });

  it('dueKeys：只返回到期的，最早到期的在前', () => {
    const srs = { a: srsCard({ due: NOW - 1 }), b: srsCard({ due: NOW - 5 * DAY }), c: srsCard({ due: NOW + 1 }), d: srsCard({ due: NOW }) };
    expect(dueKeys(srs, NOW)).toEqual(['b', 'a', 'd']);
  });

  it('nextDueAfter：还没到期的卡片里最近的一个；都到期了是 undefined', () => {
    const srs = { a: srsCard({ due: NOW - 1 }), b: srsCard({ due: NOW + 3 * DAY }), c: srsCard({ due: NOW + DAY }) };
    expect(nextDueAfter(srs, NOW)).toBe(NOW + DAY);
    expect(nextDueAfter({ a: srsCard({ due: NOW - 1 }) }, NOW)).toBeUndefined();
  });
});

describe('热身：只有到期的卡片才提升复习间隔', () => {
  it('答对且没到期：不更新复习安排', () => {
    expect(shouldRecordWarmup(true, srsCard({ due: NOW + DAY }), NOW)).toBe(false);
  });
  it('答对且已到期（含刚好到期）：更新', () => {
    expect(shouldRecordWarmup(true, srsCard({ due: NOW }), NOW)).toBe(true);
    expect(shouldRecordWarmup(true, srsCard({ due: NOW - DAY }), NOW)).toBe(true);
  });
  it('答错：不管到没到期都更新（照样重置）', () => {
    expect(shouldRecordWarmup(false, srsCard({ due: NOW + 30 * DAY }), NOW)).toBe(true);
  });
});

describe('热身题库：12 小时内答过的不再出，没答过的课不出', () => {
  const l = lesson('l1');
  const [c0, c1, c2, c3] = [0, 1, 2, 3].map((i) => card(l, i));
  const srs = {
    [c0.key]: srsCard({ last: NOW - 12 * HOUR + 1 }), // 差 1 毫秒满 12 小时：不出
    [c1.key]: srsCard({ last: NOW - 12 * HOUR }),     // 刚好 12 小时：可以出
    [c2.key]: srsCard({ last: NOW - 30 * HOUR }),
    // c3 没有记录：没答过
  };

  it('WARMUP_COOLDOWN 是 12 小时', () => {
    expect(WARMUP_COOLDOWN).toBe(12 * HOUR);
  });

  it('筛选结果', () => {
    expect(warmupPool([c0, c1, c2, c3], srs, NOW)).toEqual([c1, c2]);
  });

  it('没有 last 字段（旧数据）的卡片可以出', () => {
    const s = { [c0.key]: { box: 1, n: 1, due: NOW } as never };
    expect(warmupPool([c0], s, NOW)).toEqual([c0]);
  });
});

describe('pickWarmup：选 2 题，先到期的、再上一课的', () => {
  const a = lesson('a');
  const b = lesson('b');
  const cards = [card(a, 0), card(a, 1), card(b, 0), card(b, 1)];
  const rnd = seq(0.1, 0.9, 0.5, 0.3);

  it('没有到期的题：从上一课挑 1 道，再从更早的课补 1 道', () => {
    const srs = Object.fromEntries(cards.map((c) => [c.key, srsCard({ due: NOW + DAY })]));
    const picks = pickWarmup(cards, srs, b, rnd, NOW);
    expect(picks).toHaveLength(2);
    expect(picks[0].l).toBe(b);
    expect(picks[1].l).toBe(a);
  });

  it('有到期的题：到期的排第一，其次才是上一课的', () => {
    const srs = Object.fromEntries(cards.map((c) => [c.key, srsCard({ due: NOW + DAY })]));
    srs[cards[0].key] = srsCard({ due: NOW - 1 });
    const picks = pickWarmup(cards, srs, b, rnd, NOW);
    expect(picks[0]).toBe(cards[0]);
    expect(picks[1].l).toBe(b);
  });

  it('题库不够 2 道时有几道出几道，不会重复', () => {
    const srs = { [cards[0].key]: srsCard() };
    expect(pickWarmup([cards[0]], srs, undefined, rnd, NOW)).toEqual([cards[0]]);
    expect(pickWarmup([], {}, undefined, rnd, NOW)).toEqual([]);
  });

  it('相同的随机数序列得到相同的结果', () => {
    const srs = Object.fromEntries(cards.map((c) => [c.key, srsCard({ due: NOW + DAY })]));
    expect(pickWarmup(cards, srs, b, seq(0.2, 0.7), NOW)).toEqual(pickWarmup(cards, srs, b, seq(0.2, 0.7), NOW));
  });
});
