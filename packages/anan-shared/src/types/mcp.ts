// MCP 相关公共类型
export interface McpTool {
  name: string;
  description: string;
  parameters: McpToolParameter[];
}

export interface McpToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
}

export interface McpCallResult {
  success: boolean;
  data?: unknown;
  error?: string;
  duration?: number;
}

// 命令模板（MVP 阶段 NL→MCP 的替代方案）
export interface CommandTemplate {
  alias: string; // 如 "scan"
  description: string; // "安全扫描"
  toolName: string; // MCP 工具名
  parameters?: Record<string, unknown>;
}

export const DEFAULT_TEMPLATES: CommandTemplate[] = [
  {
    alias: 'scan',
    description: '安全扫描',
    toolName: 'security-scan.run',
  },
  {
    alias: 'test',
    description: '生成测试',
    toolName: 'workbuddy.generate-tests',
  },
  {
    alias: 'lint',
    description: '代码检查',
    toolName: 'code-lint.run',
  },
];
