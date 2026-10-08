/* 课前热身：从前面学过的课里挑 2 道题做提取练习，优先挑到期该复习的。
   选题只用目录和进度（同步）；选好之后只加载这两道题所属的课。 */
import { LESSONS } from '../registry.ts';
import type { LessonMeta } from '../types.ts';
import { quizRefs, resolveCards, srcLine, srsAll, srsRecordGated } from './cards.ts';
import { pickWarmup, warmupPool } from './logic/srs.ts';
import { seeded } from './logic/random.ts';
import { makeQuestion } from './question.ts';
import { el, errorBox, loadingBox } from './util.ts';

export function makeWarmup(lesson: LessonMeta): HTMLElement | null {
  const idx = LESSONS.findIndex(l => l.id === lesson.id);
  const all = LESSONS.slice(0, idx).flatMap(quizRefs);
  const srs = srsAll();
  // 只考已经学过（答过题）的内容，没学过的课不拿来热身
  // 刚答过（12 小时内）的题不拿来热身，否则只是在考短期记忆
  const pool = warmupPool(all, srs, Date.now());
  if (!pool.length) return null;
  const rnd = seeded(lesson.id + new Date().toDateString());
  const picks = pickWarmup(pool, srs, LESSONS[idx - 1], rnd, Date.now());
  const box = el('section', { class: 'warmup wide' });
  box.innerHTML = '<div class="wu-head"><b>课前热身</b><span>先别往下读。凭记忆回答这两道前面学过的题，回忆的过程本身就在加固记忆。</span></div>';
  const fill = () => {
    const status = loadingBox('热身题加载中…');
    box.appendChild(status);
    resolveCards(picks).then(
      cards => {
        status.remove();
        // 只有到期的题答对才拉长复习间隔；没到期的题答错照样重置
        cards.forEach((c, i) =>
          box.appendChild(
            makeQuestion(c.item, '回忆 ' + (i + 1), {
              shuffle: true,
              onAnswer: (_oi, ok) => {
                srsRecordGated(c.key, ok);
              },
              footer: srcLine(c),
            }),
          ),
        );
      },
      () => {
        status.replaceWith(
          errorBox('热身题没能加载（可能是网络问题）。', () => {
            box.lastElementChild?.remove();
            fill();
          }),
        );
      },
    );
  };
  fill();
  return box;
}
