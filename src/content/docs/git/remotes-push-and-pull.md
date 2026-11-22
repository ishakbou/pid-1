---
title: Remotes, push and pull
description: Connect a repository to a copy somewhere else, send and receive commits with push and pull, clone a repository, and set up GitHub with an SSH key.
lesson: "2.5"
time: 25 min
sidebar:
  order: 5
---

<!-- lab: run
rm -f ~/.gitconfig
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
git config --global core.editor nano
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=log.decorate GIT_CONFIG_VALUE_0=short
export GIT_AUTHOR_DATE="2026-11-21T10:00:00+0000" GIT_COMMITTER_DATE="2026-11-21T10:00:00+0000"
mkdir ~/recipes && cd ~/recipes && git init -q
printf 'Pancakes\n\n200 g flour\n2 eggs\n300 ml milk\n1 spoon of sugar\n' > pancakes.txt
git add pancakes.txt && git commit -q -m "Add pancake recipe"
printf 'Pancakes\n\n200 g flour\n2 eggs\n300 ml milk\n1 spoon of sugar\n1 pinch of salt\n50 g dark chocolate\n' > pancakes.txt
git commit -q -am "Use less sugar, add salt and chocolate"
printf 'Mint tea\n\n1 spoon of green tea and fresh mint\n1 spoon of honey\nServe hot\n' > tea.txt
git add tea.txt && git commit -q -m "Add mint tea recipe"
export GIT_AUTHOR_DATE="2026-11-21T13:00:00+0000" GIT_COMMITTER_DATE="2026-11-21T13:00:00+0000"
rm -f ~/.ssh/id_ed25519 ~/.ssh/id_ed25519.pub
cd ~
-->

Right now your recipes live in exactly one place: the disk of one computer. If that disk dies tonight, the files and their whole history die with it. And nobody else can see your work or add to it. This lesson gives your repository a second home, first on your own machine to learn the moves, then on GitHub.

## Goal

After this lesson you can:

- Connect a repository to a remote, and send your commits to it with `git push`.
- Get new commits with `git pull`, and copy a whole repository with `git clone`.
- Set up GitHub with an SSH key and push a repository to it.

## Why it matters

A repository that exists in two places survives a broken laptop. It also lets you work from two computers, and lets other people read your code and suggest changes. Almost every project you will work on lives on a server like GitHub, and push and pull are how you take part.

## The idea

A **remote** is another copy of your repository, somewhere else, that your repository knows by a short name. The usual name is **origin**. The remote can be on GitHub, on a school server, or just in another folder.

Every copy is a full repository with the whole history. Think of two copies of the same notebook. **Pushing** is sending your new pages to the other copy. **Pulling** is getting the pages that were added there and adding them to yours. **Cloning** is making a brand-new copy of a notebook that someone else keeps, with all its pages.

Your repository also remembers where each branch of the remote was the last time you talked to it. That memory is a **remote-tracking branch**, written `origin/main`. It moves only when you push, pull or fetch, so it can be out of date. Git does not ask the remote by itself.

You will learn the commands with a remote in another folder of your own computer, because for push, pull and clone it behaves like GitHub, and it needs no account. Servers keep a special kind of repository called a **bare repository**: just the history, without a working tree, since nobody edits files there. Then you do the same with GitHub. Only the address changes.

## Try it

This lesson continues `~/recipes`. Your hashes are different from the ones below.

### 1. Make a stand-in server

```bash
git init --bare ~/server/recipes.git
```

```output
Initialized empty Git repository in /home/sam/server/recipes.git/
```

`--bare` makes a repository with no working tree. By habit, the folder name of a bare repository ends in `.git`. Think of `~/server` as a computer far away; you will not work inside it.

### 2. Add it as a remote

```bash
cd ~/recipes
git remote add origin ~/server/recipes.git
git remote -v
```

```output
origin  /home/sam/server/recipes.git (fetch)
origin  /home/sam/server/recipes.git (push)
```

`git remote add` takes a name and an address. `-v`, "verbose", lists the remotes with their addresses. The same address is used to fetch commits and to push them.

