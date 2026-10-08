import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/headless-components.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'headless-components',
  stage: 5,
  runtime: 19,
  title: '组件库 API 设计：Headless 组件',
  mins: 46,
  summary:
    '把状态、键盘和 ARIA 封装进 Hook，把标记和样式交给使用者。学会 useControllableState、prop getters、两种键盘焦点方案，以及怎样改 API 而不伤到使用者。',
  goals: [
    '能写出同时支持受控和非受控的 useControllableState，并解释受控模式下函数式更新为什么不会累加',
    '能设计返回 prop getters 的 headless Hook，让 Hook 和使用者的事件处理函数都能执行',
    '能判断一个组件该用 roving tabindex 还是 aria-activedescendant，并写出对应的键盘处理',
    '能判断一次 API 改动是不是破坏性变更，并给出不破坏旧用法的发布方案',
  ],
  keyPoints: [
    'Headless 组件只提供状态、行为和无障碍属性，不提供标记和样式。使用者决定渲染什么元素、长什么样。',
    'useControllableState 用 <code>value !== undefined</code> 判断受控。受控时只调用 onChange，不改内部 state；<code>null</code> 也是受控的“没有选中”。',
    'prop getter 接收使用者的 props，再合并自己的属性和事件处理函数。使用者在 JSX 里把 onClick 写在展开之后，会覆盖 Hook 的 onClick。',
    'roving tabindex 把真实焦点移到当前项，只有一项的 tabIndex 为 0；aria-activedescendant 让焦点留在容器或输入框上，用 id 指向当前项。需要一边打字一边选择时，用后者。',
    '新增可选 prop、并保持旧行为是安全的；修改默认值、回调参数和删除 prop 都是破坏性变更，要走“新增 → 警告 → 下个大版本删除”。',
  ],
  quiz: [
    {
      q: '你在做一个城市搜索框：用户在输入框里打字，下面的列表跟着过滤，按上下方向键高亮城市，按 Enter 选中。键盘焦点方案应该选哪种？',
      options: [
        'aria-activedescendant：焦点留在输入框，用 id 指向高亮的城市',
        'roving tabindex：方向键把焦点移到高亮的城市上',
        '两种都可以，只是写法不同',
        '不需要方案：给每个城市加 tabIndex={0} 就行',
      ],
      answer: 0,
      explain:
        '用户高亮城市后还要继续打字。焦点必须留在输入框里，所以只能用 aria-activedescendant。最迷惑的是 roving tabindex：它把焦点移到列表项上，用户再打字时，字符不会进入输入框。给每项加 tabIndex={0} 会让列表占用很多个 Tab 停靠点，违反“一组只占一个停靠点”。',
    },
    {
      q: '组件库的 Select 现在选中后会自动关闭。产品想要“选中后不关闭”。下面哪个做法可以放进小版本发布？',
      options: [
        '新增可选 prop closeOnSelect，默认值为 true',
        '把选中后关闭改成不关闭，在发布说明里提醒',
        '新增 prop closeOnSelect，默认值为 false',
        '不再自动关闭，改为 onChange(value, { close })，由使用者调用 close()',
      ],
      answer: 0,
      explain:
        '新增可选 prop，并且默认值保持旧行为，不改代码的使用者升级后行为不变，所以不是破坏性变更。新增 prop 但默认值为 false，看起来也是“新增”，其实改了所有旧用法的行为，是破坏性的。直接改行为更是如此，写进发布说明也不能改变这一点。给 onChange 加第二个参数本身是兼容的，但“不再自动关闭”让所有没调用 close() 的旧代码改变了行为，所以仍是破坏性变更。',
    },
    {
      q: '页面写了 <code>&lt;CitySelect value={user?.city} onChange={save} /&gt;</code>。user 异步加载。数据到达前，用户先选了“上海”；随后数据到达，user.city 是“北京”。CitySelect 用 value !== undefined 判断受控。之后显示什么？',
      options: [
        '北京。数据到达前组件是非受控的，用户的选择只存在内部 state；之后变成受控，内部 state 被忽略',
        '上海。用户的操作比数据晚，应该以用户为准',
        '北京，并且会把“上海”通过 onChange 再发一次',
        '上海。组件第一次渲染时是非受控的，以后一直是非受控',
      ],
      answer: 0,
      explain:
        'value 从 undefined 变成 "北京"，组件从非受控切到受控，之后只显示 value。用户的“上海”留在内部 state 里，被丢掉了。选“一直是非受控”的人以为模式在第一次渲染时固定，但这个 Hook 每次渲染都重新判断。修法：写 value={user?.city ?? null}，从一开始就是受控的。好的实现还会在模式切换时打印警告。',
    },
    {
      q: '团队要做一个给 12 个产品共用的组件库。各产品视觉差别很大，但都要求键盘和读屏软件可用。哪种 API 最合适？',
      options: [
        'headless Hook 和无样式复合组件负责行为，各产品在上面包自己的带样式组件',
        '一套带样式的组件，再给每个内部元素加 className 和 style prop',
        '每个产品复制一份组件源码，自己改',
        '只提供 CSS 类名规范，行为由各产品自己写',
      ],
      answer: 0,
      explain:
        '行为和无障碍是共性，最难写对，应该只写一次；样式是差异，交给各产品。最迷惑的是“加 className 和 style prop”：它在开始时最省事，但内部结构一变，所有依赖这些 prop 的样式都可能坏掉，而且 prop 会越加越多。复制源码和只给 CSS 规范都会让键盘行为在 12 个产品里各写一遍。',
    },
    {
      q: '工具栏有 6 个按钮，用 roving tabindex 实现，当前项是第 3 个。焦点在工具栏<b>前面</b>的搜索框里。用户按两次 Tab，焦点在哪里？',
      options: ['工具栏后面的第一个可聚焦元素', '工具栏的第 2 个按钮', '工具栏的第 4 个按钮', '工具栏的第 1 个按钮'],
      answer: 0,
      explain:
        'roving tabindex 下只有当前项的 tabIndex 是 0，整个工具栏只占一个停靠点。第一次 Tab 进入工具栏，落在第 3 个按钮上（不是第 1 个）；第二次 Tab 就离开工具栏。组内移动用方向键。以为第二次 Tab 到第 4 个按钮，是把 roving tabindex 当成了“每个按钮都能 Tab”。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>实现 <code>useListbox({ options, value, defaultValue, onChange })</code>。<code>options</code> 是 <code>{ value, label }</code> 数组。返回 <code>{ selectedValue, activeIndex, getListboxProps, getOptionProps }</code>。</li><li>受控与非受控：传了 <code>value</code>（包括 <code>null</code>）就是受控，只调用 <code>onChange(选项的 value)</code>。没传就用内部 state，初始值为 <code>defaultValue</code>，选中时也调用 onChange。</li><li>高亮（activeIndex）和选中分开。初始高亮已选中的项，没有选中项时高亮第 0 项。父组件之后改 value 时，高亮不必跟着移动，本练习不检查。</li><li><code>getListboxProps(props)</code> 返回使用者的 props，再加上：<code>role="listbox"</code>、<code>tabIndex: 0</code>、指向高亮项 id 的 <code>aria-activedescendant</code>、<code>onKeyDown</code>。使用者传的 onKeyDown 也要调用。</li><li>键盘：ArrowDown / ArrowUp 移动高亮，到头停住（不循环）；Home / End 到第一项 / 最后一项；这四个键要调用 <code>preventDefault()</code>。Enter 或空格选中高亮的项（空格也要 <code>preventDefault()</code>，否则页面会滚动）。</li><li><code>getOptionProps(index, props)</code> 返回使用者的 props，再加上：唯一且稳定的 <code>id</code>（用 useId）、<code>role="option"</code>、<code>aria-selected</code>（选中项为 true，其他为 false）、<code>onClick</code>（选中并高亮这一项，同时调用使用者的 onClick）。</li><li>不要修改 Listbox 和 App。检查程序会用你的 useListbox 另外渲染几个组件来测试。</li></ol>',
    starter: `import { useState, useId } from 'react';

function useListbox({ options, value, defaultValue = null, onChange }) {
  // 在这里实现。下面的返回值只是占位
  return {
    selectedValue: defaultValue,
    activeIndex: 0,
    getListboxProps: (props = {}) => props,
    getOptionProps: (index, props = {}) => props,
  };
}

// ---- 以下不要修改：一个用 useListbox 画出来的列表 ----
function Listbox({ label, options, value, defaultValue, onChange }) {
  const [keys, setKeys] = useState(0);
  const lb = useListbox({ options, value, defaultValue, onChange });
  return (
    <div>
      <ul {...lb.getListboxProps({ 'aria-label': label, onKeyDown: () => setKeys(k => k + 1) })}
        style={{ listStyle: 'none', margin: 0, padding: 4, width: 140, border: '1px solid #999', borderRadius: 6 }}>
        {options.map((o, i) => (
          <li key={o.value} {...lb.getOptionProps(i)} style={{
            padding: '3px 8px', cursor: 'pointer', borderRadius: 4, color: '#222',
            background: i === lb.activeIndex ? '#dbeafe' : 'transparent',
            fontWeight: o.value === lb.selectedValue ? 700 : 400,
          }}>
            {o.value === lb.selectedValue ? '✓ ' : ''}{o.label}
          </li>
        ))}
      </ul>
      <small>{label} · 按键次数：{keys}</small>
    </div>
  );
}

const FRUITS = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃' },
  { value: 'durian', label: '榴莲' },
  { value: 'grape', label: '葡萄' },
];

function App() {
  const [fruit, setFruit] = useState('banana');
  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <Listbox label="非受控" options={FRUITS} defaultValue="cherry"
        onChange={v => console.log('非受控选中', v)} />
      <div>
        <Listbox label="受控" options={FRUITS} value={fruit} onChange={setFruit} />
        <p>父组件的 state：{String(fruit)}</p>
        <button onClick={() => setFruit(null)}>清空</button>{' '}
        <button onClick={() => setFruit('grape')}>选葡萄</button>
      </div>
    </div>
  );
}`,
    solution: `import { useState, useId } from 'react';

function useListbox({ options, value, defaultValue = null, onChange }) {
  const isControlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const selected = isControlled ? value : inner;
  const [active, setActive] = useState(() => Math.max(0, options.findIndex(o => o.value === selected)));
  const baseId = useId();
  const optionId = (i) => baseId + '-opt-' + i;

  function select(i) {
    const v = options[i].value;
    setActive(i);
    if (!isControlled) setInner(v);
    if (onChange) onChange(v);
  }

  function handleKeyDown(e) {
    const last = options.length - 1;
    let next;
    if (e.key === 'ArrowDown') next = Math.min(active + 1, last);
    else if (e.key === 'ArrowUp') next = Math.max(active - 1, 0);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(active); return; }
    else return;
    e.preventDefault();
    setActive(next);
  }

  return {
    selectedValue: selected,
    activeIndex: active,
    getListboxProps: (props = {}) => ({
      ...props,
      role: 'listbox',
      tabIndex: 0,
      'aria-activedescendant': options.length ? optionId(active) : undefined,
      onKeyDown: (e) => {
        if (props.onKeyDown) props.onKeyDown(e);
        handleKeyDown(e);
      },
    }),
    getOptionProps: (index, props = {}) => ({
      ...props,
      id: optionId(index),
      role: 'option',
      'aria-selected': options[index].value === selected,
      onClick: (e) => {
        if (props.onClick) props.onClick(e);
        select(index);
      },
    }),
  };
}

// ---- 以下不要修改：一个用 useListbox 画出来的列表 ----
function Listbox({ label, options, value, defaultValue, onChange }) {
  const [keys, setKeys] = useState(0);
  const lb = useListbox({ options, value, defaultValue, onChange });
  return (
    <div>
      <ul {...lb.getListboxProps({ 'aria-label': label, onKeyDown: () => setKeys(k => k + 1) })}
        style={{ listStyle: 'none', margin: 0, padding: 4, width: 140, border: '1px solid #999', borderRadius: 6 }}>
        {options.map((o, i) => (
          <li key={o.value} {...lb.getOptionProps(i)} style={{
            padding: '3px 8px', cursor: 'pointer', borderRadius: 4, color: '#222',
            background: i === lb.activeIndex ? '#dbeafe' : 'transparent',
            fontWeight: o.value === lb.selectedValue ? 700 : 400,
          }}>
            {o.value === lb.selectedValue ? '✓ ' : ''}{o.label}
          </li>
        ))}
      </ul>
      <small>{label} · 按键次数：{keys}</small>
    </div>
  );
}

const FRUITS = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃' },
  { value: 'durian', label: '榴莲' },
  { value: 'grape', label: '葡萄' },
];

function App() {
  const [fruit, setFruit] = useState('banana');
  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <Listbox label="非受控" options={FRUITS} defaultValue="cherry"
        onChange={v => console.log('非受控选中', v)} />
      <div>
        <Listbox label="受控" options={FRUITS} value={fruit} onChange={setFruit} />
        <p>父组件的 state：{String(fruit)}</p>
        <button onClick={() => setFruit(null)}>清空</button>{' '}
        <button onClick={() => setFruit('grape')}>选葡萄</button>
      </div>
    </div>
  );
}`,
    exports: ['useListbox'],
    hint: '先写受控判断：本课第一节的三条规则，注意 null。再想清楚两份 state：一份是选中的值（可能由父组件控制），一份是高亮的序号（永远由 Hook 自己管）。getter 先展开使用者的 props，再写自己的属性；使用者的 onKeyDown、onClick 要在你的函数里调用。id 只调用一次 useId，再加序号后缀。',
    faded: `import { useState, useId } from 'react';

function useListbox({ options, value, defaultValue = null, onChange }) {
  /* ✏️ 判断受控：传了 value（包括 null）就是受控 */
  const [inner, setInner] = useState(defaultValue);
  const selected = isControlled ? value : inner;
  const [active, setActive] = useState(() => Math.max(0, options.findIndex(o => o.value === selected)));
  const baseId = useId();
  const optionId = (i) => baseId + '-opt-' + i;

  function select(i) {
    const v = options[i].value;
    setActive(i);
    /* ✏️ 受控时不改内部 state；两种模式都调用 onChange(v) */
  }

  function handleKeyDown(e) {
    const last = options.length - 1;
    let next;
    if (e.key === 'ArrowDown') next = Math.min(active + 1, last);
    else if (e.key === 'ArrowUp') next = Math.max(active - 1, 0);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(active); return; }
    else return;
    e.preventDefault();
    setActive(next);
  }

  return {
    selectedValue: selected,
    activeIndex: active,
    getListboxProps: (props = {}) => ({
      ...props,
      role: 'listbox',
      tabIndex: 0,
      /* ✏️ aria-activedescendant：指向高亮项的 id */
      onKeyDown: (e) => {
        /* ✏️ 先调用使用者的 onKeyDown（如果有），再交给 handleKeyDown */
      },
    }),
    getOptionProps: (index, props = {}) => ({
      ...props,
      id: optionId(index),
      role: 'option',
      'aria-selected': options[index].value === selected,
      onClick: (e) => {
        if (props.onClick) props.onClick(e);
        select(index);
      },
    }),
  };
}

// ---- 以下不要修改：一个用 useListbox 画出来的列表 ----
function Listbox({ label, options, value, defaultValue, onChange }) {
  const [keys, setKeys] = useState(0);
  const lb = useListbox({ options, value, defaultValue, onChange });
  return (
    <div>
      <ul {...lb.getListboxProps({ 'aria-label': label, onKeyDown: () => setKeys(k => k + 1) })}
        style={{ listStyle: 'none', margin: 0, padding: 4, width: 140, border: '1px solid #999', borderRadius: 6 }}>
        {options.map((o, i) => (
          <li key={o.value} {...lb.getOptionProps(i)} style={{
            padding: '3px 8px', cursor: 'pointer', borderRadius: 4, color: '#222',
            background: i === lb.activeIndex ? '#dbeafe' : 'transparent',
            fontWeight: o.value === lb.selectedValue ? 700 : 400,
          }}>
            {o.value === lb.selectedValue ? '✓ ' : ''}{o.label}
          </li>
        ))}
      </ul>
      <small>{label} · 按键次数：{keys}</small>
    </div>
  );
}

const FRUITS = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'cherry', label: '樱桃' },
  { value: 'durian', label: '榴莲' },
  { value: 'grape', label: '葡萄' },
];

function App() {
  const [fruit, setFruit] = useState('banana');
  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <Listbox label="非受控" options={FRUITS} defaultValue="cherry"
        onChange={v => console.log('非受控选中', v)} />
      <div>
        <Listbox label="受控" options={FRUITS} value={fruit} onChange={setFruit} />
        <p>父组件的 state：{String(fruit)}</p>
        <button onClick={() => setFruit(null)}>清空</button>{' '}
        <button onClick={() => setFruit('grape')}>选葡萄</button>
      </div>
    </div>
  );
}`,
    test: async t => {
      const { React, ReactDOM } = t;
      const useListbox = t.exports.useListbox;
      t.assert(typeof useListbox === 'function', '请保留名为 useListbox 的函数');
      t.assert(t.qa('[role="listbox"]').length >= 2, '页面上应有两个 role="listbox" 的列表。getListboxProps 要返回 role: "listbox"（步骤 4）');

      const h = React.createElement;
      const OPTS = [
        { value: 'a', label: '甲' },
        { value: 'b', label: '乙' },
        { value: 'c', label: '丙' },
        { value: 'd', label: '丁' },
      ];
      const log = { changes: [], keys: 0, clicks: 0 };
      let setParent = null;
      function View({ lb }) {
        return h(
          'ul',
          lb.getListboxProps({
            'aria-label': '测试列表',
            onKeyDown: () => {
              log.keys++;
            },
          }),
          OPTS.map((o, i) =>
            h(
              'li',
              Object.assign(
                { key: o.value },
                lb.getOptionProps(i, {
                  onClick: () => {
                    log.clicks++;
                  },
                }),
              ),
              o.label,
            ),
          ),
        );
      }
      function Free(props) {
        return h(View, { lb: useListbox(Object.assign({ options: OPTS }, props)) });
      }
      function Ctrl({ initial, reject }: { initial: any; reject?: any }) {
        const [v, setV] = React.useState(initial);
        setParent = setV;
        const lb = useListbox({
          options: OPTS,
          value: v,
          onChange: x => {
            log.changes.push(x);
            if (!reject) setV(x);
          },
        });
        return h(View, { lb });
      }

      const box = document.createElement('div');
      document.body.appendChild(box);
      const root = ReactDOM.createRoot(box);
      const mount = async el => {
        ReactDOM.flushSync(() => root.render(el));
        await t.wait(20);
      };
      const ul = () => box.querySelector('ul');
      const lis = () => Array.from(box.querySelectorAll<HTMLElement>('li'));
      const press = async key => {
        const ev = new KeyboardEvent('keydown', { key, code: key === ' ' ? 'Space' : key, bubbles: true, cancelable: true });
        ul().dispatchEvent(ev);
        await t.wait(30);
        return ev;
      };
      const active = () => {
        const id = ul().getAttribute('aria-activedescendant');
        const el = id ? lis().find(li => li.id === id) : null;
        return el ? el.textContent : null;
      };
      const selected = () =>
        lis()
          .filter(li => li.getAttribute('aria-selected') === 'true')
          .map(li => li.textContent);
      const selText = () => {
        const s = selected();
        return s.length ? s.join('、') : '没有';
      };
      try {
        // —— 非受控 ——
        await mount(h(Free, { key: 1, defaultValue: 'b' }));
        t.assert(
          ul() && ul().getAttribute('role') === 'listbox',
          '列表元素缺少 role="listbox"。getListboxProps 要返回 role、tabIndex、aria-activedescendant 和 onKeyDown（步骤 4）',
        );
        t.assert(
          ul().tabIndex === 0,
          '列表要能用 Tab 聚焦：getListboxProps 要返回 tabIndex: 0。焦点留在列表上，再用 aria-activedescendant 指出高亮项（步骤 4）',
        );
        t.assert(
          ul().getAttribute('aria-label') === '测试列表',
          '使用者传给 getListboxProps 的 aria-label 丢了。getter 要先展开使用者的 props，再加上自己的属性（步骤 4）',
        );
        t.assert(
          lis().every(li => li.getAttribute('role') === 'option'),
          '每个选项都要有 role="option"（步骤 6）',
        );
        const ids = lis().map(li => li.id);
        t.assert(ids.every(Boolean) && new Set(ids).size === ids.length, '每个选项都要有唯一的 id，aria-activedescendant 要靠它找到选项（步骤 6）');
        t.assert(
          selected().length === 1 && selected()[0] === '乙',
          'defaultValue 为 "b" 时，应只有“乙”的 aria-selected 为 "true"，实际为：' + selText() + '（步骤 2、6）',
        );
        t.assert(
          active() === '乙',
          'aria-activedescendant 应指向高亮项的 id。初始时高亮已选中的项（乙），实际指向：' + (active() || '找不到的元素') + '（步骤 3、4）',
        );

        let ev = await press('ArrowDown');
        t.assert(log.keys === 1, '使用者传给 getListboxProps 的 onKeyDown 没有被调用。getter 返回的 onKeyDown 要先调用使用者的，再处理自己的按键（步骤 4）');
        t.assert(active() === '丙', '按 ArrowDown 后，高亮应从“乙”移到“丙”，aria-activedescendant 实际指向：' + (active() || '找不到的元素') + '（步骤 5）');
        t.assert(ev.defaultPrevented, '方向键要调用 e.preventDefault()，否则页面会跟着滚动（步骤 5）');
        t.assert(selected().join() === '乙', '方向键只移动高亮，不改变选中项。按 Enter 或空格才选中。现在选中的是：' + selText() + '（步骤 3、5）');
        t.assert(
          lis()
            .map(li => li.id)
            .join() === ids.join(),
          '重新渲染后选项的 id 变了。id 要稳定：用 useId() 生成一次，再加序号后缀，不要用 Math.random（步骤 6）',
        );

        await press('ArrowDown');
        await press('ArrowDown');
        await press('ArrowDown');
        t.assert(active() === '丁', '在最后一项按 ArrowDown，高亮应停在最后一项（不循环），实际在：' + (active() || '找不到的元素') + '（步骤 5）');
        ev = await press('Home');
        t.assert(active() === '甲' && ev.defaultPrevented, 'Home 应把高亮移到第一项，并调用 preventDefault()（步骤 5）');
        await press('ArrowUp');
        t.assert(active() === '甲', '在第一项按 ArrowUp，高亮应停在第一项（不循环）（步骤 5）');
        ev = await press('End');
        t.assert(active() === '丁' && ev.defaultPrevented, 'End 应把高亮移到最后一项，并调用 preventDefault()（步骤 5）');
        await press('ArrowUp');
        await press('Enter');
        t.assert(selected().join() === '丙', '高亮“丙”时按 Enter，应只有“丙”被选中，实际为：' + selText() + '（步骤 2、5）');
        await press('ArrowDown');
        ev = await press(' ');
        t.assert(selected().join() === '丁', '高亮“丁”时按空格，也应选中“丁”，实际为：' + selText() + '（步骤 2、5）');
        t.assert(ev.defaultPrevented, '空格也要调用 e.preventDefault()，否则页面会跟着滚动（步骤 5）');

        lis()[3].click();
        await t.wait(30);
        t.assert(log.clicks === 1, '使用者传给 getOptionProps 的 onClick 没有被调用。getter 要合并两边的 onClick（步骤 6）');
        t.assert(
          selected().join() === '丁' && active() === '丁',
          '点击“丁”后，它应被选中并高亮。实际选中：' + selText() + '，高亮：' + (active() || '无') + '（步骤 6）',
        );

        // —— 非受控，但传了 onChange ——
        log.changes = [];
        await mount(h(Free, { key: 2, onChange: x => log.changes.push(x) }));
        t.assert(selected().length === 0, '没有 defaultValue 时，不应有选项被选中，实际为：' + selText());
        t.assert(active() === '甲', '没有选中项时，初始应高亮第 0 项（步骤 3）');
        await press('ArrowDown');
        await press('Enter');
        t.assert(
          log.changes.length === 1 && log.changes[0] === 'b',
          '选中“乙”时，onChange 应被调用一次，参数是选项的 value "b"。实际调用：' + JSON.stringify(log.changes) + '（步骤 2）',
        );
        t.assert(
          selected().join() === '乙',
          '只传了 onChange、没传 value 的组件是非受控的，选中后应自己显示“乙”。实际选中：' + selText() + '。判断受控只看 value 是不是 undefined（步骤 2）',
        );

        // —— 受控，父组件接受新值 ——
        log.changes = [];
        await mount(h(Ctrl, { key: 3, initial: null }));
        t.assert(selected().length === 0, '受控模式下 value 为 null，不应有选项被选中，实际为：' + selText());
        await press('ArrowDown');
        await press('Enter');
        t.assert(log.changes.join() === 'b', '受控模式下高亮“乙”再按 Enter，应调用 onChange("b")。实际调用：' + JSON.stringify(log.changes) + '（步骤 2）');
        t.assert(selected().join() === '乙', '父组件接受了 "b"，应选中“乙”，实际为：' + selText());
        ReactDOM.flushSync(() => setParent('d'));
        await t.wait(20);
        t.assert(selected().join() === '丁', '父组件把 value 改成 "d" 后，应选中“丁”，实际为：' + selText() + '。受控时显示的必须是 value');
        ReactDOM.flushSync(() => setParent(null));
        await t.wait(20);
        t.assert(
          selected().length === 0,
          '父组件把 value 设为 null，表示“受控，但什么都没选”，不应有选项被选中，实际为：' +
            selText() +
            '。不能把 null 当成“没传”：判断受控要用 value !== undefined（步骤 2）',
        );

        // —— 受控，父组件拒绝新值 ——
        log.changes = [];
        await mount(h(Ctrl, { key: 4, initial: 'b', reject: true }));
        await press('ArrowDown');
        await press('Enter');
        t.assert(log.changes.join() === 'c', '受控模式下按 Enter，应调用 onChange("c")，实际调用：' + JSON.stringify(log.changes));
        t.assert(
          selected().join() === '乙',
          '父组件没有接受新值，选中项应保持“乙”，实际为：' + selText() + '。受控时只调用 onChange，显示什么由 value 决定（步骤 2）',
        );
        lis()[3].click();
        await t.wait(30);
        t.assert(selected().join() === '乙', '父组件拒绝新值时，点击“丁”也不应改变选中项，实际为：' + selText());

        // —— 两个实例的 id 不能重复 ——
        await mount(h('div', { key: 5 }, h(Free, { defaultValue: 'a' }), h(Free, { defaultValue: 'a' })));
        const lists = Array.from(box.querySelectorAll('ul'));
        const all = Array.from(box.querySelectorAll('li')).map(li => li.id);
        t.assert(
          lists.length === 2 && new Set(all).size === all.length,
          '同时渲染两个列表时，选项的 id 重复了。id 要用 useId() 生成，每个实例都不同（步骤 6）',
        );
      } finally {
        root.unmount();
        box.remove();
      }
    },
  },
  checkOnly: [
    {
      q: `使用者想给选项一个自己的 id，写成下面这样。用键盘操作时会出什么问题？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;ul {...lb.getListboxProps()}&gt;
  {items.map((it, i) =&gt; (
    &lt;li key={it.id} {...lb.getOptionProps(i)} id={'item-' + it.id}&gt;
      {it.name}
    &lt;/li&gt;
  ))}
&lt;/ul&gt;</code></pre></div>`,
      options: [
        '列表的 aria-activedescendant 仍是 Hook 生成的 id，找不到对应元素，读屏软件读不出高亮项',
        '没有问题：后写的 id 覆盖前面的，两边会自动同步',
        '方向键失效，因为 onKeyDown 被覆盖了',
        'React 报错：同一个元素不能有两个 id',
      ],
      answer: 0,
      explain:
        '后写的 id 覆盖了 getter 返回的 id。可列表的 aria-activedescendant 由 Hook 计算，指向的还是 Hook 自己的 id，页面上已经没有这个元素了。高亮样式照常显示，所以眼睛看不出问题，只有读屏用户受影响。onKeyDown 在 ul 上，没有被覆盖。修法：不要覆盖 getter 管理的 id；库可以让使用者通过参数传入 id 前缀。',
    },
    {
      q: `父组件点“清空”时执行 <code>setCity(null)</code>。之前选中的是“北京”。清空后显示什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function useSelectValue({ value, defaultValue, onChange }) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  // 选中时：setInner(v); onChange?.(v);
  return current;
}</code></pre></div>`,
      options: ['仍显示“北京”', '什么都不显示', '显示 defaultValue', '报错：value 不能是 null'],
      answer: 0,
      explain:
        '<code>value ?? inner</code> 把 null 当成“没传”，于是退回内部 state。选中“北京”时内部 state 也被设成了北京，所以清空后仍显示北京。父组件已经清空，界面却没变，两者不一致。修法：用 value !== undefined 判断受控，受控时直接显示 value（包括 null）。',
    },
    {
      q: `这是一个 roving tabindex 工具栏。焦点在第 1 个按钮上，按一次 ArrowRight。接下来焦点在哪里？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function onKeyDown(e) {
  if (e.key === 'ArrowRight') {
    setActive(a =&gt; Math.min(a + 1, tools.length - 1));
  }
}
// 渲染：
&lt;button tabIndex={i === active ? 0 : -1}&gt;{name}&lt;/button&gt;</code></pre></div>`,
      options: ['仍在第 1 个按钮上，只是它的 tabIndex 变成了 -1', '移到第 2 个按钮上', '离开工具栏，回到 body', '移到第 2 个按钮上，但没有焦点轮廓'],
      answer: 0,
      explain:
        'tabIndex 只决定 Tab 键会停在哪里，不会移动焦点。roving tabindex 必须在改 state 之后调用目标按钮的 focus()。最迷惑的是“移到第 2 个按钮上”：视觉上如果你用 active 画高亮，看起来像是移过去了，其实焦点和读屏软件都还在第 1 个按钮。',
    },
    {
      q: `用户按 Tab 能进入这个列表吗？进入后按方向键有效吗？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;ul role="listbox" aria-label="字号"
    aria-activedescendant={ids[active]}
    onKeyDown={handleKeyDown}&gt;
  {sizes.map((s, i) =&gt; (
    &lt;li key={s} id={ids[i]} role="option"
        aria-selected={i === active}&gt;{s}&lt;/li&gt;
  ))}
&lt;/ul&gt;</code></pre></div>`,
      options: [
        '都不能：ul 默认不可聚焦，Tab 跳过它，keydown 也到不了它',
        '都能：role="listbox" 会让元素自动可聚焦',
        '能进入，但方向键无效',
        '不能用 Tab 进入，但点一下之后方向键有效',
      ],
      answer: 0,
      explain:
        'role 只改变读屏软件读出的角色，不添加任何行为（第 26 课讲过）。ul 没有 tabIndex，就不能聚焦。keydown 只发给有焦点的元素，所以 handleKeyDown 永远不会执行。用鼠标点 li 也不会让 ul 获得焦点。修法：给 ul 加 tabIndex={0}。aria-activedescendant 方案里，容器必须是那个真正拿着焦点的元素。',
    },
  ],
  plays: {
    受控模式下的函数式更新: {
      note: '非受控走的是 React 自己的更新队列：第二个函数拿到第一个函数的结果，所以加 2。受控时，函数在 Hook 里执行，两次都基于本次渲染的 <code>value</code>（0）计算，于是两次都调用 <code>onChange(1)</code>。<br>用 ref 记住“最新值”能让它累加，但又带来新问题：父组件拒绝了 1，ref 里却已经是 1，下一次会算出 2。',
      predict: {
        q: '两个 Stepper 各点一次“+2”。它们分别显示几？',
        options: ['非受控 2，受控 1', '都显示 2', '都显示 1', '非受控 1，受控 2'],
        answer: 0,
        explain:
          '非受控时，函数交给 React 的 setInner 排队，第二个函数拿到 1，结果是 2。受控时，Hook 自己执行函数，两次都用本次渲染的 value（0），父组件收到两次 onChange(1)，结果是 1。同一个 API 在两种模式下结果不同，这正是要在库里避免的事。',
      },
      pkey: 'headless-components|受控模式下的函数式更新',
    },
    '同一个 Hook，两种界面': {
      note: 'FaqItem 把自己的 onClick 交给 getter，callAll 先调用它，再切换展开状态。FilterBox 先展开 getter，再在后面写 onClick。JSX 里后写的属性覆盖先写的，Hook 的 onClick 被整个替换掉了。<br>这就是 getter 要接收使用者 props 的原因：合并的工作交给库，使用者不需要记住顺序。',
      predict: {
        q: '点“筛选条件”按钮。会发生什么？',
        options: ['控制台打印“统计：点了筛选”，面板不展开', '面板展开，控制台也打印', '面板展开，控制台不打印', '报错：onClick 重复定义'],
        answer: 0,
        explain:
          'JSX 的属性和对象展开一样，后写的覆盖先写的。按钮最终只有使用者的 onClick，Hook 的 setOpen 没被调用，所以面板不展开。aria-expanded 也一直是 false。修法：把 onClick 传给 getButtonProps，由 getter 合并。',
      },
      pkey: 'headless-components|同一个 Hook，两种界面',
    },
    '合并 ref：卸载时调用谁？': {
      note: '使用者的 ref 回调返回了清理函数。mergeRefs 收集到它，并在自己返回的清理函数里调用。React 看到 ref 回调返回了函数，卸载时只调用这个函数，不再用 <code>null</code> 调用 ref 回调，所以控制台只多一行“清理函数被调用”。<br>如果 mergeRefs 只是依次赋值，没有返回任何东西，React 卸载时会用 null 调用它，使用者的回调收到 null，它返回的清理函数则永远不会被调用。React 18 的 mergeRefs 就是这样写的。',
      predict: {
        q: '点“卸载 Field”。控制台里新增什么？',
        options: ['“使用者的 ref 清理函数被调用”', '“使用者的 ref 回调收到：null”', '以上两行都有', '什么也没有：合并后的回调丢掉了使用者的 ref'],
        answer: 0,
        explain:
          '合并后的回调返回了清理函数，React 卸载时只调用它，不再用 null 调用 ref 回调。mergeRefs 在清理函数里转发了使用者的清理函数，所以只多一行。如果返回的是 undefined，React 才会用 null 调用回调。',
      },
      pkey: 'headless-components|合并 ref：卸载时调用谁？',
    },
    '复合组件：选项被包了一层': {
      note: '包了 div 之后，<code>Children.toArray(children)</code> 只看到一个子元素，选项数组只有一项 <code>{ value: undefined }</code>。Option 用自己的 value 去找序号，找不到，得到 -1，点击时执行 <code>options[-1].value</code>，抛出 TypeError。事件处理函数里的错误不会让页面白屏，只是点击没有效果。<br>这就是复合组件“只认直接子元素”的代价。集合 API 或注册方式可以解决它。',
      predict: {
        q: '点“给选项包一层 div”，再点“香蕉”。会发生什么？',
        options: ['选中“香蕉”，和没包 div 时一样', '没有选中任何选项，控制台出现 TypeError', '页面白屏，因为渲染出错', '选中“苹果”：序号错位'],
        answer: 1,
        explain:
          'Listbox 收集选项时只看直接子元素，div 把两个 Option 藏起来了。Option 在 options 里找不到自己，序号是 -1，点击时读 options[-1].value 就抛出 TypeError。错误发生在事件处理函数里，不在渲染期间，所以页面没有白屏，选中状态也不变。',
      },
      pkey: 'headless-components|复合组件：选项被包了一层',
    },
    'roving tabindex 与 aria-activedescendant': {
      note: '在工具栏里按左右方向键，最下面一行跟着变：焦点真的在按钮之间移动。再按 Tab 进入字号列表，按上下方向键，最下面一行一直是“ul：字号”：焦点没动，变的只是 aria-activedescendant 和高亮样式。<br>另外注意：从工具栏按一次 Tab 就离开了整个工具栏，它只占一个 Tab 停靠点。',
    },
  },
} satisfies Lesson;
