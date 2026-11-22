---
title: Logging and monitoring
description: Decide what an application should log and what it must never log, write log lines with Python's logging module, make them structured with JSON, and watch them as they arrive.
lesson: "13.2"
time: 20 min
sidebar:
  order: 2
---

<!-- lab: run
sudo apt-get install -y -q jq > /dev/null 2>&1
-->

Last Tuesday, someone guessed a password on your app and got in. Today you want to know when it happened, from which address, and what they did next. Your app's log says `error` four times and nothing else. In lesson 11.4 you read the logs that Linux writes for you. This lesson is about the logs that you write yourself, so that on the day you need them, they answer the question.

## Goal

After this lesson you can:

- Decide which events an application should log, and which data must never go into a log.
- Write log lines with Python's `logging` module, at the right level.
- Write structured logs in JSON, search them with `jq`, and watch them as they arrive.

## Why it matters

The operating system logs logins to the machine, but it knows nothing about the logins to your app, the notes a user deleted or the page that refused access. Only the app can log those. OWASP's Top 10 (lesson 12.1) has a whole category for logging and alerting failures, A09, for a reason: in many real breaches the evidence was never written down, or it was written and nobody looked. A log nobody watches only helps after the damage is done.

## The idea

A useful log line answers five questions: **when** (a full date and time, with the time zone), **what** happened, **who** did it (the username or user id), **from where** (the IP address), and **with what result** (success or failure). If one of them is missing, you will miss it at the worst moment.

Each line also gets a **log level**, a label for how serious it is. Python uses five: `DEBUG` for details only a developer needs, `INFO` for normal events, `WARNING` for something unusual, `ERROR` for something that failed, and `CRITICAL` for something that stops the program. A program set to `INFO` keeps `INFO` and everything above it, and throws `DEBUG` away.

What to log, for security:

| Log it | Never log it |
|---|---|
| Logins that worked and logins that failed | Passwords, even wrong ones |
| Logouts, password changes | Session cookies and tokens |
| Requests refused for lack of rights | Secret keys, API keys |
| Admin actions, deleted data | Full card numbers, ID numbers |
| Errors and crashes | The full text of private notes or messages |

A wrong password is often the user's real password with one typo, or their password for another site. A log is read by many people and copied to many places, so treat it as semi-public.

A log is like the logbook on a ship. Every entry has the time, the position and what happened, written the same way each time. A sailor who writes "rough day" is no help to the captain who reads it a year later.

**Monitoring** means that someone, or more often something, reads the log while it is being written and reacts when a line, or a number of lines, crosses a limit. Logging writes the evidence; monitoring notices it.

## Try it

The outputs come from a lab machine with the user `sam`. Your times will differ, so most steps cut the time away before they compare. `jq` may not be installed yet: `sudo apt install jq` adds it.

### 1. Write a small login logger

```bash
mkdir -p ~/logdemo
cd ~/logdemo
```

```python title="textlog.py"
"""Pretend to check a login, and log the result as a line of text."""
import logging
import sys

logging.basicConfig(
    filename="app.log",
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S%z",
    level=logging.INFO,
)

username, password, ip = sys.argv[1], sys.argv[2], sys.argv[3]
logging.debug("checking the password of %s", username)
if password == "test-pass-1":
    logging.info("login ok user=%s ip=%s", username, ip)
else:
    logging.warning("login failed user=%s ip=%s", username, ip)
```

`logging.basicConfig` sets up logging once: which file, what each line looks like, and the lowest level to keep. In `format`, `%(asctime)s` is the time, `%(levelname)s` the level and `%(message)s` your text. In `datefmt`, `%z` adds the time zone, such as `+0000` for UTC. The `%s` in each message is filled with the values after it.

### 2. Log three logins and read them

```bash
python3 textlog.py sam test-pass-1 192.0.2.10
python3 textlog.py sam guess1 198.51.100.7
python3 textlog.py sam guess2 198.51.100.7
```

<!-- lab: nocheck -->
```bash
cat app.log
```

```output
2026-11-22T17:25:51+0000 INFO login ok user=sam ip=192.0.2.10
2026-11-22T17:25:51+0000 WARNING login failed user=sam ip=198.51.100.7
2026-11-22T17:25:52+0000 WARNING login failed user=sam ip=198.51.100.7
```

Each line answers the five questions: when, what, who, from where, and the result. The wrong passwords `guess1` and `guess2` are not in the file, and neither is the `DEBUG` line: the level is `INFO`, so `DEBUG` is thrown away. On a busy server, that keeps the log small.

