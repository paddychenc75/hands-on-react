// 检查学习机制没有被改坏（由旧版 tests/mechanics.mjs 移植，每一项都保留）：
// 提示阶梯、自我解释门槛、阶段测验 12 题、交卷前不显示答案、中途离开记为未通过并冷却、手机宽度无横向滚动、无意外页面错误。
// 用法：node tests/e2e/mechanics.mjs      （先 npm run build）
import { launch, openSite, lessonUrl, lessonOrder, checker } from './_site.mjs';

const { site, close } = await openSite();
const b = await launch();
const { ok, done } = checker();
const errs = [];
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
p.on('pageerror', e => errs.push(e.message));

await p.goto(lessonUrl(site, 'what-is-react'));
await p.waitForSelector('.jumps');
await p.waitForFunction(() => [...document.querySelectorAll('button')].some(x => x.textContent.includes('检查答案')), null, { timeout: 60000 });
await p.waitForTimeout(400);
const ladder = await p.evaluate(async () => {
  const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('检查答案'));
  let pg = btn;
  while (pg && !pg._editor) pg = pg.parentElement;
  const st = pg._editor.value,
    labels = () => [...pg.querySelectorAll('.pg-foot .btn.small')].map(b => b.disabled);
  for (const v of [st + ';', st + ';;', st + '\n;']) {
    pg._editor.value = v;
    btn.click();
    await new Promise(r => setTimeout(r, 400));
  }
  const afterTrivial = labels();
  for (const v of [st + '\nconst a=1', st + '\nconst b=2', st + '\nconst c=3']) {
    pg._editor.value = v;
    btn.click();
    await new Promise(r => setTimeout(r, 400));
  }
  return { afterTrivial, afterReal: labels() };
});
ok(ladder.afterTrivial.every(Boolean), '只加分号不解锁任何帮助');
ok(!ladder.afterReal[0] && ladder.afterReal[2], '真实修改 3 次后解锁提示，但参考答案仍需等待几分钟');

const sx = await p.evaluate(() => {
  const ta = document.querySelector('.selfx textarea'),
    b = document.querySelector('.selfx .btn');
  ta.value = '啊'.repeat(40);
  ta.dispatchEvent(new Event('input'));
  const junk = b.disabled;
  ta.value = 'state 是组件的记忆：调用 set 函数会请求重新渲染，同一次渲染里读到的是快照。';
  ta.dispatchEvent(new Event('input'));
  return { junk, real: b.disabled };
});
ok(sx.junk && !sx.real, '自我解释：凑字不能展开，认真写可以展开');

await p.goto(site + 'check/1.html');
await p.waitForSelector('.quiz .q');
await p.waitForTimeout(600);
const defer = await p.evaluate(async () => {
  const qs = [...document.querySelectorAll('.quiz .q')];
  for (const q of qs.slice(0, 5)) {
    q.querySelector('.opt').click();
    await new Promise(r => setTimeout(r, 10));
  }
  return { n: qs.length, right: document.querySelectorAll('.opt.right').length };
});
ok(defer.n === 12, '阶段测验 12 题');
ok(defer.right === 0, '交卷前不显示正确答案');
await p.reload();
await p.waitForSelector('.quiz');
await p.waitForTimeout(600);
ok(await p.evaluate(() => /未通过/.test(document.querySelector('.quiz').textContent)), '中途离开记为未通过并进入冷却');

const m = await b.newPage({ viewport: { width: 390, height: 844 } });
m.on('pageerror', e => errs.push(e.message));
const ids = await lessonOrder();
const wide = [];
const pages = ['', 'roadmap.html', 'review.html', 'glossary.html', ...[0, 1, 2, 3, 4, 5].map(i => `check/${i}.html`), ...ids.map(id => `lessons/${id}.html`)];
for (const pg of pages) {
  await m.goto(site + pg);
  await m.waitForSelector('.rp-doc, .home, .story', { timeout: 30000 });
  await m.waitForTimeout(250);
  if (await m.evaluate(() => document.documentElement.scrollWidth > innerWidth)) wide.push(pg || '首页');
}
ok(!wide.length, `390px 宽下没有横向滚动（首页、复习、术语表、6 个阶段测验、${ids.length} 课）` + (wide.length ? '：' + wide.join(', ') : ''));

const unexpected = errs.filter(e => !/boom|网络错误|天气服务超时|toUpperCase/.test(e));
ok(!unexpected.length, '没有意外的页面错误' + (unexpected.length ? '：' + unexpected.join(' / ') : ''));
await b.close();
close();
process.exit(done() ? 1 : 0);
