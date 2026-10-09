/* 课文里的组件树：静态的树由 theme/components/RenderTree.tsx 渲染进 HTML，这里在浏览器里按需加载动画模块并激活它。
 * 动画和脉冲计划的代码（heroTree.ts、logic/heroTree.ts）在自己的异步 chunk 里，不进站点主包。 */
export { HERO_H, HERO_NODES, HERO_W, accName } from './logic/heroTreeData.ts';

/** 激活 root 里的静态树；返回销毁函数（模块还没加载完就销毁，加载完后不会激活）。 */
export function attachHeroTree(root: HTMLElement): () => void {
  let destroy: (() => void) | null = null;
  let dead = false;
  import('./heroTree.ts').then(m => {
    if (!dead) destroy = m.attach(root);
  });
  return () => {
    dead = true;
    destroy?.();
    destroy = null;
  };
}

/** 首页叙事：按需加载 story.ts（不支持 CSS 滚动驱动动画时的回退驱动、幕进度指示、屏幕外暂停）。返回销毁函数。 */
export function attachStory(root: HTMLElement): () => void {
  let destroy: (() => void) | null = null;
  let dead = false;
  import('./story.ts').then(m => {
    if (!dead) destroy = m.attach(root);
  });
  return () => {
    dead = true;
    destroy?.();
    destroy = null;
  };
}
