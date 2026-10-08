// 运行时选择（React 18 / 19 按课切换）的浏览器测试：
//   版本隔离（18 的课 → 客户端跳转到 19 的课 → 跳回）、19 下的警告显示、资源被拦截时的失败提示、
//   react-19 一课的示例行为和预测题的答案、练习（参考答案、起始代码、常见错误、不同写法）。
// 用法：node tests/e2e/runtime.mjs      （先 npm run build）
import { launch, openSite, lessonUrl, lessonData, checker } from './_site.mjs';

const { site, close } = await openSite();
const b = await launch();
const { ok, done } = checker();
const L19 = await lessonData('react-19');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function open(ctx, id) {
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.errs = errs;
  await p.goto(lessonUrl(site, id));
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForSelector('.selfx', { timeout: 60000 });
  await p.waitForFunction(() => [...document.querySelectorAll('.pg')].some(x => x._editor), null, { timeout: 60000 });
  return p;
}
// 回答所有预测题（都选第一项），滚动让所有示例运行
async function reveal(p) {
  await p.evaluate(async () => {
    for (const pg of document.querySelectorAll('.pg')) {
      pg.scrollIntoView();
      await new Promise(r => setTimeout(r, 60));
    }
    document.querySelectorAll('.predict .opts .opt:first-child').forEach(x => x.click());
    await new Promise(r => setTimeout(r, 50));
    document.querySelectorAll('.predict .btn.primary').forEach(x => x.click());
    await new Promise(r => setTimeout(r, 300));
  });
}
// 在页面里找到标题包含 title 的实验台，执行 fn(pg)
const inPg = (p, title, fn, arg) =>
  p.evaluate(
    ({ title, fn, arg }) => {
      const pg = [...document.querySelectorAll('.pg')].find(x => x.querySelector('.pg-title').textContent.includes(title));
      if (!pg) return 'NO PG ' + title;
      return new Function('pg', 'arg', 'return (' + fn + ')(pg, arg)')(pg, arg);
    },
    { title, fn: fn.toString(), arg },
  );
// 在第一个普通实验台里运行一段代码，返回控制台文字
async function runCode(p, code, title = '') {
  return inPg(
    p,
    title,
    async (pg, code) => {
      pg._editor.value = code;
      pg._run();
      await new Promise(r => setTimeout(r, 400));
      return { cons: pg.querySelector('.console').innerText, lines: [...pg.querySelectorAll('.console div')].map(d => d.className + '|' + d.textContent) };
    },
    code,
  );
}
const VERSION_CODE = "console.log('V=' + React.version + '/' + ReactDOM.version)";

