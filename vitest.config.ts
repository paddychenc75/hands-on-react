import { defineConfig } from 'vitest/config';

// 单元测试只测 course/engine/logic/ 里的纯函数和 course/engine/exec.ts 的纯文本部分：不需要浏览器和网络。
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
