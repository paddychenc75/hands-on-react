// 首页滚动叙事（9 幕：开场、七个时代、收束）的浏览器测试：
//   静态 HTML 里有全部文案；滚动驱动（往回滚会倒放）；不劫持滚动；减少动画时每幕直接是最终画面；
//   390 / 360 宽无横向滚动；继续学习和今日复习按钮；幕进度指示；不加载课的重数据 chunk；没有 JS 时文案和按钮仍在；键盘 Tab 走完。
// 用法：npm run build && node tests/e2e/home.mjs
//   HOME_SHOTS=1 node tests/e2e/home.mjs   重拍 tests/screenshots/home-story-*.png（桌面浅色/深色每幕、手机每幕、减少动画整页）
//   HOME_ENGINE=js  把 animation-timeline 屏蔽掉，强制走 JS 回退路径（用来在 Chromium 里验证回退路径）
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch, openSite, lessonData, checker, KEY, ROOT } from './_site.mjs';

const { ok, done } = checker();
const { site, close } = await openSite();
const browser = await launch();
const DAY = 864e5;
const { LESSONS } = await import(pathToFileURL(path.join(ROOT, 'course/registry.ts')).href);
const FORCE_JS = process.env.HOME_ENGINE === 'js';
const errs = [];
const CHUNK = /\/static\/js\/async\/lesson-([\w-]+)\.[0-9a-f]+\.js/;

async function open({ w = 1280, h = 800, scheme = 'light', reduced = false, seed, js = true } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    colorScheme: scheme,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    javaScriptEnabled: js,
  });
  const p = await ctx.newPage();
  p.reqs = [];
  p.on('request', r => p.reqs.push(r.url()));
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => {
    if ((m.type() === 'error' || m.type() === 'warning') && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200));
  });
  if (js) {
    await p.addInitScript(
      ([k, s, force]) => {
        if (s && !sessionStorage.getItem('seeded')) {
          localStorage.setItem(k, JSON.stringify(s));
          sessionStorage.setItem('seeded', '1');
        }
        if (force) {
          const orig = CSS.supports.bind(CSS);
          CSS.supports = (a, b) => (/animation-timeline/.test(a) ? false : orig(a, b));
        }
        window.__prevented = [];
        const add = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function (t, f, o) {
          if (/^(wheel|touchmove|touchstart|keydown|scroll)$/.test(t) && typeof f === 'function') {
            const g = function (e) {
              const r = f.call(this, e);
              if (e.defaultPrevented && /^(wheel|touchmove|touchstart)$/.test(t)) window.__prevented.push(t);
              return r;
            };
            return add.call(this, t, g, o);
          }
          return add.call(this, t, f, o);
        };
      },
      [KEY, seed, FORCE_JS],
    );
  }
  await p.goto(site);
  await p.waitForSelector('.story');
  if (js) await p.waitForSelector('.story[data-mode]');
  await p.waitForTimeout(500);
  return p;
}
const titles = [
  '动手学 React',
  '数据变了，界面靠人一处处改',
  '界面是 state 的函数',
  '整份重算，只提交差别',
  '渲染可以被切成小片',
  '紧急的更新先做',
  '一块块从服务器流过来',
  '记忆化交给编译器',
  '每一代，都在解决上一代留下的问题',
];
const ids = ['scene-0', 'scene-1', 'scene-2', 'scene-3', 'scene-4', 'scene-5', 'scene-6', 'scene-7', 'scene-8'];
/** 滚到第 i 幕、舞台停住期间进度为 t 的位置 */
const at = (p, i, t) =>
  p.evaluate(
    ([i, t]) => {
      const sc = document.querySelectorAll('.sc')[i];
      const r = sc.getBoundingClientRect();
      const V = innerHeight - 64;
      window.scrollTo(0, i === 0 ? 0 : i === 8 ? r.top + scrollY - 64 : r.top + scrollY - 64 + t * (r.height - V));
    },
    [i, t],
  );
