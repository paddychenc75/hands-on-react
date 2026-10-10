/* 首页短片的配乐和音效：用 Web Audio API 现场合成，没有任何音频文件。
 * 只有用户在播放器上打开声音时，story.ts 才会动态 import 这个文件（自己的 chunk），不开声音的访客不会加载它。
 *
 * 音乐是“影片时间的函数”：scheduleScore(ctx, out, from, to, when) 给定任何 BaseAudioContext，把影片时间 [from, to) 里的所有声音
 * 排到 ctx 的时间 when 开始的位置。在线（AudioContext，前瞻调度）和离线（OfflineAudioContext，整段渲染成 WAV 来检查）共用这一个函数。
 * 排好的声音全部走一条母线：压缩器限幅、整体响度适中，开头淡入、结尾淡出。
 *
 * 想调听感，改下面这几处（都有注释）：KEY / CHORDS（调式和每一幕的和弦）、LEVEL（整体音量和各层的相对音量）、ARP（每幕的脉搏：速度、音色、八度）。 */
import { CUE, DURATIONS, MARKS, NODES, STALL_HITS, TOTAL, depthOf, subtree } from './logic/filmData.ts';

/* ---------------- 可以调的参数 ---------------- */
/** D 小调。每一幕一个和弦（MIDI 音高）：从“简单、空”走向“丰富、明亮”，收束幕落在主和弦（Dm add9）上 */
export const CHORDS: number[][] = [
  [38, 45, 50], // 0 开场：D 5 度，空
  [38, 45, 50, 57], // 1 手动改 DOM：还是空，略带不安
  [38, 45, 53, 57, 62], // 2 Dm
  [34, 46, 53, 57, 62], // 3 Bb maj7
  [43, 50, 58, 62, 65], // 4 Gm7
  [41, 48, 57, 60, 64], // 5 F maj7
  [46, 53, 57, 60, 62], // 6 Bb maj9：明亮
  [41, 48, 57, 64, 67], // 7 F maj9
  [45, 52, 55, 60, 64], // 8 Am7：织体变干净
  [38, 45, 53, 57, 64], // 9 Dm add9：落回主和弦
];
export const LEVEL = {
  /** 母线整体音量（压缩器之前）。峰值要低于 -3 dBFS，改大前先跑 e2e 里的离线检查 */
  master: 0.8,
  pad: 0.11,
  arp: 0.1,
  sfx: 1.0,
  /** 手动擦洗（没有在自动播放）时只保留一层铺底，音量降这么多 */
  manualPad: 0.45,
};
/** 脉搏：每一幕的节拍间隔（秒）、音高相对和弦的八度偏移、音色。第 4 幕是规整的十六分音符“切片感”。null = 这一幕没有脉搏 */
export const ARP: ({ step: number; oct: number; type: OscillatorType; decay: number; from: number; to: number; pan?: 'sweep' } | null)[] = [
  null,
  null,
  { step: 0.5, oct: 1, type: 'triangle', decay: 0.5, from: MARKS[2] + 0.8, to: MARKS[3] - 0.2 },
  { step: 0.5, oct: 1, type: 'triangle', decay: 0.5, from: MARKS[3] + 0.5, to: MARKS[4] - 0.2 },
  { step: 0.25, oct: 1, type: 'sine', decay: 0.16, from: CUE.smooth, to: MARKS[5] - 0.1 },
  { step: 0.4, oct: 2, type: 'sine', decay: 0.4, from: MARKS[5] + 0.3, to: MARKS[6] - 0.1 },
  { step: 0.5, oct: 1, type: 'triangle', decay: 0.45, from: MARKS[6] + 0.5, to: MARKS[7] - 0.2 },
  { step: 0.5, oct: 1, type: 'triangle', decay: 0.5, from: MARKS[7] + 0.5, to: MARKS[8] - 0.2, pan: 'sweep' },
  { step: 1, oct: 1, type: 'sine', decay: 0.8, from: MARKS[8] + 0.6, to: MARKS[9] - 0.2 },
  null,
];

