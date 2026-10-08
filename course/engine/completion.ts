/* 一课的完成判定和"掌握标准"提示条。随堂测验和练习通过后都会调用 maybeComplete。 */
import { lessonById } from '../registry.ts';
import { drillStat } from './logic/drills.ts';
import { emitProgress, lp, progress, save } from './store.ts';
import { $, el, toast } from './util.ts';

/* 只用轻量目录（题数、正确答案下标、有没有练习、变式练习数），不需要加载题目：课末的"掌握标准"条在课数据到达之前就能画出来。 */
export function quizPassed(id: string): boolean {
  const s = (progress[id] || {}).quiz || {};
  return lessonById(id).quizAnswers.every((answer, i) => s[i] === answer);
}
export function maybeComplete(id: string): void {
  const p = lp(id);
  if (p.done) return;
  if (quizPassed(id) && (!lessonById(id).hasExercise || p.ex)) {
    p.done = true;
    save();
    toast('本课完成！🎉');
    emitProgress();
    paintFinish(id);
  }
}
export function paintFinish(id: string): void {
  const lesson = lessonById(id);
  const f = $('#finish');
  if (!f) return;
  const p = lp(id);
  const needs = [];
  if (lesson.quizAnswers.length && !quizPassed(id)) needs.push('答对全部测验题');
  if (lesson.hasExercise && !p.ex) needs.push('通过动手练习');
  f.className = 'finish' + (p.done ? ' is-done' : '');
  const nq = lesson.quizAnswers.length;
  const firstOk = Object.values(p.first || {}).filter(Boolean).length;
  const tried = Object.keys(p.tried || {}).length;
  const acc = nq && tried === nq ? `测验首次作答答对 ${firstOk}/${nq}。${firstOk < nq ? '首次答错的题明天会回来复习，再答对才算真的记住。' : ''}` : '';
  // 变式练习只显示进度，不参与完成判定
  const dr = lesson.nDrills ? drillStat(p.dr, lesson.nDrills) : null;
  const drNote = dr ? `变式练习 ${dr.done}/${dr.total}（选做，不影响完成）。` : '';
  const help = lesson.hasExercise && p.exHelp ? '练习是借助参考答案完成的，过几天不看答案再写一遍。' : '';
  f.innerHTML = p.done
    ? `<div class="fx"><b>✓ 本课已完成</b><span>${acc}${help}${drNote}本课的题目已进入复习队列，下一课开头的热身题也会考到它。真正的掌握以阶段测验为准。</span></div>`
    : `<div class="fx"><b>掌握标准</b><span>${needs.length ? '还需要：' + needs.join('、') + '。达到后会自动标记完成。' : ''}${drNote}如果你在别处已经学会了，也可以跳过。</span></div>`;
  const btn = el('button', { class: 'btn small', type: 'button' }, p.done ? '标记为未完成' : '我已掌握，跳过');
  btn.addEventListener('click', () => {
    p.done = !p.done;
    save();
    emitProgress();
    paintFinish(id);
    if (p.done) toast('本课完成！🎉');
  });
  f.appendChild(btn);
}
