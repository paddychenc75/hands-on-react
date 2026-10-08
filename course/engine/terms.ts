/* 术语标注：每课中，术语第一次出现时加上虚线和释义。 */
import { GLOSSARY } from '../glossary.ts';
import { el } from './util.ts';

export function markTerms(root: HTMLElement): void {
  const terms = [...GLOSSARY].sort((a, b) => b.term.length - a.term.length);
  const skip = (n: Node) => n.parentElement.closest('code, pre, a, abbr, .pg, .codeblock, h1, h2, h3, h4, th, details.optional');
  terms.forEach(g => {
    const re = /^[A-Za-z]/.test(g.term) ? new RegExp('(?<![A-Za-z])' + g.term + '(?![A-Za-z])') : new RegExp(g.term);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode() as Text; n; n = walker.nextNode() as Text) {
      if (skip(n)) continue;
      const m = n.nodeValue.match(re);
      if (!m) continue;
      const after = n.splitText(m.index);
      after.splitText(g.term.length);
      const ab = el('abbr', { class: 'term', title: g.term + '（' + g.en + '）：' + g.def, tabindex: '0' });
      ab.textContent = g.term;
      after.replaceWith(ab);
      break;
    }
  });
}
