---
title: "Project step: mylab on GitHub"
description: Put mylab under git with a .gitignore that keeps logs and secrets out, write its first README, and publish the repository on GitHub.
lesson: "2.8"
time: 20 min
sidebar:
  order: 8
---

<!-- lab: run
sudo apt-get install -y tree > /dev/null 2>&1
rm -f ~/.gitconfig
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
git config --global core.editor nano
git config --global pull.rebase false
export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=log.decorate GIT_CONFIG_VALUE_0=short
export GIT_AUTHOR_DATE="2026-11-21T16:00:00+0000" GIT_COMMITTER_DATE="2026-11-21T16:00:00+0000"
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs
cat > ~/mylab/scripts/sysinfo.sh <<'EOF'
#!/bin/bash
# sysinfo.sh: print a short report about this machine
# Part of mylab. Works from any directory.

echo "System report, $(date '+%Y-%m-%d %H:%M')"
echo "User:       $(whoami)"
echo "Computer:   $(hostname)"
echo "System:     $(grep PRETTY_NAME /etc/os-release | cut -d '"' -f 2)"
echo "Kernel:     $(uname -r)"
echo "Up for:     $(uptime -p)"
echo "Free disk:  $(df -h --output=avail "$HOME" | tail -n 1 | tr -d ' ')"
echo "Processes:  $(ps -e --no-headers | wc -l)"
EOF
cat > ~/mylab/scripts/backup.sh <<'EOF'
#!/bin/bash
# backup.sh: copy the important folders of mylab into ~/backups
# Each run makes a new folder named after the date and time.

source_dir="$HOME/mylab"
stamp=$(date '+%Y-%m-%d_%H%M%S')
target="$HOME/backups/mylab-$stamp"

if [ ! -d "$source_dir" ]; then
  echo "Nothing to back up: $source_dir does not exist."
  exit 1
fi

mkdir -p "$target"
for folder in scripts notes data; do
  cp -r "$source_dir/$folder" "$target/"
  echo "Copied $folder"
done
echo "Backup saved in $target"
EOF
chmod +x ~/mylab/scripts/sysinfo.sh ~/mylab/scripts/backup.sh
~/mylab/scripts/sysinfo.sh > ~/mylab/logs/sysinfo.txt
-->

Look at `~/mylab` as it stands after Module 1: two scripts, four folders and a report. If you broke `backup.sh` tomorrow, you could not get yesterday's version back, and nobody but you knows the project exists. Today it gets a memory and a public address. From now on, every module ends with a commit, and the history of `mylab` becomes the story of your course.

## Goal

After this lesson you can:

- Put `mylab` under git, with a `.gitignore` that keeps logs and secrets out.
- Write a first `README.md` for it.
- Publish `mylab` on GitHub, and check what a fresh copy contains.

## Why it matters

A public repository is the first thing many employers and teachers look at, and a tidy `mylab` with a clear history shows more than any claim on a CV. GitHub also answers a question from the Module 1 project step: a backup must live somewhere else than the files it protects. A repository pushed to GitHub is exactly that, with every old version included. And the habits you set today, ignoring logs and secrets from the first commit, are the ones that keep real projects out of trouble.

## The idea

Not everything in `mylab` belongs in git. The rule of thumb: commit what you wrote, and leave out what a program makes or what is secret.

| Item | In git? | Why |
|---|---|---|
| `scripts/` | Yes | You wrote them, and they are the point of the project |
| `README.md` | Yes | It explains the project to every visitor |
| `.gitignore` | Yes | Everyone who clones the project gets the same rules |
| `logs/` | No | Scripts write it again at any time, and it holds details about your machine |
| `.env`, `*.tmp` | No | Secrets and scratch files, ready for later modules |

`notes/` and `data/` are still empty, and git does not track empty folders at all: it tracks files, and a folder appears in the repository once it holds one. Module 3 puts a file into `data/`, and the exercise of this lesson puts one into `notes/`.

A **README** is the file that introduces a project: what it is, what is in it and how to use it. GitHub shows the file `README.md` right under the list of files on the repository's front page. The `.md` means it is written in **Markdown**, a plain-text format with a few signs for layout: a line that starts with `#` is a heading, `##` a smaller heading, a line that starts with `-` is a list item, and text between backticks is shown as code. In Module 16 you rewrite this README into a proper portfolio piece; today it only needs to be clear.

