/* 计时类检查的辅助（纯函数）：阈值相对基线，失败信息区分“设备忙”和“代码问题”。
   基线由 tester.ts 的 t.baseline() 在检查开始时实测（固定计算量的耗时、定时器延迟），这里只做换算。 */

/** 基线：factor 是设备比参考机慢几倍（≥1），lag 是定时器的额外延迟（毫秒，≥0） */
export interface BaselineData {
  factor: number;
  lag: number;
}

/** 把固定计算量的实测耗时换算成慢速系数。参考耗时 refMs 是在开发机上实测的同一段计算的耗时 */
export const factorFrom = (measuredMs: number, refMs: number): number => Math.min(20, Math.max(1, measuredMs / refMs));

/**
 * 把原来的绝对阈值（毫秒）放宽一点：只加“额外开销”，不按倍数放大。
 * 任务本身的时长是按墙钟算的（例如忙等 1ms 的单元），设备慢并不会让它变长；
 * 如果按倍数放大，一直占用主线程的错误写法也会混过去。
 */
export const limitFor = (ms: number, b: BaselineData): number => Math.ceil(ms + 2 * b.lag + 2 * (b.factor - 1));

/** 设备此刻看起来很忙：慢了 3 倍以上，或定时器延迟 40ms 以上 */
export const looksBusy = (b: BaselineData): boolean => b.factor >= 3 || b.lag >= 40;

/** 计时断言自动重测一次后仍失败时的信息：区分“可能是设备繁忙”和“更可能是代码的问题” */
export function timingFailMessage(message: string, b: BaselineData): string {
  return looksBusy(b)
    ? `${message}（已自动重测一次，结果相同。此刻设备看起来很忙，可能不是代码的问题：关掉占用 CPU 的页面，等几秒再点一次检查。）`
    : `${message}（已自动重测一次，结果相同，更可能是代码的问题。）`;
}
