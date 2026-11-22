---
title: Your first Bash script
description: Write a Bash script, make it executable and run it, use variables, arguments, if and for, and find a bug with bash -x.
lesson: "1.9"
time: 25 min
sidebar:
  order: 9
---

In lesson 0.7 you typed a small check script and ran it without knowing how it worked. That was on purpose. By the end of this lesson you can read every line of it, and, more useful, write your own. Everything you have typed by hand in this module can go into a file and run again with one word.

<!-- lab: run
mkdir -p ~/playground
-->

## Goal

After this lesson you can:

- Write a Bash script, make it executable and run it.
- Use variables, arguments, `if` and `for` in a script.
- Find a bug in a script with `bash -x`.

## Why it matters

The commands you type by hand, you have to remember and type again tomorrow, the same way, without a typo. A script remembers them for you. System administrators use scripts for backups, reports and checks that run every night while they sleep. Security people use them to repeat a test on fifty machines at once. And it is the step from using the computer to telling it what to do, which is what programming is.

## The idea

You know from lesson 0.7 that a script is a text file that contains commands. Bash reads it from the top, runs one line, then the next, exactly as if you were typing them. Think of a to-do list handed to a very literal assistant: it does every line, in order, exactly as written, and never guesses what you meant.

Three things make a file a proper script:

- **The first line** is `#!/bin/bash`. It is called the **shebang**, and it says which program should read the rest of the file. Here it is Bash, which lives at `/bin/bash`.
- **The execute permission** from lesson 1.4, added with `chmod +x`, which allows the file to run as a program.
- **Comments**: lines that start with `#` are notes for people. Bash skips them. (The shebang starts with `#` too, which is why Bash skips it when it reads the script.)

Inside a script you have everything from this module, plus a few tools that only make sense in a program:

| Tool | Example | What it does |
|---|---|---|
| Variable | `name=Lina` | Stores a value (lesson 1.8) |
| Argument | `$1`, `$2` | The first and second word typed after the script name |
| Command substitution | `$(hostname)` | Runs a command and puts its output in that place |
| Condition | `if [ -d "$dir" ]; then ... fi` | Runs some lines only when a test is true |
| Loop | `for x in a b c; do ... done` | Runs some lines once for each item in a list |

## Try it

Work in `~/playground`. Create each file with nano, as in lesson 1.3. The outputs come from a user called `sam` on a computer called `lab`.

### 1. Write a first script

```bash
cd ~/playground
```

```bash title="hello.sh"
#!/bin/bash
# hello.sh: my first script
echo "Hello, $USER."
echo "This computer is called $(hostname)."
echo "You are in $(pwd)."
```

```bash
bash hello.sh
```

```output
Hello, sam.
This computer is called lab.
You are in /home/sam/playground.
```

`$(hostname)` is **command substitution**: Bash runs `hostname` first, then puts its output into the sentence. Any command fits between `$(` and `)`.

### 2. Make it executable

<!-- lab: nocheck -->
```bash
./hello.sh
```

```output
bash: ./hello.sh: Permission denied
```

`./hello.sh` means "the file `hello.sh` in this directory". The shell found it, but the file has no `x` permission, so it may not run as a program.

```bash
chmod +x hello.sh
./hello.sh
```

```output
Hello, sam.
This computer is called lab.
You are in /home/sam/playground.
```

Why `./hello.sh` and not `hello.sh`? Remember lesson 1.8: a name without a `/` is looked up in `PATH`, and the current directory is not in `PATH`. That is a safety rule. Otherwise a file called `ls` left in a shared directory could run instead of the real `ls`. The `./` is a path, so the shell runs exactly that file.

### 3. Use an argument

```bash title="greet.sh"
#!/bin/bash
# greet.sh: greet someone by name
name=$1
echo "Hello, $name. Welcome to the lab."
```

```bash
chmod +x greet.sh
./greet.sh Lina
```

```output
Hello, Lina. Welcome to the lab.
```

`$1` holds the first argument after the script name, `$2` the second one, and so on. These numbered variables are called **positional parameters**. The script copies `$1` into `name`, which reads better further down.

```bash
./greet.sh
```

```output
Hello, . Welcome to the lab.
```

Without an argument, `$1` is empty, and the script greets nobody. A script should notice that.

### 4. Decide with if

Change `greet.sh` with nano so that it looks like this:

```bash title="greet.sh"
#!/bin/bash
# greet.sh: greet someone by name
name=$1
if [ -z "$name" ]; then
  echo "Usage: ./greet.sh NAME"
  exit 1
fi
echo "Hello, $name. Welcome to the lab."
```

```bash
./greet.sh
```

```output
Usage: ./greet.sh NAME
```

Read the `if` block as a sentence: if the name is empty, then print how to use the script and stop. `fi` is `if` backwards, and it closes the block. The test sits between `[` and `]`, with a space on each side, always. `-z` means "is empty". A few more tests:

| Test | True when |
|---|---|
| `[ -z "$x" ]` | `x` is empty |
| `[ -f "$x" ]` | `x` is an existing file |
| `[ -d "$x" ]` | `x` is an existing directory |
| `[ "$x" = "yes" ]` | `x` is exactly the text `yes` |
| `[ ! -d "$x" ]` | `x` is not a directory (`!` turns any test around) |

Put variables in double quotes inside tests. An empty variable without quotes simply disappears, and the test can give the wrong answer.

### 5. Read the exit status

`exit 1` did more than stop the script. Every command ends with a number called its **exit status**: `0` means success, anything else means a problem. The shell keeps the status of the last command in `$?`.

```bash
./greet.sh
echo $?
```

```output
Usage: ./greet.sh NAME
1
```

```bash
./greet.sh Lina
echo $?
```

```output
Hello, Lina. Welcome to the lab.
0
```

Normal commands follow the same rule. `ls missing.txt` fails with status `2`, and `ls` on a file that exists returns `0`. This is what `if` really looks at: `[` is a command too, and `if` runs the block when its exit status is `0`.

### 6. Repeat with for

```bash title="check-dirs.sh"
#!/bin/bash
# check-dirs.sh: say which of these directories exist
for dir in /etc /home /nothere "$HOME/playground"; do
  if [ -d "$dir" ]; then
    echo "found    $dir"
  else
    echo "missing  $dir"
  fi
done
```

```bash
chmod +x check-dirs.sh
./check-dirs.sh
```

```output
found    /etc
found    /home
missing  /nothere
found    /home/sam/playground
```

`for` takes each item of the list in turn, stores it in `dir`, and runs the lines between `do` and `done`. The `if` now has an `else` part, which runs when the test is false. Look back at the check script of lesson 0.7: it has the same shape, with `command -v` as the test. You can read it now.

### 7. Find a bug with bash -x

This script has a bug. Create it exactly as it is:

```bash title="welcome.sh"
#!/bin/bash
# welcome.sh: welcome a guest to a room
guest=$1
room=$2
echo "Welcome, $guest. Your room is number $roon."
```

```bash
chmod +x welcome.sh
./welcome.sh Lina 12
```

```output
Welcome, Lina. Your room is number .
```

No error, just a wrong result. Bash did not complain, because an unknown variable is simply empty. Ask Bash to show each line before it runs it:

```bash
bash -x welcome.sh Lina 12
```

```output
+ guest=Lina
+ room=12
+ echo 'Welcome, Lina. Your room is number .'
Welcome, Lina. Your room is number .
```

The lines with a `+` show what Bash really ran, after it replaced the variables. `room` got the value `12`, but the `echo` line received nothing for it. Look closely at that line in the file: it says `$roon`. Fix the typo to `$room` with nano, and run the script again.

<!-- lab: run
sed -i 's/\$roon/$room/' welcome.sh
-->

```bash
./welcome.sh Lina 12
```

```output
Welcome, Lina. Your room is number 12.
```

:::tip[Run it often]
Write two or three lines, save, run. Then the next two or three. When something breaks, you know it is in the lines you just added. Writing the whole script before the first run is how a small typo turns into an hour of searching.
:::

## Exercise

Write a script `fileinfo.sh` in `~/playground` that takes one argument.

1. Without an argument, it prints `Usage: ./fileinfo.sh FILE` and stops with exit status `1`.
2. If the argument is an existing file, it prints the number of lines with `wc -l`.
3. Otherwise it prints `NAME is not a file`, with the real name in place of `NAME`, and stops with exit status `2`.

Test all three cases, and check the exit status each time.

<details>
<summary>Show the solution</summary>