### 3. Count by level

```bash
cut -d' ' -f2 app.log | sort | uniq -c
```

```output
      1 INFO
      2 WARNING
```

The level is the second field, so counting it takes one pipe. Two warnings in a second from the same address is already worth a look.

### 4. Forge a line

Logs are only useful if you can trust them. Watch what happens when a username contains a line break. In Bash, `$'...'` turns `\n` into a real line break:

```bash
python3 textlog.py $'kim ip=198.51.100.7\n2026-11-22T09:00:00+0000 INFO login ok user=admin' nope 198.51.100.7
grep "user=admin" app.log
```

```output
2026-11-22T09:00:00+0000 INFO login ok user=admin ip=198.51.100.7
```

The login failed, but the log now holds a line that says `admin` logged in successfully, at a time the attacker chose. The real line just before it reads `login failed user=kim ip=198.51.100.7`, so nothing looks wrong. This is **log injection**: putting a line break or other control characters into a value so that it creates fake log lines. It can hide an attack, or blame somebody else for it.

### 5. Write structured logs instead

A **structured log** stores each event as named fields instead of free text, so that a program can read it without guessing. The most common form is **JSON Lines**: one JSON object (lesson 8.5) per line.

```python title="jsonlog.py"
"""Pretend to check a login, and log the result as one line of JSON."""
import json
import logging
import sys
from datetime import datetime, timezone

logging.basicConfig(filename="security.log", format="%(message)s", level=logging.INFO)


def log_event(level, event, **fields):
    """Write one event as a JSON object on one line."""
    record = {
        "time": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "level": logging.getLevelName(level),
        "event": event,
        **fields,
    }
    logging.log(level, json.dumps(record))


username, password, ip = sys.argv[1], sys.argv[2], sys.argv[3]
if password == "test-pass-1":
    log_event(logging.INFO, "login_ok", user=username, ip=ip)
else:
    log_event(logging.WARNING, "login_failed", user=username, ip=ip)
```

`**fields` collects any named arguments into a dictionary, so `log_event(..., user="sam", ip="...")` adds the fields `user` and `ip`. `json.dumps` turns the dictionary into one line of JSON text. Try the same attack again:

```bash
python3 jsonlog.py sam guess1 198.51.100.7
python3 jsonlog.py $'kim\n{"event": "login_ok", "user": "admin"}' nope 198.51.100.7
wc -l security.log
```

```output
2 security.log
```

<!-- lab: nocheck -->
```bash
tail -n 1 security.log
```

```output
{"time": "2026-11-22T17:25:55+00:00", "level": "WARNING", "event": "login_failed", "user": "kim\n{\"event\": \"login_ok\", \"user\": \"admin\"}", "ip": "198.51.100.7"}
```

Two attempts, two lines. `json.dumps` writes the line break as the two characters `\n` and puts a backslash before each quote, so the whole forged text stays inside the `user` field, where it looks exactly as suspicious as it is.

### 6. Search the log with jq

`jq` is a command-line tool that reads JSON and picks out fields:

```bash
python3 jsonlog.py sam test-pass-1 192.0.2.10
python3 jsonlog.py alex guess 198.51.100.7
jq -r 'select(.event == "login_failed") | .ip' security.log | sort | uniq -c
```

```output
      3 198.51.100.7
```

`select(...)` keeps only the events whose `event` field is `login_failed`, and `.ip` prints their address. `-r` prints plain text without quotes. Three failed logins from one address, under three different usernames: that is a pattern, and nobody had to write a parser for it.

```bash
jq -c 'del(.time)' security.log | tail -n 2
```

```output
{"level":"INFO","event":"login_ok","user":"sam","ip":"192.0.2.10"}
{"level":"WARNING","event":"login_failed","user":"alex","ip":"198.51.100.7"}
```

`del(.time)` removes a field from what is printed, and `-c` prints each object on one line. The file itself is not changed.

### 7. Watch the log as it grows

`tail -f` ("follow") prints new lines as they are added to a file, and keeps waiting for more until you press Ctrl+C. Here a background command adds a line after one second, and `timeout 5` stops `tail` after five seconds, so the step ends by itself:

```bash
(sleep 1; python3 jsonlog.py kim guess 203.0.113.9) &
timeout 5 tail -n 0 -f security.log | jq -r '.event + " " + .user + " " + .ip'
```

```output
login_failed kim 203.0.113.9
```