const settle = p => p.waitForTimeout(350);
const look = (p, sel) =>
  p.evaluate(s => {
    const e = document.querySelector(s);
    const cs = getComputedStyle(e);
    return { o: +(+cs.opacity).toFixed(3), tf: cs.transform };
  }, sel);

/* 1. 静态 HTML：全部幕的标题和文案都在（不依赖 JS） */
{
  const html = fs.readFileSync(path.join(ROOT, 'doc_build/index.html'), 'utf8');
  const text = html.replace(/<[^>]+>/g, '').replace(/<!--.*?-->/g, '');
  const h2s = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map(m => m[1].replace(/<[^>]+>/g, ''));
  ok(/<h1[^>]*>动手学 React<\/h1>/.test(html) && h2s.length === 8, '静态 HTML：开场一个 h1，其余每幕一个 h2（共 8 个）', JSON.stringify(h2s));
  ok(
    titles.slice(1).every((t, i) => h2s[i] === t),
    '静态 HTML：8 个 h2 的标题与脚本一致',
    JSON.stringify(h2s),
  );
  const copy = [
    '一份数据显示在三处',
    '数据一变，React 就重新调用它',
    '常说的虚拟 DOM',
    'Fiber 重写了内部架构',
    '前者能打断后者',
    'Server Components 与 Actions 在 React 19 稳定',
    '自动加上相当于 memo、useMemo、useCallback 的记忆化',
    '先预测，再运行',
  ];
  ok(
    copy.every(c => text.includes(c)),
    '静态 HTML：每幕的说明文字都在',
    copy.filter(c => !text.includes(c)).join('|'),
  );
  ok(/href="[^"]*\/roadmap/.test(html), '静态 HTML：有到课程地图的链接');
  ok((html.match(/id="scene-\d"/g) || []).length === 9 && html.includes('aria-label="首页分幕"'), '静态 HTML：9 幕和幕进度指示');
  ok(/class="swap/.test(html) && /aria-hidden="true"/.test(html), '静态 HTML：示意画面在 HTML 里，且对读屏隐藏（说明文字是等价的）');
  ok(
    /animation-timeline/.test(fs.readFileSync(path.join(ROOT, 'theme/story.css'), 'utf8')) && /story-dyn/.test(html),
    '静态 HTML：<head> 里有动态布局开关的小脚本',
  );
}

/* 2. 没有 JS：文案和按钮都可见可用 */
{
  const p = await open({ js: false });
  const r = await p.evaluate(() => ({
    h2: [...document.querySelectorAll('.sc h2')].map(h => h.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })),
    btn: [...document.querySelectorAll('.story a.btn')].map(a => [a.textContent.trim(), a.checkVisibility({ checkOpacity: true }), a.getAttribute('href')]),
    sticky: getComputedStyle(document.querySelector('.s1 .sc-stage')).position,
    hook: [...document.querySelectorAll('.sc-copy .hook')].every(e => +getComputedStyle(e).opacity === 1),
    sw: document.documentElement.scrollWidth <= innerWidth,
  }));
  ok(r.h2.length === 8 && r.h2.every(Boolean), '没有 JS：8 个 h2 都可见');
  ok(
    r.btn.length >= 2 && r.btn.every(b => b[1]) && r.btn.some(b => /从第 1 课开始/.test(b[0])),
    '没有 JS：按钮可见，开场有“从第 1 课开始”',
    JSON.stringify(r.btn),
  );
  ok(r.hook && r.sticky === 'relative' && r.sw, '没有 JS：是一篇静态长文（舞台不 sticky、没有透明的文字、无横向滚动）', JSON.stringify(r));
  await p.context().close();
}

