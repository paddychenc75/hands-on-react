import { Link } from '@rspress/core/theme';
import { useEffect, useRef } from 'react';
import { attachStory, doneCount, dueCount, isDone } from '../../course/engine/index.ts';
import { LESSONS, lessonById } from '../../course/registry.ts';
import { useProgress } from '../lib/useProgress';

/** 首页：一段随滚动推进的叙事，讲“界面是怎样被画出来的”一路怎样演变，每一幕是一个时代。
 *  文案和画面都在这个组件里（服务端渲染进静态 HTML）；滚动驱动的动画由 theme/story.css 用 CSS 写成，
 *  course/engine/story.ts 在浏览器里按需加载：补上不支持 CSS 滚动驱动动画的浏览器、幕进度指示、屏幕外暂停。
 *  继续学习、今日复习的显示依赖进度，挂载后才出现。 */

const short = (id: string) => (lessonById(id)?.title || id).split('：')[0];

/** 一个数字从旧值换成新值（淡出旧的、淡入新的）。--t0、--d 决定在幕的哪一段换 */
function Swap({ a, b, t0, d = 0.08, className = '' }: { a: string; b: string; t0: number; d?: number; className?: string }) {
  return (
    <span className={'swap stp ' + className} style={{ '--t0': t0, '--d': d } as React.CSSProperties}>
      <i className="o">{a}</i>
      <i className="n">{b}</i>
    </span>
  );
}

/** 小界面：购物车。三处显示同一个数字（角标、合计、按钮）；一行商品带一个收藏心。从第 1 幕一直出现到第 6 幕。 */
function Cart({
  n0,
  n1,
  t0 = 0.5,
  heart = false,
  heartAt = 0.7,
  className = '',
  skip = false,
  liked = false,
}: {
  n0: string;
  n1: string;
  t0?: number;
  heart?: boolean;
  heartAt?: number;
  className?: string;
  skip?: boolean;
  liked?: boolean;
}) {
  return (
    <div className={'mui ' + className}>
      <div className="mui-bar">
        <b>购物车</b>
        <span className="mui-badge">
          <Swap a={n0} b={n1} t0={t0} />
        </span>
      </div>
      <div className="mui-row">
        <span>无线耳机</span>
        {heart ? <Swap a="♡" b="♥" t0={heartAt} d={0.1} className="heart" /> : <span className="heart">{liked ? '♥' : '♡'}</span>}
      </div>
      <div className="mui-foot">
        <span>
          共 <Swap a={n0} b={n1} t0={t0 + (skip ? 0.1 : 0)} /> 件
        </span>
        <span className={'mui-btn' + (skip ? ' miss' : '')}>
          结算 (<Swap a={n0} b={skip ? n0 : n1} t0={t0 + (skip ? 0.2 : 0)} />)
        </span>
      </div>
    </div>
  );
}

const ERAS: { id: string; year: string; name: string }[] = [
  { id: 'scene-0', year: '', name: '开场' },
  { id: 'scene-1', year: '之前', name: '手动改 DOM' },
  { id: 'scene-2', year: '2013', name: '声明式' },
  { id: 'scene-3', year: '2013', name: '协调' },
  { id: 'scene-4', year: '2017', name: 'Fiber' },
  { id: 'scene-5', year: '2022', name: '并发' },
  { id: 'scene-6', year: '2024', name: '服务端' },
  { id: 'scene-7', year: '2025', name: '编译器' },
  { id: 'scene-8', year: '', name: '收束' },
];

const STATIONS: { year: string; name: string; lessons: string[] }[] = [
  { year: '之前', name: '手动改 DOM', lessons: ['what-is-react'] },
  { year: '2013', name: '声明式', lessons: ['state'] },
  { year: '2013', name: '协调', lessons: ['rendering'] },
  { year: '2017', name: 'Fiber', lessons: ['scheduler'] },
  { year: '2022', name: '并发', lessons: ['concurrent'] },
  { year: '2024', name: '服务端', lessons: ['server-components', 'react-19'] },
  { year: '2025', name: '编译器', lessons: ['performance'] },
];

/** 组件树的静态数据：只给第 7 幕的画面用（坐标取百分比） */
const TREE = [
  { id: 'App', x: 50, y: 10, p: '' },
  { id: 'Header', x: 24, y: 38, p: 'App' },
  { id: 'TodoList', x: 76, y: 38, p: 'App' },
  { id: 'Item', x: 62, y: 68, p: 'TodoList', memo: true },
  { id: 'Item ', x: 90, y: 68, p: 'TodoList', memo: true },
  { id: 'Checkbox', x: 62, y: 92, p: 'Item', memo: true },
  { id: 'Checkbox ', x: 90, y: 92, p: 'Item ', memo: true },
];

