// anan-chat 客户端：REST API + WebSocket 通信
// 负责与服务器的所有网络交互，包括认证、好友/群聊管理、消息收发、上下文传输
import { injectable } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core/lib/common';
import type {
  UserInfo, FriendInfo, GroupInfo, GroupMemberInfo, MessageRecord, AgentContext,
  PrivateMessageEvent, GroupMessageEvent, ContextShareEvent, GroupContextEvent,
  PresenceEvent, ConnectedEvent,
} from './chat-types';

// 服务器地址
const SERVER_BASE = 'http://127.0.0.1:3001';
const WS_BASE = 'ws://127.0.0.1:3001';
const TOKEN_KEY = 'anan-chat-token';

// WebSocket 重连参数
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

/**
 * 聊天客户端：单例服务
 * - 管理 token 和当前用户
 * - 提供 REST API 调用
 * - 维护 WebSocket 连接（含断线重连）
 * - 通过 Event 暴露实时消息
 */
@injectable()
export class ChatClient {

  // ---- 状态 ----
  private token: string | null = null;
  private currentUser: UserInfo | null = null;
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = INITIAL_RECONNECT_DELAY;
  private intentionallyClosed = false;

  // ---- 事件发射器 ----
  private readonly onConnectedEmitter = new Emitter<ConnectedEvent>();
  readonly onConnected: Event<ConnectedEvent> = this.onConnectedEmitter.event;

  private readonly onPrivateMessageEmitter = new Emitter<PrivateMessageEvent>();
  readonly onPrivateMessage: Event<PrivateMessageEvent> = this.onPrivateMessageEmitter.event;

  private readonly onGroupMessageEmitter = new Emitter<GroupMessageEvent>();
  readonly onGroupMessage: Event<GroupMessageEvent> = this.onGroupMessageEmitter.event;

  private readonly onContextShareEmitter = new Emitter<ContextShareEvent>();
  readonly onContextShare: Event<ContextShareEvent> = this.onContextShareEmitter.event;

  private readonly onGroupContextEmitter = new Emitter<GroupContextEvent>();
  readonly onGroupContext: Event<GroupContextEvent> = this.onGroupContextEmitter.event;

  private readonly onPresenceEmitter = new Emitter<PresenceEvent>();
  readonly onPresence: Event<PresenceEvent> = this.onPresenceEmitter.event;

  private readonly onErrorEmitter = new Emitter<string>();
  readonly onError: Event<string> = this.onErrorEmitter.event;

  private readonly onDisconnectedEmitter = new Emitter<void>();
  readonly onDisconnected: Event<void> = this.onDisconnectedEmitter.event;

  // ---- 登录状态 ----

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  getUser(): UserInfo | null {
    return this.currentUser;
  }

  getUserId(): number | null {
    return this.currentUser?.id ?? null;
  }

  // ---- Token 管理 ----

