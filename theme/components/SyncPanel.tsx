import { type ComponentType, useCallback, useEffect, useRef, useState } from 'react';
import { smooth } from '../../course/engine/index.ts';
import { STATE_LABEL, useSyncStatus } from '../lib/useSyncStatus';

/** 课程地图页的“跨设备同步”面板（折叠，默认收起）。面板内容是单独的异步 chunk，展开时才加载；这里不加载同步引擎。
 *  入口：侧栏“进度同步”、顶栏云朵图标、课末 / 复习页的提示条，都指向 `/roadmap#sync`：展开面板、滚动到它、把焦点放到标题上。
 *  地址里已经有 #sync（直接访问、刷新、客户端路由跳转过来）也一样；已经在这一页时点这些链接，路由不会触发 hashchange，所以另外监听点击。 */
export default function SyncPanel() {
  const [open, setOpen] = useState(false);
  const [Body, setBody] = useState<null | ComponentType>(null);
  const v = useSyncStatus();
  const sum = useRef<HTMLElement>(null);
  const reveal = useCallback(() => {
    setOpen(true);
    // 等面板展开、布局稳定后再滚动和聚焦
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = document.getElementById('sync');
        el?.scrollIntoView({ block: 'start', behavior: smooth() });
        sum.current?.focus({ preventScroll: true });
      }),
    );
  }, []);
  useEffect(() => {
    if (location.hash === '#sync') reveal();
    const onHash = () => location.hash === '#sync' && reveal();
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (a && /\/roadmap(\.html)?#sync$/.test(a.getAttribute('href') || '') && /\/roadmap(\.html)?\/?$/.test(location.pathname)) reveal();
    };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onHash);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('popstate', onHash);
      document.removeEventListener('click', onClick);
    };
  }, [reveal]);
  useEffect(() => {
    if (open && !Body) import(/* webpackChunkName: "sync-panel" */ './SyncPanelBody').then(m => setBody(() => m.default));
  }, [open, Body]);
  return (
    <details id="sync" className="hoc sync-panel" open={open} onToggle={e => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary ref={sum}>
        <span>跨设备同步</span>
        {v.enabled ? <small className="sync-sum">已开启 · {STATE_LABEL[v.status.state]}</small> : <small className="sync-sum">未开启 · 可选</small>}
      </summary>
      {open ? Body ? <Body /> : <p className="dim">加载中…</p> : null}
    </details>
  );
}
