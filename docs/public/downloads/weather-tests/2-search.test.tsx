// 里程碑 2 的验收：搜索页。放在 src/acceptance/2-search.test.tsx。
// 只用可访问性查询（role、label、文字）和课文规定的网址、提示文字。
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { beijing, mockFetch, renderApp, shanghai } from './helpers.tsx';

describe('里程碑 2：搜索页', () => {
  it('网址里有搜索词：先显示加载中，再显示结果，结果链接到详情页', async () => {
    mockFetch({ '/v1/search': { results: [shanghai, beijing] } });
    renderApp('/?q=上海');

    expect(screen.getByText(/加载中/)).toBeInTheDocument();
    const link = await screen.findByRole('link', { name: /上海/ });
    expect(link).toHaveAttribute('href', '/city/1796236');
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.queryByText(/加载中/)).not.toBeInTheDocument();
  });

  it('网址里有搜索词：输入框里也是这个词', async () => {
    mockFetch({ '/v1/search': { results: [shanghai] } });
    renderApp('/?q=上海');
    expect(screen.getByLabelText('城市名')).toHaveValue('上海');
    await screen.findByRole('link', { name: /上海/ });
  });

  it('没有匹配：显示“没有找到”，不是错误', async () => {
    mockFetch({ '/v1/search': { generationtime_ms: 0.1 } }); // 接口没有匹配时不返回 results
    renderApp('/?q=不存在的城');

    expect(await screen.findByText('没有找到“不存在的城”')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('请求失败：显示错误和“重试”按钮', async () => {
    mockFetch({ '/v1/search': new Response('boom', { status: 500 }) });
    renderApp('/?q=上海');

    expect(await screen.findByRole('alert')).toHaveTextContent('请求失败（500）');
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
    expect(screen.queryByText(/没有找到/)).not.toBeInTheDocument();
  });

  it('点“重试”会再请求一次，成功后显示结果', async () => {
    const user = userEvent.setup();
    let calls = 0;
    const fetchMock = mockFetch({
      '/v1/search': () => (++calls === 1 ? new Response('boom', { status: 500 }) : { results: [shanghai] }),
    });
    renderApp('/?q=上海');

    await user.click(await screen.findByRole('button', { name: '重试' }));
    expect(await screen.findByRole('link', { name: /上海/ })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('输入城市名并提交：请求带上搜索词，搜索词写进网址的 ?q=', async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch({ '/v1/search': { results: [shanghai] } });
    renderApp('/');

    await user.type(screen.getByLabelText('城市名'), '上海');
    await user.click(screen.getByRole('button', { name: '搜索' }));

    expect(await screen.findByRole('link', { name: /上海/ })).toBeInTheDocument();
    expect(String(fetchMock.mock.calls[0][0])).toContain('name=%E4%B8%8A%E6%B5%B7');
    expect(decodeURIComponent(screen.getByLabelText('当前网址').textContent ?? '')).toBe('/?q=上海');
  });

  it('搜索词少于两个字：提示“至少两个字”，不发请求', () => {
    const fetchMock = mockFetch({});
    renderApp('/?q=上');

    expect(screen.getByText(/至少两个字/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('没有搜索词：提示“至少两个字”，不发请求', () => {
    const fetchMock = mockFetch({});
    renderApp('/');

    expect(screen.getByText(/至少两个字/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('搜索词只有空格：当作没有搜索词，不发请求', () => {
    const fetchMock = mockFetch({});
    renderApp('/?q=%20%20%20');

    expect(screen.getByText(/至少两个字/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('不存在的网址：显示“没有这个页面”', () => {
    mockFetch({});
    renderApp('/nowhere');

    expect(screen.getByText('没有这个页面')).toBeInTheDocument();
  });
});