/* ---------------- 底层小工具 ---------------- */
export interface Out {
  dry: AudioNode;
  rev: AudioNode;
  del: AudioNode;
}
export interface Bus {
  master: GainNode;
  /** 一个“世代”的入口：再次排程（拖进度条、换幕）时，旧世代整体淡出 */
  epoch(): Epoch;
}
export interface Epoch extends Out {
  kill(ctx: BaseAudioContext, at: number): void;
}
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);
let seed = 1;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();
function noise(ctx: BaseAudioContext): AudioBuffer {
  let b = noiseCache.get(ctx);
  if (!b) {
    seed = 7;
    b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1;
    noiseCache.set(ctx, b);
  }
  return b;
}
function impulse(ctx: BaseAudioContext, sec = 2.6): AudioBuffer {
  seed = 11;
  const n = Math.floor(ctx.sampleRate * sec);
  const b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      lp += (rnd() * 2 - 1 - lp) * 0.35; // 去掉刺耳的高频
      d[i] = lp * (1 - i / n) ** 2.6;
    }
  }
  return b;
}

/** 母线：压缩器限幅 → 微调 → 输出。混响用程序生成的脉冲响应，延迟带反馈。 */
export function createBus(ctx: BaseAudioContext, dest: AudioNode, level = LEVEL.master): Bus {
  const master = ctx.createGain();
  master.gain.value = level;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 18;
  comp.ratio.value = 10;
  comp.attack.value = 0.004;
  comp.release.value = 0.25;
  const trim = ctx.createGain();
  trim.gain.value = 0.9;
  master.connect(comp).connect(trim).connect(dest);
  const dryBus = ctx.createGain();
  dryBus.connect(master);
  const conv = ctx.createConvolver();
  conv.buffer = impulse(ctx);
  const revG = ctx.createGain();
  revG.gain.value = 0.55;
  const revIn = ctx.createGain();
  revIn.connect(conv).connect(revG).connect(master);
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.375;
  const fb = ctx.createGain();
  fb.gain.value = 0.34;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2400;
  const delIn = ctx.createGain();
  const delOut = ctx.createGain();
  delOut.gain.value = 0.5;
  delIn.connect(delay);
  delay.connect(lp).connect(fb).connect(delay);
  lp.connect(delOut).connect(master);
  return {
    master,
    epoch() {
      const dry = ctx.createGain();
      const rev = ctx.createGain();
      const del = ctx.createGain();
      dry.connect(dryBus);
      rev.connect(revIn);
      del.connect(delIn);
      return {
        dry,
        rev,
        del,
        kill(c, at) {
          for (const g of [dry, rev, del]) {
            g.gain.cancelScheduledValues(at);
            g.gain.setTargetAtTime(0, at, 0.05);
          }
          setTimeout(() => {
            for (const g of [dry, rev, del]) g.disconnect();
          }, 900);
          void c;
        },
      };
    },
  };
}

