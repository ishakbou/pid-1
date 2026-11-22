---
title: Indexes
description: See why a query on a big table is slow, read the query plan, and make the same query fast with an index, at a small price.
lesson: "7.5"
time: 20 min
sidebar:
  order: 5
---

Open a thick book and look for every page that mentions "SQLite". Without help you read all of it, page after page. With the index at the back you jump to one line, read three page numbers, and you are done. Databases face the same choice for every query, and in this lesson you watch one make it.

## Goal

After this lesson you can:

- Explain what a full table scan is and why it gets slow as a table grows.
- Read a query plan with `EXPLAIN QUERY PLAN`.
- Create an index, check that the database uses it, and say what it costs.

## Why it matters

A query that takes 2 milliseconds on your test data can take 20 seconds once the table holds a few million rows, and a slow page is often just a missing index. It matters for security too. A login page that searches the users table slowly can be made to fall over by sending it many requests, and an analyst searching a big log table during an incident needs answers in seconds, not in minutes.

## The idea

Without help, the database answers `WHERE username = 'user4242'` the only way it can: it reads every row of the table and tests each one. This is called a **full table scan**. Twice as many rows means twice as much work. In the terms of Module 4, a scan is O(n).

An **index** is an extra structure, kept by the database next to the table, that holds the values of one column in sorted order, each with a pointer to its row. Because it is sorted, the database can find a value in a few steps, the way you find a word in a dictionary without reading every page: open in the middle, go left or right, repeat. SQLite stores its indexes as a **B-tree**, a sorted tree built for disks, and a lookup costs O(log n). For a million rows that is about 20 steps instead of a million.

The book analogy fits well, including its costs:

| | Book | Database |
|---|---|---|
| The index | sorted words at the back, with page numbers | sorted column values, with row pointers |
| What it speeds up | finding a word | `WHERE`, `ORDER BY` and joins on that column |
| What it costs | extra pages | extra disk space |
| When the text changes | the index must be redone | every `INSERT`, `UPDATE` and `DELETE` also updates the index |

So you do not index every column. You index the columns that your queries search, sort or join on, especially in big tables.

You have used one index already without knowing it: the primary key. Looking up a row by its `INTEGER PRIMARY KEY` is always fast in SQLite, and every `UNIQUE` column gets an index automatically, because the database needs one to check that a new value is not taken.

## Try it

You need `sqlite3` and the `~/.sqliterc` settings from lesson 7.1, and Python 3 from Module 3.

<!-- lab: run
sudo apt-get install -y -q sqlite3 > /dev/null 2>&1
printf '.headers on\n.mode table\n' > ~/.sqliterc
-->

### 1. Make a big table

Ten rows are always fast. To see a difference you need a lot of data, so you generate 300,000 made-up login attempts with Python. Make a folder:

```bash
mkdir ~/logins
cd ~/logins
```

Create `make_logins.py` with this content:

```python title="make_logins.py"
"""Write logins.csv: 300,000 made-up login attempts, the same on every run."""
import random
from datetime import datetime, timedelta

random.seed(7)  # the same "random" data every time
start = datetime(2026, 11, 1)

with open("logins.csv", "w") as f:
    for i in range(1, 300_001):
        user = f"user{random.randint(1, 20_000)}"
        ip = f"10.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"
        ok = 0 if random.random() < 0.1 else 1  # about 1 in 10 attempts fails
        at = start + timedelta(seconds=2 * i)
        f.write(f"{i},{user},{ip},{ok},{at:%Y-%m-%d %H:%M:%S}\n")

print("wrote 300000 rows to logins.csv")
```

```bash
python3 make_logins.py
head -n 3 logins.csv
```

```output
wrote 300000 rows to logins.csv
1,user10612,10.77.202.167,0,2026-11-01 00:00:02
2,user17560,10.48.187.150,0,2026-11-01 00:00:04
3,user16628,10.109.19.23,1,2026-11-01 00:00:06
```

Each line is one attempt: an id, a username out of 20,000, an IP address, `1` for a success or `0` for a failure, and a time, two seconds after the one before. `random.seed(7)` makes the "random" numbers the same on every run, so your file matches the one in this lesson. This is the CSV format from lesson 3.5: one record per line, the values separated by commas.

### 2. Load it into SQLite

```bash
sqlite3 logins.db "CREATE TABLE logins (id INTEGER PRIMARY KEY, username TEXT NOT NULL, ip TEXT NOT NULL, ok INTEGER NOT NULL, at TEXT NOT NULL);"
sqlite3 logins.db ".import --csv logins.csv logins"
sqlite3 logins.db "SELECT count(*) FROM logins;"
ls -l logins.db
```

```output
+----------+
| count(*) |
+----------+
| 300000   |
+----------+
-rw-r--r-- 1 sam sam 15794176 Nov 21 21:48 logins.db
```

`.import --csv` is a `sqlite3` dot command that reads a CSV file into an existing table, one row per line, the values in the order of the columns. Remember the size of the file for later.

