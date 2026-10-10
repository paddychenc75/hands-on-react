/* 首页短片的静态数据：每一幕的时长、三层空间里的节点和色块的坐标。
 * 服务端渲染（HomePage.tsx）和动画（filmTracks.ts，在首页自己的异步 chunk 里）共用，所以只放数据，不放动画代码（主包要小）。
 * 设计坐标系 1000×620：三层平面（你的组件 / React 的树 / DOM）用同一套 x、y，只是 z 不同。 */

export const W = 1000;
export const H = 620;

/** 每一幕的时长（秒）。0 开场、1 手动改 DOM、2 声明式、3 协调、4 Fiber、5 Hooks、6 并发、7 服务端、8 编译器、9 收束。 */
export const DURATIONS = [5, 5.5, 5.5, 5.5, 7, 3.5, 7, 7, 4.5, 5] as const;
export const MARKS: number[] = DURATIONS.reduce<number[]>((a, _d, i) => {
  a.push(i ? a[i - 1] + DURATIONS[i - 1] : 0);
  return a;
}, []);
export const TOTAL: number = DURATIONS.reduce((s, d) => s + d, 0);
/** 手动滚动：每秒对应多少个“舞台高 / 6”，整片约 9 个屏幕高 */
export const SECONDS_PER_SCREEN = 6;

export interface FNode {
  id: string;
  label: string;
  parent: string | null;
  x: number;
  y: number;
  /** 能不能被 memo / 编译器挡住（Item 和它的后代） */
  memo?: boolean;
}
/** 树：和课文里的 <RenderTree /> 同一棵：App → Header（Logo、Search）、TodoList（两个 Item，各带一个 Checkbox） */
export const NODES: readonly FNode[] = [
  { id: 'App', label: 'App', parent: null, x: 500, y: 62 },
  { id: 'Header', label: 'Header', parent: 'App', x: 250, y: 190 },
  { id: 'TodoList', label: 'TodoList', parent: 'App', x: 740, y: 190 },
  { id: 'Logo', label: 'Logo', parent: 'Header', x: 150, y: 318 },
  { id: 'Search', label: 'Search', parent: 'Header', x: 360, y: 318 },
  { id: 'Item1', label: 'Item', parent: 'TodoList', x: 610, y: 318, memo: true },
  { id: 'Item2', label: 'Item', parent: 'TodoList', x: 870, y: 318, memo: true },
  { id: 'Box1', label: 'Checkbox', parent: 'Item1', x: 610, y: 446, memo: true },
  { id: 'Box2', label: 'Checkbox', parent: 'Item2', x: 870, y: 446, memo: true },
];
export const nodeById = (id: string): FNode => NODES.find(n => n.id === id) as FNode;
export const childrenOf = (id: string): string[] => NODES.filter(n => n.parent === id).map(n => n.id);
/** 一个节点和它的所有后代（先父后子、按层） */
export function subtree(id: string): string[] {
  const out = [id];
  for (let i = 0; i < out.length; i++) out.push(...childrenOf(out[i]));
  return out;
}
export const depthOf = (id: string): number => {
  let d = 0;
  for (let n = nodeById(id); n.parent; n = nodeById(n.parent)) d++;
  return d;
};
/** DOM 层的色块：和树的节点一一对应，位置在同一个 (x, y)，只是大小不同、没有文字 */
export const BLOCK_SIZE: Record<string, [number, number]> = {
  App: [980, 590],
  Header: [330, 84],
  TodoList: [420, 84],
  Logo: [150, 96],
  Search: [250, 96],
  Item1: [220, 96],
  Item2: [220, 96],
  Box1: [220, 70],
  Box2: [220, 70],
};
/** 流到 DOM 层哪三块（节点 id） */
export const STREAM_TARGETS = ['Header', 'Item1', 'Item2'] as const;
/** 带闪电（需要 JavaScript）的两块：Item1、Item2 这两块 */
export const BOLT_NODES = ['Item1', 'Item2'] as const;

/** 收束幕的时间轴：年份、一个词、课 id */
export const STATIONS: { year: string; name: string; lessons: string[] }[] = [
  { year: '之前', name: '手动改 DOM', lessons: ['what-is-react'] },
  { year: '2013', name: '声明式', lessons: ['state'] },
  { year: '2013', name: '协调', lessons: ['rendering'] },
  { year: '2017', name: 'Fiber', lessons: ['scheduler'] },
  { year: '2019', name: 'Hooks', lessons: ['custom-hooks'] },
  { year: '2022', name: '并发', lessons: ['concurrent'] },
  { year: '2024', name: '服务端', lessons: ['server-components', 'react-19'] },
  { year: '2025', name: '编译器', lessons: ['performance'] },
];
/** 大号年份：每一幕显示的年份（空 = 不显示）和版本说明 */
export const YEARS: { year: string; tag: string }[] = [
  { year: '', tag: '' },
  { year: '', tag: '' },
  { year: '2013', tag: 'React 开源' },
  { year: '2013', tag: '协调' },
  { year: '2017', tag: 'React 16' },
  { year: '2019', tag: 'React 16.8' },
  { year: '2022', tag: 'React 18' },
  { year: '2024', tag: 'React 19' },
  { year: '2025', tag: 'Compiler 1.0' },
  { year: '', tag: '' },
];
export const FRAMES = 28;

