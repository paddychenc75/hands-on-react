// 统一启动浏览器。默认用 npm 安装的 Playwright 自带的 Chromium（先运行 npx playwright install chromium）。
// 也可以用环境变量 CHROMIUM 指定本机已有的 Chrome/Chromium 路径。
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
export const launch = () => chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
export const pageUrl = (file, hash = '') => pathToFileURL(path.resolve(file)).href + (hash ? '#' + hash : '');
