import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/accessibility.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'accessibility',
  runtime: 19,
  stage: 3,
  title: '无障碍：让每个人都能用',
  mins: 40,
  summary: '先用语义化 HTML，再按需补 ARIA。做到能用键盘操作、焦点不丢、异步消息能被读出。',
  goals: [
    '能说出 &lt;button&gt; 比 &lt;div onClick&gt; 多做的三件事：能聚焦、Enter 和空格能触发、读屏软件读出“按钮”',
    '能用 label、useId 和 aria-describedby 给表单字段关联名字、提示和错误',
    '能判断弹窗打开和关闭时焦点该去哪里，以及消息该用 role="status" 还是 role="alert"',
    '能写出带 aria-expanded 和 aria-controls 的折叠面板',
  ],
  keyPoints: [
    '读屏软件只能读出每个元素的角色、名字和状态。你的工作是把这三样写进 HTML。',
    '先用原生元素：<code>&lt;button&gt;</code> 自带聚焦和键盘行为。<code>role="button"</code> 只改读出的角色，不添加任何行为。',
    '每个控件都要有名字：label 关联输入框，只有图标的按钮加 <code>aria-label</code>。组件会渲染多次，id 用 <code>useId</code> 生成。',
    '焦点不能丢：弹窗打开时移进去，关闭后还给打开它的按钮。',
    '异步消息放进一直存在的实时区域（<code>role="status"</code>），只改里面的文字。区域和内容同时挂载，很多读屏软件不会读。',
  ],
  quiz: [
    {
      q: '同事写了 <code>&lt;div role="button" onClick={save}&gt;保存&lt;/div&gt;</code>。只用键盘的用户会遇到什么问题？',
      options: [
        '没有问题：role="button" 已经让它变成真正的按钮',
        'Tab 到不了它；加了 tabIndex 后，Enter 和空格也不触发 save',
        '读屏软件读不出“保存”：div 里的文字不算可访问名称，必须加 aria-label',
        '只是样式和按钮不同，功能完全一样',
      ],
      answer: 1,
      explain:
        'role 只改变读屏软件读出的角色，不添加任何行为。div 默认不能聚焦，也不会把 Enter 和空格转成 click。直接改成 &lt;button type="button"&gt; 就全都解决了。第一个选项是最常见的误解：写了 role="button" 等于承诺实现按钮的全部键盘行为，但浏览器不会替你实现。读屏软件能读出“保存”，所以第三个选项不对。',
    },
    {
      q: '保存成功后，代码执行 <code>{saved &amp;&amp; &lt;p role="status"&gt;已保存&lt;/p&gt;}</code>。很多读屏软件没有读出“已保存”。最可能的原因是？',
      options: [
        'role="status" 太“礼貌”，应该一律改成 role="alert"',
        '实时区域和内容是同时挂载的；区域要先存在，内容变化才会被播报',
        '读屏软件不支持 React 渲染的元素',
        '应该再加上 aria-live="off"',
      ],
      answer: 1,
      explain:
        '读屏软件监听的是“已有实时区域的内容变化”。正确写法是让 &lt;p role="status"&gt; 一直渲染，只改里面的文字。改成 alert 会打断用户，只适合错误消息。aria-live="off" 会关掉播报。',
    },
    {
      q: '用户按 Enter 打开确认弹窗，然后点“取消”。弹窗被卸载后，你没有处理焦点。焦点会去哪里？应该去哪里？',
      options: [
        '自动回到触发按钮，不需要处理',
        '落到 &lt;body&gt;，用户要从页面开头重新按 Tab；应该还给打开弹窗的按钮',
        '停在已被移除的“取消”按钮上，继续按 Enter 还能再次触发取消',
        '跳到页面上第一个输入框；这是浏览器的默认行为，也是正确的行为',
      ],
      answer: 1,
      explain:
        '获得焦点的元素被移除后，焦点通常落到 body。键盘用户会“迷路”。按照 WAI-ARIA 编写实践指南，关闭后要把焦点还给触发按钮。打开前可以用 ref 记住它。“自动回到触发按钮”是最常见的误解：原生 &lt;dialog&gt; 的部分浏览器会这样做，但自己用 div 写的弹窗不会。',
    },
  ],
  exercise: {
    task: '<p>做一个可访问的折叠面板组件 <code>Disclosure</code>。页面上会渲染两个。</p><ol class="task-steps"><li>用 state 记录面板是否展开。默认收起。</li><li>把标题放进真正的 <code>&lt;button&gt;</code>。点击时切换展开状态。</li><li>按钮上写 <code>aria-expanded</code>。展开时为 true，收起时为 false。</li><li>用 <code>useId</code> 生成面板的 id。把它写在面板的 <code>id</code> 上，也写在按钮的 <code>aria-controls</code> 上。</li><li>收起时隐藏面板：用 <code>hidden</code> 属性，或者不渲染面板。</li></ol><p>做完后用 Tab 和空格试一试。你不需要写任何键盘代码。</p>',
    starter: `import { useState, useId } from 'react';

function Disclosure({ title, children }) {
  // 在这里实现：state、useId、按钮、面板
  return (
    <div style={{ borderBottom: '1px solid #ddd', padding: '6px 0' }}>
      <div onClick={() => {}} style={{ cursor: 'pointer', fontWeight: 600 }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function App() {
  return (
    <div>
      <Disclosure title="配送说明">
        <p>下单后 48 小时内发货。</p>
      </Disclosure>
      <Disclosure title="退货政策">
        <p>收货后 7 天内可以无理由退货。</p>
      </Disclosure>
    </div>
  );
}`,
    solution: `import { useState, useId } from 'react';

function Disclosure({ title, children }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div style={{ borderBottom: '1px solid #ddd', padding: '6px 0' }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        {open ? '▾' : '▸'} {title}
      </button>
      <div id={panelId} hidden={!open}>
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <div>
      <Disclosure title="配送说明">
        <p>下单后 48 小时内发货。</p>
      </Disclosure>
      <Disclosure title="退货政策">
        <p>收货后 7 天内可以无理由退货。</p>
      </Disclosure>
    </div>
  );
}`,
    hint: '回到本课“展开与收起”一节的表格，逐行对照。注意：触发器必须是哪种元素？收起时 aria-expanded 的值是什么？面板 id 从哪个 Hook 来？',
    faded: `import { useState, useId } from 'react';

function Disclosure({ title, children }) {
  const [open, setOpen] = useState(false);
  /* ✏️ 用 useId 生成面板的 id */
  return (
    <div style={{ borderBottom: '1px solid #ddd', padding: '6px 0' }}>
      <button
        type="button"
        /* ✏️ aria-expanded：展开时为 true，收起时为 false */
        /* ✏️ aria-controls：指向面板的 id */
        onClick={() => setOpen(!open)}
      >
        {open ? '▾' : '▸'} {title}
      </button>
      <div id={panelId} /* ✏️ 收起时隐藏这个面板 */>
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <div>
      <Disclosure title="配送说明">
        <p>下单后 48 小时内发货。</p>
      </Disclosure>
      <Disclosure title="退货政策">
        <p>收货后 7 天内可以无理由退货。</p>
      </Disclosure>
    </div>
  );
}`,
    test: async t => {
      const ITEMS = [
        ['配送说明', '48 小时'],
        ['退货政策', '7 天'],
      ];
      const findTrigger = title => {
        const btn = t.qa('button').find(b => b.textContent.includes(title));
        if (btn) return btn;
        const other = t
          .qa('*')
          .filter(e => e.textContent.includes(title))
          .pop();
        t.assert(
          false,
          '没有找到包含“' +
            title +
            '”的 <button>。' +
            (other ? '你用的是 <' + other.tagName.toLowerCase() + '>。' : '') +
            '触发器要用真正的 <button>，这样 Tab、Enter 和空格才能自动工作。',
        );
      };
      const isShown = (panel, text) => !!panel && !panel.hidden && panel.getClientRects().length > 0 && panel.textContent.includes(text);
      const isHidden = panel => !panel || panel.hidden || panel.getClientRects().length === 0;
      const panelOf = btn => {
        const id = btn.getAttribute('aria-controls');
        return id ? t.root.querySelector('#' + CSS.escape(id)) : null;
      };

      t.assert(!/<div[^>]*\sonClick\s*=/.test(t.source), '代码里还有 <div onClick>。把它换成 <button>，不要给 div 加点击事件。');
      t.assert(/\buseId\s*\(/.test(t.source), '请用 useId() 生成面板的 id。写死的 id 在组件渲染两次时会重复。');

      const ids = ITEMS.map(([title]) => findTrigger(title).getAttribute('aria-controls'));
      t.assert(ids.every(Boolean), '按钮上没有 aria-controls。它要指向面板的 id。');
      t.assert(ids[0] !== ids[1], '两个面板的 id 相同（' + ids[0] + '）。页面上的 id 必须唯一，请用 useId()。');
      for (const [title, body] of ITEMS) {
        const btn = findTrigger(title);
        const exp = btn.getAttribute('aria-expanded');
        t.assert(exp !== null, '“' + title + '”按钮上没有 aria-expanded。收起时也要写，值为 false。');
        t.assert(exp === 'false', '“' + title + '”默认应该收起：aria-expanded 应为 "false"，现在是 "' + exp + '"。');
        t.assert(isHidden(panelOf(btn)), '“' + title + '”收起时，面板应该隐藏（hidden 属性或不渲染）。');
        t.assert(!t.root.innerText.includes(body), '“' + title + '”收起时，面板内容不应该显示出来。');

        await t.click(btn);
        const btn2 = findTrigger(title);
        t.assert(btn2.getAttribute('aria-expanded') === 'true', '点击“' + title + '”后，aria-expanded 应变为 "true"。');
        const panel = panelOf(btn2);
        t.assert(!!panel, '展开后，页面上找不到 id 为 aria-controls 值（' + btn2.getAttribute('aria-controls') + '）的面板。把同一个 id 写在面板上。');
        t.assert(!panel.contains(btn2), 'aria-controls 应指向面板，而不是包住按钮的外层元素。');
        t.assert(isShown(panel, body), '点击“' + title + '”后，面板应该显示内容。');

        await t.click(btn2);
        const btn3 = findTrigger(title);
        t.assert(btn3.getAttribute('aria-expanded') === 'false', '再点一次“' + title + '”，aria-expanded 应变回 "false"。');
        t.assert(isHidden(panelOf(btn3)), '再点一次“' + title + '”，面板应该重新隐藏。');
      }
    },
  },
  checkOnly: [
    {
      q: '下面四个图标按钮中，哪一个<b>没有</b>可访问名称？（<code>sr-only</code> 是视觉隐藏、读屏软件可读的样式。）',
      options: [
        '<button aria-label="关闭"><svg aria-hidden="true" /></button>',
        '<button><svg aria-hidden="true" /><span className="sr-only">关闭</span></button>',
        '<button><img src="close.svg" alt="" /></button>',
        '<button><img src="close.svg" alt="关闭" /></button>',
      ],
      answer: 2,
      explain:
        '按钮的名称来自 aria-label 或它里面的文字内容。图片的 alt 也算文字内容。<code>alt=""</code> 表示“这是装饰图片”，读屏软件会跳过它。这样按钮里没有任何文字，读屏软件只会读“按钮”。',
    },
    {
      q: `读屏软件把焦点移到这个输入框时，会读出什么？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;label&gt;邮箱&lt;/label&gt;
&lt;input type="email" /&gt;</code></pre></div>`,
      options: ['只读“编辑框”，没有名称', '“邮箱，编辑框”：label 就在它前面', '读出 type 的值“email”', '“邮箱”读两次'],
      answer: 0,
      explain:
        'label 没有和 input 关联，挨在一起也不算。输入框没有可访问名称，读屏软件只读出“编辑框”。点击“邮箱”文字也不会聚焦输入框。关联方法：<code>&lt;label htmlFor="email"&gt;</code> 配合 <code>&lt;input id="email"&gt;</code>，或者把 input 放进 label 里。“label 就在它前面”是看界面得出的结论，读屏软件看的是可访问名称。',
    },
    {
      q: `页面上渲染了 <code>&lt;Field label="姓名" /&gt;</code> 和 <code>&lt;Field label="电话" /&gt;</code>。点击文字“电话”，会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Field({ label }) {
  return (
    &lt;&gt;
      &lt;label htmlFor="field"&gt;{label}&lt;/label&gt;
      &lt;input id="field" /&gt;
    &lt;/&gt;
  );
}</code></pre></div>`,
      options: ['电话输入框获得焦点', '什么都不发生', '姓名输入框获得焦点', '报错：页面上有重复的 id'],
      answer: 2,
      explain:
        '两个 input 的 id 都是 "field"。浏览器按 id 查找时，只找到第一个，也就是姓名输入框。所以两个 label 都指向它，电话输入框没有名称。可复用的组件不能写死 id，要用 <code>const id = useId()</code> 生成唯一的 id。“报错”不对：重复 id 是无效的 HTML，但浏览器和 React 都不会报错，问题只在使用时暴露。',
    },
  ],
  plays: {
    '三个“按钮”': {
      note: '运行后，用键盘逐个试一遍：哪些能用 Tab 聚焦？哪些能用 Enter 和空格触发？<br>结果：① 不能用 Tab 聚焦。② 能聚焦，读屏软件也读出“按钮”，但 Enter 和空格没有反应。只有 ③ 全部正确，而且代码最短。',
      predict: {
        q: '用 Tab 把焦点移到 ②（加了 role="button" 和 tabIndex 的 div），然后按 Enter。② 的计数会怎样？',
        options: ['加 1', '没有变化', '加 2', '页面报错'],
        answer: 1,
        explain:
          'role 只改变读屏软件读出的角色，不会添加任何行为。tabIndex 只让它能被聚焦。按 Enter 触发 click 是 &lt;button&gt; 的内置行为，div 没有。要让 ② 正常工作，你还得自己监听 keydown，处理 Enter 和空格。直接用 &lt;button&gt; 更简单。',
      },
      pkey: 'accessibility|三个“按钮”',
    },
    'label、useId 与 aria-describedby': {
      note: '点击“邮箱”两个字，对应的输入框会获得焦点。两个字段的 id 不同，所以不会冲突。aria-describedby 把提示和错误文字关联到输入框，读屏软件会在名字之后读出它们。',
    },
    弹窗的焦点管理: {
      note: '只用键盘试一试：Tab 到按钮，按 Enter 打开。焦点在“取消”上。多按几次 Tab，焦点不会落到背后的页面上。按 Esc 关闭后，焦点回到“删除文件…”。',
    },
    '用 role="status" 和 role="alert" 播报消息': {
      note: '页面上看起来只是文字变了。打开系统自带的读屏软件（Windows 的“讲述人”或 macOS 的 VoiceOver），再点按钮，就能听到播报。',
    },
  },
} satisfies Lesson;
