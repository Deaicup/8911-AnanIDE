// anan-agent 命令/菜单贡献 + Widget 工厂
// 通过命令打开 Agent Widget，注册到 View 菜单，启动时自动打开右侧面板
import { injectable, inject } from '@theia/core/shared/inversify';
import { Widget } from '@theia/core/lib/browser/widgets/widget';
import { WidgetFactory } from '@theia/core/lib/browser/widget-manager';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { FrontendApplication } from '@theia/core/lib/browser';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { AnanAgentWidget } from './agent-widget';

/**
 * Agent Widget 工厂
 * 由 WidgetManager 调用，创建 AnanAgentWidget 实例
 */
@injectable()
export class AnanAgentWidgetFactory implements WidgetFactory {
  readonly id = 'anan-agent';

  @inject(EditorManager) private readonly editorManager!: EditorManager;
  @inject(WorkspaceService) private readonly workspaceService!: WorkspaceService;

  createWidget(): Widget {
    return new AnanAgentWidget(this.editorManager, this.workspaceService);
  }
}

/**
 * Agent 视图贡献
 * 注册命令和菜单项，通过命令打开/切换 Agent Widget（放置在右侧面板）
 * 启动时自动打开右侧 Agent 面板（模仿 Trae 默认显示 AI 助手）
 */
@injectable()
export class AnanAgentViewContribution extends AbstractViewContribution<AnanAgentWidget> implements FrontendApplicationContribution {

  constructor() {
    super({
      widgetId: 'anan-agent',
      widgetName: '安安 Agent',
      defaultWidgetOptions: {
        area: 'right',
      },
      toggleCommandId: 'anan-agent:toggle',
      toggleKeybinding: 'ctrlcmd+shift+a',
    });
  }

  async onStart(_app: FrontendApplication): Promise<void> {
    // 应用启动后自动打开 Agent 面板（右侧）
    try {
      await this.openView({ toggle: false, activate: false });
    } catch {
      // 容器未就绪时忽略，用户可手动通过命令打开
    }
  }
}
