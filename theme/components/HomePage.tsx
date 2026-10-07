import { Link } from '@rspress/core/theme';
import { buildHeroTree, doneCount, dueCount, progress, isDone } from '../../course/engine/index.ts';
import { LESSONS } from '../../course/registry.ts';
import { STAGES } from '../../course/stages.ts';
import { useProgress } from '../lib/useProgress';
import { useDomSlot } from '../lib/useDomSlot';

/** 首页（旧版 renderHome）：hero、统计、学习方法、六阶段课程地图。
 *  依赖进度的部分（继续学习、完成数、到期数、各阶段进度）挂载后才显示真实数字。 */
export default function HomePage() {
  const mounted = useProgress();
  const treeRef = useDomSlot(() => buildHeroTree());
  const done = mounted ? doneCount() : 0;
  const due = mounted ? dueCount() : 0;
  const next = (mounted && LESSONS.find((l: any) => !isDone(l.id))) || LESSONS[0];
  const totalMins = LESSONS.reduce((s: number, l: any) => s + l.mins, 0);
  const exCount = LESSONS.filter((l: any) => l.exercise).length;
  const playCount = LESSONS.reduce((s: number, l: any) => s + Object.keys(l.plays || {}).length, 0);
  const learned = mounted ? Object.keys(progress.__srs || {}).length : 0;
  const st = (mounted && progress.__stage) || {};
  return (
    <div className="hoc home">
      <section className="hero">
        <div>
          <div className="eyebrow">按学习科学设计的 React 课程 · 中文</div>
          <h1>
            从零开始，
            <br />
            边做边学<em>React</em>
          </h1>
          <p>这里不只是读教程。你会先预测代码的结果再运行验证，每节课开头回忆旧知识，按遗忘规律复习，每个阶段通过测验才算掌握。</p>
          <p className="prereq">
            <b>开始前你需要会：</b>JavaScript 基础（变量、函数、箭头函数、数组的 map 和 filter、对象和数组的解构与展开、模块的 import/export、Promise 与
            async/await），以及基本的 HTML 和 CSS。还不熟的话，先花一两周补 JavaScript，再回来学会轻松很多。
          </p>
          <div className="cta">
            <Link className="btn primary" href={'/lessons/' + next.id}>
              {done ? '继续学习：' + next.title : '开始第一课'} →
            </Link>
            {due ? (
              <Link className="btn sun" href="/review">
                今日复习 {due} 题
              </Link>
            ) : (
              <Link className="btn" href="/lessons/rendering">
                直接看渲染原理
              </Link>
            )}
          </div>
        </div>
        <div className="tree-card">
          <div ref={treeRef} />
          <p className="cap">点击任意组件，模拟它调用了 set 函数：它和它的所有后代都会重新渲染（闪黄），兄弟和祖先不受影响。这就是第 19 课要讲的内容。</p>
        </div>
      </section>

      <div className="stats">
        <div>
          <b>{LESSONS.length}</b>
          <span>节课</span>
        </div>
        <div>
          <b>{playCount}</b>
          <span>个可运行示例</span>
        </div>
        <div>
          <b>{exCount}</b>
          <span>道自动批改练习</span>
        </div>
        <div>
          <b>{Math.round((totalMins / 60) * 10) / 10}</b>
          <span>小时（含练习，不含毕业设计）</span>
        </div>
        <div>
          <b>
            {done}/{LESSONS.length}
          </b>
          <span>课已完成</span>
        </div>
        <div>
          <b>{learned}</b>
          <span>道题在复习中</span>
        </div>
      </div>

      <h2 className="section-title">怎样用这套课程真正学会</h2>
      <p className="section-sub">下面每个环节都对应一条被大量研究验证过的学习规律。看懂了不等于学会了，这些环节的作用是让知识留在你脑子里。</p>
      <div className="methods">
        <div>
          <b>先预测，再运行</b>
          <i>生成效应</i>
          <p>标着 PREDICT 的代码会先让你猜结果。主动猜一次，哪怕猜错，比直接看答案记得牢得多。</p>
        </div>
        <div>
          <b>课前热身</b>
          <i>提取练习</i>
          <p>每课开头先凭记忆回答两道旧题。从记忆里“往外拿”知识，比反复阅读更能巩固它。</p>
        </div>
        <div>
          <b>间隔复习</b>
          <i>间隔效应</i>
          <p>题目按 1、3、7、16、35 天的间隔回来找你，赶在快忘记时复习一次，效率最高。</p>
        </div>
        <div>
          <b>混合出题</b>
          <i>交错练习</i>
          <p>复习和阶段测验把不同课的题混在一起，你得先判断该用哪个知识点，这正是写真实代码时的情况。</p>
        </div>
        <div>
          <b>先尝试，再求助</b>
          <i>有益困难 · 渐隐示例</i>
          <p>练习的提示、半成品示例、参考答案要检查失败后逐级解锁。先挣扎一下再看答案，学到的东西更多。</p>
        </div>
        <div>
          <b>讲给别人听</b>
          <i>自我解释</i>
          <p>每课结尾用自己的话总结，再对照要点自查。讲不清楚的地方，就是还没真懂的地方。</p>
        </div>
      </div>
      <p className="section-sub">
        <b>简明的写法：</b>课文参考
        ASD-STE100（简化技术英语）的写作原则。一句话只讲一件事，长句拆成短句，操作写成编号步骤，多用主动语态。一个概念只用一个说法，见
        <Link href="/glossary">术语表</Link>。
      </p>
      <p className="section-sub">
        <b>掌握学习：</b>一课测验全对、练习通过才算完成；一个阶段测验达到 80% 才算掌握。建议每天先清空“今日复习”，再学新课。
      </p>

      <h2 className="section-title" style={{ marginTop: 34 }}>
        学习路线
      </h2>
      <p className="section-sub">六个阶段循序渐进。建议按顺序学习；如果已有基础，可以先做阶段测验，看看自己哪些地方已经掌握。</p>
      <div className="stages">
        {STAGES.map((s: any, si: number) => {
          const ls = LESSONS.filter((l: any) => l.stage === si);
          const d = mounted ? ls.filter((l: any) => isDone(l.id)).length : 0;
          const rec = st[si];
          return (
            <section className="stage" key={si}>
              <div className="stage-head">
                <span className="stage-no">{s.no}</span>
                <h3>{s.name}</h3>
                <span style={{ color: 'var(--ink-3)', fontSize: 12.5 }}>{s.en}</span>
                {rec && rec.passed ? <span className="mastered">✓ 已掌握</span> : null}
              </div>
              <p className="desc">{s.desc}</p>
              <ol>
                {ls.map((l: any) => (
                  <li key={l.id} className={mounted && isDone(l.id) ? 'done' : ''}>
                    <Link href={'/lessons/' + l.id}>
                      <span className="dot" />
                      {l.title}
                    </Link>
                  </li>
                ))}
              </ol>
              <div className="meter">
                <div className="bar">
                  <i style={{ width: (ls.length ? (d / ls.length) * 100 : 0) + '%' }} />
                </div>
                <span>
                  {d}/{ls.length}
                </span>
              </div>
              <Link className="check-link" href={'/check/' + si}>
                阶段测验 {rec ? '· 最好成绩 ' + rec.best + '%' : '· 未参加'} →
              </Link>
            </section>
          );
        })}
      </div>
    </div>
  );
}
