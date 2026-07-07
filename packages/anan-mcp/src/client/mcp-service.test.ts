import { McpService, McpHttpResponse } from './mcp-service';

describe('McpService', () => {
  it('resolves a command template and calls an HTTP MCP server', async () => {
    const fetcher = jest.fn<Promise<McpHttpResponse>, [string, RequestInit | undefined]>(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ result: { content: [{ type: 'text', text: 'done' }] } }),
      text: async () => '',
    }));
    const service = new McpService({
      discover: async () => [{ name: 'local', type: 'http', url: 'http://127.0.0.1/mcp' }],
      fetcher,
      clock: (() => {
        let now = 10;
        return () => now++;
      })(),
    });

    const result = await service.callTemplate('anan scan path=src');

    expect(result).toEqual({
      success: true,
      data: { content: [{ type: 'text', text: 'done' }] },
      duration: 1,
    });
    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1/mcp',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"method":"tools/call"'),
      })
    );
    const body = JSON.parse(String(fetcher.mock.calls[0][1]?.body));
    expect(body.params).toEqual({
      name: 'security-scan.run',
      arguments: { path: 'src', args: [] },
    });
  });

  it('returns a clear error for unknown command templates', async () => {
    const service = new McpService({
      discover: async () => [{ name: 'local', type: 'http', url: 'http://127.0.0.1/mcp' }],
    });

    await expect(service.callTemplate('anan mystery')).resolves.toEqual(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Unknown Anan command template'),
      })
    );
  });

  it('does not pretend stdio servers are connected', async () => {
    const service = new McpService({
      discover: async () => [{ name: 'cli', type: 'stdio', command: 'node', args: ['server.js'] }],
      clock: () => 1,
    });

    await expect(service.callTool({ toolName: 'security-scan.run' })).resolves.toEqual({
      success: false,
      error: expect.stringContaining('uses stdio'),
      duration: 0,
    });
  });
});
