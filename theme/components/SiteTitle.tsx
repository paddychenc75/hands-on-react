import { useLocation } from '@rspress/core/runtime';
import { Link } from '@rspress/core/theme';
import { BASE, SITE_TITLE } from '../../course/site.ts';

/** 当前是不是首页（pathname 可能带 base、.html、结尾斜杠或 /index） */
export function useIsHome(): boolean {
  const { pathname } = useLocation();
  const p = pathname
    .replace(BASE.replace(/\/$/, ''), '')
    .replace(/\.html$/, '')
    .replace(/\/index$/, '')
    .replace(/\/+$/, '');
  return p === '';
}

/** 小的 React 原子图标：一个核加三条轨道 */
function Atom() {
  return (
    <svg className="hoc-atom" viewBox="-12 -12 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.3">
        <ellipse rx="10.5" ry="4.2" />
        <ellipse rx="10.5" ry="4.2" transform="rotate(60)" />
        <ellipse rx="10.5" ry="4.2" transform="rotate(120)" />
      </g>
      <circle r="1.9" fill="currentColor" />
    </svg>
  );
}

/** 顶栏左侧的站点标题：原子图标 + 站名，点击回课程首页（走客户端路由，Link 自带 base）。 */
export function SiteTitle() {
  const home = useIsHome();
  return (
    <div className="rp-nav__title">
      <Link href="/" className="rp-nav__title__link hoc-site-title" aria-label={SITE_TITLE + '，课程首页'} aria-current={home ? 'page' : undefined}>
        <Atom />
        <span>{SITE_TITLE}</span>
      </Link>
    </div>
  );
}

/** 手机上顶栏菜单（汉堡按钮）里的第一项。桌面顶栏里用 CSS 隐藏。 */
export function HomeNavItem() {
  const home = useIsHome();
  return (
    <Link
      href="/"
      className={'rp-nav-screen-menu-item hoc-nav-home' + (home ? ' rp-nav-screen-menu-item--active' : '')}
      aria-current={home ? 'page' : undefined}
    >
      <div className="rp-nav-screen-menu-item__left">课程首页</div>
    </Link>
  );
}
