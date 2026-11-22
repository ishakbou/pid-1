---
title: Backups and recovery
description: Plan backups with the 3-2-1 rule, make and check them with tar, sha256sum and SQLite, see why a sync is not a backup, and prove that a restore works before you need it.
lesson: "13.5"
time: 20 min
sidebar:
  order: 5
---

<!-- lab: run
printf '.headers on\n.mode table\n' > ~/.sqliterc
-->

A student's laptop is stolen from a train a week before her thesis is due. She is calm at first: she has a backup, on a USB stick. The USB stick was in the laptop bag. Every backup plan fails in one of a few boring ways, and this lesson goes through them one by one, so that yours does not.

## Goal

After this lesson you can:

- Plan backups with the 3-2-1 rule, and say how much data you could lose and how long a restore would take.
- Make a backup with `tar`, back up an SQLite database safely, and record checksums.
- Test a restore, and explain why a sync or a copy on the same disk is not a backup.

## Why it matters

Disks die, laptops get stolen, and people run `rm -r` in the wrong folder. Ransomware, malware that encrypts files and asks for money (lesson 9.6), is now one of the most common incidents for companies, and a good backup turns it from a disaster into a bad week. In the incident response of lesson 13.4, recovery often means "restore from a backup made before the incident". That only works if the backup exists, is complete, and was not reachable by the attacker.

## The idea

The **3-2-1 rule** is the classic plan: keep **3** copies of your data (the original and two backups), on **2** different devices or kinds of storage, with **1** of them **off-site**, meaning in another building or in the cloud. A fire, a thief or a flood takes one place, never all three. Many teams now add one more rule: one copy is **offline** (unplugged, or stored so that it cannot be changed), because ransomware encrypts every backup it can reach from the infected machine.

Two numbers say how good a plan is. The **recovery point objective** (RPO) is how much data you can afford to lose, measured in time: with a backup every night, you can lose up to a day of work. The **recovery time objective** (RTO) is how long you can afford to be down while you restore. A plan with a nightly backup on a USB drive in a drawer has an RPO of one day and an RTO of perhaps an hour.

A backup is like the spare key to your flat. A spare key on the same key ring is useless; one at a friend's place across town is useful; and you only know it works if you have tried it in the lock. That last part is the one people skip. A **restore test** means restoring a backup somewhere safe and checking that everything is there and readable. Until it passes, you have a file that you hope is a backup.

What is not a backup:

| Looks like a backup | Why it is not enough |
|---|---|
| A copy on the same disk | The disk dies, and takes both |
| A sync folder (cloud drive, `rsync --delete`) | It copies your deletions and the ransomware's encryption too, within seconds |
| A git repository on GitHub | It holds only committed files; your database and secrets are ignored on purpose |
| A snapshot of a virtual machine | It usually lives on the same host, and goes when the host goes |

## Try it

The outputs come from a lab machine with the user `sam`. Your dates and times will differ.

### 1. Create something worth saving

```bash
mkdir -p ~/backupdemo/project/notes ~/backupdemo/backups
cd ~/backupdemo
echo "Ideas for the lab" > project/notes/ideas.txt
echo "Renew the domain" > project/notes/todo.txt
sqlite3 project/notes.db "CREATE TABLE notes (id INTEGER PRIMARY KEY, title TEXT);
INSERT INTO notes (title) VALUES ('Lab ideas'), ('Ports to remember');"
sqlite3 project/notes.db "SELECT COUNT(*) FROM notes"
```

```output
+----------+
| COUNT(*) |
+----------+
| 2        |
+----------+
```

A small project: two text files and a database with two rows, as in Module 7. The tables in the outputs come from the `~/.sqliterc` you made in Module 7; without it, `sqlite3` prints only the values.

### 2. Back up the database safely

```bash
stamp=$(date +%F_%H%M%S)
sqlite3 project/notes.db ".backup backups/notes-$stamp.db"
sqlite3 backups/notes-$stamp.db "PRAGMA integrity_check"
```

```output
+-----------------+
| integrity_check |
+-----------------+
| ok              |
+-----------------+
```

