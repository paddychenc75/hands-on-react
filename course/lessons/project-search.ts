import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/project-search.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'project-search',
  stage: 1,
  title: '实战二：异步搜索',
  mins: 40,
  summary: '处理真实世界的异步：加载、空结果、错误，以及最容易被忽略的竞态问题。',
  goals: [
    '能为异步界面设计一个 status 字段，覆盖空闲、加载中、成功、空结果、出错',
    '能解释竞态：后发出的请求先返回时，旧结果为什么会覆盖新结果',
    '能用 effect 清理函数里的 ignore 标记修复竞态',
    '能把请求逻辑抽成自定义 Hook（例如 useUserSearch）',
  ],
  keyPoints: [
    '问题：响应返回的顺序不一定和请求发出的顺序相同。不处理，旧关键词的结果会覆盖新结果。',
    '修法：effect 里 <code>let ignore = false</code>，清理函数里设为 true；成功和失败的回调都先检查 <code>if (!ignore)</code>。',
    '用一个 <code>status</code> 字段代替 isLoading、isError 等多个布尔值，就不会出现“既在加载又出错”。',
    '防抖只减少请求次数，不能保证返回顺序，所以仍然需要 ignore。',
  ],
  quiz: [
    {
      q: '用户快速输入时，旧请求比新请求晚返回，会导致？',
      options: ['请求自动排队，按发出顺序显示', '界面最终显示旧关键词的结果', '请求自动取消', 'React 18 会自动丢弃过期请求触发的 set 函数调用'],
      answer: 1,
      explain: '这就是竞态问题：旧请求的 then 回调照样会执行，把旧结果写进 state。React 不知道哪个结果“过期”，不会替你丢弃，所以最后一个选项不对。必须用 ignore 标记忽略，或用 AbortController 取消过期请求。',
    },
    {
      q: '用 status: \'idle\' | \'loading\' | \'success\' | \'error\' 代替 isLoading、isError 等多个布尔值，好处是？',
      options: ['代码更短', '避免出现互相矛盾的状态组合', '减少重新渲染次数', '让 TypeScript 推断更准'],
      answer: 1,
      explain: '用多个布尔值时，可能出现 isLoading 和 isError 同时为 true。这种组合本不应该存在。一个 status 字段一次只能有一个值，矛盾的组合根本写不出来。它不一定让代码更短，也不减少渲染次数。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>不要修改 <code>searchUsers</code>。</li><li>按需求 1 到 6 实现搜索、加载中、空结果和错误。</li><li>最后处理需求 7：在 effect 的清理函数中忽略过期的请求。</li><li>把请求逻辑放进自定义 Hook <code>useUserSearch(query)</code>：请求、ignore 和结果 state 都写在 Hook 里，Hook 返回状态和结果。App 只调用它并渲染结果。检查程序会单独调用这个 Hook。</li><li>不要加防抖。检查程序按固定时间验收。</li></ol>',
    starter: `import { useState, useEffect } from 'react';

// ===== 模拟接口（不要修改） =====
const USERS = ['张三', '张伟', '李四', '李娜', '王五', '赵六'];
function searchUsers(q) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (q === '错误') reject(new Error('服务器开小差了'));
      else resolve(USERS.filter(name => name.includes(q)));
    }, Math.max(100, 900 - q.length * 300)); // 关键词越短越慢
  });
}

// ===== 你的代码 =====
function App() {
  const [query, setQuery] = useState('');

  return (
    <div>
      <input id="search" placeholder="搜索用户" value={query} onChange={e => setQuery(e.target.value)} />
      {/* 加载中 / 错误 / 没有找到 / 结果列表 */}
    </div>
  );
}`,
    solution: `import { useState, useEffect } from 'react';

// ===== 模拟接口（不要修改） =====
const USERS = ['张三', '张伟', '李四', '李娜', '王五', '赵六'];
function searchUsers(q) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (q === '错误') reject(new Error('服务器开小差了'));
      else resolve(USERS.filter(name => name.includes(q)));
    }, Math.max(100, 900 - q.length * 300)); // 关键词越短越慢
  });
}

// ===== 你的代码 =====
function useUserSearch(query) {
  const [state, setState] = useState({ status: 'idle', data: [], error: null });
  useEffect(() => {
    if (!query) { setState({ status: 'idle', data: [], error: null }); return; }
    let ignore = false;
    setState(s => ({ ...s, status: 'loading' }));
    searchUsers(query).then(
      data => { if (!ignore) setState({ status: 'success', data, error: null }); },
      error => { if (!ignore) setState({ status: 'error', data: [], error }); }
    );
    return () => { ignore = true; };
  }, [query]);
  return state;
}

function App() {
  const [query, setQuery] = useState('');
  const { status, data, error } = useUserSearch(query.trim());

  return (
    <div>
      <input id="search" placeholder="搜索用户" value={query} onChange={e => setQuery(e.target.value)} />
      {status === 'loading' && <p id="loading" role="status">加载中…</p>}
      {status === 'error' && <p id="error" role="alert">出错了：{error.message}</p>}
      {status === 'success' && data.length === 0 && <p id="empty">没有找到</p>}
      {status === 'success' && (
        <ul>{data.map(name => <li key={name} className="user">{name}</li>)}</ul>
      )}
    </div>
  );
}`,
    exports: ['useUserSearch'],
    hint: '在 effect 里发请求，返回 <code>() =&gt; { ignore = true; }</code>；成功和失败的回调里都要先检查 <code>if (!ignore)</code>。',
    faded: `// （模拟接口和起始代码相同，这里省略）

function useUserSearch(query) {
  const [state, setState] = useState({ status: 'idle', data: [], error: null });
  useEffect(() => {
    if (!query) { setState({ status: 'idle', data: [], error: null }); return; }
    let ignore = false;
    /* ✏️ 把 status 设为 'loading' */
    searchUsers(query).then(
      /* ✏️ 成功：先检查 ignore，再存 status: 'success' 和 data */
      /* ✏️ 失败：先检查 ignore，再存 status: 'error' 和 error */
    );
    /* ✏️ 返回清理函数：把这一次请求标记为过期 */
  }, [query]);
  return state;
}

function App() {
  const [query, setQuery] = useState('');
  const { status, data, error } = useUserSearch(query.trim());

  return (
    <div>
      <input id="search" placeholder="搜索用户" value={query} onChange={e => setQuery(e.target.value)} />
      {status === 'loading' && <p id="loading" role="status">加载中…</p>}
      {status === 'error' && <p id="error" role="alert">出错了：{error.message}</p>}
      {status === 'success' && data.length === 0 && <p id="empty">没有找到</p>}
      {status === 'success' && (
        <ul>{data.map(name => <li key={name} className="user">{name}</li>)}</ul>
      )}
    </div>
  );
}`,
    test: async (t) => {
      const names = () => t.qa('li.user').map(li => li.textContent.trim());
      // 步骤 4：请求逻辑要真的在 Hook 里。先看 App 本身，再单独调用 Hook
      const useUserSearch = t.exports.useUserSearch;
      t.assert(typeof useUserSearch === 'function', '请定义自定义 Hook：function useUserSearch(query) { … }，并在 App 里调用它（步骤 4）');
      const appAt = t.source.search(/(?:function\s+App\s*\(|(?:const|let)\s+App\s*=)/);
      const appSrc = appAt < 0 ? '' : t.source.slice(appAt).split(/\n(?=function\s|const\s|let\s)/)[0];
      t.assert(/\buseUserSearch\s*\(/.test(appSrc), 'App 里应调用 useUserSearch(query)，用它的返回值渲染结果（步骤 4）');
      t.assert(!/\bsearchUsers\s*\(|\buse(?:Layout)?Effect\s*\(/.test(appSrc),
        'App 里还在直接请求：调用了 searchUsers 或 useEffect。请把 effect、ignore 和结果 state 都搬进 useUserSearch，App 只调用 Hook（步骤 4）');
      let got: any;
      const Probe = () => { got = useUserSearch('张'); return null; };
      const box = document.createElement('div');
      const root = ReactDOM.createRoot(box);
      const snap = () => { try { return JSON.stringify(got) || ''; } catch (e) { return String(got); } };
      try {
        ReactDOM.flushSync(() => root.render(React.createElement(Probe)));
        const before = snap();
        await t.wait(900);
        const after = snap();
        t.assert(!before.includes('张三') && after.includes('张三') && after.includes('张伟'),
          `单独调用 useUserSearch('张')，等请求完成后，它的返回值里应有 张三、张伟，实际返回 ${after.slice(0, 80) || '空'}。Hook 要自己发请求、保存结果并 return 出来（步骤 4）`);
      } finally { root.unmount(); }
      t.assert(t.q('#search'), '找不到 #search 输入框');
      t.assert(names().length === 0 && !t.q('#loading'), '输入为空时不应显示结果或加载中（需求 2）');
      await t.type('#search', '张');
      t.assert(t.q('#loading'), '请求期间应显示 #loading（需求 3）');
      await t.wait(900);
      t.assert(!t.q('#loading'), '请求完成后 #loading 应消失');
      t.assert(names().join() === '张三,张伟', `搜索“张”应显示 张三、张伟，实际是：${names().join('、') || '无'}`);
      await t.type('#search', '钱');
      await t.wait(800);
      t.assert(t.text('#empty') === '没有找到' && names().length === 0, '没有结果时应显示“没有找到”（需求 5）');
      await t.type('#search', '错误');
      await t.wait(600);
      t.assert(t.q('#error'), '请求失败时应显示 #error（需求 6）');
      await t.type('#search', '李');
      await t.wait(30);
      await t.type('#search', '李四');
      await t.wait(1100);
      t.assert(names().join() === '李四', `快速输入“李”→“李四”后应只显示 李四，实际是：${names().join('、') || '无'}。过期请求的结果覆盖了新结果（需求 7）`);
      t.assert(!t.q('#error') && !t.q('#empty'), '显示结果时不应同时显示错误或“没有找到”');
      await t.type('#search', '');
      await t.wait(100);
      t.assert(names().length === 0 && !t.q('#empty') && !t.q('#loading') && !t.q('#error'), '清空输入框后不应显示任何结果或提示（需求 2）');
    },
  },
  checkOnly: [
    {
      q: `这个组件第一次显示的用户是对的。之后 id 从 1 变成 2，会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">useEffect(() =&gt; {
  let ignore = false;
  fetchUser(id).then(u =&gt; {
    if (!ignore) setUser(u);
  });
  return () =&gt; { ignore = true; };
}, []);</code></pre></div>`,
      options: ['显示用户 2', '仍然显示用户 1：依赖数组漏了 id，effect 不会重新运行', '先显示用户 2，再被用户 1 覆盖', '报错：ignore 必须放到组件外面'],
      answer: 1,
      explain: '依赖数组是空的，effect 只在挂载后运行一次。id 变了，不会重新请求。修复：写成 <code>[id]</code>。这时 ignore 才发挥作用：id 变化时，清理函数把旧请求标记为过期，旧结果不会覆盖新结果。',
    },
    {
      q: `第一次搜索失败，第二次搜索成功。页面会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">async function run() {
  setLoading(true);
  try {
    setResults(await search(q));
  } catch (e) {
    setError(e.message);
  }
  setLoading(false);
}
// 渲染：error 有值时显示错误提示，下面显示 results</code></pre></div>`,
      options: ['只显示新结果', '新结果和上一次的错误提示同时显示', '只显示错误提示，因为 error 优先', 'loading 一直是 true'],
      answer: 1,
      explain: '成功的分支没有清空 error。第二次搜索成功后，results 有了新值，error 还是第一次的消息，两者同时显示。这就是用多个独立变量表示请求状态的风险：容易出现矛盾的组合。修复：开始请求时 <code>setError(null)</code>；更好的是用一个 <code>status</code> 字段（"loading" | "success" | "error"），一次只能处于一种状态。“loading 一直是 true”不对：最后一行在 try/catch 之后，无论成败都会执行。',
    },
  ],
  plays: {},
} satisfies Lesson;
