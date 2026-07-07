import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DEFAULT_CONFIG } from '@anan/anan-shared';
import { ConfigStore, mergeConfig } from './config-store';

describe('ConfigStore', () => {
  let tempDir: string;
  let configPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anan-config-'));
    configPath = path.join(tempDir, 'config.json');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates default config when missing', () => {
    const store = new ConfigStore(configPath);
    const config = store.load();

    expect(config).toEqual(DEFAULT_CONFIG);
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('fills missing nested fields from defaults', () => {
    fs.writeFileSync(configPath, JSON.stringify({ theme: 'anan-blue', autosave: { enabled: false } }), 'utf-8');

    const config = new ConfigStore(configPath).load();

    expect(config.theme).toBe('anan-blue');
    expect(config.autosave.enabled).toBe(false);
    expect(config.autosave.delay).toBe(DEFAULT_CONFIG.autosave.delay);
    expect(config.mcp).toEqual(DEFAULT_CONFIG.mcp);
  });

  it('backs up corrupt config and restores defaults', () => {
    fs.writeFileSync(configPath, '{ broken json', 'utf-8');

    const config = new ConfigStore(configPath).load();
    const backups = fs.readdirSync(tempDir).filter(file => file.includes('.corrupt-'));

    expect(config).toEqual(DEFAULT_CONFIG);
    expect(backups).toHaveLength(1);
  });
});

describe('mergeConfig', () => {
  it('keeps defaults for omitted sections', () => {
    expect(mergeConfig({ version: '1.0.0' })).toMatchObject({
      version: '1.0.0',
      autosave: DEFAULT_CONFIG.autosave,
      mcp: DEFAULT_CONFIG.mcp,
    });
  });
});
