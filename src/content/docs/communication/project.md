---
title: "Project step: the mylab README and your profile"
description: Rewrite the mylab README so that a stranger understands and runs the project quickly, prove every line of it in a fresh clone, then pin the project on your GitHub profile.
lesson: "16.7"
time: 25 min
sidebar:
  order: 7
---

<!-- lab: run
sudo apt-get install -y -qq python3-venv sqlite3 > /dev/null 2>&1
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab C:/Users/boule/AppData/Local/Temp/mylab-fresh
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs ~/mylab/tools ~/mylab/app/templates ~/mylab/app/static ~/mylab/docs ~/mylab/tests ~/mylab/writeups
cd ~/mylab
printf '# Secrets: never commit them\n.env\n# Temporary files\n*.tmp\n# Reports and logs that scripts write\nlogs/\n.venv/\n__pycache__/\ndata/*.db\ndata/secret_key\ndata/big-*\n' > .gitignore
printf '# server from Module 6\n' > app/server.py
printf '#!/bin/bash\n# sysinfo.sh: a short report about this machine\necho "User: $(whoami)"\n' > scripts/sysinfo.sh
printf '# What happens inside my computer\n' > notes/inside.md
printf '# TLS notes for mylab\n\nSee Module 10.\n' > docs/tls-notes.md
printf '# Hardening the machine that runs mylab\n\nSee Module 11.\n' > docs/hardening.md
cat > app/schema.sql <<'MYLAB_EOF'
-- The mylab database: users and their notes.
-- Build it with:  python3 app/db.py init

CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY,
    username   TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,  -- scrypt string from app/passwords.py, never the password
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notes (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes (user_id);
MYLAB_EOF
cat > app/passwords.py <<'MYLAB_EOF'
"""Hash and check passwords with scrypt, a slow, salted hash."""
import hashlib
import hmac
import secrets

N, R, P = 2**17, 8, 1         # the cost: memory and time
MAXMEM = 256 * 1024 * 1024    # let scrypt use up to 256 MiB


def hash_password(password):
    """Return one string with everything needed to check the password later."""
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=N, r=R, p=P, maxmem=MAXMEM)
    return f"scrypt${N}${R}${P}${salt.hex()}${digest.hex()}"


def verify_password(password, stored):
    """Return True if the password matches the stored string."""
    name, n, r, p, salt_hex, digest_hex = stored.split("$")
    if name != "scrypt":
        return False
    digest = hashlib.scrypt(
        password.encode(), salt=bytes.fromhex(salt_hex),
        n=int(n), r=int(r), p=int(p), maxmem=MAXMEM,
    )
    return hmac.compare_digest(digest.hex(), digest_hex)
MYLAB_EOF
cat > app/db.py <<'MYLAB_EOF'
"""The mylab database: create it, and add and read users and notes.

Run it from the mylab folder:
    python3 app/db.py init
    python3 app/db.py add-user USERNAME PASSWORD
    python3 app/db.py add-note USERNAME TITLE [BODY]
    python3 app/db.py notes USERNAME
    python3 app/db.py delete-note USERNAME NOTE_ID
"""
import secrets
import sqlite3
import sys
from pathlib import Path

from passwords import hash_password, verify_password

ROOT = Path(__file__).resolve().parent.parent  # the mylab folder
DB_PATH = ROOT / "data" / "mylab.db"
SCHEMA_PATH = ROOT / "app" / "schema.sql"
NO_USER_HASH = hash_password(secrets.token_hex(16))  # checked when a name does not exist


def connect():
    """Open the database, with foreign keys on and rows readable by column name."""
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


def init_db():
    """Create the tables and the index if they do not exist yet."""
    DB_PATH.parent.mkdir(exist_ok=True)
    con = connect()
    con.executescript(SCHEMA_PATH.read_text())
    con.close()


def add_user(username, password):
    """Add a user and return the new id. Raises sqlite3.IntegrityError if the name is taken."""
    con = connect()
    with con:
        cur = con.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (username, hash_password(password)),
        )
    con.close()
    return cur.lastrowid


def find_user(username):
    """Return the user's row, or None if there is no such user."""
    con = connect()
    row = con.execute(
        "SELECT id, username FROM users WHERE username = ?", (username,)
    ).fetchone()
    con.close()
    return row


def check_login(username, password):
    """Return the user's row if the name and password match, or None."""
    con = connect()
    row = con.execute(
        "SELECT id, username, password_hash FROM users WHERE username = ?", (username,)
    ).fetchone()
    con.close()
    if row is None:
        verify_password(password, NO_USER_HASH)  # take as long as for a real user
        return None
    if not verify_password(password, row["password_hash"]):
        return None
    return row


def add_note(user_id, title, body=""):
    """Add a note for a user and return the new id."""
    con = connect()
    with con:
        cur = con.execute(
            "INSERT INTO notes (user_id, title, body) VALUES (?, ?, ?)", (user_id, title, body)
        )
    con.close()
    return cur.lastrowid


def notes_for(user_id):
    """Return a list of the user's notes, oldest first."""
    con = connect()
    rows = con.execute(
        "SELECT id, title, body FROM notes WHERE user_id = ? ORDER BY id", (user_id,)
    ).fetchall()
    con.close()
    return rows


def find_notes(user_id, word):
    """Return the user's notes whose title contains the word."""
    con = connect()
    rows = con.execute(
        "SELECT id, title FROM notes WHERE user_id = ? AND title LIKE ? ORDER BY id",
        (user_id, f"%{word}%"),
    ).fetchall()
    con.close()
    return rows


def get_note(user_id, note_id):
    """Return one of the user's notes, or None if it does not exist or is not theirs."""
    con = connect()
    row = con.execute(
        "SELECT id, title, body FROM notes WHERE id = ? AND user_id = ?", (note_id, user_id)
    ).fetchone()
    con.close()
    return row


def delete_note(user_id, note_id):
    """Delete a note if it belongs to the user. Return True if a note was deleted."""
    con = connect()
    with con:
        cur = con.execute(
            "DELETE FROM notes WHERE id = ? AND user_id = ?", (note_id, user_id)
        )
    con.close()
    return cur.rowcount == 1


