/* ========== 第六阶段 · 第 42 课：表单与校验架构 ========== */
{
const PRE42 = (src) => '<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">'
  + src.replace(/^\n/, '').replace(/\n\s*$/, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  + '</code></pre></div>';

// 正文、示例和练习共用的迷你 schema（约 25 行）
const MINI_SCHEMA = `function stringSchema(checks = []) {
  // 每个方法都返回一个新的 schema，不修改原来的
  const add = (fn) => stringSchema([...checks, fn]);
  return {
    min: (n, msg) => add(v => v.length >= n || msg),
    email: (msg) => add(v => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v) || msg),
    check(value) {
      const v = typeof value === 'string' ? value : '';
      for (const fn of checks) {
        const r = fn(v);
        if (r !== true) return r; // 返回第一条错误信息
      }
      return null;
    },
  };
}

const s = {
  string: () => stringSchema(),
  object: (shape) => ({
    safeParse(data) {
      const errors = {};
      for (const key of Object.keys(shape)) {
        const msg = shape[key].check(data[key]);
        if (msg) errors[key] = msg;
      }
      return Object.keys(errors).length ? { success: false, errors } : { success: true, data };
    },
  }),
};`;

const EX_HEAD = `import { useState, useRef, useEffect, useId } from 'react';

// ---- 迷你 schema（和正文相同，不用修改） ----
${MINI_SCHEMA}

// ---- 模拟服务器。检查程序会替换这两个函数，所以一定要写 api.xxx(...) 调用 ----
const api = {
  checkUsername(name) {
    const taken = ['admin', 'react', 'ann'].includes(name.toLowerCase());
    return new Promise(r => setTimeout(() => r({ available: !taken }), 900 - Math.min(name.length, 8) * 100));
  },
  register(data) {
    return new Promise(r => setTimeout(() => r({ ok: true }), 1000));
  },
};

const FIELDS = [
  { name: 'username', label: '用户名', type: 'text' },
  { name: 'email', label: '邮箱', type: 'email' },
  { name: 'password', label: '密码', type: 'password' },
];
`;

const EX_APP = `
function App() {
  return <SignupForm />;
}`;

lesson({
  id: 'form-architecture', stage: 5, title: '表单与校验架构', mins: 40,
  summary: '大表单要回答五个问题：数据放哪里、规则写在哪里、错误什么时候显示、异步检查怎样不乱序、提交怎样不重复。',
  goals: [
    '能判断一个表单该用受控、非受控还是 FormData，并说出性能上的原因',
    '能写出一份客户端和服务器共用的校验 schema，并把字段错误用 aria-invalid 和 aria-describedby 关联到输入框',
    '能用 touched 和 submitted 控制错误的显示时机，并解释 touched 和 dirty 的区别',
    '能诊断并修复异步校验的竞态和重复提交',
  ],
  keyPoints: [
    '受控表单每输入一个字，整个表单组件都重新渲染。字段多、校验重时，改用非受控加 FormData，或用按字段订阅的库。',
    '校验规则写成一份 schema，客户端用它给即时反馈，服务器用同一份规则再校验一次。客户端校验只是体验，不是安全措施。',
    '错误一直算，但只在字段被触碰（touched）或提交过（submitted）后才显示。错误显示后，用户一改对就立刻消失。',
    '异步校验要只采用最后一次请求的结果。防抖只能减少请求数，不能消除乱序。',
    '防重复提交：按钮禁用给用户看，ref 标记挡住同一时刻的第二次调用。state 是快照，挡不住。',
  ],
  body: [
    p('第 8 课写了受控表单，第 26 课给字段加了 label 和错误提示，第 28 课看了 React 19 的表单 Actions。这些都是单个技巧。真实的注册、下单、设置页面要把它们组合起来，还会遇到新的问题：字段多了会卡；规则在客户端和服务器各写一遍，慢慢就不一致；用户名检查的结果乱序返回；用户连点两次，订单提交了两次。'),
    p('本课把一个表单拆成五个决策。每个决策都有默认答案，也有不适用的情况。'),

    h('一、数据放在哪里：受控、非受控与 FormData'),
    p('<b>受控</b>：每个字段的值在 state 里，输入框只显示它。<b>非受控</b>：值留在 DOM 里，需要时再读。<b>FormData</b> 是浏览器提供的对象：<code>new FormData(form)</code> 一次读出表单里所有带 <code>name</code> 的字段。'),
    p('受控写法简单直观，但有一个代价：每输入一个字，保存 state 的组件就重新渲染一次，它下面的所有字段也跟着重新渲染。先预测，再运行。'),
    Object.assign(play(`
import { useState, useRef } from 'react';

const NAMES = ['姓名', '电话', '城市', '街道', '邮编', '备注'];

function Field({ name, value, onChange }) {
  const renders = useRef(0);
  renders.current++;
  const valueProps = onChange ? { value, onChange } : { defaultValue: '' };
  return (
    <label style={{ display: 'block', fontSize: 13, margin: '2px 0' }}>
      {name} <input name={name} {...valueProps} style={{ width: 90 }} />{' '}
      <small style={{ color: '#888' }}>渲染 {renders.current} 次</small>
    </label>
  );
}

function ControlledForm() {
  const [values, setValues] = useState({});
  return (
    <form>
      <b>受控</b>
      {NAMES.map(n => (
        <Field key={n} name={n} value={values[n] ?? ''}
          onChange={e => setValues(v => ({ ...v, [n]: e.target.value }))} />
      ))}
    </form>
  );
}

function UncontrolledForm() {
  function handleSubmit(e) {
    e.preventDefault();
    console.log(Object.fromEntries(new FormData(e.currentTarget)));
  }
  return (
    <form onSubmit={handleSubmit}>
      <b>非受控 + FormData</b>
      {NAMES.map(n => <Field key={n} name={n} />)}
      <button>提交（看控制台）</button>
    </form>
  );
}

function App() {
  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <ControlledForm />
      <UncontrolledForm />
    </div>
  );
}`, '每输入一个字，谁在重新渲染？', '受控表单的 state 在 ControlledForm 里。它每次重新渲染，6 个 Field 都跟着渲染，包括你没碰过的“备注”。非受控表单不保存 state，打字时没有任何组件重新渲染，提交时用 FormData 一次读出所有值。<br>6 个字段感觉不到差别。60 个字段、每次渲染都跑一遍校验时，打字就会明显卡顿。'), {
      predict: {
        q: '在左边受控表单的“姓名”里输入 abc 三个字母。最后一行“备注”会显示渲染几次？',
        options: ['4 次', '1 次', '2 次', '3 次'],
        answer: 0,
        explain: '第一次渲染算 1 次。每输入一个字母，ControlledForm 的 state 变化，它和所有子组件都重新渲染，所以是 1 + 3 = 4 次。“备注”的 props 没变，但父组件重新渲染时，子组件默认也重新渲染。右边的非受控表单一直是 1 次。',
      },
      pkey: 'form-architecture|每输入一个字，谁在重新渲染？',
    }),
    table(['', '受控', '非受控 + FormData'], [
      ['值在哪里', 'state', 'DOM'],
      ['输入时重新渲染', '保存 state 的组件及其子树', '没有'],
      ['适合', '输入时就要格式化、字段之间联动、实时预览', '字段多、只在提交时用值'],
      ['难点', '大表单的性能', '联动和“边输入边校验”要另外处理'],
    ]),
    p('两者可以混用：大部分字段非受控，少数需要联动的字段受控。React Hook Form 的思路更进一步：字段默认非受控，用 ref 注册；校验结果和错误按字段订阅，只有出错的那个字段重新渲染（见本课最后的选读）。'),

    h('二、一份规则，两端共用：schema'),
    p('校验规则如果散落在各个 onChange 里，很快就会出现“前端说合法、后端说不合法”。<b>schema</b> 是一份用数据描述的规则：每个字段是什么类型、要满足哪些条件、失败时显示什么。客户端和服务器导入同一份 schema。'),
    p('Zod 是最常用的 schema 库。它的核心思想不复杂，下面用 25 行写一个迷你版：<code>s.string().min(3, 信息)</code> 描述一个字段，<code>s.object({...}).safeParse(数据)</code> 返回每个字段的第一条错误。'),
    play(`
${MINI_SCHEMA}

const signupSchema = s.object({
  username: s.string().min(3, '用户名至少 3 个字符'),
  email: s.string().email('邮箱格式不正确'),
});

// 链式调用不会修改原来的 schema
const base = s.string();
const short = base.min(2, '至少 2 个字');
const long = base.min(6, '至少 6 个字');

function App() {
  const cases = [
    { username: 'ab', email: 'x' },
    { username: 'alice', email: 'alice@example.com' },
  ];
  return (
    <div>
      {cases.map((c, i) => (
        <pre key={i} style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(c)} → {JSON.stringify(signupSchema.safeParse(c))}
        </pre>
      ))}
      <p>short.check('abc')：{String(short.check('abc'))}</p>
      <p>long.check('abc')：{String(long.check('abc'))}</p>
    </div>
  );
}`, '迷你 schema', '每个方法都返回一个<b>新的</b> schema。所以 short 和 long 互不影响：short 只要求 2 个字，返回 null（通过）。如果 min 用 <code>checks.push</code> 修改原数组再返回自己，base、short、long 就成了同一个对象，short 也会要求 6 个字。真正的 Zod 也是不可变的。'),
    p('真实的 Zod 还会做两件迷你版没做的事：把数据转换成目标类型（例如把字符串 "18" 变成数字 18），以及从 schema 推导 TypeScript 类型（<code>z.infer&lt;typeof schema&gt;</code>），表单的类型就不用再写一遍。'),
    warn('<b>客户端校验只是体验。</b>任何人都能绕过页面直接发请求。服务器必须用同一份 schema 再校验一次，并把字段错误返回给页面。有些规则只有服务器能检查，例如“用户名唯一”，最终要靠数据库的唯一约束。'),

    h('三、什么时候显示错误'),
    p('错误什么时候<b>算</b>和什么时候<b>显示</b>是两件事。错误可以每次渲染都从当前值算出来，它是派生数据，不需要存进 state。需要存的只是显示条件：'),
    ul([
      '<b>touched</b>（已触碰）：用户进入过这个字段，又离开了（发生过 blur）。',
      '<b>dirty</b>（已修改）：当前值和初始值不同。',
      '<b>submitted</b>（已提交过）：用户点过一次提交。',
    ]),
    table(['显示时机', '效果', '问题'], [
      ['输入时（onChange）', '反馈最快', '用户刚打第一个字就看到“邮箱格式不正确”，像在被批评'],
      ['离开时（touched）', '用户写完再提醒', '最常用的默认值'],
      ['只在提交时', '最安静', '20 个字段填完才发现第 2 个就错了'],
      ['离开时显示，显示后输入时更新', '晚提醒，早消除', '推荐：一改对，错误马上消失'],
    ]),
    p('推荐的规则写成一行就是：<code>显示 = (touched[字段] || submitted) &amp;&amp; errors[字段]</code>。因为 errors 每次渲染都重新算，错误一旦显示，用户每输入一个字它都会更新，改对后立刻消失。'),
    p('为什么用 touched 而不是 dirty？用户 Tab 经过一个必填字段、什么都没填就离开，dirty 是 false，错误不会出现。可这正是该提醒的时候。'),
    p('错误要能被读屏软件读到。第 26 课讲过三件套：<code>aria-invalid</code>、<code>aria-describedby</code> 指向错误文字、错误文字说明怎样改。表单级还要再做两件事：'),
    ul([
      '提交失败时，把焦点移到第一个出错的字段。否则键盘用户不知道问题在哪里。',
      '不要给每个字段的错误都加 <code>role="alert"</code>。用户离开一个字段就被打断一次。字段错误靠 aria-describedby，在聚焦时读出就够了。',
    ]),

    h('四、异步校验与竞态'),
    p('“用户名是否已被占用”只有服务器知道。用户每输入一个字就可能发一次请求，而请求的返回顺序和发出顺序不一定相同。结果取决于谁先返回，这就是<b>竞态</b>。下面的服务器故意让短名字返回得更慢。先预测，再运行。'),
    Object.assign(play(`
import { useState, useEffect } from 'react';

const TAKEN = ['ann', 'admin'];
// 名字越短，服务器越慢：ann 要 600ms，anna 只要 300ms
function checkName(name) {
  const ms = 1500 - name.length * 300;
  return new Promise(resolve => setTimeout(() => resolve(!TAKEN.includes(name)), ms));
}

function NaiveCheck({ name }) {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!name) return;
    setMsg('检查中…');
    checkName(name).then(ok => setMsg(ok ? '可用' : '已被占用'));
  }, [name]);
  return <p>无保护：<b>{msg}</b></p>;
}

function GuardedCheck({ name }) {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!name) return;
    let ignore = false;
    setMsg('检查中…');
    checkName(name).then(ok => { if (!ignore) setMsg(ok ? '可用' : '已被占用'); });
    return () => { ignore = true; };
  }, [name]);
  return <p>有保护：<b>{msg}</b></p>;
}

function App() {
  const [name, setName] = useState('');
  function typeFast() {
    setName('ann');
    setTimeout(() => setName('anna'), 100);
  }
  return (
    <div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="用户名" />{' '}
      <button onClick={typeFast}>模拟快速输入 ann → anna</button>
      <NaiveCheck name={name} />
      <GuardedCheck name={name} />
    </div>
  );
}`, '用户名检查的竞态', '“anna”的请求先回来，显示“可用”。300ms 后，“ann”的请求才回来，又把结果改成“已被占用”。输入框里是 anna，界面却说已被占用，提交按钮可能因此被禁用。<br>有保护的版本在 name 变化时运行清理函数，把上一次的 ignore 设为 true。旧请求回来时被丢弃。'), {
      predict: {
        q: '点“模拟快速输入”，等 1 秒。“无保护”一行最后显示什么？',
        options: ['已被占用', '可用', '一直是“检查中…”', '先显示“已被占用”，最后变成“可用”'],
        answer: 0,
        explain: '两个请求都发出去了。anna 的请求 300ms 后返回“可用”，ann 的请求 600ms 后才返回“已被占用”，后到的结果覆盖了先到的。界面显示的是 ann 的结果，可输入框里是 anna。',
      },
      pkey: 'form-architecture|用户名检查的竞态',
    }),
    p('修法有三种，原理相同：每个结果都要能回答“我还是最新的吗”。'),
    ul([
      '<b>effect 的 ignore 标记</b>（上面的写法）：值变化时清理函数让旧请求失效。',
      '<b>请求序号</b>：在事件处理函数里发请求时，用 ref 保存一个递增的序号。结果回来时，序号不是最新的就丢弃。',
      '<b>AbortController</b>：直接取消旧请求，还能省下网络流量。被取消的 fetch 会抛出 AbortError，要在 catch 里忽略它。',
    ]),
    p('再加上 200–300ms 的<b>防抖</b>，用户连续打字时只发最后一次请求。但防抖不能代替上面三种修法：用户停顿超过防抖时间后又继续输入，两个请求照样会同时在路上。'),
    warn('检查结果要和<b>值</b>一起保存，例如 <code>{ name: "anna", status: "available" }</code>。提交时比较 name 是不是当前的用户名，状态还是“检查中”就不能提交。只存一个 <code>available: true</code>，就不知道它是哪个名字的结果。'),

    h('五、多步表单：用 reducer 保存每一步'),
    p('注册分三步：账号、资料、确认。常见的错误是每一步的组件用自己的 useState 保存字段。切到下一步时，上一步的组件被卸载，state 随之丢失，点“上一步”看到的是空表单。'),
    p('解决办法是把所有步骤的数据和当前步数提升到父组件，用一个 reducer 管理（第 11 课）。每一步只负责收集和校验自己的字段。'),
    code(`
const initial = { step: 0, data: { account: {}, profile: {} } };

function reducer(state, action) {
  switch (action.type) {
    case 'saveStep':   // 保存当前步，再前进
      return { step: state.step + 1, data: { ...state.data, [action.key]: action.values } };
    case 'back':       // 返回时也保存当前的输入，否则来回切换会丢掉这一步
      return { step: state.step - 1, data: { ...state.data, [action.key]: action.values } };
    default:
      throw new Error('未知的 action：' + action.type);
  }
}

function AccountStep({ saved, dispatch }) {
  const [errors, setErrors] = useState({});
  function handleSubmit(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const result = accountSchema.safeParse(values);   // 每一步一份 schema
    if (!result.success) return setErrors(result.errors);
    dispatch({ type: 'saveStep', key: 'account', values });
  }
  // 非受控字段：用 defaultValue 填回 reducer 里保存的值
  return <form onSubmit={handleSubmit}><input name="email" defaultValue={saved.email} />…</form>;
}`, '多步表单：数据在 reducer 里，步骤组件可以随意卸载'),
    p('这种结构还带来两个好处。最后一步可以用三份子 schema 合起来再校验一次，防止用户改了前面的数据却跳过校验；“确认”页直接读 reducer 的 data，不需要再从各步收集。'),

    h('六、提交：pending 与防重复'),
    p('提交期间要做三件事：按钮禁用并显示“提交中…”；防止重复提交；结束后无论成功失败都恢复。前两件看起来是一件事，其实不是。'),
    p('按钮的 <code>disabled</code> 来自 state，它要等重新渲染后才生效。在同一个事件循环里触发的第二次提交（例如代码连续调用两次 <code>requestSubmit()</code>，或者处理函数先 <code>await</code> 了一个检查，再设置 submitting），读到的还是旧快照里的 <code>submitting === false</code>。'),
    code(`
const submittingRef = useRef(false);
const [submitting, setSubmitting] = useState(false);

async function handleSubmit(e) {
  e.preventDefault();
  if (submittingRef.current) return;  // ref 立刻生效，挡住第二次
  submittingRef.current = true;
  setSubmitting(true);                // state 给界面用：禁用按钮
  try {
    await api.register(values);
  } finally {
    submittingRef.current = false;
    setSubmitting(false);
  }
}`, 'ref 挡住重复调用，state 负责显示'),
    tip('前端防重复只能减少问题，不能消除。网络重试、用户刷新后再提交，都会让服务器收到两次。关键操作（下单、付款）要让服务器认得出重复请求：前端生成一个幂等键（idempotency key）随请求发送，服务器对同一个键只处理一次。'),

    h('七、React 19 的表单 Actions（只能阅读）'),
    p('第 28 课讲过 <code>useActionState</code> 和 <code>useFormStatus</code>。它们正好接管了本课的几件事：Action 收到 FormData；返回值就是字段错误；isPending 就是提交中。下面的代码需要 React 19，本页的运行环境是 18.3.1，只能阅读。'),
    code(`
// schema.js：客户端和服务器共用
export const signupSchema = z.object({
  username: z.string().min(3, '用户名至少 3 个字符'),
  email: z.string().email('邮箱格式不正确'),
});

// actions.js
'use server';
export async function signup(prevState, formData) {
  const values = Object.fromEntries(formData);
  const result = signupSchema.safeParse(values);       // 服务器再校验一次
  if (!result.success) return { values, errors: result.error.flatten().fieldErrors };
  if (await db.user.exists(values.username)) {          // 只有服务器能判断唯一
    return { values, errors: { username: ['用户名已被占用'] } };
  }
  await db.user.create(result.data);
  redirect('/welcome');
}

// SignupForm.jsx
'use client';
function SubmitButton() {
  const { pending } = useFormStatus();                   // 必须在 form 内部的组件里调用
  return <button disabled={pending}>{pending ? '提交中…' : '注册'}</button>;
}

export function SignupForm() {
  const [state, formAction] = useActionState(signup, { values: {}, errors: {} });
  return (
    <form action={formAction}>
      <input name="username" defaultValue={state.values.username}
        aria-invalid={state.errors.username ? true : undefined}
        aria-describedby={state.errors.username ? 'username-error' : undefined} />
      {state.errors.username && <p id="username-error">{state.errors.username[0]}</p>}
      <SubmitButton />
    </form>
  );
}`, 'React 19：同一份 schema，客户端组件 + Server Function'),
    p('Actions 没有替你做的事：错误什么时候显示（它只在提交后返回错误）、异步检查的竞态、多步表单。同一个 useActionState 的多次提交会<b>排队依次执行</b>，不会自动去重，所以按钮仍然要禁用。'),

    h('React Hook Form 为什么快（选读）'),
    p('React Hook Form 的 <code>register(\'email\')</code> 返回 <code>{ name, ref, onChange, onBlur }</code>，展开到原生 input 上，这就是第 41 课讲的 prop getter。字段是非受控的，值存在 DOM 和库内部的对象里，打字不触发 React 渲染。'),
    p('需要显示的东西（某个字段的错误、是否提交中）通过订阅读取。<code>formState.errors.email</code> 只有在 email 的错误变化时才让组件重新渲染。校验交给 resolver，传入 Zod schema 即可：<code>useForm({ resolver: zodResolver(schema), mode: \'onTouched\' })</code>。<code>mode: \'onTouched\'</code> 就是本课第三节推荐的“离开时显示，显示后输入时更新”。'),

    h('浏览器原生校验（选读）'),
    p('<code>required</code>、<code>type="email"</code>、<code>minLength</code>、<code>pattern</code> 不写 JavaScript 就能校验，还能用 <code>:user-invalid</code> CSS 伪类只在用户交互后标红。缺点是：提示气泡的样式和文字无法统一；不同浏览器和读屏软件的表现不一致；跨字段规则和异步规则写不了。常见做法是保留这些属性（移动端键盘会据此切换），在 form 上加 <code>noValidate</code> 关掉气泡，由 schema 负责校验和提示。'),
  ],
  quiz: [
    {
      q: '注册表单的邮箱字段，用户刚输入第一个字母“a”，下面就出现了红色的“邮箱格式不正确”。用户反馈“还没写完就被骂”。下面哪个改法最好？',
      options: ['离开字段后才显示错误；显示之后，每次输入都重新校验，改对就立刻消失', '只在点提交时显示所有错误', '加 500ms 防抖，停止输入后再显示错误', '去掉格式校验，交给服务器'],
      answer: 0,
      explain: '用户写完（离开字段）再提醒，提醒之后立刻跟随输入更新，这样既不打扰，又能马上看到改对了。最迷惑的是“防抖”：用户停下来想一想，错误照样冒出来，问题只是推迟了半秒。只在提交时显示，长表单的用户要到最后才发现前面的错。交给服务器会失去即时反馈。',
    },
    {
      q: '用户名检查已经加了 300ms 防抖。同事说“有了防抖，就不会有竞态了”。他说得对吗？',
      options: ['不对。用户停顿超过 300ms 再继续输入，两个请求仍会同时在路上，仍可能乱序返回', '对。防抖保证同一时间只有一个请求', '对，只要防抖时间比请求时间长', '不对，防抖会让竞态更严重'],
      answer: 0,
      explain: '防抖只决定“什么时候发请求”，不管“已经发出的请求怎样返回”。用户停顿 400ms 后再改一个字，第一个请求已经发出，第二个紧接着发出，返回顺序由服务器决定。即使防抖时间比平均请求时间长，慢请求也照样存在。还是要用 ignore 标记、请求序号或 AbortController，只采用最后一次的结果。',
    },
    {
      q: '三步注册表单，每一步是一个组件，字段用各自组件里的 useState 保存。用户在第 2 步点“上一步”，第 1 步的输入全部变成空的。原因是什么？',
      options: ['切换步骤时，第 1 步的组件被卸载，它的 state 随之丢失', '第 1 步的输入框是非受控的，React 不保存它的值', '父组件重新渲染时，子组件的 state 会被重置', '需要给每一步加 key，React 才能记住它'],
      answer: 0,
      explain: 'state 属于组件在树中的位置。条件渲染换成第 2 步时，第 1 步的组件从树中移除，state 就没了；回来时是一次全新的挂载。“父组件重新渲染会重置子组件 state”是常见误解：只要组件还在原位置，重新渲染不会清空它的 state。加 key 只会让重置更彻底。修法：把各步数据提升到父组件，用 reducer 保存。',
    },
    {
      q: '用户名输入框旁显示“✓ 可用”，用户点了注册。服务器却返回“用户名已被占用”。前端代码没有 bug。最可能的原因是？',
      options: ['检查和提交之间，另一个用户注册了这个名字；唯一性只能在提交时由服务器（数据库约束）最终判断', '浏览器缓存了旧的检查结果', '客户端 schema 和服务器 schema 不一致', '服务器不应该再检查，客户端已经检查过了'],
      answer: 0,
      explain: '“可用”只是检查那一刻的事实。两个用户可能同时看到“可用”，只有一个能注册成功。所以异步检查只是提前提醒，最终判断必须在提交时由服务器做，最好由数据库的唯一约束保证，并把错误返回到字段上。“服务器不应该再检查”恰好说反了：客户端的任何检查都可以被绕过或过期。',
    },
    {
      q: '一个 60 个字段的受控表单，打字明显卡顿。Profiler 显示每输入一个字，整个表单的 60 个字段都重新渲染。第一步最合适的改法是？',
      options: ['让字段非受控，提交时用 FormData 读取；或用按字段订阅的表单库', '给每个字段的 onChange 包上 useCallback', '把 values 放进 Context，字段用 useContext 读取', '用 useDeferredValue 包住整个 values 对象'],
      answer: 0,
      explain: '问题的根源是“一个 state 对象保存所有字段”，任何字段变化都让整个表单重新渲染。非受控或按字段订阅，让打字时只有一个字段（或没有组件）重新渲染。只加 useCallback 不加 memo，子组件照样重新渲染；就算加了 memo，values 每次都是新对象。放进 Context 后所有读取它的字段一起更新，没有改善。useDeferredValue 能让输入框先响应，但每次仍要渲染 60 个字段，是在缓解症状。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps">'
      + '<li>用迷你 schema 写 <code>signupSchema</code>：用户名至少 3 个字符（“用户名至少 3 个字符”），邮箱格式（“邮箱格式不正确”），密码至少 8 位（“密码至少 8 位”）。括号里是错误信息，要一字不差。</li>'
      + '<li>显示时机：字段离开过（onBlur）或点过提交后，才显示这个字段的错误。错误显示后，用户一改对就立刻消失。</li>'
      + '<li>可访问：显示错误时，输入框加 <code>aria-invalid="true"</code>，并用 <code>aria-describedby</code> 指向错误文字的 id。不显示错误时，不要有 aria-invalid="true"。</li>'
      + '<li>异步检查：用户名通过 schema 后，调用 <code>api.checkUsername(用户名)</code>，结果是 <code>{ available }</code>。可以加防抖，但不超过 300ms。只采用最后一次输入的结果。被占用时，用户名的错误是“用户名已被占用”，显示时机同第 2 步。</li>'
      + '<li>提交：有错误、或者当前用户名还没确认“可用”时，不调用 api.register。全部通过时调用 <code>api.register({ username, email, password })</code>。等待期间按钮禁用、文字为“提交中…”；同一时刻的重复提交只能调用一次。成功后显示“注册成功”。</li>'
      + '</ol>',
    starter: EX_HEAD + `
// 第 1 步：用 s.object({...}) 写出三个字段的规则
const signupSchema = s.object({});

function SignupForm() {
  const id = useId();
  const [values, setValues] = useState({ username: '', email: '', password: '' });

  function handleSubmit(e) {
    e.preventDefault();
    // 第 5 步
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      {FIELDS.map(f => (
        <div key={f.name} style={{ marginBottom: 10 }}>
          <label htmlFor={id + f.name}>{f.label}</label><br />
          <input id={id + f.name} name={f.name} type={f.type} value={values[f.name]}
            onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))} />
        </div>
      ))}
      <button type="submit">注册</button>
    </form>
  );
}
` + EX_APP,
    solution: EX_HEAD + `
const signupSchema = s.object({
  username: s.string().min(3, '用户名至少 3 个字符'),
  email: s.string().email('邮箱格式不正确'),
  password: s.string().min(8, '密码至少 8 位'),
});

function SignupForm() {
  const id = useId();
  const [values, setValues] = useState({ username: '', email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  // 检查结果和用户名一起保存：status 为 checking、available 或 taken
  const [nameCheck, setNameCheck] = useState({ name: '', status: 'idle' });
  const [phase, setPhase] = useState('idle'); // idle、submitting、done
  const submittingRef = useRef(false);

  // 错误是派生数据：每次渲染从当前值算出
  const result = signupSchema.safeParse(values);
  const errors = result.success ? {} : { ...result.errors };
  const nameIsCurrent = nameCheck.name === values.username;
  if (!errors.username && nameIsCurrent && nameCheck.status === 'taken') {
    errors.username = '用户名已被占用';
  }
  const localNameError = result.success ? undefined : result.errors.username;

  useEffect(() => {
    if (localNameError) return;
    const name = values.username;
    let ignore = false;
    setNameCheck({ name, status: 'checking' });
    const timer = setTimeout(() => {
      api.checkUsername(name).then(r => {
        if (!ignore) setNameCheck({ name, status: r.available ? 'available' : 'taken' });
      });
    }, 200);
    return () => { ignore = true; clearTimeout(timer); };
  }, [values.username, localNameError]);

  const visible = (name) => (touched[name] || submitted) ? errors[name] : undefined;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submittingRef.current) return;
    setSubmitted(true);
    const firstBad = FIELDS.find(f => errors[f.name]);
    if (firstBad) {
      e.currentTarget.elements[firstBad.name].focus();
      return;
    }
    if (!(nameIsCurrent && nameCheck.status === 'available')) return; // 还在检查
    submittingRef.current = true;
    setPhase('submitting');
    try {
      await api.register({ ...values });
      setPhase('done');
    } catch (err) {
      setPhase('idle');
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      {FIELDS.map(f => {
        const err = visible(f.name);
        const errId = id + f.name + '-error';
        return (
          <div key={f.name} style={{ marginBottom: 10 }}>
            <label htmlFor={id + f.name}>{f.label}</label><br />
            <input id={id + f.name} name={f.name} type={f.type} value={values[f.name]}
              onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, [f.name]: true }))}
              aria-invalid={err ? true : undefined}
              aria-describedby={err ? errId : undefined} />
            {err && <div id={errId} style={{ color: '#c0392b', fontSize: 13 }}>{err}</div>}
            {f.name === 'username' && !err && nameIsCurrent && nameCheck.status === 'checking' &&
              <div style={{ color: '#888', fontSize: 13 }}>正在检查…</div>}
          </div>
        );
      })}
      <button type="submit" disabled={phase === 'submitting'}>
        {phase === 'submitting' ? '提交中…' : '注册'}
      </button>
      {phase === 'done' && <p role="status">注册成功</p>}
    </form>
  );
}
` + EX_APP,
    exports: ['api', 'signupSchema'],
    hint: '先分清三样东西：值（values）、错误（每次渲染用 schema 算出来，不存 state）、显示条件（touched 和 submitted，要存 state）。异步检查放进依赖用户名的 effect，用清理函数让旧请求失效，并把结果和用户名一起保存。防重复提交需要一个 ref：state 要等重新渲染才变，同一时刻的第二次调用读到的还是旧值。',
    faded: EX_HEAD + `
const signupSchema = s.object({
  username: s.string().min(3, '用户名至少 3 个字符'),
  email: s.string().email('邮箱格式不正确'),
  password: s.string().min(8, '密码至少 8 位'),
});

function SignupForm() {
  const id = useId();
  const [values, setValues] = useState({ username: '', email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [nameCheck, setNameCheck] = useState({ name: '', status: 'idle' });
  const [phase, setPhase] = useState('idle');
  const submittingRef = useRef(false);

  const result = signupSchema.safeParse(values);
  const errors = result.success ? {} : { ...result.errors };
  const nameIsCurrent = nameCheck.name === values.username;
  if (!errors.username && nameIsCurrent && nameCheck.status === 'taken') {
    errors.username = '用户名已被占用';
  }
  const localNameError = result.success ? undefined : result.errors.username;

  useEffect(() => {
    if (localNameError) return;
    const name = values.username;
    let ignore = false;
    setNameCheck({ name, status: 'checking' });
    const timer = setTimeout(() => {
      api.checkUsername(name).then(r => {
        /* ✏️ 只有这次请求仍是最新的，才保存 { name, status } */
      });
    }, 200);
    /* ✏️ 清理函数：让这次请求失效，并清掉定时器 */
  }, [values.username, localNameError]);

  /* ✏️ visible(name)：字段离开过或提交过时，返回 errors[name]，否则返回 undefined */

  async function handleSubmit(e) {
    e.preventDefault();
    /* ✏️ 正在提交时直接返回。用 ref 判断，不要用 state */
    setSubmitted(true);
    const firstBad = FIELDS.find(f => errors[f.name]);
    if (firstBad) {
      e.currentTarget.elements[firstBad.name].focus();
      return;
    }
    if (!(nameIsCurrent && nameCheck.status === 'available')) return;
    submittingRef.current = true;
    setPhase('submitting');
    try {
      await api.register({ ...values });
      setPhase('done');
    } catch (err) {
      setPhase('idle');
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      {FIELDS.map(f => {
        const err = visible(f.name);
        const errId = id + f.name + '-error';
        return (
          <div key={f.name} style={{ marginBottom: 10 }}>
            <label htmlFor={id + f.name}>{f.label}</label><br />
            <input id={id + f.name} name={f.name} type={f.type} value={values[f.name]}
              onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, [f.name]: true }))}
              aria-invalid={err ? true : undefined}
              aria-describedby={err ? errId : undefined} />
            {err && <div id={errId} style={{ color: '#c0392b', fontSize: 13 }}>{err}</div>}
          </div>
        );
      })}
      <button type="submit" disabled={phase === 'submitting'}>
        {phase === 'submitting' ? '提交中…' : '注册'}
      </button>
      {phase === 'done' && <p role="status">注册成功</p>}
    </form>
  );
}
` + EX_APP,
    test: async (t) => {
      const api = t.exports.api, schema = t.exports.signupSchema;
      t.assert(api && typeof api.checkUsername === 'function' && typeof api.register === 'function', '请保留 api 对象和它的 checkUsername、register 两个函数');
      t.assert(schema && typeof schema.safeParse === 'function', '请保留 signupSchema，并用 s.object({...}) 创建它');
      const MSG = { username: '用户名至少 3 个字符', email: '邮箱格式不正确', password: '密码至少 8 位' };
      const bad = schema.safeParse({ username: 'ab', email: 'x@', password: '1234567' });
      t.assert(!bad.success && bad.errors, 'signupSchema 对 { username: "ab", email: "x@", password: "1234567" } 应返回失败。三个字段的规则写了吗（步骤 1）？');
      Object.keys(MSG).forEach(k => t.assert(bad.errors[k] === MSG[k], 'signupSchema 的 ' + k + ' 错误应为“' + MSG[k] + '”，实际为：' + (bad.errors[k] || '没有错误') + '（步骤 1）'));
      const good = schema.safeParse({ username: 'abc', email: 'a@b.co', password: '12345678' });
      t.assert(good.success, 'username "abc"、email "a@b.co"、password "12345678" 应该全部通过，实际错误：' + JSON.stringify(good.errors) + '（步骤 1）');

      // 换成可控的假服务器：请求什么时候返回，由检查程序决定
      const checks = [], regs = [];
      api.checkUsername = (name) => new Promise(res => checks.push({ name, res }));
      api.register = (data) => new Promise(res => regs.push({ data, res }));

      const input = (n) => t.q('input[name="' + n + '"]');
      ['username', 'email', 'password'].forEach(n => t.assert(input(n), '找不到 name="' + n + '" 的输入框。不要修改字段的 name'));
      const form = input('username').form;
      const btn = form && form.querySelector('button[type="submit"], button:not([type])');
      t.assert(btn, '找不到提交按钮');
      const blur = async (n) => { input(n).dispatchEvent(new FocusEvent('focusout', { bubbles: true })); await t.wait(40); };
      const described = (n) => (input(n).getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)
        .map(x => document.getElementById(x)).filter(Boolean).map(e => e.textContent.trim()).join(' ');
      const invalid = (n) => input(n).getAttribute('aria-invalid') === 'true';
      const shown = (msg) => t.root.textContent.includes(msg);
      const pending = (name) => checks.filter(c => c.name === name && !c.done);
      const settle = (c, available) => { c.done = true; c.res({ available }); };

      t.assert(!Object.values(MSG).some(shown) && !t.q('[aria-invalid="true"]'), '页面刚打开时不应显示任何错误，也不应有 aria-invalid="true"（步骤 2）');
      await t.type(input('username'), 'ab');
      t.assert(!shown(MSG.username) && !invalid('username'), '用户还在输入用户名（没有离开字段），就显示了“' + MSG.username + '”。错误要在离开字段后或提交后才显示（步骤 2）');
      await blur('username');
      t.assert(shown(MSG.username), '离开用户名输入框后，应显示“' + MSG.username + '”（步骤 2）');
      t.assert(invalid('username'), '用户名显示错误时，输入框要有 aria-invalid="true"（步骤 3）');
      t.assert(described('username').includes(MSG.username), '用户名输入框的 aria-describedby 要指向错误文字所在元素的 id，读屏软件才能读出错误（步骤 3）');
      t.assert(!shown(MSG.email) && !shown(MSG.password) && !invalid('email'), '用户还没碰过邮箱和密码，不应显示它们的错误（步骤 2）');

      await t.click(btn); await t.wait(60);
      t.assert(regs.length === 0, '表单还有错误，点提交时不应调用 api.register（步骤 5）');
      ['username', 'email', 'password'].forEach(n => {
        t.assert(shown(MSG[n]), '点过提交后，所有字段的错误都要显示。没看到“' + MSG[n] + '”（步骤 2）');
        t.assert(invalid(n) && described(n).includes(MSG[n]), '提交后，' + n + ' 输入框要有 aria-invalid="true"，并用 aria-describedby 指向“' + MSG[n] + '”（步骤 3）');
      });
      await t.type(input('email'), 'a@b.co');
      t.assert(!shown(MSG.email) && !invalid('email'), '邮箱改对后，它的错误和 aria-invalid 要立刻消失（步骤 2、3）');
      await t.type(input('password'), '12345678');

      await t.type(input('username'), 'admin'); await t.wait(350);
      t.assert(pending('admin').length >= 1, '用户名“admin”通过了 schema，应调用 api.checkUsername("admin")。防抖时间不要超过 300ms（步骤 4）');
      pending('admin').forEach(c => settle(c, false)); await t.wait(60);
      t.assert(shown('用户名已被占用'), 'api.checkUsername 返回 { available: false } 时，应显示“用户名已被占用”（步骤 4）');
      t.assert(invalid('username') && described('username').includes('用户名已被占用'), '“用户名已被占用”也要用 aria-invalid 和 aria-describedby 关联到输入框（步骤 3、4）');

      await t.type(input('username'), 'neo42'); await t.wait(350);
      t.assert(pending('neo42').length >= 1, '用户名改成“neo42”后，应调用 api.checkUsername("neo42")（步骤 4）');
      t.assert(!shown('用户名已被占用'), '用户名已经改成“neo42”，“用户名已被占用”是上一个名字的结果，应该消失（步骤 4）');
      await t.click(btn); await t.wait(60);
      t.assert(regs.length === 0, '用户名“neo42”还在检查中，就调用了 api.register。用户名确认“可用”之前不能提交（步骤 5）');

      // 竞态：neo42 → ann → anna。anna 的结果先回来，更早的请求后回来
      await t.type(input('username'), 'ann'); await t.wait(350);
      await t.type(input('username'), 'anna'); await t.wait(350);
      t.assert(pending('anna').length >= 1, '用户名改成“anna”后，应调用 api.checkUsername("anna")（步骤 4）');
      pending('anna').forEach(c => settle(c, true)); await t.wait(30);
      pending('ann').forEach(c => settle(c, false)); await t.wait(30);
      pending('neo42').forEach(c => settle(c, false)); await t.wait(60);
      t.assert(!shown('已被占用') && !invalid('username'), '输入框里是“anna”，却显示了“已被占用”：那是更早的请求后返回的结果。只采用最后一次输入的结果，例如在 effect 的清理函数里让旧请求失效（步骤 4）');

      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await t.wait(60);
      t.assert(regs.length >= 1, '所有字段都正确，最后输入的“anna”也已确认可用，提交却没有调用 api.register。是不是更早的请求后返回，覆盖了“anna”的检查结果？旧请求的结果要丢弃（步骤 4、5）');
      t.assert(regs.length === 1, '同一时刻提交了两次，api.register 被调用了 ' + regs.length + ' 次。state 要等重新渲染后才变，第二次调用读到的还是旧值。用一个 ref 标记“正在提交”（步骤 5）');
      const d = regs[0].data || {};
      t.assert(d.username === 'anna' && d.email === 'a@b.co' && d.password === '12345678', 'api.register 收到的数据应为 { username: "anna", email: "a@b.co", password: "12345678" }，实际为：' + JSON.stringify(d) + '（步骤 5）');
      t.assert(btn.disabled, '等待 api.register 期间，提交按钮要禁用（步骤 5）');
      t.assert(btn.textContent.includes('提交中'), '等待期间，按钮文字应为“提交中…”，实际为：' + btn.textContent.trim() + '（步骤 5）');
      regs[0].res({ ok: true }); await t.wait(80);
      t.assert(shown('注册成功'), 'api.register 成功后，应显示“注册成功”（步骤 5）');
      t.assert(regs.length === 1, 'api.register 只应被调用一次，实际 ' + regs.length + ' 次');
    },
  },
  checkOnly: [
    {
      q: '注册页用这个 Field 渲染了“邮箱”和“备用邮箱”两个字段，两个都填错了。读屏用户聚焦“备用邮箱”时，听到的错误是哪一个？' + PRE42(`
function Field({ label, name, error }) {
  return (
    <div>
      <label>{label} <input name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby="field-error" /></label>
      {error && <p id="field-error">{error}</p>}
    </div>
  );
}`),
      options: ['“邮箱”字段的错误：页面上有两个相同的 id，浏览器取第一个', '“备用邮箱”自己的错误', '两条错误都会读出', '什么都不读：id 重复时 aria-describedby 失效'],
      answer: 0,
      explain: 'id 写死了，两个错误元素的 id 都是 field-error。按 id 查找时，浏览器返回文档中的第一个，所以两个输入框都关联到“邮箱”的错误。界面上看一切正常，只有读屏用户听到错的信息。修法：用 useId 生成 id，再拼上后缀。',
    },
    {
      q: '一个迷你 schema 的 min 这样实现。<code>nick.check("abc")</code> 返回什么？' + PRE42(`
function stringSchema() {
  const checks = [];
  const self = {
    min(n, msg) { checks.push(v => v.length >= n || msg); return self; },
    check(v) {
      for (const fn of checks) { const r = fn(v); if (r !== true) return r; }
      return null;
    },
  };
  return self;
}
const name = stringSchema();
const nick = name.min(2, '昵称至少 2 个字');
const full = name.min(5, '全名至少 5 个字');`),
      options: ['“全名至少 5 个字”', 'null（通过）', '“昵称至少 2 个字”', '报错：checks 未定义'],
      answer: 0,
      explain: 'min 修改了同一个 checks 数组并返回同一个对象，所以 name、nick、full 是同一个 schema，带着两条规则。"abc" 通过第一条（至少 2 个字），在第二条（至少 5 个字）失败。修法：每次调用都返回一个带新数组的新 schema，例如 <code>stringSchema([...checks, fn])</code>。',
    },
    {
      q: '邮箱是必填项。用户用 Tab 进入邮箱输入框，什么都没输入，又按 Tab 离开。会显示错误吗？' + PRE42(`
const [values, setValues] = useState({ email: '' });
const errors = schema.safeParse(values).errors ?? {};
const dirty = { email: values.email !== '' };

const showEmailError = dirty.email && errors.email;`),
      options: ['不会：值没有变化，dirty 是 false', '会：离开字段时就该显示', '会：空值不满足规则，错误一直显示', '报错：errors 可能是 undefined'],
      answer: 0,
      explain: 'dirty 只表示“值和初始值不同”。用户没输入，dirty 就是 false，错误不显示。可“经过必填项没填”正是该提醒的情况。所以显示条件应该用 touched（离开过字段），而不是 dirty。errors 有 <code>?? {}</code> 兜底，不会报错。',
    },
    {
      q: '用户在 300ms 内连点两次“注册”。api.register 会被调用几次？' + PRE42(`
const [submitting, setSubmitting] = useState(false);

async function handleSubmit(e) {
  e.preventDefault();
  if (submitting) return;
  const { available } = await api.checkUsername(name); // 约 300ms
  if (!available) return;
  setSubmitting(true);
  await api.register(values);
  setSubmitting(false);
}
// <button disabled={submitting}>注册</button>`),
      options: ['2 次', '1 次', '0 次', '不确定，取决于浏览器'],
      answer: 0,
      explain: 'setSubmitting(true) 写在 await 之后。两次点击都发生在检查返回之前，那时 submitting 还是 false，按钮也还没禁用。两次调用都通过了判断，各自等检查返回后调用 register。修法：在第一行用 ref 标记“正在提交”，并在 await 之前就设置。',
    },
  ],
});
}
