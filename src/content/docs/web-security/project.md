---
title: "Project step: fix these flaws in your own mylab app"
description: Review three new features for mylab, prove their injection, XSS and access control flaws with curl and with failing tests, fix them, and add security headers.
lesson: "12.7"
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
rm -rf ~/mylab ~/websec
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs ~/mylab/tools ~/mylab/app/templates ~/mylab/app/static ~/mylab/docs
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
git init -q
git add .
git commit -q -m "mylab after Module 11"
mkdir -p ~/websec
cat > ~/websec/check_headers.sh <<'EOF'
#!/bin/bash
# Print which security headers a page sends. Usage: ./check_headers.sh URL
headers=$(curl -s -o /dev/null -D - "$1")
for name in Content-Security-Policy X-Content-Type-Options Referrer-Policy; do
    if echo "$headers" | grep -qi "^$name:"; then
        echo "ok       $name"
    else
        echo "MISSING  $name"
    fi
done
EOF
chmod +x ~/websec/check_headers.sh
cd ~
-->

Imagine that a classmate liked your `mylab` notes app and wrote three features for it: a search page, a page for each note, and line breaks in the text of a note. They send you the code as a pull request, as in lesson 2.6. Everything works when you click through it. Your job is the part that clicking does not show: the security review. Each feature has one flaw from this module, and you will find all three, prove them, fix them, and leave tests behind so that they never come back.

## Goal

After this lesson you can:

- Review new code for injection, XSS and broken access control, with grep and with curl.
- Write security tests that fail while a flaw is there and pass once it is fixed.
- Fix the flaws in `mylab`, and add security headers to every page.

## Why it matters

Most flaws enter an app the way these do: in new features, written quickly, by someone who tested that they work and not that they are safe. A review before the merge is the cheapest place to catch them. And a fix without a test is a fix that the next change can quietly undo; a test is how you prove, today and every day after, that the flaw is gone.

## The idea

You work on a branch, as with any pull request:

```text
mylab/
    app/
        db.py                 + find_notes, get_note
        app.py                + GET /search, GET /notes/<id>, security headers
        templates/
            notes.html        each title links to its note page
            search.html       new
            note.html         new
        static/style.css      + one rule for line breaks
    tests/
        test_security.py      new: one test per flaw, plus the allowed cases
    docs/threat-model.md      R4 and R5 are closed
```

The order of work is the one security teams use: **reproduce** the flaw by hand, write a test that fails because of it, fix the code, and watch the test pass. Writing the test before the fix matters. A test written after the fix might pass for the wrong reason, and you would never know. A test that you saw fail, and then saw pass, has proved that it checks the flaw.

The fixes themselves are the ones from the lessons: placeholders for SQL (12.2), no `|safe` on user text (12.3), an owner check on every route that takes an id (12.4), and headers from 12.5.

## Try it

This step continues the `mylab` repository as you left it after the [Module 11 project step](../system-security/project/). The data comes from the [Module 10 project step](../cryptography/project/): users `sam` with `test-pass-1`, `alex` with `test-pass-2` and `kim`, sam's note 2 "Ports to remember" and alex's note 3 "Hello". It also uses `check_headers.sh` from the exercise of lesson 12.5. If your notes differ, your ids differ too.

### 1. Add the classmate's code on a branch

```bash
cd ~/mylab
source .venv/bin/activate
git switch -c features
```

```output
Switched to a new branch 'features'
```

Add these two functions to `app/db.py`, right after `notes_for`:

```python
def find_notes(user_id, word):
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
```

Add these two routes to `app/app.py`, right before the `if __name__` line:

```python
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
    note = db.get_note(note_id)
    if note is None:
        abort(404)
    return render_template("note.html", note=note)
```

<!-- lab: run
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
-->

In `app/templates/notes.html`, the classmate made each title a link to its page:

```html
      <h2><a href="{{ url_for('show_note', note_id=note.id) }}">{{ note.title }}</a></h2>
```

And two new templates:

```html title="app/templates/search.html"
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
```

```html title="app/templates/note.html"
{% extends "base.html" %}
{% block title %}{{ note.title }}: mylab{% endblock %}
{% block content %}
  <p><a href="{{ url_for('notes') }}">All notes</a></p>
  <h1>{{ note.title }}</h1>
  <p>{{ note.body | replace("\n", "<br>") | safe }}</p>
{% endblock %}
```

