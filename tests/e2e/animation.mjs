// 动画与过渡一课的浏览器测试（Chromium 支持 View Transition API）：
//   六个示例的行为、四道预测题的答案、没有 View Transition API 时更新照常发生、开启“减少动画”后 React 不会自动关动画。
// 用法：node tests/e2e/animation.mjs      （先 npm run build）
import { launch, openSite, lessonUrl, lessonData, checker } from './_site.mjs';

const { site, close } = await openSite();
const b = await launch();
const { ok, done } = checker();
const L = await lessonData('animation');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function open(ctx, init) {
  const p = await ctx.newPage();
  p.errs = [];
  p.on('pageerror', e => p.errs.push(e.message));
  if (init) await p.addInitScript(init);
  await p.goto(lessonUrl(site, 'animation'));
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForSelector('.selfx', { timeout: 60000 });
  await p.waitForFunction(() => [...document.querySelectorAll('.pg')].some(x => x._editor), null, { timeout: 60000 });
  return p;
}
// 在标题含 title 的实验台里：回答预测题（选 optionText 那一项）并运行
async function predictAndRun(p, title, optionText) {
  return p.evaluate(
    async ({ title, optionText }) => {
      const pg = [...document.querySelectorAll('.pg')].find(x => x.querySelector('.pg-title').textContent.includes(title));
      pg.scrollIntoView();
      await new Promise(r => setTimeout(r, 200));
      const opt = [...pg.querySelectorAll('.predict .opt')].find(x => x.textContent.slice(1) === optionText);
      if (!opt) return 'NO OPTION ' + [...pg.querySelectorAll('.predict .opt')].map(x => x.textContent).join('|');
      opt.click();
      await new Promise(r => setTimeout(r, 50));
      pg.querySelector('.predict .btn.primary').click();
      await new Promise(r => setTimeout(r, 400));
      return pg.querySelector('.predict-result').className + ' ' + pg.querySelector('.predict-result').innerText.slice(0, 20);
    },
    { title, optionText },
  );
}
const runPlain = (p, title) =>
  p.evaluate(async title => {
    const pg = [...document.querySelectorAll('.pg')].find(x => x.querySelector('.pg-title').textContent.includes(title));
    pg.scrollIntoView();
    await new Promise(r => setTimeout(r, 300));
    return !!pg;
  }, title);
// 点实验台预览区里文字为 text 的按钮
const clickIn = (p, title, text) =>
  p.evaluate(
    async ({ title, text }) => {
      const pg = [...document.querySelectorAll('.pg')].find(x => x.querySelector('.pg-title').textContent.includes(title));
      pg.scrollIntoView({ block: 'center' }); // <ViewTransition> 只为视口内的元素启动动画
      await new Promise(r => setTimeout(r, 250));
      const btn = [...pg.querySelectorAll('.preview button')].find(x => x.textContent.trim() === text);
      if (!btn) throw new Error('NO BUTTON ' + text);
      btn.click();
    },
    { title, text },
  );
const consoleOf = (p, title) =>
  p.evaluate(title => {
    const pg = [...document.querySelectorAll('.pg')].find(x => x.querySelector('.pg-title').textContent.includes(title));
    return pg.querySelector('.console').innerText;
  }, title);
const inPreview = (p, title, fn, arg) =>
  p.evaluate(
    ({ title, fn, arg }) => {
      const pg = [...document.querySelectorAll('.pg')].find(x => x.querySelector('.pg-title').textContent.includes(title));
      return new Function('root', 'arg', 'return (' + fn + ')(root, arg)')(pg.querySelector('.preview'), arg);
    },
    { title, fn: fn.toString(), arg },
  );

const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await open(ctx);
const T = Object.keys(L.plays);
const ans = k => L.plays[k].predict.options[L.plays[k].predict.answer];

// 预测题：选正确答案，应该显示“预测正确”
for (const k of T.filter(k => L.plays[k].predict)) {
  const r = await predictAndRun(p, k.slice(0, 8), ans(k));
  ok(/ok /.test(r), `预测题答案正确：${k}`, r);
}

