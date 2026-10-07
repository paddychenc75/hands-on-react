import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/components-props.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'components-props',
  stage: 0,
  title: '组件与 Props',
  mins: 18,
  summary: '把界面拆成组件，用 props 给组件传数据。',
  goals: [
    '能写出一个函数组件，并在 App 里多次使用它',
    '能通过 props 传入数据，并用解构和默认值读取它',
    '能找出修改 props 的错误写法，说出正确的改法',
    '能用 children 写一个“包裹”内容的容器组件',
  ],
  keyPoints: [
    '组件是返回 JSX 的函数，名字必须大写开头。React 靠大写区分组件和 HTML 标签。',
    '父组件通过 props 传入数据，就像给函数传参数。子组件常用解构读取：<code>function Card({ name, emoji = \'🙂\' })</code>。',
    'props 是只读的。子组件不能改它；数据由谁拥有，就由谁修改。',
    '写在组件开闭标签之间的内容，会作为 <code>children</code> 传入。',
  ],
  quiz: [
    {
      q: '你写了 <code>function card() {…}</code>，再在 App 里写 <code>&lt;card /&gt;</code>。页面上会怎样？',
      options: ['正常显示 card 函数返回的内容', 'React 把它当成 HTML 标签 card，函数不会被调用', '编译时报语法错误', '只在严格模式下才能显示'],
      answer: 1,
      explain: 'JSX 用首字母区分：小写当作 HTML 标签，大写才当作组件去调用。所以页面上只有一个空的 &lt;card&gt; 元素（控制台会警告）。最容易误选的是“报语法错误”：小写标签在语法上完全合法，所以不会报错，这正是它难发现的原因。',
    },
    {
      q: '子组件想改变收到的 props.count，应该？',
      options: [
        '直接 props.count++',
        '用 Object.assign 修改 props',
        '不能修改；应由拥有数据的父组件修改并重新传入',
        '把 props 存到全局变量再改',
      ],
      answer: 2,
      explain: 'props 是只读的。数据由谁拥有，就由谁修改。常见做法是父组件再通过 props 传入一个回调函数，子组件调用它。前两项看起来能改，但改的是父组件的数据，React 不知道，界面也不会更新。',
    },
    {
      q: 'Panel 写成 <code>function Panel({ title }) { return &lt;section&gt;&lt;h3&gt;{title}&lt;/h3&gt;&lt;/section&gt;; }</code>。使用时写 <code>&lt;Panel title="公告"&gt;&lt;p&gt;周五开会&lt;/p&gt;&lt;/Panel&gt;</code>。页面上会显示什么？',
      options: ['标题“公告”和“周五开会”', '只有标题“公告”', '只有“周五开会”', '报错：Panel 不接收子元素'],
      answer: 1,
      explain: '标签之间的 &lt;p&gt; 会作为 children 传入，但 Panel 没有读取也没有渲染 children，所以它被丢掉了。最容易误选的是第一项：children 不会自动出现，要在 JSX 里写 {children}。',
    },
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
    },
  },
  checkOnly: [
    {
      q: `父组件写 <code>&lt;Badge label={null} count={3} /&gt;</code>。页面显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Badge({ label = '新', count }) {
  return &lt;span&gt;{label}:{count}&lt;/span&gt;;
}</code></pre></div>`,
      options: ['新:3', ':3', 'null:3', '报错：label 不能是 null'],
      answer: 1,
      explain: '解构的默认值只在值为 <code>undefined</code> 时生效。这里传的是 <code>null</code>，所以 label 就是 null。null 在 JSX 中不显示，结果是“:3”。想用默认值，就不要传这个 prop，或者传 <code>undefined</code>。',
    },
    {
      q: `父组件写 <code>&lt;Avatar user={me} /&gt;</code>，me 有 url 和 name。页面上会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Avatar(user) {
  return &lt;img src={user.url} alt={user.name} /&gt;;
}</code></pre></div>`,
      options: [
        '正常显示头像',
        '图片不显示：user 其实是整个 props 对象',
        '报错：props 不能叫 user',
        '报错：user 是 undefined，读取 user.url 时抛出 TypeError',
      ],
      answer: 1,
      explain: '组件只收到一个参数：props 对象。这里它被命名为 user，内容是 <code>{ user: me }</code>。所以 <code>user.url</code> 是 undefined，img 没有 src。修复：解构 <code>function Avatar({ user })</code>，或者写 <code>props.user.url</code>。“user 是 undefined”不对：参数一定有值，只是它不是你以为的那个对象，所以不会报错，图片只是悄悄地不显示。',
    },
  ],
  plays: {
    '定义一次，到处使用': {},
    '通过 props 传入数据': {
      note: '王五没有传 emoji，所以用了默认值 🙂。',
    },
    'children 让组件可以“包裹”任意内容': {},
  },
} satisfies Lesson;