### 3. Push your commits

```bash
git push -u origin main
```

```output
To /home/sam/server/recipes.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

`git push origin main` sends the commits of your `main` to the remote `origin`, which creates a `main` branch there. `-u` also remembers that your `main` goes with `origin/main`, its **upstream**. You need `-u` only the first time; after that, plain `git push` and `git pull` know where to go.

```bash
git status
```

```output
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

The second line is new: git now compares your branch with `origin/main`.

### 4. Clone a second copy

Pretend you are on another computer, or that a friend wants the recipes. You do not copy the folder; you clone it:

```bash
cd ~
git clone ~/server/recipes.git laptop-recipes
ls laptop-recipes
```

```output
Cloning into 'laptop-recipes'...
done.
pancakes.txt  tea.txt
```

`git clone` copies the whole repository with its history into a new folder, here `laptop-recipes`, and sets up `origin` to point back where it came from. Without the folder name, git would call it `recipes`.

### 5. Commit there and push

```bash
cd ~/laptop-recipes
printf 'Waffles\n\n250 g flour\n2 eggs\n' > waffles.txt
git add waffles.txt
git commit -m "Add waffle recipe"
git push
```

```output
[main 8e33790] Add waffle recipe
 1 file changed, 4 insertions(+)
 create mode 100644 waffles.txt
To /home/sam/server/recipes.git
   75a8fdd..8e33790  main -> main
```

A clone already knows its upstream, so plain `git push` is enough. `75a8fdd..8e33790` says that the remote's `main` moved from the first commit to the second.

### 6. Pull in the first copy

Back in `~/recipes`, git does not know about the waffles yet:

```bash
cd ~/recipes
git status
```

```output
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

"Up to date" is git's memory from the last push, not a fresh answer from the remote. To get the new commits, pull:

```bash
git pull
```

```output
From /home/sam/server/recipes
   75a8fdd..8e33790  main       -> origin/main
Updating 75a8fdd..8e33790
Fast-forward
 waffles.txt | 4 ++++
 1 file changed, 4 insertions(+)
 create mode 100644 waffles.txt
```

`git pull` does two things. First it **fetches**: it downloads the new commits and moves `origin/main`, the first two lines. Then it merges `origin/main` into your `main`, a fast-forward like in lesson 2.3. You can run the first half alone with `git fetch`.

### 7. When a push is refused

Now both copies change at the same time. In the laptop copy, add a line to the waffles and push:

```bash
cd ~/laptop-recipes
echo "Serve with jam" >> waffles.txt
git commit -qam "Serve waffles with jam"
git push -q
```

`-q`, "quiet", keeps git from printing its usual report. In `~/recipes`, add a line to the tea, commit, and try to push:

```bash
cd ~/recipes
echo "Leave for 5 minutes" >> tea.txt
git commit -qam "Say how long to brew the tea"
git push
```

```output
To /home/sam/server/recipes.git
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to '/home/sam/server/recipes.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

Git refuses, and that protects the commit you pushed from the laptop copy: this push would have thrown it away. The fix is the hint: pull first, then push. Both copies have new commits, so the pull needs a merge commit, and git wants you to choose how pulls combine work once. Tell it to merge, as you know from lesson 2.3:

```bash
git config --global pull.rebase false
git pull --no-edit
```

```output
From /home/sam/server/recipes
   8e33790..4833d15  main       -> origin/main
Merge made by the 'ort' strategy.
 waffles.txt | 1 +
 1 file changed, 1 insertion(+)
```

The changes were in different files, so the merge went through by itself. `--no-edit` keeps git's proposed message; without it, nano opens. Had both changed the same line, you would solve a conflict exactly as in lesson 2.3. Now the push works:

```bash
git push
```

```output
To /home/sam/server/recipes.git
   4833d15..71cb6b8  main -> main
```

### 8. Set up GitHub

Now the real thing. These steps happen on the GitHub website and with your own account, so the course cannot show their output.

