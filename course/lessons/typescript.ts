import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/typescript.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'typescript',
  stage: 4,
  title: 'TypeScript + React',
  mins: 36,
  summary: '给组件、状态、事件和 Hook 加上类型，让编辑器替你找 bug。',
  goals: [
    '能写出 props 的类型：必填、可选（?）和字面量联合类型',
    '能判断 useState 什么时候要手写类型（例如 User | null），并给事件和 ref 标注类型',
    '能读懂并写出泛型列表组件，并给 reducer、Context 和自定义 Hook 写类型',
    '能指出 any 和“联合类型里混进 string”为什么让检查失效，并用 unknown 加类型守卫检查外部数据',
  ],
  keyPoints: [
    '问题：JavaScript 只在运行时出错。TypeScript 在你写代码时检查 props、字段名和 null，编辑器立即标红。',
    "props 用 <code>type</code> 或 <code>interface</code> 描述。<code>?</code> 表示可选，<code>'a' | 'b'</code> 只允许这几个值。",
    '能推断就不手写。初始值说明不了全部类型时才写，例如 <code>useState&lt;User | null&gt;(null)</code>。',
    '最常见的坑：写 <code>any</code>，或在联合类型里加 <code>| string</code>。代码照样能运行，但类型检查已经失效。',
    '类型在运行前就被擦掉：本课程的运行环境只去掉类型、不检查类型，真正的报错要在编辑器或 <code>tsc</code> 里看。来自外部的数据，用 <code>unknown</code> 加类型守卫在运行时检查。',
  ],
  quiz: [
    {
      q: 'const [user, setUser] = useState(null) 之后想存入用户对象，应该怎么写类型？',
      options: ['useState<any>(null)', 'useState<User | null>(null)', 'useState<User>(null)', '不用写，TypeScript 会从后面的 setUser 调用推断'],
      answer: 1,
      explain:
        'TypeScript 只看初始值。初始值 null 推断不出以后会存 User，所以要写出联合类型 User | null。最有迷惑性的是 <code>useState&lt;User&gt;(null)</code>：开启 <code>strict</code>（TypeScript 的严格检查）后，null 不能赋给 User，会报错；它也隐瞒了“可能还没有用户”这件事。any 能通过编译，但关掉了检查。',
    },
    {
      q: 'Card 的 children 有时是一段文字，有时是 <code>&lt;img&gt;</code>，有时是 null。children 的类型写哪个？',
      options: ['string', 'React.JSX.Element', 'React.ReactNode', 'React.ReactElement[]'],
      answer: 2,
      explain:
        'ReactNode 包括元素、字符串、数字、数组、null 等所有可渲染的内容。最常见的误解是 React.JSX.Element：它只表示一个 JSX 元素，传入文字或 null 都会报错（React 19 的类型里要写 <code>React.JSX.Element</code>，旧教程写 <code>JSX.Element</code>）。string 不接受元素，ReactElement[] 不接受单个元素和文字。',
    },
    {
      q: "类型是 <code>variant?: 'primary' | 'ghost'</code>。下面哪个用法会被编辑器标红？",
      options: [
        '&lt;Button label="确定" /&gt;',
        '&lt;Button label="确定" variant="ghost" /&gt;',
        '&lt;Button label="确定" variant="danger" /&gt;',
        '&lt;Button label="确定" variant={undefined} /&gt;',
      ],
      answer: 2,
      explain:
        '联合类型只允许列出的值，"danger" 不在其中。? 表示可选，所以不传、或传 undefined 都可以。很多人以为“可选”就是“随便传什么都行”，其实可选只放宽了“传不传”，没有放宽“传什么”。',
    },
    {
      q: `<code>createContext&lt;Theme | null&gt;(null)</code> 创建了 ThemeContext。组件里直接 <code>const theme = useContext(ThemeContext); theme.mode</code> 会怎样？`,
      options: ['没有问题：Context 一定有值', '开启 strict 后 TypeScript 报错：theme 可能是 null', '运行时报错，但编译通过', '报错：createContext 不能写泛型'],
      answer: 1,
      explain:
        'useContext 返回的类型是 Theme | null。开启 strict 后，读 theme.mode 前必须先排除 null。常见做法是写一个 useTheme()：里面判断 null 并抛错，返回已收窄的 Theme，所有使用方就不用再判断。“运行时才报错”是没开 strict 时的情况：编译能过，但 Provider 漏写时会读到 null。',
    },
  ],
  exercise: {
    task: "<ol class=\"task-steps\"><li>定义 <code>BadgeProps</code> 类型：<code>label: string</code>；可选的 <code>tone?: 'info' | 'success'</code>。</li><li>在 <code>Badge</code> 的参数上标注 <code>: BadgeProps</code>。tone 的默认值为 <code>'info'</code>。</li><li>渲染 <code>&lt;span className={'badge ' + tone}&gt;{label}&lt;/span&gt;</code>。App 已经写好。</li></ol>",
    starter: `// 在这里定义 BadgeProps

function Badge(props) {
  return <span>?</span>;
}

function App() {
  return (
    <p>
      <Badge label="新功能" />
      <Badge label="已上线" tone="success" />
    </p>
  );
}`,
    solution: `type BadgeProps = {
  label: string;
  tone?: 'info' | 'success';
};

function Badge({ label, tone = 'info' }: BadgeProps) {
  return <span className={'badge ' + tone}>{label}</span>;
}

function App() {
  return (
    <p>
      <Badge label="新功能" />
      <Badge label="已上线" tone="success" />
    </p>
  );
}`,
    hint: '先写类型，再用它：<code>type BadgeProps = { … }</code> 里有两个字段，哪个字段名后面要加 <code>?</code>？联合类型用 <code>|</code> 连接两个字符串字面量。然后在参数解构后面写 <code>: BadgeProps</code>，并给 tone 一个默认值。',
    faded: `type BadgeProps = {
  /* ✏️ label：必填，类型是字符串 */
  /* ✏️ tone：可选（用 ?），只能是 'info' 或 'success' 两个字面量之一 */
};

function Badge(/* ✏️ 解构 label 和 tone（默认 'info'），并标注类型 BadgeProps */) {
  return <span className={'badge ' + tone}>{label}</span>;
}

function App() {
  return (
    <p>
      <Badge label="新功能" />
      <Badge label="已上线" tone="success" />
    </p>
  );
}`,
    test: async t => {
      // 本课程的运行环境不做类型检查，所以这里读语法树，检查类型本身写得对不对
      let ast: any;
      try {
        ast = Babel.transform(t.source, {
          filename: 'App.tsx',
          ast: true,
          code: false,
          configFile: false,
          babelrc: false,
          parserOpts: { plugins: ['typescript', 'jsx'] },
        }).ast;
      } catch (e) {
        t.assert(false, '代码无法解析：' + e.message);
      }
      const decls: Record<string, any> = {};
      const funcs: Record<string, any> = {};
      for (let n of ast.program.body) {
        if (/^Export/.test(n.type) && n.declaration) n = n.declaration;
        if (n.type === 'TSTypeAliasDeclaration') decls[n.id.name] = n.typeAnnotation;
        if (n.type === 'TSInterfaceDeclaration') decls[n.id.name] = { type: 'TSTypeLiteral', members: n.body.body };
        if (n.type === 'FunctionDeclaration' && n.id) funcs[n.id.name] = n;
        if (n.type === 'VariableDeclaration')
          n.declarations.forEach(d => {
            if (d.id.name) funcs[d.id.name] = d;
          });
      }
      // 把 type Tone = … 这样的别名展开，最多展开 5 层
      const resolve = (x, k = 0) => {
        while (x && x.type === 'TSParenthesizedType') x = x.typeAnnotation;
        if (x && x.type === 'TSTypeReference' && x.typeName.type === 'Identifier' && decls[x.typeName.name] && k < 5)
          return resolve(decls[x.typeName.name], k + 1);
        // Readonly<{ … }> 只让字段只读，不改变字段本身，取出里面的类型继续检查
        const tp = x && x.type === 'TSTypeReference' && (x.typeParameters || x.typeArguments);
        const tn = x && x.type === 'TSTypeReference' && (x.typeName.name || (x.typeName.right && x.typeName.right.name));
        if (tp && tn === 'Readonly' && tp.params.length === 1 && k < 5) return resolve(tp.params[0], k + 1);
        return x;
      };
      const srcOf = x => t.source.slice(x.start, x.end).replace(/\s+/g, ' ');
      t.assert(decls.BadgeProps, '请定义 BadgeProps 类型：type BadgeProps = { … } 或 interface BadgeProps { … }（步骤 1）');
      const shape = resolve(decls.BadgeProps);
      t.assert(shape && shape.type === 'TSTypeLiteral', 'BadgeProps 应该是一个对象类型，写成 { label: …; tone?: … }（步骤 1）');
      const member = name => shape.members.find(m => m.type === 'TSPropertySignature' && (m.key.name === name || m.key.value === name));
      const label = member('label');
      t.assert(label && label.typeAnnotation, 'BadgeProps 里缺少 label 字段，或者它没有写类型（步骤 1）');
      const lt = resolve(label.typeAnnotation.typeAnnotation);
      t.assert(
        lt.type !== 'TSAnyKeyword' && lt.type !== 'TSUnknownKeyword',
        'label 的类型写成了 ' + srcOf(label.typeAnnotation.typeAnnotation) + '。any 等于关掉了检查：传数字、传对象都不会报错。请写成 string',
      );
      t.assert(lt.type === 'TSStringKeyword', 'label 的类型应为 string，现在是 ' + srcOf(label.typeAnnotation.typeAnnotation) + '（步骤 1）');
      t.assert(!label.optional, 'label 是必填的，不要加 ?。每个 Badge 都必须有文字');
      const tone = member('tone');
      t.assert(tone && tone.typeAnnotation, 'BadgeProps 里缺少 tone 字段，或者它没有写类型（步骤 1）');
      t.assert(tone.optional, 'tone 应该是可选的：写成 tone?:。第一个 Badge 没有传 tone，不加 ? 编辑器会报错');
      const tt = resolve(tone.typeAnnotation.typeAnnotation);
      // 可选属性本来就可能是 undefined，所以 | undefined 不算多出来的值
      const parts = (tt.type === 'TSUnionType' ? tt.types.map(x => resolve(x)) : [tt]).filter(x => x.type !== 'TSUndefinedKeyword');
      const bad = parts.find(x => !(x.type === 'TSLiteralType' && x.literal.type === 'StringLiteral'));
      t.assert(
        !bad || (bad.type !== 'TSStringKeyword' && bad.type !== 'TSAnyKeyword'),
        'tone 的类型里有 ' + (bad && srcOf(bad)) + "，它允许任意字符串，联合类型就失去了作用：tone=\"danger\" 也不会报错。只保留 'info' | 'success'",
      );
      const lits = bad
        ? ''
        : parts
            .map(x => x.literal.value)
            .sort()
            .join();
      t.assert(lits === 'info,success', "tone 的类型应只允许 'info' 和 'success' 两个值，现在是 " + srcOf(tone.typeAnnotation.typeAnnotation) + '（步骤 1）');
      const fn = funcs.Badge;
      t.assert(fn, '找不到 Badge 组件。不要改它的名字');
      const f = fn.type === 'VariableDeclarator' ? fn.init : fn;
      const annos = [fn.id && fn.id.typeAnnotation, f && f.params && f.params[0] && f.params[0].typeAnnotation].filter(Boolean);
      t.assert(
        annos.some(a => /\bBadgeProps\b/.test(srcOf(a))),
        "请在 Badge 的参数上标注类型：function Badge({ label, tone = 'info' }: BadgeProps)（步骤 2）",
      );
      const b = t.qa('span.badge');
      t.assert(b.length === 2, `应渲染 2 个 className 含 badge 的 span，实际 ${b.length} 个`);
      t.assert(b[0].classList.contains('info') && b[0].textContent === '新功能', '第一个 Badge 应为 info 样式，文字“新功能”（tone 默认值是 info）');
      t.assert(b[1].classList.contains('success') && b[1].textContent === '已上线', '第二个 Badge 应为 success 样式，文字“已上线”');
    },
  },
  checkOnly: [
    {
      q: `TypeScript 会在哪一行报错？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">type State =
  | { status: 'loading' }
  | { status: 'ok'; data: string[] }
  | { status: 'error'; error: string };

function View({ s }: { s: State }) {
  if (s.status === 'loading') return &lt;Spinner /&gt;;  // 第 7 行
  return &lt;ul&gt;{s.data.map(d =&gt; &lt;li key={d}&gt;{d}&lt;/li&gt;)}&lt;/ul&gt;; // 第 8 行
}</code></pre></div>`,
      options: ['第 7 行：s 上没有 status', '第 8 行：s 还可能是 error 状态，它没有 data', '第 1 行：联合类型不能包含对象', '不报错'],
      answer: 1,
      explain:
        "第 7 行排除了 loading。到第 8 行，s 仍可能是 ok 或 error。error 没有 data 字段，所以 TypeScript 报错。这正是可辨识联合的价值：漏处理的状态在编译时就会被发现。加上 <code>if (s.status === 'error') return …</code> 即可。",
    },
    {
      q: `<code>const [n, setN] = useState(0)</code>。下面的事件处理函数有什么问题？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;input
  type="number"
  onChange={(e: React.ChangeEvent&lt;HTMLInputElement&gt;) =&gt;
    setN(e.target.value)}
/&gt;</code></pre></div>`,
      options: [
        '没有问题：type="number" 的 value 是数字',
        'TypeScript 报错：e.target.value 是 string，不能传给 number 类型的 setN',
        'e 的类型应该写 MouseEvent',
        '运行时报错，编译通过',
      ],
      answer: 1,
      explain:
        'useState(0) 推断出 n 是 number。输入框的 value 永远是字符串，即使 type="number"。所以 TypeScript 在编译时报错。修复：<code>setN(Number(e.target.value))</code>，或者用 <code>e.target.valueAsNumber</code>。',
    },
    {
      q: `TypeScript 会怎样处理最后一行？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function List&lt;T&gt;({ items, render }: {
  items: T[];
  render: (item: T) =&gt; React.ReactNode;
}) {
  return &lt;ul&gt;{items.map((it, i) =&gt; &lt;li key={i}&gt;{render(it)}&lt;/li&gt;)}&lt;/ul&gt;;
}

&lt;List items={[1, 2]} render={u =&gt; u.name} /&gt;</code></pre></div>`,
      options: ['不报错：u 的类型是 any', '报错：number 上没有 name', '报错：必须写成 <List<number> …>', '编译通过，运行时报错'],
      answer: 1,
      explain:
        'TypeScript 先从 items 推断出 T 是 number，再用 T 给 render 的参数定类型。所以 u 是 number，读 <code>u.name</code> 报错。这正是泛型组件的价值：同一个组件能适配任何数据，但数据和回调的类型必须一致。“u 是 any”不对：u 的类型由上下文推断出来，不是 any。泛型参数也不需要手写，能推断时可以省略。',
    },
    {
      q: `这个自定义 Hook 返回一个数组。使用方写 <code>const [on, toggle] = useToggle();</code> 然后 <code>toggle()</code>，TypeScript 会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function useToggle() {
  const [on, setOn] = useState(false);
  const toggle = () =&gt; setOn(v =&gt; !v);
  return [on, toggle];
}</code></pre></div>`,
      options: [
        '没有问题：on 是 boolean，toggle 是函数',
        '报错：返回值被推断为 (boolean | (() => void))[]，toggle 可能是 boolean，不能调用',
        '报错：Hook 不能返回数组',
        '运行时报错，编译通过',
      ],
      answer: 1,
      explain:
        '不加 as const 时，数组字面量被推断成元素类型的联合数组，每一项都可能是 boolean 或函数。写 <code>return [on, toggle] as const;</code> 才得到元组 readonly [boolean, () => void]，位置和类型一一对应。',
    },
    {
      q: `项目使用 @types/react 19。下面的代码会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function Form() {
  const inputRef = useRef();
  return &lt;input ref={inputRef} /&gt;;
}</code></pre></div>`,
      options: [
        '不报错：useRef 的参数可以省略',
        'TypeScript 报错：ref 属性不能用在 input 上',
        'TypeScript 报错：useRef 需要一个初始值，应写成 useRef<HTMLInputElement>(null)',
        '不报错，但 inputRef.current 的类型是 any',
      ],
      answer: 2,
      explain:
        '@types/react 19 要求 useRef 必须传初始值，不传会报“Expected 1 arguments, but got 0”。绑定 DOM 元素时，写 <code>useRef&lt;HTMLInputElement&gt;(null)</code>，此时 current 的类型是 <code>HTMLInputElement | null</code>，用之前要先判断。“可以省略”是 @types/react 18 的写法，升级类型包以后会报错。',
    },
    {
      q: `下面的代码会怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">function show(x: unknown) {
  return x.name;
}</code></pre></div>`,
      options: [
        'TypeScript 报错：x 的类型是 unknown，要先收窄（例如用 typeof 或类型守卫）才能读属性',
        '不报错：unknown 和 any 一样，可以随便读属性',
        '不报错，但 x 没有 name 时返回 undefined',
        'TypeScript 报错：参数不能写成 unknown',
      ],
      answer: 0,
      explain:
        'unknown 表示“什么值都可能”，所以在检查之前，不允许读它的属性、调用它或把它当成别的类型用。any 才是“随便用”，它会关掉检查。<code>JSON.parse</code> 和 <code>response.json()</code> 都返回 any：先把结果放进 unknown 变量，再用类型守卫检查，才能得到可靠的类型。',
    },
  ],
  plays: {
    '带类型的 Button': {},
    泛型组件: {
      note: '在编辑器中，把鼠标放到 renderItem 的参数 b 上。你会看到它的类型是 Book。',
    },
    类型在运行时不存在: {
      pkey: 'typescript|类型在运行时不存在',
      predict: {
        q: '“传错了”那一行有两处类型错误（<code>level="danger"</code> 和 <code>count={\'1\'}</code>）。运行后它显示什么？',
        options: ['页面报错，什么都不显示：类型错误会阻止运行', '“传错了 ×2”，蓝色', '“传错了 ×11”，蓝色', '“传错了 ×11”，红色'],
        answer: 2,
        explain:
          "类型在运行前就被擦掉了，浏览器看到的是普通 JavaScript。<code>level</code> 不是 'warn'，所以走蓝色分支。<code>count</code> 实际是字符串 '1'，<code>'1' + 1</code> 是字符串拼接，得到 '11'。TypeScript 不会转换数据，也不会拦住运行，它只在你写代码时标红。第一行的 level 是 warn、count 是数字 1，显示红色的“×2”。",
      },
      note: '类型错误只在编辑器和 <code>tsc</code> 里出现。如果数据来自网络或用户输入，类型帮不上忙，要在运行时检查，见后面的“unknown：先检查，再使用”。',
    },
    'unknown：先检查，再使用': {
      pkey: 'typescript|unknown：先检查，再使用',
      predict: {
        q: '5 条输入里，有几条能通过 <code>isUser</code> 的检查，显示出名字？',
        options: ['1 条', '2 条', '3 条', '4 条'],
        answer: 1,
        explain:
          "第 1 条和第 4 条通过。第 2 条的 id 是字符串 '2'，不是数字；第 3 条是数组，没有 id 和 name；第 5 条不是 JSON，<code>JSON.parse</code> 抛错，被 catch 接住。第 4 条多了一个 admin 字段，但检查只关心 id 和 name，所以通过。这个检查在运行时执行，才是真正的保险；而 <code>JSON.parse(raw) as User</code> 只是对编译器的保证。",
      },
      note: '类型守卫 <code>x is User</code> 告诉编译器：函数返回 true 时，x 就是 User。守卫里的检查写得不对，编译器也发现不了，所以要认真写。',
    },
  },
} satisfies Lesson;
