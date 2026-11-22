---
title: Using a database from Python
description: Query and change a SQLite database from Python with the sqlite3 module, pass values safely with placeholders, and see why building SQL from strings is dangerous.
lesson: "7.7"
time: 25 min
sidebar:
  order: 7
---

So far you have typed every query yourself. That is fine for questions you ask once, but a scoreboard page, a login form or a log analyzer asks the same questions thousands of times, with different values each time. Those questions come from programs, and in this lesson the program is yours: Python talks to SQLite directly, with a module that is already installed.

## Goal

After this lesson you can:

- Open a SQLite database from Python, run a query and use the rows it returns.
- Pass values into a query safely with `?` placeholders, and explain why building SQL with f-strings is dangerous.
- Save changes with a transaction, and handle the errors the database raises.

## Why it matters

Almost every app sends SQL from code, and one mistake in how it does that has been among the most damaging web vulnerabilities for more than twenty years: **SQL injection**. It happens when text typed by a user ends up inside the SQL itself, so the user can change what the query does. The fix is simple and you will use it from your first line: never paste values into SQL, pass them separately.

## The idea

Python's standard library includes the module `sqlite3`. Three things do the work:

| Thing | What it is | How you get it |
|---|---|---|
| Connection | an open line to one database file | `con = sqlite3.connect("season.db")` |
| Cursor | the result of a statement: it hands out the rows, one tuple per row | `con.execute("SELECT ...")` |
| Transaction | changes not yet saved | started for you by `INSERT`, `UPDATE`, `DELETE`; saved by `con.commit()` |

The important rule is about values. When a query needs a value from outside, such as a name a user typed, you write a `?` in the SQL where the value goes, called a **placeholder**, and pass the value separately. A query that uses placeholders for all its values is a **parameterized query**:

```python
con.execute("SELECT * FROM players WHERE name = ?", (name,))
```

The database receives two separate things: the SQL with a hole in it, and a value to put in the hole. Whatever the value contains, quotes or SQL keywords included, it is only ever treated as a value. It is like a paper form with boxes: whatever someone writes inside the box for "name", it stays a name, and it can never add a new line to the form's instructions.

## Try it

This lesson uses `~/season/season.db` from lesson 7.3, in its original form. Rebuild it now so your data matches the outputs:

<!-- lab: run
sudo apt-get install -y -q sqlite3 > /dev/null 2>&1
printf '.headers on\n.mode table\n' > ~/.sqliterc
mkdir -p ~/season
cat > ~/season/season.sql <<'EOF'
CREATE TABLE players (
    id      INTEGER PRIMARY KEY,
    name    TEXT NOT NULL,
    country TEXT
);

CREATE TABLE solves (
    id        INTEGER PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id),
    challenge TEXT NOT NULL,
    category  TEXT NOT NULL,
    points    INTEGER NOT NULL,
    solved_at TEXT NOT NULL
);

INSERT INTO players (id, name, country) VALUES
    (1, 'Amira', 'DZ'), (2, 'Ben', 'FR'), (3, 'Chen', 'CN'), (4, 'Dana', 'US'),
    (5, 'Emil', 'SE'), (6, 'Farah', 'DZ'), (7, 'Goran', NULL), (8, 'Hana', 'JP');

INSERT INTO solves (player_id, challenge, category, points, solved_at) VALUES
    (1, 'Warmup',       'misc',    50,  '2026-11-02 09:12'),
    (1, 'Hidden file',  'linux',   100, '2026-11-02 09:40'),
    (1, 'Cookie jar',   'web',     200, '2026-11-03 20:15'),
    (1, 'Login bypass', 'web',     300, '2026-11-05 22:47'),
    (1, 'Root me',      'linux',   400, '2026-11-08 23:59'),
    (2, 'Warmup',       'misc',    50,  '2026-11-02 10:30'),
    (2, 'Base64 soup',  'crypto',  100, '2026-11-04 18:30'),
    (3, 'Warmup',       'misc',    50,  '2026-11-02 10:05'),
    (3, 'Hidden file',  'linux',   100, '2026-11-02 11:20'),
    (3, 'Lost packet',  'network', 150, '2026-11-04 09:00'),
    (3, 'Root me',      'linux',   400, '2026-11-07 16:45'),
    (4, 'Warmup',       'misc',    50,  '2026-11-03 14:20'),
    (4, 'Cookie jar',   'web',     200, '2026-11-06 12:10'),
    (6, 'Warmup',       'misc',    50,  '2026-11-02 13:00'),
    (6, 'Hidden file',  'linux',   100, '2026-11-03 08:55'),
    (6, 'Base64 soup',  'crypto',  100, '2026-11-03 09:30'),
    (6, 'Caesar salad', 'crypto',  150, '2026-11-06 19:05'),
    (7, 'Warmup',       'misc',    50,  '2026-11-05 17:40'),
    (8, 'Warmup',       'misc',    50,  '2026-11-02 09:05'),
    (8, 'Lost packet',  'network', 150, '2026-11-05 10:10'),
    (8, 'Caesar salad', 'crypto',  150, '2026-11-09 21:30');
