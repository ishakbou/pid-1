---
title: Environment variables and PATH
description: Read and set shell variables, pass them on to other programs with export, and control where the shell looks for commands with PATH.
lesson: "1.8"
time: 20 min
sidebar:
  order: 8
---

Type `ls` and it works. Type `/usr/bin/ls` and you get exactly the same result, because it is the same program. The long version tells the shell where the program lives. The short version does not, and yet the shell finds it in a fraction of a second among thousands of files. The answer is one line of text that the shell carries around, and in this lesson you read it and change it.

<!-- lab: run
cp /etc/skel/.bashrc ~/.bashrc
-->

## Goal

After this lesson you can:

- Read, create and change variables in the shell.
- Explain the difference between a shell variable and an environment variable.
- Add your own directory to `PATH`, so that your own commands run like any other.

## Why it matters

Programs read settings from variables all the time: your username, your home directory, your language, the editor you prefer. When a command works in one terminal and not in another, a different variable is often the reason. `PATH` matters most of all. "command not found" for a program that you know is installed is almost always a `PATH` problem, and Python tools, Git and the scripts of the next lesson all depend on it. It is also a security topic: whoever can change your `PATH` can decide which program runs when you type `ls`.

## The idea

A **variable** is a name that stands for a value. You met one in lesson 1.1: the shell replaced `$SHELL` with `/bin/bash` before `echo` ever saw it. The `$` in front of the name means "put the value here".

The shell keeps two kinds. A **shell variable** lives only in the shell where you created it. An **environment variable** is passed on to every program that the shell starts. Lesson 1.5 showed that each command you type is a child process of your shell. When the shell starts a child, it gives the child a copy of its environment variables, and only those.

Think of the shell as a manager who keeps notes on a desk. Most notes stay on the desk. A few are marked "copy for the team", and every new worker gets a photocopy of those on the first day. A worker can scribble on the copy, but the manager's original does not change. The `export` command is the stamp that marks a note "copy for the team".

**PATH** is one of those environment variables. It holds a list of directories, separated by `:`. When you type a command name without a `/` in it, the shell looks for a program of that name in each directory of the list, from left to right, and runs the first one it finds. If no directory has it, you get `command not found`.

## Try it

The outputs below come from a user called `sam`. Your screen shows your own username and home directory.

### 1. Read a few variables

```bash
echo $HOME
echo $USER
```

```output
/home/sam
sam
```

`HOME` holds your home directory, and `USER` your username. Variables also work in the middle of a sentence. Put the sentence in double quotes: the shell still replaces the variables inside them, while single quotes would stop it, as you will see in step 3.

```bash
echo "I am $USER and my home is $HOME"
```

```output
I am sam and my home is /home/sam
```

```bash
printenv USER HOME
```

```output
sam
/home/sam
```

`printenv` prints environment variables. Given names, it prints their values. Without any name it prints all of them, one per line as `NAME=value`. Try it: you recognise some of them already.

### 2. Create your own variable

```bash
color=green
echo "My favourite colour is $color"
```

```output
My favourite colour is green
```

A variable is created by writing the name, `=` and the value, with no spaces around the `=`. By habit, the variables that you make yourself have small letters, and the environment variables of the system have capitals.

Give it a new value the same way:

```bash
color=blue
echo $color
```

```output
blue
```

### 3. Pass it on with export

```bash
bash -c 'echo "The child sees: $color"'
```

```output
The child sees:
```

`bash -c` starts a new shell, a child of yours, and gives it one command to run. The single quotes stop your shell from replacing `$color` itself, so the child has to look it up. It finds nothing: `color` is a shell variable, and it stayed on your desk.

```bash
export color
bash -c 'echo "The child sees: $color"'
```

```output
The child sees: blue
```

`export` turned `color` into an environment variable, and now every child gets a copy. This is how programs learn your settings: the shell exports them, and each program reads its copy.

### 4. Look at PATH

