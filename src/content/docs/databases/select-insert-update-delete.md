---
title: SELECT, INSERT, UPDATE, DELETE
description: Read rows with SELECT and change data with INSERT, UPDATE and DELETE in SQLite, and use a transaction to undo a change before it is saved.
lesson: "7.2"
time: 20 min
sidebar:
  order: 2
---

Four words do almost all the daily work in SQL. `SELECT` reads, `INSERT` adds, `UPDATE` changes and `DELETE` removes. Programmers call this set **CRUD**: create, read, update, delete. Every app you have ever used is, underneath, mostly sending these four statements to a database.

## Goal

After this lesson you can:

- Read chosen columns and rows with `SELECT`.
- Add, change and remove rows with `INSERT`, `UPDATE` and `DELETE`.
- Check a change before you make it, and undo it with a transaction.

## Why it matters

Reading data is harmless. Changing it is not: one `UPDATE` or `DELETE` without the right condition can wipe a whole table in a fraction of a second, and SQL never asks "are you sure?". People who work with production databases build small habits to avoid that, and you will learn them here, on a database where a mistake costs nothing.

## The idea

All four statements follow the same pattern: a verb, a table, and often a condition that picks the rows.

| Statement | What it does | Shape |
|---|---|---|
| `SELECT` | reads rows | `SELECT columns FROM table WHERE condition;` |
| `INSERT` | adds new rows | `INSERT INTO table (columns) VALUES (values);` |
| `UPDATE` | changes rows that exist | `UPDATE table SET column = value WHERE condition;` |
| `DELETE` | removes rows | `DELETE FROM table WHERE condition;` |

The `WHERE` part is a **condition**: a test that each row passes or fails, such as `id = 3`. Only the rows that pass are read, changed or removed. A `SELECT` is also called a **query**, because it asks the database a question; people often use the word for any SQL statement. Lesson 7.3 covers conditions in detail; here you only need `=`.

Think of `WHERE` as the address on an instruction. "Paint the door of house 3 red" changes one house. "Paint the door red", with no address, gets every door in the street painted, and the painter will not stop to ask which one you meant.

The second idea is the **transaction**: a group of changes that the database saves all together or not at all. You start one with `BEGIN`. Then `COMMIT` saves every change, and `ROLLBACK` throws them all away as if nothing happened.

## Try it

This lesson continues in the `~/ctf` folder from lesson 7.1, with its `ctf.sql` file and the `~/.sqliterc` settings.

<!-- lab: run
sudo apt-get install -y -q sqlite3 > /dev/null 2>&1
printf '.headers on\n.mode table\n' > ~/.sqliterc
mkdir -p ~/ctf
cat > ~/ctf/ctf.sql <<'EOF'
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
EOF
-->

### 1. Start from a clean copy

```bash
cd ~/ctf
rm -f ctf.db
sqlite3 ctf.db < ctf.sql
```

This deletes the database from last time and builds it again from `ctf.sql`, so your rows match the ones below. Keeping the SQL that builds a database in a file pays off exactly like this: you can always start over.

### 2. Read only what you need

```bash
sqlite3 ctf.db "SELECT name, country FROM players;"
```

```output
+-------+---------+
| name  | country |
+-------+---------+
| Amira | DZ      |
| Ben   | FR      |
| Chen  | CN      |
+-------+---------+
```

Instead of `*`, you list the columns you want, separated by commas, in the order you want them. Real tables often have dozens of columns, and asking only for what you need is faster and easier to read.

```bash
sqlite3 ctf.db "SELECT challenge, points FROM solves WHERE player_id = 1;"
```

```output
+-------------+--------+
|  challenge  | points |
+-------------+--------+
| Warmup      | 50     |
| Hidden file | 100    |
+-------------+--------+
```

`WHERE player_id = 1` keeps only Amira's solves. Note that SQL uses a single `=` to compare, where Python uses `==`.

