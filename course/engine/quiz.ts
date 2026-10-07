/* 课内测验：答错不亮正确答案，可以读完解析后重答；只有第一次作答计入复习安排和"首答正确率"。 */
import type { Lesson } from '../types.ts';
import { srsRecord } from './cards.ts';
import { maybeComplete, paintFinish } from './completion.ts';
import { makeQuestion } from './question.ts';
import { lp, save } from './store.ts';
import { el } from './util.ts';

export function makeQuiz(lesson: Lesson): HTMLDivElement {
  const box = el('div', { class: 'quiz' });
  const p = lp(lesson.id);
  const state = p.quiz;
  p.tried = p.tried || {};
  p.first = p.first || {};
  const build = (item: Lesson['quiz'][number], qi: number, fresh?: boolean): HTMLElement => makeQuestion(item, 'Q' + (qi + 1), {
    chosen: fresh ? undefined : state[qi], shuffle: true, hideAnswer: true,
    onAnswer: (oi, ok) => {
      // 只有第一次作答计入复习安排和“首答正确率”
      if (!p.tried[qi]) { p.tried[qi] = true; p.first[qi] = ok; srsRecord(lesson.id + '#' + qi, ok); }
      state[qi] = oi; save(); maybeComplete(lesson); paintFinish(lesson);
    },
    onRetry: () => { delete state[qi]; save(); return build(item, qi, true); },
  });
  lesson.quiz.forEach((item, qi) => box.appendChild(build(item, qi)));
  return box;
}
