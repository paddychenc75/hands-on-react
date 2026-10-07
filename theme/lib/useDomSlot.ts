import { useEffect, useRef } from 'react';

/** 和 useSlot 类似，但不依赖某一课：浏览器里调用 build()，把返回的 DOM 挂进占位元素。 */
export function useDomSlot(build: () => HTMLElement | null, deps: any[] = []) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const node = build();
    if (node) host.appendChild(node);
    return () => { node?.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}
