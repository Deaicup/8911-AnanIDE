// 知识图谱存储
// SQLite 存储安安记忆：文件编辑、命令历史、MCP 调用结果
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export interface EventRecord {
  id?: number;
  type: 'file-edit' | 'command' | 'mcp-call' | 'user-interaction';
  content: string;
  project?: string;
  timestamp: string;
  metadata?: string; // JSON string
}

export class MemoryStore {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const defaultPath = path.join(os.homedir(), '.anan', 'data.db');
    const finalPath = dbPath || defaultPath;
    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
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

  record(event: Omit<EventRecord, 'id'>): number {
    const stmt = this.db.prepare(
      'INSERT INTO events (type, content, project, timestamp, metadata) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      event.type,
      event.content,
      event.project || null,
      event.timestamp,
      event.metadata || null
    );
    return Number(result.lastInsertRowid);
  }

  query(filter: { type?: string; project?: string; since?: string; limit?: number }): EventRecord[] {
    const conditions: string[] = [];
    const params: any[] = [];
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
    const limit = filter.limit || 100;
    const stmt = this.db.prepare(
      `SELECT * FROM events ${where} ORDER BY timestamp DESC LIMIT ?`
    );
    return stmt.all(...params, limit) as EventRecord[];
  }

  close(): void {
    this.db.close();
  }
}
