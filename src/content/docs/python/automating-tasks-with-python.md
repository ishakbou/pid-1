---
title: Automating tasks with Python
description: Write command-line scripts that take arguments, rename files safely, run other programs and report success or failure with an exit status.
lesson: "3.10"
time: 25 min
sidebar:
  order: 10
---

Your downloads folder holds `Weekly Report.TXT`, `weekly report (1).TXT`, `INVOICE 2026.PDF` and forty more like them. Renaming them by hand takes ten minutes of careful clicking, and next week there will be forty new ones. A script takes ten minutes to write once, and a second to run every week after that. In this lesson you build tools like the ones you use in the terminal: they take arguments, print help, and tell the shell whether they worked.

## Goal

After this lesson you can:

- Read command-line arguments with `sys.argv` and `argparse`.
- Find, inspect and rename files with `pathlib`, with a safe "dry run" first.
- Run other programs from Python with `subprocess`, and end a script with a clear exit status.

## Why it matters

Automation is where Python pays off for system and security work: renaming evidence files in a fixed format, collecting the output of several commands into one report, checking a hundred servers the same way every morning. A script that behaves like a real command, with arguments, `--help` and an exit status, can be used by other people, called from Bash scripts and run by schedulers such as cron, without anyone opening the code.

## The idea

When you run `python3 tidy.py downloads --dry-run`, the words after the script name are **command-line arguments**. Python puts them in a list called `sys.argv`. Reading that list by hand works for one argument, but real tools need options, defaults and a help text. The standard module `argparse` builds all of that from a short description of what your script accepts.

The module `pathlib` treats paths as objects instead of plain strings. A `Path` knows its name, its extension and its folder, and it can list, rename or create files. It is the Python version of `ls`, `mv` and `mkdir` from Module 1.

The module `subprocess` starts other programs, waits for them, and gives you what they printed and their exit status. With it, a Python script can drive any command-line tool.

A good automation script is like a careful mover. It first walks through the house and writes down what goes where, the **dry run**. Only when you agree does it carry anything. And when it is finished, it tells you clearly whether everything arrived.

## Try it

### 1. Create files to work on

```bash
mkdir -p ~/pylab/automate/inbox
cd ~/pylab/automate
touch "inbox/Weekly Report.TXT" "inbox/INVOICE 2026.PDF" "inbox/notes.txt"
```

<!-- lab: nocheck -->
```bash
ls inbox
```

```output
'INVOICE 2026.PDF'  'Weekly Report.TXT'   notes.txt
```

`ls` puts quotes around names with spaces, so you can see where each name begins and ends. Spaces and capital letters in file names make work in the terminal harder, as you saw in Module 1. Your script will fix that.

### 2. Read the arguments

```python title="args.py"
import sys

print("script:", sys.argv[0])
print("arguments:", sys.argv[1:])
```

```bash
python3 args.py inbox --dry-run
```

```output
script: args.py
arguments: ['inbox', '--dry-run']
```

`sys.argv` is a list of strings. Item 0 is the script itself, and the rest are the arguments in the order you typed them. Nothing checks them: if the user forgets one, `sys.argv[1]` raises an `IndexError`. That is why bigger scripts use `argparse`.

### 3. Look at files with pathlib

```python title="look.py"
from pathlib import Path

folder = Path("inbox")
for path in sorted(folder.iterdir()):
    print(f"{path.name:20} stem={path.stem!r:18} suffix={path.suffix}")
print(folder.exists(), Path("nowhere").exists())
```

```bash
python3 look.py
```

```output
INVOICE 2026.PDF     stem='INVOICE 2026'     suffix=.PDF
Weekly Report.TXT    stem='Weekly Report'    suffix=.TXT
notes.txt            stem='notes'            suffix=.txt
True False
```

`Path("inbox")` makes a path object. `iterdir()` gives a `Path` for each item in the folder, and `sorted` puts them in a fixed order. Each path knows its `name`, its `stem` (the name without the extension) and its `suffix` (the extension). `exists()` checks whether the path is there.

### 4. Write the tool with argparse

```python title="tidy.py"
#!/usr/bin/env python3
"""Tidy file names: lowercase, dashes instead of spaces."""
import argparse
import sys
from pathlib import Path


def tidy_name(name):
    return name.lower().replace(" ", "-")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", help="the folder to tidy")
    parser.add_argument("--dry-run", action="store_true",
                        help="only show what would change")
    args = parser.parse_args()

    folder = Path(args.folder)
    if not folder.is_dir():
        print(f"error: {folder} is not a folder", file=sys.stderr)
        sys.exit(1)

    for path in sorted(folder.iterdir()):
        new_path = path.with_name(tidy_name(path.name))
        if new_path == path:
            continue
        if new_path.exists():
            print(f"skip {path.name}: {new_path.name} already exists")
            continue
        print(f"{path.name} -> {new_path.name}")
        if not args.dry_run:
            path.rename(new_path)


if __name__ == "__main__":
    main()
```

