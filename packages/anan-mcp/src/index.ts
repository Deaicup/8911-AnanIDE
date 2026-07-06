// anan-mcp 扩展入口
// MCP 终端：自动发现、协议网关、高危确认
import { ContainerModule } from '@theia/core/shared/inversify';

export default new ContainerModule(bind => {
  // MVP 阶段任务：
  // 1. 实现 MCP 服务自动发现（扫描 ~/.workbuddy/mcp.json 等）
  // 2. 终端提示符替换为「安安✨ ~」
  // 3. 危险命令拦截 + 安安弹窗确认
  // 4. MVP 用命令模板，迭代阶段接 Ollama
});
