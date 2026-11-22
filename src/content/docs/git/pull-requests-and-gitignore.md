---
title: Pull requests and .gitignore
description: Propose a change with a pull request on GitHub, and keep secrets, temporary files and other junk out of your repository with .gitignore.
lesson: "2.6"
time: 25 min
sidebar:
  order: 6
---

<!-- lab: run
rm -f ~/.gitconfig
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
git config --global core.editor nano
git config --global pull.rebase false
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=log.decorate GIT_CONFIG_VALUE_0=short
export GIT_AUTHOR_DATE="2026-11-21T14:00:00+0000" GIT_COMMITTER_DATE="2026-11-21T14:00:00+0000"
mkdir ~/recipes && cd ~/recipes && git init -q
printf 'Pancakes\n\n200 g flour\n2 eggs\n300 ml milk\n1 spoon of sugar\n1 pinch of salt\n50 g dark chocolate\n' > pancakes.txt
printf 'Mint tea\n\n1 spoon of green tea and fresh mint\n1 spoon of honey\nServe hot\n' > tea.txt
printf 'Waffles\n\n250 g flour\n2 eggs\nServe with jam\n' > waffles.txt
git add . && git commit -q -m "Add pancake, tea and waffle recipes"
git init -q --bare ~/server/recipes.git
git remote add origin ~/server/recipes.git
git push -q -u origin main
cd ~
-->

Two things decide whether people trust a repository: how changes get into it, and what never gets into it. On GitHub, changes usually arrive as pull requests, where someone can read them before they land on `main`. And some files must never arrive at all: passwords, keys, and the junk that programs leave behind. This lesson covers both.

## Goal

After this lesson you can:

- Propose a change with a pull request, and bring the merged result back to your computer.
- Keep secrets and junk out of a repository with a `.gitignore` file.
- Stop tracking a file that was committed by mistake.

## Why it matters

On almost every team, nobody pushes straight to `main`. Changes go through a pull request, and at least one other person reads them first, which catches bugs early. The second half matters even more for security: automated tools scan public repositories for leaked keys all day, and a password pushed to GitHub can be found and abused within minutes. A good `.gitignore` is the cheapest protection there is.

## The idea

A **pull request**, or PR, is a request on GitHub to merge one branch into another, usually a feature branch into `main`. It is a web page with three parts: a description of the change, the list of commits, and the full diff. People can comment on any line, and the author answers by pushing more commits to the same branch, which updates the PR. When everyone is happy, someone clicks Merge, and GitHub makes the merge commit.

Reading someone's change and commenting on it is called **code review**. Think of a shared document with suggested edits: you propose changes, the others comment in the margin, and nothing changes in the final text until the owner accepts them.

The whole flow uses only what you already know:

1. Create a branch, commit on it, and push it, as in lessons 2.3 and 2.5.
2. Open the pull request on GitHub, from your branch into `main`.
3. Discuss, and push fixes to the same branch.
4. Merge on GitHub.
5. Switch to `main`, pull, and delete the branch.

To propose a change to a repository you cannot push to, such as someone else's project, you first make a **fork**: your own copy of their repository on GitHub. You push your branch to the fork and open the pull request from there.

The second idea is an ignore list. A **`.gitignore`** file is a text file in the repository that lists names and patterns git should not track. An **ignored file** never shows up in `git status`, and `git add .` skips it. `*.tmp` means "every name that ends in `.tmp`", and a name that ends in `/`, such as `cache/`, means a whole folder. A `#` starts a comment.

The list only works for files that are not tracked yet. Once a file is in a commit, git keeps tracking it, and keeps it in every old commit too.

## Try it

This lesson continues `~/recipes` and the stand-in server `~/server/recipes.git` from lesson 2.5. On GitHub, the git commands are exactly the same; only the web steps are new. Your hashes are different.

### 1. Push a branch for the change

```bash
cd ~/recipes
git switch -c add-crepes
printf 'Crepes\n\n125 g flour\n2 eggs\n250 ml milk\n' > crepes.txt
git add crepes.txt
git commit -m "Add crepe recipe"
git push -u origin add-crepes
```

```output
Switched to a new branch 'add-crepes'
[add-crepes d8afa3c] Add crepe recipe
 1 file changed, 5 insertions(+)
 create mode 100644 crepes.txt
To /home/sam/server/recipes.git
 * [new branch]      add-crepes -> add-crepes
branch 'add-crepes' set up to track 'origin/add-crepes'.
```

One branch for one change, named after what it does. When you push a new branch to GitHub, the output has a few extra lines starting with `remote:`, with a link to open a pull request for it.

### 2. Open the pull request

This step happens on GitHub. Open your repository's page. GitHub shows a banner about the branch you just pushed, with a button called Compare & pull request. You can also open the Pull requests tab and click New pull request.

Check the two branches at the top: **base** is where the change should go, `main`, and **compare** is your branch, `add-crepes`. Write a title that says what the change does, and a description that says why, and how to check it. Then click Create pull request. The PR gets a number, `#1` for the first one.

