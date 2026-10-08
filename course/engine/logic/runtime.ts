/* 实验台运行时的版本与资源地址（纯函数）。全站只有一个 React 运行时：React 19 开发版。
   另外有两个可以在示例里 import 的第三方库（react-router、@tanstack/react-query），它们也是固定版本的开发版，只在示例用到时才按需加载。 */
/** 实验台的 React 版本，全站唯一的一处。必须和 package.json 里 react-runtime-19、react-dom-runtime-19 的版本一致（scripts/build-react19.mjs 会核对） */
export const REACT_VERSION = '19.3.0';

/** React 开发版打包文件的站内路径（相对站点 base）。文件名带版本号，升级后不会读到旧缓存 */
export const react19Path = (): string => `runtime/react-${REACT_VERSION}.dev.js`;

export interface LibInfo {
  /** npm 包名，也是示例里 import 的名字 */
  name: string;
  /** 固定的版本。必须和 package.json 里同名包的版本一致（scripts/build-libs.mjs 会核对） */
  version: string;
  /** 打包文件名里的短名 */
  slug: string;
  /** 示例里可以 import 的路径，第一个是主入口 */
  specifiers: string[];
}

/** 实验台支持的第三方库。升级版本、再加一个库的步骤见 AGENTS.md「实验台运行时」 */
export const LIBS: LibInfo[] = [
  { name: 'react-router', version: '8.4.0', slug: 'react-router', specifiers: ['react-router', 'react-router/dom'] },
  { name: '@tanstack/react-query', version: '5.104.1', slug: 'tanstack-query', specifiers: ['@tanstack/react-query'] },
  {
    name: 'zustand',
    version: '5.0.15',
    slug: 'zustand',
    specifiers: ['zustand', 'zustand/middleware', 'zustand/react/shallow', 'zustand/shallow', 'zustand/vanilla'],
  },
];

/** 库打包文件的站内路径（相对站点 base） */
export const libPath = (lib: LibInfo): string => `runtime/${lib.slug}-${lib.version}.dev.js`;

/** import 的路径对应哪个库；不是库返回 undefined */
export const libOf = (specifier: string): LibInfo | undefined => LIBS.find(l => l.specifiers.includes(specifier));

/** 示例代码里 import 了哪些库（按 import 语句判断，注释和字符串里的不算） */
export function libsInSource(source: string): LibInfo[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
  const found = new Set<LibInfo>();
  for (const m of code.matchAll(/^\s*import\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/gm)) {
    const lib = libOf(m[1]);
    if (lib) found.add(lib);
  }
  return LIBS.filter(l => found.has(l));
}
