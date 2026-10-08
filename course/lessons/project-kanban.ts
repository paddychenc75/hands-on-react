import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/project-kanban.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'project-kanban',
  stage: 1,
  title: '实战三：看板应用',
  mins: 42,
  summary: '用 useReducer 和 Context 组织一个多组件应用，体会状态架构的价值。',
  goals: [
    '能写出一个纯 reducer：add、move、remove 三种 action，每个分支都返回新对象',
    '能处理边界情况：空白标题、越界移动、删除后再添加时 id 不重复',
    '能解释为什么把 dispatch 放进 Context，深层的 Card 就不用层层传回调',
    '能说出“状态逻辑写成纯函数”带来的好处：可以单独测试，也能迁移到其他状态库',
  ],
  keyPoints: [
    '界面只负责显示和派发 action，所有规则集中在 reducer 里。reducer 是纯函数，可以直接调用来测试。',
    '每张卡片只存一个 <code>col</code> 字段，列里有哪些卡片用 filter 算出。卡片只有一个数据源，不会同时出现在两列。',
    '新卡片的 id 用 <code>nextId</code>，不用 <code>cards.length + 1</code>：删除之后长度会变小，id 就会重复。',
    '最常见的坑：在 reducer 里 push 或直接改 card.col。开发环境的 StrictMode 会调用 reducer 两次，卡片就被加两次。',
  ],
  quiz: [
    {
      q: '为什么卡片只存 col 字段，而不是为每列存一个卡片数组？',
      options: [
        '节省内存',
        '每张卡片只有一个数据源，不会同时出现在两列',
        '列数组更方便排序和拖拽，所以只存 col 其实是更差的设计',
        'useReducer 的 state 不能包含嵌套数组',
      ],
      answer: 1,
      explain:
        '每列各存一个数组时，移动卡片要从一个数组删除、往另一个数组添加。两步中漏一步，卡片就会消失或同时出现在两列。只存 col，移动只改一个字段。“列数组更方便排序”有一定道理，但排序可以另存一个 order 字段，不需要重复存卡片。useReducer 的 state 可以是任何值。',
    },
    {
      q: '把 dispatch 放进 Context 的主要好处是？',
      options: ['Context 让 dispatch 不再触发重新渲染', '深层组件可以直接派发 action，无需层层传递回调', '可以替代 reducer', '可以让 reducer 读取组件的 props'],
      answer: 1,
      explain:
        '深层组件直接拿到 dispatch，不用层层传递回调。第一个选项有迷惑性：dispatch 的引用是稳定的，所以这个 Context 的值不会变，读取它的组件不会因为 Context 而重新渲染；但 dispatch 引起的 state 变化仍然会让 App 重新渲染。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>实现 <code>add</code>：标题去掉首尾空格后为空，就返回原 state；否则在“待办”列新增卡片。</li><li>实现 <code>move</code>：按 <code>dir</code> 把卡片移到相邻列；越界时不移动。</li><li>实现 <code>remove</code>：删除卡片。</li><li>每个分支都返回新对象，不修改原 state。界面代码不需要修改。</li></ol>',
    starter: `import { useReducer, useState, createContext, useContext } from 'react';

const COLUMN_NAMES = { todo: '待办', doing: '进行中', done: '已完成' };
const initialState = {
  columns: ['todo', 'doing', 'done'],
  cards: [
    { id: 1, title: '设计数据结构', col: 'todo' },
    { id: 2, title: '写 reducer', col: 'todo' },
  ],
  nextId: 3,
};

// ===== 你的任务：实现这个 reducer =====
function boardReducer(state, action) {
  switch (action.type) {
    // case 'add': ...
    // case 'move': ...
    // case 'remove': ...
    default:
      return state;
  }
}

// ===== 以下为界面，无需修改 =====
const DispatchCtx = createContext(null);

function Card({ card, isFirst, isLast }) {
  const dispatch = useContext(DispatchCtx);
  return (
    <div className="card" style={{ background: '#fff', border: '1px solid #cbd5da', borderRadius: 6, padding: 6, margin: '6px 0' }}>
      <div>{card.title}</div>
      <button disabled={isFirst} aria-label="移到左边一列" onClick={() => dispatch({ type: 'move', id: card.id, dir: -1 })}>←</button>
      <button disabled={isLast} aria-label="移到右边一列" onClick={() => dispatch({ type: 'move', id: card.id, dir: 1 })}>→</button>
      <button onClick={() => dispatch({ type: 'remove', id: card.id })}>删除</button>
    </div>
  );
}

function Column({ col, index, cards, total }) {
  return (
    <div className="column" data-col={col} style={{ flex: 1, background: '#eef3f5', borderRadius: 8, padding: 8, minWidth: 0 }}>
      <h4 style={{ margin: 0 }}>{COLUMN_NAMES[col]}（{cards.length}）</h4>
      {cards.map(c => <Card key={c.id} card={c} isFirst={index === 0} isLast={index === total - 1} />)}
    </div>
  );
}

function App() {
  const [state, dispatch] = useReducer(boardReducer, initialState);
  const [title, setTitle] = useState('');
  return (
    <DispatchCtx value={dispatch}>
      <form onSubmit={e => { e.preventDefault(); dispatch({ type: 'add', title }); setTitle(''); }}>
        <input id="card-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="新卡片" />
        <button>添加卡片</button>
      </form>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {state.columns.map((col, i) => (
          <Column key={col} col={col} index={i} total={state.columns.length}
            cards={state.cards.filter(c => c.col === col)} />
        ))}
      </div>
    </DispatchCtx>
  );
}`,
    solution: `import { useReducer, useState, createContext, useContext } from 'react';

const COLUMN_NAMES = { todo: '待办', doing: '进行中', done: '已完成' };
const initialState = {
  columns: ['todo', 'doing', 'done'],
  cards: [
    { id: 1, title: '设计数据结构', col: 'todo' },
    { id: 2, title: '写 reducer', col: 'todo' },
  ],
  nextId: 3,
};

// ===== 你的任务：实现这个 reducer =====
function boardReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const title = action.title.trim();
      if (!title) return state;
      return {
        ...state,
        cards: [...state.cards, { id: state.nextId, title, col: state.columns[0] }],
        nextId: state.nextId + 1,
      };
    }
    case 'move':
      return {
        ...state,
        cards: state.cards.map(c => {
          if (c.id !== action.id) return c;
          const i = state.columns.indexOf(c.col) + action.dir;
          return i >= 0 && i < state.columns.length ? { ...c, col: state.columns[i] } : c;
        }),
      };
    case 'remove':
      return { ...state, cards: state.cards.filter(c => c.id !== action.id) };
    default:
      return state;
  }
}

// ===== 以下为界面，无需修改 =====
const DispatchCtx = createContext(null);

function Card({ card, isFirst, isLast }) {
  const dispatch = useContext(DispatchCtx);
  return (
    <div className="card" style={{ background: '#fff', border: '1px solid #cbd5da', borderRadius: 6, padding: 6, margin: '6px 0' }}>
      <div>{card.title}</div>
      <button disabled={isFirst} aria-label="移到左边一列" onClick={() => dispatch({ type: 'move', id: card.id, dir: -1 })}>←</button>
      <button disabled={isLast} aria-label="移到右边一列" onClick={() => dispatch({ type: 'move', id: card.id, dir: 1 })}>→</button>
      <button onClick={() => dispatch({ type: 'remove', id: card.id })}>删除</button>
    </div>
  );
}

function Column({ col, index, cards, total }) {
  return (
    <div className="column" data-col={col} style={{ flex: 1, background: '#eef3f5', borderRadius: 8, padding: 8, minWidth: 0 }}>
      <h4 style={{ margin: 0 }}>{COLUMN_NAMES[col]}（{cards.length}）</h4>
      {cards.map(c => <Card key={c.id} card={c} isFirst={index === 0} isLast={index === total - 1} />)}
    </div>
  );
}

function App() {
  const [state, dispatch] = useReducer(boardReducer, initialState);
  const [title, setTitle] = useState('');
  return (
    <DispatchCtx value={dispatch}>
      <form onSubmit={e => { e.preventDefault(); dispatch({ type: 'add', title }); setTitle(''); }}>
        <input id="card-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="新卡片" />
        <button>添加卡片</button>
      </form>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {state.columns.map((col, i) => (
          <Column key={col} col={col} index={i} total={state.columns.length}
            cards={state.cards.filter(c => c.col === col)} />
        ))}
      </div>
    </DispatchCtx>
  );
}`,
    hint: '<code>add</code> 用 <code>state.nextId</code> 作为新 id 并让 nextId + 1；<code>move</code> 用 <code>state.columns.indexOf(c.col) + action.dir</code> 算出新列的下标，越界就不变；每个分支都返回新对象。',
    exports: ['boardReducer'],
    faded: `// （initialState 和界面代码与起始代码相同，这里省略）

function boardReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const title = action.title.trim();
      /* ✏️ 标题为空：原样返回 state */
      return {
        ...state,
        /* ✏️ cards：展开旧数组，追加 { id: state.nextId, title, col: 第一列 } */
        nextId: state.nextId + 1,
      };
    }
    case 'move':
      return {
        ...state,
        cards: state.cards.map(c => {
          if (c.id !== action.id) return c;
          /* ✏️ 算出新列的下标：当前列在 columns 中的下标 + action.dir */
          /* ✏️ 下标在范围内：返回复制后改了 col 的新对象；否则返回原来的 c */
        }),
      };
    case 'remove':
      return { ...state, cards: state.cards.filter(c => c.id !== action.id) };
    default:
      return state;
  }
}`,
    test: async t => {
      const { React, ReactDOM } = t;
      const titles = col => t.qa(`.column[data-col="${col}"] .card`).map(c => c.firstChild.textContent);
      const card = title => t.qa('.card').find(c => c.firstChild.textContent === title);
      const btn = (c, label) => Array.from<HTMLElement>(c.querySelectorAll('button')).find(b => b.textContent === label);
      await t.type('#card-input', '写测试');
      await t.click(t.byText('button', '添加卡片'));
      t.assert(titles('todo').includes('写测试'), '添加后“写测试”应出现在“待办”列');
      await t.type('#card-input', '   ');
      await t.click(t.byText('button', '添加卡片'));
      t.assert(t.qa('.card').length === 3, '空白标题不应添加卡片');
      await t.click(btn(card('写测试'), '→'));
      t.assert(titles('doing').includes('写测试'), '点 → 后“写测试”应移到“进行中”');
      await t.click(btn(card('写测试'), '→'));
      t.assert(titles('done').includes('写测试'), '再点 → 应移到“已完成”');
      await t.click(btn(card('写测试'), '←'));
      t.assert(titles('doing').includes('写测试') && !titles('done').includes('写测试'), '点 ← 应移回“进行中”');
      const r = t.exports.boardReducer;
      t.assert(typeof r === 'function', '没有找到 boardReducer');
      const s0 = {
        columns: ['todo', 'doing', 'done'],
        cards: [
          { id: 1, title: 'a', col: 'done' },
          { id: 2, title: 'b', col: 'todo' },
        ],
        nextId: 3,
      };
      const s1 = r(s0, { type: 'move', id: 1, dir: 1 });
      t.assert(s1.cards[0].col === 'done', '已在最右列的卡片向右移动时应保持不变');
      const s2 = r(s0, { type: 'move', id: 2, dir: -1 });
      t.assert(s2.cards[1].col === 'todo', '已在最左列的卡片向左移动时应保持不变');
      const s3 = r(s0, { type: 'move', id: 2, dir: 1 });
      t.assert(s3 !== s0 && s0.cards[1].col === 'todo', 'reducer 不能修改原来的 state，要返回新对象');
      const snap = JSON.stringify(s0);
      const a1 = r(s0, { type: 'add', title: ' x ' });
      t.assert(JSON.stringify(s0) === snap, 'add 不能修改原来的 state（不要用 push），要返回新对象');
      t.assert(a1.cards.length === 3 && a1.cards[2].title === 'x' && a1.cards[2].col === 'todo', 'add 应去掉首尾空格，并把卡片加到“待办”列');
      t.assert(a1.cards[2].id === 3 && a1.nextId === 4, '新卡片的 id 应取 nextId，并让 nextId 加 1');
      t.assert(r(s0, { type: 'add', title: '  ' }) === s0, '空白标题应原样返回 state');
      const a2 = r(r(s0, { type: 'remove', id: 1 }), { type: 'add', title: 'y' });
      t.assert(JSON.stringify(s0) === snap, 'remove 不能修改原来的 state（不要用 splice），要返回新对象');
      t.assert(a2.cards.length === 2 && new Set(a2.cards.map(c => c.id)).size === 2, '删除后再添加，卡片 id 不能重复（用 nextId，不要用 cards.length + 1）');
      await t.click(btn(card('写测试'), '删除'));
      t.assert(!card('写测试'), '删除后卡片应消失');
    },
  },
  checkOnly: [
    {
      q: `应用包在 <code>&lt;StrictMode&gt;</code> 里，在开发环境运行。卡片在“待办”列，点一次“→”，它会到哪一列？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">case 'move':
  return {
    ...state,
    cards: state.cards.map(c =&gt; {
      if (c.id !== action.id) return c;
      const i = state.columns.indexOf(c.col) + action.dir;
      if (i &gt;= 0 &amp;&amp; i &lt; state.columns.length) c.col = state.columns[i];
      return c;
    }),
  };</code></pre></div>`,
      options: ['进行中', '已完成', '还在待办：返回的还是同一个卡片对象', '报错：reducer 不能给参数赋值'],
      answer: 1,
      explain:
        '<code>c.col = …</code> 直接修改了旧的卡片对象。严格模式在开发环境会把 reducer 调用两次。两次改的是同一个对象：第一次从待办改到进行中，第二次从进行中改到已完成。纯函数写法：<code>return { ...c, col: state.columns[i] }</code>。',
    },
    {
      q: `App 里忘了写 <code>&lt;DispatchCtx value={dispatch}&gt;</code>，其他代码不变。点卡片上的“删除”会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const DispatchCtx = createContext(null);

function Card({ card }) {
  const dispatch = useContext(DispatchCtx);
  return &lt;button onClick={() =&gt; dispatch({ type: 'remove', id: card.id })}&gt;删除&lt;/button&gt;;
}</code></pre></div>`,
      options: ['卡片被正常删除', '点击时报错：dispatch 是 null，不是函数', '渲染时就报错，页面打不开', '什么也不发生：dispatch 是空函数'],
      answer: 1,
      explain:
        '找不到 Provider 时，useContext 返回创建 Context 时给的默认值，这里是 null。组件能正常渲染，点击时才执行 <code>null(…)</code>，抛出 TypeError。“渲染时就报错”不对：渲染阶段只是读到 null，没有调用它。所以真实项目常写一个自定义 Hook，找不到 Provider 时抛出清楚的错误。',
    },
  ],
  plays: {},
} satisfies Lesson;
