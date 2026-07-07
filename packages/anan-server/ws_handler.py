"""WebSocket 中转：私聊/群聊消息转发 + Agent 上下文传输 + 在线状态"""
import json
from typing import Dict, Optional
from fastapi import WebSocket

import db
from auth import get_session

# user_id -> WebSocket
_online_clients: Dict[int, WebSocket] = {}


def _send_to_user(user_id: int, msg: dict) -> None:
    ws = _online_clients.get(user_id)
    if ws:
        try:
            import asyncio
            asyncio.ensure_future(ws.send_text(json.dumps(msg, ensure_ascii=False)))
        except Exception:
            pass


async def _send_to_user_async(user_id: int, msg: dict) -> None:
    ws = _online_clients.get(user_id)
    if ws:
        try:
            await ws.send_text(json.dumps(msg, ensure_ascii=False))
        except Exception:
            pass


async def _broadcast_presence(user_id: int, online: bool) -> None:
    payload = {"type": "presence", "user_id": user_id, "online": online}
    for ws in list(_online_clients.values()):
        try:
            await ws.send_text(json.dumps(payload, ensure_ascii=False))
        except Exception:
            pass


async def handle_websocket(websocket: WebSocket) -> None:
    """处理 WebSocket 连接：验证 token -> 绑定 user_id -> 转发消息"""
    await websocket.accept()
    token = websocket.query_params.get("token")
    user_id = get_session(token)
    if not user_id:
        await websocket.send_text(json.dumps({"type": "error", "message": "未认证或 token 失效"}, ensure_ascii=False))
        await websocket.close(code=4001)
        return

    user = db.get_user_by_id(user_id)
    if not user:
        await websocket.close(code=4003)
        return

    _online_clients[user_id] = websocket
    await _broadcast_presence(user_id, True)
    await websocket.send_text(json.dumps({"type": "connected", "user_id": user_id, "username": user["username"]}, ensure_ascii=False))

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "error", "message": "消息格式错误，需为 JSON"}, ensure_ascii=False))
                continue
            await _handle_client_message(user_id, user["username"], data)
    except Exception:
        pass
    finally:
        if _online_clients.get(user_id) is websocket:
            _online_clients.pop(user_id, None)
            await _broadcast_presence(user_id, False)


async def _handle_client_message(user_id: int, username: str, data: dict) -> None:
    from datetime import datetime
    timestamp = datetime.utcnow().isoformat()
    msg_type = data.get("type")

    if msg_type == "private-message":
        to_user_id = int(data.get("toUserId", 0))
        content = str(data.get("content", ""))
        if not to_user_id or not content:
            return
        db.save_private_message(user_id, to_user_id, content, "text")
        await _send_to_user_async(to_user_id, {
            "type": "private-message",
            "fromUserId": user_id,
            "fromUsername": username,
            "content": content,
            "timestamp": timestamp,
        })

    elif msg_type == "group-message":
        group_id = int(data.get("groupId", 0))
        content = str(data.get("content", ""))
        if not group_id or not content:
            return
        db.save_group_message(user_id, group_id, content, "text")
        members = db.get_group_members(group_id)
        payload = {
            "type": "group-message",
            "groupId": group_id,
            "fromUserId": user_id,
            "fromUsername": username,
            "content": content,
            "timestamp": timestamp,
        }
        for m in members:
            if m["id"] != user_id:
                await _send_to_user_async(m["id"], payload)

    elif msg_type == "context-share":
        # Agent 上下文共享：仅实时转发，不入库
        to_user_id = int(data.get("toUserId", 0))
        context = data.get("context")
        if not to_user_id or context is None:
            return
        await _send_to_user_async(to_user_id, {
            "type": "context-share",
            "fromUserId": user_id,
            "fromUsername": username,
            "context": context,
            "timestamp": timestamp,
        })

    elif msg_type == "group-context":
        group_id = int(data.get("groupId", 0))
        context = data.get("context")
        if not group_id or context is None:
            return
        members = db.get_group_members(group_id)
        payload = {
            "type": "group-context",
            "groupId": group_id,
            "fromUserId": user_id,
            "fromUsername": username,
            "context": context,
            "timestamp": timestamp,
        }
        for m in members:
            if m["id"] != user_id:
                await _send_to_user_async(m["id"], payload)


def is_user_online(user_id: int) -> bool:
    return user_id in _online_clients
