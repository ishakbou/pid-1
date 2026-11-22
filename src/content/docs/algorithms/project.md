---
title: "Project step: faster tools in mylab"
description: Add a blocklist check to the mylab log analyzer, measure it on a big made-up log with a benchmark script, and make it fast by choosing the right data structure.
lesson: "4.10"
time: 25 min
sidebar:
  order: 10
---

<!-- lab: run
sudo apt-get install -y -qq python3-venv > /dev/null 2>&1
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs ~/mylab/tools
cd ~/mylab
printf '# mylab\n\nMy lab for the PID 1 course.\n' > README.md
printf '.env\n*.tmp\n.venv/\n__pycache__/\n' > .gitignore
printf '#!/bin/bash\necho sysinfo\n' > scripts/sysinfo.sh
printf '#!/bin/bash\necho backup\n' > scripts/backup.sh
chmod +x scripts/sysinfo.sh scripts/backup.sh
cat > data/sample-access.log <<'EOF'
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
EOF
cat > tools/loganalyzer.py <<'EOF'
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
    for ip, count in failed_logins(errors).most_common():
        print(f"Failed logins: {ip} x{count}")


if __name__ == "__main__":
    main()
EOF
cat > tools/test_loganalyzer.py <<'EOF'
from loganalyzer import analyze, failed_logins, parse_line

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


def test_failed_logins():
    ips, errors, broken = analyze([GOOD, FAILED, FAILED])
    assert failed_logins(errors) == {"198.51.100.23": 2}
EOF
python3 -m venv .venv
.venv/bin/pip install -q pytest > /dev/null 2>&1
.venv/bin/pip freeze > requirements.txt
git init -q
git add .
git commit -q -m "mylab after Module 3"
cd ~
-->

Your log analyzer from Module 3 reads the 16-line sample log in a blink. A real web server writes that many lines in a fraction of a second, and a list of known bad addresses, which security teams share with each other, can hold tens of thousands of entries. In this step you add a blocklist check to the analyzer, write a benchmark that feeds it a big made-up log, and watch one data structure decision make the slowest part thousands of times faster.

## Goal

After this lesson you can:

- Add a `--blocklist` option to the mylab log analyzer that flags requests from listed IP addresses.
- Write a benchmark script that measures the analyzer on big test data.
- Find the slow part of a program with measurements, fix it with a better data structure, and measure the gain.

## Why it matters

Checking traffic against a list of known bad addresses is everyday work for defenders, and the lists are big. A check that is fine for ten entries can make a tool useless at twenty thousand. The habit you practise here, measuring before and after a change instead of guessing, is how professionals make code faster. It also keeps you honest: sometimes the part you suspected is not the slow one at all.

## The idea

A **blocklist** is a list of addresses (or domains, or file fingerprints) that are known to be bad, for example because they were seen scanning other servers. The analyzer gets two new functions:

- `load_blocklist(path)` reads a file with one IP address per line, skipping blank lines and comments that start with `#`.
- `blocked_ips(ips, blocklist)` goes through the IP addresses the analyzer has already counted and keeps those on the blocklist, with their request counts.

Notice that `blocked_ips` works on the `Counter` of IP addresses, not on the raw lines. A log of 50,000 lines may come from only a few hundred different addresses, so the check runs a few hundred times instead of 50,000. Counting first was already a data structure win from Module 3: a `Counter` is a dict, and lesson 4.4 showed why its updates are O(1).

To measure, you write a **benchmark**: a script that runs code on realistic test data and reports how long each part takes. Yours, `tools/bench.py`, creates a made-up log of 50,000 lines and a blocklist of 20,001 addresses, then times each step of the analyzer. The big files go in `data/` but are ignored by git, because the script can always recreate them.

When this step is done, `mylab` has these new or changed items:

```text
mylab/
    .gitignore                  changed: ignores data/big-*
    data/
        blocklist.txt           new: a small practice blocklist
        big-access.log          new, made by bench.py, ignored by git
        big-blocklist.txt       new, made by bench.py, ignored by git
    tools/
        loganalyzer.py          changed: --blocklist, faster lookups
        test_loganalyzer.py     changed: two new tests
        bench.py                new
```

## Try it

This step continues the `mylab` folder from the [Module 3 project step](../python/project/), including the `failed_logins` function from its exercise. The full new `loganalyzer.py` is given below, so if you skipped that exercise, you get the function here.

