---
title: "Module 13: Defense & Incident Response"
description: Learn how defenders notice an attack and handle it, with logs you write yourself, a small SIEM, an incident drill, backups you have tested, and Python tools that watch for you.
module: 13
sidebar:
  order: 0
  label: Overview
---

Module 11 hardened the machine and Module 12 fixed the app. But no defense is perfect, and this module is about the day something gets through. You learn to write logs that answer questions, to search the logs of many machines at once, to respond to an incident in the right order, and to get your data back. You finish by giving `mylab` a security log, an alert on password guessing, and a backup that checks itself.

## Ethics and law

Only test systems you own or have written permission to test. Every drill in this module runs on your own machine: the "attacks" are harmless changes that you make yourself and then find, and the password guessing in the project step targets your own `mylab` app on `localhost`. Lesson 9.1 explains the rules; read it again if you skipped it.

## What you will learn

- What blue, red and purple teams do, which jobs beginners start in, and why every defender keeps a baseline.
- What to log and what never to log, how to write structured logs in JSON, and how to watch them.
- How a SIEM collects, normalizes and searches logs from many machines, and how a detection rule becomes an alert.
- The six steps of incident response, practiced on a small drill with evidence, containment and a report.
- The 3-2-1 rule, safe database backups, and why a backup only counts once you have restored it.
- How to automate the daily checks with Python: failed logins, file integrity and log watching.

## Before you start

You need the terminal from [Module 1](../linux/), especially pipes, `grep`, processes and scripts, and Python from [Module 3](../python/), including `Counter`, files and `argparse`. Lesson 13.3 uses SQL from [Module 7](../databases/), and the project step uses the deque of [Module 4](../algorithms/). The logs of lesson 11.4 in [Module 11](../system-security/) and the hashes of [Module 10](../cryptography/) come back often. The project step continues `mylab` from [Module 12](../web-security/).

Every lesson works in WSL, a virtual machine or Linux on a real computer. The drill of lesson 13.4 changes your account's SSH keys and scheduled tasks, so run it on your own machine only.

## Time

7 lessons, about 2 hours 35 minutes of reading and practice.

## Module map

```mindmap
Defense & Incident Response
  People
    blue and red teams
    purple exercises
    SOC jobs
    baselines
  Evidence
    log levels
    JSON Lines
    log injection
  Detection
    SIEM pipeline
    detection rules
    correlation
    sliding window
    file integrity
    log watcher
  Response
    six steps
    evidence first
    incident report
  Recovery
    3-2-1 rule
    restore test
    safe database copy
```

## Lessons

1. 13.1 [Blue team vs red team](../defense/blue-team-vs-red-team/): who does what in a security team, and where beginners usually start.
2. 13.2 [Logging and monitoring](../defense/logging-and-monitoring/): decide what to log, write useful log lines, and watch them.
3. 13.3 [SIEM concepts](../defense/siem-concepts/): how logs from many machines are collected, searched and turned into alerts.
4. 13.4 [Incident response steps](../defense/incident-response-steps/): prepare, detect, contain, remove, recover, learn: walk through a small incident.
5. 13.5 [Backups and recovery](../defense/backups-and-recovery/): the 3-2-1 rule, and why a backup you never restored is not a backup.
6. 13.6 [Automating defense tasks with Python](../defense/automating-defense-tasks-with-python/): scripts that watch logs, check file integrity and report failed logins.
7. 13.7 [Project step: logging and alerts for mylab](../defense/project/): add structured logs to mylab, and a script that flags repeated failed logins.

## Project step

You add `app/security_log.py` to `mylab`, so that the app writes every login, logout and refused note to `logs/security.log` as JSON, with a test that proves no password ever lands there. Then you guess passwords against your own app and catch yourself with `tools/watch_logins.py`, which uses a 10-minute sliding window and also flags a successful login right after a burst of failures. Finally, `scripts/backup.sh` learns to copy the database safely, keep the backup private, record checksums and check its own result, and two risks of your threat model are closed.

## Cheat sheet

Everything from this module on one page: [Cheat sheet: Incident response steps](../defense/cheat-sheet/).
