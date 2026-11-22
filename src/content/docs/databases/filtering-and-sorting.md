---
title: Filtering and sorting
description: Pick rows with WHERE, put them in order with ORDER BY, keep the first few with LIMIT, and count and add up groups of rows with GROUP BY.
lesson: "7.3"
time: 25 min
sidebar:
  order: 3
---

Who scored the most points this week? Which challenge did nobody manage until Thursday? Which category is too hard? A table with a thousand rows cannot answer anything by itself, and reading it line by line is not an option. In this lesson you learn to ask the database these questions directly, and get back a short answer instead of a long list.

## Goal

After this lesson you can:

- Keep only the rows you want with `WHERE`, combining conditions with `AND`, `OR`, `IN`, `LIKE` and `IS NULL`.
- Sort the result with `ORDER BY` and keep the first rows with `LIMIT`.
- Count and add up rows per group with `count`, `sum` and `GROUP BY`.

## Why it matters

Real tables are big: a web server's log table can grow by millions of rows a day. Nobody reads them; people ask questions. "The ten most recent failed logins", "requests per IP address, highest first": these are the queries a defender types while investigating an incident, and every one of them is built from the pieces in this lesson.

## The idea

A `SELECT` can have several parts, called **clauses**. Each one does one job, and they must be written in this order:

| Clause | Job | Example |
|---|---|---|
| `SELECT` | which columns to show | `SELECT challenge, points` |
| `FROM` | which table | `FROM solves` |
| `WHERE` | which rows to keep | `WHERE points >= 200` |
| `GROUP BY` | squeeze rows into groups | `GROUP BY category` |
| `HAVING` | which groups to keep | `HAVING count(*) > 3` |
| `ORDER BY` | in which order | `ORDER BY points DESC` |
| `LIMIT` | how many rows at most | `LIMIT 5` |

Only `SELECT` is required. You add the others when you need them.

Think of a librarian with a pile of index cards. `WHERE` takes out the cards you do not want. `ORDER BY` sorts what is left. `LIMIT` hands you only the top few. `GROUP BY` sorts the cards into small piles, one per category, so that you can count each pile.

Here is an example of all of it at once. It does not run yet, but you can already read it: "from the solves worth at least 100 points, count them per category, keep the categories with more than three, biggest first".

```sql
SELECT category, count(*) FROM solves
WHERE points >= 100
GROUP BY category
HAVING count(*) > 3
ORDER BY count(*) DESC;
```

## Try it

You need `sqlite3` and the `~/.sqliterc` settings from lesson 7.1.

<!-- lab: run
sudo apt-get install -y -q sqlite3 > /dev/null 2>&1
printf '.headers on\n.mode table\n' > ~/.sqliterc
-->

### 1. Load a whole season of scores

Lessons 7.1 and 7.2 had only a few rows. To have something worth filtering, here is the club's first full week: 8 players and 21 solves. It also adds a `category` column to each solve. Create `season.sql` in a new folder `~/season`:

```bash
mkdir ~/season
cd ~/season
```

```sql title="season.sql"
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
```

Two things are new. One `INSERT` adds many rows, as in lesson 7.2, spread over several lines for readability. And Goran's country is written `NULL`: he did not tell the club. Spaces inside the brackets do not matter to SQL, so the values are lined up to be easy to read.

```bash
sqlite3 season.db < season.sql
sqlite3 season.db "SELECT * FROM players;"
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
| 6  | Farah | DZ      |
| 7  | Goran |         |
| 8  | Hana  | JP      |
+----+-------+---------+
```

### 2. Compare

```bash
sqlite3 season.db "SELECT player_id, challenge, points FROM solves WHERE points >= 300;"
```

```output
+-----------+--------------+--------+
| player_id |  challenge   | points |
+-----------+--------------+--------+
| 1         | Login bypass | 300    |
| 1         | Root me      | 400    |
| 3         | Root me      | 400    |
+-----------+--------------+--------+
```

The comparison signs are `=`, `<>` (not equal, `!=` also works), `<`, `<=`, `>` and `>=`. They work on text too. Text is compared letter by letter, which is why the dates in this table are written year first: `'2026-11-05' < '2026-11-08'` is true, just as the calendar says.

