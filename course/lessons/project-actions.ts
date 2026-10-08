import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/project-actions.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'project-actions',
  stage: 3,
  title: '实战：给看板加上 Actions、乐观更新与无障碍',
  mins: 40,
  summary: '把看板升级成会等服务器的应用：表单 Action、乐观更新、错误边界和无障碍，把本阶段学的东西接在一起。',
  goals: [
    '能写出用 useActionState 和 form action 提交的添加表单：预期内的失败返回错误值，并带回用户输入的文字',
    '能写出带 useOptimistic 的移动操作，并解释服务器拒绝后卡片为什么自动回到原来的列',
    '能判断一个失败该返回还是该抛出：校验失败返回错误值，服务器崩溃交给错误边界',
    '能给异步结果加上无障碍支持：按钮有名字，错误用 role="alert" 关联输入框，结果写进一直存在的 role="status"',
  ],
  keyPoints: [
    '先分清两种值：<code>cards</code> 是服务器确认过的真实值，<code>shown</code> 是 <code>useOptimistic</code> 在它上面叠加的临时值。真实值只在服务器成功之后才改。',
    '乐观值只活到 Action 结束。失败时真实值没变，界面自动回到原来的列，不用手写回滚。',
    '预期内的失败（标题重复）用返回值表达，由界面显示；意外的错误（服务器崩溃）让它抛出，交给错误边界。',
    '<code>&lt;form action&gt;</code> 在 Action 结束后会重置表单，出错时也一样。要保留用户输入，就把输入放进返回的 state，用 <code>defaultValue</code> 带回来。',
    '读屏软件需要三样东西：按钮有写清对象的名字；错误用 <code>role="alert"</code> 并用 <code>aria-describedby</code> 关联输入框；结果写进一直存在的 <code>role="status"</code>。',
  ],
  quiz: [
    {
      q: '服务器拒绝了一次移动，卡片自动回到了原来的列。代码里没有任何“回滚”语句，这是因为？',
      options: [
        'React 在 catch 里自动调用了 setCards，恢复旧值',
        'useOptimistic 的乐观值只在 Action 进行期间有效；Action 结束后界面重新读取真实值，而失败时真实值没有变',
        'React 记录了每次 set 函数调用，出错时撤销最近的一次',
        'server.move 抛错时，浏览器重新加载了页面',
      ],
      answer: 1,
      explain:
        '乐观值是叠加在真实值 <code>cards</code> 上的临时层。Action 结束，临时层消失，界面回到 <code>cards</code>。失败时没有人修改 <code>cards</code>，所以界面回到原来的列。<code>catch</code> 里要做的只是把原因告诉用户。第一项最有迷惑性：React 不会替你调用 set 函数，也不记录历史。',
    },
    {
      q: '用户添加了重复的标题，服务器判定“已有同名卡片”。Action 里应该怎样表达这个失败？',
      options: [
        '抛出 Error，让最近的错误边界显示这句话',
        '返回 { error: "已有同名卡片" }，界面读 state 显示',
        '调用 alert()：Action 里不能修改界面',
        '什么也不做，用户会发现卡片没有出现',
      ],
      answer: 1,
      explain:
        '重复标题是预期内的失败，用户改一下标题就行。所以用返回值表达，错误显示在表单旁边。抛出错误会让整个看板被备用界面替换，用户输入的内容也没了。抛出留给服务器崩溃这类用户无能为力的意外。第三项不对：Action 返回的值就是新的 state，界面当然能显示。',
    },
    {
      q: '提交重复标题后，输入框被清空了，用户只能重新输入。要保留输入、又继续用 <code>&lt;form action&gt;</code>，应该怎么做？',
      options: [
        '在 Action 里调用 e.preventDefault()，阻止表单重置',
        '出错时返回 { error, title }，输入框写 defaultValue={state.title}',
        '把 input 换成 textarea：textarea 不会被重置',
        '给 form 加 key，每次提交后重新挂载它',
      ],
      answer: 1,
      explain:
        'React 19 在 Action 结束后会重置表单里的非受控字段，出错时也一样。重置时，输入框回到它的 <code>defaultValue</code>。让 <code>defaultValue</code> 跟着返回的 state 走，重置后就是用户刚才输入的内容。Action 收到的是 formData，没有事件对象，没有 <code>preventDefault</code> 可调。textarea 同样会被重置。加 key 重新挂载，清空得更彻底。',
    },
    {
      q: '移动成功、移动失败的原因，以及标题校验错误，分别该怎样让读屏软件读出来？',
      options: [
        '全部用 role="alert"，保证用户一定听到',
        '校验错误用 role="alert" 并用 aria-describedby 关联输入框；移动的结果写进一直存在的 role="status" 区域',
        '全部写在按钮的 aria-label 里，读屏软件会自动朗读变化',
        '不需要：屏幕上看得到，就够了',
      ],
      answer: 1,
      explain:
        '<code>alert</code> 会打断用户正在听的内容，只适合必须马上处理的错误，例如正在填写的输入框出错。移动的结果是通知，<code>status</code> 会等用户听完当前内容再读。<code>aria-label</code> 是控件的名字，变化时不会朗读。最后一项忽略了看不到屏幕的用户。',
    },
    {
      q: '连点同一张卡片的“→”两次，第二次点击时第一次的移动还没得到服务器的回复。<code>moveCard</code> 为什么要从 <code>shown</code> 算目标列，而不是从 <code>cards</code> 算？',
      options: [
        'cards 里没有 col 字段',
        'shown 是服务器确认过的，比 cards 更可靠',
        '第二次点击时，卡片在界面上已经换了列；按 shown 算，才是“再往右一列”，按 cards 算会再次移到同一列',
        'useOptimistic 规定只能读它返回的值',
      ],
      answer: 2,
      explain:
        '用户看到的是 <code>shown</code>：第一次移动的乐观结果已经显示出来。第二次点击的“→”，意思是从用户看到的位置再往右一列。按 <code>cards</code> 算，卡片还在原来的列，第二次点击又移到同一列。第二项相反：<code>cards</code> 才是服务器确认过的值。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li><strong>任务 1：移动卡片。</strong>用 <code>useOptimistic</code> 得到 <code>shown</code>，实现 <code>moveCard</code>：在 <code>startTransition</code> 里先显示移动后的样子，再等 <code>server.move</code>。成功后存进 <code>cards</code> 并写 <code>message</code>；失败时把原因写进 <code>message</code>，不用手写回滚。</li><li><strong>任务 2：添加卡片。</strong>用 <code>useActionState</code> 实现添加。标题为空或重复时返回 <code>{ error, title }</code>，让输入框保留用户输入；成功时返回 <code>title: \'\'</code>，存进 <code>cards</code> 并写 <code>message</code>。服务器崩溃会抛错：不要 <code>try/catch</code>，交给边界。</li><li><strong>任务 3：无障碍。</strong>给两个移动按钮加 <code>aria-label</code>（含卡片标题）；输入框在出错时加 <code>aria-invalid</code> 和 <code>aria-describedby</code>，错误文字加 <code>role="alert"</code>；结果区加 <code>role="status"</code>，并让它一直渲染。</li></ol>',
    starter: `import { Component, createContext, startTransition, useActionState, useContext, useId, useOptimistic, useState } from 'react';
import { useFormStatus } from 'react-dom';

// ===== 模拟的服务器和不用改的部分 =====
// 数据存在内存里，每个请求等一会儿才返回
function createServer(delay) {
  let cards = [
    { id: 1, title: '设计数据结构', col: 'todo' },
    { id: 2, title: '写 reducer', col: 'todo' },
    { id: 3, title: '画界面', col: 'doing' },
    { id: 4, title: '搭项目', col: 'done' },
    { id: 5, title: '读文档', col: 'done' },
  ];
  let nextId = 6;
  const wait = () => new Promise(resolve => setTimeout(resolve, delay));
  return {
    list: () => cards,
    // 校验失败：返回 { error }。标题叫“崩溃”：模拟服务器出故障，直接抛错
    async add(title) {
      await wait();
      if (title === '崩溃') throw new Error('服务器开小差了');
      if (!title.trim()) return { error: '标题不能为空' };
      if (cards.some(c => c.title === title.trim())) return { error: '已有同名卡片' };
      cards = [...cards, { id: nextId++, title: title.trim(), col: 'todo' }];
      return { cards };
    },
    // 规则：“已完成”最多 2 张，超过就抛错。成功时返回新的卡片数组
    async move(id, col) {
      await wait();
      if (col === 'done' && cards.filter(c => c.col === 'done').length >= 2) throw new Error('“已完成”最多放 2 张卡片');
      cards = cards.map(c => (c.id === id ? { ...c, col } : c));
      return cards;
    },
  };
}
const server = createServer(250);

const COLUMNS = [
  { key: 'todo', name: '待办' },
  { key: 'doing', name: '进行中' },
  { key: 'done', name: '已完成' },
];

class CrashBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div id="crash">
          看板出错了：{this.state.error.message}
          <button onClick={() => this.setState({ error: null })}>重试</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MoveCtx = createContext(null);

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? '添加中…' : '添加卡片'}</button>;
}

// ===== 任务 3（一）：两个移动按钮只有箭头，读屏软件读不出要移动哪张卡片 =====
function Card({ card, index }) {
  const move = useContext(MoveCtx);
  const prev = COLUMNS[index - 1];
  const next = COLUMNS[index + 1];
  return (
    <div className="card" style={{ background: '#fff', border: '1px solid #cbd5da', borderRadius: 6, padding: 6, margin: '6px 0' }}>
      <div>{card.title}</div>
      {/* ✏️ 给两个按钮加 aria-label：写上卡片标题和目标列，例如“把‘写 reducer’移到进行中” */}
      <button disabled={!prev} onClick={() => move(card.id, -1)}>←</button>
      <button disabled={!next} onClick={() => move(card.id, 1)}>→</button>
    </div>
  );
}

function Board() {
  const [cards, setCards] = useState(server.list()); // 真实值：服务器给的
  const [message, setMessage] = useState('');
  const errorId = useId();

  // ===== 任务 1：移动卡片，先显示再等服务器 =====
  // 提示：server.move(id, 目标列的 key) 成功时返回新的卡片数组，失败时抛错
  const shown = cards; // 改成 useOptimistic 得到的“正在显示的卡片”

  function moveCard(id, dir) {
    // 在这里写：算出目标列 → 在 Action 里先显示移动后的样子 → 等服务器 → 成功存进 cards，失败播报原因
  }

  // ===== 任务 2：添加卡片，用表单的 action =====
  // server.add(title) 校验失败时返回 { error }，服务器出故障时抛错
  const addState = { error: null, title: '' }; // 改成 useActionState 返回的 state
  function addAction() {} // 改成 useActionState 返回的 action

  return (
    <MoveCtx value={moveCard}>
      <form action={addAction}>
        <input
          id="new-title"
          name="title"
          aria-label="新卡片标题"
          defaultValue={addState.title}
          /* ✏️ 任务 3（二）：有错误时 aria-invalid 为 true，aria-describedby 指向错误文字的 id */
        />
        <SubmitButton />
        {addState.error && (
          <p id={errorId} style={{ color: 'crimson', margin: '4px 0' }}>{addState.error}</p>
        )}
      </form>
      {/* ✏️ 任务 3（三）：这里是给读屏软件播报结果的地方。它该是什么 role？什么时候渲染？ */}
      <p style={{ color: '#5b6b73', minHeight: '1.5em', margin: '4px 0' }}>{message}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {COLUMNS.map((col, i) => {
          const list = shown.filter(c => c.col === col.key);
          return (
            <div className="column" data-col={col.key} key={col.key} style={{ flex: 1, background: '#eef3f5', borderRadius: 8, padding: 8, minWidth: 0 }}>
              <h4 style={{ margin: 0 }}>{col.name}（{list.length}）</h4>
              {list.map(c => <Card key={c.id} card={c} index={i} />)}
            </div>
          );
        })}
      </div>
    </MoveCtx>
  );
}

function App() {
  return (
    <CrashBoundary>
      <Board />
    </CrashBoundary>
  );
}`,
    solution: `import { Component, createContext, startTransition, useActionState, useContext, useId, useOptimistic, useState } from 'react';
import { useFormStatus } from 'react-dom';

// ===== 模拟的服务器和不用改的部分 =====
// 数据存在内存里，每个请求等一会儿才返回
function createServer(delay) {
  let cards = [
    { id: 1, title: '设计数据结构', col: 'todo' },
    { id: 2, title: '写 reducer', col: 'todo' },
    { id: 3, title: '画界面', col: 'doing' },
    { id: 4, title: '搭项目', col: 'done' },
    { id: 5, title: '读文档', col: 'done' },
  ];
  let nextId = 6;
  const wait = () => new Promise(resolve => setTimeout(resolve, delay));
  return {
    list: () => cards,
    // 校验失败：返回 { error }。标题叫“崩溃”：模拟服务器出故障，直接抛错
    async add(title) {
      await wait();
      if (title === '崩溃') throw new Error('服务器开小差了');
      if (!title.trim()) return { error: '标题不能为空' };
      if (cards.some(c => c.title === title.trim())) return { error: '已有同名卡片' };
      cards = [...cards, { id: nextId++, title: title.trim(), col: 'todo' }];
      return { cards };
    },
    // 规则：“已完成”最多 2 张，超过就抛错。成功时返回新的卡片数组
    async move(id, col) {
      await wait();
      if (col === 'done' && cards.filter(c => c.col === 'done').length >= 2) throw new Error('“已完成”最多放 2 张卡片');
      cards = cards.map(c => (c.id === id ? { ...c, col } : c));
      return cards;
    },
  };
}
const server = createServer(250);

const COLUMNS = [
  { key: 'todo', name: '待办' },
  { key: 'doing', name: '进行中' },
  { key: 'done', name: '已完成' },
];

class CrashBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div id="crash">
          看板出错了：{this.state.error.message}
          <button onClick={() => this.setState({ error: null })}>重试</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MoveCtx = createContext(null);

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? '添加中…' : '添加卡片'}</button>;
}

// ===== 任务 3（一）：给移动按钮起名字 =====
function Card({ card, index }) {
  const move = useContext(MoveCtx);
  const prev = COLUMNS[index - 1];
  const next = COLUMNS[index + 1];
  return (
    <div className="card" style={{ background: '#fff', border: '1px solid #cbd5da', borderRadius: 6, padding: 6, margin: '6px 0' }}>
      <div>{card.title}</div>
      <button disabled={!prev} aria-label={prev ? '把“' + card.title + '”移到' + prev.name : '“' + card.title + '”已在最左列'} onClick={() => move(card.id, -1)}>←</button>
      <button disabled={!next} aria-label={next ? '把“' + card.title + '”移到' + next.name : '“' + card.title + '”已在最右列'} onClick={() => move(card.id, 1)}>→</button>
    </div>
  );
}

function Board() {
  const [cards, setCards] = useState(server.list()); // 真实值：服务器给的
  const [message, setMessage] = useState('');
  const errorId = useId();

  // ===== 任务 1：移动卡片，先显示再等服务器 =====
  const [shown, showMove] = useOptimistic(cards, (current, { id, col }) => current.map(c => (c.id === id ? { ...c, col } : c)));

  function moveCard(id, dir) {
    const card = shown.find(c => c.id === id); // 目标列要从“正在显示的”卡片算
    const target = COLUMNS[COLUMNS.findIndex(c => c.key === card.col) + dir];
    if (!target) return;
    startTransition(async () => {
      showMove({ id, col: target.key });
      try {
        const next = await server.move(id, target.key);
        startTransition(() => {
          setCards(next);
          setMessage('已把“' + card.title + '”移到' + target.name);
        });
      } catch (e) {
        setMessage('移动失败：' + e.message);
      }
    });
  }

  // ===== 任务 2：添加卡片，用表单的 action =====
  const [addState, addAction] = useActionState(
    async (prev, formData) => {
      const title = formData.get('title');
      const res = await server.add(title); // 服务器崩溃会抛错：不要 catch，交给错误边界
      if (res.error) return { error: res.error, title }; // 预期内的失败：返回错误值，并带回用户输入的标题
      startTransition(() => { // await 之后，再包一层
        setCards(res.cards);
        setMessage('已添加“' + title.trim() + '”');
      });
      return { error: null, title: '' };
    },
    { error: null, title: '' },
  );

  return (
    <MoveCtx value={moveCard}>
      <form action={addAction}>
        <input
          id="new-title"
          name="title"
          aria-label="新卡片标题"
          defaultValue={addState.title}
          aria-invalid={!!addState.error}
          aria-describedby={addState.error ? errorId : undefined}
        />
        <SubmitButton />
        {addState.error && (
          <p id={errorId} role="alert" style={{ color: 'crimson', margin: '4px 0' }}>{addState.error}</p>
        )}
      </form>
      {/* 任务 3（二）：播报区一直存在，只改里面的文字 */}
      <p role="status" style={{ color: '#5b6b73', minHeight: '1.5em', margin: '4px 0' }}>{message}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {COLUMNS.map((col, i) => {
          const list = shown.filter(c => c.col === col.key);
          return (
            <div className="column" data-col={col.key} key={col.key} style={{ flex: 1, background: '#eef3f5', borderRadius: 8, padding: 8, minWidth: 0 }}>
              <h4 style={{ margin: 0 }}>{col.name}（{list.length}）</h4>
              {list.map(c => <Card key={c.id} card={c} index={i} />)}
            </div>
          );
        })}
      </div>
    </MoveCtx>
  );
}

function App() {
  return (
    <CrashBoundary>
      <Board />
    </CrashBoundary>
  );
}`,
    hint: '先做任务 1。<code>useOptimistic(cards, (current, { id, col }) =&gt; current.map(…))</code> 返回 <code>[shown, showMove]</code>。<code>moveCard</code> 里：<code>startTransition(async () =&gt; { showMove(…); try { const next = await server.move(…); startTransition(() =&gt; setCards(next)); } catch (e) { setMessage(…) } })</code>。任务 2 的 Action 签名是 <code>(prev, formData) =&gt; 新的 state</code>。任务 3：<code>aria-describedby</code> 的值是错误文字的 id，已经有 <code>errorId</code>。',
    faded: `// （服务器、边界、SubmitButton、Card 与起始代码相同，这里省略）

function Board() {
  const [cards, setCards] = useState(server.list());
  const [message, setMessage] = useState('');
  const errorId = useId();

  /* ✏️ useOptimistic：以 cards 为真实值，怎样把 { id, col } 叠加到卡片数组上？ */

  function moveCard(id, dir) {
    const card = shown.find(c => c.id === id);
    const target = COLUMNS[COLUMNS.findIndex(c => c.key === card.col) + dir];
    if (!target) return;
    startTransition(async () => {
      /* ✏️ 先显示移动后的样子 */
      try {
        const next = await server.move(id, target.key);
        startTransition(() => {
          /* ✏️ 成功：把 next 存进真实值 cards */
          setMessage('已把“' + card.title + '”移到' + target.name);
        });
      } catch (e) {
        setMessage('移动失败：' + e.message);
      }
    });
  }

  const [addState, addAction] = useActionState(
    async (prev, formData) => {
      const title = formData.get('title');
      const res = await server.add(title);
      /* ✏️ 校验失败：返回错误值，并带上用户输入的 title */
      startTransition(() => {
        setCards(res.cards);
        setMessage('已添加“' + title.trim() + '”');
      });
      return { error: null, title: '' };
    },
    { error: null, title: '' },
  );

  // …… 界面部分：给 input 加 aria-invalid、aria-describedby，给错误文字加 role="alert"，给播报区加 role="status"
}`,
    test: async t => {
      const titles = col => t.qa(`.column[data-col="${col}"] .card > div`).map(d => d.textContent);
      const card = title => t.qa('.card').find(c => c.firstChild.textContent === title);
      const arrow = (title, a) => Array.from<HTMLElement>(card(title).querySelectorAll('button')).find(b => b.textContent === a);
      const submit = () => t.q('form button') as HTMLButtonElement;
      const input = () => t.q('#new-title') as HTMLInputElement;
      const status = () => t.q('[role="status"]');
      // 任务 3（一）：每个移动按钮都要说清“移动哪张卡片”
      for (const c of t.qa('.card')) {
        const title = c.firstChild.textContent;
        for (const b of Array.from<HTMLElement>(c.querySelectorAll('button'))) {
          const label = b.getAttribute('aria-label') || '';
          t.assert(label.includes(title), `“${title}”的移动按钮只有箭头，读屏软件读不出要移动哪张卡片。给按钮加 aria-label，写上卡片标题和目标列`);
        }
      }
      // 任务 3（三）：播报区一开始就在
      const live = status();
      t.assert(live, '没有找到 role="status" 的播报区。结果消息要放进一个一直存在的实时区域，读屏软件才会读出变化');
      // 任务 2：添加成功
      await t.type('#new-title', '写测试');
      await t.click(submit());
      t.assert(
        submit().disabled,
        '提交期间“添加卡片”按钮应该是禁用的。把 form 的 action 属性设为 Action 函数，SubmitButton 里的 useFormStatus 才读得到 pending（用 onSubmit 做不到）',
      );
      await t.wait(400);
      t.assert(titles('todo').includes('写测试'), '添加成功后，新卡片应出现在“待办”列。Action 里别忘了把 server.add 返回的 cards 存进 state');
      t.assert(input().value === '', '添加成功后输入框应该清空');
      t.assert(status().textContent.includes('写测试'), '添加成功后，播报区应该写上“已添加……”，让读屏软件读出结果');
      t.assert(!t.q('[role="alert"]'), '添加成功后不应该还留着错误提示');
      t.assert(t.unpreventedSubmits() === 0, '表单提交时没有调用 preventDefault，页面会刷新。用 form 的 action 属性时 React 会处理好');
      // 任务 2、3（二）：预期内的失败（标题重复）
      await t.type('#new-title', '写 reducer');
      await t.click(submit());
      await t.wait(400);
      const alertEl = t.q('[role="alert"]');
      t.assert(alertEl && alertEl.textContent.trim(), '标题重复是预期内的失败。Action 应该返回错误值，界面把它显示在一个 role="alert" 的元素里（不要抛错）');
      t.assert(t.qa('.card').length === 6, '标题重复时不应该添加卡片');
      t.assert(
        input().value === '写 reducer',
        '校验失败后，用户输入的文字不见了。React 19 在 Action 结束后会重置表单：把用户输入的标题放进返回的 state，用 defaultValue 带回来',
      );
      t.assert(input().getAttribute('aria-invalid') === 'true', '有错误时输入框应该有 aria-invalid="true"');
      t.assert(input().getAttribute('aria-describedby') === alertEl.id && alertEl.id, '输入框的 aria-describedby 应该指向错误文字的 id（用 useId 生成）');
      // 标题为空
      await t.type('#new-title', '   ');
      await t.click(submit());
      await t.wait(400);
      t.assert(t.q('[role="alert"]') && t.q('[role="alert"]').textContent.includes('空'), '标题为空时，应该显示服务器返回的错误“标题不能为空”');
      // 任务 1：移动成功。点击后卡片立刻出现在目标列
      await t.click(arrow('写 reducer', '→'));
      t.assert(titles('doing').includes('写 reducer'), '点“→”后，卡片应该立刻出现在“进行中”：服务器还没回复，界面就先动（useOptimistic）');
      await t.wait(400);
      t.assert(
        titles('doing').includes('写 reducer') && !titles('todo').includes('写 reducer'),
        '服务器成功后，卡片应该留在“进行中”。别忘了把 server.move 返回的结果存进真实值 cards，否则乐观值一结束，卡片就回到原来的列',
      );
      t.assert(status().textContent.includes('写 reducer'), '移动成功后，播报区应该写上“已把……移到……”');
      // 任务 1：移动失败。先显示，再回到原列
      await t.click(arrow('画界面', '→'));
      t.assert(titles('done').includes('画界面'), '点“→”后，卡片应该立刻出现在“已完成”，哪怕服务器之后会拒绝它');
      await t.wait(400);
      t.assert(
        titles('doing').includes('画界面') && !titles('done').includes('画界面'),
        '服务器拒绝后，卡片应该回到“进行中”。useOptimistic 的乐观值在 Action 结束时自动丢弃，真实值没变，界面就回去了',
      );
      t.assert(status().textContent.includes('最多'), '移动失败时，把失败原因写进播报区，用户（包括读屏软件的用户）才知道发生了什么');
      t.assert(status() === live, '播报区必须一直存在，只改里面的文字。不要写成 {message && <p role="status">…</p>}：新挂载的实时区域，很多读屏软件不会读');
      // 意外的错误：服务器崩溃，交给错误边界
      await t.type('#new-title', '崩溃');
      await t.click(submit());
      await t.wait(400);
      t.assert(t.q('#crash'), '服务器崩溃是意外的错误，不是用户输错了。不要用 try/catch 吞掉它，让它抛出，交给错误边界');
    },
  },
  // 阶段测验专用的读代码题。下标是复习卡片键 课id#cN 的 N：以后只能在末尾追加，不能调换、删除
  checkOnly: [
    {
      q: `点击按钮后过了 0.1 秒，按钮上显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Card() {
  const [col, setCol] = useState('todo');
  const [shown, showMove] = useOptimistic(col, (current, next) =&gt; next);

  async function handleClick() {
    showMove('doing');                      // 直接写在点击处理函数里
    setCol(await server.move(1, 'doing'));  // 服务器 0.5 秒后成功返回 'doing'
  }

  return &lt;button onClick={handleClick}&gt;{shown}&lt;/button&gt;;
}</code></pre></div>`,
      options: [
        'doing：showMove 让界面立刻显示乐观值',
        'todo：showMove 不在 Action 或 startTransition 里，乐观值不生效；开发环境还会警告',
        '报错：事件处理函数里不能调用 showMove',
        '先闪一下 doing，马上变回 todo，0.5 秒后再变成 doing',
      ],
      answer: 1,
      explain:
        '<code>useOptimistic</code> 的更新函数必须在 Action 或 <code>startTransition</code> 里调用。写在普通的点击处理函数里，乐观值提交后立刻被撤回，卡片可能闪一下，控制台警告 “An optimistic state update occurred outside a transition or action”。按钮要等 0.5 秒后 <code>setCol</code> 的真实值到了，才变成 doing。修法：把 <code>showMove</code> 放进 <code>startTransition(async () =&gt; { … })</code>。第一项是想当然的结果。',
    },
    {
      q: `按钮上显示的是 <code>shown</code>，真实值 <code>col</code> 的初始值是 'todo'。点击后过了 0.1 秒和 1 秒，按钮各显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function handleClick() {
  startTransition(async () =&gt; {
    showMove('doing');
    await server.move(1, 'doing');  // 服务器 0.5 秒后成功返回
  });
}</code></pre></div>`,
      options: [
        '都是 doing：服务器成功了，乐观值变成了真实值',
        '0.1 秒时是 doing，1 秒时是 todo：服务器成功了，界面却回到了原来的值',
        '都是 todo：Action 里的 showMove 不生效',
        '0.1 秒时是 todo，1 秒时是 doing',
      ],
      answer: 1,
      explain:
        "乐观值只在 Action 进行期间有效。Action 结束后，界面重新读取真实值 <code>col</code>。这段代码没有在成功后修改 <code>col</code>，所以它还是 'todo'。服务器那边已经改成功了，界面却回去了。修法：在 <code>await</code> 之后用 <code>startTransition(() =&gt; setCol(…))</code> 把结果存进真实值。",
    },
    {
      q: `点击“添加”后过了 0.1 秒，按钮上显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function AddForm() {
  const { pending } = useFormStatus();
  const [state, action] = useActionState(save, null);  // save 要 0.5 秒
  return (
    &lt;form action={action}&gt;
      &lt;input name="title" /&gt;
      &lt;button disabled={pending}&gt;{pending ? '添加中…' : '添加'}&lt;/button&gt;
    &lt;/form&gt;
  );
}</code></pre></div>`,
      options: [
        '添加中…，并且按钮禁用',
        '添加中…，但按钮没有禁用',
        '添加，按钮没有禁用：这里的 pending 一直是 false',
        '报错：useFormStatus 不能和 useActionState 一起用',
      ],
      answer: 2,
      explain:
        '<code>useFormStatus</code> 读的是**祖先** <code>&lt;form&gt;</code> 的状态。它写在渲染 <code>&lt;form&gt;</code> 的同一个组件里，上面没有祖先 form，所以 <code>pending</code> 永远是 false。把按钮抽成 <code>SubmitButton</code>，放在 form 里面，再在那里调用 <code>useFormStatus</code>。如果只想在同一个组件里拿到 pending，可以用 <code>useActionState</code> 的第三个返回值。',
    },
    {
      q: `用户提交了一个已经存在的标题。0.3 秒后，屏幕上是什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">class ErrorBoundary extends Component { /* 出错时显示：出错了：消息 */ }

function AddForm() {
  const [state, action] = useActionState(async (prev, formData) =&gt; {
    const title = formData.get('title');
    if (titles.includes(title)) throw new Error('已有同名卡片');
    return { ok: true };
  }, null);
  return (
    &lt;form action={action}&gt;
      &lt;input name="title" /&gt;
      &lt;button&gt;添加&lt;/button&gt;
      {state?.ok &amp;&amp; &lt;p&gt;已添加&lt;/p&gt;}
    &lt;/form&gt;
  );
}

// App：&lt;ErrorBoundary&gt;&lt;AddForm /&gt;&lt;/ErrorBoundary&gt;</code></pre></div>`,
      options: [
        '表单不变，输入框下面显示“已有同名卡片”',
        '整个表单被替换成“出错了：已有同名卡片”',
        '表单不变，什么提示也没有，错误只出现在控制台',
        '按钮一直卡在“提交中”',
      ],
      answer: 1,
      explain:
        '<code>useActionState</code> 的 Action 抛出的错误不会变成 state，它交给最近的错误边界。边界把整个 <code>AddForm</code> 换成备用界面，用户输入的内容也没了。“标题重复”是预期内的失败，应该<strong>返回</strong>错误值（<code>return { error: … }</code>），让表单自己显示。抛出留给服务器崩溃这类意外的错误。',
    },
  ],
  plays: {
    '成品：会等服务器的看板': {
      note: '这是做完以后的样子。点击后，卡片先动、服务器后回复；被拒绝的移动会退回原列，原因写在表单下方的文字里。标题叫“崩溃”会触发错误边界。练习的起始代码就是它去掉三个任务之后的样子。',
    },
    '添加失败之后，输入框里有什么': {
      note: 'Action 结束后，React 把表单里的非受控字段重置成默认值。这个输入框没有 defaultValue，默认值是空的，所以出错返回时也被清空了。给 input 加 defaultValue={state.title}，Action 出错时返回 { error, title }，重置回到的就是用户输入的标题。',
      predict: {
        q: '列表里已经有“写 reducer”。在输入框里输入“写 reducer”，点“添加”。约 0.5 秒后，输入框里有什么？',
        options: [
          '还是“写 reducer”：出错了，输入没有被提交',
          '空的：Action 结束后表单被重置',
          '“undefined”：Action 返回的 state 里没有 title',
          '“已有同名卡片”：错误信息填回了输入框',
        ],
        answer: 1,
        explain: 'Action 结束后，React 会重置表单里的非受控字段，出错返回时也一样。列表没有变，错误提示出现了，输入框却是空的。',
      },
      pkey: 'project-actions|添加失败之后，输入框里有什么',
    },
    '乐观移动：服务器拒绝之后': {
      note: '点击后卡片马上出现在“已完成”，因为 showMove 在 Action 里立刻生效。1 秒后服务器抛错，Action 结束，乐观值被丢弃，界面重新读取真实值 cards：画界面还在“进行中”。catch 里只写了错误信息，没有任何回滚代码。',
      predict: {
        q: '“已完成”里已经有 2 张卡片，服务器规定最多 2 张。点“画界面”卡片上的“移到已完成”。点击后 0.3 秒，以及 2 秒时，“画界面”各在哪一列？',
        options: [
          '一直在“进行中”：服务器还没回复，界面不动；2 秒时红字说明了原因',
          '0.3 秒时在“已完成”，2 秒时回到“进行中”，下方出现红字说明原因',
          '0.3 秒时在“已完成”，2 秒时还在“已完成”，下方出现红字',
          '0.3 秒时在“已完成”，约 1 秒后页面报错，看板消失',
        ],
        answer: 1,
        explain:
          'showMove 在 Action 里立刻生效，所以 0.3 秒时已经在“已完成”。服务器抛错后，catch 写下原因，Action 结束，乐观值被丢弃，界面回到真实值：画界面还在“进行中”。',
      },
      pkey: 'project-actions|乐观移动：服务器拒绝之后',
    },
  },
} satisfies Lesson;
