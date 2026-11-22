---
title: "Module 2: Git & GitHub"
description: Track your work with commits and branches, undo mistakes safely, and publish your projects on GitHub.
module: 2
sidebar:
  order: 0
  label: Overview
---

Every project you build from now on will change hundreds of times, and some of those changes will be mistakes. This module gives you git, the tool that remembers every version of your work, tells you exactly what changed, and lets you go back. Then you put your work online with GitHub, propose changes with pull requests, publish a web page, and give `mylab` a public home.

## What you will learn

- What version control is, and what a repository and a commit are.
- How to save versions with `git add` and `git commit`, and read them with `status`, `diff` and `log`.
- How to work on a branch, merge it, and solve a merge conflict.
- Which undo command fits which mistake: `restore`, `reset` or `revert`.
- How to connect a repository to GitHub, and push, pull and clone.
- How a pull request works, and how `.gitignore` keeps secrets and junk out.
- How to publish a static web page for free with GitHub Pages.

## Before you start

You need the terminal skills of [Module 1](../linux/): moving around folders, creating and editing files with nano, `ls -a` and hidden files, and redirection with `>` and `>>`. The project step continues the `mylab` folder from the [Module 1 project step](../linux/project/).

Lessons 2.1 to 2.4 work offline on your own computer. From lesson 2.5 on you need an internet connection and a free GitHub account, which lesson 2.5 helps you create.

## Time

8 lessons, about 2 hours and 50 minutes of reading and practice.

## Module map

```mindmap
Git & GitHub
  Saving versions
    repository
    add and commit
    status, diff, log
  Branches
    switch and merge
    merge conflicts
  Undoing mistakes
    restore
    reset
    revert
  Sharing
    remotes
    push and pull
    pull requests
  Publishing
    .gitignore
    GitHub Pages
    mylab on GitHub
```

## Lessons

1. 2.1 [What version control is](../git/what-version-control-is/): why "report_final_v2_really_final" fails, and what commits and repositories are.
2. 2.2 [Your first commits](../git/your-first-commits/): git init, status, add, commit, log and diff on a real folder.
3. 2.3 [Branches and merging](../git/branches-and-merging/): work on a branch, merge it, and solve a merge conflict.
4. 2.4 [Fixing mistakes (restore, revert, reset)](../git/fixing-mistakes/): undo changes safely at each stage, and know which command fits which mistake.
5. 2.5 [Remotes, push and pull](../git/remotes-push-and-pull/): connect your computer to GitHub, then push, pull and clone.
6. 2.6 [Pull requests and .gitignore](../git/pull-requests-and-gitignore/): propose a change with a pull request, and keep secrets and junk out of the repository.
7. 2.7 [Publishing a site with GitHub Pages](../git/publishing-a-site-with-github-pages/): put a simple page online for free, straight from a repository.
8. 2.8 [Project step: mylab on GitHub](../git/project/): put mylab under git, write a first README, and publish the repository.

## Project step

The project step turns `~/mylab` into a git repository. You write a `.gitignore` before the first commit, so that the reports in `logs/` and any future secrets never enter the history, and a first `README.md` in Markdown that says what the project is. Then you push `mylab` to GitHub and check what a fresh clone contains. From [Module 3](../python/) on, every module ends with a commit to this repository.

## Cheat sheet

The commands of this module on one page: [Cheat sheet: Git](../git/cheat-sheet/).