### 1. Start from a clean repository

```bash
cd ~/mylab
source .venv/bin/activate
git status --short
python3 tools/loganalyzer.py data/sample-access.log --top 1
```

```output
Requests: 15, broken lines: 1
Top 1 IP addresses:
  198.51.100.23     6
Errors: 8
  401 POST /login       from 198.51.100.23
  401 POST /login       from 198.51.100.23
  401 POST /login       from 198.51.100.23
  401 POST /login       from 198.51.100.23
  403 GET  /admin       from 203.0.113.80
  404 GET  /.env        from 203.0.113.80
  404 GET  /backup.zip  from 203.0.113.80
  500 GET  /notes       from 203.0.113.5
Failed logins: 198.51.100.23 x4
```

`git status --short` prints nothing, so everything from Module 3 is committed, and the analyzer works as you left it. The venv is active, because the tests at the end need pytest.

### 2. Add a practice blocklist

Create `data/blocklist.txt`:

```text title="data/blocklist.txt"
# Addresses seen scanning other servers (made up for practice)
203.0.113.80
192.0.2.66

198.51.100.200
```

The addresses come from the documentation ranges, so they belong to no real machine. You met `203.0.113.` and `198.51.100.` in Module 3; `192.0.2.` is the third range reserved for examples in the same way. The comment line and the blank line are there on purpose: real blocklists have both, and the loader must skip them.

### 3. Add the blocklist check, the first way that comes to mind

Replace `tools/loganalyzer.py` with this version. The new parts are `load_blocklist`, `blocked_ips`, the `--blocklist` option and the end of `main`:

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


def failed_logins(errors):
    """Count the failed logins (401 on /login) per IP address."""
    failed = Counter()
    for e in errors:
        if e["status"] == 401 and e["path"] == "/login":
            failed[e["ip"]] += 1
    return failed


def load_blocklist(path):
    """Read IP addresses from a file, one per line. Skip blank lines and # comments."""
    blocked = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                blocked.append(line)
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
        blocklist = []
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
```

`parse_line`, `analyze` and `failed_logins` are unchanged. `load_blocklist` collects the addresses in a list, which is what most people write first. `blocked_ips` loops over `ips.items()`, the address and count pairs of the `Counter`. In `main`, both files are opened inside the same `try`, and `error.filename` tells which of the two was missing, so the message stays correct for either.

```bash
python3 tools/loganalyzer.py data/sample-access.log --top 1 --blocklist data/blocklist.txt | tail -n 2
python3 tools/loganalyzer.py data/sample-access.log --blocklist data/nothing.txt
echo "exit status: $?"
```

```output
Blocklisted addresses seen: 1
  203.0.113.80      3
error: data/nothing.txt not found
exit status: 1
```

The scanner from the Module 3 report is on the blocklist, with its three requests. (Its fourth line is the broken one, which the analyzer does not count.) A missing blocklist gives the same short error as a missing log. The feature works; now find out whether it is fast.

### 4. Write the benchmark

Create `tools/bench.py`:

```python title="tools/bench.py"
#!/usr/bin/env python3
"""Time the log analyzer on a big, made-up log and blocklist."""
import os
import random
import time

from loganalyzer import analyze, blocked_ips, load_blocklist

LOG = "data/big-access.log"
BLOCKLIST = "data/big-blocklist.txt"


def make_files():
    random.seed(7)
    prefixes = ["192.0.2.", "198.51.100.", "203.0.113."]
    paths = ["/", "/login", "/about", "/notes", "/admin", "/.env"]
    statuses = [200, 200, 200, 401, 403, 404, 500]
    with open(LOG, "w", encoding="utf-8") as f:
        for i in range(50_000):
            ip = random.choice(prefixes) + str(random.randint(1, 254))
            path = random.choice(paths)
            status = random.choice(statuses)
            f.write(f'{ip} - - [21/Nov/2026:10:00:00 +0000] "GET {path} HTTP/1.1" {status} 512\n')
    with open(BLOCKLIST, "w", encoding="utf-8") as f:
        f.write("# made-up blocklist for the benchmark\n")
        for i in range(20_000):
            f.write(f"10.0.{i // 256}.{i % 256}\n")
        f.write("203.0.113.80\n")


def timed(label, func, *args):
    start = time.perf_counter()
    result = func(*args)
    print(f"{label:15} {time.perf_counter() - start:.3f} s")
    return result


