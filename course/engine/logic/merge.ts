/* 两份学习进度的合并（跨设备同步和导入文件共用）。纯函数：不碰 DOM、存储，不读时间。
   原则：两台设备各学各的，合并后谁的进度都不丢；同一条记录以更新的为准。
   数据结构见 course/types.ts 的 Progress；逐字段规则见 AGENTS.md「进度同步」。

   性质（tests/unit/merge.test.ts 用手写用例和随机进度固定）：
   - 幂等 merge(a, a) = a；可交换 merge(a, b) = merge(b, a)；可结合 merge(merge(a, b), c) = merge(a, merge(b, c))
   - 任何一边已完成的课、练习、变式、复习卡片，合并后都还在
   - 没有时间戳的旧数据按"更旧"处理；不认识的字段原样保留（向前兼容）
   做到这三条的办法：每个字段都是"取并集 / 取或 / 取最大"，需要二选一的地方只用一个全序（时间、进度、规范化文本）比大小，不看参数顺序。 */

type Obj = Record<string, any>;
export const isObj = (v: unknown): v is Obj => v !== null && typeof v === 'object' && !Array.isArray(v);

/** 规范化的 JSON：对象键排序。用来比较两份数据是否相同，也用作平局时的确定性裁决 */
export function canon(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (isObj(v))
    return (
      '{' +
      Object.keys(v)
        .filter(k => v[k] !== undefined)
        .sort()
        .map(k => JSON.stringify(k) + ':' + canon(v[k]))
        .join(',') +
      '}'
    );
  return JSON.stringify(v) ?? 'null';
}

/** 单课里属于"练习草稿与提示阶梯"的字段：整组从更新的一边取，不拼接 */
export const LADDER_KEYS = ['code', 'fails', 'firstFail', 'lastFail', 'sawSol', 'rewrite', 'exHelp'] as const;
const DRILL_KEYS = ['code', 'fails', 'lastFail', 'sawSol', 'rewrite', 'exHelp'] as const;
const LESSON_KNOWN = new Set<string>([...LADDER_KEYS, 'quiz', 'tried', 'first', 'ex', 'done', 'note', 'noteAlts', 'sx', 'can', 'dr', 'ts']);
const DRILL_KNOWN = new Set<string>([...DRILL_KEYS, 'ok', 't']);

export interface MergeContext {
  /** 某课随堂测验的正确答案下标；给了就在"同一题两边答案不同"时优先取正确的 */
  quizAnswers?: (lessonId: string) => number[] | undefined;
}

