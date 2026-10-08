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
  mins: 40,
  localMins: 60,
  summary: '用文件夹定义路由，在服务端取数据，用 Server Function 处理表单。',
  goals: [
    '能根据 app/ 目录说出一个 URL 对应哪个 page.tsx、套着哪几层 layout.tsx、params 是什么',
    '能判断数据该在服务端组件、Server Function、Route Handler 还是 TanStack Query 里获取',
    '能解释 Server Function 为什么必须自己校验登录和输入',
    "能找出“整页标成 'use client'”这类错误，只把交互部件拆成客户端组件",
  ],
  keyPoints: [
    '文件夹就是路由：<code>app/blog/[slug]/page.tsx</code> 对应 <code>/blog/任意一段</code>，值在 params.slug 里。静态文件夹优先于动态文件夹。',
    '<code>layout.tsx</code> 从外到内一层套一层；<code>loading.tsx</code> 和 <code>error.tsx</code> 就是框架自动加的 Suspense 和错误边界。',
    '页面默认是服务端组件，可以直接 <code>await</code> 查库，不需要 useEffect 和 loading state。',
    'Server Function 本质上是一个公开的 HTTP 接口。每次都要在函数里检查登录，并校验 formData。',
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
      q: 'Server Function 里为什么必须做权限校验？',
      options: [
        '只有页面里的 &lt;form&gt; 能调用它，所以只需在页面里校验',
        '它其实是公开的 HTTP 接口，谁都能直接调用',
        'proxy.ts（旧名 middleware）已经拦截了所有未登录的请求，函数里不用再查一遍',
        '只有用了 revalidatePath 时才需要校验',
      ],
      answer: 1,
      explain:
        "'use server' 函数会暴露为可被网络请求调用的端点。别人不用打开你的页面，也能直接发请求调用它。“Proxy 已经拦截”最有迷惑性：Server Function 是发到所在页面路由的 POST 请求。Proxy 的 matcher 漏掉这条路径，或者函数后来被别的页面使用，拦截就悄悄失效。而且 Proxy 只看请求，不知道这个用户能不能改这条数据。权限要在函数里检查。（Next.js 16 起 middleware 改名为 proxy。）",
    },
    {
      q: `项目的 app 目录如下。访问 <code>/shop/42</code> 时，页面外面一共套了几层 layout？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">app/
  layout.tsx
  shop/
    layout.tsx
    [id]/
      page.tsx
      reviews/
        layout.tsx
        page.tsx</code></pre></div>`,
      options: ['1 层：只有根布局', '3 层：再加上 reviews 的布局', '没有布局：[id] 文件夹里没有 layout.tsx', '2 层：根布局和 shop 布局'],
      answer: 3,
      explain:
        '/shop/42 对应 app/shop/[id]/page.tsx。layout 按“页面所在文件夹和它的每一层上级文件夹”收集：app 和 shop 里各有一个，[id] 里没有。reviews/layout.tsx 只属于 /shop/42/reviews 这类页面，访问 /shop/42 时不会用到它。没有 layout 的文件夹不会让外层布局失效。',
    },
    {
      q: '移动端 App 和第三方合作方都要读取商品列表的 JSON。商品页自己也要显示同样的数据。接口放在哪里最合适？',
      options: [
        '在客户端组件里用 TanStack Query 请求，别人也照着请求页面',
        '写成 Server Function，让别的程序直接调用',
        '在 app/api/products/route.ts 里写 Route Handler；商品页自己直接调用同一个数据层函数，不用请求这个接口',
        '在 layout.tsx 里把数据写进全局变量，别人读这个变量',
      ],
      answer: 2,
      explain:
        '给第三方或移动端提供接口，用 Route Handler（route.ts），它有稳定的 URL 和 HTTP 语义。页面自己在服务端组件里直接调用数据层函数，少一次网络往返。Server Function 是给你自己的界面提交数据用的，URL 和调用格式不是公开约定。TanStack Query 用在客户端高频交互里，不能替别人提供接口。',
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

  // 2. 逐个试 page.tsx。这里用“静态段更多的优先”做简化（Next.js 的真实规则是从左到右逐段比较，每一段都是静态文件夹优先）
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

  // 2. 逐个试 page.tsx。这里用“静态段更多的优先”做简化（Next.js 的真实规则是从左到右逐段比较，每一段都是静态文件夹优先）
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
    hint: "把 <code>'app/blog/[slug]/page.tsx'</code> 变成段数组 <code>['blog', '[slug]']</code>，和 URL 的段数组逐段比较。段数必须相同。多个文件都匹配时，比较谁的静态段更多（这是简化；Next.js 的真实规则是从左到右逐段比较，每一段都是静态文件夹优先）。",
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
    {
      q: `Next.js 16.4 新建的项目默认开启 Cache Components。下面的页面在开发时会报 blocking-route 错误。怎样改最合适？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">// app/dashboard/page.tsx（没有 loading.tsx）
export default async function Page() {
  const user = (await cookies()).get('uid')?.value;
  return &lt;h1&gt;你好，{user}&lt;/h1&gt;;
}</code></pre></div>`,
      options: [
        "把页面改成 'use client'，在 useEffect 里读 cookie",
        '把读取 cookie 的部分拆成组件，包在 <Suspense> 里；或者在 app/dashboard/ 下加 loading.tsx',
        '在页面顶部加 export const dynamic = "force-static"',
        "给 cookies() 的结果加 'use cache'",
      ],
      answer: 1,
      explain:
        "新模型里，没缓存的数据和运行时数据（cookies、headers、searchParams）必须放在 Suspense 里，请求时流式返回；loading.tsx 就是一层 Suspense。cookie 因人而异，不能用 'use cache' 缓存给所有人。“改成客户端组件”会放弃服务端取数据，是本课讲的最常见错误。具体报错和选项以所用版本的官方文档为准。",
    },
    {
      q: `用户在评论区提交评论，Server Function 写库之后，页面要<b>马上</b>显示这条新评论（评论列表用 <code>'use cache'</code> 缓存，打了 <code>cacheTag('comments')</code> 标签）。应该怎么调用？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">'use server';
export async function addComment(formData) {
  // ……校验、写库
  // ← 这里调用哪个？
}</code></pre></div>`,
      options: [
        "revalidateTag('comments', 'max')：下一个请求先拿到旧列表，后台再重新生成",
        '什么都不用调：缓存会自己感知数据库变化',
        "updateTag('comments')：内容立刻失效，下一个请求等待新内容",
        '在 proxy.ts 里调用 updateTag',
      ],
      answer: 2,
      explain:
        "updateTag 只能在 Server Function 里用，专门处理“提交后马上要看到自己的修改”：条目立刻失效，下一个请求等新内容。revalidateTag(tag, 'max') 是先给旧内容、后台刷新，适合稍有延迟也没关系的内容，提交者可能看到旧列表。缓存不会自己感知数据库变化，要么等 revalidate 到期，要么主动让它失效。Proxy 里不能调用这两个函数。",
    },
    {
      q: `目录如下。访问 <code>/about</code> 时，<code>about/page.tsx</code> 外面套着哪些 layout？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">app/
  layout.tsx
  (marketing)/
    layout.tsx
    about/
      page.tsx
  (shop)/
    layout.tsx
    cart/
      page.tsx</code></pre></div>`,
      options: [
        '只有 app/layout.tsx：圆括号文件夹里的 layout 不参与',
        'app/layout.tsx 和 app/(marketing)/layout.tsx',
        '三层：app、(marketing) 和 (shop) 的 layout',
        '没有匹配：URL 里没有 (marketing)，所以 /about 找不到页面',
      ],
      answer: 1,
      explain:
        '路由组（圆括号文件夹）不出现在 URL 里，所以 /about 对应 app/(marketing)/about/page.tsx。但它仍然是一层文件夹：它里面的 layout.tsx 会套在页面外面，由此可以让一组页面共用布局。(shop) 是另一个分支，和 /about 无关。',
    },
  ],
  plays: {
    '模拟：layout 保留 state，template 重新挂载': {
      note: 'layout 里的搜索框保持“报表”：在共用 layout 的页面之间导航时，layout 不会重新挂载，只有 page 被换掉。template 每次导航都创建新实例，里面的 state 重置，搜索框被清空。示例里用 key 随 url 变化来表示这一点。',
      predict: {
        q: '在两个搜索框里都输入“报表”，再点“去 /dashboard/b”。两个搜索框里分别是什么？',
        options: ['layout 的搜索框保留“报表”，template 的被清空', '两个都被清空', '两个都保留“报表”', 'layout 的被清空，template 的保留“报表”'],
        answer: 0,
        explain:
          'layout 在导航时保留，它里面的 state 不丢；template 每次导航都重新创建，state 重置。想要“每次进入新页面都重新开始”（例如重新触发进入动画、重置表单），用 template。',
      },
      pkey: 'nextjs|模拟：layout 保留 state，template 重新挂载',
    },
    '模拟：缓存、过期与重新验证': {
      note: '第 70 秒距离第一次生成已经过了 60 秒（revalidate），所以那次访问先拿到旧的 v1，同时后台重新生成了 v2；第 80 秒才看到 v2。revalidateTag 之后，下一次访问仍先拿到旧的 v2；updateTag 之后，下一次访问等待新内容，直接显示 v4。时间线是简化的：真实环境还有浏览器端的路由缓存，页面可能比这里更晚才更新。',
      predict: {
        q: '数据库在第 0 秒之后被改成了 v2。控制台里“第 70 秒，访问”这一行显示什么？',
        options: ['v2：数据库已经是新的了', '等待重新生成后显示 v2', 'v1：先返回旧内容，后台重新生成', '报错：缓存已经过期'],
        answer: 2,
        explain:
          'revalidate（60 秒）到期后，下一个请求先拿到缓存里的旧内容，同时服务器在后台重新生成；新内容从再下一个请求起可见。要等新内容的情况只发生在没有缓存，或超过 expire 时。',
      },
      pkey: 'nextjs|模拟：缓存、过期与重新验证',
    },
  },
} satisfies Lesson;