/* 3. 滚动驱动：往回滚会倒放；不劫持滚动；只用 transform / opacity */
{
  const p = await open();
  const mode = await p.getAttribute('.story', 'data-mode');
  ok(FORCE_JS ? mode === 'js' : mode === 'css' || mode === 'js', '实现路径：' + mode + (FORCE_JS ? '（强制 JS 回退）' : '（浏览器自己选的）'));
  ok(
    (await p.evaluate(() => document.documentElement.classList.contains('story-dyn'))) &&
      (await p.evaluate(() => getComputedStyle(document.querySelector('.s1 .sc-stage')).position)) === 'sticky',
    '滚动驱动：动态布局开启，舞台 sticky',
  );
  // 第 1 幕：“漏了”那一行随进度出现；第 2 幕：state 数字换成 3；第 4 幕：红色帧随进度铺开
  const probes = [
    [1, '.s1 .cmd.late', 'o', 0.2, 0.9],
    [2, '.s2 .a2-note', 'o', 0.2, 0.95],
    [4, '.s4 .sl', 'tf', 0.1, 0.9],
    [5, '.s5 .cells i:last-child::after', null, 0, 0],
    [7, '.s7 .cc .l3 em', 'o', 0.2, 0.9],
  ];
  for (const [i, sel, key, a, b] of probes) {
    if (!key) continue;
    await at(p, i, a);
    await settle(p);
    const v1 = (await look(p, sel))[key];
    await at(p, i, b);
    await settle(p);
    const v2 = (await look(p, sel))[key];
    await at(p, i, a);
    await settle(p);
    const v3 = (await look(p, sel))[key];
    ok(
      JSON.stringify(v1) !== JSON.stringify(v2) && JSON.stringify(v1) === JSON.stringify(v3),
      `滚动驱动：第 ${i} 幕 ${sel} 的 ${key} 随进度变化，往回滚会倒放`,
      JSON.stringify([v1, v2, v3]),
    );
  }
  // 第 3 幕的“新旧描述相同的部分淡出，只剩一处高亮”
  await at(p, 3, 0.1);
  await settle(p);
  const keep0 = (await look(p, '.s3 .a3-tree.new .nd.keep'))?.o;
  await at(p, 3, 0.6);
  await settle(p);
  const keep1 = (await look(p, '.s3 .a3-tree.new .nd.keep'))?.o;
  const chg = (await look(p, '.s3 .a3-tree.new .nd.chg')).o;
  ok(keep0 === 1 && keep1 < 0.45 && chg === 1, '滚动驱动：第 3 幕相同的节点淡出，只剩被改的那一处是实的', JSON.stringify([keep0, keep1, chg]));
  // 不劫持滚动：wheel / touch 事件没有被 preventDefault，滚动距离等于输入
  await p.evaluate(() => scrollTo(0, 0));
  await settle(p);
  await p.mouse.move(400, 400);
  await p.mouse.wheel(0, 300);
  await p.waitForTimeout(250);
  const y1 = await p.evaluate(() => scrollY);
  await p.keyboard.press('PageDown');
  await p.waitForTimeout(500);
  const y2 = await p.evaluate(() => scrollY);
  await p.keyboard.press('Space');
  await p.waitForTimeout(500);
  const y3 = await p.evaluate(() => scrollY);
  ok(y1 === 300 && y2 > y1 + 300 && y3 > y2 + 300, '不劫持滚动：滚轮 300px 就是 300px；PageDown、空格照常翻页', [y1, y2, y3].join(','));
  const prevented = await p.evaluate(() => {
    const out = [];
    for (const type of ['wheel', 'touchmove']) {
      const e = new Event(type, { cancelable: true, bubbles: true });
      document.body.dispatchEvent(e);
      out.push(e.defaultPrevented);
    }
    return { synthetic: out, recorded: window.__prevented };
  });
  ok(!prevented.synthetic.some(Boolean) && prevented.recorded.length === 0, '不劫持滚动：wheel、touchmove 没有被 preventDefault', JSON.stringify(prevented));
  const snap = await p.evaluate(() => [getComputedStyle(document.documentElement).scrollSnapType, getComputedStyle(document.body).scrollSnapType]);
  ok(!snap.some(s => /mandatory/.test(s)), '不劫持滚动：没有 scroll-snap mandatory', snap.join('|'));
  ok(
    await p.evaluate(() => [...document.styleSheets].every(s => [...s.cssRules].every(r => !/scroll-snap-type:\s*[^;]*mandatory/.test(r.cssText)))),
    '不劫持滚动：样式表里没有 mandatory',
  );
  // 只动 transform / opacity：滚动期间没有布局属性被动画（rAF 驱动时写的只有 --p）
  const props = await p.evaluate(() => {
    const out = new Set();
    for (const a of document.getAnimations()) for (const k of a.effect?.getKeyframes?.()?.[0] ? Object.keys(a.effect.getKeyframes()[0]) : []) out.add(k);
    return [...out];
  });
  ok(
    props.every(k => /^(offset|computedOffset|easing|composite|transform|opacity|--p)$/.test(k)),
    '只动 transform / opacity：页面上的动画只有这些属性（和 --p）',
    props.join(','),
  );
  ok(errs.length === 0, '首页没有控制台错误、警告和水合不一致', errs.join(' | '));
  const chunks = [...new Set(p.reqs.map(u => CHUNK.exec(u)?.[1]).filter(Boolean))];
  ok(chunks.length === 0, '首页不加载任何一课的数据 chunk', chunks.join(','));
  await p.context().close();
}

