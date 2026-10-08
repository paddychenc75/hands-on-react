// 新建一课：生成课文 MDX 骨架和数据文件，登记到课程顺序，更新自动收集的注册表和卡片键快照。
//
//   npm run new-lesson -- <课id> --stage <0-5> --after <已有课id> --title "标题"
//   例：npm run new-lesson -- hooks-recap --stage 1 --after custom-hooks --title "Hook 复盘"
//
// 生成的文件里到处是"【待写】"占位：它们能通过 typecheck、check:content 和 build，但要换成真内容才能发布
// （check:content 会提示还剩多少处占位）。
// 插在中间会让后面的课号顺延，脚本会列出写了"第 N 课"且 N 会受影响的位置，请人工核对。
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { LESSON_DIR, ROOT } from './lib/registry-gen.mjs';

const usage = '用法：npm run new-lesson -- <课id> --stage <0-5> --after <已有课id> --title "标题"';
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { stage: { type: 'string' }, after: { type: 'string' }, title: { type: 'string' } },
});
const die = msg => {
  console.error(`✗ ${msg}\n${usage}`);
  process.exit(1);
};

const [id] = positionals;
if (!id) die('缺少课 id');
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) die(`课 id "${id}" 只能用小写字母、数字和连字符，例如 hooks-recap`);
if (positionals.length > 1) die('只能给一个课 id；标题里有空格要加引号');
if (!values.title?.trim()) die('缺少 --title');
const title = values.title.trim();
if (!/^[0-5]$/.test(values.stage ?? '')) die('--stage 必须是 0–5');
const stage = +values.stage;
if (!values.after) die('缺少 --after（新课排在哪一课后面）');

const { LESSON_ORDER } = await import('../course/order.ts');
const { STAGES } = await import('../course/stages.ts');
if (stage >= STAGES.length) die(`--stage 必须小于阶段数 ${STAGES.length}`);
if (fs.existsSync(path.join(LESSON_DIR, id + '.ts')) || fs.existsSync(path.join(ROOT, 'docs/lessons', id + '.mdx')) || LESSON_ORDER.includes(id))
  die(`课 "${id}" 已经存在`);
const afterIdx = LESSON_ORDER.indexOf(values.after);
if (afterIdx < 0) die(`--after "${values.after}" 不是已有的课。已有的课见 course/order.ts`);

// 阶段要和前后相邻的课兼容（同一阶段的课必须连续）
const stageOf = async lessonId => (await import(path.join(LESSON_DIR, lessonId + '.ts'))).default.stage;
const prevStage = await stageOf(LESSON_ORDER[afterIdx]);
const nextStage = LESSON_ORDER[afterIdx + 1] ? await stageOf(LESSON_ORDER[afterIdx + 1]) : STAGES.length - 1;
if (stage < prevStage || stage > nextStage)
  die(
    `--stage ${stage} 放不进这个位置：前一课（${values.after}）在阶段 ${prevStage}，后一课${LESSON_ORDER[afterIdx + 1] ? `（${LESSON_ORDER[afterIdx + 1]}）在阶段 ${nextStage}` : '不存在'}。同一阶段的课要连续排列`,
  );

const TODO = '【待写】';
const q = JSON.stringify;

// ---------- 数据文件 ----------
const data = `import type { Lesson } from '../types.ts';
// 非正文数据。课文在 docs/lessons/${id}.mdx；plays 的键是示例标题（重名或无标题时是 #序号），对应 MDX 里的 \`\`\`jsx play 代码块。
// 字段说明见 course/types.ts；写法和注意事项见 AGENTS.md。
export default {
  id: ${q(id)},
  stage: ${stage},
  title: ${q(title)},
  mins: 10,
  summary: ${q(TODO + '一句话说明这一课学什么。')},
  goals: [
    ${q(TODO + '能写出……')},
    ${q(TODO + '能解释……')},
    ${q(TODO + '能诊断……')},
  ],
  keyPoints: [
    ${q(TODO + '要点 1')},
    ${q(TODO + '要点 2')},
    ${q(TODO + '要点 3')},
    ${q(TODO + '要点 4')},
  ],
  quiz: [
    {
      q: ${q(TODO + '随堂测验第 1 题')},
      options: [${q(TODO + '选项 A')}, ${q(TODO + '选项 B')}, ${q(TODO + '选项 C')}],
      answer: 0,
      explain: ${q(TODO + '说明为什么对，并点出最迷惑的错误项错在哪。')},
    },
  ],
  exercise: {
    task: ${q('<ol class="task-steps"><li>' + TODO + '把 <code>App</code> 改成显示 <code>&lt;h1 id="title"&gt;</code>，内容是“你好”。</li></ol>')},
    starter: ${q(`function App() {\n  return null;\n}\n`)},
    solution: ${q(`function App() {\n  return <h1 id="title">你好</h1>;\n}\n`)},
    hint: ${q(TODO + '提示：返回一个 h1 元素。')},
    faded: ${q(`function App() {\n  /* ✏️ 返回一个 id 为 title 的 h1，内容是“你好” */\n}\n`)},
    test: async (t) => {
      // 检查行为，不查字面：见 AGENTS.md「练习检查」
      t.assert(t.q('#title'), '找不到 id 为 title 的元素');
      t.assert(t.text('#title') === '你好', 'h1 的内容应该是“你好”，现在是“' + t.text('#title') + '”');
    },
  },
  // 变式练习（可选）：2–3 道 3–8 分钟的小任务，练同一概念的不同情境；不影响“本课完成”。
  // 要用时取消注释，并在课文里的 <Exercise /> 后面加一行 <Drills />。字段说明见 AGENTS.md「变式练习」。
  // drills: [
  //   {
  //     title: '换成对象状态',
  //     task: '<ol class="task-steps"><li>…</li></ol>',
  //     starter: 'function App() {\\n  return null;\\n}\\n',
  //     solution: 'function App() {\\n  return <h1 id="title">你好</h1>;\\n}\\n',
  //     hint: '失败 1 次后显示的提示',
  //     test: async t => { /* 同样检查行为；用 t.retry / t.baseline 处理计时 */ },
  //   },
  // ],
  // 阶段测验专用的读代码题。下标是复习卡片键 课id#cN 的 N：以后只能在末尾追加，不能调换、删除
  checkOnly: [
    {
      q: ${q(TODO + '阶段测验读代码题 1')},
      options: [${q(TODO + '选项 A')}, ${q(TODO + '选项 B')}, ${q(TODO + '选项 C')}],
      answer: 0,
      explain: ${q(TODO + '解析')},
    },
  ],
  plays: {
    '第一个示例': {
      note: ${q(TODO + '运行后再看的说明（有预测题时，预测之前不显示）。')},
      predict: {
        q: ${q(TODO + '预测题：运行后会显示什么？')},
        options: [${q(TODO + '选项 A')}, ${q(TODO + '选项 B')}],
        answer: 0,
        explain: ${q(TODO + '解析')},
      },
      pkey: ${q(id + '|第一个示例')},
    },
  },
} satisfies Lesson;
`;