```bash
echo $PATH
```

```output
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
```

Split it at each `:` and you get the list of directories, in the order the shell searches them. There is `/usr/games`, which is how the shell found `cowsay` in lesson 1.6. On WSL the list goes on with many Windows directories, such as `/mnt/c/Windows`. That is normal: it lets you start Windows programs from Ubuntu.

### 5. Ask where a command comes from

```bash
which ls python3
```

```output
/usr/bin/ls
/usr/bin/python3
```

`which` walks along `PATH` the same way the shell does, and prints the first match for each name.

```bash
type cd
```

```output
cd is a shell builtin
```

Some commands are not programs on the disk at all. A **shell builtin** is a command that is part of Bash itself, so Bash never searches `PATH` for it. `cd` has to be one: a child process cannot change the working directory of its parent, so only the shell itself can move you. `type` tells you what a name really is, a program or a builtin.

### 6. Make your own command

```bash
cd ~
mkdir bin
```

With nano, create a file `bin/hello-me` with these two lines. Lesson 1.9 explains the first line. For now, take it as "this file is a Bash script".

```bash title="bin/hello-me"
#!/bin/bash
echo "Hello, $USER. This command is yours."
```

```bash
chmod +x bin/hello-me
```

`chmod +x` gives the file the execute permission from lesson 1.4, so that it can run as a program. Now try it:

<!-- lab: nocheck -->
```bash
hello-me
```

```output
hello-me: command not found
```

The file exists and may be run, but `~/bin` is not in `PATH`, so the shell never looked there. With a path, it works:

```bash
~/bin/hello-me
```

```output
Hello, sam. This command is yours.
```

### 7. Add your directory to PATH

```bash
PATH="$HOME/bin:$PATH"
hello-me
which hello-me
```

```output
Hello, sam. This command is yours.
/home/sam/bin/hello-me
```

The new value of `PATH` is your directory, a `:`, and then the old value. Your directory comes first now, so the shell looks there before anywhere else. You did not need `export`: `PATH` already was an environment variable, and it stays one.

### 8. Keep the change

