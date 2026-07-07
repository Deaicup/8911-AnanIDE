// anan-chat Widget：内置聊天 UI
// 纯 DOM 操作构建，包含登录/注册、好友/群聊列表、消息收发、上下文分享
import { BaseWidget, Message } from '@theia/core/lib/browser/widgets/widget';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { ChatClient } from './chat-client';
import type {
  FriendInfo, GroupInfo, Conversation, DisplayMessage, AgentContext,
} from './chat-types';

// ---- CSS 样式 ----
const CHAT_CSS = `
.anan-chat-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-size: 13px;
  color: var(--theia-foreground, #333);
  background: var(--theia-background, #fff);
  overflow: hidden;
}
/* 登录/注册 */
.anan-chat-login {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 20px;
}
.anan-chat-login-box {
  width: 100%;
  max-width: 280px;
}
.anan-chat-login-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px;
  color: #FF6FA8;
}
.anan-chat-login-tabs {
  display: flex;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--theia-border, #ddd);
}
.anan-chat-login-tab {
  flex: 1;
  padding: 6px;
  text-align: center;
  cursor: pointer;
  border: none;
  background: none;
  color: var(--theia-descriptionForeground, #888);
  font-size: 13px;
  outline: none;
}
.anan-chat-login-tab.active {
  color: #FF6FA8;
  border-bottom: 2px solid #FF6FA8;
}
.anan-chat-field {
  margin-bottom: 8px;
}
.anan-chat-field input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--theia-input-border, var(--theia-border, #ddd));
  border-radius: 4px;
  background: var(--theia-input-background, #fff);
  color: var(--theia-input-foreground, #333);
  box-sizing: border-box;
  font-size: 13px;
}
.anan-chat-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  background: #FF6FA8;
  color: #fff;
  outline: none;
}
.anan-chat-btn:hover {
  background: #FF8AB8;
}
.anan-chat-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.anan-chat-btn-secondary {
  background: var(--theia-button-secondaryBackground, #555);
  color: var(--theia-button-secondaryForeground, #fff);
}
.anan-chat-btn-small {
  padding: 3px 8px;
  font-size: 11px;
}
.anan-chat-error {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
}
/* 聊天主界面 */
.anan-chat-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.anan-chat-header {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid var(--theia-border, #ddd);
  gap: 8px;
  flex-shrink: 0;
}
.anan-chat-user {
  flex: 1;
  font-weight: 600;
  color: #FF6FA8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.anan-chat-ws-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  color: #999;
}
.anan-chat-ws-status.connected {
  color: #2ecc71;
}
.anan-chat-ws-status.disconnected {
  color: #e74c3c;
}
.anan-chat-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
/* 侧边栏 */
.anan-chat-sidebar {
  width: 180px;
  min-width: 120px;
  border-right: 1px solid var(--theia-border, #ddd);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.anan-chat-sidebar-tabs {
  display: flex;
  border-bottom: 1px solid var(--theia-border, #ddd);
  flex-shrink: 0;
}
.anan-chat-sidebar-tab {
  flex: 1;
  padding: 6px;
  text-align: center;
  cursor: pointer;
  border: none;
  background: none;
  color: var(--theia-descriptionForeground, #888);
  font-size: 12px;
  outline: none;
}
.anan-chat-sidebar-tab.active {
  color: #FF6FA8;
  border-bottom: 2px solid #FF6FA8;
}
.anan-chat-sidebar-list {
  flex: 1;
  overflow-y: auto;
}
.anan-chat-list-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  gap: 6px;
}
.anan-chat-list-item:hover {
  background: var(--theia-list-hoverBackground, rgba(0,0,0,0.04));
}
.anan-chat-list-item.active {
  background: var(--theia-list-activeSelectionBackground, #d9e9ff);
  color: var(--theia-list-activeSelectionForeground, inherit);
}
.anan-chat-list-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.anan-chat-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.anan-chat-status-online {
  background: #2ecc71;
}
.anan-chat-status-offline {
  background: #bbb;
}
.anan-chat-sidebar-actions {
  padding: 6px;
  border-top: 1px solid var(--theia-border, #ddd);
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.anan-chat-sidebar-actions .anan-chat-btn {
  flex: 1;
}
/* 消息区 */
.anan-chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.anan-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}
.anan-chat-placeholder {
  color: var(--theia-descriptionForeground, #888);
  text-align: center;
  padding: 20px;
  font-size: 12px;
}
.anan-chat-msg {
  margin-bottom: 8px;
  max-width: 80%;
}
.anan-chat-msg-self {
  margin-left: auto;
  text-align: right;
}
.anan-chat-msg-other {
  margin-right: auto;
}
.anan-chat-msg-bubble {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  word-break: break-word;
  text-align: left;
}
.anan-chat-msg-self .anan-chat-msg-bubble {
  background: #FF6FA8;
  color: #fff;
}
.anan-chat-msg-other .anan-chat-msg-bubble {
  background: var(--theia-list-inactiveSelectionBackground, #e8e8e8);
  color: var(--theia-foreground, #333);
}
.anan-chat-msg-name {
  font-size: 11px;
  color: var(--theia-descriptionForeground, #888);
  margin-bottom: 2px;
}
.anan-chat-msg-time {
  font-size: 10px;
  color: var(--theia-descriptionForeground, #aaa);
  margin-top: 2px;
}
/* 上下文消息 */
.anan-chat-msg-context .anan-chat-msg-bubble {
  background: #FFF3E0;
  border: 1px solid #FFB74D;
  color: #E65100;
}
.anan-chat-msg-self.anan-chat-msg-context .anan-chat-msg-bubble {
  background: #FFE0B2;
  border: 1px solid #FF9800;
  color: #BF360C;
}
.anan-chat-msg-context-label {
  font-weight: 600;
  margin-bottom: 4px;
}
.anan-chat-msg-file {
  font-size: 11px;
  font-family: monospace;
  margin-bottom: 4px;
  opacity: 0.8;
}
.anan-chat-msg-code {
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
  background: rgba(0,0,0,0.05);
  padding: 4px;
  border-radius: 4px;
  margin-top: 4px;
}
/* 输入区 */
.anan-chat-input-area {
  display: flex;
  padding: 8px;
  border-top: 1px solid var(--theia-border, #ddd);
  gap: 6px;
  flex-shrink: 0;
}
.anan-chat-input-area textarea {
  flex: 1;
  resize: none;
  border: 1px solid var(--theia-input-border, var(--theia-border, #ddd));
  border-radius: 4px;
  background: var(--theia-input-background, #fff);
  color: var(--theia-input-foreground, #333);
  padding: 6px;
  font-size: 13px;
  font-family: inherit;
  min-height: 36px;
  max-height: 100px;
  outline: none;
}
`;

