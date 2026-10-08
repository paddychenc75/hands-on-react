/* 练习检查器：给 exercise.test(t) 的工具。检查函数的写法见 AGENTS.md「练习检查」。 */
import type { Tester } from '../types.ts';
import { stripComments } from './exec.ts';
import type { Runtime } from './runtime.ts';
import { sleep } from './util.ts';

export class TestFail extends Error {}

export function makeTester(
  root: HTMLElement,
  rawSource: string,
  exports?: Record<string, any>,
  unpreventedSubmits: () => number = () => 0,
  runtime?: Pick<Runtime, 'React' | 'ReactDOM'>,
): Tester {
  const source = stripComments(rawSource);
  const q = (s: string) => root.querySelector(s);
  const qa = (s: string) => Array.from(root.querySelectorAll(s));
  const pick = (x: string | Element) => {
    const e = typeof x === 'string' ? q(x) : x;
    if (!e) throw new TestFail('找不到元素：' + x);
    return e as HTMLElement;
  };
  return {
    root,
    source,
    rawSource,
    exports: exports || {},
    // 这一课运行时的 React / ReactDOM。没传（单元测试）时退回 18 的全局
    React: runtime ? runtime.React : (globalThis as any).React,
    ReactDOM: runtime ? runtime.ReactDOM : (globalThis as any).ReactDOM,
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
  };
}
