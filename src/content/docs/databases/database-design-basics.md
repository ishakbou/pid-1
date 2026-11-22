---
title: Database design basics
description: Spot repeated data and the problems it causes, then split it into well-shaped tables with the right keys, which is what normalization means in plain words.
lesson: "7.6"
time: 25 min
sidebar:
  order: 6
---

Count how many times the word `Warmup` is stored in `season.db`: seven, once for every player who solved it, each copy with its own `misc` and its own `50`. Nothing has gone wrong yet. But the day someone changes the points of `Warmup`, there are seven places to change, and one of them will be forgotten. This lesson is about shaping tables so that cannot happen.

## Goal

After this lesson you can:

- Recognize repeated data in a table and name the problems it causes.
- Split a table into tables that each store one kind of thing, linked by keys.
- Model a many-to-many relationship with a junction table and a composite primary key.

## Why it matters

Fixing a bad design after an app is live means rewriting tables full of real data while users keep adding more. A good design, by contrast, makes whole classes of bugs impossible: the database refuses a double entry or a broken link before your code even sees it. The same skill makes you a better reviewer of other people's apps, because many data leaks start with a design where private and public facts are mixed in one table.

## The idea

The `solves` table from lesson 7.3 stores two kinds of facts in each row: facts about the solve (who, when) and facts about the challenge (its category and its points). The challenge facts are repeated in every solve of that challenge. Repeated data is called **redundancy**, and it causes three kinds of trouble, called **anomalies**:

| Anomaly | What goes wrong in `solves` |
|---|---|
| Update anomaly | Change the points of `Warmup` in six rows out of seven, and the database now holds two different answers to "what is Warmup worth?" |
| Insertion anomaly | A new challenge cannot be added until somebody solves it, because every row needs a player. |
| Deletion anomaly | Delete the only solve of `Login bypass`, and the club forgets that the challenge exists at all. |

The cure is to give each kind of thing its own table and store each fact exactly once. Splitting tables this way is called **normalization**. Textbooks describe it with a series of "normal forms", but the core fits in one plain rule: every column in a table must be a fact about that table's key, the whole key, and nothing else. The points belong to the challenge, not to the solve, so they move to a `challenges` table.

Think of a school timetable. The office does not write the teacher's phone number on every lesson in the timetable. It keeps one staff list with each phone number once, and the timetable says only which teacher. When a number changes, one line changes.

After the split, the club has three tables:

<figure class="diagram">
<svg viewBox="0 0 640 200" role="img" aria-labelledby="nf-title nf-desc">
<title id="nf-title">Players and challenges linked through solves</title>
<desc id="nf-desc">Three tables side by side. On the left, players with id, name and country. On the right, challenges with id, title, category and points. In the middle, solves with player_id, challenge_id and solved_at. The pair player_id and challenge_id is the primary key of solves. An arrow goes from player_id to the id of players, and another from challenge_id to the id of challenges.</desc>
<rect class="d-box" x="10" y="40" width="170" height="120"/>
<path class="d-line" d="M10 72 H180"/>
<text x="95" y="61">players</text>
<text x="95" y="97">id</text>
<text x="95" y="122">name</text>
<text x="95" y="147">country</text>
<rect class="d-box d-hot" x="235" y="30" width="170" height="140"/>
<path class="d-line" d="M235 62 H405"/>
<text x="320" y="51">solves</text>
<text x="320" y="87">player_id</text>
<text x="320" y="112">challenge_id</text>
<text x="320" y="137">solved_at</text>
<text x="320" y="161">key: first two</text>
<rect class="d-box" x="460" y="30" width="170" height="140"/>
<path class="d-line" d="M460 62 H630"/>
<text x="545" y="51">challenges</text>
<text x="545" y="87">id</text>
<text x="545" y="112">title</text>
<text x="545" y="137">category</text>
<text x="545" y="161">points</text>
<path class="d-line d-hot" d="M235 82 H210 V92 H182 M192 87 L182 92 L192 97 M405 107 H430 V82 H458 M448 77 L458 82 L448 87"/>
</svg>
<figcaption><code>solves</code> now holds only what belongs to a solve. Each challenge fact is stored once, in <code>challenges</code>.</figcaption>
</figure>

A player solves many challenges, and a challenge is solved by many players. That is a **many-to-many** relationship, and no single foreign key can hold it. The middle table, called a **junction table**, holds it: one row per pair. Its primary key is the pair of columns `(player_id, challenge_id)`, a **composite primary key**, so the same player cannot solve the same challenge twice.

## Try it

