/* 间隔复习卡片：读写进度里的 __srs，并把卡片键 `课id#N` / `课id#cN` 对应回题目。纯逻辑在 logic/srs.ts。 */
import { LESSONS, lessonNo } from '../registry.ts';
import { lessonHref } from '../site.ts';
import type { SrsCard } from '../types.ts';
import { esc } from './logic/text.ts';
import { type Card, dueKeys, nextCard } from './logic/srs.ts';
import { progress, save } from './store.ts';

export const srsAll = (): Record<string, SrsCard> => (progress.__srs = progress.__srs || {});
export function srsRecord(key: string, ok: boolean): void {
  const s = srsAll();
  s[key] = nextCard(s[key], ok, Date.now());
  save();
}
export function cardOf(key: string): Card | null {
  const [id, qi] = key.split('#');
  const l = LESSONS.find(x => x.id === id);
  if (!l) return null;
  // "c0"、"c1"…：只在阶段测验中出现的读代码题（lesson.checkOnly）
  const list = qi[0] === 'c' ? l.checkOnly : l.quiz;
  const n = qi[0] === 'c' ? +qi.slice(1) : +qi;
  return list && list[n] ? { key, l, qi: n, item: list[n] } : null;
}
export const dueCards = (): Card[] => dueKeys(srsAll(), Date.now()).map(cardOf).filter(Boolean);
export const learnedCards = (): Card[] => Object.keys(srsAll()).map(cardOf).filter(Boolean);
export const srcLine = (c: Card): string => `<div class="src">出自第 ${lessonNo(c.l.id)} 课《${esc(c.l.title)}》 · <a href="${lessonHref(c.l.id)}">回看这一课</a></div>`;
