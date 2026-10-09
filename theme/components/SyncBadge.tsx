import { Link } from '@rspress/core/theme';
import { useEffect, useRef, useState } from 'react';
import { ago } from '../../course/engine/logic/syncView.ts';
import { loadSyncEngine } from '../../course/engine/syncState.ts';
import { STATE_LABEL, useSyncStatus } from '../lib/useSyncStatus';

/** 顶栏进度条旁的同步状态小图标。没开启同步时不显示。点击显示“上次同步”和“立即同步” */
export default function SyncBadge() {
  const v = useSyncStatus();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btn.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (!pop.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);
  if (!v.enabled) return null;
  const s = v.status;
  const label = STATE_LABEL[s.state];
  return (
    <div className="hoc sync-badge" data-state={s.state}>
      <button
        ref={btn}
        type="button"
        className="sync-btn"
        aria-expanded={open}
        aria-controls="sync-pop"
        aria-label={`跨设备同步：${label}`}
        onClick={() => setOpen(o => !o)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path
            d="M7 18a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18 9.5a4.25 4.25 0 0 1-.25 8.5H7z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        <i className="sync-dot" aria-hidden="true" />
      </button>
      <span className="sync-sr" role="status" aria-live="polite">
        同步状态：{label}
      </span>
      {open ? (
        <div id="sync-pop" ref={pop} className="sync-pop" role="dialog" aria-label="跨设备同步">
          <p className="sync-pop-state">
            <b>{label}</b>
          </p>
          <p className="dim">上次同步：{ago(s.at, v.now)}</p>
          {s.msg ? <p className="sync-pop-msg">{s.msg}</p> : null}
          <div className="sync-pop-row">
            <button
              type="button"
              className="btn small"
              disabled={s.state === 'syncing'}
              onClick={() => {
                loadSyncEngine().then(m => m.syncNow());
              }}
            >
              立即同步
            </button>
            <Link href="/roadmap#sync" onClick={() => setOpen(false)}>
              同步设置
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
