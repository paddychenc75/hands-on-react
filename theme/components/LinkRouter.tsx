import { useEffect } from 'react';
import { useLinkNavigate } from '@rspress/core/theme';
import { BASE } from '../../course/site.ts';
import { smooth } from '../../course/engine/util.ts';

/** 全局点击处理：
 *  1. 引擎生成的站内 <a>（回看这一课、翻页、阶段测验入口等）原本是整页跳转，这里改走 Rspress 的客户端路由（href 已带 base）。
 *  2. data-jump：不改地址栏，直接滚到对应部分（阶段测验里的“第 N 题”）。
 *  3. 跳到别的页面的某一部分（/lessons/<id>#sec-drills）：页面内容是挂载后才出现的，Rspress 自己的滚动会落空，这里等目标出现再滚过去。 */
/** 等 id 对应的元素出现后滚过去。课的内容（练习、变式练习的实验台）是分几批加载的，上方的版面还会变高，
 *  所以出现后每 0.25 秒对齐一次，持续约 5 秒；读者一动手滚动（滚轮、触摸、按键、点击）就停止。 */
function scrollToHash(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  if (!id) return;
  let moved = false;
  const stop = () => {
    moved = true;
  };
  const evs = ['wheel', 'touchmove', 'keydown', 'mousedown'] as const;
  for (const ev of evs) window.addEventListener(ev, stop, { once: true, passive: true });
  const cleanup = () => {
    for (const ev of evs) window.removeEventListener(ev, stop);
  };
  let n = 0;
  const go = () => {
    if (moved || n++ > 20) return cleanup();
    const el = document.getElementById(id);
    if (el && Math.abs(el.getBoundingClientRect().top) > 2) el.scrollIntoView({ block: 'start' });
    setTimeout(go, 250);
  };
  go();
}

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
      const hash = href.includes('#') ? href.slice(href.indexOf('#')) : '';
      if (hash) setTimeout(() => scrollToHash(hash), 50);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [navigate]);
  return null;
}
