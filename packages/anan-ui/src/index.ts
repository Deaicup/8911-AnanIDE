// anan-ui 扩展入口
// 二次元 UI 替换：主题、图标、安安动画层
// POC 阶段：注册 3 套安安命名主题 + 颜色定义 + 变色动效 + 安安桌面宠物
import { ContainerModule, injectable, inject } from '@theia/core/shared/inversify';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { MenuContribution } from '@theia/core/lib/common/menu';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { FrontendApplication } from '@theia/core/lib/browser';
import { bindAnanThemes, ANAN_THEMES } from './themes/anan-themes';
import { initColorTransition } from './effects/color-transition';
import { initAnanPet } from './pet/anan-pet';
import { AnanFileMenuContribution } from './menus/file-menu';

// 启动时注册安安主题并切换到默认粉系
@injectable()
class AnanThemeContribution implements FrontendApplicationContribution {
  @inject(ThemeService) private readonly themeService!: ThemeService;

  initialize(): void {
    // 注册 3 套安安命名主题（在 ThemeService 初始化阶段尽早注册）
    this.themeService.register(...ANAN_THEMES);
  }

  onStart(_app: FrontendApplication): void {
    // 应用启动后，若当前主题不是安安系列，切换到默认粉系
    const current = this.themeService.getCurrentTheme();
    if (!current.id.startsWith('anan-')) {
      this.themeService.setCurrentTheme('anan-pink', true);
    }
    // 初始化变色动效（全局颜色过渡 + 主题切换波纹）
    initColorTransition(this.themeService);
    // 挂载安安桌面宠物（应用内 Overlay 角色）
    initAnanPet();
  }
}

export default new ContainerModule(bind => {
  // 注册安安颜色定义（light/dark 默认值）
  bind(ColorContribution).toDynamicValue(_ctx => ({
    registerColors: bindAnanThemes,
  }));

  // 注册安安命名主题 + 默认切换 + 变色动效 + 桌面宠物
  bind(FrontendApplicationContribution).to(AnanThemeContribution);

  // File 菜单补齐：新建/打开/保存/另存为/打开文件夹
  bind(MenuContribution).to(AnanFileMenuContribution);

  // MVP 阶段任务：
  // 1. 注册二次元文件树图标主题
  // 2. 挂载 PixiJS Canvas 作为安安表情 Overlay Widget
  // 3. 监听 diagnostic 信息驱动表情切换
});
