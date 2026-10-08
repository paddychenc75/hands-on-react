// 动画与过渡正式练习（usePresence）的变体
const CSS = `
        .panel { padding: 12px; margin-top: 8px; background: #cfe8f3; color: #0f1d24; border-radius: 6px; opacity: 1; transition: opacity 200ms; }
        .panel.leaving { opacity: 0; }
      `;
const HEAD = `import { useState, useEffect, useReducer, useRef, useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    onChange => {
      const media = window.matchMedia(QUERY);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
`;
const APP = `
function App() {
  const [open, setOpen] = useState(false);
  const { mounted, leaving, onTransitionEnd } = usePresence(open);
  return (
    <div>
      <style>{\`${CSS}\`}</style>
      <button id="toggle" onClick={() => setOpen(!open)}>{open ? '关闭' : '打开'}</button>
      {mounted && (
        <div id="panel" className={leaving ? 'panel leaving' : 'panel'} onTransitionEnd={onTransitionEnd}>面板内容</div>
      )}
    </div>
  );
}
`;
const mk = body => HEAD + body + APP;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /离场|leaving|卸载/ },
  {
    name: '只靠 onTransitionEnd，没有超时兜底',
    expect: 'fail',
    match: /超时兜底|transitionend/,
    code: mk(`
function usePresence(open) {
  const reduce = usePrefersReducedMotion();
  const [phase, setPhase] = useState(open ? 'entered' : 'gone');
  if (open && phase !== 'entered') setPhase('entered');
  else if (!open && phase === 'entered') setPhase(reduce ? 'gone' : 'leaving');
  return { mounted: phase !== 'gone', leaving: phase === 'leaving', onTransitionEnd: e => { if (e.target === e.currentTarget && phase === 'leaving') setPhase('gone'); } };
}`),
  },
  {
    name: '定时器没有清理：离场中重新打开又被旧定时器卸载',
    expect: 'fail',
    match: /重新打开|取消/,
    code: mk(`
function usePresence(open) {
  const reduce = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (open) { setMounted(true); setLeaving(false); }
    else if (reduce) setMounted(false);
    else { setLeaving(true); setTimeout(() => { setMounted(false); setLeaving(false); }, 400); }
  }, [open]);
  return { mounted, leaving, onTransitionEnd() {} };
}`),
  },
  {
    name: 'onTransitionEnd 不看当前阶段：重新打开后被过渡结束事件卸载',
    expect: 'fail',
    match: /重新打开|取消/,
    code: mk(`
function usePresence(open) {
  const reduce = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(0);
  useEffect(() => {
    if (open) { clearTimeout(timer.current); setMounted(true); setLeaving(false); }
    else if (reduce) setMounted(false);
    else { setLeaving(true); timer.current = setTimeout(() => { setMounted(false); setLeaving(false); }, 400); }
    return () => {};
  }, [open]);
  return { mounted, leaving, onTransitionEnd: () => { setMounted(false); setLeaving(false); } };
}`),
  },
  {
    name: '忽略“减少动画”',
    expect: 'fail',
    match: /减少动画/,
    code: mk(`
function usePresence(open) {
  const [phase, setPhase] = useState(open ? 'entered' : 'gone');
  if (open && phase !== 'entered') setPhase('entered');
  else if (!open && phase === 'entered') setPhase('leaving');
  useEffect(() => { if (phase !== 'leaving') return; const t = setTimeout(() => setPhase('gone'), 400); return () => clearTimeout(t); }, [phase]);
  return { mounted: phase !== 'gone', leaving: phase === 'leaving', onTransitionEnd: e => { if (e.target === e.currentTarget && phase === 'leaving') setPhase('gone'); } };
}`),
  },
  {
    name: '定时器太短：动画没播完就卸载',
    expect: 'fail',
    match: /离场动画/,
    code: mk(`
function usePresence(open) {
  const reduce = usePrefersReducedMotion();
  const [phase, setPhase] = useState(open ? 'entered' : 'gone');
  if (open && phase !== 'entered') setPhase('entered');
  else if (!open && phase === 'entered') setPhase(reduce ? 'gone' : 'leaving');
  useEffect(() => { if (phase !== 'leaving') return; const t = setTimeout(() => setPhase('gone'), 20); return () => clearTimeout(t); }, [phase]);
  return { mounted: phase !== 'gone', leaving: phase === 'leaving', onTransitionEnd() {} };
}`),
  },
  {
    name: '加了 leaving 类但永远不卸载',
    expect: 'fail',
    match: /最终应该被卸载/,
    code: mk(`
function usePresence(open) {
  const reduce = usePrefersReducedMotion();
  const [phase, setPhase] = useState(open ? 'entered' : 'gone');
  if (open && phase !== 'entered') setPhase('entered');
  else if (!open && phase === 'entered') setPhase(reduce ? 'gone' : 'leaving');
  return { mounted: phase !== 'gone', leaving: phase === 'leaving', onTransitionEnd() {} };
}`),
  },
  {
    name: '不同写法：只用定时器（250ms），不用 transitionend',
    expect: 'pass',
    code: mk(`
function usePresence(open) {
  const reduce = usePrefersReducedMotion();
  const [phase, setPhase] = useState(open ? 'entered' : 'gone');
  if (open && phase !== 'entered') setPhase('entered');
  else if (!open && phase === 'entered') setPhase(reduce ? 'gone' : 'leaving');
  useEffect(() => {
    if (phase !== 'leaving') return;
    const t = setTimeout(() => setPhase('gone'), 250);
    return () => clearTimeout(t);
  }, [phase]);
  return { mounted: phase !== 'gone', leaving: phase === 'leaving', onTransitionEnd() {} };
}`),
  },
  {
    name: '不同写法：useReducer 状态机 + effect 里处理 open 变化',
    expect: 'pass',
    code: mk(`
function reducer(state, action) {
  switch (action) {
    case 'show': return 'entered';
    case 'hide': return state === 'entered' ? 'leaving' : state;
    case 'hideNow': return 'gone';
    case 'done': return state === 'leaving' ? 'gone' : state;
    default: return state;
  }
}
function usePresence(open) {
  const reduce = usePrefersReducedMotion();
  const [phase, dispatch] = useReducer(reducer, open ? 'entered' : 'gone');
  useEffect(() => {
    if (open) dispatch('show');
    else dispatch(reduce ? 'hideNow' : 'hide');
  }, [open, reduce]);
  useEffect(() => {
    if (phase !== 'leaving') return;
    const t = setTimeout(() => dispatch('done'), 500);
    return () => clearTimeout(t);
  }, [phase]);
  return { mounted: phase !== 'gone', leaving: phase === 'leaving', onTransitionEnd: e => { if (e.target === e.currentTarget) dispatch('done'); } };
}`),
  },
];