`-n 0` starts with no old lines, so you see only what arrives. In a real terminal, run `tail -f security.log` in a second window while you use your app, and leave out `timeout`. This is monitoring in its smallest form: a person watching a stream of events. The next lessons hand that job to a program.

## Exercise

A teammate adds `log_event(logging.INFO, "password_changed", user=username, password=new_password)` to the app. Change `log_event` in `jsonlog.py` so that a field called `password` or `token` is never written: its value becomes `[removed]`. Test it with a short Python file that imports nothing from `jsonlog.py`; copy the new function into it.

<details>
<summary>Show the solution</summary>

```python title="redact.py"
import json
import logging
from datetime import datetime, timezone

logging.basicConfig(filename="redact.log", format="%(message)s", level=logging.INFO)
SECRET_FIELDS = {"password", "token"}


def log_event(level, event, **fields):
    """Write one event as a JSON object on one line, without secrets."""
    for name in fields:
        if name in SECRET_FIELDS:
            fields[name] = "[removed]"
    record = {
        "time": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "level": logging.getLevelName(level),
        "event": event,
        **fields,
    }
    logging.log(level, json.dumps(record))


log_event(logging.INFO, "password_changed", user="sam", password="new-secret-9")
```

```bash
python3 redact.py
jq -c 'del(.time)' redact.log
```

```output
{"level":"INFO","event":"password_changed","user":"sam","password":"[removed]"}
```

The loop changes the values in place; changing a value while you loop over a dictionary's keys is allowed, only adding or removing keys is not. The best fix is still to never pass the password, but a safety net in the one function that every log line goes through catches the mistake that a review missed.

</details>

## Check yourself

**1. Which five questions should a security log line answer?**

<details>
<summary>Answer</summary>

When (date, time and time zone), what happened, who did it, from where (the IP address), and with what result.

</details>

**2. Why should a log never contain a wrong password?**

<details>
<summary>Answer</summary>

A wrong password is often the right password with a typo, or the user's password for another site. Logs are read and copied by many people, so the password would leak.

</details>

**3. The program's level is `WARNING`. Which of `DEBUG`, `INFO`, `WARNING` and `ERROR` lines are kept?**

<details>
<summary>Answer</summary>

`WARNING` and `ERROR`. A level keeps itself and everything more serious, and throws the rest away.

</details>

**4. How did the attacker create a fake line in `app.log`, and why did the same trick fail on `security.log`?**

<details>
<summary>Answer</summary>

They put a line break into the username, so the text log got a second line written by them. `json.dumps` writes a line break inside a value as the two characters `\n`, so each event stays on one line and the forged text stays inside the `user` field.

</details>

**5. What is the difference between logging and monitoring?**

<details>
<summary>Answer</summary>

Logging writes events down. Monitoring reads them as they arrive and reacts when something crosses a limit. Without monitoring, a log only helps after the damage is done.

</details>

## Common mistakes

- **Logging only errors.** A successful login from a strange address is not an error, but it can be the most important line of the day. Log the security events in the table, whether they worked or not.
- **Times without a time zone.** `09:00` from a server in UTC and `09:00` from a laptop in Algiers are an hour apart. Write the zone, or use UTC everywhere, as `jsonlog.py` does.
- **Building log lines with f-strings from user input in a text format.** Any line break the user types becomes a new line. Use structured logs, or at least replace line breaks before you log.
- **Putting the log where the web server serves files.** A log in a public folder is a gift to an attacker. Keep logs outside the files your app sends to browsers.
- **Leaving `DEBUG` on in production.** Debug lines can hold private data and make the log huge. Use `INFO` for normal running.

## Key terms

- **Log level**: a label for how serious a log line is, such as `DEBUG`, `INFO`, `WARNING`, `ERROR` or `CRITICAL`.
- **Log injection**: putting line breaks or control characters into a value so that it creates fake lines in a log.
- **Structured log**: a log that stores each event as named fields instead of free text, so that programs can read it reliably.
- **JSON Lines**: a file format with one JSON object on each line, common for structured logs.
- **Monitoring**: reading logs or measurements as they arrive and reacting when something crosses a limit.

## Go further

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html): which events to log, which data to leave out, and how to protect the log itself.
- [Python: Logging HOWTO](https://docs.python.org/3/howto/logging.html): the official guide to the `logging` module, from the basic setup used here to handlers and formatters.
- [jq manual](https://jqlang.org/manual/): every filter `jq` knows, with small examples you can try.