type Rank = (number | string)[];
const cmp = (a: Rank, b: Rank): number => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    return a[i] < b[i] ? -1 : 1;
  }
  return 0;
};
/** 两个候选里取排名大的；排名完全相同时它们的规范化文本也相同（或由调用方把文本放进排名末尾） */
const maxBy = <T>(x: T, y: T, rank: (v: T) => Rank): T => (cmp(rank(x), rank(y)) >= 0 ? x : y);
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** 通用合并：只在一边有就取它；都是对象就逐键递归；其余按规范化文本取较大者。不认识的字段都走这里 */
export function mergeAny(a: any, b: any): any {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (isObj(a) && isObj(b)) {
    const out: Obj = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const v = mergeAny(a[k], b[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  return canon(a) >= canon(b) ? a : b;
}

/** 两边都有就用 f 合并，只有一边有就取它 */
const both = (a: any, b: any, f: (x: any, y: any) => any) => (a === undefined ? b : b === undefined ? a : f(a, b));
const or = (a: any, b: any) => both(a, b, (x, y) => x || y);

/** 借助答案的程度：没借助 < 看过后自己重写 < 直接看答案。完成时取最轻的：两边都是各自通过的，有一边没借助就是没借助 */
const helpLevel = (v: unknown): number => (v === 'solution' ? 2 : v === 'rewrite' ? 1 : 0);
const lightestHelp = (x: unknown, y: unknown): unknown => maxBy(x, y, v => [-helpLevel(v), v === undefined ? '' : canon(v)]);

/** 一组"整体取更新一边"的字段（提示阶梯、变式练习的草稿与失败记录）。
 *  排名：这组字段的时间戳 > 失败次数（进度更靠后） > 看过答案 > 规范化文本。没有时间戳（旧数据）时时间戳是 0。 */
function mergeGroup(a: Obj, b: Obj, keys: readonly string[], ta: number, tb: number, okA: boolean, okB: boolean): { out: Obj; t: number } {
  const pick = (o: Obj, t: number): Rank => {
    const sub: Obj = {};
    for (const k of keys) if (k !== 'exHelp' && o[k] !== undefined) sub[k] = o[k];
    // 没有任何这组字段的一边不参与竞争（即使带着时间戳）
    return [Object.keys(sub).length ? 1 : 0, t, num(o.fails), o.sawSol ? 1 : 0, canon(sub), canon(o.exHelp)];
  };
  const aWins = cmp(pick(a, ta), pick(b, tb)) >= 0;
  const win = aWins ? a : b;
  const out: Obj = {};
  for (const k of keys) if (win[k] !== undefined) out[k] = win[k];
  // 借助答案的标记跟着"完成发生的那一边"走：只有一边完成就取它的；两边都完成取最轻的；都没完成跟着胜出的一边
  const help = okA && okB ? lightestHelp(a.exHelp, b.exHelp) : okA ? a.exHelp : okB ? b.exHelp : win.exHelp;
  if (keys.includes('exHelp')) {
    if (help !== undefined) out.exHelp = help;
    else delete out.exHelp;
  }
  return { out, t: aWins ? ta : tb };
}

function mergeQuiz(a: any, b: any, answers?: number[]): any {
  return both(a, b, (x: Obj, y: Obj) => {
    const out: Obj = {};
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
      // 同一题两边答案不同：取正确的；都对或都错，取较大的下标（确定性即可）
      out[k] = both(x[k], y[k], (p, q) => maxBy(p, q, v => [answers && answers[+k] === v ? 1 : 0, num(v), canon(v)]));
    }
    return out;
  });
}

function mergeBoolMap(a: any, b: any, f: (x: any, y: any) => any): any {
  return both(a, b, (x: Obj, y: Obj) => {
    const out: Obj = {};
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) out[k] = both(x[k], y[k], f);
    return out;
  });
}

function mergeDrill(a: any, b: any): any {
  return both(a, b, (x: Obj, y: Obj) => {
    if (!isObj(x) || !isObj(y)) return mergeAny(x, y);
    const g = mergeGroup(x, y, DRILL_KEYS, num(x.t), num(y.t), !!x.ok, !!y.ok);
    const out: Obj = { ...g.out };
    const ok = or(x.ok, y.ok);
    if (ok !== undefined) out.ok = ok;
    // 时间戳跟着胜出的那一组走
    if (x.t !== undefined || y.t !== undefined) out.t = g.t;
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)]))
      if (!DRILL_KNOWN.has(k)) {
        const v = mergeAny(x[k], y[k]);
        if (v !== undefined) out[k] = v;
      }
    return out;
  });
}

/** 自我解释的笔记：更新的一边是正文；两边不同时，另一份保留在 noteAlts（界面显示为"另一台设备的版本"），不丢。
 *  没有时间戳时取更长的。noteAlts 是"所有出现过的文字减去正文"的集合，所以合并顺序不影响结果。 */
function mergeNote(a: Obj, b: Obj, out: Obj): { s: string; t: number } | undefined {
  const ta = num(a.ts?.note);
  const tb = num(b.ts?.note);
  const mains: { s: string; t: number }[] = [];
  if (typeof a.note === 'string') mains.push({ s: a.note, t: ta });
  if (typeof b.note === 'string') mains.push({ s: b.note, t: tb });
  const alts = new Set<string>();
  for (const o of [a, b]) if (Array.isArray(o.noteAlts)) for (const s of o.noteAlts) if (typeof s === 'string') alts.add(s);
  let win: { s: string; t: number } | undefined;
  for (const m of mains) {
    if (!win || cmp([m.t, m.s.length, m.s], [win.t, win.s.length, win.s]) > 0) win = m;
  }
  if (win) out.note = win.s;
  for (const m of mains) alts.add(m.s);
  if (win) alts.delete(win.s);
  alts.delete('');
  if (alts.size) out.noteAlts = [...alts].sort((p, q) => q.length - p.length || (p < q ? -1 : p > q ? 1 : 0));
  return win;
}

