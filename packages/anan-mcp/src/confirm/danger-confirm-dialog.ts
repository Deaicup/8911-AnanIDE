// 高危命令确认弹窗：3 秒倒计时，倒计时结束前不执行
// 安安风格二次确认，避免误删等风险
import { injectable, inject } from '@theia/core/shared/inversify';
import { MessageService } from '@theia/core/lib/common/message-service';

const COUNTDOWN_SECONDS = 3;

@injectable()
export class DangerConfirmDialog {
  @inject(MessageService) private readonly messageService!: MessageService;

  // 弹出 3 秒倒计时确认；返回 true 表示用户确认执行
  async confirm(command: string, level: string, reason: string): Promise<boolean> {
    const levelLabel = level === 'P0' ? '⚠ 不可恢复' : level === 'P1' ? '⚠ 危险' : '注意';
    // 先提示倒计时
    this.messageService.info(`[安安] 检测到高危命令 [${levelLabel}]，${COUNTDOWN_SECONDS} 秒后弹出确认`);

    // 等待倒计时
    await new Promise<void>(resolve => setTimeout(resolve, COUNTDOWN_SECONDS * 1000));

    // 倒计时结束，弹出确认对话框
    const message = `[${levelLabel}] 即将执行：\n${command}\n原因：${reason}\n\n确认执行？`;
    const choice = await this.messageService.warn(message, '确认执行', '取消');
    return choice === '确认执行';
  }
}