EOF
-->

```bash
cd ~/season
rm -f season.db
sqlite3 season.db < season.sql
```

All the Python files of this lesson go in `~/season`, next to the database.

### 1. Your first query from Python

Create `first.py`:

```python title="first.py"
import sqlite3

con = sqlite3.connect("season.db")
rows = con.execute("SELECT id, name FROM players WHERE id <= 3").fetchall()
print(rows)
print(rows[0][1])
con.close()
```

```bash
python3 first.py
```

```output
[(1, 'Amira'), (2, 'Ben'), (3, 'Chen')]
Amira
```

`sqlite3.connect` opens the file and gives you a **connection**. `con.execute` sends one SQL statement and returns a **cursor**, an object that hands out the rows of the result. `fetchall()` collects every row of the result into a list. Each row is a tuple, with the columns in the order of the `SELECT`, so `rows[0][1]` is the second column of the first row. In Python, the semicolon at the end of the SQL is optional. `con.close()` ends the connection.

### 2. Loop over the rows

You do not always need the whole list at once. The cursor can be used directly in a `for` loop, one row at a time. Create `scoreboard.py`:

```python title="scoreboard.py"
"""Print the scoreboard of the season."""
import sqlite3

QUERY = """
    SELECT p.name, count(s.id) AS solved, coalesce(sum(s.points), 0) AS total
    FROM players p LEFT JOIN solves s ON s.player_id = p.id
    GROUP BY p.id
    ORDER BY total DESC
"""

con = sqlite3.connect("season.db")
con.row_factory = sqlite3.Row
for rank, row in enumerate(con.execute(QUERY), start=1):
    print(f"{rank}. {row['name']:<6} {row['total']:>5} points, {row['solved']} solved")
con.close()
```

```bash
python3 scoreboard.py
```

```output
1. Amira   1050 points, 5 solved
2. Chen     700 points, 4 solved
3. Farah    400 points, 4 solved
4. Hana     350 points, 3 solved
5. Dana     250 points, 2 solved
6. Ben      150 points, 2 solved
7. Goran     50 points, 1 solved
8. Emil       0 points, 0 solved
```

The query is the complete scoreboard from lesson 7.4, kept in a triple-quoted string so that it can spread over several lines. `con.row_factory = sqlite3.Row` changes what each row is: instead of a plain tuple, you get an object that also works with column names, so `row['total']` replaces `row[2]`. It makes the code much easier to read and to change. `enumerate(..., start=1)` gives each row a number, starting at 1. Inside the f-string, `:<6` after a value pads it with spaces to 6 characters, lined up on the left, and `:>5` pads to 5 characters, lined up on the right, so the columns stay straight.

### 3. Pass a value with a placeholder

Create `player.py`, which shows the solves of the player named on the command line:

```python title="player.py"
"""Show the solves of one player: python3 player.py NAME"""
import sqlite3
import sys

name = sys.argv[1]
con = sqlite3.connect("season.db")
rows = con.execute(
    "SELECT s.challenge, s.points FROM solves s JOIN players p ON p.id = s.player_id "
    "WHERE p.name = ? ORDER BY s.solved_at",
    (name,),
).fetchall()
con.close()

for challenge, points in rows:
    print(f"{challenge:<14}{points:>4}")
print(f"{len(rows)} solves for {name!r}")
```

```bash
python3 player.py Chen
```

```output
Warmup          50
Hidden file    100
Lost packet    150
Root me        400
4 solves for 'Chen'
```

The `?` marks where the value goes, and the second argument of `execute` gives the values, as a tuple: one value per `?`, in order. The comma in `(name,)` matters, because `(name)` without it is just `name` in brackets, not a tuple. Two strings written next to each other, as in the SQL here, are joined by Python into one string, which keeps long queries readable. `{name!r}` prints the name with quotes, so you can see exactly what was searched for.

### 4. See what an f-string does instead

Here is the same program written the tempting, wrong way. Create `unsafe.py`:

```python title="unsafe.py"
"""The same as player.py, but it builds the SQL with an f-string. Do not copy this."""
import sqlite3
import sys

name = sys.argv[1]
sql = (
    "SELECT s.challenge, s.points FROM solves s JOIN players p ON p.id = s.player_id "
    f"WHERE p.name = '{name}' ORDER BY s.solved_at"
)
print("SQL:", sql)
con = sqlite3.connect("season.db")
rows = con.execute(sql).fetchall()
con.close()

for challenge, points in rows:
    print(f"{challenge:<14}{points:>4}")
print(f"{len(rows)} solves for {name!r}")
```

