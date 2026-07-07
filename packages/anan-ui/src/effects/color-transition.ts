// 主题变色动效：全局颜色过渡 + 主题切换时波纹扩散
import { ThemeService } from '@theia/core/lib/browser/theming';

// 全局过渡：让所有元素的颜色变化都带 0.6s 缓动，主题切换时整体平滑变色
const TRANSITION_CSS = `
#anan-color-transition-style * {
  transition: background-color 0.6s ease, color 0.6s ease,
              border-color 0.6s ease, outline-color 0.6s ease,
              fill 0.6s ease, stroke 0.6s ease !important;
}
.anan-ripple {
  position: fixed;
  pointer-events: none;
  border-radius: 50%;
  z-index: 99998;
  transform: translate(-50%, -50%) scale(0);
  animation: anan-ripple-expand 0.9s ease-out forwards;
  mix-blend-mode: screen;
}
@keyframes anan-ripple-expand {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0.9; }
  100% { transform: translate(-50%, -50%) scale(80); opacity: 0; }
}
`;

// 根据主题类型选取波纹颜色
function rippleColor(themeType: string): string {
  if (themeType === 'dark') return '#6B4E9E';
  if (themeType === 'hc' || themeType === 'hcLight') return '#FF6BAA';
  return '#FF9EC4';
}

// 在屏幕中心生成一个扩散波纹
function spawnRipple(color: string): void {
  const ripple = document.createElement('div');
  ripple.className = 'anan-ripple';
  ripple.style.background = color;
  ripple.style.left = `${window.innerWidth / 2}px`;
  ripple.style.top = `${window.innerHeight / 2}px`;
  ripple.style.width = '24px';
  ripple.style.height = '24px';
  document.body.appendChild(ripple);
  window.setTimeout(() => ripple.remove(), 950);
}

// 初始化变色动效：注入全局样式 + 监听主题切换
export function initColorTransition(themeService: ThemeService): void {
  if (document.getElementById('anan-color-transition-style')) {
    return; // 防止重复注入
  }
  const style = document.createElement('style');
  style.id = 'anan-color-transition-style';
  style.textContent = TRANSITION_CSS;
  document.head.appendChild(style);

  themeService.onDidColorThemeChange(event => {
    spawnRipple(rippleColor(event.newTheme.type));
  });
}
