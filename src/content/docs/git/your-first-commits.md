---
title: Your first commits
description: Turn a folder into a git repository, then stage, commit, compare and read the history of your files with init, status, add, commit, diff and log.
lesson: "2.2"
time: 20 min
sidebar:
  order: 2
---

<!-- lab: run
rm -f ~/.gitconfig
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
git config --global core.editor nano
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=log.decorate GIT_CONFIG_VALUE_0=short
export GIT_AUTHOR_DATE="2026-11-21T10:00:00+0000" GIT_COMMITTER_DATE="2026-11-21T10:00:00+0000"
-->

Last lesson ended with a folder of copies that nobody trusts. Today you build the opposite: one folder, one name per file, and a history that remembers every version on its own. It takes six git commands. You run the first one once per project, and the other five every working day for as long as you write code.

## Goal

After this lesson you can:

- Turn a folder into a git repository.
- Choose changes with `git add` and save them with `git commit`.
- See what changed with `git status` and `git diff`, and read the history with `git log`.

## Why it matters

Commits are only useful if you make them often and make them well. A commit with a clear message, made after each small step, lets you find the exact moment something broke. A huge commit called "stuff" made once a week tells you almost nothing. The habits you start today are the ones colleagues will see in your projects later.

## The idea

Git does not save your files every time you press save in the editor. You decide what goes into each commit, and you do it in two moves: first you **stage** a change with `git add`, then you save everything staged as one commit with `git commit`.

So a change passes through three places:

<figure class="diagram">
<svg viewBox="0 0 600 150" role="img" aria-labelledby="areas-title areas-desc">
<title id="areas-title">The three places a change passes through</title>
<desc id="areas-desc">Three boxes in a row. The first is the working tree, your files. The second is the staging area, the next commit. The third, highlighted, is the history, the saved commits. A line labelled git add joins the first box to the second, and a line labelled git commit joins the second to the third.</desc>
<path class="d-line" d="M170 75 H225 M375 75 H430"/>
<rect class="d-box" x="10" y="40" width="160" height="70"/>
<rect class="d-box" x="225" y="40" width="150" height="70"/>
<rect class="d-box d-hot" x="430" y="40" width="160" height="70"/>
<text x="90" y="68">Working tree</text>
<text x="90" y="92">your files</text>
<text x="300" y="68">Staging area</text>
<text x="300" y="92">the next commit</text>
<text x="510" y="68">History</text>
<text x="510" y="92">saved commits</text>
<text x="197" y="30">git add</text>
<text x="402" y="30">git commit</text>
</svg>
<figcaption>You edit files in the working tree, choose changes into the staging area, and commit them into the history.</figcaption>
</figure>

- The **working tree** is the files of the project as you see them in the folder, the ones you edit.
- The **staging area** holds the changes you have chosen for the next commit. Git's own documents also call it the **index**.
- The history holds the commits, inside the hidden `.git` folder.

Think of packing a parcel. Your desk is the working tree, covered with things. The open box is the staging area: you put in exactly the items you want to send, and you can add more until you are ready. `git commit` closes the box and sticks a label on it. Whatever stayed on the desk is not in that parcel.

Why two steps? Because one sitting often produces two unrelated changes, say a fixed typo and a new paragraph. With the staging area you can commit them separately, each with its own message, and the history stays easy to read.

Git also sorts files into two groups. An **untracked file** is one git has never been asked to save; it ignores it until you `git add` it. A **tracked file** is one git already knows, because it is in the last commit or you staged it with `git add`. Git watches it for changes.

## Try it

Your outputs show your own name and email, and different commit hashes, because a hash depends on the author and the time.

### 1. Create a repository

```bash
mkdir ~/recipes
cd ~/recipes
git init
```

```output
Initialized empty Git repository in /home/sam/recipes/.git/
```

`git init` turns the folder you are in into a repository. Nothing else changes; git only adds its hidden folder:

```bash
ls -a
```

```output
.  ..  .git
```

Everything git knows about this project lives in `.git`. Delete that folder and the history is gone, while your files stay. So leave it alone.

### 2. Ask git what it sees

```bash
git status
```

```output
On branch main

No commits yet

nothing to commit (create/copy files and use "git add" to track)
```

`git status` is the command you will run most. It says which branch you are on, `main` from the setting in lesson 2.1, and what has changed. For now, nothing.

### 3. Write a first file

Create `pancakes.txt` in `~/recipes` with nano, and give it this content:

```text title="pancakes.txt"
Pancakes

200 g flour
2 eggs
300 ml milk
1 spoon of sugar
```

```bash
git status
```

```output
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	pancakes.txt

nothing added to commit but untracked files present (use "git add" to track)
```

Git noticed the file but files it under "Untracked": it will not save it until you say so. Read the hints in brackets, too. `git status` often tells you the next command to type.

### 4. Stage the file

```bash
git add pancakes.txt
git status
```

```output
On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
	new file:   pancakes.txt

```

The file moved to "Changes to be committed": it is in the staging area, inside the open box.

### 5. Make the first commit

```bash
git commit -m "Add pancake recipe"
```

```output
[main (root-commit) 77b3263] Add pancake recipe
 1 file changed, 6 insertions(+)
 create mode 100644 pancakes.txt
```

`-m` gives the **commit message** right on the command line. The first line of the output shows the branch, `root-commit` because this first commit has no parent, the start of the commit hash and the message. Then a summary: one file, six new lines.

```bash
git status
```

```output
On branch main
nothing to commit, working tree clean
```

"Working tree clean" means your files are exactly as in the last commit. That is a good moment to stop working, or to start something new.

### 6. Change the file and see the difference

Open `pancakes.txt` again: make it two spoons of sugar, and add a pinch of salt at the end.

```text title="pancakes.txt"
Pancakes

200 g flour
2 eggs
300 ml milk
2 spoons of sugar
1 pinch of salt
```

```bash
git status --short
```

```output
 M pancakes.txt
```

`--short` prints one line per file, with two columns of letters. The left column is the staging area and the right column the working tree. Here the `M` is on the right: the file is modified, not staged yet. An untracked file would show `??`.

```bash
git diff
```

```output
diff --git a/pancakes.txt b/pancakes.txt
index 9010052..e40d216 100644
--- a/pancakes.txt
+++ b/pancakes.txt
@@ -3,4 +3,5 @@ Pancakes
 200 g flour
 2 eggs
 300 ml milk
-1 spoon of sugar
+2 spoons of sugar
+1 pinch of salt
```

`git diff` shows what you changed and not staged yet. A line that starts with `-` was removed, a line with `+` was added, and changing a line shows as both. The lines with a space in front are context, so you can see where the change sits. The `@@` line says where that is: from line 3 of the old version, and from line 3 of the new one.

### 7. Stage and commit the change

```bash
git add pancakes.txt
git status --short
git diff
```

```output
M  pancakes.txt
```

The `M` moved to the left column: the change is staged. And `git diff` printed nothing, because it only shows changes that are not staged. To see what you are about to commit, add `--staged`:

```bash
git diff --staged
```

```output
diff --git a/pancakes.txt b/pancakes.txt
index 9010052..e40d216 100644
--- a/pancakes.txt
+++ b/pancakes.txt
@@ -3,4 +3,5 @@ Pancakes
 200 g flour
 2 eggs
 300 ml milk
-1 spoon of sugar
+2 spoons of sugar
+1 pinch of salt
```

<!-- lab: run
export GIT_AUTHOR_DATE="2026-11-21T10:07:00+0000" GIT_COMMITTER_DATE="2026-11-21T10:07:00+0000"
-->

```bash
git commit -m "Use more sugar and add salt"
```

```output
[main 78a0864] Use more sugar and add salt
 1 file changed, 2 insertions(+), 1 deletion(-)
```

Two lines added and one removed, exactly what the diff showed.

:::tip[Write messages that finish a sentence]
A good commit message completes the sentence "If you apply this commit, it will ...": "Add pancake recipe", "Fix the total". Keep it short, around 50 characters, and say what changed, not how you felt. "Update", "stuff" and "asdf" will mean nothing to you in a month.
:::

### 8. Read the history

```bash
git log
```

```output
commit 78a086488e939e7cbba9ddfb6d5ffb70ba836669 (HEAD -> main)
Author: Sam <sam@example.com>
Date:   Sat Nov 21 10:07:00 2026 +0000

    Use more sugar and add salt

commit 77b32630af2b508736b8ed0f729fab2427f70de4
Author: Sam <sam@example.com>
Date:   Sat Nov 21 10:00:00 2026 +0000

    Add pancake recipe
```

`git log` lists the commits, newest first: the full hash, the author, the date and the message. `(HEAD -> main)` marks the commit you are on, the newest one of branch `main`; lesson 2.3 explains it. When the history is longer than your screen, git shows it page by page, as `less` does in lesson 1.3: press Space to go on and `q` to quit.

