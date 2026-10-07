// 由 scripts/convert.mjs 从旧版 src/*.js 生成。
// 非正文数据。课文在 docs/lessons/profiling.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'profiling',
  stage: 2,
  title: '性能测量：先找到慢在哪里',
  mins: 30,
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
  quiz: [
    {
      q: '在搜索框打字时，Profiler 显示 ResultList 每次的 actualDuration 约 45ms，baseDuration 约 46ms。“Why did this render?” 显示 “The parent component rendered”。ResultList 的 props 并没有变。最直接的修复是？',
      options: [
        '把 ResultList 改成虚拟列表，只渲染可见的那些结果行',
        '用 memo 包裹 ResultList，或把输入框的 state 下移',
        '换成生产版本，问题就会消失',
        '给所有函数加 useCallback',
      ],
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
      options: [
        '用户那里也是 120ms，必须马上给相关组件都加上 memo',
        '数字偏大。先比较修改前后的变化，再用生产版本确认',
        '开发版本不准，所以在开发时测量没有意义',
        '把 <Profiler> 留在生产代码里，线上就能测到同样的 120ms',
      ],
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
  checkOnly: [
    {
      q: `Clock 每秒更新一次。BigList 用 memo 包裹，props 不变，渲染一次要 20ms。每秒控制台会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;Profiler id="App" onRender={(id, phase, actual, base) =&gt;
  console.log(phase, actual, base)}&gt;
  &lt;Clock /&gt;
  &lt;BigList /&gt;
&lt;/Profiler&gt;</code></pre></div>`,
      options: [
        '每秒打印一次 update；actual 很小，base 约 20 多 ms',
        '不打印：Profiler 只记录挂载',
        '每秒打印一次 update；actual 和 base 都约 20 多 ms',
        '只有 BigList 变化时才打印',
      ],
      answer: 0,
      explain: 'Profiler 内任何组件提交更新，都会调用 onRender。actualDuration 只算这次真正渲染的组件：只有 Clock，所以很小。baseDuration 估算整棵子树不用 memo 时的耗时，包含 BigList。两者差距大，说明 memo 生效了。',
    },
    {
      q: `Row 用 memo 包裹。Profiler 显示每打一个字，500 行 Row 都重新渲染，而且每行的“展开/收起”状态被重置。最可能的原因是？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">{rows.map(r =&gt; (
  &lt;Row key={Math.random()} row={r} /&gt;
))}</code></pre></div>`,
      options: [
        'key 每次都不同，行被重新挂载',
        'row 每次都是新对象，memo 的浅比较失败',
        '开发模式下 Profiler 的结果不准',
        'memo 对列表中的组件不起作用',
      ],
      answer: 0,
      explain: 'key 每次渲染都是新的随机数，React 认为所有行都是新组件。它卸载旧的 Row，挂载新的 Row，memo 根本没有机会比较 props，state 也随之丢失。用稳定的 <code>key={r.id}</code>。“row 是新对象”有迷惑性：它确实会让 memo 失效，但只会导致重新渲染，不会重置 state。state 被重置，说明组件被重新挂载了。',
    },
  ],
  plays: {
    '读懂 actualDuration 和 baseDuration': {
      note: '先不勾选，点几次“无关计数”。再勾选 memo，然后再点几次。比较两组数字。<br>勾选后，memo 让列表跳过渲染，actual 明显变小；base 是“不做记忆化时”的估算，基本不变。<br><b>怎样读这两个数字：</b><ol class="task-steps"><li>actualDuration 接近 baseDuration：几乎每个组件都重新渲染了，记忆化没有生效。</li><li>actualDuration 远小于 baseDuration：大部分组件被跳过了。</li><li>baseDuration 本身很大：即使每次都跳过，第一次挂载也会很慢。这时要减少渲染的内容。</li></ol>',
      predict: {
        q: '勾选“用 memo 包裹列表”后，再点几次“无关计数”。控制台中的两个数字会怎样？',
        options: ['两个都接近 0', 'actual 接近 0，base 和之前差不多', '两个都和之前差不多', 'actual 变大，base 变成 0'],
        answer: 1,
        explain: 'memo 让列表跳过渲染，所以实际耗时 actual 接近 0。base 是“不做记忆化时”的估算，它保留列表最近一次的渲染耗时，所以不变。',
      },
      pkey: 'profiling|读懂 actualDuration 和 baseDuration',
    },
    '虚拟列表前后对比': {
      note: '分别点两个按钮，比较 mount 的耗时和 DOM 行数。然后在虚拟列表中滚动：每次 update 只要很短的时间。',
    },
  },
};
