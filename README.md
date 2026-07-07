# 8911 AnanIDE

8911 安安黏糊开发机是基于 Eclipse Theia 和 Electron 的 AI IDE 原型。当前版本已经补齐 monorepo 构建、Theia 主题、Electron 加载、安全检查、MCP 发现与调用、安安 UI overlay、autosave 快照和基础测试。

## 技术栈

- IDE 底座：Eclipse Theia
- 桌面壳：Electron
- 语言：TypeScript
- UI 动画：PixiJS
- 数据：SQLite `better-sqlite3`
- 打包：electron-builder

## 常用命令

```bash
npm install
npm run lint
npm run test:unit
npm run build
npm run smoke:electron-config
```

Windows PowerShell 如果拦截 `npm.ps1`，把 `npm` 换成 `npm.cmd`。

## 启动

```bash
npm run dev:theia
```

浏览器访问：

```text
http://localhost:3000
```

Electron 壳需要 Theia 已经启动：

```bash
npm run dev:electron
```

如果 Theia 端口不是 3000：

```powershell
$env:ANAN_THEIA_URL='http://localhost:3001'
npm run dev:electron
```

## 打包

```bash
npm run package:dir
npm run package:win
```

打包产物在 `release/`。首次打包前建议先跑 `npm run check`。

## 文档

- 新手启动说明：`docs/DEVELOPMENT.md`
- GitHub 上传说明：`docs/GITHUB_UPLOAD.md`
- 接手说明：`docs/TRAE-接手说明.md`
- 防呆测试清单：`tests/foolproof/README.md`

## 协议

MIT
