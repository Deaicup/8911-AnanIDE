// anan-ui 扩展入口
// 二次元 UI 替换：主题、图标、安安动画层
// POC 阶段：注册 3 套安安命名主题 + 颜色定义
import { ContainerModule, injectable, inject } from '@theia/core/shared/inversify';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { bindAnanThemes, ANAN_THEMES } from './themes/anan-themes';

// 启动时注册 3 套安安命名主题到 ThemeService
@injectable()
class AnanThemeContribution implements FrontendApplicationContribution {
  @inject(ThemeService) private readonly themeService!: ThemeService;

  initialize(): void {
    this.themeService.register(...ANAN_THEMES);
  }
}

export default new ContainerModule((bind) => {
  // 注册安安颜色定义（light/dark 默认值）
  bind(ColorContribution).toDynamicValue((_ctx) => ({
    registerColors: bindAnanThemes,
  }));

  // 注册安安命名主题
  bind(FrontendApplicationContribution).to(AnanThemeContribution);

  // MVP 阶段任务：
  // 1. 注册二次元文件树图标主题
  // 2. 挂载 PixiJS Canvas 作为安安表情 Overlay Widget
  // 3. 监听 diagnostic 信息驱动表情切换
});
