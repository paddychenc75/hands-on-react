// 非正文数据。课文在 docs/lessons/closures.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'closures',
  stage: 2,
  title: '闭包陷阱与 Effect 依赖',
  mins: 25,
  summary: '为什么定时器里的 state 总是旧值？彻底理解渲染、闭包与依赖。',
  goals: [
    '能解释为什么每次渲染都有自己的 props、state 和函数',
    '能找出 effect 和定时器回调里的“过期闭包”',
    '能用补全依赖、函数式更新或 ref 修复过期闭包',
    '能修改代码让 effect 少依赖一个值，而不是直接删掉依赖',
  ],
  keyPoints: [
    '组件每次渲染都会新建一批变量和函数。函数通过闭包记住的是创建它的那次渲染里的值。',
    '过期闭包：effect 只在挂载时运行，它里面的回调就一直读第一次渲染的 state 和 props。',
    '依赖数组要写上 effect 用到的所有 props 和 state。不想依赖某个值，就改代码：用函数式更新、把函数移进 effect，或把常量移到组件外。',
    '长期存在的回调要读最新值，又不想重启 effect，可以用 ref 保存最新值。',
    '常见坑：把组件内定义的对象或函数写进依赖。它每次渲染都是新引用，effect 每次都会重新执行。',
  ],
  quiz: [
    {
      q: 'interval 回调改成 setCount(c => c + 1); console.log(count)，依赖仍为 []。控制台每秒打印什么？',
      options: ['1, 2, 3…', '一直是 0', '一直是 1', 'undefined'],
      answer: 1,
      explain: '函数式更新修好了计数，屏幕上的数字会增长。但回调里的 count 仍是第一次渲染的快照，所以一直打印 0。选 1, 2, 3… 的人以为“界面在变，回调读到的值也在变”，其实回调从来没有被重新创建。',
    },
    {
      q: 'effect 依赖为 []，interval 回调中写 setCount(count + 1)，计数停在 1。最好的修复是？',
      options: [
        '把依赖改成 [count]',
        '改为 setCount(c => c + 1)，依赖保持 []',
        '删除依赖数组',
        '用 ref 保存最新的 count，回调里读 ref.current',
      ],
      answer: 1,
      explain: '函数式更新不再读取 count，effect 就不需要依赖它，定时器只创建一次。改成 [count] 也能工作，但每秒都要清理并重建定时器。删除依赖数组更糟：每次渲染都重建。ref 方案能用，但这里没必要绕远。',
    },
    {
      q: 'effect 依赖了一个在组件内定义的对象 options = { roomId }。会怎样？',
      options: ['只在 options 的内容变化时执行', '每次渲染都执行', '只在挂载时执行一次', 'React 报错：依赖不能是对象'],
      answer: 1,
      explain: '依赖用 Object.is 比较。options 每次渲染都是新对象，永远“不相等”，所以 effect 每次都执行。最常见的误解是第一项：React 不会深比较对象内容。修法：把对象移进 effect，依赖写 roomId。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>运行代码，观察两个 bug：消息列表停在 1 条；点“旅行”后，收到的仍是“综合”的消息。</li><li>让消息不断累积。</li><li>切换房间时，断开旧房间，连接新房间。</li><li>切换房间后，保留已经收到的消息，只在后面追加新房间的消息。</li><li>收到新消息时，不要重新连接服务器。</li></ol>',
    starter: `import { useState, useEffect } from 'react';

// —— 模拟聊天服务器（不用修改）：连接后每 0.2 秒推送一条本房间的消息 ——
const server = { connects: 0, open: 0 };
function createConnection(roomId) {
  let timer = null, handler = null, n = 0;
  return {
    on(event, fn) { handler = fn; },
    connect() {
      server.connects++; server.open++;
      timer = setInterval(() => handler && handler('[' + roomId + '] 第 ' + (++n) + ' 条'), 200);
    },
    disconnect() { clearInterval(timer); server.open--; },
  };
}

function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on('message', (text) => {
      setMessages([...messages, text]);
    });
    conn.connect();
    return () => conn.disconnect();
  }, []);
  return (
    <ul id="log" style={{ maxHeight: 120, overflow: 'auto' }}>
      {messages.map((m, i) => <li key={i}>{m}</li>)}
    </ul>
  );
}

function App() {
  const [roomId, setRoomId] = useState('综合');
  return (
    <div>
      <button id="general" onClick={() => setRoomId('综合')}>综合</button>
      <button id="travel" onClick={() => setRoomId('旅行')}>旅行</button>
      <p>当前房间：{roomId}</p>
      <ChatRoom roomId={roomId} />
    </div>
  );
}`,
    solution: `import { useState, useEffect } from 'react';

// —— 模拟聊天服务器（不用修改）：连接后每 0.2 秒推送一条本房间的消息 ——
const server = { connects: 0, open: 0 };
function createConnection(roomId) {
  let timer = null, handler = null, n = 0;
  return {
    on(event, fn) { handler = fn; },
    connect() {
      server.connects++; server.open++;
      timer = setInterval(() => handler && handler('[' + roomId + '] 第 ' + (++n) + ' 条'), 200);
    },
    disconnect() { clearInterval(timer); server.open--; },
  };
}

function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on('message', (text) => {
      setMessages(m => [...m, text]);
    });
    conn.connect();
    return () => conn.disconnect();
  }, [roomId]);
  return (
    <ul id="log" style={{ maxHeight: 120, overflow: 'auto' }}>
      {messages.map((m, i) => <li key={i}>{m}</li>)}
    </ul>
  );
}

function App() {
  const [roomId, setRoomId] = useState('综合');
  return (
    <div>
      <button id="general" onClick={() => setRoomId('综合')}>综合</button>
      <button id="travel" onClick={() => setRoomId('旅行')}>旅行</button>
      <p>当前房间：{roomId}</p>
      <ChatRoom roomId={roomId} />
    </div>
  );
}`,
    hint: '两个 bug 都是过期闭包。1. 消息回调里的 <code>messages</code> 来自哪一次渲染？能不能不读它就追加一条？2. effect 用到了 <code>roomId</code>，依赖数组写了吗？依赖变化时，React 会先运行上一次的清理函数，再运行新的 effect。',
    faded: `import { useState, useEffect } from 'react';

// —— 模拟聊天服务器（不用修改）：连接后每 0.2 秒推送一条本房间的消息 ——
const server = { connects: 0, open: 0 };
function createConnection(roomId) {
  let timer = null, handler = null, n = 0;
  return {
    on(event, fn) { handler = fn; },
    connect() {
      server.connects++; server.open++;
      timer = setInterval(() => handler && handler('[' + roomId + '] 第 ' + (++n) + ' 条'), 200);
    },
    disconnect() { clearInterval(timer); server.open--; },
  };
}

function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const conn = createConnection(roomId);
    conn.on('message', (text) => {
      /* ✏️ 追加 text：不要读取这次渲染的 messages */
    });
    conn.connect();
    return () => conn.disconnect();
  }, /* ✏️ effect 用到了哪些 props 或 state？ */);
  return (
    <ul id="log" style={{ maxHeight: 120, overflow: 'auto' }}>
      {messages.map((m, i) => <li key={i}>{m}</li>)}
    </ul>
  );
}

function App() {
  const [roomId, setRoomId] = useState('综合');
  return (
    <div>
      <button id="general" onClick={() => setRoomId('综合')}>综合</button>
      <button id="travel" onClick={() => setRoomId('旅行')}>旅行</button>
      <p>当前房间：{roomId}</p>
      <ChatRoom roomId={roomId} />
    </div>
  );
}`,
    exports: ['server'],
    test: async (t) => {
      const srv = t.exports.server;
      t.assert(srv && typeof srv.connects === 'number', '没有找到 server 对象。请不要修改模拟服务器的代码');
      const items = () => t.qa('#log li').map(li => li.textContent);
      await t.wait(750);
      let got = items();
      t.assert(got.length >= 2, got.length === 1
        ? '0.75 秒后列表仍只有 1 条消息。回调里的 messages 永远是第一次渲染的 []，每次都在算 [...[], text]。试试函数式更新'
        : `0.75 秒后应至少有 2 条消息，实际是 ${got.length} 条。连接建立了吗？`);
      t.assert(got.every(x => x.includes('综合')), '还没切换房间，列表里就出现了别的房间的消息');
      t.assert(srv.connects === 1, `还没切换房间，就已经连接了 ${srv.connects} 次。每收到一条消息就重连了一次：effect 的依赖里是不是有 messages？用函数式更新，effect 就不必读 messages`);
      const before = got.length;
      await t.click('#travel');
      await t.wait(750);
      got = items();
      const kept = got.slice(0, before).every(x => x.includes('综合'));
      const later = got.slice(before);
      t.assert(got.length >= before && kept, `切换后，之前的 ${before} 条“综合”消息不见了。题目要求保留它们：ChatRoom 被重新挂载了，还是 messages 被清空了？`);
      t.assert(later.some(x => x.includes('旅行')), '切到“旅行”后，仍然只收到“综合”的消息。effect 里的 roomId 是哪一次渲染的？effect 用到的 roomId 要写进依赖数组');
      t.assert(srv.open === 1, `切换后有 ${srv.open} 个连接同时打开。effect 要返回清理函数，断开旧连接`);
      t.assert(later.every(x => x.includes('旅行')), '切换后还在收到“综合”的新消息。旧房间的连接断开了吗？');
      t.assert(later.length >= 2, `切换 0.75 秒后应至少追加 2 条“旅行”消息，实际是 ${later.length} 条`);
      t.assert(srv.connects === 2, `从开始到现在共连接了 ${srv.connects} 次，应为 2 次（综合 1 次 + 旅行 1 次）。收到消息时不要重新连接`);
    },
  },
  checkOnly: [
    {
      q: `在输入框里输入“hi”，然后按 Enter。控制台打印什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [text, setText] = useState('');

useEffect(() =&gt; {
  const onKey = e =&gt; {
    if (e.key === 'Enter') console.log(text);
  };
  window.addEventListener('keydown', onKey);
  return () =&gt; window.removeEventListener('keydown', onKey);
}, []);</code></pre></div>`,
      options: ['hi', '\'\'（空字符串）', 'undefined', '每按一个键打印一次'],
      answer: 1,
      explain: 'effect 只在挂载时运行一次，onKey 是第一次渲染创建的。它记住的 text 永远是空字符串。修复方式：把 text 加入依赖数组，让 effect 重新注册监听；或者用 ref 保存最新值，在 onKey 中读 ref.current。',
    },
    {
      q: `这个计数器运行起来会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">useEffect(() =&gt; {
  const id = setInterval(() =&gt; setCount(count + 1), 1000);
  return () =&gt; clearInterval(id);
}, [count]);</code></pre></div>`,
      options: ['停在 1', '能每秒加 1，但 count 每变一次，定时器就被清除并重建一次', '越来越快，因为定时器越来越多', '只加一次，之后报错'],
      answer: 1,
      explain: 'count 在依赖数组里。每次 count 变化，React 先运行清理函数清除旧定时器，再用新的 count 创建新定时器。所以计数正确，也不会堆积定时器。缺点是定时器不断重建。用 <code>setCount(c =&gt; c + 1)</code> 配合 <code>[]</code> 更简单。',
    },
    {
      q: `点击“稍后提示”，然后在 3 秒内点 3 次“+1”。弹窗显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [count, setCount] = useState(0);

function alertLater() {
  setTimeout(() =&gt; alert(count), 3000);
}

&lt;button onClick={() =&gt; setCount(c =&gt; c + 1)}&gt;+1&lt;/button&gt;
&lt;button onClick={alertLater}&gt;稍后提示&lt;/button&gt;</code></pre></div>`,
      options: ['0', '3', '1', '3 次弹窗，分别是 1、2、3'],
      answer: 0,
      explain: 'alertLater 是第一次渲染创建的函数，它读到的 count 是那次渲染的快照 0。定时器回调记住的就是这个 0。之后的点击创建了新的渲染和新的 count，但旧的回调看不到。“3”是把 count 当成了一个会被修改的变量；实际上每次渲染都有自己的 count 常量。想读到最新值，可以把最新值存进 ref，在回调里读 <code>ref.current</code>。',
    },
  ],
  plays: {
    '3 秒后打印什么？': {
      note: '先点“3 秒后打印”，再快速点几次 +1。控制台打印的是点击时那次渲染的值。',
      predict: {
        title: '3 秒后打印什么？',
        q: 'count 为 0 时点“3 秒后打印”，随后立刻点 3 次 +1。3 秒后控制台打印的 count 是？',
        options: ['3', '0', '1', 'undefined'],
        answer: 1,
        explain: 'setTimeout 的回调属于点击时那次渲染，它通过闭包记住了当时的 count，也就是 0。',
      },
      pkey: 'closures|每次渲染都是一张快照',
    },
    '这个计数器会怎样？': {
      note: '数字停在 1。依赖数组“撒谎”了：effect 用到了 count，却没有写进依赖。',
      predict: {
        title: '这个计数器会怎样？',
        q: '运行这段代码，几秒后屏幕上的数字会是？',
        options: ['每秒加 1', '停在 1', '停在 0', '飞速增长'],
        answer: 1,
        explain: '定时器回调创建于第一次渲染，它读到的 count 永远是 0，每秒都在执行 setCount(0 + 1)。',
      },
      pkey: 'closures|计数器卡在 1',
    },
  },
};
