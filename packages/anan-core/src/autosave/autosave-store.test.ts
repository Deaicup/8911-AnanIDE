import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AutosaveStore, createSnapshotId } from './autosave-store';

describe('AutosaveStore', () => {
  it('saves, lists, and restores snapshots', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anan-autosave-'));
    const targetPath = path.join(tempDir, 'project', 'notes.txt');
    const store = new AutosaveStore({
      rootDir: path.join(tempDir, 'autosave'),
      now: () => '2026-07-07T00:00:00.000Z',
    });

    const snapshot = await store.saveSnapshot({
      project: 'demo',
      filePath: targetPath,
      content: 'draft',
      metadata: { source: 'test' },
    });

    expect(snapshot.id).toBe(createSnapshotId('demo', targetPath, '2026-07-07T00:00:00.000Z'));
    await expect(store.listSnapshots({ project: 'demo' })).resolves.toEqual([snapshot]);
    await expect(store.restoreSnapshot(snapshot.id)).resolves.toBe(targetPath);
    expect(fs.readFileSync(targetPath, 'utf-8')).toBe('draft');
  });

  it('returns false when clearing a missing snapshot', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anan-autosave-'));
    const store = new AutosaveStore({ rootDir: tempDir });

    await expect(store.clearSnapshot('missing')).resolves.toBe(false);
  });
});
