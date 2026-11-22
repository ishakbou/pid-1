---
title: Three ways to practice
description: Compare the practice terminal in the page, GitHub Codespaces and Linux on your own computer, and choose the one that fits you today.
lesson: "0.3"
time: 15 min
practiceTerminal: true
sidebar:
  order: 3
---

A course about Linux has a small chicken-and-egg problem. To learn Linux you need a Linux. To install one, it helps to know a little Linux already. This course gets around that by giving you three places to practice, and the first one needs no installation at all.

## Goal

After this lesson you can:

- Describe the three ways to practice and the limits of each one.
- Start the practice terminal, use it and reset it.
- Choose the way that fits your computer today.

## Why it matters

Every lesson after this one asks you to type commands somewhere. If you choose a place that cannot do what a lesson needs, you get errors that have nothing to do with you, and you lose an evening wondering what you did wrong. Ten minutes here tell you what each place can and cannot do, so that an error later means something.

## The idea

Imagine you want to learn woodworking, and you can work in three places.

The first is a small bench placed right next to the instructions. It has real tools, but only a few, and somebody clears it each time you leave. The second is a rented workshop, fully equipped, with a number of free hours each month. The third is a workshop in your own home. It takes an afternoon to set up. After that it is yours: no hours to count, and your work stays where you left it.

The three ways to practice match these three places.

### 1. The practice terminal

You met it in lesson 0.1: a small Linux that runs inside the lesson page. Your browser downloads it and runs it by itself. Nothing is installed, there is no account, and no other computer is involved.

It is a real Linux, but a very small one. Its commands come from **BusyBox**, one compact program that contains simple versions of the most common Linux commands. This has consequences:

- Some commands are missing, and some accept fewer options than on a full Linux.
- It cannot reach the internet, so you cannot install anything in it.
- It keeps nothing. Reload the page and you get a new, empty system.

A lesson shows the practice terminal only when its commands work there. That is the case for a good part of Module 1 and for a few lessons later on.

### 2. GitHub Codespaces

**GitHub** is a website where people keep and share their projects. One of its services is **Codespaces**: GitHub starts a full Linux computer for you on its own machines, and you use it through a tab of your browser. The tab shows a code editor with a terminal at the bottom.

Your own computer only displays the page, so even a weak machine is enough. The Linux behind it is a full Ubuntu with internet access, where you can install software. Your files are still there the next day.

This course has a lab prepared for Codespaces, with the tools of every module already installed. Step 5 below shows how to open it.

There are three things to know:

- You need a GitHub account, which is free.
- The free use is limited each month. At the time of writing it covers about 60 hours a month on the smallest machine. If you use it up, Codespaces stops until the next month. It does not send you a bill.
- A codespace that you do not open for 30 days is deleted. It is a place to work, not a place to keep things. Module 2 shows you how to store your project safely.

Only a few late lessons need a computer of your own. The main case is Module 14, where you run a second, complete computer inside yours.

### 3. Linux on your own computer

This is the main road, and the one the lessons are written for. What you do depends on your system:

- On Windows you install **WSL**, a feature made by Microsoft that runs a real Ubuntu inside Windows. You keep Windows exactly as it is.
- On macOS you use the Terminal application that is already there. macOS is not Linux, but it is a close relative, and most commands are the same. Where they differ, the lessons say so.
- On Linux you have nothing to do.

It costs you one setup session, which is lesson 0.4. Then it works without limits, without an account and, once the tools are installed, without an internet connection. It is also how professionals work, so every habit you build is one you keep.

### Side by side

| | Practice terminal | Codespaces | Your own computer |
|---|---|---|---|
| Where it runs | In the lesson page | On GitHub's machines | On your machine |
| To install | Nothing | Nothing | WSL on Windows |
| Account | None | GitHub, free | None |
| Which Linux | A tiny one (BusyBox) | A full Ubuntu | A full Ubuntu |
| Internet inside | No | Yes | Yes |
| Installing software | No | Yes | Yes |
| Your files | Erased at reload | Kept, deleted after 30 unused days | Kept on your disk |
| Limit | Few commands | Free hours each month | None |

### How to choose

- Your computer passed the checks of lesson 0.2 and you are allowed to install programs: use **your own computer**.
- You cannot install anything, or the machine is too weak: use **Codespaces** for the course, and the practice terminal for quick tries.
- You only want to see what this is about before you decide: start Module 1 in the **practice terminal**, and come back to choose later.

The choice is not final. The lessons are the same for everybody, and you can move from one way to another whenever you like.

## Try it

### 1. Check that it is a real Linux

Open the practice terminal on this page, wait for the cursor, and type:

```bash
uname
```

```output
Linux
```

`uname` prints the name of the system that is running. This is not a website that imitates a terminal: a Linux system started inside your browser, and it answered you.

### 2. Leave a trace

```bash
mkdir trace
ls
```

```output
trace
```

`mkdir` makes a new folder, here called `trace`. `ls` lists what is in the place where you are. Lesson 1.2 teaches both properly.

### 3. Reload the page

Reload this page in your browser. Open the practice terminal again and type `ls` once more.

This time `ls` prints nothing. The folder `trace` is gone, and so is everything else you did. You did not go back to the same system: your browser built a new one.

This is the main quality of the practice terminal and also its main limit. You cannot break it, because a reload repairs everything. And you cannot keep anything in it, for the same reason.

### 4. Meet a limit

Still in the practice terminal, type `apt` and press Enter.

