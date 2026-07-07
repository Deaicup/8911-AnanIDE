// anan-agent 前端 LLM 客户端
// 通过 fetch 调用后端 /agent/chat，解析 SSE 流式响应，逐块回调
import type { AgentMessage } from '../common/agent-protocol';

/**
 * 流式聊天选项
 */
export interface StreamChatOptions {
  model: string;
  messages: AgentMessage[];
  apiKey: string;
  baseUrl: string;
  /** 每收到一段文本时回调 */
  onChunk: (chunk: string) => void;
  /** 可选的取消信号 */
  signal?: AbortSignal;
}

/**
 * 调用后端代理进行流式对话
 * 后端返回 text/event-stream，每行 data: {...}，content 在 choices[0].delta.content
 */
export async function streamChat(opts: StreamChatOptions): Promise<void> {
  const response = await fetch('/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl,
    }),
    signal: opts.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`LLM 请求失败 (${response.status}): ${text || response.statusText}`);
  }

  const body = response.body;
  if (!body || !body.getReader) {
    throw new Error('当前环境不支持流式读取响应');
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    // 按行拆分，保留最后未完成的行
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) {
        continue;
      }
      const data = line.slice(5).trim();
      if (data === '[DONE]') {
        return;
      }
      if (!data) {
        continue;
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json: any = JSON.parse(data);
        const content: unknown = json?.choices?.[0]?.delta?.content;
        if (typeof content === 'string' && content.length > 0) {
          opts.onChunk(content);
        }
      } catch {
        // 忽略无法解析的行（如注释或心跳）
      }
    }
  }
}
