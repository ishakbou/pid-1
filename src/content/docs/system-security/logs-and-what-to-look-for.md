---
title: Logs and what to look for
description: Find where Linux keeps its logs, read them with journalctl and grep, and recognise failed logins, sudo use and new accounts.
lesson: "11.4"
time: 25 min
sidebar:
  order: 4
---

<!-- lab: run
[ -f ~/.ssh/authorized_keys.orig ] || cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.orig
cp ~/.ssh/authorized_keys.orig ~/.ssh/authorized_keys
[ -f ~/.ssh/id_ed25519 ] || ssh-keygen -q -t ed25519 -C "sam@lab" -N "" -f ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
ssh-keyscan -t ed25519 localhost 2>/dev/null > ~/.ssh/known_hosts
if id tempuser >/dev/null 2>&1; then sudo userdel -r tempuser >/dev/null 2>&1; fi
true
-->

A burglar who picks a lock leaves scratches on it. Computers leave scratches too, but only if you look: every login, every `sudo`, every new account and every refused connection is written down somewhere, with the time it happened. Most of the time nobody reads these notes. In this lesson you make a few scratches on purpose, on your own machine, and then find them.

## Goal

After this lesson you can:

- Say where Linux keeps its logs, and read them with `journalctl` and `grep`.
- Find failed and successful SSH logins, and count them by user and by address.
- Spot other activity that deserves a question: `sudo` commands and new accounts.

## Why it matters

Prevention fails sooner or later. When it does, logs are how you notice, and how you find out what happened, when, and from where. The same lines tell you whether the hardening from the last lessons works: if the logs show hundreds of password guesses and no successful login, your SSH settings are doing their job. Security teams spend much of their day reading logs, and Module 13 builds on this lesson.

## The idea

A **log** is a file, or a database, where programs write down what they did, one line per event, each with a time. On Ubuntu there are two places to look.

The **systemd journal** collects messages from every service, the kernel and the login system. You read it with `journalctl`, which can filter by service, by time and by program. Most messages also end up as plain text files in `/var/log`, written by a helper called `rsyslog`:

| File | What it holds |
|---|---|
| `/var/log/auth.log` | Logins, `sudo`, SSH, new users: anything about who you are |
| `/var/log/syslog` | General messages from services |
| `/var/log/kern.log` | Messages from the kernel, including the firewall |
| `/var/log/dpkg.log` | Every package installed, upgraded or removed |
| `/var/log/journal/` | The journal itself, in a binary format for `journalctl` |

Reading logs is like reading the visitor book at a building's front desk. One line on its own says little: "10:02, Alex, room 4". The interesting things are patterns. Forty names in two minutes, all from the same car. A visitor at 3 a.m. Someone who signs in as "admin". A name that appears for the first time.

A concrete example of a pattern: one address tries `admin`, `test`, `oracle`, `ubuntu` and `pi`, a few seconds apart, and every attempt fails. That is a program guessing names from a list, called **brute forcing**. If the same address then has one `Accepted` line, you have a real problem, and you know where to start.

## Try it

On this lab machine reading the system logs needs `sudo`. On your own Ubuntu, the first user is in the group `adm`, which may read most logs without it, but `sudo` works everywhere. This lesson uses the SSH server and the key from lesson 11.2. The outputs show the machine `lab` and the user `sam`.

### 1. Look at the log folder

<!-- lab: nocheck -->
```bash
ls /var/log
```

```output
README            btmp                   dpkg.log   private              wtmp
alternatives.log  cloud-init-output.log  journal    syslog
apport.log        cloud-init.log         kern.log   sysstat
apt               dist-upgrade           landscape  ufw.log
auth.log          dmesg                  lastlog    unattended-upgrades
```

Each name is a file or a folder of logs. Your list is different, because each installed program adds its own. On an older machine you also see files ending in `.1` or `.gz`. They are older copies made by **log rotation**: every week or so, a log file is renamed and compressed, and a new one starts, so the disk never fills up.

