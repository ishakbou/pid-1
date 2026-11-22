---
title: SIEM concepts
description: See how a SIEM collects logs from many machines, turns them into one format, stores them for searching and runs rules that raise alerts, by building a tiny one with Python and SQLite.
lesson: "13.3"
time: 25 min
sidebar:
  order: 3
---

An address on the internet tries five passwords on your SSH server and gets in on the sixth. Two minutes later, the same address logs in to your web app and deletes a note. The SSH server saw five failures and one success: normal enough for a busy day. The web app saw one good login. Neither machine saw an attack. Only someone who reads both logs, side by side, sees the whole story.

## Goal

After this lesson you can:

- Explain what a SIEM does: collect, normalize, store, search, correlate and alert.
- Turn logs in three different formats into one table of events.
- Write a detection rule as a saved search, and run it to raise an alert.

## Why it matters

A company has hundreds of machines, and each one writes its own logs in its own format. Nobody can read them all, and an attacker who gets root on one machine can delete its logs. A SIEM solves both problems: the logs leave each machine as they are written, and one place can search all of them at once. It is the main tool of a SOC, so a first job in defense usually means working inside one.

## The idea

A **SIEM** (security information and event management) is a system that collects logs from many sources, stores them in one place, lets analysts search them, and runs rules that turn suspicious patterns into alerts. Well-known ones include Splunk, Microsoft Sentinel, Elastic Security and the open-source Wazuh. They look different, but they all do the same six jobs:

| Job | What happens | In this lesson |
|---|---|---|
| Collect | A small program on each machine, a **log forwarder**, sends each new line to the SIEM | Three sample files |
| Normalize | Each format is read and turned into the same fields: time, host, event, user, IP | `normalize.py` |
| Store | Events are kept in a database built for fast search, often for months | An SQLite table |
| Search | Analysts ask questions across all sources at once | SQL queries |
| Correlate | Rules connect events from different sources or times | A saved query |
| Alert | When a rule matches, someone is told, with a severity | The rule's output |

The hard part is the second job. One machine writes `Nov 22 10:01:31` with no year and no time zone, another writes `22/Nov/2026:10:00:01 +0000`, a third writes JSON. To compare them you first have to agree on one name for each field and one way to write a time. That is **normalization** in the SIEM sense: bringing every source into one standard form. It is not the same thing as normalizing tables in database design, even though the word is the same.

Think of a newsroom that receives reports from correspondents in many countries, each in their own language and with their own way of writing dates. Before the editors can build one timeline, every report is translated into one language with one date format. A SIEM is that translation desk, plus a very fast archive.

A **detection rule** is a saved search that runs again and again, for example every minute, and raises an **alert** when it finds something. Rules that connect several events are called **correlation** rules: "five failed logins from one address, then a success from the same address" is one. A rule that fires too often trains people to ignore it, so every rule is a trade-off between missing attacks and drowning in false positives (lesson 9.6).

## Try it

You build a SIEM in miniature on your own machine. The three log files stand in for three machines: a web server, an SSH server and the `mylab` app. All addresses are from the ranges reserved for examples, so none of them belongs to anybody.

### 1. Collect the logs from three machines

```bash
mkdir -p ~/minisiem/logs ~/minisiem/rules
cd ~/minisiem
```

```text title="logs/web01-access.log"
192.0.2.10 - - [22/Nov/2026:09:58:12 +0000] "GET / HTTP/1.1" 200 1043
198.51.100.7 - - [22/Nov/2026:10:00:01 +0000] "GET /.env HTTP/1.1" 404 153
198.51.100.7 - - [22/Nov/2026:10:00:02 +0000] "GET /admin HTTP/1.1" 404 153
198.51.100.7 - - [22/Nov/2026:10:00:02 +0000] "GET /backup.zip HTTP/1.1" 404 153
```

