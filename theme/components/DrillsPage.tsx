import { Link } from '@rspress/core/theme';
import { drillRows, drillTotals, progress } from '../../course/engine/index.ts';
import { LESSONS, lessonById, lessonNo } from '../../course/registry.ts';
import { lessonHref } from '../../course/site.ts';
import { STAGES } from '../../course/stages.ts';
import { useProgress } from '../lib/useProgress';

/** 变式练习总览：按阶段列出所有有变式练习的课，每道显示标题和是否完成，点击跳到该课的变式练习区。
 *  只用轻量目录（nDrills、drillTitles、drillMins）和进度，同步渲染，不加载任何课的重数据。进度挂载后才显示（避免水合不一致）。 */
export default function DrillsPage() {
  const mounted = useProgress();
  const rows = drillRows(LESSONS, id => (mounted ? progress[id]?.dr : undefined));
  const total = drillTotals(rows);
  const mins = LESSONS.reduce((s, l) => s + (l.drillMins || 0), 0);
  return (
    <div className="hoc drills-page">
      <p className="dp-intro">
        变式练习是每课正式练习之外的小任务：同一个概念换一种情境，每道约 3–8 分钟，自带实验台和“检查答案”。它们是选做，<b>不影响“本课完成”</b>
        ；觉得概念还不牢，或想多练一遍时再来。
      </p>
      <p className="dp-total">
        共 {total.total} 道，已完成 {total.done} 道 · 合计约 {mins} 分钟
      </p>
      {STAGES.map((s, si) => {
        const lessons = rows.filter(r => LESSONS.find(l => l.id === r.id)?.stage === si);
        if (!lessons.length) return null;
        const st = drillTotals(lessons);
        return (
          <section className="dp-stage" key={si}>
            <h2>
              <span className="stage-no">{s.no}</span> {s.name}
              <small>
                变式 {st.done}/{st.total}
              </small>
            </h2>
            {lessons.map(r => {
              const l = lessonById(r.id);
              if (!l) return null;
              return (
                <div className="dp-lesson" key={r.id}>
                  <div className="dp-lesson-head">
                    <Link href={'/lessons/' + r.id}>
                      {lessonNo(r.id)}. {l.title}
                    </Link>
                    <span className={'dp-count' + (r.done === r.total ? ' all' : '')}>
                      {r.done}/{r.total}
                      {l.drillMins ? ' · 约 ' + l.drillMins + ' 分钟' : ''}
                    </span>
                  </div>
                  <ol>
                    {l.drillTitles.map((title, i) => (
                      <li key={i} className={r.oks[i] ? 'done' : ''}>
                        {/* 普通 <a>：由 LinkRouter 走客户端路由，并等变式练习区出现后滚过去 */}
                        <a href={lessonHref(r.id) + '#sec-drills'}>
                          <span className="dp-mark" title={r.oks[i] ? '已完成' : '未完成'}>
                            {r.oks[i] ? '✓' : '○'}
                          </span>
                          <span className="dp-no">变式 {i + 1}</span>
                          <span className="dp-title">{title}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
