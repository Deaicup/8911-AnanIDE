"""anan-server API 测试：用临时文件 db + FastAPI TestClient"""
import os
import tempfile
import pytest
from fastapi.testclient import TestClient

from app import create_app


@pytest.fixture()
def client():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    app = create_app(path)
    with TestClient(app) as c:
        yield c


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


class Test用户系统:
    def test_注册新用户成功(self, client):
        r = client.post("/api/register", json={"username": "alice", "password": "pw", "displayName": "爱丽丝"})
        assert r.status_code == 200
        data = r.json()
        assert data["token"]
        assert data["user"]["username"] == "alice"

    def test_重复注册返回409(self, client):
        client.post("/api/register", json={"username": "alice", "password": "pw"})
        r = client.post("/api/register", json={"username": "alice", "password": "x"})
        assert r.status_code == 409

    def test_用户名过短返回400(self, client):
        r = client.post("/api/register", json={"username": "a", "password": "x"})
        assert r.status_code == 400

    def test_登录成功(self, client):
        client.post("/api/register", json={"username": "bob", "password": "pw_bob"})
        r = client.post("/api/login", json={"username": "bob", "password": "pw_bob"})
        assert r.status_code == 200
        assert r.json()["token"]

    def test_密码错误返回401(self, client):
        client.post("/api/register", json={"username": "carol", "password": "pw"})
        r = client.post("/api/login", json={"username": "carol", "password": "wrong"})
        assert r.status_code == 401

    def test_未认证访问profile返回401(self, client):
        r = client.get("/api/profile")
        assert r.status_code == 401

    def test_认证获取profile(self, client):
        token = client.post("/api/register", json={"username": "dave", "password": "pw"}).json()["token"]
        r = client.get("/api/profile", headers=_auth_header(token))
        assert r.status_code == 200
        assert r.json()["user"]["username"] == "dave"


class Test好友系统:
    def _setup(self, client):
        ta = client.post("/api/register", json={"username": "alice", "password": "pw"}).json()["token"]
        client.post("/api/register", json={"username": "bob", "password": "pw"})
        return ta

    def test_添加好友(self, client):
        ta = self._setup(client)
        r = client.post("/api/friends", json={"username": "bob"}, headers=_auth_header(ta))
        assert r.status_code == 200
        assert r.json()["friend"]["username"] == "bob"

    def test_好友列表包含(self, client):
        ta = self._setup(client)
        client.post("/api/friends", json={"username": "bob"}, headers=_auth_header(ta))
        r = client.get("/api/friends", headers=_auth_header(ta))
        assert r.status_code == 200
        assert any(f["username"] == "bob" for f in r.json()["friends"])

    def test_不能添加自己(self, client):
        ta = self._setup(client)
        r = client.post("/api/friends", json={"username": "alice"}, headers=_auth_header(ta))
        assert r.status_code == 400

    def test_删除好友(self, client):
        ta = self._setup(client)
        client.post("/api/friends", json={"username": "bob"}, headers=_auth_header(ta))
        r = client.delete("/api/friends/bob", headers=_auth_header(ta))
        assert r.status_code == 200
        friends = client.get("/api/friends", headers=_auth_header(ta)).json()["friends"]
        assert not any(f["username"] == "bob" for f in friends)


class Test群聊系统:
    def _setup(self, client):
        to = client.post("/api/register", json={"username": "owner", "password": "pw"}).json()["token"]
        client.post("/api/register", json={"username": "member1", "password": "pw"})
        return to

    def test_新建群聊带成员(self, client):
        to = self._setup(client)
        r = client.post("/api/groups", json={"name": "测试群", "members": ["member1"]}, headers=_auth_header(to))
        assert r.status_code == 200
        assert r.json()["groupId"] > 0

    def test_群聊列表包含(self, client):
        to = self._setup(client)
        client.post("/api/groups", json={"name": "测试群", "members": ["member1"]}, headers=_auth_header(to))
        r = client.get("/api/groups", headers=_auth_header(to))
        assert r.status_code == 200
        assert any(g["name"] == "测试群" for g in r.json()["groups"])

    def test_群成员列表(self, client):
        to = self._setup(client)
        client.post("/api/groups", json={"name": "测试群", "members": ["member1"]}, headers=_auth_header(to))
        gid = client.get("/api/groups", headers=_auth_header(to)).json()["groups"][0]["id"]
        r = client.get(f"/api/groups/{gid}/members", headers=_auth_header(to))
        assert r.status_code == 200
        names = [m["username"] for m in r.json()["members"]]
        assert "owner" in names
        assert "member1" in names

    def test_邀请新成员(self, client):
        to = self._setup(client)
        client.post("/api/register", json={"username": "newbie", "password": "pw"})
        client.post("/api/groups", json={"name": "测试群", "members": ["member1"]}, headers=_auth_header(to))
        gid = client.get("/api/groups", headers=_auth_header(to)).json()["groups"][0]["id"]
        r = client.post(f"/api/groups/{gid}/members", json={"username": "newbie"}, headers=_auth_header(to))
        assert r.status_code == 200
