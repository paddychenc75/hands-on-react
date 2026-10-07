import { describe, expect, it } from 'vitest';
import { LADDER, fadedExample, isAttempt, isPastedSolution, ladderButton, minutesSinceFirstFail, normCode } from '../../course/engine/logic/ladder.ts';
import { MIN, NOW } from './fixtures.ts';

const [hint, faded, solution] = LADDER;
const open = (level: (typeof LADDER)[number], fails: number, minutes: number | null, ex = false) =>
  ladderButton(level, { fails, firstFail: minutes === null ? undefined : NOW - minutes * MIN, ex }, NOW).open;

describe('提示阶梯：三级的次数和时间条件', () => {
  it('三级是 提示(1 次, 0 分钟)、半成品示例(2 次, 2 分钟)、参考答案(3 次, 5 分钟)', () => {
    expect(LADDER).toEqual([
      { name: '提示', need: 1, wait: 0 },
      { name: '半成品示例', need: 2, wait: 2 },
      { name: '查看参考答案', need: 3, wait: 5 },
    ]);
  });

  it('提示：失败 1 次就解锁，没有时间要求', () => {
    expect(open(hint, 0, null)).toBe(false);
    expect(open(hint, 1, 0)).toBe(true);
  });

  it('半成品示例：要失败 2 次，并且从第一次失败起过了 2 分钟', () => {
    expect(open(faded, 1, 10)).toBe(false);
    expect(open(faded, 2, 1.99)).toBe(false);
    expect(open(faded, 2, 2)).toBe(true);
  });

  it('参考答案：要失败 3 次，并且从第一次失败起过了 5 分钟', () => {
    expect(open(solution, 2, 60)).toBe(false);
    expect(open(solution, 3, 4.99)).toBe(false);
    expect(open(solution, 3, 5)).toBe(true);
    expect(open(solution, 9, 600)).toBe(true);
  });

  it('练习通过后三级都开放', () => {
    expect(open(solution, 0, null, true)).toBe(true);
  });

  it('按钮文字：次数不够时写还要检查几次；次数够了、时间不够时写还要想几分钟（至少 1 分钟）', () => {
    const text = (level: (typeof LADDER)[number], fails: number, minutes: number) => ladderButton(level, { fails, firstFail: NOW - minutes * MIN }, NOW).text;
    expect(ladderButton(hint, {}, NOW).text).toBe('🔒 提示（再改代码检查 1 次解锁）');
    expect(text(solution, 1, 0)).toBe('🔒 查看参考答案（再改代码检查 2 次解锁）');
    expect(text(solution, 3, 1)).toBe('🔒 查看参考答案（再想 4 分钟解锁）');
    expect(text(solution, 3, 4.9)).toBe('🔒 查看参考答案（再想 1 分钟解锁）');
    expect(text(solution, 3, 5)).toBe('查看参考答案');
  });

  it('minutesSinceFirstFail：没失败过是 0', () => {
    expect(minutesSinceFirstFail(undefined, NOW)).toBe(0);
    expect(minutesSinceFirstFail(NOW - 90e3, NOW)).toBe(1.5);
  });
});

describe('代码是否真的改了', () => {
  it('normCode 去掉注释、空白、分号、逗号', () => {
    expect(normCode('const a = 1; // 注释\n/* 块注释 */ b,')).toBe('consta=1b');
    expect(normCode('f(a, b);')).toBe('f(ab)');
  });

  it('去掉注释/空白/分号/逗号后相同，不算一次失败', () => {
    const starter = 'function App() {\n  return <p>hi</p>;\n}';
    expect(isAttempt(starter, starter, undefined)).toBe(false);
    expect(isAttempt(starter + ';', starter, undefined)).toBe(false);
    expect(isAttempt(starter + '\n// 加个注释\n', starter, undefined)).toBe(false);
    expect(isAttempt('function App(){return <p>hi</p>}', starter, undefined)).toBe(false);
    expect(isAttempt('f(a, b)', 'f(a b)', undefined)).toBe(false);
  });

  it('真的改了代码才算', () => {
    expect(isAttempt('const a = 1', 'const a = 2', undefined)).toBe(true);
  });

  it('和上一次失败时的代码相同（规范化后）不重复计数', () => {
    const last = normCode('const a = 1;');
    expect(isAttempt('const  a = 1 ;;', 'const a = 2', last)).toBe(false);
    expect(isAttempt('const a = 3', 'const a = 2', last)).toBe(true);
  });

  it('只和"上一次"失败比较：在两份失败的代码之间来回改，每次都算（现有行为）', () => {
    const a = 'const a = 1', b = 'const a = 3', starter = 'const a = 2';
    expect(isAttempt(a, starter, normCode(b))).toBe(true);
    expect(isAttempt(b, starter, normCode(a))).toBe(true);
  });
});

describe('粘贴参考答案原文不能通过', () => {
  const sol = 'const x = 1;\nexport {};';
  it('看过答案、没重置：提交答案原文（忽略空白注释）会被拦下', () => {
    expect(isPastedSolution(sol, sol, { sawSol: true })).toBe(true);
    expect(isPastedSolution('const x=1 // 抄的\nexport {}', sol, { sawSol: true, rewrite: false })).toBe(true);
  });
  it('看过答案后按了重置（rewrite）：写出和答案相同的代码可以通过', () => {
    expect(isPastedSolution(sol, sol, { sawSol: true, rewrite: true })).toBe(false);
  });
  it('没看过答案：不拦', () => {
    expect(isPastedSolution(sol, sol, {})).toBe(false);
  });
  it('和答案不同：不拦', () => {
    expect(isPastedSolution('const x = 2', sol, { sawSol: true })).toBe(false);
  });
});

describe('fadedExample 半成品示例', () => {
  it('有人工挖空的版本就直接用它', () => {
    expect(fadedExample({ faded: '/* ✏️ 补 */', starter: 's', solution: 'x' })).toBe('/* ✏️ 补 */');
  });
  it('没有时：起始代码里已有的行、纯符号行、注释行保留，其余新行隔一行换成待补全标记', () => {
    const out = fadedExample({
      faded: '',
      starter: 'function App() {\n  return null;\n}',
      solution: 'function App() {\n  const [a, setA] = useState(0);\n  const b = a + 1;\n  const c = b + 1;\n  // 注释\n  return null;\n}',
    });
    expect(out.split('\n')).toEqual([
      'function App() {',
      '  /* ✏️ 补全这一行 */',
      '  const b = a + 1;',
      '  /* ✏️ 补全这一行 */',
      '  // 注释',
      '  return null;',
      '}',
    ]);
  });
});
