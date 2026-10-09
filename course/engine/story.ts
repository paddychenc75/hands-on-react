/* 首页叙事的浏览器端（自己的异步 chunk，不进站点主包）。
 *
 * 动画本身是 CSS：theme/story.css 里每一幕有一个 --p（0..1，这一幕从刚进入视口到完全离开的滚动进度），
 * 画面上所有东西都是 --p 的函数，只动 transform、opacity 和 SVG 的描边。--p 有两种来源，结果一致：
 *   1. 浏览器支持 CSS 滚动驱动动画（animation-timeline: view()，Chrome / Edge 115+）：--p 由 CSS 动画直接驱动，这里什么都不用做；
 *   2. 不支持（Firefox、旧 Safari）：这里用一个被动的 scroll 监听 + requestAnimationFrame 给“屏幕上的幕”写 --p。公式和 CSS 的 view() 完全一样。
 * 除此之外这里只做三件小事：幕进度指示（哪一幕在中间）、屏幕外的幕不工作（只给在视口里的幕写 --p / 打开 .on）、点指示跳转。
 * 不改滚动速度、不拦截滚轮/触摸/键盘。 */

const NAV = 64; // 顶栏高度（和 CSS 里 view(block 64px 0px) 的上内边距一致）
const DYN = 'story-dyn';

/** 一幕的滚动进度：0 = 刚从底部进入视口，1 = 底边离开顶栏。和 CSS 的 view(block 64px 0px) 的 cover 范围逐点相同。 */
export function sceneProgress(top: number, height: number, viewport: number): number {
  const p = (viewport - top) / (height + viewport - NAV);
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

export function attach(root: HTMLElement): () => void {
  const scenes = [...root.querySelectorAll<HTMLElement>('.sc')];
  const dots = [...root.querySelectorAll<HTMLAnchorElement>('.rail a')];
  const native = typeof CSS !== 'undefined' && CSS.supports('animation-timeline', 'view()');
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const html = document.documentElement;
  const ac = new AbortController();
  const visible = new Set<HTMLElement>();
  const last = new Map<HTMLElement, number>();
  let raf = 0;
  let addedDyn = false;

  const mode = native ? 'css' : 'js';
  root.dataset.mode = mode;

  // 回退路径：给“屏幕上的幕”写 --p。减少动画时什么都不写（画面是每一幕的最终静态画面）。
  const frame = () => {
    raf = 0;
    if (reduceMQ.matches) return;
    const vh = innerHeight;
    for (const sc of visible) {
      const r = sc.getBoundingClientRect();
      const p = sceneProgress(r.top, r.height, vh);
      const prev = last.get(sc);
      if (prev === undefined || Math.abs(prev - p) > 0.0004 || p === 0 || p === 1) {
        last.set(sc, p);
        sc.style.setProperty('--p', p.toFixed(4));
      }
    }
  };
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  // 动态布局的开关：首次打开首页时，页面 <head> 里的一小段脚本已经（在浏览器支持 CSS 滚动驱动动画时）加好了；
  // 从别的页面点进来、或者走 JS 回退路径时，在这里加。没有这个类（没有 JS、JS 加载失败）页面就是一篇静态长文。
  if (!html.classList.contains(DYN)) {
    html.classList.add(DYN);
    addedDyn = true;
  }
  if (!native) {
    addEventListener('scroll', schedule, { passive: true, signal: ac.signal });
    addEventListener('resize', schedule, { passive: true, signal: ac.signal });
    reduceMQ.addEventListener(
      'change',
      () => {
        if (reduceMQ.matches) scenes.forEach(s => s.style.removeProperty('--p'));
        else {
          last.clear();
          schedule();
        }
      },
      { signal: ac.signal },
    );
  }

  // 屏幕外的幕不工作：只有进入视口（上下各留一屏的余量）的幕才在 visible 里并带 .on
  const io = new IntersectionObserver(
    es => {
      for (const e of es) {
        const sc = e.target as HTMLElement;
        sc.classList.toggle('on', e.isIntersecting);
        if (e.isIntersecting) visible.add(sc);
        else visible.delete(sc);
      }
      if (!native) schedule();
    },
    { rootMargin: '50% 0px 50% 0px' },
  );
  scenes.forEach(s => io.observe(s));

  // 幕进度指示：哪一幕压在视口中线上，哪个点就亮
  const setActive = (i: number) => {
    dots.forEach((d, j) => {
      if (j === i) d.setAttribute('aria-current', 'step');
      else d.removeAttribute('aria-current');
    });
    root.dataset.active = String(i);
  };
  const mid = new IntersectionObserver(
    es => {
      for (const e of es) if (e.isIntersecting) setActive(scenes.indexOf(e.target as HTMLElement));
    },
    { rootMargin: '-50% 0px -49.9% 0px' },
  );
  scenes.forEach(s => mid.observe(s));
  setActive(0);

  // 点指示：滚到那一幕的开头（用户自己点的，不是替他滚）；减少动画时不用平滑滚动
  dots.forEach((d, i) => {
    d.addEventListener(
      'click',
      e => {
        const target = scenes[i];
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ block: 'start', behavior: reduceMQ.matches ? 'auto' : 'smooth' });
      },
      { signal: ac.signal },
    );
  });

  schedule();
  return () => {
    ac.abort();
    io.disconnect();
    mid.disconnect();
    if (raf) cancelAnimationFrame(raf);
    if (addedDyn) html.classList.remove(DYN);
    scenes.forEach(s => {
      s.style.removeProperty('--p');
      s.classList.remove('on');
    });
  };
}
