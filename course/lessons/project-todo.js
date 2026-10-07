// 由 scripts/convert.mjs 从旧版 src/*.js 生成。
// 非正文数据。课文在 docs/lessons/project-todo.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'project-todo',
  stage: 0,
  title: '实战一：完整的待办应用',
  mins: 40,
  summary: '综合 state、表单、列表、条件渲染和派生数据，从零写一个功能完整的小应用。',
  goals: [
    '能从需求表列出最少需要的 state：todos、text、filter',
    '能区分“存储的状态”和“计算出的值”：筛选后的列表、剩余数量都在渲染时算出',
    '能用不可变写法实现添加、切换、删除',
    '能按需求表逐条交付，并通过自动验收',
  ],
  keyPoints: [
    '先设计 state，再写界面：只存 todos、输入框文字、当前筛选，其余都能算出来。',
    '“剩余数量”“筛选后的列表”在渲染时用 <code>filter</code> 计算。再存一份，就会出现两个数据源，容易不同步。',
    '修改数组用 <code>map</code>、<code>filter</code>、展开运算符生成新数组。不要 push、splice，也不要直接改某一项的 done。',
    '最常见的坑：忘了 <code>preventDefault()</code> 导致表单提交刷新页面；忘了清空输入框；空白内容也被添加。',
  ],
  quiz: [
    {
      q: '待办应用中，“剩余数量”应该怎么实现？',
      options: [
        '单独一个 useState 存剩余数量，每次添加、切换、删除时都同步加减',
        '渲染时用 filter 算出未完成的条数',
        '渲染时显示 todos.length',
        '在组件外用 let left 变量记录，增删改时修改它',
      ],
      answer: 1,
      explain: '能从现有状态计算出的值不应该再存一份，否则容易不同步。todos.length 会把已完成的也算进去。组件外的变量改了也不会触发重新渲染。',
    },
    {
      q: '切换某条待办的完成状态，正确的不可变写法是？',
      options: [
        'todos[i].done = !todos[i].done; setTodos(todos)',
        'setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))',
        'const next = todos; next[i] = { ...todos[i], done: !todos[i].done }; setTodos(next)',
        'setTodos(todos.push(x))',
      ],
      answer: 1,
      explain: '用 map 生成新数组，并为被修改的项创建新对象。第三个选项最有迷惑性：它复制了那一项，但 next 和 todos 是同一个数组，React 比较引用后认为没变，界面不会更新。第一个选项同理。push 也在原数组上修改，而且它返回的是新长度，不是数组。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>读需求说明，列出需要的 state。</li><li>按需求 1 到 6 的顺序逐条实现。</li><li>id、类名和按钮文字必须和“实现约定”一致。检查程序用它们操作你的应用。</li></ol>',
    starter: `import { useState } from 'react';

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');

  // 1. 添加：注意清空输入框、忽略空白内容
  // 2. 切换完成、删除
  // 3. 根据 filter 计算要显示的列表，计算剩余数量

  return (
    <div>
      <form>
        <input id="new-todo" placeholder="要做什么？" />
        <button>添加</button>
      </form>
      <ul>
        {/* <li className="todo"> 复选框 + 文字 + 删除按钮 </li> */}
      </ul>
      <p id="left">剩余 0 项</p>
      <div>
        <button>全部</button>
        <button>未完成</button>
        <button>已完成</button>
      </div>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

let nextId = 1;

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');

  function add(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setTodos([...todos, { id: nextId++, text: value, done: false }]);
    setText('');
  }
  const toggle = (id) => setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id) => setTodos(todos.filter(t => t.id !== id));

  const visible = todos.filter(t => filter === 'all' ? true : filter === 'done' ? t.done : !t.done);
  const left = todos.filter(t => !t.done).length;
  const tab = (key, label) => (
    <button onClick={() => setFilter(key)} style={{ fontWeight: filter === key ? 700 : 400 }}>{label}</button>
  );

  return (
    <div>
      <form onSubmit={add}>
        <input id="new-todo" placeholder="要做什么？" value={text} onChange={e => setText(e.target.value)} />
        <button>添加</button>
      </form>
      <ul>
        {visible.map(t => (
          <li key={t.id} className={'todo' + (t.done ? ' done' : '')}>
            <label>{/* label 包住复选框，读屏软件会读出这条待办的文字 */}
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
              <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
            </label>
            <button onClick={() => remove(t.id)}>删除</button>
          </li>
        ))}
      </ul>
      <p id="left">剩余 {left} 项</p>
      <div>{tab('all', '全部')}{tab('active', '未完成')}{tab('done', '已完成')}</div>
    </div>
  );
}`,
    hint: '用 <code>&lt;form onSubmit&gt;</code> 处理添加并 <code>preventDefault()</code>；显示列表用 <code>todos.filter(...)</code> 按 filter 计算；剩余数量用 <code>todos.filter(t =&gt; !t.done).length</code>。',
    faded: `import { useState } from 'react';

let nextId = 1;

function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');

  function add(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    /* ✏️ 用展开运算符生成新数组，追加 { id, text, done: false } */
    setText('');
  }
  const toggle = (id) => /* ✏️ 用 map 生成新数组：id 相同的那一项复制一份，done 取反 */;
  const remove = (id) => setTodos(todos.filter(t => t.id !== id));

  /* ✏️ visible：根据 filter（all / active / done）从 todos 中筛选 */
  /* ✏️ left：未完成的数量，在渲染时计算，不要另存 state */
  const tab = (key, label) => (
    <button onClick={() => setFilter(key)} style={{ fontWeight: filter === key ? 700 : 400 }}>{label}</button>
  );

  return (
    <div>
      <form onSubmit={add}>
        <input id="new-todo" placeholder="要做什么？" value={text} onChange={e => setText(e.target.value)} />
        <button>添加</button>
      </form>
      <ul>
        {visible.map(t => (
          <li key={t.id} className={'todo' + (t.done ? ' done' : '')}>
            <label>
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
              <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
            </label>
            <button onClick={() => remove(t.id)}>删除</button>
          </li>
        ))}
      </ul>
      <p id="left">剩余 {left} 项</p>
      <div>{tab('all', '全部')}{tab('active', '未完成')}{tab('done', '已完成')}</div>
    </div>
  );
}`,
    test: async (t) => {
      const add = async (v) => { await t.type('#new-todo', v); await t.click(t.byText('button', '添加')); };
      const items = () => t.qa('li.todo');
      const left = () => t.text('#left').replace(/\s/g, '');
      t.assert(t.q('#new-todo') && t.byText('button', '添加'), '需要 #new-todo 输入框和“添加”按钮');
      await add('买牛奶'); await add('写周报'); await add('跑步');
      t.assert(items().length === 3, `添加 3 条后应有 3 个 li.todo，实际 ${items().length} 个`);
      t.assert(t.q('#new-todo').value === '', '添加后输入框应被清空');
      await add('   ');
      t.assert(items().length === 3, '空白内容不应被添加（需求 2）');
      t.assert(left() === '剩余3项', `应显示“剩余 3 项”，实际是“${t.text('#left')}”`);
      const cb = items()[1].querySelector('input[type=checkbox]');
      t.assert(cb, '每条待办需要一个复选框');
      await t.click(cb);
      t.assert(items()[1].classList.contains('done'), '勾选后该 li 应加上 done 类名（需求 3）');
      t.assert(left() === '剩余2项', `勾选一条后应显示“剩余 2 项”，实际是“${t.text('#left')}”`);
      await t.click(items()[1].querySelector('input[type=checkbox]'));
      t.assert(!items()[1].classList.contains('done') && left() === '剩余3项', '再次点击复选框应取消完成（需求 3）');
      await t.click(items()[1].querySelector('input[type=checkbox]'));
      await t.click(t.byText('button', '已完成'));
      t.assert(items().length === 1 && items()[0].textContent.includes('写周报'), '“已完成”筛选下应只显示“写周报”');
      await t.click(t.byText('button', '未完成'));
      t.assert(items().length === 2, '“未完成”筛选下应显示 2 条');
      await t.click(t.byText('button', '全部'));
      t.assert(items().length === 3, '“全部”筛选下应显示 3 条');
      const del = Array.from(items()[0].querySelectorAll('button')).find(b => b.textContent.trim() === '删除');
      t.assert(del, '每条待办需要一个“删除”按钮');
      await t.click(del);
      t.assert(items().length === 2 && !items().some(li => li.textContent.includes('买牛奶')), '删除后“买牛奶”应消失');
      t.assert(left() === '剩余1项', `删除一条未完成项后应显示“剩余 1 项”，实际是“${t.text('#left')}”`);
    },
  },
  checkOnly: [
    {
      q: `添加一条未完成的待办后，“剩余”显示的数字会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [todos, setTodos] = useState(initialTodos);
const [left, setLeft] = useState(
  todos.filter(t =&gt; !t.done).length
);

function add(todo) {
  setTodos([...todos, todo]);
}
// …
&lt;p&gt;剩余 {left} 项&lt;/p&gt;</code></pre></div>`,
      options: ['自动加 1', '不变：useState 的初始值只在第一次渲染时使用', '变成 0', '报错：不能用 todos 计算初始值'],
      answer: 1,
      explain: 'useState 的参数只在第一次渲染时使用。之后 todos 变了，left 也不会跟着变。剩余数量可以由 todos 算出，就不要存成 state。直接在渲染时计算：<code>const left = todos.filter(t =&gt; !t.done).length</code>。',
    },
    {
      q: `列表里有 id 为 1、2、3 的三条待办。先删除 id 为 1 的，再添加“买菜”，然后点击“买菜”的切换按钮。结果是？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const add = title =&gt;
  setTodos([...todos, { id: todos.length + 1, title, done: false }]);

const toggle = id =&gt;
  setTodos(todos.map(t =&gt; t.id === id ? { ...t, done: !t.done } : t));</code></pre></div>`,
      options: ['只有“买菜”被标记完成', '“买菜”和原来 id 为 3 的那条一起被切换', '原来 id 为 3 的那条被切换，“买菜”不变', '报错：找不到 id'],
      answer: 1,
      explain: '删除后只剩 2 条，<code>todos.length + 1</code> 等于 3。“买菜”的 id 与已有的一条重复。toggle 按 id 匹配，所以两条一起切换。重复的 key 也会让 React 发出警告。id 应该用独立的计数器或 <code>crypto.randomUUID()</code> 生成。',
    },
  ],
  plays: {},
};
