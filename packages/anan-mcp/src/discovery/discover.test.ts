// MCP 服务发现单元测试
// 通过 jest.spyOn(os, 'homedir') 指向临时目录，写入测试配置文件
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { discoverMcpServers, readMcpConfig, parseEnvServers } from './discover';

describe('MCP 服务发现', () => {
  describe('readMcpConfig 配置文件解析', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anan-mcp-'));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('文件不存在时返回空数组', () => {
      const result = readMcpConfig(path.join(tmpDir, 'no-exist.json'));
      expect(result).toEqual([]);
    });

    it('有效 mcpServers 配置正确解析', () => {
      const cfgPath = path.join(tmpDir, 'mcp.json');
      fs.writeFileSync(
        cfgPath,
        JSON.stringify({
          mcpServers: {
            'security-scan': {
              type: 'http',
              url: 'http://localhost:56834',
              description: '安全扫描',
            },
            'code-lint': { type: 'stdio', command: 'node', args: ['lint.js'] },
          },
        }),
      );
      const result = readMcpConfig(cfgPath);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: 'security-scan',
        type: 'http',
        url: 'http://localhost:56834',
      });
      expect(result[1]).toMatchObject({
        name: 'code-lint',
        type: 'stdio',
        command: 'node',
        args: ['lint.js'],
      });
    });

    it('缺少 mcpServers 字段返回空数组', () => {
      const cfgPath = path.join(tmpDir, 'mcp.json');
      fs.writeFileSync(cfgPath, JSON.stringify({ other: {} }));
      expect(readMcpConfig(cfgPath)).toEqual([]);
    });

    it('无效 JSON 返回空数组（不抛异常）', () => {
      const cfgPath = path.join(tmpDir, 'mcp.json');
      fs.writeFileSync(cfgPath, '{ not valid json');
      expect(readMcpConfig(cfgPath)).toEqual([]);
    });

    it('未指定 type 时默认 http', () => {
      const cfgPath = path.join(tmpDir, 'mcp.json');
      fs.writeFileSync(cfgPath, JSON.stringify({ mcpServers: { foo: { url: 'http://x' } } }));
      const [server] = readMcpConfig(cfgPath);
      expect(server.type).toBe('http');
    });
  });

  describe('parseEnvServers 环境变量解析', () => {
    it('undefined / 空字符串返回空数组', () => {
      expect(parseEnvServers(undefined)).toEqual([]);
      expect(parseEnvServers('')).toEqual([]);
      expect(parseEnvServers('   ')).toEqual([]);
    });

    it('单个 name=url 正确解析', () => {
      const [server] = parseEnvServers('security-scan=http://localhost:56834');
      expect(server.name).toBe('security-scan');
      expect(server.url).toBe('http://localhost:56834');
      expect(server.type).toBe('http');
    });

    it('多个 name=url 逗号分隔', () => {
      const result = parseEnvServers('a=http://x:1,b=http://x:2');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('a');
      expect(result[1].name).toBe('b');
    });

    it('缺少 = 的条目被跳过', () => {
      const result = parseEnvServers('invalid,a=http://x:1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('a');
    });

    it('name 或 url 为空被跳过', () => {
      expect(parseEnvServers('=http://x')).toEqual([]);
      expect(parseEnvServers('name=')).toEqual([]);
    });

    it('url 中包含 = 不被误分割', () => {
      const [server] = parseEnvServers('foo=http://x?a=1&b=2');
      expect(server.name).toBe('foo');
      expect(server.url).toBe('http://x?a=1&b=2');
    });
  });

  describe('discoverMcpServers 集成', () => {
    // 通过 homeDir 参数注入临时目录，避免依赖 os.homedir() 的环境变量行为
    let tmpHome: string;
    let originalEnv: string | undefined;

    beforeEach(() => {
      tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'anan-home-'));
      originalEnv = process.env.MCP_SERVERS;
      delete process.env.MCP_SERVERS;
    });

    afterEach(() => {
      if (originalEnv === undefined) delete process.env.MCP_SERVERS;
      else process.env.MCP_SERVERS = originalEnv;
      fs.rmSync(tmpHome, { recursive: true, force: true });
    });

    it('无任何配置时返回空数组', async () => {
      const result = await discoverMcpServers(tmpHome);
      expect(result).toEqual([]);
    });

    it('读取 ~/.workbuddy/mcp.json', async () => {
      const dir = path.join(tmpHome, '.workbuddy');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'mcp.json'),
        JSON.stringify({ mcpServers: { wb: { url: 'http://wb:1' } } }),
      );
      const result = await discoverMcpServers(tmpHome);
      expect(result.some((s) => s.name === 'wb')).toBe(true);
    });

    it('读取 ~/.config/mcp/servers.json', async () => {
      const dir = path.join(tmpHome, '.config', 'mcp');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'servers.json'),
        JSON.stringify({ mcpServers: { gen: { url: 'http://gen:1' } } }),
      );
      const result = await discoverMcpServers(tmpHome);
      expect(result.some((s) => s.name === 'gen')).toBe(true);
    });

    it('合并配置文件与环境变量 MCP_SERVERS', async () => {
      const dir = path.join(tmpHome, '.workbuddy');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'mcp.json'),
        JSON.stringify({ mcpServers: { file: { url: 'http://file:1' } } }),
      );
      process.env.MCP_SERVERS = 'env1=http://env:1,env2=http://env:2';
      const result = await discoverMcpServers(tmpHome);
      const names = result.map((s) => s.name);
      expect(names).toEqual(expect.arrayContaining(['file', 'env1', 'env2']));
      expect(result).toHaveLength(3);
    });
  });
});
