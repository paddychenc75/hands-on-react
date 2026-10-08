/* 课程数据和进度存储的类型。全站只在这里定义一份：
   - 每课的数据文件（course/lessons/<id>.ts）用 `satisfies Lesson` 检查字段；
   - 引擎和 theme 从这里引用类型；
   - scripts/check-content.mjs 校验的规则（选项数、answer 下标等）和这里的类型是对应的。 */

/** 阶段下标，0–5。 */
export type StageIndex = 0 | 1 | 2 | 3 | 4 | 5;

/** 一道选择题。q、explain 按 HTML 渲染；options 是纯文本。 */
export interface QuizItem {
  q: string;
  options: string[];
  /** 正确选项在 options 里的下标 */
  answer: number;
  explain: string;
}

/** 预测题：写在 plays[标题].predict。title 可选，用来覆盖实验台标题。 */
export interface Predict extends QuizItem {
  title?: string;
}

/** 一个 ```jsx play 示例块的附加数据（键是示例标题，或 `#序号`）。 */
export interface PlayMeta {
  /** 运行后才显示的说明（有预测题时，预测之前隐藏） */
  note?: string;
  predict?: Predict;
  /** 预测键 `课id|标题`，进度里的 __pred 用它，不要改 */
  pkey?: string;
}

/** 练习检查函数拿到的工具（实现见 course/engine/tester.ts 的 makeTester）。 */
export interface Tester {
  root: HTMLElement;
  /** 去掉注释的学习者代码 */
  source: string;
  rawSource: string;
  /** 按练习的 exports 字段导出的顶层名字 */
  exports: Record<string, any>;
  /** 实验台运行时里的 React / ReactDOM（练习检查必须用它们，不要读全局的 React / ReactDOM，全局没有） */
  React: any;
  ReactDOM: any;
  /** 已加载的第三方库的模块对象，键是 import 的路径，例如 t.libs['react-router']、t.libs['@tanstack/react-query']。只有练习的代码 import 了才有 */
  libs: Record<string, any>;
  /** 本次运行里表单被提交、但学习者的处理函数没有调用 preventDefault 的次数。实验台会替学习者拦住刷新，所以只有这个计数能看出漏写 */
  unpreventedSubmits: () => number;
  /** 返回元素；约定是"找得到"，找不到时返回 null。查询结果按 any 使用，因为练习要读 value、checked 等各种元素的属性 */
  q: (selector: string) => any;
  qa: (selector: string) => any[];
  text: (selector: string) => string;
  byText: (tag: string, text: string) => any;
  click: (target: string | Element) => Promise<void>;
  type: (target: string | Element, value: string) => Promise<void>;
  wait: (ms: number) => Promise<void>;
  assert: (cond: unknown, message: string) => void;
  /** 测一次设备基线（固定计算量的耗时、事件循环延迟）。标签页在后台时抛出“请切回前台”的提示，且不计入失败次数 */
  baseline: () => Promise<Baseline>;
  /** 计时类断言：失败时可被 t.retry 自动重测一次。阈值用 (await t.baseline()).limit(ms) 算，不要写死毫秒数 */
  timing: (cond: unknown, message: string) => void;
  /** 运行一段含 t.timing 的检查；t.timing 失败就等 0.3 秒再整体重测一次，两次都失败才判失败，失败信息区分“设备忙”和“代码问题”。fn 必须能重复执行（自己创建 root 和数据）。普通的 t.assert 失败不会重测 */
  retry: (fn: () => Promise<void> | void) => Promise<void>;
  /** 读 React 内部结构。字段不存在返回 null，检查要退回到纯行为断言；依赖的是 React 19.3.x 的结构 */
  internals: Internals;
}

/** 设备基线（t.baseline() 的结果） */
export interface Baseline {
  /** 设备比参考机慢几倍，≥1 */
  factor: number;
  /** 事件循环的额外延迟（毫秒） */
  lag: number;
  /** 把原来的绝对阈值（毫秒）放宽一点：只加额外开销，不按倍数放大 */
  limit: (ms: number) => number;
}

