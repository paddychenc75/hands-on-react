// 实验台运行时（全站只有 React 19.3.0 开发版）的浏览器测试：
//   实验台里的 React 版本、页面全局没有 window.React、客户端跳转前后实验台正常、19 下的警告显示、
//   资源被拦截时的失败提示（以及之后能重试）、react-19 一课的示例行为和预测题的答案、练习（参考答案、起始代码、常见错误、不同写法）。
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
    document.querySelectorAll('details.optional').forEach(d => {
      d.open = true;
    });
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

/* 1. 实验台里的 React 是固定的 19.3.0；页面全局没有 window.React */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, 'state');
  await reveal(p);
  const tag = await p.evaluate(() => [...document.querySelectorAll('.pg')].map(x => x.querySelector('.pg-rt')?.textContent + '|' + x.dataset.react));
  ok(tag.length >= 3 && tag.every(t => t === 'React 19.3.0|19.3.0'), '每个实验台都有 React 19.3.0 的版本标记', tag.join(','));
  const r = await runCode(p, VERSION_CODE);
  ok(r.cons.includes('V=19.3.0/19.3.0'), '实验台里 React.version 和 ReactDOM.version 都是 19.3.0', r.cons);
  const g = await p.evaluate(() => ({ react: typeof window.React, dom: typeof window.ReactDOM, rt: window.__hocReact19?.version }));
  ok(g.react === 'undefined' && g.dom === 'undefined' && g.rt === '19.3.0', '页面全局没有被实验台写入 window.React / window.ReactDOM', JSON.stringify(g));
  const bad = await p.evaluate(() => [...document.querySelectorAll('.pg .pv-err,.pg .console .err,.pg .console .warn')].map(e => e.textContent.slice(0, 100)));
  ok(bad.length === 0, 'state 一课的全部示例运行无错误、无 React 警告', bad.join(' | '));
  ok(p.errs.length === 0, 'state 一课没有页面错误', p.errs.join('|'));
  await ctx.close();
}

/* 2. 客户端跳转：state → closures → react-19 → state，每次实验台都正常 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, 'state');
  await p.evaluate(() => {
    window.__noReload = 1;
  });
  const goto = async id => {
    await p.locator(`.rp-doc-layout__sidebar a[href$="lessons/${id}.html"]`).first().click();
    await p.waitForURL(new RegExp(`lessons/${id}`));
    await p.waitForFunction(() => [...document.querySelectorAll('.pg')].some(x => x._editor && x.isConnected), null, { timeout: 60000 });
    await sleep(500);
    await reveal(p);
  };
  for (const id of ['closures', 'react-19', 'state']) {
    await goto(id);
    const v = await runCode(p, VERSION_CODE);
    ok(v.cons.includes('V=19.3.0/19.3.0'), `跳到 ${id}：实验台正常，React.version 是 19.3.0`, v.cons);
  }
  ok(await p.evaluate(() => window.__noReload === 1), '跳转是客户端路由（页面没有刷新）');
  const tags = await p.evaluate(() => [...document.querySelectorAll('.pg-rt')].map(x => x.textContent));
  ok(tags.length > 0 && tags.every(t => t === 'React 19.3.0'), '来回跳转后的版本标记仍是 React 19.3.0', tags.join(','));
  const g = await p.evaluate(() => typeof window.React);
  ok(g === 'undefined', '来回跳转后页面全局仍没有 window.React', g);
  ok(p.errs.length === 0, '来回跳转没有页面错误', p.errs.join('|'));
  await ctx.close();
}

/* 3. 警告：缺 key、受控输入、渲染期间更新别的组件会显示；学习者自己的 console.error 不是 React 警告；渲染报错显示为错误 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, 'state');
  await reveal(p);
  const noKey = await runCode(p, 'function App(){ return <ul>{[1,2].map(n => <li>{n}</li>)}</ul>; }');
  ok(
    noKey.lines.some(l => l.startsWith('warn|React 警告：列表中的每个元素都需要唯一的 key。')),
    '缺 key 的列表会显示警告',
    noKey.cons,
  );
  const ctrl = await runCode(p, 'function App(){ return <input value="a" />; }');
  ok(
    ctrl.lines.some(l => l.startsWith('warn|React 警告：输入框有 value 但没有 onChange')),
    '受控输入只有 value 会显示警告',
    ctrl.cons,
  );
  const upd = await runCode(
    p,
    'import { useState } from "react";\nfunction B({s}){ s(1); return null }\nfunction App(){ const [x,setX]=useState(0); return <><B s={setX}/>{x}</> }',
  );
  ok(
    upd.lines.some(l => l.startsWith('warn|React 警告：不要在渲染期间更新另一个组件的 state。')),
    '渲染期间更新别的组件会显示警告',
    upd.cons,
  );
  const mine = await runCode(p, "console.error('Warning: 我自己的消息'); console.warn('自己的 warn'); function App(){ return null }");
  ok(
    !mine.cons.includes('React 警告') && mine.lines.some(l => l.startsWith('err|Warning: 我自己的消息')),
    '学习者自己的 console.error（即使以 Warning: 开头）不会被当成 React 警告',
    mine.cons,
  );
  const boom = await runCode(p, "function Boom(){ throw new Error('炸了') }\nfunction App(){ return <Boom /> }");
  ok(boom.lines.some(l => l.startsWith('err|') && l.includes('炸了')) && !boom.cons.includes('React 警告'), '渲染报错显示为错误，不当成警告', boom.cons);
  await runCode(p, "function App(){ return <button onClick={() => { throw new Error('点击炸了') }}>点我</button> }");
  const evt2 = await inPg(p, '', async pg => {
    pg.querySelector('.preview button').click();
    await new Promise(r => setTimeout(r, 300));
    return pg.querySelector('.console').innerText;
  });
  ok(evt2.includes('点击炸了'), '事件处理函数里抛的错误显示在控制台里', evt2);
  await ctx.close();
}

/* 4. 运行时资源被拦截：实验台给出加载失败提示，课文其余部分正常；放开之后跳到别的课可以重试成功 */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const Ls = await lessonData('state');
  const handler = r => r.abort();
  await ctx.route('**/runtime/react-19*.js', handler);
  const p = await ctx.newPage();
  await p.goto(lessonUrl(site, 'state'));
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
    '运行时资源被拦截：实验台和练习都显示“运行环境加载失败”',
    r.errs.join('|'),
  );
  ok(r.prose > 1000 && r.quiz === Ls.quiz.length && r.pg === 0, '拦截时课文、测验正常显示', JSON.stringify(r));
  await ctx.unroute('**/runtime/react-19*.js', handler);
  await p.locator('.rp-doc-layout__sidebar a[href$="lessons/closures.html"]').first().click();
  await p.waitForURL(/lessons\/closures/);
  await p.waitForFunction(() => [...document.querySelectorAll('.pg')].some(x => x._editor), null, { timeout: 60000 });
  await reveal(p);
  const v = await runCode(p, VERSION_CODE);
  ok(v.cons.includes('V=19.3.0'), '放开拦截后跳到别的课，运行时可以重新加载，实验台恢复', v.cons);
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