if not os.path.exists(LOG):
    make_files()

with open(LOG, encoding="utf-8") as f:
    ips, errors, broken = timed("analyze", analyze, f)
blocklist = timed("load_blocklist", load_blocklist, BLOCKLIST)
hits = timed("blocked_ips", blocked_ips, ips, blocklist)
print(f"{sum(ips.values()):,} requests from {len(ips)} addresses, "
      f"{len(blocklist):,} blocklisted ({type(blocklist).__name__}), {len(hits)} seen")
```

`make_files` writes the test data once: 50,000 log lines from random documentation addresses, and 20,000 addresses from the private range `10.0.x.x`, plus the scanner. `random.seed(7)` makes the "random" log the same on every run. `random.choice` picks one item from a list, and `random.randint(1, 254)` a whole number from 1 to 254. `timed` is the `measure` helper from lesson 4.1, plus a label. `type(blocklist).__name__` prints the name of the type, `list` or `set`, so each report says which version it measured.

### 5. Measure, and find the slow part

Run the benchmark from `~/mylab`, so that the `data/` paths work:

<!-- lab: nocheck -->
```bash
python3 tools/bench.py
```

```output
analyze         2.776 s
load_blocklist  0.176 s
blocked_ips     3.942 s
50,000 requests from 762 addresses, 20,001 blocklisted (list), 1 seen
```

The first run also creates the two big files, which takes a moment before the timings start. Read the timings before you change anything. `analyze` reads and parses 50,000 lines. `load_blocklist` reads 20,001 lines. And `blocked_ips`, which does almost nothing per address, is the slowest of the three: slower than reading and parsing the whole log. Lesson 4.1 named the reason: `ip in blocklist` is a hidden loop. For each of the 762 addresses, it compares with up to 20,001 blocklist entries, and since nearly all addresses are not on the list, it usually compares with all of them. That is about 15 million comparisons, O(n × m) for n addresses and m blocklist entries.

### 6. Make it fast with a set

Change two lines of `load_blocklist`, so that it builds a set:

```python
    blocked = set()
```

```python
                blocked.add(line)
```

<!-- lab: run
cd ~/mylab
sed -i 's/^    blocked = \[\]$/    blocked = set()/; s/^                blocked.append(line)$/                blocked.add(line)/; s/^        blocklist = \[\]$/        blocklist = set()/' tools/loganalyzer.py
-->

In `main`, change the empty default too, from `blocklist = []` to `blocklist = set()`, so that the variable always holds the same type. Nothing else changes: `ip in blocklist` works on a set exactly as on a list, only the cost is different.

```bash
grep -n "set()" tools/loganalyzer.py
```

```output
54:    blocked = set()
84:        blocklist = set()
```

<!-- lab: nocheck -->
```bash
python3 tools/bench.py
```

```output
analyze         2.367 s
load_blocklist  0.202 s
blocked_ips     0.001 s
50,000 requests from 762 addresses, 20,001 blocklisted (set), 1 seen
```

`blocked_ips` went from the slowest part to the fastest, thousands of times faster than before: each `ip in blocklist` is now one hash lookup, O(1) on average, so the whole check is O(n) for n addresses. Loading the blocklist costs about the same as before, because adding to a set is O(1) too. Now the slowest part is `analyze`, which must read every line of the log anyway. That is a good place to stop: the remaining cost is the work that cannot be skipped.

The result is the same: one blocklisted address seen. A speed-up that changes the answer is a bug, so always check both.

### 7. Run the tool on the big log

The report on a big log is long, so save it in a file and look at its start and its end:

```bash
python3 tools/loganalyzer.py data/big-access.log --top 2 --blocklist data/big-blocklist.txt > report.tmp
head -n 4 report.tmp
tail -n 2 report.tmp
wc -l report.tmp
```

```output
Requests: 50000, broken lines: 0
Top 2 IP addresses:
  198.51.100.178   91
  198.51.100.141   89
Blocklisted addresses seen: 1
  203.0.113.80     51
