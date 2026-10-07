/* ========== 应用逻辑 ========== */
const STAGES = [
  { no: '01', name: '入门', en: 'Foundations', desc: 'JSX、组件、Props、State、事件、列表和表单，最后做一个完整的待办应用。' },
  { no: '02', name: '进阶', en: 'Hooks in depth', desc: '状态提升、useReducer、Context、useRef、useEffect、自定义 Hook 与 DOM 逃生舱，再用异步搜索和看板两个项目练手。' },
  { no: '03', name: '高级', en: 'Under the hood', desc: '渲染机制、性能优化、闭包陷阱、Suspense、并发特性与性能测量，知其然更知其所以然。' },
  { no: '04', name: '原理与架构', en: 'Architecture', desc: '设计模式、无障碍、状态架构、React 19、Server Components 与安全，并亲手实现迷你 React。' },
  { no: '05', name: '生态与实战', en: 'Ecosystem & projects', desc: 'TypeScript、React Router、TanStack Query、测试与 Next.js：把 React 放进真实项目的工具链。' },
  { no: '06', name: '专家', en: 'Expert', desc: '调度与并发内核、Suspense 数据获取、流式渲染与水合、大型状态架构、组件库 API、表单架构、错误监控与性能诊断，最后用毕业设计做出自己的作品集。' },
];
const HOOK_NAMES = ['useState', 'useEffect', 'useLayoutEffect', 'useRef', 'useMemo', 'useCallback', 'useContext', 'useReducer', 'useId', 'useTransition', 'useDeferredValue', 'useSyncExternalStore', 'useImperativeHandle', 'useInsertionEffect', 'useDebugValue', 'createContext', 'createElement', 'memo', 'lazy', 'Suspense', 'Component', 'PureComponent', 'Fragment', 'forwardRef', 'startTransition', 'createRef', 'Children', 'cloneElement', 'isValidElement', 'StrictMode', 'Profiler'];

/* ---------- 进度存储（仅保存在本浏览器） ---------- */
const STORE_KEY = 'react-zero-to-expert-v1';
let progress = {};
try { progress = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch (e) { progress = {}; }
const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) {} };
const lp = (id) => (progress[id] = progress[id] || { quiz: {}, ex: false, done: false });
const isDone = (id) => !!(progress[id] && progress[id].done);

/* ---------- 工具 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function el(tag, attrs = {}, html) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function highlight(src) {
  try { return Prism.highlight(src, Prism.languages.jsx, 'jsx'); } catch (e) { return esc(src); }
}
// 提示条。可以带一个操作按钮，例如“撤销”
function toast(msg, ms = 2200, actionLabel, onAction) {
  const t = $('#toast'); t.textContent = msg;
  if (actionLabel) {
    const b = el('button', { class: 'toast-act', type: 'button' }, esc(actionLabel));
    b.addEventListener('click', () => { hide(); onAction(); });
    t.appendChild(b);
  }
  t.classList.add('show'); t.classList.toggle('has-act', !!actionLabel);
  function hide() { t.classList.remove('show', 'has-act'); }
  clearTimeout(toast._t); toast._t = setTimeout(hide, ms);
}
const smooth = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

/* ---------- 代码执行引擎 ---------- */
let activeRunner = null; // 最近交互的实验台，用于接收异步错误

function formatArg(a) {
  if (typeof a === 'string') return a;
  if (a instanceof Error) return a.name + ': ' + a.message;
  if (typeof a === 'function') return 'ƒ ' + (a.name || 'anonymous') + '()';
  if (a && a.nodeType) return '<' + (a.nodeName || 'node').toLowerCase() + '>';
  try { return JSON.stringify(a, (k, v) => (v && v.$$typeof ? '[React 元素]' : v), 2); } catch (e) { return String(a); }
}

function prepare(source, exportNames) {
  const imported = new Set();
  const fromDom = new Set();
  let code = source.replace(/^\s*import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?/gm, (m, what, from) => {
    if (from === 'react' || from === 'react-dom' || from === 'react-dom/client') {
      const braces = what.match(/\{([\s\S]*)\}/);
      if (braces) braces[1].split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
        const [orig, alias] = s.split(/\s+as\s+/).map(x => x.trim());
        imported.add(alias ? orig + ': ' + alias : orig);
        if (from !== 'react') fromDom.add(alias ? orig + ': ' + alias : orig);
      });
    }
    return '';
  }).replace(/^\s*import\s+['"][^'"]+['"];?/gm, '')
    .replace(/^\s*export\s+default\s+(?=function|class)/gm, '')
    .replace(/^\s*export\s+(?=function|const|let|class)/gm, '');
  const compiled = Babel.transform(code, { presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]], sourceType: 'script', filename: 'App.jsx' }).code;
  const names = [...imported];
  const reactNames = names.filter(n => HOOK_NAMES.includes(n.split(':')[0].trim()));
  // react-dom 的具名导入（createPortal、flushSync 等）从 ReactDOM 取
  const domNames = names.filter(n => fromDom.has(n) && !HOOK_NAMES.includes(n.split(':')[0].trim()) && n.split(':')[0].trim() in ReactDOM);
  const head = (reactNames.length ? 'const { ' + reactNames.join(', ') + ' } = React;\n' : '')
    + (domNames.length ? 'const { ' + domNames.join(', ') + ' } = ReactDOM;\n' : '');
  const ex = (exportNames || []).map(n => JSON.stringify(n) + ': typeof ' + n + " !== 'undefined' ? " + n + ' : undefined').join(', ');
  return head + compiled + "\n;return { App: typeof App !== 'undefined' ? App : undefined, exports: { " + ex + ' } };';
}

function makeBoundary(onError) {
  return class Boundary extends React.Component {
    constructor(p) { super(p); this.state = { error: null }; }
    static getDerivedStateFromError(error) { return { error }; }
    componentDidCatch(error) { onError(error); }
    render() {
      if (this.state.error) return React.createElement('div', { className: 'pv-err' }, '渲染出错：' + this.state.error.message);
      return this.props.children;
    }
  };
}

function explainError(err) {
  let msg = (err && err.message) || String(err);
  const m = msg.match(/^(\w+) is not defined/);
  if (m && HOOK_NAMES.includes(m[1])) msg += `\n提示：是否忘了 import { ${m[1]} } from 'react'？`;
  if (/Unexpected token|Unterminated|Expected corresponding JSX closing tag|Adjacent JSX/.test(msg)) msg = '语法错误：' + msg;
  return msg;
}

class Runner {
  constructor(mount, consoleEl) {
    this.mount = mount; this.consoleEl = consoleEl; this.root = null; this.timers = new Set(); this.gen = 0;
    const touch = () => { activeRunner = this; };
    mount.addEventListener('pointerdown', touch, true);
    mount.addEventListener('focusin', touch, true);
    mount.addEventListener('submit', (e) => e.preventDefault()); // 没写 onSubmit 的表单也不会刷新页面
  }
  log(kind, args) {
    const line = el('div', { class: kind === 'error' ? 'err' : kind === 'warn' ? 'warn' : '' });
    line.textContent = args.map(formatArg).join(' ');
    this.consoleEl.appendChild(line);
    while (this.consoleEl.children.length > 80) this.consoleEl.firstChild.remove();
    this.consoleEl.scrollTop = this.consoleEl.scrollHeight;
  }
  clearTimers() {
    this.timers.forEach(t => { clearTimeout(t); clearInterval(t); });
    this.timers.clear();
  }
  unmount() {
    this.gen++;
    this.clearTimers();
    if (this.root) { try { this.root.unmount(); } catch (e) {} this.root = null; }
    this.mount.innerHTML = '';
  }
  run(source, exportNames) {
    this.unmount();
    this.consoleEl.innerHTML = '';
    const gen = this.gen;
    const self = this;
    const fakeConsole = {
      log: (...a) => self.log('log', a), info: (...a) => self.log('log', a),
      warn: (...a) => self.log('warn', a), error: (...a) => self.log('error', a),
      table: (...a) => self.log('log', a), clear: () => { self.consoleEl.innerHTML = ''; },
    };
    const wrapTimer = (fn) => (cb, ms, ...rest) => {
      const id = fn(function () { if (gen === self.gen) { try { cb.apply(this, arguments); } catch (e) { self.log('error', ['运行时错误：' + explainError(e)]); } } }, ms, ...rest);
      self.timers.add(id); return id;
    };
    const sandbox = {
      React, ReactDOM, console: fakeConsole,
      setTimeout: wrapTimer(window.setTimeout.bind(window)),
      setInterval: wrapTimer(window.setInterval.bind(window)),
      clearTimeout: (id) => { self.timers.delete(id); clearTimeout(id); },
      clearInterval: (id) => { self.timers.delete(id); clearInterval(id); },
      alert: (m) => fakeConsole.warn('[alert] ' + m),
    };
    let result;
    try {
      const body = prepare(source, exportNames);
      const fn = compile(Object.keys(sandbox), body);
      result = fn(...Object.values(sandbox));
    } catch (e) {
      this.mount.innerHTML = '<div class="pv-err">' + esc(explainError(e)) + '</div>';
      return { error: e };
    }
    if (result && typeof result.App === 'function') {
      const Boundary = makeBoundary((err) => self.log('error', ['渲染出错：' + explainError(err)]));
      this.root = ReactDOM.createRoot(this.mount);
      this.root.render(React.createElement(Boundary, null, React.createElement(result.App)));
    } else {
      this.mount.innerHTML = '<div class="pv-empty">这段代码没有定义 App 组件，运行结果请看下方控制台。</div>';
    }
    return result || {};
  }
}