You can also compute in a `SELECT`, and give the result a name with `AS`:

```bash
sqlite3 ctf.db "SELECT challenge, points, points * 2 AS double_points FROM solves;"
```

```output
+-------------+--------+---------------+
|  challenge  | points | double_points |
+-------------+--------+---------------+
| Warmup      | 50     | 100           |
| Hidden file | 100    | 200           |
| Warmup      | 50     | 100           |
+-------------+--------+---------------+
```

The new column exists only in this result. Nothing in the table changed.

### 3. Add rows

```bash
sqlite3 ctf.db "INSERT INTO players (name, country) VALUES ('Dana', 'US'), ('Emil', 'SE');"
sqlite3 ctf.db "INSERT INTO players (name) VALUES ('Farah');"
sqlite3 ctf.db "SELECT * FROM players;"
```

```output
+----+-------+---------+
| id | name  | country |
+----+-------+---------+
| 1  | Amira | DZ      |
| 2  | Ben   | FR      |
| 3  | Chen  | CN      |
| 4  | Dana  | US      |
| 5  | Emil  | SE      |
| 6  | Farah |         |
+----+-------+---------+
```

One `INSERT` can add several rows: put one bracket of values per row, separated by commas. Values go in the same order as the column list. The second `INSERT` named only `name`, so Farah's `country` is NULL, which the table shows as an empty cell. It is allowed, because the `country` column has no `NOT NULL`.

### 4. Change rows

Farah tells you she plays from Algeria. Before you change anything, look at the rows your condition picks:

```bash
sqlite3 ctf.db "SELECT * FROM players WHERE id = 6;"
```

```output
+----+-------+---------+
| id | name  | country |
+----+-------+---------+
| 6  | Farah |         |
+----+-------+---------+
```

Exactly one row, and it is the right one. Now turn the same condition into an `UPDATE`:

```bash
sqlite3 ctf.db "UPDATE players SET country = 'DZ' WHERE id = 6;"
sqlite3 ctf.db "SELECT * FROM players WHERE id = 6;"
```

```output
+----+-------+---------+
| id | name  | country |
+----+-------+---------+
| 6  | Farah | DZ      |
+----+-------+---------+
```

`SET` says which column gets which new value. The new value can be computed from the old one. The club decides that `Warmup` is worth 10 more points:

```bash
sqlite3 ctf.db "UPDATE solves SET points = points + 10 WHERE challenge = 'Warmup'; SELECT changes();"
```

```output
+-----------+
| changes() |
+-----------+
| 2         |
+-----------+
```

`points = points + 10` reads the old value, adds 10 and writes the result, for each row that matches. `changes()` gives the number of rows the last statement changed: 2, one for Amira and one for Chen. It only works in the same connection, which is why both statements are in one command, separated by a semicolon.

### 5. Forget the WHERE, on purpose

Make a copy of the database and do the classic mistake on the copy:

```bash
cp ctf.db oops.db
sqlite3 oops.db "UPDATE players SET name = 'Amira'; SELECT * FROM players;"
```

```output
+----+-------+---------+
| id | name  | country |
+----+-------+---------+
| 1  | Amira | DZ      |
| 2  | Amira | FR      |
| 3  | Amira | CN      |
| 4  | Amira | US      |
| 5  | Amira | SE      |
| 6  | Amira | DZ      |
+----+-------+---------+
```

No error, no warning: every player is now called Amira. Without `WHERE`, an `UPDATE` changes every row of the table, and a `DELETE` removes every row. Your real `ctf.db` is untouched, because you worked on a copy.

```bash
rm oops.db
```

:::tip[SELECT first, then change]
Before every `UPDATE` or `DELETE`, run a `SELECT * FROM table WHERE ...` with the same condition. If it shows exactly the rows you mean, replace the start of the statement and keep the `WHERE` as it is. This one habit prevents most data accidents.
:::

