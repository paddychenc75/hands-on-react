// 首页主视觉“状态沿着组件树流下去”的纯逻辑：
// 给定树结构、被点击的节点、被 memo 包住的节点集合，算出哪些节点重新渲染、按什么顺序和延迟。
// 不碰 DOM、存储和时间：动画怎么演（光点、回弹、计数滚动）在 course/engine/heroTree.ts。
// 树的静态数据（节点和坐标）在 heroTreeData.ts：首页的静态版本要用它，动画和计划的代码不进站点主包。

import type { HeroNode } from './heroTreeData.ts';

export { HERO_H, HERO_NODES, HERO_W, type HeroNode } from './heroTreeData.ts';

/** 点击节点后“按下”的反馈时长；之后光点才出发 */
export const PRESS_MS = 140;
/** 每深一层，光点晚出发多久 */
export const HOP_MS = 240;
/** 光点沿一条连线流动的时长 */
export const TRAVEL_MS = 300;
/** 到达后节点回弹、计数滚动的收尾时长（只用于估算整个脉冲的总时长） */
export const SETTLE_MS = 400;

export interface PulseStep {
  id: string;
  /** 光点从哪个节点来；起点是 null */
  parent: string | null;
  /** 离起点几层 */
  depth: number;
  /** 光点出发的时间（相对点击，毫秒） */
  startMs: number;
  /** 到达（节点亮起或被挡住）的时间 */
  arriveMs: number;
  /** render：重新渲染；blocked：被 memo 挡住，没有渲染 */
  outcome: 'render' | 'blocked';
}

export interface PulsePlan {
  origin: string;
  /** 按到达时间排序；起点在最前面 */
  steps: PulseStep[];
  /** 最后一个步骤到达的时间 */
  durationMs: number;
}

const kids = (nodes: readonly HeroNode[], id: string) => nodes.filter(n => n.parent === id);

/** 一个节点和它所有后代的 id（前序） */
export function subtreeIds(nodes: readonly HeroNode[], id: string): string[] {
  const out = [id];
  for (const c of kids(nodes, id)) out.push(...subtreeIds(nodes, c.id));
  return out;
}

/** 点击 origin（它调用了 set 函数）：它自己一定渲染；光点逐层流向后代；遇到 memo 节点停下，那个节点和它的子树都不渲染。 */
export function planPulse(nodes: readonly HeroNode[], origin: string, memo: Iterable<string>): PulsePlan {
  const memoSet = new Set(memo);
  const steps: PulseStep[] = [{ id: origin, parent: null, depth: 0, startMs: 0, arriveMs: 0, outcome: 'render' }];
  const walk = (id: string, depth: number) => {
    for (const c of kids(nodes, id)) {
      const startMs = PRESS_MS + depth * HOP_MS;
      const blocked = memoSet.has(c.id);
      steps.push({ id: c.id, parent: id, depth: depth + 1, startMs, arriveMs: startMs + TRAVEL_MS, outcome: blocked ? 'blocked' : 'render' });
      if (!blocked) walk(c.id, depth + 1);
    }
  };
  walk(origin, 0);
  steps.sort((a, b) => a.arriveMs - b.arriveMs);
  return { origin, steps, durationMs: Math.max(...steps.map(s => s.arriveMs)) };
}

export type Counts = Record<string, number>;

/** 每个节点首次渲染过一次 */
export function initialCounts(nodes: readonly HeroNode[]): Counts {
  return Object.fromEntries(nodes.map(n => [n.id, 1]));
}

/** 某个节点渲染一次：返回新的计数，不改传入的对象 */
export function bump(counts: Counts, id: string): Counts {
  return { ...counts, [id]: (counts[id] || 0) + 1 };
}

/** 整个脉冲结束后的计数（动画里是每步到达时逐个 bump，结果相同） */
export function applyPlan(counts: Counts, plan: PulsePlan): Counts {
  let c = counts;
  for (const s of plan.steps) if (s.outcome === 'render') c = bump(c, s.id);
  return c;
}

const labelOf = (nodes: readonly HeroNode[], id: string) => nodes.find(n => n.id === id)?.label ?? id;

function blockedSummary(nodes: readonly HeroNode[], plan: PulsePlan): string {
  const groups = new Map<string, number>();
  for (const s of plan.steps) if (s.outcome === 'blocked') groups.set(labelOf(nodes, s.id), (groups.get(labelOf(nodes, s.id)) || 0) + 1);
  return [...groups].map(([label, n]) => `${n} 个 ${label}`).join('、');
}

/** 读屏播报：一句话说清谁重新渲染了。每次脉冲只播这一句，不逐个节点播。 */
export function describePlan(nodes: readonly HeroNode[], plan: PulsePlan): string {
  const origin = labelOf(nodes, plan.origin);
  const descendants = plan.steps.filter(s => s.outcome === 'render' && s.depth > 0).length;
  let text = descendants
    ? `${origin} 和它的 ${descendants} 个后代重新渲染了，共 ${descendants + 1} 个组件`
    : `${origin} 重新渲染了，它没有${plan.steps.length > 1 ? '被渲染的' : ''}后代`;
  const b = blockedSummary(nodes, plan);
  if (b) text += `；${b} 被 memo 跳过，连同它们的子树`;
  return text;
}

/** 树旁边的一行小字，说明正在发生什么 */
export function narratePlan(nodes: readonly HeroNode[], plan: PulsePlan, memo: Iterable<string> = []): string {
  const origin = labelOf(nodes, plan.origin);
  const memoOrigin = new Set(memo).has(plan.origin);
  if (plan.steps.some(s => s.outcome === 'blocked')) {
    const labels = [...new Set(plan.steps.filter(s => s.outcome === 'blocked').map(s => labelOf(nodes, s.id)))].join('、');
    return `${origin} 调用了 set 函数 → ${labels} 的 props 没变，memo 跳过了这次渲染`;
  }
  if (memoOrigin) return `${origin} 自己的 state 变了 → memo 挡不住自己的更新，它和它的后代照常渲染`;
  return `${origin} 调用了 set 函数 → 它和它的后代重新渲染`;
}
