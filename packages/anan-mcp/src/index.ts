import { ContainerModule } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { MessageService } from '@theia/core/lib/common/message-service';
import { McpService } from './client/mcp-service';

export { McpService } from './client/mcp-service';
export * from './discovery/discover';

export const AnanMcpCommands = {
  listServers: {
    id: 'anan-mcp.list-servers',
    label: 'List Anan MCP Servers',
    category: 'Anan',
  },
  runTemplate: {
    id: 'anan-mcp.run-template',
    label: 'Run Anan MCP Template',
    category: 'Anan',
  },
};

export default new ContainerModule(bind => {
  bind(McpService).toDynamicValue(() => new McpService()).inSingletonScope();

  bind(CommandContribution).toDynamicValue(ctx => ({
    registerCommands: (commands: CommandRegistry) => {
      const service = ctx.container.get<McpService>(McpService);
      const messages = ctx.container.get<MessageService>(MessageService);

      commands.registerCommand(AnanMcpCommands.listServers, {
        execute: async () => {
          const servers = await service.listServers();
          const summary = servers.length
            ? servers.map(server => `${server.name} (${server.type})`).join(', ')
            : 'No MCP servers discovered.';
          await messages.info(summary);
          return servers;
        },
      });

      commands.registerCommand(AnanMcpCommands.runTemplate, {
        execute: async (input = 'anan scan', serverName?: string) => {
          const result = await service.callTemplate(input, serverName);
          if (result.success) {
            await messages.info(`Anan MCP completed: ${input}`);
          } else {
            await messages.error(result.error || 'Anan MCP failed.');
          }
          return result;
        },
      });
    },
  }));
});