```bash
sqlite3 season.db "SELECT player_id, challenge, solved_at FROM solves WHERE solved_at >= '2026-11-07';"
```

```output
+-----------+--------------+------------------+
| player_id |  challenge   |    solved_at     |
+-----------+--------------+------------------+
| 1         | Root me      | 2026-11-08 23:59 |
| 3         | Root me      | 2026-11-07 16:45 |
| 8         | Caesar salad | 2026-11-09 21:30 |
+-----------+--------------+------------------+
```

### 3. Combine conditions

```bash
sqlite3 season.db "SELECT player_id, challenge, points FROM solves WHERE category = 'web' AND points > 200;"
```

```output
+-----------+--------------+--------+
| player_id |  challenge   | points |
+-----------+--------------+--------+
| 1         | Login bypass | 300    |
+-----------+--------------+--------+
```

`AND` keeps a row only if both tests pass. `OR` keeps it if at least one passes. When you mix them, use brackets, exactly as in maths, to say which goes first:

```bash
sqlite3 season.db "SELECT player_id, challenge FROM solves WHERE player_id = 2 AND (category = 'crypto' OR category = 'web');"
```

```output
+-----------+-------------+
| player_id |  challenge  |
+-----------+-------------+
| 2         | Base64 soup |
+-----------+-------------+
```

Without the brackets, SQL does the `AND` first, and you would get Ben's crypto solves plus every web solve of every player. `NOT` turns a test around: `WHERE NOT category = 'misc'`.

### 4. Lists and patterns

```bash
sqlite3 season.db "SELECT name, country FROM players WHERE country IN ('DZ', 'FR');"
```

```output
+-------+---------+
| name  | country |
+-------+---------+
| Amira | DZ      |
| Ben   | FR      |
| Farah | DZ      |
+-------+---------+
```

`IN` is a short way to write many `OR`s: `country = 'DZ' OR country = 'FR'`.

```bash
sqlite3 season.db "SELECT DISTINCT challenge FROM solves WHERE challenge LIKE '%salad%' OR challenge LIKE 'c%';"
```

```output
+--------------+
|  challenge   |
+--------------+
| Cookie jar   |
| Caesar salad |
+--------------+
```

`LIKE` compares with a **pattern**: text with wildcards in it. `%` stands for "any text, even none", so `'%salad%'` means "contains salad" and `'c%'` means "starts with c". In SQLite, `LIKE` ignores the difference between capital and small letters (for the plain letters A to Z), which is why `'c%'` found `Cookie jar` and `Caesar salad`. `DISTINCT` removes repeated rows from the result: without it, each name would appear twice, once per player who solved that challenge.

### 5. Find the missing values

```bash
sqlite3 season.db "SELECT * FROM players WHERE country = NULL;"
sqlite3 season.db "SELECT * FROM players WHERE country IS NULL;"
```

```output
+----+-------+---------+
| id | name  | country |
+----+-------+---------+
| 7  | Goran |         |
+----+-------+---------+
```

The first query printed nothing. NULL means "unknown", and in SQL a comparison with something unknown is itself unknown, never true, so `= NULL` matches no row at all. To test for NULL, always use `IS NULL`, or `IS NOT NULL` for the opposite.

### 6. Sort and cut

```bash
sqlite3 season.db "SELECT player_id, challenge, solved_at FROM solves ORDER BY solved_at DESC LIMIT 3;"
```

```output
+-----------+--------------+------------------+
| player_id |  challenge   |    solved_at     |
+-----------+--------------+------------------+
| 8         | Caesar salad | 2026-11-09 21:30 |
| 1         | Root me      | 2026-11-08 23:59 |
| 3         | Root me      | 2026-11-07 16:45 |
+-----------+--------------+------------------+
```

`ORDER BY solved_at` sorts by that column. `DESC` means descending, from big to small, so the latest solves come first. The default is `ASC`, ascending. `LIMIT 3` keeps the first three rows of the sorted result. Together they answer "what happened last?", one of the most common questions you will ask a log table.

You can sort by several columns. The second one only decides between rows that tie on the first:

```bash
sqlite3 season.db "SELECT DISTINCT challenge, points FROM solves ORDER BY points DESC, challenge;"
```

