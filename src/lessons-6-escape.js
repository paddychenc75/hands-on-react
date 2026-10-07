/* ========== 新课：DOM 逃生舱（插在“自定义 Hook”之后） ========== */
lessonAfter('custom-hooks', {
  id: 'escape-hatches', stage: 1, title: 'DOM 逃生舱：Portal、useLayoutEffect 与 useId', mins: 35,
  summary: '少数情况下，props 和 state 不够用。学会 5 个直接和 DOM 打交道的 API，也学会什么时候不用它们。',
  goals: [
    '能写出用 forwardRef 和 useImperativeHandle 只暴露 focus() 等少数方法的组件',
    '能判断“测量布局再修改位置”的代码该放进 useLayoutEffect 还是 useEffect',
    '能用 createPortal 把弹窗渲染到 body，并预测弹窗里的事件冒泡到哪里',
    '能用 useId 生成 id，关联 label、aria-labelledby 和 aria-describedby',
  ],
  keyPoints: [
    '逃生舱用于 props 和 state 表达不了的事：聚焦、测量尺寸、把弹窗放到页面最外层。能用 props 表达的，就不要用 ref。',
    'useImperativeHandle 让 ref.current 只有你挑的几个方法，父组件拿不到整个 DOM 节点。',
    'useLayoutEffect 在 DOM 更新后、浏览器绘制前执行，用来“先测量，再绘制”。它会阻塞绘制，所以默认仍用 useEffect。',
    'createPortal 只改变 DOM 的位置。在 React 树里弹窗还是原来的子节点：能读到上层 Context，事件也沿 React 树冒泡。',
    'useId 为每个组件实例生成稳定、唯一、服务端和浏览器一致的 id。不要用它生成列表的 key。',
  ],
  body: [
    p('React 推荐声明式写法：用 state 描述界面。但有些事无法用 props 和 state 表达。例如：让输入框获得焦点、测量元素尺寸、把弹窗放到页面最外层。'),
    p('本课的 5 个 API 就是为这些情况准备的“逃生舱”。逃生舱很有用，但只在需要时打开。每一节最后都会说明<b>什么时候不要用</b>。'),

    h('一、把 ref 传给自己的组件：forwardRef'),
    p('在 React 18 中，<code>ref</code> 不是普通 prop。你写 <code>&lt;FancyInput ref={r} /&gt;</code> 时，函数组件<b>收不到</b>这个 ref。'),
    p('解决方法是用 <code>forwardRef</code> 包装组件。包装后，组件函数会收到第二个参数：父组件传来的 ref。'),
    code(`
import { forwardRef } from 'react';

// 第一个参数是 props，第二个参数是 ref
const FancyInput = forwardRef(function FancyInput(props, ref) {
  return <input ref={ref} {...props} />;
});`, 'React 18：用 forwardRef 接收 ref'),
    p('这样写，父组件拿到的是<b>整个 input DOM 节点</b>。父组件可以改它的样式、内容，甚至删除它。这暴露得太多了。'),

    h('二、只暴露几个方法：useImperativeHandle'),
    p('<code>useImperativeHandle(ref, createHandle, 依赖数组)</code> 让你自己决定 ref.current 里放什么。按下面 3 步做：'),
    p('<ol class="task-steps">'
      + '<li>在组件内部用 <code>useRef</code> 拿到真正的 DOM 节点。</li>'
      + '<li>调用 <code>useImperativeHandle</code>，返回一个只含少数方法的对象。</li>'
      + '<li>父组件的 <code>ref.current</code> 就是这个对象，而不是 DOM 节点。</li>'
      + '</ol>'),
    play(`
import { useRef, useImperativeHandle, forwardRef } from 'react';

const FancyInput = forwardRef(function FancyInput({ label }, ref) {
  const inputRef = useRef(null); // 真正的 DOM 节点，只在组件内部使用

  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current.focus();
    },
    clear() {
      inputRef.current.value = '';
      inputRef.current.focus();
    },
  }), []);

  return (
    <label>
      {label} <input ref={inputRef} defaultValue="一些文字" />
    </label>
  );
});

function App() {
  const ref = useRef(null);
  return (
    <div>
      <FancyInput label="名字" ref={ref} />
      <p>
        <button onClick={() => ref.current.focus()}>聚焦</button>{' '}
        <button onClick={() => ref.current.clear()}>清空</button>{' '}
        <button onClick={() => console.log(Object.keys(ref.current))}>
          ref.current 里有什么？
        </button>
      </p>
    </div>
  );
}`, '只暴露 focus() 和 clear()', '点第三个按钮，看控制台。父组件只能看到两个方法，看不到 DOM 节点。'),
    like('useImperativeHandle 像自动售货机。机器外面只有几个按钮：选商品、投币、退币。机器里的货架和电机，你看不到也碰不到。厂家换了内部零件，按钮的用法也不变。'),
    deep('React 19 起，<code>ref</code> 可以像普通 prop 一样传递：<code>function MyInput({ ref }) { … }</code>。不再需要 <code>forwardRef</code>，它将来会被废弃。本课的运行环境是 React 18.3，所以示例用 forwardRef。<code>useImperativeHandle</code> 在两个版本中用法相同。'),
    warn('<b>能用 props 表达的，就不要用 ref。</b>例如弹窗不要暴露 <code>open()</code> 和 <code>close()</code>，而应该接收 <code>isOpen</code> prop。ref 只用于命令式的操作：聚焦、滚动、选中文字、触发动画。'),

    h('三、先测量，再绘制：useLayoutEffect'),
    p('一次更新分为几步。注意 3 和 5 的位置：'),
    p('<ol class="task-steps">'
      + '<li><b>渲染</b>：React 调用组件函数。</li>'
      + '<li><b>提交</b>：React 修改真实 DOM。</li>'
      + '<li><b>useLayoutEffect</b> 执行。此时 DOM 已更新，但屏幕还没变。</li>'
      + '<li>浏览器绘制屏幕。用户看到新界面。</li>'
      + '<li><b>useEffect</b> 执行（通常在绘制之后）。</li>'
      + '</ol>'),
    p('如果你在 effect 里测量 DOM，再用测量结果修改位置，用户可能先看到错误的位置，再看到正确的位置。这就是“闪一下”。把测量放进 <code>useLayoutEffect</code>，修改会在绘制前完成。'),
    play(`
import { useState, useEffect, useLayoutEffect, useRef } from 'react';

// 模拟一台慢设备：让 JS 忙 ms 毫秒
function slow(ms) {
  const start = performance.now();
  while (performance.now() - start < ms) {}
}

function Tooltip({ layout }) {
  const ref = useRef(null);
  const [y, setY] = useState(null); // null 表示“还没测量”

  function measure() {
    slow(300);
    setY(-(ref.current.offsetHeight + 6)); // 放到按钮上方
  }
  // 两个 Hook 每次都调用，只有一个真正测量。这样 Hook 的顺序不会变。
  useEffect(() => { if (!layout) measure(); }, []);
  useLayoutEffect(() => { if (layout) measure(); }, []);

  return (
    <div ref={ref} style={{
      position: 'absolute', left: 0, top: y === null ? 0 : y,
      background: y === null ? '#e74c3c' : '#2d3436',
      color: '#fff', padding: '6px 10px', borderRadius: 6, whiteSpace: 'nowrap',
      pointerEvents: 'none', // 不挡住鼠标，否则会反复触发 enter/leave
    }}>
      {y === null ? '还没测量（错误位置）' : '我是提示框'}
    </div>
  );
}

function HoverButton({ layout, children }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block', margin: '48px 12px 8px 0' }}>
      <button onPointerEnter={() => setShow(true)} onPointerLeave={() => setShow(false)}>
        {children}
      </button>
      {show && <Tooltip layout={layout} />}
    </span>
  );
}

function App() {
  return (
    <div>
      <HoverButton layout={false}>悬停：useEffect</HoverButton>
      <HoverButton layout={true}>悬停：useLayoutEffect</HoverButton>
    </div>
  );
}`, '提示框会不会闪一下？', '把鼠标移到两个按钮上。左边先出现红色的错误位置，再跳到上方。右边稍等一下，直接出现在正确位置。手机上可以轻点按钮。'),
    deep('React 18 有一个细节：如果更新由点击、按键等离散事件触发，useEffect 也会在绘制前同步执行。所以本演示用了鼠标悬停。不要依赖这个细节。需要在绘制前测量时，就明确使用 useLayoutEffect。'),
    warn('<b>默认用 useEffect。</b>useLayoutEffect 会阻塞绘制。代码慢，整个页面就卡住（上面右边按钮的延迟就是这样来的）。只有“读布局，再同步修改 DOM 或 state”时才用它。另外，useLayoutEffect 不会在服务端执行，React 18 在服务端渲染时还会给出警告。'),

    h('四、把 DOM 放到别处：createPortal'),
    p('弹窗、下拉菜单、提示框常常要显示在所有内容的上方。如果它们渲染在一个带 <code>overflow: hidden</code> 或 <code>z-index</code> 的容器里，就可能被裁掉或被遮住。'),
    p('<code>createPortal(children, domNode)</code> 把 children 的 DOM 放进另一个 DOM 节点，通常是 <code>document.body</code>。'),
    code(`
import { createPortal } from 'react-dom';

function Modal({ children }) {
  return createPortal(
    <div className="modal">{children}</div>,
    document.body
  );
}`, 'createPortal 来自 react-dom，不是 react'),
    p('Portal 改变了 DOM 的位置。下面的示例里，外层 div 有一个 onClick。弹窗渲染到了 body 里。先预测，再运行。'),
    Object.assign(play(`
import { useState } from 'react';
import * as ReactDOM from 'react-dom'; // 等价于 import { createPortal } from 'react-dom'

function Modal({ children }) {
  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', right: 16, bottom: 16, zIndex: 1000,
      padding: 16, background: '#fff', border: '2px solid #e67e22',
      borderRadius: 8, boxShadow: '0 6px 24px rgba(0,0,0,.25)',
    }}>
      {children}
    </div>,
    document.body
  );
}

function App() {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={(e) => console.log('外层 div 收到点击，来自：' + e.target.textContent)}
      style={{ height: 80, overflow: 'hidden', border: '1px dashed gray', padding: 8 }}
    >
      <button onClick={() => setOpen(true)}>打开弹窗</button>
      {open && (
        <Modal>
          <p style={{ margin: '0 0 8px' }}>我在 document.body 里。</p>
          <button>点我</button>{' '}
          <button onClick={() => setOpen(false)}>关闭</button>
        </Modal>
      )}
    </div>
  );
}`, 'Portal 里的点击会冒泡到哪里？', '弹窗出现在屏幕右下角。它不受外层 div 的 overflow: hidden 影响。<br><b>关键点</b>：Portal 只改变 DOM 的位置。在 React 树里，弹窗仍然是渲染它的组件的子节点。所以它能读到上层的 Context，事件也按 React 树冒泡，外层 div 的 onClick 会收到弹窗里的点击。'), {
      predict: {
        q: '打开弹窗，再点弹窗里的“点我”。在 DOM 中，这个按钮在 body 下，不在外层 div 里。外层 div 的 onClick 会执行吗？',
        options: ['会。事件沿 React 树冒泡到外层 div', '不会。按钮在 DOM 中不在 div 里面', '不会。Portal 会自动阻止冒泡', '会，但只在捕获阶段执行'],
        answer: 0,
        explain: 'Portal 只改变 DOM 位置。在 React 树中，按钮仍是外层 div 的后代，所以 onClick 会执行。控制台会打印“来自：点我”。如果不想要这个行为，在弹窗根元素上调用 e.stopPropagation()。',
      },
      pkey: 'escape-hatches|Portal 里的点击会冒泡到哪里？',
    }),
    tip('Portal 解决的是<b>位置</b>问题，不解决<b>无障碍</b>问题。一个合格的弹窗还需要：<code>role="dialog"</code>、用 <code>aria-labelledby</code> 指向标题、按 Esc 关闭、打开时移动焦点、关闭后把焦点还给按钮。本课练习会做前三项。'),
    warn('<b>普通内容不要用 Portal。</b>它让 DOM 结构和组件结构不一致，CSS 和调试都更难。只有内容必须“跳出”父容器时才用，例如弹窗、提示框、全局通知。'),

    h('五、生成稳定的 id：useId'),
    p('<code>&lt;label htmlFor&gt;</code> 和 <code>aria-labelledby</code>、<code>aria-describedby</code> 都需要一个 id。同一个组件可能在页面上出现多次，所以 id 不能写死。'),
    p('<code>useId()</code> 为每个组件实例返回一个唯一的字符串。这个字符串在组件的整个生命周期内不变。'),
    play(`
import { useState, useId } from 'react';

function Field({ label }) {
  const id = useId();
  const randomId = 'f' + Math.random().toString(36).slice(2, 7); // 反例

  return (
    <p>
      <label htmlFor={id}>{label}</label>{' '}
      <input id={id} aria-describedby={id + '-hint'} />
      <br />
      <small id={id + '-hint'}>
        useId：<code>{id}</code>　Math.random：<code>{randomId}</code>
      </small>
    </p>
  );
}

function App() {
  const [n, setN] = useState(0);
  return (
    <div>
      <Field label="邮箱" />
      <Field label="电话" />
      <button onClick={() => setN(n + 1)}>让 App 重新渲染（{n}）</button>
    </div>
  );
}`, 'useId 与 Math.random 对比', '按下面两步观察：<ol class="task-steps"><li>点击文字“邮箱”，输入框会获得焦点。</li><li>点按钮让 App 重新渲染。useId 的值不变，Math.random 的值每次都变。</li></ol>'),
    p('为什么不用 Math.random 或自增计数器？有两个原因：'),
    p('<ol class="task-steps">'
      + '<li>Math.random 每次渲染都产生新值。id 一直在变，读屏软件和测试都难以依赖它。</li>'
      + '<li>使用服务端渲染时，服务器和浏览器各生成一次 id。两边的值不同，<b>水合</b>就会出错。useId 根据组件在树中的位置生成 id，两边结果一致。</li>'
      + '</ol>'),
    warn('<b>不要用 useId 生成列表的 key。</b>key 应该来自数据，例如数据库 id。一个组件需要多个 id 时，只调用一次 useId，再加后缀：<code>id + \'-hint\'</code>。useId 的格式（例如 <code>:r1:</code>）会随版本变化，不要解析它。'),

    h('六、立刻更新 DOM：flushSync（选读）'),
    p('React 会把 set 函数的调用攒在一起，稍后统一渲染。所以调用 set 函数后的下一行，DOM 还没变。'),
    p('<code>flushSync(fn)</code> 让 React 在 fn 执行完后<b>立刻</b>渲染并提交。下一行代码就能读到新的 DOM。'),
    code(`
import { flushSync } from 'react-dom';

function handleAdd() {
  flushSync(() => {
    setTodos([...todos, newTodo]);
  });
  // 此时新的 <li> 已经在 DOM 中
  listRef.current.lastChild.scrollIntoView({ behavior: 'smooth' });
}`, '添加一项后，立刻滚动到它'),
    warn('<b>flushSync 很少需要。</b>它会打断 React 的批量更新，可能明显降低性能。只能在事件处理函数等地方调用，不能在渲染期间或 effect 里调用。上面的例子也可以改成：在 effect 里根据 todos 的变化滚动。先考虑这种写法。'),

    h('速查：什么时候用，什么时候不用'),
    table(['API', '用来做什么', '什么时候不要用'], [
      ['<code>forwardRef</code>（18）/ ref prop（19）', '把 ref 传进自己的组件', '父组件只需要传数据时'],
      ['<code>useImperativeHandle</code>', '只暴露 focus() 等少数方法', '能用 props 表达时（例如 isOpen）'],
      ['<code>useLayoutEffect</code>', '绘制前测量布局，避免闪烁', '其他所有情况，默认用 useEffect'],
      ['<code>createPortal</code>', '弹窗、提示框跳出父容器', '普通内容；它也不会自动处理焦点'],
      ['<code>useId</code>', 'label、aria 属性的 id', '列表的 key、缓存的 key'],
      ['<code>flushSync</code>', '下一行代码必须读到新 DOM', '几乎所有情况'],
    ]),
  ],
  quiz: [
    {
      q: '提示框要先量出自己的高度，再决定显示在按钮上方还是下方。用户不能看到它跳动。测量代码应该放在哪里？',
      options: ['useLayoutEffect 里', 'useEffect 里', '组件函数体里，直接读 ref.current.offsetHeight', 'setTimeout(fn, 0) 里'],
      answer: 0,
      explain: 'useLayoutEffect 在 DOM 更新后、浏览器绘制前执行，修改不会被用户看到。useEffect 和 setTimeout 可能在绘制之后执行，会闪一下。渲染期间 DOM 还没更新（第一次渲染时 ref.current 还是 null），也不应该读 ref。',
    },
    {
      q: '<code>&lt;ThemeContext.Provider value="dark"&gt;</code> 包着 Page，Page 用 createPortal 把 Modal 渲染到 document.body。Modal 里调用 useContext(ThemeContext)，读到什么？',
      options: ['"dark"', 'createContext 的默认值，因为 DOM 不在 Provider 里', '报错：Portal 里不能用 Context', 'undefined，除非 Provider 也包住 body'],
      answer: 0,
      explain: 'Portal 只改变 DOM 位置。在 React 树中，Modal 仍在 Provider 下面，所以读到 "dark"。“读到默认值”是最常见的误解：它假设 Context 沿 DOM 树查找，其实 Context 沿 React 树查找。事件冒泡也遵循同样的规则。',
    },
    {
      q: 'Dialog 组件需要让父组件控制“打开/关闭”。哪种设计最好？',
      options: ['接收 isOpen 和 onClose 两个 prop', '用 useImperativeHandle 暴露 open() 和 close()', '用 forwardRef 把弹窗的 DOM 交给父组件，父组件改 style.display', '用 flushSync 包住打开弹窗的 set 函数'],
      answer: 0,
      explain: '能用 props 表达的状态，就用 props。这样父组件的 state 就是唯一数据源。最有迷惑性的是 useImperativeHandle 暴露 open()：它能工作，但“开着还是关着”就藏在 Dialog 内部，父组件不知道，也不能和其他 state 联动。useImperativeHandle 只适合聚焦、滚动这类命令式操作。直接改 DOM 会让 React 的 state 和页面不一致。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps">'
      + '<li>在 <code>Modal</code> 中调用 <code>useId()</code>，得到标题的 id。</li>'
      + '<li>把这个 id 设为 <code>&lt;h2&gt;</code> 的 <code>id</code>，并设为对话框的 <code>aria-labelledby</code>。</li>'
      + '<li>用 <code>ReactDOM.createPortal(…, document.body)</code> 把弹窗渲染到 body。</li>'
      + '<li>用 <code>useEffect</code> 在 document 上监听 <code>keydown</code>。按 <b>Escape</b> 时调用 <code>onClose</code>。按其他键时不关闭。</li>'
      + '<li>在 effect 的清理函数中移除监听。</li>'
      + '</ol>',
    starter: `import { useState, useEffect, useId } from 'react';
import * as ReactDOM from 'react-dom';

const backdrop = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'grid', placeItems: 'center', zIndex: 1000 };
const panel = { background: '#fff', color: '#222', padding: 20, borderRadius: 8, minWidth: 240 };

function Modal({ title, onClose, children }) {
  // 在这里完成第 1、4、5 步

  // 第 3 步：把下面的 JSX 渲染到 document.body
  return (
    <div style={backdrop}>
      <div role="dialog" aria-modal="true" style={panel}>
        <h2>{title}</h2>
        {children}
        <button onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}

function App() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>打开弹窗</button>
      {open && (
        <Modal title="删除文件？" onClose={() => setOpen(false)}>
          <p>此操作无法撤销。按 Esc 也可以关闭。</p>
        </Modal>
      )}
    </div>
  );
}`,
    solution: `import { useState, useEffect, useId } from 'react';
import * as ReactDOM from 'react-dom';

const backdrop = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'grid', placeItems: 'center', zIndex: 1000 };
const panel = { background: '#fff', color: '#222', padding: 20, borderRadius: 8, minWidth: 240 };

function Modal({ title, onClose, children }) {
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div style={backdrop}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} style={panel}>
        <h2 id={titleId}>{title}</h2>
        {children}
        <button onClick={onClose}>关闭</button>
      </div>
    </div>,
    document.body
  );
}

function App() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>打开弹窗</button>
      {open && (
        <Modal title="删除文件？" onClose={() => setOpen(false)}>
          <p>此操作无法撤销。按 Esc 也可以关闭。</p>
        </Modal>
      )}
    </div>
  );
}`,
    exports: ['Modal'],
    hint: '回看第四节的 createPortal 示例：它包住的是什么，第二个参数是什么？Esc 的监听和上一课 useWindowWidth 里的 effect 结构相同：添加监听，返回清理函数。',
    faded: `import { useState, useEffect, useId } from 'react';
import * as ReactDOM from 'react-dom';

const backdrop = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'grid', placeItems: 'center', zIndex: 1000 };
const panel = { background: '#fff', color: '#222', padding: 20, borderRadius: 8, minWidth: 240 };

function Modal({ title, onClose, children }) {
  /* ✏️ 用 useId 生成标题的 id */

  useEffect(() => {
    function onKeyDown(e) {
      /* ✏️ 按下的是 Escape 时，调用 onClose */
    }
    document.addEventListener('keydown', onKeyDown);
    /* ✏️ 返回清理函数：移除同一个 onKeyDown */
  }, [onClose]);

  return (
    /* ✏️ 不要直接返回下面的 JSX：把它交给 ReactDOM.createPortal，第二个参数是渲染的目标节点 */
    <div style={backdrop}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} style={panel}>
        <h2 id={titleId}>{title}</h2>
        {children}
        <button onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}

function App() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>打开弹窗</button>
      {open && (
        <Modal title="删除文件？" onClose={() => setOpen(false)}>
          <p>此操作无法撤销。按 Esc 也可以关闭。</p>
        </Modal>
      )}
    </div>
  );
}`,
    test: async (t) => {
      // 记录检查期间在 document 和 window 上添加、移除的 keydown 监听，用来确认清理函数真的移除了监听
      const live = new Set();
      const origAdd = EventTarget.prototype.addEventListener, origRemove = EventTarget.prototype.removeEventListener;
      const tracked = (target) => target === document || target === window;
      EventTarget.prototype.addEventListener = function (type, fn, opt) {
        if (type === 'keydown' && tracked(this)) live.add(fn);
        return origAdd.call(this, type, fn, opt);
      };
      EventTarget.prototype.removeEventListener = function (type, fn, opt) {
        if (type === 'keydown' && tracked(this)) live.delete(fn);
        return origRemove.call(this, type, fn, opt);
      };
      try {
      const src = t.source;
      t.assert(/\buseId\s*\(/.test(src), '请调用 useId() 生成标题的 id');
      t.assert(!/Math\.random|Date\.now/.test(src), '不要用 Math.random 或 Date.now 生成 id。请用 useId()');
      t.assert(/createPortal\s*\(/.test(src), '请用 ReactDOM.createPortal 把弹窗渲染到 document.body');
      const dialogs = () => Array.from(document.querySelectorAll('[role="dialog"]'));
      const before = new Set(dialogs());
      const fresh = () => dialogs().filter(d => !before.has(d));
      const key = async (k) => {
        const target = document.activeElement || document.body;
        target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
        await t.wait(80);
      };
      t.assert(fresh().length === 0 && !t.q('[role="dialog"]'), '页面刚加载时，弹窗不应该出现');
      const openBtn = t.byText('button', '打开弹窗');
      t.assert(openBtn, '找不到“打开弹窗”按钮');

      await t.click(openBtn); await t.wait(40);
      const err = t.q('.pv-err');
      if (err) {
        const notDef = /createPortal is not defined/.test(err.textContent);
        t.assert(false, err.textContent + (notDef ? '。createPortal 来自 react-dom。两种写法都可以：import * as ReactDOM from \'react-dom\' 再写 ReactDOM.createPortal(…)；或 import { createPortal } from \'react-dom\' 再写 createPortal(…)' : ''));
      }
      const d = fresh()[0];
      t.assert(d, '点击“打开弹窗”后，找不到 role="dialog" 的元素');
      t.assert(!t.root.contains(d), '弹窗还渲染在组件原来的位置。请用 createPortal 渲染到 document.body');
      t.assert(!d.closest('.shell, .pg, header'), '弹窗应该渲染到 document.body，而不是页面里的其他容器');
      const labelId = d.getAttribute('aria-labelledby');
      t.assert(labelId, '对话框缺少 aria-labelledby 属性');
      const titleEl = document.getElementById(labelId);
      t.assert(titleEl && d.contains(titleEl), 'aria-labelledby 要指向弹窗里标题元素的 id');
      t.assert(titleEl.textContent.trim().length > 0, '标题元素不能为空');

      await key('a');
      t.assert(d.isConnected, '按下其他键（例如 a）时，弹窗不应该关闭。只在按 Escape 时关闭');
      await key('Escape');
      t.assert(!d.isConnected && fresh().length === 0, '按 Escape 后弹窗没有关闭。请在 document 上监听 keydown');
      t.assert(live.size === 0, '弹窗已经关闭，但 document 上还留着 ' + live.size + ' 个 keydown 监听。effect 的清理函数要用 removeEventListener 移除同一个函数。每次写一个新的箭头函数，就移除不掉（步骤 5）');

      await t.click(openBtn); await t.wait(40);
      const d2 = fresh()[0];
      t.assert(d2, '第二次点击“打开弹窗”后，弹窗没有出现');
      const closeBtn = Array.from(d2.querySelectorAll('button')).find(b => b.textContent.trim() === '关闭');
      t.assert(closeBtn, '弹窗里找不到“关闭”按钮');
      closeBtn.click(); await t.wait(80);
      t.assert(!d2.isConnected, '点击“关闭”后弹窗没有关闭');
      await key('Escape');
      t.assert(fresh().length === 0, '弹窗关闭后，按 Escape 不应该让它再出现');
      t.assert(live.size === 0, '点“关闭”后，document 上还留着 ' + live.size + ' 个 keydown 监听。effect 的清理函数要移除监听（步骤 5）');

      // useId 的意义：同一个组件出现多次，id 也不重复。同时渲染两个 Modal 检查
      const Modal = t.exports.Modal;
      t.assert(typeof Modal === 'function', '请保留名为 Modal 的组件');
      const box = document.createElement('div');
      const root = ReactDOM.createRoot(box);
      try {
        const noop = () => {};
        ReactDOM.flushSync(() => root.render(React.createElement('div', null,
          React.createElement(Modal, { title: '弹窗甲', onClose: noop }),
          React.createElement(Modal, { title: '弹窗乙', onClose: noop }))));
        const two = fresh();
        t.assert(two.length === 2, '同时渲染两个 Modal 时，应出现 2 个 role="dialog"，实际 ' + two.length + ' 个');
        const ids = two.map(x => x.getAttribute('aria-labelledby'));
        t.assert(ids[0] && ids[1] && ids[0] !== ids[1],
          '同时渲染两个 Modal 时，它们的 aria-labelledby 都是 "' + ids[0] + '"。id 写死了，页面上就有两个相同的 id。请把 useId() 的返回值用作标题的 id（步骤 1、2）');
        two.forEach((x, i) => {
          const ttl = x.querySelector('[id="' + ids[i] + '"]');
          t.assert(ttl && ttl.textContent.includes(i ? '弹窗乙' : '弹窗甲'), '每个弹窗的 aria-labelledby 应指向它自己的标题。第 ' + (i + 1) + ' 个弹窗没有对上（步骤 2）');
        });
      } finally { root.unmount(); }
      } finally {
        EventTarget.prototype.addEventListener = origAdd;
        EventTarget.prototype.removeEventListener = origRemove;
      }
    }
  }
});
