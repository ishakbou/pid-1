---
title: What you need
description: Check that your computer is good enough for the course, see the list of free tools it uses, and pick a plan if your machine is old, slow or not yours.
lesson: "0.2"
time: 15 min
sidebar:
  order: 2
---

Do you need a fast, expensive laptop to study computer science and security? No. Most of the work in this course is text: you type commands, you write short programs, you read what comes back. Text is the lightest thing a computer can handle, and a ten-year-old machine does it without effort.

## Goal

After this lesson you can:

- Check the memory, the free disk space and the system of your own computer.
- List the tools the course uses, and say what each one costs (nothing).
- Choose a plan if your machine is old, slow or locked by a school or an employer.

## Why it matters

Many people put off starting because they believe they first need a new laptop or paid software. They do not. But there are a few real limits, and it is better to meet them now than in the middle of an installation that fails at 80 percent. Ten minutes of checking today saves you an evening of confusion later.

## The idea

Learning to drive does not take a racing car. It takes a car that starts, steers and brakes. This course needs the same kind of computer: one that runs, with a little room to spare.

Three numbers describe that room.

**RAM**, also called memory, is the space your computer uses for the programs that are open right now. Think of it as the surface of your desk. With a small desk you can still work, but only on one or two things at a time. RAM is measured in gigabytes, written **GB**.

**Disk space**, also called storage, is where files and installed programs stay, even when the computer is off. It is the cupboard next to the desk. What counts for this course is the free part of it.

The **operating system** is the main program that runs the machine and every other program on it: Windows, macOS or Linux. The course works with all three, but an old version of Windows cannot run the tool you install in lesson 0.4.

Here is what the course asks for. These are my recommendations, not hard limits.

| | Enough to start | Comfortable |
|---|---|---|
| RAM | 4 GB | 8 GB or more |
| Free disk space | 20 GB | 40 GB or more |
| Operating system | Windows 10 or 11 (64-bit), macOS, or any Linux | The same, with the latest updates |
| Browser | A recent Firefox, Chrome, Edge or Safari | The same |
| Internet | Any connection that can load this site | A connection without a small data limit |

"64-bit" describes the kind of processor and system you have. Almost every computer sold since about 2010 is 64-bit, and step 1 below shows you how to check. The internet connection matters mostly on installation days, when you download a few hundred megabytes.

The numbers in the "Comfortable" column become useful late in the course. In Module 14 you run a second, complete computer inside your own, and that one needs memory and disk space of its own. For Modules 0 to 13, the first column is fine.

### Free tools only

Every tool in this course is free. Not a trial that ends after 30 days, and not a "student edition" with missing parts.

| Tool | What you use it for | First needed |
|---|---|---|
| Ubuntu | The Linux system that every lesson is written for | Lesson 0.4 |
| Visual Studio Code | Writing and editing files | Lesson 0.5 |
| Git | Keeping the history of your project | Module 2 |
| A GitHub account | Putting your project online | Module 2 |
| Python | Writing programs | Module 3 |
| SQLite | Storing data in a database | Module 7 |

You install each tool in the lesson that first needs it, so there is no long setup day. Most of them are also **open source**: their code is public, and anyone may read it, use it and improve it. That is one reason why they are free, and why professionals trust them.

If a website asks for your bank card before it lets you download one of these tools, you are on the wrong website. Close it and go to the official one. The lessons always give you the official address.

### An old, slow or locked machine

You are not stuck. Lesson 0.3 presents three ways to practice, and two of them need nothing installed.

| Your situation | A plan that works |
|---|---|
| Less than 4 GB of RAM, or a machine that is slow with one program open | Use the practice terminal in the lesson pages and GitHub Codespaces. Codespaces runs on GitHub's computers, so yours only has to show a web page. Later, a light version of Ubuntu such as Xubuntu or Lubuntu can give an old machine a second life |
| Less than 20 GB free | Empty the recycle bin and the Downloads folder, and remove programs you never use. Then check again |
| A school or work computer where you cannot install anything | Practice terminal and Codespaces, in the browser |
| A Chromebook | Practice terminal and Codespaces. Many Chromebooks can also switch on a built-in Linux in their settings |
| Only a phone or a tablet | You can read the lessons and answer the questions. For the typing, you need a real keyboard: borrow a computer, or use one in a library |

## Try it

Find the three numbers for your own computer. Follow the part that matches your system and write the numbers down. You need them at the end.

### 1. Find your memory and your system

**On Windows:** press the Windows key, type `about`, and choose "About your PC". Under "Device specifications", read two lines. "Installed RAM" is your memory. "System type" should say "64-bit operating system". A little lower, under "Windows specifications", read "Edition" and "Version". Keep that window open for lesson 0.4.

**On macOS:** click the Apple menu in the top left corner and choose "About This Mac". The window shows the memory, the processor or chip, and the macOS version.

**On Linux:** you already have a terminal, so ask it. Open it and type this command.

<!-- lab: nocheck -->
```bash
free -h
```

```output
               total        used        free      shared  buff/cache   available
Mem:           2.8Gi       366Mi       2.4Gi       1.0Mi       312Mi       2.5Gi
Swap:             0B          0B          0B
```

Read the number under `total` in the `Mem:` line. This test machine has 2.8 GB. That is below the table, and it is the machine on which the commands of this course were tested. The numbers on your screen are your own.

```bash
uname -m
```

```output
x86_64
```

