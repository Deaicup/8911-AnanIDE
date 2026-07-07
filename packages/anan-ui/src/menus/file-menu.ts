// File 菜单贡献：补齐 新建/打开/保存/另存为/打开文件夹 等入口
// Theia 内置命令已存在，此处仅显式注册到 File 菜单路径，确保入口可见
import { injectable } from '@theia/core/shared/inversify';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { CommonMenus } from '@theia/core/lib/browser/common-menus';
import { CommonCommands } from '@theia/core/lib/browser/common-commands';
import { WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';

@injectable()
export class AnanFileMenuContribution implements MenuContribution {
  registerMenus(registry: MenuModelRegistry): void {
    // 新建
    registry.registerMenuAction(CommonMenus.FILE_NEW, {
      commandId: WorkspaceCommands.NEW_FILE.id,
      order: 'a',
    });
    registry.registerMenuAction(CommonMenus.FILE_NEW, {
      commandId: WorkspaceCommands.NEW_FOLDER.id,
      order: 'b',
    });

    // 打开
    registry.registerMenuAction(CommonMenus.FILE_OPEN, {
      commandId: WorkspaceCommands.OPEN_FILE.id,
      order: 'a',
    });
    registry.registerMenuAction(CommonMenus.FILE_OPEN, {
      commandId: WorkspaceCommands.OPEN_FOLDER.id,
      order: 'b',
    });
    registry.registerMenuAction(CommonMenus.FILE_OPEN, {
      commandId: WorkspaceCommands.OPEN_WORKSPACE.id,
      order: 'c',
    });
    registry.registerMenuAction(CommonMenus.FILE_OPEN, {
      commandId: WorkspaceCommands.OPEN_RECENT_WORKSPACE.id,
      order: 'd',
    });

    // 保存
    registry.registerMenuAction(CommonMenus.FILE_SAVE, {
      commandId: CommonCommands.SAVE.id,
      order: 'a',
    });
    registry.registerMenuAction(CommonMenus.FILE_SAVE, {
      commandId: CommonCommands.SAVE_ALL.id,
      order: 'b',
    });
    registry.registerMenuAction(CommonMenus.FILE_SAVE, {
      commandId: WorkspaceCommands.SAVE_AS.id,
      order: 'c',
    });

    // 关闭
    registry.registerMenuAction(CommonMenus.FILE_CLOSE, {
      commandId: WorkspaceCommands.CLOSE.id,
      order: 'a',
    });
  }
}