export function mergeLesson(a: any, b: any, answers?: number[]): any {
  if (!isObj(a) || !isObj(b)) return isObj(a) ? a : isObj(b) ? b : mergeAny(a, b);
  const out: Obj = {};
  const set = (k: string, v: any) => {
    if (v !== undefined) out[k] = v;
  };
  set('quiz', mergeQuiz(a.quiz, b.quiz, answers));
  set(
    'tried',
    mergeBoolMap(a.tried, b.tried, (x, y) => x || y),
  ); // 答过就是答过
  set(
    'first',
    mergeBoolMap(a.first, b.first, (x, y) => x && y),
  ); // 首答是否正确：保守，一边答错就算错
  set('ex', or(a.ex, b.ex));
  set('done', or(a.done, b.done));
  set('sx', or(a.sx, b.sx));
  set(
    'can',
    mergeBoolMap(a.can, b.can, (x, y) => x || y),
  );
  let ladT: number | undefined;
  if (LADDER_KEYS.some(k => a[k] !== undefined || b[k] !== undefined)) {
    const g = mergeGroup(a, b, LADDER_KEYS, num(a.ts?.lad), num(b.ts?.lad), !!a.ex, !!b.ex);
    Object.assign(out, g.out);
    ladT = g.t;
  }
  const noteWin = mergeNote(a, b, out);
  set(
    'dr',
    both(a.dr, b.dr, (x: Obj, y: Obj) => {
      const d: Obj = {};
      for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) d[k] = both(x[k], y[k], mergeDrill);
      return d;
    }),
  );
  if (isObj(a.ts) || isObj(b.ts)) {
    const ts: Obj = {};
    for (const k of new Set([...Object.keys(a.ts || {}), ...Object.keys(b.ts || {})])) {
      const x = a.ts?.[k];
      const y = b.ts?.[k];
      ts[k] = typeof x === 'number' && typeof y === 'number' ? Math.max(x, y) : mergeAny(x, y);
    }
    // 笔记的时间戳跟着胜出的那份文字走（不是两边的最大值）
    if (noteWin && ts.note !== undefined) ts.note = noteWin.t;
    if (ladT !== undefined && ts.lad !== undefined) ts.lad = ladT;
    out.ts = ts;
  }
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (!LESSON_KNOWN.has(k)) set(k, mergeAny(a[k], b[k]));
  return out;
}

/** 复习卡片：按卡片键合并，同一张卡整条取最近一次复习（last）更晚的，不混拼字段；只在一边有的保留 */
export function mergeCards(a: any, b: any): any {
  return both(a, b, (x: Obj, y: Obj) => {
    const out: Obj = {};
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
      out[k] = both(x[k], y[k], (p, q) => maxBy(p, q, v => [num(v?.last), num(v?.n), canon(v)]));
    }
    return out;
  });
}

/** 阶段测验记录最近一次作答的时间：可能是交卷失败、通过，或答到一半离开 */
export const stageTime = (r: any): number => Math.max(num(r?.t), num(r?.failedAt), num(r?.passedAt), num(r?.pending?.at));

/** 阶段测验：按阶段取最近一次作答的整条记录（现有语义"以最近一次为准"）；best 是历史最高分，取最大 */
export function mergeStages(a: any, b: any): any {
  return both(a, b, (x: Obj, y: Obj) => {
    const out: Obj = {};
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
      out[k] = both(x[k], y[k], (p, q) => {
        if (!isObj(p) || !isObj(q)) return mergeAny(p, q);
        const core = (r: Obj): Rank => {
          const { best: _b, t: _t, ...rest } = r;
          return [stageTime(r), canon(rest)];
        };
        const win = { ...maxBy(p, q, core) };
        if (p.best !== undefined || q.best !== undefined) win.best = Math.max(num(p.best), num(q.best));
        if (p.t !== undefined || q.t !== undefined) win.t = Math.max(num(p.t), num(q.t));
        return win;
      });
    }
    return out;
  });
}

/** 合并两份进度。不改参数，返回新对象（可能和参数共用子对象，调用方不要原地修改结果后再拿去合并） */
export function mergeProgress(a: unknown, b: unknown, ctx: MergeContext = {}): Obj {
  const x: Obj = isObj(a) ? a : {};
  const y: Obj = isObj(b) ? b : {};
  const out: Obj = {};
  for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
    let v: any;
    if (k === '__srs') v = mergeCards(x[k], y[k]);
    else if (k === '__stage') v = mergeStages(x[k], y[k]);
    else if (k.startsWith('__'))
      v = mergeAny(x[k], y[k]); // __pred（预测题：键的并集）和未知的 __ 键
    else v = mergeLesson(x[k], y[k], ctx.quizAnswers?.(k));
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/** 两份进度内容是否相同（忽略键的顺序） */
export const sameProgress = (a: unknown, b: unknown): boolean => canon(a) === canon(b);

/** 两份进度之间有差别的课 id（不含 __ 开头的键）。用来告诉用户"从云端合并了 N 课" */
export function changedLessons(before: unknown, after: unknown): string[] {
  const x: Obj = isObj(before) ? before : {};
  const y: Obj = isObj(after) ? after : {};
  return [...new Set([...Object.keys(x), ...Object.keys(y)])].filter(k => !k.startsWith('__') && canon(x[k]) !== canon(y[k]));
}
