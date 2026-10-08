// 生成 docs/public/runtime/<库>-<版本>.dev.js：实验台里可以 import 的第三方库（见 LIBS）的开发版，各打成一个自包含的脚本。
// 库的名字和固定版本在 course/engine/logic/runtime.ts 的 LIBS（同时核对 package.json 里装的版本一致）。
// 关键约束：库不能自带第二份 React，否则 Hook 会报错。所以 react、react-dom、react/jsx-runtime 等标为外部依赖，
// 脚本加载时解析到实验台那一份 React 19（window.__hocReact19，由 build-react19.mjs 生成，必须先加载）。
// 登记：window.__hocLibs[包名] = { version, modules: { 导入路径: 模块对象 } }。不写别的全局变量。
// 库里的 console.warn / console.error 经 window.__hocLibConsole（引擎注册）显示在当前实验台的控制台里。
// 产物不提交，由 predev / prebuild 生成。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { LIBS, libPath, libDeps } from '../course/engine/logic/runtime.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 外部依赖 → 实验台 React 的哪个对象
const EXTERNAL = {
  react: 'React',
  'react/jsx-runtime': 'jsxRuntime',
  'react/jsx-dev-runtime': 'jsxRuntime',
  'react-dom': 'ReactDOM',
  'react-dom/client': 'ReactDOM',
};
const externalPlugin = {
  name: 'hoc-react-external',
  setup(b) {
    b.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, args => {
      if (!(args.path in EXTERNAL)) throw new Error(`库里引用了 ${args.path}，实验台没有提供：先在 build-libs.mjs 的 EXTERNAL 里登记`);
      return { path: args.path, namespace: 'hoc-ext' };
    });
    b.onLoad({ filter: /.*/, namespace: 'hoc-ext' }, args => ({
      contents: `module.exports = window.__hocReact19.${EXTERNAL[args.path]};`,
      loader: 'js',
    }));
  },
};

// 库依赖别的库（deps）时，对它的 import 解析到那个库已加载的同一份模块（window.__hocLibs[包名].modules[路径]），加载顺序由引擎保证
function depPlugin(lib) {
  const specs = new Map(); // import 路径 → 包名
  for (const d of libDeps(lib)) for (const spec of d.specifiers) specs.set(spec, d.name);
  return {
    name: 'hoc-dep-external',
    setup(b) {
      b.onResolve({ filter: /.*/ }, args => (specs.has(args.path) ? { path: args.path, namespace: 'hoc-dep' } : undefined));
      b.onLoad({ filter: /.*/, namespace: 'hoc-dep' }, args => ({
        contents: `module.exports = window.__hocLibs[${JSON.stringify(specs.get(args.path))}].modules[${JSON.stringify(args.path)}];`,
        loader: 'js',
      }));
    },
  };
}

for (const lib of LIBS) {
  const pkgJson = path.join(root, 'node_modules', lib.name, 'package.json');
  const v = JSON.parse(fs.readFileSync(pkgJson, 'utf8')).version;
  if (v !== lib.version) throw new Error(`${lib.name} 装的是 ${v}，但 course/engine/logic/runtime.ts 的 LIBS 里固定的是 ${lib.version}，两处要一致`);
  const entry = lib.specifiers
    .map((spec, i) => `import * as m${i} from ${JSON.stringify(spec)};`)
    .concat(
      `window.__hocLibs = window.__hocLibs || {};`,
      `window.__hocLibs[${JSON.stringify(lib.name)}] = { version: ${JSON.stringify(lib.version)}, modules: {`,
    )
    .concat(
      lib.specifiers.map((spec, i) => `  ${JSON.stringify(spec)}: m${i},`),
      '} };',
    )
    .join('\n');
  const res = await build({
    stdin: { contents: entry, resolveDir: root, loader: 'js' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    conditions: ['development'],
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [externalPlugin, depPlugin(lib)],
    metafile: true,
    logLevel: 'warning',
  });
  // 防止悄悄打进第二份：依赖的库（及其依赖）的代码不能出现在本库的文件里
  for (const d of libDeps(lib)) {
    const dup = Object.keys(res.metafile.inputs).filter(f => f.startsWith(`node_modules/${d.name}/`));
    if (dup.length)
      throw new Error(`${lib.name} 的文件里打进了 ${d.name} 的代码（${dup[0]}）：它的 import 路径没有登记在 ${d.name} 的 specifiers 里，会变成第二份实例`);
  }
  const body = res.outputFiles[0].text;
  const text = `/* ${lib.name} ${lib.version} 开发版（react、react-dom 使用实验台的 React 19 实例），由 scripts/build-libs.mjs 生成，不要手改。 */
(function () {
  var __real = window.console;
  var console = {};
  Object.keys(__real).forEach(function (k) {
    var f = __real[k];
    console[k] = typeof f === 'function' ? f.bind(__real) : f;
  });
  ['error', 'warn'].forEach(function (k) {
    var orig = console[k];
    console[k] = function () {
      if (window.__hocLibConsole) try { window.__hocLibConsole(${JSON.stringify(lib.name)}, k, Array.prototype.slice.call(arguments)); } catch (e) {}
      return orig.apply(null, arguments);
    };
  });
${body}
})();
`;
  const out = path.join(root, 'docs/public', libPath(lib));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (!fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== text) fs.writeFileSync(out, text);
  console.log(`${lib.name} ${lib.version}：${path.relative(root, out)}（${(text.length / 1024).toFixed(0)} KB）`);
}
