import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/what-is-react.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'what-is-react',
  stage: 0,
  title: 'React 是什么',
  mins: 22,
  summary: '理解 React 解决的问题，以及“UI = f(state)”这个核心思想。',
  goals: [
    '能说出 React 要解决的问题：数据变了，界面要跟着变',
    '能用“UI = f(state)”解释点击按钮后界面为什么会更新',
    '能判断一段代码是命令式还是声明式',
    '能修改并运行一个返回 JSX 的 App 组件',
  ],
  keyPoints: [
    '问题：用原生 JS 时，数据变了要手动改每一处 DOM。漏改一处，数据和界面就对不上。',
    'React 的做法：你写组件函数，描述“在这份数据下界面长什么样”。这就是 UI = f(state)。',
    '数据变化时，React 重新调用组件函数，再只把差异更新到页面。',
    '命令式写步骤（找元素、改文字），声明式写结果（返回 JSX）。React 让你只写结果。',
  ],
  quiz: [
    {
      q: '点击按钮后 count 从 1 变成 2。React 怎样让页面显示 2？',
      options: [
        '重新调用组件函数，算出新界面，再把差异更新到页面',
        '找到页面上的数字 1，直接把它替换成 2',
        '刷新整个页面，再按新数据画一遍',
        '监听 DOM 的每一次变化，再把新值同步回 count 变量',
      ],
      answer: 0,
      explain:
        '这就是 UI = f(state)：数据变了，React 重新执行 f，只更新有差异的部分。第二项最容易误选：那是你用原生 JS 时要手写的步骤，React 让你不用写它。React 也不会刷新整个页面。',
    },
    {
      q: '下面哪段代码是“声明式”的写法？',
      options: [
        "label.textContent = '点击了 ' + count + ' 次'",
        'return <p>点击了 {count} 次</p>',
        "btn.addEventListener('click', update)",
        'label.hidden = count === 0',
      ],
      answer: 1,
      explain:
        'JSX 只描述“在这个 count 下界面是什么样”，没有写怎样改 DOM。其他三项都在一步步操作某个 DOM 元素。最容易误选的是最后一项：它看起来像一个“条件”，但仍然是在命令浏览器修改元素。',
    },
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
    test: async t => {
      const el = t.q('h1');
      t.assert(el, '没有找到 <h1> 元素');
      t.assert(el.textContent.replace(/\s/g, '').includes('你好，React'), 'h1 的文字应该是“你好，React”（注意是中文逗号）');
    },
  },
  checkOnly: [
    {
      q: `先点“直接改 DOM”，span 显示 99。再点“改 state”。span 显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Counter() {
  const [n, setN] = useState(0);
  return (
    &lt;&gt;
      &lt;span id="n"&gt;{n}&lt;/span&gt;
      &lt;button onClick={() =&gt; {
        document.getElementById('n').textContent = '99';
      }}&gt;直接改 DOM&lt;/button&gt;
      &lt;button onClick={() =&gt; setN(n + 1)}&gt;改 state&lt;/button&gt;
    &lt;/&gt;
  );
}</code></pre></div>`,
      options: ['1', '100：React 在页面上的当前值上加 1', '99：React 不会再动被手动改过的元素', '0'],
      answer: 0,
      explain:
        'React 不读取 DOM 里的值。它只根据 state 算出界面应该是什么样子。点“改 state”后 n 变成 1，React 发现文字从 0 变成 1，就把 span 改成“1”，手动写的 99 被覆盖。选“100”是把 React 当成了“在 DOM 上修改”的命令式工具。反过来，如果 n 没变，React 不会碰这个节点，99 会一直留着，和 state 对不上。所以在 React 里只改数据，不直接改 DOM。',
    },
  ],
  plays: {
    '你的第一个 React 组件': {
      note: '点一下按钮试试。然后把“点击了”改成别的文字，点“运行”看看效果。',
    },
  },
} satisfies Lesson;
