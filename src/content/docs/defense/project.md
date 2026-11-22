---
title: "Project step: logging and alerts for mylab"
description: Give the mylab app a structured security log, write a tool that flags repeated failed logins, and turn backup.sh into a backup that copies the database safely and checks itself.
lesson: "13.7"
time: 25 min
sidebar:
  order: 7
---

<!-- lab: run
curl() { command curl --no-progress-meter "$@"; }
sudo apt-get install -y -q python3-venv sqlite3 > /dev/null 2>&1
printf '.headers on\n.mode table\n' > ~/.sqliterc
pkill -f app/app.py
pkill -f websec/
rm -f /tmp/sam.txt /tmp/alex.txt /tmp/kim.txt
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab ~/backups
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs ~/mylab/tools ~/mylab/app/templates ~/mylab/app/static ~/mylab/docs ~/mylab/tests
cd ~/mylab
printf '# mylab\n\nMy lab for the PID 1 course.\n' > README.md
printf '# Secrets: never commit them\n.env\n# Temporary files\n*.tmp\n# Reports and logs that scripts write\nlogs/\n.venv/\n__pycache__/\ndata/*.db\ndata/secret_key\n' > .gitignore
printf '# server from Module 6\n' > app/server.py
printf '203.0.113.5 - - [21/Nov/2026:09:58:01 +0000] "GET / HTTP/1.1" 200 1043\n' > data/sample-access.log
cat > app/schema.sql <<'EOF'
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
EOF
cat > app/passwords.py <<'EOF'
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
EOF
cat > app/db.py <<'EOF'
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
EOF
cat > app/app.py <<'EOF'
"""The mylab web app: log in, read your notes, add and delete them.

Run it from the mylab folder, inside the venv:  python3 app/app.py
"""
import secrets

from flask import Flask, abort, redirect, render_template, request, session, url_for

import db

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


