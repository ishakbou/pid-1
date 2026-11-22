---
title: "Project step: check your setup"
description: A short checklist and a small check script that prove your terminal, your editor and your place to practice are ready for Module 1.
lesson: "0.7"
time: 20 min
sidebar:
  order: 7
---

Pilots do not take off because they feel ready. They take off after a checklist, read line by line, even on their ten-thousandth flight. Feeling ready and being ready are different things, and the checklist is the cheap way to find the difference on the ground.

<!-- lab: run
sudo apt-get remove -y sqlite3 > /dev/null 2>&1
-->

## Goal

After this lesson you can:

- Prove, with a checklist, that your terminal, your editor and your place to practice work.
- Run a small check script and read its result.
- Install a tool that is missing.

## Why it matters

A missing tool always shows up at the worst moment: in the middle of an exercise, when your head is full of something else. Five minutes of checking now protect hours of concentration later. It is also your first contact with a habit that security people live by: do not assume, check.

## The idea

In every other module, the project step adds something to `mylab`. This one adds nothing, because `mylab` does not exist yet. You create it at the end of Module 1. Today you prepare the ground it will stand on.

The check has two parts. The first is a list of things that you look at yourself. The second is a **script**: a text file that contains commands, which the computer runs one after the other. The script asks your system whether five tools are present. They are the ones the next modules need first.

| Tool | Used for | First needed |
|---|---|---|
| `nano` | Editing a file inside the terminal | Module 1 |
| `git` | Keeping the history of your project | Module 2 |
| `python3` | Running Python programs | Module 3 |
| `curl` | Talking to web servers from the terminal | Module 6 |
| `sqlite3` | Working with a database | Module 7 |

You do not have to understand the script today. You copy it, run it and read the answer. At the end of Module 1 you will be able to write it yourself, and that is a good way to measure your progress.

Here is the whole checklist. The steps of "Try it" walk through it line by line.

| | Check | Ready when |
|---|---|---|
| 1 | The terminal opens | A line waits for your command |
| 2 | The terminal knows you | `whoami` prints your username |
| 3 | Updates work | `sudo apt update` ends without an error |
| 4 | The editor opens a folder | `code .` opens VS Code on the folder |
| 5 | Editor and terminal share files | The terminal runs a file saved in the editor |
| 6 | The tools are present | The check script prints `ok` five times |
| 7 | The practice terminal starts | It answers `Linux` to `uname` |
| 8 | Your AI rules are clear | You can say the six rules without looking |

Not every line is for everybody. With Codespaces, line 4 is already true: the editor is open around your terminal. With the practice terminal only, do lines 7 and 8 and come back to the others when you have a full Linux. On macOS, line 3 does not apply.

## Try it

### 1. Open the terminal and say hello

Open your terminal the way you learned in lesson 0.4.

```bash
whoami
uname
```

```output
sam
Linux
```

The first line is your username. The second is the name of the system. On macOS it says `Darwin`, the name of the core of macOS. Lines 1 and 2 of the checklist are done.

### 2. Check that updates work

<!-- lab: nocheck -->
```bash
sudo apt update
```

```output
Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease
Hit:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease
Hit:3 http://archive.ubuntu.com/ubuntu noble-backports InRelease
Hit:4 http://security.ubuntu.com/ubuntu noble-security InRelease
Reading package lists...
Building dependency tree...
Reading state information...
All packages are up to date.
```

This one command tests three things: your password is accepted, your Linux reaches the internet, and the software catalogue is fresh. If the last line announces packages to upgrade, run `sudo apt upgrade -y` as in lesson 0.4.

### 3. Make a folder and open it in the editor

```bash
mkdir setup-check
cd setup-check
```

<!-- lab: skip -->
```bash
code .
```

VS Code opens on the empty folder. On Windows, look at the bottom left corner for "WSL: Ubuntu". In a codespace, skip `code .`: the folder is already in the left column. Line 4 is done.

### 4. Write the check script

In VS Code, create a new file called `check-setup.sh` and type this into it. Type it, do not paste it. Every space and every quote counts, and the colours of the editor help you: when a line has a different colour from the one above, look for a missing quote.

```bash title="check-setup.sh"
echo "Setup check for $(whoami)"
for tool in nano git python3 curl sqlite3; do
  if command -v "$tool" > /dev/null; then
    echo "ok       $tool"
  else
    echo "MISSING  $tool"
  fi
done
```

Save the file with Ctrl and S.

In plain words, the script says: for each name in the list, ask the system whether it knows a command with that name. If yes, print `ok`. If not, print `MISSING`.

### 5. Run the script

Go back to the terminal.

```bash
bash check-setup.sh
```

```output
Setup check for sam
ok       nano
ok       git
ok       python3
ok       curl
MISSING  sqlite3
```

`bash` followed by a file name runs the commands of that file. The terminal has just run a file that you wrote in the editor, so line 5 of the checklist is done.

Your result may differ. On this fresh Ubuntu, four tools are present and `sqlite3` is not. If you get an error message and not this list, compare your file with the one above, character by character. The message gives the number of the line where the computer stopped understanding.

### 6. Install what is missing

For each line that says `MISSING`, install the tool with `apt`, using its name. Here:

<!-- lab: nocheck -->
```bash
sudo apt install -y sqlite3
```

Some lines scroll by while `apt` downloads and installs the program. Then run the check again.

```bash
bash check-setup.sh
```

```output
Setup check for sam
ok       nano
ok       git
ok       python3
ok       curl
ok       sqlite3
```

Five times `ok`. Line 6 is done.

On macOS there is no `apt`. After lesson 0.4, the five tools are normally present. If one is missing, the Homebrew link in "Go further" shows how to install it.

### 7. Ask a tool for its version

```bash
python3 --version
```

```output
Python 3.12.3
```

Almost every tool answers to `--version`. The **version** is the number that identifies a release of a program. Your number may be higher than this one, and that is fine. When you ask for help one day, the first question you will hear is "which version?", and now you know how to find it.

### 8. Do the two checks outside the terminal

Open [lesson 0.1](../start-here/how-this-course-works/), start the practice terminal and type `uname`. It should answer `Linux`. That is line 7.

For line 8, say the six rules of [lesson 0.6](../start-here/learning-with-ai/) aloud without looking. If you find four, read the list once more.

:::tip[When a check fails]
A failed check is not a failed lesson. It is the lesson working. Go back to the lesson that covers the line, repeat its steps, and run the check again. If the same line still fails, change your way to practice for now, as lesson 0.3 explains, and continue the course.
:::

## Exercise

A check that can never fail proves nothing. Make sure that this one can.

1. In the editor, add two names at the end of the list in `check-setup.sh`: `ssh`, and `notarealtool`.
2. Save, and run the script again. Explain the two new lines.
3. Remove `notarealtool` from the list, save, and run the script one last time.
4. Close VS Code, then delete the folder `setup-check`, so that your home is clean for Module 1.

<details>
<summary>Show the solution</summary>

After task 1, the file looks like this. Only the second line has changed.

```bash title="check-setup.sh"
echo "Setup check for $(whoami)"
for tool in nano git python3 curl sqlite3 ssh notarealtool; do
  if command -v "$tool" > /dev/null; then
    echo "ok       $tool"
  else
    echo "MISSING  $tool"
  fi
done
```

```bash
bash check-setup.sh
```

```output
Setup check for sam
ok       nano
ok       git
ok       python3
ok       curl
ok       sqlite3
ok       ssh
MISSING  notarealtool
```

`ssh` is a tool for connecting to other computers. Ubuntu has it from the start, so it is `ok`. No program is called `notarealtool`, so the script reports it as missing. Now you have seen with your own eyes that the script can say `MISSING`, and its `ok` lines are worth something.

If the output did not change at all, you forgot to save the file.

For task 4, go back up one level and delete the folder:

```bash
cd ..
rm -r setup-check
```

</details>

## Check yourself

**1. The script prints `ok       git`. What exactly has been checked?**

<details>
<summary>Answer</summary>

That the system knows a command called `git`. Nothing more. The script does not check that the tool is set up for you. That comes in Module 2.

</details>

**2. The script prints `MISSING  curl`. What do you type?**

<details>
<summary>Answer</summary>

`sudo apt install -y curl`, and then `bash check-setup.sh` again to see the line change to `ok`.

</details>

**3. Why did the exercise ask you to add a tool that does not exist?**

<details>
<summary>Answer</summary>

To see the check fail. A check that always says `ok` could be broken without anybody noticing. After you have seen `MISSING` once, you can trust the `ok` lines.

</details>

**4. You changed the script in the editor, and the terminal prints exactly the same result as before. What is the first thing to look at?**

<details>
<summary>Answer</summary>

Whether the file is saved. A round dot on the tab of the file means that the changes are not on the disk yet. Save and run again.

</details>

**5. How do you find the version of a tool?**

<details>
<summary>Answer</summary>

Type its name followed by `--version`, for example `python3 --version`.

</details>

## Common mistakes

- **Running the script from the wrong folder.** `bash check-setup.sh` then answers `No such file or directory`. Go into the folder first with `cd setup-check`.
- **Typing `check-setup.sh` without `bash` in front.** The terminal answers `command not found`, because it looks for a program with that name. Lesson 1.8 explains why, and lesson 1.9 shows how to run a script without `bash` in front.
- **A typing mistake in the script.** One missing `do`, `fi` or quote, and the computer reports a "syntax error" with a line number. Compare that line, and the ones around it, with the lesson.
- **Not saving before running.** The terminal runs what is on the disk, not what is on your screen.
- **Seeing `MISSING` and going on anyway.** It will stop you later, at a worse moment. Fix it now.
- **Ticking a line of the checklist from memory.** "It worked last week" is not a check. Run it.

## Key terms

- **Script**: a text file that contains commands. The computer runs them one after the other, from top to bottom.
- **Version**: the number that identifies a release of a program. Most tools print it when you add `--version`.

## Go further

- [Installing Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git): the official instructions for every system, in case `git` is missing and `apt` is not available to you.
- [Python setup and usage](https://docs.python.org/3/using/index.html): the official guide to installing Python on Windows, macOS and Linux.
- [Homebrew](https://brew.sh/): the usual tool for installing command line programs on macOS. Its home page shows the one command that installs it.
