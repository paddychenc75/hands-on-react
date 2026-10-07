import { makePlayground, disposePlayground } from '../../course/engine/index.js';
import { useSlot } from '../lib/useSlot';

/** 由 remark 插件从 ```jsx play 代码块生成。说明和预测题按示例标题（或 playKey）到本课数据文件的 plays 里查。 */
export default function Playground({ code, title, playKey }: { code: string; title?: string; playKey?: string }) {
  const { ref } = useSlot((lesson) => {
    const meta = (lesson.plays || {})[playKey ?? title ?? ''] || {};
    return makePlayground({
      src: code,
      title: (meta.predict && meta.predict.title) || title,
      note: meta.note,
      predict: meta.predict,
      predictKey: meta.pkey,
    });
  }, { needsRuntime: true, cleanup: disposePlayground, deps: [code, title, playKey] });
  return <div ref={ref} className="hoc-slot hoc-slot-pg wide" />;
}
