import { useEffect, useRef } from 'react';
import { useLocation } from '@rspress/core/runtime';
import { useLinkNavigate } from '@rspress/core/theme';
import { offerResume, savePos } from '../../course/engine/index.ts';
import { LESSONS } from '../../course/registry.ts';
import { lessonHref } from '../../course/site.ts';

const lessonIdOf = (pathname: string) => {
  const m = decodeURIComponent(pathname)
    .replace(/\.html$/, '')
    .replace(/\/+$/, '')
    .match(/\/lessons\/([^/]+)$/);
  return m ? m[1] : '';
};

/** 阅读体验（旧版 onScroll / offerResume / 键盘翻页）：
 *  顶部阅读进度条、记住并提示继续上次阅读位置、不在输入框里时按 ← → 翻课。 */
export default function ReadingAids() {
  const { pathname } = useLocation();
  const id = LESSONS.some((l: any) => l.id === lessonIdOf(pathname)) ? lessonIdOf(pathname) : '';
  const bar = useRef<HTMLDivElement>(null);
  const navigate = useLinkNavigate();

  useEffect(() => {
    const b = bar.current;
    if (b) b.hidden = !id;
    if (!id) return;
    let timer: any;
    const paint = () => {
      const total = document.documentElement.scrollHeight - innerHeight;
      if (b) b.style.transform = `scaleX(${total > 0 ? Math.min(1, scrollY / total) : 0})`;
    };
    const onScroll = () => {
      paint();
      clearTimeout(timer);
      timer = setTimeout(() => savePos(id), 400);
    };
    paint();
    window.addEventListener('scroll', onScroll, { passive: true });
    // 实验台是异步加载的，页面高度稳定后再提示“继续上次位置”
    const resume = setTimeout(() => offerResume(id), 1200);
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
      clearTimeout(resume);
    };
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const tg = e.target as Element;
      if (tg.closest && tg.closest('input, textarea, select, [contenteditable], .opt, .tree, svg')) return;
      const i = LESSONS.findIndex((l: any) => l.id === id);
      if (i < 0) return;
      const to = LESSONS[i + (e.key === 'ArrowRight' ? 1 : -1)];
      if (to) navigate(lessonHref(to.id));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [id, navigate]);

  return <div ref={bar} className="read-bar" aria-hidden="true" hidden />;
}
