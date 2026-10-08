import type { Lesson } from '../types.ts';
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
        '两个组件各存一份 state，在各自的 onChange 里顺便改对方的那一份',
        '把 state 提升到共同父组件，再通过 props 传入',
        '把 state 放在其中一个组件里，另一个用 document.querySelector 去读',
        '放进模块顶层的变量，两个组件直接读写',
      ],
      answer: 1,
      explain:
        '状态提升让数据只有一个来源。最迷惑的是第一项：兄弟组件拿不到对方的 set 函数；即使想办法拿到，两份数据也要处处同时更新，漏一处就对不上。模块变量被修改时，React 不知道，不会重新渲染。',
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
      explain:
        '数据向下流，事件向上传。子组件调用父组件传入的回调，请求父组件修改。最迷惑的是第三项：子组件自己再存一份，它和父组件的数据就对不上了，另一个输入框也不会更新。',
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
      explain:
        '这是唯一数据源原则：能算出来的值不存成 state。最迷惑的是最后一项：问题不在内存，而在两份数据随时可能对不上。第三项也不对：同一个事件里的多次更新会合并成一次渲染。',
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
    test: async t => {
      const { React, ReactDOM } = t;
      const sec = id => t.q('#' + id);
      const isOpen = id => !!sec(id).querySelector('.content');
      const showBtn = id => [...sec(id).querySelectorAll('button')].find(b => b.textContent.trim() === '展开');
      t.assert(sec('p1') && sec('p2'), '找不到 id 为 p1 和 p2 的面板。请保留 <section id={id}>');
      t.assert(isOpen('p1') && !isOpen('p2'), "一开始应只展开 p1。App 里 activeId 的初始值应为 'p1'");
      t.assert(showBtn('p2'), '没展开的面板应显示“展开”按钮');
      await t.click(showBtn('p2'));
      t.assert(isOpen('p2'), '点 p2 的“展开”后，p2 应展开。Panel 的按钮要调用 onShow，App 再更新 activeId');
      t.assert(
        !isOpen('p1'),
        '点 p2 的“展开”后，p1 应自动收起。两个面板各自保存 isActive 时，互相不知道对方的状态。请把 state 提升到 App，由 App 决定哪个面板展开',
      );
      t.assert(showBtn('p1'), 'p1 收起后应显示“展开”按钮');
      await t.click(showBtn('p1'));
      t.assert(isOpen('p1') && !isOpen('p2'), '再点 p1 的“展开”，应只展开 p1，p2 收起');
      // 检查 state 放在哪里：渲染 <section> 的组件（Panel）不应再有自己的 state，它的上层组件（App）要有。
      // 依赖 React 19.3.x 的 fiber 结构（经 t.internals：componentOf / hasStateHook）；结构不认识时跳过，
      // 下面“再渲染一份 App，两份各管各的”的行为断言仍会发现把 state 放在组件外面的写法
      const inter = t.internals;
      const sectionFiber = inter.fiberOf(sec('p1'));
      const panel = sectionFiber && inter.componentOf(sectionFiber);
      if (sectionFiber && inter.hasStateHook(panel) !== null) {
        t.assert(panel, '找不到渲染 <section> 的组件。请保留 Panel 组件');
        t.assert(
          !inter.hasStateHook(panel),
          'Panel 里还有自己的 state。这样 Panel 和 App 各存一份“是否展开”，两份数据随时可能对不上。请删掉 Panel 的 useState，只通过 props 接收 isActive',
        );
        let owner = inter.componentOf(panel.return);
        while (owner && !inter.hasStateHook(owner)) owner = inter.componentOf(owner.return);
        t.assert(owner, '找不到保存 activeId 的组件。请在 App 里用 useState 声明 activeId，再通过 props 传给 Panel');
      }
      // 再渲染一份 App：两份应各管各的。state 如果放在了组件外面（模块变量），两份会互相影响
      t.assert(typeof t.exports.App === 'function', '请保留名为 App 的组件');
      const box = document.createElement('div');
      const root = ReactDOM.createRoot(box);
      try {
        ReactDOM.flushSync(() => root.render(React.createElement(t.exports.App)));
        const b2 = [...box.querySelectorAll<HTMLElement>('#p2 button')].find(b => b.textContent.trim() === '展开');
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
          t.assert(
            box3.querySelector('#p1 .content') && !box3.querySelector('#p2 .content'),
            '在另一份 App 里展开 p2 之后，新渲染的 App 一开始就展开了 p2，应展开 p1。' + shared,
          );
        } finally {
          root3.unmount();
        }
      } finally {
        root.unmount();
      }
    },
  },
  drills: [
    {
      title: '两个输入框同步',
      task: '<ol class="task-steps"><li>现在两个输入框各存一份文字，互相不知道对方输入了什么。</li><li>把文字提升到 <code>App</code>，整个页面只存一份。</li><li><code>Field</code> 自己不再有 state，通过 props 接收文字和变化时的回调。</li><li>结果：在任意一个框里输入，另一个框同步显示同样的文字，下面的 <code>字数</code> 也跟着变。</li></ol>',
      starter: `import { useState } from 'react';

function Field({ id, label }) {
  const [text, setText] = useState('');
  return (
    <p>
      <label>{label}：
        <input id={id} value={text} onChange={e => setText(e.target.value)} />
      </label>
    </p>
  );
}

function App() {
  return (
    <div>
      <Field id="a" label="输入框 A" />
      <Field id="b" label="输入框 B" />
      <p id="len">字数：0</p>
    </div>
  );
}`,
      solution: `import { useState } from 'react';

function Field({ id, label, text, onChange }) {
  return (
    <p>
      <label>{label}：
        <input id={id} value={text} onChange={e => onChange(e.target.value)} />
      </label>
    </p>
  );
}

function App() {
  const [text, setText] = useState('');
  return (
    <div>
      <Field id="a" label="输入框 A" text={text} onChange={setText} />
      <Field id="b" label="输入框 B" text={text} onChange={setText} />
      <p id="len">字数：{text.length}</p>
    </div>
  );
}`,
      hint: '谁需要知道文字？两个 Field 和字数都要，所以 state 要放在它们最近的共同父组件里。Field 只负责显示收到的文字，输入变化时通知父组件。',
      exports: ['App'],
      test: async t => {
        const { React, ReactDOM } = t;
        const val = id => (t.q('#' + id) ? t.q('#' + id).value : null);
        const len = () => t.text('#len').replace(/\s/g, '');
        t.assert(t.q('#a') && t.q('#b') && t.q('#len'), '请保留 id 为 a、b 的输入框和 id 为 len 的字数。');
        await t.type('#a', '你好');
        t.assert(
          val('b') === '你好',
          '在输入框 A 输入“你好”后，输入框 B 应同步显示“你好”，实际是“' + val('b') + '”。两个框各存一份文字时，互相看不到对方，请只存一份。',
        );
        t.assert(len() === '字数：2', '输入“你好”后字数应为 2，实际显示“' + t.text('#len') + '”。字数要由那一份文字算出来。');
        await t.type('#b', 'hello');
        t.assert(val('a') === 'hello', '在输入框 B 输入“hello”后，输入框 A 应同步显示“hello”，实际是“' + val('a') + '”。');
        t.assert(len() === '字数：5', '输入“hello”后字数应为 5，实际显示“' + t.text('#len') + '”。');
        await t.type('#a', '');
        t.assert(val('b') === '' && len() === '字数：0', '清空输入框 A 后，B 和字数也应清空。');
        await t.type('#a', 'abc');
        // 谁拥有 state：渲染输入框的组件如果不是显示字数的那个组件，就不该有自己的 state
        const I = t.internals;
        const ownerOf = sel => I.componentOf(I.fiberOf(t.q(sel)));
        const fieldComp = ownerOf('#a');
        const lenComp = ownerOf('#len');
        if (fieldComp && lenComp && fieldComp.type !== lenComp.type) {
          t.assert(I.hasStateHook(fieldComp) !== true, '输入框所在的组件里还有自己的 state。文字应只存在它们共同的父组件里，输入框组件只通过 props 接收文字。');
        }
        // 再渲染一份 App：两份各管各的，文字不能存在组件外面
        t.assert(typeof t.exports.App === 'function', '请保留名为 App 的组件');
        const box = document.createElement('div');
        const root = ReactDOM.createRoot(box);
        try {
          ReactDOM.flushSync(() => root.render(React.createElement(t.exports.App)));
          const a2: any = box.querySelector('#a');
          t.assert(
            a2 && a2.value === '',
            '再渲染一份 App，输入框一开始就有内容“' + (a2 && a2.value) + '”，应为空。文字被存在了组件外面，被所有 App 共用。请把它存成 App 的 state。',
          );
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(a2, 'xyz');
          a2.dispatchEvent(new Event('input', { bubbles: true }));
          await t.wait(40);
          t.assert((box.querySelector('#b') as any).value === 'xyz', '在新渲染的 App 里输入后，另一个框没有同步。');
          t.assert(
            val('a') === 'abc',
            '在另一份 App 里输入后，页面上这一份被改掉了（现在是“' + val('a') + '”）。文字被存在了组件外面，请把它存成 App 的 state。',
          );
        } finally {
          root.unmount();
        }
      },
    },
    {
      title: '修复搜索框和列表不同步',
      task: '<ol class="task-steps"><li>在搜索框输入“苹果”，下面的列表却没有变化，计数也不对。</li><li>找出原因：搜索词现在存了几份？列表读的是哪一份？</li><li>修复它，让搜索词只有一份。</li><li>结果：输入“苹果”后列表只剩 3 项，<code>共 3 项</code> 同步变化；清空后恢复全部 5 项。</li></ol>',
      starter: `import { useState } from 'react';

const FRUITS = ['苹果', '香蕉', '苹果派', '橙子', '青苹果'];

function SearchBox() {
  const [query, setQuery] = useState('');
  return <input id="q" placeholder="搜索水果" value={query} onChange={e => setQuery(e.target.value)} />;
}

function FruitList() {
  const [query] = useState('');
  const shown = FRUITS.filter(f => f.includes(query));
  return (
    <div>
      <p id="count">共 {shown.length} 项</p>
      <ul id="list">
        {shown.map(f => <li key={f}>{f}</li>)}
      </ul>
    </div>
  );
}

function App() {
  return (
    <div>
      <SearchBox />
      <FruitList />
    </div>
  );
}`,
      solution: `import { useState } from 'react';

const FRUITS = ['苹果', '香蕉', '苹果派', '橙子', '青苹果'];

function SearchBox({ query, onChange }) {
  return <input id="q" placeholder="搜索水果" value={query} onChange={e => onChange(e.target.value)} />;
}

function FruitList({ query }) {
  const shown = FRUITS.filter(f => f.includes(query));
  return (
    <div>
      <p id="count">共 {shown.length} 项</p>
      <ul id="list">
        {shown.map(f => <li key={f}>{f}</li>)}
      </ul>
    </div>
  );
}

function App() {
  const [query, setQuery] = useState('');
  return (
    <div>
      <SearchBox query={query} onChange={setQuery} />
      <FruitList query={query} />
    </div>
  );
}`,
      hint: '搜索框和列表各有一个 query，列表读的是自己那份，永远是空字符串。谁需要知道搜索词？它们的共同父组件是 App，state 应该放在那里。',
      exports: ['App'],
      test: async t => {
        const { React, ReactDOM } = t;
        const items = (scope = t.root) => [...scope.querySelectorAll('#list li')].map(li => li.textContent.trim());
        const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
        const count = () => t.text('#count').replace(/\s/g, '');
        t.assert(t.q('#q') && t.q('#list') && t.q('#count'), '请保留 id 为 q 的搜索框、id 为 list 的列表和 id 为 count 的计数。');
        t.assert(items().length === 5, '一开始应显示全部 5 项，实际是 ' + items().length + ' 项。');
        await t.type('#q', '苹果');
        t.assert(
          same(items(), ['苹果', '苹果派', '青苹果']),
          '输入“苹果”后列表应只剩 3 项（苹果、苹果派、青苹果），实际是：' +
            items().join('、') +
            '。搜索词在搜索框和列表里各存了一份，列表读不到搜索框里输入的内容。',
        );
        t.assert(count() === '共3项', '输入“苹果”后计数应为“共 3 项”，实际是“' + t.text('#count') + '”。');
        await t.type('#q', '橙');
        t.assert(same(items(), ['橙子']), '输入“橙”后列表应只剩“橙子”，实际是：' + items().join('、') + '。过滤要用搜索框当前的内容，不能写死。');
        await t.type('#q', '没有');
        t.assert(items().length === 0 && count() === '共0项', '输入“没有”后列表应为空、计数为“共 0 项”。');
        await t.type('#q', '');
        t.assert(items().length === 5 && count() === '共5项', '清空搜索框后应恢复全部 5 项。');
        await t.type('#q', '橙');
        // 搜索词只能在一个共同祖先里：搜索框所在的组件和列表所在的组件，不能各自有 state
        const I = t.internals;
        const statefulTypes = sel => {
          const out = [];
          for (let f = I.componentOf(I.fiberOf(t.q(sel))); f; f = I.componentOf(f.return)) if (I.hasStateHook(f) === true) out.push(f.type);
          return out;
        };
        const qChain = statefulTypes('#q');
        const listChain = statefulTypes('#list');
        t.assert(
          qChain.every(x => listChain.includes(x)) && listChain.every(x => qChain.includes(x)),
          '搜索框和列表不在同一个有 state 的组件里：搜索词被存了不止一份。应只在它们的共同父组件里存一份。',
        );
        // 再渲染一份：互不影响
        t.assert(typeof t.exports.App === 'function', '请保留名为 App 的组件');
        const box = document.createElement('div');
        const root = ReactDOM.createRoot(box);
        try {
          ReactDOM.flushSync(() => root.render(React.createElement(t.exports.App)));
          t.assert(items(box).length === 5, '再渲染一份 App，列表一开始应是全部 5 项。搜索词被存在了组件外面，被所有 App 共用，请把它存成 App 的 state。');
          const q2: any = box.querySelector('#q');
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(q2, '香');
          q2.dispatchEvent(new Event('input', { bubbles: true }));
          await t.wait(40);
          t.assert(same(items(box), ['香蕉']), '在新渲染的 App 里输入“香”后，列表应只剩“香蕉”。');
          t.assert(same(items(), ['橙子']), '在另一份 App 里输入后，页面上这一份的列表被改掉了。搜索词被存在了组件外面，请把它存成 App 的 state。');
        } finally {
          root.unmount();
        }
      },
    },
  ],
  checkOnly: [
    {
      q: `父组件渲染 <code>&lt;Child value={count} /&gt;</code>。count 从 0 变成 5 后，Child 显示几？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Child({ value }) {
  const [v, setV] = useState(value);
  return &lt;p&gt;{v}&lt;/p&gt;;
}</code></pre></div>`,
      options: ['5', '0', '先显示 0，下一次渲染显示 5', '报错'],
      answer: 1,
      explain:
        'useState(value) 只在第一次渲染时读取 value。之后 props 变了，v 不会更新。数据应该只有一个来源。Child 直接显示 <code>value</code> 就行，不要再复制一份到 state。',
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
      explain:
        '两个组件要显示同一份数据，就把 state 提升到最近的共同父组件，只存一处。子组件通过 props 拿到值，改动时调用父组件传入的回调。华氏度能由摄氏度算出，不必再存。用 effect 互相同步，看起来能工作，但每次修改都多渲染一轮，两边还可能互相触发、短暂不一致。ref 的修改不会触发重新渲染，另一个组件看不到变化。',
    },
  ],
  plays: {
    '温度转换器：两个输入框共享一份状态': {
      note: '在任意一个输入框里改数字，另一个都会同步更新。App 只存一份 state：用户刚输入的值和它的单位。正在输入的框显示原文，另一个框在每次渲染时由它算出来。两个 TempInput 都没有自己的 state。',
      predict: {
        q: '把“华氏度 °F”框里的数字改成 212。“摄氏度 °C”框会显示什么？',
        options: ['20：它有自己的值，不受影响', '212：两个框显示同一个值', '100', '空白'],
        answer: 2,
        explain:
          "App 只存一份 state：{ value: '212', scale: 'f' }。每次渲染时，摄氏度由它算出来：(212 − 32) × 5 / 9 = 100。最迷惑的是“20”：只有两个输入框各存一份 state 时才会这样。",
      },
      pkey: 'lifting-state|温度转换器：两个输入框共享一份状态',
    },
  },
} satisfies Lesson;