```output
+--------------+--------+
|  challenge   | points |
+--------------+--------+
| Root me      | 400    |
| Login bypass | 300    |
| Cookie jar   | 200    |
| Caesar salad | 150    |
| Lost packet  | 150    |
| Base64 soup  | 100    |
| Hidden file  | 100    |
| Warmup       | 50     |
+--------------+--------+
```

Two challenges are worth 150 points and two are worth 100, and inside each tie the names are in alphabetical order. Without `ORDER BY`, the database returns rows in whatever order is fastest for it, which is not guaranteed to stay the same.

### 7. Count

```bash
sqlite3 season.db "SELECT count(*) FROM solves;"
sqlite3 season.db "SELECT count(*) AS web_solves FROM solves WHERE category = 'web';"
```

```output
+----------+
| count(*) |
+----------+
| 21       |
+----------+
+------------+
| web_solves |
+------------+
| 3          |
+------------+
```

`count(*)` counts rows. It is an **aggregate function**: it takes many rows and gives back one value. Its friends are `sum(column)`, `avg(column)`, `min(column)` and `max(column)`. Note the order of work: `WHERE` runs first, so the second count only sees the web solves.

### 8. Group

```bash
sqlite3 season.db "SELECT category, count(*) AS solves FROM solves GROUP BY category ORDER BY solves DESC;"
```

```output
+----------+--------+
| category | solves |
+----------+--------+
| misc     | 7      |
| linux    | 5      |
| crypto   | 4      |
| web      | 3      |
| network  | 2      |
+----------+--------+
```

`GROUP BY category` puts the rows into one pile per category, and `count(*)` then counts each pile separately. The rows of one pile form a **group**, and the result has one row per group. `misc` is the most solved category, because everyone starts with the warmup.

The same idea gives you a scoreboard:

```bash
sqlite3 season.db "SELECT player_id, count(*) AS solved, sum(points) AS total FROM solves GROUP BY player_id ORDER BY total DESC;"
```

```output
+-----------+--------+-------+
| player_id | solved | total |
+-----------+--------+-------+
| 1         | 5      | 1050  |
| 3         | 4      | 700   |
| 6         | 4      | 400   |
| 8         | 3      | 350   |
| 4         | 2      | 250   |
| 2         | 2      | 150   |
| 7         | 1      | 50    |
+-----------+--------+-------+
```

Player 1 leads with 1050 points. Emil, player 5, is missing: he has no solves, so there is no pile for him. And the board shows ids, not names, because the names are in the other table. Lesson 7.4 fixes both.

To filter groups, use `HAVING`. `WHERE` cannot do it, because it runs before the groups exist:

```bash
sqlite3 season.db "SELECT player_id, count(*) AS solved FROM solves GROUP BY player_id HAVING count(*) >= 4;"
```

```output
+-----------+--------+
| player_id | solved |
+-----------+--------+
| 1         | 5      |
| 3         | 4      |
| 6         | 4      |
+-----------+--------+
```

## Exercise

Work in `~/season`.

1. List the `challenge` and `solved_at` of every solve on 2 November 2026, in time order.
2. Show the single most valuable solve of player 6: its challenge and points.
3. How many players solved `Warmup`?
4. For each category, show the total points of all its solves. Keep only the categories with a total over 300, highest first.

<details>
<summary>Show the solution</summary>

```bash
cd ~/season
sqlite3 season.db "SELECT challenge, solved_at FROM solves WHERE solved_at LIKE '2026-11-02%' ORDER BY solved_at;"
```

```output
+-------------+------------------+
|  challenge  |    solved_at     |
+-------------+------------------+
| Warmup      | 2026-11-02 09:05 |
| Warmup      | 2026-11-02 09:12 |
| Hidden file | 2026-11-02 09:40 |
| Warmup      | 2026-11-02 10:05 |
| Warmup      | 2026-11-02 10:30 |
| Hidden file | 2026-11-02 11:20 |
| Warmup      | 2026-11-02 13:00 |
+-------------+------------------+
```

`solved_at >= '2026-11-02' AND solved_at < '2026-11-03'` works too, and on a big table with an index it is the faster choice (lesson 7.5).

