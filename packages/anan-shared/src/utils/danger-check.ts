// 危险命令检测
// 放在 shared 中，避免 core/mcp 互相依赖构建产物。
export interface CommandCheckResult {
  dangerous: boolean;
  level: 'P0' | 'P1' | 'P2' | 'safe';
  reason: string;
  matchedPattern?: string;
}

const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; level: 'P0' | 'P1' | 'P2'; reason: string }> = [
  // P0: 不可恢复的破坏性命令
  { pattern: /\brm\s+-(?:r?f|f?r)\s+\/(\s|$)/, level: 'P0', reason: '递归删除根目录，不可恢复' },
  { pattern: /\brm\s+-(?:r?f|f?r)\s+\*\s*$/, level: 'P0', reason: '递归删除当前目录所有文件' },
  { pattern: /\bRemove-Item\b.*(?:C:\\|[A-Z]:\\\*)/i, level: 'P0', reason: 'PowerShell 删除磁盘根目录或根目录内容' },
  { pattern: /\bmkfs\./, level: 'P0', reason: '格式化磁盘' },
  { pattern: /\bdd\b.*of=\/dev\//, level: 'P0', reason: '直接写入设备文件' },
  { pattern: /\bformat\b/i, level: 'P0', reason: '格式化命令' },
  { pattern: /\bFormat-Volume\b/i, level: 'P0', reason: 'PowerShell 格式化卷' },
  { pattern: /\bClear-Disk\b/i, level: 'P0', reason: '清空磁盘分区信息' },
  { pattern: /\bdiskpart\b.*\bclean\b/i, level: 'P0', reason: 'diskpart 清空磁盘' },
  { pattern: /:\(\)\s*\{\s*:\|:&\s*\}\s*;/, level: 'P0', reason: 'Fork 炸弹' },
  // P1: 危险但可恢复
  { pattern: /\brm\s+-(?:r?f|f?r)\b/, level: 'P1', reason: '递归强制删除' },
  { pattern: /\bdel\b.*\/s\b/i, level: 'P1', reason: 'Windows 递归删除' },
  { pattern: /\b(?:rd|rmdir)\b.*\/s\b/i, level: 'P1', reason: 'Windows 递归删除目录' },
  { pattern: /\bRemove-Item\b.*(?:^|\s)-Recurse(?:\s|$)/i, level: 'P1', reason: 'PowerShell 递归删除' },
  { pattern: /\bgit\s+clean\b.*-[^\s]*[fdx][^\s]*/i, level: 'P1', reason: '清理未跟踪文件，可能丢失本地内容' },
  { pattern: /\bgit\s+reset\b.*--hard\b/i, level: 'P1', reason: '硬重置会丢失未提交修改' },
  { pattern: /\bshutdown\b/i, level: 'P1', reason: '关机命令' },
  { pattern: /\b(?:Stop-Computer|Restart-Computer)\b/i, level: 'P1', reason: 'PowerShell 关机或重启命令' },
  { pattern: /\btruncate\b/i, level: 'P1', reason: '截断文件' },
  // P2: 需注意
  { pattern: />\s*\/dev\/null\b/, level: 'P2', reason: '输出重定向到空设备' },
  { pattern: /\bchmod\s+777\b/, level: 'P2', reason: '开放所有权限' },
  { pattern: /\bSet-ExecutionPolicy\b.*\bBypass\b/i, level: 'P2', reason: '绕过 PowerShell 执行策略' },
  { pattern: /\b(?:curl|wget)\b.*\|\s*(?:sh|bash|powershell|pwsh)\b/i, level: 'P2', reason: '下载脚本后直接执行' },
  { pattern: /\bsudo\b/i, level: 'P2', reason: '管理员权限命令' },
];

export function checkCommand(command: string): CommandCheckResult {
  const normalized = command.trim();
  for (const { pattern, level, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(normalized)) {
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
