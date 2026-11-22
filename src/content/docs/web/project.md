---
title: "Project step: the mylab web app"
description: Turn mylab into a small notes app with Flask, with HTML templates, a style sheet, a login kept in a signed session, and the database from Module 7.
lesson: "8.8"
time: 25 min
sidebar:
  order: 8
---

<!-- lab: run
curl() { command curl --no-progress-meter "$@"; }
sudo apt-get install -y -q python3-venv sqlite3 > /dev/null 2>&1
pkill -f app/server.py
pkill -f app/app.py
rm -f /tmp/sam.txt /tmp/alex.txt
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs ~/mylab/tools ~/mylab/app
cd ~/mylab
printf '# mylab\n\nMy lab for the PID 1 course.\n' > README.md
printf '# Secrets: never commit them\n.env\n# Temporary files\n*.tmp\n# Reports and logs that scripts write\nlogs/\n.venv/\n__pycache__/\ndata/*.db\n' > .gitignore
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
python3 app/db.py init > /dev/null
python3 app/db.py add-user sam test-pass-1 > /dev/null
python3 app/db.py add-user alex test-pass-2 > /dev/null
python3 app/db.py add-note sam "Lab ideas" "Try the database from Module 7" > /dev/null
python3 app/db.py add-note sam "Ports to remember" "22 ssh, 80 http, 443 https" > /dev/null
python3 app/db.py add-note alex "Hello" > /dev/null
python3 app/db.py delete-note sam 1 > /dev/null
python3 -m venv .venv
.venv/bin/pip install -q pytest > /dev/null 2>&1
.venv/bin/pip freeze > requirements.txt
git init -q
git add .
git commit -q -m "mylab after Module 7"
cd ~
-->

So far `mylab` has a database that only you can use, from the terminal. Today it gets a face: pages in a browser, a login, a list of your notes and a form to write new ones. You use everything from this module at once, HTML, CSS, forms, routes, cookies and sessions, and at the end your lab is a real, small web application.

## Goal

After this lesson you can:

- Build a Flask app with HTML templates and a style sheet, on top of the `db.py` module from Module 7.
- Add a login that keeps the user in a signed session, with the secret key kept out of git.
- Check every request on the server: who is logged in, what they sent, and whether the note is theirs.

## Why it matters

Almost every web application has the same skeleton: a login, pages built from a database, and forms that change data. Once you have built one yourself, you can read the others. This app is also your target for the next modules. Module 10 fixes its passwords, Module 12 tests it for the common web flaws, and Module 13 watches its logins, so the more clearly you understand it now, the easier those modules are.

## The idea

The app joins the pieces you already have:

```text
mylab/
    app/
        db.py              from Module 7, with one new function
        app.py             new: the Flask app and its routes
        templates/         new: the HTML of each page
            base.html
            login.html
            notes.html
        static/
            style.css      new: one style sheet for every page
    data/
        mylab.db           the database, ignored by git
        secret_key         new: signs the session cookies, ignored by git
    requirements.txt       now lists Flask too
```

The app answers five addresses:

| Method and path | What it does |
|---|---|
| `GET /` | Sends you to your notes, or to the login page if you are not logged in |
| `GET /login`, `POST /login` | Shows the login form, and checks the name and password it sends |
| `POST /logout` | Ends the session |
| `GET /notes`, `POST /notes` | Lists your notes, and adds a new one |
| `POST /notes/<id>/delete` | Deletes one of your notes |

Each page is built from a **template**: an HTML file with gaps in it, which Flask fills with values for each request. Flask uses a template language called **Jinja**. `{{ note.title }}` puts a value into the page, and `{% for ... %}` or `{% if ... %}` control which parts appear. It works like a form letter: the text is written once, and a name and an address are filled in for each person.

Templates also protect you. Before Jinja puts a value into the page, it **escapes** it: it replaces the characters that have a meaning in HTML, such as `<` and `>`, with codes that only display them, such as `&lt;` and `&gt;`. A note whose title contains HTML tags is shown as text, and never becomes part of the page. You will see it happen in step 8.

The app is simple on purpose. Users are added from the terminal with `db.py`, there is no sign-up page, and the passwords are still stored in plain text, as in Module 7. It runs on Flask's development server, on `127.0.0.1` only. Later modules make it safer step by step.

## Try it

This step continues the `mylab` repository from the earlier modules, with `app/db.py` and the database from the [Module 7 project step](../databases/project/), and the venv and `requirements.txt` from the [Module 3 project step](../python/project/). The notes shown are the ones left at the end of lesson 7.8, after its exercise deleted note 1: sam has note 2, "Ports to remember", and alex has note 3, "Hello". If you have other notes, your ids and counts below differ too. Wherever you see `sam`, your screen shows your own name.

