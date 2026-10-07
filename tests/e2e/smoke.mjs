// 站点冒烟测试：对构建产物（doc_build）做端到端检查：
// 课文渲染、实验台、预测、React 警告、练习、进度存储和侧栏标记、首页、复习页、术语表、阶段测验页、
// 客户端路由、键盘翻课、阅读位置、手机宽度、站内搜索。
// 用法：npm run build && node tests/e2e/smoke.mjs
import { launch, openSite, lessonData, lessonOrder, lessonUrl, checker, KEY } from './_site.mjs';

const OLD_KEY = 'react-zero-to-expert-v1';
const LESSONS = ['what-is-react', 'state', 'lists-keys'];
const data = lessonData;
const { ok, done } = checker();
const { site, close: closeSite } = await openSite();
const url = id => lessonUrl(site, id);

const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const pageErrors = [];
const consoleBad = [];
page.on('pageerror', e => pageErrors.push(e.message));
page.on('console', m => {
  const t = m.text();
  // 水合不一致：开发版是 "Hydration failed / text content does not match"，生产版是 Minified React error #418/#423/#425
  if (m.type() === 'error' && /hydrat|did not match|Minified React error #(418|419|422|423|425)/i.test(t)) consoleBad.push(t.slice(0, 200));
});

// 默认每次都从空进度开始（先清 localStorage 再刷新），各项检查互不影响
const openLesson = async (id, { fresh = true } = {}) => {
  await page.goto(url(id));
  if (fresh) {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  }
  await page.waitForSelector('.prose', { timeout: 30000 });
  await page.waitForSelector('.selfx', { timeout: 30000 });
};

/* a. 三课能打开，正文、测验、自我解释渲染出来 */
for (const id of LESSONS) {
  const L = await data(id);
  await openLesson(id);
  const r = await page.evaluate(() => ({
    h1: document.querySelector('.rp-doc h1')?.textContent || '',
    prose: document.querySelector('.prose')?.textContent.length || 0,
    quiz: document.querySelectorAll('.quiz .q').length,
    selfx: !!document.querySelector('.selfx textarea'),
    goals: document.querySelectorAll('.goals li').length,
    side: [...document.querySelectorAll('.rp-doc-layout__sidebar a')].length,
  }));
  ok(
    r.h1.includes(L.title.slice(0, 4)) && r.prose > 300 && r.quiz === L.quiz.length && r.selfx && r.goals === L.goals.length,
    `a. ${id}：标题、正文、测验(${r.quiz}/${L.quiz.length})、目标、自我解释都渲染`,
    JSON.stringify(r),
  );
  if (id === 'state') ok(r.side >= 46 + 6 + 2, 'a. 侧栏列出 46 课、6 个阶段测验、复习和术语表', String(r.side));
}

/* b. 每个实验台滚动到可见后运行出结果，没有 .pv-err */
for (const id of LESSONS) {
  await openLesson(id);
  const n = await page.locator('.pg').count();
  const res = [];
  for (let i = 0; i < n; i++) {
    const pg = page.locator('.pg').nth(i);
    await pg.scrollIntoViewIfNeeded();
    const title = await pg.locator('.pg-title').innerText();
    // 预测型示例先答题再运行（和学习者的操作一致）
    if (await pg.locator('.predict').count()) {
      await pg.locator('.predict .opt').first().click();
      await pg.locator('.predict .btn.primary').click();
    }
    await page
      .waitForFunction(
        i => {
          const p = document.querySelectorAll('.pg')[i];
          return p._ran && p.querySelector('.preview').innerHTML.length > 0;
        },
        i,
        { timeout: 30000 },
      )
      .catch(() => {});
    await page.waitForTimeout(300);
    const st = await pg.evaluate(p => ({ ran: !!p._ran, err: p.querySelectorAll('.pv-err').length, html: p.querySelector('.preview').innerHTML.length }));
    res.push({ title, ...st });
  }
  const bad = res.filter(r => !r.ran || r.err || !r.html);
  ok(n > 0 && !bad.length, `b. ${id}：${n} 个实验台都运行出结果且没有 .pv-err`, JSON.stringify(bad));
}

/* c. state 课预测题：预测前说明隐藏，选项提交后才显示 */
{
  await openLesson('state');
  const pg = page.locator('.pg').first();
  await pg.scrollIntoViewIfNeeded();
  await pg.locator('.predict').waitFor();
  const before = await pg.evaluate(p => ({
    note: p.querySelector('.pg-note') ? !p.querySelector('.pg-note').hidden : false,
    verdict: !p.querySelector('.predict-result').hidden,
    ran: !!p._ran,
    previewHidden: p.querySelector('.preview').hidden,
  }));
  ok(!before.note && !before.verdict && !before.ran && before.previewHidden, 'c. 预测前：说明、结果、预览都隐藏，代码没有运行', JSON.stringify(before));
  await pg.locator('.predict .opt').first().click();
  const picked = await pg.evaluate(p => ({ note: !p.querySelector('.pg-note').hidden, ran: !!p._ran }));
  ok(!picked.note && !picked.ran, 'c. 只选了选项还不显示说明（要点“运行，验证我的预测”）', JSON.stringify(picked));
  await pg.locator('.predict .btn.primary').click();
  await page.waitForTimeout(500);
  const after = await pg.evaluate(p => ({
    note: !p.querySelector('.pg-note').hidden,
    verdict: !p.querySelector('.predict-result').hidden,
    text: p.querySelector('.predict-result').textContent.slice(0, 40),
  }));
  ok(after.note && after.verdict, 'c. 提交预测后显示说明和对错', JSON.stringify(after));
}

/* d. React 开发版警告被拦截并显示。
   lists-keys 课现有的示例都写了 key，不会触发警告（课文内容不能改）。所以在练习编辑器里写一个没有 key 的列表：
   这是学习者最常见的操作，同样走“实验台运行 → React 开发版 console.error → 引擎拦截”这条路径。 */
{
  await openLesson('lists-keys');
  const ex = page.locator('.pg', { has: page.locator('.pg-badge.ex') });
  await ex.scrollIntoViewIfNeeded();
  await ex
    .locator('.pv-err')
    .waitFor({ state: 'detached', timeout: 20000 })
    .catch(() => {});
  await page.waitForFunction(
    () => {
      const p = document.querySelector('.pg .pg-badge.ex')?.closest('.pg');
      return p && p._ran;
    },
    null,
    { timeout: 30000 },
  );
  const noKey = `function App() {
  const todos = [{ id: 1, title: 'a' }, { id: 2, title: 'b' }];
  return <ul>{todos.map(t => <li>{t.title}</li>)}</ul>;
}`;
  await ex.locator('textarea').fill(noKey);
  await ex.locator('textarea').press('Control+Enter');
  await page.waitForTimeout(1200);
  const warn = await ex.evaluate(p => [...p.querySelectorAll('.console .warn')].map(e => e.textContent));
  ok(
    warn.some(w => /React 警告/.test(w) && /key/.test(w)),
    'd. 缺 key 的列表：实验台控制台出现 React 的 key 警告',
    JSON.stringify(warn),
  );
}

/* e. 练习：solution 通过，starter 不通过（每课都测） */
for (const id of LESSONS) {
  const L = await data(id);
  await openLesson(id);
  const pg = page.locator('.pg', { has: page.locator('.pg-badge.ex') });
  await pg.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => {
      const p = document.querySelector('.pg .pg-badge.ex')?.closest('.pg');
      return p && p._ran;
    },
    null,
    { timeout: 30000 },
  );
  const check = async code => {
    await pg.locator('textarea').fill(code);
    await pg.getByRole('button', { name: '✓ 检查答案' }).click();
    await page.waitForFunction(
      () => {
        const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('检查'));
        return b && !b.disabled;
      },
      null,
      { timeout: 30000 },
    );
    await page.waitForTimeout(300);
    return pg.locator('.result').innerText();
  };
  const bad = await check(L.exercise.starter);
  ok(/^✗/.test(bad), `e. ${id}：填 starter 点检查不通过`, bad.slice(0, 80));
  const good = await check(L.exercise.solution);
  ok(/通过|做得好/.test(good) && !/^✗/.test(good), `e. ${id}：填 solution 点检查通过`, good.slice(0, 80));
}

