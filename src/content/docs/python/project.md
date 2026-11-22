---
title: "Project step: a log analyzer for mylab"
description: Build a command-line tool for mylab that reads a web server log and reports the busiest IP addresses and the errors, with tests and its own virtual environment.
lesson: "3.11"
time: 25 min
sidebar:
  order: 11
---

<!-- lab: run
sudo apt-get install -y -qq python3-venv > /dev/null 2>&1
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs
cd ~/mylab
printf '# mylab\n\nMy lab for the PID 1 course.\n' > README.md
printf '.env\n*.tmp\n' > .gitignore
printf '#!/bin/bash\necho sysinfo\n' > scripts/sysinfo.sh
printf '#!/bin/bash\necho backup\n' > scripts/backup.sh
chmod +x scripts/sysinfo.sh scripts/backup.sh
git init -q
git add .
git commit -q -m "mylab after Module 2"
cd ~
-->

Somewhere in the world, a web server is answering requests right now, and writing one line about each of them into a log. Most lines are boring. A few tell a story: someone guessing passwords, a scanner looking for forgotten backup files. Nobody reads ten thousand lines by eye to find them. In this step you write the tool that does it for you, and it becomes the first Python program in `mylab`.

## Goal

After this lesson you can:

- Build a command-line tool that reads an access log and reports the busiest IP addresses and the errors.
- Test it with pytest, in its own virtual environment.
- Commit it to `mylab` with a `requirements.txt` and without the venv.

## Why it matters

Reading logs is one of the first jobs a junior system administrator or security analyst gets. A tool that turns a log into a short report shows in seconds what would take an hour by hand. This one also brings together everything from this module: strings, loops, functions, collections, files, errors, modules, tests and arguments. And it will grow: Module 4 makes it faster on big logs, and Module 13 builds a login watcher from the same ideas.

## The idea

A web server writes an **access log**: one line per request. The most common layout is the Common Log Format, and a line looks like this:

```text
198.51.100.23 - - [21/Nov/2026:09:59:14 +0000] "POST /login HTTP/1.1" 401 92
```

From left to right: the client's IP address, two fields that are usually `-`, the date and time in brackets, the request in quotes (method, path and protocol), the status code the server answered, and the size of the answer in bytes. Split at the spaces, the line gives exactly ten pieces: the IP is piece 0, the method piece 5 (with a quote stuck to it), the path piece 6 and the status piece 8.

The tool has three functions, each with one job:

- `parse_line` turns one line into a dict, or returns `None` for a broken line.
- `analyze` goes through all lines, counts the requests per IP and collects the errors.
- `main` reads the arguments, opens the file, calls `analyze` and prints the report.

Splitting the work this way is what makes the tool testable: you can check `parse_line` and `analyze` with a few lines of text in a test, without any file.

When this step is done, `mylab` has these new items:

```text
mylab/
    .venv/                      new, ignored by git
    data/
        sample-access.log       new: a small practice log
    requirements.txt            new
    tools/
        loganalyzer.py          new
        test_loganalyzer.py     new
    ...                         everything from Modules 1 and 2
```

## Try it

This step continues the `mylab` folder from Module 2: a git repository with `scripts/`, `notes/`, `data/` and `logs/`. If you are missing parts, the [Module 1 project step](../linux/project/) and the [Module 2 project step](../git/project/) build them.

### 1. Start from a clean repository

```bash
cd ~/mylab
git status --short
mkdir -p tools
```

`git status --short` prints nothing: every change from earlier modules is committed. That way, everything you see changing from now on belongs to this step. The `tools/` folder will hold Python tools; `scripts/` stays for the Bash scripts of Module 1.

### 2. Add a practice log

Create `data/sample-access.log` with this content:

```text title="data/sample-access.log"
203.0.113.5 - - [21/Nov/2026:09:58:01 +0000] "GET / HTTP/1.1" 200 1043
203.0.113.5 - - [21/Nov/2026:09:58:02 +0000] "GET /style.css HTTP/1.1" 200 312
198.51.100.23 - - [21/Nov/2026:09:59:10 +0000] "GET /login HTTP/1.1" 200 877
198.51.100.23 - - [21/Nov/2026:09:59:14 +0000] "POST /login HTTP/1.1" 401 92
198.51.100.23 - - [21/Nov/2026:09:59:15 +0000] "POST /login HTTP/1.1" 401 92
198.51.100.23 - - [21/Nov/2026:09:59:16 +0000] "POST /login HTTP/1.1" 401 92
198.51.100.23 - - [21/Nov/2026:09:59:17 +0000] "POST /login HTTP/1.1" 401 92
203.0.113.80 - - [21/Nov/2026:10:01:44 +0000] "GET /admin HTTP/1.1" 403 150
203.0.113.5 - - [21/Nov/2026:10:02:03 +0000] "GET /about HTTP/1.1" 200 2210
127.0.0.1 - - [21/Nov/2026:10:03:00 +0000] "GET /health HTTP/1.1" 200 2
203.0.113.80 - - [21/Nov/2026:10:04:12 +0000] "GET /.env HTTP/1.1" 404 153
203.0.113.80 - - [21/Nov/2026:10:04:13 +0000] "GET /backup.zip HTTP/1.1" 404 153
203.0.113.5 - - [21/Nov/2026:10:05:30 +0000] "GET /notes HTTP/1.1" 500 61
198.51.100.23 - - [21/Nov/2026:10:06:02 +0000] "POST /login HTTP/1.1" 200 640
203.0.113.80 - - [21/Nov/2026:10:06:
127.0.0.1 - - [21/Nov/2026:10:08:00 +0000] "GET /health HTTP/1.1" 200 2
```

```bash
wc -l data/sample-access.log
```

```output
16 data/sample-access.log
```

The visitors are made up. Addresses that start with `203.0.113.` and `198.51.100.` are reserved for examples and documentation, so they never belong to a real machine. Line 15 is cut off on purpose, as happens when a server crashes while writing. Read the log once yourself: can you already see the story in it?

### 3. Write the analyzer

Create `tools/loganalyzer.py`:

```python title="tools/loganalyzer.py"
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("logfile", help="the access log to read")
    parser.add_argument("--top", type=int, default=3,
                        help="how many IP addresses to show (default: 3)")
    args = parser.parse_args()

    try:
        with open(args.logfile, encoding="utf-8") as f:
            ips, errors, broken = analyze(f)
    except FileNotFoundError:
        print(f"error: {args.logfile} not found", file=sys.stderr)
        sys.exit(1)

    print(f"Requests: {sum(ips.values())}, broken lines: {broken}")
    print(f"Top {args.top} IP addresses:")
    for ip, count in ips.most_common(args.top):
        print(f"  {ip:15} {count:3}")
    print(f"Errors: {len(errors)}")
    for e in errors:
        print(f"  {e['status']} {e['method']:4} {e['path']:12} from {e['ip']}")


if __name__ == "__main__":
    main()
```

Each function uses a lesson of this module:

- `parse_line` splits the line (lesson 3.4) and refuses anything that does not have exactly ten pieces or whose status is not a number (lesson 3.6). It returns `None` instead of crashing, because one broken line must not stop the report. `strip('"')` removes the quote stuck to the method.
- `analyze` skips empty lines, counts broken ones, and counts requests per IP with a `Counter` (lesson 3.8). `entry is None` is the usual way to check for `None`. It works on any series of lines: an open file, or a plain list in a test.
- `main` reads the arguments with `argparse`, where `type=int` turns the text after `--top` into a number (lesson 3.10), and ends with exit status 1 if the file is missing.

### 4. Run it

```bash
python3 tools/loganalyzer.py data/sample-access.log
```

```output
Requests: 15, broken lines: 1
Top 3 IP addresses:
  198.51.100.23     6
  203.0.113.5       4
  203.0.113.80      3
Errors: 8
  401 POST /login       from 198.51.100.23
  401 POST /login       from 198.51.100.23
  401 POST /login       from 198.51.100.23
  401 POST /login       from 198.51.100.23
  403 GET  /admin       from 203.0.113.80
  404 GET  /.env        from 203.0.113.80
  404 GET  /backup.zip  from 203.0.113.80
  500 GET  /notes       from 203.0.113.5
```

Now the story is easy to read. `198.51.100.23` failed to log in four times within four seconds and then got in: that looks like someone guessing a password, and it worked. `203.0.113.80` asked for `/admin`, `/.env` and `/backup.zip`, files that should never be public: a typical scanner. And one `500` says that the app itself has a bug on `/notes`. Module 13 shows what defenders do next with findings like these.

```bash
python3 tools/loganalyzer.py data/sample-access.log --top 1 | head -n 3
python3 tools/loganalyzer.py data/missing.log
echo "exit status: $?"
```

```output
Requests: 15, broken lines: 1
Top 1 IP addresses:
  198.51.100.23     6
error: data/missing.log not found
exit status: 1
```

`--top 1` shows only the busiest address, and `head -n 3` cuts the rest of the report, as pipes do with any command. A missing file gives a short message and status 1, not a traceback.

