---
title: "Project step: a threat model for mylab"
description: Write docs/threat-model.md for mylab, listing what it holds, who could attack it, how each risk scores, and which later module fixes it.
lesson: "9.8"
time: 25 min
sidebar:
  order: 8
---

Your `mylab` app works. It has a login page, it stores notes in a database, and its code is on GitHub. Until today you looked at it as its builder. Now you look at it the way lesson 9.7 taught you, and you write down what you see. The result is one Markdown file that the next four modules work through, line by line.

## Goal

After this lesson you can:

- List the assets of a real project and the attackers who could reach them.
- Score each risk with likelihood and impact, and give each one a plan.
- Write a threat model in a file that lives next to the code.

## Why it matters

Fixing security problems at random is slow, and you never know when you are done. A threat model turns "make it secure" into a short list with an order, so every later fix has a reason and a place. Real teams keep one for every serious project. And a written threat model in a portfolio project shows an employer that you think like a defender, not only like a programmer.

## The idea

The work of describing a system, finding what can go wrong and deciding what to do is called **threat modeling**. Its result, the threat model, answers the four questions from lesson 9.7. For `mylab`, each one becomes a section of the file:

| Question | What you write | What you use from this module |
|---|---|---|
| What are we working on? | The parts of `mylab` and the assets in them | CIA triad (9.2) |
| What can go wrong? | The attackers, and the risks with their scores | Threats and risk (9.3) |
| What are we going to do about it? | One plan for each risk, with the module that does it | Authn, authz, least privilege (9.4) |
| Did we do a good enough job? | How you will check the fixes | Security mindset (9.7) |

Think of it as the inspection report of a house you just bought. You do not repair anything on the first day. You walk through every room, note what is weak, mark what is urgent, and plan the work. The report is useful even before the first repair, because you now know where the problems are.

Before you write, collect facts. A threat model built on guesses is a story. A threat model built on what `ls`, `stat` and `git` tell you is a plan.

`mylab` after this step:

```text
mylab/
    docs/
        threat-model.md    new: what to protect, from whom, and the plan
    ...                    everything from earlier modules
```

## Try it

<!-- lab: run
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs ~/mylab/tools ~/mylab/app/templates ~/mylab/app/static
cd ~/mylab
printf '# mylab\n\nMy lab for the PID 1 course.\n' > README.md
printf '.env\n*.tmp\nlogs/\n.venv/\n__pycache__/\ndata/big-*\ndata/*.db\ndata/secret_key\n' > .gitignore
printf '#!/bin/bash\necho sysinfo\n' > scripts/sysinfo.sh
printf '#!/bin/bash\necho backup\n' > scripts/backup.sh
chmod +x scripts/sysinfo.sh scripts/backup.sh
printf '# log analyzer\n' > tools/loganalyzer.py
printf '# tests\n' > tools/test_loganalyzer.py
printf '# bench\n' > tools/bench.py
printf '127.0.0.1 - - [21/Nov/2026:10:00:00 +0000] "GET / HTTP/1.1" 200 120\n' > data/sample-access.log
printf 'flask\n' > requirements.txt
printf '# notes\n' > notes/inside.md
printf '# server\n' > app/server.py
printf 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, password TEXT);\n' > app/schema.sql
printf '# db\n' > app/db.py
printf '# app\n' > app/app.py
printf '<!DOCTYPE html>\n' > app/templates/base.html
printf 'body { margin: 0; }\n' > app/static/style.css
python3 -c "import sqlite3; c = sqlite3.connect('data/mylab.db'); c.executescript(open('app/schema.sql').read()); c.commit()"
printf 'one line\n' > logs/server.log
python3 -c "import secrets; print(secrets.token_hex(32))" > data/secret_key
chmod 600 data/secret_key
printf '# Addresses seen scanning other servers (made up for practice)\n203.0.113.80\n' > data/blocklist.txt
printf '<!DOCTYPE html>\n' > app/templates/login.html
printf '<!DOCTYPE html>\n' > app/templates/notes.html
git init -q
git add .
git commit -q -m "mylab after Module 8"
cd ~
-->

This step continues the `mylab` folder from the earlier modules. If parts are missing, the project steps of [Module 1](../linux/project/), [Module 2](../git/project/), [Module 6](../networking/project/), [Module 7](../databases/project/) and [Module 8](../web/project/) build them. Wherever you see `sam`, your screen shows your own name.

### 1. What are we working on?

```bash
cd ~/mylab
ls
ls app
```

```output
README.md  app  data  logs  notes  requirements.txt  scripts  tools
app.py  db.py  schema.sql  server.py  static  templates
```

This is the whole project. `app/` is the web app: the Flask app from Module 8, the database code from Module 7 and the small server from Module 6. If you see a `__pycache__` folder too, that is fine: Python makes it when it runs your code. Your files may differ a little from these, so write the threat model about the `mylab` you really have.

### 2. Find the assets

```bash
git check-ignore data/mylab.db data/secret_key
```