/* 1. react-19 一课：版本标记、实验台里的 React 是 19 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, 'react-19');
  await reveal(p);
  const tag = await p.evaluate(() => [...document.querySelectorAll('.pg')].map(x => x.querySelector('.pg-rt')?.textContent + '|' + x.dataset.react));
  ok(tag.length >= 9 && tag.every(t => t.startsWith('React 19.3.0|19.3.0')), '19 的课：每个实验台都有 React 19.3.0 的版本标记', tag.join(','));
  const r = await runCode(p, VERSION_CODE, 'Context 直接当 Provider');
  ok(r.cons.includes('V=19.3.0/19.3.0'), '19 的实验台里 React.version 和 ReactDOM.version 都是 19.3.0', r.cons);
  const bad = await p.evaluate(() => [...document.querySelectorAll('.pg .pv-err,.pg .console .err,.pg .console .warn')].map(e => e.textContent.slice(0, 100)));
  ok(bad.length === 0, 'react-19 一课的全部示例运行无错误、无 React 警告', bad.join(' | '));
  ok(p.errs.length === 0, 'react-19 一课没有页面错误', p.errs.join('|'));
  await ctx.close();
}

/* 2. 版本隔离：18 的课 → 客户端跳转 → 19 的课 → 跳回 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, 'state');
  await p.evaluate(() => {
    window.__noReload = 1;
  });
  await reveal(p);
  const v1 = await runCode(p, VERSION_CODE);
  ok(v1.cons.includes('V=18.3.1/18.3.1'), '18 的课：React.version 是 18.3.1', v1.cons);
  const goto = async id => {
    await p.locator(`.rp-doc-layout__sidebar a[href$="lessons/${id}.html"]`).first().click();
    await p.waitForURL(new RegExp(`lessons/${id}`));
    await p.waitForFunction(() => [...document.querySelectorAll('.pg')].some(x => x._editor && x.isConnected), null, { timeout: 60000 });
    await sleep(500);
  };
  await goto('react-19');
  ok(await p.evaluate(() => window.__noReload === 1), '跳转是客户端路由（页面没有刷新）');
  const v2 = await runCode(p, VERSION_CODE, 'Context 直接当 Provider');
  ok(v2.cons.includes('V=19.3.0/19.3.0'), '跳到 19 的课：React.version 是 19.3.0', v2.cons);
  const g = await p.evaluate(() => ({ g: window.React.version, g19: window.__hocReact19.version }));
  ok(g.g === '18.3.1' && g.g19 === '19.3.0', '两个运行时同时存在，全局的 window.React 仍是 18.3.1，没有被 19 覆盖', JSON.stringify(g));
  await goto('state');
  await reveal(p);
  const v3 = await runCode(p, VERSION_CODE);
  ok(v3.cons.includes('V=18.3.1/18.3.1'), '跳回 18 的课：React.version 又是 18.3.1', v3.cons);
  const tags = await p.evaluate(() => [...document.querySelectorAll('.pg-rt')].map(x => x.className + x.textContent));
  ok(tags.length > 0 && tags.every(t => t.includes('r18') && t.includes('18.3.1')), '18 的课的版本标记是 React 18.3.1（淡色）', tags.join(','));
  ok(p.errs.length === 0, '来回跳转没有页面错误', p.errs.join('|'));
  await ctx.close();
}

/* 3. 警告：19 下缺 key、受控输入、渲染期间更新别的组件会显示；学习者自己的 console.error 不是 React 警告；18 不变 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, 'react-19');
  const noKey = await runCode(p, 'function App(){ return <ul>{[1,2].map(n => <li>{n}</li>)}</ul>; }', 'Context 直接当 Provider');
  ok(
    noKey.lines.some(l => l.startsWith('warn|React 警告：列表中的每个元素都需要唯一的 key。')),
    '19 下缺 key 的列表会显示警告',
    noKey.cons,
  );
  const ctrl = await runCode(p, 'function App(){ return <input value="a" />; }', 'Context 直接当 Provider');
  ok(
    ctrl.lines.some(l => l.startsWith('warn|React 警告：输入框有 value 但没有 onChange')),
    '19 下受控输入只有 value 会显示警告',
    ctrl.cons,
  );
  const upd = await runCode(
    p,
    'import { useState } from "react";\nfunction B({s}){ s(1); return null }\nfunction App(){ const [x,setX]=useState(0); return <><B s={setX}/>{x}</> }',
    'Context 直接当 Provider',
  );
  ok(
    upd.lines.some(l => l.startsWith('warn|React 警告：不要在渲染期间更新另一个组件的 state。')),
    '19 下渲染期间更新别的组件会显示警告',
    upd.cons,
  );
  const mine = await runCode(
    p,
    "console.error('Warning: 我自己的消息'); console.warn('自己的 warn'); function App(){ return null }",
    'Context 直接当 Provider',
  );
  ok(
    !mine.cons.includes('React 警告') && mine.lines.some(l => l.startsWith('err|Warning: 我自己的消息')),
    '学习者自己的 console.error（即使以 Warning: 开头）不会被当成 React 警告',
    mine.cons,
  );
  const boom = await runCode(p, "function Boom(){ throw new Error('炸了') }\nfunction App(){ return <Boom /> }", 'Context 直接当 Provider');
  ok(boom.lines.some(l => l.startsWith('err|') && l.includes('炸了')) && !boom.cons.includes('React 警告'), '19 下渲染报错显示为错误，不当成警告', boom.cons);
  await ctx.close();

  const ctx18 = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p18 = await open(ctx18, 'state');
  await reveal(p18);
  const k18 = await runCode(p18, 'function App(){ return <ul>{[1,2].map(n => <li>{n}</li>)}</ul>; }');
  ok(
    k18.lines.some(l => l.startsWith('warn|React 警告：列表中的每个元素都需要唯一的 key。')),
    '18 下缺 key 的警告照旧',
    k18.cons,
  );
  await ctx18.close();
}

/* 4. React 19 资源被拦截：实验台给出加载失败提示，页面其余部分正常；18 的课不受影响 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**/runtime/react-19*.js', r => r.abort());
  const p = await ctx.newPage();
  await p.goto(lessonUrl(site, 'react-19'));
  await p.waitForSelector('.selfx', { timeout: 60000 });
  await p.waitForSelector('.pv-err', { timeout: 30000 });
  const r = await p.evaluate(() => ({
    errs: [...document.querySelectorAll('.pv-err')].map(e => e.textContent),
    prose: document.querySelector('.prose').textContent.length,
    quiz: document.querySelectorAll('.quiz .q').length,
    pg: document.querySelectorAll('.pg').length,
  }));
  ok(
    r.errs.length >= 2 && r.errs.every(e => e.includes('运行环境加载失败，请检查网络后刷新页面')),
    '19 资源被拦截：实验台和练习都显示“运行环境加载失败”',
    r.errs.join('|'),
  );
  ok(r.prose > 1000 && r.quiz === L19.quiz.length && r.pg === 0, '拦截时课文、测验正常显示', JSON.stringify(r));
  await p.locator('.rp-doc-layout__sidebar a[href$="lessons/state.html"]').first().click();
  await p.waitForURL(/lessons\/state/);
  await p.waitForFunction(() => [...document.querySelectorAll('.pg')].some(x => x._editor), null, { timeout: 60000 });
  await reveal(p);
  const v = await runCode(p, VERSION_CODE);
  ok(v.cons.includes('V=18.3.1'), '19 的资源被拦截，不影响 18 的课', v.cons);
  await ctx.close();
}

