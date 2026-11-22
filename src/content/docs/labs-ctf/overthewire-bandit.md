---
title: OverTheWire Bandit
description: How to connect to the Bandit wargame, how to work through a level when you are stuck, and which skills the first levels train, without giving any solution away.
lesson: "14.2"
time: 20 min
sidebar:
  order: 2
---

What if a game had no graphics, no mouse and no controller, only a terminal on someone else's computer? That is Bandit, a free game from the OverTheWire community, and it has taught Linux to a whole generation of security people. Each level hides a password somewhere on a server. You find it, and the next level opens. This lesson gets you connected and gives you a method for the moment you are stuck, which will come.

## Goal

After this lesson you can:

- Connect to Bandit with SSH and move from one level to the next.
- Find the right command for a level with `man`, `whatis` and `--help`, and test it safely on your own files first.
- Keep your progress in a private notes file, without spoiling the game for anyone.

## Why it matters

Reading about commands is not the same as needing one. In Bandit, every level is a small real problem on a real server, and the only way through is to read a manual page, try something and look at the result. That loop is exactly the daily work of a system administrator or a security analyst. Bandit is also legal practice by design: the people who run it invite you to explore it.

## The idea

Bandit is a **wargame**: a set of levels on a server that its owners built for players to explore and break, with permission given to everyone. It is a kind of CTF, a word the next lesson explains in full. Each level is a user account on the same server: `bandit0`, `bandit1`, `bandit2` and so on. You log in as `bandit0`, look around, and find the password of `bandit1`. Then you log out, log in as `bandit1` with that password, and look for the password of `bandit2`.

Think of an escape room with a long row of rooms. Each room holds the key to the next door, and a note on the wall lists the tools in the room's toolbox. Nobody tells you how to use them. On each level page, that note is the section "Commands you may need to solve this level", together with the level goal, which says where the password is hidden in words.

The first dozen or so levels train skills you met in [Module 1](../linux/), plus a few new ones:

| Skill | Commands that help |
|---|---|
| Logging in to another machine | `ssh` |
| Reading files, including ones with awkward names | `ls`, `cat`, quotes, paths |
| Finding hidden and unusual files | `ls -a`, `file`, `find` |
| Searching inside files | `grep`, `sort`, `uniq` |
| Undoing simple encodings | `base64`, `tr` |
| Unpacking files packed several times | `xxd`, `gzip`, `tar` |

This table is all the help this lesson gives about the levels themselves. The fun of Bandit is the moment it clicks, and a spoiler steals that moment.

When you get stuck, climb this ladder one step at a time:

1. Read the level goal again, word by word. Most mistakes come from a word you skipped.
2. List what is there with `ls -la` and look at each file with `file`.
3. Read the manual of every command the level page suggests.
4. Test what you read on your own practice files, where you know the right answer.
5. After 30 minutes without progress, take a break. It works more often than you would think.
6. Search the web for the concept, such as "linux find files by owner", never for the level.

## Try it

Steps 1 and 2 need an internet connection and your own terminal. Steps 3 to 6 work offline.

### 1. Connect to level 0

<!-- lab: skip -->
```bash
ssh bandit0@bandit.labs.overthewire.org -p 2220
```

**SSH** (secure shell) opens a terminal on another computer over an encrypted connection; [lesson 11.2](../system-security/ssh-and-keys/) explains how it works. Here, `bandit0` is the user, the part after the `@` is the server, and `-p 2220` is the port. Bandit does not use the usual SSH port 22. The first time, SSH shows the server's key fingerprint and asks whether to continue: type `yes`. Then it asks for the password, which the level 0 page gives you. The screen stays blank while you type it, which is normal.

Once you are in, your prompt starts with `bandit0@bandit`. Every command you type now runs on their server, not yours. Type `exit` to come back.

### 2. Save typing with an SSH config entry

You will type that long command dozens of times. SSH reads shortcuts from the file `~/.ssh/config`. Create the folder first:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

Then add these lines to `~/.ssh/config` (create the file if it does not exist, or add them at the end if it does):

