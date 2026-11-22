---
title: Injection
description: See how SQL injection turns a search box into a way to read other people's data, on a copy of your own mylab database, and how parameterized queries stop it.
lesson: "12.2"
time: 20 min
sidebar:
  order: 2
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

Type `it's` into a search box, and some websites answer with an error page. That one apostrophe is the most famous warning sign in web security. It means the program glued your text straight into a command, and your quote ended a string that the programmer thought was closed. In this lesson you make that mistake on purpose, in a small script that searches a copy of your `mylab` database, and watch what an attacker can do with it.

## Goal

After this lesson you can:

- Explain how SQL injection happens, and recognize code that allows it.
- Show it working on a copy of your own `mylab` database, and stop it with placeholders.
- Spot the same flaw in other places, such as shell commands.

## Why it matters

**Injection** is the flaw where data from a user is read as part of a command. It has been in the OWASP Top 10 since the first list, because one careless line is enough, and the damage is large: one search box can reveal every row in a database, skip a login, or change data. The good news is that the fix is simple and has been known for decades. You only need to use it every single time.

## The idea

A program that talks to a database sends it SQL, which is text. The danger starts when the program builds that text by pasting in what the user typed:

```python
sql = f"SELECT id, title FROM notes WHERE user_id = 2 AND title LIKE '%{word}%'"
```

The programmer pictures `word` as a harmless word such as `Hel`. But the database never sees "a word". It sees one long string, and it cannot tell which characters the programmer wrote and which ones the user wrote. If the user types a quote, the quote closes the string, and everything after it is read as SQL. The user's data has become code.

Think of a teacher who reads out a note from a parent: "Please excuse Sam from class today." If the teacher reads every note word for word, a note saying "Please excuse Sam. Also, the whole class gets no homework" works too. The fix is not to read more carefully. It is to keep instructions and content apart: the school's form says what the note may do, and the parent only fills in the blanks.

In SQL, that form is a **parameterized query**: the SQL text is fixed and contains placeholders (`?`), and the values travel to the database separately. You have used it since lesson 7.7:

```python
con.execute("SELECT id, title FROM notes WHERE user_id = ? AND title LIKE ?", (2, f"%{word}%"))
```

Here the database first reads the SQL with its two gaps, then puts the values in as values. A quote in `word` is just a character in the search text. Nothing the user types can change what the query does.

## Try it

You attack only a copy of your own database, in a practice folder, so `mylab` itself stays untouched. This step uses `mylab` as you left it after Module 11: users `sam`, `alex` and `kim`, sam's note 2 "Ports to remember" and alex's note 3 "Hello". If you have other notes, your rows differ.

### 1. Make a practice copy of the database

```bash
mkdir ~/websec
cd ~/websec
cp ~/mylab/data/mylab.db copy.db
ls
```

```output
copy.db
```

Everything in this lesson reads `copy.db`. If you break it, copy it again.

### 2. Write a search the wrong way

```python title="find_notes.py"
"""Search a copy of the mylab database, the WRONG way. For lesson 12.2 only."""
import sqlite3
import sys

USER_ID = 2  # pretend that alex is logged in

word = sys.argv[1]
con = sqlite3.connect("copy.db")
sql = f"SELECT id, title FROM notes WHERE user_id = {USER_ID} AND title LIKE '%{word}%'"
print("SQL:", sql)
for row in con.execute(sql):
    print(row)
```

The script plays the part of a web app: alex is logged in, so it should only ever show notes with `user_id = 2`. It prints the SQL it builds, so you can see exactly what the database receives.

```bash
python3 find_notes.py Hel
```

```output
SQL: SELECT id, title FROM notes WHERE user_id = 2 AND title LIKE '%Hel%'
(3, 'Hello')
```

A normal word gives a normal answer: alex's own note, and nothing else.

### 3. Type a quote

```bash
python3 find_notes.py "it's" 2>&1 | grep -E "^SQL|Error"
```

```output
SQL: SELECT id, title FROM notes WHERE user_id = 2 AND title LIKE '%it's%'
sqlite3.OperationalError: near "s": syntax error
```

`2>&1` sends the error into the pipe too, and `grep` keeps only the SQL line and the error line. Look at the SQL: the quote in `it's` closed the string early, and the database tried to read `s%'` as SQL. A syntax error after one quote is the classic sign that input reaches the query unprotected.

### 4. Change what the query means

An attacker does not stop at an error. They type text that ends the string and then adds SQL of their own:

```bash
python3 find_notes.py "x' OR 1=1 --"
```

