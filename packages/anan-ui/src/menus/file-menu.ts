// File 菜单贡献：补齐 新建/打开/保存/另存为/打开文件夹 等入口
// Theia 1.73 默认 FileMenuContribution 仅注册了 New Folder/Upload/Download，
// 此处显式将 New File/Open File/Open Folder/Save/Save As 注册到 File 菜单根级
import { injectable } from '@theia/core/shared/inversify';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { CommonMenus } from '@theia/core/lib/browser/common-menus';
import { CommonCommands } from '@theia/core/lib/browser/common-commands';
import { WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';

@injectable()
export class AnanFileMenuContribution implements MenuContribution {
  registerMenus(registry: MenuModelRegistry): void {
    // 直接注册到 File 菜单根级（CommonMenus.FILE），用 order 控制顺序
    // 避免子菜单路径未注册节点导致菜单项不显示

    // 新建
    registry.registerMenuAction(CommonMenus.FILE, {
      commandId: WorkspaceCommands.NEW_FILE.id,
      label: '新建文件',
      order: '1',
    });
    registry.registerMenuAction(CommonMenus.FILE, {
      commandId: WorkspaceCommands.NEW_FOLDER.id,
      label: '新建文件夹',
      order: '2',
    });

    // 打开
    registry.registerMenuAction(CommonMenus.FILE, {
      commandId: WorkspaceCommands.OPEN_FILE.id,
      label: '打开文件...',
      order: '3',
    });
    registry.registerMenuAction(CommonMenus.FILE, {
      commandId: WorkspaceCommands.OPEN_FOLDER.id,
      label: '打开文件夹...',
      order: '4',
    });
    registry.registerMenuAction(CommonMenus.FILE, {
      commandId: WorkspaceCommands.OPEN_WORKSPACE.id,
      label: '打开工作区...',
      order: '5',
    });
    registry.registerMenuAction(CommonMenus.FILE, {
      commandId: WorkspaceCommands.OPEN_RECENT_WORKSPACE.id,
      label: '打开最近的工作区',
      order: '6',
    });

    // 保存
    registry.registerMenuAction(CommonMenus.FILE, {
      commandId: CommonCommands.SAVE.id,
      label: '保存',
      order: '7',
    });
    registry.registerMenuAction(CommonMenus.FILE, {
      commandId: CommonCommands.SAVE_ALL.id,
      label: '全部保存',
      order: '8',
    });
    registry.registerMenuAction(CommonMenus.FILE, {
      commandId: WorkspaceCommands.SAVE_AS.id,
      label: '另存为...',
      order: '9',
    });

    // 关闭
    registry.registerMenuAction(CommonMenus.FILE, {
      commandId: WorkspaceCommands.CLOSE.id,
      label: '关闭工作区',
      order: 'a',
    });
  }
}
