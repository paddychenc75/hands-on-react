import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/concurrent.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'concurrent',
  stage: 2,
  title: '并发特性：useTransition 与 useDeferredValue',
  mins: 40,
  summary: '区分紧急和不紧急的更新，让界面在繁重新渲染时依然流畅。',
  goals: [
    '能判断一个更新是紧急更新还是过渡更新，并用 useTransition 把它标记为过渡更新',
    '能用 useDeferredValue 和 memo 让输入框在慢列表重新渲染时保持流畅，并在它和 useTransition 之间做出选择',
    '能说出异步过渡里 isPending 的变化，以及 await 之后的更新为什么要再包一层 startTransition',
    '能用 <code>&lt;Activity&gt;</code> 隐藏一块界面并保留它的 state，并说出它和条件渲染、CSS 隐藏的区别',
  ],
  keyPoints: [
    '紧急更新（打字、点击）要立刻反馈。过渡更新（筛选大列表、切换标签页）可以慢一点，还可以被打断。',
    '<code>useTransition</code> 返回 <code>[isPending, startTransition]</code>。把不紧急的 set 函数调用放进 <code>startTransition</code>。常见坑：把输入框自己的 state 放进去，输入框的 value 必须同步更新，否则会丢字或卡顿。',
    '<code>useDeferredValue(value)</code> 返回一个滞后的值。慢的子组件要用 <code>memo</code> 包裹，紧急渲染时才能跳过它。',
    '并发特性不减少计算量，只让慢渲染可以被打断。要减少计算，还要靠 memo、虚拟列表或少渲染一些内容。',
    '想隐藏界面又保留 state，用 <code>&lt;Activity mode="hidden"&gt;</code>：state 和 DOM 都留着，effect 被清理，隐藏的子树以较低优先级渲染，显示时 effect 重新运行。条件渲染会丢 state，CSS 隐藏不会清理 effect。',
  ],
  quiz: [
    {
      q: '搜索页有一个输入框和一个 5000 条的结果列表。下面哪个更新最适合放进 startTransition？',
      options: ['输入框的 value', '根据搜索词筛选并渲染结果列表', '提交按钮的禁用状态', '“只看有货”复选框的勾选状态（checked）'],
      answer: 1,
      explain:
        '结果列表渲染很慢，晚一点出现用户可以接受，它是过渡更新。最容易误选输入框的 value：它必须同步更新，否则打字会丢字或卡顿。复选框的勾选是用户直接操作的反馈，也要立刻显示。',
    },
    {
      q: 'SearchResults 只通过 props 收到 query。父组件是别的团队维护的，你改不了它的 onChange。怎样在 SearchResults 里让慢列表不拖慢输入？',
      options: [
        '调用 useTransition，用 startTransition 包住 props.query',
        'const deferred = useDeferredValue(query)，把 deferred 传给用 memo 包裹的慢列表',
        '用 useEffect 把 query 复制进自己的 state，再用 setTimeout 延迟 300ms 更新',
        '给慢列表加 key={query}，让它每次都重新挂载',
      ],
      answer: 1,
      explain:
        '拿不到 set 函数时，就延迟“值”：useDeferredValue 返回滞后的 query，memo 让慢列表在紧急渲染时跳过。最有迷惑性的是第一项：startTransition 包的是一次 set 函数调用，读取 props 不是更新，包了也没有作用。setTimeout 有固定延迟，还多一轮渲染。key 会让列表每次都从头挂载，更慢。',
    },
    {
      q: '用了 useDeferredValue，但慢列表 &lt;SlowList text={deferredText} /&gt; 没有用 memo 包裹。快速打字时会怎样？',
      options: [
        '仍然流畅：deferredText 会延迟更新，慢列表自然也跟着延迟',
        '仍然卡顿：SlowList 照样随父组件重新渲染',
        '列表永远不更新',
        '报错：useDeferredValue 必须配合 memo',
      ],
      answer: 1,
      explain:
        '紧急渲染时，deferredText 还是旧值，但没有 memo 的 SlowList 照样随父组件重新渲染，慢的工作一点也没少。memo 让它在 props 没变时跳过这次渲染，后台渲染才去处理新值。',
    },
    {
      q: '标签页 B 的内容放在 &lt;Activity mode={tab === "b" ? "visible" : "hidden"}&gt; 里，里面有一个输入框和一个订阅消息的 effect。用户在输入框里打了字，然后切到标签页 A。B 里的输入框和 effect 分别怎样？',
      options: [
        '输入框的文字保留，effect 被清理；切回 B 时 effect 重新运行',
        '输入框的文字丢失，effect 被清理',
        '输入框的文字保留，effect 继续运行，和 CSS 隐藏一样',
        '输入框的文字丢失，effect 继续运行',
      ],
      answer: 0,
      explain:
        'Activity 隐藏时保留 state 和 DOM，所以文字还在，但会清理 effect，订阅就不会在后台继续占资源。切回 visible 时，effect 重新运行。最迷惑的是第三项：它描述的是 CSS 隐藏（display: none）。CSS 只改样式，React 不知道界面被隐藏，effect 一直在运行。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>在输入框里快速打字，感受卡顿：每输入一个字，400 项的慢列表都要同步重新渲染。</li><li>让输入框保持流畅：输入框立刻显示新字，列表稍后再更新。用 <code>useDeferredValue</code> 或 <code>useTransition</code> 都可以。不要用 setTimeout 防抖。</li><li>列表还没跟上输入时，把 <code>#results</code> 的 <code>opacity</code> 设为 0.5；跟上后恢复为 1。</li><li>不要修改 <code>SlowItem</code>，也不要减少列表的项数。</li></ol>',
    starter: `import { useState, useDeferredValue, memo } from 'react';

const ITEMS = Array.from({ length: 400 }, (_, i) => '商品 ' + (i + 1));

// 一个故意很慢的列表项：每项渲染耗时 1ms（不要修改）
function SlowItem({ text }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}
  return <li>{text}</li>;
}

function ResultList({ query }) {
  const shown = ITEMS.filter(x => x.includes(query));
  return (
    <>
      <p>找到 <span id="count">{shown.length}</span> 项</p>
      <ul style={{ height: 140, overflow: 'auto' }}>
        {shown.map(x => <SlowItem key={x} text={x} />)}
      </ul>
    </>
  );
}

function App() {
  const [query, setQuery] = useState('');
  return (
    <div>
      <input id="q" value={query} onChange={e => setQuery(e.target.value)} placeholder="输入数字筛选，例如 12" />
      <div id="results">
        <ResultList query={query} />
      </div>
    </div>
  );
}`,
    solution: `import { useState, useDeferredValue, memo } from 'react';

const ITEMS = Array.from({ length: 400 }, (_, i) => '商品 ' + (i + 1));

// 一个故意很慢的列表项：每项渲染耗时 1ms（不要修改）
function SlowItem({ text }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}
  return <li>{text}</li>;
}

const ResultList = memo(function ResultList({ query }) {
  const shown = ITEMS.filter(x => x.includes(query));
  return (
    <>
      <p>找到 <span id="count">{shown.length}</span> 项</p>
      <ul style={{ height: 140, overflow: 'auto' }}>
        {shown.map(x => <SlowItem key={x} text={x} />)}
      </ul>
    </>
  );
});

function App() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const stale = query !== deferredQuery;
  return (
    <div>
      <input id="q" value={query} onChange={e => setQuery(e.target.value)} placeholder="输入数字筛选，例如 12" />
      <div id="results" style={{ opacity: stale ? 0.5 : 1 }}>
        <ResultList query={deferredQuery} />
      </div>
    </div>
  );
}`,
    hint: '1. 输入框的 state 要同步更新，慢列表用一个“滞后”的值。哪个 Hook 能给你这个值？2. 紧急渲染时，父组件仍会重新渲染。慢列表怎样才能跳过这次渲染？3. 新值和滞后的值不相等，就说明列表还没跟上。',
    faded: `import { useState, useDeferredValue, memo } from 'react';

const ITEMS = Array.from({ length: 400 }, (_, i) => '商品 ' + (i + 1));

// 一个故意很慢的列表项：每项渲染耗时 1ms（不要修改）
function SlowItem({ text }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}
  return <li>{text}</li>;
}

const ResultList = /* ✏️ 包一层什么，让 query 没变时跳过这个慢组件？ */(function ResultList({ query }) {
  const shown = ITEMS.filter(x => x.includes(query));
  return (
    <>
      <p>找到 <span id="count">{shown.length}</span> 项</p>
      <ul style={{ height: 140, overflow: 'auto' }}>
        {shown.map(x => <SlowItem key={x} text={x} />)}
      </ul>
    </>
  );
});

function App() {
  const [query, setQuery] = useState('');
  /* ✏️ 得到一个“滞后”的 query，交给慢列表使用 */
  /* ✏️ 算出列表是否还没跟上输入 */
  return (
    <div>
      <input id="q" value={query} onChange={e => setQuery(e.target.value)} placeholder="输入数字筛选，例如 12" />
      <div id="results" style={{ opacity: stale ? 0.5 : 1 }}>
        <ResultList query={deferredQuery} />
      </div>
    </div>
  );
}`,
    test: async t => {
      t.assert(/performance\.now\(\)\s*-\s*start\s*<\s*1\b/.test(t.source), '请不要修改 SlowItem：练习要在“列表就是很慢”的前提下让输入保持流畅');
      for (let i = 0; i < 50 && t.text('#count') !== '400'; i++) await t.wait(100);
      t.assert(t.text('#count') === '400', `输入框为空时，应找到 400 项，实际是 ${t.text('#count') || '（没有 #count）'}`);
      // 读 React 根节点上还没完成的更新：过渡更新（startTransition、useDeferredValue）有专门的优先级。
      // 依赖 React 19.3.x 的 FiberRoot.pendingLanes 位掩码（经 t.internals 读）；结构不认识时 inTransition 返回 null，下面退回纯行为断言
      const inter = t.internals;
      const fiberRoot = inter.rootOf(t.root);
      const inTransition = (): boolean | null => inter.inTransition(fiberRoot);
      const structural = inTransition() !== null;
      const usesTimer = /setTimeout\s*\(/.test(t.source);
      const input = t.q('#q');
      t.assert(input, '找不到输入框 #q');
      const setVal = v => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, v);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      };
      const results = t.q('#results');
      t.assert(results, '找不到 #results');
      const opacityNow = () => Number(getComputedStyle(results).opacity);
      const bl = await t.baseline();
      // 输入一个字的响应时间：阈值相对基线。段落可重复：开头先把输入清空，等列表回到 400 项
      let dim = '';
      await t.retry(async () => {
        setVal('');
        for (let i = 0; i < 80 && (t.text('#count') !== '400' || inTransition()); i++) await t.wait(100);
        const t0 = performance.now();
        setVal('1');
        await Promise.resolve();
        const dt = performance.now() - t0;
        t.assert(input.value === '1', '输入后，输入框应立刻显示新字。不要把输入框自己的 state 放进 startTransition');
        dim = getComputedStyle(results).opacity;
        t.timing(
          dt < bl.limit(60),
          `输入一个字时，主线程被占用了约 ${Math.round(dt)} ms，输入框会卡顿。` +
            (/memo\s*\(/.test(t.source)
              ? '列表是在紧急渲染里重新渲染的吗？检查传给慢列表的是不是滞后的值。'
              : '紧急渲染时，父组件重新渲染会带上慢列表。用 memo 包裹它，让它在 props 没变时跳过。'),
        );
        if (structural) {
          t.assert(
            inTransition(),
            '输入后，React 里没有排队的过渡更新：列表的更新没有交给 React 调度。' +
              (usesTimer
                ? 'setTimeout 防抖是按固定延迟推迟更新，不是本课的做法。请把列表用的值交给 useDeferredValue，或把列表的 set 函数调用直接放进 startTransition'
                : '请用 useDeferredValue 得到一个滞后的值传给列表，或把列表的 set 函数调用放进 startTransition'),
          );
        }
      });
      setVal('12');
      await Promise.resolve();
      t.assert(input.value === '12', '连续输入时，输入框应显示 12');
      if (!structural) {
        // 内部结构不认识：退回行为断言。setTimeout 防抖也会推迟更新，只能靠源码补一道
        t.assert(
          !usesTimer,
          'setTimeout 防抖是按固定延迟推迟更新，不是本课的做法。请把列表用的值交给 useDeferredValue，或把列表的 set 函数调用直接放进 startTransition',
        );
      }
      t.assert(Number(dim) === 0.5, `列表还没跟上输入时，#results 的 opacity 应为 0.5，实际是 ${dim}。比较一下新值和滞后的值`);
      const wrongCount = () =>
        `过渡更新完成时，列表应显示 14 项，实际是 ${t.text('#count')}。` +
        (usesTimer
          ? '列表是不是还在等一个定时器？startTransition 要直接包住列表的 set 函数调用，不要再用 setTimeout 推迟'
          : '滞后的值或过渡里的 state 有没有传给列表？');
      const deadline = performance.now() + 6000;
      if (structural) {
        // 等过渡更新全部完成。完成的那一刻，列表必须已经是新结果，不能再等定时器
        while (inTransition() && performance.now() < deadline) await t.wait(0);
        t.assert(!inTransition(), '6 秒后，过渡更新仍没有完成');
        t.assert(t.text('#count') === '14', wrongCount());
      } else {
        // 没有内部状态可看：轮询到列表是 14 项且不再变淡（带超时）
        while (!(t.text('#count') === '14' && opacityNow() === 1) && performance.now() < deadline) await t.wait(20);
        t.assert(t.text('#count') === '14', wrongCount());
      }
      t.assert(t.qa('#results li').length === 14, '列表的 li 数量应与“找到 N 项”一致');
      await t.wait(50);
      t.assert(opacityNow() === 1, '列表跟上输入后，#results 的 opacity 应恢复为 1');
    },
  },
  checkOnly: [
    {
      q: `第一次渲染时 text 是空字符串。输入一个字母“a”后，控制台依次新增哪些输出（不考虑严格模式）？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [text, setText] = useState('');
const deferred = useDeferredValue(text);
console.log(JSON.stringify(text), JSON.stringify(deferred));</code></pre></div>`,
      options: ['"a" ""，然后 "a" "a"', '只有 "a" "a"', '"" "a"，然后 "a" "a"', '只有 "a" ""'],
      answer: 0,
      explain:
        'useDeferredValue 让 React 先做一次紧急渲染：text 已是新值，deferred 仍是旧值。然后 React 在后台再渲染一次，这次 deferred 也更新为 "a"。所以输入框立刻响应，依赖 deferred 的慢列表稍后更新。',
    },
    {
      q: `同事想让输入更流畅，这样写了受控输入框。会出现什么问题？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [query, setQuery] = useState('');
const [isPending, startTransition] = useTransition();

&lt;input
  value={query}
  onChange={e =&gt; startTransition(() =&gt; setQuery(e.target.value))}
/&gt;</code></pre></div>`,
      options: [
        '没有问题，输入更流畅了',
        '输入框的值也变成了不紧急的更新，可能显示滞后或卡顿；输入框的 state 应该同步更新',
        '报错：onChange 里不能调用 startTransition',
        'isPending 永远是 false',
      ],
      answer: 1,
      explain:
        '受控输入框的 value 必须立刻更新，否则用户会感到输入延迟。React 文档明确说明：不要用过渡更新控制文本输入。正确做法：<ol class="task-steps"><li>用普通的 set 函数更新输入框的 state。</li><li>把昂贵的结果列表放进 startTransition，或者用 useDeferredValue。</li></ol>',
    },
    {
      q: `SlowPosts 由几百个小组件组成，渲染一共要 1 秒。点击“文章”后的这 1 秒内，页面怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [tab, setTab] = useState('about');
const [isPending, startTransition] = useTransition();

&lt;button onClick={() =&gt; startTransition(() =&gt; setTab('posts'))}&gt;
  文章
&lt;/button&gt;
{isPending &amp;&amp; &lt;span&gt;切换中…&lt;/span&gt;}
{tab === 'posts' ? &lt;SlowPosts /&gt; : &lt;About /&gt;}</code></pre></div>`,
      options: [
        '页面卡住 1 秒，然后显示文章',
        '先显示空白，1 秒后显示文章',
        '仍显示 About 和“切换中…”，可被打断',
        '立刻显示文章的框架，后台再慢慢补全每一行内容',
      ],
      answer: 2,
      explain:
        '过渡更新不紧急。React 先做一次紧急渲染：tab 还是旧值，isPending 为 true，所以显示 About 和“切换中…”。然后在后台渲染 SlowPosts。它在组件之间会让出主线程，所以用户还能点击，新的点击会打断这次渲染。“页面卡住 1 秒”是不用 startTransition 时的表现。注意：如果 SlowPosts 是一个耗时 1 秒的单个组件，React 也无法在它中间打断。',
    },
    {
      q: `点击“保存”，0.8 秒后保存完成。<code>name</code> 变成“新”的那次渲染里，<code>isPending</code> 是什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [isPending, startTransition] = useTransition();
const [name, setName] = useState('旧');

startTransition(async () =&gt; {
  const saved = await save();
  setName(saved);
});</code></pre></div>`,
      options: ['false：保存结束了', 'true，下一次渲染才变回 false', '一直是 false，async 函数不会让 isPending 变成 true', '报错：await 之后不能调用 set 函数'],
      answer: 1,
      explain:
        'isPending 在整个异步函数运行期间都是 true。await 之后的 setName 不属于这次过渡，它触发一次紧急渲染，这时 isPending 仍是 true。函数结束后又渲染一次，isPending 才变回 false。想让 setName 也是过渡更新，就在 await 之后再包一层 startTransition。',
    },
  ],
  plays: {
    三种隐藏方式: {
      note: '条件渲染的输入框在隐藏时被卸载，文字丢失，effect 被清理，显示时重新开始。CSS 隐藏的输入框保留文字，但 effect 没有任何日志：React 不知道它被隐藏，effect 一直在运行。Activity 里的输入框保留文字，同时 effect 被清理，显示时又运行一次。',
      predict: {
        q: '在三个输入框里各打几个字，点“隐藏”，再点“显示”。哪些输入框里的字还在？',
        options: ['三个都在', '只有条件渲染的丢了，另外两个还在', '只有 Activity 里的还在', '三个都丢了'],
        answer: 1,
        explain: '条件渲染把组件卸载了，state 随之丢失。CSS 隐藏只改样式，组件一直挂载着。Activity 隐藏时保留 state 和 DOM，只清理 effect。',
      },
      pkey: 'rendering|三种隐藏方式', // 示例原来在渲染机制一课，预测键保持原样，学习者的预测记录才不会丢
    },
    隐藏的子树晚一步渲染: {
      note: '点一次“n + 1”，控制台新增四行：可见区先渲染、先提交，隐藏区的渲染排在可见区提交之后。隐藏区的“提交”一行从不出现，因为 effect 在隐藏时被清理，不会运行。隐藏的子树仍会随 props 更新，只是优先级低，排在可见内容后面。',
      predict: {
        q: '点一次“n + 1”。控制台里，“隐藏区 渲染，n = 1”出现在哪个位置？',
        options: ['在“可见区 渲染”之前', '在“可见区 渲染”和“可见区 提交”之间', '在“可见区 提交”之后', '不出现：隐藏的子树不会重新渲染'],
        answer: 2,
        explain: '隐藏的子树以较低的优先级渲染。React 先渲染并提交可见的部分，再找空档渲染隐藏的部分。',
      },
      pkey: 'concurrent|隐藏的子树晚一步渲染',
    },
    对比开启与关闭的输入体验: {
      note: '取消勾选后再快速打字，输入框会明显卡顿；勾选时输入始终流畅。',
    },
    '异步过渡的 isPending': {
      note: '点“保存 A”：控制台里 isPending 在整个 0.8 秒内都是 true。新名字出现的那次渲染，isPending 仍是 true，随后才有第三次渲染把它变回 false。点“保存 B”：await 之后又包了一层 startTransition，新名字和 isPending = false 在同一次渲染里出现。',
      predict: {
        q: '点“保存 A”。0.8 秒的等待期间，isPending 是什么？',
        options: ['一直是 true，直到整个异步函数结束', '只在点击的瞬间是 true，然后变回 false', '一直是 false', '报错：startTransition 不能接收 async 函数'],
        answer: 0,
        explain: 'React 19 的 startTransition 接收 async 函数，并在它运行的整个期间保持 isPending 为 true。React 18 只能传同步函数。',
      },
      pkey: 'concurrent|异步过渡的 isPending',
    },
    'useDeferredValue 的初始值': {
      note: '第一行里 deferred 是“（初始值）”，随后 React 立即在后台再渲染一次，第二行里 deferred 才变成“搜索词”。去掉第二个参数，首次渲染就直接用“搜索词”，只有一行。',
      predict: {
        q: '页面第一次渲染时，控制台最先打印的那一行里，deferred 是什么？',
        options: ['搜索词', '（初始值）', 'undefined', '先打印两行完全相同的'],
        answer: 1,
        explain: '第二个参数就是首次渲染用的值。首次渲染先用它，随后后台再渲染一次，换成真正的 query。',
      },
      pkey: 'concurrent|useDeferredValue 的初始值',
    },
    '用 useTransition 切换标签页': {
      note: '取消勾选，点“文章”，再立刻点“联系”：界面卡住约半秒。勾选后再试：可以立即切走，等待时显示“加载中…”。',
      predict: {
        q: '保持勾选“使用 startTransition”。点“文章（很慢）”，再立刻点“联系”。会怎样？',
        options: ['界面卡住约半秒，然后显示文章', '立即切到“联系”，文章的渲染被丢弃', '同时显示文章和联系', '报错'],
        answer: 1,
        explain:
          '过渡更新可以被打断。第二次点击到来时，React 先停下文章的渲染去处理点击。两次过渡更新会合并：tab 的最终值是“联系”，所以没渲染完的文章被丢弃。取消勾选后，渲染必须一次做完，界面会卡住。',
      },
      pkey: 'concurrent|用 useTransition 切换标签页',
    },
  },
} satisfies Lesson;
