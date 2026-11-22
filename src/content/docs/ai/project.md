---
title: "Project step: one AI-assisted feature, reviewed"
description: Add a --status option to the mylab log analyzer with help from an AI assistant, review and fix the change, test it the way a user runs it, and record how you checked it in docs/ai-log.md.
lesson: "15.5"
time: 25 min
sidebar:
  order: 5
---

<!-- lab: run
sudo apt-get install -y -qq python3-venv > /dev/null 2>&1
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs ~/mylab/tools ~/mylab/app/templates ~/mylab/app/static ~/mylab/docs ~/mylab/tests ~/mylab/writeups
cd ~/mylab
printf '# mylab\n\nMy lab for the PID 1 course.\n' > README.md
printf '.env\n*.tmp\n.venv/\n__pycache__/\ndata/big-*\nlogs/*.log\ndata/mylab.db\n' > .gitignore
printf '#!/bin/bash\necho sysinfo\n' > scripts/sysinfo.sh
printf '#!/bin/bash\necho backup\n' > scripts/backup.sh
printf '#!/bin/bash\necho check\n' > scripts/check-writeups.sh
chmod +x scripts/*.sh
printf '# watch logins\n' > tools/watch_logins.py
printf '# app\n' > app/app.py
printf '# db\n' > app/db.py
printf '# threat model\n' > docs/threat-model.md
printf '# TLS notes\n' > docs/tls-notes.md
printf '# hardening\n' > docs/hardening.md
printf '# security tests\n' > tests/test_security.py
printf '# Write-ups\n' > writeups/README.md
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
EOF
cat > data/blocklist.txt <<'EOF'
# Addresses seen scanning other servers (made up for practice)
203.0.113.80
192.0.2.66

198.51.100.200
EOF
cat > tools/bench.py <<'EOF'
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
EOF
cat > tools/test_loganalyzer.py <<'EOF'
from loganalyzer import analyze, blocked_ips, failed_logins, load_blocklist, parse_line

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


def test_blocked_ips():
    ips, errors, broken = analyze([GOOD, FAILED, FAILED])
    assert blocked_ips(ips, {"198.51.100.23", "192.0.2.1"}) == {"198.51.100.23": 2}


def test_load_blocklist(tmp_path):
    path = tmp_path / "blocklist.txt"
    path.write_text("# comment\n203.0.113.80\n\n192.0.2.66\n")
    assert load_blocklist(path) == {"203.0.113.80", "192.0.2.66"}
EOF
python3 -m venv .venv
.venv/bin/pip install -q pytest
.venv/bin/pip freeze > requirements.txt
git init -q
git add .
git commit -q -m "mylab after Module 14"
cd ~
-->

So far in this module you practised on small files in `~/ailab`. Now the work counts: you add a feature to `mylab`, the project you will show to other people, with help from an AI assistant. The feature is small on purpose. What makes this step worth showing is not the code. It is the record of how you checked it.

## Goal

After this lesson you can:

- Add a feature to your own project with AI help, following the routine of this module: request, review, test, fix.
- Write a test that checks a feature the way a user runs it.
- Keep a short log of how you used AI and how you checked the result.

## Why it matters

Many teams use AI assistants now, and they ask a simple question: how do you know it works? A log that answers it, next to the code, shows that you can use these tools without being used by them. And when a bug turns up in three months, the log says which parts came from an assistant and what was checked.

## The idea

The log analyzer from the [Module 3 project step](../python/project/), with the blocklist check that the [Module 4 project step](../algorithms/project/) added, prints every error in the log. On a real server that is hundreds of lines. You want an option, `--status 404`, that lists only the errors with one status code.

You follow the routine of this module in order: a clear request (lesson 15.1), a review of every changed line (lesson 15.2), a bug found, reproduced and fixed (lesson 15.3), and a look at what the change might quietly break (lesson 15.4). At the end you write it all down in a new file.

```text
mylab/
    docs/
        ai-log.md               new: how AI was used and how it was checked
    tools/
        loganalyzer.py          changed: a --status option
        test_loganalyzer.py     changed: two more tests
    ...                         everything from earlier modules
```

The log is like a lab notebook in a chemistry course: not the result itself, but what you did, what you saw and what you concluded, so that someone else can check your work.

## Try it

This step uses `mylab` as you left it after Module 14: the analyzer and its tests as Module 4 left them, with the `--blocklist` option, and the venv from Module 3. If you did the exercise of lesson 4.10, your file also has `top_error_paths`, so the `grep` in step 2 shows one more line, and some line numbers differ. The assistant's answer in step 3 is a fixed text that I wrote for this lesson, so that everybody reviews the same change. If you use a real assistant, your answer will differ, and you review it with the same steps.

### 1. Start from a clean, tested state

```bash
cd ~/mylab
source .venv/bin/activate
git status --short
python3 tools/loganalyzer.py data/sample-access.log > /tmp/before.txt
tail -n 3 /tmp/before.txt
```

```output
  404 GET  /backup.zip  from 203.0.113.80
  500 GET  /notes       from 203.0.113.5
Failed logins: 198.51.100.23 x4
```

`git status --short` prints nothing, so every change from now on belongs to this step. You save today's full report in `/tmp/before.txt`: at the end, it proves that the report without the new option has not changed.

<!-- lab: nocheck -->
```bash
pytest -q
```

```output
.......                                                                  [100%]
7 passed in 0.71s
```

Seven tests pass before you touch anything. Your time will differ.

### 2. Write the request

Collect the context from the file itself, then work out the expected result with a tool you trust:

```bash
grep -n -e 'def ' -e 'add_argument' tools/loganalyzer.py
grep -c '" 404 ' data/sample-access.log
```

```output
8:def parse_line(line):
25:def analyze(lines):
43:def failed_logins(errors):
52:def load_blocklist(path):
63:def blocked_ips(ips, blocklist):
72:def main():
74:    parser.add_argument("logfile", help="the access log to read")
75:    parser.add_argument("--top", type=int, default=3,
77:    parser.add_argument("--blocklist",
2
```

The first `grep` gives you the outline of the file: its functions and its options, with line numbers. The second counts the lines with the status `404`: two. The quote and the spaces around `404` make sure that it matches the status field and not a size such as `1404`.

Now the request, with the four parts from lesson 15.1. Paste `main()` from your own file where the text says so:

```text
Context: a Python 3.12 command-line tool, tools/loganalyzer.py, standard
library only. analyze() returns a list of errors; each error is a dict with
the keys ip, method, path and status (an int). main() uses argparse and
prints the report. Here is main(): [paste it]

Goal: a --status option. With --status 404, the report lists only the
errors with status 404.

Limits:
- Standard library only.
- Without --status, the report must not change at all.
- Put the filtering in a function that I can test, and add a test.

Example: on my sample log, --status 404 must list exactly 2 errors,
GET /.env and GET /backup.zip, both from 203.0.113.80.
```

Notice the second limit. "Do not change what already works" is the limit that people forget most, and the one that is broken most often.

### 3. Apply the answer

The assistant answers with three changes for `tools/loganalyzer.py` and one test. First, a new function above `main`:

```python
def filter_status(errors, status):
    """Keep only the errors with the given status code."""
    kept = []
    for e in errors:
        if e["status"] == status:
            kept.append(e)
    return kept
```

Second, a new option, right after `--blocklist`:

```python
    parser.add_argument("--status",
                        help="show only the errors with this status code")
```

Third, two lines in `main`, right before the first `print`:

```python
    if args.status:
        errors = filter_status(errors, args.status)
```

And a test at the end of `tools/test_loganalyzer.py`, with `filter_status` added to the import on its first line:

```python
def test_filter_status():
    ips, errors, broken = analyze([GOOD, FAILED, FAILED])
    assert len(filter_status(errors, 401)) == 2
```

Make the four changes in your editor.

<!-- lab: run
cd ~/mylab
python3 - <<'PYEOF'
from pathlib import Path
p = Path("tools/loganalyzer.py")
s = p.read_text()
func = '''def filter_status(errors, status):
    """Keep only the errors with the given status code."""
    kept = []
    for e in errors:
        if e["status"] == status:
            kept.append(e)
    return kept


def main():'''
s = s.replace("def main():", func)
top = '''                        help="a file of IP addresses to flag, one per line")
'''
assert top in s
s = s.replace(top, top + '''    parser.add_argument("--status",
                        help="show only the errors with this status code")
''')
first = '''    print(f"Requests: {sum(ips.values())}, broken lines: {broken}")
'''
s = s.replace(first, '''    if args.status:
        errors = filter_status(errors, args.status)

''' + first)
p.write_text(s)
t = Path("tools/test_loganalyzer.py")
s = t.read_text()
old = "from loganalyzer import analyze, blocked_ips, failed_logins, load_blocklist, parse_line"
assert old in s
s = s.replace(old, "from loganalyzer import analyze, blocked_ips, failed_logins, filter_status, load_blocklist, parse_line")
s += '''

def test_filter_status():
    ips, errors, broken = analyze([GOOD, FAILED, FAILED])
    assert len(filter_status(errors, 401)) == 2
'''
t.write_text(s)
PYEOF
-->

### 4. Read the whole change

```bash
git diff tools/loganalyzer.py
```

```output
diff --git a/tools/loganalyzer.py b/tools/loganalyzer.py
index bcec2b2..637091c 100644
--- a/tools/loganalyzer.py
+++ b/tools/loganalyzer.py
@@ -69,6 +69,15 @@ def blocked_ips(ips, blocklist):
     return found
 
 
+def filter_status(errors, status):
+    """Keep only the errors with the given status code."""
+    kept = []
+    for e in errors:
+        if e["status"] == status:
+            kept.append(e)
+    return kept
+
+
 def main():
     parser = argparse.ArgumentParser(description=__doc__)
     parser.add_argument("logfile", help="the access log to read")
@@ -76,6 +85,8 @@ def main():
                         help="how many IP addresses to show (default: 3)")
     parser.add_argument("--blocklist",
                         help="a file of IP addresses to flag, one per line")
+    parser.add_argument("--status",
+                        help="show only the errors with this status code")
     args = parser.parse_args()
 
     try:
@@ -88,6 +99,9 @@ def main():
         print(f"error: {error.filename} not found", file=sys.stderr)
         sys.exit(1)
 
+    if args.status:
+        errors = filter_status(errors, args.status)
+
     print(f"Requests: {sum(ips.values())}, broken lines: {broken}")
     print(f"Top {args.top} IP addresses:")
     for ip, count in ips.most_common(args.top):
```

`git diff` shows what changed since the last commit: lines with `+` are new, and the lines around them are there for orientation. The `index` line holds short codes for the two versions of the file, and yours will differ. This is the view to review, because it shows only what is new. Read every `+` line and say what it does, as in lesson 15.2.

Two questions should come up. Where does `args.status` come from, and what type is it? And the line `errors = filter_status(...)` replaces the error list: who else uses `errors` further down? Keep both questions in mind, and run the tests.

<!-- lab: nocheck -->
```bash
pytest -q
```

```output
........                                                                 [100%]
8 passed in 0.73s
```

Eight tests pass, including the new one. It is tempting to stop here.

### 5. Run it the way a user does

```bash
python3 tools/loganalyzer.py data/sample-access.log --status 404 | tail -n 3
```

```output
  203.0.113.5       4
  203.0.113.80      3
Errors: 0
```

Your request said two errors. The tool says none, and the "Failed logins" line is gone too. Every test passed, and the feature does not work.

### 6. Find the cause

The first question from step 4 was about the type of `args.status`. Make the smallest example, as in lesson 15.3: an argument parser with only that option.

```bash
python3 -c "import argparse; p = argparse.ArgumentParser(); p.add_argument('--status'); print(repr(p.parse_args(['--status', '404']).status))"
python3 -c "print(404 == '404')"
```

```output
'404'
False
```

`repr` shows a value the way Python writes it, quotes included, so you can see that `argparse` gives you the text `'404'`, not the number. Without `type=int`, every option arrives as a string. The status in each error is an `int`, and Python never treats a number and a string as equal, so `filter_status` keeps nothing.

And the AI's test? It called `filter_status(errors, 401)` with a real number, so it never met the string that the command line produces. A test written together with the code can share the code's mistake.

The second question explains the missing line: `errors = filter_status(...)` replaced the full list, and `failed_logins(errors)` near the end of `main` now gets the filtered one. (The blocklist check works on `ips`, not on `errors`, so it is not affected.) You did not ask for that change, and the limit "without `--status`, nothing changes" did not catch it, because it happens only with the option.

### 7. Write a test that fails for the right reason

Before you fix anything, write a test that runs the tool as a user does, with `subprocess` from lesson 3.10. Add it to the end of `tools/test_loganalyzer.py`, and add `import subprocess` and `import sys` at the very top of the file:

```python
def test_status_option_from_command_line():
    result = subprocess.run(
        [sys.executable, "tools/loganalyzer.py", "data/sample-access.log", "--status", "404"],
        capture_output=True, text=True)
    assert "Errors: 2" in result.stdout
    assert "Failed logins: 198.51.100.23 x4" in result.stdout
```

<!-- lab: run
cd ~/mylab
python3 - <<'PYEOF'
from pathlib import Path
t = Path("tools/test_loganalyzer.py")
s = t.read_text()
s = "import subprocess\nimport sys\n\n" + s
s += '''

def test_status_option_from_command_line():
    result = subprocess.run(
        [sys.executable, "tools/loganalyzer.py", "data/sample-access.log", "--status", "404"],
        capture_output=True, text=True)
    assert "Errors: 2" in result.stdout
    assert "Failed logins: 198.51.100.23 x4" in result.stdout
'''
t.write_text(s)
PYEOF
-->

`sys.executable` is the path of the Python that runs the tests, the one in your venv. The test checks the two things that went wrong: the number of errors, and the failed logins line. Run the tests from `~/mylab`, because the paths in the test are relative to it:

<!-- lab: nocheck -->
```bash
pytest -q | tail -n 2
```

```output
FAILED tools/test_loganalyzer.py::test_status_option_from_command_line - Asse...
1 failed, 8 passed in 2.54s
```

pytest cuts the long line to fit the screen; run `pytest -q` without `tail` to see the whole assertion. The new test fails, and it fails because of the bug, which is what you wanted to see. A test that has never failed has never proved anything.

### 8. Fix the two problems

In `main`, add `type=int` to the option:

```python
    parser.add_argument("--status", type=int,
                        help="show only the errors with this status code")
```

Then filter into a new list, `shown`, and use it only for the error lines, so that `failed_logins` still gets every error:

```python
    shown = errors
    if args.status is not None:
        shown = filter_status(errors, args.status)
```

and change the two lines that print the errors:

```python
    print(f"Errors: {len(shown)}")
    for e in shown:
```

`is not None` asks exactly "was the option given?", which `if args.status:` only approximates.

<!-- lab: run
cd ~/mylab
python3 - <<'PYEOF'
from pathlib import Path
p = Path("tools/loganalyzer.py")
s = p.read_text()
pairs = [
    ('    parser.add_argument("--status",\n', '    parser.add_argument("--status", type=int,\n'),
    ("    if args.status:\n        errors = filter_status(errors, args.status)\n", "    shown = errors\n    if args.status is not None:\n        shown = filter_status(errors, args.status)\n"),
    ('    print(f"Errors: {len(errors)}")\n    for e in errors:\n', '    print(f"Errors: {len(shown)}")\n    for e in shown:\n'),
]
for old, new in pairs:
    assert old in s, old
    s = s.replace(old, new)
p.write_text(s)
PYEOF
-->

### 9. Check all three things

```bash
python3 tools/loganalyzer.py data/sample-access.log --status 404
```

```output
Requests: 15, broken lines: 1
Top 3 IP addresses:
  198.51.100.23     6
  203.0.113.5       4
  203.0.113.80      3
Errors: 2
  404 GET  /.env        from 203.0.113.80
  404 GET  /backup.zip  from 203.0.113.80
Failed logins: 198.51.100.23 x4
```

The failing case works: two errors, the two you predicted in step 2, and the failed logins line is back. Now the report without the option, against the copy you saved in step 1, and an input that is not a number:

```bash
python3 tools/loganalyzer.py data/sample-access.log | diff /tmp/before.txt - && echo "report unchanged"
python3 tools/loganalyzer.py data/sample-access.log --status abc
echo "exit status: $?"
```

```output
report unchanged
usage: loganalyzer.py [-h] [--top TOP] [--blocklist BLOCKLIST]
                      [--status STATUS]
                      logfile
loganalyzer.py: error: argument --status: invalid int value: 'abc'
exit status: 2
```

No regression: without `--status`, the report is the same to the last character. And a status that is not a number is refused by `argparse` itself, with exit status 2, because `type=int` also checks the input. With three options, the usage line is too long for one line, so `argparse` spreads it over three.

<!-- lab: nocheck -->
```bash
pytest -q
```

```output
.........                                                                [100%]
9 passed in 1.40s
```

All nine tests pass, including the one that failed in step 7.

### 10. Write the log

Create `docs/ai-log.md`. Use your own date, and describe your own session if your assistant answered differently:

```markdown title="docs/ai-log.md"
# AI log

How I used AI tools in mylab, and how I checked what they gave me.
Rule: nothing is committed that I have not read, run and tested.

## 2026-11-21: --status option for the log analyzer

- Tool: an AI chat assistant
- Files: tools/loganalyzer.py, tools/test_loganalyzer.py

### Request

A --status option that lists only the errors with one status code.
Limits: standard library only, no change without --status, a function
I can test. Example: --status 404 on data/sample-access.log lists 2 errors.

### What the AI gave

A filter_status() function, the --status option, two lines in main()
and one test.

### How I checked it

1. Read the diff line by line.
2. Ran the tests: all passed, including the new one.
3. Ran the real command: --status 404 printed "Errors: 0" instead of 2,
   and the "Failed logins" line was gone.
4. Cause: argparse gives "404" as a string, and 404 == "404" is False.
   The AI's test passed an int, so it could not see the problem.
5. Cause of the missing line: the filter replaced the list that
   failed_logins() uses.

### What I changed

- Added type=int to --status.
- Filtered into a new list, shown; failed_logins() still gets every error.
- Added a test that runs the command the way a user does. It failed
  before the fix and passes after it.

### Result

--status 404 lists the 2 expected errors. Without --status the report is
unchanged (checked with diff). --status abc is refused. 9 tests pass.

### What I learned

A test written together with the code can share its mistake.
Test the feature the way it is used.
```

Someone who reads this file knows what came from the assistant, what you checked, what you changed and how you know it works. That is far more convincing than "built with AI".

### 11. Commit the step

```bash
git add tools docs/ai-log.md
git status --short
```

```output
A  docs/ai-log.md
M  tools/loganalyzer.py
M  tools/test_loganalyzer.py
```

Two changed files and one new one, nothing else. The `.venv` and `/tmp/before.txt` stay out: the first is ignored, the second is outside the repository.

<!-- lab: nocheck -->
```bash
git commit -m "Add --status option to the log analyzer, reviewed (see docs/ai-log.md)"
```

```output
[main 29cab5b] Add --status option to the log analyzer, reviewed (see docs/ai-log.md)
 3 files changed, 82 insertions(+), 3 deletions(-)
 create mode 100644 docs/ai-log.md
```

Your commit number will differ. If `mylab` is on GitHub, send the step there with `git push`, as in Module 2.

## Exercise

`--status 200` is accepted, but it can only ever print `Errors: 0`, because the report lists errors only, and errors start at 400. Make the tool refuse any status below 400 with a clear message. Use `parser.error("...")`: it prints the usage line and your message, and exits with status 2, like the refusal of `abc` in step 9. Then:

1. Check that `--status 200` is refused and `--status 404` still works.
2. Add a test for the refusal.
3. Add a short entry for this change to `docs/ai-log.md`, even if you wrote it without any AI. "No AI used" is a valid entry, and it keeps the log complete.

<details>
<summary>Show the solution</summary>

In `main`, right after `args = parser.parse_args()`:

```python
    if args.status is not None and args.status < 400:
        parser.error("--status must be 400 or more: the report lists errors only")
```

<!-- lab: run
cd ~/mylab
python3 - <<'PYEOF'
from pathlib import Path
p = Path("tools/loganalyzer.py")
s = p.read_text()
old = "    args = parser.parse_args()\n"
assert old in s
s = s.replace(old, old + '    if args.status is not None and args.status < 400:\n        parser.error("--status must be 400 or more: the report lists errors only")\n')
p.write_text(s)
t = Path("tools/test_loganalyzer.py")
t.write_text(t.read_text() + '''

def test_status_below_400_is_refused():
    result = subprocess.run(
        [sys.executable, "tools/loganalyzer.py", "data/sample-access.log", "--status", "200"],
        capture_output=True, text=True)
    assert result.returncode == 2
    assert "400 or more" in result.stderr
''')
PYEOF
cat >> docs/ai-log.md <<'MDEOF'

## 2026-11-21: refuse --status below 400

- Tool: no AI used
- Change: --status below 400 is refused with a message and exit status 2.
- Checked: --status 200 is refused, --status 404 still lists 2 errors,
  and a new test checks the refusal. 10 tests pass.
MDEOF
-->

```bash
python3 tools/loganalyzer.py data/sample-access.log --status 200
echo "exit status: $?"
python3 tools/loganalyzer.py data/sample-access.log --status 404 | grep '^Errors'
```

```output
usage: loganalyzer.py [-h] [--top TOP] [--blocklist BLOCKLIST]
                      [--status STATUS]
                      logfile
loganalyzer.py: error: --status must be 400 or more: the report lists errors only
exit status: 2
Errors: 2
```

The test, at the end of `tools/test_loganalyzer.py`. `parser.error` writes to the error output, so the test looks in `stderr`:

```python
def test_status_below_400_is_refused():
    result = subprocess.run(
        [sys.executable, "tools/loganalyzer.py", "data/sample-access.log", "--status", "200"],
        capture_output=True, text=True)
    assert result.returncode == 2
    assert "400 or more" in result.stderr
```

<!-- lab: nocheck -->
```bash
pytest -q
```

```output
..........                                                               [100%]
10 passed in 2.07s
```

And the new entry at the end of `docs/ai-log.md`:

```bash
tail -n 6 docs/ai-log.md
```

```output
## 2026-11-21: refuse --status below 400

- Tool: no AI used
- Change: --status below 400 is refused with a message and exit status 2.
- Checked: --status 200 is refused, --status 404 still lists 2 errors,
  and a new test checks the refusal. 10 tests pass.
```

Commit both files together: `git add tools docs/ai-log.md`, then `git commit -m "Refuse --status below 400"`.

</details>

## Check yourself

**1. Why save the report in `/tmp/before.txt` before changing anything?**

<details>
<summary>Answer</summary>

To prove at the end that the report without the new option has not changed. `diff` compares the old and the new report character by character, which checks the limit "without `--status`, nothing changes".

</details>

**2. All eight tests passed in step 4, but the feature did not work. How is that possible?**

<details>
<summary>Answer</summary>

The new test called `filter_status` with the number `401`. The command line gives the text `'404'`, which never equals a number. The test checked a case that the real program never produces, so it shared the code's mistake.

</details>

**3. Why does the test in step 7 use `subprocess` instead of calling a function?**

<details>
<summary>Answer</summary>

Because it runs the tool exactly as a user does, with the option typed as text on the command line. That goes through `argparse` and `main`, where the bug was.

</details>

**4. Why should the new test fail before the fix?**

<details>
<summary>Answer</summary>

A test that fails on the bug and passes after the fix proves that it can tell the two apart. A test that has never failed might pass whatever the code does.

</details>

**5. What belongs in an entry of `docs/ai-log.md`?**

<details>
<summary>Answer</summary>

What you asked for, what the AI gave, how you checked it, what you changed, the result, and what you learned. Even a change made without AI gets a short entry, so that the log stays complete.

</details>

## Common mistakes

- **Stopping when the tests pass.** Run the feature the way a user does, on the example from your request.
- **Reviewing the whole file instead of the diff.** `git diff` shows exactly the new lines. Read every one.
- **Fixing before reproducing.** Write the failing test first, see it fail, then fix.
- **Writing "used AI" and nothing else in the log.** The value of the log is the checks. Say what you ran and what it showed.
- **Logging only the changes that went well.** The entry where the AI was wrong is the one that teaches you, and the one that shows a reader how you work.

## Key terms

- **AI log**: a file in a project that records which changes were made with AI help and how each one was checked.

## Go further

- [Python documentation: argparse](https://docs.python.org/3/library/argparse.html): the `type` argument, `parser.error` and everything else used in this step.
- [Git Book: Recording changes](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository): `git status` and `git diff`, with examples of reading a diff.
- [pytest: How to use assertions](https://docs.pytest.org/en/stable/how-to/assert.html): what pytest shows when an assertion fails, and how to read it.
