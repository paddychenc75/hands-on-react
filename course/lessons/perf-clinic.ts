import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/perf-clinic.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'perf-clinic',
  stage: 5,
  title: '性能诊断实战',
  mins: 42,
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
  quiz: [
    {
      q: '接手的页面打字很卡。Profiler 显示每次按键时 30 个 UserCard 都在渲染，原因是 “Context changed”。UserCard 已经用 memo 包着。下面哪一步最能验证“Provider 的 value 每次都是新对象”这个假设？',
      options: [
        '临时用 useMemo 固定 Provider 的 value，再录一次，看 UserCard 的渲染次数是否降到 0',
        '给 UserCard 的子组件也加上 memo，再录一次',
        '换成生产版本再录一次，看耗时是否下降',
        '把 30 个 UserCard 改成虚拟列表',
      ],
      answer: 0,
      explain:
        '好的验证实验只改假设指向的那一处，并预先说出数字会怎样变化。固定 value 后渲染次数降到 0，假设成立。给子组件加 memo 是最迷惑的选项：Context 的变化绕过 memo，它不会改变 UserCard 的渲染次数，也就验证不了任何东西。生产版本和虚拟列表都会让数字变小，但说明不了病因。',
    },
    {
      q: '一次点击产生 3 次提交，每次约 8ms。同事说：“每次都低于 16ms，一帧就能完成，不用管。”哪个判断最准确？',
      options: [
        '同事说得对，只要单次提交低于 16ms 就不会卡',
        '应该把 3 次提交都放进 startTransition',
        '应该给所有组件加 memo，让每次提交更快',
        '3 次提交在同一次交互里，总耗时约 24ms；中间提交还可能显示不一致的界面。应把派生值改成在渲染时计算',
      ],
      answer: 3,
      explain:
        '用户感受到的是整次交互的耗时，3 次提交加起来超过了一帧。effect 连锁还会让中间状态出现在 DOM 中，例如分类已变、列表还是旧的。根治的方法是消除多余的提交：在渲染时计算派生值，或者在事件处理函数里一次更新所有 state。memo 和 startTransition 都没有减少提交次数。',
    },
    {
      q: '团队想在 CI 中加一条性能检查，防止搜索框再次变卡。哪条最可靠？',
      options: [
        '断言每次按键的 actualDuration 小于 16ms',
        '断言每次按键只产生 1 次提交，并且侧边栏的渲染次数为 0',
        '断言整个测试套件在 30 秒内跑完',
        '每次 PR 都人工用 Profiler 录一次',
      ],
      answer: 1,
      explain:
        '计数在任何机器上都一样，所以适合作为 CI 中的预算。毫秒阈值是最迷惑的选项：CI 机器有时快有时慢，16ms 的断言会随机失败，团队很快就会忽略它。毫秒数更适合放在线上监控中看趋势。',
    },
    {
      q: '用户反馈：弹窗打开、关闭十几次后，按一次 Esc 页面会卡一下。你在控制台运行 <code>getEventListeners(document)<wbr>.keydown<wbr>.length</code>，结果是 14。最可能的原因是？',
      options: [
        '弹窗组件渲染次数太多，需要 memo',
        'Esc 键事件会冒泡，触发了 14 次',
        '弹窗的 effect 添加了 keydown 监听，但清理函数没有移除同一个函数引用',
        '开发版本会把每个监听器添加两次',
      ],
      answer: 2,
      explain:
        "每打开一次弹窗就多一个监听器，而关闭时没有移除。常见写法是 <code>return () =&gt; document.removeEventListener('keydown', () =&gt; …)</code>：这里的箭头函数是新创建的，和添加时的不是同一个引用，所以什么也没移除。渲染次数和这个数量无关。冒泡不会增加监听器的数量。",
    },
    {
      q: '一个 380KB 的图表库只在“报表”页使用。首页的 LCP 是 4.1 秒，构建分析显示这个库被打进了首页的包。最合适的做法是？',
      options: [
        '用 lazy 和动态 import 按路由分割，让报表页的代码在进入报表页时才下载',
        '用 memo 包住所有图表组件',
        '把图表库换成 CDN 上的同一个版本，体积就不算了',
        '用 useMemo 缓存图表的配置对象',
      ],
      answer: 0,
      explain:
        '这是加载阶段的问题：首页要下载并执行一个用不到的库。代码分割直接把它移出首屏的包。memo 和 useMemo 只影响渲染，对下载和解析的成本毫无帮助。换成 CDN 加载，浏览器照样要下载和执行它，只是不计入你的构建产物，问题并没有消失。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>这个订单仪表盘能用，但打字很卡，而且越用越慢。代码里埋了 4 个性能问题。</li><li><b>先测量</b>：在搜索框里打几个字，看控制台的提交记录；点“模拟推送”和“打印计数”。记下每次按键的提交次数、NavItem 的渲染次数、computeStats 的调用次数和 feed 上的监听器数量。</li><li>对每个异常数字写一个假设，再只改对应的一处，重新测量。</li><li><b>预算</b>：每次按键只产生 1 次提交；打字时 NavItem 渲染 0 次、computeStats 调用 0 次；无论打多少字，一个仪表盘在 feed 上只有 1 个监听器，卸载后为 0 个。</li><li><b>功能不变</b>：筛选结果、统计数字、主题切换、“新到的匹配订单”计数都要和原来一样正确。</li><li>不要删除 <code>probe</code> 中的计数和 <code>computeStats</code> 里的模拟耗时。</li></ol>',
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
    test: async t => {
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
      const q = s => box.querySelector(s);
      const qa = s => Array.from(box.querySelectorAll(s));
      let mounted = true;
      try {
        const nav0 = probe.navRenders;
        ReactDOM.flushSync(() => root.render(h(React.Profiler, { id: 'check', onRender }, h(App))));
        await t.wait(80);
        const navMount = probe.navRenders - nav0;
        t.assert(navMount >= 12, '挂载时 NavItem 应渲染 12 次，probe.navRenders 只增加了 ' + navMount + ' 次。不要删除 NavItem 里的计数');
        t.assert(probe.statsCalls >= 1, 'computeStats 一次都没被调用。统计数字要由它算出');
        const total = ORDERS.reduce((s, o) => s + o.amount, 0);
        t.assert(
          q('#stats') && q('#stats').textContent.includes(String(total)) && q('#stats').textContent.includes(String(Math.round(total / 120))),
          '统计数字不对：应显示总额 ¥' + total + ' 和平均 ¥' + Math.round(total / 120),
        );
        t.assert(feed.listeners.size === base + 1, '挂载一个仪表盘后，feed 上应多 1 个监听器，实际多了 ' + (feed.listeners.size - base) + ' 个');
        t.assert(q('#count') && q('#count').textContent.includes('120') && qa('.order-row').length === 120, '一开始应显示全部 120 条订单');
        const search = q('#search');
        t.assert(search, '找不到 #search 输入框');

        // ---- 测量：输入 3 次 ----
        const steps = [];
        for (const v of ['张', '张伟', '张']) {
          commits.length = 0;
          const n0 = probe.navRenders,
            s0 = probe.statsCalls;
          await t.type(search, v);
          await t.wait(60);
          steps.push({ commits: commits.length, nav: probe.navRenders - n0, stats: probe.statsCalls - s0, listeners: feed.listeners.size - base });
        }
        const max = k => Math.max(...steps.map(s => s[k]));
        const problems = [];
        if (max('commits') > 1)
          problems.push('每次按键产生了 ' + max('commits') + ' 次提交（预算 1 次）。哪个 effect 在提交后又调用了 set 函数？能在渲染时算出的值，不要放进 state');
        if (max('nav') > 0)
          problems.push(
            '打字时 NavItem 渲染了 ' + max('nav') + ' 次（预算 0 次）。它的 props 没变，memo 却没挡住：检查它读取的 Context，value 是不是每次都是新对象',
          );
        if (max('stats') > 0) problems.push('打字时 computeStats 被调用了 ' + max('stats') + ' 次（预算 0 次）。ORDERS 没变，统计结果也不会变');
        if (steps[steps.length - 1].listeners !== 1)
          problems.push(
            '输入 3 次后，这个仪表盘在 feed 上有 ' + steps[steps.length - 1].listeners + ' 个监听器（预算 1 个）。effect 重新执行前，旧的订阅要被取消',
          );
        t.assert(!problems.length, '还有 ' + problems.length + ' 项超出预算：' + problems.map((m, i) => '（' + (i + 1) + '）' + m).join('；'));

        // ---- 功能不变 ----
        const expected = ORDERS.filter(o => o.customer.includes('张'));
        t.assert(
          q('#count').textContent.includes(String(expected.length)) && qa('.order-row').length === expected.length,
          '搜索“张”后应显示 ' + expected.length + ' 条订单，实际 #count 是“' + q('#count').textContent + '”，表格有 ' + qa('.order-row').length + ' 行',
        );
        t.assert(
          qa('.order-row').every(r => r.textContent.includes('张')),
          '搜索“张”后，每一行的客户名都应包含“张”',
        );

        const ticker = () => {
          const m = (q('#ticker') ? q('#ticker').textContent : '').match(/(\d+)\s*$/);
          return m ? Number(m[1]) : NaN;
        };
        const c0 = ticker();
        t.assert(!isNaN(c0), '找不到 #ticker 中的计数');
        feed.emit({ id: 9001, customer: '王芳', amount: 1 });
        await t.wait(60);
        t.assert(
          ticker() === c0,
          '搜索词是“张”时，推送一条“王芳”的订单，计数从 ' + c0 + ' 变成了 ' + ticker() + '，不应该变。还有用旧搜索词（例如空字符串）判断的订阅在计数',
        );
        feed.emit({ id: 9002, customer: '张伟', amount: 1 });
        await t.wait(60);
        t.assert(ticker() === c0 + 1, '推送一条“张伟”的订单，计数应加 1，实际加了 ' + (ticker() - c0) + '。订阅要使用当前的搜索词，而且只能有一个订阅在计数');

        const themeBtn = q('#theme');
        t.assert(themeBtn, '找不到 #theme 按钮');
        themeBtn.click();
        await t.wait(60);
        t.assert(
          qa('.nav-item').length === 12 && qa('.nav-item').every(li => li.classList.contains('dark')),
          '点“主题”按钮后，所有 NavItem 都应变成深色（class 中有 dark）。固定 Context 的 value 时，依赖里要有 theme',
        );
        themeBtn.click();
        await t.wait(60);
        t.assert(
          qa('.nav-item').every(li => li.classList.contains('light')),
          '再点一次“主题”，NavItem 应变回浅色',
        );

        root.unmount();
        mounted = false;
        t.assert(
          feed.listeners.size === base,
          '仪表盘卸载后，feed 上还多出 ' + (feed.listeners.size - base) + ' 个监听器（预算 0 个）。effect 要返回取消订阅的函数',
        );
      } finally {
        if (mounted) root.unmount();
        box.remove();
      }
    },
  },
  checkOnly: [
    {
      q: `Avatar 用 memo 包着，并读取 AuthContext。用户一直没有登录或退出。Avatar 多久重新渲染一次？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function App() {
  const [user, setUser] = useState(initialUser);
  const [now, setNow] = useState(Date.now());
  useEffect(() =&gt; {
    const id = setInterval(() =&gt; setNow(Date.now()), 1000);
    return () =&gt; clearInterval(id);
  }, []);
  const logout = () =&gt; setUser(null);
  return (
    &lt;AuthContext.Provider value={{ user, logout }}&gt;
      &lt;Header now={now} /&gt; &lt;Avatar /&gt;
    &lt;/AuthContext.Provider&gt;
  );
}</code></pre></div>`,
      options: ['从不：user 没变，memo 让它跳过', '只在挂载时渲染一次', '每秒两次：Header 和 Provider 各触发一次', '每秒一次：value 每次都是新对象'],
      answer: 3,
      explain:
        'now 每秒变化，App 每秒重新渲染。<code>{ user, logout }</code> 每次都是新对象，logout 也是新函数，所以 Provider 的 value 每秒都“变了”。读取这个 Context 的 Avatar 每秒渲染一次，memo 挡不住。修法：用 useMemo 固定 value，并用 useCallback 固定 logout；或者把时钟的 state 移到 Header 里。',
    },
    {
      q: `在“名”输入框里打一个字，会产生几次提交？第一次提交时，屏幕上的全名是什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function NameForm() {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [fullName, setFullName] = useState('');
  useEffect(() =&gt; {
    setFullName(first + ' ' + last);
  }, [first, last]);
  return (
    &lt;&gt;
      &lt;input value={first} onChange={e =&gt; setFirst(e.target.value)} /&gt;
      &lt;input value={last} onChange={e =&gt; setLast(e.target.value)} /&gt;
      &lt;p&gt;{fullName}&lt;/p&gt;
    &lt;/&gt;
  );
}</code></pre></div>`,
      options: ['1 次，全名立刻是新的', '2 次；第一次提交时全名还是旧的', '2 次；两次提交时全名都是新的', '3 次：每个 state 一次'],
      answer: 1,
      explain:
        "第一次提交时 first 已更新，但 fullName 还是旧值。提交后 effect 执行，调用 setFullName，引起第二次渲染和提交。fullName 能由 first 和 last 算出，就不该存成 state：直接写 <code>const fullName = first + ' ' + last</code>，每次按键只有 1 次提交，而且永远不会显示旧值。",
    },
    {
      q: `（生产版本，或没有开启 StrictMode）组件挂载、卸载 5 次之后，window 上还剩几个 resize 监听？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">useEffect(() =&gt; {
  window.addEventListener('resize', () =&gt; setW(innerWidth));
  return () =&gt; {
    window.removeEventListener('resize', () =&gt; setW(innerWidth));
  };
}, []);</code></pre></div>`,
      options: ['0 个', '1 个', '5 个', '10 个'],
      answer: 2,
      explain:
        '清理函数里的箭头函数是新创建的，和添加时的不是同一个引用。removeEventListener 找不到它，什么也没移除。每次挂载留下一个监听，5 次就是 5 个。开发环境开了 StrictMode 时，每次挂载 effect 执行两次，会留下 10 个。而且它们都会调用已卸载组件的 setW。修法：把函数存进一个变量 <code>const onResize = …</code>，添加和移除都用它。',
    },
    {
      q: `在第一行的备注框里写了“加急”，然后在上方的搜索框里打一个字。第一行仍在结果中。备注框会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Table({ rows }) {
  const [query, setQuery] = useState('');
  function Row({ row }) {
    const [note, setNote] = useState('');
    return &lt;li&gt;{row.name}
      &lt;input value={note} onChange={e =&gt; setNote(e.target.value)} /&gt;
    &lt;/li&gt;;
  }
  return &lt;&gt;
    &lt;input value={query} onChange={e =&gt; setQuery(e.target.value)} /&gt;
    &lt;ul&gt;{rows.filter(r =&gt; r.name.includes(query))
      .map(r =&gt; &lt;Row key={r.id} row={r} /&gt;)}&lt;/ul&gt;
  &lt;/&gt;;
}</code></pre></div>`,
      options: [
        '保留“加急”：key 没变，React 复用这一行',
        '保留“加急”，但这一行多渲染了一次',
        '搜索框失去焦点，备注保留',
        '被清空：每次渲染 Row 都是一个新的组件类型，所有行被卸载再重新挂载',
      ],
      answer: 3,
      explain:
        'Row 定义在 Table 里面。Table 每次渲染都创建一个新的 Row 函数。React 比较元素类型时发现“不是同一个组件”，就卸载旧的行，挂载新的行。key 只在同一类型之间起作用，所以帮不上忙。note 丢失，Profiler 里这些行每次都显示为 “mount”。修法：把 Row 移到 Table 外面定义。',
    },
  ],
  plays: {
    'memo 挡得住 Context 吗？': {
      note: '不勾选时打几个字：每次都是 20。勾选后再打字：每次都是 0。<br><b>原因</b>：memo 只比较 props。Item 还读取了 Context，而 Context 的变化绕过 memo 直接通知消费者。<code>{ theme, setTheme }</code> 每次渲染都是新对象，React 用 Object.is 比较 value，判定“变了”。勾选后 value 只在 theme 变化时才是新对象。',
      predict: {
        q: '不勾选复选框。在输入框里打一个字。Item 都用 memo 包着，label 没变。控制台会显示这次提交里 Item 渲染了几次？',
        options: ['0 次：memo 让它们全部跳过', '1 次：只有第一个 Item 渲染', '20 次：每个 Item 都重新渲染', '40 次：每个 Item 渲染两次'],
        answer: 2,
        explain:
          'App 重新渲染时，<code>{ theme, setTheme }</code> 是一个新对象。Provider 的 value 变了，React 通知所有读取这个 Context 的组件重新渲染。memo 只能挡住“props 没变”的渲染，挡不住 Context 的变化。所以 20 个 Item 全部渲染。',
      },
      pkey: 'perf-clinic|memo 挡得住 Context 吗？',
    },
    '一次点击，几次提交？': {
      note: '不勾选时，每次点击产生 3 次提交：<ol class="task-steps"><li>cat 变化，渲染并提交。此时 items 还是旧分类的数据。</li><li>第一个 effect 调用 setItems，第二次提交。</li><li>第二个 effect 调用 setSelected，第三次提交。</li></ol>勾选后，每次点击只有 1 次提交。用户可能看不到中间状态，但每次提交都要完整地渲染、比较和修改 DOM，耗时成倍增加。中间状态还会让界面短暂地“自相矛盾”：分类是电器，列表却是图书。',
    },
    '监听器会越积越多吗？': {
      note: '不勾选时打字，监听器数量每次加 1。旧的监听器还在，它们记着旧的筛选词，所以泄漏不只浪费内存，还会产生错误的结果。勾选后，每次 effect 重新执行前都会移除旧的监听，数量不再增长。<br>但数量不会回到 1：勾选之前泄漏的监听器没有人移除。真实应用里，它们会一直留到页面刷新。点“运行”重来，先勾选再打字，数量就一直是 1。',
    },
  },
} satisfies Lesson;
