import { useEffect } from 'react';
import { isDone, progress, stageCount, dueCount, lessonDrillCount, PROGRESS_EVENT } from '../../course/engine/index.ts';
import { lessonById } from '../../course/registry.ts';
import { STAGES } from '../../course/stages.ts';

const SIDEBAR = '.rp-doc-layout__sidebar';
const setAttr = (el: Element, name: string, value: string | null) => {
  if (value === null || value === '') {
    if (el.hasAttribute(name)) el.removeAttribute(name);
  } else if (el.getAttribute(name) !== value) el.setAttribute(name, value);
};

/** 全局组件：读进度，给侧栏加动态标记（样式见 theme/style.css）：
 *  - 学完的课、通过的阶段测验：data-hoc-done
 *  - “今日复习”：data-hoc-due（到期题数）
 *  - 有变式练习的课：data-hoc-dr（“已做 x/y”），全部做完再加 data-hoc-dr-done
 *  - 每个阶段标题：data-hoc-cnt（已完成 x/y）
 *  用属性而不是 class：React 重渲染侧栏时会整体重写 className，但不会动未知属性。 */
export default function ProgressMarks() {
  useEffect(() => {
    const mark = () => {
      const st: any = progress.__stage || {};
      document.querySelectorAll<HTMLAnchorElement>(`${SIDEBAR} a[href]`).forEach(a => {
        const path = decodeURIComponent(a.getAttribute('href') || '')
          .replace(/\.html$/, '')
          .replace(/\/+$/, '');
        const id = path.split('/').pop() || '';
        if (/\/lessons\/[^/]+$/.test(path)) {
          setAttr(a, 'data-hoc-done', isDone(id) ? '1' : null);
          // 变式练习的数量来自轻量目录（nDrills），完成数来自进度；不加载任何课的重数据
          const [dd, dn] = lessonDrillCount(id);
          const drMark = lessonById(id)?.nDrills ? dd + '/' + dn : null;
          setAttr(a, 'data-hoc-dr', drMark);
          // 伪元素的 attr() 读的是它所在元素（课名那个 span），所以文字也写一份在 span 上
          const label = a.querySelector('.rp-sidebar-item__left > span');
          if (label) setAttr(label, 'data-hoc-dr', drMark);
          setAttr(a, 'data-hoc-dr-done', dn && dd === dn ? '1' : null);
        } else if (/\/check\/\d$/.test(path)) setAttr(a, 'data-hoc-done', st[id] && st[id].passed ? '1' : null);
        else if (/\/review$/.test(path)) {
          const n = dueCount();
          setAttr(a, 'data-hoc-due', n ? String(n) : null);
        }
      });
      document.querySelectorAll<HTMLElement>(`${SIDEBAR} .rp-sidebar-section-header`).forEach(h => {
        const si = STAGES.findIndex((s: any) => (h.textContent || '').trim().startsWith(s.no + ' ' + s.name));
        if (si >= 0) {
          const [d, n] = stageCount(si);
          setAttr(h, 'data-hoc-cnt', d + '/' + n);
        }
      });
    };
    mark();
    let raf = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(mark);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener(PROGRESS_EVENT, mark);
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener(PROGRESS_EVENT, mark);
    };
  }, []);
  return null;
}
