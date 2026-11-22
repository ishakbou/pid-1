---
title: Files and navigation
description: Find out where you are in the Linux file system, move around it, and create, copy, move and delete files and folders from the terminal.
lesson: "1.2"
time: 20 min
practiceTerminal: true
sidebar:
  order: 2
---

Open a terminal and you are already standing somewhere. You cannot see it, because there are no icons and no windows, but the shell always has one folder it calls "here". In this lesson you learn to ask where "here" is, to go somewhere else, and to build and tidy up folders without touching the mouse.

## Goal

After this lesson you can:

- Find out which folder you are in, and move to any other folder.
- Read and write paths, both absolute and relative.
- Create, copy, move, rename and delete files and folders.

## Why it matters

Most servers have no desktop at all. When you connect to one, a terminal is all you get, so typing is the only way to move around. The rest of this course depends on it too: git tracks folders, Python scripts open files by their path, and logs sit in specific places you have to walk to. And the error you will meet most often this year, `No such file or directory`, almost always means that a path was wrong.

## The idea

Linux keeps every file in one big upside-down tree. At the top is a single folder called the **root directory**, written `/`. Everything else hangs somewhere below it: system files, your own files, even a USB stick you plug in. There is no `C:` or `D:` as on Windows.

A **directory** is what Linux calls a folder. The two words mean the same thing, and this course uses both.

<figure class="diagram">
<svg viewBox="0 0 460 400" role="img" aria-labelledby="tree-title tree-desc">
<title id="tree-title">A Linux directory tree</title>
<desc id="tree-desc">The root directory, written as a slash, is at the top. Below it are the directories etc, home and var. Inside home is sam. Inside sam is playground. Inside playground are the directories drafts and notes, and the file todo.txt. Inside notes is the file linux.txt.</desc>
<path class="d-line" d="M230 45 V63 M85 63 H375 M85 63 V81 M375 63 V81 M230 255 V273 M85 273 H375 M85 273 V291 M230 273 V291 M375 273 V293 M230 325 V362"/>
<path class="d-line d-hot" d="M230 45 V81 M230 115 V151 M230 185 V221"/>
<rect class="d-box d-hot" x="172" y="11" width="116" height="34"/>
<rect class="d-box" x="27" y="81" width="116" height="34"/>
<rect class="d-box d-hot" x="172" y="81" width="116" height="34"/>
<rect class="d-box" x="317" y="81" width="116" height="34"/>
<rect class="d-box d-hot" x="172" y="151" width="116" height="34"/>
<rect class="d-box d-hot" x="172" y="221" width="116" height="34"/>
<rect class="d-box" x="27" y="291" width="116" height="34"/>
<rect class="d-box" x="172" y="291" width="116" height="34"/>
<text x="230" y="33">/</text>
<text x="85" y="103">etc</text>
<text x="230" y="103">home</text>
<text x="375" y="103">var</text>
<text x="230" y="173">sam</text>
<text x="230" y="243">playground</text>
<text x="85" y="313">drafts</text>
<text x="230" y="313">notes</text>
<text x="375" y="313">todo.txt</text>
<text x="230" y="383">linux.txt</text>
</svg>
<figcaption>Boxes are directories. Names without a box are files. The highlighted boxes show the path <code>/home/sam/playground</code>.</figcaption>
</figure>

A **path** is the address of a file or directory: the list of directories to walk through, separated by `/`. There are two ways to write one.

An **absolute path** starts at the root, so it always begins with `/`. For example: `/home/sam/playground/notes`. It works like a full postal address. It points to the same place no matter where you are standing.

A **relative path** starts from the directory you are in right now, which is called the **working directory**. If you are in `/home/sam`, then `playground/notes` leads to the same place as the absolute path above. It works like "second door on the left": short and handy, but only correct from one starting point.

Three shortcuts save a lot of typing:

| Shortcut | Meaning | Example |
|---|---|---|
| `~` | Your **home directory**, the folder that belongs to you | `cd ~/playground` |
| `.` | The directory you are in | `ls .` |
| `..` | The directory one level up, called the parent | `cd ..` |

## Try it

