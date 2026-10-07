# 第一阶段技术审校（lessons-1.js + 相关术语表条目）

审校范围：`src/lessons-1.js`（what-is-react、jsx、components-props、state、events、conditional、lists-keys、forms），以及 `src/glossary.js` 中与这些主题相关的条目。

总体结论：第一阶段的内容整体准确。它没有用到过时的 API：没有 `ReactDOM.render`，没有 class 组件，函数组件的默认值用的是解构默认值，没有用 `defaultProps`。下面列出 6 个问题。其中 1 个是演示代码的实际显示和意图不符，其余是过时或有歧义的说法。

---

## 1. 【错误】jsx：演示代码里的 `<> </>` 被解析成真实片段，不会显示成文字

- 位置：`src/lessons-1.js:130`
- 原文：

  ```jsx
  <h3 ...>
    片段 <> </> 不会产生多余的 DOM 节点
  </h3>
  ```

- 问题：JSX 子文本里的 `<> </>` 不是文字。Babel 把它解析成一个片段元素，里面只有一个空格。我用课程使用的同一版本 `@babel/standalone@7.25.6` 编译过，结果是：
  `createElement("h3", {...}, "片段 ", createElement(React.Fragment, null, " "), " 不会产生多余的 DOM 节点")`。
  所以页面显示的是“片段   不会产生多余的 DOM 节点”，`<> </>` 不会出现。学习者会以为代码坏了，或者以为 JSX 文本里可以直接写 `<`。
- 依据：https://react.dev/learn/writing-markup-with-jsx （JSX 中 `<` 开始一个标签）；本地 Babel 编译结果如上。
- 建议：要显示尖括号，把它放进字符串表达式。例如：

  ```jsx
  片段 {'<></>'} 不会产生多余的 DOM 节点
  ```

  可以再加一条短提示：“JSX 文本里不能直接写 <。要显示它，写成 {'<'}。”

---

## 2. 【过时】jsx：“JSX 会被编译成 React.createElement”

- 位置：`src/lessons-1.js:89-93`、`:137`、`:140`（测验第 1 题）；`src/glossary.js:4`
- 原文：
  - `:89` “在运行前，编译工具（如 Babel）会把它翻译成普通的函数调用”
  - `:90-91` “// 上面那行 JSX 会被编译成：const element = React.createElement('h1', { className: 'title' }, '你好');”
  - `:93` 图注“JSX 只是 createElement 的语法糖”
  - `:140` 正确选项“React.createElement 调用，返回一个普通对象”
  - `glossary.js:4` “编译后是 createElement 调用。”
- 问题：从 React 17 起，新的 JSX 转换已是主流工具链（Vite、Next.js、TypeScript `react-jsx`、Babel 8）的默认设置。JSX 会被编译成从 `react/jsx-runtime` 自动导入的 `jsx()` / `jsxs()` 调用，不再是 `React.createElement`。`createElement` 仍可用，但不再是 JSX 的编译目标。说“只是 createElement 的语法糖”已经不是现在的事实。
  说明：课程运行环境用的是 Babel 7 standalone 的 classic 模式，它确实输出 `createElement`。所以运行环境本身没问题，只是正文的说法应更新。
- 依据：
  - https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html （新转换输出 `_jsx('h1', { children: ... })`，来自 `react/jsx-runtime`）
  - https://babeljs.io/docs/babel-preset-react （`runtime` 默认值为 `automatic`）
- 建议替换：
  - `:89-91` 正文：“浏览器不认识 JSX。编译工具会把它翻译成普通的函数调用。现在的工具链默认生成 `jsx()` 调用。老写法是 `React.createElement()`。两者作用相同。”
  - 代码注释可改为：`// 现代工具链：jsx('h1', { className: 'title', children: '你好' })`，`// 老写法：React.createElement('h1', { className: 'title' }, '你好')`
  - `:93` 图注：“JSX 是创建元素的函数调用的语法糖”
  - `:137`：“因为 JSX 会变成一次函数调用。一个函数只能返回一个值。”
  - `:140` 正确选项：“一次创建元素的函数调用，返回一个普通对象”。解释：“JSX 被编译成函数调用（jsx() 或 createElement()）。它返回一个普通 JS 对象，叫 React 元素。”
  - `glossary.js:4`：“编译后是创建 React 元素的函数调用。”

---

## 3. 【有歧义】jsx：“属性用驼峰命名”没有提到例外

- 位置：`src/lessons-1.js:120`
- 原文：`['属性用驼峰命名', 'onclick、tabindex', 'onClick、tabIndex']`
- 问题：这条被写成“硬规则”。但 `aria-*` 和 `data-*` 属性在 JSX 里仍然保留短横线，例如 `aria-label`、`data-id`。学习者按这条规则写 `ariaLabel`，属性会无效，React 还会警告。
- 依据：https://react.dev/learn/writing-markup-with-jsx （“For historical reasons, aria-* and data-* attributes are written as in HTML with dashes.”）
- 建议：在表格下补一句：“例外：`aria-*` 和 `data-*` 保留短横线。例如 `aria-label`、`data-id`。”

