---
title: "Project step: look inside mylab"
description: Use file, hexdump and /proc to see your own mylab files and processes the way the machine sees them, fix a Windows line ending, and write down what you found.
lesson: "5.8"
time: 25 min
sidebar:
  order: 8
---

<!-- lab: run
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs ~/mylab/tools
cd ~/mylab
printf '# mylab\n\nMy lab for the PID 1 course.\n' > README.md
printf '.venv/\n__pycache__/\n' > .gitignore
cat > scripts/sysinfo.sh <<'EOF'
#!/bin/bash
# sysinfo.sh: print a short report about this machine
# Part of mylab. Works from any directory.

echo "System report, $(date '+%Y-%m-%d %H:%M')"
echo "User:       $(whoami)"
echo "Computer:   $(hostname)"
EOF
cat > scripts/backup.sh <<'EOF'
#!/bin/bash
# backup.sh: copy the important folders of mylab into ~/backups
mkdir -p "$HOME/backups"
EOF
chmod +x scripts/sysinfo.sh scripts/backup.sh
cat > tools/loganalyzer.py <<'PYEOF'
#!/usr/bin/env python3
"""Report the busiest IP addresses and the errors in a web server access log."""
import argparse
import sys
from collections import Counter


def parse_line(line):
    """Turn one access log line into a dict, or return None if it is broken."""
    parts = line.split()
    if len(parts) != 10:
        return None
    try:
        status = int(parts[8])
    except ValueError:
        return None
    return {
        "ip": parts[0],
        "method": parts[5].strip('"'),
        "path": parts[6],
        "status": status,
    }


def analyze(lines):
    """Count requests per IP and collect error entries (status 400 and above)."""
    ips = Counter()
    errors = []
    broken = 0
    for line in lines:
        if not line.strip():
            continue
        entry = parse_line(line)
        if entry is None:
            broken += 1
            continue
        ips[entry["ip"]] += 1
        if entry["status"] >= 400:
            errors.append(entry)
    return ips, errors, broken


def failed_logins(errors):
    """Count the failed logins (401 on /login) per IP address."""
    failed = Counter()
    for e in errors:
        if e["status"] == 401 and e["path"] == "/login":
            failed[e["ip"]] += 1
    return failed


def load_blocklist(path):
    """Read IP addresses from a file, one per line. Skip blank lines and # comments."""
    blocked = set()
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                blocked.add(line)
    return blocked


def blocked_ips(ips, blocklist):
    """Return a Counter of the counted IP addresses that are on the blocklist."""
    found = Counter()
    for ip, count in ips.items():
        if ip in blocklist:
            found[ip] = count
    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("logfile", help="the access log to read")
    parser.add_argument("--top", type=int, default=3,
                        help="how many IP addresses to show (default: 3)")
    parser.add_argument("--blocklist",
                        help="a file of IP addresses to flag, one per line")
    args = parser.parse_args()

    try:
        with open(args.logfile, encoding="utf-8") as f:
            ips, errors, broken = analyze(f)
        blocklist = set()
        if args.blocklist:
            blocklist = load_blocklist(args.blocklist)
    except FileNotFoundError as error:
        print(f"error: {error.filename} not found", file=sys.stderr)
        sys.exit(1)

    print(f"Requests: {sum(ips.values())}, broken lines: {broken}")
    print(f"Top {args.top} IP addresses:")
    for ip, count in ips.most_common(args.top):
        print(f"  {ip:15} {count:3}")
    print(f"Errors: {len(errors)}")
    for e in errors:
        print(f"  {e['status']} {e['method']:4} {e['path']:12} from {e['ip']}")
    for ip, count in failed_logins(errors).most_common():
        print(f"Failed logins: {ip} x{count}")
    if args.blocklist:
        hits = blocked_ips(ips, blocklist)
        print(f"Blocklisted addresses seen: {len(hits)}")
        for ip, count in hits.most_common():
            print(f"  {ip:15} {count:3}")


if __name__ == "__main__":
    main()
PYEOF
printf '127.0.0.1 - - [21/Nov/2026:10:00:01 +0000] "GET / HTTP/1.1" 200 512\n10.0.0.5 - - [21/Nov/2026:10:00:02 +0000] "GET /login HTTP/1.1" 404 128\n' > data/sample-access.log
printf 'pytest\n' > requirements.txt
touch notes/.keep logs/.keep
git init -q
git add .
git commit -q -m "mylab after Module 4"
cd ~
-->

