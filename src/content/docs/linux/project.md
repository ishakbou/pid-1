---
title: "Project step: start mylab"
description: Create the mylab folder structure and write its first two scripts, a short system report and a dated backup.
lesson: "1.10"
time: 25 min
sidebar:
  order: 10
---

Until now, every file you made lived in `playground`, and you could throw it away when the lesson ended. This one is different. The folder you create today, `mylab`, stays with you until the last module of the course, and every module adds something to it. Today it gets its shape and its first two tools.

<!-- lab: run
sudo apt-get install -y tree > /dev/null 2>&1
cp /etc/skel/.bashrc ~/.bashrc
-->

## Goal

After this lesson you can:

- Create the folder structure of `mylab`.
- Write `sysinfo.sh`, a script that prints a short report about your machine.
- Write `backup.sh`, a script that makes a dated copy of your work.

## Why it matters

Real projects have a shape that tells you where things go, so that you, and anyone after you, can find them in a year. The two scripts are small versions of tools that every system administrator keeps: a quick health report, and a backup. A backup you can make with one word is a backup you will actually make. In Module 13 you come back to `backup.sh` and make it stronger.

## The idea

`mylab` starts with four directories, each with one job:

| Directory | What goes in it | First used |
|---|---|---|
| `scripts/` | Bash scripts that help you run the project | Now |
| `notes/` | Your own notes, in plain text | Module 5 |
| `data/` | Files that programs read, such as a sample log | Module 3 |
| `logs/` | Files that programs write about what they did | Now |

`sysinfo.sh` puts together commands from this module: `whoami`, `hostname`, `grep`, `cut`, `tail` and pipes, each wrapped in command substitution. `backup.sh` uses a variable, an `if`, a `for` loop and `cp -r`.

A **backup** is a copy of your files kept somewhere else, so that you can get them back after a mistake. "Somewhere else" matters. A copy inside the folder it protects disappears with that folder, so `backup.sh` writes to `~/backups`, outside `mylab`. Each run makes a new directory named with a **timestamp**, the date and time of the run, so that a new backup never overwrites an older one.

## Try it

The outputs come from a user called `sam` on a computer called `lab`. Yours show your own names, dates and numbers.

### 1. Create the structure

```bash
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs
cd ~/mylab
tree
```

```output
.
├── data
├── logs
├── notes
└── scripts

5 directories, 0 files
```

`mkdir -p` creates `mylab` and the four directories inside in one command. `tree`, which you installed in lesson 1.6, draws the result. It counts the directory it starts from, `.`, as well, which is why it says five. If `tree` is missing, run `sudo apt install -y tree`.

### 2. Write sysinfo.sh

Create the file with nano. The path is `scripts/sysinfo.sh`, inside `mylab`.

```bash title="scripts/sysinfo.sh"
#!/bin/bash
# sysinfo.sh: print a short report about this machine
# Part of mylab. Works from any directory.

echo "System report, $(date '+%Y-%m-%d %H:%M')"
echo "User:       $(whoami)"
echo "Computer:   $(hostname)"
echo "System:     $(grep PRETTY_NAME /etc/os-release | cut -d '"' -f 2)"
echo "Kernel:     $(uname -r)"
echo "Up for:     $(uptime -p)"
echo "Free disk:  $(df -h --output=avail "$HOME" | tail -n 1 | tr -d ' ')"
echo "Processes:  $(ps -e --no-headers | wc -l)"
```

Most lines are commands you know. These parts are new:

- `date '+%Y-%m-%d %H:%M'` prints the date in a fixed form. Each `%` letter is one piece: `%Y` the year, `%m` the month, `%d` the day, `%H` and `%M` the hour and the minute.
- `/etc/os-release` is a small file that describes the system. `grep` keeps its line `PRETTY_NAME="Ubuntu 24.04.5 LTS"`, and `cut` keeps the part between the two `"` signs.
- `uname -r` prints the version of the kernel, the core of the system that plain `uname` named in lesson 1.1.
- `uptime -p` says how long the machine has been running. `df -h --output=avail` says how much free space the disk has, in a human form such as `17G`. It prints a heading first, so `tail -n 1` keeps the last line, and `tr -d ' '` deletes the spaces in front of the number.
- `ps -e --no-headers` lists every process without the heading line, and `wc -l` counts them.

