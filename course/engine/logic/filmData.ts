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
/** 服务器一侧的三块（第 7 幕）：[x, y, 宽, 高] */
export const SERVER_BLOCKS: [number, number, number, number][] = [
  [140, -150, 220, 70],
  [500, -150, 220, 70],
  [760, -150, 220, 70],
];
/** 流到 DOM 层哪三块（节点 id） */
export const STREAM_TARGETS = ['Header', 'Item1', 'Item2'] as const;
export const BOLT_NODES = ['Item2', 'Box2'] as const;

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
