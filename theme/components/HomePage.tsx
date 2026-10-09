import { Link } from '@rspress/core/theme';
import { useEffect, useRef } from 'react';
import { attachStory, doneCount, dueCount, isDone } from '../../course/engine/index.ts';
import { BLOCK_SIZE, DURATIONS, ERA_COLORS, FRAMES, H, NODES, SECONDS_PER_SCREEN, STATIONS, TOTAL, W, YEARS } from '../../course/engine/logic/filmData.ts';
import { LESSONS, lessonById } from '../../course/registry.ts';
import { useProgress } from '../lib/useProgress';

/** 首页：一段可以自动放映、也可以手动滚动的短片，讲“React 渲染方式的演变”。
 *  同一个三层空间贯穿始终（你的组件 / React 的树 / DOM 与屏幕），变的是 React 更新它的方式。
 *  这里只有静态结构（服务端渲染进 HTML，没有 JS 时就是一篇长文加一张结论帧）；动画在 course/engine/story.ts + logic/filmTracks.ts（首页自己的异步 chunk）。
 *  继续学习、今日复习的显示依赖进度，挂载后才出现。 */

const short = (id: string) => (lessonById(id)?.title || id).split('：')[0];
const px = (n: number) => n + 'px';
const at = (x: number, y: number, w?: number, h?: number): React.CSSProperties => ({ left: px(x), top: px(y), ...(w ? { width: px(w), height: px(h) } : {}) });
const T = (t: string) =>
  t.split(/(?<=，)/).map(x => (
    <span className="ph" key={x}>
      {x}
    </span>
  ));

const edgePath = (id: string) => {
  const n = NODES.find(x => x.id === id) as (typeof NODES)[number];
  const p = NODES.find(x => x.id === n.parent) as (typeof NODES)[number];
  const my = (p.y + n.y) / 2;
  return `M${p.x} ${p.y + 17} C${p.x} ${my} ${n.x} ${my} ${n.x} ${n.y - 17}`;
};
/** DOM 层的色块配色：一套抽象的页面版式（没有文字） */
const BLOCK_HUE: Record<string, string> = { App: 'frame', Header: 'a', TodoList: 'b', Logo: 'c', Search: 'd', Item1: 'e', Item2: 'e', Box1: 'f', Box2: 'f' };

const SCENES: { id: string; eyebrow: [string, string]; title: string; text: string; hook?: string }[] = [
  {
    id: 'scene-1',
    eyebrow: ['React 之前', '手动改 DOM'],
    title: '数据变了，界面靠人去同步',
    text: '数据只有一份，界面上却有好几块要跟着变。你得逐块去改；漏掉一块，界面就和数据对不上。',
    hook: '能不能只描述界面该是什么样？',
  },
  {
    id: 'scene-2',
    eyebrow: ['2013', 'React 开源'],
    title: '界面是 state 的函数',
    text: '你写组件函数：给它 state，它返回界面的描述。state 一变，React 就重新调用这些函数，整份描述重新算一遍。这一步不碰 DOM。',
    hook: '整份重算，再整页重画，不慢吗？',
  },
  {
    id: 'scene-3',
    eyebrow: ['2013', 'React 的核心做法'],
    title: '协调：只提交差别',
    text: 'React 把新旧两份描述对比，找出真正不同的地方（这个过程叫协调，常说的虚拟 DOM 就是这种描述）。提交阶段只改动有差别的那一点 DOM，然后浏览器绘制。',
    hook: '树很大时，这次计算一口气做完，页面就动不了。',
  },
  {
    id: 'scene-4',
    eyebrow: ['2017', 'React 16'],
    title: 'Fiber：渲染可以被切成小片',
    text: 'React 16 用 Fiber 重写了内部架构，渲染拆成一个个小的工作单元，从此有可能在中途暂停。真正用上这个能力，是 React 18 的并发特性。',
    hook: '能暂停了，先做哪一件？',
  },
  {
    id: 'scene-5',
    eyebrow: ['2019', 'React 16.8'],
    title: 'Hooks：状态进了函数',
    text: 'Hooks 让函数组件也能有 state 和副作用，不必再写 class。',
    hook: '写法统一了，调度还能更聪明。',
  },
  {
    id: 'scene-6',
    eyebrow: ['2022', 'React 18'],
    title: '紧急的更新先做',
    text: '并发渲染可以暂停、继续，也可以放弃重来。输入是紧急更新，会插队先做完；被打断的过渡更新丢弃后，从头重来。',
    hook: '渲染一定要在浏览器里做吗？',
  },
  {
    id: 'scene-7',
    eyebrow: ['2024', 'React 19'],
    title: '一部分渲染搬到服务器',
    text: '流式渲染从 React 18 起支持，Server Components 与 Actions 在 React 19 稳定。服务器先渲染好的块逐块流到浏览器，只有要交互的块才带 JavaScript。',
    hook: '那些 memo、useMemo，还要自己写吗？',
  },
  {
    id: 'scene-8',
    eyebrow: ['2025', 'React Compiler 1.0'],
    title: '记忆化交给编译器',
    text: '编译器在构建时分析组件，自动加上相当于 memo、useMemo、useCallback 的记忆化：触发更新的组件照常渲染，props 没变的子树被挡住。',
  },
];

