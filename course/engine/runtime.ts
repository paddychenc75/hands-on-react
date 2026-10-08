/* 实验台运行环境：React 19.3.0 开发版 + Babel + Prism，都在第一个实验台需要时才加载。
   - React 19 没有 UMD。我们把它打成站内的一个静态脚本（docs/public/runtime/react-19.3.0.dev.js，由 scripts/build-react19.mjs 生成，
     react / react-dom / react-dom/client 在同一个模块表里，是同一个实例），只登记在 window.__hocReact19，不写 window.React。
   - Babel standalone 和 Prism 来自 CDN（jsdelivr）。
   学习者代码拿到的 React / ReactDOM 由 Runner 显式传入（见 runner.ts），不读全局。
   必须是开发版：引擎靠拦截 React 的警告向学习者显示它们（识别规则见 logic/warnings.ts）。
   不放 iframe：站点自己打包的 React 是另一份，各自独立的 root，互不干扰。运行时只加载一次。 */
import { BASE } from '../site.ts';
import { libDeps, libPath, react19Path, type LibInfo } from './logic/runtime.ts';

const CDN = 'https://cdn.jsdelivr.net/npm/';
const COMMON_LIBS = [
  '@babel/standalone@7.25.6/babel.min.js',
  'prismjs@1.29.0/components/prism-core.min.js',
  'prismjs@1.29.0/components/prism-markup.min.js',
  'prismjs@1.29.0/components/prism-clike.min.js',
  'prismjs@1.29.0/components/prism-javascript.min.js',
  'prismjs@1.29.0/components/prism-jsx.min.js',
];

/** 已加载的 React 运行时。Runner、编译、练习检查工具都从这里拿 React，不读全局 */
export interface Runtime {
  /** React 自己报告的完整版本号，例如 19.3.0 */
  reactVersion: string;
  React: any;
  /** react-dom 和 react-dom/client 合在一起（createRoot、flushSync、createPortal、useFormStatus 等） */
  ReactDOM: any;
  /** 已加载的第三方库（只有示例 import 了才会加载）。键是 import 的路径，例如 'react-router'、'react-router/dom'、'@tanstack/react-query' */
  libs: Record<string, any>;
  /** 已加载的第三方库的版本，键是包名 */
  libVersions: Record<string, string>;
}

/** 第三方库加载失败。message 是显示给学习者的提示 */
export class LibLoadError extends Error {
  lib: string;
  constructor(lib: string) {
    super(`运行环境加载失败（${lib}），请检查网络后刷新页面。`);
    this.lib = lib;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = false; // async=false：按插入顺序执行
    s.onload = () => resolve();
    s.onerror = () => {
      s.remove();
      reject(new Error('运行环境加载失败：' + src));
    };
    document.head.appendChild(s);
  });
}

const never = () => new Promise<never>(() => {}); // 静态生成时永不完成，组件什么也不做
let pending: Promise<Runtime> | null = null;
let loaded: Runtime | null = null;
let commonLoading: Promise<void> | null = null;
let consoleHandler: ((method: 'error' | 'warn', args: unknown[]) => void) | null = null;

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

/** 注册 React 包里的 console.error / console.warn 的接收函数（引擎用它识别 React 的警告）。包还没加载也可以先注册 */
export function onReact19Console(fn: (method: 'error' | 'warn', args: unknown[]) => void): void {
  consoleHandler = fn;
  const rt = (window as any).__hocReact19;
  if (rt) rt.setConsoleHook(fn);
}

async function load(base: string, assetBase: string): Promise<Runtime> {
  await Promise.all([loadCommon(base), (window as any).__hocReact19 ? Promise.resolve() : loadScript(assetBase + react19Path())]);
  const rt = (window as any).__hocReact19;
  if (!rt || !rt.React || !rt.ReactDOM) throw new Error('运行环境加载失败');
  if (consoleHandler) rt.setConsoleHook(consoleHandler);
  return { reactVersion: rt.React.version, React: rt.React, ReactDOM: rt.ReactDOM, libs: {}, libVersions: {} };
}

/** 加载运行时，返回 React / ReactDOM。只加载一次；失败后可以重试 */
export function loadRuntime(base = CDN, assetBase = BASE): Promise<Runtime> {
  if (typeof window === 'undefined') return never();
  if (pending) return pending;
  pending = load(base, assetBase).then(
    rt => {
      loaded = rt;
      return rt;
    },
    e => {
      pending = null;
      throw e;
    },
  );
  return pending;
}

/** 已加载的运行时；还没加载就抛错（实验台只会在 loadRuntime 完成之后才创建） */
export function getRuntime(): Runtime {
  if (!loaded) throw new Error('React 运行环境还没有加载');
  return loaded;
}

const libLoading = new Map<string, Promise<void>>();
/** 加载示例用到的第三方库（在 loadRuntime 完成之后调用）。已经加载过的不再请求；失败后可以重试 */
export function loadLibs(libs: LibInfo[], assetBase = BASE): Promise<void> {
  const rt = getRuntime();
  const load = (lib: LibInfo): Promise<void> => {
    if (rt.libVersions[lib.name]) return Promise.resolve();
    let p = libLoading.get(lib.name);
    if (!p) {
      // 依赖的库先加载好（本库的脚本在运行时从 window.__hocLibs 里取它们）
      p = Promise.all(libDeps(lib).map(load))
        .then(() => loadScript(assetBase + libPath(lib)))
        .then(
          () => {
            const reg = (window as any).__hocLibs?.[lib.name];
            if (!reg) throw new LibLoadError(lib.name);
            Object.assign(rt.libs, reg.modules);
            rt.libVersions[lib.name] = reg.version;
          },
          e => {
            throw e instanceof LibLoadError ? e : new LibLoadError(lib.name);
          },
        );
      libLoading.set(lib.name, p);
      p.catch(() => libLoading.delete(lib.name));
    }
    return p;
  };
  return Promise.all(libs.map(load)).then(() => {});
}

/** 注册第三方库里的 console.error / console.warn 的接收函数（库的包装脚本通过 window.__hocLibConsole 调用它） */
export function onLibConsole(fn: (lib: string, method: 'error' | 'warn', args: unknown[]) => void): void {
  (window as any).__hocLibConsole = fn;
}
