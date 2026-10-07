/* ========== 后加的练习：TanStack Query（迷你 useQuery 版） ========== */
(function () {
  // 迷你 Query 缓存：和课文里的版本相同。模拟接口会统计请求次数。
  const LIB = `import { useSyncExternalStore, useEffect, useState } from 'react';

// ===== 迷你 Query 缓存（不要修改） =====
// useQuery({ queryKey, queryFn, staleTime }) 的用法和 TanStack Query 一致。
const cache = new Map();      // key -> { data, updatedAt, fetching, promise, error }
const listeners = new Set();
const notify = () => listeners.forEach(l => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

function fetchQuery(key, fn) {
  const entry = cache.get(key) || {};
  if (entry.promise) return entry.promise;                  // 去重：同一个 key 只发一次
  const promise = fn().then(
    data => { cache.set(key, { data, updatedAt: Date.now() }); notify(); },
    error => { cache.set(key, { ...cache.get(key), error, fetching: false, promise: null }); notify(); }
  );
  cache.set(key, { ...entry, error: null, fetching: true, promise }); notify();
  return promise;
}

function useQuery({ queryKey, queryFn, staleTime = 0 }) {
  const key = JSON.stringify(queryKey);
  const entry = useSyncExternalStore(subscribe, () => cache.get(key));
  useEffect(() => {
    const e = cache.get(key);
    const stale = !e || !e.updatedAt || Date.now() - e.updatedAt > staleTime;
    if (stale) fetchQuery(key, queryFn);
  }, [key]); // 只写 key：queryFn 用到的变量都已在 key 里（见课文）
  return {
    data: entry && entry.data,
    isPending: !entry || (entry.data === undefined && !entry.error),
    isFetching: !!(entry && entry.fetching),
    isError: !!(entry && entry.error),
    error: entry && entry.error,
  };
}

// ===== 模拟后端（不要修改） =====
const stats = { calls: 0 };   // 请求次数
function fetchUser(id) {
  return new Promise((resolve, reject) => setTimeout(() => {
    stats.calls++;
    console.log('🌐 请求用户 ' + id + '（累计 ' + stats.calls + ' 次）');
    const names = { 1: '张三', 2: '李四', 3: '王五' };
    if (names[id]) resolve({ id, name: names[id] });
    else reject(new Error('用户 ' + id + ' 不存在'));
  }, 300));
}
`;

  const APP = `
function App() {
  const [id, setId] = useState(1);
  return (
    <div>
      {[1, 2, 3, 4].map(n => (
        <button key={n} data-id={n} onClick={() => setId(n)} disabled={n === id}>用户 {n}</button>
      ))}
      <UserCard id={id} />
    </div>
  );
}`;

  const starter = LIB + `
// ===== 你的代码 =====
function UserCard({ id }) {
  // 步骤 2：调用 useQuery。queryKey 要包含 id；queryFn 调用 fetchUser(id)。
  // 步骤 3：设置 staleTime，例如 60_000（1 分钟）。

  // 步骤 4：按状态渲染：
  //   加载中 → <p id="loading">加载中…</p>
  //   出错   → <p id="error">出错了：{error.message}</p>
  //   成功   → <p id="user">{data.name}</p>
  return <p>TODO</p>;
}
` + APP;

  const solution = LIB + `
// ===== 你的代码 =====
function UserCard({ id }) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
    staleTime: 60_000,
  });

  if (isPending) return <p id="loading">加载中…</p>;
  if (isError) return <p id="error">出错了：{error.message}</p>;
  return <p id="user">{data.name}</p>;
}
` + APP;

  LESSONS.find(l => l.id === 'tanstack-query').exercise = {
    task: '<ol class="task-steps">'
      + '<li>不要修改“迷你 Query 缓存”和 <code>fetchUser</code>。<code>fetchUser</code> 每次约 300 毫秒，用户 4 会失败。</li>'
      + '<li>在 <code>UserCard</code> 中调用 <code>useQuery</code>。<code>queryKey</code> 要包含 <code>id</code>，<code>queryFn</code> 调用 <code>fetchUser(id)</code>。</li>'
      + '<li>设置 <code>staleTime</code>（例如 <code>60_000</code>）。新鲜期内，切回看过的用户不再发请求。</li>'
      + '<li>按状态渲染三种界面：加载中显示 <code>#loading</code>；出错显示 <code>#error</code>，内容包含 <code>error.message</code>；成功显示 <code>#user</code>，内容是用户名。</li>'
      + '<li>依次点 用户 2、用户 1、用户 4，看控制台里的请求次数。切回用户 1 时，名字应立刻出现，请求次数不变。</li>'
      + '</ol>',
    starter,
    solution,
    faded: `// （迷你 Query 缓存、fetchUser 和 App 与起始代码相同，这里省略）

function UserCard({ id }) {
  const { data, isPending, isError, error } = useQuery({
    /* ✏️ queryKey：缓存的名字，要包含 id */
    /* ✏️ queryFn：调用 fetchUser(id) */
    /* ✏️ staleTime：新鲜期，例如 1 分钟 */
  });

  if (isPending) return <p id="loading">加载中…</p>;
  /* ✏️ 出错时：显示 #error，内容包含 error.message */
  return <p id="user">{data.name}</p>;
}`,
    hint: '课文里的 <code>User</code> 组件就是这样用 <code>useQuery</code> 的。想一想：如果 key 里没有 <code>id</code>，所有用户会共用哪一条缓存？',
    exports: ['stats'],
    test: async (t) => {
      const stats = t.exports.stats;
      t.assert(stats && typeof stats.calls === 'number', '找不到 stats。不要修改模拟后端');
      t.assert(/useQuery\s*\(/.test(t.source.replace(/function\s+useQuery\s*\(/, '')), '要在 UserCard 中调用 useQuery（步骤 2）');
      const btn = (n) => t.q('button[data-id="' + n + '"]');
      const shows = () => ({ loading: !!t.q('#loading'), error: t.text('#error'), user: t.text('#user') });
      await t.wait(60);
      t.assert(shows().loading && !shows().user, '首次加载用户 1 时应显示 #loading，不显示 #user（步骤 4）');
      await t.wait(450);
      t.assert(shows().user === '张三' && !shows().loading, '用户 1 加载完成后，#user 应显示“张三”，实际是“' + shows().user + '”（步骤 4）');
      t.assert(stats.calls === 1, '加载用户 1 应只请求 1 次，实际 ' + stats.calls + ' 次');

      await t.click(btn(2)); await t.wait(30);
      t.assert(shows().user !== '张三', '切到用户 2 后还显示“张三”。queryKey 要包含 id，否则不同用户共用一条缓存（步骤 2）');
      t.assert(shows().loading, '用户 2 第一次加载时应显示 #loading');
      await t.wait(450);
      t.assert(shows().user === '李四', '用户 2 加载完成后，#user 应显示“李四”，实际是“' + shows().user + '”');
      t.assert(stats.calls === 2, '此时应共请求 2 次，实际 ' + stats.calls + ' 次');

      await t.click(btn(1)); await t.wait(30);
      t.assert(shows().user === '张三' && !shows().loading, '切回用户 1 时应立刻显示缓存里的“张三”，不显示 #loading。数据要来自 useQuery 的缓存');
      await t.wait(450);
      t.assert(stats.calls === 2, '切回用户 1 不应再发请求，但请求次数变成了 ' + stats.calls + '。设置 staleTime（步骤 3）');
      t.assert(shows().user === '张三', '切回用户 1 后应一直显示“张三”');

      await t.click(btn(4)); await t.wait(30);
      t.assert(shows().loading, '用户 4 第一次加载时应显示 #loading');
      await t.wait(450);
      t.assert(shows().error.includes('用户 4 不存在'), '用户 4 请求失败，#error 应显示 error.message（“用户 4 不存在”），实际是“' + shows().error + '”（步骤 4）');
      t.assert(!shows().user && !shows().loading, '出错时不应显示 #user 或 #loading');

      await t.click(btn(3)); await t.wait(450);
      t.assert(shows().user === '王五' && !shows().error, '切到用户 3 后应显示“王五”，且不再显示 #error');
      t.assert(stats.calls === 4, '最后应共请求 4 次（用户 1、2、4、3 各一次），实际 ' + stats.calls + ' 次');
    },
  };
})();
