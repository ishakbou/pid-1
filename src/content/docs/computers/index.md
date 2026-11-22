---
title: "Module 5: How Computers Work"
description: Bits, bytes and text, logic, the CPU and memory, the operating system, compilers and interpreters, virtual machines, containers and the cloud.
module: 5
sidebar:
  order: 0
  label: Overview
---

So far you have used the computer: typed commands, written scripts, built a log analyzer. This module opens the case. You will read the bytes inside a text file, take a permission number apart bit by bit, build a pretend processor in Python, watch a program talk to the kernel, compile a C program and read its machine code, and build the main parts of a container with two commands. None of it needs special hardware: your Ubuntu terminal is enough.

## What you will learn

- How binary and hexadecimal work, and how ASCII and UTF-8 turn bytes into text.
- What AND, OR, NOT and XOR do, and how to use bitwise operators on real data such as permissions.
- What the CPU, RAM and disk each do, and how the fetch-execute cycle runs a program.
- What the operating system does for every program: processes, threads, virtual memory, system calls and file systems.
- The difference between compiled and interpreted languages, and what is inside a binary.
- What virtual machines and containers isolate, and when to use which.
- What the cloud really is, how it is priced, and why regions matter.

## Before you start

You need the terminal skills of [Module 1](../linux/): moving around, permissions and `chmod`, processes, installing packages with apt, and pipes with `grep`. Most steps also run small Python programs, so [Module 3](../python/) should be behind you: variables, loops, functions, files and modules. The project step works in the `mylab` repository you put under git in [Module 2](../git/).

Everything runs on Ubuntu (on WSL, in Codespaces or installed). Lesson 5.5 installs the C compiler with apt, so you need an internet connection once.

## Time

8 lessons, about 2 hours 55 minutes of reading and practice.

## Module map

```mindmap
How computers work
  Data
    binary and hex
    ASCII and UTF-8
    logic and bitwise
  Hardware
    CPU and registers
    fetch-execute cycle
    RAM and storage
  Operating system
    kernel and system calls
    processes and threads
    virtual memory
    file systems
  Running code
    compilers
    interpreters
    binaries and ELF
  Where code runs
    virtual machines
    containers
    the cloud
```

## Lessons

1. 5.1 [Binary, hexadecimal and text encoding](../computers/binary-hexadecimal-and-text-encoding/): count in binary and hex, and see how ASCII and UTF-8 turn bytes into text.
2. 5.2 [Logic and Boolean algebra](../computers/logic-and-boolean-algebra/): AND, OR, NOT and XOR, truth tables, and bitwise operators in Python.
3. 5.3 [CPU, memory and storage](../computers/cpu-memory-and-storage/): what happens when a program runs: the fetch-execute cycle, and RAM versus disk.
4. 5.4 [Operating systems](../computers/operating-systems/): processes, threads, memory and file systems: what the OS does for every program.
5. 5.5 [Compiled vs interpreted languages](../computers/compiled-vs-interpreted-languages/): compile a tiny C program, compare it with Python, and look at what a binary is.
6. 5.6 [Virtual machines and containers](../computers/virtual-machines-and-containers/): what each one isolates, and when to use which.
7. 5.7 [What "the cloud" actually is](../computers/what-the-cloud-is/): other people's computers, rented by the minute: servers, regions and service models.
8. 5.8 [Project step: look inside mylab](../computers/project/): use hexdump, file and /proc to see your own files and processes the way the machine sees them.

## Project step

This module adds no new program to `mylab`; it teaches you to look at the project with the machine's eyes. You ask `file` what each file really is, read the first bytes of your scripts with `hexdump`, make and fix a script with Windows line endings, and read a running process's details under `/proc`. What you find goes into `notes/inside.md`, which you commit to the repository. Module 6 then gives `mylab` its first server.

## Cheat sheet

Everything from this module on one page: [Cheat sheet: Number systems and units](../computers/cheat-sheet/).