```bash
chmod +x scripts/sysinfo.sh
```

<!-- lab: nocheck -->
```bash
scripts/sysinfo.sh
```

```output
System report, 2026-11-21 21:00
User:       sam
Computer:   lab
System:     Ubuntu 24.04.5 LTS
Kernel:     6.8.0-147-generic
Up for:     up 1 hour, 5 minutes
Free disk:  17G
Processes:  122
```

### 3. Save a report in logs

```bash
scripts/sysinfo.sh > logs/sysinfo.txt
wc -l logs/sysinfo.txt
```

```output
8 logs/sysinfo.txt
```

The report went into a file instead of the screen, as in lesson 1.7. Eight lines, one for each `echo`. Run the same line next week and compare: a log is only useful when there is something to compare it with.

### 4. Write backup.sh

```bash title="scripts/backup.sh"
#!/bin/bash
# backup.sh: copy the important folders of mylab into ~/backups
# Each run makes a new folder named after the date and time.

source_dir="$HOME/mylab"
stamp=$(date '+%Y-%m-%d_%H%M%S')
target="$HOME/backups/mylab-$stamp"

if [ ! -d "$source_dir" ]; then
  echo "Nothing to back up: $source_dir does not exist."
  exit 1
fi

mkdir -p "$target"
for folder in scripts notes data; do
  cp -r "$source_dir/$folder" "$target/"
  echo "Copied $folder"
done
echo "Backup saved in $target"
```

Read it from the top. Three variables hold the folder to save, the timestamp and the place for this copy. The `if` stops the script with exit status `1` when there is nothing to save. Then `mkdir -p` creates the target, including `~/backups` the first time, and the loop copies three folders. `logs` is left out on purpose: programs write new logs all the time, so old ones are not worth keeping.

Every path starts with `$HOME`, so the script works the same from any directory.

### 5. Run the backup

```bash
chmod +x scripts/backup.sh
```

<!-- lab: nocheck -->
```bash
scripts/backup.sh
```

```output
Copied scripts
Copied notes
Copied data
Backup saved in /home/sam/backups/mylab-2026-11-21_210046
```

<!-- lab: nocheck -->
```bash
tree ~/backups
```

```output
/home/sam/backups
└── mylab-2026-11-21_210046
    ├── data
    ├── notes
    └── scripts
        ├── backup.sh
        └── sysinfo.sh

5 directories, 2 files
```

The backup holds the three folders and both scripts. `notes` and `data` are still empty, so they are copied empty. Run `backup.sh` again a minute later, and a second folder with a later timestamp appears next to the first.

### 6. Check that the check works

A check that can never fail proves nothing, as you saw in lesson 0.7. Move `mylab` out of the way for a moment and run the backup:

```bash
cd ~
mv mylab mylab-away
mylab-away/scripts/backup.sh
echo $?
mv mylab-away mylab
```

```output
Nothing to back up: /home/sam/mylab does not exist.
1
```

The script noticed, said why, and stopped with status `1` without creating anything. The last line put `mylab` back where it belongs.

### 7. Look at the result

```bash
cd ~/mylab
tree
```

```output
.
├── data
├── logs
│   └── sysinfo.txt
├── notes
└── scripts
    ├── backup.sh
    └── sysinfo.sh

5 directories, 3 files
```

That is `mylab` at the end of Module 1. In Module 2 it becomes a Git repository, and from then on every change you make is recorded.

## Exercise

