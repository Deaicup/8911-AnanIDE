// 配置读写与损坏恢复
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AnanConfig, DEFAULT_CONFIG } from '@anan/anan-shared';

export class ConfigStore {
  private readonly configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(os.homedir(), '.anan', 'config.json');
  }

  load(): AnanConfig {
    if (!fs.existsSync(this.configPath)) {
      this.save(DEFAULT_CONFIG);
      return cloneConfig(DEFAULT_CONFIG);
    }

    try {
      const raw = fs.readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<AnanConfig>;
      const config = mergeConfig(parsed);
      this.save(config);
      return config;
    } catch {
      this.backupCorruptConfig();
      this.save(DEFAULT_CONFIG);
      return cloneConfig(DEFAULT_CONFIG);
    }
  }

  save(config: AnanConfig): void {
    fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
    fs.writeFileSync(this.configPath, `${JSON.stringify(mergeConfig(config), null, 2)}\n`, 'utf-8');
  }

  reset(): AnanConfig {
    this.save(DEFAULT_CONFIG);
    return cloneConfig(DEFAULT_CONFIG);
  }

  getPath(): string {
    return this.configPath;
  }

  private backupCorruptConfig(): void {
    if (!fs.existsSync(this.configPath)) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${this.configPath}.corrupt-${timestamp}`;
    fs.copyFileSync(this.configPath, backupPath);
  }
}

export function mergeConfig(config: Partial<AnanConfig>): AnanConfig {
  return {
    ...cloneConfig(DEFAULT_CONFIG),
    ...config,
    autosave: {
      ...DEFAULT_CONFIG.autosave,
      ...config.autosave,
    },
    mcp: {
      ...DEFAULT_CONFIG.mcp,
      ...config.mcp,
    },
  };
}

function cloneConfig(config: AnanConfig): AnanConfig {
  return JSON.parse(JSON.stringify(config)) as AnanConfig;
}