// 优先使用 new Function；若环境禁止 eval，则退回到注入 <script> 的方式
let evalAllowed = null;
function compile(params, body) {
  if (evalAllowed !== false) {
    try { const f = new Function(...params, body); evalAllowed = true; return f; }
    catch (e) { if (e instanceof SyntaxError) throw e; evalAllowed = false; }
  }
  const key = '__pg' + Math.random().toString(36).slice(2);
  const s = document.createElement('script');
  s.textContent = 'window.' + key + ' = function(' + params.join(',') + '){' + body + '\n};';
  document.head.appendChild(s); s.remove();
  const f = window[key]; delete window[key];
  if (!f) throw new Error('代码无法执行（可能存在语法错误）');
  return f;
}

// React 开发版会把渲染中抛出的错误先报给 window，即使错误边界随后接住了它。
// 所以先暂存，稍后再显示；如果 React 说“错误边界已处理”，就丢弃。
const pendingErrors = new Set();
window.addEventListener('error', (e) => {
  if (!activeRunner || !e.error) return;
  // 不调用 preventDefault：否则 React 开发版不再打印“错误边界已处理”的提示，我们就无法区分
  const item = { runner: activeRunner, error: e.error };
  pendingErrors.add(item);
  setTimeout(() => { if (pendingErrors.delete(item)) item.runner.log('error', ['运行时错误：' + explainError(item.error)]); }, 0);
});
// 把 React 开发版的警告（缺少 key、受控输入框没有 onChange 等）显示到实验台的控制台
const nativeConsoleError = console.error.bind(console);
console.error = (...a) => {
  nativeConsoleError(...a);
  if (typeof a[0] === 'string' && /The above error occurred/.test(a[0]) && /error boundary you provided/.test(a.join(' '))) pendingErrors.clear();
  if (!activeRunner || typeof a[0] !== 'string' || !a[0].startsWith('Warning:')) return;
  let i = 1;
  const msg = a[0].replace(/%s/g, () => String(a[i++] ?? '')).replace(/^Warning: /, '').split('\n')[0].trim();
  const zh = /unique "key" prop/.test(msg) ? '列表中的每个元素都需要唯一的 key。'
    : /`value` prop to a form field without an `onChange`/.test(msg) ? '输入框有 value 但没有 onChange，所以它是只读的。'
    : /Cannot update a component .* while rendering a different component/.test(msg) ? '不要在渲染期间更新另一个组件的 state。'
    : '';
  activeRunner.log('warn', ['React 警告：' + (zh ? zh + '（' + msg + '）' : msg)]);
};
window.addEventListener('unhandledrejection', (e) => {
  if (activeRunner) { activeRunner.log('error', ['未处理的 Promise 错误：' + explainError(e.reason)]); e.preventDefault(); }
});

/* ---------- 代码编辑器（textarea 叠加高亮层） ---------- */
function makeEditor(initial, onChange) {
  const wrap = el('div', { class: 'editor' });
  const pre = el('pre', { 'aria-hidden': 'true' });
  const ta = el('textarea', { spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', 'aria-label': '代码编辑器', id: 'ed-' + Math.random().toString(36).slice(2, 9) });
  ta.value = initial;
  wrap.append(pre, ta);
  const paint = () => { pre.innerHTML = highlight(ta.value) + (ta.value.endsWith('\n') ? ' ' : '') + '\n'; };
  paint();
  ta.addEventListener('input', () => { paint(); onChange && onChange(ta.value); });
  // 按 Esc 后，Tab 不再缩进，而是把焦点移出编辑器（键盘用户不会被困住）
  let tabEscapes = false;
  ta.addEventListener('focus', () => { tabEscapes = false; });
  ta.addEventListener('keydown', (e) => {
    const v = ta.value, s = ta.selectionStart, en = ta.selectionEnd;
    const lineStart = v.lastIndexOf('\n', s - 1) + 1;
    if (e.key === 'Escape') { tabEscapes = true; return; }
    if (e.key === 'Tab' && !tabEscapes && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      if (s === en && !e.shiftKey) return insert('  ');
      // 多行缩进或 Shift+Tab 反缩进：整块替换选中的行
      const endLine = v.indexOf('\n', en - (en > s && v[en - 1] === '\n' ? 1 : 0));
      const blockEnd = endLine < 0 ? v.length : endLine;
      const block = v.slice(lineStart, blockEnd);
      const next = e.shiftKey ? block.replace(/^ {1,2}/gm, '') : block.replace(/^/gm, '  ');
      ta.setSelectionRange(lineStart, blockEnd);
      insert(next);
      ta.setSelectionRange(lineStart, lineStart + next.length);
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.isComposing) {
      const line = v.slice(lineStart, s);
      let indent = line.match(/^\s*/)[0];
      const opens = /[{(\[]\s*$/.test(line) || /<[A-Za-z][^>]*[^/]>\s*$/.test(line);
      if (opens) indent += '  ';
      e.preventDefault();
      // 光标在一对括号或标签之间：闭合部分放到下一行
      if (opens && /^\s*([}\])]|<\/)/.test(v.slice(en))) {
        insert('\n' + indent + '\n' + indent.slice(2));
        const pos = ta.selectionStart - indent.length + 2 - 1;
        ta.setSelectionRange(pos, pos);
      } else insert('\n' + indent);
    } else if (/^[}\])]$/.test(e.key) && s === en && /^\s+$/.test(v.slice(lineStart, s)) && v.slice(lineStart, s).length >= 2) {
      // 在空行里输入闭合括号：自动减少一级缩进
      e.preventDefault();
      ta.setSelectionRange(s - 2, s);
      insert(e.key);
    } else if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
      // Ctrl/⌘ + /：注释或取消注释选中的行
      e.preventDefault();
      const endLine = v.indexOf('\n', en);
      const blockEnd = endLine < 0 ? v.length : endLine;
      const lines = v.slice(lineStart, blockEnd).split('\n');
      const all = lines.every(l => !l.trim() || /^\s*\/\//.test(l));
      const next = lines.map(l => !l.trim() ? l : all ? l.replace(/^(\s*)\/\/ ?/, '$1') : l.replace(/^(\s*)/, '$1// ')).join('\n');
      ta.setSelectionRange(lineStart, blockEnd);
      insert(next);
      ta.setSelectionRange(lineStart, lineStart + next.length);
    }
  });
  function insert(text) {
    // execCommand 会进入浏览器的撤销栈，Ctrl/⌘ + Z 可以撤销；不支持时退回 setRangeText
    ta.focus();
    let ok = false;
    try { ok = document.execCommand('insertText', false, text); } catch (err) { ok = false; }
    if (!ok) {
      ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input'));
    }
  }
  return { el: wrap, get value() { return ta.value; }, set value(v) { ta.value = v; paint(); }, ta };
}

