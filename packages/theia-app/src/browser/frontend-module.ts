// Theia 前端模块入口
// POC 阶段：注册安安主题和扩展模块
import { ContainerModule } from '@theia/core/shared/inversify';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { bindAnanThemes } from './style/anan-themes';

export default new ContainerModule(bind => {
  // 注册安安配色方案
  bind(ColorContribution).toDynamicValue(ctx => ({
    registerColors: bindAnanThemes,
  }));

  // POC: 后续在此绑定 anan-ui / anan-mcp / anan-core 的前端扩展
});
