// 跑 tests/variants/ 里记录的全部练习/变式练习的变体（参考答案通过、起始代码被拒、常见错误被拒、不同写法通过）。
// 文件名 <课id>.<ex|drill-N>.mjs，格式见 tests/e2e/try.mjs。较慢（每份代码开一个浏览器页面），不在默认的 npm run test:e2e 里。
//   npm run test:variants                 全部
//   npm run test:variants -- state        只跑某一课
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, '../variants');
const only = process.argv.slice(2);
let bad = 0;
for (const f of fs
  .readdirSync(dir)
  .filter(f => f.endsWith('.mjs'))
  .sort()) {
  const [lesson, which] = f.replace(/\.mjs$/, '').split('.');
  if (only.length && !only.includes(lesson)) continue;
  const w = which.startsWith('drill-') ? 'drill:' + (Number(which.slice(6)) - 1) : 'ex';
  const r = spawnSync(process.execPath, [path.join(here, 'try.mjs'), lesson, w, path.join(dir, f)], { stdio: 'inherit' });
  if (r.status !== 0) bad++;
}
console.log(bad ? `\n${bad} 个文件有变体不符合预期` : '\n全部变体符合预期');
process.exit(bad ? 1 : 0);
