import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/delivery.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 ```jsx play 代码块。
// 字段说明见 course/types.ts；写法和注意事项见 AGENTS.md。
export default {
  id: 'delivery',
  stage: 4,
  title: '交付：构建、部署与升级',
  mins: 10,
  summary: '【待写】一句话说明这一课学什么。',
  goals: ['【待写】能写出……', '【待写】能解释……', '【待写】能诊断……'],
  keyPoints: ['【待写】要点 1', '【待写】要点 2', '【待写】要点 3', '【待写】要点 4'],
  quiz: [
    {
      q: '【待写】随堂测验第 1 题',
      options: ['【待写】选项 A', '【待写】选项 B', '【待写】选项 C'],
      answer: 0,
      explain: '【待写】说明为什么对，并点出最迷惑的错误项错在哪。',
    },
  ],
  exercise: {
    task: '<ol class="task-steps"><li>【待写】把 <code>App</code> 改成显示 <code>&lt;h1 id="title"&gt;</code>，内容是“你好”。</li></ol>',
    starter: 'function App() {\n  return null;\n}\n',
    solution: 'function App() {\n  return <h1 id="title">你好</h1>;\n}\n',
    hint: '【待写】提示：返回一个 h1 元素。',
    faded: 'function App() {\n  /* ✏️ 返回一个 id 为 title 的 h1，内容是“你好” */\n}\n',
    test: async t => {
      // 检查行为，不查字面：见 AGENTS.md「练习检查」
      t.assert(t.q('#title'), '找不到 id 为 title 的元素');
      t.assert(t.text('#title') === '你好', 'h1 的内容应该是“你好”，现在是“' + t.text('#title') + '”');
    },
  },
  // 阶段测验专用的读代码题。下标是复习卡片键 课id#cN 的 N：以后只能在末尾追加，不能调换、删除
  checkOnly: [
    {
      q: '【待写】阶段测验读代码题 1',
      options: ['【待写】选项 A', '【待写】选项 B', '【待写】选项 C'],
      answer: 0,
      explain: '【待写】解析',
    },
  ],
  plays: {
    第一个示例: {
      note: '【待写】运行后再看的说明（有预测题时，预测之前不显示）。',
      predict: {
        q: '【待写】预测题：运行后会显示什么？',
        options: ['【待写】选项 A', '【待写】选项 B'],
        answer: 0,
        explain: '【待写】解析',
      },
      pkey: 'delivery|第一个示例',
    },
  },
} satisfies Lesson;
