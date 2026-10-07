/* ---------- 工具（取自 src/app.js） ---------- */
export const $ = (s, r = document) => r.querySelector(s);
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
export function el(tag, attrs = {}, html) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  if (html !== undefined) e.innerHTML = html;
  return e;
}
export function highlight(src) {
  try { return window.Prism.highlight(src, window.Prism.languages.jsx, 'jsx'); } catch (e) { return esc(src); }
}
// 提示条。可以带一个操作按钮，例如“撤销”。#toast 元素第一次用到时才创建
export function toast(msg, ms = 2200, actionLabel, onAction) {
  let t = $('#toast');
  if (!t) { t = el('div', { class: 'toast', id: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(t); }
  t.textContent = msg;
  if (actionLabel) {
    const b = el('button', { class: 'toast-act', type: 'button' }, esc(actionLabel));
    b.addEventListener('click', () => { hide(); onAction(); });
    t.appendChild(b);
  }
  t.classList.add('show'); t.classList.toggle('has-act', !!actionLabel);
  function hide() { t.classList.remove('show', 'has-act'); }
  clearTimeout(toast._t); toast._t = setTimeout(hide, ms);
}
export const smooth = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
