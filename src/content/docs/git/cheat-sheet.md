---
title: "Cheat sheet: Git"
description: The git commands, status letters and GitHub steps of Module 2 on one printable page.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## Set up once

| Command | What it does |
|---|---|
| `git config --global user.name "NAME"` | Sets the name written into your commits |
| `git config --global user.email "EMAIL"` | Sets the email written into your commits (GitHub can give you a private one) |
| `git config --global init.defaultBranch main` | Names the first branch of new repositories `main` |
| `git config --global core.editor nano` | Makes git open nano when it needs a message |
| `git config --global pull.rebase false` | Makes `git pull` merge when both sides have new commits |
| `git config --global --list`, `git config NAME` | Shows all settings, one setting. They live in `~/.gitconfig` |

## Save versions

| Command | What it does |
|---|---|
| `git init` | Makes the current folder a repository (adds `.git`) |
| `git status`, `git status --short` | Shows what changed and what is staged |
| `git add FILE`, `git add FOLDER` | Stages changes for the next commit |
| `git commit -m "Message"` | Saves the staged changes as a commit |
| `git commit -am "Message"` | Stages changes to tracked files, then commits. New files still need `git add` |
| `git diff`, `git diff --staged` | Shows unstaged changes, staged changes |
| `git log`, `git log --oneline`, `git log -n 3` | Shows the history: full, one line per commit, the last 3 |
| `git log --oneline --graph --all` | Draws every branch as a graph |
| `git ls-files` | Lists the files git tracks |

## Status letters (`--short`)

| Letters | Meaning |
|---|---|
| `??` | Untracked: git has never saved this file |
| ` M` | Modified, not staged (letter in the right column) |
| `M ` | Modified and staged (letter in the left column) |
| `A ` | New file, staged |
| `D ` | Deletion, staged |

## Branches

| Command | What it does |
|---|---|
| `git branch` | Lists branches; `*` marks the one you are on |
| `git switch -c NAME` | Creates a branch and switches to it |
| `git switch NAME` | Switches to a branch |
| `git merge NAME` | Merges NAME into the branch you are on |
| `git merge --no-edit NAME` | Merges and keeps git's proposed message |
| `git merge --abort` | Cancels a merge that stopped on a conflict |
| `git branch -d NAME` | Deletes a merged branch (the commits stay) |

A conflict looks like this in the file. Keep what is right, delete the three marker lines, then `git add FILE` and `git commit`.

```text
<<<<<<< HEAD
your version (the branch you are on)
=======
their version (the branch you are merging)
>>>>>>> NAME
```

## Undo

| Mistake | Command | Lost |
|---|---|---|
| Bad edit, not staged | `git restore FILE` | Your edits, for good |
| Wrong file staged | `git restore --staged FILE` | Nothing |
| Last commit wrong, not shared | `git commit --amend -m "Message"`, `--amend --no-edit` | Nothing |
| Last commit unwanted, not shared | `git reset HEAD~1` (`--soft` keeps it staged) | Nothing |
| Same, and drop the changes | `git reset --hard HEAD~1` | Uncommitted changes, for good |
| Commit already shared | `git revert HASH`, `git revert --no-edit HEAD` | Nothing: a new commit undoes it |
| Lost track of a commit | `git reflog` | Nothing: lists where HEAD has been |

`HEAD` is where you are; `HEAD~1` is one commit before it.

## Remotes

| Command | What it does |
|---|---|
| `git remote add origin ADDRESS` | Connects the repository to a remote called `origin` |
| `git remote -v` | Lists remotes and their addresses |
| `git remote set-url origin ADDRESS` | Changes the address of a remote |
| `git push -u origin main` | First push of a branch; remembers its upstream |
| `git push`, `git pull` | Sends your commits, gets and merges new ones |
| `git fetch`, `git fetch --prune` | Downloads new commits only; also forgets deleted remote branches |
| `git branch -r` | Lists remote-tracking branches such as `origin/main` |
| `git clone ADDRESS FOLDER` | Copies a repository with its history; sets up `origin` |
| `git init --bare NAME.git` | Makes a repository without a working tree, as servers keep |

Push refused with `(fetch first)`: run `git pull`, solve any conflict, then `git push`.

## GitHub

| Task | How |
|---|---|
| Make an SSH key | `ssh-keygen -t ed25519 -C "EMAIL"`, with a passphrase |
| Give GitHub the key | Settings, SSH and GPG keys, New SSH key: paste `~/.ssh/id_ed25519.pub` only |
| SSH address of a repository | `git@github.com:USER/REPO.git` |
| Pull request | Branch, commit, push the branch, open the PR (base `main`), push fixes, merge, then `git switch main` and `git pull` |
| GitHub Pages | Settings, Pages, Deploy from a branch, `main`, `/ (root)`, Save |
| Pages addresses | `USER/REPO` is at `https://USER.github.io/REPO/`; `USER/USER.github.io` is at `https://USER.github.io/` |

## .gitignore

| Line | Ignores |
|---|---|
| `.env` | The file `.env`, where secrets live |
| `*.tmp` | Every name that ends in `.tmp` |
| `logs/` | The whole folder `logs` |
| `# text` | Nothing: a comment |

| Command | What it does |
|---|---|
| `git check-ignore -v FILE` | Shows which line ignores FILE |
| `git rm --cached FILE`, `-r FOLDER` | Stops tracking, keeps your copy. Old commits still hold it |

A secret that was pushed is stolen: change it first, then clean up.