1. Go to [github.com](https://github.com) and sign up. It is free. Your username becomes part of your addresses, so choose one you are happy to show an employer.
2. To keep your email private, open Settings, then Emails, and turn on the option to keep your address private. GitHub shows you a private "noreply" address. Put it in your commits:

<!-- lab: skip -->
```bash
git config --global user.email "12345678+yourname@users.noreply.github.com"
```

Use the exact address GitHub shows you, not this one.

### 9. Make an SSH key

GitHub does not accept your account password for git commands. You prove who you are with an **SSH key** instead: a pair of files that work together. The **private key** stays on your computer and must never be shared. The **public key** can be given to anyone; you give it to GitHub. When you push, your computer proves it holds the private key that matches, without ever sending it. Module 11 explains how that works, in [SSH and keys](../system-security/ssh-and-keys/).

<!-- lab: skip -->
```bash
ssh-keygen -t ed25519 -C "sam@example.com"
```

<!-- lab: run
ssh-keygen -q -t ed25519 -C "sam@example.com" -N "" -f ~/.ssh/id_ed25519
-->

`-t ed25519` picks a modern kind of key, and `-C` adds a comment so that you recognise it later; your email is the usual choice. The command asks where to save the key: press Enter for the default. Then it asks for a passphrase, twice. Choose one: it protects the key if someone copies the file. Nothing appears on the screen while you type it.

```bash
ls ~/.ssh
```

```output
authorized_keys  id_ed25519  id_ed25519.pub
```

`id_ed25519` is the private key and `id_ed25519.pub` the public one. You may not have `authorized_keys`; it belongs to a different use of SSH. Print the public key:

<!-- lab: nocheck -->
```bash
cat ~/.ssh/id_ed25519.pub
```

```output
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIN2M3yV41kuJkjCt3sJGjryGdhWjBhT7xpP7IsgAmQ40 sam@example.com
```

Yours is a different line, of course. In GitHub, open Settings, then SSH and GPG keys, then New SSH key. Give it a title such as the name of your computer, paste the whole line, and save. Then test the connection:

<!-- lab: skip -->
```bash
ssh -T git@github.com
```

The first time, SSH says it cannot confirm the server and shows a fingerprint. Compare it with the fingerprints GitHub publishes in its documentation, under "GitHub's SSH key fingerprints", and type `yes` only if they match. Then GitHub greets you by your username and adds that it does not provide shell access. That greeting means the key works.

### 10. Push to GitHub

On GitHub, click the `+` at the top, then New repository. Name it `recipes`, leave every box for README, .gitignore and license unticked so that it starts empty, and create it. GitHub then shows its address. Choose the SSH one, which looks like `git@github.com:yourname/recipes.git`.

Your `origin` still points at the stand-in server. Point it at GitHub instead, and push:

<!-- lab: skip -->
```bash
cd ~/recipes
git remote set-url origin git@github.com:yourname/recipes.git
git push -u origin main
```

`git remote set-url` changes the address of a remote that already exists. With a brand-new repository you would use `git remote add origin` followed by the address. Reload the page on GitHub: your recipes and their history are there. Click the commit count to see the same history `git log` shows.

<!-- lab: run
rm -f ~/.ssh/id_ed25519 ~/.ssh/id_ed25519.pub
-->

## Exercise

Use the two copies and the stand-in server from steps 1 to 7.

1. In `~/laptop-recipes`, pull first, so that it has the latest commits.
2. Create a branch `pancake-tips`, add the line `Rest the batter for 10 minutes` to `pancakes.txt`, and commit.
3. Push the branch to `origin`, with `-u`.
4. In `~/recipes`, fetch, and list the remote-tracking branches with `git branch -r`.

<details>
<summary>Show the solution</summary>

```bash
cd ~/laptop-recipes
git pull -q
git switch -c pancake-tips
echo "Rest the batter for 10 minutes" >> pancakes.txt
git commit -qam "Rest the batter"
git push -u origin pancake-tips
```

```output
Switched to a new branch 'pancake-tips'
To /home/sam/server/recipes.git
 * [new branch]      pancake-tips -> pancake-tips
branch 'pancake-tips' set up to track 'origin/pancake-tips'.
```

A branch is pushed the same way as `main`: name the remote and the branch.

```bash
cd ~/recipes
git fetch
git branch -r
```

```output
From /home/sam/server/recipes
 * [new branch]      pancake-tips -> origin/pancake-tips
  origin/main
  origin/pancake-tips
```

`git fetch` downloaded the new branch but changed nothing in your files or your own branches. `git branch -r` lists the remote-tracking branches. You could look at the new commit with `git log origin/pancake-tips`. Pushing a branch like this is the first step of a pull request, the subject of the next lesson.

</details>

## Check yourself

**1. What does `-u` do in `git push -u origin main`?**

<details>
<summary>Answer</summary>

It sets `origin/main` as the upstream of your `main`, so that later a plain `git push` or `git pull` knows which remote and branch to use.

</details>

**2. `git status` says "Your branch is up to date with 'origin/main'", but a friend pushed an hour ago. How can both be true?**

<details>
<summary>Answer</summary>

Git compares with `origin/main`, its memory of the remote from the last push, pull or fetch. It does not ask the remote by itself. Run `git fetch` or `git pull` to update that memory.

</details>

**3. What are the two halves of `git pull`?**

<details>
<summary>Answer</summary>

A fetch, which downloads the new commits and moves `origin/main`, then a merge of `origin/main` into your branch.

</details>

**4. Your push is rejected with `(fetch first)`. What happened, and what do you do?**

<details>
<summary>Answer</summary>

Someone pushed commits that you do not have, and your push would have thrown them away. Run `git pull` to get and merge them, solve any conflict, then `git push` again.

</details>

**5. Which SSH key file do you give to GitHub, and which must never leave your computer?**

<details>
<summary>Answer</summary>

You give GitHub the public key, `id_ed25519.pub`. The private key, `id_ed25519`, never leaves your computer.

</details>

## Common mistakes

- **Typing your GitHub password for git.** With an `https://` address, git asks for a username and password, and your account password is refused. Use the SSH address `git@github.com:...` with your key, and check the address with `git remote -v`.
- **Pasting the private key into GitHub.** The private key file has no `.pub` and starts with `-----BEGIN OPENSSH PRIVATE KEY-----`. If you ever shared it, delete the key in GitHub's settings and make a new pair.
- **`fatal: Need to specify how to reconcile divergent branches`.** Your pull needs a merge, and git does not know your choice yet. Run `git config --global pull.rebase false` once, as in step 7, then pull again.
- **`remote origin already exists`.** You ran `git remote add origin` twice. Change the address with `git remote set-url origin`, or look at what is there with `git remote -v`.
- **Creating the GitHub repository with a README.** Then GitHub has a commit that you do not, and your first push is refused. Pull first, or create the repository empty.

## Key terms

- **Remote**: another copy of a repository that your repository knows by a short name.
- **origin**: the usual name of the main remote, set by `git clone` or chosen with `git remote add`.
- **Push**: to send your new commits to a remote, with `git push`.
- **Pull**: to fetch new commits from a remote and merge them into your branch, with `git pull`.
- **Fetch**: to download new commits from a remote without changing your own branches, with `git fetch`.
- **Clone**: to make a new local copy of a remote repository, with its full history, with `git clone`.
- **Remote-tracking branch**: your repository's memory of a branch on a remote, such as `origin/main`.
- **Upstream**: the remote branch that a local branch pushes to and pulls from by default.
- **Bare repository**: a repository with only the history and no working tree, as kept on servers.
- **SSH key**: a pair of files, a private key you keep secret and a public key you share, used to prove who you are without a password.

## Go further

- [Pro Git: Working with Remotes](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes): adding, inspecting and renaming remotes, push and fetch.
- [GitHub Docs: Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh): GitHub's own step-by-step guide for keys, including its published fingerprints.
- [git-push documentation](https://git-scm.com/docs/git-push): the full reference, including the note about fast-forwards from the error in step 7.
