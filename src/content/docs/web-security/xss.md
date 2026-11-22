---
title: Cross-site scripting (XSS)
description: See how text from a user becomes code in someone else's browser, and stop it with escaping and a content security policy.
lesson: "12.3"
time: 20 min
sidebar:
  order: 3
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

A guestbook asks visitors to sign with a short message. One visitor signs with a message that is not a message at all, but a small program. From then on, every person who opens the guestbook runs that program in their own browser, logged in as themselves, without clicking anything. That is cross-site scripting, and in this lesson you build the guestbook, break it, and fix it twice.

## Goal

After this lesson you can:

- Explain how text from a user becomes a script in another user's page.
- Tell stored, reflected and DOM-based XSS apart.
- Prevent XSS with escaping, and add a content security policy as a second layer.

## Why it matters

A script that runs in your page runs with your users' rights. It can read what they see, fill in and send forms in their name, and draw a fake login box that sends their password away. XSS has been one of the most common web flaws for over twenty years; in the OWASP Top 10 it is part of the Injection category, because it is the same mistake as SQL injection, made in HTML.

## The idea

**Cross-site scripting (XSS)** happens when a page includes text from a user, and the browser reads that text as HTML or JavaScript instead of showing it. It is injection again, and the interpreter this time is the browser. A server that builds a page like this:

```python
f"<li>{message}</li>"
```

means "put a message in a list item". But if the message is `<script>...</script>`, the browser does not see a message. It sees a script element and runs it. The browser cannot know which part of the page the developer wrote and which part a visitor typed.

The fix is the one from lesson 8.8: **escaping**. Before text goes into HTML, the characters that mean something in HTML, `<`, `>`, `&` and quotes, are replaced by codes such as `&lt;` that only display them. Think of a newspaper that prints a reader's letter: the letter appears in the paper, but the editor sets it in the letters column, and nothing in it can change the layout of the front page.

There are three kinds of XSS, named after where the script comes from:

| Kind | Where the script comes from | Example |
|---|---|---|
| **Stored XSS** | Saved on the server, then shown to every visitor | A guestbook message, a comment, a note title |
| **Reflected XSS** | Sent in the request and echoed back at once | A search page that prints "No results for ..." |
| **DOM-based XSS** | The page's own JavaScript puts text into the page | `element.innerHTML = location.hash` |

The cure is the same for all three: whatever a user wrote is inserted as text, never as code.

## Try it

You build a tiny guestbook with Flask, in the practice folder from lesson 12.2. It uses the venv of `mylab`, which has Flask since Module 8.

### 1. Write the guestbook the wrong way

```bash
mkdir -p ~/websec
cd ~/websec
source ~/mylab/.venv/bin/activate
```

```python title="guestbook.py"
"""A guestbook that builds its HTML by hand, the WRONG way. For lesson 12.3 only."""
from flask import Flask, redirect, request

app = Flask(__name__)
messages = ["Welcome to the guestbook."]


@app.get("/")
def page():
    items = "".join(f"<li>{m}</li>" for m in messages)
    return f"""<!DOCTYPE html>
<title>Guestbook</title>
<h1>Guestbook</h1>
<ul>{items}</ul>
<form method="post"><input name="text"><button>Sign</button></form>
"""


@app.post("/")
def sign():
    messages.append(request.form.get("text", ""))
    return redirect("/")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
```

The messages live in a Python list, so they vanish when the server stops, which suits a practice app. The page is one f-string, and every message goes into it exactly as it was typed. Port 5001 keeps it apart from `mylab` on 5000.

```bash
python3 guestbook.py > guestbook.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':5001 ' && break; sleep 0.2; done
-->

```bash
curl -s http://127.0.0.1:5001/ | grep "<li>"
```

```output
<ul><li>Welcome to the guestbook.</li></ul>
```

### 2. Sign it, then sign it with HTML

```bash
curl -s -o /dev/null -d "text=Nice lab, Sam" http://127.0.0.1:5001/
curl -s -o /dev/null --data-urlencode "text=<b>bold</b>" http://127.0.0.1:5001/
curl -s http://127.0.0.1:5001/ | grep "<li>"
```

```output
<ul><li>Welcome to the guestbook.</li><li>Nice lab, Sam</li><li><b>bold</b></li></ul>
```

The `<b>` arrived in the page as a real tag, so a browser shows the word in bold. The visitor did not write a message; they changed the page. If they can add a `<b>`, they can add anything.

### 3. Store a script

```bash
curl -s -o /dev/null --data-urlencode "text=<script>alert('XSS from ' + document.domain)</script>" http://127.0.0.1:5001/
curl -s http://127.0.0.1:5001/ | grep -o "<li><script>.*</script></li>"
```

```output
<li><script>alert('XSS from ' + document.domain)</script></li>
```

`grep -o` prints only the part that matches. The script is now part of the guestbook for everyone. Open `http://127.0.0.1:5001/` in your browser: a box pops up that says "XSS from 127.0.0.1", and it comes back on every reload, for every visitor. This is stored XSS.

