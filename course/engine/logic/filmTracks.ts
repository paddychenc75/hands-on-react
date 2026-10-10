/* 首页短片的编排：每个元素一条“轨道”（一串关键帧，时间单位是秒），story.ts 把它们变成暂停的 Web Animations，按影片时间擦洗。
 * 纯函数、不碰 DOM，有单元测试。只动 transform、opacity 和 SVG 描边。
 * 元素用 data-w 标记（见 HomePage.tsx）；轨道名以 "css:" 开头的是 CSS 选择器。 */
import { BOLT_NODES, CUE, ERA_COLORS, FRAMES, MARKS, NODES, STREAM_TARGETS, TOTAL, depthOf, nodeById, subtree } from './filmData.ts';

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
/** 手机上相机要“取景”：每一幕只拍和本幕相关的那一块，放大后节点上的字才读得出来（不相关的节点在画外）。
 *  平移写成 calc(var(--ws) * N px)：--ws 是舞台的缩放（story.ts 的 fitWorld 按画面区域算出），所以不管手机多宽，同一个设计坐标都取到同一块。
 *  focus(cx, cy, s)：把数据平面上的点 (cx, cy)（1000×620 设计坐标）移到画面中心，放大 s 倍。 */
const focus = (cx: number, cy: number, s: number, rx = 46, rz = -12): Pose => [rx, rz, -(cx - 500) * s, -(cy - 310) * s, s];
const poseCssMobile = (p: Pose) =>
  `rotateX(${p[0]}deg) rotateZ(${p[1]}deg) translate3d(calc(var(--ws) * ${p[2].toFixed(1)}px), calc(var(--ws) * ${p[3].toFixed(1)}px), 0px) scale(${p[4]})`;
