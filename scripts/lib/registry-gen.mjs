// 生成三个文件（都在 course/，都不要手改）：
//   lessons.generated.ts          Node 端用：静态 import 全部 course/lessons/*.ts（单元测试、脚本）。浏览器代码不能 import 它：会把全部课程数据打进主包。
//   lessons.catalog.generated.ts  轻量课程目录（进主包）：每课的标题、摘要、目标、时长和各种计数，由课数据算出。
//   lessons.loaders.generated.ts  课 id → 动态 import：每课一个异步 chunk，打开一课时只加载这一课。
// 为什么用生成文件：rspress dev/build（Rspack）、Vitest（Vite）、node 脚本和 tsc 都要读同一份课程表，
// 没有一种"目录自动收集"的写法在四处都能用；生成的静态 import 在四处都一样。
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const ROOT = path.resolve(import.meta.dirname, '../..');
export const LESSON_DIR = path.join(ROOT, 'course/lessons');
export const GENERATED = path.join(ROOT, 'course/lessons.generated.ts');
export const CATALOG = path.join(ROOT, 'course/lessons.catalog.generated.ts');
export const LOADERS = path.join(ROOT, 'course/lessons.loaders.generated.ts');

export const lessonFiles = () =>
  fs
    .readdirSync(LESSON_DIR)
    .filter(f => f.endsWith('.ts'))
    .sort();

const ident = id => 'l_' + id.replace(/[^A-Za-z0-9]/g, '_');
const HEAD = '// 由 scripts/gen-registry.mjs 生成，不要手改。运行 npm run gen 更新（dev、build 会自动运行；check:content 会检查它是否最新）。\n';

/** 从完整的课数据算出轻量目录里的一项（字段含义见 course/types.ts 的 LessonMeta） */
export function metaOf(l) {
  const m = {
    id: l.id,
    stage: l.stage,
    title: l.title,
    mins: l.mins,
    ...(l.localMins ? { localMins: l.localMins } : {}),
    summary: l.summary,
    goals: l.goals,
    quizAnswers: (l.quiz || []).map(q => q.answer),
    nCheck: (l.checkOnly || []).length,
    hasExercise: !!l.exercise,
    nDrills: (l.drills || []).length,
    drillTitles: (l.drills || []).map(d => d.title),
    ...(l.drillMins ? { drillMins: l.drillMins } : {}),
    nPlays: Object.keys(l.plays || {}).length,
  };
  return m;
}

/** 返回 { 文件路径: 内容 }。需要读课数据（算目录），所以是异步的 */
export async function renderAll() {
  const ids = lessonFiles().map(f => f.replace(/\.ts$/, ''));
  const metas = {};
  for (const id of ids) metas[id] = metaOf((await import(pathToFileURL(path.join(LESSON_DIR, id + '.ts')).href)).default);
  return {
    [GENERATED]: `${HEAD}// Node 端收集 course/lessons 里的所有课；课程顺序在 course/order.ts。浏览器代码不要 import 这个文件（见 course/lessons.loaders.generated.ts）。
import type { Lesson } from './types.ts';
${ids.map(id => `import ${ident(id)} from './lessons/${id}.ts';`).join('\n')}

export const LESSON_MODULES: Record<string, Lesson> = {
${ids.map(id => `  '${id}': ${ident(id)},`).join('\n')}
};
`,
    [CATALOG]: `${HEAD}// 轻量课程目录（进主包）：按 id 排序，课程顺序以 course/order.ts 为准。
import type { LessonMeta } from './types.ts';

export const CATALOG: Record<string, LessonMeta> = {
${ids.map(id => `  ${JSON.stringify(id)}: ${JSON.stringify(metas[id])},`).join('\n')}
};
`,
    [LOADERS]: `${HEAD}// 课 id → 动态 import：每课一个异步 chunk（chunk 名 lesson-<id>）。
import type { Lesson } from './types.ts';

export const LESSON_LOADERS: Record<string, () => Promise<{ default: Lesson }>> = {
${ids.map(id => `  '${id}': () => import(/* webpackChunkName: "lesson-${id}" */ './lessons/${id}.ts'),`).join('\n')}
};
`,
  };
}

export const readFile = f => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
/** 不是最新的生成文件（路径数组） */
export async function staleFiles() {
  const all = await renderAll();
  return Object.entries(all)
    .filter(([f, c]) => readFile(f) !== c)
    .map(([f]) => f);
}
