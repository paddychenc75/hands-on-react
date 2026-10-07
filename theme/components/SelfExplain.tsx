import { makeSelfExplain } from '../../course/engine/index.ts';
import { useSlot } from '../lib/useSlot';

export default function SelfExplain() {
  const { ref } = useSlot(l => makeSelfExplain(l));
  return (
    <section className="hoc">
      <div className="block-title" id="sec-self">
        <div className="bt-h">用自己的话讲一遍</div>
        <span>能讲清楚，才算真的懂了</span>
      </div>
      <div ref={ref} className="hoc-slot" />
    </section>
  );
}
