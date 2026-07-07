// 安安配色方案定义（适配 Theia 1.73 API）
// - 通过 ColorRegistry.register 注册颜色 id 的 light/dark 默认值
// - 通过 ThemeService.register 注册 3 套命名主题（粉系/蓝系/暗夜）
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { Theme } from '@theia/core/lib/common/theme';

// 安安颜色定义：每个颜色 id 提供 light（粉系）与 dark（暗夜）默认值
// 蓝系与粉系同属 light，共享 light 默认值；POC 阶段保证主题可切换，逐主题独立配色留 MVP 用 CSS 实现
const ANAN_COLOR_DEFINITIONS = [
  { id: 'editor.background', light: '#FFF5F7', dark: '#1E1B2E', description: '编辑器背景色' },
  { id: 'editor.foreground', light: '#4A2C3A', dark: '#E0D8F0', description: '编辑器前景色' },
  { id: 'activityBar.background', light: '#FFE0EC', dark: '#2A2440', description: '活动栏背景' },
  { id: 'sideBar.background', light: '#FFEFF5', dark: '#241F38', description: '侧边栏背景' },
  { id: 'statusBar.background', light: '#FF9EC4', dark: '#6B4E9E', description: '状态栏背景' },
];

// 注册颜色定义到 ColorRegistry（由 ColorContribution.registerColors 调用）
export function bindAnanThemes(colors: ColorRegistry): void {
  colors.register(
    ...ANAN_COLOR_DEFINITIONS.map((def) => ({
      id: def.id,
      description: def.description,
      defaults: { light: def.light, dark: def.dark },
    })),
  );
}

// 3 套安安命名主题，供 ThemeService.register 注册
export const ANAN_THEMES: Theme[] = [
  {
    id: 'anan-pink',
    type: 'light',
    label: '安安粉系',
    description: '安安专属萌系粉红配色',
    editorTheme: 'vs',
  },
  {
    id: 'anan-blue',
    type: 'light',
    label: '安安蓝系',
    description: '安安专属清新蓝调配色',
    editorTheme: 'vs',
  },
  {
    id: 'anan-dark',
    type: 'dark',
    label: '安安暗夜',
    description: '安安专属暗夜紫调配色',
    editorTheme: 'vs-dark',
  },
];
