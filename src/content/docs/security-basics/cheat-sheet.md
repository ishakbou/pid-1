---
title: "Cheat sheet: Security concepts"
description: Permission and scope, the CIA triad, risk scoring, access control, phishing signs, malware types and the security mindset of Module 9 on one printable page.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## The rule

Only test systems you own or have written permission to test.

| Permission must say | Meaning |
|---|---|
| Who allows it | Someone who really has the right to decide |
| Scope | The exact systems; everything else is out |
| Rules of engagement | Dates, allowed and forbidden methods |
| Contact | Who to call if something breaks |

- Found a flaw by accident: stop, write down what you saw, report privately (coordinated disclosure).
- Scope check: `grep -qxF "$target" scope.txt` (quiet, plain text, whole line only).

## CIA triad

| Goal | Question | Defenses | Real failure |
|---|---|---|---|
| Confidentiality | Only the right readers? | Permissions, passwords, encryption | Equifax 2017 (data breach) |
| Integrity | Correct, and would we notice a change? | Checksums, access control, logs | SolarWinds 2020 (changed update) |
| Availability | There when needed? | Backups, spare machines, updates | Dyn 2016 (denial of service) |

| Command | What it does |
|---|---|
| `stat -c '%A %n' file` | Show permissions and name |
| `chmod 600 file` | Only the owner reads and writes |
| `sha256sum file > file.sha256` | Save a checksum |
| `sha256sum -c file.sha256` | Check it: `OK` or `FAILED` |

## Risk

| Word | Meaning | Example |
|---|---|---|
| Asset | Something of value | The email account |
| Threat | Who or what could harm it | A password guesser |
| Vulnerability | The weakness used | A short, reused password |
| Risk | Likelihood combined with impact | 3 × 3 = 9 |

- Score: **likelihood × impact**, each 1 to 3. 6 or more high, 3 or 4 medium, 1 or 2 low.
- Choices: **reduce**, **avoid**, **transfer**, **accept**. What is left after a defense is residual risk.
- Rank again after every change.

## Access

| | Authentication (authn) | Authorization (authz) |
|---|---|---|
| Question | Who are you? | What may you do? |
| When | At login | On every action |
| Web status when it fails | `401` | `403` |

- Factors: something you know, have, are. MFA = two or more of different kinds.
- Passwords: long, unique, in a password manager. Reuse leads to credential stuffing.
- Least privilege: only the access needed for the job. Users get roles, roles get permissions.
- `whoami`, `id`: who the system thinks you are. Permission digits: read 4, write 2, run 1 (`600`, `640`, `700`).

## Phishing signs

| Check | Look for |
|---|---|
| Sender | The address behind the display name; a different `Reply-To` |
| Pressure | Urgency, authority, fear, reward, "a quick favor" |
| Link | The registered domain: read the host name from the right |
| Tricks | `name@203.0.113.9` (the part before `@` is not the site), `.pdf.exe` |

- Do: slow down, check through another channel, report it.
- Clicked: change the password on the real site, turn on MFA, tell IT at once.
- Commands: `grep -E '^(From|Reply-To|To):' message.eml`, `grep -o 'https://[^ ]*' message.eml`, `urlparse(link).hostname` in Python.

## Malware

| Type | Key trait |
|---|---|
| Virus | Rides on other files, runs when they are opened |
| Worm | Spreads over the network on its own (WannaCry) |
| Trojan | Looks useful, so the victim installs it |
| Ransomware | Encrypts files, demands money |
| Spyware | Watches and sends data out |
| Botnet | Many machines controlled by one attacker (Mirai) |

| Detection | Catches | Misses |
|---|---|---|
| Signature | Known files, few false positives | Anything new or changed |
| Behavior | New malware by what it does | Quiet malware; more false positives |

- False positive: alarm on something harmless. False negative: malware nobody caught.
- Everyday defenses: updates, backups on another device, least privilege.

## Security mindset

- Ask "how could this fail?", not only "does it work?".
- Three lists: assets, attackers (accidents too), defenses.
- Attack surface: every input, port, file and person that outsiders can reach.
- Never trust input. Use an allowlist (what is allowed), not a blocklist (what is forbidden).
- Defense in depth: several layers, so one failure is not the end.
- Strange inputs to test: `0`, `-3`, `1000000`, `abc`, `2.5`, `../secret.txt`.

## Threat model (docs/threat-model.md)

1. What are we working on?
2. What can go wrong?
3. What are we going to do about it?
4. Did we do a good enough job?

| Fact | Command |
|---|---|
| Is a file kept out of git? | `git check-ignore data/mylab.db` |
| Which tracked files may hold private data? | `git ls-files \| grep -E '\.db$\|\.log$\|\.env$'` |
| Does every risk have a plan? | `grep -o '^\| R[0-9]' docs/threat-model.md \| sort \| uniq -c` |