// ---------- 课文 ----------
const mdx = `---
title: ${q(title)}
---

# ${title}

<LessonHeader />

<Warmup />

<LessonGoals />

<LessonProse>

${TODO}正文用普通 Markdown：段落、列表、表格、围栏代码块。每个新概念第一次出现时给一句定义。

## ${TODO}小节标题

\`\`\`jsx play title="第一个示例"
function App() {
  return <p>${TODO}可运行的示例</p>;
}
\`\`\`

<CallBox kind="tip" label="要点">

${TODO}提示框内容。kind 有 tip 要点 / warn 常见坑 / like 打个比方 / deep 深入一点。

</CallBox>

</LessonProse>

<Quiz />

<Exercise />

<SelfExplain />

<LessonFooter />
`;

// ---------- 写文件 ----------
const dataPath = path.join(LESSON_DIR, id + '.ts');
const mdxPath = path.join(ROOT, 'docs/lessons', id + '.mdx');
fs.writeFileSync(dataPath, data);
fs.writeFileSync(mdxPath, mdx);

const orderPath = path.join(ROOT, 'course/order.ts');
const orderSrc = fs.readFileSync(orderPath, 'utf8');
const afterLine = `  '${values.after}',\n`;
if (!orderSrc.includes(afterLine)) die(`在 course/order.ts 里找不到 '${values.after}' 这一行；请手动加 '${id}',`);
fs.writeFileSync(orderPath, orderSrc.replace(afterLine, `${afterLine}  '${id}',\n`));

// 生成的数据文件按 Biome 的格式写好，npm run check 里的 lint 才不会因为格式报错
spawnSync(path.join(ROOT, 'node_modules/.bin/biome'), ['format', '--write', dataPath], { stdio: 'ignore' });

const run = (script, ...a) =>
  spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', path.join(ROOT, 'scripts', script), ...a], { stdio: 'inherit' }).status;
run('gen-registry.mjs');
// 追加新卡片键到快照；插在中间时，后面的课号顺延，check:content 可能同时报"第 N 课"引用对不上，那是预期的，按提示改引用
const checkStatus = run('check-content.mjs', '--update');

// ---------- 提醒：课号顺延 ----------
const newNo = afterIdx + 2;
console.log(
  `\n✓ 已创建第 ${newNo} 课 "${id}"（阶段 ${stage}）：\n  ${path.relative(ROOT, mdxPath)}\n  ${path.relative(ROOT, dataPath)}\n  course/order.ts 已登记；course/lessons.generated.ts、course/card-keys.snapshot.json 已更新`,
);
if (afterIdx + 1 < LESSON_ORDER.length) {
  console.log(
    `\n⚠ 原来第 ${newNo} 课及以后的课，课号都 +1。下面这些"第 N 课"引用的 N ≥ ${newNo}，请核对是否要改（课文、数据文件、docs/index.mdx、theme/components/HomePage.tsx）：`,
  );
  const hits = [];
  const scan = file =>
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const m of line.matchAll(/第\s*(\d+)\s*课/g))
          if (+m[1] >= newNo && file !== mdxPath && file !== dataPath) hits.push(`  ${path.relative(ROOT, file)}:${i + 1}  第 ${m[1]} 课`);
      });
  for (const dir of ['docs/lessons', 'course/lessons']) for (const f of fs.readdirSync(path.join(ROOT, dir))) scan(path.join(ROOT, dir, f));
  scan(path.join(ROOT, 'theme/components/HomePage.tsx'));
  console.log(hits.slice(0, 40).join('\n') + (hits.length > 40 ? `\n  …还有 ${hits.length - 40} 处` : ''));
}
if (checkStatus) console.log('\n⚠ check:content 报告了问题（见上）。插在中间时通常是课号顺延造成的"第 N 课"引用对不上：改完引用再运行 npm run check:content。');
console.log(`\n下一步：把所有"${TODO}"换成真内容 → npm run check → npm run build → npm run test:e2e -- lessons ${id}`);
