/* 一课的完成判定和"掌握标准"提示条。随堂测验和练习通过后都会调用 maybeComplete。 */
import type { Lesson } from '../types.ts';
import { drillStat } from './logic/drills.ts';
import { emitProgress, lp, progress, save } from './store.ts';
import { $, el, toast } from './util.ts';

export function quizPassed(lesson: Lesson): boolean {
  const s = (progress[lesson.id] || {}).quiz || {};
  return (lesson.quiz || []).every((item, i) => s[i] === item.answer);
}
export function maybeComplete(lesson: Lesson): void {
  const p = lp(lesson.id);
  if (p.done) return;
  if (quizPassed(lesson) && (!lesson.exercise || p.ex)) {
    p.done = true;
    save();
    toast('本课完成！🎉');
    emitProgress();
    paintFinish(lesson);
  }
}
export function paintFinish(lesson: Lesson): void {
  const f = $('#finish');
  if (!f) return;
  const p = lp(lesson.id);
  const needs = [];
  if (lesson.quiz && !quizPassed(lesson)) needs.push('答对全部测验题');
  if (lesson.exercise && !p.ex) needs.push('通过动手练习');
  f.className = 'finish' + (p.done ? ' is-done' : '');
  const nq = (lesson.quiz || []).length;
  const firstOk = Object.values(p.first || {}).filter(Boolean).length;
  const tried = Object.keys(p.tried || {}).length;
  const acc = nq && tried === nq ? `测验首次作答答对 ${firstOk}/${nq}。${firstOk < nq ? '首次答错的题明天会回来复习，再答对才算真的记住。' : ''}` : '';
  // 变式练习只显示进度，不参与完成判定
  const dr = lesson.drills && lesson.drills.length ? drillStat(p.dr, lesson.drills.length) : null;
  const drNote = dr ? `变式练习 ${dr.done}/${dr.total}（选做，不影响完成）。` : '';
  const help = lesson.exercise && p.exHelp ? '练习是借助参考答案完成的，过几天不看答案再写一遍。' : '';
  f.innerHTML = p.done
    ? `<div class="fx"><b>✓ 本课已完成</b><span>${acc}${help}${drNote}本课的题目已进入复习队列，下一课开头的热身题也会考到它。真正的掌握以阶段测验为准。</span></div>`
    : `<div class="fx"><b>掌握标准</b><span>${needs.length ? '还需要：' + needs.join('、') + '。达到后会自动标记完成。' : ''}如果你在别处已经学会了，也可以跳过。</span></div>`;
  const btn = el('button', { class: 'btn small', type: 'button' }, p.done ? '标记为未完成' : '我已掌握，跳过');
  btn.addEventListener('click', () => {
    p.done = !p.done;
    save();
    emitProgress();
    paintFinish(lesson);
    if (p.done) toast('本课完成！🎉');
  });
  f.appendChild(btn);
}
