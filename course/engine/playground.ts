/* 实验台：编辑器 + 预览 + 控制台，可带"先预测再运行"的预测题。 */
import type { Exercise, Predict } from '../types.ts';
import { makeEditor, type Editor } from './editor.ts';
import { seeded } from './logic/random.ts';
import { esc, fmtOpt } from './logic/text.ts';
import { Runner, getActiveRunner, installHooks, setActiveRunner } from './runner.ts';
import { lp, progress, save } from './store.ts';
import { el, smooth, toast } from './util.ts';

export interface PlaygroundOptions {
  src: string;
  title?: string;
  note?: string;
  badge?: string;
  exercise?: Exercise;
  lessonId?: string;
  predict?: Predict;
  predictKey?: string;
}
/** 实验台的根元素，上面挂着给练习检查和测试用的句柄 */
export type PlaygroundBox = HTMLDivElement & {
  _run: () => any;
  _editor: Editor;
  _runner: Runner;
  _mount: HTMLElement;
  _ran: boolean;
};

export function makePlayground({ src, title, note, badge = 'LIVE', exercise, lessonId, predict, predictKey }: PlaygroundOptions): PlaygroundBox {
  installHooks();
  const box = el('div', { class: 'pg wide' }) as PlaygroundBox;
  const head = el('div', { class: 'pg-head' });
  head.appendChild(
    el(
      'div',
      { class: 'pg-title' },
      `<span class="pg-badge${exercise ? ' ex' : predict ? ' pr' : ''}">${predict ? 'PREDICT' : badge}</span><span>${esc(title || '动手试试')}</span>`,
    ),
  );
  const runBtn = el('button', { class: 'btn small primary', type: 'button' }, '▶ 运行');
  const resetBtn = el('button', { class: 'btn small', type: 'button' }, '重置');
  head.append(resetBtn, runBtn);

  progress.__pred = progress.__pred || {};
  const preds = progress.__pred;
  let revealed = !predict || preds[predictKey] !== undefined;

  const body = el('div', { class: 'pg-body' });
  let timer: ReturnType<typeof setTimeout>;
  const savedCode = exercise && lessonId && progress[lessonId] && progress[lessonId].code;
  const editor = makeEditor(savedCode || src, v => {
    if (exercise && lessonId) {
      lp(lessonId).code = v;
      save();
    }
    if (!revealed) return;
    clearTimeout(timer);
    timer = setTimeout(run, 800);
  });
  const pvWrap = el('div', { class: 'preview-wrap' });
  pvWrap.appendChild(el('div', { class: 'preview-bar' }, '<i></i><i></i><i></i><span>预览</span>'));
  const mount = el('div', { class: 'preview' });
  pvWrap.appendChild(mount);
  body.append(editor.el, pvWrap);
  const cons = el('div', { class: 'console', 'aria-live': 'polite' });
  box.append(head, body, cons);
  const verdict = el('div', { class: 'predict-result' });
  verdict.hidden = true;
  if (predict) box.appendChild(verdict);
  // 说明里常常有答案，所以预测之前先藏起来
  const noteEl = note ? el('div', { class: 'pg-note' }, note) : null;
  if (noteEl) {
    noteEl.hidden = !revealed;
    box.appendChild(noteEl);
  }

  const runner = new Runner(mount, cons);
  function run() {
    if (!revealed) return {};
    clearTimeout(timer);
    setActiveRunner(runner);
    box._ran = true;
    return runner.run(editor.value, exercise && exercise.exports);
  }
  function showVerdict() {
    const chosen = preds[predictKey];
    const ok = chosen === predict.answer;
    verdict.className = 'predict-result ' + (ok ? 'ok' : 'no');
    verdict.innerHTML = `<b>${ok ? '✓ 预测正确。' : '✗ 和你预测的不一样。'}</b>你的预测是“${fmtOpt(predict.options[chosen])}”，实际结果是“${fmtOpt(predict.options[predict.answer])}”。${predict.explain}`;
    verdict.hidden = false;
  }

  if (!revealed) {
    // 先预测再运行：预览区先换成一道预测题
    mount.hidden = true;
    runBtn.disabled = true;
    const card = el('div', { class: 'predict' });
    card.innerHTML = `<span class="lbl">先预测，再运行</span><p>${predict.q}</p>`;
    const opts = el('div', { class: 'opts' });
    // 选项顺序按题目固定打乱，避免正确答案总在同一个位置
    const rnd = seeded(predictKey);
    const order = predict.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    order.forEach((oi, pos) => {
      const o = predict.options[oi];
      const b = el('button', { class: 'opt', type: 'button' }, `<span class="ol">${'ABCD'[pos]}</span><span>${fmtOpt(o)}</span>`);
      b.addEventListener('click', () => {
        preds[predictKey] = oi;
        save();
        opts.querySelectorAll<HTMLButtonElement>('.opt').forEach(x => {
          x.disabled = true;
          x.classList.toggle('picked', x === b);
        });
        const go = el('button', { class: 'btn primary', type: 'button' }, '▶ 运行，验证我的预测');
        go.addEventListener('click', () => {
          revealed = true;
          card.remove();
          mount.hidden = false;
          runBtn.disabled = false;
          if (noteEl) noteEl.hidden = false;
          run();
          showVerdict();
          verdict.scrollIntoView({ block: 'nearest', behavior: smooth() });
        });
        card.appendChild(go);
        go.focus();
      });
      opts.appendChild(b);
    });
    card.appendChild(opts);
    card.appendChild(el('small', {}, '先读代码，在脑子里“运行”一遍。猜错也没关系：猜错之后看到的答案，记得最牢。'));
    pvWrap.appendChild(card);
  } else if (predict) showVerdict();

  runBtn.addEventListener('click', run);
  resetBtn.addEventListener('click', () => {
    const before = editor.value;
    if (before === src) return;
    editor.value = src;
    // 看过答案后点重置，表示要自己重写一遍：之后写出和答案相同的代码也可以通过
    const wasRewrite = exercise && lessonId && lp(lessonId).rewrite;
    if (exercise && lessonId) {
      const q = lp(lessonId);
      delete q.code;
      if (q.sawSol) q.rewrite = true;
      save();
    }
    run();
    toast('代码已恢复成初始版本。', 6000, '撤销', () => {
      editor.value = before;
      if (exercise && lessonId) {
        const q = lp(lessonId);
        q.code = before;
        q.rewrite = wasRewrite;
        save();
      }
      run();
    });
  });
  editor.ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      run();
    }
  });
  box._run = run;
  box._editor = editor;
  box._runner = runner;
  box._mount = mount;
  box._ran = false;
  const obs = getObserver();
  if (obs) obs.observe(box);
  else setTimeout(() => box._run());
  return box;
}
// 实验台进入视野附近才第一次运行，长课打开更快（观察器在浏览器里第一次用到时才创建）
let pgObserver: IntersectionObserver | null | undefined;
const getObserver = () => {
  if (pgObserver === undefined) {
    pgObserver =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            entries => {
              entries.forEach(en => {
                if (en.isIntersecting) {
                  pgObserver.unobserve(en.target);
                  if (!(en.target as PlaygroundBox)._ran) (en.target as PlaygroundBox)._run();
                }
              });
            },
            { rootMargin: '400px 0px' },
          )
        : null;
  }
  return pgObserver;
};
/* 组件卸载时调用：对应原来换页时的 disposePlaygrounds，只是按单个实验台清理 */
export function disposePlayground(box: PlaygroundBox): void {
  if (pgObserver) pgObserver.unobserve(box);
  box._runner.unmount();
  if (getActiveRunner() === box._runner) setActiveRunner(null);
}