`stamp` holds the date and time, as in the Module 1 backup script, so each backup gets its own name. Why not just `cp` the database? If a program writes to it at that moment, `cp` can copy half of an old state and half of a new one, and the copy is broken. `.backup` asks SQLite itself to make a consistent copy, even while the app is running. `PRAGMA integrity_check` then asks SQLite to check the whole copy; `ok` means it is sound.

### 3. Back up the files as one archive

```bash
tar -czf backups/project-$stamp.tar.gz --exclude=notes.db project
tar -tzf backups/project-$stamp.tar.gz
```

```output
project/
project/notes/
project/notes/todo.txt
project/notes/ideas.txt
```

`tar` packs a folder into one **archive** file: `-c` creates it, `-z` compresses it with gzip, and `-f` gives its name. `--exclude` leaves out the database, which already has its own safe copy. `-t` lists what is inside without unpacking. One file is easier to copy to another device than a whole folder tree.

### 4. Record checksums

```bash
cd backups
sha256sum * > SHA256SUMS
sha256sum -c SHA256SUMS | cut -d: -f2
cd ..
```

```output
 OK
 OK
```

Two backup files, two `OK`s. Copy `SHA256SUMS` along with the backups. Months later, on another device, `sha256sum -c` tells you whether a backup was damaged on the way or on the shelf: a disk that slowly fails does not warn you.

### 5. Test the restore

```bash
mkdir -p restore-test
tar -xzf backups/project-$stamp.tar.gz -C restore-test
diff -r project/notes restore-test/project/notes && echo "Files: restore test passed."
sqlite3 backups/notes-$stamp.db "SELECT title FROM notes"
```

```output
Files: restore test passed.
+-------------------+
|       title       |
+-------------------+
| Lab ideas         |
| Ports to remember |
+-------------------+
```

`-x` extracts, and `-C` extracts into another folder, so the test cannot overwrite your real files. `diff -r` compares two folders file by file and prints nothing when they are identical. And the database copy answers a real query. Now you have a backup.

### 6. See why a sync is not a backup

Many people use a mirror: a folder kept identical to the original. `rsync -a` copies a folder, and `--delete` also deletes files from the mirror that are gone from the original. If `rsync` is missing on your machine, `sudo apt install rsync` adds it.

```bash
rsync -a --delete project/ mirror/
rm project/notes/todo.txt
rsync -a --delete project/ mirror/
ls mirror/notes
```

```output
ideas.txt
```

The trailing `/` on `project/` means "the contents of project". You deleted `todo.txt` by mistake, the next sync ran, and the mirror deleted it too. If ransomware had encrypted the file instead, the mirror would now hold the encrypted version. The archive from step 3 does not care:

```bash
tar -tzf backups/project-$stamp.tar.gz | grep todo
```

```output
project/notes/todo.txt
```

A backup keeps old versions; a mirror only keeps the latest state, good or bad.

### 7. Recover from a disaster

```bash
rm -r project
tar -xzf backups/project-$stamp.tar.gz
sqlite3 backups/notes-$stamp.db ".backup project/notes.db"
ls project/notes
sqlite3 project/notes.db "SELECT COUNT(*) FROM notes"
```

```output
ideas.txt  todo.txt
+----------+
| COUNT(*) |
+----------+
| 2        |
+----------+
```

The whole project is gone, and back in seconds, including `todo.txt`, which the mirror lost. `.backup` works in both directions: here it copies the backup into a new `project/notes.db`.

### 8. Put a copy somewhere else

<!-- lab: skip -->
```bash
cp backups/* /media/$USER/USB-DRIVE/
```

Everything so far lives on one disk, so it protects you from mistakes, not from a dead disk or a thief. Ubuntu mounts a USB drive under `/media/` followed by your username and the drive's name; `ls /media/$USER` shows the name of yours. Unplug the drive afterwards and keep it somewhere else: that is your off-site, offline copy. A cloud storage service works too, if you encrypt the files before they leave your machine.

## Exercise

Write `check-restore.sh`, a script that tests the newest file archive in `backups/` automatically:

1. Find the newest `project-*.tar.gz`. (`ls -t` sorts by time, newest first.)
2. Extract it into a new temporary folder. (`mktemp -d` creates one and prints its name.)
3. Compare it with `project/notes`, and print `restore test OK` or `restore test FAILED`.
4. Delete the temporary folder.

