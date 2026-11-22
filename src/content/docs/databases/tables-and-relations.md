---
title: Tables and relations
description: Learn what a relational database is, with rows, columns, primary keys and foreign keys, and build your first SQLite database with two linked tables.
lesson: "7.1"
time: 20 min
sidebar:
  order: 1
---

Picture a small CTF club that keeps its scores in a spreadsheet. Every time someone solves a challenge, a new line goes in, with the player's name typed again by hand. After a month, "Amira" is also spelled "amira" and "Amira " with a space, nobody knows which Ben is which, and the total score of each player depends on who did the counting. A database exists to stop exactly this kind of slow mess.

## Goal

After this lesson you can:

- Explain what a table, a row and a column are, and what makes a database relational.
- Say what a primary key and a foreign key do.
- Create a SQLite database with two linked tables, and read the errors its keys give you.

## Why it matters

Almost every program you will use or build keeps its data in a database: user accounts, messages, orders, logs, the notes in your future `mylab` app. When you read about a data breach, the stolen thing is usually a database table. To build an app, to secure one, or just to answer a question like "who logged in last night", you need to know how that data is shaped.

## The idea

A **database** is a collection of data kept in order by a program, so that many people and programs can read and change it without breaking it. That program is called a **database management system** (DBMS). In this module you use **SQLite**, a small DBMS that keeps a whole database in one ordinary file. It is the most widely used database in the world: your phone, your browser and Python all carry a copy.

A **relational database** stores its data in **tables**. A table looks like a spreadsheet with strict rules:

- Each **column** has a name and holds one kind of fact, for example `name` or `points`.
- Each **row** is one thing: one player, one solved challenge.
- Every row of a table has the same columns.

You talk to the database in **SQL** (Structured Query Language, said "S-Q-L" or "sequel"). SQL is not a full programming language like Python. You say *what* you want, such as "create this table" or "give me these rows", and the database works out *how*.

Two kinds of columns make the rules work.

A **primary key** is a column whose value is different in every row, so it names exactly one row. Two players can both be called Ben, but only one has the id `2`.

A **foreign key** is a column that holds the primary key of a row in another table. The link it makes between the two tables is called a **relationship**. Think of a student number on an exam sheet. The sheet does not repeat your name, birthday and address; it carries one number, and the school's student list says who that number is. If you change your address, it changes in one place only.

A small surprise about the name: "relational" does not come from these links. In the mathematics that databases are built on, a table of rows is called a **relation**. So a relational database is, quite simply, a database made of tables, and the tables are linked by keys.

Here are the two tables you build today:

<figure class="diagram">
<svg viewBox="0 0 600 230" role="img" aria-labelledby="rel-title rel-desc">
<title id="rel-title">Two tables linked by a foreign key</title>
<desc id="rel-desc">On the left, the players table with the columns id, name and country. The id column is the primary key. On the right, the solves table with the columns id, player_id, challenge, points and solved_at. Its id column is its own primary key. An arrow goes from the player_id column of solves to the id column of players: player_id is a foreign key that points to a player.</desc>
<rect class="d-box" x="10" y="40" width="190" height="130"/>
<path class="d-line" d="M10 75 H200"/>
<rect class="d-box d-hot" x="20" y="85" width="170" height="26"/>
<text x="105" y="62">players</text>
<text x="105" y="103">id (primary key)</text>
<text x="105" y="133">name</text>
<text x="105" y="158">country</text>
<rect class="d-box" x="340" y="20" width="250" height="190"/>
<path class="d-line" d="M340 55 H590"/>
<text x="465" y="42">solves</text>
<text x="465" y="83">id (primary key)</text>
<rect class="d-box d-hot" x="350" y="95" width="230" height="26"/>
<text x="465" y="113">player_id (foreign key)</text>
<text x="465" y="143">challenge</text>
<text x="465" y="168">points</text>
<text x="465" y="193">solved_at</text>
<path class="d-line d-hot" d="M350 108 H270 V98 H192 M202 93 L192 98 L202 103"/>
</svg>
<figcaption>Each solve says which player solved it by holding that player's <code>id</code>. The name is stored once, in <code>players</code>.</figcaption>
</figure>

One player can have many solves, but each solve belongs to exactly one player. This shape is called **one-to-many**, and you will see it everywhere: one customer, many orders; one user, many notes.

## Try it

The outputs below come from a user called `sam`. Wherever you see `sam`, your screen shows your own username.

### 1. Install SQLite

<!-- lab: nocheck -->
```bash
sudo apt install -y sqlite3
```

`apt` prints its usual progress lines, as in lesson 1.6. This installs the `sqlite3` command, a small program that opens a database file and runs your SQL. Python already has SQLite built in; this is only the terminal tool. Check that it works:

<!-- lab: nocheck -->
```bash
sqlite3 --version
```

```output
3.45.1 2024-01-30 16:01:20 e876e51a0ed5c5b3126f52e532044363a014bc594cfefa87ffb5b82257ccalt1 (64-bit)
```

Your version number may be newer. Everything in this module works with any recent version.

### 2. Make a home for the files

```bash
mkdir ~/ctf
cd ~/ctf
printf '.headers on\n.mode table\n' > ~/.sqliterc
```

`sqlite3` reads the file `~/.sqliterc` every time it starts. These two settings make it print column names and draw results as a table with borders. Without them it prints plain values separated by `|`, which is harder to read. The file is hidden because its name starts with a dot (lesson 1.2).

### 3. Describe the tables in SQL

Create `ctf.sql` in your editor with this content:

```sql title="ctf.sql"
CREATE TABLE players (
    id      INTEGER PRIMARY KEY,
    name    TEXT NOT NULL,
    country TEXT
);

CREATE TABLE solves (
    id        INTEGER PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id),
    challenge TEXT NOT NULL,
    points    INTEGER NOT NULL,
    solved_at TEXT NOT NULL
);

INSERT INTO players (id, name, country) VALUES (1, 'Amira', 'DZ');
INSERT INTO players (id, name, country) VALUES (2, 'Ben', 'FR');
INSERT INTO players (id, name, country) VALUES (3, 'Chen', 'CN');

INSERT INTO solves (player_id, challenge, points, solved_at) VALUES (1, 'Warmup', 50, '2026-11-02 09:12');
INSERT INTO solves (player_id, challenge, points, solved_at) VALUES (1, 'Hidden file', 100, '2026-11-02 09:40');
INSERT INTO solves (player_id, challenge, points, solved_at) VALUES (3, 'Warmup', 50, '2026-11-02 10:05');
```

Read it slowly, because every word counts:

- `CREATE TABLE players ( ... )` makes a table. Inside the brackets, one line per column: its name, then its **type**. `INTEGER` holds whole numbers, `TEXT` holds strings.
- `PRIMARY KEY` makes `id` the primary key. In SQLite an `INTEGER PRIMARY KEY` also fills itself: if you leave it out, the next free number is used.
- `NOT NULL` means the column must always have a value. **NULL** is SQL's word for "no value at all", which is different from `0` or an empty string: a `NOT NULL` column still accepts both.
- `REFERENCES players(id)` makes `player_id` a foreign key: its value must be the `id` of a row in `players`.
- `INSERT INTO ... VALUES ...` adds one row. Text goes in single quotes, numbers do not. Lesson 7.2 covers it properly.
- Every statement ends with a semicolon.

The three solves leave out `id`, so SQLite numbers them 1, 2 and 3. Dates are stored as text in the form `year-month-day hour:minute`, which sorts in the right order.

### 4. Build the database

```bash
sqlite3 ctf.db < ctf.sql
ls
```

```output
ctf.db  ctf.sql
```

`sqlite3 ctf.db` opens the database file `ctf.db`, and creates it because it does not exist yet. The `<` sign is the opposite of `>`: it sends the content of a file into the command's standard input (lesson 1.7). So `sqlite3` reads `ctf.sql` as if you had typed it, runs every statement, and exits. It printed nothing, which means nothing went wrong.

### 5. Look inside

Lines that start with a dot are commands for the `sqlite3` tool itself, not SQL.

```bash
sqlite3 ctf.db ".tables"
```

```output
players  solves
```

```bash
sqlite3 ctf.db ".schema players"
```

```output
CREATE TABLE players (
    id      INTEGER PRIMARY KEY,
    name    TEXT NOT NULL,
    country TEXT
);
```

`.tables` lists the tables. `.schema` shows how a table was created: the database remembers your `CREATE TABLE` word for word. The structure of a database, its tables and columns and keys, is called its **schema**.

Now ask for the rows. A command in quotes after the file name is run, and then `sqlite3` exits:

```bash
sqlite3 ctf.db "SELECT * FROM players;"
```

```output
+----+-------+---------+
| id | name  | country |
+----+-------+---------+
| 1  | Amira | DZ      |
| 2  | Ben   | FR      |
| 3  | Chen  | CN      |
+----+-------+---------+
```

```bash
sqlite3 ctf.db "SELECT * FROM solves;"
```

```output
+----+-----------+-------------+--------+------------------+
| id | player_id |  challenge  | points |    solved_at     |
+----+-----------+-------------+--------+------------------+
| 1  | 1         | Warmup      | 50     | 2026-11-02 09:12 |
| 2  | 1         | Hidden file | 100    | 2026-11-02 09:40 |
| 3  | 3         | Warmup      | 50     | 2026-11-02 10:05 |
+----+-----------+-------------+--------+------------------+
```

