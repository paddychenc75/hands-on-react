import { useEffect, useState } from 'react';
import { PROGRESS_EVENT, disposePlayground, drillProgress, makeDrills } from '../../course/engine/index.ts';
import { useLesson } from '../lib/useLesson';
import { useSlot } from '../lib/useSlot';

/** 变式练习：正式练习之外的 2–3 道小任务。不影响“本课完成”。 */
export default function Drills() {
  const lesson = useLesson();
  const [stat, setStat] = useState({ done: 0, total: lesson?.drills?.length ?? 0 });
  // biome-ignore lint/correctness/useExhaustiveDependencies: 依赖是课 id
  useEffect(() => {
    if (!lesson?.drills) return;
    const calc = () => setStat(drillProgress(lesson));
    calc();
    window.addEventListener(PROGRESS_EVENT, calc);
    return () => window.removeEventListener(PROGRESS_EVENT, calc);
  }, [lesson?.id]);
  const { ref } = useSlot(l => makeDrills(l), {
    needsRuntime: true,
    libSources: l => (l.drills || []).flatMap(d => [d.starter, d.solution]),
    cleanup: w => w.querySelectorAll('.pg').forEach(pg => disposePlayground(pg as any)),
  });
  return (
    <section className="hoc">
      <div className="block-title" id="sec-drills">
        <div className="bt-h">变式练习</div>
        <span>
          同一个概念换几种情境，每道 3–8 分钟 · 已完成 {stat.done}/{stat.total} · 不影响“本课完成”
        </span>
      </div>
      <div ref={ref} className="hoc-slot" />
    </section>
  );
}
