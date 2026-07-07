import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { evaluateFileGuard, safeDeleteFile } from './file-guard';

describe('file guard', () => {
  it('requires confirmation before deleting files', () => {
    const decision = evaluateFileGuard({ type: 'delete', path: 'notes.txt' });

    expect(decision).toEqual(
      expect.objectContaining({
        allowed: true,
        requireConfirm: true,
        canProceed: false,
      })
    );
  });

  it('moves confirmed deletes to recoverable trash', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anan-file-guard-'));
    const filePath = path.join(tempDir, 'notes.txt');
    fs.writeFileSync(filePath, 'hello', 'utf-8');

    const result = await safeDeleteFile(filePath, { confirmed: true });

    expect(result.deleted).toBe(true);
    expect(result.trashPath).toContain('.anan-trash');
    expect(fs.existsSync(filePath)).toBe(false);
    expect(fs.existsSync(result.trashPath || '')).toBe(true);
  });
});
