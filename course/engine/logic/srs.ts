/* 间隔复习（Leitner 盒子）的纯逻辑。不碰 DOM、localStorage，也不读 Date.now()：当前时间由调用方传入（now）。
   存储和取题在 course/engine/cards.ts。 */
import type { Lesson, QuizItem, SrsCard } from '../../types.ts';

export const DAY = 864e5;
/** 盒子 0..5 对应的复习间隔（天） */
export const SRS_DAYS = [0, 1, 3, 7, 16, 35];
/** 刚答过（12 小时内）的题不拿来热身，否则只是在考短期记忆 */
export const WARMUP_COOLDOWN = 12 * 36e5;

/** 一张可出的题：键是 `课id#N`（随堂测验）或 `课id#cN`（阶段测验读代码题） */
export interface Card {
  key: string;
  l: Lesson;
  qi: number;
  item: QuizItem;
}

/** 答完一题后的新卡片：答对进下一个盒子（到顶不再升），答错回到盒子 0 并安排明天再出 */
export function nextCard(card: SrsCard | undefined, ok: boolean, now: number): SrsCard {
  const c = { ...(card || { box: 0, n: 0 }) } as SrsCard;
  c.box = ok ? Math.min(c.box + 1, SRS_DAYS.length - 1) : 0;
  c.due = now + (ok ? SRS_DAYS[c.box] : 1) * DAY;
  c.n++;
  c.last = now;
  return c;
}

export const isDue = (card: SrsCard, now: number): boolean => card.due <= now;

/** 到期的卡片键，最早到期的在前 */
export const dueKeys = (srs: Record<string, SrsCard>, now: number): string[] =>
  Object.entries(srs)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([k]) => k);

/** 最近的下一次到期时间（没有则 undefined） */
export const nextDueAfter = (srs: Record<string, SrsCard>, now: number): number | undefined =>
  Object.values(srs)
    .map(c => c.due)
    .filter(d => d > now)
    .sort((a, b) => a - b)[0];

/** 热身答题是否要更新复习安排：答错照样重置；答对只有"到期的题"才拉长间隔 */
export const shouldRecordWarmup = (ok: boolean, card: SrsCard, now: number): boolean => !ok || card.due <= now;

/** 热身题库：只考已经学过（答过题）的内容，并去掉刚答过的 */
export function warmupPool(pool: Card[], srs: Record<string, SrsCard>, now: number): Card[] {
  return pool.filter(c => {
    const s = srs[c.key];
    return !(!s || (s.last && now - s.last < WARMUP_COOLDOWN));
  });
}

/** 热身选 2 题：先到期的 1 道、上一课的 1 道，不够再从到期、更早的课、上一课里补 */
export function pickWarmup(pool: Card[], srs: Record<string, SrsCard>, prevLesson: Lesson | undefined, rnd: () => number, now: number): Card[] {
  const mix = (arr: Card[]) =>
    arr
      .map((c): [number, Card] => [rnd(), c])
      .sort((a, b) => a[0] - b[0])
      .map(x => x[1]);
  const due = mix(pool.filter(c => srs[c.key] && srs[c.key].due <= now));
  const prev = mix(pool.filter(c => c.l === prevLesson));
  const older = mix(pool.filter(c => c.l !== prevLesson));
  const picks: Card[] = [];
  [...due.slice(0, 1), ...prev.slice(0, 1), ...due.slice(1), ...older, ...prev].forEach(c => {
    if (picks.length < 2 && !picks.includes(c)) picks.push(c);
  });
  return picks;
}
