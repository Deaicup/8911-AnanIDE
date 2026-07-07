import { checkCommand, CommandCheckResult } from '@anan/anan-shared';

export interface CommandConfirmationOptions {
  confirmed?: boolean;
  allowP0?: boolean;
  countdownSeconds?: number;
}

export interface CommandConfirmationDecision {
  allowed: boolean;
  requireConfirm: boolean;
  level: CommandCheckResult['level'];
  reason?: string;
  prompt?: string;
  countdownSeconds?: number;
}

export function evaluateCommandConfirmation(
  command: string,
  options: CommandConfirmationOptions = {}
): CommandConfirmationDecision {
  const check = checkCommand(command);
  if (!check.dangerous) {
    return {
      allowed: true,
      requireConfirm: false,
      level: 'safe',
    };
  }

  if (check.level === 'P0' && !options.allowP0) {
    return {
      allowed: false,
      requireConfirm: false,
      level: check.level,
      reason: check.reason,
      prompt: 'Blocked because this command can cause irreversible damage.',
    };
  }

  if (!options.confirmed) {
    return {
      allowed: false,
      requireConfirm: true,
      level: check.level,
      reason: check.reason,
      prompt: `Confirm before running: ${command}`,
      countdownSeconds: options.countdownSeconds ?? defaultCountdown(check.level),
    };
  }

  return {
    allowed: true,
    requireConfirm: false,
    level: check.level,
    reason: check.reason,
  };
}

function defaultCountdown(level: CommandCheckResult['level']): number {
  if (level === 'P0') return 10;
  if (level === 'P1') return 5;
  if (level === 'P2') return 3;
  return 0;
}