/* f. 答对一道测验题，刷新后作答状态还在；键是 hands-on-react-v1 */
{
  const L = await data('what-is-react');
  await openLesson('what-is-react');
  await page.waitForSelector('.quiz .q');
  const q0 = page.locator('.quiz .q').first();
  const want = L.quiz[0].options[L.quiz[0].answer];
  await q0
    .locator('.opt', { hasText: want.slice(0, 12) })
    .first()
    .click();
  await page.waitForTimeout(200);
  const right1 = await q0.locator('.opt.right').count();
  const saved = await page.evaluate(k => localStorage.getItem(k), KEY);
  ok(
    right1 === 1 && saved && JSON.parse(saved)['what-is-react'].quiz['0'] === L.quiz[0].answer,
    'f. 答对后进度写进 localStorage 的 ' + KEY,
    String(saved).slice(0, 120),
  );
  ok(await page.evaluate(k => localStorage.getItem(k) === null, OLD_KEY), 'f. 没有写旧键 ' + OLD_KEY);
  await page.reload();
  await page.waitForSelector('.quiz .q');
  const after = await page
    .locator('.quiz .q')
    .first()
    .evaluate(q => ({
      right: q.querySelectorAll('.opt.right').length,
      disabled: [...q.querySelectorAll('.opt')].every(b => b.disabled),
      explain: !q.querySelector('.explain').hidden,
    }));
  ok(after.right === 1 && after.disabled && after.explain, 'f. 刷新页面后答对的状态还在', JSON.stringify(after));
  // 侧栏标记：做完本课全部测验和练习后，侧栏里这一课有标记（data-hoc-done）
  const L2 = L;
  for (let i = 1; i < L2.quiz.length; i++)
    await page
      .locator('.quiz .q')
      .nth(i)
      .locator('.opt', { hasText: L2.quiz[i].options[L2.quiz[i].answer].slice(0, 12) })
      .first()
      .click();
  const pg = page.locator('.pg', { has: page.locator('.pg-badge.ex') });
  await pg.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.pg .pg-badge.ex')?.closest('.pg')._ran, null, { timeout: 30000 });
  await pg.locator('textarea').fill(L2.exercise.solution);
  await pg.getByRole('button', { name: '✓ 检查答案' }).click();
  await page.waitForSelector('#finish.is-done', { timeout: 30000 });
  await page.waitForTimeout(300);
  const mark = await page.evaluate(() => [...document.querySelectorAll('.rp-doc-layout__sidebar a[data-hoc-done]')].map(a => a.getAttribute('href')));
  ok(mark.length === 1 && /what-is-react/.test(mark[0]), 'f. 本课完成后侧栏里这一课有标记', JSON.stringify(mark));
}