@app.get("/")
def home():
    if "user_id" in session:
        return redirect(url_for("notes"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")
    user = db.check_login(request.form.get("username", ""), request.form.get("password", ""))
    if user is None:
        return render_template("login.html", error="Wrong username or password."), 401
    session.clear()
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    return redirect(url_for("notes"))


@app.post("/logout")
def logout():
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
        abort(404)
    return redirect(url_for("notes"))


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
EOF
cat > app/templates/base.html <<'EOF'
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
EOF
cat > app/templates/login.html <<'EOF'
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
EOF
cat > app/templates/notes.html <<'EOF'
{% extends "base.html" %}
{% block title %}Your notes: mylab{% endblock %}
{% block content %}
  <h1>Your notes</h1>
  {% for note in notes %}
    <article class="card">
      <h2>{{ note.title }}</h2>
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
EOF
printf '/* mylab: one style sheet for every page */\nbody { font-family: system-ui, sans-serif; }\n' > app/static/style.css
cat > docs/threat-model.md <<'EOF'
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
| R2 | Back up data/mylab.db to another device | Module 13 |
| R3 | Store salted, slow password hashes | Done in Module 10 |
| R4 | Fix injection and XSS, and add tests | Module 12 |
| R5 | Check on the server that each note belongs to the user | Module 12 |
| R6 | Structured logs and an alert on failed logins | Module 13 |
| R7 | chmod 600 data/mylab.db | Done in Module 9 |
EOF
printf '# TLS notes for mylab\n\nSee Module 10.\n' > docs/tls-notes.md
printf '# Hardening the machine that runs mylab\n\nSee Module 11.\n' > docs/hardening.md
python3 app/db.py init > /dev/null
python3 app/db.py add-user sam test-pass-1 > /dev/null
python3 app/db.py add-user alex test-pass-2 > /dev/null
python3 app/db.py add-note sam "Lab ideas" "Try the database from Module 7" > /dev/null
python3 app/db.py add-note sam "Ports to remember" "22 ssh, 80 http, 443 https" > /dev/null
python3 app/db.py add-note alex "Hello" > /dev/null
python3 app/db.py delete-note sam 1 > /dev/null
python3 app/db.py add-user kim test-pass-3 > /dev/null
chmod 600 data/mylab.db
python3 -m venv .venv
.venv/bin/pip install -q pytest flask > /dev/null 2>&1
.venv/bin/pip freeze > requirements.txt
cat > scripts/backup.sh <<'EOF'
#!/bin/bash
# backup.sh: copy the important folders of mylab into ~/backups
# Each run makes a new folder named after the date and time.

source_dir="$HOME/mylab"
stamp=$(date '+%Y-%m-%d_%H%M%S')
target="$HOME/backups/mylab-$stamp"

if [ ! -d "$source_dir" ]; then
  echo "Nothing to back up: $source_dir does not exist."
  exit 1
fi

mkdir -p "$target"
for folder in scripts notes data; do
  cp -r "$source_dir/$folder" "$target/"
  echo "Copied $folder"
done
echo "Backup saved in $target"
EOF
printf '#!/bin/bash\n# sysinfo.sh: a short report about this machine\necho "User: $(whoami)"\n' > scripts/sysinfo.sh
chmod +x scripts/backup.sh scripts/sysinfo.sh
touch notes/.keep
cd ~/mylab
python3 - <<'EOF'
path = "app/db.py"
code = open(path).read()
funcs = '''def find_notes(user_id, word):
    """Return the user's notes whose title contains the word."""
    con = connect()
    rows = con.execute(
        f"SELECT id, title FROM notes WHERE user_id = {user_id} AND title LIKE '%{word}%' ORDER BY id"
    ).fetchall()
    con.close()
    return rows


def get_note(note_id):
    """Return one note, or None."""
    con = connect()
    row = con.execute(
        "SELECT id, user_id, title, body FROM notes WHERE id = ?", (note_id,)
    ).fetchone()
    con.close()
    return row


'''
assert "def delete_note(" in code
code = code.replace("def delete_note(", funcs + "def delete_note(", 1)
open(path, "w").write(code)

path = "app/app.py"
code = open(path).read()
routes = '''@app.get("/search")
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
    note = db.get_note(note_id)
    if note is None:
        abort(404)
    return render_template("note.html", note=note)


'''
assert 'if __name__' in code
code = code.replace('if __name__', routes + 'if __name__', 1)
open(path, "w").write(code)

path = "app/templates/notes.html"
code = open(path).read()
old = "      <h2>{{ note.title }}</h2>\n"
new = "      <h2><a href=\"{{ url_for('show_note', note_id=note.id) }}\">{{ note.title }}</a></h2>\n"
assert old in code
open(path, "w").write(code.replace(old, new, 1))
EOF
cat > app/templates/search.html <<'EOF'
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
EOF
cat > app/templates/note.html <<'EOF'
{% extends "base.html" %}
{% block title %}{{ note.title }}: mylab{% endblock %}
{% block content %}
  <p><a href="{{ url_for('notes') }}">All notes</a></p>
  <h1>{{ note.title }}</h1>
  <p>{{ note.body | replace("\n", "<br>") | safe }}</p>
{% endblock %}
EOF
cd ~/mylab
python3 - <<'EOF'
def edit(path, old, new):
    code = open(path).read()
    assert old in code, (path, old)
    open(path, "w").write(code.replace(old, new, 1))

edit("app/db.py", '''    rows = con.execute(
        f"SELECT id, title FROM notes WHERE user_id = {user_id} AND title LIKE '%{word}%' ORDER BY id"
    ).fetchall()''', '''    rows = con.execute(
        "SELECT id, title FROM notes WHERE user_id = ? AND title LIKE ? ORDER BY id",
        (user_id, f"%{word}%"),
    ).fetchall()''')
edit("app/db.py", '''def get_note(note_id):
    """Return one note, or None."""
    con = connect()
    row = con.execute(
        "SELECT id, user_id, title, body FROM notes WHERE id = ?", (note_id,)
    ).fetchone()''', '''def get_note(user_id, note_id):
    """Return one of the user's notes, or None if it does not exist or is not theirs."""
    con = connect()
    row = con.execute(
        "SELECT id, title, body FROM notes WHERE id = ? AND user_id = ?", (note_id, user_id)
    ).fetchone()''')
edit("app/app.py", "    note = db.get_note(note_id)\n", '    note = db.get_note(session["user_id"], note_id)\n')
edit("app/app.py", "db.init_db()\n", '''db.init_db()


@app.after_request
def add_security_headers(response):
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    return response
''')
edit("app/templates/note.html", '  <p>{{ note.body | replace("\\n", "<br>") | safe }}</p>\n', '  <p class="note-body">{{ note.body }}</p>\n')
with open("app/static/style.css", "a") as f:
    f.write("\n.note-body {\n  white-space: pre-line;\n}\n")
EOF
cd ~/mylab
cat > tests/test_security.py <<'EOF'
"""Security tests for mylab: each test proves that one flaw stays fixed."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))
import db  # noqa: E402
from app import app  # noqa: E402

ATTACK = "<script>alert(1)</script>"


@pytest.fixture
def client(tmp_path, monkeypatch):
    """A test client with its own new database: sam has note 1, alex has none."""
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "test.db")
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
EOF
sed -i 's/| Module 12 |$/| Done in Module 12 |/' docs/threat-model.md
git init -q
git add .
git commit -q -m "mylab after Module 12"
cd ~
-->

Your threat model from Module 9 still has two open lines. R6 says "nobody notices repeated failed logins", and R2 says "the database is lost". Right now, if someone tried a hundred passwords on your app, the only trace would be a hundred `POST /login` lines in Flask's output, with no username and no result. And `backup.sh` still copies the database with `cp`. Today you close both lines with what this module taught.

## Goal

After this lesson you can:

- Add a structured security log to the `mylab` app, and test that it never contains a password.
- Write `tools/watch_logins.py`, which flags an address with too many failed logins in a short time.
- Turn `scripts/backup.sh` into a backup that copies the database safely, protects the files and checks its own result.

## Why it matters

These are the defenses that real web apps are judged on: the OWASP Top 10:2025 of lesson 12.1 lists missing logs and alerts as its own category, A09 Security Logging and Alerting Failures. A login page that can be guessed at without anyone noticing is one of the most common ways in. And every incident response plan ends with "restore from backup", which assumes that a good backup exists. After this step, `mylab` has the three things a defender needs: evidence, an alert, and a way back.

## The idea

Three parts, each from a lesson of this module:

```text
mylab/
    app/
        security_log.py       new: log_event() writes JSON lines (13.2)
        app.py                logs logins, logouts and note access
    logs/security.log         written by the app, ignored by git
    tools/watch_logins.py     new: reads the log, raises alerts (13.3, 13.6)
    tests/test_security.py    + a test that the log has no password
    scripts/backup.sh         safe database copy, checksums, self-check (13.5)
    docs/threat-model.md      R2 and R6 are closed
```

The watcher uses a **sliding window**: for each address, it keeps the times of its failed logins in the last 10 minutes, and drops the older ones as new events arrive. Five failures inside the window raise an alert. A window matters because the same five failures spread over a month are just people mistyping their passwords. It is the same idea as a speed camera that measures your time between two points: one point tells you nothing, two points and a clock tell you the speed.

## Try it

This step continues the `mylab` repository from the [Module 12 project step](../web-security/project/): users `sam` with `test-pass-1`, `alex` with `test-pass-2` and `kim`, the fixed app with its security tests, and `backup.sh` from the [Module 1 project step](../linux/project/). `jq` comes from lesson 13.2.

### 1. Write the security log

```bash
cd ~/mylab
source .venv/bin/activate
```

```python title="app/security_log.py"
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
```

The fields are the ones from lesson 13.2, and `json.dumps` again keeps each event on one line, whatever a user types. This version writes the file directly instead of using the `logging` module, for one reason: the tests can point `LOG_PATH` at a temporary file, exactly as they already do with the database. Opening the file in mode `"a"` (append) adds each line at the end, so nothing is ever overwritten.

### 2. Log the events in the app

In `app/app.py`, add one import, right after `import db`:

```python
from security_log import log_event
```

Then replace the `login` and `logout` functions:

```python
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
```

And in `show_note` and `delete_note`, log every refused note, and every deleted one:

```python
    note = db.get_note(session["user_id"], note_id)
    if note is None:
        log_event("WARNING", "note_denied", user=session["username"], ip=request.remote_addr, note_id=note_id)
        abort(404)
```

```python
    if not db.delete_note(session["user_id"], note_id):
        log_event("WARNING", "note_denied", user=session["username"], ip=request.remote_addr, note_id=note_id)
        abort(404)
    log_event("INFO", "note_deleted", user=session["username"], ip=request.remote_addr, note_id=note_id)
    return redirect(url_for("notes"))
```

<!-- lab: run
cd ~/mylab
python3 - <<'EOF'
def edit(path, old, new):
    code = open(path).read()
    assert old in code, (path, old)
    open(path, "w").write(code.replace(old, new, 1))

edit("app/app.py", "import db\n", "import db\nfrom security_log import log_event\n")
edit("app/app.py", '''    user = db.check_login(request.form.get("username", ""), request.form.get("password", ""))
    if user is None:
        return render_template("login.html", error="Wrong username or password."), 401
    session.clear()
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    return redirect(url_for("notes"))''', '''    username = request.form.get("username", "")
    user = db.check_login(username, request.form.get("password", ""))
    if user is None:
        log_event("WARNING", "login_failed", user=username[:100], ip=request.remote_addr)
        return render_template("login.html", error="Wrong username or password."), 401
    session.clear()
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    log_event("INFO", "login_ok", user=user["username"], ip=request.remote_addr)
    return redirect(url_for("notes"))''')
edit("app/app.py", '''def logout():
    session.clear()''', '''def logout():
    log_event("INFO", "logout", user=session.get("username"), ip=request.remote_addr)
    session.clear()''')
edit("app/app.py", '''    note = db.get_note(session["user_id"], note_id)
    if note is None:
        abort(404)''', '''    note = db.get_note(session["user_id"], note_id)
    if note is None:
        log_event("WARNING", "note_denied", user=session["username"], ip=request.remote_addr, note_id=note_id)
        abort(404)''')
edit("app/app.py", '''    if not db.delete_note(session["user_id"], note_id):
        abort(404)
    return redirect(url_for("notes"))''', '''    if not db.delete_note(session["user_id"], note_id):
        log_event("WARNING", "note_denied", user=session["username"], ip=request.remote_addr, note_id=note_id)
        abort(404)
    log_event("INFO", "note_deleted", user=session["username"], ip=request.remote_addr, note_id=note_id)
    return redirect(url_for("notes"))''')
EOF
-->

Look at what is logged and what is not. A failed login logs the name that was typed, cut to 100 characters with `[:100]` so that nobody can fill the disk with one giant username, but never the password. `request.remote_addr` is the address the request came from. A `note_denied` event is what broken access control looks like from the inside: someone asking for a note that is not theirs, as alex did in lesson 12.7. Both kinds of 404 are logged the same way, as the app treats them the same way.

### 3. Test the log

The tests from Module 12 would now write their logins into your real `logs/security.log`. Point the log at a temporary file in the fixture, exactly as `DB_PATH` is. In `tests/test_security.py`, add the import next to `import db`, and one line in the fixture:

```python
import security_log  # noqa: E402
```

```python
    monkeypatch.setattr(security_log, "LOG_PATH", tmp_path / "security.log")
```

Then add a test at the end of the file:

```python
def test_failed_login_is_logged_without_password(client, tmp_path):
    login(client, "sam", "wrong-guess-7")
    log = (tmp_path / "security.log").read_text()
    assert '"event": "login_failed"' in log
    assert '"user": "sam"' in log
    assert "wrong-guess-7" not in log
```

<!-- lab: run
cd ~/mylab
python3 - <<'EOF'
def edit(path, old, new):
    code = open(path).read()
    assert old in code, (path, old)
    open(path, "w").write(code.replace(old, new, 1))

edit("tests/test_security.py", "import db  # noqa: E402\n", "import db  # noqa: E402\nimport security_log  # noqa: E402\n")
edit("tests/test_security.py", '''    monkeypatch.setattr(db, "DB_PATH", tmp_path / "test.db")\n''', '''    monkeypatch.setattr(db, "DB_PATH", tmp_path / "test.db")\n    monkeypatch.setattr(security_log, "LOG_PATH", tmp_path / "security.log")\n''')
with open("tests/test_security.py", "a") as f:
    f.write('''

def test_failed_login_is_logged_without_password(client, tmp_path):
    login(client, "sam", "wrong-guess-7")
    log = (tmp_path / "security.log").read_text()
    assert '"event": "login_failed"' in log
    assert '"user": "sam"' in log
    assert "wrong-guess-7" not in log
''')
EOF
-->

```bash
pytest -q tests/test_security.py | tail -n 1 | cut -d' ' -f1-2
```

```output
7 passed
```

The six tests from Module 12 still pass, and the new one proves two things at once: a failed login is logged, and the password is not. The fixture and the test both ask for `tmp_path`, and pytest gives them the same folder, so the test can read the file the app wrote. If you did the exercise of lesson 12.7, you see `9 passed`.

### 4. Guess some passwords, and read the log

```bash
python3 app/app.py > logs/app.log 2>&1 &
```

<!-- lab: run
for i in $(seq 300); do ss -ltn | grep -q ':5000 ' && break; sleep 0.2; done
-->

```bash
for pw in guess1 guess2 guess3 guess4 guess5 guess6; do
  curl -s -o /dev/null -w "%{http_code} " -d "username=sam&password=$pw" http://127.0.0.1:5000/login
done
echo
curl -s -o /dev/null -w "%{http_code}\n" -d "username=sam&password=test-pass-1" http://127.0.0.1:5000/login
```

```output
401 401 401 401 401 401
302
```

You played a password guesser against your own app: six wrong passwords, each answered with `401`, then the right one, answered with a redirect. Now look at it from the defender's side:

```bash
jq -r '.event' logs/security.log | sort | uniq -c
jq -c 'del(.time)' logs/security.log | tail -n 2
```

```output
      6 login_failed
      1 login_ok
{"level":"WARNING","event":"login_failed","user":"sam","ip":"127.0.0.1"}
{"level":"INFO","event":"login_ok","user":"sam","ip":"127.0.0.1"}
```

Every attempt is there, with who, from where and the result, and no password anywhere. All of them come from `127.0.0.1` because curl runs on the same machine. Stop the app:

```bash
pkill -f app/app.py
```

### 5. Write the watcher

```python title="tools/watch_logins.py"
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
```

Read `find_alerts` slowly; it is the heart of the tool. Each address gets a deque, the double-ended queue of lesson 4.3: new failures go in on the right, and failures older than the window fall out on the left. `setdefault` returns the address's deque, and creates an empty one the first time. The set `alerted` makes sure a burst raises one alert, not one for every failure after the fifth. And the second rule is the one from lesson 13.3: a successful login while the window is still full means the guessing may have worked.

### 6. Run it

<!-- lab: nocheck -->
```bash
python3 tools/watch_logins.py
```

```output
ALERT 18:30:15 127.0.0.1 5 failed logins in 10 minutes
ALERT 18:30:23 127.0.0.1 login as sam after 6 failed logins
```

Two alerts: the burst, at the fifth failure, and the success that followed. Your times are different. To compare the rest, leave out the second field:

```bash
python3 tools/watch_logins.py | cut -d' ' -f1,3-
echo "exit status: ${PIPESTATUS[0]}"
```

```output
ALERT 127.0.0.1 5 failed logins in 10 minutes
ALERT 127.0.0.1 login as sam after 6 failed logins
exit status: 1
```

`$?` would give the exit status of `cut`, the last command of the pipe. `${PIPESTATUS[0]}` gives the status of the first one, the watcher: `1`, an alert. To run it every five minutes, add this line with `crontab -e`, as in lesson 13.6:

```text
*/5 * * * * cd $HOME/mylab && .venv/bin/python tools/watch_logins.py >> logs/alerts.log
```

`*/5` in the minute field means "every fifth minute". Each run reads the whole log, so an old burst is reported again until the log is rotated; a log with a year of traffic would need a tool that remembers where it stopped. For one person's lab, reading a small file every five minutes is fine.

### 7. Make the backup safe and checked

Replace `scripts/backup.sh` with this version:

```bash title="scripts/backup.sh"
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
[ "$(sqlite3 -init /dev/null mylab.db 'PRAGMA integrity_check')" = "ok" ]
tar -tzf files.tar.gz > /dev/null
echo "Backup saved and checked: $target"
```

Three new lines need a word. `set -e` stops the script at the first command that fails, so a broken step can never end with "Backup saved". `${1:-$HOME/backups}` means "the first argument, or `~/backups` if there is none", so `scripts/backup.sh /media/sam/USB-DRIVE` writes straight to a USB drive. And `umask 077` (the umask of lesson 5.2) makes every new file and folder readable by you alone, because `data/secret_key` is in the archive and anyone with it could sign a session for any user (lesson 8.6). The database copy uses `.backup` from lesson 13.5, and the last three checks are the restore test, done every time. `-init /dev/null` tells `sqlite3` to skip your `~/.sqliterc` from Module 7, so the check gets a plain `ok` and not a table.

<!-- lab: nocheck -->
```bash
scripts/backup.sh
```

```output
Backup saved and checked: /home/sam/backups/mylab-2026-11-22_183025
```

```bash
cd "$(ls -d ~/backups/mylab-* | tail -n 1)"
stat -c '%A %n' . *
tar -tzf files.tar.gz | grep '^data/' | sort
sqlite3 -table mylab.db "SELECT username FROM users ORDER BY id"
cd ~/mylab
```

```output
drwx------ .
-rw------- SHA256SUMS
-rw------- files.tar.gz
-rw------- mylab.db
data/
data/sample-access.log
data/secret_key
+----------+
| username |
+----------+
| sam      |
| alex     |
| kim      |
+----------+
```

The folder and every file are private (`drwx------`, `-rw-------`), the archive holds the secret key and the sample log but not the live database, and the database copy answers a real query with all three users.

### 8. Close the risks and commit

```bash
sed -i 's/| Module 13 |$/| Done in Module 13 |/' docs/threat-model.md
grep -E "^\| R(2|6) \|" docs/threat-model.md
```

```output
| R2 | The database is lost: dead disk or deleted by mistake | 2 | 2 | 4 |
| R6 | Nobody notices repeated failed logins | 3 | 1 | 3 |
| R2 | Back up data/mylab.db to another device | Done in Module 13 |
| R6 | Structured logs and an alert on failed logins | Done in Module 13 |
```

R2 is only really done once a copy leaves this disk. Run `scripts/backup.sh` with your USB drive as the destination, or copy `~/backups` there, and keep the drive unplugged.

```bash
git add app tools tests scripts docs
git commit -q -m "Add security logging, login alerts and checked backups"
git log --oneline -1 --format=%s
git status --short
deactivate
```

```output
Add security logging, login alerts and checked backups
```

`git status --short` prints nothing: everything is committed, and `logs/security.log` stays out of git, because `logs/` has been ignored since Module 2. Logs belong to the machine, not to the code.

## Exercise

Check the sliding window with a log you write by hand. Create `/tmp/slow.log` with five failed logins from `203.0.113.9`, fifteen minutes apart, then:

1. Run the watcher on it with the default settings. Should it raise an alert?
2. Run it again with a 60-minute window. What changes, and why?

<details>
<summary>Show the solution</summary>

```text title="/tmp/slow.log"
{"time": "2026-11-22T08:00:00+00:00", "level": "WARNING", "event": "login_failed", "user": "kim", "ip": "203.0.113.9"}
{"time": "2026-11-22T08:15:00+00:00", "level": "WARNING", "event": "login_failed", "user": "kim", "ip": "203.0.113.9"}
{"time": "2026-11-22T08:30:00+00:00", "level": "WARNING", "event": "login_failed", "user": "kim", "ip": "203.0.113.9"}
{"time": "2026-11-22T08:45:00+00:00", "level": "WARNING", "event": "login_failed", "user": "kim", "ip": "203.0.113.9"}
{"time": "2026-11-22T09:00:00+00:00", "level": "WARNING", "event": "login_failed", "user": "kim", "ip": "203.0.113.9"}
```

```bash
cd ~/mylab
python3 tools/watch_logins.py --log /tmp/slow.log
python3 tools/watch_logins.py --log /tmp/slow.log --minutes 60
```

```output
no alerts
ALERT 09:00:00 203.0.113.9 5 failed logins in 60 minutes
```

With a 10-minute window, each failure has pushed the one before it out of the window, so there is never more than one inside. With 60 minutes, all five fit between 08:00 and 09:00, and the fifth raises the alert. A patient guesser who waits between attempts can slip under any fixed window, which is why real systems also count per user and over longer periods, and why the real fix for guessing is to slow it down at the login itself. Detection tells you it happens; it does not stop it.

</details>

## Check yourself

**1. Why does the app log the username of a failed login, but not the password?**

<details>
<summary>Answer</summary>

The username tells you who was targeted. A wrong password is often the real one with a typo, or a password for another site, and logs are read by many people.

</details>

**2. Why does the fixture point `security_log.LOG_PATH` at `tmp_path`?**

<details>
<summary>Answer</summary>

So that the test logins do not land in the real `logs/security.log`, where they would mix with real events and could even raise alerts. The test also needs a fresh log to check what one failed login writes.

</details>

**3. Six failed logins arrive within a minute. How many alerts does the burst raise, and why not six?**

<details>
<summary>Answer</summary>

One, at the fifth failure. The set `alerted` remembers the address, so the sixth failure adds no new alert. A new alert is possible only after the window has emptied.

</details>

**4. What does `set -e` protect against in `backup.sh`?**

<details>
<summary>Answer</summary>

That a step fails, for example the database copy, and the script still goes on and prints "Backup saved". With `set -e` it stops at the first failed command.

</details>

**5. Why does `backup.sh` use `umask 077`?**

<details>
<summary>Answer</summary>

The backup contains the app's secret key and the database with the password hashes. `umask 077` makes the new folder and files readable by their owner only.

</details>

## Common mistakes

- **Logging inside a test run into the real log.** Tests that write to `logs/security.log` fill it with fake attacks. Patch the path in the fixture, as you did here.
- **Trusting `remote_addr` behind a proxy.** If the app ever runs behind another web server, every request seems to come from that server's address. Flask's documentation explains how to read the real address safely; until then, `remote_addr` is right.
- **Treating the alert as the defense.** An alert tells you that someone is guessing. Stopping it means slowing down the login, for example with a short delay or a lock after several failures.
- **Running a backup script that cannot fail.** Without `set -e` and the checks at the end, `backup.sh` would say "saved" even if the database copy failed. Test it once with a broken path to see it stop.
- **Leaving every backup on the same disk.** `~/backups` still dies with your disk. Give the script a destination on another device.

## Key terms

- **Sliding window**: a fixed span of time, such as the last 10 minutes, that moves forward with each new event; only events inside it are counted.

## Go further

- [OWASP Top 10:2025: A09 Security Logging and Alerting Failures](https://owasp.org/Top10/2025/A09_2025-Security_Logging_and_Alerting_Failures/): why missing logs and alerts count as a vulnerability, with examples.
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html): how to slow down password guessing at the login itself, the next step after detecting it.
- [Python: collections.deque](https://docs.python.org/3/library/collections.html#collections.deque): the queue used by the watcher, with all its methods.
