// 知识图谱存储
// SQLite 存储安安记忆：文件编辑、命令历史、MCP 调用结果
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export type EventType = 'file-edit' | 'command' | 'mcp-call' | 'user-interaction';
export type EventMetadata = Record<string, unknown> | string;

export interface EventRecord {
  id?: number;
  type: EventType;
  content: string;
  project?: string;
  timestamp: string;
  metadata?: string; // JSON string
}

export interface NewEventRecord {
  type: EventType;
  content: string;
  project?: string;
  timestamp?: string;
  metadata?: EventMetadata;
}

export interface EventQueryFilter {
  type?: EventType;
  project?: string;
  since?: string;
  limit?: number;
}

export class MemoryStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const defaultPath = path.join(os.homedir(), '.anan', 'data.db');
    const finalPath = dbPath || defaultPath;
    if (finalPath !== ':memory:') {
      fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    }
    this.db = new Database(finalPath);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        project TEXT,
        timestamp TEXT NOT NULL,
        metadata TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_events_project ON events(project);
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
    `);
  }

  record(event: NewEventRecord): number {
    const stmt = this.db.prepare(
      'INSERT INTO events (type, content, project, timestamp, metadata) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      event.type,
      event.content.trim(),
      event.project || null,
      event.timestamp || new Date().toISOString(),
      serializeMetadata(event.metadata)
    );
    return Number(result.lastInsertRowid);
  }

  getById(id: number): EventRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM events WHERE id = ?');
    return stmt.get(id) as EventRecord | undefined;
  }

  query(filter: EventQueryFilter = {}): EventRecord[] {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter.type) {
      conditions.push('type = ?');
      params.push(filter.type);
    }
    if (filter.project) {
      conditions.push('project = ?');
      params.push(filter.project);
    }
    if (filter.since) {
      conditions.push('timestamp >= ?');
      params.push(filter.since);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = normalizeLimit(filter.limit);
    const stmt = this.db.prepare(
      `SELECT * FROM events ${where} ORDER BY timestamp DESC LIMIT ?`
    );
    return stmt.all(...params, limit) as EventRecord[];
  }

  count(filter: Pick<EventQueryFilter, 'type' | 'project'> = {}): number {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filter.type) {
      conditions.push('type = ?');
      params.push(filter.type);
    }
    if (filter.project) {
      conditions.push('project = ?');
      params.push(filter.project);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM events ${where}`);
    const row = stmt.get(...params) as { count: number };
    return row.count;
  }

  close(): void {
    this.db.close();
  }
}

export function serializeMetadata(metadata?: EventMetadata): string | null {
  if (!metadata) return null;
  return typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
}

export function parseMetadata(metadata?: string | null): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  try {
    const parsed = JSON.parse(metadata);
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : undefined;
  } catch {
    return undefined;
  }
}

export function normalizeLimit(limit?: number): number {
  if (!limit || !Number.isFinite(limit)) return 100;
  return Math.min(Math.max(Math.floor(limit), 1), 500);
}
