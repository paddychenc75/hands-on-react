// 由 scripts/convert.mjs 从旧版 src/*.js 生成。
// 非正文数据。课文在 docs/lessons/suspense.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'suspense',
  stage: 2,
  title: 'Suspense、懒加载与错误边界',
  mins: 20,
  summary: '优雅地处理“还没准备好”和“出错了”这两种状态。',
  goals: [
    '能用 lazy 和 Suspense 按需加载一个组件',
    '能写出一个错误边界组件',
    '能判断一个错误会不会被错误边界捕获',
    '能决定 Suspense 和错误边界包在哪一层',
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
      explain: 'Chart 的代码还没到时，它会“挂起”，最近的 Suspense 显示 fallback。代码加载完成后，React 用 Chart 替换 fallback。不会是空白：只有没有任何 Suspense 包着时，才会出错。',
    },
    {
      q: '错误边界能捕获以下哪种错误？',
      options: ['onClick 处理函数中抛出的错误', 'setTimeout 回调中的错误', '子组件渲染时抛出的错误', '错误边界自己 render 中的错误'],
      answer: 2,
      explain: '错误边界捕获子树在渲染、生命周期和 effect 中的错误。最容易误选 onClick：事件处理函数不在渲染过程中执行，React 不会把它的错误交给边界，要自己用 try/catch。',
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
    test: async (t) => {
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
      explain: '加载期间，Chart 挂起，最近的 Suspense 显示 fallback。import 失败后，lazy 在渲染时抛出错误。错误向上找到最近的错误边界，显示“出错了”。Suspense 负责“等待”，错误边界负责“失败”，两者常常一起用。',
    },
    {
      q: `Article 加载要 1 秒，Comments 要 3 秒，Header 不需要加载。第 1 到第 3 秒之间，页面显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;Suspense fallback={&lt;Spinner /&gt;}&gt;
  &lt;Header /&gt;
  &lt;Suspense fallback={&lt;p&gt;评论加载中…&lt;/p&gt;}&gt;
    &lt;Comments /&gt;
  &lt;/Suspense&gt;
  &lt;Article /&gt;
&lt;/Suspense&gt;</code></pre></div>`,
      options: [
        'Spinner：要等所有内容都就绪',
        'Header 和 Article，评论的位置暂时空着，什么都不显示',
        '只有“评论加载中…”',
        'Header、“评论加载中…”和 Article',
      ],
      answer: 3,
      explain: '组件挂起时，只有离它最近的 Suspense 显示 fallback。Comments 被内层边界接住，不影响外层。外层只等 Header 和 Article，1 秒后就显示内容，Comments 的位置显示内层 fallback。所以嵌套 Suspense 可以让页面分批出现。“要等所有内容”是只有一个边界时的行为。',
    },
  ],
  plays: {
    '懒加载组件': {
      note: '只有第一次加载需要等待，之后会使用缓存。点“运行”可重置。',
    },
    '错误边界隔离故障': {
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
};