## Try it

The outputs come from a user called `sam`. Your names, hashes and numbers are different. If your `mylab` is missing, the [Module 1 project step](../linux/project/) builds it.

### 1. Look at the starting point

```bash
cd ~/mylab
tree
```

```output
.
├── data
├── logs
│   └── sysinfo.txt
├── notes
└── scripts
    ├── backup.sh
    └── sysinfo.sh

5 directories, 3 files
```

The same tree as at the end of Module 1. If you did that exercise, `sysinfo.sh` has one more line; that changes nothing here.

### 2. Make it a repository

```bash
git init
git status --short
```

```output
Initialized empty Git repository in /home/sam/mylab/.git/
?? logs/
?? scripts/
```

Check the first line: the repository is `/home/sam/mylab/.git`, not your home directory. `git status --short` lists an untracked folder as one line ending in `/`. `notes/` and `data/` are missing from the list because they are empty.

### 3. Write the .gitignore first

Before the first `git add`, decide what stays out. Create `.gitignore` in `~/mylab`:

```text title=".gitignore"
# Secrets: never commit them
.env
# Temporary files
*.tmp
# Reports and logs that scripts write
logs/
```

```bash
git status --short
```

```output
?? .gitignore
?? scripts/
```

`logs/` has left the list. `.env` and `*.tmp` match nothing yet; they are there so that a secret or a scratch file added later is ignored from its first day.

### 4. Write the README

Create `README.md` in `~/mylab`. Use your own words if you like; keep the first lines as they are:

```markdown title="README.md"
# mylab

My lab for the PID 1 course.

## What is in it

- `scripts/sysinfo.sh`: prints a short report about this machine.
- `scripts/backup.sh`: copies the important folders of mylab into `~/backups`.

## How to use it

Run `scripts/sysinfo.sh` from the mylab folder to see the report.
Run `scripts/backup.sh` to make a dated backup.

The project grows with each module of the course.
```

### 5. Make the first commit

```bash
git add .gitignore README.md scripts
git status --short
```

```output
A  .gitignore
A  README.md
A  scripts/backup.sh
A  scripts/sysinfo.sh
```

Four files staged, named on purpose instead of with `git add .`. Naming a folder, such as `scripts`, stages everything inside it.

```bash
git commit -m "Start mylab with scripts, README and .gitignore"
```

```output
[main (root-commit) 442e6d1] Start mylab with scripts, README and .gitignore
 4 files changed, 52 insertions(+)
 create mode 100644 .gitignore
 create mode 100644 README.md
 create mode 100755 scripts/backup.sh
 create mode 100755 scripts/sysinfo.sh
```

Look at the modes. `100644` is an ordinary file, and `100755` an executable one: git saved the `chmod +x` from Module 1, so the scripts stay runnable in every copy.

### 6. Check that the logs stay out

Write a fresh report, as you will often do, and ask git:

```bash
scripts/sysinfo.sh > logs/sysinfo.txt
git status
git check-ignore -v logs/sysinfo.txt
```

```output
On branch main
nothing to commit, working tree clean
.gitignore:6:logs/	logs/sysinfo.txt
```

The report changed, and git does not care: the working tree is clean, and line 6 of `.gitignore` is the reason.

### 7. Publish it on GitHub

On GitHub, create a new repository called `mylab`, empty, as in lesson 2.5. Public is a good choice: it shows your work, and nothing in it is secret. Private works just as well if you prefer. Then connect and push, with your own username:

<!-- lab: skip -->
```bash
git remote add origin git@github.com:yourname/mylab.git
git push -u origin main
```

Open `https://github.com/yourname/mylab`. Below the list of files, GitHub shows your README with real headings and a list. Above the list of files, a link shows the number of commits. Click it, and you find your commit with its message.

### 8. See what a fresh copy gets

Someone who clones `mylab` gets the repository, not your folder. You can see exactly what that means without GitHub, because `git clone` also works from a folder on your own computer:

```bash
git clone ~/mylab /tmp/mylab-copy
ls -a /tmp/mylab-copy
```

```output
Cloning into '/tmp/mylab-copy'...
done.
.  ..  .git  .gitignore  README.md  scripts
```

No `logs`, no `notes`, no `data`: the first is ignored, the other two are empty. On a new computer, the scripts need those folders, so the first thing to do after a clone is:

