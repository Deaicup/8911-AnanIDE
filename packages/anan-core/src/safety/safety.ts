// 防呆设计核心模块
// 所有其他模块执行用户操作前必须调用 Safety 做前置检查
import { checkCommand, CommandCheckResult } from '@anan/anan-shared';

export interface InputRules {
  maxLength?: number;
  allowedTypes?: string[];
  allowPaths?: boolean;
}

export interface Result {
  allowed: boolean;
  reason?: string;
  sanitized?: string;
}

export interface FileOp {
  type: 'read' | 'write' | 'delete' | 'move';
  path: string;
  size?: number;
}

export interface FileOpResult {
  allowed: boolean;
  requireConfirm: boolean;
  reason?: string;
}

// 文件大小上限（50MB，MVP 目标）
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// 危险文件扩展名（二进制/可执行）
const BLOCKED_EXTENSIONS = ['.exe', '.dll', '.so', '.dylib', '.bin', '.iso'];

export class Safety {
  // 输入校验
  static validateInput(input: string, rules: InputRules): Result {
    const sanitized = input.trim();

    if (rules.maxLength && input.length > rules.maxLength) {
      return { allowed: false, reason: `输入超过最大长度 ${rules.maxLength}` };
    }
    if (/\0/.test(input)) {
      return { allowed: false, reason: '检测到非法空字符' };
    }
    // 基础路径遍历攻击防护
    if (!rules.allowPaths && /(^|[\\/])\.\.([\\/]|$)/.test(sanitized)) {
      return { allowed: false, reason: '检测到路径遍历字符' };
    }
    return { allowed: true, sanitized };
  }

  // 危险命令检测
  static checkCommand(cmd: string): CommandCheckResult {
    return checkCommand(cmd);
  }

  // 文件操作保护
  static protectFileOp(op: FileOp): FileOpResult {
    if (!op.path.trim()) {
      return { allowed: false, requireConfirm: false, reason: '文件路径为空' };
    }
    if (/(^|[\\/])\.\.([\\/]|$)/.test(op.path)) {
      return { allowed: false, requireConfirm: false, reason: '文件路径包含上级目录跳转' };
    }
    // 大文件拦截
    if (op.size && op.size > MAX_FILE_SIZE) {
      return {
        allowed: false,
        requireConfirm: false,
        reason: `文件超过 ${MAX_FILE_SIZE / 1024 / 1024}MB 上限`,
      };
    }
    // 危险扩展名拦截
    const ext = op.path.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (ext && BLOCKED_EXTENSIONS.includes(ext) && op.type === 'read') {
      return {
        allowed: false,
        requireConfirm: false,
        reason: `禁止读取二进制文件: ${ext}`,
      };
    }
    // 删除操作需要确认
    if (op.type === 'delete') {
      return { allowed: true, requireConfirm: true, reason: '删除操作需确认' };
    }
    // 覆盖写需要确认
    if (op.type === 'write') {
      return { allowed: true, requireConfirm: true, reason: '覆盖写入需确认' };
    }
    return { allowed: true, requireConfirm: false };
  }

  // 资源限制检查
  static checkResource(type: 'memory' | 'disk' | 'filesize', value: number): boolean {
    const limits = {
      memory: 800 * 1024 * 1024,    // 800MB
      disk: 1024 * 1024 * 1024,      // 1GB 剩余
      filesize: MAX_FILE_SIZE,
    };
    return value < limits[type];
  }
}