/* 1. 条件渲染：入场有动画，离场没有 */
const T1 = T[0].slice(0, 8);
await clickIn(p, T1, '打开');
const op0 = await inPreview(p, T1, root => new Promise(r => requestAnimationFrame(() => r(getComputedStyle(root.querySelector('.card')).opacity))));
ok(Number(op0) < 0.5, '1. 刚挂载的第一帧 opacity 接近 0（@starting-style 生效）', op0);
await sleep(700);
ok((await inPreview(p, T1, root => getComputedStyle(root.querySelector('.card')).opacity)) === '1', '1. 400ms 过渡结束后 opacity 为 1');
await clickIn(p, T1, '关闭');
await sleep(100);
ok(!(await inPreview(p, T1, root => root.querySelector('.card'))), '1. 点关闭后卡片立刻不在 DOM 里');
ok((await consoleOf(p, T1)).includes('下一帧：卡片已经不在 DOM 里'), '1. 控制台：下一帧卡片已经不在 DOM 里');

/* 2. usePresence */
const T2 = T[1].slice(0, 8);
const phases = async () =>
  (await consoleOf(p, T2))
    .split('\n')
    .filter(x => x.includes('阶段：'))
    .map(x => x.replace(/.*阶段：/, ''));
await clickIn(p, T2, '打开');
await sleep(900);
ok((await phases()).join() === 'gone,entering,entered', '2. 打开：gone → entering → entered', (await phases()).join());
await clickIn(p, T2, '关闭');
await sleep(150);
ok((await phases()).at(-1) === 'leaving', '2. 关闭后进入 leaving');
ok(await inPreview(p, T2, root => !!root.querySelector('.sheet')), '2. leaving 期间面板仍在 DOM 里');
await clickIn(p, T2, '打开');
await sleep(1200);
ok((await phases()).slice(-2).join() === 'leaving,entered', '2. 离场中再打开：leaving → entered（不经过 gone）', (await phases()).join());
ok(await inPreview(p, T2, root => !!root.querySelector('.sheet')), '2. 重新打开后，旧定时器（500ms）没有把面板卸载');
await clickIn(p, T2, '关闭');
await sleep(1500);
ok((await phases()).at(-1) === 'gone' && !(await inPreview(p, T2, root => root.querySelector('.sheet'))), '2. 离场结束后卸载');
// 快速连点：开、关、开、关
for (let i = 0; i < 4; i++) {
  await inPreview(p, T2, root => root.querySelector('button').click());
  await sleep(40);
}
await sleep(1500);
ok(['gone', 'entered'].includes((await phases()).at(-1)), '2. 快速连点后状态停在合法状态', (await phases()).slice(-4).join());

/* 3. ViewTransition：放不放进 startTransition */
const T3 = T[2].slice(0, 8);
const count = async () => ((await consoleOf(p, T3)).match(/动画开始/g) || []).length;
await clickIn(p, T3, '普通 setState 切换');
await sleep(500);
await clickIn(p, T3, '普通 setState 切换');
await sleep(500);
ok((await count()) === 0, '3. 普通 setState 展开、收起：没有“动画开始”日志', String(await count()));
await clickIn(p, T3, 'startTransition 切换');
await sleep(800);
ok((await count()) === 1 && (await consoleOf(p, T3)).includes('动画开始：进入'), '3. startTransition 展开：1 条“动画开始：进入”');
await clickIn(p, T3, 'startTransition 切换');
await sleep(800);
ok((await count()) === 2 && (await consoleOf(p, T3)).includes('动画开始：离开'), '3. startTransition 收起：再 1 条“动画开始：离开”');

/* 4. 相册：共享元素与列表重排 */
const T4 = T[3].slice(0, 4);
await runPlain(p, T4);
const thumbs = () => inPreview(p, T4, root => [...root.querySelectorAll('.thumb')].map(x => x.textContent.trim()).join(''));
ok((await thumbs()) === '1234', '4. 初始顺序 1234');
const during = [];
await clickIn(p, T4, '反转顺序');
await sleep(150);
during.push(await p.evaluate(() => document.getAnimations().filter(a => a.effect?.pseudoElement).length));
await sleep(1000);
ok((await thumbs()) === '4321', '4. 反转后 4321');
ok(during[0] > 0, '4. 重排期间有 View Transition 的伪元素动画在运行', String(during[0]));
await p
  .locator('.pg')
  .filter({ has: p.locator('.pg-title', { hasText: T4 }) })
  .locator('.thumb')
  .first()
  .click(); // 用真实的鼠标点击
