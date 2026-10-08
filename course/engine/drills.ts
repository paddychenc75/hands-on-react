/* 变式练习：正式练习之外的小任务。每道有自己的实验台和“检查答案”，进度单独记在 LessonProgress.dr，
   不影响“本课完成”（completion.ts 只看随堂测验和正式练习）。提示规则见 logic/drills.ts：失败 1 次给提示，失败 2 次可看参考答案。 */
import type { Drill, Lesson } from '../types.ts';
import { explainError } from './logic/errors.ts';
import { DRILL_LADDER, drillStat, drillLadderButton } from './logic/drills.ts';
import { isAttempt, isPastedSolution, normCode } from './logic/ladder.ts';
import { libsInSource } from './logic/runtime.ts';
import { esc } from './logic/text.ts';
import { makePlayground } from './playground.ts';
import { loadLibs } from './runtime.ts';
import { paintFinish } from './completion.ts';
import { drillRec, emitProgress, lp, save } from './store.ts';
import { EnvFail, TestFail, makeTester } from './tester.ts';
import { el, sleep, smooth, toast } from './util.ts';

/** 变式练习的完成情况，供跳转条和课末显示 */
export const drillProgress = (lesson: Lesson) => drillStat(lp(lesson.id).dr, (lesson.drills || []).length);

function makeDrill(lesson: Lesson, d: Drill, i: number): HTMLDivElement {
  const total = lesson.drills.length;
  const rec = () => drillRec(lesson.id, i);
  const wrap = el('div', { class: 'drill', id: 'drill-' + (i + 1) });
  const badge = el('span', { class: 'drill-no' }, '');
  const head = el('div', { class: 'drill-head' });
  head.append(badge, el('b', {}, esc(d.title)));
  const paintBadge = () => {
    badge.textContent = `变式 ${i + 1}/${total}` + (rec().ok ? ' ✓' : '');
  };
  paintBadge();
  wrap.append(head, el('div', { class: 'task' }, '<span class="lbl">任务</span>' + d.task));
  const pg = makePlayground({ src: d.starter, title: '你的代码', badge: 'DRILL', exercise: d, lessonId: lesson.id, record: rec });
  const foot = el('div', { class: 'pg-foot' });
  const checkBtn = el('button', { class: 'btn sun', type: 'button' }, '✓ 检查答案');
  const hintBtn = el('button', { class: 'btn small', type: 'button' });
  const solBtn = el('button', { class: 'btn small', type: 'button' });
  foot.append(checkBtn);
  if (d.hint) foot.append(hintBtn);
  foot.append(solBtn);
  const result = el('div', { class: 'result', role: 'status' });
  result.hidden = true;
  pg.append(foot, result);
  wrap.appendChild(pg);
  const show = (cls: string, html: string) => {
    result.className = 'result ' + cls;
    result.innerHTML = html;
    result.hidden = false;
  };
  const gate = () => {
    [hintBtn, solBtn].forEach((b, k) => {
      const level = DRILL_LADDER[k];
      const { open, text } = drillLadderButton(level, rec());
      b.disabled = !open;
      b.textContent = text;
    });
  };
  gate();
  if (rec().ok) show('ok', '✓ 你已通过这道变式练习。可以继续修改代码，随时再次检查。');

  checkBtn.addEventListener('click', async () => {
    checkBtn.disabled = true;
    checkBtn.textContent = '检查中…';
    const code = pg._editor.value;
    const p = rec();
    try {
      if (isPastedSolution(code, d.solution, p)) {
        show('hint', '这还是参考答案的原文。点“重置”，不看答案，自己从头写一遍再检查。');
        return;
      }
      await loadLibs(libsInSource(code));
      const res = pg._run();
      if (res.error) throw new TestFail('代码无法运行：' + explainError(res.error));
      await sleep(80);
      const err = pg._mount.querySelector(':scope > .pv-err');
      if (err) throw new TestFail(err.textContent);
      await d.test(makeTester(pg._mount, pg._editor.value, res.exports, () => pg._runner.unpreventedSubmits, pg._runtime));
      if (p.sawSol && !p.ok) p.exHelp = p.rewrite ? 'rewrite' : 'solution';
      const first = !p.ok;
      p.ok = true;
      save();
      gate();
      paintBadge();
      emitProgress();
      paintFinish(lesson); // 课末的掌握标准条显示变式进度
      if (first) toast(`变式 ${i + 1}/${total} 通过`);
      show('ok', p.exHelp ? '🎉 通过了（借助了参考答案）。过几天不看答案再写一遍，才算真正会了。' : '🎉 通过了！');
    } catch (e) {
      if (e instanceof EnvFail) {
        show('hint', esc(e.message));
        return;
      }
      const counted = !p.ok && isAttempt(code, d.starter, p.lastFail);
      if (counted) {
        p.fails = (p.fails || 0) + 1;
        p.lastFail = normCode(code);
      }
      save();
      gate();
      const next = counted && DRILL_LADDER.find(level => level.need === p.fails);
      const note =
        !p.ok && !counted
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
  hintBtn.addEventListener('click', () => show('hint', '💡 ' + d.hint));
  let solShown = false;
  solBtn.addEventListener('click', () => {
    if (solShown) return;
    solShown = true;
    const p = rec();
    p.sawSol = true;
    p.rewrite = false;
    pg._editor.value = d.solution;
    p.code = d.solution;
    save();
    pg._run();
    show('hint', '参考答案已载入编辑器。读懂它之后，点“重置”，不看答案再写一遍，再检查。直接提交答案原文不算通过。');
  });
  (wrap as any)._pg = pg;
  return wrap;
}

export function makeDrills(lesson: Lesson): HTMLDivElement {
  const wrap = el('div', { class: 'drills' });
  lesson.drills.forEach((d, i) => wrap.appendChild(makeDrill(lesson, d, i)));
  return wrap;
}
