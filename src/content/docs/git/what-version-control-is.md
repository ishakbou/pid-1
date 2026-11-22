---
title: What version control is
description: See why folders full of "final" copies fail, learn what a repository and a commit are, and get git ready on your computer.
lesson: "2.1"
time: 15 min
sidebar:
  order: 1
---

<!-- lab: run
rm -f ~/.gitconfig
-->

You have probably seen a folder like this one: `budget.txt`, `budget_final.txt`, `budget_final_v2.txt` and `budget_final_v2_really_final.txt`. Which one is the real one? What changed between the last two, who changed it, and why? The file names cannot tell you. This lesson shows the tool that can, and gets it ready on your computer.

## Goal

After this lesson you can:

- Explain why a folder of copies is a poor way to keep versions.
- Say what a repository, a commit and a history are.
- Check that git is installed and tell it who you are.

## Why it matters

Almost every software team keeps its code in **version control**, and most of them use git. When a change breaks something, version control tells you what changed, when, and who did it, and it lets you go back to the version that worked. Security teams read the same history when they investigate: which commit added the bug, and which commit fixed it. From the next lesson on, every module of this course saves its work in git.

## The idea

A **version control system** is a program that records the versions of a set of files over time. Each time you save a version, it also records who saved it, when, and a short message that says why. **Git** is the version control system this course uses. It is free, it runs on your own computer, and it works without internet.

Git works on a **repository**, often called a repo: a project folder whose history git keeps. You choose which folder becomes a repository. Git stores the history in a hidden folder called `.git` inside it, so the project and its whole past travel together.

A **commit** is one saved version of the project. Think of a photo album with a caption under each photo. A commit is a photo of all the files git tracks, taken at one moment, with a caption: your message, your name and the date. Taking a new photo never changes the old ones, and you can always go back and look at any of them.

Each commit also gets a **commit hash**, a long id made of numbers and the letters `a` to `f`, such as `c93e0a8...`. Git computes it from the content of the commit, so in practice two different commits never get the same hash. Each commit remembers the commit that came just before it, its parent. Chained together, the commits form the **history** of the project.

<figure class="diagram">
<svg viewBox="0 0 580 170" role="img" aria-labelledby="hist-title hist-desc">
<title id="hist-title">A history of three commits</title>
<desc id="hist-desc">Three boxes stand in a row from left to right, joined by lines. The first box is commit a1f3c09 with the message Start the budget. The second is commit 7d2e4b1 with the message Add the hall rent. The third, highlighted, is commit c93e0a8 with the message Fix the total. Under the row, the word older is on the left and newer on the right.</desc>
<path class="d-line" d="M175 70 H215 M385 70 H425"/>
<rect class="d-box" x="15" y="35" width="160" height="70"/>
<rect class="d-box" x="215" y="35" width="170" height="70"/>
<rect class="d-box d-hot" x="425" y="35" width="140" height="70"/>
<text x="95" y="63">a1f3c09</text>
<text x="95" y="88">Start the budget</text>
<text x="300" y="63">7d2e4b1</text>
<text x="300" y="88">Add the hall rent</text>
<text x="495" y="63">c93e0a8</text>
<text x="495" y="88">Fix the total</text>
<text x="95" y="145">older</text>
<text x="495" y="145">newer</text>
</svg>
<figcaption>Each box is a commit: a short hash and a message. Each commit points back to the one before it.</figcaption>
</figure>

Here is what changes when the budget lives in a repository instead of a folder of copies:

| Question | Folder of copies | Git repository |
|---|---|---|
| Which version is the newest? | Guess from the names | The last commit |
| What changed? | Compare the files by eye | Git shows the exact lines |
| Who changed it, and why? | Nobody knows | Every commit has an author and a message |
| How do I get last week's version back? | Hope someone kept a copy | Every commit can be brought back |

One more word you will hear all the time: **GitHub**. GitHub is a website that keeps copies of git repositories online, so that you can share them and work on them with other people. Git is the program on your computer; GitHub is one place to send your repositories. Lesson 2.5 connects the two.

## Try it

The outputs below come from a user called `sam`. Wherever you see `sam` or `Sam`, your screen shows your own name.

### 1. Feel the problem

Make the folder of copies from the opening:

```bash
mkdir ~/versions
cd ~/versions
printf 'Club budget\nTotal: 400 euros\n' > budget.txt
printf 'Club budget\nTotal: 450 euros\n' > budget_final.txt
printf 'Club budget\nTotal: 450 euros\n' > budget_final_v2.txt
printf 'Club budget\nTotal: 445 euros\n' > budget_final_v2_really_final.txt
ls
```

```output
budget.txt        budget_final_v2.txt
budget_final.txt  budget_final_v2_really_final.txt
```

`printf` prints text, and every `\n` in it starts a new line. With `>` from lesson 1.7, each line writes one small file. Four files, and the only clue about their order is a pile of words in their names.

### 2. Compare two of them

```bash
diff budget_final_v2.txt budget_final_v2_really_final.txt
```

```output
2c2
< Total: 450 euros
---
> Total: 445 euros
```

`diff` compares two files line by line. `2c2` means "line 2 was changed into line 2". The line after `<` comes from the first file, the line after `>` from the second. So someone took 5 euros off the total. Who, and why? The files cannot say. That missing "who and why" is the gap that a commit fills.

### 3. Check that git is installed

```bash
git --version
```

```output
git version 2.43.0
```