---

## 4. 【有歧义】glossary：“重新渲染”的触发条件写了“props 变化”

- 位置：`src/glossary.js:8`
- 原文：“state、props 或 Context 变化后，React 再次调用组件函数。”
- 问题：react.dev 写明的渲染原因只有两个：首次渲染；组件自己或某个祖先的 state 更新。父组件重新渲染时，子组件默认也会重新渲染，不论 props 有没有变化。把“props 变化”写成触发条件，会让学习者以为 props 不变子组件就不会重新渲染。这是一个常见误解，也会影响后面讲 `memo` 的部分。
- 依据：https://react.dev/learn/render-and-commit （“The component's (or one of its ancestors') state has been updated.”）
- 建议替换：“组件自己或某个祖先组件的 state 变化后，React 再次调用组件函数。Context 值变化也会触发它。”

---

## 5. 【有歧义】glossary：Hook 的定义“只能在组件顶层调用”

- 位置：`src/glossary.js:13`
- 原文：“以 use 开头、只能在组件顶层调用的函数，例如 useState。”
- 问题：
  1. Hook 也可以在自定义 Hook 的顶层调用。下一条“自定义 Hook”就和这句矛盾。
  2. React 19 的 `use` 以 use 开头，但它可以在 `if` 和循环里调用。官方说它“不是 Hook”。
- 依据：
  - https://react.dev/reference/rules/rules-of-hooks
  - https://react.dev/reference/react/use （“Unlike Hooks, it can be called inside loops and conditional statements like if.”）
- 建议替换：“以 use 开头的特殊函数，例如 useState。只能在组件或自定义 Hook 的顶层调用。（React 19 的 use 是例外。）”

---

## 6. 【有歧义】events：“合成事件在所有浏览器中行为一致”（轻微）

- 位置：`src/lessons-1.js:446`
- 原文：“React 包装了浏览器的原生事件，叫合成事件（SyntheticEvent）。它在所有浏览器中行为一致。”
- 问题：官方的说法要保守一些：合成事件遵循 DOM 事件标准，并修复了一部分浏览器差异。它不保证完全一致。另外，部分 React 事件和原生事件不是一一对应的（例如 `onMouseLeave` 底层是 `mouseout`）。这一条影响很小，可以选择性修改。
- 依据：https://react.dev/reference/react-dom/components/common#react-event-object （“It conforms to the same standard as the underlying DOM events, but fixes some browser inconsistencies.”）
- 建议替换：“它遵循 DOM 事件标准，并修复了一些浏览器差异。需要原生事件时，用 `e.nativeEvent`。”

---

## 已核对、没有问题的内容

- what-is-react：React 是构建 UI 的 JS 库，由 Meta 开源；声明式和命令式的对比；UI = f(state)；单向数据流；两道测验的答案都正确。
- jsx：花括号里只能放表达式，不能放 if/for/let（测验答案 2 正确）；单个根元素以及 react.dev 对它的解释；标签必须闭合；class → className 的原因（保留字，和 DOM 属性同名）；style 接收对象，CSS 属性写成驼峰，数字自动加 px；`htmlFor`；`<></>` 是 `React.Fragment` 的简写；React 元素是普通对象（省略 `$$typeof`、`key` 属于可以接受的简化）。
- components-props：组件名必须大写开头的原因；props 只读；用解构默认值代替 `defaultProps`（符合 React 19，函数组件的 defaultProps 已移除）；`children`；三道测验的答案都正确。
- state：普通变量不能当 state 的两个原因；失败计数器里 console 值会递增、界面不变（描述正确）；状态快照；连续三次 `setCount(count + 1)` 的结果是 1；更新函数会排队；用 `Object.is` 比较，直接修改原对象不会触发更新；不可变更新的写法；测验答案都正确。
- events：传函数和调用函数的区别；`e.target`、`preventDefault`、`stopPropagation`、`e.key`；冒泡演示；React 中 `return false` 不能阻止默认行为（正确）；`handleXxx` / `onXxx` 命名约定。
- conditional：if 提前返回、三元、`&&`；`0 && x` 会渲染出 0；组件可以返回 `null`、`false`、`undefined`（React 18 起允许 `undefined`）；测验答案都正确。
- lists-keys：map/filter；key 在兄弟元素之间唯一、要稳定、不要用 `Math.random()`；index 作为 key 的错位演示（非受控 input 会按位置复用，描述正确）；key 不会作为 prop 传入；改变 key 会重置组件状态；测验答案都正确。
- forms：受控组件；只有 `value` 没有 `onChange` 时输入框只读，并且控制台会警告；select 的 `value`；复选框用 `checked`；计算属性名；`preventDefault`；非受控组件用 ref 或 FormData，文件输入框在 React 中总是非受控的；React 19 的表单 Actions 用 FormData 读取值（说法合理）。
- 练习的测试逻辑：8 个练习的参考答案都能通过各自的测试，测试检查的内容和任务描述一致。
- glossary：组件、props、state、渲染、提交、挂载、卸载、事件处理函数、受控组件、key 这些条目的定义准确。