/* 5. react-19 一课：示例行为，以及预测题的答案是真的 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, 'react-19');
  await reveal(p);
  // useFormStatus：只有子组件里的按钮显示提交中
  const fs = await inPg(p, 'useFormStatus', async pg => {
    pg.querySelector('.preview button').click();
    await new Promise(r => setTimeout(r, 400));
    return [...pg.querySelectorAll('.preview button')].map(x => x.textContent);
  });
  ok(fs[0] === 'A：提交' && fs[1] === 'B：提交中…', '预测题 useFormStatus：只有 B 显示“提交中…”', JSON.stringify(fs));
  // use()：切回已经完成的 Promise 不再显示加载中
  const us = await inPg(p, 'use() 读取', async pg => {
    const wait = async (txt, ms = 3000) => {
      for (let i = 0; i < ms / 50; i++) {
        if (pg.querySelector('.preview').innerText.includes(txt)) return true;
        await new Promise(r => setTimeout(r, 50));
      }
      return false;
    };
    const btn = t => [...pg.querySelectorAll('.preview button')].find(x => x.textContent === t);
    const first = await wait('用户：Alice');
    btn('看 Bob').click();
    const loading = await wait('加载中');
    const bob = await wait('用户：Bob');
    btn('看 Alice').click();
    await new Promise(r => setTimeout(r, 100));
    const txt = pg.querySelector('.preview').innerText;
    return { first, loading, bob, txt };
  });
  ok(
    us.first && us.loading && us.bob && us.txt.includes('用户：Alice') && !us.txt.includes('加载中'),
    '预测题 use()：切回已完成的 Promise 不显示“加载中…”',
    JSON.stringify(us),
  );
  // Activity：条件渲染丢 state，Activity 保留
  const act = await inPg(p, 'Activity', async pg => {
    const tab = t => [...pg.querySelectorAll('.preview button')].find(x => x.textContent === t);
    const type = (ph, v) => {
      const i = pg.querySelector(`.preview input[placeholder="${ph}"]`);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, v);
      i.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const sl = () => new Promise(r => setTimeout(r, 100));
    type('A 的输入框', '甲');
    await sl();
    tab('标签 B').click();
    await sl();
    type('B 的输入框', '乙');
    await sl();
    tab('标签 A').click();
    await sl();
    tab('标签 B').click();
    await sl();
    const a = pg.querySelector('.preview input[placeholder="A 的输入框"]');
    const bb = pg.querySelector('.preview input[placeholder="B 的输入框"]');
    return { a: a ? a.value : null, b: bb ? bb.value : null, cons: pg.querySelector('.console').innerText };
  });
  ok(
    act.b === '乙' && (act.a === '' || act.a === null) && act.cons.includes('B 的 effect 被清理'),
    '预测题 Activity：A 丢失，B 保留，隐藏时 effect 被清理',
    JSON.stringify(act),
  );
  // useOptimistic：失败时先 43 再回到 42；成功时 43 保持
  const op = await inPg(p, 'useOptimistic', async pg => {
    const h = () => pg.querySelector('.preview h2').textContent;
    const btn = t => [...pg.querySelectorAll('.preview button')].find(x => x.textContent.includes(t));
    btn('会失败').click();
    await new Promise(r => setTimeout(r, 300));
    const mid = h();
    await new Promise(r => setTimeout(r, 1300));
    const end = h();
    const msg = pg.querySelector('.preview p').textContent;
    btn('会成功').click();
    await new Promise(r => setTimeout(r, 300));
    const mid2 = h();
    await new Promise(r => setTimeout(r, 1500));
    return { mid, end, mid2, end2: h(), msg };
  });
  ok(
    op.mid.includes('43') && op.end.includes('42') && op.mid2.includes('43') && op.end2.includes('43') && op.msg.includes('点赞失败'),
    '预测题 useOptimistic：失败 43→42，成功 43 保持',
    JSON.stringify(op),
  );
  // useActionState + form action
  const ua = await inPg(p, 'useActionState', async pg => {
    const inp = pg.querySelector('.preview input');
    const setv = v => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inp, v);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setv('abc');
    pg.querySelector('.preview button').click();
    await new Promise(r => setTimeout(r, 1100));
    const e1 = pg.querySelector('.preview p')?.textContent;
    const v1 = inp.value;
    setv('a@b.com');
    pg.querySelector('.preview button').click();
    await new Promise(r => setTimeout(r, 100));
    const pend = pg.querySelector('.preview button').textContent;
    await new Promise(r => setTimeout(r, 1000));
    return { e1, v1, pend, ok: pg.querySelector('.preview').textContent.includes('订阅成功') };
  });
  ok(
    ua.e1 === '邮箱格式不对' && ua.pend === '提交中…' && ua.ok && ua.v1 === '',
    'useActionState + form action：报错、提交中、成功都正常，Action 结束后输入框被重置',
    JSON.stringify(ua),
  );
  // ref、useEffectEvent
  const rf = await inPg(p, 'ref 作为普通 prop', async pg => {
    const btn = t => [...pg.querySelectorAll('.preview button')].find(x => x.textContent === t);
    btn('聚焦输入框').click();
    const focused = document.activeElement === pg.querySelector('.preview input');
    btn('卸载方框').click();
    await new Promise(r => setTimeout(r, 100));
    return { focused, cons: pg.querySelector('.console').innerText };
  });
  ok(
    rf.focused && rf.cons.includes('挂上 <div>') && rf.cons.includes('清理函数运行了'),
    'ref 作为 prop 能聚焦；ref 回调的清理函数在卸载时运行',
    JSON.stringify(rf),
  );
  const ee = await inPg(p, 'useEffectEvent', async pg => {
    const btn = t => [...pg.querySelectorAll('.preview button')].find(x => x.textContent === t);
    await new Promise(r => setTimeout(r, 800));
    btn('换主题').click();
    await new Promise(r => setTimeout(r, 100));
    btn('换房间').click();
    await new Promise(r => setTimeout(r, 900));
    return pg.querySelector('.console').innerText;
  });
  ok(ee.includes('已连接到 travel，当前主题：dark') && (ee.match(/连接到 /g) || []).length >= 2, 'useEffectEvent：换主题不重连，连接完成时读到最新主题', ee);
  const ctxp = await inPg(p, 'Context 直接', async pg => {
    [...pg.querySelectorAll('.preview button')][0].click();
    await new Promise(r => setTimeout(r, 100));
    return pg.querySelector('.preview p').textContent;
  });
  ok(ctxp.includes('dark'), 'Context 直接当 Provider：切换主题后值更新', ctxp);
  const vt = await inPg(p, 'ViewTransition', async pg => {
    const btn = pg.querySelector('.preview button');
    btn.click();
    await new Promise(r => setTimeout(r, 800));
    const shown = pg.querySelector('.preview p') !== null;
    btn.click();
    await new Promise(r => setTimeout(r, 800));
    return { shown, hidden: pg.querySelector('.preview p') === null, cons: pg.querySelector('.console').innerText };
  });
  ok(vt.shown && vt.hidden && !vt.cons.includes('警告'), 'ViewTransition：展开、收起正常，没有警告', JSON.stringify(vt));
  await ctx.close();
}

/* 6. react-19 的练习：参考答案通过；起始代码被拒；常见错误被拒；不同写法通过 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, 'react-19');
  const check = code =>
    p.evaluate(async code => {
      const btn = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '✓ 检查答案');
      let pg = btn;
      while (pg && !pg._editor) pg = pg.parentElement;
      pg._editor.value = code;
      await new Promise(r => setTimeout(r, 300));
      btn.click();
      for (let i = 0; i < 100 && btn.disabled; i++) await new Promise(r => setTimeout(r, 100));
      await new Promise(r => setTimeout(r, 200));
      return pg.querySelector('.result').innerText;
    }, code);
  const sol = L19.exercise.solution;
  const swap = (a, b2) => {
    if (!sol.includes(a)) throw new Error('测试用的替换片段不在参考答案里：' + a);
    return sol.replace(a, b2);
  };
  const pass = r => r.includes('通过') && !r.startsWith('✗');
  const r0 = await check(L19.exercise.starter);
  ok(r0.startsWith('✗'), '练习：起始代码被拒', r0.slice(0, 120));
  const r1 = await check(sol);
  ok(pass(r1), '练习：参考答案通过', r1.slice(0, 160));
  const r2 = await check(swap('async function subscribeAction(prevState, formData) {', 'async function subscribeAction(formData, prevState) {'));
  ok(r2.startsWith('✗'), '练习：参数顺序写反被拒', r2.slice(0, 160));
  const r3 = await check(
    swap('const tries = prevState.tries + 1;', 'prevState.tries += 1;\n  const tries = prevState.tries;').replace(
      /return \{ ok: true, tries \};/,
      'return prevState;',
    ),
  );
  ok(r3.startsWith('✗'), '练习：直接修改并返回 prevState 被拒', r3.slice(0, 160));
  const r4 = await check(
    swap(
      'const [state, formAction, isPending] = useActionState(subscribeAction, { tries: 0 });',
      'const [state, setState] = React.useState({ tries: 0 });\n  const [isPending, setPending] = React.useState(false);\n  const formAction = async fd => { setPending(true); setState(await subscribeAction(state, fd)); setPending(false); };',
    ).replace("import { useActionState } from 'react';", ''),
  );
  ok(r4.startsWith('✗'), '练习：不用 useActionState、自己用 useState 拼被拒', r4.slice(0, 160));
  const alt = swap(
    /async function subscribeAction[\s\S]*?\n}\n/.exec(sol)[0],
    `async function subscribeAction(prev, formData) {
  const { email = '' } = Object.fromEntries(formData);
  const next = { tries: prev.tries + 1 };
  if (!email.trim().includes('@')) return { ...next, error: '邮箱格式不对' };
  if (!(await api.subscribe(email.trim()))) return { ...next, error: '这个邮箱已经订阅过了' };
  return { ...next, ok: true };
}
`,
  );
  const r5 = await check(alt);
  ok(pass(r5), '练习：不同写法（Object.fromEntries + 展开运算符）通过', r5.slice(0, 160));
  await ctx.close();
}

await b.close();
close();
process.exit(done() ? 1 : 0);
