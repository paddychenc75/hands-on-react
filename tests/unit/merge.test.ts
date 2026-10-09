import { describe, expect, it } from 'vitest';
import { LADDER_KEYS, canon, changedLessons, mergeProgress, sameProgress } from '../../course/engine/logic/merge.ts';
import { STAMP_LADDER, fingerprints, stamp } from '../../course/engine/logic/stamp.ts';

const m = mergeProgress;

/* ---------- 随机进度生成器（固定种子，可重复） ---------- */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function genProgress(r: () => number): any {
  const pick = <T>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const chance = (p: number) => r() < p;
  const T = () => pick([undefined, 0, 1000, 2000, 3000]);
  const p: any = {};
  for (const id of ['a', 'b', 'c']) {
    if (!chance(0.7)) continue;
    const l: any = { quiz: {}, ex: chance(0.4), done: chance(0.3) };
    for (const q of [0, 1, 2]) if (chance(0.5)) l.quiz[q] = pick([0, 1, 2]);
    if (chance(0.5)) l.tried = { 0: true, ...(chance(0.5) ? { 1: true } : {}) };
    if (chance(0.5)) l.first = { 0: chance(0.5), ...(chance(0.5) ? { 1: chance(0.5) } : {}) };
    if (chance(0.5)) {
      l.code = pick(['x', 'xy', 'xyz', 'y']);
      l.fails = pick([0, 1, 2, 3]);
      if (chance(0.5)) l.lastFail = pick(['p', 'q']);
      if (chance(0.5)) l.sawSol = chance(0.5);
      if (chance(0.4)) l.exHelp = pick([false, 'rewrite', 'solution']);
    }
    if (chance(0.5)) l.note = pick(['', '好', '好的笔记', '另一个想法', '好的笔记。续写']);
    if (chance(0.3)) l.noteAlts = [pick(['老版本', '旧稿'])];
    if (chance(0.3)) l.sx = chance(0.5);
    if (chance(0.3)) l.can = { 0: chance(0.5), 1: chance(0.5) };
    if (chance(0.5)) {
      l.dr = {};
      for (const i of [0, 1])
        if (chance(0.5))
          l.dr[i] = {
            ok: chance(0.5),
            ...(chance(0.5) ? { code: pick(['d1', 'd22']), fails: pick([0, 1, 2]) } : {}),
            ...(chance(0.4) ? { t: T() } : {}),
            ...(chance(0.3) ? { exHelp: pick([false, 'solution']) } : {}),
          };
    }
    const ts: any = {};
    if (chance(0.4)) ts.lad = T();
    if (chance(0.4)) ts.note = T();
    if (Object.keys(ts).length) l.ts = ts;
    if (chance(0.15)) l.future = pick([1, 'x', { k: pick([1, 2]) }]);
    p[id] = l;
  }
  if (chance(0.7)) {
    p.__srs = {};
    for (const k of ['a#0', 'a#1', 'b#0'])
      if (chance(0.5)) p.__srs[k] = { box: pick([0, 1, 2, 3]), n: pick([1, 2, 3]), due: pick([5, 9, 12]), last: pick([1, 2, 3, 4]) };
  }
  if (chance(0.6)) {
    p.__stage = {};
    for (const k of ['0', '1'])
      if (chance(0.5))
        p.__stage[k] = {
          best: pick([50, 80, 100]),
          last: pick([50, 90]),
          passed: chance(0.5),
          ...(chance(0.5) ? { passedAt: pick([100, 200, 300]) } : {}),
          ...(chance(0.5) ? { failedAt: pick([100, 200, 300]) } : {}),
          ...(chance(0.3) ? { t: T() } : {}),
          ...(chance(0.3) ? { weak: [pick(['a', 'b'])] } : {}),
        };
  }
  if (chance(0.5)) p.__pred = { 'a|x': pick([0, 1, 2]), ...(chance(0.5) ? { 'b|y': pick([0, 1]) } : {}) };
  if (chance(0.1)) p.__future = { n: pick([1, 2]) };
  return p;
}

const ctx = { quizAnswers: (id: string) => (id === 'a' ? [1, 1, 1] : undefined) };