An alert is the harmless way to prove that a script runs. A real attacker's script would be invisible. It would send requests as the visitor, since the browser adds the visitor's cookies to them, or replace the page with a fake login form. The `HttpOnly` flag on a session cookie (lesson 8.6) stops a script from reading the cookie itself, but not from using the logged-in page.

### 4. Fix it with escaping

Stop the server, and change the page so that every message is escaped:

```bash
pkill -f guestbook.py
```

```python title="guestbook.py"
"""A guestbook that escapes every message before it goes into the page."""
from flask import Flask, redirect, request
from markupsafe import escape

app = Flask(__name__)
messages = ["Welcome to the guestbook."]


@app.get("/")
def page():
    items = "".join(f"<li>{escape(m)}</li>" for m in messages)
    return f"""<!DOCTYPE html>
<title>Guestbook</title>
<h1>Guestbook</h1>
<ul>{items}</ul>
<form method="post"><input name="text"><button>Sign</button></form>
"""


@app.post("/")
def sign():
    messages.append(request.form.get("text", ""))
    return redirect("/")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
```

`markupsafe` is the escaping library that Jinja uses; it came with Flask. Only one line changed: `escape(m)` instead of `m`. Start the server and store the same two messages again:

```bash
python3 guestbook.py > guestbook.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':5001 ' && break; sleep 0.2; done
-->

```bash
curl -s -o /dev/null --data-urlencode "text=<b>bold</b>" http://127.0.0.1:5001/
curl -s -o /dev/null --data-urlencode "text=<script>alert('XSS from ' + document.domain)</script>" http://127.0.0.1:5001/
curl -s http://127.0.0.1:5001/ | grep "<li>"
```

```output
<ul><li>Welcome to the guestbook.</li><li>&lt;b&gt;bold&lt;/b&gt;</li><li>&lt;script&gt;alert(&#39;XSS from &#39; + document.domain)&lt;/script&gt;</li></ul>
```

The server restarted with an empty list, so the old messages are gone. The new ones are stored exactly as typed, but in the page every `<` became `&lt;`, every `>` became `&gt;` and every `'` became `&#39;`. A browser shows the text `<script>alert(...)</script>` on the screen, and runs nothing. Reload the page in your browser: no box.

In a real app you rarely call `escape` yourself. Jinja templates do it for every `{{ ... }}`, as you saw in lesson 8.8. That is why `mylab` uses templates, and why building HTML in f-strings, as this guestbook does, is a warning sign in any review.

### 5. Add a content security policy

Escaping is the fix. A **content security policy (CSP)** is a second layer: an HTTP header in which the server tells the browser which scripts it may run. Add this function to `guestbook.py`, right before the `if __name__` line:

```python
@app.after_request
def add_csp(response):
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response
```

<!-- lab: run
cd ~/websec
pkill -f guestbook.py
python3 - <<'EOF'
path = "guestbook.py"
code = open(path).read()
func = '''@app.after_request
def add_csp(response):
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response


'''
assert 'if __name__' in code
code = code.replace('if __name__', func + 'if __name__', 1)
open(path, "w").write(code)
EOF
-->

`@app.after_request` runs the function on every response just before Flask sends it, so every page gets the header. Restart the server and look at the headers:

```bash
python3 guestbook.py > guestbook.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':5001 ' && break; sleep 0.2; done
-->

```bash
curl -sI http://127.0.0.1:5001/ | grep -i "content-security"
```

```output
Content-Security-Policy: default-src 'self'
```

`curl -I` asks only for the headers. `default-src 'self'` means: load scripts, styles, images and everything else only from this same site, as separate files. Inline code, such as a `<script>` element written into the page or an `onerror="..."` attribute, is blocked by this policy too. So if one escape were ever forgotten, the injected script would not run in a modern browser. Your own JavaScript must then live in `.js` files, which is good practice anyway.

A CSP never replaces escaping. Old browsers ignore it, a policy written too loosely blocks nothing, and HTML injection without any script, such as a fake form, still works. Use both.

```bash
pkill -f guestbook.py
```

## Exercise

Add a search page to the escaped guestbook from step 4. First remove the `add_csp` function from step 5, so that you see the flaw itself. `GET /search?q=word` must answer with the messages that contain the word, or with `No messages contain WORD` when there are none. Write it the wrong way first, without `escape`, and prove the reflected XSS with curl. Then fix it.

Hint: `request.args.get("q", "")` reads the `q` from the URL, and `curl --get --data-urlencode "q=..."` puts an encoded value there.

<details>
<summary>Show the solution</summary>

The wrong way, added before the `if __name__` line:

```python
@app.get("/search")
def search():
    q = request.args.get("q", "")
    found = [m for m in messages if q in m]
    if not found:
        return f"<p>No messages contain {q}</p>"
    return "".join(f"<p>{escape(m)}</p>" for m in found)
```

Start the server again, as in step 4, and try a normal word and a script:

<!-- lab: run
cd ~/websec
python3 - <<'EOF'
path = "guestbook.py"
code = open(path).read()
start = code.index("@app.after_request")
end = code.index("if __name__")
code = code[:start] + code[end:]
func = '''@app.get("/search")
def search():
    q = request.args.get("q", "")
    found = [m for m in messages if q in m]
    if not found:
        return f"<p>No messages contain {q}</p>"
    return "".join(f"<p>{escape(m)}</p>" for m in found)


'''
code = code.replace('if __name__', func + 'if __name__', 1)
open(path, "w").write(code)
EOF
python3 guestbook.py > guestbook.log 2>&1 &
for i in $(seq 100); do ss -ltn | grep -q ':5001 ' && break; sleep 0.2; done
-->

```bash
curl -s --get --data-urlencode "q=Welcome" http://127.0.0.1:5001/search
echo
curl -s --get --data-urlencode "q=<script>alert(1)</script>" http://127.0.0.1:5001/search
echo
```

```output
<p>Welcome to the guestbook.</p>
<p>No messages contain <script>alert(1)</script></p>
```

`echo` adds the line break that the pages do not end with. The found messages were escaped, but the "no results" line repeats `q` raw. An attacker would send a victim a link such as `/search?q=<script>...</script>`, and the script would run in the victim's browser: reflected XSS. The fix is `escape(q)` in that line too:

<!-- lab: run
cd ~/websec
pkill -f guestbook.py
sed -i 's/No messages contain {q}/No messages contain {escape(q)}/' guestbook.py
python3 guestbook.py > guestbook.log 2>&1 &
for i in $(seq 100); do ss -ltn | grep -q ':5001 ' && break; sleep 0.2; done
-->

```python
        return f"<p>No messages contain {escape(q)}</p>"
```

Stop the server with `pkill -f guestbook.py`, start it again, and repeat the attack:

```bash
curl -s --get --data-urlencode "q=<script>alert(1)</script>" http://127.0.0.1:5001/search
echo
pkill -f guestbook.py
deactivate
```

```output
<p>No messages contain &lt;script&gt;alert(1)&lt;/script&gt;</p>
```

The lesson of the exercise: escaping "most" of the output is not enough. Every value that came from a request needs it, including the ones in error messages. A template engine that escapes everything by default makes that the normal case.

</details>

## Check yourself

**1. Why is XSS counted as a kind of injection?**

<details>
<summary>Answer</summary>

Because it is the same mistake: data from a user is pasted into a language, here HTML and JavaScript, and the interpreter, here the browser, reads it as code instead of as text.

</details>

**2. A comment form saves comments, and every visitor sees them. Which kind of XSS can it have?**

<details>
<summary>Answer</summary>

Stored XSS: the script is saved on the server and runs for every visitor who opens the page.

</details>

**3. What does escaping turn `<script>` into, and what does the browser then do with it?**

<details>
<summary>Answer</summary>

`&lt;script&gt;`. The browser displays the text `<script>` on the screen and does not create a script element, so nothing runs.

</details>

**4. The guestbook sends `Content-Security-Policy: default-src 'self'`. Why is escaping still needed?**

<details>
<summary>Answer</summary>

The CSP is a second layer. Old browsers ignore it, a loose policy blocks little, and HTML that contains no script, such as a fake login form, is not stopped by it. Escaping prevents the injection itself.

</details>

**5. The session cookie has the `HttpOnly` flag. Is an XSS flaw harmless then?**

<details>
<summary>Answer</summary>

No. The script cannot read the cookie, but it runs inside the logged-in page, so it can send requests that the browser sends with the cookie, read what the page shows, and change the page.

</details>

## Common mistakes

- **Escaping on the way in instead of on the way out.** Store text as the user typed it, and escape it when it goes into a page. HTML codes saved in the database end up double-escaped in some places and missing in others.
- **Using `|safe` or `Markup` on user text.** In Jinja, `|safe` switches escaping off. It is meant for HTML your own code produced, never for text a user wrote.
- **Using `innerHTML` with user text.** In JavaScript, `textContent` shows text; `innerHTML` reads it as HTML. This is how DOM-based XSS happens, as lesson 8.3 warned.
- **Trusting a filter that removes `<script>`.** There are many other ways to run code, such as `<img src=x onerror=...>`. Escape everything instead of looking for bad words.
- **Testing with an alert on a site that is not yours.** Even a harmless alert is an attack on someone else's site. Use your own apps and the labs from lesson 12.6.

## Key terms

- **Cross-site scripting (XSS)**: a flaw where text from a user ends up in a page as HTML or JavaScript, so it runs in other users' browsers.
- **Stored XSS**: XSS whose script is saved on the server and shown to every visitor.
- **Reflected XSS**: XSS whose script is in the request, for example in a link, and is echoed back in the answer.
- **DOM-based XSS**: XSS where the page's own JavaScript puts untrusted text into the page as HTML.
- **Content security policy (CSP)**: an HTTP header that tells the browser which sources of scripts and other content a page may use.

## Go further

- [OWASP: Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html): how to escape correctly in each part of a page.
- [MDN: Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP): what each part of a policy means, and how to roll one out.
- [PortSwigger Web Security Academy: Cross-site scripting](https://portswigger.net/web-security/cross-site-scripting): lessons and labs for all three kinds.
