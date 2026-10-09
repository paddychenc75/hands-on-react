import { type ComponentType, useEffect, useState } from 'react';
import { STATE_LABEL, useSyncStatus } from '../lib/useSyncStatus';

/** 课程地图页的“跨设备同步”面板（折叠，默认收起）。面板内容是单独的异步 chunk，展开时才加载；这里不加载同步引擎 */
export default function SyncPanel() {
  const [open, setOpen] = useState(false);
  const [Body, setBody] = useState<null | ComponentType>(null);
  const v = useSyncStatus();
  useEffect(() => {
    const f = () => {
      if (location.hash === '#sync') setOpen(true);
    };
    f();
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  useEffect(() => {
    if (open && !Body) import(/* webpackChunkName: "sync-panel" */ './SyncPanelBody').then(m => setBody(() => m.default));
  }, [open, Body]);
  return (
    <details id="sync" className="hoc sync-panel" open={open} onToggle={e => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>
        <span>跨设备同步</span>
        {v.enabled ? <small className="sync-sum">已开启 · {STATE_LABEL[v.status.state]}</small> : <small className="sync-sum">未开启 · 可选</small>}
      </summary>
      {open ? Body ? <Body /> : <p className="dim">加载中…</p> : null}
    </details>
  );
}