This lesson uses `~/season/season.db` from lesson 7.3, with the `~/.sqliterc` settings from lesson 7.1. If you no longer have the database, rebuild it from `season.sql` as in step 1 of lesson 7.3.

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
rm -f season.db club.db messy.db
sqlite3 season.db < season.sql
cd ~
-->

### 1. Measure the repetition

```bash
cd ~/season
sqlite3 season.db "SELECT challenge, category, points, count(*) AS copies FROM solves GROUP BY challenge, category, points ORDER BY copies DESC;"
```

```output
+--------------+----------+--------+--------+
|  challenge   | category | points | copies |
+--------------+----------+--------+--------+
| Warmup       | misc     | 50     | 7      |
| Hidden file  | linux    | 100    | 3      |
| Base64 soup  | crypto   | 100    | 2      |
| Caesar salad | crypto   | 150    | 2      |
| Cookie jar   | web      | 200    | 2      |
| Lost packet  | network  | 150    | 2      |
| Root me      | linux    | 400    | 2      |
| Login bypass | web      | 300    | 1      |
+--------------+----------+--------+--------+
```

`GROUP BY` with three columns makes one group per combination. Each line is one challenge, and `copies` says how often its category and points are stored. 21 rows hold only 8 different challenges.

### 2. Cause an update anomaly

Work on a copy. The club raises `Warmup` to 75 points, but the person doing it skips one row:

```bash
cp season.db messy.db
sqlite3 messy.db "UPDATE solves SET points = 75 WHERE challenge = 'Warmup' AND player_id <> 8;"
sqlite3 messy.db "SELECT DISTINCT challenge, points FROM solves WHERE challenge = 'Warmup';"
```

```output
+-----------+--------+
| challenge | points |
+-----------+--------+
| Warmup    | 75     |
| Warmup    | 50     |
+-----------+--------+
```

The database now gives two answers to one question, and nothing tells you which is right. Hana's score is wrong, silently. In real life the skipped row comes from a typo in a `WHERE`, a program that crashed halfway, or two people editing at the same time.

### 3. Hit the insertion anomaly

The club writes a new challenge, `Packet storm`, worth 250 points. Nobody has solved it yet:

```bash
sqlite3 messy.db "INSERT INTO solves (challenge, category, points, solved_at) VALUES ('Packet storm', 'network', 250, '2026-11-10 00:00');"
```

```output
Error: stepping, NOT NULL constraint failed: solves.player_id (19)
```

There is nowhere to put a challenge on its own. The only way would be a fake solve by a fake player, which would show up in every scoreboard. The table shape is the problem, not the data.

```bash
rm messy.db
```

### 4. Write the new design

Create `normalize.sql` in `~/season`:

```sql title="normalize.sql"
PRAGMA foreign_keys = ON;

CREATE TABLE challenges (
    id       INTEGER PRIMARY KEY,
    title    TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    points   INTEGER NOT NULL CHECK (points > 0)
);

CREATE TABLE new_solves (
    player_id    INTEGER NOT NULL REFERENCES players(id),
    challenge_id INTEGER NOT NULL REFERENCES challenges(id),
    solved_at    TEXT NOT NULL,
    PRIMARY KEY (player_id, challenge_id)
);

INSERT INTO challenges (title, category, points)
    SELECT DISTINCT challenge, category, points FROM solves ORDER BY points, challenge;

INSERT INTO new_solves (player_id, challenge_id, solved_at)
    SELECT s.player_id, c.id, s.solved_at
    FROM solves s JOIN challenges c ON c.title = s.challenge;

DROP TABLE solves;
ALTER TABLE new_solves RENAME TO solves;
```

New pieces, one by one:

- `UNIQUE` means no two rows may have the same `title`. You cannot create a second `Warmup` by accident.
- `CHECK (points > 0)` is a constraint with your own test. The database rejects any row where it is false.
- `PRIMARY KEY (player_id, challenge_id)` is the composite key: the pair must be unique, so each player can solve each challenge only once.
- `INSERT INTO ... SELECT` fills a table with the result of a query instead of with `VALUES`. The first one copies each distinct challenge once. The second one uses a join from lesson 7.4 to look up each challenge's new `id` by its title.
- `DROP TABLE` deletes a table and all its rows. `ALTER TABLE ... RENAME TO` gives the new table the old name.

Changing the shape of a database that already holds data, like this, is called a **migration**.

### 5. Run the migration on a copy

```bash
cp season.db club.db
sqlite3 club.db < normalize.sql
sqlite3 club.db ".tables"
sqlite3 club.db "SELECT * FROM challenges;"
```

