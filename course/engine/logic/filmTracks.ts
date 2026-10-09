/* 首页短片的编排：每个元素一条“轨道”（一串关键帧，时间单位是秒），story.ts 把它们变成暂停的 Web Animations，按影片时间擦洗。
 * 纯函数、不碰 DOM，有单元测试。只动 transform、opacity 和 SVG 描边。
 * 元素用 data-w 标记（见 HomePage.tsx）；轨道名以 "css:" 开头的是 CSS 选择器。 */
import { FRAMES, MARKS, NODES, SERVER_BLOCKS, STREAM_TARGETS, TOTAL, depthOf, nodeById, subtree } from './filmData.ts';

export interface KF {
  t: number;
  easing?: string;
  [prop: string]: string | number | undefined;
}
export type Tracks = Record<string, KF[]>;

const EASE = {
  out: 'cubic-bezier(.2,.8,.2,1)',
  inout: 'cubic-bezier(.45,.05,.25,1)',
  back: 'cubic-bezier(.34,1.56,.64,1)',
  lin: 'linear',
};
const M = MARKS;
const U = 'translateZ';

/** 相机姿态：rx 俯仰、rz 旋转、(x, y) 平移、s 缩放 */
type Pose = [number, number, number, number, number];
const poseCss = (p: Pose) => `rotateX(${p[0]}deg) rotateZ(${p[1]}deg) translate3d(${p[2]}px, ${p[3]}px, 0px) scale(${p[4]})`;
const POSES_DESKTOP: Pose[] = [
  [58, -26, 200, 30, 0.8], // 0 开场
  [58, -18, 200, 20, 0.86], // 1 手动改 DOM
  [50, -12, 200, 10, 0.92], // 2 声明式
  [54, -10, 200, 0, 0.92], // 3 协调
  [44, -8, 200, -10, 0.94], // 4 Fiber
  [60, -14, 200, 30, 1.05], // 5 Hooks
  [46, -10, 200, 10, 0.94], // 6 并发
  [46, -12, 200, 215, 0.7], // 7 服务端
  [56, -12, 200, 20, 0.94], // 8 编译器
  [64, -24, 0, -260, 0.34], // 9 收束
];
const POSES_MOBILE: Pose[] = [
  [50, -26, 0, 20, 0.8],
  [52, -20, 0, 10, 0.9],
  [42, -14, 0, 0, 1.0],
  [48, -10, 0, -10, 0.98],
  [38, -8, 0, -20, 1.0],
  [54, -16, 0, 20, 1.1],
  [40, -10, 0, 0, 1.0],
  [46, -20, 20, 10, 0.84],
  [52, -14, 0, 10, 1.0],
  [60, -24, 0, -250, 0.34],
];

