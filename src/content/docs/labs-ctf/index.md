---
title: "Module 14: Practice: Labs & CTFs"
description: Build a safe home lab with virtual machines, practice on OverTheWire Bandit and picoCTF, and write up what you solved.
module: 14
sidebar:
  order: 0
  label: Overview
---

Thirteen modules taught you how systems work and how they are attacked and defended. This module is where you practice it, on targets that are yours or that were built to be attacked. You build a private lab of virtual machines, play two free games that thousands of security people started with, and learn to write down how you solved a challenge so that the skill stays with you.

## Ethics and law

Only test systems you own or have written permission to test. In this module that means three things: virtual machines on your own computer, kept on a network that cannot reach anyone else's; OverTheWire and picoCTF, whose owners invite everyone to play; and practice files you create yourself. Even on a CTF platform, the challenge is the target and the platform is not. Lesson 9.1 explains the rules in full.

## What you will learn

- How to build a home lab: a hypervisor, two virtual machines, and an isolated network you can prove is isolated.
- How OverTheWire Bandit works, how to find the right command for a level, and what to do when you are stuck.
- What CTFs and flags are, the six picoCTF categories, and a five-step method for any challenge.
- How to write a write-up that explains your reasoning, and how to remove flags and secrets before publishing.
- How to keep write-ups in `mylab`, with a script that catches a leftover flag before you commit.

## Before you start

You need the terminal from [Module 1](../linux/), including permissions and Bash scripts, and `git` from [Module 2](../git/) for the project step. Lesson 14.1 builds on virtual machines and namespaces from [Module 5](../computers/) and on IP addresses and routes from [Module 6](../networking/). Lesson 14.3 uses hex from Module 5 and Base64 from [Module 10](../cryptography/). Read the ethics lesson of [Module 9](../security-basics/) first if you skipped it.

## Time

5 lessons, about 1 hour 55 minutes of reading and practice. Building the real virtual machines of lesson 14.1 takes about one more hour, and Bandit and picoCTF can fill as many evenings as you like.

## Module map

```mindmap
Labs and CTFs
  Home lab
    hypervisor
    two VMs
    internal network
    snapshots
  Bandit
    SSH to a level
    man and whatis
    test in a sandbox
    private notes
  picoCTF
    flags
    six categories
    picoGym
    five-step method
  Write-ups
    fixed sections
    reasoning per step
    screenshots and alt text
    redaction
  mylab
    writeups folder
    check script
```

## Lessons

1. 14.1 [Build a home lab with virtual machines](../labs-ctf/build-a-home-lab-with-virtual-machines/): install a free hypervisor and create two virtual machines on an isolated network.
2. 14.2 [OverTheWire Bandit](../labs-ctf/overthewire-bandit/): how to play, how to get unstuck, and what the first levels teach, without spoilers.
3. 14.3 [picoCTF](../labs-ctf/picoctf/): the challenge categories, how to choose a challenge, and a method to solve it.
4. 14.4 [Writing a good CTF write-up](../labs-ctf/writing-a-good-ctf-write-up/): structure, screenshots, and explaining your reasoning, not only the answer.
5. 14.5 [Project step: your first write-ups in mylab](../labs-ctf/project/): add a writeups folder to mylab with two write-ups in the standard format.

## Project step

You add a `writeups/` folder to `mylab` with a template, an index and two write-ups of the practice challenges from lessons 14.3 and 14.4, dead end included. Because `mylab` is public, you also write `scripts/check-writeups.sh`, which checks that every write-up has all six sections and no unredacted flag. It catches a real leak before your commit, you redact it, and you commit only public copies.

## Cheat sheet

Everything from this module on one page: [Cheat sheet: CTF toolkit](../labs-ctf/cheat-sheet/).
