/* 题目（课内测验、课前热身、复习、阶段测验共用）。 */
import type { QuizItem } from '../types.ts';
import { fmtOpt } from './logic/text.ts';
import { shuffled } from './logic/random.ts';
import { el } from './util.ts';

export interface QuestionOptions {
  chosen?: number;
  shuffle?: boolean;
  onAnswer?: (oi: number, ok: boolean) => void;
  onRetry?: () => HTMLElement;
  footer?: string;
  hideAnswer?: boolean;
  defer?: boolean;
}
/** makeQuestion 返回的元素；交卷模式下 _reveal 统一显示对错和解析 */
export type QuestionElement = HTMLDivElement & { _reveal: () => void };

export function makeQuestion(
  item: QuizItem,
  label: string,
  { chosen, shuffle, onAnswer, onRetry, footer, hideAnswer, defer }: QuestionOptions = {},
): QuestionElement {
  const q = el('div', { class: 'q' }) as QuestionElement;
  q.appendChild(el('div', { class: 'q-text' }, `<span class="qn">${label}</span><span>${item.q}</span>`));
  const opts = el('div', { class: 'opts' });
  const order = shuffle ? shuffled(item.options.length) : [...item.options.keys()];
  const explain = el('div', { class: 'explain' });
  explain.hidden = true;
  const btns = new Map<number, HTMLButtonElement>();
  order.forEach((oi, pos) => {
    const b = el('button', { class: 'opt', type: 'button' }, `<span class="ol">${'ABCD'[pos]}</span><span>${fmtOpt(item.options[oi])}</span>`);
    b.addEventListener('click', () => {
      if (chosen !== undefined) return;
      chosen = oi;
      // 交卷模式：只记下选择，全部答完再统一显示对错和解析
      if (defer)
        btns.forEach((x, k) => {
          x.disabled = true;
          x.classList.toggle('picked', k === oi);
        });
      else paint();
      onAnswer && onAnswer(oi, oi === item.answer);
    });
    btns.set(oi, b);
    opts.appendChild(b);
  });
  function paint() {
    if (chosen === undefined) return;
    const ok = chosen === item.answer;
    // 可以重答时，答错只标出选错的项，不直接亮出正确答案
    const hide = !ok && hideAnswer && onRetry;
    btns.forEach((b, oi) => {
      b.disabled = true;
      b.classList.toggle('right', oi === item.answer && !hide);
      b.classList.toggle('wrong', oi === chosen && chosen !== item.answer);
    });
    explain.className = 'explain ' + (ok ? 'ok' : 'no');
    explain.innerHTML = hide
      ? `<b>不太对。</b>先别急着换选项。回到正文里和这道题相关的部分，想清楚你选的那项错在哪，再答一次。选项顺序会重新打乱。`
      : `<b>${ok ? '回答正确。' : '不太对，正确答案是 ' + 'ABCD'[order.indexOf(item.answer)] + '。'}</b>${item.explain}`;
    if (footer) explain.insertAdjacentHTML('beforeend', footer);
    if (!ok && onRetry) {
      const r = el('button', { class: 'btn small retry', type: 'button' }, hide ? '想清楚了，再答一次' : '读懂解析后，再答一次');
      r.addEventListener('click', () => q.replaceWith(onRetry()));
      explain.appendChild(r);
    }
    explain.hidden = false;
  }
  if (!defer) paint();
  q._reveal = () => {
    btns.forEach(x => x.classList.remove('picked'));
    paint();
  };
  q.append(opts, explain);
  return q;
}