### 1. Add a login check to db.py

```bash
cd ~/mylab
ls app
```

```output
db.py  schema.sql  server.py
```

The app needs one question that `db.py` cannot answer yet: "do this name and this password belong together?". Add this function to `app/db.py`, right after `find_user`:

```python
def check_login(username, password):
    """Return the user's row if the name and password match, or None."""
    con = connect()
    row = con.execute(
        "SELECT id, username FROM users WHERE username = ? AND password = ?",
        (username, password),
    ).fetchone()
    con.close()
    return row
```

<!-- lab: run
cd ~/mylab
python3 - <<'EOF'
path = "app/db.py"
code = open(path).read()
func = '''def check_login(username, password):
    """Return the user's row if the name and password match, or None."""
    con = connect()
    row = con.execute(
        "SELECT id, username FROM users WHERE username = ? AND password = ?",
        (username, password),
    ).fetchone()
    con.close()
    return row


'''
code = code.replace("def add_note(", func + "def add_note(", 1)
open(path, "w").write(code)
EOF
-->

Both values go in placeholders, as everywhere in `db.py`. The function returns the same kind of row as `find_user`, but only when the password matches too. Module 10 rewrites it to compare password hashes instead.

The app also uses `delete_note` from the exercise in lesson 7.8. If you skipped that exercise, add the function now, as shown in its solution.

### 2. Install Flask in the mylab venv

```bash
source .venv/bin/activate
```

<!-- lab: nocheck -->
```bash
pip install -q flask
pip freeze > requirements.txt
grep -i flask requirements.txt
```

```output
Flask==3.1.3
```

`mylab` already has a venv from Module 3, so Flask goes into it. `pip freeze` writes the new list of packages: Flask, the packages it needs, and pytest from before. Your version may be newer.

### 3. Write the app

```python title="app/app.py"
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
```

Read it in four parts.

- **The setup.** `import db` works because Python looks for modules in the folder of the script it runs, which is `app/`. `load_secret_key` keeps the key in `data/secret_key`: it makes a random one the first time, with permissions `600` so only you can read it (lesson 1.4), and reads the same one after every restart, so a restart does not log everyone out. The session cookie gets `SameSite=Lax` from lesson 8.6. `db.init_db()` makes sure the tables exist.
- **Login and logout.** `@app.route` with two methods lets one function answer both: the GET shows the form, the POST checks it. On success, the session gets the user's id and name. `session.clear()` first throws away anything an older session held. A wrong password gets the same form again, with an error and the status 401.
- **The notes.** Every notes route starts with the same check: no `user_id` in the session, no notes. The user id always comes from the signed session, never from the form, so nobody can ask for another user's notes by sending a different id. The new note is checked on the server too, even though the form has `required`.
- **Redirects.** `redirect(url_for("notes"))` answers with a 302 and a `Location` header, as in lesson 6.5. `url_for` builds the path from the name of a function, so the code never repeats paths. After a successful POST the app always redirects to a GET page. That way, a reload in the browser repeats the harmless GET, not the POST that saved the note.

### 4. Write the templates

```bash
mkdir -p app/templates app/static
```

```html title="app/templates/base.html"
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
```

```html title="app/templates/login.html"
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
```

```html title="app/templates/notes.html"
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
```

`base.html` is the frame that every page shares: the head, the style sheet and the header. It leaves two **blocks**, `title` and `content`, for other templates to fill. `{% extends "base.html" %}` at the top of the other two says "use that frame, and here is what goes in its blocks". The header shows the logout button only when the session has a username; `session` is available in every template. The logout is a small form with `method="post"`, because a change such as ending a session should never happen through a plain link.

In `notes.html`, `{% for note in notes %}` makes one card per note. The `{% else %}` part of a Jinja `for` is shown only when the list is empty. Each Delete button is its own little form, whose `action` is built by `url_for` with the note's id, such as `/notes/2/delete`. `<textarea>` is a text field with several lines.

### 5. Write the style sheet

```css title="app/static/style.css"
/* mylab: one style sheet for every page */

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  color: #1c1c1c;
  background: #faf9f6;
  max-width: 40rem;
  margin: 0 auto;
  padding: 0 1rem;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #c8c8c8;
  padding: 0.75rem 0;
}

.card {
  background: white;
  border: 1px solid #c8c8c8;
  border-radius: 6px;
  padding: 0.5rem 1rem 1rem;
  margin: 1rem 0;
}

label,
input,
textarea {
  display: block;
  width: 100%;
}

label {
  margin-top: 0.75rem;
}

button {
  margin-top: 0.75rem;
  padding: 0.4rem 1rem;
}

.error {
  color: #b00020;
  font-weight: bold;
}
```

