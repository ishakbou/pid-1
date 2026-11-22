---
title: What the terminal is
description: Learn what a terminal, a shell and a command are, how to read the prompt, and how to run your first commands and ask them for help.
lesson: "1.1"
time: 15 min
practiceTerminal: true
sidebar:
  order: 1
---

Most of the computers that run the internet have no screen, no mouse and no desktop. The people who look after them type short lines of text and read short lines of text back. The window they type into is called a terminal. By the end of this lesson it will stop looking like a prop from a hacker film and start looking like a tool you can use.

## Goal

After this lesson you can:

- Explain the difference between a terminal, a shell and a command.
- Read a prompt: who you are, on which machine, in which folder.
- Run a command, give it an argument, and ask it for help.

## Why it matters

Servers, cloud machines, git, Python tools and almost every security tool are driven by typed commands. A typed command can be saved, repeated, shared with a classmate and turned into a program. A series of clicks cannot. Every module after this one assumes that you can type a command and read what comes back, so this is the first skill to build.

## The idea

Three words get mixed up all the time. They are three different things.

The **terminal** is the window. It is a simple program: it shows text and it passes your keystrokes on. It does not understand anything you type.

The **shell** is the program that runs inside the terminal. It reads the line you typed, works out what you mean, starts the right program and shows you the result. There are several shells. The one on Ubuntu is called **Bash**, and it is the one this course uses.

A **command** is one line that you give to the shell: the name of a program, often followed by a few extra words.

Think of a phone call. The terminal is the phone. The shell is the person on the other end, who listens and gets things done. A command is one sentence you say to that person. You can change the phone and still talk to the same person, and that is true here too: any terminal program can run Bash. Working this way, with typed commands instead of clicks, is called using the **command line**.

### The prompt

When the shell is ready for you, it prints a short piece of text called the **prompt**, and then it waits:

```text
sam@lab:~$
```

It looks like noise, but every part tells you something.

| Part | Meaning |
|---|---|
| `sam` | Your username: who you are on this system |
| `lab` | The **hostname**: the name of the computer you are typing on |
| `~` | The folder you are in. `~` is short for your home folder (lesson 1.2) |
| `$` | "Your turn." It also says you are an ordinary user. A `#` here means you are the administrator (lesson 1.4) |

The prompt is not part of the command. In this course, commands are shown without it, so never type the `$` yourself.

### What a command looks like

```text
echo Hello
```

The first word is always the name of the command. Everything after it is an **argument**: extra information that the command works with. Words are separated by spaces. Nothing happens until you press Enter. Then the shell runs the line, prints the result, and shows a new prompt.

## Try it

Open the terminal you set up in [Module 0](../start-here/). The outputs below come from a user called `sam` on a computer called `lab`. Your screen shows your own names.

### 1. Read your prompt

Before you type anything, look at the line that is waiting for you. Find your username, the hostname, the folder and the `$`. Your prompt may look a little different. On macOS it ends with `%`, because the shell there is zsh, a close relative of Bash. Most commands in this lesson work the same way there. Two small differences: `echo $SHELL` answers `/bin/zsh`, and the macOS versions of `whoami` and `uname` do not understand `--help`, so use `man` for them.

### 2. Run your first command

```bash
whoami
```

```output
sam
```

You typed a name, pressed Enter, and the shell started a small program called `whoami`. It printed your username and stopped. Then the prompt came back. That is the whole cycle: prompt, command, result, prompt.

### 3. Ask two more questions

```bash
hostname
```

```output
lab
```

<!-- lab: nocheck -->
```bash
date
```

```output
Sat Nov 21 18:36:15 UTC 2026
```

`hostname` prints the name of the computer, and `date` prints the current date and time. My test machine is called `lab`. The practice terminal answers `practice`, and your own computer answers with the name it was given. Compare the first two answers with your prompt: `whoami` and `hostname` gave you its first two parts.

### 4. Give a command an argument

```bash
echo Hello
```

```output
Hello
```

```bash
echo Hello from the terminal
```

```output
Hello from the terminal
```

`echo` prints its arguments back to you. The first time it got one argument, the second time four. It looks like a toy, but you will use it all the time: to print messages from scripts, and to look at values the shell remembers.

### 5. Find out which shell you are talking to

```bash
echo $SHELL
```

```output
/bin/bash
```

A word that starts with `$` is a variable: a name that stands for a value. The shell replaced `$SHELL` with its value before `echo` ever saw it. The value `/bin/bash` is the place where the Bash program is stored. Lesson 1.8 is all about variables, so for now just notice the answer.

### 6. Make a mistake on purpose

<!-- lab: nocheck -->
```bash
blorp
```

```output
blorp: command not found
```

Nothing broke. The shell looked for a program called `blorp`, found none, and told you so. You will see `command not found` often, and the cause is nearly always a typing mistake. Capital letters count: `Whoami` is not `whoami`. When Ubuntu knows a command with a similar name, it adds a suggestion to the message.

### 7. Ask a command for help

```bash
whoami --help
```

```output
Usage: whoami [OPTION]...
Print the user name associated with the current effective user ID.
Same as id -un.

      --help        display this help and exit
      --version     output version information and exit

GNU coreutils online help: <https://www.gnu.org/software/coreutils/>
Report any translation bugs to <https://translationproject.org/team/>
Full documentation <https://www.gnu.org/software/coreutils/whoami>
or available locally via: info '(coreutils) whoami invocation'
```

