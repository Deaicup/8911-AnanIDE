# 8911 安安黏糊开发机

二次元风格独立 AI 开发软件，基于 Eclipse Theia 二次开发，内置可视化代码编辑器与原生 MCP 协议终端。

## 技术栈

- **IDE 基底**：Eclipse Theia (MIT)
- **主语言**：TypeScript
- **动画**：PixiJS (MVP) → Inochi2D WASM (迭代)
- **存储**：SQLite
- **打包**：Electron

## 项目结构

```
anan-ide/
├── packages/
│   ├── electron/        # Electron 壳
│   ├── theia-app/       # Theia 应用配置
│   ├── anan-ui/         # 二次元 UI 扩展
│   ├── anan-mcp/        # MCP 终端扩展
│   ├── anan-core/       # 安安人格中枢
│   └── anan-shared/     # 公共类型工具
├── assets/              # 安安素材
├── tests/               # 测试
└── docs/                # 文档
```

## 开发

```bash
npm install          # 安装依赖
npm run build        # 构建
npm run dev          # 开发模式
npm test             # 运行测试
```

## 团队

- **头盖骨**：主开发
- **feiyu**：测试

## 协议

MIT
