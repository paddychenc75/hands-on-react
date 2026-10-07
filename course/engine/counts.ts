/* 侧栏与顶栏要显示的数字。 */
import { LESSONS } from '../registry.ts';
import { dueCards } from './cards.ts';
import { isDone } from './store.ts';

export const doneCount = () => LESSONS.filter(l => isDone(l.id)).length;
export const stageCount = (si: number): [number, number] => {
  const ls = LESSONS.filter(l => l.stage === si);
  return [ls.filter(l => isDone(l.id)).length, ls.length];
};
export const dueCount = () => dueCards().length;
