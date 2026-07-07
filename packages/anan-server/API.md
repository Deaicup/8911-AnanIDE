# anan-server 中转站接口文档

> 安安黏糊开发机内置聊天软件与 Agent 上下文传输的中转服务器
> 技术栈：Python 3.13 + FastAPI + WebSocket + SQLite
> 默认地址：`http://127.0.0.1:3001`（占位 IP，可通过环境变量切换）

---

## 一、基础信息

| 项 | 值 |
|----|----|
| 协议 | HTTP/1.1 + WebSocket |
| 默认 Host | `127.0.0.1` |
| 默认 Port | `3001` |
| 数据格式 | JSON（UTF-8） |
| 认证方式 | Bearer Token（除注册/登录外所有接口） |
| CORS | 允许所有来源（开发期） |

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `ANAN_SERVER_HOST` | `127.0.0.1` | 监听地址，部署时改为公网 IP |
| `ANAN_SERVER_PORT` | `3001` | 监听端口 |

### 启动

```bash
cd packages/anan-server
pip install -r requirements.txt
python app.py
# 输出：[anan-server] 监听 http://127.0.0.1:3001  (ws://127.0.0.1:3001/ws)
```

### 数据存储

- SQLite 数据库：`~/.anan/server.db`（首次启动自动创建）
- 密码哈希：scrypt（N=16384, r=8, p=1, dklen=64）
- 会话：内存 Map（token → userId，TTL 24 小时，服务器重启需重新登录）

---

## 二、认证机制

除 `/api/register` 和 `/api/login` 外，所有接口需在请求头携带：

```
Authorization: Bearer <token>
```

- token 在注册/登录成功时返回
- token 失效或缺失返回 `401`
- WebSocket 通过 URL query 传 token：`ws://host:port/ws?token=<token>`

---

## 三、REST API

### 3.1 用户系统

#### POST /api/register — 注册新用户

**请求体**
```json
{
  "username": "alice",
  "password": "mypassword",
  "displayName": "爱丽丝"
}
```

| 字段 | 类型 | 必填 | 约束 |
|------|------|------|------|
| username | string | 是 | 2-32 字符，唯一 |
| password | string | 是 | 非空 |
| displayName | string | 否 | 默认同 username |

**成功响应** `200`
```json
{
  "token": "a1b2c3...64hex",
  "user": {
    "id": 1,
    "username": "alice",
    "displayName": "爱丽丝",
    "createdAt": "2026-07-07T06:00:00+00:00"
  }
}
```

**错误响应**
| 状态码 | 说明 |
|--------|------|
| 400 | 用户名或密码为空 / 用户名长度不在 2-32 |
| 409 | 用户名已存在 |

---

#### POST /api/login — 登录

**请求体**
```json
{ "username": "alice", "password": "mypassword" }
```

**成功响应** `200`（同注册响应结构）

**错误响应**
| 状态码 | 说明 |
|--------|------|
| 400 | 用户名或密码为空 |
| 401 | 用户名或密码错误 |

---

#### GET /api/profile — 获取当前用户信息

**请求头**：`Authorization: Bearer <token>`

**成功响应** `200`
```json
{
  "user": {
    "id": 1,
    "username": "alice",
    "displayName": "爱丽丝",
    "createdAt": "2026-07-07T06:00:00+00:00"
  }
}
```

**错误响应**：`401` 未登录或 token 失效

---

### 3.2 好友系统

#### GET /api/friends — 好友列表

**请求头**：`Authorization: Bearer <token>`

**成功响应** `200`
```json
{
  "friends": [
    {
      "id": 2,
      "username": "bob",
      "displayName": "bob",
      "createdAt": "2026-07-07T06:05:00+00:00",
      "online": true
    }
  ]
}
```

> `online` 字段反映 WebSocket 实时在线状态

---

#### POST /api/friends — 添加好友

**请求头**：`Authorization: Bearer <token>`

**请求体**
```json
{ "username": "bob" }
```

**成功响应** `200`
```json
{
  "friend": {
    "id": 2,
    "username": "bob",
    "displayName": "bob",
    "createdAt": "2026-07-07T06:05:00+00:00"
  }
}
```

> 好友关系为双向，添加后双方互为好友

**错误响应**
| 状态码 | 说明 |
|--------|------|
| 400 | 不能添加自己为好友 |
| 404 | 目标用户不存在 |

---

#### DELETE /api/friends/{username} — 删除好友

**路径参数**：`username` 好友用户名

**请求头**：`Authorization: Bearer <token>`

**成功响应** `200`
```json
{ "ok": true }
```

> 删除为双向操作

**错误响应**：`404` 用户不存在

---

### 3.3 群聊系统

#### GET /api/groups — 群聊列表

**请求头**：`Authorization: Bearer <token>`

**成功响应** `200`
```json
{
  "groups": [
    {
      "id": 1,
      "name": "开发组",
      "owner_id": 1,
      "created_at": "2026-07-07T06:10:00+00:00"
    }
  ]
}
```

> 仅返回当前用户已加入的群

---

#### POST /api/groups — 新建群聊

