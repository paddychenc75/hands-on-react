// 站点常量：rspress.config.ts 和引擎共用，保证 base 只在一处定义。
export const BASE = '/hands-on-react/';
export const SITE_TITLE = '动手学 React';
// 引擎里拼出来的站内链接（例如复习题的“回看这一课”）。
export const lessonHref = (id) => BASE + 'lessons/' + id + '.html';
export const pageHref = (path) => BASE + path.replace(/^\//, '');
