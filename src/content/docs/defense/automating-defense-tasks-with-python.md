---
title: Automating defense tasks with Python
description: Write three small Python tools that defenders use every day, one that reports failed logins, one that checks file integrity against a baseline and one that watches a log as it grows, and learn how to run them on a schedule.
lesson: "13.6"
time: 25 min
sidebar:
  order: 6
---

<!-- lab: run
rm -f ~/.ssh/drill.txt
-->

Some jobs in defense are the same every day: read the night's logins, check that nobody changed the important files, keep an eye on the log. A person who does them by hand gets bored, then careless, then skips a day. A script never gets bored. In this lesson you write three small tools that do those jobs, using only the Python you already know.

## Goal

After this lesson you can:

- Write a script that reads an SSH log, counts failed logins by address and user, and flags addresses over a limit.
- Write a file integrity checker that records a baseline of hashes and reports files that were changed, added or deleted.
- Write a log watcher that follows a file as it grows, and explain how to run your tools on a schedule.

## Why it matters

In lesson 13.4 the lesson learned was "alert when `authorized_keys` changes", and the drill showed what a planted key and a hidden program look like. Ideas like that only protect you once something checks them, every day, without fail. Small scripts like these are also how many defenders start automating their work, long before they touch a big SIEM, and they are good portfolio pieces: short, useful, and easy to explain in an interview.

## The idea

All three tools follow one pattern: **read** something, **compare** it with what you expect, and **report** only the difference. A report that says "nothing changed" in one line is a good report. A report of 200 lines that someone has to read every morning will soon stop being read.

| Tool | Reads | Compares with | Reports |
|---|---|---|---|
| `failed_logins.py` | An SSH log | A limit: 5 failures per address | Counts, and `ALERT` above the limit |
| `integrity.py` | Every file in a folder | A saved baseline of hashes | `CHANGED`, `NEW`, `MISSING` |
| `watch_log.py` | New lines of a log, as they arrive | A list of patterns | One line per match |

**File integrity monitoring** is the name for the second job: you record a hash of each important file, and later recompute the hashes to see which files changed. A hash changes completely when even one byte of the file changes (lesson 10.1), so you do not need to keep copies of the files, only their hashes. It is like the seal on a jar of jam: you cannot see inside, but you can see at once whether someone opened it.

Each tool also ends with an exit status (lesson 1.9): `0` when everything is as expected and `1` when it found something. Other programs, such as cron or a shell script, can then react without reading the text.

## Try it

The outputs come from a lab machine with the user `sam`.

### 1. Get a sample log

```bash
mkdir -p ~/defense
cd ~/defense
```

```text title="sample-auth.log"
Nov 22 10:01:05 ssh01 sshd[811]: Failed password for alex from 198.51.100.7 port 51234 ssh2
Nov 22 10:01:09 ssh01 sshd[811]: Failed password for alex from 198.51.100.7 port 51234 ssh2
Nov 22 10:01:14 ssh01 sshd[813]: Failed password for alex from 198.51.100.7 port 51240 ssh2
Nov 22 10:01:20 ssh01 sshd[815]: Failed password for invalid user admin from 198.51.100.7 port 51244 ssh2
Nov 22 10:01:26 ssh01 sshd[815]: Failed password for invalid user admin from 198.51.100.7 port 51244 ssh2
Nov 22 10:01:31 ssh01 sshd[817]: Failed password for sam from 198.51.100.7 port 51250 ssh2
Nov 22 10:01:40 ssh01 sshd[817]: Accepted password for alex from 198.51.100.7 port 51252 ssh2
Nov 22 10:02:44 ssh01 sshd[820]: Accepted publickey for sam from 192.0.2.10 port 40112 ssh2
Nov 22 11:15:02 ssh01 sshd[901]: Failed password for sam from 192.0.2.10 port 40220 ssh2
```

Nine lines in the format of `/var/log/auth.log` from lesson 11.4: six failures from one address, one of them for a user that does not exist, and one forgotten password from a known one.

