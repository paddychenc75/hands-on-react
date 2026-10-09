import { useEffect, useRef, useState } from 'react';
import { parseEnvelope, summarize } from '../../course/engine/logic/syncFormat.ts';
import { ago } from '../../course/engine/logic/syncView.ts';
import { loadSyncEngine } from '../../course/engine/syncState.ts';
import { STATE_LABEL, useSyncStatus } from '../lib/useSyncStatus';

const NAME = '动手学 React 学习进度同步';
const enc = encodeURIComponent;
/** 细粒度令牌：官方文档支持用地址参数预填名称、说明、权限和有效期（gists=write 是账号权限里的 Gist 读写，别的权限一个都不给） */
const FINE_URL = `https://github.com/settings/personal-access-tokens/new?name=${enc(NAME)}&description=${enc('只用于把“动手学 React”的学习进度存进我自己的一个私密 Gist')}&gists=write&expires_in=90`;
/** 经典令牌（备选）：scopes=gist 是长期可用的预填参数，但官方文档没有写它 */
const CLASSIC_URL = `https://github.com/settings/tokens/new?scopes=gist&description=${enc(NAME)}`;

type Msg = { kind: 'ok' | 'err'; text: string } | null;
const errText = (e: unknown): string => (e && typeof (e as Error).message === 'string' ? (e as Error).message : '出了意外的错误。');
const fmtTime = (t: number) => new Date(t).toLocaleString('zh-CN', { hour12: false });