// ---- 辅助函数 ----

// 格式化时间 HH:MM
function formatTime(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '';
  }
}

// 创建 DOM 元素的辅助函数
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

// ---- Widget 类 ----

/**
 * 安安聊天 Widget
 * 继承 BaseWidget，纯 DOM 构建 UI
 * - 未登录时显示登录/注册表单
 * - 登录后显示聊天界面（好友/群聊列表 + 消息区 + 输入框）
 * - 支持上下文分享（从编辑器获取选中文本/文件内容）
 */
export class AnanChatWidget extends BaseWidget {

  private readonly chatClient: ChatClient;
  private readonly editorManager: EditorManager;
  private readonly workspaceService: WorkspaceService;

  // ---- 状态 ----
  private loginMode: 'login' | 'register' = 'login';
  private friends: FriendInfo[] = [];
  private groups: GroupInfo[] = [];
  private sidebarTab: 'friends' | 'groups' = 'friends';
  private currentConversation: Conversation | null = null;
  private sessionRestored = false;
  // 群成员名称查找表（groupId -> Map<userId, displayName>）
  private groupMemberNames: Map<number, Map<number, string>> = new Map();

  // ---- DOM 引用 ----
  private loginView!: HTMLElement;
  private chatView!: HTMLElement;
  private errorDiv!: HTMLElement;
  private usernameInput!: HTMLInputElement;
  private passwordInput!: HTMLInputElement;
  private displayNameInput!: HTMLInputElement;
  private displayNameWrapper!: HTMLElement;
  private submitBtn!: HTMLButtonElement;
  private loginTabBtn!: HTMLButtonElement;
  private registerTabBtn!: HTMLButtonElement;
  private userDisplay!: HTMLElement;
  private wsStatus!: HTMLElement;
  private sidebarList!: HTMLElement;
  private sidebarActions!: HTMLElement;
  private messagesArea!: HTMLElement;
  private inputTextarea!: HTMLTextAreaElement;
  private friendsTabBtn!: HTMLButtonElement;
  private groupsTabBtn!: HTMLButtonElement;