### 2. Ask the package log what was installed

<!-- lab: nocheck -->
```bash
grep -E ' (install|purge) ' /var/log/dpkg.log | tail -n 2
```

```output
2026-11-21 22:24:24 install vsftpd:amd64 <none> 3.0.5-0ubuntu3.1
2026-11-21 22:25:39 purge vsftpd:amd64 3.0.5-0ubuntu3.1 <none>
```

`dpkg.log` can be read by every user. Each line has the date and time, the action, the package and its version. If you did lesson 11.1, you see `vsftpd` arriving and leaving. When something strange runs on a machine, "what was installed recently?" is one of the first questions.

### 3. Read the SSH server's journal

<!-- lab: nocheck -->
```bash
sudo journalctl -u ssh -n 4 --no-pager
```

```output
Nov 21 22:34:08 lab sshd[14467]: pam_unix(sshd:session): session opened for user sam(uid=1000) by sam(uid=0)
Nov 21 22:35:35 lab sshd[14531]: Accepted publickey for sam from 10.0.2.2 port 52130 ssh2: ED25519 SHA256:5UhoeoY+PC29lbF3kejndQIqFlxLr7LL4Kk2GlM52xc
Nov 21 22:35:35 lab sshd[14531]: pam_unix(sshd:session): session opened for user sam(uid=1000) by sam(uid=0)
Nov 21 22:35:49 lab sshd[14610]: Connection closed by 127.0.0.1 port 60674 [preauth]
```

`-u ssh` keeps only the messages of the `ssh` service, `-n 4` shows the last four, and `--no-pager` prints them directly instead of opening a scrolling viewer. Each line has the same parts: the time, the machine's name, the program with its process number in brackets, and the message. Here, `10.0.2.2` is the computer that runs this lab machine and logs in to it. Yours shows your own logins, or nothing if nobody has used SSH yet.

### 4. Note the time, then make some noise

You are about to play the attacker against your own machine. To find only your own lines later, save the current time in a variable first.

<!-- lab: run
sleep 1
-->

```bash
start=$(date '+%Y-%m-%d %H:%M:%S')
for user in admin test oracle; do ssh -o BatchMode=yes "$user@localhost" true; done
```

```output
admin@localhost: Permission denied (publickey).
test@localhost: Permission denied (publickey).
oracle@localhost: Permission denied (publickey).
```

`$(...)` runs a command and puts its output in the variable `start`. The `for` loop then tries three account names that do not exist on this machine, which is exactly what guessing programs do. Now add one successful login and one `sudo` command:

```bash
ssh localhost true
sudo cat /etc/shadow > /dev/null
```

<!-- lab: run
sleep 2
-->

Both print nothing: the login worked, and the file was read and thrown away.

### 5. Find the failed logins

<!-- lab: nocheck -->
```bash
sudo journalctl -u ssh --since "$start" --no-pager
```

```output
Nov 21 22:35:51 lab sshd[14621]: Invalid user admin from 127.0.0.1 port 60690
Nov 21 22:35:51 lab sshd[14621]: Connection closed by invalid user admin 127.0.0.1 port 60690 [preauth]
Nov 21 22:35:53 lab sshd[14624]: Invalid user test from 127.0.0.1 port 60696
Nov 21 22:35:53 lab sshd[14624]: Connection closed by invalid user test 127.0.0.1 port 60696 [preauth]
Nov 21 22:35:55 lab sshd[14627]: Invalid user oracle from 127.0.0.1 port 60712
Nov 21 22:35:55 lab sshd[14627]: Connection closed by invalid user oracle 127.0.0.1 port 60712 [preauth]
Nov 21 22:35:56 lab sshd[14630]: Accepted publickey for sam from 127.0.0.1 port 60724 ssh2: ED25519 SHA256:an0oxtc1hK4ZU3hxdQJ+sSdtVyIYAmSclzC4rPLGtx4
Nov 21 22:35:56 lab sshd[14630]: pam_unix(sshd:session): session opened for user sam(uid=1000) by sam(uid=0)
```

