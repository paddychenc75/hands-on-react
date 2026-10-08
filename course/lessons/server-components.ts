import type { Lesson } from '../types.ts';

// 练习检查用的模拟数据：每个用例开始前把数据库和会话恢复成这个样子
const P1_TITLE = 'Alice 的第一篇';
const P2_TITLE = 'Bob 的笔记';
// 非正文数据。课文在 docs/lessons/server-components.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'server-components',
  stage: 3,
  title: 'Server Components 与全栈 React',
  mins: 35,
  summary: '组件在服务器上运行意味着什么？SSR、RSC、Server Functions 一次讲清。',
  goals: [
    '能按顺序说出一次页面请求经过的步骤：服务端组件 → SSR → 水合',
    '能判断一个组件该是服务端组件还是客户端组件，并把 "use client" 放在叶子上',
    '能找出跨越服务端和客户端边界的不可序列化 props',
    '能为 Server Function 写上登录、权限和输入校验',
  ],
  keyPoints: [
    'SSR 把组件渲染成 HTML，让首屏更快。水合让这份 HTML 变得可交互。',
    '组件默认是服务端组件：只在服务器运行，代码不发送到浏览器，也不需要水合。需要 state、effect 或事件处理函数时，才在文件顶部写 <code>"use client"</code>。',
    '<code>"use client"</code> 标记的是边界：被它导入的模块都会成为客户端代码，所以尽量放在叶子上。跨过边界的 props 必须可序列化，普通函数不行。',
    '<code>"use server"</code> 标记的是可以被客户端调用的服务器函数，不是服务端组件。每个 Server Function 都是公开接口，要自己检查登录、权限和输入。',
    '常见坑：水合不匹配。渲染时用了 <code>Date</code>、<code>Math.random()</code> 或 <code>window</code>，服务器和浏览器的结果就不一样。',
  ],
  quiz: [
    {
      q: '服务端组件写 &lt;AddToCart onAdded={() =&gt; console.log("ok")} /&gt;，AddToCart 是客户端组件。会怎样？',
      options: ['正常工作', '报错：函数不能序列化，不能从服务端组件传给客户端组件', '点击时，函数回到服务器上执行', '函数被悄悄忽略，onAdded 是 undefined'],
      answer: 1,
      explain:
        'props 要从服务器经过网络发到浏览器，只有可序列化的值和 Server Function 可以传。普通函数无法序列化，React 会报错，而不是悄悄忽略。“回到服务器执行”是 Server Function 的行为，普通函数没有这个能力。',
    },
    {
      q: 'app/actions.js 顶部写了 "use server"，并导出 async function deletePost(id)。哪项说法正确？',
      options: [
        'deletePost 只能被服务端组件调用，浏览器里的代码调不到它',
        '它成了公开接口，任何人都能调用，要检查权限',
        'deletePost 的代码会被打包进浏览器',
        '"use server" 让这个文件里的组件变成服务端组件',
      ],
      answer: 1,
      explain:
        '"use server" 标记的是可以被客户端调用的服务器函数。框架为它生成接口，浏览器通过网络调用它，函数代码留在服务器。第一项是最危险的误解：以为“server”就代表外人调不到，于是省掉权限检查。组件默认就是服务端组件，不需要标记。',
    },
    {
      q: '商品页是服务端组件，里面只有“加入购物车”按钮需要点击。"use client" 写在哪里最好？',
      options: ['写在商品页 page.jsx 的顶部', '写在只包含按钮的 AddToCart.jsx 顶部', '写在根布局 layout.jsx 的顶部，一次覆盖所有页面', '每个文件都写'],
      answer: 1,
      explain:
        '"use client" 标记的是边界：被它导入的所有模块都会打包到浏览器。写在叶子 AddToCart 上，商品列表、数据库查询都留在服务器。写在 page.jsx 上，整个页面都变成客户端代码，还不能直接查数据库。',
    },
    {
      q: '用户第一次打开一个用了服务端组件的页面。下面哪个顺序是对的？',
      options: [
        '浏览器下载全部 JS → 水合 → 服务器运行服务端组件 → 显示 HTML',
        '服务器运行服务端组件 → 服务器 SSR 出 HTML → 浏览器显示 HTML → 下载客户端组件的 JS → 水合',
        '服务器 SSR 出 HTML → 浏览器显示 HTML → 水合 → 服务器运行服务端组件',
        '服务器运行服务端组件 → 浏览器下载服务端组件的 JS → 水合 → 显示 HTML',
      ],
      answer: 1,
      explain:
        '先在服务器上运行服务端组件，得到 RSC Payload；再把整棵树渲染成 HTML 发给浏览器；浏览器立刻显示，但按钮还不能点；然后只下载客户端组件的 JS，水合后才可交互。最后一项错在：服务端组件的代码不会下载，也不需要水合。',
    },
  ],
  exercise: {
    task: '<p>下面是一个模拟的 Server Function <code>renamePost</code>：改文章标题。现在它谁都能调用，什么都不检查。把它补成安全的版本。</p><ol class="task-steps"><li><b>登录检查</b>：用 <code>getCurrentUser()</code> 取当前登录的用户。没登录就拒绝。</li><li><b>输入校验</b>：<code>input</code> 来自浏览器，什么都可能是。<code>postId</code> 和 <code>title</code> 都必须是字符串；<code>postId</code> 对应的文章必须存在；<code>title</code> 去掉首尾空白后长度在 1 到 50 之间。校验通过后，存入去掉首尾空白的标题。</li><li><b>权限检查</b>：只有文章的作者和 <code>role</code> 为 <code>admin</code> 的用户可以改。</li><li>“拒绝”可以是抛出 <code>Error</code>，也可以是返回 <code>{ ok: false }</code>。被拒绝时不能改动任何数据。合法请求要改成功。</li><li><code>input.authorId</code> 是浏览器顺手带来的，任何人都能把它改成别的值。判断“是谁”只能靠 <code>getCurrentUser()</code>。点预览里的按钮，看每种请求的结果。</li></ol>',
    starter: `import { useState } from 'react';

// ===== 模拟的服务器环境（不用改） =====
const db = {
  users: {
    u1: { id: 'u1', name: 'Alice', role: 'user' },
    u2: { id: 'u2', name: 'Bob', role: 'user' },
    u3: { id: 'u3', name: 'Root', role: 'admin' },
  },
  posts: {
    p1: { id: 'p1', authorId: 'u1', title: 'Alice 的第一篇' },
    p2: { id: 'p2', authorId: 'u2', title: 'Bob 的笔记' },
  },
};
// 当前请求带的登录状态。真实框架从 cookie 里取；userId 为 null 表示没登录
const session = { userId: null };
function getCurrentUser() {
  return db.users[session.userId] ?? null;
}

// ===== 你的代码 =====
// 'use server'
// input 是浏览器发来的数据，形如 { postId, title, authorId }
async function renamePost(input) {
  // TODO：登录检查 → 输入校验 → 权限检查
  const post = db.posts[input.postId];
  post.title = input.title;
  return { ok: true };
}

// ===== 预览（不用改）：模拟五种请求，数据经过 JSON 来回，和真实的网络请求一样 =====
const SCENARIOS = [
  { label: '没登录，改 p1', as: null, input: { postId: 'p1', title: '新标题', authorId: 'u1' } },
  { label: 'Bob 改 Alice 的 p1', as: 'u2', input: { postId: 'p1', title: 'Bob 来过', authorId: 'u2' } },
  { label: 'Bob 把 authorId 伪造成 u1', as: 'u2', input: { postId: 'p1', title: '伪造', authorId: 'u1' } },
  { label: 'Alice 提交空标题', as: 'u1', input: { postId: 'p1', title: '   ', authorId: 'u1' } },
  { label: 'Alice 改自己的 p1', as: 'u1', input: { postId: 'p1', title: '  改好的标题  ', authorId: 'u1' } },
];
async function send(sc) {
  session.userId = sc.as;
  const wire = JSON.parse(JSON.stringify(sc.input));
  try {
    return '成功：' + JSON.stringify(await renamePost(wire));
  } catch (e) {
    return '被拒绝：' + e.message;
  }
}
function App() {
  const [log, setLog] = useState([]);
  return (
    <div>
      <p>p1：<b>{db.posts.p1.title}</b>（作者 Alice）　p2：<b>{db.posts.p2.title}</b>（作者 Bob）</p>
      {SCENARIOS.map(sc => (
        <button key={sc.label} onClick={async () => {
          const r = await send(sc);
          setLog(l => [...l, sc.label + ' → ' + r]);
        }}>
          {sc.label}
        </button>
      ))}
      <ul>{log.map((line, i) => <li key={i}>{line}</li>)}</ul>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

// ===== 模拟的服务器环境（不用改） =====
const db = {
  users: {
    u1: { id: 'u1', name: 'Alice', role: 'user' },
    u2: { id: 'u2', name: 'Bob', role: 'user' },
    u3: { id: 'u3', name: 'Root', role: 'admin' },
  },
  posts: {
    p1: { id: 'p1', authorId: 'u1', title: 'Alice 的第一篇' },
    p2: { id: 'p2', authorId: 'u2', title: 'Bob 的笔记' },
  },
};
// 当前请求带的登录状态。真实框架从 cookie 里取；userId 为 null 表示没登录
const session = { userId: null };
function getCurrentUser() {
  return db.users[session.userId] ?? null;
}

// ===== 你的代码 =====
// 'use server'
// input 是浏览器发来的数据，形如 { postId, title, authorId }
async function renamePost(input) {
  // 1. 登录检查：身份只来自服务器自己的会话
  const user = getCurrentUser();
  if (!user) throw new Error('请先登录');

  // 2. 输入校验：浏览器发来的任何东西都不可信
  if (typeof input !== 'object' || input === null) throw new Error('参数错误');
  const { postId, title } = input;
  if (typeof postId !== 'string' || typeof title !== 'string') throw new Error('参数类型错误');
  const newTitle = title.trim();
  if (newTitle.length < 1 || newTitle.length > 50) throw new Error('标题长度要在 1 到 50 个字之间');
  const post = Object.hasOwn(db.posts, postId) ? db.posts[postId] : undefined;
  if (!post) throw new Error('文章不存在');

  // 3. 权限检查：用会话里的用户，不用 input.authorId
  if (post.authorId !== user.id && user.role !== 'admin') throw new Error('没有权限修改这篇文章');

  post.title = newTitle;
  return { ok: true };
}

// ===== 预览（不用改）：模拟五种请求，数据经过 JSON 来回，和真实的网络请求一样 =====
const SCENARIOS = [
  { label: '没登录，改 p1', as: null, input: { postId: 'p1', title: '新标题', authorId: 'u1' } },
  { label: 'Bob 改 Alice 的 p1', as: 'u2', input: { postId: 'p1', title: 'Bob 来过', authorId: 'u2' } },
  { label: 'Bob 把 authorId 伪造成 u1', as: 'u2', input: { postId: 'p1', title: '伪造', authorId: 'u1' } },
  { label: 'Alice 提交空标题', as: 'u1', input: { postId: 'p1', title: '   ', authorId: 'u1' } },
  { label: 'Alice 改自己的 p1', as: 'u1', input: { postId: 'p1', title: '  改好的标题  ', authorId: 'u1' } },
];
async function send(sc) {
  session.userId = sc.as;
  const wire = JSON.parse(JSON.stringify(sc.input));
  try {
    return '成功：' + JSON.stringify(await renamePost(wire));
  } catch (e) {
    return '被拒绝：' + e.message;
  }
}
function App() {
  const [log, setLog] = useState([]);
  return (
    <div>
      <p>p1：<b>{db.posts.p1.title}</b>（作者 Alice）　p2：<b>{db.posts.p2.title}</b>（作者 Bob）</p>
      {SCENARIOS.map(sc => (
        <button key={sc.label} onClick={async () => {
          const r = await send(sc);
          setLog(l => [...l, sc.label + ' → ' + r]);
        }}>
          {sc.label}
        </button>
      ))}
      <ul>{log.map((line, i) => <li key={i}>{line}</li>)}</ul>
    </div>
  );
}`,
    hint: '1. 先拿 <code>const user = getCurrentUser()</code>，是 <code>null</code> 就 <code>throw new Error(...)</code>。2. 校验 <code>input</code>：<code>typeof</code> 检查类型，<code>trim()</code> 后检查长度，再确认文章存在。3. 比较作者要用 <code>user.id</code> 和 <code>post.authorId</code>，不要读 <code>input.authorId</code>：那是浏览器自己写的。',
    faded: `async function renamePost(input) {
  // 1. 登录检查：身份只来自服务器自己的会话
  /* ✏️ 取 getCurrentUser()；没登录就抛出 Error */

  // 2. 输入校验：浏览器发来的任何东西都不可信
  if (typeof input !== 'object' || input === null) throw new Error('参数错误');
  const { postId, title } = input;
  if (typeof postId !== 'string' || typeof title !== 'string') throw new Error('参数类型错误');
  const newTitle = title.trim();
  /* ✏️ 标题长度不在 1 到 50 之间就抛出 Error */
  const post = Object.hasOwn(db.posts, postId) ? db.posts[postId] : undefined;
  if (!post) throw new Error('文章不存在');

  // 3. 权限检查：用会话里的用户，不用 input.authorId
  /* ✏️ 既不是作者也不是 admin：抛出 Error。作者用 post.authorId 和 user.id 比 */

  post.title = newTitle;
  return { ok: true };
}`,
    exports: ['renamePost', 'db', 'session'],
    test: async t => {
      const { renamePost, db, session } = t.exports;
      t.assert(typeof renamePost === 'function', '找不到函数 renamePost。不要改它的名字');
      t.assert(db && db.posts && session, '找不到 db 或 session。模拟环境那一段不用改');
      const reset = uid => {
        session.userId = uid;
        db.posts.p1.title = P1_TITLE;
        db.posts.p1.authorId = 'u1';
        db.posts.p2.title = P2_TITLE;
        db.posts.p2.authorId = 'u2';
      };
      // 拒绝 = 抛出错误，或返回 { ok: false } / { error }
      const attempt = async input => {
        try {
          const r = await renamePost(input);
          if (r && typeof r === 'object' && (r.ok === false || r.error)) return { rejected: true, error: null };
          return { rejected: false, error: null };
        } catch (e) {
          return { rejected: true, error: e };
        }
      };
      const unchanged = () => db.posts.p1.title === P1_TITLE && db.posts.p2.title === P2_TITLE;
      const mustReject = async (label, uid, input, why) => {
        reset(uid);
        const r = await attempt(input);
        t.assert(r.rejected, label + '：应该被拒绝，但没有。' + why);
        t.assert(unchanged(), label + '：被拒绝时不能改动数据，但标题已经变了。' + why);
        if (r.error instanceof TypeError || r.error instanceof ReferenceError) {
          t.assert(false, label + '：函数是因为程序出错（' + r.error.message + '）才失败的，不是主动拒绝。先校验输入，再使用它，并主动抛出有说明的 Error');
        }
      };
      const ok = { postId: 'p1', title: '新标题' };

      await mustReject('没登录改 p1', null, { ...ok, authorId: 'u1' }, 'Server Function 是公开接口，第一步要用 getCurrentUser() 检查登录');
      await mustReject(
        'Bob 改 Alice 的 p1',
        'u2',
        { ...ok, authorId: 'u2' },
        '登录只说明他是谁，不说明他能不能改这篇。要拿 post.authorId 和当前用户的 id 比较',
      );
      await mustReject('Alice 改 Bob 的 p2', 'u1', { postId: 'p2', title: '越权', authorId: 'u1' }, '只检查登录不够，还要检查这篇文章是不是他的');
      await mustReject(
        'Bob 伪造 authorId 等字段改 p1',
        'u2',
        { ...ok, authorId: 'u1', userId: 'u1', currentUserId: 'u1', user: { id: 'u1' }, role: 'admin' },
        '这些字段都是浏览器写的，任何人都能伪造。身份和角色只能来自服务器自己的会话（getCurrentUser()）',
      );
      for (const [label, input] of [
        ['空标题', { ...ok, title: '' }],
        ['只有空格的标题', { ...ok, title: '   ' }],
        ['数字当标题', { ...ok, title: 123 }],
        ['对象当标题', { ...ok, title: {} }],
        ['没有标题', { postId: 'p1' }],
        ['超过 50 个字的标题', { ...ok, title: 'x'.repeat(51) }],
        ['不存在的文章', { postId: 'p999', title: '新标题' }],
        ['postId 不是字符串', { postId: 42, title: '新标题' }],
        ['没有 postId', { title: '新标题' }],
        ['input 是 null', null],
        ['input 是 undefined', undefined],
      ]) {
        await mustReject('登录用户提交非法输入（' + label + '）', 'u1', input, '输入来自浏览器，什么都可能是。使用前先校验类型、长度和文章是否存在');
      }

      reset('u1');
      const mine = await attempt({ postId: 'p1', title: '  新标题  ', authorId: 'u1' });
      t.assert(!mine.rejected, '作者本人提交合法请求应该成功，却被拒绝了：' + (mine.error ? mine.error.message : '返回了 ok: false'));
      t.assert(db.posts.p1.title === '新标题', '合法请求应该把标题改成去掉首尾空白后的“新标题”，现在是“' + db.posts.p1.title + '”');
      reset('u1');
      const longest = await attempt({ postId: 'p1', title: 'x'.repeat(50) });
      t.assert(!longest.rejected && db.posts.p1.title === 'x'.repeat(50), '正好 50 个字的标题是合法的');
      reset('u1');
      const padded = await attempt({ postId: 'p1', title: '  ' + 'x'.repeat(50) + '  ' });
      t.assert(!padded.rejected && db.posts.p1.title === 'x'.repeat(50), '长度按去掉首尾空白之后算：前后各有空格的 50 个字，是合法的');
      reset('u3');
      const admin = await attempt({ postId: 'p2', title: '管理员改的' });
      t.assert(!admin.rejected && db.posts.p2.title === '管理员改的', 'role 为 admin 的用户可以修改别人的文章，却被拒绝了');
      reset(null);
      t.assert(t.root.textContent.trim().length > 0, '预览是空的。不要删除 App');
    },
  },
  checkOnly: [
    {
      q: `<code>page.js</code> 是服务端组件，<code>Tabs</code> 是客户端组件。这样写可以吗？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">// Tabs.js
'use client';
export default function Tabs({ children }) { /* 用了 useState */ }

// page.js（服务端组件）
import Tabs from './Tabs';
import Stats from './Stats'; // 服务端组件，会查数据库

export default function Page() {
  return &lt;Tabs&gt;&lt;Stats /&gt;&lt;/Tabs&gt;;
}</code></pre></div>`,
      options: [
        '可以：Stats 仍在服务器上渲染，结果作为 children 传给 Tabs',
        '报错：客户端组件里不能出现服务端组件',
        '可以，但 Stats 会变成客户端组件，在浏览器中查数据库',
        '只能把 Stats 改成 props 而不是 children',
      ],
      answer: 0,
      explain:
        '客户端组件不能 <b>import</b> 服务端组件，但可以通过 children 接收它。Stats 由服务端组件 Page 创建，在服务器上渲染。Tabs 收到的只是渲染结果。这样交互部分在客户端，数据部分留在服务器。',
    },
    {
      q: `这个组件能运行吗？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">'use client';
import { db } from './db';

export default async function Cart() {
  const items = await db.cart.findMany();
  return &lt;ul&gt;{items.map(i =&gt; &lt;li key={i.id}&gt;{i.name}&lt;/li&gt;)}&lt;/ul&gt;;
}</code></pre></div>`,
      options: [
        '不能：客户端组件不能是 async 函数',
        '能：框架会自动把它放到服务器上运行',
        '能运行，但每次渲染都会在浏览器里查一次数据库',
        '能：客户端组件也可以 await',
      ],
      answer: 0,
      explain:
        "<code>'use client'</code> 表示这个文件及它导入的模块都会发送到浏览器。客户端组件不支持 async/await，React 会报错。即使能运行，浏览器里也拿不到数据库连接，而且密钥可能泄露。修复：去掉 <code>'use client'</code>，让它成为服务端组件；需要交互的部分再拆成小的客户端组件。“框架会自动放到服务器上运行”是最常见的误解：这条指令正好表示相反的意思。",
    },
    {
      q: `下面这棵组件树默认都是服务端组件。要让它正常工作，<b>至少</b>哪些组件的文件顶部必须写 <code>'use client'</code>？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">Page            await db.product.findMany()，渲染下面三个
  Header        只显示标志和链接
  SearchBox     用 useState 保存输入的文字
  ProductList   遍历商品，渲染 ProductCard
    ProductCard   显示名称和价格，渲染 FavoriteButton
      FavoriteButton   onClick 切换收藏状态</code></pre></div>`,
      options: [
        '只有 Page：它是入口，其他组件跟着它',
        'SearchBox、FavoriteButton，以及渲染了它的 ProductCard 和 ProductList',
        'SearchBox 和 FavoriteButton',
        '所有组件：只要树里有一个客户端组件，整棵树都要标',
      ],
      answer: 2,
      explain:
        '必须标的只有用到 state、effect 或事件处理函数的组件：SearchBox（useState）和 FavoriteButton（onClick）。服务端组件可以直接渲染客户端组件，所以 ProductCard、ProductList 不用标，还能继续留在服务器。Page 要查数据库，更不能标。把 "use client" 只写在这两个叶子上，其余组件的代码都不用发给浏览器。',
    },
    {
      q: `下面三个 Server Function 都在 <code>'use server'</code> 文件里。哪一个漏掉了权限检查？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">export async function updateProfile(formData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('请先登录');
  const name = String(formData.get('name') ?? '').trim();
  if (!name || name.length &gt; 30) throw new Error('名字不合法');
  await db.user.update({ where: { id: user.id }, data: { name } });
}

export async function deleteComment(commentId) {
  const user = await getCurrentUser();
  if (!user) throw new Error('请先登录');
  await db.comment.delete({ where: { id: commentId } });
}

export async function getMyOrders() {
  const user = await getCurrentUser();
  if (!user) throw new Error('请先登录');
  return db.order.findMany({ where: { userId: user.id } });
}</code></pre></div>`,
      options: ['updateProfile', 'deleteComment', 'getMyOrders', '三个都没有问题'],
      answer: 1,
      explain:
        'deleteComment 只确认“有人登录”，没有确认“这条评论是不是他的”，任何登录用户都能删别人的评论。另外两个都把查询或更新限制在 <code>user.id</code> 上：这个 id 来自服务器自己的会话，所以只能操作自己的数据。登录检查回答“你是谁”，权限检查回答“你能不能动这条数据”，两者缺一不可。',
    },
    {
      q: `<code>setEmail</code> 这个 Server Function 的登录检查和格式检查都写了。已登录为 Bob 的人，能做什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">export async function setEmail(userId, email) {
  const user = await getCurrentUser();
  if (!user) throw new Error('请先登录');
  if (!/^[^@\\s]+@[^@\\s]+$/.test(email)) throw new Error('邮箱格式不对');
  await db.user.update({ where: { id: userId }, data: { email } });
}</code></pre></div>`,
      options: [
        '什么都做不了：已经检查了登录和格式',
        '只能改自己的邮箱，因为 getCurrentUser() 返回的是 Bob',
        '只能让函数报错，因为 userId 是浏览器传来的，会被框架丢弃',
        '把 userId 换成 Alice 的 id，直接改掉 Alice 的邮箱',
      ],
      answer: 3,
      explain:
        '<code>userId</code> 是浏览器发来的参数，Bob 可以随便填。函数只用 <code>getCurrentUser()</code> 确认了“有人登录”，却用参数去决定改谁。修复：不要接收 userId，直接用 <code>user.id</code>。框架不会丢弃参数，也不会替你判断参数里的 id 是不是当前用户。',
    },
  ],
  plays: {
    '模拟：哪些文件会进入浏览器': {
      note: "只有 AddToCart.jsx 写了 'use client'，但它 import 了 Icon.jsx，所以 Icon.jsx 也进了浏览器，一共 2 个。ProductItem、ProductList 和 page.jsx 都留在服务器：服务端组件可以渲染客户端组件，不会被它拖进浏览器。反过来，如果在 page.jsx 上勾选 'use client'，它 import 的所有文件都进浏览器。",
      predict: {
        q: '运行后，页面和控制台显示：进入浏览器的文件一共有几个？',
        options: ['1 个：只有 AddToCart.jsx', '4 个：AddToCart、ProductItem、ProductList 和 page', '2 个：AddToCart.jsx 和 Icon.jsx', '8 个：全部文件'],
        answer: 2,
        explain:
          '“use client” 标记的是边界：写了它的文件，加上它 import 的所有模块，都会进入浏览器。AddToCart 又 import 了 Icon，所以是 2 个。第一项漏掉了被导入的 Icon。更靠近根的文件不会被拖进来，因为边界只向下影响它导入的文件。',
      },
      pkey: 'server-components|模拟：哪些文件会进入浏览器',
    },
    '模拟：哪些 props 能跨过边界': {
      note: 'onBuy（普通函数）、owner（class 的实例）、extra（原型为 null 的对象）三项不能传。其余都能过：Date、Map、嵌套的普通对象都是支持的类型；addToCart 是 Server Function，浏览器拿到的是引用。注意 Map 可以传，不要把“只有 JSON 能传”当成规则。',
      predict: {
        q: '运行后，表格里哪几行显示“❌ 不能传”？',
        options: ['onBuy 和 owner', 'onBuy、owner 和 stock（Map）', 'onBuy、owner 和 extra（原型为 null 的对象）', '没有，全部都能传'],
        answer: 2,
        explain:
          '普通函数、class 的实例、原型为 null 的对象都不在支持的类型里。stock 是 Map，属于支持的类型。第二项是把 JSON 的限制当成了 React 的限制：React 的序列化比 JSON 宽，Date、Map、Set 都能传。',
      },
      pkey: 'server-components|模拟：哪些 props 能跨过边界',
    },
    '模拟：绕过界面直接调用 Server Function': {
      note: '两个按钮发出的请求体一样，服务器只看请求体。deletePost 里没有任何检查，所以不管请求来自按钮还是脚本、有没有登录，文章都被删了。浏览器端只有引用（一个 id），看不到函数体，但这不能阻止别人用同样的 id 和参数发请求。检查必须写在服务器上的函数里。',
      predict: {
        q: '页面上写着“当前没有任何人登录”。点“绕过界面，脚本直接发请求”，结果是什么？',
        options: ['请求被拒绝：没有登录', '返回“已删除 p1”，文章从列表里消失', '报错：这个函数只能由界面上的按钮调用', '浏览器在发出请求之前就拦下了它'],
        answer: 1,
        explain:
          '服务器收到的只是一段请求体，没有任何信息说明它来自哪里；deletePost 本身也没有检查。第三项是最常见的误解：以为引用只存在于按钮里，别人就调不到。请求体是公开的协议，谁都能构造。',
      },
      pkey: 'server-components|模拟：绕过界面直接调用 Server Function',
    },
  },
} satisfies Lesson;
