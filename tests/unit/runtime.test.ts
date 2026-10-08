import { describe, expect, it } from 'vitest';
import { prepare } from '../../course/engine/exec.ts';
import { DEFAULT_RUNTIME, REACT_VERSIONS, react19Path, runtimeOf } from '../../course/engine/logic/runtime.ts';
import { LESSONS } from '../../course/registry.ts';

describe('运行时选择', () => {
  it('不写 runtime 的课是 18', () => {
    expect(runtimeOf({})).toBe(18);
    expect(runtimeOf(undefined)).toBe(18);
    expect(runtimeOf(null)).toBe(DEFAULT_RUNTIME);
  });
  it('runtime: 19 的课是 19，不认识的值回到 18', () => {
    expect(runtimeOf({ runtime: 19 })).toBe(19);
    expect(runtimeOf({ runtime: 18 })).toBe(18);
    expect(runtimeOf({ runtime: 17 })).toBe(18);
  });
  it('两个运行时的版本是具体的 x.y.z，19 的资源文件名带版本号', () => {
    expect(REACT_VERSIONS[18]).toMatch(/^18\.\d+\.\d+$/);
    expect(REACT_VERSIONS[19]).toMatch(/^19\.\d+\.\d+$/);
    expect(react19Path()).toBe(`runtime/react-${REACT_VERSIONS[19]}.dev.js`);
  });
  it('课程注册表里只有 react-19 一课启用了 19，其余都是 18', () => {
    const on19 = LESSONS.filter(l => runtimeOf(l) === 19).map(l => l.id);
    expect(on19).toEqual(['react-19']);
  });
});

describe('prepare：import 按运行时解析', () => {
  const Babel = { transform: (code: string) => ({ code }) };
  const run = (src: string, rt?: any) => {
    (globalThis as any).window = { Babel, ReactDOM: { createRoot() {}, createPortal() {} } };
    try {
      return prepare(src, [], rt);
    } finally {
      delete (globalThis as any).window;
    }
  };
  const rt19 = { version: 19, React: { use() {}, useActionState() {}, useState() {} }, ReactDOM: { useFormStatus() {}, createRoot() {} } };
  it('19：react 的具名导入只要运行时真有就取出来（use、useActionState 不在 HOOK_NAMES 里）', () => {
    const out = run("import { use, useActionState, useState } from 'react';\nfunction App(){}", rt19);
    expect(out).toContain('const { use, useActionState, useState } = React;');
  });
  it('19：react-dom 的具名导入从运行时的 ReactDOM 判断（useFormStatus）', () => {
    const out = run("import { useFormStatus } from 'react-dom';\nfunction App(){}", rt19);
    expect(out).toContain('const { useFormStatus } = ReactDOM;');
  });
  it('19：运行时没有的名字不会被取出来', () => {
    const out = run("import { nope } from 'react';\nfunction App(){}", rt19);
    expect(out).not.toContain('nope');
  });
  it('18（不传运行时）：行为不变，use 不在 HOOK_NAMES 里就不取', () => {
    const out = run("import { useState, use } from 'react';\nfunction App(){}");
    expect(out).toContain('const { useState } = React;');
    expect(out).not.toContain('use }');
  });
});