### 5. Set up the virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -q pytest
git status --short
```

```output
?? .venv/
?? data/
?? tools/
```

The tests need pytest, so `mylab` gets its own venv, as in lesson 3.8. But look at `git status`: git sees the venv and would happily commit thousands of files from it. Tell git to ignore it, and also `__pycache__/`, the folder where Python keeps compiled copies of imported modules:

```bash
printf '.venv/\n__pycache__/\n' >> .gitignore
cat .gitignore
git status --short
```

```output
.env
*.tmp
.venv/
__pycache__/
 M .gitignore
?? data/
?? tools/
```

`>>` adds the two lines at the end of `.gitignore`. Yours may have other lines from Module 2 above them, and if `.venv/` was already there, a second copy does no harm. The `.venv/` line is gone from the status: git ignores the folder now. On Python 3.13 and newer, `venv` also puts a small `.gitignore` inside the `.venv` folder, so git may not list `.venv/` even before this step. Keep the line in your own `.gitignore` anyway: it is clear to every reader and works with every Python version.

### 6. Write the tests

Create `tools/test_loganalyzer.py`:

```python title="tools/test_loganalyzer.py"
from loganalyzer import analyze, parse_line

GOOD = '203.0.113.5 - - [21/Nov/2026:09:58:01 +0000] "GET /about HTTP/1.1" 200 2210'
FAILED = '198.51.100.23 - - [21/Nov/2026:09:59:14 +0000] "POST /login HTTP/1.1" 401 92'


def test_parse_good_line():
    entry = parse_line(GOOD)
    assert entry == {"ip": "203.0.113.5", "method": "GET", "path": "/about", "status": 200}


def test_parse_cut_line():
    assert parse_line('203.0.113.80 - - [21/Nov/2026:10:06:') is None


def test_parse_status_not_a_number():
    assert parse_line(GOOD.replace(" 200 ", " OK ")) is None


def test_analyze_counts_and_errors():
    ips, errors, broken = analyze([GOOD, FAILED, FAILED, "", "garbage"])
    assert ips["198.51.100.23"] == 2
    assert ips["203.0.113.5"] == 1
    assert len(errors) == 2
    assert errors[0]["status"] == 401
    assert broken == 1
```

<!-- lab: nocheck -->
```bash
pytest -q
```

```output
....                                                                     [100%]
4 passed in 0.27s
```

pytest found the test file inside `tools/` by its name, and the tests import `loganalyzer` from the same folder. The last test feeds `analyze` a list instead of a file, with an empty line that must be skipped and a garbage line that must count as broken. Each test checks one behavior the report depends on, so a later change that breaks one of them fails here first.

### 7. Record the requirements

<!-- lab: nocheck -->
```bash
pip freeze > requirements.txt
cat requirements.txt
```

```output
iniconfig==2.3.1
packaging==26.3
pluggy==1.7.0
Pygments==2.21.0
pytest==9.2.0
```

You installed only pytest, but `pip freeze` lists the packages pytest needs too, each with its exact version. Your versions may be newer. Anyone who clones `mylab` can now run `pip install -r requirements.txt` in their own venv and get the same set. The analyzer itself needs nothing outside the standard library: pytest is only for the tests.

### 8. Commit the step

```bash
git add .gitignore data tools requirements.txt
git status --short
```

```output
M  .gitignore
A  data/sample-access.log
A  requirements.txt
A  tools/loganalyzer.py
A  tools/test_loganalyzer.py
```

Four new files and one changed file, and nothing from `.venv` or `__pycache__`: the ignore rules work. `A` means added and `M` means modified.

<!-- lab: nocheck -->
```bash
git commit -m "Add log analyzer with tests"
```

```output
[main 2e69977] Add log analyzer with tests
 5 files changed, 116 insertions(+)
 create mode 100644 data/sample-access.log
 create mode 100644 requirements.txt
 create mode 100644 tools/loganalyzer.py
 create mode 100644 tools/test_loganalyzer.py
```

The commit number at the start, here `2e69977`, is different for you. If you published `mylab` on GitHub in Module 2, `git push` sends the step there too.

## Exercise

The report lists the four failed logins as four separate lines. Add a function `failed_logins(errors)` to `tools/loganalyzer.py` that takes the error list from `analyze` and returns a `Counter` of IP addresses that got a `401` on `/login`. Put it above `main`. Then:

1. Print it at the end of the report as `Failed logins: 198.51.100.23 x4`, one IP per line.
2. Add a test for it to `tools/test_loganalyzer.py`.
3. Run the tests and the tool, and commit.

<details>
<summary>Show the solution</summary>

The new function, above `main`:

```python
def failed_logins(errors):
    """Count the failed logins (401 on /login) per IP address."""
    failed = Counter()
    for e in errors:
        if e["status"] == 401 and e["path"] == "/login":
            failed[e["ip"]] += 1
    return failed
