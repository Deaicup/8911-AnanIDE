// MCP 网关：连接已发现的 MCP 服务，执行工具调用
// MVP 阶段：用命令模板（anan scan/test/lint）替代 NL→MCP，迭代阶段接 Ollama
import { injectable, inject } from '@theia/core/shared/inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { DEFAULT_TEMPLATES, CommandTemplate } from '@anan/anan-shared';
import { discoverMcpServers, McpServerConfig } from '../discovery/discover';

@injectable()
export class McpGateway {
  @inject(ILogger) private readonly logger!: ILogger;
  private servers: McpServerConfig[] = [];
  private lastDiscoverAt = 0;

  // 发现本地 MCP 服务（缓存 60 秒）
  async discover(): Promise<McpServerConfig[]> {
    const now = Date.now();
    if (this.servers.length === 0 || now - this.lastDiscoverAt > 60_000) {
      this.servers = await discoverMcpServers();
      this.lastDiscoverAt = now;
      this.logger.info(`[anan-mcp] 发现 ${this.servers.length} 个 MCP 服务`);
    }
    return this.servers;
  }

  // 列出可用命令模板
  listTemplates(): CommandTemplate[] {
    return DEFAULT_TEMPLATES;
  }

  // 根据别名查找模板
  findTemplate(alias: string): CommandTemplate | undefined {
    return DEFAULT_TEMPLATES.find(t => t.alias === alias);
  }

  // 判断输入是否为 anan 命令模板（形如 "anan scan"）
  isAnanCommand(input: string): boolean {
    return input.trim().startsWith('anan ');
  }

  // 解析 anan 命令，返回模板与参数
  parseAnanCommand(input: string): { template: CommandTemplate; args: string[] } | undefined {
    const parts = input.trim().split(/\s+/);
    if (parts.length < 2 || parts[0] !== 'anan') {
      return undefined;
    }
    const alias = parts[1];
    const template = this.findTemplate(alias);
    if (!template) {
      return undefined;
    }
    return { template, args: parts.slice(2) };
  }

  // 执行命令模板：连接 MCP 服务并调用工具
  // MVP 阶段：若无可用 MCP 服务，返回模拟结果（便于验证链路）
  async executeTemplate(template: CommandTemplate, _args: string[]): Promise<string> {
    const servers = await this.discover();
    if (servers.length === 0) {
      // 无 MCP 服务时返回模拟结果，验证命令模板链路
      return `[安安] 命令模板「${template.alias}」(${template.description})\n` +
        `  目标工具：${template.toolName}\n` +
        `  状态：未发现可用 MCP 服务（模拟执行）\n` +
        `  提示：配置 ~/.workbuddy/mcp.json 或设置 MCP_SERVERS 环境变量后可真实调用`;
    }
    // 有 MCP 服务时：MVP 阶段打印将调用的服务列表
    const targetServer = servers.find(s => s.name.includes(template.toolName.split('.')[0])) || servers[0];
    return `[安安] 命令模板「${template.alias}」已触发\n` +
      `  目标工具：${template.toolName}\n` +
      `  中转服务：${targetServer.name} (${targetServer.url || targetServer.command || 'unknown'})\n` +
      `  参数：${JSON.stringify(template.parameters || {})}\n` +
      `  注：MCP 协议调用将在迭代阶段完整实现（需 @modelcontextprotocol/sdk 握手）`;
  }
}
