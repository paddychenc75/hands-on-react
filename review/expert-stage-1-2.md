# 第一、二阶段教学质量审查（React 专家 + 教学视角）

审查范围：`src/lessons-1.js`（8 课）、`src/lessons-2.js`（6 课）、`src/lessons-predict.js` 中对应的预测题，以及 `src/app.js` 中热身、预测、测验、练习、提示阶梯、阶段测验的实现。
不重复 `review/stage-1.md`、`review/stage-2.md` 已列出的技术问题。
尊重原有设计：先预测再运行、提取练习、间隔复习、交错阶段测验、渐隐提示、自我解释、ASD-STE100 风格中文。

优先级：**高** = 会教错模型、或练习可以“错的也能过”；**中** = 明显影响学习效果；**低** = 打磨。
每条都写明：课程 id、位置、问题、为什么重要、改法。小而安全的改动排在前面。

---

## 一、小而安全的修正（建议先做）

### 1. 【高】预测题的正确答案几乎都在 B，而且选项不打乱
- 位置：`src/lessons-predict.js:5,10,15,20,25,30`（本阶段 6 题全部 `answer: 1`）；`src/app.js:264`（`predict.options.forEach((o, oi) => ... 'ABCD'[oi])`，没有打乱）
- 问题：12 道预测题里 11 道答案是 B。测验题会打乱顺序，预测题不会。
- 为什么重要：学习者做两三题就会发现“选 B 就对”。预测的价值在于先在脑中运行代码，这个规律会让它失效。
- 改法（任选其一）：
  - 在 `makePlayground` 里用种子随机打乱：`const order = shuffled(predict.options.length, seeded(predictKey));`，按 `order` 渲染，保存时仍存原始下标 `oi`。`showVerdict` 不用改。
  - 或直接调整数据，让答案分布在 A–D。

### 2. 【高】use-ref 练习：不用 ref 也能通过
- 位置：`src/lessons-2.js:339`（starter 已含 `import { useRef }`）、`:363`（`/useRef/.test(t.source)`）
- 问题：starter 第一行就有 `useRef`，所以这条检查永远成立。下面的错误写法能通过：
  ```jsx
  <button onClick={() => document.getElementById('field').focus()}>聚焦</button>
  ```
- 为什么重要：本课目标就是“用 ref 操作 DOM”。用 `getElementById` 正是 React 新手最该改掉的习惯。
- 改法：
  ```js
  const code = t.source.replace(/^\s*import.*$/gm, '');
  t.assert(/useRef\(/.test(code), '请调用 useRef() 创建 ref');
  t.assert(/<input[^>]*\bref=\{/.test(code), '请把 ref 绑定到 <input>');
  t.assert(!/getElementById|querySelector/.test(code), '不要直接查询 DOM，请通过 ref.current 访问');
  ```