```text title=".ssh/config"
Host bandit
    HostName bandit.labs.overthewire.org
    Port 2220
```

`Host` is the nickname, and the indented lines say what the nickname means. SSH expects its settings files to be changeable by you alone, so lock the file the same way as the folder, then check what SSH understood, without connecting:

```bash
chmod 600 ~/.ssh/config
ssh -G bandit 2>/dev/null | grep -E '^(hostname|port) '
```

```output
hostname bandit.labs.overthewire.org
port 2220
```

`ssh -G` prints the settings SSH would use for a name, then stops. It prints dozens of lines, so `grep` keeps the two you care about. `2>/dev/null` throws away any warning SSH writes to standard error (lesson 1.7), such as the one it prints when it is not started from a normal terminal, so that only those two lines remain. From now on, `ssh bandit5@bandit` is enough for level 5: the user changes with every level, the rest stays.

### 3. Keep a private notes file

You need every password again whenever you come back to the game, so write them down, in a file only you can read:

```bash
mkdir -p ~/bandit
cd ~/bandit
printf 'level | password for the next level | what I learned\n' > notes.txt
chmod 600 notes.txt
ls -l notes.txt
```

```output
-rw------- 1 sam sam 53 Nov 21 21:40 notes.txt
```

`600` means read and write for you, nothing for anyone else, as in lesson 1.4. The third column is the important one: after a few weeks, "what I learned" turns your notes into your own Linux reference. You see your own name instead of `sam`, and your own date.

### 4. Find the right command

The level page gives you command names, not instructions. Three tools tell you what a command is for. `whatis` gives one line per command:

```bash
whatis ssh find file
```

```output
ssh (1)              - OpenSSH remote login client
find (1)             - search for files in a directory hierarchy
FILE (3type)         - input/output stream
file (1)             - determine file type
```

The number in brackets is the section of the manual. Section 1 holds the commands you type; other sections are for programmers, like `FILE (3type)` here, which you can ignore. When you do not know the command's name, search the one-line descriptions with `man -k`:

```bash
man -k temporary | grep '(1)'
```

```output
git-unpack-file (1)  - Creates a temporary file with a blob's contents
mktemp (1)           - create a temporary file or directory
tempfile (1)         - create a temporary file in a safe manner
```

`grep '(1)'` keeps only commands. Three candidates, and the descriptions decide: `git-unpack-file` is a git tool, `tempfile` only makes files, and `mktemp` makes a file "or directory", so it is the one to read about. You will need it in step 6.

And when you know the command but not the option, ask the command itself and filter its help with `grep`:

```bash
ls --help | grep -e '-a,'
```

```output
  -a, --all                  do not ignore entries starting with .
```

The `-e` tells `grep` that `-a,` is the pattern, not an option of `grep`. For the full story, `man find` opens the manual page: press `/` to search inside it, `n` for the next match and `q` to quit.

### 5. Test an idea on your own files first

Say the manual taught you that `find -empty` finds empty files. Before you trust it on the game server, try it where you already know the answer:

```bash
mkdir -p ~/bandit/sandbox/inner
cd ~/bandit/sandbox
echo "not empty" > full.txt
touch empty.txt inner/also-empty.txt
find . -type f -empty | sort
```

```output
./empty.txt
./inner/also-empty.txt
```

You made two empty files and one full one, and `find` found exactly the two. Now you know what the option does, and you can use it on the server with confidence. `-type f` limits the search to files; without it, an empty directory would match too. Five minutes in a sandbox often saves an hour of guessing.

### 6. Make a private scratch folder

On Bandit, your home directory usually does not let you create files, and the server is shared by every player at the same time. When a level needs room to work, make your own folder in `/tmp`:

<!-- lab: nocheck -->
```bash
work=$(mktemp -d)
echo "$work"
ls -ld "$work"
```

```output
/tmp/tmp.J3mX2Xebbt
drwx------ 2 sam sam 4096 Nov 21 21:35 /tmp/tmp.J3mX2Xebbt
```

