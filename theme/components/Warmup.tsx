import { makeWarmup } from '../../course/engine/index.js';
import { useSlot } from '../lib/useSlot';

/** 课前热身：从前面学过的课里抽 2 道题（没有学过的内容就什么都不显示） */
export default function Warmup() {
  const { ref } = useSlot((l) => makeWarmup(l));
  return <div ref={ref} className="hoc hoc-warmup-slot" />;
}