### 2. Report the failed logins

```python title="failed_logins.py"
"""Count failed SSH logins in an auth log, by address and by user."""
import sys
from collections import Counter

LIMIT = 5  # failed logins from one address before it counts as an attack


def failed_logins(path):
    """Yield (user, ip) for each 'Failed password' line in the log."""
    with open(path, encoding="utf-8", errors="replace") as log:
        for line in log:
            if "Failed password for" not in line:
                continue
            words = line.split()
            i = words.index("from")           # ... for [invalid user] NAME from IP port N
            yield words[i - 1], words[i + 1]


def main(path):
    by_ip, by_user = Counter(), Counter()
    for user, ip in failed_logins(path):
        by_ip[ip] += 1
        by_user[user] += 1
    print("Failed logins by address:")
    for ip, n in by_ip.most_common():
        print(f"  {ip:<16}{n:>3}" + ("  ALERT" if n >= LIMIT else ""))
    print("Failed logins by user:")
    for user, n in by_user.most_common():
        print(f"  {user:<16}{n:>3}")
    return 1 if any(n >= LIMIT for n in by_ip.values()) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
```

Two details make it sturdier than the reader of lesson 13.3. It finds the word `from` and takes its neighbours, instead of counting positions from the start, so `Failed password for invalid user admin` gives the user `admin`, not `invalid`. And `errors="replace"` means a strange byte in the log cannot crash it: attackers sometimes send odd bytes as usernames.

In the f-strings, `:<16` pads the text to 16 characters on the left side and `:>3` pads the number to 3 characters on the right, so the columns line up.

```bash
python3 failed_logins.py sample-auth.log
echo "exit status: $?"
```

```output
Failed logins by address:
  198.51.100.7      6  ALERT
  192.0.2.10        1
Failed logins by user:
  alex              3
  admin             2
  sam               2
exit status: 1
```

`$?` holds the exit status of the last command, as in lesson 1.9. Six failures from one address raise an alert, and the exit status `1` says so to any program that runs the script. One failure from `192.0.2.10`, an address that also logged in with a key, is most likely sam with a typo.

### 3. Record a baseline of file hashes

```python title="integrity.py"
"""Save the SHA-256 hash of every file in a folder, and later report what changed.

Usage:  python3 integrity.py baseline FOLDER BASELINE.json
        python3 integrity.py check    FOLDER BASELINE.json
"""
import hashlib
import json
import sys
from pathlib import Path


def hashes(folder):
    """Return {path inside the folder: sha256} for every file under the folder."""
    result = {}
    for path in sorted(Path(folder).rglob("*")):
        if path.is_file():
            result[str(path.relative_to(folder))] = hashlib.sha256(path.read_bytes()).hexdigest()
    return result


def main(command, folder, baseline_file):
    current = hashes(folder)
    if command == "baseline":
        Path(baseline_file).write_text(json.dumps(current, indent=2))
        print(f"baseline saved: {len(current)} files")
        return 0
    saved = json.loads(Path(baseline_file).read_text())
    found = 0
    for name in sorted(saved.keys() | current.keys()):
        if name not in current:
            status = "MISSING"
        elif name not in saved:
            status = "NEW"
        elif saved[name] != current[name]:
            status = "CHANGED"
        else:
            continue
        print(f"{status:<8} {name}")
        found += 1
    if found == 0:
        print("no changes")
    return 1 if found else 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:4]))
```

`rglob("*")` walks through the folder and every folder inside it. `saved.keys() | current.keys()` is the union of two sets of names (lesson 3.4), so a file that exists in only one of them is still checked. Make a folder to protect, and record its baseline:

```bash
mkdir -p site/config
echo "<h1>Welcome</h1>" > site/index.html
echo "port = 5000" > site/config/app.conf
echo "admin = sam" > site/config/users.conf
python3 integrity.py baseline site site-baseline.json
```

```output
baseline saved: 3 files
```

