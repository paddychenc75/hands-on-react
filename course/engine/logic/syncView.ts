/* 同步状态的显示用小函数（顶栏图标在主包里用，所以单独放一个很小的文件）。纯函数。 */

/** "3 分钟前"这样的相对时间 */
export function ago(at: number | undefined, now: number): string {
  if (!at) return '还没有同步过';
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 45) return '刚刚';
  if (s < 3600) return Math.round(s / 60) + ' 分钟前';
  if (s < 86400) return Math.round(s / 3600) + ' 小时前';
  return Math.round(s / 86400) + ' 天前';
}

/** 界面上只显示令牌的末四位 */
export const lastFour = (token: string): string => (token.length >= 8 ? '…' + token.slice(-4) : '…');
