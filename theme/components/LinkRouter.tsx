import { useEffect } from 'react';
import { useLinkNavigate } from '@rspress/core/theme';
import { BASE } from '../../course/site.ts';
import { smooth } from '../../course/engine/util.ts';

/** 全局点击处理：
 *  1. 引擎生成的站内 <a>（回看这一课、翻页、阶段测验入口等）原本是整页跳转，这里改走 Rspress 的客户端路由（href 已带 base）。
 *  2. data-jump：不改地址栏，直接滚到对应部分（阶段测验里的“第 N 题”）。 */
export default function LinkRouter() {
  const navigate = useLinkNavigate();
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      const t = e.target as Element | null;
      const j = t?.closest?.('[data-jump]') as HTMLElement | null;
      if (j) {
        e.preventDefault();
        document.getElementById(j.dataset.jump || '')?.scrollIntoView({ block: 'start', behavior: smooth() });
        return;
      }
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = t?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const href = a.getAttribute('href') || '';
      if (!href.startsWith(BASE)) return;
      e.preventDefault();
      navigate(href);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [navigate]);
  return null;
}
