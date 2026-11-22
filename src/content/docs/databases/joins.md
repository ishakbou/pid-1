---
title: Joins
description: Combine rows from two tables with JOIN, and see when an INNER join drops rows and a LEFT join keeps them.
lesson: "7.4"
time: 20 min
sidebar:
  order: 4
---

The scoreboard from lesson 7.3 says that player 1 leads with 1050 points. Who is player 1? The answer sits in another table, and so far the only way to find it was a second query and your own eyes. A **join** does that matching for you: it puts rows from two tables side by side, in one result.

## Goal

After this lesson you can:

- Combine two tables in one query with `JOIN ... ON`.
- Tell an INNER join from a LEFT join, and choose the right one.
- Find rows that have no partner in the other table.

## Why it matters

Lesson 7.1 split the data into tables so that each fact is stored only once. The price is that most useful answers need facts from several tables at the same time: a name from `players` and the points from `solves`, a customer and their orders, a user and their failed logins. Joins are how you pay that price, and you will write them in almost every real query. Getting the type of join wrong is also a classic source of reports that silently leave people out.

## The idea

A join takes each row of one table and looks for matching rows in another table. You say what "matching" means with `ON`:

```sql
SELECT players.name, solves.challenge
FROM solves
JOIN players ON solves.player_id = players.id;
```

Read it as: "for every solve, find the player whose `id` equals the solve's `player_id`, and put them together in one row". The foreign key from lesson 7.1 is exactly the column you join on. Because both tables have a column called `id`, you write `table.column` to say which one you mean.

It is the same job as a teacher who has a pile of exam sheets with student numbers and a class list with numbers and names. She takes each sheet, finds its number on the list, and writes down the name next to the mark.

What happens to a row that finds no match is the difference between the two joins you need to know:

| Join | Rows with no match | Use it when |
|---|---|---|
| `JOIN` (also written `INNER JOIN`) | dropped from the result | you only want pairs that exist |
| `LEFT JOIN` | kept; the columns of the other table are NULL | every row of the first table must appear |

Emil has no solves. An **inner join** of players and solves leaves him out. A **left join** from `players` keeps him, with NULL where a challenge would be.

## Try it

This lesson uses `~/season/season.db` from lesson 7.3. If you no longer have it, go back to step 1 of that lesson and rebuild it from `season.sql`.

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
cd ~/season
rm -f season.db
sqlite3 season.db < season.sql
cd ~
-->

### 1. Your first join

```bash
cd ~/season
sqlite3 season.db "SELECT players.name, solves.challenge, solves.points FROM solves JOIN players ON solves.player_id = players.id WHERE solves.points >= 300;"
```

```output
+-------+--------------+--------+
| name  |  challenge   | points |
+-------+--------------+--------+
| Amira | Login bypass | 300    |
| Amira | Root me      | 400    |
| Chen  | Root me      | 400    |
+-------+--------------+--------+
```

Lesson 7.3 gave you the same three rows with `player_id` 1, 1 and 3. Now the names are there. The database took each solve worth at least 300 points, looked up the player with the matching `id`, and joined the two rows into one.

### 2. Shorter names for tables

Writing `players.` and `solves.` everywhere gets long. Give each table a short **alias** right after its name:

```bash
sqlite3 season.db "SELECT p.name, s.challenge, s.solved_at FROM solves s JOIN players p ON s.player_id = p.id WHERE p.country = 'DZ' ORDER BY s.solved_at LIMIT 4;"
```

```output
+-------+-------------+------------------+
| name  |  challenge  |    solved_at     |
+-------+-------------+------------------+
| Amira | Warmup      | 2026-11-02 09:12 |
| Amira | Hidden file | 2026-11-02 09:40 |
| Farah | Warmup      | 2026-11-02 13:00 |
| Farah | Hidden file | 2026-11-03 08:55 |
+-------+-------------+------------------+
```

`solves s` means "the table `solves`, called `s` in this query". Notice that `WHERE` and `ORDER BY` work on the joined rows, so you can filter on a column of one table, `p.country`, and sort on a column of the other, `s.solved_at`.

### 3. A scoreboard with names

```bash
sqlite3 season.db "SELECT p.name, count(*) AS solved, sum(s.points) AS total FROM players p JOIN solves s ON s.player_id = p.id GROUP BY p.id ORDER BY total DESC;"
```

```output
+-------+--------+-------+
| name  | solved | total |
+-------+--------+-------+
| Amira | 5      | 1050  |
| Chen  | 4      | 700   |
| Farah | 4      | 400   |
| Hana  | 3      | 350   |
| Dana  | 2      | 250   |
| Ben   | 2      | 150   |
| Goran | 1      | 50    |
+-------+--------+-------+
```