```bash
git add app
git commit -q -m "Add search, note pages and line breaks"
git log --oneline -1 --format=%s
```

```output
Add search, note pages and line breaks
```

This commit is the pull request as your classmate sent it. If you did the search exercise of lesson 8.8, your notes page has a safe search of its own; this one is a separate page, `/search`.

### 2. Review the code

Start with the grep from lesson 12.2:

```bash
grep -n -E 'f"(SELECT|INSERT|UPDATE|DELETE)' app/db.py
grep -rn "safe" app/templates
```

```output
101:        f"SELECT id, title FROM notes WHERE user_id = {user_id} AND title LIKE '%{word}%' ORDER BY id"
app/templates/note.html:6:  <p>{{ note.body | replace("\n", "<br>") | safe }}</p>
```

`-r` makes grep search a whole folder. Two suspects at once: an SQL query built with an f-string, and a template that switches escaping off. The classmate replaced each line break with `<br>` and marked the result as safe, so that the tags would not be escaped. But `|safe` cannot tell the classmate's `<br>` from a `<script>` that a user typed.

The third flaw has no keyword to grep for. You find it by reading each route and asking the question from lesson 12.4: where does the id come from, and who checks that the object is the user's? `show_note` takes the id from the URL, and `get_note(note_id)` does not even receive the user's id.

### 3. Reproduce the flaws as alex

Start the app, and log in as alex:

```bash
python3 app/app.py > logs/app.log 2>&1 &
```

<!-- lab: run
for i in $(seq 300); do ss -ltn | grep -q ':5000 ' && break; sleep 0.2; done
-->

```bash
curl -s -o /dev/null -c /tmp/alex.txt -b /tmp/alex.txt -d "username=alex&password=test-pass-2" http://127.0.0.1:5000/login
curl -s -b /tmp/alex.txt --get --data-urlencode "q=x' OR 1=1 --" http://127.0.0.1:5000/search | grep "<p><a"
```

```output
    <p><a href="/notes/2">Ports to remember</a></p>
    <p><a href="/notes/3">Hello</a></p>
```

Injection: alex's search returns sam's note 2. Now the note page:

```bash
curl -s -b /tmp/alex.txt http://127.0.0.1:5000/notes/2 | grep "<h1>"
```

```output
  <h1>Ports to remember</h1>
```

Broken access control: alex reads sam's note by its number. And the line breaks:

```bash
curl -s -o /dev/null -b /tmp/alex.txt -d "title=Test" --data-urlencode "body=<script>alert('XSS')</script>" http://127.0.0.1:5000/notes
curl -s -b /tmp/alex.txt http://127.0.0.1:5000/notes/4 | grep "script"
```

```output
  <p><script>alert('XSS')</script></p>
```

Stored XSS: alex's note page carries a real script. Her new note got id 4. All three flaws are real. Stop the app, and delete the test note from the terminal:

```bash
pkill -f app/app.py
python3 app/db.py delete-note alex 4
```

```output
note 4 deleted
```

### 4. Write the security tests

```python title="tests/test_security.py"
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
```

Read it in three parts.

- **The setup.** The test file lives in `tests/`, and the app in `app/`, so the file adds `app/` to the list of folders where Python looks for modules. Importing `app` runs `app.py` without starting the server.
- **The fixture.** A **fixture** is a function that prepares what a test needs; pytest runs it before each test that names it as a parameter. `monkeypatch.setattr` points `db.DB_PATH` at a fresh database in `tmp_path` (lesson 4.10) for the length of one test, so the tests never change `data/mylab.db`. `app.test_client()` is Flask's built-in fake browser: it sends requests to the app without a server, and keeps cookies between them.
- **The tests.** Each flaw has a test that the attack fails. For the search and the note page, a second test checks that normal use still works: a "fix" that breaks search for everyone would pass the first kind and fail the second.

### 5. Watch them fail

```bash
pytest -q --tb=no -rf tests/test_security.py | grep FAILED | cut -d' ' -f2
```

```output
tests/test_security.py::test_search_cannot_be_injected
tests/test_security.py::test_cannot_read_another_users_note
tests/test_security.py::test_note_body_is_escaped
tests/test_security.py::test_security_headers
```

`--tb=no` hides the details, `-rf` prints one line for each failed test, and `cut` keeps the test's name. Four tests fail, one for each flaw and one for the missing headers. The two tests of normal use pass. That is the proof that the tests can see the flaws. Commit them:

```bash
git add tests/test_security.py
git commit -q -m "Add security tests"
```

### 6. Fix the code

In `app/db.py`, replace the two new functions:

```python
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
```

The search now sends both values through placeholders. `get_note` needs the user's id, and the database itself filters by it, as `delete_note` has done since Module 8: someone else's note and a note that does not exist give the same `None`.

In `app/app.py`, pass the user's id from the session in `show_note`:

```python
    note = db.get_note(session["user_id"], note_id)
```

And add the security headers, right after the line `db.init_db()`:

```python
@app.after_request
def add_security_headers(response):
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    return response
```

In `app/templates/note.html`, replace the line with `|safe`:

```html
  <p class="note-body">{{ note.body }}</p>
```

And add one rule at the end of `app/static/style.css`:

```css
.note-body {
  white-space: pre-line;
}
```

<!-- lab: run
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
-->

The text of the note is escaped again, like every other value in `mylab`. The line breaks come back without any HTML: `white-space: pre-line` tells the browser to show the line breaks that are already in the text. The rule lives in the style sheet, not in a `style` attribute, because the new CSP allows styles only from files.

### 7. Watch them pass

```bash
pytest -q tests/test_security.py | tail -n 1 | cut -d' ' -f1-2
```

```output
6 passed
```

All six pass: the attacks fail, and normal use still works. The time at the end of pytest's line changes on every run, so `cut` keeps only the first two words. Now repeat the attacks from step 3 against the real app:

```bash
python3 app/app.py > logs/app.log 2>&1 &
```

<!-- lab: run
for i in $(seq 300); do ss -ltn | grep -q ':5000 ' && break; sleep 0.2; done
-->

```bash
curl -s -b /tmp/alex.txt --get --data-urlencode "q=x' OR 1=1 --" http://127.0.0.1:5000/search | grep -c "<p><a"
curl -s -o /dev/null -w "%{http_code}\n" -b /tmp/alex.txt http://127.0.0.1:5000/notes/2
~/websec/check_headers.sh http://127.0.0.1:5000/login
```

```output
0
404
ok       Content-Security-Policy
ok       X-Content-Type-Options
ok       Referrer-Policy
```

The injected search finds nothing, sam's note answers 404 for alex, and the three headers from lesson 12.5 are there. Open `http://127.0.0.1:5000/` in your browser, log in as sam, and click a note title: the page, its style and its line breaks all still work under the new CSP. Then stop the app:

```bash
pkill -f app/app.py
```

### 8. Close the risks and merge

Your threat model planned R4 and R5 for this module. Steps 5 to 7 proved the fixes, so mark them as done:

```bash
sed -i 's/| Module 12 |$/| Done in Module 12 |/' docs/threat-model.md
grep -E "^\| R(4|5) \|" docs/threat-model.md
```

```output
| R4 | A form lets someone inject SQL or HTML into the app | 1 | 3 | 3 |
| R5 | A logged-in user can read another user's notes | 1 | 3 | 3 |
| R4 | Fix injection and XSS, and add tests | Done in Module 12 |
| R5 | Check on the server that each note belongs to the user | Done in Module 12 |
```

`$` in the `sed` pattern means "at the end of the line", so only the "When" column changes. Commit the fixes, then merge the branch into `main`:

```bash
git add app docs/threat-model.md
git commit -q -m "Fix injection, XSS and access control; add security headers"
git switch -q main
git merge -q features
git log --oneline -4 --format=%s
deactivate
```

```output
Fix injection, XSS and access control; add security headers
Add security tests
Add search, note pages and line breaks
mylab after Module 11
```

The history tells the whole story in order: the feature, the tests that caught its flaws, and the fix. In a real pull request you would send your review back to the classmate instead, with the tests, so they learn the fix too.

## Exercise

Two more tests make the file stronger. Add them to `tests/test_security.py`, and make sure both pass:

1. `test_cannot_delete_another_users_note`: alex sends `POST /notes/1/delete`. The answer must be 404, and sam's note must still exist afterwards.
2. `test_search_with_a_quote_works`: sam searches for `it's`. The answer must be 200, not a server error.

Then run the whole file. Think about it: would the second test have passed before your fix?

<details>
<summary>Show the solution</summary>

Add at the end of `tests/test_security.py`:

```python
def test_cannot_delete_another_users_note(client):
    login(client, "alex", "test-pass-2")
    assert client.post("/notes/1/delete").status_code == 404
    login(client, "sam", "test-pass-1")
    assert "Secret plans" in client.get("/notes").get_data(as_text=True)


def test_search_with_a_quote_works(client):
    login(client, "sam", "test-pass-1")
    assert client.get("/search", query_string={"q": "it's"}).status_code == 200
```

<!-- lab: run
cd ~/mylab
cat >> tests/test_security.py <<'EOF'


def test_cannot_delete_another_users_note(client):
    login(client, "alex", "test-pass-2")
    assert client.post("/notes/1/delete").status_code == 404
    login(client, "sam", "test-pass-1")
    assert "Secret plans" in client.get("/notes").get_data(as_text=True)


def test_search_with_a_quote_works(client):
    login(client, "sam", "test-pass-1")
    assert client.get("/search", query_string={"q": "it's"}).status_code == 200
EOF
-->

```bash
source .venv/bin/activate
pytest -q tests/test_security.py | tail -n 1 | cut -d' ' -f1-2
```

```output
8 passed
```

The first test is a regression test, as in lesson 3.9: it checks something that already works, the owner check of `delete_note` from Module 8, so that a later change cannot break it unnoticed. The login of sam in the middle replaces alex's session with sam's, so the test can look at sam's notes.

The second would have failed before the fix. With the f-string, the quote in `it's` broke the SQL, the app raised an error, and Flask answered 500, the same syntax error that you saw in lesson 12.2. A crash on a quote is often the first sign of injection, so it deserves its own test. Commit:

```bash
git commit -q -am "Add two more security tests"
git log --oneline -1 --format=%s
deactivate
```

```output
Add two more security tests
```

</details>

## Check yourself

**1. Why write the security tests before the fix, and run them?**

<details>
<summary>Answer</summary>

A test that you saw fail while the flaw was there has proved that it can detect the flaw. A test written after the fix might pass for the wrong reason, for example because it checks the wrong page.

</details>

**2. Why does each attack test have a "normal use" test next to it?**

<details>
<summary>Answer</summary>

A broken fix can stop the attack by stopping everything, such as a search that never finds anything. The normal-use test catches that.

</details>

**3. The classmate used `|safe` to keep the `<br>` tags. What did the fix use instead, and why is it safe?**

<details>
<summary>Answer</summary>

The text is escaped like every other value, and the CSS rule `white-space: pre-line` shows the line breaks that are already in the text. No HTML is built from user text at all, so nothing in it can become a tag.

</details>

**4. Why does `get_note` now take the user's id, and filter by it in SQL?**

<details>
<summary>Answer</summary>

So that the database returns a note only if it belongs to the logged-in user, whose id comes from the signed session. Someone else's note and a missing note both give `None`, and the route answers 404.

</details>

**5. Why do the tests use a database in `tmp_path` instead of `data/mylab.db`?**

<details>
<summary>Answer</summary>

So that the tests always start from the same known data and never change or delete your real notes. Each test gets a fresh, empty folder.

</details>

## Common mistakes

- **Testing only the attack.** A test that only checks "the script is not in the page" passes if the page is empty. Check the allowed case too.
- **Running the tests against the real database.** Without the fixture, the tests would add users and notes to `data/mylab.db`, and fail the second time because the names are taken.
- **Fixing the route but not the function.** If `get_note` still returned any note, the next route that calls it would have the same flaw. Put the owner check where the data is read.
- **Writing a CSP that breaks your own pages.** After adding the header, click through every page in a browser. A `style` attribute or an inline script now fails silently; the browser's developer tools show the blocked parts in the Console.
- **Merging without the tests.** The tests are part of the fix. Commit them with it, and run them before every later merge.

## Key terms

- **Reproduce**: make a flaw happen again on purpose, step by step, to prove that it is real.
- **Fixture (pytest)**: a function that prepares what a test needs, run by pytest before each test that names it as a parameter.

## Go further

- [Flask: Testing Flask Applications](https://flask.palletsprojects.com/en/stable/testing/): the test client, fixtures and how to test logins and sessions.
- [pytest: How to monkeypatch](https://docs.pytest.org/en/stable/how-to/monkeypatch.html): how `monkeypatch` changes a value for one test and puts it back afterwards.
- [OWASP: Code Review Guide](https://owasp.org/www-project-code-review-guide/): how to review code for security, with checklists for the flaws of this module.
