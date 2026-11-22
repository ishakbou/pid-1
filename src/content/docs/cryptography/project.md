---
title: "Project step: safe passwords in mylab"
description: Replace the plain-text passwords of the mylab web app with salted scrypt hashes, migrate the existing users, and write down how the app would use TLS.
lesson: "10.6"
time: 25 min
sidebar:
  order: 6
---

<!-- lab: run
curl() { command curl --no-progress-meter "$@"; }
sudo apt-get install -y -q python3-venv sqlite3 > /dev/null 2>&1
printf '.headers on\n.mode table\n' > ~/.sqliterc
pkill -f app/app.py
rm -f /tmp/sam.txt /tmp/alex.txt /tmp/kim.txt
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab
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
    password   TEXT NOT NULL,  -- plain text for now: Module 10 replaces it with a safe hash
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
cat > app/db.py <<'EOF'
"""The mylab database: create it, and add and read users and notes.

Run it from the mylab folder:
    python3 app/db.py init
    python3 app/db.py add-user USERNAME PASSWORD
    python3 app/db.py add-note USERNAME TITLE [BODY]
    python3 app/db.py notes USERNAME
    python3 app/db.py delete-note USERNAME NOTE_ID
"""
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # the mylab folder
DB_PATH = ROOT / "data" / "mylab.db"
SCHEMA_PATH = ROOT / "app" / "schema.sql"


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
            "INSERT INTO users (username, password) VALUES (?, ?)", (username, password)
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
        "SELECT id, username FROM users WHERE username = ? AND password = ?",
        (username, password),
    ).fetchone()
    con.close()
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

## 1. What are we working on?

mylab is my practice project. The web app runs only on my own computer,
on 127.0.0.1. The code is public on GitHub.

| Asset | Where it lives | What matters most |
|---|---|---|
| Accounts and passwords | data/mylab.db | Confidentiality |
| The users' notes | data/mylab.db | Confidentiality, integrity |
| The code | the git repository and GitHub | Integrity |
| My GitHub account | github.com | Confidentiality of its password |

## 2. What can go wrong?

Attackers: anyone who reads my public repository; other users and
programs on my computer; anyone who can reach the app if it is ever put
online; and me, by mistake.

| ID | Risk | L | I | Score |
|---|---|---|---|---|
| R1 | A secret is committed and published on GitHub | 2 | 3 | 6 |
| R2 | The database is lost: dead disk or deleted by mistake | 2 | 2 | 4 |
| R3 | Passwords are stored as plain text in the database | 1 | 3 | 3 |
| R4 | A form lets someone inject SQL or HTML into the app | 1 | 3 | 3 |
| R5 | A logged-in user can read another user's notes | 1 | 3 | 3 |
| R6 | Nobody notices repeated failed logins | 3 | 1 | 3 |
| R7 | Every user of the computer can read data/mylab.db | 1 | 2 | 2 |

L is likelihood and I is impact, from 1 to 3. Likelihood is low for R3,
R4 and R5 because the app listens only on 127.0.0.1. If it is ever put
online, those three become likely.

## 3. What are we going to do about it?

| ID | Plan | When |
|---|---|---|
| R1 | Run git ls-files before every push; keep secrets out of the code | Now |
| R2 | Back up data/mylab.db to another device | Module 13 |
| R3 | Store salted, slow password hashes | Module 10 |
| R4 | Fix injection and XSS, and add tests | Module 12 |
| R5 | Check on the server that each note belongs to the user | Module 12 |
| R6 | Structured logs and an alert on failed logins | Module 13 |
| R7 | chmod 600 data/mylab.db | Done in Module 9 |

## 4. Did we do a good enough job?

- A risk is closed only when a command or a test shows that the fix works.
- I read this file again at the end of Modules 10, 11, 12 and 13.
EOF
python3 app/db.py init > /dev/null
python3 app/db.py add-user sam test-pass-1 > /dev/null
python3 app/db.py add-user alex test-pass-2 > /dev/null
python3 app/db.py add-note sam "Lab ideas" "Try the database from Module 7" > /dev/null
python3 app/db.py add-note sam "Ports to remember" "22 ssh, 80 http, 443 https" > /dev/null
python3 app/db.py add-note alex "Hello" > /dev/null
python3 app/db.py delete-note sam 1 > /dev/null
chmod 600 data/mylab.db
python3 -m venv .venv
.venv/bin/pip install -q pytest flask > /dev/null 2>&1
.venv/bin/pip freeze > requirements.txt
git init -q
git add .
git commit -q -m "mylab after Module 9"
cd ~
-->

