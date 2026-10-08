// 练习/变式练习的快速试验台：不需要 npm run build，几秒出结果，多人同时用也不会互相覆盖。
// 把引擎和那一课的数据文件用 esbuild 打成一个脚本，在无头浏览器里挂出练习，把一组代码依次填进去、点“检查答案”，打印每份代码的结果。
//
//   node tests/e2e/try.mjs <课id> <ex | drill:N> <变体文件.mjs> [--throttle 4] [--reps 3]
//
//   ex        正式练习；drill:0 是 drills[0]（下标从 0 起）
//   变体文件   export default [{ name, code, expect: 'pass' | 'fail', match?: /失败信息应包含的文字/ }, …]
//             code 里写 '$starter'、'$solution' 取起始代码和参考答案原文（参考答案原文会被"粘贴答案"规则挡，所以 $solution 用于 solution 通过的验证：本脚本会先把它当作自己写的代码提交）
//   --throttle N   用 CDP 把 CPU 降速 N 倍（验证计时类检查）
//   --reps K       每份代码重复检查 K 次（看是否稳定）
// 需要网络（Babel、Prism 来自 CDN）。React 和第三方库用 docs/public/runtime/ 里的文件（npm run predev 生成）。
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { launch, ROOT, BASE, lessonData } from './_site.mjs';

const argv = process.argv.slice(2);
const flag = (name, def) => {
  const i = argv.indexOf('--' + name);
  if (i < 0) return def;
  return argv.splice(i, 2)[1];
};
const throttle = Number(flag('throttle', 1));
const reps = Number(flag('reps', 1));
const [lessonId, which, variantsFile] = argv;
if (!lessonId || !which || !variantsFile) {
  console.error('用法：node tests/e2e/try.mjs <课id> <ex | drill:N> <变体文件.mjs> [--throttle 4] [--reps 3]');
  process.exit(2);
}
const lesson = await lessonData(lessonId);
const target = which === 'ex' ? lesson.exercise : lesson.drills?.[Number(which.split(':')[1])];
if (!target) {
  console.error(`找不到 ${lessonId} 的 ${which}`);
  process.exit(2);
}
const variants = (await import(pathToFileURL(path.resolve(variantsFile)).href)).default;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hoc-try-'));
const entry = path.join(tmp, 'entry.ts');
fs.writeFileSync(
  entry,
  `import lesson from ${JSON.stringify(path.join(ROOT, 'course/lessons', lessonId + '.ts'))};
import { loadRuntime, loadLibs, makeExercise, makeDrills } from ${JSON.stringify(path.join(ROOT, 'course/engine/index.ts'))};
import { libsInSource } from ${JSON.stringify(path.join(ROOT, 'course/engine/logic/runtime.ts'))};
(window as any).__try = async (which: string, code: string) => {
  await loadRuntime();
  const ex: any = lesson.exercise;
  const dr: any = lesson.drills || [];
  const srcs = which === 'ex' ? [ex.starter, ex.solution, code] : [dr[+which.split(':')[1]].starter, dr[+which.split(':')[1]].solution, code];
  await loadLibs(libsInSource(srcs.join('\\n')));
  document.body.innerHTML = '';
  const wrap = which === 'ex' ? makeExercise(lesson as any) : makeDrills(lesson as any).children[+which.split(':')[1]];
  document.body.appendChild(wrap as any);
  const pg: any = (wrap as HTMLElement).querySelector('.pg');
  pg._editor.value = code;
  await new Promise(r => setTimeout(r, 300));
  const btn: any = [...(wrap as HTMLElement).querySelectorAll('button')].find(b => b.textContent!.includes('检查答案'));
  btn.click();
  for (let i = 0; i < 300 && btn.disabled; i++) await new Promise(r => setTimeout(r, 100));
  await new Promise(r => setTimeout(r, 100));
  const res: any = (wrap as HTMLElement).querySelector('.result');
  return { ok: res.classList.contains('ok'), text: res.innerText.replace(/\\s+/g, ' ').trim() };
};
`,
);
await build({
  entryPoints: [entry],
  bundle: true,
  outfile: path.join(tmp, 'bundle.js'),
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  logLevel: 'error',
  absWorkingDir: ROOT,
});

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end('<!doctype html><meta charset="utf-8"><body><script src="/bundle.js"></script>');
  }
  if (p === '/bundle.js') {
    res.writeHead(200, { 'content-type': 'text/javascript' });
    return res.end(fs.readFileSync(path.join(tmp, 'bundle.js')));
  }
  if (p.startsWith(BASE + 'runtime/')) {
    const f = path.join(ROOT, 'docs/public', p.slice(BASE.length));
    if (fs.existsSync(f)) {
      res.writeHead(200, { 'content-type': 'text/javascript' });
      return res.end(fs.readFileSync(f));
    }
  }
  res.writeHead(404);
  res.end();
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;
const b = await launch();
let bad = 0;
const subst = c => (c === '$starter' ? target.starter : c === '$solution' ? target.solution : c);
console.log(`${lessonId} ${which}${throttle > 1 ? `  CPU 降速 ${throttle} 倍` : ''}${reps > 1 ? `  每份重复 ${reps} 次` : ''}`);
for (const v of variants) {
  const outcomes = [];
  for (let k = 0; k < reps; k++) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    if (throttle > 1) {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    }
    await page.goto(url);
    await page.waitForFunction(() => window.__try, null, { timeout: 30000 });
    const code = subst(v.code);
    let r;
    try {
      r = await page.evaluate(([w, c]) => window.__try(w, c), [which, code]);
    } catch (e) {
      r = { ok: false, text: 'EXCEPTION ' + e.message.split('\n')[0] };
    }
    outcomes.push(r);
    await ctx.close();
  }
  const passes = outcomes.filter(o => o.ok).length;
  const want = v.expect === 'pass';
  const good = outcomes.every(o => o.ok === want) && (want || !v.match || outcomes.every(o => v.match.test(o.text)));
  if (!good) bad++;
  console.log(`${good ? 'ok  ' : 'BAD '} [${v.expect}] ${v.name}  → 通过 ${passes}/${reps}`);
  console.log('       ' + outcomes[0].text.slice(0, 260));
}
await b.close();
server.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(bad ? `\n${bad} 份不符合预期` : '\n全部符合预期');
process.exit(bad ? 1 : 0);
