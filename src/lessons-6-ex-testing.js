/* ========== 后加的练习：测试（学习者写测试，检查程序做变异测试） ========== */
(function () {
  const HEAD = `import { useState, useEffect } from 'react';

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
`;

  const STARTER_TESTS = `
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
`;

  const SOLUTION_TESTS = `
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
`;

  const TAIL = `
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
}`;

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

  LESSONS.find(l => l.id === 'testing').exercise = {
    task: '<ol class="task-steps">'
      + '<li>读一读被测组件 <code>ShoppingList</code> 的规格（代码顶部的注释）。不要修改组件和“迷你测试库”。</li>'
      + '<li>在 <code>defineTests(Component)</code> 里写测试。渲染时用参数：<code>render(&lt;Component /&gt;)</code>。不要直接写 <code>ShoppingList</code>。</li>'
      + '<li>写一个 <code>it(…)</code> 测试“添加”。用 <code>user.type</code> 输入，用 <code>user.click</code> 点按钮。想一想：什么断言能发现“一次加了两件”？</li>'
      + '<li>再写一个 <code>it(…)</code> 测试“清空”。想一想：什么断言能发现“清空没有效果”？</li>'
      + '<li>只用 <code>getByRole</code>、<code>getByText</code>、<code>queryByText</code>、<code>queryAllByRole</code> 找元素。不要用 <code>querySelector</code>、class 或 test id。</li>'
      + '<li>点“运行”，看预览：正确版本要全部通过，两个 bug 版本都要被抓住（至少一个测试失败）。</li>'
      + '</ol>',
    starter: HEAD + STARTER_TESTS + TAIL,
    solution: HEAD + SOLUTION_TESTS + TAIL,
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
  };
})();
