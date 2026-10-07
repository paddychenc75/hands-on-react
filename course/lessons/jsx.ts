import type { Lesson } from '../types.ts';
import { prepare, compile } from '../engine/exec.ts';
// 非正文数据。课文在 docs/lessons/jsx.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'jsx',
  stage: 0,
  title: 'JSX：在 JS 里写界面',
  mins: 22,
  summary: '学会 JSX 的语法规则，以及如何用 {} 嵌入 JavaScript 表达式。',
  goals: [
    '能说出一段 JSX 编译后得到的是什么（一个描述界面的 JS 对象）',
    '能在 {} 里写出表达式，并判断一段代码能不能放进 {}',
    '能找出并修复违反 JSX 规则的写法',
    '能判断哪些写法会绕过转义、带来 XSS 风险',
  ],
  keyPoints: [
    'JSX 会被编译成创建元素的函数调用。结果是一个描述界面的普通 JS 对象。',
    '<code>{}</code> 里只能放表达式（会产生值的代码）。if、for 是语句，要换成三元运算符、<code>&amp;&amp;</code> 或 <code>.map()</code>。',
    '硬规则：只有一个根元素（可以用片段 <code>&lt;&gt;&lt;/&gt;</code>）、标签必须闭合、用 <code>className</code>、属性名用驼峰、<code>style</code> 接收对象。JSX 里的注释写成 <code>{/* … */}</code>。',
    '<code>{}</code> 会把字符串转义成文字，所以显示用户输入是安全的。<code>dangerouslySetInnerHTML</code> 和 <code>javascript:</code> 网址会绕过这层保护。',
  ],
  quiz: [
    {
      q: 'JSX <code>&lt;h1&gt;Hi&lt;/h1&gt;</code> 编译后本质上是什么？',
      options: ['一段 HTML 字符串', '一次创建元素的函数调用，返回一个普通对象', '一个真实的 DOM 节点', '一个 CSS 规则'],
      answer: 1,
      explain:
        'JSX 被编译成创建元素的函数调用（jsx() 或 createElement()）。它返回一个描述界面的普通 JS 对象，叫 React 元素。最容易误选的是“HTML 字符串”：JSX 从不拼接字符串，所以 {} 里的内容默认会被转义。真实 DOM 节点要等 React 提交到页面时才创建。',
    },
    {
      q: '下面哪种写法可以放在 JSX 的 {} 里？',
      options: ['if (ok) { return 1 }', 'for (let i=0;i<3;i++){}', 'ok ? "是" : "否"', 'let a = 1'],
      answer: 2,
      explain:
        '{} 中只能放表达式，也就是会产生一个值的代码。三元运算符是表达式。if、for 和 let 声明都是语句，没有值。最容易误选的是 if：要在 JSX 里做判断，就改用三元运算符或 &&。',
    },
    {
      q: '把一段 HTML 原样粘进组件：<code>&lt;div class="box" style="color:red"&gt;&lt;img src="a.png"&gt;&lt;/div&gt;</code>。要改哪些地方？',
      options: ['只要把 class 改成 className', '只要把 img 改成自闭合', 'class、style、img 三处都要改', '都不用改，JSX 兼容 HTML'],
      answer: 2,
      explain:
        'img 没有闭合是语法错误。style 必须是对象，写成字符串会报错。class 要写成 className。最容易误选的是最后一项：JSX 看起来像 HTML，但它是 JavaScript，规则更严格。',
    },
    {
      q: '用户的昵称是 <code>&lt;b onmouseover="alert(1)"&gt;小明&lt;/b&gt;</code>。代码写 <code>&lt;p&gt;{nickname}&lt;/p&gt;</code>。页面会怎样？',
      options: ['显示加粗的“小明”，鼠标移上去弹窗', '原样显示整段字符串，代码不执行', '显示空白', '报错'],
      answer: 1,
      explain:
        '{} 中的字符串会被转义，只显示为文字，所以代码不会执行。最容易误选的是第一项：只有用 dangerouslySetInnerHTML 把它当作 HTML 插入，才会出现加粗和弹窗。',
    },
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
    test: async t => {
      const h2 = t.q('h2');
      t.assert(h2 && h2.textContent.trim() === '小明', '需要一个内容为“小明”的 <h2>');
      const ps = t.qa('p');
      t.assert(
        ps.some(x => x.textContent.replace(/\s/g, '') === '明年19岁'),
        '需要一个内容为“明年 19 岁”的 <p>',
      );
      // 改动 user 的数据后重新运行：名字和年龄要跟着变，说明不是写死的
      const changed = t.rawSource.replace(/name:\s*(['"])小明\1/, "name: '小华'").replace(/age:\s*18\b/, 'age: 30');
      t.assert(changed !== t.rawSource, '请保留起始代码里的 user 数据（name: 小明，age: 18）。检查程序会改动它，看页面会不会跟着变');
      let App2: any;
      try {
        App2 = compile(['React', 'ReactDOM'], prepare(changed, []))(React, ReactDOM).App;
      } catch (e) {}
      if (typeof App2 === 'function') {
        const box = document.createElement('div');
        const root = ReactDOM.createRoot(box);
        try {
          ReactDOM.flushSync(() => root.render(React.createElement(App2)));
          const h2b = box.querySelector('h2');
          const pb = [...box.querySelectorAll('p')].map(x => x.textContent.replace(/\s/g, ''));
          t.assert(h2b && h2b.textContent.trim() === '小华', '把 user.name 改成“小华”后，<h2> 应显示“小华”。名字要用花括号从 user 取出，不要写死');
          t.assert(pb.includes('明年31岁'), '把 user.age 改成 30 后，应显示“明年 31 岁”。年龄要用 user.age + 1 计算，不要写死');
        } finally {
          root.unmount();
        }
      }
    },
  },
  checkOnly: [
    {
      q: '下面的 <code>&lt;p&gt;</code> 在页面上显示什么文字？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;p&gt;{true}{null}{undefined}{0}{\'\'}{\'ok\'}&lt;/p&gt;</code></pre></div>',
      options: ['0ok', 'ok', 'truenullundefined0ok', 'true0ok'],
      answer: 0,
      explain:
        'true、false、null、undefined 和空字符串都不会显示。数字 0 是一个普通的值，React 会把它显示出来。所以结果是“0ok”。这就是 <code>{count &amp;&amp; …}</code> 会多出一个 0 的原因。',
    },
    {
      q: '运行下面的 JSX，会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;p style="color: red; font-size: 20px"&gt;提示&lt;/p&gt;</code></pre></div>',
      options: ['显示红色、20px 的“提示”', '显示“提示”，样式被忽略，控制台只有警告', '只有 color 生效，font-size 要写成 fontSize', '报错：style 不能是字符串'],
      answer: 3,
      explain:
        "JSX 里的 style 接收一个 JavaScript 对象，不接收 CSS 字符串。传字符串时，React 直接抛出错误，不是只给警告。写法：<code>style={{ color: 'red', fontSize: 20 }}</code>。外层花括号表示“这里是表达式”，内层花括号是对象。属性名用驼峰，数字默认单位是 px。“只有 color 生效”混淆了两件事：驼峰命名是对象写法的规则，字符串在这里整个都不被接受。",
    },
  ],
  plays: {
    花括号里放表达式: {},
    哪些值会显示: {
      note: '方括号之间依次是：0 会显示，false 和 null 什么都不显示，数组 [1, 2] 把每一项依次显示出来（12），NaN 显示为 NaN。只有 true、false、null、undefined 和空字符串不显示。',
      predict: {
        q: '五对方括号里依次显示什么？',
        options: ['0、空、空、12、NaN', '0、false、null、1,2、NaN', '空、空、空、12、NaN', '0、空、空、[1, 2]、报错'],
        answer: 0,
        explain: '数字 0 和 NaN 是普通的值，会显示。false 和 null 不显示。数组会把每一项依次渲染出来。',
      },
      pkey: 'jsx|哪些值会显示',
    },
    规则演示: {},
  },
} satisfies Lesson;
