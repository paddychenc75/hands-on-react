// 首页短片（10 幕：开场、手动改 DOM、声明式、协调、Fiber、Hooks、并发、服务端、编译器、收束）的浏览器测试：
//   静态 HTML 里有全部文案；没有 JS 时是静态长文；首次进入约 1.2 秒后自动播放、整片 45–60 秒、停在收束幕；
//   用户接管（滚轮、触摸、键盘、拖滚动条）立刻暂停且不抢滚动、不 preventDefault；播放控制条的各项功能；
//   有进度 / 同会话已播 / 带锚点 / 后台标签页 / 减少动画时不自动播放；自动播放与手动滚到同一位置画面一致；
//   手机 390 / 360 / 横屏无横向滚动、文字不被控制条遮挡；Tab 走完；CLS、长任务、帧间隔；体积。
// 用法：npm run build && node tests/e2e/home.mjs
//   HOME_SHOTS=1 node tests/e2e/home.mjs   重拍 tests/screenshots/home-story-*.png
//   BROWSER=webkit  换引擎
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch, openSite, lessonData, checker, KEY, ROOT } from './_site.mjs';

const { ok, done } = checker();
const { site, close } = await openSite();
const browser = await launch();
const DAY = 864e5;
const { LESSONS } = await import(pathToFileURL(path.join(ROOT, 'course/registry.ts')).href);
const { TOTAL, MARKS } = await import(pathToFileURL(path.join(ROOT, 'course/engine/logic/filmData.ts')).href);
const errs = [];
const CHUNK = /\/static\/js\/async\/lesson-([\w-]+)\.[0-9a-f]+\.js/;

/** 打开首页。seen：把“本会话已播过”记下，免得自动播放；speed：测试倍速 */
async function open({ w = 1280, h = 800, scheme = 'light', reduced = false, seed, js = true, seen = true, speed = 1, hash = '', cpu = 1, perf = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    colorScheme: scheme,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    javaScriptEnabled: js,
  });
  const p = await ctx.newPage();
  p.ctx = ctx;
  p.reqs = [];
  p.on('request', r => p.reqs.push(r.url()));
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => {
    if ((m.type() === 'error' || m.type() === 'warning') && !/Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200));
  });
  if (cpu > 1) await (await ctx.newCDPSession(p)).send('Emulation.setCPUThrottlingRate', { rate: cpu });
  if (js) {
    await p.addInitScript(
      ([k, s, sn, sp, pf]) => {
        if (s && !sessionStorage.getItem('seeded')) {
          localStorage.setItem(k, JSON.stringify(s));
          sessionStorage.setItem('seeded', '1');
        }
        if (sn) sessionStorage.setItem('hoc-story-played', '1');
        if (sp !== 1) window.__storySpeed = sp;
        window.__storyTest = true;
        window.__ctxs = [];
        if (window.AudioContext) {
          const AC = window.AudioContext;
          window.AudioContext = class extends AC {
            constructor(...a) {
              super(...a);
              window.__ctxs.push(this);
            }
          };
        }
        window.__prevented = [];
        const add = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function (t, f, o) {
          if (/^(wheel|touchmove|touchstart)$/.test(t) && typeof f === 'function') {
            const g = function (e) {
              const r = f.call(this, e);
              if (e.defaultPrevented) window.__prevented.push(t);
              return r;
            };
            return add.call(this, t, g, o);
          }
          return add.call(this, t, f, o);
        };
        if (pf) {
          window.__m = { cls: 0, long: [], frames: [] };
          new PerformanceObserver(l => {
            for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value;
          }).observe({ type: 'layout-shift', buffered: true });
          new PerformanceObserver(l => {
            for (const e of l.getEntries()) window.__m.long.push(Math.round(e.duration));
          }).observe({ type: 'longtask', buffered: true });
        }
      },
      [KEY, seed, seen, speed, perf],
    );
  }
  await p.goto(site + (hash ? '#' + hash : ''));
  await p.waitForSelector('.story');
  if (js) await p.waitForSelector('.story.ready', { timeout: 20000 });
  await p.waitForTimeout(300);
  return p;
}
const titles = [
  '数据变了，界面靠人去同步',
  '界面是 state 的函数',
  '协调：只提交差别',
  'Fiber：渲染可以被切成小片',
  'Hooks：状态进了函数',
  '紧急的更新先做',
  '一部分渲染搬到服务器',
  '记忆化交给编译器',
  '每一代，都在解决上一代留下的问题',
];
const y2f = p => p.evaluate(t => (scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)) * t, TOTAL);
/** 滚到影片时间 f 秒（手动滚动） */
const atF = (p, f) =>
  p.evaluate(
    ([f, t]) => {
      const max = document.documentElement.scrollHeight - innerHeight;
      window.scrollTo({ top: (f / t) * max, behavior: 'instant' });
    },
    [f, TOTAL],
  );
const settle = p => p.waitForTimeout(250);
const state = p =>
  p.evaluate(() => ({
    playing: document.querySelector('.player .play')?.getAttribute('aria-pressed') === 'true',
    y: scrollY,
    active: +document.querySelector('.story').dataset.active,
    ended: document.querySelector('.story').classList.contains('ended'),
    now: document.querySelector('.scrub')?.getAttribute('aria-valuenow'),
  }));
const look = (p, sel) =>
  p.evaluate(s => {
    const e = document.querySelector(s);
    const cs = getComputedStyle(e);
    return { o: +(+cs.opacity).toFixed(3), tf: cs.transform };
  }, sel);

/* 1. 静态 HTML：全部文案都在，没有购物车 */
{
  const html = fs.readFileSync(path.join(ROOT, 'doc_build/index.html'), 'utf8');
  const text = html.replace(/<!--.*?-->/g, '').replace(/<[^>]+>/g, '');
  const h1 = (html.match(/<h1[^>]*>(.*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, '').replace(/ /g, ' ');
  const h2s = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map(m => m[1].replace(/<[^>]+>/g, ''));
  ok(h1 === '动手学 React' && h2s.length === 9, '静态 HTML：开场一个 h1，其余 9 幕各一个 h2', JSON.stringify([h1, h2s]));
  ok(
    titles.every((t, i) => h2s[i] === t),
    '静态 HTML：9 个 h2 的标题与脚本一致',
    JSON.stringify(h2s),
  );
  const copy = [
    '漏掉一块，界面就和数据对不上',
    '这一步不碰 DOM',
    '常说的虚拟 DOM',
    'Fiber 重写了内部架构',
    'Hooks 让函数组件也能有 state',
    '被打断的过渡更新丢弃后，从头重来',
    'Server Components 与 Actions 在 React 19 稳定',
    '自动加上相当于 memo、useMemo、useCallback 的记忆化',
    '先预测，再运行',
  ];
  ok(
    copy.every(c => text.includes(c)),
    '静态 HTML：每幕的说明文字都在',
    copy.filter(c => !text.includes(c)).join('|'),
  );
  ok(!/购物车|结算/.test(text), '静态 HTML：没有购物车之类的业务界面');
  ok(/href="[^"]*\/roadmap/.test(html), '静态 HTML：有到课程地图的链接');
  ok((html.match(/id="scene-\d"/g) || []).length === 10 && html.includes('aria-label="首页分幕"'), '静态 HTML：10 幕和幕进度指示');
  ok(/class="world" aria-hidden="true"/.test(html) && /story-dyn/.test(html), '静态 HTML：三层空间画面对读屏隐藏（说明文字是等价的）；<head> 里有动态布局开关');
  ok(
    ['你的组件', 'React 的树', 'DOM'].every(t => text.includes(t)),
    '静态 HTML：三层空间的名字',
  );
}

/* 2. 没有 JS：静态长文 + 一张结论帧；文案和按钮都可用 */
{
  const p = await open({ js: false });
  const r = await p.evaluate(() => ({
    h2: [...document.querySelectorAll('.sc h2')].map(h => h.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })),
    btn: [...document.querySelectorAll('.story a.btn')].map(a => [a.textContent.trim(), a.checkVisibility({ checkOpacity: true }), a.getAttribute('href')]),
    world: getComputedStyle(document.querySelector('.world')).position,
    copy: getComputedStyle(document.querySelector('.s3 .sc-copy')).position,
    film: document.querySelector('.btn.film').checkVisibility(),
    player: !!document.querySelector('.player'),
    sw: document.documentElement.scrollWidth <= innerWidth,
  }));
  ok(r.h2.length === 9 && r.h2.every(Boolean), '没有 JS：9 个 h2 都可见');
  ok(
    r.btn.length >= 2 && r.btn.every(b => b[1]) && r.btn.some(b => /从第 1 课开始/.test(b[0])),
    '没有 JS：按钮可见，开场有“从第 1 课开始”',
    JSON.stringify(r.btn),
  );
  ok(
    r.world === 'relative' && r.copy === 'static' && !r.film && !r.player && r.sw,
    '没有 JS：是静态长文（画面在文档流里、文字不固定、没有播放器、无横向滚动）',
    JSON.stringify(r),
  );
  await p.ctx.close();
}

