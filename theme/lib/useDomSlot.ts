import { useEffect, useRef } from 'react';

/** 和 useSlot 类似，但不依赖某一课：浏览器里调用 build()，把返回的 DOM 挂进占位元素。 */
export function useDomSlot(build: () => Element | null, deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const node = build();
    if (node) host.appendChild(node);
    return () => {
      node?.remove();
    };
    // biome-ignore lint/correctness/useExhaustiveDependencies: deps 由调用方决定何时重建 DOM；build 每次渲染都是新函数，不能放进依赖
  }, deps);
  return ref;
}