`SELECT * FROM players` means "every column of every row of `players`". Look at the `player_id` column of `solves`: two solves belong to player 1, Amira, one to player 3, Chen. Ben has none yet. The names live in one place only.

### 6. Break the primary key

Try to add a second player with the id `2`:

```bash
sqlite3 ctf.db "INSERT INTO players (id, name, country) VALUES (2, 'Bob', 'US');"
```

```output
Error: stepping, UNIQUE constraint failed: players.id (19)
```

The database refused. `UNIQUE constraint failed: players.id` means: a row with this id exists already. "Stepping" only says the error came while the statement was running, and `19` is SQLite's number for this kind of error. Nothing was added. A **constraint** is a rule the database enforces on every change, and `PRIMARY KEY`, `NOT NULL` and `REFERENCES` are all constraints. Leave out the id and the insert works, because SQLite picks the next free number:

```bash
sqlite3 ctf.db "INSERT INTO players (name, country) VALUES ('Bob', 'US');"
sqlite3 ctf.db "SELECT * FROM players;"
```

```output
+----+-------+---------+
| id | name  | country |
+----+-------+---------+
| 1  | Amira | DZ      |
| 2  | Ben   | FR      |
| 3  | Chen  | CN      |
| 4  | Bob   | US      |
+----+-------+---------+
```

### 7. Test the foreign key

Player 9 does not exist. Add a solve for player 9 anyway:

```bash
sqlite3 ctf.db "INSERT INTO solves (player_id, challenge, points, solved_at) VALUES (9, 'Warmup', 50, '2026-11-02 11:00');"
sqlite3 ctf.db "SELECT * FROM solves;"
```

```output
+----+-----------+-------------+--------+------------------+
| id | player_id |  challenge  | points |    solved_at     |
+----+-----------+-------------+--------+------------------+
| 1  | 1         | Warmup      | 50     | 2026-11-02 09:12 |
| 2  | 1         | Hidden file | 100    | 2026-11-02 09:40 |
| 3  | 3         | Warmup      | 50     | 2026-11-02 10:05 |
| 4  | 9         | Warmup      | 50     | 2026-11-02 11:00 |
+----+-----------+-------------+--------+------------------+
```

It worked, and that is a surprise. Solve 4 now points to nobody. For historical reasons SQLite does not check foreign keys unless you switch the check on, once per connection, with `PRAGMA foreign_keys = ON;`. Most other databases always check. Remove the broken row first. Lesson 7.2 explains `DELETE`; for now, read it as "delete the solves of player 9":

```bash
sqlite3 ctf.db "DELETE FROM solves WHERE player_id = 9;"
```

Now try again, with the check switched on in the same command:

```bash
sqlite3 ctf.db "PRAGMA foreign_keys = ON; INSERT INTO solves (player_id, challenge, points, solved_at) VALUES (9, 'Warmup', 50, '2026-11-02 11:00');"
```

```output
Error: stepping, FOREIGN KEY constraint failed (19)
```

This time the database protects you: a solve must belong to a real player.

:::caution[Foreign keys are off by default in SQLite]
Every new connection to a SQLite database starts with foreign key checks switched off. Put `PRAGMA foreign_keys = ON;` at the start of every session, and later at the start of every program that opens the database. You can add the line to `~/.sqliterc` too. It is the most common SQLite surprise.
:::

## Exercise

Work in `~/ctf` with your `ctf.db`.

1. Add a player called Dana from the `US`. Let SQLite choose her id. Check which id she got.
2. Give Dana one solve: the challenge `Warmup`, 50 points, solved at `2026-11-03 14:20`.
3. Try to add a player without a name, `INSERT INTO players (country) VALUES ('SE');`, and read the error.
4. With foreign keys switched on, try to add a solve for player `0`.

<details>
<summary>Show the solution</summary>

```bash
cd ~/ctf
sqlite3 ctf.db "INSERT INTO players (name, country) VALUES ('Dana', 'US');"
sqlite3 ctf.db "SELECT * FROM players;"
```

```output
+----+-------+---------+
| id | name  | country |
+----+-------+---------+
| 1  | Amira | DZ      |
| 2  | Ben   | FR      |
| 3  | Chen  | CN      |
| 4  | Bob   | US      |
| 5  | Dana  | US      |
+----+-------+---------+
```

Dana got the id 5, the next free number after Bob's 4.