/* 3. 自动播放：首次进入约 1.2 秒后开始，整片 45–60 秒（真实速度），停在收束幕；播放期间开场按钮可点；帧间隔和长任务 */
const perfRuns = [];
// 开着声音自动播放，和不开声音对比：调度不能拖慢画面
for (const [cpu, withSound] of process.env.BROWSER
  ? [[1, false]]
  : [
      [1, false],
      [4, false],
      [1, true],
      [4, true],
    ]) {
  const p = await open({ seen: false, perf: true, cpu });
  const t0 = Date.now();
  await p.waitForFunction(() => document.querySelector('.player .play')?.getAttribute('aria-pressed') === 'true', null, { timeout: 5000 });
  const startAfter = Date.now() - t0;
  if (cpu === 1 && !withSound) ok(startAfter >= 600 && startAfter <= 2300, `首次进入：约 1.2 秒后自动开始（实测 ${startAfter} ms）`);
  if (withSound) {
    await p.click('.snd');
    await p.waitForTimeout(500);
  }
  // 播放期间：开场按钮可点（点“查看课程地图”之外的链接不要离开页面：只检查它在最上层、可点击）
  if (cpu === 1 && !withSound) {
    const hit = await p.evaluate(() => {
      const a = document.querySelector('.s0 .st-actions a');
      const r = a.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { clickable: a.contains(top), op: +getComputedStyle(a.closest('.sc-copy')).opacity };
    });
    ok(hit.clickable && hit.op > 0.9, '播放期间：开场的“从第 1 课开始”按钮在最上层、可点', JSON.stringify(hit));
  }
  await p.evaluate(() => {
    window.__m.long = []; // 起步（水合、建动画）之后才开始算“播放期间”的长任务
    window.__fr = [];
    let last = performance.now();
    const f = now => {
      window.__fr.push(now - last);
      last = now;
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  const t1 = Date.now();
  await p.waitForFunction(() => document.querySelector('.story').classList.contains('ended'), null, { timeout: 90000 });
  const dur = (Date.now() - t1) / 1000 + startAfter / 1000;
  const m = await p.evaluate(() => ({ cls: window.__m.cls, long: window.__m.long, fr: window.__fr.slice(5) }));
  const sorted = [...m.fr].sort((a, b) => a - b);
  const q = x => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * x))];
  perfRuns.push({
    cpu,
    sound: withSound,
    seconds: +dur.toFixed(1),
    cls: +m.cls.toFixed(4),
    long: m.long,
    maxLong: Math.max(0, ...m.long),
    p50: +q(0.5).toFixed(1),
    p95: +q(0.95).toFixed(1),
    worst: +sorted[sorted.length - 1].toFixed(1),
    over50: sorted.filter(x => x > 50).length,
    frames: sorted.length,
  });
  const end = await state(p);
  const maxY = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  if (withSound)
    ok(
      (await p.evaluate(() => window.__storyHook.audio())).state === 'running',
      `开着声音自动播放全程（${cpu === 1 ? '桌面' : '4 倍降速'}）：AudioContext 在运行`,
    );
  if (cpu === 1 && !withSound) {
    ok(dur >= 45 && dur <= 60, `整片真实速度放完用时 ${dur.toFixed(1)} 秒，在 45–60 秒内`, String(dur));
    ok(end.ended && !end.playing && end.active === 9 && Math.abs(end.y - maxY) < 3, '播放完：停在收束幕（页面底部），不循环', JSON.stringify(end));
    await p.waitForTimeout(1500);
    ok((await state(p)).y === end.y, '播放完：不循环，停住不动');
    const ring = await p.evaluate(() => getComputedStyle(document.querySelector('.s9 .fin-actions .btn.big'), '::after').animationName);
    ok(ring !== 'none', '播放完：收束幕的主按钮有视觉强调（光环）', ring);
  }
  await p.ctx.close();
}
console.log('性能：' + JSON.stringify(perfRuns));
ok(
  perfRuns.every(r => r.cls < 0.01),
  '自动播放全程 CLS < 0.01',
  JSON.stringify(perfRuns.map(r => r.cls)),
);
ok(
  perfRuns.every(r => r.maxLong <= 50),
  '自动播放全程没有超过 50ms 的长任务（桌面、4 倍降速）',
  JSON.stringify(perfRuns.map(r => r.long)),
);
ok(
  perfRuns.every(r => r.p95 <= 21),
  '自动播放帧间隔 p95 ≤ 20ms 左右（桌面、4 倍降速）',
  JSON.stringify(perfRuns.map(r => [r.cpu, r.sound, r.p50, r.p95, r.worst])),
);

/* 4. 用户接管：滚轮、触摸、键盘、拖滚动条立刻暂停，不抢滚动，不 preventDefault */
for (const how of ['wheel', 'touch', 'key-space', 'key-pagedown', 'scrollbar']) {
  const p = await open({ seen: false });
  await p.waitForFunction(() => document.querySelector('.player .play')?.getAttribute('aria-pressed') === 'true');
  await p.waitForTimeout(2500);
  const before = await state(p);
  await p.mouse.move(500, 400);
  if (how === 'wheel') await p.mouse.wheel(0, 240);
  else if (how === 'touch') await p.evaluate(() => window.dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true })));
  else if (how === 'key-space') await p.keyboard.press('Space');
  else if (how === 'key-pagedown') await p.keyboard.press('PageDown');
  else await p.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), before.y + 900); // 拖滚动条：滚动位置被别人改了
  await p.waitForTimeout(how.startsWith('key') ? 900 : 150); // 键盘翻页是浏览器自己的平滑滚动，让它先走完
  const a = await state(p);
  await p.waitForTimeout(900);
  const b = await state(p);
  ok(!a.playing && !b.playing, `用户接管（${how}）：立刻暂停`, JSON.stringify([a, b]));
  // WebKit 自己的平滑滚动动画在暂停之后还会继续一小段（那是浏览器在响应用户的输入，不是自动播放），所以放宽
  const tol = process.env.BROWSER === 'webkit' ? 80 : 4;
  ok(how === 'touch' ? Math.abs(b.y - a.y) < 2 : Math.abs(b.y - a.y) < tol, `用户接管（${how}）：之后页面不再被自动播放抢着滚动`, JSON.stringify([a.y, b.y]));
  if (how === 'wheel' && process.env.BROWSER !== 'webkit') ok(b.y >= before.y + 200, '用户接管（滚轮）：用户的滚动量保留', JSON.stringify([before.y, b.y]));
  if (how === 'wheel') {
    const pv = await p.evaluate(() => {
      const out = [];
      for (const type of ['wheel', 'touchmove']) {
        const e = new Event(type, { cancelable: true, bubbles: true });
        document.body.dispatchEvent(e);
        out.push(e.defaultPrevented);
      }
      return { synthetic: out, recorded: window.__prevented };
    });
    ok(!pv.synthetic.some(Boolean) && pv.recorded.length === 0, '不劫持滚动：wheel、touchmove、touchstart 没有被 preventDefault', JSON.stringify(pv));
    // 暂停后手动擦洗：和自动播放用同一套画面
    ok((await y2f(p)) > 0, '用户接管后：影片时间跟着滚动位置走');
  }
  await p.ctx.close();
}

/* 5. 控制条：播放、暂停、重播、上一幕、下一幕、拖动进度条、跳过；键盘只在播放器获得焦点时生效 */
{
  const p = await open({ seen: true });
  const label = () => p.getAttribute('.player .play', 'aria-label');
  ok(
    (await p.getAttribute('.player', 'role')) === 'group' &&
      (await p.getAttribute('.scrub', 'role')) === 'slider' &&
      (await p.getAttribute('.scrub', 'aria-label')) === '播放进度',
    '控制条：role 和 aria-label 正确',
  );
  ok((await state(p)).playing === false && /播放/.test(await label()), '控制条：不自动播放时是“播放短片”，aria-pressed=false');
  await p.click('.player .play');
  await p.waitForTimeout(700);
  ok(
    (await state(p)).playing && (await p.getAttribute('.player .play', 'aria-pressed')) === 'true' && /暂停/.test(await label()),
    '控制条：点播放开始，aria-pressed=true',
  );
  await p.click('.player .play');
  const s1 = await state(p);
  await p.waitForTimeout(500);
  ok(!s1.playing && (await state(p)).y === s1.y, '控制条：点暂停就停住');
  await p.click('.player .next');
  await p.waitForTimeout(1000);
  const sn = await state(p);
  ok(sn.active === 1 && !sn.playing, '控制条：下一幕（暂停时只跳不播）', JSON.stringify(sn));
  await p.click('.player .next');
  await p.waitForTimeout(1000);
  await p.click('.player .prev');
  await p.waitForTimeout(1000);
  ok((await state(p)).active === 1, '控制条：上一幕', JSON.stringify(await state(p)));
  // 进度条点击：跳到那个位置，暂停
  const box = await p.locator('.scrub').boundingBox();
  await p.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);
  await p.waitForTimeout(300);
  const mid = await state(p);
  ok(Math.abs(+mid.now - 50) <= 3 && !mid.playing, '控制条：点进度条的中间，影片跳到约 50%', JSON.stringify(mid));
  await p.mouse.move(box.x + box.width * 0.82, box.y + box.height / 2);
  ok(/2024|服务端/.test(await p.textContent('.scrub .tip')), '控制条：悬停显示幕名', await p.textContent('.scrub .tip'));
  // 拖动
  await p.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, { steps: 6 });
  await p.mouse.up();
  await p.waitForTimeout(200);
  const dr = await state(p);
  ok(Math.abs(+dr.now - 70) <= 4, '控制条：拖动进度条', JSON.stringify(dr));
  // 播放器上的键盘：空格切换播放（只在播放器获得焦点时），左右方向键切幕
  await p.focus('.scrub');
  const a0 = (await state(p)).active;
  await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(900);
  const a1 = (await state(p)).active;
  await p.keyboard.press('ArrowLeft');
  await p.waitForTimeout(900);
  ok(a1 === a0 + 1 && (await state(p)).active === a0, '控制条键盘：焦点在播放器时，方向键切幕', JSON.stringify([a0, a1]));
  await p.keyboard.press('Space');
  await p.waitForTimeout(400);
  ok((await state(p)).playing, '控制条键盘：焦点在进度条时，空格播放');
  await p.keyboard.press('Space');
  ok(!(await state(p)).playing, '控制条键盘：再按空格暂停');
  // 全局空格不被劫持：焦点在页面上时，空格不会切换播放，也不会被 preventDefault
  await p.evaluate(() => {
    document.activeElement?.blur();
    window.__sp = null;
    addEventListener('keydown', e => setTimeout(() => (window.__sp = e.defaultPrevented), 0));
  });
  const yBefore = (await state(p)).y;
  await p.keyboard.press('Space');
  await p.waitForTimeout(500);
  const gl = await state(p);
  ok(
    !gl.playing && (await p.evaluate(() => window.__sp)) === false && gl.y > yBefore,
    '不劫持键盘：焦点不在播放器时，空格照常翻页，没有被 preventDefault',
    JSON.stringify([yBefore, gl.y]),
  );
  // 重播
  await p.click('.player .replay');
  await p.waitForTimeout(800);
  const rp = await state(p);
  ok(rp.playing && rp.y < 400, '控制条：重播从头开始', JSON.stringify(rp));
  await p.click('.player .play');
  // 跳过
  await p.click('.player .skip');
  await p.waitForTimeout(1200);
  const sk = await state(p);
  ok(sk.active === 9 && !sk.playing, '控制条：“跳过，开始学习”直接到收束幕', JSON.stringify(sk));
  // 手动把页面滚到任意位置再点播放：从当前位置继续
  await atF(p, 20);
  await settle(p);
  await p.click('.player .play');
  await p.waitForTimeout(900);
  const cont = await y2f(p);
  ok(cont > 20 && cont < 22.5, '手动滚到 20 秒处再点播放：从当前位置继续', String(cont));
  await p.click('.player .play');
  // 幕进度圆点与控制条同步
  const dot = await p.evaluate(() => document.querySelector('.rail a[aria-current]')?.dataset.scene);
  ok(+dot === (await state(p)).active, '幕进度圆点与播放器的当前幕同步', `${dot} vs ${(await state(p)).active}`);
  await p.click('.rail a[data-scene="6"]');
  await p.waitForTimeout(1000);
  ok((await state(p)).active === 6, '幕进度圆点：点击跳到对应的幕');
  const labels = await p.$$eval('.rail a', as => as.map(a => a.getAttribute('aria-label')));
  ok(labels.length === 10 && labels.every(l => /^第 \d 幕：/.test(l)), '幕进度圆点：10 个都有 aria-label', JSON.stringify(labels));
  // 换幕时礼貌播报，不连续播报
  const live = await p.evaluate(() => [
    document.querySelector('.live-region')?.getAttribute('aria-live'),
    document.querySelector('.scrub')?.getAttribute('aria-valuetext'),
  ]);
  ok(live[0] === 'polite' && /^第 \d 幕/.test(live[1]), '无障碍：换幕只在 polite 区播报，进度条有 aria-valuetext', JSON.stringify(live));
  ok(errs.length === 0, '首页没有控制台错误、警告和水合不一致', errs.join(' | '));
  const chunks = [...new Set(p.reqs.map(u => CHUNK.exec(u)?.[1]).filter(Boolean))];
  ok(chunks.length === 0, '首页不加载任何一课的数据 chunk', chunks.join(','));
  await p.ctx.close();
}

