import type { Lesson } from '../types.ts';

// 检查用的文件列表：和起始代码不同，而且故意把动态段放在静态段前面
const FILES2 = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/team/[member]/page.tsx',
  'app/team/layout.tsx',
  'app/team/page.tsx',
  'app/team/join/page.tsx',
  'app/shop/[category]/[id]/page.tsx',
  'app/shop/[category]/layout.tsx',
  'app/admin/layout.tsx',
  'app/admin/users/page.tsx',
  'app/about/page.tsx',
];
const R = 'app/layout.tsx';
const CASES: [string, any, string][] = [
  ['/', { page: 'app/page.tsx', layouts: [R], params: {} }, '根路径 / 对应 app/page.tsx（步骤 2）'],
  ['/about', { page: 'app/about/page.tsx', layouts: [R], params: {} }, '只收集页面所在文件夹及其上级文件夹的 layout.tsx（步骤 4）'],
  ['/team', { page: 'app/team/page.tsx', layouts: [R, 'app/team/layout.tsx'], params: {} }, 'layouts 从外到内：先根布局，再 team 的布局（步骤 4）'],
  [
    '/team/join',
    { page: 'app/team/join/page.tsx', layouts: [R, 'app/team/layout.tsx'], params: {} },
    '静态段优先：/team/join 应匹配 team/join，而不是 [member]（步骤 3）',
  ],
  [
    '/team/ann',
    { page: 'app/team/[member]/page.tsx', layouts: [R, 'app/team/layout.tsx'], params: { member: 'ann' } },
    '[member] 匹配任意一段，并放进 params（步骤 3）',
  ],
  [
    '/shop/books/42',
    { page: 'app/shop/[category]/[id]/page.tsx', layouts: [R, 'app/shop/[category]/layout.tsx'], params: { category: 'books', id: '42' } },
    '两个动态段都要进 params；动态文件夹里的 layout.tsx 也算（步骤 3、4）',
  ],
  ['/about/', { page: 'app/about/page.tsx', layouts: [R], params: {} }, '结尾的 / 不影响匹配（步骤 2）'],
  ['/team?tab=2', { page: 'app/team/page.tsx', layouts: [R, 'app/team/layout.tsx'], params: {} }, '? 后面是查询参数（searchParams），不参与路由匹配（步骤 2）'],
  ['/shop/books', null, '/shop/books 没有 page.tsx，应返回 null（步骤 5）'],
  ['/admin', null, 'app/admin/ 只有 layout.tsx，没有 page.tsx。/admin 应返回 null（步骤 5）'],
  ['/team/ann/extra', null, '一个 [member] 只匹配一段。/team/ann/extra 应返回 null（步骤 3、5）'],
  ['/nope', null, '没有对应文件夹时应返回 null（步骤 5）'],
];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sortObj = o =>
  Object.keys(o || {})
    .sort()
    .reduce((m, k) => {
      m[k] = o[k];
      return m;
    }, {});