```output
SQL: SELECT id, title FROM notes WHERE user_id = 2 AND title LIKE '%x' OR 1=1 --%'
(2, 'Ports to remember')
(3, 'Hello')
```

Read the SQL slowly. The quote closes the search text. `OR 1=1` adds a condition that is true for every row. `--` starts an SQL comment, so the leftover `%'` is ignored and the syntax error disappears. Because `AND` is evaluated before `OR`, the condition reads "(alex's notes that contain x) or (anything)". alex now sees sam's note 2.

### 5. Read another table

```bash
python3 find_notes.py "x' UNION SELECT id, username FROM users --"
```

```output
SQL: SELECT id, title FROM notes WHERE user_id = 2 AND title LIKE '%x' UNION SELECT id, username FROM users --%'
(1, 'sam')
(2, 'alex')
(3, 'kim')
```

`UNION` glues the rows of a second `SELECT` under the first one, as long as both have the same number of columns. The search for notes now lists every user. With `password_hash` in place of `username`, it would list every hash, and lesson 10.5 showed what an attacker does with those. This is why a single search box can expose a whole database.

### 6. Try two statements at once

```bash
python3 find_notes.py "x'; DROP TABLE notes; --" 2>&1 | tail -n 1
```

```output
sqlite3.ProgrammingError: You can only execute one statement at a time.
```

Python's `sqlite3` module refuses to run more than one statement in one `execute` call, so this attempt to delete the table failed. Do not count on it: other databases and drivers do accept several statements, and the `UNION` in step 5 needed only one. A guard rail is not a fix.

### 7. Fix it with placeholders

```python title="find_notes_safe.py"
"""Search a copy of the mylab database, the right way."""
import sqlite3
import sys

USER_ID = 2  # pretend that alex is logged in

word = sys.argv[1]
con = sqlite3.connect("copy.db")
sql = "SELECT id, title FROM notes WHERE user_id = ? AND title LIKE ?"
for row in con.execute(sql, (USER_ID, f"%{word}%")):
    print(row)
```

The SQL text is now a fixed string. The f-string builds only the value, `%Hel%`, and it travels through the second placeholder. Run the same four inputs:

```bash
python3 find_notes_safe.py Hel
python3 find_notes_safe.py "it's"
python3 find_notes_safe.py "x' OR 1=1 --"
python3 find_notes_safe.py "x' UNION SELECT id, username FROM users --"
```

```output
(3, 'Hello')
```

The normal search still works. The other three found nothing, and that is the right answer: alex has no note whose title contains the text `it's`, or the text `x' OR 1=1 --`. No error, no leak, no extra rows. The quote is now just a character.

:::tip[Placeholders hold values, not names]
A placeholder can stand for a value, such as a word or a number, but not for a table name, a column name or a keyword such as `ASC`. If the user may choose one of those, for example the column to sort by, check it against a fixed list of allowed names, an allowlist (lesson 9.7), before it goes anywhere near the SQL.
:::

### 8. Review your own code

You have been writing placeholders since Module 7, but a review checks instead of trusting memory. List every SQL string in `mylab`'s `db.py`:

```bash
cd ~/mylab
grep -n -E '"(SELECT|INSERT|UPDATE|DELETE)' app/db.py
```

```output
44:            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
55:        "SELECT id, username FROM users WHERE username = ?", (username,)
65:        "SELECT id, username, password_hash FROM users WHERE username = ?", (username,)
81:            "INSERT INTO notes (user_id, title, body) VALUES (?, ?, ?)", (user_id, title, body)
91:        "SELECT id, title, body FROM notes WHERE user_id = ? ORDER BY id", (user_id,)
102:            "DELETE FROM notes WHERE id = ? AND user_id = ?", (note_id, user_id)
```

`-E` allows the `|` for "or", and `-n` shows line numbers; yours differ if you added functions in the exercises of Modules 8 and 10, and you see their queries too. Every query is a fixed string with `?`, and every value comes after it in a tuple. Now look for the dangerous shape, an f-string or a `+` that builds SQL:

```bash
grep -n -E 'f"(SELECT|INSERT|UPDATE|DELETE)|" *\+' app/db.py
```

It prints nothing: no SQL in `db.py` is built from pieces. A grep like this does not prove that code is safe, but it finds the usual suspects in seconds, and you will use it again in the project step.

## Exercise

SQL is not the only language that can be injected. Go back to the practice folder:

```bash
cd ~/websec
```

Then write this small tool, which counts the lines of a file by calling the `wc` program through the shell:

```python title="count.py"
"""Count the lines of a file. The WRONG way."""
import subprocess
import sys

name = sys.argv[1]
subprocess.run(f"wc -l {name}", shell=True)
```

