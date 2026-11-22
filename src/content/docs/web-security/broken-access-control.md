---
title: Broken access control
description: See how a logged-in user reaches data and functions that are not theirs by changing a number in a URL, and fix it with a permission check on every request.
lesson: "12.4"
time: 20 min
sidebar:
  order: 4
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
cd ~
-->

Your bank shows your statement at `/statements/1041`. Out of curiosity, you change the number to `1042`, and a stranger's statement appears. You did not break any lock or guess any password: the bank simply never asked whether statement 1042 was yours. This flaw sits at number one of the OWASP Top 10, and it is the easiest one to find, because finding it only takes a different number.

## Goal

After this lesson you can:

- Explain broken access control, and the difference between "logged in" and "allowed".
- Find it in a small app by changing ids and visiting pages that the menu does not show.
- Fix it with a check on the server, on every request, that denies by default.

## Why it matters

**Access control** is the set of rules that decides what each logged-in user may see and do. When it is missing or wrong, users read other people's messages, orders and files, or use admin functions they should never reach. It is the most common serious web flaw in OWASP's data, and it often hides in apps that look secure: they have a login, HTTPS and good passwords, and still forget to ask "is this yours?".

## The idea

Lesson 9.4 separated two questions. Authentication asks "who are you?", and the login answers it. Authorization asks "are you allowed to do this?", and it must be answered again for every single request, for the exact thing requested. **Broken access control** is what you get when an app answers the first question and forgets the second.

It comes in two directions:

- **Horizontal**: a user reaches another user's data at the same level, such as alex reading sam's notes. When the app finds the object only by an id taken from the request, the flaw is called an **insecure direct object reference (IDOR)**.
- **Vertical**: a normal user reaches a function meant for a higher role, such as an admin page.

Think of a hotel. The receptionist checks your passport at the desk: that is authentication. But your room key must open only your room. A hotel where any key opens every door, as long as you got in through the front door, has broken access control. And a staff-only door with no lock, only a sign saying "staff", is the vertical version: hiding a link in the menu is a sign, not a lock.

## Try it

You build a small notes API with Flask, in the practice folder `~/websec`, with the venv of `mylab`. To keep the code short, its login asks only for a name and no password. `mylab` checks passwords, and this lesson is about what happens after a login.

### 1. Write the API

```bash
mkdir -p ~/websec
cd ~/websec
source ~/mylab/.venv/bin/activate
```

```python title="notes_api.py"
"""A small notes API with broken access control. For lesson 12.4 only."""
from flask import Flask, abort, request, session

app = Flask(__name__)
app.secret_key = "practice-only"  # fine for a throwaway demo, never in a real app

ROLES = {"sam": "user", "alex": "user", "kim": "admin"}
NOTES = {
    1: {"owner": "sam", "title": "Ports to remember"},
    2: {"owner": "alex", "title": "Birthday present ideas"},
    3: {"owner": "kim", "title": "Admin checklist"},
}


@app.post("/login")
def login():
    name = request.form.get("name", "")
    if name not in ROLES:
        abort(401)
    session["name"] = name
    return {"logged_in_as": name}


@app.get("/api/notes/<int:note_id>")
def get_note(note_id):
    if "name" not in session:
        abort(401)
    note = NOTES.get(note_id)
    if note is None:
        abort(404)
    return note


@app.get("/admin/roles")
def list_roles():
    if "name" not in session:
        abort(401)
    return ROLES


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5002)
```

When a Flask route returns a dictionary, Flask sends it as JSON, as in lesson 8.5. Every route checks that someone is logged in. Look for what it does not check.

```bash
python3 notes_api.py > notes_api.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':5002 ' && break; sleep 0.2; done
-->

### 2. Log in as alex and read your note

```bash
curl -s -c alex.txt -d "name=alex" http://127.0.0.1:5002/login
curl -s -b alex.txt http://127.0.0.1:5002/api/notes/2
```

```output
{"logged_in_as":"alex"}
{"owner":"alex","title":"Birthday present ideas"}
```

`-c alex.txt` saves the session cookie in a jar, and `-b alex.txt` sends it back. alex sees her own note 2. Everything works as designed, so far.

### 3. Change the number

```bash
curl -s -b alex.txt http://127.0.0.1:5002/api/notes/1
```

```output
{"owner":"sam","title":"Ports to remember"}
```

alex is logged in, and the app never asked more than that. Note 1 is sam's, and she reads it anyway. This is an IDOR: the app found the object by the id in the URL and handed it over.

An attacker does not try one number. A loop tries them all:

```bash
for id in 1 2 3 4; do
  curl -s -o /dev/null -w "note $id: %{http_code}\n" -b alex.txt http://127.0.0.1:5002/api/notes/$id
