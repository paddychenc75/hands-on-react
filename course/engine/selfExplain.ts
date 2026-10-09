/* 自我解释：用自己的话讲一遍，至少 30 个有效字才能对照参考要点自查。 */
import type { Lesson } from '../types.ts';
import { SELF_EXPLAIN_MIN, effectiveLength } from './logic/selfExplain.ts';
import { lp, save } from './store.ts';
import { el } from './util.ts';

export function makeSelfExplain(lesson: Lesson): HTMLDivElement {
  const p = lp(lesson.id);
  const box = el('div', { class: 'selfx' });
  box.innerHTML =
    '<p>想象你要把这一课讲给一个刚学 React 的朋友听。不看上面的内容，用两三句话写下来：它解决什么问题，怎么用，最容易踩的坑是什么。写完再对照要点，看看漏了什么。</p>';
  const ta = el('textarea', {
    id: 'sx-' + lesson.id,
    rows: '4',
    placeholder: '例如：useEffect 用来……，依赖数组的作用是……，要注意……',
    'aria-label': '用自己的话总结本课',
  });
  ta.value = p.note || '';
  const MIN = SELF_EXPLAIN_MIN;
  const len = () => effectiveLength(ta.value);
  const reveal = el('button', { class: 'btn small', type: 'button' }, '写好了，对照本课要点');
  const count = el('small', { class: 'sx-count' });
  const sync = () => {
    const n = len();
    reveal.disabled = n < MIN;
    count.textContent = n < MIN ? `再写 ${MIN - n} 个字就能对照要点。` : '';
  };
  ta.addEventListener('input', () => {
    p.note = ta.value;
    save();
    sync();
  });
  const list = el('div', { class: 'sx-goals' });
  list.hidden = true;
  p.can = p.can || {};
  const kp =
    lesson.keyPoints && lesson.keyPoints.length
      ? '<b>参考要点</b><ol class="sx-keys">' +
        lesson.keyPoints.map(k => '<li>' + k + '</li>').join('') +
        '</ol><p class="sx-ask">你的总结里有没有讲到上面每一点？漏掉的，回到正文再看一遍，然后补进你的总结。</p>'
      : '';
  list.innerHTML =
    kp +
    '<b>逐条问自己：我能做到吗？</b>' +
    lesson.goals.map((g, i) => `<label><input type="checkbox" data-i="${i}" ${p.can[i] ? 'checked' : ''}> ${g}</label>`).join('') +
    '<small>没勾上的那条，回到正文对应的部分再看一遍，然后改写你上面的总结。</small>';
  list.addEventListener('change', e => {
    const t = e.target as HTMLInputElement;
    if (t.dataset.i) {
      p.can[t.dataset.i] = t.checked;
      save();
    }
  });
  reveal.addEventListener('click', () => {
    if (len() < MIN) return;
    list.hidden = false;
    reveal.hidden = true;
    count.textContent = '';
    p.sx = true;
    save();
  });
  if (p.sx || (len() >= MIN && p.note)) {
    list.hidden = false;
    reveal.hidden = true;
  } else sync();
  box.append(ta, reveal, count, list);
  // 跨设备同步时，另一台设备写的、被覆盖的笔记保留在 noteAlts：折叠显示，可以一键换成那一版。是旧版本前缀的（只是少写了几句）不显示
  const alts = ((p as { noteAlts?: string[] }).noteAlts || []).filter(a => a && a !== p.note && !(p.note || '').startsWith(a)).slice(0, 3);
  if (alts.length) {
    const d = el('details', { class: 'sx-alts' }, '<summary>另一台设备的版本（' + alts.length + '）</summary>');
    alts.forEach(a => {
      const row = el('div', { class: 'sx-alt' });
      row.append(el('p', {}, ''), el('button', { class: 'btn small', type: 'button' }, '用这一版'));
      row.firstElementChild.textContent = a;
      row.lastElementChild.addEventListener('click', () => {
        ta.value = a;
        ta.dispatchEvent(new Event('input'));
        d.remove();
      });
      d.appendChild(row);
    });
    box.appendChild(d);
  }
  return box;
}
