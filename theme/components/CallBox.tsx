import type { ReactNode } from 'react';

/** 四种提示框：tip 要点 / warn 常见坑 / like 打个比方 / deep 深入一点（样式见 theme/style.css 的 .call） */
export default function CallBox({ kind, label, children }: { kind: 'tip' | 'warn' | 'like' | 'deep'; label: string; children?: ReactNode }) {
  return (
    <div className={`hoc call ${kind}`}>
      <span className="lbl">{label}</span>
      {children}
    </div>
  );
}
