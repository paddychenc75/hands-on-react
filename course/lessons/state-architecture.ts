import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/state-architecture.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'state-architecture',
  stage: 3,
  title: '状态管理架构',
  mins: 40,
  localMins: 30,
  summary: '区分服务端状态与客户端状态，理解外部 store 的原理，亲手实现一个，再用真的 Zustand 做持久化。',
  goals: [
    '能把一个 state 归类（局部、服务端、全局客户端、URL、表单），并选出合适的工具',
    '能用 useSyncExternalStore 把外部 store 接入组件',
    '能写出支持 selector 的迷你 Zustand，并用真的 Zustand 的 create、persist、useShallow 做同样的事',
    '能解释 selector 为什么能减少重新渲染',
  ],
  keyPoints: [
    '先给 state 分类。从 API 来的数据是服务端状态，交给 TanStack Query 这类库。搜索词、页码放进 URL。真正的全局客户端 state 通常很少。',
    '外部 store 要提供两样东西：<code>subscribe(callback)</code> 返回取消订阅的函数，<code>getSnapshot()</code> 返回当前值。<code>useSyncExternalStore</code> 用它们把 store 接入组件。',
    'selector 只选出组件需要的那一部分。React 用 <code>Object.is</code> 比较快照，选出的值没变，组件就不重新渲染。',
    '更新 store 时要创建新对象，不要修改旧对象。<code>persist</code> 中间件把 state 存进存储（默认 localStorage），创建 store 时再读回来。',
    '常见坑：selector 每次返回新对象，例如 <code>s =&gt; ({ a: s.a })</code>。快照永远“变了”，会无限渲染。用 <code>useShallow</code> 包住选择器，或者拆成几个返回原始值的选择器。',
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
      explain:
        '服务端状态需要缓存、去重、失效和重新获取，专门的库都处理好了。Redux 也能做，但这些逻辑都要自己写。Context 方案不会自动刷新，而且数据一变，所有消费者都会重新渲染。',
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
      explain:
        'getSnapshot 必须在没有变化时返回相同引用。这个 selector 每次都返回新对象，React 认为快照一直在变。第一项是常见误解：React 不会比较对象的内容。要返回对象时，用 useShallow 这类浅比较工具。',
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
      explain:
        '链接里只带着 URL。把关键词和页码放进查询参数，分享、刷新、前进后退都能还原同一个页面。最有迷惑性的是 localStorage：刷新后确实能保留，但它只存在你自己的浏览器里，同事打开链接时读不到。全局 store 和组件 state 在刷新后就丢了。',
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
    test: async t => {
      t.assert(
        t.text('#bears') === '0' && t.text('#honey') === '10',
        `初始应为熊 0、蜂蜜 10，实际是熊 ${t.text('#bears') || '空'}、蜂蜜 ${t.text('#honey') || '空'}。getState 和 useStore 返回了正确的值吗？`,
      );
      const honeyR = t.text('#honey-renders'),
        bearR0 = t.text('#bear-renders');
      await t.click('#add-bear');
      await t.click('#add-bear');
      t.assert(t.text('#bears') === '2', `点两次“加一只熊”后应为 2，实际是 ${t.text('#bears')}。setState 支持函数吗？通知 listeners 了吗？`);
      t.assert(
        t.text('#honey') === '10',
        `加熊后蜂蜜应仍为 10，实际是 ${t.text('#honey') || '空'}。setState 要把修改的部分合并进旧 state，而不是替换整个 state`,
      );
      t.assert(
        t.text('#honey-renders') === honeyR,
        `加熊时 HoneyPot 也重新渲染了（${honeyR} → ${t.text('#honey-renders')}）。getSnapshot 返回的是整个 state 吗？它每次都是新对象。让 getSnapshot 返回 selector 选出的值`,
      );
      const bearR = t.text('#bear-renders');
      t.assert(bearR !== bearR0, 'BearCounter 应该在熊的数量变化时重新渲染');
      await t.click('#eat');
      t.assert(
        t.text('#honey') === '9' && t.text('#bears') === '2',
        `吃蜂蜜后应为熊 2、蜂蜜 9，实际是熊 ${t.text('#bears') || '空'}、蜂蜜 ${t.text('#honey') || '空'}。setState 也要支持直接传对象`,
      );
      t.assert(t.text('#bear-renders') === bearR, '吃蜂蜜时 BearCounter 也重新渲染了。它只选了 bears，bears 没变就不该渲染');
      const s = t.exports.store;
      t.assert(s && typeof s.subscribe === 'function' && typeof s.getState === 'function', '没有找到 store');
      const before = s.getState();
      s.setState({ bears: 5 });
      t.assert(
        s.getState() !== before && before.bears === 2,
        'setState 修改了旧的 state 对象。要创建新对象：{ ...state, ...next }。否则用整个 state 当快照的组件不会更新',
      );
      let calls = 0;
      const un = s.subscribe(() => calls++);
      t.assert(typeof un === 'function', 'subscribe 应返回一个取消订阅的函数');
      s.setState({ honey: 1 });
      t.assert(calls === 1, `订阅后 setState 一次，监听函数应被调用 1 次，实际是 ${calls} 次`);
      un();
      s.setState({ honey: 0 });
      t.assert(calls === 1, '取消订阅后，store 变化不应再通知这个函数');
      await t.wait(50);
      s.setState({ bears: 7 });
      await Promise.resolve();
      t.assert(
        t.text('#bears') === '7',
        `在组件外调用 store.setState({ bears: 7 }) 后，界面没有在同一轮里更新（实际是 ${t.text('#bears')}）。useStore 是用 useSyncExternalStore 订阅的吗？自己用 useState + useEffect 订阅，更新会晚一步，并发渲染时还可能出现“撕裂”`,
      );
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
      explain:
        'selected 保存的是旧对象。改名时创建了新对象，selected 仍指向旧的。同一份数据存了两处，就会不同步。更好的设计：只存 <code>selectedId</code>，渲染时用 <code>items.find(i =&gt; i.id === selectedId)</code> 算出选中项。',
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
      explain:
        'useSyncExternalStore 用 Object.is 比较前后两次 getSnapshot 的返回值。这里修改了原对象，返回的还是同一个引用，React 就跳过渲染。修复：每次更新创建新对象，例如 <code>state = { ...state, count: state.count + 1 }</code>（state 改用 let 声明）。',
    },
    {
      q: `mousePos 每秒变化 60 次。很多组件只读 theme，却也跟着每秒重新渲染 60 次。最合适的改法是？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;AppCtx value={{ user, theme, mousePos }}&gt;
  &lt;Page /&gt;
&lt;/AppCtx&gt;</code></pre></div>`,
      options: [
        '用 useMemo 包住 value 对象',
        '用 memo 包裹所有只读 theme 的组件',
        '把 value 改成数组 [user, theme, mousePos]',
        '把 mousePos 拆到单独的 Context 或外部 store',
      ],
      answer: 3,
      explain:
        'Context 的 value 一变，所有读取它的组件都会重新渲染，不管它们用到哪个字段。mousePos 一直在变，所以 useMemo 也拦不住：它的依赖里有 mousePos。memo 也没用：memo 只比较 props，Context 变化会绕过它。把变化频繁的数据拆出去，只订阅它的组件才更新。useMemo 是最有迷惑性的选项，它只在“value 内容没变、对象却是新的”时有用。',
    },
    {
      q: '一个电商应用有下面四份 state。哪一份最适合交给 TanStack Query 这类库管理，而不是自己放进全局 store？',
      options: ['用户选的深色或浅色主题', '商品列表页当前在第几页（要能分享链接）', '从 /api/products 取回的商品列表', '“加入购物车”弹窗是否打开'],
      answer: 2,
      explain:
        '商品列表来自服务器，别人也可能改它，它是服务端状态：缓存、去重、失效和重新获取都该交给查询库。页码要能分享，应该放进 URL。弹窗开关是局部 UI 状态，一个组件的 useState 就够。主题是全局客户端状态，最有迷惑性：它确实要跨组件共享，但它不是从服务器取回的数据，查询库帮不上忙。',
    },
    {
      q: `store 用了 <code>persist</code>。<code>count</code> 加到 5 后，<code>localStorage['counter']</code> 里存的是什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const useCounter = create(
  persist(
    (set) =&gt; ({
      count: 0,
      inc: () =&gt; set((s) =&gt; ({ count: s.count + 1 })),
    }),
    { name: 'counter' },
  ),
);</code></pre></div>`,
      options: ['{"count":5}', '不存：inc 是函数，不能序列化，整个 state 都存不了', '{"state":{"count":5},"version":0}', '{"count":5,"inc":null}'],
      answer: 2,
      explain:
        'persist 存的是 <code>{ state, version }</code>。JSON 序列化会丢掉函数，所以只剩 count。不会因为有函数就整个存不了。第一项最有迷惑性：少了外面这一层 <code>state</code> 和 <code>version</code>。',
    },
    {
      q: '组件只需要 a 和 b 两个字段。在 Zustand v5 里，哪种写法会无限渲染？',
      options: [
        'const a = useStore(s => s.a); const b = useStore(s => s.b);',
        'const [a, b] = useStore(useShallow(s => [s.a, s.b]));',
        'const { a, b } = useStore();',
        'const [a, b] = useStore(s => [s.a, s.b]);',
      ],
      answer: 3,
      explain:
        '选择器每次返回新数组，快照永远“变了”，v5 会无限渲染。第一项每次返回原始值，没有问题。第二项用 useShallow 逐项比较，也没有问题。第三项不传选择器，返回的是整个 state。它能正常工作，但任何字段变化都会让组件重新渲染。',
    },
  ],
  plays: {
    '亲手实现 Zustand': {
      note: '看控制台：吃蜂蜜时，只有 HoneyPot 重新渲染；加一只熊时，只有 BearCounter 重新渲染。每个组件只订阅 selector 选出的值，这个值没变，React 就跳过它。这是 selector 优于单个大 Context 的地方。',
      predict: {
        q: '点击“吃蜂蜜”。控制台会新增哪些输出？',
        options: ['BearCounter 和 HoneyPot 都渲染', '只有 HoneyPot 渲染', '三个组件都渲染', '没有输出'],
        answer: 1,
        explain:
          '每个组件只订阅 selector 选出的值。bears 没变，BearCounter 的快照不变，React 跳过它。如果把整个 state 放进一个 Context，所有消费者都会重新渲染。',
      },
      pkey: 'state-architecture|亲手实现 Zustand',
    },
    '真库：create、选择器与组件外读写': {
      note: '<code>subscribe</code> 的 listener 在 <code>setState</code> 里同步调用，所以日志先出现；组件的重新渲染由 React 安排在随后。组件里的 <code>useBear</code> 订阅了同一个 store，所以在组件外调用 <code>setState</code>，组件照样更新。再点“加一只熊”：蜂蜜没变，<code>subscribe</code> 的 listener 仍然被调用，因为它不经过选择器；组件则只有 BearCounter 渲染。',
      predict: {
        q: '点击一次“组件外：蜂蜜 +5”。控制台新增哪些行，顺序是？',
        options: [
          'HoneyPot 渲染，然后 store 变了：蜂蜜 10 → 15',
          '只有 store 变了：蜂蜜 10 → 15。在组件外改 store，组件不会更新',
          'store 变了：蜂蜜 10 → 15，然后 HoneyPot 渲染',
          'store 变了：蜂蜜 10 → 15，然后 BearCounter 渲染、HoneyPot 渲染',
        ],
        answer: 2,
        explain:
          'setState 先更新 state，同步调用 listener（日志先出现），然后 React 重新渲染订阅了 honey 的 HoneyPot。BearCounter 选的 bears 没变，不渲染。组件外的 setState 和组件里的 set 作用在同一个 store 上，组件都会更新。',
      },
      pkey: 'state-architecture|真库：create、选择器与组件外读写',
    },
    '真库：persist 持久化': {
      note: '示例只用 localStorage 里的 <code>hoc-demo-zustand</code> 这一个键，存的内容是 <code>{"state":{"count":3},"version":0}</code>，函数 <code>inc</code> 不在里面。重新运行相当于刷新页面：代码重新执行，创建新的 store，<code>persist</code> 在创建时把存储里的值读回来。点“清除存储并重置”会删掉这个键。如果浏览器不允许使用 localStorage，示例退回内存存储，重新运行后计数是 0。',
      predict: {
        q: '点“+1”三次，再点实验台右上角的“▶ 运行”（重新执行代码，相当于刷新页面）。预览里的“计数”显示几？',
        options: ['3', '0：重新执行代码会创建新的 store，数据重置', '1：只存了最近一次的增量', '报错：同一个键不能创建两次'],
        answer: 0,
        explain:
          '三次更新都被写进了 localStorage。重新运行时创建新的 store，persist 先把存储里的值读回来，所以显示 3。第二项是没有 persist 时的结果。（localStorage 不可用时示例退回内存存储，才会显示 0。）',
      },
      pkey: 'state-architecture|真库：persist 持久化',
    },
    '真库：选择器返回新对象与 useShallow': {
      note: 'Zustand v5 用 <code>useSyncExternalStore</code> 订阅，选择器每次返回新对象，快照就永远“变了”：React 警告 getSnapshot 的结果没有缓存，渲染到 50 次的上限后抛出 <code>Maximum update depth exceeded</code>，由 Box 接住显示。写法 B 里 <code>useShallow</code> 逐字段比较，a、b 没变就沿用上次的对象：点“改 c”不渲染 PairB，点“改 a”渲染一次。',
      predict: {
        q: '点“挂载写法 A”。会发生什么？',
        options: [
          '正常显示 A：a = 1，b = 2，只渲染一次',
          '先多渲染几次，随后稳定下来，显示 A：a = 1，b = 2',
          '显示 a = undefined，b = undefined',
          'React 一直重新渲染，超过上限后抛出错误，由 Box 显示出来',
        ],
        answer: 3,
        explain:
          '选择器每次返回新对象，React 用 Object.is 比较前后两次快照，永远不相等，于是一直重新渲染，直到超过上限报错。在 Zustand v5 里就是这个结果，不是“多渲染几次”。用 useShallow 包住选择器就能解决（写法 B）。',
      },
      pkey: 'state-architecture|真库：选择器返回新对象与 useShallow',
    },
  },
} satisfies Lesson;
