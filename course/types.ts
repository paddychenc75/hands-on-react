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
  /** 阶段测验专用的读代码题。下标是复习卡片键 `课id#cN` 的 N，只能在末尾追加 */
  checkOnly: QuizItem[];
  /** 键：示例标题，或 `#序号`（标题重名或没有标题时） */
  plays: Record<string, PlayMeta>;
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