The answer is that the command is not found. `apt` is the program that installs software on Ubuntu, and you will use it in lesson 0.4. This tiny Linux does not have it, and it has no internet connection to download anything with. When a lesson needs `apt`, it does not show a practice terminal, and you do that lesson in one of the two other ways.

### 5. Open the course lab in Codespaces

Do this step only if Codespaces is your plan. If you will use your own computer, read it and move on.

1. Go to `github.com` and sign in. If you have no account, choose "Sign up". Take a username that you would be happy to show to an employer one day, because it becomes part of the address of your projects.
2. Open the page of this course on GitHub: [github.com/ishakbou/pid-1](https://github.com/ishakbou/pid-1). The files of the course are stored there, and the description of the lab is one of them.
3. Click the green "Code" button, choose the "Codespaces" tab, and click "Create codespace on main".
4. Wait. The first start takes a few minutes, because GitHub builds the lab and installs its tools. Then a code editor opens in the tab, with a panel at the bottom. That panel is a terminal on your new Linux.
5. Click in the panel, type `uname`, and press Enter. You get the same answer as in step 1, from a much bigger machine.

In a codespace your user is called `vscode`, and your files are in `/home/vscode`. The lessons show a user called `sam`, so read `vscode` wherever a path or an output says `sam`.

When you are done, close the tab. The codespace stops by itself after 30 minutes without activity. Next time, do not create a new one: open the one you have from the list at `github.com/codespaces`, because your files are in it. From that list you can also stop it at once, which saves your free hours.

### 6. Write down your choice

Take the note where you wrote your numbers in lesson 0.2 and add one line: the way you start with. You need it for the next lesson.

- Your own computer: do lesson 0.4 completely.
- Codespaces: read lesson 0.4 without installing anything. Your Linux already exists.
- Practice terminal only: the same. Come back to lesson 0.4 the day you get access to a computer of your own.

:::note[What the lessons show]
The outputs printed in the lessons come from a full Ubuntu. In the practice terminal, a result can look slightly different: another order, fewer columns, a shorter message. If the meaning is the same, you did nothing wrong.
:::

## Exercise

**Part 1.** In the practice terminal, make two folders called `today` and `tomorrow`, and list them. Then make them disappear without typing any command.

**Part 2.** For each sentence, name the way or the ways it describes.

1. "I installed nothing and I have no account."
2. "My files are still there next week."
3. "I have to watch my free hours."
4. "Once it is set up, it works without the internet."

<!-- lab: run
rmdir trace
-->

<details>
<summary>Show the solution</summary>

**Part 1.**

```bash
mkdir today tomorrow
ls
```

```output
today  tomorrow
```

To make them disappear, reload the page. The new system has never heard of them.

**Part 2.**

1. The practice terminal.
2. Codespaces and your own computer.
3. Codespaces.
4. Your own computer.

</details>

## Check yourself

**1. Which of the three ways needs an account, and where?**

<details>
<summary>Answer</summary>

Codespaces. It needs a GitHub account, which is free. The practice terminal and your own computer need no account.

</details>

**2. Yesterday you created a file in the practice terminal. Where is it today?**

<details>
<summary>Answer</summary>

Nowhere. The practice terminal keeps nothing: each time the page is loaded, the browser builds a new, empty system.

</details>

**3. Why can you not install software in the practice terminal?**

<details>
<summary>Answer</summary>

For two reasons. It is a tiny Linux built on BusyBox, without the `apt` program that installs software. And it has no internet connection, so it could not download anything.

</details>

**4. Your computer is good enough and you may install programs. Which way does the course recommend, and why?**

<details>
<summary>Answer</summary>

Linux on your own computer. It has no limits, needs no account, works without the internet once the tools are installed, and it is how professionals work. The lessons are written for it.

</details>

## Lesson map

```mindmap
Three ways to practice
  Practice terminal
    in the lesson page
    nothing to install
    tiny Linux (BusyBox)
    reload erases everything
  GitHub Codespaces
    full Ubuntu in a tab
    free GitHub account
    free hours each month
    stops when idle
  Your own computer
    WSL on Windows
    Terminal on macOS
    any Linux
    no limits
  How to choose
    can install: own computer
    cannot install: Codespaces
    quick try: practice terminal
```

## Common mistakes

- **Keeping work in the practice terminal.** It is erased at the next reload. Anything you want to keep belongs on your own computer or in a codespace.
- **Leaving a codespace open all day.** It uses your free hours while it runs. Close the tab when you stop, or stop it from the list.
- **Storing important work only in a codespace.** An unused codespace is deleted after 30 days. From Module 2 on, you save your project on GitHub itself.
- **Spending a week on the choice.** Any of the three is good enough to start Module 1 today, and you can change later.

## Key terms

- **BusyBox**: one small program that provides simple versions of the most common Linux commands. Tiny Linux systems are built on it.
- **GitHub**: a website where people keep, share and work together on projects. Module 2 is about it.
- **Codespaces**: a service of GitHub that starts a full Linux computer for you on GitHub's machines and shows it in a browser tab. One such computer is called a codespace.

## Go further

- [GitHub Codespaces documentation](https://docs.github.com/en/codespaces): the official guide, including the current free allowance and how to stop or delete a codespace.
- [What is the Windows Subsystem for Linux?](https://learn.microsoft.com/en-us/windows/wsl/about): Microsoft's short presentation of WSL.
- [BusyBox](https://busybox.net/about.html): the project behind the practice terminal's commands, described by its authors.
