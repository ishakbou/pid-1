---
title: "Cheat sheet: Incident response steps"
description: The six steps of incident response on one printable page, with the commands of Module 13 for baselines, logs, evidence, backups and the defense scripts.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## The rule

Only test systems you own or have written permission to test. Drills run on your own machine; password guessing only against your own `mylab` on `localhost`.

## The six steps

| Step | Goal | Example from the drill |
|---|---|---|
| 1. Prepare | Be ready before it happens | Baselines, logs, tested backups, a plan, a `note` function |
| 2. Detect | Confirm it, find its size, keep evidence | Read the alert, look for related changes, copy and hash |
| 3. Contain | Stop it from getting worse | `pkill -f name`, remove the stranger's key, cut the network |
| 4. Remove | Delete what was left, close the way back | Remove the cron entry and the hidden file, fix the hole |
| 5. Recover | Back to normal, safely | Check against the baseline, restore from backup, watch closely |
| 6. Learn | Change something concrete | Report: timeline, cause, actions, owners, dates |

Order: evidence before cleaning, contain before removing. Write every action down with the time.

## Baselines and drills

| Command | What it does |
|---|---|
| `ss -tlnH \| tr -s ' ' \| sort > baseline.txt` | Save the listening ports in a comparable form |
| `diff baseline.txt now.txt` | Show only what changed (`>` = new line) |
| `diff a b && echo "Back to the baseline."` | Print the message only when nothing changed |
| `sudo ss -tlnp \| grep 8081` | Which program listens on a port |
| `cut -d: -f1 /etc/passwd > users-before.txt` | Baseline of the accounts |
| `cut -d' ' -f3 ~/.ssh/authorized_keys` | The comment of each allowed key |
| `crontab -l` | List your scheduled tasks |
| `pgrep -af text`, `pgrep -c -f text` | Find matching processes, count them |
| `crontab -l \| grep -v text \| crontab -` | Remove one scheduled task, keep the rest |
| `sed -i '/text/d' file` | Delete every line containing the text |
| `note() { echo "$(date -u '+%F %T') $*" >> notes.txt; }` | Timestamped notes during a response |

## Evidence

| Command | What it does |
|---|---|
| `cp file ~/ir/evidence/` | Copy before you change anything (rename hidden files without the dot) |
| `sha256sum * > ../SHA256SUMS` | Record a hash of each copy |
| `sha256sum -c ../SHA256SUMS` | Check the copies: `OK` or `FAILED` |

## Logs

| Log it | Never log it |
|---|---|
| Logins that worked and failed, logouts | Passwords, even wrong ones |
| Refused requests, admin actions, deletions | Session cookies, tokens, keys |
| Errors and crashes | Card numbers, private messages |

A good line answers: when (with time zone), what, who, from where, result. Levels: `DEBUG` < `INFO` < `WARNING` < `ERROR` < `CRITICAL`.

| Command | What it does |
|---|---|
| `json.dumps(record)` | One event per line; line breaks in values become `\n` (no log injection) |
| `jq -r 'select(.event == "login_failed") \| .ip' security.log` | Addresses of failed logins |
| `jq -c 'del(.time)' security.log` | Print events without one field |
| `jq -r '.event' security.log \| sort \| uniq -c` | Count events by type |
| `tail -f file` | Watch a file as it grows (Ctrl+C to stop) |
| `timeout 5 tail -n 0 -f file` | Only new lines, stop after 5 seconds |

## SIEM

Collect, normalize (same fields, times in UTC), store, search, correlate, alert. A detection rule is a saved search that runs again and again.

| Command | What it does |
|---|---|
| `sqlite3 -table events.db "SELECT ..."` | Search the event table, drawn as a table |
| `sqlite3 -table events.db < rules/rule.sql` | Run a saved rule |
| `WHERE ip IN (SELECT ip ... GROUP BY ip HAVING COUNT(*) >= 5)` | A subquery: addresses with 5 or more matches |

## Backups

3 copies, 2 devices, 1 off-site, and one offline. RPO: how much data you can lose. RTO: how long a restore may take. Not a backup: a copy on the same disk, a sync, a git repository, a snapshot on the same host.

| Command | What it does |
|---|---|
| `sqlite3 db ".backup copy.db"` | Consistent copy of a database in use (works both ways) |
| `sqlite3 copy.db "PRAGMA integrity_check"` | `ok` if the copy is sound |
| `tar -czf name.tar.gz --exclude=x folder` | Make a compressed archive |
| `tar -tzf name.tar.gz` | List what is inside |
| `tar -xzf name.tar.gz -C restore-test` | Extract somewhere safe for a restore test |
| `diff -r original restored` | Prints nothing when the folders match |
| `rsync -a --delete src/ mirror/` | Mirror a folder: copies deletions too |
| `umask 077` | New files and folders private to you |

## Defense scripts

| Command | What it does |
|---|---|
| `python3 failed_logins.py auth.log` | Failed logins by address and user, `ALERT` at 5 |
| `python3 integrity.py baseline FOLDER base.json` | Record the hash of every file |
| `python3 integrity.py check FOLDER base.json` | `CHANGED`, `NEW`, `MISSING`, or `no changes` |
| `python3 watch_log.py FILE [SECONDS]` | Follow a log, print matching lines |
| `python3 tools/watch_logins.py [--minutes M] [--limit N]` | `mylab`: bursts of failed logins, and a login right after one |
| `scripts/backup.sh [DESTINATION]` | `mylab`: safe, private, checked backup |
| `echo "${PIPESTATUS[0]}"` | Exit status of the first command of the last pipe |

Exit status `0` means nothing found, `1` means an alert. Cron line: `minute hour day month weekday command`, for example `*/5 * * * * cd $HOME/mylab && .venv/bin/python tools/watch_logins.py >> logs/alerts.log`.
