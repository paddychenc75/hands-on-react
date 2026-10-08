/* eslint-disable react-refresh/only-export-components */
// 验收测试的公共工具。放在 src/acceptance/helpers.tsx。
// 只依赖课文规定的东西：src/App.tsx 的默认导出（里面只有路由，不含 Provider 和 Router）。
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { vi } from 'vitest';
import App from '../App.tsx';

type Route = unknown | Response | (() => unknown | Response);

// 用假的 fetch 代替真实网络：网址里包含某个片段，就返回对应的数据。
// 值可以是普通对象（200 + JSON）、Response，或者每次请求都会执行的函数（用来模拟“先失败后成功”）。
export function mockFetch(routes: Record<string, Route>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) throw new Error(`没有准备这个请求的假数据：${url}`);
    const entry = routes[key];
    const body = typeof entry === 'function' ? (entry as () => unknown)() : entry;
    return body instanceof Response ? body : new Response(JSON.stringify(body), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

// 把当前网址显示出来，测试用它检查“搜索词写进了 ?q=”。
function Url() {
  const { pathname, search } = useLocation();
  return <output aria-label="当前网址">{pathname + search}</output>;
}

export function renderApp(path: string) {
  // 每个测试用新的 QueryClient，缓存不会串；关掉重试，失败立刻显示。
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
        <Url />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

export const shanghai = { id: 1796236, name: '上海', latitude: 31.22, longitude: 121.46, country: '中国', admin1: '上海市' };
export const beijing = { id: 1816670, name: '北京', latitude: 39.9, longitude: 116.4, country: '中国', admin1: '北京市' };

export const forecast = {
  current: { temperature_2m: 16, weather_code: 0, wind_speed_10m: 5.4 },
  daily: {
    time: ['2026-10-08', '2026-10-09', '2026-10-10'],
    weather_code: [3, 63, 75],
    temperature_2m_max: [25, 23, 12],
    temperature_2m_min: [15, 17, 4],
  },
};