export function buildTracks(mobile = false): Tracks {
  const raw: Tracks = {};
  const k = (name: string, t: number, props: Omit<KF, 't'>, easing = EASE.inout) => {
    if (!raw[name]) raw[name] = [];
    raw[name].push({ t, easing, ...props });
  };
  const fade = (name: string, t0: number, t1: number, from: number, to: number, easing = EASE.inout) => {
    k(name, t0, { opacity: from }, easing);
    k(name, t1, { opacity: to }, easing);
  };
  /** 脉冲：先亮起、停一会、再熄灭 */
  const flash = (name: string, t: number, hold = 0.35, peak = 1) => {
    k(name, t, { opacity: 0 }, EASE.out);
    k(name, t + 0.18, { opacity: peak });
    k(name, t + 0.18 + hold, { opacity: peak });
    k(name, t + 0.5 + hold, { opacity: 0 });
  };
  /** 沿连线流动的光：光点从父节点流到子节点 */
  const comet = (id: string, t: number, dur = 0.45, color?: string, back = false) => {
    for (const [pre, peak] of [
      ['gw-', 0.3],
      ['g-', 1],
    ] as const) {
      const n = pre + id;
      const stroke = color ?? '#5cc6e4';
      k(n, t, { opacity: 0, strokeDashoffset: '0.16', stroke }, EASE.lin);
      k(n, t + 0.04, { opacity: peak, strokeDashoffset: '0.1', stroke }, EASE.lin);
      if (back) {
        k(n, t + dur * 0.6, { opacity: peak, strokeDashoffset: '-0.5', stroke }, EASE.out);
        k(n, t + dur * 1.1, { opacity: 0, strokeDashoffset: '-0.1', stroke }, EASE.out);
      } else {
        k(n, t + dur, { opacity: peak, strokeDashoffset: '-0.85', stroke }, EASE.lin);
        k(n, t + dur + 0.08, { opacity: 0, strokeDashoffset: '-1', stroke }, EASE.lin);
      }
    }
  };
  const pop = (name: string, t: number, d = 0.45, to = 1) => {
    k(name, t, { opacity: 0, transform: 'scale(.4)' }, EASE.back);
    k(name, t + d, { opacity: to, transform: 'scale(1)' });
  };
  const nodeAt = (id: string) => nodeById(id);

  /* ===== 相机 ===== */
  const poses = mobile ? POSES_MOBILE : POSES_DESKTOP;
  k('cam', 0, { transform: poseCss([68, -40, poses[0][2] * 0.6, 60, poses[0][4] * 0.85]) }, EASE.inout);
  poses.forEach((p, i) => {
    const arrive = i === 0 ? 4.6 : M[i] + 0.9;
    k('cam', arrive, { transform: poseCss(p) }, EASE.inout);
    // 到位后很慢地继续飘一点（镜头推拉），到下一幕之前再被下一个姿态接走
    const end = i === 9 ? TOTAL : M[i + 1] - 0.05;
    const drift: Pose = [p[0] + 1.5, p[1] + 2, p[2] - 8, p[3] + 4, p[4] * 1.025];
    k('cam', end, { transform: poseCss(drift) }, EASE.lin);
  });

  /* ===== 0 开场：三层空间由线条画出，原子图标化成树根 ===== */
  const PL: [string, number, number][] = [
    ['pl4', -230, 0.2],
    ['pl3', -120, 0.5],
    ['pl2', 0, 0.9],
    ['pl1', 120, 1.3],
  ];
  for (const [n, z, t] of PL) {
    k(n, 0, { opacity: 0, transform: `${U}(${z - 100}px)` }, EASE.out);
    k(n, t, { opacity: 0, transform: `${U}(${z - 100}px)` }, EASE.out);
    k(n, t + 0.9, { opacity: 1, transform: `${U}(${z}px)` });
  }
  // 第 1 幕：中间层和组件卡片退场（React 之前还没有它们），第 2 幕回来
  k('pl2', M[1] + 0.1, { opacity: 1, transform: `${U}(0px)` }, EASE.inout);
  k('pl2', M[1] + 0.7, { opacity: 0, transform: `${U}(-70px)` }, EASE.inout);
  k('pl2', M[2] + 0.1, { opacity: 0, transform: `${U}(-70px)` }, EASE.out);
  k('pl2', M[2] + 0.8, { opacity: 1, transform: `${U}(0px)` });
  k('pl2', M[9] + 0.2, { opacity: 1, transform: `${U}(0px)` }, EASE.inout);
  // 收束：整个空间安静下来
  k('pl1', M[9] + 0.1, { opacity: 1, transform: `${U}(120px)` }, EASE.inout);
  k('pl1', M[9] + 0.9, { opacity: 0.55, transform: `${U}(120px)` });
  k('pl3', M[2] + 0.5, { opacity: 1 }, EASE.inout);
  k('pl3', M[2] + 1.5, { opacity: 0.6 });
  k('pl3', M[3] + 0.4, { opacity: 0.6 }, EASE.inout);
  k('pl3', M[3] + 1.2, { opacity: 1 });

  // DOM 层的色块一块块出现
  NODES.forEach((n, i) => {
    const t = 0.9 + (n.id === 'App' ? 0 : 0.18 + i * 0.1);
    k('b-' + n.id, 0, { opacity: 0, transform: 'scale(.92)' }, EASE.out);
    k('b-' + n.id, t, { opacity: 0, transform: 'scale(.92)' }, EASE.out);
    k('b-' + n.id, t + 0.6, { opacity: 1, transform: 'scale(1)' });
  });
  // 原子图标：画出来，缓慢旋转，然后缩进根节点
  [0, 1, 2].forEach(i => {
    k('at-' + i, 0.5 + i * 0.25, { strokeDashoffset: '1', opacity: 1 }, EASE.inout);
    k('at-' + i, 1.9 + i * 0.1, { strokeDashoffset: '0', opacity: 1 });
  });
  k('at-n', 1.4, { opacity: 0, transform: 'scale(.2)' }, EASE.back);
  k('at-n', 2.0, { opacity: 1, transform: 'scale(1)' });
  k('atom', 0, { opacity: 1, transform: 'rotate(-60deg) scale(1)' }, EASE.lin);
  k('atom', 2.5, { opacity: 1, transform: 'rotate(120deg) scale(1)' }, EASE.inout);
  k('atom', 3.2, { opacity: 0, transform: 'rotate(180deg) scale(.22) translateY(0px)' });
  // 树：连线从根往下长出来，节点依次点亮，组件卡片从上面落下
  NODES.forEach((n, i) => {
    const d = depthOf(n.id);
    const t = 2.9 + d * 0.32 + (i % 3) * 0.04;
    k('n-' + n.id, 0, { opacity: 0, transform: 'scale(.4)' }, EASE.back);
    k('n-' + n.id, t, { opacity: 0, transform: 'scale(.4)' }, EASE.back);
    k('n-' + n.id, t + 0.45, { opacity: 1, transform: 'scale(1)' });
    if (n.parent) {
      k('e-' + n.id, 0, { strokeDashoffset: '1' }, EASE.inout);
      k('e-' + n.id, t - 0.4, { strokeDashoffset: '1' }, EASE.inout);
      k('e-' + n.id, t + 0.1, { strokeDashoffset: '0' });
    }
    k('c-' + n.id, 0, { opacity: 0, transform: 'translateY(-26px)' }, EASE.out);
    k('c-' + n.id, t + 0.4, { opacity: 0, transform: 'translateY(-26px)' }, EASE.out);
    k('c-' + n.id, t + 1.0, { opacity: 1, transform: 'translateY(0px)' });
  });
  flash('nl-App', 2.9, 0.2, 0.9);

  /* ===== 1 手动改 DOM ===== */
  // 卡片退场
  NODES.forEach(n => {
    k('c-' + n.id, M[1] + 0.05, { opacity: 1, transform: 'translateY(0px)' }, EASE.inout);
    k('c-' + n.id, M[1] + 0.6, { opacity: 0, transform: 'translateY(-26px)' });
    k('c-' + n.id, M[2] + 0.8 + depthOf(n.id) * 0.12, { opacity: 0, transform: 'translateY(-26px)' }, EASE.out);
    k('c-' + n.id, M[2] + 1.5 + depthOf(n.id) * 0.12, { opacity: 1, transform: 'translateY(0px)' });
  });
  k('orb', 0, { opacity: 0, transform: 'scale(.5)' }, EASE.back);
  k('orb', M[1] + 0.5, { opacity: 0, transform: 'scale(.5)' }, EASE.back);
  k('orb', M[1] + 1.1, { opacity: 1, transform: 'scale(1)' });
  k('orb', M[1] + 1.6, { opacity: 1, transform: 'scale(1)' }, EASE.out);
  k('orb', M[1] + 1.8, { opacity: 1, transform: 'scale(1.3)' });
  k('orb', M[1] + 2.3, { opacity: 1, transform: 'scale(1)' });
  k('orb', M[2] + 0.1, { opacity: 1, transform: 'scale(1)' }, EASE.inout);
  k('orb', M[2] + 0.7, { opacity: 0, transform: 'scale(.6)' });
  k('bm-orb', 0, { opacity: 0, transform: 'rotateX(90deg) scaleY(0)' }, EASE.inout);
  k('bm-orb', M[1] + 1.9, { opacity: 0, transform: 'rotateX(90deg) scaleY(0)' }, EASE.inout);
  k('bm-orb', M[1] + 2.0, { opacity: 1, transform: 'rotateX(90deg) scaleY(0)' }, EASE.out);
  k('bm-orb', M[1] + 2.4, { opacity: 1, transform: 'rotateX(90deg) scaleY(1)' });
  k('bm-orb', M[2] + 0.1, { opacity: 1, transform: 'rotateX(90deg) scaleY(1)' }, EASE.inout);
  k('bm-orb', M[2] + 0.6, { opacity: 0, transform: 'rotateX(90deg) scaleY(1)' });
  // 三条手工的线：两条到位，第三条没画完，红叉闪烁
  const ML: [string, number, number, string, number][] = [
    ['ml-1', 2.4, 2.9, 'Header', 1],
    ['ml-2', 3.0, 3.5, 'Item1', 1],
    ['ml-3', 3.6, 4.0, 'Box2', 0.42],
  ];
  fade('css:.story .ml-base', M[1] + 2.3, M[1] + 2.6, 0, 1);
  fade('css:.story .ml-base', M[2] + 0.2, M[2] + 0.7, 1, 0);
  for (const [n, a, b, target, reach] of ML) {
    k(n, 0, { strokeDashoffset: '1', opacity: 0 }, EASE.inout);
    k(n, M[1] + a, { strokeDashoffset: '1', opacity: 1 }, EASE.inout);
    k(n, M[1] + b, { strokeDashoffset: String(1 - reach), opacity: 1 });
    k(n, M[2] + 0.2, { strokeDashoffset: String(1 - reach), opacity: 1 }, EASE.inout);
    k(n, M[2] + 0.7, { strokeDashoffset: String(1 - reach), opacity: 0 });
    if (reach === 1) {
      flash('bl-' + target, M[1] + b - 0.05, 0.1, 0.8);
      k('bo-' + target, 0, { opacity: 0 });
      k('bo-' + target, M[1] + b, { opacity: 0 });
      k('bo-' + target, M[1] + b + 0.4, { opacity: 0.85 });
      k('bo-' + target, M[2] + 0.2, { opacity: 0.85 }, EASE.inout);
      k('bo-' + target, M[2] + 0.8, { opacity: 0 });
    }
  }
  // 漏掉的那一块：红色闪烁
  k('bx-Box2', 0, { opacity: 0 });
  for (let i = 0; i < 3; i++) {
    const t = M[1] + 4.1 + i * 0.4;
    k('bx-Box2', t, { opacity: 0 }, EASE.lin);
    k('bx-Box2', t + 0.15, { opacity: 0.85 }, EASE.lin);
    k('bx-Box2', t + 0.3, { opacity: 0.25 }, EASE.lin);
  }
  k('bx-Box2', M[2] + 0.1, { opacity: 0.25 }, EASE.inout);
  k('bx-Box2', M[2] + 0.7, { opacity: 0 });
  fade('ml-x', M[1] + 4.0, M[1] + 4.3, 0, 1);
  k('ml-x', M[2] + 0.1, { opacity: 1 }, EASE.inout);
  k('ml-x', M[2] + 0.6, { opacity: 0 });
  callout(k, 'cl-h', M[1] + 3.9, M[2] - 0.05);

  /* ===== 2 声明式：整份重算，不碰 DOM ===== */
  fade('spark', 0, 0, 0, 0);
  k('spark', M[2] + 1.6, { opacity: 0, transform: 'translateY(-30px) scale(.5)' }, EASE.back);
  k('spark', M[2] + 2.1, { opacity: 1, transform: 'translateY(0px) scale(1)' }, EASE.inout);
  k('spark', M[2] + 2.6, { opacity: 1, transform: 'translateY(0px) scale(1)' }, EASE.out);
  k('spark', M[2] + 2.9, { opacity: 0, transform: 'translateY(30px) scale(.4)' });
  const t0 = M[2] + 2.9;
  const order = subtree('App');
  const arrive: Record<string, number> = {};
  for (const id of order) arrive[id] = t0 + depthOf(id) * 0.62;
  for (const id of order) {
    const nd = nodeAt(id);
    if (nd.parent) comet(id, arrive[nd.parent] + 0.1, 0.42);
    // 节点亮起并保持（整份重新算了一遍），卡片闪一下（函数被调用），新的一份里对应的节点长出来
    k('nl-' + id, 0, { opacity: 0 }, EASE.out);
    k('nl-' + id, arrive[id], { opacity: 0 }, EASE.out);
    k('nl-' + id, arrive[id] + 0.25, { opacity: 1 });
    k('nl-' + id, M[3] + 0.1, { opacity: 1 }, EASE.inout);
    k('nl-' + id, M[3] + 0.6, { opacity: 0 });
    flash('cf-' + id, arrive[id], 0.3);
    k('gn-' + id, 0, { opacity: 0, transform: 'translateY(-14px) scale(.6)' }, EASE.back);
    k('gn-' + id, arrive[id] + 0.1, { opacity: 0, transform: 'translateY(-14px) scale(.6)' }, EASE.back);
    k('gn-' + id, arrive[id] + 0.55, { opacity: 1, transform: 'translateY(0px) scale(1)' });
  }
  k('p2b', 0, { opacity: 0, transform: `${U}(50px)` }, EASE.inout);
  k('p2b', M[2] + 2.8, { opacity: 0, transform: `${U}(50px)` }, EASE.inout);
  k('p2b', M[2] + 3.3, { opacity: 1, transform: `${U}(50px)` });
  callout(k, 'cl-d', M[2] + 3.4, M[3] - 0.3);

  /* ===== 3 协调：叠合、标出差别、只提交这一点 ===== */
  const DIFF = ['Item2', 'Box2'];
  k('p2b', M[3] + 0.5, { opacity: 1, transform: `${U}(50px)` }, EASE.inout);
  k('p2b', M[3] + 1.3, { opacity: 1, transform: `${U}(8px)` }, EASE.inout);
  for (const n of NODES) {
    const same = !DIFF.includes(n.id);
    k('n-' + n.id, M[3] + 1.2, { opacity: 1 }, EASE.inout);
    k('n-' + n.id, M[3] + 1.9, { opacity: same ? 0.3 : 1 });
    k('gn-' + n.id, M[3] + 1.2, { opacity: 1 }, EASE.inout);
    k('gn-' + n.id, M[3] + 1.9, { opacity: same ? 0 : 1 });
  }
  for (const id of DIFF) {
    pop('fl-' + id, M[3] + 2.0, 0.5);
    k('fl-' + id, M[3] + 4.0, { opacity: 1, transform: 'scale(1)' }, EASE.inout);
    k('fl-' + id, M[3] + 4.6, { opacity: 0, transform: 'scale(1)' });
  }
  callout(k, 'cl-e', M[3] + 2.6, M[4] - 0.3);
  // 提交：光束垂直落到 DOM 层，只有对应的色块变化；像素层泛起波纹
  for (const id of DIFF) {
    const b = 'bm-' + id;
    k(b, 0, { opacity: 0, transform: 'rotateX(-90deg) scaleY(0)' }, EASE.out);
    k(b, M[3] + 2.9, { opacity: 0, transform: 'rotateX(-90deg) scaleY(0)' }, EASE.out);
    k(b, M[3] + 3.0, { opacity: 1, transform: 'rotateX(-90deg) scaleY(0)' }, EASE.out);
    k(b, M[3] + 3.5, { opacity: 1, transform: 'rotateX(-90deg) scaleY(1)' }, EASE.inout);
    k(b, M[3] + 4.3, { opacity: 1, transform: 'rotateX(-90deg) scaleY(1)' }, EASE.inout);
    k(b, M[3] + 4.9, { opacity: 0, transform: 'rotateX(-90deg) scaleY(1)' });
    flash('cm-' + id, M[3] + 3.45, 0.7);
    flash('bl-' + id, M[3] + 3.5, 0.15, 0.9);
    k('bo-' + id, M[3] + 3.45, { opacity: 0 }, EASE.out);
    k('bo-' + id, M[3] + 3.9, { opacity: 0.85 });
    k('bo-' + id, M[4] + 0.2, { opacity: 0.85 }, EASE.inout);
    k('bo-' + id, M[4] + 0.8, { opacity: 0 });
  }
  for (const [r, delay] of [
    ['rip', 0],
    ['rip2', 0.28],
  ] as const) {
    k(r, 0, { opacity: 0, transform: 'scale(.1)' }, EASE.out);
    k(r, M[3] + 3.5 + delay, { opacity: 0, transform: 'scale(.1)' }, EASE.out);
    k(r, M[3] + 3.6 + delay, { opacity: 0.95, transform: 'scale(.3)' }, EASE.out);
    k(r, M[3] + 4.5 + delay, { opacity: 0, transform: 'scale(1.9)' });
  }
  // 新的一份“翻下来”成为当前这一份
  k('p2b', M[3] + 4.3, { opacity: 1, transform: `${U}(8px) rotateX(0deg)` }, EASE.inout);
  k('p2b', M[3] + 5.0, { opacity: 0, transform: `${U}(-4px) rotateX(-80deg)` });
  for (const n of NODES) {
    k('n-' + n.id, M[3] + 4.6, { opacity: DIFF.includes(n.id) ? 1 : 0.3 }, EASE.inout);
    k('n-' + n.id, M[3] + 5.3, { opacity: 1 });
  }

  /* ===== 4 Fiber：旧方式一口气，新方式切成小片 ===== */
  fade('frames', M[4] + 0.2, M[4] + 0.7, 0, 1);
  fade('css:.story .legend', 0, 0.01, 0, 0);
  // A：一口气，帧成片变红
  const A0 = M[4] + 1.0;
  const bfs = subtree('App');
  bfs.forEach((id, i) => {
    const nd = nodeAt(id);
    const t = A0 + i * 0.16;
    if (nd.parent) comet(id, t - 0.12, 0.2);
    k('nl-' + id, M[4] + 0.1, { opacity: 0 }, EASE.out);
    k('nl-' + id, t, { opacity: 0 }, EASE.out);
    k('nl-' + id, t + 0.15, { opacity: 1 });
    k('nl-' + id, M[4] + 3.6, { opacity: 1 }, EASE.inout);
    k('nl-' + id, M[4] + 3.95, { opacity: 0 });
  });
  const redTo = Math.round(FRAMES * 0.5);
  for (let i = 0; i < FRAMES; i++) {
    k('fk-' + i, 0, { opacity: 0 }, EASE.lin);
    k('fx-' + i, 0, { opacity: 0 }, EASE.lin);
    if (i < redTo) {
      const t = A0 + i * 0.1;
      k('fx-' + i, M[4] + 0.1, { opacity: 0 }, EASE.lin);
      k('fx-' + i, t, { opacity: 0 }, EASE.lin);
      k('fx-' + i, t + 0.08, { opacity: 1 }, EASE.lin);
      k('fx-' + i, M[4] + 3.6, { opacity: 1 }, EASE.lin);
      k('fx-' + i, M[4] + 3.9, { opacity: 0 }, EASE.lin);
    }
    // B：切片，帧保持平稳（从 3.9 起一格格变绿）
    const tb = M[4] + 4.0 + i * 0.07;
    k('fk-' + i, M[4] + 3.9, { opacity: 0 }, EASE.lin);
    k('fk-' + i, tb, { opacity: 0 }, EASE.lin);
    k('fk-' + i, tb + 0.08, { opacity: 1 }, EASE.lin);
    k('fk-' + i, M[5] + 0.1, { opacity: 1 }, EASE.lin);
    k('fk-' + i, M[5] + 0.5, { opacity: 0 }, EASE.lin);
    k('fx-' + i, M[5] + 0.5, { opacity: 0 }, EASE.lin);
  }
  fade('frlost', M[4] + 1.5, M[4] + 1.9, 0, 1);
  k('frlost', M[4] + 3.5, { opacity: 1 }, EASE.inout);
  k('frlost', M[4] + 3.9, { opacity: 0 });
  fade('frok', M[4] + 5.0, M[4] + 5.4, 0, 1);
  k('frok', M[5] + 0.1, { opacity: 1 }, EASE.inout);
  k('frok', M[5] + 0.5, { opacity: 0 });
  k('frames', M[5] + 0.1, { opacity: 1 }, EASE.inout);
  k('frames', M[5] + 0.6, { opacity: 0 });
  // B：节点变成一个个独立的工作单元，光一小段一小段前进（逐个亮一下就熄灭，中间留空隙）
  bfs.forEach((id, i) => {
    const nd = nodeAt(id);
    const t = M[4] + 4.1 + i * 0.28;
    if (nd.parent) comet(id, t - 0.16, 0.2);
    k('nl-' + id, M[4] + 3.95, { opacity: 0 }, EASE.out);
    k('nl-' + id, t, { opacity: 0 }, EASE.out);
    k('nl-' + id, t + 0.1, { opacity: 1 }, EASE.inout);
    k('nl-' + id, t + 0.3, { opacity: 1 }, EASE.inout);
    k('nl-' + id, t + 0.5, { opacity: 0 });
    flash('cf-' + id, t, 0.12, 0.8);
  });

  /* ===== 5 Hooks：class → function，state 以挂钩的形状挂在函数卡片上 ===== */
  for (const id of ['Header', 'TodoList', 'Item1']) {
    k('cls-' + id, 0, { opacity: 0 }, EASE.out);
    k('cls-' + id, M[5] + 0.2, { opacity: 0 }, EASE.out);
    k('cls-' + id, M[5] + 0.7, { opacity: 1 }, EASE.inout);
    k('cls-' + id, M[5] + 1.3, { opacity: 1 }, EASE.lin);
    k('cls-' + id, M[5] + 1.31, { opacity: 0 });
    k('c-' + id, M[5] + 0.6, { transform: 'scaleX(1)' }, EASE.inout);
    k('c-' + id, M[5] + 1.3, { transform: 'scaleX(0)' }, EASE.inout);
    k('c-' + id, M[5] + 1.9, { transform: 'scaleX(1)' });
    k('hk-' + id, 0, { opacity: 0, transform: 'translateX(-50%) translateY(-8px)' }, EASE.back);
    k('hk-' + id, M[5] + 1.7, { opacity: 0, transform: 'translateX(-50%) translateY(-8px)' }, EASE.back);
    k('hk-' + id, M[5] + 2.2, { opacity: 1, transform: 'translateX(-50%) translateY(0px)' });
  }

  /* ===== 6 并发：紧急的插队，被打断的丢弃后重来 ===== */
  fade('frames', M[6] + 0.1, M[6] + 0.6, 0, 1);
  for (let i = 0; i < FRAMES; i++) {
    const t = M[6] + 0.7 + i * 0.2;
    k('fk-' + i, M[6] + 0.1, { opacity: 0 }, EASE.lin);
    k('fk-' + i, t, { opacity: 0 }, EASE.lin);
    k('fk-' + i, t + 0.08, { opacity: 1 }, EASE.lin);
    k('fk-' + i, M[7] + 0.1, { opacity: 1 }, EASE.lin);
    k('fk-' + i, M[7] + 0.5, { opacity: 0 }, EASE.lin);
  }
  k('frames', M[7] + 0.1, { opacity: 1 }, EASE.inout);
  k('frames', M[7] + 0.6, { opacity: 0 });
  const slow = (ids: string[], start: number, gap: number, keepTo: number) => {
    ids.forEach((id, i) => {
      const t = start + i * gap;
      const nd = nodeAt(id);
      if (nd.parent) comet(id, t - 0.2, 0.3);
      k('nl-' + id, t, { opacity: 0 }, EASE.out);
      k('nl-' + id, t + 0.15, { opacity: 1 }, EASE.inout);
      k('nl-' + id, keepTo, { opacity: 1 }, EASE.inout);
      k('nl-' + id, keepTo + 0.35, { opacity: 0 });
      flash('cf-' + id, t, 0.12, 0.8);
    });
  };
  const bigRun = ['App', 'Header', 'TodoList', 'Logo', 'Search', 'Item1', 'Item2', 'Box1', 'Box2'];
  // 第一次（过渡更新）：慢慢走了前几个节点，被打断，全部丢弃
  for (const id of bigRun) {
    k('nl-' + id, M[5] + 0.5, { opacity: 0 }, EASE.out);
    k('nl-' + id, M[6] + 0.3, { opacity: 0 }, EASE.out);
  }
  slow(bigRun.slice(0, 5), M[6] + 0.8, 0.42, M[6] + 2.55);
  // 紧急更新：落在 Search 上，插队，先渲染并提交
  k('ur-Search', 0, { opacity: 0, transform: 'scale(.6)' }, EASE.back);
  k('ur-Search', M[6] + 2.3, { opacity: 0, transform: 'scale(.6)' }, EASE.back);
  k('ur-Search', M[6] + 2.7, { opacity: 1, transform: 'scale(1)' }, EASE.inout);
  k('ur-Search', M[6] + 3.5, { opacity: 1, transform: 'scale(1)' }, EASE.inout);
  k('ur-Search', M[6] + 3.9, { opacity: 0, transform: 'scale(1)' });
  k('bm-Search', 0, { opacity: 0, transform: 'rotateX(-90deg) scaleY(0)' }, EASE.inout);
  k('bm-Search', M[6] + 3.1, { opacity: 0, transform: 'rotateX(-90deg) scaleY(0)' }, EASE.out);
  k('bm-Search', M[6] + 3.2, { opacity: 1, transform: 'rotateX(-90deg) scaleY(0)' }, EASE.inout);
  k('bm-Search', M[6] + 3.6, { opacity: 1, transform: 'rotateX(-90deg) scaleY(1)' }, EASE.inout);
  k('bm-Search', M[6] + 4.2, { opacity: 0, transform: 'rotateX(-90deg) scaleY(1)' });
  flash('cm-Search', M[6] + 3.55, 0.5);
  flash('bl-Search', M[6] + 3.6, 0.12, 0.9);
  k('bo-Search', 0, { opacity: 0 });
  k('bo-Search', M[6] + 3.55, { opacity: 0 }, EASE.out);
  k('bo-Search', M[6] + 3.9, { opacity: 0.85 }, EASE.inout);
  k('bo-Search', M[7] + 0.1, { opacity: 0.85 }, EASE.inout);
  k('bo-Search', M[7] + 0.6, { opacity: 0 });
  k('rip', M[6] + 3.6, { opacity: 0, transform: 'scale(.1)' }, EASE.out);
  k('rip', M[6] + 3.7, { opacity: 0.9, transform: 'scale(.25)' }, EASE.out);
  k('rip', M[6] + 4.4, { opacity: 0, transform: 'scale(1.4)' });
  callout(k, 'cl-a', M[6] + 2.7, M[6] + 4.3);
  // 第二次：从头重来，走完整棵树，提交
  const redo = M[6] + 4.5;
  for (const id of bigRun) k('nl-' + id, M[6] + 4.35, { opacity: 0 }, EASE.out);
  slow(bigRun, redo, 0.26, M[7] - 0.1);
  callout(k, 'cl-b', M[6] + 4.35, M[6] + 6.0);
  k('rip2', M[6] + 6.5, { opacity: 0, transform: 'scale(.1)' }, EASE.out);
  k('rip2', M[6] + 6.6, { opacity: 0.8, transform: 'scale(.3)' }, EASE.out);
  k('rip2', M[7] + 0.5, { opacity: 0, transform: 'scale(1.7)' });

  /* ===== 7 服务端：块从服务器流到浏览器，带闪电的才带 JavaScript ===== */
  k('srv', 0, { opacity: 0 }, EASE.inout);
  k('srv', M[7] + 0.4, { opacity: 0 }, EASE.inout);
  k('srv', M[7] + 1.0, { opacity: 1 });
  k('srv', M[8] + 0.1, { opacity: 1 }, EASE.inout);
  k('srv', M[8] + 0.7, { opacity: 0 });
  const targets = [...STREAM_TARGETS];
  SERVER_BLOCKS.forEach((_b, i) => {
    const t = M[7] + 1.3 + i * 1.2;
    const target = targets[i];
    flash('sbl-' + i, t, 0.5);
    fade('css:.story .st-base', M[7] + 1.0, M[7] + 1.4, 0, 0.7);
    k('css:.story .st-base', M[8] + 0.1, { opacity: 0.7 }, EASE.inout);
    k('css:.story .st-base', M[8] + 0.7, { opacity: 0 });
    for (const [n, peak] of [
      ['stw-', 0.35],
      ['st-', 1],
    ] as const) {
      k(n + i, 0, { opacity: 0, strokeDashoffset: '0.45' }, EASE.lin);
      k(n + i, t + 0.3, { opacity: 0, strokeDashoffset: '0.45' }, EASE.lin);
      k(n + i, t + 0.36, { opacity: peak, strokeDashoffset: '0.4' }, EASE.lin);
      k(n + i, t + 1.15, { opacity: peak, strokeDashoffset: '-0.95' }, EASE.lin);
      k(n + i, t + 1.25, { opacity: 0, strokeDashoffset: '-1.1' }, EASE.lin);
    }
    // 到达：骨架被“冲刷”成真实内容
    k('bs-' + target, 0, { opacity: 0 });
    k('bs-' + target, M[7] + 0.5, { opacity: 0 }, EASE.out);
    k('bs-' + target, M[7] + 1.1, { opacity: 1 }, EASE.inout);
    k('bs-' + target, t + 1.2, { opacity: 1 }, EASE.out);
    k('bs-' + target, t + 1.6, { opacity: 0 });
    flash('bl-' + target, t + 1.2, 0.1, 0.9);
  });
  // 带闪电的两块：通电
  for (const id of ['Item2', 'Box2']) {
    pop('bz-' + id, M[7] + 5.1, 0.45);
    k('bz-' + id, M[8] + 0.1, { opacity: 1, transform: 'scale(1)' }, EASE.inout);
    k('bz-' + id, M[8] + 0.7, { opacity: 0, transform: 'scale(1)' });
    flash('nl-' + id, M[7] + 5.25, 0.3, 0.9);
  }
  k('rip', M[7] + 5.25, { opacity: 0, transform: 'scale(.1)' }, EASE.out);
  k('rip', M[7] + 5.35, { opacity: 0.9, transform: 'scale(.3)' }, EASE.out);
  k('rip', M[7] + 6.1, { opacity: 0, transform: 'scale(1.5)' });
  // 表单提交是一个 Action：一道光从浏览器回到服务器
  k('st-act', 0, { opacity: 0, strokeDashoffset: '0.45' }, EASE.lin);
  k('st-act', M[7] + 5.5, { opacity: 0, strokeDashoffset: '0.45' }, EASE.lin);
  k('st-act', M[7] + 5.56, { opacity: 1, strokeDashoffset: '0.4' }, EASE.lin);
  k('st-act', M[7] + 6.4, { opacity: 1, strokeDashoffset: '-0.95' }, EASE.lin);
  k('st-act', M[7] + 6.5, { opacity: 0, strokeDashoffset: '-1' });
  callout(k, 'cl-f', M[7] + 1.6, M[8] - 0.2);

  /* ===== 8 编译器：扫描线扫过组件卡片，没变的子树被挡住 ===== */
  k('scan', 0, { opacity: 0, transform: 'translateX(-30px)' }, EASE.inout);
  k('scan', M[8] + 0.5, { opacity: 0, transform: 'translateX(-30px)' }, EASE.inout);
  k('scan', M[8] + 0.7, { opacity: 1, transform: 'translateX(0px)' }, EASE.lin);
  k('scan', M[8] + 1.9, { opacity: 1, transform: 'translateX(1000px)' }, EASE.lin);
  k('scan', M[8] + 2.0, { opacity: 0, transform: 'translateX(1010px)' });
  for (const n of NODES.filter(x => x.memo)) {
    const t = M[8] + 0.7 + (n.x / 1000) * 1.2;
    k('mt-' + n.id, 0, { opacity: 0, transform: 'scale(.4)' }, EASE.back);
    k('mt-' + n.id, t, { opacity: 0, transform: 'scale(.4)' }, EASE.back);
    k('mt-' + n.id, t + 0.35, { opacity: 1, transform: 'scale(1)' });
  }
  // 再触发一次：TodoList 自己调用 set 函数，它渲染，光流到 Item 前被挡住
  const T8 = M[8] + 2.2;
  k('spark', M[8] + 2.0, { opacity: 0, transform: 'translate(240px, 128px) scale(.5)' }, EASE.back);
  k('spark', M[8] + 2.3, { opacity: 1, transform: 'translate(240px, 128px) scale(1)' }, EASE.inout);
  k('spark', M[8] + 2.8, { opacity: 1, transform: 'translate(240px, 128px) scale(1)' }, EASE.out);
  k('spark', M[8] + 3.0, { opacity: 0, transform: 'translate(240px, 128px) scale(.4)' });
  flash('nl-TodoList', T8 + 0.4, 1.4);
  flash('cf-TodoList', T8 + 0.4, 0.3);
  for (const id of ['Item1', 'Item2']) {
    comet(id, T8 + 0.7, 0.42, '#b3a1f2', true);
    k('sh-' + id, 0, { opacity: 0, transform: 'scaleX(.2)' }, EASE.back);
    k('sh-' + id, T8 + 1.0, { opacity: 0, transform: 'scaleX(.2)' }, EASE.back);
    k('sh-' + id, T8 + 1.4, { opacity: 1, transform: 'scaleX(1)' });
  }
  callout(k, 'cl-g', T8 + 0.9, M[9] - 0.2);

  /* ===== 年份：大号数字滚动切换 ===== */
  const yrs = ['2013', '2013', '2017', '2019', '2022', '2024', '2025'];
  const scenesOfYear = [2, 3, 4, 5, 6, 7, 8];
  for (let d = 0; d < 4; d++) {
    const val = (y: string) => -Number(y[d]);
    k('yd-' + d, 0, { transform: `translateY(0em)` }, EASE.inout);
    k('yd-' + d, M[2] + 0.2, { transform: `translateY(0em)` }, EASE.inout);
    let prev = '0000';
    yrs.forEach((y, i) => {
      const t = M[scenesOfYear[i]] + 0.3;
      if (y[d] !== prev[d]) {
        k('yd-' + d, t, { transform: `translateY(${val(prev)}em)` }, EASE.inout);
        k('yd-' + d, t + 0.9, { transform: `translateY(${val(y)}em)` }, EASE.inout);
      }
      prev = y;
    });
  }
  fade('year', 0, M[2] + 0.2, 0, 0);
  fade('year', M[2] + 0.2, M[2] + 0.7, 0, 1);
  k('year', M[9] + 0.1, { opacity: 1 }, EASE.inout);
  k('year', M[9] + 0.7, { opacity: 0 });
  YEARS_TAGS.forEach(i => {
    k('yt-' + i, 0, { opacity: 0, transform: 'translateY(8px)' }, EASE.out);
    k('yt-' + i, M[i] + 0.5, { opacity: 0, transform: 'translateY(8px)' }, EASE.out);
    k('yt-' + i, M[i] + 1.0, { opacity: 1, transform: 'translateY(0px)' }, EASE.inout);
    k('yt-' + i, M[i + 1] + 0.1, { opacity: 1, transform: 'translateY(0px)' }, EASE.out);
    k('yt-' + i, M[i + 1] + 0.5, { opacity: 0, transform: 'translateY(-8px)' });
  });
  // 图例：开场之后一直在
  fade('css:.story .legend', M[0] + 3.8, M[0] + 4.4, 0, 1);
  k('css:.story .legend', M[9] + 0.1, { opacity: 1 }, EASE.inout);
  k('css:.story .legend', M[9] + 0.6, { opacity: 0 });

  /* ===== 文字：标题从遮罩里擦入，说明依次升起，钩子在幕尾出现 ===== */
  k('cp-0', 0, { opacity: 1 }, EASE.inout);
  k('cp-0', M[1] - 0.8, { opacity: 1 }, EASE.inout);
  k('cp-0', M[1] - 0.1, { opacity: 0 });
  for (let i = 1; i <= 8; i++) {
    const c = `[data-w=cp-${i}]`;
    k('cp-' + i, 0, { opacity: 0 }, EASE.inout);
    k('cp-' + i, M[i] + 0.15, { opacity: 0 }, EASE.inout);
    k('cp-' + i, M[i] + 0.55, { opacity: 1 }, EASE.inout);
    k('cp-' + i, M[i + 1] - 0.5, { opacity: 1 }, EASE.inout);
    k('cp-' + i, M[i + 1] - 0.05, { opacity: 0 });
    const s = (sub: string, t: number, d: number, from: string) => {
      const name = `css:${c} ${sub}`;
      k(name, 0, { transform: from, opacity: 0 }, EASE.out);
      k(name, M[i] + t, { transform: from, opacity: 0 }, EASE.out);
      k(name, M[i] + t + d, { transform: 'translateY(0%)', opacity: 1 });
    };
    s('.eyebrow', 0.2, 0.5, 'translateY(10px)');
    s('.mk-in', 0.3, 0.7, 'translateY(108%)');
    s('.desc', 0.7, 0.6, 'translateY(14px)');
    if (i < 8) {
      const name = `css:${c} .hook`;
      k(name, 0, { opacity: 0, transform: 'translateX(-10px)' }, EASE.out);
      k(name, M[i + 1] - 2.4, { opacity: 0, transform: 'translateX(-10px)' }, EASE.out);
      k(name, M[i + 1] - 1.7, { opacity: 1, transform: 'translateX(0px)' });
    }
  }
  k('cp-9', 0, { opacity: 0 }, EASE.inout);
  k('cp-9', M[9] + 0.5, { opacity: 0 }, EASE.inout);
  k('cp-9', M[9] + 1.2, { opacity: 1 });
  const s9 = (sel: string, t: number, d: number, from: string) => {
    const name = `css:[data-w=cp-9] ${sel}`;
    k(name, 0, { opacity: 0, transform: from }, EASE.out);
    k(name, M[9] + t, { opacity: 0, transform: from }, EASE.out);
    k(name, M[9] + t + d, { opacity: 1, transform: 'translateY(0%)' });
  };
  s9('.mk-in', 0.6, 0.7, 'translateY(108%)');
  s9('.s9-head .desc', 1.0, 0.5, 'translateY(10px)');
  s9('.eras', 1.3, 0.6, 'translateY(16px)');
  s9('.nums', 1.7, 0.5, 'translateY(12px)');
  s9('.st-actions', 2.0, 0.5, 'translateY(12px)');
  s9('.st-links', 2.2, 0.5, 'translateY(10px)');
  s9('.foot', 2.4, 0.5, 'translateY(8px)');

  return finalize(raw);
}