/** 标题按逗号分成几段，换行时只在逗号处断开 */
const T = (t: string) =>
  t.split(/(?<=，)/).map(x => (
    <span className="ph" key={x}>
      {x}
    </span>
  ));
const st = (t0: number, d: number, extra: Record<string, string | number> = {}) => ({ '--t0': t0, '--d': d, ...extra }) as React.CSSProperties;

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

  return (
    <div className="hoc story" ref={root}>
      <nav className="rail" aria-label="首页分幕">
        <ol>
          {ERAS.map((e, i) => (
            <li key={e.id}>
              <a href={'#' + e.id} data-scene={i} aria-label={`第 ${i} 幕：${e.year ? e.year + ' ' : ''}${e.name}`}>
                <span className="dot" />
                <span className="lbl" aria-hidden="true">
                  {e.year || e.name}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* 0 开场 */}
      <section className="sc s0" id="scene-0" data-k="1" style={{ '--k': 1 } as React.CSSProperties} aria-labelledby="h-0">
        <div className="sc-stage">
          <div className="s0-glow" aria-hidden="true" />
          <div className="s0-copy">
            <p className="eyebrow">中文 · 交互式课程 · {LESSONS.length} 课</p>
            <h1 id="h-0">动手学 React</h1>
            <p className="lead">先预测，再运行。从手动改页面到编译器自动优化，边做边学界面是怎样被画出来的。</p>
            <Actions />
            <p className="st-links">
              <Link href="/roadmap">查看课程地图</Link>
            </p>
          </div>
          <div className="s0-art" aria-hidden="true">
            <Cart n0="3" n1="3" t0={0} />
          </div>
          <p className="scroll-hint" aria-hidden="true">
            <span>向下滚动</span>
            <i />
          </p>
        </div>
      </section>

      {/* 1 手动改 DOM */}
      <section className="sc s1" id="scene-1" style={{ '--k': 1.55 } as React.CSSProperties} aria-labelledby="h-1">
        <div className="sc-stage">
          <div className="sc-copy">
            <p className="eyebrow">
              <b>React 之前</b> · 手动改 DOM
            </p>
            <h2 id="h-1">{T('数据变了，界面靠人一处处改')}</h2>
            <p>一份数据显示在三处。你得逐处去改，漏掉一处，数字就对不上。</p>
            <p className="hook">能不能只描述界面该是什么样，让工具去同步？</p>
          </div>
          <div className="art a1" aria-hidden="true">
            <div className="a1-data stp" style={st(0.1, 0.1)}>
              <code>
                count: <Swap a="2" b="3" t0={0.1} d={0.08} />
              </code>
              <span className="tag">点了“+”</span>
            </div>
            <Cart n0="2" n1="3" t0={0.3} skip className="a1-ui" />
            <ul className="cmds">
              <li className="cmd stp" style={st(0.24, 0.08)}>
                <code>badge.textContent = n</code>
                <i className="yes">✓</i>
              </li>
              <li className="cmd stp" style={st(0.44, 0.08)}>
                <code>sum.textContent = n + ' 件'</code>
                <i className="yes">✓</i>
              </li>
              <li className="cmd late stp" style={st(0.66, 0.1)}>
                <code>btn.textContent = '结算 (' + n + ')'</code>
                <i className="nope">漏了</i>
              </li>
            </ul>
            <p className="a1-note stp" style={st(0.78, 0.1)}>
              按钮还是 2：界面和数据对不上了
            </p>
          </div>
        </div>
      </section>

      {/* 2 声明式 */}
      <section className="sc s2" id="scene-2" style={{ '--k': 1.45 } as React.CSSProperties} aria-labelledby="h-2">
        <div className="sc-stage">
          <div className="sc-copy">
            <p className="eyebrow">
              <b>2013</b> · React 开源
            </p>
            <h2 id="h-2">界面是 state 的函数</h2>
            <p>你写一个函数：给它数据，它返回界面。数据一变，React 就重新调用它。</p>
            <p className="hook">整份界面每次都重新算，会不会太慢？</p>
          </div>
          <div className="art a2" aria-hidden="true">
            <div className="a2-state">
              <small>state</small>
              <code>
                count: <Swap a="2" b="3" t0={0.2} d={0.08} />
              </code>
            </div>
            <i className="arrow ar1 stp" style={st(0.28, 0.1)} />
            <div className="a2-f">
              <ul className="chips stp" style={st(0, 0.3)}>
                <li>badge.textContent = n</li>
                <li>sum.textContent = …</li>
                <li>btn.textContent = …</li>
              </ul>
              <b>UI = f(state)</b>
              <code>{'Cart({ count }) {'}</code>
              <code>{'  return <UI … />;'}</code>
              <code>{'}'}</code>
              <span className="ring stp" style={st(0.36, 0.2)} />
            </div>
            <i className="arrow ar2 stp" style={st(0.52, 0.1)} />
            <Cart n0="2" n1="3" t0={0.62} className="a2-ui" />
            <p className="a2-note stp" style={st(0.78, 0.12)}>
              三处一起变，不会漏
            </p>
          </div>
        </div>
      </section>

      {/* 3 协调 */}
      <section className="sc s3" id="scene-3" style={{ '--k': 1.7 } as React.CSSProperties} aria-labelledby="h-3">
        <div className="sc-stage">
          <div className="sc-copy">
            <p className="eyebrow">
              <b>2013</b> · 协调
            </p>
            <h2 id="h-3">{T('整份重算，只提交差别')}</h2>
            <p>React 把新旧两份界面描述对比（常说的虚拟 DOM，这个过程叫协调）。只有真正不同的那一处，才会改到 DOM 上。</p>
            <p className="hook">树很大时，这次计算一口气做完，页面就卡住了。</p>
          </div>
          <div className="art a3" aria-hidden="true">
            {[
              { k: 'old', title: '上一份描述', heart: '♡' },
              { k: 'new', title: '这一份描述', heart: '♥' },
            ].map(tr => (
              <div className={'a3-tree ' + tr.k} key={tr.k}>
                <small>{tr.title}</small>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M50 24 L16 52 M50 24 L50 52 M50 24 L84 52 M16 52 L16 80 M50 52 L50 80 M84 52 L84 80" />
                </svg>
                {[
                  ['Cart', 50, 24],
                  ['Header', 16, 52],
                  ['Row', 50, 52],
                  ['Footer', 84, 52],
                  ['Badge', 16, 80],
                  ['Heart', 50, 80],
                  ['Button', 84, 80],
                ].map(([nm, x, y]) => {
                  const diff = nm === 'Heart' && tr.k === 'new';
                  const same = nm !== 'Heart';
                  return (
                    <span
                      key={nm as string}
                      className={'nd' + (same ? ' keep stp' : '') + (diff ? ' chg stp' : '') + (nm === 'Heart' && tr.k === 'old' ? ' gone stp' : '')}
                      style={{ left: x + '%', top: y + '%', ...(same ? st(0.22, 0.2) : diff ? st(0.4, 0.12) : st(0.4, 0.12)) } as React.CSSProperties}
                    >
                      {nm === 'Heart' ? 'Heart ' + tr.heart : nm}
                    </span>
                  );
                })}
              </div>
            ))}
            <span className="a3-chip stp" style={st(0.55, 0.3)}>
              Heart ♥
            </span>
            <p className="a3-cap stp" style={st(0.5, 0.1)}>
              只提交这一处
            </p>
            <Cart n0="3" n1="3" t0={0} heart heartAt={0.82} className="a3-ui" />
          </div>
        </div>
      </section>

      {/* 4 Fiber */}
      <section className="sc s4" id="scene-4" style={{ '--k': 1.7 } as React.CSSProperties} aria-labelledby="h-4">
        <div className="sc-stage">
          <div className="sc-copy">
            <p className="eyebrow">
              <b>2017</b> · React 16
            </p>
            <h2 id="h-4">渲染可以被切成小片</h2>
            <p>React 16 用 Fiber 重写了内部架构，渲染工作拆成可以暂停的小单元。把这个能力真正用起来的，是 React 18 的并发特性。</p>
            <p className="hook">能暂停了，那该先做哪一件？</p>
          </div>
          <div className="art a4" aria-hidden="true">
            {[
              { k: 'block', label: '旧：一口气渲染', red: [0.08, 0.8], in: 0.3, res: 0.84, resNote: '输入被挡住，帧丢了' },
              { k: 'slice', label: '切片：中间让出', red: [1, 1], in: 0.3, res: 0.32, resNote: '输入马上得到响应' },
            ].map(l => (
              <div className={'lane ' + l.k} key={l.k}>
                <small>{l.label}</small>
                <div className="track">
                  <div className="frames">
                    {Array.from({ length: 28 }, (_, i) => {
                      const f = i / 28;
                      const r = l.k === 'block' && f >= 0.08 && f < 0.8 ? 1 : 0;
                      return <i key={i} style={{ '--f': (f + 0.004).toFixed(3), '--r': r } as React.CSSProperties} />;
                    })}
                  </div>
                  <div className="work">
                    {l.k === 'block' ? (
                      <b className="sl stp" style={{ left: '8%', width: '72%', ...st(0.08, 0.72) } as React.CSSProperties}>
                        渲染
                      </b>
                    ) : (
                      [
                        [8, 8],
                        [18, 8],
                        [34, 8],
                        [44, 8],
                        [54, 8],
                        [64, 8],
                        [74, 6],
                      ].map(([x, w], i) => (
                        <b key={i} className="sl stp" style={{ left: x + '%', width: w + '%', ...st(x / 100, w / 100) } as React.CSSProperties} />
                      ))
                    )}
                  </div>
                  <span className="ev stp" style={{ left: l.in * 100 + '%', ...st(l.in, 0.04) } as React.CSSProperties}>
                    输入
                  </span>
                  <span className={'rs stp ' + l.k} style={{ left: l.res * 100 + '%', ...st(l.res, 0.06) } as React.CSSProperties}>
                    {l.resNote}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 并发 */}
      <section className="sc s5" id="scene-5" style={{ '--k': 1.55 } as React.CSSProperties} aria-labelledby="h-5">
        <div className="sc-stage">
          <div className="sc-copy">
            <p className="eyebrow">
              <b>2022</b> · React 18 <span className="side">（2019 · 16.8：Hooks）</span>
            </p>
            <h2 id="h-5">紧急的更新先做</h2>
            <p>React 18 的并发渲染可以暂停、继续，也可以放弃重来。打字是紧急更新，重绘长列表是过渡更新，前者能打断后者。</p>
            <p className="hook">渲染一定要在浏览器里做吗？</p>
          </div>
          <div className="art a5" aria-hidden="true">
            <div className="a5-input">
              <small>紧急：输入框</small>
              <div className="field">
                <span className="ch stp" style={st(0.34, 0.03)}>
                  r
                </span>
                <span className="ch stp" style={st(0.37, 0.03)}>
                  e
                </span>
                <span className="ch stp" style={st(0.4, 0.03)}>
                  a
                </span>
                <span className="ch stp" style={st(0.43, 0.03)}>
                  c
                </span>
                <span className="ch stp" style={st(0.46, 0.03)}>
                  t
                </span>
                <i className="caret" />
              </div>
            </div>
            <div className="a5-list">
              <small>过渡：重绘长列表</small>
              <div className="prog">
                <i className="fill" />
                <span className="cut stp" style={st(0.31, 0.04)}>
                  被打断，放弃
                </span>
                <span className="redo stp" style={st(0.5, 0.06)}>
                  重新开始
                </span>
              </div>
              <div className="cells">
                {Array.from({ length: 24 }, (_, i) => (
                  <i key={i} className="stp" style={st(0.8 + (i / 24) * 0.14, 0.04)} />
                ))}
              </div>
            </div>
            <p className="a5-note stp" style={st(0.9, 0.08)}>
              输入始终跟手
            </p>
          </div>
        </div>
      </section>

      {/* 6 服务端 */}
      <section className="sc s6" id="scene-6" style={{ '--k': 1.7 } as React.CSSProperties} aria-labelledby="h-6">
        <div className="sc-stage">
          <div className="sc-copy">
            <p className="eyebrow">
              <b>2024</b> · React 19
            </p>
            <h2 id="h-6">一块块从服务器流过来</h2>
            <p>流式渲染从 React 18 起支持，Server Components 与 Actions 在 React 19 稳定。服务器先送来页面外壳，慢的部分占位，再逐块填上。</p>
            <p className="hook">那些 memo、useMemo，还要自己写吗？</p>
          </div>
          <div className="art a6" aria-hidden="true">
            <div className="srv">
              <small>服务器</small>
              {['外壳', '商品', '评论'].map((b, i) => (
                <span key={b} className="blk stp" style={st(0.12 + i * 0.26, 0.2)}>
                  {b}
                </span>
              ))}
            </div>
            <div className="pipe">
              {[0, 1, 2].map(i => (
                <i key={i} className="flow stp" style={st(0.12 + i * 0.26, 0.2)} />
              ))}
            </div>
            <div className="win">
              <small>浏览器</small>
              <div className="page">
                <div className="part head">
                  <span className="sk" />
                  <span className="real stp" style={st(0.2, 0.1)}>
                    动手商城
                  </span>
                </div>
                <div className="part goods">
                  <span className="sk" />
                  <span className="real stp" style={st(0.46, 0.1)}>
                    <Cart n0="3" n1="3" t0={0} liked className="mini" />
                  </span>
                  <i className="bolt stp" style={st(0.74, 0.08)}>
                    ⚡ 带 JS
                  </i>
                </div>
                <div className="part cmts">
                  <span className="sk" />
                  <span className="real stp" style={st(0.72, 0.1)}>
                    评论：好用，推荐
                  </span>
                  <i className="bolt stp" style={st(0.84, 0.08)}>
                    ⚡ 带 JS
                  </i>
                </div>
              </div>
            </div>
            <p className="a6-note stp" style={st(0.88, 0.1)}>
              <code>&lt;form action={'{…}'}&gt;</code> 提交表单，就是一个 Action
            </p>
          </div>
        </div>
      </section>

      {/* 7 编译器 */}
      <section className="sc s7" id="scene-7" style={{ '--k': 1.55 } as React.CSSProperties} aria-labelledby="h-7">
        <div className="sc-stage">
          <div className="sc-copy">
            <p className="eyebrow">
              <b>2025</b> · React Compiler 1.0
            </p>
            <h2 id="h-7">记忆化交给编译器</h2>
            <p>编译器在构建时分析组件，自动加上相当于 memo、useMemo、useCallback 的记忆化。没变的子树不再跟着重新渲染。</p>
            <p className="hook">回头看，每一代都在解决上一代留下的问题。</p>
          </div>
          <div className="art a7" aria-hidden="true">
            <div className="cc">
              <i className="scan" />
              <code className="l1">{'function TodoList({ items }) {'}</code>
              <code className="l2 stp" style={st(0.3, 0.1)}>
                {'  const open = items.filter(isOpen);'}
                <em>已记忆化</em>
              </code>
              <code className="l3 stp" style={st(0.5, 0.1)}>
                {'  return <List rows={open} />;'}
                <em>已记忆化</em>
              </code>
              <code className="l4">{'}'}</code>
            </div>
            <div className="ctree">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {TREE.filter(n => n.p).map(n => {
                  const p = TREE.find(x => x.id === n.p) as (typeof TREE)[number];
                  return <path key={n.id} d={`M${p.x} ${p.y + 6} L${n.x} ${n.y - 6}`} />;
                })}
              </svg>
              {TREE.map(n => (
                <span key={n.id} className={'nd' + (n.id === 'TodoList' || n.id === 'App' ? ' top' : '')} style={{ left: n.x + '%', top: n.y + '%' }}>
                  <span className="lit stp" style={n.memo ? st(0.64, 0.14) : st(2, 1)} />
                  {n.id.trim()}
                  {n.memo ? (
                    <em className="skip stp" style={st(0.64, 0.14)}>
                      跳过
                    </em>
                  ) : null}
                </span>
              ))}
              <span className="trig">set 函数被调用</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8 收束 */}
      <section className="sc s8" id="scene-8" style={{ '--k': 1 } as React.CSSProperties} aria-labelledby="h-8">
        <div className="sc-stage">
          <div className="s8-head">
            <h2 id="h-8">{T('每一代，都在解决上一代留下的问题')}</h2>
            <p>这门课按同样的顺序讲。每个知识点：先预测，再运行，再自己写。</p>
          </div>
          <ol className="eras">
            {STATIONS.map((s, i) => (
              <li key={s.name} className="stp" style={st(i * 0.08, 0.2)}>
                <span className="yr">{s.year}</span>
                <b>{s.name}</b>
                {s.lessons.map(id => (
                  <Link key={id} href={'/lessons/' + id}>
                    {short(id)}
                  </Link>
                ))}
              </li>
            ))}
          </ol>
          <ul className="nums">
            <li>{playCount} 个先预测再运行的示例</li>
            <li>{exCount} 道自动判分练习</li>
            <li>{quizCount} 道测验题进入间隔复习</li>
          </ul>
          <Actions big />
          <p className="st-links">
            <Link href="/roadmap">查看课程地图</Link>
          </p>
          <p className="foot">
            代码 <a href="https://github.com/paddychenc75/hands-on-react/blob/main/LICENSE">MIT</a> · 课文{' '}
            <a href="https://github.com/paddychenc75/hands-on-react/blob/main/LICENSE-CONTENT">CC BY-NC-SA 4.0</a> ·{' '}
            <a href="https://github.com/paddychenc75/hands-on-react">GitHub</a>
          </p>
        </div>
      </section>
    </div>
  );
}
