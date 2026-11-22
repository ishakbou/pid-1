---
title: Users and permissions
description: Read the rwx permissions of files and directories, change them with chmod and chown, and use sudo with care.
lesson: "1.4"
time: 25 min
sidebar:
  order: 4
---

Why can you read `/etc/passwd` but not `/etc/shadow`? Why can't you delete a system file by accident, however clumsy you are? The answer sits in ten characters at the start of every `ls -l` line. Lesson 1.2 told you to skip them. Now you read them.

<!-- lab: run
mkdir -p ~/playground
-->

## Goal

After this lesson you can:

- Read from `ls -l` who may read, change and run a file.
- Change permissions with `chmod` and the owner with `chown`.
- Run one command as the administrator with `sudo`, and know when not to.

## Why it matters

Linux was built for many users at once, and that includes programs: a web server and a database each run under their own account. Permissions keep all of them out of each other's files. Many real security incidents are nothing more than a wrong permission: a private key that everybody can read, or a website folder that anybody can write to. And `Permission denied` is the second error you will meet most often, right after `No such file or directory`.

## The idea

A **user** is an account on the system: a name with a number behind it. A **group** is a named set of users. Every file belongs to exactly one user, called its **owner**, and to one group.

A **permission** is a right to do something with a file. There are three, and each has a letter:

| Letter | On a file | On a directory |
|---|---|---|
| `r` read | Look at the content | List the names inside |
| `w` write | Change the content | Create, delete and rename files inside |
| `x` execute | Run the file as a program | Enter the directory and reach what is inside |

Each file stores these three rights three times: once for the owner, once for the group, and once for everybody else. Picture a door with a short list on it. The first row says what the owner may do, the second row what members of the group may do, and the third row what all others may do. Linux finds the first row that fits you, and only that row counts.

Here is such a list, as `ls -l` prints it:

```text
-rw-r--r-- 1 sam sam 31 Nov 21 18:40 diary.txt
```

| Characters | Meaning |
|---|---|
| `-` | The type: `-` is a file, `d` is a directory |
| `rw-` | The owner may read and write, but not execute |
| `r--` | The group may only read |
| `r--` | Everybody else may only read |
| `sam sam` | The owner is the user `sam`, the group is the group `sam` |

A dash means "this right is missing". The order inside each block of three is always `r`, `w`, `x`.

One user is special. **root** is the administrator account, and permission checks do not apply to it. You do not log in as root. You stay an ordinary user and borrow root's power for one command at a time, with **sudo**.

## Try it

The outputs below come from a user called `sam`. Your screen shows your own username.

### 1. Find out who you are

```bash
id
```

```output
uid=1000(sam) gid=1000(sam) groups=1000(sam),27(sudo)
```

`uid` is your user number, `gid` is your main group, and `groups` lists every group you belong to. Ubuntu gives each user a group with the same name, so `sam` is in the group `sam`. The group `sudo` means that `sam` is allowed to use the `sudo` command, which you meet in step 6. Your list may be longer.

### 2. Read the permissions of a file

```bash
cd ~/playground
```

Create a file with `nano diary.txt`, type this one line, then save and leave.

```text title="diary.txt"
Day 4: I can read permissions.
```

```bash
ls -l diary.txt
```

```output
-rw-rw-r-- 1 sam sam 31 Nov 21 18:40 diary.txt
```

Read it block by block. The owner `sam` may read and write. The group `sam` may read and write. Everybody else may only read. On WSL you may see `-rw-r--r--` instead: the starting permissions depend on a system setting.

### 3. Take a permission away and give it back

```bash
chmod o-r diary.txt
ls -l diary.txt
```

```output
-rw-rw---- 1 sam sam 31 Nov 21 18:40 diary.txt
```

`chmod` means "change mode". Its first argument has three parts: who (`u` for the owner, `g` for the group, `o` for others, `a` for all three), then `+` to add or `-` to remove, then the right. So `o-r` reads "others lose read".

```bash
chmod u-r diary.txt
cat diary.txt
```

```output
cat: diary.txt: Permission denied
```

You own this file, and Linux still refuses. You fit the owner row, so only the owner row counts, and it no longer has an `r`. But the owner is always allowed to change the permissions back:

```bash
chmod u+r diary.txt
cat diary.txt
```

```output
Day 4: I can read permissions.
```

### 4. Set permissions with numbers

```bash
chmod 600 diary.txt
ls -l diary.txt
```

```output
-rw------- 1 sam sam 31 Nov 21 18:40 diary.txt
```

Letters change one right at a time. Numbers set all nine at once. Each right has a value: `r` is 4, `w` is 2, `x` is 1. Add them up for each block. `rw-` is 4 + 2 = 6, and `---` is 0. So `600` means "the owner reads and writes, nobody else gets anything".

```bash
chmod 644 diary.txt
ls -l diary.txt
```

```output
-rw-r--r-- 1 sam sam 31 Nov 21 18:40 diary.txt
```

Four numbers cover most of real life:

| Number | Permissions | Typical use |
|---|---|---|
| `644` | `rw-r--r--` | A normal file: you edit it, others may read it |
| `600` | `rw-------` | A private file, such as a key or a file with a password in it |
| `755` | `rwxr-xr-x` | A program or a directory that others may use |
| `700` | `rwx------` | A private directory |

### 5. Lock a directory and open it again

```bash
mkdir vault
touch vault/key.txt
ls -ld vault
```

```output
drwxrwxr-x 2 sam sam 4096 Nov 21 18:40 vault
```

The `-d` option makes `ls` describe the directory itself, not its content. The line starts with `d`, and the owner has `rwx`.

```bash
chmod u-x vault
cat vault/key.txt
```

```output
cat: vault/key.txt: Permission denied
```

The file `key.txt` did not change at all. What changed is the directory: without `x` on `vault` you cannot pass through it, so you cannot reach anything inside. Put the right back:

```bash
chmod u+x vault
cat vault/key.txt
```

This time `cat` prints nothing, because the file is empty, and there is no error. On a file, `x` means something else: "this file may be run as a program". You will use `chmod +x` for that in lessons 1.8 and 1.9.

### 6. Borrow root's power with sudo

```bash
ls -l /etc/shadow
```

```output
-rw-r----- 1 root shadow 839 Nov 21 18:32 /etc/shadow
```

`/etc/shadow` stores the passwords of all users, not as plain text but as hashes, a one-way form that Module 10 explains. Look at the list on its door: the owner `root` may read and write, the group `shadow` may read, and everybody else gets three dashes.

```bash
cat /etc/shadow
```

```output
cat: /etc/shadow: Permission denied
```

You are "everybody else" here, so the answer is no. Now compare these two commands:

```bash
whoami
sudo whoami
```

```output
sam
root
```

`sudo` runs the command that follows it as root. The first time, it asks for your own password. Nothing appears on the screen while you type it, not even stars. That is normal: type it and press Enter. After that, `sudo` does not ask again for a few minutes.

```bash
sudo wc -l /etc/shadow
```

```output
33 /etc/shadow
```

With `sudo` in front, the same file opens. Root is not stopped by permissions.

:::caution[sudo removes the safety net]
Permissions protect the system from your mistakes. With `sudo`, a wrong `rm -r` can delete anything. Try a command without `sudo` first. If it fails with `Permission denied`, ask yourself why before you add `sudo`. And never run a `sudo` command from a website if you cannot explain every word of it.
:::

### 7. Change the owner

```bash
sudo touch report.txt
ls -l report.txt
```

```output
-rw-r--r-- 1 root root 0 Nov 21 18:40 report.txt
```

Root created this file, so root owns it. It sits in your own directory, but you may only read it. This happens in real life when you run an editor with `sudo` by habit. The fix is to give the file back. Write your own username in place of `sam`:

```bash
sudo chown sam:sam report.txt
ls -l report.txt
```

```output
-rw-r--r-- 1 sam sam 0 Nov 21 18:40 report.txt
```

`chown` means "change owner". The part before the colon is the new owner, and the part after it is the new group. It needs `sudo`, because an ordinary user is not allowed to hand files to someone else.

## Exercise

Work in `~/playground`.

