---
title: Securing a Linux system
description: Check who can log in and who can use sudo, keep the system updated automatically, and remove services you do not need.
lesson: "11.1"
time: 25 min
sidebar:
  order: 1
---

<!-- lab: run
sudo userdel -r guest >/dev/null 2>&1
sudo userdel -r reports >/dev/null 2>&1
sudo apt-get purge -y -qq vsftpd >/dev/null 2>&1
true
-->

Put a fresh Linux server on the internet and watch its logs. Within minutes, programs you have never heard of start knocking: they try `root` with the password `123456`, then `admin`, then `test`. Nobody chose your machine. These programs try every address there is, all day long. The good news is that a few plain habits make almost all of them give up.

## Goal

After this lesson you can:

- List the accounts that can log in, and the accounts that can use `sudo`.
- Check that security updates install themselves.
- Find the services that listen on the network, and remove one you do not need.

## Why it matters

Most break-ins do not use clever new tricks. They use an old account nobody remembered, a password that was never changed, a hole that was fixed months ago but never updated, or a service that was installed for a test and forgotten. Every one of these is something you can check with a few commands. Making a system harder to attack in this way is called **hardening**, and it is the first job of anyone who looks after a machine.

## The idea

Think of a Linux machine as a building. Every account is a key, every program that listens on the network is a door, and every update is a better lock that the manufacturer sends you for free. All the ways in, the keys and the doors together, form the attack surface that you met in lesson 9.7. Hardening means making that surface small: fewer keys, fewer doors, better locks.

In practice, four questions cover most of it:

| Question | Why you ask it | Command in this lesson |
|---|---|---|
| Who can log in? | Each login account is a key someone could steal or guess | `grep` on `/etc/passwd` |
| Who can become root? | A stolen `sudo` account is a stolen machine | `getent group sudo`, `sudo -l` |
| Are updates installed? | Known holes are the easiest ones to use | `apt`, unattended upgrades |
| What is listening? | A service nobody uses is a door nobody watches | `ss -tln`, `systemctl` |

This is least privilege from Module 9, applied to a whole machine. A user who never needs root should not have `sudo`. A machine that never sends files over FTP should not run an FTP server. What is not there cannot be attacked.

A concrete example: a student installs a database server for one homework, finishes the homework, and forgets about it. A year later the database still starts at every boot, still listens on its port, and still has the default password. Nothing about it is clever. It is simply a door that nobody remembered to close.

## Try it

The outputs below come from the lab machine used to test this course, a small Ubuntu server called `lab` with the user `sam`. Your machine has your own name, and probably more accounts and services, so your lists will be longer. That is fine: read them the same way.

### 1. List the accounts that can log in

```bash
wc -l /etc/passwd
```

```output
33 /etc/passwd
```

`/etc/passwd` has one line per account. Thirty-three accounts on a small server may sound like a lot, but most of them are not people. They are **system accounts**: accounts that programs run as, such as `www-data` for a web server, so that each program gets only its own rights.

The last field of each line is the account's shell, the program that starts when it logs in. System accounts get `/usr/sbin/nologin` or `/bin/false`, which refuse to start a session. So the accounts that can really log in are the ones without those:

```bash
grep -v -E 'nologin|false' /etc/passwd | cut -d: -f1,7
```

```output
root:/bin/bash
sync:/bin/sync
sam:/bin/bash
```

`grep -v` keeps the lines that do not match, and `cut -d: -f1,7` keeps the first field (the name) and the seventh (the shell). `root` and `sam` are expected. `sync` is an old tradition: its "shell" is a program that writes the disk buffers and exits at once, so it cannot be used to work on the machine. Any name here that you do not recognise deserves a question.

### 2. Find out who can become root

```bash
getent group sudo
```

```output
sudo:x:27:
```

On Ubuntu, members of the group `sudo` may run any command as root. `getent group` prints the group's line: its name, a placeholder, its number and, after the last colon, its members. On your own Ubuntu you will see your name there. On this lab machine the list is empty, because the cloud system that built it gives `sam` its rights in a different way. To see the rights a user really has, ask `sudo` itself:

```bash
sudo -l
```

```output
Matching Defaults entries for sam on lab:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User sam may run the following commands on lab:
    (ALL) NOPASSWD: ALL
```

The last line is the one to read. `(ALL)` means "as any user" and the final `ALL` means "any command". `NOPASSWD` means that `sudo` does not ask for the password. Cloud servers are often set up this way because their users have no password at all, but on your own machine you should see `(ALL : ALL) ALL` with no `NOPASSWD`: the password prompt is one more lock.

### 3. Add a user without sudo rights

Imagine a friend needs an account on your machine to try something. Give them a key, but not the master key.

```bash
sudo useradd -m -s /bin/bash guest
id guest
```

```output
uid=1001(guest) gid=1001(guest) groups=1001(guest)
```

