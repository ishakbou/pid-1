---
title: "Project step: harden the machine that runs mylab"
description: Run a short hardening checklist on the machine that runs mylab, apply the fixes from this module, and record the before and after in docs/hardening.md.
lesson: "11.7"
time: 25 min
sidebar:
  order: 7
---

<!-- lab: run
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs ~/mylab/tools ~/mylab/app/templates ~/mylab/app/static ~/mylab/docs
cd ~/mylab
printf '# mylab\n\nMy lab for the PID 1 course.\n' > README.md
printf '.venv/\n__pycache__/\nlogs/*.log\ndata/mylab.db\n' > .gitignore
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
printf 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, password_hash TEXT);\n' > app/schema.sql
printf '# db\n' > app/db.py
printf '# app\n' > app/app.py
printf '<!DOCTYPE html>\n' > app/templates/base.html
printf 'body { margin: 0; }\n' > app/static/style.css
printf '# mylab threat model\n\nSee Module 9.\n' > docs/threat-model.md
printf '# TLS notes\n\nSee Module 10.\n' > docs/tls-notes.md
python3 -c "import sqlite3; c = sqlite3.connect('data/mylab.db'); c.executescript(open('app/schema.sql').read()); c.commit()"
chmod 600 data/mylab.db
git init -q
git add .
git commit -q -m "mylab after Module 10"
mkdir -p ~/sshlab
printf '# My SSH hardening (lesson 11.2)\nPermitRootLogin no\nPasswordAuthentication no\nKbdInteractiveAuthentication no\nX11Forwarding no\nMaxAuthTries 3\n' > ~/sshlab/10-hardening.conf
[ -f ~/.ssh/authorized_keys.orig ] || cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.orig
cp ~/.ssh/authorized_keys.orig ~/.ssh/authorized_keys
[ -f ~/.ssh/id_ed25519 ] || ssh-keygen -q -t ed25519 -C "sam@lab" -N "" -f ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
ssh-keyscan -t ed25519 localhost 2>/dev/null > ~/.ssh/known_hosts
sudo rm -f /etc/ssh/sshd_config.d/10-hardening.conf
sudo systemctl reload ssh
sudo ufw --force reset > /dev/null
sudo ip netns del visitor 2>/dev/null
pkill -f http.server
cd ~
true
-->

Airline pilots run a written checklist before every flight, even after ten thousand flights. Not because they forget how to fly, but because the one item they skip on a tired day is the one that matters. You now know six lessons' worth of hardening. In this step you turn them into a short checklist, run it on the machine that runs `mylab`, fix what fails, and write down the result.

## Goal

After this lesson you can:

- Check a Linux machine against a short hardening checklist and record what you find.
- Apply the fixes from this module in a safe order.
- Keep a before-and-after record, `docs/hardening.md`, next to the project's code.

## Why it matters

A hardening you cannot show is a hardening nobody can check, including you in six months. Writing down the before and the after turns "I think I secured it" into evidence: anyone can run the same commands and compare. It also closes the loop of the threat model from Module 9, whose last section asked how you will know that a fix works. In a portfolio, a short, honest hardening record says more than any claim.

## The idea

Here is the checklist. Each line comes from a lesson of this module:

| # | Check | Good result | Lesson |
|---|---|---|---|
| 1 | Security updates install themselves | Both values in `20auto-upgrades` are `"1"` | 11.1 |
| 2 | Only expected accounts can log in or use `sudo` | No name you cannot explain | 11.1 |
| 3 | SSH accepts keys only, and never root | `permitrootlogin no`, `passwordauthentication no` | 11.2 |
| 4 | The firewall denies incoming traffic by default | `Status: active`, only SSH allowed | 11.3 |
| 5 | Only expected services listen | Every line of `ss -tln` has a reason | 11.1, 11.6 |
| 6 | `mylab`'s data is private | `data/mylab.db` is `-rw-------` | 9.8 |

The order of the fixes matters as much as the fixes. Like a climber who fixes the next rope before untying the last one, you first make sure key login works, then turn passwords off; first allow SSH, then turn the firewall on. Each step keeps a way back in.

`mylab` after this step:

```text
mylab/
    docs/
        hardening.md       new: the checklist, before and after
        threat-model.md    from Module 9
        tls-notes.md       from Module 10
    ...                    everything from earlier modules
```

## Try it

This step continues the `mylab` folder from the earlier modules. If parts are missing, the project steps of [Module 9](../security-basics/project/) and [Module 10](../cryptography/project/) build them. It also uses the key from lesson 11.2 and the file `~/sshlab/10-hardening.conf` that you wrote there. The outputs come from the lab machine `lab` with the user `sam`, on which the changes of lessons 11.2 and 11.3 were undone first, so you can see a real "before". On your machine those changes are probably still in place, so some of your "before" values are already the good ones: write down what you really see.

### 1. Record the "before"

```bash
cd ~/mylab
sudo ufw status
sudo sshd -T | grep -E '^(maxauthtries|permitrootlogin|passwordauthentication|x11forwarding) '
```

