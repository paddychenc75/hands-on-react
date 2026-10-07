import { useEffect } from 'react';
import { isDone, PROGRESS_EVENT } from '../../course/engine/index.js';

/** 全局组件：读进度，给侧栏里已学完的课的链接加 data-hoc-done 属性（样式见 theme/style.css）。
 *  用属性而不是 class：React 重渲染侧栏时会整体重写 className，但不会动未知属性。 */
export default function ProgressMarks() {
  useEffect(() => {
    const mark = () => {
      document.querySelectorAll<HTMLAnchorElement>('.rp-doc-layout__sidebar a[href*="/lessons/"]').forEach((a) => {
        const id = decodeURIComponent(a.getAttribute('href') || '').replace(/\.html$/, '').replace(/\/+$/, '').split('/').pop() || '';
        if (isDone(id)) { if (!a.hasAttribute('data-hoc-done')) a.setAttribute('data-hoc-done', ''); }
        else a.removeAttribute('data-hoc-done');
      });
    };
    mark();
    let raf = 0;
    const mo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(mark); });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener(PROGRESS_EVENT, mark);
    return () => { cancelAnimationFrame(raf); mo.disconnect(); window.removeEventListener(PROGRESS_EVENT, mark); };
  }, []);
  return null;
}
