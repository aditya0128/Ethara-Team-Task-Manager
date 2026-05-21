"""ETHARA Team Task Manager — backend API tests.

Covers: auth (login/register/me/forgot/reset/role-mismatch),
users, teams, projects, tasks (CRUD + kanban), attendance
(punch-in/out/active/summary/double-punch-in), analytics.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://task-collab-suite-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@ethara.ai"
ADMIN_PASSWORD = "Admin@123"
MEMBER_EMAIL = "member@ethara.ai"
MEMBER_PASSWORD = "Member@123"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


def _login(sess, email, password, role=None):
    payload = {"email": email, "password": password}
    if role:
        payload["role"] = role
    r = sess.post(f"{API}/auth/login", json=payload)
    return r


@pytest.fixture(scope="session")
def admin_token(s):
    r = _login(s, ADMIN_EMAIL, ADMIN_PASSWORD)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "admin"
    return data["access_token"]


@pytest.fixture(scope="session")
def member_token(s):
    r = _login(s, MEMBER_EMAIL, MEMBER_PASSWORD)
    assert r.status_code == 200, f"Member login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


def _h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- Health ----------
class TestHealth:
    def test_root(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200
        body = r.json()
        assert body.get("status") == "ok"


# ---------- Auth ----------
class TestAuth:
    def test_login_admin_success(self, s):
        r = _login(s, ADMIN_EMAIL, ADMIN_PASSWORD)
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data and len(data["access_token"]) > 10
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"

    def test_login_invalid_credentials(self, s):
        r = _login(s, ADMIN_EMAIL, "wrong-pass")
        assert r.status_code == 401

    def test_login_role_mismatch(self, s):
        # admin user logging in claiming role=member should fail
        r = _login(s, ADMIN_EMAIL, ADMIN_PASSWORD, role="member")
        assert r.status_code == 403, r.text

    def test_login_role_match(self, s):
        r = _login(s, ADMIN_EMAIL, ADMIN_PASSWORD, role="admin")
        assert r.status_code == 200

    def test_me_with_token(self, s, admin_token):
        r = requests.get(f"{API}/auth/me", headers=_h(admin_token))
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_me_without_token(self, s):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)

    def test_register_new_user(self, s):
        unique = f"TEST_user_{uuid.uuid4().hex[:8]}@ethara.io"
        r = s.post(f"{API}/auth/register", json={
            "name": "TEST New User",
            "email": unique,
            "password": "Pass@123",
            "role": "member",
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["email"] == unique
        assert data["user"]["role"] == "member"

    def test_register_duplicate_email(self, s):
        r = s.post(f"{API}/auth/register", json={
            "name": "Dup", "email": ADMIN_EMAIL, "password": "Pass@123", "role": "admin"
        })
        assert r.status_code == 400

    def test_forgot_and_reset_password_flow(self, s):
        # Create a fresh user to safely reset password
        email = f"TEST_reset_{uuid.uuid4().hex[:8]}@ethara.io"
        reg = s.post(f"{API}/auth/register", json={
            "name": "Reset Tester", "email": email, "password": "OldPass@1", "role": "member"
        })
        assert reg.status_code == 200

        # Forgot password — mocked, returns reset_token
        r = s.post(f"{API}/auth/forgot-password", json={"email": email})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        token = body.get("reset_token")
        assert token, "Expected reset_token in mocked forgot-password response"

        # Reset
        r2 = s.post(f"{API}/auth/reset-password", json={"token": token, "new_password": "NewPass@2"})
        assert r2.status_code == 200

        # Login with new password
        r3 = _login(s, email, "NewPass@2")
        assert r3.status_code == 200

        # Old password should fail
        r4 = _login(s, email, "OldPass@1")
        assert r4.status_code == 401

    def test_forgot_password_unknown_email(self, s):
        r = s.post(f"{API}/auth/forgot-password", json={"email": "nobody_xyz@ethara.io"})
        # Should still return 200 (no enumeration) but with reset_token=None
        assert r.status_code == 200
        assert r.json().get("reset_token") in (None, "")


# ---------- Users ----------
class TestUsers:
    def test_admin_lists_users(self, admin_token):
        r = requests.get(f"{API}/users", headers=_h(admin_token))
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list) and len(users) >= 2
        emails = [u["email"] for u in users]
        assert ADMIN_EMAIL in emails

    def test_member_can_update_self(self, member_token):
        r = requests.patch(f"{API}/users/me",
                           headers=_h(member_token),
                           json={"job_title": "TEST Engineer"})
        assert r.status_code == 200, r.text
        assert r.json()["job_title"] == "TEST Engineer"

        # Verify persistence
        r2 = requests.get(f"{API}/auth/me", headers=_h(member_token))
        assert r2.status_code == 200
        assert r2.json()["job_title"] == "TEST Engineer"


# ---------- Teams ----------
class TestTeams:
    created_team_id = None

    def test_admin_create_team(self, admin_token):
        r = requests.post(f"{API}/teams", headers=_h(admin_token), json={
            "name": f"TEST_Team_{uuid.uuid4().hex[:6]}",
            "description": "test team",
            "color": "#F97316",
            "member_ids": [],
        })
        assert r.status_code in (200, 201), r.text
        team = r.json()
        assert "id" in team
        TestTeams.created_team_id = team["id"]

    def test_admin_lists_teams(self, admin_token):
        r = requests.get(f"{API}/teams", headers=_h(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_update_team(self, admin_token):
        if not TestTeams.created_team_id:
            pytest.skip("no team created")
        r = requests.patch(f"{API}/teams/{TestTeams.created_team_id}",
                           headers=_h(admin_token),
                           json={"description": "updated desc"})
        assert r.status_code == 200, r.text
        assert r.json()["description"] == "updated desc"

    def test_admin_delete_team(self, admin_token):
        if not TestTeams.created_team_id:
            pytest.skip("no team created")
        r = requests.delete(f"{API}/teams/{TestTeams.created_team_id}", headers=_h(admin_token))
        assert r.status_code in (200, 204)


# ---------- Projects ----------
class TestProjects:
    created_project_id = None

    def test_admin_create_project(self, admin_token):
        r = requests.post(f"{API}/projects", headers=_h(admin_token), json={
            "name": f"TEST_Proj_{uuid.uuid4().hex[:6]}",
            "description": "proj",
            "status": "active",
            "priority": "high",
            "progress": 10,
        })
        assert r.status_code in (200, 201), r.text
        TestProjects.created_project_id = r.json()["id"]

    def test_admin_lists_projects(self, admin_token):
        r = requests.get(f"{API}/projects", headers=_h(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_member_lists_projects(self, member_token):
        r = requests.get(f"{API}/projects", headers=_h(member_token))
        assert r.status_code == 200
        # Members see only their projects — should return list (may be empty)
        assert isinstance(r.json(), list)

    def test_update_project(self, admin_token):
        if not TestProjects.created_project_id:
            pytest.skip()
        r = requests.patch(f"{API}/projects/{TestProjects.created_project_id}",
                           headers=_h(admin_token),
                           json={"progress": 75})
        assert r.status_code == 200, r.text
        assert r.json()["progress"] == 75


# ---------- Tasks ----------
class TestTasks:
    created_task_id = None

    def test_create_task(self, admin_token):
        payload = {
            "title": f"TEST Task {uuid.uuid4().hex[:6]}",
            "description": "kanban test",
            "status": "todo",
            "priority": "medium",
            "project_id": TestProjects.created_project_id,
        }
        r = requests.post(f"{API}/tasks", headers=_h(admin_token), json=payload)
        assert r.status_code in (200, 201), r.text
        body = r.json()
        assert body["title"] == payload["title"]
        assert body["status"] == "todo"
        TestTasks.created_task_id = body["id"]

    def test_list_tasks_with_filter(self, admin_token):
        r = requests.get(f"{API}/tasks?status=todo", headers=_h(admin_token))
        assert r.status_code == 200
        for t in r.json():
            assert t["status"] == "todo"

    def test_search_task_q(self, admin_token):
        r = requests.get(f"{API}/tasks?q=TEST", headers=_h(admin_token))
        assert r.status_code == 200

    def test_kanban_status_update(self, admin_token):
        if not TestTasks.created_task_id:
            pytest.skip()
        r = requests.patch(f"{API}/tasks/{TestTasks.created_task_id}",
                           headers=_h(admin_token), json={"status": "in_progress"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "in_progress"

        # Verify persistence
        r2 = requests.get(f"{API}/tasks/{TestTasks.created_task_id}", headers=_h(admin_token))
        assert r2.status_code == 200
        assert r2.json()["status"] == "in_progress"

    def test_delete_task(self, admin_token):
        if not TestTasks.created_task_id:
            pytest.skip()
        r = requests.delete(f"{API}/tasks/{TestTasks.created_task_id}", headers=_h(admin_token))
        assert r.status_code in (200, 204)
        # cleanup project
        if TestProjects.created_project_id:
            requests.delete(f"{API}/projects/{TestProjects.created_project_id}", headers=_h(admin_token))


# ---------- Attendance ----------
class TestAttendance:
    def _ensure_no_active(self, token):
        r = requests.get(f"{API}/attendance/active", headers=_h(token))
        if r.status_code == 200 and r.json():
            requests.post(f"{API}/attendance/punch-out", headers=_h(token))

    def test_punch_in_punch_out_flow(self, member_token):
        self._ensure_no_active(member_token)

        # punch-in
        r = requests.post(f"{API}/attendance/punch-in", headers=_h(member_token), json={"note": "TEST"})
        assert r.status_code == 200, r.text
        rec = r.json()
        assert rec["punch_out"] is None

        # active
        ra = requests.get(f"{API}/attendance/active", headers=_h(member_token))
        assert ra.status_code == 200
        assert ra.json() is not None
        assert ra.json()["id"] == rec["id"]

        # second punch-in should 400
        r2 = requests.post(f"{API}/attendance/punch-in", headers=_h(member_token), json={"note": "dup"})
        assert r2.status_code == 400, r2.text

        # wait a sec to get non-zero duration
        time.sleep(1.2)

        # punch-out
        ro = requests.post(f"{API}/attendance/punch-out", headers=_h(member_token))
        assert ro.status_code == 200, ro.text
        out = ro.json()
        assert out["punch_out"] is not None
        assert out["duration_seconds"] >= 1

        # active should be None now
        ra2 = requests.get(f"{API}/attendance/active", headers=_h(member_token))
        assert ra2.status_code == 200
        assert ra2.json() is None

    def test_punch_out_without_active(self, member_token):
        self._ensure_no_active(member_token)
        r = requests.post(f"{API}/attendance/punch-out", headers=_h(member_token))
        assert r.status_code == 400

    def test_summary(self, member_token):
        r = requests.get(f"{API}/attendance/summary", headers=_h(member_token))
        assert r.status_code == 200
        body = r.json()
        assert "days" in body and len(body["days"]) == 7
        assert "total_hours_week" in body


# ---------- Analytics ----------
class TestAnalytics:
    def test_admin_analytics(self, admin_token):
        r = requests.get(f"{API}/analytics/admin", headers=_h(admin_token))
        assert r.status_code == 200, r.text
        body = r.json()
        # keys per spec
        for k in ("totals", "task_by_status", "weekly_hours", "top_performers"):
            assert k in body, f"missing {k}"

    def test_member_analytics(self, member_token):
        r = requests.get(f"{API}/analytics/member", headers=_h(member_token))
        assert r.status_code == 200, r.text

    def test_activity(self, admin_token):
        r = requests.get(f"{API}/analytics/activity", headers=_h(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_analytics_member_forbidden(self, member_token):
        r = requests.get(f"{API}/analytics/admin", headers=_h(member_token))
        assert r.status_code in (401, 403)
