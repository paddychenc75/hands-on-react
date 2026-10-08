// 验收测试的公共设置。放在 src/acceptance/setup.ts，由 vite.config.ts 的 test.setupFiles 引用。
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Node 25 起自带实验性的 localStorage。没有给它配置文件路径时，它会盖住 jsdom 的 localStorage，
// 导致 localStorage.setItem 不是函数。发现这种情况，就换成一份内存里的实现。
if (typeof localStorage?.setItem !== 'function') {
  const data = new Map<string, string>();
  const memory = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, String(value)),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memory, configurable: true });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});
