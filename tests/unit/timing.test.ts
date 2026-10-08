import { describe, expect, it } from 'vitest';
import { factorFrom, limitFor, looksBusy, timingFailMessage } from '../../course/engine/logic/timing.ts';
import { makeInternals } from '../../course/engine/logic/internals.ts';

describe('计时检查：相对基线的阈值', () => {
  it('factorFrom：不会小于 1，也不会大于 20', () => {
    expect(factorFrom(0.5, 1)).toBe(1);
    expect(factorFrom(3, 1)).toBe(3);
    expect(factorFrom(500, 1)).toBe(20);
  });
  it('limitFor：设备正常时等于原来的数字', () => {
    expect(limitFor(40, { factor: 1, lag: 0 })).toBe(40);
  });
  it('limitFor：设备慢时只加“额外开销”，不按倍数放大任务本身的时长（不然一直占用主线程的错误写法也能过）', () => {
    expect(limitFor(40, { factor: 6, lag: 10 })).toBe(70);
    expect(limitFor(40, { factor: 6, lag: 10 })).toBeLessThan(100);
  });
  it('looksBusy：慢了 3 倍以上，或定时器延迟 40ms 以上', () => {
    expect(looksBusy({ factor: 1.2, lag: 3 })).toBe(false);
    expect(looksBusy({ factor: 3, lag: 0 })).toBe(true);
    expect(looksBusy({ factor: 1, lag: 40 })).toBe(true);
  });
  it('timingFailMessage：设备忙时提示再点一次，不忙时说明更可能是代码问题', () => {
    expect(timingFailMessage('原信息', { factor: 5, lag: 0 })).toContain('再点一次');
    const calm = timingFailMessage('原信息', { factor: 1, lag: 1 });
    expect(calm).toContain('原信息');
    expect(calm).toContain('更可能是代码');
  });
});

describe('t.internals：读 React 内部结构，字段不在就返回 null', () => {
  const hook = (memoizedState: any, withQueue: boolean, next: any = null) => ({ memoizedState, next, queue: withQueue ? { dispatch() {} } : null });
  const I = makeInternals('19.3.0');

  it('fiberOf：找 __reactFiber$ 开头的键，没有就是 null', () => {
    const f = { tag: 5 };
    expect(I.fiberOf({ __reactFiber$abc: f })).toBe(f);
    expect(I.fiberOf({})).toBeNull();
    expect(I.fiberOf(null)).toBeNull();
  });
  it('componentOf：向上找函数组件', () => {
    const comp = { tag: 0, return: null };
    const host = { tag: 5, return: comp };
    expect(I.componentOf(host)).toBe(comp);
    expect(I.componentOf({ tag: 5, return: null })).toBeNull();
  });
  it('hooks：按链表取出来；结构不对返回 null', () => {
    const h2 = hook(2, true);
    const h1 = hook(1, true, h2);
    expect(I.hooksOf({ memoizedState: h1 })).toEqual([h1, h2]);
    expect(I.hooksOf({ memoizedState: 'x' })).toBeNull();
    expect(I.hooksOf(null)).toBeNull();
    expect(I.hooksOf({ memoizedState: null })).toEqual([]);
  });
  it('hasStateHook：有 useState/useReducer 的队列返回 true，没有返回 false，拿不到返回 null', () => {
    expect(I.hasStateHook({ memoizedState: hook(1, true) })).toBe(true);
    expect(I.hasStateHook({ memoizedState: hook({ current: 1 }, false) })).toBe(false);
    expect(I.hasStateHook(null)).toBeNull();
  });
  it('refValues：只取 { current } 形状的 Hook', () => {
    const fiber = { memoizedState: hook(0, true, hook({ current: 7 }, false, hook({ current: null }, false))) };
    expect(I.refValues(fiber)).toEqual([7, null]);
    expect(I.refValues(null)).toBeNull();
  });
  it('stateValues：只取 useState/useReducer 的值', () => {
    const fiber = { memoizedState: hook(3, true, hook({ current: 7 }, false, hook('a', true))) };
    expect(I.stateValues(fiber)).toEqual([3, 'a']);
    expect(I.stateValues(null)).toBeNull();
  });
  it('rootOf：校验 pendingLanes 是数字，否则 null', () => {
    expect(I.rootOf({ __reactContainer$x: { stateNode: { pendingLanes: 0 } } })).toEqual({ pendingLanes: 0 });
    expect(I.rootOf({ __reactContainer$x: { stateNode: {} } })).toBeNull();
    expect(I.rootOf({})).toBeNull();
  });
  it('suspenseCount：数容器里 tag 为 13 的 fiber；找不到根返回 null', () => {
    const leaf = { tag: 5, child: null, sibling: null };
    const inner = { tag: 13, child: leaf, sibling: null };
    const outer = { tag: 13, child: null, sibling: inner };
    const top = { tag: 3, child: { tag: 0, child: outer, sibling: null }, sibling: null };
    expect(I.suspenseCount({ __reactContainer$x: top })).toBe(2);
    expect(I.suspenseCount({ __reactContainer$x: { tag: 3, child: null } })).toBe(0);
    expect(I.suspenseCount({})).toBeNull();
    expect(I.suspenseCount(null)).toBeNull();
  });
  it('inTransition：19.3.x 按位掩码判断；别的版本返回 null，让检查退回到行为断言', () => {
    expect(I.inTransition({ pendingLanes: 0b1000000 })).toBe(true);
    expect(I.inTransition({ pendingLanes: 0b10 })).toBe(false);
    expect(I.inTransition(null)).toBeNull();
    expect(makeInternals('19.4.0').inTransition({ pendingLanes: 0b1000000 })).toBeNull();
    expect(makeInternals('19.3.0').known).toBe(true);
    expect(makeInternals('20.0.0').known).toBe(false);
  });
});
