---
title: Explaining a project clearly
description: Explain a project in two minutes with three parts, problem, approach and result, using real numbers from your own commands and words your listener knows.
lesson: "16.2"
time: 20 min
sidebar:
  order: 2
---

<!-- lab: run
rm -rf ~/mylab
mkdir -p ~/mylab/data ~/mylab/tools
cd ~/mylab
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
cat > data/blocklist.txt <<'MYLAB_EOF'
# Addresses seen scanning other servers (made up for practice)
203.0.113.80
192.0.2.66

198.51.100.200
MYLAB_EOF
cat > tools/loganalyzer.py <<'MYLAB_EOF'
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


def filter_status(errors, status):
    """Keep only the errors with the given status code."""
    kept = []
    for e in errors:
        if e["status"] == status:
            kept.append(e)
    return kept


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("logfile", help="the access log to read")
    parser.add_argument("--top", type=int, default=3,
                        help="how many IP addresses to show (default: 3)")
    parser.add_argument("--blocklist",
                        help="a file of IP addresses to flag, one per line")
    parser.add_argument("--status", type=int,
                        help="show only the errors with this status code")
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

    shown = errors
    if args.status is not None:
        shown = filter_status(errors, args.status)

    print(f"Requests: {sum(ips.values())}, broken lines: {broken}")
    print(f"Top {args.top} IP addresses:")
    for ip, count in ips.most_common(args.top):
        print(f"  {ip:15} {count:3}")
    print(f"Errors: {len(shown)}")
    for e in shown:
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
MYLAB_EOF
cat > tools/test_loganalyzer.py <<'MYLAB_EOF'
import subprocess
import sys

from loganalyzer import analyze, blocked_ips, failed_logins, filter_status, load_blocklist, parse_line

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


def test_filter_status():
    ips, errors, broken = analyze([GOOD, FAILED, FAILED])
    assert len(filter_status(errors, 401)) == 2


def test_status_option_from_command_line():
    result = subprocess.run(
        [sys.executable, "tools/loganalyzer.py", "data/sample-access.log", "--status", "404"],
        capture_output=True, text=True)
    assert "Errors: 2" in result.stdout
    assert "Failed logins: 198.51.100.23 x4" in result.stdout
MYLAB_EOF
cd ~
-->

Someone asks you, "So what does your project do?" Most beginners answer by retelling the code in the order they wrote it: first I made a function, then I added a loop, then I fixed a bug. Thirty seconds later the listener is lost, and the interesting part has not come yet. There is a better order, and it fits in two minutes.

## Goal

After this lesson you can:

- Explain a project in three parts: problem, approach, result.
- Back your explanation with real numbers taken from your own commands.
- Fit it into two minutes, and adapt it to the person in front of you.

## Why it matters

You will explain your work all the time: in interviews, in a stand-up meeting, at the top of a README, in a message to a teacher. People decide in the first sentences whether they want to hear more. If those sentences say what problem you solved and what came out of it, they listen to the rest. If they hear a list of functions, they politely wait for you to stop.

## The idea

A clear explanation has three parts, always in this order:

1. **Problem**: what was wrong or missing, and for whom. One or two sentences.
2. **Approach**: what you built and the main choices you made. Not every step, only the ones that matter.
3. **Result**: what it does now, with a fact the listener can check: a number, an example, a short demo.

If there is time, add what you learned and what you would do next. That part shows how you think, and interviewers often ask for it.

This is the order newspapers use. A news article puts the most important facts in the first paragraph, and the details further down, so a reader can stop at any point and still have the main story. Your explanation should survive being cut short in the same way.

Most people speak somewhere around 120 to 150 words per minute when they explain something calmly. So "two minutes" means roughly 250 to 300 words. Write it down once, measure it, and you know where you stand instead of guessing.

Here is the same project told two ways:

| Code order | Problem, approach, result |
|---|---|
| "I wrote a `parse_line` function with `split`, then a `Counter`, then I added argparse, then a `--status` option..." | "Web server logs are too long to read by hand. I built a small Python tool that finds password guessing and scans for secret files in them. On my sample log, it found both in one run." |

The right column says less about the code, and the listener still learns more. If they want the code, they will ask, and that question is a good sign.

## Try it

You explain the log analyzer from `mylab`, as it was after the [Module 15 project step](../ai/project/). The outputs come from a user called `sam`.

### 1. Collect real facts

```bash
cd ~/mylab
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
Failed logins: 198.51.100.23 x4
```

