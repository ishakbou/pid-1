---
title: "Cheat sheet: Hardening checklist"
description: The hardening checklist of Module 11 on one printable page, with the commands for accounts, updates, services, SSH, ufw, logs and nmap.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## The rule

Only test systems you own or have written permission to test. Scan and attack only your own machine, `localhost` or your own test network.

## The checklist

| # | Check | Command | Good result |
|---|---|---|---|
| 1 | Updates install themselves | `cat /etc/apt/apt.conf.d/20auto-upgrades` | Both values `"1"` |
| 2 | Who can log in | `grep -v -E 'nologin\|false' /etc/passwd \| cut -d: -f1,7` | Only names you can explain |
| 2 | Who can use sudo | `getent group sudo`, `sudo -l -U name` | Only the people who need it |
| 3 | SSH settings | `sudo sshd -T \| grep -E '^(permitrootlogin\|passwordauthentication) '` | Both `no` |
| 4 | Firewall | `sudo ufw status verbose` | `active`, `deny (incoming)`, SSH allowed |
| 5 | What listens | `ss -tln` | Every line has a reason |
| 6 | Private data | `stat -c '%A %n' data/mylab.db` | `-rw-------` |

Safe order: key login works, then passwords off. SSH allowed, then firewall on. Keep one session open while you test.

## Accounts and services

| Command | What it does |
|---|---|
| `sudo useradd -m -s /bin/bash name` | Create a user with a home and a shell |
| `sudo useradd -m -s /usr/sbin/nologin name` | Create an account nobody can log in with |
| `id name` | Show a user's number and groups |
| `sudo passwd -S name` | Password status: `L` means locked |
| `sudo usermod -aG sudo name` | Add to the group `sudo` (keep the `-a`) |
| `sudo gpasswd -d name sudo` | Remove from the group `sudo` |
| `sudo userdel -r name` | Delete the user and their home |
| `apt list --upgradable` | Updates that are waiting |
| `systemctl is-active name` | Is the service running? |
| `sudo systemctl disable --now name` | Stop it and keep it from starting at boot |
| `sudo apt purge name` | Remove a package and its settings |

## SSH

| Command | What it does |
|---|---|
| `ssh-keygen -t ed25519 -C "comment"` | Make a key pair (choose a passphrase) |
| `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` | Show the server's fingerprint |
| `cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys` | Allow a public key (then `chmod 600`) |
| `ssh-copy-id -i key.pub user@address` | Install a public key on another machine |
| `ssh localhost whoami` | Log in, run one command, come back |
| `ssh -i key -o IdentitiesOnly=yes host` | Use only this key |
| `ssh -o BatchMode=yes host true` | Never prompt: test that the key alone works |
| `sudo sshd -t` | Test the server's settings |
| `sudo systemctl reload ssh` | Load new settings, keep open sessions |
| `sed -i '/comment/d' ~/.ssh/authorized_keys` | Revoke a key by its comment |

`/etc/ssh/sshd_config.d/10-hardening.conf`: the first value read wins, files are read in alphabetical order.

```text
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
X11Forwarding no
MaxAuthTries 3
```

## ufw

| Command | What it does |
|---|---|
| `sudo ufw default deny incoming` | Deny by default |
| `sudo ufw default allow outgoing` | Let the machine reach out |
| `sudo ufw allow OpenSSH` | Allow SSH (before `enable`) |
| `sudo ufw enable` | Turn on, also at boot |
| `sudo ufw allow from 10.99.0.2 to any port 8080 proto tcp` | One port, one address |
| `sudo ufw reject 8080/tcp` | Refuse with an answer instead of silence |
| `sudo ufw status numbered` | Rules with numbers (first match wins) |
| `sudo ufw delete allow ...` | Delete a rule: `delete` + the same rule |

`deny`: silent drop, the sender times out. `reject`: `Connection refused` at once. Loopback skips the rules: test from another machine or a namespace (`sudo ip netns exec visitor ...`).

## Logs

| Where | What |
|---|---|
| `/var/log/auth.log` | Logins, `sudo`, new users |
| `/var/log/syslog`, `/var/log/kern.log` | Services, kernel, firewall |
| `/var/log/dpkg.log` | Packages installed and removed |
| `/var/log/ufw.log` | Blocked packets, `[UFW BLOCK]` |

| Command | What it shows |
|---|---|
| `start=$(date '+%Y-%m-%d %H:%M:%S')` | Save the time, to search from it later |
| `sudo journalctl -u ssh --since "$start"` | SSH messages since that time |
| `... \| grep -o 'Invalid user [a-z]* from [0-9.]*'` | Guessed names and their source |
| `... \| grep -o 'Accepted [a-z]* for [a-z]* from [0-9.]*'` | Successful logins |
| `sudo journalctl _COMM=sudo --since "$start"` | Every `sudo` command |
| `sudo journalctl -k --since "$start" \| grep 'UFW BLOCK'` | Packets the firewall dropped |

Look for: many failures from one address, then an `Accepted`; `sudo` nobody remembers; `new user`; packages nobody asked for; activity at odd hours.

## nmap

| Command | What it does |
|---|---|
| `nmap localhost` | 1,000 common TCP ports, inside view |
| `nmap -p 22,80,8080 host` | Only these ports |
| `nmap -sV -p 22 host` | Ask the service for its program and version |
| `sudo ip netns exec visitor nmap 10.99.0.1` | Outside view, through the firewall |

| State | Answer | Meaning |
|---|---|---|
| open | SYN-ACK | Something listens and is reachable |
| closed | RST | Reachable, nothing listens |
| filtered | nothing | A firewall dropped it |

A scan in the log: one `SRC`, many `DPT`, `SYN` only, within seconds. ufw logs a burst of 10 lines, then about 3 per minute.

## Active Directory

| Word | Meaning |
|---|---|
| Domain | Computers, users and rules managed together |
| Domain controller | Server with the directory; checks every login |
| Group Policy | Settings pushed to many computers at once |
| Kerberos | Log in once, get a time-limited ticket |
| Nested groups | Groups inside groups: follow them to find the real admins |
| Password spraying | One password against many accounts, under the lockout limit |

| Event ID | Meaning |
|---|---|
| 4624 / 4625 | Logon succeeded / failed |
| 4720 | User account created |
| 4728 | Member added to a security-enabled global group |
| 4740 | Account locked out |