const YEARS_TAGS = [2, 3, 4, 5, 6, 7, 8];

/** 画面角落的一行小说明（开始和结束时淡入淡出） */
function callout(k: (n: string, t: number, p: Omit<KF, 't'>, e?: string) => void, name: string, t0: number, t1: number) {
  k(name, 0, { opacity: 0, transform: 'translateY(8px)' }, EASE.out);
  k(name, t0, { opacity: 0, transform: 'translateY(8px)' }, EASE.out);
  k(name, t0 + 0.45, { opacity: 1, transform: 'translateY(0px)' }, EASE.inout);
  k(name, t1 - 0.4, { opacity: 1, transform: 'translateY(0px)' }, EASE.out);
  k(name, t1, { opacity: 0, transform: 'translateY(-6px)' });
}

/** 排序、去重、补上 0 秒和结束时的关键帧，并把时间夹在 [0, TOTAL] 里 */
export function finalize(raw: Tracks): Tracks {
  const out: Tracks = {};
  for (const [name, list] of Object.entries(raw)) {
    const sorted = list.map(kf => ({ ...kf, t: Math.min(TOTAL, Math.max(0, kf.t)) })).sort((a, b) => a.t - b.t);
    // 同一时刻只留最后一个；两个关键帧时间太近时保持顺序
    const dedup: KF[] = [];
    for (const kf of sorted) {
      const last = dedup[dedup.length - 1];
      if (last && Math.abs(last.t - kf.t) < 1e-6) dedup[dedup.length - 1] = { ...last, ...kf };
      else dedup.push(kf);
    }
    if (dedup[0].t > 0) dedup.unshift({ ...dedup[0], t: 0 });
    const end = dedup[dedup.length - 1];
    if (end.t < TOTAL) dedup.push({ ...end, t: TOTAL });
    out[name] = dedup;
  }
  return out;
}
