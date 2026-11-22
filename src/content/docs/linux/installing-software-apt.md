---
title: Installing software (apt)
description: Use apt to refresh Ubuntu's list of software, find a package, install it, keep it up to date and remove it again.
lesson: "1.6"
time: 20 min
sidebar:
  order: 6
---

How do you install a program on Windows? You search the web, guess which of the download buttons is the real one, run an installer and click "Next" five times. On Ubuntu you type one line. The program comes from a source your system already knows and trusts, and the same tool keeps it up to date for as long as it stays installed.

<!-- lab: run
sudo apt-get remove -y --purge cowsay tree > /dev/null 2>&1
-->

## Goal

After this lesson you can:

- Refresh the list of available software, then find and read about a package.
- Install a package, use it, and remove it again.
- Keep the whole system up to date.

## Why it matters

Every module from now on needs a tool that is not on a fresh Ubuntu, and `apt` is how you get it. Updates matter even more than installs. Most security fixes reach your machine as package updates, so a system that is never updated keeps every hole that was ever found in it. And knowing where your software comes from is a security skill of its own: a program from an unknown website runs with all of your rights.

## The idea

A **package** is a single file that contains a program, plus a label: its name, its version, a short description, and the list of other packages it needs to work. Those other packages are its **dependencies**. A program that draws pictures may need a **library**, a ready-made piece of code that many programs share, to read image files, for example. Installing a package means unpacking its files to the right places and remembering that you did.

The packages live on servers called **repositories**. Ubuntu runs its own, and your system is set up to use them from the start. Ubuntu signs the catalogue of each repository with a digital signature that only Ubuntu can make (Module 10 explains how), and the catalogue holds a fingerprint of every package, so your system can check that nobody changed a package on the way.

A **package manager** is the program that does the work: it finds packages, downloads them, installs their dependencies, and keeps track of what is on your system. On Ubuntu it is called **apt**.

Think of the app store on a phone. There is one trusted shop, the phone keeps a copy of its catalogue, and the same store installs, updates and removes apps. One detail matters with apt: the catalogue on your computer does not refresh itself. You refresh it with one command, and refreshing it installs nothing.

| You want to | Command | Needs `sudo` |
|---|---|---|
| Refresh the catalogue | `sudo apt update` | Yes |
| Search the catalogue | `apt search word` | No |
| Read about one package | `apt show name` | No |
| Install a package | `sudo apt install name` | Yes |
| Install newer versions of everything | `sudo apt upgrade` | Yes |
| Remove a package | `sudo apt remove name` | Yes |
| Remove it with its settings | `sudo apt purge name` | Yes |
| Remove dependencies nobody needs any more | `sudo apt autoremove` | Yes |

The rule behind the last column comes from lesson 1.4: reading the catalogue is harmless, but anything that changes the system's own files needs root.

## Try it

You need a connection to the internet for this lesson. The outputs come from Ubuntu 24.04, and yours will differ in the details: other version numbers, other sizes, another number of updates.

### 1. Refresh the catalogue

<!-- lab: nocheck -->
```bash
sudo apt update
```

```output
Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease
Hit:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease
Hit:3 http://archive.ubuntu.com/ubuntu noble-backports InRelease
Hit:4 http://security.ubuntu.com/ubuntu noble-security InRelease
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
62 packages can be upgraded. Run 'apt list --upgradable' to see them.
```

Each `Hit` line is one part of Ubuntu's repositories. `noble` is the code name of Ubuntu 24.04, and `noble-security` is where the security fixes arrive. `Hit` means "nothing new since last time". `Get` means apt downloaded a fresh part of the catalogue.

The last line is the interesting one. apt has compared the new catalogue with what is installed and found 62 packages with a newer version. Nothing has been installed yet. Step 6 deals with them.

### 2. Search for a program

<!-- lab: nocheck -->
```bash
apt search cowsay
```

```output
Sorting... Done
Full Text Search... Done
cowsay/noble 3.03+dfsg2-8 all
  configurable talking cow

cowsay-off/noble 3.03+dfsg2-8 all
  configurable talking cow (offensive cows)

presentty/noble 0.2.1-1.1 all
  Console-based presentation software

xcowsay/noble 1.6-1build2 amd64
  Graphical configurable talking cow
```

`cowsay` is a tiny joke program, perfect for practice: it is small, harmless, and you can see at once whether it works. `apt search` looks for the word in the names and in the descriptions, which is why `presentty` shows up too. Each result gives the name, the part of the repository, the version and a one-line description. No `sudo` is needed: you only read the catalogue.

### 3. Read about a package before you install it

<!-- lab: nocheck -->
```bash
apt show cowsay
```

