// danger-check 单元测试
// 验证 P0/P1/P2 三级危险命令黑名单匹配与安全命令放行
import { describe, it, expect } from '@jest/globals';
import { checkCommand } from './danger-check';

describe('checkCommand 危险命令检测', () => {
  describe('P0 不可恢复的破坏性命令', () => {
    const p0Cases: Array<[string, string]> = [
      ['rm -rf /', '递归删除根目录'],
      ['rm -rf / ', '递归删除根目录带空格'],
      ['rm -rf *', '递归删除当前目录所有文件'],
      ['mkfs.ext4 /dev/sda', '格式化磁盘'],
      ['dd if=img.iso of=/dev/sdb', '直接写入设备文件'],
      ['format C:', '格式化命令'],
      ['FORMAT D:', '格式化命令大小写'],
      [':(){ :|:& };:', 'Fork 炸弹'],
    ];

    p0Cases.forEach(([cmd, desc]) => {
      it(`P0 命中: ${desc} -> "${cmd}"`, () => {
        const result = checkCommand(cmd);
        expect(result.dangerous).toBe(true);
        expect(result.level).toBe('P0');
        expect(result.reason).toBeTruthy();
        expect(result.matchedPattern).toBeTruthy();
      });
    });
  });

  describe('P1 危险但可恢复命令', () => {
    const p1Cases: Array<[string, string]> = [
      ['rm -rf build', '递归强制删除'],
      ['del /s *.tmp', 'Windows 递归删除'],
      ['shutdown now', '关机命令'],
      ['truncate -s 0 file.log', '截断文件'],
    ];

    p1Cases.forEach(([cmd, desc]) => {
      it(`P1 命中: ${desc} -> "${cmd}"`, () => {
        const result = checkCommand(cmd);
        expect(result.dangerous).toBe(true);
        expect(result.level).toBe('P1');
        expect(result.reason).toBeTruthy();
      });
    });
  });

  describe('P2 需注意命令', () => {
    it('P2 命中: 输出重定向到 /dev/null', () => {
      const result = checkCommand('echo hello > /dev/null');
      expect(result.dangerous).toBe(true);
      expect(result.level).toBe('P2');
    });

    it('P2 命中: chmod 777', () => {
      const result = checkCommand('chmod 777 .');
      expect(result.dangerous).toBe(true);
      expect(result.level).toBe('P2');
    });
  });

  describe('safe 安全命令', () => {
    const safeCases = [
      'ls -la',
      'npm install',
      'git status',
      'echo hello',
      'node app.js',
      '',
      'pwd',
    ];

    safeCases.forEach(cmd => {
      it(`safe 放行: "${cmd}"`, () => {
        const result = checkCommand(cmd);
        expect(result.dangerous).toBe(false);
        expect(result.level).toBe('safe');
        expect(result.reason).toBe('');
      });
    });
  });

  describe('边界与优先级', () => {
    it('P0 优先于 P1：rm -rf / 同时匹配 P0 和 P1，应返回 P0', () => {
      const result = checkCommand('rm -rf /');
      expect(result.level).toBe('P0');
    });

    it('命令带参数变体仍能匹配', () => {
      const result = checkCommand('sudo rm -rf /tmp/x');
      expect(result.dangerous).toBe(true);
      expect(['P0', 'P1']).toContain(result.level);
    });

    it('matchPattern 字段为正则源字符串', () => {
      const result = checkCommand('mkfs.ext4 /dev/sda');
      expect(typeof result.matchedPattern).toBe('string');
      expect(result.matchedPattern!.length).toBeGreaterThan(0);
    });
  });
});
