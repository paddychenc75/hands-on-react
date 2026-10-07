import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/form-architecture.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'form-architecture',
  stage: 5,
  title: '表单与校验架构',
  mins: 41,
  summary: '大表单要回答五个问题：数据放哪里、规则写在哪里、错误什么时候显示、异步检查怎样不乱序、提交怎样不重复。',
  goals: [
    '能判断一个表单该用受控、非受控还是 FormData，并说出性能上的原因',
    '能写出一份客户端和服务器共用的校验 schema，并把字段错误用 aria-invalid 和 aria-describedby 关联到输入框',
    '能用 touched 和 submitted 控制错误的显示时机，并解释 touched 和 dirty 的区别',
    '能诊断并修复异步校验的竞态和重复提交',
  ],
  keyPoints: [
    '受控表单每输入一个字，整个表单组件都重新渲染。字段多、校验重时，改用非受控加 FormData，或用按需订阅的库。',
    '校验规则写成一份 schema，客户端用它给即时反馈，服务器用同一份规则再校验一次。客户端校验只是体验，不是安全措施。',
    '错误一直算，但只在字段被触碰（touched）或提交过（submitted）后才显示。错误显示后，用户一改对就立刻消失。',
    '异步校验要只采用最后一次请求的结果。防抖只能减少请求数，不能消除乱序。',
    '防重复提交：按钮禁用给用户看，ref 标记挡住同一时刻的第二次调用。state 是快照，挡不住。',
  ],
  quiz: [
    {
      q: '注册表单的邮箱字段，用户刚输入第一个字母“a”，下面就出现了红色的“邮箱格式不正确”。用户反馈“还没写完就被骂”。下面哪个改法最好？',
      options: [
        '离开字段后才显示错误；显示之后，每次输入都重新校验，改对就立刻消失',
        '只在点提交时显示所有错误',
        '加 500ms 防抖，停止输入后再显示错误',
        '去掉格式校验，交给服务器',
      ],
      answer: 0,
      explain:
        '用户写完（离开字段）再提醒，提醒之后立刻跟随输入更新，这样既不打扰，又能马上看到改对了。最迷惑的是“防抖”：用户停下来想一想，错误照样冒出来，问题只是推迟了半秒。只在提交时显示，长表单的用户要到最后才发现前面的错。交给服务器会失去即时反馈。',
    },
    {
      q: '用户名检查已经加了 300ms 防抖。同事说“有了防抖，就不会有竞态了”。他说得对吗？',
      options: [
        '不对。用户停顿超过 300ms 再继续输入，两个请求仍会同时在路上，仍可能乱序返回',
        '对。防抖保证同一时间只有一个请求',
        '对，只要防抖时间比请求时间长',
        '不对，防抖会让竞态更严重',
      ],
      answer: 0,
      explain:
        '防抖只决定“什么时候发请求”，不管“已经发出的请求怎样返回”。用户停顿 400ms 后再改一个字，第一个请求已经发出，第二个紧接着发出，返回顺序由服务器决定。即使防抖时间比平均请求时间长，慢请求也照样存在。还是要用 ignore 标记、请求序号或 AbortController，只采用最后一次的结果。',
    },
    {
      q: '三步注册表单，每一步是一个组件，字段用各自组件里的 useState 保存。用户在第 2 步点“上一步”，第 1 步的输入全部变成空的。原因是什么？',
      options: [
        '切换步骤时，第 1 步的组件被卸载，它的 state 随之丢失',
        '第 1 步的输入框是非受控的，React 不保存它的值',
        '父组件重新渲染时，子组件的 state 会被重置',
        '需要给每一步加 key，React 才能记住它',
      ],
      answer: 0,
      explain:
        'state 属于组件在树中的位置。条件渲染换成第 2 步时，第 1 步的组件从树中移除，state 就没了；回来时是一次全新的挂载。“父组件重新渲染会重置子组件 state”是常见误解：只要组件还在原位置，重新渲染不会清空它的 state。加 key 只会让重置更彻底。修法：把各步数据提升到父组件，用 reducer 保存。',
    },
    {
      q: '用户名输入框旁显示“✓ 可用”，用户点了注册。服务器却返回“用户名已被占用”。前端代码没有 bug。最可能的原因是？',
      options: [
        '检查和提交之间，另一个用户注册了这个名字；唯一性只能在提交时由服务器（数据库约束）最终判断',
        '浏览器缓存了旧的检查结果',
        '客户端 schema 和服务器 schema 不一致',
        '服务器不应该再检查，客户端已经检查过了',
      ],
      answer: 0,
      explain:
        '“可用”只是检查那一刻的事实。两个用户可能同时看到“可用”，只有一个能注册成功。所以异步检查只是提前提醒，最终判断必须在提交时由服务器做，最好由数据库的唯一约束保证，并把错误返回到字段上。“服务器不应该再检查”恰好说反了：客户端的任何检查都可以被绕过或过期。',
    },
    {
      q: '一个 60 个字段的受控表单，打字明显卡顿。Profiler 显示每输入一个字，整个表单的 60 个字段都重新渲染。第一步最合适的改法是？',
      options: [
        '让字段非受控，提交时用 FormData 读取；或用按需订阅的表单库',
        '给每个字段的 onChange 包上 useCallback',
        '把 values 放进 Context，字段用 useContext 读取',
        '用 useDeferredValue 包住整个 values 对象',
      ],
      answer: 0,
      explain:
        '问题的根源是“一个 state 对象保存所有字段”，任何字段变化都让整个表单重新渲染。非受控或按需订阅，让打字时只有一个字段（或没有组件）重新渲染。只加 useCallback 不加 memo，子组件照样重新渲染；就算加了 memo，values 每次都是新对象。放进 Context 后所有读取它的字段一起更新，没有改善。useDeferredValue 能让输入框先响应，但每次仍要渲染 60 个字段，是在缓解症状。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>用迷你 schema 写 <code>signupSchema</code>：用户名至少 3 个字符（“用户名至少 3 个字符”），邮箱格式（“邮箱格式不正确”），密码至少 8 位（“密码至少 8 位”）。括号里是错误信息，要一字不差。</li><li>显示时机：字段离开过（onBlur）或点过提交后，才显示这个字段的错误。错误显示后，用户一改对就立刻消失。</li><li>可访问：显示错误时，输入框加 <code>aria-invalid="true"</code>，并用 <code>aria-describedby</code> 指向错误文字的 id。不显示错误时，不要有 aria-invalid="true"。</li><li>异步检查：用户名通过 schema 后，调用 <code>api.checkUsername(用户名)</code>，结果是 <code>{ available }</code>。可以加防抖，但不超过 300ms。只采用最后一次输入的结果。被占用时，用户名的错误是“用户名已被占用”，显示时机同第 2 步。</li><li>提交：有错误、或者当前用户名还没确认“可用”时，不调用 api.register。全部通过时调用 <code>api.register({ username, email, password })</code>。等待期间按钮禁用、文字为“提交中…”；同一时刻的重复提交只能调用一次。成功后显示“注册成功”。</li></ol>',
    starter: `import { useState, useRef, useEffect, useId } from 'react';

// ---- 迷你 schema（和正文相同，不用修改） ----
function stringSchema(checks = []) {
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
};

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

function App() {
  return <SignupForm />;
}`,
    solution: `import { useState, useRef, useEffect, useId } from 'react';

// ---- 迷你 schema（和正文相同，不用修改） ----
function stringSchema(checks = []) {
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
};

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

function App() {
  return <SignupForm />;
}`,
    exports: ['api', 'signupSchema'],
    hint: '先分清三样东西：值（values）、错误（每次渲染用 schema 算出来，不存 state）、显示条件（touched 和 submitted，要存 state）。异步检查放进依赖用户名的 effect，用清理函数让旧请求失效，并把结果和用户名一起保存。防重复提交需要一个 ref：state 要等重新渲染才变，同一时刻的第二次调用读到的还是旧值。',
    faded: `import { useState, useRef, useEffect, useId } from 'react';

// ---- 迷你 schema（和正文相同，不用修改） ----
function stringSchema(checks = []) {
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
};

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

function App() {
  return <SignupForm />;
}`,
    test: async t => {
      const api = t.exports.api,
        schema = t.exports.signupSchema;
      t.assert(api && typeof api.checkUsername === 'function' && typeof api.register === 'function', '请保留 api 对象和它的 checkUsername、register 两个函数');
      t.assert(schema && typeof schema.safeParse === 'function', '请保留 signupSchema，并用 s.object({...}) 创建它');
      const MSG = { username: '用户名至少 3 个字符', email: '邮箱格式不正确', password: '密码至少 8 位' };
      const bad = schema.safeParse({ username: 'ab', email: 'x@', password: '1234567' });
      t.assert(!bad.success && bad.errors, 'signupSchema 对 { username: "ab", email: "x@", password: "1234567" } 应返回失败。三个字段的规则写了吗（步骤 1）？');
      Object.keys(MSG).forEach(k =>
        t.assert(bad.errors[k] === MSG[k], 'signupSchema 的 ' + k + ' 错误应为“' + MSG[k] + '”，实际为：' + (bad.errors[k] || '没有错误') + '（步骤 1）'),
      );
      const good = schema.safeParse({ username: 'abc', email: 'a@b.co', password: '12345678' });
      t.assert(good.success, 'username "abc"、email "a@b.co"、password "12345678" 应该全部通过，实际错误：' + JSON.stringify(good.errors) + '（步骤 1）');

      // 换成可控的假服务器：请求什么时候返回，由检查程序决定
      const checks = [],
        regs = [];
      api.checkUsername = name => new Promise(res => checks.push({ name, res }));
      api.register = data => new Promise(res => regs.push({ data, res }));

      const input = n => t.q('input[name="' + n + '"]');
      ['username', 'email', 'password'].forEach(n => t.assert(input(n), '找不到 name="' + n + '" 的输入框。不要修改字段的 name'));
      const form = input('username').form;
      const btn = form && form.querySelector('button[type="submit"], button:not([type])');
      t.assert(btn, '找不到提交按钮');
      const blur = async n => {
        input(n).dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        await t.wait(40);
      };
      const described = n =>
        (input(n).getAttribute('aria-describedby') || '')
          .split(/\s+/)
          .filter(Boolean)
          .map(x => document.getElementById(x))
          .filter(Boolean)
          .map(e => e.textContent.trim())
          .join(' ');
      const invalid = n => input(n).getAttribute('aria-invalid') === 'true';
      const shown = msg => t.root.textContent.includes(msg);
      const pending = name => checks.filter(c => c.name === name && !c.done);
      const settle = (c, available) => {
        c.done = true;
        c.res({ available });
      };

      t.assert(!Object.values(MSG).some(shown) && !t.q('[aria-invalid="true"]'), '页面刚打开时不应显示任何错误，也不应有 aria-invalid="true"（步骤 2）');
      await t.type(input('username'), 'ab');
      t.assert(
        !shown(MSG.username) && !invalid('username'),
        '用户还在输入用户名（没有离开字段），就显示了“' + MSG.username + '”。错误要在离开字段后或提交后才显示（步骤 2）',
      );
      await blur('username');
      t.assert(shown(MSG.username), '离开用户名输入框后，应显示“' + MSG.username + '”（步骤 2）');
      t.assert(invalid('username'), '用户名显示错误时，输入框要有 aria-invalid="true"（步骤 3）');
      t.assert(described('username').includes(MSG.username), '用户名输入框的 aria-describedby 要指向错误文字所在元素的 id，读屏软件才能读出错误（步骤 3）');
      t.assert(!shown(MSG.email) && !shown(MSG.password) && !invalid('email'), '用户还没碰过邮箱和密码，不应显示它们的错误（步骤 2）');

      await t.click(btn);
      await t.wait(60);
      t.assert(regs.length === 0, '表单还有错误，点提交时不应调用 api.register（步骤 5）');
      ['username', 'email', 'password'].forEach(n => {
        t.assert(shown(MSG[n]), '点过提交后，所有字段的错误都要显示。没看到“' + MSG[n] + '”（步骤 2）');
        t.assert(
          invalid(n) && described(n).includes(MSG[n]),
          '提交后，' + n + ' 输入框要有 aria-invalid="true"，并用 aria-describedby 指向“' + MSG[n] + '”（步骤 3）',
        );
      });
      await t.type(input('email'), 'a@b.co');
      t.assert(!shown(MSG.email) && !invalid('email'), '邮箱改对后，它的错误和 aria-invalid 要立刻消失（步骤 2、3）');
      await t.type(input('password'), '12345678');

      await t.type(input('username'), 'admin');
      await t.wait(350);
      t.assert(pending('admin').length >= 1, '用户名“admin”通过了 schema，应调用 api.checkUsername("admin")。防抖时间不要超过 300ms（步骤 4）');
      pending('admin').forEach(c => settle(c, false));
      await t.wait(60);
      t.assert(shown('用户名已被占用'), 'api.checkUsername 返回 { available: false } 时，应显示“用户名已被占用”（步骤 4）');
      t.assert(
        invalid('username') && described('username').includes('用户名已被占用'),
        '“用户名已被占用”也要用 aria-invalid 和 aria-describedby 关联到输入框（步骤 3、4）',
      );

      await t.type(input('username'), 'neo42');
      await t.wait(350);
      t.assert(pending('neo42').length >= 1, '用户名改成“neo42”后，应调用 api.checkUsername("neo42")（步骤 4）');
      t.assert(!shown('用户名已被占用'), '用户名已经改成“neo42”，“用户名已被占用”是上一个名字的结果，应该消失（步骤 4）');
      await t.click(btn);
      await t.wait(60);
      t.assert(regs.length === 0, '用户名“neo42”还在检查中，就调用了 api.register。用户名确认“可用”之前不能提交（步骤 5）');

      // 竞态：neo42 → ann → anna。anna 的结果先回来，更早的请求后回来
      await t.type(input('username'), 'ann');
      await t.wait(350);
      await t.type(input('username'), 'anna');
      await t.wait(350);
      t.assert(pending('anna').length >= 1, '用户名改成“anna”后，应调用 api.checkUsername("anna")（步骤 4）');
      pending('anna').forEach(c => settle(c, true));
      await t.wait(30);
      pending('ann').forEach(c => settle(c, false));
      await t.wait(30);
      pending('neo42').forEach(c => settle(c, false));
      await t.wait(60);
      t.assert(
        !shown('已被占用') && !invalid('username'),
        '输入框里是“anna”，却显示了“已被占用”：那是更早的请求后返回的结果。只采用最后一次输入的结果，例如在 effect 的清理函数里让旧请求失效（步骤 4）',
      );

      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await t.wait(60);
      t.assert(
        regs.length >= 1,
        '所有字段都正确，最后输入的“anna”也已确认可用，提交却没有调用 api.register。是不是更早的请求后返回，覆盖了“anna”的检查结果？旧请求的结果要丢弃（步骤 4、5）',
      );
      t.assert(
        regs.length === 1,
        '同一时刻提交了两次，api.register 被调用了 ' +
          regs.length +
          ' 次。state 要等重新渲染后才变，第二次调用读到的还是旧值。用一个 ref 标记“正在提交”（步骤 5）',
      );
      const d = regs[0].data || {};
      t.assert(
        d.username === 'anna' && d.email === 'a@b.co' && d.password === '12345678',
        'api.register 收到的数据应为 { username: "anna", email: "a@b.co", password: "12345678" }，实际为：' + JSON.stringify(d) + '（步骤 5）',
      );
      t.assert(btn.disabled, '等待 api.register 期间，提交按钮要禁用（步骤 5）');
      t.assert(btn.textContent.includes('提交中'), '等待期间，按钮文字应为“提交中…”，实际为：' + btn.textContent.trim() + '（步骤 5）');
      regs[0].res({ ok: true });
      await t.wait(80);
      t.assert(shown('注册成功'), 'api.register 成功后，应显示“注册成功”（步骤 5）');
      t.assert(regs.length === 1, 'api.register 只应被调用一次，实际 ' + regs.length + ' 次');
    },
  },
  checkOnly: [
    {
      q: `注册页用这个 Field 渲染了“邮箱”和“备用邮箱”两个字段，两个都填错了。读屏用户聚焦“备用邮箱”时，听到的错误是哪一个？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Field({ label, name, error }) {
  return (
    &lt;div&gt;
      &lt;label&gt;{label} &lt;input name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby="field-error" /&gt;&lt;/label&gt;
      {error &amp;&amp; &lt;p id="field-error"&gt;{error}&lt;/p&gt;}
    &lt;/div&gt;
  );
}</code></pre></div>`,
      options: [
        '“邮箱”字段的错误：页面上有两个相同的 id，浏览器取第一个',
        '“备用邮箱”自己的错误',
        '两条错误都会读出',
        '什么都不读：id 重复时 aria-describedby 失效',
      ],
      answer: 0,
      explain:
        'id 写死了，两个错误元素的 id 都是 field-error。按 id 查找时，浏览器返回文档中的第一个，所以两个输入框都关联到“邮箱”的错误。界面上看一切正常，只有读屏用户听到错的信息。修法：用 useId 生成 id，再拼上后缀。',
    },
    {
      q: `一个迷你 schema 的 min 这样实现。<code>nick.check("abc")</code> 返回什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function stringSchema() {
  const checks = [];
  const self = {
    min(n, msg) { checks.push(v =&gt; v.length &gt;= n || msg); return self; },
    check(v) {
      for (const fn of checks) { const r = fn(v); if (r !== true) return r; }
      return null;
    },
  };
  return self;
}
const name = stringSchema();
const nick = name.min(2, '昵称至少 2 个字');
const full = name.min(5, '全名至少 5 个字');</code></pre></div>`,
      options: ['“全名至少 5 个字”', 'null（通过）', '“昵称至少 2 个字”', '报错：checks 未定义'],
      answer: 0,
      explain:
        'min 修改了同一个 checks 数组并返回同一个对象，所以 name、nick、full 是同一个 schema，带着两条规则。"abc" 通过第一条（至少 2 个字），在第二条（至少 5 个字）失败。修法：每次调用都返回一个带新数组的新 schema，例如 <code>stringSchema([...checks, fn])</code>。',
    },
    {
      q: `邮箱是必填项。用户用 Tab 进入邮箱输入框，什么都没输入，又按 Tab 离开。会显示错误吗？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [values, setValues] = useState({ email: '' });
const errors = schema.safeParse(values).errors ?? {};
const dirty = { email: values.email !== '' };

const showEmailError = dirty.email &amp;&amp; errors.email;</code></pre></div>`,
      options: ['不会：值没有变化，dirty 是 false', '会：离开字段时就该显示', '会：空值不满足规则，错误一直显示', '报错：errors 可能是 undefined'],
      answer: 0,
      explain:
        'dirty 只表示“值和初始值不同”。用户没输入，dirty 就是 false，错误不显示。可“经过必填项没填”正是该提醒的情况。所以显示条件应该用 touched（离开过字段），而不是 dirty。errors 有 <code>?? {}</code> 兜底，不会报错。',
    },
    {
      q: `用户在 300ms 内连点两次“注册”。api.register 会被调用几次？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [submitting, setSubmitting] = useState(false);

async function handleSubmit(e) {
  e.preventDefault();
  if (submitting) return;
  const { available } = await api.checkUsername(name); // 约 300ms
  if (!available) return;
  setSubmitting(true);
  await api.register(values);
  setSubmitting(false);
}
// &lt;button disabled={submitting}&gt;注册&lt;/button&gt;</code></pre></div>`,
      options: ['2 次', '1 次', '0 次', '不确定，取决于浏览器'],
      answer: 0,
      explain:
        'setSubmitting(true) 写在 await 之后。两次点击都发生在检查返回之前，那时 submitting 还是 false，按钮也还没禁用。两次调用都通过了判断，各自等检查返回后调用 register。修法：在第一行用 ref 标记“正在提交”，并在 await 之前就设置。',
    },
  ],
  plays: {
    '每输入一个字，谁在重新渲染？': {
      note: '受控表单的 state 在 ControlledForm 里。它每次重新渲染，6 个 Field 都跟着渲染，包括你没碰过的“备注”。非受控表单不保存 state，打字时没有任何组件重新渲染，提交时用 FormData 一次读出所有值。<br>6 个字段感觉不到差别。60 个字段、每次渲染都跑一遍校验时，打字就会明显卡顿。',
      predict: {
        q: '在左边受控表单的“姓名”里输入 abc 三个字母。最后一行“备注”会显示渲染几次？',
        options: ['4 次', '1 次', '2 次', '3 次'],
        answer: 0,
        explain:
          '第一次渲染算 1 次。每输入一个字母，ControlledForm 的 state 变化，它和所有子组件都重新渲染，所以是 1 + 3 = 4 次。“备注”的 props 没变，但父组件重新渲染时，子组件默认也重新渲染。右边的非受控表单一直是 1 次。',
      },
      pkey: 'form-architecture|每输入一个字，谁在重新渲染？',
    },
    '迷你 schema': {
      note: '每个方法都返回一个<b>新的</b> schema。所以 short 和 long 互不影响：short 只要求 2 个字，返回 null（通过）。如果 min 用 <code>checks.push</code> 修改原数组再返回自己，base、short、long 就成了同一个对象，short 也会要求 6 个字。真正的 Zod 也是不可变的。',
    },
    用户名检查的竞态: {
      note: '“anna”的请求在第 400ms 先回来，显示“可用”。200ms 后，“ann”的请求才回来，又把结果改成“已被占用”。输入框里是 anna，界面却说已被占用，提交按钮可能因此被禁用。<br>有保护的版本在 name 变化时运行清理函数，把上一次的 ignore 设为 true。旧请求回来时被丢弃。',
      predict: {
        q: '点“模拟快速输入”，等 1 秒。“无保护”一行最后显示什么？',
        options: ['已被占用', '可用', '一直是“检查中…”', '先显示“已被占用”，最后变成“可用”'],
        answer: 0,
        explain:
          '两个请求都发出去了。anna 的请求 300ms 后返回“可用”，ann 的请求 600ms 后才返回“已被占用”，后到的结果覆盖了先到的。界面显示的是 ann 的结果，可输入框里是 anna。',
      },
      pkey: 'form-architecture|用户名检查的竞态',
    },
  },
} satisfies Lesson;
