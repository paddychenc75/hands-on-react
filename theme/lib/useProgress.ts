import { useEffect, useState } from 'react';
import { PROGRESS_EVENT } from '../../course/engine/index.ts';

/** 进度只存在浏览器里。返回 mounted：服务端渲染和首次水合时是 false（一律按"没有进度"渲染，避免水合不一致），
 *  挂载后变 true，之后每次进度变化都会让组件重新渲染。 */
export function useProgress(): boolean {
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => {
    setMounted(true);
    const f = () => setTick(n => n + 1);
    window.addEventListener(PROGRESS_EVENT, f);
    return () => window.removeEventListener(PROGRESS_EVENT, f);
  }, []);
  return mounted;
}
