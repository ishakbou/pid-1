---
title: Fixing mistakes (restore, revert, reset)
description: Undo a change at each stage, from a broken file to a commit that is already shared, and learn which git command fits which mistake.
lesson: "2.4"
time: 20 min
sidebar:
  order: 4
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
printf 'Pancakes\n\n200 g flour\n2 eggs\n300 ml milk\n2 spoons of sugar\n1 pinch of salt\n' > pancakes.txt
git commit -q -am "Use more sugar and add salt"
printf 'Mint tea\n\n1 spoon of green tea and fresh mint\n' > tea.txt
git add tea.txt && git commit -q -m "Add mint tea recipe"
echo "50 g dark chocolate" >> pancakes.txt && git commit -q -am "Add chocolate to pancakes"
git switch -q -c less-sugar
sed -i 's/^2 spoons of sugar/1 spoon of sugar/' pancakes.txt && git commit -q -am "Use less sugar"
git switch -q main
sed -i 's/^2 spoons of sugar/3 spoons of sugar/' pancakes.txt && git commit -q -am "Use even more sugar"
git merge -q less-sugar > /dev/null
sed -i '/^<<<<<<<\|^=======\|^>>>>>>>\|^3 spoons/d' pancakes.txt
git add pancakes.txt && git commit -q -m "Merge less-sugar: keep 1 spoon of sugar"
git branch -q -d less-sugar
git switch -q -c honey-tea
echo "1 spoon of honey" >> tea.txt && git commit -q -am "Add honey to the tea"
git switch -q main
echo "Butter for the pan" >> pancakes.txt && git commit -q -am "Add butter for the pan"
git merge -q --no-edit honey-tea && git branch -q -d honey-tea
export GIT_AUTHOR_DATE="2026-11-21T12:00:00+0000" GIT_COMMITTER_DATE="2026-11-21T12:00:00+0000"
cd ~
-->

Here is a surprising fact about git: once something is in a commit, it is very hard to lose. Most "disasters" can be undone in one command, if you pick the right one. The trouble is that git has several undo commands, and each one fits a different kind of mistake. This lesson sorts them out, from the least dangerous to the one that needs care.

## Goal

After this lesson you can:

- Throw away a bad edit, and take a file back out of the staging area.
- Fix your last commit, or undo commits that you have not shared yet.
- Undo a commit that is already shared, without rewriting history.

## Why it matters

Everyone makes these mistakes: a file saved over by accident, the wrong file staged, a typo in a commit message, a change that broke something and is already online. Without a clear method, people panic, copy the folder "just in case" and make things worse. With one, each fix takes seconds, and you stop being afraid to try things.

## The idea

The right command depends on where the mistake is: in the working tree, in the staging area, or in a commit. And for a commit, on whether you have already shared it with other people, which you will do from lesson 2.5 on.

| Where the mistake is | Example | Command | What you lose |
|---|---|---|---|
| Working tree, not staged | You broke a file | `git restore file` | Your edits that are not staged |
| Staging area | You staged the wrong file | `git restore --staged file` | Nothing |
| Last commit, not shared | Typo in the message | `git commit --amend` | Nothing |
| Commits, not shared | The last commit was a bad idea | `git reset HEAD~1` | Nothing, the changes come back as edits |
| Commits, already shared | A pushed commit broke something | `git revert hash` | Nothing, a new commit undoes it |

`HEAD~1` means "one commit before HEAD", the parent of the commit you are on. `HEAD~2` goes back two, and so on.

The last two rows are the important difference. **Resetting** moves the branch name back to an older commit, so the newer commits drop out of the branch. **Reverting** adds a new commit that does the exact opposite of an old one, and keeps everything. Think of a notebook and a newspaper. Pages of your own notebook that nobody has seen yet can be torn out. A newspaper that is already printed and sold cannot be changed; the editors print a correction in the next issue. Reset tears out pages. Revert prints a correction.

That is why the rule is: reset only commits that live only on your computer. Once others may have a commit, revert it.

## Try it

This lesson continues `~/recipes` from lesson 2.3, exercise included. Your hashes are different.

### 1. Throw away a bad edit

You wanted to add a line, but typed `>` instead of `>>`:

```bash
cd ~/recipes
echo "Lots of salt" > pancakes.txt
cat pancakes.txt
```

```output
Lots of salt
```

The whole recipe is gone, replaced by one line. Git still has the version of the last commit:

```bash
git status --short
git restore pancakes.txt
cat pancakes.txt
```

```output
 M pancakes.txt
Pancakes

200 g flour
2 eggs
300 ml milk
1 spoon of sugar
1 pinch of salt
50 g dark chocolate
Butter for the pan
```