`useradd` creates the account. `-m` makes a home directory and `-s /bin/bash` sets the shell. `id` shows the result: a new user number, its own group, and no other groups. Ubuntu also has `adduser`, a friendlier front end that asks questions, including a password. Here no password is set yet, which you can check:

```bash
sudo passwd -S guest | cut -d' ' -f1,2
```

```output
guest L
```

`passwd -S` prints the password status. `L` means locked: there is no usable password, so nobody can log in as `guest` with a password until you set one with `sudo passwd guest`. Then check the rights:

```bash
sudo -l -U guest
```

```output
User guest is not allowed to run sudo on lab.
```

This is the answer you want for a guest.

### 4. Give sudo and take it back

```bash
sudo usermod -aG sudo guest
sudo -l -U guest | tail -n 2
```

```output
User guest may run the following commands on lab:
    (ALL : ALL) ALL
```

`usermod -aG sudo` adds the user to the group `sudo`. The `-a` means "append": without it, `usermod -G` would replace all the user's other groups. One command, and `guest` could now do anything on the machine. Take it back:

```bash
sudo gpasswd -d guest sudo
sudo -l -U guest
```

```output
Removing user guest from group sudo
User guest is not allowed to run sudo on lab.
```

Rights that are given for a task should be taken back when the task is done. Most forgotten admin accounts were "temporary".

### 5. Remove the account

```bash
sudo userdel -r guest
id guest
```

```output
userdel: guest mail spool (/var/mail/guest) not found
id: ‘guest’: no such user
```

`userdel -r` deletes the account and its home directory. The message about the mail spool only says that `guest` never had a mailbox, which is normal. The second line proves that the account is gone.

### 6. Check that updates install themselves

In lesson 1.6 you updated by hand with `sudo apt update` and `sudo apt upgrade`. People forget. Ubuntu has a helper for that, **unattended upgrades**, which installs security updates every day without asking.

```bash
cat /etc/apt/apt.conf.d/20auto-upgrades
```

```output
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
```

The two `"1"` values mean "refresh the package lists every day" and "install the updates every day". By default only security updates are installed this way, because they fix holes and rarely change how programs behave. If the file does not exist on your machine, run `sudo apt install unattended-upgrades` and then `sudo dpkg-reconfigure unattended-upgrades` and answer Yes.

<!-- lab: nocheck -->
```bash
apt list --upgradable 2>/dev/null | head -n 3
```

```output
Listing...
```

This shows the updates that are waiting. Here the list is empty, so the machine is up to date. Yours may show several packages: install them with `sudo apt upgrade`. Some updates, such as a new kernel, only take effect after a restart.

### 7. See what is listening

A **service** is a program that runs in the background, usually from boot to shutdown, such as the SSH server. Some services listen on a port and wait for connections from the network. Those are the doors.

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

You met `ss` in Module 6: `-t` for TCP, `-l` for listening, `-n` for numbers. The lines can come in a different order on your machine, and the order can change after a restart. Two services here. Port 53 on `127.0.0.53` and `127.0.0.54` is the local DNS helper, and it only listens on loopback addresses, so other machines cannot reach it. Port 22 on `0.0.0.0` and `[::]` is the SSH server, open on every address. That one is needed to manage this machine, and lesson 11.2 tightens it.

### 8. Install a service, and see the new door

Ubuntu starts a service the moment you install it. Watch this with an FTP server, an old way to send files that sends passwords as plain text.

<!-- lab: nocheck -->
```bash
sudo apt-get install -y vsftpd
```

```output
Setting up vsftpd (3.0.5-0ubuntu3.1) ...
Created symlink /etc/systemd/system/multi-user.target.wants/vsftpd.service → /usr/lib/systemd/system/vsftpd.service.
Processing triggers for man-db (2.12.0-4build2) ...
```

apt prints many lines. These are the last ones, and the middle one matters: `Created symlink ... multi-user.target.wants` means the service is now switched on for every boot. Your version number may be newer.

```bash
systemctl is-active vsftpd
ss -tln | grep ':21 '
```

```output
active
LISTEN 0      32                 *:21              *:*
```

You did not start anything, yet the FTP server is running and listening on port 21 on every address (`*`). `systemctl` is the tool that controls services, and `is-active` asks whether one is running. This is how forgotten doors are born: one install command, for one test.

### 9. Switch it off, then remove it

If you need a service only sometimes, you can switch it off without removing it:

```bash
sudo systemctl disable --now vsftpd
systemctl is-enabled vsftpd
systemctl is-active vsftpd
```

```output
Synchronizing state of vsftpd.service with SysV service script with /usr/lib/systemd/systemd-sysv-install.
Executing: /usr/lib/systemd/systemd-sysv-install disable vsftpd
Removed "/etc/systemd/system/multi-user.target.wants/vsftpd.service".
disabled
inactive
```

`disable` removes the link that starts the service at boot: the `Removed` line undoes the `Created symlink` line of step 8. The two lines before it come from support for an older way of starting services and can be ignored. `--now` also stops the service at once, as the last two lines confirm. The program stays installed, ready for `sudo systemctl enable --now vsftpd` on the day you need it. A plain `systemctl stop` would only last until the next boot.