It is the Byte Club style from lesson 8.2, with a few changes. `justify-content: space-between` pushes the two children of the header to the two ends of the row: the name on the left, the logout form on the right. Labels and fields are blocks of the full width, so each field sits under its label. Flask serves everything in `app/static` at the path `/static/`, which is where the `url_for('static', ...)` in `base.html` points.

### 6. Start the app

```bash
python3 app/app.py > logs/app.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':5000 ' && break; sleep 0.2; done
-->

```bash
ls data
```

```output
mylab.db  sample-access.log  secret_key
```

The app has made its secret key on the first start, next to the database and the sample log from Module 3. The server runs in the background, and its messages go to `logs/app.log`, which git already ignores. Now ask for the home page without being logged in:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://127.0.0.1:5000/
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://127.0.0.1:5000/notes
```

```output
302 http://127.0.0.1:5000/login
302 http://127.0.0.1:5000/login
```

`%{redirect_url}` prints where the redirect points. Both pages send a stranger to the login page.

### 7. Log in

```bash
curl -s -c /tmp/sam.txt -b /tmp/sam.txt -d "username=sam&password=wrong" http://127.0.0.1:5000/login | grep error
```

```output
    <p class="error" role="alert">Wrong username or password.</p>
```

The cookie jar lives in `/tmp`, so it stays out of the repository. The wrong password got the login page again, with the error filled into the frame.

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -c /tmp/sam.txt -b /tmp/sam.txt -d "username=sam&password=test-pass-1" http://127.0.0.1:5000/login
curl -s -b /tmp/sam.txt http://127.0.0.1:5000/notes | grep -E "<h2>|Logged in"
```

```output
302 http://127.0.0.1:5000/notes
        <span>Logged in as sam</span>
      <h2>Ports to remember</h2>
  <h2>New note</h2>
```

The right password got a redirect to `/notes` and a session cookie in the jar. With that cookie, `/notes` shows sam's note from the database. The template makes one `<h2>` per note; the last `<h2>` is the heading of the form for a new note.

### 8. Add notes, and try to break the page

```bash
curl -s -o /dev/null -w "%{http_code}\n" -b /tmp/sam.txt -d "title=Flask&body=Templates fill the gaps" http://127.0.0.1:5000/notes
curl -s -o /dev/null -w "%{http_code}\n" -b /tmp/sam.txt -d "title=&body=no title" http://127.0.0.1:5000/notes
```

```output
302
400
```

The first note was saved, and the app redirected back to the list. The second had an empty title, and the server refused it with 400, the check that `required` in the form cannot promise. Now send a title with HTML in it:

```bash
curl -s -o /dev/null -b /tmp/sam.txt --data-urlencode "title=<b>Bold?</b>" http://127.0.0.1:5000/notes
curl -s -b /tmp/sam.txt http://127.0.0.1:5000/notes | grep Bold
```

```output
      <h2>&lt;b&gt;Bold?&lt;/b&gt;</h2>
```

`--data-urlencode` encodes the `<`, `>` and `/` so that they travel safely in the form body. In the page, Jinja escaped them: the browser shows the title as the text `<b>Bold?</b>`, and no bold element is created. If a title like this could add a `<b>`, it could add a `<script>` just as well, and that is the cross-site scripting of Module 12.

### 9. Try to delete someone else's note

alex logs in with a jar of her own, and tries to delete note 2, which is sam's:

```bash
curl -s -o /dev/null -c /tmp/alex.txt -b /tmp/alex.txt -d "username=alex&password=test-pass-2" http://127.0.0.1:5000/login
curl -s -o /dev/null -w "%{http_code}\n" -b /tmp/alex.txt -X POST http://127.0.0.1:5000/notes/2/delete
curl -s -b /tmp/sam.txt http://127.0.0.1:5000/notes | grep -c "<article"
```

```output
404
3
```

`delete_note` deletes only when the note id and the user id from the session match, so alex got 404 and sam still has his three notes. The app does not even say whether note 2 exists. Now sam deletes the bold test note, which is his. It got the id 5: each Delete form in the page shows the id of its note, as in `/notes/5/delete`.

```bash
curl -s -o /dev/null -w "%{http_code}\n" -b /tmp/sam.txt -X POST http://127.0.0.1:5000/notes/5/delete
curl -s -b /tmp/sam.txt http://127.0.0.1:5000/notes | grep -c "<article"
```

```output
302
2
```

### 10. Use it in the browser

Open `http://127.0.0.1:5000/` and log in as `sam` with `test-pass-1`. Write a note, delete it, log out, and log in again. In the developer tools, the Network panel shows each form POST followed by a GET for the page it redirected to, and the cookie list shows one cookie called `session`, marked `HttpOnly`.