```output
challenges  players     solves
+----+--------------+----------+--------+
| id |    title     | category | points |
+----+--------------+----------+--------+
| 1  | Warmup       | misc     | 50     |
| 2  | Base64 soup  | crypto   | 100    |
| 3  | Hidden file  | linux    | 100    |
| 4  | Caesar salad | crypto   | 150    |
| 5  | Lost packet  | network  | 150    |
| 6  | Cookie jar   | web      | 200    |
| 7  | Login bypass | web      | 300    |
| 8  | Root me      | linux    | 400    |
+----+--------------+----------+--------+
```

Eight challenges, each stored once. A real migration always runs on a copy or a backup first: if anything goes wrong, `season.db` is still there.

```bash
sqlite3 club.db "SELECT * FROM solves LIMIT 3;"
```

```output
+-----------+--------------+------------------+
| player_id | challenge_id |    solved_at     |
+-----------+--------------+------------------+
| 1         | 1            | 2026-11-02 09:12 |
| 1         | 3            | 2026-11-02 09:40 |
| 1         | 6            | 2026-11-03 20:15 |
+-----------+--------------+------------------+
```

A solve is now three small facts: who, which challenge, when.

### 6. Check that nothing was lost

The scoreboard needs three tables now, so the query joins twice:

```bash
sqlite3 club.db "SELECT p.name, count(*) AS solved, sum(c.points) AS total FROM players p JOIN solves s ON s.player_id = p.id JOIN challenges c ON c.id = s.challenge_id GROUP BY p.id ORDER BY total DESC;"
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

The same totals as in lesson 7.4. Each `JOIN` adds one more table to the rows: first every solve gets its player, then its challenge.

### 7. Watch the anomalies disappear

Change the points of `Warmup` once, in one row:

```bash
sqlite3 club.db "UPDATE challenges SET points = 75 WHERE title = 'Warmup';"
sqlite3 club.db "SELECT p.name, sum(c.points) AS total FROM players p JOIN solves s ON s.player_id = p.id JOIN challenges c ON c.id = s.challenge_id GROUP BY p.id ORDER BY total DESC LIMIT 3;"
```

```output
+-------+-------+
| name  | total |
+-------+-------+
| Amira | 1075  |
| Chen  | 725   |
| Farah | 425   |
+-------+-------+
```

Every player with a `Warmup` solve gained 25 points at once. There is only one place to change, so there is nothing to forget.

Add the new challenge that nobody has solved:

```bash
sqlite3 club.db "INSERT INTO challenges (title, category, points) VALUES ('Packet storm', 'network', 250);"
sqlite3 club.db "SELECT * FROM challenges WHERE category = 'network';"
```

```output
+----+--------------+----------+--------+
| id |    title     | category | points |
+----+--------------+----------+--------+
| 5  | Lost packet  | network  | 150    |
| 9  | Packet storm | network  | 250    |
+----+--------------+----------+--------+
```

And let the new constraints do their job:

```bash
sqlite3 club.db "INSERT INTO solves VALUES (1, 1, '2026-11-10 08:00');"
sqlite3 club.db "INSERT INTO challenges (title, category, points) VALUES ('Free points', 'misc', 0);"
sqlite3 club.db "INSERT INTO challenges (title, category, points) VALUES ('Warmup', 'misc', 50);"
```

```output
Error: stepping, UNIQUE constraint failed: solves.player_id, solves.challenge_id (19)
Error: stepping, CHECK constraint failed: points > 0 (19)
Error: stepping, UNIQUE constraint failed: challenges.title (19)
```

Amira tried to solve challenge 1 a second time, a challenge with 0 points was refused by the `CHECK`, and a second `Warmup` was refused by `UNIQUE`. Each rule that lives in the schema is a bug that no program using this database can make.

:::tip[Do not store what you can compute]
It is tempting to add a `total` column to `players`. Do not: it is redundancy again, and it goes stale the moment a solve is added. Compute totals with a query when you need them. Only store a computed value when the query really is too slow, and then make one place responsible for keeping it right.
:::

## Exercise

The club now has teams. One team has many players, and each player is in at most one team.

1. In `club.db`, create a `teams` table with an `id` and a unique `name`.
2. Add a column `team_id` to `players` that points to `teams`. Use `ALTER TABLE players ADD COLUMN team_id INTEGER REFERENCES teams(id);`.
3. Create the teams `Oran Owls` and `Lyon Lynx`. Put Amira and Farah in the first one, and Ben and Dana in the second.
4. Show the total points per team, highest first.

<details>
<summary>Show the solution</summary>

```bash
cd ~/season
sqlite3 club.db "CREATE TABLE teams (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);"
sqlite3 club.db "ALTER TABLE players ADD COLUMN team_id INTEGER REFERENCES teams(id);"
sqlite3 club.db "INSERT INTO teams (name) VALUES ('Oran Owls'), ('Lyon Lynx');"
sqlite3 club.db "UPDATE players SET team_id = 1 WHERE id IN (1, 6);"
sqlite3 club.db "UPDATE players SET team_id = 2 WHERE id IN (2, 4);"
sqlite3 club.db "SELECT t.name, sum(c.points) AS total FROM teams t JOIN players p ON p.team_id = t.id JOIN solves s ON s.player_id = p.id JOIN challenges c ON c.id = s.challenge_id GROUP BY t.id ORDER BY total DESC;"
```

```output
+-----------+-------+
|   name    | total |
+-----------+-------+
| Oran Owls | 1500  |
| Lyon Lynx | 450   |
+-----------+-------+
```

The totals already use the 75-point `Warmup` from step 7. This is a one-to-many relationship, like players and solves in lesson 7.1, so a foreign key in `players` is enough. A junction table would only be needed if a player could be in several teams at once. Players without a team have NULL in `team_id`, and the inner join leaves them out of the team board.

</details>

## Check yourself

**1. What is redundancy, and which three problems can it cause?**

<details>
<summary>Answer</summary>

The same fact stored in more than one place. It can cause update anomalies (some copies changed, others not), insertion anomalies (a fact cannot be stored without an unrelated one) and deletion anomalies (deleting one fact also loses another).

</details>

**2. Why are the points of a challenge stored in `challenges` and not in `solves`?**

<details>
<summary>Answer</summary>

The points are a fact about the challenge, not about one solve. Stored in `challenges`, they exist exactly once, and every solve reaches them through `challenge_id`.

</details>

**3. What is a junction table, and when do you need one?**

<details>
<summary>Answer</summary>

A table whose rows each link one row of one table with one row of another, such as `solves` linking a player and a challenge. You need it for a many-to-many relationship, which a single foreign key cannot hold.

</details>

**4. What does `PRIMARY KEY (player_id, challenge_id)` forbid?**

<details>
<summary>Answer</summary>

Two rows with the same pair of values. The same player cannot have two solves of the same challenge. One player can still have many solves, and one challenge can still be solved by many players.

</details>

**5. Why run a migration on a copy first?**

<details>
<summary>Answer</summary>

A migration changes the shape of tables that hold real data, and some steps, such as `DROP TABLE`, cannot be undone once they are saved. On a copy, a mistake costs nothing: you delete the copy and try again.

</details>

## Common mistakes

- **One big table "because it is simpler".** It is simpler for a week. Then the copies drift apart. Give every kind of thing its own table.
- **Lists inside one column.** A column like `solved = 'Warmup,Root me'` cannot be joined, indexed or counted properly. One fact per row: that is what the junction table is for.
- **Splitting too far.** A country code does not need its own table with one column. Split when a thing has facts of its own, such as a challenge with a category and points.
- **Storing totals and counts.** They go stale. Compute them with a query.
- **Leaving rules to the program only.** "Our code never inserts a duplicate" holds until a second program or a bug comes along. Put the rule in the schema with `UNIQUE`, `CHECK`, `NOT NULL` and keys.

## Key terms

- **Redundancy**: the same fact stored in more than one place.
- **Anomaly**: a problem caused by redundancy when data is updated, inserted or deleted.
- **Normalization**: splitting tables so that each fact is stored once and every column is a fact about its table's key.
- **Many-to-many**: a relationship where rows on both sides can have many partners, such as players and challenges.
- **Junction table**: a table that holds a many-to-many relationship, one row per linked pair.
- **Composite primary key**: a primary key made of more than one column. The combination must be unique.
- **Migration**: a change to the structure of a database that already holds data.

## Go further

- [PostgreSQL tutorial: foreign keys](https://www.postgresql.org/docs/current/tutorial-fk.html): a short official example of the same idea, with cities and weather records.
- [SQLite: ALTER TABLE](https://www.sqlite.org/lang_altertable.html): what SQLite can change in an existing table, and the safe recipe for changes it cannot do directly.
- [SQLite: CREATE TABLE](https://www.sqlite.org/lang_createtable.html): the sections on `UNIQUE`, `CHECK` and composite primary keys.
