// anan-chat 命令/菜单贡献 + Widget 工厂
// 通过命令打开聊天 Widget，注册到 View 菜单
import { injectable, inject } from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/lib/browser/widgets/widget';
import { WidgetFactory } from '@theia/core/lib/browser/widget-manager';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { ChatClient } from './chat-client';
import { AnanChatWidget } from './chat-widget';

/**
 * 聊天 Widget 工厂
 * 由 WidgetManager 调用，创建 AnanChatWidget 实例
 */
@injectable()
export class AnanChatWidgetFactory implements WidgetFactory {
  readonly id = 'anan-chat';

  @inject(ChatClient) private readonly chatClient!: ChatClient;
  @inject(EditorManager) private readonly editorManager!: EditorManager;
  @inject(WorkspaceService) private readonly workspaceService!: WorkspaceService;

  createWidget(): Widget {
    return new AnanChatWidget(
      this.chatClient,
      this.editorManager,
      this.workspaceService,
    );
  }
}

/**
 * 聊天视图贡献
 * 注册命令和菜单项，通过命令打开/切换聊天 Widget
 */
@injectable()
export class AnanChatViewContribution extends AbstractViewContribution<AnanChatWidget> {

  constructor() {
    super({
      widgetId: 'anan-chat',
      widgetName: '安安聊天',
      defaultWidgetOptions: {
        area: 'right',
      },
      toggleCommandId: 'anan-chat:toggle',
    });
  }
}
