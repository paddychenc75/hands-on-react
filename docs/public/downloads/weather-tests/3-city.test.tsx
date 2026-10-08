// 里程碑 3 的验收：详情页。放在 src/acceptance/3-city.test.tsx。
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { beijing, forecast, mockFetch, renderApp, shanghai } from './helpers.tsx';

describe('里程碑 3：详情页', () => {
  it('先取城市，再用城市的经纬度取天气', async () => {
    const fetchMock = mockFetch({ '/v1/get': shanghai, '/v1/forecast': forecast });
    renderApp('/city/1796236');

    expect(screen.getByText(/加载中/)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '上海' })).toBeInTheDocument();
    expect(await screen.findByText(/现在 16°C，晴/)).toBeInTheDocument();

    const urls = fetchMock.mock.calls.map(([u]) => String(u));
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain('/v1/get');
    expect(urls[0]).toContain('id=1796236');
    expect(urls[1]).toContain('/v1/forecast');
    expect(urls[1]).toContain('latitude=31.22');
  });

  it('显示风速和未来几天：日期、天气、最低温 ~ 最高温', async () => {
    mockFetch({ '/v1/get': shanghai, '/v1/forecast': forecast });
    renderApp('/city/1796236');

    expect(await screen.findByText(/风速 5.4 km\/h/)).toBeInTheDocument();
    const days = within(await screen.findByRole('list', { name: '未来五天' })).getAllByRole('listitem');
    expect(days).toHaveLength(3);
    expect(days[0]).toHaveTextContent('2026-10-08：多云，15° ~ 25°');
    expect(days[1]).toHaveTextContent('2026-10-09：雨，17° ~ 23°');
    expect(days[2]).toHaveTextContent('2026-10-10：雪，4° ~ 12°');
  });

  it('有“返回搜索”的链接，指向首页', async () => {
    mockFetch({ '/v1/get': shanghai, '/v1/forecast': forecast });
    renderApp('/city/1796236');

    expect(await screen.findByRole('link', { name: /返回搜索/ })).toHaveAttribute('href', '/');
  });

  it('城市取不到：显示错误和“重试”，也不会去请求天气', async () => {
    const fetchMock = mockFetch({ '/v1/get': new Response('{"error":true}', { status: 400 }), '/v1/forecast': forecast });
    renderApp('/city/abc');

    // 错误信息的文字不检查：直接发请求得到“请求失败（400）”，先检查 id 是不是数字也是合理的做法
    expect(await screen.findByRole('alert')).not.toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('/v1/forecast'))).toBe(false);
  });

  it('换一个城市：显示的是新城市的天气，不是上一个城市留在缓存里的', async () => {
    const user = userEvent.setup();
    mockFetch({
      '/v1/search': { results: [shanghai, beijing] },
      '/v1/get': (url: string) => (url.includes('id=1796236') ? shanghai : beijing),
      '/v1/forecast': (url: string) =>
        url.includes('latitude=31.22') ? forecast : { ...forecast, current: { ...forecast.current, temperature_2m: 3 } },
    });
    renderApp('/?q=城市');

    await user.click(await screen.findByRole('link', { name: /上海/ }));
    expect(await screen.findByText(/现在 16°C/)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /返回搜索/ }));
    await user.type(screen.getByLabelText('城市名'), '城市');
    await user.click(screen.getByRole('button', { name: '搜索' }));
    await user.click(await screen.findByRole('link', { name: /北京/ }));
    expect(await screen.findByRole('heading', { name: '北京' })).toBeInTheDocument();
    expect(await screen.findByText(/现在 3°C/)).toBeInTheDocument();
  });

  it('天气取不到：城市名照常显示，天气区显示错误和“重试”', async () => {
    const user = userEvent.setup();
    let forecastCalls = 0;
    mockFetch({
      '/v1/get': shanghai,
      '/v1/forecast': () => (++forecastCalls === 1 ? new Response('boom', { status: 500 }) : forecast),
    });
    renderApp('/city/1796236');

    expect(await screen.findByRole('heading', { name: '上海' })).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('请求失败（500）');

    await user.click(screen.getByRole('button', { name: '重试' }));
    expect(await screen.findByText(/现在 16°C/)).toBeInTheDocument();
  });
});
