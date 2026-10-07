/* 实验台运行环境（course/engine/runtime.ts 动态加载）放在 window 上的全局：React 18 开发版、ReactDOM、Babel、Prism。
   它们来自 CDN 的 UMD 脚本，没有现成类型，所以这里按 any 声明（这是整个工程里唯一的"外部全局"入口）。 */
interface Window {
  React: any;
  ReactDOM: any;
  Babel: any;
  Prism: any;
}

/** 练习的检查函数在实验台里运行，代码里会用到实验台的 ReactDOM 全局（React 由 @types/react 的 UMD 声明提供） */
declare const ReactDOM: any;
declare const Babel: any;
