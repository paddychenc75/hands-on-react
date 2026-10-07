// 由 scripts/convert.mjs 从旧版 src/*.js 生成。
// 汇总全部已转换的课。引擎的热身、复习、阶段测验要跨课取题，都从这里拿。
import { LESSON_ORDER } from './order.js';
import l_what_is_react from './lessons/what-is-react.js';
import l_state from './lessons/state.js';
import l_lists_keys from './lessons/lists-keys.js';

const ALL = [l_what_is_react, l_state, l_lists_keys];
// 按课程顺序排列。课号 = 在 LESSON_ORDER 里的位置（不是在 LESSONS 里的位置：未转换的课不在这里）
export const LESSONS = ALL.sort((a, b) => LESSON_ORDER.indexOf(a.id) - LESSON_ORDER.indexOf(b.id));
export const lessonNo = (id) => LESSON_ORDER.indexOf(id) + 1;
export const TOTAL_LESSONS = LESSON_ORDER.length;
export const lessonById = (id) => LESSONS.find((l) => l.id === id);
