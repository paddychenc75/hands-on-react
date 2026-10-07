/* ========== 第六阶段：性能诊断实战（第 44 课） ========== */
lesson({
  id: 'perf-clinic', stage: 5, title: '性能诊断实战', mins: 40,
  summary: '拿到一份不是你写的、很卡的代码。按“复现、测量、假设、修改、再测量”的流程找出病因，用数字证明修好了，并且功能不变。',
  goals: [
    '能按“复现、测量、假设、修改、再测量”的流程诊断陌生代码，并把每个假设写成可以验证的预测',
    '能根据 Profiler 中的特征（谁渲染了、渲染几次、一次操作几次提交）区分六类常见病因',
    '能用渲染计数、提交计数和监听器计数量化一次修复，并据此判断修复是否达到性能预算',
    '能诊断监听器泄漏，并判断什么时候该用代码分割，而不是继续做记忆化',
  ],
  keyPoints: [
    '从用户的操作出发，不从代码出发。先固定一个可复现的慢操作，记下基线数字，再读代码。',
    '每个假设都要写成预测：“如果病因是 X，那么改掉 X 后，数字 Y 会从 a 变成 b。”数字没变，就换一个假设。',
    'memo 挡不住 Context。Provider 的 value 每次都是新对象时，所有读取它的组件都会重新渲染，不管有没有 memo。',
    '一次操作产生多次提交，通常是 effect 在提交后又调用了 set 函数。能在渲染时算出的值，就在渲染时算。',
    '性能预算用计数和体积写进自动检查（提交次数、渲染次数、监听器数、包体积），用毫秒监控趋势。毫秒受机器影响，计数不受。',
  ],
  body: [
    p('第 20 课学了记忆化，第 24 课学了测量工具。它们都假设你知道代码哪里慢。真实工作常常相反：你接手一个陌生的页面，用户只说一句“搜索框打字很卡”。'),
    p('这一课把前面的工具组合成一套<b>诊断流程</b>，像医生看病例一样：先问症状，再做检查，然后提出诊断，治疗后复查。'),

    h('一、诊断流程：从症状到证据'),
    fig(`<div class="steps"><div class="step"><b>① 复现</b><span>把“很卡”变成固定的操作步骤</span></div><div class="step"><b>② 测量</b><span>记下基线：提交次数、耗时、谁渲染了</span></div><div class="step"><b>③ 假设</b><span>写成可验证的预测</span></div><div class="step"><b>④ 修改</b><span>只改假设指向的一处</span></div><div class="step"><b>⑤ 再测量</b><span>和基线比。没变，就撤销修改</span></div></div>`, '诊断流程：每一步都留下数字'),
    p('这五步看起来和第 24 课的四步相似。区别在第 ③ 步。面对陌生代码，你不知道该改哪里。所以先写下假设，再动手：'),
    ul([
      '<b>坏的假设</b>：“可能是渲染太多了，加点 memo 试试。”它不能被证伪，改完也说不清是哪一处起了作用。',
      '<b>好的假设</b>：“打字时 12 个 NavItem 都渲染了，它们的 props 没变。如果病因是 Context 的 value 每次都是新对象，那么固定 value 后，NavItem 的渲染次数会从 12 降到 0。”',
    ]),
    p('好的假设说清了三件事：观察到的现象、怀疑的原因、修改后数字会怎样变化。数字照预测变化，假设成立；没变，就撤销修改，换下一个假设。'),
    tip('读陌生代码时，可以先搜几个“高危写法”：<code>value={{</code>（Context 的内联对象）、effect 里直接调用 set 函数、没有对应 remove 的 <code>addEventListener</code> 或 <code>subscribe</code>、组件函数里定义的组件。搜到的只是嫌疑，仍要用数字确认。'),

    h('二、六类常见病因和它们的特征'),
    p('每类病因在 Profiler 里都有可辨认的特征。下表的“验证实验”一栏，就是第 ③ 步要写的预测。'),
    table(['病因', 'Profiler 中的特征', '验证实验', '常见修法'], [
      ['Context 的 value 每次新建', '和操作无关的 Context 消费者全部渲染，原因是 “Context changed”', '临时固定 value，消费者的渲染次数应降到 0', 'useMemo 固定 value；把常变和不常变的数据拆成两个 Context'],
      ['内联对象或函数打破 memo', 'memo 组件仍然渲染，原因是 “Props changed: (style)”', '把这个 prop 移到组件外，渲染应消失', '移到组件外；useMemo / useCallback；React Compiler'],
      ['昂贵计算没有记忆化', '某个组件自身耗时很长，而且和输入无关', '在计算函数里计数，操作后次数应不变', 'useMemo；或者移到组件外、移到服务端'],
      ['列表没有虚拟化', '一次提交里大量行在挂载；Performance 面板中布局时间很长', '把行数减到 50，耗时应大幅下降', '虚拟列表、分页（第 24 课）'],
      ['effect 连锁更新', '一次操作产生 2 次以上的提交', '把派生值改成渲染时计算，提交应降到 1 次', '渲染时计算；用 key 重置 state；在事件处理函数中一次更新'],
      ['监听器泄漏', '操作越多越慢；同一个事件触发多次回调', '重复操作 10 次，监听器数应保持不变', 'effect 返回清理函数，移除同一个函数引用'],
    ]),
    p('还有一类在第 24 课的表里：组件内定义的组件。它的特征是子树每次都显示为 “mount”，输入框丢失焦点。'),
    p('下面的示例复现第一类病因。20 个 Item 都用 memo 包着，它们的 label 从不改变。先预测，再运行。'),
    Object.assign(play(`
import { useState, useMemo, useEffect, createContext, useContext, memo } from 'react';

const ThemeContext = createContext(null);
let renders = 0; // 仅用于演示：统计这次提交里 Item 渲染了几次

const Item = memo(function Item({ label }) {
  renders++;
  const { theme } = useContext(ThemeContext);
  return <li style={{ color: theme === 'dark' ? '#2e86de' : 'inherit' }}>{label}</li>;
});

const LABELS = Array.from({ length: 20 }, (_, i) => '菜单 ' + (i + 1));

export default function App() {
  const [text, setText] = useState('');
  const [theme, setTheme] = useState('light');
  const [fixed, setFixed] = useState(false);

  const inline = { theme, setTheme };
  const stable = useMemo(() => ({ theme, setTheme }), [theme]);
  const value = fixed ? stable : inline;

  useEffect(() => {
    console.log('这次提交，Item 渲染了 ' + renders + ' 次');
    renders = 0;
  });

  return (
    <ThemeContext.Provider value={value}>
      <label>
        <input type="checkbox" checked={fixed} onChange={e => setFixed(e.target.checked)} />
        {' '}用 useMemo 固定 value
      </label>
      <p><input value={text} onChange={e => setText(e.target.value)} placeholder="在这里打字" /></p>
      <ul style={{ columns: 2 }}>
        {LABELS.map(l => <Item key={l} label={l} />)}
      </ul>
    </ThemeContext.Provider>
  );
}`, 'memo 挡得住 Context 吗？', '不勾选时打几个字：每次都是 20。勾选后再打字：每次都是 0。<br><b>原因</b>：memo 只比较 props。Item 还读取了 Context，而 Context 的变化绕过 memo 直接通知消费者。<code>{ theme, setTheme }</code> 每次渲染都是新对象，React 用 Object.is 比较 value，判定“变了”。勾选后 value 只在 theme 变化时才是新对象。'), {
      predict: {
        q: '不勾选复选框。在输入框里打一个字。Item 都用 memo 包着，label 没变。控制台会显示这次提交里 Item 渲染了几次？',
        options: ['0 次：memo 让它们全部跳过', '1 次：只有第一个 Item 渲染', '20 次：每个 Item 都重新渲染', '40 次：每个 Item 渲染两次'],
        answer: 2,
        explain: 'App 重新渲染时，<code>{ theme, setTheme }</code> 是一个新对象。Provider 的 value 变了，React 通知所有读取这个 Context 的组件重新渲染。memo 只能挡住“props 没变”的渲染，挡不住 Context 的变化。所以 20 个 Item 全部渲染。',
      },
      pkey: 'perf-clinic|memo 挡得住 Context 吗？',
    }),

    h('三、量化：用计数说话'),
    p('毫秒数受机器、浏览器扩展、开发版本影响，每次测都不一样。<b>计数</b>稳定得多：同样的操作，在任何机器上提交次数都一样。诊断时优先记录三种计数：'),
    ul([
      '<b>提交次数</b>：用 <code>&lt;Profiler onRender&gt;</code> 包住根组件，每次回调计 1。一次按键应该只有 1 次提交。',
      '<b>渲染次数</b>：在可疑组件里计数（只用于诊断，查完删掉）。和这次操作无关的组件应该是 0。',
      '<b>监听器数量</b>：订阅集合的 size，或者在 Chrome 控制台运行 <code>getEventListeners(window)</code>。重复操作后数量应该不变。',
    ]),
    p('下面的示例复现 effect 连锁更新。切换分类后，列表要筛选，并默认选中第一件商品。先看控制台里每次点击产生几次提交，再勾选“渲染时计算”对比。'),
    play(`
import { useState, useEffect, useMemo, Profiler } from 'react';

const PRODUCTS = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1, cat: ['图书', '电器', '服装'][i % 3],
}));

// 写法 A：两个 effect 接力
function ChainedList({ cat }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  useEffect(() => { setItems(PRODUCTS.filter(p => p.cat === cat)); }, [cat]);
  useEffect(() => { if (items.length) setSelected(items[0].id); }, [items]);
  return (
    <p>
      {cat}：{items.length} 件，选中 #{selected}{' '}
      <button onClick={() => setSelected(selected + 3)}>下一件</button>
    </p>
  );
}

// 写法 B：渲染时计算；用 key 让选中项随分类重置
function DerivedList({ cat }) {
  const items = useMemo(() => PRODUCTS.filter(p => p.cat === cat), [cat]);
  const [selected, setSelected] = useState(items[0].id);
  return (
    <p>
      {cat}：{items.length} 件，选中 #{selected}{' '}
      <button onClick={() => setSelected(selected + 3)}>下一件</button>
    </p>
  );
}

let commits = 0;
function onRender(id, phase, actualDuration) {
  commits++;
  console.log('  提交 #' + commits + '（' + phase + '）');
}

export default function App() {
  const [cat, setCat] = useState('图书');
  const [derived, setDerived] = useState(false);
  function choose(c) {
    console.log('—— 点击：' + c);
    setCat(c);
  }
  return (
    <div>
      <label>
        <input type="checkbox" checked={derived} onChange={e => setDerived(e.target.checked)} />
        {' '}渲染时计算（写法 B）
      </label>
      <p>
        {['图书', '电器', '服装'].map(c => (
          <button key={c} onClick={() => choose(c)} disabled={c === cat}>{c}</button>
        ))}
      </p>
      <Profiler id="list" onRender={onRender}>
        {derived ? <DerivedList key={cat} cat={cat} /> : <ChainedList cat={cat} />}
      </Profiler>
    </div>
  );
}`, '一次点击，几次提交？', '不勾选时，每次点击产生 3 次提交：<ol class="task-steps"><li>cat 变化，渲染并提交。此时 items 还是旧分类的数据。</li><li>第一个 effect 调用 setItems，第二次提交。</li><li>第二个 effect 调用 setSelected，第三次提交。</li></ol>勾选后，每次点击只有 1 次提交。用户可能看不到中间状态，但每次提交都要完整地渲染、比较和修改 DOM，耗时成倍增加。中间状态还会让界面短暂地“自相矛盾”：分类是电器，列表却是图书。'),
    warn('<b>不要在 onRender 里调用 set 函数。</b>那会引起新的提交，又触发 onRender，形成循环。把计数存在普通变量或 ref 里，用控制台输出。'),

    h('四、性能预算：什么叫“修好了”'),
    p('“快一点”不是目标。<b>性能预算</b>是团队事先约定的上限，超过就算缺陷。有了预算，才知道什么时候可以停手。下面是一组示例，具体数字按你的用户设备来定：'),
    table(['预算项', '示例上限', '怎样检查'], [
      ['交互到下一帧（INP）', '≤ 200ms（Google 的“良好”线）；React 的渲染和提交部分 ≤ 100ms', '在 4 倍 CPU 节流下用 Performance 面板测；线上用真实用户数据'],
      ['每次按键的提交次数', '1 次', 'Profiler onRender 计数，可以写成自动测试'],
      ['与操作无关的组件渲染', '0 次', '渲染计数，或 React DevTools 的高亮'],
      ['长任务', '交互期间没有超过 50ms 的任务', 'Performance 面板中带红色三角的任务'],
      ['首屏 JS', '例如 ≤ 170KB（gzip 后）', '构建产物分析，CI 中自动比较'],
    ]),
    p('把预算写进自动检查时，<b>优先用计数和体积</b>。CI 机器的速度时快时慢，毫秒阈值会随机失败，团队很快就会忽略它。毫秒数适合放在监控里看趋势：一次发布后 INP 的第 75 百分位变差了，就去查这次发布。'),

    h('五、监听器泄漏'),
    p('泄漏的特征是“越用越慢”：刚打开很流畅，操作一段时间后变卡，内存也越来越大。最常见的原因是订阅没有取消：'),
    play(`
import { useState, useEffect } from 'react';

const bus = {
  listeners: new Set(),
  on(fn) {
    bus.listeners.add(fn);
    return () => bus.listeners.delete(fn);
  },
};

function Watcher({ filter, cleanup }) {
  useEffect(() => {
    const off = bus.on(msg => { if (msg.includes(filter)) console.log('匹配：' + msg); });
    if (cleanup) return off;
  }, [filter, cleanup]);
  return null;
}

export default function App() {
  const [filter, setFilter] = useState('');
  const [cleanup, setCleanup] = useState(false);
  useEffect(() => {
    console.log('当前监听器数量：' + bus.listeners.size);
  });
  return (
    <div>
      <label>
        <input type="checkbox" checked={cleanup} onChange={e => setCleanup(e.target.checked)} />
        {' '}返回清理函数
      </label>
      <p><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="输入筛选词" /></p>
      <Watcher filter={filter} cleanup={cleanup} />
    </div>
  );
}`, '监听器会越积越多吗？', '不勾选时打字，监听器数量每次加 1。旧的监听器还在，它们记着旧的筛选词，所以泄漏不只浪费内存，还会产生错误的结果。勾选后，每次 effect 重新执行前都会移除旧的监听，数量不再增长。<br>但数量不会回到 1：勾选之前泄漏的监听器没有人移除。真实应用里，它们会一直留到页面刷新。点“运行”重来，先勾选再打字，数量就一直是 1。'),
    p('排查泄漏的步骤：'),
    p('<ol class="task-steps">'
      + '<li>找一个可以重复的操作，例如打开再关闭弹窗。</li>'
      + '<li>重复 10 次，比较前后的监听器数量或订阅数量。</li>'
      + '<li>数量随次数增长，就检查对应 effect 的清理函数。常见错误：清理函数里写了一个新的箭头函数，移除的不是同一个引用。</li>'
      + '</ol>'),

    h('六、内存泄漏的排查（选读）'),
    p('监听器只是泄漏的一种。更一般的方法是用 Chrome DevTools 的 Memory 面板比较堆快照：'),
    p('<ol class="task-steps">'
      + '<li>打开页面，点垃圾桶图标强制回收，拍第一张堆快照。</li>'
      + '<li>重复可疑操作 10 次，例如进入再离开某个页面。</li>'
      + '<li>再次强制回收，拍第二张快照。选择 “Comparison” 视图。</li>'
      + '<li>按 “# Delta” 排序。数量增长了约 10 的倍数的对象，就是嫌疑。</li>'
      + '<li>在过滤框中输入 “Detached”，查找已经离开页面、却仍被引用的 DOM 节点。</li>'
      + '<li>选中一个对象，看下方的 Retainers：它沿着哪条引用链被保留。链上常见的是闭包、模块级的缓存 Map、未清除的定时器。</li>'
      + '</ol>'),
    p('模块级缓存要有上限。例如只保留最近 50 条，或者用 <code>WeakMap</code> 以对象为键，对象被回收后缓存项也随之释放。'),

    h('七、包体积与代码分割（选读）'),
    p('前面的病因都发生在交互时。另一类慢发生在打开页面时：要下载、解析、执行的 JavaScript 太多，LCP 和首次交互都被拖慢。记忆化对此毫无帮助。'),
    code(`
// 1. 按路由分割：报表页的代码只在进入报表页时下载
const Reports = lazy(() => import('./pages/Reports.jsx'));

// 2. 按交互分割：很大的库只在用户点击时才加载
async function exportExcel(rows) {
  const XLSX = await import('xlsx');
  // …使用 XLSX 生成文件
}

// 3. 用户可能马上要用的，提前开始下载
<Link to="/reports" onMouseEnter={() => import('./pages/Reports.jsx')}>报表</Link>`, '三种代码分割的时机（需要打包工具，本课环境只能阅读）'),
    ul([
      '<b>先看清楚包里有什么</b>：Vite 项目可以用 rollup-plugin-visualizer，webpack 项目用 webpack-bundle-analyzer，也可以用 source-map-explorer 分析任意产物。常见的发现：整个图标库被打包进来、日期库带上了所有语言包、同一个库有两个版本。',
      '<b>把体积预算放进 CI</b>：例如 size-limit 这类工具。每个 PR 显示包体积的变化，超过预算就失败。',
      '<b>分割也有代价</b>：分得太碎，请求变多，用户点进页面时还要等一次下载。只分割“首屏用不到、而且足够大”的部分。',
    ]),

    h('什么时候停手'),
    p('达到预算就停。剩下的“不必要的渲染”如果很便宜，就让它留着。每多一个 useMemo，代码就多一处要维护的依赖数组。启用 React Compiler 的项目，记忆化交给编译器，你把精力放在编译器解决不了的问题上：DOM 太多、effect 连锁、泄漏和包体积。'),
  ],
  quiz: [
    {
      q: '接手的页面打字很卡。Profiler 显示每次按键时 30 个 UserCard 都在渲染，原因是 “Context changed”。UserCard 已经用 memo 包着。下面哪一步最能验证“Provider 的 value 每次都是新对象”这个假设？',
      options: ['临时用 useMemo 固定 Provider 的 value，再录一次，看 UserCard 的渲染次数是否降到 0', '给 UserCard 的子组件也加上 memo，再录一次', '换成生产版本再录一次，看耗时是否下降', '把 30 个 UserCard 改成虚拟列表'],
      answer: 0,
      explain: '好的验证实验只改假设指向的那一处，并预先说出数字会怎样变化。固定 value 后渲染次数降到 0，假设成立。给子组件加 memo 是最迷惑的选项：Context 的变化绕过 memo，它不会改变 UserCard 的渲染次数，也就验证不了任何东西。生产版本和虚拟列表都会让数字变小，但说明不了病因。',
    },
    {
      q: '一次点击产生 3 次提交，每次约 8ms。同事说：“每次都低于 16ms，一帧就能完成，不用管。”哪个判断最准确？',
      options: ['同事说得对，只要单次提交低于 16ms 就不会卡', '应该把 3 次提交都放进 startTransition', '应该给所有组件加 memo，让每次提交更快', '3 次提交在同一次交互里，总耗时约 24ms；中间提交还可能显示不一致的界面。应把派生值改成在渲染时计算'],
      answer: 3,
      explain: '用户感受到的是整次交互的耗时，3 次提交加起来超过了一帧。effect 连锁还会让中间状态出现在 DOM 中，例如分类已变、列表还是旧的。根治的方法是消除多余的提交：在渲染时计算派生值，或者在事件处理函数里一次更新所有 state。memo 和 startTransition 都没有减少提交次数。',
    },
    {
      q: '团队想在 CI 中加一条性能检查，防止搜索框再次变卡。哪条最可靠？',
      options: ['断言每次按键的 actualDuration 小于 16ms', '断言每次按键只产生 1 次提交，并且侧边栏的渲染次数为 0', '断言整个测试套件在 30 秒内跑完', '每次 PR 都人工用 Profiler 录一次'],
      answer: 1,
      explain: '计数在任何机器上都一样，所以适合作为 CI 中的预算。毫秒阈值是最迷惑的选项：CI 机器有时快有时慢，16ms 的断言会随机失败，团队很快就会忽略它。毫秒数更适合放在线上监控中看趋势。',
    },
    {
      q: '用户反馈：弹窗打开、关闭十几次后，按一次 Esc 页面会卡一下。你在控制台运行 <code>getEventListeners(document)<wbr>.keydown<wbr>.length</code>，结果是 14。最可能的原因是？',
      options: ['弹窗组件渲染次数太多，需要 memo', 'Esc 键事件会冒泡，触发了 14 次', '弹窗的 effect 添加了 keydown 监听，但清理函数没有移除同一个函数引用', '开发版本会把每个监听器添加两次'],
      answer: 2,
      explain: '每打开一次弹窗就多一个监听器，而关闭时没有移除。常见写法是 <code>return () =&gt; document.removeEventListener(\'keydown\', () =&gt; …)</code>：这里的箭头函数是新创建的，和添加时的不是同一个引用，所以什么也没移除。渲染次数和这个数量无关。冒泡不会增加监听器的数量。',
    },
    {
      q: '一个 380KB 的图表库只在“报表”页使用。首页的 LCP 是 4.1 秒，构建分析显示这个库被打进了首页的包。最合适的做法是？',
      options: ['用 lazy 和动态 import 按路由分割，让报表页的代码在进入报表页时才下载', '用 memo 包住所有图表组件', '把图表库换成 CDN 上的同一个版本，体积就不算了', '用 useMemo 缓存图表的配置对象'],
      answer: 0,
      explain: '这是加载阶段的问题：首页要下载并执行一个用不到的库。代码分割直接把它移出首屏的包。memo 和 useMemo 只影响渲染，对下载和解析的成本毫无帮助。换成 CDN 加载，浏览器照样要下载和执行它，只是不计入你的构建产物，问题并没有消失。',
    },
  ],
  checkOnly: (() => {
    const pre = (src) => '<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">'
      + src.replace(/^\n/, '').replace(/\n\s*$/, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre></div>';
    return [
      {
        q: 'Avatar 用 memo 包着，并读取 AuthContext。用户一直没有登录或退出。Avatar 多久重新渲染一次？' + pre(`
function App() {
  const [user, setUser] = useState(initialUser);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const logout = () => setUser(null);
  return (
    <AuthContext.Provider value={{ user, logout }}>
      <Header now={now} /> <Avatar />
    </AuthContext.Provider>
  );
}`),
        options: ['从不：user 没变，memo 让它跳过', '只在挂载时渲染一次', '每秒两次：Header 和 Provider 各触发一次', '每秒一次：value 每次都是新对象'],
        answer: 3,
        explain: 'now 每秒变化，App 每秒重新渲染。<code>{ user, logout }</code> 每次都是新对象，logout 也是新函数，所以 Provider 的 value 每秒都“变了”。读取这个 Context 的 Avatar 每秒渲染一次，memo 挡不住。修法：用 useMemo 固定 value，并用 useCallback 固定 logout；或者把时钟的 state 移到 Header 里。',
      },
      {
        q: '在“名”输入框里打一个字，会产生几次提交？第一次提交时，屏幕上的全名是什么？' + pre(`
function NameForm() {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    setFullName(first + ' ' + last);
  }, [first, last]);
  return (
    <>
      <input value={first} onChange={e => setFirst(e.target.value)} />
      <input value={last} onChange={e => setLast(e.target.value)} />
      <p>{fullName}</p>
    </>
  );
}`),
        options: ['1 次，全名立刻是新的', '2 次；第一次提交时全名还是旧的', '2 次；两次提交时全名都是新的', '3 次：每个 state 一次'],
        answer: 1,
        explain: '第一次提交时 first 已更新，但 fullName 还是旧值。提交后 effect 执行，调用 setFullName，引起第二次渲染和提交。fullName 能由 first 和 last 算出，就不该存成 state：直接写 <code>const fullName = first + \' \' + last</code>，每次按键只有 1 次提交，而且永远不会显示旧值。',
      },
      {
        q: '组件挂载、卸载 5 次之后，window 上还剩几个 resize 监听？' + pre(`
useEffect(() => {
  window.addEventListener('resize', () => setW(innerWidth));
  return () => {
    window.removeEventListener('resize', () => setW(innerWidth));
  };
}, []);`),
        options: ['0 个', '1 个', '5 个', '10 个'],
        answer: 2,
        explain: '清理函数里的箭头函数是新创建的，和添加时的不是同一个引用。removeEventListener 找不到它，什么也没移除。每次挂载留下一个监听，5 次就是 5 个。而且它们都会调用已卸载组件的 setW。修法：把函数存进一个变量 <code>const onResize = …</code>，添加和移除都用它。',
      },
      {
        q: '在第一行的备注框里写了“加急”，然后在上方的搜索框里打一个字。第一行仍在结果中。备注框会怎样？' + pre(`
function Table({ rows }) {
  const [query, setQuery] = useState('');
  function Row({ row }) {
    const [note, setNote] = useState('');
    return <li>{row.name}
      <input value={note} onChange={e => setNote(e.target.value)} />
    </li>;
  }
  return <>
    <input value={query} onChange={e => setQuery(e.target.value)} />
    <ul>{rows.filter(r => r.name.includes(query))
      .map(r => <Row key={r.id} row={r} />)}</ul>
  </>;
}`),
        options: ['保留“加急”：key 没变，React 复用这一行', '保留“加急”，但这一行多渲染了一次', '搜索框失去焦点，备注保留', '被清空：每次渲染 Row 都是一个新的组件类型，所有行被卸载再重新挂载'],
        answer: 3,
        explain: 'Row 定义在 Table 里面。Table 每次渲染都创建一个新的 Row 函数。React 比较元素类型时发现“不是同一个组件”，就卸载旧的行，挂载新的行。key 只在同一类型之间起作用，所以帮不上忙。note 丢失，Profiler 里这些行每次都显示为 “mount”。修法：把 Row 移到 Table 外面定义。'
      },
    ];
  })(),
  exercise: {
    task: '<ol class="task-steps">'
      + '<li>这个订单仪表盘能用，但打字很卡，而且越用越慢。代码里埋了 4 个性能问题。</li>'
      + '<li><b>先测量</b>：在搜索框里打几个字，看控制台的提交记录；点“模拟推送”和“打印计数”。记下每次按键的提交次数、NavItem 的渲染次数、computeStats 的调用次数和 feed 上的监听器数量。</li>'
      + '<li>对每个异常数字写一个假设，再只改对应的一处，重新测量。</li>'
      + '<li><b>预算</b>：每次按键只产生 1 次提交；打字时 NavItem 渲染 0 次、computeStats 调用 0 次；无论打多少字，一个仪表盘在 feed 上只有 1 个监听器，卸载后为 0 个。</li>'
      + '<li><b>功能不变</b>：筛选结果、统计数字、主题切换、“新到的匹配订单”计数都要和原来一样正确。</li>'
      + '<li>不要删除 <code>probe</code> 中的计数和 <code>computeStats</code> 里的模拟耗时。</li>'
      + '</ol>',
    starter: `import { useState, useEffect, useContext, createContext, memo, Profiler } from 'react';

// ===== 数据 =====
const NAMES = ['张伟', '王芳', '李娜', '刘洋', '陈静', '杨磊', '赵敏', '张丽'];
const ORDERS = Array.from({ length: 120 }, (_, i) => ({
  id: i + 1,
  customer: NAMES[i % NAMES.length],
  amount: ((i * 37) % 500) + 20,
}));

// 实时订单推送。subscribe 返回取消订阅的函数
const feed = {
  listeners: new Set(),
  subscribe(fn) {
    feed.listeners.add(fn);
    return () => feed.listeners.delete(fn);
  },
  emit(order) {
    feed.listeners.forEach(fn => fn(order));
  },
};

// 诊断探针：检查程序会读这两个计数，不要删除
const probe = { navRenders: 0, statsCalls: 0 };

function computeStats(orders) {
  probe.statsCalls++;
  const start = performance.now();
  while (performance.now() - start < 25) {} // 模拟一次昂贵的统计
  const total = orders.reduce((sum, o) => sum + o.amount, 0);
  return { total, avg: Math.round(total / orders.length) };
}

const ThemeContext = createContext(null);
const MENU = ['总览', '订单', '客户', '商品', '库存', '物流', '退款', '发票', '报表', '营销', '会员', '设置'];

const NavItem = memo(function NavItem({ label }) {
  probe.navRenders++;
  const { theme } = useContext(ThemeContext);
  return <li className={'nav-item ' + theme}>{label}</li>;
});

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return <button id="theme" onClick={toggleTheme}>主题：{theme === 'dark' ? '深色' : '浅色'}</button>;
}

const Sidebar = memo(function Sidebar() {
  return (
    <aside style={{ minWidth: 110 }}>
      <ThemeToggle />
      <ul>{MENU.map(m => <NavItem key={m} label={m} />)}</ul>
    </aside>
  );
});

// 实时推送：统计新到的、客户名包含搜索词的订单
function LiveTicker({ query }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    feed.subscribe(order => {
      if (order.customer.includes(query)) setCount(c => c + 1);
    });
  }, [query]);
  return <p id="ticker">新到的匹配订单：{count}</p>;
}

function OrderTable({ query }) {
  const [rows, setRows] = useState(ORDERS);
  useEffect(() => {
    setRows(ORDERS.filter(o => o.customer.includes(query)));
  }, [query]);
  return (
    <div>
      <p id="count">共 {rows.length} 条</p>
      <div style={{ maxHeight: 180, overflow: 'auto' }}>
        <table>
          <tbody>
            {rows.map(o => (
              <tr key={o.id} className="order-row">
                <td>#{o.id}</td><td>{o.customer}</td><td>¥{o.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

let commitNo = 0;
function logCommit(id, phase, actualDuration) {
  commitNo++;
  console.log('提交 #' + commitNo + '（' + phase + '）：' + actualDuration.toFixed(1) + 'ms');
}

const css = '.dash{display:flex;flex-wrap:wrap;gap:12px;padding:8px}'
  + '.dash.dark{background:#222;color:#eee}.nav-item.dark{color:#8cf}';

function App() {
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState('light');
  const stats = computeStats(ORDERS);
  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <Profiler id="dashboard" onRender={logCommit}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <style>{css}</style>
        <div className={'dash ' + theme}>
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0 }}>
            <p id="stats">总额 ¥{stats.total}，平均 ¥{stats.avg}</p>
            <input id="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="按客户筛选，例如：张" />
            <LiveTicker query={query} />
            <p>
              <button onClick={() => feed.emit({ id: Date.now(), customer: NAMES[Date.now() % NAMES.length], amount: 99 })}>模拟推送</button>{' '}
              <button onClick={() => console.log('NavItem 渲染 ' + probe.navRenders + ' 次，computeStats 调用 ' + probe.statsCalls + ' 次，feed 监听 ' + feed.listeners.size + ' 个')}>打印计数</button>
            </p>
            <OrderTable query={query} />
          </main>
        </div>
      </ThemeContext.Provider>
    </Profiler>
  );
}`,
    solution: `import { useState, useEffect, useMemo, useCallback, useContext, createContext, memo, Profiler } from 'react';

// ===== 数据 =====
const NAMES = ['张伟', '王芳', '李娜', '刘洋', '陈静', '杨磊', '赵敏', '张丽'];
const ORDERS = Array.from({ length: 120 }, (_, i) => ({
  id: i + 1,
  customer: NAMES[i % NAMES.length],
  amount: ((i * 37) % 500) + 20,
}));

// 实时订单推送。subscribe 返回取消订阅的函数
const feed = {
  listeners: new Set(),
  subscribe(fn) {
    feed.listeners.add(fn);
    return () => feed.listeners.delete(fn);
  },
  emit(order) {
    feed.listeners.forEach(fn => fn(order));
  },
};

// 诊断探针：检查程序会读这两个计数，不要删除
const probe = { navRenders: 0, statsCalls: 0 };

function computeStats(orders) {
  probe.statsCalls++;
  const start = performance.now();
  while (performance.now() - start < 25) {} // 模拟一次昂贵的统计
  const total = orders.reduce((sum, o) => sum + o.amount, 0);
  return { total, avg: Math.round(total / orders.length) };
}

const ThemeContext = createContext(null);
const MENU = ['总览', '订单', '客户', '商品', '库存', '物流', '退款', '发票', '报表', '营销', '会员', '设置'];

const NavItem = memo(function NavItem({ label }) {
  probe.navRenders++;
  const { theme } = useContext(ThemeContext);
  return <li className={'nav-item ' + theme}>{label}</li>;
});

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return <button id="theme" onClick={toggleTheme}>主题：{theme === 'dark' ? '深色' : '浅色'}</button>;
}

const Sidebar = memo(function Sidebar() {
  return (
    <aside style={{ minWidth: 110 }}>
      <ThemeToggle />
      <ul>{MENU.map(m => <NavItem key={m} label={m} />)}</ul>
    </aside>
  );
});

// 实时推送：统计新到的、客户名包含搜索词的订单
function LiveTicker({ query }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    // 返回取消订阅的函数：搜索词变化或卸载时，旧的订阅被移除
    return feed.subscribe(order => {
      if (order.customer.includes(query)) setCount(c => c + 1);
    });
  }, [query]);
  return <p id="ticker">新到的匹配订单：{count}</p>;
}

function OrderTable({ query }) {
  // 能由 props 算出的值，在渲染时直接算，不要经过 effect 和 state
  const rows = useMemo(() => ORDERS.filter(o => o.customer.includes(query)), [query]);
  return (
    <div>
      <p id="count">共 {rows.length} 条</p>
      <div style={{ maxHeight: 180, overflow: 'auto' }}>
        <table>
          <tbody>
            {rows.map(o => (
              <tr key={o.id} className="order-row">
                <td>#{o.id}</td><td>{o.customer}</td><td>¥{o.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

let commitNo = 0;
function logCommit(id, phase, actualDuration) {
  commitNo++;
  console.log('提交 #' + commitNo + '（' + phase + '）：' + actualDuration.toFixed(1) + 'ms');
}

const css = '.dash{display:flex;flex-wrap:wrap;gap:12px;padding:8px}'
  + '.dash.dark{background:#222;color:#eee}.nav-item.dark{color:#8cf}';

function App() {
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState('light');
  // ORDERS 不变，统计只需算一次
  const stats = useMemo(() => computeStats(ORDERS), []);
  const toggleTheme = useCallback(() => setTheme(t => (t === 'light' ? 'dark' : 'light')), []);
  // value 只在 theme 变化时才是新对象
  const themeValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <Profiler id="dashboard" onRender={logCommit}>
      <ThemeContext.Provider value={themeValue}>
        <style>{css}</style>
        <div className={'dash ' + theme}>
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0 }}>
            <p id="stats">总额 ¥{stats.total}，平均 ¥{stats.avg}</p>
            <input id="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="按客户筛选，例如：张" />
            <LiveTicker query={query} />
            <p>
              <button onClick={() => feed.emit({ id: Date.now(), customer: NAMES[Date.now() % NAMES.length], amount: 99 })}>模拟推送</button>{' '}
              <button onClick={() => console.log('NavItem 渲染 ' + probe.navRenders + ' 次，computeStats 调用 ' + probe.statsCalls + ' 次，feed 监听 ' + feed.listeners.size + ' 个')}>打印计数</button>
            </p>
            <OrderTable query={query} />
          </main>
        </div>
      </ThemeContext.Provider>
    </Profiler>
  );
}`,
    exports: ['App', 'probe', 'feed', 'ORDERS'],
    hint: '回看第二节的病因表，每个异常数字对应其中一行：一次按键几次提交 → 哪个 effect 在提交后调用了 set 函数？NavItem 在打字时渲染 → 它的 props 没变，那它还读了什么？computeStats 每次都被调用 → 它的输入变过吗？监听器越来越多 → subscribe 的返回值去哪了？',
    faded: `import { useState, useEffect, useMemo, useCallback, useContext, createContext, memo, Profiler } from 'react';

// ===== 数据 =====
const NAMES = ['张伟', '王芳', '李娜', '刘洋', '陈静', '杨磊', '赵敏', '张丽'];
const ORDERS = Array.from({ length: 120 }, (_, i) => ({
  id: i + 1,
  customer: NAMES[i % NAMES.length],
  amount: ((i * 37) % 500) + 20,
}));

// 实时订单推送。subscribe 返回取消订阅的函数
const feed = {
  listeners: new Set(),
  subscribe(fn) {
    feed.listeners.add(fn);
    return () => feed.listeners.delete(fn);
  },
  emit(order) {
    feed.listeners.forEach(fn => fn(order));
  },
};

// 诊断探针：检查程序会读这两个计数，不要删除
const probe = { navRenders: 0, statsCalls: 0 };

function computeStats(orders) {
  probe.statsCalls++;
  const start = performance.now();
  while (performance.now() - start < 25) {} // 模拟一次昂贵的统计
  const total = orders.reduce((sum, o) => sum + o.amount, 0);
  return { total, avg: Math.round(total / orders.length) };
}

const ThemeContext = createContext(null);
const MENU = ['总览', '订单', '客户', '商品', '库存', '物流', '退款', '发票', '报表', '营销', '会员', '设置'];

const NavItem = memo(function NavItem({ label }) {
  probe.navRenders++;
  const { theme } = useContext(ThemeContext);
  return <li className={'nav-item ' + theme}>{label}</li>;
});

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return <button id="theme" onClick={toggleTheme}>主题：{theme === 'dark' ? '深色' : '浅色'}</button>;
}

const Sidebar = memo(function Sidebar() {
  return (
    <aside style={{ minWidth: 110 }}>
      <ThemeToggle />
      <ul>{MENU.map(m => <NavItem key={m} label={m} />)}</ul>
    </aside>
  );
});

// 实时推送：统计新到的、客户名包含搜索词的订单
function LiveTicker({ query }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    /* ✏️ 搜索词变化或卸载时，旧的订阅要被移除：subscribe 的返回值交给谁？ */ feed.subscribe(order => {
      if (order.customer.includes(query)) setCount(c => c + 1);
    });
  }, [query]);
  return <p id="ticker">新到的匹配订单：{count}</p>;
}

function OrderTable({ query }) {
  // 能由 props 算出的值，在渲染时直接算，不要经过 effect 和 state
  const rows = /* ✏️ 在渲染时由 query 算出筛选结果（可以用 useMemo） */;
  return (
    <div>
      <p id="count">共 {rows.length} 条</p>
      <div style={{ maxHeight: 180, overflow: 'auto' }}>
        <table>
          <tbody>
            {rows.map(o => (
              <tr key={o.id} className="order-row">
                <td>#{o.id}</td><td>{o.customer}</td><td>¥{o.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

let commitNo = 0;
function logCommit(id, phase, actualDuration) {
  commitNo++;
  console.log('提交 #' + commitNo + '（' + phase + '）：' + actualDuration.toFixed(1) + 'ms');
}

const css = '.dash{display:flex;flex-wrap:wrap;gap:12px;padding:8px}'
  + '.dash.dark{background:#222;color:#eee}.nav-item.dark{color:#8cf}';

function App() {
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState('light');
  // ORDERS 不变，统计只需算一次
  const stats = /* ✏️ ORDERS 不变：统计只算一次 */;
  const toggleTheme = useCallback(() => setTheme(t => (t === 'light' ? 'dark' : 'light')), []);
  // value 只在 theme 变化时才是新对象
  const themeValue = /* ✏️ 只在 theme 变化时才创建新对象 */;

  return (
    <Profiler id="dashboard" onRender={logCommit}>
      <ThemeContext.Provider value={themeValue}>
        <style>{css}</style>
        <div className={'dash ' + theme}>
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0 }}>
            <p id="stats">总额 ¥{stats.total}，平均 ¥{stats.avg}</p>
            <input id="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="按客户筛选，例如：张" />
            <LiveTicker query={query} />
            <p>
              <button onClick={() => feed.emit({ id: Date.now(), customer: NAMES[Date.now() % NAMES.length], amount: 99 })}>模拟推送</button>{' '}
              <button onClick={() => console.log('NavItem 渲染 ' + probe.navRenders + ' 次，computeStats 调用 ' + probe.statsCalls + ' 次，feed 监听 ' + feed.listeners.size + ' 个')}>打印计数</button>
            </p>
            <OrderTable query={query} />
          </main>
        </div>
      </ThemeContext.Provider>
    </Profiler>
  );
}`,
    test: async (t) => {
      const h = React.createElement;
      const { App, probe, feed, ORDERS } = t.exports;
      t.assert(typeof App === 'function', '请保留名为 App 的组件');
      t.assert(probe && typeof probe.navRenders === 'number' && typeof probe.statsCalls === 'number', '请保留 probe 对象和它的两个计数');
      t.assert(feed && feed.listeners instanceof Set && typeof feed.emit === 'function', '请保留 feed 对象，不要修改它');
      t.assert(Array.isArray(ORDERS) && ORDERS.length === 120, '请保留 ORDERS 数据，不要修改它');

      const base = feed.listeners.size;
      const box = document.createElement('div');
      box.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px';
      document.body.appendChild(box);
      const root = ReactDOM.createRoot(box);
      const commits = [];
      const onRender = (id, phase, d) => commits.push({ phase, d });
      const q = (s) => box.querySelector(s);
      const qa = (s) => Array.from(box.querySelectorAll(s));
      let mounted = true;
      try {
        const nav0 = probe.navRenders;
        ReactDOM.flushSync(() => root.render(h(React.Profiler, { id: 'check', onRender }, h(App))));
        await t.wait(80);
        const navMount = probe.navRenders - nav0;
        t.assert(navMount >= 12, '挂载时 NavItem 应渲染 12 次，probe.navRenders 只增加了 ' + navMount + ' 次。不要删除 NavItem 里的计数');
        t.assert(probe.statsCalls >= 1, 'computeStats 一次都没被调用。统计数字要由它算出');
        const total = ORDERS.reduce((s, o) => s + o.amount, 0);
        t.assert(q('#stats') && q('#stats').textContent.includes(String(total)) && q('#stats').textContent.includes(String(Math.round(total / 120))), '统计数字不对：应显示总额 ¥' + total + ' 和平均 ¥' + Math.round(total / 120));
        t.assert(feed.listeners.size === base + 1, '挂载一个仪表盘后，feed 上应多 1 个监听器，实际多了 ' + (feed.listeners.size - base) + ' 个');
        t.assert(q('#count') && q('#count').textContent.includes('120') && qa('.order-row').length === 120, '一开始应显示全部 120 条订单');
        const search = q('#search');
        t.assert(search, '找不到 #search 输入框');

        // ---- 测量：输入 3 次 ----
        const steps = [];
        for (const v of ['张', '张伟', '张']) {
          commits.length = 0;
          const n0 = probe.navRenders, s0 = probe.statsCalls;
          await t.type(search, v);
          await t.wait(60);
          steps.push({ commits: commits.length, nav: probe.navRenders - n0, stats: probe.statsCalls - s0, listeners: feed.listeners.size - base });
        }
        const max = (k) => Math.max(...steps.map(s => s[k]));
        const problems = [];
        if (max('commits') > 1) problems.push('每次按键产生了 ' + max('commits') + ' 次提交（预算 1 次）。哪个 effect 在提交后又调用了 set 函数？能在渲染时算出的值，不要放进 state');
        if (max('nav') > 0) problems.push('打字时 NavItem 渲染了 ' + max('nav') + ' 次（预算 0 次）。它的 props 没变，memo 却没挡住：检查它读取的 Context，value 是不是每次都是新对象');
        if (max('stats') > 0) problems.push('打字时 computeStats 被调用了 ' + max('stats') + ' 次（预算 0 次）。ORDERS 没变，统计结果也不会变');
        if (steps[steps.length - 1].listeners !== 1) problems.push('输入 3 次后，这个仪表盘在 feed 上有 ' + steps[steps.length - 1].listeners + ' 个监听器（预算 1 个）。effect 重新执行前，旧的订阅要被取消');
        t.assert(!problems.length, '还有 ' + problems.length + ' 项超出预算：' + problems.map((m, i) => '（' + (i + 1) + '）' + m).join('；'));

        // ---- 功能不变 ----
        const expected = ORDERS.filter(o => o.customer.includes('张'));
        t.assert(q('#count').textContent.includes(String(expected.length)) && qa('.order-row').length === expected.length,
          '搜索“张”后应显示 ' + expected.length + ' 条订单，实际 #count 是“' + q('#count').textContent + '”，表格有 ' + qa('.order-row').length + ' 行');
        t.assert(qa('.order-row').every(r => r.textContent.includes('张')), '搜索“张”后，每一行的客户名都应包含“张”');

        const ticker = () => { const m = (q('#ticker') ? q('#ticker').textContent : '').match(/(\d+)\s*$/); return m ? Number(m[1]) : NaN; };
        const c0 = ticker();
        t.assert(!isNaN(c0), '找不到 #ticker 中的计数');
        feed.emit({ id: 9001, customer: '王芳', amount: 1 });
        await t.wait(60);
        t.assert(ticker() === c0, '搜索词是“张”时，推送一条“王芳”的订单，计数从 ' + c0 + ' 变成了 ' + ticker() + '，不应该变。还有用旧搜索词（例如空字符串）判断的订阅在计数');
        feed.emit({ id: 9002, customer: '张伟', amount: 1 });
        await t.wait(60);
        t.assert(ticker() === c0 + 1, '推送一条“张伟”的订单，计数应加 1，实际加了 ' + (ticker() - c0) + '。订阅要使用当前的搜索词，而且只能有一个订阅在计数');

        const themeBtn = q('#theme');
        t.assert(themeBtn, '找不到 #theme 按钮');
        themeBtn.click();
        await t.wait(60);
        t.assert(qa('.nav-item').length === 12 && qa('.nav-item').every(li => li.classList.contains('dark')), '点“主题”按钮后，所有 NavItem 都应变成深色（class 中有 dark）。固定 Context 的 value 时，依赖里要有 theme');
        themeBtn.click();
        await t.wait(60);
        t.assert(qa('.nav-item').every(li => li.classList.contains('light')), '再点一次“主题”，NavItem 应变回浅色');

        root.unmount();
        mounted = false;
        t.assert(feed.listeners.size === base, '仪表盘卸载后，feed 上还多出 ' + (feed.listeners.size - base) + ' 个监听器（预算 0 个）。effect 要返回取消订阅的函数');
      } finally {
        if (mounted) root.unmount();
        box.remove();
      }
    },
  },
});