describe('mergeProgress：性质（随机进度）', () => {
  const r = rng(20261009);
  const samples = Array.from({ length: 400 }, () => [genProgress(r), genProgress(r), genProgress(r)]);

  it('幂等 merge(a, a) = a', () => {
    for (const [a] of samples) expect(canon(m(a, a, ctx))).toBe(canon(a));
  });
  it('可交换 merge(a, b) = merge(b, a)', () => {
    for (const [a, b] of samples) expect(canon(m(a, b, ctx))).toBe(canon(m(b, a, ctx)));
  });
  it('可结合 merge(merge(a, b), c) = merge(a, merge(b, c))', () => {
    for (const [a, b, c] of samples) expect(canon(m(m(a, b, ctx), c, ctx))).toBe(canon(m(a, m(b, c, ctx), ctx)));
  });
  it('合并后再和任何一边合并，结果不变（合并结果包含两边）', () => {
    for (const [a, b] of samples) {
      const x = m(a, b, ctx);
      expect(canon(m(x, a, ctx))).toBe(canon(x));
      expect(canon(m(x, b, ctx))).toBe(canon(x));
    }
  });
  it('不改参数', () => {
    for (const [a, b] of samples.slice(0, 50)) {
      const ca = canon(a);
      const cb = canon(b);
      m(a, b, ctx);
      expect(canon(a)).toBe(ca);
      expect(canon(b)).toBe(cb);
    }
  });
  it('任何一边已完成的课、练习、变式、复习卡片、预测、阶段，合并后都还在', () => {
    for (const [a, b] of samples) {
      const x: any = m(a, b, ctx);
      for (const side of [a, b]) {
        for (const id of ['a', 'b', 'c']) {
          if (side[id]?.done) expect(x[id].done).toBe(true);
          if (side[id]?.ex) expect(x[id].ex).toBe(true);
          if (side[id]?.sx) expect(x[id].sx).toBe(true);
          for (const [i, d] of Object.entries<any>(side[id]?.dr || {})) if (d.ok) expect(x[id].dr[i].ok).toBe(true);
          for (const k of Object.keys(side[id]?.tried || {})) expect(x[id].tried[k]).toBe(true);
          if (side[id]?.note) expect([x[id].note, ...(x[id].noteAlts || [])]).toContain(side[id].note);
        }
        for (const k of Object.keys(side.__srs || {})) expect(x.__srs[k]).toBeTruthy();
        for (const k of Object.keys(side.__pred || {})) expect(x.__pred[k]).not.toBeUndefined();
        for (const k of Object.keys(side.__stage || {})) expect(x.__stage[k]).toBeTruthy();
      }
    }
  });
});

