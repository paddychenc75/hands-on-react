import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/custom-hooks.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'custom-hooks',
  stage: 1,
  title: '自定义 Hook：复用逻辑',
  mins: 26,
  summary: '把组件中的状态逻辑抽取成以 use 开头的函数，在多个组件间复用。',
  goals: [
    '能说出 Hooks 的两条规则，并找出违反规则的代码',
    '能把几个组件里重复的状态逻辑抽成一个自定义 Hook',
    '能解释两个组件调用同一个自定义 Hook 时，state 为什么互相独立',
    '能为自定义 Hook 设计参数和返回值，并让它在参数变化时重新同步',
  ],
  keyPoints: [
    '两条规则：只在最顶层调用 Hook；只在函数组件或自定义 Hook 里调用。React 按调用顺序识别每个 Hook。',
    '自定义 Hook 是名字以 use 加大写字母开头、内部调用其他 Hook 的函数。',
    '它共享的是逻辑，不是 state：每个组件每调用一次，都有一份独立的 state。',
    '常见用法：把 useState 和 useEffect 的组合（窗口宽度、请求数据、localStorage）封装起来，组件只拿结果。',
    '参数会变时（例如 url），把它写进 Hook 内部 effect 的依赖数组，并用 ignore 标记忽略过期的响应。',
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
        'lint 工具靠“use + 大写字母”开头的名字认出 Hook，才会检查它有没有被写进 if 或循环',
        '没有实际作用，只是团队的命名习惯',
        '改名后，调用它的几个组件会共享同一份 n',
        '改名后 React 会把它当成组件，单独渲染一次',
      ],
      answer: 0,
      explain:
        'React 运行时不看名字，但 lint 工具（以及 React Compiler）只靠名字认出 Hook。叫 getCounter 时，有人把它写进 if 里，lint 不会报错，运行时 Hook 顺序就会错乱。最迷惑的是第二项：今天能运行，不代表以后改代码时不出错。第三项也不对：改名不会改变“每次调用各有一份 state”。',
    },
    {
      q: '<code>useFetch(url)</code> 里的 effect 调用了 <code>fakeFetch(url)</code>，依赖数组却写成 <code>[]</code>。App 里 <code>url</code> 从 "/api/users/1" 变成 "/api/users/3"，界面会怎样？',
      options: [
        '不会重新请求，仍显示用户 1 的数据',
        '重新请求，显示用户 3 的数据',
        '报错：Hook 的参数不能变',
        '重新请求，但因为没有 ignore，可能先显示用户 3 再变回用户 1',
      ],
      answer: 0,
      explain:
        'effect 读了 url，却没把它写进依赖数组，React 认为没有东西变了，不会重新同步，界面一直停在第一次请求的结果。Hook 的参数和组件的 props 一样，会随渲染变化；effect 读到的每个会变的值都要写进依赖数组。最迷惑的是最后一项：它说的是依赖写对之后才会遇到的竞态，这里根本不会发第二次请求。',
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
      const { React, ReactDOM } = t;
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
        // 到下一个已知的顶层声明为止（不依赖缩进：学习者的代码可能没有缩进）
            const end = rest.search(/^[ \t]*(?:export\s+)?(?:function|const|let|var|class)\s+(?:useLocalStorage|Nickname|Theme|App)\b/m);
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
  drillMins: 13,
  drills: [
    {
      title: '抽出 useLocalStorage：两个组件共用读写逻辑',
      task: '<ol class="task-steps"><li><code>Nickname</code> 和 <code>Theme</code> 各写了一遍“从 localStorage 读初值，变化后写回去”。把它抽成自定义 Hook <code>useLocalStorage(key, initial)</code>。</li><li>它返回 <code>[value, setValue]</code>，用法和 <code>useState</code> 一样。第一次渲染时，如果 localStorage 里有这个 key，就用存的值（用 JSON 存取），否则用 initial。value 变化后要写回 localStorage。</li><li>改写 <code>Nickname</code> 和 <code>Theme</code>，让它们调用 <code>useLocalStorage</code>，不再自己读写 localStorage。key 仍是 <code>demo-nick</code> 和 <code>demo-dark</code>。</li></ol>',
      starter: `import { useState, useEffect } from 'react';

function useLocalStorage(key, initial) {
  // 在这里实现：返回 [value, setValue]
  return [initial, () => {}];
}

function Nickname() {
  const [name, setName] = useState(() => {
    const saved = localStorage.getItem('demo-nick');
    return saved === null ? '访客' : JSON.parse(saved);
  });
  useEffect(() => {
    localStorage.setItem('demo-nick', JSON.stringify(name));
  }, [name]);
  return <input id="nick" value={name} onChange={e => setName(e.target.value)} />;
}

function Theme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('demo-dark');
    return saved === null ? false : JSON.parse(saved);
  });
  useEffect(() => {
    localStorage.setItem('demo-dark', JSON.stringify(dark));
  }, [dark]);
  return (
    <label>
      <input id="dark" type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} /> 深色
    </label>
  );
}

function App() {
  return <div><Nickname /><Theme /></div>;
}`,
      solution: `import { useState, useEffect } from 'react';

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved === null ? initial : JSON.parse(saved);
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

function Nickname() {
  const [name, setName] = useLocalStorage('demo-nick', '访客');
  return <input id="nick" value={name} onChange={e => setName(e.target.value)} />;
}

function Theme() {
  const [dark, setDark] = useLocalStorage('demo-dark', false);
  return (
    <label>
      <input id="dark" type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} /> 深色
    </label>
  );
}

function App() {
  return <div><Nickname /><Theme /></div>;
}`,
      hint: '把 Nickname 里的 useState 初值函数和 useEffect 原样搬进 useLocalStorage，把写死的 key 和初值换成参数，最后返回 [value, setValue]。两个组件里就只剩一行调用。',
      exports: ['useLocalStorage', 'App'],
      test: async t => {
        const { React, ReactDOM } = t;
        const h = React.createElement;
        const useLocalStorage = t.exports.useLocalStorage;
        t.assert(typeof useLocalStorage === 'function', '请保留名为 useLocalStorage 的函数');
        const keys = ['drill-probe-a', 'drill-probe-b', 'demo-nick', 'demo-dark'];
        const saved = keys.map(k => [k, localStorage.getItem(k)]);
        const box = document.createElement('div');
        const root = ReactDOM.createRoot(box);
        try {
          keys.forEach(k => localStorage.removeItem(k));
          let a = null;
          let b = null;
          const Probe = () => {
            a = useLocalStorage('drill-probe-a', 1);
            b = useLocalStorage('drill-probe-b', 'x');
            return null;
          };
          localStorage.setItem('drill-probe-a', JSON.stringify(42));
          ReactDOM.flushSync(() => root.render(h(Probe)));
          t.assert(Array.isArray(a) && typeof a[1] === 'function', 'useLocalStorage 应返回 [value, setValue]，第二项是函数');
          t.assert(a[0] === 42, `localStorage 里已经存了 42，第一次渲染应读到它，实际是 ${JSON.stringify(a[0])}。初值应优先取存的值，没有才用 initial`);
          t.assert(b[0] === 'x', `localStorage 里没有 drill-probe-b，应使用 initial 'x'，实际是 ${JSON.stringify(b[0])}`);
          ReactDOM.flushSync(() => a[1](7));
          t.assert(a[0] === 7, `调用 setValue(7) 后 value 应为 7，实际是 ${JSON.stringify(a[0])}`);
          t.assert(
            localStorage.getItem('drill-probe-a') === '7',
            `value 变化后应写回 localStorage（JSON 格式），实际存的是 ${JSON.stringify(localStorage.getItem('drill-probe-a'))}`,
          );
          t.assert(b[0] === 'x', '两个 key 的状态应互相独立');
          root.unmount();
          // 新挂载一份 App：应读到之前存的值，并且组件通过 Hook 写回
          localStorage.setItem('demo-nick', JSON.stringify('小明'));
          localStorage.setItem('demo-dark', 'true');
          const box2 = document.createElement('div');
          const root2 = ReactDOM.createRoot(box2);
          try {
            ReactDOM.flushSync(() => root2.render(h(t.exports.App)));
            t.assert(
              (box2.querySelector('#nick') as HTMLInputElement).value === '小明',
              `Nickname 应读到存的“小明”，实际是“${(box2.querySelector('#nick') as HTMLInputElement).value}”。key 要保持 demo-nick`,
            );
            t.assert((box2.querySelector('#dark') as HTMLInputElement).checked === true, 'Theme 应读到存的 true。key 要保持 demo-dark');
            const input = box2.querySelector('#nick') as HTMLInputElement;
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            ReactDOM.flushSync(() => {
              setter.call(input, '小红');
              input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            t.assert(
              localStorage.getItem('demo-nick') === '"小红"',
              `改了昵称后，localStorage 的 demo-nick 应为 "小红"，实际是 ${localStorage.getItem('demo-nick')}`,
            );
          } finally {
            root2.unmount();
          }
          // 两个组件不再自己读写 localStorage 或直接用 useState
          const bodyOf = name => {
            const m = new RegExp('^[ \\t]*(?:export\\s+)?(?:function\\s+' + name + '\\b|(?:const|let|var)\\s+' + name + '\\s*=)', 'm').exec(t.source);
            if (!m) return null;
            const rest = t.source.slice(m.index + m[0].length);
            // 到下一个已知的顶层声明为止（不依赖缩进：学习者的代码可能没有缩进）
            const end = rest.search(/^[ \t]*(?:export\s+)?(?:function|const|let|var|class)\s+(?:useLocalStorage|Nickname|Theme|App)\b/m);
            return end < 0 ? rest : rest.slice(0, end);
          };
          for (const name of ['Nickname', 'Theme']) {
            const body = bodyOf(name);
            t.assert(body != null, `找不到组件 ${name}。请保留它的名字`);
            t.assert(/\buseLocalStorage\s*\(/.test(body), `${name} 里没有调用 useLocalStorage`);
            t.assert(
              !/\blocalStorage\b/.test(body.replace(/useLocalStorage/g, '')) && !/\b(useState|useEffect)\s*\(/.test(body),
              `${name} 里还在自己读写 localStorage 或直接用 useState/useEffect。这些逻辑应只写在 useLocalStorage 里一次`,
            );
          }
        } finally {
          try {
            root.unmount();
          } catch {}
          for (const [k, v] of saved) {
            if (v === null) localStorage.removeItem(k);
            else localStorage.setItem(k, v);
          }
        }
      },
    },
    {
      title: '自己写 useDebounce：停止变化后才更新',
      task: '<ol class="task-steps"><li>实现自定义 Hook <code>useDebounce(value, delay)</code>：它返回 value 的“延迟版本”。value 停止变化 <code>delay</code> 毫秒后，返回值才更新成最新的 value。</li><li>value 连续变化时要重新计时，中间的值不能出现在返回值里。</li><li>App 已经在用 <code>useDebounce(text, 300)</code>，不用改。</li></ol>',
      starter: `import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  // 在这里实现：value 停止变化 delay 毫秒后，才返回最新的 value
  return value;
}

function App() {
  const [text, setText] = useState('');
  const keyword = useDebounce(text, 300);
  return (
    <div>
      <input id="q" value={text} onChange={e => setText(e.target.value)} />
      <p>输入：<span id="typed">{text}</span></p>
      <p>搜索词：<span id="keyword">{keyword}</span></p>
    </div>
  );
}`,
      solution: `import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function App() {
  const [text, setText] = useState('');
  const keyword = useDebounce(text, 300);
  return (
    <div>
      <input id="q" value={text} onChange={e => setText(e.target.value)} />
      <p>输入：<span id="typed">{text}</span></p>
      <p>搜索词：<span id="keyword">{keyword}</span></p>
    </div>
  );
}`,
      hint: 'Hook 里用 useState 保存延迟版本。再用 useEffect：value 变化后启动一个 setTimeout，到时间才 set。想一想：value 又变了，上一个计时器该怎么处理？组件卸载呢？',
      exports: ['useDebounce'],
      test: async t => {
        const { React, ReactDOM } = t;
        const h = React.createElement;
        const useDebounce = t.exports.useDebounce;
        t.assert(typeof useDebounce === 'function', '请保留名为 useDebounce 的函数');
        const D = 200;
        await t.retry(async () => {
          const box = document.createElement('div');
          const root = ReactDOM.createRoot(box);
          const seen: string[] = [];
          let out: any;
          const Probe = ({ v }) => {
            out = useDebounce(v, D);
            seen.push(out);
            return null;
          };
          const set = v => ReactDOM.flushSync(() => root.render(h(Probe, { v })));
          try {
            set('a');
            t.assert(out === 'a', `第一次渲染应直接返回初始值 'a'，实际是 ${JSON.stringify(out)}`);
            set('ab');
            t.assert(out === 'a', `value 刚变成 'ab' 时，返回值应还是 'a'（等 value 稳定一段时间后才更新），实际是 ${JSON.stringify(out)}`);
            await t.wait(D / 2);
            t.timing(out === 'a', `过了 ${D / 2} 毫秒还不到 delay（${D} 毫秒），返回值应仍是 'a'，实际是 ${JSON.stringify(out)}。是不是没有按 delay 等待？`);
            set('abc');
            await t.wait(D * 0.8);
            t.assert(!seen.includes('ab'), "value 在 'ab' 之后又变成了 'abc'，'ab' 不该出现在返回值里。value 再次变化时，要先清掉上一个计时器");
            for (let i = 0; i < 40 && out !== 'abc'; i++) await t.wait(20);
            t.timing(
              out === 'abc',
              `'abc' 稳定超过 delay 之后，返回值应更新为 'abc'，实际是 ${JSON.stringify(out)}。delay 是不是被写死了，或者 effect 没有随 value 重新计时？`,
            );
          } finally {
            root.unmount();
          }
        });
        // 换一个很短的 delay：delay 要真的是参数，不能写死成 300
        await t.retry(async () => {
          const box = document.createElement('div');
          const root = ReactDOM.createRoot(box);
          let out     ;
          const Probe = ({ v }) => {
            out = useDebounce(v, 40);
            return null;
          };
          const set = v => ReactDOM.flushSync(() => root.render(h(Probe, { v })));
          try {
            set('x');
            set('xy');
            for (let i = 0; i < 10 && out !== 'xy'; i++) await t.wait(20);
            t.timing(out === 'xy', `delay 传 40 时，约 40 毫秒后返回值就该更新成 'xy'，等了 200 毫秒，实际是 ${JSON.stringify(out)}。delay 是不是被写死了？计时用的应是参数 delay`);
          } finally {
            root.unmount();
          }
        });
        // 真实的 App：输入后搜索词不能立刻跟上
        await t.type('#q', 'hi');
        t.assert(t.text('#typed') === 'hi', '输入框下方应立刻显示输入的文字');
        t.assert(t.text('#keyword') !== 'hi', '刚输入完，搜索词不该立刻等于输入。它应等输入停下来 300 毫秒后才更新');
      },
    },
  ],
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
    '两个组件各调用一次 useToggle': {
      note: '灯 A 和灯 B 各自调用了一次 useToggle()，每次调用都创建一份属于当前组件的 state，所以互不影响。灯 C 和灯 D 的状态来自父组件 App 里的同一次调用，所以一起开关。自定义 Hook 复用的是“怎么管理开关”这套逻辑，不是某一份开关的值。',
      predict: {
        q: '点一下“灯 A”。灯 B 会怎样？',
        options: [
          '灯 B 也变成“开”：两个灯调用的是同一个 useToggle',
          '灯 B 不变：灯 A 和灯 B 各有自己的 state',
          '灯 B 要等下一次渲染才变',
          '报错：同一个 Hook 不能被两个组件调用',
        ],
        answer: 1,
        explain:
          'Hook 里的 useState 属于调用它的组件。灯 A 和灯 B 各调用一次 useToggle()，就各有一份 on。最迷惑的是第一项：两个组件用的是同一个函数，但函数只是“怎么做”的描述，每次调用都会产生新的 state。想共享，就把调用提到共同父组件。',
      },
      pkey: 'custom-hooks|两个组件各调用一次 useToggle',
    },
    '参数变化时重新请求：useFetch': {
      note: '用户 2 的响应要 1.5 秒，用户 3 只要 0.3 秒。点用户 3 时，用户 2 的请求还没回来。url 变了，React 先运行上一次 effect 的清理函数，把用户 2 的那次请求标记为过期（ignore = true），再用新的 url 发出第二次请求。用户 2 的响应后到，却被忽略。想看没有 ignore 的结果，把 .then 里的 if (!ignore) 去掉再试一次。',
      predict: {
        q: '先点“用户 2”，不等它返回，马上点“用户 3”，等 2 秒。“结果”那一行显示什么？',
        options: ['结果：小赵', '结果：小王', '加载中…', '先显示小赵，然后变成小王'],
        answer: 0,
        explain:
          'url 变化时，清理函数把用户 2 的请求标记为过期，它 1.5 秒后返回，也不会写进 state。界面始终和当前选择一致。没有 ignore 才会出现最后一项：慢的响应后到，覆盖了正确的结果，选的是用户 3，显示的却是小王。',
      },
      pkey: 'custom-hooks|参数变化时重新请求：useFetch',
    },
  },
} satisfies Lesson;
