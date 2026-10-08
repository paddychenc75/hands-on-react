/* 课的重数据（测验题、练习、变式练习、示例说明、预测题、要点）按课加载：每课一个异步 chunk。
   轻量目录在 course/registry.ts（进主包）；这里只负责"按 id 取完整的一课"，同一课只请求一次，失败后可以重试。 */
import { LESSON_LOADERS } from '../lessons.loaders.generated.ts';
import type { Lesson } from '../types.ts';

/** 课数据加载失败（离线、chunk 被拦截、部署更新后旧文件不在了）。message 可以直接显示给学习者 */
export class LessonLoadError extends Error {
  id: string;
  constructor(id: string, cause?: unknown) {
    super('这一课的内容没能加载（可能是网络问题）。');
    this.name = 'LessonLoadError';
    this.id = id;
    this.cause = cause;
  }
}

const pending = new Map<string, Promise<Lesson>>();
const loaded = new Map<string, Lesson>();

/** 已经加载好的课（同步）；没加载过返回 undefined */
export const loadedLesson = (id: string): Lesson | undefined => loaded.get(id);

/** 加载一课的完整数据。同一课并发调用共用一个请求；失败不缓存，再调用就是重试 */
export function loadLesson(id: string): Promise<Lesson> {
  const hit = loaded.get(id);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(id);
  if (!p) {
    const load = LESSON_LOADERS[id];
    p = (load ? load() : Promise.reject(new Error('没有这一课：' + id))).then(
      m => {
        loaded.set(id, m.default);
        pending.delete(id);
        return m.default;
      },
      e => {
        pending.delete(id);
        throw new LessonLoadError(id, e);
      },
    );
    pending.set(id, p);
  }
  return p;
}

/** 并行加载几课（复习、阶段测验按需取题用）。去重；任何一课失败就整体失败 */
export const loadLessons = (ids: string[]): Promise<Lesson[]> => Promise.all([...new Set(ids)].map(loadLesson));