`mktemp -d` creates a directory with a random name that nobody can guess, readable only by you (`drwx------`). The `$( )` puts its answer into the variable `work`, so `cd "$work"` takes you there. Your name and date will differ. A folder called `/tmp/test` would be a bad idea: another player may already have it, or may be reading it.

## Exercise

Use the ladder from "The idea" on a question you cannot answer yet: how do you list only the files in `~/bandit/sandbox` that were changed in the last 10 minutes? Find the option in the manual of `find` (search for "modified" or "minutes"), test it on the sandbox, and then make sure it really filters: change one file's date to two hours ago with `touch -d '2 hours ago' full.txt` and run it again.

<details>
<summary>Show the solution</summary>

The option is `-mmin`: `-mmin -10` means "modified less than 10 minutes ago".

```bash
cd ~/bandit/sandbox
find . -type f -mmin -10 | sort
```

```output
./empty.txt
./full.txt
./inner/also-empty.txt
```

All three were just created, so all three match. That does not prove much yet, so make one of them old:

```bash
touch -d '2 hours ago' full.txt
find . -type f -mmin -10 | sort
```

```output
./empty.txt
./inner/also-empty.txt
```

Now `full.txt` is gone from the list, which shows that the option really filters on time. This last test is the point of the sandbox: you checked the command against a case where you knew the answer should change.

</details>

## Check yourself

**1. In `ssh bandit0@bandit.labs.overthewire.org -p 2220`, what are `bandit0` and `-p 2220`?**

<details>
<summary>Answer</summary>

`bandit0` is the user you log in as. `-p 2220` sets the port, because Bandit does not listen on the usual SSH port 22.

</details>

**2. You found a password while logged in as `bandit4`. Which user do you log in as with it?**

<details>
<summary>Answer</summary>

`bandit5`. The password you find on a level always opens the next level.

</details>

**3. Why test a command on your own sandbox before using it on the game server?**

<details>
<summary>Answer</summary>

In the sandbox you know the right answer, so you can see what the command really does. On the server you do not know the answer, so a wrong result would look the same as a right one.

</details>

**4. Why is `mktemp -d` better than `mkdir /tmp/work` on a shared server?**

<details>
<summary>Answer</summary>

`mktemp -d` picks a random name that no one else has or can guess, and makes the folder readable only by you. `/tmp/work` may already exist, belong to someone else, or be readable by other players.

</details>

**5. You have been stuck on a level for 40 minutes. What is a good next step that does not spoil the level?**

<details>
<summary>Answer</summary>

Take a break, then read the goal again word by word and reread the manual of the suggested commands. If you search the web, search for the concept, not for the level's solution.

</details>

## Common mistakes

- **Forgetting `-p 2220`.** Without it, SSH tries the usual port 22, where the Bandit login does not work. Use the config entry from step 2.
- **Copying the password with an extra space or newline.** The login then fails for no visible reason. Copy exactly the password, or type it.
- **Logging in to the wrong level.** The password of level 5 is for user `bandit5`, not `bandit4`. Your notes file prevents most of these mix-ups.
- **Reading a walkthrough after five minutes.** You get the password and lose the skill, which was the only prize. Use the ladder first.
- **Publishing your passwords or solutions.** It spoils the game for others. Read the rules page on overthewire.org, and keep your notes private.

## Key terms

- **Wargame**: a set of levels on a server that its owners built for players to explore and break, with permission given to everyone.
- **SSH**: a program and protocol that opens a terminal on another computer over an encrypted connection.
- **Manual section**: the number after a name in `man` and `whatis`, such as `(1)` for commands you type.
- **Sandbox**: a small place you control, with files you made, where you can test commands without risk.

## Go further

- [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/): the game itself. Start at level 0 and read the page of each level carefully.
- [OverTheWire: Rules](https://overthewire.org/rules/): what the site allows, and how to behave on its shared servers.
- [find manual page](https://man7.org/linux/man-pages/man1/find.1.html): the full manual of the command you will use most in the early levels.
