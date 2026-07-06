// 危险命令检测
// 防呆设计核心：所有终端命令执行前必须过这里
export interface CommandCheckResult {
  dangerous: boolean;
  level: 'P0' | 'P1' | 'P2' | 'safe';
  reason: string;
  matchedPattern?: string;
}

// 危险命令黑名单
const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; level: 'P0' | 'P1' | 'P2'; reason: string }> = [
  // P0: 不可恢复的破坏性命令
  { pattern: /\brm\s+-rf?\s+\/(\s|$)/, level: 'P0', reason: '递归删除根目录，不可恢复' },
  { pattern: /\brm\s+-rf?\s+\*\s*$/, level: 'P0', reason: '递归删除当前目录所有文件' },
  { pattern: /\bmkfs\./, level: 'P0', reason: '格式化磁盘' },
  { pattern: /\bdd\b.*of=\/dev\//, level: 'P0', reason: '直接写入设备文件' },
  { pattern: /\bformat\b/i, level: 'P0', reason: '格式化命令' },
  { pattern: /:\(\)\s*\{\s*:\|:&\s*\}\s*;/, level: 'P0', reason: 'Fork 炸弹' },
  // P1: 危险但可恢复
  { pattern: /\brm\s+-rf?\b/, level: 'P1', reason: '递归强制删除' },
  { pattern: /\bdel\s+\/s\b/i, level: 'P1', reason: 'Windows 递归删除' },
  { pattern: /\bshutdown\b/i, level: 'P1', reason: '关机命令' },
  { pattern: /\btruncate\b/i, level: 'P1', reason: '截断文件' },
  // P2: 需注意
  { pattern: />\s*\/dev\/null\b/, level: 'P2', reason: '输出重定向到空设备' },
  { pattern: /\bchmod\s+777\b/, level: 'P2', reason: '开放所有权限' },
];

export function checkCommand(command: string): CommandCheckResult {
  for (const { pattern, level, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return {
        dangerous: true,
        level,
        reason,
        matchedPattern: pattern.source,
      };
    }
  }
  return { dangerous: false, level: 'safe', reason: '' };
}
