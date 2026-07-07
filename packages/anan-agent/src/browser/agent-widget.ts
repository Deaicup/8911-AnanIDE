// anan-agent Widget：模仿 Trae IDE 的 AI Agent 面板
// 纯 DOM 构建，包含模型选择、Agent/Chat 模式切换、消息区、@引用、流式输入
import { BaseWidget, Message } from '@theia/core/lib/browser/widgets/widget';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { streamChat } from './agent-llm-client';
import { renderMarkdown } from './agent-markdown';
import {
  AGENT_MODELS, DEFAULT_AGENT_MODEL, DEFAULT_BASE_URL, AGENT_STORAGE_KEYS,
  type AgentMessage,
} from '../common/agent-protocol';

// ---- CSS 样式（安安粉系主题） ----
const AGENT_CSS = `
.anan-agent-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-size: 13px;
  color: var(--theia-foreground, #333);
  background: #FFEFF5;
  overflow: hidden;
  position: relative;
}
/* 顶部工具栏 */
.anan-agent-toolbar {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #FFD0E0;
  gap: 6px;
  flex-shrink: 0;
  background: #FFF5FA;
}
.anan-agent-model-select {
  padding: 4px 8px;
  border: 1px solid #FFB6CF;
  border-radius: 4px;
  background: #fff;
  color: #D63384;
  font-size: 12px;
  outline: none;
  cursor: pointer;
  max-width: 180px;
}
.anan-agent-model-select:focus {
  border-color: #FF6FA8;
}
.anan-agent-mode-switch {
  display: flex;
  border: 1px solid #FFB6CF;
  border-radius: 4px;
  overflow: hidden;
}
.anan-agent-mode-btn {
  padding: 4px 10px;
  border: none;
  background: #fff;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  outline: none;
}
.anan-agent-mode-btn.active {
  background: #FF6FA8;
  color: #fff;
}
.anan-agent-settings-btn {
  margin-left: auto;
  padding: 4px 8px;
  border: 1px solid #FFB6CF;
  border-radius: 4px;
  background: #fff;
  color: #D63384;
  font-size: 12px;
  cursor: pointer;
  outline: none;
}
.anan-agent-settings-btn:hover {
  background: #FFE5F0;
}
/* API Key 未设置提示 */
.anan-agent-banner {
  padding: 6px 10px;
  background: #FFF3CD;
  color: #856404;
  font-size: 12px;
  text-align: center;
  border-bottom: 1px solid #FFEEBA;
  flex-shrink: 0;
}
.anan-agent-banner a {
  color: #D63384;
  cursor: pointer;
  text-decoration: underline;
}
/* 消息区 */
.anan-agent-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}
.anan-agent-msg {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}
.anan-agent-msg-user {
  align-items: flex-end;
}
.anan-agent-msg-assistant {
  align-items: flex-start;
}
.anan-agent-msg-bubble {
  max-width: 85%;
  padding: 8px 12px;
  border-radius: 10px;
  word-break: break-word;
  line-height: 1.5;
}
.anan-agent-msg-user .anan-agent-msg-bubble {
  background: #FF9EC4;
  color: #fff;
  border-bottom-right-radius: 2px;
}
.anan-agent-msg-assistant .anan-agent-msg-bubble {
  background: #fff;
  color: #333;
  border: 1px solid #FFD0E0;
  border-bottom-left-radius: 2px;
}
/* Markdown 渲染 */
.anan-agent-md p { margin: 0; }
.anan-agent-md-text { line-height: 1.5; }
.anan-agent-md-inline-code {
  background: rgba(0,0,0,0.06);
  padding: 1px 4px;
  border-radius: 3px;
  font-family: 'Consolas','Courier New',monospace;
  font-size: 12px;
}
.anan-agent-msg-user .anan-agent-md-inline-code {
  background: rgba(255,255,255,0.25);
}
.anan-agent-md-code-block {
  background: #1e1e2e;
  border-radius: 6px;
  margin: 6px 0;
  overflow: hidden;
}
.anan-agent-md-code-lang {
  padding: 4px 8px;
  font-size: 11px;
  color: #89b4fa;
  background: rgba(255,255,255,0.06);
  font-family: 'Consolas',monospace;
}
.anan-agent-md-pre {
  margin: 0;
  padding: 8px 10px;
  overflow-x: auto;
}
.anan-agent-md-pre code {
  font-family: 'Consolas','Courier New',monospace;
  font-size: 12px;
  color: #cdd6f4;
  white-space: pre;
}
.anan-agent-md-list {
  margin: 4px 0;
  padding-left: 20px;
}
.anan-agent-md-list li {
  margin: 2px 0;
}
/* 流式光标 */
.anan-agent-cursor {
  display: inline-block;
  width: 7px;
  height: 14px;
  background: #FF6FA8;
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: anan-agent-blink 1s step-end infinite;
}
@keyframes anan-agent-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
/* 空状态 */
.anan-agent-empty {
  text-align: center;
  color: #B0B0B0;
  padding: 40px 20px;
  font-size: 13px;
}
.anan-agent-empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
/* 上下文标签区 */
.anan-agent-context-bar {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-top: 1px solid #FFD0E0;
  gap: 4px;
  flex-wrap: wrap;
  flex-shrink: 0;
  min-height: 28px;
}
.anan-agent-context-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background: #FFD8E8;
  border: 1px solid #FFB6CF;
  border-radius: 3px;
  font-size: 11px;
  color: #D63384;
  gap: 4px;
}
.anan-agent-context-tag-close {
  cursor: pointer;
  font-weight: bold;
  margin-left: 2px;
}
.anan-agent-at-btn {
  padding: 2px 8px;
  border: 1px dashed #FFB6CF;
  border-radius: 4px;
  background: transparent;
  color: #D63384;
  font-size: 12px;
  cursor: pointer;
  outline: none;
}
.anan-agent-at-btn:hover {
  background: #FFE5F0;
}
/* 输入区 */
.anan-agent-input-area {
  display: flex;
  padding: 8px;
  border-top: 1px solid #FFD0E0;
  gap: 6px;
  flex-shrink: 0;
  background: #FFF5FA;
}
.anan-agent-input-area textarea {
  flex: 1;
  resize: none;
  border: 1px solid #FFB6CF;
  border-radius: 4px;
  background: #fff;
  color: #333;
  padding: 6px 8px;
  font-size: 13px;
  font-family: inherit;
  min-height: 36px;
  max-height: 120px;
  outline: none;
}
.anan-agent-input-area textarea:focus {
  border-color: #FF6FA8;
}
.anan-agent-send-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  background: #FF6FA8;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  outline: none;
  align-self: flex-end;
}
.anan-agent-send-btn:hover {
  background: #FF8AB8;
}
.anan-agent-send-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
/* 设置遮罩 */
.anan-agent-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.anan-agent-settings {
  width: 90%;
  max-width: 320px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.anan-agent-settings-title {
  font-size: 15px;
  font-weight: 600;
  color: #D63384;
  margin-bottom: 12px;
}
.anan-agent-field {
  margin-bottom: 10px;
}
.anan-agent-field label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.anan-agent-field input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #FFB6CF;
  border-radius: 4px;
  font-size: 13px;
  box-sizing: border-box;
  outline: none;
}
.anan-agent-field input:focus {
  border-color: #FF6FA8;
}
.anan-agent-settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.anan-agent-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  outline: none;
}
.anan-agent-btn-primary {
  background: #FF6FA8;
  color: #fff;
}
.anan-agent-btn-primary:hover {
  background: #FF8AB8;
}
.anan-agent-btn-secondary {
  background: #f0f0f0;
  color: #333;
}
`;

