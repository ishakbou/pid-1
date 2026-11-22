---
title: Branches and merging
description: Try an idea on a branch without touching the version that works, merge it back, and solve a merge conflict when two changes collide.
lesson: "2.3"
time: 25 min
sidebar:
  order: 3
---

<!-- lab: run
rm -f ~/.gitconfig
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
git config --global core.editor nano
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=log.decorate GIT_CONFIG_VALUE_0=short
mkdir ~/recipes && cd ~/recipes && git init -q
printf 'Pancakes\n\n200 g flour\n2 eggs\n300 ml milk\n1 spoon of sugar\n' > pancakes.txt
git add pancakes.txt
GIT_AUTHOR_DATE="2026-11-21T10:00:00+0000" GIT_COMMITTER_DATE="2026-11-21T10:00:00+0000" git commit -q -m "Add pancake recipe"
printf 'Pancakes\n\n200 g flour\n2 eggs\n300 ml milk\n2 spoons of sugar\n1 pinch of salt\n' > pancakes.txt
git add pancakes.txt
GIT_AUTHOR_DATE="2026-11-21T10:07:00+0000" GIT_COMMITTER_DATE="2026-11-21T10:07:00+0000" git commit -q -m "Use more sugar and add salt"
printf 'Mint tea\n\n1 spoon of green tea and fresh mint\n' > tea.txt
git add tea.txt
GIT_AUTHOR_DATE="2026-11-21T10:12:00+0000" GIT_COMMITTER_DATE="2026-11-21T10:12:00+0000" git commit -q -m "Add mint tea recipe"
export GIT_AUTHOR_DATE="2026-11-21T11:00:00+0000" GIT_COMMITTER_DATE="2026-11-21T11:00:00+0000"
cd ~
-->

Your pancake recipe works. Now you want to try chocolate in it, and you are not sure it will be good. On a folder of copies you would make `pancakes_chocolate_test.txt` and hope you remember which file is which. Git gives you something cleaner: a separate line of work where you can try anything, and either bring it back or throw it away.

## Goal

After this lesson you can:

- Create a branch, switch between branches, and see which one you are on.
- Merge a branch back into `main`.
- Solve a merge conflict when two branches changed the same line.

## Why it matters

On real projects, `main` holds the version that works, and nobody experiments on it directly. Each new feature or fix gets its own branch until it is ready. That way a half-finished idea never breaks what other people use, and several people can work at the same time without stepping on each other. Pull requests in lesson 2.6 are built on branches.

## The idea

You met the word in lesson 2.1: a **branch** is a named line of commits. Under the hood it is very light. A branch is only a name that points to one commit, the newest commit of that line. When you commit on a branch, the new commit gets added and the name moves forward to it.

Git also keeps a pointer called **HEAD** that says where you are right now, usually "on branch `main`". That is what `(HEAD -> main)` meant in `git log` in the last lesson. **Switching** branches moves HEAD to another branch and changes the files in your working tree to match that branch's newest commit.

Think of a road with a side road. You can take the side road, drive as far as you like, and the main road stays exactly as it was. **Merging** is where the side road joins the main road again: git combines the commits of one branch into another.

Merges come in two kinds:

- If `main` has not moved since you started your branch, git just slides the `main` name forward to the newest commit of your branch. This is a **fast-forward** merge, and it makes no new commit.
- If both branches have new commits, git combines the two sets of changes and records the result as a **merge commit**, a commit with two parents.

When both branches changed the same lines of the same file, git cannot know which version you want. It stops and asks you to decide. That is a **merge conflict**. It sounds scary, but it is just a question from git, and you answer it by editing the file.