const POSES_MOBILE: Pose[] = [
  focus(500, 270, 1.08, 26, -64), // 0 开场：整个三层空间，竖着占满下半屏
  focus(540, 318, 0.95, 36), // 1 手动改 DOM：DOM 层的三块和那条漏掉的线
  focus(670, 250, 1.85, 36), // 2 声明式：App、TodoList 和两个 Item，光从根往下
  focus(740, 370, 2.0, 36), // 3 协调：TodoList 的子树，两处差别
  focus(620, 235, 2.1, 36), // 4 Fiber：树里正在被切片的工作单元
  focus(500, 310, 1.0, 40, -16), // 5 Hooks：画面在卡片上（HUD），三维层退到后面
  focus(440, 280, 2.1, 36), // 6 并发：被打断的节点和插队的 Search
  focus(540, 300, 1.15, 36), // 7 服务端：服务器面板到三个节点的光路
  focus(730, 330, 2.1, 36), // 8 编译器：被扫描的卡片和被跳过的子树
  [60, -24, 0, -250, 0.34], // 9 收束
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
  const camCss = (p: Pose, i: number) => (mobile && i < 9 ? poseCssMobile(p) : poseCss(p));
  k(
    'cam',
    0,
    {
      transform: mobile
        ? camCss([poses[0][0] + 20, poses[0][1] - 20, poses[0][2], poses[0][3], poses[0][4] * 0.85], 0)
        : poseCss([68, -40, poses[0][2] * 0.6, 60, poses[0][4] * 0.85]),
    },
    EASE.inout,
  );
  poses.forEach((p, i) => {
    const arrive = i === 0 ? (mobile ? 2.4 : 4.6) : M[i] + 0.9;
    k('cam', arrive, { transform: camCss(p, i) }, EASE.inout);
    // 到位后很慢地继续飘一点（镜头推拉），到下一幕之前再被下一个姿态接走
    const end = i === 9 ? TOTAL : M[i + 1] - 0.05;
    const drift: Pose =
      mobile && i < 9 ? [p[0] + 1.5, p[1] + 2, p[2] - 8 * p[4], p[3] + 4 * p[4], p[4] * 1.02] : [p[0] + 1.5, p[1] + 2, p[2] - 8, p[3] + 4, p[4] * 1.025];
    k('cam', end, { transform: camCss(drift, i) }, EASE.lin);
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

  /* ===== 5 Hooks：镜头推近到一张卡片，class 翻成 function，钩子带着 useState 挂上去 ===== */
  k('hc', 0, { opacity: 0, transform: 'scale(.8)' }, EASE.out);
  k('hc', M[5] + 0.15, { opacity: 0, transform: 'scale(.8)' }, EASE.out);
  k('hc', M[5] + 0.5, { opacity: 1, transform: 'scale(1)' }, EASE.inout);
  k('hc', M[6] - 0.5, { opacity: 1, transform: 'scale(1)' }, EASE.inout);
  k('hc', M[6] - 0.05, { opacity: 0, transform: 'scale(1.06)' });
  k('hc-in', 0, { transform: 'rotateY(0deg)' }, EASE.inout);
  k('hc-in', CUE.flip - 0.15, { transform: 'rotateY(0deg)' }, EASE.inout);
  k('hc-in', CUE.flip + 0.1, { transform: 'rotateY(-12deg)' }, EASE.out); // 翻之前的预备：轻微回缩
  k('hc-in', CUE.flip + 0.95, { transform: 'rotateY(-180deg)' }, EASE.back);
  k('hc-in', CUE.flip + 1.1, { transform: 'rotateY(-180deg)' });
  const hookIn = (name: string, t: number, from = 'translate(140px, -90px) rotate(28deg) scale(.5)') => {
    k(name, 0, { opacity: 0, transform: from }, EASE.out);
    k(name, t - 0.55, { opacity: 0, transform: from }, EASE.out);
    k(name, t - 0.3, { opacity: 1, transform: 'translate(70px, -40px) rotate(12deg) scale(.8)' }, EASE.back);
    k(name, t, { opacity: 1, transform: 'translate(0px, 0px) rotate(0deg) scale(1.1)' }, EASE.out);
    k(name, t + 0.2, { opacity: 1, transform: 'translate(0px, 0px) rotate(0deg) scale(1)' });
  };
  hookIn('hkb', CUE.attach);
  CUE.hooks.forEach((t, j) => hookIn('hkb-' + (j + 1), t, 'translate(80px, -70px) rotate(20deg) scale(.5)'));
  // 第二张卡片：自定义 Hook 被复制过来（同一个钩子，第二次挂上）
  k('hc2', 0, { opacity: 0, transform: 'translateY(14px) scale(.92)' }, EASE.out);
  k('hc2', CUE.hookCopy - 0.45, { opacity: 0, transform: 'translateY(14px) scale(.92)' }, EASE.out);
  k('hc2', CUE.hookCopy - 0.1, { opacity: 1, transform: 'translateY(0px) scale(1)' }, EASE.inout);
  k('hc2', M[6] - 0.5, { opacity: 1, transform: 'translateY(0px) scale(1)' }, EASE.inout);
  k('hc2', M[6] - 0.05, { opacity: 0, transform: 'translateY(0px) scale(1.04)' });
  hookIn('hkb-c', CUE.hookCopy, 'translate(0px, -120px) rotate(0deg) scale(.7)');
  // 镜头推近：别的东西让一让
  k('cam', M[5] + 0.1, { opacity: 1 }, EASE.inout);
  k('cam', M[5] + 0.7, { opacity: 0.22 }, EASE.inout);
  k('cam', M[6] - 0.5, { opacity: 0.22 }, EASE.inout);
  k('cam', M[6] + 0.2, { opacity: 1 });
  for (const id of ['Header', 'TodoList', 'Item1']) {
    k('hk-' + id, 0, { opacity: 0, transform: 'translateX(-50%) translateY(-8px)' }, EASE.back);
    k('hk-' + id, M[5] + 2.9, { opacity: 0, transform: 'translateX(-50%) translateY(-8px)' }, EASE.back);
    k('hk-' + id, M[5] + 3.3, { opacity: 1, transform: 'translateX(-50%) translateY(0px)' });
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

  /* ===== 7 服务端：左边一个独立的服务器面板，渲染好的块成串飞向右边的浏览器，落进骨架占位；带闪电的两块落位时通电 ===== */
  k('srvp', 0, { opacity: 0, transform: 'translateX(-40px)' }, EASE.out);
  k('srvp', M[7] + 0.2, { opacity: 0, transform: 'translateX(-40px)' }, EASE.out);
  k('srvp', M[7] + 0.9, { opacity: 1, transform: 'translateX(0px)' }, EASE.inout);
  k('srvp', M[8] + 0.1, { opacity: 1, transform: 'translateX(0px)' }, EASE.inout);
  k('srvp', M[8] + 0.7, { opacity: 0, transform: 'translateX(-40px)' });
  const targets = [...STREAM_TARGETS];
  for (let i = 0; i < 3; i++) {
    const L = CUE.launch(i);
    const A = CUE.arrive(i);
    const target = targets[i];
    // 面板上的块：先渲染出来（亮起），起飞时闪一下，然后变淡
    k('sbk-' + i, 0, { opacity: 0, transform: 'scale(.6)' }, EASE.back);
    k('sbk-' + i, L - 0.6, { opacity: 0, transform: 'scale(.6)' }, EASE.back);
    k('sbk-' + i, L - 0.15, { opacity: 1, transform: 'scale(1)' }, EASE.out);
    k('sbk-' + i, L + 0.3, { opacity: 1, transform: 'scale(1.12)' }, EASE.out);
    k('sbk-' + i, L + 0.7, { opacity: 0.4, transform: 'scale(1)' });
    k('sbk-' + i, M[8] + 0.1, { opacity: 0.4, transform: 'scale(1)' });
    // 弧形光路：先淡淡地显出路，光点成串飞过去，带拖尾
    k('arcb-' + i, 0, { opacity: 0 }, EASE.inout);
    k('arcb-' + i, L - 0.4, { opacity: 0 }, EASE.inout);
    k('arcb-' + i, L, { opacity: 0.55 }, EASE.inout);
    k('arcb-' + i, M[8] + 0.1, { opacity: 0.55 }, EASE.inout);
    k('arcb-' + i, M[8] + 0.7, { opacity: 0 });
    for (const [n, peak] of [
      ['arcw-', 0.4],
      ['arc-', 1],
    ] as const) {
      k(n + i, 0, { opacity: 0, strokeDashoffset: '0.5' }, EASE.lin);
      k(n + i, L, { opacity: 0, strokeDashoffset: '0.5' }, EASE.lin);
      k(n + i, L + 0.06, { opacity: peak, strokeDashoffset: '0.45' }, EASE.lin);
      k(n + i, A - 0.05, { opacity: peak, strokeDashoffset: '-0.9' }, EASE.lin);
      k(n + i, A + 0.1, { opacity: 0, strokeDashoffset: '-1.1' }, EASE.lin);
    }
    // 落位：骨架被冲刷成实块
    k('bs-' + target, 0, { opacity: 0 });
    k('bs-' + target, M[7] + 0.5, { opacity: 0 }, EASE.out);
    k('bs-' + target, M[7] + 1.0, { opacity: 1 }, EASE.inout);
    k('bs-' + target, A - 0.05, { opacity: 1 }, EASE.out);
    k('bs-' + target, A + 0.45, { opacity: 0 });
    flash('bl-' + target, A, 0.12, 0.95);
    flash('cm-' + target, A, 0.4);
  }
  // 带闪电的两块（Item1、Item2）：落位时通电，出现“JS”小标；其余块没有
  BOLT_NODES.forEach(id => {
    const i = targets.indexOf(id);
    const A = CUE.arrive(i);
    pop('bz-' + id, A + 0.1, 0.45);
    k('bz-' + id, M[8] + 0.1, { opacity: 1, transform: 'scale(1)' }, EASE.inout);
    k('bz-' + id, M[8] + 0.7, { opacity: 0, transform: 'scale(1)' });
    flash('nl-' + id, A + 0.1, 0.3, 0.95);
    const r = i === 1 ? 'rip' : 'rip2';
    k(r, A, { opacity: 0, transform: 'scale(.1)' }, EASE.out);
    k(r, A + 0.1, { opacity: 0.9, transform: 'scale(.3)' }, EASE.out);
    k(r, A + 0.9, { opacity: 0, transform: 'scale(1.5)' });
  });
  // 表单提交是一个 Action：一道光从浏览器回到服务器
  for (const [n, peak] of [
    ['arcw-act', 0.4],
    ['arc-act', 1],
  ] as const) {
    k(n, 0, { opacity: 0, strokeDashoffset: '0.5' }, EASE.lin);
    k(n, CUE.action, { opacity: 0, strokeDashoffset: '0.5' }, EASE.lin);
    k(n, CUE.action + 0.06, { opacity: peak, strokeDashoffset: '0.45' }, EASE.lin);
    k(n, CUE.action + 1.0, { opacity: peak, strokeDashoffset: '-0.9' }, EASE.lin);
    k(n, CUE.action + 1.15, { opacity: 0, strokeDashoffset: '-1.1' }, EASE.lin);
  }

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

  /* ===== 每个时代一个主色：背景光晕、年份下的色条 ===== */
  for (let i = 0; i < ERA_COLORS.length; i++) {
    const n = 'eg-' + i;
    k(n, 0, { opacity: i === 0 ? 1 : 0 }, EASE.inout);
    if (i > 0) {
      k(n, M[i] + 0.1, { opacity: 0 }, EASE.inout);
      k(n, M[i] + 1.0, { opacity: 1 }, EASE.inout);
    }
    if (i < ERA_COLORS.length - 1) {
      k(n, M[i + 1] + 0.1, { opacity: 1 }, EASE.inout);
      k(n, M[i + 1] + 1.0, { opacity: 0 });
    }
    if (i >= 2 && i <= 8) {
      const y = 'yb-' + i;
      k(y, 0, { opacity: 0, transform: 'scaleX(0)' }, EASE.out);
      k(y, M[i] + 0.5, { opacity: 0, transform: 'scaleX(0)' }, EASE.out);
      k(y, M[i] + 1.1, { opacity: 1, transform: 'scaleX(1)' }, EASE.inout);
      k(y, M[i + 1] + 0.1, { opacity: 1, transform: 'scaleX(1)' }, EASE.inout);
      k(y, M[i + 1] + 0.5, { opacity: 0, transform: 'scaleX(1)' });
    }
  }

  /* ===== 年份：大号数字滚动切换 ===== */
  const yrs = ['2013', '2013', '2017', '2019', '2022', '2024', '2025'];
  const scenesOfYear = [2, 3, 4, 5, 6, 7, 8];
  for (let d = 0; d < 4; d++) {
    const val = (y: string) => -Number(y[d]);
    k('yd-' + d, 0, { transform: `translateY(${val('2012')}em)` }, EASE.inout);
    k('yd-' + d, M[2] + 0.2, { transform: `translateY(${val('2012')}em)` }, EASE.inout);
    let prev = '2012';
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
  k('cp-0', M[1] - 0.05, { opacity: 0 });
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
  s9('.fin-eyebrow', 0.45, 0.5, 'translateY(10px)');
  s9('.mk-in', 0.55, 0.7, 'translateY(108%)');
  s9('.fin-head .desc', 0.95, 0.5, 'translateY(10px)');
  s9('.stats3', 2.0, 0.5, 'translateY(14px)');
  s9('.fin-actions', 2.3, 0.5, 'translateY(14px)');
  s9('.foot', 2.9, 0.5, 'translateY(8px)');
  // 时间轴的曲线先从左到右画出来（桌面）；手机上是竖线从上到下
  k('tl-draw', 0, { strokeDashoffset: '1' }, EASE.inout);
  k('tl-draw', M[9] + 0.6, { strokeDashoffset: '1' }, EASE.inout);
  k('tl-draw', CUE.fin - 0.05, { strokeDashoffset: '0' });
  k('tl-line', 0, { opacity: 0, transform: 'scaleY(0)' }, EASE.inout);
  k('tl-line', M[9] + 0.6, { opacity: 0, transform: 'scaleY(0)' }, EASE.inout);
  k('tl-line', CUE.fin - 0.05, { opacity: 1, transform: 'scaleY(1)' });
  // 三层空间彻底收掉，换成干净的深色底和时间轴后面一团柔光
  k('finbg', 0, { opacity: 0 }, EASE.inout);
  k('finbg', M[9] + 0.4, { opacity: 0 }, EASE.inout);
  k('finbg', M[9] + 1.4, { opacity: 1 });
  k('cam', M[9] + 0.9, { opacity: 1 }, EASE.inout);
  k('cam', M[9] + 1.5, { opacity: 0 });
  for (const n of ['pl1', 'pl2', 'pl3', 'pl4']) {
    k(n, M[9] + 1.5, { opacity: 0 }, EASE.inout);
  }
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

/* ===== 幕间的“过渡元素”和收束幕的时间轴卡片：起点终点要在布局稳定后量出来（story.ts 量，传进来），所以单独一个函数 ===== */
export interface Pt {
  x: number;
  y: number;
}
export interface Measure {
  /** 第 1 幕三条手工的线落在 DOM 层的三块（屏幕坐标，相对 .world） */
  a: [Pt, Pt, Pt];
  /** 第 2 幕根节点 */
  aEnd: Pt;
  /** 第 3 幕被标出差别的那一处（旗标） */
  bStart: Pt;
  /** 第 4 幕节拍线上的第一格 */
  bEnd: Pt;
  /** 收束：三层空间的中心 */
  cStart: Pt;
  /** 收束幕时间轴上 8 张卡片的中心 */
  li: Pt[];
}

/** 从 p0 到 p1 的一条向上拱的弧线上取 n+1 个点 */
export function arcPoints(p0: Pt, p1: Pt, lift = 0.3, n = 8): Pt[] {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const d = Math.hypot(dx, dy) || 1;
  const c = { x: (p0.x + p1.x) / 2 + (dy / d) * d * lift, y: (p0.y + p1.y) / 2 - (dx / d) * d * lift - d * 0.1 };
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push({ x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * c.x + t ** 2 * p1.x, y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * c.y + t ** 2 * p1.y });
  }
  return out;
}

export function flyerTracks(m: Measure): Tracks {
  const raw: Tracks = {};
  const k = (name: string, t: number, props: Omit<KF, 't'>, easing = EASE.lin) => {
    if (!raw[name]) raw[name] = [];
    raw[name].push({ t, easing, ...props });
  };
  const tf = (p: Pt, s = 1, r = 0) => `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${r}deg) scale(${s})`;
  /** 沿弧线飞：每个采样点一个关键帧 */
  const fly = (name: string, from: Pt, to: Pt, t0: number, t1: number, s0: number, s1: number, lift = 0.3, rot = 0) => {
    const pts = arcPoints(from, to, lift);
    pts.forEach((p, i) => {
      const u = i / (pts.length - 1);
      const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
      k(name, t0 + (t1 - t0) * u, { transform: tf(p, s0 + (s1 - s0) * e, rot * e) });
    });
  };

  // (a) 第 1 幕：三条手工的线收拢，汇成第 2 幕从根流入的那一道 state
  m.a.forEach((from, i) => {
    const name = `fly-a-${i}`;
    const t0 = MARKS[2] + 0.1 + i * 0.12;
    const t1 = MARKS[2] + 2.05;
    k(name, 0, { opacity: 0, transform: tf(from, 0.6) });
    k(name, t0, { opacity: 0, transform: tf(from, 0.6) });
    k(name, t0 + 0.2, { opacity: 1, transform: tf(from, 1) });
    fly(name, from, m.aEnd, t0 + 0.2, t1, 1, 1.15, 0.35 - i * 0.3);
    k(name, t1, { opacity: 1 });
    k(name, t1 + 0.25, { opacity: 0, transform: tf(m.aEnd, 0.3) });
  });
  // (b) 第 3 幕剩下的那一处差别标记，飞到第 4 幕节拍线上的第一格，变成第一个工作单元
  const bT0 = MARKS[3] + 4.5;
  const bT1 = MARKS[4] + 0.95;
  k('fly-b', 0, { opacity: 0, transform: tf(m.bStart, 1) });
  k('fly-b', bT0, { opacity: 0, transform: tf(m.bStart, 1) });
  k('fly-b', bT0 + 0.1, { opacity: 1, transform: tf(m.bStart, 1) });
  fly('fly-b', m.bStart, m.bEnd, bT0 + 0.1, bT1, 1, 0.55, 0.28, 90);
  k('fly-b', bT1 + 0.05, { opacity: 1 });
  k('fly-b', bT1 + 0.3, { opacity: 0, transform: tf(m.bEnd, 0.5, 90) });
  k('fly-b-ring', 0, { opacity: 0, transform: tf(m.bEnd, 0.3) });
  k('fly-b-ring', bT1, { opacity: 0, transform: tf(m.bEnd, 0.3) }, EASE.out);
  k('fly-b-ring', bT1 + 0.1, { opacity: 0.95, transform: tf(m.bEnd, 0.7) }, EASE.out);
  k('fly-b-ring', bT1 + 0.8, { opacity: 0, transform: tf(m.bEnd, 2.4) });
  // (c) 收束：三层空间整体缩小、旋转，落成时间轴上的最后一个点；其余各点依次从它“拉”出来
  const last = m.li[m.li.length - 1];
  const cT0 = MARKS[9] + 0.15;
  const cT1 = CUE.fin;
  k('fly-c', 0, { opacity: 0, transform: tf(m.cStart, 3, 0) });
  k('fly-c', cT0, { opacity: 0, transform: tf(m.cStart, 3, 0) }, EASE.out);
  k('fly-c', cT0 + 0.2, { opacity: 1, transform: tf(m.cStart, 3, 0) });
  fly('fly-c', m.cStart, last, cT0 + 0.2, cT1, 3, 0.5, 0.15, 360);
  k('fly-c', cT1 + 0.05, { opacity: 1 });
  k('fly-c', cT1 + 0.35, { opacity: 0, transform: tf(last, 0.4, 360) });
  m.li.forEach((p, j) => {
    const name = `css:[data-w="cp-9"] .eras li:nth-child(${j + 1})`;
    const from = { x: last.x - p.x, y: last.y - p.y };
    const t = j === m.li.length - 1 ? cT1 - 0.05 : cT1 + 0.1 + (m.li.length - 2 - j) * 0.16;
    const hid = `translate(${from.x.toFixed(1)}px, ${from.y.toFixed(1)}px) scale(.4)`;
    k(name, 0, { opacity: 0, transform: hid }, EASE.out);
    k(name, t, { opacity: 0, transform: hid }, EASE.out);
    k(name, t + 0.6, { opacity: 1, transform: 'translate(0px, 0px) scale(1)' });
  });
  return finalize(raw);
}