```

And at the end of `main`, after the error loop:

```python
    for ip, count in failed_logins(errors).most_common():
        print(f"Failed logins: {ip} x{count}")
```

<!-- lab: run
cd ~/mylab
python3 - <<'EOF'
from pathlib import Path
p = Path("tools/loganalyzer.py")
s = p.read_text()
func = '''def failed_logins(errors):
    """Count the failed logins (401 on /login) per IP address."""
    failed = Counter()
    for e in errors:
        if e["status"] == 401 and e["path"] == "/login":
            failed[e["ip"]] += 1
    return failed


def main():'''
s = s.replace("def main():", func)
loop = '''        print(f"  {e['status']} {e['method']:4} {e['path']:12} from {e['ip']}")
'''
s = s.replace(loop, loop + '''    for ip, count in failed_logins(errors).most_common():
        print(f"Failed logins: {ip} x{count}")
''')
p.write_text(s)
EOF
cat >> tools/test_loganalyzer.py <<'EOF'


def test_failed_logins():
    ips, errors, broken = analyze([GOOD, FAILED, FAILED])
    assert failed_logins(errors) == {"198.51.100.23": 2}
EOF
sed -i 's/^from loganalyzer import analyze, parse_line$/from loganalyzer import analyze, failed_logins, parse_line/' tools/test_loganalyzer.py
-->

In the test file, import the new function on the first line, `from loganalyzer import analyze, failed_logins, parse_line`, and add:

```python
def test_failed_logins():
    ips, errors, broken = analyze([GOOD, FAILED, FAILED])
    assert failed_logins(errors) == {"198.51.100.23": 2}
```

<!-- lab: nocheck -->
```bash
pytest -q
```

```output
.....                                                                    [100%]
5 passed in 0.45s
```

```bash
python3 tools/loganalyzer.py data/sample-access.log | tail -n 2
```

```output
  500 GET  /notes       from 203.0.113.5
Failed logins: 198.51.100.23 x4
```

```bash
git add tools
git commit -q -m "Report failed logins per IP"
git status --short
```

A `Counter` compares equal to a plain dict with the same counts, which keeps the test short. `most_common()` without a number returns all entries, biggest first. `git status --short` prints nothing after the commit: everything is saved.

</details>

## Check yourself

**1. Why does `parse_line` return `None` for a broken line instead of raising an exception?**

<details>
<summary>Answer</summary>

One broken line must not stop the whole report. Returning `None` lets `analyze` count the line as broken and carry on with the next one.

</details>

**2. Why can the tests call `analyze` with a list instead of a file?**

<details>
<summary>Answer</summary>

`analyze` only loops over what it gets, one line at a time. A list of strings and an open file both give lines in a `for` loop, so the function works with either.

</details>

**3. Why are `.venv/` and `__pycache__/` in `.gitignore`, but `requirements.txt` is committed?**

<details>
<summary>Answer</summary>

`.venv/` and `__pycache__/` are generated on each computer and can always be rebuilt. `requirements.txt` is the short list that tells anyone how to rebuild the venv.

</details>

**4. In the sample log, what makes `198.51.100.23` suspicious?**

<details>
<summary>Answer</summary>

Four failed logins (`401` on `POST /login`) within four seconds, followed by a successful login. That pattern looks like password guessing that worked.

</details>

## Common mistakes

- **Running the tests without the venv.** `pytest: command not found` means the venv is not active in this terminal. Run `source .venv/bin/activate` from `~/mylab`.
- **Running the tool from the wrong folder.** `data/sample-access.log` is a relative path. Run the commands from `~/mylab`, or give the full path to the log.
- **Committing the venv.** If `git status` shows `.venv/`, the ignore line is missing or misspelled. Check `.gitignore` before `git add`.
- **Using `git add .` in a hurry.** It adds everything that is not ignored. Name the files and folders you mean, then check with `git status --short`.
- **Trusting the report blindly.** The tool skips lines it cannot read. If `broken lines` is high, look at the log yourself: the format may be different from the one the parser expects.

## Key terms

- **Access log**: a file where a web server writes one line per request: who asked, when, for what, and the status code of the answer.
- **Common Log Format**: a standard layout for access log lines: IP address, date, request, status code and size.

## Go further

- [collections.Counter](https://docs.python.org/3/library/collections.html#collections.Counter): every method of `Counter`, including `most_common` and adding counters together.
- [RFC 5737: IPv4 Address Blocks Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc5737): the official source for the example addresses used in the sample log.
- [pytest: How to invoke pytest](https://docs.pytest.org/en/stable/how-to/usage.html): options to run one test file, one test, or stop at the first failure.
