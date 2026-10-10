/* 首页短片的浏览器端（自己的异步 chunk，不进站点主包）。
 *
 * 首页是一个固定占满视口的舞台，里面是一段 55 秒的短片：画面是“影片时间”f 的函数（编排在 logic/filmTracks.ts，每个元素一条关键帧轨道，
 * 用 Web Animations API 暂停后按时间擦洗，只动 transform、opacity 和 SVG 描边）。页面本身不滚动，当前在哪一幕由状态决定，不由滚动位置换算。
 * 交互是“一次一幕”：一格滚轮、一次滑动、一次按键，只切到相邻的一幕——从上一幕的结论帧起按正常速度播放到这一幕的结论帧（幕间转场照常）；
 * 动画播放中再来一次输入，立刻跳到当前幕的结论帧再往下一幕走；往回切直接淡入上一幕的结论帧。
 * 不相邻的跳转（跳过、点进度条或圆点、重播、Home/End、带 hash 的地址）一律“淡出 → 目标幕的起始帧或结论帧淡入”，中间幕的画面和音效完全不出现。
 * 自动播放 = 影片时间匀速前进到结尾；用户的任何切幕手势先暂停它，再执行这一次切换。
 * 另外这里做：播放控制条、幕进度指示、标签页在后台时暂停、卸载时清理。 */
import { CUE, DURATIONS, MARKS, STREAM_TARGETS, TOTAL } from './logic/filmData.ts';
import { type KF, type Measure, type Pt, type Tracks, buildTracks, flyerTracks } from './logic/filmTracks.ts';
import type { Engine } from './audio.ts';

const DYN = 'story-dyn';
/** 同一次页面加载里已经自动播放过：站内跳走再回来不重放；刷新或重新打开就是新的一次（模块级的内存标记，不存 sessionStorage） */
let playedOnce = false;
const SOUND_PREF = 'hoc-story-sound'; // localStorage：用户开过声音（不是学习进度的键）
const SOUND_VOL = 'hoc-story-vol'; // localStorage：音量档（quiet / normal）
const SOUND_TIP = 'hoc-story-tip'; // localStorage：“开启配乐”的提示点过了
const SCENE_NAMES = [
  '开场',
  'React 之前：手动改 DOM',
  '2013 · 声明式',
  '2013 · 协调',
  '2017 · Fiber',
  '2019 · Hooks',
  '2022 · 并发',
  '2024 · 服务端',
  '2025 · 编译器',
  '收束',
];
/** 测试用的倍速（页面里设 window.__storySpeed）；正常使用恒为 1 */
const speed = (): number => (typeof window !== 'undefined' && (window as unknown as { __storySpeed?: number }).__storySpeed) || 1;
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);

/** 影片时间 → 第几幕 */
export const sceneOf = (f: number): number => {
  let i = 0;
  while (i < MARKS.length - 1 && f >= MARKS[i + 1]) i++;
  return i;
};
/** 每一幕的“结论帧”：这一幕的文字和画面都到位、下一幕的转场还没开始（秒）。收束幕是片尾 */
export const STOP: number[] = MARKS.map((_m, i) => (i === MARKS.length - 1 ? TOTAL : MARKS[i + 1] - (i === 0 ? 1.0 : i === 5 ? 0.55 : 0.85)));
/** 每一幕的“起始帧”：从这里往下播就是这一幕的动画（文字已出现，上一幕的东西已退场） */
export const START: number[] = MARKS.map((m, i) => (i === 0 ? 0 : m + 0.6));
/** 影片时间 → 它属于哪一幕的“停靠区间”：结论帧之前的最后一幕（f 在第 k-1 幕结论帧之后、第 k 幕结论帧之前，就算第 k 幕） */
export const sceneAt = (f: number): number => {
  for (let i = 0; i < STOP.length; i++) if (f <= STOP[i] + 0.02) return i;
  return STOP.length - 1;
};

interface Track {
  anims: Animation[];
  /** 值在变化的时间段（秒） */
  spans: [number, number][];
  key: string;
}

/** 一条轨道里“值真的在变”的时间段：相邻两个关键帧的属性不同才算 */
export function changeSpans(kfs: KF[]): [number, number][] {
  const spans: [number, number][] = [];
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    let diff = false;
    for (const p of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (p === 't' || p === 'easing') continue;
      if (a[p] !== b[p]) diff = true;
    }
    if (!diff) continue;
    const last = spans[spans.length - 1];
    if (last && Math.abs(last[1] - a.t) < 1e-6) last[1] = b.t;
    else spans.push([a.t, b.t]);
  }
  return spans;
}