/* ---------- 实验台 ---------- */
function makePlayground({ src, title, note, badge = 'LIVE', exercise, lessonId, predict, predictKey }) {
  const box = el('div', { class: 'pg wide' });
  const head = el('div', { class: 'pg-head' });
  head.appendChild(el('div', { class: 'pg-title' }, `<span class="pg-badge${exercise ? ' ex' : predict ? ' pr' : ''}">${predict ? 'PREDICT' : badge}</span><span>${esc(title || '动手试试')}</span>`));
  const runBtn = el('button', { class: 'btn small primary', type: 'button' }, '▶ 运行');
  const resetBtn = el('button', { class: 'btn small', type: 'button' }, '重置');
  head.append(resetBtn, runBtn);

  const preds = progress.__pred = progress.__pred || {};
  let revealed = !predict || preds[predictKey] !== undefined;

  const body = el('div', { class: 'pg-body' });
  let timer;
  const savedCode = exercise && lessonId && progress[lessonId] && progress[lessonId].code;
  const editor = makeEditor(savedCode || src, (v) => {
    if (exercise && lessonId) { lp(lessonId).code = v; save(); }
    if (!revealed) return;
    clearTimeout(timer); timer = setTimeout(run, 800);
  });
  const pvWrap = el('div', { class: 'preview-wrap' });
  pvWrap.appendChild(el('div', { class: 'preview-bar' }, '<i></i><i></i><i></i><span>预览</span>'));
  const mount = el('div', { class: 'preview' });
  pvWrap.appendChild(mount);
  body.append(editor.el, pvWrap);
  const cons = el('div', { class: 'console', 'aria-live': 'polite' });
  box.append(head, body, cons);
  const verdict = el('div', { class: 'predict-result' }); verdict.hidden = true;
  if (predict) box.appendChild(verdict);
  // 说明里常常有答案，所以预测之前先藏起来
  const noteEl = note ? el('div', { class: 'pg-note' }, note) : null;
  if (noteEl) { noteEl.hidden = !revealed; box.appendChild(noteEl); }

  const runner = new Runner(mount, cons);
  function run() {
    if (!revealed) return {};
    clearTimeout(timer); activeRunner = runner; box._ran = true;
    return runner.run(editor.value, exercise && exercise.exports);
  }
  function showVerdict() {
    const chosen = preds[predictKey];
    const ok = chosen === predict.answer;
    verdict.className = 'predict-result ' + (ok ? 'ok' : 'no');
    verdict.innerHTML = `<b>${ok ? '✓ 预测正确。' : '✗ 和你预测的不一样。'}</b>你的预测是“${fmtOpt(predict.options[chosen])}”，实际结果是“${fmtOpt(predict.options[predict.answer])}”。${predict.explain}`;
    verdict.hidden = false;
  }

  if (!revealed) {
    // 先预测再运行：预览区先换成一道预测题
    mount.hidden = true; runBtn.disabled = true;
    const card = el('div', { class: 'predict' });
    card.innerHTML = `<span class="lbl">先预测，再运行</span><p>${predict.q}</p>`;
    const opts = el('div', { class: 'opts' });
    // 选项顺序按题目固定打乱，避免正确答案总在同一个位置
    const rnd = seeded(predictKey);
    const order = predict.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    order.forEach((oi, pos) => {
      const o = predict.options[oi];
      const b = el('button', { class: 'opt', type: 'button' }, `<span class="ol">${'ABCD'[pos]}</span><span>${fmtOpt(o)}</span>`);
      b.addEventListener('click', () => {
        preds[predictKey] = oi; save();
        opts.querySelectorAll('.opt').forEach(x => { x.disabled = true; x.classList.toggle('picked', x === b); });
        const go = el('button', { class: 'btn primary', type: 'button' }, '▶ 运行，验证我的预测');
        go.addEventListener('click', () => { revealed = true; card.remove(); mount.hidden = false; runBtn.disabled = false; if (noteEl) noteEl.hidden = false; run(); showVerdict(); verdict.scrollIntoView({ block: 'nearest', behavior: smooth() }); });
        card.appendChild(go); go.focus();
      });
      opts.appendChild(b);
    });
    card.appendChild(opts);
    card.appendChild(el('small', {}, '先读代码，在脑子里“运行”一遍。猜错也没关系：猜错之后看到的答案，记得最牢。'));
    pvWrap.appendChild(card);
  } else if (predict) showVerdict();

  runBtn.addEventListener('click', run);
  resetBtn.addEventListener('click', () => {
    const before = editor.value;
    if (before === src) return;
    editor.value = src;
    // 看过答案后点重置，表示要自己重写一遍：之后写出和答案相同的代码也可以通过
    const wasRewrite = exercise && lessonId && lp(lessonId).rewrite;
    if (exercise && lessonId) { const q = lp(lessonId); delete q.code; if (q.sawSol) q.rewrite = true; save(); }
    run();
    toast('代码已恢复成初始版本。', 6000, '撤销', () => {
      editor.value = before;
      if (exercise && lessonId) { const q = lp(lessonId); q.code = before; q.rewrite = wasRewrite; save(); }
      run();
    });
  });
  editor.ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); } });
  box._run = run; box._editor = editor; box._runner = runner; box._mount = mount;
  box._ran = false;
  livePlaygrounds.push(box);
  if (pgObserver) pgObserver.observe(box);
  return box;
}
let livePlaygrounds = [];
// 实验台进入视野附近才第一次运行，长课打开更快
const pgObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach(en => { if (en.isIntersecting) { pgObserver.unobserve(en.target); if (!en.target._ran) en.target._run(); } });
}, { rootMargin: '400px 0px' }) : null;
function disposePlaygrounds() { if (pgObserver) pgObserver.disconnect(); livePlaygrounds.forEach(b => b._runner.unmount()); livePlaygrounds = []; activeRunner = null; }

/* ---------- 练习检查器 ---------- */
class TestFail extends Error {}
// 检查代码时先去掉注释，避免“把答案写在注释里”也能通过
function stripComments(src) {
  return src.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}
function makeTester(root, rawSource, exports) {
  const source = stripComments(rawSource);
  const q = (s) => root.querySelector(s);
  const qa = (s) => Array.from(root.querySelectorAll(s));
  const pick = (x) => { const e = typeof x === 'string' ? q(x) : x; if (!e) throw new TestFail('找不到元素：' + x); return e; };
  return {
    root, source, rawSource, exports: exports || {}, q, qa,
    text: (s) => { const e = q(s); return e ? e.textContent.trim() : ''; },
    byText: (tag, text) => qa(tag).find(e => e.textContent.trim() === text),
    click: async (x) => { pick(x).click(); await sleep(40); },
    type: async (x, value) => {
      const e = pick(x);
      const proto = e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(e, value);
      e.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(40);
    },
    wait: sleep,
    assert: (cond, msg) => { if (!cond) throw new TestFail(msg); },
  };
}

/* 半成品示例（渐隐示例）：保留参考答案中一半的新代码，其余换成待补全的标记 */
function fadedExample(ex) {
  if (ex.faded) return ex.faded;  // 人工挑选要补全的关键行
  const starter = new Set(ex.starter.split('\n').map(s => s.trim()));
  let k = 0;
  return ex.solution.split('\n').map(line => {
    const t = line.trim();
    if (!t || starter.has(t) || /^[})\];,]+$/.test(t) || /^\/\//.test(t)) return line;
    return (k++ % 2 === 0) ? line.match(/^\s*/)[0] + '/* ✏️ 补全这一行 */' : line;
  }).join('\n');
}

function makeExercise(lesson) {
  const ex = lesson.exercise;
  const p = lp(lesson.id);
  const wrap = el('div');
  wrap.appendChild(el('div', { class: 'task' }, '<span class="lbl">任务</span>' + ex.task + '<div class="task-rule">先独立尝试。每次改过代码后检查失败，就会多解锁一级帮助：提示 → 半成品示例 → 参考答案。</div>'));
  const pg = makePlayground({ src: ex.starter, title: '你的代码', badge: 'EXERCISE', exercise: ex, lessonId: lesson.id });
  const foot = el('div', { class: 'pg-foot' });
  const checkBtn = el('button', { class: 'btn sun', type: 'button' }, '✓ 检查答案');
  const hintBtn = el('button', { class: 'btn small', type: 'button' });
  const fadeBtn = el('button', { class: 'btn small', type: 'button' });
  const solBtn = el('button', { class: 'btn small', type: 'button' });
  foot.append(checkBtn, hintBtn, fadeBtn, solBtn, el('span', { class: 'kbd' }, 'Ctrl/⌘+Enter 运行 · Tab 缩进 · Esc 后按 Tab 离开编辑器'));
  const result = el('div', { class: 'result', role: 'status' });
  result.hidden = true;
  pg.append(foot, result);
  wrap.appendChild(pg);

  const show = (cls, html) => { result.className = 'result ' + cls; result.innerHTML = html; result.hidden = false; };
  // 每一级要求：失败次数 + 从第一次失败起已经思考了多久（分钟）
  const LADDER = [[hintBtn, '提示', 1, 0], [fadeBtn, '半成品示例', 2, 2], [solBtn, '查看参考答案', 3, 5]];
  function gate() {
    const f = p.fails || 0;
    const mins = p.firstFail ? (Date.now() - p.firstFail) / 60e3 : 0;
    LADDER.forEach(([b, name, need, wait]) => {
      const open = p.ex || (f >= need && mins >= wait);
      b.disabled = !open;
      b.textContent = open ? name
        : f < need ? `🔒 ${name}（再改代码检查 ${need - f} 次解锁）`
        : `🔒 ${name}（再想 ${Math.max(1, Math.ceil(wait - mins))} 分钟解锁）`;
    });
  }
  gate();
  const gateTimer = setInterval(() => { if (!document.body.contains(wrap)) clearInterval(gateTimer); else gate(); }, 20e3);
  if (p.ex) show('ok', p.exHelp ? '✓ 你在看过参考答案后通过了这道练习。过几天不看答案再写一遍，才算真正会了。' : '✓ 你已通过这道练习。可以继续修改代码，随时再次检查。');
  // 只有真的改过代码的失败才计入解锁次数，连点“检查”不会解锁答案
  const norm = (s) => String(s).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/[\s;,]+/g, '');
  const isAttempt = (code) => norm(code) !== norm(ex.starter) && norm(code) !== p.lastFail;

  checkBtn.addEventListener('click', async () => {
    checkBtn.disabled = true; checkBtn.textContent = '检查中…';
    const code = pg._editor.value;
    try {
      if (p.sawSol && !p.rewrite && norm(code) === norm(ex.solution)) {
        show('hint', '这还是参考答案的原文。点“重置”，不看答案，自己从头写一遍再检查。写出来的过程才是练习本身。');
        return;
      }
      const res = pg._run();
      if (res.error) throw new TestFail('代码无法运行：' + explainError(res.error));
      await sleep(80);
      const err = pg._mount.querySelector(':scope > .pv-err');
      if (err) throw new TestFail(err.textContent);
      await ex.test(makeTester(pg._mount, pg._editor.value, res.exports));
      if (p.sawSol && !p.ex) p.exHelp = p.rewrite ? 'rewrite' : 'solution';
      p.ex = true; save(); gate(); maybeComplete(lesson);
      show('ok', p.exHelp === 'rewrite' ? '🎉 通过了。你看过答案后自己重写了一遍，这一步很有价值。过几天再不看答案写一次，检验是否真的记住了。'
        : p.exHelp ? '🎉 通过了。你看过参考答案，所以这道题会记为“借助答案完成”。过几天不看答案再写一遍，才算真正会了。' : '🎉 全部通过！做得好。');
    } catch (e) {
      const counted = !p.ex && isAttempt(code);
      if (counted) { p.fails = (p.fails || 0) + 1; p.lastFail = norm(code); if (!p.firstFail) p.firstFail = Date.now(); }
      save(); gate();
      const next = counted && LADDER.find(([, , need]) => need === p.fails);
      const note = (!p.ex && !counted) ? '<br><small>代码和起始代码或上次检查时一样，这次不计入解锁次数。先动手改一改。</small>' : (next ? `<br><small>已解锁：${next[1]}</small>` : '');
      show('no', '✗ ' + esc(e instanceof TestFail ? e.message : explainError(e)) + note);
    } finally {
      checkBtn.disabled = false; checkBtn.textContent = '✓ 检查答案';
      result.scrollIntoView({ block: 'nearest', behavior: smooth() });
    }
  });
  hintBtn.addEventListener('click', () => show('hint', '💡 ' + ex.hint));
  fadeBtn.addEventListener('click', () => {
    show('hint', '这是参考答案的“半成品”：一部分关键代码已经给出，标着 ✏️ 的行要你自己补全。照着思路在编辑器里写出来，而不是复制。<div class="codeblock faded"><pre></pre></div>');
    result.querySelector('pre').innerHTML = highlight(fadedExample(ex));
  });
  let solShown = false;
  solBtn.addEventListener('click', () => {
    if (!solShown) { solShown = true; p.sawSol = true; p.rewrite = false; pg._editor.value = ex.solution; p.code = ex.solution; save(); pg._run(); show('hint', '参考答案已载入编辑器。读懂它之后，点“重置”，不看答案再从头写一遍，再检查。直接提交答案原文不算通过。'); }
  });
  return wrap;
}

