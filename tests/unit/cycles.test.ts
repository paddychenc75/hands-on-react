import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// 不允许循环依赖：扫描 course/ 和 theme/ 里的相对 import（含 `import type` 和 `export … from`），找环。
const root = path.resolve(import.meta.dirname, '../..');
const EXT = ['.ts', '.tsx'];

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : EXT.includes(path.extname(p)) && !p.endsWith('.d.ts') ? [p] : [];
  });
}

function importsOf(file: string): string[] {
  const src = fs.readFileSync(file, 'utf8');
  const out: string[] = [];
  for (const m of src.matchAll(/^\s*(?:import|export)\s[^'"\n]*?from\s+'(\.[^']+)'/gm)) {
    const base = path.resolve(path.dirname(file), m[1]);
    const hit = [base, ...EXT.map(e => base + e)].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    if (hit) out.push(hit);
  }
  return out;
}

describe('模块之间没有循环依赖', () => {
  const files = [...walk(path.join(root, 'course')), ...walk(path.join(root, 'theme'))];
  const graph = new Map(files.map(f => [f, importsOf(f)]));

  it('扫到了引擎、课程数据和主题文件', () => {
    expect(files.length).toBeGreaterThan(100);
    expect(files.some(f => f.endsWith('engine/playground.ts'))).toBe(true);
  });

  it('依赖图无环', () => {
    const state = new Map<string, 1 | 2>(); // 1 = 正在访问，2 = 访问完
    const stack: string[] = [];
    let cycle: string[] | null = null;
    const visit = (f: string) => {
      if (cycle || state.get(f) === 2) return;
      if (state.get(f) === 1) {
        cycle = [...stack.slice(stack.indexOf(f)), f];
        return;
      }
      state.set(f, 1);
      stack.push(f);
      for (const g of graph.get(f) ?? []) visit(g);
      stack.pop();
      state.set(f, 2);
    };
    for (const f of files) visit(f);
    expect(cycle ? cycle.map(f => path.relative(root, f)).join(' → ') : null).toBeNull();
  });
});