/* 4. 幕进度指示：9 个点，有 aria-label，点击跳到那一幕，当前幕有 aria-current */
{
  const p = await open();
  const labels = await p.$$eval('.rail a', as => as.map(a => a.getAttribute('aria-label')));
  ok(labels.length === 9 && labels.every(l => /^第 \d 幕：/.test(l)), '幕进度指示：9 个点都有 aria-label', JSON.stringify(labels));
  ok((await p.getAttribute('.rail a[data-scene="0"]', 'aria-current')) === 'step', '幕进度指示：一开始第 0 幕是当前幕');
  await p.click('.rail a[data-scene="4"]');
  await p.waitForTimeout(1800);
  const r = await p.evaluate(() => ({
    top: Math.round(document.getElementById('scene-4').getBoundingClientRect().top),
    cur: document.querySelector('.rail a[aria-current]')?.dataset.scene,
  }));
  ok(Math.abs(r.top - 64) <= 3, '幕进度指示：点第 4 个点，滚到第 4 幕开头', JSON.stringify(r));
  await at(p, 6, 0.5);
  await p.waitForTimeout(500);
  ok((await p.getAttribute('.rail a[data-scene="6"]', 'aria-current')) === 'step', '幕进度指示：滚到第 6 幕时第 6 个点亮');
  await p.context().close();
}

/* 5. 继续学习、今日复习：没有进度 / 有进度 / 有到期卡片 */
{
  const p = await open();
  const r = await p.evaluate(() => [...document.querySelectorAll('.s0 .st-actions a')].map(a => [a.textContent.trim(), a.getAttribute('href')]));
  ok(
    r.length === 1 && /从第 1 课开始/.test(r[0][0]) && /lessons\/what-is-react/.test(r[0][1]),
    '没有进度：开场只有“从第 1 课开始”，没有“今日复习”',
    JSON.stringify(r),
  );
  const last = await p.evaluate(() => [...document.querySelectorAll('.s8 .st-actions a')].map(a => a.textContent.trim()));
  ok(/开始学习/.test(last[0]) && last.length === 1, '没有进度：收束幕的主按钮是“开始学习”', JSON.stringify(last));
  await p.context().close();
  const W = await lessonData('what-is-react');
  const now = Date.now();
  const seed = {
    'what-is-react': {
      quiz: Object.fromEntries(W.quiz.map((q, i) => [i, q.answer])),
      tried: Object.fromEntries(W.quiz.map((_q, i) => [i, true])),
      first: Object.fromEntries(W.quiz.map((_q, i) => [i, true])),
      ex: !!W.exercise,
      done: true,
    },
    __srs: { 'what-is-react#0': { box: 1, n: 1, due: now - 1000, last: now - 2 * DAY } },
  };
  const q = await open({ seed });
  await q.waitForFunction(() => /继续学习/.test(document.querySelector('.s0 .st-actions a')?.textContent || ''));
  const r2 = await q.evaluate(() => [...document.querySelectorAll('.s0 .st-actions a')].map(a => [a.textContent.trim(), a.getAttribute('href')]));
  const next = LESSONS[1];
  ok(
    /^继续学习：/.test(r2[0][0]) && r2[0][1].includes('/lessons/' + next.id) && /今日复习 1 题/.test(r2[1]?.[0]) && /review/.test(r2[1][1]),
    '有进度和到期卡片：“继续学习：下一课”和“今日复习 1 题”',
    JSON.stringify(r2),
  );
  const last2 = await q.evaluate(() => [...document.querySelectorAll('.s8 .st-actions a')].map(a => a.textContent.trim()));
  ok(/^继续学习：/.test(last2[0]), '有进度：收束幕的主按钮也是“继续学习”', JSON.stringify(last2));
  ok(errs.length === 0, '有进度时没有水合警告', errs.join(' | '));
  await q.context().close();
}