Right now, anyone who gets a copy of `data/mylab.db` can read every password in it. That has been a known flaw since Module 7, written down as risk R3 in your threat model, and kept on purpose until you knew how to fix it. Now you do. In this step the passwords become salted scrypt hashes, the existing users keep working, and nobody has to choose a new password.

## Goal

After this lesson you can:

- Store and check the passwords of a real web app with a salted, slow hash.
- Migrate the data of an existing database safely, all or nothing, and remove the old values from the file.
- Write down how the app would be served over TLS once it leaves your computer.

## Why it matters

Fixing a design flaw in a project that already has users is the normal case in real work. You rarely get to start again from an empty database, so you need a change that converts the old data in place and can be run safely. And a fix only counts when a command shows it works, as the last section of your threat model says.

## The idea

The change touches four files and adds two:

```text
mylab/
    app/
        passwords.py           new: hash_password and verify_password from lesson 10.5
        migrate_passwords.py   new: a one-time script that converts the existing users
        db.py                  add_user and check_login use passwords.py
        schema.sql             the column password becomes password_hash
    docs/
        tls-notes.md           new: how mylab would use TLS
        threat-model.md        R3 is closed
```

`app.py` does not change at all. It calls `db.check_login` as before, and only the inside of that function is different. Keeping the password logic in one small module means that you can change it later, for example to Argon2 with a library, in one place.

The users that already exist are converted with a **migration**: a script that changes the structure and the data of an existing database once, in a fixed order. This one renames the column `password` to `password_hash`, then replaces each plain password with its hash. It runs in one **transaction**, a group of changes that the database applies completely or not at all. If anything fails halfway, nothing is changed, and you never end up with half the users unable to log in.

The plain passwords are converted, not thrown away, because the users must keep their passwords. That is possible only because they are still readable right now. Once hashed, nobody can get them back, which is exactly the point.

## Try it

This step continues the `mylab` repository from the [Module 8 project step](../web/project/), with the threat model from the [Module 9 project step](../security-basics/project/). The users are sam with `test-pass-1` and alex with `test-pass-2`, and `sqlite3` uses the `~/.sqliterc` settings from lesson 7.1. Wherever you see `sam`, your screen shows your own name.

### 1. Look at the problem

```bash
cd ~/mylab
sqlite3 data/mylab.db "SELECT id, username, password FROM users;"
```

```output
+----+----------+-------------+
| id | username |  password   |
+----+----------+-------------+
| 1  | sam      | test-pass-1 |
| 2  | alex     | test-pass-2 |
+----+----------+-------------+
```

This is what a thief would see. Remember it, because in a few minutes this query will not even work any more.

### 2. Add the password module

```python title="app/passwords.py"
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
```

It is exactly `passwords.py` from lesson 10.5. If you still have it, `cp ~/crypto/passwords.py app/` does the same. It uses only the standard library, so `db.py` keeps working outside the venv, as before.

### 3. Change the schema

In `app/schema.sql`, replace the `password` line of the `users` table:

```sql
    password_hash TEXT NOT NULL,  -- scrypt string from app/passwords.py, never the password
```

<!-- lab: run
cd ~/mylab
python3 - <<'EOF'
path = "app/schema.sql"
code = open(path).read()
old = "    password   TEXT NOT NULL,  -- plain text for now: Module 10 replaces it with a safe hash\n"
new = "    password_hash TEXT NOT NULL,  -- scrypt string from app/passwords.py, never the password\n"
assert old in code
open(path, "w").write(code.replace(old, new, 1))
EOF
-->

The schema builds new databases. Existing ones are changed by the migration in step 5.

### 4. Change db.py

In `app/db.py`, change the part after the docstring so that it reads like this. Two imports and one line at the end are new:

```python
import secrets
import sqlite3
import sys
from pathlib import Path

from passwords import hash_password, verify_password

ROOT = Path(__file__).resolve().parent.parent  # the mylab folder
DB_PATH = ROOT / "data" / "mylab.db"
SCHEMA_PATH = ROOT / "app" / "schema.sql"
NO_USER_HASH = hash_password(secrets.token_hex(16))  # checked when a name does not exist
```

Then replace `add_user` and `check_login`:

```python
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
```

```python
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
```

<!-- lab: run
cd ~/mylab
python3 - <<'EOF'
path = "app/db.py"
code = open(path).read()
def swap(old, new):
    global code
    assert old in code, old
    code = code.replace(old, new, 1)
swap("import sqlite3\nimport sys\nfrom pathlib import Path\n",
     "import secrets\nimport sqlite3\nimport sys\nfrom pathlib import Path\n\nfrom passwords import hash_password, verify_password\n")
swap('SCHEMA_PATH = ROOT / "app" / "schema.sql"\n',
     'SCHEMA_PATH = ROOT / "app" / "schema.sql"\nNO_USER_HASH = hash_password(secrets.token_hex(16))  # checked when a name does not exist\n')
swap('''        cur = con.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)", (username, password)
        )
''', '''        cur = con.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (username, hash_password(password)),
        )
''')
swap('''    row = con.execute(
        "SELECT id, username FROM users WHERE username = ? AND password = ?",
        (username, password),
    ).fetchone()
    con.close()
    return row
''', '''    row = con.execute(
        "SELECT id, username, password_hash FROM users WHERE username = ?", (username,)
    ).fetchone()
    con.close()
    if row is None:
        verify_password(password, NO_USER_HASH)  # take as long as for a real user
        return None
    if not verify_password(password, row["password_hash"]):
        return None
    return row
''')
open(path, "w").write(code)
EOF
-->

`add_user` now stores the hash string, never the password. `check_login` can no longer ask SQL to compare passwords, because the salt makes every hash different. So it fetches the user by name, then lets `verify_password` compare.

Look at the case of an unknown name. Without the extra line, a wrong name would return at once, while a wrong password takes the time of one scrypt hash. An attacker could time the answers and learn which usernames exist. Checking against `NO_USER_HASH` makes both cases take the same time. It is made from a random value when `db.py` is loaded, so no password matches it.

Python finds `passwords.py` because it sits in `app/`, the folder of the script that runs: `app.py` or `db.py` itself.

### 5. Migrate the existing users

```python title="app/migrate_passwords.py"
"""One-time change: replace the plain-text passwords with scrypt hashes.

Run it once from the mylab folder:  python3 app/migrate_passwords.py
"""
import db
from passwords import hash_password

con = db.connect()
columns = [row["name"] for row in con.execute("PRAGMA table_info(users)")]
if "password" not in columns:
    print("nothing to do: the passwords are already hashed")
else:
    with con:
        con.execute("BEGIN")
        con.execute("ALTER TABLE users RENAME COLUMN password TO password_hash")
        rows = con.execute("SELECT id, password_hash FROM users").fetchall()
        for row in rows:
            con.execute(
                "UPDATE users SET password_hash = ? WHERE id = ?",
                (hash_password(row["password_hash"]), row["id"]),
            )
    con.execute("VACUUM")
    print(f"{len(rows)} passwords hashed")
con.close()
```

Read it from the top. `PRAGMA table_info(users)` lists the columns of the table, so the script can tell whether it already ran. `BEGIN` starts the transaction by hand, so that the rename and the updates happen together, and `with con:` commits them at the end, or undoes all of them if an error happens. Right after the rename, the column `password_hash` still holds the plain passwords; each `UPDATE` replaces one of them with its hash. `VACUUM` rebuilds the database file from the data that is still in use, so that no old values are left in unused parts of it.

```bash
python3 app/migrate_passwords.py
python3 app/migrate_passwords.py
```

```output
2 passwords hashed
nothing to do: the passwords are already hashed
```

The second run changed nothing. A migration that is safe to run twice spares you a lot of worry when you are not sure whether it already ran.

### 6. Look at the database again

```bash
sqlite3 data/mylab.db "SELECT id, username, password FROM users;"
```