<figure class="diagram">
<svg viewBox="0 0 600 200" role="img" aria-labelledby="merge-title merge-desc">
<title id="merge-title">A branch that splits from main and is merged back</title>
<desc id="merge-desc">On the top row, the main branch has the commit Add chocolate to pancakes, then the commit Use even more sugar, then a highlighted merge commit. On the bottom row, the branch less-sugar has the commit Use less sugar. A line leaves the first commit downwards to the less-sugar commit, and another line goes from the less-sugar commit up to the merge commit, which therefore has two parents.</desc>
<path class="d-line" d="M150 50 H230 M370 50 H450 M90 68 V140 H230 M370 140 H510 V68"/>
<rect class="d-box" x="20" y="32" width="130" height="36"/>
<rect class="d-box" x="230" y="32" width="140" height="36"/>
<rect class="d-box d-hot" x="450" y="32" width="130" height="36"/>
<rect class="d-box" x="230" y="122" width="140" height="36"/>
<text x="85" y="55">Add chocolate</text>
<text x="300" y="55">Even more sugar</text>
<text x="515" y="55">Merge commit</text>
<text x="300" y="145">Use less sugar</text>
<text x="300" y="20">main</text>
<text x="300" y="185">less-sugar</text>
</svg>
<figcaption>Two branches that both moved on. Merging them makes a merge commit with two parents.</figcaption>
</figure>

## Try it

This lesson continues `~/recipes` from lesson 2.2. Your hashes are different from the ones below, and if you did the exercises your history may be a little longer.

### 1. See your branches

```bash
cd ~/recipes
git branch
```

```output
* main
```

`git branch` lists the branches. The star marks the one you are on. So far there is only `main`.

### 2. Create a branch and switch to it

```bash
git switch -c chocolate
```

```output
Switched to a new branch 'chocolate'
```

`git switch` moves you to another branch, and `-c` creates it first. The new branch starts at the commit you were on, so for now `chocolate` and `main` point to the same commit. You will also meet the older command `git checkout -b chocolate` in tutorials: it does the same here.

### 3. Commit on the branch

Add a line at the end of `pancakes.txt`:

```text title="pancakes.txt"
Pancakes

200 g flour
2 eggs
300 ml milk
2 spoons of sugar
1 pinch of salt
50 g dark chocolate
```

```bash
git add pancakes.txt
git commit -m "Add chocolate to pancakes"
```

```output
[chocolate ddc6994] Add chocolate to pancakes
 1 file changed, 1 insertion(+)
```

The first word in the brackets is now `chocolate`: the commit went onto your branch.

### 4. Go back to main

```bash
git switch main
tail -n 2 pancakes.txt
```

```output
Switched to branch 'main'
2 spoons of sugar
1 pinch of salt
```

The chocolate line is gone. It is not lost: switching to `main` put the files back the way `main` has them. To see every branch at once, ask `git log` for all of them, drawn as a graph:

```bash
git log --oneline --graph --all
```

```output
* ddc6994 (chocolate) Add chocolate to pancakes
* 8c2e156 (HEAD -> main) Add mint tea recipe
* 78a0864 Use more sugar and add salt
* 77b3263 Add pancake recipe
```

`--all` shows every branch, not just the one you are on, and `--graph` draws the lines with `*` for commits. `chocolate` is one commit ahead of `main`, and HEAD is on `main`.

### 5. Merge the branch

The chocolate test went well. Merge it into `main`. You always merge from the branch that receives the changes, so you stay on `main`:

```bash
git merge chocolate
```

```output
Updating 8c2e156..ddc6994
Fast-forward
 pancakes.txt | 1 +
 1 file changed, 1 insertion(+)
```

`Fast-forward`: `main` had not moved since the branch started, so git just moved the `main` name forward to the chocolate commit. The branch has done its job, so delete it:

```bash
git branch -d chocolate
```

```output
Deleted branch chocolate (was ddc6994).
```

Deleting a branch removes only the name. The commit stays in the history of `main`.

### 6. Make two changes that collide

Now a harder case. A friend thinks there is too much sugar, and you think there is not enough. Make a branch for the friend's idea, and change the sugar line to `1 spoon of sugar`:

```bash
git switch -c less-sugar
```

```output
Switched to a new branch 'less-sugar'
```

```text title="pancakes.txt"
Pancakes

200 g flour
2 eggs
300 ml milk
1 spoon of sugar
1 pinch of salt
50 g dark chocolate
```

