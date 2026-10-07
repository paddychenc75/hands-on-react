/* ========== 课程内容 · 第五阶段：生态与实战 ========== */

/* ---------- 26 ---------- */
lesson({
  id: 'typescript', stage: 4, title: 'TypeScript + React', mins: 22,
  summary: '给组件、状态、事件和 Hook 加上类型，让编辑器替你找 bug。',
  goals: [
    '能写出 props 的类型：必填、可选（?）和字面量联合类型',
    '能判断 useState 什么时候要手写类型（例如 User | null），并给事件和 ref 标注类型',
    '能读懂并写出一个泛型列表组件',
    '能指出 any 和“联合类型里混进 string”为什么让检查失效',
  ],
  keyPoints: [
    '问题：JavaScript 只在运行时出错。TypeScript 在你写代码时检查 props、字段名和 null，编辑器立即标红。',
    'props 用 <code>type</code> 或 <code>interface</code> 描述。<code>?</code> 表示可选，<code>\'a\' | \'b\'</code> 只允许这几个值。',
    '能推断就不手写。初始值说明不了全部类型时才写，例如 <code>useState&lt;User | null&gt;(null)</code>。',
    '最常见的坑：写 <code>any</code>，或在联合类型里加 <code>| string</code>。代码照样能运行，但类型检查已经失效。',
    '本课程的运行环境只去掉类型、不检查类型。真正的报错要在编辑器或 <code>tsc</code> 里看。',
  ],
  body: [
    p('在实际工作中，绝大多数 React 项目都使用 TypeScript。TypeScript 不改变 React 的用法。它在你写代码时检查错误。传错 prop、拼错字段名、忘记处理 null，编辑器都会立即标红。你不必等到用户发现 bug。'),
    tip('本课的代码框支持 TypeScript 语法，可以直接运行。不过这里只会<b>去掉类型</b>后执行，并不做类型检查。真正的类型报错要在 VS Code 等编辑器或 <code>tsc</code> 里才能看到。'),
    h('给 props 写类型'),
    p('最常用的做法是用 <code>type</code> 或 <code>interface</code> 描述 props 的形状。<code>?</code> 表示可选，<code>\'a\' | \'b\'</code> 是联合类型，只允许这几个值。'),
    play(`
type ButtonProps = {
  label: string;
  variant?: 'primary' | 'ghost';   // 只能是这两个值之一
  count?: number;
  onClick?: () => void;
};

function Button({ label, variant = 'primary', count, onClick }: ButtonProps) {
  const style = variant === 'primary'
    ? { background: '#087ea4', color: '#fff', border: 0 }
    : { background: 'transparent', color: '#087ea4', border: '1px solid #087ea4' };
  return (
    <button style={{ ...style, padding: '6px 12px', borderRadius: 6 }} onClick={onClick}>
      {label}{count !== undefined && \` (\${count})\`}
    </button>
  );
}

function App() {
  return (
    <div>
      <Button label="保存" onClick={() => console.log('保存')} />
      <Button label="消息" variant="ghost" count={3} />
      {/* <Button label="错误" variant="danger" />  ← 在编辑器里这里会被标红 */}
    </div>
  );
}`, '带类型的 Button'),
    h('children 与原生属性'),
    code(`type CardProps = {
  title: string;
  children: React.ReactNode;        // 任何可渲染的内容：元素、字符串、数组、null
};

// 继承原生 <button> 的全部属性（type、disabled、aria-*、onClick……）
type IconButtonProps = React.ComponentProps<'button'> & {
  icon: string;
};
function IconButton({ icon, children, ...rest }: IconButtonProps) {
  return <button {...rest}>{icon} {children}</button>;
}`),
    h('State、事件与 ref'),
    p('大多数时候 TypeScript 能<b>自动推断</b>类型，比如 <code>useState(0)</code> 就是 number。只有初始值不能说明全部类型时，才需要手写。最常见的情况是：开始是 null，以后会有值。'),
    code(`type User = { id: number; name: string };

const [count, setCount] = useState(0);                 // 推断为 number
const [user, setUser] = useState<User | null>(null);   // 需要手动标注
const inputRef = useRef<HTMLInputElement>(null);

function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  setName(e.target.value);
}
function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) { // 旧版 @types/react 写作 React.FormEvent
  e.preventDefault();
}

// 使用可能为 null 的值时，TypeScript 会强迫你先判断
return <p>{user ? user.name : '未登录'}</p>;`, '常用类型速查'),
    warn('不要到处写 <code>any</code>。<code>any</code> 等于关掉了类型检查，TypeScript 的好处也就没了。实在不确定类型时用 <code>unknown</code>，它会强迫你先判断再使用。'),
    h('泛型组件：一个列表组件，适配任何数据'),
    play(`
type ListProps<T> = {
  items: T[];
  getKey: (item: T) => string | number;
  renderItem: (item: T) => React.ReactNode;
};

function List<T>({ items, getKey, renderItem }: ListProps<T>) {
  return <ul>{items.map(item => <li key={getKey(item)}>{renderItem(item)}</li>)}</ul>;
}

type Book = { isbn: string; title: string; price: number };
const books: Book[] = [
  { isbn: '001', title: '深入浅出 React', price: 79 },
  { isbn: '002', title: 'TypeScript 编程', price: 99 },
];

function App() {
  return (
    <List
      items={books}
      getKey={b => b.isbn}
      renderItem={b => <span>{b.title} · ¥{b.price}</span>}  // b 自动推断为 Book
    />
  );
}`, '泛型组件', '在编辑器中，把鼠标放到 renderItem 的参数 b 上。你会看到它的类型是 Book。'),
    deep('给自定义 Hook 加类型时，返回元组记得写 <code>as const</code>：<code>return [on, toggle] as const;</code>。否则 TypeScript 会把它推断成 <code>(boolean | (() =&gt; void))[]</code> 这种混合数组，使用时失去精确类型。'),
    h('可辨识联合：让矛盾的状态写不出来'),
    code(`type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: string[] }
  | { status: 'error'; error: Error };

function show(s: SearchState) {
  if (s.status === 'success') return s.data.join('、');  // 这里才允许访问 data
  // if (s.status === 'loading') s.data  ← 编译报错：loading 状态没有 data
  return s.status;
}`, '第 17 课的搜索状态、第 18 课的 action 都可以这样写'),
  ],
  quiz: [
    { q: 'const [user, setUser] = useState(null) 之后想存入用户对象，应该怎么写类型？', options: ['useState<any>(null)', 'useState<User | null>(null)', 'useState<User>(null)', '不用写，TypeScript 会从后面的 setUser 调用推断'], answer: 1, explain: 'TypeScript 只看初始值。初始值 null 推断不出以后会存 User，所以要写出联合类型 User | null。最有迷惑性的是 <code>useState&lt;User&gt;(null)</code>：严格模式下 null 不能赋给 User，会报错；它也隐瞒了“可能还没有用户”这件事。any 能通过编译，但关掉了检查。' },
    { q: 'Card 的 children 有时是一段文字，有时是 <code>&lt;img&gt;</code>，有时是 null。children 的类型写哪个？', options: ['string', 'JSX.Element', 'React.ReactNode', 'React.ReactElement[]'], answer: 2, explain: 'ReactNode 包括元素、字符串、数字、数组、null 等所有可渲染的内容。最常见的误解是 JSX.Element：它只表示一个 JSX 元素，传入文字或 null 都会报错。string 不接受元素，ReactElement[] 不接受单个元素和文字。' },
    { q: '类型是 <code>variant?: \'primary\' | \'ghost\'</code>。下面哪个用法会被编辑器标红？', options: ['&lt;Button label="确定" /&gt;', '&lt;Button label="确定" variant="ghost" /&gt;', '&lt;Button label="确定" variant="danger" /&gt;', '&lt;Button label="确定" variant={undefined} /&gt;'], answer: 2, explain: '联合类型只允许列出的值，"danger" 不在其中。? 表示可选，所以不传、或传 undefined 都可以。很多人以为“可选”就是“随便传什么都行”，其实可选只放宽了“传不传”，没有放宽“传什么”。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>定义 <code>BadgeProps</code> 类型：<code>label: string</code>；可选的 <code>tone?: \'info\' | \'success\'</code>。</li><li>在 <code>Badge</code> 的参数上标注 <code>: BadgeProps</code>。tone 的默认值为 <code>\'info\'</code>。</li><li>渲染 <code>&lt;span className={\'badge \' + tone}&gt;{label}&lt;/span&gt;</code>。App 已经写好。</li></ol>',
    starter: `// 在这里定义 BadgeProps

function Badge(props) {
  return <span>?</span>;
}

function App() {
  return (
    <p>
      <Badge label="新功能" />
      <Badge label="已上线" tone="success" />
    </p>
  );
}`,
    solution: `type BadgeProps = {
  label: string;
  tone?: 'info' | 'success';
};

function Badge({ label, tone = 'info' }: BadgeProps) {
  return <span className={'badge ' + tone}>{label}</span>;
}

function App() {
  return (
    <p>
      <Badge label="新功能" />
      <Badge label="已上线" tone="success" />
    </p>
  );
}`,
    hint: '先写类型，再用它：<code>type BadgeProps = { … }</code> 里有两个字段，哪个字段名后面要加 <code>?</code>？联合类型用 <code>|</code> 连接两个字符串字面量。然后在参数解构后面写 <code>: BadgeProps</code>，并给 tone 一个默认值。',
    faded: `type BadgeProps = {
  /* ✏️ label：必填，类型是字符串 */
  /* ✏️ tone：可选（用 ?），只能是 'info' 或 'success' 两个字面量之一 */
};

function Badge(/* ✏️ 解构 label 和 tone（默认 'info'），并标注类型 BadgeProps */) {
  return <span className={'badge ' + tone}>{label}</span>;
}

function App() {
  return (
    <p>
      <Badge label="新功能" />
      <Badge label="已上线" tone="success" />
    </p>
  );
}`,
    test: async (t) => {
      // 本课程的运行环境不做类型检查，所以这里读语法树，检查类型本身写得对不对
      let ast;
      try {
        ast = Babel.transform(t.source, { filename: 'App.tsx', ast: true, code: false, configFile: false, babelrc: false, parserOpts: { plugins: ['typescript', 'jsx'] } }).ast;
      } catch (e) { t.assert(false, '代码无法解析：' + e.message); }
      const decls = {};
      const funcs = {};
      for (let n of ast.program.body) {
        if (/^Export/.test(n.type) && n.declaration) n = n.declaration;
        if (n.type === 'TSTypeAliasDeclaration') decls[n.id.name] = n.typeAnnotation;
        if (n.type === 'TSInterfaceDeclaration') decls[n.id.name] = { type: 'TSTypeLiteral', members: n.body.body };
        if (n.type === 'FunctionDeclaration' && n.id) funcs[n.id.name] = n;
        if (n.type === 'VariableDeclaration') n.declarations.forEach(d => { if (d.id.name) funcs[d.id.name] = d; });
      }
      // 把 type Tone = … 这样的别名展开，最多展开 5 层
      const resolve = (x, k = 0) => {
        while (x && x.type === 'TSParenthesizedType') x = x.typeAnnotation;
        if (x && x.type === 'TSTypeReference' && x.typeName.type === 'Identifier' && decls[x.typeName.name] && k < 5) return resolve(decls[x.typeName.name], k + 1);
        // Readonly<{ … }> 只让字段只读，不改变字段本身，取出里面的类型继续检查
        const tp = x && x.type === 'TSTypeReference' && (x.typeParameters || x.typeArguments);
        const tn = x && x.type === 'TSTypeReference' && (x.typeName.name || (x.typeName.right && x.typeName.right.name));
        if (tp && tn === 'Readonly' && tp.params.length === 1 && k < 5) return resolve(tp.params[0], k + 1);
        return x;
      };
      const srcOf = (x) => t.source.slice(x.start, x.end).replace(/\s+/g, ' ');
      t.assert(decls.BadgeProps, '请定义 BadgeProps 类型：type BadgeProps = { … } 或 interface BadgeProps { … }（步骤 1）');
      const shape = resolve(decls.BadgeProps);
      t.assert(shape && shape.type === 'TSTypeLiteral', 'BadgeProps 应该是一个对象类型，写成 { label: …; tone?: … }（步骤 1）');
      const member = (name) => shape.members.find(m => m.type === 'TSPropertySignature' && (m.key.name === name || m.key.value === name));
      const label = member('label');
      t.assert(label && label.typeAnnotation, 'BadgeProps 里缺少 label 字段，或者它没有写类型（步骤 1）');
      const lt = resolve(label.typeAnnotation.typeAnnotation);
      t.assert(lt.type !== 'TSAnyKeyword' && lt.type !== 'TSUnknownKeyword', 'label 的类型写成了 ' + srcOf(label.typeAnnotation.typeAnnotation) + '。any 等于关掉了检查：传数字、传对象都不会报错。请写成 string');
      t.assert(lt.type === 'TSStringKeyword', 'label 的类型应为 string，现在是 ' + srcOf(label.typeAnnotation.typeAnnotation) + '（步骤 1）');
      t.assert(!label.optional, 'label 是必填的，不要加 ?。每个 Badge 都必须有文字');
      const tone = member('tone');
      t.assert(tone && tone.typeAnnotation, 'BadgeProps 里缺少 tone 字段，或者它没有写类型（步骤 1）');
      t.assert(tone.optional, 'tone 应该是可选的：写成 tone?:。第一个 Badge 没有传 tone，不加 ? 编辑器会报错');
      const tt = resolve(tone.typeAnnotation.typeAnnotation);
      // 可选属性本来就可能是 undefined，所以 | undefined 不算多出来的值
      const parts = (tt.type === 'TSUnionType' ? tt.types.map(x => resolve(x)) : [tt]).filter(x => x.type !== 'TSUndefinedKeyword');
      const bad = parts.find(x => !(x.type === 'TSLiteralType' && x.literal.type === 'StringLiteral'));
      t.assert(!bad || (bad.type !== 'TSStringKeyword' && bad.type !== 'TSAnyKeyword'),
        'tone 的类型里有 ' + (bad && srcOf(bad)) + '，它允许任意字符串，联合类型就失去了作用：tone="danger" 也不会报错。只保留 \'info\' | \'success\'');
      const lits = bad ? '' : parts.map(x => x.literal.value).sort().join();
      t.assert(lits === 'info,success', 'tone 的类型应只允许 \'info\' 和 \'success\' 两个值，现在是 ' + srcOf(tone.typeAnnotation.typeAnnotation) + '（步骤 1）');
      const fn = funcs.Badge;
      t.assert(fn, '找不到 Badge 组件。不要改它的名字');
      const f = fn.type === 'VariableDeclarator' ? fn.init : fn;
      const annos = [fn.id && fn.id.typeAnnotation, f && f.params && f.params[0] && f.params[0].typeAnnotation].filter(Boolean);
      t.assert(annos.some(a => /\bBadgeProps\b/.test(srcOf(a))), '请在 Badge 的参数上标注类型：function Badge({ label, tone = \'info\' }: BadgeProps)（步骤 2）');
      const b = t.qa('span.badge');
      t.assert(b.length === 2, `应渲染 2 个 className 含 badge 的 span，实际 ${b.length} 个`);
      t.assert(b[0].classList.contains('info') && b[0].textContent === '新功能', '第一个 Badge 应为 info 样式，文字“新功能”（tone 默认值是 info）');
      t.assert(b[1].classList.contains('success') && b[1].textContent === '已上线', '第二个 Badge 应为 success 样式，文字“已上线”');
    }
  }
});

/* ---------- 27 ---------- */
lesson({
  id: 'router', stage: 4, title: '路由：React Router', mins: 28,
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
  body: [
    p('React 本身只负责渲染界面，并不知道“页面”是什么。在单页应用（SPA）里，切换页面分三步：'),
    p('<ol class="task-steps"><li>URL 变化。</li><li>路由库读取 URL。</li><li>路由库决定渲染哪个组件。</li></ol>'),
    p('整个过程中浏览器不刷新。React Router 是最常用的路由库。'),
    h('核心 API'),
    code(`import { BrowserRouter, Routes, Route, Link, Outlet, useParams, useNavigate } from 'react-router';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>          {/* 父路由：公共布局 */}
          <Route index element={<Home />} />           {/* 访问 / 时 */}
          <Route path="users" element={<UserList />} />
          <Route path="users/:id" element={<UserDetail />} />  {/* 动态参数 */}
          <Route path="*" element={<NotFound />} />    {/* 兜底 404 */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  return (
    <>
      <nav><Link to="/">首页</Link> <Link to="/users">用户</Link></nav>
      <Outlet />   {/* 子路由渲染在这里 */}
    </>
  );
}

function UserDetail() {
  const { id } = useParams();          // 读取 URL 中的 :id
  const navigate = useNavigate();      // 用代码跳转
  return <button onClick={() => navigate('/users')}>返回列表（当前 {id}）</button>;
}`, 'React Router 的标准写法'),
    warn('站内跳转要用 <code>&lt;Link to="..."&gt;</code>，不要用 <code>&lt;a href="..."&gt;</code>。普通链接会让浏览器整页刷新，所有 state 都会丢失。'),
    h('自己动手：一个 40 行的迷你路由'),
    p('本页的沙箱不能加载 React Router。所以我们用学过的 Context 和 state 写一个<b>迷你版</b>。<code>Link</code>、<code>useParams</code>、<code>useNavigate</code> 的用法和 React Router 一致。路由表用数组传入，写法类似 <code>createBrowserRouter</code>，也不支持嵌套路由。理解了它，你就理解了路由库的工作原理。'),
    play(`
import { createContext, useContext, useState } from 'react';

// ===== 迷你路由库 =====
const RouterCtx = createContext(null);
const ParamsCtx = createContext({});

function Router({ children }) {
  const [path, setPath] = useState('/');   // 真实的库会读写 window.location
  return <RouterCtx.Provider value={{ path, navigate: setPath }}>{children}</RouterCtx.Provider>;
}

// 把 '/users/:id' 和 '/users/42' 匹配，得到 { id: '42' }
function matchPath(pattern, path) {
  const a = pattern.split('/').filter(Boolean), b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

function Routes({ routes }) {
  const { path } = useContext(RouterCtx);
  for (const r of routes) {
    const params = matchPath(r.path, path);
    if (params) return <ParamsCtx.Provider value={params}>{r.element}</ParamsCtx.Provider>;
  }
  return <p>404：没有页面匹配 {path}</p>;
}

// 注意：这个迷你 Link 会加粗当前页，方便观察。
// 真实的 React Router 里，Link 不加样式；高亮当前页要用 NavLink。
function Link({ to, children }) {
  const { path, navigate } = useContext(RouterCtx);
  return <a href={to} onClick={e => { e.preventDefault(); navigate(to); }}
    style={{ marginRight: 10, fontWeight: path === to ? 700 : 400 }}>{children}</a>;
}
const useParams = () => useContext(ParamsCtx);
const useNavigate = () => useContext(RouterCtx).navigate;
const useLocation = () => ({ pathname: useContext(RouterCtx).path });

// ===== 应用代码 =====
const USERS = [{ id: '1', name: '张三' }, { id: '2', name: '李四' }];

function Home() { return <h3>🏠 首页</h3>; }
function UserList() {
  return <ul>{USERS.map(u => <li key={u.id}><Link to={'/users/' + u.id}>{u.name}</Link></li>)}</ul>;
}
function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = USERS.find(u => u.id === id);
  return (
    <div>
      <h3>👤 {user ? user.name : '未知用户'}（id = {id}）</h3>
      <button onClick={() => navigate('/users')}>← 返回列表</button>
    </div>
  );
}

function AddressBar() {
  const { pathname } = useLocation();
  return <div style={{ fontFamily: 'monospace', background: '#eef2f4', padding: '4px 8px', borderRadius: 6 }}>https://example.com{pathname}</div>;
}

function App() {
  return (
    <Router>
      <AddressBar />
      <nav style={{ margin: '8px 0' }}>
        <Link to="/">首页</Link><Link to="/users">用户</Link><Link to="/about">关于</Link>
      </nav>
      <Routes routes={[
        { path: '/', element: <Home /> },
        { path: '/users', element: <UserList /> },
        { path: '/users/:id', element: <UserDetail /> },
      ]} />
    </Router>
  );
}`, '迷你路由（Link 和 Hook 的用法与 React Router 一致）', '点“关于”看 404 兜底。<br>这是原理演示。真实项目从 <code>react-router</code> 导入，写法见上面的代码块。迷你版和真库有三点不同：1. 路由表用数组传入，不是 <code>&lt;Route&gt;</code> 子元素；2. 不支持嵌套路由和 <code>&lt;Outlet /&gt;</code>；3. 不同步浏览器地址栏，也不支持前进后退。'),
    h('URL 也是状态'),
    p('搜索词、页码、筛选条件最适合放在 URL 的查询参数里。这样用户刷新页面不会丢失，复制链接发给别人能看到同样的结果。'),
    code(`import { useSearchParams } from 'react-router';

function ProductList() {
  const [params, setParams] = useSearchParams();   // 用法和 useState 很像
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? 1);
  // URL: /products?q=键盘&page=2&sort=price
  return <input value={q} onChange={e => setParams(prev => {
    prev.set('q', e.target.value);   // 只改 q 和 page，保留 sort 等其他参数
    prev.set('page', '1');
    return prev;
  }, { replace: true })} />;          // 替换当前历史记录，不新增
}`),
    tip('输入框这类高频更新，用 <code>{ replace: true }</code>。否则每输入一个字就多一条历史记录，用户要按很多次“后退”。翻页这类用户想后退的操作，用默认的 push。'),
    h('选哪种模式？'),
    table(['情况', '模式'], [
      ['已有的纯客户端应用', '声明式（<code>&lt;BrowserRouter&gt;</code>）'],
      ['要在进入页面前取数据，或要显示待定状态', '数据模式（<code>createBrowserRouter</code>）'],
      ['新项目，需要服务端渲染', '框架模式（react.dev 推荐从框架开始）'],
    ]),
    p('版本说明：从 v7 起，原 Remix v2 的能力并入了 React Router 的“框架模式”。v8 起统一从 <code>react-router</code> 包导入，不再使用 <code>react-router-dom</code>。网上的旧教程常写 <code>react-router-dom</code>，用法基本相同。'),
    h('上线前必遇的三件事'),
    code(`// 1. 受保护路由：未登录时跳到登录页
function RequireAuth({ children }) {
  const user = useUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// 2. 路由级代码分割：进入详情页时才下载它的代码
const UserDetail = lazy(() => import('./UserDetail'));
// 在布局里：<Suspense fallback={<p>加载中…</p>}><Outlet /></Suspense>`),
    warn('第 3 件事（上面的代码写了前两件）：部署 SPA 时，服务器要把所有路径都返回 <code>index.html</code>。Vercel 用 rewrites，Netlify 用 <code>_redirects</code>。否则在 <code>/users/2</code> 刷新或直接打开链接，会得到 404。'),
    deep('React Router 的数据模式（<code>createBrowserRouter</code>）和框架模式还提供两个功能。<code>loader</code> 在进入页面前加载数据。路由 <code>action</code> 处理表单提交。本课用的 <code>&lt;BrowserRouter&gt;</code> 属于声明式模式，不支持这两个功能。这和第 29 课的 Server Components、Server Functions 思路相同。<b>数据跟着路由加载</b>，不在组件里用 effect 请求。'),
  ],
  quiz: [
    { q: '同事在导航栏里写了 <code>&lt;a href="/cart"&gt;购物车&lt;/a&gt;</code>。用户在首页填了一半表单，点这个链接再点“后退”。表单里的内容会怎样？', options: ['还在：React Router 会把每个页面的 state 自动保存在历史记录里', '没了：a 标签让浏览器整页刷新，所有 state 都被丢弃', '还在，因为 URL 变回了首页', '没了，但只是因为没有用 useNavigate'], answer: 1, explain: '普通 a 标签会让浏览器重新加载整个页面，React 应用从头启动，state 全部丢失。&lt;Link&gt; 拦截点击，只改 URL 并重新渲染。“URL 变回了首页”有迷惑性：URL 相同不代表 state 还在，state 只存在于这一次页面加载的内存里。' },
    { q: '路由是 <code>users/:id</code>，当前 URL 是 <code>/users/2</code>。组件里写 <code>const { id } = useParams(); const user = USERS.find(u =&gt; u.id === id);</code>，USERS 里的 id 是数字。结果是？', options: ['找到 id 为 2 的用户', 'undefined：id 是字符串 "2"，不全等于数字 2', '报错：useParams 只能在 Routes 外使用', 'id 是 undefined，要用 useLocation 解析 pathname 才能读到'], answer: 1, explain: 'URL 里的一切都是字符串，useParams 返回 { id: "2" }，而 "2" === 2 为 false。要写 Number(id) 再比较。读取方式本身没错，所以“id 是 undefined”不对；useParams 也正是在路由匹配到的组件里使用。' },
    { q: '父路由 <code>/</code> 渲染 Layout（导航栏），子路由 <code>users</code> 渲染 UserList。访问 /users 时只看到导航栏，没看到列表。最可能漏了什么？', options: ['Layout 里没有写 &lt;Outlet /&gt;', 'UserList 没有用 useParams', '子路由必须写成完整路径 /users', 'Layout 要把 children 渲染出来'], answer: 0, explain: '子路由的内容渲染在父布局的 &lt;Outlet /&gt; 位置。没有 Outlet，子路由匹配成功也无处显示。“渲染 children”是最有迷惑性的选项：React Router 不通过 children 把子路由交给布局，要用 Outlet。' },
    { q: '应用部署到静态服务器。在 /users/2 刷新后出现 404。原因是？', options: ['路由表里没有写 users/:id', '服务器没有把 /users/2 回退到 index.html', 'useParams 在刷新后读不到 id，页面渲染失败', 'BrowserRouter 只能在开发环境使用'], answer: 1, explain: '刷新时，浏览器直接向服务器请求 /users/2。要配置服务器：所有路径都返回 index.html，再由 React Router 匹配。“路由表里没有写”不对：在站内点击链接能打开这个页面，说明路由表没问题，问题出在请求根本没到 React。' },
  ],
});

/* ---------- 28 ---------- */
lesson({
  id: 'tanstack-query', stage: 4, title: '数据请求：TanStack Query', mins: 26,
  summary: '把“服务端状态”交给专业工具：缓存、去重、后台刷新、乐观更新。',
  goals: [
    '能列出 useEffect 手写请求没有解决的三个问题：重复请求、没有缓存、数据过期',
    '能写出 useQuery：queryKey 包含查询用到的每个变量，并按加载中、出错、成功渲染',
    '能预测 staleTime 不同时，切回页面会不会发请求',
    '能用 useMutation 加 invalidateQueries，在修改数据后刷新列表',
  ],
  keyPoints: [
    '问题：服务端数据需要缓存、去重、过期刷新和重试。用 useEffect 手写，每个组件都要重复这些代码。',
    '<code>queryKey</code> 是缓存的名字。queryFn 用到的每个变量都要写进 key，例如 <code>[\'user\', id]</code>。',
    '<code>staleTime</code> 内数据算新鲜，直接用缓存。过期后先显示缓存，再在后台刷新。',
    '修改数据用 <code>useMutation</code>，成功后用 <code>invalidateQueries</code> 让相关缓存失效，列表自动重新获取。',
    '最常见的坑：key 里漏了变量（切换 id 读到别人的缓存）；queryFn 里 fetch 失败不抛错（isError 永远是 false）。',
  ],
  body: [
    p('第 14 课我们用 useEffect 请求数据。那时要自己处理 loading、error 和竞态。真实应用还会遇到更多问题：'),
    ul(['两个组件请求同一个接口，发了两次请求', '切走再切回页面，又要重新等待加载', '数据在别处被修改了，这里显示的还是旧的', '请求失败要不要自动重试？窗口重新获得焦点时要不要刷新？']),
    p('这些都属于<b>服务端状态</b>的管理问题。TanStack Query（原名 React Query）解决了这些问题。它是目前最流行的方案。'),
    h('useQuery：读取数据'),
    code(`import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Todos />
    </QueryClientProvider>
  );
}

// fetch 遇到 404/500 不会自己抛错，所以要检查 res.ok
async function getJSON(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error('请求失败：' + res.status);
  return res.json();
}

function Todos() {
  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: ['todos'],                  // 缓存的“名字”
    queryFn: () => getJSON('/api/todos'), // 失败时必须抛错，isError 才会为 true
    staleTime: 60_000,                    // 1 分钟内认为数据是新鲜的
  });

  if (isPending) return <p>加载中…</p>;
  if (isError) return <p>出错了：{error.message}</p>;
  return <ul>{data.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
}`, '和第 14 课的手写版本对比一下'),
    h('queryKey：缓存的身份证'),
    p('<code>queryKey</code> 决定数据存在缓存的哪个位置。<b>查询依赖的所有变量都要写进 key</b>，比如 <code>[\'user\', userId]</code>。userId 变了，key 就变了，会自动请求新数据；切回之前的 userId 时，页面立刻显示缓存。同时，它在后台检查是否需要更新。'),
    h('自己动手：迷你 useQuery'),
    p('本页的沙箱不能加载 TanStack Query。下面用 <code>useSyncExternalStore</code> 实现一个带缓存的迷你 useQuery。这是原理演示，真实项目的写法见上面的代码块。'),
    p('注意 effect 的依赖数组只写了 <code>key</code>，没写 <code>queryFn</code>。这看起来违反了第 14 课“依赖数组不要撒谎”。原因是：依赖规则没有消失，它<b>搬到了 queryKey 上</b>。queryFn 用到的每个变量都必须写进 queryKey。所以 key 不变时，新的 queryFn 和旧的请求同一份数据，不需要重新请求。反过来，queryFn 每次渲染都是新函数，写进依赖会让 effect 每次渲染都重新执行。真实的 TanStack Query 也是这样：只有 queryKey 变化才重新请求。'),
    play(`
import { useSyncExternalStore, useEffect, useState } from 'react';

// ===== 迷你 Query 缓存 =====
const cache = new Map();      // key -> { data, updatedAt, fetching, promise }
const listeners = new Set();
const notify = () => listeners.forEach(l => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

function fetchQuery(key, fn) {
  const entry = cache.get(key) || {};
  if (entry.promise) return entry.promise;                  // ① 这个 key 已有 promise 时
  const promise = fn().then(
    data => { cache.set(key, { data, updatedAt: Date.now() }); notify(); },
    // 失败：记下错误，清掉 promise。下次需要时可以重新请求
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
  }, [key]); // 只写 key：queryFn 用到的变量都已在 key 里（见正文）
  return {
    data: entry && entry.data,
    isPending: !entry || (entry.data === undefined && !entry.error),
    isFetching: !!(entry && entry.fetching),
    isError: !!(entry && entry.error),
    error: entry && entry.error,
  };
}

// ===== 模拟后端 =====
let calls = 0;
const api = (id) => new Promise(r => setTimeout(() => {
  calls++;
  console.log('🌐 发出请求：用户 ' + id + '（累计 ' + calls + ' 次）');
  r({ id, name: ['张三', '李四', '王五'][id - 1], at: new Date().toLocaleTimeString('zh-CN') });
}, 900));

// ===== 应用 =====
function User({ id }) {
  const { data, isPending, isFetching, isError, error } = useQuery({ queryKey: ['user', id], queryFn: () => api(id), staleTime: 5000 });
  if (isPending) return <p>⏳ 首次加载中…</p>;
  if (isError && !data) return <p>❌ 出错了：{error.message}</p>;
  return <p>👤 {data.name}，数据获取于 {data.at} {isFetching && <small>（后台刷新中…）</small>}</p>;
}

function App() {
  const [id, setId] = useState(1);
  return (
    <div>
      {[1, 2, 3].map(n => <button key={n} onClick={() => setId(n)} disabled={n === id}>用户 {n}</button>)}
      <User id={id} />
      <User id={id} />
      <p style={{ color: 'gray', fontSize: 13 }}>两个 User 组件，同一个 id。</p>
    </div>
  );
}`, '迷你 useQuery', '对照控制台里的请求次数来观察：<ol class="task-steps"><li>两个组件请求同一数据，只发一次请求。第二个组件在 ① 处直接拿到进行中的 promise，这叫<b>请求去重</b>。</li><li>切回 5 秒内看过的用户，立刻显示，不发请求。</li><li>超过 5 秒再切回，先显示旧数据，同时在后台刷新。</li></ol>'),
    h('useMutation：修改数据'),
    code(`import { useMutation, useQueryClient } from '@tanstack/react-query';

function AddTodo() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (title) => getJSON('/api/todos', {   // getJSON 见上一个示例
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }),
    onSuccess: () => {
      // 让 ['todos'] 缓存失效 → 所有用到它的组件自动重新获取
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return (
    <button disabled={mutation.isPending} onClick={() => mutation.mutate('新任务')}>
      {mutation.isPending ? '保存中…' : '添加'}
    </button>
  );
}`, '修改后让相关缓存失效，是最简单可靠的同步方式'),
    tip('分工规则：<b>服务端数据交给 TanStack Query；纯客户端 state 交给 useState 或 Zustand</b>。很多项目引入它之后，Redux 里的大部分代码都可以删掉了。'),
    h('乐观更新：先改界面，失败再回滚'),
    p('步骤如下：'),
    p('<ol class="task-steps"><li>在 <code>onMutate</code> 中取消进行中的请求，保存旧数据，再用 <code>setQueryData</code> 写入新数据。</li><li><code>onMutate</code> 返回旧数据。</li><li>在 <code>onError</code> 中把旧数据写回去，并提示用户。</li><li>在 <code>onSettled</code> 中调用 <code>invalidateQueries</code>，和服务器对齐。</li></ol>'),
    code(`useMutation({
  mutationFn: addTodo,
  onMutate: async (title) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const prev = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], old => [...(old ?? []), { id: 'temp', title }]);
    return { prev };                                 // 会作为 onError 的第 3 个参数
  },
  onError: (err, title, result) => queryClient.setQueryData(['todos'], result?.prev),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
});`, 'React 19 的 useOptimistic 是另一种写法（第 28 课）'),
    h('常见坑'),
    table(['现象或需求', '做法'], [
      ['接口失败后，约 7 秒才显示错误', '默认会重试 3 次，间隔 1、2、4 秒。测试里要设 <code>retry: false</code>'],
      ['key 到处手写，容易拼错', '用 key 工厂集中定义：<code>userKeys = { all: [\'users\'], detail: id =&gt; [\'users\', id] }</code>。<code>invalidateQueries({ queryKey: userKeys.all })</code> 能一次让所有用户缓存失效'],
      ['翻页或搜索时，界面闪回“加载中”', '<code>placeholderData: keepPreviousData</code>：换 key 时先显示上一页数据'],
      ['要等前一个数据到了再请求', '<code>enabled: !!userId</code>'],
      ['只请求一次、不需要缓存；或数据已在服务端组件、loader 里取好', '不必引入 Query'],
    ]),
    deep('在 Next.js App Router 中，很多数据可以在服务端组件里直接 <code>await</code>。这时不需要 useQuery。TanStack Query 适合客户端频繁交互的数据。例如无限滚动、轮询和乐观更新。两者可以搭配使用。'),
  ],
  quiz: [
    { q: 'useQuery({ queryKey: [\'user\'], queryFn: () => getUser(id) }) 有什么问题？', options: ['没有问题：id 变了 queryFn 也会跟着变，自动请求新用户', 'key 里没有 id，切换后读到上一个用户的缓存', 'queryFn 必须写成 async 函数', '读取数据应该用 useMutation'], answer: 1, explain: '缓存按 queryKey 存取。key 一直是 [\'user\']，切到新 id 时，Query 认为“这份数据已经有了”，直接返回上一个用户。最有迷惑性的是“queryFn 也会跟着变”：queryFn 确实是新函数，但 Query 只看 key 决定是否重新请求。要写成 [\'user\', id]。' },
    { q: '添加一条待办后，想让列表自动更新，最常用的做法是？', options: ['在 onSuccess 中把 staleTime 改为 0，让列表立刻变成过期状态', '在 onSuccess 中调用 invalidateQueries 让列表缓存失效', '在组件里另存一份列表，手动调用 set 函数追加', '在 onSuccess 中再调用一次 useQuery'], answer: 1, explain: '让缓存失效后，所有使用这份数据的组件会自动重新获取。staleTime 改为 0 不会立刻触发请求，要等组件下次挂载或窗口获得焦点。另存一份列表会出现两个数据源，容易不同步。useQuery 是 Hook，不能在回调里调用。' },
    { q: 'useQuery 没有设置 staleTime（默认为 0）。用户 1 的数据已在缓存中。从别的页面切回用户 1 时，会怎样？', options: ['直接显示缓存，不发请求', '先显示缓存，同时在后台重新请求', '显示加载中，等新数据回来以后再显示列表', '缓存已经过期被删除，重新请求'], answer: 1, explain: 'staleTime 为 0 表示数据一到手就算“过期”。过期不等于没有：Query 先显示缓存，再在后台刷新。“显示加载中”混淆了“过期”和“没有缓存”。“被删除”混淆了 staleTime 和 gcTime：没人使用的缓存默认 5 分钟后才删除。' },
    { q: 'staleTime 是 60 秒。用户 30 秒后切回这个页面，会怎样？', options: ['直接显示缓存，不发请求', '先显示缓存，再在后台请求', '显示加载中，并重新请求', '缓存已被删除，重新请求'], answer: 0, explain: '30 秒时数据还新鲜，所以不请求。“先显示缓存，再在后台请求”是过期之后（60 秒以后）的行为。staleTime 决定何时“过期”；gcTime 决定没人使用的缓存何时被删除（默认 5 分钟）。' },
  ],
});

/* ---------- 29 ---------- */
lesson({
  id: 'testing', stage: 4, title: '测试：Vitest + Testing Library', mins: 25,
  summary: '像用户一样测试组件：按文字和角色找元素，模拟交互，断言结果。',
  goals: [
    '能判断一条断言测的是“用户看到的行为”还是“实现细节”',
    '能用 render、getByRole、userEvent 写出一个组件测试',
    '能写出能抓住 bug 的断言：断言确切结果，而不只是“出现了”',
    '能选择 getBy、queryBy、findBy：一定存在、断言不存在、等待异步内容',
  ],
  keyPoints: [
    '目的：让你敢重构。改完代码跑一遍测试，绿了就放心上线。',
    '像用户一样找元素：优先 <code>getByRole(\'button\', { name: \'提交\' })</code>，最后才用 test id。',
    '<code>getBy</code> 找不到就报错；<code>queryBy</code> 返回 null，用来断言不存在；<code>findBy</code> 返回 Promise，用来等异步内容。',
    '好的断言写确切的结果，例如“共 1 件”。只断言“牛奶出现了”，加了两件也照样通过。',
    '最常见的坑：测试内部 state 或函数调用次数。重构时大面积变红，功能却没坏。',
  ],
  body: [
    p('第 31 课简单提到过测试。这一课动手写。目标不是追求覆盖率数字，而是让你<b>敢于重构</b>：改完代码跑一遍测试，绿了就放心上线。'),
    h('一个完整的测试文件'),
    code(`// Counter.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import Counter from './Counter';

describe('Counter', () => {
  it('初始显示 0', () => {
    render(<Counter />);
    expect(screen.getByText('计数：0')).toBeInTheDocument();
  });

  it('点击 +1 后变为 1', async () => {
    const user = userEvent.setup();
    render(<Counter />);
    await user.click(screen.getByRole('button', { name: '+1' }));
    expect(screen.getByText('计数：1')).toBeInTheDocument();
  });
});`, '运行：npx vitest'),
    tip('这个文件需要两项配置才能运行：<ol class="task-steps"><li>在 vitest.config 中设置 <code>environment: \'jsdom\'</code> 和 <code>globals: true</code>。否则 Testing Library 不会在每个测试后自动清理 DOM。</li><li>在 setup 文件中写 <code>import \'@testing-library/jest-dom/vitest\'</code>。这样才能用 <code>toBeInTheDocument</code>。</li></ol>'),
    h('该用哪种查询？'),
    table(['优先级', '查询', '说明'], [
      ['1（首选）', '<code>getByRole(\'button\', { name: \'提交\' })</code>', '按无障碍角色和名称找，最贴近用户和读屏软件'],
      ['2', '<code>getByLabelText(\'邮箱\')</code>', '表单字段，通过 label 找'],
      ['3', '<code>getByText(\'欢迎\')</code>', '非交互内容'],
      ['最后', '<code>getByTestId(\'cart\')</code>', '实在没办法时才用'],
    ]),
    p('官方完整顺序：Role → LabelText → PlaceholderText → Text → DisplayValue → AltText → Title → TestId。'),
    table(['前缀', '找不到时', '用途'], [
      ['<code>getBy…</code>', '立刻报错', '断言元素一定存在'],
      ['<code>queryBy…</code>', '返回 null', '断言元素<b>不存在</b>：<code>expect(queryByText(\'x\')).toBeNull()</code>'],
      ['<code>findBy…</code>', '返回 Promise，等待出现', '异步内容：<code>await screen.findByText(\'加载完成\')</code>'],
    ]),
    warn('不要测试实现细节。例如：state 里的 count 是不是 1；某个函数被调用了几次。这样的测试在重构时会大面积报错，哪怕功能完全正常。只测试用户能看到的结果。'),
    h('自己动手：一个迷你测试运行器'),
    p('本页不能运行 Vitest。下面的代码用 30 行实现了 <code>render</code>、<code>getByText</code>、<code>getByRole</code> 和 <code>test</code>。我们用它测试一个真实组件。试着把 Counter 改出 bug（比如把 +1 改成 +2），再运行，看测试变红。'),
    play(`
import { useState } from 'react';

// ===== 被测组件 =====
function Counter() {
  const [n, setN] = useState(0);
  return (
    <div>
      <p>计数：{n}</p>
      <button onClick={() => setN(n + 1)}>+1</button>
      <button onClick={() => setN(0)} disabled={n === 0}>重置</button>
    </div>
  );
}

// ===== 迷你测试库 =====
const ROLES = {          // 角色 → 对应的 HTML 元素。role 不是标签名
  button: 'button', link: 'a[href]', heading: 'h1,h2,h3,h4,h5,h6',
  textbox: 'input:not([type]),input[type=text],textarea', checkbox: 'input[type=checkbox]',
};
let container;
function render(ui) {
  container = document.createElement('div');
  ReactDOM.flushSync(() => ReactDOM.createRoot(container).render(ui));
}
const screen = {
  getByText(text) {
    const el = [...container.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent === text);
    if (!el) throw new Error('找不到文字：' + text);
    return el;
  },
  // 简化版：只认 5 种角色。名称先看 aria-label，再看文字（真实库还会看 <label>、alt 等）
  getByRole(role, { name }) {
    const el = [...container.querySelectorAll(ROLES[role])].find(e => (e.getAttribute('aria-label') ?? e.textContent) === name);
    if (!el) throw new Error('找不到 ' + role + '：' + name);
    return el;
  },
};
const tick = () => new Promise(r => setTimeout(r, 0));
const user = { async click(el) { el.click(); await tick(); } };
function expect(v) {
  return { toBe(x) { if (v !== x) throw new Error('期望 ' + x + '，实际 ' + v); } };
}
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// ===== 测试用例 =====
test('初始显示 0，重置按钮不可用', async () => {
  render(<Counter />);
  screen.getByText('计数：0');
  expect(screen.getByRole('button', { name: '重置' }).disabled).toBe(true);
});

test('点击 +1 两次后显示 2', async () => {
  render(<Counter />);
  await user.click(screen.getByRole('button', { name: '+1' }));
  await user.click(screen.getByRole('button', { name: '+1' }));
  screen.getByText('计数：2');
});

test('重置后回到 0', async () => {
  render(<Counter />);
  await user.click(screen.getByRole('button', { name: '+1' }));
  await user.click(screen.getByRole('button', { name: '重置' }));
  screen.getByText('计数：0');
});

(async () => {
  let pass = 0;
  for (const t of tests) {
    try { await t.fn(); pass++; console.log('✅ ' + t.name); }
    catch (e) { console.error('❌ ' + t.name + ' → ' + e.message); }
  }
  console.log(pass + '/' + tests.length + ' 通过');
})();

// 右侧同时显示组件本身
function App() { return <Counter />; }`, '在浏览器里跑测试', '测试结果在下方控制台。'),
    h('异步与 Hook 的测试'),
    code(`// 异步：用 findBy 等待内容出现；网络请求用 MSW 在网络层模拟
it('加载后显示用户名', async () => {
  render(<UserProfile id={1} />);
  expect(screen.getByText('加载中…')).toBeInTheDocument();
  expect(await screen.findByText('张三')).toBeInTheDocument();
});

// 自定义 Hook：用 renderHook
import { renderHook, act } from '@testing-library/react';
it('useToggle 可以切换', () => {
  const { result } = renderHook(() => useToggle(false));
  act(() => result.current[1]());
  expect(result.current[0]).toBe(true);
});`),
    h('真实项目：模拟网络，包好 Provider'),
    code(`import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// 1. MSW 2：在网络层模拟接口。组件里的 fetch 不用改
const server = setupServer(
  http.get('/api/users/1', () => HttpResponse.json({ name: '张三' })),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// 2. 自定义 render：每个测试新建 QueryClient，并关掉重试
function renderWithProviders(ui, { route = '/' } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

// 3. 错误状态也要测：只在这个测试里让接口返回 500
it('接口失败时显示错误', async () => {
  server.use(http.get('/api/users/1', () => new HttpResponse(null, { status: 500 })));
  renderWithProviders(<UserProfile id={1} />);
  expect(await screen.findByRole('alert')).toBeInTheDocument();
});`, '组件用了 Router 或 Query，测试里就要包上对应的 Provider'),
    tip('推荐的测试比例叫“测试奖杯”。从底层到顶层有四层：<ol class="task-steps"><li>静态检查：TypeScript 和 ESLint，成本最低，覆盖最广。</li><li>少量单元测试：测试纯函数和 reducer。</li><li><b>大量集成测试</b>：用 Testing Library 测试一个页面或一个功能。</li><li>少量端到端测试：用 Playwright 在真实浏览器里走完整流程。</li></ol>'),
  ],
  quiz: [
    { q: '测试写了 <code>expect(screen.getByText(\'出错了\')).toBeNull()</code>，想断言“错误提示没有显示”。运行结果是？', options: ['通过：getByText 找不到元素时返回 null，expect 断言成立', '失败：getByText 找不到就抛错，应改用 queryByText', '通过，但要先 await', '失败：应改用 findByText'], answer: 1, explain: 'getBy 系列找不到就抛错，测试在 expect 之前就失败了。queryBy 找不到时返回 null，专门用来断言“不存在”。findBy 用来等待异步出现的元素，找不到会在超时后报错，同样不适合断言不存在。' },
    { q: '页面上有一个只有图标的按钮：<code>&lt;div className="icon-btn" onClick={save}&gt;💾&lt;/div&gt;</code>。测试里 <code>getByRole(\'button\', { name: \'保存\' })</code> 找不到它。最好的做法是？', options: ['改用 container.querySelector(\'.icon-btn\')', '改成 &lt;button aria-label="保存"&gt;💾&lt;/button&gt;，测试保持不变', '给 div 加 data-testid="save"，测试改用 getByTestId 找到它', '改用 getByText(\'💾\')'], answer: 1, explain: 'getByRole 找不到，说明读屏软件也认不出它：div 没有按钮角色，图标也没有名字。改成带 aria-label 的 button，测试和无障碍问题一起解决。另外三个选项都让测试“绕过”了问题：测试通过了，键盘和读屏用户仍然用不了。' },
    { q: '下面哪个属于“测试实现细节”（应避免的写法）？', options: ['点击“+1”按钮后，断言页面上显示了“计数：1”', '用 spy 断言 setCount 被调用了 1 次', '断言提交表单后，页面上出现了“保存成功”提示', '断言禁用状态的按钮不可点击'], answer: 1, explain: 'set 函数调用了几次是实现细节。把 useState 换成 useReducer，功能不变，这个测试却会失败。另外三个都断言用户能看到或能操作的结果。“按钮不可点击”看起来像细节，其实是用户能感知的行为。' },
  ],
});

/* ---------- 30 ---------- */
lesson({
  id: 'nextjs', stage: 4, title: 'Next.js App Router', mins: 25,
  summary: '用文件夹定义路由，在服务端取数据，用 Server Actions 处理表单。',
  goals: [
    '能根据 app/ 目录说出一个 URL 对应哪个 page.tsx、套着哪几层 layout.tsx、params 是什么',
    '能判断数据该在服务端组件、Server Function、Route Handler 还是 TanStack Query 里获取',
    '能解释 Server Action 为什么必须自己校验登录和输入',
    '能找出“整页标成 \'use client\'”这类错误，只把交互部件拆成客户端组件',
  ],
  keyPoints: [
    '文件夹就是路由：<code>app/blog/[slug]/page.tsx</code> 对应 <code>/blog/任意一段</code>，值在 params.slug 里。静态文件夹优先于动态文件夹。',
    '<code>layout.tsx</code> 从外到内一层套一层；<code>loading.tsx</code> 和 <code>error.tsx</code> 就是框架自动加的 Suspense 和错误边界。',
    '页面默认是服务端组件，可以直接 <code>await</code> 查库，不需要 useEffect 和 loading state。',
    'Server Action 本质上是一个公开的 HTTP 接口。每次都要在函数里检查登录，并校验 formData。',
    '最常见的坑：把整个页面标成 <code>\'use client\'</code>，等于退回传统 SPA。只把按钮、表单这类交互部件拆出去。',
  ],
  body: [
    p('Next.js 是使用最广的 React 全栈框架。Server Components 主要就用在 Next.js 中。第 29 课讲了原理，这一课看它在真实项目里怎么组织。'),
    tip('Next.js 需要 Node.js 服务器，本页的示例都是只读代码。创建项目只需一行：<code>npx create-next-app@latest my-app</code>，一路回车即可。'),
    h('文件夹就是路由'),
    fig(`<div class="filetree"><div><b>app/</b></div>
<div class="i1">layout.tsx <span>根布局：&lt;html&gt;、导航栏，所有页面共享</span></div>
<div class="i1">page.tsx <span>→ <code>/</code></span></div>
<div class="i1"><b>blog/</b></div>
<div class="i2">page.tsx <span>→ <code>/blog</code></span></div>
<div class="i2">loading.tsx <span>加载中界面（自动包一层 Suspense）</span></div>
<div class="i2">error.tsx <span>出错界面（自动包一层错误边界）</span></div>
<div class="i2"><b>[slug]/</b></div>
<div class="i3">page.tsx <span>→ <code>/blog/hello-world</code>，动态参数 slug</span></div>
<div class="i1"><b>api/</b><b>hello/</b></div>
<div class="i2">route.ts <span>→ API 接口 <code>GET /api/hello</code></span></div></div>`, '特殊文件名：page、layout、loading、error、not-found、route'),
    p('注意 <code>loading.tsx</code> 和 <code>error.tsx</code>：它们就是第 22 课学的 Suspense 和错误边界。框架按约定自动帮你加上。'),
    h('页面：在服务端直接取数据'),
    code(`// app/blog/[slug]/page.tsx  —— 默认是服务端组件
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import LikeButton from './LikeButton';   // 'use client' 的交互组件

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.post.findUnique({ where: { slug } });
  if (!post) notFound();                 // 渲染 not-found.tsx

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
      <LikeButton postId={post.id} initialLikes={post.likes} />
    </article>
  );
}

// 为 SEO 生成 <title> 和 <meta>
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await db.post.findUnique({ where: { slug } });
  return { title: post?.title ?? '文章不存在' };
}`, '没有 useEffect，没有 loading state，没有 API 层'),
    h('表单：Server Action + 重新验证'),
    code(`// app/blog/[slug]/actions.ts
'use server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function addComment(postId: number, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('请先登录');           // 永远在服务端校验权限
  const text = String(formData.get('text') ?? '').trim();
  if (!text) return;                                   // 直接给 form 的 action，返回值会被丢弃
  await db.comment.create({ data: { postId, text, userId: session.user.id } });
  revalidatePath('/blog/[slug]', 'page');             // 让页面数据刷新
}
// 要把错误信息显示给用户：在客户端组件里用 useActionState，
// 此时函数签名改为 (prevState, formData)

// 在页面里使用（服务端组件中即可，不需要 'use client'）
<form action={addComment.bind(null, post.id)}>
  <textarea name="text" />
  <button>发表</button>
</form>`),
    h('数据从哪里来？'),
    table(['我要做', '用'], [
      ['页面的初始数据', '服务端组件里直接查库或调用数据层函数'],
      ['提交表单、修改数据', 'Server Function（<code>\'use server\'</code>）'],
      ['给第三方或移动端提供接口', 'Route Handler（<code>route.ts</code>）'],
      ['客户端高频交互（轮询、无限滚动）', 'TanStack Query'],
    ]),
    warn('三条安全规则：<ol class="task-steps"><li>服务端组件不要 <code>fetch</code> 自己的 API 路由。直接调用数据层函数，少一次网络往返。</li><li>只能在服务端用的模块，加上 <code>import \'server-only\'</code>。<code>NEXT_PUBLIC_</code> 开头的变量会发到浏览器，不要放密钥。</li><li>Server Function 收到的 formData 是不可信输入。先用 Zod 等工具校验，再写库。</li></ol>'),
    p('缓存提示：从 Next.js 15 起，<code>fetch</code> 默认<b>不缓存</b>。需要缓存时要明确写出来。'),
    h('渲染策略'),
    table(['策略', '何时生成 HTML', '适合'], [
      ['静态（默认尽量静态）', '构建时', '文档、博客、营销页'],
      ['动态', '每次请求时（读取了 cookies、headers、searchParams 等）', '个性化页面、仪表盘'],
      ['增量更新', '静态生成，过期或 revalidate 后重新生成', '商品页、新闻'],
      ['流式渲染', '先发外壳，慢的部分通过 Suspense 稍后流入', '有慢查询的页面'],
    ]),
    p('上表是 Next.js 的传统模型。Next.js 16 开启 <code>cacheComponents</code> 后，同一页面可以混合三种内容：静态内容、用 <code>\'use cache\'</code> 缓存的内容、在 Suspense 中按请求流式返回的内容。读取 cookies 只影响它所在的 Suspense 区域，不会让整页变成动态。'),
    warn('最常见的错误是把整个页面都标成 <code>\'use client\'</code>。这样等于退回传统 SPA，服务端组件的好处全部失去。正确做法：页面和布局保持为服务端组件。只把需要交互的小部件拆成客户端组件，例如按钮、表单、下拉菜单。'),
    deep('你也可以选择其他框架。例如 React Router（框架模式）和 TanStack Start。它们的核心概念相同：<b>按路由组织代码；在服务端或路由层加载数据；用 action 提交表单</b>。学会一个，迁移到另一个很快。'),
  ],
  quiz: [
    { q: '项目里同时有 <code>app/blog/[slug]/page.tsx</code> 和 <code>app/blog/new/page.tsx</code>。访问 /blog/new，会渲染哪个页面？', options: ['[slug] 页面，params.slug 是 "new"', 'new/page.tsx，静态文件夹优先于动态文件夹', '两个都渲染，按文件名排序', '构建时报错：两个路由冲突'], answer: 1, explain: '能精确匹配的静态段优先，动态段 [slug] 只在没有静态匹配时才接手。“params.slug 是 new”最有迷惑性：[slug] 确实能匹配任意一段，但它的优先级更低。本课练习的 resolveRoute 实现的就是这条规则。' },
    { q: '/blog 的数据要查很久。想在等待时显示“加载中”，最简单的做法是？', options: ['在 page.tsx 里用 useState 记录 isLoading，数据回来前显示加载中', '在 app/blog/ 下新建 loading.tsx', '在 app/blog/ 下新建 error.tsx', '给 page.tsx 加 \'use client\'，再用 useEffect 请求数据'], answer: 1, explain: 'loading.tsx 会被自动用作这一段路由的 Suspense fallback。page.tsx 默认是服务端组件，不能用 useState。改成客户端组件加 useEffect 虽然能做到，但放弃了服务端取数据，也就是本课讲的最常见错误。error.tsx 是出错时的界面，不是加载界面。' },
    { q: 'Server Action 里为什么必须做权限校验？', options: ['只有页面里的 &lt;form&gt; 能调用它，所以只需在页面里校验', '它其实是公开的 HTTP 接口，谁都能直接调用', '中间件已经拦截了所有未登录的请求，函数里不用再查一遍', '只有用了 revalidatePath 时才需要校验'], answer: 1, explain: '\'use server\' 函数会暴露为可被网络请求调用的端点。别人不用打开你的页面，也能直接发请求调用它。“中间件已经拦截”最有迷惑性：中间件的匹配规则可能漏掉某些路径，而且它只看请求，不知道这个用户有没有权限改这条数据。权限要在函数里检查。' },
  ],
});

/* ---------- 31 ---------- */
lesson({
  id: 'project-todo', stage: 4, title: '实战一：完整的待办应用', mins: 40,
  summary: '综合 state、表单、列表、条件渲染和派生数据，从零写一个功能完整的小应用。',
  goals: [
    '能从需求表列出最少需要的 state：todos、text、filter',
    '能区分“存储的状态”和“计算出的值”：筛选后的列表、剩余数量都在渲染时算出',
    '能用不可变写法实现添加、切换、删除',
    '能按需求表逐条交付，并通过自动验收',
  ],
  keyPoints: [
    '先设计 state，再写界面：只存 todos、输入框文字、当前筛选，其余都能算出来。',
    '“剩余数量”“筛选后的列表”在渲染时用 <code>filter</code> 计算。再存一份，就会出现两个数据源，容易不同步。',
    '修改数组用 <code>map</code>、<code>filter</code>、展开运算符生成新数组。不要 push、splice，也不要直接改某一项的 done。',
    '最常见的坑：忘了 <code>preventDefault()</code> 导致表单提交刷新页面；忘了清空输入框；空白内容也被添加。',
  ],
  body: [
    p('这是课程的第一个实战项目，只用到本阶段学过的 state、事件、条件渲染、列表和表单。每个实战项目都有一份明确的<b>需求说明</b>，就像工作中产品经理给你的需求。检查程序会按需求逐条验收，就像测试同学一样操作你的应用。'),
    h('需求说明'),
    table(['编号', '需求', '实现约定'], [
      ['1', '输入框输入内容，点“添加”后新增一条待办，并清空输入框', '<code>&lt;input id="new-todo"&gt;</code> 和文字为 <b>添加</b> 的按钮'],
      ['2', '输入为空或只有空格时不添加', ''],
      ['3', '每条待办有复选框，勾选后标记为完成，再点一次取消', '每条是 <code>&lt;li className="todo"&gt;</code>，完成时再加上 <code>done</code> 类名。用 <code>&lt;label&gt;</code> 包住复选框和文字'],
      ['4', '每条待办可以删除', '每条里有文字为 <b>删除</b> 的按钮'],
      ['5', '可以按“全部 / 未完成 / 已完成”筛选', '三个按钮，文字分别是 <b>全部</b>、<b>未完成</b>、<b>已完成</b>'],
      ['6', '显示剩余未完成的数量', '<code>&lt;p id="left"&gt;剩余 N 项&lt;/p&gt;</code>'],
    ]),
    h('动手前先设计'),
    p('先想清楚<b>最少需要哪些 state</b>，其余一切都应该是计算出来的：'),
    ul(['<code>todos</code>：数组，每项 <code>{ id, text, done }</code>', '<code>text</code>：输入框的内容', '<code>filter</code>：<code>\'all\' | \'active\' | \'done\'</code>', '<b>不需要</b>存“剩余数量”和“筛选后的列表”，它们都能由 todos 和 filter 算出来']),
    tip('可选挑战：学完《自定义 Hook：复用逻辑》后，可以回来加上 <code>useLocalStorage</code>，刷新页面后数据还在。这不是验收要求。'),
    like('先设计状态再写界面，就像装修前先画户型图。水电走哪儿定好了，后面刷墙、摆家具都很顺。'),
  ],
  quiz: [
    { q: '待办应用中，“剩余数量”应该怎么实现？', options: ['单独一个 useState 存剩余数量，每次添加、切换、删除时都同步加减', '渲染时用 filter 算出未完成的条数', '渲染时显示 todos.length', '在组件外用 let left 变量记录，增删改时修改它'], answer: 1, explain: '能从现有状态计算出的值不应该再存一份，否则容易不同步。todos.length 会把已完成的也算进去。组件外的变量改了也不会触发重新渲染。' },
    { q: '切换某条待办的完成状态，正确的不可变写法是？', options: ['todos[i].done = !todos[i].done; setTodos(todos)', 'setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))', 'const next = todos; next[i] = { ...todos[i], done: !todos[i].done }; setTodos(next)', 'setTodos(todos.push(x))'], answer: 1, explain: '用 map 生成新数组，并为被修改的项创建新对象。第三个选项最有迷惑性：它复制了那一项，但 next 和 todos 是同一个数组，React 比较引用后认为没变，界面不会更新。第一个选项同理。push 也在原数组上修改，而且它返回的是新长度，不是数组。' },

  ],
  exercise: {
    task: '<ol class="task-steps"><li>读需求说明，列出需要的 state。</li><li>按需求 1 到 6 的顺序逐条实现。</li><li>id、类名和按钮文字必须和“实现约定”一致。检查程序用它们操作你的应用。</li></ol>',
    starter: `import { useState } from 'react';

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');

  // 1. 添加：注意清空输入框、忽略空白内容
  // 2. 切换完成、删除
  // 3. 根据 filter 计算要显示的列表，计算剩余数量

  return (
    <div>
      <form>
        <input id="new-todo" placeholder="要做什么？" />
        <button>添加</button>
      </form>
      <ul>
        {/* <li className="todo"> 复选框 + 文字 + 删除按钮 </li> */}
      </ul>
      <p id="left">剩余 0 项</p>
      <div>
        <button>全部</button>
        <button>未完成</button>
        <button>已完成</button>
      </div>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

let nextId = 1;

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');

  function add(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setTodos([...todos, { id: nextId++, text: value, done: false }]);
    setText('');
  }
  const toggle = (id) => setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id) => setTodos(todos.filter(t => t.id !== id));

  const visible = todos.filter(t => filter === 'all' ? true : filter === 'done' ? t.done : !t.done);
  const left = todos.filter(t => !t.done).length;
  const tab = (key, label) => (
    <button onClick={() => setFilter(key)} style={{ fontWeight: filter === key ? 700 : 400 }}>{label}</button>
  );

  return (
    <div>
      <form onSubmit={add}>
        <input id="new-todo" placeholder="要做什么？" value={text} onChange={e => setText(e.target.value)} />
        <button>添加</button>
      </form>
      <ul>
        {visible.map(t => (
          <li key={t.id} className={'todo' + (t.done ? ' done' : '')}>
            <label>{/* label 包住复选框，读屏软件会读出这条待办的文字 */}
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
              <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
            </label>
            <button onClick={() => remove(t.id)}>删除</button>
          </li>
        ))}
      </ul>
      <p id="left">剩余 {left} 项</p>
      <div>{tab('all', '全部')}{tab('active', '未完成')}{tab('done', '已完成')}</div>
    </div>
  );
}`,
    hint: '用 <code>&lt;form onSubmit&gt;</code> 处理添加并 <code>preventDefault()</code>；显示列表用 <code>todos.filter(...)</code> 按 filter 计算；剩余数量用 <code>todos.filter(t =&gt; !t.done).length</code>。',
    faded: `import { useState } from 'react';

let nextId = 1;

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');

  function add(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    /* ✏️ 用展开运算符生成新数组，追加 { id, text, done: false } */
    setText('');
  }
  const toggle = (id) => /* ✏️ 用 map 生成新数组：id 相同的那一项复制一份，done 取反 */;
  const remove = (id) => setTodos(todos.filter(t => t.id !== id));

  /* ✏️ visible：根据 filter（all / active / done）从 todos 中筛选 */
  /* ✏️ left：未完成的数量，在渲染时计算，不要另存 state */
  const tab = (key, label) => (
    <button onClick={() => setFilter(key)} style={{ fontWeight: filter === key ? 700 : 400 }}>{label}</button>
  );

  return (
    <div>
      <form onSubmit={add}>
        <input id="new-todo" placeholder="要做什么？" value={text} onChange={e => setText(e.target.value)} />
        <button>添加</button>
      </form>
      <ul>
        {visible.map(t => (
          <li key={t.id} className={'todo' + (t.done ? ' done' : '')}>
            <label>
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
              <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
            </label>
            <button onClick={() => remove(t.id)}>删除</button>
          </li>
        ))}
      </ul>
      <p id="left">剩余 {left} 项</p>
      <div>{tab('all', '全部')}{tab('active', '未完成')}{tab('done', '已完成')}</div>
    </div>
  );
}`,
    test: async (t) => {
      const add = async (v) => { await t.type('#new-todo', v); await t.click(t.byText('button', '添加')); };
      const items = () => t.qa('li.todo');
      const left = () => t.text('#left').replace(/\s/g, '');
      t.assert(t.q('#new-todo') && t.byText('button', '添加'), '需要 #new-todo 输入框和“添加”按钮');
      await add('买牛奶'); await add('写周报'); await add('跑步');
      t.assert(items().length === 3, `添加 3 条后应有 3 个 li.todo，实际 ${items().length} 个`);
      t.assert(t.q('#new-todo').value === '', '添加后输入框应被清空');
      await add('   ');
      t.assert(items().length === 3, '空白内容不应被添加（需求 2）');
      t.assert(left() === '剩余3项', `应显示“剩余 3 项”，实际是“${t.text('#left')}”`);
      const cb = items()[1].querySelector('input[type=checkbox]');
      t.assert(cb, '每条待办需要一个复选框');
      await t.click(cb);
      t.assert(items()[1].classList.contains('done'), '勾选后该 li 应加上 done 类名（需求 3）');
      t.assert(left() === '剩余2项', `勾选一条后应显示“剩余 2 项”，实际是“${t.text('#left')}”`);
      await t.click(items()[1].querySelector('input[type=checkbox]'));
      t.assert(!items()[1].classList.contains('done') && left() === '剩余3项', '再次点击复选框应取消完成（需求 3）');
      await t.click(items()[1].querySelector('input[type=checkbox]'));
      await t.click(t.byText('button', '已完成'));
      t.assert(items().length === 1 && items()[0].textContent.includes('写周报'), '“已完成”筛选下应只显示“写周报”');
      await t.click(t.byText('button', '未完成'));
      t.assert(items().length === 2, '“未完成”筛选下应显示 2 条');
      await t.click(t.byText('button', '全部'));
      t.assert(items().length === 3, '“全部”筛选下应显示 3 条');
      const del = Array.from(items()[0].querySelectorAll('button')).find(b => b.textContent.trim() === '删除');
      t.assert(del, '每条待办需要一个“删除”按钮');
      await t.click(del);
      t.assert(items().length === 2 && !items().some(li => li.textContent.includes('买牛奶')), '删除后“买牛奶”应消失');
      t.assert(left() === '剩余1项', `删除一条未完成项后应显示“剩余 1 项”，实际是“${t.text('#left')}”`);
    }
  }
});

/* ---------- 32 ---------- */
lesson({
  id: 'project-search', stage: 4, title: '实战二：异步搜索', mins: 40,
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
  body: [
    p('几乎每个应用都有搜索框。它看起来简单，却很能检验异步功底。用户每输入一个字，应用就发一次请求。而<b>响应返回的顺序不一定和请求发出的顺序相同</b>。'),
    h('需求说明'),
    table(['编号', '需求', '实现约定'], [
      ['1', '输入关键词后调用 <code>searchUsers(q)</code> 搜索用户（已提供，返回 Promise）', '<code>&lt;input id="search"&gt;</code>'],
      ['2', '输入为空时不请求，也不显示任何结果', ''],
      ['3', '请求期间显示加载提示', '<code>&lt;p id="loading"&gt;</code>'],
      ['4', '每个结果显示用户名', '<code>&lt;li className="user"&gt;</code>'],
      ['5', '没有结果时显示提示', '<code>&lt;p id="empty"&gt;没有找到&lt;/p&gt;</code>'],
      ['6', '请求失败时显示错误', '<code>&lt;p id="error"&gt;</code>（搜索“错误”会触发失败）'],
      ['7', '<b>快速输入时，只显示最后一次输入的结果</b>', '模拟接口里，关键词越短返回越慢'],
    ]),
    p('需求 7 是关键。用户先输入“李”，紧接着输入“李四”。“李”的请求<b>更慢</b>，会在“李四”之后才返回。如果不处理，界面会先正确显示“李四”的结果，然后被过期的“李”的结果覆盖。'),
    fig(`<div class="steps"><div class="step"><b>0 ms</b><span>输入“李” → 发出请求 A（需要 600 ms）</span></div><div class="step"><b>50 ms</b><span>输入“李四” → 发出请求 B（需要 300 ms）</span></div><div class="step"><b>350 → 600 ms</b><span>B 先返回，显示正确；A 后返回，<em>如果不忽略就会覆盖</em></span></div></div>`, '竞态：后发出的请求先返回'),
    tip('解决办法就是第 14 课的 <code>ignore</code> 标记：在 effect 的清理函数里把上一次请求标记为过期。进阶写法可以用 <code>AbortController</code> 直接取消请求。'),
    h('建议的结构'),
    code(`function useUserSearch(query) {
  const [state, setState] = useState({ status: 'idle', data: [], error: null });
  useEffect(() => {
    if (!query) { setState({ status: 'idle', data: [], error: null }); return; }
    let ignore = false;
    // ……发请求、处理成功和失败，记得检查 ignore
    return () => { ignore = true; };
  }, [query]);
  return state;
}`, '用一个 status 字段代替多个布尔值，状态就不会出现“既在加载又出错”的矛盾'),
    deep('真实的搜索框通常还会加<b>防抖</b>：用户停止输入一段时间后，才发请求。'
      + '<ol class="task-steps">'
      + '<li>下面的 Hook 让值在停止变化 300 ms 后才更新：<code>const q = useDebouncedValue(query, 300);</code></li>'
      + '<li>防抖只减少请求次数，不能保证返回顺序。所以仍然需要 ignore。</li>'
      + '<li>本练习的检查程序按固定时间验收。<b>做练习时不要加防抖。</b></li>'
      + '</ol>'),
    code(`function useDebouncedValue(value, delay) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);   // 停止变化 delay 毫秒后才更新
    return () => clearTimeout(id);                     // 值又变了：取消上一个计时器
  }, [value, delay]);
  return v;
}`, '防抖：减少请求次数，但不能代替 ignore'),
  ],
  quiz: [
    { q: '用户快速输入时，旧请求比新请求晚返回，会导致？', options: ['请求自动排队，按发出顺序显示', '界面最终显示旧关键词的结果', '请求自动取消', 'React 18 会自动丢弃过期请求触发的 set 函数调用'], answer: 1, explain: '这就是竞态问题：旧请求的 then 回调照样会执行，把旧结果写进 state。React 不知道哪个结果“过期”，不会替你丢弃，所以最后一个选项不对。必须用 ignore 标记忽略，或用 AbortController 取消过期请求。' },
    { q: '用 status: \'idle\' | \'loading\' | \'success\' | \'error\' 代替 isLoading、isError 等多个布尔值，好处是？', options: ['代码更短', '避免出现互相矛盾的状态组合', '减少重新渲染次数', '让 TypeScript 推断更准'], answer: 1, explain: '用多个布尔值时，可能出现 isLoading 和 isError 同时为 true。这种组合本不应该存在。一个 status 字段一次只能有一个值，矛盾的组合根本写不出来。它不一定让代码更短，也不减少渲染次数。' },
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
      let got;
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
    }
  }
});

