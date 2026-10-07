import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/router.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'router',
  stage: 4,
  title: '路由：React Router',
  mins: 28,
  summary: '让单页应用拥有多个“页面”：路由表、动态参数、嵌套布局与跳转。',
  goals: [
    '能解释客户端路由的三步：URL 变化、路由库读 URL、渲染匹配的组件',
    '能写出路由表：静态路径、动态参数 <code>:id</code>、兜底 <code>*</code>，并排对顺序',
    '能用 Link、useParams、useNavigate 完成“列表 → 详情 → 返回”的流程',
    '能判断哪些状态该放进 URL 的查询参数，以及什么时候用 <code>{ replace: true }</code>',
  ],
  keyPoints: [
    '问题：单页应用只有一个 HTML。路由库读取 URL，决定渲染哪个组件，浏览器不刷新。',
    '站内跳转用 <code>&lt;Link to&gt;</code>。普通 <code>&lt;a href&gt;</code> 会整页刷新，所有 state 丢失。',
    '动态段 <code>users/:id</code> 用 <code>useParams()</code> 读出；值是字符串，和数字比较前要转换。',
    '嵌套路由：父路由渲染公共布局，子路由的内容出现在 <code>&lt;Outlet /&gt;</code> 的位置。',
    '最常见的坑：部署后在 <code>/users/2</code> 刷新得到 404。服务器要把所有路径都返回 index.html。',
  ],
  quiz: [
    {
      q: '同事在导航栏里写了 <code>&lt;a href="/cart"&gt;购物车&lt;/a&gt;</code>。用户在首页填了一半表单，点这个链接再点“后退”。表单里的内容会怎样？',
      options: [
        '还在：React Router 会把每个页面的 state 自动保存在历史记录里',
        '没了：a 标签让浏览器整页刷新，所有 state 都被丢弃',
        '还在，因为 URL 变回了首页',
        '没了，但只是因为没有用 useNavigate',
      ],
      answer: 1,
      explain:
        '普通 a 标签会让浏览器重新加载整个页面，React 应用从头启动，state 全部丢失。&lt;Link&gt; 拦截点击，只改 URL 并重新渲染。“URL 变回了首页”有迷惑性：URL 相同不代表 state 还在，state 只存在于这一次页面加载的内存里。',
    },
    {
      q: '路由是 <code>users/:id</code>，当前 URL 是 <code>/users/2</code>。组件里写 <code>const { id } = useParams(); const user = USERS.find(u =&gt; u.id === id);</code>，USERS 里的 id 是数字。结果是？',
      options: [
        '找到 id 为 2 的用户',
        'undefined：id 是字符串 "2"，不全等于数字 2',
        '报错：useParams 只能在 Routes 外使用',
        'id 是 undefined，要用 useLocation 解析 pathname 才能读到',
      ],
      answer: 1,
      explain:
        'URL 里的一切都是字符串，useParams 返回 { id: "2" }，而 "2" === 2 为 false。要写 Number(id) 再比较。读取方式本身没错，所以“id 是 undefined”不对；useParams 也正是在路由匹配到的组件里使用。',
    },
    {
      q: '父路由 <code>/</code> 渲染 Layout（导航栏），子路由 <code>users</code> 渲染 UserList。访问 /users 时只看到导航栏，没看到列表。最可能漏了什么？',
      options: ['Layout 里没有写 &lt;Outlet /&gt;', 'UserList 没有用 useParams', '子路由必须写成完整路径 /users', 'Layout 要把 children 渲染出来'],
      answer: 0,
      explain:
        '子路由的内容渲染在父布局的 &lt;Outlet /&gt; 位置。没有 Outlet，子路由匹配成功也无处显示。“渲染 children”是最有迷惑性的选项：React Router 不通过 children 把子路由交给布局，要用 Outlet。',
    },
    {
      q: '应用部署到静态服务器。在 /users/2 刷新后出现 404。原因是？',
      options: [
        '路由表里没有写 users/:id',
        '服务器没有把 /users/2 回退到 index.html',
        'useParams 在刷新后读不到 id，页面渲染失败',
        'BrowserRouter 只能在开发环境使用',
      ],
      answer: 1,
      explain:
        '刷新时，浏览器直接向服务器请求 /users/2。要配置服务器：所有路径都返回 index.html，再由 React Router 匹配。“路由表里没有写”不对：在站内点击链接能打开这个页面，说明路由表没问题，问题出在请求根本没到 React。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>不要修改“迷你路由库”和 <code>USERS</code>。它们的用法和 React Router 一致。</li><li>完成 <code>UserList</code>：每个用户渲染一个 <code>&lt;li className="user"&gt;</code>，里面用 <code>Link</code> 指向 <code>/users/用户id</code>。</li><li>完成 <code>UserDetail</code>：用 <code>useParams</code> 读出 <code>id</code>，在 <code>USERS</code> 中找到用户。显示 <code>#user-name</code>（名字）和 <code>#user-city</code>（城市）。</li><li>在详情页加一个按钮 <code>#back</code>。点击后用 <code>useNavigate</code> 跳到 <code>/users</code>。</li><li>找不到用户时（例如 <code>/users/99</code>），渲染 <code>&lt;NotFound /&gt;</code>。</li><li>在路由表中加三条路由：<code>/users</code>、<code>/users/:id</code> 和兜底的 <code>*</code>。</li><li>点导航里的每个链接，看地址栏和页面是否一致。</li></ol>',
    starter: `import { createContext, useContext, useState } from 'react';

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
      <nav style={{ margin: '8px 0' }}>
        <Link to="/">首页</Link>
        <Link to="/users">用户</Link>
        <Link to="/users/99">不存在的用户</Link>
        <Link to="/settings">设置（还没做）</Link>
      </nav>
      <Routes routes={[
        { path: '/', element: <Home /> },
        // 步骤 6：在这里加 /users、/users/:id 和 * 三条路由。注意顺序。
      ]} />
    </Router>
  );
}`,
    solution: `import { createContext, useContext, useState } from 'react';

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
      <nav style={{ margin: '8px 0' }}>
        <Link to="/">首页</Link>
        <Link to="/users">用户</Link>
        <Link to="/users/99">不存在的用户</Link>
        <Link to="/settings">设置（还没做）</Link>
      </nav>
      <Routes routes={[
        { path: '/', element: <Home /> },
        { path: '/users', element: <UserList /> },
        { path: '/users/:id', element: <UserDetail /> },
        { path: '*', element: <NotFound /> },
      ]} />
    </Router>
  );
}`,
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
    test: async t => {
      // 普通 <a href> 会让整个页面跳走。这里拦住浏览器的默认跳转，只看迷你路由有没有更新地址。
      const guard = e => {
        if (e.target.closest && e.target.closest('a')) e.preventDefault();
      };
      t.root.addEventListener('click', guard, true);
      try {
        const path = () => t.text('#address').replace('https://example.com', '');
        const go = async to => {
          const a = t.qa('nav a').find(x => x.getAttribute('href') === to);
          t.assert(a, '找不到导航链接 ' + to + '。不要修改 nav 里的链接');
          await t.click(a);
          await t.wait(30);
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
          await t.click(a);
          await t.wait(30);
          t.assert(path() === '/users/' + id, '点击“' + name + '”后，地址应是 /users/' + id + '，实际是 ' + path() + '。站内跳转要用 Link，不要用 <a href>');
          t.assert(
            t.text('#user-name') === name,
            '在 /users/' + id + '，#user-name 应显示“' + name + '”，实际是“' + t.text('#user-name') + '”。名字要按 useParams 的 id 查找（步骤 3）',
          );
          t.assert(t.text('#user-city') === city, '在 /users/' + id + '，#user-city 应显示“' + city + '”，实际是“' + t.text('#user-city') + '”');
          t.assert(!t.q('#not-found'), '用户存在时不应显示 #not-found');
          t.assert(t.q('#back'), '详情页应有返回按钮 #back（步骤 4）');
          await t.click('#back');
          await t.wait(30);
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
  },
  checkOnly: [
    {
      q: `路由这样配置。访问 <code>/users/2</code> 时，页面上看不到 UserDetail。最可能的原因是？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;Route path="/users" element={&lt;Users /&gt;}&gt;
  &lt;Route path=":id" element={&lt;UserDetail /&gt;} /&gt;
&lt;/Route&gt;</code></pre></div>`,
      options: [
        '路径应写成 "/users/:id"，嵌套路由不能用相对路径',
        'Users 组件里没有渲染 <Outlet />',
        'UserDetail 必须用 useParams 才会显示',
        '嵌套路由必须放在 <Link> 里',
      ],
      answer: 1,
      explain:
        '嵌套路由匹配后，父路由的组件先渲染。子路由的内容会显示在父组件中 <code>&lt;Outlet /&gt;</code> 的位置。Users 没有放 Outlet，子路由就没有地方显示。',
    },
    {
      q: `URL 是 <code>?page=2</code>。点击“下一页”后，URL 变成什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [params, setParams] = useSearchParams();
const page = params.get('page') ?? 1;

&lt;button onClick={() =&gt; setParams({ page: page + 1 })}&gt;
  下一页
&lt;/button&gt;</code></pre></div>`,
      options: ['?page=3', '?page=21', '?page=NaN', '?page=2，不变'],
      answer: 1,
      explain: "查询参数读出来永远是字符串。<code>'2' + 1</code> 是字符串拼接，结果是 '21'。读取后要先转成数字：<code>Number(params.get('page') ?? 1)</code>。",
    },
    {
      q: `用户已经登录，打开登录页。第一次渲染时会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (user) navigate('/home');
  return &lt;LoginForm /&gt;;
}</code></pre></div>`,
      options: ['立即跳转到 /home', '无限循环：每次渲染都跳转', '报错：navigate 是 undefined', '不跳转，并在控制台警告'],
      answer: 3,
      explain:
        'navigate 是一个副作用，不应在渲染时调用。React Router 在组件第一次渲染时会忽略这次调用，并警告“You should call navigate() in a React.useEffect()”。渲染时就要重定向，应返回 <code>&lt;Navigate to="/home" replace /&gt;</code>。“立即跳转”是最常见的预期，但渲染函数应该是纯函数，不能在里面改变 URL。',
    },
    {
      q: '路由是 <code>&lt;Route path="/users/:id" element={&lt;UserDetail /&gt;} /&gt;</code>。访问 <code>/users/2</code> 时，点击 UserDetail 里的这个链接，会去哪个地址？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;Link to="edit"&gt;编辑&lt;/Link&gt;</code></pre></div>',
      options: ['/users/2/edit', '/users/edit', '/edit', '/users/2edit'],
      answer: 0,
      explain:
        '不以 <code>/</code> 开头的路径是相对路径。React Router 把它解析为相对于<b>当前路由</b>的路径，这里是 /users/2，所以得到 /users/2/edit。想去根路径，写 <code>to="/edit"</code>；想去上一级，写 <code>to=".."</code>。“/users/edit”是按浏览器解析 <code>&lt;a href="edit"&gt;</code> 的规则推出来的：浏览器会替换最后一段，React Router 不会。',
    },
  ],
  plays: {
    '迷你路由（Link 和 Hook 的用法与 React Router 一致）': {
      note: '点“关于”看 404 兜底。<br>这是原理演示。真实项目从 <code>react-router</code> 导入，写法见上面的代码块。迷你版和真库有三点不同：1. 路由表用数组传入，不是 <code>&lt;Route&gt;</code> 子元素；2. 不支持嵌套路由和 <code>&lt;Outlet /&gt;</code>；3. 不同步浏览器地址栏，也不支持前进后退。',
    },
  },
} satisfies Lesson;
