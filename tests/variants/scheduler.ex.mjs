// 调度器正式练习的变体：参考答案、起始代码、不让出主线程的同步实现、微任务假让出、不同写法
const APP = `
function App() { return <div>x</div>; }
`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail' },
  {
    name: '同步实现：登记时就做完',
    expect: 'fail',
    match: /同步做完|占用/,
    code:
      `export function createScheduler() {
  const urgentQueue = [];
  return {
    scheduleTransition(job) {
      const r = [];
      for (let i = 0; i < job.total; i++) r.push(job.performUnit(i));
      job.commit(r);
    },
    scheduleUrgent(fn) { fn(); },
  };
}` + APP,
  },
  {
    name: '微任务假让出：Promise.then 分片',
    expect: 'fail',
    match: /占用|微任务|让出/,
    code:
      `export function createScheduler() {
  const urgentQueue = [];
  let job = null, index = 0, results = [];
  async function loop() {
    while (job && index < job.total) {
      if (urgentQueue.length) { while (urgentQueue.length) urgentQueue.shift()(); index = 0; results = []; }
      results.push(job.performUnit(index++));
      await Promise.resolve();
    }
    if (job) { const d = job, r = results; job = null; index = 0; results = []; d.commit(r); }
  }
  return {
    scheduleTransition(next) { job = next; index = 0; results = []; Promise.resolve().then(loop); },
    scheduleUrgent(fn) { urgentQueue.push(fn); Promise.resolve().then(loop); },
  };
}` + APP,
  },
  {
    name: '不同写法：对象状态加 3ms 时间片',
    expect: 'pass',
    code:
      `export function createScheduler() {
  const st = { job: null, i: 0, out: [], urgent: [], pending: false };
  const ch = new MessageChannel();
  const slice = () => {
    st.pending = false;
    if (st.urgent.length) {
      st.urgent.splice(0).forEach(f => f());
      st.i = 0;
      st.out = [];
    }
    const j = st.job;
    if (!j) return;
    const end = performance.now() + 3;
    do {
      if (st.i >= j.total) break;
      st.out.push(j.performUnit(st.i++));
    } while (performance.now() < end);
    if (st.i < j.total) return ask();
    const res = st.out;
    st.job = null; st.i = 0; st.out = [];
    j.commit(res);
  };
  function ask() {
    if (!st.pending) { st.pending = true; ch.port2.postMessage(0); }
  }
  ch.port1.onmessage = slice;
  return {
    scheduleTransition(j) { st.job = j; st.i = 0; st.out = []; ask(); },
    scheduleUrgent(f) { st.urgent.push(f); ask(); },
  };
}` + APP,
  },
];