The extra word `--help` asks a command to describe itself instead of doing its job. Almost every command understands it. Read the second line: it says in one sentence what `whoami` does. The lines under it change a little from one version to the next, so yours may not match mine word for word.

For a longer explanation there is the **manual page**. Type `man whoami` and press Enter. The manual fills the whole window. Scroll with the arrow keys, and press `q` to quit and get your prompt back. Nobody remembers every command. People who are good at the terminal are good at looking things up.

### 8. Learn four keys that save your day

Type `sleep 30` and press Enter. The terminal looks frozen: the `sleep` command waits 30 seconds and does nothing else. Now press Ctrl+C. The command stops and the prompt comes back at once.

| Key | What it does |
|---|---|
| Ctrl+C | Stops the command that is running |
| Up arrow | Brings back the previous command, so you can run it again or fix it |
| Ctrl+L | Clears the screen (the command `clear` does the same) |
| Ctrl+D | Closes the shell (the command `exit` does the same) |

Press the Up arrow a few times now. Your earlier commands come back one by one. Pick `whoami` and press Enter to run it again.

:::tip[Stuck? Try these in order]
If the terminal does not react, press `q` first, because you may be inside a manual page. If that does nothing, press Ctrl+C. Closing the window is the last choice, not the first.
:::

## Exercise

Use only the terminal.

1. Print the sentence `I am learning Linux`.
2. The command `uname` prints the name of the operating system's core. Run it.
3. Read the help of `uname`. Find the extra word that makes it print the hostname instead, and run `uname` with it.
4. Type `Hostname`, with a capital H. What does the shell answer, and why?

<details>
<summary>Show the solution</summary>

```bash
echo I am learning Linux
```

```output
I am learning Linux
```

```bash
uname
```

```output
Linux
```

`uname --help` prints a list. One of its lines says `-n, --nodename` and "print the network node hostname". So:

```bash
uname -n
```

```output
lab
```

You get the same answer as from `hostname`. Two different commands can lead to the same information.

For step 4, the shell answers that the command was not found. Linux treats capital and small letters as different, so `Hostname` and `hostname` are two different names, and only the second one exists. Ubuntu notices how close they are and suggests `hostname`.

</details>

## Check yourself

**1. What is the difference between a terminal and a shell?**

<details>
<summary>Answer</summary>

The terminal is the window: it shows text and passes on what you type. The shell is the program inside it that reads your line, runs the right program and shows the result. Bash is a shell.

</details>

**2. Your prompt is `lina@web01:~$`. What do `lina` and `web01` mean, and what does the `$` tell you?**

<details>
<summary>Answer</summary>

`lina` is the username and `web01` is the hostname, the name of the computer. The `$` says the shell is waiting for a command and that `lina` is an ordinary user, not the administrator.

</details>

**3. In `echo Hello world`, which word is the command, and how many arguments does it get?**

<details>
<summary>Answer</summary>

`echo` is the command, because it is the first word. It gets two arguments: `Hello` and `world`.

</details>

**4. A command seems to run forever and you want your prompt back. What do you press?**

<details>
<summary>Answer</summary>

Ctrl+C. It stops the command that is running. If you are inside a manual page, press `q` instead.

</details>

**5. Name two ways to find out what a command does without leaving the terminal.**

<details>
<summary>Answer</summary>

Add `--help` after the command name, for example `whoami --help`. Or open its manual page with `man`, for example `man whoami`.

</details>

## Common mistakes

- **Typing the `$` from an example.** The `$` belongs to the prompt. If you type it, the shell answers `$: command not found`. Type only what comes after it.
- **Forgetting the space.** `echoHello` is one word, so the shell looks for a command with that name. The command and each argument need a space between them: `echo Hello`.
- **Waiting for a "done" message.** Many commands print nothing when they succeed. If the prompt is back and there is no error, it worked.
- **Feeling trapped in a manual page.** The page does not close by itself. Press `q`.
- **Pasting commands you do not understand.** A command copied from a website runs with all your rights. Read it first, and look up the parts you do not know with `--help` or `man`.

## Key terms

- **Terminal**: the window that shows text and sends your keystrokes to the shell.
- **Shell**: the program that reads your commands, runs them and prints the results.
- **Bash**: the shell that Ubuntu uses by default, and the one this course teaches.
- **Command**: one line given to the shell: the name of a program, often followed by arguments.
- **Argument**: an extra word after the command name that tells the command what to work with.
- **Prompt**: the short text, such as `sam@lab:~$`, that the shell prints when it is ready for a command.
- **Command line**: the way of using a computer by typing commands instead of clicking.
- **Hostname**: the name of a computer. It appears in the prompt after the `@`.
- **Manual page**: the built-in documentation of a command, opened with `man`.

## Go further

- [Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html): the official manual of the shell. Its first chapter, "What is Bash?", is short and readable.
- [Ubuntu manual pages](https://manpages.ubuntu.com/): every manual page of Ubuntu, searchable in the browser.
- [The Linux command line for beginners](https://ubuntu.com/tutorials/command-line-for-beginners): Ubuntu's own tutorial, with a short history of where terminals come from.
