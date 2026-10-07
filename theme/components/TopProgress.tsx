import { doneCount } from '../../course/engine/index.ts';
import { TOTAL_LESSONS } from '../../course/registry.ts';
import { useProgress } from '../lib/useProgress';

/** 顶栏右侧的总进度：已完成 n/45（旧版 #prog-text / #prog-bar） */
export default function TopProgress() {
  const mounted = useProgress();
  const n = mounted ? doneCount() : 0;
  return (
    <div className="hoc top-progress" title="已完成的课数">
      <div className="bar">
        <i style={{ width: (n / TOTAL_LESSONS) * 100 + '%' }} />
      </div>
      <span id="prog-text">
        已完成 {n}/{TOTAL_LESSONS}
      </span>
    </div>
  );
}