/* 6. 什么时候不自动播放：有学习进度、同会话已播、带锚点、减少动画、后台标签页 */
{
  const W = await lessonData('what-is-react');
  const seed = {
    'what-is-react': {
      quiz: Object.fromEntries(W.quiz.map((q, i) => [i, q.answer])),
      tried: Object.fromEntries(W.quiz.map((_q, i) => [i, true])),
      first: Object.fromEntries(W.quiz.map((_q, i) => [i, true])),
      ex: !!W.exercise,
      done: true,
    },
    __srs: { 'what-is-react#0': { box: 1, n: 1, due: Date.now() - 1000, last: Date.now() - 2 * DAY } },
  };
  const cases = [
    ['有学习进度的回访者', { seen: false, seed }],
    ['同一会话已经播放过', { seen: true }],
    ['带 hash 锚点进入', { seen: false, hash: 'scene-3' }],
  ];
  for (const [name, opts] of cases) {
    const p = await open(opts);
    await p.waitForTimeout(2600);
    const s = await state(p);
    const film = await p.evaluate(() => {
      const b = document.querySelector('.btn.film');
      return b && b.checkVisibility();
    });
    ok(!s.playing && film, `${name}：不自动播放，显示“▶ 播放 N 秒短片”按钮`, JSON.stringify([s, film]));
    if (opts.hash) ok(s.active === 3, '带 hash 进入：停在对应的幕', JSON.stringify(s));
    if (opts.seed) {
      const r = await p.evaluate(() => [...document.querySelectorAll('.s0 .st-actions a')].map(a => [a.textContent.trim(), a.getAttribute('href')]));
      ok(
        /^继续学习：/.test(r[0][0]) && r[0][1].includes('/lessons/' + LESSONS[1].id) && /今日复习 1 题/.test(r[1]?.[0]),
        '有进度和到期卡片：“继续学习：下一课”和“今日复习 1 题”',
        JSON.stringify(r),
      );
      const last = await p.evaluate(() => [...document.querySelectorAll('.s9 .fin-actions a')].map(a => a.textContent.trim()));
      ok(
        /^继续学习：/.test(last[0]) && last[1] === '查看课程地图' && /^今日复习 1 题/.test(last[2]),
        '有进度和到期复习：收束幕是“继续学习：下一课”、“查看课程地图”、“今日复习 1 题”',
        JSON.stringify(last),
      );
    } else {
      const r = await p.evaluate(() => [...document.querySelectorAll('.s0 .st-actions a')].map(a => a.textContent.trim()));
      ok(r.length === 1 && /从第 1 课开始/.test(r[0]), `${name}：没有进度时开场只有“从第 1 课开始”，没有“今日复习”`, JSON.stringify(r));
      const last = await p.evaluate(() => [...document.querySelectorAll('.s9 .fin-actions a')].map(a => a.textContent.trim()));
      ok(
        last.length === 2 && /^开始学习/.test(last[0]) && last[1] === '查看课程地图',
        `${name}：没有进度时收束幕是“开始学习”和“查看课程地图”，没有复习入口`,
        JSON.stringify(last),
      );
    }
    if (name === '同一会话已经播放过') {
      await p.click('.btn.film');
      await p.waitForTimeout(800);
      ok((await state(p)).playing, '点“▶ 播放 N 秒短片”按钮：开始播放');
      // 标签页转到后台：暂停，回来不自动续播，按钮是“继续播放”
      await p.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await p.waitForTimeout(400);
      const hid = await state(p);
      await p.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await p.waitForTimeout(1200);
      const back = await state(p);
      ok(
        !hid.playing && !back.playing && back.y === hid.y && /继续播放/.test(await p.getAttribute('.player .play', 'aria-label')),
        '后台标签页：暂停；回到前台不自动续播，按钮是“继续播放”',
        JSON.stringify([hid, back]),
      );
    }
    await p.ctx.close();
  }
  const r = await open({ reduced: true, seen: false });
  await r.waitForTimeout(2600);
  const info = await r.evaluate(() => ({
    player: !!document.querySelector('.player') && getComputedStyle(document.querySelector('.player')).display !== 'none',
    film: document.querySelector('.btn.film')?.checkVisibility(),
    y: scrollY,
    anims: document.getAnimations().length,
    stage: getComputedStyle(document.querySelector('.world')).position,
    copy: [...document.querySelectorAll('.sc-copy')].every(c => +getComputedStyle(c).opacity === 1 && getComputedStyle(c).position !== 'fixed'),
    dots: document.querySelectorAll('.rail a').length,
    sw: document.documentElement.scrollWidth <= innerWidth,
    h2: [...document.querySelectorAll('.sc h2')].every(h => h.checkVisibility({ checkOpacity: true })),
  }));
  ok(!info.player && !info.film && info.y === 0 && info.anims === 0, '减少动画：没有播放器、没有自动播放、没有任何动画在跑', JSON.stringify(info));
  ok(
    info.stage === 'relative' && info.copy && info.h2 && info.sw && info.dots === 10,
    '减少动画：静态长文，每幕文字都是最终状态，幕进度指示保留',
    JSON.stringify(info),
  );
  await r.ctx.close();
}

/* 7. 手动擦洗：往回滚倒放；自动播放暂停在某处与手动滚到同一位置，画面一致 */
{
  const p = await open({ seen: true });
  const probe = ['[data-w="n-Item2"]', '[data-w="nl-TodoList"]', '[data-w="bo-Box2"]', '[data-w="cam"]', '[data-w="year"]'];
  const snap = async pg => {
    const out = [];
    for (const s of probe) out.push(await look(pg, s));
    return out;
  };
  await atF(p, 14);
  await settle(p);
  const v1 = await snap(p);
  await atF(p, 19.5);
  await settle(p);
  const v2 = await snap(p);
  await atF(p, 14);
  await settle(p);
  const v3 = await snap(p);
  ok(
    JSON.stringify(v1) !== JSON.stringify(v2) && JSON.stringify(v1) === JSON.stringify(v3),
    '手动擦洗：画面随滚动变化，往回滚会倒放（两个时间点比较关键元素的 transform / opacity）',
    JSON.stringify([v1, v2]),
  );
  ok((await look(p, '[data-w="cp-2"]')).o === 1 && (await look(p, '[data-w="cp-5"]')).o === 0, '手动擦洗：当前幕的文字不透明，别的幕的文字退场');
  await p.ctx.close();
  // 自动播放（倍速）在中途暂停，读下画面；再在另一页手动滚到同一位置，比较
  const a = await open({ seen: false, speed: 6 });
  await a.waitForFunction(() => document.querySelector('.player .play')?.getAttribute('aria-pressed') === 'true');
  await a.waitForFunction(() => scrollY > 0.37 * (document.documentElement.scrollHeight - innerHeight));
  await a.click('.player .play');
  await a.waitForTimeout(300);
  const yA = (await state(a)).y;
  const snapA = await snap(a);
  const b = await open({ seen: true });
  await b.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), yA);
  await settle(b);
  const snapB = await snap(b);
  ok(JSON.stringify(snapA) === JSON.stringify(snapB), '自动播放与手动滚到同一位置：关键元素的 transform / opacity 一致', JSON.stringify([snapA, snapB]));
  await a.ctx.close();
  await b.ctx.close();
}