def main(args):
    """A small command line, for use before the web app exists."""
    if args == ["init"]:
        init_db()
        print(f"database ready: {DB_PATH.relative_to(ROOT)}")
    elif len(args) == 3 and args[0] == "add-user":
        try:
            user_id = add_user(args[1], args[2])
        except sqlite3.IntegrityError:
            print(f"the username {args[1]!r} is taken")
            return 1
        print(f"user {args[1]!r} has id {user_id}")
    elif len(args) in (3, 4) and args[0] == "add-note":
        user = find_user(args[1])
        if user is None:
            print(f"no user {args[1]!r}")
            return 1
        note_id = add_note(user["id"], args[2], args[3] if len(args) == 4 else "")
        print(f"note {note_id} saved for {args[1]!r}")
    elif len(args) == 2 and args[0] == "notes":
        user = find_user(args[1])
        if user is None:
            print(f"no user {args[1]!r}")
            return 1
        for note in notes_for(user["id"]):
            print(f"{note['id']}. {note['title']}")
            if note["body"]:
                print(f"   {note['body']}")
    elif len(args) == 3 and args[0] == "delete-note":
        user = find_user(args[1])
        note_id = int(args[2])
        if user is not None and delete_note(user["id"], note_id):
            print(f"note {note_id} deleted")
        else:
            print(f"no note {note_id} for {args[1]!r}")
            return 1
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
MYLAB_EOF
cat > app/security_log.py <<'MYLAB_EOF'
"""Write the security events of the mylab app to logs/security.log, one JSON object per line."""
import json
from datetime import datetime, timezone
from pathlib import Path

LOG_PATH = Path(__file__).resolve().parent.parent / "logs" / "security.log"


def log_event(level, event, **fields):
    """Add one event to the security log. Never pass passwords, cookies or keys."""
    record = {
        "time": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "level": level,
        "event": event,
        **fields,
    }
    LOG_PATH.parent.mkdir(exist_ok=True)
    with open(LOG_PATH, "a", encoding="utf-8") as log:
        log.write(json.dumps(record) + "\n")
MYLAB_EOF
cat > app/app.py <<'MYLAB_EOF'
"""The mylab web app: log in, read your notes, add and delete them.

Run it from the mylab folder, inside the venv:  python3 app/app.py
"""
import secrets

from flask import Flask, abort, redirect, render_template, request, session, url_for

import db
from security_log import log_event

KEY_PATH = db.ROOT / "data" / "secret_key"


def load_secret_key():
    """Read the secret key from data/secret_key, or create it the first time."""
    if not KEY_PATH.exists():
        KEY_PATH.parent.mkdir(exist_ok=True)
        KEY_PATH.write_text(secrets.token_hex(32))
        KEY_PATH.chmod(0o600)
    return KEY_PATH.read_text().strip()


app = Flask(__name__)
app.secret_key = load_secret_key()
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
db.init_db()


@app.after_request
def add_security_headers(response):
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    return response


