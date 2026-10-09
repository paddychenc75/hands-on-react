import { describe, expect, it } from 'vitest';
import { sceneProgress } from '../../course/engine/story.ts';

// 首页叙事 JS 回退路径的滚动进度公式，必须和 CSS 的 view(block 64px 0px) cover 范围一致：
// 0 = 一幕刚从视口底部进入，1 = 一幕的底边离开顶栏（64px）。
describe('sceneProgress', () => {
  const vh = 800;
  const H = 1.5 * (vh - 64); // 一幕高 1.5 个舞台
  it('刚进入时为 0，离开时为 1，超出范围被夹住', () => {
    expect(sceneProgress(vh, H, vh)).toBe(0);
    expect(sceneProgress(64 - H, H, vh)).toBe(1);
    expect(sceneProgress(vh + 500, H, vh)).toBe(0);
    expect(sceneProgress(-5000, H, vh)).toBe(1);
  });
  it('舞台停住的那一段正好是 1/(k+1) 到 k/(k+1)', () => {
    const k = 1.5;
    expect(sceneProgress(64, H, vh)).toBeCloseTo(1 / (k + 1), 10); // 顶边贴着顶栏：舞台刚停住
    expect(sceneProgress(vh - H, H, vh)).toBeCloseTo(k / (k + 1), 10); // 底边贴着视口底：舞台刚放开
  });
  it('随滚动单调增加', () => {
    let last = -1;
    for (let top = vh; top > 64 - H; top -= 37) {
      const p = sceneProgress(top, H, vh);
      expect(p).toBeGreaterThanOrEqual(last);
      last = p;
    }
  });
});