### 6. Remove rows

Emil has left the club. Check, then delete:

```bash
sqlite3 ctf.db "SELECT * FROM players WHERE id = 5;"
```

```output
+----+------+---------+
| id | name | country |
+----+------+---------+
| 5  | Emil | SE      |
+----+------+---------+
```

```bash
sqlite3 ctf.db "PRAGMA foreign_keys = ON; DELETE FROM players WHERE id = 5;"
sqlite3 ctf.db "SELECT * FROM players;"
```

```output
+----+-------+---------+
| id | name  | country |
+----+-------+---------+
| 1  | Amira | DZ      |
| 2  | Ben   | FR      |
| 3  | Chen  | CN      |
| 4  | Dana  | US      |
| 6  | Farah | DZ      |
+----+-------+---------+
```

Now try to delete Amira, who has solves:

```bash
sqlite3 ctf.db "PRAGMA foreign_keys = ON; DELETE FROM players WHERE id = 1;"
```

```output
Error: stepping, FOREIGN KEY constraint failed (19)
```

The foreign key from lesson 7.1 works in both directions. You cannot add a solve for a player who does not exist, and you cannot remove a player while solves still point to her. To remove Amira, you would first delete her solves, or decide on purpose that they should go with her.

### 7. Undo with a transaction

```bash
sqlite3 ctf.db "BEGIN; DELETE FROM solves; SELECT * FROM solves; ROLLBACK; SELECT * FROM solves;"
```

```output
+----+-----------+-------------+--------+------------------+
| id | player_id |  challenge  | points |    solved_at     |
+----+-----------+-------------+--------+------------------+
| 1  | 1         | Warmup      | 60     | 2026-11-02 09:12 |
| 2  | 1         | Hidden file | 100    | 2026-11-02 09:40 |
| 3  | 3         | Warmup      | 60     | 2026-11-02 10:05 |
+----+-----------+-------------+--------+------------------+
```

Read the output from the top. Inside the transaction, `DELETE FROM solves` emptied the table, so the first `SELECT` printed nothing at all. Then `ROLLBACK` cancelled the delete, and the second `SELECT` shows all three solves again. Had you written `COMMIT` instead, the delete would have been saved for good.

Without `BEGIN`, SQLite treats every statement as its own small transaction and saves it at once. That is what happened in all the steps before this one.

## Exercise

Work on your `ctf.db` from this lesson.

1. Ben moves to Belgium: change his country to `BE`. Look at his row first.
2. Ben solves `Base64 soup`, worth 100 points, on `2026-11-04 18:30`. Add it.
3. Show only the `challenge` and `points` of Ben's solves.
4. Inside a transaction, remove every solve worth less than 100 points (`WHERE points < 100`), show the solves that are left, and roll it back.

<details>
<summary>Show the solution</summary>

```bash
cd ~/ctf
sqlite3 ctf.db "SELECT * FROM players WHERE id = 2;"
sqlite3 ctf.db "UPDATE players SET country = 'BE' WHERE id = 2;"
sqlite3 ctf.db "SELECT * FROM players WHERE id = 2;"
```

```output
+----+------+---------+
| id | name | country |
+----+------+---------+
| 2  | Ben  | FR      |
+----+------+---------+
+----+------+---------+
| id | name | country |
+----+------+---------+
| 2  | Ben  | BE      |
+----+------+---------+
```

The first table is Ben's row before the change, the second one after it.

```bash
sqlite3 ctf.db "INSERT INTO solves (player_id, challenge, points, solved_at) VALUES (2, 'Base64 soup', 100, '2026-11-04 18:30');"
sqlite3 ctf.db "SELECT challenge, points FROM solves WHERE player_id = 2;"
```

```output
+-------------+--------+
|  challenge  | points |
+-------------+--------+
| Base64 soup | 100    |
+-------------+--------+
```