/* 8. 手机和横屏：无横向滚动，每幕的文字完整、不被播放器遮挡 */
for (const [w, h] of [
  [390, 844],
  [360, 640],
  [844, 390],
]) {
  const p = await open({ w, h });
  const bad = [];
  for (let i = 0; i < 10; i++) {
    await atF(p, i === 0 ? 1.5 : i === 9 ? TOTAL : MARKS[i] + 2.5);
    await p.waitForTimeout(500);
    const r = await p.evaluate(i => {
      const sc = document.querySelectorAll('.sc')[i];
      const c = sc.querySelector('.sc-copy');
      const b = c.getBoundingClientRect();
      const pl = document.querySelector('.player').getBoundingClientRect();
      const last = c.querySelector('.hook, .foot, .desc, .scroll-hint, .st-links:last-child') || c;
      const lb = (i === 9 ? c.querySelector('.foot') : i === 0 ? c.querySelector('.st-links') : c.querySelector('.desc')).getBoundingClientRect();
      const inner = c.scrollHeight > c.clientHeight + 1;
      return {
        sw: document.documentElement.scrollWidth,
        iw: innerWidth,
        left: b.left,
        right: b.right,
        descBottom: lb.bottom,
        playerTop: pl.top,
        op: +getComputedStyle(c).opacity,
        i,
        scrolls: inner,
        last: !!last,
      };
    }, i);
    if (r.sw > r.iw || r.left < -1 || r.right > r.iw + 1 || r.op < 0.99) bad.push(JSON.stringify(r));
    else if (!(i === 9 && r.scrolls) && r.descBottom > r.playerTop + 1 && w < 500) bad.push('被播放器遮挡 ' + JSON.stringify(r));
  }
  ok(!bad.length, `${w}×${h}：每幕无横向滚动，文字在屏幕内，不被播放器遮挡`, bad.join(' ; '));
  await p.ctx.close();
}

/* 9. 键盘：Tab 从头走，每个获得焦点的链接、按钮都看得见（不透明、在视口里） */
{
  const p = await open({ seen: true });
  const seen = [];
  const bad = [];
  for (let n = 0; n < 30; n++) {
    await p.keyboard.press(process.env.BROWSER === 'webkit' ? 'Alt+Tab' : 'Tab');
    await p.waitForTimeout(80);
    const f = await p.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body || !e.closest('.story')) return null;
      let o = 1;
      for (let x = e; x; x = x.parentElement) o *= +getComputedStyle(x).opacity;
      const r = e.getBoundingClientRect();
      return {
        t: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 16),
        o: +o.toFixed(2),
        vis: e.checkVisibility({ checkVisibilityCSS: true }),
        inView: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
      };
    });
    if (!f) continue;
    seen.push(f.t);
    if (f.o < 0.99 || !f.inView || !f.vis) bad.push(JSON.stringify(f));
  }
  ok(seen.length >= 14 && !bad.length, 'Tab 走完首页：每个获得焦点的链接、按钮都不透明、可见、在视口里', `${seen.length} 个；` + bad.join(' ; '));
  await p.ctx.close();
}

/* 10. 离开页面（客户端路由）：停止自动播放，清理动画 */
{
  const p = await open({ seen: false });
  await p.waitForFunction(() => document.querySelector('.player .play')?.getAttribute('aria-pressed') === 'true');
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    window.__nr = 1;
  });
  await p.click('.rp-nav-menu a[href*="glossary"], .rp-nav a[href*="glossary"]').catch(() => p.goto(site + 'glossary.html'));
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({
    anims: document.getAnimations().length,
    dyn: document.documentElement.classList.contains('story-dyn'),
    story: !!document.querySelector('.story'),
  }));
  const y1 = await p.evaluate(() => scrollY);
  await p.waitForTimeout(800);
  ok(!r.story && r.anims < 5 && (await p.evaluate(() => scrollY)) === y1, '离开首页：播放停止、动画和监听清理干净', JSON.stringify(r));
  await p.ctx.close();
}

/* 10b. 收束幕的版式：八个节点、链接、年份、统计数字、减少动画下的静态版式 */
{
  const eras = [
    ['之前', '手动改 DOM', 'what-is-react'],
    ['2013', '声明式', 'state'],
    ['2013', '协调', 'rendering'],
    ['2017', 'Fiber', 'scheduler'],
    ['2019', 'Hooks', 'custom-hooks'],
    ['2022', '并发', 'concurrent'],
    ['2024', '服务端', 'server-components'],
    ['2025', '编译器', 'performance'],
  ];
  const playN = LESSONS.reduce((n, l) => n + l.nPlays, 0);
  const exN = LESSONS.filter(l => l.hasExercise).length;
  const quizN = LESSONS.reduce((n, l) => n + l.quizAnswers.length, 0);
  for (const reduced of [false, true]) {
    const p = await open({ seen: true, reduced });
    if (!reduced) {
      await atF(p, TOTAL);
      await p.waitForTimeout(600);
    }
    const r = await p.evaluate(() => ({
      items: [...document.querySelectorAll('.s9 .eras li')].map(li => ({
        yr: li.querySelector('.yr').textContent,
        name: li.querySelector('b').textContent,
        href: li.querySelector('.era-main').getAttribute('href'),
        label: li.querySelector('.era-main').getAttribute('aria-label'),
        more: [...li.querySelectorAll('.era-more')].map(a => a.getAttribute('href')),
        op: +getComputedStyle(li).opacity,
        vis: li.querySelector('.era-main').checkVisibility({ checkOpacity: true }),
      })),
      counts: [...document.querySelectorAll('.s9 .stats3 dt')].map(d => +d.textContent),
      ol: document.querySelector('.s9 ol.eras')?.tagName,
      curve: !!document.querySelector('.s9 .tl-curve[aria-hidden="true"]'),
      draw: +getComputedStyle(document.querySelector('.s9 .tl-draw')).strokeDashoffset.replace('px', ''),
      sw: document.documentElement.scrollWidth <= innerWidth,
    }));
    const tag = reduced ? '减少动画' : '短片模式（拖到结尾）';
    ok(
      r.ol === 'OL' &&
        r.items.length === 8 &&
        r.items.every((it, i) => it.yr === eras[i][0] && it.name === eras[i][1] && it.href.endsWith('/lessons/' + eras[i][2])),
      `收束幕（${tag}）：八个时代按顺序，年份、名称、课链接正确，用有序列表`,
      JSON.stringify(r.items.map(i => [i.yr, i.name, i.href])),
    );
    ok(
      r.items.every(it => /^(之前|\d{4}) .+：.+/.test(it.label)) && r.items[6].more.length === 1 && r.items[6].more[0].endsWith('/lessons/react-19'),
      `收束幕（${tag}）：每个节点的可访问名称含年份、时代名和课名；服务端多一条 react-19`,
      JSON.stringify(r.items.map(i => i.label)),
    );
    ok(
      r.items.every(it => it.op === 1 && it.vis) && r.curve && r.sw,
      `收束幕（${tag}）：八个节点都可见、曲线装饰对读屏隐藏、无横向滚动`,
      JSON.stringify(r.items.map(i => i.op)),
    );
    ok(
      JSON.stringify(r.counts) === JSON.stringify([playN, exN, quizN]),
      `收束幕（${tag}）：三个统计数字和目录计算一致（${playN} / ${exN} / ${quizN}）`,
      JSON.stringify(r.counts),
    );
    // 键盘 Tab 顺序：先是时代节点（从左到右），再是行动区
    if (!reduced) {
      await p.evaluate(() => document.querySelector('.s9 .era-main').focus());
      const order = [];
      for (let i = 0; i < 12; i++) {
        order.push(await p.evaluate(() => document.activeElement?.getAttribute('href') || document.activeElement?.className));
        await p.keyboard.press('Tab');
      }
      const lessonsSeq = order.filter(h => /\/lessons\//.test(h)).map(h => h.split('/lessons/')[1].replace('.html', ''));
      ok(
        lessonsSeq.slice(0, 9).join() ===
          ['what-is-react', 'state', 'rendering', 'scheduler', 'custom-hooks', 'concurrent', 'server-components', 'react-19', 'performance'].join(),
        '收束幕：Tab 顺序是时代节点从左到右（服务端的两条课挨在一起），然后才是行动区',
        order.join(' | '),
      );
      // 悬停一个节点：它的一句话要点出现
      await p.hover('.s9 .era:nth-child(4) .era-main');
      await p.waitForTimeout(400);
      const tip = await p.evaluate(() => +getComputedStyle(document.querySelector('.s9 .era:nth-child(4) .tip')).opacity);
      ok(tip > 0.9, '收束幕：悬停一个节点，显示这一代的一句话要点', String(tip));
    }
    await p.ctx.close();
  }
  // 手机：纵向时间轴，无横向滚动，主按钮不被进度指示或控制条遮挡
  for (const [w, h] of [
    [390, 844],
    [360, 640],
  ]) {
    const p = await open({ w, h });
    await atF(p, TOTAL);
    await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      const b = document.querySelector('.s9 .fin-actions .btn.big').getBoundingClientRect();
      const pl = document.querySelector('.player').getBoundingClientRect();
      const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      const rail = document.querySelector('.rail').getBoundingClientRect();
      return {
        sw: document.documentElement.scrollWidth,
        iw: innerWidth,
        hit: !!top?.closest('.fin-actions'),
        above: b.bottom <= pl.top + 1,
        clearRail: b.right <= rail.left + 1 || b.bottom < rail.top || b.top > rail.bottom,
      };
    });
    ok(r.sw <= r.iw && r.hit && r.above && r.clearRail, `${w}×${h}：收束幕无横向滚动，主按钮可点、在控制条之上、不被进度指示遮挡`, JSON.stringify(r));
    await p.ctx.close();
  }
}

