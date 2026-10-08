import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/react-19.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'react-19',
  runtime: 19,
  stage: 3,
  title: 'Actions：异步提交、表单与乐观更新',
  mins: 55,
  summary: 'Action、form action、useActionState、useFormStatus、useOptimistic：把异步提交的 pending、错误、重置和乐观值交给 React。',
  goals: [
    '能说出一次异步提交要管理的 4 件事，以及 React 19 用哪个 API 接管每一件',
    '能把手写 pending、错误和重置的提交处理函数改写成 useActionState + form action',
    '能读懂 useOptimistic 代码，并预测成功、失败和连续点击时界面的变化',
    '能判断 useFormStatus 该在哪个组件里调用，以及一次失败该返回错误值还是抛错',
  ],
  keyPoints: [
    '一次异步提交要管 4 件事：提交中（pending）、错误和结果、成功后重置表单、乐观值。手写要自己写 state；Action 统一接管。',
    '<code>startTransition</code> 可以接收异步函数，这类函数叫 Action。React 自动追踪它的 pending，提前 return 或抛错时也会结束 pending。注意：<code>await</code> 之后的 set 函数调用已不在这个 transition 里，要再包一层 <code>startTransition</code>。',
    '<code>useActionState(action, 初始 state)</code> 返回 <code>[state, formAction, isPending]</code>。Action 的形状是 <code>(上一次的 state, formData) =&gt; 新的 state</code>。Action 结束后，React 重置表单里的非受控字段，出错返回时也一样。',
    '<code>useOptimistic</code> 在 Action 进行中显示预期结果。Action 结束后，乐观值自动丢弃，界面回到真实 state。<code>addOptimistic</code> 必须在 Action 或 <code>startTransition</code> 里调用。',
    '常见坑：在渲染 form 的组件里调用 <code>useFormStatus</code>，读不到这个 form 的状态；预期内的失败（如“邮箱已订阅”）抛错，而不是返回错误值，整块界面会被错误边界换掉。',
  ],
  quiz: [
    {
      q: 'Newsletter 组件渲染了 &lt;form&gt;，并在同一个组件里调用 useFormStatus()。提交时 pending 是？',
      options: ['提交期间为 true，完成后变回 false', '始终是 false', '报错', 'undefined'],
      answer: 1,
      explain:
        'useFormStatus 读取的是<b>上层</b> form 的状态。Newsletter 在 form 外面，它上层没有 form，所以 pending 始终是 false。不会报错，这正是它难发现的地方。修法：把按钮拆成 form 内部的子组件。',
    },
    {
      q: '点赞按钮用 useOptimistic 实现，当前真实值是 42。点击后，Action 里 addOptimistic(1)，然后服务器返回失败，代码 catch 住错误。数字会怎样变化？',
      options: ['先变成 43，Action 结束后回到 42', '一直停在 43，要在 catch 里自己写代码回滚', '一直是 42，等服务器成功才变', '先变成 43，然后变成 41'],
      answer: 0,
      explain:
        '乐观值只在 Action 进行中有效。Action 结束后，React 丢弃它，界面显示真实值 42。真实值从来没变，所以不用自己回滚，这正是 useOptimistic 省掉的工作。不会变成 41：React 不会“减 1”，它只是不再叠加乐观值。',
    },
    {
      q: '订阅表单用 useActionState。服务器返回“这个邮箱已经订阅过了”。Action 应该怎样表达这个失败？',
      options: [
        '在 Action 里 throw new Error(…)，界面会显示这段错误文字',
        '什么都不用做，React 会自动发现请求失败',
        '调用 window.alert，然后返回 undefined',
        '返回 { error: "…" }，组件用 state.error 显示',
      ],
      answer: 3,
      explain:
        '“邮箱已订阅”是预期内的失败，用返回值表达，组件从 state 里读出来显示。Action 抛出的错误不会变成 state：它交给最近的错误边界，整块界面会被边界的 fallback 换掉。React 不会替你判断业务上的失败，也不会自动发现。',
    },
    {
      q: '点赞按钮的 onClick 里直接调用 addOptimistic(1)。这次调用没有放进 startTransition，也不在表单的 action 里。会怎样？',
      options: [
        '数字加 1 并一直保持，要自己写代码回滚',
        '抛出错误，页面崩溃',
        '开发模式下控制台警告：乐观更新发生在 transition 或 action 之外；界面上的数字没有变',
        '照常工作，Action 结束时自动回滚',
      ],
      answer: 2,
      explain:
        'useOptimistic 的乐观值依附在 Action 上：Action 结束，它才知道什么时候丢弃。没有 Action，乐观值没有“生命周期”，React 在开发模式下警告“An optimistic state update occurred outside a transition or action”，并且不显示乐观值。修法：把调用放进 startTransition，或者放进表单的 action 函数。',
    },
  ],
  exercise: {
    task: "<ol class=\"task-steps\"><li>补全 <code>subscribeAction(prevState, formData)</code>（第 1 部分）：tries 在 prevState 的基础上加 1；邮箱不含 @，返回 <code>{ error: '邮箱格式不对', tries }</code>；<code>api.subscribe</code> 返回 false，返回 <code>{ error: '这个邮箱已经订阅过了', tries }</code>；成功返回 <code>{ ok: true, tries }</code>。</li><li>在 <code>App</code> 里（第 2 部分）用 React 19 的 <code>useActionState(subscribeAction, { tries: 0 })</code> 取出 <code>[state, formAction, isPending]</code>，替换掉占位的三行。表单已经写成 <code>&lt;form action={formAction}&gt;</code>。</li><li>不要用 <code>useState</code> 自己管 pending、错误和结果，也不要写 <code>onSubmit</code>：这些都交给 React 19。</li></ol><p>三个提醒：① Action 的第一个参数是上一次的 state，第二个才是 formData。② 预期内的失败用<b>返回值</b>表达，不要 throw：Action 抛错时，错误会交给最近的错误边界。③ 不要修改 <code>prevState</code>，返回一个新对象。</p>",
    starter: `import { useActionState } from 'react';

// 模拟的服务器（不用修改）：0.3 秒后返回。这个邮箱已经订阅过，就返回 false
const api = {
  subscribe: (email) => new Promise(resolve => setTimeout(() => resolve(email !== 'taken@example.com'), 300)),
};

// —— 第 1 部分：把提交逻辑写成 Action ——
// 参数：上一次的 state、表单的 FormData。返回值：新的 state
async function subscribeAction(prevState, formData) {
  // 1. tries 在上一次的基础上加 1
  // 2. email 不含 @：返回 { error: '邮箱格式不对', tries }
  // 3. 调用 api.subscribe(email)。返回 false：返回 { error: '这个邮箱已经订阅过了', tries }
  // 4. 成功：返回 { ok: true, tries }
  return prevState; // 占位：换成你的实现
}

// —— 第 2 部分：把 Action 接到组件上 ——
function App() {
  // 占位：换成 useActionState(subscribeAction, { tries: 0 })
  const state = { tries: 0 };
  const formAction = undefined;
  const isPending = false;
  return (
    <form action={formAction}>
      <input id="email" name="email" placeholder="邮箱" />
      <button id="submit" disabled={isPending}>{isPending ? '提交中…' : '订阅'}</button>
      {state.error && <p id="error">{state.error}</p>}
      {state.ok && <p id="ok">订阅成功</p>}
      <p>已提交 <span id="tries">{state.tries}</span> 次</p>
    </form>
  );
}`,
    solution: `import { useActionState } from 'react';

// 模拟的服务器（不用修改）：0.3 秒后返回。这个邮箱已经订阅过，就返回 false
const api = {
  subscribe: (email) => new Promise(resolve => setTimeout(() => resolve(email !== 'taken@example.com'), 300)),
};

// —— 第 1 部分：把提交逻辑写成 Action ——
// 参数：上一次的 state、表单的 FormData。返回值：新的 state
async function subscribeAction(prevState, formData) {
  const tries = prevState.tries + 1;
  const email = String(formData.get('email') ?? '').trim();
  if (!email.includes('@')) return { error: '邮箱格式不对', tries };
  const ok = await api.subscribe(email);
  if (!ok) return { error: '这个邮箱已经订阅过了', tries };
  return { ok: true, tries };
}

// —— 第 2 部分：把 Action 接到组件上 ——
function App() {
  const [state, formAction, isPending] = useActionState(subscribeAction, { tries: 0 });
  return (
    <form action={formAction}>
      <input id="email" name="email" placeholder="邮箱" />
      <button id="submit" disabled={isPending}>{isPending ? '提交中…' : '订阅'}</button>
      {state.error && <p id="error">{state.error}</p>}
      {state.ok && <p id="ok">订阅成功</p>}
      <p>已提交 <span id="tries">{state.tries}</span> 次</p>
    </form>
  );
}`,
    hint: "1. Action 只依赖两个参数：tries 从 prevState 算，email 用 <code>formData.get('email')</code> 读；先校验，再 <code>await api.subscribe(email)</code>，最后根据返回值决定返回什么。2. 在 App 里：<code>const [state, formAction, isPending] = useActionState(subscribeAction, { tries: 0 })</code>。",
    faded: `import { useActionState } from 'react';

// 模拟的服务器（不用修改）：0.3 秒后返回。这个邮箱已经订阅过，就返回 false
const api = {
  subscribe: (email) => new Promise(resolve => setTimeout(() => resolve(email !== 'taken@example.com'), 300)),
};

// —— 第 1 部分：把提交逻辑写成 Action ——
// 参数：上一次的 state、表单的 FormData。返回值：新的 state
async function subscribeAction(prevState, formData) {
  /* ✏️ 算出 tries：在上一次的基础上加 1 */
  const email = String(formData.get('email') ?? '').trim();
  if (!email.includes('@')) return { error: '邮箱格式不对', tries };
  const ok = await api.subscribe(email);
  /* ✏️ ok 为 false 时返回错误；否则返回 { ok: true, tries } */
}

// —— 第 2 部分：把 Action 接到组件上 ——
function App() {
  /* ✏️ 调用 useActionState，取出 state、formAction、isPending */
  return (
    <form action={formAction}>
      <input id="email" name="email" placeholder="邮箱" />
      <button id="submit" disabled={isPending}>{isPending ? '提交中…' : '订阅'}</button>
      {state.error && <p id="error">{state.error}</p>}
      {state.ok && <p id="ok">订阅成功</p>}
      <p>已提交 <span id="tries">{state.tries}</span> 次</p>
    </form>
  );
}`,
    exports: ['subscribeAction'],
    test: async t => {
      // 这一课跑在 React 19：用 t.React / t.ReactDOM，不读全局的 React / ReactDOM（全局的是 18）
      const { React, ReactDOM } = t;
      t.assert(t.text('#tries') === '0' && !t.q('#error') && !t.q('#ok'), `初始应显示“已提交 0 次”，没有错误和成功提示。实际是 ${t.text('#tries') || '空'} 次`);
      t.assert(/useActionState\s*\(/.test(t.source), '请在 App 里调用 useActionState(subscribeAction, { tries: 0 })，不要用 useState 自己管理');
      const btn = () => t.q('#submit');
      const waitIdle = async () => {
        for (let i = 0; i < 30 && btn() && btn().disabled; i++) await t.wait(50);
      };
      const submit = async email => {
        await t.type('#email', email);
        await t.click('#submit');
      };
      await submit('abc');
      await waitIdle();
      t.assert(
        t.text('#error') === '邮箱格式不对',
        `提交“abc”后应显示“邮箱格式不对”，实际是：${t.text('#error') || '没有 #error'}。App 有没有用 useActionState 返回的 formAction？Action 有没有返回新的 state？`,
      );
      t.assert(
        t.text('#tries') === '1',
        `提交 1 次后，“已提交”应为 1，实际是 ${t.text('#tries')}。` +
          (t.text('#tries') === 'NaN'
            ? 'Action 读 prevState.tries 没有得到数字：第一个参数是上一次的 state，formData 是第二个参数'
            : 'Action 要在上一次 state 的 tries 上加 1'),
      );
      await submit('taken@example.com');
      t.assert(btn().disabled && t.text('#submit') === '提交中…', '等待服务器时，按钮应禁用并显示“提交中…”。isPending 要用 useActionState 返回的第三个值');
      await waitIdle();
      t.assert(!btn().disabled, '服务器返回后，按钮应恢复可点');
      t.assert(
        t.text('#error') === '这个邮箱已经订阅过了',
        `taken@example.com 已经订阅过，应显示“这个邮箱已经订阅过了”，实际是：${t.text('#error') || '没有 #error'}。Action 要 await api.subscribe(email)，再看它的返回值`,
      );
      t.assert(t.text('#tries') === '2', `提交 2 次后，“已提交”应为 2，实际是 ${t.text('#tries')}`);
      await submit('a@b.com');
      await waitIdle();
      t.assert(t.q('#ok') && !t.q('#error'), '提交 a@b.com 后，应显示“订阅成功”，并且不再显示错误。成功时返回的新 state 里不要带上旧的 error');
      t.assert(t.text('#tries') === '3', `提交 3 次后，“已提交”应为 3，实际是 ${t.text('#tries')}`);
      // Action 只依赖两个参数：直接调用它，并且它不能修改传入的 prevState
      const { subscribeAction } = t.exports;
      t.assert(typeof subscribeAction === 'function', '没有找到 subscribeAction');
      const fd = new FormData();
      fd.set('email', 'xyz');
      const prev = { tries: 41 };
      const r = await subscribeAction(prev, fd);
      t.assert(
        r && r.error === '邮箱格式不对' && r.tries === 42,
        `subscribeAction({ tries: 41 }, 邮箱 xyz) 应返回 { error: '邮箱格式不对', tries: 42 }，实际是 ${JSON.stringify(r)}。tries 要从第一个参数 prevState 算出来`,
      );
      t.assert(prev.tries === 41 && r !== prev, '不要修改 prevState：返回一个新对象。原对象被改了，或者返回了同一个对象，React 就看不出 state 变了');
      // 另开一个 root，用真的 useActionState 驱动这个 Action，再卸载
      let probe: any;
      function Probe() {
        const [st, dispatch, pending] = React.useActionState(subscribeAction, { tries: 0 });
        probe = { st, dispatch, pending };
        return null;
      }
      const box = document.createElement('div');
      const root = ReactDOM.createRoot(box);
      ReactDOM.flushSync(() => root.render(React.createElement(Probe)));
      try {
        const fd2 = new FormData();
        fd2.set('email', 'x@y.com');
        React.startTransition(() => probe.dispatch(fd2));
        await t.wait(450);
        t.assert(
          probe.st.ok === true && probe.st.tries === 1 && probe.pending === false,
          `用真的 useActionState 驱动 subscribeAction，提交 x@y.com 后应得到 { ok: true, tries: 1 }，实际是 ${JSON.stringify(probe.st)}`,
        );
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
      explain:
        'useActionState 调用 action 时，传入 <code>(previousState, formData)</code>。这里第一个参数其实是上一次的 state（第一次是 null）。改成 <code>async (prev, formData) =&gt; …</code> 即可。',
    },
    {
      q: `提交返回后，有一次渲染里 name 已经是“新名字”，isPending 却仍是 true，按钮还显示“提交中…”。怎样让 name 的更新和 Action 的结束一起提交？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Rename() {
  const [name, setName] = useState('旧名字');
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () =&gt; {
      await api.rename('新名字');
      setName('新名字');
    });
  }
  …
}</code></pre></div>`,
      options: [
        '把 setName 移到 await 之前',
        '把 isPending 改成自己用 useState 管理',
        'await 之后，用 startTransition(() => setName(…)) 再包一层',
        '去掉 async，改成普通函数',
      ],
      answer: 2,
      explain:
        '<code>await</code> 之后，这个函数已经不在 transition 里了，setName 成了普通的紧急更新，所以会比 Action 的结束更早渲染。再包一层 <code>startTransition</code>，它就重新成为 transition 更新，和 Action 的结束一起提交。把 setName 移到 await 之前，会在服务器确认之前就显示新名字，失败时也不会回滚。自己管 pending 等于放弃 Action。去掉 async 就没有 await 可等了。',
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
      explain:
        '在 React 19 中，把函数传给 <code>&lt;form action&gt;</code> 后，action 成功完成时，React 会自动重置表单里的非受控字段。所以输入框被清空，页面也不会刷新。“没有代码清空它”是 React 18 和普通 onSubmit 的经验。“只能是 URL”是原生 HTML 的规则；React 19 允许传函数，React 18 不支持这种写法。',
    },
  ],
  plays: {
    'Action：异步函数当 transition': {
      note: '点“保存（再包一层）”：控制台里，name 变成“新名字”的那一次渲染，isPending 同时变回 false。点“重置”后再点“保存（不再包）”：服务器返回后，会先出现一次 isPending 仍为 true、name 已是“新名字”的渲染，然后 isPending 才变回 false。原因：await 之后的 setName 不在 transition 里，是普通的紧急更新，比 Action 的结束更早渲染。',
    },
    'useActionState 与 form action': {
      note: '输入不含 @ 的内容提交，出错信息显示后，输入框被清空：Action 结束时，React 会重置表单里的非受控字段，出错返回时也一样。成功时同理。要保留用户的输入，把它放进返回的 state，用 defaultValue 填回去。',
      predict: {
        q: '输入 abc（没有 @）并点“订阅”。0.8 秒后出现“邮箱格式不对”。此时输入框里是什么？',
        options: ['还是 abc', '空的', '红色的 abc', '输入框消失了'],
        answer: 1,
        explain: 'Action 结束后，React 重置表单里的非受控字段，出错返回时也一样。输入框被清空，用户要重新输入。',
      },
      pkey: 'react-19|useActionState 与 form action',
    },
    'useFormStatus：按钮写在哪里': {
      note: 'useFormStatus 读取的是“上层最近的 form”的状态。按钮 B 在 SubmitB 里，SubmitB 渲染在 form 内部，所以 pending 为 true。App 本身渲染 form，它的上层没有 form，所以按钮 A 读到的 pending 始终是 false，也不会报错。修法：把按钮拆成 form 内部的子组件。',
      predict: {
        q: '点击任意一个按钮提交表单。提交后的 1.5 秒内，哪些按钮显示“提交中…”？',
        options: ['A 和 B 都显示', '只有 B', '只有 A', '都不显示'],
        answer: 1,
        explain: 'useFormStatus 读的是上层 form 的状态。App 自己渲染 form，调用它读不到；SubmitB 在 form 里面，能读到。',
      },
      pkey: 'react-19|useFormStatus：按钮写在哪里',
    },
    '手写版乐观更新（对照用）': {
      note: '这是不用 useOptimistic 的写法：多存一个 pending 数字，显示 likes + pending。成功时 likes 加 1，失败时只显示错误；两种情况下，finally 里都要手动把 pending 减 1。漏写 finally，数字就会一直停在 43。',
      predict: {
        q: '点击“点赞（会失败）”。点击后立刻和 1.2 秒后，数字分别是？',
        options: ['42，42', '43，然后回到 42', '43，43', '42，然后变成 43'],
        answer: 1,
        explain: 'pending 立刻加 1，界面显示 43。服务器失败后，finally 把 pending 减回 0，真实值 likes 没变，界面回到 42。',
      },
      pkey: 'react-19|用 React 18 模拟乐观更新的效果',
    },
    'useOptimistic：先显示，失败再回滚': {
      note: '① 点击时立刻调用 addOptimistic(1)，界面马上显示 43。② 服务器成功时，把真实值 likes 加 1。③ Action 结束时，React 自动丢弃乐观值，不用自己写。失败时真实值没变，数字回到 42，这就是“回滚”。连续点击时，多个 Action 会一起结束、一起提交：第二个 Action 结束之前，真实值不变，乐观值保持叠加。',
      predict: {
        q: '先点一次“点赞（会成功）”，约 0.6 秒后再点一次。从第一次点击算起约 1.4 秒时（第一次的请求已经返回，第二次的还没有），数字是？',
        options: ['42', '43', '44', '先变成 43，再变回 44'],
        answer: 2,
        explain:
          '两个 Action 同时在进行。React 要等它们都结束，才一起提交真实值，所以第一次请求返回时，界面没有变化：乐观值仍然叠加，显示 44。两个 Action 都结束后，真实值才变成 44。',
      },
      pkey: 'react-19|useOptimistic：先显示，失败再回滚',
    },
    'Action 抛错与返回错误值': {
      note: '输入 bad：Action 返回 { error }，错误文字显示在表单下面，表单还在。输入 boom：Action 抛出的错误不会存进 state，而是交给最近的错误边界，整个表单被边界的 fallback 换掉。所以预期内的失败要用返回值表达。',
      predict: {
        q: '输入 boom 并点“保存”。0.4 秒后，界面是什么？',
        options: [
          '表单还在，下面显示红色的“服务器崩溃了”',
          '表单被换成错误边界的内容：“错误边界接住了：服务器崩溃了”',
          '界面不变，只有控制台报错',
          '按钮一直显示“提交中…”',
        ],
        answer: 1,
        explain:
          'Action 抛出的错误不会变成 state。React 把它交给最近的错误边界，边界渲染它的 fallback，整个表单被换掉。想让错误显示在表单下面，要在 Action 里返回错误值，就像输入 bad 那样。',
      },
      pkey: 'react-19|Action 抛错与返回错误值',
    },
    'use() 读取 Promise，配合 Suspense': {
      note: '同一个 id 的 Promise 缓存在组件外面，所以是同一个对象。React 记住了它已经完成，再次 use 它时直接返回结果，不会再暂停。第一次读取 Bob 的 Promise 还没完成，所以显示 fallback。这一项的完整讲解在《Suspense 数据获取与资源模式》。',
      predict: {
        q: '页面打开后等 Alice 出现，点“看 Bob”，等 Bob 出现，再点“看 Alice”。最后这一次点击后，页面会显示“加载中…”吗？',
        options: ['不会，Alice 的内容立刻出现', '会，要再等 1 秒', '会，但只闪一下', '报错'],
        answer: 0,
        explain: 'Alice 的 Promise 是缓存的同一个对象，并且已经完成。use() 对已完成的 Promise 直接返回结果，组件不会暂停。',
      },
      pkey: 'react-19|use() 读取 Promise，配合 Suspense',
    },
    'Activity：隐藏界面，保留 state': {
      note: '条件渲染的标签 A 在切走时被卸载，state 丢失，effect 被清理。Activity 隐藏的标签 B 只是被隐藏：state 保留，effect 被清理，切回来时 effect 重新运行。看下面的控制台：B 的 effect 在隐藏时被清理，显示时又运行。这一项的完整讲解在《渲染机制》。',
      predict: {
        q: '在标签 A 的输入框输入“甲”，切到标签 B，在它的输入框输入“乙”，再依次切回 A、切回 B。此时 A 和 B 的输入框里分别是什么？',
        options: ['A：甲，B：乙', 'A：空，B：乙', 'A：空，B：空', 'A：甲，B：空'],
        answer: 1,
        explain: '标签 A 是条件渲染，切走就卸载，输入的内容丢了。标签 B 在 Activity 里，隐藏时 state 保留，所以“乙”还在。',
      },
      pkey: 'react-19|Activity：隐藏界面，保留 state',
    },
    'ref 作为普通 prop': {
      note: 'FancyInput 是函数组件，直接从 props 里取 ref，没有用 forwardRef。点“卸载方框”，看控制台：卸载时 React 调用的是 ref 回调返回的清理函数。维护 React 18 项目时：18 要用 forwardRef，卸载时 ref 回调会以 null 再调用一次。这一项的完整讲解在《DOM 逃生舱》。',
    },
    'Context 直接当 Provider': {
      note: '这里写的是 <ThemeContext value={theme}>，没有 .Provider。React 18 要写 .Provider。这一项的完整讲解在《Context》。',
    },
    'useEffectEvent：读最新值但不重启 effect': {
      note: '点“换房间”：控制台出现“断开”和“连接到”。点“换主题”：什么也不重启，但下一次连接完成时，onConnected 读到的是最新的主题。不用 useEffectEvent 的话，theme 要写进依赖数组，换主题就会断开重连。这一项的完整讲解在《闭包陷阱与 Effect 依赖》。',
    },
    'ViewTransition：进入和离开的动画': {
      note: '点“展开”和“收起”：卡片带着淡入淡出的动画出现和消失。更新放在 startTransition 里才会触发动画。动画由浏览器的 View Transition API 执行。这一项的完整讲解在《并发特性》。',
    },
  },
} satisfies Lesson;
