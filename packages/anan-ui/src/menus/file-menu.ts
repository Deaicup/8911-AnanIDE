// File 菜单贡献：注册自定义命令到 File 菜单（始终可见），内部转发 Theia 内置 file 命令
// Theia 1.73 默认隐藏 disabled 命令的菜单项，故用自定义 enabled 命令包裹
import { injectable, inject } from '@theia/core/shared/inversify';
import { MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { CommandContribution, CommandRegistry, Command } from '@theia/core/lib/common/command';
import { CommandService } from '@theia/core/lib/common/command';
import { CommonMenus } from '@theia/core/lib/browser/common-menus';
import { WorkspaceCommands } from '@theia/workspace/lib/browser/workspace-commands';
import { CommonCommands } from '@theia/core/lib/browser/common-commands';

// 自定义命令：始终 enabled，内部转发 Theia 内置命令
const ANAN_NEW_FILE: Command = { id: 'anan.file.newFile', label: '新建文件' };
const ANAN_NEW_FOLDER: Command = { id: 'anan.file.newFolder', label: '新建文件夹' };
const ANAN_OPEN_FILE: Command = { id: 'anan.file.openFile', label: '打开文件...' };
const ANAN_OPEN_FOLDER: Command = { id: 'anan.file.openFolder', label: '打开文件夹...' };
const ANAN_OPEN_WORKSPACE: Command = { id: 'anan.file.openWorkspace', label: '打开工作区...' };
const ANAN_SAVE: Command = { id: 'anan.file.save', label: '保存' };
const ANAN_SAVE_ALL: Command = { id: 'anan.file.saveAll', label: '全部保存' };
const ANAN_SAVE_AS: Command = { id: 'anan.file.saveAs', label: '另存为...' };

@injectable()
export class AnanFileMenuContribution implements CommandContribution, MenuContribution {
  @inject(CommandService) private readonly commandService!: CommandService;

  registerCommands(registry: CommandRegistry): void {
    // 注册自定义命令，handler 内部转发 Theia 内置命令
    // 内置命令可能 disabled（无 workspace/编辑器），但自定义命令始终 enabled，菜单项始终可见
    registry.registerCommand(ANAN_NEW_FILE, {
      execute: () => this.commandService.executeCommand(WorkspaceCommands.NEW_FILE.id),
    });
    registry.registerCommand(ANAN_NEW_FOLDER, {
      execute: () => this.commandService.executeCommand(WorkspaceCommands.NEW_FOLDER.id),
    });
    registry.registerCommand(ANAN_OPEN_FILE, {
      execute: () => this.commandService.executeCommand(WorkspaceCommands.OPEN_FILE.id),
    });
    registry.registerCommand(ANAN_OPEN_FOLDER, {
      execute: () => this.commandService.executeCommand(WorkspaceCommands.OPEN_FOLDER.id),
    });
    registry.registerCommand(ANAN_OPEN_WORKSPACE, {
      execute: () => this.commandService.executeCommand(WorkspaceCommands.OPEN_WORKSPACE.id),
    });
    registry.registerCommand(ANAN_SAVE, {
      execute: () => this.commandService.executeCommand(CommonCommands.SAVE.id),
    });
    registry.registerCommand(ANAN_SAVE_ALL, {
      execute: () => this.commandService.executeCommand(CommonCommands.SAVE_ALL.id),
    });
    registry.registerCommand(ANAN_SAVE_AS, {
      execute: () => this.commandService.executeCommand(WorkspaceCommands.SAVE_AS.id),
    });
  }

  registerMenus(registry: MenuModelRegistry): void {
    // 注册到 File 菜单根级，用 order 控制顺序
    registry.registerMenuAction(CommonMenus.FILE, { commandId: ANAN_NEW_FILE.id, order: '1' });
    registry.registerMenuAction(CommonMenus.FILE, { commandId: ANAN_NEW_FOLDER.id, order: '2' });
    registry.registerMenuAction(CommonMenus.FILE, { commandId: ANAN_OPEN_FILE.id, order: '3' });
    registry.registerMenuAction(CommonMenus.FILE, { commandId: ANAN_OPEN_FOLDER.id, order: '4' });
    registry.registerMenuAction(CommonMenus.FILE, { commandId: ANAN_OPEN_WORKSPACE.id, order: '5' });
    registry.registerMenuAction(CommonMenus.FILE, { commandId: ANAN_SAVE.id, order: '6' });
    registry.registerMenuAction(CommonMenus.FILE, { commandId: ANAN_SAVE_ALL.id, order: '7' });
    registry.registerMenuAction(CommonMenus.FILE, { commandId: ANAN_SAVE_AS.id, order: '8' });
  }
}