```text title="logs/ssh01-auth.log"
Nov 22 10:01:05 ssh01 sshd[811]: Failed password for alex from 198.51.100.7 port 51234 ssh2
Nov 22 10:01:09 ssh01 sshd[811]: Failed password for alex from 198.51.100.7 port 51234 ssh2
Nov 22 10:01:14 ssh01 sshd[813]: Failed password for alex from 198.51.100.7 port 51240 ssh2
Nov 22 10:01:20 ssh01 sshd[815]: Failed password for sam from 198.51.100.7 port 51244 ssh2
Nov 22 10:01:26 ssh01 sshd[815]: Failed password for sam from 198.51.100.7 port 51244 ssh2
Nov 22 10:01:31 ssh01 sshd[817]: Accepted password for alex from 198.51.100.7 port 51250 ssh2
Nov 22 10:02:44 ssh01 sshd[820]: Accepted publickey for sam from 192.0.2.10 port 40112 ssh2
```

```text title="logs/app01-security.log"
{"time": "2026-11-22T10:03:02+00:00", "level": "INFO", "event": "login_ok", "user": "alex", "ip": "198.51.100.7"}
{"time": "2026-11-22T10:03:40+00:00", "level": "INFO", "event": "note_deleted", "user": "alex", "ip": "198.51.100.7"}
{"time": "2026-11-22T10:05:10+00:00", "level": "INFO", "event": "login_ok", "user": "sam", "ip": "192.0.2.10"}
```

The first is the access log format of your log analyzer from lesson 3.11, the second is the SSH format from lesson 11.4, the third is the JSON Lines format from lesson 13.2. In a real SIEM, a forwarder on each machine would send these lines over the network as they are written. Here, copying them into one folder plays that part.

### 2. Normalize them into one table

```python title="normalize.py"
"""Read three log formats and store every line as one event in events.db."""
import json
import sqlite3
from datetime import datetime, timezone

YEAR = 2026  # the SSH log has no year; this one is assumed


def web_events(path):
    for line in open(path, encoding="utf-8"):
        parts = line.split()
        when = datetime.strptime(parts[3][1:] + " " + parts[4][:-1], "%d/%b/%Y:%H:%M:%S %z")
        yield when, "web01", "http_" + parts[8], "-", parts[0], parts[6]


def ssh_events(path):
    for line in open(path, encoding="utf-8"):
        parts = line.split()
        when = datetime.strptime(f"{YEAR} {parts[0]} {parts[1]} {parts[2]}", "%Y %b %d %H:%M:%S")
        when = when.replace(tzinfo=timezone.utc)  # the server runs in UTC
        event = "login_ok" if parts[5] == "Accepted" else "login_failed"
        yield when, parts[3], event, parts[8], parts[10], "ssh " + parts[6]


def app_events(path):
    for line in open(path, encoding="utf-8"):
        e = json.loads(line)
        yield datetime.fromisoformat(e["time"]), "app01", e["event"], e["user"], e["ip"], "app"


con = sqlite3.connect("events.db")
con.execute("DROP TABLE IF EXISTS events")
con.execute("CREATE TABLE events (time TEXT, host TEXT, event TEXT, user TEXT, ip TEXT, detail TEXT)")
for reader, path in [
    (web_events, "logs/web01-access.log"),
    (ssh_events, "logs/ssh01-auth.log"),
    (app_events, "logs/app01-security.log"),
]:
    for when, host, event, user, ip, detail in reader(path):
        con.execute(
            "INSERT INTO events VALUES (?, ?, ?, ?, ?, ?)",
            (when.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"), host, event, user, ip, detail),
        )
con.commit()
print(con.execute("SELECT COUNT(*) FROM events").fetchone()[0], "events stored")
```

Each reader reads one format and hands back the same six fields for every line. `yield` works like `return`, but the function does not end: it hands back one value, and continues from the same place when the `for` loop asks for the next one. A function with `yield` is called a **generator**, and it lets you read a huge log one line at a time instead of loading all of it. `split()` cuts a line at its spaces, so `parts[0]` is the first word, and the reader picks the words it needs by position. Every time is turned into UTC and written the same way, so that times from different machines sort correctly as plain text.

```bash
python3 normalize.py
```

```output
14 events stored
```

Fourteen lines from three formats are now fourteen rows with the same columns.

### 3. Search all machines at once

```bash
sqlite3 -table events.db "SELECT host, event, COUNT(*) AS n FROM events GROUP BY host, event"
```

