import { useEffect } from 'react';
import { isDone, progress, stageCount, dueCount, PROGRESS_EVENT } from '../../course/engine/index.ts';
import { STAGES } from '../../course/stages.ts';

const SIDEBAR = '.rp-doc-layout__sidebar';
const setAttr = (el: Element, name: string, value: string | null) => {
  if (value === null || value === '') { if (el.hasAttribute(name)) el.removeAttribute(name); }
  else if (el.getAttribute(name) !== value) el.setAttribute(name, value);
};

/** 全局组件：读进度，给侧栏加动态标记（样式见 theme/style.css）：
 *  - 学完的课、通过的阶段测验：data-hoc-done
 *  - “今日复习”：data-hoc-due（到期题数）
 *  - 每个阶段标题：data-hoc-cnt（已完成 x/y）
 *  用属性而不是 class：React 重渲染侧栏时会整体重写 className，但不会动未知属性。 */
export default function ProgressMarks() {
  useEffect(() => {
    const mark = () => {
      const st: any = progress.__stage || {};
      document.querySelectorAll<HTMLAnchorElement>(`${SIDEBAR} a[href]`).forEach((a) => {
        const path = decodeURIComponent(a.getAttribute('href') || '').replace(/\.html$/, '').replace(/\/+$/, '');
        const id = path.split('/').pop() || '';
        if (/\/lessons\/[^/]+$/.test(path)) setAttr(a, 'data-hoc-done', isDone(id) ? '1' : null);
        else if (/\/check\/\d$/.test(path)) setAttr(a, 'data-hoc-done', st[id] && st[id].passed ? '1' : null);
        else if (/\/review$/.test(path)) { const n = dueCount(); setAttr(a, 'data-hoc-due', n ? String(n) : null); }
      });
      document.querySelectorAll<HTMLElement>(`${SIDEBAR} .rp-sidebar-section-header`).forEach((h) => {
        const si = STAGES.findIndex((s: any) => (h.textContent || '').trim().startsWith(s.no + ' ' + s.name));
        if (si >= 0) { const [d, n] = stageCount(si); setAttr(h, 'data-hoc-cnt', d + '/' + n); }
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
