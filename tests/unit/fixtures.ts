import type { Card } from '../../course/engine/logic/srs.ts';
import type { LessonMeta, QuizItem, SrsCard } from '../../course/types.ts';

export const MIN = 60e3;
export const HOUR = 36e5;
export const DAY = 864e5;
/** 测试里固定的"现在" */
export const NOW = 1_700_000_000_000;

export const item = (q = 'q'): QuizItem => ({ q, options: ['a', 'b'], answer: 0, explain: 'e' });
export const lesson = (id: string): LessonMeta => ({
  id,
  stage: 0,
  title: id,
  mins: 1,
  summary: '',
  goals: [],
  quizAnswers: [],
  nCheck: 0,
  hasExercise: false,
  nDrills: 0,
  nPlays: 0,
});
export const card = (l: LessonMeta, qi: number, prefix = ''): Card => ({ key: `${l.id}#${prefix}${qi}`, l, qi, item: item(`${l.id}-${qi}`) });
export const srsCard = (over: Partial<SrsCard> = {}): SrsCard => ({ box: 1, n: 1, due: NOW + DAY, last: NOW - DAY, ...over });
/** 固定的随机数序列，循环使用 */
export const seq = (...v: number[]) => {
  let i = 0;
  return () => v[i++ % v.length];
};