// 非正文数据。课文在 docs/lessons/nextjs.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'nextjs',
  stage: 4,
  title: 'Next.js App Router',
  mins: 25,
  summary: '用文件夹定义路由，在服务端取数据，用 Server Actions 处理表单。',
  goals: [
    '能根据 app/ 目录说出一个 URL 对应哪个 page.tsx、套着哪几层 layout.tsx、params 是什么',
    '能判断数据该在服务端组件、Server Function、Route Handler 还是 TanStack Query 里获取',
    '能解释 Server Action 为什么必须自己校验登录和输入',
    "能找出“整页标成 'use client'”这类错误，只把交互部件拆成客户端组件",
  ],
  keyPoints: [
    '文件夹就是路由：<code>app/blog/[slug]/page.tsx</code> 对应 <code>/blog/任意一段</code>，值在 params.slug 里。静态文件夹优先于动态文件夹。',
    '<code>layout.tsx</code> 从外到内一层套一层；<code>loading.tsx</code> 和 <code>error.tsx</code> 就是框架自动加的 Suspense 和错误边界。',
    '页面默认是服务端组件，可以直接 <code>await</code> 查库，不需要 useEffect 和 loading state。',
    'Server Action 本质上是一个公开的 HTTP 接口。每次都要在函数里检查登录，并校验 formData。',
    "最常见的坑：把整个页面标成 <code>'use client'</code>，等于退回传统 SPA。只把按钮、表单这类交互部件拆出去。",
  ],
  quiz: [
    {
      q: '项目里同时有 <code>app/blog/[slug]/page.tsx</code> 和 <code>app/blog/new/page.tsx</code>。访问 /blog/new，会渲染哪个页面？',
      options: ['[slug] 页面，params.slug 是 "new"', 'new/page.tsx，静态文件夹优先于动态文件夹', '两个都渲染，按文件名排序', '构建时报错：两个路由冲突'],
      answer: 1,
      explain:
        '能精确匹配的静态段优先，动态段 [slug] 只在没有静态匹配时才接手。“params.slug 是 new”最有迷惑性：[slug] 确实能匹配任意一段，但它的优先级更低。本课练习的 resolveRoute 实现的就是这条规则。',
    },
    {
      q: '/blog 的数据要查很久。想在等待时显示“加载中”，最简单的做法是？',
      options: [
        '在 page.tsx 里用 useState 记录 isLoading，数据回来前显示加载中',
        '在 app/blog/ 下新建 loading.tsx',
        '在 app/blog/ 下新建 error.tsx',
        "给 page.tsx 加 'use client'，再用 useEffect 请求数据",
      ],
      answer: 1,
      explain:
        'loading.tsx 会被自动用作这一段路由的 Suspense fallback。page.tsx 默认是服务端组件，不能用 useState。改成客户端组件加 useEffect 虽然能做到，但放弃了服务端取数据，也就是本课讲的最常见错误。error.tsx 是出错时的界面，不是加载界面。',
    },
    {
      q: 'Server Action 里为什么必须做权限校验？',
      options: [
        '只有页面里的 &lt;form&gt; 能调用它，所以只需在页面里校验',
        '它其实是公开的 HTTP 接口，谁都能直接调用',
        '中间件已经拦截了所有未登录的请求，函数里不用再查一遍',
        '只有用了 revalidatePath 时才需要校验',
      ],
      answer: 1,
      explain:
        "'use server' 函数会暴露为可被网络请求调用的端点。别人不用打开你的页面，也能直接发请求调用它。“中间件已经拦截”最有迷惑性：中间件的匹配规则可能漏掉某些路径，而且它只看请求，不知道这个用户有没有权限改这条数据。权限要在函数里检查。",
    },
  ],
  exercise: {
    task: '<p>本页不能运行 Next.js。这道练习实现它的核心规则：<b>文件夹就是路由</b>。</p><ol class="task-steps"><li>完成 <code>resolveRoute(url, files)</code>。只用参数 <code>files</code>，不要写死 <code>FILES</code>。</li><li>只看 URL 的路径部分：忽略 <code>?</code> 和 <code>#</code> 之后的内容，忽略结尾的 <code>/</code>。<code>/</code> 对应 <code>app/page.tsx</code>。</li><li>找到匹配的 <code>page.tsx</code>，结果放进 <code>page</code>。<code>[slug]</code> 这样的文件夹匹配任意<b>一段</b>，值放进 <code>params</code>，例如 <code>{ slug: \'hello\' }</code>。同时有静态文件夹和动态文件夹能匹配时，静态优先。</li><li>收集 <code>layouts</code>：页面所在文件夹和它的每一层上级文件夹中的 <code>layout.tsx</code>，按从外到内排列。</li><li>没有匹配的 <code>page.tsx</code> 时返回 <code>null</code>。只有 <code>layout.tsx</code> 的文件夹也不是页面。</li><li>点预览里的按钮，看布局怎样一层套一层。没有动态段时，<code>params</code> 是 <code>{}</code>。</li></ol>',
    starter: `import { useState } from 'react';

// ===== app/ 目录下的文件（模拟一个 Next.js 项目） =====
const FILES = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/about/page.tsx',
  'app/blog/layout.tsx',
  'app/blog/page.tsx',
  'app/blog/[slug]/page.tsx',
  'app/blog/new/page.tsx',
  'app/shop/[category]/[id]/page.tsx',
  'app/dashboard/layout.tsx',
  'app/dashboard/settings/page.tsx',
];

// ===== 你的代码 =====
// 输入：url（例如 '/blog/hello'）和文件列表 files。
// 输出：{ page, layouts, params }。没有匹配的页面时，返回 null（Next.js 会显示 not-found）。
export function resolveRoute(url, files) {
  // TODO
  return null;
}

// ===== 预览（不用改）：布局一层套一层，页面在最里面 =====
const SAMPLES = ['/', '/about', '/blog', '/blog/hello', '/blog/new', '/shop/books/42', '/dashboard', '/dashboard/settings', '/blog?page=2', '/nope'];
function App() {
  const [url, setUrl] = useState('/blog/hello');
  let r, err;
  try { r = resolveRoute(url, FILES); } catch (e) { err = e.message; }
  const box = { border: '1px solid #8889', borderRadius: 8, padding: '6px 10px', marginTop: 6 };
  let view;
  if (err) view = <p>出错：{err}</p>;
  else if (!r) view = <div style={box}><b>404</b>：没有匹配的 page.tsx，显示 not-found</div>;
  else view = (r.layouts || []).reduceRight(
    (inner, l) => <div style={box}><small>{l}</small>{inner}</div>,
    <div style={{ ...box, borderStyle: 'dashed' }}><b>{r.page}</b><div><small>params：{JSON.stringify(r.params || {})}</small></div></div>
  );
  return (
    <div>
      <label>URL：<input value={url} onChange={e => setUrl(e.target.value)} /></label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '6px 0' }}>
        {SAMPLES.map(s => <button key={s} onClick={() => setUrl(s)}>{s}</button>)}
      </div>
      {view}
    </div>
  );
}`,
    solution: `import { useState } from 'react';

// ===== app/ 目录下的文件（模拟一个 Next.js 项目） =====
const FILES = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/about/page.tsx',
  'app/blog/layout.tsx',
  'app/blog/page.tsx',
  'app/blog/[slug]/page.tsx',
  'app/blog/new/page.tsx',
  'app/shop/[category]/[id]/page.tsx',
  'app/dashboard/layout.tsx',
  'app/dashboard/settings/page.tsx',
];

// ===== 你的代码 =====
// 输入：url（例如 '/blog/hello'）和文件列表 files。
// 输出：{ page, layouts, params }。没有匹配的页面时，返回 null（Next.js 会显示 not-found）。
export function resolveRoute(url, files) {
  // 1. 只取路径：去掉 ? 和 # 之后的部分，再按 / 拆成段
  const path = url.split(/[?#]/)[0];
  const parts = path.split('/').filter(Boolean);

  // 2. 逐个试 page.tsx。静态段更多的匹配优先
  let best = null;
  for (const file of files) {
    if (!file.endsWith('/page.tsx')) continue;
    const segs = file.split('/').slice(1, -1);      // 'app/blog/[slug]/page.tsx' → ['blog', '[slug]']
    if (segs.length !== parts.length) continue;
    const params = {};
    let statics = 0;
    let ok = true;
    segs.forEach((seg, i) => {
      const m = seg.match(/^\\[(.+)\\]$/);
      if (m) params[m[1]] = parts[i];
      else if (seg === parts[i]) statics++;
      else ok = false;
    });
    if (ok && (!best || statics > best.statics)) best = { page: file, params, statics };
  }
  if (!best) return null;

  // 3. 布局：页面所在文件夹和它的每一层上级文件夹，从外到内
  const segs = best.page.split('/').slice(1, -1);
  const layouts = [];
  for (let i = 0; i <= segs.length; i++) {
    const file = ['app', ...segs.slice(0, i), 'layout.tsx'].join('/');
    if (files.includes(file)) layouts.push(file);
  }
  return { page: best.page, layouts, params: best.params };
}

// ===== 预览（不用改）：布局一层套一层，页面在最里面 =====
const SAMPLES = ['/', '/about', '/blog', '/blog/hello', '/blog/new', '/shop/books/42', '/dashboard', '/dashboard/settings', '/blog?page=2', '/nope'];
function App() {
  const [url, setUrl] = useState('/blog/hello');
  let r, err;
  try { r = resolveRoute(url, FILES); } catch (e) { err = e.message; }
  const box = { border: '1px solid #8889', borderRadius: 8, padding: '6px 10px', marginTop: 6 };
  let view;
  if (err) view = <p>出错：{err}</p>;
  else if (!r) view = <div style={box}><b>404</b>：没有匹配的 page.tsx，显示 not-found</div>;
  else view = (r.layouts || []).reduceRight(
    (inner, l) => <div style={box}><small>{l}</small>{inner}</div>,
    <div style={{ ...box, borderStyle: 'dashed' }}><b>{r.page}</b><div><small>params：{JSON.stringify(r.params || {})}</small></div></div>
  );
  return (
    <div>
      <label>URL：<input value={url} onChange={e => setUrl(e.target.value)} /></label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '6px 0' }}>
        {SAMPLES.map(s => <button key={s} onClick={() => setUrl(s)}>{s}</button>)}
      </div>
      {view}
    </div>
  );
}`,
    exports: ['resolveRoute'],
    faded: `export function resolveRoute(url, files) {
  // 1. 只取路径：去掉 ? 和 # 之后的部分，再按 / 拆成段
  /* ✏️ path：url 在第一个 ? 或 # 之前的部分 */
  const parts = path.split('/').filter(Boolean);

  // 2. 逐个试 page.tsx。静态段更多的匹配优先
  let best = null;
  for (const file of files) {
    if (!file.endsWith('/page.tsx')) continue;
    const segs = file.split('/').slice(1, -1);      // 'app/blog/[slug]/page.tsx' → ['blog', '[slug]']
    if (segs.length !== parts.length) continue;
    const params = {};
    let statics = 0;
    let ok = true;
    segs.forEach((seg, i) => {
      const m = seg.match(/^\\[(.+)\\]$/);
      if (m) /* ✏️ 动态段：把这一段的值 parts[i] 存进 params，键名是 m[1] */;
      else if (seg === parts[i]) statics++;
      else ok = false;
    });
    /* ✏️ 匹配成功，并且静态段比目前最好的更多：更新 best */
  }
  if (!best) return null;

  // 3. 布局：页面所在文件夹和它的每一层上级文件夹，从外到内
  const segs = best.page.split('/').slice(1, -1);
  const layouts = [];
  for (let i = 0; i <= segs.length; i++) {
    /* ✏️ 拼出第 i 层的 layout.tsx 路径；它在 files 里，就放进 layouts */
  }
  return { page: best.page, layouts, params: best.params };
}`,
    hint: "把 <code>'app/blog/[slug]/page.tsx'</code> 变成段数组 <code>['blog', '[slug]']</code>，和 URL 的段数组逐段比较。段数必须相同。多个文件都匹配时，比较谁的静态段更多。",
    test: async t => {
      const fn = t.exports.resolveRoute;
      t.assert(typeof fn === 'function', '找不到函数 resolveRoute。不要改它的名字');
      for (const [url, want, why] of CASES) {
        let got: any;
        try {
          got = fn(url, FILES2.slice());
        } catch (e) {
          t.assert(false, "resolveRoute('" + url + "') 报错：" + e.message);
        }
        const show = JSON.stringify(got);
        if (want === null) {
          t.assert(got === null || got === undefined, "resolveRoute('" + url + "') 应返回 null，实际是 " + show + '。' + why);
          continue;
        }
        t.assert(got && typeof got === 'object', "resolveRoute('" + url + "') 应返回 { page, layouts, params }，实际是 " + show + '。' + why);
        t.assert(got.page === want.page, "resolveRoute('" + url + "').page 应是 " + want.page + '，实际是 ' + got.page + '。' + why);
        t.assert(
          Array.isArray(got.layouts) && same(got.layouts, want.layouts),
          "resolveRoute('" +
            url +
            "').layouts 应是 " +
            JSON.stringify(want.layouts) +
            '，实际是 ' +
            JSON.stringify(got.layouts) +
            '。只收集页面所在文件夹及其每一层上级文件夹的 layout.tsx，从外到内（步骤 4）',
        );
        t.assert(
          same(sortObj(got.params), sortObj(want.params)),
          "resolveRoute('" + url + "').params 应是 " + JSON.stringify(want.params) + '，实际是 ' + JSON.stringify(got.params) + '。' + why,
        );
      }
      t.assert(t.root.textContent.trim().length > 0, '预览是空的。不要删除 App');
    },
  },
  checkOnly: [
    {
      q: '文件 <code>app/(shop)/cart/page.tsx</code> 对应哪个 URL？',
      options: ['/(shop)/cart', '/cart', '/shop/cart', '/shop?page=cart'],
      answer: 1,
      explain: '用圆括号包住的文件夹是<b>路由组</b>。它只用来组织文件，或者让几个页面共用一个 layout，不会出现在 URL 中。所以 URL 是 <code>/cart</code>。',
    },
    {
      q: `在 Next.js App Router 中，这个页面会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">// app/counter/page.tsx
import { useState } from 'react';

export default function Page() {
  const [n, setN] = useState(0);
  return &lt;button onClick={() =&gt; setN(n + 1)}&gt;{n}&lt;/button&gt;;
}</code></pre></div>`,
      options: ['正常运行，点击加 1', '能显示 0，但点击没有反应', 'Next.js 发现用了 useState，自动把它变成客户端组件', "报错：要在文件顶部加 'use client'"],
      answer: 3,
      explain:
        "app 目录下的组件默认是服务端组件。服务端组件不能使用 useState 等 Hook，也不能绑定事件，Next.js 会报错。在文件顶部写 <code>'use client'</code>，它才成为客户端组件。更好的做法是只把按钮拆成一个小的客户端组件，页面本身留在服务器上。“自动变成客户端组件”不对：边界必须由你声明，Next.js 不会猜。",
    },
    {
      q: `<code>app/dashboard/layout.tsx</code> 里有一个搜索框（客户端组件，用 state 保存文字）。用户输入“报表”后，从 /dashboard/a 跳到 /dashboard/b。搜索框里是什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">app/dashboard/
  layout.tsx    ← 渲染 &lt;SearchBox /&gt; 和 {children}
  a/page.tsx
  b/page.tsx</code></pre></div>`,
      options: ['“报表”', '空的：layout 会从服务器重新获取并重新挂载', '空的：每次导航都重新渲染整棵树', '只有用 <a> 跳转时才保留'],
      answer: 0,
      explain:
        '在共用同一个 layout 的页面之间导航，layout 不会重新挂载，只有 children 部分被替换。所以 SearchBox 的 state 保留。用 <code>&lt;a&gt;</code> 会让整页刷新，state 反而全部丢失。需要每次导航都重置时，改用 <code>template.tsx</code>：它在每次导航时都创建新实例。',
    },
  ],
  plays: {},
} satisfies Lesson;
