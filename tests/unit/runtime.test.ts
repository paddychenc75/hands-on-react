import { describe, expect, it } from 'vitest';
import { prepare } from '../../course/engine/exec.ts';
import { REACT_VERSION, react19Path } from '../../course/engine/logic/runtime.ts';
import { LESSONS } from '../../course/registry.ts';

describe('运行时版本', () => {
  it('版本是具体的 19.x.y，资源文件名带版本号', () => {
    expect(REACT_VERSION).toMatch(/^19\.\d+\.\d+$/);
    expect(react19Path()).toBe(`runtime/react-${REACT_VERSION}.dev.js`);
  });
  it('课的数据里不再有 runtime 字段', () => {
    expect(LESSONS.filter(l => 'runtime' in l).map(l => l.id)).toEqual([]);
  });
});

describe('prepare：import 解析', () => {
  const Babel = { transform: (code: string) => ({ code }) };
  const run = (src: string, rt: any) => {
    (globalThis as any).window = { Babel };
    try {
      return prepare(src, [], rt);
    } finally {
      delete (globalThis as any).window;
    }
  };
  const rt = {
    React: { use() {}, useActionState() {}, useState() {}, useOptimistic() {} },
    ReactDOM: { useFormStatus() {}, createRoot() {}, createPortal() {}, flushSync() {} },
  };
  it('react 的具名导入只要运行时真有就取出来（use、useActionState 不在 HOOK_NAMES 里）', () => {
    const out = run("import { use, useActionState, useState } from 'react';\nfunction App(){}", rt);
    expect(out).toContain('const { use, useActionState, useState } = React;');
  });
  it('react-dom 的具名导入从运行时的 ReactDOM 取（useFormStatus、createPortal）', () => {
    const out = run("import { useFormStatus, createPortal } from 'react-dom';\nfunction App(){}", rt);
    expect(out).toContain('const { useFormStatus, createPortal } = ReactDOM;');
    expect(out).not.toContain('} = React;');
  });
  it('react-dom/client 的 createRoot 也从 ReactDOM 取', () => {
    expect(run("import { createRoot } from 'react-dom/client';\nfunction App(){}", rt)).toContain('const { createRoot } = ReactDOM;');
  });
  it('as 别名保留', () => {
    expect(run("import { useState as useS } from 'react';\nfunction App(){}", rt)).toContain('const { useState: useS } = React;');
  });
  it('运行时没有的名字不会被取出来', () => {
    const out = run("import { nope } from 'react';\nfunction App(){}", rt);
    expect(out).not.toContain('nope');
  });
  it('import 语句本身被去掉，export 关键字被去掉，并返回 App 和导出的名字', () => {
    const out = run("import React from 'react';\nexport default function App(){}", rt);
    expect(out).not.toContain('import');
    expect(out).not.toMatch(/export default/);
    expect(out).toContain("return { App: typeof App !== 'undefined' ? App : undefined");
  });
});