Look at the tabs of the new page. Conversation holds the discussion, Commits lists the commits, and Files changed shows the diff, with `-` and `+` lines as in lesson 2.2. On Files changed, anyone can click a line and leave a comment on it.

### 3. Answer a review comment

Say a friend comments: "Crepes need a pinch of salt." You fix it on the same branch and push:

```bash
echo "1 pinch of salt" >> crepes.txt
git commit -am "Add salt to the crepes"
git push
```

```output
[add-crepes 1aae20d] Add salt to the crepes
 1 file changed, 1 insertion(+)
To /home/sam/server/recipes.git
   d8afa3c..1aae20d  add-crepes -> add-crepes
```

There is no new pull request to open: the PR follows the branch, so the new commit shows up in it at once.

### 4. Merge on GitHub

On the Conversation tab, click Merge pull request, then Confirm merge. GitHub makes a merge commit on `main` with a message like `Merge pull request #1 from yourname/add-crepes`. It then offers a Delete branch button. Click it: the branch has done its job, and its commits are now part of `main`.

<!-- lab: run
git clone -q ~/server/recipes.git /tmp/github-side
cd /tmp/github-side
git merge -q --no-ff origin/add-crepes -m "Merge pull request #1 from sam/add-crepes" -m "Add crepe recipe"
git push -q origin main
git push -q origin --delete add-crepes
cd ~/recipes
rm -rf /tmp/github-side
-->

### 5. Bring the result home

Your computer does not know about the merge yet. Switch to `main` and pull:

```bash
git switch main
git pull
```

```output
Switched to branch 'main'
Your branch is up to date with 'origin/main'.
From /home/sam/server/recipes
   f7ff654..d37e3ed  main       -> origin/main
Updating f7ff654..d37e3ed
Fast-forward
 crepes.txt | 6 ++++++
 1 file changed, 6 insertions(+)
 create mode 100644 crepes.txt
```

The crepes are on your `main` now, with the merge commit GitHub made. Delete your local branch too, and let git forget the remote branch that GitHub deleted:

```bash
git branch -d add-crepes
git fetch --prune
```

```output
Deleted branch add-crepes (was 1aae20d).
From /home/sam/server/recipes
 - [deleted]         (none)     -> origin/add-crepes
```

`--prune` removes remote-tracking branches whose branch is gone from the remote. Without it, `origin/add-crepes` would hang around in `git branch -r` forever.

### 6. Watch the junk arrive

Projects collect files that do not belong in git. Make three typical ones: a file with a secret, a temporary file, and a folder that a program fills by itself:

```bash
echo "API_KEY=example-not-a-real-key" > .env
echo "half-written idea" > notes.tmp
mkdir cache
echo "cached data" > cache/page1
git status --short
```

```output
?? .env
?? cache/
?? notes.tmp
```

A file called **`.env`** is the usual place for secrets and settings on a developer's computer, such as passwords or the keys a program uses to talk to a service. It must never reach GitHub. One `git add .` and all three would be in the next commit.

### 7. Write a .gitignore

Create `.gitignore` in `~/recipes`, the top folder of the repository:

```text title=".gitignore"
# Secrets: never commit them
.env
# Temporary files
*.tmp
# Folders that programs fill by themselves
cache/
```

```bash
git status --short
```

```output
?? .gitignore
```

The three files have vanished from the status; only the new `.gitignore` shows. The files are still in the folder: git just stopped offering them. To ask why a file is ignored, use `git check-ignore -v`:

```bash
git check-ignore -v notes.tmp
```

```output
.gitignore:4:*.tmp	notes.tmp
```

The answer names the file, the line number and the pattern that matched. The `.gitignore` itself should be committed, so that everyone who clones the repository gets the same rules:

```bash
git add .gitignore
git commit -m "Ignore secrets, temporary files and cache"
```

```output
[main e7aa58f] Ignore secrets, temporary files and cache
 1 file changed, 6 insertions(+)
 create mode 100644 .gitignore
```

### 8. Untrack a file that was committed by mistake

The ignore list does nothing for files git already tracks. See it happen with a small log file:

```bash
echo "oven at 180 degrees" > oven.log
git add oven.log
git commit -qm "Add oven log"
echo "*.log" >> .gitignore
echo "oven at 200 degrees" >> oven.log
git status --short
```

```output
 M .gitignore
 M oven.log
```

`oven.log` matches `*.log` now, but git still reports its change, because the file is tracked. Tell git to stop tracking it, without deleting it from your folder:

```bash
git rm --cached oven.log
git status --short
```

```output
rm 'oven.log'
 M .gitignore
D  oven.log
```

`git rm --cached` stages the removal of the file from the repository and leaves your copy alone: `D` in the left column is a staged deletion, and `ls` would still show the file. Commit both changes:

```bash
git add .gitignore
git commit -qm "Stop tracking log files"
git status --short
ls
```

```output
cache  crepes.txt  notes.tmp  oven.log  pancakes.txt  tea.txt  waffles.txt
```

The status is empty: `oven.log` is ignored now, and still on your disk.

:::caution[Old commits keep everything]
Untracking a file does not remove it from older commits. Anyone with the repository can still go back to an old commit and read it. For a log file that is fine. For a password or a key, it is not: once a secret has been pushed, treat it as stolen. Change the password or revoke (cancel) the key first, and only then clean up the repository.
:::

## Exercise

Part 1. Put these pull request steps in the right order: merge on GitHub; push the branch; switch to `main` and pull; create a branch and commit; open the pull request; push a fix after a comment.

Part 2. In `~/recipes`:

1. Create a folder `photos` with a file `cake.jpg` inside (an empty file made with `touch` is enough), and a file `shopping.tmp`.
2. Create `menu.txt` with the line `Sunday: crepes`.
3. Make git ignore the `photos` folder. `shopping.tmp` needs no new line: check with `git check-ignore -v` which line already covers it.
4. Check that `git status --short` lists only `.gitignore` and `menu.txt`, then commit both.

<details>
<summary>Show the solution</summary>

Part 1: create a branch and commit; push the branch; open the pull request; push a fix after a comment; merge on GitHub; switch to `main` and pull.

Part 2:

```bash
mkdir photos
touch photos/cake.jpg shopping.tmp
echo "Sunday: crepes" > menu.txt
echo "photos/" >> .gitignore
git check-ignore -v shopping.tmp
git status --short
```

```output
.gitignore:4:*.tmp	shopping.tmp
 M .gitignore
?? menu.txt
```

Line 4 of `.gitignore`, the `*.tmp` pattern, already covers `shopping.tmp`. The `photos` folder is gone from the status.

```bash
git add .gitignore menu.txt
git commit -qm "Add a menu and ignore photos"
git status --short
```

Nothing printed: everything is committed or ignored. Naming the two files in `git add`, instead of a dot, is a good habit: you stage exactly what you mean.

</details>

## Check yourself

**1. What is a pull request?**

<details>
<summary>Answer</summary>

A request on GitHub to merge one branch into another, with a page where people can read the commits and the diff, comment on lines, and finally merge it.

</details>

**2. Your pull request is open and someone asks for a change. Do you open a new pull request?**

<details>
<summary>Answer</summary>

No. You commit the fix on the same branch and push it. The pull request follows the branch, so it shows the new commit at once.

</details>

**3. You committed `secret.txt`, then added it to `.gitignore`. Git still shows its changes. Why, and how do you fix it?**

<details>
<summary>Answer</summary>

`.gitignore` only affects files that are not tracked, and `secret.txt` is already tracked. Run `git rm --cached secret.txt` and commit. The file stays on your disk but leaves the repository from that commit on.

</details>

**4. You pushed a real password to GitHub and removed it in the next commit. Are you safe?**

<details>
<summary>Answer</summary>

No. The old commit still holds the password, and anyone with the repository can read it. Treat the password as stolen: change it first, then clean up.

</details>

**5. What does `git check-ignore -v notes.tmp` tell you?**

<details>
<summary>Answer</summary>

Whether `notes.tmp` is ignored, and if so, which file, line number and pattern of the ignore rules matched it.

</details>

## Common mistakes

- **Naming the file wrong.** It must be exactly `.gitignore`, with the dot and without `.txt`, in the top folder of the repository. Check with `ls -a`.
- **Adding the ignore line too late.** Write `.gitignore` before the first `git add .` of a new project, and use `git rm --cached` for anything that slipped in.
- **Opening a pull request from `main`.** Make a new branch for every change. A branch keeps one pull request about one thing.
- **Huge pull requests.** A change of two thousand lines gets a quick "looks good" and no real review. Keep each one small enough to read in a few minutes.
- **Starting the next branch from old code.** After the merge on GitHub, switch to `main` and `git pull` first.

## Key terms

- **Pull request**: a request on GitHub to merge one branch into another, with a page for review and discussion. Often called a PR.
- **Code review**: reading someone else's change and commenting on it before it is merged.
- **Base and compare**: in a pull request, the branch the change goes into and the branch it comes from.
- **Fork**: your own copy of someone else's repository on GitHub, used to propose changes to it.
- **`.gitignore`**: a file that lists names and patterns of files git should not track.
- **Ignored file**: a file that matches a `.gitignore` pattern, so git does not offer to track it.
- **`.env` file**: a file that holds secrets and settings for a program on one computer. It is never committed.

## Go further

- [GitHub Docs: About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests): what a pull request page holds, and the options for merging.
- [gitignore documentation](https://git-scm.com/docs/gitignore): every pattern rule, including `!` to make an exception.
- [GitHub Docs: Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository): what to do when a secret was pushed, and why changing it comes first.
