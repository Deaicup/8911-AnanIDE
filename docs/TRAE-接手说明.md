# Trae AI 接手说明

> 本文档供 Trae AI 阅读，说明项目现状、下一步任务、技术约定。
> 头盖骨已初始化项目骨架，后续开发交给 Trae。

---

## 项目概况

**项目名**：8911 安安黏糊开发机
**位置**：`D:\Code\anan-ide`
**性质**：基于 Eclipse Theia 二次开发的二次元 AI 开发软件
**主语言**：TypeScript（全栈）+ SQL（数据库查询）
**协议**：MIT

完整策划案见：`docs/8911-安安黏糊开发机-完整策划案V3.0.md`

---

## 项目骨架（POC 初始，第 1-2 周）

项目骨架已初始化完成，包含以下内容：

### 已创建的目录结构

```
anan-ide/
├── package.json              # monorepo 根配置（npm workspaces + lerna）
├── lerna.json                # lerna 配置
├── tsconfig.json             # TypeScript 全局配置
├── .gitignore
├── README.md
├── .github/workflows/ci.yml  # CI/CD 流水线
├── packages/
│   ├── electron/             # Electron 壳（main.ts 已写，含单实例锁定防呆）
│   ├── theia-app/            # Theia 应用（已注册 3 套安安主题：粉/蓝/暗夜）
│   ├── anan-ui/              # UI 扩展（入口+表情枚举已写）
│   ├── anan-mcp/             # MCP 终端（自动发现+危险命令检测已写）
│   ├── anan-core/            # 人格中枢（Safety 模块+SQLite 存储已写）
│   └── anan-shared/          # 公共类型（配置/MCP类型/Logger 已写）
├── assets/                   # 安安素材目录（待填充）
└── tests/
    ├── unit/                 # 单元测试（Jest 配置已就绪）
    ├── e2e/                  # E2E 测试（Playwright 配置已就绪）
    └── foolproof/            # 防呆测试用例（feiyu 维护）
```

### 已实现的核心代码

1. **Electron 主进程**（`packages/electron/src/main.ts`）
   - 窗口创建、单实例锁定（防呆）
   - 预加载脚本桥接

2. **安安主题**（`packages/theia-app/src/browser/style/anan-themes.ts`）
   - 3 套配色：粉系、蓝系、暗夜
   - 通过 Theia ColorRegistry 注册

3. **MCP 服务发现**（`packages/anan-mcp/src/discovery/discover.ts`）
   - 扫描 `~/.workbuddy/mcp.json`
   - 扫描 `~/.config/mcp/servers.json`
   - 解析环境变量 `MCP_SERVERS`

4. **危险命令检测**（`packages/anan-mcp/src/confirm/danger-check.ts`）
   - P0/P1/P2 三级危险命令黑名单
   - 正则匹配 `rm -rf /`、`mkfs`、`dd`、`format`、fork 炸弹等

5. **防呆 Safety 模块**（`packages/anan-core/src/safety/safety.ts`）
   - 输入校验（长度/路径遍历防护）
   - 命令检测（调用 danger-check）
   - 文件操作保护（大文件拦截/二进制拦截/删除确认）
   - 资源限制检查（内存/磁盘/文件大小）

6. **知识图谱存储**（`packages/anan-core/src/memory/store.ts`）
   - SQLite 初始化（`~/.anan/data.db`）
   - 事件记录（文件编辑/命令/MCP 调用）
   - 按项目/时间/类型查询

7. **公共类型**（`packages/anan-shared/src/`）
   - `AnanConfig` 配置类型 + 默认值
   - `McpTool`/`CommandTemplate` MCP 类型
   - `Logger` 统一日志工具

---

## 当前状态（MVP 开发中）

项目已从 POC 进入 MVP 阶段，IDE 可完整运行，包含主题/宠物/聊天/Agent/MCP 终端等核心功能。

### 运行方式

```bash
# 1. 启动 Python 中转站（聊天 + 上下文传输）
cd packages/anan-server && pip install -r requirements.txt && python app.py
# 监听 http://127.0.0.1:3001

# 2. 启动 Theia 后端
cd packages/theia-app && npx theia start
# 监听 http://127.0.0.1:3000

# 3. 启动 Electron 桌面应用
cd packages/electron && npx tsc && npx electron .
# 窗口加载 Theia，显示安安 IDE
```

> 环境注意：Node 24 + 无 VS C++ build tools 时，drivelist 原生模块无法编译，已用 stub 替代（`node_modules/drivelist/js/index.js`）；electron 二进制需从 npmmirror 镜像下载。

---

## 开发日志

### 第一轮 POC 收尾（2026-07-06）— commit `b0be2c4` `c839737`