/* ---------- 题目（课内测验、课前热身、复习、阶段测验共用） ---------- */
const fmtOpt = (o) => esc(String(o).replace(/&lt;/g, '<').replace(/&gt;/g, '>')).replace(/&lt;(\/?[A-Za-z][^&]*?)&gt;/g, '<code>&lt;$1&gt;</code>');
function shuffled(n, rnd = Math.random) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function makeQuestion(item, label, { chosen, shuffle, onAnswer, onRetry, footer, hideAnswer, defer } = {}) {
  const q = el('div', { class: 'q' });
  q.appendChild(el('div', { class: 'q-text' }, `<span class="qn">${label}</span><span>${item.q}</span>`));
  const opts = el('div', { class: 'opts' });
  const order = shuffle ? shuffled(item.options.length) : [...item.options.keys()];
  const explain = el('div', { class: 'explain' }); explain.hidden = true;
  const btns = new Map();
  order.forEach((oi, pos) => {
    const b = el('button', { class: 'opt', type: 'button' }, `<span class="ol">${'ABCD'[pos]}</span><span>${fmtOpt(item.options[oi])}</span>`);
    b.addEventListener('click', () => {
      if (chosen !== undefined) return;
      chosen = oi;
      // 交卷模式：只记下选择，全部答完再统一显示对错和解析
      if (defer) btns.forEach((x, k) => { x.disabled = true; x.classList.toggle('picked', k === oi); });
      else paint();
      onAnswer && onAnswer(oi, oi === item.answer);
    });
    btns.set(oi, b); opts.appendChild(b);
  });
  function paint() {
    if (chosen === undefined) return;
    const ok = chosen === item.answer;
    // 可以重答时，答错只标出选错的项，不直接亮出正确答案
    const hide = !ok && hideAnswer && onRetry;
    btns.forEach((b, oi) => {
      b.disabled = true;
      b.classList.toggle('right', oi === item.answer && !hide);
      b.classList.toggle('wrong', oi === chosen && chosen !== item.answer);
    });
    explain.className = 'explain ' + (ok ? 'ok' : 'no');
    explain.innerHTML = hide
      ? `<b>不太对。</b>先别急着换选项。回到正文里和这道题相关的部分，想清楚你选的那项错在哪，再答一次。选项顺序会重新打乱。`
      : `<b>${ok ? '回答正确。' : '不太对，正确答案是 ' + 'ABCD'[order.indexOf(item.answer)] + '。'}</b>${item.explain}`;
    if (footer) explain.insertAdjacentHTML('beforeend', footer);
    if (!ok && onRetry) {
      const r = el('button', { class: 'btn small retry', type: 'button' }, hide ? '想清楚了，再答一次' : '读懂解析后，再答一次');
      r.addEventListener('click', () => q.replaceWith(onRetry()));
      explain.appendChild(r);
    }
    explain.hidden = false;
  }
  if (!defer) paint();
  q._reveal = () => { btns.forEach(x => x.classList.remove('picked')); paint(); };
  q.append(opts, explain);
  return q;
}