29071 report.tmp
```

The full report on 50,000 lines takes a few seconds on the test machine, most of it in `analyze`. Because of `random.seed(7)`, your numbers should match these exactly. `wc -l` shows that the report has 29,071 lines: almost all of them are the error list, one line per error. The exercise below fixes that. `report.tmp` is ignored by git thanks to the `*.tmp` line from Module 2, but delete it when you have read it:

```bash
rm report.tmp
```

Why not pipe the report straight into `head`? `head` stops reading after four lines and closes the pipe, and Python then fails with a `BrokenPipeError` while it is still printing errors. A file avoids that, and you can read it as often as you like.

### 8. Test and commit

Add two tests at the end of `tools/test_loganalyzer.py`, and add `blocked_ips` and `load_blocklist` to its import line, so that it reads `from loganalyzer import analyze, blocked_ips, failed_logins, load_blocklist, parse_line`:

```python
def test_blocked_ips():
    ips, errors, broken = analyze([GOOD, FAILED, FAILED])
    assert blocked_ips(ips, {"198.51.100.23", "192.0.2.1"}) == {"198.51.100.23": 2}


def test_load_blocklist(tmp_path):
    path = tmp_path / "blocklist.txt"
    path.write_text("# comment\n203.0.113.80\n\n192.0.2.66\n")
    assert load_blocklist(path) == {"203.0.113.80", "192.0.2.66"}
```

<!-- lab: run
cd ~/mylab
cat >> tools/test_loganalyzer.py <<'EOF'


def test_blocked_ips():
    ips, errors, broken = analyze([GOOD, FAILED, FAILED])
    assert blocked_ips(ips, {"198.51.100.23", "192.0.2.1"}) == {"198.51.100.23": 2}


def test_load_blocklist(tmp_path):
    path = tmp_path / "blocklist.txt"
    path.write_text("# comment\n203.0.113.80\n\n192.0.2.66\n")
    assert load_blocklist(path) == {"203.0.113.80", "192.0.2.66"}
EOF
sed -i 's/^from loganalyzer import analyze, failed_logins, parse_line$/from loganalyzer import analyze, blocked_ips, failed_logins, load_blocklist, parse_line/' tools/test_loganalyzer.py
-->

`tmp_path` is a pytest feature: when a test function has a parameter with that name, pytest gives it a fresh, empty temporary folder, so the test can write a file without touching `mylab`. The `/` joins a folder and a file name, and `write_text` writes a string to the file. The test also checks that the comment and the blank line are skipped.

<!-- lab: nocheck -->
```bash
pytest -q
```

```output
.......                                                                  [100%]
7 passed in 0.68s
```

Now tell git to ignore the big generated files, and commit the rest:

```bash
printf 'data/big-*\n' >> .gitignore
git add .gitignore data/blocklist.txt tools
git status --short
```

```output
M  .gitignore
A  data/blocklist.txt
A  tools/bench.py
M  tools/loganalyzer.py
M  tools/test_loganalyzer.py
```

The two big files do not appear: `data/big-*` matches every name in `data/` that starts with `big-`. Anyone who clones `mylab` recreates them by running `bench.py`.

<!-- lab: nocheck -->
```bash
git commit -m "Add blocklist check and benchmark"
```

```output
[main 13e121a] Add blocklist check and benchmark
 5 files changed, 96 insertions(+), 3 deletions(-)
 create mode 100644 data/blocklist.txt
 create mode 100644 tools/bench.py
```

Your commit number is different. If `mylab` is on GitHub, `git push` sends this step there too.

## Exercise

On the big log, the report lists thousands of errors, one per line. A defender would rather see which paths cause the most errors. Add a function `top_error_paths(errors, n)` to `tools/loganalyzer.py`, above `main`, that returns the n paths with the most errors as `(path, count)` pairs, biggest first. It must be O(number of errors): no loop inside a loop. Then make `bench.py` time it on the big log and print the result.

Hint: you have already used the right tool twice in this file.

<details>
<summary>Show the solution</summary>

Add this function above `main` in `tools/loganalyzer.py`:

```python
def top_error_paths(errors, n):
    """Return the n paths with the most errors, as (path, count) pairs."""
    paths = Counter()
    for e in errors:
        paths[e["path"]] += 1
    return paths.most_common(n)