```bash
sqlite3 season.db "SELECT challenge, points FROM solves WHERE player_id = 6 ORDER BY points DESC LIMIT 1;"
```

```output
+--------------+--------+
|  challenge   | points |
+--------------+--------+
| Caesar salad | 150    |
+--------------+--------+
```

```bash
sqlite3 season.db "SELECT count(*) FROM solves WHERE challenge = 'Warmup';"
```

```output
+----------+
| count(*) |
+----------+
| 7        |
+----------+
```

No player has two `Warmup` rows in this table, so counting the rows counts the players. Nothing in the schema forbids a second row for the same solve, though. Lesson 7.6 adds that rule.

```bash
sqlite3 season.db "SELECT category, sum(points) AS total FROM solves GROUP BY category HAVING sum(points) > 300 ORDER BY total DESC;"
```

```output
+----------+-------+
| category | total |
+----------+-------+
| linux    | 1100  |
| web      | 700   |
| crypto   | 500   |
| misc     | 350   |
+----------+-------+
```

`network` is not in the list: its two solves add up to exactly 300, and `HAVING sum(points) > 300` asks for more than that.

</details>

## Check yourself

**1. In what order must `WHERE`, `ORDER BY`, `GROUP BY` and `LIMIT` be written?**

<details>
<summary>Answer</summary>

`WHERE`, then `GROUP BY`, then `ORDER BY`, then `LIMIT`. If there is a `HAVING`, it comes right after `GROUP BY`.

</details>

**2. Why does `WHERE country = NULL` never find anything?**

<details>
<summary>Answer</summary>

NULL means "unknown". Comparing anything with an unknown value gives an unknown result, never true, so no row passes. Use `WHERE country IS NULL`.

</details>

**3. What is the difference between `WHERE` and `HAVING`?**

<details>
<summary>Answer</summary>

`WHERE` filters rows before they are grouped. `HAVING` filters the groups after `GROUP BY`, so it can use aggregate results such as `count(*)`.

</details>

**4. What does `LIKE 'root%'` match?**

<details>
<summary>Answer</summary>

Any text that starts with "root", in capital or small letters in SQLite: `Root me`, `rootkit`, or just `root`. `%` means any text, even none.

</details>

**5. Why does the scoreboard from step 8 not show Emil?**

<details>
<summary>Answer</summary>

He has no rows in `solves`, so `GROUP BY player_id` makes no group for him. A query that starts from the `players` table and joins the solves to it can show him with zero, as lesson 7.4 does.

</details>

## Common mistakes

- **`= NULL` instead of `IS NULL`.** It silently matches nothing. Use `IS NULL` and `IS NOT NULL`.
- **Mixing `AND` and `OR` without brackets.** `AND` goes first, which is rarely what you meant. Add brackets every time you mix them.
- **`LIMIT` without `ORDER BY`.** "The first 5 rows" means nothing if the order is not fixed. Sort first, then cut.
- **Dates written as `05/11/2026`.** Text in this form does not sort by date. Store dates as `2026-11-05`, year first, and comparisons and sorting just work.
- **Putting an aggregate in `WHERE`.** `WHERE count(*) > 3` is an error, because the counting has not happened yet. Use `HAVING`.

## Key terms

- **Clause**: one part of a SQL statement with its own job, such as `WHERE` or `ORDER BY`.
- **Aggregate function**: a function such as `count`, `sum`, `avg`, `min` or `max` that turns many rows into one value.
- **Group (SQL)**: the set of rows that share the same value in the `GROUP BY` column. Aggregates are computed once per group.
- **Pattern (SQL)**: text with wildcards, such as `'%salad%'`, that `LIKE` compares with.

## Go further

- [SQLite: SELECT](https://www.sqlite.org/lang_select.html): the full description of `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY` and `LIMIT`, and the order in which they run.
- [SQLite: aggregate functions](https://www.sqlite.org/lang_aggfunc.html): every built-in aggregate, with what each one does with NULL values.
- [SQLite: expressions](https://www.sqlite.org/lang_expr.html): operators, `LIKE`, `IN`, `IS NULL` and the other pieces you can put in a condition.