/* 6. 减少动画：每幕直接是最终画面，没有滚动驱动的位移 */
{
  const p = await open({ reduced: true });
  const r = await p.evaluate(() => {
    const art = [...document.querySelectorAll('.sc .art')].map(a => +getComputedStyle(a).opacity);
    const sc = [...document.querySelectorAll('.sc')].map(s => ({
      sticky: getComputedStyle(s.querySelector('.sc-stage')).position,
      anim: getComputedStyle(s).animationName,
      tall: s.getBoundingClientRect().height > innerHeight * 1.2,
    }));
    const swaps = [...document.querySelectorAll('.s2 .swap .n, .s3 .swap .n')].map(e => +getComputedStyle(e).opacity);
    const copy = [...document.querySelectorAll('.sc-copy > *')].map(e => +getComputedStyle(e).opacity);
    const cmd = +getComputedStyle(document.querySelector('.s1 .cmd.late')).opacity;
    return {
      art,
      sticky: sc.map(s => s.sticky),
      anims: sc.map(s => s.anim),
      swaps,
      copy,
      cmd,
      dots: document.querySelectorAll('.rail a').length,
      sw: document.documentElement.scrollWidth <= innerWidth,
    };
  });
  ok(
    r.art.every(o => o === 1) && r.copy.every(o => o === 1) && r.swaps.every(o => o === 1) && r.cmd === 1,
    '减少动画：每幕的文字和画面都是最终状态（不透明）',
    JSON.stringify(r),
  );
  ok(
    r.sticky.every(s => s !== 'sticky') && r.anims.every(a => a === 'none'),
    '减少动画：没有 sticky 舞台，没有滚动驱动的动画',
    JSON.stringify([r.sticky, r.anims]),
  );
  ok(r.dots === 9, '减少动画：幕进度指示保留');
  const y = await (async () => {
    await p.evaluate(() => scrollTo(0, 2000));
    await settle(p);
    const a = await look(p, '.s3 .a3-chip');
    await p.evaluate(() => scrollTo(0, 2300));
    await settle(p);
    return [a, await look(p, '.s3 .a3-chip')];
  })();
  ok(JSON.stringify(y[0]) === JSON.stringify(y[1]), '减少动画：滚动不再改变画面', JSON.stringify(y));
  await p.context().close();
}