```bash
sqlite3 ctf.db "BEGIN; DELETE FROM solves WHERE points < 100; SELECT * FROM solves; ROLLBACK;"
```

```output
+----+-----------+-------------+--------+------------------+
| id | player_id |  challenge  | points |    solved_at     |
+----+-----------+-------------+--------+------------------+
| 2  | 1         | Hidden file | 100    | 2026-11-02 09:40 |
| 4  | 2         | Base64 soup | 100    | 2026-11-04 18:30 |
+----+-----------+-------------+--------+------------------+
```

The two `Warmup` solves, worth 60 points each since step 4, were gone inside the transaction. After `ROLLBACK` they are back: check with `sqlite3 ctf.db "SELECT * FROM solves;"`.

</details>

## Check yourself

**1. What does `UPDATE solves SET points = 0;` do?**

<details>
<summary>Answer</summary>

It sets `points` to 0 in every row of `solves`, because there is no `WHERE`. SQL does not warn you.

</details>

**2. You run `INSERT INTO players (name) VALUES ('Gil');`. What is in his `id` and his `country`?**

<details>
<summary>Answer</summary>

`id` gets the next free number, because it is an `INTEGER PRIMARY KEY`. `country` is NULL, because no value was given and the column allows NULL.

</details>

**3. Why did `DELETE FROM players WHERE id = 1;` fail with foreign keys switched on?**

<details>
<summary>Answer</summary>

Rows in `solves` still point to player 1. Deleting her would leave solves that belong to nobody, and the foreign key forbids that.

</details>

**4. What is the difference between `COMMIT` and `ROLLBACK`?**

<details>
<summary>Answer</summary>

Both end a transaction. `COMMIT` saves every change made since `BEGIN`. `ROLLBACK` throws them all away.

</details>

**5. What is the safest way to write a `DELETE`?**

<details>
<summary>Answer</summary>

Write it as a `SELECT * FROM table WHERE ...` first, check that it returns exactly the rows you mean, then change `SELECT *` into `DELETE` and keep the same `WHERE`. A transaction or a copy of the database adds a second safety net.

</details>

## Common mistakes

- **`UPDATE` or `DELETE` without `WHERE`.** It changes or deletes every row. Always write the `WHERE` first, and test it with a `SELECT`.
- **`==` instead of `=`.** SQLite accepts `==`, but most databases do not. Use a single `=` in SQL.
- **Values in the wrong order.** In `INSERT INTO players (name, country) VALUES ('DZ', 'Amira')` the values swap places, and the database does not notice: both are text. Read the column list and the values side by side.
- **Comparing with NULL using `=`.** `WHERE country = NULL` matches nothing, not even Farah before her update. Lesson 7.3 shows the right way, `IS NULL`.
- **Leaving a transaction open.** If you type `BEGIN` in an interactive session and never `COMMIT`, your changes are lost when you quit. Finish every `BEGIN` with `COMMIT` or `ROLLBACK`.

## Key terms

- **CRUD**: create, read, update, delete, the four basic operations on data. In SQL: `INSERT`, `SELECT`, `UPDATE`, `DELETE`.
- **Query**: a statement that asks the database for data, usually a `SELECT`. People often use the word for any SQL statement.
- **Condition**: a test in a `WHERE` clause that each row passes or fails.
- **Transaction**: a group of changes that the database saves all together, with `COMMIT`, or not at all, with `ROLLBACK`.

## Go further

- [SQLite: SELECT](https://www.sqlite.org/lang_select.html): the official description of everything a `SELECT` can do. Long, but the diagrams at the top show the order of the parts.
- [SQLite: UPDATE](https://www.sqlite.org/lang_update.html): the reference page for changing rows, with links to the pages for `INSERT` and `DELETE`.
- [SQLite: transactions](https://www.sqlite.org/lang_transaction.html): how `BEGIN`, `COMMIT` and `ROLLBACK` work, and what happens to a statement outside a transaction.