/* ---------- 间隔复习（Leitner 盒子） ---------- */
const DAY = 864e5;
const SRS_DAYS = [0, 1, 3, 7, 16, 35];
const srsAll = () => (progress.__srs = progress.__srs || {});
function srsRecord(key, ok) {
  const s = srsAll();
  const c = s[key] || { box: 0, n: 0 };
  c.box = ok ? Math.min(c.box + 1, SRS_DAYS.length - 1) : 0;
  c.due = Date.now() + (ok ? SRS_DAYS[c.box] : 1) * DAY;
  c.n++; c.last = Date.now(); s[key] = c; save();
}
function cardOf(key) {
  const [id, qi] = key.split('#');
  const l = LESSONS.find(x => x.id === id);
  if (!l) return null;
  // "c0"、"c1"…：只在阶段测验中出现的读代码题（lesson.checkOnly）
  const list = qi[0] === 'c' ? l.checkOnly : l.quiz;
  const n = qi[0] === 'c' ? +qi.slice(1) : +qi;
  return list && list[n] ? { key, l, qi: n, item: list[n] } : null;
}
const dueCards = () => Object.entries(srsAll()).filter(([, c]) => c.due <= Date.now()).sort((a, b) => a[1].due - b[1].due).map(([k]) => cardOf(k)).filter(Boolean);
const learnedCards = () => Object.keys(srsAll()).map(cardOf).filter(Boolean);
const srcLine = (c) => `<div class="src">出自第 ${LESSONS.indexOf(c.l) + 1} 课《${esc(c.l.title)}》 · <a href="#${c.l.id}">回看这一课</a></div>`;
function seeded(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---------- 课内测验 ---------- */
function makeQuiz(lesson) {
  const box = el('div', { class: 'quiz' });
  const p = lp(lesson.id);
  const state = p.quiz;
  p.tried = p.tried || {};
  p.first = p.first || {};
  const build = (item, qi, fresh) => makeQuestion(item, 'Q' + (qi + 1), {
    chosen: fresh ? undefined : state[qi], shuffle: true, hideAnswer: true,
    onAnswer: (oi, ok) => {
      // 只有第一次作答计入复习安排和“首答正确率”
      if (!p.tried[qi]) { p.tried[qi] = true; p.first[qi] = ok; srsRecord(lesson.id + '#' + qi, ok); }
      state[qi] = oi; save(); maybeComplete(lesson); paintFinish(lesson);
    },
    onRetry: () => { delete state[qi]; save(); return build(item, qi, true); },
  });
  lesson.quiz.forEach((item, qi) => box.appendChild(build(item, qi)));
  return box;
}
function quizPassed(lesson) {
  const s = (progress[lesson.id] || {}).quiz || {};
  return (lesson.quiz || []).every((item, i) => s[i] === item.answer);
}
function maybeComplete(lesson) {
  const p = lp(lesson.id);
  if (p.done) return;
  if (quizPassed(lesson) && (!lesson.exercise || p.ex)) {
    p.done = true; save(); toast('本课完成！🎉'); refreshChrome(); paintFinish(lesson);
  }
}

/* ---------- 页面渲染 ---------- */
function renderBlock(b) {
  switch (b.t) {
    case 'h': return el('h2', {}, esc(b.text));
    case 'p': return /^\s*<(ol|ul|div|table|figure)\b/.test(b.html) ? el('div', { class: 'p-block' }, b.html) : el('p', {}, b.html);
    case 'ul': return el('ul', {}, b.items.map(i => '<li>' + i + '</li>').join(''));
    case 'call': return el('div', { class: 'call ' + b.kind }, `<span class="lbl">${b.label}</span>${b.html}`);
    case 'code': {
      const d = el('div', { class: 'codeblock wide' }, '<pre><code class="language-jsx"></code></pre>');
      d.querySelector('code').innerHTML = highlight(b.src);
      d.querySelector('code').style.cssText = 'background:none;padding:0;color:inherit;font-size:inherit';
      if (b.cap) d.appendChild(el('div', { class: 'cb-cap' }, esc(b.cap)));
      return d;
    }
    case 'play': return makePlayground({ src: b.src, title: b.title, note: b.note, predict: b.predict, predictKey: b.pkey });
    case 'table': return el('div', { class: 'tbl wide' }, '<table><thead><tr>' + b.head.map(x => '<th>' + x + '</th>').join('') + '</tr></thead><tbody>' + b.rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>');
    case 'fig': return el('figure', { class: 'fig wide' }, b.html + (b.cap ? '<figcaption>' + b.cap + '</figcaption>' : ''));
  }
  return el('div');
}

function paintFinish(lesson) {
  const f = $('#finish'); if (!f) return;
  const p = lp(lesson.id);
  const needs = [];
  if (lesson.quiz && !quizPassed(lesson)) needs.push('答对全部测验题');
  if (lesson.exercise && !p.ex) needs.push('通过动手练习');
  f.className = 'finish' + (p.done ? ' is-done' : '');
  const nq = (lesson.quiz || []).length;
  const firstOk = Object.values(p.first || {}).filter(Boolean).length;
  const tried = Object.keys(p.tried || {}).length;
  const acc = nq && tried === nq ? `测验首次作答答对 ${firstOk}/${nq}。${firstOk < nq ? '首次答错的题明天会回来复习，再答对才算真的记住。' : ''}` : '';
  const help = lesson.exercise && p.exHelp ? '练习是借助参考答案完成的，过几天不看答案再写一遍。' : '';
  f.innerHTML = p.done
    ? `<div class="fx"><b>✓ 本课已完成</b><span>${acc}${help}本课的题目已进入复习队列，下一课开头的热身题也会考到它。真正的掌握以阶段测验为准。</span></div>`
    : `<div class="fx"><b>掌握标准</b><span>${needs.length ? '还需要：' + needs.join('、') + '。达到后会自动标记完成。' : ''}如果你在别处已经学会了，也可以跳过。</span></div>`;
  const btn = el('button', { class: 'btn small', type: 'button' }, p.done ? '标记为未完成' : '我已掌握，跳过');
  btn.addEventListener('click', () => { p.done = !p.done; save(); refreshChrome(); paintFinish(lesson); if (p.done) toast('本课完成！🎉'); });
  f.appendChild(btn);
}

/* 课前热身：从前面学过的课里挑 2 道题做提取练习，优先挑到期该复习的 */
function makeWarmup(lesson) {
  const idx = LESSONS.indexOf(lesson);
  const pool = [];
  LESSONS.slice(0, idx).forEach(l => (l.quiz || []).forEach((item, qi) => pool.push({ key: l.id + '#' + qi, l, qi, item })));
  const srs = srsAll();
  // 只考已经学过（答过题）的内容，没学过的课不拿来热身
  // 刚答过（12 小时内）的题不拿来热身，否则只是在考短期记忆
  for (let i = pool.length - 1; i >= 0; i--) { const s = srs[pool[i].key]; if (!s || (s.last && Date.now() - s.last < 12 * 36e5)) pool.splice(i, 1); }
  if (!pool.length) return null;
  const rnd = seeded(lesson.id + new Date().toDateString());
  const mix = (arr) => arr.map(c => [rnd(), c]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const due = mix(pool.filter(c => srs[c.key] && srs[c.key].due <= Date.now()));
  const prev = mix(pool.filter(c => c.l === LESSONS[idx - 1]));
  const older = mix(pool.filter(c => c.l !== LESSONS[idx - 1]));
  const picks = [];
  [...due.slice(0, 1), ...prev.slice(0, 1), ...due.slice(1), ...older, ...prev].forEach(c => { if (picks.length < 2 && !picks.includes(c)) picks.push(c); });
  const box = el('section', { class: 'warmup wide' });
  box.innerHTML = '<div class="wu-head"><b>课前热身</b><span>先别往下读。凭记忆回答这两道前面学过的题，回忆的过程本身就在加固记忆。</span></div>';
  // 只有到期的题答对才拉长复习间隔；没到期的题答错照样重置
  picks.forEach((c, i) => box.appendChild(makeQuestion(c.item, '回忆 ' + (i + 1), { shuffle: true, onAnswer: (oi, ok) => { if (!ok || srs[c.key].due <= Date.now()) srsRecord(c.key, ok); }, footer: srcLine(c) })));
  return box;
}

/* 自我解释：用自己的话讲一遍，再对照要点自查 */
function makeSelfExplain(lesson) {
  const p = lp(lesson.id);
  const box = el('div', { class: 'selfx' });
  box.innerHTML = '<p>想象你要把这一课讲给一个刚学 React 的朋友听。不看上面的内容，用两三句话写下来：它解决什么问题，怎么用，最容易踩的坑是什么。写完再对照要点，看看漏了什么。</p>';
  const ta = el('textarea', { id: 'sx-' + lesson.id, rows: '4', placeholder: '例如：useEffect 用来……，依赖数组的作用是……，要注意……', 'aria-label': '用自己的话总结本课' });
  ta.value = p.note || '';
  const MIN = 30;
  // 有效字数：去掉空白和标点，连续重复的字只算一个，防止用“啊啊啊”凑数
  const len = () => {
    const t = ta.value.replace(/[\s\p{P}\p{S}]/gu, '').replace(/(.)\1+/gu, '$1');
    return new Set(t).size < 10 ? Math.min(t.length, 9) : t.length;
  };
  const reveal = el('button', { class: 'btn small', type: 'button' }, '写好了，对照本课要点');
  const count = el('small', { class: 'sx-count' });
  const sync = () => { const n = len(); reveal.disabled = n < MIN; count.textContent = n < MIN ? `再写 ${MIN - n} 个字就能对照要点。` : ''; };
  ta.addEventListener('input', () => { p.note = ta.value; save(); sync(); });
  const list = el('div', { class: 'sx-goals' }); list.hidden = true;
  p.can = p.can || {};
  const kp = lesson.keyPoints && lesson.keyPoints.length
    ? '<b>参考要点</b><ol class="sx-keys">' + lesson.keyPoints.map(k => '<li>' + k + '</li>').join('') + '</ol><p class="sx-ask">你的总结里有没有讲到上面每一点？漏掉的，回到正文再看一遍，然后补进你的总结。</p>'
    : '';
  list.innerHTML = kp + '<b>逐条问自己：我能做到吗？</b>' + lesson.goals.map((g, i) => `<label><input type="checkbox" data-i="${i}" ${p.can[i] ? 'checked' : ''}> ${g}</label>`).join('') + '<small>没勾上的那条，回到正文对应的部分再看一遍，然后改写你上面的总结。</small>';
  list.addEventListener('change', (e) => { if (e.target.dataset.i) { p.can[e.target.dataset.i] = e.target.checked; save(); } });
  reveal.addEventListener('click', () => { if (len() < MIN) return; list.hidden = false; reveal.hidden = true; count.textContent = ''; p.sx = true; save(); });
  if (p.sx || len() >= MIN && p.note) { list.hidden = false; reveal.hidden = true; } else sync();
  box.append(ta, reveal, count, list);
  return box;
}

/* 每课中，术语第一次出现时加上虚线和释义 */
function markTerms(root) {
  const terms = [...GLOSSARY].sort((a, b) => b.term.length - a.term.length);
  const skip = (n) => n.parentElement.closest('code, pre, a, abbr, .pg, .codeblock, h2, .tbl th, details.optional');
  terms.forEach(g => {
    const re = /^[A-Za-z]/.test(g.term) ? new RegExp('(?<![A-Za-z])' + g.term + '(?![A-Za-z])') : new RegExp(g.term);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (skip(n)) continue;
      const m = n.nodeValue.match(re);
      if (!m) continue;
      const after = n.splitText(m.index);
      after.splitText(g.term.length);
      const ab = el('abbr', { class: 'term', title: g.term + '（' + g.en + '）：' + g.def, tabindex: '0' });
      ab.textContent = g.term;
      after.replaceWith(ab);
      break;
    }
  });
}

function renderGlossary() {
  const page = el('div', { class: 'page' });
  page.appendChild(el('div', { class: 'crumb' }, '<span class="tag">参考</span>'));
  page.appendChild(el('h1', { class: 'lesson-title' }, '术语表'));
  page.appendChild(el('p', { class: 'lesson-sum' }, '本课程中，一个概念只用一个说法。课文里术语第一次出现时带虚线下划线，把鼠标放上去或点一下就能看到释义。标题、代码和折叠的选读里不加标注。'));
  page.appendChild(el('div', { class: 'tbl wide' }, '<table><thead><tr><th>术语</th><th>英文</th><th>含义</th><th>不使用的说法</th></tr></thead><tbody>' +
    GLOSSARY.map(g => `<tr><td><b>${esc(g.term)}</b></td><td>${esc(g.en)}</td><td>${esc(g.def)}</td><td>${esc(g.avoid || '—')}</td></tr>`).join('') + '</tbody></table>'));
  return page;
}

function renderLesson(lesson) {
  const idx = LESSONS.indexOf(lesson);
  const stage = STAGES[lesson.stage];
  const page = el('article', { class: 'page' });
  page.appendChild(el('div', { class: 'crumb' }, `<span class="tag">${stage.no} · ${stage.name}</span><span>第 ${idx + 1} / ${LESSONS.length} 课</span><span>·</span><span>约 ${lesson.mins} 分钟</span>`));
  page.appendChild(el('h1', { class: 'lesson-title' }, esc(lesson.title)));
  page.appendChild(el('p', { class: 'lesson-sum' }, lesson.summary));
  const warm = makeWarmup(lesson);
  if (warm) page.appendChild(warm);
  page.appendChild(el('div', { class: 'goals' }, '<b>学完这一课，你应该</b><ul>' + lesson.goals.map(g => '<li>' + g + '</li>').join('') + '</ul>'));
  const p = lp(lesson.id);
  const jumps = [['sec-read', '正文', false]];
  if (lesson.quiz && lesson.quiz.length) jumps.push(['sec-quiz', '随堂测验', !!p.quiz && lesson.quiz.every((q, i) => p.quiz[i] === q.answer)]);
  if (lesson.exercise) jumps.push(['sec-ex', '动手练习', !!p.ex]);
  jumps.push(['sec-self', '用自己的话讲一遍', !!(p.note && p.note.trim())]);
  page.appendChild(el('nav', { class: 'jumps', 'aria-label': '本课内容' }, '<span>本课：</span>' + jumps.map(([id, t, ok]) => `<a href="#${lesson.id}" data-jump="${id}" class="${ok ? 'ok' : ''}">${ok ? '✓ ' : ''}${t}</a>`).join('')));
  const prose = el('div', { class: 'prose', id: 'sec-read' });
  // 标题带“（选读）”的小节折叠起来：必读内容先读完，选读按需展开
  let target = prose;
  lesson.body.forEach(b => {
    if (b.t === 'h') {
      target = prose;
      if (/（选读）/.test(b.text)) {
        const d = el('details', { class: 'optional' });
        d.appendChild(el('summary', {}, `<span class="opt-tag">选读</span>${esc(b.text.replace(/（选读）/, ''))}<small>可以先跳过，需要时再展开</small>`));
        prose.appendChild(d); target = d;
        return;
      }
    }
    target.appendChild(renderBlock(b));
  });
  markTerms(prose);
  page.appendChild(prose);

  if (lesson.quiz && lesson.quiz.length) {
    page.appendChild(el('div', { class: 'block-title', id: 'sec-quiz' }, `<h2>随堂测验</h2><span>${lesson.quiz.length} 题 · 选项顺序每次都会打乱 · 答错可以读完解析再答</span>`));
    page.appendChild(makeQuiz(lesson));
  }
  if (lesson.exercise) {
    page.appendChild(el('div', { class: 'block-title', id: 'sec-ex' }, '<h2>动手练习</h2><span>写代码 → 点“检查答案”，系统会像用户一样操作你的组件</span>'));
    page.appendChild(makeExercise(lesson));
  }
  page.appendChild(el('div', { class: 'block-title', id: 'sec-self' }, '<h2>用自己的话讲一遍</h2><span>能讲清楚，才算真的懂了</span>'));
  page.appendChild(makeSelfExplain(lesson));
  page.appendChild(el('div', { id: 'finish', class: 'finish' }));
  const pager = el('nav', { class: 'pager', 'aria-label': '课程翻页' });
  const prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
  if (prev) pager.appendChild(el('a', { href: '#' + prev.id }, `<small>← 上一课</small><b>${esc(prev.title)}</b>`));
  if (next) pager.appendChild(el('a', { href: '#' + next.id, class: 'next' }, `<small>下一课 →</small><b>${esc(next.title)}</b>`));
  else pager.appendChild(el('a', { href: '#', class: 'next' }, '<small>全部学完了</small><b>回到课程地图</b>'));
  page.appendChild(pager);
  page.appendChild(el('p', { class: 'kbd-hint' }, '提示：不在输入框里时，按键盘 ← 和 → 可以翻到上一课和下一课。'));
  const last = LESSONS.filter(l => l.stage === lesson.stage).pop();
  if (last === lesson) page.appendChild(el('a', { class: 'stage-cta', href: '#check-' + lesson.stage }, `<b>本阶段学完了，来做 ${stage.name} 阶段测验 →</b><span>题目混合了本阶段所有课程，答对 80% 才算掌握。</span>`));
  return page;
}

/* ---------- 复习页 ---------- */
function renderReview() {
  const page = el('div', { class: 'page' });
  page.appendChild(el('div', { class: 'crumb' }, '<span class="tag">间隔复习</span>'));
  page.appendChild(el('h1', { class: 'lesson-title' }, '今日复习'));
  page.appendChild(el('p', { class: 'lesson-sum' }, '每道题第一次答完后都会进入复习队列：答对了，间隔会从 1 天拉长到 3、7、16、35 天；答错了，它明天会再出现。不同课的题混在一起出，逼你先判断“这是哪个知识点”。'));
  const stageArea = el('div');
  page.appendChild(stageArea);
  const learned = learnedCards();
  const start = (queue, label) => {
    let i = 0, right = 0;
    const step = () => {
      stageArea.innerHTML = '';
      if (i >= queue.length) {
        const nextDue = Object.values(srsAll()).map(c => c.due).filter(d => d > Date.now()).sort((a, b) => a - b)[0];
        stageArea.appendChild(el('div', { class: 'done-card' }, `<b>${label}完成：答对 ${right} / ${queue.length}</b><span>${nextDue ? '下一批题目将在 ' + Math.max(1, Math.round((nextDue - Date.now()) / DAY)) + ' 天后到期。' : ''}答错的题明天会再出现。</span><a class="btn primary" href="#">回到课程地图</a>`));
        refreshChrome(); return;
      }
      const c = queue[i];
      stageArea.appendChild(el('div', { class: 'rv-progress' }, `<span>${label} · 第 ${i + 1} / ${queue.length} 题</span><div class="bar"><i style="width:${i / queue.length * 100}%"></i></div>`));
      const nextBtn = el('button', { class: 'btn primary', type: 'button' }, i + 1 < queue.length ? '下一题 →' : '查看结果');
      nextBtn.hidden = true;
      nextBtn.addEventListener('click', () => { i++; step(); });
      stageArea.appendChild(makeQuestion(c.item, '复习', { shuffle: true, footer: srcLine(c), onAnswer: (oi, ok) => { if (ok) right++; srsRecord(c.key, ok); nextBtn.hidden = false; nextBtn.focus(); } }));
      stageArea.appendChild(nextBtn);
    };
    step();
  };
  const due = dueCards();
  if (!learned.length) {
    stageArea.appendChild(el('div', { class: 'done-card' }, `<b>还没有需要复习的题目</b><span>完成任意一课的随堂测验后，题目会自动进入这里。</span><a class="btn primary" href="#${LESSONS[0].id}">开始第一课</a>`));
  } else if (due.length) {
    start(shuffled(due.length).map(i => due[i]).slice(0, 20), '今日复习');
  } else {
    const box = el('div', { class: 'done-card' }, `<b>今天该复习的都复习完了 🎉</b><span>你已学过 ${learned.length} 道题。想多练一会儿，可以做一组从所有学过的课里随机抽取的混合题，结果同样会影响复习安排。</span>`);
    const extra = el('button', { class: 'btn primary', type: 'button' }, '来 10 道混合练习');
    extra.addEventListener('click', () => start(shuffled(learned.length).slice(0, 10).map(i => learned[i]), '混合练习'));
    box.appendChild(extra);
    stageArea.appendChild(box);
  }
  return page;
}

/* ---------- 阶段测验 ---------- */
function renderCheck(si) {
  const s = STAGES[si];
  const ls = LESSONS.filter(l => l.stage === si);
  const page = el('div', { class: 'page' });
  page.appendChild(el('div', { class: 'crumb' }, `<span class="tag">${s.no} · ${s.name}</span><span>阶段测验</span>`));
  page.appendChild(el('h1', { class: 'lesson-title' }, s.name + '阶段测验'));
  page.appendChild(el('p', { class: 'lesson-sum' }, '每次 12 题，从本阶段所有课程中抽取。其中 8 道是课内没出现过的读代码题，优先抽你还没见过的，检验你能否举一反三。答对 10 题（80% 以上）视为掌握本阶段。不翻笔记作答，答错的题会自动加入复习队列。'));
  const area = el('div', { class: 'quiz' });
  page.appendChild(area);
  const COOL = 30 * 60e3;
  const run = () => {
    area.innerHTML = '';
    const st0 = (progress.__stage = progress.__stage || {});
    const rec0 = st0[si] = st0[si] || {};
    let notice = '';
    if (rec0.pending) {
      // 上次答到一半就离开：按已答的题计分，未答的算错
      const pd = rec0.pending; delete rec0.pending;
      rec0.last = Math.round(pd.right / pd.n * 100); rec0.passed = false; rec0.failedAt = pd.at; rec0.weak = pd.weak || [];
      save(); refreshChrome();
      notice = `上次测验答了 ${pd.answered}/${pd.n} 题就离开了，按“未通过”记录（没答的题算错）。`;
    }
    const wait = rec0.failedAt ? rec0.failedAt + COOL - Date.now() : 0;
    if (wait > 0 && !rec0.passed) {
      if (notice) area.appendChild(el('p', { class: 'lesson-sum' }, notice));
      // 没通过后马上重测，测的是短期记忆。先复习，隔一段时间再测
      const box = el('div', { class: 'done-card' }, `<b>先复习，${Math.ceil(wait / 60e3)} 分钟后可以重测</b><span>上次答对 ${rec0.last || 0}%。马上重测，测到的多半是刚看过的答案。先回看这些课，做一做<a href="#review">今日复习</a>，再来测。</span>${(rec0.weak || []).length ? '<div class="wrong-list">需要加强：' + rec0.weak.map(id => { const l = LESSONS.find(x => x.id === id); return l ? `<a href="#${l.id}">${esc(l.title)}</a>` : ''; }).join('、') + '</div>' : ''}`);
      area.appendChild(box);
      return;
    }
    if (rec0.passed && rec0.passedAt && Date.now() - rec0.passedAt > 35 * DAY) {
      area.appendChild(el('p', { class: 'lesson-sum' }, `你在 ${Math.floor((Date.now() - rec0.passedAt) / DAY)} 天前通过了这个阶段。隔了这么久还能答对，才说明真的记住了。建议再测一次。`));
    }
    area.appendChild(el('p', { class: 'check-rule' }, '交卷模式：每题选一次，全部答完后统一显示对错和解析。中途离开按未通过记录。'));
    // 一半是课内见过的题，一半是只在阶段测验出现的新题，检验能否迁移
    const pool = [], fresh = [];
    ls.forEach(l => (l.quiz || []).forEach((item, qi) => pool.push(cardOf(l.id + '#' + qi))));
    ls.forEach(l => (l.checkOnly || []).forEach((item, qi) => fresh.push(cardOf(l.id + '#c' + qi))));
    const N = 12, srs = srsAll();
    const nFresh = Math.min(8, fresh.length);
    // 新题里优先抽还没见过的
    const freshOrder = shuffled(fresh.length).map(i => fresh[i]).sort((a, b) => (srs[a.key] ? 1 : 0) - (srs[b.key] ? 1 : 0));
    const mixed = [...freshOrder.slice(0, nFresh), ...shuffled(pool.length).slice(0, N - nFresh).map(i => pool[i])];
    const picks = shuffled(mixed.length).map(i => mixed[i]);
    let answered = 0, right = 0; const wrong = new Set(), wrongQ = [], qels = [];
    picks.forEach((c, i) => { const qel = makeQuestion(c.item, String(i + 1), {
      shuffle: true, footer: srcLine(c), defer: true,
      onAnswer: (oi, ok) => {
        answered++; if (ok) right++; else { wrong.add(c.l); wrongQ.push(i); }
        srsRecord(c.key, ok);
        if (answered === picks.length) { finish(); return; }
        rec0.pending = { n: picks.length, answered, right, at: Date.now(), weak: [...wrong].map(l => l.id) }; save();
      }
    }); qel.id = 'cq-' + i; qels.push(qel); area.appendChild(qel); });
    function finish() {
      qels.forEach(q => q._reveal());
      const pct = Math.round(right / picks.length * 100);
      const st = (progress.__stage = progress.__stage || {});
      const rec = st[si] || {};
      delete rec.pending;
      rec.best = Math.max(rec.best || 0, pct); rec.last = pct;
      // 以最近一次为准：通过过、后来没通过，也要重新复习
      if (pct >= 80) { rec.passed = true; rec.passedAt = Date.now(); delete rec.failedAt; } else { rec.passed = false; rec.failedAt = Date.now(); rec.weak = [...wrong].map(l => l.id); }
      st[si] = rec; save(); refreshChrome();
      const pass = pct >= 80;
      const box = el('div', { class: 'done-card ' + (pass ? 'pass' : '') }, `<b>${pass ? '✓ 已掌握 ' + s.name + '阶段' : '还差一点'}：答对 ${right}/${picks.length}（${pct}%）</b><span>${pass ? (si === STAGES.length - 1 ? '你已完成全部阶段。下一步：去<a href="#portfolio">毕业设计</a>做出自己的作品集。' : '可以放心进入下一阶段了。') : '先读懂下面每道错题的解析，再回看对应的课。30 分钟后才能重测，隔一段时间再测，比马上重测更能检验是否真的掌握。'}</span>${wrongQ.length ? '<div class="wrong-list">答错的题：' + wrongQ.map(i => `<a href="#check-${si}" data-jump="cq-${i}">第 ${i + 1} 题</a>`).join('、') + '</div>' : ''}${wrong.size ? '<div class="wrong-list">需要加强：' + [...wrong].map(l => `<a href="#${l.id}">${esc(l.title)}</a>`).join('、') + '</div>' : ''}`);
      if (pass) {
        const again = el('button', { class: 'btn', type: 'button' }, '换一组题再测');
        again.addEventListener('click', () => { run(); window.scrollTo(0, 0); });
        box.appendChild(again);
      }
      area.appendChild(box);
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  run();
  return page;
}

function renderHome() {
  const page = el('div', { class: 'page' });
  const doneCount = LESSONS.filter(l => isDone(l.id)).length;
  const nextLesson = LESSONS.find(l => !isDone(l.id)) || LESSONS[0];
  const totalMins = LESSONS.reduce((s, l) => s + l.mins, 0);
  const exCount = LESSONS.filter(l => l.exercise).length;
  const playCount = LESSONS.reduce((s, l) => s + l.body.filter(b => b.t === 'play').length, 0);
  const dueN = dueCards().length;
  const st = progress.__stage || {};

  const hero = el('section', { class: 'hero' });
  hero.appendChild(el('div', {}, `
    <div class="eyebrow">按学习科学设计的 React 课程 · 中文</div>
    <h1>从零开始，<br>一路学到<em>React 专家</em></h1>
    <p>这里不只是读教程。你会先预测代码的结果再运行验证，每节课开头回忆旧知识，按遗忘规律复习，每个阶段通过测验才算掌握。</p>
    <p class="prereq"><b>开始前你需要会：</b>JavaScript 基础（变量、函数、箭头函数、数组的 map 和 filter、对象和数组的解构与展开、模块的 import/export、Promise 与 async/await），以及基本的 HTML 和 CSS。还不熟的话，先花一两周补 JavaScript，再回来学会轻松很多。</p>
    <div class="cta">
      <a class="btn primary" href="#${nextLesson.id}">${doneCount ? '继续学习：' + esc(nextLesson.title) : '开始第一课'} →</a>
      ${dueN ? `<a class="btn sun" href="#review">今日复习 ${dueN} 题</a>` : '<a class="btn" href="#rendering">直接看渲染原理</a>'}
    </div>`));
  const card = el('div', { class: 'tree-card' });
  card.appendChild(buildHeroTree());
  card.appendChild(el('p', { class: 'cap' }, '点击任意组件，模拟它调用了 set 函数：它和它的所有后代都会重新渲染（闪黄），兄弟和祖先不受影响。这就是第 19 课要讲的内容。'));
  hero.appendChild(card);
  page.appendChild(hero);

  page.appendChild(el('div', { class: 'stats' }, `
    <div><b>${LESSONS.length}</b><span>节课</span></div>
    <div><b>${playCount}</b><span>个可运行示例</span></div>
    <div><b>${exCount}</b><span>道自动批改练习</span></div>
    <div><b>${Math.round(totalMins / 60 * 10) / 10}</b><span>小时（含练习，不含毕业设计）</span></div>
    <div><b>${doneCount}/${LESSONS.length}</b><span>课已完成</span></div>
    <div><b>${learnedCards().length}</b><span>道题在复习中</span></div>`));

  page.appendChild(el('h2', { class: 'section-title' }, '怎样用这套课程真正学会'));
  page.appendChild(el('p', { class: 'section-sub' }, '下面每个环节都对应一条被大量研究验证过的学习规律。看懂了不等于学会了，这些环节的作用是让知识留在你脑子里。'));
  page.appendChild(el('div', { class: 'methods' }, `
    <div><b>先预测，再运行</b><i>生成效应</i><p>标着 PREDICT 的代码会先让你猜结果。主动猜一次，哪怕猜错，比直接看答案记得牢得多。</p></div>
    <div><b>课前热身</b><i>提取练习</i><p>每课开头先凭记忆回答两道旧题。从记忆里“往外拿”知识，比反复阅读更能巩固它。</p></div>
    <div><b>间隔复习</b><i>间隔效应</i><p>题目按 1、3、7、16、35 天的间隔回来找你，赶在快忘记时复习一次，效率最高。</p></div>
    <div><b>混合出题</b><i>交错练习</i><p>复习和阶段测验把不同课的题混在一起，你得先判断该用哪个知识点，这正是写真实代码时的情况。</p></div>
    <div><b>先尝试，再求助</b><i>有益困难 · 渐隐示例</i><p>练习的提示、半成品示例、参考答案要检查失败后逐级解锁。先挣扎一下再看答案，学到的东西更多。</p></div>
    <div><b>讲给别人听</b><i>自我解释</i><p>每课结尾用自己的话总结，再对照要点自查。讲不清楚的地方，就是还没真懂的地方。</p></div>`));
  page.appendChild(el('p', { class: 'section-sub' }, '<b>简明的写法：</b>课文参考 ASD-STE100（简化技术英语）的写作原则。一句话只讲一件事，长句拆成短句，操作写成编号步骤，多用主动语态。一个概念只用一个说法，见<a href="#glossary">术语表</a>。'));
  page.appendChild(el('p', { class: 'section-sub' }, '<b>掌握学习：</b>一课测验全对、练习通过才算完成；一个阶段测验达到 80% 才算掌握。建议每天先清空“今日复习”，再学新课。'));

  page.appendChild(el('h2', { class: 'section-title', style: 'margin-top:34px' }, '学习路线'));
  page.appendChild(el('p', { class: 'section-sub' }, '六个阶段循序渐进。建议按顺序学习；如果已有基础，可以先做阶段测验，看看自己哪些地方已经掌握。'));
  const stages = el('div', { class: 'stages' });
  STAGES.forEach((s, si) => {
    const ls = LESSONS.filter(l => l.stage === si);
    const d = ls.filter(l => isDone(l.id)).length;
    const rec = st[si];
    const card = el('section', { class: 'stage' });
    card.innerHTML = `<div class="stage-head"><span class="stage-no">${s.no}</span><h3>${s.name}</h3><span style="color:var(--ink-3);font-size:12.5px">${s.en}</span>${rec && rec.passed ? '<span class="mastered">✓ 已掌握</span>' : ''}</div>
      <p class="desc">${s.desc}</p>
      <ol>${ls.map(l => `<li class="${isDone(l.id) ? 'done' : ''}"><a href="#${l.id}"><span class="dot"></span>${esc(l.title)}</a></li>`).join('')}</ol>
      <div class="meter"><div class="bar"><i style="width:${ls.length ? d / ls.length * 100 : 0}%"></i></div><span>${d}/${ls.length}</span></div>
      <a class="check-link" href="#check-${si}">阶段测验 ${rec ? '· 最好成绩 ' + rec.best + '%' : '· 未参加'} →</a>`;
    stages.appendChild(card);
  });
  page.appendChild(stages);
  return page;
}

/* 首页：可点击的组件树 */
function buildHeroTree() {
  const nodes = [
    { id: 'App', x: 200, y: 30, p: null },
    { id: 'Header', x: 90, y: 110, p: 'App' },
    { id: 'TodoList', x: 310, y: 110, p: 'App' },
    { id: 'Logo', x: 40, y: 190, p: 'Header' },
    { id: 'Search', x: 140, y: 190, p: 'Header' },
    { id: 'Item', x: 250, y: 190, p: 'TodoList', key: 'Item1' },
    { id: 'Item', x: 370, y: 190, p: 'TodoList', key: 'Item2' },
  ];
  nodes.forEach(n => { n.k = n.key || n.id; n.renders = 1; });
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '-14 0 448 230'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', '组件树示意，点击节点查看重新渲染范围');
  nodes.forEach(n => {
    if (!n.p) return;
    const par = nodes.find(x => x.k === n.p);
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('class', 'tedge');
    path.setAttribute('d', `M${par.x},${par.y + 18} C${par.x},${(par.y + n.y) / 2} ${n.x},${(par.y + n.y) / 2} ${n.x},${n.y - 18}`);
    svg.appendChild(path);
  });
  nodes.forEach(n => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'tnode'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', n.id + ' 调用 set 函数');
    g.innerHTML = `<rect x="${n.x - 44}" y="${n.y - 18}" width="88" height="36" rx="9"></rect><text x="${n.x}" y="${n.y - 1}">&lt;${n.id}&gt;</text><text class="rc" x="${n.x}" y="${n.y + 12}">渲染 1 次</text>`;
    n.g = g; svg.appendChild(g);
    const fire = () => {
      const hit = [];
      const walk = (k) => { const nn = nodes.find(x => x.k === k); hit.push(nn); nodes.filter(x => x.p === k).forEach(c => walk(c.k)); };
      walk(n.k);
      hit.forEach((h, i) => setTimeout(() => {
        h.renders++; h.g.querySelector('.rc').textContent = '渲染 ' + h.renders + ' 次';
        h.g.classList.remove('flash'); void h.g.getBBox(); h.g.classList.add('flash');
      }, i * 90));
    };
    g.addEventListener('click', fire);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
  });
  return svg;
}

/* ---------- 侧栏与顶栏 ---------- */
function buildSide() {
  const side = $('#side');
  let html = `<a class="nav-home" href="#" data-id="">⌂ 课程地图</a><a class="nav-home" href="#review" data-id="review">↻ 今日复习 <span class="due" id="due-badge"></span></a><a class="nav-home" href="#glossary" data-id="glossary">≡ 术语表</a>`;
  STAGES.forEach((s, si) => {
    const ls = LESSONS.filter(l => l.stage === si);
    html += `<h4><span>${s.no} ${s.name}</span><span class="cnt" data-stage="${si}"></span></h4>`;
    ls.forEach(l => { html += `<a class="nav-item" href="#${l.id}" data-id="${l.id}"><span class="nav-num">${LESSONS.indexOf(l) + 1}</span><span>${esc(l.title)}</span></a>`; });
    html += `<a class="nav-item nav-check" href="#check-${si}" data-id="check-${si}"><span class="nav-num">✓</span><span>阶段测验</span></a>`;
  });
  side.innerHTML = html;
}
function refreshChrome() {
  const cur = currentId();
  const st = progress.__stage || {};
  document.querySelectorAll('#side [data-id]').forEach(a => {
    const id = a.dataset.id;
    a.classList.toggle('active', id === cur);
    const m = id.match(/^check-(\d)$/);
    a.classList.toggle('done', m ? !!(st[m[1]] && st[m[1]].passed) : !!id && isDone(id));
    if (id === cur) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  document.querySelectorAll('#side .cnt').forEach(c => {
    const ls = LESSONS.filter(l => l.stage === +c.dataset.stage);
    c.textContent = ls.filter(l => isDone(l.id)).length + '/' + ls.length;
  });
  const n = dueCards().length;
  const badge = $('#due-badge'); if (badge) { badge.textContent = n || ''; badge.hidden = !n; }
  const done = LESSONS.filter(l => isDone(l.id)).length;
  $('#prog-bar').style.width = (done / LESSONS.length * 100) + '%';
  $('#prog-text').textContent = `已完成 ${done}/${LESSONS.length}`;
}

/* ---------- 路由 ---------- */
const currentId = () => decodeURIComponent(location.hash.slice(1));
function route() {
  disposePlaygrounds();
  const id = currentId();
  const lesson = LESSONS.find(l => l.id === id);
  const check = id.match(/^check-(\d)$/);
  const main = $('#main');
  main.innerHTML = '';
  if (lesson) {
    main.appendChild(renderLesson(lesson));
    paintFinish(lesson);
    document.title = lesson.title + ' · React 从零到专家';
  } else if (id === 'glossary') {
    main.appendChild(renderGlossary());
    document.title = '术语表 · React 从零到专家';
  } else if (id === 'review') {
    main.appendChild(renderReview());
    document.title = '今日复习 · React 从零到专家';
  } else if (check && STAGES[+check[1]]) {
    main.appendChild(renderCheck(+check[1]));
    document.title = STAGES[+check[1]].name + '阶段测验 · React 从零到专家';
  } else {
    main.appendChild(renderHome());
    document.title = 'React 从零到专家';
  }
  if (!pgObserver) livePlaygrounds.forEach(b => b._run());
  refreshChrome();
  setNav(false);
  window.scrollTo(0, 0);
  const act = $('#side .nav-item.active'); if (act) act.scrollIntoView({ block: 'nearest' });
  if (lesson) offerResume(lesson.id);
  onScroll();
}

/* ---------- 阅读位置与进度 ---------- */
const POS_KEY = STORE_KEY + ':pos';
function readPos() { try { return JSON.parse(localStorage.getItem(POS_KEY) || '{}') || {}; } catch (e) { return {}; } }
function offerResume(id) {
  const y = readPos()[id];
  if (!y || y < 600) return;
  const total = document.documentElement.scrollHeight - innerHeight;
  if (total < 1200) return;
  toast('上次读到这一课的 ' + Math.min(99, Math.round(y / total * 100)) + '% 处。', 8000, '从上次的位置继续', () => window.scrollTo({ top: y, behavior: smooth() }));
}
let posTimer;
function onScroll() {
  const total = document.documentElement.scrollHeight - innerHeight;
  const bar = $('#read-bar');
  const id = currentId();
  const isLesson = LESSONS.some(l => l.id === id);
  if (bar) { bar.hidden = !isLesson; bar.style.transform = `scaleX(${total > 0 ? Math.min(1, scrollY / total) : 0})`; }
  if (!isLesson) return;
  clearTimeout(posTimer);
  posTimer = setTimeout(() => {
    try { const pos = readPos(); pos[id] = Math.round(scrollY); localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch (e) {}
  }, 400);
}

/* ---------- 手机目录 ---------- */
function setNav(open) {
  document.body.classList.toggle('nav-open', open);
  const b = $('#menu-btn'); if (b) { b.setAttribute('aria-expanded', String(open)); b.setAttribute('aria-label', open ? '关闭课程目录' : '打开课程目录'); }
  if (open) { const act = $('#side .nav-item.active'); if (act) act.scrollIntoView({ block: 'center' }); }
}

function boot() {
  if (!window.React || !window.ReactDOM || !window.Babel) {
    $('#main').innerHTML = '<div class="loading">运行环境加载失败，请检查网络后刷新页面。</div>';
    return;
  }
  buildSide();
  $('#menu-btn').addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
  const scrim = el('div', { class: 'scrim', 'aria-hidden': 'true' });
  scrim.addEventListener('click', () => setNav(false));
  document.body.appendChild(scrim);
  const rb = el('div', { class: 'read-bar', id: 'read-bar', 'aria-hidden': 'true' }); rb.hidden = true;
  $('.topbar').appendChild(rb);
  window.addEventListener('scroll', onScroll, { passive: true });
  // 本课跳转：不改地址栏，直接滚到对应部分
  document.addEventListener('click', (e) => {
    const j = e.target.closest && e.target.closest('[data-jump]');
    if (!j) return;
    e.preventDefault();
    const t = document.getElementById(j.dataset.jump);
    if (t) t.scrollIntoView({ block: 'start', behavior: smooth() });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { setNav(false); $('#menu-btn').focus(); return; }
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const tg = e.target;
    if (tg.closest && tg.closest('input, textarea, select, [contenteditable], .opt, .tree, svg')) return;
    const i = LESSONS.findIndex(l => l.id === currentId());
    if (i < 0) return;
    const to = LESSONS[i + (e.key === 'ArrowRight' ? 1 : -1)];
    if (to) location.hash = '#' + to.id;
  });
  // 触屏上没有悬停提示，点一下术语就显示释义
  document.addEventListener('click', (e) => { const t = e.target.closest && e.target.closest('abbr.term'); if (t) toast(t.title, 5000); });
  window.addEventListener('hashchange', route);
  route();
}
boot();
