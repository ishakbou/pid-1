---
title: Viewing and editing files
description: Read text files in the terminal with cat, head, tail and less, and create or change them with the nano editor.
lesson: "1.3"
time: 20 min
practiceTerminal: true
sidebar:
  order: 3
---

Here is a small problem. A server writes everything it does into a file, and that file now has forty thousand lines. Somebody asks you: "What were the last ten things it did?" On your laptop you would open the file and scroll for a while. On a server there is nothing to scroll with, only a prompt. This lesson gives you the tools for that job, and a simple editor to change files as well.

<!-- lab: run
mkdir -p ~/playground/notes
-->

## Goal

After this lesson you can:

- Print a file on the screen: all of it, only the start, or only the end.
- Read a long file page by page and search inside it.
- Create and change a text file with `nano`.

## Why it matters

On Linux, almost everything that matters is a text file: settings, scripts, the list of users, and the records of what happened on the machine. Reading those files is how you find out why something broke. Changing one of them is often the whole fix. A large part of security work is exactly this: reading files, quickly, and noticing the line that should not be there.

## The idea

You met plain text in lesson 0.5: a file that contains characters and nothing else. There is no font, no colour and no hidden formatting, so every tool on the system can read it. A file that records events line by line, with the newest at the bottom, is called a **log file**.

Which tool you pick depends on how long the file is. Think of paper. A sticky note you read at a glance. A thick book you do not spread out on the floor page after page: you open it, flip through it, or look only at the first or the last page.

| You want to | Command |
|---|---|
| See a short file in full | `cat` |
| See only the first lines | `head` |
| See only the last lines | `tail` |
| Read a long file page by page | `less` |
| Count the lines | `wc -l` |
| Create or change a file | `nano` |

The first five only read. They cannot damage a file, so you can try them on anything. `nano` is a **text editor**: a program for writing and changing plain text.

## Try it

You work in the `playground` directory from lesson 1.2. The first command below creates it when it is missing, and does nothing when it is there. In the practice terminal it is always missing, because that terminal starts as a fresh system on every page.

### 1. Write a file with nano

```bash
mkdir -p ~/playground
cd ~/playground
```

Now type `nano commands.txt` and press Enter. The screen changes. The top line shows the name of the file, the large empty area is where your text goes, and the two lines at the bottom list shortcuts.

Type these seven lines. They are a small memory aid of your own, and you will add to it.

```text title="commands.txt"
pwd    print the working directory
ls     list a directory
cd     change directory
mkdir  make a directory
cp     copy
mv     move or rename
rm     remove
```

To save, press Ctrl+O. Nano shows the file name at the bottom and waits: press Enter to confirm. To leave, press Ctrl+X. You are back at the prompt.

In the shortcut list at the bottom of nano, the `^` sign means the Ctrl key. So `^X Exit` reads "Ctrl+X exits".

### 2. Print the file

```bash
cat commands.txt
```

```output
pwd    print the working directory
ls     list a directory
cd     change directory
mkdir  make a directory
cp     copy
mv     move or rename
rm     remove
```

`cat` prints a whole file on the screen and gives the prompt back. For a short file, nothing is faster.

```bash
cat -n commands.txt
```

```output
     1  pwd    print the working directory
     2  ls     list a directory
     3  cd     change directory
     4  mkdir  make a directory
     5  cp     copy
     6  mv     move or rename
     7  rm     remove
```

The `-n` option numbers the lines. That helps when an error message says "line 5".

### 3. Count the lines

```bash
wc -l commands.txt
```

```output
7 commands.txt
```

`wc` means "word count". With `-l` it counts lines. Use it before you print a file you do not know.

```bash
wc -l /etc/services
```

```output
361 /etc/services
```

`/etc/services` is a system file that lists network services and the port numbers they use. You will meet those in the Networking module. Today it is simply a long file to practice on. Your number may be a little different.

### 4. Look at the start and the end

```bash
head -n 3 commands.txt
```

```output
pwd    print the working directory
ls     list a directory
cd     change directory
```

```bash
tail -n 2 commands.txt
```

```output
mv     move or rename
rm     remove
```

`head` prints the first lines of a file, and `tail` prints the last ones. The number after `-n` says how many. Without `-n`, both print ten lines.

```bash
head -n 2 /etc/services
```

```output
# Network services, Internet style
#
```

Two lines were enough to learn what this file is. And here is the answer to the opening problem: `tail -n 10` followed by the name of the log file.

:::tip[Watch a file grow]
`tail -f` followed by a file name keeps the file open and prints every new line the moment it is added. The `f` stands for "follow". System administrators watch log files this way. Press Ctrl+C to stop.
:::

### 5. Read a long file with less

Type `less /etc/services` and press Enter. Like nano, `less` takes over the whole window. It shows the first page of the file and waits for a key.

| Key | What it does |
|---|---|
| Space | Next page |
| `b` | Back one page |
| Up and Down arrows | One line at a time |
| `/ssh` then Enter | Search for the text `ssh` |
| `n` | Jump to the next match |
| `G` | Go to the end of the file |
| `g` | Go back to the start |
| `q` | Quit |

Try all of them. Search for `ssh`, and you land on the line that says `ssh` uses port 22. Then press `q`.

A program like `less`, which shows text one screen at a time, is called a **pager**. You have already used it without knowing: the manual pages from lesson 1.1 are displayed by `less`. That is why `q` closes them, and it means you can search a manual page with `/` too.

