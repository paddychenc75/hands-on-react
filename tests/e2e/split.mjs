// 课程数据按课拆分（每课一个异步 chunk）的浏览器测试：
//   1. 网络：首页不请求任何课的数据 chunk；打开一课只请求这一课（加课前热身要考的前面的课）；复习页只请求到期卡片所属的课；阶段测验页只请求该阶段的课。
//   2. 首屏内容：静态 HTML 里仍有课标题、摘要、学习目标；控制台没有水合警告。
//   3. 慢网（课数据 chunk 延迟 1.5 秒）：课文先显示，测验区显示加载状态，数据到达后正常可用；拦截时显示可重试的错误提示，放行后点“重试”恢复。
//   4. 旧进度（已完成的课、复习卡片、阶段测验记录）在新版本里显示一致。
// 截图存到 tests/screenshots/split-*.png。
// 用法：node tests/e2e/split.mjs      （先 npm run build）
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch, openSite, lessonUrl, lessonData, checker, KEY, ROOT } from './_site.mjs';

const { site, close } = await openSite();
const b = await launch();
const { ok, done } = checker();
const SHOTS = path.join(ROOT, 'tests/screenshots');
const DAY = 864e5;
const { LESSONS } = await import(pathToFileURL(path.join(ROOT, 'course/registry.ts')).href);

const CHUNK = /\/static\/js\/async\/lesson-([\w-]+)\.[0-9a-f]+\.js/;
const chunksOf = reqs => [...new Set(reqs.map(u => CHUNK.exec(u)?.[1]).filter(Boolean))].sort();

/** 新开一页，记录课数据 chunk 请求；seed 是要预先写进 localStorage 的进度（对象或 undefined） */
async function open(url, seed, { waitFor, ctxOpts } = {}) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ...ctxOpts });
  const p = await ctx.newPage();
  p.reqs = [];
  p.errs = [];
  p.on('request', r => p.reqs.push(r.url()));
  p.on('pageerror', e => p.errs.push(e.message));
  p.on('console', m => {
    if (m.type() === 'error' || m.type() === 'warning') p.errs.push(m.text());
  });
  await p.addInitScript(
    ([k, s]) => {
      if (s && !sessionStorage.getItem('seeded')) {
        localStorage.setItem(k, JSON.stringify(s));
        sessionStorage.setItem('seeded', '1');
      }
    },
    [KEY, seed],
  );
  await p.goto(url);
  if (waitFor) await p.waitForSelector(waitFor, { timeout: 30000 });
  await p.waitForTimeout(1200);
  return p;
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* 1. 网络请求 */
{
  const p = await open(site, undefined, { waitFor: 'h1' });
  ok(eq(chunksOf(p.reqs), []), '首页不请求任何课的数据 chunk', chunksOf(p.reqs).join(','));
  await p.context().close();
}
{
  const p = await open(site + 'roadmap.html', undefined, { waitFor: '.home .stage' });
  ok(eq(chunksOf(p.reqs), []), '课程地图不请求任何课的数据 chunk', chunksOf(p.reqs).join(','));
  await p.context().close();
}
{
  const p = await open(lessonUrl(site, 'state'), undefined, { waitFor: '.selfx' });
  ok(eq(chunksOf(p.reqs), ['state']), '打开 state（没有学过别的课）只请求 lesson-state', chunksOf(p.reqs).join(','));
  await p.context().close();
}
{
  // 学过 what-is-react 的两道题（3 天前答的）：state 的课前热身会考它们，所以多加载 what-is-react，别的课都不加载
  const srs = {
    'what-is-react#0': { box: 1, n: 1, due: Date.now() + DAY, last: Date.now() - 3 * DAY },
    'what-is-react#1': { box: 1, n: 1, due: Date.now() + DAY, last: Date.now() - 3 * DAY },
  };
  const p = await open(lessonUrl(site, 'state'), { __srs: srs }, { waitFor: '.warmup .q' });
  ok(eq(chunksOf(p.reqs), ['state', 'what-is-react']), '有学过的题时，state 只多加载热身题所属的 what-is-react', chunksOf(p.reqs).join(','));
  ok((await p.locator('.warmup .q').count()) === 2, '课前热身仍然是 2 道题');
  await p.context().close();
}
{
  const due = Date.now() - 1000;
  const srs = {
    'what-is-react#0': { box: 1, n: 1, due, last: due - DAY },
    'state#0': { box: 1, n: 1, due, last: due - DAY },
    'lists-keys#1': { box: 1, n: 1, due, last: due - DAY },
    'jsx#0': { box: 1, n: 1, due: Date.now() + 5 * DAY, last: Date.now() - DAY },
  };
  const p = await open(site + 'review.html', { __srs: srs }, { waitFor: '.rv-progress' });
  ok(eq(chunksOf(p.reqs), ['lists-keys', 'state', 'what-is-react']), '复习页只请求到期卡片所属的课（没到期的 jsx 不加载）', chunksOf(p.reqs).join(','));
  ok((await p.evaluate(() => document.querySelector('.rv-progress span')?.textContent)).includes('1 / 3'), '复习页显示 第 1 / 3 题');
  await p.context().close();
}
{
  // 没有到期的卡：复习页显示已学题数，不加载任何课；点“来 10 道混合练习”才加载抽到的课
  const srs = {
    'what-is-react#0': { box: 2, n: 2, due: Date.now() + 3 * DAY, last: Date.now() - DAY },
    'jsx#0': { box: 2, n: 2, due: Date.now() + 3 * DAY, last: Date.now() - DAY },
  };
  const p = await open(site + 'review.html', { __srs: srs }, { waitFor: '.done-card' });
  ok(eq(chunksOf(p.reqs), []), '没有到期卡片时复习页不加载任何课', chunksOf(p.reqs).join(','));
  ok((await p.locator('.done-card').innerText()).includes('你已学过 2 道题'), '复习页显示“你已学过 2 道题”（只靠目录和进度算）');
  await p.getByRole('button', { name: '来 10 道混合练习' }).click();
  await p.waitForSelector('.rv-progress');
  ok(eq(chunksOf(p.reqs), ['jsx', 'what-is-react']), '混合练习只加载学过的两课', chunksOf(p.reqs).join(','));
  await p.context().close();
}
for (const si of [0, 3]) {
  const inStage = LESSONS.filter(l => l.stage === si).map(l => l.id);
  const p = await open(site + `check/${si}.html`, undefined, { waitFor: '.quiz .q' });
  const got = chunksOf(p.reqs);
  ok(
    got.length > 0 && got.every(id => inStage.includes(id)) && (await p.locator('.quiz .q').count()) === 12,
    `阶段测验 ${si} 抽出 12 题，只加载该阶段的课（${got.length}/${inStage.length} 课）`,
    got.join(','),
  );
  await p.context().close();
}

