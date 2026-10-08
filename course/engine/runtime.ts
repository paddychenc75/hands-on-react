/* 实验台运行环境。两个 React 运行时按课选择（课的数据文件里的 `runtime` 字段，缺省 18），各自按需加载，互不覆盖：
   - React 18.3.1 开发版 UMD（jsdelivr）：脚本会写 window.React / window.ReactDOM。这是 18 的课的运行时，保持原样。
   - React 19.3.0 开发版：React 19 没有 UMD。我们把它打成站内的一个静态脚本（docs/public/runtime/react-19.3.0.dev.js，由 scripts/build-react19.mjs 生成，
     react / react-dom / react-dom/client 在同一个模块表里，是同一个实例），只登记在 window.__hocReact19，不碰 window.React。
   - Babel standalone 和 Prism 两个运行时共用。
   学习者代码拿到的 React / ReactDOM 由 Runner 显式传入（见 runner.ts），不读全局，所以两个运行时可以在同一次会话里先后加载，异步回调和没卸载的 root 也不会串。
   必须是开发版：引擎靠拦截 React 的警告向学习者显示它们（识别规则见 logic/warnings.ts）。
   不放 iframe：站点自己打包的 React 是另一份，各自独立的 root，互不干扰。每个运行时只加载一次；第一个实验台需要时才插入脚本。 */
import { BASE } from '../site.ts';
import { REACT_VERSIONS, react19Path, type RuntimeVersion } from './logic/runtime.ts';

const CDN = 'https://cdn.jsdelivr.net/npm/';
const COMMON_LIBS = [
  '@babel/standalone@7.25.6/babel.min.js',
  'prismjs@1.29.0/components/prism-core.min.js',
  'prismjs@1.29.0/components/prism-markup.min.js',
  'prismjs@1.29.0/components/prism-clike.min.js',
  'prismjs@1.29.0/components/prism-javascript.min.js',
  'prismjs@1.29.0/components/prism-jsx.min.js',
];
const REACT18_LIBS = [`react@${REACT_VERSIONS[18]}/umd/react.development.js`, `react-dom@${REACT_VERSIONS[18]}/umd/react-dom.development.js`];
/** 兼容旧名：18 的课需要加载的全部脚本（相对 CDN） */
export const RUNTIME_LIBS = [...REACT18_LIBS, ...COMMON_LIBS];

/** 一个已加载的 React 运行时。Runner、编译、练习检查工具都从这里拿 React，不读全局 */
export interface Runtime {
  version: RuntimeVersion;
  /** React 自己报告的完整版本号，例如 18.3.1、19.3.0 */
  reactVersion: string;
  React: any;
  /** 19 里是 react-dom 和 react-dom/client 合在一起（createRoot、flushSync、createPortal、useFormStatus 等） */
  ReactDOM: any;
}

function loadScript(src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false; // async=false：按插入顺序执行，React 先于 ReactDOM
    s.onload = () => resolve();
    s.onerror = () => {
      s.remove();
      reject(new Error('运行环境加载失败：' + src));
    };
    document.head.appendChild(s);
  });
}

const never = () => new Promise<never>(() => {}); // 静态生成时永不完成，组件什么也不做
const pending: Partial<Record<RuntimeVersion, Promise<Runtime>>> = {};
const loaded: Partial<Record<RuntimeVersion, Runtime>> = {};
let commonLoading: Promise<void> | null = null;
let consoleHandler19: ((method: 'error' | 'warn', args: unknown[]) => void) | null = null;

function loadCommon(base: string): Promise<void> {
  if (commonLoading) return commonLoading;
  window.Prism = { manual: true }; // 先声明，防止 Prism 自动高亮整页（会动 Rspress 自己的代码块）
  commonLoading = Promise.all(COMMON_LIBS.map(l => loadScript(base + l))).then(() => {
    if (!window.Babel) throw new Error('运行环境加载失败');
  });
  commonLoading.catch(() => {
    commonLoading = null;
  });
  return commonLoading;
}

/** 注册 React 19 包里的 console.error / console.warn 的接收函数（引擎用它识别 React 19 的警告）。包还没加载也可以先注册 */
export function onReact19Console(fn: (method: 'error' | 'warn', args: unknown[]) => void): void {
  consoleHandler19 = fn;
  const rt = (window as any).__hocReact19;
  if (rt) rt.setConsoleHook(fn);
}

async function load18(base: string): Promise<Runtime> {
  await Promise.all([loadCommon(base), ...REACT18_LIBS.map(l => loadScript(base + l))]);
  if (!window.React || !window.ReactDOM) throw new Error('运行环境加载失败');
  return { version: 18, reactVersion: window.React.version, React: window.React, ReactDOM: window.ReactDOM };
}

async function load19(base: string, assetBase: string): Promise<Runtime> {
  await Promise.all([loadCommon(base), (window as any).__hocReact19 ? Promise.resolve() : loadScript(assetBase + react19Path())]);
  const rt = (window as any).__hocReact19;
  if (!rt || !rt.React || !rt.ReactDOM) throw new Error('运行环境加载失败');
  if (consoleHandler19) rt.setConsoleHook(consoleHandler19);
  return { version: 19, reactVersion: rt.React.version, React: rt.React, ReactDOM: rt.ReactDOM };
}

/** 加载某个运行时（缺省 18），返回它的 React / ReactDOM。同一个运行时只加载一次；失败后可以重试 */
export function loadRuntime(version: RuntimeVersion = 18, base = CDN, assetBase = BASE): Promise<Runtime> {
  if (typeof window === 'undefined') return never();
  const existing = pending[version];
  if (existing) return existing;
  const p = (version === 19 ? load19(base, assetBase) : load18(base)).then(
    rt => {
      loaded[version] = rt;
      return rt;
    },
    e => {
      delete pending[version];
      throw e;
    },
  );
  pending[version] = p;
  return p;
}

/** 已加载的运行时；还没加载就抛错（实验台只会在 loadRuntime 完成之后才创建） */
export function getRuntime(version: RuntimeVersion): Runtime {
  const rt = loaded[version];
  if (!rt) throw new Error('React ' + version + ' 运行环境还没有加载');
  return rt;
}
