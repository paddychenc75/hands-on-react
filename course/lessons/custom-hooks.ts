import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/custom-hooks.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'custom-hooks',
  stage: 1,
  title: '自定义 Hook：复用逻辑',
  mins: 19,
  summary: '把组件中的状态逻辑抽取成以 use 开头的函数，在多个组件间复用。',
  goals: [
    '能说出 Hooks 的两条规则，并找出违反规则的代码',
    '能把几个组件里重复的状态逻辑抽成一个自定义 Hook',
    '能解释两个组件调用同一个自定义 Hook 时，state 为什么互相独立',
    '能为自定义 Hook 设计参数和返回值',
  ],
  keyPoints: [
    '两条规则：只在最顶层调用 Hook；只在函数组件或自定义 Hook 里调用。React 按调用顺序识别每个 Hook。',
    '自定义 Hook 是名字以 use 加大写字母开头、内部调用其他 Hook 的函数。',
    '它共享的是逻辑，不是 state：每个组件每调用一次，都有一份独立的 state。',
    '常见用法：把 useState 和 useEffect 的组合（窗口宽度、请求数据、localStorage）封装起来，组件只拿结果。',
  ],
  quiz: [
    {
      q: '下面哪种写法违反了 Hooks 规则？',
      options: ['在组件顶层调用 useState', 'if (show) { useEffect(...) }', '在自定义 Hook 中调用 useState', '在组件里调用自定义 Hook'],
      answer: 1,
      explain:
        '不能在条件语句中调用 Hook，否则 show 变化时 Hook 的调用顺序会变。最迷惑的是第三项：自定义 Hook 本来就是“在函数里调用 Hook”，只要它自己在组件顶层被调用，就是合法的。',
    },
    {
      q: '组件 A 和 B 都调用了 useCounter()。A 中计数增加，B 的计数会怎样？',
      options: [
        '同步增加，因为两个组件调用的是同一个 useCounter 函数',
        '不变，每次调用 Hook 都有自己的 state',
        '要等 B 下一次重新渲染才同步',
        '只有两个组件写在同一个文件里才同步',
      ],
      answer: 1,
      explain:
        '自定义 Hook 复用的是逻辑，不是 state。每次调用里的 useState 都创建一份独立的 state。最迷惑的是第一项：想共享同一份数据，要做状态提升或用 Context。',
    },
    {
      q: '同事写了 <code>function getCounter() { const [n, setN] = useState(0); … }</code>，在组件顶层调用它，能正常运行。为什么还要把它改名为 <code>useCounter</code>？',
      options: [
        'React 和 lint 工具靠“use + 大写字母”开头的名字认出 Hook，才会检查它有没有被写进 if 或循环',
        '没有实际作用，只是团队的命名习惯',
        '改名后，调用它的几个组件会共享同一份 n',
        '改名后 React 会把它当成组件，单独渲染一次',
      ],
      answer: 0,
      explain:
        '名字是工具识别 Hook 的唯一依据。叫 getCounter 时，有人把它写进 if 里，lint 不会报错，运行时 Hook 顺序就会错乱。最迷惑的是第二项：今天能运行，不代表以后改代码时不出错。第三项也不对：改名不会改变“每次调用各有一份 state”。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li><code>Likes</code> 和 <code>Stock</code> 里有重复的计数逻辑。把它抽成自定义 Hook <code>useCounter(initial)</code>。</li><li>useCounter 用 <code>useState(initial)</code> 保存 count，并定义 <code>inc</code>（加 1）、<code>dec</code>（减 1）、<code>reset</code>（恢复为 initial）。</li><li>返回 <code>{ count, inc, dec, reset }</code>。</li><li>改写 Likes 和 Stock：删掉它们自己的 useState，改为调用 <code>useCounter(0)</code> 和 <code>useCounter(10)</code>。</li><li>两个组件的计数必须互相独立。</li></ol>',
    starter: `import { useState } from 'react';

function useCounter(initial = 0) {
  // 在这里实现：返回 { count, inc, dec, reset }
  return { count: initial, inc: () => {}, dec: () => {}, reset: () => {} };
}

function Likes() {
  const [count, setCount] = useState(0);
  return (
    <p>
      👍 <span id="likes">{count}</span>
      <button id="likes-inc" onClick={() => setCount(c => c + 1)}>赞</button>
      <button id="likes-reset" onClick={() => setCount(0)}>清零</button>
    </p>
  );
}

function Stock() {
  const [count, setCount] = useState(10);
  return (
    <p>
      📦 库存 <span id="stock">{count}</span>
      <button id="stock-dec" onClick={() => setCount(c => c - 1)}>卖出一件</button>
      <button id="stock-reset" onClick={() => setCount(10)}>补满</button>
    </p>
  );
}

function App() {
  return <div><Likes /><Stock /></div>;
}`,
    solution: `import { useState } from 'react';

function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const inc = () => setCount(c => c + 1);
  const dec = () => setCount(c => c - 1);
  const reset = () => setCount(initial);
  return { count, inc, dec, reset };
}

function Likes() {
  const { count, inc, reset } = useCounter(0);
  return (
    <p>
      👍 <span id="likes">{count}</span>
      <button id="likes-inc" onClick={inc}>赞</button>
      <button id="likes-reset" onClick={reset}>清零</button>
    </p>
  );
}

function Stock() {
  const { count, dec, reset } = useCounter(10);
  return (
    <p>
      📦 库存 <span id="stock">{count}</span>
      <button id="stock-dec" onClick={dec}>卖出一件</button>
      <button id="stock-reset" onClick={reset}>补满</button>
    </p>
  );
}

function App() {
  return <div><Likes /><Stock /></div>;
}`,
    exports: ['useCounter'],
    hint: '先写 useCounter：它就是把 Likes 里的 useState 和几个更新函数原样搬进去，再把它们放进一个对象返回。然后让两个组件从 useCounter 的返回值里解构出自己要用的那几个。',
    faded: `import { useState } from 'react';

function useCounter(initial = 0) {
  /* ✏️ 用 useState 保存 count，初始值是 initial */
  const inc = () => setCount(c => c + 1);
  const dec = () => setCount(c => c - 1);
  /* ✏️ 定义 reset：把 count 恢复为 initial */
  return { count, inc, dec, reset };
}

function Likes() {
  /* ✏️ 调用 useCounter，初始值 0，解构出 count、inc、reset */
  return (
    <p>
      👍 <span id="likes">{count}</span>
      <button id="likes-inc" onClick={inc}>赞</button>
      <button id="likes-reset" onClick={reset}>清零</button>
    </p>
  );
}

function Stock() {
  const { count, dec, reset } = useCounter(10);
  return (
    <p>
      📦 库存 <span id="stock">{count}</span>
      <button id="stock-dec" onClick={dec}>卖出一件</button>
      <button id="stock-reset" onClick={reset}>补满</button>
    </p>
  );
}

function App() {
  return <div><Likes /><Stock /></div>;
}`,
    test: async t => {
      const useCounter = t.exports.useCounter;
      t.assert(typeof useCounter === 'function', '请保留名为 useCounter 的函数');
      // 单独测试 Hook 本身：在一个探针组件里调用它
      let api = null;
      const Probe = () => {
        api = useCounter(5);
        return null;
      };
      const box = document.createElement('div');
      const root = ReactDOM.createRoot(box);
      try {
        ReactDOM.flushSync(() => root.render(React.createElement(Probe)));
        t.assert(api && api.count === 5, `useCounter(5) 返回的 count 应为 5，实际是 ${api && api.count}。count 要用 useState(initial) 保存`);
        t.assert(
          ['inc', 'dec', 'reset'].every(k => typeof api[k] === 'function'),
          'useCounter 应返回 { count, inc, dec, reset }，其中 inc、dec、reset 都是函数',
        );
        ReactDOM.flushSync(() => api.inc());
        ReactDOM.flushSync(() => api.inc());
        t.assert(api.count === 7, `调用两次 inc 后应为 7，实际是 ${api.count}`);
        ReactDOM.flushSync(() => api.dec());
        t.assert(api.count === 6, `再调用一次 dec 后应为 6，实际是 ${api.count}`);
        ReactDOM.flushSync(() => api.reset());
        t.assert(api.count === 5, `调用 reset 后应恢复为初始值 5，实际是 ${api.count}。reset 要设回 initial，不是 0`);
      } finally {
        root.unmount();
      }
      // 只看 Likes 和 Stock 两个函数的代码：它们要调用 useCounter，不再自己调用 useState。useCounter 内部怎么写不限制
      const bodyOf = name => {
        const m = new RegExp('^[ \\t]*(?:export\\s+)?(?:function\\s+' + name + '\\b|(?:const|let|var)\\s+' + name + '\\s*=)', 'm').exec(t.source);
        if (!m) return null;
        const rest = t.source.slice(m.index + m[0].length);
        const end = rest.search(/^(?:export\s+)?(?:function|const|let|var|class)\s/m);
        return end < 0 ? rest : rest.slice(0, end);
      };
      for (const [name, init] of [
        ['Likes', 0],
        ['Stock', 10],
      ]) {
        const body = bodyOf(name);
        t.assert(body != null, `找不到组件 ${name}。请保留它的名字`);
        t.assert(/\buseCounter\s*\(/.test(body), `${name} 里没有调用 useCounter。请把它自己的计数逻辑换成 useCounter(${init})`);
        t.assert(
          !/\b(useState|useReducer)\s*\(/.test(body),
          `${name} 里还直接调用了 useState。计数逻辑应只写在 useCounter 里一次，${name} 只调用 useCounter(${init})`,
        );
      }
      t.assert(t.text('#likes') === '0' && t.text('#stock') === '10', `初始值应分别为 0 和 10，实际是 ${t.text('#likes')} 和 ${t.text('#stock')}`);
      await t.click('#likes-inc');
      await t.click('#likes-inc');
      await t.click('#stock-dec');
      t.assert(t.text('#likes') === '2', `点两次“赞”后应为 2，实际是 ${t.text('#likes')}`);
      t.assert(t.text('#stock') === '9', `点一次“卖出一件”后库存应为 9，实际是 ${t.text('#stock')}。两个组件的计数应互相独立`);
      await t.click('#likes-reset');
      t.assert(t.text('#likes') === '0' && t.text('#stock') === '9', '点“清零”只应清零点赞数，库存应保持 9');
      await t.click('#stock-reset');
      t.assert(t.text('#stock') === '10', `点“补满”后库存应恢复为 10，实际是 ${t.text('#stock')}`);
    },
  },
  checkOnly: [
    {
      q: `a 初始为 false。点击按钮后，a 是什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function useToggle(init) {
  const [on, setOn] = useState(init);
  return [on, () =&gt; setOn(!on)];
}

function App() {
  const [a, toggleA] = useToggle(false);
  return (
    &lt;button onClick={() =&gt; { toggleA(); toggleA(); }}&gt;
      {String(a)}
    &lt;/button&gt;
  );
}</code></pre></div>`,
      options: ['false：切换了两次，回到原值', 'true', '报错：同一个 Hook 不能调用两次', 'a 在 true 和 false 之间不停闪烁'],
      answer: 1,
      explain:
        '两次 toggleA 是同一次渲染创建的函数，读到的 on 都是 false。两次都执行 <code>setOn(true)</code>，结果是 true。自定义 Hook 不会改变 state 的快照规则。想连续切换，应写 <code>setOn(o =&gt; !o)</code>。',
    },
    {
      q: `id 一开始是 null，之后变成 5。Header 会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function useCurrentUser(id) {
  if (id == null) return null;
  const [user, setUser] = useState(null);
  useEffect(() =&gt; {
    fetchUser(id).then(setUser);
  }, [id]);
  return user;
}

function Header({ id }) {
  const user = useCurrentUser(id);
  const [open, setOpen] = useState(false);
  // …
}</code></pre></div>`,
      options: [
        '正常：先得到 null，请求完成后得到用户',
        '报错：这次渲染调用的 Hook 比上次多',
        '不报错，但 open 读到了 user 的 state',
        '报错：自定义 Hook 不能返回 null',
      ],
      answer: 1,
      explain:
        '自定义 Hook 里的 Hook 都算在调用它的组件头上。id 为 null 时，Header 只调用了 1 个 Hook（open 的 useState）。id 变成 5 后，Header 依次调用 useState、useEffect、useState，一共 3 个。React 按调用顺序对应 Hook，数量变了就报错“Rendered more hooks than during the previous render”。最迷惑的是第一项：Hooks 规则同样适用于自定义 Hook 内部。修法：先调用所有 Hook，再在 effect 里判断 <code>if (id == null) return;</code>。',
    },
  ],
  plays: {
    '三个实用的自定义 Hook': {
      note: '调整浏览器窗口大小试试看。',
    },
  },
} satisfies Lesson;
