import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MAIN_MENU_BAR, MenuContribution, MenuModelRegistry } from '@theia/core/lib/common/menu';
import { MessageService } from '@theia/core/lib/common/message-service';
import { ensureAnanOverlay, setAnanExpression } from './overlay/anan-overlay';
import { AnanExpression } from './live2d/expressions';
import { expressionForDiagnostics, normalizeDiagnosticSummary } from './diagnostics/expression-controller';

export const ANAN_UI_MENU = [...MAIN_MENU_BAR, '99_anan'];

export const AnanUiCommands = {
  showOverlay: {
    id: 'anan-ui.show-overlay',
    label: 'Show Anan',
    category: 'Anan',
  },
  setExpression: {
    id: 'anan-ui.set-expression',
    label: 'Set Anan Expression',
    category: 'Anan',
  },
  updateDiagnostics: {
    id: 'anan-ui.update-diagnostics',
    label: 'Update Anan Diagnostics',
    category: 'Anan',
  },
};

export default new ContainerModule(bind => {
  bind(FrontendApplicationContribution).toDynamicValue(() => ({
    onStart: () => {
      ensureAnanOverlay(AnanExpression.Normal);
    },
  }));

  bind(CommandContribution).toDynamicValue(ctx => ({
    registerCommands: (commands: CommandRegistry) => {
      const messages = ctx.container.get<MessageService>(MessageService);

      commands.registerCommand(AnanUiCommands.showOverlay, {
        execute: async () => {
          ensureAnanOverlay(AnanExpression.Happy);
          await messages.info('Anan is ready.');
        },
      });

      commands.registerCommand(AnanUiCommands.setExpression, {
        execute: async (expression: AnanExpression = AnanExpression.Normal) => {
          setAnanExpression(expression);
          await messages.info(`Anan expression: ${expression}`);
          return expression;
        },
      });

      commands.registerCommand(AnanUiCommands.updateDiagnostics, {
        execute: async (summary?: unknown) => {
          const expression = expressionForDiagnostics(normalizeDiagnosticSummary(summary));
          setAnanExpression(expression);
          return expression;
        },
      });
    },
  }));

  bind(MenuContribution).toDynamicValue(() => ({
    registerMenus: (menus: MenuModelRegistry) => {
      menus.registerSubmenu(ANAN_UI_MENU, 'Anan', { sortString: '99' });
      menus.registerMenuAction(ANAN_UI_MENU, {
        commandId: AnanUiCommands.showOverlay.id,
        label: 'Show Anan',
        order: '1',
      });
    },
  }));
});