1. Add `~/mylab/scripts` to your `PATH`, both in the shell you are in and in `~/.bashrc`, so that you can run both scripts by their names from any directory.
2. Go to `/tmp` and check with `which` that the shell finds `backup.sh`.
3. Add a line to `sysinfo.sh`, right after the `Kernel` line, that prints `Shell:` followed by the value of the variable `SHELL`. Line the value up with the others.
4. From `/tmp`, run `sysinfo.sh` and show only its `Shell` line.

<details>
<summary>Show the solution</summary>

```bash
PATH="$HOME/mylab/scripts:$PATH"
echo 'export PATH="$HOME/mylab/scripts:$PATH"' >> ~/.bashrc
cd /tmp
which backup.sh
```

```output
/home/sam/mylab/scripts/backup.sh
```

The first line changes the shell you are in, and the second one every shell you open from now on, as in lesson 1.8.

For step 3, the new line is:

```text
echo "Shell:      $SHELL"
```

<!-- lab: run
sed -i '/^echo "Kernel:/a echo "Shell:      $SHELL"' ~/mylab/scripts/sysinfo.sh
-->

```bash
sysinfo.sh | grep Shell
```

```output
Shell:      /bin/bash
```

A pipe from lesson 1.7 picks out the one line you want to see.

</details>

## Check yourself

**1. Why does `backup.sh` write to `~/backups` and not to `~/mylab/backups`?**

<details>
<summary>Answer</summary>

A backup must live somewhere else than the files it protects. If `mylab` is deleted, a backup inside it is deleted too. In `~/backups` it survives.

</details>

**2. Why does the name of each backup folder contain the time, and not only the date?**

<details>
<summary>Answer</summary>

So that two backups made on the same day get two different folders. With the date alone, the second run would copy into the same folder as the first.

</details>

**3. What happens when you run `backup.sh` and `~/mylab` does not exist?**

<details>
<summary>Answer</summary>

The `if` test `[ ! -d "$source_dir" ]` is true, so the script prints `Nothing to back up` with the path, and stops with exit status `1`. It copies nothing.

</details>

**4. What does `scripts/sysinfo.sh > logs/sysinfo.txt` do?**

<details>
<summary>Answer</summary>

It runs the script and sends its standard output into the file `logs/sysinfo.txt` instead of the screen. If the file already exists, it is replaced.

</details>

**5. Why do the scripts use `$HOME/mylab` instead of just `mylab`?**

<details>
<summary>Answer</summary>

`mylab` is a relative path, so it would only work when the working directory is your home. The shell turns `$HOME/mylab` into an absolute path, such as `/home/sam/mylab`, so the scripts work from any directory.

</details>

## Common mistakes

- **Creating the files in the wrong place.** `scripts/sysinfo.sh` is a relative path. If you are not inside `~/mylab` when you open nano, the file lands somewhere else. Run `pwd` first.
- **Forgetting `chmod +x`.** The script answers `Permission denied`. Run `chmod +x` on both scripts.
- **Mixing up the quotes in the `System` line.** The `"` that `cut` looks for sits inside single quotes, `'"'`. Copy that part character by character.
- **Keeping backups next to the original only.** `~/backups` is still on the same disk. It saves you from your own mistakes, not from a broken disk. Module 13 goes further.
- **Never running the backup.** A backup script that nobody runs saves nothing. Run it at the end of each module.

## Key terms

- **Backup**: a copy of your files kept in another place, so that you can get them back after a loss or a mistake.
- **Timestamp**: the date and time written into a name or a line, to show when something happened.

## Go further

- [GNU Coreutils manual: date invocation](https://www.gnu.org/software/coreutils/manual/html_node/date-invocation.html): every `%` letter that `date` understands.
- [GNU Coreutils manual: df invocation](https://www.gnu.org/software/coreutils/manual/html_node/df-invocation.html): how `df` reports disk space, and its `--output` option.
- [Bash Reference Manual: Shell Scripts](https://www.gnu.org/software/bash/manual/html_node/Shell-Scripts.html): how Bash runs a script, and what the shebang line does.