`git restore` throws away the edits you have not staged. If you staged the file earlier, it goes back to that staged version. If not, as here, it goes back to the last commit, which is exactly what you want. But remember the other side: any edit you had not committed is gone for good, and git cannot bring it back, because it never saved it.

### 2. Take a file out of the staging area

Now you add a line to the tea recipe, and you also make a file of messy ideas that is not ready:

```bash
echo "Serve hot" >> tea.txt
echo "maybe pancakes with tea inside?" > ideas.txt
git add .
git status --short
```

```output
A  ideas.txt
M  tea.txt
```

`git add .` staged both: `A` means a new file was added to the staging area. Only `tea.txt` belongs in this commit:

```bash
git restore --staged ideas.txt
git status --short
```

```output
M  tea.txt
?? ideas.txt
```

`--staged` changes only the staging area. `ideas.txt` is untracked again, and its content is safe in the folder. Now commit the tea change, with a typo on purpose:

```bash
git commit -m "Serv tea hot"
```

```output
[main eef4378] Serv tea hot
 1 file changed, 1 insertion(+)
```

### 3. Fix the last commit

```bash
git commit --amend -m "Serve the tea hot"
```

```output
[main 49c48f0] Serve the tea hot
 Date: Sat Nov 21 12:00:00 2026 +0000
 1 file changed, 1 insertion(+)
```

`--amend` replaces the last commit with a new one: the same changes, plus whatever you staged since, with the new message. Look at the hash: it changed, because this is a different commit. That is fine while the commit lives only on your computer. If you forgot a file instead, stage it and run `git commit --amend --no-edit`, which keeps the message.

### 4. Undo a commit you have not shared

A bad idea, committed with confidence:

```bash
echo "1 pineapple" >> pancakes.txt
git commit -am "Add pineapple to pancakes"
git log --oneline -n 2
```

```output
[main 28ab5b7] Add pineapple to pancakes
 1 file changed, 1 insertion(+)
28ab5b7 (HEAD -> main) Add pineapple to pancakes
49c48f0 Serve the tea hot
```

On second thought, no. Move `main` back one commit:

```bash
git reset HEAD~1
```

```output
Unstaged changes after reset:
M	pancakes.txt
```

```bash
git log --oneline -n 1
git status --short
```

```output
49c48f0 (HEAD -> main) Serve the tea hot
 M pancakes.txt
?? ideas.txt
```

The commit is no longer in the history of `main`, but its change is still in the file, as an unstaged edit. That is the default kind of reset: it undoes the commit and keeps your work, so you can fix it and commit again. Here you want the pineapple gone, so restore the file:

```bash
git restore pancakes.txt
tail -n 1 pancakes.txt
```

```output
Butter for the pan
```

:::caution[reset --hard throws work away]
`git reset --soft HEAD~1` undoes the commit and leaves the changes staged. Plain `git reset HEAD~1`, as above, leaves them unstaged. `git reset --hard HEAD~1` undoes the commit and also wipes the changes from your files. Use `--hard` only when you are sure, and run `git status` before it: any uncommitted edit it wipes is gone for good.
:::

### 5. Undo a commit that is already shared

Imagine this commit was already sent to GitHub and a friend has it:

```bash
echo "1 spoon of chili" >> tea.txt
git commit -am "Add chili to the tea"
```

```output
[main b4d8bd3] Add chili to the tea
 1 file changed, 1 insertion(+)
```

The chili was a mistake, but you must not rewrite shared history. Revert it:

```bash
git revert --no-edit HEAD
```

```output
[main bfa72c4] Revert "Add chili to the tea"
 Date: Sat Nov 21 12:00:00 2026 +0000
 1 file changed, 1 deletion(-)
```

```bash
git log --oneline -n 3
tail -n 1 tea.txt
```

```output
bfa72c4 (HEAD -> main) Revert "Add chili to the tea"
b4d8bd3 Add chili to the tea
49c48f0 Serve the tea hot
Serve hot
```

`git revert` takes the commit you name, here `HEAD`, the newest one, and makes a new commit with the opposite change: the chili line is removed. Both commits stay in the history, so anyone who already has the chili commit can simply receive the revert on top. You can revert any older commit too, by its hash. Without `--no-edit`, git opens nano with the message `Revert "Add chili to the tea"`: save and quit to accept it.

Last, tidy up the ideas file, which you never needed to commit:

```bash
rm ideas.txt
git status
```

```output
On branch main
nothing to commit, working tree clean
```

## Exercise

Part 1. For each mistake, name the command that fits, without running it.

