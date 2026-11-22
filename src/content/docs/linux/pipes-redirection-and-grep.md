---
title: Pipes, redirection and grep
description: Send the output of a command into a file or into another command, keep errors apart, and search text with grep.
lesson: "1.7"
time: 25 min
practiceTerminal: true
sidebar:
  order: 7
---

So far, every command has printed its answer on the screen, and the answer stopped there. In this lesson the answer goes somewhere else: into a file, or straight into the next command. That one change turns a drawer of small tools into a workshop. By the end, five short commands joined together will tell you which account on a server was attacked most often.

<!-- lab: run
mkdir -p ~/playground
-->

## Goal

After this lesson you can:

- Save the output of a command in a file, and add to a file without erasing it.
- Join commands with a pipe, so that one command works on the output of another.
- Search text with `grep`, and keep error messages apart from normal output.

## Why it matters

Real files are long. A log of one busy day can hold a million lines, and no person reads that. With pipes you can ask precise questions of it in one line: how many failed logins, from which accounts, in what order. Defenders do this every day, and the same skill helps you find one setting in a large configuration file or one process in a list of two hundred.

## The idea

Every command you start gets three channels for text, called **streams**:

| Stream | Number | What it carries | Where it goes by default |
|---|---|---|---|
| **Standard input** | 0 | Text the command reads | Your keyboard |
| **Standard output** | 1 | The normal result | The screen |
| **Standard error** | 2 | Error messages | The screen |

Both output streams end on the screen, so they look like one. They are not, and that difference becomes useful soon.

**Redirection** sends a stream somewhere else. `>` sends standard output into a file, and `2>` does the same for standard error.

A **pipe**, written `|`, joins two commands: the standard output of the left one becomes the standard input of the right one. Think of an assembly line. Each worker does one small job and puts the result on a belt to the next worker. Nobody needs to know what the others do, only that text arrives on the belt and text leaves on it. Commands built for this, which read text, keep or change some lines and pass the rest on, are called **filters**.

The most useful filter is `grep`. It reads lines and keeps only the ones that contain a piece of text, called the **pattern**.

## Try it

### 1. Save output in a file

```bash
mkdir -p ~/playground
cd ~/playground
echo "first line" > today.txt
cat today.txt
```

```output
first line
```

The first line makes sure the `playground` directory exists. With `-p`, `mkdir` creates it when it is missing and stays quiet when it is already there. The practice terminal starts as a fresh system on every page, so there it is always missing.

`echo` printed nothing on the screen. The shell sent its output into `today.txt`, and created the file because it did not exist.

```bash
echo "second line" > today.txt
cat today.txt
```

```output
second line
```

The first line is gone. `>` empties the file before it writes, every time, without asking.

```bash
echo "third line" >> today.txt
cat today.txt
```

```output
second line
third line
```

`>>` appends: it adds to the end of the file and keeps what was there.

### 2. Create a file to search

With nano, create `logins.txt` in `~/playground` with these lines. Each one records a login attempt on a small server: the time, the account, and the result.

```text title="logins.txt"
08:02 alice ok
08:15 bob failed
08:15 bob failed
08:16 bob ok
09:40 root failed
09:40 root failed
09:41 root failed
09:41 root failed
10:05 carol ok
11:30 admin failed
11:31 admin failed
11:58 alice ok
```

### 3. Search with grep

```bash
grep root logins.txt
```

```output
09:40 root failed
09:40 root failed
09:41 root failed
09:41 root failed
```

`grep` printed every line that contains `root`, and nothing else. First the pattern, then the file.

A few options change what `grep` does:

| Option | Meaning |
|---|---|
| `-c` | Print only how many lines match |
| `-v` | Keep the lines that do not match |
| `-n` | Put the line number in front of each match |
| `-i` | Ignore the difference between capital and small letters |

```bash
grep -c failed logins.txt
grep -v failed logins.txt
```

```output
8
08:02 alice ok
08:16 bob ok
10:05 carol ok
11:58 alice ok
```

Eight attempts failed, and `-v` shows the four that worked.

### 4. Join two commands with a pipe

```bash
grep failed logins.txt | grep bob
```

```output
08:15 bob failed
08:15 bob failed
```

The first `grep` kept the failed attempts. Instead of going to the screen, its output went through the pipe into the second `grep`, which kept only the lines with `bob`. The second `grep` has no file name: it reads from the pipe.

```bash
grep failed logins.txt | wc -l
```

```output
8
```

`wc -l` counted the lines that came through the pipe. It prints no file name this time, because it did not read a file.

### 5. Build a pipeline step by step

Now the question from the start: which accounts were attacked, and how often? Add one command at a time and look at the result each time.

```bash
grep failed logins.txt | cut -d ' ' -f 2
```

```output
bob
bob
root
root
root
root
admin
admin
```

`cut` cuts each line into pieces and keeps some of them. `-d ' '` says the pieces are separated by a space, and `-f 2` keeps the second piece: the account.

```bash
grep failed logins.txt | cut -d ' ' -f 2 | sort | uniq -c
```

```output
      2 admin
      2 bob
      4 root
```

`sort` puts the lines in alphabetical order. `uniq -c` then merges identical lines that sit next to each other and writes how many there were in front. That is why `sort` must come first: `uniq` only sees neighbours.

```bash
grep failed logins.txt | cut -d ' ' -f 2 | sort | uniq -c | sort -rn
```

```output
      4 root
      2 bob
      2 admin
```

The last `sort` orders by number (`-n`), largest first (`-r`, for reverse). Somebody tried `root` four times. That is typical: attackers try `root` and `admin` because those names exist on many machines.

A command line like this one, with several commands joined by pipes, is called a **pipeline**. Each part is simple. The power comes from the chain.

### 6. Save the answer