/* 7. 手机：390 / 360 宽无横向滚动，每幕内容在视口内 */
for (const [w, h] of [
  [390, 844],
  [360, 640],
  [844, 390],
]) {
  const p = await open({ w, h });
  const bad = [];
  for (let i = 0; i < 9; i++) {
    await at(p, i, 0.95);
    await settle(p);
    const r = await p.evaluate(() => {
      const sw = document.documentElement.scrollWidth;
      const over = [...document.querySelectorAll('.sc-copy, .art, .s0-copy, .eras, .nums')].filter(e => {
        const b = e.getBoundingClientRect();
        return b.width && (b.right > innerWidth + 1 || b.left < -1);
      }).length;
      return { sw, iw: innerWidth, over };
    });
    if (r.sw > r.iw || r.over) bad.push(i + ':' + JSON.stringify(r));
  }
  ok(!bad.length, `${w}×${h}：每幕无横向滚动，文字和画面不超出屏幕`, bad.join(' ; '));
  if (h >= 600 && w < 500) {
    const fit = [];
    for (let i = 1; i < 8; i++) {
      await at(p, i, 0.95);
      await settle(p);
      const f = await p.evaluate(() => {
        const st = [...document.querySelectorAll('.sc-stage')].find(s => s.getBoundingClientRect().top < 70 && s.getBoundingClientRect().bottom > 100);
        const c = st?.querySelector('.sc-copy')?.getBoundingClientRect();
        const a = st?.querySelector('.art')?.getBoundingClientRect();
        const b = st?.getBoundingClientRect();
        return b && c && a ? { top: Math.round(c.top - b.top), bottom: Math.round(b.bottom - Math.max(c.bottom, a.bottom)) } : null;
      });
      if (!f || f.top < 0 || f.bottom < 0) fit.push(i + ':' + JSON.stringify(f));
    }
    ok(!fit.length, `${w}×${h}：每幕的文字和画面都完整落在舞台里（没有被裁掉）`, fit.join(' ; '));
  }
  await p.context().close();
}

/* 8. 键盘：Tab 从头到尾，每个获得焦点的元素都看得见、且在视口里 */
{
  const p = await open();
  const seen = [];
  const bad = [];
  for (let n = 0; n < 40; n++) {
    await p.keyboard.press(process.env.BROWSER === 'webkit' ? 'Alt+Tab' : 'Tab'); // Safari/WebKit 默认 Tab 不停在链接上，要 Option+Tab
    await p.waitForTimeout(120);
    const f = await p.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return null;
      let o = 1;
      for (let x = e; x; x = x.parentElement) o *= +getComputedStyle(x).opacity;
      const r = e.getBoundingClientRect();
      return {
        t: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 16),
        o: +o.toFixed(2),
        inView: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
        story: !!e.closest('.story'),
        href: e.getAttribute('href'),
      };
    });
    if (!f) continue;
    if (f.story) {
      seen.push(f.t);
      if (f.o < 0.99 || !f.inView) bad.push(JSON.stringify(f));
    }
  }
  ok(seen.length >= 14 && !bad.length, 'Tab 走完首页：每个获得焦点的链接、按钮都不透明且在视口里', `${seen.length} 个；` + bad.join(' ; '));
  await p.context().close();
}

