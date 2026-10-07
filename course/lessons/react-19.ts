import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/react-19.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'react-19',
  stage: 3,
  title: 'React 19 新特性',
  mins: 25,
  summary: 'Actions、useActionState、useOptimistic、use()、ref 作为 prop 等新能力。',
  goals: [
    '能说出一次异步提交要管理的 4 件事，以及 React 19 用哪个 API 接管每一件',
    '能把一个 React 18 的提交处理函数改写成 useActionState + form action',
    '能读懂 useOptimistic 代码，并预测成功和失败时界面的变化',
    '能判断 use() 和 useFormStatus 该在哪个组件里调用',
  ],
  keyPoints: [
    '一次异步提交要管 4 件事：提交中（pending）、错误和结果、成功后重置表单、乐观值。React 18 要自己写 state；React 19 用 Action 统一接管。',
    '<code>startTransition</code> 可以接收异步函数，这类函数叫 Action。React 自动追踪它的 pending，提前 return 或抛错时也会结束 pending。',
    '<code>useActionState(action, 初始 state)</code> 返回 <code>[state, formAction, isPending]</code>。Action 的形状是 <code>(上一次的 state, formData) =&gt; 新的 state</code>。',
    '<code>useOptimistic</code> 在 Action 进行中显示预期结果。Action 结束后，乐观值自动丢弃，界面回到真实 state。',
    '常见坑：在渲染 form 的组件里调用 <code>useFormStatus</code>，读不到这个 form 的状态；在渲染时新建 Promise 传给 <code>use()</code>，组件会反复挂起。',
  ],
  quiz: [
    {
      q: 'Newsletter 组件渲染了 &lt;form&gt;，并在同一个组件里调用 useFormStatus()。提交时 pending 是？',
      options: ['提交期间为 true，完成后变回 false', '始终是 false', '报错', 'undefined'],
      answer: 1,
      explain: 'useFormStatus 读取的是<b>上层</b> form 的状态。Newsletter 在 form 外面，它上层没有 form，所以 pending 始终是 false。不会报错，这正是它难发现的地方。修法：把按钮拆成 form 内部的子组件。',
    },
    {
      q: '点赞按钮用 useOptimistic 实现，当前真实值是 42。点击后，Action 里 addOptimistic(1)，然后服务器返回失败，代码 catch 住错误。数字会怎样变化？',
      options: [
        '先变成 43，Action 结束后回到 42',
        '一直停在 43，要在 catch 里自己写代码回滚',
        '一直是 42，等服务器成功才变',
        '先变成 43，然后变成 41',
      ],
      answer: 0,
      explain: '乐观值只在 Action 进行中有效。Action 结束后，React 丢弃它，界面显示真实值 42。真实值从来没变，所以不用自己回滚，这正是 useOptimistic 省掉的工作。不会变成 41：React 不会“减 1”，它只是不再叠加乐观值。',
    },
    {
      q: '客户端组件里写 const user = use(fetch(\'/api/user\').then(r =&gt; r.json()))，页面一直显示 Suspense 的 fallback。怎样修？',
      options: [
        '用 useMemo 包住这个 Promise，依赖写 []',
        '在组件外创建 Promise 并缓存（例如由服务端组件或数据请求库提供），通过 props 传入',
        '用 try/catch 包住 use()，出错时返回默认值',
        '把组件改成 async 函数，写 await fetch(…)',
      ],
      answer: 1,
      explain: '每次渲染都新建一个 Promise，use() 每次都等新的 Promise，组件就反复挂起。Promise 要在渲染之外创建并缓存。最有迷惑性的是 useMemo：组件第一次挂载就挂起时，React 会丢掉这次渲染的 Hook 数据，useMemo 存不住它。use() 不能放进 try/catch；客户端组件也不能是 async 函数。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>补全 <code>useActionState(action, initialState)</code>，返回 <code>[state, dispatch, isPending]</code>。<code>dispatch(payload)</code> 调用 <code>action(上一次的 state, payload)</code>，把返回值存成新的 state。</li><li>等待 action 时，isPending 为 true。action 完成或抛错后，都要设回 false。</li><li>补全 <code>subscribeAction(prevState, formData)</code>：tries 加 1；邮箱不含 @，返回“邮箱格式不对”；服务器返回 false，返回“这个邮箱已经订阅过了”；成功时返回 <code>{ ok: true, tries }</code>。</li><li>不要修改 App。写完后，你的 subscribeAction 不用改，就能交给 React 19 真正的 useActionState。</li></ol>',
    starter: `import { useState } from 'react';

// 模拟服务器（不用修改）：0.3 秒后返回。这个邮箱已经订阅过，就返回 false
const api = {
  subscribe: (email) => new Promise(resolve => setTimeout(() => resolve(email !== 'taken@example.com'), 300)),
};

// —— 第 1 部分：用 React 18 写一个迷你 useActionState ——
// 返回 [state, dispatch, isPending]
function useActionState(action, initialState) {
  // 1. 用 state 保存 Action 的结果和 isPending
  // 2. dispatch(payload)：先把 isPending 设为 true，
  //    再调用 action(上一次的 state, payload)，等它完成，把返回值存成新的 state
  // 3. 无论 action 成功还是抛错，最后都把 isPending 设回 false
  return [initialState, () => {}, false]; // 占位：换成你的实现
}

// —— 第 2 部分：把提交逻辑写成 Action ——
// 参数：上一次的 state、表单的 FormData。返回值：新的 state
async function subscribeAction(prevState, formData) {
  // 1. tries 在上一次的基础上加 1
  // 2. email 不含 @：返回 { error: '邮箱格式不对', tries }
  // 3. 调用 api.subscribe(email)。返回 false：返回 { error: '这个邮箱已经订阅过了', tries }
  // 4. 成功：返回 { ok: true, tries }
  return prevState; // 占位：换成你的实现
}

function App() {
  const [state, formAction, isPending] = useActionState(subscribeAction, { tries: 0 });
  // React 19 中直接写 <form action={formAction}>。React 18 没有这个功能，这里用 onSubmit 模拟
  function handleSubmit(e) {
    e.preventDefault();
    formAction(new FormData(e.currentTarget));
  }
  return (
    <form onSubmit={handleSubmit}>
      <input id="email" name="email" placeholder="邮箱" />
      <button id="submit" disabled={isPending}>{isPending ? '提交中…' : '订阅'}</button>
      {state.error && <p id="error">{state.error}</p>}
      {state.ok && <p id="ok">订阅成功</p>}
      <p>已提交 <span id="tries">{state.tries}</span> 次</p>
    </form>
  );
}`,
    solution: `import { useState } from 'react';

// 模拟服务器（不用修改）：0.3 秒后返回。这个邮箱已经订阅过，就返回 false
const api = {
  subscribe: (email) => new Promise(resolve => setTimeout(() => resolve(email !== 'taken@example.com'), 300)),
};

// —— 第 1 部分：用 React 18 写一个迷你 useActionState ——
// 返回 [state, dispatch, isPending]
function useActionState(action, initialState) {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  async function dispatch(payload) {
    setIsPending(true);
    try {
      const next = await action(state, payload);
      setState(next);
    } finally {
      setIsPending(false);
    }
  }
  return [state, dispatch, isPending];
}

// —— 第 2 部分：把提交逻辑写成 Action ——
// 参数：上一次的 state、表单的 FormData。返回值：新的 state
async function subscribeAction(prevState, formData) {
  const tries = prevState.tries + 1;
  const email = String(formData.get('email') ?? '').trim();
  if (!email.includes('@')) return { error: '邮箱格式不对', tries };
  const ok = await api.subscribe(email);
  if (!ok) return { error: '这个邮箱已经订阅过了', tries };
  return { ok: true, tries };
}

function App() {
  const [state, formAction, isPending] = useActionState(subscribeAction, { tries: 0 });
  // React 19 中直接写 <form action={formAction}>。React 18 没有这个功能，这里用 onSubmit 模拟
  function handleSubmit(e) {
    e.preventDefault();
    formAction(new FormData(e.currentTarget));
  }
  return (
    <form onSubmit={handleSubmit}>
      <input id="email" name="email" placeholder="邮箱" />
      <button id="submit" disabled={isPending}>{isPending ? '提交中…' : '订阅'}</button>
      {state.error && <p id="error">{state.error}</p>}
      {state.ok && <p id="ok">订阅成功</p>}
      <p>已提交 <span id="tries">{state.tries}</span> 次</p>
    </form>
  );
}`,
    hint: '1. dispatch 做三件事：把 isPending 设为 true；<code>await action(state, payload)</code> 并保存结果；把 isPending 设回 false。抛错时也要设回 false，所以用 try/finally。2. Action 只依赖两个参数：tries 从 prevState 算，email 用 <code>formData.get(\'email\')</code> 读。',
    faded: `import { useState } from 'react';

// 模拟服务器（不用修改）：0.3 秒后返回。这个邮箱已经订阅过，就返回 false
const api = {
  subscribe: (email) => new Promise(resolve => setTimeout(() => resolve(email !== 'taken@example.com'), 300)),
};

// —— 第 1 部分：用 React 18 写一个迷你 useActionState ——
// 返回 [state, dispatch, isPending]
function useActionState(action, initialState) {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  async function dispatch(payload) {
    setIsPending(true);
    try {
      /* ✏️ 调用 action：传入上一次的 state 和 payload，等它完成，把返回值存成新的 state */
    } finally {
      /* ✏️ 无论成功还是抛错，最后都要做的一件事 */
    }
  }
  return [state, dispatch, isPending];
}

// —— 第 2 部分：把提交逻辑写成 Action ——
// 参数：上一次的 state、表单的 FormData。返回值：新的 state
async function subscribeAction(prevState, formData) {
  /* ✏️ 算出 tries：在上一次的基础上加 1 */
  const email = String(formData.get('email') ?? '').trim();
  if (!email.includes('@')) return { error: '邮箱格式不对', tries };
  const ok = await api.subscribe(email);
  /* ✏️ ok 为 false 时返回错误；否则返回 { ok: true, tries } */
}

function App() {
  const [state, formAction, isPending] = useActionState(subscribeAction, { tries: 0 });
  // React 19 中直接写 <form action={formAction}>。React 18 没有这个功能，这里用 onSubmit 模拟
  function handleSubmit(e) {
    e.preventDefault();
    formAction(new FormData(e.currentTarget));
  }
  return (
    <form onSubmit={handleSubmit}>
      <input id="email" name="email" placeholder="邮箱" />
      <button id="submit" disabled={isPending}>{isPending ? '提交中…' : '订阅'}</button>
      {state.error && <p id="error">{state.error}</p>}
      {state.ok && <p id="ok">订阅成功</p>}
      <p>已提交 <span id="tries">{state.tries}</span> 次</p>
    </form>
  );
}`,
    exports: ['useActionState', 'subscribeAction'],
    test: async (t) => {
      t.assert(t.text('#tries') === '0' && !t.q('#error') && !t.q('#ok'), `初始应显示“已提交 0 次”，没有错误和成功提示。实际是 ${t.text('#tries') || '空'} 次`);
      const btn = () => t.q('#submit');
      const waitIdle = async () => { for (let i = 0; i < 30 && btn() && btn().disabled; i++) await t.wait(50); };
      const submit = async (email) => { await t.type('#email', email); await t.click('#submit'); };
      await submit('abc'); await t.wait(60); await waitIdle();
      t.assert(t.text('#error') === '邮箱格式不对', `提交“abc”后应显示“邮箱格式不对”，实际是：${t.text('#error') || '没有 #error'}。dispatch 有没有调用 action，并把它的返回值存成新的 state？`);
      t.assert(t.text('#tries') === '1', `提交 1 次后，“已提交”应为 1，实际是 ${t.text('#tries')}。` + (t.text('#tries') === 'NaN' ? 'Action 读 prevState.tries 没有得到数字：dispatch 调用 action 时，第一个参数要传上一次的 state' : 'Action 要在上一次 state 的 tries 上加 1'));
      await submit('taken@example.com');
      t.assert(btn().disabled && t.text('#submit') === '提交中…', '等待服务器时，按钮应禁用并显示“提交中…”。dispatch 一开始就要把 isPending 设为 true');
      await waitIdle();
      t.assert(!btn().disabled, '服务器返回后，按钮应恢复可点。action 完成后要把 isPending 设回 false');
      t.assert(t.text('#error') === '这个邮箱已经订阅过了', `taken@example.com 已经订阅过，应显示“这个邮箱已经订阅过了”，实际是：${t.text('#error') || '没有 #error'}。Action 要 await api.subscribe(email)，再看它的返回值`);
      t.assert(t.text('#tries') === '2', `提交 2 次后，“已提交”应为 2，实际是 ${t.text('#tries')}`);
      await submit('a@b.com'); await waitIdle();
      t.assert(t.q('#ok') && !t.q('#error'), '提交 a@b.com 后，应显示“订阅成功”，并且不再显示错误。成功时返回的新 state 里不要带上旧的 error');
      t.assert(t.text('#tries') === '3', `提交 3 次后，“已提交”应为 3，实际是 ${t.text('#tries')}`);
      const { useActionState, subscribeAction } = t.exports;
      t.assert(typeof useActionState === 'function' && typeof subscribeAction === 'function', '没有找到 useActionState 和 subscribeAction');
      // Action 只依赖两个参数：直接调用它
      const fd = new FormData(); fd.set('email', 'xyz');
      const r = await subscribeAction({ tries: 41 }, fd);
      t.assert(r && r.error === '邮箱格式不对' && r.tries === 42, `subscribeAction({ tries: 41 }, 邮箱 xyz) 应返回 { error: '邮箱格式不对', tries: 42 }，实际是 ${JSON.stringify(r)}。tries 要从第一个参数 prevState 算出来，不要读组件外的变量`);
      // 单独测试 Hook：传上一次的 state；action 抛错时 isPending 也要恢复
      let probe;
      function Probe() {
        const [st, dispatch, pending] = useActionState(async (prev, x) => { await null; if (x === 'boom') throw new Error('boom'); return prev + x; }, 0);
        probe = { st, dispatch, pending };
        return null;
      }
      const box = document.createElement('div');
      const root = ReactDOM.createRoot(box);
      ReactDOM.flushSync(() => root.render(React.createElement(Probe)));
      const run = (x) => { try { const p = probe.dispatch(x); if (p && p.catch) p.catch(() => {}); } catch (e) {} };
      try {
        run(2); await t.wait(80);
        t.assert(probe.st === 2 && probe.pending === false, `用 action (prev, x) => prev + x、初始值 0 测试：dispatch(2) 后应为 2，实际是 ${probe.st}`);
        run(3); await t.wait(80);
        t.assert(probe.st === 5, `再 dispatch(3) 后应为 2 + 3 = 5，实际是 ${probe.st}。action 的第一个参数要传上一次的 state`);
        run('boom'); await t.wait(80);
        t.assert(probe.pending === false, 'action 抛错后，isPending 仍是 true：按钮会一直显示“提交中…”。用 try/finally，保证最后一定设回 false');
        t.assert(probe.st === 5, `action 抛错时，state 应保持 5，实际是 ${probe.st}`);
      } finally {
        root.unmount();
      }
    },
  },
  checkOnly: [
    {
      q: `提交表单时报错 <code>formData.get is not a function</code>。问题出在哪里？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [message, formAction, isPending] = useActionState(
  async (formData) =&gt; {
    const name = formData.get('name');
    return '已保存 ' + name;
  },
  null
);

&lt;form action={formAction}&gt;…&lt;/form&gt;</code></pre></div>`,
      options: [
        'action 函数的第一个参数是上一次的 state，第二个参数才是 formData',
        'useActionState 的初始值不能是 null',
        '<form action> 只接受字符串 URL',
        'action 函数不能是 async',
      ],
      answer: 0,
      explain: 'useActionState 调用 action 时，传入 <code>(previousState, formData)</code>。这里第一个参数其实是上一次的 state（第一次是 null）。改成 <code>async (prev, formData) =&gt; …</code> 即可。',
    },
    {
      q: `评论区一直显示 fallback，不停地重新请求。哪种改法是对的？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">'use client';

function Comments({ postId }) {
  const comments = use(fetchComments(postId)); // 返回新的 Promise
  return comments.map(c =&gt; &lt;p key={c.id}&gt;{c.text}&lt;/p&gt;);
}</code></pre></div>`,
      options: [
        '在服务端组件里调用 fetchComments(postId)，把 Promise 作为 prop 传给 Comments，再 use 它',
        '改成 use(useMemo(() => fetchComments(postId), [postId]))',
        '把 use(fetchComments(postId)) 移进 useEffect 里调用',
        '用 try/catch 包住 use(…)，出错时返回空列表',
      ],
      answer: 0,
      explain: '问题在于每次渲染都新建 Promise。Promise 完成后 React 重新渲染 Comments，又得到一个未完成的新 Promise，于是再次挂起。Promise 要在渲染之外创建，并且保持同一个对象：由服务端组件创建后传入，或者用按 postId 缓存请求的函数。最迷惑的是 useMemo：组件第一次挂载就挂起，这次渲染没有提交，useMemo 记住的值会被丢掉，重试时又新建一个 Promise。use 也不能在 effect 里调用，也不能放在 try/catch 里。',
    },
    {
      q: `在 React 19 中，输入“买菜”并提交，saveTodo 成功完成后，输入框里是什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">async function add(formData) {
  await saveTodo(formData.get('title'));
}

&lt;form action={add}&gt;
  &lt;input name="title" /&gt;
  &lt;button&gt;添加&lt;/button&gt;
&lt;/form&gt;</code></pre></div>`,
      options: ['仍然是“买菜”：没有代码清空它', '空的', '整个页面刷新，输入框为空', '报错：form 的 action 只能是 URL 字符串'],
      answer: 1,
      explain: '在 React 19 中，把函数传给 <code>&lt;form action&gt;</code> 后，action 成功完成时，React 会自动重置表单里的非受控字段。所以输入框被清空，页面也不会刷新。“没有代码清空它”是 React 18 和普通 onSubmit 的经验。“只能是 URL”是原生 HTML 的规则；React 19 允许传函数，React 18 不支持这种写法。',
    },
  ],
  plays: {
    '用 React 18 模拟乐观更新的效果': {
      note: '① 点击时立刻把乐观值加 1，界面马上显示 43。② 服务器成功时，把真实值 likes 加 1。③ 无论成功或失败，最后都移除乐观值。失败时真实值没变，数字回到 42，这就是“回滚”。',
      predict: {
        q: '点击“点赞（会失败）”。点击后立刻和 1.2 秒后，数字分别是？',
        options: ['42，42', '43，然后回到 42', '43，43', '42，然后变成 43'],
        answer: 1,
        explain: '乐观值立刻加 1。服务器失败后移除乐观值，界面回到真实值 42。',
      },
      pkey: 'react-19|用 React 18 模拟乐观更新的效果',
    },
  },
} satisfies Lesson;
