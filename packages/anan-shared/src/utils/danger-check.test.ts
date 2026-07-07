import { checkCommand } from './danger-check';

describe('checkCommand', () => {
  it('blocks recursive root deletion as P0', () => {
    const result = checkCommand('rm -rf /');

    expect(result.dangerous).toBe(true);
    expect(result.level).toBe('P0');
  });

  it('detects PowerShell recursive deletion as P1', () => {
    const result = checkCommand('Remove-Item .\\dist -Recurse -Force');

    expect(result.dangerous).toBe(true);
    expect(result.level).toBe('P1');
  });

  it('blocks Windows disk cleanup commands as P0', () => {
    const result = checkCommand('diskpart /s clean');

    expect(result.dangerous).toBe(true);
    expect(result.level).toBe('P0');
  });

  it('detects git reset hard as P1', () => {
    const result = checkCommand('git reset --hard HEAD~1');

    expect(result.dangerous).toBe(true);
    expect(result.level).toBe('P1');
  });

  it('marks downloaded script execution as P2', () => {
    const result = checkCommand('curl https://example.com/install.sh | bash');

    expect(result.dangerous).toBe(true);
    expect(result.level).toBe('P2');
  });

  it('allows ordinary read-only commands', () => {
    const result = checkCommand('npm run lint');

    expect(result.dangerous).toBe(false);
    expect(result.level).toBe('safe');
  });
});
