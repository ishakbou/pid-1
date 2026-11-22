---
title: Installing a code editor
description: Install Visual Studio Code, open a folder in it, connect it to Ubuntu in WSL, and check that the editor and the terminal see the same files.
lesson: "0.5"
time: 20 min
sidebar:
  order: 5
---

A carpenter owns a van full of tools, and one of them is in their hand most of the day. For you, that tool will be the code editor. Scripts, programs, web pages, notes, configuration files: from Module 1 to Module 17, you write all of them in the same window. Ten minutes to set it up properly is a good trade.

## Goal

After this lesson you can:

- Install Visual Studio Code and open a folder in it.
- On Windows, connect the editor to your Ubuntu in WSL.
- Create a file in the editor and read it from the terminal.

## Why it matters

A program is a text file, and the computer reads every character of it. A tool that quietly adds or changes characters breaks your work in ways that are hard to see. A code editor never does that, and it helps you with colours, line numbers and a view of all your files. On Windows there is one more reason: the editor must work on the Linux side, or your first script in Module 1 fails with an error that no beginner can understand.

## The idea

A **code editor** is a program for writing **plain text**: files that contain characters and nothing else. No fonts, no bold, no page margins.

A word processor such as Word is the opposite. It stores a lot of invisible information around your words. That is right for a letter and wrong for a program, because the computer would try to read that extra information as code. So the first rule is simple: code is never written in a word processor.

The editor of this course is **Visual Studio Code**, usually called VS Code. It is free, it is made by Microsoft, and it works the same way on Windows, macOS and Linux. At the time of writing it is the most used code editor, so when you look for help, you find it. If you already use another code editor and like it, keep it. The lessons show VS Code.

Three things make it more than a notepad:

- **Syntax highlighting.** The editor colours the words of a program according to their role. A forgotten quote changes the colour of the whole line after it, so you see the mistake before you run anything.
- **A built-in terminal.** You can type commands in a panel under your file.
- **Extensions.** An **extension** is a small add-on that teaches the editor something new. You need exactly one today.

### Open a folder, not a file

In VS Code you open a whole folder. Think of putting a complete binder on your desk and not a single sheet. The editor then shows every file of the folder in a column on the left, and you move between them with one click. Each project has its folder. Your `mylab` will be one.

### On Windows: one program, two sides

This part is only for Windows with WSL, and it is the part that people get wrong.

VS Code is installed on Windows, like any Windows program. But your files live in Ubuntu. An extension called WSL connects the two. With it, the window that you see runs on Windows, while a small helper runs inside Ubuntu. The helper reads and saves the files there, the Linux way, and the built-in terminal becomes your Ubuntu terminal.

You can always check which side you are on. Look at the bottom left corner of the window. When it shows "WSL: Ubuntu", the editor is working inside Linux.

| Your way to practice | What you do in this lesson |
|---|---|
| Windows with WSL | Install VS Code on Windows, add the WSL extension, start it from Ubuntu |
| macOS | Install VS Code, add the `code` command |
| Linux | Install VS Code |
| Codespaces | Nothing. A codespace is VS Code in a browser tab. Start at step 4 |
| Practice terminal only | Nothing. Read the lesson. Lesson 1.3 teaches an editor that works inside a terminal |

## Try it

### 1. Install VS Code

Go to the official site, `code.visualstudio.com`, and download the version for your system.

**On Windows:** run the installer. Accept the proposed settings. On the page called "Select Additional Tasks", make sure that "Add to PATH" is ticked. It is ticked by default.

**On macOS:** open the downloaded file. Drag "Visual Studio Code" into the Applications folder.

**On Ubuntu, but not in WSL:** open the App Center, search for "code" and install "Visual Studio Code". On another Linux, follow the instructions for your distribution on the official site.

If you use WSL, do not install anything inside Ubuntu. The Windows installation is the only one you need.

### 2. Windows: add the WSL extension

Start VS Code from the Start menu. In the narrow bar on the left, click the icon made of four squares. It opens the list of extensions.

Type `WSL` in the search field. Choose the extension called "WSL", published by Microsoft, and click "Install". Then close VS Code.

### 3. macOS: add the code command

Start VS Code. Press Command, Shift and P together. A search field opens at the top: it is called the Command Palette. Type `shell command` and choose "Shell Command: Install 'code' command in PATH". Then close VS Code.

### 4. Make a folder and open it from the terminal

Open your terminal: Ubuntu on Windows, Terminal on macOS. Type these two lines.

```bash
mkdir editor-test
cd editor-test
```

The first line makes a folder called `editor-test`. The second one steps into it. Lesson 1.2 comes back to both. Now start the editor from there.

<!-- lab: skip -->
```bash
code .
```

`code` starts VS Code, and the dot means "the folder where I am now". A VS Code window opens on `editor-test`.

On WSL, the first start prints a line about installing "VS Code Server". That is the helper for the Linux side, and it is installed only once. When the window is open, look at the bottom left corner: it shows "WSL: Ubuntu".

VS Code may ask whether you trust the authors of the files in this folder. The folder is yours, so answer yes.

In a codespace, skip `code .`. The editor is already open around your terminal, and the new folder appears in the left column.

### 5. Create a file and save it

