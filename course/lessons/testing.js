// 由 scripts/convert.mjs 从旧版 src/*.js 生成。
import { stripComments } from '../engine/exec.js';

// 检查程序自己的三个版本：和起始代码里的写法一样，但不依赖学习者的代码
function makeList(bug) {
  const h = React.createElement;
  return function ShoppingList() {
    const [items, setItems] = React.useState([]);
    const [text, setText] = React.useState('');
    function add() {
      const v = text.trim();
      if (!v) return;
      setItems(bug === 'double' ? [...items, v, v] : [...items, v]);
      setText('');
    }
    return h('div', null,
      h('input', { 'aria-label': '新物品', value: text, onChange: e => setText(e.target.value) }),
      h('button', { onClick: add }, '添加'),
      h('button', { onClick: () => (bug === 'clear' ? setText('') : setItems([])) }, '清空'),
      h('p', null, '共 ' + items.length + ' 件'),
      h('ul', null, items.map((name, i) => h('li', { key: i }, name))));
  };
}
// 非正文数据。课文在 docs/lessons/testing.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'testing',
  stage: 4,
  title: '测试：Vitest + Testing Library',
  mins: 25,
  summary: '像用户一样测试组件：按文字和角色找元素，模拟交互，断言结果。',
  goals: [
    '能判断一条断言测的是“用户看到的行为”还是“实现细节”',
    '能用 render、getByRole、userEvent 写出一个组件测试',
    '能写出能抓住 bug 的断言：断言确切结果，而不只是“出现了”',
    '能选择 getBy、queryBy、findBy：一定存在、断言不存在、等待异步内容',
  ],
  keyPoints: [
    '目的：让你敢重构。改完代码跑一遍测试，绿了就放心上线。',
    '像用户一样找元素：优先 <code>getByRole(\'button\', { name: \'提交\' })</code>，最后才用 test id。',
    '<code>getBy</code> 找不到就报错；<code>queryBy</code> 返回 null，用来断言不存在；<code>findBy</code> 返回 Promise，用来等异步内容。',
    '好的断言写确切的结果，例如“共 1 件”。只断言“牛奶出现了”，加了两件也照样通过。',
    '最常见的坑：测试内部 state 或函数调用次数。重构时大面积变红，功能却没坏。',
  ],
  quiz: [
    {
      q: '测试写了 <code>expect(screen.getByText(\'出错了\')).toBeNull()</code>，想断言“错误提示没有显示”。运行结果是？',
      options: [
        '通过：getByText 找不到元素时返回 null，expect 断言成立',
        '失败：getByText 找不到就抛错，应改用 queryByText',
        '通过，但要先 await',
        '失败：应改用 findByText',
      ],
      answer: 1,
      explain: 'getBy 系列找不到就抛错，测试在 expect 之前就失败了。queryBy 找不到时返回 null，专门用来断言“不存在”。findBy 用来等待异步出现的元素，找不到会在超时后报错，同样不适合断言不存在。',
    },
    {
      q: '页面上有一个只有图标的按钮：<code>&lt;div className="icon-btn" onClick={save}&gt;💾&lt;/div&gt;</code>。测试里 <code>getByRole(\'button\', { name: \'保存\' })</code> 找不到它。最好的做法是？',
      options: [
        '改用 container.querySelector(\'.icon-btn\')',
        '改成 &lt;button aria-label="保存"&gt;💾&lt;/button&gt;，测试保持不变',
        '给 div 加 data-testid="save"，测试改用 getByTestId 找到它',
        '改用 getByText(\'💾\')',
      ],
      answer: 1,
      explain: 'getByRole 找不到，说明读屏软件也认不出它：div 没有按钮角色，图标也没有名字。改成带 aria-label 的 button，测试和无障碍问题一起解决。另外三个选项都让测试“绕过”了问题：测试通过了，键盘和读屏用户仍然用不了。',
    },
    {
      q: '下面哪个属于“测试实现细节”（应避免的写法）？',
      options: [
        '点击“+1”按钮后，断言页面上显示了“计数：1”',
        '用 spy 断言 setCount 被调用了 1 次',
        '断言提交表单后，页面上出现了“保存成功”提示',
        '断言禁用状态的按钮不可点击',
      ],
      answer: 1,
      explain: 'set 函数调用了几次是实现细节。把 useState 换成 useReducer，功能不变，这个测试却会失败。另外三个都断言用户能看到或能操作的结果。“按钮不可点击”看起来像细节，其实是用户能感知的行为。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>读一读被测组件 <code>ShoppingList</code> 的规格（代码顶部的注释）。不要修改组件和“迷你测试库”。</li><li>在 <code>defineTests(Component)</code> 里写测试。渲染时用参数：<code>render(&lt;Component /&gt;)</code>。不要直接写 <code>ShoppingList</code>。</li><li>写一个 <code>it(…)</code> 测试“添加”。用 <code>user.type</code> 输入，用 <code>user.click</code> 点按钮。想一想：什么断言能发现“一次加了两件”？</li><li>再写一个 <code>it(…)</code> 测试“清空”。想一想：什么断言能发现“清空没有效果”？</li><li>只用 <code>getByRole</code>、<code>getByText</code>、<code>queryByText</code>、<code>queryAllByRole</code> 找元素。不要用 <code>querySelector</code>、class 或 test id。</li><li>点“运行”，看预览：正确版本要全部通过，两个 bug 版本都要被抓住（至少一个测试失败）。</li></ol>',
    starter: `import { useState, useEffect } from 'react';

// ===== 被测组件（不要修改） =====
// 规格：
// 1. 在输入框“新物品”里输入文字，点“添加”：列表多一项，显示“共 N 件”的 N 加 1。
// 2. 点“清空”：列表变空，显示“共 0 件”。
function ShoppingList() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  function add() {
    const v = text.trim();
    if (!v) return;
    setItems([...items, v]);
    setText('');
  }
  return (
    <div>
      <input aria-label="新物品" value={text} onChange={e => setText(e.target.value)} />
      <button onClick={add}>添加</button>
      <button onClick={() => setItems([])}>清空</button>
      <p>{'共 ' + items.length + ' 件'}</p>
      <ul>{items.map((name, i) => <li key={i}>{name}</li>)}</ul>
    </div>
  );
}

// ===== 你的测试 =====
// 检查程序会把三个版本的组件依次传给 Component：
// 一个正确版本，两个有 bug 的版本。
export function defineTests(Component) {
  // 示例测试：它在三个版本上都会通过，所以抓不住任何 bug
  it('初始显示 共 0 件', async () => {
    render(<Component />);
    screen.getByText('共 0 件');
  });

  // TODO 1：测试“添加”。添加一件后，页面应该是什么样？

  // TODO 2：测试“清空”。添加后再清空，页面应该是什么样？
}

// ===== 两个有 bug 的版本（检查程序用的版本和它们一样） =====
// Bug A：点一次“添加”，加了两件
function BugDouble() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  function add() {
    const v = text.trim();
    if (!v) return;
    setItems([...items, v, v]);
    setText('');
  }
  return (
    <div>
      <input aria-label="新物品" value={text} onChange={e => setText(e.target.value)} />
      <button onClick={add}>添加</button>
      <button onClick={() => setItems([])}>清空</button>
      <p>{'共 ' + items.length + ' 件'}</p>
      <ul>{items.map((name, i) => <li key={i}>{name}</li>)}</ul>
    </div>
  );
}
// Bug B：“清空”只清了输入框，列表没变
function BugClear() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  function add() {
    const v = text.trim();
    if (!v) return;
    setItems([...items, v]);
    setText('');
  }
  return (
    <div>
      <input aria-label="新物品" value={text} onChange={e => setText(e.target.value)} />
      <button onClick={add}>添加</button>
      <button onClick={() => setText('')}>清空</button>
      <p>{'共 ' + items.length + ' 件'}</p>
      <ul>{items.map((name, i) => <li key={i}>{name}</li>)}</ul>
    </div>
  );
}

// ===== 迷你测试库（不要修改） =====
// 简化版：只认下面几种角色。名称先看 aria-label，再看文字
const ROLES = {
  button: 'button', listitem: 'li', heading: 'h1,h2,h3,h4,h5,h6',
  textbox: 'input:not([type]),input[type=text],textarea', checkbox: 'input[type=checkbox]',
};
let container = null;
function render(ui) {
  container = document.createElement('div');
  ReactDOM.flushSync(() => ReactDOM.createRoot(container).render(ui));
}
const nameOf = e => e.getAttribute('aria-label') ?? e.textContent;
const screen = {
  queryByText(text) {
    return [...container.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent === text) ?? null;
  },
  getByText(text) {
    const el = screen.queryByText(text);
    if (!el) throw new Error('找不到文字：' + text);
    return el;
  },
  queryAllByRole(role) {
    return [...container.querySelectorAll(ROLES[role])];
  },
  getByRole(role, { name } = {}) {
    const el = screen.queryAllByRole(role).find(e => name === undefined || nameOf(e) === name);
    if (!el) throw new Error('找不到 ' + role + (name ? '：' + name : ''));
    return el;
  },
};
const tick = () => new Promise(r => setTimeout(r, 0));
const user = {
  async click(el) { el.click(); await tick(); },
  async type(el, text) {          // 在已有内容后面追加文字，和真实的 userEvent 一样
    const setValue = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
    setValue.call(el, el.value + text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();
  },
};
function expect(v) {
  return { toBe(x) { if (v !== x) throw new Error('期望 ' + x + '，实际 ' + v); } };
}
let collected = null;
function it(name, fn) { collected.push({ name, fn }); }
const test = it;
// 依次运行 defineTests(Component) 里的所有测试，返回每个测试的结果
let queue = Promise.resolve();
export function runTests(Component) {
  const job = queue.then(async () => {
    collected = [];
    defineTests(Component);
    const results = [];
    for (const t of collected) {
      try {
        await Promise.race([t.fn(), new Promise((_, no) => setTimeout(() => no(new Error('超时：2 秒内没有结束')), 2000))]);
        results.push({ name: t.name, ok: true });
      } catch (e) {
        results.push({ name: t.name, ok: false, error: e.message });
      }
    }
    return results;
  });
  queue = job.catch(() => {});
  return job;
}

// ===== 预览（不用改）：用你的测试跑三个版本 =====
const VERSIONS = [['正确版本', ShoppingList, true], ['Bug A：一次加两件', BugDouble, false], ['Bug B：清空无效', BugClear, false]];
function App() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let live = true;
    (async () => {
      const out = [];
      for (const [label, C, good] of VERSIONS) {
        try { out.push({ label, good, results: await runTests(C) }); }
        catch (e) { out.push({ label, good, results: [{ name: '运行出错', ok: false, error: e.message }] }); }
      }
      if (live) setRows(out);
    })();
    return () => { live = false; };
  }, []);
  return (
    <div>
      <ShoppingList />
      <hr />
      {!rows ? <p>测试运行中…</p> : rows.map(r => {
        const fails = r.results.filter(x => !x.ok).length;
        const verdict = r.good
          ? (fails === 0 && r.results.length ? '✅ 全部通过' : '❌ 正确版本不应失败')
          : (fails > 0 ? '✅ bug 被抓住了' : '❌ bug 没被抓住');
        return (
          <div key={r.label} style={{ marginBottom: 8 }}>
            <b>{r.label}：{verdict}</b>
            <ul style={{ margin: '4px 0', fontSize: 13 }}>
              {r.results.map((x, i) => <li key={i}>{x.ok ? '通过' : '失败'}：{x.name}{x.ok ? '' : ' → ' + x.error}</li>)}
            </ul>
          </div>
        );
      })}
    </div>
  );
}`,
    solution: `import { useState, useEffect } from 'react';

// ===== 被测组件（不要修改） =====
// 规格：
// 1. 在输入框“新物品”里输入文字，点“添加”：列表多一项，显示“共 N 件”的 N 加 1。
// 2. 点“清空”：列表变空，显示“共 0 件”。
function ShoppingList() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  function add() {
    const v = text.trim();
    if (!v) return;
    setItems([...items, v]);
    setText('');
  }
  return (
    <div>
      <input aria-label="新物品" value={text} onChange={e => setText(e.target.value)} />
      <button onClick={add}>添加</button>
      <button onClick={() => setItems([])}>清空</button>
      <p>{'共 ' + items.length + ' 件'}</p>
      <ul>{items.map((name, i) => <li key={i}>{name}</li>)}</ul>
    </div>
  );
}

// ===== 你的测试 =====
// 检查程序会把三个版本的组件依次传给 Component：
// 一个正确版本，两个有 bug 的版本。
export function defineTests(Component) {
  it('初始显示 共 0 件', async () => {
    render(<Component />);
    screen.getByText('共 0 件');
  });

  it('添加一件物品后，列表里有它，共 1 件', async () => {
    render(<Component />);
    await user.type(screen.getByRole('textbox', { name: '新物品' }), '牛奶');
    await user.click(screen.getByRole('button', { name: '添加' }));
    screen.getByText('牛奶');
    screen.getByText('共 1 件');     // 精确断言数量：“一次加两件”会在这里失败
  });

  it('清空后物品消失，共 0 件', async () => {
    render(<Component />);
    await user.type(screen.getByRole('textbox', { name: '新物品' }), '牛奶');
    await user.click(screen.getByRole('button', { name: '添加' }));
    await user.click(screen.getByRole('button', { name: '清空' }));
    expect(screen.queryByText('牛奶')).toBe(null);
    screen.getByText('共 0 件');
  });
}

// ===== 两个有 bug 的版本（检查程序用的版本和它们一样） =====
// Bug A：点一次“添加”，加了两件
function BugDouble() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  function add() {
    const v = text.trim();
    if (!v) return;
    setItems([...items, v, v]);
    setText('');
  }
  return (
    <div>
      <input aria-label="新物品" value={text} onChange={e => setText(e.target.value)} />
      <button onClick={add}>添加</button>
      <button onClick={() => setItems([])}>清空</button>
      <p>{'共 ' + items.length + ' 件'}</p>
      <ul>{items.map((name, i) => <li key={i}>{name}</li>)}</ul>
    </div>
  );
}
// Bug B：“清空”只清了输入框，列表没变
function BugClear() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  function add() {
    const v = text.trim();
    if (!v) return;
    setItems([...items, v]);
    setText('');
  }
  return (
    <div>
      <input aria-label="新物品" value={text} onChange={e => setText(e.target.value)} />
      <button onClick={add}>添加</button>
      <button onClick={() => setText('')}>清空</button>
      <p>{'共 ' + items.length + ' 件'}</p>
      <ul>{items.map((name, i) => <li key={i}>{name}</li>)}</ul>
    </div>
  );
}

// ===== 迷你测试库（不要修改） =====
// 简化版：只认下面几种角色。名称先看 aria-label，再看文字
const ROLES = {
  button: 'button', listitem: 'li', heading: 'h1,h2,h3,h4,h5,h6',
  textbox: 'input:not([type]),input[type=text],textarea', checkbox: 'input[type=checkbox]',
};
let container = null;
function render(ui) {
  container = document.createElement('div');
  ReactDOM.flushSync(() => ReactDOM.createRoot(container).render(ui));
}
const nameOf = e => e.getAttribute('aria-label') ?? e.textContent;
const screen = {
  queryByText(text) {
    return [...container.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent === text) ?? null;
  },
  getByText(text) {
    const el = screen.queryByText(text);
    if (!el) throw new Error('找不到文字：' + text);
    return el;
  },
  queryAllByRole(role) {
    return [...container.querySelectorAll(ROLES[role])];
  },
  getByRole(role, { name } = {}) {
    const el = screen.queryAllByRole(role).find(e => name === undefined || nameOf(e) === name);
    if (!el) throw new Error('找不到 ' + role + (name ? '：' + name : ''));
    return el;
  },
};
const tick = () => new Promise(r => setTimeout(r, 0));
const user = {
  async click(el) { el.click(); await tick(); },
  async type(el, text) {          // 在已有内容后面追加文字，和真实的 userEvent 一样
    const setValue = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
    setValue.call(el, el.value + text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();
  },
};
function expect(v) {
  return { toBe(x) { if (v !== x) throw new Error('期望 ' + x + '，实际 ' + v); } };
}
let collected = null;
function it(name, fn) { collected.push({ name, fn }); }
const test = it;
// 依次运行 defineTests(Component) 里的所有测试，返回每个测试的结果
let queue = Promise.resolve();
export function runTests(Component) {
  const job = queue.then(async () => {
    collected = [];
    defineTests(Component);
    const results = [];
    for (const t of collected) {
      try {
        await Promise.race([t.fn(), new Promise((_, no) => setTimeout(() => no(new Error('超时：2 秒内没有结束')), 2000))]);
        results.push({ name: t.name, ok: true });
      } catch (e) {
        results.push({ name: t.name, ok: false, error: e.message });
      }
    }
    return results;
  });
  queue = job.catch(() => {});
  return job;
}

// ===== 预览（不用改）：用你的测试跑三个版本 =====
const VERSIONS = [['正确版本', ShoppingList, true], ['Bug A：一次加两件', BugDouble, false], ['Bug B：清空无效', BugClear, false]];
function App() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let live = true;
    (async () => {
      const out = [];
      for (const [label, C, good] of VERSIONS) {
        try { out.push({ label, good, results: await runTests(C) }); }
        catch (e) { out.push({ label, good, results: [{ name: '运行出错', ok: false, error: e.message }] }); }
      }
      if (live) setRows(out);
    })();
    return () => { live = false; };
  }, []);
  return (
    <div>
      <ShoppingList />
      <hr />
      {!rows ? <p>测试运行中…</p> : rows.map(r => {
        const fails = r.results.filter(x => !x.ok).length;
        const verdict = r.good
          ? (fails === 0 && r.results.length ? '✅ 全部通过' : '❌ 正确版本不应失败')
          : (fails > 0 ? '✅ bug 被抓住了' : '❌ bug 没被抓住');
        return (
          <div key={r.label} style={{ marginBottom: 8 }}>
            <b>{r.label}：{verdict}</b>
            <ul style={{ margin: '4px 0', fontSize: 13 }}>
              {r.results.map((x, i) => <li key={i}>{x.ok ? '通过' : '失败'}：{x.name}{x.ok ? '' : ' → ' + x.error}</li>)}
            </ul>
          </div>
        );
      })}
    </div>
  );
}`,
    exports: ['defineTests', 'runTests'],
    faded: `// （被测组件、bug 版本和迷你测试库与起始代码相同，这里省略）

export function defineTests(Component) {
  it('初始显示 共 0 件', async () => {
    render(<Component />);
    screen.getByText('共 0 件');
  });

  it('添加一件物品后，列表里有它，共 1 件', async () => {
    render(<Component />);
    await user.type(screen.getByRole('textbox', { name: '新物品' }), '牛奶');
    /* ✏️ 用 user.click 点“添加”按钮（按角色和名字找） */
    screen.getByText('牛奶');
    /* ✏️ 断言确切的件数。只确认“牛奶出现了”抓不住“一次加两件” */
  });

  it('清空后物品消失，共 0 件', async () => {
    render(<Component />);
    await user.type(screen.getByRole('textbox', { name: '新物品' }), '牛奶');
    await user.click(screen.getByRole('button', { name: '添加' }));
    /* ✏️ 点“清空”按钮 */
    /* ✏️ 断言“牛奶”不存在：用找不到时返回 null 的那种查询 */
    screen.getByText('共 0 件');
  });
}`,
    hint: '只确认“牛奶出现了”不够：加了两件时，“牛奶”同样能找到。要断言用户能看到的<b>确切结果</b>，例如显示的件数，或者 <code>queryByText</code> 返回 <code>null</code>。',
    test: async (t) => {
      const { defineTests, runTests } = t.exports;
      t.assert(typeof defineTests === 'function', '找不到函数 defineTests。不要改它的名字');
      t.assert(typeof runTests === 'function', '找不到函数 runTests。不要修改迷你测试库');
      const src = stripComments(String(defineTests));
      t.assert(!/querySelector|getElementsBy|getElementById|getByTestId|data-testid|classList|className|\bcontainer\b/.test(src),
        '测试里不要用 querySelector、class、test id 或 container。像用户一样，按角色和文字找元素（步骤 5）');
      t.assert(/screen\s*\.\s*getByRole\s*\(/.test(src), '至少用一次 screen.getByRole 找按钮或输入框（步骤 5）');
      t.assert(/user\s*\.\s*click\s*\(/.test(src) && /user\s*\.\s*type\s*\(/.test(src),
        '用 user.type 输入文字，用 user.click 点按钮，模拟真实的用户操作（步骤 3）');
      t.assert(!/\bShoppingList\b/.test(src), '测试里要渲染参数 Component，不要直接写 ShoppingList。否则换成 bug 版本也测不出来（步骤 2）');

      const run = async (C) => {
        const r = await runTests(C);
        t.assert(Array.isArray(r), 'runTests 没有返回结果数组。不要修改迷你测试库');
        return r;
      };
      const good = await run(makeList(null));
      t.assert(good.length >= 2, '至少要有 2 个 it(…) 测试，现在只有 ' + good.length + ' 个（步骤 3、4）');
      const bad = good.filter(x => !x.ok);
      t.assert(bad.length === 0, '正确的组件也没通过：“' + (bad[0] && bad[0].name) + '” → ' + (bad[0] && bad[0].error) + '。测试写错了，先对照规格检查期望值');
      const a = await run(makeList('double'));
      t.assert(a.some(x => !x.ok), '“一次加两件”的 bug 没被抓住：所有测试都通过了。添加一件后，断言显示的件数（步骤 3）');
      const b = await run(makeList('clear'));
      t.assert(b.some(x => !x.ok), '“清空无效”的 bug 没被抓住：所有测试都通过了。清空后，断言物品消失、件数归零（步骤 4）');
    },
  },
  checkOnly: [
    {
      q: `Search 组件在输入后请求数据，结果稍后才显示。这个测试会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">render(&lt;Search /&gt;);
await user.type(screen.getByRole('textbox'), 'react');
expect(screen.getByText('3 条结果')).toBeInTheDocument();</code></pre></div>`,
      options: [
        '通过',
        '失败：getByText 立刻查找，结果还没显示；应改用 await screen.findByText',
        '失败：getByRole 找不到输入框',
        '通过，但会有警告',
      ],
      answer: 1,
      explain: 'getBy 系列只查一次，找不到就立刻报错。数据是异步返回的，断言时结果还没渲染。findBy 系列会等待并重试，直到元素出现或超时。所以要写 <code>expect(await screen.findByText(\'3 条结果\'))…</code>。',
    },
    {
      q: '页面上有 <code>&lt;button aria-label="关闭"&gt;×&lt;/button&gt;</code>。哪个查询能找到它？',
      options: [
        'screen.getByRole(\'button\', { name: \'关闭\' })',
        'screen.getByText(\'关闭\')',
        'screen.getByRole(\'button\', { name: \'×\' })',
        'screen.getByTitle(\'关闭\')',
      ],
      answer: 0,
      explain: 'aria-label 决定了按钮的可访问名称，它会覆盖按钮里的文字“×”。getByRole 按可访问名称查找，所以用“关闭”能找到。getByText 只看页面上的文字，找不到“关闭”。getByTitle 查找 title 属性，这里没有。',
    },
    {
      q: `Counter 点击后显示“计数：1”。这个测试会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">test('点击加 1', () =&gt; {
  const user = userEvent.setup();
  render(&lt;Counter /&gt;);
  user.click(screen.getByRole('button', { name: '+1' }));
  expect(screen.getByText('计数：1')).toBeInTheDocument();
});</code></pre></div>`,
      options: ['通过', '失败：click 没有 await', '失败：getByRole 不能用 name 查找', '通过，但控制台有警告'],
      answer: 1,
      explain: 'userEvent v14 的所有操作都是异步的。没有 await，点击还没发生，就执行了断言，页面上仍是“计数：0”，测试失败。修复：测试函数写成 <code>async</code>，并写 <code>await user.click(…)</code>。“通过”是 fireEvent 的经验：fireEvent 是同步的，但它不模拟完整的用户操作。',
    },
  ],
  plays: {
    '在浏览器里跑测试': {
      note: '测试结果在下方控制台。',
    },
  },
};
