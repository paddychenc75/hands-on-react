import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/engineering.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'engineering',
  stage: 4,
  title: '项目搭建与交付',
  mins: 32,
  runtime: 19,
  summary: '在本机用 Vite 建项目、把单文件拆成模块、选样式方案、管好环境变量，再部署到网上并接上持续集成。',
  goals: [
    '能在本机用 Vite 创建 React + TypeScript 项目，说出各目录和三条命令的作用，并判断什么时候该用框架',
    '能把单文件示例拆成多个文件，写对默认导出、具名导出和 import 路径（选读：按场景选择样式方案）',
    '能说出 VITE_ 变量为什么是公开的，并给出保密值的处理办法',
    '能写出单页应用的路由回退配置，把项目部署到静态托管（选读：写一份最小的 CI 工作流）',
  ],
  keyPoints: [
    '纯客户端应用用 Vite 创建，需要 SEO、服务端渲染或 Server Components 时用框架。Create React App 已被弃用。<code>npm run dev</code> 开发，<code>npm run build</code> 生成 <code>dist/</code>，<code>npm run preview</code> 本机看产物。',
    '一个文件是一个模块。默认导出导入时不带花括号，名字随便取；具名导出要带花括号，名字必须一致。实验台会处理 react 的 import 并忽略其他 import，真实项目里一切都要自己导入。',
    '（选读）样式：全局 CSS 靠命名约定；CSS Modules 在构建时把类名改写成唯一名字，导入得到“原名 → 新名”的对象；Tailwind 直接写原子类；运行时 CSS-in-JS 要在浏览器里多做一轮工作。',
    '只有 <code>VITE_</code> 开头的变量会在构建时被换成字面量，写进前端包，任何访客都能读到。密钥不能用这个前缀，要让服务端转发请求。改了变量要重新构建。',
    '交付：单页应用的服务器要把找不到的路径回退到 index.html（Vercel 用 rewrites，Netlify 用 _redirects）。（选读）CI 里依次跑 <code>npm ci</code>、类型检查、lint、测试、构建。',
  ],
  quiz: [
    {
      q: "<code>Counter.tsx</code> 里写了 <code>export default function Counter() {…}</code>。<code>App.tsx</code> 里写 <code>import { Counter } from './components/Counter.tsx';</code>，然后渲染 <code>&lt;Counter /&gt;</code>。会怎样？",
      options: [
        '正常运行：带花括号和不带花括号只是写法不同',
        '能运行，但 Counter 是 undefined，页面一片空白',
        '报错：组件文件只能用默认导出，不能写在花括号里',
        '报错：Counter.tsx 里没有叫 Counter 的具名导出，应写成 import Counter from …',
      ],
      answer: 3,
      explain:
        '默认导出和具名导出是两种不同的导出。花括号表示“按名字取具名导出”，而这个文件只有默认导出，所以找不到。TypeScript 在编辑器里标红，Vite 也会报“没有名为 Counter 的导出”。“得到 undefined”是用普通对象模拟时的现象，真实的模块系统会在加载时直接报错。第三项不对：具名导出同样可以导出组件。',
    },
    {
      q: '要新建一个需要 SEO 和服务端渲染的全栈 React 应用，更合适的是？',
      options: [
        'Vite 创建项目，再加上 React Router 的组件',
        'Next.js 或 React Router 框架模式',
        'Create React App，它配置最少',
        'Vite 创建项目，在 useEffect 里请求数据',
      ],
      answer: 1,
      explain:
        '框架提供服务端渲染、路由和数据加载。Vite 默认是纯客户端渲染，服务器发出的 HTML 几乎是空的，对 SEO 不友好。加上 React Router 的组件也不会改变这一点。CRA 已于 2025 年 2 月正式弃用。',
    },
    {
      q: "ESLint 的 react-hooks 规则报告：React Hook useEffect has a missing dependency: 'count'。effect 里用了 count，依赖写的是 []。你应该？",
      options: [
        '在这一行上方加 eslint-disable 注释，让警告不再出现',
        '把 count 写进依赖，或改用函数式更新',
        '在 ESLint 配置里关闭这条规则',
        '把 count 移到组件外，变成模块级变量',
      ],
      answer: 1,
      explain:
        '这条警告通常在提醒你一个过期闭包：effect 读到的永远是旧的 count。关掉警告，bug 还在。把 count 变成模块级变量，它就不再是 state，改了也不会重新渲染。',
    },
    {
      q: '项目里已有 features/cart 和 features/auth 两个目录。你要写一个“购物车角标”组件和它用到的 useCartCount Hook。放在哪里最合适？',
      options: ['组件放 components/，Hook 放 hooks/', '都放进 features/cart/', '都放进 utils/', '放进 features/auth/，因为角标在页头里'],
      answer: 1,
      explain:
        '按功能组织：和购物车有关的代码放在一起，改需求时只需要打开一个目录。按类型分到 components/ 和 hooks/，小项目还行；项目变大后，改一个功能要在多个目录之间跳来跳去。',
    },
    {
      q: '项目的 <code>.env</code> 里有 <code>VITE_MAP_KEY=abc</code> 和 <code>PAYMENT_SECRET=xyz</code>。构建后部署到静态托管。结果是？',
      options: [
        'VITE_MAP_KEY 的值会写进打包后的 JS，任何访客都能读到；PAYMENT_SECRET 不会被打包，代码里读到 undefined',
        '两个值都会写进 JS，只是代码被压缩了，普通人看不懂',
        '两个值都读不到：.env 文件不会被上传，线上没有这些变量',
        'VITE_MAP_KEY 只有登录的用户才能在开发者工具里看到',
      ],
      answer: 0,
      explain:
        'Vite 在构建时把 import.meta.env.VITE_MAP_KEY 直接替换成字面量，写进所有访客都会下载的 JS 文件。压缩不等于加密，搜索字符串就能找到。没有 VITE_ 前缀的变量不会进入前端代码。所以真正要保密的值，只能放在服务端，由服务端替你发请求。',
    },
  ],
  exercise: {
    task: '<p>在本机项目里，构建工具会读取 <code>.env</code>，把代码里的 <code>import.meta.env.名字</code> 换成值，再生成给所有访客下载的 JS。下面用两个函数模拟这一步。</p><ol class="task-steps"><li>不要修改 <code>ENV</code> 和 <code>SOURCE</code>。</li><li>写 <code>exposeEnv(env)</code>：只保留名字以 <code>VITE_</code> 开头的变量，返回一个<strong>新对象</strong>，不要修改传入的对象。</li><li>写 <code>inline(code, publicEnv)</code>：把代码里<strong>每一处</strong> <code>import.meta.env.名字</code> 换成值的字面量。名字在 <code>publicEnv</code> 里，就换成带引号的字符串字面量（值里有引号也要写对）；不在，就换成 <code>undefined</code>。</li><li>预览区会显示“访客能读到的代码”。检查它：地址出现了，密码没有。</li></ol>',
    starter: `import { useState } from 'react';

// ===== 这个项目的 .env 文件（不要修改） =====
const ENV = {
  VITE_API_BASE: 'https://api.example.com',
  VITE_APP_NAME: '城市天气',
  DB_PASSWORD: 'p@ssw0rd',
};

// ===== 要打包的前端代码（不要修改） =====
const SOURCE = [
  "fetch(import.meta.env.VITE_API_BASE + '/city');",
  'document.title = import.meta.env.VITE_APP_NAME;',
  'const pw = import.meta.env.DB_PASSWORD;',
].join('\\n');

// ===== 你的代码 =====
// 1. 只保留以 VITE_ 开头的变量，返回新对象
function exposeEnv(env) {
  return env;
}

// 2. 把每一处 import.meta.env.名字 换成字面量；找不到就换成 undefined
function inline(code, publicEnv) {
  return code;
}

function build(code, env) {
  return inline(code, exposeEnv(env));
}

function App() {
  const [bundle] = useState(() => build(SOURCE, ENV));
  return (
    <div>
      <p>打包后，任何访客都能读到下面这段代码：</p>
      <pre id="bundle">{bundle}</pre>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

// ===== 这个项目的 .env 文件（不要修改） =====
const ENV = {
  VITE_API_BASE: 'https://api.example.com',
  VITE_APP_NAME: '城市天气',
  DB_PASSWORD: 'p@ssw0rd',
};

// ===== 要打包的前端代码（不要修改） =====
const SOURCE = [
  "fetch(import.meta.env.VITE_API_BASE + '/city');",
  'document.title = import.meta.env.VITE_APP_NAME;',
  'const pw = import.meta.env.DB_PASSWORD;',
].join('\\n');

// ===== 你的代码 =====
function exposeEnv(env) {
  const publicEnv = {};
  for (const [name, value] of Object.entries(env)) {
    if (name.startsWith('VITE_')) publicEnv[name] = value;
  }
  return publicEnv;
}

function inline(code, publicEnv) {
  return code.replace(/import\\.meta\\.env\\.(\\w+)/g, (_match, name) =>
    Object.hasOwn(publicEnv, name) ? JSON.stringify(publicEnv[name]) : 'undefined'
  );
}

function build(code, env) {
  return inline(code, exposeEnv(env));
}

function App() {
  const [bundle] = useState(() => build(SOURCE, ENV));
  return (
    <div>
      <p>打包后，任何访客都能读到下面这段代码：</p>
      <pre id="bundle">{bundle}</pre>
    </div>
  );
}`,
    exports: ['exposeEnv', 'inline', 'build'],
    hint: "<code>exposeEnv</code>：遍历 <code>Object.entries(env)</code>，名字用 <code>startsWith('VITE_')</code> 判断。<code>inline</code>：用带 <code>g</code> 标志的正则 <code>/import\\.meta\\.env\\.(\\w+)/g</code> 匹配，<code>replace</code> 的第二个参数写成函数，函数里拿到名字，再决定返回什么。字符串字面量用 <code>JSON.stringify(值)</code> 生成，它会处理引号。",
    faded: `// （ENV、SOURCE、build 和 App 与起始代码相同，这里省略）

function exposeEnv(env) {
  const publicEnv = {};
  for (const [name, value] of Object.entries(env)) {
    /* ✏️ 只有名字以 VITE_ 开头，才放进 publicEnv */
  }
  return publicEnv;
}

function inline(code, publicEnv) {
  return code.replace(/import\\.meta\\.env\\.(\\w+)/g, (_match, name) =>
    /* ✏️ 名字在 publicEnv 里：返回 JSON.stringify(值)；不在：返回 'undefined' */
  );
}`,
    test: async t => {
      const { exposeEnv, inline } = t.exports;
      t.assert(typeof exposeEnv === 'function', '请定义函数 exposeEnv(env)（步骤 2）');
      t.assert(typeof inline === 'function', '请定义函数 inline(code, publicEnv)（步骤 3）');

      // 步骤 2：只公开 VITE_ 开头的变量
      const input = { VITE_A: '1', SECRET: 'x', VITEST_MODE: 'y', MY_VITE_B: 'z', VITE_B: '2' };
      const copy = JSON.stringify(input);
      const pub = exposeEnv(input);
      t.assert(pub && typeof pub === 'object', 'exposeEnv 要返回一个对象');
      const names = Object.keys(pub).sort().join('、');
      t.assert(
        names === 'VITE_A、VITE_B',
        '只有名字以 “VITE_” 开头的变量才能公开，其余的（密钥、别的前缀）都不能出现。现在返回的名字是：' + (names || '（空）'),
      );
      t.assert(pub.VITE_A === '1' && pub.VITE_B === '2', '公开的变量，值要原样保留');
      t.assert(JSON.stringify(input) === copy, 'exposeEnv 不要修改传入的对象：返回一个新对象');

      // 步骤 3：构建时替换成字面量
      const r1 = inline('f(import.meta.env.VITE_A)', { VITE_A: '1' });
      t.assert(r1 === 'f("1")', 'inline 要把 import.meta.env.VITE_A 换成带引号的字面量 "1"。得到：' + r1);
      const r2 = inline('a = import.meta.env.VITE_Q;', { VITE_Q: 'say "hi"' });
      t.assert(r2 === 'a = "say \\"hi\\"";', '值里有引号时，字面量要正确转义（提示：JSON.stringify）。得到：' + r2);
      const r3 = inline('import.meta.env.VITE_A + import.meta.env.VITE_A', { VITE_A: '1' });
      t.assert(r3 === '"1" + "1"', '同一个变量出现多次，每一处都要换。得到：' + r3);
      const r4 = inline('import.meta.env.VITE_API', { VITE_A: '1' });
      t.assert(r4 === 'undefined', '变量名要完整匹配：VITE_API 不在公开的变量里，应换成 undefined，不能只替换它的前半截 VITE_A。得到：' + r4);
      const r5 = inline('x(import.meta.env.DB_PASSWORD)', {});
      t.assert(r5 === 'x(undefined)', '没有公开的变量，代码里读到的是 undefined。得到：' + r5);
      t.assert(inline('const a = 1;', { VITE_A: '1' }) === 'const a = 1;', '和环境变量无关的代码不要改动');

      // 整合：预览区显示的是“访客能读到的代码”
      const text = t.text('#bundle');
      t.assert(text.includes('"https://api.example.com"'), '预览里应该有 VITE_API_BASE 的值（带引号的字面量）。让 App 显示 build(SOURCE, ENV) 的结果');
      t.assert(text.includes('document.title = "城市天气";'), 'VITE_APP_NAME 也要被换成字面量');
      t.assert(!text.includes('p@ssw0rd'), '密码 p@ssw0rd 出现在了访客能读到的代码里！DB_PASSWORD 没有 VITE_ 前缀，不能被打包');
      t.assert(!text.includes('import.meta.env'), '所有 import.meta.env.… 都应该被换掉');
      t.assert(text.includes('const pw = undefined;'), '没有公开的变量，读到的是 undefined');
    },
  },
  checkOnly: [
    {
      q: '组件从 <code>useState</code> 改成了 <code>useReducer</code>，界面行为完全没变。下面哪条测试断言在改完以后仍然通过？',
      options: [
        'expect(setAdded).toHaveBeenCalledWith(true)：监视 set 函数的调用',
        'expect(state).toEqual({ added: true })：检查组件内部的 state 对象',
        "expect(dispatch).toHaveBeenCalledWith({ type: 'add' })：监视 dispatch 的参数",
        "expect(screen.getByText('已加入购物车')).toBeInTheDocument()：检查用户看到的文字",
      ],
      answer: 3,
      explain:
        '用户看到的东西没变，测试就不该失败。前三条都绑在实现细节上：set 函数、内部 state 的形状、dispatch 的参数，换成另一种写法就会失败。第三条最有迷惑性，它也“测了行为”，但 action 的结构是实现细节。按文字和角色去断言，重构时测试才稳定。',
    },
    {
      q: `开发环境开启了 StrictMode，下面的计数每秒加 2。同事说：“生产环境没有 StrictMode，每秒只加 1，所以不用改。”哪项判断正确？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">useEffect(() =&gt; {
  setInterval(() =&gt; setCount(c =&gt; c + 1), 1000);
}, []);</code></pre></div>`,
      options: [
        '同事说得对：多出的定时器只在开发环境出现，生产环境没有 bug',
        '生产环境确实每秒加 1，但 bug 还在：组件卸载后，定时器仍在运行',
        '生产环境也每秒加 2：StrictMode 在生产环境同样生效',
        '应该关掉 StrictMode，让开发环境和生产环境表现一致',
      ],
      answer: 1,
      explain:
        'StrictMode 在开发环境故意多做一次“挂载 → 卸载 → 挂载”，正是为了暴露缺少清理函数的 bug。生产环境只挂载一次，所以每秒加 1。但组件卸载后，没有人停掉这个定时器：它会一直运行，每秒白白调用一次 set 函数。回调里如果还发请求，浪费会更明显。最有迷惑性的是第一项：StrictMode 没有制造 bug，只是让它提前出现。修法是保存 id，并返回清理函数 <code>() =&gt; clearInterval(id)</code>，而不是关掉 StrictMode。',
    },
    {
      q: '团队要做一个内部后台管理系统。不需要 SEO，只能部署到静态文件服务器（只能放 HTML、JS、CSS，不能运行 Node.js）。新项目该怎样创建？',
      options: [
        'Next.js App Router，用 Server Functions 处理表单',
        '用 Vite 创建纯客户端应用',
        '用 Create React App，它的配置最少',
        'React Router 框架模式，开启服务端渲染',
      ],
      answer: 1,
      explain:
        '纯客户端应用打包后只有静态文件，任何静态服务器都能部署。Server Functions 和服务端渲染都要在服务器上运行代码，静态服务器做不到。最有迷惑性的是 Create React App：它也能产出静态文件，但已于 2025 年 2 月被官方弃用，不再维护。',
    },
    {
      q: `count 初始为 0，step 初始为 1。ESLint 对下面的依赖数组发出警告，同事加了一行注释把警告关掉。之后会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">useEffect(() =&gt; {
  const id = setInterval(() =&gt; {
    setCount(count + step);
  }, 1000);
  return () =&gt; clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);</code></pre></div>`,
      options: ['一切正常，警告只是建议', '每秒加 1，改了 step 也不变', '停在 1，不再变化', '关掉警告后，effect 每次渲染都运行'],
      answer: 2,
      explain:
        '定时器回调是第一次渲染创建的，它读到的 count 和 step 永远是初始值。每秒都执行 <code>setCount(0 + 1)</code>，所以计数停在 1。ESLint 的 react-hooks 规则正是用来发现这种过期闭包的。“每秒加 1”有迷惑性：那是写成 <code>setCount(c =&gt; c + 1)</code> 时的行为，这里用的是旧的 count。正确的修法：<code>setCount(c =&gt; c + step)</code>，并把 step 写进依赖。',
    },
    {
      q: '应用用 React Router 做了多个页面，部署到静态托管后，从首页点链接进入 /city/1 一切正常，但在 /city/1 上刷新页面，出现 404。下面哪个改动能解决？',
      options: [
        '把路由表里的 path 从 city/:id 改成完整的 /city/1',
        '在 Vercel 上添加 rewrites 规则：把所有路径（/(.*)）指向 /index.html',
        '把构建命令改成 npm run dev，让开发服务器处理路由',
        '给每个 Link 加上 reloadDocument，让它整页刷新',
      ],
      answer: 1,
      explain:
        '点链接时，是前端路由在浏览器里换页面，没有向服务器要新文件。刷新是向服务器请求 /city/1，而静态服务器上没有这个文件，所以 404。让服务器对找不到的路径一律返回 index.html，前端路由再接管，问题就解决了。改路由表没有用：404 发生在路由表加载之前。reloadDocument 会让每次跳转都整页刷新，反而丢掉 state。',
    },
    {
      q: `同事在 .env 里写了 <code>VITE_STRIPE_SECRET=sk_live_abc</code>，代码里这样用，并说：“.env 没有提交到 GitHub，所以密钥是安全的。”这个说法对吗？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">fetch('https://api.stripe.com/v1/charges', {
  headers: { Authorization: 'Bearer ' + import.meta.env.VITE_STRIPE_SECRET },
});</code></pre></div>`,
      options: [
        '对：.env 不在仓库里，别人拿不到',
        '对：生产构建会压缩代码，别人读不出密钥',
        '不对：构建时它被写进 JS 文件，任何访客都能读到。应由服务端带着密钥去请求',
        '不对：但只要把名字改成 STRIPE_SECRET，前端照样能读到它，而且是安全的',
      ],
      answer: 2,
      explain:
        '“没有提交到 GitHub”只保证仓库里没有。构建时 Vite 把 import.meta.env.VITE_STRIPE_SECRET 换成了字面量，写进所有访客都会下载的 JS。压缩不是加密。去掉 VITE_ 前缀后，前端读到的是 undefined，请求会失败，而不是“安全地读到”。正确做法：浏览器请求你自己的服务端，由服务端带着密钥请求 Stripe。',
    },
    {
      q: `<code>Card.module.css</code> 里写了 <code>.title { color: red; }</code>，组件如下，但标题没有变红。原因是什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">import styles from './Card.module.css';

export default function Card() {
  return &lt;h2 className="title"&gt;天气&lt;/h2&gt;;
}</code></pre></div>`,
      options: [
        '.module.css 文件里不能写类选择器，要写成 #title',
        'CSS Modules 在构建时把类名改写成了唯一的名字，要写成 className={styles.title}',
        '要在 main.tsx 里再导入一次 Card.module.css，样式才会生效',
        'color 属性在 CSS Modules 里被禁用，要改用内联 style',
      ],
      answer: 1,
      explain:
        'CSS Modules 的类名只在这个文件的范围内有效：构建时 .title 被改写成类似 _title_1agl6_1 的名字，styles.title 才是这个名字。普通字符串 "title" 对不上。样式已经在导入 styles 时加载了，不需要在别处再导入一次；类选择器和 color 在 CSS Modules 里都可以正常使用。',
    },
  ],
  plays: {
    '模块对象：默认导出与具名导出': {
      note: '对象里只有 default 和 TAX 两个键，没有叫 PriceTag 的键，所以第三行是 undefined。真实项目里这一步不会安静地得到 undefined：TypeScript 在编辑器里标红，Vite 报“没有名为 PriceTag 的导出”。无论哪种，原因都一样：导入的名字和文件导出的名字对不上。',
      predict: {
        q: '运行后，第三行日志（写成 <code>import { PriceTag }</code> 的那一行）输出什么？',
        options: ['function', 'undefined', 'object', '运行时抛出错误'],
        answer: 1,
        explain: '花括号表示“按名字取”。模块对象里没有叫 PriceTag 的键，取到的是 undefined。PriceTag 是通过 default 键导出的，要写成 import PriceTag from …。',
      },
      pkey: 'engineering|模块对象：默认导出与具名导出',
    },
    'CSS Modules：类名被改写成唯一名字': {
      note: '两个文件里都写了 .button，但构建后它们的名字不同，样式互不影响。这就是 CSS Modules 的作用域：类名只属于自己的那个文件。import 得到的对象，就是“原名 → 新名”的对照表。（示例里的选择器写成 button.类名，是为了盖过本站预览区对按钮的默认样式；真实项目里直接写 .button 就行。）',
      predict: {
        q: '两个文件各写了一个 <code>.button</code>，一个蓝色，一个绿色。页面上“按钮 A”和“按钮 B”分别是什么颜色？',
        options: ['都是绿色：后面的样式覆盖前面的', '都是蓝色：先定义的样式优先', 'A 蓝色，B 绿色', '页面报错：类名重复'],
        answer: 2,
        explain: '每个类名都被改写成了带哈希的唯一名字，两条规则的选择器并不相同，所以不会互相覆盖。用全局 CSS 的话，才会出现“后面的覆盖前面的”。',
      },
      pkey: 'engineering|CSS Modules：类名被改写成唯一名字',
    },
    '环境变量：构建时被换成字面量': {
      note: '“线上的包”是构建那一刻生成的一段固定文本，改 .env 不会影响它。只有重新构建，新的值才会写进去。所以部署后要改变量，必须重新构建；也所以，写进去的值任何访客都能读到。',
      predict: {
        q: '运行后，点一次“改 .env”按钮，<strong>不要</strong>点“重新构建”。下面“线上的包里写着”的那行代码，地址是什么？',
        options: ['https://staging.example.com', 'https://api.example.com', '空的，什么都不显示', '页面报错'],
        answer: 1,
        explain: '构建时地址已经被写成字面量，那段文本是固定的。改 .env 只改了源文件，线上的包要等重新构建才会变。',
      },
      pkey: 'engineering|环境变量：构建时被换成字面量',
    },
  },
} satisfies Lesson;
