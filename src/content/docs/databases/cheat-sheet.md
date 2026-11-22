---
title: "Cheat sheet: SQL"
description: The SQLite commands, SQL statements, clauses, joins, keys, indexes and Python sqlite3 patterns of Module 7 on one printable page.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## The sqlite3 tool

| Task | Command |
|---|---|
| Install it | `sudo apt install -y sqlite3` |
| Readable output | `printf '.headers on\n.mode table\n' > ~/.sqliterc` |
| Run a SQL file | `sqlite3 ctf.db < ctf.sql` |
| Run one statement | `sqlite3 ctf.db "SELECT * FROM players;"` |
| List tables | `sqlite3 ctf.db ".tables"` |
| Show how a table was made | `sqlite3 ctf.db ".schema players"` |
| List indexes | `sqlite3 logins.db ".indexes"` |
| Load a CSV into a table | `sqlite3 logins.db ".import --csv logins.csv logins"` |
| Time queries (file or standard input only) | `.timer on` as the first line of the file |

Lines that start with a dot are `sqlite3` commands, not SQL. SQL statements end with `;`.

## Creating tables

```sql
CREATE TABLE IF NOT EXISTS solves (
    player_id    INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id),
    solved_at    TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (player_id, challenge_id)
);
```

| Piece | Meaning |
|---|---|
| `INTEGER`, `TEXT` | whole numbers, strings |
| `INTEGER PRIMARY KEY` | unique id; filled in automatically when left out |
| `NOT NULL` | a value is required |
| `UNIQUE` | no two rows with the same value (gets an index automatically) |
| `CHECK (points > 0)` | your own rule |
| `DEFAULT value` | used when an `INSERT` leaves the column out |
| `REFERENCES t(id)` | foreign key to table `t` |
| `ON DELETE CASCADE` | deleting the parent row deletes the rows that point to it |
| `PRIMARY KEY (a, b)` | composite key: the pair must be unique |
| `PRAGMA foreign_keys = ON;` | switch on foreign key checks, once per connection |

## The four statements

| Statement | Example |
|---|---|
| Read | `SELECT name, country FROM players WHERE id = 6;` |
| Add | `INSERT INTO players (name, country) VALUES ('Dana', 'US'), ('Emil', 'SE');` |
| Change | `UPDATE solves SET points = points + 10 WHERE challenge = 'Warmup';` |
| Remove | `DELETE FROM players WHERE id = 5;` |
| Rows changed | `SELECT changes();` (same connection) |
| Fill from a query | `INSERT INTO challenges (title, category, points) SELECT DISTINCT challenge, category, points FROM solves;` |
| Remove a table | `DROP TABLE solves;` |
| Rename a table | `ALTER TABLE new_solves RENAME TO solves;` |
| Add a column | `ALTER TABLE players ADD COLUMN team_id INTEGER REFERENCES teams(id);` |

Safety: run `SELECT * ... WHERE ...` first, then change it into `UPDATE` or `DELETE` with the same `WHERE`. Without `WHERE`, every row is changed.

Transactions: `BEGIN;` ... `COMMIT;` saves everything, `ROLLBACK;` throws it all away.

## Clauses, in this order

| Clause | Example |
|---|---|
| `SELECT` | `SELECT category, count(*) AS solves` |
| `FROM` | `FROM solves` |
| `WHERE` | `WHERE points >= 100` |
| `GROUP BY` | `GROUP BY category` |
| `HAVING` | `HAVING count(*) > 3` |
| `ORDER BY` | `ORDER BY solves DESC, category` |
| `LIMIT` | `LIMIT 3` |

## Conditions

| Write | Meaning |
|---|---|
| `=`, `<>` or `!=`, `<`, `<=`, `>`, `>=` | compare numbers or text (dates as `2026-11-05`) |
| `a AND (b OR c)` | combine; use brackets when mixing |
| `NOT category = 'misc'` | the opposite |
| `country IN ('DZ', 'FR')` | one of a list |
| `challenge LIKE 'c%'` | pattern: `%` is any text; no case difference for A to Z in SQLite |
| `country IS NULL`, `IS NOT NULL` | missing values (`= NULL` never matches) |

## Aggregates

| Function | Gives |
|---|---|
| `count(*)` | number of rows |
| `count(column)` | number of values that are not NULL |
| `sum(column)`, `avg(column)` | total, average |
| `min(column)`, `max(column)` | smallest, largest |
| `coalesce(x, 0)` | `x`, or `0` when `x` is NULL |
| `DISTINCT` | `SELECT DISTINCT challenge` removes repeated rows |

## Joins

| Join | Rows without a match |
|---|---|
| `FROM solves s JOIN players p ON s.player_id = p.id` | dropped |
| `FROM players p LEFT JOIN solves s ON s.player_id = p.id` | kept, right side NULL |
| `... LEFT JOIN ... WHERE s.id IS NULL` | only the rows with no match |
| `FROM players, solves` (no condition) | cross join: every pair |

Prefix shared column names (`p.id`), group by the id, and put conditions on the right table of a LEFT join in `ON`.

## Indexes

| Task | Command |
|---|---|
| See the plan | `EXPLAIN QUERY PLAN SELECT ...;` |
| Create | `CREATE INDEX idx_logins_username ON logins (username);` |
| Remove | `DROP INDEX idx_logins_username;` |

`SCAN` = reads every row. `SEARCH ... USING INDEX` = uses an index. In SQLite, `LIKE` cannot use a plain index; for "starts with", a range such as `username >= 'user42' AND username < 'user43'` can. Each index costs disk space and slows every write.

## Design rules

- One table per kind of thing; each fact stored once.
- One-to-many: a foreign key in the "many" table. Many-to-many: a junction table with a composite key.
- Do not store what you can compute, such as totals.
- Put rules in the schema: keys, `NOT NULL`, `UNIQUE`, `CHECK`.
- Run a migration on a copy first.

## Python sqlite3

```python
import sqlite3

con = sqlite3.connect("season.db")
con.row_factory = sqlite3.Row              # rows readable as row["name"]
con.execute("PRAGMA foreign_keys = ON")
rows = con.execute("SELECT name FROM players WHERE country = ?", (country,)).fetchall()
row = con.execute("SELECT * FROM players WHERE id = ?", (player_id,)).fetchone()
with con:                                  # commits at the end, rolls back on error
    cur = con.execute("INSERT INTO players (name, country) VALUES (?, ?)", (name, country))
print(cur.lastrowid, cur.rowcount)         # new id, rows changed
con.close()
```

- Every value through a `?` placeholder, never an f-string: that is how SQL injection is prevented.
- `(name,)` with a comma is a tuple of one value.
- No commit, no change. Constraint errors raise `sqlite3.IntegrityError`.
- `connect()` creates an empty file if the path is wrong: then `no such table`.
