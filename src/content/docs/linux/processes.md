---
title: Processes
description: See which programs are running with ps and top, find out who started them, and stop one with kill.
lesson: "1.5"
time: 20 min
sidebar:
  order: 5
---

The fan of your laptop starts to roar. Something is eating the processor, and you want to know what it is and make it stop. On a desktop you would open a task manager. In the terminal you ask two questions: what is running, and who started it?

<!-- lab: run
pkill -x sleep
true
-->

## Goal

After this lesson you can:

- List running processes and read their number, their owner and their parent.
- Start a command in the background and find it again.
- Stop a process with `kill`, and tell asking from forcing.

## Why it matters

A server is, in the end, a set of running programs. "Is the web server still running?" and "What is this thing that uses all the memory?" are daily questions for anyone who looks after one. For a defender there is more: malware is a running program too. Spotting a process that should not be there, and seeing who started it, is one of the first steps when you investigate a machine.

## The idea

A **program** is a file on the disk: instructions that wait to be used. A **process** is a program that is running right now.

Think of a recipe and a cook. The recipe is the program: it sits in a book and does nothing. A cook who follows it is a process. Three cooks can follow the same recipe at the same time, each with their own pot. In the same way, one program can run as several processes at once, and each one has its own memory.

Linux keeps a few facts about every process:

- A number, the **PID** (process ID). No two running processes share one.
- An owner: the user who started it. A process may do what its user may do. This is where the permissions of lesson 1.4 are enforced.
- A parent: the process that started it. Its number is called the **PPID** (parent process ID).

Since every process has a parent, they form a family tree:

```text
systemd            PID 1, started by Linux itself
  └─ ...
      └─ bash      your shell
          ├─ sleep     a command you started
          └─ ps        another one
```

Follow the parents upward from any program you start and you always end at PID 1, the first process that the system starts. Now you know where this course gets its name.

To stop a process, you do not reach into it. You send it a **signal**: a short message such as "please finish". The command that sends signals has a dramatic name, `kill`.

## Try it

The numbers in the outputs below change on every machine and on every run. Yours are different.

### 1. List your processes

<!-- lab: nocheck -->
```bash
ps
```

```output
    PID TTY          TIME CMD
   2821 pts/0    00:00:00 bash
   2831 pts/0    00:00:00 ps
```

`ps` lists the processes that belong to this terminal. There are two: `bash`, your shell, and `ps` itself, which was running at the moment it made the list. `PID` is the process number. `TTY` is the terminal the process is attached to. `TIME` is how much processor time it has used so far, not how long it has existed. `CMD` is the name of the program.

### 2. Start a slow command in the background

<!-- lab: nocheck -->
```bash
sleep 300 &
```

```output
[1] 2832
```

You met `sleep` in lesson 1.1: it waits and does nothing else, which makes it a perfect test subject. The `&` at the end of the line tells the shell to run the command in the **background**. The shell starts it, prints a job number in brackets and the PID, and gives you the prompt back at once. Without the `&`, the command runs in the foreground and you wait until it ends.

<!-- lab: nocheck -->
```bash
ps
```

```output
    PID TTY          TIME CMD
   2821 pts/0    00:00:00 bash
   2832 pts/0    00:00:00 sleep
   2833 pts/0    00:00:00 ps
```

There it is, with the PID that the shell announced.

### 3. See who started what

<!-- lab: nocheck -->
```bash
ps -o pid,ppid,comm
```

```output
    PID    PPID COMMAND
   2821    2820 bash
   2832    2821 sleep
   2834    2821 ps
```

The `-o` option chooses the columns. Look at the `PPID` column: `sleep` and `ps` both have the parent `2821`, and `2821` is `bash`. Your shell started them, so your shell is their parent. The parent of `bash` itself, `2820`, is the program that gave you this terminal.

```bash
ps -p 1 -o pid,ppid,user,comm
```

```output
    PID    PPID USER     COMMAND
      1       0 root     systemd
```

`-p` asks about one PID. Process number 1 belongs to root, and on Ubuntu it is a program called `systemd`, which starts and watches everything else. Its parent is shown as `0`: there is no process above it. In GitHub Codespaces, and on some WSL setups, you may see another name in the last column, because those systems start in a different way.

### 4. Watch the whole machine

`ps -e` prints every process on the system. Try it: on a full Ubuntu machine expect more than a hundred lines, and fewer on WSL or in a codespace. Lesson 1.7 shows how to cut such a list down to what you need.

To see who is using the processor right now, type `top` and press Enter. Like `less`, `top` takes over the window. The lines at the top summarise the machine: how many processes exist, how busy the processor is, how much memory is free. Below them is a table that refreshes every few seconds, with the hungriest process first.

| Column | Meaning |
|---|---|
| `PID` | The process number |
| `USER` | The owner of the process |
| `%CPU` | The share of the processor it uses right now |
| `%MEM` | The share of the memory it uses |
| `COMMAND` | The name of the program |

Press `M` (a capital letter) to sort by memory instead, and `q` to quit. When a machine feels slow, `top` is the first place to look.

### 5. Find a process by name

<!-- lab: nocheck -->
```bash
pgrep -l sleep
```

```output
2832 sleep
```

`pgrep` searches the running processes by name and prints the PIDs it finds. With `-l` it adds the name. It is quicker than reading through a long `ps` list.

### 6. Stop the process

Use the PID that your own `pgrep` printed:

<!-- lab: skip -->
```bash
kill 2832
```

<!-- lab: run
pkill -x sleep
sleep 0.5
-->

<!-- lab: nocheck -->
```bash
ps
```

