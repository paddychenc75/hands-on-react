import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/events.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'events',
  stage: 0,
  title: '事件处理',
  mins: 18,
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
    task: '<ol class="task-steps"><li><code>ColorButton</code> 的按钮被点击时，调用 <code>onPick</code>，并把自己的 <code>color</code> 传给它。</li><li>在 <code>App</code> 里给每个 <code>ColorButton</code> 传 <code>onPick</code>，让 <code>&lt;p id="picked"&gt;</code> 显示选中的颜色。</li><li>外层 <code>&lt;div id="outer"&gt;</code> 的 <code>onClick</code> 会把选中清空（显示 <b>无</b>）。点击颜色按钮时不能触发它。点击按钮以外的空白处，才会清空。</li></ol>',
    starter: `import { useState } from 'react';

function ColorButton({ color, onPick }) {
  return <button>{color}</button>;
}

function App() {
  const [picked, setPicked] = useState('无');
  return (
    <div id="outer" onClick={() => setPicked('无')} style={{ padding: 16 }}>
      <ColorButton color="红" />
      <ColorButton color="绿" />
      <ColorButton color="蓝" />
      <p id="picked">{picked}</p>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

function ColorButton({ color, onPick }) {
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        onPick(color);
      }}
    >
      {color}
    </button>
  );
}

function App() {
  const [picked, setPicked] = useState('无');
  return (
    <div id="outer" onClick={() => setPicked('无')} style={{ padding: 16 }}>
      <ColorButton color="红" onPick={setPicked} />
      <ColorButton color="绿" onPick={setPicked} />
      <ColorButton color="蓝" onPick={setPicked} />
      <p id="picked">{picked}</p>
    </div>
  );
}`,
    hint: 'onClick 要的是函数，还是函数的返回值？点击按钮后，事件还会传到哪一层？',
    faded: `import { useState } from 'react';

function ColorButton({ color, onPick }) {
  return (
    <button
      onClick={e => {
        /* ✏️ 阻止事件冒泡到外层 div */
        /* ✏️ 调用 onPick，把 color 传给父组件 */
      }}
    >
      {color}
    </button>
  );
}

function App() {
  const [picked, setPicked] = useState('无');
  return (
    <div id="outer" onClick={() => setPicked('无')} style={{ padding: 16 }}>
      <ColorButton color="红" onPick={/* ✏️ 传入一个能更新 picked 的函数 */} />
      <ColorButton color="绿" onPick={/* ✏️ 同上 */} />
      <ColorButton color="蓝" onPick={/* ✏️ 同上 */} />
      <p id="picked">{picked}</p>
    </div>
  );
}`,
    test: async t => {
      const p = () => t.text('#picked').trim();
      t.assert(t.q('#picked'), '找不到 id="picked" 的元素');
      t.assert(p() === '无', '初始应显示“无”');
      const red = t.byText('button', '红'),
        blue = t.byText('button', '蓝');
      t.assert(red && blue, '需要文字为 红、绿、蓝 的三个按钮');
      await t.click(red);
      t.assert(
        p() !== '无',
        '点击“红”后仍显示“无”。检查两件事：按钮点击时是否调用了 onPick(color)，父组件传入的 onPick 是否更新了 state；点击按钮的事件会冒泡到外层 div，把选中清空，要阻止它',
      );
      t.assert(p() === '红', `点击“红”后应显示“红”，实际是“${p()}”。onPick 收到的应该是 color`);
      await t.click(blue);
      t.assert(p() === '蓝', `再点“蓝”后应显示“蓝”，实际是“${p()}”`);
      await t.click(t.q('#outer'));
      t.assert(p() === '无', '点击外层空白处应清空为“无”。请保留外层 div 的 onClick');
    },
  },
  drills: [
    {
      title: '链接当按钮用：阻止默认行为',
      task: '<ol class="task-steps"><li>点链接 <b>展开</b>，下面出现一段内容，链接文字变成 <b>收起</b>。再点一次，内容消失，文字变回 <b>展开</b>。</li><li>链接的 <code>href</code> 是 <code>"#"</code>。点击时浏览器默认会跳转，页面会回到顶部。请让点击只切换内容，不发生跳转。</li></ol>',
      starter: `import { useState } from 'react';

function App() {
  const [open, setOpen] = useState(false);

  function toggle() {
    setOpen(o => !o);
  }

  return (
    <div>
      <a id="toggle" href="#" onClick={toggle}>
        {open ? '收起' : '展开'}
      </a>
      {open && <p id="more">这是更多内容。</p>}
    </div>
  );
}`,
      solution: `import { useState } from 'react';

function App() {
  const [open, setOpen] = useState(false);

  function toggle(e) {
    e.preventDefault();
    setOpen(o => !o);
  }

  return (
    <div>
      <a id="toggle" href="#" onClick={toggle}>
        {open ? '收起' : '展开'}
      </a>
      {open && <p id="more">这是更多内容。</p>}
    </div>
  );
}`,
      hint: '事件对象 <code>e</code> 是 React 传给处理函数的第一个参数。浏览器对链接点击的默认处理（跳转），要在处理函数里调用 <code>e</code> 上的一个方法来阻止。注意它和阻止冒泡是两回事。',
      test: async t => {
        const link = t.q('#toggle');
        t.assert(link, '找不到 id="toggle" 的链接');
        t.assert(link.tagName === 'A', '请保留 <a> 链接，不要换成按钮');
        t.assert(t.text('#toggle') === '展开' && !t.q('#more'), '初始应显示“展开”，且看不到内容');
        // 检查程序在 document 上（晚于 React 的处理函数）记录这次点击的默认行为是否已被阻止，再替学习者拦住跳转
        let prevented = null;
        const spy = e => {
          if (link.contains(e.target)) {
            prevented = e.defaultPrevented;
            if (!e.defaultPrevented) e.preventDefault();
          }
        };
        document.addEventListener('click', spy);
        try {
          await t.click(link);
          t.assert(t.text('#toggle') === '收起' && t.q('#more'), '点击后应显示内容，链接文字变成“收起”');
          t.assert(prevented === true, '点击链接时，浏览器的默认行为（跳转到 href）没有被阻止。阻止默认行为和阻止冒泡是两件事，各有各的方法');
          await t.click(link);
          t.assert(t.text('#toggle') === '展开' && !t.q('#more'), '再点一次应收起内容，文字变回“展开”');
          t.assert(prevented === true, '第二次点击时，浏览器的默认行为也要被阻止');
        } finally {
          document.removeEventListener('click', spy);
        }
      },
    },
    {
      title: '列表里的按钮：给处理函数传参',
      task: '<ol class="task-steps"><li>每一行有一个 <b>删除</b> 按钮。点哪一行的按钮，就只删掉那一行。</li><li>现在点了没有任何反应。<code>remove</code> 需要一个 id，请让按钮把本行的 id 交给它。</li></ol>',
      starter: `import { useState } from 'react';

function App() {
  const [fruits, setFruits] = useState([
    { id: 1, name: '苹果' },
    { id: 2, name: '香蕉' },
    { id: 3, name: '橙子' },
  ]);

  function remove(id) {
    setFruits(fruits.filter(f => f.id !== id));
  }

  return (
    <ul id="list">
      {fruits.map(f => (
        <li key={f.id}>
          <span>{f.name}</span>
          <button onClick={remove}>删除</button>
        </li>
      ))}
    </ul>
  );
}`,
      solution: `import { useState } from 'react';

function App() {
  const [fruits, setFruits] = useState([
    { id: 1, name: '苹果' },
    { id: 2, name: '香蕉' },
    { id: 3, name: '橙子' },
  ]);

  function remove(id) {
    setFruits(fruits.filter(f => f.id !== id));
  }

  return (
    <ul id="list">
      {fruits.map(f => (
        <li key={f.id}>
          <span>{f.name}</span>
          <button onClick={() => remove(f.id)}>删除</button>
        </li>
      ))}
    </ul>
  );
}`,
      hint: 'React 调用处理函数时，传进去的第一个参数是什么？要让 <code>remove</code> 收到 id，得在 <code>onClick</code> 里再包一层函数。别写成 <code>remove(f.id)</code>：那是在渲染时就调用了。',
      test: async t => {
        const names = () => t.qa('#list li span').map(x => x.textContent.trim());
        const del = name => {
          const li = t.qa('#list li').find(x => x.querySelector('span') && x.querySelector('span').textContent.trim() === name);
          return li && li.querySelector('button');
        };
        t.assert(t.q('#list'), '找不到 id="list" 的元素');
        t.assert(
          names().join('、') === '苹果、香蕉、橙子',
          `初始应有 苹果、香蕉、橙子 三行，实际是：${names().join('、') || '（空）'}。如果行被删掉了：检查 onClick 的值，带括号的调用在渲染时就执行了，而不是等到点击`,
        );
        t.assert(del('香蕉'), '每一行要有文字为“删除”的按钮');
        await t.click(del('香蕉'));
        t.assert(
          names().join('、') === '苹果、橙子',
          `点“香蕉”那一行的删除后，应剩 苹果、橙子，实际是：${names().join('、') || '（空）'}。按钮的处理函数要把本行的 id 交给 remove，而不是别的东西`,
        );
        await t.click(del('苹果'));
        t.assert(names().join('、') === '橙子', `再点“苹果”那一行的删除后，应只剩 橙子，实际是：${names().join('、') || '（空）'}`);
        await t.click(del('橙子'));
        t.assert(names().length === 0, `点最后一行的删除后列表应为空，实际还有：${names().join('、')}`);
      },
    },
  ],
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
      note: '按钮 B 的点击先由按钮处理，再冒泡到外层 div，所以新增 2 条。按钮 A 调用了 e.stopPropagation()，事件停在按钮上，只新增 1 条。日志列表用了 <code>.map()</code> 和 <code>key</code>，“列表渲染与 key”一课会讲。',
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
