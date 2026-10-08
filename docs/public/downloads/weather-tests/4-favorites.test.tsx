// 里程碑 4 的验收：收藏。放在 src/acceptance/4-favorites.test.tsx。
// 课文规定：收藏存在 localStorage 的 'weather-favorites'，内容是 [{ id, name }]。
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { beijing, forecast, mockFetch, renderApp, shanghai } from './helpers.tsx';

const stored = () => JSON.parse(localStorage.getItem('weather-favorites') ?? '[]');

describe('里程碑 4：收藏', () => {
  it('点“收藏”：按钮变成“已收藏”，写进 localStorage；再点一次取消', async () => {
    const user = userEvent.setup();
    mockFetch({ '/v1/get': shanghai, '/v1/forecast': forecast });
    renderApp('/city/1796236');

    await user.click(await screen.findByRole('button', { name: '☆ 收藏' }));
    expect(screen.getByRole('button', { name: '★ 已收藏' })).toHaveAttribute('aria-pressed', 'true');
    expect(stored()).toEqual([{ id: 1796236, name: '上海' }]);

    await user.click(screen.getByRole('button', { name: '★ 已收藏' }));
    expect(screen.getByRole('button', { name: '☆ 收藏' })).toHaveAttribute('aria-pressed', 'false');
    expect(stored()).toEqual([]);
  });

  it('收藏和取消收藏都不发新请求', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch({ '/v1/get': shanghai, '/v1/forecast': forecast });
    renderApp('/city/1796236');

    await user.click(await screen.findByRole('button', { name: '☆ 收藏' }));
    await user.click(screen.getByRole('button', { name: '★ 已收藏' }));
    expect(fetchMock).toHaveBeenCalledTimes(2); // 只有城市和天气两个请求
  });

  it('已经收藏过的城市：打开详情页时就显示“已收藏”', async () => {
    localStorage.setItem('weather-favorites', JSON.stringify([{ id: 1796236, name: '上海' }]));
    mockFetch({ '/v1/get': shanghai, '/v1/forecast': forecast });
    renderApp('/city/1796236');

    expect(await screen.findByRole('button', { name: '★ 已收藏' })).toBeInTheDocument();
  });

  it('搜索页上方列出收藏的城市，链接到详情页；没有收藏时不显示“收藏”标题', async () => {
    mockFetch({ '/v1/search': { results: [beijing] } });
    localStorage.setItem('weather-favorites', JSON.stringify([{ id: 1796236, name: '上海' }]));
    const { unmount } = renderApp('/?q=北京');

    expect(screen.getByRole('heading', { name: '收藏' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '上海' })).toHaveAttribute('href', '/city/1796236');
    await screen.findByRole('link', { name: /北京/ });
    unmount();

    localStorage.clear();
    renderApp('/');
    expect(screen.queryByRole('heading', { name: '收藏' })).not.toBeInTheDocument();
  });

  it('收藏的数据坏了（不是合法 JSON）：页面不崩溃，当作没有收藏', () => {
    localStorage.setItem('weather-favorites', '{坏了');
    mockFetch({});
    renderApp('/');

    expect(screen.getByText(/至少两个字/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '收藏' })).not.toBeInTheDocument();
  });
});
