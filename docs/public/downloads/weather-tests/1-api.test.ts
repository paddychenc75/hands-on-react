// 里程碑 1 的验收：接口层。放在 src/acceptance/1-api.test.ts。
// 依赖课文规定的导出：src/api/weather.ts 里的 searchCities、getCity、getForecast、weatherLabel。
import { describe, expect, it } from 'vitest';
import { getCity, getForecast, searchCities, weatherLabel } from '../api/weather.ts';
import { forecast, mockFetch, shanghai } from './helpers.tsx';

describe('里程碑 1：接口层', () => {
  it('searchCities：返回城市数组，请求里带上搜索词', async () => {
    const fetchMock = mockFetch({ '/v1/search': { results: [shanghai] } });
    const cities = await searchCities('上海');
    expect(cities).toHaveLength(1);
    expect(cities[0].name).toBe('上海');
    expect(String(fetchMock.mock.calls[0][0])).toContain('name=%E4%B8%8A%E6%B5%B7');
  });

  it('searchCities：接口没有 results 字段时，返回空数组', async () => {
    mockFetch({ '/v1/search': { generationtime_ms: 0.1 } });
    expect(await searchCities('不存在的城')).toEqual([]);
  });

  it('searchCities：HTTP 500 要抛错，错误信息里有状态码', async () => {
    mockFetch({ '/v1/search': new Response('boom', { status: 500 }) });
    await expect(searchCities('上海')).rejects.toThrow('500');
  });

  it('getCity：返回城市；接口说找不到时抛错', async () => {
    mockFetch({ '/v1/get': shanghai });
    expect((await getCity(1796236)).name).toBe('上海');

    mockFetch({ '/v1/get': { generationtime_ms: 0.1 } });
    await expect(getCity(1)).rejects.toThrow();
  });

  it('getForecast：字段改成界面用的名字，并带上经纬度', async () => {
    const fetchMock = mockFetch({ '/v1/forecast': forecast });
    const result = await getForecast({ latitude: 31.22, longitude: 121.46 });
    expect(result.current).toEqual({ temperature: 16, weatherCode: 0, windSpeed: 5.4 });
    expect(result.daily).toHaveLength(3);
    expect(result.daily[1]).toEqual({ date: '2026-10-09', weatherCode: 63, max: 23, min: 17 });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain('latitude=31.22');
    expect(url).toContain('longitude=121.46');
  });

  it.each([
    [0, '晴'],
    [3, '多云'],
    [45, '雾'],
    [53, '毛毛雨'],
    [63, '雨'],
    [81, '雨'],
    [75, '雪'],
    [96, '雷暴'],
    [10, '未知'],
  ])('weatherLabel(%i) 是 %s', (code, label) => {
    expect(weatherLabel(code)).toBe(label);
  });
});