The outputs below come from a user called `sam`. Wherever you see `sam`, your screen shows your own username.

### 1. Ask where you are

```bash
pwd
```

```output
/home/sam
```

`pwd` stands for "print working directory". A new terminal starts in your home directory, which is `/home/` followed by your username.

### 2. Look around

```bash
ls
```

`ls` lists what is inside the working directory. On a fresh Ubuntu in WSL it prints nothing, because your home is still empty. That is not an error. On Linux, a command that prints nothing has usually just worked.

### 3. Make a directory and step into it

```bash
mkdir playground
cd playground
pwd
```

```output
/home/sam/playground
```

`mkdir` makes a directory, and `cd` changes the working directory. From now on, "here" is `playground`.

### 4. Create a few things

```bash
mkdir notes drafts
touch todo.txt notes/linux.txt
ls
```

```output
drafts  notes  todo.txt
```

`mkdir` accepts several names at once. `touch` creates an empty file when the name does not exist yet. Look at `notes/linux.txt`: that is a relative path, and it put the new file inside `notes` without you going there.

Your tree now matches the diagram above.

### 5. Ask ls for more detail

```bash
ls -l
```

```output
total 8
drwxrwxr-x 2 sam sam 4096 Nov 21 17:35 drafts
drwxrwxr-x 2 sam sam 4096 Nov 21 17:35 notes
-rw-rw-r-- 1 sam sam    0 Nov 21 17:35 todo.txt
```

The `-l` is an **option**: a small switch that changes how a command behaves. Here it means "long format", one line per item. For now, read only three things. A line that starts with `d` is a directory. The number before the date is the size in bytes. The name is at the end. The letters such as `rwx` are permissions, and lesson 1.4 explains them. Yours may differ a little: on WSL, for example, the first line starts with `drwxr-xr-x`.

```bash
ls -a
```

```output
.  ..  drafts  notes  todo.txt
```

`-a` means "all". It also shows **hidden files**, which are simply files whose name starts with a dot. You can spot two shortcuts from the table here: `.` and `..` exist in every directory.

### 6. Move around

```bash
cd notes
pwd
cd ..
pwd
```

```output
/home/sam/playground/notes
/home/sam/playground
```

Both moves used a relative path: first down into `notes`, then back up to the parent.

```bash
cd /etc
pwd
cd ~/playground
pwd
```

```output
/etc
/home/sam/playground
```

`cd /etc` used an absolute path, so it would have worked from anywhere. `/etc` is where Linux keeps system settings; you only paid a visit. One more to remember: `cd` with nothing after it always brings you home.

:::tip[Let Tab do the typing]
Type `ls no` and press the Tab key. The shell completes it to `ls notes/`. If nothing happens, either no name starts with those letters or several do: press Tab twice to see the candidates. Completion is faster than typing, and it protects you from typos.
:::

### 7. Copy, move and rename

```bash
cp todo.txt drafts/
ls drafts
```

```output
todo.txt
```

`cp` copies. First you say what to copy, then where to put it. The original stays where it was.

```bash
mv drafts/todo.txt drafts/todo-old.txt
ls drafts
```

```output
todo-old.txt
```

`mv` moves a file. Renaming is the same operation: you "move" the file to a new name in the same directory. There is no separate rename command to learn.

```bash
cp -r notes notes-backup
ls
```

```output
drafts  notes  notes-backup  todo.txt
```

To copy a directory with everything inside it, add `-r`, short for "recursive".

### 8. Delete

```bash
rm drafts/todo-old.txt
rmdir drafts
rm -r notes-backup
ls
```

```output
notes  todo.txt
```

`rm` removes a file. `rmdir` removes a directory, but only an empty one, which is a useful safety net. `rm -r` removes a directory and everything in it.

:::caution[There is no recycle bin]
`rm` deletes for good. There is no undo, and no trash folder to rescue things from. Before you press Enter on an `rm -r`, run `ls` on the same path and check that it shows what you expect.
:::

## Exercise

Start in `~/playground`. Use only the terminal.

1. Add this structure:

   ```text
   playground/
       archive/
       course/
           module1/
               commands.txt
           module2/
   ```