1. Create an empty file `plan.txt` and a directory `private`.
2. With numbers, set `plan.txt` so that the owner can read and write, the group can only read, and others can do nothing.
3. With numbers, set `private` so that the owner can do everything and nobody else can do anything.
4. Show the permissions of both with one command.
5. With letters, take the write permission away from everybody, including yourself, on `plan.txt`.
6. Which number matches the permissions that `plan.txt` has now?

<details>
<summary>Show the solution</summary>

```bash
cd ~/playground
touch plan.txt
mkdir private
chmod 640 plan.txt
chmod 700 private
ls -ld plan.txt private
```

```output
-rw-r----- 1 sam sam    0 Nov 21 18:40 plan.txt
drwx------ 2 sam sam 4096 Nov 21 18:40 private
```

`640` is `rw-` (4 + 2), then `r--` (4), then `---` (0). `700` is `rwx` (4 + 2 + 1) for the owner and nothing for the rest.

```bash
chmod a-w plan.txt
ls -l plan.txt
```

```output
-r--r----- 1 sam sam 0 Nov 21 18:40 plan.txt
```

`a-w` removes write for all three blocks at once. The result `r--r-----` is 4, then 4, then 0: the number is `440`.

</details>

## Check yourself

**1. A file shows `-rwxr-x---`. What may members of its group do? What may everybody else do?**

<details>
<summary>Answer</summary>

The group block is `r-x`: members of the group may read the file and run it, but not change it. The last block is `---`: everybody else may do nothing.

</details>

**2. Which number matches `rw-r--r--`?**

<details>
<summary>Answer</summary>

`644`. The owner has `rw-`, which is 4 + 2 = 6. The group and the others each have `r--`, which is 4.

</details>

**3. You own a file with the permissions `----rw-rw-`. Can you read it with `cat`?**

<details>
<summary>Answer</summary>

No. You are the owner, so only the owner block counts, and it is `---`. It does not matter that the other blocks allow more. As the owner you can fix it with `chmod u+r`.

</details>

**4. What does `x` mean on a directory?**

<details>
<summary>Answer</summary>

The right to enter the directory and to reach the files inside it. Without `x` on a directory, you cannot open anything in it, whatever the permissions of the files themselves are.

</details>

**5. What does `sudo` do, and what does it ask you for?**

<details>
<summary>Answer</summary>

It runs the command that follows it as root, the administrator. It asks for your own password, not for a root password.

</details>

## Lesson map

```mindmap
Users and permissions
  Who
    owner (u)
    group (g)
    others (o)
  What
    r: read
    w: write
    x: execute
  Change
    chmod with letters
    chmod with numbers
    chown
  Administrator
    root
    sudo
```

## Common mistakes

- **Putting `sudo` in front of everything.** It hides the real problem and makes every typo dangerous. Use it only when a task truly needs the administrator, such as installing software.
- **Running `chmod 777` to make an error go away.** `777` lets every user and every program on the machine change and run the file. Find out which right is missing and add only that one.
- **Thinking the password prompt is frozen.** `sudo` shows nothing while you type your password. Keep typing and press Enter.
- **Creating files with `sudo` in your home directory.** They belong to root, and later you cannot change them. Give them back with `sudo chown`, as in step 7.
- **Not checking after `chmod`.** It is easy to type `o` when you meant `g`. Run `ls -l` after every change and read the result.

## Key terms

- **User**: an account on the system, with a name and a number (the `uid`).
- **Group**: a named set of users. A file can give rights to a whole group at once.
- **Owner**: the user a file belongs to. The owner may change the file's permissions.
- **Permission**: the right to read (`r`), write (`w`) or execute (`x`) a file or directory.
- **root**: the administrator account. Permission checks do not apply to it.
- **sudo**: a command that runs one other command as root, after asking for your password.

## Go further

- [GNU Coreutils manual: file permissions](https://www.gnu.org/software/coreutils/manual/html_node/File-permissions.html): the official reference for the letters and numbers that `chmod` accepts.
- [Ubuntu manual page: sudo](https://manpages.ubuntu.com/manpages/noble/man8/sudo.8.html): the official reference for `sudo`, including how long it remembers your password.
- [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/): several early levels are solved by reading file permissions and owners.
