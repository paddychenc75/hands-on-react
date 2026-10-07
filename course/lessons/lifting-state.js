// 非正文数据。课文在 docs/lessons/lifting-state.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'lifting-state',
  stage: 1,
  title: '状态提升与组件通信',
  mins: 18,
  summary: '当多个组件需要共享数据时，把状态放到它们最近的共同父组件里。',
  goals: [
    '能找出几个组件共用的 state，并把它提升到最近的共同父组件',
    '能通过 props 传入数据和回调，让子组件请求父组件修改 state',
    '能按“唯一数据源”原则判断哪些值该存成 state、哪些该算出来',
    '能说出 prop drilling 是什么，以及什么时候该考虑 Context',
  ],
  keyPoints: [
    '两个组件要共用同一份数据时，把 state 移到它们最近的共同父组件。这叫状态提升。',
    '数据向下流：父组件通过 props 传入值。事件向上传：父组件通过 props 传入回调，子组件调用它，请求父组件修改。',
    '唯一数据源：同一份数据只存一份 state。能算出来的值（例如华氏度）不要再存一份。',
    '常见的坑：子组件自己再存一份 state，它就和父组件的数据对不上了。',
    '层级很深、每层都要转发 props 时，叫 prop drilling。这时可以考虑第 12 课的 Context。',
  ],
  quiz: [
    {
      q: '两个兄弟组件要显示同一份数据，并且都能修改它。最常见的做法是？',
      options: [
        '各存一份 state，再用 effect 互相同步',
        '把 state 提升到共同父组件，再通过 props 传入',
        '把 state 放在其中一个组件里，另一个用 ref 去读',
        '放进模块顶层的变量，两个组件直接读写',
      ],
      answer: 1,
      explain: '状态提升让数据只有一个来源。最迷惑的是第一项：两份 state 靠 effect 同步，中间总有一次渲染是不一致的，还会多渲染一次。模块变量被修改时，React 不知道，不会重新渲染。',
    },
    {
      q: 'TempInput 通过 props 收到 <code>value</code> 和 <code>onChange</code>。用户在输入框里打字时，TempInput 应该怎么做？',
      options: [
        '调用 onChange(新值)，由父组件更新 state',
        '直接给 props.value 赋新值',
        '在 TempInput 里再声明一个 state 存新值',
        '用 document.querySelector 改另一个输入框',
      ],
      answer: 0,
      explain: '数据向下流，事件向上传。子组件调用父组件传入的回调，请求父组件修改。最迷惑的是第三项：子组件自己再存一份，它和父组件的数据就对不上了，另一个输入框也不会更新。',
    },
    {
      q: '温度转换器为什么不同时存 celsius 和 fahrenheit 两个 state？',
      options: [
        '华氏度能由摄氏度算出来；存两份就要处处同时更新',
        '一个组件最多只能调用一次 useState',
        '两个 state 会让每次输入都渲染两遍',
        '存两份也可以，只是多占一点内存',
      ],
      answer: 0,
      explain: '这是唯一数据源原则：能算出来的值不存成 state。最迷惑的是最后一项：问题不在内存，而在两份数据随时可能对不上。第三项也不对：同一个事件里的多次更新会合并成一次渲染。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>现在每个 <code>Panel</code> 自己保存 <code>isActive</code>，两个面板可以同时展开。</li><li>在 <code>App</code> 中声明 state <code>activeId</code>，初始值为 <code>\'p1\'</code>。</li><li>删掉 Panel 里的 isActive state。改为通过 props 传入 <code>isActive</code> 和 <code>onShow</code>。</li><li>App 给每个 Panel 传入：isActive（它是不是当前展开的那个）、onShow（点“展开”时，把 activeId 改成它的 id）。</li><li>结果：同一时间只展开一个面板。点另一个面板的“展开”，原来展开的那个自动收起。</li></ol>',
    starter: `import { useState } from 'react';

function Panel({ id, title, children }) {
  const [isActive, setIsActive] = useState(false);
  return (
    <section id={id}>
      <h3>{title}</h3>
      {isActive ? (
        <p className="content">{children}</p>
      ) : (
        <button onClick={() => setIsActive(true)}>展开</button>
      )}
    </section>
  );
}

function App() {
  return (
    <div>
      <Panel id="p1" title="关于">杭州的一家小书店。</Panel>
      <Panel id="p2" title="营业时间">每天 9:00 到 21:00。</Panel>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

function Panel({ id, title, isActive, onShow, children }) {
  return (
    <section id={id}>
      <h3>{title}</h3>
      {isActive ? (
        <p className="content">{children}</p>
      ) : (
        <button onClick={onShow}>展开</button>
      )}
    </section>
  );
}

function App() {
  const [activeId, setActiveId] = useState('p1');
  return (
    <div>
      <Panel id="p1" title="关于" isActive={activeId === 'p1'} onShow={() => setActiveId('p1')}>
        杭州的一家小书店。
      </Panel>
      <Panel id="p2" title="营业时间" isActive={activeId === 'p2'} onShow={() => setActiveId('p2')}>
        每天 9:00 到 21:00。
      </Panel>
    </div>
  );
}`,
    exports: ['App'],
    hint: '先问：哪个组件需要知道“现在展开的是哪一个”？两个 Panel 都要知道，所以 state 要放在它们的共同父组件 App 里。Panel 只负责按 isActive 显示，并在点击时调用 onShow。',
    faded: `import { useState } from 'react';

function Panel({ id, title, /* ✏️ 通过 props 接收 isActive 和 onShow */ children }) {
  return (
    <section id={id}>
      <h3>{title}</h3>
      {isActive ? (
        <p className="content">{children}</p>
      ) : (
        <button onClick={/* ✏️ 请求父组件展开自己 */}>展开</button>
      )}
    </section>
  );
}

function App() {
  /* ✏️ 声明 activeId 和它的 set 函数，初始值为 'p1' */
  return (
    <div>
      <Panel id="p1" title="关于" isActive={/* ✏️ p1 是不是当前展开的那个？ */} onShow={() => setActiveId('p1')}>
        杭州的一家小书店。
      </Panel>
      <Panel id="p2" title="营业时间" isActive={activeId === 'p2'} onShow={/* ✏️ 把 activeId 改成 'p2' */}>
        每天 9:00 到 21:00。
      </Panel>
    </div>
  );
}`,
    test: async (t) => {
      const sec = (id) => t.q('#' + id);
      const isOpen = (id) => !!sec(id).querySelector('.content');
      const showBtn = (id) => [...sec(id).querySelectorAll('button')].find(b => b.textContent.trim() === '展开');
      t.assert(sec('p1') && sec('p2'), '找不到 id 为 p1 和 p2 的面板。请保留 <section id={id}>');
      t.assert(isOpen('p1') && !isOpen('p2'), '一开始应只展开 p1。App 里 activeId 的初始值应为 \'p1\'');
      t.assert(showBtn('p2'), '没展开的面板应显示“展开”按钮');
      await t.click(showBtn('p2'));
      t.assert(isOpen('p2'), '点 p2 的“展开”后，p2 应展开。Panel 的按钮要调用 onShow，App 再更新 activeId');
      t.assert(!isOpen('p1'), '点 p2 的“展开”后，p1 应自动收起。两个面板各自保存 isActive 时，互相不知道对方的状态。请把 state 提升到 App，由 App 决定哪个面板展开');
      t.assert(showBtn('p1'), 'p1 收起后应显示“展开”按钮');
      await t.click(showBtn('p1'));
      t.assert(isOpen('p1') && !isOpen('p2'), '再点 p1 的“展开”，应只展开 p1，p2 收起');
      // 检查 state 放在哪里：渲染 <section> 的组件（Panel）不应再有自己的 state，它的上层组件（App）要有
      const fiberOf = (node) => { const k = Object.keys(node).find(k => k.startsWith('__reactFiber$')); return k && node[k]; };
      const isComp = (f) => !!f && [0, 11, 15].includes(f.tag); // 函数组件、forwardRef、memo
      const hasState = (f) => { for (let h = f.memoizedState; h && typeof h === 'object' && 'next' in h; h = h.next) if (h.queue && typeof h.queue.dispatch === 'function') return true; return false; };
      let panel = fiberOf(sec('p1'));
      while (panel && !isComp(panel)) panel = panel.return;
      t.assert(panel, '找不到渲染 <section> 的组件。请保留 Panel 组件');
      t.assert(!hasState(panel), 'Panel 里还有自己的 state。这样 Panel 和 App 各存一份“是否展开”，两份数据随时可能对不上（用 effect 同步也会慢一拍）。请删掉 Panel 的 useState，只通过 props 接收 isActive');
      let owner = panel.return;
      while (owner && !(isComp(owner) && hasState(owner))) owner = owner.return;
      t.assert(owner, '找不到保存 activeId 的组件。请在 App 里用 useState 声明 activeId，再通过 props 传给 Panel');
      // 再渲染一份 App：两份应各管各的。state 如果放在了组件外面（模块变量），两份会互相影响
      t.assert(typeof t.exports.App === 'function', '请保留名为 App 的组件');
      const box = document.createElement('div');
      const root = ReactDOM.createRoot(box);
      try {
        ReactDOM.flushSync(() => root.render(React.createElement(t.exports.App)));
        const b2 = [...box.querySelectorAll('#p2 button')].find(b => b.textContent.trim() === '展开');
        t.assert(b2, '再渲染一份 App 时，p2 应显示“展开”按钮');
        ReactDOM.flushSync(() => b2.click());
        await t.wait(40);
        t.assert(box.querySelector('#p2 .content') && !box.querySelector('#p1 .content'), '再渲染一份 App，点 p2 的“展开”，这一份没有按预期切换');
        const shared = 'App 的不同实例互相影响：“展开的是哪一个”存在了组件外面（模块变量），被所有 App 共用。请把它存成 App 的 state';
        t.assert(isOpen('p1') && !isOpen('p2'), '在另一份 App 里展开 p2，页面上这一份也跟着变了。' + shared);
        const box3 = document.createElement('div');
        const root3 = ReactDOM.createRoot(box3);
        try {
          ReactDOM.flushSync(() => root3.render(React.createElement(t.exports.App)));
          t.assert(box3.querySelector('#p1 .content') && !box3.querySelector('#p2 .content'), '在另一份 App 里展开 p2 之后，新渲染的 App 一开始就展开了 p2，应展开 p1。' + shared);
        } finally { root3.unmount(); }
      } finally { root.unmount(); }
    },
  },
  checkOnly: [
    {
      q: `父组件渲染 <code>&lt;Child value={count} /&gt;</code>。count 从 0 变成 5 后，Child 显示几？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Child({ value }) {
  const [v, setV] = useState(value);
  return &lt;p&gt;{v}&lt;/p&gt;;
}</code></pre></div>`,
      options: ['5', '0', '先显示 0，下一次渲染显示 5', '报错'],
      answer: 1,
      explain: 'useState(value) 只在第一次渲染时读取 value。之后 props 变了，v 不会更新。数据应该只有一个来源。Child 直接显示 <code>value</code> 就行，不要再复制一份到 state。',
    },
    {
      q: `Celsius 和 Fahrenheit 各自保存温度。需求：改一个，另一个跟着变。最好的做法是？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Celsius() {
  const [c, setC] = useState(0); /* … */
}
function Fahrenheit() {
  const [f, setF] = useState(32); /* … */
}
function App() {
  return &lt;&gt;&lt;Celsius /&gt;&lt;Fahrenheit /&gt;&lt;/&gt;;
}</code></pre></div>`,
      options: [
        '两个组件保留各自的 state，再各写一个 useEffect，监听对方的值并同步更新自己',
        '用一个 useRef 在两个组件之间共享温度',
        '保留两个组件的 state，再在 App 里多存一份，三处一起更新',
        '只在 App 里存摄氏度；两个组件通过 props 拿值和回调，华氏度在渲染时算出',
      ],
      answer: 3,
      explain: '两个组件要显示同一份数据，就把 state 提升到最近的共同父组件，只存一处。子组件通过 props 拿到值，改动时调用父组件传入的回调。华氏度能由摄氏度算出，不必再存。用 effect 互相同步，看起来能工作，但每次修改都多渲染一轮，两边还可能互相触发、短暂不一致。ref 的修改不会触发重新渲染，另一个组件看不到变化。',
    },
  ],
  plays: {
    '温度转换器：两个输入框共享一份状态': {
      note: '在任意一个输入框里改数字，另一个都会同步更新。App 只存一份 state：用户刚输入的值和它的单位。正在输入的框显示原文，另一个框在每次渲染时由它算出来。两个 TempInput 都没有自己的 state。',
      predict: {
        q: '把“华氏度 °F”框里的数字改成 212。“摄氏度 °C”框会显示什么？',
        options: ['20：它有自己的值，不受影响', '212：两个框显示同一个值', '100', '空白'],
        answer: 2,
        explain: 'App 只存一份 state：{ value: \'212\', scale: \'f\' }。每次渲染时，摄氏度由它算出来：(212 − 32) × 5 / 9 = 100。最迷惑的是“20”：只有两个输入框各存一份 state 时才会这样。',
      },
      pkey: 'lifting-state|温度转换器：两个输入框共享一份状态',
    },
  },
};