```output
+-------+--------------+---+
| host  |    event     | n |
+-------+--------------+---+
| app01 | login_ok     | 2 |
| app01 | note_deleted | 1 |
| ssh01 | login_failed | 5 |
| ssh01 | login_ok     | 2 |
| web01 | http_200     | 1 |
| web01 | http_404     | 3 |
+-------+--------------+---+
```

`-table` asks `sqlite3` to draw a table, as your `.sqliterc` from Module 7 does. This is the kind of summary a SIEM dashboard shows: how many events of each type, from each machine. Five failed logins on `ssh01` stand out, but on their own they could be a user who forgot a password.

### 4. Follow one address across every machine

```bash
sqlite3 -table events.db "SELECT time, host, event, user, detail FROM events WHERE ip = '198.51.100.7' ORDER BY time"
```

```output
+---------------------+-------+--------------+------+--------------+
|        time         | host  |    event     | user |    detail    |
+---------------------+-------+--------------+------+--------------+
| 2026-11-22 10:00:01 | web01 | http_404     | -    | /.env        |
| 2026-11-22 10:00:02 | web01 | http_404     | -    | /admin       |
| 2026-11-22 10:00:02 | web01 | http_404     | -    | /backup.zip  |
| 2026-11-22 10:01:05 | ssh01 | login_failed | alex | ssh password |
| 2026-11-22 10:01:09 | ssh01 | login_failed | alex | ssh password |
| 2026-11-22 10:01:14 | ssh01 | login_failed | alex | ssh password |
| 2026-11-22 10:01:20 | ssh01 | login_failed | sam  | ssh password |
| 2026-11-22 10:01:26 | ssh01 | login_failed | sam  | ssh password |
| 2026-11-22 10:01:31 | ssh01 | login_ok     | alex | ssh password |
| 2026-11-22 10:03:02 | app01 | login_ok     | alex | app          |
| 2026-11-22 10:03:40 | app01 | note_deleted | alex | app          |
+---------------------+-------+--------------+------+--------------+
```

Now the story is plain. The address looked for secret files on the web server, guessed passwords on the SSH server until one worked, and then used alex's account on the app. No single machine could tell you this. One search over normalized events does. Putting events from many sources in time order like this is called building a **timeline**, and you will do it again in the next lesson.

### 5. Write a detection rule

Searching by hand works once you suspect something. A rule watches for you:

```sql title="rules/success_after_failures.sql"
-- Alert: a successful login from an address that failed to log in 5 times or more.
-- Severity: high. Someone may have guessed a password.
SELECT time, host, user, ip
FROM events
WHERE event = 'login_ok'
  AND ip IN (
    SELECT ip FROM events
    WHERE event = 'login_failed'
    GROUP BY ip
    HAVING COUNT(*) >= 5
  )
ORDER BY time;
```

The query in brackets is a **subquery**: SQLite runs it first, and it returns the addresses with at least five failed logins. The outer query then keeps the successful logins from those addresses. `HAVING` filters groups after `GROUP BY` has counted them, as `WHERE` filters rows.

### 6. Run the rule

```bash
sqlite3 -table events.db < rules/success_after_failures.sql
```

```output
+---------------------+-------+------+--------------+
|        time         | host  | user |      ip      |
+---------------------+-------+------+--------------+
| 2026-11-22 10:01:31 | ssh01 | alex | 198.51.100.7 |
| 2026-11-22 10:03:02 | app01 | alex | 198.51.100.7 |
+---------------------+-------+------+--------------+
```

Two rows: an alert. A real SIEM would run this every minute over the newest events, and send each match to the analysts' queue with its severity. Notice that the rule counted failures on `ssh01` but also caught the login on `app01`. That is correlation: the rule connected two machines because they share one field, `ip`.

Notice also what it did not catch: sam's logins from `192.0.2.10`. A good rule stays quiet about normal use.

## Exercise

Write a second rule, `rules/scanner.sql`: find every address that got 3 or more `http_404` answers from the web server, and show how many events that address has on each host. Run it.

Then think: should this rule be `high` like the first one?

<details>
<summary>Show the solution</summary>

```sql title="rules/scanner.sql"
-- Alert: an address that asked for 3 or more pages that do not exist.
-- Severity: low on its own. Raise it if the same address shows up elsewhere.
SELECT ip, host, COUNT(*) AS events
FROM events
WHERE ip IN (
    SELECT ip FROM events
    WHERE event = 'http_404'
    GROUP BY ip
    HAVING COUNT(*) >= 3
  )
GROUP BY ip, host
ORDER BY ip, host;
```

