import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { discoverMcpServers, parseMcpServers, readMcpConfig } from './discover';

describe('MCP discovery', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anan-mcp-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('reads mcpServers object configs', () => {
    const configPath = path.join(tempDir, 'mcp.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        mcpServers: {
          docs: {
            url: 'http://localhost:3001/mcp',
            description: 'Docs server',
          },
          local: {
            command: 'node',
            args: ['server.js'],
          },
        },
      }),
      'utf-8'
    );

    const servers = readMcpConfig(configPath);

    expect(servers).toHaveLength(2);
    expect(servers[0]).toMatchObject({ name: 'docs', type: 'http' });
    expect(servers[1]).toMatchObject({ name: 'local', type: 'stdio' });
  });

  it('parses MCP_SERVERS JSON', () => {
    const servers = parseMcpServers(
      JSON.stringify({
        servers: [{ name: 'ignored', url: 'http://localhost:3002/sse' }],
      }),
      'env:MCP_SERVERS'
    );

    expect(servers).toEqual([
      expect.objectContaining({
        name: 'ignored',
        type: 'sse',
        source: 'env:MCP_SERVERS',
      }),
    ]);
  });

  it('parses MCP_SERVERS list syntax', () => {
    const servers = parseMcpServers('docs=http://localhost:3001,scan=http://localhost:3002/sse', 'env:MCP_SERVERS');

    expect(servers).toEqual([
      expect.objectContaining({ name: 'docs', type: 'http' }),
      expect.objectContaining({ name: 'scan', type: 'sse' }),
    ]);
  });

  it('discovers from configured paths and environment without duplicates', async () => {
    const configPath = path.join(tempDir, 'servers.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        mcpServers: {
          docs: { url: 'http://localhost:3001' },
        },
      }),
      'utf-8'
    );

    const servers = await discoverMcpServers({
      configPaths: [configPath],
      env: {
        MCP_SERVERS: 'docs=http://localhost:9999,extra=http://localhost:3003',
      },
    });

    expect(servers).toHaveLength(2);
    expect(servers.find(server => server.name === 'docs')?.url).toBe('http://localhost:3001');
    expect(servers.find(server => server.name === 'extra')?.url).toBe('http://localhost:3003');
  });
});
