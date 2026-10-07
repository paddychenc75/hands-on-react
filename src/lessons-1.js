/* ========== 课程内容 · 第一阶段：入门 ========== */
const LESSONS = [];
const h = (text) => ({ t: 'h', text });
const p = (html) => ({ t: 'p', html });
const ul = (items) => ({ t: 'ul', items });
const code = (src, cap) => ({ t: 'code', src: src.replace(/^\n/, ''), cap });
const play = (src, title, note) => ({ t: 'play', src: src.replace(/^\n/, ''), title, note });
const tip = (html) => ({ t: 'call', kind: 'tip', label: '要点', html });
const warn = (html) => ({ t: 'call', kind: 'warn', label: '常见坑', html });
const like = (html) => ({ t: 'call', kind: 'like', label: '打个比方', html });
const deep = (html) => ({ t: 'call', kind: 'deep', label: '深入一点', html });
const table = (head, rows) => ({ t: 'table', head, rows });
const fig = (html, cap) => ({ t: 'fig', html, cap });
const lesson = (o) => LESSONS.push(o);

/* ---------- 1 ---------- */
lesson({
  id: 'what-is-react', stage: 0, title: 'React 是什么', mins: 14,
  summary: '理解 React 解决的问题，以及“UI = f(state)”这个核心思想。',
  goals: ['能说出 React 要解决的问题：数据变了，界面要跟着变', '能用“UI = f(state)”解释点击按钮后界面为什么会更新', '能判断一段代码是命令式还是声明式', '能修改并运行一个返回 JSX 的 App 组件'],
  keyPoints: [
    '问题：用原生 JS 时，数据变了要手动改每一处 DOM。漏改一处，数据和界面就对不上。',
    'React 的做法：你写组件函数，描述“在这份数据下界面长什么样”。这就是 UI = f(state)。',
    '数据变化时，React 重新调用组件函数，再只把差异更新到页面。',
    '命令式写步骤（找元素、改文字），声明式写结果（返回 JSX）。React 让你只写结果。',
  ],
  body: [
    p('React 是一个<b>构建用户界面的 JavaScript 库</b>。它由 Meta（原 Facebook）开源。它只关心一件事：<b>根据数据，把界面画出来</b>；数据变了，就自动把界面更新成新的样子。'),
    h('先看看没有 React 时怎么写'),
    p('假设页面上有一个计数器按钮。用原生 JavaScript 时，你要自己完成每一步：'),
    p('<ol class="task-steps"><li>找到元素。</li><li>监听点击。</li><li>修改变量。</li><li>把新数字写回页面。</li></ol>'),
    code(`
// 命令式：一步一步告诉浏览器“怎么做”
let count = 0;
const btn = document.querySelector('#btn');
const label = document.querySelector('#label');
btn.addEventListener('click', () => {
  count = count + 1;
  label.textContent = '点击了 ' + count + ' 次'; // 别忘了手动更新界面！
});`, '原生 JS：数据和界面要你自己保持同步'),
    p('界面变复杂后，需要同步更新的地方会越来越多。漏掉一处，数据和界面就对不上，这就是 bug。'),
    h('React 的做法：声明式'),
    p('在 React 里，你只需要<b>描述“在某个数据下，界面应该长什么样”</b>。至于怎么从旧界面变到新界面，交给 React 去算。'),
    play(`
import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      点击了 {count} 次
    </button>
  );
}`, '你的第一个 React 组件', '点一下按钮试试。然后把“点击了”改成别的文字，点“运行”看看效果。'),
    like('命令式像给司机逐条指路：“直走 200 米，左转，再右转……”。声明式像打车时直接说目的地：“去火车站”。路线由司机（React）负责规划。'),
    h('核心公式：UI = f(state)'),
    p('这是理解 React 最重要的一句话。<b>state（状态）</b>是会变化的数据，<b>f</b> 是你写的组件函数，<b>UI</b> 是它返回的界面。数据一变，React 就重新调用这个函数，得到新界面，再把<b>差异</b>高效地更新到页面上。'),
    fig(`<div class="formula"><span class="f-box">state<small>数据</small></span><span class="f-op">→</span><span class="f-box f-fn">组件函数 f<small>你写的代码</small></span><span class="f-op">→</span><span class="f-box">UI<small>界面</small></span></div>`, '你只负责写 f，“状态变化后更新界面”这件事交给 React'),
    h('React 的三个关键词'),
    ul([
      '<b>组件（Component）</b>：可复用的界面积木，例如按钮、导航栏、商品卡片。',
      '<b>声明式（Declarative）</b>：描述结果，而不是步骤。',
      '<b>单向数据流</b>：数据从父组件流向子组件，变化的来源清晰可追踪。'
    ]),
    tip('本应用的所有“运行”框都是真实的 React 18 环境。代码里的 <code>import</code> 语句会被自动处理。你只需要定义一个名为 <code>App</code> 的组件。它会显示在右侧预览区。课程里标注“React 19”的示例只能阅读，不能运行。'),
  ],
  quiz: [
    { q: '点击按钮后 count 从 1 变成 2。React 怎样让页面显示 2？', options: ['重新调用组件函数，算出新界面，再把差异更新到页面', '找到页面上的数字 1，直接把它替换成 2', '刷新整个页面，再按新数据画一遍', '监听 DOM 的每一次变化，再把新值同步回 count 变量'], answer: 0, explain: '这就是 UI = f(state)：数据变了，React 重新执行 f，只更新有差异的部分。第二项最容易误选：那是你用原生 JS 时要手写的步骤，React 让你不用写它。React 也不会刷新整个页面。' },
    { q: '下面哪段代码是“声明式”的写法？', options: ['label.textContent = \'点击了 \' + count + \' 次\'', 'return <p>点击了 {count} 次</p>', 'btn.addEventListener(\'click\', update)', 'label.hidden = count === 0'], answer: 1, explain: 'JSX 只描述“在这个 count 下界面是什么样”，没有写怎样改 DOM。其他三项都在一步步操作某个 DOM 元素。最容易误选的是最后一项：它看起来像一个“条件”，但仍然是在命令浏览器修改元素。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>把 <code>&lt;p&gt;</code> 改成 <code>&lt;h1&gt;</code>。</li><li>把文字改成 <b>你好，React</b>。</li></ol>',
    starter: `function App() {
  return <p>把我改成 h1 标题</p>;
}`,
    solution: `function App() {
  return <h1>你好，React</h1>;
}`,
    hint: '把 <code>&lt;p&gt;...&lt;/p&gt;</code> 换成 <code>&lt;h1&gt;...&lt;/h1&gt;</code>，并修改文字。',
    faded: `function App() {
  return /* ✏️ 一个 h1 标签，文字是“你好，React” */;
}`,
    test: async (t) => {
      const el = t.q('h1');
      t.assert(el, '没有找到 <h1> 元素');
      t.assert(el.textContent.replace(/\s/g, '').includes('你好，React'), 'h1 的文字应该是“你好，React”（注意是中文逗号）');
    }
  }
});

/* ---------- 2 ---------- */
lesson({
  id: 'jsx', stage: 0, title: 'JSX：在 JS 里写界面', mins: 20,
  summary: '学会 JSX 的语法规则，以及如何用 {} 嵌入 JavaScript 表达式。',
  goals: ['能说出一段 JSX 编译后得到的是什么（一个描述界面的 JS 对象）', '能在 {} 里写出表达式，并判断一段代码能不能放进 {}', '能找出并修复违反 JSX 规则的写法', '能判断哪些写法会绕过转义、带来 XSS 风险'],
  keyPoints: [
    'JSX 会被编译成创建元素的函数调用。结果是一个描述界面的普通 JS 对象。',
    '<code>{}</code> 里只能放表达式（会产生值的代码）。if、for 是语句，要换成三元运算符、<code>&amp;&amp;</code> 或 <code>.map()</code>。',
    '硬规则：只有一个根元素（可以用片段 <code>&lt;&gt;&lt;/&gt;</code>）、标签必须闭合、用 <code>className</code>、属性名用驼峰、<code>style</code> 接收对象。',
    '<code>{}</code> 会把字符串转义成文字，所以显示用户输入是安全的。<code>dangerouslySetInnerHTML</code> 和 <code>javascript:</code> 网址会绕过这层保护。',
  ],
  body: [
    p('JSX 是一种看起来像 HTML 的 JavaScript 语法扩展。它让你在 JS 代码中直接写出界面结构，读起来非常直观。'),
    code(`const element = <h1 className="title">你好</h1>;`),
    p('浏览器其实不认识 JSX。在运行前，编译工具（如 Babel）会把它翻译成普通的函数调用。现代工具链（Vite、Next.js）生成 <code>jsx()</code> 调用。旧写法是 <code>React.createElement()</code>。两者作用相同。下面用旧写法演示：'),
    code(`// 上面那行 JSX 会被编译成（旧写法）：
const element = React.createElement('h1', { className: 'title' }, '你好');
// 返回的是一个普通 JS 对象，描述“要画什么”：
// { type: 'h1', props: { className: 'title', children: '你好' } }`, 'JSX 是创建元素函数的语法糖'),
    tip('记住：<b>JSX 最终就是一个 JS 对象</b>。所以它可以赋值给变量、作为函数参数、从函数中返回、放进数组里。'),
    h('用花括号 {} 嵌入 JavaScript'),
    p('在 JSX 中，花括号 <code>{}</code> 是通往 JavaScript 世界的“窗口”。里面可以写任何<b>表达式</b>（会产生一个值的代码）：变量、运算、函数调用、三元运算符等。'),
    play(`
function App() {
  const name = '小红';
  const price = 99;
  const user = { avatar: '🐱', city: '杭州' };
  const today = new Date().toLocaleDateString('zh-CN');

  return (
    <div>
      <h2>{user.avatar} 你好，{name}！</h2>
      <p>来自：{user.city}</p>
      <p>两件商品共 {price * 2} 元</p>
      <p>今天是 {today}</p>
      <p>名字长度：{name.length}</p>
    </div>
  );
}`, '花括号里放表达式'),
    warn('花括号里只能放<b>表达式</b>，不能放<b>语句</b>。<code>{if (x) ...}</code>、<code>{for (...)}</code> 都是错的。需要判断时用三元运算符 <code>{x ? a : b}</code> 或 <code>&amp;&amp;</code>，需要循环时用 <code>.map()</code>，后面会专门讲。'),
    h('JSX 的几条硬规则'),
    table(['规则', '错误写法', '正确写法'], [
      ['只能返回<b>一个</b>根元素', '<code>return &lt;h1/&gt;&lt;p/&gt;</code>', '用 <code>&lt;div&gt;</code> 或片段 <code>&lt;&gt;...&lt;/&gt;</code> 包起来'],
      ['标签必须闭合', '<code>&lt;img src="a.png"&gt;</code>', '<code>&lt;img src="a.png" /&gt;</code>'],
      ['class 要写成 className', '<code>class="box"</code>', '<code>className="box"</code>'],
      ['属性用驼峰命名（例外：<code>aria-*</code> 和 <code>data-*</code> 保留短横线）', '<code>onclick</code>、<code>tabindex</code>', '<code>onClick</code>、<code>tabIndex</code>'],
      ['style 接收对象', '<code>style="color:red"</code>', '<code>style={{ color: \'red\' }}</code>'],
    ]),
    p('为什么 <code>style</code> 有两层花括号？外层 <code>{}</code> 表示“这里是 JS”，内层 <code>{}</code> 是一个 JS 对象字面量。CSS 属性名也要改成驼峰：<code>font-size</code> → <code>fontSize</code>。'),
    play(`
function App() {
  const big = true;
  return (
    <>
      <h3 className="hello" style={{ color: 'tomato', fontSize: big ? 28 : 14 }}>
        片段 {'<></>'} 不会产生多余的 DOM 节点
      </h3>
      <input placeholder="自闭合标签要写 />" />
      <label htmlFor="x">for 也要写成 htmlFor</label>
    </>
  );
}`, '规则演示'),
    warn('你可能看到的报错：<br><code>Adjacent JSX elements must be wrapped in an enclosing tag</code>：组件返回了多个并列的根元素。用 <code>&lt;div&gt;</code> 或片段 <code>&lt;&gt;...&lt;/&gt;</code> 把它们包起来。<br><code>Objects are not valid as a React child</code>：你在 <code>{}</code> 里放了一个对象，例如 <code>{user}</code>。改成显示它的字段，例如 <code>{user.name}</code>。'),
    deep('为什么只能有一个根元素？因为 JSX 会变成一次函数调用（<code>jsx(...)</code> 或 <code>createElement(...)</code>），而一个函数只能返回一个值。片段 <code>&lt;&gt;&lt;/&gt;</code> 是 <code>React.Fragment</code> 的简写，它能把多个元素打包成一个值，又不会在页面上多出一层 div。'),
    h('安全：花括号会转义文字'),
    p('<code>{}</code> 中的字符串只会显示为文字。即使字符串里有 <code>&lt;script&gt;</code> 或 <code>&lt;img onerror&gt;</code>，React 也会先转义。所以用 <code>{}</code> 显示用户输入是安全的。下面三种写法会绕过这层保护：'),
    ul(['<b>dangerouslySetInnerHTML</b>：它把字符串当作 HTML 插入，不转义。只用于可信的内容。用户提供的 HTML，先用 DOMPurify 清洗，或者不用它。', '<b>href 中的 javascript: 网址</b>：点击时会执行代码。React 19 会阻止这种网址，React 18 只在控制台警告。使用用户提供的网址前，先检查它以 https:// 或 http:// 开头。', '<b>拼接 HTML 字符串</b>：不要写 <code>\'&lt;b&gt;\' + name + \'&lt;/b&gt;\'</code> 再插入页面。用 JSX 描述结构。']),
    code(`const comment = '<img src=x onerror="alert(1)">'; // 来自用户

<p>{comment}</p>                                        // ✅ 显示为文字，不执行
<p dangerouslySetInnerHTML={{ __html: comment }} />     // ❌ onerror 会执行
<p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment) }} /> // 必须插入 HTML 时，先清洗`, 'XSS：跨站脚本攻击'),
  ],
  quiz: [
    { q: 'JSX <code>&lt;h1&gt;Hi&lt;/h1&gt;</code> 编译后本质上是什么？', options: ['一段 HTML 字符串', '一次创建元素的函数调用，返回一个普通对象', '一个真实的 DOM 节点', '一个 CSS 规则'], answer: 1, explain: 'JSX 被编译成创建元素的函数调用（jsx() 或 createElement()）。它返回一个描述界面的普通 JS 对象，叫 React 元素。最容易误选的是“HTML 字符串”：JSX 从不拼接字符串，所以 {} 里的内容默认会被转义。真实 DOM 节点要等 React 提交到页面时才创建。' },
    { q: '下面哪种写法可以放在 JSX 的 {} 里？', options: ['if (ok) { return 1 }', 'for (let i=0;i<3;i++){}', 'ok ? "是" : "否"', 'let a = 1'], answer: 2, explain: '{} 中只能放表达式，也就是会产生一个值的代码。三元运算符是表达式。if、for 和 let 声明都是语句，没有值。最容易误选的是 if：要在 JSX 里做判断，就改用三元运算符或 &&。' },
    { q: '把一段 HTML 原样粘进组件：<code>&lt;div class="box" style="color:red"&gt;&lt;img src="a.png"&gt;&lt;/div&gt;</code>。要改哪些地方？', options: ['只要把 class 改成 className', '只要把 img 改成自闭合', 'class、style、img 三处都要改', '都不用改，JSX 兼容 HTML'], answer: 2, explain: 'img 没有闭合是语法错误。style 必须是对象，写成字符串会报错。class 要写成 className。最容易误选的是最后一项：JSX 看起来像 HTML，但它是 JavaScript，规则更严格。' },
    { q: '用户的昵称是 <code>&lt;b onmouseover="alert(1)"&gt;小明&lt;/b&gt;</code>。代码写 <code>&lt;p&gt;{nickname}&lt;/p&gt;</code>。页面会怎样？', options: ['显示加粗的“小明”，鼠标移上去弹窗', '原样显示整段字符串，代码不执行', '显示空白', '报错'], answer: 1, explain: '{} 中的字符串会被转义，只显示为文字，所以代码不会执行。最容易误选的是第一项：只有用 dangerouslySetInnerHTML 把它当作 HTML 插入，才会出现加粗和弹窗。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>渲染一个 <code>&lt;h2&gt;</code>，用花括号显示 <code>user.name</code>（<b>小明</b>）。</li><li>渲染一个 <code>&lt;p&gt;</code>，显示 <b>明年 19 岁</b>。</li><li>用 <code>user.age + 1</code> 计算年龄。不要直接写 19。</li></ol>',
    starter: `function App() {
  const user = { name: '小明', age: 18 };
  return (
    <div>
      {/* 在这里写 h2 和 p */}
    </div>
  );
}`,
    solution: `function App() {
  const user = { name: '小明', age: 18 };
  return (
    <div>
      <h2>{user.name}</h2>
      <p>明年 {user.age + 1} 岁</p>
    </div>
  );
}`,
    hint: '花括号 <code>{}</code> 里可以放任何表达式。怎样从 user 对象里取出名字？怎样在它的年龄上加 1？',
    faded: `function App() {
  const user = { name: '小明', age: 18 };
  return (
    <div>
      <h2>{/* ✏️ 从 user 对象里取出名字 */}</h2>
      <p>明年 {/* ✏️ 用 user 的年龄算出明年的年龄，不要直接写数字 */} 岁</p>
    </div>
  );
}`,
    test: async (t) => {
      const h2 = t.q('h2'); t.assert(h2 && h2.textContent.trim() === '小明', '需要一个内容为“小明”的 <h2>');
      const ps = t.qa('p'); t.assert(ps.some(x => x.textContent.replace(/\s/g, '') === '明年19岁'), '需要一个内容为“明年 19 岁”的 <p>');
      t.assert(!/\b19\b/.test(t.source), '不要直接写 19。请用 user.age + 1 计算');
      t.assert(/\bage\s*\+\s*1\b|\b1\s*\+\s*(\w+\.)?age\b/.test(t.source), '年龄要用 user.age + 1 计算');
    }
  }
});

/* ---------- 3 ---------- */
lesson({
  id: 'components-props', stage: 0, title: '组件与 Props', mins: 18,
  summary: '把界面拆成组件，用 props 给组件传数据。',
  goals: ['能写出一个函数组件，并在 App 里多次使用它', '能通过 props 传入数据，并用解构和默认值读取它', '能找出修改 props 的错误写法，说出正确的改法', '能用 children 写一个“包裹”内容的容器组件'],
  keyPoints: [
    '组件是返回 JSX 的函数，名字必须大写开头。React 靠大写区分组件和 HTML 标签。',
    '父组件通过 props 传入数据，就像给函数传参数。子组件常用解构读取：<code>function Card({ name, emoji = \'🙂\' })</code>。',
    'props 是只读的。子组件不能改它；数据由谁拥有，就由谁修改。',
    '写在组件开闭标签之间的内容，会作为 <code>children</code> 传入。',
  ],
  body: [
    p('<b>组件就是一个返回 JSX 的函数</b>。组件名必须以<b>大写字母</b>开头。React 用这一点区分组件和 HTML 标签：<code>&lt;div&gt;</code> 是标签，<code>&lt;Card&gt;</code> 是组件。'),
    play(`
function Avatar() {
  return <span style={{ fontSize: 40 }}>🦊</span>;
}

function App() {
  return (
    <div>
      <Avatar />
      <Avatar />
      <Avatar />
    </div>
  );
}`, '定义一次，到处使用'),
    h('Props：组件的参数'),
    p('如果每个组件都只能显示一模一样的内容，用处就不大了。<b>props</b>（properties 的缩写）让父组件把数据传给子组件。这就像给函数传参数。'),
    play(`
function UserCard({ name, role, emoji = '🙂' }) {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 10, margin: 6 }}>
      <b>{emoji} {name}</b>
      <div style={{ color: 'gray' }}>{role}</div>
    </div>
  );
}

function App() {
  return (
    <div>
      <UserCard name="张三" role="前端工程师" emoji="👨‍💻" />
      <UserCard name="李四" role="设计师" emoji="🎨" />
      <UserCard name="王五" role="产品经理" />
    </div>
  );
}`, '通过 props 传入数据', '王五没有传 emoji，所以用了默认值 🙂。'),
    p('上面用到了 <b>解构</b>：<code>function UserCard({ name, role })</code> 等价于先接收一个 <code>props</code> 对象，再取出 <code>props.name</code>、<code>props.role</code>。<code>emoji = \'🙂\'</code> 是解构时的默认值。'),
    like('组件像一个模具，props 像往模具里倒的材料。同一个“卡片模具”，倒入不同的名字和职位，就做出不同的卡片。'),
    h('Props 是只读的'),
    warn('组件<b>绝对不能修改自己的 props</b>。<code>props.name = \'新名字\'</code> 这样的代码是错误的。props 属于父组件，子组件只能读取。想要“可变化的数据”，要用下一课的 <b>state</b>。'),
    p('组件要像<b>纯函数</b>。同样的 props 和 state，返回同样的 JSX。渲染时不要修改组件外的变量，不要发请求，不要改 DOM。这些事放在事件处理函数里。第 14 课会讲剩下的情况。'),
    h('特殊的 prop：children'),
    p('写在组件开闭标签之间的内容，会作为 <code>children</code> prop 传进去。这让你可以做出“容器”类组件，比如面板、弹窗、布局。'),
    play(`
function Panel({ title, children }) {
  return (
    <section style={{ border: '2px solid #087ea4', borderRadius: 10, padding: 12, margin: 8 }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function App() {
  return (
    <>
      <Panel title="公告">
        <p>本周五下午 3 点开会。</p>
      </Panel>
      <Panel title="待办">
        <ul><li>写周报</li><li>修 bug</li></ul>
      </Panel>
    </>
  );
}`, 'children 让组件可以“包裹”任意内容'),
    tip('组件拆分的经验法则：一个组件只做一件事。如果一个组件越来越长，或者某块界面在多处重复出现，就是拆分的信号。'),
  ],
  quiz: [
    { q: '你写了 <code>function card() {…}</code>，再在 App 里写 <code>&lt;card /&gt;</code>。页面上会怎样？', options: ['正常显示 card 函数返回的内容', 'React 把它当成 HTML 标签 card，函数不会被调用', '编译时报语法错误', '只在严格模式下才能显示'], answer: 1, explain: 'JSX 用首字母区分：小写当作 HTML 标签，大写才当作组件去调用。所以页面上只有一个空的 &lt;card&gt; 元素（控制台会警告）。最容易误选的是“报语法错误”：小写标签在语法上完全合法，所以不会报错，这正是它难发现的原因。' },
    { q: '子组件想改变收到的 props.count，应该？', options: ['直接 props.count++', '用 Object.assign 修改 props', '不能修改；应由拥有数据的父组件修改并重新传入', '把 props 存到全局变量再改'], answer: 2, explain: 'props 是只读的。数据由谁拥有，就由谁修改。常见做法是父组件再通过 props 传入一个回调函数，子组件调用它。前两项看起来能改，但改的是父组件的数据，React 不知道，界面也不会更新。' },
    { q: 'Panel 写成 <code>function Panel({ title }) { return &lt;section&gt;&lt;h3&gt;{title}&lt;/h3&gt;&lt;/section&gt;; }</code>。使用时写 <code>&lt;Panel title="公告"&gt;&lt;p&gt;周五开会&lt;/p&gt;&lt;/Panel&gt;</code>。页面上会显示什么？', options: ['标题“公告”和“周五开会”', '只有标题“公告”', '只有“周五开会”', '报错：Panel 不接收子元素'], answer: 1, explain: '标签之间的 &lt;p&gt; 会作为 children 传入，但 Panel 没有读取也没有渲染 children，所以它被丢掉了。最容易误选的是第一项：children 不会自动出现，要在 JSX 里写 {children}。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>写一个 <code>Greeting</code> 组件，接收 <code>name</code> prop。</li><li>让它渲染 <code>&lt;p className="greeting"&gt;你好，{name}&lt;/p&gt;</code>。</li><li>在 <code>App</code> 中渲染 3 个 Greeting，<code>name</code> 分别为 <b>小明</b>、<b>小红</b>、<b>小刚</b>。</li></ol>',
    starter: `function Greeting(/* 接收 props */) {
  // 返回 <p className="greeting">你好，名字</p>
}

function App() {
  return (
    <div>
      {/* 使用 Greeting 三次 */}
    </div>
  );
}`,
    solution: `function Greeting({ name }) {
  return <p className="greeting">你好，{name}</p>;
}

function App() {
  return (
    <div>
      <Greeting name="小明" />
      <Greeting name="小红" />
      <Greeting name="小刚" />
    </div>
  );
}`,
    exports: ['Greeting'],
    hint: 'Greeting 收到的参数是一个 props 对象。怎样从中取出 name？在 App 里，怎样像 HTML 属性一样把名字传进去？',
    faded: `function Greeting(/* ✏️ 从 props 中解构出 name */) {
  return <p className="greeting">你好，{name}</p>;
}

function App() {
  return (
    <div>
      {/* ✏️ 渲染 Greeting，通过 props 传入 name="小明" */}
      {/* ✏️ 再渲染两个 Greeting，分别传入“小红”和“小刚” */}
    </div>
  );
}`,
    test: async (t) => {
      t.assert(typeof t.exports.Greeting === 'function', '请定义 Greeting 组件');
      t.assert((t.source.match(/<Greeting\b/g) || []).length >= 1, '请在 App 中使用 <Greeting />');
      const els = t.qa('.greeting');
      t.assert(els.length === 3, `应有 3 个 className 为 greeting 的元素，现在有 ${els.length} 个`);
      const txt = els.map(e => e.textContent.replace(/\s/g, ''));
      ['小明', '小红', '小刚'].forEach(n => t.assert(txt.includes('你好，' + n), `没有找到“你好，${n}”`));
    }
  }
});

/* ---------- 4 ---------- */
lesson({
  id: 'state', stage: 0, title: 'State：让组件“记住”东西', mins: 22,
  summary: '用 useState 保存会变化的数据，理解为什么普通变量不行。',
  goals: ['能用 useState 声明 state，并在事件处理函数里调用 set 函数更新它', '能解释为什么修改普通变量不会更新界面', '能预测连续调用 set 函数后的结果，并在需要时改用函数式更新', '能写出对象和数组的不可变更新'],
  keyPoints: [
    '普通变量不行：修改它不会通知 React；而且每次渲染时，它都会被重新初始化。',
    '<code>const [count, setCount] = useState(0)</code>：React 替你保存值。调用 set 函数，React 就会重新渲染。',
    '一次渲染 = 一张快照：调用 set 函数后，本次渲染里的 count 不会变，新值在下一次渲染才看到。',
    '新值依赖旧值时，用函数式更新 <code>setCount(c =&gt; c + 1)</code>。React 会按队列依次用最新值计算。',
    '对象和数组要换成新的（<code>{ ...user, age: 19 }</code>、<code>[...tags, x]</code>）。直接修改原来的，引用没变，界面不会更新。',
  ],
  body: [
    p('组件经常需要“记住”一些会变的信息：输入框里的文字、购物车数量、弹窗是否打开。这种数据叫 <b>state（状态）</b>。'),
    h('为什么普通变量不行？'),
    play(`
function App() {
  let count = 0; // 普通变量

  function handleClick() {
    count = count + 1;
    console.log('count 现在是', count);
  }

  return <button onClick={handleClick}>点击了 {count} 次</button>;
}`, '失败的计数器', '点几下按钮，看看下方控制台：变量确实增加了，但界面没变。'),
    p('有两个原因：'),
    p('<ol class="task-steps"><li>修改普通变量<b>不会通知 React</b> 重新渲染。</li><li>就算重新渲染了，函数重新执行时 <code>let count = 0</code> 又会把它重置为 0。</li></ol>'),
    h('useState 登场'),
    p('<code>useState</code> 解决这两个问题。第一，React 替你<b>保存</b>这个值，重新渲染后值还在。第二，你得到一个 <b>set 函数</b>。调用 set 函数，React 就会重新渲染。'),
    play(`
import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  //     当前值   set 函数          初始值

  return (
    <div>
      <p>当前计数：{count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(0)}>归零</button>
    </div>
  );
}`, '正确的计数器'),
    like('state 像组件的“记忆”。每次调用 setCount，就像对 React 说：“这个记忆更新了，请按新记忆重新画一遍。”'),
    h('一次渲染 = 一张快照'),
    p('新手最容易在这里困惑。下面有两个“+3”按钮。写法 A 连续调用三次 <code>setCount(count + 1)</code>；写法 B 连续调用三次 <code>setCount(c =&gt; c + 1)</code>。'),
    play(`
import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  // 写法 A
  function addThreeA() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
    console.log('点击时的 count =', count);
  }

  // 写法 B
  function addThreeB() {
    setCount(c => c + 1);
    setCount(c => c + 1);
    setCount(c => c + 1);
  }

  return (
    <div>
      <p>count: {count}</p>
      <button onClick={addThreeA}>+3（写法 A）</button>
      <button onClick={addThreeB}>+3（写法 B）</button>
    </div>
  );
}`, '快照 vs 函数式更新', '写法 A 只加了 1。这次渲染里 count 是 0，三次调用都在请求“设为 1”。控制台也打印 0：调用 set 函数后，本次渲染里的 count 没有变。写法 B 传入的是函数，React 按队列依次计算：0 → 1 → 2 → 3。'),
    p('原因：<b>调用 set 函数不会立刻改变本次渲染中的 count</b>。在一次渲染中，state 的值是固定的，就像一张照片。写法 A 的三次调用读到的都是同一个 count。'),
    tip('当新状态依赖旧状态时，优先使用<b>函数式更新</b> <code>setX(prev =&gt; ...)</code>。React 会把这些函数排成队列，依次用最新值计算。'),
    h('状态是对象或数组时'),
    p('React 通过 <code>Object.is</code> 比较新旧值来判断是否需要更新。如果你直接修改对象再传回去，引用没变，React 会认为“什么都没变”。所以<b>必须创建一个新对象</b>。'),
    play(`
import { useState } from 'react';

function App() {
  const [user, setUser] = useState({ name: '小明', age: 18 });
  const [tags, setTags] = useState(['React']);

  return (
    <div>
      <p>{user.name}，{user.age} 岁</p>
      {/* ✅ 展开旧对象，覆盖要改的字段 */}
      <button onClick={() => setUser({ ...user, age: user.age + 1 })}>长大一岁</button>
      <p>标签：{tags.join('、')}</p>
      {/* ✅ 创建新数组 */}
      <button onClick={() => setTags([...tags, 'Hooks'])}>添加标签</button>
    </div>
  );
}`, '不可变更新'),
    warn('<code>user.age++; setUser(user);</code> 是错误写法：对象引用没变，界面不会更新。数组也一样，不要用 <code>push</code>、<code>splice</code>、<code>sort</code> 直接改原数组，用 <code>[...arr, x]</code>、<code>filter</code>、<code>map</code> 生成新数组。'),
    warn('<code>useState</code> 要写在组件函数的最上面。不要放在 if 或循环里。也不要放在提前 return 之后。原因在第 15 课讲。'),
    warn('你可能看到的报错：<code>Too many re-renders. React limits the number of renders to prevent an infinite loop.</code><br>原因：渲染时直接调用了 set 函数。set 函数触发渲染，渲染又调用它，形成死循环。<br>去看：常见的是 <code>onClick={setCount(count + 1)}</code>。改成传一个函数：<code>onClick={() =&gt; setCount(count + 1)}</code>。'),
  ],
  quiz: [
    { q: 'count 为 0。点击时执行 setCount(count + 1); setCount(c => c + 1);，渲染后 count 是？', options: ['2', '1', '3', '0'], answer: 0, explain: '第一次请求“替换为 1”。第二次传的是函数，它在队列里拿到最新值 1，再加 1，所以是 2。最容易误选的是 1：第二次调用不读本次渲染的 count，而是读队列里的值。' },
    { q: '以下哪种更新对象 state 的方式能让界面更新？', options: ['user.name = "a"; setUser(user)', 'setUser({ ...user, name: "a" })', 'Object.assign(user, { name: "a" }); setUser(user)', 'setUser(user); user.name = "a"'], answer: 1, explain: '必须传入一个新对象。React 用 Object.is 比较新旧值，引用相同就判定“没变”，跳过更新。第三项最迷惑：name 确实改了，但改的是原对象，传回去的还是同一个引用。' },
    { q: '在组件里写 <code>let count = 0</code>，点击时执行 <code>count = count + 1</code>。为什么界面不变？', options: ['修改它不通知 React；就算重新渲染，它也会被重置为 0', 'React 会重新渲染，但新值要等下一次点击才显示', '修改成功了，只是浏览器需要刷新才显示', 'let 声明的变量在组件里是只读的'], answer: 0, explain: '组件函数每次渲染都重新执行，局部变量会重置。修改它也不会通知 React。最容易误选的是第二项：那描述的是 state 的“快照”行为，而普通变量根本不会触发渲染。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>声明一个 state <code>count</code>，初始值为 0。</li><li>在 <code>&lt;span id="count"&gt;</code> 中显示 count。</li><li>点击按钮 <b>+1</b> 时，count 加 1。</li><li>点击按钮 <b>-1</b> 时，count 减 1。</li><li>点击按钮 <b>+3</b> 时，count 加 3。快速连点时结果也要正确。</li><li>建议这样写 +3：在处理函数里调用三次 <code>setCount</code>，每次加 1。想一想：哪种写法能让三次调用都生效？</li></ol>',
    starter: `import { useState } from 'react';

function App() {
  // 声明 count 状态

  return (
    <div>
      <button>-1</button>
      <span id="count">0</span>
      <button>+1</button>
      <button>+3</button>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c => c - 1)}>-1</button>
      <span id="count">{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <button onClick={() => {
        setCount(c => c + 1);
        setCount(c => c + 1);
        setCount(c => c + 1);
      }}>+3</button>
    </div>
  );
}`,
    hint: 'useState 返回两个值：一个用来显示，一个用来在点击时更新。+3 连续更新三次：每次都要基于最新值，该用哪种写法？',
    faded: `import { useState } from 'react';

function App() {
  /* ✏️ 声明 count 和它的 set 函数，初始值为 0 */
  return (
    <div>
      <button onClick={() => setCount(c => c - 1)}>-1</button>
      <span id="count">{/* ✏️ 显示 count */}</span>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <button onClick={() => {
        /* ✏️ 调用三次 set 函数，每次都基于最新值加 1 */
      }}>+3</button>
    </div>
  );
}`,
    test: async (t) => {
      const c = () => t.text('#count');
      t.assert(t.q('#count'), '找不到 id="count" 的元素');
      t.assert(c() === '0', '初始值应为 0');
      const plus = t.byText('button', '+1'), minus = t.byText('button', '-1');
      t.assert(plus && minus, '需要文字为 +1 和 -1 的两个按钮');
      await t.click(plus); await t.click(plus); await t.click(plus);
      t.assert(c() === '3', `点 3 次 +1 后应为 3，实际是 ${c()}`);
      await t.click(minus);
      t.assert(c() === '2', `再点一次 -1 后应为 2，实际是 ${c()}`);
      const plus3 = t.byText('button', '+3'); t.assert(plus3, '需要文字为 +3 的按钮');
      await t.click(plus3);
      t.assert(c() === '5', `点 +3 后应从 2 变成 5，实际是 ${c()}。连续调用三次 setCount(count + 1) 时，三次读到的是同一个 count。请用函数式更新 setCount(c => c + 1)`);
      // 同一轮里连点两次：第二次点击时 React 还没重新渲染。只有基于最新值的更新才能得到 11
      plus3.click(); plus3.click();
      await t.wait(60);
      t.assert(c() === '11', `快速连点两次 +3，应从 5 变成 11，实际是 ${c()}。第二次点击时，处理函数读到的还是旧的 count。每次加 1 都要基于最新值：setCount(c => c + 1)`);
    }
  }
});

/* ---------- 5 ---------- */
lesson({
  id: 'events', stage: 0, title: '事件处理', mins: 17,
  summary: '响应点击、输入、键盘等用户操作。',
  goals: ['能给元素绑定事件处理函数，包括需要传参的写法', '能找出 <code>onClick={handleClick()}</code> 这类“调用了函数”的错误并修复', '能用事件对象读取输入值、阻止默认行为、阻止冒泡', '能通过 props 传入 onXxx 函数，让子组件通知父组件'],
  keyPoints: [
    '把<b>函数本身</b>传给事件属性：<code>onClick={handleClick}</code>，需要传参时写 <code>onClick={() =&gt; handleClick(x)}</code>。',
    '<code>onClick={handleClick()}</code> 是错的：渲染时就会执行，React 拿到的是它的返回值。',
    '事件对象：<code>e.target.value</code> 读输入，<code>e.preventDefault()</code> 阻止默认行为，<code>e.stopPropagation()</code> 阻止冒泡。',
    '子组件要通知父组件时，父组件通过 props 传入一个 onXxx 函数，子组件在事件里调用它。',
  ],
  body: [
    p('在 React 中绑定事件，就是把一个<b>函数</b>传给元素的 <code>onXxx</code> 属性。属性名用驼峰命名：<code>onClick</code>、<code>onChange</code>、<code>onKeyDown</code>、<code>onSubmit</code>……'),
    play(`
function App() {
  function handleClick() {
    console.log('按钮被点击了');
  }
  return (
    <div>
      <button onClick={handleClick}>方式一：传函数名</button>
      <button onClick={() => console.log('箭头函数')}>方式二：内联箭头函数</button>
      <button onClick={() => greet('小明')}>方式三：需要传参时</button>
    </div>
  );
}

function greet(name) { console.log('你好，' + name); }`, '三种常见写法'),
    warn('<code>onClick={handleClick()}</code> 是错的！加了括号，函数会<b>在渲染时立刻执行</b>。React 拿到的是它的返回值，通常是 undefined。要传的是<b>函数本身</b>：<code>onClick={handleClick}</code> 或 <code>onClick={() =&gt; handleClick(x)}</code>。'),
    h('事件对象'),
    p('处理函数会收到一个事件对象 <code>e</code>。React 包装了浏览器的原生事件，叫合成事件（SyntheticEvent）。它遵循 DOM 事件标准，并修复了一些浏览器差异。常用属性：'),
    ul(['<code>e.target</code>：触发事件的元素，<code>e.target.value</code> 拿到输入框的值', '<code>e.preventDefault()</code>：阻止默认行为，比如表单提交时刷新页面', '<code>e.stopPropagation()</code>：阻止事件继续向父元素冒泡', '<code>e.key</code>：键盘事件中按下的键']),
    play(`
import { useState } from 'react';

let nextId = 0; // 放在组件外：每条日志一个稳定的 id

function App() {
  const [log, setLog] = useState([]);
  const add = (msg) => setLog(l => [{ id: nextId++, msg }, ...l].slice(0, 5));

  return (
    <div onClick={() => add('外层 div 收到点击')} style={{ padding: 12, background: '#eef6fa' }}>
      <input placeholder="在这里按键" onKeyDown={e => add('按下了 ' + e.key)} />
      <button onClick={e => { e.stopPropagation(); add('按钮 A 收到点击'); }}>按钮 A</button>
      <button onClick={() => add('按钮 B 收到点击')}>按钮 B</button>
      <ul>{log.map(m => <li key={m.id}>{m.msg}</li>)}</ul>
    </div>
  );
}`, '事件对象与冒泡', '按钮 B 的点击先由按钮处理，再冒泡到外层 div，所以新增 2 条。按钮 A 调用了 e.stopPropagation()，事件停在按钮上，只新增 1 条。'),
    h('把事件处理函数作为 prop 传递'),
    p('子组件经常需要通知父组件“发生了什么”。做法是父组件传入一个函数，子组件在合适的时候调用它。按惯例，这类 prop 以 <code>on</code> 开头命名。'),
    play(`
function LikeButton({ onLike }) {
  return <button onClick={onLike}>👍 点赞</button>;
}

function App() {
  return <LikeButton onLike={() => console.log('父组件知道你点赞了')} />;
}`, '子组件通知父组件'),
    tip('命名约定：处理函数叫 <code>handleXxx</code>（如 <code>handleSubmit</code>），作为 prop 时叫 <code>onXxx</code>（如 <code>onSubmit</code>）。'),
  ],
  quiz: [
    { q: '下面哪种写法会在渲染时就执行 handleClick，而不是点击时？', options: ['onClick={handleClick}', 'onClick={() => handleClick()}', 'onClick={handleClick()}', 'onClick={e => handleClick(e)}'], answer: 2, explain: 'handleClick() 带括号，渲染时就被调用了，onClick 拿到的是它的返回值。第二、四项外面包了一层箭头函数，箭头函数要等点击时才执行，所以它们是对的。' },
    { q: '点击表单的提交按钮后，页面刷新了。在 onSubmit 处理函数里应该怎么做？', options: ['调用 e.stopPropagation()', '调用 e.preventDefault()', '在函数末尾 return false', '把 onSubmit 换成按钮的 onClick'], answer: 1, explain: 'preventDefault 阻止浏览器的默认行为（提交并刷新）。最迷惑的是 stopPropagation：它只阻止冒泡，表单照样提交。return false 只在 HTML 的 onsubmit 属性里有效，在 React 里不起作用。按钮的 onClick 也拦不住提交。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>声明一个布尔 state，初始值为 false。</li><li>在 <code>&lt;p id="status"&gt;</code> 中显示 <b>关</b>（false）或 <b>开</b>（true）。</li><li>点击按钮 <b>切换</b> 时，把 state 取反。</li></ol>',
    starter: `import { useState } from 'react';

function App() {
  return (
    <div>
      <p id="status">关</p>
      <button>切换</button>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

function App() {
  const [on, setOn] = useState(false);
  return (
    <div>
      <p id="status">{on ? '开' : '关'}</p>
      <button onClick={() => setOn(o => !o)}>切换</button>
    </div>
  );
}`,
    hint: '用一个布尔类型的 state，<code>setOn(o =&gt; !o)</code> 取反，显示时用三元运算符。',
    faded: `import { useState } from 'react';

function App() {
  /* ✏️ 声明一个布尔 state 和它的 set 函数，初始值为 false */
  return (
    <div>
      <p id="status">{/* ✏️ true 显示“开”，false 显示“关” */}</p>
      <button onClick={/* ✏️ 传入一个函数：把 state 取反 */}>切换</button>
    </div>
  );
}`,
    test: async (t) => {
      const s = () => t.text('#status');
      t.assert(s() === '关', '初始应显示“关”');
      const b = t.byText('button', '切换'); t.assert(b, '找不到“切换”按钮');
      await t.click(b); t.assert(s() === '开', '点击一次后应显示“开”');
      await t.click(b); t.assert(s() === '关', '再点一次应变回“关”');
    }
  }
});

/* ---------- 6 ---------- */
lesson({
  id: 'conditional', stage: 0, title: '条件渲染', mins: 16,
  summary: '根据条件显示不同的内容。',
  goals: ['能根据场景选择 if 提前返回、三元运算符或 &amp;&amp; 来写条件渲染', '能找出 &amp;&amp; 左边是数字 0 时显示“0”的 bug，并修复它', '能写出 return null 让组件不渲染，并把它放在所有 Hook 之后'],
  keyPoints: [
    '整个组件二选一时，用 if 提前 return；在 JSX 内部二选一，用三元运算符 <code>? :</code>。',
    '“满足条件才显示，否则什么都不显示”，用 <code>&amp;&amp;</code>。',
    '坑：<code>&amp;&amp;</code> 左边是数字 0 时，页面会显示“0”。写成 <code>count &gt; 0 &amp;&amp; …</code>。',
    '组件返回 <code>null</code> 就什么都不渲染。提前 return 要放在所有 Hook 之后。',
  ],
  body: [
    p('因为 JSX 就是 JavaScript，所以条件渲染用的就是普通的 JS 条件语法。根据场景选择最清晰的写法。'),
    h('方式一：if 提前返回'),
    p('适合整个组件根据条件输出完全不同的内容。提前 return 要放在所有 useState 之后。'),
    code(`function Greeting({ isLoggedIn }) {
  if (!isLoggedIn) {
    return <button>请登录</button>;
  }
  return <h2>欢迎回来！</h2>;
}`),
    h('方式二和方式三：三元运算符 ? : 与逻辑与 &&'),
    p('三元运算符适合在 JSX 内部“二选一”：<code>{ok ? &lt;A /&gt; : &lt;B /&gt;}</code>。逻辑与 <code>&amp;&amp;</code> 适合“满足条件才显示，否则什么都不显示”：<code>{ok &amp;&amp; &lt;A /&gt;}</code>。下面的演示同时用到这两种写法。'),
    play(`
import { useState } from 'react';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [unread, setUnread] = useState(3);

  return (
    <div>
      {loggedIn ? <h3>欢迎回来 👋</h3> : <h3>你还没有登录</h3>}

      {loggedIn && unread > 0 && <p>你有 {unread} 条未读消息</p>}

      <button onClick={() => setLoggedIn(!loggedIn)}>
        {loggedIn ? '退出' : '登录'}
      </button>
      <button onClick={() => setUnread(0)}>全部已读</button>
    </div>
  );
}`, '三元运算符与 &&'),
    p('<code>&amp;&amp;</code> 左边不一定是布尔值。下面两种写法只差一点：写法 A 直接用 count，写法 B 先比较 <code>count &gt; 0</code>。'),
    play(`
function App() {
  const count = 0;
  return (
    <div>
      <p>写法 A：{count && <b>有 {count} 条</b>}</p>
      <p>写法 B：{count > 0 && <b>有 {count} 条</b>}</p>
    </div>
  );
}`, 'count 为 0 时的两种写法', '写法 A 显示了一个“0”。0 &amp;&amp; x 的结果是 0，而 React 会渲染数字。'),
    warn('<code>{count &amp;&amp; &lt;p&gt;...&lt;/p&gt;}</code> 当 count 为 <b>0</b> 时，页面上会显示一个“0”！因为 <code>0 &amp;&amp; x</code> 的结果是 0，而 React 会渲染数字。正确写法：<code>{count &gt; 0 &amp;&amp; ...}</code> 或 <code>{!!count &amp;&amp; ...}</code>。'),
    h('不渲染任何东西：return null'),
    p('组件返回 <code>null</code>、<code>false</code> 或 <code>undefined</code> 时什么也不渲染。比如一个 <code>Modal</code> 组件，在 <code>open</code> 为 false 时直接 <code>return null</code>。'),
    p('提前 return 要写在所有 Hook（例如 useState）之后。原因第 15 课会讲，这里先记住这条规则。'),
    p('条件变成 false 时，React 会把对应的元素从页面上移除。元素里输入的内容、组件里的 state 都会丢失。条件再变回 true，得到的是一个全新的元素。'),
    tip('条件很多时，可以把判断提取到变量或一个小函数里，让 JSX 保持干净。也可以用对象映射：<code>const icons = { success: \'✅\', error: \'❌\' }; {icons[status]}</code>。'),
  ],
  quiz: [
    { q: 'const items = []; 渲染 {items.length && &lt;List /&gt;} 会显示？', options: ['什么都不显示', '0', '空的 List', '报错'], answer: 1, explain: 'items.length 是 0。0 && x 返回 0，React 会把数字 0 渲染出来。请写 items.length &gt; 0 &amp;&amp; ...。最容易误选的是“什么都不显示”：false、null、undefined 不会显示，但数字 0 会。' },
    { q: 'isAdmin 是布尔值。<code>{isAdmin ? &lt;Panel /&gt; : null}</code> 和 <code>{isAdmin &amp;&amp; &lt;Panel /&gt;}</code> 在 isAdmin 为 false 时有什么区别？', options: ['没有区别，都什么也不显示', '&& 版本会显示文字“false”', '三元版本会显示文字“null”', '&& 版本只能用在 if 里'], answer: 0, explain: 'React 不渲染 null、false、undefined 和 true，所以布尔值配 && 是安全的。最容易误选的是第二项：false 不会显示成文字。会出问题的是数字 0。' },
    { q: '<code>{show &amp;&amp; &lt;input /&gt;}</code>。在输入框里打几个字，把 show 改成 false，再改回 true。输入框里的字会怎样？', options: ['还在：React 记得输入框里的内容', '没了：show 为 false 时输入框被移除，改回来的是一个新的输入框', '输入框里显示文字“false”', '输入框一直都在，只是 show 为 false 时变灰'], answer: 1, explain: 'show 为 false 时，&& 的结果是 false，React 把输入框从页面上移除。改回 true 时，React 新建一个输入框，内容是空的。最迷惑的是第一项：只有元素一直留在页面上，内容才会保留。想保留内容，可以一直渲染它，只用 CSS（display: none）把它藏起来。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>声明 state <code>loggedIn</code>，初始值为 false。</li><li>loggedIn 为 false 时，只显示按钮 <b>登录</b>。</li><li>点击 <b>登录</b> 后，显示 <code>&lt;h2&gt;欢迎回来&lt;/h2&gt;</code> 和按钮 <b>退出</b>。</li><li>点击 <b>退出</b> 后，回到第 2 步的界面。</li></ol>',
    starter: `import { useState } from 'react';

function App() {
  // 在这里实现
  return <button>登录</button>;
}`,
    solution: `import { useState } from 'react';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  if (!loggedIn) {
    return <button onClick={() => setLoggedIn(true)}>登录</button>;
  }
  return (
    <div>
      <h2>欢迎回来</h2>
      <button onClick={() => setLoggedIn(false)}>退出</button>
    </div>
  );
}`,
    hint: '可以用 if 提前 return，也可以用三元运算符。',
    faded: `import { useState } from 'react';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  if (/* ✏️ 什么情况下只显示“登录”按钮？ */) {
    return <button onClick={/* ✏️ 点击后变成已登录 */}>登录</button>;
  }
  return (
    <div>
      <h2>欢迎回来</h2>
      <button onClick={/* ✏️ 点击后变回未登录 */}>退出</button>
    </div>
  );
}`,
    test: async (t) => {
      t.assert(!t.q('h2'), '未登录时不应显示 h2');
      const login = t.byText('button', '登录'); t.assert(login, '未登录时应有“登录”按钮');
      await t.click(login);
      t.assert(t.text('h2') === '欢迎回来', '登录后应显示 <h2>欢迎回来</h2>');
      t.assert(!t.byText('button', '登录'), '登录后不应再显示“登录”按钮');
      const out = t.byText('button', '退出'); t.assert(out, '登录后应有“退出”按钮');
      await t.click(out);
      t.assert(!t.q('h2') && t.byText('button', '登录'), '退出后应回到未登录状态');
    }
  }
});

/* ---------- 7 ---------- */
lesson({
  id: 'lists-keys', stage: 0, title: '列表渲染与 key', mins: 18,
  summary: '用 map 渲染列表，理解 key 为什么重要。',
  goals: ['能用 map 把数组渲染成元素列表，并先用 filter 筛选', '能为列表选择合适的 key，并说出不用 index 或随机数的理由', '能找出 key 写错位置的 bug：key 要写在 map 直接返回的元素上', '能用改变 key 的方法重置一个组件的 state'],
  keyPoints: [
    '用 <code>.map()</code> 把每项数据变成一个元素。先用 <code>.filter()</code>，可以只留下一部分。',
    'key 是列表项的身份。列表变化时，React 用它把新旧元素（连同它们的 state）对上号。',
    'key 用数据自带的稳定 id。用 index，插入或重排后 state 会错位；用随机数，每次渲染都会重建。',
    'key 要写在 map 直接返回的那个元素上。它不会作为 prop 传进组件。',
    '改变一个组件的 key，React 会卸载它、再新建一个，state 被重置。',
  ],
  body: [
    p('要渲染一组数据，就用数组的 <code>.map()</code> 方法把每一项数据“映射”成一个 JSX 元素。React 可以直接渲染一个元素数组。'),
    play(`
function App() {
  const fruits = [
    { id: 1, name: '苹果', price: 5 },
    { id: 2, name: '香蕉', price: 3 },
    { id: 3, name: '樱桃', price: 30 },
  ];
  const cheap = fruits.filter(f => f.price < 10);

  return (
    <div>
      <h4>全部水果</h4>
      <ul>
        {fruits.map(f => (
          <li key={f.id}>{f.name} - ¥{f.price}</li>
        ))}
      </ul>
      <h4>10 元以下</h4>
      <ul>
        {cheap.map(f => <li key={f.id}>{f.name}</li>)}
      </ul>
    </div>
  );
}`, 'map + filter'),
    h('key 是什么？为什么需要它？'),
    p('列表会插入、删除和重新排序。这时，React 需要知道哪个旧元素对应哪个新元素。<b>key 是每一项的身份证</b>。React 根据 key 复用、移动或删除元素和它的 state。'),
    p('下面两列渲染同一份数据，只有 key 不同：左列用下标 index，右列用 id。操作步骤如下。'),
    p('<ol class="task-steps"><li>在每个输入框里输入任意内容。</li><li>点“在顶部插入”。</li></ol>'),
    play(`
import { useState } from 'react';

// 不要用 items.length 生成 id：删除后会重复。
let nextId = 3;

function App() {
  const [items, setItems] = useState([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
  const addTop = () => {
    const id = nextId++;
    setItems([{ id, name: String.fromCharCode(64 + id) }, ...items]);
  };

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div>
        <b>左列 key=index</b>
        {items.map((it, i) => <div key={i}>{it.name} <input size="6" /></div>)}
      </div>
      <div>
        <b>右列 key=id</b>
        {items.map(it => <div key={it.id}>{it.name} <input size="6" /></div>)}
      </div>
      <button onClick={addTop}>在顶部插入</button>
    </div>
  );
}`, '两列只差 key', '左边的输入内容会“错位”到别的字母后面，右边则跟着字母走。'),
    like('想象老师点名。如果按“座位号”点名（用 index 当 key），一旦有同学换座位，老师就会把人认错。按“学号”点名（用唯一 id 当 key），不管怎么换座位都不会认错。'),
    h('key 的规则'),
    ul(['在<b>兄弟元素之间唯一</b>即可，不需要全局唯一', '要<b>稳定</b>：同一项数据每次渲染的 key 应该相同。不要用 <code>Math.random()</code>', '优先使用数据自带的 id（数据库 id、uuid 等）', '只有当列表<b>永远不会重排、插入、删除</b>时，用 index 才是安全的', 'key 要写在 map 直接返回的那个元素上，而不是它的子元素上']),
    tip('key 不会作为 prop 传给组件。如果子组件也需要这个 id，要另外传一次：<code>&lt;Item key={x.id} id={x.id} /&gt;</code>。'),
    warn('你可能看到的报错：<code>Warning: Each child in a list should have a unique "key" prop.</code><br>原因：map 返回的元素没有 key，或者 key 重复了。<br>去看：<code>.map()</code> 回调返回的最外层元素。在它上面写 <code>key={item.id}</code>。如果它是一个组件，就写在组件上：<code>&lt;TodoItem key={t.id} … /&gt;</code>。'),
    deep('key 还有一个高级用法：<b>改变 key 可以强制重置组件</b>。当 key 变化时，React 会卸载旧组件、创建一个全新的组件（状态全部清空）。例如 <code>&lt;Profile key={userId} /&gt;</code> 在切换用户时自动清空表单。'),
  ],
  quiz: [
    { q: 'key 的主要作用是？', options: ['列表变化时，让 React 把新旧两次渲染里的每一项对上号', '让子组件能通过 props.key 读到自己的 id', '让 React 跳过没有变化的列表项，不再调用它们的组件函数', '给列表项加一个 HTML id 属性，方便查找'], answer: 0, explain: 'key 是列表项的身份标识，React 用它匹配新旧元素和它们的 state。最迷惑的是第二项：key 不会作为 prop 传给组件，子组件需要 id 时要另外传。第三项是 memo 的作用，不是 key 的。' },
    { q: '一个可以拖动排序的列表，下列哪个最适合作为 key？', options: ['Math.random()', '数组下标 index', '数据自带的唯一 id', 'item.name（名字可能重复）'], answer: 2, explain: '稳定且唯一的 id 最好。最容易误选的是 index：排序后同一个下标对应的是另一项数据，state 会错位。随机数每次渲染都变，组件会反复重建。名字可能重复，key 就不唯一。' },
    { q: '<code>&lt;Profile key={userId} /&gt;</code>。userId 从 1 变成 2 时，Profile 会怎样？', options: ['用新的 props 重新渲染，state 保留', '旧的被卸载，再新建一个，state 回到初始值', 'React 报错：key 不能改变', '什么都不发生：key 只在列表里起作用'], answer: 1, explain: 'key 变了，React 认为这是另一个组件，于是卸载旧的、挂载新的。最迷惑的是第一项：没有 key、或 key 不变时，同位置同类型的组件才会保留 state。key 在列表外也起作用。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>用 <code>filter</code> 选出 <code>done</code> 为 false 的事项。</li><li>用 <code>map</code> 把每个事项渲染成一个 <code>&lt;li&gt;</code>，内容为 <code>title</code>。</li><li>用 <code>id</code> 作为 key。</li><li>把这些 <code>&lt;li&gt;</code> 放进 <code>&lt;ul&gt;</code>。</li></ol>',
    starter: `function App() {
  const todos = [
    { id: 1, title: '学习 JSX', done: true },
    { id: 2, title: '学习 State', done: false },
    { id: 3, title: '学习列表', done: false },
    { id: 4, title: '喝水', done: true },
  ];
  return <ul>{/* 在这里渲染 */}</ul>;
}`,
    solution: `function App() {
  const todos = [
    { id: 1, title: '学习 JSX', done: true },
    { id: 2, title: '学习 State', done: false },
    { id: 3, title: '学习列表', done: false },
    { id: 4, title: '喝水', done: true },
  ];
  return (
    <ul>
      {todos.filter(t => !t.done).map(t => (
        <li key={t.id}>{t.title}</li>
      ))}
    </ul>
  );
}`,
    hint: '分两步想：哪个数组方法能“留下”一部分元素？哪个能把每一项“变成”一个 &lt;li&gt;？key 用哪个字段最稳定？',
    faded: `function App() {
  const todos = [
    { id: 1, title: '学习 JSX', done: true },
    { id: 2, title: '学习 State', done: false },
    { id: 3, title: '学习列表', done: false },
    { id: 4, title: '喝水', done: true },
  ];
  return (
    <ul>
      {todos
        .filter(/* ✏️ 只留下 done 为 false 的事项 */)
        .map(t => (
          /* ✏️ 一个 li：内容是 title，key 用最稳定的那个字段 */
        ))}
    </ul>
  );
}`,
    test: async (t) => {
      const lis = t.qa('li');
      const li = lis.map(x => x.textContent.trim());
      t.assert(li.length === 2, `应渲染 2 个未完成事项，实际 ${li.length} 个。先用 filter 留下 done 为 false 的事项`);
      t.assert(li.includes('学习 State') && li.includes('学习列表'), `渲染的事项不对：${li.join('、')}。应只显示“学习 State”和“学习列表”`);
      // 读 React 记录的 key。从 <li> 往上找，直到某一层也包含了别的列表项：
      // 这之前最高的那一层，就是 map 为这一项返回的元素（<li>、组件、<Fragment> 或 <>）
      const fiberOf = (node) => { const k = Object.keys(node).find(k => k.startsWith('__reactFiber$')); return k && node[k]; };
      const hosts = (f) => { const out = []; const walk = (c) => { for (; c; c = c.sibling) { if (c.tag === 5) out.push(c.stateNode); walk(c.child); } }; if (f.tag === 5) out.push(f.stateNode); walk(f.child); return out; };
      const keyInfo = (node) => {
        const path = [];
        for (let f = fiberOf(node); f; f = f.return) {
          if (f.stateNode && f.stateNode.tagName === 'UL') break;
          if (path.length && hosts(f).some(h => h !== node && lis.includes(h))) break;
          path.push(f);
        }
        const top = path[path.length - 1];
        return { top: top ? top.key : null, inner: path.slice(0, -1).some(f => f.key != null) };
      };
      const ids = { '学习 State': '2', '学习列表': '3' };
      const seen = [];
      lis.forEach(x => {
        const { top, inner } = keyInfo(x);
        const title = x.textContent.trim();
        t.assert(top != null || !inner, 'key 写在了里层元素上。key 要写在 map 直接返回的那个元素上。用 <></> 包住 <li> 时，<></> 不能写 key，请改成 <Fragment key={t.id}>，或直接返回 <li key={t.id}>');
        t.assert(top != null, 'map 返回的元素没有 key。请用每项的 id 作为 key，例如 key={t.id}');
        const hasId = new RegExp('(^|\\D)' + ids[title] + '(\\D|$)').test(top);
        if (!hasId || top === title) {
          const byIndex = /key=\{\s*(i|idx|index)\s*\}/.test(t.source) || /^\d+$/.test(top);
          t.assert(false, byIndex && top !== ids[title]
            ? `“${title}”的 key 是 ${top}，看起来是数组下标。列表插入、删除或重排时，下标会对应到别的数据，state 会错位。请用每项自带的 id：key={t.id}`
            : `“${title}”的 key 是“${top}”，里面没有它的 id（${ids[title]}）。${top === title ? '标题可能重复，也可能被修改。' : ''}key 要能区分每一项，而且一直不变。请用 key={t.id}`);
        }
        t.assert(!seen.includes(top), `两个列表项的 key 都是“${top}”。key 在同一个列表里必须各不相同`);
        seen.push(top);
      });
      // 把“喝水”改成未完成，重新运行一遍代码：列表应该跟着数据变成 3 项
      const changed = t.rawSource.replace(/(title:\s*['"]喝水['"]\s*,\s*done:\s*)true/, '$1false');
      t.assert(changed !== t.rawSource, '请保留起始代码里的 todos 数据（包括“喝水”那一项）。检查程序会改动它，看列表会不会跟着变');
      if (typeof prepare === 'function' && typeof compile === 'function') {
        let App2;
        try { App2 = compile(['React', 'ReactDOM'], prepare(changed, []))(React, ReactDOM).App; } catch (e) {}
        if (typeof App2 === 'function') {
          const box = document.createElement('div');
          const root = ReactDOM.createRoot(box);
          try {
            ReactDOM.flushSync(() => root.render(React.createElement(App2)));
            const li2 = [...box.querySelectorAll('li')].map(x => x.textContent.trim());
            t.assert(li2.length === 3 && li2.includes('喝水'), `把“喝水”改成未完成后，列表应变成 3 项，实际是 ${li2.length} 项（${li2.join('、')}）。列表要从 todos 数据算出来：todos.filter(…).map(…)，不要手写 <li>`);
          } finally { root.unmount(); }
        }
      }
    }
  }
});

/* ---------- 8 ---------- */
lesson({
  id: 'forms', stage: 0, title: '表单与受控组件', mins: 17,
  summary: '让 React state 成为表单数据的唯一数据源。',
  goals: ['能把输入框写成受控组件：value 来自 state，onChange 更新 state', '能处理文本框、复选框和下拉框，并说出复选框为什么用 checked', '能用一个对象 state 和一个通用的 handleChange 管理多个字段', '能在提交时阻止页面刷新，并根据 state 做校验'],
  keyPoints: [
    '受控组件：<code>value</code> 来自 state，<code>onChange</code> 更新 state。state 是唯一数据源。',
    '只写 <code>value</code> 不写 <code>onChange</code>，输入框会变成只读。',
    '复选框读写的是 <code>checked</code>，不是 <code>value</code>。',
    '字段多时，用一个对象 state，再用 <code>[name]: value</code> 写一个通用的 handleChange。',
    '提交时调用 <code>e.preventDefault()</code> 阻止刷新。校验直接根据 state 计算。',
  ],
  body: [
    p('在 HTML 中，输入框自己保存着用户输入的值。在 React 中，通常由 <b>state 保存这个值</b>。输入框只做两件事：显示 state；值变化时通知我们。这就叫<b>受控组件</b>。'),
    fig(`<div class="formula"><span class="f-box">state<small>value</small></span><span class="f-op">→ 显示 →</span><span class="f-box">&lt;input&gt;</span><span class="f-op">→ onChange →</span><span class="f-box f-fn">set 函数<small>更新</small></span></div>`, '数据形成一个闭环：state 是唯一数据源'),
    play(`
import { useState } from 'react';

function App() {
  const [text, setText] = useState('');
  return (
    <div>
      <input value={text} onChange={e => setText(e.target.value)} placeholder="输入点什么" />
      <p>你输入了：{text}</p>
      <p>字数：{text.length}，大写：{text.toUpperCase()}</p>
      <button onClick={() => setText('')}>清空</button>
    </div>
  );
}`, '最基本的受控输入框', '“清空”按钮能起作用，正是因为输入框的值由 state 控制。'),
    warn('如果只写 <code>value={text}</code> 却没写 <code>onChange</code>，输入框会变成<b>只读</b>，怎么打字都没反应。因为每次渲染它都被强制设回 state 的值。'),
    warn('你可能看到的报错：<code>Warning: A component is changing an uncontrolled input to be controlled.</code><br>原因：value 一开始是 undefined（例如写了 <code>useState()</code>），后来才变成字符串。React 认为输入框从“非受控”变成了“受控”。<br>去看：这个输入框对应的 useState。给它一个初始值，例如 <code>useState(\'\')</code>。'),
    h('多个字段：用一个对象'),
    p('表单字段多时，用一个对象保存所有字段。再写一个通用的 <code>handleChange</code>。它根据输入框的 <code>name</code> 属性，判断要更新哪个字段。'),
    play(`
import { useState } from 'react';

function App() {
  const [form, setForm] = useState({ name: '', city: '北京', agree: false });
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleSubmit(e) {
    e.preventDefault(); // 阻止页面刷新
    if (!form.name.trim()) return setError('请填写姓名');
    setError('');
    setSubmitted(form);
  }

  return (
    <form onSubmit={handleSubmit}>
      <p><input name="name" value={form.name} onChange={handleChange} placeholder="姓名" /></p>
      <p>
        <select name="city" value={form.city} onChange={handleChange}>
          <option>北京</option><option>上海</option><option>深圳</option>
        </select>
      </p>
      <p><label><input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} /> 同意协议</label></p>
      <button disabled={!form.agree}>提交</button>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {submitted && <pre>{JSON.stringify(submitted, null, 2)}</pre>}
    </form>
  );
}`, '一个完整的表单'),
    p('注意这里的 <code>[name]: value</code> 是 JS 的<b>计算属性名</b>：用变量 name 的值作为对象的键。复选框用 <code>checked</code> 而不是 <code>value</code>。'),
    tip('所有值都在 state 里，所以<b>实时校验</b>很简单。根据 state 计算错误信息，然后渲染它，例如 <code>{form.name.length &gt; 10 &amp;&amp; &lt;span&gt;名字太长&lt;/span&gt;}</code>。'),
    deep('另一种做法是<b>非受控组件</b>。它不绑定 value。需要值时，用 ref 或表单的 FormData 读取 DOM。它代码更少，适合简单表单和文件上传 <code>&lt;input type="file"&gt;</code>。React 19 的表单 Actions 也鼓励这种方式，第 28 课会讲。'),
  ],
  quiz: [
    { q: '只设置了 value={text} 而没有 onChange 的输入框会怎样？', options: ['正常输入，只是 text 不会更新', '变成只读，无法输入', '输入的文字会自动同步到 text', '页面报错并停止渲染'], answer: 1, explain: 'value 被 state 锁定，而没有 onChange 去更新 state，所以每次都被设回原值。React 会在控制台警告，但不会崩溃。最迷惑的是第一项：受控输入框显示的永远是 state，state 不变，输入框也不变。' },
    { q: '受控输入框 <code>&lt;input value={text} onChange={e =&gt; setText(e.target.value)} /&gt;</code>。点“清空”执行 <code>setText(\'\')</code> 后，输入框会怎样？', options: ['变空，因为它显示的就是 state', '不变，用户打的字保存在 DOM 里', '先变空，再打一个字时旧文字会回来', '报错：受控输入框不能由代码修改'], answer: 0, explain: '受控组件里 state 是唯一数据源，输入框只负责显示它、通知变化。最迷惑的是第二项：那是非受控输入框的行为，它的值保存在 DOM 里，代码改 state 也影响不到它。' },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>声明一个 state 保存输入内容。</li><li>把 <code>&lt;input id="name"&gt;</code> 做成受控组件：绑定 <code>value</code> 和 <code>onChange</code>。</li><li>在 <code>&lt;p id="preview"&gt;</code> 中显示 <b>你好，{输入内容}</b>。</li><li>输入为空时，显示 <b>你好，陌生人</b>。</li><li>点击按钮 <b>清空</b> 时，输入框变空，预览恢复为 <b>你好，陌生人</b>。</li></ol>',
    starter: `import { useState } from 'react';

function App() {
  return (
    <div>
      <input id="name" />
      <p id="preview">你好，陌生人</p>
      <button>清空</button>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

function App() {
  const [name, setName] = useState('');
  return (
    <div>
      <input id="name" value={name} onChange={e => setName(e.target.value)} />
      <p id="preview">你好，{name || '陌生人'}</p>
      <button onClick={() => setName('')}>清空</button>
    </div>
  );
}`,
    hint: '输入框显示的值要来自 state。清空时，只要把 state 设为空字符串。<code>{name || \'陌生人\'}</code> 可以在空字符串时使用默认值。',
    faded: `import { useState } from 'react';

function App() {
  const [name, setName] = useState('');
  return (
    <div>
      <input id="name" /* ✏️ 绑定 value 和 onChange，让 state 控制输入框 */ />
      <p id="preview">你好，{/* ✏️ 显示 name；为空时显示“陌生人” */}</p>
      <button onClick={/* ✏️ 一个函数：把 state 设为空字符串 */}>清空</button>
    </div>
  );
}`,
    test: async (t) => {
      const pv = () => t.text('#preview').replace(/\s/g, '');
      t.assert(pv() === '你好，陌生人', '初始应显示“你好，陌生人”');
      await t.type('#name', '小美');
      t.assert(pv() === '你好，小美', `输入“小美”后应显示“你好，小美”，实际是“${pv()}”`);
      const clear = t.byText('button', '清空'); t.assert(clear, '找不到“清空”按钮');
      await t.click(clear);
      t.assert(t.q('#name').value === '', '点“清空”后输入框应变空。输入框要绑定 value，才能由 state 控制');
      t.assert(pv() === '你好，陌生人', '清空后应恢复“你好，陌生人”');
    }
  }
});
