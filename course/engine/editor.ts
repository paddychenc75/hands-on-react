/* 代码编辑器（textarea 叠加高亮层）。 */
import { el, highlight } from './util.ts';

export interface Editor {
  el: HTMLDivElement;
  value: string;
  ta: HTMLTextAreaElement;
}

export function makeEditor(initial: string, onChange?: (value: string) => void): Editor {
  const wrap = el('div', { class: 'editor' });
  const pre = el('pre', { 'aria-hidden': 'true' });
  const ta = el('textarea', { spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', 'aria-label': '代码编辑器', id: 'ed-' + Math.random().toString(36).slice(2, 9) });
  ta.value = initial;
  wrap.append(pre, ta);
  const paint = () => { pre.innerHTML = highlight(ta.value) + (ta.value.endsWith('\n') ? ' ' : '') + '\n'; };
  paint();
  ta.addEventListener('input', () => { paint(); onChange && onChange(ta.value); });
  // 按 Esc 后，Tab 不再缩进，而是把焦点移出编辑器（键盘用户不会被困住）
  let tabEscapes = false;
  ta.addEventListener('focus', () => { tabEscapes = false; });
  ta.addEventListener('keydown', (e) => {
    const v = ta.value, s = ta.selectionStart, en = ta.selectionEnd;
    const lineStart = v.lastIndexOf('\n', s - 1) + 1;
    if (e.key === 'Escape') { tabEscapes = true; return; }
    if (e.key === 'Tab' && !tabEscapes && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      if (s === en && !e.shiftKey) return insert('  ');
      // 多行缩进或 Shift+Tab 反缩进：整块替换选中的行
      const endLine = v.indexOf('\n', en - (en > s && v[en - 1] === '\n' ? 1 : 0));
      const blockEnd = endLine < 0 ? v.length : endLine;
      const block = v.slice(lineStart, blockEnd);
      const next = e.shiftKey ? block.replace(/^ {1,2}/gm, '') : block.replace(/^/gm, '  ');
      ta.setSelectionRange(lineStart, blockEnd);
      insert(next);
      ta.setSelectionRange(lineStart, lineStart + next.length);
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.isComposing) {
      const line = v.slice(lineStart, s);
      let indent = line.match(/^\s*/)[0];
      const opens = /[{([]\s*$/.test(line) || /<[A-Za-z][^>]*[^/]>\s*$/.test(line);
      if (opens) indent += '  ';
      e.preventDefault();
      // 光标在一对括号或标签之间：闭合部分放到下一行
      if (opens && /^\s*([}\])]|<\/)/.test(v.slice(en))) {
        insert('\n' + indent + '\n' + indent.slice(2));
        const pos = ta.selectionStart - indent.length + 2 - 1;
        ta.setSelectionRange(pos, pos);
      } else insert('\n' + indent);
    } else if (/^[}\])]$/.test(e.key) && s === en && /^\s+$/.test(v.slice(lineStart, s)) && v.slice(lineStart, s).length >= 2) {
      // 在空行里输入闭合括号：自动减少一级缩进
      e.preventDefault();
      ta.setSelectionRange(s - 2, s);
      insert(e.key);
    } else if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
      // Ctrl/⌘ + /：注释或取消注释选中的行
      e.preventDefault();
      const endLine = v.indexOf('\n', en);
      const blockEnd = endLine < 0 ? v.length : endLine;
      const lines = v.slice(lineStart, blockEnd).split('\n');
      const all = lines.every(l => !l.trim() || /^\s*\/\//.test(l));
      const next = lines.map(l => !l.trim() ? l : all ? l.replace(/^(\s*)\/\/ ?/, '$1') : l.replace(/^(\s*)/, '$1// ')).join('\n');
      ta.setSelectionRange(lineStart, blockEnd);
      insert(next);
      ta.setSelectionRange(lineStart, lineStart + next.length);
    }
  });
  function insert(text: string) {
    // execCommand 会进入浏览器的撤销栈，Ctrl/⌘ + Z 可以撤销；不支持时退回 setRangeText
    ta.focus();
    let ok = false;
    try { ok = document.execCommand('insertText', false, text); } catch { ok = false; }
    if (!ok) {
      ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input'));
    }
  }
  return { el: wrap, get value() { return ta.value; }, set value(v) { ta.value = v; paint(); }, ta };
}
