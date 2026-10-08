import { useEffect } from 'react';
import { Link } from '@rspress/core/theme';
import { paintFinish } from '../../course/engine/index.ts';
import { LESSONS } from '../../course/registry.ts';
import { STAGES } from '../../course/stages.ts';
import { useLesson } from '../lib/useLesson';

/** 掌握标准 + 上一课 / 下一课（只保留这一套，Rspress 自带的上下页已隐藏）+ 阶段测验入口 */
export default function LessonFooter() {
  const lesson = useLesson();
  // biome-ignore lint/correctness/useExhaustiveDependencies: 只在换课时重画；lesson 对象在同一课里不变，用 id 比较更稳
  useEffect(() => {
    if (lesson) paintFinish(lesson.id);
  }, [lesson?.id]);
  if (!lesson) return null;
  const i = LESSONS.findIndex((l: any) => l.id === lesson.id);
  const prev = LESSONS[i - 1],
    next = LESSONS[i + 1];
  const stage = STAGES[lesson.stage];
  const lastOfStage = LESSONS.filter((l: any) => l.stage === lesson.stage).pop() === lesson;
  return (
    <div className="hoc">
      <div id="finish" className="finish" />
      <nav className="pager" aria-label="课程翻页">
        {prev && (
          <Link href={'/lessons/' + prev.id}>
            <small>← 上一课</small>
            <b>{prev.title}</b>
          </Link>
        )}
        {next ? (
          <Link href={'/lessons/' + next.id} className="next">
            <small>下一课 →</small>
            <b>{next.title}</b>
          </Link>
        ) : (
          <Link href="/" className="next">
            <small>全部学完了</small>
            <b>回到课程地图</b>
          </Link>
        )}
      </nav>
      <p className="kbd-hint">提示：不在输入框里时，按键盘 ← 和 → 可以翻到上一课和下一课。</p>
      {lastOfStage && (
        <Link className="stage-cta" href={'/check/' + lesson.stage}>
          <b>本阶段学完了，来做 {stage.name} 阶段测验 →</b>
          <span>题目混合了本阶段所有课程，答对 80% 才算掌握。</span>
        </Link>
      )}
    </div>
  );
}