### 3. Time a search

A defender wants to know how often one account failed to log in. Create `query.sql`:

```sql title="query.sql"
.timer on
SELECT count(*) AS failures FROM logins WHERE username = 'user4242' AND ok = 0;
```

`.timer on` makes `sqlite3` print how long each statement took. It only works when the commands come from a file or from standard input, which is why this query lives in a file.

<!-- lab: nocheck -->
```bash
sqlite3 logins.db < query.sql
```

```output
+----------+
| failures |
+----------+
| 2        |
+----------+
Run Time: real 0.479 user 0.380952 sys 0.099450
```

`user4242` failed to log in twice. `real` is the time that passed on the clock: almost half a second for one small question. `user` and `sys` split the work the processor did between `sqlite3` itself and the Linux kernel, which read the file. Your numbers will be different: they depend on your computer, and they change a little on every run.

### 4. Ask the database how it did it

```bash
sqlite3 logins.db "EXPLAIN QUERY PLAN SELECT count(*) FROM logins WHERE username = 'user4242' AND ok = 0;"
```

```output
QUERY PLAN
`--SCAN logins
```

`EXPLAIN QUERY PLAN` in front of a query does not run it. It shows the **query plan**: the steps the database chose to answer it. `SCAN logins` means a full table scan: all 300,000 rows were read to find a handful.

### 5. Create an index

```bash
sqlite3 logins.db "CREATE INDEX idx_logins_username ON logins (username);"
sqlite3 logins.db ".indexes logins"
```

```output
idx_logins_username
```

`CREATE INDEX name ON table (column)` builds the index. The name can be anything; `idx_table_column` is a common habit that tells you later what it is for. Building it reads the whole table once, so on a very big table it takes a while. After that, the database keeps it up to date by itself.

### 6. Run the same query again

```bash
sqlite3 logins.db "EXPLAIN QUERY PLAN SELECT count(*) FROM logins WHERE username = 'user4242' AND ok = 0;"
```

```output
QUERY PLAN
`--SEARCH logins USING INDEX idx_logins_username (username=?)
```

`SEARCH ... USING INDEX` means the database found the matching usernames in the index, followed the pointers to those few rows, and checked `ok` only there. You did not change the query at all. The database saw the new index and chose it.

<!-- lab: nocheck -->
```bash
sqlite3 logins.db < query.sql
```

```output
+----------+
| failures |
+----------+
| 2        |
+----------+
Run Time: real 0.006 user 0.003076 sys 0.002794
```

Same answer, 6 milliseconds instead of almost 500: about 80 times faster. With ten times more rows the scan would take about ten times longer, while the index lookup would barely change.

### 7. See the price

```bash
ls -l logins.db
```

```output
-rw-r--r-- 1 sam sam 21028864 Nov 21 21:49 logins.db
```

In step 2 the file had about 15.8 million bytes. Now it has about 21 million. The index lives inside the same database file, and it made the file a third bigger. To see where the space goes:

```bash
sqlite3 logins.db "SELECT name, sum(pgsize) / 1024 AS kib FROM dbstat GROUP BY name;"
```

```output
+---------------------+-------+
|        name         |  kib  |
+---------------------+-------+
| idx_logins_username | 5112  |
| logins              | 15420 |
| sqlite_schema       | 4     |
+---------------------+-------+
```

`dbstat` is a special table of SQLite with one row for every page of the database file: which table or index the page belongs to, and its size in bytes in `pgsize`. The query adds the sizes up per name and divides by 1024, which gives kibibytes. `sqlite_schema` is SQLite's own small table, where it keeps your `CREATE` statements. The index is a real copy of every username, sorted, with a pointer to each row. Every new login attempt now writes to two places: the table and the index.

### 8. When an index cannot help

```bash
sqlite3 logins.db "EXPLAIN QUERY PLAN SELECT count(*) FROM logins WHERE username LIKE '%4242';"
```

```output
QUERY PLAN
`--SCAN logins USING COVERING INDEX idx_logins_username
```

Back to `SCAN`. The index is sorted by the beginning of each username, just as a dictionary is sorted by the first letters. "Ends with 4242" could be anywhere in that order, so the database has to test all 300,000 entries. `USING COVERING INDEX` only means that it reads them from the index instead of the table, because the index already holds every column this query needs, and it is smaller. It is still a scan.

A surprise: in SQLite, even a "starts with" pattern such as `LIKE 'user42%'` scans like this, because `LIKE` ignores capital letters and a plain index does not. For a "starts with" search, write a range instead, which the sorted index can answer:

```bash
sqlite3 logins.db "EXPLAIN QUERY PLAN SELECT count(*) FROM logins WHERE username >= 'user42' AND username < 'user43';"
```

```output
QUERY PLAN
`--SEARCH logins USING COVERING INDEX idx_logins_username (username>? AND username<?)
```