The join first builds one row per solve, each with its player's name. `GROUP BY p.id` then makes one pile per player, as in lesson 7.3. Grouping by the id and not by the name matters: if two players were both called Ben, grouping by name would add their points together.

Count the rows: seven. Emil is still missing.

### 4. Keep everyone with a LEFT JOIN

```bash
sqlite3 season.db "SELECT p.name, s.challenge FROM players p LEFT JOIN solves s ON s.player_id = p.id WHERE p.id IN (2, 5);"
```

```output
+------+-------------+
| name |  challenge  |
+------+-------------+
| Ben  | Warmup      |
| Ben  | Base64 soup |
| Emil |             |
+------+-------------+
```

The LEFT join starts from the table on the left of the word `JOIN`, here `players`, and keeps every one of its rows. Ben has two solves, so he appears twice. Emil has none, so he appears once, and the columns that would come from `solves` are NULL: the empty cell next to his name.

That NULL is useful. Keep only the rows where the right side is missing, and you get the players with no solves at all:

```bash
sqlite3 season.db "SELECT p.name FROM players p LEFT JOIN solves s ON s.player_id = p.id WHERE s.id IS NULL;"
```

```output
+------+
| name |
+------+
| Emil |
+------+
```

This pattern, `LEFT JOIN ... WHERE right.id IS NULL`, answers every "who has never ..." question: customers who never ordered, users who never logged in, accounts nobody has used for a year.

### 5. The complete scoreboard

Now combine the LEFT join with the grouping:

```bash
sqlite3 season.db "SELECT p.name, count(*) AS rows_in_group, count(s.id) AS solved, coalesce(sum(s.points), 0) AS total FROM players p LEFT JOIN solves s ON s.player_id = p.id GROUP BY p.id ORDER BY total DESC;"
```

```output
+-------+---------------+--------+-------+
| name  | rows_in_group | solved | total |
+-------+---------------+--------+-------+
| Amira | 5             | 5      | 1050  |
| Chen  | 4             | 4      | 700   |
| Farah | 4             | 4      | 400   |
| Hana  | 3             | 3      | 350   |
| Dana  | 2             | 2      | 250   |
| Ben   | 2             | 2      | 150   |
| Goran | 1             | 1      | 50    |
| Emil  | 1             | 0      | 0     |
+-------+---------------+--------+-------+
```

Everyone is on the board, Emil included. Look at his line closely, because it holds two traps:

- `count(*)` counts rows, and Emil's group has one row: the row with NULLs that the LEFT join made for him. That is why `rows_in_group` says 1. `count(s.id)` counts only the values that are not NULL, which gives the right answer, 0.
- `sum()` of nothing but NULL is NULL, not 0. `coalesce(a, b)` gives `a` if it is not NULL, otherwise `b`, so his total shows `0`.

In a real scoreboard you would drop the `rows_in_group` column. It is here only to show the difference.

### 6. Forget the ON, and see what happens

```bash
sqlite3 season.db "SELECT count(*) FROM players, solves;"
```

```output
+----------+
| count(*) |
+----------+
| 168      |
+----------+
```

Listing two tables with a comma and no condition pairs every player with every solve: 8 players times 21 solves is 168 rows. This is called a **cross join**, and it is almost never what you want. On two tables of a million rows each, it makes a million million pairs, enough to keep the database busy for hours. Every join needs a condition that says which rows belong together.

### 7. Read the ambiguous column error

```bash
sqlite3 season.db "SELECT id, name, challenge FROM players p JOIN solves s ON s.player_id = p.id;"
```

```output
Error: in prepare, ambiguous column name: id
  SELECT id, name, challenge FROM players p JOIN solves s ON s.player_id = p.id;
         ^--- error here
```

"In prepare" means the error was found while SQLite was reading the query, before it ran anything, and the arrow points at the problem. Both tables have an `id` column, so the database does not know which one you mean, and it refuses to guess. Write `p.id` or `s.id`. Columns that exist in only one table, like `name` and `challenge`, do not need the prefix, but many people add it anyway so that the query is easier to read.

## Exercise

Work in `~/season`.

1. Who solved `Root me`? Show the name, the country and the time, earliest first.
2. Show the total points per country, highest first. Every country with a player must appear, even if its players have no solves.
3. Find every player who has not solved anything in the `crypto` category. Hint: put the extra condition in the `ON` part, not in `WHERE`.

<details>
<summary>Show the solution</summary>

```bash
cd ~/season
sqlite3 season.db "SELECT p.name, p.country, s.solved_at FROM solves s JOIN players p ON s.player_id = p.id WHERE s.challenge = 'Root me' ORDER BY s.solved_at;"
```