2. Copy `commands.txt` into `module2`.
3. Rename the copy to `git-commands.txt`.
4. Move the whole `module2` directory into `archive`.
5. Go to your home directory. From there, list what is inside `module2` with one command.
6. Delete `archive` and everything in it.

<details>
<summary>Show the solution</summary>

```bash
cd ~/playground
mkdir course archive
mkdir course/module1 course/module2
touch course/module1/commands.txt
cp course/module1/commands.txt course/module2/
mv course/module2/commands.txt course/module2/git-commands.txt
mv course/module2 archive/
cd ~
ls playground/archive/module2
```

```output
git-commands.txt
```

```bash
rm -r playground/archive
```

Your commands may look different, and that is fine. You could `cd` into each directory instead of writing longer paths, for example. What counts is the result.

A shortcut worth knowing: `mkdir -p course/module1` creates `course` and `module1` in one go. The `-p` option makes any missing parent directories.

</details>

## Check yourself

**1. You are in `/home/sam/playground/notes`. Where are you after `cd ../..`?**

<details>
<summary>Answer</summary>

In `/home/sam`. Each `..` goes up one level: first to `playground`, then to `sam`.

</details>

**2. Is `notes/linux.txt` an absolute path or a relative path? How can you tell?**

<details>
<summary>Answer</summary>

Relative. An absolute path always starts with `/`. This one starts with a name, so the shell reads it from the working directory.

</details>

**3. What is the difference between `cp a.txt b.txt` and `mv a.txt b.txt`?**

<details>
<summary>Answer</summary>

After `cp` you have two files, `a.txt` and `b.txt`, with the same content. After `mv` you have only `b.txt`: the file was renamed.

</details>

**4. `rmdir drafts` answers `Directory not empty`. What are your two options?**

<details>
<summary>Answer</summary>

Empty the directory first (delete or move what is inside), then run `rmdir` again. Or check the content with `ls drafts` and, if you are sure, run `rm -r drafts`.

</details>

**5. What does `ls -a` show that `ls` does not?**

<details>
<summary>Answer</summary>

Hidden files: every name that starts with a dot, including `.` and `..`.

</details>

## Common mistakes

- **`No such file or directory`.** The path is wrong, or you are not where you think you are. Run `pwd`, then `ls`, and compare with what you typed.
- **Wrong capital letters.** On Linux, `Notes` and `notes` are two different names. Type names exactly as `ls` shows them.
- **Spaces in names.** `mkdir my notes` creates two directories, `my` and `notes`, because the shell reads a space as "next item". Write `mkdir my-notes` instead. If you really need the space, use quotes: `mkdir "my notes"`.
- **Forgetting `-r`.** `cp notes backup` refuses to copy a directory and tells you `-r not specified`. Add the option: `cp -r notes backup`.
- **No space after the command.** `cd..` is not a command. Linux needs the space: `cd ..`.

## Key terms

- **Directory**: a folder. It holds files and other directories.
- **Root directory** (`/`): the top of the file system tree. Every absolute path starts here.
- **Home directory** (`~`): your personal directory, usually `/home/` plus your username.
- **Working directory**: the directory the shell is in right now. `pwd` prints it.
- **Path**: the address of a file or directory, written as names separated by `/`.
- **Absolute path**: a path that starts at the root, so it begins with `/`.
- **Relative path**: a path that starts from the working directory.
- **Option**: a switch such as `-l` or `-r` that changes how a command behaves. Also called a flag.
- **Hidden file**: a file whose name starts with a dot. `ls` shows it only with `-a`.

## Go further

- [The Linux command line for beginners](https://ubuntu.com/tutorials/command-line-for-beginners): Ubuntu's own tutorial. It covers the same ground with more examples.
- [GNU Coreutils manual](https://www.gnu.org/software/coreutils/manual/coreutils.html): the official reference for `ls`, `cp`, `mv`, `rm` and their relatives. Use it to look things up, not to read from start to end.
- [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/): a free game played entirely in a terminal. After the next lesson you will be ready for its first levels; lesson 14.2 shows how to connect.
