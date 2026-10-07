// 检查学习机制没有被改坏：提示阶梯、自我解释门槛、阶段测验交卷模式与中途离开、手机宽度无横向滚动。
// 用法：node tests/mechanics.mjs [html 文件，默认 dist/react-course.html]
import { launch, pageUrl } from './_browser.mjs';
const file = process.argv[2] || 'dist/react-course.html';
const b = await launch();
const fails = []; const ok = (cond, name) => { console.log((cond ? 'ok   ' : 'FAIL ') + name); if (!cond) fails.push(name); };
const errs = [];
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
p.on('pageerror', e => errs.push(e.message));

await p.goto(pageUrl(file, 'what-is-react')); await p.waitForSelector('.jumps'); await p.waitForTimeout(400);
const ladder = await p.evaluate(async () => {
  const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('检查答案'));
  let pg = btn; while (pg && !pg._editor) pg = pg.parentElement;
  const st = pg._editor.value, labels = () => [...pg.querySelectorAll('.pg-foot .btn.small')].map(b => b.disabled);
  for (const v of [st + ';', st + ';;', st + '\n;']) { pg._editor.value = v; btn.click(); await new Promise(r => setTimeout(r, 400)); }
  const afterTrivial = labels();
  for (const v of [st + '\nconst a=1', st + '\nconst b=2', st + '\nconst c=3']) { pg._editor.value = v; btn.click(); await new Promise(r => setTimeout(r, 400)); }
  return { afterTrivial, afterReal: labels() };
});
ok(ladder.afterTrivial.every(Boolean), '只加分号不解锁任何帮助');
ok(!ladder.afterReal[0] && ladder.afterReal[2], '真实修改 3 次后解锁提示，但参考答案仍需等待几分钟');

const sx = await p.evaluate(() => { const ta = document.querySelector('.selfx textarea'), b = document.querySelector('.selfx .btn');
  ta.value = '啊'.repeat(40); ta.dispatchEvent(new Event('input')); const junk = b.disabled;
  ta.value = 'state 是组件的记忆：调用 set 函数会请求重新渲染，同一次渲染里读到的是快照。'; ta.dispatchEvent(new Event('input')); return { junk, real: b.disabled }; });
ok(sx.junk && !sx.real, '自我解释：凑字不能展开，认真写可以展开');

await p.goto(pageUrl(file, 'check-1')); await p.waitForTimeout(600);
const defer = await p.evaluate(async () => { const qs = [...document.querySelectorAll('.quiz .q')];
  for (const q of qs.slice(0, 5)) { q.querySelector('.opt').click(); await new Promise(r => setTimeout(r, 10)); }
  return { n: qs.length, right: document.querySelectorAll('.opt.right').length }; });
ok(defer.n === 12, '阶段测验 12 题');
ok(defer.right === 0, '交卷前不显示正确答案');
await p.reload(); await p.waitForTimeout(600);
ok(await p.evaluate(() => /未通过/.test(document.querySelector('.quiz').textContent)), '中途离开记为未通过并进入冷却');

const m = await b.newPage({ viewport: { width: 390, height: 844 } });
m.on('pageerror', e => errs.push(e.message));
await m.goto(pageUrl(file, 'jsx')); await m.waitForSelector('.jumps');
const ids = await m.evaluate(() => LESSONS.map(l => l.id)); const wide = [];
for (const id of ids) { await m.evaluate(id => location.hash = id, id); await m.waitForTimeout(250); if (await m.evaluate(() => document.documentElement.scrollWidth > innerWidth)) wide.push(id); }
ok(!wide.length, '390px 宽下没有横向滚动' + (wide.length ? '：' + wide.join(', ') : ''));

const unexpected = errs.filter(e => !/boom|网络错误|天气服务超时|toUpperCase/.test(e));
ok(!unexpected.length, '没有意外的页面错误' + (unexpected.length ? '：' + unexpected.join(' / ') : ''));
await b.close();
console.log(fails.length ? `${fails.length} 项失败` : '全部通过');
process.exit(fails.length ? 1 : 0);
