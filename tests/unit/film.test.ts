import { describe, expect, it } from 'vitest';
import { DURATIONS, MARKS, NODES, SECONDS_PER_SCREEN, TOTAL, depthOf, subtree } from '../../course/engine/logic/filmData.ts';
import { buildTracks } from '../../course/engine/logic/filmTracks.ts';
import { changeSpans, sceneOf, scrollOfTime, timeOfScroll } from '../../course/engine/story.ts';

describe('首页短片的时间轴', () => {
  it('整片 45–60 秒，幕的起点是时长的累加', () => {
    expect(TOTAL).toBeGreaterThanOrEqual(45);
    expect(TOTAL).toBeLessThanOrEqual(60);
    expect(MARKS[0]).toBe(0);
    for (let i = 1; i < MARKS.length; i++) expect(MARKS[i]).toBeCloseTo(MARKS[i - 1] + DURATIONS[i - 1], 9);
    expect(MARKS[MARKS.length - 1] + DURATIONS[DURATIONS.length - 1]).toBeCloseTo(TOTAL, 9);
  });
  it('每一幕至少 3.5 秒；讲解幕（第 1–4、6–8 幕）至少 4.5 秒，够读完标题和说明', () => {
    DURATIONS.forEach((d, i) => expect(d).toBeGreaterThanOrEqual(i === 5 ? 3.5 : i === 0 || i === 9 ? 5 : 4.5));
  });
  it('手动滚动的总长度约 9 个屏幕高', () => {
    expect(TOTAL / SECONDS_PER_SCREEN).toBeGreaterThan(8.5);
    expect(TOTAL / SECONDS_PER_SCREEN).toBeLessThan(10.5);
  });
  it('滚动位置和影片时间互为反函数，两端夹住', () => {
    for (const f of [0, 3.3, 20, 41.7, TOTAL]) expect(timeOfScroll(scrollOfTime(f, 5000), 5000)).toBeCloseTo(f, 9);
    expect(timeOfScroll(-10, 5000)).toBe(0);
    expect(timeOfScroll(9999, 5000)).toBe(TOTAL);
    expect(timeOfScroll(10, 0)).toBe(0);
  });
  it('sceneOf：按幕的起点分幕', () => {
    expect(sceneOf(0)).toBe(0);
    expect(sceneOf(MARKS[3] - 0.01)).toBe(2);
    expect(sceneOf(MARKS[3])).toBe(3);
    expect(sceneOf(TOTAL)).toBe(9);
  });
});

describe('组件树数据', () => {
  it('9 个节点，和课文里的 RenderTree 同一棵树', () => {
    expect(NODES.map(n => n.id)).toEqual(['App', 'Header', 'TodoList', 'Logo', 'Search', 'Item1', 'Item2', 'Box1', 'Box2']);
    expect(subtree('TodoList')).toEqual(['TodoList', 'Item1', 'Item2', 'Box1', 'Box2']);
    expect(depthOf('Box2')).toBe(3);
  });
});

describe('buildTracks', () => {
  for (const mobile of [false, true]) {
    const tracks = buildTracks(mobile);
    it(`${mobile ? '手机' : '桌面'}：每条轨道从 0 秒到结束，时间递增、都在 [0, 总时长] 里`, () => {
      expect(Object.keys(tracks).length).toBeGreaterThan(150);
      for (const [name, kfs] of Object.entries(tracks)) {
        expect(kfs[0].t, name).toBe(0);
        expect(kfs[kfs.length - 1].t, name).toBe(TOTAL);
        for (let i = 1; i < kfs.length; i++) expect(kfs[i].t, name).toBeGreaterThan(kfs[i - 1].t);
      }
    });
    it(`${mobile ? '手机' : '桌面'}：只动 transform、opacity 和 SVG 描边`, () => {
      const allowed = new Set(['t', 'easing', 'opacity', 'transform', 'strokeDashoffset', 'stroke']);
      for (const [name, kfs] of Object.entries(tracks))
        for (const kf of kfs) for (const p of Object.keys(kf)) expect(allowed.has(p), `${name}.${p}`).toBe(true);
    });
  }
  const tracks = buildTracks(false);
  it('每幕的标题和说明（文字轨道）都在这一幕开始之后才出现、下一幕之前退场', () => {
    for (let i = 1; i <= 8; i++) {
      const kfs = tracks['cp-' + i];
      const on = kfs.filter(k => k.opacity === 1).map(k => k.t);
      expect(Math.min(...on)).toBeGreaterThanOrEqual(MARKS[i]);
      expect(Math.max(...on)).toBeLessThanOrEqual(MARKS[i + 1]);
    }
  });
  it('第 3 幕：只有两个节点被标出差别，只有它们的光束落到 DOM 层', () => {
    for (const id of NODES.map(n => n.id)) {
      const beam = tracks['bm-' + id];
      const used = beam && beam.some(k => k.opacity === 1 && k.t > MARKS[3] && k.t < MARKS[4]);
      expect(!!used, id).toBe(id === 'Item2' || id === 'Box2');
    }
  });
  it('changeSpans：只有值真的在变的时间段', () => {
    expect(
      changeSpans([
        { t: 0, opacity: 0 },
        { t: 2, opacity: 0 },
        { t: 3, opacity: 1 },
        { t: 5, opacity: 1 },
        { t: 6, opacity: 0 },
        { t: 7, opacity: 0.5 },
      ]),
    ).toEqual([
      [2, 3],
      [5, 7],
    ]);
  });
});