interface VoiceOpts {
  pan?: number;
  rev?: number;
  del?: number;
}
/** 把一个声音节点接到世代的干声 / 混响发送 / 延迟发送 */
function route(ctx: BaseAudioContext, o: Out, node: AudioNode, v: VoiceOpts = {}): void {
  const p = ctx.createStereoPanner();
  p.pan.value = v.pan ?? 0;
  node.connect(p);
  p.connect(o.dry);
  if (v.rev) {
    const g = ctx.createGain();
    g.gain.value = v.rev;
    p.connect(g).connect(o.rev);
  }
  if (v.del) {
    const g = ctx.createGain();
    g.gain.value = v.del;
    p.connect(g).connect(o.del);
  }
}
function env(ctx: BaseAudioContext, t: number, a: number, peak: number, d: number): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  return g;
}
function tone(
  ctx: BaseAudioContext,
  o: Out,
  t: number,
  f: number,
  type: OscillatorType,
  a: number,
  d: number,
  peak: number,
  v: VoiceOpts = {},
  f2?: number,
): void {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t);
  if (f2) osc.frequency.exponentialRampToValueAtTime(f2, t + a + d);
  const g = env(ctx, t, a, peak, d);
  osc.connect(g);
  route(ctx, o, g, v);
  osc.start(t);
  osc.stop(t + a + d + 0.05);
}
/** 带通滤波的噪声：f0 扫到 f1 */
function sweep(ctx: BaseAudioContext, o: Out, t: number, dur: number, f0: number, f1: number, q: number, peak: number, v: VoiceOpts = {}, pan1?: number): void {
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = q;
  bp.frequency.setValueAtTime(f0, t);
  bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + Math.min(dur * 0.4, 0.07));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g);
  if (pan1 !== undefined) {
    const p = ctx.createStereoPanner();
    p.pan.setValueAtTime(v.pan ?? 0, t);
    p.pan.linearRampToValueAtTime(pan1, t + dur);
    g.connect(p);
    p.connect(o.dry);
    if (v.rev) {
      const r = ctx.createGain();
      r.gain.value = v.rev;
      p.connect(r).connect(o.rev);
    }
  } else route(ctx, o, g, v);
  src.start(t, 0.1);
  src.stop(t + dur + 0.05);
}
function click(ctx: BaseAudioContext, o: Out, t: number, f: number, peak: number, pan = 0): void {
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx);
  const hp = ctx.createBiquadFilter();
  hp.type = 'bandpass';
  hp.frequency.value = f;
  hp.Q.value = 0.9;
  const g = ctx.createGain();
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
  src.connect(hp).connect(g);
  route(ctx, o, g, { pan });
  src.start(t, 0.3);
  src.stop(t + 0.06);
}
/** 铺底：两个去谐的锯齿波叠加 + 低通滤波器缓慢开合 */
function pad(ctx: BaseAudioContext, o: Out, t: number, dur: number, f: number, pan: number, peak: number, fade: number): void {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + fade);
  g.gain.setValueAtTime(peak, t + dur - 1.6);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 0.8;
  lp.frequency.setValueAtTime(380, t);
  lp.frequency.linearRampToValueAtTime(1500, t + dur * 0.7);
  lp.frequency.linearRampToValueAtTime(700, t + dur);
  for (const cents of [-7, 6]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = f;
    osc.detune.value = cents;
    osc.connect(lp);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
  lp.connect(g);
  route(ctx, o, g, { pan, rev: 0.7 });
}

