// anan-agent 扩展前端入口
// 注册 Widget 工厂和视图贡献（命令/菜单/快捷键）
import { ContainerModule } from '@theia/core/shared/inversify';
import { WidgetFactory } from '@theia/core/lib/browser/widget-manager';
import { bindViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { AnanAgentWidgetFactory, AnanAgentViewContribution } from './agent-contribution';

export default new ContainerModule(bind => {
  // Widget 工厂（WidgetManager 通过此工厂创建 Agent Widget）
  bind(WidgetFactory).to(AnanAgentWidgetFactory);

  // 命令/菜单/快捷键贡献（注册到 View 菜单「安安 Agent」）
  bindViewContribution(bind, AnanAgentViewContribution);
});