export default function SyncPanelBody() {
  const v = useSyncStatus();
  const [token, setToken] = useState('');
  const [gistId, setGistId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [confirmOff, setConfirmOff] = useState(false);
  const [delRemote, setDelRemote] = useState(false);
  const [file, setFile] = useState<{ name: string; text: string; lessons: number; done: number; cards: number; at: number; newer: boolean } | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [backups, setBackups] = useState<{ at: number; reason: string }[]>([]);
  const live = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<HTMLInputElement>(null);
  const s = v.status;

  const refreshBackups = () => loadSyncEngine().then(m => setBackups(m.listBackups()));
  // biome-ignore lint/correctness/useExhaustiveDependencies: 每次同步成功（s.at 变了）后重读备份列表
  useEffect(() => {
    if (v.enabled) refreshBackups();
  }, [v.enabled, s.at]);

  const run = async (f: () => Promise<unknown>) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await f();
      if (r && typeof r === 'object' && 'kind' in r) setMsg(r as Msg);
    } catch (e) {
      setMsg({ kind: 'err', text: errText(e) });
    } finally {
      setBusy(false);
    }
  };

  const enable = () =>
    run(async () => {
      const m = await loadSyncEngine();
      const r = await m.enable(token, gistId);
      setToken('');
      setGistId('');
      setTimeout(() => live.current?.focus(), 50);
      return {
        kind: 'ok',
        text: r.created
          ? '已开启。已把本机进度上传到你账号下新建的私密 Gist。'
          : r.fromCloud
            ? `已开启。从云端合并了 ${r.fromCloud} 课的进度${r.uploaded ? '，并把合并结果写回了云端' : ''}。`
            : r.uploaded
              ? '已开启。已把本机进度上传到云端。'
              : '已开启。云端和本机的进度一致。',
      };
    });

  const exportFile = () =>
    run(async () => {
      const m = await loadSyncEngine();
      const blob = new Blob([JSON.stringify(m.exportEnvelope(), null, 1)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = m.exportFileName(Date.now());
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return { kind: 'ok', text: '已导出。文件里是你的学习进度，不含令牌。' };
    });

  const pickFile = async (f: File | undefined) => {
    setFile(null);
    setConfirmReplace(false);
    setMsg(null);
    if (!f) return;
    const text = await f.text();
    const p = parseEnvelope(text);
    if (!p.ok) {
      setMsg({ kind: 'err', text: (p as { reason: string }).reason === 'json' ? '这个文件不是有效的 JSON。' : '这不是“动手学 React”导出的进度文件。' });
      return;
    }
    const sm = summarize(p.env.progress);
    setFile({ name: f.name, text, ...sm, at: p.env.updatedAt, newer: p.newer });
  };
  const doImport = (mode: 'merge' | 'replace') =>
    run(async () => {
      const m = await loadSyncEngine();
      const r = m.importEnvelope(file.text, mode);
      setFile(null);
      setConfirmReplace(false);
      refreshBackups();
      return {
        kind: 'ok',
        text:
          (mode === 'merge' ? `已与本机进度合并，${r.changed ? r.changed + ' 课有变化' : '没有新增内容'}。` : '已用文件替换本机进度。') +
          ' 导入前的本机进度已备份。已经打开的课文页刷新后才会显示。',
      };
    });

  const eng = <T,>(f: (m: Awaited<ReturnType<typeof loadSyncEngine>>) => Promise<T> | T) => loadSyncEngine().then(f);
  const code = s.code;

  return (
    <div className="sync-body">
      <p>
        开启后，你的学习进度会存进<b>你自己 GitHub 账号下的一个私密 Gist</b>，在手机、电脑等多台设备之间自动合并，谁学的内容都不会丢。
        <b>不开启就什么都不会发送。</b>
        本站没有服务器，也不会看到你的数据。
      </p>

      {!v.enabled ? (
        <>
          <ol className="sync-steps">
            <li>
              打开预填好的页面创建令牌：
              <a href={FINE_URL} target="_blank" rel="noopener noreferrer">
                创建令牌（推荐：细粒度，只有 Gist 权限）
              </a>
              。页面里名称和权限已经填好，有效期默认 90 天；其他权限一个也不要加。点“Generate token”，复制令牌。
              <br />
              <small>
                如果细粒度令牌用不了，改用
                <a href={CLASSIC_URL} target="_blank" rel="noopener noreferrer">
                  经典令牌
                </a>
                （只勾 gist）。
              </small>
            </li>
            <li>把令牌粘贴到下面，点“开启同步”。会先检查令牌能不能用，再做第一次同步。</li>
            <li>
              在另一台设备上打开本站，用<b>同一个 GitHub 账号</b>重复第 1、2 步。两台设备的进度会自动合并。
            </li>
          </ol>
          <form
            className="sync-form"
            onSubmit={e => {
              e.preventDefault();
              enable();
            }}
          >
            <label htmlFor="sync-token">GitHub 令牌</label>
            <input
              id="sync-token"
              ref={tokenRef}
              className="sync-input"
              type="password"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="粘贴令牌（ghp_… 或 github_pat_…）"
            />
            <details className="sync-adv">
              <summary>找不到云端已有的进度？手动填 Gist</summary>
              <label htmlFor="sync-gist">Gist 链接或编号（可选）</label>
              <input id="sync-gist" className="sync-input" type="text" autoComplete="off" value={gistId} onChange={e => setGistId(e.target.value)} />
              <small>开启时会先在你的账号里找已有的同步文件。个别令牌列不出私密 Gist 时，到第一台设备的状态区复制 Gist 链接填在这里。</small>
            </details>
            <button type="submit" className="btn primary" disabled={busy || !token.trim()}>
              {busy ? '正在开启…' : '开启同步'}
            </button>
          </form>
          <p className="sync-safe">
            <b>关于令牌：</b>令牌只存在这台设备的浏览器里，只会发给
            GitHub（api.github.com），不会发给本站或任何别的地方。但任何能在这个网站上运行脚本的东西都能读到它，所以<b>只给它 Gist 权限</b>
            。在公用电脑上用完，请点“断开同步”。
          </p>
        </>
      ) : (
        <div className="sync-on">
          <div className="sync-status" ref={live} tabIndex={-1} role="status" aria-live="polite">
            <b>{STATE_LABEL[s.state]}</b>
            <span>
              账号 {v.login} · 令牌 {v.tail} · 上次同步：{ago(s.at, v.now)}
            </span>
            {s.msg ? <span className={'sync-msg' + (s.state === 'error' ? ' bad' : '')}>{s.msg}</span> : null}
            {s.dirty && s.state !== 'syncing' ? <span>有改动还没推送到云端。</span> : null}
          </div>
          {s.remoteChanged ? (
            <p className="sync-notice">
              进度已从另一台设备更新。已经打开的课文页要刷新才会显示。{' '}
              <button type="button" className="btn small" onClick={() => location.reload()}>
                刷新页面
              </button>
            </p>
          ) : null}
          <p>
            云端位置：
            <a href={`https://gist.github.com/${v.login}/${v.gist}`} target="_blank" rel="noopener noreferrer">
              你的私密 Gist
            </a>
            （编号 <code>{v.gist}</code>，第二台设备找不到时可填它）
          </p>
          <div className="sync-actions">
            <button
              type="button"
              className="btn"
              disabled={busy || s.state === 'syncing'}
              onClick={() => run(() => eng(m => m.syncNow()).then(() => undefined))}
            >
              立即同步
            </button>
            {code === 'gone' ? (
              <button type="button" className="btn sun" disabled={busy} onClick={() => run(() => eng(m => m.recreateGist()).then(() => undefined))}>
                重新创建云端 Gist
              </button>
            ) : null}
            {code === 'corrupt' ? (
              <button type="button" className="btn sun" disabled={busy} onClick={() => run(() => eng(m => m.rebuildRemote()).then(() => undefined))}>
                用本机进度重建云端文件
              </button>
            ) : null}
            {code === 'newer' ? (
              <button type="button" className="btn sun" onClick={() => location.reload()}>
                刷新页面
              </button>
            ) : null}
          </div>
          {code === 'auth' || code === 'scope' || code === 'forbidden' ? (
            <form
              className="sync-form"
              onSubmit={e => {
                e.preventDefault();
                run(async () => {
                  await eng(m => m.disconnect(false));
                  const m = await loadSyncEngine();
                  await m.enable(token, v.gist);
                  setToken('');
                  return { kind: 'ok', text: '已换成新令牌并重新同步。' };
                });
              }}
            >
              <label htmlFor="sync-token2">换一个新令牌</label>
              <small>
                <a href={FINE_URL} target="_blank" rel="noopener noreferrer">
                  打开预填好的创建页面
                </a>
              </small>
              <input
                id="sync-token2"
                className="sync-input"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={token}
                onChange={e => setToken(e.target.value)}
              />
              <button type="submit" className="btn primary" disabled={busy || !token.trim()}>
                保存新令牌
              </button>
            </form>
          ) : null}

          {backups.length ? (
            <div className="sync-backups">
              <b>恢复同步前的本机进度</b>
              <p className="dim">
                每次用云端内容覆盖本机之前，都会先留一份备份（最近 2
                份）。恢复后，下次同步仍会把云端和别的设备上的进度合并回来；想彻底回到那时的进度，请先断开同步。
              </p>
              <ul>
                {backups.map((b, i) => (
                  <li key={b.at}>
                    {fmtTime(b.at)} · {b.reason}{' '}
                    <button
                      type="button"
                      className="btn small"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await eng(m => m.restoreBackup(i));
                          refreshBackups();
                          return { kind: 'ok', text: '已恢复这份备份。已经打开的课文页刷新后才会显示。' };
                        })
                      }
                    >
                      恢复
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {!confirmOff ? (
            <button type="button" className="btn small" onClick={() => setConfirmOff(true)}>
              断开同步
            </button>
          ) : (
            <section className="sync-confirm" aria-label="确认断开同步">
              <p>断开后，会删除这台设备上保存的令牌。本机的学习进度保留。</p>
              <label className="sync-check">
                <input type="checkbox" checked={delRemote} onChange={e => setDelRemote(e.target.checked)} /> 同时删除云端的 Gist（默认保留）
              </label>
              <div className="sync-actions">
                <button
                  type="button"
                  className="btn sun"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const r = await eng(m => m.disconnect(delRemote));
                      setConfirmOff(false);
                      setDelRemote(false);
                      setTimeout(() => tokenRef.current?.focus(), 50);
                      return {
                        kind: 'ok',
                        text:
                          '已断开同步，令牌已从这台设备删除。' +
                          (delRemote ? (r.remoteDeleted ? '云端的 Gist 已删除。' : '云端的 Gist 没能删除，可以到 GitHub 上手动删。') : '云端的 Gist 保留着。'),
                      };
                    })
                  }
                >
                  确认断开
                </button>
                <button type="button" className="btn small" onClick={() => setConfirmOff(false)}>
                  取消
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      <div className="sync-file">
        <h4>导出 / 导入文件（不需要账号）</h4>
        <p className="dim">也可以不用 GitHub，用文件在设备之间搬运进度。导出的文件不含令牌。</p>
        <div className="sync-actions">
          <button type="button" className="btn" disabled={busy} onClick={exportFile}>
            导出进度文件
          </button>
          <label className="btn" htmlFor="sync-import">
            选择要导入的文件
          </label>
          <input
            id="sync-import"
            className="sync-file-input"
            type="file"
            accept=".json,application/json"
            onChange={e => {
              pickFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
        {file ? (
          <section className="sync-import" aria-label="导入文件">
            <p>
              <b>{file.name}</b>：{file.lessons} 课有记录，其中 {file.done} 课已完成，{file.cards} 道题在复习中
              {file.at ? `，导出于 ${fmtTime(file.at)}` : ''}。
            </p>
            {file.newer ? (
              <p className="sync-msg bad">这个文件来自更新版本的站点，请先刷新本页再导入。</p>
            ) : (
              <div className="sync-actions">
                <button type="button" className="btn primary" disabled={busy} onClick={() => doImport('merge')}>
                  与本机进度合并
                </button>
                {!confirmReplace ? (
                  <button type="button" className="btn small" onClick={() => setConfirmReplace(true)}>
                    用文件替换本机进度…
                  </button>
                ) : (
                  <>
                    <span className="sync-msg bad">会先备份本机进度，然后用文件的内容替换。</span>
                    <button type="button" className="btn sun" disabled={busy} onClick={() => doImport('replace')}>
                      确认替换
                    </button>
                    <button type="button" className="btn small" onClick={() => setConfirmReplace(false)}>
                      取消
                    </button>
                  </>
                )}
              </div>
            )}
            {v.enabled ? <p className="dim">同步已开启：替换之后，下次同步仍会把云端的进度合并回来。</p> : null}
          </section>
        ) : null}
      </div>
      <div className="sync-result" role="status" aria-live="polite">
        {msg ? <p className={'sync-msg ' + (msg.kind === 'err' ? 'bad' : 'good')}>{msg.text}</p> : null}
      </div>
    </div>
  );
}
