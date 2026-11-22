---
title: "Module 7: Databases & SQL"
description: Store data in tables linked by keys, ask questions of it with SQL, make big queries fast with indexes, and use a database safely from Python.
module: 7
sidebar:
  order: 0
  label: Overview
---

Behind almost every app sits a database: the accounts, the messages, the orders, the logs. In this module you build small databases of your own with SQLite, fill them with a CTF club's scores and a few hundred thousand login attempts, and learn to ask them questions in SQL. At the end, `mylab` gets a real database for the notes app you build in Module 8.

## What you will learn

- What a relational database is: tables, rows and columns, linked by primary and foreign keys.
- How to read and change data with `SELECT`, `INSERT`, `UPDATE` and `DELETE`, and undo a change with a transaction.
- How to filter, sort, limit, count and group rows with `WHERE`, `ORDER BY`, `LIMIT` and `GROUP BY`.
- How to combine tables with joins, and when an INNER join silently drops rows that a LEFT join keeps.
- Why some queries are slow, how to read a query plan, and what an index costs.
- How to split data into tables so that each fact is stored once.
- How to use SQLite from Python with placeholders, and why building SQL from strings leads to SQL injection.

## Before you start

You need the terminal from [Module 1](../linux/): moving around, installing packages with apt, redirection and pipes. Lessons 7.5, 7.7 and 7.8 use Python, so [Module 3](../python/) should be behind you: functions, files, `sys.argv`, and `try` and `except`. The project step continues the `mylab` repository and builds on the web server from the [Module 6 project step](../networking/project/).

Everything runs on your own machine, in Ubuntu (on WSL, in Codespaces or installed). You need an internet connection once, to install the `sqlite3` tool.

## Time

8 lessons, about 3 hours of reading and practice.

## Module map

```mindmap
Databases & SQL
  Structure
    tables and rows
    primary keys
    foreign keys
    constraints
  Reading data
    SELECT
    WHERE and ORDER BY
    GROUP BY
    joins
  Changing data
    INSERT and UPDATE
    DELETE
    transactions
  Good shape
    normalization
    junction tables
    indexes
  From code
    sqlite3 module
    placeholders
    mylab database
```

## Lessons

1. 7.1 [Tables and relations](../databases/tables-and-relations/): what a relational database is: rows, columns, primary keys and foreign keys.
2. 7.2 [SELECT, INSERT, UPDATE, DELETE](../databases/select-insert-update-delete/): the four statements that read and change data, practiced in SQLite.
3. 7.3 [Filtering and sorting](../databases/filtering-and-sorting/): WHERE, ORDER BY and LIMIT, and counting with GROUP BY.
4. 7.4 [Joins](../databases/joins/): combine rows from two tables, and tell an INNER join from a LEFT join.
5. 7.5 [Indexes](../databases/indexes/): why some queries are slow, and how an index fixes that.
6. 7.6 [Database design basics](../databases/database-design-basics/): split data into tables without repeating it (normalization, in plain words).
7. 7.7 [Using a database from Python](../databases/using-a-database-from-python/): query SQLite with the sqlite3 module, passing values the safe way.
8. 7.8 [Project step: a database for mylab](../databases/project/): give mylab a SQLite database for notes and users.

## Project step

`mylab` gets the place where its data will live. You write `app/schema.sql` with two tables, `users` and `notes`, linked by a foreign key that deletes a user's notes along with the user. Then you write `app/db.py`, a small module with one function per job (create the database, add a user, add a note, list a user's notes), every query using placeholders. The database itself, `data/mylab.db`, stays out of git, and the passwords in it are plain text on purpose for now: Module 10 replaces them with safe hashes, and Module 8 builds the web app on top of these functions.

## Cheat sheet

Everything from this module on one page: [Cheat sheet: SQL](../databases/cheat-sheet/).
