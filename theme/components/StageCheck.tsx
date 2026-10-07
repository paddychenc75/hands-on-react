import { makeCheck } from '../../course/engine/index.ts';
import { STAGES } from '../../course/stages.ts';
import { useDomSlot } from '../lib/useDomSlot';

/** 阶段测验页：标题由 MDX 提供，这里是面包屑、说明和题目区（引擎 makeCheck） */
export default function StageCheck({ stage }: { stage: number }) {
  const s = STAGES[stage];
  const ref = useDomSlot(() => makeCheck(stage), [stage]);
  return (
    <div className="hoc">
      <div className="crumb"><span className="tag">{s.no} · {s.name}</span><span>阶段测验</span></div>
      <p className="lesson-sum">每次 12 题，从本阶段所有课程中抽取。其中 8 道是课内没出现过的读代码题，优先抽你还没见过的，检验你能否举一反三。答对 10 题（80% 以上）视为掌握本阶段。不翻笔记作答，答错的题会自动加入复习队列。</p>
      <div ref={ref} className="hoc-slot" />
    </div>
  );
}
