const form = (formOpen, save, extra = '') => `import { useState } from 'react';

function App() {
  const [result, setResult] = useState('');
${save}
  return (
    ${formOpen}
      <input name="name" placeholder="姓名" ${extra} />
      <select name="city">
        <option>北京</option>
        <option>上海</option>
      </select>
      <label>
        <input type="checkbox" name="news" /> 订阅通知
      </label>
      <button>提交</button>
      <p id="result">{result}</p>
    </form>
  );
}`;
const fmt = n => `'姓名：' + d.get('name') + '；城市：' + d.get('city') + '；通知：' + ${n}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /页面会刷新/ },
  {
    name: '错误 A：把 FormData 的值当布尔值比较（=== true）',
    expect: 'fail',
    match: /FormData 里没有这个字段/,
    code: form(`<form action={save}>`, `  function save(d) { setResult(${fmt("(d.get('news') === true ? '是' : '否')")}); }`),
  },
  {
    name: '错误 B：通知直接显示 FormData 的值（on / null）',
    expect: 'fail',
    match: /FormData 里没有这个字段/,
    code: form(`<form action={save}>`, `  function save(d) { setResult(${fmt("d.get('news')")}); }`),
  },
  {
    name: '错误 C：onSubmit 里没调用 preventDefault',
    expect: 'fail',
    match: /preventDefault/,
    code: form(`<form onSubmit={save}>`, `  function save(e) { const d = new FormData(e.currentTarget); setResult(${fmt("(d.get('news') ? '是' : '否')")}); }`),
  },
  {
    name: '错误 D：写死结果文字',
    expect: 'fail',
    match: /取消勾选后再提交/,
    code: form(`<form action={save}>`, `  function save(d) { setResult('姓名：小美；城市：上海；通知：是'); }`),
  },
  {
    name: '错误 E：边输入边显示（受控并实时预览）',
    expect: 'fail',
    match: /应是空的/,
    code: `import { useState } from 'react';

function App() {
  const [name, setName] = useState('');
  const [city, setCity] = useState('北京');
  const [news, setNews] = useState(false);
  return (
    <form onSubmit={e => e.preventDefault()}>
      <input name="name" placeholder="姓名" value={name} onChange={e => setName(e.target.value)} />
      <select name="city" value={city} onChange={e => setCity(e.target.value)}>
        <option>北京</option>
        <option>上海</option>
      </select>
      <label>
        <input type="checkbox" name="news" checked={news} onChange={e => setNews(e.target.checked)} /> 订阅通知
      </label>
      <button>提交</button>
      <p id="result">姓名：{name}；城市：{city}；通知：{news ? '是' : '否'}</p>
    </form>
  );
}`,
  },
  {
    name: '不同写法：onSubmit + preventDefault + new FormData(e.currentTarget)',
    expect: 'pass',
    code: form(
      `<form onSubmit={save}>`,
      `  function save(e) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setResult(${fmt("(d.get('news') ? '是' : '否')")});
  }`,
    ),
  },
  {
    name: '不同写法：用 ref 在提交时读取各字段（action 里不用 FormData）',
    expect: 'pass',
    code: `import { useState, useRef } from 'react';

function App() {
  const [result, setResult] = useState('');
  const nameRef = useRef(null);
  const cityRef = useRef(null);
  const newsRef = useRef(null);

  function save(e) {
    e.preventDefault();
    setResult('姓名：' + nameRef.current.value + '；城市：' + cityRef.current.value + '；通知：' + (newsRef.current.checked ? '是' : '否'));
  }

  return (
    <form onSubmit={save}>
      <input name="name" placeholder="姓名" ref={nameRef} />
      <select name="city" ref={cityRef}>
        <option>北京</option>
        <option>上海</option>
      </select>
      <label>
        <input type="checkbox" name="news" ref={newsRef} /> 订阅通知
      </label>
      <button>提交</button>
      <p id="result">{result}</p>
    </form>
  );
}`,
  },
];
