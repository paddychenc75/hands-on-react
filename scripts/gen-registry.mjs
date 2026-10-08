// 用法：node scripts/gen-registry.mjs [--check]
// 默认写出 course/lessons.generated.ts、lessons.catalog.generated.ts、lessons.loaders.generated.ts；--check 只检查是否最新（不是最新时退出码为 1）。
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, renderAll, readFile } from './lib/registry-gen.mjs';

const all = await renderAll();
const stale = Object.entries(all).filter(([f, c]) => readFile(f) !== c);
if (process.argv.includes('--check')) {
  if (stale.length) {
    console.error(`${stale.map(([f]) => path.relative(ROOT, f)).join('、')} 不是最新的。运行 npm run gen 更新。`);
    process.exit(1);
  }
} else {
  for (const [f, c] of stale) {
    fs.writeFileSync(f, c);
    console.log('已更新 ' + path.relative(ROOT, f));
  }
}
