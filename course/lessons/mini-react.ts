import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/mini-react.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'mini-react',
  runtime: 19,
  stage: 3,
  title: '原理：亲手实现迷你 React',
  mins: 33,
  summary: '从 createElement 到 Hooks 链表，揭开 React 的魔法。',
  goals: [
    '能写出 createElement，并解释 React 元素只是普通对象',
    '能用“数组 + 游标”实现 useState 和 useRef',
    '能解释为什么在 if 里调用 Hook 会让 state 错位',
    '能说出 Fiber 怎样让渲染可以中断，以及提交为什么必须一次完成',
  ],
  keyPoints: [
    'JSX 编译成 <code>createElement(type, props, ...children)</code>，它只返回一个描述界面的普通对象。',
    '每个组件按调用顺序存放 Hook 的数据，再用一个游标记录“现在是第几个 Hook”。每次渲染前，游标归零。',
    'Hook 只认顺序，不认名字。在 if 里调用 Hook，某次渲染跳过一个，后面所有 Hook 都会读到别人的数据。',
    'Fiber 把渲染拆成小的工作单元，可以暂停、恢复和丢弃。渲染阶段不改 DOM；提交阶段一次性改完，用户不会看到画了一半的界面。',
  ],
  quiz: [
    {
      q: '在迷你 useState 中，若第二次渲染时 if 跳过了第一个 useState，name 会读到什么？',
      options: ['"小红"', 'count 的值', 'undefined', '报错'],
      answer: 1,
      explain:
        '游标从 0 开始。跳过第一个调用后，name 的 useState 拿到了下标 0，也就是 count 的 state。不会是 "小红"：Hook 只认位置，不认变量名。迷你实现不会报错，只会悄悄读错。真实的 React 多做了一层保护：它发现这次渲染调用的 Hook 数量和上次不同，就抛出 `Rendered fewer hooks than expected`；数量相同但顺序变了时，开发模式会警告 Hook 的顺序发生了变化（第 15 课见过这些报错）。',
    },
    {
      q: '一棵 3000 个组件的树正在渲染一次过渡更新，渲染到一半时用户按下了键盘。在 Fiber 架构下会怎样？',
      options: [
        '等整棵树渲染完，再处理按键',
        '在工作单元之间让出主线程，先处理按键',
        'React 把已经渲染好的一半先提交到 DOM，再处理按键',
        '浏览器强制中断 JavaScript，渲染出错',
      ],
      answer: 1,
      explain:
        'Fiber 把渲染拆成小单元，每做完一个就检查时间片有没有用完，用完就让出主线程，浏览器才有机会处理按键。渲染阶段不改 DOM，所以可以随时暂停或丢弃。第三项是常见误解：React 从不提交“一半”的结果，提交阶段总是一次性完成。',
    },
    {
      q: '为什么提交阶段必须同步一次完成，而渲染阶段可以中断？',
      options: [
        '因为 DOM 操作很慢，必须一次做完才快',
        '渲染阶段不改 DOM，可以重来；提交中断会露出半新半旧的界面',
        '因为 effect 必须在渲染阶段执行',
        '因为浏览器不允许分多次修改 DOM，中途的修改会被浏览器拒绝',
      ],
      answer: 1,
      explain:
        '能不能中断，取决于用户看不看得见。渲染阶段的工作对用户不可见，随时可以重来。提交阶段一旦中断，用户就会看到不一致的界面。第一项是常见误解：分多次改 DOM 也可以很快，问题在于一致性，而不是速度。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>补全 <code>render</code>：每次渲染前，处理好游标。</li><li>补全 <code>useState(initial)</code>：按游标位置存取 state。setState 支持新值和函数，更新后重新渲染。</li><li>补全 <code>useRef(initial)</code>：也占用一个位置，每次渲染返回同一个 <code>{ current }</code> 对象。修改 current 不会重新渲染。</li><li>运行自测，看控制台的输出和 hooks 数组。本题不需要 App 组件。</li><li>检查时还会测试一个“在 if 里调用 Hook”的组件。想一想，它会读到什么？</li></ol>',
    starter: `// —— 迷你 Hooks 运行时 ——
let hooks = [];      // 当前组件的所有 Hook 数据，按调用顺序存放
let cursor = 0;      // 现在执行到第几个 Hook
let Component = null;
let output = null;

function render() {
  // 每次渲染前，游标要怎样处理？
  output = Component();
  return output;
}

function mount(fn) {
  hooks = [];
  Component = fn;
  return render();
}

function useState(initial) {
  // 1. 用游标确定自己的位置 i
  // 2. 第一次渲染时，把 initial 存进 hooks[i]
  // 3. 定义 setState(v)：v 可以是新值，也可以是函数。写入 hooks[i]，然后重新渲染
  // 4. 游标前进一格
  // 5. 返回 [当前值, setState]
  return [initial, () => {}]; // 占位：换成你的实现
}

function useRef(initial) {
  // 返回一个 { current } 对象，每次渲染都返回同一个对象
  // 修改 ref.current 不会重新渲染
  return { current: initial }; // 占位：换成你的实现
}

// 自测：结果打印在控制台
let api;
mount(function Counter() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('小明');
  const renders = useRef(0);
  renders.current++;
  api = { setCount, setName };
  return name + ' 点击了 ' + count + ' 次（第 ' + renders.current + ' 次渲染）';
});
console.log(output);
api.setCount(c => c + 1);
api.setName('小红');
console.log(output);
console.log('hooks：', JSON.stringify(hooks));`,
    solution: `// —— 迷你 Hooks 运行时 ——
let hooks = [];      // 当前组件的所有 Hook 数据，按调用顺序存放
let cursor = 0;      // 现在执行到第几个 Hook
let Component = null;
let output = null;

function render() {
  cursor = 0;
  output = Component();
  return output;
}

function mount(fn) {
  hooks = [];
  Component = fn;
  return render();
}

function useState(initial) {
  const i = cursor;
  if (i >= hooks.length) hooks[i] = initial;
  const setState = (v) => {
    hooks[i] = typeof v === 'function' ? v(hooks[i]) : v;
    render();
  };
  cursor++;
  return [hooks[i], setState];
}

function useRef(initial) {
  const i = cursor;
  if (i >= hooks.length) hooks[i] = { current: initial };
  cursor++;
  return hooks[i];
}

// 自测：结果打印在控制台
let api;
mount(function Counter() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('小明');
  const renders = useRef(0);
  renders.current++;
  api = { setCount, setName };
  return name + ' 点击了 ' + count + ' 次（第 ' + renders.current + ' 次渲染）';
});
console.log(output);
api.setCount(c => c + 1);
api.setName('小红');
console.log(output);
console.log('hooks：', JSON.stringify(hooks));`,
    hint: '1. 每个 Hook 调用时，先记下 <code>const i = cursor</code>，再让 cursor 加 1。setState 是一个闭包，它记住的是自己的 i。2. 只在 hooks 里还没有这一格时才存 initial。用 <code>!hooks[i]</code> 判断会出错：state 是 0 或空字符串时，它会被当成“还没有”。3. 不把游标归零，第二次渲染的 Hook 会跑到新的格子里。',
    faded: `// —— 迷你 Hooks 运行时 ——
let hooks = [];      // 当前组件的所有 Hook 数据，按调用顺序存放
let cursor = 0;      // 现在执行到第几个 Hook
let Component = null;
let output = null;

function render() {
  /* ✏️ 每次渲染前，让游标回到第一个 Hook */
  output = Component();
  return output;
}

function mount(fn) {
  hooks = [];
  Component = fn;
  return render();
}

function useState(initial) {
  const i = cursor;
  /* ✏️ 只在第一次渲染时，把 initial 存进 hooks[i] */
  const setState = (v) => {
    hooks[i] = typeof v === 'function' ? v(hooks[i]) : v;
    render();
  };
  /* ✏️ 让下一个 Hook 用下一格 */
  return [hooks[i], setState];
}

function useRef(initial) {
  const i = cursor;
  /* ✏️ 第一次渲染时，在 hooks[i] 存一个 { current: initial } 对象 */
  cursor++;
  return hooks[i];
}

// 自测：结果打印在控制台
let api;
mount(function Counter() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('小明');
  const renders = useRef(0);
  renders.current++;
  api = { setCount, setName };
  return name + ' 点击了 ' + count + ' 次（第 ' + renders.current + ' 次渲染）';
});
console.log(output);
api.setCount(c => c + 1);
api.setName('小红');
console.log(output);
console.log('hooks：', JSON.stringify(hooks));`,
    exports: ['mount', 'useState', 'useRef'],
    test: async t => {
      const { mount, useState, useRef } = t.exports;
      t.assert(
        [mount, useState, useRef].every(f => typeof f === 'function'),
        '没有找到 mount、useState 和 useRef',
      );
      let last: any,
        api: any,
        refs = [];
      mount(function Probe() {
        const [count, setCount] = useState(0);
        const [name, setName] = useState('小明');
        const r = useRef(0);
        r.current++;
        refs.push(r);
        api = { setCount, setName, r };
        last = count + '|' + name + '|' + r.current;
        return last;
      });
      t.assert(last === '0|小明|1', `第一次渲染应得到 0|小明|1（count|name|ref），实际是 ${last}`);
      api.setCount(c => c + 1);
      t.assert(last !== '0|小明|1' || refs.length > 1, 'setCount 之后组件没有重新渲染。setState 要调用 render()');
      t.assert(
        !last.startsWith('0|小明|'),
        `setCount(c => c + 1) 后，count 仍是初始值（${last}）。游标在每次渲染前归零了吗？没有归零，第二次渲染的 Hook 会跑到新的格子里，读到 initial`,
      );
      t.assert(last === '1|小明|2', `setCount(c => c + 1) 后应得到 1|小明|2，实际是 ${last}。setState 支持函数吗？ref 每次渲染都是同一个对象吗？`);
      api.setName('小红');
      t.assert(last === '1|小红|3', `setName('小红') 后应得到 1|小红|3，实际是 ${last}`);
      api.setCount(0);
      api.setName('');
      t.assert(last === '0||5', `setCount(0)、setName('') 后应得到 0||5，实际是 ${last}。判断“第一次渲染”时，是不是把 0 和空字符串也当成了“还没有值”？`);
      t.assert(
        refs.every(x => x === refs[0]),
        'useRef 每次渲染都应返回同一个对象',
      );
      const before = refs.length;
      api.r.current = 100;
      t.assert(refs.length === before, '修改 ref.current 不应触发重新渲染');
      let flag = true,
        seen: any,
        setB: any;
      mount(function Conditional() {
        if (flag) {
          useState('A');
        }
        const [b, sb] = useState('B');
        seen = b;
        setB = sb;
        return b;
      });
      t.assert(seen === 'B', `第一次渲染，b 应为 B，实际是 ${seen}`);
      flag = false;
      setB(x => x);
      t.assert(seen === 'A', `跳过 if 里的 useState 后，b 应该错位，读到第 0 格的 'A'，实际是 ${seen}。你的实现是按调用顺序存取的吗？`);
    },
  },
  checkOnly: [
    {
      q: `用本课的迷你 useState 渲染两次。第二次渲染前，<b>忘了</b>把 i 重置为 0。第二次渲染时，组件读到什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">let hooks = [], i = 0;
function useState(init) {
  const j = i++;
  hooks[j] ??= init;
  return [hooks[j], v =&gt; { hooks[j] = v; }];
}
function Comp() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('小明');
  // …
}
// 第一次渲染后调用 setCount(5)、setName('小红')</code></pre></div>`,
      options: ["5 和 '小红'", "0 和 '小明'：下标从 2 开始，占用了新的格子", "'小红' 和 undefined", '报错'],
      answer: 1,
      explain:
        '第二次渲染时 i 从 2 开始，两个 useState 用的是 hooks[2] 和 hooks[3]。这两格是空的，于是被填入初始值。hooks 变成 <code>[5, "小红", 0, "小明"]</code>。所以真实的 React 在每次渲染组件前，都会把 Hook 指针重置到开头。',
    },
    {
      q: `用本课 20 行的 render 函数。同事想实现“更新”：state 变化后，再调用一次 <code>render(app, box)</code>。会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function render(element, container) {
  // …根据 element 创建 dom，设置属性，递归渲染子元素
  container.appendChild(dom);
}

render(app, box);
// state 变化后：
render(app, box);</code></pre></div>`,
      options: ['只更新变化的部分', '报错：同一个容器不能渲染两次', '先清空 box，再画新的界面', 'box 里出现两份界面'],
      answer: 3,
      explain:
        '这个 render 每次都创建全新的 DOM，然后追加到容器里。它不记得上次画了什么，也不比较。所以第二次调用后出现两份界面。即使先清空再画，也会丢掉输入框的焦点和文字。真实的 React 保存上一次的元素树，在协调阶段比较新旧两棵树，只修改变化的 DOM。“只更新变化的部分”正是这 20 行代码没有实现的功能。',
    },
  ],
  plays: {
    元素就是一个普通对象: {},
    '一个 20 行的渲染器': {},
    '用循环遍历 Fiber 树': {
      note: '第一轮处理 App、Header、Logo 三个节点，然后让出主线程。遍历顺序是先 child，没有 child 就走 sibling，再没有就回到父节点找它的 sibling。递归做不到“停在 Logo 之后”，因为进度藏在调用栈里；这里的进度只是变量 next，所以能停、能继续、也能整棵丢掉。',
      predict: {
        q: '工作循环每一轮最多处理 3 个节点。第一轮处理了哪三个节点？',
        options: ['App、Header、Main', 'Header、Logo、Nav', 'App、Header、Logo', 'App、Header、Footer'],
        answer: 2,
        explain:
          '遍历先走 child：App 的 child 是 Header，Header 的 child 是 Logo。三个单元用完，时间片就结束了。选“App、Header、Main”的人按层逐行遍历（广度优先）；Fiber 是先深入 child，没有 child 才走 sibling。',
      },
      pkey: 'mini-react|用循环遍历 Fiber 树',
    },
    '20 行实现 useState': {
      predict: {
        q: '代码最后打印的 hooks 数组是什么？',
        options: ['[0,"小明"]', '[2,"小红"]', '[1,"小红"]', '[2,"小明"]'],
        answer: 1,
        explain: 'count 被加了两次变成 2，name 被改成“小红”。两个状态按调用顺序分别存在下标 0 和 1。',
      },
      pkey: 'mini-react|20 行实现 useState',
    },
  },
} satisfies Lesson;
