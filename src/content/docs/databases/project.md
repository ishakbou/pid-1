---
title: "Project step: a database for mylab"
description: Give mylab a SQLite database for users and notes, with a schema file, a small Python module that every later part of the app can use, and a database file that git ignores.
lesson: "7.8"
time: 25 min
sidebar:
  order: 8
---

Next module, `mylab` becomes a notes app with a login. Before the first web page can show a note, the notes need a place to live, and so do the users who write them. In this step you build that place: a schema in a file, a Python module that hides the SQL behind a few plain functions, and a database that grows inside `mylab/data/`.

## Goal

After this lesson you can:

- Write the schema of a small app as a SQL file, with keys, defaults and an index.
- Build a Python module that creates the database and reads and writes it with placeholders.
- Keep the database file out of git, and commit the code that builds it.

## Why it matters

Real apps keep their SQL in one place. When the web pages, the tests and the admin scripts all call the same `add_note()` function, there is only one query to get right, one place to use placeholders, and one place to fix when something changes. Module 12 comes back to this code to check it for injection flaws, so writing it carefully now saves you work later.

## The idea

Three new files join `mylab`:

```text
mylab/
    app/
        server.py      from Module 6
        schema.sql     new: the tables, as SQL
        db.py          new: Python functions for the database
    data/
        mylab.db       new: the database itself, ignored by git
    .gitignore         one new line
```

The schema has two tables, linked as in lesson 7.1: one user has many notes.

| Table | Columns | Rules |
|---|---|---|
| `users` | `id`, `username`, `password`, `created_at` | `username` is `UNIQUE` |
| `notes` | `id`, `user_id`, `title`, `body`, `created_at` | `user_id` points to `users`; a user's notes go when the user goes |

`schema.sql` is the source of truth: it is code, it is short, and git keeps its history. `mylab.db` is built from it and holds the data. That split is the same as between a recipe and the meal: you keep the recipe in the cookbook, and you can always cook the meal again, but you do not put the meal in the cookbook.

`db.py` is a **module** in the Module 3 sense: a file of functions that other Python files import. It also has a small command line, so you can use it from the terminal before the web app exists.

## Try it

<!-- lab: run
sudo apt-get install -y -q sqlite3 > /dev/null 2>&1
printf '.headers on\n.mode table\n' > ~/.sqliterc
pkill -f app/server.py
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs ~/mylab/tools ~/mylab/app
cd ~/mylab
printf '# mylab\n\nMy lab for the PID 1 course.\n' > README.md
printf '.venv/\n__pycache__/\nlogs/*.log\n' > .gitignore
cat > data/sample-access.log <<'EOF'
203.0.113.5 - - [21/Nov/2026:09:58:01 +0000] "GET / HTTP/1.1" 200 1043
203.0.113.5 - - [21/Nov/2026:09:58:02 +0000] "GET /style.css HTTP/1.1" 200 312
198.51.100.23 - - [21/Nov/2026:09:59:10 +0000] "GET /login HTTP/1.1" 200 877
EOF
cat > app/server.py <<'EOF'
"""A tiny web server for mylab, made only from the Python standard library.

Run it from the mylab folder:  python3 app/server.py [port]
"""
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

HOST = "127.0.0.1"  # loopback only: no other machine can connect
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

PAGE = """<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>mylab</title></head>
<body>
<h1>mylab</h1>
<p>This page was served by app/server.py.</p>
</body>
</html>
"""


class Handler(BaseHTTPRequestHandler):
    def route(self):
        """Return the status code, content type and text for the requested path."""
        if self.path == "/":
            return 200, "text/html; charset=utf-8", PAGE
        if self.path == "/health":
            return 200, "text/plain; charset=utf-8", "ok\n"
        return 404, "text/plain; charset=utf-8", "not found\n"

    def do_GET(self):
        status, content_type, text = self.route()
        body = text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_HEAD(self):
        status, content_type, text = self.route()
        body = text.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()

    def log_message(self, format, *args):
        """Print one line per request: when, who, what, and the answer."""
        host, port = self.client_address
        headers = getattr(self, "headers", None)
        agent = headers.get("User-Agent", "-") if headers else "-"
        print(f"{self.log_date_time_string()} {host}:{port} {format % args} {agent}", flush=True)


