import type { Lesson } from '../types.ts';
import { prepare, compile } from '../engine/exec.ts';
// 非正文数据。课文在 docs/lessons/lists-keys.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'lists-keys',
  stage: 0,
  title: '列表渲染与 key',
  mins: 21,
  summary: '用 map 渲染列表，理解 key 为什么重要。',
  goals: [
    '能用 map 把数组渲染成元素列表，并先用 filter 筛选',
    '能为列表选择合适的 key，并说出不用 index 或随机数的理由',
    '能找出 key 写错位置的 bug：key 要写在 map 直接返回的元素上',
    '能用改变 key 的方法重置一个组件的 state',
  ],
  keyPoints: [
    '用 <code>.map()</code> 把每项数据变成一个元素。先用 <code>.filter()</code>，可以只留下一部分。',
    'key 是列表项的身份。列表变化时，React 用它把新旧元素（连同它们的 state）对上号。',
    'key 用数据自带的稳定 id。用 index，插入或重排后 state 会错位；用随机数，每次渲染都会重建。',
    'key 要写在 map 直接返回的那个元素上。它不会作为 prop 传进组件。',
    '改变一个组件的 key，React 会卸载它、再新建一个，state 被重置。',
  ],
  quiz: [
    {
      q: 'key 的主要作用是？',
      options: [
        '列表变化时，让 React 把新旧两次渲染里的每一项对上号',
        '让子组件能通过 props.key 读到自己的 id',
        '让 React 跳过没有变化的列表项，不再调用它们的组件函数',
        '给列表项加一个 HTML id 属性，方便查找',
      ],
      answer: 0,
      explain:
        'key 是列表项的身份标识，React 用它匹配新旧元素和它们的 state。最迷惑的是第二项：key 不会作为 prop 传给组件，子组件需要 id 时要另外传。第三项是 memo 的作用，不是 key 的。',
    },
    {
      q: '一个可以拖动排序的列表，下列哪个最适合作为 key？',
      options: ['Math.random()', '数组下标 index', '数据自带的唯一 id', 'item.name（名字可能重复）'],
      answer: 2,
      explain:
        '稳定且唯一的 id 最好。最容易误选的是 index：排序后同一个下标对应的是另一项数据，state 会错位。随机数每次渲染都变，组件会反复重建。名字可能重复，key 就不唯一。',
    },
    {
      q: '<code>&lt;Profile key={userId} /&gt;</code>。userId 从 1 变成 2 时，Profile 会怎样？',
      options: [
        '用新的 props 重新渲染，state 保留',
        '旧的被卸载，再新建一个，state 回到初始值',
        'React 报错：key 不能改变',
        '什么都不发生：key 只在列表里起作用',
      ],
      answer: 1,
      explain:
        'key 变了，React 认为这是另一个组件，于是卸载旧的、挂载新的。最迷惑的是第一项：没有 key、或 key 不变时，同位置同类型的组件才会保留 state。key 在列表外也起作用。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>用 <code>filter</code> 选出 <code>done</code> 为 false 的事项。</li><li>用 <code>map</code> 把每个事项渲染成一个 <code>&lt;li&gt;</code>，内容为 <code>title</code>。</li><li>用 <code>id</code> 作为 key。</li><li>把这些 <code>&lt;li&gt;</code> 放进 <code>&lt;ul&gt;</code>。</li></ol>',
    starter: `function App() {
  const todos = [
    { id: 1, title: '学习 JSX', done: true },
    { id: 2, title: '学习 State', done: false },
    { id: 3, title: '学习列表', done: false },
    { id: 4, title: '喝水', done: true },
  ];
  return <ul>{/* 在这里渲染 */}</ul>;
}`,
    solution: `function App() {
  const todos = [
    { id: 1, title: '学习 JSX', done: true },
    { id: 2, title: '学习 State', done: false },
    { id: 3, title: '学习列表', done: false },
    { id: 4, title: '喝水', done: true },
  ];
  return (
    <ul>
      {todos.filter(t => !t.done).map(t => (
        <li key={t.id}>{t.title}</li>
      ))}
    </ul>
  );
}`,
    hint: '分两步想：哪个数组方法能“留下”一部分元素？哪个能把每一项“变成”一个 &lt;li&gt;？key 用哪个字段最稳定？',
    faded: `function App() {
  const todos = [
    { id: 1, title: '学习 JSX', done: true },
    { id: 2, title: '学习 State', done: false },
    { id: 3, title: '学习列表', done: false },
    { id: 4, title: '喝水', done: true },
  ];
  return (
    <ul>
      {todos
        .filter(/* ✏️ 只留下 done 为 false 的事项 */)
        .map(t => (
          /* ✏️ 一个 li：内容是 title，key 用最稳定的那个字段 */
        ))}
    </ul>
  );
}`,
    test: async t => {
      // 用 t.React / t.ReactDOM，不读全局的 React / ReactDOM（实验台没有这两个全局）
      const { React, ReactDOM } = t;
      const lis = t.qa('li');
      const li = lis.map(x => x.textContent.trim());
      t.assert(li.length === 2, `应渲染 2 个未完成事项，实际 ${li.length} 个。先用 filter 留下 done 为 false 的事项`);
      t.assert(li.includes('学习 State') && li.includes('学习列表'), `渲染的事项不对：${li.join('、')}。应只显示“学习 State”和“学习列表”`);
      // 读 React 记录的 key（依赖 React 19.3.x 的 DOM 节点上的 __reactFiber$ 键，经 t.internals.fiberOf 读；
      // fiber 的 tag 5 = 原生元素，key / sibling / child / return 是 fiber 的通用字段）。读不到时退回源码里有没有写 key 的粗查。
      // 从 <li> 往上找，直到某一层也包含了别的列表项：
      // 这之前最高的那一层，就是 map 为这一项返回的元素（<li>、组件、<Fragment> 或 <>）
      const fiberOf = node => t.internals.fiberOf(node);
      const hosts = f => {
        const out = [];
        const walk = c => {
          for (; c; c = c.sibling) {
            if (c.tag === 5) out.push(c.stateNode);
            walk(c.child);
          }
        };
        if (f.tag === 5) out.push(f.stateNode);
        walk(f.child);
        return out;
      };
      const keyInfo = node => {
        const path = [];
        for (let f = fiberOf(node); f; f = f.return) {
          if (f.stateNode && f.stateNode.tagName === 'UL') break;
          if (path.length && hosts(f).some(h => h !== node && lis.includes(h))) break;
          path.push(f);
        }
        const top = path[path.length - 1];
        return { top: top ? top.key : null, inner: path.slice(0, -1).some(f => f.key != null) };
      };
      const ids = { '学习 State': '2', 学习列表: '3' };
      const seen = [];
      const structural = lis.every(x => !!fiberOf(x));
      if (!structural) t.assert(/\bkey=\{/.test(t.source), 'map 返回的元素没有 key。请用每项的 id 作为 key，例如 key={t.id}');
      (structural ? lis : []).forEach(x => {
        const { top, inner } = keyInfo(x);
        const title = x.textContent.trim();
        t.assert(
          top != null || !inner,
          'key 写在了里层元素上。key 要写在 map 直接返回的那个元素上。用 <></> 包住 <li> 时，<></> 不能写 key，请改成 <Fragment key={t.id}>，或直接返回 <li key={t.id}>',
        );
        t.assert(top != null, 'map 返回的元素没有 key。请用每项的 id 作为 key，例如 key={t.id}');
        const hasId = new RegExp('(^|\\D)' + ids[title] + '(\\D|$)').test(top);
        if (!hasId || top === title) {
          const byIndex = /key=\{\s*(i|idx|index)\s*\}/.test(t.source) || /^\d+$/.test(top);
          t.assert(
            false,
            byIndex && top !== ids[title]
              ? `“${title}”的 key 是 ${top}，看起来是数组下标。列表插入、删除或重排时，下标会对应到别的数据，state 会错位。请用每项自带的 id：key={t.id}`
              : `“${title}”的 key 是“${top}”，里面没有它的 id（${ids[title]}）。${top === title ? '标题可能重复，也可能被修改。' : ''}key 要能区分每一项，而且一直不变。请用 key={t.id}`,
          );
        }
        t.assert(!seen.includes(top), `两个列表项的 key 都是“${top}”。key 在同一个列表里必须各不相同`);
        seen.push(top);
      });
      // 把“喝水”改成未完成，重新运行一遍代码：列表应该跟着数据变成 3 项
      const changed = t.rawSource.replace(/(title:\s*['"]喝水['"]\s*,\s*done:\s*)true/, '$1false');
      t.assert(changed !== t.rawSource, '请保留起始代码里的 todos 数据（包括“喝水”那一项）。检查程序会改动它，看列表会不会跟着变');
      if (typeof prepare === 'function' && typeof compile === 'function') {
        let App2: any;
        try {
          App2 = compile(['React', 'ReactDOM'], prepare(changed, [], { React, ReactDOM }))(React, ReactDOM).App;
        } catch (e) {}
        if (typeof App2 === 'function') {
          const box = document.createElement('div');
          const root = ReactDOM.createRoot(box);
          try {
            ReactDOM.flushSync(() => root.render(React.createElement(App2)));
            const li2 = [...box.querySelectorAll('li')].map(x => x.textContent.trim());
            t.assert(
              li2.length === 3 && li2.includes('喝水'),
              `把“喝水”改成未完成后，列表应变成 3 项，实际是 ${li2.length} 项（${li2.join('、')}）。列表要从 todos 数据算出来：todos.filter(…).map(…)，不要手写 <li>`,
            );
          } finally {
            root.unmount();
          }
        }
      }
    },
  },
  drills: [
    {
      title: '嵌套列表：两层 map，两层 key',
      task: '<ol class="task-steps"><li>每个分组渲染成一个 <code>&lt;section&gt;</code>，里面有 <code>&lt;h3&gt;</code> 显示组名。</li><li>每组的商品渲染成 <code>&lt;ul&gt;</code> 里的 <code>&lt;li&gt;</code>，内容是商品名。</li><li>给每个 section 和每个 li 写合适的 key。注意：商品的 id 只在组内唯一，“水果”和“蔬菜”里都有 <code>a</code> 和 <code>b</code>。</li></ol>',
      starter: `function App() {
  const groups = [
    { id: 'fruit', name: '水果', items: [{ id: 'a', name: '苹果' }, { id: 'b', name: '香蕉' }] },
    { id: 'veg', name: '蔬菜', items: [{ id: 'a', name: '白菜' }, { id: 'b', name: '土豆' }] },
  ];
  return (
    <div>
      {/* 在这里渲染两层列表 */}
    </div>
  );
}`,
      solution: `function App() {
  const groups = [
    { id: 'fruit', name: '水果', items: [{ id: 'a', name: '苹果' }, { id: 'b', name: '香蕉' }] },
    { id: 'veg', name: '蔬菜', items: [{ id: 'a', name: '白菜' }, { id: 'b', name: '土豆' }] },
  ];
  return (
    <div>
      {groups.map(g => (
        <section key={g.id}>
          <h3>{g.name}</h3>
          <ul>
            {g.items.map(item => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}`,
      hint: '外层 map 为每个分组返回 section，key 用分组的 id。内层 map 为每个商品返回 li，key 用商品自己的 id。key 只要求在<b>同一个数组里</b>各不相同，所以两组里都有 <code>a</code> 不冲突。',
      test: async t => {
        const sections = t.qa('section');
        t.assert(sections.length === 2, `应渲染 2 个 <section>，实际 ${sections.length} 个。每个分组一个 section`);
        const expect = [
          {
            gid: 'fruit',
            name: '水果',
            items: [
              ['a', '苹果'],
              ['b', '香蕉'],
            ],
          },
          {
            gid: 'veg',
            name: '蔬菜',
            items: [
              ['a', '白菜'],
              ['b', '土豆'],
            ],
          },
        ];
        const fiberOf = node => t.internals.fiberOf(node);
        // 从节点的 fiber 往上，找到边界（它的父 DOM 节点）之前最近的 key
        const keyOf = (node, boundary) => {
          for (let f = fiberOf(node); f && f.stateNode !== boundary; f = f.return) if (f.key != null) return String(f.key);
          return null;
        };
        const hasToken = (key, id) => new RegExp('(^|[^a-z0-9])' + id + '([^a-z0-9]|$)', 'i').test(key);
        const canReadKeys = fiberOf(sections[0]) != null;
        sections.forEach((sec, si) => {
          const exp = expect[si];
          const h3 = sec.querySelector('h3');
          t.assert(h3 && h3.textContent.trim() === exp.name, `第 ${si + 1} 个 section 里应有 <h3>${exp.name}</h3>`);
          const ul = sec.querySelector('ul');
          t.assert(ul, `“${exp.name}”这一组里要有一个 <ul>`);
          const lis = Array.from(ul.querySelectorAll(':scope > li')) as any[];
          const texts = lis.map(x => x.textContent.trim());
          t.assert(
            texts.join('、') === exp.items.map(x => x[1]).join('、'),
            `“${exp.name}”应列出：${exp.items.map(x => x[1]).join('、')}，实际是：${texts.join('、') || '（空）'}`,
          );
          if (!canReadKeys) return;
          const seen = [];
          lis.forEach((li, i) => {
            const [id, title] = exp.items[i];
            const k = keyOf(li, ul);
            t.assert(k != null, `“${title}”没有 key。key 要写在内层 map 直接返回的元素上，用商品自己的 id`);
            t.assert(k !== String(i), `“${title}”的 key 是 ${k}，看起来是数组下标。插入、删除或重排时，下标会对应到别的数据。请用商品自带的 id`);
            t.assert(hasToken(k, id), `“${title}”的 key 是“${k}”，里面没有它的 id（${id}）。key 要能区分每一项，而且一直不变`);
            t.assert(!seen.includes(k), `“${exp.name}”里有两个列表项的 key 都是“${k}”。同一个数组里的 key 必须各不相同`);
            seen.push(k);
          });
        });
        if (canReadKeys) {
          const gkeys = sections.map((sec, si) => {
            const k = keyOf(sec, sec.parentElement);
            t.assert(k != null, `“${expect[si].name}”这一组没有 key。外层 map 返回的元素也要有 key，用分组的 id`);
            t.assert(k !== String(si), `“${expect[si].name}”这一组的 key 是 ${k}，看起来是数组下标。请用分组自带的 id`);
            t.assert(hasToken(k, expect[si].gid), `“${expect[si].name}”这一组的 key 是“${k}”，里面没有它的 id（${expect[si].gid}）`);
            return k;
          });
          t.assert(gkeys[0] !== gkeys[1], '两个分组的 key 相同。同一个数组里的 key 必须各不相同');
        } else {
          t.assert(/key=/.test(t.source), '没有找到 key。外层和内层的 map 返回的元素都要写 key');
        }
      },
    },
    {
      title: '下标当 key：删除后输入框串位',
      task: '<ol class="task-steps"><li>每一行有一个备注输入框（不受 state 控制，用户直接在里面打字）。</li><li>现在先在每行备注里写点字，再点“苹果”那一行的 <b>删除</b>：“香蕉”那一行会带着苹果的备注。找出原因，让备注一直留在原来的那一行。</li><li>点 <b>在顶部添加</b> 加一行新品后，原有各行的备注也要留在原处。</li></ol>',
      starter: `import { useState } from 'react';

let nextId = 4;

function App() {
  const [rows, setRows] = useState([
    { id: 1, name: '苹果' },
    { id: 2, name: '香蕉' },
    { id: 3, name: '橙子' },
  ]);

  function addTop() {
    setRows([{ id: nextId, name: '新品' + nextId }, ...rows]);
    nextId += 1;
  }

  function remove(id) {
    setRows(rows.filter(r => r.id !== id));
  }

  return (
    <div>
      <button onClick={addTop}>在顶部添加</button>
      <ul>
        {rows.map((r, i) => (
          <li key={i}>
            <span>{r.name}</span>
            <input placeholder="备注" />
            <button onClick={() => remove(r.id)}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
      solution: `import { useState } from 'react';

let nextId = 4;

function App() {
  const [rows, setRows] = useState([
    { id: 1, name: '苹果' },
    { id: 2, name: '香蕉' },
    { id: 3, name: '橙子' },
  ]);

  function addTop() {
    setRows([{ id: nextId, name: '新品' + nextId }, ...rows]);
    nextId += 1;
  }

  function remove(id) {
    setRows(rows.filter(r => r.id !== id));
  }

  return (
    <div>
      <button onClick={addTop}>在顶部添加</button>
      <ul>
        {rows.map(r => (
          <li key={r.id}>
            <span>{r.name}</span>
            <input placeholder="备注" />
            <button onClick={() => remove(r.id)}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
      hint: '输入框里的字存在 DOM 节点里。React 靠 key 判断“这个节点属于哪条数据”。用下标当 key 时，删掉第一行后，原来的第二行变成了下标 0，React 就把第一个节点（连同里面的字）给了它。key 要跟着数据走，而不是跟着位置走。',
      test: async t => {
        const row = name => t.qa('li').find(li => li.querySelector('span') && li.querySelector('span').textContent.trim() === name);
        const note = name => {
          const r = row(name);
          return r ? r.querySelector('input').value : null;
        };
        t.assert(
          ['苹果', '香蕉', '橙子'].every(n => row(n)),
          '初始应有“苹果”“香蕉”“橙子”三行，每行有一个 <span> 显示名字',
        );
        await t.type(row('苹果').querySelector('input'), 'A');
        await t.type(row('香蕉').querySelector('input'), 'B');
        await t.type(row('橙子').querySelector('input'), 'C');
        const mismatch = (what, name, want) => {
          const got = note(name);
          if (got === want) return;
          t.assert(
            false,
            got === ''
              ? `${what}，“${name}”那一行的备注没了，应该还是“${want}”。key 每次渲染都变时，React 认为是全新的元素，会卸载旧的再建新的`
              : `${what}，“${name}”那一行的备注是“${got}”，应该还是“${want}”。React 靠 key 判断哪个 DOM 节点属于哪条数据，想想现在的 key 能不能认出“同一条数据”`,
          );
        };
        await t.click(row('苹果').querySelector('button'));
        t.assert(!row('苹果'), '点“苹果”那一行的删除后，这一行应消失');
        mismatch('删除“苹果”后', '香蕉', 'B');
        mismatch('删除“苹果”后', '橙子', 'C');
        const add = t.byText('button', '在顶部添加');
        t.assert(add, '找不到“在顶部添加”按钮');
        await t.click(add);
        const first = t.qa('li')[0];
        t.assert(first && first.querySelector('span').textContent.trim() === '新品4', '点“在顶部添加”后，第一行应是“新品4”');
        t.assert(first.querySelector('input').value === '', '新加的“新品4”备注应是空的，实际是“' + first.querySelector('input').value + '”');
        mismatch('顶部添加一行后', '香蕉', 'B');
        mismatch('顶部添加一行后', '橙子', 'C');
      },
    },
  ],
  checkOnly: [
    {
      q: `每条待办要渲染两个 <code>&lt;li&gt;</code>。key 应该写在哪里？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">{todos.map(t =&gt; (
  &lt;&gt;
    &lt;li&gt;{t.title}&lt;/li&gt;
    &lt;li&gt;{t.due}&lt;/li&gt;
  &lt;/&gt;
))}</code></pre></div>`,
      options: ['写在第一个 <li> 上：<li key={t.id}>', '两个 <li> 都写 key={t.id}', '改用 <Fragment key={t.id}> 包住两个 <li>', '不需要：片段会自动生成 key'],
      answer: 2,
      explain:
        'key 必须写在 map 直接返回的那个元素上。这里返回的是片段。简写 <code>&lt;&gt;&lt;/&gt;</code> 不能写属性，所以要改成 <code>&lt;Fragment key={t.id}&gt;</code>。两个 li 都写同一个 key 也不对：它们在同一个片段里，不是 map 的直接返回值。',
    },
    {
      q: `在第一项的备注框里输入“急”，然后删除第一项。“急”会出现在哪里？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">{todos.map((t, i) =&gt; (
  &lt;li key={i}&gt;
    {t.title} &lt;input placeholder="备注" /&gt;
  &lt;/li&gt;
))}</code></pre></div>`,
      options: ['随第一项一起消失', '在原第二项的备注框里', '所有备注框都被清空', '出现在最后一项的备注框里'],
      answer: 1,
      explain:
        'key 是下标。删除后，原来的第二项下标变成 0，React 认为“key 为 0 的那一项还在”，只更新了它的文字。输入框是同一个 DOM 节点，里面的“急”留了下来。结果备注挂到了错的待办上。改成 <code>key={t.id}</code> 即可。“随第一项消失”是用 id 做 key 时的行为；用下标时，React 删掉的是 key 最大的最后一项。',
    },
  ],
  plays: {
    'map + filter': {},
    切换用户时的备注框: {
      note: '左边的备注还在，右边被清空了。key 变了，React 就认为右边是另一个组件：旧的被卸载，新的从初始 state 开始。左边没有 key，位置和类型没变，React 复用了原来的组件，state 保留。这个机制和列表里用 key 对上号是同一个。',
      predict: {
        q: '点“切换用户”后，左右两个备注框里原来的文字会怎样？',
        options: ['左边还在，右边被清空', '两个都还在', '两个都被清空', '左边被清空，右边还在'],
        answer: 0,
        explain: '右边的 key 从 1 变成 2，React 卸载旧的 Profile、新建一个，state 回到初始值。左边没有 key，同一位置的同类型组件被复用，state 保留。',
      },
      pkey: 'lists-keys|切换用户时的备注框',
    },
    '两列只差 key': {
      note: '左边的输入内容会“错位”到别的字母后面，右边则跟着字母走。',
      predict: {
        q: '在两列的每个输入框里都输入内容，再点“在顶部插入”。左列（key=index）的输入内容会怎样？',
        options: ['跟着原来的字母一起往下移', '留在原来的位置，和字母错开', '全部被清空', '和右列表现一样'],
        answer: 1,
        explain: '用 index 当 key 时，第 0 个位置的 key 始终是 0。React 认为“key=0 的那项还在”，就复用了原来的 DOM（包括输入内容），只改了字母文字，于是错位。',
      },
      pkey: 'lists-keys|两列只差 key',
    },
  },
} satisfies Lesson;
