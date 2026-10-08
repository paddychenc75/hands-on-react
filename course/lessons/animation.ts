import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/animation.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
// 字段说明见 course/types.ts；写法和注意事项见 AGENTS.md。

// 练习用的 CSS：离场过渡 200ms。起始代码、参考答案、检查都靠它
const PANEL_CSS = `
        .panel { padding: 12px; margin-top: 8px; background: #cfe8f3; color: #0f1d24; border-radius: 6px; opacity: 1; transition: opacity 200ms; }
        .panel.leaving { opacity: 0; }
      `;

export default {
  id: 'animation',
  stage: 3,
  title: '动画与过渡',
  mins: 47,
  summary: '用类名驱动 CSS 过渡，写出“先播放离场动画再卸载”的状态机，用 <ViewTransition> 做页面、共享元素和列表动画，并让动画尊重“减少动画”设置。',
  goals: [
    '能写出由 state 驱动的 CSS 过渡，并解释条件渲染为什么没有离场动画',
    '能写出“进入中、已进入、离开中”的状态机，并处理打断和 transitionend 不触发的情况',
    '能判断 <ViewTransition> 什么时候有动画（过渡更新、enter、exit、update、share），并用 CSS 定制',
    '能按需求选择 CSS 过渡、状态机、<ViewTransition> 或动画库，并让动画尊重“减少动画”设置',
  ],
  keyPoints: [
    'CSS 过渡需要“变化前”和“变化后”两个值，所以元素要一直留在 DOM 里。条件渲染一卸载就没有离场动画；新挂载的节点没有入场动画，除非用 <code>@starting-style</code> 或等浏览器画过一帧再改类名。',
    '先播放再卸载是一个状态机：<code>gone → entering → entered → leaving → gone</code>。用 <code>onTransitionEnd</code> 卸载（只认自己、只在 leaving 时生效），再配一个超时兜底；离场中重新打开要取消兜底定时器。',
    '<code>&lt;ViewTransition&gt;</code> 只有过渡更新（<code>startTransition</code>、<code>useDeferredValue</code>、Suspense 揭示）才会动。enter 和 exit 要把它放在被插入或移除内容的最外层；共享元素靠同一个唯一的 <code>name</code>；浏览器不支持时只是没有动画。',
    '动画尽量只动 <code>transform</code> 和 <code>opacity</code>，不要逐帧调用 set 函数。列表位移优先用带 key 的 <code>&lt;ViewTransition&gt;</code>，FLIP 要懂原理，手写要谨慎。',
    'React 不会自动尊重“减少动画”：CSS 用 <code>prefers-reduced-motion</code> 媒体查询，JS 里用 <code>useSyncExternalStore</code> 订阅 <code>matchMedia</code>。离场期间给元素加 <code>inert</code>，信息不要只靠动画传达。',
  ],
  quiz: [
    {
      q: '<code>.card</code> 设置了 <code>transition: opacity 400ms</code>。<code>{open &amp;&amp; &lt;p className="card"&gt;…&lt;/p&gt;}</code> 里的卡片刚挂载时，通常看不到淡入。原因是什么？',
      options: [
        'React 在挂载时会暂时关闭 CSS 过渡',
        '新节点第一次计算样式时没有“变化前”的值，过渡无从开始',
        'transition 只对用 JS 修改的内联 style 有效，对类名无效',
        '过渡只能用在 position: absolute 的元素上',
      ],
      answer: 1,
      explain:
        '过渡要在“同一个元素的同一个属性”前后两个值之间补帧。新节点没有前一个值。<code>@starting-style</code> 就是给它指定一个起点。第一项最迷惑：React 不会干预 CSS，是浏览器没有起点可补。',
    },
    {
      q: '一个离场状态机只靠 <code>onTransitionEnd</code> 把状态从 <code>leaving</code> 改成 <code>gone</code>。下面哪种情况会让元素永远留在 DOM 里？',
      options: ['用户在离场中又点了一次关闭', '用户开启了“减少动画”，你的 CSS 把 transition 设成了 none', '元素里有多个子元素', '组件在严格模式下运行'],
      answer: 1,
      explain:
        '没有过渡就没有 <code>transitionend</code> 事件，状态永远停在 <code>leaving</code>。所以要配一个超时兜底。子元素的事件会冒泡上来，那是“提前卸载”的问题，不是“永远不卸载”。',
    },
    {
      q: '下面哪个更新会让 <code>&lt;ViewTransition&gt;</code> 播放动画？',
      options: [
        '点击处理函数里直接调用 <code>setShow(true)</code>',
        '点击处理函数里调用 <code>startTransition(() =&gt; setShow(true))</code>',
        '<code>useEffect</code> 里调用 <code>setShow(true)</code>',
        '点击处理函数里调用 <code>flushSync(() =&gt; setShow(true))</code>',
      ],
      answer: 1,
      explain:
        '<code>&lt;ViewTransition&gt;</code> 只响应过渡更新、<code>useDeferredValue</code> 和 Suspense 揭示。直接 set 是紧急更新，要立刻反映在界面上；<code>flushSync</code> 同步提交，还会取消这次过渡动画。',
    },
    {
      q: '一个侧栏要从屏幕左边滑入。哪种动画写法让浏览器不必重新计算页面布局？',
      options: [
        '把 <code>left</code> 从 -300px 动画到 0',
        '把 <code>width</code> 从 0 动画到 300px',
        '把 <code>transform: translateX(-300px)</code> 动画到 <code>none</code>',
        '把 <code>margin-left</code> 从 -300px 动画到 0',
      ],
      answer: 2,
      explain:
        '<code>transform</code> 和 <code>opacity</code> 只影响合成，不触发布局。<code>left</code>、<code>width</code>、<code>margin-left</code> 都会让浏览器重新布局，每一帧都在主线程上做。<code>left</code> 看起来像“只是移动”，但它仍是布局属性。',
    },
    {
      q: '用户系统里打开了“减少动态效果”。你的页面用了 <code>&lt;ViewTransition&gt;</code>，什么都没额外写。会怎样？',
      options: [
        'React 检测到这个设置，自动关闭所有 <code>&lt;ViewTransition&gt;</code> 动画',
        '浏览器自动关闭所有 View Transition 动画',
        '动画照常播放，要自己用 <code>prefers-reduced-motion</code> 媒体查询关掉',
        '<code>&lt;ViewTransition&gt;</code> 报错，要求你先处理这个设置',
      ],
      answer: 2,
      explain:
        'React 和浏览器都不会替你关。在 CSS 里用 <code>@media (prefers-reduced-motion: reduce)</code> 把 <code>::view-transition-*</code> 的 animation 设成 none。动画是否播放是你的责任，这也是无障碍的一部分。',
    },
  ],
  exercise: {
    task: '<p>面板的关闭现在会立刻消失。实现 <code>usePresence(open)</code>，让它先播放离场动画（CSS 里 <code>.panel.leaving</code> 的淡出，200ms）再卸载。<code>App</code> 和 CSS 已经写好，只改 <code>usePresence</code>。</p><ol class="task-steps"><li>关闭时，<code>#panel</code> 先留在 DOM 里，并带 <code>leaving</code> 类（<code>leaving</code> 为 true）。</li><li>动画结束（<code>onTransitionEnd</code>，只认面板自己）后卸载。再加一个不超过 1 秒的超时兜底：就算 <code>transitionend</code> 没触发，面板也要卸载。</li><li>离场中再次打开：取消离场，面板留在 DOM 里，去掉 <code>leaving</code>，不能被旧的定时器卸载。</li><li>用户开启“减少动画”时（用已有的 <code>usePrefersReducedMotion()</code>），关闭立即卸载，不进入 <code>leaving</code>。</li></ol>',
    starter: `import { useState, useEffect, useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

// 已写好：用户是否要求减少动画
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    onChange => {
      const media = window.matchMedia(QUERY);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

// 现在：open 变 false 就立刻卸载
function usePresence(open) {
  return { mounted: open, leaving: false, onTransitionEnd() {} };
}

function App() {
  const [open, setOpen] = useState(false);
  const { mounted, leaving, onTransitionEnd } = usePresence(open);
  return (
    <div>
      <style>{\`${PANEL_CSS}\`}</style>
      <button id="toggle" onClick={() => setOpen(!open)}>{open ? '关闭' : '打开'}</button>
      {mounted && (
        <div id="panel" className={leaving ? 'panel leaving' : 'panel'} onTransitionEnd={onTransitionEnd}>
          面板内容
        </div>
      )}
    </div>
  );
}
`,
    solution: `import { useState, useEffect, useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

// 已写好：用户是否要求减少动画
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    onChange => {
      const media = window.matchMedia(QUERY);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

function usePresence(open, fallbackMs = 400) {
  const reduce = usePrefersReducedMotion();
  const [phase, setPhase] = useState(open ? 'entered' : 'gone'); // gone | entered | leaving

  if (open && phase !== 'entered') setPhase('entered'); // 含“离场中重新打开”：取消离场
  else if (!open && phase === 'entered') setPhase(reduce ? 'gone' : 'leaving');

  useEffect(() => {
    if (phase !== 'leaving') return;
    const timer = setTimeout(() => setPhase('gone'), fallbackMs); // 兜底
    return () => clearTimeout(timer); // 重新打开时取消
  }, [phase, fallbackMs]);

  function onTransitionEnd(e) {
    if (e.target === e.currentTarget && phase === 'leaving') setPhase('gone');
  }

  return { mounted: phase !== 'gone', leaving: phase === 'leaving', onTransitionEnd };
}

function App() {
  const [open, setOpen] = useState(false);
  const { mounted, leaving, onTransitionEnd } = usePresence(open);
  return (
    <div>
      <style>{\`${PANEL_CSS}\`}</style>
      <button id="toggle" onClick={() => setOpen(!open)}>{open ? '关闭' : '打开'}</button>
      {mounted && (
        <div id="panel" className={leaving ? 'panel leaving' : 'panel'} onTransitionEnd={onTransitionEnd}>
          面板内容
        </div>
      )}
    </div>
  );
}
`,
    hint: '用一个 <code>phase</code> state（<code>gone</code>、<code>entered</code>、<code>leaving</code>）。关闭时先变成 <code>leaving</code>，再由 <code>onTransitionEnd</code>（检查 <code>e.target === e.currentTarget</code>）或一个 <code>setTimeout</code> 变成 <code>gone</code>。定时器放在依赖 <code>phase</code> 的 effect 里，并在清理函数里 <code>clearTimeout</code>。减少动画时，关闭直接变成 <code>gone</code>。',
    faded: `import { useState, useEffect, useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

// 已写好：用户是否要求减少动画
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    onChange => {
      const media = window.matchMedia(QUERY);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

function usePresence(open, fallbackMs = 400) {
  const reduce = usePrefersReducedMotion();
  const [phase, setPhase] = useState(open ? 'entered' : 'gone'); // gone | entered | leaving

  /* ✏️ 根据 open 调整 phase：打开 → entered（离场中重新打开也一样）；关闭 → leaving，但减少动画时直接 gone */

  useEffect(() => {
    /* ✏️ phase 是 leaving 时开一个 fallbackMs 的定时器变成 gone，并在清理函数里取消它 */
  }, [phase, fallbackMs]);

  function onTransitionEnd(e) {
    /* ✏️ 只认面板自己的事件，并且只在 leaving 时变成 gone */
  }

  return { mounted: phase !== 'gone', leaving: phase === 'leaving', onTransitionEnd };
}

function App() {
  const [open, setOpen] = useState(false);
  const { mounted, leaving, onTransitionEnd } = usePresence(open);
  return (
    <div>
      <style>{\`${PANEL_CSS}\`}</style>
      <button id="toggle" onClick={() => setOpen(!open)}>{open ? '关闭' : '打开'}</button>
      {mounted && (
        <div id="panel" className={leaving ? 'panel leaving' : 'panel'} onTransitionEnd={onTransitionEnd}>
          面板内容
        </div>
      )}
    </div>
  );
}
`,
    test: async t => {
      const panel = () => t.q('#panel');
      const leaving = () => !!panel() && panel().classList.contains('leaving');
      t.assert(t.q('#toggle'), '页面里应该保留 #toggle 按钮');
      t.assert(!panel(), '初始是关闭的，不应该有 #panel');
      const bl = await t.baseline();
      const until = async (cond: () => boolean, ms: number) => {
        const end = performance.now() + ms;
        while (!cond() && performance.now() < end) await t.wait(25);
        return cond();
      };
      const settleClosed = async () => {
        if (panel() && !leaving()) await t.click('#toggle');
        await until(() => !panel(), bl.limit(1500));
        t.assert(!panel(), '关闭之后（动画结束或超时），#panel 最终应该被卸载，现在它还留在 DOM 里。onTransitionEnd 是否真的会触发？要不要加超时兜底？');
      };
      const open = async () => {
        await t.click('#toggle');
        t.assert(panel(), '点“打开”后 #panel 应该出现');
        t.assert(!leaving(), '打开状态的 #panel 不应该带 leaving 类');
      };

      // 1. 离场期间仍在 DOM、带 leaving，动画没播完不能卸载，播完后卸载
      await t.retry(async () => {
        await settleClosed();
        await open();
        await t.click('#toggle');
        t.timing(panel(), '点“关闭”后 #panel 马上就被卸载了，离场动画根本没机会播放。关闭时要先让它留在 DOM 里，带上 leaving 类，让 CSS 过渡开始，播完再卸载');
        t.timing(leaving(), '关闭后 #panel 还在 DOM 里，但没有 leaving 类，CSS 过渡不会开始（.panel.leaving 才会淡出）');
        await t.wait(60);
        t.timing(panel(), '离场动画（200 毫秒）还没播完，#panel 就被卸载了。应该等 transitionend，或者等一个不短于动画的时间');
      });
      await settleClosed();

      // 2. 离场中再次打开：取消离场
      await t.retry(async () => {
        await settleClosed();
        await open();
        await t.click('#toggle');
        await t.wait(50);
        await t.click('#toggle');
        t.assert(panel() && !leaving(), '离场中再次点“打开”，#panel 应该继续留在 DOM 里，并去掉 leaving 类（取消离场）');
        await t.wait(700);
        t.assert(
          panel() && !leaving(),
          '重新打开之后，#panel 又被卸载了（或又变回 leaving）。这是旧的离场流程没有取消：重新打开时要清掉兜底定时器，onTransitionEnd 也要先确认当前真的在离场',
        );
      });
      await settleClosed();

      // 3. transitionend 不触发时也要卸载（把过渡关掉模拟）
      const style = document.createElement('style');
      style.textContent = '#panel, #panel.leaving { transition: none !important; animation: none !important; }';
      document.head.appendChild(style);
      try {
        await open();
        await t.click('#toggle');
        await until(() => !panel(), bl.limit(1500));
        t.assert(!panel(), '过渡没有真正发生时（这里把 transition 关掉了），transitionend 不会触发，#panel 仍要被卸载。加一个不超过 1 秒的超时兜底');
      } finally {
        style.remove();
      }

      // 4. 减少动画：立即卸载
      const orig = window.matchMedia;
      (window as any).matchMedia = (q: string) =>
        /prefers-reduced-motion/.test(q)
          ? {
              matches: true,
              media: q,
              onchange: null,
              addEventListener() {},
              removeEventListener() {},
              addListener() {},
              removeListener() {},
              dispatchEvent: () => false,
            }
          : orig.call(window, q);
      try {
        await settleClosed();
        await open();
        await t.click('#toggle');
        await until(() => !panel(), bl.limit(120));
        t.assert(!panel(), '用户开启“减少动画”时，关闭应该立即卸载，不要再播离场动画。用 usePrefersReducedMotion() 的结果决定要不要进入 leaving');
      } finally {
        window.matchMedia = orig;
      }
    },
  },
  drillMins: 11,
  drills: [
    {
      title: '让卡片挂载时淡入',
      task: '<p>点“打开”，卡片挂载后应该用 600ms 从透明淡入到不透明。现在卡片直接出现。只改 CSS 或类名，让入场动画生效（<code>#box</code> 的 <code>opacity</code> 刚挂载时接近 0，过一会儿变成 1）。</p>',
      starter: `import { useState } from 'react';

function App() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <style>{\`
        .box { padding: 12px; background: #cfe8f3; color: #0f1d24; transition: opacity 600ms; }
      \`}</style>
      <button id="toggle" onClick={() => setOpen(!open)}>{open ? '关闭' : '打开'}</button>
      {open && <p id="box" className="box">我是一张卡片</p>}
    </div>
  );
}
`,
      solution: `import { useState } from 'react';

function App() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <style>{\`
        .box { padding: 12px; background: #cfe8f3; color: #0f1d24; transition: opacity 600ms; }
        @starting-style { .box { opacity: 0; } }
      \`}</style>
      <button id="toggle" onClick={() => setOpen(!open)}>{open ? '关闭' : '打开'}</button>
      {open && <p id="box" className="box">我是一张卡片</p>}
    </div>
  );
}
`,
      hint: '新挂载的节点没有“变化前”的值。用 CSS 的 <code>@starting-style</code> 指定起点；或者先渲染透明的样式，等浏览器画过一帧后再改类名。只在 effect 里立刻改类名，浏览器来不及算初始样式。',
      test: async t => {
        const box = () => t.q('#box');
        t.assert(t.q('#toggle'), '页面里应该保留 #toggle 按钮');
        const bl = await t.baseline();
        const ensureClosed = async () => {
          if (box()) await t.click('#toggle');
          t.assert(!box(), '点“关闭”后 #box 应该被卸载');
        };
        const frame = () => new Promise<void>(r => requestAnimationFrame(() => r()));
        await t.retry(async () => {
          await ensureClosed();
          await t.click('#toggle');
          t.assert(box(), '点“打开”后应该出现 #box');
          await frame();
          const early = Number(getComputedStyle(box()).opacity);
          t.timing(
            early < 0.85,
            '卡片刚挂载时 opacity 已经是 ' +
              early.toFixed(2) +
              '，没有淡入。新挂载的节点没有“变化前”的值，过渡不会开始：用 @starting-style 给它一个起点，或者先渲染透明样式、画过一帧再改类名',
          );
        });
        // 最后要变成不透明（600ms 过渡）
        const end = performance.now() + bl.limit(2500);
        while (Number(getComputedStyle(box()).opacity) < 0.99 && performance.now() < end) await t.wait(40);
        t.assert(Number(getComputedStyle(box()).opacity) >= 0.99, '淡入结束后 opacity 应该是 1，现在是 ' + getComputedStyle(box()).opacity);
      },
    },
    {
      title: '用 useSyncExternalStore 订阅“减少动画”',
      task: "<p>实现 <code>usePrefersReducedMotion()</code>：返回用户是否开启了“减少动画”（<code>window.matchMedia('(prefers-reduced-motion: reduce)').matches</code>）。要求：第一次渲染就是正确的值；用户中途改设置时组件会更新；组件卸载后要取消订阅。</p>",
      starter: `import { useSyncExternalStore } from 'react';

function usePrefersReducedMotion() {
  return false;
}

function App() {
  const reduce = usePrefersReducedMotion();
  return <p>{reduce ? '已开启减少动画：不播放位移动画' : '正常播放动画'}</p>;
}
`,
      solution: `import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

function App() {
  const reduce = usePrefersReducedMotion();
  return <p>{reduce ? '已开启减少动画：不播放位移动画' : '正常播放动画'}</p>;
}
`,
      hint: '<code>matchMedia</code> 的结果会随系统设置变化，是一个外部存储。<code>useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)</code>：订阅里监听 <code>change</code> 并返回取消函数；快照读 <code>.matches</code>；服务端没有 <code>window</code>，返回 false。',
      exports: ['usePrefersReducedMotion'],
      test: async t => {
        const { React, ReactDOM } = t;
        const hook = t.exports.usePrefersReducedMotion;
        t.assert(typeof hook === 'function', '需要定义 usePrefersReducedMotion 函数');
        const listeners = new Set<() => void>();
        let matches = true;
        let queries = 0;
        const fake = (q: string) => {
          queries++;
          return {
            get matches() {
              return matches;
            },
            media: q,
            onchange: null,
            addEventListener: (_: string, fn: () => void) => listeners.add(fn),
            removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
            addListener: (fn: () => void) => listeners.add(fn),
            removeListener: (fn: () => void) => listeners.delete(fn),
            dispatchEvent: () => false,
          };
        };
        const orig = window.matchMedia;
        (window as any).matchMedia = fake;
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = ReactDOM.createRoot(host);
        const seen: boolean[] = [];
        function Probe() {
          const v = hook();
          seen.push(v);
          return React.createElement('p', { id: 'probe' }, String(v));
        }
        try {
          root.render(React.createElement(Probe));
          await t.wait(80);
          t.assert(queries > 0, '要用 window.matchMedia 读取“减少动画”设置');
          t.assert(
            seen[0] === true,
            '设置是开启的，但第一次渲染拿到的是 ' + seen[0] + '。别先返回 false 再在 effect 里改：用 useSyncExternalStore 第一次渲染就读到真实值',
          );
          t.assert(host.textContent === 'true', '设置开启时应该返回 true，现在页面显示 ' + host.textContent);
          matches = false;
          listeners.forEach(fn => fn());
          await t.wait(80);
          t.assert(
            host.textContent === 'false',
            '用户把设置改成关闭后，组件应该更新为 false，现在显示 ' + host.textContent + '。有没有订阅 matchMedia 的 change 事件？',
          );
          root.unmount();
          await t.wait(30);
          t.assert(listeners.size === 0, '组件卸载后还有 ' + listeners.size + ' 个 change 监听没取消。订阅函数要返回取消订阅的函数');
        } finally {
          window.matchMedia = orig;
          host.remove();
        }
      },
    },
  ],
  checkOnly: [
    {
      q: '<code>{show &amp;&amp; &lt;div&gt;&lt;ViewTransition&gt;&lt;p&gt;你好&lt;/p&gt;&lt;/ViewTransition&gt;&lt;/div&gt;}</code>。在 <code>startTransition</code> 里把 <code>show</code> 设成 true，会有进入动画吗？',
      options: [
        '有，只要在过渡更新里就有',
        '没有，<code>&lt;ViewTransition&gt;</code> 上面还有一个 <code>div</code> 节点，不会触发 enter',
        '有，但只有淡入没有淡出',
        '报错：ViewTransition 不能放在 div 里面',
      ],
      answer: 1,
      explain:
        '被插入的是外层的 <code>div</code>，里面的 <code>&lt;ViewTransition&gt;</code> 不是“第一个被插入的”，所以不触发 enter（也不触发 exit）。把 <code>&lt;ViewTransition&gt;</code> 放到最外层，再把 <code>div</code> 放进去。',
    },
    {
      q: "<code>&lt;Activity mode={open ? 'visible' : 'hidden'}&gt;&lt;div style={{ transition: 'opacity 300ms' }}&gt;…&lt;/div&gt;&lt;/Activity&gt;</code>。<code>open</code> 变成 false 时，里面的 div 会怎样？",
      options: ['淡出 300 毫秒后隐藏', '立即隐藏，没有淡出', '被卸载，里面的 state 丢失', '淡出一半就停住'],
      answer: 1,
      explain:
        '<code>hidden</code> 会立刻给子树加上 <code>display: none !important</code>，CSS 过渡来不及播放。state 是保留的（不是卸载）。想要离场动画，要再配合状态机或 <code>&lt;ViewTransition&gt;</code>。',
    },
    {
      q: '页面上同时挂载了两个 <code>&lt;ViewTransition name="hero"&gt;</code>，然后在 <code>startTransition</code> 里触发更新。结果是什么？',
      options: ['两个元素都按共享元素处理', '较晚挂载的那个自动改名', '界面照常更新，但浏览器放弃这次动画', '界面停留在旧状态'],
      answer: 2,
      explain:
        '<code>name</code> 在同一时刻必须唯一。重名时浏览器无法建立快照对应关系，放弃整次动画（控制台提示重复的 view-transition-name），DOM 更新本身不受影响。',
    },
    {
      q: "一个离场状态机在面板上写了 <code>onTransitionEnd={() =&gt; setPhase('gone')}</code>，没有检查事件来源和当前阶段。面板里有一个带 hover 过渡的按钮。面板处于 <code>entered</code> 时，鼠标划过按钮，会发生什么？",
      options: ['什么也不会发生', '按钮的 transitionend 冒泡到面板，面板被卸载', '报错：phase 不能直接变成 gone', '面板重新播放入场动画'],
      answer: 1,
      explain:
        '<code>transitionend</code> 会冒泡。子元素的任何过渡结束，都会触发父元素的处理函数。所以要检查 <code>e.target === e.currentTarget</code>，并且只在 <code>leaving</code> 阶段才改成 <code>gone</code>。',
    },
  ],
  plays: {
    '条件渲染：入场有动画，离场没有': {
      note: '打开时卡片带着淡入出现，那是 @starting-style 给了它起点。关闭时，React 在这次渲染里就把节点从 DOM 里删了，过渡没有可以作用的元素，所以没有淡出。看控制台：下一帧时卡片已经不在 DOM 里。',
      predict: {
        q: '点“打开”，卡片带着淡入出现。再点“关闭”，卡片会怎样？',
        options: ['淡出 400 毫秒后消失', '立刻消失，没有淡出', '先淡出，然后又淡入一次', '报错：元素已被卸载'],
        answer: 1,
        explain:
          '条件渲染变成 false，React 马上从 DOM 里删掉这个节点，样式里写的 transition 没有元素可以作用。最迷惑的是第一项：<code>transition</code> 写在 <code>.card</code> 上，但元素没了，过渡也就没了。',
      },
      pkey: 'animation|条件渲染：入场有动画，离场没有',
    },
    '先播放离场动画，再卸载': {
      note: '关闭时阶段先变成 leaving，面板留在 DOM 里淡出，transitionend 来了再变成 gone。离场中再点“打开”，阶段从 leaving 直接回到 entered，面板没有被卸载，兜底定时器也被 effect 的清理函数取消。试试快速连点，状态始终是四个阶段之一。',
      predict: {
        q: '淡出要 600 毫秒。面板正在淡出时（控制台刚输出“阶段：leaving”），趁它没播完再点一次“打开”。控制台接下来输出什么？',
        options: ['阶段：gone，然后 阶段：entering', '阶段：entered', '什么也不输出，一直停在 leaving', '阶段：entering'],
        answer: 1,
        explain:
          '状态机规则：在 <code>leaving</code> 时 <code>show</code> 变回 true，直接转成 <code>entered</code>。面板一直在 DOM 里，CSS 把 opacity 从当前值接着动画回 1。如果漏了定时器清理，它会在之后把面板卸载。',
      },
      pkey: 'animation|先播放离场动画，再卸载',
    },
    'ViewTransition：放不放进 startTransition': {
      note: '“动画开始”日志只在 React 真的为这次更新启动动画时才出现。普通 setState 是紧急更新，界面立刻变，不动；放进 startTransition 才有。浏览器不支持 View Transition API 时，更新照常发生，只是没有动画。',
      predict: {
        q: '依次点：①“普通 setState 切换”（展开）②“普通 setState 切换”（收起）③“startTransition 切换”（展开）。控制台一共会出现几条“动画开始”日志？',
        options: ['0 条', '1 条', '2 条', '3 条'],
        answer: 1,
        explain: '只有第 ③ 步在过渡更新里，触发了一次 enter。①② 是紧急更新，<code>&lt;ViewTransition&gt;</code> 不会为它们启动动画，包括收起时的 exit。',
      },
      pkey: 'animation|ViewTransition：放不放进 startTransition',
    },
    '相册：共享元素与列表重排': {
      note: '点缩略图：同名的缩略图和大图被当作同一个元素，从小到大地变形（share）。点“反转顺序”：每个带 key 的 ViewTransition 做一次位移（update）。页面里没有任何手写的位置计算。',
    },
    'FLIP：自己量位置，再反向变换': {
      note: '点“反转”：每项从旧位置滑到新位置。“删除第一项”：下面的项上移，被删除的那一项没有离场动画（FLIP 只管留下来的元素）。动画进行中连点几次，元素会从旧位置“跳”一下再动，这是手写 FLIP 的边界。',
    },
    '只动 transform：每帧的布局代价': {
      note: '典型的结果是 transform 的耗时明显更低，margin-left 是它的两倍以上。看相对差距，绝对数值因设备而异。transform 的值也不是 0：读 offsetHeight 本身和动画调度都有开销。',
      predict: {
        q: '同一个方块，分别用 transform 和 margin-left 动画，每帧读一次 offsetHeight（强制布局）。耗时中位数的关系是？',
        options: ['两者差不多，浏览器都要重新布局', 'transform 明显更低', 'margin-left 明显更低', 'transform 是 0 毫秒，margin-left 约几十毫秒'],
        answer: 1,
        explain:
          'transform 不改变布局，强制布局时几乎没有要算的东西；margin-left 每帧都弄脏布局，那 8000 个元素要重新排。最后一项错在“正好 0”和“几十毫秒”：真实数值是个位数毫秒，差距看倍数。',
      },
      pkey: 'animation|只动 transform：每帧的布局代价',
    },
  },
} satisfies Lesson;