/* 10b2. 四种尺寸下收束幕互不遮挡：标题、八个节点、统计说明、按钮都完整可见；没有内部滚动容器；中心点命中的不是固定浮层 */
for (const [w, h] of [
  [360, 640],
  [390, 844],
  [1280, 720],
  [1280, 800],
]) {
  const p = await open({ w, h, seen: false, speed: 10 });
  await p.waitForFunction(() => document.querySelector('.story').classList.contains('ended'), null, { timeout: 30000 });
  await p.waitForTimeout(1800);
  const r = await p.evaluate(() => {
    const box = e => {
      const b = e.getBoundingClientRect();
      return { l: b.left, t: b.top, r: b.right, b: b.bottom };
    };
    const sel = ['.s9 h2', '.s9 .eras .era-main', '.s9 .eras .era-more', '.s9 .stats3 dd', '.s9 .fin-actions a', '.s9 .foot'];
    const items = sel.flatMap(s => [...document.querySelectorAll(s)].map(e => ({ s, e })));
    const boxes = items.map(i => ({ s: i.s, ...box(i.e) }));
    let overlap = 0;
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i],
          c = boxes[j];
        if (a.l < c.r - 1 && c.l < a.r - 1 && a.t < c.b - 1 && c.t < a.b - 1) overlap++;
      }
    const outside = boxes.filter(b => b.t < 0 || b.b > innerHeight + 1 || b.l < 0 || b.r > innerWidth + 1).length;
    let blocked = 0;
    for (const i of items) {
      if (!/stats3|era|fin-actions/.test(i.s)) continue;
      const b = box(i.e);
      const hit = document.elementFromPoint((b.l + b.r) / 2, (b.t + b.b) / 2);
      if (!hit || !(i.e === hit || i.e.contains(hit) || hit.contains(i.e))) blocked++;
    }
    const c = document.querySelector('.s9 .sc-copy');
    const primary = box(document.querySelector('.s9 .btn.primary'));
    return { overlap, outside, blocked, n: items.length, scroll: c.scrollHeight, client: c.clientHeight, primaryB: primary.b, ih: innerHeight };
  });
  ok(
    r.n >= 16 && r.overlap === 0 && r.outside === 0 && r.blocked === 0 && r.scroll <= r.client + 1 && r.primaryB <= r.ih,
    `${w}×${h}：收束幕各元素互不相交、都在视口内、无内部滚动、中心点未被浮层遮挡`,
    JSON.stringify(r),
  );
  await p.ctx.close();
}

/* 10c. 幕进度指示：所有圆点的圆心在一条线上（桌面竖线、手机同理），间距均匀，点击区域不小于 24×24；第一幕、中间一幕、最后一幕为当前时各量一次 */
for (const [w, h] of [
  [1280, 800],
  [390, 844],
]) {
  const p = await open({ w, h });
  for (const [label, f] of [
    ['第一幕为当前', 1],
    ['中间一幕为当前', MARKS[5] + 1],
    ['最后一幕为当前', TOTAL],
  ]) {
    await atF(p, f);
    await p.waitForTimeout(500);
    await p.hover('.story .sc-copy', { force: true }).catch(() => {});
    const r = await p.evaluate(() => {
      const dots = [...document.querySelectorAll('.rail a')].map(a => ({ d: a.querySelector('.dot').getBoundingClientRect(), a: a.getBoundingClientRect() }));
      const cx = dots.map(x => x.d.left + x.d.width / 2);
      const cy = dots.map(x => x.d.top + x.d.height / 2);
      const spread = v => Math.max(...v) - Math.min(...v);
      const vertical = spread(cy) > spread(cx);
      const main = vertical ? cy : cx;
      const gaps = main.slice(1).map((v, i) => v - main[i]);
      return {
        n: dots.length,
        crossSpread: vertical ? spread(cx) : spread(cy),
        vertical,
        gapSpread: spread(gaps),
        minHit: Math.min(...dots.map(x => Math.min(x.a.width, x.a.height))),
        cur: document.querySelector('.rail a[aria-current]')?.dataset.scene,
      };
    });
    ok(
      r.n === 10 && r.crossSpread <= 0.5 && r.gapSpread <= 0.5 && r.minHit >= 24,
      `${w}×${h} 幕进度指示（${label}）：圆心在同一条${r.vertical ? '竖' : '横'}线上（偏差 ${r.crossSpread.toFixed(2)}px ≤ 0.5）、间距均匀（${r.gapSpread.toFixed(2)}px）、点击区域 ≥ 24px`,
      JSON.stringify(r),
    );
  }
  // 悬停、聚焦：也不动
  await atF(p, 20);
  await settle(p);
  await p.click('.player .play');
  await p.waitForTimeout(900);
  const cont = await y2f(p);
  ok(cont > 20 && cont < 22.5, '手动滚到 20 秒处再点播放：从当前位置继续', String(cont));
  await p.click('.player .play');
  // 幕进度圆点与控制条同步
  const dot = await p.evaluate(() => document.querySelector('.rail a[aria-current]')?.dataset.scene);
  ok(+dot === (await state(p)).active, '幕进度圆点与播放器的当前幕同步', `${dot} vs ${(await state(p)).active}`);
  await p.click('.rail a[data-scene="6"]');
  await p.waitForTimeout(1000);
  ok((await state(p)).active === 6, '幕进度圆点：点击跳到对应的幕');
  const labels = await p.$$eval('.rail a', as => as.map(a => a.getAttribute('aria-label')));
  ok(labels.length === 10 && labels.every(l => /^第 \d 幕：/.test(l)), '幕进度圆点：10 个都有 aria-label', JSON.stringify(labels));
  // 换幕时礼貌播报，不连续播报
  const live = await p.evaluate(() => [
    document.querySelector('.live-region')?.getAttribute('aria-live'),
    document.querySelector('.scrub')?.getAttribute('aria-valuetext'),
  ]);
  ok(live[0] === 'polite' && /^第 \d 幕/.test(live[1]), '无障碍：换幕只在 polite 区播报，进度条有 aria-valuetext', JSON.stringify(live));
  ok(errs.length === 0, '首页没有控制台错误、警告和水合不一致', errs.join(' | '));
  const chunks = [...new Set(p.reqs.map(u => CHUNK.exec(u)?.[1]).filter(Boolean))];
  ok(chunks.length === 0, '首页不加载任何一课的数据 chunk', chunks.join(','));
  await p.ctx.close();
}

/* 6. 什么时候不自动播放：有学习进度、同会话已播、带锚点、减少动画、后台标签页 */
{
  const W = await lessonData('what-is-react');
  const seed = {
    'what-is-react': {
      quiz: Object.fromEntries(W.quiz.map((q, i) => [i, q.answer])),
      tried: Object.fromEntries(W.quiz.map((_q, i) => [i, true])),
      first: Object.fromEntries(W.quiz.map((_q, i) => [i, true])),
      ex: !!W.exercise,
      done: true,
    },
    __srs: { 'what-is-react#0': { box: 1, n: 1, due: Date.now() - 1000, last: Date.now() - 2 * DAY } },
  };
  const cases = [
    ['有学习进度的回访者', { seen: false, seed }],
    ['同一会话已经播放过', { seen: true }],
    ['带 hash 锚点进入', { seen: false, hash: 'scene-3' }],
  ];
  for (const [name, opts] of cases) {
    const p = await open(opts);
    await p.waitForTimeout(2600);
    const s = await state(p);
    const film = await p.evaluate(() => {
      const b = document.querySelector('.btn.film');
      return b && b.checkVisibility();
    });
    ok(!s.playing && film, `${name}：不自动播放，显示“▶ 播放 N 秒短片”按钮`, JSON.stringify([s, film]));
    if (opts.hash) ok(s.active === 3, '带 hash 进入：停在对应的幕', JSON.stringify(s));
    if (opts.seed) {
      const r = await p.evaluate(() => [...document.querySelectorAll('.s0 .st-actions a')].map(a => [a.textContent.trim(), a.getAttribute('href')]));
      ok(
        /^继续学习：/.test(r[0][0]) && r[0][1].includes('/lessons/' + LESSONS[1].id) && /今日复习 1 题/.test(r[1]?.[0]),
        '有进度和到期卡片：“继续学习：下一课”和“今日复习 1 题”',
        JSON.stringify(r),
      );
      const last = await p.evaluate(() => [...document.querySelectorAll('.s9 .fin-actions a')].map(a => a.textContent.trim()));
      ok(
        /^继续学习：/.test(last[0]) && last[1] === '查看课程地图' && /^今日复习 1 题/.test(last[2]),
        '有进度和到期复习：收束幕是“继续学习：下一课”、“查看课程地图”、“今日复习 1 题”',
        JSON.stringify(last),
      );
    } else {
      const r = await p.evaluate(() => [...document.querySelectorAll('.s0 .st-actions a')].map(a => a.textContent.trim()));
      ok(r.length === 1 && /从第 1 课开始/.test(r[0]), `${name}：没有进度时开场只有“从第 1 课开始”，没有“今日复习”`, JSON.stringify(r));
      const last = await p.evaluate(() => [...document.querySelectorAll('.s9 .fin-actions a')].map(a => a.textContent.trim()));
      ok(
        last.length === 2 && /^开始学习/.test(last[0]) && last[1] === '查看课程地图',
        `${name}：没有进度时收束幕是“开始学习”和“查看课程地图”，没有复习入口`,
        JSON.stringify(last),
      );
    }
    if (name === '同一会话已经播放过') {
      await p.click('.btn.film');
      await p.waitForTimeout(800);
      ok((await state(p)).playing, '点“▶ 播放 N 秒短片”按钮：开始播放');
      // 标签页转到后台：暂停，回来不自动续播，按钮是“继续播放”
      await p.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await p.waitForTimeout(400);
      const hid = await state(p);
      await p.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await p.waitForTimeout(1200);
      const back = await state(p);
      ok(
        !hid.playing && !back.playing && back.y === hid.y && /继续播放/.test(await p.getAttribute('.player .play', 'aria-label')),
        '后台标签页：暂停；回到前台不自动续播，按钮是“继续播放”',
        JSON.stringify([hid, back]),
      );
    }
    await p.ctx.close();
  }
  const r = await open({ reduced: true, seen: false });
  await r.waitForTimeout(2600);
  const info = await r.evaluate(() => ({
    player: !!document.querySelector('.player') && getComputedStyle(document.querySelector('.player')).display !== 'none',
    film: document.querySelector('.btn.film')?.checkVisibility(),
    y: scrollY,
    anims: document.getAnimations().length,
    stage: getComputedStyle(document.querySelector('.world')).position,
    copy: [...document.querySelectorAll('.sc-copy')].every(c => +getComputedStyle(c).opacity === 1 && getComputedStyle(c).position !== 'fixed'),
    dots: document.querySelectorAll('.rail a').length,
    sw: document.documentElement.scrollWidth <= innerWidth,
    h2: [...document.querySelectorAll('.sc h2')].every(h => h.checkVisibility({ checkOpacity: true })),
  }));
  ok(!info.player && !info.film && info.y === 0 && info.anims === 0, '减少动画：没有播放器、没有自动播放、没有任何动画在跑', JSON.stringify(info));
  ok(
    info.stage === 'relative' && info.copy && info.h2 && info.sw && info.dots === 10,
    '减少动画：静态长文，每幕文字都是最终状态，幕进度指示保留',
    JSON.stringify(info),
  );
  await r.ctx.close();
}

