"""anan-server 中转服务器：FastAPI REST API + WebSocket（监听 127.0.0.1:3001 占位）"""
import os
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Header, WebSocket, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import db
from auth import hash_password, verify_password, generate_token, create_session, get_session, extract_token
from ws_handler import handle_websocket, is_user_online

HOST = os.environ.get("ANAN_SERVER_HOST", "127.0.0.1")
PORT = int(os.environ.get("ANAN_SERVER_PORT", "3001"))


def create_app(db_path: Optional[str] = None) -> FastAPI:
    """构造 FastAPI 应用（测试可传 db_path）"""
    db.init_db(db_path)
    app = FastAPI(title="anan-server", description="安安中转服务器：用户系统 + 聊天 + Agent 上下文传输")
    app.add_middleware(
        CORSMiddleware, allow_origins=["*"], allow_credentials=True,
        allow_methods=["*"], allow_headers=["*"],
    )

    # ---- 认证依赖 ----
    def _current_user(authorization: Optional[str] = Header(None)) -> dict:
        token = extract_token(authorization)
        user_id = get_session(token)
        if not user_id:
            raise HTTPException(status_code=401, detail="未登录或 token 失效")
        user = db.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        return user

    def _safe(u: dict) -> dict:
        return {"id": u["id"], "username": u["username"], "displayName": u["display_name"], "createdAt": u["created_at"]}

    # ---- 请求模型 ----
    class RegisterReq(BaseModel):
        username: str
        password: str
        displayName: Optional[str] = None

    class LoginReq(BaseModel):
        username: str
        password: str

    class FriendReq(BaseModel):
        username: str

    class GroupReq(BaseModel):
        name: str
        members: List[str] = []

    class GroupMemberReq(BaseModel):
        username: str

    # ---- 注册 ----
    @app.post("/api/register")
    def register(body: RegisterReq):
        if not body.username or not body.password:
            raise HTTPException(400, "用户名和密码不能为空")
        if not (2 <= len(body.username) <= 32):
            raise HTTPException(400, "用户名长度需 2-32 字符")
        if db.get_user_by_name(body.username):
            raise HTTPException(409, "用户名已存在")
        h = hash_password(body.password)
        user = db.create_user(body.username, h["hash"], h["salt"], body.displayName or body.username)
        token = generate_token()
        create_session(token, user["id"])
        return {"token": token, "user": _safe(user)}

    # ---- 登录 ----
    @app.post("/api/login")
    def login(body: LoginReq):
        row = db.get_user_by_name(body.username)
        if not row or not verify_password(body.password, row["password_hash"], row["password_salt"]):
            raise HTTPException(401, "用户名或密码错误")
        token = generate_token()
        create_session(token, row["id"])
        return {"token": token, "user": _safe(row)}

    # ---- 当前用户 ----
    @app.get("/api/profile")
    def profile(user: dict = Depends(_current_user)):
        return {"user": _safe(user)}

    # ---- 好友 ----
    @app.get("/api/friends")
    def list_friends(user: dict = Depends(_current_user)):
        friends = db.get_friends(user["id"])
        return {"friends": [{**_safe(f), "online": is_user_online(f["id"])} for f in friends]}

    @app.post("/api/friends")
    def add_friend(body: FriendReq, user: dict = Depends(_current_user)):
        target = db.get_user_by_name(body.username)
        if not target:
            raise HTTPException(404, "用户不存在")
        if target["id"] == user["id"]:
            raise HTTPException(400, "不能添加自己为好友")
        db.add_friend(user["id"], target["id"])
        return {"friend": _safe(target)}

    @app.delete("/api/friends/{username}")
    def del_friend(username: str, user: dict = Depends(_current_user)):
        target = db.get_user_by_name(username)
        if not target:
            raise HTTPException(404, "用户不存在")
        db.remove_friend(user["id"], target["id"])
        return {"ok": True}

    # ---- 群聊 ----
    @app.get("/api/groups")
    def list_groups(user: dict = Depends(_current_user)):
        return {"groups": db.get_groups(user["id"])}

    @app.post("/api/groups")
    def create_group_api(body: GroupReq, user: dict = Depends(_current_user)):
        member_ids = []
        for username in body.members:
            u = db.get_user_by_name(username)
            if u and u["id"] != user["id"]:
                member_ids.append(u["id"])
        group_id = db.create_group(body.name, user["id"], member_ids)
        return {"groupId": group_id, "name": body.name}

    @app.post("/api/groups/{group_id}/members")
    def invite_member(group_id: int, body: GroupMemberReq, user: dict = Depends(_current_user)):
        target = db.get_user_by_name(body.username)
        if not target:
            raise HTTPException(404, "用户不存在")
        db.add_group_member(group_id, target["id"])
        return {"ok": True}

    @app.get("/api/groups/{group_id}/members")
    def list_group_members(group_id: int, user: dict = Depends(_current_user)):
        members = db.get_group_members(group_id)
        return {"members": [{**_safe(m), "online": is_user_online(m["id"])} for m in members]}

    # ---- 消息历史 ----
    @app.get("/api/messages/private/{peer_id}")
    def private_history(peer_id: int, user: dict = Depends(_current_user)):
        return {"history": db.get_private_history(user["id"], peer_id)}

    @app.get("/api/messages/group/{group_id}")
    def group_history(group_id: int, user: dict = Depends(_current_user)):
        return {"history": db.get_group_history(group_id)}

    # ---- WebSocket ----
    @app.websocket("/ws")
    async def ws_endpoint(websocket: WebSocket):
        await handle_websocket(websocket)

    return app


# 启动入口
if __name__ == "__main__":
    import uvicorn
    app = create_app()
    print(f"[anan-server] 监听 http://{HOST}:{PORT}  (ws://{HOST}:{PORT}/ws)")
    uvicorn.run(app, host=HOST, port=PORT)
