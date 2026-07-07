"""认证模块：scrypt 密码哈希 + token 会话管理"""
import hashlib
import secrets
import time
from typing import Optional

SCRYPT_KEYLEN = 64
SCRYPT_N = 16384  # CPU/内存代价
SESSION_TTL_S = 24 * 60 * 60  # 24 小时

# token -> {"user_id": int, "expire_at": float}
_sessions: dict[str, dict] = {}


def hash_password(password: str) -> dict:
    salt = secrets.token_hex(16)
    h = hashlib.scrypt(password.encode(), salt=salt.encode(), n=SCRYPT_N, r=8, p=1, dklen=SCRYPT_KEYLEN)
    return {"hash": h.hex(), "salt": salt}


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    try:
        h = hashlib.scrypt(password.encode(), salt=salt.encode(), n=SCRYPT_N, r=8, p=1, dklen=SCRYPT_KEYLEN)
        return secrets.compare_digest(h.hex(), password_hash)
    except (ValueError, TypeError):
        return False


def generate_token() -> str:
    return secrets.token_hex(32)


def create_session(token: str, user_id: int) -> None:
    _sessions[token] = {"user_id": user_id, "expire_at": time.time() + SESSION_TTL_S}


def get_session(token: Optional[str]) -> Optional[int]:
    if not token:
        return None
    s = _sessions.get(token)
    if not s:
        return None
    if time.time() > s["expire_at"]:
        _sessions.pop(token, None)
        return None
    return s["user_id"]


def revoke_session(token: str) -> None:
    _sessions.pop(token, None)


def extract_token(auth_header: Optional[str]) -> Optional[str]:
    """从 Authorization 头解析 Bearer token"""
    if not auth_header:
        return None
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return auth_header
