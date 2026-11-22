---
title: Polish mylab into a portfolio project
description: Clean up the mylab repository, run every check with one command, add screenshots, a short demo and a licence, and mark the result as version 1.0.0 with a git tag.
lesson: "17.1"
time: 25 min
sidebar:
  order: 1
---

<!-- lab: run
sudo apt-get install -y -qq python3-venv sqlite3 > /dev/null 2>&1
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab
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
sed -i '2i # TODO: keep only the last 7 backups' scripts/backup.sh
printf '# the analyzer as it was before Module 4, kept just in case\n' > tools/loganalyzer_old.py
cat > README.md <<'EOF'
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
git commit -q -m "mylab after Module 16"
cd ~
-->

Imagine a recruiter, a teacher or a future teammate who opens your `mylab` repository for the first time. They give it about a minute. In that minute they do not read your code: they read the first screen of the README, glance at the file list, and maybe look for a picture. This lesson is about that minute.

## Goal

After this lesson you can:

- Clean leftovers out of a project and run every one of its checks with one command.
- Add screenshots, a short reproducible demo and a licence to a repository.
- Mark a finished state of the project as a release with a git tag.

## Why it matters

A project that works but looks unfinished gets judged as unfinished. Polishing is not decoration: a check script proves the code still works, a demo shows what it does without installing anything, and a licence tells people what they may do with it. Without a licence, nobody has permission to reuse your code, even if it is public. And a tag such as `v1.0.0` gives everybody one exact version to talk about.

## The idea

**Polishing** means making a project easy to understand and easy to trust for someone who has never seen it. It is the last pass a carpenter makes on a table: no new wood, only sanding, checking every joint and signing the underside.

You add no new features in this step. You add evidence and a way in:

```text
mylab/
    LICENSE                new: what others may do with your work
    README.md              changed: screenshots, demo, tests, licence
    docs/
        demo.txt           new: a short demo with real output
        screenshots/       new: two pictures of the app
    scripts/
        check-all.sh       new: every check in one command
        demo.sh            new: writes docs/demo.txt
    ...                    everything from earlier modules
```

A **licence** is a short text that grants other people rights to your work. This course uses the **MIT licence** for its code: anyone may use, copy, change and share the code, even in commercial products, as long as they keep your copyright line and the licence text. It is short, widely known, and the usual choice for a portfolio project.

A **release** is a version of the project that you declare finished and usable. In git you mark it with a **git tag**: a name fixed to one commit that never moves, unlike a branch. Most projects name versions with **semantic versioning**, `MAJOR.MINOR.PATCH`: `1.0.0` is the first real release, `1.0.1` would fix a bug, `1.1.0` would add a feature, and `2.0.0` would change how people use it.

## Try it

This step uses `mylab` as you left it after the [Module 16 project step](../communication/project/). The lab copy used for the outputs has two typical leftovers added on purpose, so that step 2 has something to find. Where your output differs, read what yours says: that is the point.

### 1. Start from a clean state

```bash
cd ~/mylab
source .venv/bin/activate
git status --short
```

`git status --short` prints nothing: every change from now on belongs to this step.

### 2. Find the leftovers

```bash
git grep -n -E 'TODO|FIXME'
git ls-files | grep -E '_old|_copy|\.bak$'
```

```output
scripts/backup.sh:2:# TODO: keep only the last 7 backups
tools/loganalyzer_old.py
```

`git grep` searches only the files that git tracks, so it skips the `.venv` with its thousands of files. The second line lists tracked files whose name says "old", "copy" or "backup copy". These two were added to the lab copy: a TODO note in `backup.sh` and an old copy of the analyzer. If you followed the course exactly, yours may list other things, or nothing; skip the commands below for files you do not have.

Decide about each one. The old copy of the analyzer is not needed, because git keeps every earlier version in the history anyway, so remove it. The TODO is a real limit, so it moves to the README, where readers can see it:

```bash
git rm -q tools/loganalyzer_old.py
sed -i '/TODO: keep only the last 7 backups/d' scripts/backup.sh
git grep -c TODO
echo "exit status: $?"
```

```output
exit status: 1
```

`git grep -c` counts matches per file, and exit status 1 means "found nothing". A TODO is fine while you work. In a release it is either done or written down as a limit.

### 3. Put every check in one script

Your project has tests (Module 3), a write-up check (Module 14) and a rule that secrets never go into git (Modules 2 and 8). Before a release you want all of them, every time, without remembering each command:

```bash title="scripts/check-all.sh"
#!/bin/bash
# Run every check of mylab. All of them must pass before a release.
cd "$(dirname "$0")/.." || exit 1
status=0

echo "== tests"
.venv/bin/python -m pytest -q || status=1

echo "== write-ups"
./scripts/check-writeups.sh || status=1

echo "== files that must never be in git"
if git ls-files | grep -E '(^|/)\.env$|\.db$|secret_key|^\.venv/'; then
  status=1
else
  echo "none found"
fi

echo "== links in README.md"
missing=0
for f in $(grep -o -E '\]\([^)]+\)' README.md | sed -E 's/^\]\((.*)\)$/\1/' | grep -v -E '^(https?:|#)'); do
  if [ ! -e "$f" ]; then
    echo "missing: $f"
    missing=1
  fi
done
if [ "$missing" -eq 0 ]; then
  echo "all links work"
else
  status=1
fi

if [ "$status" -eq 0 ]; then
  echo "All checks passed."
else
  echo "Some checks FAILED."
fi
exit "$status"
```

The new parts:

- `.venv/bin/python -m pytest` runs pytest with the venv's Python, so the script works even when you forgot `source .venv/bin/activate`.
- `command || status=1` remembers a failure but keeps going, so one run shows every problem, not only the first.
- The link check finds every `](...)` in the README, which is how Markdown writes a link or an image, keeps only the target and drops web addresses and `#` anchors. What is left must be a file in the repository. The `for` loop splits on spaces, which is fine because your file names have none, as lesson 1.2 recommended.

<!-- lab: nocheck -->
```bash
chmod +x scripts/check-all.sh
./scripts/check-all.sh
```

```output
== tests
................                                                         [100%]
16 passed in 101.44s (0:01:41)
== write-ups
All write-ups passed.
== files that must never be in git
none found
== links in README.md
all links work
All checks passed.
```

The 16 tests are the 9 of the log analyzer and the 7 security tests of the app. Your number is higher if you did the exercises of lessons 12.7 and 15.5. Your time differs too: the output above comes from a slow virtual machine, and the slow password hashes of Module 10 make the security tests the longest part. Every section must end well. If one does not, fix it now: a release is never built on a red check.

### 4. Take two screenshots

Start the app from Module 8, log in with a test account, and take two screenshots: the login page and the notes page with two or three harmless notes. Crop each one to the browser window and save them as `docs/screenshots/login.png` and `docs/screenshots/notes.png`.

| System | Screenshot of a part of the screen |
|---|---|
| Windows | `Win` + `Shift` + `S`, then choose the area |
| macOS | `Cmd` + `Shift` + `4`, then drag over the area |
| Ubuntu | `Print Screen`, then choose the area |

<!-- lab: run
cd ~/mylab
mkdir -p docs/screenshots
python3 - <<'PYEOF'
import struct, zlib
def png(path, w, h):
    raw = b"".join(b"\x00" + b"\xf4\xf4\xf4" * w for _ in range(h))
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")
    open(path, "wb").write(data)
png("docs/screenshots/login.png", 1200, 700)
png("docs/screenshots/notes.png", 1200, 700)
PYEOF
-->

```bash
ls docs/screenshots
```

```output
login.png  notes.png
```

Before you keep a screenshot, look at every corner of it. Other browser tabs, a bookmark bar, a real email address, a session cookie in the developer tools or a token in the address bar are all leaks, and a picture is just as public as code. Use a test account, never your own.

### 5. Record a short demo

A screenshot shows the app. For the command-line tools, a text demo is better: real commands and their real output, which anyone can read in thirty seconds and you can regenerate after every change.

```bash title="scripts/demo.sh"
#!/bin/bash
# Run a short demo of the mylab tools and save it in docs/demo.txt.
cd "$(dirname "$0")/.." || exit 1

show() {
  echo "\$ $*"
  "$@"
  echo
}

{
  show python3 tools/loganalyzer.py data/sample-access.log --top 2
  show python3 tools/loganalyzer.py data/sample-access.log --status 404
} > docs/demo.txt
echo "Wrote docs/demo.txt"
```

`show` prints a command the way a terminal does, with `$ ` in front, then runs it. `$*` is all the arguments joined into one line of text, for printing. `"$@"` is the same arguments kept apart, exactly as they were given, for running. The braces send the output of both demos into one file.

```bash
chmod +x scripts/demo.sh
./scripts/demo.sh
head -n 8 docs/demo.txt
```

```output
Wrote docs/demo.txt
$ python3 tools/loganalyzer.py data/sample-access.log --top 2
Requests: 15, broken lines: 1
Top 2 IP addresses:
  198.51.100.23     6
  203.0.113.5       4
Errors: 8
  401 POST /login       from 198.51.100.23
  401 POST /login       from 198.51.100.23
```

Because a script writes the demo, the output in `docs/demo.txt` is always real and always matches the current code. If you also want a short video of the app, your system can record one: the Snipping Tool app on Windows, `Cmd` + `Shift` + `5` on macOS, and the video switch of the `Print Screen` tool on Ubuntu. Keep it under two minutes, and put it on a video site rather than in git, because videos are large.

