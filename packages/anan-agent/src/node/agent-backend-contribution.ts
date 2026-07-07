// anan-agent 后端代理：转发前端请求到 OpenAI 兼容 LLM API，规避浏览器 CORS
// 使用 Node 内置 http/https 模块，不引入额外依赖；LLM 的 SSE 响应直接 pipe 回前端
import { injectable } from '@theia/core/shared/inversify';
import { Application, json } from '@theia/core/shared/express';
import * as http from 'http';
import * as https from 'https';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import type { AgentChatRequest } from '../common/agent-protocol';

/**
 * Agent 后端贡献
 * 在 Express 应用上注册 POST /agent/chat 路由，将请求转发到 LLM 服务并流式回传
 */
@injectable()
export class AgentBackendContribution implements BackendApplicationContribution {

  configure(app: Application): void {
    // 路由级 JSON 解析，不影响其他路由
    app.post('/agent/chat', json(), (req, res) => {
      const body = req.body as AgentChatRequest;
      if (!body || !body.model || !body.messages) {
        res.status(400).json({ error: '缺少必要参数 model/messages' });
        return;
      }

      const baseUrl = (body.baseUrl || '').replace(/\/+$/, '');
      if (!baseUrl) {
        res.status(400).json({ error: '缺少 baseUrl' });
        return;
      }

      // 拼接 OpenAI 兼容的 chat completions 端点
      const targetUrl = `${baseUrl}/v1/chat/completions`;
      let parsed: URL;
      try {
        parsed = new URL(targetUrl);
      } catch {
        res.status(400).json({ error: `无效的 baseUrl: ${baseUrl}` });
        return;
      }

      const isHttps = parsed.protocol === 'https:';
      const lib = isHttps ? https : http;
      const requestBody = JSON.stringify({
        model: body.model,
        messages: body.messages,
        stream: true,
      });

      const proxyReq = lib.request(
        {
          hostname: parsed.hostname,
          port: parsed.port || (isHttps ? 443 : 80),
          path: parsed.pathname + parsed.search,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${body.apiKey || ''}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody),
          },
        },
        proxyRes => {
          // 以 SSE 形式回传前端，直接 pipe LLM 响应
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.writeHead(proxyRes.statusCode ?? 200);
          proxyRes.pipe(res);
        },
      );

      proxyReq.on('error', err => {
        if (!res.headersSent) {
          res.status(502).json({ error: `LLM 请求失败: ${err.message}` });
        } else {
          res.end();
        }
      });

      proxyReq.write(requestBody);
      proxyReq.end();
    });
  }
}
