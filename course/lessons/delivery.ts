import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/delivery.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'delivery',
  stage: 4,
  title: '交付：构建、部署与升级',
  mins: 40,
  summary: '看懂构建产物和缓存、把项目部署到静态托管、配好单页应用的路由回退、让密钥只留在服务端，再接上持续集成并从 React 18 升级。',
  goals: [
    '能说出构建产物里各文件的作用，并解释为什么带哈希的文件可以长期缓存、index.html 不行',
    '能把项目部署到静态托管，并写出单页应用的路由回退规则（缺失的资源文件不回退）',
    '能判断一个值该放前端还是服务端，并写出转发函数要做的校验',
    '能按清单检查上线结果（选读：写最小的 CI 工作流，把 React 18 项目升到 19）',
  ],
  keyPoints: [
    '<code>dist/</code> 是纯静态文件。<code>assets/</code> 里的文件名带内容哈希：内容变，名字才变，所以可以长期缓存；<code>index.html</code> 名字固定，每次都要向服务器确认，这样用户才能拿到指向新文件的版本。',
    '部署就是把 <code>dist/</code> 放到静态托管上。导入仓库、构建命令 <code>npm run build</code>、输出目录 <code>dist</code>，推送后自动部署。GitHub Pages 的网址带仓库名，要设置 <code>base</code>。',
    '单页应用的服务器要把找不到的页面路径回退到 index.html，由前端路由接管。缺失的资源文件（带扩展名）不该回退：回退会把 HTML 当成 JS 交给浏览器，页面白屏。',
    '密钥只放服务端，前端请求自己的服务端，服务端带着密钥转发。这个转发入口是公开的，谁都能直接调用，所以必须校验输入、只转发需要的请求。',
    '（选读）CI 里依次跑 <code>npm ci</code>、类型检查、lint、测试、构建。从 React 18 升级：先升 18.3.1 清警告，再跑 codemod，最后升 19。',
  ],
  quiz: [
    {
      q: '<code>npm run build</code> 生成的文件叫 <code>assets/index-DP45_tYn.js</code>，名字里的 <code>DP45_tYn</code> 有什么用？',
      options: [
        '它是加密后的密钥，防止别人读到源码',
        '它是手工维护的版本号，每次发布前要自己改',
        '它由文件内容算出，内容变了名字才变，所以浏览器可以放心地长期缓存这个文件',
        '它标记文件的下载顺序，序号小的先下载',
      ],
      answer: 2,
      explain:
        '构建工具根据文件内容算出这串字符。内容不变，名字不变，浏览器缓存的副本永远有效；内容变了，名字跟着变，浏览器会把它当成新文件去下载。所以带哈希的文件可以缓存一年。它不是加密：压缩和改名都不会保护代码。',
    },
    {
      q: '发布新版本后，一些老用户打开页面一片空白，控制台报 <code>Expected a JavaScript module but got text/html</code>。托管平台上配了一条把 <code>/(.*)</code> 都回退到 index.html 的规则。最可能的原因是？',
      options: [
        '老用户的浏览器缓存了旧的 index.html，里面写着已经被删除的旧 JS 文件名；请求这个文件时，回退规则返回了 index.html',
        '新版本的 JS 文件太大，下载超时了',
        '路由回退规则写错了，应该把 index.html 回退到 JS 文件',
        '老用户的浏览器不支持 JavaScript 模块',
      ],
      answer: 0,
      explain:
        '新版本的构建会删掉旧的带哈希文件。老页面还在请求旧文件名，服务器上没有，回退规则就返回了 index.html（状态码 200，内容是 HTML），浏览器把 HTML 当成 JS 去解析，于是报错。更稳的做法是：缺失的资源文件返回 404，并且不让 index.html 被长期缓存，用户才能及时拿到指向新文件的版本。',
    },
    {
      q: '把项目部署到 GitHub Pages 的项目站点，网址是 <code>https://用户名.github.io/my-app/</code>。页面打开是空白，浏览器网络面板里 JS 和 CSS 都是 404，请求的地址形如 <code>/assets/index-xxx.js</code>。怎么改？',
      options: [
        '给每个 import 语句加上 ./ 前缀',
        '在 GitHub 仓库里把 assets 目录改成公开',
        '把构建命令改成 vite dev',
        "在 vite.config.ts 里把 base 设成 '/my-app/' 再重新构建",
      ],
      answer: 3,
      explain:
        "默认的 base 是 /，产物里的资源地址写成 /assets/…，指向网站的根目录。项目站点的根是 /my-app/，所以要把 base 设成 '/my-app/'，资源地址才会变成 /my-app/assets/…。这是构建时决定的，改完要重新构建。",
    },
    {
      q: '为了不在前端暴露天气服务的密钥，同事写了一个服务端函数：浏览器请求 <code>/api/weather?path=…</code>，函数把 <code>path</code> 拼到第三方地址后面，带着密钥转发。这个设计的主要问题是？',
      options: [
        '服务端函数比前端慢，用户会觉得卡',
        '任何人都能直接调用这个函数，让它带着你的密钥请求第三方的任意路径，包括收费或写入的接口',
        '环境变量只能在前端代码里读取，服务端读不到',
        '没有问题：密钥不在前端，就是安全的',
      ],
      answer: 1,
      explain:
        '转发入口是公开的，前端页面只是调用它的一种方式，别人完全可以绕过页面直接发请求。转发什么必须由服务端决定：只允许固定的几种请求，并校验参数。最后一项最有迷惑性：密钥没出现在前端是必要条件，不是充分条件。',
    },
    {
      q: 'CI 的工作流里用 <code>npm ci</code> 而不是 <code>npm install</code> 安装依赖。主要原因是？',
      options: [
        'npm ci 安装得更快，因为它会跳过 lock 文件',
        'npm ci 严格按 package-lock.json 安装，lock 文件和 package.json 对不上时直接报错，每次装到的版本都一样',
        'npm ci 只安装 dependencies，不安装 devDependencies',
        'npm ci 会自动升级所有依赖到最新版本',
      ],
      answer: 1,
      explain:
        '服务器上要的是“可重复”：同一份代码每次装到同样的依赖。npm ci 严格按 lock 文件安装，不一致就失败，也不会改写 lock 文件。它不是跳过 lock 文件，也不会升级依赖。',
    },
  ],
  exercise: {
    task: '<p>静态托管服务器收到请求，要决定返回哪个文件、用什么状态码，以及这个文件该带什么缓存头。下面用两个函数模拟。</p><ol class="task-steps"><li>不要修改 <code>FILES</code> 和 <code>App</code>。</li><li>写 <code>resolve(path, files)</code>，返回 <code>{ status, file }</code>。先去掉路径里 <code>?</code> 之后的查询字符串，<code>/</code> 当作 <code>/index.html</code>。文件存在：状态 200，返回这个文件。文件不存在，而且路径最后一段<strong>没有扩展名</strong>（像 <code>/city/1</code> 这样的页面路由）：状态 200，返回 <code>/index.html</code>，让前端路由接管。文件不存在，而且最后一段有扩展名（缺失的资源文件）：状态 404，<code>file</code> 是 <code>null</code>。</li><li>写 <code>cacheControl(file)</code>：<code>/assets/</code> 下的文件带哈希，返回 <code>public, max-age=31536000, immutable</code>；其余文件返回 <code>no-cache</code>。</li><li>在预览里请求 <code>/city/9</code> 和 <code>/assets/index-old000.js</code>，对照结果。</li></ol>',
    starter: `import { useState } from 'react';

// ===== 站点上线后，服务器上的文件（不要修改） =====
const FILES = ['/index.html', '/favicon.svg', '/assets/index-3fa91c.js', '/assets/index-b7d20e.css'];

// ===== 你的代码 =====
// 1. 决定返回哪个文件和状态码
function resolve(path, files) {
  return { status: 200, file: path };
}

// 2. 决定这个文件的缓存头
function cacheControl(file) {
  return 'no-cache';
}

function App() {
  const [path, setPath] = useState('/city/1');
  const [res, setRes] = useState('');
  function send() {
    const r = resolve(path, FILES);
    setRes(r.file ? r.status + ' ' + r.file + '\\nCache-Control: ' + cacheControl(r.file) : r.status + ' 没有这个文件');
  }
  return (
    <div>
      <input id="path" value={path} onChange={e => setPath(e.target.value)} aria-label="请求路径" />{' '}
      <button id="send" onClick={send}>发送请求</button>
      <pre id="res">{res}</pre>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

// ===== 站点上线后，服务器上的文件（不要修改） =====
const FILES = ['/index.html', '/favicon.svg', '/assets/index-3fa91c.js', '/assets/index-b7d20e.css'];

// ===== 你的代码 =====
function resolve(path, files) {
  const pathname = path.split('?')[0];
  const target = pathname === '/' ? '/index.html' : pathname;
  if (files.includes(target)) return { status: 200, file: target };
  const last = target.split('/').pop();
  if (last.includes('.')) return { status: 404, file: null };
  return { status: 200, file: '/index.html' };
}

function cacheControl(file) {
  return file.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache';
}

function App() {
  const [path, setPath] = useState('/city/1');
  const [res, setRes] = useState('');
  function send() {
    const r = resolve(path, FILES);
    setRes(r.file ? r.status + ' ' + r.file + '\\nCache-Control: ' + cacheControl(r.file) : r.status + ' 没有这个文件');
  }
  return (
    <div>
      <input id="path" value={path} onChange={e => setPath(e.target.value)} aria-label="请求路径" />{' '}
      <button id="send" onClick={send}>发送请求</button>
      <pre id="res">{res}</pre>
    </div>
  );
}`,
    exports: ['resolve', 'cacheControl'],
    hint: "<code>resolve</code>：<code>path.split('?')[0]</code> 去掉查询；用 <code>files.includes(目标)</code> 判断文件是否存在；最后一段是 <code>目标.split('/').pop()</code>，里面有没有 <code>'.'</code> 决定它像不像资源文件。三种结果各写一个 <code>return</code>。<code>cacheControl</code>：用 <code>startsWith('/assets/')</code> 区分。",
    faded: `// （FILES 和 App 与起始代码相同，这里省略）

function resolve(path, files) {
  const pathname = path.split('?')[0];
  const target = pathname === '/' ? '/index.html' : pathname;
  if (files.includes(target)) return { status: 200, file: target };
  const last = target.split('/').pop();
  /* ✏️ last 里有 '.'：缺失的资源文件，返回 404 和 file: null */
  /* ✏️ 否则是页面路由：返回 200 和 /index.html */
}

function cacheControl(file) {
  /* ✏️ /assets/ 下的文件返回长期缓存，其余返回 no-cache */
}`,
    test: async t => {
      const { resolve, cacheControl } = t.exports;
      t.assert(typeof resolve === 'function', '请定义函数 resolve(path, files)（步骤 2）');
      t.assert(typeof cacheControl === 'function', '请定义函数 cacheControl(file)（步骤 3）');
      const files = ['/index.html', '/favicon.svg', '/assets/index-3fa91c.js', '/assets/index-b7d20e.css'];
      const show = r => JSON.stringify(r);

      // 步骤 2：存在的文件
      let r = resolve('/assets/index-3fa91c.js', files);
      t.assert(r && r.status === 200 && r.file === '/assets/index-3fa91c.js', '文件存在时，返回它本身和状态 200。得到：' + show(r));
      r = resolve('/', files);
      t.assert(r && r.status === 200 && r.file === '/index.html', '根路径 / 要当作 /index.html。得到：' + show(r));
      r = resolve('/logo.png', ['/index.html', '/logo.png']);
      t.assert(r && r.status === 200 && r.file === '/logo.png', '要根据传入的 files 判断文件是否存在，不要把文件名写死。得到：' + show(r));
      r = resolve('/assets/index-3fa91c.js?v=2', files);
      t.assert(r && r.status === 200 && r.file === '/assets/index-3fa91c.js', '路径后面的 ?查询 不属于文件名，要先去掉。得到：' + show(r));

      // 页面路由：回退到 index.html
      r = resolve('/city/1', files);
      t.assert(
        r && r.status === 200 && r.file === '/index.html',
        '/city/1 不是文件，是前端路由的页面。服务器要返回 index.html（状态 200），让前端路由接管。得到：' + show(r),
      );
      r = resolve('/city/1?tab=2', files);
      t.assert(r && r.status === 200 && r.file === '/index.html', '页面路由带查询字符串时也要回退到 index.html。得到：' + show(r));

      // 缺失的资源文件：404，不回退
      r = resolve('/assets/index-old000.js', files);
      t.assert(
        r && r.status === 404 && !r.file,
        '/assets/index-old000.js 是已经不存在的资源文件。回退成 index.html 会让浏览器把 HTML 当成 JS 解析，页面白屏；应该返回 404 和 file: null。得到：' +
          show(r),
      );
      r = resolve('/nope.png', files);
      t.assert(r && r.status === 404, '带扩展名又不存在的路径（缺失的资源）返回 404。得到：' + show(r));

      // 步骤 3：缓存头
      const js = String(cacheControl('/assets/index-3fa91c.js'));
      const css = String(cacheControl('/assets/index-b7d20e.css'));
      t.assert(
        /max-age=31536000/.test(js) && /immutable/.test(js),
        'assets 下的文件名带哈希，内容不会变，应该长期缓存：public, max-age=31536000, immutable。得到：' + js,
      );
      t.assert(/max-age=31536000/.test(css) && /immutable/.test(css), 'CSS 文件也在 assets 下，同样长期缓存。得到：' + css);
      const html = String(cacheControl('/index.html'));
      t.assert(
        /no-cache|no-store|max-age=0/.test(html) && !/immutable/.test(html) && !/max-age=31536000/.test(html),
        'index.html 的名字固定，不能长期缓存，否则用户拿不到指向新文件的版本。应该返回 no-cache。得到：' + html,
      );
      t.assert(!/immutable/.test(String(cacheControl('/favicon.svg'))), 'favicon.svg 的名字不带哈希，不能标成 immutable');

      // 整合：预览区显示两者的结果
      await t.type('#path', '/city/9');
      await t.click('#send');
      let text = t.text('#res');
      t.assert(
        text.includes('200') && text.includes('/index.html') && /no-cache/.test(text),
        '请求 /city/9 时，预览应显示 200、/index.html 和它的缓存头。现在是：' + text,
      );
      await t.type('#path', '/assets/index-old000.js');
      await t.click('#send');
      text = t.text('#res');
      t.assert(text.includes('404') && !text.includes('/index.html'), '请求缺失的资源文件时，预览应显示 404，不能出现 /index.html。现在是：' + text);
      await t.type('#path', '/assets/index-b7d20e.css');
      await t.click('#send');
      text = t.text('#res');
      t.assert(text.includes('200') && text.includes('immutable'), '请求存在的 CSS 文件时，预览应显示 200 和长期缓存头。现在是：' + text);
    },
  },
  // 阶段测验专用的读代码题。下标是复习卡片键 课id#cN 的 N：以后只能在末尾追加，不能调换、删除
  checkOnly: [
    {
      q: `项目用 Netlify 部署。同事把回退规则写在了项目根目录的 <code>_redirects</code> 文件里（和 <code>package.json</code> 同级），内容如下。部署后在 <code>/city/1</code> 上刷新仍然是 404。原因是什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">/*  /index.html  200</code></pre></div>`,
      options: [
        '规则的状态码应该写 404，这样浏览器才会重新请求',
        'Netlify 不支持单页应用的回退规则',
        '这个文件没有被复制进构建产物 dist/，应该放进 public/ 目录，构建时才会被带进去',
        '规则里的 /* 会匹配所有路径，包括真实存在的文件，导致页面全部变成 index.html',
      ],
      answer: 2,
      explain:
        'Netlify 发布的是构建产物 dist/ 里的内容，所以 _redirects 要在 dist/ 里。放在 public/ 目录，Vite 会在构建时把它原样复制过去。放在项目根目录，不会进入 dist/，规则根本没生效。最有迷惑性的是最后一项：规则默认不会盖住真实存在的文件，真实文件会先被返回。',
    },
    {
      q: `提交 pull request 后，GitHub 的 Actions 页面里没有任何运行记录。工作流的开头如下，应该怎么改？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">name: CI

on:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest</code></pre></div>`,
      options: [
        '把 runs-on 改成 macos-latest',
        '在 on 下面加上 pull_request:，让 PR 触发检查',
        "把 branches 改成 ['*']，让所有分支都能推送",
        '在 jobs 下面加上 needs: main',
      ],
      answer: 1,
      explain:
        '<code>on</code> 决定什么时候运行。现在只写了推送到 main，PR 来自别的分支，所以不会触发。加上 <code>pull_request:</code>，PR 打开和更新时都会运行检查，没通过的代码就进不了 main。改 runs-on 只换运行的系统，和触发无关；<code>needs</code> 是 job 之间的依赖，不是分支。',
    },
    {
      q: `下面的服务端函数把密钥放在服务端的环境变量里，前端读不到。它还有什么问题？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">export async function GET(request) {
  const path = new URL(request.url).searchParams.get('path');
  return fetch('https://api.example.com/' + path, {
    headers: { Authorization: 'Bearer ' + process.env.API_KEY },
  });
}</code></pre></div>`,
      options: [
        '没有问题：密钥在服务端环境变量里，访客看不到',
        '密钥应该写进代码里，环境变量在生产环境读不到',
        '任何人都可以传任意 path，让它带着你的密钥访问该 API 的任意路径。应该只允许固定的几种请求，并校验参数',
        'fetch 不能在服务端使用，应该改用 XMLHttpRequest',
      ],
      answer: 2,
      explain:
        '密钥没有出现在前端，是第一步。第二步是这个入口本身：它是公开的，别人可以绕过你的页面直接请求，而 path 完全由请求者决定。结果是你的密钥被借去访问任何路径，包括收费或写入的接口。修法是由服务端决定能转发什么：白名单加参数校验，必要时再限流。',
    },
    {
      q: `部署新版本后，用户长时间看到的还是旧页面，强制刷新才更新。<code>vercel.json</code> 如下，原因是什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}</code></pre></div>`,
      options: [
        'Vercel 的 CDN 有延迟，等几分钟就好了',
        '带哈希的文件不应该设置缓存',
        'immutable 只对 CSS 有效，对 JS 无效',
        '规则对所有路径生效，index.html 也被缓存了一年。浏览器不会再去要新的 index.html，就拿不到指向新文件名的版本',
      ],
      answer: 3,
      explain:
        '长期缓存只适合文件名带哈希的资源。index.html 的名字固定，缓存一年，浏览器就一直用旧的，里面写的还是旧的 JS 文件名。应该把规则的 source 限定在 /assets/ 下，index.html 保持 no-cache 或 max-age=0。第二项把方向说反了：带哈希的文件正适合长期缓存。',
    },
  ],
  plays: {
    '构建产物：文件名里的哈希': {
      note: '只改了 CSS，所以只有 CSS 文件的名字变了，JS 文件的名字没变，访客的缓存里已经有它。要下载的是 index.html（它每次都要确认，而且里面写的 CSS 文件名变了）和新的 CSS 文件，共 2 个。这就是文件名带哈希的好处：改一行代码，访客只重新下载变了的部分。（示例用一个简单函数代替构建工具的哈希算法，道理相同。）',
      predict: {
        q: '访客昨天来过，缓存里有 JS 和 CSS。现在你<strong>只点一次“改一行 CSS”</strong>，再点“重新构建并部署”，访客点“访客打开页面”。三个文件里，需要重新下载几个？',
        options: ['0 个：缓存里什么都有', '1 个：只有 CSS 文件', '2 个：index.html 和新的 CSS 文件', '3 个：全部重新下载'],
        answer: 2,
        explain: 'index.html 每次都要向服务器要，而且它引用了新的 CSS 文件名；新名字的 CSS 缓存里没有，要下载。JS 的名字没变，直接用缓存。',
      },
      pkey: 'delivery|构建产物：文件名里的哈希',
    },
    单页应用的路由回退: {
      note: '“全部回退”下，旧的 JS 文件名在服务器上已经不存在，规则仍然返回 index.html，状态码是 200，内容是 HTML。浏览器会把它当成 JS 去解析，于是报错、页面白屏。“只回退页面”会让缺失的资源返回 404，错误一目了然。真实平台的行为各不相同：实测 vite preview 对缺失的 .js 也返回 200 和 index.html；Vercel 的 rewrites 和 Netlify 的 200 重定向在文件不存在时同样会回退，以各自的文档为准。',
      predict: {
        q: '把规则选成“全部回退”，请求路径选 <code>/assets/index-old999.js</code>（上一个版本留下的、服务器上已经不存在的文件）。点“发送请求”，得到什么？',
        options: ['404，没有这个文件', '200，内容是 index.html（text/html）', '200，内容是旧版本的 JS', '500，服务器出错'],
        answer: 1,
        explain: '“全部回退”对所有找不到的路径都返回 index.html，不区分页面和资源文件，所以缺失的 JS 也得到 200 和 HTML。',
      },
      pkey: 'delivery|单页应用的路由回退',
    },
    '服务端代理：密钥留在服务端': {
      note: '浏览器发出的请求里只有地址和城市，没有密钥；带密钥的请求是服务端发给第三方的，只出现在服务端的日志里。绕过页面直接请求 Tokyo 时，服务端的校验拒绝了它，返回 400。页面上的下拉框只是方便用户，不是安全措施：别人可以绕过页面直接调用接口，所以校验必须写在服务端。（这是模拟：真实环境里服务端代码运行在另一台机器上，浏览器拿不到它的代码和环境变量。）',
      predict: {
        q: '页面上的下拉框只有三个城市。点“绕过页面，直接请求 Tokyo”，“浏览器的网络请求”里会出现什么结果？',
        options: ['200，返回 Tokyo 的天气', '400，不支持的城市', '401，密钥不对', '什么也不会发生：下拉框里没有 Tokyo，请求发不出去'],
        answer: 1,
        explain:
          '页面的限制只对用户操作有效，直接请求不经过它。服务端自己做了校验，Tokyo 不在允许的列表里，所以返回 400。如果服务端不校验，这个请求就会被转发给第三方。',
      },
      pkey: 'delivery|服务端代理：密钥留在服务端',
    },
  },
} satisfies Lesson;