Every file in `mylab` is a row of bytes, and every program you run from it is a process with a folder of its own under `/proc`. In this step you stop trusting file names and icons and look at what is really there, with three tools you can use on any Linux machine. On the way you will meet, and fix, the bug that has broken more shell scripts copied from Windows than any other.

## Goal

After this lesson you can:

- Find out what a file really is with `file` and `hexdump`, whatever its name says.
- Spot and fix Windows line endings in a script.
- Read a running process's details in `/proc`, and keep your findings in `notes/inside.md`.

## Why it matters

Attackers rename files all the time: a program called `invoice.pdf` is still a program. Looking at the bytes instead of the name is the first habit of anyone who investigates a suspicious file, and `/proc` is where an investigator looks first on a live Linux system. The same skills save you hours on ordinary days, when a script works on one machine and fails with a strange error on another.

## The idea

You add one file to `mylab`: `notes/inside.md`, your own field notes on what your project looks like from the machine's side. To fill it, you use the ideas of this module on your own files:

- **Lesson 5.1**: a file is bytes, and `hexdump -C` shows them.
- **Lesson 5.5**: a file's first bytes often say what it is. The `file` command reads these **magic numbers** (and a few other clues) instead of trusting the name.
- **Lesson 5.4**: the kernel describes every process in `/proc/PID/`: its command line, its working directory, its open files.

A good analogy is a parcel at customs. The label says "books", but the officer x-rays it anyway. `file` and `hexdump` are your x-ray.

Your `mylab` comes from Modules 1 to 4, so it may have a few more files than the one shown here. That does not matter: the commands work on whatever is in your folder.

## Try it

### 1. Ask what each file is

```bash
cd ~/mylab
file README.md scripts/sysinfo.sh tools/loganalyzer.py data/sample-access.log
```

```output
README.md:              ASCII text
scripts/sysinfo.sh:     Bourne-Again shell script, ASCII text executable
tools/loganalyzer.py:   Python script, ASCII text executable
data/sample-access.log: ASCII text
```

`file` looked inside each one. It found the `#!/bin/bash` line in `sysinfo.sh` (Bash is the "Bourne-Again shell"), and the `#!/usr/bin/env python3` line in the analyzer. (Without that line, `file` still guesses Python from keywords such as `import`.) "ASCII text" means every byte is plain ASCII, so these files are also valid UTF-8.

To see that the name plays no part, give a script a misleading name:

```bash
cp scripts/sysinfo.sh /tmp/holiday-photo.jpg
file /tmp/holiday-photo.jpg
rm /tmp/holiday-photo.jpg
```

```output
/tmp/holiday-photo.jpg: Bourne-Again shell script, ASCII text executable
```

The `.jpg` fooled nobody. On Linux the name of a file is only a label; what decides how a file is used is its content and its permissions.

### 2. Read the first bytes of a script

```bash
hexdump -C scripts/sysinfo.sh | head -n 3
```

```output
00000000  23 21 2f 62 69 6e 2f 62  61 73 68 0a 23 20 73 79  |#!/bin/bash.# sy|
00000010  73 69 6e 66 6f 2e 73 68  3a 20 70 72 69 6e 74 20  |sinfo.sh: print |
00000020  61 20 73 68 6f 72 74 20  72 65 70 6f 72 74 20 61  |a short report a|
```

The first two bytes are `23 21`, the characters `#!`. This pair is the shebang you met in Lesson 1.9, and it is the magic number of a script: when you run `./scripts/sysinfo.sh`, the kernel reads these two bytes, then the path after them, `/bin/bash`, and starts that program to read the rest. The line ends with `0a`, the newline. Keep that byte in mind.

### 3. Meet a Windows line ending

Windows ends each line of a text file with two bytes, `0d 0a` (carriage return, then newline), while Linux uses only `0a`. A script written or copied on Windows often keeps the Windows endings. Make one on purpose: `\r` in `printf` writes the `0d` byte.

```bash
printf '#!/bin/bash\r\necho "hello"\r\n' > scripts/crlf.sh
chmod +x scripts/crlf.sh
file scripts/crlf.sh
```