### 6. Add the licence

```text title="LICENSE"
MIT License

Copyright (c) 2026 Sam

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Put your own name and the current year on the copyright line, and change nothing else: the value of a standard licence is that everybody already knows what it says. The file is called `LICENSE`, the usual spelling in repositories, and GitHub reads it and shows "MIT license" on the repository page. The last paragraph matters too: you give no guarantee, which is right for a learning project.

### 7. Update the README

Replace the README with this version. It keeps everything from your [Module 16 README](../communication/project/) and adds five things: a link to the demo, the two screenshots in "The notes app", a "Checks" section, the backup limit from step 2, and the licence. If you added a "Security" section in the Module 16 exercise, keep it, right before "Limits".

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

More examples with their real output: [docs/demo.txt](docs/demo.txt).

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

![The login page of the mylab notes app](docs/screenshots/login.png)

![The notes page after login, with two notes](docs/screenshots/notes-list.png)

## What is in it

- `scripts/`: Bash scripts for a system report, backups and write-up checks.
- `tools/loganalyzer.py`: the log analyzer, with its tests in `tools/test_loganalyzer.py`.
- `tools/watch_logins.py`: watches the app's log for failed logins.
- `data/sample-access.log`: a short sample log to try the analyzer on.
- `app/`: the notes app: `app/app.py`, `app/db.py` and `app/schema.sql`.
- `tests/test_security.py`: tests for the security fixes in the app.
- `docs/`: the threat model, TLS notes, hardening steps and the AI log.
- `writeups/`: write-ups of CTF practice challenges.

## Checks

~~~bash
./scripts/check-all.sh
~~~

Runs the tests, checks the write-ups, makes sure no secret file is in
git, and checks every link in this README. It must pass before a release.

## Limits

- The app runs on Flask's development server, made for one person on one
  computer, not for real traffic.
- The analyzer reads the common access log format only. Lines in any other
  format are counted as broken.
- There is no sign-up page: users are added from the terminal.
- `scripts/backup.sh` keeps every backup. Delete old ones by hand.

## License

MIT, see [LICENSE](LICENSE).

## Contact

Sam Example: [LinkedIn](https://www.linkedin.com/in/yourname)
```

Every image has alt text, a sentence that says what the picture shows, for readers who cannot see it (lesson 14.4). Now run the checks again:

```bash
./scripts/check-all.sh | tail -n 3
```

```output
== links in README.md
missing: docs/screenshots/notes-list.png
Some checks FAILED.
```

The check caught a real mistake: the file is `notes.png`, the README says `notes-list.png`. On GitHub this would have been a broken image on your project page. Fix the name and check once more, looking only at the exit status this time:

```bash
sed -i 's|docs/screenshots/notes-list.png|docs/screenshots/notes.png|' README.md
./scripts/check-all.sh > /dev/null
echo "exit status: $?"
```

```output
exit status: 0
```

### 8. Commit and tag the release

```bash
git add -A
git status --short
```

```output
A  LICENSE
M  README.md
A  docs/demo.txt
A  docs/screenshots/login.png
A  docs/screenshots/notes.png
M  scripts/backup.sh
A  scripts/check-all.sh
A  scripts/demo.sh
D  tools/loganalyzer_old.py
```

`git add -A` stages everything, deletions included. That is safe here only because you just ran the secrets check and `git status` shows exactly the files you expect. Read the list before you commit.

<!-- lab: nocheck -->
```bash
git commit -q -m "Polish for release: checks, demo, screenshots, licence"
git tag -a v1.0.0 -m "mylab 1.0.0: first portfolio release"
git log --oneline --decorate -n 1
```

```output
370ee63 (HEAD -> main, tag: v1.0.0) Polish for release: checks, demo, screenshots, licence
```

`git tag -a` makes an **annotated tag**: it stores your name, the date and a message, like a commit does. Your commit number differs. `git log` shows the tag next to the commit it marks.

```bash
git tag -n
git describe
```

```output
v1.0.0          mylab 1.0.0: first portfolio release
v1.0.0
```

`git tag -n` lists the tags with their messages. `git describe` names the current commit by the nearest tag, and it prints just `v1.0.0` because you are exactly on it. After your next commit it would print something like `v1.0.0-1-g...`: one commit after the release. The tag is still only on your computer; lesson 17.3 sends it to GitHub.

## Exercise

Screenshots straight from a large screen can be several megabytes each, which makes the repository slow to clone. Add a fifth section to `scripts/check-all.sh` that fails when any file in `docs/screenshots` is larger than 500 KB. Use `find docs/screenshots -size +500k`, which lists the files over that size. Then test both sides: create a large fake file with `head -c 600000 /dev/urandom > docs/screenshots/big.png`, run the check, and delete the file again.

