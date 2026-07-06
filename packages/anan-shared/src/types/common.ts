// 公共类型定义
export interface AnanConfig {
  version: string;
  theme: 'anan-pink' | 'anan-blue' | 'anan-dark';
  autosave: {
    enabled: boolean;
    delay: number; // 毫秒
  };
  mcp: {
    autoDiscover: boolean;
    confirmDangerous: boolean;
  };
}

export interface ProjectInfo {
  name: string;
  path: string;
  lastOpened: string;
}

export const DEFAULT_CONFIG: AnanConfig = {
  version: '0.0.0',
  theme: 'anan-pink',
  autosave: {
    enabled: true,
    delay: 5000,
  },
  mcp: {
    autoDiscover: true,
    confirmDangerous: true,
  },
};
