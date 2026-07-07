import { McpCallResult, ResolvedCommandTemplate, resolveCommandTemplate } from '@anan/anan-shared';
import { discoverMcpServers, DiscoverMcpServersOptions, McpServerConfig } from '../discovery/discover';

export interface McpToolCall {
  serverName?: string;
  toolName: string;
  parameters?: Record<string, unknown>;
}

export interface McpServiceOptions {
  discoverOptions?: DiscoverMcpServersOptions;
  discover?: (options?: DiscoverMcpServersOptions) => Promise<McpServerConfig[]>;
  fetcher?: (input: string, init?: RequestInit) => Promise<McpHttpResponse>;
  recorder?: McpCallRecorder;
  clock?: () => number;
}

export interface McpCallRecorder {
  recordMcpCall(toolName: string, metadata?: Record<string, unknown>): Promise<unknown> | unknown;
}

export interface McpHttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

interface JsonRpcResponse {
  result?: unknown;
  error?: {
    code?: number;
    message?: string;
    data?: unknown;
  };
}

let nextRequestId = 1;

export class McpService {
  private readonly discoverOptions?: DiscoverMcpServersOptions;
  private readonly discoverFn: (options?: DiscoverMcpServersOptions) => Promise<McpServerConfig[]>;
  private readonly fetcher: (input: string, init?: RequestInit) => Promise<McpHttpResponse>;
  private readonly recorder?: McpCallRecorder;
  private readonly clock: () => number;

  constructor(options: McpServiceOptions = {}) {
    this.discoverOptions = options.discoverOptions;
    this.discoverFn = options.discover || discoverMcpServers;
    this.fetcher = options.fetcher || defaultFetch;
    this.recorder = options.recorder;
    this.clock = options.clock || Date.now;
  }

  async listServers(): Promise<McpServerConfig[]> {
    return this.discoverFn(this.discoverOptions);
  }

  resolveTemplate(input: string): ResolvedCommandTemplate | undefined {
    return resolveCommandTemplate(input);
  }

  async callTemplate(input: string, serverName?: string): Promise<McpCallResult> {
    const resolved = this.resolveTemplate(input);
    if (!resolved) {
      return {
        success: false,
        error: 'Unknown Anan command template. Try: anan scan, anan test, or anan lint.',
      };
    }

    return this.callTool({
      serverName,
      toolName: resolved.toolName,
      parameters: {
        ...resolved.parameters,
        args: resolved.args,
      },
    });
  }

  async callTool(call: McpToolCall): Promise<McpCallResult> {
    const startedAt = this.clock();
    const server = await this.pickServer(call.serverName);
    if (!server) {
      return this.completeCall(startedAt, call, undefined, {
        success: false,
        error: call.serverName
          ? `MCP server "${call.serverName}" was not found.`
          : 'No MCP server was discovered.',
      });
    }

    if (server.type === 'stdio' || server.command) {
      return this.completeCall(startedAt, call, server, {
        success: false,
        error: `MCP server "${server.name}" uses stdio. Start it through a terminal bridge before calling tools.`,
      });
    }

    if (!server.url) {
      return this.completeCall(startedAt, call, server, {
        success: false,
        error: `MCP server "${server.name}" has no URL.`,
      });
    }

    try {
      const response = await this.fetcher(server.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: nextRequestId++,
          method: 'tools/call',
          params: {
            name: call.toolName,
            arguments: call.parameters || {},
          },
        }),
      });

      if (!response.ok) {
        return this.completeCall(startedAt, call, server, {
          success: false,
          error: `MCP HTTP ${response.status}: ${response.statusText || await response.text()}`,
        });
      }

      const payload = await response.json();
      const rpc = normalizeJsonRpc(payload);
      if (rpc.error) {
        return this.completeCall(startedAt, call, server, {
          success: false,
          error: rpc.error.message || `MCP JSON-RPC error ${rpc.error.code || ''}`.trim(),
          data: rpc.error.data,
        });
      }

      return this.completeCall(startedAt, call, server, {
        success: true,
        data: rpc.result,
      });
    } catch (error) {
      return this.completeCall(startedAt, call, server, {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async pickServer(serverName?: string): Promise<McpServerConfig | undefined> {
    const servers = await this.listServers();
    if (serverName) {
      return servers.find(server => server.name === serverName);
    }
    return servers[0];
  }

  private async completeCall(
    startedAt: number,
    call: McpToolCall,
    server: McpServerConfig | undefined,
    result: McpCallResult
  ): Promise<McpCallResult> {
    const completed = finish(startedAt, this.clock(), result);
    if (this.recorder) {
      await this.recorder.recordMcpCall(call.toolName, {
        server: server?.name,
        success: completed.success,
        error: completed.error,
        duration: completed.duration,
      });
    }
    return completed;
  }
}

function defaultFetch(input: string, init?: RequestInit): Promise<McpHttpResponse> {
  return fetch(input, init);
}

function normalizeJsonRpc(payload: unknown): JsonRpcResponse {
  if (typeof payload !== 'object' || payload === null) {
    return { result: payload };
  }
  return payload as JsonRpcResponse;
}

function finish(startedAt: number, endedAt: number, result: McpCallResult): McpCallResult {
  return {
    ...result,
    duration: Math.max(0, endedAt - startedAt),
  };
}
