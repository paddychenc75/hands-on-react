// 由 scripts/convert.mjs 从旧版 src/*.js 生成。
// 非正文数据。课文在 docs/lessons/state-architecture.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'state-architecture',
  stage: 3,
  title: '状态管理架构',
  mins: 22,
  summary: '区分服务端状态与客户端状态，理解外部 store 的原理并亲手实现一个。',
  goals: [
    '能把一个 state 归类（局部、服务端、全局客户端、URL、表单），并选出合适的工具',
    '能用 useSyncExternalStore 把外部 store 接入组件',
    '能写出支持 selector 的迷你 Zustand',
    '能解释 selector 为什么能减少重新渲染',
  ],
  keyPoints: [
    '先给 state 分类。从 API 来的数据是服务端状态，交给 TanStack Query 这类库。搜索词、页码放进 URL。真正的全局客户端 state 通常很少。',
    '外部 store 要提供两样东西：<code>subscribe(callback)</code> 返回取消订阅的函数，<code>getSnapshot()</code> 返回当前值。<code>useSyncExternalStore</code> 用它们把 store 接入组件。',
    'selector 只选出组件需要的那一部分。React 用 <code>Object.is</code> 比较快照，选出的值没变，组件就不重新渲染。',
    '更新 store 时要创建新对象，不要修改旧对象。',
    '常见坑：selector 每次返回新对象，例如 <code>s =&gt; ({ a: s.a })</code>。快照永远“变了”，会无限渲染。',
  ],
  quiz: [
    {
      q: '“商品列表”从 API 获取，多个页面都要用，还要定时刷新。最适合用什么管理？',
      options: [
        '每个页面用 useState + useEffect 各自请求',
        'TanStack Query 这类服务端状态库',
        '放进 Redux，自己写加载、缓存和失效逻辑',
        '在根组件请求一次，放进 Context',
      ],
      answer: 1,
      explain: '服务端状态需要缓存、去重、失效和重新获取，专门的库都处理好了。Redux 也能做，但这些逻辑都要自己写。Context 方案不会自动刷新，而且数据一变，所有消费者都会重新渲染。',
    },
    {
      q: '在本课的迷你 Zustand 中写 useBear(s => ({ bears: s.bears }))，会怎样？',
      options: [
        '正常工作，只在 bears 变化时渲染，因为对象内容没变',
        '每次 getSnapshot 都返回新对象，React 报错或无限渲染',
        '只渲染一次，之后不再更新',
        '读到 undefined',
      ],
      answer: 1,
      explain: 'getSnapshot 必须在没有变化时返回相同引用。这个 selector 每次都返回新对象，React 认为快照一直在变。第一项是常见误解：React 不会比较对象的内容。要返回对象时，用 useShallow 这类浅比较工具。',
    },
    {
      q: '用户搜索“键盘”，翻到第 3 页，把链接发给同事。同事打开后，看到的是空搜索的第 1 页。关键词和页码应该存在哪里？',
      options: [
        'Zustand 全局 store，整个应用都能读到',
        'URL 查询参数，例如 ?q=键盘&amp;page=3',
        'localStorage，刷新后也能保留',
        '组件 state，再用 Context 传给列表',
      ],
      answer: 1,
      explain: '链接里只带着 URL。把关键词和页码放进查询参数，分享、刷新、前进后退都能还原同一个页面。最有迷惑性的是 localStorage：刷新后确实能保留，但它只存在你自己的浏览器里，同事打开链接时读不到。全局 store 和组件 state 在刷新后就丢了。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>补全 <code>getState</code> 和 <code>subscribe</code>。subscribe 返回一个取消订阅的函数。</li><li>补全 <code>setState(partial)</code>：partial 可以是对象，也可以是 <code>s =&gt; 要修改的部分</code>。把它合并进一个<b>新</b> state 对象，再通知所有 listeners。</li><li>补全 <code>useStore(selector)</code>：用 <code>useSyncExternalStore</code> 订阅 store，只返回 selector 选出的值。</li><li>检查结果：加一只熊时，HoneyPot 的渲染次数不变；吃蜂蜜时，BearCounter 的渲染次数不变。</li></ol>',
    starter: `import { useSyncExternalStore } from 'react';

// —— 迷你 Zustand ——
function create(initial) {
  let state = initial;
  const listeners = new Set();
  const store = {
    getState() {
      // 返回当前 state
    },
    setState(partial) {
      // 1. partial 可能是函数：用旧 state 算出要修改的部分
      // 2. 和旧 state 合并成一个新对象（不要修改旧对象）
      // 3. 通知所有 listeners
    },
    subscribe(fn) {
      // 添加 fn，并返回一个取消订阅的函数
    },
  };
  function useStore(selector) {
    // 用 useSyncExternalStore 订阅 store，只返回 selector 选出的值
  }
  return { store, useStore };
}

const { store, useStore } = create({ bears: 0, honey: 10 });

const renders = { bears: 0, honey: 0 };
function BearCounter() {
  const bears = useStore(s => s.bears);
  renders.bears++;
  return <p>熊：<span id="bears">{bears}</span>（渲染 <span id="bear-renders">{renders.bears}</span> 次）</p>;
}

function HoneyPot() {
  const honey = useStore(s => s.honey);
  renders.honey++;
  return <p>蜂蜜：<span id="honey">{honey}</span>（渲染 <span id="honey-renders">{renders.honey}</span> 次）</p>;
}

function App() {
  return (
    <div>
      <BearCounter />
      <HoneyPot />
      <button id="add-bear" onClick={() => store.setState(s => ({ bears: s.bears + 1 }))}>加一只熊</button>
      <button id="eat" onClick={() => store.setState({ honey: store.getState().honey - 1 })}>吃蜂蜜</button>
    </div>
  );
}`,
    solution: `import { useSyncExternalStore } from 'react';

// —— 迷你 Zustand ——
function create(initial) {
  let state = initial;
  const listeners = new Set();
  const store = {
    getState() {
      return state;
    },
    setState(partial) {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next };
      listeners.forEach(l => l());
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
  function useStore(selector) {
    return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
  }
  return { store, useStore };
}

const { store, useStore } = create({ bears: 0, honey: 10 });

const renders = { bears: 0, honey: 0 };
function BearCounter() {
  const bears = useStore(s => s.bears);
  renders.bears++;
  return <p>熊：<span id="bears">{bears}</span>（渲染 <span id="bear-renders">{renders.bears}</span> 次）</p>;
}

function HoneyPot() {
  const honey = useStore(s => s.honey);
  renders.honey++;
  return <p>蜂蜜：<span id="honey">{honey}</span>（渲染 <span id="honey-renders">{renders.honey}</span> 次）</p>;
}

function App() {
  return (
    <div>
      <BearCounter />
      <HoneyPot />
      <button id="add-bear" onClick={() => store.setState(s => ({ bears: s.bears + 1 }))}>加一只熊</button>
      <button id="eat" onClick={() => store.setState({ honey: store.getState().honey - 1 })}>吃蜂蜜</button>
    </div>
  );
}`,
    hint: '1. 合并用对象展开：<code>{ ...旧, ...新 }</code> 得到一个新对象。2. useSyncExternalStore 的第二个参数是 getSnapshot。React 用 Object.is 比较它前后两次的返回值。返回整个 state，每次 setState 后它都是新对象；返回 selector 选出的值，没变就不会重新渲染。',
    faded: `import { useSyncExternalStore } from 'react';

// —— 迷你 Zustand ——
function create(initial) {
  let state = initial;
  const listeners = new Set();
  const store = {
    getState() {
      return state;
    },
    setState(partial) {
      const next = typeof partial === 'function' ? partial(state) : partial;
      /* ✏️ 合并出一个新对象，赋给 state */
      /* ✏️ 通知所有 listeners */
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
  function useStore(selector) {
    /* ✏️ 调用 useSyncExternalStore：getSnapshot 要返回 selector 选出的值，而不是整个 state */
  }
  return { store, useStore };
}

const { store, useStore } = create({ bears: 0, honey: 10 });

const renders = { bears: 0, honey: 0 };
function BearCounter() {
  const bears = useStore(s => s.bears);
  renders.bears++;
  return <p>熊：<span id="bears">{bears}</span>（渲染 <span id="bear-renders">{renders.bears}</span> 次）</p>;
}

function HoneyPot() {
  const honey = useStore(s => s.honey);
  renders.honey++;
  return <p>蜂蜜：<span id="honey">{honey}</span>（渲染 <span id="honey-renders">{renders.honey}</span> 次）</p>;
}

function App() {
  return (
    <div>
      <BearCounter />
      <HoneyPot />
      <button id="add-bear" onClick={() => store.setState(s => ({ bears: s.bears + 1 }))}>加一只熊</button>
      <button id="eat" onClick={() => store.setState({ honey: store.getState().honey - 1 })}>吃蜂蜜</button>
    </div>
  );
}`,
    exports: ['store'],
    test: async (t) => {
      t.assert(t.text('#bears') === '0' && t.text('#honey') === '10', `初始应为熊 0、蜂蜜 10，实际是熊 ${t.text('#bears') || '空'}、蜂蜜 ${t.text('#honey') || '空'}。getState 和 useStore 返回了正确的值吗？`);
      const honeyR = t.text('#honey-renders'), bearR0 = t.text('#bear-renders');
      await t.click('#add-bear'); await t.click('#add-bear');
      t.assert(t.text('#bears') === '2', `点两次“加一只熊”后应为 2，实际是 ${t.text('#bears')}。setState 支持函数吗？通知 listeners 了吗？`);
      t.assert(t.text('#honey') === '10', `加熊后蜂蜜应仍为 10，实际是 ${t.text('#honey') || '空'}。setState 要把修改的部分合并进旧 state，而不是替换整个 state`);
      t.assert(t.text('#honey-renders') === honeyR, `加熊时 HoneyPot 也重新渲染了（${honeyR} → ${t.text('#honey-renders')}）。getSnapshot 返回的是整个 state 吗？它每次都是新对象。让 getSnapshot 返回 selector 选出的值`);
      const bearR = t.text('#bear-renders');
      t.assert(bearR !== bearR0, 'BearCounter 应该在熊的数量变化时重新渲染');
      await t.click('#eat');
      t.assert(t.text('#honey') === '9' && t.text('#bears') === '2', `吃蜂蜜后应为熊 2、蜂蜜 9，实际是熊 ${t.text('#bears') || '空'}、蜂蜜 ${t.text('#honey') || '空'}。setState 也要支持直接传对象`);
      t.assert(t.text('#bear-renders') === bearR, '吃蜂蜜时 BearCounter 也重新渲染了。它只选了 bears，bears 没变就不该渲染');
      const s = t.exports.store;
      t.assert(s && typeof s.subscribe === 'function' && typeof s.getState === 'function', '没有找到 store');
      const before = s.getState();
      s.setState({ bears: 5 });
      t.assert(s.getState() !== before && before.bears === 2, 'setState 修改了旧的 state 对象。要创建新对象：{ ...state, ...next }。否则用整个 state 当快照的组件不会更新');
      let calls = 0;
      const un = s.subscribe(() => calls++);
      t.assert(typeof un === 'function', 'subscribe 应返回一个取消订阅的函数');
      s.setState({ honey: 1 });
      t.assert(calls === 1, `订阅后 setState 一次，监听函数应被调用 1 次，实际是 ${calls} 次`);
      un(); s.setState({ honey: 0 });
      t.assert(calls === 1, '取消订阅后，store 变化不应再通知这个函数');
      await t.wait(50);
      s.setState({ bears: 7 });
      await Promise.resolve();
      t.assert(t.text('#bears') === '7', `在组件外调用 store.setState({ bears: 7 }) 后，界面没有在同一轮里更新（实际是 ${t.text('#bears')}）。useStore 是用 useSyncExternalStore 订阅的吗？自己用 useState + useEffect 订阅，更新会晚一步，并发渲染时还可能出现“撕裂”`);
    },
  },
  checkOnly: [
    {
      q: `把第一项改名为“青苹果”后，<code>&lt;p&gt;</code> 显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [items, setItems] = useState([
  { id: 1, name: '苹果' }, { id: 2, name: '香蕉' },
]);
const [selected, setSelected] = useState(items[0]);

function rename() {
  setItems(items.map(i =&gt; i.id === 1 ? { ...i, name: '青苹果' } : i));
}
// …
&lt;p&gt;{items[0].name} | 已选：{selected.name}&lt;/p&gt;</code></pre></div>`,
      options: ['青苹果 | 已选：青苹果', '青苹果 | 已选：苹果', '苹果 | 已选：苹果', '报错'],
      answer: 1,
      explain: 'selected 保存的是旧对象。改名时创建了新对象，selected 仍指向旧的。同一份数据存了两处，就会不同步。更好的设计：只存 <code>selectedId</code>，渲染时用 <code>items.find(i =&gt; i.id === selectedId)</code> 算出选中项。',
    },
    {
      q: `组件用 <code>useSyncExternalStore(store.subscribe, store.get)</code> 读取 store。调用 <code>store.inc()</code> 后，界面会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const state = { count: 0 };
const store = {
  get: () =&gt; state,
  inc() {
    state.count++;
    listeners.forEach(l =&gt; l());
  },
  // subscribe 省略
};</code></pre></div>`,
      options: ['正常显示新数字', '不更新：get 返回的仍是同一个对象，React 认为快照没变', '报错：state 必须是数组', '无限循环'],
      answer: 1,
      explain: 'useSyncExternalStore 用 Object.is 比较前后两次 getSnapshot 的返回值。这里修改了原对象，返回的还是同一个引用，React 就跳过渲染。修复：每次更新创建新对象，例如 <code>state = { ...state, count: state.count + 1 }</code>（state 改用 let 声明）。',
    },
    {
      q: `mousePos 每秒变化 60 次。很多组件只读 theme，却也跟着每秒重新渲染 60 次。最合适的改法是？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;AppCtx.Provider value={{ user, theme, mousePos }}&gt;
  &lt;Page /&gt;
&lt;/AppCtx.Provider&gt;</code></pre></div>`,
      options: [
        '用 useMemo 包住 value 对象',
        '用 memo 包裹所有只读 theme 的组件',
        '把 value 改成数组 [user, theme, mousePos]',
        '把 mousePos 拆到单独的 Context 或外部 store',
      ],
      answer: 3,
      explain: 'Context 的 value 一变，所有读取它的组件都会重新渲染，不管它们用到哪个字段。mousePos 一直在变，所以 useMemo 也拦不住：它的依赖里有 mousePos。memo 也没用：memo 只比较 props，Context 变化会绕过它。把变化频繁的数据拆出去，只订阅它的组件才更新。useMemo 是最有迷惑性的选项，它只在“value 内容没变、对象却是新的”时有用。',
    },
  ],
  plays: {
    '亲手实现 Zustand': {
      note: '看控制台：吃蜂蜜时，只有 HoneyPot 重新渲染；加一只熊时，只有 BearCounter 重新渲染。每个组件只订阅 selector 选出的值，这个值没变，React 就跳过它。这是 selector 优于单个大 Context 的地方。',
      predict: {
        q: '点击“吃蜂蜜”。控制台会新增哪些输出？',
        options: ['BearCounter 和 HoneyPot 都渲染', '只有 HoneyPot 渲染', '三个组件都渲染', '没有输出'],
        answer: 1,
        explain: '每个组件只订阅 selector 选出的值。bears 没变，BearCounter 的快照不变，React 跳过它。如果把整个 state 放进一个 Context，所有消费者都会重新渲染。',
      },
      pkey: 'state-architecture|亲手实现 Zustand',
    },
  },
};