// ---- 辅助函数 ----
function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (text !== undefined) {
    el.textContent = text;
  }
  return el;
}

// 上下文文件类型
interface ContextFile {
  name: string;
  content: string;
  language: string;
}

/**
 * 安安 Agent Widget
 * 模仿 Trae IDE 的 AI 助手窗口：模型选择 + Agent/Chat 模式 + 流式对话 + @引用
 */
export class AnanAgentWidget extends BaseWidget {

  private readonly editorManager: EditorManager;
  private readonly workspaceService: WorkspaceService;

  // ---- 状态 ----
  private selectedModel: string;
  private mode: 'agent' | 'chat' = 'agent';
  private apiKey: string;
  private baseUrl: string;
  private conversation: AgentMessage[] = [];
  private contextFiles: ContextFile[] = [];
  private isStreaming = false;
  private abortController: AbortController | null = null;

  // ---- DOM 引用 ----
  private modelSelect!: HTMLSelectElement;
  private modeBtnAgent!: HTMLButtonElement;
  private modeBtnChat!: HTMLButtonElement;
  private messagesArea!: HTMLElement;
  private inputTextarea!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;
  private contextBar!: HTMLElement;
  private banner!: HTMLElement;
  private settingsOverlay!: HTMLElement;
  private apiKeyInput!: HTMLInputElement;
  private baseUrlInput!: HTMLInputElement;