export function attach(root: HTMLElement): () => void {
  const html = document.documentElement;
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const narrowMQ = matchMedia('(max-width: 899px)');
  const world = root.querySelector<HTMLElement>('.world') as HTMLElement;
  const scenes = [...root.querySelectorAll<HTMLElement>('.sc')];
  const dots = [...root.querySelectorAll<HTMLAnchorElement>('.rail a')];
  const filmBtn = root.querySelector<HTMLButtonElement>('.btn.film');
  const slot = root.querySelector<HTMLElement>('.player-slot');
  const ac = new AbortController();
  const sig = { signal: ac.signal };
  const isDyn = () => !reduceMQ.matches;

  let addedDyn = false;
  if (!html.classList.contains(DYN)) {
    html.classList.add(DYN);
    addedDyn = true;
  }
  root.dataset.mode = 'film';

  /* ---------- 轨道 → Web Animations ---------- */
  let tracks: Track[] = [];
  let builtFor: boolean | null = null;
  const destroyAnims = () => {
    for (const t of tracks) for (const a of t.anims) a.cancel();
    tracks = [];
    builtFor = null;
  };
  let dynTimer = 0;
  let buildToken = 0;
  /** 建全部动画：一共几百条轨道，分批建（每批约 6ms），免得挤成一个长任务；建完才打开画面（root 上出现 .ready） */
  const build = (): Promise<void> => {
    destroyAnims();
    const token = ++buildToken;
    const mobile = narrowMQ.matches;
    const data: Tracks = buildTracks(mobile);
    const entries = Object.entries(data);
    let i = 0;
    return new Promise(resolve => {
      const slice = () => {
        if (token !== buildToken) return resolve();
        const t0 = performance.now();
        while (i < entries.length && performance.now() - t0 < 6) {
          const [name, kfs] = entries[i++];
          const els = name.startsWith('css:')
            ? [...root.querySelectorAll<HTMLElement>(name.slice(4))]
            : [...root.querySelectorAll<HTMLElement>(`[data-w="${name}"]`)];
          if (!els.length) continue;
          const frames: Keyframe[] = kfs.map(({ t, easing, ...props }) => ({
            offset: Math.min(1, t / TOTAL),
            easing,
            ...(props as Record<string, string | number>),
          }));
          const anims = els.map(el => {
            const a = el.animate(frames, { duration: TOTAL * 1000, fill: 'both', easing: 'linear' });
            a.pause();
            return a;
          });
          tracks.push({ anims, spans: changeSpans(kfs), key: '' });
        }
        if (i < entries.length) setTimeout(slice, 0);
        else {
          builtFor = mobile;
          staticCount = tracks.length;
          last = -1;
          paint(curF, true);
          resolve();
        }
      };
      slice();
    });
  };

  /* ---------- 过渡元素、弧形光路、时间轴卡片：起点终点要量出来 ---------- */
  let staticCount = 0;
  const rectAt = (sel: string, f: number, nth = 0): DOMRect => {
    paint(f, true);
    const els = root.querySelectorAll(sel);
    return (els[Math.min(nth, els.length - 1)] as Element).getBoundingClientRect();
  };
  const buildDynamic = () => {
    if (!tracks.length) return;
    // 去掉上一次建的
    for (const t of tracks.splice(staticCount)) for (const a of t.anims) a.cancel();
    const saved = curF;
    const w = world.getBoundingClientRect();
    const center = (sel: string, f: number, nth = 0): Pt => {
      const r = rectAt(sel, f, nth);
      return { x: r.left + r.width / 2 - w.left, y: r.top + r.height / 2 - w.top };
    };
    const M = MARKS;
    const m: Measure = {
      a: ['Header', 'Item1', 'Box2'].map(id => center(`[data-w="b-${id}"]`, M[1] + 3.5)) as Measure['a'],
      aEnd: center('[data-w="n-App"]', M[2] + 2.95),
      bStart: center('[data-w="fl-Box2"]', M[3] + 3.0),
      bEnd: center('[data-w="fk-0"]', M[4] + 1.0),
      cStart: { x: w.width / 2, y: w.height / 2 },
      li: Array.from(root.querySelectorAll('[data-w="cp-9"] .eras li .dt'), (_e, j) => center('[data-w="cp-9"] .eras li .dt', TOTAL, j)),
    };
    // 弧形光路：从服务器面板上的块，飞到浏览器里三个骨架占位；Action 是从右回到左的反向光
    const setArc = (names: string[], from: Pt, to: Pt, lift: number) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const d = Math.hypot(dx, dy) || 1;
      const c = { x: (from.x + to.x) / 2 + (dy / d) * d * lift, y: (from.y + to.y) / 2 - (dx / d) * d * lift - d * 0.12 };
      const dAttr = `M${from.x.toFixed(1)} ${from.y.toFixed(1)} Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
      for (const n of names) for (const el of root.querySelectorAll(`[data-w="${n}"]`)) el.setAttribute('d', dAttr);
    };
    STREAM_TARGETS.forEach((id, i) => {
      const sr = rectAt(`[data-w="sbk-${i}"]`, M[7] + 1.0);
      // 手机竖屏：三块横排，光路从每块的底边中点出发自上而下；桌面和横屏：从右边出发
      const down = narrowMQ.matches && matchMedia('(orientation: portrait)').matches;
      const from = down ? { x: sr.left + sr.width / 2 - w.left, y: sr.bottom - w.top } : { x: sr.right - w.left, y: sr.top + sr.height / 2 - w.top };
      const to = center(`[data-w="b-${id}"]`, CUE.arrive(i));
      setArc([`arcb-${i}`, `arcw-${i}`, `arc-${i}`], from, to, 0.28);
    });
    const panel = rectAt('[data-w="srvp"]', M[7] + 1.2);
    setArc(['arcw-act', 'arc-act'], center('[data-w="b-Item2"]', CUE.action), { x: panel.right - w.left, y: panel.bottom - w.top - 24 }, -0.25);
    const data = flyerTracks(m);
    for (const [name, kfs] of Object.entries(data)) {
      const els = name.startsWith('css:')
        ? [...root.querySelectorAll<HTMLElement>(name.slice(4))]
        : [...root.querySelectorAll<HTMLElement>(`[data-w="${name}"]`)];
      const frames: Keyframe[] = kfs.map(({ t, easing, ...props }) => ({
        offset: Math.min(1, t / TOTAL),
        easing,
        ...(props as Record<string, string | number>),
      }));
      const anims = els.map(el => {
        const a = el.animate(frames, { duration: TOTAL * 1000, fill: 'both', easing: 'linear' });
        a.pause();
        return a;
      });
      tracks.push({ anims, spans: changeSpans(kfs), key: '' });
    }
    last = -1;
    paint(saved, true);
  };

  let curF = 0;
  let last = -1;
  const paint = (f: number, force = false) => {
    if (!tracks.length) return;
    if (!force && Math.abs(f - last) < 1e-4) return;
    last = f;
    const ms = f * 1000;
    for (const t of tracks) {
      // 在某一段变化里：每帧都要更新；在两段之间（值不变）：只在进入这一段空隙时更新一次
      let key = '';
      for (let i = 0; i < t.spans.length; i++) {
        const [a, b] = t.spans[i];
        if (f >= a - 0.02 && f <= b + 0.02) {
          key = 's' + i;
          break;
        }
        if (f < a) {
          key = 'g' + i;
          break;
        }
        key = 'g' + (i + 1);
      }
      const inside = key.startsWith('s');
      if (inside || key !== t.key || force) {
        t.key = key;
        for (const a of t.anims) a.currentTime = ms;
      }
    }
  };

  /* ---------- 画面尺寸 ---------- */
  const w3d = world.querySelector<HTMLElement>('.w3d');
  const fitWorld = () => {
    const r = (w3d || world).getBoundingClientRect();
    const narrow = narrowMQ.matches;
    // 三层空间旋转之后比平面大：留出余量；手机上只用画面区域（文字在它上面），横向尽量铺满
    // 桌面上画面夹在左边的文字区（约 560px）和右边的幕进度点（约 100px）之间，不压到它们
    const ch = Number.parseFloat(getComputedStyle(root).getPropertyValue('--ch')) || 0;
    // 手机开场幕：画面区的上沿让到“向上滑动”提示之下（上沿淡出）
    const hint = root.querySelector<HTMLElement>('.s0 .scroll-hint');
    root.style.setProperty(
      '--pt0s',
      narrow && hint ? `${Math.max(0, Math.round(hint.getBoundingClientRect().bottom + 10 - (world.getBoundingClientRect().top + ch)))}px` : '0px',
    );
    const ws = narrow
      ? Math.min((r.width / 1000) * 1.04, (world.getBoundingClientRect().height - ch - 30) / 500)
      : Math.min((r.width - 660) / 880, r.height / 650, r.width / 1340);
    world.style.setProperty('--ws', ws.toFixed(4));
  };

  /* ---------- 影片时间 ↔ 幕 ---------- */
  const live = new Set<number>();
  let activeScene = -1;
  const status = (f: number) => {
    const s = sceneOf(f);
    for (let i = 0; i < scenes.length; i++) {
      const on = f >= MARKS[i] - 0.3 && f <= MARKS[i] + DURATIONS[i] + 0.3;
      if (on !== live.has(i)) {
        if (on) live.add(i);
        else live.delete(i);
        scenes[i].classList.toggle('live', on);
      }
    }
    if (s !== activeScene) {
      activeScene = s;
      dots.forEach((d, j) => (j === s ? d.setAttribute('aria-current', 'step') : d.removeAttribute('aria-current')));
      root.dataset.active = String(s);
      onScene(s);
    }
    ui.update(f);
    counters(f);
  };
  /** 收束幕的三个统计数字：进入本幕后从 0 滚动到目标值（影片时间的函数）；没有短片模式时直接是最终值 */
  const counts = [...root.querySelectorAll<HTMLElement>('.stats3 dt[data-count]')];
  const counted: number[] = [];
  const counters = (f: number) => {
    if (!isDyn()) return;
    const k = clamp((f - (MARKS[9] + 2.0)) / 0.8, 0, 1);
    const e = 1 - (1 - k) ** 3;
    counts.forEach((el, i) => {
      const v = Math.round(Number(el.dataset.count) * e);
      if (counted[i] !== v) {
        counted[i] = v;
        el.textContent = String(v);
      }
    });
  };
  const setF = (f: number) => {
    curF = clamp(f, 0, TOTAL);
    paint(curF);
    status(curF);
  };

  /* ---------- 舞台状态：idle 停在某一帧 / auto 自动播放到片尾 / run 播放到某一幕的结论帧 ---------- */
  type Mode = 'idle' | 'auto' | 'run';
  let mode: Mode = 'idle';
  let playing = false; // 自动播放（控制条的播放键按下）
  let runTo = 0;
  let navToken = 0;
  let tick = 0;
  let prevTs = 0;
  let autoTimer = 0;
  let fadeTimer = 0;
  let cleanups: (() => void)[] = [];
  const FADE_MS = 230;
  /* ---------- 声音：默认静音，用户点了才创建 AudioContext 并加载 audio.ts（自己的 chunk） ---------- */
  const hasAudio = !!(
    (window as unknown as { AudioContext?: unknown }).AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext
  );
  let engine: Engine | null = null;
  let soundOn = false;
  let quiet = false;
  let tipTimer = 0;
  const store = (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* 隐私模式：当作没记住 */
    }
  };
  const readStore = (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  };
  const enableSound = async () => {
    if (soundOn || !hasAudio) return;
    soundOn = true;
    ui.sound(true);
    store(SOUND_PREF, 'on');
    store(SOUND_TIP, '1');
    ui.showTip(false);
    try {
      if (!engine) {
        const m = await import('./audio.ts');
        if (!soundOn || ac.signal.aborted) return;
        engine = m.createEngine();
      }
      if (!engine) throw new Error('no audio');
      engine.setQuiet(quiet);
      await engine.ctx.resume();
      if (mode !== 'idle') engine.sync(curF, true);
    } catch {
      soundOn = false;
      ui.sound(false);
      ui.hideSound();
    }
  };
  const disableSound = () => {
    soundOn = false;
    ui.sound(false);
    store(SOUND_PREF, 'off');
    engine?.hush();
  };
  const showTip = () => {
    if (!hasAudio || soundOn || readStore(SOUND_TIP)) return;
    ui.showTip(true);
    window.clearTimeout(tipTimer);
    tipTimer = window.setTimeout(() => ui.showTip(false), 6000);
  };
  const stopTick = () => {
    if (tick) cancelAnimationFrame(tick);
    tick = 0;
  };
  /** 取消正在进行的一切（自动播放、播放到结论帧、淡入淡出）：每次新的跳转都先调它，以最后一次的目标为准 */
  const cancelMotion = () => {
    navToken++;
    window.clearTimeout(fadeTimer);
    window.clearTimeout(autoTimer);
    stopTick();
    if (playing) {
      playing = false;
      root.classList.remove('playing');
      ui.state(false);
    }
    mode = 'idle';
    root.dataset.nav = 'idle';
  };
  /** 停在某一帧之后：收束幕的结论帧上标 ended（主按钮的光环、控制条收起） */
  const rest = () => {
    const e = curF >= TOTAL - 0.05;
    root.classList.toggle('ended', e);
    ui.state(false, e);
    root.dataset.nav = 'idle';
  };
  const loop = (ts: number) => {
    tick = 0;
    if (mode === 'idle') return;
    const dt = Math.min(0.1 * speed(), ((ts - prevTs) / 1000) * speed());
    prevTs = ts;
    const limit = mode === 'run' ? runTo : TOTAL;
    const nf = Math.min(limit, curF + dt);
    curF = nf;
    paint(nf);
    status(nf);
    if (soundOn && engine) engine.sync(nf, true);
    if (nf >= limit - 1e-6) {
      const wasAuto = mode === 'auto';
      mode = 'idle';
      if (wasAuto) finish();
      else settle();
      return;
    }
    tick = requestAnimationFrame(loop);
  };
  const startMotion = (m: Mode, to: number) => {
    mode = m;
    runTo = to;
    root.dataset.nav = m;
    prevTs = performance.now();
    if (soundOn && engine) engine.sync(curF, true);
    tick = requestAnimationFrame(loop);
  };
  /** 播完一幕，停在结论帧 */
  function settle() {
    playing = false;
    root.classList.remove('playing');
    rest();
    if (curF >= TOTAL - 0.05) window.setTimeout(() => engine?.hush(1), 1500);
    else engine?.hush(0.8);
  }
  function finish() {
    playing = false;
    root.classList.remove('playing');
    rest();
    window.setTimeout(() => engine?.hush(), 1500);
  }
  function play(gesture = false) {
    if (!isDyn() || playing) return;
    cancelMotion();
    if (curF >= TOTAL - 0.05 || curF <= STOP[0] + 0.02) {
      setF(0);
      root.classList.remove('ended');
    }
    playing = true;
    playedOnce = true;
    root.classList.add('playing');
    root.classList.remove('ended');
    ui.state(true);
    if (gesture && !soundOn && readStore(SOUND_PREF) === 'on') void enableSound();
    else if (!soundOn) showTip();
    startMotion('auto', TOTAL);
  }
  function pause(_why: string) {
    const was = mode !== 'idle';
    cancelMotion();
    if (was) engine?.hush();
    rest();
  }
  /** 立刻切到某一帧（不淡入淡出）：只用在“同一幕内”或下一步马上继续播放的地方 */
  const cut = (f: number) => {
    setF(f);
    rest();
  };
  /** 淡出 → 目标帧淡入（可选：淡入后接着播放）。非相邻的跳转都走这里：中间的幕不播放，声音在约 150ms 内淡出 */
  function fadeJump(f: number, after?: () => void) {
    cancelMotion();
    const tok = ++navToken;
    root.dataset.nav = 'fade';
    root.classList.add('xf');
    engine?.hush(0.15);
    fadeTimer = window.setTimeout(() => {
      if (tok !== navToken) return;
      setF(f);
      rest();
      root.dataset.nav = 'fade';
      requestAnimationFrame(() => {
        if (tok !== navToken) return;
        root.classList.remove('xf');
        if (after) after();
        else root.dataset.nav = 'idle';
      });
    }, FADE_MS);
  }
  function step(dir: 1 | -1) {
    if (!isDyn()) return;
    const cur = sceneAt(curF);
    cancelMotion();
    root.classList.remove('xf');
    if (dir > 0) {
      if (cur >= 9) {
        if (curF < TOTAL - 0.05) cut(TOTAL);
        return;
      }
      if (curF < STOP[cur] - 0.02) cut(STOP[cur]);
      root.classList.remove('ended');
      ui.state(false);
      startMotion('run', STOP[cur + 1]);
    } else if (cur <= 0) {
      if (curF > 0.05) fadeJump(0);
    } else fadeJump(STOP[cur - 1]);
  }
  /** 去某一幕（进度条、幕进度指示、Home）：相邻就是普通的下一幕，否则淡入这一幕的起始帧再播放它 */
  function goto(k: number) {
    if (!isDyn()) return;
    k = clamp(k, 0, 9);
    if (k === sceneAt(curF) + 1) return step(1);
    fadeJump(START[k], () => {
      root.classList.remove('ended');
      ui.state(false);
      startMotion('run', STOP[k]);
    });
  }
  /** 跳过 / End：淡入收束幕的结论帧（时间轴画好、数字是最终值），不经过中间的幕 */
  const skipToEnd = () => fadeJump(TOTAL);
  const replay = () =>
    fadeJump(0, () => {
      root.classList.remove('ended');
      play(true);
    });

  const ui = createUi();

  /* ---------- 输入：一次手势只切一幕 ---------- */
  const stageEvent = (t: EventTarget | null) => t instanceof Node && root.contains(t);
  const menuOpen = () => !!document.querySelector('.rp-nav-screen, [role="dialog"]');
  /** 收束幕内容超过一屏时允许它在幕内正常滚动 */
  const innerScroll = (t: EventTarget | null, dir: number) => {
    const el = t instanceof Element ? t.closest<HTMLElement>('.sc-copy') : null;
    if (!el || !/auto|scroll/.test(getComputedStyle(el).overflowY) || el.scrollHeight <= el.clientHeight + 1) return false;
    return dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;
  };
  let lastWheel = 0;
  let lastWheelAbs = 0;
  let wheelAt = 0;
  addEventListener(
    'wheel',
    e => {
      if (!isDyn() || e.ctrlKey || !stageEvent(e.target) || menuOpen()) return;
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
      if (Math.abs(dy) < 4 || Math.abs(e.deltaX) > Math.abs(dy) * 1.5) return;
      const dir = dy > 0 ? 1 : -1;
      if (innerScroll(e.target, dir)) return;
      const now = performance.now();
      const gap = now - lastWheel;
      lastWheel = now;
      const abs = Math.abs(dy);
      // 新的一次手势：安静了 180ms 以上，或者惯性之后又明显加速（用户又推了一把）。惯性尾巴和连续的滚轮格子都算同一次
      const fresh = gap > 180 || (now - wheelAt > 700 && abs > lastWheelAbs * 1.6 + 10);
      lastWheelAbs = abs;
      if (!fresh) return;
      wheelAt = now;
      step(dir);
    },
    { passive: true, ...sig },
  );
  let tx = 0;
  let ty = 0;
  let tt = 0;
  let tOk = false;
  addEventListener(
    'touchstart',
    e => {
      tOk = isDyn() && e.touches.length === 1 && stageEvent(e.target) && !menuOpen() && !(e.target as Element).closest?.('.player, .rail');
      if (!tOk) return;
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
      tt = performance.now();
    },
    { passive: true, ...sig },
  );
  addEventListener(
    'touchmove',
    e => {
      if (e.touches.length > 1) tOk = false;
    },
    { passive: true, ...sig },
  );
  addEventListener('touchcancel', () => (tOk = false), { passive: true, ...sig });
  addEventListener(
    'touchend',
    e => {
      if (!tOk) return;
      tOk = false;
      const t = e.changedTouches[0];
      const dy = ty - t.clientY;
      const dx = tx - t.clientX;
      const dt = Math.max(1, performance.now() - tt);
      const far = Math.abs(dy) >= 48 || (Math.abs(dy) >= 24 && Math.abs(dy) / dt > 0.4);
      if (!far || Math.abs(dy) < Math.abs(dx) * 1.2) return;
      const dir = dy > 0 ? 1 : -1;
      if (innerScroll(e.target, dir)) return;
      step(dir);
    },
    { passive: true, ...sig },
  );
  addEventListener(
    'keydown',
    e => {
      if (!isDyn() || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || menuOpen()) return;
      const t = e.target as HTMLElement | null;
      if (t && (/^(INPUT|TEXTAREA|SELECT|A|BUTTON|SUMMARY)$/.test(t.tagName) || t.isContentEditable || t.closest?.('.player, [role="button"]'))) return;
      const k = e.key;
      if (['ArrowDown', 'PageDown', ' ', 'Spacebar'].includes(k)) {
        e.preventDefault();
        if (!e.repeat) step(1);
      } else if (['ArrowUp', 'PageUp'].includes(k)) {
        e.preventDefault();
        if (!e.repeat) step(-1);
      } else if (k === 'Home') {
        e.preventDefault();
        if (!e.repeat) goto(0);
      } else if (k === 'End') {
        e.preventDefault();
        if (!e.repeat) skipToEnd();
      }
    },
    sig,
  );
  addEventListener(
    'resize',
    () => {
      fitWorld();
      if (builtFor !== null && builtFor !== narrowMQ.matches) void build().then(buildDynamic);
      else {
        window.clearTimeout(dynTimer);
        dynTimer = window.setTimeout(buildDynamic, 250);
      }
    },
    { passive: true, ...sig },
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (!document.hidden || mode === 'idle') return;
      if (mode === 'auto') {
        pause('hidden');
        ui.needResume();
      } else {
        const to = runTo;
        cancelMotion();
        cut(to);
        engine?.hush();
      }
    },
    sig,
  );
  reduceMQ.addEventListener(
    'change',
    () => {
      if (reduceMQ.matches) {
        cancelMotion();
        engine?.hush();
        destroyAnims();
      } else {
        fitWorld();
        void build();
        setF(curF);
      }
      ui.show(!reduceMQ.matches);
    },
    sig,
  );

  /* ---------- 播放控制条 ---------- */
  function createUi() {
    const bar = document.createElement('div');
    bar.className = 'player';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', '短片播放控制');
    const icon = (d: string) =>
      `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="${d}" fill="currentColor"/></svg>`;
    const I = {
      play: icon('M8 5v14l11-7z'),
      pause: icon('M6 5h4v14H6zM14 5h4v14h-4z'),
      prev: icon('M6 6h2v12H6zM9.5 12 18 6v12z'),
      next: icon('M16 6h2v12h-2zM6 18V6l8.5 6z'),
      replay: icon('M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z'),
      spk: icon('M3 9v6h4l5 4V5L7 9zM16 8.5a5 5 0 0 1 0 7l-1.4-1.4a3 3 0 0 0 0-4.2zM18.8 5.7a9 9 0 0 1 0 12.6l-1.4-1.4a7 7 0 0 0 0-9.8z'),
    };
    bar.innerHTML = `
      <button type="button" class="play" aria-pressed="false" aria-label="播放短片">${I.play}</button>
      <button type="button" class="prev" aria-label="上一幕">${I.prev}</button>
      <div class="scrub" role="slider" tabindex="0" aria-label="播放进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="开场">
        ${DURATIONS.map((d, i) => `<span class="seg" style="flex:${d}" data-i="${i}"><i></i></span>`).join('')}
        <span class="tip" aria-hidden="true"></span>
      </div>
      <button type="button" class="next" aria-label="下一幕">${I.next}</button>
      <button type="button" class="replay" aria-label="重播">${I.replay}</button>
      <button type="button" class="snd" aria-pressed="false" aria-label="声音（配乐）">${I.spk}<span class="snd-t">声音</span></button>
      <button type="button" class="vol" aria-pressed="false" aria-label="音量：正常。点一下改成小声" hidden>正常</button>
      <a class="skip" href="#scene-9"><span class="sk-long">跳过，</span>开始学习 →</a>`;
    const live = document.createElement('div');
    live.className = 'live-region';
    live.setAttribute('aria-live', 'polite');
    const q = <T extends HTMLElement>(s: string) => bar.querySelector(s) as T;
    const playBtn = q<HTMLButtonElement>('.play');
    const scrub = q<HTMLElement>('.scrub');
    const scrubTip = q<HTMLElement>('.tip');
    const segs = [...bar.querySelectorAll<HTMLElement>('.seg i')];
    let resume = false;
    const lastFill: number[] = [];
    const tip = document.createElement('button');
    tip.type = 'button';
    tip.className = 'snd-tip';
    tip.hidden = true;
    tip.textContent = '🔊 开启配乐';
    slot?.append(bar, tip, live);

    const setBtn = (isPlaying: boolean, ended = false) => {
      playBtn.setAttribute('aria-pressed', String(isPlaying));
      playBtn.innerHTML = isPlaying ? I.pause : I.play;
      playBtn.setAttribute('aria-label', isPlaying ? '暂停短片' : ended ? '重播短片' : resume ? '继续播放短片' : '播放短片');
      if (filmBtn) filmBtn.hidden = !isDyn() || isPlaying;
    };
    playBtn.addEventListener('click', () => (playing ? pause('button') : play(true)), sig);
    q('.prev').addEventListener('click', () => step(-1), sig);
    q('.next').addEventListener('click', () => step(1), sig);
    q('.replay').addEventListener('click', replay, sig);
    // “跳过，开始学习”：不在收束幕时是跳到收束幕的结论帧；已经在收束幕时它就是进入学习的链接（href 换成主按钮的地址，不拦截）
    const skip = q<HTMLAnchorElement>('.skip');
    skip.addEventListener(
      'click',
      e => {
        if (activeScene === 9) return;
        e.preventDefault();
        skipToEnd();
      },
      sig,
    );
    filmBtn?.addEventListener('click', () => play(true), sig);
    const sndBtn = q<HTMLButtonElement>('.snd');
    const volBtn = q<HTMLButtonElement>('.vol');
    const paintVol = () => {
      volBtn.textContent = quiet ? '小声' : '正常';
      volBtn.setAttribute('aria-pressed', String(quiet));
      volBtn.setAttribute('aria-label', quiet ? '音量：小声。点一下改成正常' : '音量：正常。点一下改成小声');
    };
    quiet = readStore(SOUND_VOL) === 'quiet';
    paintVol();
    volBtn.addEventListener(
      'click',
      () => {
        quiet = !quiet;
        store(SOUND_VOL, quiet ? 'quiet' : 'normal');
        paintVol();
        engine?.setQuiet(quiet);
      },
      sig,
    );
    if (!hasAudio) sndBtn.hidden = true;
    sndBtn.addEventListener('click', () => (soundOn ? disableSound() : void enableSound()), sig);
    tip.addEventListener('click', () => void enableSound(), sig);
    // 进度条：按幕分段。点某一段进入那一幕；拖动时只更新提示（幕名）和高亮的段，松手后才跳转，不在拖动过程中擦洗画面
    const segEls = [...bar.querySelectorAll<HTMLElement>('.seg')];
    const sceneAtX = (e: PointerEvent) => {
      const x = e.clientX;
      for (let i = 0; i < segEls.length; i++) if (x <= segEls[i].getBoundingClientRect().right + 1) return i;
      return segEls.length - 1;
    };
    const tipAt = (e: PointerEvent, i: number) => {
      const r = scrub.getBoundingClientRect();
      scrubTip.textContent = SCENE_NAMES[i];
      scrubTip.style.opacity = '1';
      scrubTip.style.transform = `translateX(${clamp(e.clientX - r.left - 40, 0, Math.max(0, r.width - 160))}px)`;
      segEls.forEach((el, j) => el.classList.toggle('hot', j === i));
    };
    let dragging = false;
    scrub.addEventListener(
      'pointerdown',
      e => {
        dragging = true;
        scrub.setPointerCapture(e.pointerId);
        tipAt(e, sceneAtX(e));
      },
      sig,
    );
    scrub.addEventListener('pointermove', e => (dragging || e.pointerType === 'mouse') && tipAt(e, sceneAtX(e)), sig);
    scrub.addEventListener(
      'pointerup',
      e => {
        if (!dragging) return;
        dragging = false;
        const i = sceneAtX(e);
        segEls.forEach(el => el.classList.remove('hot'));
        if (e.pointerType !== 'mouse') scrubTip.style.opacity = '0';
        goto(i);
      },
      sig,
    );
    scrub.addEventListener(
      'pointercancel',
      () => {
        dragging = false;
        segEls.forEach(el => el.classList.remove('hot'));
        scrubTip.style.opacity = '0';
      },
      sig,
    );
    scrub.addEventListener(
      'pointerleave',
      () => {
        if (dragging) return;
        scrubTip.style.opacity = '0';
        segEls.forEach(el => el.classList.remove('hot'));
      },
      sig,
    );
    scrub.addEventListener(
      'focus',
      () => {
        scrubTip.textContent = SCENE_NAMES[activeScene];
        scrubTip.style.opacity = '1';
      },
      sig,
    );
    scrub.addEventListener('blur', () => (scrubTip.style.opacity = '0'), sig);
    // 键盘：只在播放器获得焦点时。空格播放/暂停（按钮自己会处理空格），左右方向键切幕
    bar.addEventListener(
      'keydown',
      e => {
        const onButton = (e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'A';
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          step(1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          step(-1);
        } else if ((e.key === ' ' || e.key === 'Spacebar') && !onButton) {
          e.preventDefault();
          if (mode !== 'idle') pause('key');
          else play();
        } else if (e.key === 'Home') {
          e.preventDefault();
          goto(0);
        } else if (e.key === 'End') {
          e.preventDefault();
          skipToEnd();
        }
      },
      sig,
    );
    return {
      state: setBtn,
      sound(on: boolean) {
        sndBtn.setAttribute('aria-pressed', String(on));
        sndBtn.classList.toggle('on', on);
        volBtn.hidden = !on;
      },
      hideSound() {
        sndBtn.hidden = true;
        volBtn.hidden = true;
        tip.hidden = true;
      },
      showTip(on: boolean) {
        tip.hidden = !on || !hasAudio;
      },
      needResume() {
        resume = true;
        setBtn(false);
        if (filmBtn) filmBtn.textContent = '▶ 继续播放';
      },
      show(on: boolean) {
        bar.hidden = !on;
        if (filmBtn) filmBtn.hidden = !on || playing;
      },
      update(f: number) {
        const s = sceneOf(f);
        segs.forEach((el, i) => {
          const v = Math.round(clamp((f - MARKS[i]) / DURATIONS[i], 0, 1) * 1000) / 1000;
          if (lastFill[i] !== v) {
            lastFill[i] = v;
            el.style.transform = `scaleX(${v})`;
          }
        });
        const pct = Math.round((f / TOTAL) * 100);
        if (scrub.getAttribute('aria-valuenow') !== String(pct)) {
          scrub.setAttribute('aria-valuenow', String(pct));
          scrub.setAttribute('aria-valuetext', `第 ${s} 幕：${SCENE_NAMES[s]}`);
        }
      },
      announce(s: number) {
        live.textContent = `第 ${s} 幕：${SCENE_NAMES[s]}`;
      },
      /** 收束幕里“跳过”就是进入学习的链接，其他幕里是“跳过，开始学习”（跳到收束幕） */
      skipFor(s: number) {
        const main = root.querySelector<HTMLAnchorElement>('.s9 .btn.primary');
        if (s === 9 && main) {
          skip.setAttribute('href', main.getAttribute('href') || '#scene-9');
          skip.setAttribute('aria-label', '开始学习');
        } else {
          skip.setAttribute('href', '#scene-9');
          skip.removeAttribute('aria-label');
        }
      },
    };
  }
  const onScene = (s: number) => {
    ui.announce(s);
    ui.skipFor(s);
  };

  /* ---------- 幕进度指示（圆点）和锚点 ---------- */
  dots.forEach((d, i) => {
    d.addEventListener(
      'click',
      e => {
        if (!isDyn()) return;
        e.preventDefault();
        goto(i);
      },
      sig,
    );
  });

  function maybeAutoplay() {
    // 每次打开或刷新首页都自动播放（回访者也一样）；站内跳走再回来不重放；带 hash、减少动画、标签页在后台时不播
    if (!isDyn() || playedOnce || location.hash || document.hidden || (window as unknown as { __storyNoAuto?: boolean }).__storyNoAuto) return;
    autoTimer = window.setTimeout(() => {
      if (!playing && mode === 'idle' && !document.hidden) {
        playedOnce = true;
        play();
      }
    }, 1200);
  }

  /* ---------- 启动 ---------- */
  fitWorld();
  const start = () => {
    root.classList.add('ready');
    maybeAutoplay();
  };
  if (isDyn()) {
    ui.show(true);
    build().then(() => {
      buildDynamic();
      start();
    });
  } else {
    ui.show(false);
    start();
  }
  ui.state(false);
  if (filmBtn) filmBtn.hidden = !isDyn();
  const hashed = /^#scene-\d$/.test(location.hash);
  if (hashed && isDyn()) {
    const i = Number(location.hash.slice(-1));
    setF(i === 0 ? 0 : STOP[i]);
    rest();
  } else {
    // 马上要自动播放：从 0 开始（开场的线条一笔笔画出来）；不自动播放时停在开场的结论帧，别让人看一张空白的画面
    const willAuto = isDyn() && !playedOnce && !location.hash && !document.hidden && !(window as unknown as { __storyNoAuto?: boolean }).__storyNoAuto;
    setF(willAuto ? 0 : STOP[0]);
  }
  // 测试钩子：只有测试页面设了 window.__storyTest 才会有。读音频状态、离线渲染整段配乐做检查
  if ((window as unknown as { __storyTest?: boolean }).__storyTest) {
    (window as unknown as { __storyHook?: unknown }).__storyHook = {
      audio: () => ({ on: soundOn, created: !!engine, state: engine?.ctx.state ?? null, level: engine?.level() ?? 0, playing, info: engine?.info() ?? null }),
      /** 舞台状态：影片时间、当前幕、模式（idle / auto / run / fade）、有没有标 ended */
      nav: () => ({
        f: curF,
        scene: sceneAt(curF),
        mode: root.dataset.nav || 'idle',
        ended: root.classList.contains('ended'),
        xf: root.classList.contains('xf'),
      }),
      /** 和滑动、滚轮、按键同一个入口（Playwright 的移动版 WebKit 发不出滑动和滚轮，只能用它） */
      step: (dir: 1 | -1) => step(dir),
      /** 直接把画面放到影片时间 f（测试取景用） */
      at: (f: number) => {
        cancelMotion();
        root.classList.remove('xf');
        cut(f);
      },
      render: async () => {
        const [a, an] = await Promise.all([import('./audio.ts'), import('./logic/scoreAnalysis.ts')]);
        const r = await a.renderOffline();
        return an.analyzeAndEncode(r.left, r.right, r.sampleRate);
      },
    };
  }

  return () => {
    ac.abort();
    window.clearTimeout(autoTimer);
    window.clearTimeout(dynTimer);
    window.clearTimeout(tipTimer);
    engine?.dispose();
    engine = null;
    delete (window as unknown as { __storyHook?: unknown }).__storyHook;
    cancelMotion();
    window.clearTimeout(fadeTimer);
    playing = false;
    destroyAnims();
    slot?.replaceChildren();
    for (const c of cleanups) c();
    cleanups = [];
    if (addedDyn) html.classList.remove(DYN);
    scenes.forEach(s => s.classList.remove('live'));
    root.classList.remove('ready', 'playing', 'ended', 'xf');
    delete root.dataset.nav;
    delete root.dataset.mode;
  };
}
