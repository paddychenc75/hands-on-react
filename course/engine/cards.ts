/* 间隔复习卡片：读写进度里的 __srs，并把卡片键 `课id#N` / `课id#cN` 对应回题目。纯逻辑在 logic/srs.ts。
   键到"这张卡存在吗、属于哪一课"只靠轻量目录（同步，不加载题目）；要显示题目时才用 resolveCards 按课加载。 */
import { lessonById, lessonNo } from '../registry.ts';
import { lessonHref } from '../site.ts';
import type { SrsCard } from '../types.ts';
import { loadLessons } from './lessonData.ts';
import { esc } from './logic/text.ts';
import { type Card, type CardRef, dueKeys, gatedNextCard, nextCard } from './logic/srs.ts';
import { progress, save } from './store.ts';

export const srsAll = (): Record<string, SrsCard> => (progress.__srs = progress.__srs || {});
export function srsRecord(key: string, ok: boolean): void {
  const s = srsAll();
  s[key] = nextCard(s[key], ok, Date.now());
  save();
}
/** 带门槛的记录：答对没到期的卡片不改复习间隔（热身、混合练习、阶段测验用）；答错照样重置 */
export function srsRecordGated(key: string, ok: boolean): void {
  const s = srsAll();
  const next = gatedNextCard(s[key], ok, Date.now());
  if (next === s[key]) return;
  s[key] = next;
  save();
}
/** 卡片键对应的引用（同步）：这一课存在、题号在范围内才算。不加载题目 */
export function cardRefOf(key: string): CardRef | null {
  const [id, qi] = key.split('#');
  const l = lessonById(id);
  if (!l || !qi) return null;
  // "c0"、"c1"…：只在阶段测验中出现的读代码题（lesson.checkOnly）
  const isCheck = qi[0] === 'c';
  const n = isCheck ? +qi.slice(1) : +qi;
  const count = isCheck ? l.nCheck : l.quizAnswers.length;
  return Number.isInteger(n) && n >= 0 && n < count ? { key, l, qi: n } : null;
}
const isRef = (c: CardRef | null): c is CardRef => !!c;
/** 一课的随堂测验 / 读代码题的卡片引用 */
export const quizRefs = (l: CardRef['l']): CardRef[] => l.quizAnswers.map((_a, qi) => ({ key: l.id + '#' + qi, l, qi }));
export const checkRefs = (l: CardRef['l']): CardRef[] => Array.from({ length: l.nCheck }, (_x, qi) => ({ key: l.id + '#c' + qi, l, qi }));
/** 到期的卡片（最早到期的在前）。只用目录和进度，同步 */
export const dueRefs = (): CardRef[] => dueKeys(srsAll(), Date.now()).map(cardRefOf).filter(isRef);
export const learnedRefs = (): CardRef[] => Object.keys(srsAll()).map(cardRefOf).filter(isRef);

/** 取到引用对应的题目：只加载这些卡片所属的课（去重、并行）。失败时抛 LessonLoadError，调用方给出重试 */
export async function resolveCards(refs: CardRef[]): Promise<Card[]> {
  const lessons = await loadLessons(refs.map(r => r.l.id));
  const byId = new Map(lessons.map(l => [l.id, l]));
  return refs.map(r => {
    const l = byId.get(r.l.id);
    return { ...r, item: (r.key.split('#')[1][0] === 'c' ? l.checkOnly : l.quiz)[r.qi] };
  });
}
export const srcLine = (c: CardRef): string =>
  `<div class="src">出自第 ${lessonNo(c.l.id)} 课《${esc(c.l.title)}》 · <a href="${lessonHref(c.l.id)}">回看这一课</a></div>`;
