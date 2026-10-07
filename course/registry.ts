// 课程注册表：全部课程，按课程顺序（course/order.ts）排列。课号 = 在 LESSON_ORDER 里的位置（从 1 开始）。
// 课的数据由 course/lessons.generated.ts 自动收集（npm run gen）。
// 引擎的热身、复习、阶段测验要跨课取题，侧栏和首页的课程地图也从这里生成。
import { LESSON_MODULES } from './lessons.generated.ts';
import { LESSON_ORDER } from './order.ts';
import type { Lesson } from './types.ts';

export { LESSON_ORDER };

export const LESSONS: Lesson[] = LESSON_ORDER.map((id) => {
  const lesson = LESSON_MODULES[id];
  if (!lesson) throw new Error(`course/order.ts 里有课 "${id}"，但找不到 course/lessons/${id}.ts（新文件要先运行 npm run gen）`);
  return lesson;
});
export const lessonNo = (id: string): number => LESSON_ORDER.indexOf(id) + 1;
export const TOTAL_LESSONS = LESSONS.length;
export const lessonById = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);
