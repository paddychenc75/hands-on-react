const appTail = `
function App() {
  const [items, dispatch] = useReducer(reducer, []);
  return (
    <div>
      <button onClick={() => dispatch({ type: 'added', id: 'apple', name: '苹果' })}>加苹果</button>
      <button onClick={() => dispatch({ type: 'added', id: 'pear', name: '梨' })}>加梨</button>
      <ul id="cart">
        {items.map(i => (
          <li key={i.id}>
            {i.name} × <span className="qty">{i.qty}</span>
            <button onClick={() => dispatch({ type: 'changedQty', id: i.id, qty: i.qty - 1 })}>减一个</button>
            <button onClick={() => dispatch({ type: 'removed', id: i.id })}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`;
export default [
  { name: '参考答案', code: '$solution', expect: 'pass' },
  { name: '起始代码', code: '$starter', expect: 'fail', match: /reducer 修改了原来的购物车（added）/ },
  {
    name: '错误 A：数组换成新的了，但已有商品的 qty 仍直接改原对象',
    expect: 'fail',
    match: /修改了原来的购物车（added）/,
    code: `import { useReducer } from 'react';
function reducer(items, action) {
  switch (action.type) {
    case 'added': {
      const found = items.find(i => i.id === action.id);
      if (found) { found.qty += 1; return [...items]; }
      return [...items, { id: action.id, name: action.name, qty: 1 }];
    }
    case 'removed': return items.filter(i => i.id !== action.id);
    case 'changedQty':
      if (action.qty <= 0) return items.filter(i => i.id !== action.id);
      return items.map(i => (i.id === action.id ? { ...i, qty: action.qty } : i));
    default: return items;
  }
}${appTail}`,
  },
  {
    name: '错误 B：不可变写对了，但 added 不合并，同一商品出现两行',
    expect: 'fail',
    match: /不要多出一行/,
    code: `import { useReducer } from 'react';
function reducer(items, action) {
  switch (action.type) {
    case 'added': return [...items, { id: action.id, name: action.name, qty: 1 }];
    case 'removed': return items.filter(i => i.id !== action.id);
    case 'changedQty':
      if (action.qty <= 0) return items.filter(i => i.id !== action.id);
      return items.map(i => (i.id === action.id ? { ...i, qty: action.qty } : i));
    default: return items;
  }
}${appTail}`,
  },
  {
    name: '错误 C：没有 default，也没处理数量为 0',
    expect: 'fail',
    match: /数量改成 0|undefined/,
    code: `import { useReducer } from 'react';
function reducer(items, action) {
  switch (action.type) {
    case 'added':
      if (items.some(i => i.id === action.id)) return items.map(i => (i.id === action.id ? { ...i, qty: i.qty + 1 } : i));
      return [...items, { id: action.id, name: action.name, qty: 1 }];
    case 'removed': return items.filter(i => i.id !== action.id);
    case 'changedQty': return items.map(i => (i.id === action.id ? { ...i, qty: action.qty } : i));
  }
}${appTail}`,
  },
  {
    name: '错误 D：只有 default 缺失，其余都对',
    expect: 'fail',
    match: /不认识的 action 时返回了 undefined/,
    code: `import { useReducer } from 'react';
function reducer(items, action) {
  switch (action.type) {
    case 'added':
      if (items.some(i => i.id === action.id)) return items.map(i => (i.id === action.id ? { ...i, qty: i.qty + 1 } : i));
      return [...items, { id: action.id, name: action.name, qty: 1 }];
    case 'removed': return items.filter(i => i.id !== action.id);
    case 'changedQty':
      if (action.qty <= 0) return items.filter(i => i.id !== action.id);
      return items.map(i => (i.id === action.id ? { ...i, qty: action.qty } : i));
  }
}${appTail}`,
  },
  {
    name: '不同写法：if 链 + reduce/findIndex，default 返回原 state',
    expect: 'pass',
    code: `import { useReducer } from 'react';
function reducer(items, action) {
  if (action.type === 'added') {
    const at = items.findIndex(i => i.id === action.id);
    if (at < 0) return items.concat({ id: action.id, name: action.name, qty: 1 });
    return [...items.slice(0, at), { ...items[at], qty: items[at].qty + 1 }, ...items.slice(at + 1)];
  }
  if (action.type === 'removed') return items.filter(i => i.id !== action.id);
  if (action.type === 'changedQty') {
    return items.reduce((acc, i) => {
      if (i.id !== action.id) return [...acc, i];
      return action.qty > 0 ? [...acc, Object.assign({}, i, { qty: action.qty })] : acc;
    }, []);
  }
  return items;
}${appTail}`,
  },
];
