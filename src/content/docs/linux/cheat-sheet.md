---
title: "Cheat sheet: Linux commands"
description: The commands, shortcuts and script parts of Module 1 on one printable page.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## Keys and help

| Key or command | What it does |
|---|---|
| Ctrl+C | Stops the command that is running |
| Up arrow | Brings back the previous command |
| Tab | Completes a name; twice shows the choices |
| Ctrl+L / Ctrl+D | Clears the screen / closes the shell |
| `NAME --help` | Short help of a command |
| `man NAME` | Manual page (`q` quits, `/word` searches) |

## Paths and files

| Command | What it does |
|---|---|
| `pwd` | Prints the working directory |
| `ls`, `ls -l`, `ls -a`, `ls -ld DIR` | Lists: names, details, hidden files too, the directory itself |
| `cd DIR`, `cd ..`, `cd` | Goes to DIR, up one level, home |
| `mkdir DIR`, `mkdir -p A/B` | Makes a directory, with missing parents |
| `touch FILE` | Creates an empty file |
| `cp A B`, `cp -r A B` | Copies a file, a directory |
| `mv A B` | Moves or renames |
| `rm FILE`, `rmdir DIR`, `rm -r DIR` | Deletes a file, an empty directory, a directory and its content. No undo |

`/` is the root, `~` your home, `.` here, `..` the parent. A path that starts with `/` is absolute, any other is relative.

## Reading and editing

| Command | What it does |
|---|---|
| `cat FILE`, `cat -n FILE` | Prints a file, with line numbers |
| `head -n 5 FILE`, `tail -n 5 FILE` | First or last 5 lines (10 without `-n`) |
| `tail -f FILE` | Follows a growing file; Ctrl+C stops |
| `wc -l FILE` | Counts the lines |
| `less FILE` | Pager: Space, `b`, `/word`, `n`, `g`, `G`, `q` |
| `nano FILE` | Editor: Ctrl+O save, Ctrl+X exit, Ctrl+W search, Ctrl+K cut, Ctrl+U paste, Alt+U undo |

## Permissions

| | File | Directory |
|---|---|---|
| `r` = 4 | Read the content | List the names |
| `w` = 2 | Change the content | Create, delete, rename inside |
| `x` = 1 | Run as a program | Enter and reach what is inside |

`-rw-r--r--`: type, then owner, group, others. Common numbers: `644` normal file, `600` private file, `755` program or shared directory, `700` private directory.

| Command | What it does |
|---|---|
| `id` | Your user, your groups |
| `chmod o-r FILE`, `chmod u+x FILE`, `chmod a-w FILE` | Removes or adds one right for `u`, `g`, `o` or `a` |
| `chmod 640 FILE` | Sets all nine rights at once |
| `sudo CMD` | Runs one command as root |
| `sudo chown USER:GROUP FILE` | Changes owner and group |

## Processes

| Command | What it does |
|---|---|
| `ps`, `ps -e` | Your processes, all processes |
| `ps -o pid,ppid,comm` | Chosen columns: number, parent, name |
| `ps -p 1 -o pid,ppid,user,comm` | One process by its PID |
| `top` | Live view (`M` sorts by memory, `q` quits) |
| `CMD &` | Runs in the background |
| `pgrep -l NAME`, `pgrep -a NAME` | Finds PIDs by name, with full command line |
| `kill PID` | Sends `TERM`: please finish |
| `kill -9 PID` | Sends `KILL`: forced stop, last resort |

## Software with apt

| Command | What it does |
|---|---|
| `sudo apt update` | Refreshes the catalogue (installs nothing) |
| `sudo apt upgrade` | Installs all newer versions |
| `apt search WORD`, `apt show NAME` | Searches, reads about a package |
| `sudo apt install -y NAME` | Installs |
| `sudo apt remove NAME`, `sudo apt purge NAME` | Removes, removes with settings |
| `sudo apt autoremove` | Removes dependencies nobody needs |
| `which NAME` | Where a command lives |

## Redirection, pipes and grep

| Form | What it does |
|---|---|
| `CMD > FILE` | Output into FILE, replacing it |
| `CMD >> FILE` | Output added to the end of FILE |
| `CMD 2> FILE`, `CMD 2> /dev/null` | Errors into FILE, errors thrown away |
| `CMD1 \| CMD2` | Output of CMD1 becomes the input of CMD2 |
| `grep TEXT FILE` | Lines that contain TEXT |
| `grep -c`, `-v`, `-n`, `-i` | Count, non-matching, line numbers, ignore case |
| `cut -d ' ' -f 2` | Second piece of each line, split at spaces |
| `sort`, `sort -rn` | Alphabetical order, biggest number first |
| `uniq -c` | Merges identical neighbours and counts them (sort first) |

Example: `grep failed logins.txt | cut -d ' ' -f 2 | sort | uniq -c | sort -rn`

## Variables and PATH

| Form | What it does |
|---|---|
| `name=value`, `name="two words"` | Sets a variable (no spaces around `=`) |
| `echo "Hi $name"` | Uses the value |
| `export name` | Passes it on to child programs |
| `printenv NAME`, `echo $HOME $USER` | Reads environment variables |
| `echo $PATH` | Directories searched for commands, left to right |
| `PATH="$HOME/bin:$PATH"` | Adds your directory first |
| `type NAME` | Program or shell builtin |
| `echo 'LINE' >> ~/.bashrc` | Keeps a setting for every new shell (`>>`, never `>`) |

## Scripts

```text
#!/bin/bash
# name.sh: what it does
name=$1
if [ -z "$name" ]; then
  echo "Usage: ./name.sh NAME"
  exit 1
fi
for x in one two three; do
  echo "$name $x"
done
```

| Form | What it does |
|---|---|
| `chmod +x s.sh`, then `./s.sh` | Makes it executable, runs it |
| `bash s.sh`, `bash -x s.sh` | Runs it with Bash, shows each line as it runs |
| `$1`, `$2` | First and second argument |
| `$(CMD)` | Output of CMD, in place |
| `$?`, `exit 1` | Exit status of the last command (`0` is success), stop with status 1 |
| `[ -z "$x" ]`, `[ -f "$x" ]`, `[ -d "$x" ]` | Empty, is a file, is a directory |
| `[ "$x" = "yes" ]`, `[ ! -d "$x" ]` | Equal text, not a directory |

## mylab after Module 1

| Path | What it holds |
|---|---|
| `~/mylab/scripts/` | `sysinfo.sh` (system report), `backup.sh` (dated copy into `~/backups`) |
| `~/mylab/notes/`, `data/`, `logs/` | Notes, input files, files that programs write |