done
```

```output
note 1: 200
note 2: 200
note 3: 200
note 4: 404
```

`-w` prints the status code of each answer. Three notes exist, and alex can read all three. The 404 even tells her where the notes end.

### 4. Visit the page the menu does not show

```bash
curl -s -b alex.txt http://127.0.0.1:5002/admin/roles
```

```output
{"alex":"user","kim":"admin","sam":"user"}
```

No menu in alex's app links to `/admin/roles`, but a URL is just text, and anyone can type it. The route checks that she is logged in, not that she is an admin. This is the vertical kind. Notice what does work:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5002/api/notes/1
```

```output
401
```

Without a cookie, the answer is 401. Authentication works fine; authorization is missing.

### 5. Add the checks

Stop the server, and replace the two routes in `notes_api.py` with these:

```bash
pkill -f notes_api.py
```

```python
@app.get("/api/notes/<int:note_id>")
def get_note(note_id):
    if "name" not in session:
        abort(401)
    note = NOTES.get(note_id)
    if note is None or note["owner"] != session["name"]:
        abort(404)
    return note


@app.get("/admin/roles")
def list_roles():
    if "name" not in session:
        abort(401)
    if ROLES[session["name"]] != "admin":
        abort(403)
    return ROLES
```

<!-- lab: run
cd ~/websec
python3 - <<'EOF'
path = "notes_api.py"
code = open(path).read()
def swap(old, new):
    global code
    assert old in code, old
    code = code.replace(old, new, 1)
swap('''    if note is None:
        abort(404)''', '''    if note is None or note["owner"] != session["name"]:
        abort(404)''')
swap('''        abort(401)
    return ROLES''', '''        abort(401)
    if ROLES[session["name"]] != "admin":
        abort(403)
    return ROLES''')
open(path, "w").write(code)
EOF
-->

The note route now asks the question it forgot: is the owner of this note the person in the session? The name comes from the signed session cookie, never from the request, so alex cannot claim to be sam. The admin route checks the role and answers 403, "Forbidden".

Why 404 for someone else's note, and not 403? A 403 would confirm that note 1 exists. A 404 tells alex nothing she is not allowed to know. For the admin page, the page's existence is no secret, so 403 is honest and clearer.

### 6. Test again

```bash
python3 notes_api.py > notes_api.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':5002 ' && break; sleep 0.2; done
-->

```bash
for id in 1 2 3 4; do
  curl -s -o /dev/null -w "note $id: %{http_code}\n" -b alex.txt http://127.0.0.1:5002/api/notes/$id
done
curl -s -o /dev/null -w "admin as alex: %{http_code}\n" -b alex.txt http://127.0.0.1:5002/admin/roles
```

```output
note 1: 404
note 2: 200
note 3: 404
note 4: 404
admin as alex: 403
```

The old cookie still works after the restart, because the secret key did not change. alex now gets exactly one note, her own, and the other ids look the same as one that does not exist. Then check that the right person still gets in, because a fix that locks out everyone is not a fix either:

```bash
curl -s -c kim.txt -d "name=kim" http://127.0.0.1:5002/login
curl -s -o /dev/null -w "admin as kim: %{http_code}\n" -b kim.txt http://127.0.0.1:5002/admin/roles
```

```output
{"logged_in_as":"kim"}
admin as kim: 200
```

:::note[Deny by default]
Each route here lists what is allowed and refuses everything else. That is the safe shape: when the code forgets a case, the case is refused. The opposite shape, "allow, unless it is one of these bad cases", fails open, and the forgotten case is the one an attacker finds.
:::

## Exercise

Add this route to `notes_api.py`. It lists the titles of a user's notes, and a developer wrote it so that the page can show "my notes":

```python
@app.get("/api/my-notes")
def my_notes():
    if "name" not in session:
        abort(401)
    user = request.args.get("user", "")
    return {"titles": [n["title"] for n in NOTES.values() if n["owner"] == user]}