This is the result part of your story, already printed. Two findings stand out: four failed logins from one address, and requests for `.env` and `backup.zip`, files that should never be public. Lesson 11.4, [Logs and what to look for](../system-security/logs-and-what-to-look-for/), showed what such patterns usually mean.

```bash
wc -l < data/sample-access.log
grep -c "^def test_" tools/test_loganalyzer.py
grep '" 401 ' data/sample-access.log | cut -d " " -f 4
```

```output
16
9
[21/Nov/2026:09:59:14
[21/Nov/2026:09:59:15
[21/Nov/2026:09:59:16
[21/Nov/2026:09:59:17
```

Three more facts: the log has 16 lines, there are 9 tests, and the four failed logins came within three seconds, from 09:59:14 to 09:59:17. `grep` keeps the lines with the status 401, and `cut -d " " -f 4` keeps only their fourth field, the time. Every number you say should come from a command like these, not from memory. "Nine tests" is checkable; "lots of tests" is not. If you did the exercise of lesson 15.5, you have 10.

### 2. Write the two-minute version

Create a folder for your notes and save the explanation as a file:

```bash
mkdir -p ~/talk
cd ~/talk
```

```text title="pitch.txt"
Problem: a web server writes one line for every request, and on a busy
day that is thousands of lines. Hidden in them are the things a defender
wants to see: someone guessing passwords, or someone looking for
forgotten files like .env or backup.zip. Nobody reads thousands of
lines by hand.

Approach: I wrote a small command-line tool in Python, using only the
standard library. It reads an access log, skips broken lines instead of
crashing, counts the requests per IP address and lists every error. It
also counts failed logins per address, flags addresses that are on a
blocklist, and an option shows only one status code, for example only
the 404 errors. Nine automated tests check it, including one that runs
it exactly the way a user does.

Result: on my sample log of sixteen lines, one run shows an address
with four failed logins within three seconds, and another one asking
for .env and backup.zip, two files that should never be public. That
is password guessing and a scan for leaked secrets, the two patterns
I wanted to catch.

What I learned: the hard part was not the counting. It was deciding
what to do with bad input, and testing the tool the way it is really
used. One bug passed all my unit tests and only showed up when I ran
the real command.

Next: I want it to follow the log while it grows, the way tail -f
does, instead of reading it once.
```

This text is your **pitch**: a short explanation of a project, or of yourself, prepared in advance so that you can say it without searching for words. The labels `Problem:`, `Approach:` and `Result:` are for you, not for the listener. When you speak, you drop them, but they keep the order straight while you write.

### 3. Measure it

```bash
wc -w pitch.txt
echo "$(( $(wc -w < pitch.txt) * 60 / 140 )) seconds at 140 words per minute"
```

```output
249 pitch.txt
106 seconds at 140 words per minute
```

`wc -w` counts words. The second line uses the shell arithmetic `$(( ))` that you met in lesson 0.6, with `$( )` inside it, which puts the output of a command in its place: words times 60, divided by 140 words per minute. About a hundred seconds, which leaves time for a breath and a question. If your version gives 200 seconds, cut the approach part first: it is the one that grows the most.

### 4. Find the words your listener may not know

```bash
grep -o -w -E "[A-Z]{2,}" pitch.txt | sort -u
```

```output
IP
```

`[A-Z]{2,}` means "two or more capital letters in a row", which finds most abbreviations. Here there is only one. For an engineer, "IP address" is fine. For a recruiter or a friend, say "the address of the computer that sent the request" the first time. The words `.env` and `backup.zip` are not caught by this search, but they need a short explanation too: "files where passwords and copies of data are often kept".

### 5. Prepare a ten-second version and a demo

Someone in a hallway does not have two minutes. Write one sentence that holds all three parts:

```text title="one-line.txt"
I built a Python tool that reads web server logs and points out password guessing and scans for secret files.
```

```bash
wc -w one-line.txt
```

```output
20 one-line.txt
```

Twenty words, under ten seconds. And for the person who says "show me", have a **demo** ready: a short live run of your project that shows its result. Here it is one command with a short, telling output:

```bash
cd ~/mylab
python3 tools/loganalyzer.py data/sample-access.log --status 404 --top 1
```

```output
Requests: 15, broken lines: 1
Top 1 IP addresses:
  198.51.100.23     6
Errors: 2
  404 GET  /.env        from 203.0.113.80
  404 GET  /backup.zip  from 203.0.113.80
Failed logins: 198.51.100.23 x4
```