The hash is 40 characters long, but the first seven are almost always enough to name a commit. That is the short form you will see everywhere:

```bash
git log --oneline
```

```output
78a0864 (HEAD -> main) Use more sugar and add salt
77b3263 Add pancake recipe
```

One line per commit. Compare that with the folder of copies from lesson 2.1: one file, two versions, and for each one who, when and why.

## Exercise

Stay in `~/recipes`.

1. Create `tea.txt` with three lines: `Mint tea`, an empty line, and `1 spoon of green tea and fresh mint`.
2. Check what git sees, in the short form.
3. Stage the file and commit it with a good message.
4. Show the history, one line per commit.

<details>
<summary>Show the solution</summary>

```text title="tea.txt"
Mint tea

1 spoon of green tea and fresh mint
```

```bash
git status --short
```

```output
?? tea.txt
```

`??` means untracked: git has never saved this file.

<!-- lab: run
export GIT_AUTHOR_DATE="2026-11-21T10:12:00+0000" GIT_COMMITTER_DATE="2026-11-21T10:12:00+0000"
-->

```bash
git add tea.txt
git commit -m "Add mint tea recipe"
git log --oneline
```

```output
[main 8c2e156] Add mint tea recipe
 1 file changed, 3 insertions(+)
 create mode 100644 tea.txt
8c2e156 (HEAD -> main) Add mint tea recipe
78a0864 Use more sugar and add salt
77b3263 Add pancake recipe
```

Three commits, newest first. Your hashes are different, and your message may be too: "Add tea recipe" is just as good.

</details>

## Check yourself

**1. What does `git add pancakes.txt` do?**

<details>
<summary>Answer</summary>

It stages the file: it puts its current content into the staging area, so that the next `git commit` saves it. It does not make a commit by itself.

</details>

**2. You changed a file and ran `git commit -m "Fix typo"` without `git add`. What happens?**

<details>
<summary>Answer</summary>

Nothing is committed. Git answers `no changes added to commit`, because the staging area is empty. Stage the file with `git add`, then commit again.

</details>

**3. You know you changed a file, but `git diff` prints nothing. Why might that be?**

<details>
<summary>Answer</summary>

The change is already staged. Plain `git diff` shows only changes that are not staged. `git diff --staged` shows the staged ones.

</details>

**4. In `git status --short`, what do `??`, ` M` and `M ` mean?**

<details>
<summary>Answer</summary>

`??` is an untracked file. ` M`, with the `M` in the right column, is a modified file that is not staged. `M `, with the `M` in the left column, is a modified file whose change is staged.

</details>

**5. Why is `Update file` a poor commit message?**

<details>
<summary>Answer</summary>

It says nothing about what changed or why, so it does not help anyone, you included, who reads the history later. Something like `Use more sugar and add salt` does.

</details>

## Common mistakes

- **Running `git init` in the wrong folder.** Run it in your home directory, and your whole home becomes one repository. Always `pwd` first. If it happened, remove only the hidden folder it made, with `rm -rf .git` in that directory, and check with `ls -a` first that you are in the right place.
- **Committing without staging.** `git commit` answers `no changes added to commit`. Run `git add` first, then commit.
- **Forgetting `-m`.** Git opens your editor, nano after lesson 2.1, for the message. Type it on the first line, save with Ctrl+O and Enter, and leave with Ctrl+X. If you leave the message empty, git stops and commits nothing.
- **One giant commit at the end of the day.** Commit after each small step that works. Small commits are easier to read, to review and to undo.
- **Using `git add .` without looking.** The dot stages every change in the folder, including files you did not mean to save. Run `git status` before and after.

## Key terms

- **Working tree**: the files of a repository as you see them in the folder, the ones you edit.
- **Staging area**: the place where changes wait for the next commit. Also called the index.
- **Stage**: to choose a change for the next commit, with `git add`.
- **Untracked file**: a file in the folder that git has never saved. `git status --short` marks it `??`.
- **Tracked file**: a file that is in the last commit or staged, so git watches it for changes.
- **Commit message**: the short text saved with a commit that says what it changes.
- **Diff**: a list of the lines that differ between two versions, with `-` for removed and `+` for added lines.

## Go further

- [Pro Git: Recording Changes to the Repository](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository): the same cycle of status, add and commit, with more detail.
- [Pro Git: Viewing the Commit History](https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History): the many options of `git log`.
- [git-status documentation](https://git-scm.com/docs/git-status): every letter the short format can show.
