// 变式练习和旧进度兼容的浏览器测试:
//   1. 有 drills 的课显示“变式练习”区:每道独立实验台,标题“变式 x/y”,跳转条显示“变式练习 0/N”;
//   2. 简化的提示规则:改代码检查失败 1 次→提示解锁、参考答案仍锁;失败 2 次→参考答案解锁;连点不改代码不计次;
//   3. 变式通过只记在 dr 里,不改正式练习(ex)和“本课完成”(done);
//   4. 旧进度(没有 dr 字段)能正常打开:课程完成状态、复习卡片、阶段测验记录都在,变式练习显示 0/N;
//   5. 手机宽度(390px)下变式练习区没有横向滚动。
// 用法:node tests/e2e/drills.mjs      (先 npm run build)
import { launch, openSite, lessonUrl, lessonData, lessonOrder, checker, KEY } from './_site.mjs';

const { site, close } = await openSite();
const b = await launch();
const { ok, done } = checker();
const errs = [];
const ids = await lessonOrder();
let id;
let L;
for (const x of ids) {
  const d = await lessonData(x);
  if (d.drills?.length) {
    id = x;
    L = d;
    break;
  }
}
if (!id) {
  console.log('没有任何课带 drills');
  process.exit(1);
}
const N = L.drills.length;
console.log('用 ' + id + '(' + N + ' 道变式)');

async function open(ctx, init) {
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  if (init) await p.addInitScript(init.fn, init.arg);
  await p.goto(lessonUrl(site, id));
  await p.waitForSelector('.selfx', { timeout: 60000 });
  await p.waitForFunction(n => document.querySelectorAll('.drill .pg').length >= n, N, { timeout: 60000 });
  await p.waitForTimeout(500);
  return p;
}
// 在第 i 道变式里填代码并检查;返回 { text, ok }
const check = (p, i, code) =>
  p.evaluate(
    async ([i, code]) => {
      const box = document.querySelectorAll('.drill')[i];
      const pg = box.querySelector('.pg');
      const btn = [...box.querySelectorAll('button')].find(x => x.textContent.trim() === '✓ 检查答案');
      pg._editor.value = code;
      await new Promise(r => setTimeout(r, 400));
      btn.click();
      for (let k = 0; k < 100 && btn.disabled; k++) await new Promise(r => setTimeout(r, 200));
      await new Promise(r => setTimeout(r, 200));
      const res = box.querySelector('.result');
      return { text: res.innerText, ok: res.classList.contains('ok') };
    },
    [i, code],
  );
const locks = (p, i) =>
  p.evaluate(i => {
    const box = document.querySelectorAll('.drill')[i];
    return [...box.querySelectorAll('.pg-foot .btn.small')].map(x => ({ t: x.textContent.trim(), disabled: x.disabled }));
  }, i);