```output
Status: inactive
maxauthtries 6
permitrootlogin without-password
passwordauthentication no
x11forwarding yes
```

Checks 3 and 4 fail: the firewall is off, root may log in with a key, and graphical forwarding is on. Passwords are already off, because this lab machine comes from a cloud image. Keep this output: it goes in the record.

```bash
cat /etc/apt/apt.conf.d/20auto-upgrades
grep -v -E 'nologin|false' /etc/passwd | cut -d: -f1
stat -c '%A %n' data/mylab.db
```

```output
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
root
sync
sam
-rw------- data/mylab.db
```

Checks 1, 2 and 6 pass. Updates are automatic, the accounts that can log in are the expected three from lesson 11.1, and the database has stayed private since Module 9.

<!-- lab: nocheck -->
```bash
ss -tln
```

```output
State  Recv-Q Send-Q Local Address:Port Peer Address:PortProcess
LISTEN 0      4096         0.0.0.0:22        0.0.0.0:*
LISTEN 0      4096      127.0.0.54:53        0.0.0.0:*
LISTEN 0      4096   127.0.0.53%lo:53        0.0.0.0:*
LISTEN 0      4096            [::]:22           [::]:*
```

The order of the lines can differ, as in lesson 11.1. Check 5 passes: DNS on loopback addresses only, and SSH, which you need. The `mylab` app is not running right now. When the Flask app from Module 8 runs, it listens on `127.0.0.1:5000` only: port 5000 is Flask's usual port, and `127.0.0.1` is the choice you made in Module 6. If your list has other lines, find their program with `sudo ss -tlnp` and decide, as in lesson 11.1, whether each one has a reason.

### 2. Make sure the key login works

```bash
ssh -o BatchMode=yes localhost true && echo "key login works"
```

```output
key login works
```

`BatchMode=yes` forbids any password prompt, so the message appears only if the key alone was enough. This is the rope you fix before untying the other one. If it fails, go back to lesson 11.2 before you change anything.

### 3. Fix SSH

```bash
sudo cp ~/sshlab/10-hardening.conf /etc/ssh/sshd_config.d/
sudo sshd -t && sudo systemctl reload ssh && echo "ssh reloaded"
ssh -o BatchMode=yes localhost true && echo "key login still works"
```

```output
ssh reloaded
key login still works
```

The `&&` chain stops at the first command that fails, so a typo in the settings never reaches the running server. The last line checks the result straight away, in a new connection, while your current session stays open.

### 4. Turn on the firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
```

```output
Default incoming policy changed to 'deny'
(be sure to update your rules accordingly)
Default outgoing policy changed to 'allow'
(be sure to update your rules accordingly)
Rules updated
Rules updated (v6)
```

<!-- lab: skip -->
```bash
sudo ufw enable
```

<!-- lab: run
sudo ufw --force enable > /dev/null
-->

Answer `y` to the question about SSH connections, as in lesson 11.3: SSH is allowed.

### 5. Record the "after"

```bash
sudo ufw status
sudo sshd -T | grep -E '^(maxauthtries|permitrootlogin|passwordauthentication|x11forwarding) '
```

```output
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere                  
OpenSSH (v6)               ALLOW       Anywhere (v6)             

maxauthtries 3
permitrootlogin no
passwordauthentication no
x11forwarding no
```

Every check passes now. Checks 1, 2, 5 and 6 did not change, so their "before" values are also their "after" values.

### 6. Write the record

Create `docs/hardening.md` with this content, then change the values so they match what your own machine printed:

```markdown title="docs/hardening.md"
# Hardening record: the machine that runs mylab

Machine: lab (Ubuntu 24.04). Checked on 2026-11-21, Module 11.
Every value below was printed by the command in the last column.

| # | Check | Before | After | Command |
|---|---|---|---|---|
| 1 | Security updates install themselves | yes | yes | cat /etc/apt/apt.conf.d/20auto-upgrades |
| 2 | Accounts that can log in | root, sync, sam | root, sync, sam | grep -v -E 'nologin\|false' /etc/passwd |
| 3 | SSH root login | without-password | no | sudo sshd -T |
| 3 | SSH passwords | no | no | sudo sshd -T |
| 3 | SSH X11 forwarding | yes | no | sudo sshd -T |
| 3 | SSH tries per connection | 6 | 3 | sudo sshd -T |
| 4 | Firewall | inactive | active, deny in, SSH only | sudo ufw status |
| 5 | Listening services | DNS (loopback), SSH | DNS (loopback), SSH | ss -tln |
| 6 | data/mylab.db | -rw------- | -rw------- | stat -c '%A %n' data/mylab.db |

## What I changed

- Added /etc/ssh/sshd_config.d/10-hardening.conf (lesson 11.2).
- Firewall: default deny incoming, allow OpenSSH, enabled (lesson 11.3).

## Accepted for now

- sudo for sam has NOPASSWD on this cloud lab machine. On my own
  computer, sudo asks for my password.

## How to check again

