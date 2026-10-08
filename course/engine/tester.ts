/* 练习检查器：给 exercise.test(t) 的工具。检查函数的写法见 AGENTS.md「练习检查」。 */
import type { Baseline, Tester } from '../types.ts';
import { stripComments } from './exec.ts';
import { makeInternals } from './logic/internals.ts';
import { type BaselineData, factorFrom, limitFor, timingFailMessage } from './logic/timing.ts';
import type { Runtime } from './runtime.ts';
import { sleep } from './util.ts';

export class TestFail extends Error {}
/** 计时类断言没过（t.timing）。t.retry 会自动重测一次 */
export class TimingFail extends TestFail {}
/** 环境原因（例如标签页在后台）：不是代码的错，不计入失败次数，不解锁提示 */
export class EnvFail extends TestFail {}

/** 基线用的固定计算量，和它在参考机（开发机）上的实测耗时。数字是用 Chrome 实测定的，见 AGENTS.md「练习检查」 */
const SPIN_N = 600_000;
const SPIN_REF_MS = 2;
const BACKGROUND = '检查期间这个标签页在后台，浏览器会放慢计时器，结果不可信。请保持本页在前台，再点一次“检查答案”（这次不计入失败次数）。';

const spin = (): number => {
  const s = performance.now();
  let x = 0;
  for (let i = 0; i < SPIN_N; i++) x += Math.sqrt(i);
  if (x < 0) console.log(x); // 防止循环被优化掉
  return performance.now() - s;
};
/** 一次消息往返的耗时，反映事件循环此刻有多忙 */
const roundTrip = (): Promise<number> =>
  new Promise(resolve => {
    const ch = new MessageChannel();
    const s = performance.now();
    ch.port1.onmessage = () => {
      ch.port1.close();
      resolve(performance.now() - s);
    };
    ch.port2.postMessage(0);
  });
async function measureBaseline(): Promise<BaselineData> {
  if (document.hidden) throw new EnvFail(BACKGROUND);
  const ms = Math.min(spin(), spin()); // 取较小的一次，排除偶发的抖动
  let lag = 0;
  for (let i = 0; i < 5; i++) lag = Math.max(lag, (await roundTrip()) - 2);
  return { factor: factorFrom(ms, SPIN_REF_MS), lag: Math.max(0, lag) };
}

export function makeTester(
  root: HTMLElement,
  rawSource: string,
  exports: Record<string, any> | undefined,
  unpreventedSubmits: () => number,
  runtime: Pick<Runtime, 'React' | 'ReactDOM' | 'libs'>,
): Tester {
  const source = stripComments(rawSource);
  const q = (s: string) => root.querySelector(s);
  const qa = (s: string) => Array.from(root.querySelectorAll(s));
  const pick = (x: string | Element) => {
    const e = typeof x === 'string' ? q(x) : x;
    if (!e) throw new TestFail('找不到元素：' + x);
    return e as HTMLElement;
  };
  let cached: Promise<Baseline> | null = null;
  const baseline = (): Promise<Baseline> => (cached ??= measureBaseline().then(b => ({ ...b, limit: (ms: number) => limitFor(ms, b) })));
  return {
    root,
    source,
    rawSource,
    exports: exports || {},
    // 实验台运行时的 React / ReactDOM（不要读全局的）
    React: runtime.React,
    ReactDOM: runtime.ReactDOM,
    libs: runtime.libs,
    unpreventedSubmits,
    q,
    qa,
    text: s => {
      const e = q(s);
      return e ? e.textContent.trim() : '';
    },
    byText: (tag, text) => qa(tag).find(e => e.textContent.trim() === text),
    click: async x => {
      pick(x).click();
      await sleep(40);
    },
    type: async (x, value) => {
      const e = pick(x);
      const proto = e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(e, value);
      e.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(40);
    },
    wait: sleep,
    assert: (cond, msg) => {
      if (!cond) throw new TestFail(msg);
    },
    baseline,
    timing: (cond, msg) => {
      if (!cond) throw new TimingFail(msg);
    },
    retry: async fn => {
      try {
        await fn();
        return;
      } catch (e) {
        if (!(e instanceof TimingFail)) throw e;
        if (document.hidden) throw new EnvFail(BACKGROUND);
      }
      await sleep(300);
      cached = null; // 重测前重新量一次基线
      try {
        await fn();
      } catch (e) {
        if (e instanceof TimingFail) {
          if (document.hidden) throw new EnvFail(BACKGROUND);
          throw new TestFail(timingFailMessage(e.message, await baseline()));
        }
        throw e;
      }
    },
    internals: makeInternals(runtime.React.version),
  };
}
