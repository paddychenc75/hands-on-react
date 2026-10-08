/* 识别 React 19 开发版发出的警告（纯函数），把它整理成一行文字。样例是用真实的 React 19.3.0 实测的：
   - 19 的警告消息没有 "Warning: " 前缀，链接是 react.dev/link/…，组件栈不再拼进消息（有的警告改为附一段 DOM 树示意）。
       Each child in a list should have a unique "key" prop.%s%s See https://react.dev/link/warning-keys for more information.
     所以不能靠前缀识别。实验台的 React 19 是自己打的包（scripts/build-react19.mjs），包里的 console 是副本，
     React 通过它发出的 error / warn 会交给引擎：这些消息"出处"可靠，来自 React 自己；学习者的 console.error 走实验台的假 console，不会到这里。
     所以规则是：来自 React 包的消息，排除"错误报告"（它们由错误处理另外显示），其余都是警告。
   - 错误报告：被错误边界接住 → console.error("%o\n\n%s\n\n%s\n", error, "The above error occurred in the <X> component.", …)；
     没接住 → console.warn("%s\n\n%s\n", "An error occurred in the <X> component.", …)。 */

export interface ReactWarning {
  /** 英文原文，只取第一行 */
  msg: string;
  /** 常见警告的中文解释，没有就是空串 */
  zh: string;
}

/** 把 %s 换成参数。参数缺失时换成空串。 */
export function formatMessage(args: unknown[]): string {
  let i = 1;
  return String(args[0]).replace(/%s/g, () => String(args[i++] ?? ''));
}

/** 是不是 React 的"错误报告"（不是警告） */
export function isErrorReport(args: unknown[]): boolean {
  return args.some(a => typeof a === 'string' && /(^|\n)(The above error occurred in|An error occurred in) the </.test(a));
}

function explain(msg: string): string {
  return /unique "key" prop/.test(msg)
    ? '列表中的每个元素都需要唯一的 key。'
    : /`value` prop to a form field without an `onChange`/.test(msg)
      ? '输入框有 value 但没有 onChange，所以它是只读的。'
      : /Cannot update a component .* while rendering a different component/.test(msg)
        ? '不要在渲染期间更新另一个组件的 state。'
        : '';
}

/**
 * 一条来自 React 包的 console.error / console.warn 是不是警告。是就返回整理好的内容，不是返回 null。
 * 规则见文件开头的说明。
 */
export function reactWarning(args: unknown[]): ReactWarning | null {
  if (typeof args[0] !== 'string' || isErrorReport(args)) return null;
  const msg = formatMessage(args).split('\n')[0].trim();
  if (!msg) return null;
  return { msg, zh: explain(msg) };
}

/** 显示在实验台控制台里的那一行 */
export function warningLine(w: ReactWarning): string {
  return 'React 警告：' + (w.zh ? w.zh + '（' + w.msg + '）' : w.msg);
}
