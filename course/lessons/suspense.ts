import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/suspense.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'suspense',
  stage: 2,
  title: 'Suspense、懒加载与错误边界',
  mins: 40,
  summary: '优雅地处理“还没准备好”和“出错了”这两种状态。',
  goals: [
    '能用 lazy 和 Suspense 按需加载一个组件',
    '能写出一个错误边界组件',
    '能判断一个错误会不会被错误边界捕获',
    '能决定 Suspense 和错误边界包在哪一层',
    '能说出没有 Suspense 边界、fallback 的最短显示时间，以及用 startTransition 保留旧界面时用户看到什么',
  ],
  keyPoints: [
    '<code>lazy</code> 让组件在第一次渲染时才加载代码。加载期间，最近的 <code>Suspense</code> 显示 fallback。',
    '一个 Suspense 里的内容作为整体显示：全部就绪才一起出现。想分别出现，就各包一个 Suspense。',
    '错误边界是带 <code>static getDerivedStateFromError</code> 的 class 组件。它捕获子树在渲染、生命周期和 effect 中抛出的错误，显示备用界面。',
    '常见坑：事件处理函数和 setTimeout 里的错误，错误边界捕获不到，要自己用 try/catch。',
    '边界放在哪一层，决定出错时“断电”的范围。给相互独立的模块各包一个边界。',
  ],
  quiz: [
    {
      q: 'Dashboard 写了 &lt;Suspense fallback={&lt;Spinner /&gt;}&gt;&lt;Chart /&gt;&lt;/Suspense&gt;，Chart 用 lazy 加载。第一次显示 Chart 时，页面上会依次出现什么？',
      options: ['空白，代码加载完成后再显示 Chart', 'Spinner，加载完替换为 Chart', '报错：组件还没有加载', 'Spinner 和 Chart 同时出现'],
      answer: 1,
      explain:
        'Chart 的代码还没到时，它会“挂起”，最近的 Suspense 显示 fallback。代码加载完成后，React 用 Chart 替换 fallback。有 Suspense 包着，所以等待期间显示的是 fallback，不是空白。如果没有任何 Suspense：首次挂载时页面会一直空白到代码加载完；由点击这类同步更新引起的挂起，React 19 保持旧界面，等代码加载完再更新；React 18 会直接报错并清空界面。所以懒加载组件外面总要包一个 Suspense。',
    },
    {
      q: '错误边界能捕获以下哪种错误？',
      options: ['onClick 处理函数中抛出的错误', 'setTimeout 回调中的错误', '子组件渲染时抛出的错误', '错误边界自己 render 中的错误'],
      answer: 2,
      explain:
        '错误边界捕获子树在渲染、生命周期和 effect 中的错误。最容易误选 onClick：事件处理函数不在渲染过程中执行，React 不会把它的错误交给边界，要自己用 try/catch。',
    },
    {
      q: '同一个 Suspense 中有两个 lazy 组件，分别需要 1 秒和 3 秒加载。fallback 显示多久？',
      options: ['1 秒', '3 秒，等全部就绪后一起显示', '4 秒', '先显示快的，慢的位置显示 fallback'],
      answer: 1,
      explain: '一个 Suspense 边界内的内容作为整体显示。两个组件同时加载，所以是 3 秒，不是 4 秒。“先显示快的”需要给它们各包一个 Suspense。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>添加 <code>static getDerivedStateFromError</code>，出错时把 <code>hasError</code> 设为 true。</li><li><code>hasError</code> 为 true 时，渲染 <code>&lt;p id="fallback"&gt;出错了&lt;/p&gt;</code>。</li><li>否则渲染 <code>this.props.children</code>。</li><li>检查结果：第二个边界里没有错误，<code>#safe</code> 应正常显示。</li></ol>',
    starter: `import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  // 提示：static getDerivedStateFromError(error) { ... }

  render() {
    return this.props.children;
  }
}

function Bomb() {
  throw new Error('boom');
}

function App() {
  return (
    <div>
      <p id="ok">我不受影响</p>
      <ErrorBoundary><Bomb /></ErrorBoundary>
      <ErrorBoundary><p id="safe">正常内容</p></ErrorBoundary>
    </div>
  );
}`,
    solution: `import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <p id="fallback">出错了</p>;
    return this.props.children;
  }
}

function Bomb() {
  throw new Error('boom');
}

function App() {
  return (
    <div>
      <p id="ok">我不受影响</p>
      <ErrorBoundary><Bomb /></ErrorBoundary>
      <ErrorBoundary><p id="safe">正常内容</p></ErrorBoundary>
    </div>
  );
}`,
    hint: '错误边界分两步：1. 子树出错时，一个 static 方法返回新的 state。2. render 读取这个 state，决定显示备用界面还是 children。',
    faded: `import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    /* ✏️ 返回新的 state，记下“出错了” */
  }

  render() {
    /* ✏️ 出错时，返回 <p id="fallback">出错了</p> */
    return this.props.children;
  }
}

function Bomb() {
  throw new Error('boom');
}

function App() {
  return (
    <div>
      <p id="ok">我不受影响</p>
      <ErrorBoundary><Bomb /></ErrorBoundary>
      <ErrorBoundary><p id="safe">正常内容</p></ErrorBoundary>
    </div>
  );
}`,
    test: async t => {
      t.assert(/getDerivedStateFromError|componentDidCatch/.test(t.source), '请实现 static getDerivedStateFromError');
      t.assert(t.q('#ok'), '“我不受影响”应该正常显示（说明错误没有被边界拦住）');
      t.assert(t.text('#fallback') === '出错了', '应显示 <p id="fallback">出错了</p>');
      t.assert(t.q('#safe'), '没有出错的子树应正常显示 children，而不是备用界面');
    },
  },
  checkOnly: [
    {
      q: `Chart 是 lazy 组件。网络断开，加载它的 import 失败了。页面依次显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;ErrorBoundary fallback={&lt;p&gt;出错了&lt;/p&gt;}&gt;
  &lt;Suspense fallback={&lt;p&gt;加载中…&lt;/p&gt;}&gt;
    &lt;Chart /&gt;
  &lt;/Suspense&gt;
&lt;/ErrorBoundary&gt;</code></pre></div>`,
      options: ['先显示“加载中…”，然后显示“出错了”', '一直显示“加载中…”', '直接显示“出错了”', '整个页面白屏'],
      answer: 0,
      explain:
        '加载期间，Chart 挂起，最近的 Suspense 显示 fallback。import 失败后，lazy 在渲染时抛出错误。错误向上找到最近的错误边界，显示“出错了”。Suspense 负责“等待”，错误边界负责“失败”，两者常常一起用。',
    },
    {
      q: `Article 加载要 1 秒，Comments 要 3 秒，Header 不需要加载。第 1 到第 3 秒之间，页面显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;Suspense fallback={&lt;Spinner /&gt;}&gt;
  &lt;Header /&gt;
  &lt;Suspense fallback={&lt;p&gt;评论加载中…&lt;/p&gt;}&gt;
    &lt;Comments /&gt;
  &lt;/Suspense&gt;
  &lt;Article /&gt;
&lt;/Suspense&gt;</code></pre></div>`,
      options: ['Spinner：要等所有内容都就绪', 'Header 和 Article，评论的位置暂时空着，什么都不显示', '只有“评论加载中…”', 'Header、“评论加载中…”和 Article'],
      answer: 3,
      explain:
        '组件挂起时，只有离它最近的 Suspense 显示 fallback。Comments 被内层边界接住，不影响外层。外层只等 Header 和 Article，1 秒后就显示内容，Comments 的位置显示内层 fallback。所以嵌套 Suspense 可以让页面分批出现。“要等所有内容”是只有一个边界时的行为。',
    },
    {
      q: `React 19。按钮点击后调用 start，里面抛出错误。哪种写法的错误会被 ErrorBoundary 捕获？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">// A：Hook 返回的
const [isPending, start] = useTransition();
start(() =&gt; { throw new Error('boom'); });

// B：从 react 直接导入的
import { startTransition } from 'react';
startTransition(() =&gt; { throw new Error('boom'); });</code></pre></div>`,
      options: ['两种都会', '只有 A 会：B 没有和组件关联，错误成为未捕获错误', '只有 B 会', '两种都不会，错误边界不处理事件里的错误'],
      answer: 1,
      explain:
        '在 React 19 中，useTransition 返回的 startTransition 和组件关联，它里面抛出的错误会交给错误边界。直接导入的 startTransition 没有关联的组件，错误成为全局的未捕获错误。最后一项在 React 18 是对的：React 18 中两种写法的错误都会抛回事件处理函数。',
    },
  ],
  plays: {
    懒加载组件: {
      note: '第一次显示要等 1.5 秒。隐藏后再显示，立刻出现：lazy 只加载一次。点“运行”可重置。',
    },
    一个边界还是两个边界: {
      note: '共用一个边界时，文章和评论一起在 3 秒时出现，等的是最慢的评论。勾选后各包一个 Suspense，文章 1 秒就出现，评论的位置显示自己的 fallback，直到 3 秒。每次切换后点“重新加载”重新计时。',
      predict: {
        q: '先不勾选“各包一个 Suspense”，点“重新加载”。文章（1 秒）什么时候出现？',
        options: ['1 秒', '3 秒，和评论一起', '4 秒', '不会出现'],
        answer: 1,
        explain: '同一个 Suspense 里的内容作为整体显示，要等最慢的评论就绪。两个组件同时开始加载，所以是 3 秒，不是 1 + 3 = 4 秒。',
      },
      pkey: 'suspense|一个边界还是两个边界',
    },
    'use() 读取 Promise': {
      note: '第一次显示用户 1 要等 1 秒。点“用户 2”，同样要等 1 秒。再点回“用户 1”：缓存里的 Promise 已经完成，use() 不再挂起，立刻显示，控制台也没有新的“请求用户 1”。',
      predict: {
        q: '先等用户 1 显示出来。点“用户 2”，等它显示出来，再点回“用户 1”。会怎样？',
        options: ['又等 1 秒才显示，期间显示加载中', '立刻显示，控制台没有新的“请求用户 1”', '立刻显示，但控制台再打印一次“请求用户 1”', '报错'],
        answer: 1,
        explain: 'loadUser(1) 返回缓存里同一个 Promise，它早已完成，use() 直接拿到结果，不会挂起，也不会再发请求。',
      },
      pkey: 'suspense|use() 读取 Promise',
    },
    '没有 Suspense 边界': {
      note: '点击后 1.5 秒里界面没有任何变化，也没有加载提示，之后图表出现。React 19 在这种情况下保持旧界面。点实验台的“运行”可以重来。',
      predict: {
        q: '点“显示图表”后的 1.5 秒里，界面上会出现什么？',
        options: ['一段加载提示', '报错，界面被清空', '界面保持不变，1.5 秒后图表出现', '整个页面变成空白'],
        answer: 2,
        explain: '没有 Suspense 时，点击引起的挂起不会显示 fallback。React 19 保持旧界面，等组件加载完再更新。React 18 会报错。',
      },
      pkey: 'suspense|没有 Suspense 边界',
    },
    'fallback 的最短显示时间': {
      note: '数据 50 毫秒就到了，但 fallback 大约在 300 毫秒时才被替换，内容同时显示出来。React 让 fallback 至少停留约 300 毫秒，避免一闪而过。',
      predict: {
        q: '数据在 50 毫秒时就到了。内容大约在什么时候显示出来？',
        options: ['约 50 毫秒：数据一到就显示', '约 300 毫秒：fallback 至少显示一小会儿', '约 1000 毫秒', '根本不显示 fallback'],
        answer: 1,
        explain: 'fallback 一旦显示出来，React 会让它至少停留约 300 毫秒再换成内容。数据比这更晚到，就一到就显示。',
      },
      pkey: 'suspense|fallback 的最短显示时间',
    },
    切换时保留旧界面: {
      note: '勾选时，点“下一页”后旧页面仍在，旁边显示“切换中…”，1 秒后换成新页面。取消勾选再点：旧页面立刻被加载提示替换。',
      predict: {
        q: '保持勾选。点“下一页”后的 1 秒里，页面显示什么？',
        options: ['⏳ 加载中…', '第 1 页的内容仍在，旁边显示“切换中…”', '空白', '报错'],
        answer: 1,
        explain: '过渡更新里的挂起不会显示 fallback。React 保留旧界面，isPending 为 true，等新内容准备好再切换。',
      },
      pkey: 'suspense|切换时保留旧界面',
    },
    过渡里抛出的错误: {
      note: '按钮 A 用 Hook 返回的 start，错误交给错误边界。按钮 B 用直接导入的 startTransition，没有关联的组件，错误成为未捕获的错误，界面不变，控制台报错。',
      predict: {
        q: '点“按钮 A”，函数里抛出了错误。会怎样？',
        options: ['错误边界显示备用界面', '错误成为未捕获的错误，界面不变', '什么也不发生', '整个页面白屏'],
        answer: 0,
        explain: 'React 19 中，useTransition 返回的 start 和组件关联，里面抛出的错误交给最近的错误边界。React 18 中这个错误会抛回事件处理函数。',
      },
      pkey: 'suspense|过渡里抛出的错误',
    },
    错误边界隔离故障: {
      note: '每个计数器都有自己的错误边界。一个崩溃，只有它的边界显示备用界面，另一个不受影响。点“重试”会清空边界的 error，重新渲染计数器。',
      predict: {
        q: '把第一个计数器点到 3。第二个计数器会怎样？',
        options: ['也显示错误', '不受影响，仍可点击', '整个页面白屏', '被重置为 0'],
        answer: 1,
        explain: '每个计数器有自己的错误边界。错误只会让最近的边界显示备用界面。',
      },
      pkey: 'suspense|错误边界隔离故障',
    },
  },
} satisfies Lesson;