Variables live in the shell that made them. Close this terminal, and your change to `PATH` is gone with it: a new terminal starts with the `PATH` it gets when you log in. Ubuntu happens to add `~/bin` at login when that directory exists, so you may find it there later anyway, but other systems do not, and other changes are never kept. To set something in every new shell, write it into `~/.bashrc`, a hidden file in your home directory that Bash reads each time it starts in a terminal.

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
tail -n 1 ~/.bashrc
```

```output
export PATH="$HOME/bin:$PATH"
```

The single quotes matter here. They keep `$HOME` and `$PATH` as they are, so that the line is read fresh each time a shell starts. `source ~/.bashrc` reads the file again in the shell you are in, or you can simply open a new terminal.

:::caution[Two arrows, not one]
Write `>>`, never `>`, when you add to `~/.bashrc`. A single `>` replaces the whole file with your one line, and all the settings that Ubuntu put there are gone. If it happens, `cp /etc/skel/.bashrc ~/.bashrc` brings back the original, and you add your line again.
:::

## Exercise

1. Create a variable `greeting` with the value `Good morning`, two words, and print it. Watch out for the space.
2. Check whether a child shell sees `greeting`. Make sure it does, and check again.
3. Is `echo` a program or a shell builtin?
4. Create a new command `where-am-i` in `~/bin` that prints `You are in` followed by the working directory. Use the environment variable `PWD`, which always holds the working directory. Make it executable, go to `/etc`, and run it there by its name alone.

<details>
<summary>Show the solution</summary>

```bash
greeting="Good morning"
echo $greeting
```

```output
Good morning
```

Without the quotes, `greeting=Good morning` would try to run a command called `morning`, and `greeting` would not be set at all.

```bash
bash -c 'echo "Child: $greeting"'
export greeting
bash -c 'echo "Child: $greeting"'
```

```output
Child:
Child: Good morning
```

```bash
type echo
```

```output
echo is a shell builtin
```

Ubuntu also has a program `/usr/bin/echo`, but Bash uses its own builtin first, and `type` tells you which one runs.

For step 4, create this file with nano:

```bash title="bin/where-am-i"
#!/bin/bash
echo "You are in $PWD"
```

```bash
chmod +x ~/bin/where-am-i
cd /etc
where-am-i
```

```output
You are in /etc
```

If you get `command not found`, check that `~/bin` is in your `PATH` with `echo $PATH`. In a new terminal it is there because of the line you added to `~/.bashrc`.

</details>

## Check yourself

**1. What is the difference between a shell variable and an environment variable?**

<details>
<summary>Answer</summary>

A shell variable exists only in the shell that created it. An environment variable is copied to every program that the shell starts. `export` turns a shell variable into an environment variable.

</details>

**2. `PATH` is `/usr/local/bin:/usr/bin`, and both directories contain a program called `tool`. Which one runs when you type `tool`?**

<details>
<summary>Answer</summary>

`/usr/local/bin/tool`. The shell searches the directories from left to right and runs the first match.

</details>

**3. Why does `color = green` fail?**

<details>
<summary>Answer</summary>

Because of the spaces. The shell reads `color` as the name of a command, with `=` and `green` as its arguments, and finds no such command. Write `color=green`.

</details>

**4. Your program is in `~/tools`, and typing its name gives `command not found`. Give two ways to run it.**

<details>
<summary>Answer</summary>

Type its path, such as `~/tools/name`. Or add the directory to `PATH` with `PATH="$HOME/tools:$PATH"`, and put that line, with `export`, in `~/.bashrc` to keep it.

</details>

**5. Why can `cd` not be a program in `/usr/bin`?**

<details>
<summary>Answer</summary>

A program runs as a child process, and a child cannot change the working directory of its parent. `cd` must change the shell's own working directory, so it is a builtin, part of the shell itself.

</details>

## Common mistakes

- **Spaces around `=`.** `color = green` makes the shell look for a command called `color`, and Ubuntu answers `Command 'color' not found`. No spaces: `color=green`.
- **Forgetting the `$`.** `echo color` prints the word `color`. `echo $color` prints the value.
- **`PATH=$HOME/bin` without the old value.** The shell now looks only in `~/bin`, and even `ls` is "not found". Open a new terminal to get the old `PATH` back, then write `PATH="$HOME/bin:$PATH"`.
- **Expecting a change to reach other terminals.** A variable lives in one shell. Put it in `~/.bashrc` and open a new terminal.
- **Expecting a child to change the parent.** A script that sets a variable cannot change the variables of the shell that started it. The worker writes on the copy, not on the original.

## Key terms

- **Variable**: a name that stands for a value. `$name` puts the value in a command.
- **Shell variable**: a variable that exists only in the shell that created it. Child programs do not see it.
- **Environment variable**: a variable that the shell passes on to every program it starts. `export` creates one.
- **PATH**: the environment variable that lists, separated by `:`, the directories where the shell looks for commands.
- **Shell builtin**: a command that is part of the shell itself, such as `cd`, so it does not come from a directory in `PATH`.
- **.bashrc**: a hidden file in your home directory that Bash reads each time it starts in a terminal.

## Go further

- [Bash Reference Manual: Shell Parameters](https://www.gnu.org/software/bash/manual/html_node/Shell-Parameters.html): the official rules for creating and using variables.
- [Bash Reference Manual: Bash Startup Files](https://www.gnu.org/software/bash/manual/html_node/Bash-Startup-Files.html): which files Bash reads when it starts, and in which situation.
- [Ubuntu manual page: environ](https://manpages.ubuntu.com/manpages/noble/man7/environ.7.html): the common environment variables, such as `HOME`, `USER` and `PATH`, and what each one means.