You do not need an FTP server at all, so remove it:

```bash
sudo apt-get purge -y -qq vsftpd > /dev/null
ss -tln | grep -c ':21 '
```

```output
0
```

`purge` removes the package and its settings files, and `-qq` makes apt quiet. `grep -c` counts matching lines: zero, so port 21 is closed. What is not installed cannot be started by mistake, and needs no updates.

:::caution[Do not remove what you do not understand]
Before you remove a package or stop a service, find out what it does with `apt show name`. Removing the SSH server on a remote machine, or the network tools, can lock you out. On your own computer, remove only what you installed yourself or can clearly name.
:::

## Exercise

Your machine needs an account called `reports` that a program will use to write reports. No person should ever log in with it.

1. Create the account with a home directory and a shell that refuses logins.
2. Check that it does not appear in the list from step 1.
3. Check that it cannot use `sudo`.
4. Try to open a shell as `reports` with `sudo su - reports` and read the answer.
5. Delete the account.

<details>
<summary>Show the solution</summary>

```bash
sudo useradd -m -s /usr/sbin/nologin reports
grep -v -E 'nologin|false' /etc/passwd | cut -d: -f1
```

```output
root
sync
sam
```

```bash
sudo -l -U reports
sudo su - reports
```

```output
User reports is not allowed to run sudo on lab.
This account is currently not available.
```

`su - reports` asks to start a login shell as `reports`. The shell is `nologin`, which prints its message and exits. A program can still run as `reports` (for example with `sudo -u reports command`), but nobody can log in as it.

```bash
sudo userdel -r reports
```

```output
userdel: reports mail spool (/var/mail/reports) not found
```

</details>

## Check yourself

**1. Why does a small server have dozens of accounts in `/etc/passwd`?**

<details>
<summary>Answer</summary>

Most of them are system accounts that programs run as, each with only the rights that program needs. They have the shell `nologin` or `false`, so nobody can log in with them.

</details>

**2. What is the difference between `usermod -aG sudo guest` and `usermod -G sudo guest`?**

<details>
<summary>Answer</summary>

With `-a` the group `sudo` is added to the user's groups. Without `-a`, `-G` replaces the whole list of extra groups, so the user loses every other group they were in.

</details>

**3. `sudo -l` ends with `(ALL) NOPASSWD: ALL`. What does that mean, and why is it weaker than `(ALL : ALL) ALL`?**

<details>
<summary>Answer</summary>

The user may run any command as any user, and `sudo` never asks for a password. Anyone who gets a shell as that user, for example through a stolen session, becomes root at once. With a password prompt they would also need the password.

</details>

**4. You install a package to test it and forget about it. Why is that a security problem, and what are your two ways to fix it?**

<details>
<summary>Answer</summary>

On Ubuntu a service starts as soon as it is installed, and it starts again at every boot, so it may listen on the network for years without anyone watching or updating it. Remove it with `sudo apt purge name`, or, if you need it sometimes, stop it and keep it from starting with `sudo systemctl disable --now name`.

</details>

**5. Which kind of updates does unattended upgrades install by default, and why those?**

<details>
<summary>Answer</summary>

Security updates. They fix known holes, which attackers use first, and they rarely change how programs behave, so installing them automatically is safe for most machines.

</details>

## Common mistakes

- **Forgetting `-a` in `usermod -aG`.** The user loses all other extra groups. Check with `id name` after every change.
- **Giving `sudo` "just for today".** Temporary rights tend to stay. Remove them as soon as the task is done with `sudo gpasswd -d name sudo`.
- **Thinking an account without a password is safe.** It cannot log in with a password, but someone with root can set one, and SSH keys do not need one. Delete accounts that nobody uses.
- **Never restarting after updates.** A new kernel or a fixed library is only used after a restart, or after the program using it restarts. Ubuntu writes `/var/run/reboot-required` when a restart is needed.
- **Stopping a service without disabling it.** `systemctl stop` lasts until the next boot. Use `systemctl disable --now` to stop it and keep it stopped.

## Key terms

- **Hardening**: making a system harder to attack by removing what it does not need and tightening what it keeps.
- **System account**: an account that a program runs as, not a person, usually with the shell `nologin`.
- **Service**: a program that runs in the background, often from boot to shutdown, controlled with `systemctl`.
- **Unattended upgrades**: the Ubuntu helper that installs security updates automatically every day.

## Go further

- [Ubuntu Server documentation: Package management](https://ubuntu.com/server/docs/package-management): how Ubuntu installs updates, including the settings of unattended upgrades.
- [Ubuntu Server documentation: User management](https://ubuntu.com/server/docs/user-management): adding and removing users, groups and `sudo` rights, from the people who make Ubuntu.
- [Ubuntu Security Notices](https://ubuntu.com/security/notices): the list of security holes fixed in Ubuntu packages. A few minutes there show why updates matter.
