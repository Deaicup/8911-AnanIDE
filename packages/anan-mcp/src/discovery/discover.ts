// MCP 服务自动发现
// POC 阶段：扫描本地 MCP 配置文件和端口
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface McpServerConfig {
  name: string;
  type: 'stdio' | 'http' | 'sse';
  url?: string;
  command?: string;
  args?: string[];
  description?: string;
}

export async function discoverMcpServers(): Promise<McpServerConfig[]> {
  const servers: McpServerConfig[] = [];
  const home = os.homedir();

  // 扫描 WorkBuddy MCP 配置
  const workbuddyPath = path.join(home, '.workbuddy', 'mcp.json');
  const workbuddyServers = readMcpConfig(workbuddyPath);
  servers.push(...workbuddyServers);

  // 扫描通用 MCP 配置
  const genericPath = path.join(home, '.config', 'mcp', 'servers.json');
  const genericServers = readMcpConfig(genericPath);
  servers.push(...genericServers);

  // 环境变量 MCP_SERVERS，格式：name1=url1,name2=url2
  const envServers = parseEnvServers(process.env.MCP_SERVERS);
  servers.push(...envServers);

  return servers;
}

// 读取单个 MCP 配置文件（{ mcpServers: { ... } } 结构）
export function readMcpConfig(filePath: string): McpServerConfig[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(content);
    if (!config.mcpServers) return [];
    return Object.entries(config.mcpServers).map(([name, cfg]: [string, any]) => ({
      name,
      type: cfg.type || 'http',
      url: cfg.url,
      command: cfg.command,
      args: cfg.args,
      description: cfg.description,
    }));
  } catch {
    return [];
  }
}

// 解析 MCP_SERVERS 环境变量
// 格式：name1=url1,name2=url2
// 例：security-scan=http://localhost:56834,code-lint=http://localhost:56835
export function parseEnvServers(env?: string): McpServerConfig[] {
  if (!env || !env.trim()) return [];
  const servers: McpServerConfig[] = [];
  for (const pair of env.split(',')) {
    const idx = pair.indexOf('=');
    if (idx <= 0) continue; // 缺少 name 或 url，跳过
    const name = pair.slice(0, idx).trim();
    const url = pair.slice(idx + 1).trim();
    if (!name || !url) continue;
    servers.push({
      name,
      type: 'http',
      url,
      description: 'from MCP_SERVERS env',
    });
  }
  return servers;
}
