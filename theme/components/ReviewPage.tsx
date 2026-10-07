import { makeReview } from '../../course/engine/index.ts';
import { useDomSlot } from '../lib/useDomSlot';

/** 今日复习：标题由 MDX 提供，这里是面包屑、说明和题目区（引擎 makeReview） */
export default function ReviewPage() {
  const ref = useDomSlot(() => makeReview());
  return (
    <div className="hoc">
      <div className="crumb"><span className="tag">间隔复习</span></div>
      <p className="lesson-sum">每道题第一次答完后都会进入复习队列：答对了，间隔会从 1 天拉长到 3、7、16、35 天；答错了，它明天会再出现。不同课的题混在一起出，逼你先判断“这是哪个知识点”。</p>
      <div ref={ref} className="hoc-slot" />
    </div>
  );
}
