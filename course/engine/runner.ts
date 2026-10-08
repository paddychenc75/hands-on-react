/* 代码执行引擎：把学习者的代码编译、运行进实验台的预览区，并收集控制台输出和错误。 */
import { prepare, compile } from './exec.ts';
import { explainError } from './logic/errors.ts';
import { reactWarning, warningLine } from './logic/warnings.ts';
import { esc } from './logic/text.ts';
import { onReact19Console, type Runtime } from './runtime.ts';
import { el } from './util.ts';

let activeRunner: Runner | null = null;
let hooksInstalled = false; // 最近交互的实验台，用于接收异步错误

export const getActiveRunner = (): Runner | null => activeRunner;
export const setActiveRunner = (r: Runner | null): void => {
  activeRunner = r;
};

function formatArg(a: any): string {
  if (typeof a === 'string') return a;
  if (a instanceof Error) return a.name + ': ' + a.message;
  if (typeof a === 'function') return 'ƒ ' + (a.name || 'anonymous') + '()';
  if (a && a.nodeType) return '<' + (a.nodeName || 'node').toLowerCase() + '>';
  try {
    return JSON.stringify(a, (_k, v) => (v && v.$$typeof ? '[React 元素]' : v), 2);
  } catch {
    return String(a);
  }
}

function makeBoundary(React: any, onError: (err: Error) => void) {
  return class Boundary extends React.Component {
    constructor(p: any) {
      super(p);
      this.state = { error: null };
    }
    static getDerivedStateFromError(error: Error) {
      return { error };
    }
    componentDidCatch(error: Error) {
      onError(error);
    }
    render() {
      if (this.state.error) return React.createElement('div', { className: 'pv-err' }, '渲染出错：' + this.state.error.message);
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
  /** 这个实验台用的 React 运行时。React、ReactDOM 都从它取，不读全局 */
  runtime: Runtime;
  /** 本次运行中，学习者的处理函数没有调用 preventDefault 就提交了表单的次数（供练习检查读取） */
  unpreventedSubmits = 0;
  constructor(mount: HTMLElement, consoleEl: HTMLElement, runtime: Runtime) {
    this.runtime = runtime;
    this.mount = mount;
    this.consoleEl = consoleEl;
    this.root = null;
    this.timers = new Set();
    this.gen = 0;
    const touch = () => {
      activeRunner = this;
    };
    mount.addEventListener('pointerdown', touch, true);
    mount.addEventListener('focusin', touch, true);
    // 兜底：没写 onSubmit 或没调用 preventDefault 的表单也不会刷新页面。
    // 监听放在 mount 的父元素上（冒泡阶段），晚于 React 挂在 mount 上的处理函数，所以能看到学习者有没有调用 preventDefault
    (mount.parentElement || mount).addEventListener('submit', e => {
      if (!e.defaultPrevented) {
        this.unpreventedSubmits++;
        e.preventDefault();
        this.log('warn', ['表单提交时没有调用 e.preventDefault()：在真实页面里浏览器会提交表单并刷新整个页面（实验台替你拦住了）。']);
      }
    });
  }
  log(kind: string, args: any[]) {
    const line = el('div', { class: kind === 'error' ? 'err' : kind === 'warn' ? 'warn' : '' });
    line.textContent = args.map(formatArg).join(' ');
    this.consoleEl.appendChild(line);
    while (this.consoleEl.children.length > 80) this.consoleEl.firstChild.remove();
    this.consoleEl.scrollTop = this.consoleEl.scrollHeight;
  }
  clearTimers() {
    this.timers.forEach(t => {
      clearTimeout(t);
      clearInterval(t);
    });
    this.timers.clear();
  }
  unmount() {
    this.gen++;
    this.clearTimers();
    if (this.root) {
      try {
        this.root.unmount();
      } catch {}
      this.root = null;
    }
    this.mount.innerHTML = '';
  }
  run(source: string, exportNames?: string[]): { error?: any; App?: any; exports?: Record<string, any> } {
    this.unmount();
    this.consoleEl.innerHTML = '';
    this.unpreventedSubmits = 0;
    const gen = this.gen;
    const self = this;
    const fakeConsole = {
      log: (...a: any[]) => self.log('log', a),
      info: (...a: any[]) => self.log('log', a),
      warn: (...a: any[]) => self.log('warn', a),
      error: (...a: any[]) => self.log('error', a),
      table: (...a: any[]) => self.log('log', a),
      clear: () => {
        self.consoleEl.innerHTML = '';
      },
    };
    const wrapTimer =
      (fn: (...args: any[]) => any) =>
      (cb: (...args: any[]) => void, ms?: number, ...rest: any[]) => {
        const id = fn(
          function (this: any, ...args: any[]) {
            if (gen === self.gen) {
              try {
                cb.apply(this, args);
              } catch (e) {
                self.log('error', ['运行时错误：' + explainError(e)]);
              }
            }
          },
          ms,
          ...rest,
        );
        self.timers.add(id);
        return id;
      };
    const sandbox = {
      React: this.runtime.React,
      ReactDOM: this.runtime.ReactDOM,
      console: fakeConsole,
      setTimeout: wrapTimer(window.setTimeout.bind(window)),
      setInterval: wrapTimer(window.setInterval.bind(window)),
      clearTimeout: (id: any) => {
        self.timers.delete(id);
        clearTimeout(id);
      },
      clearInterval: (id: any) => {
        self.timers.delete(id);
        clearInterval(id);
      },
      alert: (m: string) => fakeConsole.warn('[alert] ' + m),
    };
    let result: any;
    try {
      const body = prepare(source, exportNames, this.runtime);
      const fn = compile(Object.keys(sandbox), body);
      result = fn(...Object.values(sandbox));
    } catch (e) {
      this.mount.innerHTML = '<div class="pv-err">' + esc(explainError(e)) + '</div>';
      return { error: e };
    }
    if (result && typeof result.App === 'function') {
      const { React, ReactDOM } = this.runtime;
      const Boundary = makeBoundary(React, err => self.log('error', ['渲染出错：' + explainError(err)]));
      // React 19 把错误交给 createRoot 的回调：没被错误边界接住的错误显示在这个实验台的控制台里（不走 window 的 error 事件），
      // 被接住的错误已经由 Boundary 显示过，这里什么也不做。React 18 没有这些选项，继续靠 installHooks 里的全局监听
      const opts =
        this.runtime.version === 19
          ? {
              onUncaughtError: (err: any) => {
                if (gen === self.gen) self.log('error', ['运行时错误：' + explainError(err)]);
              },
              onCaughtError: () => {},
            }
          : undefined;
      this.root = ReactDOM.createRoot(this.mount, opts);
      this.root.render(React.createElement(Boundary, null, React.createElement(result.App)));
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
  window.addEventListener('error', e => {
    if (!activeRunner || !e.error) return;
    // 不调用 preventDefault：否则 React 开发版不再打印“错误边界已处理”的提示，我们就无法区分
    const item = { runner: activeRunner, error: e.error };
    pendingErrors.add(item);
    setTimeout(() => {
      if (pendingErrors.delete(item)) item.runner.log('error', ['运行时错误：' + explainError(item.error)]);
    }, 0);
  });
  // 把 React 开发版的警告（缺少 key、受控输入框没有 onChange 等）显示到实验台的控制台
  const nativeConsoleError = console.error.bind(console);
  console.error = (...a: any[]) => {
    nativeConsoleError(...a);
    if (typeof a[0] === 'string' && /The above error occurred/.test(a[0]) && /error boundary you provided/.test(a.join(' '))) pendingErrors.clear();
    // 全局 console.error 里的 React 警告只可能来自 React 18（19 的警告走自己包里的 console，见下）
    if (!activeRunner || activeRunner.runtime.version !== 18) return;
    const w = reactWarning(18, 'error', a);
    if (w) activeRunner.log('warn', [warningLine(w)]);
  };
  // React 19 包里的 console.error / console.warn：消息出处可靠（都来自 React），由 reactWarning(19, …) 排除错误报告后显示
  onReact19Console((method, args) => {
    if (!activeRunner || activeRunner.runtime.version !== 19) return;
    const w = reactWarning(19, method, args);
    if (w) activeRunner.log('warn', [warningLine(w)]);
  });
  window.addEventListener('unhandledrejection', e => {
    if (activeRunner) {
      activeRunner.log('error', ['未处理的 Promise 错误：' + explainError(e.reason)]);
      e.preventDefault();
    }
  });
}
