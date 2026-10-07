/* ========== 后加的练习：Next.js（迷你文件系统路由） ========== */
(function () {
  const HEAD = `import { useState } from 'react';

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
`;

  const STARTER_FN = `export function resolveRoute(url, files) {
  // TODO
  return null;
}
`;

  const SOLUTION_FN = `export function resolveRoute(url, files) {
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
`;

  const TAIL = `
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
}`;

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
  const CASES = [
    ['/', { page: 'app/page.tsx', layouts: [R], params: {} }, '根路径 / 对应 app/page.tsx（步骤 2）'],
    ['/about', { page: 'app/about/page.tsx', layouts: [R], params: {} }, '只收集页面所在文件夹及其上级文件夹的 layout.tsx（步骤 4）'],
    ['/team', { page: 'app/team/page.tsx', layouts: [R, 'app/team/layout.tsx'], params: {} }, 'layouts 从外到内：先根布局，再 team 的布局（步骤 4）'],
    ['/team/join', { page: 'app/team/join/page.tsx', layouts: [R, 'app/team/layout.tsx'], params: {} }, '静态段优先：/team/join 应匹配 team/join，而不是 [member]（步骤 3）'],
    ['/team/ann', { page: 'app/team/[member]/page.tsx', layouts: [R, 'app/team/layout.tsx'], params: { member: 'ann' } }, '[member] 匹配任意一段，并放进 params（步骤 3）'],
    ['/shop/books/42', { page: 'app/shop/[category]/[id]/page.tsx', layouts: [R, 'app/shop/[category]/layout.tsx'], params: { category: 'books', id: '42' } }, '两个动态段都要进 params；动态文件夹里的 layout.tsx 也算（步骤 3、4）'],
    ['/about/', { page: 'app/about/page.tsx', layouts: [R], params: {} }, '结尾的 / 不影响匹配（步骤 2）'],
    ['/team?tab=2', { page: 'app/team/page.tsx', layouts: [R, 'app/team/layout.tsx'], params: {} }, '? 后面是查询参数（searchParams），不参与路由匹配（步骤 2）'],
    ['/shop/books', null, '/shop/books 没有 page.tsx，应返回 null（步骤 5）'],
    ['/admin', null, 'app/admin/ 只有 layout.tsx，没有 page.tsx。/admin 应返回 null（步骤 5）'],
    ['/team/ann/extra', null, '一个 [member] 只匹配一段。/team/ann/extra 应返回 null（步骤 3、5）'],
    ['/nope', null, '没有对应文件夹时应返回 null（步骤 5）'],
  ];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const sortObj = (o) => Object.keys(o || {}).sort().reduce((m, k) => { m[k] = o[k]; return m; }, {});

  LESSONS.find(l => l.id === 'nextjs').exercise = {
    task: '<p>本页不能运行 Next.js。这道练习实现它的核心规则：<b>文件夹就是路由</b>。</p>'
      + '<ol class="task-steps">'
      + '<li>完成 <code>resolveRoute(url, files)</code>。只用参数 <code>files</code>，不要写死 <code>FILES</code>。</li>'
      + '<li>只看 URL 的路径部分：忽略 <code>?</code> 和 <code>#</code> 之后的内容，忽略结尾的 <code>/</code>。<code>/</code> 对应 <code>app/page.tsx</code>。</li>'
      + '<li>找到匹配的 <code>page.tsx</code>，结果放进 <code>page</code>。<code>[slug]</code> 这样的文件夹匹配任意<b>一段</b>，值放进 <code>params</code>，例如 <code>{ slug: \'hello\' }</code>。同时有静态文件夹和动态文件夹能匹配时，静态优先。</li>'
      + '<li>收集 <code>layouts</code>：页面所在文件夹和它的每一层上级文件夹中的 <code>layout.tsx</code>，按从外到内排列。</li>'
      + '<li>没有匹配的 <code>page.tsx</code> 时返回 <code>null</code>。只有 <code>layout.tsx</code> 的文件夹也不是页面。</li>'
      + '<li>点预览里的按钮，看布局怎样一层套一层。没有动态段时，<code>params</code> 是 <code>{}</code>。</li>'
      + '</ol>',
    starter: HEAD + STARTER_FN + TAIL,
    solution: HEAD + SOLUTION_FN + TAIL,
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
    hint: '把 <code>\'app/blog/[slug]/page.tsx\'</code> 变成段数组 <code>[\'blog\', \'[slug]\']</code>，和 URL 的段数组逐段比较。段数必须相同。多个文件都匹配时，比较谁的静态段更多。',
    test: async (t) => {
      const fn = t.exports.resolveRoute;
      t.assert(typeof fn === 'function', '找不到函数 resolveRoute。不要改它的名字');
      for (const [url, want, why] of CASES) {
        let got;
        try { got = fn(url, FILES2.slice()); } catch (e) { t.assert(false, 'resolveRoute(\'' + url + '\') 报错：' + e.message); }
        const show = JSON.stringify(got);
        if (want === null) {
          t.assert(got === null || got === undefined, 'resolveRoute(\'' + url + '\') 应返回 null，实际是 ' + show + '。' + why);
          continue;
        }
        t.assert(got && typeof got === 'object', 'resolveRoute(\'' + url + '\') 应返回 { page, layouts, params }，实际是 ' + show + '。' + why);
        t.assert(got.page === want.page, 'resolveRoute(\'' + url + '\').page 应是 ' + want.page + '，实际是 ' + got.page + '。' + why);
        t.assert(Array.isArray(got.layouts) && same(got.layouts, want.layouts),
          'resolveRoute(\'' + url + '\').layouts 应是 ' + JSON.stringify(want.layouts) + '，实际是 ' + JSON.stringify(got.layouts) + '。只收集页面所在文件夹及其每一层上级文件夹的 layout.tsx，从外到内（步骤 4）');
        t.assert(same(sortObj(got.params), sortObj(want.params)),
          'resolveRoute(\'' + url + '\').params 应是 ' + JSON.stringify(want.params) + '，实际是 ' + JSON.stringify(got.params) + '。' + why);
      }
      t.assert(t.root.textContent.trim().length > 0, '预览是空的。不要删除 App');
    },
  };
})();
