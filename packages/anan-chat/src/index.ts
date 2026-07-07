// anan-chat 扩展入口
// 注册聊天客户端、Widget 工厂和命令/菜单贡献
import { ContainerModule } from '@theia/core/shared/inversify';
import { WidgetFactory } from '@theia/core/lib/browser/widget-manager';
import { bindViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { ChatClient } from './chat-client';
import { AnanChatWidgetFactory, AnanChatViewContribution } from './chat-contribution';

export default new ContainerModule(bind => {
  // 聊天客户端（单例，管理 REST + WebSocket 通信）
  bind(ChatClient).toSelf().inSingletonScope();

  // Widget 工厂（WidgetManager 通过此工厂创建聊天 Widget）
  bind(WidgetFactory).to(AnanChatWidgetFactory);

  // 命令/菜单/快捷键贡献（注册到 View 菜单）
  bindViewContribution(bind, AnanChatViewContribution);
});
