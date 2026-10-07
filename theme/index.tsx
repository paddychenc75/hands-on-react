import { Layout as BasicLayout } from '@rspress/core/theme-original';
import TopProgress from './components/TopProgress';

/** 在 Rspress 默认布局的顶栏里加上总进度；其余照旧。 */
const Layout = () => <BasicLayout afterNavMenu={<TopProgress />} />;

export { Layout };
export * from '@rspress/core/theme-original';