```output
scripts/crlf.sh: Bourne-Again shell script, ASCII text executable, with CRLF line terminators
```

**CRLF** is the name of the Windows ending: CR (carriage return, `0d`) and LF (line feed, `0a`). The script looks perfect in any editor. Now run it:

<!-- lab: nocheck -->
```bash
./scripts/crlf.sh
```

```output
bash: line 50: ./scripts/crlf.sh: cannot execute: required file not found
```

The file is right there, so which "required file" is not found? The kernel took everything after `#!` up to the `0a` as the program to start, and that was `/bin/bash` followed by an invisible carriage return. No program has that name, so the kernel refused to start the script, and Bash reports that a file it needs is missing. (In your terminal the message has no `line` number. Older versions of Bash say `/bin/bash^M: bad interpreter` instead, where `^M` is the carriage return.) The bytes prove it:

```bash
hexdump -C scripts/crlf.sh
```

```output
00000000  23 21 2f 62 69 6e 2f 62  61 73 68 0d 0a 65 63 68  |#!/bin/bash..ech|
00000010  6f 20 22 68 65 6c 6c 6f  22 0d 0a                 |o "hello"..|
0000001b
```

There is the `0d` before each `0a`. Remove every carriage return at the end of a line with `sed`, then run the script again:

```bash
sed -i 's/\r$//' scripts/crlf.sh
./scripts/crlf.sh
rm scripts/crlf.sh
```

```output
hello
```

`s/\r$//` means "replace a carriage return at the end of a line with nothing", and `-i` changes the file in place. The test script has done its job, so it is deleted.

### 4. Look at a running process from the inside

Start a slow command from `mylab` in the background, and keep its PID in a variable. `$!` is the PID of the last command started with `&`. As in Lesson 1.5, your terminal first prints a job number and the PID, such as `[1] 2832`; the output below leaves that line out.

```bash
sleep 300 &
PID=$!
grep -E '^(Name|State|Threads)' /proc/$PID/status
```

```output
Name:   sleep
State:  S (sleeping)
Threads:        1
```

`/proc/$PID/status` is the kernel's description of the process: its name, its state (`S` means it is waiting, here for its 300 seconds to pass) and its number of threads.

```bash
readlink /proc/$PID/exe /proc/$PID/cwd
ls /proc/$PID/fd
```

```output
/usr/bin/sleep
/home/sam/mylab
0  1  2
```

`readlink` prints where a link points. `exe` is a link to the program file the process runs, and `cwd` to its working directory: the folder you were in when you started it. (Your output shows your own username.) `fd` holds one entry per open file descriptor. `sleep` has only the three every process starts with: 0, 1 and 2, standard input, output and error.

### 5. Read a command line byte by byte

```bash
hexdump -C /proc/$PID/cmdline
kill $PID
```

```output
00000000  73 6c 65 65 70 00 33 30  30 00                    |sleep.300.|
0000000a
```

`cmdline` holds the command line that started the process. The words are not separated by spaces but by the byte `00`, which can never appear inside a word, so even an argument that contains spaces stays in one piece. This is the kind of detail you only see in a hex dump. `kill` then ends the `sleep`. (Your terminal may later print `Terminated` for it.)

### 6. Write your notes

Create `notes/inside.md` with your editor and write what you found in your own words. Here is an example; your notes can be shorter or longer, but they should be yours:

```markdown title="notes/inside.md"
# Inside mylab

What my project looks like from the machine's side (Module 5).

## Files

- `file` reads the content, not the name. A script renamed to .jpg is still a script.
- Scripts start with the shebang `#!` (bytes `23 21`), then the program to run.
- Text files end lines with `0a`. Windows uses `0d 0a` (CRLF).
  Find it: `file script.sh` says "with CRLF line terminators".
  Fix it: `sed -i 's/\r$//' script.sh`
- Compiled programs start with `7f 45 4c 46` (`.ELF`).

## Processes