```output
data/mylab.db
data/secret_key
```

`git check-ignore` prints a file name when `.gitignore` keeps that file out of git. The database is ignored, which is right: it holds the users, their passwords and their notes. That makes it the most valuable asset in `mylab`, and it also means its only copy is on your disk. The secret key from Module 8 is ignored too: anyone who has it can forge a login session for any user, so it is an asset as well.

```bash
stat -c '%A %n' data/mylab.db
```

```output
-rw-r--r-- data/mylab.db
```

The last three characters, `r--`, say that the file lets every user of this computer read the database. SQLite creates new database files this way unless you ask for something else. Your home folder on Ubuntu usually keeps other users out one level up, which is why the likelihood of this risk is low, but a copy of the file keeps its own permissions. This is a confidentiality problem from lesson 9.2, found with one command, and it goes in the threat model.

### 3. Check what the world can see

Your repository is public on GitHub. Everything git tracks, anyone can read.

```bash
git ls-files | grep -E '\.db$|\.log$|\.env$'
```

```output
data/sample-access.log
```

`git ls-files` lists every file git tracks. The `grep` keeps the ones that end in `.db`, `.log` or `.env`, three kinds of files that often hold private data: databases, logs and settings files with passwords in them. Each name it prints needs a look. This one is the practice log from Module 3, with made-up visitors, so it may stay public. A real log of your app, or the database, would have to leave git before your next push.

### 4. Write the threat model

Create `docs/threat-model.md` in your editor with this content, then change it so it fits your own `mylab`:

```bash
mkdir -p docs
```

```markdown title="docs/threat-model.md"
# mylab threat model

## 1. What are we working on?

mylab is my practice project. The web app runs only on my own computer,
on 127.0.0.1. The code is public on GitHub.

| Asset | Where it lives | What matters most |
|---|---|---|
| Accounts and passwords | data/mylab.db | Confidentiality |
| The users' notes | data/mylab.db | Confidentiality, integrity |
| The key that signs login sessions | data/secret_key | Confidentiality |
| The code | the git repository and GitHub | Integrity |
| My GitHub account | github.com | Confidentiality of its password |

## 2. What can go wrong?

Attackers: anyone who reads my public repository; other users and
programs on my computer; anyone who can reach the app if it is ever put
online; and me, by mistake.

| ID | Risk | L | I | Score |
|---|---|---|---|---|
| R1 | A secret is committed and published on GitHub | 2 | 3 | 6 |
| R2 | The database is lost: dead disk or deleted by mistake | 2 | 2 | 4 |
| R3 | Passwords are stored as plain text in the database | 1 | 3 | 3 |
| R4 | A form lets someone inject SQL or HTML into the app | 1 | 3 | 3 |
| R5 | A logged-in user can read another user's notes | 1 | 3 | 3 |
| R6 | Nobody notices repeated failed logins | 3 | 1 | 3 |
| R7 | Every user of the computer can read data/mylab.db | 1 | 2 | 2 |

L is likelihood and I is impact, from 1 to 3. Likelihood is low for R3,
R4 and R5 because the app listens only on 127.0.0.1. If it is ever put
online, those three become likely.

## 3. What are we going to do about it?

| ID | Plan | When |
|---|---|---|
| R1 | Run git ls-files before every push; keep secrets out of the code | Now |
| R2 | Back up data/mylab.db to another device | Module 13 |
| R3 | Store salted, slow password hashes | Module 10 |
| R4 | Fix injection and XSS, and add tests | Module 12 |
| R5 | Check on the server that each note belongs to the user | Module 12 |
| R6 | Structured logs and an alert on failed logins | Module 13 |
| R7 | chmod 600 data/mylab.db | Done in Module 9 |

## 4. Did we do a good enough job?

- A risk is closed only when a command or a test shows that the fix works.
- I read this file again at the end of Modules 10, 11, 12 and 13.
```

The scores use the method from lesson 9.3: likelihood times impact, and the table is sorted with the biggest score first. Look at R3, R4 and R5. They are serious, but their likelihood is 1, because a defense you chose in Module 6 is already working: the app listens only on `127.0.0.1`. R1 comes first because the repository is public right now.

### 5. Check that every risk has a plan

A risk without a plan is a risk somebody forgot. Each ID should appear twice: once in section 2 and once in section 3.

```bash
grep -o '^| R[0-9]' docs/threat-model.md | sort | uniq -c
```

```output
      2 | R1
      2 | R2
      2 | R3
      2 | R4
      2 | R5
      2 | R6
      2 | R7
```

`grep -o` prints only the part that matched: a table line that starts with `| R` and a digit. `sort | uniq -c` counts each one, as in lesson 9.7. Every count is 2, so every risk has its plan.

### 6. Fix the one-minute risk now

R7 needs no new module, only the command from lesson 9.2.

```bash
chmod 600 data/mylab.db
stat -c '%A %n' data/mylab.db
```

```output
-rw------- data/mylab.db
```

