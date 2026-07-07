import { AnanExpression } from '../live2d/expressions';

const OVERLAY_ID = 'anan-overlay';
const AVATAR_ID = 'anan-overlay-avatar';

const EXPRESSION_TEXT: Record<AnanExpression, string> = {
  [AnanExpression.Normal]: '安安',
  [AnanExpression.Happy]: '完成',
  [AnanExpression.Thinking]: '思考',
  [AnanExpression.Warning]: '注意',
  [AnanExpression.Error]: '错误',
};

const EXPRESSION_COLORS: Record<AnanExpression, number> = {
  [AnanExpression.Normal]: 0xff9ec4,
  [AnanExpression.Happy]: 0x7ab8e8,
  [AnanExpression.Thinking]: 0xf5c15f,
  [AnanExpression.Warning]: 0xffb35c,
  [AnanExpression.Error]: 0xff6b6b,
};

export function ensureAnanOverlay(expression: AnanExpression = AnanExpression.Normal): HTMLElement {
  let overlay = document.getElementById(OVERLAY_ID) as HTMLElement | null;
  if (!overlay) {
    overlay = document.createElement('section');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('aria-label', '安安状态');
    overlay.innerHTML = `
      <div id="${AVATAR_ID}" class="anan-overlay-avatar"></div>
      <div class="anan-overlay-label"></div>
    `;
    document.body.appendChild(overlay);
    installOverlayStyles();
  }

  setAnanExpression(expression);
  return overlay;
}

export function setAnanExpression(expression: AnanExpression): void {
  const overlay = ensureElement();
  overlay.dataset.expression = expression;
  const label = overlay.querySelector('.anan-overlay-label');
  if (label) {
    label.textContent = EXPRESSION_TEXT[expression];
  }
  const avatar = overlay.querySelector(`#${AVATAR_ID}`) as HTMLElement | null;
  if (avatar) {
    renderPixiAvatar(avatar, expression).catch(() => {
      avatar.textContent = expression === AnanExpression.Happy ? '✓' : 'A';
    });
  }
}

function ensureElement(): HTMLElement {
  return document.getElementById(OVERLAY_ID) as HTMLElement || ensureAnanOverlay();
}

async function renderPixiAvatar(target: HTMLElement, expression: AnanExpression): Promise<void> {
  if (target.dataset.renderedExpression === expression && target.querySelector('canvas')) return;

  const pixi: any = await import('pixi.js');
  const app = new pixi.Application();
  await app.init({
    width: 96,
    height: 96,
    backgroundAlpha: 0,
    antialias: true,
  });

  target.replaceChildren(app.canvas);
  target.dataset.renderedExpression = expression;

  const color = EXPRESSION_COLORS[expression];
  const graphics = new pixi.Graphics();
  graphics.circle(48, 48, 34).fill(color);
  graphics.circle(36, 42, 4).fill(0x2a2440);
  graphics.circle(60, 42, 4).fill(0x2a2440);
  if (expression === AnanExpression.Error) {
    graphics.rect(36, 62, 24, 4).fill(0x2a2440);
  } else {
    graphics.roundRect(36, 58, 24, 12, 6).fill(0xffffff);
  }
  app.stage.addChild(graphics);
}

function installOverlayStyles(): void {
  if (document.getElementById('anan-overlay-style')) return;

  const style = document.createElement('style');
  style.id = 'anan-overlay-style';
  style.textContent = `
    #${OVERLAY_ID} {
      position: fixed;
      right: 18px;
      bottom: 32px;
      width: 112px;
      min-height: 132px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      pointer-events: none;
      color: var(--theia-foreground, #2a2440);
      font: 600 13px/1.3 var(--theia-ui-font-family, sans-serif);
    }

    .anan-overlay-avatar {
      width: 96px;
      height: 96px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: color-mix(in srgb, var(--theia-editor-background, #fff5f7), #ff9ec4 38%);
      box-shadow: 0 8px 24px rgba(42, 36, 64, 0.25);
      overflow: hidden;
    }

    .anan-overlay-avatar canvas {
      width: 96px;
      height: 96px;
      display: block;
    }

    .anan-overlay-label {
      max-width: 104px;
      padding: 4px 8px;
      border-radius: 8px;
      background: var(--theia-editor-background, #fff5f7);
      box-shadow: 0 4px 14px rgba(42, 36, 64, 0.18);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
  document.head.appendChild(style);
}