```bash
git commit -am "Use less sugar"
```

```output
[less-sugar 664f492] Use less sugar
 1 file changed, 1 insertion(+), 1 deletion(-)
```

`-a` is a shortcut: it stages every change to tracked files before committing, so you can skip `git add`. It never adds untracked files, so new files still need `git add`.

Now go back to `main` and change the same line your way, to `3 spoons of sugar`:

```bash
git switch main
```

```output
Switched to branch 'main'
```

```text title="pancakes.txt"
Pancakes

200 g flour
2 eggs
300 ml milk
3 spoons of sugar
1 pinch of salt
50 g dark chocolate
```

```bash
git commit -am "Use even more sugar"
```

```output
[main b018d5d] Use even more sugar
 1 file changed, 1 insertion(+), 1 deletion(-)
```

### 7. Merge and meet the conflict

```bash
git merge less-sugar
```

```output
Auto-merging pancakes.txt
CONFLICT (content): Merge conflict in pancakes.txt
Automatic merge failed; fix conflicts and then commit the result.
```

Both branches changed line 6, so git stopped in the middle of the merge and left the decision to you. Look at the state:

```bash
git status
```

```output
On branch main
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
	both modified:   pancakes.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

`both modified` names the file to fix. The hints show the way out, too: `git merge --abort` cancels the whole merge and puts everything back as it was before.

### 8. Read the conflict markers

```bash
cat pancakes.txt
```

```output
Pancakes

200 g flour
2 eggs
300 ml milk
<<<<<<< HEAD
3 spoons of sugar
=======
1 spoon of sugar
>>>>>>> less-sugar
1 pinch of salt
50 g dark chocolate
```

Git wrote both versions into the file, between **conflict markers**. Between `<<<<<<< HEAD` and `=======` is your version, the one on the branch you are on. Between `=======` and `>>>>>>> less-sugar` is the version from the branch you are merging. Everything outside the markers merged without trouble.

### 9. Solve it

You decide: the friend was right. Edit the file so that it says what the recipe should say, and delete the three marker lines:

```text title="pancakes.txt"
Pancakes

200 g flour
2 eggs
300 ml milk
1 spoon of sugar
1 pinch of salt
50 g dark chocolate
```

Then tell git the conflict is solved, by staging the file, and finish the merge with a commit:

```bash
git add pancakes.txt
git commit -m "Merge less-sugar: keep 1 spoon of sugar"
```

```output
[main 630e083] Merge less-sugar: keep 1 spoon of sugar
```

### 10. Look at the result

```bash
git log --oneline --graph
```

```output
*   630e083 (HEAD -> main) Merge less-sugar: keep 1 spoon of sugar
|\  
| * 664f492 (less-sugar) Use less sugar
* | b018d5d Use even more sugar
|/  
* ddc6994 Add chocolate to pancakes
* 8c2e156 Add mint tea recipe
* 78a0864 Use more sugar and add salt
* 77b3263 Add pancake recipe
```

Read the graph from the bottom up. After the chocolate commit the history splits in two, one commit on each side, and the merge commit at the top joins them again: it has two parents. This is the picture from "The idea". Clean up the branch you no longer need:

```bash
git branch -d less-sugar
```

```output
Deleted branch less-sugar (was 664f492).
```

## Exercise

Stay in `~/recipes`, on `main`.

1. Create a branch `honey-tea` and add the line `1 spoon of honey` at the end of `tea.txt`. Commit.
2. Switch to `main`. Add the line `Butter for the pan` at the end of `pancakes.txt`. Commit.
3. Merge `honey-tea` into `main`. Use `--no-edit`, which keeps the message git proposes.
4. Show the graph of the last four commits with `-n 4`, then delete the branch.

The two branches changed different files, so expect no conflict this time.

<details>
<summary>Show the solution</summary>

```bash
git switch -c honey-tea
echo "1 spoon of honey" >> tea.txt
git commit -am "Add honey to the tea"
git switch main
echo "Butter for the pan" >> pancakes.txt
git commit -am "Add butter for the pan"
```

```output
Switched to a new branch 'honey-tea'
[honey-tea 1daccc6] Add honey to the tea
 1 file changed, 1 insertion(+)
