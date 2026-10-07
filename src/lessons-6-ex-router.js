/* ========== 后加的练习：路由（迷你路由版） ========== */
(function () {
  // 迷你路由库：和课文里的版本相同，只改了两处。
  // 1. Router 自带地址栏 #address，方便观察和检查。
  // 2. 支持 path: '*'；没有路由匹配时什么都不渲染。
  const LIB = `import { createContext, useContext, useState } from 'react';

// ===== 迷你路由库（不要修改） =====
// 用法和 React Router 一致：Link、useParams、useNavigate、useLocation。
const RouterCtx = createContext(null);
const ParamsCtx = createContext({});

function Router({ children }) {
  const [path, setPath] = useState('/');   // 真实的库会读写 window.location
  return (
    <RouterCtx.Provider value={{ path, navigate: setPath }}>
      <div id="address" style={{ fontFamily: 'monospace', background: '#eef2f4', padding: '4px 8px', borderRadius: 6 }}>https://example.com{path}</div>
      {children}
    </RouterCtx.Provider>
  );
}

// '/users/:id' 匹配 '/users/42'，得到 { id: '42' }；'*' 匹配任何路径
function matchPath(pattern, path) {
  if (pattern === '*') return {};
  const a = pattern.split('/').filter(Boolean), b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

// 按顺序找第一个匹配的路由。没有匹配时什么都不渲染。
function Routes({ routes }) {
  const { path } = useContext(RouterCtx);
  for (const r of routes) {
    const params = matchPath(r.path, path);
    if (params) return <ParamsCtx.Provider value={params}>{r.element}</ParamsCtx.Provider>;
  }
  return null;
}

function Link({ to, children }) {
  const { path, navigate } = useContext(RouterCtx);
  return <a href={to} onClick={e => { e.preventDefault(); navigate(to); }}
    style={{ marginRight: 10, fontWeight: path === to ? 700 : 400 }}>{children}</a>;
}
const useParams = () => useContext(ParamsCtx);
const useNavigate = () => useContext(RouterCtx).navigate;
const useLocation = () => ({ pathname: useContext(RouterCtx).path });

// ===== 数据（不要修改） =====
const USERS = [
  { id: '1', name: '张三', city: '北京' },
  { id: '2', name: '李四', city: '上海' },
  { id: '3', name: '王五', city: '广州' },
];
`;

  const NAV = `      <nav style={{ margin: '8px 0' }}>
        <Link to="/">首页</Link>
        <Link to="/users">用户</Link>
        <Link to="/users/99">不存在的用户</Link>
        <Link to="/settings">设置（还没做）</Link>
      </nav>`;

  const starter = LIB + `
// ===== 你的代码 =====
function Home() {
  return <h2 id="home">首页</h2>;
}

// 步骤 2：列出 USERS。每个用户一个 <li className="user">，里面是指向 /users/:id 的 Link。
function UserList() {
  return <ul>{/* TODO */}</ul>;
}

// 步骤 3：用 useParams 读出 id，找到这个用户。
// 显示 <h2 id="user-name">名字</h2> 和 <p id="user-city">城市</p>。
// 步骤 4：加一个“返回列表”按钮（id="back"），用 useNavigate 跳到 /users。
// 步骤 5：找不到用户时，渲染 <NotFound />。
function UserDetail() {
  return <p>TODO</p>;
}

// 404 页面（已写好）
function NotFound() {
  return <h2 id="not-found">404：页面不存在</h2>;
}

function App() {
  return (
    <Router>
` + NAV + `
      <Routes routes={[
        { path: '/', element: <Home /> },
        // 步骤 6：在这里加 /users、/users/:id 和 * 三条路由。注意顺序。
      ]} />
    </Router>
  );
}`;

  const solution = LIB + `
// ===== 你的代码 =====
function Home() {
  return <h2 id="home">首页</h2>;
}

function UserList() {
  return (
    <ul>
      {USERS.map(u => (
        <li key={u.id} className="user"><Link to={'/users/' + u.id}>{u.name}</Link></li>
      ))}
    </ul>
  );
}

function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = USERS.find(u => u.id === id);
  if (!user) return <NotFound />;
  return (
    <div>
      <h2 id="user-name">{user.name}</h2>
      <p id="user-city">{user.city}</p>
      <button id="back" onClick={() => navigate('/users')}>返回列表</button>
    </div>
  );
}

function NotFound() {
  return <h2 id="not-found">404：页面不存在</h2>;
}

function App() {
  return (
    <Router>
` + NAV + `
      <Routes routes={[
        { path: '/', element: <Home /> },
        { path: '/users', element: <UserList /> },
        { path: '/users/:id', element: <UserDetail /> },
        { path: '*', element: <NotFound /> },
      ]} />
    </Router>
  );
}`;

  LESSONS.find(l => l.id === 'router').exercise = {
    task: '<ol class="task-steps">'
      + '<li>不要修改“迷你路由库”和 <code>USERS</code>。它们的用法和 React Router 一致。</li>'
      + '<li>完成 <code>UserList</code>：每个用户渲染一个 <code>&lt;li className="user"&gt;</code>，里面用 <code>Link</code> 指向 <code>/users/用户id</code>。</li>'
      + '<li>完成 <code>UserDetail</code>：用 <code>useParams</code> 读出 <code>id</code>，在 <code>USERS</code> 中找到用户。显示 <code>#user-name</code>（名字）和 <code>#user-city</code>（城市）。</li>'
      + '<li>在详情页加一个按钮 <code>#back</code>。点击后用 <code>useNavigate</code> 跳到 <code>/users</code>。</li>'
      + '<li>找不到用户时（例如 <code>/users/99</code>），渲染 <code>&lt;NotFound /&gt;</code>。</li>'
      + '<li>在路由表中加三条路由：<code>/users</code>、<code>/users/:id</code> 和兜底的 <code>*</code>。</li>'
      + '<li>点导航里的每个链接，看地址栏和页面是否一致。</li>'
      + '</ol>',
    starter,
    solution,
    faded: `// （迷你路由库和 USERS 与起始代码相同，这里省略）

function Home() {
  return <h2 id="home">首页</h2>;
}

function UserList() {
  return (
    <ul>
      {USERS.map(u => (
        <li key={u.id} className="user">{/* ✏️ 用 Link 指向 '/users/' + 用户 id，文字是名字 */}</li>
      ))}
    </ul>
  );
}

function UserDetail() {
  /* ✏️ 用 useParams 读出 id */
  const navigate = useNavigate();
  const user = USERS.find(u => u.id === id);
  /* ✏️ 找不到用户时，返回 <NotFound /> */
  return (
    <div>
      <h2 id="user-name">{user.name}</h2>
      <p id="user-city">{user.city}</p>
      <button id="back" onClick={() => navigate('/users')}>返回列表</button>
    </div>
  );
}

function NotFound() {
  return <h2 id="not-found">404：页面不存在</h2>;
}

function App() {
  return (
    <Router>
      <nav style={{ margin: '8px 0' }}>{/* 导航与起始代码相同 */}</nav>
      <Routes routes={[
        { path: '/', element: <Home /> },
        { path: '/users', element: <UserList /> },
        { path: '/users/:id', element: <UserDetail /> },
        /* ✏️ 兜底路由：匹配任何路径，显示 NotFound。想一想它该放在第几条 */
      ]} />
    </Router>
  );
}`,
    hint: '迷你 <code>Routes</code> 按数组顺序取<b>第一个</b>匹配的路由，而 <code>*</code> 匹配一切。详情页的内容要来自 <code>useParams()</code> 返回的 <code>id</code>，不要写死某个用户。',
    test: async (t) => {
      // 普通 <a href> 会让整个页面跳走。这里拦住浏览器的默认跳转，只看迷你路由有没有更新地址。
      const guard = (e) => { if (e.target.closest && e.target.closest('a')) e.preventDefault(); };
      t.root.addEventListener('click', guard, true);
      try {
        const path = () => t.text('#address').replace('https://example.com', '');
        const go = async (to) => {
          const a = t.qa('nav a').find(x => x.getAttribute('href') === to);
          t.assert(a, '找不到导航链接 ' + to + '。不要修改 nav 里的链接');
          await t.click(a); await t.wait(30);
        };
        t.assert(t.q('#address'), '找不到地址栏 #address。不要修改迷你路由库');
        t.assert(/useParams\s*\(\s*\)/.test(t.source), '详情页要用 useParams() 读出 id（步骤 3）');
        t.assert(/useNavigate\s*\(\s*\)/.test(t.source), '返回按钮要用 useNavigate() 得到的函数跳转（步骤 4）');
        t.assert(path() === '/' && t.q('#home'), '一开始应在首页 /，并显示 #home');
        t.assert(!t.q('#not-found'), '在首页时不应显示 #not-found。检查 * 路由是不是放在了最前面（步骤 6）');

        await go('/users');
        t.assert(path() === '/users', '点“用户”后地址应是 /users');
        t.assert(!t.q('#not-found'), '/users 页不应显示 #not-found。* 路由应放在最后（步骤 6）');
        const items = t.qa('li.user');
        t.assert(items.length === 3, '用户列表应有 3 个 li.user，实际有 ' + items.length + ' 个（步骤 2）');
        t.assert(items.map(li => li.textContent.trim()).join() === '张三,李四,王五', '列表应按顺序显示 张三、李四、王五');

        const open = async (id, name, city) => {
          const a = t.qa('li.user a').find(x => x.getAttribute('href') === '/users/' + id);
          t.assert(a, '用户 ' + name + ' 的链接应指向 /users/' + id + '（步骤 2）');
          await t.click(a); await t.wait(30);
          t.assert(path() === '/users/' + id, '点击“' + name + '”后，地址应是 /users/' + id + '，实际是 ' + path() + '。站内跳转要用 Link，不要用 <a href>');
          t.assert(t.text('#user-name') === name, '在 /users/' + id + '，#user-name 应显示“' + name + '”，实际是“' + t.text('#user-name') + '”。名字要按 useParams 的 id 查找（步骤 3）');
          t.assert(t.text('#user-city') === city, '在 /users/' + id + '，#user-city 应显示“' + city + '”，实际是“' + t.text('#user-city') + '”');
          t.assert(!t.q('#not-found'), '用户存在时不应显示 #not-found');
          t.assert(t.q('#back'), '详情页应有返回按钮 #back（步骤 4）');
          await t.click('#back'); await t.wait(30);
          t.assert(path() === '/users' && t.qa('li.user').length === 3, '点 #back 后应回到 /users 列表页，实际地址是 ' + path() + '（步骤 4）');
        };
        await open('2', '李四', '上海');
        await open('3', '王五', '广州');
        await open('1', '张三', '北京');

        await go('/users/99');
        t.assert(t.q('#not-found'), '/users/99 没有这个用户，应显示 #not-found（步骤 5）');
        t.assert(!t.q('#user-name') || !t.text('#user-name'), '/users/99 不应显示任何用户名');
        await go('/settings');
        t.assert(path() === '/settings' && t.q('#not-found'), '/settings 没有对应页面，应由 * 路由显示 #not-found（步骤 6）');
        await go('/');
        t.assert(t.q('#home') && !t.q('#not-found'), '回到 / 时应显示首页，且不显示 #not-found');
      } finally {
        t.root.removeEventListener('click', guard, true);
      }
    },
  };
})();