  // 流式渲染相关
  private streamingBubble: HTMLElement | null = null;
  private streamingText = '';

  constructor(
    editorManager: EditorManager,
    workspaceService: WorkspaceService,
  ) {
    super();
    this.editorManager = editorManager;
    this.workspaceService = workspaceService;
    this.id = 'anan-agent';
    this.title.label = '安安 Agent';
    this.title.caption = '安安 Agent';
    this.title.iconClass = 'anan-agent-icon';

    // 从 localStorage 加载设置
    this.apiKey = localStorage.getItem(AGENT_STORAGE_KEYS.apiKey) || '';
    this.baseUrl = localStorage.getItem(AGENT_STORAGE_KEYS.baseUrl) || DEFAULT_BASE_URL;
    this.selectedModel = localStorage.getItem(AGENT_STORAGE_KEYS.model) || DEFAULT_AGENT_MODEL;

    this.node.classList.add('anan-agent-widget');
    this.injectCss();
    this.buildUi();
  }

  // ---- 生命周期 ----

  protected override onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.registerListeners();
    this.updateBanner();
    this.renderEmptyState();
  }

  protected override onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    // 卸载时中断正在进行的流式请求
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // ---- CSS 注入 ----

  private injectCss(): void {
    if (document.getElementById('anan-agent-style')) {
      return;
    }
    const style = document.createElement('style');
    style.id = 'anan-agent-style';
    style.textContent = AGENT_CSS;
    document.head.appendChild(style);
  }

  // ---- DOM 构建 ----

  private buildUi(): void {
    this.node.innerHTML = '';

    // 顶部工具栏
    const toolbar = h('div', 'anan-agent-toolbar');
    this.modelSelect = document.createElement('select');
    this.modelSelect.className = 'anan-agent-model-select';
    for (const m of AGENT_MODELS) {
      const opt = document.createElement('option');
      opt.value = m.value;
      opt.textContent = m.label;
      this.modelSelect.appendChild(opt);
    }
    this.modelSelect.value = this.selectedModel;

    const modeSwitch = h('div', 'anan-agent-mode-switch');
    this.modeBtnAgent = h('button', 'anan-agent-mode-btn active', 'Agent');
    this.modeBtnChat = h('button', 'anan-agent-mode-btn', 'Chat');
    modeSwitch.appendChild(this.modeBtnAgent);
    modeSwitch.appendChild(this.modeBtnChat);

    const settingsBtn = h('button', 'anan-agent-settings-btn', '⚙ 设置');

    toolbar.appendChild(this.modelSelect);
    toolbar.appendChild(modeSwitch);
    toolbar.appendChild(settingsBtn);
    this.node.appendChild(toolbar);

    // API Key 未设置提示
    this.banner = h('div', 'anan-agent-banner');
    this.banner.style.display = 'none';
    this.node.appendChild(this.banner);

    // 消息区
    this.messagesArea = h('div', 'anan-agent-messages');
    this.node.appendChild(this.messagesArea);

    // 上下文标签区
    this.contextBar = h('div', 'anan-agent-context-bar');
    const atBtn = h('button', 'anan-agent-at-btn', '@ 引用文件');
    this.contextBar.appendChild(atBtn);
    this.node.appendChild(this.contextBar);

    // 输入区
    const inputArea = h('div', 'anan-agent-input-area');
    this.inputTextarea = document.createElement('textarea');
    this.inputTextarea.placeholder = '输入消息，Enter 发送，Shift+Enter 换行...';
    this.inputTextarea.rows = 1;
    this.sendBtn = h('button', 'anan-agent-send-btn', '发送');
    inputArea.appendChild(this.inputTextarea);
    inputArea.appendChild(this.sendBtn);
    this.node.appendChild(inputArea);

    // 设置遮罩（默认隐藏）
    this.buildSettingsOverlay();

    // 事件绑定
    this.modelSelect.addEventListener('change', () => this.handleModelChange());
    this.modeBtnAgent.addEventListener('click', () => this.switchMode('agent'));
    this.modeBtnChat.addEventListener('click', () => this.switchMode('chat'));
    settingsBtn.addEventListener('click', () => this.showSettings());
    atBtn.addEventListener('click', () => this.addCurrentFileContext());
    this.sendBtn.addEventListener('click', () => this.handleSend());
    this.inputTextarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    // 输入框自动增高
    this.inputTextarea.addEventListener('input', () => this.autoResizeInput());
  }

  private buildSettingsOverlay(): void {
    this.settingsOverlay = h('div', 'anan-agent-overlay');
    this.settingsOverlay.style.display = 'none';

    const box = h('div', 'anan-agent-settings');
    box.appendChild(h('div', 'anan-agent-settings-title', '⚙ Agent 设置'));

    const keyField = h('div', 'anan-agent-field');
    keyField.appendChild(h('label', undefined, 'API Key'));
    this.apiKeyInput = document.createElement('input');
    this.apiKeyInput.type = 'password';
    this.apiKeyInput.placeholder = 'sk-...';
    keyField.appendChild(this.apiKeyInput);
    box.appendChild(keyField);

    const urlField = h('div', 'anan-agent-field');
    urlField.appendChild(h('label', undefined, 'Base URL'));
    this.baseUrlInput = document.createElement('input');
    this.baseUrlInput.type = 'text';
    this.baseUrlInput.placeholder = 'https://api.openai.com';
    urlField.appendChild(this.baseUrlInput);
    box.appendChild(urlField);

    const actions = h('div', 'anan-agent-settings-actions');
    const cancelBtn = h('button', 'anan-agent-btn anan-agent-btn-secondary', '取消');
    const saveBtn = h('button', 'anan-agent-btn anan-agent-btn-primary', '保存');
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    box.appendChild(actions);

    this.settingsOverlay.appendChild(box);
    this.node.appendChild(this.settingsOverlay);

    cancelBtn.addEventListener('click', () => this.hideSettings());
    saveBtn.addEventListener('click', () => this.saveSettings());
    // 点击遮罩背景关闭
    this.settingsOverlay.addEventListener('click', (e: MouseEvent) => {
      if (e.target === this.settingsOverlay) {
        this.hideSettings();
      }
    });
  }

  // ---- 事件监听 ----

  private registerListeners(): void {
    // 当前无全局事件需要监听
  }

  // ---- 模型 / 模式 ----

  private handleModelChange(): void {
    this.selectedModel = this.modelSelect.value;
    localStorage.setItem(AGENT_STORAGE_KEYS.model, this.selectedModel);
  }

  private switchMode(mode: 'agent' | 'chat'): void {
    this.mode = mode;
    if (mode === 'agent') {
      this.modeBtnAgent.classList.add('active');
      this.modeBtnChat.classList.remove('active');
    } else {
      this.modeBtnAgent.classList.remove('active');
      this.modeBtnChat.classList.add('active');
    }
  }

  // ---- 设置 ----

  private showSettings(): void {
    this.apiKeyInput.value = this.apiKey;
    this.baseUrlInput.value = this.baseUrl;
    this.settingsOverlay.style.display = '';
  }

  private hideSettings(): void {
    this.settingsOverlay.style.display = 'none';
  }

  private saveSettings(): void {
    this.apiKey = this.apiKeyInput.value.trim();
    this.baseUrl = this.baseUrlInput.value.trim() || DEFAULT_BASE_URL;
    localStorage.setItem(AGENT_STORAGE_KEYS.apiKey, this.apiKey);
    localStorage.setItem(AGENT_STORAGE_KEYS.baseUrl, this.baseUrl);
    this.hideSettings();
    this.updateBanner();
  }

  private updateBanner(): void {
    if (!this.apiKey) {
      this.banner.innerHTML = '';
      this.banner.style.display = '';
      const span = h('span', undefined, '未配置 API Key，请先 ');
      const link = h('a', undefined, '设置');
      link.addEventListener('click', () => this.showSettings());
      this.banner.appendChild(span);
      this.banner.appendChild(link);
    } else {
      this.banner.style.display = 'none';
    }
  }

  // ---- @ 引用文件 ----

  private addCurrentFileContext(): void {
    const editorWidget = this.editorManager.currentEditor;
    if (!editorWidget) {
      this.flashContextBar('没有打开的编辑器');
      return;
    }
    const editor = editorWidget.editor;
    const uri = editor.uri.toString();
    const name = this.resolveFilePath(uri);
    // 避免重复添加
    if (this.contextFiles.some(f => f.name === name)) {
      return;
    }
    this.contextFiles.push({
      name,
      content: editor.document.getText(),
      language: editor.document.languageId,
    });
    this.renderContextBar();
  }

  private removeContextFile(index: number): void {
    this.contextFiles.splice(index, 1);
    this.renderContextBar();
  }

  private renderContextBar(): void {
    // 保留 @ 按钮，清除标签
    const atBtn = this.contextBar.querySelector('.anan-agent-at-btn');
    this.contextBar.innerHTML = '';
    if (atBtn) {
      this.contextBar.appendChild(atBtn);
    }
    for (let i = 0; i < this.contextFiles.length; i++) {
      const file = this.contextFiles[i];
      const tag = h('span', 'anan-agent-context-tag');
      tag.appendChild(document.createTextNode(`📎 ${file.name}`));
      const close = h('span', 'anan-agent-context-tag-close', '×');
      const idx = i;
      close.addEventListener('click', () => this.removeContextFile(idx));
      tag.appendChild(close);
      this.contextBar.appendChild(tag);
    }
  }

  private flashContextBar(msg: string): void {
    const tip = h('span', undefined, msg);
    tip.style.color = '#e74c3c';
    tip.style.fontSize = '11px';
    this.contextBar.appendChild(tip);
    setTimeout(() => tip.remove(), 2000);
  }

  // ---- 消息渲染 ----

  private renderEmptyState(): void {
    if (this.conversation.length === 0) {
      this.messagesArea.innerHTML = '';
      const empty = h('div', 'anan-agent-empty');
      empty.appendChild(h('div', 'anan-agent-empty-icon', '🤖'));
      empty.appendChild(h('div', undefined, '我是安安 Agent，有什么可以帮你？'));
      this.messagesArea.appendChild(empty);
    }
  }

  private clearEmptyState(): void {
    const empty = this.messagesArea.querySelector('.anan-agent-empty');
    if (empty) {
      empty.remove();
    }
  }

  // 追加用户消息
  private appendUserMessage(content: string): void {
    this.clearEmptyState();
    const wrapper = h('div', 'anan-agent-msg anan-agent-msg-user');
    const bubble = h('div', 'anan-agent-msg-bubble');
    bubble.textContent = content;
    wrapper.appendChild(bubble);
    this.messagesArea.appendChild(wrapper);
    this.scrollToBottom();
  }

  // 追加助手消息（流式）
  private startAssistantMessage(): void {
    this.clearEmptyState();
    const wrapper = h('div', 'anan-agent-msg anan-agent-msg-assistant');
    const bubble = h('div', 'anan-agent-msg-bubble');
    wrapper.appendChild(bubble);
    this.messagesArea.appendChild(wrapper);
    this.streamingBubble = bubble;
    this.streamingText = '';
    this.scrollToBottom();
  }

  // 流式更新助手消息内容
  private updateStreamingMessage(chunk: string): void {
    this.streamingText += chunk;
    if (this.streamingBubble) {
      this.streamingBubble.innerHTML = '';
      this.streamingBubble.appendChild(renderMarkdown(this.streamingText));
      // 闪烁光标
      const cursor = h('span', 'anan-agent-cursor');
      this.streamingBubble.appendChild(cursor);
    }
    this.scrollToBottom();
  }

  // 结束流式
  private finishAssistantMessage(): void {
    if (this.streamingBubble) {
      this.streamingBubble.innerHTML = '';
      this.streamingBubble.appendChild(renderMarkdown(this.streamingText));
    }
    // 保存到历史
    if (this.streamingText) {
      this.conversation.push({ role: 'assistant', content: this.streamingText });
    }
    this.streamingBubble = null;
    this.streamingText = '';
  }

  // 流式出错
  private showStreamError(error: string): void {
    if (this.streamingBubble) {
      this.streamingBubble.innerHTML = '';
      const errEl = h('div', undefined, `⚠ ${error}`);
      errEl.style.color = '#e74c3c';
      this.streamingBubble.appendChild(errEl);
    } else {
      // 没有正在流式的气泡，单独显示错误
      this.clearEmptyState();
      const wrapper = h('div', 'anan-agent-msg anan-agent-msg-assistant');
      const bubble = h('div', 'anan-agent-msg-bubble');
      const errEl = h('div', undefined, `⚠ ${error}`);
      errEl.style.color = '#e74c3c';
      bubble.appendChild(errEl);
      wrapper.appendChild(bubble);
      this.messagesArea.appendChild(wrapper);
    }
    this.streamingBubble = null;
    this.streamingText = '';
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
  }

  // ---- 发送消息 ----

  private async handleSend(): Promise<void> {
    if (this.isStreaming) {
      return;
    }
    const userText = this.inputTextarea.value.trim();
    if (!userText) {
      return;
    }
    if (!this.apiKey) {
      this.showSettings();
      return;
    }

    // 构建发送给 LLM 的消息列表
    const llmMessages = this.buildLLMMessages(userText);

    // 本地显示用户消息
    this.appendUserMessage(userText);
    this.conversation.push({ role: 'user', content: userText });

    // 清空输入框
    this.inputTextarea.value = '';
    this.autoResizeInput();

    // 开始流式
    this.isStreaming = true;
    this.sendBtn.disabled = true;
    this.sendBtn.textContent = '...';
    this.abortController = new AbortController();
    this.startAssistantMessage();

    try {
      await streamChat({
        model: this.selectedModel,
        messages: llmMessages,
        apiKey: this.apiKey,
        baseUrl: this.baseUrl,
        signal: this.abortController.signal,
        onChunk: (chunk: string) => this.updateStreamingMessage(chunk),
      });
      this.finishAssistantMessage();
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 用户取消，保留已生成内容
        this.finishAssistantMessage();
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        this.showStreamError(msg);
      }
    } finally {
      this.isStreaming = false;
      this.sendBtn.disabled = false;
      this.sendBtn.textContent = '发送';
      this.abortController = null;
    }
  }

  // 构建 LLM 消息列表（含系统提示和上下文文件）
  private buildLLMMessages(userText: string): AgentMessage[] {
    const result: AgentMessage[] = [];
    let systemContent = '你是一个 AI 编程助手，请用中文帮助用户解决问题。';
    if (this.mode === 'agent' && this.contextFiles.length > 0) {
      const fileContext = this.contextFiles.map(f =>
        `文件 ${f.name}（${f.language}）：\n\`\`\`${f.language}\n${f.content}\n\`\`\``
      ).join('\n\n');
      systemContent += `\n\n以下是用户提供的上下文文件：\n\n${fileContext}`;
    }
    result.push({ role: 'system', content: systemContent });
    // 历史对话
    result.push(...this.conversation);
    // 当前用户消息
    result.push({ role: 'user', content: userText });
    return result;
  }

  // ---- 辅助 ----

  private autoResizeInput(): void {
    this.inputTextarea.style.height = 'auto';
    this.inputTextarea.style.height = `${Math.min(this.inputTextarea.scrollHeight, 120)}px`;
  }

  // 将 URI 转为相对路径
  private resolveFilePath(uri: string): string {
    const roots = this.workspaceService.tryGetRoots();
    for (const root of roots) {
      const rootStr = root.resource.toString();
      if (uri.startsWith(rootStr)) {
        const rel = uri.substring(rootStr.length);
        return rel.startsWith('/') ? rel.substring(1) : rel;
      }
    }
    return uri;
  }
}
