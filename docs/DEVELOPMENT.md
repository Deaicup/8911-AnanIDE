# 开发启动说明

这份说明给零基础接手者使用。先按顺序跑，不要跳步。

## 1. 准备环境

- 推荐 Node.js 18 或 20。
- Windows PowerShell 如果提示不能运行 `npm.ps1`，把命令里的 `npm` 换成 `npm.cmd`。

## 2. 安装依赖

```bash
npm install
```

如果 Electron 或 SQLite 原生模块没有装好，再执行：

```bash
npm run rebuild:native
```

## 3. 健康检查

```bash
npm run lint
npm run test:unit
npm run build
npm run smoke:electron-config
```

也可以一键跑：

```bash
npm run check
```

## 4. 启动 Theia

```bash
npm run dev:theia
```

打开：

```text
http://localhost:3000
```

## 5. 启动 Electron

先保证 Theia 已经在 `http://localhost:3000` 运行，再开一个终端执行：

```bash
npm run dev:electron
```

Theia 如果用了别的端口：

```powershell
$env:ANAN_THEIA_URL='http://localhost:3001'
npm run dev:electron
```

## 6. 打包 Windows 桌面版

```bash
npm run package:dir
npm run package:win
```

产物会在 `release/`。如果打包失败，先确认 `npm run build` 已通过。

## 已完成能力

- npm workspaces + lerna 构建链路。
- ESLint、Jest、Playwright 静态 E2E 和 smoke 脚本。
- Theia 三套主题注册和启动验收。
- Electron 安全窗口配置、单实例锁、可配置 Theia URL。
- MCP 配置发现、命令模板解析、HTTP JSON-RPC 调用服务。
- 高危命令确认、文件操作保护、删除移入 `.anan-trash`。
- SQLite 事件记录模型和可注入事件记录器。
- 安安 overlay、PixiJS 占位头像、诊断状态表情映射。
- autosave 快照保存、查询、恢复和清理。
- electron-builder Windows 打包配置。

## 常见问题

### npm 命令被 PowerShell 拦截

用 `npm.cmd` 替代 `npm`：

```bash
npm.cmd run test:unit
```

### Theia 构建在受限沙箱里报 Access is denied

这通常不是源码错误，而是构建器向上扫描目录时被沙箱拦截。换到普通终端运行，或允许该构建命令访问目录。

### MemoryStore 数据库测试被跳过

说明 `better-sqlite3` 原生模块还没构建好。运行：

```bash
npm run rebuild:native
```