describe('mergeProgress：逐字段规则', () => {
  it('课完成、练习通过取"或"', () => {
    const x: any = m({ a: { quiz: {}, ex: true, done: false } }, { a: { quiz: {}, ex: false, done: true } });
    expect(x.a.ex).toBe(true);
    expect(x.a.done).toBe(true);
  });
  it('课只在一边有时原样保留', () => {
    const x: any = m({ a: { quiz: { 0: 1 }, ex: false, done: false } }, { b: { quiz: {}, ex: true, done: true } });
    expect(Object.keys(x).sort()).toEqual(['a', 'b']);
    expect(x.a.quiz).toEqual({ 0: 1 });
  });
  it('变式练习通过取"或"，每道独立', () => {
    const x: any = m({ a: { dr: { 0: { ok: true } } } }, { a: { dr: { 1: { ok: true }, 0: { ok: false, code: 'c' } } } });
    expect(x.a.dr[0].ok).toBe(true);
    expect(x.a.dr[1].ok).toBe(true);
  });
  it('借助答案的标记跟着完成的那一边：只有一边完成就取它', () => {
    const x: any = m({ a: { ex: true, exHelp: 'solution' } }, { a: { ex: false, fails: 5, code: 'zz' } });
    expect(x.a.exHelp).toBe('solution');
    expect(x.a.ex).toBe(true);
  });
  it('两边各自完成：取最轻的借助（有一边没借助就算没借助）', () => {
    expect((m({ a: { ex: true, exHelp: 'solution' } }, { a: { ex: true, exHelp: false } }) as any).a.exHelp).toBe(false);
    expect((m({ a: { ex: true, exHelp: 'solution' } }, { a: { ex: true, exHelp: 'rewrite' } }) as any).a.exHelp).toBe('rewrite');
    expect((m({ a: { ex: true } }, { a: { ex: true, exHelp: 'solution' } }) as any).a.exHelp).toBeUndefined();
  });
  it('变式练习的借助答案标记同样处理', () => {
    const x: any = m({ a: { dr: { 0: { ok: true, exHelp: 'solution' } } } }, { a: { dr: { 0: { ok: true } } } });
    expect(x.a.dr[0].exHelp).toBeUndefined();
  });

  describe('随堂测验按题合并', () => {
    it('同一题两边答案不同，给了正确答案就取正确的', () => {
      const x: any = m({ a: { quiz: { 0: 0, 1: 2 } } }, { a: { quiz: { 0: 1, 2: 0 } } }, ctx);
      expect(x.a.quiz).toEqual({ 0: 1, 1: 2, 2: 0 });
    });
    it('没有正确答案信息时取较大下标（确定即可）', () => {
      expect((m({ a: { quiz: { 0: 0 } } }, { a: { quiz: { 0: 2 } } }) as any).a.quiz[0]).toBe(2);
    });
    it('tried 取并，first 取"与"（一边首答错就算错）', () => {
      const x: any = m({ a: { tried: { 0: true }, first: { 0: true, 1: true } } }, { a: { tried: { 1: true }, first: { 0: false } } });
      expect(x.a.tried).toEqual({ 0: true, 1: true });
      expect(x.a.first).toEqual({ 0: false, 1: true });
    });
  });

  describe('练习草稿与提示阶梯：整组取更新的一边', () => {
    const A = { code: 'A', fails: 1, firstFail: 1, lastFail: 'a', ts: { lad: 2000 } };
    const B = { code: 'B', fails: 3, firstFail: 9, lastFail: 'b', sawSol: true, ts: { lad: 1000 } };
    it('有时间戳取时间新的，不混拼', () => {
      const x: any = m({ a: A }, { a: B });
      expect(x.a.code).toBe('A');
      expect(x.a.fails).toBe(1);
      expect(x.a.firstFail).toBe(1);
      expect(x.a.sawSol).toBeUndefined();
      expect(x.a.ts.lad).toBe(2000);
    });
    it('没有时间戳取进度更靠后的（失败次数多的）', () => {
      const { ts: _1, ...a } = A;
      const { ts: _2, ...b } = B;
      const x: any = m({ a }, { a: b });
      expect(x.a.code).toBe('B');
      expect(x.a.fails).toBe(3);
    });
    it('带时间戳的比没有时间戳的旧数据更新', () => {
      const { ts: _2, ...b } = B;
      expect((m({ a: A }, { a: b }) as any).a.code).toBe('A');
    });
    it('只改了测验的一边不会把另一边的代码草稿冲掉', () => {
      const x: any = m({ a: { quiz: { 0: 1 } } }, { a: { code: 'draft', fails: 1, ts: { lad: 5 } } });
      expect(x.a.code).toBe('draft');
      expect(x.a.quiz[0]).toBe(1);
    });
  });

  describe('自我解释笔记', () => {
    it('取更新的一边，另一份保存在 noteAlts，不丢', () => {
      const x: any = m({ a: { note: '旧', ts: { note: 1 } } }, { a: { note: '新的想法', ts: { note: 2 } } });
      expect(x.a.note).toBe('新的想法');
      expect(x.a.noteAlts).toEqual(['旧']);
      expect(x.a.ts.note).toBe(2);
    });
    it('没有时间戳取更长的', () => {
      const x: any = m({ a: { note: '短' } }, { a: { note: '更长的一份' } });
      expect(x.a.note).toBe('更长的一份');
      expect(x.a.noteAlts).toEqual(['短']);
    });
    it('两边相同不产生 noteAlts；空笔记不进 noteAlts', () => {
      expect((m({ a: { note: '同' } }, { a: { note: '同' } }) as any).a.noteAlts).toBeUndefined();
      expect((m({ a: { note: '' } }, { a: { note: '有' } }) as any).a.noteAlts).toBeUndefined();
    });
    it('再次合并不重复累积', () => {
      const x = m({ a: { note: '旧', ts: { note: 1 } } }, { a: { note: '新的想法', ts: { note: 2 } } });
      expect(canon(m(x, x))).toBe(canon(x));
      expect(canon(m(x, { a: { note: '旧', ts: { note: 1 } } }))).toBe(canon(x));
    });
  });

  describe('间隔复习卡片', () => {
    it('同一张卡整条取最近复习（last）更晚的，不混拼', () => {
      const A = { box: 3, n: 5, due: 900, last: 100 };
      const B = { box: 1, n: 2, due: 50, last: 200 };
      const x: any = m({ __srs: { 'a#0': A } }, { __srs: { 'a#0': B } });
      expect(x.__srs['a#0']).toEqual(B);
    });
    it('只在一边存在的卡片保留，数量是并集', () => {
      const x: any = m({ __srs: { 'a#0': { box: 1, n: 1, due: 1, last: 1 } } }, { __srs: { 'a#1': { box: 2, n: 1, due: 1, last: 1 } } });
      expect(Object.keys(x.__srs).sort()).toEqual(['a#0', 'a#1']);
    });
    it('last 相同按答题次数多的', () => {
      const x: any = m({ __srs: { k: { box: 1, n: 1, due: 1, last: 5 } } }, { __srs: { k: { box: 2, n: 3, due: 2, last: 5 } } });
      expect(x.__srs.k.n).toBe(3);
    });
  });

  describe('阶段测验', () => {
    it('按阶段取最近一次作答的整条记录，best 取最大', () => {
      const A = { best: 100, last: 100, passed: true, passedAt: 100 };
      const B = { best: 60, last: 60, passed: false, failedAt: 500, weak: ['a'] };
      const x: any = m({ __stage: { 0: A } }, { __stage: { 0: B } });
      expect(x.__stage[0]).toEqual({ ...B, best: 100 });
    });
    it('答到一半离开（pending）也按其时间算', () => {
      const A = { passed: true, passedAt: 100, best: 90, last: 90 };
      const B = { pending: { n: 12, answered: 3, right: 2, at: 400, weak: [] } };
      expect((m({ __stage: { 1: A } }, { __stage: { 1: B } }) as any).__stage[1].pending).toBeTruthy();
    });
    it('不同阶段各自保留', () => {
      expect(Object.keys((m({ __stage: { 0: { best: 1 } } }, { __stage: { 1: { best: 2 } } }) as any).__stage)).toEqual(['0', '1']);
    });
  });

  it('预测题记录按键取并集', () => {
    expect((m({ __pred: { 'a|x': 1 } }, { __pred: { 'b|y': 0 } }) as any).__pred).toEqual({ 'a|x': 1, 'b|y': 0 });
  });

  describe('兼容', () => {
    it('旧数据（没有任何新字段）合并不报错，结果不凭空多出字段', () => {
      const old = { a: { quiz: { 0: 1 }, ex: false, done: false } };
      expect(canon(m(old, old))).toBe(canon(old));
      expect(() => m(old, {})).not.toThrow();
      expect(() => m({}, {})).not.toThrow();
    });
    it('未知字段原样保留（课里、顶层都是）', () => {
      const x: any = m({ a: { quiz: {}, future: { k: 1 } }, __newThing: { z: 1 } }, { a: { quiz: {}, other: 7 }, __newThing: { y: 2 } });
      expect(x.a.future).toEqual({ k: 1 });
      expect(x.a.other).toBe(7);
      expect(x.__newThing).toEqual({ z: 1, y: 2 });
    });
    it('坏数据不崩：非对象的课、null、数组', () => {
      expect(() => m({ a: 5, b: null, __srs: [], __stage: 'x' }, { a: { quiz: {} }, b: 3, __srs: { k: 1 } })).not.toThrow();
      expect(() => m(null, undefined)).not.toThrow();
      expect(m(null, { a: { quiz: {} } })).toEqual({ a: { quiz: {} } });
    });
  });
});

