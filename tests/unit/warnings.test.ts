import { describe, expect, it } from 'vitest';
import { type ReactWarning, formatMessage, isErrorReport, reactWarning, warningLine } from '../../course/engine/logic/warnings.ts';

// 样例是在真实的 React 18.3.1 / 19.3.0 开发版里实测收集到的 console 参数，不是手写的。
const STACK = '\n    at li\n    at App';
const w18 = {
  key: [
    'Warning: Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.%s',
    '\n\nCheck the render method of `App`.',
    '',
    STACK,
  ],
  controlled: [
    'Warning: You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.%s',
    '\n    at input\n    at App',
  ],
  renderUpdate: [
    'Warning: Cannot update a component (`%s`) while rendering a different component (`%s`). To locate the bad setState() call inside `%s`, follow the stack trace as described in https://reactjs.org/link/setstate-in-render%s',
    'App',
    'B',
    'B',
    '\n    at B',
  ],
  dom: ['Warning: Invalid DOM property `%s`. Did you mean `%s`?%s', 'class', 'className', '\n    at div'],
  boundaryReport: [
    'The above error occurred in the <Boom> component:\n\n    at Boom\n\nReact will try to recreate this component tree from scratch using the error boundary you provided, B.',
  ],
};
const w19 = {
  key: [
    'Each child in a list should have a unique "key" prop.%s%s See https://react.dev/link/warning-keys for more information.',
    '\n\nCheck the render method of `App`.',
    '',
  ],
  controlled: [
    'You provided a `value` prop to a form field without an `onChange` handler. This will render a read-only field. If the field should be mutable use `defaultValue`. Otherwise, set either `onChange` or `readOnly`.',
  ],
  renderUpdate: [
    'Cannot update a component (`%s`) while rendering a different component (`%s`). To locate the bad setState() call inside `%s`, follow the stack trace as described in https://react.dev/link/setstate-in-render',
    'App',
    'B',
    'B',
  ],
  dom: ['Invalid DOM property `%s`. Did you mean `%s`?', 'class', 'className'],
  nesting: ['In HTML, %s cannot be a descendant of <%s>.\nThis will cause a hydration error.%s', '<div>', 'p', '\n\n  <App>\n>   <p>\n>     <div>\n'],
  caught: [
    '%o\n\n%s\n\n%s\n',
    new Error('boom'),
    'The above error occurred in the <Boom> component.',
    'React will try to recreate this component tree from scratch using the error boundary you provided, B.',
  ],
  uncaught: [
    '%s\n\n%s\n',
    'An error occurred in the <Boom> component.',
    'Consider adding an error boundary to your tree to customize error handling behavior.\nVisit https://react.dev/link/error-boundaries to learn more about error boundaries.',
  ],
};

describe('React 18 的警告', () => {
  it('缺 key', () => {
    const w = reactWarning(18, 'error', w18.key);
    expect(w?.msg).toBe('Each child in a list should have a unique "key" prop.');
    expect(w?.zh).toBe('列表中的每个元素都需要唯一的 key。');
    expect(warningLine(w as ReactWarning)).toBe('React 警告：列表中的每个元素都需要唯一的 key。（Each child in a list should have a unique "key" prop.）');
  });
  it('受控输入没有 onChange', () => {
    expect(reactWarning(18, 'error', w18.controlled)?.zh).toBe('输入框有 value 但没有 onChange，所以它是只读的。');
  });
  it('渲染期间更新别的组件：%s 被换成组件名', () => {
    const w = reactWarning(18, 'error', w18.renderUpdate);
    expect(w?.msg).toMatch(/^Cannot update a component \(`App`\) while rendering a different component \(`B`\)/);
    expect(w?.zh).toBe('不要在渲染期间更新另一个组件的 state。');
  });
  it('没有中文解释的警告只显示英文原文（只取第一行，去掉 Warning: 前缀）', () => {
    expect(warningLine(reactWarning(18, 'error', w18.dom) as ReactWarning)).toBe('React 警告：Invalid DOM property `class`. Did you mean `className`?');
  });
  it('没有 "Warning:" 前缀的 console.error 不是 React 警告（例如其他代码自己打的）', () => {
    expect(reactWarning(18, 'error', ['网络出错了'])).toBeNull();
    expect(reactWarning(18, 'error', [new Error('x')])).toBeNull();
    expect(reactWarning(18, 'error', w19.key)).toBeNull(); // 19 的格式放到 18 的规则里不认
  });
  it('console.warn 不算，错误报告也不算', () => {
    expect(reactWarning(18, 'warn', w18.key)).toBeNull();
    expect(reactWarning(18, 'error', w18.boundaryReport)).toBeNull();
  });
});

describe('React 19 的警告', () => {
  it('缺 key：没有 Warning: 前缀，链接是 react.dev', () => {
    const w = reactWarning(19, 'error', w19.key);
    expect(w?.msg).toBe('Each child in a list should have a unique "key" prop.');
    expect(w?.zh).toBe('列表中的每个元素都需要唯一的 key。');
  });
  it('受控输入没有 onChange：整条消息没有任何 %s', () => {
    expect(reactWarning(19, 'error', w19.controlled)?.zh).toBe('输入框有 value 但没有 onChange，所以它是只读的。');
  });
  it('渲染期间更新别的组件', () => {
    const w = reactWarning(19, 'error', w19.renderUpdate);
    expect(w?.msg).toMatch(/^Cannot update a component \(`App`\) while rendering a different component \(`B`\)/);
    expect(w?.zh).toBe('不要在渲染期间更新另一个组件的 state。');
  });
  it('其他警告原样显示第一行：DOM 属性、标签嵌套（19 附的是 DOM 树，不是组件栈）', () => {
    expect(reactWarning(19, 'error', w19.dom)?.msg).toBe('Invalid DOM property `class`. Did you mean `className`?');
    expect(reactWarning(19, 'error', w19.nesting)?.msg).toBe('In HTML, <div> cannot be a descendant of <p>.');
  });
  it('错误报告不是警告：被错误边界接住的（error）和没接住的（warn）', () => {
    expect(reactWarning(19, 'error', w19.caught)).toBeNull();
    expect(reactWarning(19, 'warn', w19.uncaught)).toBeNull();
    expect(reactWarning(19, 'error', w18.boundaryReport)).toBeNull();
  });
  it('第一个参数不是字符串时不是警告', () => {
    expect(reactWarning(19, 'error', [new Error('x')])).toBeNull();
    expect(reactWarning(19, 'error', [])).toBeNull();
  });
  it('19 里 console.warn 发出的其他提醒也显示', () => {
    expect(reactWarning(19, 'warn', ['Something deprecated.'])?.msg).toBe('Something deprecated.');
  });
});

describe('辅助函数', () => {
  it('formatMessage 缺参数时换成空串', () => {
    expect(formatMessage(['a %s b %s c', 'X'])).toBe('a X b  c');
  });
  it('isErrorReport 认 18 和 19 的写法', () => {
    expect(isErrorReport(w18.boundaryReport)).toBe(true);
    expect(isErrorReport(w19.caught)).toBe(true);
    expect(isErrorReport(w19.uncaught)).toBe(true);
    expect(isErrorReport(w19.key)).toBe(false);
  });
});
