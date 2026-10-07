import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/use-reducer.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'use-reducer',
  stage: 1,
  title: 'useReducer：集中管理复杂状态',
  mins: 17,
  summary: '当状态更新逻辑变复杂时，把它们集中到一个 reducer 函数里。',
  goals: [
    '能说出 action、reducer、dispatch 各自负责什么',
    '能把分散在多个事件处理函数里的 state 更新，改写成一个 reducer',
    '能写出纯的 reducer：返回新对象，不修改旧 state，不发请求',
    '能根据场景在 useState 和 useReducer 之间做选择',
  ],
  keyPoints: [
    'reducer 把所有“state 怎么变”的逻辑集中到一个纯函数：<code>(state, action) =&gt; 新 state</code>。',
    "组件只调用 <code>dispatch({ type: 'added', … })</code>，描述“发生了什么”。React 调用 reducer 算出新 state。",
    'reducer 必须纯：返回新对象，不修改旧 state，不发请求，不用随机数或 Date.now()。需要这些值时，先算好再放进 action。',
    '简单的独立值用 useState；多个相关的值一起变、更新种类多时，用 useReducer。',
  ],
  quiz: [
    {
      q: '改用 useReducer 后，点击“删除”按钮时，组件应该怎么请求更新？',
      options: [
        "调用 dispatch({ type: 'deleted', id })",
        '直接调用 todosReducer(todos, action)',
        '用 todos.splice 删掉那一项',
        '再声明一个 set 函数，传入新数组',
      ],
      answer: 0,
      explain:
        '组件只派发描述“发生了什么”的 action，由 React 调用 reducer 算出新 state。最迷惑的是第二项：自己调用 reducer 只会得到一个返回值，React 不知道，界面不会更新。',
    },
    {
      q: '下列哪项不应该出现在 reducer 中？',
      options: ['用 switch 判断 action.type', '用 Date.now() 给新待办生成 id', '返回一个新数组', '遇到未知的 action 时抛出错误'],
      answer: 1,
      explain:
        'reducer 必须是纯函数：同样的输入，同样的输出。Date.now() 每次都不同，所以要在 dispatch 之前生成，再放进 action。发请求也一样，放在事件处理函数里。最迷惑的是最后一项：抛出错误不改变任何外部的东西，它是纯的，还能帮你尽早发现拼错的 action。',
    },
    {
      q: "reducer 里写 <code>case 'increment': state.count++; return state;</code>。点“加”之后界面会怎样？",
      options: ['不变，因为返回的还是同一个对象', '正常加 1', '加 2，因为改了两次', '报错：reducer 收到的 state 是只读对象，不能修改'],
      answer: 0,
      explain:
        'React 用 Object.is 比较新旧 state。返回同一个对象，就判定“没变”，跳过渲染。最迷惑的是“正常加 1”：值确实改了，但 React 不知道。要返回新对象：return { count: state.count + 1 }。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>在 reducer 中用 <code>switch (action.type)</code> 区分 action。</li><li><code>increment</code>：count 加 1。</li><li><code>decrement</code>：count 减 1。</li><li><code>reset</code>：count 变为 0。</li><li>每个分支都返回一个新对象。按钮已经写好。</li></ol>',
    starter: `import { useReducer } from 'react';

function reducer(state, action) {
  // 在这里实现
  return state;
}

function App() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <div>
      <p id="count">{state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>加</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>减</button>
      <button onClick={() => dispatch({ type: 'reset' })}>重置</button>
    </div>
  );
}`,
    solution: `import { useReducer } from 'react';

function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'decrement': return { count: state.count - 1 };
    case 'reset': return { count: 0 };
    default: return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <div>
      <p id="count">{state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>加</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>减</button>
      <button onClick={() => dispatch({ type: 'reset' })}>重置</button>
    </div>
  );
}`,
    hint: '用 <code>switch (action.type)</code>，每个分支返回一个新对象，例如 <code>return { count: state.count + 1 }</code>。',
    exports: ['reducer'],
    faded: `import { useReducer } from 'react';

function reducer(state, action) {
  switch (action.type) {
    case 'increment': /* ✏️ 返回一个新对象：count 加 1 */
    case 'decrement': /* ✏️ 返回一个新对象：count 减 1 */
    case 'reset': /* ✏️ 返回一个新对象：count 为 0 */
    default: return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <div>
      <p id="count">{state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>加</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>减</button>
      <button onClick={() => dispatch({ type: 'reset' })}>重置</button>
    </div>
  );
}`,
    test: async t => {
      const c = () => t.text('#count');
      const add = t.byText('button', '加'),
        sub = t.byText('button', '减'),
        rst = t.byText('button', '重置');
      await t.click(add);
      await t.click(add);
      await t.click(add);
      t.assert(c() === '3', `加 3 次后应为 3，实际是 ${c()}`);
      await t.click(sub);
      t.assert(c() === '2', '减 1 次后应为 2');
      await t.click(rst);
      t.assert(c() === '0', '重置后应为 0');
      const r = t.exports.reducer;
      t.assert(typeof r === 'function', '没有找到 reducer');
      for (const type of ['increment', 'decrement', 'reset']) {
        const s0 = { count: 1 };
        const s1 = r(s0, { type });
        t.assert(s1 && s1 !== s0 && s0.count === 1, `reducer 修改了原来的 state（${type}）。请返回新对象：return { count: state.count + 1 }`);
      }
      t.assert(r({ count: 1 }, { type: 'increment' }).count === 2, 'increment 应返回 count 加 1 的新对象');
    },
  },
  checkOnly: [
    {
      q: `点击按钮执行 <code>dispatch({ type: 'add', item: 'b' })</code>。列表会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function reducer(state, action) {
  switch (action.type) {
    case 'add':
      state.items.push(action.item);
      return state;
  }
}</code></pre></div>`,
      options: ['正常显示新的一项', '不更新：reducer 返回了同一个对象，React 认为 state 没变', '报错：reducer 不能修改数组', '新的一项显示两次'],
      answer: 1,
      explain:
        'reducer 修改了原对象，然后把<b>同一个对象</b>返回。React 用 Object.is 比较新旧 state，发现相同，就跳过这次更新。界面不变。正确写法是返回新对象：<code>return { ...state, items: [...state.items, action.item] }</code>。',
    },
    {
      q: `某处执行了 <code>dispatch({ type: 'reset' })</code>。会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function reducer(state, action) {
  switch (action.type) {
    case 'inc':
      return { count: state.count + 1 };
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0 });
// …
&lt;p&gt;{state.count}&lt;/p&gt;</code></pre></div>`,
      options: ['state 变成 undefined，渲染时报错', 'React 报错：未知的 action type', 'count 变回 0', 'React 忽略不认识的 action，state 不变'],
      answer: 0,
      explain:
        'switch 没有匹配的分支，函数执行到末尾，返回 undefined。React 把返回值当作新的 state，不会替你“忽略”。下一次渲染读 <code>state.count</code> 时抛出 TypeError。所以 reducer 要有 <code>default</code> 分支：返回原 state，或者抛出一个清楚的错误。“React 报错：未知的 action type”不对：React 不知道你有哪些 type，报的是读取 undefined 属性的错误。',
    },
  ],
  plays: {
    '待办清单 reducer': {
      note: '控制台打印的是添加之前的长度。dispatch 和 set 函数一样，只是请求 React 用新的 state 重新渲染。这次渲染里的 todos 是一个快照，不会在 dispatch 之后立刻改变。',
      predict: {
        q: '在输入框里输入“写作业”，点“添加”。控制台打印的 todos.length 是几？',
        options: ['3', '2', '1', 'undefined'],
        answer: 1,
        explain:
          'dispatch 和 set 函数一样，只是请求 React 用新的 state 重新渲染。这次渲染里的 todos 还是添加前的 2 项。最迷惑的是 3：列表下一次渲染时才会有 3 项。',
      },
      pkey: 'use-reducer|待办清单 reducer',
    },
  },
} satisfies Lesson;