```output
    PID TTY          TIME CMD
   2821 pts/0    00:00:00 bash
   2837 pts/0    00:00:00 ps
[1]+  Terminated              sleep 300
```

`kill` prints nothing itself. The process is gone from the list, and the shell reports that job 1 was terminated.

Despite its name, plain `kill` is polite. It sends a signal called `TERM`, which means "please finish". The program may save its work and tidy up before it leaves. A program that is frozen may not react at all. For that case there is a stronger signal:

| What you do | Signal | Meaning |
|---|---|---|
| Press Ctrl+C | `INT` | "Stop", sent from the keyboard to the command in the foreground |
| `kill PID` | `TERM` | "Please finish." The process can clean up first |
| `kill -9 PID` | `KILL` | Forced stop. The process cannot refuse and cannot clean up |

:::caution[Ask first, force last]
`kill -9` gives the program no chance to save anything, so files it was writing can be left half finished. Send a plain `kill`, wait a few seconds, and use `-9` only if the process is still there.
:::

### 7. Try to stop a process that is not yours

<!-- lab: nocheck -->
```bash
kill 1
```

```output
bash: kill: (1) - Operation not permitted
```

PID 1 belongs to root, and you are not root. You may send signals only to your own processes. This is the same protection you saw with files in lesson 1.4, applied to running programs. An administrator can stop another user's process with `sudo kill`, and should think twice before doing it.

## Exercise

1. Start `sleep 600` and `sleep 700`, both in the background.
2. List them with their PID and their full command line. The help of `pgrep` tells you which option shows the full command line.
3. Stop only `sleep 700`, with a forced stop.
4. Check that one `sleep` is left.
5. Stop the other one the polite way, and check that none is left.

<details>
<summary>Show the solution</summary>

<!-- lab: nocheck -->
```bash
sleep 600 &
sleep 700 &
pgrep -a sleep
```

```output
[1] 2838
[2] 2839
2838 sleep 600
2839 sleep 700
```

`pgrep -a` prints the PID and the whole command line, so you can tell the two apart. Now stop the second one, with your own PID:

<!-- lab: skip -->
```bash
kill -9 2839
```

<!-- lab: run
pkill -9 -f "sleep 700"
sleep 0.5
-->

<!-- lab: nocheck -->
```bash
pgrep -a sleep
```

```output
2838 sleep 600
[2]+  Killed                  sleep 700
```

The shell says `Killed`, not `Terminated`: that is the mark of signal 9. One `sleep` is left. Stop it the polite way:

<!-- lab: skip -->
```bash
kill 2838
```

<!-- lab: run
pkill -x sleep
sleep 0.5
-->

<!-- lab: nocheck -->
```bash
pgrep -a sleep
```

```output
[1]+  Terminated              sleep 600
```

`pgrep` finds nothing and prints nothing. The only line comes from the shell, which reports the end of job 1.

</details>

## Check yourself

**1. What is the difference between a program and a process?**

<details>
<summary>Answer</summary>

A program is a file on the disk. A process is a program that is running. One program can run as several processes at the same time, each with its own PID.

</details>

**2. What does the PPID of a process tell you?**

<details>
<summary>Answer</summary>

The PID of its parent: the process that started it. For a command you type, the parent is your shell.

</details>

**3. What does the `&` at the end of `sleep 300 &` do?**

<details>
<summary>Answer</summary>

It runs the command in the background. The shell prints the job number and the PID, and gives the prompt back at once instead of waiting for the command to end.

</details>

**4. What is the difference between `kill 4242` and `kill -9 4242`, and which one do you try first?**

<details>
<summary>Answer</summary>

`kill 4242` sends `TERM`: it asks the process to finish, and the process can clean up first. `kill -9 4242` sends `KILL`: the process is stopped at once and cannot clean up. Try the plain `kill` first.

</details>

**5. You run `kill` on a process that belongs to root and get `Operation not permitted`. Why?**

<details>
<summary>Answer</summary>

An ordinary user may send signals only to their own processes. The process belongs to another user, so the system refuses.

</details>

## Common mistakes

- **Reaching for `kill -9` first.** It works, and that is the problem: the program cannot save anything. Use plain `kill`, wait, and force only when needed.
- **Using an old PID.** PIDs change every time a program starts, and the system reuses old numbers. Look the PID up with `pgrep` or `ps` right before you use it.
- **`No such process`.** The process has already ended, or you mistyped the number. Check with `ps`.
- **Reading `TIME` as the age of a process.** `TIME` is the processor time used. A `sleep` that has waited for an hour still shows `00:00:00`.
- **Forgetting that `top` is still open.** While `top` runs, the shell does not listen to you. Press `q` first.
- **Killing things you do not know with `sudo`.** System processes keep your session and your machine alive. Find out what a process is before you stop it.

## Key terms

- **Program**: a file that contains instructions the computer can run.
- **Process**: a program that is running. It has its own PID, owner and memory.
- **PID**: the process ID, a number that identifies one running process.
- **PPID**: the parent process ID, the PID of the process that started this one.
- **Background**: a way to run a command, with `&`, so that the shell does not wait for it.
- **Signal**: a short message sent to a process, for example `TERM` ("please finish") or `KILL` (forced stop).
- **systemd**: the program that runs as PID 1 on Ubuntu. It starts and watches the other system processes.

## Go further

- [Ubuntu manual page: ps](https://manpages.ubuntu.com/manpages/noble/en/man1/ps.1.html): the full reference, with every column that `ps -o` can show.
- [Linux manual page: signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html): the list of all signals and what each one does by default.
- [systemd](https://systemd.io/): the home page of the project behind PID 1 on most Linux systems.
