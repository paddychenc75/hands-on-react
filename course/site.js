// 站点常量：rspress.config.ts 和引擎共用，保证 base 只在一处定义。
export const BASE = '/hands-on-react/';
export const SITE_TITLE = '动手学 React';
// 引擎里拼出来的站内链接（例如复习题的“回看这一课”）。
export const lessonHref = (id) => BASE + 'lessons/' + id + '.html';
export const pageHref = (path) => BASE + path.replace(/^\//, '');
// 引擎拼出来的其他站内链接。页面是静态 html，所以都带 .html；点击时由 theme/components/LinkRouter 交给 Rspress 的客户端路由。
export const HOME_HREF = BASE;
export const reviewHref = () => BASE + 'review.html';
export const glossaryHref = () => BASE + 'glossary.html';
export const checkHref = (stage) => BASE + 'check/' + stage + '.html';
