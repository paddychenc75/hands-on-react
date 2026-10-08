/* 代码预处理与编译：从引擎里拆出来，练习的检查函数（course/lessons/*.ts）也要用，而它们不能反过来依赖引擎（会形成循环引用）。 */
import { libOf } from './logic/runtime.ts';

export const HOOK_NAMES = [
  'useState',
  'useEffect',
  'useLayoutEffect',
  'useRef',
  'useMemo',
  'useCallback',
  'useContext',
  'useReducer',
  'useId',
  'useTransition',
  'useDeferredValue',
  'useSyncExternalStore',
  'useImperativeHandle',
  'useInsertionEffect',
  'useDebugValue',
  'createContext',
  'createElement',
  'memo',
  'lazy',
  'Suspense',
  'Component',
  'PureComponent',
  'Fragment',
  'forwardRef',
  'startTransition',
  'createRef',
  'Children',
  'cloneElement',
  'isValidElement',
  'StrictMode',
  'Profiler',
];

/** 编译时要用的运行时：`React` 判断 'react' 的具名导入存在不存在，`ReactDOM` 判断 react-dom 的具名导入存在不存在 */
export interface PrepareRuntime {
  React: any;
  ReactDOM: any;
  /** 已加载的第三方库，键是 import 的路径（'react-router'、'@tanstack/react-query'…）。缺省表示一个库都没加载 */
  libs?: Record<string, any>;
}

/** import 语句里的绑定部分（`{ a, b as c }`、`* as X`、`X`、`X, { a }`）转成一行解构声明，库的模块对象从 __libs 里取 */
function libBindings(what: string, spec: string): string {
  const out: string[] = [];
  const braces = what.match(/\{([\s\S]*)\}/);
  const rest = what
    .replace(/\{[\s\S]*\}/, '')
    .replace(/,\s*$/, '')
    .trim();
  const ns = rest.match(/^\*\s+as\s+([\w$]+)$/);
  const def = ns ? null : rest.match(/^([\w$]+)$/);
  const mod = '__libs[' + JSON.stringify(spec) + ']';
  if (ns) out.push('const ' + ns[1] + ' = ' + mod + ';');
  if (def) out.push('const ' + def[1] + ' = ' + mod + ';');
  if (braces) {
    const names = braces[1]
      .split(',')
      .map(x => x.trim())
      .filter(x => x && !/^type\s/.test(x))
      .map(x => x.replace(/\s+as\s+/, ': '));
    if (names.length) out.push('const { ' + names.join(', ') + ' } = ' + mod + ';');
  }
  return out.join('\n');
}

export function prepare(source: string, exportNames: string[] | undefined, rt: PrepareRuntime): string {
  const dom = rt.ReactDOM;
  const imported = new Set<string>();
  const fromDom = new Set<string>();
  const libLines: string[] = [];
  const code = source
    .replace(/^\s*import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?/gm, (_m: string, what: string, from: string) => {
      const lib = libOf(from);
      if (lib) {
        if (!rt.libs || !rt.libs[from]) throw new Error(lib.name + ' 还没有加载。请刷新页面，或点“▶ 运行”重试。');
        if (!/^type\s/.test(what.trim())) libLines.push(libBindings(what, from));
        return '';
      }
      if (from === 'react' || from === 'react-dom' || from === 'react-dom/client') {
        const braces = what.match(/\{([\s\S]*)\}/);
        if (braces)
          braces[1]
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .forEach(s => {
              const [orig, alias] = s.split(/\s+as\s+/).map(x => x.trim());
              imported.add(alias ? orig + ': ' + alias : orig);
              if (from !== 'react') fromDom.add(alias ? orig + ': ' + alias : orig);
            });
      }
      return '';
    })
    .replace(/^\s*import\s+['"][^'"]+['"];?/gm, '')
    .replace(/^\s*export\s+default\s+(?=function|class)/gm, '')
    .replace(/^\s*export\s+(?=function|const|let|class)/gm, '');
  const compiled = window.Babel.transform(code, {
    presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
    sourceType: 'script',
    filename: 'App.jsx',
  }).code;
  const names = [...imported];
  // 新 API（use、useActionState、useOptimistic、Activity、ViewTransition…）不在 HOOK_NAMES 里：只要运行时的 React 真有这个导出就取出来
  const reactNames = names.filter(n => {
    const k = n.split(':')[0].trim();
    return HOOK_NAMES.includes(k) || (!fromDom.has(n) && k in rt.React);
  });
  // react-dom 的具名导入（createPortal、flushSync 等）从 ReactDOM 取
  const domNames = names.filter(n => fromDom.has(n) && !HOOK_NAMES.includes(n.split(':')[0].trim()) && n.split(':')[0].trim() in dom);
  const head =
    (libLines.length ? libLines.join('\n') + '\n' : '') +
    (reactNames.length ? 'const { ' + reactNames.join(', ') + ' } = React;\n' : '') +
    (domNames.length ? 'const { ' + domNames.join(', ') + ' } = ReactDOM;\n' : '');
  const ex = (exportNames || []).map(n => JSON.stringify(n) + ': typeof ' + n + " !== 'undefined' ? " + n + ' : undefined').join(', ');
  return head + compiled + "\n;return { App: typeof App !== 'undefined' ? App : undefined, exports: { " + ex + ' } };';
}

// 优先使用 new Function；若环境禁止 eval，则退回到注入 <script> 的方式
let evalAllowed: boolean | null = null;
export function compile(params: string[], body: string): (...args: any[]) => any {
  if (evalAllowed !== false) {
    try {
      const f = new Function(...params, body) as (...args: any[]) => any;
      evalAllowed = true;
      return f;
    } catch (e) {
      if (e instanceof SyntaxError) throw e;
      evalAllowed = false;
    }
  }
  const key = '__pg' + Math.random().toString(36).slice(2);
  const s = document.createElement('script');
  s.textContent = 'window.' + key + ' = function(' + params.join(',') + '){' + body + '\n};';
  document.head.appendChild(s);
  s.remove();
  const f = (window as any)[key];
  delete (window as any)[key];
  if (!f) throw new Error('代码无法执行（可能存在语法错误）');
  return f;
}

// 检查代码时先去掉注释，避免“把答案写在注释里”也能通过
export function stripComments(src: string): string {
  return src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}