```

1. Restart the server. As alex, call `/api/my-notes?user=alex`, then prove the flaw with one more request.
2. Fix the route, and show that the attack no longer works.

<details>
<summary>Show the solution</summary>

<!-- lab: run
cd ~/websec
pkill -f notes_api.py
python3 - <<'EOF'
path = "notes_api.py"
code = open(path).read()
func = '''@app.get("/api/my-notes")
def my_notes():
    if "name" not in session:
        abort(401)
    user = request.args.get("user", "")
    return {"titles": [n["title"] for n in NOTES.values() if n["owner"] == user]}


'''
code = code.replace('if __name__', func + 'if __name__', 1)
open(path, "w").write(code)
EOF
python3 notes_api.py > notes_api.log 2>&1 &
for i in $(seq 100); do ss -ltn | grep -q ':5002 ' && break; sleep 0.2; done
-->

```bash
curl -s -b alex.txt "http://127.0.0.1:5002/api/my-notes?user=alex"
curl -s -b alex.txt "http://127.0.0.1:5002/api/my-notes?user=sam"
```

```output
{"titles":["Birthday present ideas"]}
{"titles":["Ports to remember"]}
```

The route trusts the `user` in the URL, which the client writes. alex changed it and read sam's titles. The fix takes the name from the session and ignores the URL completely:

```python
@app.get("/api/my-notes")
def my_notes():
    if "name" not in session:
        abort(401)
    user = session["name"]
    return {"titles": [n["title"] for n in NOTES.values() if n["owner"] == user]}
```

<!-- lab: run
cd ~/websec
pkill -f notes_api.py
sed -i 's/    user = request.args.get("user", "")/    user = session["name"]/' notes_api.py
python3 notes_api.py > notes_api.log 2>&1 &
for i in $(seq 100); do ss -ltn | grep -q ':5002 ' && break; sleep 0.2; done
-->

Stop the server with `pkill -f notes_api.py`, start it again, and repeat the attack:

```bash
curl -s -b alex.txt "http://127.0.0.1:5002/api/my-notes?user=sam"
pkill -f notes_api.py
deactivate
```

```output
{"titles":["Birthday present ideas"]}
```

alex asked for sam's list and got her own, because the parameter is no longer read at all. Who the user is must come from the server's own record of the login, here the signed session, never from a field, a URL or a header that the client sends.

</details>

## Check yourself

**1. What is the difference between authentication and authorization?**

<details>
<summary>Answer</summary>

Authentication checks who you are, for example with a login. Authorization decides whether you may do a specific thing, such as read note 1, and must be checked on every request.

</details>

**2. alex reads sam's note by changing `/api/notes/2` to `/api/notes/1`. What is this flaw called, and which direction is it?**

<details>
<summary>Answer</summary>

An insecure direct object reference (IDOR), a horizontal access control flaw: a user reaches another user's data at the same level.

</details>

**3. A developer says the admin page is safe because no menu links to it. Why is that wrong?**

<details>
<summary>Answer</summary>

A URL is just text that anyone can type or guess, and curl does not need a menu. Only a check on the server, such as the role check that answers 403, protects the page.

</details>

**4. Why does the fixed note route answer 404, not 403, for someone else's note?**

<details>
<summary>Answer</summary>

A 403 would confirm that the note exists. A 404 looks the same as a note that does not exist, so it reveals nothing.

</details>

**5. Would long random ids instead of 1, 2, 3 fix the note route?**

<details>
<summary>Answer</summary>

No. They make ids harder to guess, but ids leak through links, logs and shared screens, and anyone who has one can still read the note. Only the owner check fixes it.

</details>

## Common mistakes

- **Checking only in the browser.** Hiding a button or greying out a link changes the page, not the server. curl sends the request anyway.
- **Taking the user from the request.** A `user_id` in a form, a URL or a cookie that is not signed is written by the client. Take it from the server's session.
- **Checking the list, but not the details.** An app often filters the list page by owner and forgets the page for one item, or the edit and delete routes. Every route that takes an id needs the check.
- **Writing the check differently in every route.** Ten copies of one check means one will be wrong. Put it in one function, or in the query itself, as `mylab` does with `WHERE id = ? AND user_id = ?`.
- **Forgetting to test the allowed case.** After a fix, check that the owner and the admin still get in.

## Key terms

- **Access control**: the rules that decide what each user may see and do, enforced by the server.
- **Broken access control**: a flaw where users can reach data or functions that their rights should not allow.
- **Insecure direct object reference (IDOR)**: broken access control where an app returns an object by an id from the request without checking that it belongs to the user.

## Go further

- [OWASP Top 10: A01 Broken Access Control](https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/): the category at number one, with its common forms and how to prevent them.
- [OWASP: Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html): deny by default, check every request, and test the rules.
- [PortSwigger Web Security Academy: Access control](https://portswigger.net/web-security/access-control): lessons and labs for horizontal and vertical flaws.
