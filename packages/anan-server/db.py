"""数据库层：sqlite3 schema 与查询函数。表：users / friendships / groups / group_members / messages"""
import sqlite3
import os
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

_conn: Optional[sqlite3.Connection] = None


def init_db(db_path: Optional[str] = None) -> sqlite3.Connection:
    """初始化数据库。默认 ~/.anan/server.db，测试可传 ':memory:'"""
    global _conn
    if db_path is None:
        db_path = os.path.join(os.path.expanduser("~"), ".anan", "server.db")
    if db_path != ":memory:":
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
    _conn = sqlite3.connect(db_path, check_same_thread=False)
    _conn.row_factory = sqlite3.Row
    _conn.execute("PRAGMA journal_mode = WAL")
    _conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            password_salt TEXT NOT NULL,
            display_name TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS friendships (
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            PRIMARY KEY (user_id, friend_id)
        );
        CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            owner_id INTEGER NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS group_members (
            group_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            joined_at TEXT NOT NULL,
            PRIMARY KEY (group_id, user_id)
        );
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kind TEXT NOT NULL,
            from_id INTEGER NOT NULL,
            to_id INTEGER,
            group_id INTEGER,
            content TEXT NOT NULL,
            msg_type TEXT NOT NULL DEFAULT 'text',
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_messages_private ON messages(from_id, to_id);
        CREATE INDEX IF NOT EXISTS idx_messages_group ON messages(group_id);
    """)
    _conn.commit()
    return _conn


def get_db() -> sqlite3.Connection:
    if _conn is None:
        raise RuntimeError("DB 未初始化，请先调用 init_db()")
    return _conn


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---- 用户 ----
def create_user(username: str, password_hash: str, salt: str, display_name: str) -> Dict[str, Any]:
    db = get_db()
    db.execute(
        "INSERT INTO users (username, password_hash, password_salt, display_name, created_at) VALUES (?, ?, ?, ?, ?)",
        (username, password_hash, salt, display_name, _now()),
    )
    db.commit()
    return get_user_by_name(username)


def get_user_by_name(username: str) -> Optional[Dict[str, Any]]:
    row = get_db().execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    row = get_db().execute(
        "SELECT id, username, display_name, created_at FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    return dict(row) if row else None


# ---- 好友 ----
def add_friend(user_id: int, friend_id: int) -> None:
    db = get_db()
    now = _now()
    db.execute("INSERT OR IGNORE INTO friendships (user_id, friend_id, created_at) VALUES (?, ?, ?)", (user_id, friend_id, now))
    db.execute("INSERT OR IGNORE INTO friendships (user_id, friend_id, created_at) VALUES (?, ?, ?)", (friend_id, user_id, now))
    db.commit()


def remove_friend(user_id: int, friend_id: int) -> None:
    db = get_db()
    db.execute(
        "DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
        (user_id, friend_id, friend_id, user_id),
    )
    db.commit()


def get_friends(user_id: int) -> List[Dict[str, Any]]:
    rows = get_db().execute(
        """SELECT u.id, u.username, u.display_name, u.created_at FROM users u
           JOIN friendships f ON f.friend_id = u.id WHERE f.user_id = ? ORDER BY u.username""",
        (user_id,),
    ).fetchall()
    return [dict(r) for r in rows]


# ---- 群聊 ----
def create_group(name: str, owner_id: int, member_ids: List[int]) -> int:
    db = get_db()
    now = _now()
    cur = db.execute("INSERT INTO groups (name, owner_id, created_at) VALUES (?, ?, ?)", (name, owner_id, now))
    group_id = cur.lastrowid
    db.execute("INSERT OR IGNORE INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)", (group_id, owner_id, now))
    for mid in member_ids:
        db.execute("INSERT OR IGNORE INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)", (group_id, mid, now))
    db.commit()
    return group_id


def add_group_member(group_id: int, user_id: int) -> None:
    db = get_db()
    db.execute("INSERT OR IGNORE INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)", (group_id, user_id, _now()))
    db.commit()


def get_groups(user_id: int) -> List[Dict[str, Any]]:
    rows = get_db().execute(
        """SELECT g.* FROM groups g JOIN group_members gm ON gm.group_id = g.id
           WHERE gm.user_id = ? ORDER BY g.name""",
        (user_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def get_group_members(group_id: int) -> List[Dict[str, Any]]:
    rows = get_db().execute(
        """SELECT u.id, u.username, u.display_name, u.created_at FROM users u
           JOIN group_members gm ON gm.user_id = u.id WHERE gm.group_id = ? ORDER BY u.username""",
        (group_id,),
    ).fetchall()
    return [dict(r) for r in rows]


# ---- 消息 ----
def save_private_message(from_id: int, to_id: int, content: str, msg_type: str = "text") -> int:
    db = get_db()
    cur = db.execute(
        "INSERT INTO messages (kind, from_id, to_id, content, msg_type, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        ("private", from_id, to_id, content, msg_type, _now()),
    )
    db.commit()
    return cur.lastrowid


def save_group_message(from_id: int, group_id: int, content: str, msg_type: str = "text") -> int:
    db = get_db()
    cur = db.execute(
        "INSERT INTO messages (kind, from_id, group_id, content, msg_type, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        ("group", from_id, group_id, content, msg_type, _now()),
    )
    db.commit()
    return cur.lastrowid


def get_private_history(user_id: int, peer_id: int, limit: int = 50) -> List[Dict[str, Any]]:
    rows = get_db().execute(
        """SELECT * FROM messages WHERE kind = 'private'
           AND ((from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?))
           ORDER BY created_at ASC LIMIT ?""",
        (user_id, peer_id, peer_id, user_id, limit),
    ).fetchall()
    return [dict(r) for r in rows]


def get_group_history(group_id: int, limit: int = 50) -> List[Dict[str, Any]]:
    rows = get_db().execute(
        "SELECT * FROM messages WHERE kind = 'group' AND group_id = ? ORDER BY created_at ASC LIMIT ?",
        (group_id, limit),
    ).fetchall()
    return [dict(r) for r in rows]
