// 生成 course/lessons.generated.ts：自动收集 course/lessons/*.ts，不用手写 import。
// 为什么用生成文件：rspress dev/build（Rspack）、Vitest（Vite）、node 脚本和 tsc 都要读同一份课程表，
// 没有一种"目录自动收集"的写法在四处都能用；生成的静态 import 在四处都一样。
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '../..');
export const LESSON_DIR = path.join(ROOT, 'course/lessons');
export const GENERATED = path.join(ROOT, 'course/lessons.generated.ts');

export const lessonFiles = () =>
  fs.readdirSync(LESSON_DIR).filter((f) => f.endsWith('.ts')).sort();

const ident = (id) => 'l_' + id.replace(/[^A-Za-z0-9]/g, '_');

export function renderRegistry() {
  const ids = lessonFiles().map((f) => f.replace(/\.ts$/, ''));
  return `// 由 scripts/gen-registry.mjs 生成，不要手改。运行 npm run gen 更新（dev、build 会自动运行；check:content 会检查它是否最新）。
// 这里只"收集"course/lessons 里的所有课；课程顺序在 course/order.ts。
import type { Lesson } from './types.ts';
${ids.map((id) => `import ${ident(id)} from './lessons/${id}.ts';`).join('\n')}

export const LESSON_MODULES: Record<string, Lesson> = {
${ids.map((id) => `  '${id}': ${ident(id)},`).join('\n')}
};
`;
}

export const readGenerated = () => (fs.existsSync(GENERATED) ? fs.readFileSync(GENERATED, 'utf8') : '');