Switched to branch 'main'
[main 120b68c] Add butter for the pan
 1 file changed, 1 insertion(+)
```

`>>` adds a line at the end of a file, as in lesson 1.7. Editing in nano works just as well.

```bash
git merge --no-edit honey-tea
```

```output
Merge made by the 'ort' strategy.
 tea.txt | 1 +
 1 file changed, 1 insertion(+)
```

Both branches had new commits, so this was not a fast-forward: git made a merge commit on its own. `ort` is the name of the method git uses to combine changes; you can ignore it. Without `--no-edit`, git opens nano with the message `Merge branch 'honey-tea'`: save and quit to accept it.

```bash
git log --oneline --graph -n 4
git branch -d honey-tea
```

```output
*   35c9c38 (HEAD -> main) Merge branch 'honey-tea'
|\  
| * 1daccc6 (honey-tea) Add honey to the tea
* | 120b68c Add butter for the pan
|/  
*   630e083 Merge less-sugar: keep 1 spoon of sugar
|\  
Deleted branch honey-tea (was 1daccc6).
```

The `|\` on the last line of the graph belongs to the older merge commit: `-n 4` stopped before its two parents.

</details>

## Check yourself

**1. What is a branch, under the hood?**

<details>
<summary>Answer</summary>

A name that points to one commit, the newest commit of that line of work. Each new commit on the branch moves the name forward.

</details>

**2. You are on `main` and run `git merge fix`. Which branch receives the changes?**

<details>
<summary>Answer</summary>

`main`, the branch you are on. `fix` itself does not change.

</details>

**3. When is a merge a fast-forward?**

<details>
<summary>Answer</summary>

When the receiving branch has no new commits since the other branch started. Git only moves the branch name forward, and no merge commit is made.

</details>

**4. In a conflict, what is between `<<<<<<< HEAD` and `=======`?**

<details>
<summary>Answer</summary>

The version from the branch you are on. The part between `=======` and `>>>>>>>` comes from the branch you are merging.

</details>

**5. You started a merge, got a conflict, and want to stop and think. Which command puts everything back as it was?**

<details>
<summary>Answer</summary>

`git merge --abort`.

</details>

## Common mistakes

- **Committing on the wrong branch.** Before you start work, look at the first line of `git status` or the star in `git branch`.
- **Merging in the wrong direction.** To bring `chocolate` into `main`, switch to `main` first, then `git merge chocolate`.
- **Leaving markers in the file.** If you stage a file that still holds `<<<<<<<` or `>>>>>>>` lines, they get committed. Search for them with `grep -n '<<<<<<<' pancakes.txt` before `git add`.
- **Switching with uncommitted work.** If your changes would be lost, `git switch` refuses and says `Your local changes to the following files would be overwritten`. Commit them first, or undo them as lesson 2.4 shows.
- **Expecting `-a` to add new files.** `git commit -am` stages changes to tracked files only. A new file still needs `git add`.

## Key terms

- **HEAD**: git's pointer to where you are now, usually the branch you are on.
- **Switch**: to move to another branch with `git switch`, which changes the working tree to match it.
- **Merge**: to combine the commits of one branch into another, with `git merge`.
- **Fast-forward**: a merge where git only moves the branch name forward, because the receiving branch had no new commits.
- **Merge commit**: a commit with two parents, which records the result of combining two branches.
- **Merge conflict**: a merge that git cannot finish alone, because both branches changed the same lines.
- **Conflict markers**: the lines `<<<<<<<`, `=======` and `>>>>>>>` that git writes into a file to show both versions of a conflict.

## Go further

- [Pro Git: Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell): how branches and HEAD work, with clear drawings.
- [Pro Git: Basic Branching and Merging](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging): a longer example with a conflict, like the one in this lesson.
- [git-merge documentation](https://git-scm.com/docs/git-merge): the full reference, including how conflicts are shown.
