// Safety 防呆模块单元测试
// 覆盖 validateInput / checkCommand / protectFileOp / checkResource 四个接口
import { describe, it, expect } from '@jest/globals';
import { Safety } from './safety';

describe('Safety 防呆模块', () => {
  describe('validateInput 输入校验', () => {
    it('超过最大长度应拒绝', () => {
      const result = Safety.validateInput('12345678901', { maxLength: 10 });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('最大长度');
    });

    it('未超过最大长度应放行', () => {
      const result = Safety.validateInput('12345', { maxLength: 10 });
      expect(result.allowed).toBe(true);
    });

    it('路径遍历 ../ 应拒绝（allowPaths=false）', () => {
      const result = Safety.validateInput('../etc/passwd', { allowPaths: false });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('路径遍历');
    });

    it('Windows 路径遍历 ..\\ 应拒绝', () => {
      const result = Safety.validateInput('..\\windows\\system32', { allowPaths: false });
      expect(result.allowed).toBe(false);
    });

    it('允许路径模式下路径遍历字符不拦截', () => {
      const result = Safety.validateInput('../assets/x.png', { allowPaths: true });
      expect(result.allowed).toBe(true);
    });

    it('合法输入应返回 trim 后的 sanitized 值', () => {
      const result = Safety.validateInput('  hello world  ', {});
      expect(result.allowed).toBe(true);
      expect(result.sanitized).toBe('hello world');
    });
  });

  describe('checkCommand 危险命令检测（转发 danger-check）', () => {
    it('P0 命令返回 dangerous=true', () => {
      const result = Safety.checkCommand('rm -rf /');
      expect(result.dangerous).toBe(true);
      expect(result.level).toBe('P0');
    });

    it('P1 命令返回 dangerous=true', () => {
      const result = Safety.checkCommand('rm -rf build');
      expect(result.dangerous).toBe(true);
      expect(result.level).toBe('P1');
    });

    it('P2 命令返回 dangerous=true', () => {
      const result = Safety.checkCommand('chmod 777 .');
      expect(result.dangerous).toBe(true);
      expect(result.level).toBe('P2');
    });

    it('安全命令返回 dangerous=false', () => {
      const result = Safety.checkCommand('ls -la');
      expect(result.dangerous).toBe(false);
      expect(result.level).toBe('safe');
    });
  });

  describe('protectFileOp 文件操作保护', () => {
    it('读取超过 50MB 的文件应拒绝', () => {
      const result = Safety.protectFileOp({
        type: 'read',
        path: 'big.txt',
        size: 60 * 1024 * 1024,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('MB');
    });

    it('读取 .exe 二进制文件应拒绝', () => {
      const result = Safety.protectFileOp({
        type: 'read',
        path: 'malware.exe',
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('二进制');
    });

    it('读取 .dll 二进制文件应拒绝', () => {
      const result = Safety.protectFileOp({ type: 'read', path: 'lib.dll' });
      expect(result.allowed).toBe(false);
    });

    it('删除操作应要求确认', () => {
      const result = Safety.protectFileOp({ type: 'delete', path: 'foo.txt' });
      expect(result.allowed).toBe(true);
      expect(result.requireConfirm).toBe(true);
    });

    it('覆盖写入应要求确认', () => {
      const result = Safety.protectFileOp({ type: 'write', path: 'foo.txt' });
      expect(result.allowed).toBe(true);
      expect(result.requireConfirm).toBe(true);
    });

    it('读取普通小文件应直接放行', () => {
      const result = Safety.protectFileOp({
        type: 'read',
        path: 'foo.txt',
        size: 1024,
      });
      expect(result.allowed).toBe(true);
      expect(result.requireConfirm).toBe(false);
    });

    it('move 操作无需确认', () => {
      const result = Safety.protectFileOp({ type: 'move', path: 'a.txt' });
      expect(result.allowed).toBe(true);
      expect(result.requireConfirm).toBe(false);
    });
  });

  describe('checkResource 资源限制检查', () => {
    it('memory 超过 800MB 应返回 false', () => {
      expect(Safety.checkResource('memory', 900 * 1024 * 1024)).toBe(false);
    });

    it('memory 未超过 800MB 应返回 true', () => {
      expect(Safety.checkResource('memory', 500 * 1024 * 1024)).toBe(true);
    });

    it('disk 剩余 500MB（< 1GB 阈值）应返回 true', () => {
      // checkResource 语义：value < limit 返回 true
      // disk limit = 1GB，500MB < 1GB → true（资源充足）
      expect(Safety.checkResource('disk', 500 * 1024 * 1024)).toBe(true);
    });

    it('filesize 超过 50MB 应返回 false', () => {
      expect(Safety.checkResource('filesize', 60 * 1024 * 1024)).toBe(false);
    });

    it('filesize 未超过 50MB 应返回 true', () => {
      expect(Safety.checkResource('filesize', 10 * 1024 * 1024)).toBe(true);
    });
  });
});