  constructor(
    chatClient: ChatClient,
    editorManager: EditorManager,
    workspaceService: WorkspaceService,
  ) {
    super();
    this.chatClient = chatClient;
    this.editorManager = editorManager;
    this.workspaceService = workspaceService;
    this.id = 'anan-chat';
    this.title.label = '安安聊天';
    this.title.caption = '安安聊天';
    this.title.iconClass = 'anan-chat-icon';
    this.node.classList.add('anan-chat-widget');
    this.injectCss();
    this.buildUi();
  }

  // ---- 生命周期 ----

  protected override onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.registerListeners();
    if (!this.sessionRestored) {
      this.sessionRestored = true;
      this.tryRestoreSession();
    }
  }

  // ---- CSS 注入 ----

  private injectCss(): void {
    if (document.getElementById('anan-chat-style')) {
      return;
    }
    const style = document.createElement('style');
    style.id = 'anan-chat-style';
    style.textContent = CHAT_CSS;
    document.head.appendChild(style);
  }

  // ---- DOM 构建 ----

  private buildUi(): void {
    this.node.innerHTML = '';
    this.buildLoginView();
    this.buildChatView();
    this.chatView.style.display = 'none';
    this.node.appendChild(this.loginView);
    this.node.appendChild(this.chatView);
  }

  // 构建登录/注册视图
  private buildLoginView(): void {
    this.loginView = h('div', 'anan-chat-login');
    const box = h('div', 'anan-chat-login-box');

    // 标题
    box.appendChild(h('div', 'anan-chat-login-title', '安安聊天 💬'));

    // 登录/注册切换
    const tabs = h('div', 'anan-chat-login-tabs');
    this.loginTabBtn = h('button', 'anan-chat-login-tab active', '登录');
    this.registerTabBtn = h('button', 'anan-chat-login-tab', '注册');
    tabs.appendChild(this.loginTabBtn);
    tabs.appendChild(this.registerTabBtn);
    box.appendChild(tabs);

    // 用户名
    const userField = h('div', 'anan-chat-field');
    this.usernameInput = document.createElement('input');
    this.usernameInput.type = 'text';
    this.usernameInput.placeholder = '用户名';
    userField.appendChild(this.usernameInput);
    box.appendChild(userField);

    // 密码
    const pwdField = h('div', 'anan-chat-field');
    this.passwordInput = document.createElement('input');
    this.passwordInput.type = 'password';
    this.passwordInput.placeholder = '密码';
    pwdField.appendChild(this.passwordInput);
    box.appendChild(pwdField);

    // 显示名称（仅注册时显示）
    this.displayNameWrapper = h('div', 'anan-chat-field');
    this.displayNameWrapper.style.display = 'none';
    this.displayNameInput = document.createElement('input');
    this.displayNameInput.type = 'text';
    this.displayNameInput.placeholder = '显示名称（可选）';
    this.displayNameWrapper.appendChild(this.displayNameInput);
    box.appendChild(this.displayNameWrapper);

    // 提交按钮
    this.submitBtn = h('button', 'anan-chat-btn', '登录');
    this.submitBtn.style.width = '100%';
    box.appendChild(this.submitBtn);

    // 错误提示
    this.errorDiv = h('div', 'anan-chat-error');
    box.appendChild(this.errorDiv);

    this.loginView.appendChild(box);
  }

  // 构建聊天主视图
  private buildChatView(): void {
    this.chatView = h('div', 'anan-chat-main');

    // 顶部栏
    const header = h('div', 'anan-chat-header');
    this.userDisplay = h('div', 'anan-chat-user');
    this.wsStatus = h('div', 'anan-chat-ws-status', '连接中...');
    const shareBtn = h('button', 'anan-chat-btn anan-chat-btn-small', '📦 分享上下文');
    const logoutBtn = h('button', 'anan-chat-btn anan-chat-btn-secondary anan-chat-btn-small', '退出');
    header.appendChild(this.userDisplay);
    header.appendChild(this.wsStatus);
    header.appendChild(shareBtn);
    header.appendChild(logoutBtn);
    this.chatView.appendChild(header);

    // 主体
    const body = h('div', 'anan-chat-body');

    // 侧边栏
    const sidebar = h('div', 'anan-chat-sidebar');
    const sidebarTabs = h('div', 'anan-chat-sidebar-tabs');
    this.friendsTabBtn = h('button', 'anan-chat-sidebar-tab active', '好友');
    this.groupsTabBtn = h('button', 'anan-chat-sidebar-tab', '群聊');
    sidebarTabs.appendChild(this.friendsTabBtn);
    sidebarTabs.appendChild(this.groupsTabBtn);
    sidebar.appendChild(sidebarTabs);

    this.sidebarList = h('div', 'anan-chat-sidebar-list');
    sidebar.appendChild(this.sidebarList);

    this.sidebarActions = h('div', 'anan-chat-sidebar-actions');
    sidebar.appendChild(this.sidebarActions);

    body.appendChild(sidebar);

    // 内容区
    const content = h('div', 'anan-chat-content');
    this.messagesArea = h('div', 'anan-chat-messages');
    content.appendChild(this.messagesArea);

    // 输入区
    const inputArea = h('div', 'anan-chat-input-area');
    this.inputTextarea = document.createElement('textarea');
    this.inputTextarea.placeholder = '输入消息，回车发送...';
    this.inputTextarea.rows = 1;
    const sendBtn = h('button', 'anan-chat-btn', '发送');
    inputArea.appendChild(this.inputTextarea);
    inputArea.appendChild(sendBtn);
    content.appendChild(inputArea);

    body.appendChild(content);
    this.chatView.appendChild(body);

    // 占位提示
    this.renderPlaceholder();

    // 侧边栏操作按钮
    this.renderSidebarActions();

    // 事件绑定
    shareBtn.addEventListener('click', () => this.shareContext());
    logoutBtn.addEventListener('click', () => this.handleLogout());
    sendBtn.addEventListener('click', () => this.handleSend());
    this.friendsTabBtn.addEventListener('click', () => this.switchSidebarTab('friends'));
    this.groupsTabBtn.addEventListener('click', () => this.switchSidebarTab('groups'));
    this.loginTabBtn.addEventListener('click', () => this.switchLoginMode('login'));
    this.registerTabBtn.addEventListener('click', () => this.switchLoginMode('register'));
    this.submitBtn.addEventListener('click', () => this.handleSubmit());
    this.inputTextarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    // 回车提交登录/注册
    const submitOnEnter = (e: KeyboardEvent): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleSubmit();
      }
    };
    this.usernameInput.addEventListener('keydown', submitOnEnter);
    this.passwordInput.addEventListener('keydown', submitOnEnter);
    this.displayNameInput.addEventListener('keydown', submitOnEnter);
  }

  // ---- 事件监听注册 ----

  private registerListeners(): void {
    // ChatClient 事件（使用 toDisposeOnDetach 确保卸载时清理）
    this.toDisposeOnDetach.push(this.chatClient.onConnected(_e => {
      this.wsStatus.textContent = '已连接';
      this.wsStatus.className = 'anan-chat-ws-status connected';
      this.refreshFriends();
      this.refreshGroups();
    }));

    this.toDisposeOnDetach.push(this.chatClient.onDisconnected(() => {
      this.wsStatus.textContent = '断线重连中...';
      this.wsStatus.className = 'anan-chat-ws-status disconnected';
    }));

    this.toDisposeOnDetach.push(this.chatClient.onPrivateMessage(msg => {
      if (this.currentConversation?.type === 'private' && this.currentConversation.targetId === msg.fromUserId) {
        this.appendMessage({
          id: `rt-p-${msg.timestamp}`,
          fromUserId: msg.fromUserId,
          fromUsername: msg.fromUsername,
          content: msg.content,
          timestamp: msg.timestamp,
          isSelf: false,
          isContext: false,
        });
      }
    }));

    this.toDisposeOnDetach.push(this.chatClient.onGroupMessage(msg => {
      if (this.currentConversation?.type === 'group' && this.currentConversation.targetId === msg.groupId) {
        this.appendMessage({
          id: `rt-g-${msg.timestamp}`,
          fromUserId: msg.fromUserId,
          fromUsername: msg.fromUsername,
          content: msg.content,
          timestamp: msg.timestamp,
          isSelf: false,
          isContext: false,
        });
      }
    }));

    this.toDisposeOnDetach.push(this.chatClient.onContextShare(msg => {
      if (this.currentConversation?.type === 'private' && this.currentConversation.targetId === msg.fromUserId) {
        this.appendMessage({
          id: `rt-ctx-${msg.timestamp}`,
          fromUserId: msg.fromUserId,
          fromUsername: msg.fromUsername,
          content: '',
          timestamp: msg.timestamp,
          isSelf: false,
          isContext: true,
          context: msg.context,
        });
      }
    }));

    this.toDisposeOnDetach.push(this.chatClient.onGroupContext(msg => {
      if (this.currentConversation?.type === 'group' && this.currentConversation.targetId === msg.groupId) {
        this.appendMessage({
          id: `rt-gctx-${msg.timestamp}`,
          fromUserId: msg.fromUserId,
          fromUsername: msg.fromUsername,
          content: '',
          timestamp: msg.timestamp,
          isSelf: false,
          isContext: true,
          context: msg.context,
        });
      }
    }));

    this.toDisposeOnDetach.push(this.chatClient.onPresence(p => {
      // 更新好友在线状态
      const friend = this.friends.find(f => f.id === p.userId);
      if (friend) {
        friend.online = p.online;
        if (this.sidebarTab === 'friends') {
          this.renderFriendsList();
        }
      }
    }));

    this.toDisposeOnDetach.push(this.chatClient.onError(err => {
      this.errorDiv.textContent = err;
    }));
  }

  // ---- 会话恢复 ----

  private async tryRestoreSession(): Promise<void> {
    const user = await this.chatClient.restoreSession();
    if (user) {
      this.showChatView();
    }
  }

  // ---- 登录/注册 ----

  private switchLoginMode(mode: 'login' | 'register'): void {
    this.loginMode = mode;
    if (mode === 'login') {
      this.loginTabBtn.classList.add('active');
      this.registerTabBtn.classList.remove('active');
      this.displayNameWrapper.style.display = 'none';
      this.submitBtn.textContent = '登录';
    } else {
      this.loginTabBtn.classList.remove('active');
      this.registerTabBtn.classList.add('active');
      this.displayNameWrapper.style.display = '';
      this.submitBtn.textContent = '注册';
    }
    this.errorDiv.textContent = '';
  }

  private async handleSubmit(): Promise<void> {
    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value;
    if (!username || !password) {
      this.errorDiv.textContent = '用户名和密码不能为空';
      return;
    }
    this.submitBtn.disabled = true;
    this.errorDiv.textContent = '';
    try {
      if (this.loginMode === 'login') {
        const user = await this.chatClient.login(username, password);
        this.userDisplay.textContent = user.displayName;
        this.showChatView();
      } else {
        const displayName = this.displayNameInput.value.trim() || undefined;
        const user = await this.chatClient.register(username, password, displayName);
        this.userDisplay.textContent = user.displayName;
        this.showChatView();
      }
    } catch (err) {
      this.errorDiv.textContent = err instanceof Error ? err.message : String(err);
    } finally {
      this.submitBtn.disabled = false;
    }
  }

  private handleLogout(): void {
    this.chatClient.logout();
    this.friends = [];
    this.groups = [];
    this.currentConversation = null;
    this.groupMemberNames.clear();
    this.loginView.style.display = '';
    this.chatView.style.display = 'none';
    this.usernameInput.value = '';
    this.passwordInput.value = '';
    this.displayNameInput.value = '';
  }

  // ---- 切换到聊天视图 ----

  private showChatView(): void {
    this.loginView.style.display = 'none';
    this.chatView.style.display = '';
    const user = this.chatClient.getUser();
    if (user) {
      this.userDisplay.textContent = user.displayName;
    }
    this.refreshFriends();
    this.refreshGroups();
  }

  // ---- 侧边栏 ----

  private switchSidebarTab(tab: 'friends' | 'groups'): void {
    this.sidebarTab = tab;
    if (tab === 'friends') {
      this.friendsTabBtn.classList.add('active');
      this.groupsTabBtn.classList.remove('active');
    } else {
      this.friendsTabBtn.classList.remove('active');
      this.groupsTabBtn.classList.add('active');
    }
    this.renderSidebarList();
    this.renderSidebarActions();
  }

  private async refreshFriends(): Promise<void> {
    try {
      this.friends = await this.chatClient.getFriends();
      if (this.sidebarTab === 'friends') {
        this.renderFriendsList();
      }
    } catch {
      // 忽略网络错误
    }
  }

  private async refreshGroups(): Promise<void> {
    try {
      this.groups = await this.chatClient.getGroups();
      if (this.sidebarTab === 'groups') {
        this.renderGroupsList();
      }
    } catch {
      // 忽略网络错误
    }
  }

  private renderSidebarList(): void {
    if (this.sidebarTab === 'friends') {
      this.renderFriendsList();
    } else {
      this.renderGroupsList();
    }
  }

  private renderFriendsList(): void {
    this.sidebarList.innerHTML = '';
    if (this.friends.length === 0) {
      this.sidebarList.appendChild(h('div', 'anan-chat-placeholder', '暂无好友'));
      return;
    }
    for (const friend of this.friends) {
      const item = h('div', 'anan-chat-list-item');
      if (this.currentConversation?.type === 'private' && this.currentConversation.targetId === friend.id) {
        item.classList.add('active');
      }
      const dot = h('span', `anan-chat-status-dot ${friend.online ? 'anan-chat-status-online' : 'anan-chat-status-offline'}`);
      const name = h('span', 'anan-chat-list-item-name', friend.displayName);
      item.appendChild(dot);
      item.appendChild(name);
      item.addEventListener('click', () => {
        this.selectPrivateConversation(friend);
      });
      this.sidebarList.appendChild(item);
    }
  }

  private renderGroupsList(): void {
    this.sidebarList.innerHTML = '';
    if (this.groups.length === 0) {
      this.sidebarList.appendChild(h('div', 'anan-chat-placeholder', '暂无群聊'));
      return;
    }
    for (const group of this.groups) {
      const item = h('div', 'anan-chat-list-item');
      if (this.currentConversation?.type === 'group' && this.currentConversation.targetId === group.id) {
        item.classList.add('active');
      }
      const name = h('span', 'anan-chat-list-item-name', group.name);
      item.appendChild(name);
      item.addEventListener('click', () => {
        this.selectGroupConversation(group);
      });
      this.sidebarList.appendChild(item);
    }
  }

  private renderSidebarActions(): void {
    this.sidebarActions.innerHTML = '';
    if (this.sidebarTab === 'friends') {
      const addBtn = h('button', 'anan-chat-btn anan-chat-btn-small', '添加好友');
      addBtn.addEventListener('click', () => this.handleAddFriend());
      this.sidebarActions.appendChild(addBtn);
      if (this.currentConversation?.type === 'private') {
        const delBtn = h('button', 'anan-chat-btn anan-chat-btn-secondary anan-chat-btn-small', '删除好友');
        delBtn.addEventListener('click', () => this.handleRemoveFriend());
        this.sidebarActions.appendChild(delBtn);
      }
    } else {
      const createBtn = h('button', 'anan-chat-btn anan-chat-btn-small', '新建群聊');
      createBtn.addEventListener('click', () => this.handleCreateGroup());
      this.sidebarActions.appendChild(createBtn);
      if (this.currentConversation?.type === 'group') {
        const inviteBtn = h('button', 'anan-chat-btn anan-chat-btn-secondary anan-chat-btn-small', '拉人进群');
        inviteBtn.addEventListener('click', () => this.handleInviteMember());
        this.sidebarActions.appendChild(inviteBtn);
      }
    }
  }

  // ---- 会话选择 ----

  private async selectPrivateConversation(friend: FriendInfo): Promise<void> {
    this.currentConversation = { type: 'private', targetId: friend.id, label: friend.displayName };
    this.renderFriendsList();
    this.renderSidebarActions();
    this.renderPlaceholder('加载中...');
    try {
      const history = await this.chatClient.getPrivateHistory(friend.id);
      this.messagesArea.innerHTML = '';
      const myId = this.chatClient.getUserId();
      for (const msg of history) {
        const isSelf = msg.from_id === myId;
        this.appendMessage({
          id: `hist-${msg.id}`,
          fromUserId: msg.from_id,
          fromUsername: isSelf ? '我' : friend.displayName,
          content: msg.content,
          timestamp: msg.created_at,
          isSelf,
          isContext: msg.msg_type === 'context',
        });
      }
    } catch {
      this.renderPlaceholder('加载历史消息失败');
    }
  }

  private async selectGroupConversation(group: GroupInfo): Promise<void> {
    this.currentConversation = { type: 'group', targetId: group.id, label: group.name };
    this.renderGroupsList();
    this.renderSidebarActions();
    this.renderPlaceholder('加载中...');
    try {
      // 先加载群成员用于名称查找
      const members = await this.chatClient.getGroupMembers(group.id);
      const nameMap = new Map<number, string>();
      for (const m of members) {
        nameMap.set(m.id, m.displayName);
      }
      this.groupMemberNames.set(group.id, nameMap);

      // 加载历史消息
      const history = await this.chatClient.getGroupHistory(group.id);
      this.messagesArea.innerHTML = '';
      const myId = this.chatClient.getUserId();
      for (const msg of history) {
        const isSelf = msg.from_id === myId;
        const fromName = isSelf ? '我' : (nameMap.get(msg.from_id) ?? `用户${msg.from_id}`);
        this.appendMessage({
          id: `hist-${msg.id}`,
          fromUserId: msg.from_id,
          fromUsername: fromName,
          content: msg.content,
          timestamp: msg.created_at,
          isSelf,
          isContext: msg.msg_type === 'context',
        });
      }
    } catch {
      this.renderPlaceholder('加载历史消息失败');
    }
  }

  // ---- 消息渲染 ----

  private renderPlaceholder(text = '选择好友或群聊开始对话'): void {
    this.messagesArea.innerHTML = '';
    this.messagesArea.appendChild(h('div', 'anan-chat-placeholder', text));
  }

  // 追加一条消息到消息区
  private appendMessage(msg: DisplayMessage): void {
    // 移除占位符
    const placeholder = this.messagesArea.querySelector('.anan-chat-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    const wrapper = h('div', `anan-chat-msg ${msg.isSelf ? 'anan-chat-msg-self' : 'anan-chat-msg-other'}`);
    if (msg.isContext) {
      wrapper.classList.add('anan-chat-msg-context');
    }

    // 发送者名称（群聊中非自己消息显示）
    if (!msg.isSelf && msg.fromUsername) {
      wrapper.appendChild(h('div', 'anan-chat-msg-name', msg.fromUsername));
    }

    // 气泡
    const bubble = h('div', 'anan-chat-msg-bubble');
    if (msg.isContext && msg.context) {
      // 上下文消息
      bubble.appendChild(h('div', 'anan-chat-msg-context-label', '📦 上下文'));
      bubble.appendChild(h('div', 'anan-chat-msg-file', msg.context.filePath));
      if (msg.context.language) {
        bubble.appendChild(h('div', 'anan-chat-msg-file', `语言: ${msg.context.language}`));
      }
      const codeBlock = h('pre', 'anan-chat-msg-code');
      codeBlock.textContent = msg.context.content;
      bubble.appendChild(codeBlock);
    } else {
      bubble.textContent = msg.content;
    }
    wrapper.appendChild(bubble);

    // 时间
    wrapper.appendChild(h('div', 'anan-chat-msg-time', formatTime(msg.timestamp)));

    this.messagesArea.appendChild(wrapper);
    // 自动滚动到底部
    this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
  }

  // ---- 发送消息 ----

  private handleSend(): void {
    const content = this.inputTextarea.value.trim();
    if (!content || !this.currentConversation) {
      return;
    }
    const now = new Date().toISOString();
    const myId = this.chatClient.getUserId();
    if (this.currentConversation.type === 'private') {
      this.chatClient.sendPrivateMessage(this.currentConversation.targetId, content);
    } else {
      this.chatClient.sendGroupMessage(this.currentConversation.targetId, content);
    }
    // 本地显示
    this.appendMessage({
      id: `local-${now}`,
      fromUserId: myId ?? 0,
      fromUsername: '我',
      content,
      timestamp: now,
      isSelf: true,
      isContext: false,
    });
    this.inputTextarea.value = '';
  }

  // ---- 上下文分享 ----

  private shareContext(): void {
    if (!this.currentConversation) {
      this.errorDiv.textContent = '请先选择好友或群聊';
      setTimeout(() => { this.errorDiv.textContent = ''; }, 3000);
      return;
    }

    // 获取当前编辑器
    const editorWidget = this.editorManager.currentEditor;
    if (!editorWidget) {
      this.errorDiv.textContent = '没有打开的编辑器';
      setTimeout(() => { this.errorDiv.textContent = ''; }, 3000);
      return;
    }

    const editor = editorWidget.editor;
    const selection = editor.selection;
    // 判断是否有选中文本
    const hasSelection = selection &&
      (selection.start.line !== selection.end.line ||
        selection.start.character !== selection.end.character);

    let content: string;
    let contextType: 'selection' | 'file';
    let startLine: number | undefined;
    let endLine: number | undefined;

    if (hasSelection) {
      content = editor.document.getText(selection);
      contextType = 'selection';
      startLine = selection.start.line + 1; // 转为 1-based
      endLine = selection.end.line + 1;
    } else {
      content = editor.document.getText();
      contextType = 'file';
    }

    // 构建上下文对象
    const filePath = this.resolveFilePath(editor.uri.toString());
    const context: AgentContext = {
      type: contextType,
      filePath,
      language: editor.document.languageId,
      content,
      startLine,
      endLine,
    };

    const now = new Date().toISOString();
    const myId = this.chatClient.getUserId();

    // 通过 WebSocket 发送
    if (this.currentConversation.type === 'private') {
      this.chatClient.sendContextShare(this.currentConversation.targetId, context);
    } else {
      this.chatClient.sendGroupContext(this.currentConversation.targetId, context);
    }

    // 本地显示
    this.appendMessage({
      id: `local-ctx-${now}`,
      fromUserId: myId ?? 0,
      fromUsername: '我',
      content: '',
      timestamp: now,
      isSelf: true,
      isContext: true,
      context,
    });
  }

  // 尝试将 URI 转为相对路径
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

  // ---- 好友/群聊操作 ----

  private async handleAddFriend(): Promise<void> {
    const username = window.prompt('请输入好友用户名');
    if (!username) {
      return;
    }
    try {
      await this.chatClient.addFriend(username.trim());
      await this.refreshFriends();
    } catch (err) {
      this.errorDiv.textContent = err instanceof Error ? err.message : String(err);
      setTimeout(() => { this.errorDiv.textContent = ''; }, 3000);
    }
  }

  private async handleRemoveFriend(): Promise<void> {
    if (this.currentConversation?.type !== 'private') {
      return;
    }
    // 找到当前选中的好友
    const friend = this.friends.find(f => f.id === this.currentConversation?.targetId);
    if (!friend) {
      return;
    }
    if (!window.confirm(`确定删除好友 ${friend.displayName}？`)) {
      return;
    }
    try {
      await this.chatClient.removeFriend(friend.username);
      this.currentConversation = null;
      this.renderPlaceholder();
      await this.refreshFriends();
      this.renderSidebarActions();
    } catch (err) {
      this.errorDiv.textContent = err instanceof Error ? err.message : String(err);
      setTimeout(() => { this.errorDiv.textContent = ''; }, 3000);
    }
  }

  private async handleCreateGroup(): Promise<void> {
    const name = window.prompt('请输入群聊名称');
    if (!name) {
      return;
    }
    const membersStr = window.prompt('请输入成员用户名（逗号分隔，可留空）') ?? '';
    const members = membersStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
    try {
      await this.chatClient.createGroup(name.trim(), members);
      await this.refreshGroups();
    } catch (err) {
      this.errorDiv.textContent = err instanceof Error ? err.message : String(err);
      setTimeout(() => { this.errorDiv.textContent = ''; }, 3000);
    }
  }

  private async handleInviteMember(): Promise<void> {
    if (this.currentConversation?.type !== 'group') {
      return;
    }
    const username = window.prompt('请输入要拉入群聊的用户名');
    if (!username) {
      return;
    }
    try {
      await this.chatClient.addGroupMember(this.currentConversation.targetId, username.trim());
      // 重新加载群成员名称
      const members = await this.chatClient.getGroupMembers(this.currentConversation.targetId);
      const nameMap = new Map<number, string>();
      for (const m of members) {
        nameMap.set(m.id, m.displayName);
      }
      this.groupMemberNames.set(this.currentConversation.targetId, nameMap);
    } catch (err) {
      this.errorDiv.textContent = err instanceof Error ? err.message : String(err);
      setTimeout(() => { this.errorDiv.textContent = ''; }, 3000);
    }
  }
}
