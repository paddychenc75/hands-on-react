import { describe, expect, it } from 'vitest';
import {
  HERO_NODES,
  HOP_MS,
  PRESS_MS,
  TRAVEL_MS,
  applyPlan,
  bump,
  describePlan,
  initialCounts,
  narratePlan,
  planPulse,
  subtreeIds,
} from '../../course/engine/logic/heroTree.ts';

const MEMO = ['Item1', 'Item2'];
const rendered = (id: string, memo: string[] = []) =>
  planPulse(HERO_NODES, id, memo)
    .steps.filter(s => s.outcome === 'render')
    .map(s => s.id);
const blocked = (id: string, memo: string[] = []) =>
  planPulse(HERO_NODES, id, memo)
    .steps.filter(s => s.outcome === 'blocked')
    .map(s => s.id);

describe('首页组件树：谁重新渲染', () => {
  it('树有 9 个节点、3 层深；每个非根节点的父节点都存在', () => {
    expect(HERO_NODES).toHaveLength(9);
    const ids = new Set(HERO_NODES.map(n => n.id));
    expect(ids.size).toBe(9);
    for (const n of HERO_NODES) if (n.parent) expect(ids.has(n.parent)).toBe(true);
    expect(Math.max(...planPulse(HERO_NODES, 'App', []).steps.map(s => s.depth))).toBe(3);
  });

  it('点 TodoList：它和 4 个后代渲染，兄弟 Header 一支和祖先 App 不动', () => {
    const r = rendered('TodoList');
    expect(new Set(r)).toEqual(new Set(['TodoList', 'Item1', 'Item2', 'Box1', 'Box2']));
    expect(r).not.toContain('App');
    expect(r).not.toContain('Header');
    expect(subtreeIds(HERO_NODES, 'TodoList')).toHaveLength(5);
  });

  it('点叶子节点：只有它自己', () => {
    expect(rendered('Logo')).toEqual(['Logo']);
  });

  it('点根节点：全部 9 个都渲染', () => {
    expect(rendered('App')).toHaveLength(9);
  });

  it('按层出现：起点在 0，每深一层晚 HOP_MS，到达时间 = 出发 + TRAVEL_MS', () => {
    const plan = planPulse(HERO_NODES, 'TodoList', []);
    const by = Object.fromEntries(plan.steps.map(s => [s.id, s]));
    expect(by.TodoList).toMatchObject({ depth: 0, parent: null, startMs: 0, arriveMs: 0 });
    expect(by.Item1).toMatchObject({ depth: 1, parent: 'TodoList', startMs: PRESS_MS, arriveMs: PRESS_MS + TRAVEL_MS });
    expect(by.Box1).toMatchObject({ depth: 2, parent: 'Item1', startMs: PRESS_MS + HOP_MS, arriveMs: PRESS_MS + HOP_MS + TRAVEL_MS });
    expect(by.Item1.arriveMs).toBe(by.Item2.arriveMs);
    expect(plan.durationMs).toBe(by.Box1.arriveMs);
    // 步骤按到达时间排序
    const times = plan.steps.map(s => s.arriveMs);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('整个脉冲加上收尾在 1.2~1.6 秒内（从 App 出发最长）', () => {
    const plan = planPulse(HERO_NODES, 'App', []);
    expect(plan.durationMs).toBeLessThan(1000);
    expect(plan.durationMs + 400).toBeGreaterThanOrEqual(1200);
    expect(plan.durationMs + 400).toBeLessThanOrEqual(1600);
  });
});

describe('首页组件树：memo', () => {
  it('memo 挡住子树：点 TodoList，两个 Item 被挡，Checkbox 也不会渲染', () => {
    expect(rendered('TodoList', MEMO)).toEqual(['TodoList']);
    expect(blocked('TodoList', MEMO)).toEqual(['Item1', 'Item2']);
    const all = planPulse(HERO_NODES, 'TodoList', MEMO).steps.map(s => s.id);
    expect(all).not.toContain('Box1');
    expect(all).not.toContain('Box2');
  });

  it('memo 只挡 memo 的那一支：点 App，Header 一支照常，Item 一支被挡', () => {
    const r = rendered('App', MEMO);
    expect(new Set(r)).toEqual(new Set(['App', 'Header', 'TodoList', 'Logo', 'Search']));
    expect(blocked('App', MEMO)).toEqual(['Item1', 'Item2']);
  });

  it('直接点 memo 节点自己：它照常渲染，它的后代也渲染', () => {
    expect(new Set(rendered('Item1', MEMO))).toEqual(new Set(['Item1', 'Box1']));
    expect(blocked('Item1', MEMO)).toEqual([]);
  });

  it('只有一个 Item 包了 memo 时，另一个照常渲染', () => {
    expect(new Set(rendered('TodoList', ['Item1']))).toEqual(new Set(['TodoList', 'Item2', 'Box2']));
  });

  it('被挡的节点也有到达时间（用来演出弹回），但没有后代的步骤', () => {
    const plan = planPulse(HERO_NODES, 'TodoList', MEMO);
    const b = plan.steps.find(s => s.id === 'Item1');
    expect(b).toMatchObject({ outcome: 'blocked', parent: 'TodoList', depth: 1, arriveMs: PRESS_MS + TRAVEL_MS });
    expect(plan.steps.every(s => s.depth <= 1)).toBe(true);
  });
});

describe('首页组件树：计数', () => {
  it('初始每个节点渲染 1 次', () => {
    const c = initialCounts(HERO_NODES);
    expect(Object.keys(c)).toHaveLength(9);
    expect(Object.values(c).every(n => n === 1)).toBe(true);
  });

  it('点一次：受影响的 +1，其他不变', () => {
    const c = applyPlan(initialCounts(HERO_NODES), planPulse(HERO_NODES, 'Header', []));
    expect(c).toMatchObject({ Header: 2, Logo: 2, Search: 2, App: 1, TodoList: 1, Item1: 1 });
  });

  it('连点两次同一个节点：计数是 3（初始 1 + 2 次）', () => {
    const plan = planPulse(HERO_NODES, 'TodoList', []);
    const c = applyPlan(applyPlan(initialCounts(HERO_NODES), plan), plan);
    expect(c.TodoList).toBe(3);
    expect(c.Item1).toBe(3);
    expect(c.Box2).toBe(3);
    expect(c.App).toBe(1);
  });

  it('交叉点两个节点：点 App 再点 TodoList，TodoList 一支 3 次，Header 一支 2 次', () => {
    let c = initialCounts(HERO_NODES);
    c = applyPlan(c, planPulse(HERO_NODES, 'App', []));
    c = applyPlan(c, planPulse(HERO_NODES, 'TodoList', []));
    expect(c).toMatchObject({ App: 2, Header: 2, Logo: 2, TodoList: 3, Item1: 3, Box1: 3 });
  });

  it('memo 开着连点两次：被挡的 Item 不加；点 Item 自己加', () => {
    let c = initialCounts(HERO_NODES);
    const p = planPulse(HERO_NODES, 'TodoList', MEMO);
    c = applyPlan(applyPlan(c, p), p);
    expect(c).toMatchObject({ TodoList: 3, Item1: 1, Item2: 1, Box1: 1 });
    c = applyPlan(c, planPulse(HERO_NODES, 'Item1', MEMO));
    expect(c).toMatchObject({ Item1: 2, Box1: 2, Item2: 1, Box2: 1, TodoList: 3 });
  });

  it('逐步 bump 的结果与整体 applyPlan 一致（计数在每步到达时累加，不丢不重）', () => {
    const plan = planPulse(HERO_NODES, 'App', MEMO);
    let c = initialCounts(HERO_NODES);
    for (const s of plan.steps) if (s.outcome === 'render') c = bump(c, s.id);
    expect(c).toEqual(applyPlan(initialCounts(HERO_NODES), plan));
  });

  it('不修改传入的计数对象', () => {
    const c = initialCounts(HERO_NODES);
    applyPlan(c, planPulse(HERO_NODES, 'App', []));
    bump(c, 'App');
    expect(c.App).toBe(1);
  });
});

describe('首页组件树：文字说明', () => {
  it('读屏播报：TodoList 和它的 4 个后代重新渲染了，共 5 个组件', () => {
    expect(describePlan(HERO_NODES, planPulse(HERO_NODES, 'TodoList', []))).toBe('TodoList 和它的 4 个后代重新渲染了，共 5 个组件');
  });
  it('叶子节点：没有后代', () => {
    expect(describePlan(HERO_NODES, planPulse(HERO_NODES, 'Logo', []))).toBe('Logo 重新渲染了，它没有后代');
  });
  it('memo 挡住时说明被跳过的是谁', () => {
    const s = describePlan(HERO_NODES, planPulse(HERO_NODES, 'TodoList', MEMO));
    expect(s).toContain('TodoList 重新渲染了');
    expect(s).toContain('2 个 Item 被 memo 跳过');
  });
  it('旁白：普通、被 memo 挡、点 memo 自己', () => {
    expect(narratePlan(HERO_NODES, planPulse(HERO_NODES, 'Item1', []))).toBe('Item 调用了 set 函数 → 它和它的后代重新渲染');
    expect(narratePlan(HERO_NODES, planPulse(HERO_NODES, 'TodoList', []))).toBe('TodoList 调用了 set 函数 → 它和它的后代重新渲染');
    expect(narratePlan(HERO_NODES, planPulse(HERO_NODES, 'TodoList', MEMO), MEMO)).toContain('props 没变，memo 跳过了这次渲染');
    expect(narratePlan(HERO_NODES, planPulse(HERO_NODES, 'Item1', MEMO), MEMO)).toContain('自己的 state 变了');
  });
});