```bash
grep failed logins.txt | cut -d ' ' -f 2 | sort | uniq -c | sort -rn > attacked.txt
cat attacked.txt
```

```output
      4 root
      2 bob
      2 admin
```

The `>` at the end catches the output of the whole pipeline. Your report is in a file now, ready to keep or to send.

### 7. Keep errors apart

```bash
ls today.txt missing.txt > found.txt
```

```output
ls: cannot access 'missing.txt': No such file or directory
```

The error still appeared on the screen, even with `>`. That is the difference between the two output streams: `>` caught standard output only, and the error travelled on standard error.

```bash
cat found.txt
```

```output
today.txt
```

The normal part of the answer went into the file. To catch errors, put `2>` in front of a file name:

```bash
ls today.txt missing.txt 2> errors.txt
cat errors.txt
```

```output
today.txt
ls: cannot access 'missing.txt': No such file or directory
```

Now the normal output came to the screen, and the error went into `errors.txt`. When you want to throw errors away, send them to `/dev/null`, a special file that swallows everything written to it: `ls today.txt missing.txt 2> /dev/null`.

:::tip[Pipe into less]
When a command prints more than one screen, end the line with `| less`. You get the pager from lesson 1.3, with search and all. And remember the long `ps -e` list of lesson 1.5: `ps -e | grep bash` keeps only the lines you care about.
:::

## Exercise

The file `/etc/passwd` has one line per user account. The last part of each line is the shell that the account starts when somebody logs in. Work in `~/playground`.

1. How many lines of `/etc/passwd` contain `/bin/bash`?
2. Print only the account names of those lines. In this file the parts are separated by `:`, and the name is the first part.
3. Save those names in a file called `bash-users.txt`.
4. Add the line `checked by me` at the end of `bash-users.txt` without losing the names, and print the file.

<details>
<summary>Show the solution</summary>

```bash
grep -c /bin/bash /etc/passwd
```

```output
2
```

```bash
grep /bin/bash /etc/passwd | cut -d ':' -f 1
```

```output
root
sam
```

Your list shows your own username, and maybe a few more. In the practice terminal the count is `1` and the list has only `sam`, because its `root` account starts another shell, `/bin/sh`.

```bash
grep /bin/bash /etc/passwd | cut -d ':' -f 1 > bash-users.txt
echo "checked by me" >> bash-users.txt
cat bash-users.txt
```

```output
root
sam
checked by me
```

If your file contains only `checked by me`, you used `>` instead of `>>` on the second line.

</details>

## Check yourself

**1. What is the difference between `echo hi > notes.txt` and `echo hi >> notes.txt`?**

<details>
<summary>Answer</summary>

`>` empties `notes.txt` first and then writes `hi`, so only `hi` is left. `>>` adds `hi` at the end and keeps the old content. Both create the file if it does not exist.

</details>

**2. What does the `|` in `grep failed logins.txt | wc -l` do?**

<details>
<summary>Answer</summary>

It sends the standard output of `grep` into the standard input of `wc`. `wc -l` then counts the lines that `grep` kept, here the failed attempts.

</details>

**3. You run `ls a.txt nothere.txt > out.txt` and an error still appears on the screen. Why, and how do you keep it off the screen?**

<details>
<summary>Answer</summary>

The error travels on standard error, and `>` only redirects standard output. Add `2>` with a file name to catch it, or `2> /dev/null` to throw it away.

</details>

**4. Why does `uniq -c` usually come right after `sort`?**

<details>
<summary>Answer</summary>

`uniq` only merges identical lines that sit next to each other. `sort` puts identical lines together first, so that `uniq -c` counts each one only once.

</details>

**5. Which `grep` option prints the lines that do not contain the pattern?**

<details>
<summary>Answer</summary>

`-v`. For example, `grep -v failed logins.txt` prints the attempts that worked.

</details>

## Common mistakes

- **Redirecting into the file you are reading.** `sort logins.txt > logins.txt` leaves you with an empty file: the shell empties the target before `sort` even starts. Write into a new file, then rename it with `mv`.
- **Using `>` when you meant `>>`.** One character, and the old content is gone without a warning. Read the line again before you press Enter.
- **A pattern with a space and no quotes.** `grep bob failed logins.txt` searches for `bob` in two files, `failed` and `logins.txt`, and complains that `failed` does not exist. Put quotes around the pattern: `grep "bob failed" logins.txt`.
- **Forgetting that `grep` cares about capital letters.** `grep Root` does not find `root`. Add `-i` if the case does not matter.
- **Counting with `uniq` and no `sort`.** The same name appears several times in the result, each with a small count. Put `sort` before `uniq -c`.

## Key terms

- **Stream**: a channel that carries text into or out of a running command.
- **Standard input**: the stream a command reads from: the keyboard, a file or a pipe.
- **Standard output**: the stream that carries the normal result of a command. By default it goes to the screen.
- **Standard error**: the stream that carries error messages. It goes to the screen even when standard output is redirected.
- **Redirection**: sending a stream to a file instead of the screen, with `>`, `>>` or `2>`.
- **Pipe**: the `|` sign, which sends the standard output of one command into the standard input of the next.
- **Pipeline**: several commands joined by pipes.
- **Filter**: a command that reads lines, keeps or changes some of them, and passes the result on, such as `grep`, `sort` or `cut`.
- **Pattern**: the piece of text that `grep` looks for in each line.

## Go further

- [Bash Reference Manual: Redirections](https://www.gnu.org/software/bash/manual/html_node/Redirections.html): every form of redirection that Bash understands, including some you will meet later.
- [GNU grep manual](https://www.gnu.org/software/grep/manual/grep.html): the official reference for `grep` and its patterns.
- [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/): levels 7 and 8 are solved with the tools of this lesson.