Every username that starts with `user42` sorts between `user42` and `user43`, so the database jumps to the first one and reads until the last. This is why lesson 7.3 called `solved_at >= '2026-11-02' AND solved_at < '2026-11-03'` the faster choice on a big table, compared with a `LIKE` on dates.

The same scan happens when the query searches a column that has no index:

```bash
sqlite3 logins.db "EXPLAIN QUERY PLAN SELECT count(*) FROM logins WHERE ip = '10.1.2.3';"
```

```output
QUERY PLAN
`--SCAN logins
```

And this one needs no index of yours at all:

```bash
sqlite3 logins.db "EXPLAIN QUERY PLAN SELECT * FROM logins WHERE id = 150000;"
```

```output
QUERY PLAN
`--SEARCH logins USING INTEGER PRIMARY KEY (rowid=?)
```

The `INTEGER PRIMARY KEY` is the way SQLite stores the table in the first place, so a lookup by `id` is always a fast search.

## Exercise

Work in `~/logins`.

1. Write a query that counts the failed logins from the IP address `10.1.2.3`. Check its plan.
2. Add an index that makes it a `SEARCH`, and check the plan again.
3. Remove that index with `DROP INDEX name;`, and check that the plan is back to `SCAN`.

<details>
<summary>Show the solution</summary>

```bash
cd ~/logins
sqlite3 logins.db "EXPLAIN QUERY PLAN SELECT count(*) FROM logins WHERE ip = '10.1.2.3' AND ok = 0;"
```

```output
QUERY PLAN
`--SCAN logins
```

```bash
sqlite3 logins.db "CREATE INDEX idx_logins_ip ON logins (ip);"
sqlite3 logins.db "EXPLAIN QUERY PLAN SELECT count(*) FROM logins WHERE ip = '10.1.2.3' AND ok = 0;"
```

```output
QUERY PLAN
`--SEARCH logins USING INDEX idx_logins_ip (ip=?)
```

```bash
sqlite3 logins.db "DROP INDEX idx_logins_ip;"
sqlite3 logins.db "EXPLAIN QUERY PLAN SELECT count(*) FROM logins WHERE ip = '10.1.2.3' AND ok = 0;"
```

```output
QUERY PLAN
`--SCAN logins
```

Dropping an index never loses data: the rows are all still in the table. Only the shortcut is gone.

</details>

## Check yourself

**1. What is a full table scan, and when is it a problem?**

<details>
<summary>Answer</summary>

The database reads every row of the table and tests each one. It is fine for small tables and a problem for big ones, because the work grows with the number of rows.

</details>

**2. Why does an index make `WHERE username = '...'` fast?**

<details>
<summary>Answer</summary>

The index keeps the usernames sorted, each with a pointer to its row. In sorted data the database can find a value in a few steps, as in a dictionary, instead of reading the whole table.

</details>

**3. Why not put an index on every column?**

<details>
<summary>Answer</summary>

Every index takes disk space, and every `INSERT`, `UPDATE` and `DELETE` must update every index of the table. Indexes that no query uses only make writes slower.

</details>

**4. You add an index on `username`, but `WHERE username LIKE '%admin'` is still slow. Why?**

<details>
<summary>Answer</summary>

The index is sorted by the start of the value. A pattern that starts with `%` can match anywhere in that order, so the database has to scan the whole table.

</details>

**5. How can you tell whether a query uses an index?**

<details>
<summary>Answer</summary>

Put `EXPLAIN QUERY PLAN` in front of it. `SCAN` means a full table scan. `SEARCH ... USING INDEX` means an index is used.

</details>

## Common mistakes

- **Testing speed on ten rows.** Every query is fast on a tiny table. Judge with realistic amounts of data, or read the plan.
- **Guessing instead of looking.** Do not assume an index is used. `EXPLAIN QUERY PLAN` tells you.
- **Indexing everything "to be safe".** Each index slows down every write and fills the disk. Add one for a query that needs it, and drop the ones nothing uses.
- **Wrapping the column in a function.** `WHERE lower(username) = 'user4242'` cannot use a plain index on `username`, because the index holds the original values. Store the values in one consistent form instead, and compare them directly.
- **Forgetting that primary keys and `UNIQUE` columns are already indexed.** A second index on the same column only costs space.

## Key terms

- **Full table scan**: reading every row of a table to answer a query.
- **Index (database)**: an extra, sorted structure that holds the values of one or more columns with pointers to their rows, so the database can find rows without a scan.
- **B-tree**: the sorted tree structure that SQLite and most databases use to store tables and indexes on disk.
- **Query plan**: the steps a database chooses to answer a query. `EXPLAIN QUERY PLAN` shows it in SQLite.

## Go further

- [SQLite: EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html): how to read every line a query plan can contain.
- [SQLite: CREATE INDEX](https://www.sqlite.org/lang_createindex.html): the full syntax, including indexes on several columns and `UNIQUE` indexes.
- [SQLite: query planning](https://www.sqlite.org/queryplanner.html): an official, readable explanation of how tables and indexes are searched, with pictures.
