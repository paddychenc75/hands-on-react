import { useNavigate } from '@rspress/core/runtime';
import { BASE, lessonHref, pageHref } from '../../course/site.js';

/** 带自定义 class 的 HTML 原样输出（转换脚本对 <ol class=…>、fig、复杂表格等块使用）。
 *  站内链接 href="/lessons/x" 在这里补上 base 和 .html。 */
function fixLinks(html: string) {
  return html.replace(/href="(\/[^"]*)"/g, (m, p) => {
    if (p.startsWith(BASE)) return m;
    const lesson = p.match(/^\/lessons\/([^/#?]+)$/);
    return 'href="' + (lesson ? lessonHref(lesson[1]) : p === '/' ? BASE : pageHref(p) + (/\.\w+$/.test(p) ? '' : '.html')) + '"';
  });
}

export default function Raw({ html, tag = 'div', className }: { html: string; tag?: string; className?: string }) {
  const Tag = tag as any;
  return <Tag className={className ? 'hoc ' + className : 'hoc'} dangerouslySetInnerHTML={{ __html: fixLinks(html) }} />;
}
