// 安安桌面宠物：应用内 Overlay 角色
// - 原创萌系 SVG 形象（粉发/大眼/腮红/微笑），零版权风险
// - idle 呼吸 + 晃动动画
// - 可拖动到任意位置
// - 点击切换表情（睁眼 / 眨眼 / 笑眯眼）
// - 悬停显示「安安✨」气泡
const PET_HTML = `
<div class="anan-pet-body">
  <svg viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg">
    <!-- 头发后部 -->
    <ellipse cx="60" cy="58" rx="42" ry="40" fill="#FFB8D0"/>
    <!-- 脸 -->
    <circle cx="60" cy="64" r="34" fill="#FFE4D6"/>
    <!-- 头发前刘海 -->
    <path d="M 28 50 Q 40 18 60 22 Q 80 18 92 50 Q 86 40 72 38 Q 60 44 48 38 Q 34 40 28 50 Z" fill="#FF9EC4"/>
    <!-- 双马尾 -->
    <ellipse cx="22" cy="62" rx="8" ry="20" fill="#FF9EC4" transform="rotate(-12 22 62)"/>
    <ellipse cx="98" cy="62" rx="8" ry="20" fill="#FF9EC4" transform="rotate(12 98 62)"/>
    <!-- 腮红 -->
    <ellipse cx="40" cy="72" rx="6" ry="4" fill="#FF8AA8" opacity="0.7"/>
    <ellipse cx="80" cy="72" rx="6" ry="4" fill="#FF8AA8" opacity="0.7"/>
    <!-- 眼睛（睁眼态） -->
    <g class="anan-eyes anan-eyes-open">
      <ellipse cx="48" cy="64" rx="4.5" ry="6" fill="#3A2A4A"/>
      <ellipse cx="72" cy="64" rx="4.5" ry="6" fill="#3A2A4A"/>
      <circle cx="49.5" cy="62" r="1.6" fill="#FFFFFF"/>
      <circle cx="73.5" cy="62" r="1.6" fill="#FFFFFF"/>
    </g>
    <!-- 眼睛（眨眼态，默认隐藏） -->
    <g class="anan-eyes anan-eyes-blink" style="display:none">
      <path d="M 43 64 Q 48 60 53 64" stroke="#3A2A4A" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M 67 64 Q 72 60 77 64" stroke="#3A2A4A" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    </g>
    <!-- 眼睛（笑眯眼态，默认隐藏） -->
    <g class="anan-eyes anan-eyes-happy" style="display:none">
      <path d="M 43 65 Q 48 58 53 65" stroke="#3A2A4A" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M 67 65 Q 72 58 77 65" stroke="#3A2A4A" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    </g>
    <!-- 嘴（微笑） -->
    <path d="M 54 80 Q 60 85 66 80" stroke="#C45A8A" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <!-- 头顶呆毛 -->
    <path d="M 60 22 Q 58 12 62 10 Q 66 14 60 22" fill="#FF9EC4"/>
  </svg>
  <div class="anan-pet-bubble">安安✨</div>
</div>
`;

const PET_CSS = `
#anan-pet {
  position: fixed;
  left: 40px;
  bottom: 40px;
  z-index: 99999;
  width: 120px;
  height: 120px;
  user-select: none;
  cursor: grab;
  animation: anan-pet-idle 3.6s ease-in-out infinite;
  filter: drop-shadow(0 6px 12px rgba(255, 110, 170, 0.35));
  transition: filter 0.3s ease;
}
#anan-pet:active { cursor: grabbing; }
#anan-pet:hover { filter: drop-shadow(0 8px 18px rgba(255, 110, 170, 0.6)); }
#anan-pet .anan-pet-body { position: relative; width: 100%; height: 100%; }
#anan-pet.anan-pet-bounce { animation: anan-pet-bounce 0.5s ease; }
#anan-pet .anan-pet-bubble {
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%) scale(0);
  background: #FF9EC4;
  color: #FFFFFF;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: transform 0.25s ease;
  pointer-events: none;
}
#anan-pet:hover .anan-pet-bubble { transform: translateX(-50%) scale(1); }
@keyframes anan-pet-idle {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-6px) rotate(2deg); }
}
@keyframes anan-pet-bounce {
  0% { transform: translateY(0) scale(1); }
  40% { transform: translateY(-22px) scale(1.06); }
  100% { transform: translateY(0) scale(1); }
}
`;

// 表情切换顺序
const EYE_STATES = ['anan-eyes-open', 'anan-eyes-blink', 'anan-eyes-happy'];

// 初始化安安桌面宠物
export function initAnanPet(): void {
  if (document.getElementById('anan-pet')) {
    return; // 防止重复创建
  }
  // 注入样式
  const style = document.createElement('style');
  style.id = 'anan-pet-style';
  style.textContent = PET_CSS;
  document.head.appendChild(style);

  // 创建宠物节点
  const pet = document.createElement('div');
  pet.id = 'anan-pet';
  pet.innerHTML = PET_HTML;
  document.body.appendChild(pet);

  let eyeIndex = 0;
  const eyeGroups = pet.querySelectorAll<SVGGElement>('.anan-eyes');

  // 点击：切换表情 + 跳一下
  pet.addEventListener('click', () => {
    eyeIndex = (eyeIndex + 1) % EYE_STATES.length;
    const active = EYE_STATES[eyeIndex];
    eyeGroups.forEach(g => {
      g.style.display = g.classList.contains(active) ? '' : 'none';
    });
    pet.classList.remove('anan-pet-bounce');
    // 强制重排以重启动画
    void pet.offsetWidth;
    pet.classList.add('anan-pet-bounce');
  });

  // 拖动逻辑
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let moved = false;

  pet.addEventListener('pointerdown', (e: PointerEvent) => {
    dragging = true;
    moved = false;
    offsetX = e.clientX - pet.offsetLeft;
    offsetY = e.clientY - pet.offsetTop;
    pet.setPointerCapture(e.pointerId);
  });

  pet.addEventListener('pointermove', (e: PointerEvent) => {
    if (!dragging) return;
    moved = true;
    pet.style.left = `${e.clientX - offsetX}px`;
    pet.style.top = `${e.clientY - offsetY}px`;
    pet.style.bottom = 'auto';
  });

  pet.addEventListener('pointerup', (e: PointerEvent) => {
    dragging = false;
    try { pet.releasePointerCapture(e.pointerId); } catch { /* 忽略 */ }
    // 拖动结束不触发点击表情切换（moved=true 时阻止 click）
    if (moved) {
      const stopClick = (ev: MouseEvent) => {
        ev.stopPropagation();
        pet.removeEventListener('click', stopClick, true);
      };
      pet.addEventListener('click', stopClick, true);
    }
  });
}
