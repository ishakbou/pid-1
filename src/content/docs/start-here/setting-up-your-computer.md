---
title: Setting up your computer
description: Install WSL and Ubuntu on Windows, or prepare the terminal on macOS and Linux, then create your Linux user and update the system.
lesson: "0.4"
time: 25 min
sidebar:
  order: 4
---

Windows can run Linux. Not an imitation and not a website: a complete Ubuntu, working next to your Windows programs, installed by one command that Microsoft wrote. Fifteen years ago this sentence would have sounded like a joke. Today it is the normal way to do this course on a Windows computer.

## Goal

After this lesson you can:

- Install WSL and Ubuntu on Windows, or open and prepare the terminal on macOS or Linux.
- Create your Linux user and password.
- Update the system, and check that your terminal answers.

## Why it matters

This is the only big installation of the whole course. When it is done, every later lesson starts with "open your terminal" and nothing else. The lesson also gives you your first security habit: updating. Many attacks on ordinary computers use a weakness that already had a fix, on a machine where nobody installed it.

## The idea

**WSL** means Windows Subsystem for Linux. It is a feature of Windows that runs a real Linux inside it. You do not replace Windows, you do not split your disk, and you do not restart the computer to change from one to the other.

A good picture is a lodger with a room in your house. The lodger has a key of their own, furniture of their own and habits of their own, but uses the electricity and the water of the house. In the same way, the Linux inside WSL has its own users, its own password, its own files and its own programs. It shares the processor, the memory and the internet connection with Windows.

The Linux you install is **Ubuntu**. Linux alone is only the core of a system. A **distribution** is a complete system built around that core: the core, a set of programs chosen to work together, and a tool to install more. Ubuntu is one of the most used distributions in the world, on laptops and on servers, and all lessons are written for it.

Two details surprise almost everybody on Windows:

- **Two accounts.** Your Linux username and password have nothing to do with your Windows ones. You choose new ones during the installation.
- **Two sets of files.** Ubuntu keeps its files in its own space, apart from `C:`. Keep everything you do for this course on the Linux side. It is faster there, and the file permissions of lesson 1.4 only behave correctly there.

What you do in this lesson depends on your system.

| Your system | What you do | Steps |
|---|---|---|
| Windows | Install WSL with Ubuntu, create your Linux user | 1 to 4, then 7 to 11 |
| macOS | Open Terminal and install Apple's command line tools | 5, then 7 |
| Ubuntu or another Linux | Open the terminal | 6, then 7 to 11 |
| Codespaces | Nothing to install: open your codespace | 7 to 10 |
| Practice terminal only | Nothing to install: read the lesson | none |

## Try it

The outputs below come from a user called `sam`. Your screen shows the name you choose.

### 1. Windows: check your version

Press the Windows key and R together, type `winver` and press Enter. A small window shows the version of Windows.

You need Windows 11, or Windows 10 in version 2004 or later. Versions such as 20H2, 21H2 and 22H2 came after 2004, so they are fine. If your version is older, open Windows Update, install everything it offers, and come back.

### 2. Windows: open PowerShell as administrator

Open the Start menu and type `powershell`. Right-click "Windows PowerShell" in the results and choose "Run as administrator". Windows asks for a confirmation: answer "Yes".

**PowerShell** is the terminal of Windows itself. Its lines begin with `PS`, followed by a folder such as `C:\Windows\system32`. You need it for one command only.

### 3. Windows: install WSL and Ubuntu

Type this in the PowerShell window and press Enter.

```powershell
wsl --install
```

Windows downloads WSL, then Ubuntu. This takes a few minutes or much longer, depending on your connection. When it finishes, it asks you to restart the computer. Do it: the installation is not complete without a restart. On some computers Windows asks for no restart and shows the questions of step 4 in the same window. That is fine: answer them there.

If something else happens, look for it here.

