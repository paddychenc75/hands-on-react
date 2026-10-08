import { makeExercise, disposePlayground } from '../../course/engine/index.ts';
import { useSlot } from '../lib/useSlot';

export default function Exercise() {
  const { ref } = useSlot(
    l => {
      const wrap = makeExercise(l);
      (wrap as any)._pg = wrap.querySelector('.pg');
      return wrap;
    },
    {
      needsRuntime: true,
      libSources: l => [l.exercise?.starter ?? '', l.exercise?.solution ?? ''],
      cleanup: w => {
        const pg = (w as any)._pg;
        if (pg) disposePlayground(pg);
      },
    },
  );
  return (
    <section className="hoc">
      <div className="block-title" id="sec-ex">
        <div className="bt-h">动手练习</div>
        <span>写代码 → 点“检查答案”，系统会像用户一样操作你的组件</span>
      </div>
      <div ref={ref} className="hoc-slot" />
    </section>
  );
}
