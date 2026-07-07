// MCP 终端贡献：
// 1. 终端创建时设置提示符为「安安✨ ~」
// 2. 拦截用户输入：危险命令弹窗 3 秒倒计时确认；anan 命令模板转 MCP 调用
import { injectable, inject } from '@theia/core/shared/inversify';
import { TerminalContribution } from '@theia/terminal/lib/browser/terminal-widget-impl';
import { TerminalWidgetImpl } from '@theia/terminal/lib/browser/terminal-widget-impl';
import { checkCommand } from '../confirm/danger-check';
import { DangerConfirmDialog } from '../confirm/danger-confirm-dialog';
import { McpGateway } from '../gateway/mcp-gateway';

const ANAN_PROMPT = 'export PS1="\\[\\e[35m\\]安安✨~\\[\\e[0m\\] "';
const CTRL_C = '\x03';

@injectable()
export class AnanTerminalContribution implements TerminalContribution {
  @inject(DangerConfirmDialog) private readonly confirmDialog!: DangerConfirmDialog;
  @inject(McpGateway) private readonly gateway!: McpGateway;

  // 每个终端的输入缓冲
  private buffers = new WeakMap<TerminalWidgetImpl, string>();

  onCreate(term: TerminalWidgetImpl): void {
    // 终端首次启动后设置安安提示符
    term.start().then(() => {
      term.sendText(ANAN_PROMPT + '\n');
    }).catch(() => {/* 终端可能已关闭 */});

    // 监听用户输入，累积命令行
    this.buffers.set(term, '');
    const disposable = term.onData(data => {
      this.handleInput(term, data);
    });
    term.disposed.connect(() => disposable.dispose());
  }

  private handleInput(term: TerminalWidgetImpl, data: string): void {
    const buf = this.buffers.get(term) ?? '';
    for (const ch of data) {
      if (ch === '\r' || ch === '\n') {
        // 回车：处理完整命令
        this.processCommand(term, buf.trim());
        this.buffers.set(term, '');
        return;
      } else if (ch === '\x7f' || ch === '\b') {
        // 退格：删除最后一个字符
        this.buffers.set(term, buf.slice(0, -1));
        return;
      } else if (ch >= ' ' || ch === '\t') {
        // 可打印字符或 Tab，累积
        this.buffers.set(term, buf + ch);
        return;
      }
      // 其他控制字符（方向键等）忽略，避免污染缓冲
    }
  }

  private async processCommand(term: TerminalWidgetImpl, command: string): Promise<void> {
    if (!command) {
      return;
    }
    // 1. 命令模板：anan scan / anan test / anan lint
    if (this.gateway.isAnanCommand(command)) {
      const parsed = this.gateway.parseAnanCommand(command);
      if (parsed) {
        // 发 Ctrl+C 取消 shell 对 anan 命令的执行（anan 命令不存在）
        term.sendText(CTRL_C);
        const result = await this.gateway.executeTemplate(parsed.template, parsed.args);
        term.write('\r\n' + result + '\r\n');
      } else {
        term.sendText(CTRL_C);
        term.write('\r\n[安安] 未知命令模板，可用：' +
          this.gateway.listTemplates().map(t => `anan ${t.alias}`).join(' / ') + '\r\n');
      }
      return;
    }

    // 2. 危险命令检测
    const danger = checkCommand(command);
    if (danger.dangerous) {
      // 发 Ctrl+C 尝试取消已提交的命令
      term.sendText(CTRL_C);
      const ok = await this.confirmDialog.confirm(command, danger.level as string, danger.reason);
      if (ok) {
        // 用户确认，重新执行
        term.write('\r\n[安安] 已确认执行高危命令，请谨慎...\r\n');
        term.sendText(command + '\n');
      } else {
        term.write('\r\n[安安] 已取消高危命令执行 ✓\r\n');
      }
    }
    // 安全命令：放行（已发送到 shell）
  }
}