/* 7. 手动擦洗：往回滚倒放；自动播放暂停在某处与手动滚到同一位置，画面一致 */
{
  const p = await open({ seen: true });
  const probe = ['[data-w="n-Item2"]', '[data-w="nl-TodoList"]', '[data-w="bo-Box2"]', '[data-w="cam"]', '[data-w="year"]'];
  const snap = async pg => {
    const out = [];
    for (const s of probe) out.push(await look(pg, s));
    return out;
  };
  await atF(p, 14);
  await settle(p);
  const v1 = await snap(p);
  await atF(p, 19.5);
  await settle(p);
  const v2 = await snap(p);
  await atF(p, 14);
  await settle(p);
  const v3 = await snap(p);
  ok(
    JSON.stringify(v1) !== JSON.stringify(v2) && JSON.stringify(v1) === JSON.stringify(v3),
    '手动擦洗：画面随滚动变化，往回滚会倒放（两个时间点比较关键元素的 transform / opacity）',
    JSON.stringify([v1, v2]),
  );
  ok((await look(p, '[data-w="cp-2"]')).o === 1 && (await look(p, '[data-w="cp-5"]')).o === 0, '手动擦洗：当前幕的文字不透明，别的幕的文字退场');
  await p.ctx.close();
  // 自动播放（倍速）在中途暂停，读下画面；再在另一页手动滚到同一位置，比较
  const a = await open({ seen: false, speed: 6 });
  await a.waitForFunction(() => document.querySelector('.player .play')?.getAttribute('aria-pressed') === 'true');
  await a.waitForFunction(() => scrollY > 0.37 * (document.documentElement.scrollHeight - innerHeight));
  await a.click('.player .play');
  await a.waitForTimeout(300);
  const yA = (await state(a)).y;
  const snapA = await snap(a);
  const b = await open({ seen: true });
  await b.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), yA);
  await settle(b);
  const snapB = await snap(b);
  ok(JSON.stringify(snapA) === JSON.stringify(snapB), '自动播放与手动滚到同一位置：关键元素的 transform / opacity 一致', JSON.stringify([snapA, snapB]));
  await a.ctx.close();
  await b.ctx.close();
}

/* 8. 手机和横屏：无横向滚动，每幕的文字完整、不被播放器遮挡 */
for (const [w, h] of [
  [390, 844],
  [360, 640],
  [844, 390],
]) {
  const p = await open({ w, h });
  const bad = [];
  for (let i = 0; i < 10; i++) {
    await atF(p, i === 0 ? 1.5 : i === 9 ? TOTAL : MARKS[i] + 2.5);
    await p.waitForTimeout(500);
    const r = await p.evaluate(i => {
      const sc = document.querySelectorAll('.sc')[i];
      const c = sc.querySelector('.sc-copy');
      const b = c.getBoundingClientRect();
      const pl = document.querySelector('.player').getBoundingClientRect();
      const last = c.querySelector('.hook, .foot, .desc, .scroll-hint, .st-links:last-child') || c;
      const lb = (i === 9 ? c.querySelector('.foot') : i === 0 ? c.querySelector('.st-links') : c.querySelector('.desc')).getBoundingClientRect();
      const inner = c.scrollHeight > c.clientHeight + 1;
      return {
        sw: document.documentElement.scrollWidth,
        iw: innerWidth,
        left: b.left,
        right: b.right,
        descBottom: lb.bottom,
        playerTop: pl.top,
        op: +getComputedStyle(c).opacity,
        i,
        scrolls: inner,
        last: !!last,
      };
    }, i);
    if (r.sw > r.iw || r.left < -1 || r.right > r.iw + 1 || r.op < 0.99) bad.push(JSON.stringify(r));
    else if (!(i === 9 && r.scrolls) && r.descBottom > r.playerTop + 1 && w < 500) bad.push('被播放器遮挡 ' + JSON.stringify(r));
  }
  ok(!bad.length, `${w}×${h}：每幕无横向滚动，文字在屏幕内，不被播放器遮挡`, bad.join(' ; '));
  await p.ctx.close();
}

/* 9. 键盘：Tab 从头走，每个获得焦点的链接、按钮都看得见（不透明、在视口里） */
{
  const p = await open({ seen: true });
  const seen = [];
  const bad = [];
  for (let n = 0; n < 30; n++) {
    await p.keyboard.press(process.env.BROWSER === 'webkit' ? 'Alt+Tab' : 'Tab');
    await p.waitForTimeout(80);
    const f = await p.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body || !e.closest('.story')) return null;
      let o = 1;
      for (let x = e; x; x = x.parentElement) o *= +getComputedStyle(x).opacity;
      const r = e.getBoundingClientRect();
      return {
        t: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 16),
        o: +o.toFixed(2),
        vis: e.checkVisibility({ checkVisibilityCSS: true }),
        inView: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
      };
    });
    if (!f) continue;
    seen.push(f.t);
    if (f.o < 0.99 || !f.inView || !f.vis) bad.push(JSON.stringify(f));
  }
  ok(seen.length >= 14 && !bad.length, 'Tab 走完首页：每个获得焦点的链接、按钮都不透明、可见、在视口里', `${seen.length} 个；` + bad.join(' ; '));
  await p.ctx.close();
}

/* 10. 离开页面（客户端路由）：停止自动播放，清理动画 */
{
  const p = await open({ seen: false });
  await p.waitForFunction(() => document.querySelector('.player .play')?.getAttribute('aria-pressed') === 'true');
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    window.__nr = 1;
  });
  await p.click('.rp-nav-menu a[href*="glossary"], .rp-nav a[href*="glossary"]').catch(() => p.goto(site + 'glossary.html'));
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({
    anims: document.getAnimations().length,
    dyn: document.documentElement.classList.contains('story-dyn'),
    story: !!document.querySelector('.story'),
  }));
  const y1 = await p.evaluate(() => scrollY);
  await p.waitForTimeout(800);
  ok(!r.story && r.anims < 5 && (await p.evaluate(() => scrollY)) === y1, '离开首页：播放停止、动画和监听清理干净', JSON.stringify(r));
  await p.ctx.close();
}

/* 10b. 收束幕的版式：八个节点、链接、年份、统计数字、减少动画下的静态版式 */
{
  const eras = [
    ['之前', '手动改 DOM', 'what-is-react'],
    ['2013', '声明式', 'state'],
    ['2013', '协调', 'rendering'],
    ['2017', 'Fiber', 'scheduler'],
    ['2019', 'Hooks', 'custom-hooks'],
    ['2022', '并发', 'concurrent'],
    ['2024', '服务端', 'server-components'],
    ['2025', '编译器', 'performance'],
  ];
  const playN = LESSONS.reduce((n, l) => n + l.nPlays, 0);
  const exN = LESSONS.filter(l => l.hasExercise).length;
  const quizN = LESSONS.reduce((n, l) => n + l.quizAnswers.length, 0);
  for (const reduced of [false, true]) {
    const p = await open({ seen: true, reduced });
    if (!reduced) {
      await atF(p, TOTAL);
      await p.waitForTimeout(600);
    }
    const r = await p.evaluate(() => ({
      items: [...document.querySelectorAll('.s9 .eras li')].map(li => ({
        yr: li.querySelector('.yr').textContent,
        name: li.querySelector('b').textContent,
        href: li.querySelector('.era-main').getAttribute('href'),
        label: li.querySelector('.era-main').getAttribute('aria-label'),
        more: [...li.querySelectorAll('.era-more')].map(a => a.getAttribute('href')),
        op: +getComputedStyle(li).opacity,
        vis: li.querySelector('.era-main').checkVisibility({ checkOpacity: true }),
      })),
      counts: [...document.querySelectorAll('.s9 .stats3 dt')].map(d => +d.textContent),
      ol: document.querySelector('.s9 ol.eras')?.tagName,
      curve: !!document.querySelector('.s9 .tl-curve[aria-hidden="true"]'),
      draw: +getComputedStyle(document.querySelector('.s9 .tl-draw')).strokeDashoffset.replace('px', ''),
      sw: document.documentElement.scrollWidth <= innerWidth,
    }));
    const tag = reduced ? '减少动画' : '短片模式（拖到结尾）';
    ok(
      r.ol === 'OL' &&
        r.items.length === 8 &&
        r.items.every((it, i) => it.yr === eras[i][0] && it.name === eras[i][1] && it.href.endsWith('/lessons/' + eras[i][2])),
      `收束幕（${tag}）：八个时代按顺序，年份、名称、课链接正确，用有序列表`,
      JSON.stringify(r.items.map(i => [i.yr, i.name, i.href])),
    );
    ok(
      r.items.every(it => /^(之前|\d{4}) .+：.+/.test(it.label)) && r.items[6].more.length === 1 && r.items[6].more[0].endsWith('/lessons/react-19'),
      `收束幕（${tag}）：每个节点的可访问名称含年份、时代名和课名；服务端多一条 react-19`,
      JSON.stringify(r.items.map(i => i.label)),
    );
    ok(
      r.items.every(it => it.op === 1 && it.vis) && r.curve && r.sw,
      `收束幕（${tag}）：八个节点都可见、曲线装饰对读屏隐藏、无横向滚动`,
      JSON.stringify(r.items.map(i => i.op)),
    );
    ok(
      JSON.stringify(r.counts) === JSON.stringify([playN, exN, quizN]),
      `收束幕（${tag}）：三个统计数字和目录计算一致（${playN} / ${exN} / ${quizN}）`,
      JSON.stringify(r.counts),
    );
    // 键盘 Tab 顺序：先是时代节点（从左到右），再是行动区
    if (!reduced) {
      await p.evaluate(() => document.querySelector('.s9 .era-main').focus());
      const order = [];
      for (let i = 0; i < 12; i++) {
        order.push(await p.evaluate(() => document.activeElement?.getAttribute('href') || document.activeElement?.className));
        await p.keyboard.press('Tab');
      }
      const lessonsSeq = order.filter(h => /\/lessons\//.test(h)).map(h => h.split('/lessons/')[1].replace('.html', ''));
      ok(
        lessonsSeq.slice(0, 9).join() ===
          ['what-is-react', 'state', 'rendering', 'scheduler', 'custom-hooks', 'concurrent', 'server-components', 'react-19', 'performance'].join(),
        '收束幕：Tab 顺序是时代节点从左到右（服务端的两条课挨在一起），然后才是行动区',
        order.join(' | '),
      );
      // 悬停一个节点：它的一句话要点出现
      await p.hover('.s9 .era:nth-child(4) .era-main');
      await p.waitForTimeout(400);
      const tip = await p.evaluate(() => +getComputedStyle(document.querySelector('.s9 .era:nth-child(4) .tip')).opacity);
      ok(tip > 0.9, '收束幕：悬停一个节点，显示这一代的一句话要点', String(tip));
    }
    await p.ctx.close();
  }
  // 手机：纵向时间轴，无横向滚动，主按钮不被进度指示或控制条遮挡
  for (const [w, h] of [
    [390, 844],
    [360, 640],
  ]) {
    const p = await open({ w, h });
    await atF(p, TOTAL);
    await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      const b = document.querySelector('.s9 .fin-actions .btn.big').getBoundingClientRect();
      const pl = document.querySelector('.player').getBoundingClientRect();
      const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      const rail = document.querySelector('.rail').getBoundingClientRect();
      return {
        sw: document.documentElement.scrollWidth,
        iw: innerWidth,
        hit: !!top?.closest('.fin-actions'),
        above: b.bottom <= pl.top + 1,
        clearRail: b.right <= rail.left + 1 || b.bottom < rail.top || b.top > rail.bottom,
      };
    });
    ok(r.sw <= r.iw && r.hit && r.above && r.clearRail, `${w}×${h}：收束幕无横向滚动，主按钮可点、在控制条之上、不被进度指示遮挡`, JSON.stringify(r));
    await p.ctx.close();
  }
}