`x86_64` means a 64-bit processor of the usual kind. On some newer computers the answer is `aarch64` or `arm64`, which is 64-bit too.

If you are on Windows or macOS, you cannot run these two commands yet. Read them and move on. You get your own Linux in lesson 0.4.

### 2. Find your free disk space

**On Windows:** open File Explorer and click "This PC" on the left. Under "Local Disk (C:)" a bar shows how full the disk is, with a line such as "112 GB free of 237 GB".

**On macOS:** open the Apple menu, then "System Settings", "General", "Storage". On older versions of macOS, the same information is in "About This Mac", under "Storage".

**On Linux:** one more command.

<!-- lab: nocheck -->
```bash
df -h ~
```

```output
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1        19G  1.7G   17G   9% /
```

The `~` sign is a short way to write "my own folder". The column to read is `Avail`: the free space on the disk that holds your files. Here it is 17 GB.

### 3. Check your browser

In lesson 0.1 you started the practice terminal and ran a command in it. If that worked, your browser is recent enough for everything on this site. If the terminal never appeared, update your browser, or try another one, and go back to test it once more.

### 4. Compare with the table

Put your three numbers next to the table in "The idea".

- All of them reach the first column: you can do everything on your own computer. Lesson 0.4 is for you.
- Memory or disk space is below it, or the computer is not yours: find your row in the second table. Your plan uses the two browser options of lesson 0.3.
- You are between two cases: start on your own computer anyway. You can change your mind at any time, because the lessons are the same for everybody.

:::note[Windows 10 still works]
The tool of lesson 0.4 needs Windows 11, or Windows 10 in version 2004 or later. If the "Version" line you read in step 1 shows an older number than 2004, run Windows Update first. Versions written with an H, such as 20H2, 21H2 or 22H2, came after 2004 and are fine. Microsoft ended its normal support for Windows 10 in October 2025, so move to Windows 11 when your computer allows it.
:::

## Exercise

Three students want to start the course. For each one, say what you would advise, using the two tables.

1. Omar has a Windows 10 laptop from 2014 with 4 GB of RAM and 9 GB free.
2. Mei has a Chromebook from her school. She cannot install programs on it.
3. Tomas has a MacBook with 8 GB of RAM and 60 GB free. He thinks he must buy Windows to follow a course about Linux.

<details>
<summary>Show the solution</summary>

1. Omar has enough memory to start, but not enough free disk space: 9 GB is below 20 GB. He cleans up his disk first and checks again. He also reads the "Version" line of Windows: it must be 2004 or later for lesson 0.4. With 4 GB of RAM he should close other programs while he studies. If the computer still struggles, he moves to the practice terminal and Codespaces.

2. Mei uses the practice terminal and Codespaces. Both run in the browser, so nothing is installed on the school's machine.

3. Tomas needs to buy nothing. macOS is one of the three supported systems, and it already contains a terminal. His numbers are fine. Lesson 0.4 shows him what to prepare.

</details>

## Check yourself

**1. How much RAM is enough to start the course, and how much is comfortable?**

<details>
<summary>Answer</summary>

4 GB is enough to start. 8 GB or more is comfortable, and it becomes useful in Module 14.

</details>

**2. Which tools of the course cost money?**

<details>
<summary>Answer</summary>

None. Ubuntu, Visual Studio Code, Git, Python, SQLite and a GitHub account are all free. A website that asks for a bank card for one of them is not the official one.

</details>

**3. Your computer has 3 GB of RAM and you cannot change that. Can you follow the course?**

<details>
<summary>Answer</summary>

Yes. Use the practice terminal in the lesson pages and GitHub Codespaces. With Codespaces the work runs on GitHub's computers, and yours only shows a web page.

</details>

**4. What is the difference between RAM and disk space?**

<details>
<summary>Answer</summary>

RAM is the working space for the programs that are open right now. Disk space is where files and installed programs stay, even when the computer is off. A computer can have plenty of one and too little of the other.

</details>

## Common mistakes

- **Buying a computer before starting.** Start with what you have. If a limit really blocks you, you will know exactly which one, and the browser options cover most cases.
- **Downloading tools from the first search result.** Fake download sites exist for every popular program, and some add unwanted software. Use the official addresses given in the lessons.
- **Mixing up RAM and disk space.** "I have 500 GB, so memory is fine" confuses the cupboard with the desk. Check both numbers.
- **Starting an installation on a full disk.** It stops halfway and leaves a mess. Free the space first.

## Key terms

- **RAM**: the memory a computer uses for the programs that are running right now. It is emptied when the computer is switched off.
- **Disk space**: the room available for files and installed programs. It keeps its content when the computer is off. Also called storage.
- **Operating system**: the main program that runs a computer and all other programs on it, such as Windows, macOS or Linux.
- **GB**: gigabyte, the unit used for both RAM and disk space.
- **Open source**: software whose code is public, so that anyone may read it, use it and improve it.

## Go further

- [Install WSL](https://learn.microsoft.com/en-us/windows/wsl/install): Microsoft's own page about the tool of lesson 0.4, with the Windows versions it accepts.
- [Ubuntu flavours](https://ubuntu.com/desktop/flavors): the official variants of Ubuntu. Xubuntu and Lubuntu are the light ones, made for older computers.
- [The Open Source Definition](https://opensource.org/osd): the official definition of open source, written by the Open Source Initiative. Short and readable.
