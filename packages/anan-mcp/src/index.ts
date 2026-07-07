// anan-mcp 扩展入口
// MCP 终端：自动发现、协议网关、高危确认、命令模板、提示符替换
import { ContainerModule } from '@theia/core/shared/inversify';
import { TerminalContribution } from '@theia/terminal/lib/browser/terminal-widget-impl';
import { AnanTerminalContribution } from './terminal/anan-terminal-contribution';
import { DangerConfirmDialog } from './confirm/danger-confirm-dialog';
import { McpGateway } from './gateway/mcp-gateway';

export default new ContainerModule(bind => {
  // 高危命令确认弹窗（3 秒倒计时）
  bind(DangerConfirmDialog).toSelf().inSingletonScope();

  // MCP 网关：服务发现 + 工具调用 + 命令模板
  bind(McpGateway).toSelf().inSingletonScope();

  // 终端贡献：提示符替换 + 输入拦截 + 高危确认 + anan 命令模板
  bind(TerminalContribution).to(AnanTerminalContribution);
});
