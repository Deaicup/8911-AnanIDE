// anan-core 入口
// 安安人格中枢：知识图谱、多 MCP 编排、状态联动、防呆核心
import { ContainerModule } from '@theia/core/shared/inversify';

export default new ContainerModule((_bind) => {
  // MVP 阶段任务：
  // 1. 初始化 SQLite 数据库（~/.anan/data.db）
  // 2. 实现事件记录接口（文件编辑/命令/MCP 调用）
  // 3. 防呆 Safety 模块对外暴露
  // 迭代阶段：编排引擎、状态联动、NL→MCP
});