```output
Error: in prepare, no such column: password
  SELECT id, username, password FROM users;
                       ^--- error here
```

The query from step 1 fails: the column is gone. Here is what is there now:

```bash
sqlite3 data/mylab.db "SELECT id, username, substr(password_hash, 1, 18), length(password_hash) FROM users;"
```

```output
+----+----------+------------------------------+-----------------------+
| id | username | substr(password_hash, 1, 18) | length(password_hash) |
+----+----------+------------------------------+-----------------------+
| 1  | sam      | scrypt$131072$8$1$           | 179                   |
| 2  | alex     | scrypt$131072$8$1$           | 179                   |
+----+----------+------------------------------+-----------------------+
```

`substr` shows the first 18 characters and `length` the size of each value: the algorithm and its settings, then the salt and the hash, 179 characters in all. sam and alex have different passwords, but even if they had the same one, their strings would differ, because each has its own salt.

### 7. Check that the old passwords left the file

A database file is not just its tables. In its default setting, when SQLite changes or deletes a value, it does not erase the old bytes: it only marks the space as free, and the bytes stay in the file until something writes over them. Recovering deleted data this way is a standard trick of forensics. Ubuntu's build of SQLite turns on a setting called `secure_delete`, which writes zeros over freed space, but many other builds leave it off, and you cannot know where a copy of your app will run one day. So check the file itself. `grep -a` searches a binary file as if it were text:

```bash
grep -a -c "test-pass" data/mylab.db
```

```output
0
```

`-c` counts the matching lines: none. The `VACUUM` at the end of the migration copied only the live data into a fresh file, so no free space with old bytes is left to search, whatever the setting of the SQLite build. Copies made before today, such as a backup, still hold the plain passwords, so delete any you have.

### 8. Log in through the app

The app needs Flask, so it runs in the venv:

```bash
source .venv/bin/activate
python3 app/app.py > logs/app.log 2>&1 &
```

<!-- lab: run
for i in $(seq 300); do ss -ltn | grep -q ':5000 ' && break; sleep 0.2; done
-->

```bash
curl -s -c /tmp/sam.txt -b /tmp/sam.txt -d "username=sam&password=wrong" http://127.0.0.1:5000/login | grep error
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -c /tmp/sam.txt -b /tmp/sam.txt -d "username=sam&password=test-pass-1" http://127.0.0.1:5000/login
curl -s -b /tmp/sam.txt http://127.0.0.1:5000/notes | grep "<h2>"
```

```output
    <p class="error" role="alert">Wrong username or password.</p>
302 http://127.0.0.1:5000/notes
      <h2>Ports to remember</h2>
  <h2>New note</h2>
```

The same requests as in lesson 8.8, with the same answers: a wrong password gets the error, the right one gets the redirect and sam's notes. sam did not need a new password. You may notice that a login now takes a moment: that is scrypt doing its job.

### 9. Add a new user from the terminal

```bash
python3 app/db.py add-user kim test-pass-3
sqlite3 data/mylab.db "SELECT username, substr(password_hash, 1, 18) FROM users WHERE username = 'kim';"
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -c /tmp/kim.txt -b /tmp/kim.txt -d "username=kim&password=test-pass-3" http://127.0.0.1:5000/login
```

```output
user 'kim' has id 3
+----------+------------------------------+
| username | substr(password_hash, 1, 18) |
+----------+------------------------------+
| kim      | scrypt$131072$8$1$           |
+----------+------------------------------+
302 http://127.0.0.1:5000/notes
```

New users are hashed from the start, by `add_user`, and kim can log in. Stop the app:

```bash
pkill -f app/app.py
deactivate
```

### 10. Write the TLS notes

`mylab` listens only on `127.0.0.1`, so its traffic never leaves your computer, and it has no TLS. Write down what would have to change before it could ever go online, while lesson 10.4 is fresh:

```markdown title="docs/tls-notes.md"
# TLS notes for mylab

## Today

The app runs on 127.0.0.1:5000 with plain HTTP. The traffic never leaves
this computer, so there is nothing on the way to read or change it.

## Before mylab could go online

- Serve it only over HTTPS, with TLS 1.3 (TLS 1.2 at the oldest).
- Get a certificate from a public CA for a real domain name, for example
  from Let's Encrypt, and renew it automatically.
- Put the name in the certificate's subject alternative name.
- Keep the private key readable by the server only (chmod 600), outside
  the repository.
- Send session cookies only over HTTPS (Flask: SESSION_COOKIE_SECURE).
- Never turn certificate checks off in scripts (no curl -k).

## How to check it

    openssl s_client -connect NAME:443 -brief < /dev/null
    curl -sv https://NAME/ 2>&1 | grep "SSL connection"

Look for: Verification: OK, the protocol version, and the cipher suite.
```

`SESSION_COOKIE_SECURE` is a Flask setting that adds the `Secure` flag from lesson 8.6 to the session cookie, so the browser never sends it over plain HTTP. It stays off for now, because over plain HTTP on `127.0.0.1` the login would stop working. The lines with four spaces in front are shown as code in Markdown.

### 11. Close the risk and commit

Your threat model says a risk is closed only when a command shows that the fix works. Steps 6 to 9 showed it, so mark R3 as done:

```bash
sed -i 's/| R3 | Store salted, slow password hashes | Module 10 |/| R3 | Store salted, slow password hashes | Done in Module 10 |/' docs/threat-model.md
grep "^| R3" docs/threat-model.md
```

```output
| R3 | Passwords are stored as plain text in the database | 1 | 3 | 3 |
| R3 | Store salted, slow password hashes | Done in Module 10 |
```

`sed -i 's/old/new/'` replaces text inside a file. Now commit:

```bash
git status --short
```

```output
 M app/db.py
 M app/schema.sql
 M docs/threat-model.md
?? app/migrate_passwords.py
?? app/passwords.py
?? docs/tls-notes.md
```

The database is still ignored, so its new hashes stay out of git too, which is right: hashes are safer than passwords, but they are still not meant to be public.

```bash
git add app/db.py app/schema.sql app/passwords.py app/migrate_passwords.py docs/threat-model.md docs/tls-notes.md
git commit -q -m "Store passwords as salted scrypt hashes"
git log --oneline -1 --format=%s
```

```output
Store passwords as salted scrypt hashes
```

## Exercise

Users need a way to change their password. Add a function `set_password(username, new_password)` to `db.py` that stores the hash of the new password and returns `True` if the user exists. Add a command `set-password USERNAME PASSWORD` to the command line in `main`. Test that after `set-password alex test-pass-9`, alex can no longer log in with `test-pass-2`, but can with `test-pass-9`. Use `check_login` from Python to test it.

<details>
<summary>Show the solution</summary>

In `app/db.py`, after `check_login`:

```python
def set_password(username, new_password):
    """Store a new password for the user. Return True if the user exists."""
    con = connect()
    with con:
        cur = con.execute(
            "UPDATE users SET password_hash = ? WHERE username = ?",
            (hash_password(new_password), username),
        )
    con.close()
    return cur.rowcount == 1
```

In `main`, before the last `else:`:

```python
    elif len(args) == 3 and args[0] == "set-password":
        if not set_password(args[1], args[2]):
            print(f"no user {args[1]!r}")
            return 1
        print(f"password changed for {args[1]!r}")
```

<!-- lab: run
cd ~/mylab
python3 - <<'EOF'
path = "app/db.py"
code = open(path).read()
func = '''def set_password(username, new_password):
    """Store a new password for the user. Return True if the user exists."""
    con = connect()
    with con:
        cur = con.execute(
            "UPDATE users SET password_hash = ? WHERE username = ?",
            (hash_password(new_password), username),
        )
    con.close()
    return cur.rowcount == 1


'''
assert "def add_note(" in code
code = code.replace("def add_note(", func + "def add_note(", 1)
cmd = '''    elif len(args) == 3 and args[0] == "set-password":
        if not set_password(args[1], args[2]):
            print(f"no user {args[1]!r}")
            return 1
        print(f"password changed for {args[1]!r}")
    else:
        print(__doc__)
'''
old = '''    else:
        print(__doc__)
'''
assert old in code
code = code.replace(old, cmd, 1)
open(path, "w").write(code)
EOF
-->