  private loadToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private saveToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // localStorage 不可用时忽略
    }
  }

  private clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // 忽略
    }
  }

  // ---- REST API ----

  private async apiCall<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const res = await fetch(`${SERVER_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      let detail = `${res.status} ${res.statusText}`;
      try {
        const err = await res.json();
        if (err.detail) {
          detail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
        }
      } catch {
        // 响应非 JSON，使用默认错误信息
      }
      throw new Error(detail);
    }
    return res.json() as Promise<T>;
  }

  // 注册
  async register(username: string, password: string, displayName?: string): Promise<UserInfo> {
    const data = await this.apiCall<{ token: string; user: UserInfo }>('POST', '/api/register', {
      username,
      password,
      displayName,
    });
    this.token = data.token;
    this.currentUser = data.user;
    this.saveToken(data.token);
    this.connectWs();
    return data.user;
  }

  // 登录
  async login(username: string, password: string): Promise<UserInfo> {
    const data = await this.apiCall<{ token: string; user: UserInfo }>('POST', '/api/login', {
      username,
      password,
    });
    this.token = data.token;
    this.currentUser = data.user;
    this.saveToken(data.token);
    this.connectWs();
    return data.user;
  }

  // 从 localStorage 恢复会话
  async restoreSession(): Promise<UserInfo | null> {
    const saved = this.loadToken();
    if (!saved) {
      return null;
    }
    this.token = saved;
    try {
      const data = await this.apiCall<{ user: UserInfo }>('GET', '/api/profile');
      this.currentUser = data.user;
      this.connectWs();
      return data.user;
    } catch {
      // token 失效
      this.token = null;
      this.currentUser = null;
      this.clearToken();
      return null;
    }
  }

  // 退出登录
  logout(): void {
    this.disconnectWs();
    this.token = null;
    this.currentUser = null;
    this.clearToken();
  }

  // ---- 好友 API ----

  async getFriends(): Promise<FriendInfo[]> {
    const data = await this.apiCall<{ friends: FriendInfo[] }>('GET', '/api/friends');
    return data.friends;
  }

  async addFriend(username: string): Promise<FriendInfo> {
    const data = await this.apiCall<{ friend: FriendInfo }>('POST', '/api/friends', { username });
    return data.friend;
  }

  async removeFriend(username: string): Promise<void> {
    await this.apiCall('DELETE', `/api/friends/${encodeURIComponent(username)}`);
  }

  // ---- 群聊 API ----

  async getGroups(): Promise<GroupInfo[]> {
    const data = await this.apiCall<{ groups: GroupInfo[] }>('GET', '/api/groups');
    return data.groups;
  }

  async createGroup(name: string, members: string[]): Promise<{ groupId: number; name: string }> {
    return this.apiCall('POST', '/api/groups', { name, members });
  }

  async addGroupMember(groupId: number, username: string): Promise<void> {
    await this.apiCall('POST', `/api/groups/${groupId}/members`, { username });
  }

  async getGroupMembers(groupId: number): Promise<GroupMemberInfo[]> {
    const data = await this.apiCall<{ members: GroupMemberInfo[] }>('GET', `/api/groups/${groupId}/members`);
    return data.members;
  }

  // ---- 消息历史 ----

  async getPrivateHistory(peerId: number): Promise<MessageRecord[]> {
    const data = await this.apiCall<{ history: MessageRecord[] }>('GET', `/api/messages/private/${peerId}`);
    return data.history;
  }

  async getGroupHistory(groupId: number): Promise<MessageRecord[]> {
    const data = await this.apiCall<{ history: MessageRecord[] }>('GET', `/api/messages/group/${groupId}`);
    return data.history;
  }

  // ---- WebSocket ----

  // 连接 WebSocket
  connectWs(): void {
    if (!this.token) {
      return;
    }
    // 防止重复连接
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.intentionallyClosed = false;
    const url = `${WS_BASE}/ws?token=${encodeURIComponent(this.token)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      // 连接已建立，等待服务器发送 connected 消息
    };

    this.ws.onmessage = (event: MessageEvent) => {
      this.handleWsMessage(event.data);
    };

    this.ws.onclose = () => {
      this.onDisconnectedEmitter.fire(undefined);
      if (!this.intentionallyClosed && this.token) {
        // 断线重连（指数退避）
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // 错误处理在 onclose 中触发重连
    };
  }

  // 断开 WebSocket
  disconnectWs(): void {
    this.intentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  // 指数退避重连
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWs();
    }, delay);
  }

  // 解析 WebSocket 消息
  private handleWsMessage(raw: unknown): void {
    let data: any;
    try {
      data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return;
    }
    if (!data || typeof data !== 'object') {
      return;
    }

    switch (data.type) {
      case 'connected': {
        // 服务器可能发送 user_id 或 userId
        const userId = data.userId ?? data.user_id;
        const username = data.username;
        // 重置重连延迟
        this.reconnectDelay = INITIAL_RECONNECT_DELAY;
        this.onConnectedEmitter.fire({ userId, username });
        break;
      }
      case 'private-message': {
        this.onPrivateMessageEmitter.fire({
          fromUserId: data.fromUserId,
          fromUsername: data.fromUsername,
          content: data.content,
          timestamp: data.timestamp,
        });
        break;
      }
      case 'group-message': {
        this.onGroupMessageEmitter.fire({
          groupId: data.groupId,
          fromUserId: data.fromUserId,
          fromUsername: data.fromUsername,
          content: data.content,
          timestamp: data.timestamp,
        });
        break;
      }
      case 'context-share': {
        this.onContextShareEmitter.fire({
          fromUserId: data.fromUserId,
          fromUsername: data.fromUsername,
          context: data.context as AgentContext,
          timestamp: data.timestamp,
        });
        break;
      }
      case 'group-context': {
        this.onGroupContextEmitter.fire({
          groupId: data.groupId,
          fromUserId: data.fromUserId,
          fromUsername: data.fromUsername,
          context: data.context as AgentContext,
          timestamp: data.timestamp,
        });
        break;
      }
      case 'presence': {
        // 服务器可能发送 user_id 或 userId
        const userId = data.userId ?? data.user_id;
        this.onPresenceEmitter.fire({ userId, online: data.online });
        break;
      }
      case 'error': {
        this.onErrorEmitter.fire(data.message ?? '未知错误');
        break;
      }
      default:
        // 忽略未知消息类型
        break;
    }
  }

  // ---- WebSocket 发送 ----

  private sendWs(msg: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  // 发送私聊消息
  sendPrivateMessage(toUserId: number, content: string): void {
    this.sendWs({ type: 'private-message', toUserId, content });
  }

  // 发送群聊消息
  sendGroupMessage(groupId: number, content: string): void {
    this.sendWs({ type: 'group-message', groupId, content });
  }

  // 发送上下文分享（私聊）
  sendContextShare(toUserId: number, context: AgentContext): void {
    this.sendWs({ type: 'context-share', toUserId, context });
  }

  // 发送上下文分享（群聊）
  sendGroupContext(groupId: number, context: AgentContext): void {
    this.sendWs({ type: 'group-context', groupId, context });
  }
}