```output
+-------+---------+------------------+
| name  | country |    solved_at     |
+-------+---------+------------------+
| Chen  | CN      | 2026-11-07 16:45 |
| Amira | DZ      | 2026-11-08 23:59 |
+-------+---------+------------------+
```

```bash
sqlite3 season.db "SELECT p.country, coalesce(sum(s.points), 0) AS total FROM players p LEFT JOIN solves s ON s.player_id = p.id GROUP BY p.country ORDER BY total DESC;"
```

```output
+---------+-------+
| country | total |
+---------+-------+
| DZ      | 1450  |
| CN      | 700   |
| JP      | 350   |
| US      | 250   |
| FR      | 150   |
|         | 50    |
| SE      | 0     |
+---------+-------+
```

Sweden is there with 0 because of the LEFT join. The empty country is Goran: NULL values form one group of their own.

```bash
sqlite3 season.db "SELECT p.name FROM players p LEFT JOIN solves s ON s.player_id = p.id AND s.category = 'crypto' WHERE s.id IS NULL;"
```

```output
+-------+
| name  |
+-------+
| Amira |
| Chen  |
| Dana  |
| Emil  |
| Goran |
+-------+
```

The `ON` condition decides which solves count as a match: only crypto solves. Players with no crypto solve then get NULLs, and `WHERE s.id IS NULL` keeps exactly them. If you move `s.category = 'crypto'` into the `WHERE`, it throws away the NULL rows before the `IS NULL` test can see them, and the result is empty.

</details>

## Check yourself

**1. What does the `ON` part of a join say?**

<details>
<summary>Answer</summary>

Which rows of the two tables belong together. Usually it compares a foreign key with the primary key it points to, as in `ON s.player_id = p.id`.

</details>

**2. A player has no solves. Does she appear in `players p JOIN solves s`? In `players p LEFT JOIN solves s`?**

<details>
<summary>Answer</summary>

Not in the INNER join, because she has no matching row. In the LEFT join she appears once, with NULL in every column that comes from `solves`.

</details>

**3. Why does a LEFT-joined scoreboard use `count(s.id)` and not `count(*)`?**

<details>
<summary>Answer</summary>

`count(*)` counts rows, and a player with no solves still has one row, full of NULLs. `count(s.id)` counts only values that are not NULL, so it gives 0 for that player.

</details>

**4. `FROM players, solves` with no condition returns 168 rows. Why that number?**

<details>
<summary>Answer</summary>

Without a condition, every one of the 8 players is paired with every one of the 21 solves: 8 times 21 is 168. That is a cross join.

</details>

**5. What does `ambiguous column name: id` mean, and how do you fix it?**

<details>
<summary>Answer</summary>

Both joined tables have a column called `id`, and the query did not say which one. Prefix it with the table name or alias, for example `p.id`.

</details>

## Common mistakes

- **Forgetting the join condition.** Two tables with no `ON` give every possible pair. If a result is suspiciously large, check the `ON`.
- **Using an INNER join for a report that must list everyone.** Rows without a partner disappear without a warning. Ask "must every row of this table appear?", and if yes, start from that table with a `LEFT JOIN`.
- **Testing the right table in `WHERE` after a LEFT join.** `WHERE s.category = 'crypto'` removes the NULL rows the LEFT join kept, and it becomes an INNER join in disguise. Put such conditions in the `ON`.
- **Grouping by a name instead of an id.** Two different people with the same name end up in one group. Group by the primary key.
- **Joining on the wrong columns.** `ON s.id = p.id` runs without an error but matches solve 1 with player 1, solve 2 with player 2, and so on, which means nothing. Join the foreign key to the key it points to.

## Key terms

- **Join**: a query that combines rows from two tables, matching them with a condition.
- **Inner join**: a join that keeps only the rows that have a match in both tables. `JOIN` alone means an inner join.
- **Left join**: a join that keeps every row of the left table and fills the columns of the right table with NULL when there is no match.
- **Alias**: a short name for a table or a column inside one query, such as `p` for `players`.
- **Cross join**: a join with no condition, which pairs every row of one table with every row of the other.

## Go further

- [SQLite: SELECT](https://www.sqlite.org/lang_select.html): the section "Determination of input data" explains every kind of join SQLite supports.
- [SQLite: core functions](https://www.sqlite.org/lang_corefunc.html): `coalesce` and the other built-in functions, each with a short explanation.
- [PostgreSQL tutorial: joins between tables](https://www.postgresql.org/docs/current/tutorial-join.html): the same ideas in another database, with a clear step-by-step example.
