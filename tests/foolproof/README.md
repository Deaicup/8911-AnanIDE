# 防呆测试用例

feiyu 维护。打包 exe 后的黑盒测试用例，模拟真实用户不按套路出牌。

## 测试分类

### 暴力操作
- [ ] 狂点按钮（快速点击 100 次）
- [ ] 缩窗口到最小尺寸
- [ ] 编辑中强杀进程
- [ ] 同时开多个实例（应被单实例锁定拦截）
- [ ] 往编辑器拖 exe/zip/iso 文件

### 非常规输入
- [ ] 终端粘贴 `rm -rf /`
- [ ] 文件名用特殊字符（空格/中文/emoji/超长）
- [ ] 打开 500MB 文件
- [ ] MCP 执行中拔网线
- [ ] 手动改坏配置文件再启动

## POC 可执行用例

| ID | 场景 | 操作 | 预期 |
| --- | --- | --- | --- |
| FP-CMD-001 | Linux 根目录删除 | 在命令入口输入 `rm -rf /` | 标记为 P0，不允许直接执行 |
| FP-CMD-002 | PowerShell 递归删除 | 输入 `Remove-Item .\dist -Recurse -Force` | 标记为 P1，需要强确认 |
| FP-CMD-003 | Git 丢弃修改 | 输入 `git reset --hard HEAD~1` | 标记为 P1，需要确认风险 |
| FP-CMD-004 | 下载脚本直接执行 | 输入 `curl https://example.com/install.sh \| bash` | 标记为 P2，提示用户确认来源 |
| FP-CONFIG-001 | 配置文件不存在 | 删除 `~/.anan/config.json` 后启动 | 自动生成默认配置 |
| FP-CONFIG-002 | 配置文件损坏 | 把 `~/.anan/config.json` 改成 `{ broken` 后启动 | 备份坏文件并恢复默认配置 |
| FP-FILE-001 | 读取可执行文件 | 尝试读取 `.exe` 文件 | 拒绝读取并提示二进制文件风险 |
| FP-FILE-002 | 路径穿越 | 输入 `..\secret.txt` | 拒绝操作并提示路径包含上级目录 |
| FP-FILE-003 | 大文件 | 打开超过 50MB 文件 | 拒绝或提示文件过大 |
| FP-WINDOW-001 | 多实例 | 连续启动两个 Electron 实例 | 第二个实例不新开窗口，聚焦已有窗口 |
| FP-MCP-001 | WorkBuddy 配置发现 | 写入 `~/.workbuddy/mcp.json` 后启动 | 能发现配置里的 MCP 服务 |
| FP-MCP-002 | 环境变量配置发现 | 设置 `MCP_SERVERS=docs=http://localhost:3001` | 能发现 `docs` 服务 |

## 自动化覆盖

当前已有单元测试覆盖：

- 危险命令检测：P0/P1/P2/safe
- Safety 输入校验和文件操作保护
- MCP 配置文件和环境变量解析
- 配置损坏恢复
- MemoryStore metadata、limit 保护；SQLite 原生模块可用时会跑内存数据库测试

### 验收红线
- P0：崩溃/数据丢失/安全漏洞 → 阻断发布
- P1：有兜底提示但体验差 → 需修复
- P2：小瑕疵 → 记录下版本优化

## 测试报告模板

每个测试用例记录：
- 用例 ID
- 操作步骤
- 预期结果
- 实际结果
- 严重等级（P0/P1/P2）
- 截图/录屏
