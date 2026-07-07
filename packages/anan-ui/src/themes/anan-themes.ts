// 安安配色方案定义（适配 Theia 1.73 API）
// - 通过 ColorRegistry.register 注册颜色 id 的 light/dark 默认值
// - 通过 ThemeService.register 注册 3 套命名主题（粉系/蓝系/暗夜）
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { Theme } from '@theia/core/lib/common/theme';

// 安安颜色定义：每个颜色 id 提供 light（粉系）与 dark（暗夜）默认值
// 蓝系与粉系同属 light，POC 阶段共享 light 默认值；逐主题独立配色留 MVP 用 CSS 实现
const ANAN_COLOR_DEFINITIONS = [
  // 编辑器
  { id: 'editor.background', light: '#FFF5F7', dark: '#1E1B2E', description: '编辑器背景' },
  { id: 'editor.foreground', light: '#4A2C3A', dark: '#E0D8F0', description: '编辑器前景' },
  { id: 'editorLineNumber.foreground', light: '#C9A0B0', dark: '#5A4E7A', description: '行号' },
  { id: 'editor.selectionBackground', light: '#FFD0E0', dark: '#4A3A6A', description: '选区' },
  { id: 'editor.lineHighlightBackground', light: '#FFEFF5', dark: '#2A2440', description: '当前行高亮' },
  // 活动栏 / 侧边栏
  { id: 'activityBar.background', light: '#FFE0EC', dark: '#2A2440', description: '活动栏背景' },
  { id: 'activityBar.foreground', light: '#C45A8A', dark: '#E0B0D0', description: '活动栏前景' },
  { id: 'activityBar.activeBorder', light: '#FF6BAA', dark: '#B088E0', description: '活动栏激活边框' },
  { id: 'sideBar.background', light: '#FFEFF5', dark: '#241F38', description: '侧边栏背景' },
  { id: 'sideBar.foreground', light: '#5A3A4A', dark: '#C0B0D0', description: '侧边栏前景' },
  // 列表 / 树
  { id: 'list.activeSelectionBackground', light: '#FFD0E0', dark: '#3A2E5A', description: '列表选中背景' },
  { id: 'list.activeSelectionForeground', light: '#4A2C3A', dark: '#FFE0F0', description: '列表选中前景' },
  { id: 'list.hoverBackground', light: '#FFE0EC', dark: '#2E2848', description: '列表悬停背景' },
  // 状态栏 / 标题栏
  { id: 'statusBar.background', light: '#FF9EC4', dark: '#6B4E9E', description: '状态栏背景' },
  { id: 'statusBar.foreground', light: '#FFFFFF', dark: '#E0D8F0', description: '状态栏前景' },
  { id: 'titleBar.activeBackground', light: '#FFB8D0', dark: '#3A2E5A', description: '标题栏背景' },
  { id: 'titleBar.activeForeground', light: '#4A2C3A', dark: '#E0D8F0', description: '标题栏前景' },
  // 顶部 / 面板
  { id: 'panel.background', light: '#FFEFF5', dark: '#241F38', description: '面板背景' },
  { id: 'panel.border', light: '#FFD0E0', dark: '#4A3A6A', description: '面板边框' },
  // 输入框 / 按钮
  { id: 'input.background', light: '#FFFFFF', dark: '#2A2440', description: '输入框背景' },
  { id: 'input.border', light: '#FFD0E0', dark: '#4A3A6A', description: '输入框边框' },
  { id: 'button.background', light: '#FF6BAA', dark: '#8A6BB8', description: '按钮背景' },
  { id: 'button.foreground', light: '#FFFFFF', dark: '#FFFFFF', description: '按钮前景' },
  // 焦点 / 链接
  { id: 'focusBorder', light: '#FF6BAA', dark: '#B088E0', description: '焦点边框' },
  { id: 'textLink.foreground', light: '#E0408A', dark: '#C0A0E0', description: '链接前景' },
];

// 注册颜色定义到 ColorRegistry（由 ColorContribution.registerColors 调用）
export function bindAnanThemes(colors: ColorRegistry): void {
  colors.register(
    ...ANAN_COLOR_DEFINITIONS.map(def => ({
      id: def.id,
      description: def.description,
      defaults: { light: def.light, dark: def.dark },
    }))
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