In the left column, move the mouse over the name of the folder. Small icons appear. In a codespace, the left column shows the course files, so first click the folder `editor-test` in it: the new file then goes inside that folder. Click the first one, "New File", type `hello.txt` and press Enter. The file opens on the right. Type these two lines in it.

```text title="hello.txt"
This file was written in my editor.
The terminal can read it too.
```

Look at the tab with the name of the file. A round dot next to the name means "not saved yet". Press Ctrl and S together, or Command and S on macOS. The dot disappears: the file is now on the disk.

### 6. Read the file from the terminal

Go back to the terminal window.

```bash
ls
cat hello.txt
```

```output
hello.txt
This file was written in my editor.
The terminal can read it too.
```

`ls` lists the folder and finds your new file. `cat` prints what is inside it. The editor and the terminal are two windows on the same folder: what you save in one, the other sees at once. All your work in this course follows this pattern. You write in the editor and you run in the terminal.

### 7. Open the terminal inside the editor

In VS Code, open the "Terminal" menu at the top and choose "New Terminal". A panel opens under your file, with a terminal that is already in `editor-test`. On WSL, it is your Ubuntu.

Type `ls` there. You get the same answer as in step 6. From now on, use the separate terminal window or this panel, as you prefer. They are the same thing.

### 8. Clean up

Close the VS Code window. Then, in the terminal:

```bash
cd ..
rm -r editor-test
```

`cd ..` goes back up one level, to the place where you started. `rm -r` deletes the folder and what is in it, for good, so type the name with care. Your home is empty again, which is how Module 1 expects to find it.

:::caution[On Windows, do not use Notepad for course files]
Windows and Linux do not mark the end of a line in the same way. A script saved by Notepad can carry the Windows marks, and Linux then refuses to run it with a strange message about `\r`. VS Code connected to WSL saves files the Linux way. That is why step 2 matters.
:::

## Exercise

Do it without looking at the steps.

1. In your home folder, make a folder called `second-test` and open it in VS Code.
2. Create a file called `me.txt` with three lines: your first name, your system, and your way to practice.
3. Save it, and show its content in the terminal.
4. Delete the folder.

<details>
<summary>Show the solution</summary>

```bash
mkdir second-test
cd second-test
```

<!-- lab: skip -->
```bash
code .
```

In VS Code, create `me.txt`, type your three lines and save with Ctrl and S. Sam's file looks like this:

```text title="me.txt"
Sam
Windows 11 with WSL
My own computer
```

Back in the terminal:

```bash
cat me.txt
```

```output
Sam
Windows 11 with WSL
My own computer
```

If `cat` prints nothing, the file is not saved: look for the dot on its tab. Then clean up:

```bash
cd ..
rm -r second-test
```

</details>

## Check yourself

**1. Why do you not write code in a word processor?**

<details>
<summary>Answer</summary>

A word processor stores invisible information around the text, such as fonts and layout. Code must be plain text, characters and nothing else, because the computer reads every character of the file.

</details>

**2. What does `code .` do?**

<details>
<summary>Answer</summary>

It starts VS Code and opens the folder where the terminal is at that moment. The dot means "here".

</details>

**3. You use Windows with WSL. How do you check that VS Code is working on the Linux side?**

<details>
<summary>Answer</summary>

Look at the bottom left corner of the window. It shows "WSL: Ubuntu" when the editor is connected to your Ubuntu.

</details>

**4. You changed a file in the editor, but `cat` in the terminal still prints the old content. What is the most likely reason?**

<details>
<summary>Answer</summary>

The file is not saved. A round dot on the tab of the file says so. Press Ctrl and S, or Command and S on macOS, and run `cat` again.

</details>

## Common mistakes

- **`code: command not found`.** On Windows, close the Ubuntu window and open it again: it must restart once after the installation of VS Code. If that changes nothing, install VS Code again and check that "Add to PATH" is ticked. On macOS, do step 3.
- **Installing VS Code inside WSL.** It does not belong there. Install it on Windows and add the WSL extension.
- **Opening one file and not the folder.** You lose the list of files on the left, and the built-in terminal starts in the wrong place. Use `code .` from inside the folder.
- **Forgetting to save.** The terminal only sees what is on the disk. No dot on the tab means saved.

## Key terms

- **Code editor**: a program made for writing code and other plain text, with tools such as syntax highlighting and a file list.
- **Plain text**: a file that contains only characters, with no fonts, no layout and no hidden formatting.
- **Visual Studio Code**: the free code editor used in this course, often called VS Code. Its command in the terminal is `code`.
- **Syntax highlighting**: colours that an editor gives to the words of a program according to their role.
- **Extension**: an add-on that gives an editor a new ability, such as working inside WSL.

## Go further

- [Setting up Visual Studio Code](https://code.visualstudio.com/docs/getstarted/overview): the official installation guide for every system.
- [Developing in WSL](https://code.visualstudio.com/docs/remote/wsl): the official explanation of how VS Code works with WSL, with a diagram of the two sides.
- [Visual Studio Code tips and tricks](https://code.visualstudio.com/docs/editing/getting-started/tips-and-tricks): the keyboard shortcuts and small features that save time, from the people who make the editor.
