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
  source?: string;
}

export interface DiscoverMcpServersOptions {
  homeDir?: string;
  env?: NodeJS.ProcessEnv;
  configPaths?: string[];
}

export async function discoverMcpServers(options: DiscoverMcpServersOptions = {}): Promise<McpServerConfig[]> {
  const servers: McpServerConfig[] = [];
  const home = options.homeDir || os.homedir();
  const env = options.env || process.env;

  const configPaths = options.configPaths || [
    // WorkBuddy MCP 配置
    path.join(home, '.workbuddy', 'mcp.json'),
    // 通用 MCP 配置
    path.join(home, '.config', 'mcp', 'servers.json'),
  ];

  for (const configPath of configPaths) {
    servers.push(...readMcpConfig(configPath));
  }

  // 环境变量：支持 JSON，也支持 name=url,name2=url2 的轻量写法。
  const envServers = env.MCP_SERVERS;
  if (envServers) {
    servers.push(...parseMcpServers(envServers, 'env:MCP_SERVERS'));
  }

  return dedupeByName(servers);
}

export function readMcpConfig(filePath: string): McpServerConfig[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    return parseMcpServers(content, filePath);
  } catch {
    return [];
  }
}

export function parseMcpServers(raw: string, source: string): McpServerConfig[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    return parseMcpConfigObject(parsed, source);
  } catch {
    return parseEnvList(trimmed, source);
  }
}

function parseMcpConfigObject(config: unknown, source: string): McpServerConfig[] {
  if (Array.isArray(config)) {
    return config.flatMap((entry, index) => normalizeServer(`server-${index + 1}`, entry, source));
  }

  if (!isRecord(config)) return [];

  if (Array.isArray(config.servers)) {
    return config.servers.flatMap((entry, index) => normalizeServer(`server-${index + 1}`, entry, source));
  }

  if (isRecord(config.mcpServers)) {
    return Object.entries(config.mcpServers).flatMap(([name, cfg]) => normalizeServer(name, cfg, source));
  }

  return [];
}

function parseEnvList(raw: string, source: string): McpServerConfig[] {
  return raw
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
    .flatMap((entry, index) => {
      const [rawName, ...rest] = entry.split('=');
      const value = rest.length ? rest.join('=').trim() : rawName.trim();
      const name = rest.length ? rawName.trim() : `env-${index + 1}`;
      return normalizeServer(name, { url: value }, source);
    });
}

function normalizeServer(name: string, value: unknown, source: string): McpServerConfig[] {
  if (!isRecord(value)) return [];

  const finalName = typeof value.name === 'string' && value.name.trim() ? value.name.trim() : name;
  const url = typeof value.url === 'string' ? value.url : undefined;
  const command = typeof value.command === 'string' ? value.command : undefined;
  if (!url && !command) return [];

  const type = normalizeType(value.type, url);
  const args = Array.isArray(value.args) ? value.args.filter((arg): arg is string => typeof arg === 'string') : undefined;
  const description = typeof value.description === 'string' ? value.description : undefined;

  return [
    {
      name: finalName,
      type,
      url,
      command,
      args,
      description,
      source,
    },
  ];
}

function normalizeType(type: unknown, url?: string): McpServerConfig['type'] {
  if (type === 'stdio' || type === 'http' || type === 'sse') return type;
  if (url?.includes('/sse')) return 'sse';
  return url ? 'http' : 'stdio';
}

function dedupeByName(servers: McpServerConfig[]): McpServerConfig[] {
  const found = new Map<string, McpServerConfig>();
  for (const server of servers) {
    if (!found.has(server.name)) {
      found.set(server.name, server);
    }
  }
  return [...found.values()];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
