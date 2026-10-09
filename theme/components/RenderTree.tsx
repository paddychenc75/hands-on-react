import { Link } from '@rspress/core/theme';
import { memo as reactMemo, useEffect, useRef } from 'react';
import { HERO_H, HERO_NODES, HERO_W, accName, attachHeroTree } from '../../course/engine/index.ts';

const nodeById = (id: string) => HERO_NODES.find(n => n.id === id);

/** 连线：从父节点底边的曲线流到子节点顶边 */
const edgePath = (id: string) => {
  const c = nodeById(id);
  const p = nodeById(c.parent);
  const my = (p.y + c.y) / 2;
  return `M${p.x},${p.y + 20} C${p.x},${my} ${c.x},${my} ${c.x},${c.y - 20}`;
};

function Shield() {
  return (
    <svg viewBox="0 0 12 14" width="9" height="10" aria-hidden="true" focusable="false">
      <path d="M6 1 11 3v4.2c0 3-2.2 5-5 5.8C3.2 12.2 1 10.2 1 7.2V3z" fill="currentColor" />
    </svg>
  );
}

/** 课文里的组件树示意图（MDX 里写 <RenderTree />，memo 默认打开的写 <RenderTree memo />）：服务端先渲染出静态版本（节点、连线、开关都在 HTML 里，不会布局跳动），
 *  挂载后再按需加载动画模块去“激活”它。激活后树里的内容由动画模块直接改 DOM，React 不再管，所以用 memo 保证不重渲染。 */
function RenderTreeInner({ memo = false }: { memo?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    return root ? attachHeroTree(root) : undefined;
  }, []);
  return (
    <div className="hoc tree-card">
      <div className={memo ? 'hero-tree memo-on' : 'hero-tree'} ref={ref} data-demo-key={memo ? 'hoc-hero-demo-memo' : undefined}>
        <p className="ht-title">点一个组件，模拟它调用了 set 函数</p>
        {/* biome-ignore lint/a11y/useSemanticElements: 要保持 aspect-ratio 和绝对定位的布局，不用 fieldset */}
        <div className="ht-stage" role="group" aria-label="组件树示意：App 下面是 Header 和 TodoList，TodoList 下面是两个 Item，每个 Item 里有一个 Checkbox">
          <svg className="ht-edges" viewBox={`0 0 ${HERO_W} ${HERO_H}`} aria-hidden="true" focusable="false">
            {HERO_NODES.filter(n => n.parent).map(n => (
              <g key={n.id} data-edge={n.id}>
                <path className="tedge" d={edgePath(n.id)} />
                <path className="tglow" d={edgePath(n.id)} pathLength={1} />
                <path className="tpulse" d={edgePath(n.id)} pathLength={1} />
              </g>
            ))}
          </svg>
          {HERO_NODES.map(n => (
            <button
              key={n.id}
              type="button"
              className="tnode"
              data-id={n.id}
              data-memoizable={n.memoizable ? '1' : undefined}
              style={{ left: `${(n.x / HERO_W) * 100}%`, top: `${(n.y / HERO_H) * 100}%` }}
              aria-label={accName(HERO_NODES, n.id, 1, false)}
            >
              <span className="nm">{n.label}</span>
              <span className="rc">
                渲染 <span className="n">1</span> 次
              </span>
              <span className="badge-memo" aria-hidden="true">
                <Shield />
                memo
              </span>
              <span className="badge-skip" aria-hidden="true">
                跳过
              </span>
            </button>
          ))}
        </div>
        <p className="ht-note" aria-hidden="true">
          点任意组件：它和它的所有后代会重新渲染，兄弟和祖先不受影响。
        </p>
        <p className="ht-live" role="status" aria-live="polite" />
        <div className="ht-controls">
          <label className="ht-switch">
            <input className="ht-memo-input" type="checkbox" disabled defaultChecked={memo} />
            <span className="ht-track" aria-hidden="true" />
            <span>
              给 <code>&lt;Item&gt;</code> 包上 memo
            </span>
          </label>
          <Link className="ht-why" href="/lessons/performance">
            为什么？
          </Link>
          <button type="button" className="ht-reset" aria-disabled="true">
            重置计数
          </button>
        </div>
      </div>
    </div>
  );
}

const RenderTree = reactMemo(RenderTreeInner);
export default RenderTree;