**请求头**：`Authorization: Bearer <token>`

**请求体**
```json
{
  "name": "开发组",
  "members": ["bob", "carol"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 群名 |
| members | string[] | 否 | 初始成员用户名列表（创建者自动入群，无需在此列出） |

**成功响应** `200`
```json
{ "groupId": 1, "name": "开发组" }
```

> 不存在的用户名会被静默跳过

---

#### POST /api/groups/{group_id}/members — 邀请群成员

**路径参数**：`group_id` 群 ID

**请求头**：`Authorization: Bearer <token>`

**请求体**
```json
{ "username": "dave" }
```

**成功响应** `200`
```json
{ "ok": true }
```

**错误响应**：`404` 用户不存在

---

#### GET /api/groups/{group_id}/members — 群成员列表

**路径参数**：`group_id` 群 ID

**请求头**：`Authorization: Bearer <token>`

**成功响应** `200`
```json
{
  "members": [
    {
      "id": 1,
      "username": "alice",
      "displayName": "爱丽丝",
      "createdAt": "2026-07-07T06:00:00+00:00",
      "online": true
    }
  ]
}
```

---

### 3.4 消息历史

#### GET /api/messages/private/{peer_id} — 私聊历史

**路径参数**：`peer_id` 对方用户 ID

**请求头**：`Authorization: Bearer <token>`

**成功响应** `200`
```json
{
  "history": [
    {
      "id": 10,
      "kind": "private",
      "from_id": 1,
      "to_id": 2,
      "group_id": null,
      "content": "你好",
      "msg_type": "text",
      "created_at": "2026-07-07T06:20:00+00:00"
    }
  ]
}
```

> 默认返回最近 50 条，按时间升序

---

#### GET /api/messages/group/{group_id} — 群聊历史

**路径参数**：`group_id` 群 ID

**请求头**：`Authorization: Bearer <token>`

**成功响应** `200`（结构同私聊历史，`kind` 为 `group`，`group_id` 有值，`to_id` 为 null）

---

## 四、WebSocket 协议

### 4.1 连接

```
ws://127.0.0.1:3001/ws?token=<token>
```

- 连接时必须带 `token` query 参数
- token 无效：服务器发送 `{type:'error', message:'未认证或 token 失效'}` 后关闭连接（code 4001）
- 连接成功：服务器发送 `connected` 消息

### 4.2 服务器 → 客户端消息

#### connected — 连接成功
```json
{ "type": "connected", "user_id": 1, "username": "alice" }
```

#### private-message — 收到私聊
```json
{
  "type": "private-message",
  "fromUserId": 2,
  "fromUsername": "bob",
  "content": "你好",
  "timestamp": "2026-07-07T06:20:00+00:00"
}
```

#### group-message — 收到群聊
```json
{
  "type": "group-message",
  "groupId": 1,
  "fromUserId": 2,
  "fromUsername": "bob",
  "content": "大家好",
  "timestamp": "2026-07-07T06:21:00+00:00"
}
```

#### context-share — 收到 Agent 上下文（私聊）
```json
{
  "type": "context-share",
  "fromUserId": 2,
  "fromUsername": "bob",
  "context": { "fileName": "main.ts", "selection": "...", "language": "typescript" },
  "timestamp": "2026-07-07T06:22:00+00:00"
}
```

> `context` 为任意 JSON 对象，由客户端自定义结构。服务器仅做实时转发，不入库。

#### group-context — 收到 Agent 上下文（群聊）
```json
{
  "type": "group-context",
  "groupId": 1,
  "fromUserId": 2,
  "fromUsername": "bob",
  "context": { ... },
  "timestamp": "2026-07-07T06:23:00+00:00"
}
```

#### presence — 用户上下线
```json
{ "type": "presence", "user_id": 2, "online": true }
```

#### error — 错误
```json
{ "type": "error", "message": "消息格式错误，需为 JSON" }
```

### 4.3 客户端 → 服务器消息

#### 发送私聊
```json
{ "type": "private-message", "toUserId": 2, "content": "你好" }
```

#### 发送群聊
```json
{ "type": "group-message", "groupId": 1, "content": "大家好" }
```

#### 分享 Agent 上下文（私聊）
```json
{
  "type": "context-share",
  "toUserId": 2,
  "context": { "fileName": "main.ts", "content": "..." }
}
```

#### 分享 Agent 上下文（群聊）
```json
{
  "type": "group-context",
  "groupId": 1,
  "context": { "fileName": "main.ts", "content": "..." }
}
```

> 文本消息会被持久化到数据库；上下文消息（context-share / group-context）仅实时转发，不存储。

---

## 五、数据模型

### User（安全输出）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 用户 ID |
| username | string | 登录用户名 |
| displayName | string | 显示名 |
| createdAt | string | 注册时间 ISO8601 |
| online | bool | 是否在线（仅好友/成员列表返回） |

### Group
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 群 ID |
| name | string | 群名 |
| owner_id | int | 群主用户 ID |
| created_at | string | 创建时间 |

### Message
| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 消息 ID |
| kind | string | `private` / `group` |
| from_id | int | 发送者 ID |
| to_id | int? | 接收者 ID（私聊） |
| group_id | int? | 群 ID（群聊） |
| content | string | 消息内容 |
| msg_type | string | `text` / `context` |
| created_at | string | 发送时间 |

### 数据库表结构

```
users(id, username, password_hash, password_salt, display_name, created_at)
friendships(user_id, friend_id, created_at)            -- 双向记录
groups(id, name, owner_id, created_at)
group_members(group_id, user_id, joined_at)
messages(id, kind, from_id, to_id, group_id, content, msg_type, created_at)
```

---

## 六、错误码总览

| 状态码 | 场景 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误（空值、长度不合法、添加自己为好友等） |
| 401 | 未登录 / token 失效 / 密码错误 |
| 404 | 目标用户不存在 |
| 409 | 用户名已存在 |

错误响应统一格式：
```json
{ "detail": "错误描述" }
```

> FastAPI 默认错误字段为 `detail`，非 `error`

---

## 七、使用示例

### curl 注册 + 登录 + 加好友

```bash
# 1. 注册 alice
curl -X POST http://127.0.0.1:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"pw","displayName":"爱丽丝"}'

