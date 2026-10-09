import { BASE } from '../../course/site.ts';
import { STAGES } from '../../course/stages.ts';
import { lessonNo, TOTAL_LESSONS } from '../../course/registry.ts';
import { useLesson } from '../lib/useLesson';

/** 面包屑（阶段、第几课、时长）+ 一句话摘要。标题 h1 由 MDX 里的 # 提供。 */
export default function LessonHeader() {
  const lesson = useLesson();
  if (!lesson) return null;
  const stage = STAGES[lesson.stage];
  return (
    <div className="hoc">
      <div className="crumb">
        <a className="tag" href={BASE + 'roadmap.html#stage-' + lesson.stage} title="在课程地图里查看这个阶段">
          {stage.no} · {stage.name}
        </a>
        <span>
          第 {lessonNo(lesson.id)} / {TOTAL_LESSONS} 课
        </span>
        <span>·</span>
        <span>约 {lesson.mins} 分钟</span>
        {lesson.drillMins ? <span className="dim">+ 变式练习约 {lesson.drillMins} 分钟</span> : null}
      </div>
      <p className="lesson-sum" dangerouslySetInnerHTML={{ __html: lesson.summary }} />
    </div>
  );
}
