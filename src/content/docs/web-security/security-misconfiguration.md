---
title: Security misconfiguration
description: Find doors left open by settings rather than by code, such as debug mode, files served by accident, default passwords and missing security headers, and close them.
lesson: "12.5"
time: 20 min
sidebar:
  order: 5
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

The code can be perfect and the app still wide open. A developer leaves debug mode on "just for today". A web server shares the whole project folder, secrets included. A router still has the password `admin` from the factory. None of these is a bug in the code; each one is a setting, and settings are easy to forget because nobody reads them twice. This lesson is about those settings.

## Goal

After this lesson you can:

- Recognize the common misconfigurations: debug mode, files served by accident, default passwords and missing headers.
- See each one from the outside with curl, as an attacker would.
- Close them, and check your own app's headers.

## Why it matters

**Security misconfiguration** is a security setting that is missing, wrong or left at an unsafe default. In the OWASP Top 10:2025 it is number two, because almost every app has a few: frameworks, servers and cloud services ship with settings that make development easy, not production safe. Attackers know the defaults and scan for them automatically, so a forgotten setting is often found within days of going online.

## The idea

Think of a new flat. The builder hands it over with a spare key under the doormat, a window left open to let the paint dry, and the name of the alarm company written on the door. Each one made the builder's work easier. None of them is a broken lock, and all of them must be changed before you move in. A **default** is the value a setting has when nobody changes it, and the safe question is always: was this default chosen for my safety, or for someone's convenience?

The usual suspects:

| Misconfiguration | Why it is dangerous |
|---|---|
| Debug mode on | Error pages show code, file paths and settings, and some debuggers run code |
| Files served by accident | `.env` files, backups or the `.git` folder can be downloaded |
| Default or shared passwords | They are printed in manuals that anyone can read |
| Missing security headers | The browser's own defenses are not switched on |
| Detailed error messages | They tell an attacker what failed and where |
| Features nobody uses | Sample pages, test routes and open ports are more doors to watch |

## Try it

You work in `~/websec` with the venv of `mylab`. Each step shows a door from the outside first, then closes it.

### 1. See what debug mode shows

```bash
mkdir -p ~/websec
cd ~/websec
source ~/mylab/.venv/bin/activate
```

```python title="price.py"
"""A tiny price calculator with debug mode on. For lesson 12.5 only."""
from flask import Flask, request

app = Flask(__name__)
PRICE = 4


@app.get("/price")
def price():
    qty = int(request.args.get("qty", "1"))
    return f"{qty} items cost {qty * PRICE} euros\n"


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5003, debug=True)
```

`int("abc")` raises a `ValueError`, and this code does not catch it. Start the app and send it a number, then a word:

```bash
python3 price.py > price.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':5003 ' && break; sleep 0.2; done
-->

```bash
curl -s "http://127.0.0.1:5003/price?qty=3"
curl -s "http://127.0.0.1:5003/price?qty=abc" | grep -A 1 "<title>"
curl -s "http://127.0.0.1:5003/price?qty=abc" | grep -c "/home/sam/websec/price.py"
```

```output
3 items cost 12 euros
    <title>ValueError: invalid literal for int() with base 10: &#39;abc&#39;
 // Werkzeug Debugger</title>
3
```

The error page is the **Werkzeug debugger**, Flask's helper for developers. `grep -A 1` prints the matching line and the one after it: the page's title names the error. `grep -c` counts the lines that contain the full path of your code, and the page shows the code around the error too. In a browser it also offers a console that runs Python inside the server, locked by a PIN that is printed in the server's log:

<!-- lab: nocheck -->
```bash
grep PIN price.log
```

```output
 * Debugger PIN: 142-528-099
