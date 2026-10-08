import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/use-reducer.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'use-reducer',
  stage: 1,
  title: 'useReducer：集中管理复杂状态',
  mins: 24,
  summary: '当状态更新逻辑变复杂时，把它们集中到一个 reducer 函数里。',
  goals: [
    '能说出 action、reducer、dispatch 各自负责什么',
    '能按五条原则检查 state 的结构，并把分散在多个事件处理函数里的 state 更新改写成一个 reducer',
    '能写出纯的 reducer：返回新对象，不修改旧 state，不发请求；并能解释严格模式为什么把它调用两次',
    '能根据场景在 useState 和 useReducer 之间做选择',
  ],
  keyPoints: [
    'state 的结构有五条原则：合并相关的、避免矛盾的、避免冗余的、避免重复的、避免深嵌套的。共同点是同一个事实只存一处。',
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
    {
      q: "应用包在 <code>&lt;StrictMode&gt;</code> 里，在开发环境运行。reducer 写成 <code>case 'increment': state.count += 1; return { ...state };</code>。点一次“加”，count 增加多少？",
      options: ['1', '2', '0：返回的是新对象，但 React 认为没变', '报错：reducer 不能修改参数'],
      answer: 1,
      explain:
        '严格模式会把 reducer 调用两次。两次拿到的是同一个旧 state 对象，每次都在它上面加 1，所以一次点击加了 2。纯写法 <code>return { count: state.count + 1 }</code> 调用几次结果都一样。最迷惑的是“报错”：React 不会冻结 state，修改它的错误要靠严格模式的重复调用才暴露。',
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
      const r = t.exports.reducer;
      t.assert(typeof r === 'function', '没有找到 reducer');
      for (const type of ['increment', 'decrement', 'reset']) {
        const s0 = { count: 1 };
        r(s0, { type });
        t.assert(
          s0.count === 1,
          `reducer 修改了原来的 state（${type}）。请返回新对象：return { count: state.count + 1 }。返回同一个对象时 React 会认为没变，界面不更新`,
        );
      }
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
      for (const type of ['increment', 'decrement', 'reset']) {
        const s0 = { count: 1 };
        t.assert(r(s0, { type }) !== s0, `${type} 应返回新对象，不要返回原来的 state`);
      }
      t.assert(r({ count: 1 }, { type: 'increment' }).count === 2, 'increment 应返回 count 加 1 的新对象');
    },
  },
  drillMins: 15,
  drills: [
    {
      title: '两个 useState 改写成一个 reducer',
      task: '<ol class="task-steps"><li>现在用两个 <code>useState</code> 管理 <code>count</code> 和 <code>step</code>。它们总是一起变化，适合合成一个对象 <code>{ count, step }</code>。</li><li>实现 <code>reducer</code>，处理四种 action：<code>increment</code>（count 加上 step）、<code>decrement</code>（count 减去 step）、<code>setStep</code>（带载荷，形如 <code>{ type: \'setStep\', step: 5 }</code>，只改 step）、<code>reset</code>（回到初始状态 <code>{ count: 0, step: 1 }</code>）。</li><li>每个分支返回新对象，没改的字段要保留。遇到不认识的 action，不要返回 <code>undefined</code>。</li><li>在 <code>App</code> 里用一个 <code>useReducer</code> 代替两个 <code>useState</code>，按钮改为派发对应的 action。</li></ol>',
      starter: `import { useState } from 'react';

function reducer(state, action) {
  // 在这里实现
  return state;
}

function App() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  return (
    <div>
      <p>计数：<b id="count">{count}</b>，步长：<b id="step">{step}</b></p>
      <button onClick={() => setCount(count + step)}>加</button>
      <button onClick={() => setCount(count - step)}>减</button>
      <button onClick={() => setStep(1)}>步长 1</button>
      <button onClick={() => setStep(5)}>步长 5</button>
      <button onClick={() => { setCount(0); setStep(1); }}>重置</button>
    </div>
  );
}`,
      solution: `import { useReducer } from 'react';

const initialState = { count: 0, step: 1 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { ...state, count: state.count + state.step };
    case 'decrement': return { ...state, count: state.count - state.step };
    case 'setStep': return { ...state, step: action.step };
    case 'reset': return initialState;
    default: throw new Error('未知的 action: ' + action.type);
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <p>计数：<b id="count">{state.count}</b>，步长：<b id="step">{state.step}</b></p>
      <button onClick={() => dispatch({ type: 'increment' })}>加</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>减</button>
      <button onClick={() => dispatch({ type: 'setStep', step: 1 })}>步长 1</button>
      <button onClick={() => dispatch({ type: 'setStep', step: 5 })}>步长 5</button>
      <button onClick={() => dispatch({ type: 'reset' })}>重置</button>
    </div>
  );
}`,
      hint: '用展开语法保留没改的字段：<code>{ ...state, count: state.count + state.step }</code>。<code>setStep</code> 的新步长在 <code>action.step</code> 里。<code>reset</code> 要同时把两个字段放回初始值。',
      exports: ['reducer'],
      test: async t => {
        const r = t.exports.reducer;
        t.assert(typeof r === 'function', '没有找到 reducer');
        const run = (s, a) => {
          const snap = JSON.stringify(s);
          const out = r(s, a);
          t.assert(JSON.stringify(s) === snap, 'reducer 修改了原来的 state（' + a.type + '）。请返回新对象，不要改参数里的 state。');
          return out;
        };
        const is = (out, c, s) => out && out.count === c && out.step === s;
        const show = o => JSON.stringify(o);
        let o = run({ count: 5, step: 2 }, { type: 'increment' });
        t.assert(is(o, 7, 2), 'increment 应让 count 加上 step：{ count: 5, step: 2 } 应得到 { count: 7, step: 2 }，实际是 ' + show(o) + '。');
        o = run({ count: 5, step: 2 }, { type: 'decrement' });
        t.assert(is(o, 3, 2), 'decrement 应让 count 减去 step：{ count: 5, step: 2 } 应得到 { count: 3, step: 2 }，实际是 ' + show(o) + '。');
        o = run({ count: 5, step: 2 }, { type: 'setStep', step: 3 });
        t.assert(
          is(o, 5, 3),
          "setStep 只改 step，count 要保留：{ count: 5, step: 2 } 加 { type: 'setStep', step: 3 } 应得到 { count: 5, step: 3 }，实际是 " + show(o) + '。',
        );
        o = run({ count: 9, step: 5 }, { type: 'reset' });
        t.assert(is(o, 0, 1), 'reset 应回到初始状态 { count: 0, step: 1 }（两个字段都要回去），实际是 ' + show(o) + '。');
        const s0 = { count: 1, step: 1 };
        for (const type of ['increment', 'decrement', 'setStep', 'reset']) {
          t.assert(r(s0, { type, step: 2 }) !== s0, type + ' 应返回新对象，不要返回原来的 state。');
        }
        let unknown: any;
        try {
          unknown = r(s0, { type: '__unknown__' });
        } catch {
          unknown = s0; // 抛出错误也可以
        }
        t.assert(unknown !== undefined, '遇到不认识的 action 时返回了 undefined，state 会变成 undefined。请加 default 分支：返回原 state，或抛出错误。');
        // 界面：count、step 同时受控
        const c = () => t.text('#count');
        const s = () => t.text('#step');
        const btn = name => t.byText('button', name);
        t.assert(btn('加') && btn('减') && btn('步长 1') && btn('步长 5') && btn('重置'), '请保留“加”“减”“步长 1”“步长 5”“重置”五个按钮。');
        t.assert(c() === '0' && s() === '1', '初始应是计数 0、步长 1，实际是 ' + c() + '、' + s() + '。');
        await t.click(btn('加'));
        t.assert(c() === '1', '步长 1 时点一次“加”，计数应为 1，实际是 ' + c() + '。');
        await t.click(btn('步长 5'));
        await t.click(btn('加'));
        t.assert(c() === '6' && s() === '5', '步长改为 5 后点“加”，计数应从 1 变成 6，实际是 ' + c() + '（步长 ' + s() + '）。');
        await t.click(btn('减'));
        t.assert(c() === '1', '点“减”应减去步长 5，计数应回到 1，实际是 ' + c() + '。');
        await t.click(btn('重置'));
        t.assert(c() === '0' && s() === '1', '点“重置”后计数应为 0、步长应为 1，实际是 ' + c() + '、' + s() + '。');
        t.assert(/useReducer\(\s*reducer\b/.test(t.source), 'App 里请用 useReducer(reducer, …) 代替两个 useState，让界面真的由 reducer 驱动。');
      },
    },
    {
      title: '修复购物车 reducer 的三处问题',
      task: '<ol class="task-steps"><li>这是一个购物车的 reducer，列表用 <code>[{ id, name, qty }]</code> 表示。点页面上的按钮，列表不更新，或者出现重复的行。</li><li>需求：<code>added</code>（带 <code>id</code>、<code>name</code>）在购物车里没有这件商品时追加一行 <code>qty: 1</code>，已有时把它的 qty 加 1；<code>removed</code>（带 <code>id</code>）删掉那一行；<code>changedQty</code>（带 <code>id</code>、<code>qty</code>）把数量改成 qty，qty 小于等于 0 时删掉那一行。</li><li>找出 reducer 里的问题并修复：不能修改原来的数组和里面的对象，要覆盖全部需求，遇到不认识的 action 不要返回 <code>undefined</code>。</li><li>按钮和列表已经写好，只改 <code>reducer</code>。</li></ol>',
      starter: `import { useReducer } from 'react';

function reducer(items, action) {
  switch (action.type) {
    case 'added':
      items.push({ id: action.id, name: action.name, qty: 1 });
      return items;
    case 'removed':
      return items.filter(i => i.id !== action.id);
    case 'changedQty': {
      const item = items.find(i => i.id === action.id);
      item.qty = action.qty;
      return items;
    }
  }
}

function App() {
  const [items, dispatch] = useReducer(reducer, []);
  return (
    <div>
      <button onClick={() => dispatch({ type: 'added', id: 'apple', name: '苹果' })}>加苹果</button>
      <button onClick={() => dispatch({ type: 'added', id: 'pear', name: '梨' })}>加梨</button>
      <ul id="cart">
        {items.map(i => (
          <li key={i.id}>
            {i.name} × <span className="qty">{i.qty}</span>
            <button onClick={() => dispatch({ type: 'changedQty', id: i.id, qty: i.qty - 1 })}>减一个</button>
            <button onClick={() => dispatch({ type: 'removed', id: i.id })}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
      solution: `import { useReducer } from 'react';

function reducer(items, action) {
  switch (action.type) {
    case 'added':
      if (items.some(i => i.id === action.id)) {
        return items.map(i => (i.id === action.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...items, { id: action.id, name: action.name, qty: 1 }];
    case 'removed':
      return items.filter(i => i.id !== action.id);
    case 'changedQty':
      if (action.qty <= 0) return items.filter(i => i.id !== action.id);
      return items.map(i => (i.id === action.id ? { ...i, qty: action.qty } : i));
    default:
      throw new Error('未知的 action: ' + action.type);
  }
}

function App() {
  const [items, dispatch] = useReducer(reducer, []);
  return (
    <div>
      <button onClick={() => dispatch({ type: 'added', id: 'apple', name: '苹果' })}>加苹果</button>
      <button onClick={() => dispatch({ type: 'added', id: 'pear', name: '梨' })}>加梨</button>
      <ul id="cart">
        {items.map(i => (
          <li key={i.id}>
            {i.name} × <span className="qty">{i.qty}</span>
            <button onClick={() => dispatch({ type: 'changedQty', id: i.id, qty: i.qty - 1 })}>减一个</button>
            <button onClick={() => dispatch({ type: 'removed', id: i.id })}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
      hint: '三处：一是 <code>push</code> 和给 <code>item.qty</code> 赋值都改了原来的数据，要换成 <code>[...items, 新项]</code> 和 <code>map</code> 加展开语法，改哪一项就为那一项创建新对象。二是 <code>added</code> 没先看有没有这件商品。三是 switch 没有 <code>default</code>。',
      exports: ['reducer'],
      test: async t => {
        const r = t.exports.reducer;
        t.assert(typeof r === 'function', '没有找到 reducer');
        const clone = x => JSON.parse(JSON.stringify(x));
        const run = (s, a) => {
          const snap = JSON.stringify(s);
          const itemRefs = Array.isArray(s) ? s.slice() : [];
          const out = r(s, a);
          t.assert(
            JSON.stringify(s) === snap && itemRefs.every((x, i) => s[i] === x),
            'reducer 修改了原来的购物车（' + a.type + '）。数组和里面的对象都不能直接改：追加用 [...items, 新项]，改某一项要为那一项创建新对象。',
          );
          return out;
        };
        const names = o => (Array.isArray(o) ? o.map(i => i.id + ':' + i.qty).join(',') : String(o));
        const base = [
          { id: 'apple', name: '苹果', qty: 1 },
          { id: 'pear', name: '梨', qty: 2 },
        ];
        let o = run(clone(base), { type: 'added', id: 'fig', name: '无花果' });
        t.assert(names(o) === 'apple:1,pear:2,fig:1', 'added 一件新商品应追加到末尾，qty 为 1：期望 apple:1,pear:2,fig:1，实际是 ' + names(o) + '。');
        o = run(clone(base), { type: 'added', id: 'pear', name: '梨' });
        t.assert(names(o) === 'apple:1,pear:3', 'added 已有的商品应把它的 qty 加 1，不要多出一行：期望 apple:1,pear:3，实际是 ' + names(o) + '。');
        o = run(clone(base), { type: 'removed', id: 'apple' });
        t.assert(names(o) === 'pear:2', 'removed 应删掉那一行：期望 pear:2，实际是 ' + names(o) + '。');
        o = run(clone(base), { type: 'changedQty', id: 'pear', qty: 5 });
        t.assert(names(o) === 'apple:1,pear:5', 'changedQty 应把那一项的数量改成 5：期望 apple:1,pear:5，实际是 ' + names(o) + '。');
        o = run(clone(base), { type: 'changedQty', id: 'apple', qty: 0 });
        t.assert(names(o) === 'pear:2', 'changedQty 把数量改成 0 时应删掉那一行：期望 pear:2，实际是 ' + names(o) + '。');
        const s0 = clone(base);
        let unknown: any;
        try {
          unknown = r(s0, { type: '__unknown__' });
        } catch {
          unknown = s0; // 抛出错误也可以
        }
        t.assert(unknown !== undefined, '遇到不认识的 action 时返回了 undefined，购物车会变成 undefined。请加 default 分支：返回原 state，或抛出错误。');
        // 界面
        const rows = () => t.qa('#cart li').map(li => li.firstChild.textContent.trim() + li.querySelector('.qty').textContent);
        const btn = name => t.byText('button', name);
        await t.click(btn('加苹果'));
        await t.click(btn('加苹果'));
        t.assert(rows().join() === '苹果2', '点两次“加苹果”应只有一行“苹果 × 2”，实际是：' + rows().join('、') + '。');
        await t.click(btn('加梨'));
        t.assert(rows().length === 2, '再点“加梨”应有两行，实际有 ' + rows().length + ' 行。');
        const minus = t.qa('#cart li')[0].querySelectorAll('button')[0];
        await t.click(minus);
        await t.click(t.qa('#cart li')[0].querySelectorAll('button')[0]);
        t.assert(rows().join() === '梨1', '苹果点两次“减一个”后应被删掉，只剩“梨 × 1”，实际是：' + rows().join('、') + '。');
      },
    },
  ],
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
    {
      q: `在列表里把已选中的那一项改名。改名之后，“已选”那一行会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [items, setItems] = useState(initialItems);
const [selectedItem, setSelectedItem] = useState(initialItems[0]);

function rename(id, title) {
  setItems(items.map(i =&gt; (i.id === id ? { ...i, title } : i)));
}
// 渲染：&lt;p&gt;已选：{selectedItem.title}&lt;/p&gt;</code></pre></div>`,
      options: [
        '显示新名字：selectedItem 和 items 里的是同一个对象',
        '仍显示旧名字：selectedItem 是旧对象，rename 只替换了 items 里的',
        '报错：同一个对象不能放进两个 state',
        '两处都不变：rename 没有生效',
      ],
      answer: 1,
      explain:
        'rename 用展开语法为那一项创建了新对象，替换进 items。selectedItem 里存的还是旧对象，没有人更新它。这是“重复的 state”：同一个事实存了两处。改法：只存 <code>selectedId</code>，渲染时用 <code>items.find(i =&gt; i.id === selectedId)</code> 取出那一项，永远是最新的。“同一个对象”不对：展开语法创建的是新对象，旧对象留在 selectedItem 里。',
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
    '两个布尔值，还是一个 status？': {
      note: '左边的 isError 在第一次失败后变成 true，之后没有人把它改回 false。第二次请求开始，isLoading 变成 true，两个布尔值同时为 true：这个组合本来不该存在。请求成功后 isLoading 变回 false，isError 还是 true，界面仍显示“出错了”。右边只有一个 status，一次只能有一个值，矛盾的组合写不出来。每个 action 直接决定新的 status，不用记得去清别的字段。',
      predict: {
        q: '先点左边的“请求（会失败）”，等它结束。再点左边的“请求（会成功）”，马上看界面（请求还没结束）。“界面”那一行显示什么？',
        options: ['加载中…', '出错了', '加载中… 出错了', '空闲或成功'],
        answer: 2,
        explain:
          '第一次失败后 isError 是 true，没有人清除它。第二次请求开始，只有 isLoading 被设为 true，所以两个布尔值同时为 true，界面同时显示“加载中…”和“出错了”。最迷惑的是“加载中…”：新请求开始了，旧的错误却还在。多个独立的布尔值需要处处同步，漏一处就矛盾。',
      },
      pkey: 'use-reducer|两个布尔值，还是一个 status？',
    },
    '严格模式会把 reducer 调用两次': {
      note: '控制台有两行，按钮上的数字只加了 1。React 把 reducer 调用了两次，两次都从同一个旧 state 出发，纯函数得到同样的结果，React 只用其中一个。生产环境只调用一次。',
      predict: {
        q: '点一次按钮。控制台里会打印几行“reducer 被调用：increment”？',
        options: ['0 行：reducer 要等下一次渲染才调用', '1 行', '2 行', '3 行'],
        answer: 2,
        explain:
          '严格模式在开发环境把 reducer 调用两次，用来检查它是不是纯函数。纯函数调用几次结果都一样，所以按钮上的数字只加 1。最迷惑的是“1 行”：生产环境确实只调用一次，严格模式只在开发环境多调一次。',
      },
      pkey: 'use-reducer|严格模式会把 reducer 调用两次',
    },
  },
} satisfies Lesson;