```bash
python3 tidy.py --help
```

```output
usage: tidy.py [-h] [--dry-run] folder

Tidy file names: lowercase, dashes instead of spaces.

positional arguments:
  folder      the folder to tidy

options:
  -h, --help  show this help message and exit
  --dry-run   only show what would change
```

You never wrote that help text: `argparse` built it from the `add_argument` lines and the docstring at the top of the file, which `__doc__` holds. `folder` is a required argument. `--dry-run` is an option, and `action="store_true"` makes it `True` when it is given and `False` when not. `parse_args()` reads `sys.argv`, checks it, and returns an object where `args.folder` and `args.dry_run` hold the values. Note that the dash in `--dry-run` becomes an underscore in `args.dry_run`.

The rest uses what you know. `with_name` makes a new path in the same folder with another name. The script skips names that are already tidy, and it refuses to rename onto a file that already exists, because `rename` would quietly replace that file on Linux.

### 5. Do a dry run, then the real run

```bash
python3 tidy.py inbox --dry-run
```

```output
INVOICE 2026.PDF -> invoice-2026.pdf
Weekly Report.TXT -> weekly-report.txt
```

<!-- lab: nocheck -->
```bash
ls inbox
```

```output
'INVOICE 2026.PDF'  'Weekly Report.TXT'   notes.txt
```

The dry run printed the plan and changed nothing, as `ls` proves. Read the plan; if it looks right, run it for real:

```bash
python3 tidy.py inbox
ls inbox
```

```output
INVOICE 2026.PDF -> invoice-2026.pdf
Weekly Report.TXT -> weekly-report.txt
invoice-2026.pdf  notes.txt  weekly-report.txt
```

`notes.txt` was already tidy, so it was left alone. Run the script a second time and it prints nothing: there is nothing left to do. A script that you can run again without causing damage is much safer to automate.

:::caution[Always offer a dry run]
A script that renames, moves or deletes files can do a lot of damage in one second, and there is no undo. Give every such script a `--dry-run` option, use it first, and read the plan. Test on a copy of the files before you point the script at anything that matters.
:::

### 6. Report failure with an exit status

```bash
python3 tidy.py nowhere
echo "exit status: $?"
python3 tidy.py
echo "exit status: $?"
```

```output
error: nowhere is not a folder
exit status: 1
usage: tidy.py [-h] [--dry-run] folder
tidy.py: error: the following arguments are required: folder
exit status: 2
```

`sys.exit(1)` ends the script with exit status 1, and `file=sys.stderr` sends the message to standard error, where error messages belong. When an argument is missing, `argparse` itself prints the usage line and exits with status 2. A Bash script can now check `$?`, or use `&&`, and stop when your tool fails.

### 7. Run another program

```python title="run.py"
import subprocess

result = subprocess.run(["ls", "inbox"], capture_output=True, text=True)
print("status:", result.returncode)
print("files:", result.stdout.split())

result = subprocess.run(["ls", "nowhere"], capture_output=True, text=True)
print("status:", result.returncode)
print("error:", result.stderr.strip())
```

```bash
python3 run.py
```

```output
status: 0
files: ['invoice-2026.pdf', 'notes.txt', 'weekly-report.txt']
status: 2
error: ls: cannot access 'nowhere': No such file or directory
```

`subprocess.run` takes the command as a list: the program, then each argument as a separate item. `capture_output=True` collects what the program prints instead of showing it, and `text=True` gives it to you as strings. The result holds the exit status in `returncode`, the standard output in `stdout` and the standard error in `stderr`. Giving the command as a list is also safer than one string: a file name with spaces, or with a `;` in it, stays one argument and is never read as a second command.

### 8. Make the script a command

```bash
chmod +x tidy.py
./tidy.py inbox --dry-run
echo "exit status: $?"
```

```output
exit status: 0
```

The first line of `tidy.py`, `#!/usr/bin/env python3`, is a shebang, as in your Bash scripts in lesson 1.9. It tells the system to run the file with `python3`. With the execute permission from `chmod +x`, you can start it like any other command. It printed no plan because every name is tidy now, and the status 0 says all went well.

