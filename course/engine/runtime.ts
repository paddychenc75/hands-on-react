/* 实验台运行环境：React 18.3.1 开发版 UMD + ReactDOM + Babel standalone + Prism。
   版本与旧版 build.py 一致。必须是开发版：引擎靠拦截 "Warning:" 开头的 console.error 向学习者显示 React 警告。
   不放 iframe：全局的 window.React 给实验台用，站点自己打包的 React 是另一份，各自独立的 root，互不干扰。
   只加载一次；第一个实验台需要时才插入脚本。 */
const CDN = 'https://cdn.jsdelivr.net/npm/';
export const RUNTIME_LIBS = [
  'react@18.3.1/umd/react.development.js',
  'react-dom@18.3.1/umd/react-dom.development.js',
  '@babel/standalone@7.25.6/babel.min.js',
  'prismjs@1.29.0/components/prism-core.min.js',
  'prismjs@1.29.0/components/prism-markup.min.js',
  'prismjs@1.29.0/components/prism-clike.min.js',
  'prismjs@1.29.0/components/prism-javascript.min.js',
  'prismjs@1.29.0/components/prism-jsx.min.js',
];
let loading: Promise<void> | null = null;
export function loadRuntime(base = CDN): Promise<void> {
  if (typeof window === 'undefined') return new Promise<void>(() => {}); // 静态生成时永不完成，组件什么也不做
  if (loading) return loading;
  window.Prism = { manual: true }; // 先声明，防止 Prism 自动高亮整页（会动 Rspress 自己的代码块）
  loading = Promise.all(
    RUNTIME_LIBS.map(
      l =>
        new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = base + l;
          s.async = false; // async=false：按插入顺序执行，React 先于 ReactDOM
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('运行环境加载失败：' + l));
          document.head.appendChild(s);
        }),
    ),
  )
    .then(() => {
      if (!window.React || !window.ReactDOM || !window.Babel) throw new Error('运行环境加载失败');
    })
    .catch(e => {
      loading = null;
      throw e;
    });
  return loading;
}
