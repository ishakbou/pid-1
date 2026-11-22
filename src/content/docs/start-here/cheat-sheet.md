---
title: "Cheat sheet: Setup checklist"
description: The three ways to practice, the setup steps, the first commands and the checklist of Module 0 on one printable page.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## What the course needs

| | Enough to start | Comfortable |
|---|---|---|
| RAM | 4 GB | 8 GB or more |
| Free disk space | 20 GB | 40 GB or more |
| System | Windows 10 (version 2004 or later) or 11, macOS, any Linux | The same, updated |
| Cost of the tools | Nothing | Nothing |

## Three ways to practice

| | Practice terminal | Codespaces | Your own computer |
|---|---|---|---|
| Where it runs | In the lesson page | On GitHub's machines | On your machine |
| To install | Nothing | Nothing | WSL on Windows |
| Account | None | GitHub, free | None |
| Which Linux | Tiny (BusyBox) | Full Ubuntu | Full Ubuntu |
| Internet, installing software | No | Yes | Yes |
| Your files | Erased at reload | Deleted after 30 unused days | Kept on your disk |
| Limit | Few commands | Free hours each month | None |

Choose your own computer if you can install programs on it. Choose Codespaces if you cannot. Use the practice terminal for a quick try.

Codespaces: on the course's GitHub page (the link is in [lesson 0.3](../start-here/three-ways-to-practice/)), click "Code", then "Codespaces", then "Create codespace on main". Find it again at `github.com/codespaces`. It stops after 30 minutes without activity.

## Setup on Windows

| Step | What to do |
|---|---|
| 1 | Windows key and R, `winver`: Windows 11, or Windows 10 version 2004 or later |
| 2 | Start menu, `powershell`, right-click, "Run as administrator" |
| 3 | `wsl --install`, then restart the computer |
| 4 | In the Ubuntu window: choose a username in small letters, then a password (nothing shows while you type) |
| 5 | Install VS Code on Windows from `code.visualstudio.com`, with "Add to PATH" ticked |
| 6 | In VS Code: extensions icon, search `WSL`, install the one by Microsoft |

On macOS: open Terminal, run `xcode-select --install`, then in VS Code use the Command Palette (Command, Shift, P) and "Shell Command: Install 'code' command in PATH".

## First commands

| Command | What it does |
|---|---|
| `echo "text"` | Prints the text |
| `whoami` | Prints your username |
| `uname` | Prints the name of the system (`Linux`) |
| `lsb_release -d` | Prints your version of Ubuntu |
| `sudo apt update` | Downloads the current catalogue of software |
| `sudo apt upgrade -y` | Installs the newer versions |
| `sudo apt install -y NAME` | Installs the tool called NAME |
| `code .` | Opens VS Code on the folder where you are |
| `bash FILE` | Runs the commands of a script file |
| `NAME --version` | Prints the version of a tool |
| `exit` | Closes the terminal |

Run `sudo apt update` and `sudo apt upgrade -y` about once a week.

## In VS Code

| You see or want | Meaning or action |
|---|---|
| A dot on the tab of a file | Not saved. Press Ctrl and S (Command and S on macOS) |
| "WSL: Ubuntu" in the bottom left corner | The editor works on the Linux side |
| A terminal under your file | Menu "Terminal", then "New Terminal" |
| Many files to manage | Open the folder, not single files |

## The checklist

| | Check | Ready when |
|---|---|---|
| 1 | The terminal opens | A line waits for your command |
| 2 | The terminal knows you | `whoami` prints your username |
| 3 | Updates work | `sudo apt update` ends without an error |
| 4 | The editor opens a folder | `code .` opens VS Code on the folder |
| 5 | Editor and terminal share files | The terminal runs a file saved in the editor |
| 6 | The tools are present | The check script prints `ok` for `nano`, `git`, `python3`, `curl`, `sqlite3` |
| 7 | The practice terminal starts | It answers `Linux` to `uname` |
| 8 | Your AI rules are clear | You can say the six rules without looking |

## Six rules for learning with AI

1. Try first: ten minutes alone.
2. Ask for a hint, not for the answer.
3. Explain it back in your own words.
4. Check by running. The terminal is the judge.
5. Keep nothing that you cannot explain.
6. Keep secrets out: no passwords, no keys, no private data.

## When something goes wrong

| Problem | First thing to do |
|---|---|
| `wsl --install` shows a help text | Run `wsl --install -d Ubuntu` |
| An error about virtualization | Switch it on in the firmware (Intel VT-x, AMD-V or SVM), or use Codespaces |
| Nothing appears when you type the password | Normal. Type it and press Enter |
| `code: command not found` | Close the terminal and open it again |
| `cat` shows the old content of a file | Save the file in the editor |
| The check script says `MISSING` | `sudo apt install -y` and the name of the tool |
| The practice terminal answers differently from the lesson | Normal for small differences: the lesson shows a full Ubuntu |
| Your progress marks are gone | They live in one browser on one device |
