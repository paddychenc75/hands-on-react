/* 课文里的组件树示意图：状态沿着组件树流下去（动画和交互）。
 * 静态的树（节点按钮、连线、开关）由 theme/components/RenderTree.tsx 渲染进 HTML；
 * 这个模块在自己的异步 chunk 里，挂载后“激活”它：点击、光点、计数、memo、自动演示。
 * 哪些节点渲染、按什么顺序和延迟由 logic/heroTree.ts 的纯函数算，这里只负责演出。
 * 只动 transform、opacity 和 SVG 的 stroke-dashoffset（Web Animations API），不触发布局。 */
import {
  HERO_NODES,
  SETTLE_MS,
  TRAVEL_MS,
  type Counts,
  type PulsePlan,
  type PulseStep,
  bump,
  describePlan,
  initialCounts,
  narratePlan,
  planPulse,
} from './logic/heroTree.ts';
import { accName } from './logic/heroTreeData.ts';

const DEMO_KEY = 'hoc-hero-demo'; // sessionStorage：本次会话里自动演示播过了（根元素的 data-demo-key 可以换成别的键，memo 默认打开的那张图用自己的键）
const TOUCHED_KEY = 'hoc-hero-touched'; // localStorage：用户点过节点，不再出现“可点”提示（不是学习进度的键）
const DEMO_ORIGIN = 'TodoList';
const HINT_NODE = 'Header';
const LIT_MS = 900;

const read = (area: 'session' | 'local', key: string): string | null => {
  try {
    return (area === 'session' ? sessionStorage : localStorage).getItem(key);
  } catch {
    return null;
  }
};
const write = (area: 'session' | 'local', key: string) => {
  try {
    (area === 'session' ? sessionStorage : localStorage).setItem(key, '1');
  } catch {
    /* 隐私模式等：当作没有记住 */
  }
};

