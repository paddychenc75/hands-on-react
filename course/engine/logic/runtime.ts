/* 实验台运行时的选择规则（纯函数）：一课用哪个 React、对应的资源地址。
   课的数据文件可以写 `runtime: 19`；不写就是 18。 */
export type RuntimeVersion = 18 | 19;
export const DEFAULT_RUNTIME: RuntimeVersion = 18;
/** 各运行时固定的具体版本。19 的版本必须和 package.json 里 react-runtime-19、react-dom-runtime-19 的版本一致（scripts/build-react19.mjs 会核对） */
export const REACT_VERSIONS: Record<RuntimeVersion, string> = { 18: '18.3.1', 19: '19.3.0' };

/** 一课的运行时：数据里的 `runtime` 字段，缺省为 18；写了不认识的值也按 18 处理（check:content 会报错） */
export function runtimeOf(lesson?: { runtime?: number } | null): RuntimeVersion {
  return lesson && lesson.runtime === 19 ? 19 : DEFAULT_RUNTIME;
}

/** React 19 开发版打包文件的站内路径（相对站点 base）。文件名带版本号，升级后不会读到旧缓存 */
export const react19Path = (): string => `runtime/react-${REACT_VERSIONS[19]}.dev.js`;