/** t.internals：读 React 内部结构的安全入口，字段不在就返回 null（调用方退回到行为断言） */
export interface Internals {
  /** 这个 React 版本的内部结构已知（19.3.x） */
  known: boolean;
  /** DOM 节点对应的 fiber */
  fiberOf: (node: any) => any | null;
  /** 容器上的 FiberRoot（要有数字类型的 pendingLanes） */
  rootOf: (container: any) => any | null;
  /** 从 fiber 往上找最近的函数组件 */
  componentOf: (fiber: any) => any | null;
  /** 组件 fiber 上的 Hook 链表，按顺序 */
  hooksOf: (fiber: any) => any[] | null;
  /** 组件有没有 useState/useReducer：true/false，拿不到结构时 null */
  hasStateHook: (fiber: any) => boolean | null;
  /** 组件里 useRef 的 current 值 */
  refValues: (fiber: any) => any[] | null;
  /** 组件里 useState/useReducer 当前的值，按 Hook 顺序 */
  stateValues: (fiber: any) => any[] | null;
  /** 根上有没有排队中的过渡更新；版本不是 19.3.x 或结构不对时 null */
  inTransition: (root: any) => boolean | null;
  /** 容器里 Suspense 边界的个数；找不到根 fiber 时 null */
  suspenseCount: (container: any) => number | null;
}

export interface Exercise {
  /** HTML */
  task: string;
  starter: string;
  solution: string;
  /** HTML */
  hint: string;
  /** 人工挖空的半成品，用 `/* ✏️ 说明 *\/` 标记要补的行 */
  faded: string;
  test: (t: Tester) => Promise<void> | void;
  /** 需要从学习者代码里取出的顶层名字，出现在 t.exports 里 */
  exports?: string[];
}

/** 变式练习：正式练习之外的小任务（3–8 分钟），练同一个概念的不同情境。不影响“本课完成”。提示规则比正式练习简单：失败 1 次给提示，失败 2 次可看参考答案 */
export interface Drill {
  /** 一句话定位，显示在这道变式的标题上，例如“换成对象状态” */
  title: string;
  /** HTML */
  task: string;
  starter: string;
  solution: string;
  /** HTML，失败 1 次后可看 */
  hint?: string;
  test: (t: Tester) => Promise<void> | void;
  /** 需要从学习者代码里取出的顶层名字，出现在 t.exports 里 */
  exports?: string[];
}

export interface Lesson {
  /** 与 docs/lessons/<id>.mdx、course/lessons/<id>.ts 同名 */
  id: string;
  stage: StageIndex;
  title: string;
  /** 预计学习分钟数 */
  mins: number;
  summary: string;
  /** 3–4 条，"能……"开头 */
  goals: string[];
  /** 4–5 条，自我解释后展示对照 */
  keyPoints: string[];
  quiz: QuizItem[];
  exercise?: Exercise;
  /** 变式练习：2–3 道小而快的练习，练同一个概念的不同情境。可选，不影响“本课完成”。MDX 里写 `<Drills />` */
  drills?: Drill[];
  /** 变式练习的预计分钟数之和（每道 3–8 分钟，按任务大小取）。有 drills 必须有它；不计入 mins（变式不是完成一课的必要条件） */
  drillMins?: number;
  /** 这课的本机任务或本机项目的预计分钟数（需要在自己电脑上做，站内没有自动检查）。可选，缺省按 0；首页单独统计，不计入 mins */
  localMins?: number;
  /** 阶段测验专用的读代码题。下标是复习卡片键 `课id#cN` 的 N，只能在末尾追加 */
  checkOnly: QuizItem[];
  /** 键：示例标题，或 `#序号`（标题重名或没有标题时） */
  plays: Record<string, PlayMeta>;
}

/** 轻量课程目录里的一课：进主包，各页面同步需要的字段（标题、摘要、目标、时长、计数）。
 *  由 scripts/gen-registry.mjs 从 course/lessons/<id>.ts 算出（course/lessons.catalog.generated.ts），题目、练习、示例说明等重数据在每课自己的异步 chunk 里（Lesson）。 */
