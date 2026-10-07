/* ========== 第六阶段：错误处理与监控（第 43 课） ========== */
lesson({
  id: 'error-handling', stage: 5, title: '错误处理与监控', mins: 40,
  summary: '错误边界只是起点。学会把异步错误交给边界、让边界可以重置、决定边界放在哪一层，再把错误连同上下文送到监控服务。',
  goals: [
    '能判断一个错误会到达错误边界、window 的 error 事件，还是 unhandledrejection 事件',
    '能写出支持 fallbackRender、resetKeys 和 onError 的可重置错误边界，并说明它为什么不会重复上报',
    '能用“在更新函数里 throw”的方法，把事件处理函数和 Promise 里的错误交给错误边界',
    '能为一个页面设计错误边界的位置，并为上报设计组件栈、操作记录、去重和采样',
  ],
  keyPoints: [
    '错误边界只接住渲染期间抛出的错误：组件函数、生命周期方法、effect 的同步部分。事件处理函数、定时器、Promise 回调里的错误，它都看不到。',
    '要把异步错误交给边界，就让它在渲染期间再抛一次：<code>setState(() =&gt; { throw error; })</code>。更新函数在下次渲染时执行，错误就出现在渲染期间。',
    '可重置的边界有两种出口：用户点“重试”调用 reset；resetKeys 中的值变化时自动重置。只在“已经处于出错状态”时才因 resetKeys 重置，否则一次故障会上报两次。',
    '边界按“独立的故障范围”放置：根一个、每个路由一个、每个独立数据源的小部件一个。用户的输入放在边界外面，出错时才不会丢。',
    'React 18.3.1 的 createRoot 和 hydrateRoot 只有 onRecoverableError 一个错误回调。React 19 新增 onCaughtError 和 onUncaughtError。全局的 error 和 unhandledrejection 事件负责接住其余的错误。',
  ],
  body: [
    p('第 22 课写过一个错误边界：子组件渲染出错时，显示备用界面。真实项目还要回答更多问题：'),
    p('<ol class="task-steps">'
      + '<li>哪些错误边界接不住？它们去了哪里？</li>'
      + '<li>请求失败了，怎样让边界显示备用界面？</li>'
      + '<li>用户点“重试”，或者切换到别的数据，边界怎样恢复？</li>'
      + '<li>边界放在哪一层？</li>'
      + '<li>线上出了错，开发者怎样知道？</li>'
      + '</ol>'),
    p('这一课按这个顺序讲。目标是一个完整的体系：<b>接住</b>、<b>恢复</b>、<b>上报</b>。'),

    h('一、错误从哪里来，谁能接住'),
    p('错误边界的原理很简单。React 渲染组件时，把调用包在 try/catch 里。所以只有<b>在 React 调用你的代码时</b>抛出的错误，边界才能接住。'),
    table(['错误抛出的位置', '谁能接住', '应该怎样处理'], [
      ['组件函数、class 的生命周期方法', '最近的错误边界', '边界显示备用界面，onError 上报'],
      ['effect 函数体（同步部分）', '最近的错误边界', '同上'],
      ['事件处理函数', '没有边界。错误到达 window 的 <code>error</code> 事件', 'try/catch。需要备用界面时，交给边界（第二节）'],
      ['setTimeout、Promise 的 then/catch 回调', 'window 的 <code>error</code> 或 <code>unhandledrejection</code> 事件', '同上'],
      ['effect 里发起的 Promise', '同上。effect 已经返回，React 不在调用栈上', '同上'],
      ['错误边界自己的 render', '更上层的边界', '让 fallback 尽量简单'],
    ]),
    p('最容易误判的是最后一类异步错误。effect 的函数体是 React 调用的，但 <code>.then</code> 里的回调不是。下面的示例把几种错误放在同一个边界里。先预测，再运行。'),
    Object.assign(play(`
import { Component, useState, useEffect } from 'react';

class Boundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <p style={{ background: '#fde8e8', padding: 8 }}>
          边界接住了：{this.state.error.message}{' '}
          <button onClick={() => this.setState({ error: null })}>恢复</button>
        </p>
      );
    }
    return this.props.children;
  }
}

function RenderBomb() {
  throw new Error('渲染时出错');
}

function EffectPromise() {
  useEffect(() => {
    Promise.resolve().then(() => {
      throw new Error('effect 里的 Promise 出错');
    });
  }, []);
  return <p>我在 effect 里发起了一个 Promise。</p>;
}

function Panel() {
  const [mode, setMode] = useState('none');
  return (
    <div>
      <p><button onClick={() => setMode('render')}>① 渲染时 throw</button></p>
      <p><button onClick={() => { throw new Error('事件处理函数出错'); }}>② 事件处理函数里 throw</button></p>
      <p><button onClick={() => setMode('effect')}>③ effect 里的 Promise 失败</button></p>
      {mode === 'render' && <RenderBomb />}
      {mode === 'effect' && <EffectPromise />}
    </div>
  );
}

export default function App() {
  return <Boundary><Panel /></Boundary>;
}`, '边界能接住哪一个？', '依次点三个按钮，看预览区和控制台：<ol class="task-steps"><li>① 被边界接住，显示红色的备用界面。点“恢复”回到按钮。</li><li>② 边界没有反应。错误出现在控制台：它在 React 的渲染之外抛出。</li><li>③ 边界也没有反应。控制台显示“未处理的 Promise 错误”。effect 早已返回，<code>.then</code> 的回调由浏览器在之后调用。</li></ol>'), {
      predict: {
        q: '点按钮 ③。EffectPromise 挂载后，它的 effect 里有一个 Promise 失败了。外层的 Boundary 会显示备用界面吗？',
        options: ['不会。错误成为未处理的 Promise 拒绝，界面保持不变', '会。effect 里的错误都由错误边界接住', '会，但要等 React 下一次重新渲染时才显示', '不会，而且整个预览区变成白屏'],
        answer: 0,
        explain: '错误边界只接住 React 调用你的代码时抛出的错误。effect 函数本身由 React 调用，但它很快就返回了。<code>.then</code> 的回调在之后的微任务里由浏览器调用，此时 React 不在调用栈上。错误变成 unhandledrejection 事件，界面不变。',
      },
      pkey: 'error-handling|边界能接住哪一个？',
    }),
    warn('<b>开发版本会多报一次。</b>React 18 的开发版本会把渲染错误再抛到 window 上，方便调试器停在出错位置。所以开发时，window 的 error 事件也会收到已被边界接住的错误。生产版本不会这样。测试全局上报时，用生产版本确认数量。'),

    h('二、把异步错误交给边界'),
    p('请求失败了，你想让最近的边界显示“出错了，重试”。边界接不住 Promise 里的错误。办法是：<b>让错误在下一次渲染时再抛出来</b>。'),
    code(`
function useAsyncError() {
  const [, setState] = useState();
  // 更新函数在下次渲染时执行。在里面 throw，错误就发生在渲染期间
  return useCallback((error) => {
    setState(() => { throw error; });
  }, []);
}

function Weather({ city }) {
  const throwToBoundary = useAsyncError();
  function refresh() {
    fetchWeather(city).then(setData).catch(throwToBoundary);
  }
  // …
}`, '把异步错误交给错误边界'),
    p('为什么可行？set 函数不会立刻执行更新函数。React 把它放进队列，下次渲染这个组件时才执行。这时 React 在调用栈上，错误就按渲染错误处理，交给最近的边界。'),
    deep('React 有时会在 set 函数被调用时，提前执行一次更新函数，用来判断新旧 state 是否相同（eager state）。源码在这里包了 try/catch，注释写着“错误会在渲染时再抛一次”。所以这个写法在 18.3.1 中可靠。React 19 的 <code>startTransition</code> 里抛出的错误，以及 <code>use()</code> 读取的失败 Promise，都会直接交给边界，不需要这个技巧。'),
    warn('<b>预期内的失败不要交给边界。</b>表单校验失败、404、没有权限，都是正常的业务结果。把它们存进 state，在原地显示提示，用户的输入也保留。边界负责的是<b>意外</b>：代码 bug、接口返回了坏数据、服务暂时不可用。'),

    h('三、可重置的边界：reset 与 resetKeys'),
    p('第 22 课的边界只有一个出口：用户点“重试”，清空 error。真实页面还需要第二个出口。例如商品页出错后，用户换了一个商品，边界应该自动恢复。'),
    p('常见的设计是给边界加三个 props。它们来自流行的 react-error-boundary 库：'),
    ul([
      '<code>fallbackRender({ error, reset })</code>：备用界面由调用者决定。它拿到错误和一个 reset 函数，可以显示“重试”按钮。',
      '<code>resetKeys</code>：一个数组。数组中的某个值变化时，边界自动重置。例如 <code>[productId]</code>。',
      '<code>onError(error, info)</code>：在 componentDidCatch 中调用，用来上报。<code>info.componentStack</code> 是组件栈：出错组件到根组件的路径。',
    ]),
    p('下面的边界实现了 resetKeys，但有一个缺陷。商品 3 的数据是坏的。先预测，再运行。'),
    Object.assign(play(`
import { Component, useState } from 'react';

const PRODUCTS = {
  1: { name: '键盘', price: 299 },
  2: { name: '鼠标', price: 129 },
  3: { name: '显示器', price: null }, // 坏数据
};

let reports = 0;
function report(error, info) {
  reports++;
  const where = info.componentStack.trim().split('\\n')[0].trim().replace(/ \\(.*$/, '');
  console.log('第 ' + reports + ' 次上报：' + error.message + '（' + where + '）');
}

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    this.props.onError(error, info);
  }
  componentDidUpdate(prevProps) {
    const changed = this.props.resetKeys.some((k, i) => k !== prevProps.resetKeys[i]);
    if (this.state.error && changed) this.setState({ error: null });
  }
  render() {
    if (this.state.error) {
      return this.props.fallbackRender({
        error: this.state.error,
        reset: () => this.setState({ error: null }),
      });
    }
    return this.props.children;
  }
}

function Price({ id }) {
  const p = PRODUCTS[id];
  return <p>{p.name}：¥{p.price.toFixed(2)}</p>;
}

export default function App() {
  const [id, setId] = useState(1);
  return (
    <div>
      {[1, 2, 3].map(n => (
        <button key={n} onClick={() => setId(n)} disabled={n === id}>商品 {n}</button>
      ))}
      <ErrorBoundary
        resetKeys={[id]}
        onError={report}
        fallbackRender={({ error, reset }) => (
          <p style={{ background: '#fde8e8', padding: 8 }}>
            价格加载失败 <button onClick={reset}>重试</button>
          </p>
        )}
      >
        <Price id={id} />
      </ErrorBoundary>
    </div>
  );
}`, '一次故障，上报几次？', '点“商品 3”，看控制台。再点“商品 1”，边界自动恢复，这就是 resetKeys 的作用。<br><b>为什么上报了两次：</b><ol class="task-steps"><li>id 变成 3，Price 渲染时出错。边界进入出错状态，第 1 次上报。</li><li>这次提交后 componentDidUpdate 执行。它发现 resetKeys 变了，而且现在有错误，于是重置。</li><li>重置后 Price 再次渲染，又出错，第 2 次上报。</li></ol>修法：只有在<b>这次更新之前</b>就已经出错时，才因为 resetKeys 变化而重置。componentDidUpdate 的第二个参数是 prevState，检查 <code>prevState.error</code> 即可。'), {
      predict: {
        q: '当前是商品 1。点“商品 3”，Price 渲染出错。控制台会出现几次“上报”？',
        options: ['1 次', '2 次', '0 次：resetKeys 变化让边界直接跳过了错误', '一直上报，直到页面卡死'],
        answer: 1,
        explain: '出错的那次提交里，resetKeys 刚好也变了。componentDidUpdate 看到“有错误 + resetKeys 变了”，就立刻重置。Price 再渲染一次，又出错，又上报一次。第二次提交时 resetKeys 没有再变，所以停在 2 次，不会无限循环。',
      },
      pkey: 'error-handling|一次故障，上报几次？',
    }),
    p('关于重置，还有三条规则：'),
    p('<ol class="task-steps">'
      + '<li><b>resetKeys 逐项比较，不比较数组本身。</b>父组件每次渲染都会写一个新的 <code>[id]</code>。如果比较数组引用，每次父组件渲染都会重置，子组件又出错，上报就会刷屏。</li>'
      + '<li><b>重试要先消除原因。</b>如果出错的是缓存过的请求，重置前先清掉缓存或重新请求。否则组件再次读到同一个失败结果，立刻又出错。第 38 课的资源缓存就要这样做。</li>'
      + '<li><b>用 key 也能重置，但代价更大。</b><code>&lt;ErrorBoundary key={id}&gt;</code> 在 id 变化时卸载整棵子树，即使没有出错。子树里的局部 state（展开的面板、滚动位置）都会丢失。resetKeys 只在出错时才起作用。</li>'
      + '</ol>'),

    h('四、边界放在哪一层'),
    p('边界的位置决定了出错时<b>多大的范围</b>被备用界面替换。范围太大，一个小部件出错，整页都没了。范围太小，到处是边界，备用界面零碎，上报也变多。'),
    table(['层级', '用途', '备用界面'], [
      ['根（最外层）', '最后一道防线。没有它，React 会卸载整棵树，页面变白', '整页提示：“出错了”，加“刷新页面”按钮'],
      ['路由 / 页面', '一个页面坏了，导航栏和其他页面还能用', '页面区域内的提示，加“返回首页”'],
      ['独立的小部件', '有自己数据源的卡片：天气、推荐位、评论区', '和卡片一样大的提示，加“重试”'],
      ['不要放', '每个列表项、每个按钮', '数量太多。一行出错往往说明整份数据有问题'],
    ]),
    p('判断的方法：问一句“这部分坏了，用户还能继续做别的事吗？”能，就给它一个边界。另外，<b>用户正在输入的内容要放在边界外面</b>。编辑器的草稿放在出错的小部件之外，或者先存进 localStorage。备用界面替换的是边界内的整棵子树，里面的 state 都会丢失。'),

    h('五、上报：让错误带上上下文'),
    p('只上报 <code>error.message</code>，开发者很难复现。一条有用的报告至少包含：'),
    ul([
      '<b>错误和 JS 调用栈</b>：<code>error.stack</code>。生产代码经过压缩，要配合 source map 才能看懂。',
      '<b>组件栈</b>：<code>info.componentStack</code>，说明错误出在哪个组件、它在哪个页面里。',
      '<b>操作记录（breadcrumbs）</b>：出错前用户最近的 10～20 个操作，例如“点击 商品 3”“路由 /cart”。',
      '<b>环境</b>：版本号、页面地址、浏览器。版本号最重要：它把错误和某次发布对应起来。',
    ]),
    p('错误边界之外的错误，用两个全局事件接住。下面是一个最小的上报模块：'),
    code(`
const crumbs = [];             // 最近的操作记录
const queue = [];              // 待发送的报告
const seen = new Set();        // 去重：同一个错误只报一次
const SAMPLE_RATE = 0.2;       // 采样：流量大时只报 20%

export function addCrumb(text) {
  crumbs.push({ text, at: Date.now() });
  if (crumbs.length > 20) crumbs.shift();
}

export function capture(error, extra = {}) {
  const key = error.message + '|' + (error.stack || '').split('\\n')[1];
  if (seen.has(key) || Math.random() > SAMPLE_RATE) return;
  seen.add(key);
  queue.push({
    message: error.message, stack: error.stack,
    componentStack: extra.componentStack,
    crumbs: crumbs.slice(), release: APP_VERSION, url: location.href,
  });
}

// 错误边界之外的错误
window.addEventListener('error', (e) => capture(e.error || new Error(e.message)));
window.addEventListener('unhandledrejection', (e) =>
  capture(e.reason instanceof Error ? e.reason : new Error(String(e.reason))));

// 页面隐藏时批量发送。sendBeacon 在页面关闭时也能发出
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && queue.length) {
    navigator.sendBeacon('/api/errors', JSON.stringify(queue.splice(0)));
  }
});`, '上报队列：去重、采样、批量发送'),
    tip('从别的域名加载的脚本出错时，window 的 error 事件只能拿到 “Script error.”，没有调用栈。给 <code>&lt;script&gt;</code> 加 <code>crossorigin="anonymous"</code>，服务器返回 CORS 响应头，才能拿到完整信息。'),

    h('六、根级回调：onRecoverableError'),
    p('有些错误 React 自己就恢复了，用户什么也看不到。例如水合时服务端 HTML 和客户端不一致，React 放弃水合，改为在客户端重新渲染。这类错误交给根的 <code>onRecoverableError</code>。'),
    p('React 18.3.1 的 <code>createRoot</code> 和 <code>hydrateRoot</code> 都接受这个选项。回调收到两个参数：错误，以及 <code>{ componentStack, digest }</code>。不传时，React 用浏览器的 <code>reportError</code> 报告它。React 18 还有一个少有人知的行为：渲染出错后，React 会<b>同步重试一次</b>整次渲染。如果重试成功，第一次的错误就交给 onRecoverableError。'),
    Object.assign(play(`
import { useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

let configReady = false; // 模拟一个第一次读取时还没准备好的全局配置

function Banner() {
  if (!configReady) {
    configReady = true;
    throw new Error('配置还没加载完');
  }
  return <p>横幅显示正常</p>;
}

export default function App() {
  const boxRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    const root = createRoot(boxRef.current, {
      onRecoverableError(error, info) {
        console.log('onRecoverableError：' + error.message);
        console.log('组件栈：' + info.componentStack.trim().split('\\n')[0].trim().replace(/ \\(.*$/, ''));
      },
    });
    rootRef.current = root;
    return () => queueMicrotask(() => root.unmount());
  }, []);

  function show() {
    configReady = false;
    rootRef.current.render(<Banner />);
  }

  return (
    <div>
      <button onClick={show}>渲染横幅</button>
      <div ref={boxRef} style={{ border: '1px dashed gray', padding: 8, marginTop: 8 }} />
    </div>
  );
}`, '一次能恢复的渲染错误', '虚线框是一个独立的 React 根，它用 createRoot 的第二个参数传入 onRecoverableError。Banner 第一次渲染时 throw，同步重试时成功。页面正常显示，错误交给了 onRecoverableError。<br>这类错误不影响用户，但说明代码依赖了“第一次渲染时还没准备好”的外部数据。上报时把它标成警告级别，不要和崩溃混在一起。'), {
      predict: {
        q: '虚线框里没有错误边界。点“渲染横幅”，Banner 第一次渲染时 throw，之后再渲染就正常。会发生什么？',
        options: ['虚线框保持空白，因为没有错误边界', '横幅正常显示，这个错误被 React 吞掉，没有任何回调', '横幅正常显示，错误交给 onRecoverableError', '整个预览区被替换成“渲染出错”'],
        answer: 2,
        explain: 'React 18 在渲染出错后会同步重试一次。重试成功，就提交重试的结果，并把第一次的错误交给 onRecoverableError。这个根没有错误边界也没关系，因为错误已经恢复了。只有重试也失败，错误才会继续向上找边界；找不到，React 就卸载这个根的整棵树。',
      },
      pkey: 'error-handling|一次能恢复的渲染错误',
    }),
    p('React 19 把根级回调补全了。下面的代码只能阅读，本课程的运行环境是 18.3.1：'),
    code(`
// React 19：createRoot 和 hydrateRoot 都接受这三个回调
const root = createRoot(container, {
  // 没有任何边界接住：React 卸载整棵树
  onUncaughtError(error, info) {
    capture(error, { level: 'fatal', componentStack: info.componentStack });
  },
  // 被某个边界接住。info.errorBoundary 是那个边界的实例
  onCaughtError(error, info) {
    capture(error, { level: 'error', componentStack: info.componentStack });
  },
  // React 自动恢复了。有些错误把原始错误放在 error.cause 里
  onRecoverableError(error, info) {
    capture(error.cause || error, { level: 'warning', componentStack: info.componentStack });
  },
});`, 'React 19 的三个根级错误回调（只能阅读）'),
    p('在 React 18 中，没有这两个新回调。被边界接住的错误，靠边界的 onError 上报；没被接住的错误，React 会卸载整棵树，再把错误抛到 window，由全局的 error 事件接住。所以 React 18 项目需要<b>根边界 + 全局事件 + onRecoverableError</b> 三处配合。'),

    h('七、接入监控服务（选读）'),
    p('自己写上报模块适合学习。生产环境通常用 Sentry 这类监控服务。它们的 SDK 做了上面所有事情，还有更多：'),
    ul([
      '<b>自动收集</b>：全局错误、Promise 拒绝、请求失败、路由变化，并自动记录操作记录。',
      '<b>React 集成</b>：提供现成的 ErrorBoundary 组件，自动带上组件栈；React 19 项目还可以把 SDK 的处理函数传给根级回调。',
      '<b>source map</b>：构建时上传 source map，后台把压缩后的调用栈还原成源码位置。不要把 source map 公开部署到线上。',
      '<b>按版本聚合</b>：同一个错误合并成一个“问题”，显示首次出现在哪个版本、影响了多少用户。',
      '<b>隐私</b>：发送前删掉 token、邮箱、表单内容。默认只发必要字段。',
    ]),
    p('告警要看<b>比率</b>，不要看次数。“每千次会话的崩溃数在一次发布后翻倍”比“今天有 300 个错误”更有用。'),
  ],
  quiz: [
    {
      q: '注册表单提交后，服务器返回 422 和 <code>{ field: "email", message: "邮箱已被注册" }</code>。最合适的处理是？',
      options: ['用 useAsyncError 把它交给错误边界，显示“出错了，重试”', '直接 throw，让 window 的 error 事件上报', '自动重试三次，再交给错误边界', '把错误存进 state，在邮箱输入框旁显示，表单内容保持不变'],
      answer: 3,
      explain: '“邮箱已被注册”是预期内的业务结果，不是 bug。存进 state，原地提示，用户改一下邮箱就能继续。交给边界是最迷惑的错误项：备用界面会替换整棵子树，用户填的内容全部丢失，而且“重试”也没用，因为邮箱仍然被注册了。',
    },
    {
      q: '商品详情页有“规格”标签页（局部 state）。同事把 <code>&lt;ErrorBoundary resetKeys={[productId]}&gt;</code> 改成 <code>&lt;ErrorBoundary key={productId}&gt;</code>，说“效果一样，代码更少”。在没有任何错误时，两者有什么区别？',
      options: ['key 版本每次切换商品都卸载整棵子树，已选的标签页等局部 state 丢失', '没有区别，key 只在出错时起作用', 'resetKeys 版本每次切换商品都会重新挂载子树', 'key 版本会让 onError 在每次切换时被调用'],
      answer: 0,
      explain: 'key 变化时，React 把它当成另一个组件：卸载旧的整棵子树，挂载新的。不管有没有出错，都会这样。resetKeys 只在边界处于出错状态时才起作用，平时子树正常更新，局部 state 保留。“没有区别”的误解在于把 key 当成了“出错时的开关”。',
    },
    {
      q: '在开发环境中测试全局上报：一个组件渲染出错，被错误边界接住。监控后台收到了两条报告，一条来自边界的 onError，一条来自 window 的 error 事件。最可能的原因是？',
      options: ['边界没有写好，错误漏到了外面', 'componentDidCatch 被 React 调用了两次', 'React 18 开发版本会把渲染错误再抛到 window，方便调试；生产版本不会', '浏览器总是会把所有错误同时报给 window'],
      answer: 2,
      explain: 'React 18 开发版本在组件出错后，用一个模拟事件重放这次渲染，让调试器停在出错位置。所以 window 的 error 事件也会收到这个错误，即使边界已经接住了它。生产版本没有这个重放。最迷惑的是“边界没有写好”：如果边界真的漏了，页面会显示上层的备用界面或白屏，而不是本边界的备用界面。',
    },
    {
      q: '在 React 18.3.1 中，哪种情况会调用 createRoot 的 <code>onRecoverableError</code>？',
      options: ['子组件渲染出错，被错误边界接住，显示了备用界面', '水合时服务端 HTML 和客户端不一致，React 改为在客户端重新渲染', '事件处理函数里抛出了错误', 'effect 里的请求失败，Promise 被拒绝'],
      answer: 1,
      explain: 'onRecoverableError 只接收 React 自己恢复了的错误：水合不匹配后改为客户端渲染，或者渲染出错后同步重试成功。被边界接住的错误交给边界的 componentDidCatch（React 19 中还有 onCaughtError），这是最常见的混淆。事件处理函数和 Promise 的错误根本不经过 React 的渲染。',
    },
    {
      q: '一个仪表盘有顶部导航、一个可编辑的“备忘录”，以及 6 张数据卡片。每张卡片请求自己的接口。错误边界怎样放最合适？',
      options: ['只在根放一个边界，备用界面显示“出错了，刷新页面”', '把导航、备忘录和 6 张卡片一起包进一个边界', '每张卡片里的每一行数据都包一个边界', '根放一个，6 张卡片各放一个，备忘录放在卡片的边界外面'],
      answer: 3,
      explain: '每张卡片是一个独立的故障范围：一张卡片的接口挂了，其他卡片和备忘录都应该还能用。根边界是最后一道防线。备忘录在卡片的边界外面，卡片出错时草稿不会丢。只放根边界，一张卡片出错，整页都被替换，备忘录也没了。',
    },
  ],
  checkOnly: (() => {
    const pre = (src) => '<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">'
      + src.replace(/^\n/, '').replace(/\n\s*$/, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre></div>';
    return [
      {
        q: 'Orders 被一个错误边界包着。接口返回了一段不是 JSON 的文本。页面会怎样？' + pre(`
function Orders() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(setData);
  }, []);
  if (!data) return <p>加载中…</p>;
  return <OrderList items={data} />;
}`),
        options: ['一直显示“加载中…”，控制台出现未处理的 Promise 拒绝', '错误边界显示备用界面', '整个应用白屏', 'React 自动重试 effect，直到成功'],
        answer: 0,
        explain: 'r.json() 失败时，Promise 被拒绝。这发生在 effect 返回之后，React 不在调用栈上，所以边界不知道。没有 catch，它就成了 unhandledrejection。data 一直是 null，界面停在“加载中…”。要让边界显示备用界面，就在 catch 里用 <code>setState(() =&gt; { throw e; })</code> 把错误交给它。',
      },
      {
        q: 'Child 每次渲染都会出错。父组件有一个每秒更新一次的时钟，所以每秒重新渲染一次，并写出 <code>resetKeys={[userId]}</code>。userId 一直不变。会发生什么？' + pre(`
componentDidUpdate(prevProps) {
  if (this.state.error &&
      prevProps.resetKeys !== this.props.resetKeys) {
    this.setState({ error: null });
  }
}`),
        options: ['只上报一次，边界一直显示备用界面', '立即无限循环，浏览器卡死', '每秒重置一次，Child 又出错，onError 每秒上报一次', 'resetKeys 不变，所以什么都不会发生'],
        answer: 2,
        explain: '<code>[userId]</code> 每次渲染都是一个新数组，引用比较总是“变了”。父组件每秒渲染一次，边界就每秒重置一次，Child 再出错，再上报一次。它不是立即的无限循环：重置后的那次提交里，props 没有再变。修法是逐项比较数组里的值。',
      },
      {
        q: '同事想把异步错误交给错误边界，写了下面的 Hook。在 catch 里调用它之后，会发生什么？' + pre(`
function useAsyncError() {
  const [, setError] = useState(null);
  return useCallback((e) => setError(e), []);
}`),
        options: ['最近的错误边界显示备用界面', '组件重新渲染一次，错误存在 state 里，边界什么也不知道', 'React 报错：state 不能存 Error 对象', '错误被抛到 window 的 error 事件'],
        answer: 1,
        explain: '<code>setError(e)</code> 只是把 Error 对象当成普通的新值存起来，没有任何代码 throw。要在渲染期间抛出，必须传一个更新函数，并在里面 throw：<code>setState(() =&gt; { throw e; })</code>。或者在组件里读这个 state，有值时 <code>throw</code>。',
      },
      {
        q: 'Sidebar 渲染时出错。用户在 Editor 里已经写了半小时，草稿只存在 Editor 的 state 里。会发生什么？' + pre(`
<ErrorBoundary fallbackRender={() => <p>出错了</p>}>
  <Layout>
    <Sidebar />
    <Editor />
  </Layout>
</ErrorBoundary>`),
        options: ['只有 Sidebar 的位置显示“出错了”，Editor 不受影响', 'Editor 保留，但变成只读', '草稿会保存在边界里，点重试后恢复', '整个 Layout 被替换成“出错了”，Editor 被卸载，草稿丢失'],
        answer: 3,
        explain: '备用界面替换的是边界内的整棵子树。Editor 和 Sidebar 在同一个边界里，Editor 被卸载，它的 state 随之丢失。重试会重新挂载一个全新的 Editor，草稿不会回来。修法：给 Sidebar 单独包一个边界，或者把草稿放到边界外面、存进 localStorage。',
      },
    ];
  })(),
  exercise: {
    task: '<ol class="task-steps">'
      + '<li>完成 <code>ErrorBoundary</code>。它接收三个 props：<code>fallbackRender</code>（必填，调用时传入 <code>{ error, reset }</code>）、<code>onError</code>（可选，在 componentDidCatch 中调用，传入 error 和 info）、<code>resetKeys</code>（可选的数组）。</li>'
      + '<li>reset 清除错误，重新渲染子组件。resetKeys 中的某一项变化时，边界也自动重置。要求：一次故障只调用一次 onError；父组件传入新数组但值没变时，不能重置。</li>'
      + '<li>完成 <code>useAsyncError()</code>：返回一个函数。把错误传给它，最近的错误边界就显示备用界面。</li>'
      + '<li>Weather 的“刷新”按钮请求失败时，现在错误无人处理。用 useAsyncError 把它交给边界。</li>'
      + '<li>在 App 中放置边界：个人资料和天气各用一个，备用界面用现成的 <code>WidgetFallback</code>，用 <code>report</code> 上报。选好每个边界的 resetKeys：切换用户或城市后，出错的面板自动恢复。一个面板出错时，另一个面板和“备忘”输入框都不受影响。</li>'
      + '<li>试一试：选“用户 3”（坏数据）；点“模拟故障”再点“刷新”。看控制台的上报。</li>'
      + '</ol>',
    starter: `import { Component, useState, useEffect, useCallback } from 'react';

// 模拟接口：failures 大于 0 时，请求失败
const api = {
  failures: 0,
  fetchWeather(city) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (api.failures > 0) {
          api.failures--;
          reject(new Error('天气服务超时'));
        } else {
          resolve({ city, temp: 10 + city.length * 3 });
        }
      }, 60);
    });
  },
};

const USERS = {
  u1: { name: 'Ada', plan: '专业版' },
  u2: { name: 'Linus', plan: '免费版' },
  u3: { name: null, plan: '免费版' }, // 后端返回了坏数据
};

// 上报：真实项目会发送到监控服务
const reports = [];
function report(error, info) {
  reports.push({ message: error.message, componentStack: info.componentStack });
  console.log('上报 #' + reports.length + '：' + error.message);
}

class ErrorBoundary extends Component {
  // 第 1、2 步
  render() {
    return this.props.children;
  }
}

function useAsyncError() {
  // 第 3 步
}

function WidgetFallback({ error, reset }) {
  return (
    <div role="alert" style={{ background: '#fde8e8', padding: 8 }}>
      出错了：{error.message} <button onClick={reset}>重试</button>
    </div>
  );
}

function Profile({ userId }) {
  const user = USERS[userId];
  return <p className="profile">{user.name.toUpperCase()}（{user.plan}）</p>;
}

function Weather({ city }) {
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    setData(null);
    api.fetchWeather(city).then(setData); // 第 4 步：失败时怎么办？
  }, [city]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {data ? <p className="weather">{data.city}：{data.temp}°C</p> : <p>加载中…</p>}
      <button onClick={load}>刷新</button>
    </div>
  );
}

function App() {
  const [userId, setUserId] = useState('u1');
  const [city, setCity] = useState('北京');
  const [note, setNote] = useState('');

  // 第 5 步：给两个面板加上错误边界
  return (
    <div>
      <p>
        <select id="user" value={userId} onChange={e => setUserId(e.target.value)}>
          <option value="u1">用户 1</option>
          <option value="u2">用户 2</option>
          <option value="u3">用户 3（坏数据）</option>
        </select>{' '}
        <select id="city" value={city} onChange={e => setCity(e.target.value)}>
          <option>北京</option>
          <option>上海</option>
          <option>乌鲁木齐</option>
        </select>{' '}
        <button onClick={() => { api.failures = 1; }}>模拟故障</button>
      </p>
      <section id="profile-panel">
        <h4>个人资料</h4>
        <Profile userId={userId} />
      </section>
      <section id="weather-panel">
        <h4>天气</h4>
        <Weather city={city} />
      </section>
      <textarea id="note" value={note} onChange={e => setNote(e.target.value)} placeholder="备忘" />
    </div>
  );
}`,
    solution: `import { Component, useState, useEffect, useCallback } from 'react';

// 模拟接口：failures 大于 0 时，请求失败
const api = {
  failures: 0,
  fetchWeather(city) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (api.failures > 0) {
          api.failures--;
          reject(new Error('天气服务超时'));
        } else {
          resolve({ city, temp: 10 + city.length * 3 });
        }
      }, 60);
    });
  },
};

const USERS = {
  u1: { name: 'Ada', plan: '专业版' },
  u2: { name: 'Linus', plan: '免费版' },
  u3: { name: null, plan: '免费版' }, // 后端返回了坏数据
};

// 上报：真实项目会发送到监控服务
const reports = [];
function report(error, info) {
  reports.push({ message: error.message, componentStack: info.componentStack });
  console.log('上报 #' + reports.length + '：' + error.message);
}

function keysChanged(a = [], b = []) {
  return a.length !== b.length || a.some((k, i) => !Object.is(k, b[i]));
}

class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (this.props.onError) this.props.onError(error, info);
  }

  componentDidUpdate(prevProps, prevState) {
    // 只有更新前就已经出错，resetKeys 变化才重置。否则刚出的错会被立刻重置，再报一次
    if (prevState.error && this.state.error && keysChanged(prevProps.resetKeys, this.props.resetKeys)) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return this.props.fallbackRender({ error: this.state.error, reset: this.reset });
    }
    return this.props.children;
  }
}

function useAsyncError() {
  const [, setState] = useState();
  return useCallback((error) => {
    setState(() => { throw error; });
  }, []);
}

function WidgetFallback({ error, reset }) {
  return (
    <div role="alert" style={{ background: '#fde8e8', padding: 8 }}>
      出错了：{error.message} <button onClick={reset}>重试</button>
    </div>
  );
}

function Profile({ userId }) {
  const user = USERS[userId];
  return <p className="profile">{user.name.toUpperCase()}（{user.plan}）</p>;
}

function Weather({ city }) {
  const [data, setData] = useState(null);
  const throwToBoundary = useAsyncError();

  const load = useCallback(() => {
    setData(null);
    api.fetchWeather(city).then(setData).catch(throwToBoundary);
  }, [city, throwToBoundary]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {data ? <p className="weather">{data.city}：{data.temp}°C</p> : <p>加载中…</p>}
      <button onClick={load}>刷新</button>
    </div>
  );
}

function App() {
  const [userId, setUserId] = useState('u1');
  const [city, setCity] = useState('北京');
  const [note, setNote] = useState('');

  return (
    <div>
      <p>
        <select id="user" value={userId} onChange={e => setUserId(e.target.value)}>
          <option value="u1">用户 1</option>
          <option value="u2">用户 2</option>
          <option value="u3">用户 3（坏数据）</option>
        </select>{' '}
        <select id="city" value={city} onChange={e => setCity(e.target.value)}>
          <option>北京</option>
          <option>上海</option>
          <option>乌鲁木齐</option>
        </select>{' '}
        <button onClick={() => { api.failures = 1; }}>模拟故障</button>
      </p>
      <section id="profile-panel">
        <h4>个人资料</h4>
        <ErrorBoundary resetKeys={[userId]} onError={report} fallbackRender={(p) => <WidgetFallback {...p} />}>
          <Profile userId={userId} />
        </ErrorBoundary>
      </section>
      <section id="weather-panel">
        <h4>天气</h4>
        <ErrorBoundary resetKeys={[city]} onError={report} fallbackRender={(p) => <WidgetFallback {...p} />}>
          <Weather city={city} />
        </ErrorBoundary>
      </section>
      <textarea id="note" value={note} onChange={e => setNote(e.target.value)} placeholder="备忘" />
    </div>
  );
}`,
    exports: ['ErrorBoundary', 'useAsyncError', 'api', 'reports'],
    hint: '边界：回看第三节的“一次故障，上报几次？”示例和它的说明。componentDidUpdate 的第二个参数能告诉你“这次更新之前是否已经出错”；resetKeys 要逐项比较。useAsyncError：错误要在渲染期间抛出，而 set 函数的更新函数正是在渲染时执行的。放置：每个面板的数据由哪个 state 决定，它就是这个面板的 resetKeys。',
    faded: `// ……api、USERS、report 不变……

function keysChanged(a = [], b = []) {
  return a.length !== b.length || a.some((k, i) => !Object.is(k, b[i]));
}

class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    /* ✏️ 有 onError 时调用它，传入 error 和 info */
  }

  componentDidUpdate(prevProps, prevState) {
    /* ✏️ 更新前就已出错（prevState.error），现在仍出错，并且 resetKeys 的值变了：调用 this.reset() */
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return this.props.fallbackRender({ error: this.state.error, reset: this.reset });
    }
    return this.props.children;
  }
}

function useAsyncError() {
  const [, setState] = useState();
  return useCallback((error) => {
    /* ✏️ 调用 setState，传入一个会 throw error 的更新函数 */
  }, []);
}

// ……WidgetFallback、Profile 不变……

function Weather({ city }) {
  const [data, setData] = useState(null);
  const throwToBoundary = useAsyncError();

  const load = useCallback(() => {
    setData(null);
    api.fetchWeather(city).then(setData).catch(throwToBoundary);
  }, [city, throwToBoundary]);
  // ……
}

// App 中：
<section id="profile-panel">
  <h4>个人资料</h4>
  <ErrorBoundary resetKeys={/* ✏️ 个人资料由哪个 state 决定？ */} onError={report} fallbackRender={(p) => <WidgetFallback {...p} />}>
    <Profile userId={userId} />
  </ErrorBoundary>
</section>
<section id="weather-panel">
  <h4>天气</h4>
  {/* 天气面板同样包一个边界，resetKeys 是 [city] */}
</section>`,
    test: async (t) => {
      const h = React.createElement;
      const { ErrorBoundary, useAsyncError, api, reports } = t.exports;
      t.assert(typeof ErrorBoundary === 'function', '请保留名为 ErrorBoundary 的 class 组件');
      t.assert(typeof useAsyncError === 'function', '请保留名为 useAsyncError 的函数');
      t.assert(api && Array.isArray(reports), '请保留 api 和 reports，不要改名');

      // ---- 第一部分：单独检查 ErrorBoundary ----
      const box = document.createElement('div');
      box.style.cssText = 'position:absolute;left:-9999px;top:0';
      document.body.appendChild(box);
      const root = ReactDOM.createRoot(box);
      let shouldThrow = true;
      function Thrower() {
        if (shouldThrow) throw new Error('测试用的渲染错误');
        return h('p', { className: 'ok' }, '正常内容');
      }
      const calls = [];
      const onError = (error, info) => calls.push({ error, info });
      const fallbackRender = (arg) => h('div', { className: 'fb' },
        h('span', null, String(arg && arg.error && arg.error.message)),
        h('button', { onClick: arg && arg.reset }, 'retry'));
      const show = (keys, extra) => ReactDOM.flushSync(() => root.render(
        h(ErrorBoundary, Object.assign({ resetKeys: keys, onError, fallbackRender }, extra), h(Thrower))));
      const fb = () => box.querySelector('.fb');
      const ok = () => box.querySelector('.ok');
      try {
        try { show(['a']); } catch (e) {
          t.assert(false, '渲染出错时，错误穿过了 ErrorBoundary：' + e.message + '。需要 static getDerivedStateFromError（第 1 步）');
        }
        await t.wait(20);
        t.assert(fb(), '子组件渲染出错时，ErrorBoundary 应调用 fallbackRender({ error, reset }) 并显示它的返回值（第 1 步）');
        t.assert(fb().textContent.includes('测试用的渲染错误'), 'fallbackRender 收到的对象里，error 应该是子组件抛出的错误');
        t.assert(calls.length === 1, '子组件出错一次，onError 应被调用 1 次，实际 ' + calls.length + ' 次（第 1 步：在 componentDidCatch 中调用）');
        t.assert(calls[0].error && calls[0].error.message === '测试用的渲染错误', 'onError 的第一个参数应是错误对象');
        t.assert(calls[0].info && /Thrower/.test(calls[0].info.componentStack || ''), 'onError 的第二个参数应是 componentDidCatch 收到的 info，其中的 componentStack 能看到出错的组件');

        show(['a']);
        await t.wait(20);
        t.assert(fb() && calls.length === 1, '父组件重新渲染，传入了新数组 ["a"]，但值没变。边界不应重置，也不应再次上报。resetKeys 要逐项比较值，不能比较数组引用（第 2 步）');

        shouldThrow = false;
        show(['a']);
        await t.wait(20);
        t.assert(fb(), 'resetKeys 的值没变时，即使子组件已经能正常渲染，边界也应停在备用界面，等用户点“重试”');
        const retry = fb().querySelector('button');
        retry.click();
        await t.wait(40);
        t.assert(ok() && !fb(), '调用 fallbackRender 收到的 reset 后，边界应清除错误，重新显示子组件（第 2 步）');

        shouldThrow = true;
        show(['b']);
        await t.wait(40);
        t.assert(fb(), 'resetKeys 变化的同时子组件出错，边界应显示备用界面');
        t.assert(calls.length === 2, 'resetKeys 变化的同一次更新里子组件出错，onError 应只多调用 1 次，实际多了 ' + (calls.length - 1) + ' 次。刚出错就因为 resetKeys 变化而重置，子组件会再出错一次。只有更新之前就已经出错时，才因 resetKeys 变化而重置（第 2 步）');

        shouldThrow = false;
        show(['c']);
        await t.wait(40);
        t.assert(ok() && !fb(), '边界处于出错状态时，resetKeys 从 ["b"] 变成 ["c"]，应自动重置并显示子组件（第 2 步）');

        shouldThrow = true;
        try { ReactDOM.flushSync(() => root.render(h(ErrorBoundary, { fallbackRender }, h(Thrower)))); } catch (e) {
          t.assert(false, '不传 onError 和 resetKeys 时，边界出错了：' + e.message + '。这两个 props 是可选的');
        }
        await t.wait(20);
        t.assert(fb(), '不传 onError 和 resetKeys 时，边界也应正常显示备用界面');

        // ---- 第二部分：useAsyncError ----
        shouldThrow = false;
        function AsyncButton() {
          const throwToBoundary = useAsyncError();
          return h('button', {
            className: 'async-go',
            onClick: () => { Promise.reject(new Error('测试用的异步错误')).catch(throwToBoundary); },
          }, 'go');
        }
        calls.length = 0;
        ReactDOM.flushSync(() => root.render(h(ErrorBoundary, { key: 'async', onError, fallbackRender }, h(AsyncButton))));
        const go = box.querySelector('.async-go');
        t.assert(go, 'useAsyncError 在渲染时出错了，组件没能显示。它应该返回一个函数');
        go.click();
        await t.wait(80);
        t.assert(fb() && fb().textContent.includes('测试用的异步错误'), '把 Promise 的错误传给 useAsyncError 返回的函数后，最近的边界应显示备用界面。错误要在渲染期间抛出：set 函数的更新函数正是在渲染时执行的（第 3 步）');
        t.assert(calls.length === 1 && /AsyncButton/.test((calls[0].info && calls[0].info.componentStack) || ''), '异步错误交给边界后，onError 应被调用 1 次，componentStack 中能看到调用 useAsyncError 的组件');
      } finally {
        root.unmount();
        box.remove();
      }

      // ---- 第三部分：App 中的边界放置 ----
      const panel = (id) => t.q('#' + id);
      const alertIn = (id) => panel(id) && panel(id).querySelector('[role="alert"]');
      const select = async (sel, value) => {
        const el = t.q(sel);
        t.assert(el, '找不到 ' + sel);
        el.value = value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        await t.wait(60);
      };
      const whole = () => t.q('.pv-err');
      t.assert(panel('profile-panel') && panel('weather-panel') && t.q('#note'), '请保留 #profile-panel、#weather-panel 和 #note');
      await t.wait(150);
      t.assert(t.text('#profile-panel .profile').includes('ADA'), '个人资料一开始应显示 ADA');
      t.assert(t.text('#weather-panel .weather').includes('北京'), '天气一开始应显示北京的天气');
      await t.type('#note', '草稿：别丢');

      const before = reports.length;
      await select('#user', 'u3');
      t.assert(!whole(), '选“用户 3”后，整个应用都被替换了。给个人资料面板包一个 ErrorBoundary（第 5 步）');
      t.assert(panel('profile-panel') && panel('weather-panel') && t.q('#note'), '选“用户 3”后，天气面板和“备忘”也不见了：整个页面被备用界面替换。边界的范围太大，给两个面板各包一个边界（第 5 步）');
      t.assert(alertIn('profile-panel'), '选“用户 3”后，个人资料面板里应显示 WidgetFallback（role="alert"）');
      t.assert(t.text('#weather-panel .weather').includes('北京'), '个人资料出错时，天气面板应不受影响。两个面板要各用一个边界');
      t.assert(t.q('#note') && t.q('#note').value === '草稿：别丢', '面板出错时，“备忘”里的内容丢失了。输入框要放在边界外面');
      t.assert(reports.length === before + 1, '个人资料出错一次，应上报 1 次，实际 ' + (reports.length - before) + ' 次。检查 onError={report}，以及第 2 步的“只报一次”');
      t.assert(/Profile/.test(reports[reports.length - 1].componentStack || ''), '上报的 componentStack 中应能看到 Profile');

      await select('#user', 'u2');
      t.assert(!alertIn('profile-panel') && t.text('#profile-panel .profile').includes('LINUS'), '换成“用户 2”后，个人资料面板应自动恢复。个人资料由 userId 决定，它的边界的 resetKeys 应包含 userId');

      const unhandled = [];
      const onRej = (e) => unhandled.push(e.reason);
      window.addEventListener('unhandledrejection', onRej);
      try {
        const n0 = reports.length;
        api.failures = 1;
        const refresh = Array.from(panel('weather-panel').querySelectorAll('button')).find(b => b.textContent.trim() === '刷新');
        t.assert(refresh, '天气面板里找不到“刷新”按钮');
        refresh.click();
        await t.wait(200);
        t.assert(!whole() && panel('weather-panel'), '天气请求失败后，整个应用都被替换了。给天气面板也包一个 ErrorBoundary（第 5 步）');
        t.assert(!unhandled.length, '刷新失败的错误成了未处理的 Promise 拒绝，没有交给边界。在 Weather 中用 useAsyncError 接住它（第 4 步）');
        t.assert(alertIn('weather-panel'), '点“刷新”且请求失败后，天气面板应显示 WidgetFallback（第 4、5 步）');
        t.assert(alertIn('weather-panel').textContent.includes('天气服务超时'), '天气面板的备用界面应显示错误信息“天气服务超时”');
        t.assert(t.text('#profile-panel .profile').includes('LINUS'), '天气出错时，个人资料面板应不受影响');
        t.assert(reports.length === n0 + 1 && reports[reports.length - 1].message === '天气服务超时', '天气请求失败应上报 1 次，实际 ' + (reports.length - n0) + ' 次');

        const again = Array.from(alertIn('weather-panel').querySelectorAll('button')).find(b => b.textContent.trim() === '重试');
        again.click();
        await t.wait(200);
        t.assert(!alertIn('weather-panel') && t.text('#weather-panel .weather').includes('北京'), '点“重试”后，天气面板应重新请求并显示天气');

        api.failures = 1;
        Array.from(panel('weather-panel').querySelectorAll('button')).find(b => b.textContent.trim() === '刷新').click();
        await t.wait(200);
        t.assert(alertIn('weather-panel'), '第二次模拟故障后，天气面板应显示备用界面');
        await select('#city', '上海');
        await t.wait(200);
        t.assert(!alertIn('weather-panel') && t.text('#weather-panel .weather').includes('上海'), '天气出错后换成“上海”，天气面板应自动恢复并显示上海的天气。天气由 city 决定，它的边界的 resetKeys 应包含 city');
        t.assert(t.q('#note').value === '草稿：别丢', '“备忘”里的内容应一直保留');
      } finally {
        window.removeEventListener('unhandledrejection', onRej);
        api.failures = 0;
      }
    },
  },
});
