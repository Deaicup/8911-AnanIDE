# Trae AI 接手说明

## 项目概况

- 项目名：8911 AnanIDE
- 性质：基于 Eclipse Theia 二次开发的二次元风格 AI IDE 原型
- 主语言：TypeScript
- 协议：MIT

## 当前状态

项目已经从初始骨架推进到可构建、可测试、可继续接手的 POC 状态。

已补齐：

1. monorepo 工作区、lockfile、TypeScript strict 构建、ESLint、Jest。
2. Theia 主题注册、前端模块入口、主题 smoke 验收。
3. Electron 主进程安全配置、单实例锁、`ANAN_THEIA_URL` 可配置加载地址。
4. MCP 自动发现、命令模板解析、HTTP JSON-RPC 工具调用服务。
5. 高危命令分级、确认决策、文件保护、可恢复删除。
6. MemoryStore 事件表、EventRecorder 注入式记录入口。
7. 安安 UI overlay、PixiJS 占位头像、诊断状态到表情映射。
8. autosave 快照保存、列表、恢复和清理。
9. electron-builder Windows 打包配置。
10. smoke 脚本、E2E 静态检查和防呆测试文档。

## 常用命令

```bash
npm install
npm run lint
npm run test:unit
npm run build
npm run smoke:electron-config
npm run check
```

启动 Theia：

```bash
npm run dev:theia
```

启动 Electron：

```bash
npm run dev:electron
```

打包：

```bash
npm run package:dir
npm run package:win
```

## 继续开发建议

1. 把 MCP stdio 服务器接入真实进程桥，而不是只提示未连接。
2. 把 Theia marker/diagnostics 服务真正接到 `anan-ui.update-diagnostics`。
3. 把正式角色素材替换 `assets/anan/expressions/*.svg` 占位图。
4. Electron 打包版要决定是否内置 Theia backend，还是保持外部 Theia URL 模式。
5. 安全确认 UI 需要做成真正弹窗，当前核心决策函数已经可用。

## 防呆约定

- 所有命令执行前走危险命令检查。
- 删除文件默认移动到 `.anan-trash`，不要直接永久删除。
- 自动保存写入 `~/.anan/autosave` 或测试传入的临时目录。
- 配置、数据库、autosave 都要有损坏或缺失时的恢复路径。