The baseline file lives next to the folder, not inside it. Inside, it would hash itself, and every check would report it as changed.

### 4. Change things and check

```bash
echo "admin = sam, guest" > site/config/users.conf
echo "pretend web shell: harmless text" > site/shell.php
rm site/index.html
python3 integrity.py check site site-baseline.json
echo "exit status: $?"
```

```output
CHANGED  config/users.conf
MISSING  index.html
NEW      shell.php
exit status: 1
```

You played the intruder: one file changed, one deleted, one added. The added file stands for a **web shell**: a small file that an intruder puts on a web server so that they can run commands through it later. Here it holds only one line of harmless text; the checker does not care what is inside, only that the file is new. Each change gets one line, and nothing else is printed. Put the files back and check again:

```bash
echo "admin = sam" > site/config/users.conf
echo "<h1>Welcome</h1>" > site/index.html
rm site/shell.php
python3 integrity.py check site site-baseline.json
```

```output
no changes
```

Same content, same hashes: the check does not care about dates, only about bytes.

### 5. Watch a log as it grows

```python title="watch_log.py"
"""Follow a log file like tail -f, and print an alert for each line that matches.

Usage:  python3 watch_log.py LOGFILE [SECONDS]
"""
import sys
import time

PATTERNS = ["Failed password", "Invalid user", "Accepted password"]


def follow(path, seconds):
    """Yield each new line added to the file, until the time is up."""
    end = time.monotonic() + seconds
    with open(path, encoding="utf-8", errors="replace") as log:
        log.seek(0, 2)  # jump to the end: only new lines count
        while time.monotonic() < end:
            line = log.readline()
            if line:
                yield line.rstrip("\n")
            else:
                time.sleep(0.2)  # nothing new yet: wait a little


if __name__ == "__main__":
    seconds = float(sys.argv[2]) if len(sys.argv) > 2 else float("inf")
    for line in follow(sys.argv[1], seconds):
        if any(p in line for p in PATTERNS):
            print("ALERT:", line)
```

`Accepted password` is in the list because after the hardening of Module 11, SSH accepts keys only, so a password that works is worth a look. `seek(0, 2)` moves to the end of the file, so old lines are skipped. `readline()` returns an empty string when there is nothing new yet, and the loop sleeps for a fifth of a second before it asks again. Without a time limit, `float("inf")` makes it run until you press Ctrl+C. Test it with a short limit, while a background command adds three lines:

```bash
touch live.log
(sleep 2; tail -n 3 sample-auth.log >> live.log) &
python3 watch_log.py live.log 5
```

```output
ALERT: Nov 22 10:01:40 ssh01 sshd[817]: Accepted password for alex from 198.51.100.7 port 51252 ssh2
ALERT: Nov 22 11:15:02 ssh01 sshd[901]: Failed password for sam from 192.0.2.10 port 40220 ssh2
```

Three new lines, two alerts: sam's key login matches no pattern and stays quiet. The background command waits two seconds so that the watcher is already sitting at the end of the file when the lines arrive, and the watcher stops after five.

### 6. Run a tool on a schedule

A check only helps if it runs. Cron, from lesson 13.4, can run it for you. This line in `crontab -e` would check the folder every hour, at minute 0, and add any changes to a report file:

```text
0 * * * * cd $HOME/defense && python3 integrity.py check site site-baseline.json >> integrity-report.txt 2>&1
```

The five fields are minute, hour, day of the month, month and day of the week; `*` means "every". Cron runs with an almost empty environment and starts in your home folder, not in `~/defense`, which is why the line starts with `cd`. Its short default `PATH` (`/usr/bin:/bin`) still finds `python3`, which lives in `/usr/bin`.

## Exercise

Lesson 13.4 ended with the idea "alert when `authorized_keys` changes". Use `integrity.py` for it, and watch the whole `~/.ssh` folder:

1. Record a baseline of your `~/.ssh` folder in `~/defense/ssh-baseline.json`.
2. Create a harmless new file, `~/.ssh/drill.txt`, and run the check.
3. Delete the file and check again.

Then answer: an intruder who can change files in `~/.ssh` can probably change `ssh-baseline.json` too. What would make the check harder to fool?

<details>
<summary>Show the solution</summary>

<!-- lab: nocheck -->
```bash
cd ~/defense
python3 integrity.py baseline ~/.ssh ssh-baseline.json
```

```output
baseline saved: 2 files
```

Your number depends on what is in your `~/.ssh`: keys, `known_hosts`, `config`.

```bash
echo "drill" > ~/.ssh/drill.txt
python3 integrity.py check ~/.ssh ssh-baseline.json
rm ~/.ssh/drill.txt
python3 integrity.py check ~/.ssh ssh-baseline.json
```

```output
NEW      drill.txt
no changes
```

The baseline holds only hashes, never the content of your private keys, so it is safe to keep. To make the check harder to fool, keep the baseline where the intruder cannot change it: on another machine, on read-only storage, or owned by root. Professional tools such as AIDE work this way. Knowing that `ssh-baseline.json` itself changed is also a clue, so you could record its hash in a second place.

</details>

## Check yourself

**1. Why does `failed_logins.py` look for the word `from` instead of taking, say, the ninth word of each line?**

<details>
<summary>Answer</summary>

Lines do not all have the same shape. `Failed password for invalid user admin` has two more words than `Failed password for alex`, so a fixed position would read the wrong word. The username is always just before `from` and the address just after it.

</details>

**2. What does an exit status of `1` from these tools mean, and who uses it?**

<details>
<summary>Answer</summary>

That the tool found something: an address over the limit, or a changed file. Other programs, such as a shell script or cron, can read the status and react without reading the text.

</details>

**3. Why does file integrity monitoring store hashes instead of copies of the files?**

<details>
<summary>Answer</summary>

A hash is short and changes completely when even one byte changes, so it is enough to detect a change. It also does not reveal the content, which matters for private files such as keys.

</details>

**4. In `watch_log.py`, what would happen without `log.seek(0, 2)`?**

<details>
<summary>Answer</summary>

The watcher would start at the top and print an alert for every old matching line in the file, before it reached the new ones.

</details>

**5. Why did the cron line start with `cd $HOME/defense`?**

<details>
<summary>Answer</summary>

Cron runs commands with an almost empty environment and not in your project folder, so relative names like `site` and `integrity.py` would not be found otherwise.

</details>

## Common mistakes

- **Keeping the baseline inside the watched folder.** The baseline then changes itself and every check reports it. Keep it next to the folder, or better, on another machine.
- **Making a new baseline after every alert.** If you refresh the baseline without finding out why a file changed, you have just approved the intruder's change. Investigate first, then update the baseline on purpose.
- **Reporting everything.** A tool that prints every line it read trains you to stop reading. Print the differences and one summary line.
- **Forgetting that logs rotate.** Ubuntu renames `auth.log` to `auth.log.1` and starts a new file every week (log rotation, lesson 11.4). A watcher that keeps the old file open sees nothing new; tools like `tail -F` reopen the file by name.
- **Testing only on a good day.** Run each tool once against a planted problem, as you did here, to prove that it can raise an alert.

## Key terms

- **File integrity monitoring**: recording a hash of each important file and later comparing, to find files that were changed, added or deleted.
- **Web shell**: a small file that an intruder puts on a web server so that they can run commands through it later.

## Go further

- [Python: hashlib](https://docs.python.org/3/library/hashlib.html): the official documentation of the module that computes SHA-256 and other hashes.
- [Python: pathlib](https://docs.python.org/3/library/pathlib.html): paths, `rglob` and reading files, as used in `integrity.py`.
- [Ubuntu manual: crontab](https://manpages.ubuntu.com/manpages/noble/man5/crontab.5.html): how to write the five time fields of a scheduled task.
