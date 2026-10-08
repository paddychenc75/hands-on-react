/* 实验台运行环境（course/engine/runtime.ts 动态加载）放在 window 上的全局：Babel、Prism（CDN 的 UMD 脚本，没有现成类型，按 any 声明）。
   React 19 开发版登记在 window.__hocReact19 一个名字下，不写 window.React；引擎通过 Runtime 对象显式传给学习者的代码。 */
interface Window {
  Babel: any;
  Prism: any;
  __hocReact19?: any;
}

declare const Babel: any;