### 3. 【高】context 练习：不写 Provider 也能通过
- 位置：`src/lessons-2.js:518-521`
- 问题：`const UserContext = createContext('小李');`，再不写任何 Provider，`useContext` 读到默认值“小李”，三条断言全部通过。另外 `<Welcome {...props} />` 这种展开写法能绕过“不要用 props 传递”的检查（正则只匹配 `\w+=`）。
- 为什么重要：“提供”是三步里最重要的一步，而且“默认值只在没有 Provider 时生效”是常见误解。
- 改法：
  ```js
  t.assert(!/createContext\(\s*['"`]小李/.test(t.source), '默认值不要写“小李”。请用 Provider 提供它');
  t.assert(/<UserContext(\.Provider)?\s+value=/.test(t.source), '请在 App 中用 Provider 提供 value="小李"');
  t.assert(!/<Welcome\s+[\w{]/.test(t.source), '不要通过 props 传给 Welcome');
  ```
  任务第 1 步补一句：“默认值写 <b>游客</b>。”

### 4. 【高】lists-keys 练习：正确的解构写法会失败，错误写法会通过
- 位置：`src/lessons-1.js:706`（`/key=\{\s*\w+\.id\s*\}/`）
- 问题：
  - 正确但失败：`.map(({ id, title }) => <li key={id}>{title}</li>)`。解构写法很常见，本课程自己也在第 3 课教了解构。
  - 错误但通过：把 `key={t.id}` 写在注释里，或写在 `<li>` 里面的子元素上。
- 改法：
  ```js
  const code = t.source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  t.assert(/<li[^>]*\bkey=\{\s*(\w+\.)?id\s*\}/.test(code), '请在 <li> 上用 id 作为 key，例如 key={t.id}');
  ```

### 5. 【高】lifting-state：“下一课的 Context”指错了课
- 位置：`src/lessons-2.js:212`
- 问题：下一课是 useRef（第 11 课），Context 是第 12 课。
- 改法：“……可以用第 12 课的 <b>Context</b> 解决。”或“稍后的 Context 一课”。（如果采纳第 54 条重排课序，再按新顺序改。）

### 6. 【中】术语表 state 定义与“不可变更新”冲突
- 位置：`src/glossary.js:6`
- 问题：“修改它会触发重新渲染。”但第 4 课正好强调：直接修改对象（`user.age++`）**不会**触发重新渲染。
- 为什么重要：术语表每课都悬浮显示。这句话和最重要的坑正面矛盾。
- 改法：“组件自己保存、会变化的数据。用 set 函数传入新值，才会触发重新渲染。”

### 7. 【中】setter 的叫法不统一
- 位置：`src/lessons-1.js:306`（setter 函数）、`:312`（修改函数）、`:352`（函数式更新）；`src/lessons-2.js:217,326,422`
- 问题：同一个东西有“setter 函数”“修改函数”“setter”三种说法，术语表里没有这一条。违反“一词一义”。
- 改法：术语表加一条 `{ term: 'set 函数', en: 'set function', def: 'useState 返回的第二个值。传入新值或更新函数，请求一次重新渲染。', avoid: 'setter、修改函数' }`，正文统一替换。“函数式更新”保留，专指 `setX(prev => ...)`。

### 8. 【中】events 示例在“顶部插入”的列表上用 index 当 key
- 位置：`src/lessons-1.js:453,460`
- 问题：`setLog(l => [msg, ...l])` 往顶部插入，同时 `key={i}`。这正是第 7 课演示的 bug 场景。示例会被复制。
- 改法：
  ```jsx
  let nextId = 0; // 放在组件外
  const add = (msg) => setLog(l => [{ id: nextId++, msg }, ...l].slice(0, 5));
  <ul>{log.map(m => <li key={m.id}>{m.msg}</li>)}</ul>
  ```

### 9. 【中】use-reducer 主示例的 reducer 不纯，再用 tip 说“这是错的”
- 位置：`src/lessons-2.js:557`、`:601`
- 问题：主示例在 reducer 里调用 `Date.now()`，下方 tip 再说明正确做法是在 dispatch 前生成 id。学习者复制的是代码，不是 tip。
- 改法：直接改示例，tip 只保留规则：
  ```js
  let nextId = 3; // 组件外
  case 'added':
    return [...todos, { id: action.id, text: action.text, done: false }];
  // 提交时：
  dispatch({ type: 'added', id: nextId++, text });
  ```
  tip 改为：“reducer 必须是纯函数……所以 id 在 dispatch 之前生成，放进 action。”

### 10. 【中】lists-keys 示例用 `items.length + 1` 生成 id
- 位置：`src/lessons-1.js:648`
- 问题：一旦有删除，用长度算出的 id 会重复。这个写法会被复制到 todo 练习和实战项目里。
- 改法：组件外 `let nextId = 3;`，插入时用 `nextId++`。加注释：“// 不要用 items.length 生成 id：删除后会重复。”

### 11. 【中】use-ref 秒表没有卸载清理
- 位置：`src/lessons-2.js:304-311`
- 问题：上一课刚讲“定时器必须清理”。这里组件卸载时 interval 不会停（运行框自己会清理，所以看不出来）。
- 改法：加一行并注释：
  ```js
  useEffect(() => () => clearInterval(timerRef.current), []); // 卸载时停表
  ```
  （需要 `import { useEffect }`。）

### 12. 【中】forms 测验解析说“控制台会警告”，运行框里看不到
- 位置：`src/lessons-1.js:776`；根因见第 13 条
- 改法：解析改为“React 会在浏览器开发者工具的控制台给出警告（本页运行框使用生产版 React，看不到这条警告）”。或者按第 13 条换开发版。

---

## 二、跨课问题

### 13. 【高】运行环境是 React 生产版：错误信息被压缩，开发警告全部消失
- 位置：`src/build.py:5`（`react.production.min.js`、`react-dom.production.min.js`）；`src/app.js:85-92`（`explainError` 不解码错误码）
- 问题：生产版的 React 会把错误变成 `Minified React error #31; visit https://reactjs.org/docs/error-decoder.html?...`。新手最常犯的错误都会显示成这种文字：
  - `function Greeting(name)` 后渲染 `{name}` → #31（对象不能作为子元素）
  - `onClick={setOn(!on)}` → #301（渲染次数过多）
  - 在提前 return 之后调用 Hook → #300 / #310
  - 组件名小写、忘了导出 → #130
  同时，key 缺失、只有 value 没有 onChange 等开发警告完全不会出现。
- 为什么重要：入门阶段，读懂错误信息就是学习本身。课程多处让学习者“看看控制台”或说“React 会警告”，实际都看不到。
- 改法（两步，第一步就够用）：
  1. 小改：在 `explainError` 中把常见错误码翻译成中文。
     ```js
     const CODES = {
       31: '不能直接渲染对象。检查 {} 里是不是放了一个对象（例如忘了解构 props：应写 ({ name })）。',
       130: '组件类型无效。组件名要大写开头，并且确实定义了。',
       300: 'Hook 数量比上次少。检查是否在提前 return 或 if 之后调用了 Hook。',
       310: 'Hook 数量比上次多。检查是否在 if 里调用了 Hook。',
       301: '渲染次数过多。检查是否写成了 onClick={setX(...)}（在渲染时就调用了）。',
     };
     const mm = msg.match(/Minified React error #(\d+)/);
     if (mm && CODES[mm[1]]) msg = CODES[mm[1]] + '\n（React 错误 #' + mm[1] + '）';
     ```
  2. 更好：换成 `umd/react.development.js` 和 `umd/react-dom.development.js`，并在 `Runner.run` 期间把 `window.console.error/warn` 转发到当前运行框的控制台（只转发以 `Warning:` 开头的消息）。这样 key 警告、受控组件警告都能看到，`Rendered fewer hooks than expected` 等原文也能显示。

### 14. 【中】`t.source` 的正则检查都没有去掉注释
- 位置：`src/lessons-1.js:167,706`；`src/lessons-2.js:153,363,520-521`
- 问题：所有“源码必须包含 X”的检查，都能用一行注释骗过。例如 use-effect 练习只要写 `// clearInterval` 就算“写了清理函数”。
- 改法：在 `makeTester`（`src/app.js:294`）里提供 `code: source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '').replace(/\{\s*\}/g, '')`，所有练习改用 `t.code`。（JSX 注释 `{/* */}` 去掉后剩下 `{}`，第二个 replace 处理它。）

### 15. 【中】第一级“提示”大多直接给出完整答案，渐隐阶梯失效
- 位置：`src/lessons-1.js:163,275,407,701`；`src/lessons-2.js:150,255,360,517`
- 问题：阶梯是“提示 → 半成品 → 答案”。但很多第一级提示已经是完整代码，例如 lists-keys：`todos.filter(t => !t.done).map(t => <li key={t.id}>{t.title}</li>)`。半成品示例反而比提示给得少。
- 为什么重要：渐隐的意义是让学习者用最少的帮助完成。第一级给完整答案，等于跳过了后两级。
- 改法：第一级只给思路或提问，不给代码。示例：
  - lists-keys：“分两步想：哪个数组方法能‘留下’一部分元素？哪个能把每一项‘变成’一个 <li>？key 用哪个字段最稳定？”
  - use-ref：“三件事：创建 ref；把它交给 input 的哪个属性？点击时，DOM 节点在 ref 的哪个字段里？”
  - context：“回到正文的‘三步使用 Context’：你缺的是哪一步？”
  - state：“useState 返回两个值。一个用来显示，一个用来在点击时更新。”

### 16. 【中】有两道测验和同课预测题一模一样，考的是记住答案
- 位置：`src/lessons-1.js:376` 与 `src/lessons-predict.js:8-12`；`src/lessons-1.js:569` 与 `src/lessons-predict.js:18-22`
- 问题：学习者几分钟前刚在预测题看到答案。测验又问同一个问题，只能检验短时记忆，不能检验迁移。阶段测验也从这些题里抽。
- 改法：换成迁移题：
  - state：`count 为 0。点击时执行 setCount(count + 1); setCount(c => c + 1);，渲染后 count 是？` 选项 `['2', '1', '3', '0']`，答案 `2`。解析：“第一次请求‘替换为 1’，第二次在队列里基于 1 再加 1。”
  - conditional：`const items = []; 渲染 {items.length && <List />} 会显示？` 选项 `['什么都不显示', '0', '空的 List', '报错']`，答案 `0`。

### 17. 【中】阶段测验只复用课内测验原题
- 位置：`src/app.js:686-688`
- 问题：入门阶段题库 20 题、Hooks 阶段 14 题，每次抽 10 题。学习者已经答过每一题，有的还在热身和复习里见过几次。80% 的门槛主要在测“认得这道题”。“换一组题再测”在 Hooks 阶段几乎是同一组题。
- 改法：给每个阶段加 6–10 道只在阶段测验出现的“读代码”题（数据结构不变，例如 `stageQuiz: [...]`），抽题时混合。下面第 18–24 条中建议的新题都可以放进去。

### 18. 【中】Hooks 规则到第 14 课才出现，但第 6 课已经教“提前 return”
- 位置：`src/lessons-1.js:521-528`（if 提前返回）；`src/lessons-2.js:668-670`（Hooks 规则）
- 问题：第 6 课推荐 `if (...) return ...`。学习者自然会在 return 下面再写 `useState`，得到第 13 条里的压缩错误 #300。规则要到第 14 课才讲。
- 改法：第 4 课（state）末尾加一个短 warn：“useState 要写在组件最上面。不要放在 if、循环里，也不要放在提前 return 之后。原因在第 14 课讲。”第 6 课“方式一”下加一句：“提前 return 要放在所有 useState 之后。”

### 19. 【中】入门阶段没有讲“组件要保持纯”
- 位置：第一次出现在 `src/lessons-2.js:9`（第 9 课）
- 问题：react.dev 在“描述 UI”部分就讲 Keeping Components Pure。本课程在第 9 课才顺带一句。第 2 课的 `new Date()`、第 11 课的 `renders.current++` 都是渲染期读写外部值。学习者需要先有“渲染 = 计算，不做事”这个模型，第 9 课的 effect 才有意义。
- 改法：在第 3 课（components-props）“Props 是只读的”后面加一段：
  > 组件要像纯函数。同样的 props 和 state，返回同样的 JSX。
  > 渲染时不要修改组件外的变量，不要发请求，不要改 DOM。
  > 这些事放在事件处理函数里。第 9 课会讲剩下的情况。

---

## 三、逐课问题

### 第 1 课 what-is-react

**20. 【低】两道测验都太容易** — `src/lessons-1.js:61-62`
干扰项“React 是一个后端框架”“只能写手机 App”“只用 class 写代码”一眼可排除。
改法：换成考模型的题：
> 在 React 计数器中，count 从 1 变成 2 后，谁负责把页面上的“1”改成“2”？
> 选项：你写 `label.textContent = ...` / React 重新调用组件函数，再把差异更新到页面 / 浏览器自动刷新整个页面 / 必须手动调用 render()
> 答案：第 2 项。

**21. 【低】第一个示例用到了还没讲的 useState** — `src/lessons-1.js:47`
note 补一句：“`useState` 第 4 课再讲，现在只看效果。”

### 第 2 课 jsx

**22. 【高】练习：`1 + user.age`、解构 `age + 1` 都会失败；写 19 加一行注释能通过** — `src/lessons-1.js:167`
任务的本意是“不要写死 19”。直接检查这一点：
```js
const code = t.source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
t.assert(!/\b19\b/.test(code), '不要直接写 19，请用 user.age + 1 计算');
t.assert(/age/.test(code.split('return')[1] || ''), '年龄要从 user.age 计算');
```

**23. 【中】没有讲“对象不能直接放进 {}”** — `src/lessons-1.js:96-114`
示例里正好有 `user` 对象。新手最常见的一个错误就是写 `{user}`，得到 `Objects are not valid as a React child`（在本课程里还是压缩错误 #31）。另外 `true/false/null/undefined` 放进 `{}` 什么也不显示，这是第 6 课 `&&` 的前置知识。
改法：在 warn 后加：
> {} 里的值怎么显示：字符串和数字照常显示；true、false、null、undefined 什么也不显示；
> 对象不能直接显示，会报错。要写 {user.city}，不能写 {user}。

**24. 【低】测验第 3 题（className）是纯记忆题** — `src/lessons-1.js:142`
改为判断题：“下面哪个 JSX 写法是对的？” 选项 `<img src="a.png">`、`<div style="color:red">`、`<label htmlFor="x">`、`<input class="x" />`，答案 `htmlFor`。

### 第 3 课 components-props

**25. 【中】练习：不写 Greeting 组件也能通过** — `src/lessons-1.js:276-281`
在 App 里直接写三个 `<p className="greeting">你好，小明</p>`，测试通过。本课目标是“定义和使用组件”。
改法：练习加 `exports: ['Greeting']`，测试加：
```js
t.assert(typeof t.exports.Greeting === 'function', '请定义 Greeting 组件');
t.assert((t.source.match(/<Greeting\s/g) || []).length === 3, '请在 App 中使用 Greeting 三次');
```

**26. 【中】没有讲两个最常见的 props 错误** — `src/lessons-1.js:214` 附近
1. `function Greeting(name)` 漏写花括号：name 是整个 props 对象，渲染时报错。
2. `age="18"` 是字符串，`age={18}` 才是数字。`count="1" + 1` 得到 `"11"`。
改法：在解构说明后加一个 warn：
> 组件只收到<b>一个</b>参数：props 对象。`function Greeting(name)` 里的 name 是整个对象，要写 `({ name })`。
> 字符串以外的值要用花括号传：`<Card age={18} />`。写成 `age="18"` 得到的是字符串。

**27. 【中】没有讲“不要在组件里面定义组件”**
新手常把子组件定义写在父组件函数体内。每次父组件渲染，子组件都是一个新类型，state 和输入焦点全部丢失。react.dev 第一课就提醒这一点。本课程第 7 课的“改变 key 重置组件”和第 3 阶段的“状态跟着位置走”都和它相关。
改法：在第一个示例后加 warn：
> 组件要定义在最外层。不要在 App 函数里面写 `function Avatar() {}`。
> 否则 App 每次渲染，Avatar 都会被当成新组件，它的 state 会被清空。

### 第 4 课 state

**28. 【中】没有讲“state 属于每一个组件实例”**
第 14 课测验（`src/lessons-2.js:756`）问“A、B 都调用 useCounter，B 会变吗”，其根源是同一个组件渲染两次各有一份 state。这个概念在第 4 课从未出现。
改法：加一个小示例：
```jsx
function Counter() { const [n, setN] = useState(0); return <button onClick={() => setN(n + 1)}>{n}</button>; }
function App() { return <><Counter /><Counter /></>; }
```
说明：“同一个组件用两次，就有两份独立的 state。”

**29. 【中】没有讲“初始值只在第一次渲染时使用”**
`useState(props.value)` 之后 props 变了，state 不会跟着变。这是“把 props 复制进 state”反模式的根源（见第 34 条）。
改法：在 useState 介绍处加一句：“`useState(初始值)` 的初始值只在第一次渲染时使用。以后再渲染，React 忽略它。”

**30. 【中】练习几乎就是抄“正确的计数器”示例，没有练到“快照/函数式更新”**
- 位置：`src/lessons-1.js:380-419`
- 改法：给练习加第 5 步和一个按钮：“点击 <b>+3</b> 时，count 加 3。必须调用三次 setCount，每次加 1。” 测试：
  ```js
  await t.click(t.byText('button', '+3'));
  t.assert(c() === '5', '+3 应该让 2 变成 5。连续调用三次时，需要用函数式更新');
  t.assert((t.code.match(/setCount\(/g) || []).length >= 4, '+3 请调用三次 setCount，每次加 1');
  ```
  这样 `setCount(count + 1)` 三次的写法会失败，正好检验本课最难的目标。

**31. 【低】没有提到嵌套对象需要逐层展开**
`setUser({ ...user, address: { ...user.address, city } })`。展开只复制一层。可以在“不可变更新”warn 里加一句和一行代码。

### 第 5 课 events

**32. 【中】练习没有考本课目标**
- 位置：`src/lessons-1.js:480-511`
- 问题：开关练习只考 state 和三元运算符，没有用到事件对象、阻止默认行为或“把处理函数作为 prop 传递”。
- 改法：改成“子组件通知父组件”：starter 给出 `function ToggleButton({ onToggle })` 和 `App` 中的 state，要求子组件点击时调用 `onToggle`，App 中传入取反函数。测试同现有逻辑，并检查 `/<ToggleButton\s+onToggle=\{/`。

**33. 【中】没有点名最常见的错误：`onClick={setCount(count + 1)}`**
- 位置：`src/lessons-1.js:444`
- 问题：warn 讲了 `handleClick()`，但新手更常写的是直接调用 set 函数。这会造成“渲染 → 调用 set → 再渲染”的死循环（在本课程里是压缩错误 #301）。
- 改法：warn 末尾加：“最常见的版本是 `onClick={setCount(count + 1)}`。它在渲染时就更新 state，导致无限重新渲染。”

### 第 6 课 conditional

**34. 【中】测验第 2 题措辞费解，干扰项不成立** — `src/lessons-1.js:570`
选项“""（空字符串）以外都不行”“<></> 以外都不行”读起来像病句。而且空字符串和空片段其实也什么都不显示。
改法：反过来问，并且连接 `&&` 的坑：
> 下面哪个返回值会在页面上显示内容？
> 选项：`null` / `false` / `undefined` / `0`
> 答案：`0`。解析：“null、false、undefined 都不显示。数字 0 会显示出来，所以 `count && ...` 会多出一个 0。”

**35. 【低】练习文案与正文示例不一致** — `src/lessons-1.js:527,599`
正文写“欢迎回来！”和“欢迎回来 👋”，测试要求严格等于“欢迎回来”。照抄正文会失败。任务里加粗写明“文字必须是 <b>欢迎回来</b>，不带标点”。

### 第 7 课 lists-keys

（练习问题见第 4 条，示例问题见第 10 条。）

**36. 【低】没提 Fragment 也能带 key**
map 返回多个元素时要写 `<Fragment key={x.id}>`，`<>` 不能带 key。可加到“key 的规则”列表最后一条。

### 第 8 课 forms

**37. 【中】练习：非受控输入框也能通过** — `src/lessons-1.js:803-810`
只写 `onChange`、不写 `value`，预览照样正确。本课目标是受控组件。
改法：任务加一步“点击 <b>清空</b> 按钮，输入框和预览都恢复初始状态”。测试：
```js
await t.type('#name', '小美');
await t.click(t.byText('button', '清空'));
t.assert(t.q('#name').value === '', '点“清空”后输入框应变空。输入框要绑定 value，才能由 state 控制');
t.assert(pv() === '你好，陌生人', '清空后应显示“你好，陌生人”');
```
这正好对应正文 `:732` 的说明：“清空按钮能起作用，正是因为输入框的值由 state 控制。”

**38. 【低】没提 `e.target.value` 永远是字符串**
`<input type="number">` 的值也是字符串，`value + 1` 得到 `"11"`。加一句：“要做数学计算，先用 Number() 转换。”第 10 课的温度示例会用到这一点。

### 第 9 课 use-effect

**39. 【高】心智模型偏向“生命周期”，没有建立“同步”模型**
- 位置：`src/lessons-2.js:18-22`（表格）、`:79`（开灯比喻）、`:123`（测验）
- 问题：summary 说“与外部世界同步”，但表格、典型用途和测验都在讲“挂载时执行一次、更新时执行”。`[]` 的典型用途写“初始化”，会让学习者把它当成 `componentDidMount`，再为了“只执行一次”故意漏写依赖。react.dev 明确要求从 effect 的角度思考：如何开始同步、如何停止同步。
- 改法：在表格后加一段：
  > 不要按“挂载时做什么、更新时做什么”来想。
  > 每个 effect 只回答两个问题：怎样开始同步？怎样停止同步？
  > 依赖数组不是你挑选的，而是由 effect 里用到的值决定的。
  > `[]` 的意思是“这个 effect 不读任何会变的值”，不是“我想只执行一次”。
  表格“典型用途”中 `[]` 那一格改为“连接不依赖 props/state 的外部系统，例如 window 事件”。

**40. 【中】练习的“清理函数”检查形同虚设** — `src/lessons-2.js:153`
`/clearInterval/` 写在注释里就能通过；测试也没有验证卸载后定时器是否真的停了。
改法：Runner 已经跟踪了所有定时器（`src/app.js:113-116`）。给 tester 暴露数量：在 `makeTester` 增加参数 `timers: () => pg._runner.timers.size`。练习 starter 改成 `Timer` 组件 + App 中一个“隐藏”按钮。测试：
```js
await t.wait(2300);
// ...原有秒数断言...
await t.click(t.byText('button', '隐藏'));
t.assert(t.timers() === 0, '组件卸载后定时器还在运行。请在清理函数中调用 clearInterval');
```

**41. 【中】没有讲 effect 引起的无限循环**
`useEffect(() => setX(...))` 不写依赖，或依赖每次渲染新建的对象/数组，会无限渲染。这是新手用 effect 时最常见的 bug。
改法：加 warn：
> effect 里调用 set 函数，又不写依赖数组：渲染 → effect → set → 渲染……会无限循环。
> 依赖里放每次渲染都新建的对象或数组，效果一样。

**42. 【中】测验没有考依赖数组的推理**
三题考“何时执行”“何时清理”“派生值”。缺少“漏写依赖会怎样”。
改法：加题：
> `useEffect(() => { connect(roomId); return () => disconnect(roomId); }, []);` 之后 roomId 从 1 变成 2，会怎样？
> 选项：仍连着房间 1 / 自动切到房间 2 / 先断开 1 再连 2 / 报错
> 答案：仍连着房间 1。解析：“依赖数组漏写 roomId，React 不知道要重新同步。effect 里用到的 props 和 state 都要写进依赖。”

**43. 【低】严格模式说明与运行框行为不一致** — `src/lessons-2.js:120`
运行框没有包 `<StrictMode>`（`src/app.js:152`），而且是生产版。学习者在这里永远看不到“执行两次”，到 Vite 项目里才看到。加一句：“本页运行框没有开启严格模式，所以只执行一次。在你自己的项目里会看到两次。”

### 第 10 课 lifting-state

**44. 【中】练习没有练“状态提升”本身** — `src/lessons-2.js:219-262`
starter 里 state 已经在 App 中，学习者只需给子组件加回调。真正的技能是“发现 state 放错了位置，把它移上去”。另外，把 App 里的 `<AddButton>` 换成两个普通 `<button>` 也能通过。
改法：换成重构题。starter：`SearchBox` 自己有 `query` state，`ResultList` 需要 query 却拿不到。任务：把 query 提升到 App，通过 props 传给两者。测试：`t.type('#q', '果')` 后列表只剩含“果”的项；并检查 `/<SearchBox[^>]*\bonChange=|<SearchBox[^>]*\bvalue=/`。

**45. 【中】没有讲“把 props 复制进 state”反模式**
`function TempInput({ value }) { const [v, setV] = useState(value); ... }` 之后父组件改 value，子组件不更新。这是状态提升最容易出错的地方。
改法：加 warn：
> 不要把 prop 复制到子组件的 state 里。
> useState 的初始值只用一次，父组件之后传来的新值会被忽略。
> 子组件直接显示 prop，修改时调用父组件给的回调。

**46. 【低】温度转换器对“第一次接触状态提升”偏复杂**
`parseFloat`、四舍五入、`scale` 推导占了一半注意力。建议在它前面加一个最小例子（react.dev 的手风琴：两个 Panel 同一时间只展开一个，`activeIndex` 提升到父组件），温度转换器作为第二个例子。

### 第 11 课 use-ref

（练习问题见第 2 条，秒表问题见第 11 条。）

**47. 【中】测验是纯记忆题，缺少“ref 不触发渲染”的推理题** — `src/lessons-2.js:334-335`
改法：加题：
> `const r = useRef(0);` 按钮 `onClick={() => r.current++}`，页面显示 `<p>{r.current}</p>`。点 3 次后页面显示？
> 选项：0 / 3 / 1 / 报错。答案：0。解析：“r.current 已经是 3，但修改 ref 不会重新渲染，所以页面还停在 0。下次因为别的原因重新渲染时才会显示 3。”

### 第 12 课 context

（练习问题见第 3 条。）

**48. 【中】没有讲“Provider 所在组件自己读不到这个 value”**
在 `App` 里写 `<ThemeContext.Provider value="dark">`，又在 `App` 里 `useContext(ThemeContext)`，读到的是默认值或更上层的值。useContext 只向**上**找。
改法：作为测验题（考理解）：
> App 渲染 `<Ctx.Provider value="dark">`，并在 App 函数体里调用 `useContext(Ctx)`（默认值 'light'）。读到什么？
> 答案：'light'。解析：“useContext 找的是调用它的组件<b>上方</b>最近的 Provider。App 自己渲染的 Provider 在它下方。”

### 第 13 课 use-reducer

（示例问题见第 9 条。）

**49. 【中】测验第 2 题干扰项太弱** — `src/lessons-2.js:606`
“switch 语句”“展开运算符”明显不是错的。
改法：
> 下面哪个 reducer 分支是正确的？
> 选项：`state.count++; return state;` / `return { ...state, count: state.count + 1 };` / `fetch('/api/log'); return state;` / `return { count: Math.random() };`
> 答案：第 2 项。

**50. 【低】action 命名前后不一致，也没解释**
示例用过去式 `added`、`toggled`（描述“发生了什么”），练习用命令式 `increment`、`reset`。加一句：“react.dev 推荐用 action 描述‘用户做了什么’，例如 added，而不是 ‘setTodos’。”并统一练习命名，或说明两种都常见。

**51. 【低】练习太简单，没练到“把多个 useState 重构为 useReducer”**
计数器 reducer 体现不出 reducer 的价值。可选改为：starter 用三个相互关联的 useState（`status`、`data`、`error`），要求重构为一个 reducer，action 为 `started`/`succeeded`/`failed`。

### 第 14 课 custom-hooks

**52. 【低】练习：不写 useCounter、直接在 Counter 里 useState 也能通过** — `src/lessons-2.js:806-811`
加：`t.assert(/function\s+useCounter[\s\S]*?useState\(/.test(t.code), '请在 useCounter 里调用 useState');`

**53. 【低】可补一句“什么时候不该以 use 开头”**
不调用任何 Hook 的函数不要以 use 开头。也不建议写 `useMount` 这类“生命周期 Hook”（与第 39 条的同步模型一致）。

---

## 四、课序与过渡

### 54. 【中】第二阶段的顺序：最难的 useEffect 排在最前，简单的状态提升排在后面
- 位置：`src/lessons-2.js` 课序 9–14
- 问题：useEffect 是逃生舱，概念最难。状态提升、reducer、Context 都只是“管理 state”，更接近第一阶段。react.dev 的顺序是：管理 state（状态提升 → reducer → Context）→ 逃生舱（ref → effect → 自定义 Hook）。
  现有顺序还带来两个具体问题：第 10 课说“下一课 Context”（见第 5 条）；ref 秒表在 effect 之后却不清理（见第 11 条）。
- 改法：调整为 lifting-state → use-reducer → context → use-ref → use-effect → custom-hooks。这只需要移动 `lesson({...})` 块的顺序，并修改几处“下一课”“上一课”的文字。热身和复习按 `LESSONS` 顺序工作，不受影响。

### 55. 【低】阶段之间缺少过渡句
第 8 课（forms）结尾和第 9 课开头都没有说明“第一阶段学完了什么、第二阶段要解决什么问题”。建议第 9 课（或调整后的第一课）开头加两句：
> 第一阶段，组件只和自己的 state 打交道。
> 这一阶段解决三个新问题：多个组件共享数据，组件和外部世界同步，复用逻辑。

### 56. 【低】测验答错后可以“看完答案再答一次”，掌握标准偏松
`src/app.js:420-424`：解析里直接写出正确选项字母，重答时只是重新打乱顺序，学习者照着文字点就能“答对全部测验”。复习记录只算第一次，这一点设计得好；但“本课完成”的门槛因此只是“看过一遍解析”。可选：重答时换成同课另一道题，或重答前要求先展开正文对应段落。属于设计取舍，供参考。

---

## 附：已核对、教学上做得好的部分

- 状态快照、函数式更新、`Object.is` 与不可变更新：讲解清楚，示例有对照。
- index 当 key 的错位演示，配合预测题，效果很好。
- 数字 0 的 `&&` 陷阱：有讲解、有演示、有预测。
- useEffect 的 `ignore` 竞态处理与 react.dev 一致；“你可能不需要 effect”三条位置得当。
- 自定义 Hook“共享逻辑而不是状态”的比喻清楚。
- use-reducer、use-effect、custom-hooks 三个练习的行为测试本身是稳健的：例如 reducer 里直接修改 state（`state.count++; return state`）会因为引用不变而失败；interval 里写 `setSeconds(seconds + 1)` 配 `[]` 会停在 1 而失败。
