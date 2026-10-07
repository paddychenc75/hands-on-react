import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/state-at-scale.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'state-at-scale',
  stage: 5,
  title: '大型应用状态架构实战',
  mins: 40,
  summary: '数据量和页面一多，state 的“形状”就决定了 bug 的数量。学会规范化、记忆化选择器、并发安全的乐观更新、撤销重做和状态机。',
  goals: [
    '能把嵌套的接口数据规范化为 byId + ids，并写出只替换被修改实体的 reducer',
    '能写出记忆化选择器，并诊断它为什么“总是重新计算”',
    '能解释“快照回滚”在两个请求并发时为什么会丢数据，并说出待定队列的做法',
    '能设计撤销/重做的历史结构，并用状态机替代一组互相矛盾的布尔值',
  ],
  keyPoints: [
    '规范化：每种实体按 id 存一份（byId），顺序单独存（ids），实体之间只存对方的 id。改一个实体只替换它自己，其他实体的引用不变。',
    '派生数据不存进 state。代价高或要保持引用稳定时，用记忆化选择器：输入选择器选出的值都没变（Object.is），就返回上一次的结果。',
    '乐观更新用“快照回滚”时，两个请求并发、先发的失败，会把后发成功的修改一起抹掉。可靠的做法是：显示值 = 已确认的值 + 仍在等待的操作。',
    '撤销/重做用 { past, present, future } 保存快照。新操作清空 future；不改变数据的 action 不进历史；历史要有上限。界面状态（筛选、输入框）不进历史。',
    '一组布尔值能组合出不可能的状态。用一个状态字段加转移表，表里没有的事件直接忽略，非法转移就写不出来。',
  ],
  quiz: [
    {
      q: '看板里的卡片可以被“选中”，右侧面板显示选中卡片的详情，并能编辑标题。下面哪种 state 设计最好？',
      options: [
        'selectedCard：保存卡片对象，编辑时同时更新它和列表里的卡片',
        'selectedId：只保存 id，渲染时从 cards.byId 里查出卡片',
        '在每张卡片上加 isSelected 字段',
        '右侧面板自己 useState 一份卡片副本，保存时再写回列表',
      ],
      answer: 1,
      explain:
        '只存 id，卡片在 state 里就只有一份，编辑后详情和列表自然一致。第一项要求每次修改都同步两处，漏一处就过期。isSelected 让“只能选一张”无法由结构保证，切换选中要改两张卡片。第四项在需要“取消编辑”的草稿场景可以用，但它是有意的副本，不是默认设计。',
    },
    {
      q: '两个列表组件都调用同一个模块级的 selectByStatus(state, status)，一个传 "todo"，一个传 "done"。它用只有一格缓存的 createSelector 创建。会怎样？',
      options: [
        '正常：createSelector 会按参数分别缓存',
        '两边轮流挤掉缓存，每次调用都重新计算，返回新数组',
        '第二个组件拿到第一个组件的结果',
        '报错：选择器不能接收额外参数',
      ],
      answer: 1,
      explain:
        '缓存只记得上一次的输入。A 传 todo、B 传 done，交替调用时，每次输入都和上一次不同，所以每次都重新计算，记忆化失效。它不会返回错误结果，因为参数也是输入的一部分。修法：每个组件实例用 useMemo 创建自己的选择器，或用支持多格缓存的实现。',
    },
    {
      q: '“点赞”使用乐观更新，失败时回滚到请求前的快照。用户快速点了三次，第一个请求失败，后两个成功。最终界面显示的数字比服务器上少 2。最合适的修法是？',
      options: [
        '给按钮加防抖，500 毫秒内的连续点击只发一个请求',
        '分开记录已确认的值和待定操作，失败时只删掉那一个操作',
        '失败的请求自动重试，直到服务器返回成功为止',
        '不做乐观更新，每次等服务器返回再更新界面',
      ],
      answer: 1,
      explain:
        '问题出在回滚的粒度：快照回滚撤销的是“快照之后的一切”。待定队列只撤销失败的那一个操作。防抖只是降低了概率，网络慢时照样出错。重试不能处理真正的失败（例如没有权限）。放弃乐观更新可以，但会失去即时反馈。',
    },
    {
      q: '文档编辑器支持撤销。下面哪项不应该进入撤销历史？',
      options: ['删除一个段落', '把标题改成粗体', '切换左侧大纲面板的展开和收起', '把一段文字移到另一个位置'],
      answer: 2,
      explain:
        '撤销针对的是用户的“作品”，也就是文档数据。面板的展开状态是界面状态。如果它进入历史，用户按撤销时面板收起了，文档却没变，会以为撤销失效。设计上把界面状态放在局部 state，不要和文档数据放进同一个可撤销的 reducer。',
    },
    {
      q: '上传组件用了 isUploading、isError、isDone 三个布尔值。测试报告：上传失败后重试成功，界面同时显示“上传失败”和“上传完成”。根本的修法是？',
      options: [
        '在成功的分支里补上 setIsError(false)',
        '用一个 status 字段（idle、uploading、error、done）和转移表代替三个布尔值',
        '把三个 useState 合并成一个对象',
        '用 useEffect 监听 isDone，变为 true 时把 isError 设为 false',
      ],
      answer: 1,
      explain:
        '三个布尔值能组合出 8 种状态，合法的只有 4 种。补一行 setIsError(false) 修好了这一处，下一个分支还会漏。用一个 status 字段，“既失败又完成”在结构上就不存在。合并成对象不减少组合数。用 effect 同步会多一次渲染，并且仍然允许矛盾状态短暂出现。',
    },
  ],
  exercise: {
    task: '<p>评论区目前把接口的嵌套数据原样存进 state。请把它改造成能支撑大型应用的结构。下方界面不用修改，它会调用你导出的函数。</p><ol class="task-steps"><li><code>normalize(list)</code>：返回 <code>{ users: { byId }, comments: { byId, ids } }</code>。评论实体为 <code>{ id, text, likes, authorId }</code>，不再包含 author 对象。不要修改传入的数组。</li><li><code>commentsReducer</code>：基于规范化结构处理 <code>liked</code>、<code>userRenamed</code>、<code>commentRemoved</code>。只替换被修改的实体，其他实体和无关的部分保持原来的引用。id 不存在时返回原 state。</li><li><code>createSelector(inputs, compute)</code>：每个输入选择器都会收到全部参数。所有输入值都与上一次相同（Object.is）时，返回上一次的结果。然后用它写 <code>selectVisibleComments(state, filter)</code>：按 ids 顺序返回 <code>{ id, text, likes, authorName }</code>；filter 为 <code>\'popular\'</code> 时只保留 likes ≥ 3 的评论。</li><li><code>undoable(reducer)</code>：history 为 <code>{ past, present, future }</code>，支持 <code>undo</code> 和 <code>redo</code>。新操作清空 future；reducer 返回原 state 时不产生历史；没有可撤销或可重做的步骤时返回原 history；past 最多保留 50 步。</li></ol><p>检查程序会比较对象引用：改 c1 后 c2 必须是同一个对象；在输入框打字时，列表不能重新渲染。</p>',
    starter: `import { useReducer, useState, memo } from 'react';

// 服务器返回的嵌套数据：作者信息在每条评论里各有一份
const API_DATA = [
  { id: 'c1', text: '外壳要尽量小', likes: 4, author: { id: 'u1', name: '小林' } },
  { id: 'c2', text: '选择性水合真好用', likes: 1, author: { id: 'u2', name: '阿杰' } },
  { id: 'c3', text: 'getServerSnapshot 救了我', likes: 6, author: { id: 'u1', name: '小林' } },
  { id: 'c4', text: '规范化之后改名只改一处', likes: 0, author: { id: 'u3', name: 'Mia' } },
];

// ① 规范化：返回 { users: { byId }, comments: { byId, ids } }
function normalize(list) {
  return list; // 起始代码：原样保存嵌套数组
}

// ② reducer（起始代码基于嵌套数组）
function commentsReducer(state, action) {
  switch (action.type) {
    case 'liked':
      return state.map(c => (c.id === action.id ? { ...c, likes: c.likes + 1 } : c));
    case 'userRenamed':
      return state.map(c => (c.author.id === action.id ? { ...c, author: { ...c.author, name: action.name } } : c));
    case 'commentRemoved':
      return state.filter(c => c.id !== action.id);
    default:
      return state;
  }
}

// ③ 记忆化选择器（起始代码：每次都重新计算）
function createSelector(inputs, compute) {
  return (...args) => compute(...inputs.map(fn => fn(...args)));
}

const selectVisibleComments = createSelector(
  [(state) => state, (state, filter) => filter],
  (list, filter) => list
    .filter(c => filter !== 'popular' || c.likes >= 3)
    .map(c => ({ id: c.id, text: c.text, likes: c.likes, authorName: c.author.name })),
);

// ④ 撤销/重做（起始代码：不记录历史）
function undoable(reducer) {
  return (history, action) => ({ ...history, present: reducer(history.present, action) });
}

// —— 以下是界面，不用修改 ——
const historyReducer = undoable(commentsReducer);
const init = (list) => ({ past: [], present: normalize(list), future: [] });
let listRenders = 0;

const CommentList = memo(function CommentList({ items, dispatch }) {
  listRenders++;
  return (
    <ul>
      {items.map(c => (
        <li key={c.id} data-id={c.id}>
          <span className="text">{c.text}</span> — <span className="author">{c.authorName}</span>
          （<span className="likes">{c.likes}</span> 赞）{' '}
          <button className="like" onClick={() => dispatch({ type: 'liked', id: c.id })}>赞</button>{' '}
          <button className="remove" onClick={() => dispatch({ type: 'commentRemoved', id: c.id })}>删除</button>
        </li>
      ))}
      <li><small>列表渲染了 <span id="list-renders">{listRenders}</span> 次</small></li>
    </ul>
  );
});

function App() {
  const [history, dispatch] = useReducer(historyReducer, API_DATA, init);
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState('');
  const items = selectVisibleComments(history.present, filter);
  return (
    <div>
      <p>
        <button id="undo" disabled={!history.past || history.past.length === 0} onClick={() => dispatch({ type: 'undo' })}>撤销</button>{' '}
        <button id="redo" disabled={!history.future || history.future.length === 0} onClick={() => dispatch({ type: 'redo' })}>重做</button>{' '}
        <button id="rename" onClick={() => dispatch({ type: 'userRenamed', id: 'u1', name: '林老师' })}>把小林改名为林老师</button>{' '}
        <label><input type="checkbox" id="popular" checked={filter === 'popular'} onChange={e => setFilter(e.target.checked ? 'popular' : 'all')} /> 只看热门</label>
      </p>
      <CommentList items={items} dispatch={dispatch} />
      <input id="draft" value={draft} onChange={e => setDraft(e.target.value)} placeholder="写评论（本地草稿）" />
    </div>
  );
}`,
    solution: `import { useReducer, useState, memo } from 'react';

// 服务器返回的嵌套数据：作者信息在每条评论里各有一份
const API_DATA = [
  { id: 'c1', text: '外壳要尽量小', likes: 4, author: { id: 'u1', name: '小林' } },
  { id: 'c2', text: '选择性水合真好用', likes: 1, author: { id: 'u2', name: '阿杰' } },
  { id: 'c3', text: 'getServerSnapshot 救了我', likes: 6, author: { id: 'u1', name: '小林' } },
  { id: 'c4', text: '规范化之后改名只改一处', likes: 0, author: { id: 'u3', name: 'Mia' } },
];

// ① 规范化：返回 { users: { byId }, comments: { byId, ids } }
function normalize(list) {
  const users = { byId: {} };
  const comments = { byId: {}, ids: [] };
  for (const { author, ...rest } of list) {
    users.byId[author.id] = { id: author.id, name: author.name };
    comments.byId[rest.id] = { ...rest, authorId: author.id };
    comments.ids.push(rest.id);
  }
  return { users, comments };
}

// ② reducer：只替换从根到被修改实体的那条路径
function commentsReducer(state, action) {
  switch (action.type) {
    case 'liked': {
      const c = state.comments.byId[action.id];
      if (!c) return state;
      const byId = { ...state.comments.byId, [c.id]: { ...c, likes: c.likes + 1 } };
      return { ...state, comments: { ...state.comments, byId } };
    }
    case 'userRenamed': {
      const u = state.users.byId[action.id];
      if (!u) return state;
      const byId = { ...state.users.byId, [u.id]: { ...u, name: action.name } };
      return { ...state, users: { ...state.users, byId } };
    }
    case 'commentRemoved': {
      if (!state.comments.byId[action.id]) return state;
      const { [action.id]: removed, ...byId } = state.comments.byId;
      const ids = state.comments.ids.filter(id => id !== action.id);
      return { ...state, comments: { byId, ids } };
    }
    default:
      return state;
  }
}

// ③ 记忆化选择器
function createSelector(inputs, compute) {
  let lastValues = null;
  let lastResult;
  return (...args) => {
    const values = inputs.map(fn => fn(...args));
    if (lastValues && values.every((v, i) => Object.is(v, lastValues[i]))) return lastResult;
    lastValues = values;
    lastResult = compute(...values);
    return lastResult;
  };
}

const selectVisibleComments = createSelector(
  [(state) => state.comments, (state) => state.users, (state, filter) => filter],
  (comments, users, filter) => comments.ids
    .map(id => comments.byId[id])
    .filter(c => filter !== 'popular' || c.likes >= 3)
    .map(c => ({ id: c.id, text: c.text, likes: c.likes, authorName: users.byId[c.authorId].name })),
);

// ④ 撤销/重做
const HISTORY_LIMIT = 50;
function undoable(reducer) {
  return (history, action) => {
    const { past, present, future } = history;
    if (action.type === 'undo') {
      if (past.length === 0) return history;
      return { past: past.slice(0, -1), present: past[past.length - 1], future: [present, ...future] };
    }
    if (action.type === 'redo') {
      if (future.length === 0) return history;
      return { past: [...past, present], present: future[0], future: future.slice(1) };
    }
    const next = reducer(present, action);
    if (next === present) return history;
    return { past: [...past, present].slice(-HISTORY_LIMIT), present: next, future: [] };
  };
}

// —— 以下是界面，不用修改 ——
const historyReducer = undoable(commentsReducer);
const init = (list) => ({ past: [], present: normalize(list), future: [] });
let listRenders = 0;

const CommentList = memo(function CommentList({ items, dispatch }) {
  listRenders++;
  return (
    <ul>
      {items.map(c => (
        <li key={c.id} data-id={c.id}>
          <span className="text">{c.text}</span> — <span className="author">{c.authorName}</span>
          （<span className="likes">{c.likes}</span> 赞）{' '}
          <button className="like" onClick={() => dispatch({ type: 'liked', id: c.id })}>赞</button>{' '}
          <button className="remove" onClick={() => dispatch({ type: 'commentRemoved', id: c.id })}>删除</button>
        </li>
      ))}
      <li><small>列表渲染了 <span id="list-renders">{listRenders}</span> 次</small></li>
    </ul>
  );
});

function App() {
  const [history, dispatch] = useReducer(historyReducer, API_DATA, init);
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState('');
  const items = selectVisibleComments(history.present, filter);
  return (
    <div>
      <p>
        <button id="undo" disabled={!history.past || history.past.length === 0} onClick={() => dispatch({ type: 'undo' })}>撤销</button>{' '}
        <button id="redo" disabled={!history.future || history.future.length === 0} onClick={() => dispatch({ type: 'redo' })}>重做</button>{' '}
        <button id="rename" onClick={() => dispatch({ type: 'userRenamed', id: 'u1', name: '林老师' })}>把小林改名为林老师</button>{' '}
        <label><input type="checkbox" id="popular" checked={filter === 'popular'} onChange={e => setFilter(e.target.checked ? 'popular' : 'all')} /> 只看热门</label>
      </p>
      <CommentList items={items} dispatch={dispatch} />
      <input id="draft" value={draft} onChange={e => setDraft(e.target.value)} placeholder="写评论（本地草稿）" />
    </div>
  );
}`,
    faded: `import { useReducer, useState, memo } from 'react';

// 服务器返回的嵌套数据：作者信息在每条评论里各有一份
const API_DATA = [
  { id: 'c1', text: '外壳要尽量小', likes: 4, author: { id: 'u1', name: '小林' } },
  { id: 'c2', text: '选择性水合真好用', likes: 1, author: { id: 'u2', name: '阿杰' } },
  { id: 'c3', text: 'getServerSnapshot 救了我', likes: 6, author: { id: 'u1', name: '小林' } },
  { id: 'c4', text: '规范化之后改名只改一处', likes: 0, author: { id: 'u3', name: 'Mia' } },
];

// ① 规范化：返回 { users: { byId }, comments: { byId, ids } }
function normalize(list) {
  const users = { byId: {} };
  const comments = { byId: {}, ids: [] };
  for (const { author, ...rest } of list) {
    /* ✏️ 作者按 id 存一份；评论只存 authorId；记录顺序 */
  }
  return { users, comments };
}

// ② reducer：只替换从根到被修改实体的那条路径
function commentsReducer(state, action) {
  switch (action.type) {
    case 'liked': {
      const c = state.comments.byId[action.id];
      if (!c) return state;
      /* ✏️ 复制 byId，只换掉 c 这一项；再复制 comments 和 state，其他部分原样保留 */
    }
    case 'userRenamed': {
      const u = state.users.byId[action.id];
      if (!u) return state;
      const byId = { ...state.users.byId, [u.id]: { ...u, name: action.name } };
      return { ...state, users: { ...state.users, byId } };
    }
    case 'commentRemoved': {
      if (!state.comments.byId[action.id]) return state;
      const { [action.id]: removed, ...byId } = state.comments.byId;
      const ids = state.comments.ids.filter(id => id !== action.id);
      return { ...state, comments: { byId, ids } };
    }
    default:
      return state;
  }
}

// ③ 记忆化选择器
function createSelector(inputs, compute) {
  let lastValues = null;
  let lastResult;
  return (...args) => {
    const values = inputs.map(fn => fn(...args));
    /* ✏️ 有上一次的值，并且每个输入都 Object.is 相等：返回 lastResult */
    lastValues = values;
    lastResult = compute(...values);
    return lastResult;
  };
}

const selectVisibleComments = createSelector(
  [/* ✏️ 三个输入选择器：选出 comments、users 和 filter，不要选整个 state */],
  (comments, users, filter) => comments.ids
    .map(id => comments.byId[id])
    .filter(c => filter !== 'popular' || c.likes >= 3)
    .map(c => ({ id: c.id, text: c.text, likes: c.likes, authorName: users.byId[c.authorId].name })),
);

// ④ 撤销/重做
const HISTORY_LIMIT = 50;
function undoable(reducer) {
  return (history, action) => {
    const { past, present, future } = history;
    if (action.type === 'undo') {
      if (past.length === 0) return history;
      return { past: past.slice(0, -1), present: past[past.length - 1], future: [present, ...future] };
    }
    if (action.type === 'redo') {
      /* ✏️ 和 undo 对称：没有 future 时返回原 history */
    }
    const next = reducer(present, action);
    if (next === present) return history;
    return { past: [...past, present].slice(-HISTORY_LIMIT), present: next, future: [] };
  };
}

// —— 以下是界面，不用修改 ——
const historyReducer = undoable(commentsReducer);
const init = (list) => ({ past: [], present: normalize(list), future: [] });
let listRenders = 0;

const CommentList = memo(function CommentList({ items, dispatch }) {
  listRenders++;
  return (
    <ul>
      {items.map(c => (
        <li key={c.id} data-id={c.id}>
          <span className="text">{c.text}</span> — <span className="author">{c.authorName}</span>
          （<span className="likes">{c.likes}</span> 赞）{' '}
          <button className="like" onClick={() => dispatch({ type: 'liked', id: c.id })}>赞</button>{' '}
          <button className="remove" onClick={() => dispatch({ type: 'commentRemoved', id: c.id })}>删除</button>
        </li>
      ))}
      <li><small>列表渲染了 <span id="list-renders">{listRenders}</span> 次</small></li>
    </ul>
  );
});

function App() {
  const [history, dispatch] = useReducer(historyReducer, API_DATA, init);
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState('');
  const items = selectVisibleComments(history.present, filter);
  return (
    <div>
      <p>
        <button id="undo" disabled={!history.past || history.past.length === 0} onClick={() => dispatch({ type: 'undo' })}>撤销</button>{' '}
        <button id="redo" disabled={!history.future || history.future.length === 0} onClick={() => dispatch({ type: 'redo' })}>重做</button>{' '}
        <button id="rename" onClick={() => dispatch({ type: 'userRenamed', id: 'u1', name: '林老师' })}>把小林改名为林老师</button>{' '}
        <label><input type="checkbox" id="popular" checked={filter === 'popular'} onChange={e => setFilter(e.target.checked ? 'popular' : 'all')} /> 只看热门</label>
      </p>
      <CommentList items={items} dispatch={dispatch} />
      <input id="draft" value={draft} onChange={e => setDraft(e.target.value)} placeholder="写评论（本地草稿）" />
    </div>
  );
}`,
    hint: '先定结构，再写函数。reducer 每一层都只复制“通往被修改实体”的那个对象。选择器失效时，问自己：输入选择器选出的值，在无关的更新之后还是同一个引用吗？undo 和 redo 是对称的两次“搬运”，普通 action 要先看 reducer 有没有真的改变 state。',
    exports: ['normalize', 'commentsReducer', 'createSelector', 'selectVisibleComments', 'undoable'],
    test: async t => {
      const E = t.exports;
      ['normalize', 'commentsReducer', 'createSelector', 'selectVisibleComments', 'undoable'].forEach(n =>
        t.assert(typeof E[n] === 'function', '没有找到 ' + n + '。请保留这个名字'),
      );
      const api = () => [
        { id: 'c1', text: '外壳要尽量小', likes: 4, author: { id: 'u1', name: '小林' } },
        { id: 'c2', text: '选择性水合真好用', likes: 1, author: { id: 'u2', name: '阿杰' } },
        { id: 'c3', text: 'getServerSnapshot 救了我', likes: 6, author: { id: 'u1', name: '小林' } },
        { id: 'c4', text: '规范化之后改名只改一处', likes: 0, author: { id: 'u3', name: 'Mia' } },
      ];
      const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      const keys = o =>
        Object.keys(o || {})
          .sort()
          .join(',');

      // ① normalize
      const data = api(),
        snap = JSON.stringify(data);
      const s0 = E.normalize(data);
      t.assert(JSON.stringify(data) === snap, 'normalize 修改了传入的数组。请创建新对象，不要改动接口数据');
      t.assert(
        s0 && s0.users && s0.users.byId && s0.comments && s0.comments.byId && Array.isArray(s0.comments.ids),
        'normalize 应返回 { users: { byId }, comments: { byId, ids } }（步骤 1）',
      );
      t.assert(same(s0.comments.ids, ['c1', 'c2', 'c3', 'c4']), 'comments.ids 应按接口顺序为 c1、c2、c3、c4，实际是 ' + JSON.stringify(s0.comments.ids));
      t.assert(keys(s0.users.byId) === 'u1,u2,u3', 'users.byId 应只有 u1、u2、u3 三个作者，每个作者只存一份。实际的键：' + keys(s0.users.byId));
      t.assert(same(s0.users.byId.u1, { id: 'u1', name: '小林' }), 'users.byId.u1 应为 { id: "u1", name: "小林" }');
      const c1 = s0.comments.byId.c1 || {};
      t.assert(!('author' in c1) && !('authorName' in c1), '评论实体里不应再有 author 或 authorName。只存 authorId，作者名只在 users 里存一份');
      t.assert(
        c1.authorId === 'u1' && c1.likes === 4 && c1.text === '外壳要尽量小' && c1.id === 'c1',
        'comments.byId.c1 应为 { id, text, likes, authorId: "u1" }',
      );

      // ② reducer
      const R = E.commentsReducer;
      const s1 = R(s0, { type: 'liked', id: 'c1' });
      t.assert(s0.comments.byId.c1.likes === 4, 'liked 直接修改了旧 state 里的评论对象。要创建新对象：{ ...c, likes: c.likes + 1 }');
      t.assert(s1 !== s0 && s1.comments.byId.c1.likes === 5, '给 c1 点赞后，likes 应从 4 变为 5，并返回新的 state');
      t.assert(
        s1.comments.byId.c2 === s0.comments.byId.c2,
        '只给 c1 点赞，c2 却变成了新对象。只替换被修改的实体，其他实体保持原来的引用，memo 组件才能跳过它们',
      );
      t.assert(s1.users === s0.users, '点赞不涉及作者，users 应保持同一个引用');
      t.assert(s1.comments.ids === s0.comments.ids, '点赞不改变顺序，comments.ids 应保持同一个引用');
      const s2 = R(s1, { type: 'userRenamed', id: 'u1', name: '林老师' });
      t.assert(s2.users.byId.u1.name === '林老师' && s1.users.byId.u1.name === '小林', 'userRenamed 后 u1 应改名为“林老师”，旧 state 不变');
      t.assert(s2.users.byId.u2 === s1.users.byId.u2, '只改 u1，u2 应保持同一个引用');
      t.assert(s2.comments === s1.comments, '改名时 comments 也变了。规范化后作者名只存在 users 里，改名不需要碰任何评论');
      const s3 = R(s2, { type: 'commentRemoved', id: 'c2' });
      t.assert(same(s3.comments.ids, ['c1', 'c3', 'c4']) && !('c2' in s3.comments.byId), '删除 c2 后，ids 和 byId 里都不应再有 c2');
      t.assert(s2.comments.ids.length === 4 && 'c2' in s2.comments.byId, '删除时修改了旧 state 的 ids 或 byId。请创建新的数组和对象');
      t.assert(s3.comments.byId.c1 === s2.comments.byId.c1 && s3.users === s2.users, '删除 c2 时，其他评论和 users 应保持原来的引用');
      t.assert(R(s3, { type: 'liked', id: 'nope' }) === s3, '给不存在的评论点赞时，应返回原来的 state（同一个引用）');
      t.assert(R(s3, { type: 'commentRemoved', id: 'nope' }) === s3, '删除不存在的评论时，应返回原来的 state（同一个引用）');
      t.assert(R(s3, { type: 'userRenamed', id: 'nope', name: 'x' }) === s3, '给不存在的作者改名时，应返回原来的 state（同一个引用）');
      t.assert(R(s3, { type: 'unknown' }) === s3, '未知的 action 应返回原来的 state');

      // ③ createSelector
      let calls = 0;
      const sel = E.createSelector([s => s.a, (s, k) => k], (a, k) => {
        calls++;
        return { v: a * k };
      });
      const x = { a: 2 };
      const r1 = sel(x, 3);
      t.assert(r1 && r1.v === 6, 'createSelector 的结果不对：输入选择器要收到全部参数，结果函数收到它们选出的值');
      t.assert(sel(x, 3) === r1 && calls === 1, '输入没变时，createSelector 应返回上一次的结果，不再调用结果函数');
      t.assert(sel({ a: 2 }, 3) === r1 && calls === 1, '传入一个新对象，但输入选择器选出的值都没变（a 仍是 2）。应比较输入选择器选出的值，而不是参数本身');
      const r4 = sel(x, 4);
      t.assert(r4.v === 8 && calls === 2, '第二个参数从 3 变为 4，应重新计算。参数也是输入的一部分');
      t.assert(sel({ a: 5 }, 4).v === 20 && calls === 3, 'a 从 2 变为 5，应重新计算');

      // selectVisibleComments
      const V = E.selectVisibleComments;
      const v1 = V(s1, 'all');
      t.assert(Array.isArray(v1) && v1.length === 4, 'selectVisibleComments(state, "all") 应返回 4 条评论');
      t.assert(
        same(v1[0], { id: 'c1', text: '外壳要尽量小', likes: 5, authorName: '小林' }),
        '每一项应为 { id, text, likes, authorName }，作者名从 users 里查。c1 实际是 ' + JSON.stringify(v1[0]),
      );
      t.assert(V(s1, 'all') === v1, '同一个 state 和 filter 调用两次，应返回同一个数组');
      t.assert(
        V({ ...s1 }, 'all') === v1,
        '外层 state 换成了新对象，但 comments 和 users 都没变，却重新计算了。输入选择器应分别选出 state.comments 和 state.users，不要选整个 state',
      );
      const v2 = V(s2, 'all');
      t.assert(
        v2 !== v1 && v2[0].authorName === '林老师' && v2[2].authorName === '林老师',
        '改名后，c1 和 c3 的 authorName 都应是“林老师”。输入选择器要包含 users',
      );
      const pop = V(s2, 'popular');
      t.assert(
        same(
          pop.map(c => c.id),
          ['c1', 'c3'],
        ),
        'filter 为 popular 时只保留 likes ≥ 3 的评论，应为 c1、c3，实际是 ' + JSON.stringify(pop.map(c => c.id)),
      );
      t.assert(V(s2, 'popular') === pop, 'filter 没变时，应返回同一个数组');

      // ④ undoable
      const U = E.undoable(R);
      const h0 = { past: [], present: s0, future: [] };
      const h1 = U(h0, { type: 'liked', id: 'c1' });
      t.assert(
        h1 && Array.isArray(h1.past) && h1.past.length === 1 && h1.present.comments.byId.c1.likes === 5 && Array.isArray(h1.future) && h1.future.length === 0,
        '普通 action 之后：past 应多 1 步，present 是新 state，future 为空',
      );
      const h2 = U(h1, { type: 'userRenamed', id: 'u1', name: '林老师' });
      const h3 = U(h2, { type: 'undo' });
      t.assert(
        h3.present.users.byId.u1.name === '小林' && h3.present.comments.byId.c1.likes === 5 && h3.future.length === 1 && h3.past.length === 1,
        '撤销一步后，应回到改名之前（小林、c1 有 5 赞），future 里有 1 步',
      );
      const h4 = U(h3, { type: 'undo' });
      t.assert(
        h4.present.comments.byId.c1.likes === 4 && h4.past.length === 0 && h4.future.length === 2,
        '再撤销一步，c1 应回到 4 赞，past 为空，future 有 2 步',
      );
      t.assert(U(h4, { type: 'undo' }) === h4, '没有可撤销的步骤时，应返回原来的 history');
      const h5 = U(h4, { type: 'redo' });
      t.assert(h5.present.comments.byId.c1.likes === 5 && h5.future.length === 1, '重做一步后，c1 应为 5 赞');
      t.assert(U(h5, { type: 'redo' }).present.users.byId.u1.name === '林老师', '再重做一步，u1 应改回“林老师”');
      const h6 = U(h4, { type: 'liked', id: 'c2' });
      t.assert(h6.future.length === 0 && h6.past.length === 1, '撤销后做了新操作，future 应被清空。否则“重做”会跳到一条已经作废的历史上');
      t.assert(U(h6, { type: 'redo' }) === h6, '没有可重做的步骤时，应返回原来的 history');
      t.assert(U(h6, { type: 'liked', id: 'nope' }) === h6, 'reducer 返回原 state 时（例如给不存在的评论点赞），不应产生历史记录，应返回原来的 history');
      let hh = { past: [], present: s0, future: [] };
      for (let i = 0; i < 60; i++) hh = U(hh, { type: 'liked', id: 'c4' });
      t.assert(
        hh.past.length === 50 && hh.present.comments.byId.c4.likes === 60,
        '连续 60 次操作后，past 应只保留最近 50 步，实际是 ' + hh.past.length + ' 步',
      );
      for (let i = 0; i < 50; i++) hh = U(hh, { type: 'undo' });
      t.assert(hh.present.comments.byId.c4.likes === 10, '撤销 50 步后，c4 应为 10 赞（最早的 10 步已超出上限），实际是 ' + hh.present.comments.byId.c4.likes);

      // 界面
      const row = id => t.q('li[data-id="' + id + '"]');
      const author = id => {
        const r = row(id);
        return r ? r.querySelector('.author').textContent.trim() : '';
      };
      const likes = id => {
        const r = row(id);
        return r ? r.querySelector('.likes').textContent.trim() : '';
      };
      t.assert(t.qa('li[data-id]').length === 4 && author('c1') === '小林', '界面应显示 4 条评论，c1 的作者是“小林”');
      await t.click('#rename');
      t.assert(author('c1') === '林老师' && author('c3') === '林老师', '点“改名”后，c1 和 c3 都应显示“林老师”');
      t.assert(!t.q('#undo').disabled, '改名后，“撤销”按钮应可用');
      await t.click('#undo');
      t.assert(author('c1') === '小林' && author('c3') === '小林', '点“撤销”后，作者应变回“小林”');
      await t.click('#redo');
      t.assert(author('c3') === '林老师', '点“重做”后，作者应再次变为“林老师”');
      await t.click(row('c2').querySelector('.like'));
      t.assert(likes('c2') === '2' && t.q('#redo').disabled, '给 c2 点赞后应为 2 赞，“重做”按钮应不可用');
      const before = t.text('#list-renders');
      await t.type('#draft', '你');
      await t.type('#draft', '你好');
      t.assert(
        t.text('#list-renders') === before,
        '在输入框打字时，列表重新渲染了（' +
          before +
          ' → ' +
          t.text('#list-renders') +
          ' 次）。草稿和评论数据无关：输入没变时，selectVisibleComments 应返回同一个数组',
      );
      await t.click('#popular');
      t.assert(t.qa('li[data-id]').length === 2 && row('c1') && row('c3'), '勾选“只看热门”后，应只显示 c1 和 c3');
    },
  },
  checkOnly: [
    {
      q: `Row 用 memo 包裹，props 是 comment 对象。点“赞”之后，Row 显示的赞数会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function reducer(state, action) {
  if (action.type === 'liked') {
    const c = state.byId[action.id];
    c.likes += 1;
    return { ...state, byId: { ...state.byId } };
  }
  return state;
}
// 渲染：ids.map(id =&gt; &lt;Row key={id} comment={byId[id]} /&gt;)</code></pre></div>`,
      options: [
        '正常加 1：外层 state 和 byId 都是新对象',
        '不变：comment 还是同一个对象，memo 跳过了 Row',
        '加 2：严格模式下 reducer 执行两次',
        '报错：不能修改 state',
      ],
      answer: 1,
      explain:
        '外层和 byId 都复制了，但 c 是原对象，被直接修改。Row 收到的 comment 引用没变，memo 认为 props 没变，跳过渲染。所以界面不更新。更隐蔽的是：撤销历史里的旧快照也指向这个对象，它也被改了。应写成 <code>[c.id]: { ...c, likes: c.likes + 1 }</code>。',
    },
    {
      q: `这个选择器在每次 store 更新后都会被调用。它的记忆化效果如何？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const selectTodos = createSelector(
  [s =&gt; s.todos.ids.map(id =&gt; s.todos.byId[id])],
  (todos) =&gt; todos.filter(t =&gt; !t.done),
);</code></pre></div>`,
      options: ['很好：todos 没变就不重新计算', '每次都重新计算：输入选择器每次返回新数组', '只计算一次，之后永远返回旧结果', '报错：输入选择器不能用 map'],
      answer: 1,
      explain:
        '输入选择器里的 map 每次都创建新数组，Object.is 比较永远不相等，记忆化从不命中。输入选择器只做取值：选出 <code>s.todos.ids</code> 和 <code>s.todos.byId</code>，把 map 和 filter 都放进结果函数。',
    },
    {
      q: `从 { past: [A], present: B, future: [] } 开始，依次 dispatch：undo、liked（得到 C）、redo。最后的 present 是什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function undoable(reducer) {
  return (h, action) =&gt; {
    if (action.type === 'undo')
      return { past: h.past.slice(0, -1), present: h.past.at(-1), future: [h.present, ...h.future] };
    if (action.type === 'redo')
      return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
    return { ...h, past: [...h.past, h.present], present: reducer(h.present, action) };
  };
}</code></pre></div>`,
      options: ['C：新操作之后没有可重做的步骤', 'B：redo 回到了作废的旧分支', 'A：redo 回到了第一个快照', 'undefined：future 已经空了'],
      answer: 1,
      explain:
        '普通 action 用了 <code>...h</code>，保留了旧的 future：[B]。所以 redo 把 present 换成 B，刚做的修改 C 被丢到 past 里。正确做法是普通 action 把 future 设为空数组。另外，这段代码在 past 为空时 undo 会得到 undefined，也需要处理。',
    },
    {
      q: `依次发送事件 SUBMIT、VALID、SUBMIT、DECLINED、SUBMIT。最终状态是什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const machine = {
  idle:       { SUBMIT: 'validating' },
  validating: { VALID: 'paying', INVALID: 'idle' },
  paying:     { PAID: 'done', DECLINED: 'failed' },
  failed:     { RETRY: 'paying' },
  done:       {},
};
const send = (state, type) =&gt; machine[state][type] ?? state;</code></pre></div>`,
      options: ['idle', 'validating', 'failed', 'paying'],
      answer: 2,
      explain:
        'idle → validating → paying。在 paying 状态再发 SUBMIT，表里没有，状态不变（这就是“不会重复扣款”）。DECLINED → failed。failed 只响应 RETRY，第三次 SUBMIT 被忽略，最终是 failed。选 validating 的人以为 SUBMIT 在任何状态都会重新开始。',
    },
  ],
  plays: {
    '存对象还是存 id': {
      note: 'A 存的是点击“查看”那一刻的对象。点赞时，列表里的 c1 被换成新对象，A 手里的旧对象不会变，所以详情停在 4 赞。B 只存 id，每次渲染都从最新的列表里查，永远是最新值。规则：一个实体在 state 里只存一份，其他地方只存它的 id。',
      predict: {
        q: '在 A 里先点 c1 的“查看”，再点 c1 的“赞”两次。A 的详情显示几个赞？',
        options: ['6 赞', '4 赞', '5 赞', '未选择'],
        answer: 1,
        explain:
          'A 的 selected 是点“查看”时那个对象的引用。点赞按不可变的方式生成了新对象，旧对象没有变，所以详情还是 4 赞，而列表显示 6 赞。最迷惑的是“6 赞”：以为 selected 和列表里的是“同一条评论”。不可变更新之后，它们已经是两个对象。',
      },
      pkey: 'state-at-scale|存对象还是存 id',
    },
    '普通函数 vs 记忆化选择器': {
      note: '在输入框里打字：App 每次都重新渲染。普通函数每次都算，返回新数组，下面的 memo 列表跟着重新渲染。记忆化选择器发现 byId 和 ids 都没变，返回同一个数组，列表跳过渲染。点两次“给 c2 点赞”：byId 变了，两边都重新计算，c2 进入热门。',
    },
    两个请求并发时的回滚: {
      note: '第 1 个请求保存的快照是 0。它失败时把界面恢复成 0，可是第 2 个赞已经成功了。界面显示 0，服务器上是 1。B 不保存快照：它记录“已确认的值”和“还在等待的操作”，显示值每次重新算。失败的操作从队列里删掉，成功的操作并入已确认值，所以最后是 1。',
      predict: {
        q: '点 A 的“连点两次赞”，等 2 秒。A 最后显示几个赞？',
        options: ['1', '0', '2', '-1'],
        answer: 1,
        explain:
          '第 1 个请求在 0 赞时保存了快照。1.5 秒后它失败，把界面恢复成 0。这时第 2 个赞早已成功，它的结果被一起抹掉了。最迷惑的是“1”：直觉上“只有一个失败”，应该只撤掉一个。但快照回滚撤销的是“快照之后的一切”，不是“这一个操作”。',
      },
      pkey: 'state-at-scale|两个请求并发时的回滚',
    },
  },
} satisfies Lesson;
