// Theia 前端模块入口
// POC 阶段：注册安安主题和扩展模块
import { ContainerModule } from '@theia/core/shared/inversify';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { ANAN_THEMES, bindAnanThemes } from './style/anan-themes';

export default new ContainerModule(bind => {
  // 注册安安配色方案
  bind(ColorContribution).toDynamicValue(_ctx => ({
    registerColors: bindAnanThemes,
  }));

  bind(FrontendApplicationContribution).toDynamicValue(ctx => ({
    initialize: () => {
      const themeService = ctx.container.get<ThemeService>(ThemeService);
      themeService.register(...ANAN_THEMES);
      if (!themeService.getThemes().some(theme => theme.id === 'anan-pink')) {
        throw new Error('Anan themes failed to register.');
      }
    },
  }));
});