{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx);
  ok((await p.locator('.drill').count()) === N, `变式练习区有 ${N} 道,各自独立`);
  ok(
    (await p.locator('.drill-no').allInnerTexts()).every((t, k) => t.startsWith(`变式 ${k + 1}/${N}`)),
    '每道的标题行显示“变式 x/y”',
  );
  ok(await p.evaluate(n => [...document.querySelectorAll('.jumps a')].some(a => a.textContent.includes(`变式练习 0/${n}`)), N), '跳转条显示“变式练习 0/N”');
  ok(await p.evaluate(() => /不影响“本课完成”/.test(document.querySelector('#sec-drills').textContent)), '区标题说明不影响本课完成');

  // 简化的提示规则
  const d0 = L.drills[0];
  const start = d0.starter;
  let l = await locks(p, 0);
  ok(l.length === 2 && l.every(x => x.disabled), '一开始提示和参考答案都锁着(变式练习只有这两级)');
  const r1 = await check(p, 0, start + '\n// 只改注释');
  l = await locks(p, 0);
  ok(!r1.ok && l.every(x => x.disabled), '只改注释:不计入失败次数,什么也不解锁');
  const r2 = await check(p, 0, start + '\nconst unusedA = 1;');
  l = await locks(p, 0);
  ok(!r2.ok && !l[0].disabled && l[1].disabled, '改过代码后失败 1 次:提示解锁,参考答案仍锁着');
  await check(p, 0, start + '\nconst unusedA = 1;');
  l = await locks(p, 0);
  ok(l[1].disabled, '同一份失败代码连点不计次');
  const r4 = await check(p, 0, start + '\nconst unusedB = 2;');
  l = await locks(p, 0);
  ok(!r4.ok && !l[0].disabled && !l[1].disabled, '失败 2 次:参考答案解锁,不需要等时间');

  // 通过只记在 dr 里
  const r5 = await check(p, 1 % N, L.drills[1 % N].solution);
  ok(r5.ok, '第 2 道填参考答案通过(' + r5.text.slice(0, 60) + ')');
  const st = await p.evaluate(([key, id]) => JSON.parse(localStorage.getItem(key))[id], [KEY, id]);
  ok(st.dr && st.dr[1 % N] && st.dr[1 % N].ok === true, '进度记在 dr[1] 里');
  ok(st.ex === false && st.done === false, '变式通过不改正式练习(ex)和本课完成(done)');
  ok(await p.evaluate(n => [...document.querySelectorAll('.jumps a')].some(a => a.textContent.includes(`变式练习 1/${n}`)), N), '跳转条变成“变式练习 1/N”');
  ok(await p.evaluate(() => /变式练习 1\/\d+(.*)选做/.test(document.querySelector('#finish').textContent)), '课末的掌握标准条显示变式进度,并注明选做');
  // 刷新后保留
  await p.reload();
  await p.waitForFunction(n => document.querySelectorAll('.drill .pg').length >= n, N, { timeout: 60000 });
  await p.waitForTimeout(600);
  ok(await p.evaluate(() => document.querySelectorAll('.drill')[1].querySelector('.result.ok') !== null), '刷新后,通过的变式仍显示已通过');
  await ctx.close();
}

// 旧进度:没有 dr 字段
{
  const old = {
    [id]: { quiz: { 0: 0 }, ex: true, done: true, code: 'function App() { return null }', fails: 1, tried: { 0: true }, first: { 0: true } },
    'what-is-react': { quiz: {}, ex: true, done: true },
    __srs: { [`${id}#0`]: { box: 2, n: 3, due: 1, last: 1 } },
    __pred: { 'x|y': 0 },
    __stage: { 0: { best: 90, passed: true, passedAt: 1 } },
  };
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, { fn: ([key, data]) => localStorage.getItem(key) === null && localStorage.setItem(key, JSON.stringify(data)), arg: [KEY, old] });
  await p.waitForTimeout(500);
  ok(
    await p.evaluate(() => [...document.querySelectorAll('.jumps a')].some(a => a.classList.contains('ok') && a.textContent.includes('动手练习'))),
    '旧数据:动手练习仍显示已完成',
  );
  ok(await p.evaluate(n => [...document.querySelectorAll('.jumps a')].some(a => a.textContent.includes(`变式练习 0/${n}`)), N), '旧数据:变式练习显示 0/N');
  ok(await p.evaluate(() => /本课已完成/.test(document.querySelector('#finish').textContent)), '旧数据:本课仍是已完成');
  const after = await p.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  ok(after.__srs && after.__srs[`${id}#0`].box === 2 && after.__stage[0].best === 90, '旧数据:复习卡片和阶段测验记录原样保留');
  await p.goto(site + 'review.html');
  await p.waitForSelector('.rp-doc', { timeout: 30000 });
  await p.waitForTimeout(600);
  ok(await p.evaluate(() => /复习|到期|今天/.test(document.body.innerText)), '旧数据:复习页正常打开');
  await p.goto(site);
  await p.waitForSelector('.home', { timeout: 30000 });
  await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.querySelector('.stats').innerText.includes('小时本机任务与本机项目')), '首页显示三段时间');
  await ctx.close();
}

// 手机宽度
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await open(ctx);
  ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)), '390px 宽下变式练习区没有横向滚动');
  await ctx.close();
}

const unexpected = errs.filter(e => !/boom|网络错误|天气服务超时|toUpperCase/.test(e));
ok(!unexpected.length, '没有意外的页面错误' + (unexpected.length ? ':' + unexpected.join(' / ') : ''));
await b.close();
close();
process.exit(done() ? 1 : 0);
