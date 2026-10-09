import { useEffect, useState } from 'react';
import { type SyncState, type SyncStatus, readConfig, readStatus, subscribeStatus } from '../../course/engine/syncState.ts';
import { lastFour } from '../../course/engine/logic/syncView.ts';

export interface SyncView {
  enabled: boolean;
  /** 账号名、Gist 编号、令牌末四位（令牌本身不会出现在界面状态里） */
  login?: string;
  gist?: string;
  tail?: string;
  status: SyncStatus;
  now: number;
}
/** 这几类错误要换令牌：界面在旁边放“重新创建令牌”的链接 */
export const TOKEN_CODES = ['auth', 'scope', 'forbidden'];
export const STATE_LABEL: Record<SyncState, string> = { synced: '已同步', syncing: '同步中', pending: '有未同步的更改', error: '同步出错' };

/** 同步状态。服务端渲染和首次水合时 enabled 为 false；挂载后读本机配置，并随状态变化和每 30 秒更新一次（为了“几分钟前”） */
export function useSyncStatus(): SyncView {
  const [v, setV] = useState<SyncView>({ enabled: false, status: { state: 'synced' }, now: 0 });
  useEffect(() => {
    const f = () => {
      const c = readConfig();
      setV({ enabled: !!c, login: c?.login, gist: c?.gist, tail: c ? lastFour(c.token) : undefined, status: readStatus(), now: Date.now() });
    };
    f();
    const t = setInterval(f, 30e3);
    const off = subscribeStatus(f);
    return () => {
      clearInterval(t);
      off();
    };
  }, []);
  return v;
}