/* ---------- 33 ---------- */
lesson({
  id: 'project-kanban', stage: 4, title: '实战三：看板应用', mins: 40,
  summary: '用 useReducer 和 Context 组织一个多组件应用，体会状态架构的价值。',
  goals: [
    '能写出一个纯 reducer：add、move、remove 三种 action，每个分支都返回新对象',
    '能处理边界情况：空白标题、越界移动、删除后再添加时 id 不重复',
    '能解释为什么把 dispatch 放进 Context，深层的 Card 就不用层层传回调',
    '能说出“状态逻辑写成纯函数”带来的好处：可以单独测试，也能迁移到其他状态库',
  ],
  keyPoints: [
    '界面只负责显示和派发 action，所有规则集中在 reducer 里。reducer 是纯函数，可以直接调用来测试。',
    '每张卡片只存一个 <code>col</code> 字段，列里有哪些卡片用 filter 算出。卡片只有一个数据源，不会同时出现在两列。',
    '新卡片的 id 用 <code>nextId</code>，不用 <code>cards.length + 1</code>：删除之后长度会变小，id 就会重复。',
    '最常见的坑：在 reducer 里 push 或直接改 card.col。开发环境的 StrictMode 会调用 reducer 两次，卡片就被加两次。',
  ],
  body: [
    p('看板（Kanban）把任务分成三列：待办、进行中、已完成。卡片可以在列之间移动。Trello、Jira、飞书项目都是这种形态。'),
    p('这个项目的界面已经写好了，你的任务是实现最核心的<b>状态逻辑</b>：一个 reducer。真实团队经常这样分工。组件只负责显示和派发 action。所有规则集中在 reducer 里，可以单独测试。'),
    h('状态设计'),
    code(`const initialState = {
  columns: ['todo', 'doing', 'done'],
  cards: [
    { id: 1, title: '设计数据结构', col: 'todo' },
    { id: 2, title: '写 reducer', col: 'todo' },
  ],
  nextId: 3,
};
// 每张卡片只记录它在哪一列（col），列里有哪些卡片由 filter 计算得出`),
    h('需要实现的 action'),
    table(['action', '效果'], [
      ['<code>{ type: \'add\', title }</code>', '在“待办”列新增一张卡片。title 去掉首尾空格后为空则忽略'],
      ['<code>{ type: \'move\', id, dir: 1 }</code>', '把卡片移到右边一列；已在最右列则不变'],
      ['<code>{ type: \'move\', id, dir: -1 }</code>', '把卡片移到左边一列；已在最左列则不变'],
      ['<code>{ type: \'remove\', id }</code>', '删除卡片'],
    ]),
    tip('移动卡片的步骤：<ol class="task-steps"><li>找到卡片当前列在 <code>columns</code> 中的下标。</li><li>下标加上 <code>dir</code>。</li><li>新下标在 0 到 2 之间时，更新 <code>col</code>。</li></ol>'),
    deep('应用变大后，这个 reducer 几乎不用修改。它可以直接迁移到 Zustand 或 Redux Toolkit。这说明一个观点：<b>先把状态逻辑写成纯函数，用什么库只是“接线”问题</b>。第 27 课《状态管理架构》和第 40 课会展开讲。<br>真实项目开启 StrictMode 时，开发环境里 React 会调用 reducer 两次。如果 reducer 修改了原 state，卡片就会被加两次。'),
  ],
  quiz: [
    { q: '为什么卡片只存 col 字段，而不是为每列存一个卡片数组？', options: ['节省内存', '每张卡片只有一个数据源，不会同时出现在两列', '列数组更方便排序和拖拽，所以只存 col 其实是更差的设计', 'useReducer 的 state 不能包含嵌套数组'], answer: 1, explain: '每列各存一个数组时，移动卡片要从一个数组删除、往另一个数组添加。两步中漏一步，卡片就会消失或同时出现在两列。只存 col，移动只改一个字段。“列数组更方便排序”有一定道理，但排序可以另存一个 order 字段，不需要重复存卡片。useReducer 的 state 可以是任何值。' },
    { q: '把 dispatch 放进 Context 的主要好处是？', options: ['Context 让 dispatch 不再触发重新渲染', '深层组件可以直接派发 action，无需层层传递回调', '可以替代 reducer', '可以让 reducer 读取组件的 props'], answer: 1, explain: '深层组件直接拿到 dispatch，不用层层传递回调。第一个选项有迷惑性：dispatch 的引用是稳定的，所以这个 Context 的值不会变，读取它的组件不会因为 Context 而重新渲染；但 dispatch 引起的 state 变化仍然会让 App 重新渲染。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>实现 <code>add</code>：标题去掉首尾空格后为空，就返回原 state；否则在“待办”列新增卡片。</li><li>实现 <code>move</code>：按 <code>dir</code> 把卡片移到相邻列；越界时不移动。</li><li>实现 <code>remove</code>：删除卡片。</li><li>每个分支都返回新对象，不修改原 state。界面代码不需要修改。</li></ol>',
    starter: `import { useReducer, useState, createContext, useContext } from 'react';

const COLUMN_NAMES = { todo: '待办', doing: '进行中', done: '已完成' };
const initialState = {
  columns: ['todo', 'doing', 'done'],
  cards: [
    { id: 1, title: '设计数据结构', col: 'todo' },
    { id: 2, title: '写 reducer', col: 'todo' },
  ],
  nextId: 3,
};

// ===== 你的任务：实现这个 reducer =====
function boardReducer(state, action) {
  switch (action.type) {
    // case 'add': ...
    // case 'move': ...
    // case 'remove': ...
    default:
      return state;
  }
}

// ===== 以下为界面，无需修改 =====
const DispatchCtx = createContext(null);

function Card({ card, isFirst, isLast }) {
  const dispatch = useContext(DispatchCtx);
  return (
    <div className="card" style={{ background: '#fff', border: '1px solid #cbd5da', borderRadius: 6, padding: 6, margin: '6px 0' }}>
      <div>{card.title}</div>
      <button disabled={isFirst} aria-label="移到左边一列" onClick={() => dispatch({ type: 'move', id: card.id, dir: -1 })}>←</button>
      <button disabled={isLast} aria-label="移到右边一列" onClick={() => dispatch({ type: 'move', id: card.id, dir: 1 })}>→</button>
      <button onClick={() => dispatch({ type: 'remove', id: card.id })}>删除</button>
    </div>
  );
}

function Column({ col, index, cards, total }) {
  return (
    <div className="column" data-col={col} style={{ flex: 1, background: '#eef3f5', borderRadius: 8, padding: 8, minWidth: 0 }}>
      <h4 style={{ margin: 0 }}>{COLUMN_NAMES[col]}（{cards.length}）</h4>
      {cards.map(c => <Card key={c.id} card={c} isFirst={index === 0} isLast={index === total - 1} />)}
    </div>
  );
}

function App() {
  const [state, dispatch] = useReducer(boardReducer, initialState);
  const [title, setTitle] = useState('');
  return (
    <DispatchCtx.Provider value={dispatch}>
      <form onSubmit={e => { e.preventDefault(); dispatch({ type: 'add', title }); setTitle(''); }}>
        <input id="card-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="新卡片" />
        <button>添加卡片</button>
      </form>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {state.columns.map((col, i) => (
          <Column key={col} col={col} index={i} total={state.columns.length}
            cards={state.cards.filter(c => c.col === col)} />
        ))}
      </div>
    </DispatchCtx.Provider>
  );
}`,
    solution: `import { useReducer, useState, createContext, useContext } from 'react';

const COLUMN_NAMES = { todo: '待办', doing: '进行中', done: '已完成' };
const initialState = {
  columns: ['todo', 'doing', 'done'],
  cards: [
    { id: 1, title: '设计数据结构', col: 'todo' },
    { id: 2, title: '写 reducer', col: 'todo' },
  ],
  nextId: 3,
};

// ===== 你的任务：实现这个 reducer =====
function boardReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const title = action.title.trim();
      if (!title) return state;
      return {
        ...state,
        cards: [...state.cards, { id: state.nextId, title, col: state.columns[0] }],
        nextId: state.nextId + 1,
      };
    }
    case 'move':
      return {
        ...state,
        cards: state.cards.map(c => {
          if (c.id !== action.id) return c;
          const i = state.columns.indexOf(c.col) + action.dir;
          return i >= 0 && i < state.columns.length ? { ...c, col: state.columns[i] } : c;
        }),
      };
    case 'remove':
      return { ...state, cards: state.cards.filter(c => c.id !== action.id) };
    default:
      return state;
  }
}

// ===== 以下为界面，无需修改 =====
const DispatchCtx = createContext(null);

function Card({ card, isFirst, isLast }) {
  const dispatch = useContext(DispatchCtx);
  return (
    <div className="card" style={{ background: '#fff', border: '1px solid #cbd5da', borderRadius: 6, padding: 6, margin: '6px 0' }}>
      <div>{card.title}</div>
      <button disabled={isFirst} aria-label="移到左边一列" onClick={() => dispatch({ type: 'move', id: card.id, dir: -1 })}>←</button>
      <button disabled={isLast} aria-label="移到右边一列" onClick={() => dispatch({ type: 'move', id: card.id, dir: 1 })}>→</button>
      <button onClick={() => dispatch({ type: 'remove', id: card.id })}>删除</button>
    </div>
  );
}

function Column({ col, index, cards, total }) {
  return (
    <div className="column" data-col={col} style={{ flex: 1, background: '#eef3f5', borderRadius: 8, padding: 8, minWidth: 0 }}>
      <h4 style={{ margin: 0 }}>{COLUMN_NAMES[col]}（{cards.length}）</h4>
      {cards.map(c => <Card key={c.id} card={c} isFirst={index === 0} isLast={index === total - 1} />)}
    </div>
  );
}

function App() {
  const [state, dispatch] = useReducer(boardReducer, initialState);
  const [title, setTitle] = useState('');
  return (
    <DispatchCtx.Provider value={dispatch}>
      <form onSubmit={e => { e.preventDefault(); dispatch({ type: 'add', title }); setTitle(''); }}>
        <input id="card-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="新卡片" />
        <button>添加卡片</button>
      </form>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {state.columns.map((col, i) => (
          <Column key={col} col={col} index={i} total={state.columns.length}
            cards={state.cards.filter(c => c.col === col)} />
        ))}
      </div>
    </DispatchCtx.Provider>
  );
}`,
    hint: '<code>add</code> 用 <code>state.nextId</code> 作为新 id 并让 nextId + 1；<code>move</code> 用 <code>state.columns.indexOf(c.col) + action.dir</code> 算出新列的下标，越界就不变；每个分支都返回新对象。',
    exports: ['boardReducer'],
    faded: `// （initialState 和界面代码与起始代码相同，这里省略）

function boardReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const title = action.title.trim();
      /* ✏️ 标题为空：原样返回 state */
      return {
        ...state,
        /* ✏️ cards：展开旧数组，追加 { id: state.nextId, title, col: 第一列 } */
        nextId: state.nextId + 1,
      };
    }
    case 'move':
      return {
        ...state,
        cards: state.cards.map(c => {
          if (c.id !== action.id) return c;
          /* ✏️ 算出新列的下标：当前列在 columns 中的下标 + action.dir */
          /* ✏️ 下标在范围内：返回复制后改了 col 的新对象；否则返回原来的 c */
        }),
      };
    case 'remove':
      return { ...state, cards: state.cards.filter(c => c.id !== action.id) };
    default:
      return state;
  }
}`,
    test: async (t) => {
      const titles = (col) => t.qa(`.column[data-col="${col}"] .card`).map(c => c.firstChild.textContent);
      const card = (title) => t.qa('.card').find(c => c.firstChild.textContent === title);
      const btn = (c, label) => Array.from(c.querySelectorAll('button')).find(b => b.textContent === label);
      await t.type('#card-input', '写测试');
      await t.click(t.byText('button', '添加卡片'));
      t.assert(titles('todo').includes('写测试'), '添加后“写测试”应出现在“待办”列');
      await t.type('#card-input', '   ');
      await t.click(t.byText('button', '添加卡片'));
      t.assert(t.qa('.card').length === 3, '空白标题不应添加卡片');
      await t.click(btn(card('写测试'), '→'));
      t.assert(titles('doing').includes('写测试'), '点 → 后“写测试”应移到“进行中”');
      await t.click(btn(card('写测试'), '→'));
      t.assert(titles('done').includes('写测试'), '再点 → 应移到“已完成”');
      await t.click(btn(card('写测试'), '←'));
      t.assert(titles('doing').includes('写测试') && !titles('done').includes('写测试'), '点 ← 应移回“进行中”');
      const r = t.exports.boardReducer;
      t.assert(typeof r === 'function', '没有找到 boardReducer');
      const s0 = { columns: ['todo', 'doing', 'done'], cards: [{ id: 1, title: 'a', col: 'done' }, { id: 2, title: 'b', col: 'todo' }], nextId: 3 };
      const s1 = r(s0, { type: 'move', id: 1, dir: 1 });
      t.assert(s1.cards[0].col === 'done', '已在最右列的卡片向右移动时应保持不变');
      const s2 = r(s0, { type: 'move', id: 2, dir: -1 });
      t.assert(s2.cards[1].col === 'todo', '已在最左列的卡片向左移动时应保持不变');
      const s3 = r(s0, { type: 'move', id: 2, dir: 1 });
      t.assert(s3 !== s0 && s0.cards[1].col === 'todo', 'reducer 不能修改原来的 state，要返回新对象');
      const snap = JSON.stringify(s0);
      const a1 = r(s0, { type: 'add', title: ' x ' });
      t.assert(JSON.stringify(s0) === snap, 'add 不能修改原来的 state（不要用 push），要返回新对象');
      t.assert(a1.cards.length === 3 && a1.cards[2].title === 'x' && a1.cards[2].col === 'todo', 'add 应去掉首尾空格，并把卡片加到“待办”列');
      t.assert(a1.cards[2].id === 3 && a1.nextId === 4, '新卡片的 id 应取 nextId，并让 nextId 加 1');
      t.assert(r(s0, { type: 'add', title: '  ' }) === s0, '空白标题应原样返回 state');
      const a2 = r(r(s0, { type: 'remove', id: 1 }), { type: 'add', title: 'y' });
      t.assert(JSON.stringify(s0) === snap, 'remove 不能修改原来的 state（不要用 splice），要返回新对象');
      t.assert(a2.cards.length === 2 && new Set(a2.cards.map(c => c.id)).size === 2, '删除后再添加，卡片 id 不能重复（用 nextId，不要用 cards.length + 1）');
      await t.click(btn(card('写测试'), '删除'));
      t.assert(!card('写测试'), '删除后卡片应消失');
    }
  }
});

/* ---------- 34 ---------- */
lesson({
  id: 'portfolio', stage: 4, title: '毕业设计：从练习到作品集', mins: 15,
  summary: '在自己的电脑上做三个真正的项目，把这门课学到的一切用起来。本课约 15 分钟读完；三个项目在课外完成，合计约 50–80 小时。',
  goals: [
    '能用 Vite 在本地创建并运行一个 React + TypeScript 项目',
    '能说出三个项目的每条需求要用到哪一课的知识',
    '能用验收清单逐条自查：每一条都通过实际操作来验证',
    '能给核心流程写 3 个测试，并用“故意改坏”确认测试能抓住 bug',
  ],
  keyPoints: [
    '课程的终点是一个能用、已上线、别人能访问的应用。',
    '对照验收清单逐条操作，看到“应该看到”的结果才打勾，不凭感觉。',
    '最容易漏的四种情况：断网、慢网、空数据、只用键盘。',
    '测试要能抓住 bug：故意改坏一处，至少一个测试应该变红。',
    '<code>VITE_</code> 开头的变量会打包进前端，任何人都能看到。密钥放在服务端。',
  ],
  body: [
    p('到这里，课程能教的已经教完了。最后一步只能靠你自己。<b>从一个空文件夹开始，做出一个能用、已上线、别人能访问的应用</b>。下面三个项目难度递增，每一个都对应课程里的一组知识。'),
    tip('本课标的 15 分钟只算阅读。三个项目要在课外完成，预计工时如下（按第一次独立做估算，包含写测试和部署）：<ol class="task-steps"><li>项目一：约 8–12 小时。</li><li>项目二：约 15–25 小时。</li><li>项目三：约 25–40 小时。</li></ol>每周投入 5–8 小时，三个项目大约需要 2–3 个月。一次只做一个项目，做完验收清单再开始下一个。'),
    h('准备环境'),
    code(`# 1. 安装 Node.js（建议 LTS 版本），然后检查
node -v

# 2. 用 Vite 创建 React + TypeScript 项目
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev          # 打开 http://localhost:5173

# 3. 推荐的编辑器：VS Code + ESLint 插件`, '项目一、二用 Vite；项目三用 Next.js'),
    h('项目一：个人记账本（Vite + TypeScript）'),
    p('预计工时：约 8–12 小时。'),
    table(['要求', '用到的知识'], [
      ['记录收入和支出，包含金额、分类、日期、备注', '受控表单（第 8 课）、TypeScript 类型（第 32 课）'],
      ['按月份筛选，显示收支合计和各分类占比', '派生数据（第 9 课）、列表渲染（第 7 课）'],
      ['数据保存在 localStorage，刷新不丢失', '自定义 Hook（第 15 课）'],
      ['支持编辑和删除，删除前有确认', '状态提升（第 10 课）、条件渲染（第 6 课）'],
      ['为核心计算函数和一个表单写测试', 'Vitest + Testing Library（第 35 课）'],
    ]),
    h('项目二：电影搜索与收藏（React Router + TanStack Query）'),
    p('预计工时：约 15–25 小时。接入真实 API 和调试缓存最花时间。'),
    table(['要求', '用到的知识'], [
      ['接入一个公开 API（如 TMDB）搜索电影，带防抖', '异步搜索、竞态、防抖（第 17 课的“深入一点”）'],
      ['列表页、详情页 <code>/movie/:id</code>、收藏页三个路由；搜索词放在 URL 里', 'React Router（第 33 课）'],
      ['用 useQuery 获取数据，切换页面后返回时秒开', 'TanStack Query（第 34 课）'],
      ['收藏列表用 Zustand 管理并持久化', '状态架构（第 27 课）'],
      ['详情页懒加载，图片列表滚动流畅', 'lazy 与 Suspense（第 22 课）、性能优化（第 20 课）、虚拟列表（第 24 课）'],
    ]),
    warn('<code>VITE_</code> 开头的环境变量会被打包进前端代码，任何人都能看到。只放可以公开的值，例如 TMDB 的只读令牌。需要保密的密钥，要放到服务端代理或 serverless 函数里。'),
    h('项目三：团队任务看板（Next.js 全栈）'),
    p('预计工时：约 25–40 小时。鉴权、数据库和部署第一次做都要花时间。'),
    table(['要求', '用到的知识'], [
      ['登录注册，每个用户只能看到自己团队的数据。用成熟的鉴权库（如 Auth.js）或托管的认证服务，不要自己存密码', '权限校验（第 36 课）：每个 Server Function 和每次服务端读数据，都要检查用户身份'],
      ['看板数据存数据库（如 PostgreSQL + Prisma），在服务端组件中读取', 'Server Components（第 29、36 课）'],
      ['拖动或点击移动卡片时立即生效，失败自动回滚并提示用户', 'useOptimistic（第 28 课）、reducer（第 11 课）'],
      ['部署到 Vercel 等平台，拥有一个可以分享的网址', '工程化（第 31 课）'],
    ]),
    h('加分项：把第六阶段用进项目'),
    p('三个项目都能用到第六阶段的内容。每个项目至少挑两项做进去，并在 README 里写清楚你的取舍。'),
    table(['加分项', '适合的项目', '用到的知识'], [
      ['表单用一份 schema 在前后端共用；异步校验没有竞态；提交中不能重复提交', '项目一、项目三', '表单与校验架构（第 42 课）'],
      ['详情页用 Suspense 读取数据，没有请求瀑布；切换电影时保留旧内容', '项目二', 'Suspense 数据获取（第 38 课）'],
      ['看板数据规范化存储，支持撤销和重做', '项目三', '大型应用状态架构（第 40 课）'],
      ['封装一个 headless 下拉选择组件，键盘可操作，受控和非受控都支持', '任意项目', 'Headless 组件（第 41 课）'],
      ['每个面板有可重置的错误边界；错误上报带组件栈和版本号', '项目二、项目三', '错误处理与监控（第 43 课）'],
      ['给最常用的交互定一个性能预算，用 Profiler 记录优化前后的提交次数', '任意项目', '性能诊断实战（第 44 课）'],
      ['服务端渲染没有水合不匹配警告；慢数据放进 Suspense 流式输出', '项目三', '流式 SSR 与水合（第 39 课）'],
    ]),
    h('验收清单：什么时候算“做完了”？'),
    p('每个项目上线前，按下表逐条操作。<b>看到“应该看到”的结果，才算这一条通过。</b>不凭感觉打勾。'),
    table(['类别', '怎样操作', '应该看到'], [
      ['功能', '按需求表逐条操作一遍。同时打开浏览器控制台', '每条需求都能完成；控制台没有红色报错，也没有 key 警告'],
      ['功能', '添加几条数据，然后刷新页面', '数据还在（项目一存在 localStorage，项目三存在数据库）'],
      ['出错', '在 DevTools 的 Network 面板选 Offline，再执行一次需要请求的操作', '页面显示错误提示和“重试”按钮。恢复网络后点重试，操作成功'],
      ['加载', '在 Network 面板选 Slow 3G，刷新页面', '先显示加载中界面，而不是空白；数据到达时布局不跳动'],
      ['空数据', '搜索一个不存在的词；或清空所有数据', '显示“没有找到”“还没有记录”这类提示，而不是一片空白'],
      ['竞态', '在搜索框里快速连续输入 5 个字', '最后显示的是最后一个词的结果，不会被旧结果覆盖'],
      ['状态设计', '打开 React DevTools 的 Components 面板，逐个看 state', '找不到能由其他 state 算出来的 state，例如“合计”“筛选后的列表”'],
      ['URL', '把带搜索词或页码的链接复制到新标签页打开', '看到同样的结果'],
      ['性能', '用 React DevTools Profiler 录制一次输入', '和输入无关的大组件没有跟着重新渲染'],
      ['无障碍', '拔掉鼠标，只用 Tab、Shift+Tab、Enter、空格、Esc 完成核心流程', '每一步都能完成，并且能看见焦点在哪里；弹窗关闭后焦点回到打开它的按钮'],
      ['无障碍', '运行 Lighthouse 的“无障碍”检查', '得分 ≥ 90'],
      ['测试', '运行 <code>npm test</code>；再按下一节“自我检验”故意改坏一处', '全部通过；改坏后至少一个测试变红，改回后全绿'],
      ['交付', '推送代码到 GitHub', 'GitHub Actions 自动运行 <code>tsc --noEmit</code>、ESLint 和测试，全部通过'],
      ['交付', '用手机打开线上网址', '页面能正常使用，没有横向滚动条'],
      ['交付', '打开 README', '有截图、线上链接、三个设计取舍，以及“最难的问题和解决方法”'],
    ]),
    h('自我检验：给核心流程写 3 个测试'),
    p('验收清单里的“测试”一条，按下面的步骤完成。方法和第 35 课的练习相同：好测试要能抓住 bug。'),
    ({ t: 'call', kind: 'tip', label: '步骤', html: '<ol class="task-steps"><li>选出 3 个核心流程。例如记账本：添加一笔支出后合计更新；删除时点“取消”，数据还在；切换月份后只显示这个月的记录。</li><li>每个流程写一个测试：<code>render</code> → 用 <code>userEvent</code> 操作 → 断言用户看到的<b>确切</b>结果，例如金额、条数。用 <code>getByRole</code> 和 <code>getByLabelText</code> 找元素。</li><li>故意改坏一处代码，例如合计少加一项，或删除时不弹确认。运行测试：至少一个应该变红。</li><li>如果全是绿的，说明断言不够具体。回到第 2 步，把断言改成确切的值。</li><li>有网络请求的流程，再用 MSW 让接口返回 500，测试错误提示会出现。</li></ol>' }),
    code(`it('添加一笔支出后，本月合计增加', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText('金额'), '25');
  await user.click(screen.getByRole('button', { name: '记一笔' }));
  // 断言确切的金额：如果合计少加了一项，这一行会失败
  expect(screen.getByText('本月支出：¥25.00')).toBeInTheDocument();
});`, '项目一的第一个测试可以这样写'),
    tip('把每个项目放到 GitHub 上，并写一份 README。README 包含：截图、功能列表、技术栈，以及<b>你遇到的最难的问题和解决方法</b>。这一段最能体现你的水平，面试官也最爱看。'),
    h('把作品变成面试素材'),
    ul([
      '每个项目准备 2 分钟讲解：解决什么问题；一个关键的设计取舍；如果重做，你会改什么。',
      '能现场写出三个小组件：带防抖的搜索、键盘能操作、读屏软件能读出的标签页、带 reducer 的表单。先回到对应的课，不看答案重写一遍。',
      '给一个开源 React 项目提 1 个文档或测试相关的 PR。',
    ]),
    h('怎样算“精通”？'),
    p('与其问学了多少 API，不如用下面这些问题检验自己。如果都能清楚地回答，并且在项目里做到了，你就已经超过了大多数 React 开发者：'),
    ul(['看到一个 bug，能判断它是渲染问题、状态设计问题，还是 effect 依赖问题', '能说清楚某个状态为什么放在这里，而不是父组件、Context 或 URL 里', '页面卡顿时，会先用 Profiler 定位，而不是到处加 useMemo', '能给团队设计一个好用的公共组件，别人不看文档也能用对', '读得懂 React 官方文档中的每一个“深入探讨”和“陷阱”小节', '新特性发布时，能读懂它解决的问题，并判断自己的项目是否需要']),
    like('学游泳时，岸上的课程教你动作、换气和水的原理。但你真正学会游泳，是在第一次独自游完一个来回的时候。这门课是岸上的部分，现在该下水了。'),
    p('祝贺你完成了全部课程！遇到问题时，随时回来翻翻对应的那一课。'),
  ],
  quiz: [
    { q: '记账本做完了。下面哪项检查最能说明“出错状态”真的处理好了？', options: ['代码里每个 fetch 都包了 try/catch，并在 catch 里打印日志', '断网后操作出现错误提示；恢复网络后点重试能成功', '浏览器控制台里没有任何报错', 'Lighthouse 性能得分达到 100'], answer: 1, explain: '验收要看用户看到的结果。try/catch 只说明错误被捕获了，不说明用户看到了提示，也不说明能重试。控制台没有报错，可能只是因为错误被悄悄吞掉了。Lighthouse 性能分和出错处理无关。' },
    { q: '你写了测试“添加‘午饭 25 元’后，列表里出现‘午饭’”。你故意把合计改成少加一项，测试仍然全绿。说明什么？', options: ['测试运行器坏了，需要重装依赖', '断言不够具体：应该断言确切的合计金额', '应该改成断言组件内部 total state 的值，这样最准确', '应该改用 getByTestId 找元素'], answer: 1, explain: '测试只断言了“午饭出现了”，合计错了它也看不见。要断言用户看到的确切结果，例如“本月支出：¥25.00”。断言内部 state 是最常见的误解：它测的是实现细节，重构时会误报。改用 getByTestId 只改变了找元素的方式，没有改变断言了什么。' },
    { q: 'TMDB 密钥写在 VITE_TMDB_KEY 里，安全吗？', options: ['安全：.env 文件写在 .gitignore 里，不会上传到 GitHub', '不安全：VITE_ 变量会打包进前端代码', '安全：Vite 会在构建时自动加密 VITE_ 开头的变量', '只要把 GitHub 仓库设为私有，就是安全的'], answer: 1, explain: 'VITE_ 开头的变量会在构建时直接写进 JS 文件，任何人打开开发者工具都能看到。最有迷惑性的是 .gitignore：它只保证密钥不进仓库，但构建出的前端代码里照样有它。需要保密的密钥要放到服务端代理或 serverless 函数里。' },
  ],
});