| What you see | What to do |
|---|---|
| A long help text with a list of options | WSL is already on your computer. Run `wsl --install -d Ubuntu` to add Ubuntu |
| An error that mentions virtualization, or the BIOS | A setting is switched off in the firmware of your computer. Search for the model of your computer with the words "enable virtualization". The setting is often called Intel VT-x, AMD-V or SVM |
| The download stops, or the server cannot be reached | Try again later, or from another network |
| `wsl` is not recognised as a command | Your Windows is too old. Run Windows Update, then start again at step 1 |

If none of this helps, do not lose a week on it. Go on with Codespaces from lesson 0.3 and try WSL again another day.

### 4. Windows: create your Linux user

After the restart, a window called "Ubuntu" opens by itself and finishes the installation. If it does not open, find "Ubuntu" in the Start menu.

It asks for a new UNIX username. Type a short name in small letters, without spaces, such as your first name, and press Enter.

Then it asks for a new password, twice. Nothing appears on the screen while you type it: no letters, no stars, no dots. The keyboard is not broken. Linux hides the length of passwords on purpose. Type it, press Enter, and type it once more.

When you see a line that looks like `sam@laptop:~$`, you are in. That line is Ubuntu waiting for a command. From now on, this window is "your terminal". Continue at step 7.

### 5. macOS: open Terminal and install Apple's tools

Press Command and Space together, type `Terminal` and press Enter. A window with a line of text and a cursor opens. Then type:

<!-- lab: skip -->
```bash
xcode-select --install
```

A dialog asks whether you want to install the command line developer tools. Choose "Install" and let it finish. This adds Git and several other programs that later modules use. If the answer is that the tools are already installed, you have nothing to do.

Two things differ from Ubuntu. macOS has no `apt`, the program that installs software in steps 9 and 10. The usual replacement is called Homebrew, and you can wait until a lesson first needs it. And system updates are done in "System Settings", under "General" and "Software Update", so steps 8 to 10 are not for you. Do step 7, then go to the exercise.

### 6. Linux: open your terminal

On Ubuntu, press Ctrl, Alt and T together. On other distributions, look for "Terminal" or "Konsole" in the applications menu.

If your distribution is not Ubuntu, Debian or Linux Mint, the commands that install software have another name: `dnf` on Fedora and `pacman` on Arch, for example. Everything else in the course is the same.

### 7. Ask who you are

```bash
whoami
```

```output
sam
```

`whoami` prints the name of the user who is typing. On WSL, it is the username you chose in step 4, not your Windows name. In the course's codespace it prints `vscode`, the user that the lab gives everybody. Both are normal.

### 8. Check which Ubuntu you have

```bash
lsb_release -d
```

```output
Description:    Ubuntu 24.04.5 LTS
```

Your numbers may be higher, because a new Ubuntu comes out regularly. "LTS" means long-term support: this version receives security fixes for years.

### 9. Refresh the list of software

<!-- lab: nocheck -->
```bash
sudo apt update
```

```output
Hit:1 http://security.ubuntu.com/ubuntu noble-security InRelease
Hit:2 http://archive.ubuntu.com/ubuntu noble InRelease
Get:3 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]
Hit:4 http://archive.ubuntu.com/ubuntu noble-backports InRelease
Get:5 http://archive.ubuntu.com/ubuntu noble-updates/main amd64 Packages [1475 kB]
Get:6 http://archive.ubuntu.com/ubuntu noble-updates/universe amd64 Packages [1716 kB]
Fetched 3317 kB in 13s (247 kB/s)
Reading package lists...
Building dependency tree...
Reading state information...
62 packages can be upgraded. Run 'apt list --upgradable' to see them.
```

Two new words here. `sudo` means "run this command as the administrator". It asks for your Linux password. Again nothing appears while you type, or, on some newer versions of Ubuntu, one star for each character. `apt` is the program that installs software on Ubuntu.

`apt update` installs nothing. It downloads the current catalogue of software from Ubuntu's servers, so that your system knows which newer versions exist. Your lines and numbers will differ from these. Read the last line: it says how many programs have a newer version waiting.

### 10. Install the updates

<!-- lab: nocheck -->
```bash
sudo apt upgrade -y
```

This is the command that really updates. A long list scrolls by while `apt` downloads and installs the newer versions. The `-y` answers "yes" in advance to the question "Do you want to continue?". The first time, it can take several minutes.