/* g. 390px 宽度下没有横向滚动：首页、复习页、术语表和全部 46 课（实验台都运行之后再量） */
{
  const { lessonOrder } = await import('./_site.mjs');
  const pages = ['', 'review.html', 'glossary.html', ...(await lessonOrder()).map(l => 'lessons/' + l + '.html')];
  const wide = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
      while (next < pages.length) {
        const pg = pages[next++];
        await m.goto(site + pg);
        await m.waitForSelector('.rp-doc, .home', { timeout: 30000 });
        await m.waitForTimeout(500);
        await m.evaluate(async () => {
          for (const x of document.querySelectorAll('.pg')) {
            x.scrollIntoView();
            await new Promise(r => setTimeout(r, 60));
          }
          window.scrollTo(0, 0);
        });
        await m.waitForTimeout(900);
        const w = await m.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
        if (w.sw > w.iw) wide.push((pg || '首页') + ':' + w.sw);
      }
      await m.close();
    }),
  );
  ok(!wide.length, 'g. 390px 宽：首页、复习、术语表和 46 课运行实验台之后 scrollWidth <= innerWidth', wide.join(', '));
}

/* h. 站内搜索：中文词 */
{
  await openLesson('state');
  await page
    .getByRole('button', { name: /搜索|Search/ })
    .first()
    .click();
  await page.keyboard.type('声明式', { delay: 60 });
  await page.waitForTimeout(2500);
  const items = await page.evaluate(() =>
    [...document.querySelectorAll('.rp-search-panel__results a, .rp-search-panel__results [class*=item]')].map(e => e.textContent.trim().slice(0, 40)),
  );
  ok(items.length > 0, 'h. 搜索“声明式”有结果', JSON.stringify(items));
}

