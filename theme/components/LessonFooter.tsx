import { useEffect } from 'react';
import { Link } from '@rspress/core/theme';
import { paintFinish } from '../../course/engine/index.js';
import { LESSONS } from '../../course/registry.js';
import { useLesson } from '../lib/useLesson';

/** 掌握标准 + 上一课 / 下一课。上下课按注册表里已有的课排（全部转换后与课程顺序一致）。 */
export default function LessonFooter() {
  const lesson = useLesson();
  useEffect(() => { if (lesson) paintFinish(lesson); }, [lesson?.id]);
  if (!lesson) return null;
  const i = LESSONS.findIndex((l: any) => l.id === lesson.id);
  const prev = LESSONS[i - 1], next = LESSONS[i + 1];
  return (
    <div className="hoc">
      <div id="finish" className="finish" />
      <nav className="pager" aria-label="课程翻页">
        {prev && <Link href={'/lessons/' + prev.id}><small>← 上一课</small><b>{prev.title}</b></Link>}
        {next && <Link href={'/lessons/' + next.id} className="next"><small>下一课 →</small><b>{next.title}</b></Link>}
      </nav>
    </div>
  );
}
