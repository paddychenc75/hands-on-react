import { Layout as BasicLayout } from '@rspress/core/theme-original';
import { HomeNavItem, SiteTitle } from './components/SiteTitle';
import TopProgress from './components/TopProgress';

/** 在 Rspress 默认布局的顶栏里加上总进度、带图标的站点标题（回首页）和手机菜单里的“课程首页”；其余照旧。 */
const Layout = () => <BasicLayout navTitle={<SiteTitle />} beforeLeftNavItems={<HomeNavItem />} afterNavMenu={<TopProgress />} />;

export { Layout };
export * from '@rspress/core/theme-original';