/* i. 首页：标题、六个阶段、继续学习入口；学完一课后数字更新 */
{
  await page.goto(site);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.home .stage');
  const r = await page.evaluate(() => ({
    h1: document.querySelector('.home h1')?.textContent,
    stages: document.querySelectorAll('.home .stage').length,
    prereq: !!document.querySelector('.home .prereq'),
    tree: document.querySelectorAll('.home .tnode').length,
    cta: document.querySelector('.home .cta .btn.primary')?.textContent,
    stats: [...document.querySelectorAll('.home .stats b')].map(b => b.textContent),
    names: [...document.querySelectorAll('.home .stage h3')].map(h => h.textContent),
  }));
  ok(
    r.h1 === '从零开始，边做边学React' &&
      r.stages === 6 &&
      r.prereq &&
      r.tree === 7 &&
      /开始第一课/.test(r.cta) &&
      r.stats[0] === '46' &&
      r.names[5] === '深入',
    'i. 首页：hero、前置知识、六个阶段（第 6 阶段叫“深入”）、组件树、开始第一课',
    JSON.stringify(r),
  );
  // 组件树：点 Header，它和后代（Logo、Search）重新渲染，兄弟 TodoList 不变
  await page.locator('.home .tnode', { hasText: 'Header' }).click();
  await page.waitForTimeout(600);
  const rc = await page.evaluate(() =>
    [...document.querySelectorAll('.home .tnode')].map(g => g.querySelector('text').textContent + g.querySelector('.rc').textContent),
  );
  ok(
    rc.filter(x => /渲染 2 次/.test(x)).length === 3 && /TodoList.*渲染 1 次/.test(rc.join('|')),
    'i. 点击组件树节点：它和后代渲染次数 +1，兄弟不变',
    JSON.stringify(rc),
  );
  // 标记 what-is-react 为已完成（点“我已掌握，跳过”），回到首页
  await page.goto(url('what-is-react'));
  await page.waitForSelector('#finish .btn');
  await page.locator('#finish .btn').click();
  await page.goto(site);
  await page.waitForSelector('.home .stage');
  await page.waitForTimeout(300);
  const r2 = await page.evaluate(() => ({
    cta: document.querySelector('.home .cta .btn.primary')?.textContent,
    done: document.querySelectorAll('.home .stage li.done').length,
    stat: document.querySelectorAll('.home .stats b')[4].textContent,
    meter: document.querySelector('.home .stage .meter span')?.textContent,
  }));
  ok(
    /继续学习：/.test(r2.cta) && r2.done === 1 && r2.stat === '1/46' && r2.meter === '1/9',
    'i. 学完一课后：首页出现“继续学习”，阶段进度 1/9，总数 1/46',
    JSON.stringify(r2),
  );
}

