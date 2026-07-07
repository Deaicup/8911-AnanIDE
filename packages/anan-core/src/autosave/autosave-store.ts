import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface AutosaveSnapshotInput {
  project: string;
  filePath: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface AutosaveSnapshot extends AutosaveSnapshotInput {
  id: string;
  savedAt: string;
}

export interface AutosaveListFilter {
  project?: string;
  filePath?: string;
}

export interface AutosaveStoreOptions {
  rootDir?: string;
  now?: () => string;
}

export class AutosaveStore {
  private readonly rootDir: string;
  private readonly now: () => string;

  constructor(options: AutosaveStoreOptions = {}) {
    this.rootDir = options.rootDir || path.join(os.homedir(), '.anan', 'autosave');
    this.now = options.now || (() => new Date().toISOString());
  }

  async saveSnapshot(input: AutosaveSnapshotInput): Promise<AutosaveSnapshot> {
    const savedAt = this.now();
    const snapshot: AutosaveSnapshot = {
      ...input,
      id: createSnapshotId(input.project, input.filePath, savedAt),
      savedAt,
    };
    await fs.promises.mkdir(this.rootDir, { recursive: true });
    await fs.promises.writeFile(this.snapshotPath(snapshot.id), JSON.stringify(snapshot, null, 2), 'utf-8');
    return snapshot;
  }

  async listSnapshots(filter: AutosaveListFilter = {}): Promise<AutosaveSnapshot[]> {
    let entries: string[];
    try {
      entries = await fs.promises.readdir(this.rootDir);
    } catch {
      return [];
    }

    const snapshots = await Promise.all(
      entries
        .filter(entry => entry.endsWith('.json'))
        .map(entry => this.readSnapshot(path.basename(entry, '.json')))
    );

    return snapshots
      .filter((snapshot): snapshot is AutosaveSnapshot => Boolean(snapshot))
      .filter(snapshot => !filter.project || snapshot.project === filter.project)
      .filter(snapshot => !filter.filePath || snapshot.filePath === filter.filePath)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }

  async getSnapshot(id: string): Promise<AutosaveSnapshot | undefined> {
    return this.readSnapshot(id);
  }

  async restoreSnapshot(id: string, targetPath?: string): Promise<string | undefined> {
    const snapshot = await this.getSnapshot(id);
    if (!snapshot) return undefined;
    const finalPath = targetPath || snapshot.filePath;
    await fs.promises.mkdir(path.dirname(finalPath), { recursive: true });
    await fs.promises.writeFile(finalPath, snapshot.content, 'utf-8');
    return finalPath;
  }

  async clearSnapshot(id: string): Promise<boolean> {
    try {
      await fs.promises.unlink(this.snapshotPath(id));
      return true;
    } catch {
      return false;
    }
  }

  private async readSnapshot(id: string): Promise<AutosaveSnapshot | undefined> {
    try {
      const content = await fs.promises.readFile(this.snapshotPath(id), 'utf-8');
      return JSON.parse(content) as AutosaveSnapshot;
    } catch {
      return undefined;
    }
  }

  private snapshotPath(id: string): string {
    return path.join(this.rootDir, `${id}.json`);
  }
}

export function createSnapshotId(project: string, filePath: string, savedAt: string): string {
  return crypto
    .createHash('sha256')
    .update(`${project}\0${filePath}\0${savedAt}`)
    .digest('hex')
    .slice(0, 16);
}
