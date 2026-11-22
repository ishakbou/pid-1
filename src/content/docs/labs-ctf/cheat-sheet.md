---
title: "Cheat sheet: CTF toolkit"
description: The home lab plan, Bandit and picoCTF habits, decoding commands and the write-up format of Module 14 on one printable page.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## The rule

Only test systems you own or have written permission to test. On a CTF platform the challenge is the target; the platform, other players and their flags are not.

## Home lab

| VirtualBox mode | Reaches | Use it for |
|---|---|---|
| NAT | Internet through the host | Installing and updating |
| Bridged | Your real network | Not for a lab |
| Host-only | Host and host-only VMs | Reaching lab VMs from your computer |
| Internal network | Only VMs on the same named network | The most isolated lab |

| Command | What it does |
|---|---|
| `lscpu \| grep -i virtualization` | Shows `AMD-V` or `VT-x` if the CPU can run VMs |
| `sha256sum -c --ignore-missing SHA256SUMS` | Checks the downloaded ISO against the published checksums |
| `sudo ip netns add vm1` | Creates a network namespace (a model "machine") |
| `sudo ip link add eth0 netns vm1 type veth peer name eth0 netns vm2` | A virtual cable between two namespaces |
| `sudo ip -n vm1 addr add 10.10.10.1/24 dev eth0` | Gives an address inside a namespace |
| `sudo ip -n vm1 link set eth0 up` | Switches the interface on |
| `sudo ip netns exec vm1 ping -c 2 10.10.10.2` | Runs a program inside a namespace |
| `sudo ip -n vm1 route get 1.1.1.1` | `Network is unreachable` proves there is no way out |
| `sudo ip netns del vm1` | Deletes the namespace and its end of the cable |

- Plan: `vm1` 10.10.10.1/24, `vm2` 10.10.10.2/24, internal network `labnet`. Same `/24`, or no ping.
- Clone with "Generate new MAC addresses". Install with NAT, then switch to the internal network.
- Snapshot `clean` before every experiment; Restore to go back.

## Bandit

| Command | What it does |
|---|---|
| `ssh bandit0@bandit.labs.overthewire.org -p 2220` | Log in to level 0 |
| `ssh -G bandit` | Print the settings a `~/.ssh/config` entry gives, without connecting |
| `chmod 600 notes.txt` | Notes only you can read |
| `whatis find file` | One line about each command; `(1)` is the commands section |
| `man -k temporary \| grep '(1)'` | Search commands by description |
| `ls --help \| grep -e '-a,'` | Find one option in a command's help |
| `find . -type f -empty` | Files that are empty |
| `find . -type f -mmin -10` | Files changed less than 10 minutes ago |
| `work=$(mktemp -d)` | Private scratch folder with a random name |

```text
Host bandit
    HostName bandit.labs.overthewire.org
    Port 2220
```

- The password found on level N is for user `bandit(N+1)`.
- Stuck: reread the goal, `ls -la` and `file`, read the man pages, test in a sandbox, break after 30 minutes, search the concept, never the level.

## picoCTF

| Category | What you do |
|---|---|
| General Skills | Terminal, files, encodings, small scripts |
| Cryptography | Encodings, old ciphers, crypto used wrongly |
| Forensics | Files, images, network captures |
| Web Exploitation | A small website made for the challenge |
| Reverse Engineering | Read a program, find what it checks |
| Binary Exploitation | Memory bugs in compiled programs |

- Flags look like `picoCTF{...}`. Start in the picoGym: General Skills, few points or many solves first.
- Method: **read** (title, description, hints), **look** (recon, change nothing), **guess** one thing, **test** it with one small step, **record** what and why.

| Command | What it does |
|---|---|
| `file x` | The real type, from the bytes, not the name |
| `grep -c '[^0-9a-f]' x` | `0` lines with a non-hex character: probably hex |
| `xxd -r -p x` | Plain hex back to bytes |
| `base64 -d` | Decode Base64 (often ends with `=`) |
| `zcat x` | Unpack gzip data to the screen, whatever the name |
| `gunzip x.txt` | Refuses: `unknown suffix -- ignored` |

## Write-ups

| Section | Contents |
|---|---|
| Header | Name, platform, category, points, date |
| Summary | 2 or 3 sentences, key idea, no flag |
| Recon | What you were given, what you noticed |
| Steps | I saw, so I guessed, I tested, it showed |
| Dead ends | What failed, and why |
| Flag | The flag, or `REDACTED` when public |
| What I learned | 1 to 3 things for next time |

| Command | What it does |
|---|---|
| `grep '^## ' writeup.md` | List the sections |
| `sed 's/practice{[^}]*}/practice{REDACTED}/g' a.md > b.md` | Public copy without the flag |
| `grep -n '!\[\]' a.md` | Images without alt text |
| `./scripts/check-writeups.sh` | mylab: sections present, no flag left; exit code 0 or 1 |

- Terminal output as text, screenshots only for visual things, always with alt text: `![what it shows](images/x.png)`.
- Redact every step that leads back to the secret, not only the secret. A solid box, not a blur.
- Publish only when the rules allow, usually after the competition ends. Private copies stay in `~/ctf`, outside `mylab`.