/* j. 侧栏和顶栏：阶段已完成计数、已完成标记、总进度；到期数量角标 */
{
  await page.goto(url('state'));
  await page.waitForSelector('.selfx');
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => ({
    cnt: [...document.querySelectorAll('.rp-sidebar-section-header[data-hoc-cnt]')].map(h => h.getAttribute('data-hoc-cnt')),
    done: [...document.querySelectorAll('.rp-doc-layout__sidebar a[data-hoc-done]')].map(a => a.getAttribute('href')),
    top: document.querySelector('.top-progress')?.textContent,
    due: document.querySelector('a[data-hoc-due]')?.getAttribute('data-hoc-due'),
  }));
  ok(
    r.cnt[0] === '1/9' && r.cnt.length === 6 && r.done.length === 1 && /已完成 1\/46/.test(r.top) && !r.due,
    'j. 侧栏每阶段“已完成 x/y”、已完成课标记、顶栏“已完成 1/46”，没有到期题时无角标',
    JSON.stringify(r),
  );
  // 造 3 张已到期的复习卡
  await page.evaluate(k => {
    const p = JSON.parse(localStorage.getItem(k) || '{}');
    p.__srs = {
      'what-is-react#0': { due: Date.now() - 1000, step: 1 },
      'what-is-react#1': { due: Date.now() - 1000, step: 1 },
      'state#0': { due: Date.now() - 1000, step: 1 },
    };
    localStorage.setItem(k, JSON.stringify(p));
  }, KEY);
  await page.reload();
  await page.waitForSelector('.selfx');
  await page.waitForTimeout(500);
  const due = await page.evaluate(() => document.querySelector('a[data-hoc-due]')?.getAttribute('data-hoc-due'));
  ok(due === '3', 'j. 侧栏“今日复习”带到期数量角标', String(due));

  // 侧栏的课程顺序和阶段归属：和 course/order.ts、每课数据文件的 stage 一致。
  // 第 5 阶段以《项目搭建与交付》（engineering）开头、以综合项目（project-weather）结尾，每阶段的课数和“已完成 x/y”的 y 对得上。
  const order = await lessonOrder();
  const stageOf = await Promise.all(order.map(async id => (await data(id)).stage));
  const perStage = [0, 1, 2, 3, 4, 5].map(si => order.filter((_, i) => stageOf[i] === si));
  const side = await page.evaluate(() => ({
    lessons: [...new Set([...document.querySelectorAll('.rp-doc-layout__sidebar a')].map(a => a.getAttribute('href')))]
      .filter(h => /\/lessons\//.test(h))
      .map(h => h.replace(/^.*\/lessons\/|\.html$/g, '')),
    cnt: [...document.querySelectorAll('.rp-sidebar-section-header[data-hoc-cnt]')].map(h => h.getAttribute('data-hoc-cnt')),
  }));
  ok(
    JSON.stringify(side.lessons) === JSON.stringify(order) &&
      perStage[4][0] === 'engineering' &&
      perStage[4].at(-1) === 'project-weather' &&
      side.cnt.every((c, i) => c.endsWith('/' + perStage[i].length)),
    'j. 侧栏：课按 order.ts 排列；第 5 阶段以 engineering 开头、以 project-weather 结尾；每阶段课数与“已完成 x/y”的 y 一致',
    JSON.stringify({ n: side.lessons.length, cnt: side.cnt, stage5: perStage[4] }),
  );
}

