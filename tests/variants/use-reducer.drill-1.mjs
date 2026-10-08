const app = (init = '{ count: 0, step: 1 }') => `
function App() {
  const [state, dispatch] = useReducer(reducer, ${init});
  return (
    <div>
      <p>计数：<b id="count">{state.count}</b>，步长：<b id="step">{state.step}</b></p>
      <button onClick={() => dispatch({ type: 'increment' })}>加</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>减</button>
      <button onClick={() => dispatch({ type: 'setStep', step: 1 })}>步长 1</button>
      <button onClick={() => dispatch({ type: 'setStep', step: 5 })}>步长 5</button>
      <button onClick={() => dispatch({ type: 'reset' })}>重置</button>
    </div>
  );
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /increment 应让 count 加上 step/ },
  {
    name: '错误 A：increment 忽略 step，每次只加 1',
    expect: 'fail',
    match: /increment 应让 count 加上 step/,
    code: `import { useReducer } from 'react';
function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { ...state, count: state.count + 1 };
    case 'decrement': return { ...state, count: state.count - 1 };
    case 'setStep': return { ...state, step: action.step };
    case 'reset': return { count: 0, step: 1 };
    default: return state;
  }
}${app()}`,
  },
  {
    name: '错误 B：直接修改 state 再返回同一个对象',
    expect: 'fail',
    match: /修改了原来的 state/,
    code: `import { useReducer } from 'react';
function reducer(state, action) {
  switch (action.type) {
    case 'increment': state.count += state.step; return state;
    case 'decrement': state.count -= state.step; return state;
    case 'setStep': state.step = action.step; return state;
    case 'reset': return { count: 0, step: 1 };
    default: return state;
  }
}${app()}`,
  },
  {
    name: '错误 C：reset 和 setStep 丢掉了另一个字段',
    expect: 'fail',
    match: /setStep 只改 step|reset 应回到初始状态/,
    code: `import { useReducer } from 'react';
function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { ...state, count: state.count + state.step };
    case 'decrement': return { ...state, count: state.count - state.step };
    case 'setStep': return { step: action.step };
    case 'reset': return { count: 0 };
    default: return state;
  }
}${app()}`,
  },
  {
    name: '错误 D：投机，setStep 永远设成 5',
    expect: 'fail',
    match: /setStep 只改 step/,
    code: `import { useReducer } from 'react';
function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { ...state, count: state.count + state.step };
    case 'decrement': return { ...state, count: state.count - state.step };
    case 'setStep': return { ...state, step: 5 };
    case 'reset': return { count: 0, step: 1 };
    default: return state;
  }
}${app()}`,
  },
  {
    name: '错误 E：reducer 对了，但 App 还在用 useState',
    expect: 'fail',
    match: /useReducer\(reducer/,
    code: `import { useState } from 'react';
function reducer(state, action) {
  switch (action.type) {
    case 'increment': return { ...state, count: state.count + state.step };
    case 'decrement': return { ...state, count: state.count - state.step };
    case 'setStep': return { ...state, step: action.step };
    case 'reset': return { count: 0, step: 1 };
    default: return state;
  }
}
function App() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);
  return (
    <div>
      <p>计数：<b id="count">{count}</b>，步长：<b id="step">{step}</b></p>
      <button onClick={() => setCount(count + step)}>加</button>
      <button onClick={() => setCount(count - step)}>减</button>
      <button onClick={() => setStep(1)}>步长 1</button>
      <button onClick={() => setStep(5)}>步长 5</button>
      <button onClick={() => { setCount(0); setStep(1); }}>重置</button>
    </div>
  );
}`,
  },
  {
    name: '不同写法：if/else、惰性初始化、reset 复用 init',
    expect: 'pass',
    code: `import { useReducer } from 'react';
const init = () => ({ count: 0, step: 1 });
function reducer(state, action) {
  const { type } = action;
  if (type === 'increment') return Object.assign({}, state, { count: state.count + state.step });
  if (type === 'decrement') return { count: state.count - state.step, step: state.step };
  if (type === 'setStep') return { count: state.count, step: action.step };
  if (type === 'reset') return init();
  return state;
}${app('undefined, init').replace('useReducer(reducer, undefined, init)', 'useReducer(reducer, null, init)')}`,
  },
];
