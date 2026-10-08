import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { prepare } from '../../course/engine/exec.ts';
import { LIBS, REACT_VERSION, libDeps, libPath, libsInSource, react19Path } from '../../course/engine/logic/runtime.ts';
import { LESSON_MODULES } from '../../course/lessons.generated.ts';

describe('运行时版本', () => {
  it('版本是具体的 19.x.y，资源文件名带版本号', () => {
    expect(REACT_VERSION).toMatch(/^19\.\d+\.\d+$/);
    expect(react19Path()).toBe(`runtime/react-${REACT_VERSION}.dev.js`);
  });
  it('课的数据里不再有 runtime 字段', () => {
    expect(
      Object.values(LESSON_MODULES)
        .filter(l => 'runtime' in l)
        .map(l => l.id),
    ).toEqual([]);
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

describe('第三方库：从 import 语句判断要加载哪些库', () => {
  const names = (src: string) => libsInSource(src).map(l => l.name);
  it('版本是具体的 x.y.z，文件名带库名和版本号', () => {
    for (const l of LIBS) {
      expect(l.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(libPath(l)).toBe(`runtime/${l.slug}-${l.version}.dev.js`);
    }
  });
  it('固定的版本和 package.json 里装的版本一致', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../../package.json'), 'utf8'));
    for (const l of LIBS) expect(pkg.devDependencies[l.name], l.name).toBe(l.version);
  });
  it('只用到 React 的示例不需要任何库', () => {
    expect(names("import { useState } from 'react';\nimport { createRoot } from 'react-dom/client';\nfunction App(){}")).toEqual([]);
    expect(names('function App(){ return <p>没有 import</p> }')).toEqual([]);
  });
  it('import react-router、@tanstack/react-query 才需要对应的库，两个都 import 就两个都要', () => {
    expect(names("import { Link } from 'react-router';")).toEqual(['react-router']);
    expect(names('import { useQuery } from "@tanstack/react-query";')).toEqual(['@tanstack/react-query']);
    expect(names("import { useQuery } from '@tanstack/react-query';\nimport { Link } from 'react-router';")).toEqual(['react-router', '@tanstack/react-query']);
  });
  it('zustand 的五个路径都算 zustand 这一个库；zustand/traditional 等没暴露的路径不算', () => {
    expect(names("import { create } from 'zustand';")).toEqual(['zustand']);
    expect(names("import { persist, createJSONStorage } from 'zustand/middleware';")).toEqual(['zustand']);
    expect(names("import { useShallow } from 'zustand/react/shallow';")).toEqual(['zustand']);
    expect(names("import { shallow } from 'zustand/shallow';")).toEqual(['zustand']);
    expect(names("import { createStore } from 'zustand/vanilla';")).toEqual(['zustand']);
    expect(names("import { useStoreWithEqualityFn } from 'zustand/traditional';")).toEqual([]);
  });
  it('三个库一起 import，按 LIBS 的顺序返回', () => {
    expect(names("import { create } from 'zustand';\nimport { useQuery } from '@tanstack/react-query';\nimport { Link } from 'react-router';")).toEqual([
      'react-router',
      '@tanstack/react-query',
      'zustand',
    ]);
  });
  it('react-hook-form、zod、@hookform/resolvers/zod 各算一个库；resolvers 的别的路径和 zod/v3 没暴露，不算', () => {
    expect(names("import { useForm } from 'react-hook-form';")).toEqual(['react-hook-form']);
    expect(names("import { z } from 'zod';")).toEqual(['zod']);
    expect(names("import { zodResolver } from '@hookform/resolvers/zod';")).toEqual(['@hookform/resolvers']);
    expect(names("import { yupResolver } from '@hookform/resolvers/yup';\nimport { z } from 'zod/v3';")).toEqual([]);
    expect(names("import { zodResolver } from '@hookform/resolvers/zod';\nimport { z } from 'zod';\nimport { useForm } from 'react-hook-form';")).toEqual([
      'react-hook-form',
      'zod',
      '@hookform/resolvers',
    ]);
  });
  it('libDeps：resolvers 依赖 react-hook-form（要先加载）；其余库没有依赖', () => {
    const by = (n: string) => LIBS.find(l => l.name === n)!;
    expect(libDeps(by('@hookform/resolvers')).map(l => l.name)).toEqual(['react-hook-form']);
    expect(libDeps(by('react-hook-form'))).toEqual([]);
    expect(libDeps(by('zod'))).toEqual([]);
    for (const l of LIBS)
      for (const d of l.deps ?? [])
        expect(
          LIBS.some(x => x.name === d),
          `${l.name} 的依赖 ${d}`,
        ).toBe(true);
  });
  it('react-router/dom 也算 react-router；react-router-dom 和别的包不算', () => {
    expect(names("import { RouterProvider } from 'react-router/dom';")).toEqual(['react-router']);
    expect(names("import { Link } from 'react-router-dom';\nimport x from 'lodash';")).toEqual([]);
  });
  it('多行 import 和只写路径的 import 都能识别', () => {
    expect(names("import {\n  createMemoryRouter,\n  Link,\n} from 'react-router';")).toEqual(['react-router']);
    expect(names("import 'foo';\nimport { Link } from 'react-router';")).toEqual(['react-router']);
  });
  it('注释里和字符串里的包名不算', () => {
    expect(names("// import { Link } from 'react-router';\n/* import x from '@tanstack/react-query'; */\nconst s = \"from 'react-router'\";")).toEqual([]);
  });
});

describe('prepare：第三方库的 import 解析到加载好的库对象', () => {
  const Babel = { transform: (code: string) => ({ code }) };
  const router = { createMemoryRouter() {}, Link() {} };
  const rt = {
    React: { useState() {} },
    ReactDOM: { createRoot() {} },
    libs: {
      'react-router': router,
      'react-router/dom': { RouterProvider() {} },
      '@tanstack/react-query': { useQuery() {} },
      zustand: { create() {} },
      'zustand/middleware': { persist() {} },
      'zustand/react/shallow': { useShallow() {} },
      'react-hook-form': { useForm() {} },
      zod: { z: {} },
      '@hookform/resolvers/zod': { zodResolver() {} },
    } as Record<string, unknown>,
  };
  const run = (src: string, r: any = rt) => {
    (globalThis as any).window = { Babel };
    try {
      return prepare(src, [], r);
    } finally {
      delete (globalThis as any).window;
    }
  };
  it('具名导入从 __libs 里取，import 语句本身被去掉', () => {
    const out = run("import { createMemoryRouter, Link } from 'react-router';\nfunction App(){}");
    expect(out).toContain('const { createMemoryRouter, Link } = __libs["react-router"];');
    expect(out).not.toContain('import');
  });
  it('as 别名写成解构重命名；type 导入被忽略', () => {
    expect(run("import { Link as L, type To } from 'react-router';\nfunction App(){}")).toContain('const { Link: L } = __libs["react-router"];');
    expect(run("import type { To } from 'react-router';\nfunction App(){}")).not.toContain('__libs');
  });
  it('命名空间导入和默认导入得到整个模块对象', () => {
    expect(run("import * as RR from 'react-router';\nfunction App(){}")).toContain('const RR = __libs["react-router"];');
    expect(run("import RR, { Link } from 'react-router';\nfunction App(){}")).toContain('const RR = __libs["react-router"];');
  });
  it('react-router/dom 和 @tanstack/react-query 各取各的模块', () => {
    const out = run("import { RouterProvider } from 'react-router/dom';\nimport { useQuery } from '@tanstack/react-query';\nfunction App(){}");
    expect(out).toContain('const { RouterProvider } = __libs["react-router/dom"];');
    expect(out).toContain('const { useQuery } = __libs["@tanstack/react-query"];');
  });
  it('zustand 各路径各取各的模块', () => {
    const out = run(
      "import { create } from 'zustand';\nimport { persist } from 'zustand/middleware';\nimport { useShallow } from 'zustand/react/shallow';\nfunction App(){}",
    );
    expect(out).toContain('const { create } = __libs["zustand"];');
    expect(out).toContain('const { persist } = __libs["zustand/middleware"];');
    expect(out).toContain('const { useShallow } = __libs["zustand/react/shallow"];');
  });
  it('react-hook-form、zod、@hookform/resolvers/zod 各取各的模块', () => {
    const out = run(
      "import { useForm } from 'react-hook-form';\nimport * as z from 'zod';\nimport { zodResolver } from '@hookform/resolvers/zod';\nfunction App(){}",
    );
    expect(out).toContain('const { useForm } = __libs["react-hook-form"];');
    expect(out).toContain('const z = __libs["zod"];');
    expect(out).toContain('const { zodResolver } = __libs["@hookform/resolvers/zod"];');
  });
  it('和 react 的 import 混用时，两边都解析', () => {
    const out = run("import { useState } from 'react';\nimport { Link } from 'react-router';\nfunction App(){}");
    expect(out).toContain('const { useState } = React;');
    expect(out).toContain('const { Link } = __libs["react-router"];');
  });
  it('库还没有加载就 import：给出提示，不是难懂的 undefined 报错', () => {
    expect(() => run("import { Link } from 'react-router';\nfunction App(){}", { ...rt, libs: {} })).toThrow(/react-router 还没有加载/);
    expect(() => run("import { Link } from 'react-router';\nfunction App(){}", { React: rt.React, ReactDOM: rt.ReactDOM })).toThrow(/还没有加载/);
  });
});
