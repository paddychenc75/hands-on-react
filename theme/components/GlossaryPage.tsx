import { GLOSSARY } from '../../course/glossary.ts';

/** 术语表：静态数据，直接渲染成表格（服务端也输出，站内搜索能搜到） */
export default function GlossaryPage() {
  return (
    <div className="hoc">
      <div className="crumb"><span className="tag">参考</span></div>
      <p className="lesson-sum">本课程中，一个概念只用一个说法。课文里术语第一次出现时带虚线下划线，把鼠标放上去或点一下就能看到释义。标题、代码和折叠的选读里不加标注。</p>
      {/* rp-not-doc：让 Rspress 文档的表格样式（外边距、圆角、边框、min-width）不作用于自己带外框的 .tbl */}
      <div className="tbl wide rp-not-doc">
        <table>
          <thead><tr><th>术语</th><th>英文</th><th>含义</th><th>不使用的说法</th></tr></thead>
          <tbody>
            {GLOSSARY.map((g: any) => (
              <tr key={g.term}><td><b>{g.term}</b></td><td>{g.en}</td><td>{g.def}</td><td>{g.avoid || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
