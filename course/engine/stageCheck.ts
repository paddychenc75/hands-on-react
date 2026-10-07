/* 阶段测验：12 题（8 新 + 4 常规），交卷后才显示解析，80% 通过；中途离开算未通过；未通过要等 30 分钟；35 天后提示复测。
   抽题、及格、冷却的计算在 logic/stageCheck.ts。 */
import { LESSONS } from '../registry.ts';
import { checkHref, lessonHref, reviewHref } from '../site.ts';
import { STAGES } from '../stages.ts';
import type { Lesson, StageRecord } from '../types.ts';
import { cardOf, srcLine, srsAll, srsRecordGated } from './cards.ts';
import { DAY, type Card } from './logic/srs.ts';
import { cooldownLeft, isPass, needsRetest, percent, pickStageQuestions, settlePending, settleResult } from './logic/stageCheck.ts';
import { esc } from './logic/text.ts';
import { makeQuestion, type QuestionElement } from './question.ts';
import { emitProgress, progress, save } from './store.ts';
import { el } from './util.ts';

export function makeCheck(si: number): HTMLDivElement {
  const s = STAGES[si];
  const ls = LESSONS.filter(l => l.stage === si);
  const area = el('div', { class: 'quiz' });
  const run = () => {
    area.innerHTML = '';
    progress.__stage = progress.__stage || {};
    const st0 = progress.__stage;
    st0[si] = st0[si] || {};
    let rec0: StageRecord = st0[si];
    let notice = '';
    if (rec0.pending) {
      // 上次答到一半就离开：按已答的题计分，未答的算错
      const pd = rec0.pending;
      st0[si] = settlePending(rec0);
      rec0 = st0[si];
      save();
      emitProgress();
      notice = `上次测验答了 ${pd.answered}/${pd.n} 题就离开了，按“未通过”记录（没答的题算错）。`;
    }
    const wait = cooldownLeft(rec0, Date.now());
    if (wait > 0) {
      if (notice) area.appendChild(el('p', { class: 'lesson-sum' }, notice));
      // 没通过后马上重测，测的是短期记忆。先复习，隔一段时间再测
      const box = el(
        'div',
        { class: 'done-card' },
        `<b>先复习，${Math.ceil(wait / 60e3)} 分钟后可以重测</b><span>上次答对 ${rec0.last || 0}%。马上重测，测到的多半是刚看过的答案。先回看这些课，做一做<a href="${reviewHref()}">今日复习</a>，再来测。</span>${
          (rec0.weak || []).length
            ? '<div class="wrong-list">需要加强：' +
              rec0.weak
                .map(id => {
                  const l = LESSONS.find(x => x.id === id);
                  return l ? `<a href="${lessonHref(l.id)}">${esc(l.title)}</a>` : '';
                })
                .join('、') +
              '</div>'
            : ''
        }`,
      );
      area.appendChild(box);
      return;
    }
    if (needsRetest(rec0, Date.now())) {
      area.appendChild(
        el(
          'p',
          { class: 'lesson-sum' },
          `你在 ${Math.floor((Date.now() - rec0.passedAt) / DAY)} 天前通过了这个阶段。隔了这么久还能答对，才说明真的记住了。建议再测一次。`,
        ),
      );
    }
    area.appendChild(el('p', { class: 'check-rule' }, '交卷模式：每题选一次，全部答完后统一显示对错和解析。中途离开按未通过记录。'));
    // 一半是课内见过的题，一半是只在阶段测验出现的新题，检验能否迁移
    const pool: Card[] = [],
      fresh: Card[] = [];
    ls.forEach(l => (l.quiz || []).forEach((_item, qi) => pool.push(cardOf(l.id + '#' + qi))));
    ls.forEach(l => (l.checkOnly || []).forEach((_item, qi) => fresh.push(cardOf(l.id + '#c' + qi))));
    const picks = pickStageQuestions(pool, fresh, srsAll());
    let answered = 0,
      right = 0;
    const wrong = new Set<Lesson>(),
      wrongQ: number[] = [],
      qels: QuestionElement[] = [];
    picks.forEach((c, i) => {
      const qel = makeQuestion(c.item, String(i + 1), {
        shuffle: true,
        footer: srcLine(c),
        defer: true,
        onAnswer: (_oi, ok) => {
          answered++;
          if (ok) right++;
          else {
            wrong.add(c.l);
            wrongQ.push(i);
          }
          srsRecordGated(c.key, ok);
          if (answered === picks.length) {
            finish();
            return;
          }
          rec0.pending = { n: picks.length, answered, right, at: Date.now(), weak: [...wrong].map(l => l.id) };
          save();
        },
      });
      qel.id = 'cq-' + i;
      qels.push(qel);
      area.appendChild(qel);
    });
    function finish() {
      qels.forEach(q => q._reveal());
      const pct = percent(right, picks.length);
      progress.__stage = progress.__stage || {};
      const st = progress.__stage;
      const rec = settleResult(
        st[si] || {},
        pct,
        [...wrong].map(l => l.id),
        Date.now(),
      );
      st[si] = rec;
      save();
      emitProgress();
      const pass = isPass(pct);
      const box = el(
        'div',
        { class: 'done-card ' + (pass ? 'pass' : '') },
        `<b>${pass ? '✓ 已掌握 ' + s.name + '阶段' : '还差一点'}：答对 ${right}/${picks.length}（${pct}%）</b><span>${pass ? (si === STAGES.length - 1 ? `你已完成全部阶段。下一步：去<a href="${lessonHref('portfolio')}">毕业设计</a>做出自己的作品集。` : '可以放心进入下一阶段了。') : '先读懂下面每道错题的解析，再回看对应的课。30 分钟后才能重测，隔一段时间再测，比马上重测更能检验是否真的掌握。'}</span>${wrongQ.length ? '<div class="wrong-list">答错的题：' + wrongQ.map(i => `<a href="${checkHref(si)}" data-jump="cq-${i}">第 ${i + 1} 题</a>`).join('、') + '</div>' : ''}${wrong.size ? '<div class="wrong-list">需要加强：' + [...wrong].map(l => `<a href="${lessonHref(l.id)}">${esc(l.title)}</a>`).join('、') + '</div>' : ''}`,
      );
      if (pass) {
        const again = el('button', { class: 'btn', type: 'button' }, '换一组题再测');
        again.addEventListener('click', () => {
          run();
          window.scrollTo(0, 0);
        });
        box.appendChild(again);
      }
      area.appendChild(box);
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  run();
  return area;
}