Seven lines that show both findings. A demo that you have run a minute before is worth more than a long description, and much less risky than one you try for the first time in front of people.

:::tip[Say it out loud]
Read `pitch.txt` aloud once, with a timer. Written sentences that look fine often turn out too long to say in one breath. Every place where you stumble is a sentence to split.
:::

## Exercise

Write a two-minute explanation of the notes app from the [Module 8 project step](../web/project/), in a file `~/talk/notes-app.txt`. Use the three parts and at least one checkable fact. Then check it with the commands from steps 3 and 4, and fix what they show: too long, or abbreviations that a recruiter may not know.

<details>
<summary>Show the solution</summary>

One possible version, saved in `~/talk`:

<!-- lab: run
cd ~/talk
-->

```text title="notes-app.txt"
Problem: I wanted a place to keep short notes from my lab work, and I
wanted to understand how a real web app handles logins, instead of
only reading about it.

Approach: I built a small notes app with Flask, a Python framework for
web apps. The notes are stored in an SQLite database, a database that
lives in one file. Pages are built from HTML templates, and after you
log in, the app remembers you with a signed session cookie, so the
browser cannot change who you are. Users are added from the terminal.
It runs only on my own computer, on 127.0.0.1, on purpose.

Result: two users can log in, and each one sees only their own notes.
Asking for a page without logging in sends you back to the login page,
which I checked with curl.

What I learned: how a browser and a server keep track of a logged-in
user, and why the app was not safe yet: the passwords were still
stored as plain text.
```

```bash
wc -w notes-app.txt
grep -o -w -E "[A-Z]{2,}" notes-app.txt | sort -u
```

```output
170 notes-app.txt
HTML
```

The second command lists the abbreviations: explain each one once, or leave it out for a listener who is not technical. Your text will differ. What counts is the order, a fact that can be checked, and a length under 300 words.

</details>

## Check yourself

**1. What are the three parts of a clear project explanation, in order?**

<details>
<summary>Answer</summary>

Problem, approach, result. If there is time: what you learned and what comes next.

</details>

**2. Why start with the problem instead of with the code?**

<details>
<summary>Answer</summary>

Because the problem tells the listener why the project matters, and that decides whether they keep listening. The code makes sense only once they know what it is for. Like a news article, the explanation should still work if it is cut short.

</details>

**3. About how many words fit in two minutes of calm speaking?**

<details>
<summary>Answer</summary>

Roughly 250 to 300, since most people speak around 120 to 150 words per minute. Measure your text with `wc -w`.

</details>

**4. Where should the numbers in your explanation come from?**

<details>
<summary>Answer</summary>

From commands you have just run on the real project, such as the tool's own output, `wc -l` or `grep -c`. Never from memory or from a guess.

</details>

**5. What changes when you explain the same project to a recruiter instead of an engineer?**

<details>
<summary>Answer</summary>

The order stays the same, but you explain or remove the abbreviations and the tool names, and you spend more time on the problem and the result than on the approach. An engineer will usually ask about the approach.

</details>

## Common mistakes

- **Starting with the tools.** "I used Python, Flask, SQLite and pytest" is not a story. Start with the problem; the tools belong in the approach.
- **Telling every step.** The approach part is not a diary. Keep the two or three choices that mattered and drop the rest.
- **Vague results.** "It works well" says nothing. Give a number, an example, or a short demo.
- **Claiming what you did not do.** If a classmate wrote half of it, or an AI wrote a function, say so. A good question about that part will come, and the truth is easier to defend.
- **A live demo you never tried.** Run the demo command just before you speak, and keep its output ready in case something fails.

## Key terms

- **Problem, approach, result**: a three-part order for explaining a project: what was wrong, what you did about it, and what came out, with a fact that can be checked.
- **Pitch**: a short spoken explanation of a project or of yourself, prepared in advance.
- **Demo**: a short live run of your project that shows its result, chosen and tested in advance.

## Go further

- [Write the Docs: A beginner's guide to writing documentation](https://www.writethedocs.org/guide/writing/beginners-guide-to-docs/): why and how to explain a project to people who have never seen it.
- [GNU Coreutils: wc invocation](https://www.gnu.org/software/coreutils/manual/html_node/wc-invocation.html): every way `wc` can count lines, words and characters.
- [Google Technical Writing One](https://developers.google.com/tech-writing/one): a free course on short, clear technical sentences.