:::caution[Test passwords only]
`mylab` still stores passwords in plain text, and anyone who copies `data/mylab.db` can read them. Use only test passwords such as `test-pass-1` until Module 10 fixes it, and keep the app on `127.0.0.1`.
:::

### 11. Commit the app, not the secrets

```bash
pkill -f app/app.py
git status --short
```

```output
 M app/db.py
 M requirements.txt
?? app/app.py
?? app/static/
?? app/templates/
?? data/secret_key
```

`data/mylab.db` and `logs/app.log` are already ignored, but the new secret key is not. With that file, anyone could sign a session for any user, as you saw in lesson 8.6, so it must never reach GitHub:

```bash
echo "data/secret_key" >> .gitignore
git add .gitignore requirements.txt app/db.py app/app.py app/templates app/static
git status --short
```

```output
M  .gitignore
A  app/app.py
M  app/db.py
A  app/static/style.css
A  app/templates/base.html
A  app/templates/login.html
A  app/templates/notes.html
M  requirements.txt
```

No key, no database, no log, no venv: only code. Commit it:

```bash
git commit -q -m "Add the mylab web app with login and notes"
git log --oneline -1 --format=%s
deactivate
```

```output
Add the mylab web app with login and notes
```

## Exercise

Add a search to the notes page. A small form at the top, with a field called `q` and `method="get"`, sends the word to `/notes?q=...`. The page then shows only the user's notes whose title or text contains the word. Write the SQL in a new function `search_notes(user_id, word)` in `db.py`, with placeholders. Test that sam finds his ports note with the word `ports`, and that alex, searching for the same word, finds nothing.

Hint: `LIKE` from lesson 7.3, with `%` before and after the word. The `%` signs go into the value you pass to the placeholder, not into the SQL text.

<details>
<summary>Show the solution</summary>

In `app/db.py`, after `notes_for`:

```python
def search_notes(user_id, word):
    """Return the user's notes whose title or text contains the word."""
    pattern = f"%{word}%"
    con = connect()
    rows = con.execute(
        "SELECT id, title, body FROM notes"
        " WHERE user_id = ? AND (title LIKE ? OR body LIKE ?) ORDER BY id",
        (user_id, pattern, pattern),
    ).fetchall()
    con.close()
    return rows
```

The f-string builds only the value, `%ports%`. The SQL text itself is fixed, and every value still goes through a placeholder. Two strings next to each other are joined by Python into one, which keeps the line short.

In `app/app.py`, replace the `notes` function:

```python
@app.get("/notes")
def notes():
    if "user_id" not in session:
        return redirect(url_for("login"))
    word = request.args.get("q", "").strip()
    if word:
        found = db.search_notes(session["user_id"], word)
    else:
        found = db.notes_for(session["user_id"])
    return render_template("notes.html", notes=found, q=word)
```

In `app/templates/notes.html`, right after `<h1>Your notes</h1>`:

```html
  <form action="{{ url_for('notes') }}" method="get">
    <label for="q">Search your notes</label>
    <input id="q" name="q" value="{{ q }}">
    <button type="submit">Search</button>
  </form>
```

<!-- lab: run
cd ~/mylab
python3 - <<'EOF'
db_path = "app/db.py"
code = open(db_path).read()
func = '''def search_notes(user_id, word):
    """Return the user's notes whose title or text contains the word."""
    pattern = f"%{word}%"
    con = connect()
    rows = con.execute(
        "SELECT id, title, body FROM notes"
        " WHERE user_id = ? AND (title LIKE ? OR body LIKE ?) ORDER BY id",
        (user_id, pattern, pattern),
    ).fetchall()
    con.close()
    return rows


'''
code = code.replace("def delete_note(", func + "def delete_note(", 1)
open(db_path, "w").write(code)

app_path = "app/app.py"
code = open(app_path).read()
old = '''    return render_template("notes.html", notes=db.notes_for(session["user_id"]))
'''
new = '''    word = request.args.get("q", "").strip()
    if word:
        found = db.search_notes(session["user_id"], word)
    else:
        found = db.notes_for(session["user_id"])
    return render_template("notes.html", notes=found, q=word)
'''
assert old in code
code = code.replace(old, new, 1)
open(app_path, "w").write(code)