/* 10b2. 四种尺寸下收束幕互不遮挡：标题、八个节点、统计说明、按钮都完整可见；没有内部滚动容器；中心点命中的不是固定浮层 */
for (const [w, h] of [
  [360, 640],
  [390, 844],
  [1280, 720],
  [1280, 800],
]) {
  const p = await open({ w, h, seen: false, speed: 10 });
  await p.waitForFunction(() => document.querySelector('.story').classList.contains('ended'), null, { timeout: 30000 });
  await p.waitForTimeout(1800);
  const r = await p.evaluate(() => {
    const box = e => {
      const b = e.getBoundingClientRect();
      return { l: b.left, t: b.top, r: b.right, b: b.bottom };
    };
    const sel = ['.s9 h2', '.s9 .eras .era-main', '.s9 .eras .era-more', '.s9 .stats3 dd', '.s9 .fin-actions a', '.s9 .foot'];
    const items = sel.flatMap(s => [...document.querySelectorAll(s)].map(e => ({ s, e })));
    const boxes = items.map(i => ({ s: i.s, ...box(i.e) }));
    let overlap = 0;
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i],
          c = boxes[j];
        if (a.l < c.r - 1 && c.l < a.r - 1 && a.t < c.b - 1 && c.t < a.b - 1) overlap++;
      }
    const outside = boxes.filter(b => b.t < 0 || b.b > innerHeight + 1 || b.l < 0 || b.r > innerWidth + 1).length;
    let blocked = 0;
    for (const i of items) {
      if (!/stats3|era|fin-actions/.test(i.s)) continue;
      const b = box(i.e);
      const hit = document.elementFromPoint((b.l + b.r) / 2, (b.t + b.b) / 2);
      if (!hit || !(i.e === hit || i.e.contains(hit) || hit.contains(i.e))) blocked++;
    }
    const c = document.querySelector('.s9 .sc-copy');
    const primary = box(document.querySelector('.s9 .btn.primary'));
    return { overlap, outside, blocked, n: items.length, scroll: c.scrollHeight, client: c.clientHeight, primaryB: primary.b, ih: innerHeight };
  });
  ok(
    r.n >= 16 && r.overlap === 0 && r.outside === 0 && r.blocked === 0 && r.scroll <= r.client + 1 && r.primaryB <= r.ih,
    `${w}×${h}：收束幕各元素互不相交、都在视口内、无内部滚动、中心点未被浮层遮挡`,
    JSON.stringify(r),
  );
  await p.ctx.close();
}

/* 10c. 幕进度指示：所有圆点的圆心在一条线上（桌面竖线、手机同理），间距均匀，点击区域不小于 24×24；第一幕、中间一幕、最后一幕为当前时各量一次 */
for (const [w, h] of [
  [1280, 800],
  [390, 844],
]) {
  const p = await open({ w, h });
  for (const [label, f] of [
    ['第一幕为当前', 1],
    ['中间一幕为当前', MARKS[5] + 1],
    ['最后一幕为当前', TOTAL],
  ]) {
    await atF(p, f);
    await p.waitForTimeout(500);
    await p.hover('.story .sc-copy', { force: true }).catch(() => {});
    const r = await p.evaluate(() => {
      const dots = [...document.querySelectorAll('.rail a')].map(a => ({ d: a.querySelector('.dot').getBoundingClientRect(), a: a.getBoundingClientRect() }));
      const cx = dots.map(x => x.d.left + x.d.width / 2);
      const cy = dots.map(x => x.d.top + x.d.height / 2);
      const spread = v => Math.max(...v) - Math.min(...v);
      const vertical = spread(cy) > spread(cx);
      const main = vertical ? cy : cx;
      const gaps = main.slice(1).map((v, i) => v - main[i]);
      return {
        n: dots.length,
        crossSpread: vertical ? spread(cx) : spread(cy),
        vertical,
        gapSpread: spread(gaps),
        minHit: Math.min(...dots.map(x => Math.min(x.a.width, x.a.height))),
        cur: document.querySelector('.rail a[aria-current]')?.dataset.scene,
      };
    });
    ok(
      r.n === 10 && r.crossSpread <= 0.5 && r.gapSpread <= 0.5 && r.minHit >= 24,
      `${w}×${h} 幕进度指示（${label}）：圆心在同一条${r.vertical ? '竖' : '横'}线上（偏差 ${r.crossSpread.toFixed(2)}px ≤ 0.5）、间距均匀（${r.gapSpread.toFixed(2)}px）、点击区域 ≥ 24px`,
      JSON.stringify(r),
    );
  }
  // 悬停、聚焦：也不动
  await atF(p, 20); // 收束幕里进度指示按设计隐藏，先回到中间
  await p.waitForTimeout(500);
  await p.focus('.rail a[data-scene="3"]');
  await p.hover('.rail a[data-scene="7"]');
  await p.waitForTimeout(400);
  const hv = await p.evaluate(() => {
    const cx = [...document.querySelectorAll('.rail .dot')].map(d => d.getBoundingClientRect().left + d.getBoundingClientRect().width / 2);
    const cy = [...document.querySelectorAll('.rail .dot')].map(d => d.getBoundingClientRect().top + d.getBoundingClientRect().height / 2);
    const sp = v => Math.max(...v) - Math.min(...v);
    return Math.min(sp(cx), sp(cy)) > 1 ? Math.max(Math.min(sp(cx), sp(cy)), 0) : Math.min(sp(cx), sp(cy));
  });
  ok(hv <= 0.5, `${w}×${h} 幕进度指示：悬停、聚焦时圆点也不动`, String(hv));
  await p.ctx.close();
}

