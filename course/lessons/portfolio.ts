import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/portfolio.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
export default {
  id: 'portfolio',
  stage: 5,
  runtime: 19,
  title: '毕业设计：从练习到作品集',
  mins: 18,
  summary: '在自己的电脑上做三个真正的项目，把这门课学到的一切用起来。本课约 18 分钟读完；三个项目在课外完成，合计约 50–80 小时。',
  goals: [
    '能用 Vite 在本地创建并运行一个 React + TypeScript 项目',
    '能说出三个项目的每条需求要用到哪一课的知识',
    '能用验收清单逐条自查：每一条都通过实际操作来验证',
    '能给核心流程写 3 个测试，并用“故意改坏”确认测试能抓住 bug',
  ],
  keyPoints: [
    '课程的终点是一个能用、已上线、别人能访问的应用。',
    '对照验收清单逐条操作，看到“应该看到”的结果才打勾，不凭感觉。',
    '最容易漏的四种情况：断网、慢网、空数据、只用键盘。',
    '测试要能抓住 bug：故意改坏一处，至少一个测试应该变红。',
    '<code>VITE_</code> 开头的变量会打包进前端，任何人都能看到。密钥放在服务端。',
  ],
  quiz: [
    {
      q: '记账本做完了。下面哪项检查最能说明“出错状态”真的处理好了？',
      options: [
        '代码里每个 fetch 都包了 try/catch，并在 catch 里打印日志',
        '断网后操作出现错误提示；恢复网络后点重试能成功',
        '浏览器控制台里没有任何报错',
        'Lighthouse 性能得分达到 100',
      ],
      answer: 1,
      explain:
        '验收要看用户看到的结果。try/catch 只说明错误被捕获了，不说明用户看到了提示，也不说明能重试。控制台没有报错，可能只是因为错误被悄悄吞掉了。Lighthouse 性能分和出错处理无关。',
    },
    {
      q: '你写了测试“添加‘午饭 25 元’后，列表里出现‘午饭’”。你故意把合计改成少加一项，测试仍然全绿。说明什么？',
      options: [
        '测试运行器坏了，需要重装依赖',
        '断言不够具体：应该断言确切的合计金额',
        '应该改成断言组件内部 total state 的值，这样最准确',
        '应该改用 getByTestId 找元素',
      ],
      answer: 1,
      explain:
        '测试只断言了“午饭出现了”，合计错了它也看不见。要断言用户看到的确切结果，例如“本月支出：¥25.00”。断言内部 state 是最常见的误解：它测的是实现细节，重构时会误报。改用 getByTestId 只改变了找元素的方式，没有改变断言了什么。',
    },
    {
      q: 'TMDB 密钥写在 VITE_TMDB_KEY 里，安全吗？',
      options: [
        '安全：.env 文件写在 .gitignore 里，不会上传到 GitHub',
        '不安全：VITE_ 变量会打包进前端代码',
        '安全：Vite 会在构建时自动加密 VITE_ 开头的变量',
        '只要把 GitHub 仓库设为私有，就是安全的',
      ],
      answer: 1,
      explain:
        'VITE_ 开头的变量会在构建时直接写进 JS 文件，任何人打开开发者工具都能看到。最有迷惑性的是 .gitignore：它只保证密钥不进仓库，但构建出的前端代码里照样有它。需要保密的密钥要放到服务端代理或 serverless 函数里。',
    },
  ],
  checkOnly: [
    {
      q: `记账本这样读取本地数据。先不考虑类型，这行代码有什么问题？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">const [items, setItems] = useState(
  JSON.parse(localStorage.getItem('items')) ?? []
);</code></pre></div>`,
      options: [
        '第一次运行时报错：getItem 返回 null，JSON.parse(null) 会抛出异常',
        '每次渲染都会读取并解析 localStorage；应写成 useState(() => …)',
        'localStorage 里的数据改了，界面也会自动更新',
        '没有问题',
      ],
      answer: 1,
      explain:
        'useState 的参数只在第一次渲染时使用，但表达式每次渲染都会执行。数据多时会浪费时间。传入函数 <code>useState(() =&gt; …)</code>，React 只在第一次调用它。另外，<code>JSON.parse(null)</code> 返回 null，不会报错，所以 <code>?? []</code> 能正常兜底。',
    },
    {
      q: `记账本（Vite + TypeScript）里，item 的类型是 <code>Item</code>，id 是 number。编辑器和 <code>tsc --noEmit</code> 会对这行删除代码怎样？<div class="codeblock faded"><pre style="white-space:pre-wrap"><code style="background:none;color:inherit;padding:0;font-size:inherit">&lt;button onClick={() =&gt;
  setItems(items.filter(i =&gt; i !== item.id))
}&gt;删除&lt;/button&gt;</code></pre></div>`,
      options: ['正常删除这一项', 'TypeScript 编译报错', '把所有记录都删掉', '编译通过，运行时什么都没删，也没有提示'],
      answer: 1,
      explain:
        '<code>i</code> 是 Item 对象，<code>item.id</code> 是数字，两者永远不相等，filter 会保留所有记录。TypeScript 能发现这种比较：类型完全没有重叠时，它报错“This comparison appears to be unintentional”。正确写法：<code>i.id !== item.id</code>。“运行时什么都没删”是纯 JavaScript 项目里会发生的事；用了 TypeScript，这个 bug 在编译时就被拦下了。注意 Vite 的开发服务器不做类型检查，页面照样能跑、什么都删不掉，所以要让编辑器和 CI 运行 tsc。',
    },
  ],
  plays: {},
} satisfies Lesson;