tpl_path = "app/templates/notes.html"
code = open(tpl_path).read()
form = '''  <h1>Your notes</h1>
  <form action="{{ url_for('notes') }}" method="get">
    <label for="q">Search your notes</label>
    <input id="q" name="q" value="{{ q }}">
    <button type="submit">Search</button>
  </form>
'''
code = code.replace("  <h1>Your notes</h1>\n", form, 1)
open(tpl_path, "w").write(code)
EOF
-->

Restart the app so that it loads the new code, and test:

```bash
source .venv/bin/activate
python3 app/app.py > logs/app.log 2>&1 &
```

<!-- lab: run
for i in $(seq 100); do ss -ltn | grep -q ':5000 ' && break; sleep 0.2; done
-->

```bash
curl -s -b /tmp/sam.txt "http://127.0.0.1:5000/notes?q=ports" | grep "<h2>"
curl -s -b /tmp/alex.txt "http://127.0.0.1:5000/notes?q=ports" | grep -c "<article"
```

```output
      <h2>Ports to remember</h2>
  <h2>New note</h2>
0
```

sam's search matched his note by its title. alex's search ran on her own notes only, because the `user_id` in the query comes from her session, so she found nothing. `LIKE` in SQLite ignores the difference between capital and small letters (for the letters A to Z), so `ports` also matched `Ports`. The old session cookies still work after the restart, because the key in `data/secret_key` stayed the same.

```bash
pkill -f app/app.py
git commit -q -am "Search your own notes"
git log --oneline -2 --format=%s
deactivate
```

```output
Search your own notes
Add the mylab web app with login and notes
```

</details>

## Check yourself

**1. Why does the app keep the secret key in `data/secret_key` instead of making a new random key at every start, as `remember.py` did in lesson 8.6?**

<details>
<summary>Answer</summary>

A new key at every start would make every session cookie invalid after a restart, so every user would be logged out. A key kept in a file stays the same. The file is ignored by git, so the key never reaches GitHub.

</details>

**2. The delete route takes the note id from the URL. Why can alex not delete sam's note by sending `/notes/2/delete`?**

<details>
<summary>Answer</summary>

The user id does not come from the request but from the signed session, and `delete_note` only deletes a row when both the note id and the user id match. For alex, note 2 matches no row, so the app answers 404.

</details>

**3. A user saves a note with the title `<script>alert(1)</script>`. What does the notes page show, and why?**

<details>
<summary>Answer</summary>

It shows the title as plain text, with the tags visible. Jinja escapes every value it puts into a template, so `<` and `>` become `&lt;` and `&gt;`, and the browser never sees a real `<script>` element.

</details>

**4. Why does the app answer a successful `POST /notes` with a redirect instead of the notes page itself?**

<details>
<summary>Answer</summary>

After a redirect, the browser shows the page from a GET request. A reload then repeats the GET, which changes nothing. Without the redirect, a reload would send the POST again and save the note a second time.

</details>

**5. Which new file did `git status` show that must not be committed, and what did you do about it?**

<details>
<summary>Answer</summary>

`data/secret_key`. Anyone with it can forge a session for any user. It was added to `.gitignore` before the `git add`.

</details>

## Common mistakes

- **`TemplateNotFound: login.html`.** Flask looks for templates in a folder called exactly `templates` next to `app.py`. Check the name and the place: `app/templates/login.html`.
- **`ModuleNotFoundError: No module named 'flask'`.** The venv is not active. Run `source .venv/bin/activate` in the `mylab` folder first.
- **Old code still running.** The app loads its code when it starts. After every change, stop it with `pkill -f app/app.py` and start it again.
- **Taking the user id from the form.** A hidden field `user_id` in a form can be changed by anyone with curl. Take it from the session, as the app does.
- **Turning off escaping.** Jinja has a filter `|safe` that skips the escaping. Never use it on text that a user wrote.

## Key terms

- **Template (HTML)**: an HTML file with gaps that the server fills with values for each request.
- **Jinja**: the template language that Flask uses, with `{{ ... }}` for values and `{% ... %}` for logic.
- **Template block**: a named part of a base template, written `{% block name %}`, that other templates fill in.
- **Escaping**: replacing characters that have a meaning in HTML, such as `<`, with codes that only display them, such as `&lt;`.

## Go further

- [Flask: Templates](https://flask.palletsprojects.com/en/stable/templating/): how Flask uses Jinja, including the automatic escaping.
- [Jinja: Template Designer Documentation](https://jinja.palletsprojects.com/en/stable/templates/): blocks, `extends`, loops and filters in detail.
- [OWASP: Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html): how real applications handle logins, and the next steps for `mylab`.