/* k. 复习页：到期的题逐题出现，答完显示“下一题”和“回看这一课”；点链接走客户端路由（页面不整页刷新） */
{
  await page.goto(site + 'review.html');
  await page.waitForSelector('.rv-progress');
  await page.evaluate(() => {
    window.__marker = 1;
  });
  const r = await page.evaluate(() => ({ prog: document.querySelector('.rv-progress span')?.textContent, q: document.querySelectorAll('.q').length }));
  ok(/今日复习 · 第 1 \/ 3 题/.test(r.prog) && r.q === 1, 'k. 复习页：到期的 3 题一题一题出现', JSON.stringify(r));
  await page.locator('.q .opt').first().click();
  await page.waitForTimeout(200);
  const vis = await page.evaluate(() => ({
    next: !document.querySelector('.q + .btn.primary')?.hidden,
    src: document.querySelector('.q .src a')?.getAttribute('href'),
  }));
  ok(vis.next && /\/hands-on-react\/lessons\/.+\.html$/.test(vis.src), 'k. 答完出现“下一题”，“回看这一课”链接带 base', JSON.stringify(vis));
  await page.locator('.q .src a').click();
  await page.waitForURL(/lessons\//);
  await page.waitForSelector('.selfx');
  ok(await page.evaluate(() => window.__marker === 1), 'k. 站内链接走客户端路由（不整页刷新）');
  // 没有任何卡片时
  await page.evaluate(() => localStorage.clear());
  await page.goto(site + 'review.html');
  await page.waitForSelector('.done-card');
  ok(
    await page.evaluate(
      () =>
        /还没有需要复习的题目/.test(document.querySelector('.done-card').textContent) &&
        /lessons\/what-is-react/.test(document.querySelector('.done-card a').getAttribute('href')),
    ),
    'k. 没有复习题时提示去开始第一课',
  );
}

/* l. 术语表，课文里术语有虚线标注，点击显示释义 */
{
  await page.goto(site + 'glossary.html');
  await page.waitForSelector('.tbl table');
  const n = await page.locator('.tbl tbody tr').count();
  const { GLOSSARY } = await import('../../course/glossary.ts');
  ok(n === GLOSSARY.length && n >= 40, 'l. 术语表页列出全部术语 ' + n + ' 条');
  const geo = await page.evaluate(() => {
    const w = document.querySelector('.tbl'),
      t = w.querySelector('table'),
      th = w.querySelector('th');
    const cs = getComputedStyle(t);
    return { gap: th.getBoundingClientRect().top - w.getBoundingClientRect().top, margin: cs.marginTop, radius: cs.borderRadius, border: cs.borderTopWidth };
  });
  ok(
    geo.gap <= 2 && geo.margin === '0px' && geo.radius === '0px' && geo.border === '0px',
    'l. 术语表：表头紧贴 .tbl 外框，没有多余空白、双重边框或圆角（Rspress 文档表格样式不叠加）',
    JSON.stringify(geo),
  );
  await openLesson('state');
  const term = page.locator('.prose abbr.term').first();
  await term.click();
  await page.waitForTimeout(200);
  const t = await page.evaluate(() => document.querySelector('#toast')?.textContent || '');
  ok(t.length > 4 && (await term.getAttribute('title')), 'l. 点术语显示释义（触屏）', t);
}

/* m. 阶段测验页：入口、冷却提示；每阶段最后一课末尾有入口 */
{
  await openLesson('lists-keys');
  ok((await page.locator('.stage-cta').count()) === 0, 'm. 不是阶段最后一课，没有阶段测验入口');
  await openLesson('project-todo');
  const cta = page.locator('.stage-cta');
  ok((await cta.count()) === 1 && /入门 阶段测验|入门阶段测验/.test(await cta.innerText()), 'm. 第 1 阶段最后一课末尾有阶段测验入口');
  await cta.click();
  await page.waitForURL(/check\/0/);
  await page.waitForSelector('.quiz .q');
  ok(
    (await page.locator('.quiz .q').count()) === 12 && (await page.evaluate(() => /入门阶段测验/.test(document.querySelector('.rp-doc h1').textContent))),
    'm. 点入口进入阶段测验页（12 题）',
  );
  // 答完 12 题：全错，交卷后显示结果、冷却
  await page.evaluate(async () => {
    for (const q of document.querySelectorAll('.quiz .q')) {
      q.querySelector('.opt').click();
      await new Promise(r => setTimeout(r, 20));
    }
  });
  await page.waitForSelector('.done-card');
  const res = await page.evaluate(() => ({
    card: document.querySelector('.done-card').textContent.slice(0, 40),
    rights: document.querySelectorAll('.opt.right').length,
  }));
  ok(res.rights >= 1 && /答对 \d+\/12/.test(res.card), 'm. 交卷后显示成绩和对错解析', JSON.stringify(res));
}

/* n. 键盘 ← → 翻课（客户端路由），在输入框里不翻 */
{
  await openLesson('state');
  await page.evaluate(() => {
    window.__marker = 1;
  });
  await page.keyboard.press('ArrowRight');
  await page.waitForURL(/events/);
  await page.waitForSelector('.selfx');
  ok(await page.evaluate(() => window.__marker === 1), 'n. 按 → 翻到下一课（事件处理），页面没有整页刷新');
  await page.keyboard.press('ArrowLeft');
  await page.waitForURL(/lessons\/state/);
  await page.waitForSelector('.selfx');
  await page.locator('.selfx textarea').click();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  ok(/lessons\/state/.test(page.url()), 'n. 在输入框里按 → 不翻课');
}

/* o. 阅读进度条、继续上次位置 */
{
  await openLesson('state', { fresh: true });
  await page.evaluate(() => window.scrollTo(0, 1400));
  await page.waitForTimeout(700);
  const w = await page.evaluate(() => ({ hidden: document.querySelector('.read-bar').hidden, t: document.querySelector('.read-bar').style.transform }));
  ok(!w.hidden && /scaleX\(0\.\d+\)/.test(w.t), 'o. 阅读进度条随滚动变化', JSON.stringify(w));
  await page.waitForTimeout(600);
  await page.reload();
  await page.waitForSelector('.selfx');
  await page.waitForSelector('#toast.show', { timeout: 8000 }).catch(() => {});
  const t = await page.evaluate(() => ({ show: !!document.querySelector('#toast.show'), text: document.querySelector('#toast')?.textContent || '' }));
  ok(t.show && /上次读到这一课的 \d+% 处/.test(t.text) && /从上次的位置继续/.test(t.text), 'o. 重新打开这一课提示“继续上次位置”', JSON.stringify(t));
  await page.goto(site);
  await page.waitForSelector('.home');
  ok(await page.evaluate(() => document.querySelector('.read-bar').hidden), 'o. 非课文页不显示阅读进度条');
}

/* p. 浅色和深色模式下页面可读：文字和背景对比度（首页、课、复习、术语表、阶段测验） */
for (const scheme of ['light', 'dark']) {
  const dctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
  const dp = await dctx.newPage();
  const contrast = (fg, bg) => {
    const lum = c => {
      const [r, g, b] = c
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(x => {
          x /= 255;
          return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
        });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const a = lum(fg),
      b = lum(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const low = [];
  for (const pg of ['', 'lessons/state.html', 'review.html', 'glossary.html', 'check/0.html']) {
    await dp.goto(site + pg);
    await dp.waitForSelector('.rp-doc, .home');
    await dp.waitForTimeout(800);
    if ((await dp.evaluate(() => document.documentElement.classList.contains('dark'))) !== (scheme === 'dark')) low.push(pg + ' 模式不对');
    const samples = await dp.evaluate(() => {
      const out = [];
      const seen = new Set();
      const bgOf = el => {
        for (let e = el; e; e = e.parentElement) {
          const c = getComputedStyle(e).backgroundColor;
          if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c;
        }
        return 'rgb(0,0,0)';
      };
      for (const el of document.querySelectorAll(
        '.rp-doc p, .rp-doc li, .rp-doc td, .rp-doc th, .rp-doc h1, .rp-doc h2, .home p, .home li a, .home b, .rp-doc .crumb, .rp-doc .lesson-sum, .rp-doc .opt, .rp-doc .q-text, .rp-doc .btn, .stage .desc, .rp-doc .call, .rp-doc code',
      )) {
        if (!el.textContent.trim() || el.closest('.preview') || el.closest('.editor')) continue;
        const cs = getComputedStyle(el);
        const key = cs.color + '|' + bgOf(el);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ fg: cs.color, bg: bgOf(el), t: el.textContent.trim().slice(0, 20) });
      }
      return out;
    });
    for (const sm of samples) {
      const c = contrast(sm.fg, sm.bg);
      if (c < 4.5) low.push(`${pg || '首页'}「${sm.t}」${sm.fg} on ${sm.bg} = ${c.toFixed(1)}`);
    }
  }
  ok(!low.length, 'p. ' + (scheme === 'dark' ? '深色' : '浅色') + '模式：五类页面的主要文字对比度 >= 4.5', low.join(' ; '));
  await dctx.close();
}

ok(!pageErrors.length, '页面没有意外的 pageerror', pageErrors.join(' | '));
ok(!consoleBad.length, '没有水合不一致的控制台错误', consoleBad.join(' | '));

await browser.close();
closeSite();
process.exit(done() ? 1 : 0);
