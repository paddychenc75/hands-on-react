const opts = `<option value="daily">每天</option>
        <option value="weekly">每周</option>
        <option value="monthly">每月</option>`;
const app = ({ box, sel, sum, head = '' }) => `import { useState } from 'react';
${head}
function App() {
  const [subscribed, setSubscribed] = useState(false);
  const [freq, setFreq] = useState('weekly');
  return (
    <div>
      <label>
        ${box}
        接收邮件
      </label>
      ${sel}
        ${opts}
      </select>
      ${sum}
    </div>
  );
}`;
const L = `const LABELS = { daily: '每天', weekly: '每周', monthly: '每月' };`;
const okBox = `<input id="sub" type="checkbox" checked={subscribed} onChange={e => setSubscribed(e.target.checked)} />`;
const okSel = `<select id="freq" value={freq} disabled={!subscribed} onChange={e => setFreq(e.target.value)}>`;
const okSum = `<p id="summary">{subscribed ? '已订阅，' + LABELS[freq] : '未订阅'}</p>`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /不在 value 里/ },
  {
    name: '错误 A：复选框读 e.target.value，下拉框也接好了',
    expect: 'fail',
    match: /不在 value 里/,
    code: app({
      box: `<input id="sub" type="checkbox" checked={subscribed} onChange={e => setSubscribed(e.target.value)} />`,
      sel: okSel,
      sum: okSum,
      head: L,
    }),
  },
  {
    name: '错误 B：下拉框只有 value，没有 onChange',
    expect: 'fail',
    match: /弹回了别的选项/,
    code: app({ box: okBox, sel: `<select id="freq" value={freq} disabled={!subscribed}>`, sum: okSum, head: L }),
  },
  {
    name: '错误 C：复选框 onChange 只会设 true，取消不了',
    expect: 'fail',
    match: /应该取消勾选/,
    code: app({ box: `<input id="sub" type="checkbox" checked={subscribed} onChange={() => setSubscribed(true)} />`, sel: okSel, sum: okSum, head: L }),
  },
  {
    name: '错误 D：摘要直接显示 state 的 value（weekly）',
    expect: 'fail',
    match: /显示要用对应的文字/,
    code: app({ box: okBox, sel: okSel, sum: `<p id="summary">{subscribed ? '已订阅，' + freq : '未订阅'}</p>` }),
  },
  {
    name: '错误 E：没有禁用下拉框',
    expect: 'fail',
    match: /应是禁用的/,
    code: app({ box: okBox, sel: `<select id="freq" value={freq} onChange={e => setFreq(e.target.value)}>`, sum: okSum, head: L }),
  },
  {
    name: '不同写法：一个对象 state + 通用 handleChange（用 name 属性）',
    expect: 'pass',
    code: `import { useState } from 'react';

const LABELS = { daily: '每天', weekly: '每周', monthly: '每月' };

function App() {
  const [form, setForm] = useState({ subscribed: false, freq: 'weekly' });
  function handleChange(e) {
    const { name, type, checked, value } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }
  return (
    <div>
      <label>
        <input id="sub" type="checkbox" name="subscribed" checked={form.subscribed} onChange={handleChange} />
        接收邮件
      </label>
      <select id="freq" name="freq" value={form.freq} disabled={!form.subscribed} onChange={handleChange}>
        <option value="daily">每天</option>
        <option value="weekly">每周</option>
        <option value="monthly">每月</option>
      </select>
      <p id="summary">{form.subscribed ? '已订阅，' + LABELS[form.freq] : '未订阅'}</p>
    </div>
  );
}`,
  },
  {
    name: '不同写法：option 的 value 直接用中文，无需映射',
    expect: 'pass',
    code: `import { useState } from 'react';

function App() {
  const [on, setOn] = useState(false);
  const [freq, setFreq] = useState('每周');
  return (
    <div>
      <label>
        <input id="sub" type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} />
        接收邮件
      </label>
      <select id="freq" value={freq} disabled={!on} onChange={e => setFreq(e.target.value)}>
        <option>每天</option>
        <option>每周</option>
        <option>每月</option>
      </select>
      <p id="summary">{on ? '已订阅，' + freq : '未订阅'}</p>
    </div>
  );
}`,
  },
];
