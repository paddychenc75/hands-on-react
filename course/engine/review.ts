/* 复习页：到期的卡片，或没有到期时的混合练习。 */
import { LESSONS } from '../registry.ts';
import { HOME_HREF, lessonHref } from '../site.ts';
import { dueCards, learnedCards, srcLine, srsAll, srsRecord } from './cards.ts';
import { DAY, nextDueAfter, type Card } from './logic/srs.ts';
import { shuffled } from './logic/random.ts';
import { makeQuestion } from './question.ts';
import { emitProgress } from './store.ts';
import { el } from './util.ts';

export function makeReview(): HTMLDivElement {
  const stageArea = el('div');
  const learned = learnedCards();
  const start = (queue: Card[], label: string) => {
    let i = 0, right = 0;
    const step = () => {
      stageArea.innerHTML = '';
      if (i >= queue.length) {
        const nextDue = nextDueAfter(srsAll(), Date.now());
        stageArea.appendChild(el('div', { class: 'done-card' }, `<b>${label}完成：答对 ${right} / ${queue.length}</b><span>${nextDue ? '下一批题目将在 ' + Math.max(1, Math.round((nextDue - Date.now()) / DAY)) + ' 天后到期。' : ''}答错的题明天会再出现。</span><a class="btn primary" href="${HOME_HREF}">回到课程地图</a>`));
        emitProgress(); return;
      }
      const c = queue[i];
      stageArea.appendChild(el('div', { class: 'rv-progress' }, `<span>${label} · 第 ${i + 1} / ${queue.length} 题</span><div class="bar"><i style="width:${i / queue.length * 100}%"></i></div>`));
      const nextBtn = el('button', { class: 'btn primary', type: 'button' }, i + 1 < queue.length ? '下一题 →' : '查看结果');
      nextBtn.hidden = true;
      nextBtn.addEventListener('click', () => { i++; step(); });
      stageArea.appendChild(makeQuestion(c.item, '复习', { shuffle: true, footer: srcLine(c), onAnswer: (oi, ok) => { if (ok) right++; srsRecord(c.key, ok); nextBtn.hidden = false; nextBtn.focus(); } }));
      stageArea.appendChild(nextBtn);
    };
    step();
  };
  const due = dueCards();
  if (!learned.length) {
    stageArea.appendChild(el('div', { class: 'done-card' }, `<b>还没有需要复习的题目</b><span>完成任意一课的随堂测验后，题目会自动进入这里。</span><a class="btn primary" href="${lessonHref(LESSONS[0].id)}">开始第一课</a>`));
  } else if (due.length) {
    start(shuffled(due.length).map(i => due[i]).slice(0, 20), '今日复习');
  } else {
    const box = el('div', { class: 'done-card' }, `<b>今天该复习的都复习完了 🎉</b><span>你已学过 ${learned.length} 道题。想多练一会儿，可以做一组从所有学过的课里随机抽取的混合题，结果同样会影响复习安排。</span>`);
    const extra = el('button', { class: 'btn primary', type: 'button' }, '来 10 道混合练习');
    extra.addEventListener('click', () => start(shuffled(learned.length).slice(0, 10).map(i => learned[i]), '混合练习'));
    box.appendChild(extra);
    stageArea.appendChild(box);
  }
  return stageArea;
}
