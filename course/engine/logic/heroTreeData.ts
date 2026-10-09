// 首页组件树的静态数据：节点、坐标。首页的静态版本（服务端渲染的 HTML）只需要它，
// 所以单独放一个文件：脉冲计划和动画（heroTree.ts）在首页自己的异步 chunk 里，不进站点主包。

export interface HeroNode {
  /** 唯一 id（同名组件用不同 id，例如 Item1、Item2） */
  id: string;
  /** 显示的组件名 */
  label: string;
  parent: string | null;
  /** 在 440×340 的设计坐标里的中心位置（页面上按百分比缩放） */
  x: number;
  y: number;
  /** 能不能被 memo 包住（首页上是 Item） */
  memoizable?: boolean;
}

/** 设计坐标系的宽和高；节点和连线都按它换算成百分比 */
export const HERO_W = 440;
export const HERO_H = 340;

/** 树：App → Header（Logo、Search）、TodoList（两个 Item，各带一个 Checkbox）。共 9 个节点、4 行。 */
export const HERO_NODES: readonly HeroNode[] = [
  { id: 'App', label: 'App', parent: null, x: 220, y: 30 },
  { id: 'Header', label: 'Header', parent: 'App', x: 110, y: 122 },
  { id: 'TodoList', label: 'TodoList', parent: 'App', x: 330, y: 122 },
  { id: 'Logo', label: 'Logo', parent: 'Header', x: 55, y: 214 },
  { id: 'Search', label: 'Search', parent: 'Header', x: 165, y: 214 },
  { id: 'Item1', label: 'Item', parent: 'TodoList', x: 275, y: 214, memoizable: true },
  { id: 'Item2', label: 'Item', parent: 'TodoList', x: 385, y: 214, memoizable: true },
  { id: 'Box1', label: 'Checkbox', parent: 'Item1', x: 275, y: 306 },
  { id: 'Box2', label: 'Checkbox', parent: 'Item2', x: 385, y: 306 },
];

/** 读屏用的节点名：同名的节点加“第几个”，再说渲染次数和 memo 状态 */
export function accName(nodes: readonly HeroNode[], id: string, count: number, memoOn: boolean): string {
  const n = nodes.find(x => x.id === id);
  if (!n) return id;
  const same = nodes.filter(x => x.label === n.label);
  const who = same.length > 1 ? `${n.label}（第 ${same.indexOf(n) + 1} 个）` : n.label;
  return `${who}，已渲染 ${count} 次${memoOn && n.memoizable ? '，包了 memo' : ''}。点击模拟它调用 set 函数`;
}