With a normal name, it works:

```bash
python3 unsafe.py Ben
```

```output
SQL: SELECT s.challenge, s.points FROM solves s JOIN players p ON p.id = s.player_id WHERE p.name = 'Ben' ORDER BY s.solved_at
Warmup          50
Base64 soup    100
2 solves for 'Ben'
```

Now give it a name that contains a quote, as some real names do:

```bash
python3 unsafe.py "O'Brien" 2>&1 | tail -n 1
```

```output
sqlite3.OperationalError: near "Brien": syntax error
```

The quote in the name ended the SQL text early, and what came after it, `Brien'`, was read as broken SQL. `2>&1 | tail -n 1` keeps only the last line of the long error message, as in lesson 6.9. An innocent user just crashed the program. Now a user who is not innocent:

```bash
python3 unsafe.py "x' OR '1'='1" | head -n 3
python3 unsafe.py "x' OR '1'='1" | tail -n 1
```

```output
SQL: SELECT s.challenge, s.points FROM solves s JOIN players p ON p.id = s.player_id WHERE p.name = 'x' OR '1'='1' ORDER BY s.solved_at
Warmup          50
Warmup          50
21 solves for "x' OR '1'='1"
```

Look at the SQL line. The input closed the quote and added `OR '1'='1'`, a condition that is true for every row, so the query returned all 21 solves of every player. That is **SQL injection**: the user's text became part of the query's logic. Here it only reveals a scoreboard; in a real app the same trick can skip a password check or dump the users table. Module 12 studies it properly.

The safe version is not fooled:

```bash
python3 player.py "x' OR '1'='1"
python3 player.py "O'Brien"
```

```output
0 solves for "x' OR '1'='1"
0 solves for "O'Brien"
```

Both inputs were searched for as names, and no player has those names. Nothing crashed and nothing leaked.

:::caution[Never build SQL from strings]
Do not put values into SQL with f-strings, `+`, `%` or `.format()`, not even values you think are safe, such as numbers from your own code. Use `?` placeholders every time. Then the question "could this value be dangerous?" never comes up.
:::

### 5. Change data and commit

Reading needs no saving. Changing does. Create `add_solve.py`:

```python title="add_solve.py"
"""Record a solve: python3 add_solve.py PLAYER_ID CHALLENGE CATEGORY POINTS"""
import sqlite3
import sys
from datetime import datetime

player_id, challenge, category = int(sys.argv[1]), sys.argv[2], sys.argv[3]
points = int(sys.argv[4])
when = datetime.now().strftime("%Y-%m-%d %H:%M")

con = sqlite3.connect("season.db")
con.execute("PRAGMA foreign_keys = ON")
try:
    with con:
        con.execute(
            "INSERT INTO solves (player_id, challenge, category, points, solved_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (player_id, challenge, category, points, when),
        )
    print("saved")
except sqlite3.IntegrityError as err:
    print("refused:", err)
finally:
    con.close()
```

```bash
python3 add_solve.py 5 Warmup misc 50
sqlite3 season.db "SELECT player_id, challenge, points FROM solves WHERE player_id = 5;"
```

```output
saved
+-----------+-----------+--------+
| player_id | challenge | points |
+-----------+-----------+--------+
| 5         | Warmup    | 50     |
+-----------+-----------+--------+
```

Emil finally solved something, and the `sqlite3` tool, a completely different program, sees the new row. That is because of `with con:`. When the `INSERT` runs, Python's `sqlite3` module quietly starts a transaction. The `with con:` block **commits** it when the block ends normally, which saves the change to the file, and rolls it back if an exception happens inside the block. Without a commit, the change is thrown away when the connection closes.

The `PRAGMA` from lesson 7.1 is needed here too: every new connection starts with foreign key checks off. Now try a player that does not exist:

```bash
python3 add_solve.py 99 Warmup misc 50
```

```output
refused: FOREIGN KEY constraint failed
```

The database refused the row, and Python turned the refusal into an exception, `sqlite3.IntegrityError`. The `try` and `except` from Module 3 catch it and print a clear message instead of a traceback.

### 6. Forget to commit, on purpose

Create `forgot.py`:

```python title="forgot.py"
import sqlite3

con = sqlite3.connect("season.db")
con.execute("UPDATE players SET country = 'NO' WHERE name = 'Emil'")
print(con.execute("SELECT country FROM players WHERE name = 'Emil'").fetchone())
con.close()
```

```bash
python3 forgot.py
sqlite3 season.db "SELECT name, country FROM players WHERE name = 'Emil';"
```

```output
('NO',)
+------+---------+
| name | country |
+------+---------+
| Emil | SE      |
+------+---------+
```

