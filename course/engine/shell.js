/* 引擎的"外壳"部分：由旧 src/app.js 的 renderReview / renderCheck / buildHeroTree / offerResume 等照搬而来。
   逻辑不变，只做两处适配：
   1. 页面标题、面包屑等静态部分交给 MDX 和 React 组件；这里只返回会随进度变化的部分。
   2. 旧的 refreshChrome() 换成 emitProgress() 事件；站内链接 "#id" 换成带 base 的真实地址。 */
import { progress, save, isDone, emitProgress, STORE_KEY } from './store.js';
import { el, esc, toast, smooth } from './util.js';
import { LESSONS } from '../registry.js';
import { STAGES } from '../stages.js';
import { HOME_HREF, lessonHref, reviewHref, checkHref } from '../site.js';
import { makeQuestion, shuffled, srsAll, srsRecord, cardOf, dueCards, learnedCards, srcLine, DAY } from './engine.js';

/* ---------- 复习页 ---------- */
export function makeReview() {
  const stageArea = el('div');
  const learned = learnedCards();
  const start = (queue, label) => {
    let i = 0, right = 0;
    const step = () => {
      stageArea.innerHTML = '';
      if (i >= queue.length) {
        const nextDue = Object.values(srsAll()).map(c => c.due).filter(d => d > Date.now()).sort((a, b) => a - b)[0];
        stageArea.appendChild(el('div', { class: 'done-card' }, `<b>${label}完成：答对 ${right} / ${queue.length}</b><span>${nextDue ? '下一批题目将在 ' + Math.max(1, Math.round((nextDue - Date.now()) / DAY)) + ' 天后到期。' : ''}答错的题明天会再出现。</span><a class="btn primary" href="${HOME_HREF}">回到课程地图</a>`));
        emitProgress(); return;
      }
      const c = queue[i];
      stageArea.appendChild(el('div', { class: 'rv-progress' }, `<span>${label} · 第 ${i + 1} / ${queue.length} 题</span><div class="bar"><i style="width:${i / queue.length * 100}%"></i></div>`));
      const nextBtn = el('button', { class: 'btn primary', type: 'button' }, i + 1 < queue.length ? '下一题 →' : '查看结果');
      nextBtn.hidden = true;
      nextBtn.addEventListener('click', () => { i++; step(); });
      stageArea.appendChild(makeQuestion(c.item, '复习', { shuffle: true, footer: srcLine(c), onAnswer: (oi, ok) => { if (ok) right++; srsRecord(c.key, ok); nextBtn.hidden = false; nextBtn.focus(); } }));
      stageArea.appendChild(nextBtn);
    };
    step();
  };
  const due = dueCards();
  if (!learned.length) {
    stageArea.appendChild(el('div', { class: 'done-card' }, `<b>还没有需要复习的题目</b><span>完成任意一课的随堂测验后，题目会自动进入这里。</span><a class="btn primary" href="${lessonHref(LESSONS[0].id)}">开始第一课</a>`));
  } else if (due.length) {
    start(shuffled(due.length).map(i => due[i]).slice(0, 20), '今日复习');
  } else {
    const box = el('div', { class: 'done-card' }, `<b>今天该复习的都复习完了 🎉</b><span>你已学过 ${learned.length} 道题。想多练一会儿，可以做一组从所有学过的课里随机抽取的混合题，结果同样会影响复习安排。</span>`);
    const extra = el('button', { class: 'btn primary', type: 'button' }, '来 10 道混合练习');
    extra.addEventListener('click', () => start(shuffled(learned.length).slice(0, 10).map(i => learned[i]), '混合练习'));
    box.appendChild(extra);
    stageArea.appendChild(box);
  }
  return stageArea;
}

