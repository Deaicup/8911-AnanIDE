import { Safety } from './safety';

describe('Safety', () => {
  it('rejects input that is too long', () => {
    const result = Safety.validateInput('abcdef', { maxLength: 3 });

    expect(result.allowed).toBe(false);
  });

  it('rejects path traversal when paths are not allowed', () => {
    const result = Safety.validateInput('../secret.txt', { allowPaths: false });

    expect(result.allowed).toBe(false);
  });

  it('rejects null characters in input', () => {
    const result = Safety.validateInput('abc\0def', {});

    expect(result.allowed).toBe(false);
  });

  it('requires confirmation before delete operations', () => {
    const result = Safety.protectFileOp({ type: 'delete', path: 'notes.txt' });

    expect(result.allowed).toBe(true);
    expect(result.requireConfirm).toBe(true);
  });

  it('blocks oversized files', () => {
    const result = Safety.protectFileOp({
      type: 'read',
      path: 'large.log',
      size: 51 * 1024 * 1024,
    });

    expect(result.allowed).toBe(false);
  });

  it('rejects empty file paths', () => {
    const result = Safety.protectFileOp({ type: 'read', path: '   ' });

    expect(result.allowed).toBe(false);
  });

  it('rejects parent directory jumps in file operations', () => {
    const result = Safety.protectFileOp({ type: 'read', path: '..\\secret.txt' });

    expect(result.allowed).toBe(false);
  });
});
