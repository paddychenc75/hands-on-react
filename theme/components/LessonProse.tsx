import { useEffect, useRef, type ReactNode } from 'react';
import { markTerms, toast } from '../../course/engine/index.ts';

/** 正文容器：挂载后给术语表里的术语第一次出现的位置加虚线和释义（引擎 markTerms）。 */
export default function LessonProse({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (!root.dataset.termsMarked) {
      root.dataset.termsMarked = '1';
      markTerms(root);
    } // 开发模式下 effect 会跑两次，只标一次
    // 触屏上没有悬停提示，点一下术语就显示释义（旧版是全局点击监听，这里只管本课正文）
    const onClick = (e: MouseEvent) => {
      const t = (e.target as Element).closest?.('abbr.term') as HTMLElement | null;
      if (t) toast(t.title, 5000);
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);
  return (
    <div ref={ref} className="hoc prose" id="sec-read">
      {children}
    </div>
  );
}