/* 7. 别的课里 19 的写法：ref 作为 prop 与 ref 回调清理、useEffectEvent、<Context value> */
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await open(ctx, 'use-ref');
  await reveal(p);
  const rf = await inPg(p, 'ref 作为普通 prop', async pg => {
    const btn = t => [...pg.querySelectorAll('.preview button')].find(x => x.textContent === t);
    btn('聚焦').click();
    const focused = document.activeElement === pg.querySelector('.preview input');
    btn('ref.current 是什么？').click();
    await new Promise(r => setTimeout(r, 100));
    return { focused, cons: pg.querySelector('.console').innerText };
  });
  ok(rf.focused && rf.cons.includes('INPUT'), 'use-ref：ref 作为 prop 能聚焦，ref.current 是子组件里的 input', JSON.stringify(rf));
  const rc = await inPg(p, 'ref 回调：挂载与清理', async pg => {
    const first = pg.querySelector('.console').innerText;
    [...pg.querySelectorAll('.preview button')][0].click();
    await new Promise(r => setTimeout(r, 150));
    return { first, cons: pg.querySelector('.console').innerText };
  });
  ok(rc.first.includes('挂载：INPUT') && rc.cons.includes('清理：节点离开页面'), 'use-ref：ref 回调挂载时调用，移除时运行返回的清理函数', JSON.stringify(rc));
  await ctx.close();

  const ctx2 = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p2 = await open(ctx2, 'closures');
  await reveal(p2);
  const ee = await inPg(p2, '聊天室：读到最新主题', async pg => {
    const btn = t => [...pg.querySelectorAll('.preview button')].find(x => x.textContent === t);
    await new Promise(r => setTimeout(r, 1300));
    btn('切换主题').click();
    await new Promise(r => setTimeout(r, 1300));
    const afterTheme = pg.querySelector('.console').innerText;
    btn('切换房间').click();
    await new Promise(r => setTimeout(r, 300));
    return { afterTheme, end: pg.querySelector('.console').innerText };
  });
  ok(
    ee.afterTheme.includes('当前主题：深色') && !ee.afterTheme.includes('断开') && ee.end.includes('断开 综合') && ee.end.includes('连接 旅行'),
    'closures：useEffectEvent 换主题不重连，读到最新主题；换房间才重连',
    JSON.stringify(ee),
  );
  await ctx2.close();

  const ctx3 = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p3 = await open(ctx3, 'context');
  await reveal(p3);
  const cx = await inPg(p3, '主题切换', async pg => {
    const before = pg.querySelector('.preview').innerText;
    [...pg.querySelectorAll('.preview button')].find(x => x.textContent === '切换主题').click();
    await new Promise(r => setTimeout(r, 150));
    return { before, after: pg.querySelector('.preview').innerText };
  });
  ok(cx.before !== cx.after && cx.after.includes('dark'), 'context：<Context value> 直接当 Provider，切换主题后值更新', JSON.stringify(cx));
  await ctx3.close();
}

await b.close();
close();
process.exit(done() ? 1 : 0);