```

Your PIN differs. Werkzeug's own documentation says the debugger must never be used on a production server, because anyone who gets past that PIN can run any code on it.

### 2. Turn debug mode off

```bash
pkill -f price.py
sed -i 's/, debug=True)/)/' price.py
grep -n "app.run" price.py
```

```output
15:    app.run(host="127.0.0.1", port=5003)
```

`sed -i` edits the file in place: the `debug=True` is gone. Restart and send the word again:

```bash
python3 price.py > price.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':5003 ' && break; sleep 0.2; done
-->

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:5003/price?qty=abc"
curl -s "http://127.0.0.1:5003/price?qty=abc" | grep -o "<title>.*</title>"
grep -c "ValueError" price.log
```

```output
500
<title>500 Internal Server Error</title>
2
```

The visitor now gets a plain "500 Internal Server Error" with no detail. The detail did not vanish: it went into `price.log`, where only you can read it, once for each of the two requests. That is the right split: the full story for the developer, nothing for the visitor. The real fix for the crash is still to check the input and answer 400, as `mylab` does for an empty title, but no app catches every error.

```bash
pkill -f price.py
```

### 3. Find files that were never meant to be served

A common shortcut is to serve a folder with a quick web server. Build a small project folder with a page, a secret and a backup:

```bash
mkdir -p ~/websec/site/public
cd ~/websec/site
echo "<h1>My page</h1>" > public/index.html
echo "DB_PASSWORD=practice-only-secret" > .env
echo "-- old database dump" > backup.sql
python3 -m http.server 8000 --bind 127.0.0.1 > ../site.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

```bash
curl -s http://127.0.0.1:8000/ | grep -o 'href="[^"]*"'
```

```output
href=".env"
href="backup.sql"
href="public/"
```

`grep -o` keeps only the links. A folder without an `index.html` gets a **directory listing**, a page that lists every file in it, hidden files included. And the secret is one request away:

```bash
curl -s http://127.0.0.1:8000/.env
```

```output
DB_PASSWORD=practice-only-secret
```

Automated scanners request paths such as `/.env`, `/.git/config` and `/backup.sql` on sites all over the internet, because this mistake is common. The fix is to serve only the folder that is meant to be public:

```bash
pkill -f "http.server 8000"
python3 -m http.server 8000 --bind 127.0.0.1 --directory public > ../site.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':8000 ' && break; sleep 0.2; done
-->

```bash
curl -s http://127.0.0.1:8000/
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/.env
pkill -f "http.server 8000"
```

```output
<h1>My page</h1>
404
```

`--directory public` makes `public/` the top of the site. The page is still there, and the `.env` file is simply outside the site. Nothing to hide, because nothing private is inside.

### 4. Read your own app's headers

Start `mylab` and look only at the headers of its login page:

```bash
cd ~/mylab
python3 app/app.py > logs/app.log 2>&1 &
```

<!-- lab: run
for i in $(seq 300); do ss -ltn | grep -q ':5000 ' && break; sleep 0.2; done
-->

<!-- lab: nocheck -->
```bash
curl -s -o /dev/null -D - http://127.0.0.1:5000/login
```

```output
HTTP/1.1 200 OK
Server: Werkzeug/3.1.9 Python/3.12.3
Date: Sun, 22 Nov 2026 08:03:53 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 733
Vary: Cookie
Connection: close
```

`-D -` writes the headers to the screen, and `-o /dev/null` throws the page away, so you see the headers of a normal GET request. Your versions and date differ. Two things stand out. The `Server` header names the server and the exact versions of Werkzeug and Python, which saves an attacker a step when looking for known flaws. And there are no security headers at all. Browsers have defenses built in, but several of them stay off until the server asks for them:

| Header | What it asks the browser to do |
|---|---|
| `Content-Security-Policy` | Run scripts and load content only from the sources listed (lesson 12.3). With `frame-ancestors 'none'`, also never show the page inside a frame on another site |
| `X-Content-Type-Options: nosniff` | Trust the `Content-Type` header, instead of guessing that a file is a script |
| `Referrer-Policy: same-origin` | Do not tell other sites which page of yours a visitor came from |
| `Strict-Transport-Security` | Use only HTTPS for this site from now on. Only over HTTPS, so not for `mylab` today |

Showing the page inside an invisible frame is the trick behind **clickjacking**: a page on another site places your real page under its own buttons, and the visitor clicks yours without knowing. `frame-ancestors 'none'` stops it. The project step adds these headers to `mylab`.

The development server is also a setting in itself. `app.run` starts Werkzeug's development server, which is fine on `127.0.0.1` and is not built to face the internet. A real deployment puts the app behind a production server such as Gunicorn, with debug off.

```bash
pkill -f app/app.py
```

:::caution[Default passwords]
Routers, cameras, database consoles and admin panels often ship with a known account such as `admin` and `admin`. Lists of these defaults are public, and scanners try them first. Change every default password at setup, and never put a fixed password for an admin account into an app's code. In the next lesson you meet doors like the ones in this lesson on purpose, in Juice Shop.
:::

## Exercise

Write a small script, `~/websec/check_headers.sh`, that takes a URL and prints `ok` or `MISSING` for each of three headers: `Content-Security-Policy`, `X-Content-Type-Options` and `Referrer-Policy`. Run it against `mylab`'s login page. Keep it: the project step uses it to prove its fix.

Hint: save the headers once with `curl -s -o /dev/null -D - "$1"`, then search them with `grep -qi`, which is quiet and ignores capital letters.

<details>
<summary>Show the solution</summary>

```bash
cd ~/websec
```

```bash title="check_headers.sh"
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
```

```bash
chmod +x check_headers.sh
cd ~/mylab
python3 app/app.py > logs/app.log 2>&1 &
```

<!-- lab: run
for i in $(seq 300); do ss -ltn | grep -q ':5000 ' && break; sleep 0.2; done
-->

```bash
~/websec/check_headers.sh http://127.0.0.1:5000/login
pkill -f app/app.py
deactivate
```

```output
MISSING  Content-Security-Policy
MISSING  X-Content-Type-Options
MISSING  Referrer-Policy
```

The script fetches the headers once and keeps them in a variable. `^$name:` matches a line that starts with the header name and a colon, so a header that merely mentions the word elsewhere does not count. `mylab` sends none of the three yet; after the project step, all three lines say `ok`.

</details>

## Check yourself

**1. Why is debug mode dangerous on a server that others can reach?**

<details>
<summary>Answer</summary>

Its error pages show code, file paths and settings, and the Werkzeug debugger offers a console that runs Python on the server. An attacker learns how the app works, and may be able to run code.

</details>

**2. With debug off, where does the detail of an error go?**

<details>
<summary>Answer</summary>

Into the server's log, where the developer can read it. The visitor sees only a plain "500 Internal Server Error".

</details>

**3. `python3 -m http.server` was started in a project folder. Name two things an attacker can do.**

<details>
<summary>Answer</summary>

Read the directory listing to see every file, and download files that were never meant to be public, such as `.env` with its secrets or a database backup. The fix is to serve only the public folder.

</details>

**4. What does `X-Content-Type-Options: nosniff` ask the browser to do?**

<details>
<summary>Answer</summary>

To trust the `Content-Type` header the server sent, instead of guessing the type from the content, so a file is never run as a script just because it looks like one.

</details>

**5. Why is a default password a misconfiguration, not a weak password chosen by a user?**

<details>
<summary>Answer</summary>

Because it is a setting that came with the product and was never changed. The same password is on every copy and printed in public manuals, so attackers try it first.

</details>

## Common mistakes

- **Debug on through a forgotten setting.** `debug=True` in the code, or an environment variable such as `FLASK_DEBUG=1` left in a script, follows the app to every machine. Keep debug off in the code, and turn it on only on your own computer.
- **Serving the project folder.** Put public files in their own folder, and serve only that folder.
- **Secrets in the repository.** A `.env` file belongs in `.gitignore`, as in Module 2. A secret that was ever committed must be changed, not just deleted.
- **Hiding the version and calling it security.** Removing the `Server` header saves an attacker one step, no more. Updating the software is what fixes a known flaw.
- **Copying a header list without understanding it.** A strict CSP can break your own pages, and a loose one protects nothing. Add headers one at a time, and test the pages after each one.

## Key terms

- **Security misconfiguration**: a security setting that is missing, wrong or left at an unsafe default.
- **Default**: the value a setting has when nobody changes it.
- **Debug mode**: a development setting that shows detailed errors and tools; it must be off on any server that others can reach.
- **Directory listing**: a page, made by the web server, that lists the files in a folder.
- **Security header**: an HTTP response header that switches on a defense in the browser, such as a CSP.
- **Clickjacking**: tricking a visitor into clicking a page that is shown, often invisibly, inside a frame on another site.

## Go further

- [OWASP Top 10: A02 Security Misconfiguration](https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/): the category, with examples and a prevention checklist.
- [OWASP: HTTP Security Response Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html): every security header, what it does, and a recommended value.
- [Flask: Deploying to production](https://flask.palletsprojects.com/en/stable/deploying/): why the development server is not for production, and what to use instead.
