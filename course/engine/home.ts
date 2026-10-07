/* 首页的可点击组件树示意图（点一个节点，模拟它调用了 set 函数：它和它的后代都重新渲染）。 */
interface TreeNode {
  id: string;
  x: number;
  y: number;
  p: string | null;
  key?: string;
  k?: string;
  renders?: number;
  g?: SVGGElement;
}

export function buildHeroTree(): SVGSVGElement {
  const nodes: TreeNode[] = [
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
      const hit: TreeNode[] = [];
      const walk = (k: string) => { const nn = nodes.find(x => x.k === k); hit.push(nn); nodes.filter(x => x.p === k).forEach(c => walk(c.k)); };
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