`--since` keeps only the lines after your saved time. For each guessed name the server wrote `Invalid user ... from ...`: the name does not exist here. Then come your own key login, `Accepted publickey`, and its session. On a server facing the internet, you would see hundreds of `Invalid user` lines a day, from addresses all over the world.

Long lines are hard to read, so cut out only the part you need with `grep -o`, which prints just the matching text:

```bash
sudo journalctl -u ssh --since "$start" | grep -o 'Invalid user [a-z]* from [0-9.]*'
```

```output
Invalid user admin from 127.0.0.1
Invalid user test from 127.0.0.1
Invalid user oracle from 127.0.0.1
```

`[a-z]*` matches the name and `[0-9.]*` matches the address, digits and dots.

### 6. Count the attempts by address

```bash
sudo journalctl -u ssh --since "$start" | grep 'Invalid user' | grep -o 'from [0-9.]*' | sort | uniq -c
```

```output
      3 from 127.0.0.1
```

This is the pipe from lesson 1.7, used for real: keep the failed lines, cut out the address, sort, and count each one. Three different names from one address in a few seconds is the brute forcing pattern. On a real server, the same command shows which addresses try the hardest.

### 7. Find the successful logins

```bash
sudo journalctl -u ssh --since "$start" | grep -o 'Accepted [a-z]* for [a-z]* from [0-9.]*'
```

```output
Accepted publickey for sam from 127.0.0.1
```

Every successful login has a line like this: the method, the user and the address. This is the most important line to check after a series of failures. Failures are noise, but an `Accepted` from an address you do not know means someone got in.

### 8. See who used sudo

```bash
sudo journalctl _COMM=sudo --since "$start" | grep -o 'COMMAND=.*' | grep -v journalctl
```

```output
COMMAND=/usr/bin/cat /etc/shadow
```

`_COMM=sudo` keeps the messages written by the program `sudo`. Each `sudo` command is logged with the user, the folder and the full command. The `grep -v journalctl` hides your own `journalctl` commands, because they used `sudo` too and are logged like everything else. Reading `/etc/shadow`, which holds the password hashes, is exactly the kind of line to ask about if you did not do it yourself.

The same lines are in the text file:

<!-- lab: nocheck -->
```bash
sudo grep 'COMMAND=' /var/log/auth.log | grep 'cat /etc/shadow' | tail -n 1
```

```output
2026-11-21T22:37:13.333746+00:00 lab sudo:      sam : PWD=/home/sam ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow
```

The first `grep` keeps the `sudo` lines and the second keeps the one you want. Searching with one `grep` for `cat /etc/shadow` would also find the line of that very `grep`, because `sudo` logs it before it runs. The file writes the time in full, with fractions of a second and the time zone. In a real terminal you also see `TTY=pts/0`, the terminal the command came from.

:::caution[An attacker can read logs too]
Someone who gets root can also delete or change the logs on that machine. That is why real systems send a copy of their logs to another machine as they are written, which Module 13 covers. On one machine, treat logs as good evidence, not perfect evidence.
:::

### 9. Know what deserves a question

| What you see | Where | Why it matters |
|---|---|---|
| Many `Invalid user` or `Failed password` lines from one address | `journalctl -u ssh`, `auth.log` | Someone is guessing |
| `Accepted` from an address you do not know | `journalctl -u ssh`, `auth.log` | Someone got in |
| A `sudo` command that nobody remembers | `journalctl _COMM=sudo`, `auth.log` | Someone used root rights |
| `new user` or `add ... to group 'sudo'` | `auth.log` | A new key to the building |
| A package installed that nobody asked for | `dpkg.log` | New software, maybe a new service |
| Activity at an hour when nobody works | Any log | Machines do not sleep, but people usually do |

