/* 引擎：由 src/app.js 改造而来的 ES 模块。学习机制的逻辑保持原样，只做适配：
   全局变量改 import；React/ReactDOM/Babel/Prism 来自 runtime.js 动态加载的全局（开发版 UMD）；
   去掉整页渲染外壳（侧栏、顶栏、路由、boot），交给 Rspress。 */
import { prepare, compile, stripComments, HOOK_NAMES } from './exec.js';
import { progress, save, lp, isDone, emitProgress } from './store.js';
import { $, esc, sleep, el, highlight, toast, smooth } from './util.js';
import { LESSONS, lessonNo } from '../registry.js';
import { GLOSSARY } from '../glossary.js';
import { lessonHref } from '../site.js';


/* ---------- 代码执行引擎 ---------- */
let activeRunner = null;
let hooksInstalled = false; // 最近交互的实验台，用于接收异步错误

function formatArg(a) {
  if (typeof a === 'string') return a;
  if (a instanceof Error) return a.name + ': ' + a.message;
  if (typeof a === 'function') return 'ƒ ' + (a.name || 'anonymous') + '()';
  if (a && a.nodeType) return '<' + (a.nodeName || 'node').toLowerCase() + '>';
  try { return JSON.stringify(a, (k, v) => (v && v.$$typeof ? '[React 元素]' : v), 2); } catch (e) { return String(a); }
}

function makeBoundary(onError) {
  return class Boundary extends window.React.Component {
    constructor(p) { super(p); this.state = { error: null }; }
    static getDerivedStateFromError(error) { return { error }; }
    componentDidCatch(error) { onError(error); }
    render() {
      if (this.state.error) return window.React.createElement('div', { className: 'pv-err' }, '渲染出错：' + this.state.error.message);
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
      React: window.React, ReactDOM: window.ReactDOM, console: fakeConsole,
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
      this.root = window.ReactDOM.createRoot(this.mount);
      this.root.render(window.React.createElement(Boundary, null, window.React.createElement(result.App)));
    } else {
      this.mount.innerHTML = '<div class="pv-empty">这段代码没有定义 App 组件，运行结果请看下方控制台。</div>';
    }
    return result || {};
  }
}

function installHooks() {
  if (hooksInstalled || typeof window === 'undefined') return;
  hooksInstalled = true;
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
}

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
export function makePlayground({ src, title, note, badge = 'LIVE', exercise, lessonId, predict, predictKey }) {
  installHooks();
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
  const obs = getObserver();
  if (obs) obs.observe(box); else setTimeout(() => box._run());
  return box;
}
// 实验台进入视野附近才第一次运行，长课打开更快（观察器在浏览器里第一次用到时才创建）
let pgObserver;
const getObserver = () => pgObserver !== undefined ? pgObserver : (pgObserver = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver((entries) => {
  entries.forEach(en => { if (en.isIntersecting) { pgObserver.unobserve(en.target); if (!en.target._ran) en.target._run(); } });
}, { rootMargin: '400px 0px' }) : null);
/* 组件卸载时调用：对应原来换页时的 disposePlaygrounds，只是按单个实验台清理 */
export function disposePlayground(box) {
  if (pgObserver) pgObserver.unobserve(box);
  box._runner.unmount();
  if (activeRunner === box._runner) activeRunner = null;
}
/* ---------- 练习检查器 ---------- */
export class TestFail extends Error {}
export function makeTester(root, rawSource, exports) {
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

export function makeExercise(lesson) {
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
export const fmtOpt = (o) => esc(String(o).replace(/&lt;/g, '<').replace(/&gt;/g, '>')).replace(/&lt;(\/?[A-Za-z][^&]*?)&gt;/g, '<code>&lt;$1&gt;</code>');
export function shuffled(n, rnd = Math.random) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function makeQuestion(item, label, { chosen, shuffle, onAnswer, onRetry, footer, hideAnswer, defer } = {}) {
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
export const DAY = 864e5;
export const SRS_DAYS = [0, 1, 3, 7, 16, 35];
export const srsAll = () => (progress.__srs = progress.__srs || {});
export function srsRecord(key, ok) {
  const s = srsAll();
  const c = s[key] || { box: 0, n: 0 };
  c.box = ok ? Math.min(c.box + 1, SRS_DAYS.length - 1) : 0;
  c.due = Date.now() + (ok ? SRS_DAYS[c.box] : 1) * DAY;
  c.n++; c.last = Date.now(); s[key] = c; save();
}
export function cardOf(key) {
  const [id, qi] = key.split('#');
  const l = LESSONS.find(x => x.id === id);
  if (!l) return null;
  // "c0"、"c1"…：只在阶段测验中出现的读代码题（lesson.checkOnly）
  const list = qi[0] === 'c' ? l.checkOnly : l.quiz;
  const n = qi[0] === 'c' ? +qi.slice(1) : +qi;
  return list && list[n] ? { key, l, qi: n, item: list[n] } : null;
}
export const dueCards = () => Object.entries(srsAll()).filter(([, c]) => c.due <= Date.now()).sort((a, b) => a[1].due - b[1].due).map(([k]) => cardOf(k)).filter(Boolean);
export const learnedCards = () => Object.keys(srsAll()).map(cardOf).filter(Boolean);
export const srcLine = (c) => `<div class="src">出自第 ${lessonNo(c.l.id)} 课《${esc(c.l.title)}》 · <a href="${lessonHref(c.l.id)}">回看这一课</a></div>`;
export function seeded(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---------- 课内测验 ---------- */
export function makeQuiz(lesson) {
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
export function quizPassed(lesson) {
  const s = (progress[lesson.id] || {}).quiz || {};
  return (lesson.quiz || []).every((item, i) => s[i] === item.answer);
}
export function maybeComplete(lesson) {
  const p = lp(lesson.id);
  if (p.done) return;
  if (quizPassed(lesson) && (!lesson.exercise || p.ex)) {
    p.done = true; save(); toast('本课完成！🎉'); emitProgress(); paintFinish(lesson);
  }
}
export function paintFinish(lesson) {
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
  btn.addEventListener('click', () => { p.done = !p.done; save(); emitProgress(); paintFinish(lesson); if (p.done) toast('本课完成！🎉'); });
  f.appendChild(btn);
}
/* 课前热身：从前面学过的课里挑 2 道题做提取练习，优先挑到期该复习的 */
export function makeWarmup(lesson) {
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
export function makeSelfExplain(lesson) {
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
export function markTerms(root) {
  const terms = [...GLOSSARY].sort((a, b) => b.term.length - a.term.length);
  const skip = (n) => n.parentElement.closest('code, pre, a, abbr, .pg, .codeblock, h2, th, details.optional');
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

export { lp, isDone, progress };
