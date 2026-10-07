import { useEffect, useRef } from 'react';
import { loadRuntime } from '../../course/engine/index.ts';
import type { Lesson } from '../../course/types.ts';
import { useLesson } from './useLesson';

/**
 * 薄包装的核心：服务端渲染只输出一个空占位元素；
 * 在浏览器里 useEffect 调用引擎函数，把返回的 DOM 挂进占位元素，卸载时清理。
 * needsRuntime：需要先加载 React 18 开发版 + Babel（实验台、练习）。
 */
export function useSlot<N extends HTMLElement = HTMLElement>(
  build: (lesson: Lesson) => N | null,
  { needsRuntime = false, cleanup, deps = [] }: { needsRuntime?: boolean; cleanup?: (node: N) => void; deps?: unknown[] } = {},
) {
  const lesson = useLesson();
  const ref = useRef<HTMLDivElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: 依赖是课 id 加调用方给的 deps；build、cleanup 每次渲染都是新函数，放进依赖会让 DOM 反复重建
  useEffect(() => {
    const host = ref.current;
    if (!host || !lesson) return;
    let dead = false;
    let node: N | null = null;
    const mount = () => {
      if (dead) return;
      node = build(lesson);
      if (node) host.appendChild(node);
    };
    if (needsRuntime) {
      loadRuntime().then(mount).catch((e: Error) => {
        if (!dead) host.innerHTML = '<div class="pv-err">运行环境加载失败，请检查网络后刷新页面。</div>';
        console.warn(e);
      });
    } else mount();
    return () => {
      dead = true;
      if (node) { cleanup?.(node); node.remove(); }
    };
  }, [lesson?.id, ...deps]);
  return { ref, lesson };
}