/* ---------------- 排程：影片时间 [from, to) → ctx 时间 when 起 ---------------- */
export interface ScheduleOpts {
  /** 从中途开始：把正在响的铺底补上（淡入） */
  catchUp?: boolean;
  /** 只排铺底（手动擦洗时） */
  padOnly?: boolean;
}
export function scheduleScore(ctx: BaseAudioContext, o: Out, from: number, to: number, when: number, opts: ScheduleOpts = {}): void {
  const at = (t: number) => when + (t - from);
  const inR = (t: number) => t >= from && t < to;
  const sfx = LEVEL.sfx;

  /* 铺底：每一幕一个和弦，前后重叠，和声随时代推进 */
  for (let i = 0; i < CHORDS.length; i++) {
    const a = i === 0 ? 0 : MARKS[i] - 0.6;
    const b = i === CHORDS.length - 1 ? TOTAL + 1.2 : MARKS[i + 1] + 1.0;
    const started = inR(a);
    const cover = opts.catchUp && a < from && b > from + 0.5;
    if (!started && !cover) continue;
    const ts = started ? a : from;
    const level = LEVEL.pad * (0.7 + 0.04 * i) * (opts.padOnly ? LEVEL.manualPad : 1);
    CHORDS[i].forEach((m, j) =>
      pad(ctx, o, at(ts), b - ts, hz(m), (j / Math.max(1, CHORDS[i].length - 1) - 0.5) * 0.8, level / Math.sqrt(CHORDS[i].length / 3), started ? 1.8 : 0.8),
    );
  }
  if (opts.padOnly) return;

  /* 脉搏：琶音，每一幕的速度和音色不同 */
  ARP.forEach((cfg, i) => {
    if (!cfg) return;
    const chord = CHORDS[i];
    const tones = [chord[1], chord[2], chord[3] ?? chord[2] + 12, chord[4] ?? chord[1] + 12];
    const n = Math.floor((cfg.to - cfg.from) / cfg.step);
    for (let s = 0; s < n; s++) {
      const t = cfg.from + s * cfg.step;
      if (!inR(t)) continue;
      const m = tones[[0, 1, 2, 3, 2, 1][s % 6] % tones.length] + 12 * cfg.oct;
      const pan = cfg.pan === 'sweep' ? ((t - cfg.from) / (cfg.to - cfg.from)) * 1.7 - 0.85 : Math.sin(s * 0.9) * 0.25;
      tone(ctx, o, at(t), hz(m), cfg.type, 0.008, cfg.decay, LEVEL.arp, { pan, rev: 0.35, del: 0.5 });
    }
  });

  /* 第 1 幕：漏改的那一块，一个轻微的不协和音（D 和降 E 的小二度） */
  if (inR(CUE.miss)) {
    tone(ctx, o, at(CUE.miss), 293.66, 'triangle', 0.02, 0.7, 0.16 * sfx * 2, { pan: 0.3, rev: 0.4 });
    tone(ctx, o, at(CUE.miss), 311.13, 'triangle', 0.02, 0.7, 0.16 * sfx * 2, { pan: 0.3, rev: 0.4 });
  }
  /* 第 2 幕：光沿树逐层点亮，每个节点一个音，音高按层级上行 */
  const scale = [74, 77, 81, 84];
  for (const id of subtree('App')) {
    const d = depthOf(id);
    const t = CUE.lightStart + d * CUE.lightGap;
    if (!inR(t)) continue;
    const node = NODES.find(n => n.id === id) as (typeof NODES)[number];
    const idx = NODES.indexOf(node);
    const tt = t + (idx % 3) * 0.03;
    tone(ctx, o, at(tt), hz(scale[d]), 'sine', 0.004, 0.55, 0.34 * sfx, { pan: (node.x / 1000) * 1.4 - 0.7, rev: 0.6, del: 0.45 });
    tone(ctx, o, at(tt), hz(scale[d] + 12), 'sine', 0.004, 0.22, 0.08 * sfx, { pan: (node.x / 1000) * 1.4 - 0.7, rev: 0.6 });
  }
  /* 第 3 幕：光束落到 DOM 层，一个柔和的低频“落点”加波纹般的尾音 */
  if (inR(CUE.land)) {
    tone(ctx, o, at(CUE.land), 80, 'sine', 0.01, 0.8, 0.5 * sfx, { rev: 0.3 }, 38);
    sweep(ctx, o, at(CUE.land) + 0.05, 1.5, 1800, 260, 4, 0.2 * sfx, { rev: 0.8, pan: -0.2 }, 0.3);
    click(ctx, o, at(CUE.land) + 0.18, 900, 0.05 * sfx);
  }
  /* 第 4 幕：掉帧，节拍被“卡住”的顿挫（不规则的低频闷响） */
  for (const i of STALL_HITS) {
    const t = CUE.stallStart + i * 0.1;
    if (!inR(t)) continue;
    tone(ctx, o, at(t), 120 - (i % 3) * 14, 'square', 0.002, 0.11, 0.38 * sfx, { pan: i % 2 ? 0.2 : -0.2 });
  }
  /* 第 5 幕：卡片翻转的 swish，钩子挂上去的“叮” */
  if (inR(CUE.flip + 0.1)) sweep(ctx, o, at(CUE.flip + 0.1), 0.5, 500, 3200, 2, 0.18 * sfx, { rev: 0.4 }, 0.6);
  if (inR(CUE.attach)) {
    tone(ctx, o, at(CUE.attach), 660, 'triangle', 0.003, 0.5, 0.2 * sfx, { rev: 0.6, del: 0.4, pan: 0.2 });
    tone(ctx, o, at(CUE.attach) + 0.01, 990, 'sine', 0.003, 0.35, 0.1 * sfx, { rev: 0.6 });
  }
  // 后面三个钩子：同一个音色，音高依次上行；自定义 Hook 被复制到第二张卡片：一个更高更短的“叮”
  CUE.hooks.forEach((t, j) => {
    if (!inR(t)) return;
    tone(ctx, o, at(t), [740, 831, 988][j], 'triangle', 0.003, 0.45, 0.3 * sfx, { rev: 0.6, del: 0.4, pan: 0.2 + j * 0.05 });
    tone(ctx, o, at(t) + 0.01, [1109, 1245, 1480][j], 'sine', 0.003, 0.3, 0.09 * sfx, { rev: 0.6 });
  });
  if (inR(CUE.hookCopy)) {
    tone(ctx, o, at(CUE.hookCopy), 1480, 'triangle', 0.003, 0.4, 0.28 * sfx, { rev: 0.6, del: 0.5, pan: -0.2 });
    tone(ctx, o, at(CUE.hookCopy) + 0.01, 1976, 'sine', 0.003, 0.3, 0.09 * sfx, { rev: 0.6 });
  }
  /* 第 6 幕：被打断的渲染丢弃（一个下滑音）；紧急更新插队（明亮的拨弦）；随后更急更亮的声部 */
  if (inR(CUE.urgent - 0.35)) tone(ctx, o, at(CUE.urgent - 0.35), 520, 'sawtooth', 0.01, 0.3, 0.07 * sfx, { rev: 0.3 }, 170);
  [0, 0.09, 0.18].forEach((dt, j) => {
    if (inR(CUE.urgent + dt)) tone(ctx, o, at(CUE.urgent + dt), hz([86, 93, 98][j]), 'triangle', 0.002, 0.5, 0.4 * sfx, { pan: 0.35, rev: 0.5, del: 0.5 });
  });
  const urgentLine = [74, 81, 86, 81, 77, 84, 86, 89];
  for (let s = 0; s < 22; s++) {
    const t = CUE.urgent + 0.5 + s * 0.125;
    if (t > CUE.redo || !inR(t)) continue;
    tone(ctx, o, at(t), hz(urgentLine[s % 8] + 12), 'triangle', 0.003, 0.14, 0.09 * sfx, { pan: 0.4, rev: 0.3, del: 0.4 });
  }
  /* 第 7 幕：三串光点依次飞向右边（声像从左流向右），落位时一个“叮”；带闪电的两块再多一个明亮的通电音；Action 是反向的光 */
  for (let i = 0; i < 3; i++) {
    const L = CUE.launch(i);
    const A = CUE.arrive(i);
    if (inR(L)) sweep(ctx, o, at(L), A - L, 600, 3200, 3, 0.4 * sfx, { pan: -0.8, rev: 0.4 }, 0.8);
    if (inR(A)) {
      tone(ctx, o, at(A), hz(81 + i * 3), 'sine', 0.003, 0.5, 0.38 * sfx, { pan: 0.3 + i * 0.15, rev: 0.6, del: 0.3 });
      if (i > 0) {
        tone(ctx, o, at(A) + 0.1, 1800, 'sawtooth', 0.002, 0.18, 0.06 * sfx, { pan: 0.5 }, 3400);
        tone(ctx, o, at(A) + 0.12, hz(93), 'sine', 0.002, 0.4, 0.12 * sfx, { pan: 0.5, rev: 0.7 });
      }
    }
  }
  if (inR(CUE.action)) sweep(ctx, o, at(CUE.action), 1.1, 3000, 500, 3, 0.6 * sfx, { pan: 0.8, rev: 0.4 }, -0.8);
  /* 第 8 幕：编译器的扫描线，一个滤波器扫频 */
  if (inR(CUE.scan)) sweep(ctx, o, at(CUE.scan), 1.3, 300, 5200, 7, 0.26 * sfx, { rev: 0.4 }, 0.4);
  /* 年份数字滚动的“咔哒”；换幕的 whoosh */
  for (const i of [2, 4, 5, 6, 7, 8]) {
    const t = CUE.tick(i);
    if (inR(t)) {
      click(ctx, o, at(t), 2600, 2.0 * sfx);
      click(ctx, o, at(t) + 0.13, 2200, 1.4 * sfx);
    }
  }
  for (let i = 1; i <= 9; i++) {
    const t = CUE.whoosh(i);
    if (inR(t)) sweep(ctx, o, at(t), 0.8, 500, 2600, 0.8, 0.8 * sfx, { rev: 0.5, pan: i % 2 ? -0.4 : 0.4 }, i % 2 ? 0.4 : -0.4);
  }
  /* 收束：三层空间缩成一个点（上行的滑音），落成时间轴上的最后一个点（一个和弦的“叮”） */
  if (inR(MARKS[9] + 0.2)) tone(ctx, o, at(MARKS[9] + 0.2), 220, 'sine', 0.3, 1.1, 0.12 * sfx, { rev: 0.5 }, 880);
  if (inR(CUE.fin)) {
    for (const m of [74, 81, 86]) tone(ctx, o, at(CUE.fin), hz(m), 'sine', 0.004, 1.8, 0.14 * sfx, { rev: 0.8, del: 0.3 });
  }
  /* 母线：开头淡入、结尾淡出 */
  void DURATIONS;
}