/** 收束幕的时间轴：8 个节点在一条平缓上升的曲线上（x、y 是 1000×200 视窗里的坐标），曲线用 Catmull-Rom 过这 8 个点 */
const XS = STATIONS.map((_s, i) => (i + 0.5) * 125);
const YS = [120, 91, 110, 81, 100, 71, 90, 61];
const CURVE = (() => {
  const pts = [{ x: 0, y: 128 }, ...XS.map((x, i) => ({ x, y: YS[i] })), { x: 1000, y: 52 }];
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x} ${p2.y}`;
  }
  return d;
})();

export default function HomePage() {
  const mounted = useProgress();
  const root = useRef<HTMLDivElement>(null);
  const done = mounted ? doneCount() : 0;
  const due = mounted ? dueCount() : 0;
  const next = (mounted && LESSONS.find(l => !isDone(l.id))) || LESSONS[0];
  const startLabel = done ? '继续学习：' + short(next.id) : '从第 1 课开始';
  const playCount = LESSONS.reduce((s, l) => s + l.nPlays, 0);
  const exCount = LESSONS.filter(l => l.hasExercise).length;
  const quizCount = LESSONS.reduce((s, l) => s + l.quizAnswers.length, 0);

  useEffect(() => {
    const el = root.current;
    return el ? attachStory(el) : undefined;
  }, []);

  const Actions = ({ big = false }: { big?: boolean }) => (
    <div className={'st-actions' + (big ? ' big' : '')}>
      <Link className="btn primary" href={'/lessons/' + next.id}>
        {big ? (done ? '继续学习：' + short(next.id) : '开始学习') : startLabel} →
      </Link>
      {due ? (
        <Link className="btn sun" href="/review">
          今日复习 {due} 题
        </Link>
      ) : null}
    </div>
  );

  const rail = [{ id: 'scene-0', name: '开场' }, ...SCENES.map(s => ({ id: s.id, name: s.eyebrow[0] + ' ' + s.eyebrow[1] })), { id: 'scene-9', name: '收束' }];

  return (
    <div className="hoc story" ref={root} style={{ '--total': TOTAL, '--sps': SECONDS_PER_SCREEN } as React.CSSProperties}>
      <nav className="rail" aria-label="首页分幕">
        <ol>
          {rail.map((e, i) => (
            <li key={e.id}>
              <a href={'#' + e.id} data-scene={i} aria-label={`第 ${i} 幕：${e.name}`}>
                <span className="dot" />
                <span className="lbl" aria-hidden="true">
                  {i === 0 || i === 9 ? e.name : YEARS[i].year || '之前'}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="player-slot" />

      {/* 三层空间：你的组件 / React 的树 / DOM 与屏幕。没有 JS 时它是一张静态的结论帧 */}
      <div className="world" aria-hidden="true">
        <div className="eraglow">
          {ERA_COLORS.map((c, i) => (
            <i key={i} data-w={'eg-' + i} style={{ '--c': c } as React.CSSProperties} />
          ))}
        </div>
        <div className="w3d">
          <div className="cam" data-w="cam">
            <div className="u" style={{ width: px(W), height: px(H) }}>
              {/* 第 3 层：DOM 与屏幕（最下面，再往下是像素栅格） */}
              <div className="plane p4" data-w="pl4">
                <div className="px" />
                <i className="rip" data-w="rip" />
                <i className="rip" data-w="rip2" />
              </div>
              <div className="plane p3" data-w="pl3">
                <i className="plbl" style={at(14, 8)}>
                  DOM · 屏幕
                </i>
                {NODES.map(n => {
                  const [w, h] = BLOCK_SIZE[n.id];
                  return (
                    <div key={n.id} className={'bk h-' + BLOCK_HUE[n.id]} data-w={'b-' + n.id} style={at(n.x - w / 2, n.id === 'App' ? 15 : n.y - h / 2, w, h)}>
                      <i className="bs" data-w={'bs-' + n.id} />
                      <i className="bo" data-w={'bo-' + n.id} />
                      <i className="bl" data-w={'bl-' + n.id} />
                      <i className="bx" data-w={'bx-' + n.id} />
                    </div>
                  );
                })}
                <svg className="lines" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
                  {[
                    ['ml-1', 'M500 300 C420 260 330 210 250 190'],
                    ['ml-2', 'M500 300 C540 310 580 314 610 318'],
                    ['ml-3', 'M500 300 C640 380 780 430 870 446'],
                  ].map(([k, d]) => (
                    <g key={k}>
                      <path className="ml-base" d={d} />
                      <path className="ml" data-w={k} d={d} pathLength={1} />
                    </g>
                  ))}
                  <path className="ml-x" data-w="ml-x" d="M846 420 L894 470 M894 420 L846 470" />
                </svg>
                <i className="beam orb-beam" data-w="bm-orb" />
              </div>
              {/* 第 2 层：React 的树（全片的主角）和正在构建的新树 */}
              <div className="plane p2" data-w="pl2">
                <i className="plbl" style={at(14, 8)}>
                  React 的树
                </i>
                <svg className="atom" data-w="atom" viewBox="-60 -60 120 120" style={at(440, 2, 120, 120)} aria-hidden="true">
                  {[0, 60, 120].map((r, i) => (
                    <ellipse key={r} className="at" data-w={'at-' + i} rx="52" ry="20" transform={`rotate(${r})`} pathLength={1} />
                  ))}
                  <circle className="at-n" data-w="at-n" r="7" />
                </svg>
                <svg className="edges" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
                  {NODES.filter(n => n.parent).map(n => (
                    <g key={n.id}>
                      <path className="e" data-w={'e-' + n.id} d={edgePath(n.id)} pathLength={1} />
                      <path className="gw" data-w={'gw-' + n.id} d={edgePath(n.id)} pathLength={1} />
                      <path className="g" data-w={'g-' + n.id} d={edgePath(n.id)} pathLength={1} />
                    </g>
                  ))}
                </svg>
                {NODES.map(n => (
                  <div key={n.id} className="nd" data-w={'n-' + n.id} style={at(n.x - 46, n.y - 17, 92, 34)}>
                    <span>{n.label}</span>
                    <i className="nl" data-w={'nl-' + n.id} />
                    <i className="cm" data-w={'cm-' + n.id} />
                    <i className="fl" data-w={'fl-' + n.id}>
                      ≠
                    </i>
                    <i className="ur" data-w={'ur-' + n.id} />
                    <i className="sh" data-w={'sh-' + n.id} />
                    <i className="bz" data-w={'bz-' + n.id}>
                      ⚡
                    </i>
                  </div>
                ))}
                <i className="spark" data-w="spark" style={{ left: px(500 - 22), top: px(62 - 66) }}>
                  set
                </i>
                {NODES.map(n => (
                  <i key={n.id} className="beam" data-w={'bm-' + n.id} style={{ left: px(n.x), top: px(n.y) }} />
                ))}
              </div>
              <div className="plane p2b" data-w="p2b">
                <i className="plbl" style={at(14, 36)}>
                  新的一份
                </i>
                <svg className="edges" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
                  {NODES.filter(n => n.parent).map(n => (
                    <path key={n.id} className="ge" data-w={'ge-' + n.id} d={edgePath(n.id)} pathLength={1} />
                  ))}
                </svg>
                {NODES.map(n => (
                  <div key={n.id} className="gn" data-w={'gn-' + n.id} style={at(n.x - 46, n.y - 17, 92, 34)}>
                    <span>{n.label}</span>
                    <i className="gl" data-w={'gl-' + n.id} />
                  </div>
                ))}
              </div>
              {/* 第 1 层：你的组件（函数签名） */}
              <div className="plane p1" data-w="pl1">
                <i className="plbl" style={at(14, 8)}>
                  你的组件
                </i>
                {NODES.map(n => (
                  <div key={n.id} className="card" data-w={'c-' + n.id} style={at(n.x - 56, n.y - 62, 112, 28)}>
                    <code>function {n.label}()</code>
                    <i className="cf" data-w={'cf-' + n.id} />
                    {n.memo ? (
                      <em className="mt" data-w={'mt-' + n.id}>
                        memo
                      </em>
                    ) : null}
                    {['Header', 'TodoList', 'Item1'].includes(n.id) ? (
                      <>
                        <b className="cls" data-w={'cls-' + n.id}>
                          class {n.label}
                        </b>
                        <u className="hk" data-w={'hk-' + n.id}>
                          useState
                        </u>
                      </>
                    ) : null}
                  </div>
                ))}
                <i className="orb" data-w="orb">
                  data
                </i>
                <i className="scan" data-w="scan" />
              </div>
            </div>
          </div>
        </div>
        {/* 画面角落：年份、帧节拍线、图例 */}
        <div className="finbg" data-w="finbg" aria-hidden="true" />
        <div className="hud">
          <div className="srvpanel" data-w="srvp">
            <b className="srvt">服务器</b>
            <div className="rack">
              {[0, 1, 2].map(i => (
                <span className="sbk" data-w={'sbk-' + i} key={i}>
                  <u />
                  <u />
                </span>
              ))}
            </div>
            <i className="led" />
          </div>
          <svg className="arcs" aria-hidden="true">
            {[0, 1, 2].map(i => (
              <g key={i}>
                <path className="arcb" data-w={'arcb-' + i} pathLength={1} />
                <path className="arcw" data-w={'arcw-' + i} pathLength={1} />
                <path className="arc" data-w={'arc-' + i} pathLength={1} />
              </g>
            ))}
            <path className="arcw act" data-w="arcw-act" pathLength={1} />
            <path className="arc act" data-w="arc-act" pathLength={1} />
          </svg>
          <div className="hc" data-w="hc">
            <div className="hc-in" data-w="hc-in">
              <div className="hc-f hc-front">
                <small>以前：class</small>
                <code>class Counter extends Component</code>
              </div>
              <div className="hc-f hc-back">
                <small>现在：function</small>
                <code>function Counter()</code>
              </div>
            </div>
            <u className="hkb" data-w="hkb">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                <path d="M9 3v9a4 4 0 1 0 4 4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                <circle cx="9" cy="3.5" r="1.8" fill="currentColor" />
              </svg>
              useState
            </u>
          </div>
          <i className="fly fa" data-w="fly-a-0" />
          <i className="fly fa" data-w="fly-a-1" />
          <i className="fly fa" data-w="fly-a-2" />
          <i className="fly fb" data-w="fly-b">
            ≠
          </i>
          <i className="fly fb-ring" data-w="fly-b-ring" />
          <svg className="fly fc" data-w="fly-c" viewBox="-30 -30 60 60" aria-hidden="true">
            <rect x="-22" y="6" width="44" height="14" rx="3" className="l3" />
            <rect x="-22" y="-7" width="44" height="14" rx="3" className="l2" />
            <rect x="-22" y="-20" width="44" height="14" rx="3" className="l1" />
          </svg>
          <div className="year" data-w="year">
            <div className="digits">
              {[0, 1, 2, 3].map(d => (
                <span className="dg" key={d}>
                  <span className="strip" data-w={'yd-' + d}>
                    {Array.from({ length: 10 }, (_, i) => (
                      <i key={i}>{i}</i>
                    ))}
                  </span>
                </span>
              ))}
            </div>
            <div className="ybars" aria-hidden="true">
              {[2, 3, 4, 5, 6, 7, 8].map(i => (
                <i key={i} data-w={'yb-' + i} style={{ background: ERA_COLORS[i] }} />
              ))}
            </div>
            <div className="ytags">
              {YEARS.map((y, i) =>
                y.tag ? (
                  <span key={i} data-w={'yt-' + i}>
                    {y.tag}
                  </span>
                ) : null,
              )}
            </div>
          </div>
          <div className="frames" data-w="frames">
            <small>每一帧</small>
            <div className="cells">
              {Array.from({ length: FRAMES }, (_, i) => (
                <i key={i}>
                  <b data-w={'fk-' + i} />
                  <b className="r" data-w={'fx-' + i}>
                    ✕
                  </b>
                </i>
              ))}
            </div>
            <p className="lost" data-w="frlost">
              掉帧：页面卡住
            </p>
            <p className="smooth" data-w="frok">
              节拍平稳：输入马上有响应
            </p>
          </div>
          <div className="callouts">
            <p className="cl" data-w="cl-h">
              漏掉一处：界面和数据对不上
            </p>
            <p className="cl" data-w="cl-d">
              渲染只在内存里算新的一份，不碰 DOM
            </p>
            <p className="cl" data-w="cl-e">
              只有这两处不同，就只提交这两处
            </p>
            <p className="cl urgent" data-w="cl-a">
              紧急更新：插队，先提交
            </p>
            <p className="cl" data-w="cl-b">
              被打断的渲染：丢弃，从头重来
            </p>
            <p className="cl" data-w="cl-f">
              服务器 → 浏览器　⚡ = 需要 JavaScript
            </p>
            <p className="cl skip" data-w="cl-g">
              props 没变：跳过，不重新渲染
            </p>
          </div>
          <ul className="legend" aria-hidden="true">
            <li className="c-render">渲染</li>
            <li className="c-diff">差别</li>
            <li className="c-commit">提交</li>
            <li className="c-urgent">紧急</li>
            <li className="c-skip">跳过</li>
          </ul>
        </div>
      </div>

      {/* 0 开场 */}
      <section className="sc s0" id="scene-0" style={{ '--d': DURATIONS[0] } as React.CSSProperties} aria-labelledby="h-0">
        <div className="sc-copy" data-w="cp-0">
          <p className="eyebrow">中文 · 交互式课程 · {LESSONS.length} 课</p>
          <h1 id="h-0" aria-label="动手学 React">
            {Array.from('动手学 React').map((c, i) => (
              <span className="ch" key={i} style={{ '--i': i } as React.CSSProperties} aria-hidden="true">
                {c === ' ' ? ' ' : c}
              </span>
            ))}
          </h1>
          <p className="lead">看一次更新怎样从 state 走到屏幕：React 怎样一步步学会把界面画得又对又快。先预测，再运行。</p>
          <Actions />
          <p className="st-links">
            <Link href="/roadmap">查看课程地图</Link>
            <button type="button" className="btn film" hidden>
              ▶ 播放 {Math.floor(TOTAL)} 秒短片
            </button>
          </p>
          <p className="scroll-hint" aria-hidden="true">
            向下滚动
          </p>
        </div>
      </section>

      {SCENES.map((s, i) => (
        <section className={'sc s' + (i + 1)} id={s.id} key={s.id} style={{ '--d': DURATIONS[i + 1] } as React.CSSProperties} aria-labelledby={'h-' + (i + 1)}>
          <div className="sc-copy" data-w={'cp-' + (i + 1)}>
            <p className="eyebrow">
              <b>{s.eyebrow[0]}</b> · {s.eyebrow[1]}
            </p>
            <h2 id={'h-' + (i + 1)}>
              <span className="mk">
                <span className="mk-in">{T(s.title)}</span>
              </span>
            </h2>
            <p className="desc">{s.text}</p>
            {s.hook ? <p className="hook">{s.hook}</p> : null}
          </div>
        </section>
      ))}

      {/* 9 收束：发光的时间轴是视觉主体，上标题、下行动 */}
      <section className="sc s9" id="scene-9" style={{ '--d': DURATIONS[9] } as React.CSSProperties} aria-labelledby="h-9">
        <div className="sc-copy" data-w="cp-9">
          <div className="fin">
            <header className="fin-head">
              <p className="fin-eyebrow">2013 → 2025</p>
              <h2 id="h-9">
                <span className="mk">
                  <span className="mk-in">
                    <span className="ph">每一代，</span>
                    <span className="ph">
                      都在解决<em>上一代留下的问题</em>
                    </span>
                  </span>
                </span>
              </h2>
              <p className="desc">这门课按同样的顺序讲：先预测，再运行，再自己写。</p>
            </header>
            <div className="tl">
              <svg className="tl-curve" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">
                <path className="tl-base" d={CURVE} />
                <path className="tl-draw" data-w="tl-draw" d={CURVE} pathLength={1} />
                <path className="tl-flow" d={CURVE} pathLength={1} />
              </svg>
              <i className="tl-line" data-w="tl-line" aria-hidden="true" />
              <ol className="eras">
                {STATIONS.map((st, i) => {
                  const lessons = st.lessons;
                  return (
                    <li
                      key={st.name + st.year}
                      className={'era ' + (i % 2 ? 'up' : 'down')}
                      style={{ '--c': ERA_COLORS[i + 1], '--x': `${XS[i] / 10}%`, '--y': `${(YS[i] / 200) * 100}%` } as React.CSSProperties}
                    >
                      <span className="dt" aria-hidden="true" />
                      <div className="era-box">
                        <Link className="era-main" href={'/lessons/' + lessons[0]} aria-label={`${st.year} ${st.name}：${short(lessons[0])}`}>
                          <span className="yr">{st.year}</span>
                          <b>{st.name}</b>
                          <span className="ln">{short(lessons[0])}</span>
                          <span className="tip" aria-hidden="true">
                            {SCENES[i].title}
                          </span>
                        </Link>
                        {lessons.slice(1).map(id => (
                          <Link key={id} className="era-more" href={'/lessons/' + id}>
                            {short(id)}
                          </Link>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="fin-act">
              <dl className="stats3">
                {[
                  [playCount, '个先预测再运行的示例'],
                  [exCount, '道自动判分练习'],
                  [quizCount, '道测验题进入间隔复习'],
                ].map(([n, label]) => (
                  <div key={label as string}>
                    <dt data-count={n}>{n}</dt>
                    <dd>{label}</dd>
                  </div>
                ))}
              </dl>
              <div className="fin-actions">
                <Link className="btn primary big" href={'/lessons/' + next.id}>
                  {done ? '继续学习：' + short(next.id) : '开始学习'} →
                </Link>
                <Link className="btn ghost" href="/roadmap">
                  查看课程地图
                </Link>
                {due ? (
                  <Link className="btn sun" href="/review">
                    今日复习 {due} 题
                  </Link>
                ) : null}
              </div>
            </div>
            <p className="foot">
              代码 <a href="https://github.com/paddychenc75/hands-on-react/blob/main/LICENSE">MIT</a> · 课文{' '}
              <a href="https://github.com/paddychenc75/hands-on-react/blob/main/LICENSE-CONTENT">CC BY-NC-SA 4.0</a> ·{' '}
              <a href="https://github.com/paddychenc75/hands-on-react">GitHub</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