```bash
sqlite3 ctf.db "INSERT INTO solves (player_id, challenge, points, solved_at) VALUES (5, 'Warmup', 50, '2026-11-03 14:20');"
sqlite3 ctf.db "INSERT INTO players (country) VALUES ('SE');"
```

```output
Error: stepping, NOT NULL constraint failed: players.name (19)
```

The first command added the solve and printed nothing. The second one broke the `NOT NULL` rule on `name`.

```bash
sqlite3 ctf.db "PRAGMA foreign_keys = ON; INSERT INTO solves (player_id, challenge, points, solved_at) VALUES (0, 'Warmup', 50, '2026-11-03 15:00');"
```

```output
Error: stepping, FOREIGN KEY constraint failed (19)
```

There is no player with the id 0, so the foreign key check stopped the insert.

</details>

## Check yourself

**1. In the `solves` table, what is one row, and what is one column?**

<details>
<summary>Answer</summary>

One row is one solved challenge: who solved what, for how many points, and when. One column is one kind of fact about every solve, for example `points`.

</details>

**2. Why does `solves` store `player_id` and not the player's name?**

<details>
<summary>Answer</summary>

The name is stored once, in `players`. The solve only points to the player with the primary key. If the name changes, it changes in one row, and two players with the same name can still be told apart by their ids.

</details>

**3. You insert a solve for a player that does not exist, and SQLite accepts it. Why?**

<details>
<summary>Answer</summary>

SQLite only checks foreign keys when `PRAGMA foreign_keys = ON;` has been run on that connection. By default the check is off.

</details>

**4. What is the difference between NULL and `0` in a `points` column?**

<details>
<summary>Answer</summary>

`0` is a value: zero points. NULL means there is no value at all, nothing is known. A column marked `NOT NULL` rejects NULL but accepts `0`.

</details>

**5. Is a line like `.tables` SQL?**

<details>
<summary>Answer</summary>

No. Lines that start with a dot are commands of the `sqlite3` tool. Another database program would not understand them. SQL statements such as `SELECT` end with a semicolon and work, with small differences, in every relational database.

</details>

## Common mistakes

- **Double quotes around text values.** In SQL, text goes in single quotes: `'Amira'`. Double quotes are for names of tables and columns. SQLite reads `"Amira"` as text only because no column has that name, so `WHERE name = "name"` silently compares the column with itself and matches every row.
- **Forgetting the semicolon.** A statement without `;` at the end is not finished. In a file, the next statement is glued to it and you get a `syntax error`.
- **Running `ctf.sql` twice.** The second run prints `table players already exists` and more errors, but it does not stop there. It goes on to the next statements, and the three solves, which have no fixed id, are added a second time. To start over, delete the database file with `rm ctf.db` and build it again.
- **Trusting foreign keys without the PRAGMA.** In SQLite, run `PRAGMA foreign_keys = ON;` in each session, or broken links slip in silently.
- **Mixing up the database file and the SQL file.** `ctf.sql` is a text file with instructions. `ctf.db` is the database itself, in SQLite's own format: opening it with `cat` shows mostly unreadable bytes.

## Key terms

- **Database**: a collection of data kept in order by a program, so that many people and programs can use it safely.
- **Database management system (DBMS)**: the program that stores a database and runs the queries on it, such as SQLite or PostgreSQL.
- **SQLite**: a small DBMS that keeps a whole database in one file and needs no server.
- **Relational database**: a database that stores data in tables linked by keys.
- **Table**: a set of rows that all have the same columns.
- **Row**: one entry in a table, such as one player.
- **Column**: one named fact that every row of a table has, with a type.
- **SQL**: Structured Query Language, the language used to create, read and change data in a relational database.
- **Primary key**: a column whose value is different in every row, so it identifies exactly one row.
- **Foreign key**: a column that holds the primary key of a row in another table.
- **Relation**: the word database theory uses for a table. It is where the name "relational" comes from.
- **Relationship**: the link between two tables, made by a foreign key.
- **One-to-many**: a relationship where one row of a table is linked to many rows of another, such as one player with many solves.
- **NULL**: SQL's marker for "no value", different from `0` and from empty text.
- **Constraint**: a rule the database checks on every change, such as `NOT NULL` or `PRIMARY KEY`.
- **Schema**: the structure of a database: its tables, their columns and their keys.

## Go further

- [SQLite: CREATE TABLE](https://www.sqlite.org/lang_createtable.html): the official reference for everything you can write inside a `CREATE TABLE`.
- [SQLite foreign key support](https://www.sqlite.org/foreignkeys.html): why foreign keys are off by default, and every detail of how they work.
- [Command line shell for SQLite](https://www.sqlite.org/cli.html): all the dot commands of the `sqlite3` tool, including `.mode` and `.schema`.
