// 用法：node scripts/gen-registry.mjs [--check]
// 默认写出 course/lessons.generated.ts；--check 只检查是否最新（不是最新时退出码为 1）。
import fs from 'node:fs';
import { GENERATED, readGenerated, renderRegistry } from './lib/registry-gen.mjs';

const next = renderRegistry();
if (process.argv.includes('--check')) {
  if (readGenerated() !== next) {
    console.error('course/lessons.generated.ts 不是最新的。运行 npm run gen 更新。');
    process.exit(1);
  }
} else if (readGenerated() !== next) {
  fs.writeFileSync(GENERATED, next);
  console.log('已更新 course/lessons.generated.ts');
}
