import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/router.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'router',
  stage: 4,
  title: '路由：React Router',
  mins: 38,
  summary: '让单页应用拥有多个“页面”：路由表、动态参数、嵌套布局与跳转。',
  goals: [
    '能解释客户端路由的三步：URL 变化、路由库读 URL、渲染匹配的组件',
    '能写出路由表：静态路径、动态参数 <code>:id</code>、兜底 <code>*</code> 和带 <code>&lt;Outlet /&gt;</code> 的嵌套布局，并能说出 React Router 怎样在多条匹配里选一条',
    '能用 Link、useParams、useNavigate 完成“列表 → 详情 → 返回”的流程',
    '能判断哪些状态该放进 URL 的查询参数，并解释 <code>loader</code> 在导航中的时机：取到数据之前，页面停留在旧位置',
  ],
  keyPoints: [
    '问题：单页应用只有一个 HTML。路由库读取 URL，决定渲染哪个组件，浏览器不刷新。',
    '站内跳转用 <code>&lt;Link to&gt;</code>。普通 <code>&lt;a href&gt;</code> 会整页刷新，所有 state 丢失。',
    '动态段 <code>users/:id</code> 用 <code>useParams()</code> 读出；值是字符串，和数字比较前要转换。',
    '嵌套路由：父路由渲染公共布局，子路由的内容出现在 <code>&lt;Outlet /&gt;</code> 的位置。<code>loader</code> 在导航开始时运行，没返回之前页面停留在旧位置；嵌套路由的 loader 同时运行。',
    '最常见的坑：部署后在 <code>/users/2</code> 刷新得到 404。服务器要把所有路径都返回 index.html。',
  ],
  quiz: [
    {
      q: '同事在导航栏里写了 <code>&lt;a href="/cart"&gt;购物车&lt;/a&gt;</code>。用户在首页把 3 件商品加入了购物车（数量存在 Context 的 state 里），然后点这个链接。购物车页显示几件？',
      options: [
        '3 件：Context 在整个应用里共享',
        '0 件：a 标签让浏览器重新加载整个页面，应用从头启动，state 回到初始值',
        '3 件，因为 URL 变了但组件没有卸载',
        '0 件，但只是因为没有用 useNavigate',
      ],
      answer: 1,
      explain:
        '普通 a 标签会让浏览器重新加载整个页面，React 应用从头启动，state 全部回到初始值。&lt;Link&gt; 拦截点击，只改 URL 并重新渲染，所以 state 还在。“Context 在整个应用里共享”有迷惑性：Context 只在同一次页面加载的内存里共享，页面重新加载后它也从头开始。',
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
    <RouterCtx value={{ path, navigate: setPath }}>
      <div id="address" style={{ fontFamily: 'monospace', background: '#eef2f4', padding: '4px 8px', borderRadius: 6 }}>https://example.com{path}</div>
      {children}
    </RouterCtx>
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
    if (params) return <ParamsCtx value={params}>{r.element}</ParamsCtx>;
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
        // 步骤 6：在这里加 /users、/users/:id 和 * 三条路由。注意顺序：迷你版按顺序匹配（真的 React Router 会自动排名，不需要）。
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
    <RouterCtx value={{ path, navigate: setPath }}>
      <div id="address" style={{ fontFamily: 'monospace', background: '#eef2f4', padding: '4px 8px', borderRadius: 6 }}>https://example.com{path}</div>
      {children}
    </RouterCtx>
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
    if (params) return <ParamsCtx value={params}>{r.element}</ParamsCtx>;
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
        t.assert(!t.q('#not-found'), '在首页时不应显示 #not-found。检查 * 路由是不是放在了最前面（步骤 6；迷你路由按顺序匹配）');

        await go('/users');
        t.assert(path() === '/users', '点“用户”后地址应是 /users');
        t.assert(!t.q('#not-found'), '/users 页不应显示 #not-found。* 路由应放在最后（步骤 6；迷你路由按顺序匹配）');
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
        '不以 <code>/</code> 开头的路径是相对路径。React Router 把它解析为相对于<b>当前路由</b>的路径，这里是 /users/2，所以得到 /users/2/edit。想去根路径，写 <code>to="/edit"</code>。<code>to=".."</code> 回到<b>父路由</b>：它去掉的是当前路由的整段 path。这里路由是单层的 <code>/users/:id</code>，所以 <code>..</code> 去的是 <code>/</code>。只有把 <code>:id</code> 写成 <code>/users</code> 的子路由，<code>..</code> 才是 <code>/users</code>。想按 URL 去掉最后一段，写 <code>&lt;Link to=".." relative="path"&gt;</code>。“/users/edit”是按浏览器解析 <code>&lt;a href="edit"&gt;</code> 的规则推出来的：浏览器会替换最后一段，React Router 不会。',
    },
    {
      q: `路由表这样写，<code>*</code> 在最前面。用 React Router（不是本课的迷你版）访问 <code>/users/2</code>，渲染哪个组件？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;Routes&gt;
  &lt;Route path="*" element={&lt;NotFound /&gt;} /&gt;
  &lt;Route path="/users/:id" element={&lt;UserDetail /&gt;} /&gt;
&lt;/Routes&gt;</code></pre></div>`,
      options: ['NotFound：* 在最前面，先匹配', 'UserDetail', '两个都渲染', '报错：* 必须放在最后'],
      answer: 1,
      explain:
        'React Router 按“谁更具体”给路由排名：静态段优先于动态段，动态段优先于 <code>*</code>，和书写顺序无关。所以 /users/2 渲染 UserDetail。“* 先匹配”是迷你路由的行为（它按数组顺序取第一个），不是真库的行为。',
    },
    {
      q: `父路由 <code>/</code> 有 <code>loader</code>（耗时 1 秒），子路由 <code>/c</code> 也有 <code>loader</code>（耗时 1 秒）。用户直接打开 <code>/c</code>，两个 loader 都返回、页面完整显示，大约要多久？`,
      options: [
        '约 1 秒：父子路由的 loader 同时运行',
        '约 2 秒：先等父路由，再运行子路由的 loader',
        '约 1 秒，但子路由的数据会丢失',
        '约 0 秒：loader 不会阻塞页面',
      ],
      answer: 0,
      explain:
        'React Router 在导航开始时，把匹配到的每一层路由的 loader 一起启动，所以总时间约等于最慢的那一个。“约 2 秒”是用 useEffect 取数据时的情形：如果父组件在数据到达前不渲染 Outlet，子组件要等父组件的数据回来才挂载，请求才会排成队（这叫“瀑布”）。“约 0 秒”不对：loader 返回之前，路由不会切换到新页面。',
    },
    {
      q: `路由表如下。用户访问 <code>/</code>，页面上只有导航栏，中间是空白。最合适的修复是？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">{ path: '/', element: &lt;Layout /&gt;, children: [
  { path: 'users', element: &lt;Users /&gt; },
  { path: 'users/:id', element: &lt;UserDetail /&gt; },
] }</code></pre></div>`,
      options: [
        '给 children 加一条 index 路由：{ index: true, element: <Home /> }',
        '把 Layout 的 path 改成 "*"',
        '在 Layout 里用 useParams 读出当前页面',
        '把 users 改成 "/users"',
      ],
      answer: 0,
      explain:
        '访问 / 时，只有父路由匹配，没有任何子路由，所以 Layout 里的 Outlet 什么也不渲染。index 路由就是“父路径本身”的默认子页面。把 Layout 改成 "*" 会让它匹配所有路径，问题更多；useParams 只能读 URL 里的动态段；把 users 改成绝对路径对这个问题没有帮助。',
    },
  ],
  plays: {
    '迷你路由（Link 和 Hook 的用法与 React Router 一致）': {
      pkey: 'router|迷你路由（Link 和 Hook 的用法与 React Router 一致）',
      predict: {
        q: '路由表里有 /、/users、/users/:id 三条，没有 /about。运行后点导航里的“关于”，页面显示什么？',
        options: ['回到首页', '空白，什么都不渲染', '404：没有页面匹配 /about', '控制台报错，页面崩溃'],
        answer: 2,
        explain:
          '迷你 Routes 逐条匹配，一条都没匹配上时走最后的 return，显示“404：没有页面匹配 /about”。“空白”有迷惑性：练习里的 Routes 才是没匹配就返回 null，这里的写法多了一行兜底文字。',
      },
      note: '这是原理演示。真实项目从 <code>react-router</code> 导入，写法见上面的代码块。迷你版和真库有四点不同：1. 路由表用数组传入，不是 <code>&lt;Route&gt;</code> 子元素；2. 不支持嵌套路由和 <code>&lt;Outlet /&gt;</code>（下一个示例补上）；3. 不同步浏览器地址栏，也不支持前进后退；4. 迷你版按数组顺序取第一个匹配，所以 <code>*</code> 必须放最后。真库按“谁更具体”排名（静态段 &gt; 动态段 &gt; <code>*</code>），和书写顺序无关。',
    },
    '嵌套路由：Link 与普通 a 标签': {
      pkey: 'router|嵌套路由：Link 与普通 a 标签',
      predict: {
        q: '先点 3 次“布局里的计数器”，再点导航里的“用户”（Link），最后点“关于（普通 a 标签）”。计数器依次显示什么？',
        options: ['3，然后 3', '3，然后 0', '0，然后 0', '0，然后 3'],
        answer: 1,
        explain:
          '点 Link 时，只有路径变了：Layout 还在树上同一个位置，它的 state 保留，计数器仍是 3。普通 a 标签让浏览器请求新页面，整个应用从头启动，所有 state 回到初始值，计数器变成 0。这也是嵌套路由的好处：切换子页面时，父层的布局不会重新挂载。',
      },
      note: '迷你版用 <code>key</code> 让整个应用重新挂载，来模拟浏览器的整页加载。真库的 <code>Link</code> 拦截点击，调用浏览器的 history 接口改地址栏，不请求新页面。',
    },
    'loader：先取数据，还是先换页面': {
      pkey: 'router|loader：先取数据，还是先换页面',
      predict: {
        q: '点“用户 2（loader 版）”，等 300 毫秒（请求要 900 毫秒才返回）。此时地址栏和页面分别是什么？',
        options: [
          '地址栏是 /loader/users/2，页面显示“加载中…”',
          '地址栏是 /loader/users/2，页面仍是首页',
          '地址栏仍是 /，页面仍是首页',
          '地址栏仍是 /，页面显示“加载中…”',
        ],
        answer: 2,
        explain:
          'loader 在导航开始时运行，返回之前路由不更新位置，所以地址栏和页面都停留在旧位置，只有“导航状态”变成 loading。数据到手后，位置和页面一起切换，新页面一出现就有数据。再点“effect 版”对比：新页面马上出现，里面显示“加载中…”，数据由组件自己在 effect 里取。选哪种取决于你想让用户在等待时看到什么。',
      },
      note: '对比两种链接：loader 版先等数据，再一起切换；effect 版先切换页面，页面里再显示“加载中…”。真库里，旧页面上通常用 <code>useNavigation().state</code> 显示一个进度条。',
    },
  },
} satisfies Lesson;