/** 整体的淡入淡出放在母线上（和 scheduleScore 分开，因为在线时每个世代的起点不同） */
export function masterFades(ctx: BaseAudioContext, bus: Bus, from: number, when: number, level = LEVEL.master): void {
  const g = bus.master.gain;
  const at = (t: number) => when + (t - from);
  if (from < 1) {
    g.setValueAtTime(0.0001, at(0));
    g.linearRampToValueAtTime(level, at(0) + 1.5);
  } else g.setValueAtTime(level, when);
  g.setValueAtTime(level, at(TOTAL - 3));
  g.linearRampToValueAtTime(0.0001, at(TOTAL));
  void ctx;
}

/* ---------------- 离线渲染（检查用：把整段配乐渲染成缓冲区） ---------------- */
export async function renderOffline(sr = 44100): Promise<{ left: Float32Array; right: Float32Array; sampleRate: number }> {
  const ctx = new OfflineAudioContext(2, Math.ceil((TOTAL + 1.5) * sr), sr);
  const bus = createBus(ctx, ctx.destination);
  const ep = bus.epoch();
  masterFades(ctx, bus, 0, 0);
  scheduleScore(ctx, ep, 0, TOTAL + 2, 0);
  const buf = await ctx.startRendering();
  return { left: buf.getChannelData(0), right: buf.getChannelData(1), sampleRate: sr };
}

