// 浏览器测试入口：npm run test:e2e [-- <套件> [课id ...]] ...
//   npm run test:e2e                                 三个套件都跑（逐课、学习机制、冒烟），约 2~3 分钟
//   npm run test:e2e -- lessons                      只跑逐课测试（45 课）
//   npm run test:e2e -- lessons state use-effect     逐课测试只测这两课（课 id 跟在 lessons 后面）
//   npm run test:e2e -- mechanics smoke              只跑学习机制和冒烟
// 前提：已经 npm run build（测试读 doc_build）；需要联网（实验台从 jsdelivr 加载 React 18、Babel、Prism）。
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SUITES = ['lessons', 'mechanics', 'smoke'];

const args = process.argv.slice(2);
const runs = [];
for (const a of args) {
  if (SUITES.includes(a)) runs.push({ suite: a, ids: [] });
  else if (runs.length && runs[runs.length - 1].suite === 'lessons') runs[runs.length - 1].ids.push(a);
  else {
    console.error(`不认识的参数：${a}\n套件：${SUITES.join('、')}；课 id 只能跟在 lessons 后面。\n例：npm run test:e2e -- lessons state use-effect`);
    process.exit(2);
  }
}
if (!runs.length) SUITES.forEach((suite) => runs.push({ suite, ids: [] }));

let failed = 0;
for (const { suite, ids } of runs) {
  console.log(`\n=== ${suite}${ids.length ? ' ' + ids.join(' ') : ''} ===`);
  const r = spawnSync(process.execPath, [path.join(here, suite + '.mjs'), ...ids], { stdio: 'inherit' });
  if (r.status !== 0) { failed++; console.error(`\n${suite} 失败（退出码 ${r.status}）`); }
}
process.exit(failed ? 1 : 0);
