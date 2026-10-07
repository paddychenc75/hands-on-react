// 非正文数据。课文在 docs/lessons/engineering.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'engineering',
  stage: 3,
  title: '工程化、测试与持续成长',
  mins: 8,
  summary: '把知识用于真实项目：工具链、TypeScript、测试，以及接下来的学习路线。',
  goals: [
    '能按项目需求选择 Next.js、React Router 框架模式、Vite 或 Expo',
    '能判断一个测试是在测用户行为还是在测实现细节',
    '能按功能组织项目文件，并开启 StrictMode 和 react-hooks 规则',
    '能列出自己下一步要学的生态工具',
  ],
  keyPoints: [
    '需要 SEO、服务端渲染或 RSC，用 Next.js 或 React Router 框架模式。纯客户端应用用 Vite。Create React App 已被弃用。',
    'React Testing Library 的原则：按文字、角色、标签查找元素，模拟用户操作，断言界面结果。不要断言 state 的值或内部方法。',
    'StrictMode 在开发环境故意把 effect 执行两次，帮你发现缺少清理函数的 bug。react-hooks 规则帮你发现依赖数组的错误。',
    '常见坑：用 eslint-disable 让依赖警告“安静”。应该修改代码，让 effect 真正不需要那个值。',
  ],
  quiz: [
    {
      q: '同事的测试断言 Counter 内部的 count state 等于 1。后来把 Counter 改成 useReducer，界面行为完全没变，测试却失败了。说明什么？',
      options: [
        '重构引入了 bug，应该回滚',
        '测试绑定了实现细节，应断言用户看到的界面',
        '应该再给 reducer 写一个单独的 state 测试',
        '应该改用快照测试，它不怕重构，界面没变就不会失败',
      ],
      answer: 1,
      explain: '用户看到的东西没变，测试就不该失败。断言内部 state 的测试，每次重构都会误报。快照测试也一样脆弱：任何无关的标记变化都会让它失败。按用户看得见的文字和角色去断言，重构时测试才稳定。',
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
      explain: '框架提供服务端渲染、路由和数据加载。Vite 默认是纯客户端渲染，服务器发出的 HTML 几乎是空的，对 SEO 不友好。加上 React Router 的组件也不会改变这一点。CRA 已于 2025 年 2 月正式弃用。',
    },
    {
      q: 'ESLint 的 react-hooks 规则报告：React Hook useEffect has a missing dependency: \'count\'。effect 里用了 count，依赖写的是 []。你应该？',
      options: [
        '在这一行上方加 eslint-disable 注释，让警告不再出现',
        '把 count 写进依赖，或改用函数式更新',
        '在 ESLint 配置里关闭这条规则',
        '把 count 移到组件外，变成模块级变量',
      ],
      answer: 1,
      explain: '这条警告通常在提醒你一个过期闭包：effect 读到的永远是旧的 count。关掉警告，bug 还在。把 count 变成模块级变量，它就不再是 state，改了也不会重新渲染。',
    },
    {
      q: '项目里已有 features/cart 和 features/auth 两个目录。你要写一个“购物车角标”组件和它用到的 useCartCount Hook。放在哪里最合适？',
      options: [
        '组件放 components/，Hook 放 hooks/',
        '都放进 features/cart/',
        '都放进 utils/',
        '放进 features/auth/，因为角标在页头里',
      ],
      answer: 1,
      explain: '按功能组织：和购物车有关的代码放在一起，改需求时只需要打开一个目录。按类型分到 components/ 和 hooks/，小项目还行；项目变大后，改一个功能要在多个目录之间跳来跳去。',
    },
  ],
  checkOnly: [
    {
      q: `LoginForm 提交后，要等一个 500 ms 的请求返回，才显示“登录成功”。这个测试会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">render(&lt;LoginForm /&gt;);
await user.type(screen.getByLabelText('邮箱'), 'a@b.com');
await user.click(screen.getByRole('button', { name: '登录' }));
expect(screen.getByText('登录成功')).toBeInTheDocument();</code></pre></div>`,
      options: [
        '通过：await user.click 会一直等到请求完成、界面更新',
        '失败：文字还没出现，应改用 await findByText',
        '失败：getByLabelText 只能找 id，找不到输入框',
        '通过，但会打印“没有用 act 包裹”的警告',
      ],
      answer: 1,
      explain: 'user.click 只等点击事件处理完，不会等请求返回。getBy… 立刻查找，找不到就抛错。findBy… 会反复查找，默认最多等 1 秒，适合异步出现的内容。getByLabelText 按 &lt;label&gt; 的文字查找，不需要 id。',
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
      explain: 'StrictMode 在开发环境故意多做一次“挂载 → 卸载 → 挂载”，正是为了暴露缺少清理函数的 bug。生产环境只挂载一次，所以每秒加 1。但组件卸载后，没有人停掉这个定时器：它会一直运行，每秒白白调用一次 set 函数。回调里如果还发请求，浪费会更明显。最有迷惑性的是第一项：StrictMode 没有制造 bug，只是让它提前出现。修法是保存 id，并返回清理函数 <code>() =&gt; clearInterval(id)</code>，而不是关掉 StrictMode。',
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
      explain: '纯客户端应用打包后只有静态文件，任何静态服务器都能部署。Server Functions 和服务端渲染都要在服务器上运行代码，静态服务器做不到。最有迷惑性的是 Create React App：它也能产出静态文件，但已于 2025 年 2 月被官方弃用，不再维护。',
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
      explain: '定时器回调是第一次渲染创建的，它读到的 count 和 step 永远是初始值。每秒都执行 <code>setCount(0 + 1)</code>，所以计数停在 1。ESLint 的 react-hooks 规则正是用来发现这种过期闭包的。“每秒加 1”有迷惑性：那是写成 <code>setCount(c =&gt; c + 1)</code> 时的行为，这里用的是旧的 count。正确的修法：<code>setCount(c =&gt; c + step)</code>，并把 step 写进依赖。',
    },
  ],
  plays: {},
};