<details>
<summary>Show the solution</summary>

Add this block right before the final `if [ "$status" -eq 0 ]`:

<!-- lab: skip -->
```bash
echo "== screenshot sizes"
big=$(find docs/screenshots -size +500k)
if [ -n "$big" ]; then
  echo "over 500 KB:"
  echo "$big"
  status=1
else
  echo "all under 500 KB"
fi
```

<!-- lab: run
cd ~/mylab
python3 - <<'PYEOF'
from pathlib import Path
p = Path("scripts/check-all.sh")
s = p.read_text()
block = '''echo "== screenshot sizes"
big=$(find docs/screenshots -size +500k)
if [ -n "$big" ]; then
  echo "over 500 KB:"
  echo "$big"
  status=1
else
  echo "all under 500 KB"
fi

'''
old = 'if [ "$status" -eq 0 ]; then\n  echo "All checks passed."'
assert old in s
s = s.replace(old, block + old)
p.write_text(s)
PYEOF
-->

```bash
head -c 600000 /dev/urandom > docs/screenshots/big.png
./scripts/check-all.sh | tail -n 4
rm docs/screenshots/big.png
./scripts/check-all.sh | tail -n 2
```

```output
== screenshot sizes
over 500 KB:
docs/screenshots/big.png
Some checks FAILED.
all under 500 KB
All checks passed.
```

`find -size +500k` counts in units of 1,024 bytes, so the fake file of 600,000 bytes, about 586 KB, is caught. `$(...)` keeps the list in a variable, and `-n` tests whether it is empty, as in the write-up check. If one of your real screenshots fails, crop it or save it at a smaller size, then commit the change and the new check together.

</details>

## Check yourself

**1. Why does `check-all.sh` use `|| status=1` instead of stopping at the first failure?**

<details>
<summary>Answer</summary>

So that one run shows every problem. The script remembers that something failed, keeps going, and exits with status 1 at the end. Stopping early would hide the second and third problem until you fixed the first.

</details>

**2. Your repository is public but has no licence. May other people reuse your code?**

<details>
<summary>Answer</summary>

No. Without a licence, they may read it, but they have no permission to copy, change or share it. A licence file such as MIT gives that permission and states the conditions.

</details>

**3. Why is the demo written by `scripts/demo.sh` instead of typed into a file?**

<details>
<summary>Answer</summary>

Because then the output is always real and always matches the current code. After a change you run the script again, and the demo is up to date. A typed demo goes stale without anyone noticing.

</details>

**4. What would `v1.0.1` and `v2.0.0` tell a reader about the changes since `v1.0.0`?**

<details>
<summary>Answer</summary>

With semantic versioning, `v1.0.1` means only bug fixes. `v2.0.0` means a change in how people use the project, for example a renamed option, so existing commands might stop working.

</details>

**5. What should you look for in a screenshot before you commit it?**

<details>
<summary>Answer</summary>

Anything private: other tabs, bookmarks, real names or email addresses, cookies or tokens in the developer tools or the address bar. Use a test account and crop to the window. Also check the size, so the repository stays fast to clone.

</details>

## Common mistakes

- **Adding a feature during the polish.** New code means new bugs right before a release. Write the idea down as a limit or a next step, release, and add it in `v1.1.0`.
- **Releasing with a red check.** If `check-all.sh` fails, fix the cause first. A release that does not pass its own checks tells readers that the checks mean nothing.
- **Writing your own licence text.** A home-made licence is unclear and nobody trusts it. Copy a standard one unchanged, and edit only the name and the year.
- **Tagging the wrong commit.** Run `git status` and the checks first, commit, then tag. If you tagged too early, delete the local tag with `git tag -d v1.0.0` and tag again, before you push it.
- **Screenshots of your real account.** A picture can leak an email address or a session as easily as code can. Use test data.

## Key terms

- **Polishing**: the last pass on a project that adds no features, only cleanup, checks and the things a new reader needs.
- **Licence**: a text that grants other people rights to your work and sets the conditions.
- **MIT licence**: a short licence that lets anyone use, change and share code, as long as the copyright line and the licence text are kept.
- **Release**: a version of a project that you declare finished and usable, with a version number.
- **Git tag**: a name in git fixed to one commit, used to mark releases. It never moves.
- **Annotated tag**: a tag made with `git tag -a`, which stores a message, the author and the date.
- **Semantic versioning**: numbering releases as MAJOR.MINOR.PATCH, so the number says what kind of change it is.

## Go further

- [Git Book: Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging): annotated and lightweight tags, listing them, and sending them to a remote.
- [Semantic Versioning 2.0.0](https://semver.org/): the full rules behind version numbers such as 1.0.0, in a few pages.
- [Choose a License](https://choosealicense.com/): a guide by GitHub to the common open source licences, including the full MIT text and what happens when there is none.