describe('changedLessons / sameProgress', () => {
  it('只列有差别的课，不含 __ 键', () => {
    expect(changedLessons({ a: { x: 1 }, b: { y: 1 }, __srs: {} }, { a: { x: 1 }, b: { y: 2 }, c: {}, __srs: { k: 1 } }).sort()).toEqual(['b', 'c']);
  });
  it('键顺序不影响相同判断', () => {
    expect(sameProgress({ a: 1, b: { c: 1, d: 2 } }, { b: { d: 2, c: 1 }, a: 1 })).toBe(true);
  });
});

describe('stamp：改动时间戳', () => {
  it('变了的组才盖章，没变的不动；旧数据加载时不盖章', () => {
    const p: any = { a: { quiz: {}, ex: false, done: false, code: 'x', fails: 1 }, __stage: { 0: { best: 80 } } };
    const snap = fingerprints(p);
    expect(stamp(p, snap, 1000)).toBe(false);
    expect(p.a.ts).toBeUndefined();
    p.a.code = 'xy';
    p.a.note = '想法';
    p.a.dr = { 0: { ok: true } };
    p.__stage[0].last = 50;
    expect(stamp(p, snap, 2000)).toBe(true);
    expect(p.a.ts).toEqual({ lad: 2000, note: 2000 });
    expect(p.a.dr[0].t).toBe(2000);
    expect(p.__stage[0].t).toBe(2000);
    // 再保存一次内容没变：时间戳不动
    expect(stamp(p, snap, 3000)).toBe(false);
    expect(p.a.ts.lad).toBe(2000);
    // 只改测验和完成状态不影响草稿的时间戳
    p.a.quiz[0] = 1;
    p.a.done = true;
    expect(stamp(p, snap, 4000)).toBe(false);
    expect(p.a.ts.lad).toBe(2000);
  });
  it('盖章不改变学习进度的任何现有字段', () => {
    const p: any = {
      a: { quiz: { 0: 1 }, ex: true, done: true, code: 'c', fails: 2, firstFail: 5, lastFail: 'l', sawSol: true, exHelp: 'solution', note: 'n' },
    };
    const before = JSON.parse(JSON.stringify(p));
    stamp(p, {}, 99);
    const { ts, ...rest } = p.a;
    expect(rest).toEqual(before.a);
    expect(ts).toEqual({ lad: 99, note: 99 });
  });
});

describe('stamp 和 merge 的字段表', () => {
  it('提示阶梯字段一致（stamp.ts 在主包里，不能直接 import merge.ts）', () => {
    expect([...STAMP_LADDER]).toEqual([...LADDER_KEYS]);
  });
});