### 6. Change the file

Open the file again with `nano commands.txt`. Move the cursor with the arrow keys to the end of the last line, press Enter, and add two lines, so that the file looks like this:

```text title="commands.txt"
pwd    print the working directory
ls     list a directory
cd     change directory
mkdir  make a directory
cp     copy
mv     move or rename
rm     remove
cat    print a whole file
less   read a long file page by page
```

Save with Ctrl+O and Enter, and leave with Ctrl+X. Then check your work without opening the editor:

```bash
tail -n 3 commands.txt
```

```output
rm     remove
cat    print a whole file
less   read a long file page by page
```

A few more nano shortcuts are worth knowing:

| Key | What it does |
|---|---|
| Ctrl+O | Save ("write out") |
| Ctrl+X | Exit. If you have unsaved changes, nano asks whether to save them |
| Ctrl+W | Search for a word |
| Ctrl+K | Cut the whole line under the cursor |
| Ctrl+U | Paste the line you cut |
| Alt+U | Undo |

## Exercise

1. How many lines does the file `/etc/passwd` have? It holds the list of users of your system.
2. Print only its first line.
3. Print only its last line.
4. Open `/etc/services` in `less` and search for `https`. Which port number does `https` use? The first match is not the answer.
5. With nano, add the line `nano   edit a file` at the end of `commands.txt`. Check the result with one command.

<details>
<summary>Show the solution</summary>

```bash
wc -l /etc/passwd
```

```output
33 /etc/passwd
```

Your number depends on your system. The practice terminal has 18 lines, and its first line ends with `/bin/sh` instead of `/bin/bash`.

```bash
head -n 1 /etc/passwd
```

```output
root:x:0:0:root:/root:/bin/bash
```

```bash
tail -n 1 /etc/passwd
```

```output
sam:x:1000:1000:Sam:/home/sam:/bin/bash
```

Your last line may show another user. Each line of this file describes one user, and lesson 1.4 tells you who `root` is.

For step 4, type `less /etc/services`, then `/https` and Enter. The first match is inside a web address in a comment near the top. Press `n` to jump to the next match: the line that starts with `https` shows port `443`. Press `q` to quit.

For step 5, type `nano commands.txt`, go to the end, add the line, then press Ctrl+O, Enter and Ctrl+X.

<!-- lab: run
echo 'nano   edit a file' >> ~/playground/commands.txt
-->

```bash
tail -n 1 commands.txt
```

```output
nano   edit a file
```

</details>

## Check yourself

**1. Which command shows the last 20 lines of a file called `app.log`?**

<details>
<summary>Answer</summary>

`tail -n 20 app.log`. `tail` prints the end of a file, and `-n 20` asks for 20 lines.

</details>

**2. Why is `cat` a poor choice for a file with 5,000 lines, and what do you use instead?**

<details>
<summary>Answer</summary>

`cat` prints everything at once, so the text flies past and you only see the end. Use `less` to read it page by page, or `head` and `tail` if you only need the start or the end.

</details>

**3. In `less`, how do you search for the word `error`, and how do you go to the next match?**

<details>
<summary>Answer</summary>

Type `/error` and press Enter. Then press `n` for each next match.

</details>

**4. In nano, which keys save the file, and which key leaves the editor?**

<details>
<summary>Answer</summary>

Ctrl+O and then Enter save the file. Ctrl+X leaves the editor.

</details>

**5. What does `wc -l notes.txt` print?**

<details>
<summary>Answer</summary>

The number of lines in `notes.txt`, followed by the file name.

</details>

## Common mistakes

- **Running `cat` on a huge file.** The screen floods with text. Press Ctrl+C to stop it, then use `less`, `head` or `tail`.
- **Running `cat` on a file that is not text.** A program or a picture prints as garbage, and the terminal may start to behave strangely. Type `reset` and press Enter to bring it back to normal, even if you cannot see what you type.
- **Trying to type in `less`.** `less` only reads. Press `q`, then open the file with `nano`.
- **Leaving nano without saving.** When you press Ctrl+X with unsaved changes, nano asks `Save modified buffer?`. Press `Y` and then Enter to keep your work, or `N` to throw it away.
- **Editing a file that is not yours.** If you open a system file such as `/etc/services`, nano warns you that it is unwritable, and your changes cannot be saved. Lesson 1.4 explains why.
- **Landing in another editor.** Some systems open an editor called vim instead of nano. If the screen does not react as you expect, press Esc, type `:q!` and press Enter to leave without saving.

## Key terms

- **Log file**: a file where a program records what it does, one line per event, newest at the bottom.
- **Text editor**: a program for writing and changing plain text, such as nano.
- **nano**: a small text editor that runs inside the terminal and shows its shortcuts at the bottom of the screen.
- **Pager**: a program that shows text one screen at a time, such as `less`.

## Go further

- [GNU nano documentation](https://www.nano-editor.org/docs.php): the official manual and a short cheat sheet of every shortcut.
- [GNU Coreutils manual: output of parts of files](https://www.gnu.org/software/coreutils/manual/html_node/Output-of-parts-of-files.html): the official reference for `head` and `tail`.
- [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/): you can now try the first levels of this free terminal game. They ask you to find and read files. Lesson 14.2 shows how to connect.