```bash
python3 app/db.py set-password alex test-pass-9
python3 app/db.py set-password nobody test-pass-9
cd app
python3 -c 'import db; print(db.check_login("alex", "test-pass-2")); print(dict(db.check_login("alex", "test-pass-9"))["username"])'
cd ..
```

```output
password changed for 'alex'
no user 'nobody'
None
alex
```

The old password no longer matches, and the new one does. The test runs inside `app/`, so that Python finds `db.py` and `passwords.py` there. `dict(...)["username"]` prints only the name from the row, not the whole row with its hash. In a real app, changing a password would also ask for the old password first, and end the user's other sessions. Add the command to the help text at the top of `db.py` too, and commit:

<!-- lab: run
cd ~/mylab
sed -i 's|    python3 app/db.py delete-note USERNAME NOTE_ID|    python3 app/db.py delete-note USERNAME NOTE_ID\n    python3 app/db.py set-password USERNAME PASSWORD|' app/db.py
-->

```bash
git commit -q -am "Add a set-password command"
git log --oneline -2 --format=%s
```

```output
Add a set-password command
Store passwords as salted scrypt hashes
```

</details>

## Check yourself

**1. Why does `check_login` no longer use `WHERE username = ? AND password = ?` in SQL?**

<details>
<summary>Answer</summary>

Because each stored value contains its own random salt. SQL cannot hash the typed password with the right salt and settings, so the function fetches the row by name and lets `verify_password` do the comparison in Python.

</details>

**2. What is `NO_USER_HASH` for?**

<details>
<summary>Answer</summary>

When the username does not exist, `check_login` still checks the typed password against this dummy hash. Both a wrong name and a wrong password then take the time of one scrypt hash, so timing the answers does not reveal which usernames exist.

</details>

**3. The migration renames the column and updates every row inside one transaction. What would go wrong without it?**

<details>
<summary>Answer</summary>

If the script stopped halfway, some users would have hashes and others would still have plain passwords, or the column would be renamed without any hashes. With the transaction, the database applies all the changes or none of them.

</details>

**4. After the migration, why run `VACUUM`?**

<details>
<summary>Answer</summary>

When SQLite replaces a value, the old bytes can stay in space that is only marked as free, unless the SQLite build overwrites freed space (Ubuntu's does, many others do not). `VACUUM` rebuilds the file from the live data only, so no old plain-text password can be left anywhere in it. `grep -a -c "test-pass" data/mylab.db` checks it.

</details>

**5. Why does `app.py` not need any change?**

<details>
<summary>Answer</summary>

It only calls `db.check_login(username, password)` and uses the row it returns. The function keeps the same name, arguments and result; only the way it checks the password changed inside `db.py`.

</details>

## Common mistakes

- **Running the old schema on an old database.** `CREATE TABLE IF NOT EXISTS` never changes an existing table. Existing databases need the migration; only new ones are built from `schema.sql`.
- **Hashing the hashes.** Running a migration that does not check whether it already ran would hash the hash strings, and nobody could log in. That is why the script looks at the columns first.
- **`ModuleNotFoundError: No module named 'passwords'`.** `passwords.py` must be in `app/`, next to `db.py`. Python looks for modules in the folder of the script it runs.
- **Old copies of the database.** Backups made before the migration still hold plain passwords. Delete them, or the fix is only half done.
- **Real passwords in mylab.** The passwords are now stored safely, but the app is still a practice app with known flaws, which Module 12 fixes. Keep using test passwords.

## Key terms

- **Migration**: a script that changes the structure and data of an existing database once, in a fixed order.
- **Transaction**: a group of database changes that is applied completely or not at all.
- **VACUUM**: an SQLite command that rebuilds the database file from its live data, which also removes old deleted values.

## Go further

- [OWASP: Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html): login rules that real apps follow, including generic error messages and equal response times.
- [SQLite: ALTER TABLE](https://www.sqlite.org/lang_altertable.html): what `RENAME COLUMN` can do, and how to make bigger changes to a table.
- [SQLite: VACUUM](https://www.sqlite.org/lang_vacuum.html): what `VACUUM` rebuilds, and when to run it.
