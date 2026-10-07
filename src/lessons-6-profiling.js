/* ========== 后加的课：性能测量（插在 concurrent 之后） ========== */
lessonAfter('concurrent', {
  id: 'profiling', stage: 2, title: '性能测量：先找到慢在哪里', mins: 30,
  summary: '用 React DevTools、Profiler 组件和浏览器 Performance 面板找到真正的瓶颈，再选择正确的优化方法。',
  goals: [
    '能用 React DevTools Profiler 录制一次操作，找出最慢的组件和它的渲染原因',
    '能根据 actualDuration 和 baseDuration 判断记忆化有没有生效',
    '能判断在开发版本测得的耗时该怎样使用',
    '能写出虚拟列表：DOM 中的行数只和可见区域有关',
  ],
  keyPoints: [
    '先测量，再优化。一次只改一处，数字变好才保留。',
    'Profiler 面板：每根柱子是一次提交；火焰图里最宽、最黄的组件最慢；“Why did this render?” 给出渲染原因。',
    'actualDuration 是这次实际花的时间，baseDuration 是不做记忆化时的估算。两者接近，说明记忆化没有生效。',
    '开发版本比生产版本慢好几倍。用它比较修改前后的相对变化，真实数字要用生产或 profiling 版本测。',
    'memo 不能减少 DOM。几千行的列表首次显示很慢，要用虚拟列表，只渲染可见的行。',
  ],
  body: [
    p('前几课教了 memo、useMemo、useTransition。它们都有成本。用错地方，代码变复杂，速度却不变。'),
    p('所以优化之前，一定要先<b>测量</b>。这一课教你怎样测量。'),
    like('像看医生。医生先做检查，再开药。没有检查就开药，可能治错病，还会带来副作用。'),
    h('优化的四个步骤'),
    fig(`<div class="steps"><div class="step"><b>① 复现</b><span>找到一个具体的慢操作，例如“在搜索框打字”</span></div><div class="step"><b>② 测量</b><span>录制这个操作，找出<em>最耗时</em>的组件</span></div><div class="step"><b>③ 修改</b><span>只改最耗时的这一处</span></div><div class="step"><b>④ 再测量</b><span>用同样的操作再录一次。数字变好才保留修改</span></div></div>`, '一次只改一处。每次修改后都重新测量'),
    tip('测量时，打开浏览器 DevTools 的 <b>CPU 节流</b>（Performance 面板 → CPU：4x slowdown）。你的电脑通常比用户的手机快很多。'),

    h('工具一：React DevTools 的 Profiler 面板'),
    p('React DevTools 是浏览器扩展。安装后，DevTools 中多出两个面板：<b>Components</b> 和 <b>Profiler</b>。Components 面板显示组件树，以及每个组件的 props、state 和 Hook。Profiler 面板记录每次提交的耗时。'),
    ({ t: 'call', kind: 'tip', label: '录制一次操作', html: '<ol class="task-steps"><li>打开 Profiler 面板，点齿轮图标。</li><li>勾选 “Record why each component rendered while profiling”。</li><li>点圆形的录制按钮。</li><li>在页面上执行慢操作，例如打 5 个字。</li><li>点停止按钮。</li><li>在右上角的柱状图中选一次提交。每根柱子是一次提交，越高越慢。</li><li>读火焰图，找出最宽、颜色最黄的组件。</li><li>点这个组件。右侧的 “Why did this render?” 显示渲染原因。</li></ol>' }),
    table(['你看到的', '含义'], [
      ['灰色条', '这次提交中，这个组件<b>没有</b>渲染'],
      ['条的宽度', '这个组件和它的子组件上一次渲染的总耗时'],
      ['条的颜色', '这次提交中，组件自身的耗时。黄色慢，蓝绿色快'],
      ['Ranked 视图', '按自身耗时排序。最慢的组件在最上面'],
      ['Why did this render?', '例如 “Props changed: (onClick)”、“Hooks changed”、“The parent component rendered”'],
    ]),
    p('还有一个快速检查的方法：'),
    p('<ol class="task-steps"><li>在 DevTools 设置的 General 页，勾选 “Highlight updates when components render”。</li><li>在页面上操作。</li><li>每个重新渲染的组件都会闪一个边框。打一个字，整页都在闪？这就是线索。</li></ol>'),
    warn('“Why did this render?” 显示 “Props changed: (onClick)”，不一定是问题。只有这个组件<b>很慢</b>时才值得处理。先看耗时，再看原因。'),

    h('工具二：在代码里测量：<Profiler>'),
    p('<code>&lt;Profiler&gt;</code> 是 React 内置的组件。它包裹一棵子树。子树每次提交后，React 调用 <code>onRender</code>。'),
    code(`import { Profiler } from 'react';

function onRender(id, phase, actualDuration, baseDuration, startTime, commitTime) {
  // 把数据发到日志或统计服务
}

<Profiler id="Sidebar" onRender={onRender}>
  <Sidebar />
</Profiler>`),
    table(['参数', '含义'], [
      ['<code>id</code>', '你给这个 Profiler 起的名字。有多个 Profiler 时用来区分'],
      ['<code>phase</code>', '<code>"mount"</code>（第一次挂载）、<code>"update"</code>（重新渲染）或 <code>"nested-update"</code>'],
      ['<code>actualDuration</code>', '这次更新中，渲染这棵子树<b>实际</b>花的毫秒数'],
      ['<code>baseDuration</code>', '估算值：不做任何记忆化时，重新渲染整棵子树要花的毫秒数。它是每个组件最近一次渲染耗时的总和'],
      ['<code>startTime</code> / <code>commitTime</code>', '开始渲染和提交的时间戳'],
    ]),
    p('比较这两个数字，就能判断记忆化有没有生效。先用下面的示例看它们怎样变化，再总结读法。'),
    p('下面的列表有 200 行，每行故意阻塞 0.2ms。点“无关计数”按钮，在控制台中看两个数字。'),
    Object.assign(play(`
import { useState, memo, Profiler } from 'react';

function SlowRow({ i }) {
  const start = performance.now();
  while (performance.now() - start < 0.2) {} // 每行阻塞 0.2ms
  return <li>第 {i + 1} 行</li>;
}

function List() {
  const rows = [];
  for (let i = 0; i < 200; i++) rows.push(<SlowRow key={i} i={i} />);
  return <ul style={{ height: 120, overflow: 'auto' }}>{rows}</ul>;
}
const MemoList = memo(List);

// 不要在 onRender 里调用 set 函数：那会引起新的提交，形成循环
function onRender(id, phase, actualDuration, baseDuration) {
  console.log(id + ' ' + phase + '：actual ' + actualDuration.toFixed(1) +
    'ms，base ' + baseDuration.toFixed(1) + 'ms');
}

function App() {
  const [count, setCount] = useState(0);
  const [useMemoList, setUseMemoList] = useState(false);
  const TheList = useMemoList ? MemoList : List;
  return (
    <Profiler id="页面" onRender={onRender}>
      <label>
        <input type="checkbox" checked={useMemoList}
          onChange={e => setUseMemoList(e.target.checked)} /> 用 memo 包裹列表
      </label>
      <p><button onClick={() => setCount(count + 1)}>无关计数：{count}</button></p>
      <TheList />
    </Profiler>
  );
}`, '读懂 actualDuration 和 baseDuration', '先不勾选，点几次“无关计数”。再勾选 memo，然后再点几次。比较两组数字。<br>勾选后，memo 让列表跳过渲染，actual 明显变小；base 是“不做记忆化时”的估算，基本不变。<br><b>怎样读这两个数字：</b><ol class="task-steps"><li>actualDuration 接近 baseDuration：几乎每个组件都重新渲染了，记忆化没有生效。</li><li>actualDuration 远小于 baseDuration：大部分组件被跳过了。</li><li>baseDuration 本身很大：即使每次都跳过，第一次挂载也会很慢。这时要减少渲染的内容。</li></ol>'), {
      predict: {
        q: '勾选“用 memo 包裹列表”后，再点几次“无关计数”。控制台中的两个数字会怎样？',
        options: ['两个都接近 0', 'actual 接近 0，base 和之前差不多', '两个都和之前差不多', 'actual 变大，base 变成 0'],
        answer: 1,
        explain: 'memo 让列表跳过渲染，所以实际耗时 actual 接近 0。base 是“不做记忆化时”的估算，它保留列表最近一次的渲染耗时，所以不变。',
      },
      pkey: 'profiling|读懂 actualDuration 和 baseDuration',
    }),
    warn('<b>开发版本的耗时偏大</b>。React 开发版本会做很多额外检查，所以通常比生产版本慢好几倍。本课程的运行环境也是开发版本。所以：<ol class="task-steps"><li>在开发版本中，比较<b>修改前后的相对变化</b>。</li><li>要得到真实的数字，用生产版本测量。</li><li>生产版本默认关闭 Profiler。需要时，用带 profiling 的版本：把 <code>react-dom/client</code> 换成 <code>react-dom/profiling</code>（通常在打包工具中设置别名）。</li></ol>'),
    tip('<code>&lt;Profiler&gt;</code> 本身也有 CPU 和内存成本。只包裹你要测量的部分，测量完就移除。'),

    h('工具三：浏览器的 Performance 面板（选读）'),
    p('React Profiler 只测量 React 的工作。但用户感到的“卡”还包括浏览器的工作：执行 JavaScript、计算样式、布局、绘制。Chrome DevTools 的 Performance 面板能显示全部。'),
    p('录制步骤：'),
    p('<ol class="task-steps"><li>打开 Performance 面板，把 CPU 设为 4x slowdown。</li><li>点录制按钮。</li><li>执行慢操作。</li><li>点停止。</li><li>在 Main 轨道中找<b>长任务</b>：超过 50ms 的任务，右上角有红色三角。</li><li>展开长任务。看时间花在脚本（JavaScript）、样式计算，还是布局。</li></ol>'),
    p('<b>React 19.2 起</b>，Performance 面板中多了 React 自己的轨道（Performance Tracks）：'),
    ul(['<b>Scheduler 轨道</b>：按优先级显示 React 的工作。子轨道有 Blocking（同步更新，通常来自用户操作）、Transition（startTransition 中的更新）、Suspense 和 Idle。每次更新分为 Update、Render、Commit 等阶段。', '<b>Components 轨道</b>：用火焰图显示组件的渲染和 effect 耗时。开发版本中还显示 “Changed props”。']),
    table(['', '开发版本', 'profiling 版本', '生产版本'], [
      ['Scheduler 轨道', '有', '有', '无'],
      ['Components 轨道', '有', '只显示 &lt;Profiler&gt; 包裹的子树（装了 React DevTools 则全部显示）', '无'],
      ['级联更新提示、Changed props', '有', '无', '无'],
    ]),
    deep('本课程运行在 React 18.3.1 上，所以看不到这些轨道。在你自己的 React 19.2+ 项目中，用开发版本录制一次 Performance，就能看到它们。前一课的 useTransition 演示，在 Scheduler 轨道中会显示在 Transition 子轨道里。'),

    h('用户感受到的指标：Web Vitals（选读）'),
    p('最终目标不是“组件快”，而是“用户觉得快”。Google 用 Core Web Vitals 衡量用户体验。其中两个和 React 关系最大：'),
    table(['指标', '测量什么', '“良好”标准', 'React 中的常见原因'], [
      ['<b>INP</b>（Interaction to Next Paint）', '从用户点击、按键，到屏幕画出下一帧的时间', '≤ 200ms', '操作触发的渲染和提交太慢；一次更新重新渲染了大片组件树；列表 DOM 太多'],
      ['<b>LCP</b>（Largest Contentful Paint）', '页面上最大的内容（大图或大段文字）显示出来的时间', '≤ 2.5s', 'JavaScript 包太大；主要内容要等客户端渲染完才出现；数据请求排成瀑布'],
    ]),
    p('标准按真实用户的第 75 百分位计算。INP 的常用对策：减少一次更新渲染的组件（状态下移、memo）；把不紧急的更新放进 startTransition；用虚拟列表减少 DOM。LCP 的常用对策：代码分割（lazy）、服务端渲染、提前请求数据。'),

    h('长列表：只渲染看得见的行'),
    p('一个列表有 5000 行。每行很简单，memo 也生效了。可是第一次显示仍然很慢。原因是 5000 个 DOM 节点本身：创建、计算样式、布局，都要时间。memo 不能减少 DOM。'),
    p('解决方法是<b>虚拟列表</b>（英文 virtualization）。虚拟列表只渲染可见区域里的行，其余位置用空白占位。它分四步：'),
    ({ t: 'call', kind: 'tip', label: '虚拟列表的四步', html: '<ol class="task-steps"><li>滚动容器有固定高度。</li><li>根据 scrollTop 算出哪些行在可见区域中。</li><li>只渲染这些行，再加上下几行备用（overscan），防止快速滚动时出现空白。</li><li>用占位高度保持滚动条的总长度。</li></ol>' }),
    fig(`<div class="steps"><div class="step"><b>上方占位</b><span>高度 = 起始下标 × 行高。<em>没有</em> DOM 行</span></div><div class="step"><b>可见行 + overscan</b><span>只有这十几行是真实的 DOM</span></div><div class="step"><b>下方占位</b><span>高度 = 剩余行数 × 行高。让滚动条长度不变</span></div></div>`, '虚拟列表：DOM 数量只和可见区域有关，和总行数无关'),
    play(`
import { useState, useRef, useEffect, Profiler } from 'react';

const ROW = 24, VIEW = 192, TOTAL = 5000, OVERSCAN = 3;

function Row({ i }) {
  return <div className="row" style={{ height: ROW, borderBottom: '1px solid #eee' }}>第 {i + 1} 行</div>;
}

function FullList() {
  const rows = [];
  for (let i = 0; i < TOTAL; i++) rows.push(<Row key={i} i={i} />);
  return <div style={{ height: VIEW, overflow: 'auto' }}>{rows}</div>;
}

function WindowedList() {
  const [scrollTop, setScrollTop] = useState(0);
  const start = Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN);
  const end = Math.min(TOTAL, Math.ceil((scrollTop + VIEW) / ROW) + OVERSCAN);
  const rows = [];
  for (let i = start; i < end; i++) rows.push(<Row key={i} i={i} />);
  return (
    <div style={{ height: VIEW, overflow: 'auto' }} onScroll={e => setScrollTop(e.currentTarget.scrollTop)}>
      <div style={{ height: start * ROW }} />
      {rows}
      <div style={{ height: (TOTAL - end) * ROW }} />
    </div>
  );
}

function onRender(id, phase, actualDuration) {
  console.log(id + ' ' + phase + '：' + actualDuration.toFixed(1) + 'ms');
}

function App() {
  const [mode, setMode] = useState('full');
  const box = useRef(null);
  useEffect(() => {
    console.log('DOM 中的行数：' + box.current.querySelectorAll('.row').length);
  }, [mode]);
  return (
    <div>
      <button onClick={() => setMode('full')}>全部渲染</button>{' '}
      <button onClick={() => setMode('windowed')}>虚拟列表</button>
      <p>当前：{mode === 'full' ? '全部渲染 5000 行' : '只渲染可见行'}</p>
      <div ref={box}>
        <Profiler id={mode} key={mode} onRender={onRender}>
          {mode === 'full' ? <FullList /> : <WindowedList />}
        </Profiler>
      </div>
    </div>
  );
}`, '虚拟列表前后对比', '分别点两个按钮，比较 mount 的耗时和 DOM 行数。然后在虚拟列表中滚动：每次 update 只要很短的时间。'),
    p('真实项目中，不要自己写。用成熟的库，它们还处理了行高不固定、横向滚动、网格等情况：'),
    code(`// TanStack Virtual：只提供计算，DOM 结构由你决定
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef(null);
const virtualizer = useVirtualizer({
  count: 10000,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35,
});
// 渲染 virtualizer.getVirtualItems()，外层高度用 virtualizer.getTotalSize()

// react-window（2.x）：提供现成的 <List> 组件
// <List rowComponent={Row} rowCount={10000} rowHeight={35} rowProps={{ items }} />`, '两个常用的虚拟列表库'),
    warn('虚拟列表也有代价：浏览器的“页面内查找”（Ctrl+F）找不到没渲染的行；屏幕阅读器只读到可见的行。几百行以内的列表，通常不需要它。'),

    h('常见瓶颈清单'),
    table(['在 Profiler 中看到', '可能的原因', '对策'], [
      ['所有读取某个 Context 的组件一起渲染', 'Provider 的 value 每次都是新对象', '用 useMemo 固定 value；或把 Context 拆小'],
      ['某个组件每次都是 mount，state 丢失', '在组件内部定义了组件', '把组件定义移到外面'],
      ['第一次显示很慢，Performance 中布局时间很长', '列表 DOM 太多', '虚拟列表、分页'],
      ['打字时一大片组件重新渲染', 'state 放得太高', '状态下移；或用 useDeferredValue'],
      ['子组件 memo 了，仍然重新渲染', 'props 中有新函数或新对象', 'useCallback / useMemo，或 React Compiler'],
    ]),

    h('React Compiler 改变了什么（选读）'),
    p('React Compiler 在编译时自动做记忆化。启用后，很多“不必要的重新渲染”自然消失。在 React DevTools 中，被编译器优化的组件旁边有 “Memo ✨” 标记。'),
    p('但测量仍然必要。编译器不能解决这些问题：'),
    p('<ol class="task-steps"><li>DOM 太多。5000 行仍然是 5000 个节点。</li><li>输入真的变了。依赖变化时，昂贵的计算照样要重新执行。</li><li>网络和 JavaScript 包大小。这些影响 LCP，与记忆化无关。</li><li>编译器跳过的组件。违反 React 规则的代码不会被优化。</li></ol>'),
    deep('有了编译器，Profiler 中的火焰图会出现更多灰色条（没有渲染）。这时剩下的黄色条，通常就是“真的慢”的部分：大列表、昂贵计算、或者一次更新本身影响了很多数据。'),
  ],
  quiz: [
    {
      q: '在搜索框打字时，Profiler 显示 ResultList 每次的 actualDuration 约 45ms，baseDuration 约 46ms。“Why did this render?” 显示 “The parent component rendered”。ResultList 的 props 并没有变。最直接的修复是？',
      options: ['把 ResultList 改成虚拟列表，只渲染可见的那些结果行', '用 memo 包裹 ResultList，或把输入框的 state 下移', '换成生产版本，问题就会消失', '给所有函数加 useCallback'],
      answer: 1,
      explain: 'actual 接近 base，说明每次都完整重新渲染；原因是父组件渲染，props 没变。memo 或状态下移能让它跳过。虚拟列表能减少耗时，但没有解决“不必要的渲染”。生产版本只会变快一些。ResultList 没有收到函数 props，useCallback 无用。',
    },
    {
      q: '一个 8000 行的表格。Profiler 显示每次更新只要 2ms，memo 全都生效了。但第一次打开表格要 1.5 秒。Performance 面板显示大部分时间花在“样式计算”和“布局”上。应该怎么做？',
      options: ['再给每一行加 useMemo', '用 useTransition 包裹所有更新', '用虚拟列表，只渲染可见行', '把表格拆成更多小组件'],
      answer: 2,
      explain: '时间花在浏览器处理 DOM 上，不在 React 渲染上。虚拟列表直接减少 DOM 节点。记忆化和拆组件都不能减少 DOM，而 Profiler 已经显示 memo 全都生效。startTransition 最有迷惑性：它让界面在等待时仍可交互，但工作量一点没少，第一次打开照样要 1.5 秒。',
    },
    {
      q: '在本地开发服务器上测得某次提交耗时 120ms。下面哪个结论最合理？',
      options: ['用户那里也是 120ms，必须马上给相关组件都加上 memo', '数字偏大。先比较修改前后的变化，再用生产版本确认', '开发版本不准，所以在开发时测量没有意义', '把 <Profiler> 留在生产代码里，线上就能测到同样的 120ms'],
      answer: 1,
      explain: '开发版本通常比生产版本慢好几倍，但相对变化仍有参考价值。“测量没有意义”是矫枉过正：修改前 120ms、修改后 30ms，这个变化在生产版本里通常也成立。生产版本默认关闭 Profiler，要用 react-dom/profiling 才能测量。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>现在，<code>#viewport</code> 中渲染了全部 5000 行。把它改成虚拟列表。</li><li>用 state 记录滚动容器的 <code>scrollTop</code>，在 <code>onScroll</code> 中更新它。</li><li>根据 <code>scrollTop</code>、<code>ROW_HEIGHT</code> 和 <code>VIEW_HEIGHT</code>，算出第一个和最后一个可见行的下标。上下各多渲染 <code>OVERSCAN</code> 行。下标不能小于 0，也不能超过 5000 行的范围。</li><li>只为这个范围内的下标创建行。每行保留 <code>className="row"</code> 和文字“第 N 行”。</li><li>保持滚动条的总长度：内容的总高度必须是 5000 × 30 = 150000px。每一行要出现在它本来的位置。</li><li>检查结果：任何时候，DOM 中的 <code>.row</code> 不超过 80 个。</li></ol>',
    starter: `import { useState } from 'react';

const ROW_HEIGHT = 30;   // 每行高度（px）
const VIEW_HEIGHT = 300; // 可见区域高度（px）
const TOTAL = 5000;      // 总行数
const OVERSCAN = 5;      // 上下各多渲染几行

function App() {
  const rows = [];
  for (let i = 0; i < TOTAL; i++) {
    rows.push(
      <div key={i} className="row" style={{ height: ROW_HEIGHT }}>第 {i + 1} 行</div>
    );
  }
  return (
    <div id="viewport" style={{ height: VIEW_HEIGHT, overflow: 'auto', border: '1px solid #ccc' }}>
      {rows}
    </div>
  );
}`,
    solution: `import { useState } from 'react';

const ROW_HEIGHT = 30;   // 每行高度（px）
const VIEW_HEIGHT = 300; // 可见区域高度（px）
const TOTAL = 5000;      // 总行数
const OVERSCAN = 5;      // 上下各多渲染几行

function App() {
  const [scrollTop, setScrollTop] = useState(0);
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(TOTAL, Math.ceil((scrollTop + VIEW_HEIGHT) / ROW_HEIGHT) + OVERSCAN);

  const rows = [];
  for (let i = start; i < end; i++) {
    rows.push(
      <div key={i} className="row"
        style={{ position: 'absolute', top: i * ROW_HEIGHT, left: 0, right: 0, height: ROW_HEIGHT }}>
        第 {i + 1} 行
      </div>
    );
  }
  return (
    <div id="viewport" style={{ height: VIEW_HEIGHT, overflow: 'auto', border: '1px solid #ccc' }}
      onScroll={e => setScrollTop(e.currentTarget.scrollTop)}>
      <div style={{ position: 'relative', height: TOTAL * ROW_HEIGHT }}>
        {rows}
      </div>
    </div>
  );
}`,
    faded: `import { useState } from 'react';

const ROW_HEIGHT = 30;   // 每行高度（px）
const VIEW_HEIGHT = 300; // 可见区域高度（px）
const TOTAL = 5000;      // 总行数
const OVERSCAN = 5;      // 上下各多渲染几行

function App() {
  const [scrollTop, setScrollTop] = useState(0);
  /* ✏️ start：第一个可见行的下标（scrollTop ÷ 行高，向下取整），再减 OVERSCAN，不小于 0 */
  /* ✏️ end：最后一个可见行之后的下标（(scrollTop + 可见高度) ÷ 行高，向上取整），再加 OVERSCAN，不超过 TOTAL */

  const rows = [];
  for (let i = start; i < end; i++) {
    rows.push(
      <div key={i} className="row"
        style={/* ✏️ 绝对定位：top 是这一行本来的位置 i × 行高 */}>
        第 {i + 1} 行
      </div>
    );
  }
  return (
    <div id="viewport" style={{ height: VIEW_HEIGHT, overflow: 'auto', border: '1px solid #ccc' }}
      onScroll={e => setScrollTop(e.currentTarget.scrollTop)}>
      <div style={/* ✏️ 相对定位，高度是全部行的总高度，撑出滚动条 */}>
        {rows}
      </div>
    </div>
  );
}`,
    hint: '回到本课的“虚拟列表前后对比”示例，看 WindowedList。想一想：scrollTop 除以行高，得到的是哪一行？只渲染一部分行以后，怎样让第 2501 行仍然出现在 75000px 的位置？上下占位 div 和 position: absolute 两种方法都可以。',
    test: async (t) => {
      const vp = t.q('#viewport');
      t.assert(vp, '找不到 id="viewport" 的滚动容器');
      const rows = () => t.qa('#viewport .row');
      const nums = () => rows().map(r => Number((r.textContent.match(/第\s*(\d+)\s*行/) || [])[1])).filter(n => n > 0);
      const range = (a) => a.length ? Math.min(...a) + '–' + Math.max(...a) : '（没有）';
      t.assert(rows().length > 0, '找不到 className="row" 的行。每行要保留 className="row"');
      t.assert(rows().length <= 80, `DOM 中有 ${rows().length} 行。只渲染可见行和少量 overscan（不超过 80 行）`);
      t.assert(nums().includes(1), '一开始应显示“第 1 行”');
      t.assert(vp.scrollHeight >= 149000 && vp.scrollHeight <= 151000,
        `内容的总高度应为 5000 × 30 = 150000px，实际是 ${vp.scrollHeight}px。没渲染的行也要占位`);
      const scrollTo = async (y) => { vp.scrollTop = y; vp.dispatchEvent(new Event('scroll')); await t.wait(150); };
      await scrollTo(75000);
      const mid = nums();
      t.assert(mid.includes(2501) && mid.includes(2510),
        `滚动到 75000px 后，应显示第 2501–2510 行。现在 DOM 中是第 ${range(mid)} 行。滚动时要更新 state，并重新计算范围`);
      t.assert(!mid.includes(1), '滚动后，第 1 行应该从 DOM 中移除');
      t.assert(rows().length <= 80, `滚动后 DOM 中有 ${rows().length} 行，太多了`);
      const row = rows().find(r => /第\s*2501\s*行/.test(r.textContent));
      const dy = row.getBoundingClientRect().top - vp.getBoundingClientRect().top;
      t.assert(Math.abs(dy) <= 35,
        `第 2501 行应出现在可见区域顶部，实际偏离 ${Math.round(dy)}px。检查每行的位置：上方占位的高度，或 top 的值`);
      await scrollTo(vp.scrollHeight);
      const end = nums();
      t.assert(end.includes(5000), `滚动到底部后应显示“第 5000 行”。现在 DOM 中是第 ${range(end)} 行`);
      t.assert(!end.some(n => n > 5000) && !/undefined|NaN/.test(vp.textContent), '不要渲染超出范围的行。检查结束下标的上限');
    },
  },
});