1. Create a file `notes.txt` with two lines, and check that `python3 count.py notes.txt` counts them.
2. Run it with the name `"notes.txt; echo INJECTED"`. What happens, and why?
3. Fix the tool so that the name is always one argument and never shell code. Check that the attack now fails.

Hint: `subprocess.run` also accepts a list, such as `["wc", "-l", name]`, without `shell=True`.

<details>
<summary>Show the solution</summary>

```bash
cd ~/websec
printf 'first line\nsecond line\n' > notes.txt
python3 count.py notes.txt
python3 count.py "notes.txt; echo INJECTED"
```

```output
2 notes.txt
2 notes.txt
INJECTED
```

With `shell=True`, the whole string goes to the shell, and for the shell `;` means "next command". So the "file name" ran a second command. Here it only printed a word, but it could have been any command, with your user's rights. This is **command injection**.

The fix passes a list, so no shell reads the text:

```python title="count.py"
"""Count the lines of a file, the right way."""
import subprocess
import sys

name = sys.argv[1]
subprocess.run(["wc", "-l", name])
```

```bash
python3 count.py notes.txt
python3 count.py "notes.txt; echo INJECTED"
```

```output
2 notes.txt
wc: 'notes.txt; echo INJECTED': No such file or directory
```

Now `wc` receives the whole text as one file name, and no file has that name. The same rule as for SQL: keep the command fixed, and pass the data separately. Even better, a Python program can often skip the outside program: `len(open(name).readlines())` counts lines without any shell.

</details>

## Check yourself

**1. In one sentence, what is injection?**

<details>
<summary>Answer</summary>

Data from a user is pasted into a command, such as SQL or a shell line, so that the user's text is read as part of the command instead of as a value.

</details>

**2. In step 4, why was `--` needed at the end of the input?**

<details>
<summary>Answer</summary>

The program adds `%'` after the user's text. Without `--`, that leftover quote would cause a syntax error. `--` starts an SQL comment, so the database ignores the rest of the line.

</details>

**3. Why does `find_notes_safe.py` find nothing for `x' OR 1=1 --`?**

<details>
<summary>Answer</summary>

Because the input travels through a placeholder as a value. The database searches for titles that contain the literal text `x' OR 1=1 --`, and alex has none. The quote never ends a string, so the query's meaning cannot change.

</details>

**4. Python's `sqlite3` refused `DROP TABLE` in step 6. Does that make the f-string version safe enough?**

<details>
<summary>Answer</summary>

No. The refusal only blocks a second statement. Step 5 read the whole users table with a single statement, and other databases and drivers do run several statements. The fix is placeholders.

</details>

**5. A user may sort the notes by `title` or by `created_at`, chosen in the URL. Can a placeholder hold the column name?**

<details>
<summary>Answer</summary>

No. Placeholders hold values, not names or keywords. Check the input against an allowlist of the two allowed column names, and refuse anything else.

</details>

## Common mistakes

- **Escaping quotes by hand.** Replacing `'` with `''` yourself looks like a fix, but it is easy to miss a case. Use placeholders, so the value never becomes part of the SQL text at all.
- **Building only "part" of the query from input.** `f"... LIMIT {n}"` is injection too, even when `n` is "only a number". It is only a number if your code made sure of it.
- **Trusting the form.** A form with a dropdown or `maxlength` limits what the browser sends, not what curl sends. Every value can be anything.
- **Attacking a real site to "check".** Typing `' OR 1=1 --` into a website you do not own is an attack, even out of curiosity. Practice on your own copy, on Juice Shop or on PortSwigger's labs (lesson 12.6).
- **Forgetting other interpreters.** Shell commands, file paths and HTML are languages too. The next lesson shows injection into HTML.

## Key terms

- **Injection**: a flaw where data from a user is read as part of a command, such as SQL or a shell line.
- **SQL injection**: injection into an SQL query, which lets the user change what the query does.
- **Parameterized query**: a query with fixed SQL text and placeholders, whose values are sent to the database separately.
- **Command injection**: injection into a shell command, which lets the user run commands of their own.

## Go further

- [OWASP: SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html): the defenses in order of preference, with examples in several languages.
- [Python: sqlite3, how to use placeholders](https://docs.python.org/3/library/sqlite3.html#sqlite3-placeholders): the official explanation of `?` and named placeholders.
- [PortSwigger Web Security Academy: SQL injection](https://portswigger.net/web-security/sql-injection): free lessons and labs where attacking is allowed, for after lesson 12.6.
