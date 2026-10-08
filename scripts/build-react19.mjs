// 生成 docs/public/runtime/react-<版本>.dev.js：React 19 开发版 + ReactDOM（含 react-dom/client）+ scheduler，打成一个自包含的脚本。
// 来源是 node_modules 里固定版本的别名包 react-runtime-19、react-dom-runtime-19（版本见 course/engine/logic/runtime.ts），
// 与站点自己打包的 react / react-dom 是两份，互不影响。
// 这个文件不进主包，第一个实验台需要时才按需加载；它由 predev / prebuild 生成，不提交。
// 做法：不用打包器，把 CJS 文件原样包进一个小的模块表里。三处特别处理：
//   1. process.env.NODE_ENV 固定为 development（要开发版的警告和完整报错）；
//   2. 文件里的 console 换成一份副本（React 会改写 console 的方法来屏蔽探测时的日志，不能改到真正的 console 上）：console.error / warn 先交给 setConsoleHook 注册的函数（引擎靠它识别 React 自己发出的警告），再转给真正的 console；
//   3. 不写任何全局变量，只把结果登记在 window.__hocReact19 一个名字下，不碰 window.React。
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { REACT_VERSION, react19Path } from '../course/engine/logic/runtime.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require_ = createRequire(path.join(root, 'package.json'));
const pkgDir = name => path.dirname(require_.resolve(name + '/package.json'));
const want = REACT_VERSION;

const reactDir = pkgDir('react-runtime-19');
const domDir = pkgDir('react-dom-runtime-19');
const schedDir = path.dirname(createRequire(path.join(domDir, 'package.json')).resolve('scheduler/package.json'));
for (const [name, dir] of [
  ['react-runtime-19', reactDir],
  ['react-dom-runtime-19', domDir],
]) {
  const v = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version;
  if (v !== want) throw new Error(`${name} 是 ${v}，但 course/engine/logic/runtime.ts 里固定的是 ${want}，两处要一致`);
}
const mods = {
  react: path.join(reactDir, 'cjs/react.development.js'),
  scheduler: path.join(schedDir, 'cjs/scheduler.development.js'),
  'react-dom': path.join(domDir, 'cjs/react-dom.development.js'),
  'react-dom/client': path.join(domDir, 'cjs/react-dom-client.development.js'),
};
const out = path.join(root, 'docs/public', react19Path());
const body = Object.entries(mods)
  .map(([name, file]) => `__defs[${JSON.stringify(name)}] = function (module, exports, require) {\n${fs.readFileSync(file, 'utf8')}\n};`)
  .join('\n');
const text = `/* React ${want} 开发版（react + react-dom + react-dom/client + scheduler），由 scripts/build-react19.mjs 生成，不要手改。 */
(function () {
  var process = { env: { NODE_ENV: 'development' } };
  var __hook = null;
  var __real = window.console;
  var console = {};
  Object.keys(__real).forEach(function (k) {
    var f = __real[k];
    console[k] = typeof f === 'function' ? f.bind(__real) : f;
  });
  ['error', 'warn'].forEach(function (k) {
    var orig = console[k];
    console[k] = function () {
      if (__hook) try { __hook(k, Array.prototype.slice.call(arguments)); } catch (e) {}
      return orig.apply(null, arguments);
    };
  });
  var __defs = {}, __cache = {};
  function __req(name) {
    if (__cache[name]) return __cache[name].exports;
    var m = (__cache[name] = { exports: {} });
    if (!__defs[name]) throw new Error('missing module ' + name);
    __defs[name](m, m.exports, __req);
    return m.exports;
  }
${body}
  var React = __req('react');
  var ReactDOM = Object.assign({}, __req('react-dom'), __req('react-dom/client'));
  window.__hocReact19 = { version: React.version, React: React, ReactDOM: ReactDOM, setConsoleHook: function (fn) { __hook = fn; } };
})();
`;
fs.mkdirSync(path.dirname(out), { recursive: true });
if (!fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== text) fs.writeFileSync(out, text);
console.log(`react19 运行时：${path.relative(root, out)}（${(text.length / 1024).toFixed(0)} KB，React ${want}）`);
