/* 实验台错误信息的中文解释（纯函数）。 */
import { HOOK_NAMES } from '../exec.ts';

export function explainError(err: any): string {
  let msg = (err && err.message) || String(err);
  const m = msg.match(/^(\w+) is not defined/);
  if (m && HOOK_NAMES.includes(m[1])) msg += `\n提示：是否忘了 import { ${m[1]} } from 'react'？`;
  if (/Unexpected token|Unterminated|Expected corresponding JSX closing tag|Adjacent JSX/.test(msg)) msg = '语法错误：' + msg;
  return msg;
}