/** 每个时代一个主色：背景光晕、年份下的色条、年份说明里体现。0 开场、9 收束用站点强调色 */
export const ERA_COLORS = ['#5cc6e4', '#f0aa4f', '#5cc6e4', '#b3a1f2', '#55c98e', '#ff8fb8', '#6fa8ff', '#3fd0c0', '#ffd36b', '#5cc6e4'];

/** 音效和画面共用的关键时间点（秒）：filmTracks.ts 的关键帧和 audio.ts 的音效都从这里取，保证对得上 */
const M = MARKS;
export const STALL_HITS = [0, 1, 3, 4, 7, 8, 12, 13];
export const CUE = {
  /** 第 1 幕：漏改的那一块红色闪烁（峰值） */
  miss: M[1] + 4.25,
  /** 第 2 幕：光沿树逐层点亮，每层一个音（深度 0..3） */
  lightStart: M[2] + 2.9,
  lightGap: 0.62,
  /** 第 3 幕：光束落到 DOM 层 */
  land: M[3] + 3.45,
  /** 第 4 幕：旧方式掉帧，节拍卡住；新方式切片后规整的十六分音符开始 */
  stallStart: M[4] + 1.0,
  smooth: M[4] + 4.0,
  /** 第 5 幕：卡片翻转、钩子挂上去 */
  flip: M[5] + 0.65,
  attach: M[5] + 1.3,
  /** 第 5 幕：useEffect、useRef、自定义 Hook 依次挂上去（音高依次上行），然后自定义 Hook 被复制到第二张卡片 */
  hooks: [M[5] + 1.6, M[5] + 1.9, M[5] + 2.2],
  hookCopy: M[5] + 2.5,
  /** 第 6 幕：紧急更新插队；被打断的从头重来 */
  urgent: M[6] + 2.7,
  redo: M[6] + 4.5,
  /** 第 7 幕：三串光点依次从服务器飞向浏览器（起飞）、落位；Action 反向光 */
  launch: (i: number) => M[7] + 1.2 + i * 1.15,
  arrive: (i: number) => M[7] + 2.2 + i * 1.15,
  action: M[7] + 5.2,
  /** 第 8 幕：编译器扫描线 */
  scan: M[8] + 0.7,
  /** 年份数字滚动：从第 2 幕起，每个年份变化的幕 */
  tick: (i: number) => M[i] + 0.3,
  /** 换幕：前一幕文字退场的时间 */
  whoosh: (i: number) => M[i] - 0.05,
  /** 收束：三层空间缩成一个点落到时间轴上 */
  fin: M[9] + 1.5,
};

/** 音效的时间点和它对应的画面轨道（轨道名见 filmTracks.ts）：单元测试检查每个时间点 ±50ms 内轨道上有关键帧，e2e 检查离线渲染的配乐在这些点上有能量突起 */
export interface CueRef {
  name: string;
  t: number;
  track: string;
  /** 这个音效比较轻（whoosh 一类），能量突起的门槛放低 */
  soft?: boolean;
}
export function cueList(): CueRef[] {
  const out: CueRef[] = [{ name: 'miss', t: CUE.miss, track: 'bx-Box2' }];
  for (const n of subtree('App')) out.push({ name: 'light-' + n, t: CUE.lightStart + depthOf(n) * CUE.lightGap, track: 'nl-' + n });
  out.push({ name: 'land', t: CUE.land, track: 'cm-Item2' });
  for (const i of STALL_HITS) out.push({ name: 'stall-' + i, t: CUE.stallStart + i * 0.1, track: 'fx-' + i });
  out.push(
    { name: 'flip', t: CUE.flip + 0.1, track: 'hc-in' },
    { name: 'attach', t: CUE.attach, track: 'hkb' },
    ...CUE.hooks.map((t, j) => ({ name: 'hook-' + j, t, track: 'hkb-' + (j + 1) })),
    { name: 'hook-copy', t: CUE.hookCopy, track: 'hkb-c' },
    { name: 'urgent', t: CUE.urgent, track: 'ur-Search' },
  );
  for (let i = 0; i < 3; i++) {
    out.push({ name: 'launch-' + i, t: CUE.launch(i), track: 'arc-' + i }, { name: 'arrive-' + i, t: CUE.arrive(i), track: 'bl-' + STREAM_TARGETS[i] });
  }
  out.push({ name: 'action', t: CUE.action, track: 'arc-act' }, { name: 'scan', t: CUE.scan, track: 'scan' });
  for (const i of [2, 4, 5, 6, 7, 8]) out.push({ name: 'tick-' + i, t: CUE.tick(i), track: 'yd-3', soft: true });
  for (let i = 1; i <= 9; i++) out.push({ name: 'whoosh-' + i, t: CUE.whoosh(i), track: 'cp-' + (i - 1), soft: true });
  out.push({ name: 'fin', t: CUE.fin, track: 'fly-c' });
  return out;
}