Run steps 9 and 10 about once a week. It takes a minute and it closes known security holes. Lesson 1.6 explains `apt` in detail.

### 11. Close the terminal and open it again

Type `exit` and press Enter. The window closes.

Now open it again, so that you know the way. On Windows, find "Ubuntu" in the Start menu. Right-click its icon in the taskbar and pin it: you will open it every day. On Ubuntu, press Ctrl, Alt and T.

:::tip[Your Linux files, seen from Windows]
In File Explorer, look at the bottom of the left column: there is an entry called "Linux". Under it you find Ubuntu, then `home`, then your username. That is your Linux home, where the files of this course will live.
:::

## Exercise

Your terminal is closed. Without looking at the steps above:

1. Open it.
2. Make it print your username.
3. Make it print your version of Ubuntu.
4. Refresh the list of software again, and read the last line. What does it say this time, and why?

On macOS, do tasks 1 and 2 only.

<details>
<summary>Show the solution</summary>

```bash
whoami
```

```output
sam
```

```bash
lsb_release -d
```

```output
Description:    Ubuntu 24.04.5 LTS
```

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

The last line now says that all packages are up to date, because step 10 installed everything that was waiting. If it still announces a few packages, do not worry. Ubuntu sometimes releases an update to a part of its users first, and yours will arrive within some days.

</details>

## Check yourself

**1. What does WSL give you, and what happens to Windows?**

<details>
<summary>Answer</summary>

A real Linux, here Ubuntu, that runs inside Windows. Windows stays exactly as it was. Both work at the same time, and you do not restart to change from one to the other.

</details>

**2. You type your password after `sudo apt update` and nothing appears on the screen. What is wrong?**

<details>
<summary>Answer</summary>

Nothing. Linux usually shows nothing at all while you type a password. Some newer versions of Ubuntu show stars, and both are normal. Type the password and press Enter.

</details>

**3. What is the difference between `sudo apt update` and `sudo apt upgrade`?**

<details>
<summary>Answer</summary>

`apt update` only downloads the catalogue of available software, so the system knows which newer versions exist. `apt upgrade` downloads and installs those newer versions. You run them in that order.

</details>

**4. On Windows, where should the files of this course live, and why?**

<details>
<summary>Answer</summary>

On the Linux side, in your Linux home, and not on `C:`. Work is faster there, and file permissions only behave correctly there.

</details>

## Common mistakes

- **Opening PowerShell without "Run as administrator".** The installation then fails or asks for more rights. Close the window and open it again the right way.
- **Skipping the restart.** WSL is only half installed until Windows restarts. If the Ubuntu window shows an error just after the installation, restart first.
- **Forgetting the Linux password.** There is no "forgot my password" link. Write it down somewhere safe today. If it is lost anyway, Microsoft's setup guide in "Go further" explains how to reset it.
- **Typing a command in the wrong window.** `wsl --install` belongs in PowerShell. `sudo apt update` belongs in Ubuntu. Look at the start of the line: `PS C:\` is PowerShell, and `sam@laptop:~$` is Ubuntu.

## Key terms

- **WSL**: Windows Subsystem for Linux, a feature of Windows that runs a real Linux inside Windows.
- **Ubuntu**: a popular Linux distribution, free, used on laptops and on servers. The lessons of this course are written for it.
- **Distribution**: a complete system built around the Linux core, with a chosen set of programs and a tool to install more. Ubuntu, Debian and Fedora are distributions.
- **PowerShell**: the terminal of Windows itself. Its lines begin with `PS`.
- **LTS**: long-term support. An Ubuntu version marked LTS receives security fixes for years.

## Go further

- [Set up a WSL development environment](https://learn.microsoft.com/en-us/windows/wsl/setup/environment): Microsoft's guide for the first steps after the installation, including what to do with a forgotten password.
- [Ubuntu on WSL](https://documentation.ubuntu.com/wsl/): the documentation written by the makers of Ubuntu.
- [Terminal User Guide](https://support.apple.com/guide/terminal/welcome/mac): Apple's guide to the Terminal application on macOS.