## Exercise

In `~/pylab/automate`, write `count_lines.py`, a command that:

1. Takes one or more file names as arguments. Use `parser.add_argument("files", nargs="+")`: `nargs="+"` means "one or more", and `args.files` is then a list.
2. Prints the number of lines of each file, then the total.
3. If a file does not exist, prints an error to standard error and ends with exit status 1 after the other files are counted.

Test it with two small files you create with `printf`, then with a missing file.

<details>
<summary>Show the solution</summary>

```python title="count_lines.py"
#!/usr/bin/env python3
"""Count the lines of one or more files."""
import argparse
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("files", nargs="+", help="files to count")
    args = parser.parse_args()

    total = 0
    failed = False
    for name in args.files:
        path = Path(name)
        if not path.is_file():
            print(f"error: {name} not found", file=sys.stderr)
            failed = True
            continue
        with open(path, encoding="utf-8") as f:
            count = sum(1 for line in f)
        print(f"{count:5} {name}")
        total += count

    print(f"{total:5} total")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
```

```bash
printf 'a\nb\nc\n' > three.txt
printf 'x\ny\n' > two.txt
python3 count_lines.py three.txt two.txt
python3 count_lines.py three.txt missing.txt 2> errors.txt
echo "exit status: $?"
cat errors.txt
```

```output
    3 three.txt
    2 two.txt
    5 total
    3 three.txt
    3 total
exit status: 1
error: missing.txt not found
```

`2> errors.txt` sends standard error to a file, so you can see that the message really went there and not to standard output. `sum(1 for line in f)` adds 1 for every line without keeping the lines in memory; a loop with a counter works just as well. The script keeps going after a missing file and fails only at the end, so you still get the counts of the files that exist. That is a choice: a tool that must not work on partial data would stop at the first error instead.

</details>

## Check yourself

**1. You run `python3 tool.py logs --top 5`. What is in `sys.argv`?**

<details>
<summary>Answer</summary>

`['tool.py', 'logs', '--top', '5']`. Item 0 is the script, and every argument is a string, even `'5'`.

</details>

**2. What does `action="store_true"` do for an option such as `--dry-run`?**

<details>
<summary>Answer</summary>

It makes `args.dry_run` `True` when the option is given and `False` when it is not, with no value after it.

</details>

**3. Why give `subprocess.run` a list such as `["ls", folder]` instead of one string?**

<details>
<summary>Answer</summary>

Each item stays one argument. A name with spaces or special characters such as `;` cannot be split or read as another command.

</details>

**4. How does a script tell the shell that it failed?**

<details>
<summary>Answer</summary>

It ends with a non-zero exit status, for example with `sys.exit(1)`. The shell shows it in `$?`.

</details>

**5. Why should a renaming script have a dry run?**

<details>
<summary>Answer</summary>

Renaming and deleting cannot be undone. A dry run prints what would change without changing it, so you can check the plan first.

</details>

## Common mistakes

- **Forgetting that arguments are strings.** `sys.argv` and `argparse` give you text. Convert with `int()`, or let argparse do it with `type=int`.
- **Running a destructive script without a dry run.** Test on a copy, read the plan, then run it for real.
- **Overwriting files by renaming.** On Linux, `rename` replaces the target if it exists. Check `exists()` first, as `tidy.py` does.
- **Ignoring the return code.** `subprocess.run` does not fail when the program fails. Check `result.returncode`, or pass `check=True` to get an exception.
- **`Permission denied` with `./script.py`.** The file has no execute permission. Run `chmod +x script.py`, or start it with `python3 script.py`.

## Key terms

- **Command-line argument**: a word typed after the command name, passed to the program when it starts.
- **sys.argv**: the list of command-line arguments in Python. Item 0 is the script name.
- **argparse**: the standard module that reads arguments and options and builds the `--help` text.
- **pathlib**: the standard module that handles paths as `Path` objects with a name, a suffix and methods.
- **subprocess**: the standard module that runs other programs and collects their output and exit status.
- **Dry run**: a run that only shows what a script would do, without changing anything.

## Go further

- [argparse Tutorial](https://docs.python.org/3/howto/argparse.html): the official step-by-step guide to arguments, options and help texts.
- [pathlib](https://docs.python.org/3/library/pathlib.html): the reference for `Path`, with a table that maps old `os` functions to the new methods.
- [subprocess](https://docs.python.org/3/library/subprocess.html): the reference for `subprocess.run` and its options, including the security notes about the shell.