```bash
sqlite3 -table events.db < rules/scanner.sql
```

```output
+--------------+-------+--------+
|      ip      | host  | events |
+--------------+-------+--------+
| 198.51.100.7 | app01 | 2      |
| 198.51.100.7 | ssh01 | 6      |
| 198.51.100.7 | web01 | 3      |
+--------------+-------+--------+
```

On the internet, scanners ask for files like `/.env` all day long, so a scanner on its own is usually low severity: worth counting, not worth waking someone up. What makes this one serious is the other two rows: the same address also touched `ssh01` and `app01`. A rule that only looked at the web server would have missed that.

</details>

## Check yourself

**1. Name the six jobs of a SIEM, in order.**

<details>
<summary>Answer</summary>

Collect, normalize, store, search, correlate, alert.

</details>

**2. Why does a SIEM keep logs on a separate machine instead of reading them where they were written?**

<details>
<summary>Answer</summary>

So that all sources can be searched in one place, and so that an attacker who gets root on one machine cannot delete the copies that were already sent away.

</details>

**3. The SSH log writes `Nov 22 10:01:31`. What two pieces of information is it missing, and how did `normalize.py` deal with that?**

<details>
<summary>Answer</summary>

The year and the time zone. The script assumed the year 2026 and UTC, because that is how the server runs. A real SIEM has to make the same kind of assumption, or receive full times from the forwarder.

</details>

**4. What makes the rule in step 5 a correlation rule?**

<details>
<summary>Answer</summary>

It connects events of different kinds, failed logins and a successful login, and here from different machines too, through a shared field: the IP address.

</details>

**5. A rule raises 300 alerts a day and almost all are harmless. Why is that a problem, even though it misses nothing?**

<details>
<summary>Answer</summary>

People stop reading alerts that are almost always false positives, so the one real alert gets ignored too. The rule needs a better threshold or more conditions.

</details>

## Common mistakes

- **Mixing time zones.** If one source writes local time and another UTC, the timeline is wrong by hours and the rules connect the wrong events. Convert everything to UTC when you normalize.
- **Using different names for the same field.** `ip`, `src_ip` and `client` in three sources means three searches. Agree on one name per field.
- **Collecting everything and reading nothing.** Storage is cheap, attention is not. Start with a few sources that matter (logins, admin actions, errors) and rules for them.
- **Trusting a parser that splits by position.** `normalize.py` reads the wrong words from an SSH line such as `Failed password for invalid user bob from ...`, which has two more words: it would store `invalid` as the user and `bob` as the address. Real SIEMs use tested parsers, and count the lines they could not read.
- **Writing a rule and never testing it.** Feed it a sample attack and a sample of normal use, as you did here, and check that it fires on the first and stays quiet on the second.

## Key terms

- **SIEM (security information and event management)**: a system that collects logs from many sources in one place, makes them searchable and raises alerts from rules.
- **Log forwarder**: a small program on a machine that sends each new log line to a central system.
- **Detection rule**: a saved search that runs again and again and raises an alert when it finds a match.
- **Alert**: a message that a rule matched, sent to people with a severity, so that someone looks.
- **Correlation**: connecting events from different sources or times through shared fields, such as an IP address or a username.
- **Timeline**: events from one or more sources put in time order, to see what happened step by step.
- **Generator**: a Python function that uses `yield` to hand back values one at a time, as a loop asks for them.
- **Subquery**: an SQL query inside another query, whose result the outer query uses.

## Go further

- [NIST SP 800-92: Guide to Computer Security Log Management](https://csrc.nist.gov/pubs/sp/800/92/final): the classic guide to collecting, storing and analyzing logs in an organization.
- [Wazuh documentation](https://documentation.wazuh.com/current/getting-started/index.html): a free, open-source SIEM. Its getting-started pages show the same parts as this lesson in a real product.
- [SQLite: SELECT](https://www.sqlite.org/lang_select.html): the official reference for the queries in this lesson, including `GROUP BY`, `HAVING` and subqueries.