await sleep(100);
const nAnim = await p.evaluate(() =>
  document
    .getAnimations()
    .filter(a => a.effect?.pseudoElement)
    .map(a => a.effect.pseudoElement),
);
ok(nAnim.length > 0, '4. 打开大图期间有伪元素动画', nAnim.join());
await sleep(1000);
ok(await inPreview(p, T4, root => !!root.querySelector('.big')), '4. 点缩略图后显示大图');
await inPreview(p, T4, root => root.querySelector('.big').click());
await sleep(1200);
ok((await thumbs()) === '4321', '4. 返回后列表还在，顺序保留');

/* 5. FLIP */
const T5 = T[4].slice(0, 4);
await runPlain(p, T5);
const tops = () =>
  inPreview(p, T5, root =>
    [...root.querySelectorAll('li')].map(x => Math.round(x.getBoundingClientRect().top - root.querySelector('ul').getBoundingClientRect().top)),
  );
const t0 = await tops();
await clickIn(p, T5, '反转');
await sleep(150);
const mid = await tops();
await sleep(600);
const end = await tops();
ok(mid[0] > end[0] && mid[0] < t0[3], '5. 动画中新的第一项（原来的最后一项）在旧位置和新位置之间', `${t0.join()} / ${mid.join()} / ${end.join()}`);
ok(end[1] - end[0] === end[2] - end[1] && end[2] - end[1] === end[3] - end[2], '5. 动画结束后各项回到正常布局位置（间距相同）', end.join());
await clickIn(p, T5, '删除第一项');
await sleep(700);
ok((await inPreview(p, T5, root => root.querySelectorAll('li').length)) === 3, '5. 删除后剩 3 项');
await clickIn(p, T5, '在前面加一项');
await sleep(700);
ok((await inPreview(p, T5, root => root.querySelectorAll('li').length)) === 4, '5. 在前面加一项后有 4 项');

/* 6. 性能 */
const T6 = T[5].slice(0, 8);
await clickIn(p, T6, '开始测量');
await p.waitForFunction(
  title => {
    const pg = [...document.querySelectorAll('.pg')].find(x => x.querySelector('.pg-title').textContent.includes(title));
    return /每帧强制布局/.test(pg.querySelector('.preview').innerText);
  },
  T6,
  { timeout: 20000 },
);
const m = (await inPreview(p, T6, root => root.querySelector('p').innerText)).match(/transform ([\d.]+) ms；margin-left ([\d.]+) ms/);
ok(m && Number(m[2]) > Number(m[1]) * 1.3, '6. margin-left 的每帧布局耗时明显高于 transform（相对差距）', m && m.slice(1).join(' vs '));

ok(p.errs.length === 0, '页面没有未捕获错误', p.errs.join(' | '));
await ctx.close();

/* 没有 View Transition API：更新照常，没有报错 */
const ctx2 = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p2 = await open(ctx2, () => {
  Document.prototype.startViewTransition = undefined;
});
await runPlain(p2, T3);
await predictAndRun(p2, T3, ans(T[2]));
await clickIn(p2, T3, 'startTransition 切换');
await sleep(500);
ok(await inPreview(p2, T3, root => !!root.querySelector('p')), '没有 View Transition API：startTransition 的更新照常显示');
ok(((await consoleOf(p2, T3)).match(/动画开始/g) || []).length === 0, '没有 View Transition API：不触发动画回调');
ok(p2.errs.length === 0, '没有 View Transition API：没有未捕获错误', p2.errs.join(' | '));
await ctx2.close();

/* 减少动画：React 不会自动关掉动画 */
const ctx3 = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const p3 = await open(ctx3);
await predictAndRun(p3, T3, ans(T[2]));
await clickIn(p3, T3, 'startTransition 切换');
await sleep(80);
ok(
  (await p3.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.pseudoElement).length)) > 0,
  '开启减少动画：<ViewTransition> 动画仍在播放（要自己用媒体查询关掉）',
);
await ctx3.close();

await b.close();
close();
process.exit(done() ? 1 : 0);