@app.get("/")
def home():
    if "user_id" in session:
        return redirect(url_for("notes"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")
    username = request.form.get("username", "")
    user = db.check_login(username, request.form.get("password", ""))
    if user is None:
        log_event("WARNING", "login_failed", user=username[:100], ip=request.remote_addr)
        return render_template("login.html", error="Wrong username or password."), 401
    session.clear()
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    log_event("INFO", "login_ok", user=user["username"], ip=request.remote_addr)
    return redirect(url_for("notes"))


@app.post("/logout")
def logout():
    log_event("INFO", "logout", user=session.get("username"), ip=request.remote_addr)
    session.clear()
    return redirect(url_for("login"))


@app.get("/notes")
def notes():
    if "user_id" not in session:
        return redirect(url_for("login"))
    return render_template("notes.html", notes=db.notes_for(session["user_id"]))


@app.post("/notes")
def add_note():
    if "user_id" not in session:
        return redirect(url_for("login"))
    title = request.form.get("title", "").strip()
    body = request.form.get("body", "").strip()
    if not title or len(title) > 100:
        error = "A note needs a title of 1 to 100 characters."
        return render_template("notes.html", notes=db.notes_for(session["user_id"]), error=error), 400
    db.add_note(session["user_id"], title, body)
    return redirect(url_for("notes"))


@app.post("/notes/<int:note_id>/delete")
def delete_note(note_id):
    if "user_id" not in session:
        return redirect(url_for("login"))
    if not db.delete_note(session["user_id"], note_id):
        log_event("WARNING", "note_denied", user=session["username"], ip=request.remote_addr, note_id=note_id)
        abort(404)
    log_event("INFO", "note_deleted", user=session["username"], ip=request.remote_addr, note_id=note_id)
    return redirect(url_for("notes"))


@app.get("/search")
def search():
    if "user_id" not in session:
        return redirect(url_for("login"))
    q = request.args.get("q", "").strip()
    found = db.find_notes(session["user_id"], q) if q else []
    return render_template("search.html", notes=found, q=q)


@app.get("/notes/<int:note_id>")
def show_note(note_id):
    if "user_id" not in session:
        return redirect(url_for("login"))
    note = db.get_note(session["user_id"], note_id)
    if note is None:
        log_event("WARNING", "note_denied", user=session["username"], ip=request.remote_addr, note_id=note_id)
        abort(404)
    return render_template("note.html", note=note)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
MYLAB_EOF
cat > app/templates/base.html <<'MYLAB_EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{% block title %}mylab{% endblock %}</title>
  <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
</head>
<body>
  <header class="top">
    <strong>mylab notes</strong>
    {% if session.username %}
      <form action="{{ url_for('logout') }}" method="post">
        <span>Logged in as {{ session.username }}</span>
        <button type="submit">Log out</button>
      </form>
    {% endif %}
  </header>
  <main>
    {% if error %}<p class="error" role="alert">{{ error }}</p>{% endif %}
    {% block content %}{% endblock %}
  </main>
</body>
</html>
MYLAB_EOF
cat > app/templates/login.html <<'MYLAB_EOF'
{% extends "base.html" %}
{% block title %}Log in: mylab{% endblock %}
{% block content %}
  <h1>Log in</h1>
  <form action="{{ url_for('login') }}" method="post" class="card">
    <label for="username">Username</label>
    <input id="username" name="username" autocomplete="username" required>
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required>
    <button type="submit">Log in</button>
  </form>
{% endblock %}
MYLAB_EOF
cat > app/templates/notes.html <<'MYLAB_EOF'
{% extends "base.html" %}
{% block title %}Your notes: mylab{% endblock %}
{% block content %}
  <h1>Your notes</h1>
  {% for note in notes %}
    <article class="card">
      <h2><a href="{{ url_for('show_note', note_id=note.id) }}">{{ note.title }}</a></h2>
      {% if note.body %}<p>{{ note.body }}</p>{% endif %}
      <form action="{{ url_for('delete_note', note_id=note.id) }}" method="post">
        <button type="submit">Delete</button>
      </form>
    </article>
  {% else %}
    <p>No notes yet. Write the first one below.</p>
  {% endfor %}

  <h2>New note</h2>
  <form action="{{ url_for('add_note') }}" method="post" class="card">
    <label for="title">Title</label>
    <input id="title" name="title" maxlength="100" required>
    <label for="body">Text</label>
    <textarea id="body" name="body" rows="4"></textarea>
    <button type="submit">Save</button>
  </form>
{% endblock %}
MYLAB_EOF
cat > app/templates/search.html <<'MYLAB_EOF'
{% extends "base.html" %}
{% block title %}Search: mylab{% endblock %}
{% block content %}
  <h1>Search your notes</h1>
  <form action="{{ url_for('search') }}" method="get">
    <label for="q">Word in the title</label>
    <input id="q" name="q" value="{{ q }}">
    <button type="submit">Search</button>
  </form>
  {% for note in notes %}
    <p><a href="{{ url_for('show_note', note_id=note.id) }}">{{ note.title }}</a></p>
  {% else %}
    {% if q %}<p>No notes found.</p>{% endif %}
  {% endfor %}
{% endblock %}
MYLAB_EOF
cat > app/templates/note.html <<'MYLAB_EOF'
{% extends "base.html" %}
{% block title %}{{ note.title }}: mylab{% endblock %}
{% block content %}
  <p><a href="{{ url_for('notes') }}">All notes</a></p>
  <h1>{{ note.title }}</h1>
  <p class="note-body">{{ note.body }}</p>
{% endblock %}
MYLAB_EOF
cat > app/static/style.css <<'MYLAB_EOF'
/* mylab: one style sheet for every page */
body { font-family: system-ui, sans-serif; }

.note-body {
  white-space: pre-line;
}
MYLAB_EOF
cat > tests/test_security.py <<'MYLAB_EOF'
"""Security tests for mylab: each test proves that one flaw stays fixed."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))
import db  # noqa: E402
import security_log  # noqa: E402
from app import app  # noqa: E402

ATTACK = "<script>alert(1)</script>"


@pytest.fixture
def client(tmp_path, monkeypatch):
    """A test client with its own new database: sam has note 1, alex has none."""
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "test.db")
    monkeypatch.setattr(security_log, "LOG_PATH", tmp_path / "security.log")
    db.init_db()
    sam = db.add_user("sam", "test-pass-1")
    db.add_user("alex", "test-pass-2")
    db.add_note(sam, "Secret plans", "only for sam")
    return app.test_client()


def login(client, username, password):
    client.post("/login", data={"username": username, "password": password})


def test_search_cannot_be_injected(client):
    login(client, "alex", "test-pass-2")
    page = client.get("/search", query_string={"q": "x' OR 1=1 --"}).get_data(as_text=True)
    assert "Secret plans" not in page


def test_search_finds_own_notes(client):
    login(client, "sam", "test-pass-1")
    page = client.get("/search", query_string={"q": "plans"}).get_data(as_text=True)
    assert "Secret plans" in page


def test_cannot_read_another_users_note(client):
    login(client, "alex", "test-pass-2")
    assert client.get("/notes/1").status_code == 404


def test_owner_can_read_own_note(client):
    login(client, "sam", "test-pass-1")
    assert client.get("/notes/1").status_code == 200


def test_note_body_is_escaped(client):
    login(client, "alex", "test-pass-2")
    client.post("/notes", data={"title": "Test", "body": ATTACK})
    page = client.get("/notes/2").get_data(as_text=True)
    assert ATTACK not in page
    assert "&lt;script&gt;" in page


def test_security_headers(client):
    headers = client.get("/login").headers
    assert "default-src 'self'" in headers.get("Content-Security-Policy", "")
    assert headers.get("X-Content-Type-Options") == "nosniff"


def test_failed_login_is_logged_without_password(client, tmp_path):
    login(client, "sam", "wrong-guess-7")
    log = (tmp_path / "security.log").read_text()
    assert '"event": "login_failed"' in log
    assert '"user": "sam"' in log
    assert "wrong-guess-7" not in log
MYLAB_EOF
cat > data/sample-access.log <<'MYLAB_EOF'
203.0.113.5 - - [21/Nov/2026:09:58:01 +0000] "GET / HTTP/1.1" 200 1043
203.0.113.5 - - [21/Nov/2026:09:58:02 +0000] "GET /style.css HTTP/1.1" 200 312
198.51.100.23 - - [21/Nov/2026:09:59:10 +0000] "GET /login HTTP/1.1" 200 877
198.51.100.23 - - [21/Nov/2026:09:59:14 +0000] "POST /login HTTP/1.1" 401 92
198.51.100.23 - - [21/Nov/2026:09:59:15 +0000] "POST /login HTTP/1.1" 401 92
198.51.100.23 - - [21/Nov/2026:09:59:16 +0000] "POST /login HTTP/1.1" 401 92
198.51.100.23 - - [21/Nov/2026:09:59:17 +0000] "POST /login HTTP/1.1" 401 92
203.0.113.80 - - [21/Nov/2026:10:01:44 +0000] "GET /admin HTTP/1.1" 403 150
203.0.113.5 - - [21/Nov/2026:10:02:03 +0000] "GET /about HTTP/1.1" 200 2210
127.0.0.1 - - [21/Nov/2026:10:03:00 +0000] "GET /health HTTP/1.1" 200 2
203.0.113.80 - - [21/Nov/2026:10:04:12 +0000] "GET /.env HTTP/1.1" 404 153
203.0.113.80 - - [21/Nov/2026:10:04:13 +0000] "GET /backup.zip HTTP/1.1" 404 153
203.0.113.5 - - [21/Nov/2026:10:05:30 +0000] "GET /notes HTTP/1.1" 500 61
198.51.100.23 - - [21/Nov/2026:10:06:02 +0000] "POST /login HTTP/1.1" 200 640
203.0.113.80 - - [21/Nov/2026:10:06:
127.0.0.1 - - [21/Nov/2026:10:08:00 +0000] "GET /health HTTP/1.1" 200 2
MYLAB_EOF
cat > data/blocklist.txt <<'MYLAB_EOF'
# Addresses seen scanning other servers (made up for practice)
203.0.113.80
192.0.2.66

198.51.100.200
MYLAB_EOF
cat > tools/loganalyzer.py <<'MYLAB_EOF'
#!/usr/bin/env python3
"""Report the busiest IP addresses and the errors in a web server access log."""
import argparse
import sys
from collections import Counter


def parse_line(line):
    """Turn one access log line into a dict, or return None if it is broken."""
    parts = line.split()
    if len(parts) != 10:
        return None
    try:
        status = int(parts[8])
    except ValueError:
        return None
    return {
        "ip": parts[0],
        "method": parts[5].strip('"'),
        "path": parts[6],
        "status": status,
    }


def analyze(lines):
    """Count requests per IP and collect error entries (status 400 and above)."""
    ips = Counter()
    errors = []
    broken = 0
    for line in lines:
        if not line.strip():
            continue
        entry = parse_line(line)
        if entry is None:
            broken += 1
            continue
        ips[entry["ip"]] += 1
        if entry["status"] >= 400:
            errors.append(entry)
    return ips, errors, broken


def failed_logins(errors):
    """Count the failed logins (401 on /login) per IP address."""
    failed = Counter()
    for e in errors:
        if e["status"] == 401 and e["path"] == "/login":
            failed[e["ip"]] += 1
    return failed


def load_blocklist(path):
    """Read IP addresses from a file, one per line. Skip blank lines and # comments."""
    blocked = set()
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                blocked.add(line)
    return blocked


def blocked_ips(ips, blocklist):
    """Return a Counter of the counted IP addresses that are on the blocklist."""
    found = Counter()
    for ip, count in ips.items():
        if ip in blocklist:
            found[ip] = count
    return found


def filter_status(errors, status):
    """Keep only the errors with the given status code."""
    kept = []
    for e in errors:
        if e["status"] == status:
            kept.append(e)
    return kept


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("logfile", help="the access log to read")
    parser.add_argument("--top", type=int, default=3,
                        help="how many IP addresses to show (default: 3)")
    parser.add_argument("--blocklist",
                        help="a file of IP addresses to flag, one per line")
    parser.add_argument("--status", type=int,
                        help="show only the errors with this status code")
    args = parser.parse_args()

    try:
        with open(args.logfile, encoding="utf-8") as f:
            ips, errors, broken = analyze(f)
        blocklist = set()
        if args.blocklist:
            blocklist = load_blocklist(args.blocklist)
    except FileNotFoundError as error:
        print(f"error: {error.filename} not found", file=sys.stderr)
        sys.exit(1)

    shown = errors
    if args.status is not None:
        shown = filter_status(errors, args.status)

    print(f"Requests: {sum(ips.values())}, broken lines: {broken}")
    print(f"Top {args.top} IP addresses:")
    for ip, count in ips.most_common(args.top):
        print(f"  {ip:15} {count:3}")
    print(f"Errors: {len(shown)}")
    for e in shown:
        print(f"  {e['status']} {e['method']:4} {e['path']:12} from {e['ip']}")
    for ip, count in failed_logins(errors).most_common():
        print(f"Failed logins: {ip} x{count}")
    if args.blocklist:
        hits = blocked_ips(ips, blocklist)
        print(f"Blocklisted addresses seen: {len(hits)}")
        for ip, count in hits.most_common():
            print(f"  {ip:15} {count:3}")


if __name__ == "__main__":
    main()
MYLAB_EOF
cat > tools/test_loganalyzer.py <<'MYLAB_EOF'
import subprocess
import sys

from loganalyzer import analyze, blocked_ips, failed_logins, filter_status, load_blocklist, parse_line

GOOD = '203.0.113.5 - - [21/Nov/2026:09:58:01 +0000] "GET /about HTTP/1.1" 200 2210'
FAILED = '198.51.100.23 - - [21/Nov/2026:09:59:14 +0000] "POST /login HTTP/1.1" 401 92'


def test_parse_good_line():
    entry = parse_line(GOOD)
    assert entry == {"ip": "203.0.113.5", "method": "GET", "path": "/about", "status": 200}


def test_parse_cut_line():
    assert parse_line('203.0.113.80 - - [21/Nov/2026:10:06:') is None


def test_parse_status_not_a_number():
    assert parse_line(GOOD.replace(" 200 ", " OK ")) is None


def test_analyze_counts_and_errors():
    ips, errors, broken = analyze([GOOD, FAILED, FAILED, "", "garbage"])
    assert ips["198.51.100.23"] == 2
    assert ips["203.0.113.5"] == 1
    assert len(errors) == 2
    assert errors[0]["status"] == 401
    assert broken == 1


def test_failed_logins():
    ips, errors, broken = analyze([GOOD, FAILED, FAILED])
    assert failed_logins(errors) == {"198.51.100.23": 2}


def test_blocked_ips():
    ips, errors, broken = analyze([GOOD, FAILED, FAILED])
    assert blocked_ips(ips, {"198.51.100.23", "192.0.2.1"}) == {"198.51.100.23": 2}


def test_load_blocklist(tmp_path):
    path = tmp_path / "blocklist.txt"
    path.write_text("# comment\n203.0.113.80\n\n192.0.2.66\n")
    assert load_blocklist(path) == {"203.0.113.80", "192.0.2.66"}


def test_filter_status():
    ips, errors, broken = analyze([GOOD, FAILED, FAILED])
    assert len(filter_status(errors, 401)) == 2


def test_status_option_from_command_line():
    result = subprocess.run(
        [sys.executable, "tools/loganalyzer.py", "data/sample-access.log", "--status", "404"],
        capture_output=True, text=True)
    assert "Errors: 2" in result.stdout
    assert "Failed logins: 198.51.100.23 x4" in result.stdout
MYLAB_EOF
cat > tools/bench.py <<'MYLAB_EOF'
#!/usr/bin/env python3
"""Time the log analyzer on a big, made-up log and blocklist."""
import os
import random
import time

from loganalyzer import analyze, blocked_ips, load_blocklist

LOG = "data/big-access.log"
BLOCKLIST = "data/big-blocklist.txt"


def make_files():
    random.seed(7)
    prefixes = ["192.0.2.", "198.51.100.", "203.0.113."]
    paths = ["/", "/login", "/about", "/notes", "/admin", "/.env"]
    statuses = [200, 200, 200, 401, 403, 404, 500]
    with open(LOG, "w", encoding="utf-8") as f:
        for i in range(50_000):
            ip = random.choice(prefixes) + str(random.randint(1, 254))
            path = random.choice(paths)
            status = random.choice(statuses)
            f.write(f'{ip} - - [21/Nov/2026:10:00:00 +0000] "GET {path} HTTP/1.1" {status} 512\n')
    with open(BLOCKLIST, "w", encoding="utf-8") as f:
        f.write("# made-up blocklist for the benchmark\n")
        for i in range(20_000):
            f.write(f"10.0.{i // 256}.{i % 256}\n")
        f.write("203.0.113.80\n")


def timed(label, func, *args):
    start = time.perf_counter()
    result = func(*args)
    print(f"{label:15} {time.perf_counter() - start:.3f} s")
    return result


if not os.path.exists(LOG):
    make_files()

with open(LOG, encoding="utf-8") as f:
    ips, errors, broken = timed("analyze", analyze, f)
blocklist = timed("load_blocklist", load_blocklist, BLOCKLIST)
hits = timed("blocked_ips", blocked_ips, ips, blocklist)
print(f"{sum(ips.values()):,} requests from {len(ips)} addresses, "
      f"{len(blocklist):,} blocklisted ({type(blocklist).__name__}), {len(hits)} seen")
MYLAB_EOF
cat > tools/watch_logins.py <<'MYLAB_EOF'
"""Read the mylab security log and report repeated failed logins.

Run it from the mylab folder:
    python3 tools/watch_logins.py [--log FILE] [--limit N] [--minutes M]
It prints one line per alert, and exits with 1 if there was an alert, 0 if not.
"""
import argparse
import json
import sys
from collections import deque
from datetime import datetime, timedelta
from pathlib import Path

DEFAULT_LOG = Path(__file__).resolve().parent.parent / "logs" / "security.log"


def read_events(path):
    """Yield one event per line of the log, skipping lines that are not valid JSON."""
    with open(path, encoding="utf-8", errors="replace") as log:
        for line in log:
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


def find_alerts(events, limit, minutes):
    """Return alerts for addresses with `limit` failed logins within `minutes`."""
    window = timedelta(minutes=minutes)
    recent = {}       # ip -> deque of the times of its recent failed logins
    alerted = set()   # addresses that already got an alert for this burst
    alerts = []
    for event in events:
        ip = event.get("ip")
        when = datetime.fromisoformat(event["time"])
        times = recent.setdefault(ip, deque())
        while times and when - times[0] > window:
            times.popleft()                      # too old: out of the window
        if not times:
            alerted.discard(ip)                  # the burst is over
        if event.get("event") == "login_failed":
            times.append(when)
            if len(times) >= limit and ip not in alerted:
                alerted.add(ip)
                alerts.append(f"ALERT {when:%H:%M:%S} {ip} {len(times)} failed logins in {minutes} minutes")
        elif event.get("event") == "login_ok" and len(times) >= limit:
            alerts.append(f"ALERT {when:%H:%M:%S} {ip} login as {event.get('user')} after {len(times)} failed logins")
    return alerts


def main():
    parser = argparse.ArgumentParser(description="Report repeated failed logins in the mylab security log.")
    parser.add_argument("--log", default=DEFAULT_LOG, help="the log file to read")
    parser.add_argument("--limit", type=int, default=5, help="failed logins that raise an alert")
    parser.add_argument("--minutes", type=int, default=10, help="the length of the window")
    args = parser.parse_args()
    alerts = find_alerts(read_events(args.log), args.limit, args.minutes)
    for alert in alerts:
        print(alert)
    if not alerts:
        print("no alerts")
    return 1 if alerts else 0


if __name__ == "__main__":
    sys.exit(main())
MYLAB_EOF
cat > scripts/backup.sh <<'MYLAB_EOF'
#!/bin/bash
# backup.sh: make a dated, checked backup of mylab.
# Usage: scripts/backup.sh [DESTINATION]     (the default is ~/backups)
# Each run makes a new folder with a safe copy of the database,
# an archive of the other files and their checksums, then checks them.
set -e

source_dir="$HOME/mylab"
dest="${1:-$HOME/backups}"
stamp=$(date '+%Y-%m-%d_%H%M%S')
target="$dest/mylab-$stamp"

if [ ! -d "$source_dir" ]; then
  echo "Nothing to back up: $source_dir does not exist."
  exit 1
fi

umask 077   # the backup holds the secret key: only you may read it
mkdir -p "$target"
cd "$source_dir"
sqlite3 data/mylab.db ".backup '$target/mylab.db'"
tar -czf "$target/files.tar.gz" --exclude=data/mylab.db app data docs notes scripts tests tools
cd "$target"
sha256sum mylab.db files.tar.gz > SHA256SUMS

# A backup is only a backup once it has been checked.
sha256sum -c --quiet SHA256SUMS
[ "$(sqlite3 mylab.db 'PRAGMA integrity_check')" = "ok" ]
tar -tzf files.tar.gz > /dev/null
echo "Backup saved and checked: $target"
MYLAB_EOF
cat > scripts/check-writeups.sh <<'MYLAB_EOF'
#!/bin/bash
# Check every write-up: all sections present, no flag left in.
cd "$(dirname "$0")/.." || exit 1
status=0
for file in writeups/*.md; do
  if [ "$file" = "writeups/README.md" ]; then
    continue
  fi
  for section in "Summary" "Recon" "Steps" "Dead ends" "Flag" "What I learned"; do
    if ! grep -q "^## $section\$" "$file"; then
      echo "$file: missing section: $section"
      status=1
    fi
  done
  leaks=$(grep -n -E '[A-Za-z]+\{[^}]+\}' "$file" | grep -v '{REDACTED}')
  if [ -n "$leaks" ]; then
    echo "$file: possible flag:"
    echo "$leaks"
    status=1
  fi
done
if [ "$status" -eq 0 ]; then
  echo "All write-ups passed."
fi
exit "$status"
MYLAB_EOF
cat > writeups/README.md <<'MYLAB_EOF'
# Write-ups

How I solved practice challenges, step by step. Flags are redacted.
New write-ups start from [TEMPLATE.md](TEMPLATE.md), and
`scripts/check-writeups.sh` must pass before each commit.

| Challenge | Category | What it teaches |
|---|---|---|
| [Layers](layers.md) | General Skills | Recognize and reverse hex and Base64 |
| [Report](report.md) | Forensics | Trust the bytes, not the file name |
MYLAB_EOF
cat > writeups/TEMPLATE.md <<'MYLAB_EOF'
# Challenge name

- Platform:
- Category:
- Solved:

## Summary

Two or three sentences: what the challenge was and the key idea. No flag.

## Recon

What I was given, and what I noticed first.

## Steps

1. I saw ..., so I guessed ... I tested it with:

       $ command
       output

## Dead ends

What I tried that did not work, and why.

## Flag

REDACTED

## What I learned

- One thing to remember next time.
MYLAB_EOF
cat > writeups/layers.md <<'MYLAB_EOF'
# Layers

- Platform: practice challenge, lesson 14.3
- Category: General Skills, 50 points
- Solved: 2026-11-21

## Summary

The flag was hidden under two encodings, hex and then Base64. No key was
needed: recognizing each encoding and reversing it was enough.

## Recon

I was given one file, `message.txt`. The description said "encrypted
twice" and the hint said "encoding is not encryption", so I expected two
layers that need no key.

    $ file message.txt
    message.txt: ASCII text

## Steps

1. The text used only digits and the letters a to f, so I guessed hex.
   I checked that no line had any other character:

       $ grep -c '[^0-9a-f]' message.txt
       0

2. I turned the hex back into bytes:

       $ xxd -r -p message.txt
       (Base64 text removed)

3. The result used letters and digits and ended with "=", which is how
   Base64 looks, so I decoded it:

       $ xxd -r -p message.txt | base64 -d
       practice{REDACTED}

## Dead ends

None this time. If step 3 had printed unreadable bytes, I would have
looked at its first bytes with `xxd` and `head` before guessing again.

## Flag

practice{REDACTED}

## What I learned

- Text with only 0-9 and a-f is probably hex: `xxd -r -p`.
- Base64 often ends with "=": `base64 -d`.
- "Encrypted" in a description often means "encoded".
MYLAB_EOF
cat > writeups/report.md <<'MYLAB_EOF'
# Report

- Platform: practice challenge, lesson 14.3
- Category: Forensics, 100 points
- Solved: 2026-11-21

## Summary

The file was called `report.txt` but held gzip data, not text. `file`
showed the real type, and `zcat` unpacked the flag.

## Recon

I was given `report.txt`. The description said it "will not open in a
text editor", so I did not trust the name and checked the type first:

    $ file report.txt
    report.txt: gzip compressed data, from Unix, original size modulo 2^32 58

## Steps

1. `file` read the magic number and found gzip, so I guessed that
   unpacking the file would give its content. `gunzip` refused (see
   Dead ends), so I used `zcat`, which unpacks to the screen whatever
   the file is called:

       $ zcat report.txt
       Note to self: the flag is practice{REDACTED}

## Dead ends

- `gunzip report.txt` printed "unknown suffix -- ignored", because
  gunzip expects a name that ends in `.gz`.

## Flag

practice{REDACTED}

## What I learned

- A name or an extension can lie. `file` reads the bytes.
- `zcat` unpacks gzip data whatever the file is called.
MYLAB_EOF
cat > docs/threat-model.md <<'MYLAB_EOF'
# mylab threat model

## 2. What can go wrong?

| ID | Risk | L | I | Score |
|---|---|---|---|---|
| R1 | A secret is committed and published on GitHub | 2 | 3 | 6 |
| R2 | The database is lost: dead disk or deleted by mistake | 2 | 2 | 4 |
| R3 | Passwords are stored as plain text in the database | 1 | 3 | 3 |
| R4 | A form lets someone inject SQL or HTML into the app | 1 | 3 | 3 |
| R5 | A logged-in user can read another user's notes | 1 | 3 | 3 |
| R6 | Nobody notices repeated failed logins | 3 | 1 | 3 |
| R7 | Every user of the computer can read data/mylab.db | 1 | 2 | 2 |

## 3. What are we going to do about it?

| ID | Plan | When |
|---|---|---|
| R1 | Run git ls-files before every push; keep secrets out of the code | Now |
| R2 | Back up data/mylab.db to another device | Done in Module 13 |
| R3 | Store salted, slow password hashes | Done in Module 10 |
| R4 | Fix injection and XSS, and add tests | Done in Module 12 |
| R5 | Check on the server that each note belongs to the user | Done in Module 12 |
| R6 | Structured logs and an alert on failed logins | Done in Module 13 |
| R7 | chmod 600 data/mylab.db | Done in Module 9 |
MYLAB_EOF
cat > docs/ai-log.md <<'MYLAB_EOF'
# AI log

How I used AI tools in mylab, and how I checked what they gave me.
Rule: nothing is committed that I have not read, run and tested.

## 2026-11-21: --status option for the log analyzer

- Tool: an AI chat assistant
- Files: tools/loganalyzer.py, tools/test_loganalyzer.py

### Request

A --status option that lists only the errors with one status code.
Limits: standard library only, no change without --status, a function
I can test. Example: --status 404 on data/sample-access.log lists 2 errors.

### What the AI gave

A filter_status() function, the --status option, two lines in main()
and one test.

### How I checked it

1. Read the diff line by line.
2. Ran the tests: all passed, including the new one.
3. Ran the real command: --status 404 printed "Errors: 0" instead of 2,
   and the "Failed logins" line was gone.
4. Cause: argparse gives "404" as a string, and 404 == "404" is False.
   The AI's test passed an int, so it could not see the problem.
5. Cause of the missing line: the filter replaced the list that
   failed_logins() uses.

### What I changed

- Added type=int to --status.
- Filtered into a new list, shown; failed_logins() still gets every error.
- Added a test that runs the command the way a user does. It failed
  before the fix and passes after it.

### Result

--status 404 lists the 2 expected errors. Without --status the report is
unchanged (checked with diff). --status abc is refused. 9 tests pass.

### What I learned

A test written together with the code can share its mistake.
Test the feature the way it is used.
MYLAB_EOF
chmod +x scripts/*.sh
cat > README.md <<'EOF'
# mylab

My lab for the PID 1 course.

## What is in it

- `scripts/sysinfo.sh`: prints a short report about this machine.
- `scripts/backup.sh`: copies the important folders of mylab into `~/backups`.

## How to use it

Run `scripts/sysinfo.sh` from the mylab folder to see the report.
Run `scripts/backup.sh` to make a dated backup.

The project grows with each module of the course.
EOF
python3 -m venv .venv
.venv/bin/pip install -q pytest flask > /dev/null 2>&1
.venv/bin/pip freeze > requirements.txt
python3 app/db.py init > /dev/null
python3 app/db.py add-user sam test-pass-1 > /dev/null
python3 app/db.py add-user alex test-pass-2 > /dev/null
python3 app/db.py add-note sam "Lab ideas" "Try the database from Module 7" > /dev/null
python3 app/db.py add-note sam "Ports to remember" "22 ssh, 80 http, 443 https" > /dev/null
python3 app/db.py add-note alex "Hello" > /dev/null
python3 app/db.py delete-note sam 1 > /dev/null
python3 app/db.py add-user kim test-pass-3 > /dev/null
chmod 600 data/mylab.db
git init -q
git add .
git commit -q -m "mylab after Module 15"
cd ~
-->

Every module so far added something to `mylab`, and its README still says what it said in Module 2: two scripts and "the project grows". A visitor sees a folder full of tools, an app and security notes, with a front page that explains none of it. In this step you rewrite the README with everything from this module, prove that every line of it is true, and put the project where people will see it first.

## Goal

After this lesson you can:

- Rewrite the `mylab` README so that its first screen says what it is, shows a real result and gets a stranger running it.
- Check the README with commands: every file it names exists, its example matches the real output, and its quick start works in a fresh clone.
- Pin `mylab` on your GitHub profile and link it from your CV and LinkedIn.

## Why it matters

`mylab` is the project you will show in applications and talk about in interviews. Most people who open it will read the README and nothing else. A front page that explains the project in ten seconds, with a quick start that really works, turns a folder of course exercises into something a recruiter can understand and an engineer can try.

## The idea

You apply the template from lesson 16.3 to `mylab`, and you reuse three things you prepared in this module: the one-sentence version and the demo command from lesson 16.2, and the check for named files from lesson 16.3. Only one file changes:

```text
mylab/
    README.md      rewritten: what it is, example, quick start, contents, limits
    ...            everything from earlier modules, unchanged
```

Then you check the README the way you would check code. A README is documentation, and documentation that has never been tested is as likely to be wrong as code that has never been run. The checks are like a building inspection before people move in: you do not trust the plan, you walk through the real building. The strongest check is a **fresh clone**: a new copy made with `git clone`, which holds only what is committed, exactly like a visitor's copy.

## Try it

This step uses `mylab` as you left it after Module 15. The outputs come from a user called `sam`. If your old README or your new one differs from the ones here, the line counts in step 6 differ too.

### 1. Read the old README as a stranger

```bash
cd ~/mylab
git status --short
head -n 5 README.md
ls
```

```output
# mylab

My lab for the PID 1 course.

## What is in it
README.md  data  logs   requirements.txt  tests  writeups
app        docs  notes  scripts           tools
```

`git status --short` prints nothing: you start from a clean state. The first lines of the README say almost nothing, and the list of folders shows how much is missing from it: `app`, `tools`, `docs`, `tests`, `writeups`, none of which the README mentions.

### 2. Get the real example output

```bash
python3 tools/loganalyzer.py data/sample-access.log --status 404 --top 1
```

```output
Requests: 15, broken lines: 1
Top 1 IP addresses:
  198.51.100.23     6
Errors: 2
  404 GET  /.env        from 203.0.113.80
  404 GET  /backup.zip  from 203.0.113.80
Failed logins: 198.51.100.23 x4
```

This is the demo from lesson 16.2: seven lines that show a scan for secret files and password guessing. It goes into the README exactly as printed.

### 3. Write the new README

Replace the whole of `README.md`. As in lesson 16.3, the code blocks inside it start and end with `~~~`, which Markdown treats exactly like three backticks. Put your own name and links in the last section.

```markdown title="README.md"
# mylab

A small Linux lab, built and secured step by step: Bash scripts, a log
analyzer that spots password guessing and scans for secret files in web
server logs, and a Flask notes app with a login.

~~~bash
python3 tools/loganalyzer.py data/sample-access.log --status 404 --top 1
~~~

~~~text
Requests: 15, broken lines: 1
Top 1 IP addresses:
  198.51.100.23     6
Errors: 2
  404 GET  /.env        from 203.0.113.80
  404 GET  /backup.zip  from 203.0.113.80
Failed logins: 198.51.100.23 x4
~~~

## Quick start

Tested on Ubuntu 24.04 with Python 3.12.

~~~bash
git clone https://github.com/yourname/mylab.git
cd mylab
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 tools/loganalyzer.py data/sample-access.log
pytest -q
~~~

## The notes app

~~~bash
python3 app/db.py init
python3 app/db.py add-user USERNAME PASSWORD
python3 app/app.py
~~~

Then open http://127.0.0.1:5000 in a browser. The app listens on your
own computer only. It is a learning project: do not put it on the internet.

## What is in it

- `scripts/`: Bash scripts for a system report, backups and write-up checks.
- `tools/loganalyzer.py`: the log analyzer, with its tests in `tools/test_loganalyzer.py`.
- `tools/watch_logins.py`: watches the app's log for failed logins.
- `data/sample-access.log`: a short sample log to try the analyzer on.
- `app/`: the notes app: `app/app.py`, `app/db.py` and `app/schema.sql`.
- `tests/test_security.py`: tests for the security fixes in the app.
- `docs/`: the threat model, TLS notes, hardening steps and the AI log.
- `writeups/`: write-ups of CTF practice challenges.

## Limits

- The app runs on Flask's development server, made for one person on one
  computer, not for real traffic.
- The analyzer reads the common access log format only. Lines in any other
  format are counted as broken.
- There is no sign-up page: users are added from the terminal.

## License

None yet. Until a license is added, people may read the code, but they
have no permission to reuse it.

## Contact

Sam Example: [LinkedIn](https://www.linkedin.com/in/yourname)
```

The first screen holds the one-sentence description, the example and the quick start. The quick start covers the part anyone can run in a minute, the analyzer and the tests. The app has its own short section, because it needs a database and a user first. The commands in it are the ones you used in Module 8.

### 4. Check every file it names

The check from lesson 16.3, with two changes: it accepts any name with a `/` in it, such as `scripts/`, and it knows a few more file endings.

```bash
grep -o -E '`[A-Za-z0-9_./-]+`' README.md | tr -d '`' | grep -E '/|\.(py|sh|md|sql|log|txt)$' | sort -u | while read -r f; do
  if [ -e "$f" ]; then echo "ok       $f"; else echo "MISSING  $f"; fi
done
```

```output
ok       app/
ok       app/app.py
ok       app/db.py
ok       app/schema.sql
ok       data/sample-access.log
ok       docs/
ok       scripts/
ok       tests/test_security.py
ok       tools/loganalyzer.py
ok       tools/test_loganalyzer.py
ok       tools/watch_logins.py
ok       writeups/
```

The second `grep` keeps only the names that look like paths, so a backticked word such as an option name is not checked. Every path the README names is real.

### 5. Check that the example is the real output

```bash
awk '/^~~~text$/ {inside = 1; next} /^~~~$/ {if (inside) exit} inside' README.md > /tmp/readme-example.txt
python3 tools/loganalyzer.py data/sample-access.log --status 404 --top 1 | diff /tmp/readme-example.txt - && echo "example matches"
```

```output
example matches
```

`awk` reads the file line by line. The first rule starts recording after the line `~~~text`, the second stops at the next `~~~`, and the bare word `inside` at the end prints every line while recording is on. So `/tmp/readme-example.txt` holds the example output from the README. `diff` compares it with a fresh run, and prints nothing when they are the same. If you change the analyzer one day and forget the README, this check tells you.

### 6. Follow the quick start in a fresh clone

Commit first, because a clone contains only what is committed:

```bash
git add README.md
git diff --cached --stat
git commit -q -m "Rewrite the README: what it is, example, quick start, contents, limits"
```

```output
 README.md | 71 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++-------
 1 file changed, 64 insertions(+), 7 deletions(-)
```

`git diff --cached --stat` sums up what is staged: one file, mostly new lines. Now clone it somewhere new, and run the quick start line by line, with the local folder in place of the GitHub address:

```bash
git clone -q ~/mylab /tmp/mylab-fresh
cd /tmp/mylab-fresh
python3 -m venv .venv
source .venv/bin/activate
pip install -q -r requirements.txt
python3 tools/loganalyzer.py data/sample-access.log | head -n 2
pytest -q | tail -n 1 | cut -d " " -f 1,2
```

```output
Requests: 15, broken lines: 1
Top 3 IP addresses:
16 passed
```

The fresh clone has no `.venv` and no installed packages, exactly like a visitor's computer. The README's commands created the venv, installed what `requirements.txt` lists, ran the analyzer and passed all sixteen tests: the 9 of the analyzer in `tools/` and the 7 security tests in `tests/`, because `pytest` finds every test file in the project. `cut` keeps the first two words of pytest's last line, because the time after them changes on every run. If you did the exercises of lessons 12.7 and 15.5, your number is higher. The quick start is proven.

```bash
deactivate
cd ~/mylab
rm -rf /tmp/mylab-fresh
```

`deactivate` leaves the venv of the clone, and the clone itself is no longer needed.

### 7. Publish it and pin it

Send the commit to GitHub, as in Module 2:

<!-- lab: skip -->
```bash
git push
```

Then, on GitHub, in your browser:

1. Open the `mylab` repository and check that the README looks right, with its code blocks and list.
2. Next to "About" on the repository page, click the gear icon. Add the one-sentence description from the README and a few topics, such as `linux`, `python`, `flask` and `security`.
3. On your profile page, choose "Customize your pins" and pin `mylab` first.
4. Add the repository link to your CV and to the Featured section of LinkedIn, as in lesson 16.4.

Before you pin, look once more at what the repository shows, with the check from lesson 16.4: `git log --format='%an <%ae>' | sort -u` must show only a name and an email you are happy to make public.

## Exercise

A visitor who cares about security will look for what you did to protect the app. Add a section `## Security` to the README, between "What is in it" and "Limits". In three to five bullets, say what was done and point to the document or test that shows it: the threat model, the password storage, the fixed web flaws and their tests, the hardening notes. Then run the file check from step 4 again and commit.

<details>
<summary>Show the solution</summary>

One possible section. Write only what is true for your own `mylab`:

```markdown
## Security

- Threat model: what can go wrong and what matters most, in `docs/threat-model.md`.
- Passwords are stored as salted, slow hashes, never as plain text.
- Injection, cross-site scripting and broken access control were tested
  and fixed, each with a test in `tests/test_security.py`.
- Hardening steps for the Linux system are in `docs/hardening.md`.
- How AI help was used and checked: `docs/ai-log.md`.
```

<!-- lab: run
cd ~/mylab
python3 - <<'PYEOF'
from pathlib import Path
p = Path("README.md")
s = p.read_text()
add = """## Security

- Threat model: what can go wrong and what matters most, in `docs/threat-model.md`.
- Passwords are stored as salted, slow hashes, never as plain text.
- Injection, cross-site scripting and broken access control were tested
  and fixed, each with a test in `tests/test_security.py`.
- Hardening steps for the Linux system are in `docs/hardening.md`.
- How AI help was used and checked: `docs/ai-log.md`.

"""
assert "## Limits" in s
s = s.replace("## Limits", add + "## Limits")
p.write_text(s)
PYEOF
-->

```bash
grep -o -E '`[A-Za-z0-9_./-]+`' README.md | tr -d '`' | grep -E '/|\.(py|sh|md|sql|log|txt)$' | sort -u | while read -r f; do
  if [ -e "$f" ]; then echo "ok       $f"; else echo "MISSING  $f"; fi
done | grep docs/
```

```output
ok       docs/
ok       docs/ai-log.md
ok       docs/hardening.md
ok       docs/threat-model.md
```

The final `grep docs/` keeps only the lines about `docs/`, to make the new names easy to see; without it, you get the full list from step 4 plus these. Then commit:

```bash
git add README.md
git commit -q -m "README: add a security section"
git log --oneline | head -n 2 | cut -d " " -f 2-
```

```output
README: add a security section
Rewrite the README: what it is, example, quick start, contents, limits
```

</details>

## Check yourself

**1. Why must you commit the README before testing it in a fresh clone?**

<details>
<summary>Answer</summary>

A clone contains only what is committed. If you clone before committing, you test the old README, not the new one.

</details>

**2. What does the check in step 5 prove, and when would it fail?**

<details>
<summary>Answer</summary>

That the example output in the README is exactly what the analyzer prints today. It fails as soon as the analyzer's output changes and the README is not updated.

</details>

**3. Why does the quick start cover the analyzer and the tests, but not the app?**

<details>
<summary>Answer</summary>

Because the quick start should be the shortest path to a working run. The analyzer and the tests need nothing but the venv. The app needs a database and a user first, so it has its own section.

</details>

**4. Why does the README have a "Limits" section that admits weaknesses?**

<details>
<summary>Answer</summary>

So that nobody mistakes a learning project for a production one: for example, the app runs on a development server. Honest limits also make the rest of the README more believable.

</details>

**5. What three things make the pinned `mylab` card on GitHub say what the project is?**

<details>
<summary>Answer</summary>

The repository description and topics in its About box, and the README that a visitor sees when they open it.

</details>

## Common mistakes

- **Writing the README from memory.** Paths and outputs drift. Copy the example from a real run, and run the file check after every change.
- **Testing in your own folder only.** Your folder has a venv, a database and files that git ignores. Only a fresh clone shows what a visitor gets.
- **Forgetting the old content.** The Module 2 README explained the two scripts. The new "What is in it" still mentions `scripts/`, so nothing a reader needs was lost.
- **Claiming security work that is not there.** Every bullet in a security section should point to a document or a test. If you skipped a module, leave its bullet out.
- **Pushing before checking.** Run the checks from steps 4 to 6 first. A broken quick start on your pinned project is the first thing a visitor finds.

## Key terms

- **Fresh clone**: a new copy of a repository made with git clone, holding only what is committed, used to test a project the way a visitor gets it.

## Go further

- [GitHub Docs: Classifying your repository with topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics): how to add topics to a repository.
- [GitHub Docs: Basic writing and formatting syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax): code blocks, lists, links and the rest of the Markdown that GitHub shows.
- [GNU Awk User's Guide](https://www.gnu.org/software/gawk/manual/gawk.html): the reference for `awk`, if you want to understand the one-line program in step 5.