| 任务 | 状态 | 说明 |
|------|------|------|
| 依赖安装与构建 | ✅ | better-sqlite3 升级 12.x 适配 Node 24；各包补齐 tsconfig；Theia build（esbuild）通过 |
| Theia 主题适配 | ✅ | Theia 实际安装 1.73.1（非声明的 1.49），颜色 API 变更，anan-themes 重写适配（ColorRegistry.register + ThemeService.register） |
| Electron 打通 Theia | ✅ | main.ts 改为 loadURL 加载 Theia dev 服务 |
| 单元测试 | ✅ | 5 套件 / 79 用例全绿：danger-check / Safety / MemoryStore / MCP 发现 / 共享类型 |
| Lint + Format | ✅ | 新增 .eslintrc.js + .prettierrc.json |
| Git 提交 | ✅ | commit `b0be2c4` + `c839737`，已 push |

**修复的缺陷**：safety.ts 跨包 import 路径深度错误；MCP_SERVERS 环境变量解析补全；jest.config.js 改 CommonJS；Theia 1.73 颜色 API 适配。

### 第二轮：二次元 UI + 聊天系统（2026-07-07）— commit `8fd0cdd` `3a4058f`

| 功能 | 说明 |
|------|------|
| 安安桌面宠物 | 原创 SVG 萌系角色（粉双马尾/大眼/腮红/微笑/呆毛），idle 呼吸晃动动画，可拖动，点击切换表情，悬停气泡 |
| 变色动效 | 全局颜色 0.6s 过渡 + 主题切换时屏幕中心波纹扩散 |
| 主题扩展 | 颜色定义从 5 个扩展到 25 个，粉系覆盖编辑器/活动栏/侧边栏/状态栏/按钮/焦点等；onStart 自动切换安安粉系 |
| Python 中转服务器 | FastAPI + WebSocket + SQLite，监听 127.0.0.1:3001；用户系统（scrypt 哈希 + token 会话）；好友双向关系；群聊；消息历史；WebSocket 实时转发 + Agent 上下文传输；pytest 15 用例全绿 |
| anan-chat 聊天扩展 | Theia Widget 右侧面板；登录/注册 UI；好友/群聊列表 + 添加删除 + 新建群拉人；消息收发（历史+实时）；📦 Agent 上下文分享按钮；WebSocket 断线重连 |
| 接口文档 | packages/anan-server/API.md（10 章节：基础信息/认证/REST 13 端点/WebSocket 协议/数据模型/错误码/示例/上下文传输/测试/部署） |
| File 菜单补齐 | anan-ui MenuContribution 注册 Theia 内置 WorkspaceCommands 到 File 菜单 |

**新增包**：`packages/anan-server/`（Python）、`packages/anan-chat/`（Theia 扩展）。

### 第三轮：MCP 终端功能（2026-07-07）— commit `f284bd9`

| 功能 | 说明 |
|------|------|
| 安安提示符 | 终端创建时自动设置 PS1 为「安安✨ ~」（紫色） |
| 高危命令拦截 | 检测 P0/P1/P2 危险命令 → Ctrl+C 取消 + 3 秒倒计时确认弹窗 |
| 命令模板 | `anan scan/test/lint` → MCP 工具调用，结果写回终端 |
| MCP 网关 | 服务发现缓存 60 秒；命令模板映射；有服务打印调用信息，无服务返回模拟结果 |

**anan-mcp 扩展现已加载**（theiaExtensions 声明 + Theia bundle 引入）。

### 第四轮：Trae 风格 Agent 窗口（2026-07-07~08）— commit `fb95ef0` `1346c7e` `5c38444`

| 功能 | 说明 |
|------|------|
| Agent 面板 | 右侧 Widget，模仿 Trae IDE AI 助手；启动自动打开；Ctrl+Shift+A 切换 |
| 模型选择 | Claude 3.5 Sonnet/Haiku、GPT-4o/mini、DeepSeek V3/R1、Qwen2.5 Coder、GLM-5.1、GLM-Latest、Ollama |
| Agent/Chat 模式 | Agent 模式注入 @ 引用文件上下文 |
| 流式对话 | 打字机效果 + 闪烁光标 + Markdown 渲染（代码块/加粗/行内代码/列表） |
| 后端 LLM 代理 | BackendApplicationContribution 注册 POST /agent/chat，Node https 转发 OpenAI 兼容 API，SSE 流式 pipe，避免 CORS |
| Agent 图标 | SVG mask 粉色星标（修复纯粉色无图标） |
| 默认工作区 | theia-app 配置 defaultWorkspace，New/Save 命令默认可用 |

**新增包**：`packages/anan-agent/`（前端 Widget + 后端代理）。

### File 菜单修复（2026-07-08）— commit `4462855`

Theia 1.73 默认 FileMenuContribution 仅注册 New Folder/Upload/Download。重写 file-menu.ts 将 New File/Open File/Open Folder/Save/Save As 注册到 CommonMenus.FILE 根级（之前用子菜单路径未注册节点导致不显示）。

---

## 当前功能清单

### 已完成

