// 共享类型与默认配置测试
import { describe, it, expect } from '@jest/globals';
import { DEFAULT_CONFIG, AnanConfig, ProjectInfo } from './common';

describe('anan-shared 公共类型与默认配置', () => {
  describe('DEFAULT_CONFIG', () => {
    it('默认主题为 anan-pink', () => {
      expect(DEFAULT_CONFIG.theme).toBe('anan-pink');
    });

    it('默认开启自动保存', () => {
      expect(DEFAULT_CONFIG.autosave.enabled).toBe(true);
    });

    it('自动保存延迟为 5000 毫秒', () => {
      expect(DEFAULT_CONFIG.autosave.delay).toBe(5000);
    });

    it('默认开启 MCP 自动发现', () => {
      expect(DEFAULT_CONFIG.mcp.autoDiscover).toBe(true);
    });

    it('默认开启危险命令确认', () => {
      expect(DEFAULT_CONFIG.mcp.confirmDangerous).toBe(true);
    });

    it('version 字段存在', () => {
      expect(typeof DEFAULT_CONFIG.version).toBe('string');
    });

    it('theme 字段限定为三种安安主题之一', () => {
      const validThemes = ['anan-pink', 'anan-blue', 'anan-dark'];
      expect(validThemes).toContain(DEFAULT_CONFIG.theme);
    });

    it('DEFAULT_CONFIG 满足 AnanConfig 类型约束', () => {
      const config: AnanConfig = DEFAULT_CONFIG;
      expect(config).toBeDefined();
    });
  });

  describe('ProjectInfo 类型', () => {
    it('可构造符合类型的对象', () => {
      const info: ProjectInfo = {
        name: 'demo',
        path: '/tmp/demo',
        lastOpened: '2026-07-06T00:00:00Z',
      };
      expect(info.name).toBe('demo');
      expect(info.path).toBe('/tmp/demo');
    });
  });
});