/** 激活 root 里的静态树，返回销毁函数（取消进行中的动画和定时器、移除监听）。 */
export function attach(root: HTMLElement): () => void {
  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);
  const nodes = new Map<string, HTMLButtonElement>();
  root.querySelectorAll<HTMLButtonElement>('.tnode').forEach(b => nodes.set(b.dataset.id || '', b));
  const edges = new Map<string, { glow: SVGPathElement; core: SVGPathElement }>();
  root.querySelectorAll<SVGGElement>('[data-edge]').forEach(g => {
    const glow = g.querySelector<SVGPathElement>('.tglow');
    const core = g.querySelector<SVGPathElement>('.tpulse');
    if (glow && core) edges.set(g.dataset.edge || '', { glow, core });
  });
  const note = q<HTMLElement>('.ht-note');
  const live = q<HTMLElement>('.ht-live');
  const memoInput = q<HTMLInputElement>('.ht-memo-input');
  const resetBtn = q<HTMLButtonElement>('.ht-reset');
  const stage = q<HTMLElement>('.ht-stage') || root;
  const memoIds = HERO_NODES.filter(n => n.memoizable).map(n => n.id);

  let counts: Counts = initialCounts(HERO_NODES);
  let memo = new Set<string>(memoInput?.checked ? memoIds : []); // 静态 HTML 里开关默认就是选中的（memo 默认打开的那张图）
  let active = 0; // 进行中的脉冲数
  let destroyed = false;
  let interacted = false;
  const demoKey = root.dataset.demoKey || DEMO_KEY;
  let played = !!read('session', demoKey);
  let inView = false;
  let liveToggle = false;
  const involved = new Map<string, number>();
  const anims = new Set<Animation>();
  const rolls = new Map<string, Animation[]>();
  const plain = new Set<number>(); // 只做外观的定时器
  const essential = new Map<number, (instant: boolean) => void>(); // 改计数和收尾的定时器：切到后台时要立刻执行
  const litTimer = new Map<string, number>();
  let demoTimer = 0;
  let hintTimer = 0;
  const ac = new AbortController();

  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const after = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      plain.delete(id);
      fn();
    }, ms);
    plain.add(id);
    return id;
  };
  const later = (fn: (instant: boolean) => void, ms: number) => {
    const id = window.setTimeout(() => {
      essential.delete(id);
      fn(false);
    }, ms);
    essential.set(id, fn);
  };
  const play = (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
    const a = el.animate(frames, opts);
    anims.add(a);
    const done = () => {
      anims.delete(a);
      a.cancel();
    };
    a.onfinish = done;
    a.oncancel = () => anims.delete(a);
    return a;
  };

  const say = (text: string) => {
    if (note) note.textContent = text;
  };
  const announce = (text: string) => {
    if (!live) return;
    liveToggle = !liveToggle;
    live.textContent = text + (liveToggle ? '' : '​'); // 同一句话连续出现时也让读屏重读
  };

  const label = (id: string) => accName(HERO_NODES, id, counts[id], memo.has(id));
  const refreshLabels = () => nodes.forEach((b, id) => b.setAttribute('aria-label', label(id)));

  const paintCount = (id: string, animate: boolean) => {
    const b = nodes.get(id);
    const n = b?.querySelector<HTMLElement>('.n');
    if (!b || !n) return;
    const text = String(counts[id]);
    const old = n.textContent || '';
    rolls.get(id)?.forEach(a => a.cancel());
    n.removeAttribute('data-old');
    if (old !== text) {
      n.textContent = text;
      if (animate) {
        // 数字滚动一位：旧数字（伪元素）向上滚出，新数字从下面滚进来
        n.setAttribute('data-old', old);
        const opts = { duration: 280, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'both' as const };
        const a1 = play(
          n,
          [
            { transform: 'translateY(75%)', opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          opts,
        );
        const a2 = play(
          n,
          [
            { transform: 'none', opacity: 1 },
            { transform: 'translateY(-75%)', opacity: 0 },
          ],
          { ...opts, pseudoElement: '::after' },
        );
        rolls.set(id, [a1, a2]);
        a2.onfinish = () => {
          n.removeAttribute('data-old');
          a1.cancel();
          a2.cancel();
        };
      }
    }
    b.setAttribute('aria-label', label(id));
  };

  const setLit = (id: string, on: boolean, cls = 'lit') => nodes.get(id)?.classList.toggle(cls, on);
  const holdClass = (id: string, cls: string) => {
    setLit(id, true, cls);
    window.clearTimeout(litTimer.get(id + cls));
    const t = after(() => setLit(id, false, cls), LIT_MS);
    litTimer.set(id + cls, t);
  };

  const arriveRender = (id: string, instant: boolean, motion: boolean) => {
    counts = bump(counts, id);
    paintCount(id, motion && !instant);
    updateReset();
    if (instant) return;
    holdClass(id, 'lit');
    const b = nodes.get(id);
    if (motion && b)
      play(b, [{ transform: 'scale(1)' }, { transform: 'scale(1.08)', offset: 0.35 }, { transform: 'scale(.98)', offset: 0.7 }, { transform: 'scale(1)' }], {
        duration: 380,
        easing: 'cubic-bezier(.3,.7,.4,1)',
      });
  };
  const arriveBlocked = (id: string, instant: boolean, motion: boolean) => {
    if (instant) return;
    holdClass(id, 'blocked');
    const b = nodes.get(id);
    if (motion && b)
      play(
        b,
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-3px)', offset: 0.2 },
          { transform: 'translateX(3px)', offset: 0.45 },
          { transform: 'translateX(-2px)', offset: 0.7 },
          { transform: 'translateX(0)' },
        ],
        { duration: 320 },
      );
  };

  /** 一道光沿着 parent → child 的连线流过去；被 memo 挡住的那条流到一半多弹回来 */
  const flow = (step: PulseStep) => {
    const e = edges.get(step.id);
    if (!e) return;
    const blocked = step.outcome === 'blocked';
    const dur = blocked ? TRAVEL_MS / 0.6 : TRAVEL_MS / 0.75;
    const frames = (peak: number): Keyframe[] =>
      blocked
        ? [
            { strokeDashoffset: 0.2, opacity: 0 },
            { strokeDashoffset: 0.12, opacity: peak, offset: 0.08 },
            { strokeDashoffset: -0.55, opacity: peak, offset: 0.6 },
            { strokeDashoffset: -0.2, opacity: 0 },
          ]
        : [
            { strokeDashoffset: 0.2, opacity: 0 },
            { strokeDashoffset: 0.12, opacity: peak, offset: 0.06 },
            { strokeDashoffset: -0.8, opacity: peak, offset: 0.75 },
            { strokeDashoffset: -1, opacity: 0 },
          ];
    play(e.glow, frames(0.3), { duration: dur, delay: step.startMs, fill: 'both', easing: 'linear' });
    play(e.core, frames(1), { duration: dur, delay: step.startMs, fill: 'both', easing: 'linear' });
  };

  const markInvolved = (plan: PulsePlan, delta: 1 | -1) => {
    for (const s of plan.steps) {
      const n = (involved.get(s.id) || 0) + delta;
      involved.set(s.id, n);
      nodes.get(s.id)?.classList.toggle('on', n > 0);
    }
    active += delta;
    root.classList.toggle('busy', active > 0);
    root.dataset.active = String(active);
  };

  const pulse = (origin: string) => {
    const plan = planPulse(HERO_NODES, origin, memo);
    const motion = !reduced();
    say(narratePlan(HERO_NODES, plan, memo));
    announce(describePlan(HERO_NODES, plan));
    markInvolved(plan, 1);
    for (const s of plan.steps) {
      if (s.depth === 0) {
        arriveRender(s.id, false, motion);
        const b = nodes.get(s.id);
        if (motion && b)
          play(
            b,
            [{ transform: 'scale(1)' }, { transform: 'scale(.92)', offset: 0.3 }, { transform: 'scale(1.06)', offset: 0.65 }, { transform: 'scale(1)' }],
            { duration: 320, easing: 'ease-out' },
          );
        continue;
      }
      if (motion) flow(s);
      later(instant => (s.outcome === 'render' ? arriveRender(s.id, instant, motion) : arriveBlocked(s.id, instant, motion)), motion ? s.arriveMs : 0);
    }
    later(() => markInvolved(plan, -1), motion ? plan.durationMs + SETTLE_MS : LIT_MS);
    return plan;
  };

  /** 切到后台、卸载：不补播，直接把进行中的脉冲收尾（计数照加，动画和高亮清掉） */
  const settle = () => {
    for (const [id, fn] of [...essential]) {
      window.clearTimeout(id);
      essential.delete(id);
      fn(true);
    }
    for (const id of plain) window.clearTimeout(id);
    plain.clear();
    litTimer.clear();
    for (const a of [...anims]) a.cancel();
    anims.clear();
    nodes.forEach((b, id) => {
      b.classList.remove('lit', 'blocked', 'on', 'hint');
      b.querySelector('.n')?.removeAttribute('data-old');
      paintCount(id, false);
    });
    root.classList.remove('busy');
    involved.clear();
    active = 0;
    root.dataset.active = '0';
  };

  const updateReset = () => {
    if (!resetBtn) return;
    const dirty = HERO_NODES.some(n => counts[n.id] !== 1);
    resetBtn.setAttribute('aria-disabled', dirty ? 'false' : 'true');
  };

  const touch = () => {
    interacted = true;
    write('local', TOUCHED_KEY);
    window.clearTimeout(demoTimer);
    window.clearTimeout(hintTimer);
    nodes.forEach(b => b.classList.remove('hint'));
  };

  const onNode = (id: string) => {
    touch();
    pulse(id);
  };

  // ---- 自动演示和“可点”提示 ----
  const hint = (round: number) => {
    if (destroyed || read('local', TOUCHED_KEY) || reduced() || document.hidden) return;
    const b = nodes.get(HINT_NODE);
    if (!b) return;
    b.classList.add('hint');
    b.addEventListener('animationend', () => b.classList.remove('hint'), { once: true });
    if (round < 2) hintTimer = after(() => hint(round + 1), 9000);
  };
  const maybeDemo = () => {
    window.clearTimeout(demoTimer);
    if (destroyed || !inView || document.hidden || interacted || reduced()) return;
    if (played) return;
    demoTimer = after(() => {
      if (destroyed || !inView || document.hidden || interacted || played) return;
      played = true;
      write('session', demoKey);
      const plan = pulse(DEMO_ORIGIN);
      hintTimer = after(() => hint(1), plan.durationMs + SETTLE_MS + 1800);
    }, 600);
  };

  // ---- 事件 ----
  root.addEventListener(
    'click',
    e => {
      const t = (e.target as Element).closest<HTMLElement>('.tnode');
      if (t && root.contains(t)) onNode(t.dataset.id || '');
    },
    { signal: ac.signal },
  );
  memoInput?.addEventListener(
    'change',
    () => {
      memo = new Set(memoInput.checked ? memoIds : []);
      root.classList.toggle('memo-on', memoInput.checked);
      refreshLabels();
      const text = memoInput.checked ? 'memo 已开启：试试点 TodoList，再直接点一个 Item' : 'memo 已关闭：后代会跟着一起渲染';
      say(text);
      announce(text);
    },
    { signal: ac.signal },
  );
  resetBtn?.addEventListener(
    'click',
    () => {
      if (resetBtn.getAttribute('aria-disabled') === 'true') return;
      counts = initialCounts(HERO_NODES);
      nodes.forEach((_b, id) => paintCount(id, false));
      updateReset();
      say('计数已重置');
      announce('渲染次数已重置');
    },
    { signal: ac.signal },
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        window.clearTimeout(demoTimer);
        settle();
      } else maybeDemo();
    },
    { signal: ac.signal },
  );

  const io =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(
          es => {
            inView = es[es.length - 1].isIntersecting;
            maybeDemo();
          },
          { threshold: 0.6 },
        )
      : null;
  io?.observe(stage);

  // 激活：开关和重置按钮可用
  if (memoInput) memoInput.disabled = false;
  if (memo.size) refreshLabels();
  root.dataset.ready = '1';
  root.dataset.active = '0';
  updateReset();
  if (!io) {
    inView = true;
    maybeDemo();
  }
  // 这次会话里已经演示过，但用户还没点过：只给一次“可点”提示
  if (played && !read('local', TOUCHED_KEY)) hintTimer = after(() => hint(2), 2500);

  return () => {
    destroyed = true;
    ac.abort();
    io?.disconnect();
    window.clearTimeout(demoTimer);
    window.clearTimeout(hintTimer);
    // 卸载：丢掉进行中的收尾（页面已经离开），取消所有动画和定时器
    for (const id of essential.keys()) window.clearTimeout(id);
    essential.clear();
    settle();
    delete root.dataset.ready;
  };
}
