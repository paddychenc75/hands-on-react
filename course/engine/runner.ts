/* 代码执行引擎：把学习者的代码编译、运行进实验台的预览区，并收集控制台输出和错误。 */
import { prepare, compile } from './exec.ts';
import { explainError } from './logic/errors.ts';
import { esc } from './logic/text.ts';
import { el } from './util.ts';

let activeRunner: Runner | null = null;
let hooksInstalled = false; // 最近交互的实验台，用于接收异步错误

export const getActiveRunner = (): Runner | null => activeRunner;
export const setActiveRunner = (r: Runner | null): void => { activeRunner = r; };

function formatArg(a: any): string {
  if (typeof a === 'string') return a;
  if (a instanceof Error) return a.name + ': ' + a.message;
  if (typeof a === 'function') return 'ƒ ' + (a.name || 'anonymous') + '()';
  if (a && a.nodeType) return '<' + (a.nodeName || 'node').toLowerCase() + '>';
  try { return JSON.stringify(a, (_k, v) => (v && v.$$typeof ? '[React 元素]' : v), 2); } catch { return String(a); }
}

function makeBoundary(onError: (err: Error) => void) {
  return class Boundary extends window.React.Component {
    constructor(p: any) { super(p); this.state = { error: null }; }
    static getDerivedStateFromError(error: Error) { return { error }; }
    componentDidCatch(error: Error) { onError(error); }
    render() {
      if (this.state.error) return window.React.createElement('div', { className: 'pv-err' }, '渲染出错：' + this.state.error.message);
      return this.props.children;
    }
  };
}

export class Runner {
  mount: HTMLElement;
  consoleEl: HTMLElement;
  root: any;
  timers: Set<any>;
  gen: number;
  constructor(mount: HTMLElement, consoleEl: HTMLElement) {
    this.mount = mount; this.consoleEl = consoleEl; this.root = null; this.timers = new Set(); this.gen = 0;
    const touch = () => { activeRunner = this; };
    mount.addEventListener('pointerdown', touch, true);
    mount.addEventListener('focusin', touch, true);
    mount.addEventListener('submit', (e) => e.preventDefault()); // 没写 onSubmit 的表单也不会刷新页面
  }
  log(kind: string, args: any[]) {
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
    if (this.root) { try { this.root.unmount(); } catch {} this.root = null; }
    this.mount.innerHTML = '';
  }
  run(source: string, exportNames?: string[]): { error?: any; App?: any; exports?: Record<string, any> } {
    this.unmount();
    this.consoleEl.innerHTML = '';
    const gen = this.gen;
    const self = this;
    const fakeConsole = {
      log: (...a: any[]) => self.log('log', a), info: (...a: any[]) => self.log('log', a),
      warn: (...a: any[]) => self.log('warn', a), error: (...a: any[]) => self.log('error', a),
      table: (...a: any[]) => self.log('log', a), clear: () => { self.consoleEl.innerHTML = ''; },
    };
    const wrapTimer = (fn: (...args: any[]) => any) => (cb: (...args: any[]) => void, ms?: number, ...rest: any[]) => {
      const id = fn(function (this: any, ...args: any[]) { if (gen === self.gen) { try { cb.apply(this, args); } catch (e) { self.log('error', ['运行时错误：' + explainError(e)]); } } }, ms, ...rest);
      self.timers.add(id); return id;
    };
    const sandbox = {
      React: window.React, ReactDOM: window.ReactDOM, console: fakeConsole,
      setTimeout: wrapTimer(window.setTimeout.bind(window)),
      setInterval: wrapTimer(window.setInterval.bind(window)),
      clearTimeout: (id: any) => { self.timers.delete(id); clearTimeout(id); },
      clearInterval: (id: any) => { self.timers.delete(id); clearInterval(id); },
      alert: (m: string) => fakeConsole.warn('[alert] ' + m),
    };
    let result: any;
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

export function installHooks(): void {
  if (hooksInstalled || typeof window === 'undefined') return;
  hooksInstalled = true;
// React 开发版会把渲染中抛出的错误先报给 window，即使错误边界随后接住了它。
// 所以先暂存，稍后再显示；如果 React 说“错误边界已处理”，就丢弃。
const pendingErrors = new Set<{ runner: Runner; error: any }>();
window.addEventListener('error', (e) => {
  if (!activeRunner || !e.error) return;
  // 不调用 preventDefault：否则 React 开发版不再打印“错误边界已处理”的提示，我们就无法区分
  const item = { runner: activeRunner, error: e.error };
  pendingErrors.add(item);
  setTimeout(() => { if (pendingErrors.delete(item)) item.runner.log('error', ['运行时错误：' + explainError(item.error)]); }, 0);
});
// 把 React 开发版的警告（缺少 key、受控输入框没有 onChange 等）显示到实验台的控制台
const nativeConsoleError = console.error.bind(console);
console.error = (...a: any[]) => {
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