def main():
    server = HTTPServer((HOST, PORT), Handler)
    print(f"mylab server on http://{HOST}:{PORT}/  (press Ctrl+C to stop)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("stopped")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
EOF
git init -q
git add README.md .gitignore app/server.py data/sample-access.log
git commit -q -m "Start mylab"
cd ~
-->

This step continues the `mylab` repository from the earlier modules, with `app/server.py` from the [Module 6 project step](../networking/project/). The outputs show only the commits that matter here; your history has more.

### 1. Write the schema

```bash
cd ~/mylab
mkdir -p data
```

Git does not keep empty folders, so `data/` may be missing in your copy; `-p` creates it only if needed. Now create `app/schema.sql`:

```sql title="app/schema.sql"
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
```

Most of it you know from this module. The new parts:

- `--` starts a **comment** in SQL: the rest of the line is ignored, like `#` in Python.
- `IF NOT EXISTS` makes each statement do nothing when the table or index is already there. You can run the file again without the `already exists` error from lesson 7.1.
- `DEFAULT` gives a column a **default value**, used when an `INSERT` leaves the column out. `datetime('now')` is SQLite's current date and time in UTC, written year first, so it sorts correctly.
- `ON DELETE CASCADE` changes what the foreign key does when a user is deleted, with a **cascade**. In lesson 7.2 the database refused to delete a player with solves. Here, it deletes the user's notes along with the user.
- The index is there because the app's most common question will be "the notes of this user", which is a search on `user_id` (lesson 7.5).

:::caution[Plain-text passwords, for now only]
The `password` column stores passwords exactly as typed, so anyone who gets a copy of `mylab.db` can read them all. This is a known flaw that you keep on purpose for a short while, because storing passwords properly needs the hashing from Module 10, where you fix it. Until then, never use a real password in `mylab`.
:::

### 2. Write the module

Create `app/db.py`:

```python title="app/db.py"
"""The mylab database: create it, and add and read users and notes.

Run it from the mylab folder:
    python3 app/db.py init
    python3 app/db.py add-user USERNAME PASSWORD
    python3 app/db.py add-note USERNAME TITLE [BODY]
    python3 app/db.py notes USERNAME
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
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
```

Read it in three parts:

- **The paths.** `Path(__file__)` is the path of `db.py` itself. `.resolve().parent.parent` climbs from `app/db.py` to the `mylab` folder. So `DB_PATH` always points to `mylab/data/mylab.db`, from whatever folder you start the script. That avoids the "wrong folder, new empty database" mistake from lesson 7.7.
- **The functions.** Each one opens a connection with `connect()`, does one job with placeholders, and closes it. Changes run inside `with con:`, so they are committed. `cur.lastrowid` is the id SQLite gave the new row. `executescript` runs a whole file of SQL statements at once, which `execute` cannot do.
- **The command line.** `main` reads the words after the script name and calls the right function. It returns a number that `sys.exit` hands to the shell as the exit status: `0` for success, something else for a problem, as in Module 1.

The web app in Module 8 will import these same functions, so it never has to write SQL of its own for these jobs.

### 3. Create the database

```bash
python3 app/db.py init
sqlite3 data/mylab.db ".tables"
```

```output
database ready: data/mylab.db
notes  users
```

```bash
sqlite3 data/mylab.db ".indexes"
```

```output
idx_notes_user_id         sqlite_autoindex_users_1
```

Your index is there, and so is one you did not write: SQLite made `sqlite_autoindex_users_1` for the `UNIQUE` rule on `username`, as lesson 7.5 said it would.

### 4. Add users and notes

```bash
python3 app/db.py add-user sam test-pass-1
python3 app/db.py add-user alex test-pass-2
python3 app/db.py add-user sam other-pass
```

```output
user 'sam' has id 1
user 'alex' has id 2
the username 'sam' is taken
```

The third command broke the `UNIQUE` rule, and `main` turned the `IntegrityError` into a clear sentence.

```bash
python3 app/db.py add-note sam "Lab ideas" "Try the database from Module 7"
python3 app/db.py add-note sam "Ports to remember" "22 ssh, 80 http, 443 https"
python3 app/db.py add-note alex "Hello"
python3 app/db.py add-note nobody "Lost note"
```

```output
note 1 saved for 'sam'
note 2 saved for 'sam'
note 3 saved for 'alex'
no user 'nobody'
```

The quotes keep a title with spaces together as one argument, as in Module 1. Alex's note has no body, so the default `''` from the schema was used.

### 5. Read the notes

```bash
python3 app/db.py notes sam
```

```output
1. Lab ideas
   Try the database from Module 7
2. Ports to remember
   22 ssh, 80 http, 443 https
```

Run it from somewhere else too, to see that the paths hold:

```bash
cd ~
python3 mylab/app/db.py notes alex
cd ~/mylab
```

```output
3. Hello
```

### 6. Look at the data with sqlite3

```bash
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

Every password in clear text, as the caution box warned. This is exactly what an attacker sees after stealing a database file. You will remember this table when you reach Module 10.

```bash
sqlite3 data/mylab.db "SELECT n.id, u.username, n.title FROM notes n JOIN users u ON u.id = n.user_id;"
```

```output
+----+----------+-------------------+
| id | username |       title       |
+----+----------+-------------------+
| 1  | sam      | Lab ideas         |
| 2  | sam      | Ports to remember |
| 3  | alex     | Hello             |
+----+----------+-------------------+
```

The `created_at` columns filled themselves, but they are left out here because they show the time you ran the commands.

### 7. Test the cascade

Make a user just to delete her:

```bash
python3 app/db.py add-user temp test-pass-3
python3 app/db.py add-note temp "Delete me"
sqlite3 data/mylab.db "PRAGMA foreign_keys = ON; DELETE FROM users WHERE username = 'temp'; SELECT count(*) AS notes_left FROM notes;"
```

```output
user 'temp' has id 3
note 4 saved for 'temp'
+------------+
| notes_left |
+------------+
| 3          |
+------------+
```

The user and her note are gone, in one statement. Three notes are left, those of sam and alex. Like every foreign key action in SQLite, the cascade only works with `PRAGMA foreign_keys = ON`, which `connect()` always sets.

### 8. Run init again

```bash
python3 app/db.py init
python3 app/db.py notes sam
```

```output
database ready: data/mylab.db
1. Lab ideas
   Try the database from Module 7
2. Ports to remember
   22 ssh, 80 http, 443 https
```

Because of `IF NOT EXISTS`, a second `init` changes nothing and loses nothing. That makes it safe to run whenever the app starts.

### 9. Commit the code, not the data

```bash
git status --short
```

```output
?? app/db.py
?? app/schema.sql
?? data/mylab.db
```

Git lists `data/mylab.db` because it is a new file that git does not track yet. (If your `data/` folder held nothing else, git shows the whole folder as `?? data/` instead.) The database should not be added: `mylab.db` holds user data and passwords, it changes every time someone writes a note, and anyone can rebuild an empty one from `schema.sql`. Tell git to ignore it:

```bash
echo "data/*.db" >> .gitignore
git status --short
```

```output
 M .gitignore
?? app/db.py
?? app/schema.sql
```

The pattern `data/*.db` ignores only database files, so other files in `data/`, like the sample log from Module 3, are still tracked.

```bash
git add .gitignore app/schema.sql app/db.py
git commit -q -m "Add the mylab database"
git log --oneline -1 --format=%s
```

```output
Add the mylab database
```

## Exercise

Add a command `delete-note USERNAME NOTE_ID` to `db.py`. It must delete the note only if it belongs to that user, and print either `note N deleted` or `no note N for 'USERNAME'`. Write the SQL in a new function `delete_note(user_id, note_id)` that returns `True` when a row was deleted. Test that sam can delete his note 1 but not alex's note 3, then commit.

Hint: put both conditions in one `WHERE`, and look at `cur.rowcount`, the number of rows the statement changed.

<details>
<summary>Show the solution</summary>

Add this function after `notes_for`:

```python
def delete_note(user_id, note_id):
    """Delete a note if it belongs to the user. Return True if a note was deleted."""
    con = connect()
    with con:
        cur = con.execute(
            "DELETE FROM notes WHERE id = ? AND user_id = ?", (note_id, user_id)
        )
    con.close()
    return cur.rowcount == 1
```

And this branch in `main`, right before the final `else:`:

```python
    elif len(args) == 3 and args[0] == "delete-note":
        user = find_user(args[1])
        note_id = int(args[2])
        if user is not None and delete_note(user["id"], note_id):
            print(f"note {note_id} deleted")
        else:
            print(f"no note {note_id} for {args[1]!r}")
            return 1
```

Also add the new command to the usage text at the top of the file, so that the help that `main` prints stays true:

```text
    python3 app/db.py delete-note USERNAME NOTE_ID
```

<!-- lab: run
cd ~/mylab
python3 - <<'EOF'
path = "app/db.py"
code = open(path).read()
func = '''def delete_note(user_id, note_id):
    """Delete a note if it belongs to the user. Return True if a note was deleted."""
    con = connect()
    with con:
        cur = con.execute(
            "DELETE FROM notes WHERE id = ? AND user_id = ?", (note_id, user_id)
        )
    con.close()
    return cur.rowcount == 1


'''
branch = '''    elif len(args) == 3 and args[0] == "delete-note":
        user = find_user(args[1])
        note_id = int(args[2])
        if user is not None and delete_note(user["id"], note_id):
            print(f"note {note_id} deleted")
        else:
            print(f"no note {note_id} for {args[1]!r}")
            return 1
'''
code = code.replace("    python3 app/db.py notes USERNAME\n", "    python3 app/db.py notes USERNAME\n    python3 app/db.py delete-note USERNAME NOTE_ID\n", 1)
code = code.replace("def main(args):", func + "def main(args):", 1)
code = code.replace("    else:\n        print(__doc__)", branch + "    else:\n        print(__doc__)", 1)
open(path, "w").write(code)
EOF
-->

```bash
python3 app/db.py delete-note sam 3
python3 app/db.py delete-note sam 1
python3 app/db.py notes sam
```

```output
no note 3 for 'sam'
note 1 deleted
2. Ports to remember
   22 ssh, 80 http, 443 https
```

Note 3 exists, but it is alex's, so `AND user_id = ?` matched no row and nothing was deleted. Checking who owns a row before changing it is called access control, and forgetting it is one of the most common web flaws. Module 12 tests your app for it.

```bash
git commit -q -am "Delete notes, only your own"
git log --oneline -2 --format=%s
```

```output
Delete notes, only your own
Add the mylab database
```


</details>

## Check yourself

**1. Why is `schema.sql` committed but `mylab.db` ignored?**

<details>
<summary>Answer</summary>

`schema.sql` is code: short, readable, and it can rebuild an empty database at any time. `mylab.db` is data: it changes all the time, it holds users' notes and passwords, and it does not belong in a public repository.

</details>

**2. What does `ON DELETE CASCADE` do in the `notes` table?**

<details>
<summary>Answer</summary>

When a user is deleted, the database also deletes every note whose `user_id` points to that user. Without it, deleting a user who has notes would be refused.

</details>

**3. Why does `db.py` build `DB_PATH` from `__file__` instead of using `"data/mylab.db"`?**

<details>
<summary>Answer</summary>

A relative path is read from the current directory, so running the script from another folder would open or create a different, empty database. `__file__` always points to `db.py` itself, so the path is the same from anywhere.

</details>

**4. What is wrong with the `password` column, and when is it fixed?**

<details>
<summary>Answer</summary>

It stores passwords in plain text, so anyone with a copy of the database can read them. Module 10 replaces them with salted, slow hashes.

</details>

**5. Why can `python3 app/db.py init` run safely a second time?**

<details>
<summary>Answer</summary>

Every statement in `schema.sql` has `IF NOT EXISTS`, so tables and the index that are already there are left alone, with their data.

</details>

## Common mistakes

- **Committing the database.** Once a database with passwords is pushed to GitHub, deleting it later does not remove it from the history. Add `data/*.db` to `.gitignore` before the first `git add`.
- **Editing `schema.sql` and expecting the tables to change.** `IF NOT EXISTS` skips tables that exist. During development, delete `data/mylab.db` and run `init` again; with real data, write a migration as in lesson 7.6.
- **Opening a connection and never closing it.** Each function here closes its own. If you write new ones, follow the same pattern.
- **Writing SQL with f-strings in a new function.** Every value goes in a placeholder, even ids that "come from our own code".
- **Deleting by id alone.** `DELETE FROM notes WHERE id = ?` lets anyone delete anyone's note. Always include the owner in the condition.

## Key terms

- **Comment (SQL)**: text after `--` on a line, ignored by the database.
- **Default value**: the value a column gets when an `INSERT` does not give one, set with `DEFAULT`.
- **Cascade**: a foreign key action, `ON DELETE CASCADE`, that deletes the rows pointing to a row when that row is deleted.

## Go further

- [SQLite: foreign key actions](https://www.sqlite.org/foreignkeys.html#fk_actions): `ON DELETE CASCADE` and the other actions a foreign key can take.
- [Python documentation: sqlite3, how-to guides](https://docs.python.org/3/library/sqlite3.html#sqlite3-howtos): placeholders, connection handling and transactions, explained by the Python team.
- [OWASP: Top 10](https://owasp.org/Top10/): the list of the most common web application risks, including injection and broken access control, which this code is written to avoid.