```bash title="fileinfo.sh"
#!/bin/bash
# fileinfo.sh: count the lines of a file
if [ -z "$1" ]; then
  echo "Usage: ./fileinfo.sh FILE"
  exit 1
fi
if [ -f "$1" ]; then
  wc -l "$1"
else
  echo "$1 is not a file"
  exit 2
fi
```

```bash
chmod +x fileinfo.sh
./fileinfo.sh
echo $?
```

```output
Usage: ./fileinfo.sh FILE
1
```

```bash
./fileinfo.sh hello.sh
echo $?
```

```output
5 hello.sh
0
```

```bash
./fileinfo.sh /etc
echo $?
```

```output
/etc is not a file
2
```

`/etc` exists, but it is a directory, so the `-f` test is false. Your script may use a variable such as `file=$1`, like `greet.sh` does. That is just as good.

</details>

## Check yourself

**1. What does the first line `#!/bin/bash` do?**

<details>
<summary>Answer</summary>

It is the shebang. It tells the system which program should run the file, here Bash at `/bin/bash`, when you start the script by its name.

</details>

**2. Why do you type `./hello.sh` and not just `hello.sh`?**

<details>
<summary>Answer</summary>

A name without a `/` is looked up in the directories of `PATH`, and the current directory is not one of them. `./hello.sh` is a path, so the shell runs exactly that file.

</details>

**3. You run `./greet.sh Lina Sam`. What do `$1` and `$2` contain?**

<details>
<summary>Answer</summary>

`$1` is `Lina` and `$2` is `Sam`. They are the positional parameters, in the order you typed the arguments.

</details>

**4. What does an exit status of `0` mean, and how do you see the exit status of the last command?**

<details>
<summary>Answer</summary>

`0` means success. Any other number means a problem. `echo $?` prints the exit status of the last command.

</details>

**5. A script runs without an error but prints a wrong result. Which command shows you every line as Bash runs it?**

<details>
<summary>Answer</summary>

`bash -x` followed by the script name. Each line is printed with a `+` in front, after the variables have been replaced, so you can see where a value goes wrong.

</details>

## Common mistakes

- **No spaces inside the brackets.** `[-z "$1" ]` makes Bash look for a command called `[-z`, and it answers `[-z: command not found`. Write `[ -z "$1" ]`, with a space after `[` and before `]`.
- **A missing `fi` or `done`.** Bash reads to the end of the file looking for it and reports `syntax error: unexpected end of file`, with a line number at the very end of the file. Check that every `if` has its `fi` and every `do` its `done`.
- **Spaces around `=`.** `name = $1` is a command called `name`, not a variable, as in lesson 1.8.
- **Variables without quotes.** A value with a space in it, such as a file called `my notes.txt`, falls apart into two words. Write `"$file"`, not `$file`.
- **Forgetting `chmod +x`.** `./script.sh` answers `Permission denied`. Run `chmod +x script.sh` once, or start it with `bash script.sh`.
- **Editing the script on Windows.** A file saved by some Windows editors ends each line with an extra invisible character. Bash then reports strange errors, such as `$'\r': command not found` for an empty line. Edit your scripts inside Linux, with nano or with VS Code connected to WSL.

## Key terms

- **Shebang**: the first line of a script, starting with `#!`, that names the program that runs the file, such as `#!/bin/bash`.
- **Comment**: a line, or the end of a line, that starts with `#`. Bash ignores it. It is a note for people.
- **Positional parameter**: one of the variables `$1`, `$2` and so on, which hold the arguments given to a script.
- **Command substitution**: `$(command)`, which runs the command and puts its output in its place.
- **Exit status**: the number a command returns when it ends. `0` means success, and `$?` holds the last one.
- **Condition**: a test that is true or false, used by `if` to decide which lines run.
- **Loop**: a block of lines that runs once for each item in a list, such as a `for` loop.

## Go further

- [Bash Reference Manual: Conditional Constructs](https://www.gnu.org/software/bash/manual/html_node/Conditional-Constructs.html): `if` and its relatives, with every detail.
- [Bash Reference Manual: Bash Conditional Expressions](https://www.gnu.org/software/bash/manual/html_node/Bash-Conditional-Expressions.html): the full list of tests such as `-f`, `-d` and `-z`.
- [Bash Reference Manual: Looping Constructs](https://www.gnu.org/software/bash/manual/html_node/Looping-Constructs.html): `for` and the other loops of Bash.