Inside its own connection the script saw the new value `NO`. But it closed the connection without a commit, so the change was rolled back, and the database still says `SE`. `fetchone()` returns only the next row, as a tuple, which is handy when you expect exactly one. When "my program saves nothing" happens to you, look for the missing commit first.

## Exercise

Write `top.py` in `~/season`. It takes a category and a number on the command line, and prints that many of the most valuable solves in that category, with the player's name, highest points first. Both values must reach the SQL through placeholders: `LIMIT ?` works too. Test it with `python3 top.py web 2` and `python3 top.py linux 3`.

<details>
<summary>Show the solution</summary>

```python title="top.py"
"""Show the most valuable solves of one category: python3 top.py CATEGORY COUNT"""
import sqlite3
import sys

category, count = sys.argv[1], int(sys.argv[2])
con = sqlite3.connect("season.db")
rows = con.execute(
    "SELECT p.name, s.challenge, s.points FROM solves s JOIN players p ON p.id = s.player_id "
    "WHERE s.category = ? ORDER BY s.points DESC, s.solved_at LIMIT ?",
    (category, count),
).fetchall()
con.close()

for name, challenge, points in rows:
    print(f"{points:>4}  {name:<6} {challenge}")
```

```bash
python3 top.py web 2
python3 top.py linux 3
```

```output
 300  Amira  Login bypass
 200  Amira  Cookie jar
 400  Chen   Root me
 400  Amira  Root me
 100  Amira  Hidden file
```

`int(sys.argv[2])` turns the text `"2"` into a number before it reaches the database. The second sort column, `s.solved_at`, decides between solves with the same points: whoever was first comes first.

</details>

## Check yourself

**1. What does `con.execute(...).fetchall()` return?**

<details>
<summary>Answer</summary>

A list with one tuple per row of the result. Each tuple holds the columns in the order of the `SELECT`.

</details>

**2. Why is `con.execute(f"... WHERE name = '{name}'")` dangerous?**

<details>
<summary>Answer</summary>

The value becomes part of the SQL text. A name with a quote breaks the query, and a crafted name such as `x' OR '1'='1` changes what the query does. That is SQL injection.

</details>

**3. What is wrong with `con.execute("... WHERE name = ?", (name))`?**

<details>
<summary>Answer</summary>

`(name)` is not a tuple, it is just `name` in brackets. Python then treats the string as a sequence of single characters, one value per character. For `Chen` that is four values for one `?`, and you get an error about the number of values. Write `(name,)` with a comma.

</details>

**4. A script runs an `UPDATE` without errors, but the change is not in the database afterwards. What is the most likely cause?**

<details>
<summary>Answer</summary>

The change was never committed. Call `con.commit()` after the change, or put it inside a `with con:` block, which commits when the block ends.

</details>

**5. Which exception does the database raise when a row breaks a constraint, such as a foreign key?**

<details>
<summary>Answer</summary>

`sqlite3.IntegrityError`. You can catch it with `try` and `except sqlite3.IntegrityError`.

</details>

## Common mistakes

- **Building SQL with f-strings.** It works in your tests and breaks the first time a value contains a quote, or someone puts one there on purpose. Use `?` placeholders for every value.
- **Forgetting the commit.** Changes disappear when the connection closes. Use `with con:` around changes, or call `con.commit()`.
- **Running the script from the wrong folder.** `sqlite3.connect("season.db")` opens the file in the current directory, and if it does not exist there, it quietly creates a new empty database. The first query then fails with `no such table: players`. Run `pwd`, and delete the empty file it created.
- **Forgetting the PRAGMA in code.** Foreign keys are off on every new connection, in Python too. Run `con.execute("PRAGMA foreign_keys = ON")` right after `connect`.
- **Placeholders for table or column names.** `?` can only stand for a value, never for a table name, a column name or a keyword like `DESC`. If those must change, choose them in your code from a fixed list of allowed names.

## Key terms

- **Connection**: an open link between a program and a database, made with `sqlite3.connect`.
- **Cursor**: the object `execute` returns. It hands out the rows of the result, for example with `fetchall()` or in a `for` loop.
- **Placeholder**: a `?` in an SQL statement that marks where a value goes. The value is passed separately and is never read as SQL.
- **Parameterized query**: a query that uses placeholders for all its values.
- **SQL injection**: an attack where text from a user becomes part of an SQL statement and changes what it does.
- **Commit**: saving the changes of a transaction so that other connections see them and they survive the end of the program.

## Go further

- [Python documentation: sqlite3](https://docs.python.org/3/library/sqlite3.html): the official guide and reference, with a tutorial and a section on placeholders.
- [OWASP: SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html): how defenders prevent SQL injection, with parameterized queries as the first defense.
- [OWASP: SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection): a short description of the attack and its consequences.
