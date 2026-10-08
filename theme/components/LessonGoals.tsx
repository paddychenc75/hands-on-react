import { useEffect, useState } from 'react';
import { progress, PROGRESS_EVENT } from '../../course/engine/index.ts';
import { drillStat } from '../../course/engine/logic/drills.ts';
import { useLesson } from '../lib/useLesson';

const smooth = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth') as ScrollBehavior;

/** 学习目标 + “本课：正文 / 随堂测验 / 动手练习 / 用自己的话讲一遍”跳转（完成的打勾）。
 *  勾选状态读进度，所以只在浏览器挂载后更新（服务端渲染和首次水合时一律未完成，避免水合不一致）。 */
export default function LessonGoals() {
  const lesson = useLesson();
  const [ok, setOk] = useState<Record<string, boolean>>({});
  const [dr, setDr] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: 依赖是课 id：同一课里 lesson 不变，进度变化靠 PROGRESS_EVENT 触发
  useEffect(() => {
    if (!lesson) return;
    const calc = () => {
      const p: any = progress[lesson.id] || {};
      setOk({
        'sec-quiz': !!p.quiz && lesson.quizAnswers.every((answer, i) => p.quiz[i] === answer),
        'sec-ex': !!p.ex,
        'sec-self': !!(p.note && p.note.trim()),
        'sec-drills': lesson.nDrills > 0 && drillStat(p.dr, lesson.nDrills).done === lesson.nDrills,
      });
      setDr(lesson.nDrills ? drillStat(p.dr, lesson.nDrills).done : 0);
    };
    calc();
    window.addEventListener(PROGRESS_EVENT, calc);
    return () => window.removeEventListener(PROGRESS_EVENT, calc);
  }, [lesson?.id]);
  if (!lesson) return null;
  const jumps: [string, string][] = [['sec-read', '正文']];
  if (lesson.quizAnswers.length) jumps.push(['sec-quiz', '随堂测验']);
  if (lesson.hasExercise) jumps.push(['sec-ex', '动手练习']);
  if (lesson.nDrills) jumps.push(['sec-drills', `变式练习 ${dr}/${lesson.nDrills}`]);
  jumps.push(['sec-self', '用自己的话讲一遍']);
  return (
    <div className="hoc">
      <div className="goals">
        <b>学完这一课，你应该</b>
        <ul>
          {lesson.goals.map((g: string, i: number) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: g }} />
          ))}
        </ul>
      </div>
      <nav className="jumps" aria-label="本课内容">
        <span>本课：</span>
        {jumps.map(([id, t]) => (
          <a
            key={id}
            href={'#' + id}
            className={ok[id] ? 'ok' : ''}
            onClick={e => {
              e.preventDefault();
              document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: smooth() });
            }}
          >
            {ok[id] ? '✓ ' : ''}
            {t}
          </a>
        ))}
      </nav>
    </div>
  );
}
