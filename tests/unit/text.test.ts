import { describe, expect, it } from 'vitest';
import { stripComments } from '../../course/engine/exec.ts';
import { explainError } from '../../course/engine/logic/errors.ts';
import { esc, fmtOpt } from '../../course/engine/logic/text.ts';

describe('esc / fmtOpt', () => {
  it('esc 转义 & < >', () => {
    expect(esc('<a & b>')).toBe('&lt;a &amp; b&gt;');
  });
  it('选项文字是纯文本：转义后，形如 <Tag> 的标签名包成 code', () => {
    expect(fmtOpt('<div>')).toBe('<code>&lt;div&gt;</code>');
    expect(fmtOpt('a < b')).toBe('a &lt; b');
    expect(fmtOpt('&lt;Foo&gt; 和 <b>')).toBe('<code>&lt;Foo&gt;</code> 和 <code>&lt;b&gt;</code>');
  });
});

describe('stripComments：检查代码前去掉注释，避免把答案写在注释里', () => {
  it('去掉行注释和块注释', () => {
    expect(stripComments('a // c\nb /* x */ c')).toBe('a \nb  c');
  });
  it('去掉 JSX 里的 {/* 注释 */}', () => {
    expect(stripComments('<p>{/* 注释 */}hi</p>')).toBe('<p>hi</p>');
  });
  it('字符串和 URL 里的 // 不当作注释', () => {
    expect(stripComments('const u = "http://x.com"; // y')).toBe('const u = "http://x.com"; ');
  });
});

describe('explainError', () => {
  it('忘了 import Hook：提示加 import', () => {
    expect(explainError(new ReferenceError('useState is not defined'))).toBe("useState is not defined\n提示：是否忘了 import { useState } from 'react'？");
  });
  it('其他未定义的名字：不加提示', () => {
    expect(explainError(new ReferenceError('foo is not defined'))).toBe('foo is not defined');
  });
  it('语法错误加前缀', () => {
    expect(explainError(new SyntaxError('Unexpected token (3:1)'))).toBe('语法错误：Unexpected token (3:1)');
  });
  it('不是 Error 的值也能转成文字', () => {
    expect(explainError('boom')).toBe('boom');
    expect(explainError(undefined)).toBe('undefined');
  });
});