Only you can read and write the database now. The app still works, because it runs as you. That is least privilege from lesson 9.4, applied to a file.

### 7. Commit the threat model

<!-- lab: nocheck -->
```bash
git add docs/threat-model.md
git commit -m "Add a threat model"
```

```output
[main 99fd349] Add a threat model
 1 file changed, 50 insertions(+)
 create mode 100644 docs/threat-model.md
```

Your commit number is different, because it is computed from the content, the time and your name. The `chmod` from step 6 does not show up here: the database is ignored by git, so the permission change stays on your machine, which is exactly where it matters. If you publish `mylab` on GitHub, push as you did in Module 2.

## Exercise

A friend wants to try `mylab` from her laptop, on your home Wi-Fi. To let her in, you would start the app on `0.0.0.0`, which means "every network interface", instead of `127.0.0.1`.

1. Which risks in your threat model change, and what are their new scores?
2. Add a risk R8 for this situation to section 2, with a plan in section 3.
3. Run the check from step 5 again.

<details>
<summary>Show the solution</summary>

R3, R4 and R5 change. Their likelihood was 1 only because nobody else could reach the app. On a shared network, other people can, so the likelihood goes up to 3 and each score becomes 3 × 3 = 9. They jump to the top of the list.

Add these two lines, the first at the end of the table in section 2 and the second at the end of the table in section 3:

```text
| R8 | The app is reachable from the Wi-Fi when started on 0.0.0.0 | 2 | 3 | 6 |
| R8 | Keep 127.0.0.1; show the app on my own screen instead | Now |
```

<!-- lab: run
sed -i '/^| R7 | Every user/a | R8 | The app is reachable from the Wi-Fi when started on 0.0.0.0 | 2 | 3 | 6 |' docs/threat-model.md
sed -i '/^| R7 | chmod 600/a | R8 | Keep 127.0.0.1; show the app on my own screen instead | Now |' docs/threat-model.md
-->

```bash
grep -o '^| R[0-9]' docs/threat-model.md | sort | uniq -c | tail -n 2
```

```output
      2 | R7
      2 | R8
```

`tail -n 2` shows only the last two lines. R8 appears twice, so it has its plan. The best plan here is to avoid the risk: your friend can look at your screen, and the app never leaves `127.0.0.1`. Avoiding a risk is one of the four choices from lesson 9.3, and often the cheapest.

</details>

## Check yourself

**1. Why is `data/mylab.db` the most valuable asset in `mylab`?**

<details>
<summary>Answer</summary>

It holds the users, their passwords and their notes. A leak hurts confidentiality, a change hurts integrity, and since git ignores it, losing the file hurts availability: its only copy is on your disk.

</details>

**2. R3 (plain-text passwords) has a serious impact. Why is its score only 3?**

<details>
<summary>Answer</summary>

Its likelihood is 1, because the app listens only on `127.0.0.1` and the database file can now be read only by you. The score is likelihood times impact: 1 × 3 = 3. If the app were put online, the likelihood and the score would go up.

</details>

**3. What does `git ls-files | grep -E '\.db$|\.log$|\.env$'` show, and what do you do with its answer?**

<details>
<summary>Answer</summary>

It lists the files tracked by git whose names end in `.db`, `.log` or `.env`, which often hold private data. You look at each one, because everything git tracks is published when you push to a public repository. A made-up sample may stay; real data must leave git before the next push.

</details>

**4. Which question of the threat model does the last section answer, and why does it matter?**

<details>
<summary>Answer</summary>

"Did we do a good enough job?". Without it, a risk counts as fixed as soon as somebody says so. The section says that a risk is closed only when a command or a test shows that the fix works, and that the file is read again after each module.

</details>

## Common mistakes

- **Writing the threat model from memory.** Run `ls`, `stat` and `git ls-files` first. The database permissions in step 2 are easy to miss if you only think about the code.
- **Listing risks without plans.** A list of problems is only worrying. Each risk needs a decision: reduce, avoid, transfer or accept, and when.
- **Writing it once and forgetting it.** Every new feature adds doors. Read the file again at the end of each module, as section 4 says.
- **Putting secrets in the threat model.** The file is public with the rest of the repository. Write "the database password", never the password itself.
- **Scoring every risk 9.** If everything is urgent, nothing is. Be honest about likelihood, and let defenses such as `127.0.0.1` lower it.

## Key terms

- **Threat modeling**: the work of describing a system, finding what can go wrong with it and deciding what to do, usually written as a threat model.

## Go further

- [OWASP Threat Modeling Process](https://owasp.org/www-community/Threat_Modeling_Process): a longer walk through the same four questions, with more ways to find what can go wrong.
- [OWASP Threat Dragon](https://owasp.org/www-project-threat-dragon/): a free tool for drawing a system and writing its threat model, useful when projects grow.
- [git-check-ignore documentation](https://git-scm.com/docs/git-check-ignore): every option of the command you used to check which files stay out of git.
