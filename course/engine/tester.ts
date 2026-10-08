/* 练习检查器：给 exercise.test(t) 的工具。检查函数的写法见 AGENTS.md「练习检查」。 */
import type { Tester } from '../types.ts';
import { stripComments } from './exec.ts';
import type { Runtime } from './runtime.ts';
import { sleep } from './util.ts';

export class TestFail extends Error {}

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
  };
}