- `/proc/PID/status`: name, state, threads.
- `/proc/PID/exe` and `/proc/PID/cwd`: the program file and the working directory.
- `/proc/PID/fd`: open files. 0, 1, 2 are stdin, stdout, stderr.
- `/proc/PID/cmdline`: the arguments, separated by `00` bytes.
```

Then check it is plain text, and commit it:

```bash
file notes/inside.md
git add notes/inside.md
git commit -q -m "Add notes on how mylab looks inside"
git status --short
```

```output
notes/inside.md: ASCII text
```

`-q` keeps `git commit` quiet. `git status --short` prints nothing, which means everything is committed. If your notes contain characters such as `é`, `file` says "Unicode text, UTF-8 text" instead, which is just as good.

## Exercise

Still in `~/mylab`:

1. Check every file in `scripts/` and `tools/` for Windows line endings with one command. What does "no output" mean here?
2. `$$` is the PID of the shell you are typing in. Use `/proc` to find the name of that program and its working directory.
3. Add one line to `notes/inside.md` with what you found in part 2, and commit it.

<details>
<summary>Show the solution</summary>

1. Let `file` describe them all, and keep only the lines that mention CRLF:

```bash
file scripts/* tools/* | grep CRLF || echo "no CRLF found"
```

```output
no CRLF found
```

On its own, `grep CRLF` would print nothing here, because no line contains `CRLF`: none of your files has Windows line endings. "No output" from `grep` means "no match", and `grep` then ends with a non-zero exit code, which makes `||` run the `echo`. If a file did have CRLF endings, you would see its name and could fix it with `sed`, as in step 3.

2. `comm` holds the program name of a process:

```bash
cat /proc/$$/comm
readlink /proc/$$/cwd
```

```output
bash
/home/sam/mylab
```

3. `>>` appends a line to the end of the file:

```bash
echo '- `/proc/$$/comm`: my shell is bash, running in ~/mylab.' >> notes/inside.md
git commit -q -am "Notes: my own shell in /proc"
tail -n 1 notes/inside.md
```

```output
- `/proc/$$/comm`: my shell is bash, running in ~/mylab.
```

The single quotes keep `$$` as written instead of replacing it with a number. `git commit -am` stages every file git already tracks and commits in one go.

</details>

## Check yourself

**1. How does `file` decide what a file is, if not by its name?**

<details>
<summary>Answer</summary>

It reads the content: magic numbers at the start (such as `7f 45 4c 46` for a compiled program or `#!` for a script) and other clues such as which bytes appear and which keywords.

</details>

**2. A script from a classmate is clearly there, but running it fails with `cannot execute: required file not found` (or, on older systems, `/bin/bash^M: bad interpreter`). What is wrong, and how do you fix it?**

<details>
<summary>Answer</summary>

The file has Windows line endings (CRLF): every line ends with `0d 0a`, so the kernel looks for a program called `/bin/bash` plus a carriage return. Remove the carriage returns with `sed -i 's/\r$//' script.sh`.

</details>

**3. Where do you look to find out which folder a running process was started from?**

<details>
<summary>Answer</summary>

`/proc/PID/cwd`, a link to its working directory. `readlink /proc/PID/cwd` prints the path.

</details>

**4. Why does `/proc/PID/cmdline` separate the arguments with `00` bytes instead of spaces?**

<details>
<summary>Answer</summary>

An argument may itself contain spaces, for example a file name like `my notes.txt`. The byte `00` can never appear inside an argument, so it marks the boundaries without any doubt.

</details>

## Common mistakes

- **Editing Linux scripts with a Windows editor that saves CRLF.** Set your editor to "LF" line endings for the project. In VS Code, the choice is in the status bar at the bottom right.
- **Trusting the extension.** `.txt`, `.jpg` or `.pdf` is only part of the name. Run `file` on anything you did not make yourself before you open or run it.
- **Using an old PID.** A PID belongs to one process only while it runs. After `kill`, `/proc/$PID` disappears, and later the number may belong to a completely different process.
- **Running `hexdump` on a big file without `head`.** A dump is about five times the size of the file: 79 characters for every 16 bytes. Pipe it through `head -n 20` to see the start.

## Key terms

- **CRLF**: the Windows line ending, the two bytes `0d 0a` (carriage return and line feed). Linux uses only LF, `0a`.

## Go further

- [The Linux kernel documentation: The /proc filesystem](https://docs.kernel.org/filesystems/proc.html): what every file under `/proc/PID/` contains.
- [Ubuntu manpage: file](https://manpages.ubuntu.com/manpages/noble/man1/file.1.html): how `file` decides, and the options to make it say more.
- [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/): several early levels ask you to find a file by what it really is, not by its name. `file` and `hexdump` are exactly the right tools.