## Exercise

New accounts are a classic sign that someone wants to come back later. Create one and find its trace.

1. Save the time in `start` again.
2. Create a user called `tempuser` with `sudo useradd -m tempuser`, then delete it with `sudo userdel -r tempuser`.
3. Find both events in the journal and print only the parts that name the user.

<details>
<summary>Show the solution</summary>

```bash
start=$(date '+%Y-%m-%d %H:%M:%S')
sudo useradd -m tempuser
sudo userdel -r tempuser
```

```output
userdel: tempuser mail spool (/var/mail/tempuser) not found
```

<!-- lab: run
sleep 2
-->

```bash
sudo journalctl --since "$start" | grep -o -E "new user: name=[a-z]*|delete user '[a-z]*'"
```

```output
new user: name=tempuser
delete user 'tempuser'
```

`-E` allows the `|`, which means "or". Without `-u`, `journalctl` searches every service, which is what you want when you do not know which program wrote the line. Creating an account writes `new user`, and deleting it writes `delete user`. An attacker who creates an account leaves this line, unless they also clean the logs.

</details>

## Check yourself

**1. Which file in `/var/log` do you open first to check logins and `sudo` use?**

<details>
<summary>Answer</summary>

`/var/log/auth.log`. It holds everything about authentication: SSH logins, `sudo`, and new users. The same events are in the journal, for example with `sudo journalctl -u ssh`.

</details>

**2. What does `sudo journalctl -u ssh --since "$start"` show?**

<details>
<summary>Answer</summary>

Only the messages of the `ssh` service that were written after the time saved in the variable `start`.

</details>

**3. You see 200 `Invalid user` lines from one address, with a different name each time. What is happening, and which line do you look for next?**

<details>
<summary>Answer</summary>

A program is guessing account names and passwords, which is brute forcing. Look next for an `Accepted` line from the same address: that would mean a guess worked.

</details>

**4. Why did your own `journalctl` commands appear in the `sudo` log?**

<details>
<summary>Answer</summary>

You ran them with `sudo`, and `sudo` logs every command it runs, including the ones that read logs. The log does not judge which commands are interesting; you do.

</details>

**5. Why are the logs on a machine not perfect evidence after a break-in?**

<details>
<summary>Answer</summary>

An attacker who gets root on that machine can delete or change its logs. Copies sent to another machine as the events happen are much harder to change.

</details>

## Common mistakes

- **Reading without `sudo` and finding nothing.** Without the right group, `journalctl` shows only your own messages and says so in a hint. Add `sudo`.
- **Searching the whole history every time.** Old lines bury the new ones. Use `--since`, with a saved time or with words such as `--since "1 hour ago"`.
- **Looking only at failures.** Failed logins are everyday noise on the internet. The line that matters is the `Accepted` one.
- **Forgetting rotated files.** Last week's events may be in `auth.log.1` or in a `.gz` file. `zgrep` searches compressed files the way `grep` searches plain ones.
- **Trusting the times blindly.** A machine with a wrong clock writes wrong times. Check `date` when you compare logs from two machines.

## Key terms

- **Log**: a record, in a file or a database, of events that programs write down, each with its time.
- **systemd journal**: the central log of a systemd system, read with `journalctl`.
- **Log rotation**: renaming and compressing old logs on a schedule, so new ones start and the disk does not fill up.
- **Brute forcing**: trying many passwords or names one after another until one works.

## Go further

- [journalctl manual page](https://manpages.ubuntu.com/manpages/noble/man1/journalctl.1.html): every filter, including `--since`, `-u`, and fields such as `_COMM`.
- [rsyslog.conf manual page](https://manpages.ubuntu.com/manpages/noble/man5/rsyslog.conf.5.html): how rsyslog decides which message goes into which file in `/var/log`.
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html): what a good log line contains, from the point of view of the people who write applications. Useful for Module 13.