/* 10d. 配乐：默认静音、点开才创建 AudioContext 和加载音频 chunk；与影片同步；暂停静音；关掉、离开页面都清理；偏好记在单独的键里 */
{
  const dir = path.join(ROOT, 'doc_build/static/js/async');
  const audioChunk = fs.readdirSync(dir).find(f => !/^lesson-/.test(f) && fs.readFileSync(path.join(dir, f), 'utf8').includes('createDynamicsCompressor'));
  ok(!!audioChunk, '音频代码在自己的 chunk 里', String(audioChunk));
  const p = await open({ seen: false });
  await p.waitForFunction(() => document.querySelector('.player .play')?.getAttribute('aria-pressed') === 'true');
  const hook = () => p.evaluate(() => window.__storyHook.audio());
  const a0 = await p.evaluate(() => ({ ctxs: window.__ctxs.length, hook: window.__storyHook.audio() }));
  ok(
    a0.ctxs === 0 && !a0.hook.created && !p.reqs.some(u => u.includes(audioChunk)),
    '默认静音：没有创建 AudioContext，也没有加载音频 chunk',
    JSON.stringify(a0),
  );
  ok((await p.getAttribute('.snd', 'aria-pressed')) === 'false', '声音开关：aria-pressed=false');
  ok(await p.locator('.snd-tip').isVisible(), '首次自动播放开始时，控制条上方出现“🔊 开启配乐”提示');
  await p.waitForTimeout(6600);
  ok(!(await p.locator('.snd-tip').isVisible()), '提示约 6 秒后消失');
  await p.click('.snd');
  await p.waitForTimeout(1800);
  const a1 = await hook();
  ok(
    a1.on &&
      a1.created &&
      a1.state === 'running' &&
      a1.level > 0.003 &&
      (await p.getAttribute('.snd', 'aria-pressed')) === 'true' &&
      p.reqs.some(u => u.includes(audioChunk)),
    '点开声音：上下文 running、有电平、此时才加载音频 chunk',
    JSON.stringify(a1),
  );
  const lsv = await p.evaluate(() => [
    localStorage.getItem('hoc-story-sound'),
    localStorage.getItem('hoc-story-tip'),
    localStorage.getItem('hands-on-react-v1'),
  ]);
  ok(lsv[0] === 'on' && lsv[1] === '1' && !/story/.test(lsv[2] || ''), '偏好记在单独的 localStorage 键里，不写进学习进度的键', JSON.stringify(lsv));
  // 音量档：声音开着时才出现；点一下切到“小声”，电平下降，偏好记在单独的键里
  ok(await p.locator('.vol').isVisible(), '音量按钮：声音开启后出现在声音开关旁');
  const peakLv = async () => {
    let m = 0;
    for (let i = 0; i < 12; i++) {
      m = Math.max(m, (await hook()).level);
      await p.waitForTimeout(100);
    }
    return m;
  };
  const lvN = await peakLv();
  await p.click('.vol');
  await p.waitForTimeout(900);
  const lvQ = await peakLv();
  const vq = await p.evaluate(() => [localStorage.getItem('hoc-story-vol'), document.querySelector('.vol').textContent]);
  ok(
    vq[0] === 'quiet' && vq[1] === '小声' && (await p.getAttribute('.vol', 'aria-pressed')) === 'true' && lvQ < lvN,
    '音量按钮：切到“小声”，电平下降，偏好存进 hoc-story-vol',
    JSON.stringify([vq, lvN, lvQ]),
  );
  await p.click('.vol');
  ok(
    (await p.evaluate(() => localStorage.getItem('hoc-story-vol'))) === 'normal' && (await p.getAttribute('.vol', 'aria-pressed')) === 'false',
    '音量按钮：再点回“正常”',
  );
  // 音乐从当前影片时间开始（不是从头），换幕后重新排程
  const f0 = a1.info.anchorF;
  ok(f0 > 4, '音乐从当前的影片时间淡入（不是从头）', String(f0));
  await p.click('.player .next');
  await p.waitForTimeout(1500);
  const a2 = await hook();
  ok(a2.info.anchorF >= f0 + 2 && a2.playing, '拖到别的幕后，调度位置随之改变', JSON.stringify([f0, a2.info.anchorF]));
  // 暂停：0.5 秒内静音，随后 suspend
  await p.click('.player .play');
  await p.waitForTimeout(550);
  const a3 = await hook();
  await p.waitForTimeout(500);
  const a4 = await hook();
  ok(a3.level < 0.0008 && a4.state === 'suspended', '暂停：0.5 秒内输出静音，随后 AudioContext 被 suspend', JSON.stringify([a3.level, a4.state]));
  await p.click('.player .play');
  await p.waitForTimeout(1800);
  const a5 = await hook();
  ok(a5.state === 'running' && a5.level > 0.003, '继续播放：声音淡入回来', JSON.stringify(a5));
  // 关掉声音
  await p.click('.snd');
  await p.waitForTimeout(900);
  const a6 = await hook();
  ok(
    !a6.on && a6.state === 'suspended' && (await p.getAttribute('.snd', 'aria-pressed')) === 'false',
    '关掉声音：上下文被 suspend，aria-pressed=false',
    JSON.stringify(a6),
  );
  // 重新打开，然后离开首页（客户端路由）：上下文全部关闭
  await p.click('.snd');
  await p.waitForTimeout(1200);
  await p.evaluate(() => (window.__nr = 1));
  await p.click('.rp-nav a[href*="glossary"], .rp-nav-menu a[href*="glossary"]').catch(() => p.goto(site + 'glossary.html'));
  await p.waitForTimeout(1500);
  const gone = await p.evaluate(() => ({ states: window.__ctxs?.map(c => c.state) ?? ['reloaded'], hook: !!window.__storyHook }));
  ok(!gone.hook && gone.states.every(s => s === 'closed' || s === 'reloaded'), '离开首页：停止全部声源、关闭 AudioContext、清掉测试钩子', JSON.stringify(gone));
  await p.ctx.close();
  // 开过声音的偏好：下次点“▶ 播放短片”直接带声音
  const q = await open({ seen: true });
  await q.evaluate(() => localStorage.setItem('hoc-story-sound', 'on'));
  await q.click('.btn.film');
  await q.waitForTimeout(2200);
  const b1 = await q.evaluate(() => window.__storyHook.audio());
  ok(b1.on && b1.state === 'running' && b1.level > 0.003, '偏好开过声音：点“▶ 播放短片”直接带声音', JSON.stringify(b1));
  await q.ctx.close();
  // 没有偏好时点播放仍然静音，并给出提示
  const r2 = await open({ seen: true });
  await r2.click('.btn.film');
  await r2.waitForTimeout(1200);
  const b2 = await r2.evaluate(() => ({ h: window.__storyHook.audio(), tip: !document.querySelector('.snd-tip').hidden, ctxs: window.__ctxs.length }));
  ok(!b2.h.on && b2.ctxs === 0 && b2.tip, '没有偏好：点播放仍然静音，并显示“开启配乐”提示', JSON.stringify(b2));
  await r2.ctx.close();
}

/* 10e. 离线渲染整段配乐并检查（可测量的部分；好不好听要人来判断） */
{
  const p = await open({ seen: true });
  const r = await p.evaluate(() => window.__storyHook.render());
  const st = r.stats;
  const outDir = process.env.SCORE_DIR;
  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'score.wav'), Buffer.from(r.wav, 'base64'));
    fs.writeFileSync(path.join(outDir, 'stats.json'), JSON.stringify(st, null, 1));
  }
  console.log('配乐检查：' + JSON.stringify({ ...st, cues: undefined, perScene: undefined }));
  console.log('每幕 RMS/峰值(dBFS)：' + st.perScene.map(x => `${x.scene}:${x.rmsDb}/${x.peakDb}`).join(' '));
  ok(st.nan === 0 && st.clipped === 0, '配乐：没有 NaN，没有削波（≥0.999 的采样数为 0）', JSON.stringify([st.nan, st.clipped]));
  ok(
    st.peakDb <= -3 && st.rmsDb > -26 && st.rmsDb < -14,
    `配乐：峰值 ${st.peakDb} dBFS ≤ -3，整体 RMS ${st.rmsDb} dBFS 适中`,
    JSON.stringify([st.peakDb, st.rmsDb]),
  );
  ok(
    st.perScene.every(x => x.peakDb <= -3 && x.rmsDb > -32),
    '配乐：每一幕的峰值都 ≤ -3 dBFS、响度不低于 -32 dBFS',
    JSON.stringify(st.perScene),
  );
  ok(st.longestQuiet <= 1.5, `配乐：没有超过 1.5 秒的意外静音（最长 ${st.longestQuiet} 秒）`, String(st.longestQuiet));
  ok(st.stereoDiff > 0.02, `配乐：左右声道不同（立体声差异 ${st.stereoDiff}）`, String(st.stereoDiff));
  ok(
    st.bands['2k-5k'] + st.bands.gt5k < 0.2,
    `配乐：频谱不集中在刺耳的 2–5 kHz（占比 ${(st.bands['2k-5k'] * 100).toFixed(1)}%，5 kHz 以上 ${(st.bands.gt5k * 100).toFixed(1)}%）`,
    JSON.stringify(st.bands),
  );
  const bad = st.cues.filter(c => !c.ok);
  ok(
    bad.length === 0,
    `配乐：每个音效在对应的画面时间点 ±50ms 内都有能量突起（${st.cues.length - bad.length}/${st.cues.length}）`,
    bad.map(c => `${c.name}@${c.t.toFixed(2)}×${c.ratio}`).join(' '),
  );
  await p.ctx.close();
}

/* 11. 体积：首页自己的 chunk 和主包 */
{
  const dir = path.join(ROOT, 'doc_build/static/js/async');
  const files = fs.readdirSync(dir).filter(f => {
    if (/^lesson-/.test(f)) return false;
    const t = fs.readFileSync(path.join(dir, f), 'utf8');
    return t.includes('scene-0') || (t.includes('story-dyn') && t.includes('aria-pressed'));
  });
  const zlib = await import('node:zlib');
  const sizes = files.map(f => {
    const buf = fs.readFileSync(path.join(dir, f));
    return [f, buf.length, zlib.gzipSync(buf).length];
  });
  console.log('首页 chunk：' + JSON.stringify(sizes));
  ok(
    sizes.length >= 2 && sizes.reduce((n, s) => n + s[2], 0) <= 25 * 1024,
    '首页自己的 chunk（路由 + 动画引擎 + 编排，gzip 合计）≤ 25 KB',
    JSON.stringify(sizes),
  );
  const main = fs.readdirSync(path.join(ROOT, 'doc_build/static/js')).find(f => /^index\..*\.js$/.test(f));
  const mainSize = fs.statSync(path.join(ROOT, 'doc_build/static/js', main)).size;
  console.log('主包：' + mainSize);
  ok(mainSize <= 215000, '主包不超过 215,000 字节', String(mainSize));
}

/* 截图（HOME_SHOTS=1） */
if (process.env.HOME_SHOTS) {
  const out = path.join(ROOT, 'tests/screenshots');
  const plan = [1.5, 8.5, 14.5, 19.4, 24.4, 30.3, 35.6, 43.4, 49.4, 53.5];
  for (const [name, opts] of [
    ['desktop', {}],
    ['mobile', { w: 390, h: 844 }],
  ]) {
    const p = await open(opts);
    for (const [i, f] of plan.entries()) {
      await atF(p, f);
      await p.waitForTimeout(600);
      await p.screenshot({ path: path.join(out, `home-story-${name}-${i}.png`) });
    }
    await p.ctx.close();
  }
  // 收束幕：自动播放（倍速）放完之后的静止画面，各种屏幕尺寸、深浅两种主题
  for (const [w, h] of [
    [1280, 800],
    [1440, 900],
    [1920, 1080],
    [390, 844],
    [360, 640],
  ]) {
    for (const scheme of ['dark', 'light']) {
      const p = await open({ w, h, scheme, seen: false, speed: 10 });
      await p.waitForFunction(() => document.querySelector('.story').classList.contains('ended'), null, { timeout: 30000 });
      await p.waitForTimeout(1800);
      await p.screenshot({ path: path.join(out, `home-story-final-${w}x${h}-${scheme}.png`) });
      if (w === 1280 && scheme === 'dark') {
        await p.hover('.s9 .era:nth-child(4) .era-main');
        await p.waitForTimeout(500);
        await p.screenshot({ path: path.join(out, 'home-story-final-hover.png') });
      }
      await p.ctx.close();
    }
  }
  const p = await open({ reduced: true });
  await p.screenshot({ path: path.join(out, 'home-story-reduced-full.png'), fullPage: true });
  await p.ctx.close();
}

await browser.close();
close();
process.exit(done() ? 1 : 0);