Run the commands in the last column and compare with the "After" column.
Check again after installing a new service and at the end of each module.
```

`\|` inside the table keeps the `|` of the `grep` pattern from being read as a new column. The "Accepted for now" section matters as much as the fixes: a known weakness that you chose to keep, with a reason, is a decision. A weakness nobody wrote down is a surprise waiting for a bad day.

```bash
grep -c '^| [0-9]' docs/hardening.md
```

```output
9
```

Nine table rows, one per value you checked, so nothing was forgotten between the commands and the record.

### 7. Commit the record

<!-- lab: nocheck -->
```bash
git add docs/hardening.md
git commit -m "Add the hardening record of the lab machine"
```

```output
[main 90e9666] Add the hardening record of the lab machine
 1 file changed, 31 insertions(+)
 create mode 100644 docs/hardening.md
```

Your commit number is different. Only the record goes into git: the SSH and firewall settings live in `/etc`, on the machine itself, which is where they work. If you publish `mylab` on GitHub, push as you did in Module 2.

## Exercise

The record says "SSH only" for the firewall, but you checked that from the inside. Prove it from the outside, as in lesson 11.6.

1. Build the visitor with `~/netlab/make-visitor.sh` from lesson 11.3.
2. From the visitor, scan port 22 and port 5000, the port of the `mylab` app.
3. Add one line with the result under "How to check again" in `docs/hardening.md`.

<details>
<summary>Show the solution</summary>

<!-- lab: run
mkdir -p ~/netlab
printf '#!/bin/bash\nip netns del visitor 2>/dev/null\nip netns add visitor\nip link add veth-host type veth peer name veth-visitor\nip link set veth-visitor netns visitor\nip addr add 10.99.0.1/24 dev veth-host\nip link set veth-host up\nip netns exec visitor ip addr add 10.99.0.2/24 dev veth-visitor\nip netns exec visitor ip link set veth-visitor up\nip netns exec visitor ip link set lo up\n' > ~/netlab/make-visitor.sh
-->

```bash
sudo bash ~/netlab/make-visitor.sh
sudo ip netns exec visitor nmap -p 22,5000 10.99.0.1 | grep tcp
```

```output
22/tcp   open     ssh
5000/tcp filtered upnp
```

Port 22 is open and port 5000 is filtered. The app listens on `127.0.0.1` only, and even if someone started it on every address by mistake, the firewall would now drop the visitor's packets. Two defenses for one risk. (`upnp` is nmap's guess from the port number, as in lesson 11.6.)

```bash
echo "- Outside scan from the visitor (lesson 11.6): 22 open, 5000 filtered." >> docs/hardening.md
tail -n 1 docs/hardening.md
```

```output
- Outside scan from the visitor (lesson 11.6): 22 open, 5000 filtered.
```

Commit the change as in step 7.

</details>

## Check yourself

**1. Why do you check that key login works before you turn SSH passwords off?**

<details>
<summary>Answer</summary>

If passwords are off and no key works, nobody can log in over SSH any more. On a remote machine that locks you out. Testing first, with `BatchMode=yes` so no password can help, proves that the key alone is enough.

</details>

**2. Why does the hardening record show the command for every value?**

<details>
<summary>Answer</summary>

So anyone, including you later, can run the same command and compare. A value without a command is a claim. A value with its command is evidence that can be checked again.

</details>

**3. What does `sudo sshd -t && sudo systemctl reload ssh` protect you from?**

<details>
<summary>Answer</summary>

From loading broken settings. `sshd -t` tests the settings first, and `&&` runs the reload only if the test passed. A typo is reported instead of reaching the running server.

</details>

**4. Why does the record have an "Accepted for now" section?**

<details>
<summary>Answer</summary>

Not every weakness gets fixed at once. Writing down the ones you keep, with the reason, turns them into decisions that someone can review later. Without the note, the next person cannot tell a decision from an oversight.

</details>

## Common mistakes

- **Copying the "before" values from this page.** Your machine is not the lab machine. Run the commands and write what yours prints.
- **Fixing everything in one go and testing at the end.** If something breaks, you do not know which change did it. Fix one item, test it, then go on.
- **Putting the SSH settings in git and thinking they are applied.** A file in `mylab` changes nothing. The settings work only in `/etc/ssh/sshd_config.d/`, followed by a reload.
- **Writing the record once.** A new service or a new user makes it wrong. Run the checks again after each change, as the last section of the record says.
- **Hiding the weak points.** A record that only lists successes is not trusted. The "Accepted for now" section is a sign of honesty, not of failure.

## Key terms

- **Hardening checklist**: a short written list of checks, each with a command and a good result, run on a machine before and after hardening it.

## Go further

- [Ubuntu Server documentation: Security](https://ubuntu.com/server/docs/security-introduction): Ubuntu's own overview of users, SSH, the firewall and updates, the same areas as this checklist.
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks): long, detailed hardening checklists for Ubuntu and many other systems, used by companies. Compare one section with your record.
- [OpenSSH: sshd_config manual](https://man.openbsd.org/sshd_config): every SSH server setting, if you want to tighten more than the five in your file.