1. You edited `tea.txt` badly and want the last committed version back.
2. You ran `git add tea.txt` but do not want it in the next commit.
3. Your last commit, not shared yet, has the message `Fix sugr`.
4. A commit that you pushed last week turned out to be wrong.

Part 2. In `~/recipes`, the commit `Add butter for the pan` is shared already. Undo it the safe way, using its hash, and check that the butter line is gone.

<details>
<summary>Show the solution</summary>

Part 1:

1. `git restore tea.txt`
2. `git restore --staged tea.txt`
3. `git commit --amend -m "Fix sugar"`
4. `git revert` followed by the hash of that commit.

Part 2. First find the hash:

```bash
git log --oneline -n 6
```

```output
bfa72c4 (HEAD -> main) Revert "Add chili to the tea"
b4d8bd3 Add chili to the tea
49c48f0 Serve the tea hot
43b987a Merge branch 'honey-tea'
530ca24 Add butter for the pan
dc07099 Add honey to the tea
```

Then revert that commit. Use your own hash: yours is different.

```bash
git revert --no-edit 530ca24
tail -n 2 pancakes.txt
```

```output
[main 5093b60] Revert "Add butter for the pan"
 Date: Sat Nov 21 12:00:00 2026 +0000
 1 file changed, 1 deletion(-)
1 pinch of salt
50 g dark chocolate
```

The commit was not the newest one, and that does not matter: `git revert` undoes exactly the change of the commit you name, and leaves the later commits alone.

</details>

## Check yourself

**1. What is the difference between `git restore tea.txt` and `git restore --staged tea.txt`?**

<details>
<summary>Answer</summary>

`git restore tea.txt` throws away your unstaged edits: the file goes back to its last staged version, or to the last commit if nothing is staged. `git restore --staged tea.txt` only takes the file out of the staging area; its content in the folder does not change.

</details>

**2. What does `HEAD~1` mean?**

<details>
<summary>Answer</summary>

The commit just before the one you are on: the parent of HEAD.

</details>

**3. After `git reset HEAD~1`, where are the changes of the commit you undid?**

<details>
<summary>Answer</summary>

Still in your files, as unstaged edits. Plain `git reset` only moves the branch back. `--hard` would wipe the changes as well.

</details>

**4. Why should you revert, and not reset, a commit that you have already pushed?**

<details>
<summary>Answer</summary>

Other people may already have that commit. Reset rewrites history, so your history and theirs would no longer match. Revert keeps the history and adds a new commit that undoes the change, which everyone can simply receive.

</details>

**5. Which two commands of this lesson can destroy work that was never committed?**

<details>
<summary>Answer</summary>

`git restore file`, which throws away unstaged edits, and `git reset --hard`, which wipes uncommitted changes from your files.

</details>

## Common mistakes

- **Restoring before looking.** `git restore` cannot be undone. Run `git diff` first, and if part of the edit is worth keeping, copy it somewhere.
- **Amending or resetting shared commits.** Your history and everyone else's stop matching, and the next push is refused. Once a commit is shared, use `git revert`.
- **Using `--hard` out of habit.** Plain `git reset` is almost always enough, and it keeps your work. If a hard reset went wrong, `git reflog` lists where HEAD has been, so a lost commit can usually be found again by its hash. Uncommitted edits cannot.
- **Being surprised by `A` in the status.** It means a new file is staged, not an error. `git restore --staged` takes it back out.
- **Copying the folder "just in case".** It brings back the folder of copies from lesson 2.1. Commit first, then experiment; the commit is your safety copy.

## Key terms

- **Restore**: to throw away the unstaged edits of a file with `git restore`, or to take it out of the staging area with `git restore --staged`.
- **Amend**: to replace the last commit with a new one, with `git commit --amend`.
- **Reset**: to move the branch back to an older commit with `git reset`, so that the newer commits drop out of it.
- **Revert**: to make a new commit that undoes an older one, with `git revert`. The history keeps both.
- **`HEAD~1`**: the commit just before HEAD. `HEAD~2` is two commits back.
- **Reflog**: git's record of where HEAD has been, shown by `git reflog`.

## Go further

- [Pro Git: Undoing Things](https://git-scm.com/book/en/v2/Git-Basics-Undoing-Things): amend, unstage and restore, from the official book.
- [Pro Git: Reset Demystified](https://git-scm.com/book/en/v2/Git-Tools-Reset-Demystified): what `--soft`, plain and `--hard` reset change, explained step by step.
- [git-revert documentation](https://git-scm.com/docs/git-revert): the full reference, including how to revert several commits.
