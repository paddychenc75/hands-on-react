import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/escape-hatches.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'escape-hatches',
  stage: 1,
  title: 'DOM 逃生舱：Portal、useLayoutEffect 与 useId',
  mins: 35,
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
  quiz: [
    {
      q: '提示框要先量出自己的高度，再决定显示在按钮上方还是下方。用户不能看到它跳动。测量代码应该放在哪里？',
      options: [
        'useLayoutEffect 里',
        'useEffect 里',
        '组件函数体里，直接读 ref.current.offsetHeight',
        'setTimeout(fn, 0) 里',
      ],
      answer: 0,
      explain: 'useLayoutEffect 在 DOM 更新后、浏览器绘制前执行，修改不会被用户看到。useEffect 和 setTimeout 可能在绘制之后执行，会闪一下。渲染期间 DOM 还没更新（第一次渲染时 ref.current 还是 null），也不应该读 ref。',
    },
    {
      q: '<code>&lt;ThemeContext.Provider value="dark"&gt;</code> 包着 Page，Page 用 createPortal 把 Modal 渲染到 document.body。Modal 里调用 useContext(ThemeContext)，读到什么？',
      options: [
        '"dark"',
        'createContext 的默认值，因为 DOM 不在 Provider 里',
        '报错：Portal 里不能用 Context',
        'undefined，除非 Provider 也包住 body',
      ],
      answer: 0,
      explain: 'Portal 只改变 DOM 位置。在 React 树中，Modal 仍在 Provider 下面，所以读到 "dark"。“读到默认值”是最常见的误解：它假设 Context 沿 DOM 树查找，其实 Context 沿 React 树查找。事件冒泡也遵循同样的规则。',
    },
    {
      q: 'Dialog 组件需要让父组件控制“打开/关闭”。哪种设计最好？',
      options: [
        '接收 isOpen 和 onClose 两个 prop',
        '用 useImperativeHandle 暴露 open() 和 close()',
        '用 forwardRef 把弹窗的 DOM 交给父组件，父组件改 style.display',
        '用 flushSync 包住打开弹窗的 set 函数',
      ],
      answer: 0,
      explain: '能用 props 表达的状态，就用 props。这样父组件的 state 就是唯一数据源。最有迷惑性的是 useImperativeHandle 暴露 open()：它能工作，但“开着还是关着”就藏在 Dialog 内部，父组件不知道，也不能和其他 state 联动。useImperativeHandle 只适合聚焦、滚动这类命令式操作。直接改 DOM 会让 React 的 state 和页面不一致。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>在 <code>Modal</code> 中调用 <code>useId()</code>，得到标题的 id。</li><li>把这个 id 设为 <code>&lt;h2&gt;</code> 的 <code>id</code>，并设为对话框的 <code>aria-labelledby</code>。</li><li>用 <code>ReactDOM.createPortal(…, document.body)</code> 把弹窗渲染到 body。</li><li>用 <code>useEffect</code> 在 document 上监听 <code>keydown</code>。按 <b>Escape</b> 时调用 <code>onClose</code>。按其他键时不关闭。</li><li>在 effect 的清理函数中移除监听。</li></ol>',
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
    },
  },
  checkOnly: [
    {
      q: `父组件写 <code>&lt;MyInput ref={inputRef} label="邮箱" /&gt;</code>，然后在 effect 中调用 <code>inputRef.current.focus()</code>。结果是？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function MyInput({ label }) {
  return &lt;input aria-label={label} /&gt;;
}</code></pre></div>`,
      options: [
        '输入框获得焦点',
        'inputRef.current 是 null，调用 focus 时报错',
        'inputRef.current 是 MyInput 组件对象',
        'focus 被调用，但没有效果',
      ],
      answer: 1,
      explain: 'ref 没有被交给 <code>&lt;input&gt;</code>。在 React 18 中，函数组件收不到 ref，要用 forwardRef 转发。在 React 19 中，ref 是普通 prop，但这里没有用到它。两种情况下 inputRef.current 都是 null。修复：把 ref 传给 <code>&lt;input ref={ref} /&gt;</code>。',
    },
    {
      q: `点击“确定”按钮，控制台会打印“外层”吗？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;div onClick={() =&gt; console.log('外层')}&gt;
  {createPortal(
    &lt;button&gt;确定&lt;/button&gt;,
    document.body
  )}
&lt;/div&gt;</code></pre></div>`,
      options: ['不会：按钮在 DOM 上不在这个 div 里', '会打印两次', '会：按 React 树冒泡', '报错：Portal 里的元素不能触发事件'],
      answer: 2,
      explain: 'Portal 只改变 DOM 节点放在哪里。在 React 树中，按钮仍是这个 div 的子元素。React 的事件按 React 树冒泡，所以 div 的 onClick 会执行。这和 Context 能穿过 Portal 是同一个道理。“不会”是按 DOM 结构推理的结果，原生 <code>addEventListener</code> 确实是这样，但 React 的 onClick 不是。不想让弹窗里的点击影响外层时，在 Portal 内部调用 <code>e.stopPropagation()</code>。',
    },
  ],
  plays: {
    '只暴露 focus() 和 clear()': {
      note: '点第三个按钮，看控制台。父组件只能看到两个方法，看不到 DOM 节点。',
    },
    '提示框会不会闪一下？': {
      note: '把鼠标移到两个按钮上。左边先出现红色的错误位置，再跳到上方。右边稍等一下，直接出现在正确位置。手机上可以轻点按钮。',
    },
    'Portal 里的点击会冒泡到哪里？': {
      note: '弹窗出现在屏幕右下角。它不受外层 div 的 overflow: hidden 影响。<br><b>关键点</b>：Portal 只改变 DOM 的位置。在 React 树里，弹窗仍然是渲染它的组件的子节点。所以它能读到上层的 Context，事件也按 React 树冒泡，外层 div 的 onClick 会收到弹窗里的点击。',
      predict: {
        q: '打开弹窗，再点弹窗里的“点我”。在 DOM 中，这个按钮在 body 下，不在外层 div 里。外层 div 的 onClick 会执行吗？',
        options: ['会。事件沿 React 树冒泡到外层 div', '不会。按钮在 DOM 中不在 div 里面', '不会。Portal 会自动阻止冒泡', '会，但只在捕获阶段执行'],
        answer: 0,
        explain: 'Portal 只改变 DOM 位置。在 React 树中，按钮仍是外层 div 的后代，所以 onClick 会执行。控制台会打印“来自：点我”。如果不想要这个行为，在弹窗根元素上调用 e.stopPropagation()。',
      },
      pkey: 'escape-hatches|Portal 里的点击会冒泡到哪里？',
    },
    'useId 与 Math.random 对比': {
      note: '按下面两步观察：<ol class="task-steps"><li>点击文字“邮箱”，输入框会获得焦点。</li><li>点按钮让 App 重新渲染。useId 的值不变，Math.random 的值每次都变。</li></ol>',
    },
  },
} satisfies Lesson;