```output
Package: cowsay
Version: 3.03+dfsg2-8
Priority: optional
Section: universe/games
Origin: Ubuntu
Maintainer: Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>
Original-Maintainer: James McDonald <james@jamesmcdonald.com>
Bugs: https://bugs.launchpad.net/ubuntu/+filebug
Installed-Size: 93.2 kB
Depends: libtext-charwidth-perl, perl:any
Suggests: filters, cowsay-off
Homepage: https://web.archive.org/web/20120527202447/http://www.nog.net/~tony/warez/cowsay.shtml
Download-Size: 18.6 kB
APT-Sources: http://archive.ubuntu.com/ubuntu noble/universe amd64 Packages
Description: configurable talking cow
 Cowsay (or cowthink) will turn text into happy ASCII cows, with
 speech (or thought) balloons. If you don't like cows, ASCII art is
 available to replace it with some other creatures (Tux, the BSD
 daemon, dragons, and a plethora of animals, from a turkey to
 an elephant in a snake).
```

This is the label of the package. Read three lines. `Installed-Size` says how much room it takes. `Depends` lists its dependencies: `cowsay` is written in a language called Perl, so it needs Perl. `Section: universe/games` says where it lives: `universe` is the part of the repository that the community looks after, and `main` is the part that Ubuntu supports itself.

### 4. Ask for a program you do not have

<!-- lab: nocheck -->
```bash
cowsay Hello
```

```output
Command 'cowsay' not found, but can be installed with:
sudo apt install cowsay
```

Ubuntu knows which package contains which command, and tells you. This is often the fastest way to find a package name: type the command you want and read the suggestion.

### 5. Install it

<!-- lab: nocheck -->
```bash
sudo apt install -y cowsay
```

```output
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
Suggested packages:
  filters cowsay-off
The following NEW packages will be installed:
  cowsay
0 upgraded, 1 newly installed, 0 to remove and 62 not upgraded.
Need to get 18.6 kB of archives.
After this operation, 93.2 kB of additional disk space will be used.
Get:1 http://archive.ubuntu.com/ubuntu noble/universe amd64 cowsay all 3.03+dfsg2-8 [18.6 kB]
Fetched 18.6 kB in 2s (9102 B/s)
Selecting previously unselected package cowsay.
(Reading database ... 75072 files and directories currently installed.)
Preparing to unpack .../cowsay_3.03+dfsg2-8_all.deb ...
Unpacking cowsay (3.03+dfsg2-8) ...
Setting up cowsay (3.03+dfsg2-8) ...
Processing triggers for man-db (2.12.0-4build2) ...
Scanning processes...
Scanning linux images...

Running kernel seems to be up-to-date.

No services need to be restarted.

No containers need to be restarted.

No user sessions are running outdated binaries.

No VM guests are running outdated hypervisor (qemu) binaries on this host.
```

It looks like a lot, but it tells a simple story. apt works out what is needed: only `cowsay` itself, because Perl is already on the system. It says how much it will download and how much room it will take. Then it downloads the package (`Get`), unpacks it, and sets it up. The lines after `Scanning processes` come from a helper that checks whether running programs need a restart. Your system may not show them.

`-y` answers "yes" in advance. When an install needs extra packages, apt lists them and asks `Do you want to continue? [Y/n]`. Without `-y`, you read the list and type `Y` yourself, which is the better habit when you install something new and large.

### 6. Use it and find it

```bash
cowsay Hello
```

```output
 _______
< Hello >
 -------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

```bash
which cowsay
```

```output
/usr/games/cowsay
```

`which` tells you where a command lives. Most programs land in `/usr/bin`. Games, even talking cows, go to `/usr/games`. You did not have to say where to look: lesson 1.8 explains how the shell found it.

### 7. Keep everything up to date

Step 1 announced 62 packages with a newer version. To see them, type `apt list --upgradable`. To install all of them:

<!-- lab: skip -->
```bash
sudo apt upgrade
```

apt lists what it is going to upgrade and asks before it starts. On a system that has not been updated for months, this can take a few minutes. Run `sudo apt update` and then `sudo apt upgrade` about once a week, and always before you install something new.

:::caution[Install from the catalogue, not from the web]
A website that tells you to download a file and install it, or to paste a long command that starts with `curl` and ends with `sudo bash`, asks you to trust that website with root. Sometimes it is a real project, often it is not. Look in the catalogue with `apt search` first.
:::

### 8. Remove it

<!-- lab: nocheck -->
```bash
sudo apt remove -y cowsay
```

```output
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following packages will be REMOVED:
  cowsay
