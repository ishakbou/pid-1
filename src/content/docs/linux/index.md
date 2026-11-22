---
title: "Module 1: Linux & the Terminal"
description: Work in the Linux terminal with files, permissions, processes, packages and pipes, and write your first Bash scripts.
module: 1
sidebar:
  order: 0
  label: Overview
---

This is where the keyboard takes over from the mouse. You learn to move around a Linux system, read and change files, understand who may do what, watch and stop programs, install software, and chain small commands into answers. At the end you write scripts that do the typing for you, and you use them to start `mylab`, the project that grows through the whole course.

## What you will learn

- What a terminal, a shell and a command are, and how to read a prompt.
- How to move around the file system, and create, copy, move and delete files and folders.
- How to read files of any length, and edit them with nano.
- How to read and change permissions, and when to use `sudo`.
- How to see what is running, and stop a program that misbehaves.
- How to install, update and remove software with `apt`.
- How to send output into files and other commands, and search text with `grep`.
- How the shell finds programs, and how variables carry settings.
- How to write, run and debug a Bash script with variables, `if` and `for`.

## Before you start

You need [Module 0](../start-here/): a working terminal on Ubuntu, in WSL, in a codespace or on Linux itself. Lessons 1.1, 1.2, 1.3 and 1.7 also work in the practice terminal of the page, for a quick try.

No earlier knowledge of the terminal is needed. Lesson 1.1 starts from the very first command.

## Time

10 lessons, about 3 hours and 35 minutes of reading and practice. Lesson 1.6 also needs a few minutes of downloads.

## Module map

```mindmap
Linux & the Terminal
  First steps
    terminal and shell
    the prompt
    help and man
  Files
    paths and folders
    cat, less, nano
    permissions
  Running programs
    processes and signals
    apt packages
    PATH and variables
  Combining commands
    redirection
    pipes
    grep
  Scripts
    variables and arguments
    if and for
    mylab scripts
```

## Lessons

1. 1.1 [What the terminal is](../linux/what-the-terminal-is/): terminal, shell and command: what each word means and how to read a prompt.
2. 1.2 [Files and navigation](../linux/files-and-navigation/): move around the file system and create, copy, move and delete files and folders.
3. 1.3 [Viewing and editing files](../linux/viewing-and-editing-files/): read files with cat, less, head and tail, and edit them with nano.
4. 1.4 [Users and permissions](../linux/users-and-permissions/): read rwx permissions, change them with chmod and chown, and use sudo with care.
5. 1.5 [Processes](../linux/processes/): see what is running with ps and top, and stop a program with kill.
6. 1.6 [Installing software (apt)](../linux/installing-software-apt/): find, install, update and remove packages on Ubuntu.
7. 1.7 [Pipes, redirection and grep](../linux/pipes-redirection-and-grep/): chain commands together, save output to a file, and search text.
8. 1.8 [Environment variables and PATH](../linux/environment-variables-and-path/): how the shell finds programs and remembers settings.
9. 1.9 [Your first Bash script](../linux/your-first-bash-script/): write, run and debug a small script with variables, if and loops.
10. 1.10 [Project step: start mylab](../linux/project/): create the mylab folder structure and two small helper scripts.

## Project step

The project step creates `~/mylab` with four directories: `scripts`, `notes`, `data` and `logs`. You write two scripts for it. `sysinfo.sh` prints a short report about your machine: who you are, which system it runs, how long it has been up, how much disk is free. `backup.sh` copies the important folders into `~/backups`, in a new folder named with the date and time. In [Module 2](../git/), `mylab` becomes a Git repository.

## Cheat sheet

The commands of this module on one page: [Cheat sheet: Linux commands](../linux/cheat-sheet/).