/* ---------- 阶段测验 ---------- */
export function makeCheck(si) {
  const s = STAGES[si];
  const ls = LESSONS.filter(l => l.stage === si);
  const area = el('div', { class: 'quiz' });
  const COOL = 30 * 60e3;
  const run = () => {
    area.innerHTML = '';
    const st0 = (progress.__stage = progress.__stage || {});
    const rec0 = st0[si] = st0[si] || {};
    let notice = '';
    if (rec0.pending) {
      // 上次答到一半就离开：按已答的题计分，未答的算错
      const pd = rec0.pending; delete rec0.pending;
      rec0.last = Math.round(pd.right / pd.n * 100); rec0.passed = false; rec0.failedAt = pd.at; rec0.weak = pd.weak || [];
      save(); emitProgress();
      notice = `上次测验答了 ${pd.answered}/${pd.n} 题就离开了，按“未通过”记录（没答的题算错）。`;
    }
    const wait = rec0.failedAt ? rec0.failedAt + COOL - Date.now() : 0;
    if (wait > 0 && !rec0.passed) {
      if (notice) area.appendChild(el('p', { class: 'lesson-sum' }, notice));
      // 没通过后马上重测，测的是短期记忆。先复习，隔一段时间再测
      const box = el('div', { class: 'done-card' }, `<b>先复习，${Math.ceil(wait / 60e3)} 分钟后可以重测</b><span>上次答对 ${rec0.last || 0}%。马上重测，测到的多半是刚看过的答案。先回看这些课，做一做<a href="${reviewHref()}">今日复习</a>，再来测。</span>${(rec0.weak || []).length ? '<div class="wrong-list">需要加强：' + rec0.weak.map(id => { const l = LESSONS.find(x => x.id === id); return l ? `<a href="${lessonHref(l.id)}">${esc(l.title)}</a>` : ''; }).join('、') + '</div>' : ''}`);
      area.appendChild(box);
      return;
    }
    if (rec0.passed && rec0.passedAt && Date.now() - rec0.passedAt > 35 * DAY) {
      area.appendChild(el('p', { class: 'lesson-sum' }, `你在 ${Math.floor((Date.now() - rec0.passedAt) / DAY)} 天前通过了这个阶段。隔了这么久还能答对，才说明真的记住了。建议再测一次。`));
    }
    area.appendChild(el('p', { class: 'check-rule' }, '交卷模式：每题选一次，全部答完后统一显示对错和解析。中途离开按未通过记录。'));
    // 一半是课内见过的题，一半是只在阶段测验出现的新题，检验能否迁移
    const pool = [], fresh = [];
    ls.forEach(l => (l.quiz || []).forEach((item, qi) => pool.push(cardOf(l.id + '#' + qi))));
    ls.forEach(l => (l.checkOnly || []).forEach((item, qi) => fresh.push(cardOf(l.id + '#c' + qi))));
    const N = 12, srs = srsAll();
    const nFresh = Math.min(8, fresh.length);
    // 新题里优先抽还没见过的
    const freshOrder = shuffled(fresh.length).map(i => fresh[i]).sort((a, b) => (srs[a.key] ? 1 : 0) - (srs[b.key] ? 1 : 0));
    const mixed = [...freshOrder.slice(0, nFresh), ...shuffled(pool.length).slice(0, N - nFresh).map(i => pool[i])];
    const picks = shuffled(mixed.length).map(i => mixed[i]);
    let answered = 0, right = 0; const wrong = new Set(), wrongQ = [], qels = [];
    picks.forEach((c, i) => { const qel = makeQuestion(c.item, String(i + 1), {
      shuffle: true, footer: srcLine(c), defer: true,
      onAnswer: (oi, ok) => {
        answered++; if (ok) right++; else { wrong.add(c.l); wrongQ.push(i); }
        srsRecord(c.key, ok);
        if (answered === picks.length) { finish(); return; }
        rec0.pending = { n: picks.length, answered, right, at: Date.now(), weak: [...wrong].map(l => l.id) }; save();
      }
    }); qel.id = 'cq-' + i; qels.push(qel); area.appendChild(qel); });
    function finish() {
      qels.forEach(q => q._reveal());
      const pct = Math.round(right / picks.length * 100);
      const st = (progress.__stage = progress.__stage || {});
      const rec = st[si] || {};
      delete rec.pending;
      rec.best = Math.max(rec.best || 0, pct); rec.last = pct;
      // 以最近一次为准：通过过、后来没通过，也要重新复习
      if (pct >= 80) { rec.passed = true; rec.passedAt = Date.now(); delete rec.failedAt; } else { rec.passed = false; rec.failedAt = Date.now(); rec.weak = [...wrong].map(l => l.id); }
      st[si] = rec; save(); emitProgress();
      const pass = pct >= 80;
      const box = el('div', { class: 'done-card ' + (pass ? 'pass' : '') }, `<b>${pass ? '✓ 已掌握 ' + s.name + '阶段' : '还差一点'}：答对 ${right}/${picks.length}（${pct}%）</b><span>${pass ? (si === STAGES.length - 1 ? `你已完成全部阶段。下一步：去<a href="${lessonHref('portfolio')}">毕业设计</a>做出自己的作品集。` : '可以放心进入下一阶段了。') : '先读懂下面每道错题的解析，再回看对应的课。30 分钟后才能重测，隔一段时间再测，比马上重测更能检验是否真的掌握。'}</span>${wrongQ.length ? '<div class="wrong-list">答错的题：' + wrongQ.map(i => `<a href="${checkHref(si)}" data-jump="cq-${i}">第 ${i + 1} 题</a>`).join('、') + '</div>' : ''}${wrong.size ? '<div class="wrong-list">需要加强：' + [...wrong].map(l => `<a href="${lessonHref(l.id)}">${esc(l.title)}</a>`).join('、') + '</div>' : ''}`);
      if (pass) {
        const again = el('button', { class: 'btn', type: 'button' }, '换一组题再测');
        again.addEventListener('click', () => { run(); window.scrollTo(0, 0); });
        box.appendChild(again);
      }
      area.appendChild(box);
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  run();
  return area;
}

/* ---------- 首页：可点击的组件树 ---------- */
export function buildHeroTree() {
  const nodes = [
    { id: 'App', x: 200, y: 30, p: null },
    { id: 'Header', x: 90, y: 110, p: 'App' },
    { id: 'TodoList', x: 310, y: 110, p: 'App' },
    { id: 'Logo', x: 40, y: 190, p: 'Header' },
    { id: 'Search', x: 140, y: 190, p: 'Header' },
    { id: 'Item', x: 250, y: 190, p: 'TodoList', key: 'Item1' },
    { id: 'Item', x: 370, y: 190, p: 'TodoList', key: 'Item2' },
  ];
  nodes.forEach(n => { n.k = n.key || n.id; n.renders = 1; });
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '-14 0 448 230'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', '组件树示意，点击节点查看重新渲染范围');
  nodes.forEach(n => {
    if (!n.p) return;
    const par = nodes.find(x => x.k === n.p);
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('class', 'tedge');
    path.setAttribute('d', `M${par.x},${par.y + 18} C${par.x},${(par.y + n.y) / 2} ${n.x},${(par.y + n.y) / 2} ${n.x},${n.y - 18}`);
    svg.appendChild(path);
  });
  nodes.forEach(n => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'tnode'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', n.id + ' 调用 set 函数');
    g.innerHTML = `<rect x="${n.x - 44}" y="${n.y - 18}" width="88" height="36" rx="9"></rect><text x="${n.x}" y="${n.y - 1}">&lt;${n.id}&gt;</text><text class="rc" x="${n.x}" y="${n.y + 12}">渲染 1 次</text>`;
    n.g = g; svg.appendChild(g);
    const fire = () => {
      const hit = [];
      const walk = (k) => { const nn = nodes.find(x => x.k === k); hit.push(nn); nodes.filter(x => x.p === k).forEach(c => walk(c.k)); };
      walk(n.k);
      hit.forEach((h, i) => setTimeout(() => {
        h.renders++; h.g.querySelector('.rc').textContent = '渲染 ' + h.renders + ' 次';
        h.g.classList.remove('flash'); void h.g.getBBox(); h.g.classList.add('flash');
      }, i * 90));
    };
    g.addEventListener('click', fire);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
  });
  return svg;
}

/* ---------- 阅读位置 ---------- */
const POS_KEY = STORE_KEY + ':pos';
function readPos() { try { return JSON.parse(localStorage.getItem(POS_KEY) || '{}') || {}; } catch (e) { return {}; } }
export function offerResume(id) {
  const y = readPos()[id];
  if (!y || y < 600) return;
  const total = document.documentElement.scrollHeight - innerHeight;
  if (total < 1200) return;
  toast('上次读到这一课的 ' + Math.min(99, Math.round(y / total * 100)) + '% 处。', 8000, '从上次的位置继续', () => window.scrollTo({ top: y, behavior: smooth() }));
}
export function savePos(id) {
  try { const pos = readPos(); pos[id] = Math.round(scrollY); localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch (e) {}
}

/* ---------- 侧栏与顶栏要显示的数字 ---------- */
export const doneCount = () => LESSONS.filter(l => isDone(l.id)).length;
export const stageCount = (si) => { const ls = LESSONS.filter(l => l.stage === si); return [ls.filter(l => isDone(l.id)).length, ls.length]; };
export const dueCount = () => dueCards().length;
