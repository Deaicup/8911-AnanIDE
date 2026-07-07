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

## 当前状态（POC 阶段，第 1-2 周）

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

## 下一步任务（按优先级）

### 第一轮 POC 收尾完成情况（2026-07-06）

| 任务 | 状态 | 说明 |
|------|------|------|
| 安装依赖并跑通构建 | ✅ 完成 | better-sqlite3 升级 12.x 适配 Node 24；各包补齐 tsconfig；非 Theia 包 tsc 全通过；Theia build（esbuild）通过 |
| Theia 本地启动验证 | ⚠️ 代码就绪 | 主题代码已适配 Theia 1.73 API（ColorRegistry + ThemeService）并移入 anan-ui；theia-app 已配 @theia/cli。**待运行**：`cd packages/theia-app && npx theia dev`，浏览器访问 :3000，在 Preferences → Color Theme 验证 anan-pink/blue/dark 三套主题可切换 |
| Electron 打通 Theia | ⚠️ 代码就绪 | `main.ts` 已改为 `loadURL('http://localhost:3000')`（可经 `ANAN_THEIA_URL` 覆盖）。**待运行**：先起 Theia dev，再 `cd packages/electron && npx tsc && npx electron lib/main.js`，验证窗口渲染 Theia、单实例锁定生效 |
| 单元测试补齐 | ✅ 完成 | 5 套件 / 79 用例全绿：danger-check / Safety / MemoryStore / MCP 发现 / 共享类型 |
| Lint + Format | ✅ 完成 | 新增 .eslintrc.js + .prettierrc.json，`npm run lint` 无 error |
| Git 提交 | ✅ 完成 | commit `b0be2c4`，分支 main（领先 origin/main 2 个提交，待 push） |

#### 第一轮发现并修复的缺陷
1. `anan-core/safety/safety.ts` 跨包 import 路径深度错误：`../../anan-mcp/lib/...` 应为 `../../../anan-mcp/lib/...`
2. `anan-mcp/discovery/discover.ts` 的 `MCP_SERVERS` 环境变量解析原为 TODO，已补全（格式 `name1=url1,name2=url2`）
3. `tests/unit/jest.config.js` 原用 ESM `import` 语法且引用未安装的 `@jest/globals`，已改为 CommonJS 并补齐 jest/ts-jest 依赖
4. `discoverMcpServers` 新增可选 `homeDir` 参数以支持测试注入（沙箱环境下 `os.homedir()` 行为受限）
5. Theia 实际安装版本为 1.73.1（非 package.json 声明的 1.49），颜色 API 变更，`anan-themes` 已重写适配

#### 待 push
本地已领先 `origin/main` 2 个提交，确认后执行 `git push`。

### MVP 阶段任务（第 3-8 周）

按 `docs/8911-安安黏糊开发机-完整策划案V3.0.md` 第五章执行：

1. anan-ui：PixiJS Canvas 挂载、表情切换、文件树二次元图标
2. anan-mcp：终端提示符替换、MCP 调用链路打通、高危确认弹窗
3. anan-core：编排引擎、状态联动、自动保存/崩溃恢复
4. electron-builder 打包 exe

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
