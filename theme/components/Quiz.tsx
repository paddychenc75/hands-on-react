import { makeQuiz } from '../../course/engine/index.ts';
import { useSlot } from '../lib/useSlot';

export default function Quiz() {
  const { ref, lesson } = useSlot(l => makeQuiz(l));
  const n = lesson?.quizAnswers.length ?? 0;
  return (
    <section className="hoc">
      <div className="block-title" id="sec-quiz">
        <div className="bt-h">随堂测验</div>
        <span>{n} 题 · 选项顺序每次都会打乱 · 答错可以读完解析再答</span>
      </div>
      <div ref={ref} className="hoc-slot" />
    </section>
  );
}
