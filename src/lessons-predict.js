/* ========== “先预测再运行”的题目：按课程 id + 示例标题挂到对应的代码框上 ========== */
const PREDICTIONS = {
  'state|失败的计数器': {
    q: '连续点击按钮 3 次后，按钮上显示的数字是多少？',
    options: ['3', '0', '1', '报错'], answer: 1,
    explain: '修改普通变量不会通知 React 重新渲染，所以界面一直停在第一次渲染的 0。控制台里变量其实在增加。',
  },
  'state|快照 vs 函数式更新': {
    q: '点一次“+3（写法 A）”后，count 会变成几？',
    options: ['3', '1', '0', '6'], answer: 1,
    explain: '这次渲染里 count 始终是 0，三次调用都在请求“设为 1”。函数式更新才会基于最新值累加。',
  },
  'events|事件对象与冒泡': {
    q: '点击“按钮 B”一次，日志列表会新增几条？',
    options: ['1 条', '2 条', '0 条', '3 条'], answer: 1,
    explain: '按钮先处理点击，然后事件冒泡到外层 div，div 的 onClick 也会执行，所以是 2 条。按钮 A 调用了 e.stopPropagation()，只会产生 1 条。',
  },
  'conditional|count 为 0 时的两种写法': {
    q: '“写法 A：”这一行后面会显示什么？',
    options: ['什么都不显示', '0', 'false', '有 0 条'], answer: 1,
    explain: '0 && x 的结果是 0，而 React 会把数字渲染出来，所以页面上出现一个“0”。',
  },
  'lists-keys|两列只差 key': {
    q: '在两列的每个输入框里都输入内容，再点“在顶部插入”。左列（key=index）的输入内容会怎样？',
    options: ['跟着原来的字母一起往下移', '留在原来的位置，和字母错开', '全部被清空', '和右列表现一样'], answer: 1,
    explain: '用 index 当 key 时，第 0 个位置的 key 始终是 0。React 认为“key=0 的那项还在”，就复用了原来的 DOM（包括输入内容），只改了字母文字，于是错位。',
  },
  'use-effect|观察三种 effect 的执行时机': {
    q: '在输入框里打一个字，控制台里会出现哪些 effect 的输出？',
    options: ['① 和 ③', '只有 ①', '①、② 和 ③', '都不会'], answer: 1,
    explain: '打字改变的是 name。① 没有依赖数组，每次渲染后都运行；② 不读任何会变的值，第一次渲染后同步一次就够了；③ 只读 count，count 没变，就不重新同步。',
  },
  'lifting-state|温度转换器：两个输入框共享一份状态': {
    q: '把“华氏度 °F”框里的数字改成 212。“摄氏度 °C”框会显示什么？',
    options: ['20：它有自己的值，不受影响', '212：两个框显示同一个值', '100', '空白'], answer: 2,
    explain: 'App 只存一份 state：{ value: \'212\', scale: \'f\' }。每次渲染时，摄氏度由它算出来：(212 − 32) × 5 / 9 = 100。最迷惑的是“20”：只有两个输入框各存一份 state 时才会这样。',
  },
  'use-reducer|待办清单 reducer': {
    q: '在输入框里输入“写作业”，点“添加”。控制台打印的 todos.length 是几？',
    options: ['3', '2', '1', 'undefined'], answer: 1,
    explain: 'dispatch 和 set 函数一样，只是请求 React 用新的 state 重新渲染。这次渲染里的 todos 还是添加前的 2 项。最迷惑的是 3：列表下一次渲染时才会有 3 项。',
  },
  'context|主题切换': {
    q: '点一次“切换主题”。卡片 C 显示的是哪个主题？',
    options: ['dark，和卡片 A、B 一样', '页面报错：卡片 C 找不到 Provider', 'undefined', 'light'], answer: 3,
    explain: '卡片 C 在 Provider 外面。useContext 找不到上层的 Provider，就用 createContext 的默认值 \'light\'。切换主题只改变 Provider 的 value，影响不到它。最迷惑的是“报错”：没有 Provider 不会报错，只会读到默认值。',
  },
  'use-ref|用 ref 保存定时器 id 的秒表': {
    q: '点“开始”，过 1 秒再点“停止”。灰色那行“组件已渲染 N 次”会怎样变？',
    options: ['一直不变：ref 的变化不会触发渲染', '大约增加 10 次', '只增加 2 次：点“开始”和点“停止”各一次', '大约增加 20 次'], answer: 1,
    explain: '每 0.1 秒调用一次 setTime，time 是 state，每次都会重新渲染，1 秒约 10 次。最迷惑的是第一项：存定时器 id 的 timerRef 确实不触发渲染，但渲染来自 setTime。点“开始”和“停止”本身不改 state。',
  },
  'rendering|谁被重新渲染了？': {
    q: '点击 Counter 内部的“+1”按钮，哪些组件会重新渲染（闪烁）？',
    options: ['所有组件', '只有 Counter', 'App 和 Counter', 'Counter 和两个 Child'], answer: 1,
    explain: 'state 属于 Counter，更新只会让 Counter 和它的后代重新渲染。父组件和兄弟组件不受影响。',
  },
  'rendering|状态跟着位置走': {
    q: '把三个计数器都点到非 0 的数字，然后勾选“红色”。哪些计数器会保留原来的数字？',
    options: ['三个都保留', '只有情况 1', '情况 1 和 3', '都不保留'], answer: 1,
    explain: '情况 1 中同一位置、同一类型，状态保留；情况 2 外层从 section 变成 div，子树重建；情况 3 的 key 变了，被当成另一个组件。',
  },
  'performance|哪个 memo 生效了？': {
    q: '点几次“让父组件渲染”按钮，哪个 Child 的渲染次数会保持不变？',
    options: ['三个都不变', '只有 Child 1', 'Child 2 和 Child 3', '只有 Child 3'], answer: 3,
    explain: 'Child 1 收到每次都新建的函数。Child 2 的 style 每次都是新对象。浅比较判定它们的 props 变了。只有 Child 3 的 props 引用全都稳定，memo 才生效。',
  },
  'closures|每次渲染都是一张快照': {
    title: '3 秒后打印什么？',
    q: 'count 为 0 时点“3 秒后打印”，随后立刻点 3 次 +1。3 秒后控制台打印的 count 是？',
    options: ['3', '0', '1', 'undefined'], answer: 1,
    explain: 'setTimeout 的回调属于点击时那次渲染，它通过闭包记住了当时的 count，也就是 0。',
  },
  'closures|计数器卡在 1': {
    title: '这个计数器会怎样？',
    q: '运行这段代码，几秒后屏幕上的数字会是？',
    options: ['每秒加 1', '停在 1', '停在 0', '飞速增长'], answer: 1,
    explain: '定时器回调创建于第一次渲染，它读到的 count 永远是 0，每秒都在执行 setCount(0 + 1)。',
  },
  'mini-react|20 行实现 useState': {
    q: '代码最后打印的 hooks 数组是什么？',
    options: ['[0,"小明"]', '[2,"小红"]', '[1,"小红"]', '[2,"小明"]'], answer: 1,
    explain: 'count 被加了两次变成 2，name 被改成“小红”。两个状态按调用顺序分别存在下标 0 和 1。',
  },
  'tanstack-query|迷你 useQuery': {
    q: '页面上有两个 User 组件同时请求用户 1。第一次加载时会发出几次请求？',
    options: ['2 次', '1 次', '0 次', '每秒一次'], answer: 1,
    explain: '相同的 queryKey 只会发一次请求，第二个组件直接复用进行中的那个 Promise。这就是请求去重。',
  },
  'suspense|错误边界隔离故障': {
    q: '把第一个计数器点到 3。第二个计数器会怎样？',
    options: ['也显示错误', '不受影响，仍可点击', '整个页面白屏', '被重置为 0'], answer: 1,
    explain: '每个计数器有自己的错误边界。错误只会让最近的边界显示备用界面。',
  },
  'concurrent|用 useTransition 切换标签页': {
    q: '保持勾选“使用 startTransition”。点“文章（很慢）”，再立刻点“联系”。会怎样？',
    options: ['界面卡住约半秒，然后显示文章', '立即切到“联系”，文章的渲染被丢弃', '同时显示文章和联系', '报错'], answer: 1,
    explain: '过渡更新可以被打断。新的点击更紧急，React 丢弃还没完成的文章渲染。取消勾选后，渲染必须一次做完，界面会卡住。',
  },
  'state-architecture|亲手实现 Zustand': {
    q: '点击“吃蜂蜜”。控制台会新增哪些输出？',
    options: ['BearCounter 和 HoneyPot 都渲染', '只有 HoneyPot 渲染', '三个组件都渲染', '没有输出'], answer: 1,
    explain: '每个组件只订阅 selector 选出的值。bears 没变，BearCounter 的快照不变，React 跳过它。如果把整个 state 放进一个 Context，所有消费者都会重新渲染。',
  },
  'react-19|用 React 18 模拟乐观更新的效果': {
    q: '点击“点赞（会失败）”。点击后立刻和 1.2 秒后，数字分别是？',
    options: ['42，42', '43，然后回到 42', '43，43', '42，然后变成 43'], answer: 1,
    explain: '乐观值立刻加 1。服务器失败后移除乐观值，界面回到真实值 42。',
  },
};

LESSONS.forEach(l => l.body.forEach(b => {
  if (b.t !== 'play') return;
  const p = PREDICTIONS[l.id + '|' + b.title];
  if (!p) return;
  b.predict = p; b.pkey = l.id + '|' + b.title;
  if (p.title) b.title = p.title;
}));