```bash
cd /tmp/mylab-copy
mkdir -p notes data logs
ls -d notes data logs
```

```output
data  logs  notes
```

`ls -d` lists the folders themselves instead of what is inside them: all three exist now.

That copy has done its job. Delete it and go back:

```bash
cd ~/mylab
rm -rf /tmp/mylab-copy
```

## Exercise

1. In `~/mylab`, create `notes/git.md` with a heading `# Git commands I use` and a list of the five git commands you used most in this module, one per line, each with a few words about what it does.
2. Commit it with a good message.
3. Push it to GitHub.
4. List the files git tracks with `git ls-files`, and check that `notes/git.md` is among them and `logs/sysinfo.txt` is not.

<details>
<summary>Show the solution</summary>

Your list may differ. Here is one:

```markdown title="notes/git.md"
# Git commands I use

- `git status`: what changed, and what is staged.
- `git add`: stage changes for the next commit.
- `git commit -m`: save the staged changes with a message.
- `git log --oneline`: the history, one line per commit.
- `git push`: send my commits to GitHub.
```

```bash
git add notes/git.md
git commit -m "Add my git notes"
```

```output
[main cac8d16] Add my git notes
 1 file changed, 7 insertions(+)
 create mode 100644 notes/git.md
```

<!-- lab: skip -->
```bash
git push
```

```bash
git ls-files
```

```output
.gitignore
README.md
notes/git.md
scripts/backup.sh
scripts/sysinfo.sh
```

`git ls-files` lists every file in the repository. `notes/git.md` is there, so `notes/` now exists in every clone too. `logs/sysinfo.txt` is not, because it is ignored.

</details>

## Check yourself

**1. Right after `git init`, why does `git status --short` not list `notes/`?**

<details>
<summary>Answer</summary>

`notes/` is empty, and git tracks files, not folders. An empty folder never shows up in git.

</details>

**2. Why is `logs/` in the `.gitignore` of `mylab`?**

<details>
<summary>Answer</summary>

Its files are written by scripts and can be made again at any time, and they hold details about your machine, such as its name. Neither is worth putting in a public history.

</details>

**3. The commit output shows `create mode 100755 scripts/backup.sh`. What does `100755` tell you?**

<details>
<summary>Answer</summary>

That git saved the file as executable, the `chmod +x` from Module 1. Every clone gets a script that can run right away.

</details>

**4. Where does GitHub show `README.md`?**

<details>
<summary>Answer</summary>

On the front page of the repository, below the list of files, with the Markdown shown as real headings and lists.

</details>

**5. You cloned `mylab` on a new computer, and `backup.sh` complains that `notes` does not exist. Is the repository broken?**

<details>
<summary>Answer</summary>

No. Empty and ignored folders are not in git, so a fresh clone does not have them. Create them once with `mkdir -p notes data logs`.

</details>

## Common mistakes

- **Running `git init` in your home directory.** Then everything in your home is one big repository. Check that `git init` says `/home/sam/mylab/.git/`, and if it does not, remove only the `.git` it made, as in lesson 2.2.
- **Writing `.gitignore` after the first commit.** If that commit used `git add .`, `logs/sysinfo.txt` is tracked by then, and ignoring it does nothing. Untrack it with `git rm --cached -r logs`, as in lesson 2.6, and commit.
- **Calling the file `readme.txt`.** GitHub shows it, but as plain text without headings. Name it `README.md` and use Markdown.
- **Pushing with your private email.** Check `git config user.email` before the first push, as lesson 2.1 suggests. Commits keep the email they were made with.
- **Creating the GitHub repository with a README.** Then the first push is refused, because GitHub has a commit you do not. Create it empty, or pull first.

## Key terms

- **README**: the file that introduces a project: what it is, what it holds and how to use it. GitHub shows `README.md` on the repository's front page.
- **Markdown**: a plain-text format that uses a few signs for layout, such as `#` for a heading and `-` for a list item. Files in Markdown end in `.md`.

## Go further

- [GitHub Docs: About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes): where GitHub looks for a README and how it shows it.
- [GitHub Docs: Basic writing and formatting syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax): the Markdown that GitHub understands, with examples.
- [Pro Git: Getting a Git Repository](https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository): `git init` on an existing folder and `git clone`, the two ways to start.
