// 安安配色方案定义
// MVP 阶段实现 3 套主题：粉系/蓝系/暗夜
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';

export function bindAnanThemes(colors: ColorRegistry): void {
  // 安安粉系主题
  colors.register({
    id: 'anan-pink',
    label: '安安粉系',
    uiTheme: 'vs',
    defaults: {
      'editor.background': '#FFF5F7',
      'editor.foreground': '#4A2C3A',
      'activityBar.background': '#FFE0EC',
      'sideBar.background': '#FFEFF5',
      'statusBar.background': '#FF9EC4',
    },
  });

  // 安安蓝系主题
  colors.register({
    id: 'anan-blue',
    label: '安安蓝系',
    uiTheme: 'vs',
    defaults: {
      'editor.background': '#F0F7FF',
      'editor.foreground': '#1A3A5C',
      'activityBar.background': '#D0E8FF',
      'sideBar.background': '#E8F4FF',
      'statusBar.background': '#7AB8E8',
    },
  });

  // 安安暗夜主题
  colors.register({
    id: 'anan-dark',
    label: '安安暗夜',
    uiTheme: 'vs-dark',
    defaults: {
      'editor.background': '#1E1B2E',
      'editor.foreground': '#E0D8F0',
      'activityBar.background': '#2A2440',
      'sideBar.background': '#241F38',
      'statusBar.background': '#6B4E9E',
    },
  });
}
