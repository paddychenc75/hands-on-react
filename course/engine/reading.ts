/* 阅读位置：记住每一课读到哪里，下次打开时提示"从上次的位置继续"。存在 localStorage 的 `hands-on-react-v1:pos`。 */
import { STORE_KEY } from './store.ts';
import { smooth, toast } from './util.ts';

const POS_KEY = STORE_KEY + ':pos';
function readPos(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(POS_KEY) || '{}') || {};
  } catch {
    return {};
  }
}
export function offerResume(id: string): void {
  const y = readPos()[id];
  if (!y || y < 600) return;
  const total = document.documentElement.scrollHeight - innerHeight;
  if (total < 1200) return;
  toast('上次读到这一课的 ' + Math.min(99, Math.round((y / total) * 100)) + '% 处。', 8000, '从上次的位置继续', () =>
    window.scrollTo({ top: y, behavior: smooth() }),
  );
}
export function savePos(id: string): void {
  try {
    const pos = readPos();
    pos[id] = Math.round(scrollY);
    localStorage.setItem(POS_KEY, JSON.stringify(pos));
  } catch {}
}