Ubuntu usually comes with git. If you see `command not found` instead, install it with `sudo apt install git`, as in lesson 1.6. Your version number may be newer; everything in this module works with any recent version.

### 4. Tell git who you are

Git writes a name and an email into every commit you make, so it needs both before your first commit. Use your own:

```bash
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
```

Like most commands that just work, these print nothing. `--global` means "for every repository of this user on this computer", so you do this once, not once per project.

:::caution[Your email goes public]
Every commit you publish on GitHub shows this email to anyone who looks. If you would rather keep your address private, GitHub gives you a private "noreply" address in its email settings. Set that one here instead, once you have an account in lesson 2.5.
:::

### 5. Two more settings

```bash
git config --global init.defaultBranch main
git config --global core.editor nano
```

The first setting names the first branch of every new repository `main`. A **branch** is a line of commits with a name, and lesson 2.3 is all about branches. Without this setting, git calls the first branch `master` and prints a long hint about it. GitHub and most new projects use `main`, so you choose it once here.

The second setting chooses the editor git opens when it needs you to type a longer text. Without it, git may open vim, an editor that is famously hard to quit. You already know nano from lesson 1.3.

### 6. Read your settings back

```bash
git config --global --list
```

```output
user.name=Sam
user.email=sam@example.com
init.defaultbranch=main
core.editor=nano
```

Git lists every global setting as `name=value`. It shows `defaultbranch` in small letters because setting names do not care about capitals. These settings live in a plain text file, a hidden file in your home directory:

```bash
cat ~/.gitconfig
```

```output
[user]
	name = Sam
	email = sam@example.com
[init]
	defaultBranch = main
[core]
	editor = nano
```

Nothing magic: `git config` wrote this file for you. You could edit it with nano, but `git config` is safer, because it cannot get the format wrong.

## Exercise

Stay in `~/versions`.

1. Someone made one more copy, `budget_final_v3.txt`, with the total `445 euros` and a third line `Paid: no`. Create it with one `printf` command.
2. Use `diff` to show how it differs from `budget_final_v2_really_final.txt`.
3. Print only your email setting, with a `git config` command that shows one value.

<details>
<summary>Show the solution</summary>

```bash
printf 'Club budget\nTotal: 445 euros\nPaid: no\n' > budget_final_v3.txt
diff budget_final_v2_really_final.txt budget_final_v3.txt
```

```output
2a3
> Paid: no
```

`2a3` means "after line 2 of the first file, add line 3 of the second file". `diff` reads `a` for added, `c` for changed and `d` for deleted.

```bash
git config user.email
```

```output
sam@example.com
```

Give `git config` a setting name and no value, and it prints the value. Without `--global` it also looks at the global settings, so the answer is the same here.

</details>

## Check yourself

**1. What is the difference between git and GitHub?**

<details>
<summary>Answer</summary>

Git is a program on your computer that keeps the history of a project. GitHub is a website that stores copies of git repositories online, so that you can share them and work with others.

</details>

**2. What does a commit contain?**

<details>
<summary>Answer</summary>

A snapshot of all the files git tracks at one moment, plus a message, the author's name and email, the date, a link to the commit before it, and a hash that identifies it.

</details>

**3. Where does git keep the history of a repository?**

<details>
<summary>Answer</summary>

In a hidden folder called `.git`, inside the project folder itself.

</details>

**4. Why does git ask for your name and email before your first commit?**

<details>
<summary>Answer</summary>

Because it writes them into every commit, to record who made it.

</details>

**5. You ran `git config --global core.editor nano`. In which file is that setting saved?**

<details>
<summary>Answer</summary>

In `~/.gitconfig`, a hidden text file in your home directory.

</details>

## Common mistakes

- **Forgetting `--global`.** Outside a repository, `git config user.name "Sam"` stops with `fatal: not in a git directory`. Add `--global` to set it for all your projects.
- **Leaving out the quotes.** `git config --global user.name Sam Lee` does not save `Sam Lee`. The shell splits on the space, so git takes only `Sam` as the name and reads `Lee` as an extra argument with another meaning. Write `"Sam Lee"`.
- **A typo in the setting name.** Git does not check names: `git config --global user.emial sam@example.com` happily saves a setting nobody reads. Run `git config --global --list` and look for odd lines. Remove one with `git config --global --unset user.emial`.
- **Thinking git needs GitHub.** Git works alone, offline, on your own computer. GitHub is optional and comes later.

## Key terms

- **Version control**: recording the versions of a set of files over time, with who changed what, when and why.
- **Version control system**: a program that does version control. Git is one.
- **Git**: the free version control system used in this course. It runs on your own computer.
- **Repository**: a project folder whose history git keeps, in a hidden `.git` folder inside it. Often called a repo.
- **Commit**: one saved version of a repository, with a message, an author, a date and a hash.
- **Commit hash**: the long id git computes for a commit from its content, such as `c93e0a8`.
- **History**: the chain of commits of a repository, each one pointing back to the one before it.
- **GitHub**: a website that stores git repositories online for sharing and teamwork.
- **Branch**: a named line of commits in a repository. The first one is usually called `main`.

## Go further

- [Pro Git: About Version Control](https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control): the first chapter of the free official git book, with the history of version control.
- [Pro Git: First-Time Git Setup](https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup): the same settings as step 4 and 5, with a few more.
- [git-config documentation](https://git-scm.com/docs/git-config): every setting `git config` knows. A reference, not something to read in one go.
