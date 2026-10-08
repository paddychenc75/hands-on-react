/* 动手练习：任务说明 + 实验台 + "检查答案" + 提示阶梯（提示 → 半成品示例 → 参考答案）。 */
import type { Lesson } from '../types.ts';
import { maybeComplete } from './completion.ts';
import { explainError } from './logic/errors.ts';
import { LADDER, fadedExample, isAttempt, isPastedSolution, ladderButton, normCode } from './logic/ladder.ts';
import { runtimeOf } from './logic/runtime.ts';
import { esc } from './logic/text.ts';
import { makePlayground } from './playground.ts';
import { getRuntime } from './runtime.ts';
import { lp, save } from './store.ts';
import { TestFail, makeTester } from './tester.ts';
import { el, highlight, sleep, smooth } from './util.ts';

export function makeExercise(lesson: Lesson): HTMLDivElement {
  const ex = lesson.exercise;
  const p = lp(lesson.id);
  const wrap = el('div');
  wrap.appendChild(
    el(
      'div',
      { class: 'task' },
      '<span class="lbl">任务</span>' +
        ex.task +
        '<div class="task-rule">先独立尝试。每次改过代码后检查失败，就会多解锁一级帮助：提示 → 半成品示例 → 参考答案。</div>',
    ),
  );
  const pg = makePlayground({
    src: ex.starter,
    title: '你的代码',
    badge: 'EXERCISE',
    exercise: ex,
    lessonId: lesson.id,
    runtime: getRuntime(runtimeOf(lesson)),
  });
  const foot = el('div', { class: 'pg-foot' });
  const checkBtn = el('button', { class: 'btn sun', type: 'button' }, '✓ 检查答案');
  const hintBtn = el('button', { class: 'btn small', type: 'button' });
  const fadeBtn = el('button', { class: 'btn small', type: 'button' });
  const solBtn = el('button', { class: 'btn small', type: 'button' });
  foot.append(checkBtn, hintBtn, fadeBtn, solBtn, el('span', { class: 'kbd' }, 'Ctrl/⌘+Enter 运行 · Tab 缩进 · Esc 后按 Tab 离开编辑器'));
  const result = el('div', { class: 'result', role: 'status' });
  result.hidden = true;
  pg.append(foot, result);
  wrap.appendChild(pg);

  const show = (cls: string, html: string) => {
    result.className = 'result ' + cls;
    result.innerHTML = html;
    result.hidden = false;
  };
  const ladderButtons = [hintBtn, fadeBtn, solBtn];
  function gate() {
    LADDER.forEach((level, i) => {
      const { open, text } = ladderButton(level, p, Date.now());
      ladderButtons[i].disabled = !open;
      ladderButtons[i].textContent = text;
    });
  }
  gate();
  const gateTimer = setInterval(() => {
    if (!document.body.contains(wrap)) clearInterval(gateTimer);
    else gate();
  }, 20e3);
  if (p.ex)
    show(
      'ok',
      p.exHelp ? '✓ 你在看过参考答案后通过了这道练习。过几天不看答案再写一遍，才算真正会了。' : '✓ 你已通过这道练习。可以继续修改代码，随时再次检查。',
    );

  checkBtn.addEventListener('click', async () => {
    checkBtn.disabled = true;
    checkBtn.textContent = '检查中…';
    const code = pg._editor.value;
    try {
      if (isPastedSolution(code, ex.solution, p)) {
        show('hint', '这还是参考答案的原文。点“重置”，不看答案，自己从头写一遍再检查。写出来的过程才是练习本身。');
        return;
      }
      const res = pg._run();
      if (res.error) throw new TestFail('代码无法运行：' + explainError(res.error));
      await sleep(80);
      const err = pg._mount.querySelector(':scope > .pv-err');
      if (err) throw new TestFail(err.textContent);
      await ex.test(makeTester(pg._mount, pg._editor.value, res.exports, () => pg._runner.unpreventedSubmits, pg._runtime));
      if (p.sawSol && !p.ex) p.exHelp = p.rewrite ? 'rewrite' : 'solution';
      p.ex = true;
      save();
      gate();
      maybeComplete(lesson);
      show(
        'ok',
        p.exHelp === 'rewrite'
          ? '🎉 通过了。你看过答案后自己重写了一遍，这一步很有价值。过几天再不看答案写一次，检验是否真的记住了。'
          : p.exHelp
            ? '🎉 通过了。你看过参考答案，所以这道题会记为“借助答案完成”。过几天不看答案再写一遍，才算真正会了。'
            : '🎉 全部通过！做得好。',
      );
    } catch (e) {
      const counted = !p.ex && isAttempt(code, ex.starter, p.lastFail);
      if (counted) {
        p.fails = (p.fails || 0) + 1;
        p.lastFail = normCode(code);
        if (!p.firstFail) p.firstFail = Date.now();
      }
      save();
      gate();
      const next = counted && LADDER.find(level => level.need === p.fails);
      const note =
        !p.ex && !counted
          ? '<br><small>代码和起始代码或上次检查时一样，这次不计入解锁次数。先动手改一改。</small>'
          : next
            ? `<br><small>已解锁：${next.name}</small>`
            : '';
      show('no', '✗ ' + esc(e instanceof TestFail ? e.message : explainError(e)) + note);
    } finally {
      checkBtn.disabled = false;
      checkBtn.textContent = '✓ 检查答案';
      result.scrollIntoView({ block: 'nearest', behavior: smooth() });
    }
  });
  hintBtn.addEventListener('click', () => show('hint', '💡 ' + ex.hint));
  fadeBtn.addEventListener('click', () => {
    show(
      'hint',
      '这是参考答案的“半成品”：一部分关键代码已经给出，标着 ✏️ 的行要你自己补全。照着思路在编辑器里写出来，而不是复制。<div class="codeblock faded"><pre></pre></div>',
    );
    result.querySelector('pre').innerHTML = highlight(fadedExample(ex));
  });
  let solShown = false;
  solBtn.addEventListener('click', () => {
    if (!solShown) {
      solShown = true;
      p.sawSol = true;
      p.rewrite = false;
      pg._editor.value = ex.solution;
      p.code = ex.solution;
      save();
      pg._run();
      show('hint', '参考答案已载入编辑器。读懂它之后，点“重置”，不看答案再从头写一遍，再检查。直接提交答案原文不算通过。');
    }
  });
  return wrap;
}
