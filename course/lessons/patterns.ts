import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/patterns.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'patterns',
  stage: 3,
  title: '组件设计模式',
  mins: 24,
  summary: '复合组件、render props、受控/非受控双模式：写出别人爱用的组件 API。',
  goals: [
    '能用 Context 写出一组复合组件',
    '能写出同时支持受控和非受控模式的组件',
    '能读懂老代码里的 render props 和 HOC，并改写成自定义 Hook',
    '能判断一个组件 API 该用配置 props 还是组合',
  ],
  keyPoints: [
    '复合组件：父组件用 Context 提供共享 state，子组件各自读取。使用者自由组合结构，不用传一长串配置 props。',
    '受控和非受控双模式：传了 <code>value</code> 就是受控，显示 value；没传就用内部 state，初始值来自 <code>defaultValue</code>。',
    '最常见的坑：用“有没有传 onChange”判断受控。只传 onChange、不传 value 的组件仍是非受控的。',
    'render props 和 HOC 是 Hooks 之前复用逻辑的方式。今天大多用自定义 Hook，render props 仍适合“让使用者决定怎么渲染”。',
  ],
  quiz: [
    {
      q: '你写了 Tabs、Tabs.Tab、Tabs.Panel 三个组件。使用者可能在 Tab 外面再包一层 div。Tab 怎样拿到“当前选中哪个”？',
      options: [
        'Tabs 用 React.Children.map 和 cloneElement 给每个直接子元素注入 active',
        'Tabs 用 Context 提供 active，Tab 用 useContext 读取',
        '使用者手动给每个 Tab 传 active',
        '把 active 放进模块级的全局变量',
      ],
      answer: 1,
      explain:
        'Context 能穿过任意层级，使用者怎么包都不影响。Children.map 是常见的老写法，但它只能处理直接子元素，中间多一层 div 就失效。全局变量会让同一页面上的两个 Tabs 互相干扰。',
    },
    {
      q: '使用者写了 &lt;Toggle value={true} /&gt;，没有传 onChange。点击按钮会怎样？',
      options: ['变为“关”', '保持“开”：它是受控的，父组件没有更新 value', '报错', '在开和关之间来回切换，因为组件内部有自己的 state'],
      answer: 1,
      explain:
        '传了 value 就是受控模式，显示什么由父组件决定。这和只写 value、不写 onChange 的原生 input 一样，是只读的。选“变为关”的人以为组件会自己记住点击，但受控模式下内部 state 不起作用。',
    },
    {
      q: '老代码用 withMouse(Component) 给组件注入 x、y，两个 HOC 叠加后 props 名字冲突了。今天更推荐怎样复用这段逻辑？',
      options: [
        '再写一个 HOC，把 props 重命名',
        '改成 render props：&lt;Mouse render={…} /&gt;',
        '写一个自定义 Hook：const { x, y } = useMouse()',
        '把 x、y 存进 Context',
      ],
      answer: 2,
      explain:
        '自定义 Hook 直接返回值，名字由调用者决定，也没有多余的包装层。render props 能解决命名冲突，但多层嵌套会形成“回调地狱”。Context 用来共享同一份数据，不是用来复用逻辑的。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>判断模式：传了 <code>value</code> 就是受控模式，否则是非受控模式。</li><li>受控模式下，显示 <code>value</code>。</li><li>非受控模式下，用内部 state 保存值，初始值为 <code>defaultValue</code>。</li><li>点击时调用 <code>onChange(新值)</code>。非受控模式下，同时更新内部 state。</li><li>按钮文字为 <b>开</b> 或 <b>关</b>。</li></ol>',
    starter: `import { useState } from 'react';

function Toggle({ id, value, defaultValue = false, onChange }) {
  // 在这里实现
  return <button id={id}>关</button>;
}

function App() {
  const [on, setOn] = useState(true);
  return (
    <div>
      <p>非受控：<Toggle id="free" /></p>
      <p>受控：<Toggle id="ctrl" value={on} onChange={setOn} /> 父组件看到：<span id="parent">{on ? '开' : '关'}</span></p>
      <p>受控但父组件拒绝修改：<Toggle id="locked" value={false} onChange={() => {}} /></p>
      <p>非受控 + 默认开 + 监听：<Toggle id="free2" defaultValue={true} onChange={v => console.log(v)} /></p>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

function Toggle({ id, value, defaultValue = false, onChange }) {
  const [inner, setInner] = useState(defaultValue);
  const isControlled = value !== undefined;
  const on = isControlled ? value : inner;
  function toggle() {
    if (!isControlled) setInner(!on);
    if (onChange) onChange(!on);
  }
  return <button id={id} onClick={toggle}>{on ? '开' : '关'}</button>;
}

function App() {
  const [on, setOn] = useState(true);
  return (
    <div>
      <p>非受控：<Toggle id="free" /></p>
      <p>受控：<Toggle id="ctrl" value={on} onChange={setOn} /> 父组件看到：<span id="parent">{on ? '开' : '关'}</span></p>
      <p>受控但父组件拒绝修改：<Toggle id="locked" value={false} onChange={() => {}} /></p>
      <p>非受控 + 默认开 + 监听：<Toggle id="free2" defaultValue={true} onChange={v => console.log(v)} /></p>
    </div>
  );
}`,
    hint: '先回答一个问题：怎样知道使用者有没有传 value？传了，就显示 value。没传，就显示内部 state。注意：不能用“有没有传 onChange”来判断模式。',
    faded: `import { useState } from 'react';

function Toggle({ id, value, defaultValue = false, onChange }) {
  const [inner, setInner] = useState(defaultValue);
  /* ✏️ 判断是不是受控模式 */
  /* ✏️ 算出现在该显示开还是关 */
  function toggle() {
    /* ✏️ 非受控时，更新内部 state */
    if (onChange) onChange(!on);
  }
  return <button id={id} onClick={toggle}>{on ? '开' : '关'}</button>;
}

function App() {
  const [on, setOn] = useState(true);
  return (
    <div>
      <p>非受控：<Toggle id="free" /></p>
      <p>受控：<Toggle id="ctrl" value={on} onChange={setOn} /> 父组件看到：<span id="parent">{on ? '开' : '关'}</span></p>
      <p>受控但父组件拒绝修改：<Toggle id="locked" value={false} onChange={() => {}} /></p>
      <p>非受控 + 默认开 + 监听：<Toggle id="free2" defaultValue={true} onChange={v => console.log(v)} /></p>
    </div>
  );
}`,
    test: async t => {
      t.assert(t.text('#free') === '关' && t.text('#ctrl') === '开', '初始状态不对：非受控应为“关”，受控应为“开”');
      await t.click('#free');
      t.assert(t.text('#free') === '开', '非受控 Toggle 点击后应变为“开”');
      await t.click('#ctrl');
      t.assert(t.text('#ctrl') === '关' && t.text('#parent') === '关', '受控 Toggle 点击后，父组件和按钮都应变为“关”');
      await t.click('#locked');
      t.assert(t.text('#locked') === '关', '父组件不更新 value 时，受控 Toggle 应保持“关”');
      t.assert(
        t.text('#free2') === '开',
        'free2 的 defaultValue={true}，初始应为“开”。它传了 onChange 但没传 value，所以是非受控的。你是用什么判断受控的？只看 value 是不是 undefined',
      );
      await t.click('#free2');
      t.assert(t.text('#free2') === '关', 'free2 传了 onChange 但没传 value，它是非受控的，点击后应变为“关”。你用什么判断受控？非受控时要更新内部 state');
    },
  },
  checkOnly: [
    {
      q: `有人在 <code>&lt;Tabs&gt;</code> 外面单独渲染了 <code>&lt;Tab id="a" /&gt;</code>。会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const TabsCtx = createContext(null);

function Tab({ id }) {
  const { active, setActive } = useContext(TabsCtx);
  // …
}</code></pre></div>`,
      options: ['正常显示，active 为 undefined', '报错：无法从 null 中解构 active', 'Tab 自动创建一个新的 Tabs', '什么都不渲染'],
      answer: 1,
      explain:
        '没有 Provider，useContext 返回默认值 null。从 null 解构会抛出 TypeError，错误信息不容易看懂。常见做法：写一个 <code>useTabs()</code> Hook，在值为 null 时抛出清楚的错误，例如“Tab 必须放在 Tabs 里”。',
    },
    {
      q: `父组件渲染 <code>&lt;Toggle defaultValue={on} /&gt;</code>。父组件把 on 从 false 改为 true，按钮显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Toggle({ defaultValue = false }) {
  const [on, setOn] = useState(defaultValue);
  return (
    &lt;button onClick={() =&gt; setOn(!on)}&gt;{on ? '开' : '关'}&lt;/button&gt;
  );
}</code></pre></div>`,
      options: ['开', '关：defaultValue 只决定初始值', '在开和关之间切换', '报错'],
      answer: 1,
      explain:
        '这是非受控模式：组件自己保存值，defaultValue 只在第一次渲染时使用。父组件想随时控制显示，应改用受控模式：传 value 和 onChange。或者在 defaultValue 变化时换一个 key，让组件重新挂载。',
    },
    {
      q: `Tabs 用 cloneElement 给每个 Tab 传 selected。使用者这样写，哪个 Tab 会高亮？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Tabs({ active, children }) {
  return Children.map(children, (child, i) =&gt;
    cloneElement(child, { selected: i === active })
  );
}

&lt;Tabs active={0}&gt;
  &lt;div className="row"&gt;
    &lt;Tab&gt;一&lt;/Tab&gt;
    &lt;Tab&gt;二&lt;/Tab&gt;
  &lt;/div&gt;
&lt;/Tabs&gt;</code></pre></div>`,
      options: ['“一”', '都不高亮', '两个都高亮', '“二”'],
      answer: 1,
      explain:
        'Children.map 只遍历<b>直接</b>子元素。这里唯一的直接子元素是 div，selected 加到了 div 上，两个 Tab 都没收到。所以 cloneElement 写的复合组件很脆弱：使用者多包一层就失效。用 Context 共享状态，Tab 通过 useContext 读取，就不受嵌套层级影响。选“一”的人默认 Tab 是直接子元素，但中间多了一层 div。',
    },
  ],
  plays: {
    '复合组件：Tabs': {
      note: '这个 Tabs 只演示怎样用 Context 共享状态。它写了 role="tab"，却还没实现方向键切换，也没有把 tab 和面板关联起来。下一课会解释为什么这样不够。真实项目请用 Radix、React Aria 这类已经做好键盘行为的组件。Radix UI、Headless UI、shadcn/ui 等流行组件库大量使用复合组件模式。',
    },
    同一段逻辑的三种写法: {
      note: '运行后只有一个 HOC 注入的 pos 留了下来：里层的 withOrigin 在展开 props 之后才写 pos，所以覆盖了外层 withMouse 注入的值，鼠标怎么动都不变。被包的组件看不出 pos 是谁给的，这就是 HOC 的固有毛病。自定义 Hook 的返回值由调用者命名，不会有这个问题。',
      predict: {
        q: '鼠标一直不动。页面上 “HOC：” 后面显示什么？',
        options: ['0,0', 'undefined', '原点', '报错：同一个 prop 不能注入两次'],
        answer: 2,
        explain:
          '两个 HOC 都注入了 pos。里层的 withOrigin 在展开 props 之后才写 pos=“原点”，所以覆盖了外层传下来的值。React 不会对同名 prop 报错或警告。选 “0,0” 的人以为外层的 withMouse 优先；选“报错”的人以为 React 会检查冲突。',
      },
      pkey: 'patterns|同一段逻辑的三种写法',
    },
  },
} satisfies Lesson;
