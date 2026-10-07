/* ========== 后加的课：无障碍（插在 patterns 之后） ========== */
lessonAfter('patterns', {
  id: 'accessibility', stage: 3, title: '无障碍：让每个人都能用', mins: 30,
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
  body: [
    p('有的用户看不见屏幕，用<b>读屏软件</b>听页面。有的用户不能用鼠标，只用键盘。有的用户怕晃动的动画。<b>无障碍</b>（accessibility，简称 a11y）就是让这些用户也能用你的界面。'),
    p('上一课说，好的公共组件要“难以误用”。不能用键盘操作的组件，对很多人来说根本不能用。很多地区还有法律要求，例如欧盟《无障碍法案》（2025 年 6 月起生效）。'),
    like('读屏软件像一个通过电话帮你看网页的朋友。它看不到颜色和布局。它只能读出每个元素的<b>角色</b>（这是按钮）、<b>名字</b>（“保存”）和<b>状态</b>（已展开）。你的工作是把这三样信息写进 HTML。'),

    h('第一原则：先用语义化 HTML'),
    p('浏览器给原生元素内置了很多行为。<code>&lt;button&gt;</code> 能用 Tab 聚焦。按 Enter 或空格会触发 click。读屏软件会读出“按钮”。<code>&lt;div onClick&gt;</code> 一样都没有。'),
    p('下面有三个“按钮”。先用鼠标点一点。然后点一下页面空白处，只用 Tab 和 Enter 操作。'),
    Object.assign(play(`
import { useState } from 'react';

function App() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const box = { display: 'inline-block', padding: '6px 12px', margin: 4, border: '1px solid #888', borderRadius: 6, cursor: 'pointer' };
  return (
    <div>
      {/* ① 只有 onClick 的 div */}
      <div style={box} onClick={() => setA(a + 1)}>① div：{a}</div>
      {/* ② 加了 role 和 tabIndex 的 div */}
      <div style={box} role="button" tabIndex={0} onClick={() => setB(b + 1)}>② div + role：{b}</div>
      {/* ③ 真正的 button */}
      <button style={box} onClick={() => setC(c + 1)}>③ button：{c}</button>
      <p style={{ fontSize: 13 }}>提示：先点击这一行文字，再按 Tab。</p>
    </div>
  );
}`, '三个“按钮”', '运行后，用键盘逐个试一遍：哪些能用 Tab 聚焦？哪些能用 Enter 和空格触发？<br>结果：① 不能用 Tab 聚焦。② 能聚焦，读屏软件也读出“按钮”，但 Enter 和空格没有反应。只有 ③ 全部正确，而且代码最短。'), {
      predict: {
        q: '用 Tab 把焦点移到 ②（加了 role="button" 和 tabIndex 的 div），然后按 Enter。② 的计数会怎样？',
        options: ['加 1', '没有变化', '加 2', '页面报错'], answer: 1,
        explain: 'role 只改变读屏软件读出的角色，不会添加任何行为。tabIndex 只让它能被聚焦。按 Enter 触发 click 是 &lt;button&gt; 的内置行为，div 没有。要让 ② 正常工作，你还得自己监听 keydown，处理 Enter 和空格。直接用 &lt;button&gt; 更简单。',
      },
      pkey: 'accessibility|三个“按钮”',
    }),
    warn('“没有 ARIA 好过错误的 ARIA。”（WAI-ARIA 编写实践指南）写下 <code>role="button"</code>，就是承诺你会实现按钮的全部键盘行为。做不到，就不要写。先找合适的原生元素：<code>&lt;button&gt;</code>、<code>&lt;a href&gt;</code>、<code>&lt;input&gt;</code>、<code>&lt;select&gt;</code>、<code>&lt;dialog&gt;</code>、<code>&lt;details&gt;</code>。'),
    table(['需求', '用这个', '不要用这个'], [
      ['执行一个操作', '<code>&lt;button type="button"&gt;</code>', '<code>&lt;div onClick&gt;</code>、<code>&lt;a href="#"&gt;</code>'],
      ['跳到另一个页面', '<code>&lt;a href="/cart"&gt;</code>（或路由的 Link）', '<code>&lt;button onClick={() =&gt; navigate()}&gt;</code>'],
      ['页面结构', '<code>&lt;header&gt;</code> <code>&lt;nav&gt;</code> <code>&lt;main&gt;</code> <code>&lt;h1&gt;</code>…<code>&lt;h6&gt;</code>', '全部用 div，靠字号区分标题'],
      ['图片', '<code>&lt;img alt="商品正面照"&gt;</code>；装饰图用 <code>alt=""</code>', '不写 alt'],
    ]),

    h('可访问名称：每个控件都要有名字'),
    p('读屏软件读到一个控件时，会读出它的<b>可访问名称</b>。名字的来源有优先顺序：'),
    ul([
      '<code>aria-labelledby</code>：指向页面上另一个元素的 id，用那个元素的文字。',
      '<code>aria-label</code>：直接写一段文字。只给读屏软件，页面上看不到。',
      '<code>&lt;label&gt;</code>：表单字段的标签。',
      '元素自己的文字内容，例如 <code>&lt;button&gt;保存&lt;/button&gt;</code>。',
    ]),
    p('只有图标的按钮最容易漏掉名字。例如 <code>&lt;button aria-label="关闭"&gt;×&lt;/button&gt;</code>。不加 aria-label，读屏软件只能读出“乘号，按钮”。'),

    h('表单：label、useId 与错误提示'),
    p('每个输入框都要有一个关联的 <code>&lt;label&gt;</code>。关联后，点击标签文字也能聚焦输入框。读屏软件进入输入框时会读出标签。'),
    p('关联方法：<code>&lt;label htmlFor={id}&gt;</code> 指向 <code>&lt;input id={id}&gt;</code>。id 要在整个页面唯一。组件可能被渲染多次，所以不要写死 id。用 <code>useId</code> 生成（在“DOM 逃生舱”一课学过）。'),
    play(`
import { useState, useId } from 'react';

function EmailField() {
  const [value, setValue] = useState('');
  const id = useId();
  const invalid = value !== '' && !value.includes('@');
  return (
    <div style={{ marginBottom: 12 }}>
      <label htmlFor={id}>邮箱</label>{' '}
      <input
        id={id}
        value={value}
        onChange={e => setValue(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={id + '-hint ' + id + '-err'}
      />
      <div id={id + '-hint'} style={{ fontSize: 13, color: '#666' }}>我们只用它发送收据。</div>
      <div id={id + '-err'} style={{ fontSize: 13, color: '#c00' }}>
        {invalid ? '邮箱需要包含 @' : ''}
      </div>
    </div>
  );
}

function App() {
  return (
    <form>
      <EmailField />
      <EmailField />
      <button type="button" onClick={e => {
        e.currentTarget.form.querySelectorAll('input').forEach(i => console.log(i.id, '→', i.labels[0].textContent));
      }}>打印 id</button>
    </form>
  );
}`, 'label、useId 与 aria-describedby', '点击“邮箱”两个字，对应的输入框会获得焦点。两个字段的 id 不同，所以不会冲突。aria-describedby 把提示和错误文字关联到输入框，读屏软件会在名字之后读出它们。'),
    tip('错误提示三件套：<code>aria-invalid</code> 标记“值不合法”；<code>aria-describedby</code> 关联错误文字；错误文字要写清楚怎样改。只用红色边框不够，色盲用户和读屏用户都看不到颜色。'),

    h('键盘与焦点顺序'),
    p('只用键盘的用户靠 Tab 在可聚焦元素之间移动。焦点的顺序就是 DOM 的顺序。'),
    ul([
      '保持 DOM 顺序和视觉顺序一致。不要用 CSS 把元素“搬”到别的位置。',
      '不要用正数 <code>tabIndex</code>（例如 tabIndex={3}）。它会打乱顺序。只用 <code>0</code>（加入 Tab 顺序）和 <code>-1</code>（只能用代码聚焦）。',
      '不要删除焦点轮廓（<code>outline: none</code>）。要改样式，就用 <code>:focus-visible</code> 换一个同样明显的样式。',
      '用 <code>onClick</code> 而不是 <code>onMouseDown</code>。按钮的 onClick 也会响应键盘。',
    ]),

    h('焦点管理：打开和关闭弹窗'),
    p('界面大幅变化时，你要决定焦点去哪里。弹窗（对话框）是最常见的例子。WAI-ARIA 编写实践指南规定了四条规则：'),
    ({ t: 'call', kind: 'tip', label: '四条规则', html: `<ol class="task-steps"><li>打开时：把焦点移进弹窗。</li><li>打开期间：Tab 只在弹窗内循环。</li><li>按 Esc：关闭弹窗。</li><li>关闭后：把焦点还给打开它的按钮。</li></ol>` }),
    p('原生 <code>&lt;dialog&gt;</code> 元素配合 <code>showModal()</code>，能替你完成大部分工作：'),
    ul([
      '打开时，把焦点移到弹窗里第一个可聚焦元素。',
      '背后的页面变成“惰性”（inert）：不能聚焦，也不能点击。所以 Tab 不会跑到背后的页面上。焦点可能跳到浏览器地址栏，这是允许的。',
      '按 Esc 关闭弹窗，并触发 close 事件。',
    ]),
    p('为了在所有浏览器中都可靠，我们在 close 事件里自己把焦点还给触发按钮。'),
    play(`
import { useRef, useState, useId } from 'react';

function App() {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const titleId = useId();
  const [result, setResult] = useState('（还没有操作）');

  function open() {
    dialogRef.current.showModal(); // 浏览器把焦点移到弹窗里第一个可聚焦元素
  }
  function close(answer) {
    setResult(answer);
    dialogRef.current.close(); // 会触发 close 事件
  }
  function handleClose() {
    // 无论是按钮关闭还是按 Esc 关闭，都把焦点还给触发按钮
    triggerRef.current.focus();
    console.log('焦点现在在：', document.activeElement.textContent);
  }

  return (
    <div>
      <button ref={triggerRef} onClick={open}>删除文件…</button>
      <p>结果：{result}</p>
      <dialog ref={dialogRef} aria-labelledby={titleId} onClose={handleClose}
        style={{ border: '1px solid #888', borderRadius: 8, padding: 16 }}>
        <h3 id={titleId} style={{ marginTop: 0 }}>确定删除“报告.pdf”？</h3>
        <p>删除后不能恢复。</p>
        {/* 破坏性操作：把“取消”放在前面，让它先获得焦点 */}
        <button onClick={() => close('已取消')}>取消</button>{' '}
        <button onClick={() => close('已删除')}>删除</button>
      </dialog>
    </div>
  );
}`, '弹窗的焦点管理', '只用键盘试一试：Tab 到按钮，按 Enter 打开。焦点在“取消”上。多按几次 Tab，焦点不会落到背后的页面上。按 Esc 关闭后，焦点回到“删除文件…”。'),
    deep('不能用 &lt;dialog&gt; 时（例如要兼容很旧的浏览器），就用 Portal 渲染一个 <code>role="dialog"</code> 加 <code>aria-modal="true"</code> 的 div。这时四条规则全要自己写：在 effect 中聚焦；监听 keydown 实现 Tab 循环和 Esc；打开前用 ref 记住 <code>document.activeElement</code>，关闭时还给它。这正是 Radix、React Aria 等无样式组件库替你做的事。'),

    h('异步消息：让读屏软件“听到”变化'),
    p('“已保存”这类消息出现时，焦点没有移动。读屏软件不会主动去读它。解决方法是<b>实时区域</b>（live region）：里面的内容一变化，读屏软件就会读出来。'),
    ul([
      '<code>role="status"</code>（等于 <code>aria-live="polite"</code>）：等用户停下来再读。用于“已保存”“找到 12 条结果”。',
      '<code>role="alert"</code>（等于 <code>aria-live="assertive"</code>）：立刻打断并读出。只用于错误和紧急消息。',
    ]),
    play(`
import { useState } from 'react';

function App() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  function save(ok) {
    setError('');
    setStatus('保存中…');
    setTimeout(() => {
      if (ok) setStatus('已保存');
      else { setStatus(''); setError('保存失败：网络已断开，请重试。'); }
    }, 800);
  }

  return (
    <div>
      <button onClick={() => save(true)}>保存</button>{' '}
      <button onClick={() => save(false)}>模拟失败</button>
      {/* 两个实时区域一开始就在 DOM 中，只是内容为空 */}
      <p role="status" style={{ minHeight: '1.5em' }}>{status}</p>
      <p role="alert" style={{ minHeight: '1.5em', color: '#c00' }}>{error}</p>
    </div>
  );
}`, '用 role="status" 和 role="alert" 播报消息', '页面上看起来只是文字变了。打开系统自带的读屏软件（Windows 的“讲述人”或 macOS 的 VoiceOver），再点按钮，就能听到播报。'),
    warn('实时区域必须<b>先存在</b>于 DOM 中，再改变它的内容。<code>{saved &amp;&amp; &lt;p role="status"&gt;已保存&lt;/p&gt;}</code> 这种写法会同时挂载区域和内容，很多读屏软件不会读。正确写法：区域一直渲染，只改里面的文字。'),

    h('展开与收起：aria-expanded 和 aria-controls'),
    p('折叠面板、下拉菜单、“显示更多”都属于“展开/收起”控件。WAI-ARIA 编写实践指南的“disclosure 模式”这样要求：'),
    table(['要求', '写法'], [
      ['触发器是按钮', '<code>&lt;button&gt;</code>。Enter 和空格自动可用'],
      ['告诉读屏软件当前状态', '<code>aria-expanded={open}</code>。收起时也要写，值为 false'],
      ['（可选）指出控制哪块内容', '<code>aria-controls={panelId}</code>，指向面板的 id'],
      ['收起时隐藏内容', '<code>hidden</code> 属性，或者不渲染面板'],
    ]),
    p('本课练习就是做一个这样的组件。'),

    h('尊重“减少动画”设置（选读）'),
    p('有些用户在系统设置中打开了“减少动态效果”。大幅移动和闪烁会让他们头晕。用 CSS 媒体查询读取这个设置：'),
    code(`/* CSS：默认有动画；用户要求减少时关掉 */
.drawer { transition: transform 300ms; }
@media (prefers-reduced-motion: reduce) {
  .drawer { transition: none; }
}

// JS：需要在组件里判断时
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;`),

    h('怎样检查（选读）'),
    p('无障碍不能只靠“看起来没问题”。按下面的顺序检查：'),
    ({ t: 'call', kind: 'tip', label: '检查步骤', html: `<ol class="task-steps"><li><b>只用键盘走一遍</b>：拔掉鼠标。用 Tab、Shift+Tab、Enter、空格、Esc 和方向键完成核心流程。每一步都要能看见焦点在哪里。</li><li><b>自动检查</b>：用 axe DevTools 浏览器插件或 Chrome Lighthouse 的“无障碍”评分。在编辑器里用 <code>eslint-plugin-jsx-a11y</code>。自动工具只能发现一部分问题。</li><li><b>用读屏软件听一遍</b>：macOS 用 VoiceOver（⌘+F5），Windows 用 NVDA 或“讲述人”。检查每个控件的角色、名字和状态。</li><li><b>写测试</b>：用 Testing Library 的 <code>getByRole</code>。</li></ol>` }),
    p('第 4 步和“测试”一课直接相关。<code>getByRole(\'button\', { name: \'保存\' })</code> 按<b>角色</b>和<b>可访问名称</b>查找元素，和读屏软件的方式一样。所以：'),
    ul([
      '<code>&lt;div onClick&gt;</code> 没有 button 角色，<code>getByRole(\'button\')</code> 找不到它。测试失败，正好暴露了无障碍问题。',
      '没有 label 的输入框，<code>getByRole(\'textbox\', { name: \'邮箱\' })</code> 也找不到它。',
      '你可以断言状态：<code>expect(btn).toHaveAttribute(\'aria-expanded\', \'true\')</code>。',
    ]),
    tip('一句话总结：先选对原生元素；每个控件都有名字；键盘能做鼠标能做的事；焦点不丢失；变化能被读出来。'),
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
      explain: 'role 只改变读屏软件读出的角色，不添加任何行为。div 默认不能聚焦，也不会把 Enter 和空格转成 click。直接改成 &lt;button type="button"&gt; 就全都解决了。第一个选项是最常见的误解：写了 role="button" 等于承诺实现按钮的全部键盘行为，但浏览器不会替你实现。读屏软件能读出“保存”，所以第三个选项不对。',
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
      explain: '读屏软件监听的是“已有实时区域的内容变化”。正确写法是让 &lt;p role="status"&gt; 一直渲染，只改里面的文字。改成 alert 会打断用户，只适合错误消息。aria-live="off" 会关掉播报。',
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
      explain: '获得焦点的元素被移除后，焦点通常落到 body。键盘用户会“迷路”。按照 WAI-ARIA 编写实践指南，关闭后要把焦点还给触发按钮。打开前可以用 ref 记住它。“自动回到触发按钮”是最常见的误解：原生 &lt;dialog&gt; 的部分浏览器会这样做，但自己用 div 写的弹窗不会。',
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
    test: async (t) => {
      const ITEMS = [['配送说明', '48 小时'], ['退货政策', '7 天']];
      const findTrigger = (title) => {
        const btn = t.qa('button').find(b => b.textContent.includes(title));
        if (btn) return btn;
        const other = t.qa('*').filter(e => e.textContent.includes(title)).pop();
        t.assert(false, '没有找到包含“' + title + '”的 <button>。' + (other ? '你用的是 <' + other.tagName.toLowerCase() + '>。' : '') + '触发器要用真正的 <button>，这样 Tab、Enter 和空格才能自动工作。');
      };
      const isShown = (panel, text) => !!panel && !panel.hidden && panel.getClientRects().length > 0 && panel.textContent.includes(text);
      const isHidden = (panel) => !panel || panel.hidden || panel.getClientRects().length === 0;
      const panelOf = (btn) => {
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
});
