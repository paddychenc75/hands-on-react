// 浏览器测试入口：npm run test:e2e [-- <套件> [课id ...]] ...
//   npm run test:e2e                                 三个套件都跑（逐课、学习机制、冒烟），约 2~3 分钟
//   npm run test:e2e -- lessons                      只跑逐课测试（50 课）
//   npm run test:e2e -- lessons state use-effect     逐课测试只测这两课（课 id 跟在 lessons 后面）
//   npm run test:e2e -- throttle                     4 倍 CPU 降速下，scheduler / concurrent / use-effect / suspense-data / animation 的参考答案要通过
//   npm run test:e2e -- mechanics smoke              只跑学习机制和冒烟
// 前提：已经 npm run build（测试读 doc_build）；需要联网（实验台从 jsdelivr 加载 Babel、Prism；React 19 开发版在站内）。
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SUITES = ['lessons', 'mechanics', 'smoke', 'runtime', 'libs', 'drills', 'drillhub', 'throttle', 'split', 'animation', 'hero', 'home', 'sync'];

// 课 id 和套件重名时（animation）：跟在 lessons 后面的算课 id；要跑同名套件，把它写在 lessons 前面
const LESSON_IDS = new Set(fs.readdirSync(path.join(here, '../../docs/lessons')).map(f => f.replace(/\.mdx$/, '')));

const args = process.argv.slice(2);
const runs = [];
for (const a of args) {
  const afterLessons = runs.length && runs[runs.length - 1].suite === 'lessons';
  if (afterLessons && LESSON_IDS.has(a)) runs[runs.length - 1].ids.push(a);
  else if (SUITES.includes(a)) runs.push({ suite: a, ids: [] });
  else if (afterLessons) runs[runs.length - 1].ids.push(a);
  else {
    console.error(`不认识的参数：${a}\n套件：${SUITES.join('、')}；课 id 只能跟在 lessons 后面。\n例：npm run test:e2e -- lessons state use-effect`);
    process.exit(2);
  }
}
if (!runs.length) SUITES.forEach(suite => runs.push({ suite, ids: [] }));

let failed = 0;
for (const { suite, ids } of runs) {
  console.log(`\n=== ${suite}${ids.length ? ' ' + ids.join(' ') : ''} ===`);
  const r = spawnSync(process.execPath, [path.join(here, suite + '.mjs'), ...ids], { stdio: 'inherit' });
  if (r.status !== 0) {
    failed++;
    console.error(`\n${suite} 失败（退出码 ${r.status}）`);
  }
}
process.exit(failed ? 1 : 0);
