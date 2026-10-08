/* 练习检查读 React 内部结构的安全入口（纯函数，操作传进来的对象）。
   依赖的是 React 19.3.x 的 fiber 结构：DOM 节点上的 __reactFiber$ / __reactContainer$ 键，
   fiber 的 tag / return / memoizedState（Hook 链表，每个 Hook 有 next、queue、memoizedState），FiberRoot 的 pendingLanes 位掩码。
   每个函数在字段不存在或形状不对时返回 null（或空），调用方据此退回到纯行为断言：升级 React 后检查不会抛异常，也不会全盘误判。
   位掩码 TRANSITION_LANES 随版本变化，所以只在已知的 19.3.x 上启用（known 为 false 时 inTransition 返回 null）。 */

/** 19.3.x 的过渡更新车道（TransitionLane1 到 TransitionLane16 的位） */
export const TRANSITION_LANES = 0b0000000001111111111111111000000;
const KNOWN = /^19\.3\./;
/** 函数组件、forwardRef、memo 的 fiber.tag */
const COMPONENT_TAGS = [0, 11, 15];

export interface Internals {
  /** 这个 React 版本的内部结构已知（19.3.x） */
  known: boolean;
  fiberOf: (node: any) => any | null;
  rootOf: (container: any) => any | null;
  componentOf: (fiber: any) => any | null;
  hooksOf: (fiber: any) => any[] | null;
  hasStateHook: (fiber: any) => boolean | null;
  refValues: (fiber: any) => any[] | null;
  inTransition: (root: any) => boolean | null;
}

const keyed = (obj: any, prefix: string): any => {
  if (!obj || typeof obj !== 'object') return null;
  const k = Object.keys(obj).find(x => x.startsWith(prefix));
  return k ? obj[k] : null;
};
const isHook = (h: any): boolean => !!h && typeof h === 'object' && 'next' in h && 'memoizedState' in h;

export function makeInternals(reactVersion: string): Internals {
  const known = KNOWN.test(String(reactVersion));
  const hooksOf = (fiber: any): any[] | null => {
    if (!fiber || typeof fiber !== 'object' || !('memoizedState' in fiber)) return null;
    const out: any[] = [];
    let h = fiber.memoizedState;
    if (h === null || h === undefined) return out;
    if (!isHook(h)) return null;
    for (let n = 0; h && n < 200; h = h.next, n++) {
      if (!isHook(h)) return null;
      out.push(h);
    }
    return out;
  };
  const isState = (h: any) => !!h.queue && typeof h.queue.dispatch === 'function';
  return {
    known,
    fiberOf: node => keyed(node, '__reactFiber$'),
    rootOf: container => {
      const root = keyed(container, '__reactContainer$');
      const fr = root && root.stateNode;
      return fr && typeof fr.pendingLanes === 'number' ? fr : null;
    },
    componentOf: fiber => {
      for (let f = fiber; f; f = f.return) if (COMPONENT_TAGS.includes(f.tag)) return f;
      return null;
    },
    hooksOf,
    hasStateHook: fiber => {
      const hs = hooksOf(fiber);
      return hs ? hs.some(isState) : null;
    },
    refValues: fiber => {
      const hs = hooksOf(fiber);
      if (!hs) return null;
      return hs
        .filter(
          h =>
            !h.queue &&
            h.memoizedState &&
            typeof h.memoizedState === 'object' &&
            !Array.isArray(h.memoizedState) &&
            Object.keys(h.memoizedState).join() === 'current',
        )
        .map(h => h.memoizedState.current);
    },
    inTransition: root => (known && root && typeof root.pendingLanes === 'number' ? (root.pendingLanes & TRANSITION_LANES) !== 0 : null),
  };
}
