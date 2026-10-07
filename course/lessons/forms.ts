import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/forms.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'forms',
  stage: 0,
  title: '表单与受控组件',
  mins: 19,
  summary: '让 React state 成为表单数据的唯一数据源。',
  goals: [
    '能把输入框写成受控组件：value 来自 state，onChange 更新 state',
    '能处理文本框、复选框和下拉框，并说出复选框为什么用 checked',
    '能用一个对象 state 和一个通用的 handleChange 管理多个字段',
    '能在提交时阻止页面刷新，并根据 state 做校验',
  ],
  keyPoints: [
    '受控组件：<code>value</code> 来自 state，<code>onChange</code> 更新 state。state 是唯一数据源。',
    '只写 <code>value</code> 不写 <code>onChange</code>，输入框会变成只读。',
    '复选框读写的是 <code>checked</code>，不是 <code>value</code>：它的 value 是固定字符串，和勾没勾选无关。<code>&lt;textarea&gt;</code>、<code>&lt;select&gt;</code> 和文本框一样用 value + onChange。',
    '字段多时，用一个对象 state，再用 <code>[name]: value</code> 写一个通用的 handleChange。',
    '提交时调用 <code>e.preventDefault()</code> 阻止刷新。校验直接根据 state 计算。',
  ],
  quiz: [
    {
      q: '只设置了 value={text} 而没有 onChange 的输入框会怎样？',
      options: ['正常输入，只是 text 不会更新', '变成只读，无法输入', '输入的文字会自动同步到 text', '页面报错并停止渲染'],
      answer: 1,
      explain:
        'value 被 state 锁定，而没有 onChange 去更新 state，所以每次都被设回原值。React 会在控制台警告，但不会崩溃。最迷惑的是第一项：受控输入框显示的永远是 state，state 不变，输入框也不变。',
    },
    {
      q: "受控输入框 <code>&lt;input value={text} onChange={e =&gt; setText(e.target.value)} /&gt;</code>。点“清空”执行 <code>setText('')</code> 后，输入框会怎样？",
      options: ['变空，因为它显示的就是 state', '不变，用户打的字保存在 DOM 里', '先变空，再打一个字时旧文字会回来', '报错：受控输入框不能由代码修改'],
      answer: 0,
      explain:
        '受控组件里 state 是唯一数据源，输入框只负责显示它、通知变化。最迷惑的是第二项：那是非受控输入框的行为，它的值保存在 DOM 里，代码改 state 也影响不到它。',
    },
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
    hint: "输入框显示的值要来自 state。清空时，只要把 state 设为空字符串。<code>{name || '陌生人'}</code> 可以在空字符串时使用默认值。",
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
    test: async t => {
      const pv = () => t.text('#preview').replace(/\s/g, '');
      t.assert(pv() === '你好，陌生人', '初始应显示“你好，陌生人”');
      await t.type('#name', '小美');
      t.assert(pv() === '你好，小美', `输入“小美”后应显示“你好，小美”，实际是“${pv()}”`);
      const clear = t.byText('button', '清空');
      t.assert(clear, '找不到“清空”按钮');
      await t.click(clear);
      t.assert(t.q('#name').value === '', '点“清空”后输入框应变空。输入框要绑定 value，才能由 state 控制');
      t.assert(pv() === '你好，陌生人', '清空后应恢复“你好，陌生人”');
    },
  },
  checkOnly: [
    {
      q: `在输入框里打第一个字时，会发生什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [name, setName] = useState();

&lt;input value={name} onChange={e =&gt; setName(e.target.value)} /&gt;</code></pre></div>`,
      options: ['输入框只读，打不了字', "能输入，但 React 警告：输入框从非受控变成受控；应写 useState('')", '报错并崩溃', '完全正常，没有任何提示'],
      answer: 1,
      explain:
        '初始值是 undefined。<code>value={undefined}</code> 等于没写 value，输入框是非受控的。打字后 value 变成字符串，输入框又变成受控的。React 会警告这种切换。给 state 一个空字符串作为初始值即可。',
    },
    {
      q: `连续点击这个复选框两次，会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [agree, setAgree] = useState(false);

&lt;input
  type="checkbox"
  checked={agree}
  onChange={e =&gt; setAgree(e.target.value)}
/&gt;</code></pre></div>`,
      options: ['第一次勾上，第二次取消不了', '勾上，再取消', '两次都勾不上', '报错：checked 必须是布尔值'],
      answer: 0,
      explain:
        '复选框的 <code>value</code> 默认是字符串 "on"，和是否勾选无关。第一次点击，agree 变成 "on"，它是真值，所以勾上了。第二次点击，agree 仍是 "on"，受控的复选框保持勾选。复选框要读 <code>e.target.checked</code>。“报错”不对：React 不检查 checked 的类型，非空字符串被当作 true。',
    },
  ],
  plays: {
    最基本的受控输入框: {
      note: '“清空”按钮能起作用，正是因为输入框的值由 state 控制。',
    },
    '只有 value，没有 onChange': {
      note: '输入框打不进字，下方的警告说明了原因。输入框每次渲染都被设回 state 里的“你好”，而没有 onChange 去更新 state。',
      predict: {
        q: '点进输入框，按几个键盘字符。输入框里会怎样？',
        options: ['输入的字显示出来，下面的 state 也跟着变', '输入的字显示出来，下面的 state 不变', '什么都打不进去，保持“你好”', '页面报错并停止渲染'],
        answer: 2,
        explain: 'value 被 state 锁定。没有 onChange 去更新 state，每次渲染都被设回“你好”，所以打不进字。React 只在控制台警告，不会崩溃。',
      },
      pkey: 'forms|只有 value，没有 onChange',
    },
    一个完整的表单: {},
  },
} satisfies Lesson;