# 2. 注册 bob
curl -X POST http://127.0.0.1:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","password":"pw"}'

# 3. alice 登录拿 token
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"pw"}' | python -c "import sys,json;print(json.load(sys.stdin)['token'])")

# 4. alice 加 bob 为好友
curl -X POST http://127.0.0.1:3001/api/friends \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"bob"}'

# 5. 查看好友列表
curl http://127.0.0.1:3001/api/friends \
  -H "Authorization: Bearer $TOKEN"
```

### Python WebSocket 客户端示例

```python
import asyncio, json, websockets

async def chat():
    token = "你的token"
    async with websockets.connect(f"ws://127.0.0.1:3001/ws?token={token}") as ws:
        # 接收 connected 消息
        print(await ws.recv())
        # 发送私聊
        await ws.send(json.dumps({
            "type": "private-message",
            "toUserId": 2,
            "content": "你好"
        }))
        # 接收消息
        while True:
            print(await ws.recv())

asyncio.run(chat())
```

### JavaScript 浏览器客户端示例

```javascript
const ws = new WebSocket(`ws://127.0.0.1:3001/ws?token=${token}`);
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  switch (msg.type) {
    case 'private-message': console.log(`${msg.fromUsername}: ${msg.content}`); break;
    case 'context-share': console.log('收到上下文', msg.context); break;
    case 'presence': console.log(`用户 ${msg.user_id} ${msg.online ? '上线' : '下线'}`); break;
  }
};
// 发送消息
ws.send(JSON.stringify({ type: 'private-message', toUserId: 2, content: '你好' }));
```

---

## 八、Agent 上下文传输说明

上下文传输是本中转站的特色功能，用于在开发者之间共享 IDE 内的 Agent 上下文。

### 工作流程

1. 开发者 A 在 IDE 内选中代码或打开文件
2. 点击「分享上下文」按钮，选择好友/群
3. 客户端将上下文打包为 JSON 对象，通过 WebSocket 发送到服务器
4. 服务器实时转发给目标用户/群成员
5. 开发者 B 的 IDE 收到后，可在聊天面板查看或一键导入到自己的 Agent

### context 对象推荐结构

```json
{
  "fileName": "packages/anan-core/src/safety/safety.ts",
  "language": "typescript",
  "selection": "第 30-45 行选中文本",
  "fullContent": "整个文件内容（可选）",
  "projectPath": "d:/Code/anan-ide",
  "agentNote": "这是安安 Safety 模块的关键校验逻辑"
}
```

> context 结构由客户端自定义，服务器不校验内容，仅做透传。建议包含 fileName/language 便于接收方识别。

### 与普通消息的区别

| 特性 | 文本消息 | 上下文消息 |
|------|---------|-----------|
| 持久化 | 是（存 messages 表） | 否（仅实时转发） |
| msg_type | `text` | `context` |
| WebSocket type | `*-message` | `*-context` / `context-share` |
| 用途 | 日常聊天 | 传输代码/文件/Agent 状态 |

---

## 九、测试

```bash
cd packages/anan-server
python -m pytest test_app.py -v
```

覆盖 15 个用例：注册/登录/参数校验/重复注册/密码错误/未认证/好友CRUD/不能加自己/群聊创建/列表/成员/邀请。

---

## 十、部署说明

当前 `127.0.0.1` 为占位地址，正式部署时：

1. 修改环境变量：`ANAN_SERVER_HOST=0.0.0.0 ANAN_SERVER_PORT=3001`
2. 生产环境建议加 HTTPS 反向代理（nginx）并启用 WSS
3. SQLite 单机够用；多实例部署需换 PostgreSQL/MySQL
4. 会话当前为内存存储，多实例需换 Redis 共享会话
5. 生产环境应限制 CORS 来源（当前 `allow_origins=["*"]`）

```bash
ANAN_SERVER_HOST=0.0.0.0 ANAN_SERVER_PORT=3001 python app.py
```
