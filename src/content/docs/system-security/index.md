---
title: "Module 11: System & Network Security"
description: Harden a Linux machine step by step, with users and sudo, SSH keys, the ufw firewall and its logs, then see how Windows domains work and how defenders scan their own lab.
module: 11
sidebar:
  order: 0
  label: Overview
---

Module 9 taught you to think like a defender and Module 10 gave you the cryptography behind safe logins. This module puts both to work on a real machine. You check who can log in, switch SSH to keys, turn on a firewall, read the logs that show who knocked, and scan your own machine to see it the way a stranger does. At the end, the machine that runs `mylab` is hardened, and you have a written record that proves it.

## Ethics and law

Only test systems you own or have written permission to test. Every command in this module runs on your own machine, against `localhost` or against a small test network that you build inside it in lesson 11.3. Port scans and login attempts against other people's machines are illegal in many countries, and they are always noticed. Lesson 9.1 explains the rules; read it again if you skipped it.

## What you will learn

- How to find the accounts that can log in or use `sudo`, keep updates automatic, and remove services you do not need.
- How SSH proves who the server is and who you are, how to log in with a key pair, and how to tighten the SSH server.
- How a firewall with "deny by default" works, and how to allow, test and remove rules with ufw.
- Where Linux keeps its logs, and what failed logins, `sudo` use and new accounts look like in them.
- What domains, domain controllers, groups and Group Policy are in Windows, and why attackers aim at admin groups.
- What a port scan shows, how to scan your own lab with nmap, and how a scan looks in the firewall log.

## Before you start

You need the terminal from [Module 1](../linux/), especially users, permissions, `sudo`, `apt` and pipes. Ports, TCP and the tools `ss`, `nc` and `curl` come from [Module 6](../networking/), and network namespaces from [Module 5](../computers/). Lesson 11.2 uses the public and private keys of [Module 10](../cryptography/), and lesson 11.5 uses recursion from [Module 4](../algorithms/). The project step continues `mylab` from [Module 10](../cryptography/).

Most lessons need a full Linux that you control: WSL, a virtual machine, or Linux on a real computer. The firewall and the test network will most likely not work inside GitHub Codespaces, because a Codespace is a container.

## Time

7 lessons, about 2 hours 50 minutes of reading and practice.

## Module map

```mindmap
System & Network Security
  The machine
    accounts and sudo
    updates
    fewer services
  Logins
    SSH keys
    host fingerprints
    sshd settings
  The network
    ufw deny by default
    allow and reject
    port scans with nmap
  Watching
    journalctl
    failed logins
    firewall log
  Windows domains
    Active Directory
    nested groups
    Group Policy
```

## Lessons

1. 11.1 [Securing a Linux system](../system-security/securing-a-linux-system/): users, sudo, updates, and removing what you do not need.
2. 11.2 [SSH and keys](../system-security/ssh-and-keys/): log in to another machine safely, use key pairs, and tighten the SSH server.
3. 11.3 [Firewalls (ufw)](../system-security/firewalls-ufw/): allow and block traffic with simple rules, starting from "deny by default".
4. 11.4 [Logs and what to look for](../system-security/logs-and-what-to-look-for/): where Linux keeps its logs, and what failed logins and odd activity look like.
5. 11.5 [Windows and Active Directory basics](../system-security/windows-and-active-directory-basics/): domains, users, groups and policies as concepts, and why attackers aim at them.
6. 11.6 [Network scanning concepts](../system-security/network-scanning-concepts/): what a port scan reveals, how defenders scan their own lab with nmap, and how scans get noticed.
7. 11.7 [Project step: harden the machine that runs mylab](../system-security/project/): apply a short hardening checklist to your lab machine and record the before and after.

## Project step

You turn the module into a six-item checklist: automatic updates, expected accounts, SSH with keys only and no root, a firewall that denies incoming traffic by default, only expected services, and private `mylab` data. You record the "before" with real commands, apply the fixes in a safe order so you never lock yourself out, record the "after", and commit `docs/hardening.md` to `mylab`, including the weaknesses you chose to accept for now.

## Cheat sheet

Everything from this module on one page: [Cheat sheet: Hardening checklist](../system-security/cheat-sheet/).
