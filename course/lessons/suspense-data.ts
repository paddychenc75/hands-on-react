import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/suspense-data.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'suspense-data',
  stage: 5,
  title: 'Suspense 数据获取与资源模式',
  mins: 38,
  summary: '亲手写出一个能配合 Suspense 的数据层：资源缓存、并行预取、用过渡更新保留旧界面、出错后重试。',
  goals: [
    '能写出带缓存的 read(key, load)：同一个 key 只请求一次，按状态返回数据、抛出 Promise 或抛出错误',
    '能诊断一个页面的请求瀑布，并用“先发请求，再渲染”把串行请求改成并行',
    '能用 startTransition 让已经显示的内容在切换时保留，而不是闪回 fallback',
    '能设计 Suspense 与错误边界的位置，并实现“清掉失败的缓存，再重置边界”的重试',
  ],
  keyPoints: [
    '机制：组件在渲染时读取数据。数据没到，就抛出一个 Promise。最近的 Suspense 显示 fallback；Promise 完成后，React 重新渲染这一部分。',
    '缓存必须放在组件外。第一次挂载就挂起的组件，它的 state、ref、useMemo 都会被丢弃。在组件里创建 Promise，每次重试都是一个新请求。',
    'Suspense 不会自动消除瀑布：子组件要等父组件不再挂起才会渲染。在点击或路由切换时就把所有请求发出去（render-as-you-fetch）。',
    '已经显示内容的边界再次挂起时，默认换成 fallback。把 set 函数调用放进 startTransition，React 会保留旧界面，并让 isPending 为 true。',
    '请求失败时，read 抛出错误，交给错误边界。重试要做两件事：从缓存中删掉失败的记录，再重置边界。',
  ],
  quiz: [
    {
      q: '同事写了一个支持 Suspense 的 Hook：<code>function useUser(id) { const [p] = useState(() =&gt; fetchUser(id)); return readPromise(p); }</code>。页面第一次打开时一直显示 fallback，网络面板里请求不断重复。原因是？',
      options: [
        'useState 的初始化函数每次渲染都会执行',
        '组件第一次挂载就挂起，没有被提交，useState 保存的 Promise 随这次渲染一起被丢弃，重试时又创建新请求',
        'readPromise 应该返回 Promise，而不是抛出 Promise',
        'fetchUser 要放进 useEffect 里调用',
      ],
      answer: 1,
      explain: '挂起时，没有提交过的组件不会保留任何 state。React 重试时把它当成全新的组件，useState 的初始化函数再次执行，又发出一个请求。缓存要放在组件外：模块级的 Map、Context 提供的缓存对象，或者数据库。第一项是常见误解：初始化函数只在挂载时执行，问题在于挂载从未完成。放进 useEffect 就不再是 Suspense 模式：effect 要等提交后才执行。',
    },
    {
      q: '商品页先读取商品，再在子组件 Reviews 里读取评价。两个请求各要 500ms，页面要 1 秒才完整显示。不改组件结构，最直接的改法是？',
      options: [
        '给 Reviews 单独包一个 Suspense',
        '把 Reviews 用 memo 包裹',
        '在进入商品页的点击处理函数里，同时发出商品和评价两个请求并放进缓存',
        '把两个请求都放进商品组件的 useEffect',
      ],
      answer: 2,
      explain: 'Reviews 是挂起组件的子组件，要等商品数据到了才会渲染，才会开始请求。提前在点击时发出两个请求，渲染时只是从缓存读取，总时间约 500ms。最有迷惑性的是第一项：多一个 Suspense 只能让两块分别显示，不能让评价的请求提前开始，因为 Reviews 仍然要等父组件渲染完才会被渲染。',
    },
    {
      q: '标签页切换写成 <code>&lt;Suspense key={tab} fallback={&lt;Spinner /&gt;}&gt;&lt;TabContent tab={tab} /&gt;&lt;/Suspense&gt;</code>，并用 startTransition 调用 setTab。切换时仍然闪出 Spinner。为什么？',
      options: [
        'startTransition 不能和 Suspense 一起用',
        'key 变了，旧边界被卸载，新边界是第一次挂载。过渡更新只保留已经显示过内容的边界',
        '要用 useDeferredValue 代替 startTransition',
        'Spinner 太快了，要加 300ms 延迟',
      ],
      answer: 1,
      explain: '过渡更新的规则是：不要把已经显示的内容换成 fallback。加了 key={tab} 之后，每个标签都是一个新的边界，它没有“已经显示的内容”可以保留，只能显示 fallback。去掉 key，让同一个边界跨标签复用，startTransition 就会保留旧标签页。加延迟只是让 Spinner 晚一点出现，没有解决“边界是新的”这个原因。',
    },
    {
      q: '文章区请求失败，错误边界显示“重试”按钮。点击后，边界只执行了 <code>this.setState({ error: null })</code>。会怎样？',
      options: [
        '重新发出请求，成功后显示文章',
        '立刻又显示错误：缓存里仍是失败的记录，read 再次抛出同一个错误',
        '一直显示 fallback',
        'React 报错：错误边界不能重置自己的 state',
      ],
      answer: 1,
      explain: '重置边界只是让 children 重新渲染。read 在缓存里找到 status 为 error 的记录，直接抛出同一个错误，不会发新请求。正确的重试先删掉这条缓存记录，再重置边界。第一项是最常见的误解：它假设“重新渲染”就等于“重新请求”。',
    },
    {
      q: '个人主页有三块：用户信息（必需）、最近文章、推荐关注。推荐关注的接口经常超时。Suspense 和错误边界怎样放置最合适？',
      options: [
        '整页一个 Suspense 和一个错误边界，保证内容一起出现',
        '用户信息、最近文章、推荐关注各自一对边界',
        '只给推荐关注包一对边界，其余不包',
        '每篇文章、每个推荐用户各包一对边界',
      ],
      answer: 1,
      explain: '三块内容互不依赖，用户可以单独使用其中任何一块。各包一对边界后，推荐关注超时或失败，只影响它自己，也能单独重试。整页一个边界会让最慢、最不稳定的接口拖住整页。第三项看似省事，但用户信息和文章没有自己的边界，它们挂起或失败会影响更大的范围。每一项都包会导致布局不停跳动。',
    },
  ],
  exercise: {
    task: '<p>个人主页现在先加载用户信息（400ms），再加载文章（800ms），共约 1.2 秒。<code>read</code> 也还没有缓存。按下面的要求修改，不要修改模拟接口 <code>api</code>：</p><ol class="task-steps"><li>实现带缓存的 <code>read(key, load)</code>：同一个 key 只请求一次；按状态返回数据、抛出 Promise 或抛出错误。</li><li>消除瀑布：用户和文章的两个请求要同时发出（相差小于 50ms）。</li><li>用户信息和文章各用一个 Suspense。文章的 fallback 是 <code>&lt;p className="fallback"&gt;加载文章…&lt;/p&gt;</code>。用户信息先到，就先显示。</li><li>点“下一位用户”时，用过渡更新保留旧内容，不要闪出任何 <code>.fallback</code>。切换期间显示 <code>&lt;small id="pending"&gt;切换中…&lt;/small&gt;</code>。</li><li>文章请求失败时，只有文章区显示错误，用户信息照常显示。点“重试”要重新请求，并显示文章。错误边界已经写好，想一想它的 <code>onRetry</code> 该做什么。</li></ol>',
    starter: `import { Suspense, useState, useTransition, Component } from 'react';

// ---- 模拟接口（不要修改）----
const NAMES = ['阿青', '小林', '老周', '美玲', '大伟', '思思', '阿杰', '晓燕', '国强', '小米'];
const nameOf = (id) => NAMES[(id - 1) % NAMES.length];
const api = {
  fetchUser(id) {
    return new Promise(resolve => setTimeout(() => resolve({ id, name: nameOf(id) }), 400));
  },
  fetchPosts(id) {
    return new Promise(resolve => setTimeout(() => resolve(
      [1, 2, 3].map(n => nameOf(id) + ' 的第 ' + n + ' 篇文章')
    ), 800));
  },
};

// ---- 资源缓存 ----
const cache = new Map();

// 现在的 read 没有缓存：每次调用都发一个新请求，然后挂起
function read(key, load) {
  throw load();
}

// ---- 错误边界（已经写好）----
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) {
    const keys = this.props.resetKeys || [];
    const changed = (prev.resetKeys || []).some((k, i) => !Object.is(k, keys[i]));
    if (this.state.error && changed) this.setState({ error: null });
  }
  retry = () => {
    if (this.props.onRetry) this.props.onRetry();
    this.setState({ error: null });
  };
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <p className="error">
        加载失败：{this.state.error.message} <button onClick={this.retry}>重试</button>
      </p>
    );
  }
}

// ---- 页面 ----
function UserInfo({ userId }) {
  const user = read('user:' + userId, () => api.fetchUser(userId));
  return (
    <section>
      <h2 id="user">{user.name}</h2>
      <Posts userId={userId} />
    </section>
  );
}

function Posts({ userId }) {
  const posts = read('posts:' + userId, () => api.fetchPosts(userId));
  return <ul id="posts">{posts.map(p => <li key={p}>{p}</li>)}</ul>;
}

function ProfilePage({ userId }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<p className="fallback">加载用户…</p>}>
        <UserInfo userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  const [userId, setUserId] = useState(1);

  function next() {
    setUserId(userId + 1);
  }

  return (
    <div>
      <button onClick={next}>下一位用户</button>
      <ProfilePage userId={userId} />
    </div>
  );
}`,
    solution: `import { Suspense, useState, useTransition, Component } from 'react';

// ---- 模拟接口（不要修改）----
const NAMES = ['阿青', '小林', '老周', '美玲', '大伟', '思思', '阿杰', '晓燕', '国强', '小米'];
const nameOf = (id) => NAMES[(id - 1) % NAMES.length];
const api = {
  fetchUser(id) {
    return new Promise(resolve => setTimeout(() => resolve({ id, name: nameOf(id) }), 400));
  },
  fetchPosts(id) {
    return new Promise(resolve => setTimeout(() => resolve(
      [1, 2, 3].map(n => nameOf(id) + ' 的第 ' + n + ' 篇文章')
    ), 800));
  },
};

// ---- 资源缓存 ----
const cache = new Map();

// 取得（必要时创建）一条缓存记录。不抛出，所以也能用来预取
function getRecord(key, load) {
  let record = cache.get(key);
  if (!record) {
    record = { status: 'pending', value: undefined };
    record.promise = load().then(
      value => { record.status = 'done'; record.value = value; },
      error => { record.status = 'error'; record.value = error; }
    );
    cache.set(key, record);
  }
  return record;
}

function read(key, load) {
  const record = getRecord(key, load);
  if (record.status === 'pending') throw record.promise;
  if (record.status === 'error') throw record.value;
  return record.value;
}

const userKey = (id) => 'user:' + id;
const postsKey = (id) => 'posts:' + id;

// 先发请求，再渲染
function preloadProfile(id) {
  getRecord(userKey(id), () => api.fetchUser(id));
  getRecord(postsKey(id), () => api.fetchPosts(id));
}

// ---- 错误边界（已经写好）----
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) {
    const keys = this.props.resetKeys || [];
    const changed = (prev.resetKeys || []).some((k, i) => !Object.is(k, keys[i]));
    if (this.state.error && changed) this.setState({ error: null });
  }
  retry = () => {
    if (this.props.onRetry) this.props.onRetry();
    this.setState({ error: null });
  };
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <p className="error">
        加载失败：{this.state.error.message} <button onClick={this.retry}>重试</button>
      </p>
    );
  }
}

// ---- 页面 ----
function UserInfo({ userId }) {
  const user = read(userKey(userId), () => api.fetchUser(userId));
  return <h2 id="user">{user.name}</h2>;
}

function Posts({ userId }) {
  const posts = read(postsKey(userId), () => api.fetchPosts(userId));
  return <ul id="posts">{posts.map(p => <li key={p}>{p}</li>)}</ul>;
}

function ProfilePage({ userId }) {
  return (
    <section>
      <ErrorBoundary resetKeys={[userId]} onRetry={() => cache.delete(userKey(userId))}>
        <Suspense fallback={<p className="fallback">加载用户…</p>}>
          <UserInfo userId={userId} />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary resetKeys={[userId]} onRetry={() => cache.delete(postsKey(userId))}>
        <Suspense fallback={<p className="fallback">加载文章…</p>}>
          <Posts userId={userId} />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
}

function App() {
  const [userId, setUserId] = useState(1);
  const [isPending, startTransition] = useTransition();

  function next() {
    const id = userId + 1;
    preloadProfile(id);                     // 点击时就发出两个请求
    startTransition(() => setUserId(id));   // 保留旧内容，直到新数据到齐
  }

  return (
    <div>
      <button onClick={next}>下一位用户</button>
      {isPending && <small id="pending">切换中…</small>}
      <ProfilePage userId={userId} />
    </div>
  );
}`,
    exports: ['ProfilePage', 'api'],
    hint: '分三块想：1. 缓存记录要在第一次 read 时就存进去，并记下 pending、done、error 三种状态。2. 为什么文章要等用户到了才请求？看看 Posts 渲染在谁的里面。3. 重试时，缓存里那条失败的记录还在吗？',
    faded: `// （模拟接口、错误边界与起始代码相同，这里省略）

const cache = new Map();

function getRecord(key, load) {
  let record = cache.get(key);
  if (!record) {
    record = { status: 'pending', value: undefined };
    record.promise = load().then(
      value => { record.status = 'done'; record.value = value; },
      /* ✏️ 失败时也要记下状态和错误 */
    );
    /* ✏️ 先把记录存进缓存，再返回 */
  }
  return record;
}

function read(key, load) {
  const record = getRecord(key, load);
  /* ✏️ pending 时抛出 record.promise；error 时抛出错误；否则返回数据 */
}

function UserInfo({ userId }) {
  const user = read('user:' + userId, () => api.fetchUser(userId));
  return <h2 id="user">{user.name}</h2>;   // Posts 不再放在这里
}

function ProfilePage({ userId }) {
  return (
    <section>
      <ErrorBoundary resetKeys={[userId]} onRetry={() => cache.delete('user:' + userId)}>
        <Suspense fallback={<p className="fallback">加载用户…</p>}>
          <UserInfo userId={userId} />
        </Suspense>
      </ErrorBoundary>
      {/* ✏️ 文章区：自己的错误边界（重试时删掉哪条缓存？）和自己的 Suspense */}
    </section>
  );
}

function App() {
  const [userId, setUserId] = useState(1);
  const [isPending, startTransition] = useTransition();

  function next() {
    const id = userId + 1;
    /* ✏️ 可选：在这里就把两个请求发出去 */
    /* ✏️ 用过渡更新切换 userId */
  }

  return (
    <div>
      <button onClick={next}>下一位用户</button>
      {isPending && <small id="pending">切换中…</small>}
      <ProfilePage userId={userId} />
    </div>
  );
}`,
    test: async (t) => {
      const { ProfilePage, api } = t.exports;
      t.assert(typeof ProfilePage === 'function', '请保留名为 ProfilePage 的组件，它接收 userId');
      t.assert(api && typeof api.fetchUser === 'function' && typeof api.fetchPosts === 'function', '请保留模拟接口 api，以及它的 fetchUser 和 fetchPosts');
      // 换上检查程序自己的接口：记录每次请求的时间，可以让某次请求失败
      const origUser = api.fetchUser, origPosts = api.fetchPosts;
      const log = [];
      const failPosts = new Set();
      const names = ['阿青', '小林', '老周', '美玲', '大伟', '思思', '阿杰', '晓燕', '国强', '小米'];
      const nm = (id) => names[(id - 1) % names.length];
      const delay = (ms, fn) => new Promise((res, rej) => window.setTimeout(() => { try { res(fn()); } catch (e) { rej(e); } }, ms));
      api.fetchUser = (id) => { log.push({ what: 'user', id, at: performance.now() }); return delay(400, () => ({ id, name: nm(id) })); };
      api.fetchPosts = (id) => {
        log.push({ what: 'posts', id, at: performance.now() });
        if (failPosts.has(id)) { failPosts.delete(id); return delay(300, () => { throw new Error('网络错误'); }); }
        return delay(800, () => [1, 2, 3].map(n => nm(id) + ' 的第 ' + n + ' 篇文章'));
      };
      const reqs = (what, id) => log.filter(x => x.what === what && x.id === id);
      const countSuspense = (container) => {
        const ck = Object.keys(container).find(k => k.startsWith('__reactContainer$'));
        let n = 0; const stack = ck ? [container[ck]] : [];
        while (stack.length) { const f = stack.pop(); if (!f) continue; if (f.tag === 13) n++; if (f.sibling) stack.push(f.sibling); if (f.child) stack.push(f.child); }
        return n;
      };
      const box = document.createElement('div');
      document.body.appendChild(box);
      let root = null;
      try {
        // 1. 单独渲染一个新用户：缓存、并行、两个边界
        const id = 7;
        const t0 = performance.now();
        root = ReactDOM.createRoot(box);
        root.render(React.createElement(ProfilePage, { userId: id }));
        let userAt = null, postsAt = null;
        while (performance.now() - t0 < 1600) {
          await t.wait(20);
          const now = performance.now() - t0;
          if (userAt === null && box.querySelector('#user')) userAt = now;
          if (postsAt === null && box.querySelectorAll('#posts li').length === 3) postsAt = now;
          if (reqs('user', id).length > 3) break;
        }
        const nu = reqs('user', id).length, np = reqs('posts', id).length;
        t.assert(nu > 0, '渲染 ProfilePage 后，没有调用 api.fetchUser。请通过 api.fetchUser(id) 请求用户信息');
        t.assert(nu === 1, '同一个用户的信息被请求了 ' + nu + ' 次。read 要把记录存进缓存：同一个 key 只请求一次，之后按状态返回数据或抛出同一个 Promise（步骤 1）');
        t.assert(np === 1, np === 0 ? '1.6 秒内没有请求文章。请通过 api.fetchPosts(id) 请求文章' : '同一个用户的文章被请求了 ' + np + ' 次。同一个 key 只能请求一次（步骤 1）');
        const gap = Math.abs(reqs('posts', id)[0].at - reqs('user', id)[0].at);
        t.assert(gap < 50, '文章请求比用户请求晚了约 ' + Math.round(gap) + 'ms 才发出，这是请求瀑布。Posts 在 UserInfo 里面，要等用户信息到了才渲染。让两个请求同时发出（步骤 2）');
        t.assert(userAt !== null && postsAt !== null, '1.6 秒内用户信息或文章没有显示出来。检查 #user 和 #posts li 是否还在');
        t.assert(countSuspense(box) >= 2, '页面里只找到 ' + countSuspense(box) + ' 个 Suspense。用户信息和文章要各用一个 Suspense（步骤 3）');
        t.assert(postsAt - userAt > 150, '用户信息要等文章一起才显示（用户 ' + Math.round(userAt) + 'ms，文章 ' + Math.round(postsAt) + 'ms）。用户信息和文章要放在两个独立的 Suspense 里（步骤 3）');
        t.assert(postsAt < 1150, '文章约 ' + Math.round(postsAt) + 'ms 才显示，应在约 800ms 显示（步骤 2）');

        // 2. 文章请求失败：只影响文章区，重试能恢复
        const bad = 9;
        failPosts.add(bad);
        root.unmount();
        root = ReactDOM.createRoot(box);
        root.render(React.createElement(ProfilePage, { userId: bad }));
        // Suspense 会用 display: none 藏起旧内容，所以只看可见的元素
        const visible = (sel) => Array.from(box.querySelectorAll(sel)).filter(e => !e.closest('[style*="display: none"]'));
        const findRetry = () => visible('button').find(b => b.textContent.trim() === '重试');
        const userOk = () => visible('#user').some(e => e.textContent.includes(nm(bad)));
        const t1 = performance.now();
        while (performance.now() - t1 < 1500 && !(findRetry() && userOk())) await t.wait(20);
        const retryBtn = findRetry();
        t.assert(retryBtn || reqs('posts', bad).length < 2, '文章请求失败后，read 又发出了新请求，错误一直没有交给错误边界。失败也要记进缓存：status 为 error 时抛出这个错误（步骤 1、5）');
        t.assert(retryBtn, '文章请求失败后，找不到“重试”按钮。文章区要有自己的错误边界（步骤 5）');
        t.assert(userOk(),
          '文章请求失败时，用户信息也不见了。错误边界只包住文章区，用户信息才能照常显示（步骤 5）');
        retryBtn.click();
        const t2 = performance.now();
        while (performance.now() - t2 < 1500 && visible('#posts li').length !== 3) await t.wait(20);
        const tries = reqs('posts', bad).length;
        t.assert(tries >= 2, '点“重试”后没有重新请求文章：缓存里还留着失败的记录，read 又抛出了同一个错误。onRetry 要先删掉这条缓存记录（步骤 5）');
        t.assert(visible('#posts li').length === 3, '点“重试”后，文章没有显示出来（步骤 5）');
        t.assert(!findRetry(), '重试成功后，错误提示应该消失');
        root.unmount(); root = null;

        // 3. 在预览中点“下一位用户”：保留旧内容，不闪 fallback
        const t3 = performance.now();
        while (performance.now() - t3 < 3000 && t.qa('#posts li').length !== 3) await t.wait(30);
        t.assert(t.qa('#posts li').length === 3 && t.q('#user'), '预览中第一位用户的信息和文章没有显示出来。请先点“运行”');
        const oldName = t.text('#user');
        const nextBtn = t.byText('button', '下一位用户');
        t.assert(nextBtn, '找不到“下一位用户”按钮');
        const before = log.length;
        nextBtn.click();
        let sawFallback = false, sawPending = false, lostOld = false;
        const t4 = performance.now();
        while (performance.now() - t4 < 2000) {
          await t.wait(15);
          if (t.q('.fallback')) sawFallback = true;
          if (t.q('#pending')) sawPending = true;
          const u = t.q('#user');
          if (!u) lostOld = true;
          if (u && u.textContent.trim() !== oldName && t.qa('#posts li').length === 3) break;
        }
        const fresh = log.slice(before);
        t.assert(fresh.length >= 2, '点“下一位用户”后，没有通过 api 请求下一位用户的数据');
        const newId = fresh[0].id;
        const fu = fresh.find(x => x.what === 'user'), fp = fresh.find(x => x.what === 'posts');
        t.assert(fu && fp && Math.abs(fu.at - fp.at) < 50, '切换用户时，两个请求没有同时发出（步骤 2）');
        t.assert(!sawFallback && !lostOld, '切换用户时，旧内容被 fallback 替换了。把切换 userId 的 set 函数调用放进 startTransition，已经显示的内容就会保留到新数据到齐（步骤 4）');
        t.assert(sawPending, '切换期间没有出现 #pending。用 useTransition 拿到 isPending，显示 <small id="pending">切换中…</small>（步骤 4）');
        t.assert(t.text('#user') === nm(newId), '2 秒后仍没有显示下一位用户。应显示“' + nm(newId) + '”，实际是“' + t.text('#user') + '”');
        t.assert(t.qa('#posts li').length === 3 && t.qa('#posts li')[0].textContent.includes(nm(newId)), '切换后，文章列表应是“' + nm(newId) + '”的文章');
        await t.wait(50);
        t.assert(!t.q('#pending'), '切换完成后，#pending 应该消失');
      } finally {
        if (root) root.unmount();
        box.remove();
        api.fetchUser = origUser; api.fetchPosts = origPosts;
      }
    },
  },
  checkOnly: [
    {
      q: `fetchUser 和 fetchOrders 各需要 300ms。页面完整显示大约需要多久？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Page({ id }) {
  const user = read('user:' + id, () =&gt; fetchUser(id));
  return (
    &lt;Suspense fallback={&lt;Spinner /&gt;}&gt;
      &lt;h1&gt;{user.name}&lt;/h1&gt;
      &lt;Orders id={id} /&gt;
    &lt;/Suspense&gt;
  );
}
function Orders({ id }) {
  const orders = read('orders:' + id, () =&gt; fetchOrders(id));
  return &lt;List items={orders} /&gt;;
}</code></pre></div>`,
      options: [
        '约 300ms：两个请求并行',
        '约 600ms：Orders 要等 Page 不再挂起才渲染',
        '约 300ms：Suspense 会预先渲染所有子组件',
        '永远不显示：Page 在自己的 Suspense 外面读取数据',
      ],
      answer: 1,
      explain: 'Page 读取用户时挂起，它返回的 JSX（包括 Orders）根本没有生成，所以 Orders 的请求要等用户数据到了才发出。这是父子瀑布。注意 Page 在自己的 Suspense 之外读取数据，挂起时由更上层的边界显示 fallback，不会“永远不显示”。修法：在 Page 开头或更早的地方同时发出两个请求。',
    },
    {
      q: `这个 read 有什么问题？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const cache = new Map();
function read(key, load) {
  if (cache.has(key)) return cache.get(key);
  const promise = load().then(data =&gt; {
    cache.set(key, data);
  });
  throw promise;
}</code></pre></div>`,
      options: [
        '没有问题',
        '数据到达前，组件每次重新渲染都会再发一个请求；请求失败时会不停地重新请求',
        'Map 不能存 Promise',
        'throw promise 会被当成错误交给错误边界',
      ],
      answer: 1,
      explain: '请求进行中时，缓存里还没有这个 key。如果组件在数据到达之前重新渲染（例如父组件更新、兄弟组件的 Promise 先完成），read 会再发一次请求。失败时 cache 永远不会被写入，Promise 被拒绝后 React 重试，又发新请求，形成循环，错误边界也收不到错误。正确的做法是先存一条 pending 记录，并记录 error 状态。',
    },
    {
      q: `已经显示了 id = 1 的商品。点击后，界面会怎样变化？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function handleNext() {
  startTransition(() =&gt; setId(2));
}

&lt;Suspense fallback={&lt;p&gt;加载中…&lt;/p&gt;}&gt;
  &lt;Product id={id} /&gt;
&lt;/Suspense&gt;</code></pre></div>`,
      options: ['先显示“加载中…”，数据到后显示商品 2', '商品 1 保持显示，数据到后直接换成商品 2', '商品 1 立刻消失，区域变成空白', '商品 2 的内容先显示一半'],
      answer: 1,
      explain: '这个 Suspense 边界已经显示过内容，切换是过渡更新，所以 React 不会用 fallback 替换它。新数据到齐后一次性提交。如果要提示用户，用 useTransition 拿到 isPending。去掉 startTransition，才会先显示“加载中…”。',
    },
    {
      q: `用户 3 的文章请求失败了。点“重试”后，会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;ErrorBoundary
  onRetry={() =&gt; cache.delete('posts:' + userId)}
  fallback={(retry) =&gt; &lt;button onClick={retry}&gt;重试&lt;/button&gt;}
&gt;
  &lt;Posts userId={userId} /&gt;
&lt;/ErrorBoundary&gt;</code></pre></div>`,
      options: [
        '发出新请求；请求期间整个页面被上层的 Suspense 换成 fallback',
        '只有文章区显示 fallback，其他内容不变',
        '立刻再次显示“重试”',
        '什么都不发生：Posts 没有 Suspense，不能重试',
      ],
      answer: 0,
      explain: '缓存记录被删掉后，Posts 重新渲染时发出新请求并挂起。这里的错误边界里没有 Suspense，挂起会一直向上找，找到更外层的 Suspense，所以替换的范围更大，可能是整个页面。通常把 Suspense 放在错误边界里面，成对使用，把等待和失败限制在同一块区域。',
    },
  ],
  plays: {
    '资源在哪里创建？': {
      note: '写法 A 约 0.8 秒后显示句子，只请求 1 次。<br>写法 B 一直显示“加载中…”，请求次数每 0.8 秒加 1。QuoteB 第一次渲染就挂起了，从没被提交过。Promise 完成后 React 重新渲染它，useMemo 没有可以复用的上一次结果，于是又创建一个新请求，又挂起……',
      predict: {
        q: '点“写法 B”。QuoteB 用 useMemo 创建资源，依赖数组是空的。会发生什么？',
        options: ['约 0.8 秒后显示句子，和写法 A 一样', '一直显示“加载中…”，请求次数不断增加', '报错：挂起的组件里不能调用 useMemo', '请求 2 次后显示句子'],
        answer: 1,
        explain: '挂起的组件如果是第一次挂载，React 会丢弃这次渲染的一切，包括 useMemo 的结果。每次重试都会创建新的 Promise，它永远处于 pending。useMemo 只在组件已经提交过之后才能复用结果。',
      },
      pkey: 'suspense-data|资源在哪里创建？',
    },
    '请求时间线：瀑布与并行': {
      note: '“瀑布”：文章请求在约 400ms 才开始，全部完成约 1200ms。<br>“并行”：两个请求都在 0ms 开始，约 800ms 全部完成。组件代码一行没改，只是请求提前发出了。',
    },
    '切换时：闪回 fallback，还是保留旧界面': {
      note: '等第一位用户出现后，勾选状态下点“下一位用户”：旧卡片变暗，约 1 秒后直接换成新卡片。取消勾选再点：卡片先消失，换成“加载用户…”。',
    },
  },
} satisfies Lesson;