export interface LessonMeta {
  id: string;
  stage: StageIndex;
  title: string;
  mins: number;
  localMins?: number;
  summary: string;
  /** 学习目标（静态 HTML 里要有，所以留在目录里） */
  goals: string[];
  /** 随堂测验的正确答案下标：长度 = 题数，用来在不加载题目的情况下判断“测验是否全对” */
  quizAnswers: number[];
  /** 阶段测验读代码题（checkOnly）的数量 */
  nCheck: number;
  hasExercise: boolean;
  /** 变式练习数 */
  nDrills: number;
  /** 变式练习的预计分钟数之和（没有变式时缺省） */
  drillMins?: number;
  /** 可运行示例数（plays 的键数） */
  nPlays: number;
}

/** 术语表条目 */
export interface GlossaryEntry {
  term: string;
  en: string;
  def: string;
  /** 不使用的说法 */
  avoid: string;
}

/** 阶段 */
export interface Stage {
  no: string;
  name: string;
  en: string;
  desc: string;
}

/* ---------- 进度存储（localStorage['hands-on-react-v1']） ---------- */

/** 间隔复习卡片（Leitner 盒子）。键是 `课id#N`（随堂测验）或 `课id#cN`（阶段测验读代码题） */
export interface SrsCard {
  /** 当前盒子，0 到 SRS_DAYS.length - 1 */
  box: number;
  /** 答题次数 */
  n: number;
  /** 下次到期时间（毫秒时间戳） */
  due: number;
  /** 最近一次答题时间 */
  last: number;
}

/** 某个阶段测验的记录 */
export interface StageRecord {
  /** 答到一半离开时留下的记录，下次进入时按未通过结算 */
  pending?: { n: number; answered: number; right: number; at: number; weak: string[] };
  best?: number;
  last?: number;
  passed?: boolean;
  passedAt?: number;
  failedAt?: number;
  /** 需要加强的课 id */
  weak?: string[];
}

/** 单课进度 */
export interface LessonProgress {
  /** 随堂测验：题号 → 选中的选项下标 */
  quiz: Record<number, number>;
  /** 练习是否通过 */
  ex: boolean;
  done: boolean;
  /** 练习编辑器里保存的代码 */
  code?: string;
  /** 练习的有效失败次数 */
  fails?: number;
  firstFail?: number;
  /** 上次失败代码的规范化形式 */
  lastFail?: string;
  /** 是否看过参考答案 */
  sawSol?: boolean;
  /** 看过答案后点了重置，表示要自己重写 */
  rewrite?: boolean;
  exHelp?: 'rewrite' | 'solution' | false;
  /** 随堂测验：哪些题已经答过（只有第一次作答计入复习） */
  tried?: Record<number, boolean>;
  /** 随堂测验：每题首答是否正确 */
  first?: Record<number, boolean>;
  /** 自我解释的文字 */
  note?: string;
  /** 自我解释：是否已展开对照要点 */
  sx?: boolean;
  /** 学习目标自查勾选 */
  can?: Record<string, boolean>;
  /** 变式练习的状态：下标 → 记录。只新增这一个字段；旧数据里没有它，一切照常 */
  dr?: Record<number, DrillProgress>;
}

/** 一道变式练习的状态。字段含义和正式练习一致（code、fails、lastFail、sawSol、rewrite），ok 对应 LessonProgress.ex */
export interface DrillProgress {
  ok: boolean;
  code?: string;
  fails?: number;
  lastFail?: string;
  sawSol?: boolean;
  rewrite?: boolean;
  /** 是否借助参考答案通过 */
  exHelp?: 'rewrite' | 'solution' | false;
}

/** 进度存储的整体结构：课 id → 单课进度，另有三个以 __ 开头的特殊键 */
export interface Progress {
  [lessonId: string]: any;
  /** 预测题：预测键 → 选中的选项下标 */
  __pred?: Record<string, number>;
  /** 间隔复习卡片：卡片键 → 卡片 */
  __srs?: Record<string, SrsCard>;
  /** 阶段测验记录：阶段下标 → 记录 */
  __stage?: Record<string, StageRecord>;
}
