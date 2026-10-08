// 课程注册表（轻量目录）：全部课程的标题、摘要、目标、时长和各种计数，按课程顺序（course/order.ts）排列。课号 = 在 LESSON_ORDER 里的位置（从 1 开始）。
// 目录由 course/lessons.catalog.generated.ts 提供（npm run gen 从课数据算出），进主包；侧栏、首页、翻页、卡片键校验都只用它。
// 题目、练习、示例说明等重数据不在这里：每课一个异步 chunk，用 course/engine/lessonData.ts 的 loadLesson(id) 按需加载。
import { CATALOG } from './lessons.catalog.generated.ts';
import { LESSON_ORDER } from './order.ts';
import type { LessonMeta } from './types.ts';

export { LESSON_ORDER };

export const LESSONS: LessonMeta[] = LESSON_ORDER.map(id => {
  const meta = CATALOG[id];
  if (!meta) throw new Error(`course/order.ts 里有课 "${id}"，但课程目录里没有它（新文件要先运行 npm run gen）`);
  return meta;
});
export const lessonNo = (id: string): number => LESSON_ORDER.indexOf(id) + 1;
export const TOTAL_LESSONS = LESSONS.length;
export const lessonById = (id: string): LessonMeta | undefined => CATALOG[id];
