import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/styling.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
// 字段说明见 course/types.ts；写法和注意事项见 AGENTS.md。

// 练习用：把 className 拆成类名数组
const tokens = (el: Element) => el.className.trim().split(/\s+/).filter(Boolean);

export default {
  id: 'styling',
  stage: 0,
  title: '样式：给组件穿上外观',
  mins: 38,
  summary: '用 className 和 style 让 state 决定外观，并知道项目里样式写在哪里、怎样选。',
  goals: [
    '能写出条件类名，并避免 false、undefined 混进类名字符串',
    '能写出正确的内联 style 对象（驼峰、数字加 px、无单位属性），并判断什么时候该用它',
    '能解释两个同名类谁覆盖谁：由样式表里的先后决定，和 class 属性里的顺序无关',
    '能说出 CSS Modules、原子类和 CSS-in-JS 各自解决什么问题，并按项目情况选择',
  ],
  keyPoints: [
    'JSX 里用 <code>className</code>，值是字符串；<code>style</code> 的值是对象，属性名用驼峰，数字默认加 <code>px</code>。',
    "条件类名不要手拼字符串：<code>false</code> 和 <code>undefined</code> 会变成文字。用 <code>filter(Boolean).join(' ')</code> 的小函数。",
    '固定的外观写进样式表，随数据变化的值（进度、坐标、用户选色）才用内联 <code>style</code> 或 CSS 变量。',
    '优先级相同的同名属性，样式表里写在后面的规则生效；内联 <code>style</code> 比类选择器优先。',
    'CSS Modules 在构建时把类名改成唯一名字；原子类用小类组合；运行时 CSS-in-JS 在渲染时生成样式，不能用在服务端组件里。',
  ],
  quiz: [
    {
      q: "<code>&lt;li className={done ? 'done' : undefined}&gt;</code>，<code>done</code> 为 <code>false</code> 时，DOM 里这个 li 会怎样？",
      options: ['没有 class 属性', '有 class="undefined"', '有 class=""（空字符串）', '报错：className 不能是 undefined'],
      answer: 0,
      explain:
        'React 不会为 <code>undefined</code>（和 <code>null</code>）的属性值写出属性，所以 li 上没有 class。最迷惑的是第二项：那是把 <code>undefined</code> 拼进字符串才会出现的结果，直接传给 <code>className</code> 不会。',
    },
    {
      q: '要把一个元素的背景色设成红色，哪种写法是对的？',
      options: ['style="background-color: red"', "style={{ background-color: 'red' }}", "style={{ backgroundColor: 'red' }}", "style={backgroundColor: 'red'}"],
      answer: 2,
      explain:
        '<code>style</code> 要传对象，所以有两层花括号，属性名用驼峰。第二项的 <code>background-color</code> 在对象里是减法表达式，是语法错误；第一项是 HTML 的写法；第四项少了一层花括号。',
    },
    {
      q: '下面哪种情况最适合用内联 <code>style</code>？',
      options: ['按钮悬停时变色', '所有卡片统一加圆角', '进度条的宽度由 percent 这个 state 决定', '屏幕变窄时把两栏改成一栏'],
      answer: 2,
      explain:
        '值由数据决定、每次渲染都可能不同，是内联 <code>style</code> 的典型场景。悬停要用 <code>:hover</code>，换栏要用 <code>@media</code>，这两个内联样式都写不了；统一的圆角是固定外观，应该放进类。',
    },
    {
      q: '两个组件各有一份 <code>.module.css</code>，里面都定义了 <code>.title</code>，同时用在一个页面上却不会互相覆盖。原因是什么？',
      options: ['浏览器会按文件隔离样式', '构建时把每个类名改成唯一的名字', '后加载的文件自动排在前面', '运行时由 React 给类名加上组件名前缀'],
      answer: 1,
      explain:
        'CSS Modules 是构建工具的功能：<code>styles.title</code> 在构建后是两个不同的字符串，所以选择器也不同。浏览器本身没有按文件隔离样式的机制，React 也不参与这一步。',
    },
    {
      q: 'Tailwind 这类原子类方案，怎样避免“两个文件的类名重名”？',
      options: ['每个组件给类名加上哈希', '运行时检查并改名', '几乎不写自定义类名，而是组合预设的小类', '规定每个类名只能用一次'],
      answer: 2,
      explain:
        '原子类提供一批固定的小类（<code>p-4</code>、<code>font-bold</code>），组件只是组合它们，所以没有自己起的名字可以重名。加哈希是 CSS Modules 的做法；运行时改名是 CSS-in-JS 的做法。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>用 state 记录 <code>#card</code> 是否选中。点击 <code>#toggle</code> 按钮切换：选中时 <code>#card</code> 的类名是 <code>panel selected</code>，未选中时只有 <code>panel</code>（不能混进 <code>false</code>、<code>undefined</code> 之类的文字）。</li><li>用 state 记录进度百分比，初始为 0。<code>#meter</code> 的宽度由内联 <code>style</code> 决定，要等于 <code>.track</code>（宽 200px）的那个百分比。</li><li>每点一次 <code>#more</code>，百分比加 20，最多到 100。</li></ol>',
    starter: `import { useState } from 'react';

function App() {
  return (
    <div>
      <style>{\`
        .panel { border: 2px solid #b7c4ca; padding: 8px; margin-bottom: 8px; }
        .selected { border-color: royalblue; background: #dbeafe; }
        .track { width: 200px; height: 12px; background: #e5e7eb; margin: 8px 0; }
        .fill { height: 12px; background: seagreen; }
      \`}</style>
      <div id="card" className="panel">卡片</div>
      <button id="toggle">选中 / 取消选中</button>
      <div className="track">
        <div id="meter" className="fill" />
      </div>
      <button id="more">+20%</button>
    </div>
  );
}
`,
    solution: `import { useState } from 'react';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function App() {
  const [selected, setSelected] = useState(false);
  const [percent, setPercent] = useState(0);
  return (
    <div>
      <style>{\`
        .panel { border: 2px solid #b7c4ca; padding: 8px; margin-bottom: 8px; }
        .selected { border-color: royalblue; background: #dbeafe; }
        .track { width: 200px; height: 12px; background: #e5e7eb; margin: 8px 0; }
        .fill { height: 12px; background: seagreen; }
      \`}</style>
      <div id="card" className={cx('panel', selected && 'selected')}>卡片</div>
      <button id="toggle" onClick={() => setSelected(!selected)}>选中 / 取消选中</button>
      <div className="track">
        <div id="meter" className="fill" style={{ width: percent + '%' }} />
      </div>
      <button id="more" onClick={() => setPercent(Math.min(100, percent + 20))}>+20%</button>
    </div>
  );
}
`,
    hint: "类名用 <code>cx('panel', selected &amp;&amp; 'selected')</code> 这样的写法；宽度是 <code>style={{ width: percent + '%' }}</code>。数字不带单位会变成 px，不是百分比。",
    faded: `import { useState } from 'react';

function App() {
  /* ✏️ 声明两个 state：是否选中；进度百分比（初始 0） */
  return (
    <div>
      <style>{\`
        .panel { border: 2px solid #b7c4ca; padding: 8px; margin-bottom: 8px; }
        .selected { border-color: royalblue; background: #dbeafe; }
        .track { width: 200px; height: 12px; background: #e5e7eb; margin: 8px 0; }
        .fill { height: 12px; background: seagreen; }
      \`}</style>
      <div id="card" className={/* ✏️ 选中时是 panel selected，否则只有 panel */ 'panel'}>卡片</div>
      <button id="toggle" onClick={() => {}}>选中 / 取消选中</button>
      <div className="track">
        <div id="meter" className="fill" style={/* ✏️ 宽度等于进度百分比 */ {}} />
      </div>
      <button id="more" onClick={() => {}}>+20%</button>
    </div>
  );
}
`,
    test: async t => {
      const card = () => t.q('#card');
      const meter = () => t.q('#meter');
      t.assert(card() && meter() && t.q('#toggle') && t.q('#more'), '页面里应该保留 #card、#meter、#toggle、#more 四个元素');
      const cls = () => tokens(card()).join(' ');
      const bg = () => getComputedStyle(card()).backgroundColor;
      const width = () => meter().getBoundingClientRect().width;
      const near = (a: number, b: number) => Math.abs(a - b) < 1;

      t.assert(cls() === 'panel', '未选中时 #card 的类名应该只有 panel，现在是“' + cls() + '”。拼字符串时 false 或 undefined 会混进类名');
      t.assert(near(width(), 0), '进度初始为 0，#meter 的宽度应该是 0，现在是 ' + width() + 'px。宽度要由内联 style 根据进度这个 state 来决定');
      const bg0 = bg();

      await t.click('#toggle');
      t.assert(cls() === 'panel selected', '点击后 #card 的类名应该是“panel selected”，现在是“' + cls() + '”');
      t.assert(bg() !== bg0, '#card 有了 selected 类，背景色应该变化。检查类名是否真的加到了 #card 上');
      await t.click('#toggle');
      t.assert(cls() === 'panel', '再点一次应该取消选中，类名回到只有 panel，现在是“' + cls() + '”');
      t.assert(bg() === bg0, '取消选中后背景色应该恢复');

      await t.click('#more');
      t.assert(
        near(width(), 40),
        '点一次 +20% 后，#meter 应该是 .track 宽度（200px）的 20%，即 40px，现在是 ' +
          width() +
          "px。内联 style 里的数字会被当作 px，要用百分比就写成字符串，例如 '20%'",
      );
      await t.click('#more');
      await t.click('#more');
      t.assert(near(width(), 120), '点三次后应该是 60%，即 120px，现在是 ' + width() + 'px');
      for (let i = 0; i < 4; i++) await t.click('#more');
      t.assert(near(width(), 200), '百分比最多到 100，宽度最多 200px，现在是 ' + width() + 'px');
    },
  },
  // 阶段测验专用的读代码题。下标是复习卡片键 课id#cN 的 N：以后只能在末尾追加，不能调换、删除
  checkOnly: [
    {
      // biome-ignore lint/suspicious/noTemplateCurlyInString: 题干里展示的是代码
      q: "<code>&lt;div className={`card ${selected &amp;&amp; 'selected'}`}&gt;</code>，<code>selected</code> 是 <code>false</code>。渲染出来的类名是什么？",
      options: ['card', 'card false', 'card selected', 'card undefined'],
      answer: 1,
      explain:
        '模板字符串会把 <code>false</code> 转成文字 "false"，所以类名是 <code>card false</code>。浏览器不报错，但 DOM 里多了一个没人定义的类。要用 <code>filter(Boolean).join(\' \')</code> 这样的小函数。',
    },
    {
      q: '<code>percent</code> 是 40。<code>&lt;div style={{ width: percent }} /&gt;</code> 的宽度是多少？',
      options: ['40%', '40px', '40em', '不生效，必须写成字符串'],
      answer: 1,
      explain:
        "React 给数字值自动加 <code>px</code>，所以是 40px。想要 40% 就写成字符串：<code>width: percent + '%'</code>。最迷惑的是第四项：数字是合法的 style 值，只是单位固定为 px。",
    },
    {
      q: '样式表里先后写了 <code>.size-big { font-size: 24px }</code> 和 <code>.size-small { font-size: 12px }</code>。元素是 <code>className="size-small size-big"</code>，字号是多少？',
      options: [
        '24px，因为 size-big 写在 class 属性的后面',
        '12px，因为 size-small 写在 class 属性的前面',
        '12px，因为 .size-small 在样式表里更靠后',
        '不确定，要看浏览器',
      ],
      answer: 2,
      explain: '两个类的选择器优先级相同，样式表里更靠后的规则生效，所以是 12px。class 属性里的顺序不起作用，这是最常见的误解。',
    },
    {
      q: '想让按钮悬停时变色，同时背景色要根据 state 变化。哪种做法可行？',
      options: [
        "在 style 对象里写 ':hover': { ... }",
        '用类名写 :hover 规则，把 state 决定的颜色通过 CSS 变量传进来',
        '给 style 写一个 hover 属性',
        '在 onMouseEnter 里每次重新设置整个 style 对象',
      ],
      answer: 1,
      explain:
        "内联 <code>style</code> 写不了伪类。可行的做法是：伪类写在样式表里，用 <code>var(--accent)</code> 读取，组件用 <code>style={{ '--accent': color }}</code> 传值。第四项也许能模拟悬停，但事情复杂得多，还丢掉了键盘聚焦等状态。",
    },
  ],
  plays: {
    '类名拼接：false 和 undefined 会混进去': {
      note: '<code>active</code> 为 false 时，<code>&&</code> 的结果是 false，被拼成文字 "false"。三元表达式配空字符串会留下多余的空格。<code>cx</code> 先 <code>filter(Boolean)</code> 去掉假值，再 <code>join</code>，得到干净的 "tab"。',
      predict: {
        q: "“设置”这一项的 <code>active</code> 是 false。用写法 a（<code>'tab ' + (active &amp;&amp; 'tab-on')</code>）得到的类名字符串是什么？",
        options: ['"tab"', '"tab false"', '"tab "（末尾有空格）', '"tab undefined"'],
        answer: 1,
        explain: '<code>false</code> 被转成字符串 "false" 拼在后面。三元写法 b 得到末尾带空格的 "tab "，<code>cx</code> 得到 "tab"。',
      },
      pkey: 'styling|类名拼接：false 和 undefined 会混进去',
    },
    'style 对象：数字什么时候变成 px': {
      note: '宽度 120 变成 120px。但 <code>lineHeight: 2</code> 没有加单位：它表示字号的 2 倍，也就是 40px，所以一行字的盒子高 40px。',
      predict: {
        q: '盒子里只有一行字，样式是 <code>fontSize: 20, lineHeight: 2</code>。盒子的高度是多少？',
        options: ['2px', '20px', '40px', '22px'],
        answer: 2,
        explain: '<code>lineHeight</code> 是无单位属性，数字 2 原样写出，表示字号的 2 倍：20 × 2 = 40px。如果它被当成 2px，一行字的盒子高度就只有 2px。',
      },
      pkey: 'styling|style 对象：数字什么时候变成 px',
    },
    同名类谁覆盖谁: {
      note: '两个类优先级相同，样式表里 <code>.note-blue</code> 写在后面，所以前两段都是蓝色，和 class 属性里的顺序无关。第三段的内联 style 优先级更高，是绿色。',
      predict: {
        q: '第一段 <code>className="note-blue note-red"</code> 的文字是什么颜色？',
        options: ['红色', '蓝色', '红蓝混合', '没有颜色（两个类互相抵消）'],
        answer: 1,
        explain: '样式表里 <code>.note-blue</code> 写在 <code>.note-red</code> 后面，优先级相同，后写的生效。class 属性里的顺序不起作用，所以第二段也是蓝色。',
      },
      pkey: 'styling|同名类谁覆盖谁',
    },
    'CSS Modules：两个 title 互不干扰': {
      note: '两个文件里都叫 title，但改名后一个是 Card_title，另一个是 Page_title，选择器不同，所以互不干扰。真实项目里改名由构建工具完成，名字形如 _title_1agl6_1。',
    },
  },
} satisfies Lesson;