/* ---------------- 在线引擎：前瞻调度，跟着影片时间走 ---------------- */
export interface Engine {
  ctx: AudioContext;
  /** 每帧调用：影片时间 f、是否在自动播放。拖进度条 / 换幕 / 暂停 / 恢复都在这里被发现并重新排程 */
  sync(f: number, playing: boolean): void;
  /** 淡出并停下（暂停、后台标签页） */
  hush(fade?: number): void;
  /** 音量档：小声时整体降到一半 */
  setQuiet(q: boolean): void;
  /** 当前输出电平（0..1 的 RMS），给测试看 */
  level(): number;
  /** 当前排程的起点（影片时间）和状态，给测试看 */
  info(): { anchorF: number; mode: string; sched: [number, number][] };
  dispose(): void;
}
export function createEngine(): Engine | null {
  const AC =
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  let ctx: AudioContext;
  try {
    ctx = new AC({ latencyHint: 'interactive' });
  } catch {
    return null;
  }
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  const vol = ctx.createGain(); // 音量档（正常 1 / 小声 0.5），在总线之后，不碰配乐本身
  vol.connect(analyser).connect(ctx.destination);
  const bus = createBus(ctx, vol);
  bus.master.gain.value = 0.0001;
  let ep: Epoch | null = null;
  let anchorCtx = 0; // 影片时间 anchorF 对应的 ctx 时间
  let anchorF = 0;
  let scheduledTo = 0;
  /** 排过程的（影片时间）区间，给测试看：跳转时不该有跨过中间幕的区间 */
  const sched: [number, number][] = [];
  let mode: 'film' | 'pad' | 'off' = 'off';
  let timer = 0;
  const buf = new Float32Array(analyser.fftSize);

  const newEpoch = (f: number, m: 'film' | 'pad') => {
    const now = ctx.currentTime;
    if (ep) ep.kill(ctx, now);
    ep = bus.epoch();
    mode = m;
    anchorCtx = now + 0.06;
    anchorF = f;
    scheduledTo = f;
    const g = bus.master.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(0.0001, g.value), now);
    if (m === 'film') {
      // 从当前影片时间淡入（不是从头）
      g.linearRampToValueAtTime(LEVEL.master, now + (f < 1 ? 1.6 : 0.5));
      masterFadeOut(f);
      sched.push([f, f + 0.01]);
      scheduleScore(ctx, ep, f, f + 0.01, anchorCtx, { catchUp: true });
    } else {
      g.linearRampToValueAtTime(LEVEL.master, now + 0.6);
      scheduleScore(ctx, ep, f, f + 0.01, anchorCtx, { catchUp: true, padOnly: true });
    }
  };
  const masterFadeOut = (f: number) => {
    const g = bus.master.gain;
    const t = anchorCtx + (TOTAL - 3 - f);
    if (t > ctx.currentTime) {
      g.setValueAtTime(LEVEL.master, t);
      g.linearRampToValueAtTime(0.0001, t + 3);
    }
  };
  const pump = () => {
    if (mode !== 'film' || !ep || ctx.state !== 'running') return;
    const target = anchorF + (ctx.currentTime + 0.3 - anchorCtx);
    if (target > scheduledTo) {
      sched.push([scheduledTo, Math.min(target, TOTAL + 2)]);
      scheduleScore(ctx, ep, scheduledTo, Math.min(target, TOTAL + 2), anchorCtx + (scheduledTo - anchorF));
      scheduledTo = target;
    }
  };
  timer = window.setInterval(pump, 40);

  return {
    ctx,
    sync(f, playing) {
      // 手动擦洗、暂停时选择“直接静音”：配乐只在自动播放时响，擦洗时断断续续的和弦反而吵
      if (!playing) {
        this.hush();
        return;
      }
      if (ctx.state === 'suspended') void ctx.resume();
      const predicted = anchorF + (ctx.currentTime - anchorCtx);
      if (mode !== 'film' || Math.abs(predicted - f) > 0.25) newEpoch(f, 'film');
    },
    setQuiet(q: boolean) {
      vol.gain.setTargetAtTime(q ? 0.5 : 1, ctx.currentTime, 0.05);
    },
    hush(fade = 0.3) {
      if (mode === 'off') return;
      mode = 'off';
      const now = ctx.currentTime;
      const g = bus.master.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(Math.max(0.0001, g.value), now);
      g.linearRampToValueAtTime(0.0001, now + fade);
      if (ep) ep.kill(ctx, now + fade);
      ep = null;
      window.setTimeout(
        () => {
          if (mode === 'off' && ctx.state === 'running') void ctx.suspend();
        },
        fade * 1000 + 80,
      );
    },
    info() {
      return { anchorF, mode, sched };
    },
    level() {
      analyser.getFloatTimeDomainData(buf);
      let s = 0;
      for (const x of buf) s += x * x;
      return Math.sqrt(s / buf.length);
    },
    dispose() {
      window.clearInterval(timer);
      mode = 'off';
      try {
        void ctx.close();
      } catch {
        /* 已经关了 */
      }
    },
  };
}
