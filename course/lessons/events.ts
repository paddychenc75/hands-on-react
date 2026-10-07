import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/events.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'events',
  stage: 0,
  title: '事件处理',
  mins: 17,
  summary: '响应点击、输入、键盘等用户操作。',
  goals: [
    '能给元素绑定事件处理函数，包括需要传参的写法',
    '能找出 <code>onClick={handleClick()}</code> 这类“调用了函数”的错误并修复',
    '能用事件对象读取输入值、阻止默认行为、阻止冒泡',
    '能通过 props 传入 onXxx 函数，让子组件通知父组件',
  ],
  keyPoints: [
    '把<b>函数本身</b>传给事件属性：<code>onClick={handleClick}</code>，需要传参时写 <code>onClick={() =&gt; handleClick(x)}</code>。',
    '<code>onClick={handleClick()}</code> 是错的：渲染时就会执行，React 拿到的是它的返回值。',
    '事件对象：<code>e.target.value</code> 读输入，<code>e.preventDefault()</code> 阻止默认行为，<code>e.stopPropagation()</code> 阻止冒泡。',
    '子组件要通知父组件时，父组件通过 props 传入一个 onXxx 函数，子组件在事件里调用它。',
  ],
  quiz: [
    {
      q: '下面哪种写法会在渲染时就执行 handleClick，而不是点击时？',
      options: ['onClick={handleClick}', 'onClick={() => handleClick()}', 'onClick={handleClick()}', 'onClick={e => handleClick(e)}'],
      answer: 2,
      explain: 'handleClick() 带括号，渲染时就被调用了，onClick 拿到的是它的返回值。第二、四项外面包了一层箭头函数，箭头函数要等点击时才执行，所以它们是对的。',
    },
    {
      q: '点击表单的提交按钮后，页面刷新了。在 onSubmit 处理函数里应该怎么做？',
      options: ['调用 e.stopPropagation()', '调用 e.preventDefault()', '在函数末尾 return false', '把 onSubmit 换成按钮的 onClick'],
      answer: 1,
      explain:
        'preventDefault 阻止浏览器的默认行为（提交并刷新）。最迷惑的是 stopPropagation：它只阻止冒泡，表单照样提交。return false 只在 HTML 的 onsubmit 属性里有效，在 React 里不起作用。按钮的 onClick 也拦不住提交。',
    },
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
    test: async t => {
      const s = () => t.text('#status');
      t.assert(s() === '关', '初始应显示“关”');
      const b = t.byText('button', '切换');
      t.assert(b, '找不到“切换”按钮');
      await t.click(b);
      t.assert(s() === '开', '点击一次后应显示“开”');
      await t.click(b);
      t.assert(s() === '关', '再点一次应变回“关”');
    },
  },
  checkOnly: [
    {
      q: `运行这个组件，会发生什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function App() {
  const [count, setCount] = useState(0);
  return &lt;button onClick={setCount(count + 1)}&gt;+1&lt;/button&gt;;
}</code></pre></div>`,
      options: ['每次点击加 1', '页面打开时显示 1，之后点击无效', 'React 报错：重新渲染次数过多，无限循环', '什么都不发生，按钮显示 +1'],
      answer: 2,
      explain:
        '<code>onClick={setCount(count + 1)}</code> 在<b>渲染时</b>就调用了 set 函数。set 函数触发重新渲染，重新渲染又调用 set 函数，形成无限循环。React 会报错“Too many re-renders”。应传入函数：<code>onClick={() =&gt; setCount(count + 1)}</code>。',
    },
    {
      q: `点击“提交”按钮，会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;form onSubmit={() =&gt; setMsg('已提交')}&gt;
  &lt;button type="submit" onClick={e =&gt; e.stopPropagation()}&gt;
    提交
  &lt;/button&gt;
&lt;/form&gt;</code></pre></div>`,
      options: [
        '显示“已提交”，页面不刷新',
        'onSubmit 不执行，因为点击事件被阻止冒泡',
        'onSubmit 执行，但随后浏览器提交表单并刷新页面，看不到“已提交”',
        '什么都不发生',
      ],
      answer: 2,
      explain:
        'stopPropagation 只阻止<b>点击事件</b>继续冒泡。它不取消浏览器的默认行为。点击提交按钮仍会触发表单的 submit 事件，onSubmit 照常执行。随后浏览器提交表单，页面刷新。要阻止刷新，应在 onSubmit 中调用 <code>e.preventDefault()</code>。',
    },
    {
      q: `点击“删除”按钮，哪些函数会被调用？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;li onClick={() =&gt; open(item)}&gt;
  {item.title}
  &lt;button onClick={() =&gt; remove(item.id)}&gt;删除&lt;/button&gt;
&lt;/li&gt;</code></pre></div>`,
      options: ['只有 remove', '先 open，再 remove', '只有 open：外层的处理函数优先', '先 remove，再 open'],
      answer: 3,
      explain:
        '点击事件从按钮开始向上冒泡。先执行按钮的 onClick（remove），再执行 li 的 onClick（open）。结果是删除之后又打开了这一项。只想删除时，在按钮的处理函数里调用 <code>e.stopPropagation()</code>。“只有 remove”是最常见的误解：React 的事件和浏览器一样会冒泡，不会因为里面的元素处理过就停下。',
    },
  ],
  plays: {
    三种常见写法: {},
    事件对象与冒泡: {
      note: '按钮 B 的点击先由按钮处理，再冒泡到外层 div，所以新增 2 条。按钮 A 调用了 e.stopPropagation()，事件停在按钮上，只新增 1 条。',
      predict: {
        q: '点击“按钮 B”一次，日志列表会新增几条？',
        options: ['1 条', '2 条', '0 条', '3 条'],
        answer: 1,
        explain: '按钮先处理点击，然后事件冒泡到外层 div，div 的 onClick 也会执行，所以是 2 条。按钮 A 调用了 e.stopPropagation()，只会产生 1 条。',
      },
      pkey: 'events|事件对象与冒泡',
    },
    子组件通知父组件: {},
  },
} satisfies Lesson;