/* 9. 首屏不跳动、性能：CLS、长任务、帧间隔（桌面和 4 倍 CPU 降速） */
{
  const results = [];
  for (const cpu of process.env.BROWSER ? [1] : [1, 4]) {
    // CPU 降速只有 Chromium 的 CDP 能做
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p = await ctx.newPage();
    if (cpu > 1) await (await ctx.newCDPSession(p)).send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await p.addInitScript(() => {
      window.__m = { cls: 0, long: [], max: 0 };
      new PerformanceObserver(l => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(l => {
        for (const e of l.getEntries()) window.__m.long.push(Math.round(e.duration));
      }).observe({ type: 'longtask', buffered: true });
    });
    await p.goto(site);
    await p.waitForSelector('.story[data-mode]');
    await p.waitForTimeout(1500);
    const cls0 = await p.evaluate(() => window.__m.cls);
    // 以恒定速度（每帧 24px）滚完全页，采集帧间隔
    const total = await p.evaluate(
      () =>
        new Promise(res => {
          const m = window.__m;
          m.long = [];
          const frames = [];
          let last = performance.now();
          const max = document.documentElement.scrollHeight - innerHeight;
          const step = () => {
            const now = performance.now();
            frames.push(now - last);
            last = now;
            if (scrollY < max - 1) {
              scrollBy(0, 24);
              requestAnimationFrame(step);
            } else res({ frames, max });
          };
          requestAnimationFrame(step);
        }),
    );
    const m = await p.evaluate(() => window.__m);
    const fr = total.frames.slice(2).sort((a, b) => a - b);
    const p95 = fr[Math.floor(fr.length * 0.95)];
    results.push({
      cpu,
      cls: +(cls0 + 0).toFixed(4),
      clsAfterScroll: +m.cls.toFixed(4),
      long: m.long,
      maxLong: Math.max(0, ...m.long),
      frames: fr.length,
      p50: +fr[Math.floor(fr.length / 2)].toFixed(1),
      p95: +p95.toFixed(1),
      worst: +fr[fr.length - 1].toFixed(1),
      over50: fr.filter(x => x > 50).length,
    });
    await ctx.close();
  }
  console.log('性能：' + JSON.stringify(results));
  ok(
    results.every(r => r.cls < 0.01 && r.clsAfterScroll < 0.01),
    '首屏不跳动：CLS < 0.01',
    JSON.stringify(results.map(r => [r.cls, r.clsAfterScroll])),
  );
  ok(
    results.every(r => r.maxLong <= 50),
    '滚动全程没有超过 50ms 的长任务（桌面、4 倍降速）',
    JSON.stringify(results.map(r => r.long)),
  );
}

/* 10. 体积：首页自己的 chunk 和主包 */
{
  // 首页自己的 chunk：首页路由的 chunk（markup，里面有“scene-0”）和 story 引擎的 chunk（里面有“data-mode”）
  const dir = path.join(ROOT, 'doc_build/static/js/async');
  const files = fs.readdirSync(dir).filter(f => {
    if (/^lesson-/.test(f)) return false;
    const t = fs.readFileSync(path.join(dir, f), 'utf8');
    return t.includes('scene-0') || t.includes('story-dyn');
  });
  const zlib = await import('node:zlib');
  const sizes = files.map(f => {
    const buf = fs.readFileSync(path.join(ROOT, 'doc_build/static/js/async', f));
    return [f, buf.length, zlib.gzipSync(buf).length];
  });
  console.log('首页 chunk：' + JSON.stringify(sizes));
  ok(sizes.length >= 2 && sizes.reduce((n, s) => n + s[2], 0) <= 25 * 1024, '首页自己的 chunk（路由 + 动画引擎，gzip 合计）≤ 25 KB', JSON.stringify(sizes));
  const main = fs.readdirSync(path.join(ROOT, 'doc_build/static/js')).find(f => /^index\..*\.js$/.test(f));
  const mainSize = fs.statSync(path.join(ROOT, 'doc_build/static/js', main)).size;
  console.log('主包：' + mainSize);
  ok(mainSize <= 215000, '主包不超过 215,000 字节', String(mainSize));
}

/* 截图（HOME_SHOTS=1）：桌面浅色/深色每幕各一张（第 1–3 幕各取中间进度一张）、390 手机每幕一张、减少动画整页一张 */
if (process.env.HOME_SHOTS) {
  const out = path.join(ROOT, 'tests/screenshots');
  const plan = [
    [0, 0],
    [1, 0.5],
    [2, 0.55],
    [3, 0.6],
    [4, 0.95],
    [5, 0.95],
    [6, 0.95],
    [7, 0.95],
    [8, 1],
  ];
  for (const [name, opts] of [
    ['desktop-light', { scheme: 'light' }],
    ['desktop-dark', { scheme: 'dark' }],
    ['mobile', { w: 390, h: 844 }],
  ]) {
    const p = await open(opts);
    for (const [i, t] of plan) {
      await at(p, i, t);
      await p.waitForTimeout(600);
      await p.screenshot({ path: path.join(out, `home-story-${name}-${i}.png`) });
    }
    await p.context().close();
  }
  const p = await open({ reduced: true });
  await p.screenshot({ path: path.join(out, 'home-story-reduced-full.png'), fullPage: true });
  await p.context().close();
}

await browser.close();
close();
process.exit(done() ? 1 : 0);
