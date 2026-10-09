// 测试共用：启动浏览器，并把构建产物（doc_build）按 base /hands-on-react/ 用静态服务器托管。
//   SITE_URL=http://localhost:4173/hands-on-react/ node tests/e2e/xxx.mjs   测试已经在运行的站点（例如 rspress preview）
//   CHROMIUM=/path/to/chrome                                            用本机 Chrome 而不是 Playwright 的 Chromium
// 需要网络：实验台从 cdn.jsdelivr.net 加载 Babel、Prism；React 19.3.0 开发版是站内静态文件（doc_build/runtime/）。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const BASE = '/hands-on-react/';
export const KEY = 'hands-on-react-v1';
// BROWSER=webkit / firefox 可以在别的引擎里跑（目前只有 home.mjs 在三个引擎里都验证过）
export const launch = () =>
  (({ webkit, firefox })[process.env.BROWSER] || chromium).launch(process.env.CHROMIUM && !process.env.BROWSER ? { executablePath: process.env.CHROMIUM } : {});
export const lessonData = async id => (await import(pathToFileURL(path.join(ROOT, 'course/lessons', id + '.ts')).href)).default;
export const lessonOrder = async () => (await import(pathToFileURL(path.join(ROOT, 'course/registry.ts')).href)).LESSON_ORDER;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2',
};
function serve(dir) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!p.startsWith(BASE)) {
      res.writeHead(404);
      return res.end('outside base');
    }
    p = p.slice(BASE.length);
    let f = path.join(dir, p);
    if (!f.startsWith(dir)) {
      res.writeHead(403);
      return res.end();
    }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
    if (!fs.existsSync(f)) {
      res.writeHead(404, { 'content-type': TYPES['.html'] });
      return res.end(fs.readFileSync(path.join(dir, '404.html')));
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => server.listen(0, () => r({ server, url: `http://localhost:${server.address().port}${BASE}` })));
}

/** 返回 { site, close }：site 以 / 结尾，例如 http://localhost:1234/hands-on-react/ */
export async function openSite() {
  if (process.env.SITE_URL) return { site: process.env.SITE_URL, close() {} };
  const dir = path.join(ROOT, 'doc_build');
  if (!fs.existsSync(path.join(dir, 'index.html'))) {
    console.error('先运行 npm run build');
    process.exit(2);
  }
  const s = await serve(dir);
  return { site: s.url, close: () => s.server.close() };
}
export const lessonUrl = (site, id) => site + 'lessons/' + id + '.html';

/** 简单的断言记录器 */
export function checker() {
  const fails = [];
  const ok = (cond, name, extra = '') => {
    console.log((cond ? 'ok   ' : 'FAIL ') + name + (!cond && extra ? '  → ' + extra : ''));
    if (!cond) fails.push(name);
  };
  const done = () => {
    console.log(fails.length ? `\n${fails.length} 项失败` : '\n全部通过');
    return fails.length;
  };
  return { ok, done, fails };
}
