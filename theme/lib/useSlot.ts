import { useEffect, useRef } from 'react';
import { LibLoadError, LessonLoadError, errorBox, loadLesson, loadLibs, loadRuntime, loadedLesson, loadingBox } from '../../course/engine/index.ts';
import { libsInSource } from '../../course/engine/logic/runtime.ts';
import type { Lesson, LessonMeta } from '../../course/types.ts';
import { useLesson } from './useLesson';

interface SlotOptions<N extends HTMLElement, L> {
  needsRuntime?: boolean;
  libSources?: (lesson: L) => string[];
  cleanup?: (node: N) => void;
  deps?: unknown[];
}

/**
 * 薄包装的核心：服务端渲染只输出一个空占位元素；
 * 在浏览器里 useEffect 调用引擎函数，把返回的 DOM 挂进占位元素，卸载时清理。
 * 课的重数据（题目、练习、示例说明…）是这一课自己的异步 chunk：先显示加载状态（0.15 秒后才淡入），数据到了再 build；加载失败显示原因和“重试”。
 * needsRuntime：需要先加载实验台的 React 运行时和 Babel（实验台、练习）。运行时和课数据并行加载。
 * libSources：返回这个实验台的示例代码；代码里 import 了 react-router、@tanstack/react-query 才加载对应的库文件，其余的课不多加载任何东西。
 */
function useSlotImpl<N extends HTMLElement, L extends { id: string }>(
  meta: LessonMeta | undefined,
  getData: (id: string) => { sync: L | undefined; load: () => Promise<L> },
  build: (lesson: L) => N | null,
  { needsRuntime = false, libSources, cleanup, deps = [] }: SlotOptions<N, L>,
) {
  const ref = useRef<HTMLDivElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: 依赖是课 id 加调用方给的 deps；build、cleanup 每次渲染都是新函数，放进依赖会让 DOM 反复重建
  useEffect(() => {
    const host = ref.current;
    if (!host || !meta) return;
    let dead = false;
    let node: N | null = null;
    const data = getData(meta.id);
    const mount = (lesson: L) => {
      if (dead) return;
      host.replaceChildren();
      node = build(lesson);
      if (node) host.appendChild(node);
    };
    const start = () => {
      host.replaceChildren(loadingBox());
      Promise.all([data.load(), needsRuntime ? loadRuntime() : null])
        .then(([lesson]) => Promise.resolve(needsRuntime ? loadLibs(libSources ? libsInSource(libSources(lesson).join('\n')) : []) : null).then(() => lesson))
        .then(mount)
        .catch((e: Error) => {
          if (dead) return;
          console.warn(e);
          if (e instanceof LessonLoadError) host.replaceChildren(errorBox(e.message, start));
          else {
            host.replaceChildren();
            host.innerHTML = '<div class="pv-err">' + (e instanceof LibLoadError ? e.message : '运行环境加载失败，请检查网络后刷新页面。') + '</div>';
          }
        });
    };
    // 课数据已经在内存里（例如翻回看过的课）又不需要运行时：同步挂载，不闪加载状态
    if (data.sync && !needsRuntime) mount(data.sync);
    else start();
    return () => {
      dead = true;
      if (node) {
        cleanup?.(node);
        node.remove();
      }
      host.replaceChildren();
    };
  }, [meta?.id, ...deps]);
  return ref;
}

/** 需要这一课的重数据（测验、练习、示例说明…）的占位：数据到了才 build */
export function useSlot<N extends HTMLElement = HTMLElement>(build: (lesson: Lesson) => N | null, opts: SlotOptions<N, Lesson> = {}) {
  const meta = useLesson();
  const ref = useSlotImpl<N, Lesson>(meta, id => ({ sync: loadedLesson(id), load: () => loadLesson(id) }), build, opts);
  return { ref, lesson: meta };
}

/** 只需要轻量目录里的信息（选题只看目录和进度）的占位；build 自己决定要不要、怎样异步取别的课的数据 */
export function useMetaSlot<N extends HTMLElement = HTMLElement>(build: (meta: LessonMeta) => N | null) {
  const meta = useLesson();
  const ref = useSlotImpl<N, LessonMeta>(meta, () => ({ sync: meta, load: () => Promise.resolve(meta) }), build, {});
  return { ref, lesson: meta };
}