- [x] **IDE 基础**：Theia 1.73 + Electron，安安粉系主题（25 颜色定义），3 套主题可切换
- [x] **二次元元素**：安安桌面宠物（SVG 原创，可拖动/点击/表情切换），变色动效（全局过渡+波纹）
- [x] **File 菜单**：新建/打开/保存/另存为/打开文件夹/工作区，默认打开项目工作区
- [x] **MCP 终端**：安安提示符，高危命令 3 秒倒计时确认，anan scan/test/lint 命令模板
- [x] **聊天系统**：Python 中转站（用户/好友/群聊/消息），anan-chat 扩展（登录/好友/群聊/实时消息）
- [x] **Agent 上下文传输**：通过中转站共享编辑器代码/文件给好友/群
- [x] **AI Agent 窗口**：Trae 风格面板，10 模型选择，流式对话，后端 LLM 代理，@ 引用文件
- [x] **单元测试**：79 用例（Node 端）+ 15 用例（Python 端），全绿

### 待办（MVP 剩余）

- [ ] **自动保存 + 崩溃恢复**：5 秒延迟自动保存、崩溃恢复未保存文件、配置损坏自动恢复
- [ ] **编码防呆**：2h 提醒休息、连续报错建议换思路
- [ ] **electron-builder 打包 exe**：NSIS installer，安安素材打包，交 feiyu 黑盒测试
- [ ] **文件树二次元图标**：anan-ui 注册自定义 IconTheme
- [ ] **PixiJS 动画层**：升级桌面宠物为骨骼动画（MVP 用 CSS，迭代用 PixiJS/Inochi2D）
- [ ] **Ollama 本地模型接入**：Agent 窗口支持本地 LLM

---

## Git 提交历史

```
4462855 fix(file-menu): File 菜单项注册到根级 + 默认打开工作区
5c38444 fix(agent): 重绘 Agent 面板图标 + 新增 GLM-5.1/GLM-Latest 模型
1346c7e fix(agent): Agent 面板启动时自动打开右侧 + Ctrl+Shift+A 快捷键
fb95ef0 feat(agent): Trae 风格 AI Agent 窗口 + 模型选择 + 后端 LLM 代理
f284bd9 feat(mcp): MCP 终端功能——提示符替换 + 高危命令倒计时确认 + 命令模板
3a4058f chore: gitignore 排除 Python __pycache__ 与 .pyc
8fd0cdd feat: 内置聊天软件 + Agent 上下文传输 + 安安桌面宠物 + File 菜单完善
c839737 docs: 更新接手说明，记录第一轮 POC 收尾完成情况与待运行项
b0be2c4 feat(poc): 完成第一轮 POC 收尾与核心模块单元测试
```

仓库：`https://github.com/Deaicup/8911-AnanIDE`

---

## 技术约定（必须遵守）

### 1. 语言与风格
- 全部 TypeScript，strict 模式
- 用 ESLint + Prettier（配置在根 package.json）
- 中文注释，英文代码

### 2. 防呆设计（头盖骨的核心职责）
每写一个功能，先问"feiyu 会怎么搞坏这个？"

**必须实现的防护**：
- 所有用户输入过 `Safety.validateInput()`
- 所有终端命令过 `Safety.checkCommand()`
- 所有文件操作过 `Safety.protectFileOp()`
- 删除操作走回收站，不直接删
- 高危 MCP 操作 3 秒倒计时确认
- 所有按钮防抖
- 单实例锁定（已实现）
- 自动保存（5 秒延迟写 autosave）
- 配置损坏自动恢复默认值

### 3. 不改 Theia 内核源码
所有定制通过 Theia Extension 机制实现，不 fork Theia 源码修改。用 `ContainerModule` 绑定扩展。

### 4. 数据存储路径
- 配置：`~/.anan/config.json`
- 数据库：`~/.anan/data.db`
- 编排规则：`~/.anan/orchestrations/*.json`
- 自动保存：`~/.anan/autosave/<project>/`

### 5. 测试要求
- 每个模块必须有单元测试
- CI 必须通过才能合并
- feiyu 的防呆测试用例放 `tests/foolproof/`

### 6. 版权红线
- 只用 MIT/BSD-2/Apache 2.0 协议的依赖
- **禁止使用 Live2D**（商用需付费授权）
- 动画用 PixiJS（MVP）→ Inochi2D WASM（迭代）
- 安安形象必须原创或委托绘制

---

## 开发命令

```bash
npm install          # 安装所有依赖
npm run build        # 构建所有包
npm run dev          # 开发模式（并行启动）
npm run test         # 运行所有测试
npm run test:unit    # 单元测试
npm run test:e2e     # E2E 测试
npm run lint         # 代码检查
npm run format       # 格式化
npm run clean        # 清理构建产物
```

---

## 团队

- **头盖骨**：主开发（全部代码 + 防呆设计 + 单元测试）
- **feiyu**：测试（打包 exe 后黑盒搞破坏，不写代码）
- **Trae AI**：辅助开发（接手头盖骨分配的模块任务）
- **WorkBuddy**：策划分析（每 3 小时扫描代码变更，生成策划文档）

---

## 联系

- 策划案：`docs/8911-安安黏糊开发机-完整策划案V3.0.md`
- 技术策划：`docs/8911-技术策划V2.0.md`
- 项目记忆：WorkBuddy 工作区 `.workbuddy/memory/`

开始干活。
