/* 实验台运行时的版本与资源地址（纯函数）。全站只有一个运行时：React 19 开发版。 */
/** 实验台的 React 版本，全站唯一的一处。必须和 package.json 里 react-runtime-19、react-dom-runtime-19 的版本一致（scripts/build-react19.mjs 会核对） */
export const REACT_VERSION = '19.3.0';

/** React 开发版打包文件的站内路径（相对站点 base）。文件名带版本号，升级后不会读到旧缓存 */
export const react19Path = (): string => `runtime/react-${REACT_VERSION}.dev.js`;
