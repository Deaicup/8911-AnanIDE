// anan-agent 共享协议：前端与后端代理之间的数据契约

/**
 * 单条聊天消息（OpenAI 兼容格式）
 */
export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 前端发给后端 /agent/chat 的请求体
 */
export interface AgentChatRequest {
  /** 模型 ID，如 claude-3-5-sonnet-20241022 */
  model: string;
  /** 对话消息列表 */
  messages: AgentMessage[];
  /** 用户 API Key */
  apiKey: string;
  /** LLM 服务基址，如 https://api.openai.com */
  baseUrl: string;
}

/**
 * 可选模型列表（模仿 Trae 的模型选择器）
 */
export interface AgentModelOption {
  /** 显示名称 */
  label: string;
  /** 模型 ID */
  value: string;
}

export const AGENT_MODELS: AgentModelOption[] = [
  { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
  { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4o mini', value: 'gpt-4o-mini' },
  { label: 'DeepSeek V3', value: 'deepseek-chat' },
  { label: 'DeepSeek R1', value: 'deepseek-reasoner' },
  { label: 'Qwen2.5 Coder', value: 'qwen2.5-coder-32b-instruct' },
  { label: '本地 Ollama', value: 'ollama' },
];

/** 默认选中模型 */
export const DEFAULT_AGENT_MODEL = 'claude-3-5-sonnet-20241022';

/** 默认 LLM 服务基址 */
export const DEFAULT_BASE_URL = 'https://api.openai.com';

/** localStorage 键名 */
export const AGENT_STORAGE_KEYS = {
  apiKey: 'anan-agent-apikey',
  baseUrl: 'anan-agent-baseurl',
  model: 'anan-agent-model',
} as const;
