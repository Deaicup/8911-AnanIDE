// anan-chat 类型定义
// 对应 anan-server 的 REST API 和 WebSocket 消息格式

// ---- REST API 响应类型 ----

// 用户信息（_safe 格式，camelCase）
export interface UserInfo {
  id: number;
  username: string;
  displayName: string;
  createdAt: string;
}

// 好友信息（含在线状态）
export interface FriendInfo extends UserInfo {
  online: boolean;
}

// 群聊信息（数据库原始行，snake_case）
export interface GroupInfo {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
}

// 群成员信息
export interface GroupMemberInfo extends UserInfo {
  online: boolean;
}

// 消息记录（数据库原始行，snake_case）
export interface MessageRecord {
  id: number;
  kind: string; // 'private' | 'group'
  from_id: number;
  to_id: number | null;
  group_id: number | null;
  content: string;
  msg_type: string; // 'text' | 'context'
  created_at: string;
}

// ---- Agent 上下文 ----

// Agent 上下文对象，通过 WebSocket 中转传输
export interface AgentContext {
  type: 'selection' | 'file';
  filePath: string;
  language: string;
  content: string;
  startLine?: number;
  endLine?: number;
}

// ---- WebSocket 事件类型 ----

// 私聊消息事件（来自 WebSocket）
export interface PrivateMessageEvent {
  fromUserId: number;
  fromUsername: string;
  content: string;
  timestamp: string;
}

// 群聊消息事件
export interface GroupMessageEvent {
  groupId: number;
  fromUserId: number;
  fromUsername: string;
  content: string;
  timestamp: string;
}

// 上下文分享事件
export interface ContextShareEvent {
  fromUserId: number;
  fromUsername: string;
  context: AgentContext;
  timestamp: string;
}

// 群上下文分享事件
export interface GroupContextEvent {
  groupId: number;
  fromUserId: number;
  fromUsername: string;
  context: AgentContext;
  timestamp: string;
}

// 在线状态事件
export interface PresenceEvent {
  userId: number;
  online: boolean;
}

// 连接成功事件
export interface ConnectedEvent {
  userId: number;
  username: string;
}

// ---- 会话类型 ----

// 当前选中的会话
export interface Conversation {
  type: 'private' | 'group';
  // 私聊时为对方用户 ID，群聊时为群 ID
  targetId: number;
  // 显示名称
  label: string;
}

// ---- UI 消息类型 ----

// 用于 UI 渲染的消息
export interface DisplayMessage {
  id: string;
  fromUserId: number;
  fromUsername: string;
  content: string;
  timestamp: string;
  // 是否为自己发送的消息
  isSelf: boolean;
  // 是否为上下文分享消息
  isContext: boolean;
  // 上下文对象（isContext 为 true 时有值）
  context?: AgentContext;
}
