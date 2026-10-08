import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/forms.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'forms',
  stage: 0,
  title: '表单与受控组件',
  mins: 30,
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
    {
      q: '<code>&lt;form action={save}&gt;</code> 里的 <code>save</code> 是一个函数。用户提交表单时，它会收到什么参数？',
      options: [
        '提交事件对象 e，要自己调用 e.preventDefault()',
        '一个 FormData 对象，里面是各个带 name 的字段的值',
        '包含所有字段的 state 对象',
        '什么参数都没有，要用 ref 读输入框',
      ],
      answer: 1,
      explain:
        "React 19 会阻止页面刷新，再用 <code>FormData</code> 调用 action 函数，用 <code>formData.get('name')</code> 取值。没有 <code>name</code> 的字段不会出现在里面。最容易误选的是第一项：那是 <code>onSubmit</code> 的参数。<code>action</code> 不需要 preventDefault，也不依赖 state。",
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
  drills: [
    {
      title: '复选框和下拉框：读对属性',
      task: '<ol class="task-steps"><li>复选框 <b>接收邮件</b> 要能勾上，也能取消。</li><li>下拉框要能选择“每天”“每周”“每月”。没勾选时，下拉框是禁用的。</li><li><code>&lt;p id="summary"&gt;</code> 显示：没勾选时是 <b>未订阅</b>；勾选后是 <b>已订阅，每周</b>（频率跟着下拉框变）。</li></ol>',
      starter: `import { useState } from 'react';

function App() {
  const [subscribed, setSubscribed] = useState(false);
  const [freq, setFreq] = useState('weekly');

  return (
    <div>
      <label>
        <input id="sub" type="checkbox" checked={subscribed} onChange={e => setSubscribed(e.target.value)} />
        接收邮件
      </label>
      <select id="freq" value={freq}>
        <option value="daily">每天</option>
        <option value="weekly">每周</option>
        <option value="monthly">每月</option>
      </select>
      <p id="summary">{subscribed ? '已订阅，' + freq : '未订阅'}</p>
    </div>
  );
}`,
      solution: `import { useState } from 'react';

const LABELS = { daily: '每天', weekly: '每周', monthly: '每月' };

function App() {
  const [subscribed, setSubscribed] = useState(false);
  const [freq, setFreq] = useState('weekly');

  return (
    <div>
      <label>
        <input id="sub" type="checkbox" checked={subscribed} onChange={e => setSubscribed(e.target.checked)} />
        接收邮件
      </label>
      <select id="freq" value={freq} disabled={!subscribed} onChange={e => setFreq(e.target.value)}>
        <option value="daily">每天</option>
        <option value="weekly">每周</option>
        <option value="monthly">每月</option>
      </select>
      <p id="summary">{subscribed ? '已订阅，' + LABELS[freq] : '未订阅'}</p>
    </div>
  );
}`,
      hint: '复选框的勾选状态在 <code>e.target.checked</code> 里，它的 <code>value</code> 是固定字符串。下拉框和文本框一样，要同时写 <code>value</code> 和 <code>onChange</code>。摘要里的“每周”是显示文字，state 里存的是 option 的 value，需要对应起来。',
      test: async t => {
        const box = t.q('#sub'),
          sel = t.q('#freq');
        t.assert(box && box.type === 'checkbox', '找不到 id="sub" 的复选框');
        t.assert(sel && sel.tagName === 'SELECT', '找不到 id="freq" 的下拉框');
        const sum = () => t.text('#summary').replace(/\s/g, '');
        const pick = async label => {
          sel.value = (Array.from(sel.options) as any[]).find(o => o.text === label).value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          await t.wait(40);
        };
        t.assert(!box.checked && sum() === '未订阅', `初始应是未勾选，摘要为“未订阅”，实际是“${sum()}”`);
        await t.click(box);
        t.assert(box.checked, '点击复选框后应是勾选状态');
        await t.click(box);
        t.assert(!box.checked, '再点一次复选框，应该取消勾选，实际还是勾着。复选框的勾选状态不在 value 里，想想应该读事件对象上的哪个属性');
        t.assert(sum() === '未订阅', `取消勾选后摘要应是“未订阅”，实际是“${sum()}”`);
        t.assert(sel.disabled, '没勾选时，下拉框应是禁用的（disabled）');
        await t.click(box);
        t.assert(!sel.disabled, '勾选后，下拉框应可以使用');
        t.assert(sum() === '已订阅，每周', `勾选后摘要应是“已订阅，每周”，实际是“${sum()}”。state 里存的是 option 的 value，显示要用对应的文字`);
        await pick('每天');
        t.assert(
          sel.options[sel.selectedIndex].text === '每天',
          '选了“每天”之后，下拉框又弹回了别的选项。受控的下拉框要同时写 value 和 onChange，选择变化时更新 state',
        );
        t.assert(sum() === '已订阅，每天', `选“每天”后摘要应是“已订阅，每天”，实际是“${sum()}”`);
        await t.click(box);
        t.assert(sum() === '未订阅' && sel.disabled, `取消勾选后摘要应是“未订阅”且下拉框禁用，实际摘要是“${sum()}”`);
        await t.click(box);
        t.assert(sum() === '已订阅，每天', `再次勾选后应保留刚才选的频率，摘要应是“已订阅，每天”，实际是“${sum()}”`);
      },
    },
    {
      title: '非受控表单：提交时才读值',
      task: '<ol class="task-steps"><li>点 <b>提交</b> 之后，<code>&lt;p id="result"&gt;</code> 显示 <b>姓名：小美；城市：上海；通知：是</b> 这样的文字。没勾选“订阅通知”时，最后是 <b>通知：否</b>。</li><li>提交之前，<code>#result</code> 保持空白，输入和勾选过程中也不变。</li><li>不要用 state 一个字段一个字段地跟踪输入，在提交时一次读出所有字段。</li></ol>',
      starter: `import { useState } from 'react';

function App() {
  const [result, setResult] = useState('');

  return (
    <form>
      <input name="name" placeholder="姓名" />
      <select name="city">
        <option>北京</option>
        <option>上海</option>
      </select>
      <label>
        <input type="checkbox" name="news" /> 订阅通知
      </label>
      <button>提交</button>
      <p id="result">{result}</p>
    </form>
  );
}`,
      solution: `import { useState } from 'react';

function App() {
  const [result, setResult] = useState('');

  function save(formData) {
    const news = formData.get('news') ? '是' : '否';
    setResult('姓名：' + formData.get('name') + '；城市：' + formData.get('city') + '；通知：' + news);
  }

  return (
    <form action={save}>
      <input name="name" placeholder="姓名" />
      <select name="city">
        <option>北京</option>
        <option>上海</option>
      </select>
      <label>
        <input type="checkbox" name="news" /> 订阅通知
      </label>
      <button>提交</button>
      <p id="result">{result}</p>
    </form>
  );
}`,
      hint: '<code>&lt;form action={函数}&gt;</code> 提交时，React 调用这个函数，参数是 <code>FormData</code>，用 <code>formData.get("字段名")</code> 取值。复选框没勾选时，FormData 里根本没有这个字段，取到的是什么？勾选时又是什么？',
      test: async t => {
        const res = () => t.text('#result').replace(/\s/g, '');
        const name = t.q('input[name="name"]'),
          city = t.q('select[name="city"]'),
          news = t.q('input[name="news"]');
        t.assert(name && city && news, '请保留起始代码里带 name 属性的姓名、城市、通知三个字段');
        t.assert(res() === '', '提交之前，#result 应是空的');
        await t.type(name, '小美');
        city.value = '上海';
        city.dispatchEvent(new Event('change', { bubbles: true }));
        await t.click(news);
        await t.wait(40);
        t.assert(res() === '', '输入和勾选的过程中，#result 不应变化。只在点击“提交”之后才显示结果');
        const submit = t.byText('button', '提交');
        t.assert(submit, '找不到“提交”按钮');
        await t.click(submit);
        await t.wait(150);
        t.assert(t.unpreventedSubmits() === 0, '提交表单时页面会刷新。用 onSubmit 的话，处理函数里要调用 e.preventDefault()；用 action 属性则由 React 代劳');
        t.assert(
          res() === '姓名：小美；城市：上海；通知：是',
          `勾选后提交，应显示“姓名：小美；城市：上海；通知：是”，实际是“${res() || '（空）'}”。如果通知显示不对：复选框没勾选时，FormData 里没有这个字段；勾选时有，但值不是布尔值`,
        );
        // 用 action 提交后 React 会重置表单，所以每次都按需要把各字段设到目标值，不假设上次的状态
        await t.type(name, '小强');
        city.value = '北京';
        city.dispatchEvent(new Event('change', { bubbles: true }));
        if (news.checked) await t.click(news);
        await t.click(submit);
        await t.wait(150);
        t.assert(res() === '姓名：小强；城市：北京；通知：否', `取消勾选后再提交，应显示“姓名：小强；城市：北京；通知：否”，实际是“${res() || '（空）'}”`);
      },
    },
  ],
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
    'form 的 action 属性': {
      note: '输入框被清空了。<code>action</code> 函数跑完后，React 会把表单里没有绑定 state 的字段重置为初始值。这和 <code>onSubmit</code> 不同：用 <code>onSubmit</code> 时，输入框的内容提交后原样保留。如果希望保留，就把字段做成受控组件。',
      predict: {
        q: '输入“小美”，点“提交”。下面显示“你好，小美”之后，输入框里的“小美”会怎样？',
        options: ['还留在输入框里', '被清空', '变成“你好，小美”', '输入框消失'],
        answer: 1,
        explain: 'action 函数执行完，React 会重置表单里非受控的字段，所以输入框变空。页面不会刷新，msg 已经更新。',
      },
      pkey: 'forms|form 的 action 属性',
    },
  },
} satisfies Lesson;