```

<!-- lab: run
cd ~/mylab
python3 - <<'EOF'
from pathlib import Path
p = Path("tools/loganalyzer.py")
s = p.read_text()
func = '''def top_error_paths(errors, n):
    """Return the n paths with the most errors, as (path, count) pairs."""
    paths = Counter()
    for e in errors:
        paths[e["path"]] += 1
    return paths.most_common(n)


def main():'''
p.write_text(s.replace("def main():", func))
b = Path("tools/bench.py")
s = b.read_text()
s = s.replace("from loganalyzer import analyze, blocked_ips, load_blocklist",
              "from loganalyzer import analyze, blocked_ips, load_blocklist, top_error_paths")
s += 'top = timed("top_error_paths", top_error_paths, errors, 3)\nprint(top)\n'
b.write_text(s)
EOF
-->

In `tools/bench.py`, import it by changing the import line to `from loganalyzer import analyze, blocked_ips, load_blocklist, top_error_paths`, and add two lines at the end:

```python
top = timed("top_error_paths", top_error_paths, errors, 3)
print(top)
```

```bash
python3 tools/bench.py | tail -n 1
```

```output
[('/notes', 4829), ('/admin', 4780), ('/login', 4773)]
```

A `Counter` again: one O(1) update per error, so the function is O(number of errors), and `most_common(3)` picks the three biggest counts without sorting everything. The made-up log spreads its errors evenly over the paths, so the counts are close; on a real log, one path usually stands out. The timing line for `top_error_paths`, cut by `tail` here, showed less than a tenth of the `analyze` time on the test machine. Run `pytest -q` and commit when you are done.

</details>

## Check yourself

**1. In step 5, why was `blocked_ips` the slowest part, even though it does so little per address?**

<details>
<summary>Answer</summary>

`ip in blocklist` on a list is a hidden loop: it compares the address with up to 20,001 entries. Doing that for each of the 762 addresses gives about 15 million comparisons.

</details>

**2. What changed in the code to make it fast, and why did nothing else need to change?**

<details>
<summary>Answer</summary>

`load_blocklist` builds a set instead of a list (`set()` and `add` instead of `[]` and `append`). The rest of the code only uses `ip in blocklist`, which works the same way on a set, but costs O(1) on average instead of O(n).

</details>

**3. Why does `blocked_ips` loop over the `Counter` of addresses and not over the lines of the log?**

<details>
<summary>Answer</summary>

The `Counter` has one entry per different address, 762 in the big log, while the log has 50,000 lines. Checking each address once instead of each line is much less work and gives the same answer, with the counts already attached.

</details>

**4. Why are `data/big-access.log` and `data/big-blocklist.txt` ignored by git, but `bench.py` is committed?**

<details>
<summary>Answer</summary>

The big files are generated and can always be recreated by running `bench.py`, and because of `random.seed(7)` they come out the same every time. The script is the short, useful part to keep.

</details>

**5. After a speed-up, what should you check besides the time?**

<details>
<summary>Answer</summary>

That the result is still the same. A faster version that gives a different answer is a bug. The benchmark prints the number of addresses seen, and the tests check the functions.

</details>

## Common mistakes

- **Running `bench.py` from the wrong folder.** The paths `data/big-access.log` and `data/big-blocklist.txt` are relative, so run it from `~/mylab`. From another folder, it fails or creates files in the wrong place.
- **Guessing instead of measuring.** Many people would have suspected `analyze`, the function that does the most work per line. The benchmark showed that the real problem was elsewhere. Measure first, then change.
- **Trusting one run.** Timings are noisy, as lesson 4.1 showed. Run `bench.py` two or three times and trust the pattern, not one number. The first run also takes longer overall, because it writes the big files before the timings start.
- **Forgetting the empty default in `main`.** If `blocklist` is a list in one place and a set in another, the code still works, but the next reader cannot tell which one is meant. Keep one type everywhere.
- **Leaving spaces or line endings in the blocklist entries.** Without `line.strip()`, the entry would be `"203.0.113.80\n"` and would never match an address. When a lookup never finds anything, print one entry with `repr` to see what is really in it.

## Key terms

- **Benchmark**: a script that runs code on realistic test data and measures how long each part takes, so that changes can be compared.

## Go further

- [Python documentation: The Python Profilers](https://docs.python.org/3/library/profile.html): `cProfile` measures every function of a program at once, the next step after timing parts by hand.
- [Python documentation: Set types](https://docs.python.org/3/library/stdtypes.html#set-types-set-frozenset): every operation on sets, including unions and intersections of two blocklists.
- [pytest: How to use temporary directories and files in tests](https://docs.pytest.org/en/stable/how-to/tmp_path.html): the `tmp_path` feature used in the new test.