Run it once as it is, then change `project/notes/ideas.txt` and run it again.

<details>
<summary>Show the solution</summary>

```bash title="check-restore.sh"
#!/bin/bash
# check-restore.sh: restore the newest archive into a temporary folder and compare it.
newest=$(ls -t backups/project-*.tar.gz | head -n 1)
tmp=$(mktemp -d)
tar -xzf "$newest" -C "$tmp"
if diff -r -q project/notes "$tmp/project/notes" > /dev/null; then
  echo "restore test OK"
else
  echo "restore test FAILED"
fi
rm -r "$tmp"
```

```bash
bash check-restore.sh
echo "One more idea" >> project/notes/ideas.txt
bash check-restore.sh
```

```output
restore test OK
restore test FAILED
```

`diff -q` only says whether files differ, and `> /dev/null` hides even that; the `if` reads only the exit status. The second run fails because the live file changed after the backup. That is not a broken backup, only an old one, but the script cannot tell the difference: it tells you that the two are not the same, and you decide. A real check would compare the archive with its own checksum, then with the live data, and alert you if the newest backup is older than your RPO allows.

</details>

## Check yourself

**1. What does the 3-2-1 rule ask for?**

<details>
<summary>Answer</summary>

Three copies of the data, on two different devices or kinds of storage, with one copy off-site.

</details>

**2. You back up every Sunday night. On Saturday afternoon your disk dies. What is your RPO in practice, and how much work did you lose?**

<details>
<summary>Answer</summary>

The RPO of a weekly backup is a week. Here you lose almost six days of work: everything since Sunday night.

</details>

**3. Why is `sqlite3 notes.db ".backup copy.db"` safer than `cp notes.db copy.db`?**

<details>
<summary>Answer</summary>

If a program writes to the database during `cp`, the copy can mix old and new parts and be broken. `.backup` asks SQLite to make a consistent copy, even while the database is in use.

</details>

**4. Your files sync to a cloud drive every minute. Ransomware encrypts them. Why does the sync not save you?**

<details>
<summary>Answer</summary>

The sync copies the encrypted files to the cloud within a minute, replacing the good ones. A sync only keeps the latest state. You need a backup that keeps old versions, ideally one that the infected machine cannot reach.

</details>

**5. When is a backup really a backup?**

<details>
<summary>Answer</summary>

When you have restored it once and checked that the data is complete and readable, as in step 5. Until then, it is a file that you hope is a backup.

</details>

## Common mistakes

- **Never testing a restore.** Archives can be empty, incomplete or damaged, and you find out on the worst day. Test a restore after the first backup and then regularly.
- **Keeping every copy in one place.** A backup on the same disk, or in the same bag, dies with the original. Get one copy off-site.
- **Leaving the backup drive plugged in.** Ransomware encrypts every drive it can see. Unplug the offline copy after each backup.
- **Copying a database file while it is in use.** Use the database's own backup tool, such as `.backup` for SQLite.
- **Backing up only the code.** Code is usually on GitHub already. The data, the database and the settings are what you cannot get back, and git ignores them on purpose.

## Key terms

- **3-2-1 rule**: keep three copies of your data, on two different devices or kinds of storage, with one copy off-site.
- **Off-site copy**: a backup kept in another place than the original, such as another building or a cloud service.
- **Offline copy**: a backup that is not connected to any computer, so that malware cannot reach it.
- **Recovery point objective (RPO)**: how much data, measured in time, you can afford to lose.
- **Recovery time objective (RTO)**: how long you can afford to wait while you restore.
- **Restore test**: restoring a backup to a safe place and checking that the data is complete and readable.
- **Archive**: one file that holds many files and folders, such as a `.tar.gz` made by `tar`.

## Go further

- [CISA: Stop Ransomware Guide](https://www.cisa.gov/stopransomware/ransomware-guide): what to do before and during a ransomware attack, including how to keep backups offline.
- [SQLite: Online Backup API](https://www.sqlite.org/backup.html): how SQLite makes a consistent copy of a database that is in use.
- [GNU tar manual](https://www.gnu.org/software/tar/manual/): the full reference for creating, listing and extracting archives.
