/* 课前热身：从前面学过的课里挑 2 道题做提取练习，优先挑到期该复习的。 */
import { LESSONS } from '../registry.ts';
import type { Lesson } from '../types.ts';
import { srcLine, srsAll, srsRecord } from './cards.ts';
import { type Card, pickWarmup, shouldRecordWarmup, warmupPool } from './logic/srs.ts';
import { seeded } from './logic/random.ts';
import { makeQuestion } from './question.ts';
import { el } from './util.ts';

export function makeWarmup(lesson: Lesson): HTMLElement | null {
  const idx = LESSONS.indexOf(lesson);
  const all: Card[] = [];
  LESSONS.slice(0, idx).forEach(l => (l.quiz || []).forEach((item, qi) => all.push({ key: l.id + '#' + qi, l, qi, item })));
  const srs = srsAll();
  // 只考已经学过（答过题）的内容，没学过的课不拿来热身
  // 刚答过（12 小时内）的题不拿来热身，否则只是在考短期记忆
  const pool = warmupPool(all, srs, Date.now());
  if (!pool.length) return null;
  const rnd = seeded(lesson.id + new Date().toDateString());
  const picks = pickWarmup(pool, srs, LESSONS[idx - 1], rnd, Date.now());
  const box = el('section', { class: 'warmup wide' });
  box.innerHTML = '<div class="wu-head"><b>课前热身</b><span>先别往下读。凭记忆回答这两道前面学过的题，回忆的过程本身就在加固记忆。</span></div>';
  // 只有到期的题答对才拉长复习间隔；没到期的题答错照样重置
  picks.forEach((c, i) => box.appendChild(makeQuestion(c.item, '回忆 ' + (i + 1), { shuffle: true, onAnswer: (oi, ok) => { if (shouldRecordWarmup(ok, srs[c.key], Date.now())) srsRecord(c.key, ok); }, footer: srcLine(c) })));
  return box;
}