0 upgraded, 0 newly installed, 1 to remove and 62 not upgraded.
After this operation, 93.2 kB disk space will be freed.
(Reading database ... 75132 files and directories currently installed.)
Removing cowsay (3.03+dfsg2-8) ...
Processing triggers for man-db (2.12.0-4build2) ...
```

```bash
which cowsay
```

This time `which` prints nothing: there is no `cowsay` left to find.

`remove` deletes the program but keeps its settings files, in case you install it again. `purge` deletes the settings files too. When you remove a package, its dependencies stay behind, and `sudo apt autoremove` cleans up the ones that nothing needs any more. Here Perl stays, and that is right: many other programs need it.

## Exercise

The project step of this module uses a program called `tree`, which draws a directory and everything inside it.

1. Type `tree` and read what Ubuntu suggests.
2. Install it.
3. Create a directory `shop` with two directories inside, `fruit` and `veg`. Put two empty files `apple.txt` and `pear.txt` in `fruit`, and one empty file `leek.txt` in `veg`.
4. Run `tree shop`.
5. Find out where the `tree` program was installed.

Keep `tree` installed when you are done.

<details>
<summary>Show the solution</summary>

<!-- lab: nocheck -->
```bash
tree
```

```output
Command 'tree' not found, but can be installed with:
sudo apt install tree
```

<!-- lab: nocheck -->
```bash
sudo apt install -y tree
```

The output looks like the one in step 5, with `tree` in place of `cowsay`.

```bash
mkdir -p shop/fruit shop/veg
touch shop/fruit/apple.txt shop/fruit/pear.txt shop/veg/leek.txt
tree shop
```

```output
shop
├── fruit
│   ├── apple.txt
│   └── pear.txt
└── veg
    └── leek.txt

3 directories, 3 files
```

```bash
which tree
```

```output
/usr/bin/tree
```

`tree` is not a game, so it lives in `/usr/bin` with most other programs.

</details>

## Check yourself

**1. What is the difference between `sudo apt update` and `sudo apt upgrade`?**

<details>
<summary>Answer</summary>

`update` refreshes the catalogue: the list of packages and versions that the repositories offer. It installs nothing. `upgrade` installs the newer versions that the fresh catalogue announced. You run them in that order.

</details>

**2. Why does `apt search` work without `sudo`, while `apt install` needs it?**

<details>
<summary>Answer</summary>

Searching only reads the catalogue. Installing writes files into system directories such as `/usr/bin`, and only root may change those.

</details>

**3. What is a dependency?**

<details>
<summary>Answer</summary>

Another package that a package needs in order to work. `cowsay` depends on Perl, for example. apt installs missing dependencies by itself.

</details>

**4. What is the difference between `apt remove` and `apt purge`?**

<details>
<summary>Answer</summary>

`remove` deletes the program but keeps its settings files. `purge` deletes the settings files as well.

</details>

**5. A forum post tells you to install a tool by downloading a file from a site you have never heard of. What do you try first, and why?**

<details>
<summary>Answer</summary>

`apt search` for the tool. Packages from Ubuntu's repositories are checked by your system against Ubuntu's signed catalogue. A file from an unknown site could contain anything, and it would run with your rights, or with root's if you use `sudo`.

</details>

## Common mistakes

- **Installing without `apt update` first.** apt then works from an old catalogue and may answer `Unable to locate package` or fail to download a version that no longer exists. Run `sudo apt update` and try again.
- **Forgetting `sudo`.** apt answers that it could not open a lock file and asks `are you root?`. Put `sudo` in front.
- **Guessing the package name.** The command and the package do not always share a name. Type the command and read Ubuntu's suggestion, or use `apt search`.
- **Running a command right after removing its package.** The shell may remember the old place and answer `No such file or directory`. Open a new terminal, or run `hash -r` to make the shell forget.
- **Never upgrading.** Every day without updates is a day with known holes open. Make `sudo apt update` and `sudo apt upgrade` a weekly habit.
- **Using `apt` inside scripts.** Its output may change between versions, and it says so: when its output does not go to the screen, it prints `WARNING: apt does not have a stable CLI interface`. In scripts, use the older `apt-get`, which takes the same commands (`apt-get install`, `apt-get remove`) and promises to stay stable.

## Key terms

- **Package**: a file that contains a program plus its name, version, description and dependencies, ready to install.
- **Dependency**: another package that a package needs in order to work.
- **Library**: a ready-made piece of code that many programs share, so that each one does not have to write it again.
- **Repository**: a server that stores packages and a catalogue of them. Ubuntu runs its own and signs their catalogues.
- **Package manager**: a program that finds, downloads, installs, updates and removes packages, and keeps track of what is installed.
- **apt**: the package manager of Ubuntu and Debian.

## Go further

- [Ubuntu Server documentation: package management](https://documentation.ubuntu.com/server/how-to/software/package-management/): the official guide to apt, with more commands and examples.
- [Ubuntu manual page: apt](https://manpages.ubuntu.com/manpages/noble/man8/apt.8.html): every command that `apt` understands, in one page.
- [Ubuntu Packages search](https://packages.ubuntu.com/): look up any package in the browser, with its version and dependencies for each Ubuntu release.
