// MemoryStore 单元测试
// 使用 os.tmpdir() 下的临时 db 文件，避免污染用户 ~/.anan/ 目录
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { MemoryStore } from './store';

describe('MemoryStore 知识图谱存储', () => {
  let tmpDbPath: string;
  let store: MemoryStore;

  beforeEach(() => {
    // 每个用例独立 db 文件，互不干扰
    tmpDbPath = path.join(
      os.tmpdir(),
      `anan-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`,
    );
    store = new MemoryStore(tmpDbPath);
  });

  afterEach(() => {
    store.close();
    if (fs.existsSync(tmpDbPath)) {
      fs.unlinkSync(tmpDbPath);
    }
  });

  it('构造时自动创建目录与表结构', () => {
    expect(fs.existsSync(tmpDbPath)).toBe(true);
    // 重复构造（已存在表）不应报错
    const store2 = new MemoryStore(tmpDbPath);
    store2.close();
  });

  it('record 插入事件应返回自增 id', () => {
    const id1 = store.record({
      type: 'file-edit',
      content: '编辑了 main.ts',
      project: 'demo',
      timestamp: new Date().toISOString(),
    });
    const id2 = store.record({
      type: 'command',
      content: 'npm install',
      project: 'demo',
      timestamp: new Date().toISOString(),
    });
    expect(id1).toBeGreaterThan(0);
    expect(id2).toBeGreaterThan(id1);
  });

  it('query 按 type 过滤正确', () => {
    store.record({
      type: 'file-edit',
      content: 'a',
      project: 'p',
      timestamp: '2026-01-01T00:00:00Z',
    });
    store.record({
      type: 'command',
      content: 'b',
      project: 'p',
      timestamp: '2026-01-02T00:00:00Z',
    });
    store.record({
      type: 'file-edit',
      content: 'c',
      project: 'p',
      timestamp: '2026-01-03T00:00:00Z',
    });

    const edits = store.query({ type: 'file-edit' });
    expect(edits).toHaveLength(2);
    expect(edits.every((e) => e.type === 'file-edit')).toBe(true);
  });

  it('query 按 project 过滤正确', () => {
    store.record({
      type: 'command',
      content: 'x',
      project: 'proj-a',
      timestamp: '2026-01-01T00:00:00Z',
    });
    store.record({
      type: 'command',
      content: 'y',
      project: 'proj-b',
      timestamp: '2026-01-01T00:00:00Z',
    });

    const result = store.query({ project: 'proj-a' });
    expect(result).toHaveLength(1);
    expect(result[0].project).toBe('proj-a');
  });

  it('query 按 since 时间过滤正确', () => {
    store.record({
      type: 'command',
      content: 'old',
      project: 'p',
      timestamp: '2026-01-01T00:00:00Z',
    });
    store.record({
      type: 'command',
      content: 'new',
      project: 'p',
      timestamp: '2026-06-01T00:00:00Z',
    });

    const result = store.query({ since: '2026-05-01T00:00:00Z' });
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('new');
  });

  it('query 默认按时间倒序返回', () => {
    store.record({
      type: 'command',
      content: 'first',
      project: 'p',
      timestamp: '2026-01-01T00:00:00Z',
    });
    store.record({
      type: 'command',
      content: 'second',
      project: 'p',
      timestamp: '2026-02-01T00:00:00Z',
    });

    const result = store.query({});
    expect(result[0].content).toBe('second');
    expect(result[1].content).toBe('first');
  });

  it('query limit 限制返回条数', () => {
    for (let i = 0; i < 5; i++) {
      store.record({
        type: 'command',
        content: `cmd-${i}`,
        project: 'p',
        timestamp: `2026-01-0${i + 1}T00:00:00Z`,
      });
    }
    const result = store.query({ limit: 2 });
    expect(result).toHaveLength(2);
  });

  it('record 的 metadata 字段可写入与读回', () => {
    const meta = JSON.stringify({ exitCode: 0, duration: 123 });
    store.record({
      type: 'mcp-call',
      content: 'security-scan.run',
      project: 'p',
      timestamp: '2026-01-01T00:00:00Z',
      metadata: meta,
    });
    const [recorded] = store.query({ type: 'mcp-call' });
    expect(recorded.metadata).toBe(meta);
  });

  it('close 后再次操作不抛错（db 已关闭由 better-sqlite3 保证）', () => {
    expect(() => store.close()).not.toThrow();
  });
});