/* 2. 首屏内容：静态 HTML 里有课标题、摘要、学习目标；水合没有警告 */
{
  const text = html =>
    html
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&amp;/g, '&');
  for (const id of ['state', 'rendering', 'project-weather']) {
    const html = fs.readFileSync(path.join(ROOT, 'doc_build/lessons', id + '.html'), 'utf8');
    const t = text(html);
    const L = await lessonData(id);
    const missing = [L.title, text(L.summary), ...L.goals.map(text)].filter(s => !t.includes(s));
    ok(missing.length === 0, `静态 HTML（${id}）里有课标题、摘要和 ${L.goals.length} 条学习目标`, missing.join(' | ').slice(0, 200));
  }
  for (const url of [site, lessonUrl(site, 'state'), lessonUrl(site, 'project-weather'), site + 'review.html', site + 'check/2.html']) {
    const p = await open(url);
    const bad = p.errs.filter(e => /hydrat|Minified React error #(418|419|422|423|425)|did not match/i.test(e));
    ok(bad.length === 0, `水合没有警告：${url.replace(site, '')}`, bad.join(' | ').slice(0, 200));
    await p.context().close();
  }
}

/* 3. 慢网和失败 */
{
  const DELAY = 1500;
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await ctx.route(/lesson-state\.[0-9a-f]+\.js/, async route => {
    await new Promise(r => setTimeout(r, DELAY));
    await route.continue();
  });
  const t0 = Date.now();
  await p.goto(lessonUrl(site, 'state'), { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.goals');
  const prose = await p.evaluate(() => document.querySelector('#sec-read')?.innerText.length);
  ok(prose > 500 && Date.now() - t0 < DELAY, '慢网：课文先显示（数据 chunk 还没到）', String(prose));
  await p.evaluate(() => document.getElementById('sec-quiz').scrollIntoView({ block: 'start' }));
  await p.waitForTimeout(600);
  const during = await p.evaluate(() => ({
    loading: [...document.querySelectorAll('.hoc-loading')].map(x => x.innerText),
    qs: document.querySelectorAll('.quiz .q').length,
    title: document.querySelector('#sec-quiz .bt-h')?.innerText,
    count: document.querySelector('#sec-quiz span')?.innerText,
  }));
  ok(
    during.loading.length >= 1 && during.qs === 0 && /19 题|\d+ 题/.test(during.count),
    '慢网：测验区显示加载状态，题还没出现，题数已知',
    JSON.stringify(during),
  );
  await p.screenshot({ path: path.join(SHOTS, 'split-loading.png') });
  await p.waitForSelector('.quiz .q', { timeout: 10000 });
  const after = await p.evaluate(() => ({
    loading: document.querySelectorAll('section:has(#sec-quiz) .hoc-loading').length,
    qs: document.querySelectorAll('.quiz .q').length,
  }));
  ok(after.loading === 0 && after.qs === (await lessonData('state')).quiz.length, '慢网：数据到达后加载状态消失，测验题全部出现', JSON.stringify(after));
  await p.locator('.quiz .q').first().locator('.opt').first().click();
  ok(await p.locator('.quiz .q').first().locator('.explain').isVisible(), '慢网：数据到达后测验可以作答');
  ok(errs.length === 0, '慢网：没有页面错误', errs.join(' | ').slice(0, 200));
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  let block = true;
  await ctx.route(/lesson-state\.[0-9a-f]+\.js/, route => (block ? route.abort() : route.continue()));
  await p.goto(lessonUrl(site, 'state'));
  await p.waitForSelector('section:has(#sec-quiz) .hoc-loaderr', { timeout: 15000 });
  await p.evaluate(() => document.getElementById('sec-quiz').scrollIntoView({ block: 'start' }));
  await p.waitForTimeout(300);
  const msg = await p.locator('section:has(#sec-quiz) .hoc-loaderr').innerText();
  ok(/没能加载/.test(msg) && /重试/.test(msg), '拦截数据 chunk：测验区显示“没能加载”和“重试”', msg);
  ok((await p.locator('.goals li').count()) >= 3 && (await p.locator('#sec-read').innerText()).length > 500, '拦截数据 chunk：课文、学习目标照常');
  ok((await p.locator('.hoc-loaderr').count()) >= 4, '拦截数据 chunk：依赖课数据的区域各自显示错误', String(await p.locator('.hoc-loaderr').count()));
  await p.screenshot({ path: path.join(SHOTS, 'split-error.png') });
  block = false;
  await p.locator('section:has(#sec-quiz) .hoc-loaderr button').click();
  await p.waitForSelector('.quiz .q', { timeout: 15000 });
  ok((await p.locator('section:has(#sec-quiz) .hoc-loaderr').count()) === 0, '放行后点“重试”：测验题出现，错误提示消失');
  await ctx.close();
}

/* 4. 旧进度兼容：已完成的课、复习卡片、阶段测验记录 */
{
  const S = await lessonData('state');
  const W = await lessonData('what-is-react');
  const now = Date.now();
  const lessonDone = L => ({
    quiz: Object.fromEntries(L.quiz.map((q, i) => [i, q.answer])),
    tried: Object.fromEntries(L.quiz.map((_q, i) => [i, true])),
    first: Object.fromEntries(L.quiz.map((_q, i) => [i, true])),
    ex: true,
    done: true,
    note: '我自己的总结',
  });
  const seed = {
    state: lessonDone(S),
    'what-is-react': { ...lessonDone(W), ex: !!W.exercise },
    __srs: {
      'state#0': { box: 2, n: 2, due: now - 1000, last: now - 2 * DAY },
      'state#1': { box: 3, n: 3, due: now + 4 * DAY, last: now - DAY },
      'what-is-react#c0': { box: 1, n: 1, due: now - 5000, last: now - 2 * DAY },
    },
    __stage: { 0: { best: 92, last: 92, passed: true, passedAt: now - 3 * DAY }, 1: { best: 58, last: 58, failedAt: now - 5 * DAY, weak: ['state'] } },
    __pred: { 'state|x': 0 },
  };
  const p = await open(site + 'roadmap.html', seed, { waitFor: '.home .stage' });
  const home = await p.evaluate(() => ({
    top: document.querySelector('.top-progress')?.innerText,
    cta: document.querySelector('.home .cta')?.innerText,
    mastered: document.querySelectorAll('.stage .mastered').length,
    learned: [...document.querySelectorAll('.stats > div')].map(d => d.innerText.replace(/\s+/g, ' ')).filter(t => /道题在复习中|课已完成/.test(t)),
    checks: [...document.querySelectorAll('.check-link')].slice(0, 2).map(a => a.innerText),
  }));
  ok(/已完成 2\/50/.test(home.top), '旧进度：顶栏已完成 2/50', home.top);
  ok(
    home.mastered === 1 && /最好成绩 92%/.test(home.checks[0]) && /最好成绩 58%/.test(home.checks[1]),
    '旧进度：阶段测验记录（通过 92%、未通过 58%）显示一致',
    JSON.stringify(home.checks),
  );
  ok(
    home.learned.some(t => t.includes('3 道题在复习中')) && home.learned.some(t => t.includes('2/50')),
    '旧进度：课程地图“3 道题在复习中”“2/50 课已完成”',
    JSON.stringify(home.learned),
  );
  ok(home.cta.includes('继续学习'), '旧进度：首页显示“继续学习”');
  ok(eq(chunksOf(p.reqs), []), '旧进度：首页仍然不加载课数据', chunksOf(p.reqs).join(','));
  await p.context().close();

  const q = await open(lessonUrl(site, 'state'), seed, { waitFor: '.quiz .q' });
  const lesson = await q.evaluate(() => ({
    finish: document.querySelector('#finish')?.innerText,
    jumps: [...document.querySelectorAll('.jumps a.ok')].map(a => a.innerText),
    qs: document.querySelectorAll('.quiz .q').length,
    okQs: document.querySelectorAll('.quiz .q .explain.ok').length,
    note: document.querySelector('.selfx textarea')?.value,
    side: {
      done: [...document.querySelectorAll('.rp-doc-layout__sidebar a[data-hoc-done]')].map(a => a.getAttribute('href').replace(/^.*\/|\.html$/g, '')).sort(),
      due: document.querySelector('a[data-hoc-due]')?.getAttribute('data-hoc-due'),
      cnt: [...document.querySelectorAll('.rp-sidebar-section-header[data-hoc-cnt]')].map(h => h.getAttribute('data-hoc-cnt'))[0],
    },
  }));
  ok(
    lesson.side.due === '2' && eq(lesson.side.done, ['0', 'state', 'what-is-react']) && lesson.side.cnt === '2/10',
    '旧进度：侧栏到期角标 2、已完成标记（含通过的阶段测验 0）、阶段计数 2/10',
    JSON.stringify(lesson.side),
  );
  ok(/本课已完成/.test(lesson.finish), '旧进度：state 课末显示“本课已完成”（课数据到达之前就能画出）', lesson.finish);
  ok(lesson.qs === S.quiz.length && lesson.okQs === S.quiz.length, '旧进度：测验每题都显示上次答对的状态', JSON.stringify(lesson));
  ok(lesson.jumps.some(t => t.includes('随堂测验')) && lesson.note === '我自己的总结', '旧进度：跳转条打勾、自我解释文字还在', JSON.stringify(lesson.jumps));
  const stored = await q.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
  ok(
    eq(stored.__stage, seed.__stage) && eq(stored.__srs['state#1'], seed.__srs['state#1']) && stored.state.done === true,
    '旧进度：只读页面不改写已有的阶段测验记录和复习卡片',
  );
  await q.context().close();

  const r = await open(site + 'review.html', seed, { waitFor: '.rv-progress' });
  ok(
    (await r.locator('.rv-progress span').innerText()).includes('1 / 2'),
    '旧进度：复习页到期 2 题（state#0、what-is-react#c0）',
    await r.locator('.rv-progress span').innerText(),
  );
  ok(eq(chunksOf(r.reqs), ['state', 'what-is-react']), '旧进度：复习页只加载这两课', chunksOf(r.reqs).join(','));
  await r.context().close();

  const c = await open(site + 'check/1.html', seed, { waitFor: '.quiz .q' });
  const inStage = LESSONS.filter(l => l.stage === 1).map(l => l.id);
  ok(
    (await c.locator('.quiz .q').count()) === 12 && chunksOf(c.reqs).every(id => inStage.includes(id)),
    '旧进度：阶段测验 1（5 天前未通过，已过冷却）可以直接重测，12 题只加载该阶段的课',
    chunksOf(c.reqs).join(','),
  );
  await c.context().close();
}

await b.close();
close();
process.exit(done());
