/* ---------- DOM 小工具 ---------- */
import { esc } from './logic/text.ts';

export const $ = (s: string, r: ParentNode = document): HTMLElement => r.querySelector<HTMLElement>(s);
export const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string | EventListener> = {}, html?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k] as string;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k] as EventListener);
    else e.setAttribute(k, attrs[k] as string);
  }
  if (html !== undefined) e.innerHTML = html;
  return e;
}
export function highlight(src: string): string {
  try { return window.Prism.highlight(src, window.Prism.languages.jsx, 'jsx'); } catch (e) { return esc(src); }
}
let toastTimer: ReturnType<typeof setTimeout>;
// 提示条。可以带一个操作按钮，例如“撤销”。#toast 元素第一次用到时才创建
export function toast(msg: string, ms = 2200, actionLabel?: string, onAction?: () => void): void {
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
  clearTimeout(toastTimer); toastTimer = setTimeout(hide, ms);
}
export const smooth = (): ScrollBehavior => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
