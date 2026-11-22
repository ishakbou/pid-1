---
title: "Cheat sheet: Working with AI checklist"
description: The request format, the review routine, the debugging request, the four dangers and the commands that check them, from Module 15 on one printable page.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## The rule

AI-written code becomes your code when you keep it. Keep nothing you have not read, run and tested, and nothing you cannot explain.

## A clear request

| Part | Answers | Example |
|---|---|---|
| Context | What do I have? | Versions copied from the terminal, two real lines of sample data |
| Goal | What exactly do I want? | One task, with the file name, its argument and its output |
| Limits | What must the answer respect? | Standard library only, skip broken lines, do not change what works |
| Example | What is a correct result? | A small input and the exact output you worked out yourself |

End with: "If anything is unclear, ask me before you write code."

## Reviewing AI-written code

1. **Read every line.** Say what it does. Mark what you cannot explain and what does not match the request.
2. **Run it on your example.** Compare with the expected output using `diff`.
3. **Test the edge cases.** Empty input, a broken line, a missing argument, a wrong type.
4. **Decide.** Keep it, fix it, or ask again with a better request.

| Usual mistake | Where to look |
|---|---|
| Happy path only | Empty file, cut-off line, missing argument |
| A limit followed in form only | Is the check before the line that can fail? |
| Code that runs on import | Work outside any function; use `if __name__ == "__main__":` |
| A test that shares the code's mistake | Test the way a user runs it, for example with `subprocess` |
| Changes you did not ask for | Read the whole `git diff`, not only the new function |

## Debugging with AI

| Give | Example |
|---|---|
| The command | `python3 ip_counts.py old.log` |
| The full error | The last lines of the traceback, copied |
| A minimal reproduction | `python3 -c "open('tiny.txt', encoding='utf-8').read()"` |
| Expected and actual | "The count for all 4 lines" and "a crash" |
| What you tried | `file old.log` says ISO-8859 text |

After any suggested fix, check three things: the failing case no longer fails, its result is correct, and what worked before gives the same result (no regression). Undo a fix that did not work before you try the next one.

## When not to trust AI

| Danger | How to check |
|---|---|
| Made-up function | `python3 -c "from collections import Counter; print(hasattr(Counter, 'top'))"` |
| Made-up option | `grep --help \| grep -e '--count'` |
| Made-up package | Look it up on pypi.org before you install it |
| Outdated advice | Read the `DeprecationWarning`; check the docs for your version |
| Insecure code | Look for input glued into SQL or a shell command, secrets in code, `eval()`, `verify=False`, `chmod 777` |
| Private data | Search, redact, then read the copy before you paste it |

## Commands from this module

| Command | What it does |
|---|---|
| `awk 'NF != 10' sample.log` | Prints the lines that do not have 10 fields |
| `cut -d ' ' -f 9 sample.log \| sort \| uniq -c \| sort -rn` | Counts each status code, the expected result |
| `diff expected.txt actual.txt && echo "same as expected"` | Compares two files; prints nothing when they are equal |
| `python3 tool.py log \| diff expected.txt -` | Compares a command's output with a file (`-` is the pipe) |
| `python3 -c "from status_counts import count_statuses"` | Imports a file the way a test does |
| `file old.log` | Guesses the type and encoding of a file from its bytes |
| `cat -v old.log` | Shows unusual bytes, for example `e9` as `M-i` |
| `cmd 2>&1 \| tail -n 3` | Shows the last lines of the output, errors included |
| `git diff tools/loganalyzer.py` | Shows the lines changed since the last commit |
| `grep -n -i -E 'key\|password\|secret\|token\|email' app.env` | Finds lines that may hold secrets or personal data |
| `sed -E 's/^([A-Z_]*(KEY\|PASSWORD\|SECRET\|TOKEN\|EMAIL)[A-Z_]*)=.*/\1=REDACTED/' app.env > app-share.env` | Makes a copy with those values hidden |

## Safer Python

| Instead of | Write |
|---|---|
| Script code at the top level | `def main():` and `if __name__ == "__main__": main()` |
| `open(path, encoding="utf-8")` on logs with odd bytes | `open(path, encoding="utf-8", errors="replace")`, or the real encoding |
| `datetime.datetime.utcnow()` | `datetime.datetime.now(datetime.UTC)` |
| `f"... WHERE owner = '{owner}'"` | `con.execute("... WHERE owner = ?", (owner,))` |
| `subprocess.run(f"tail {name}", shell=True)` | `subprocess.run(["tail", name])` |
| `parser.add_argument("--status")` for a number | `parser.add_argument("--status", type=int)` |
| A silent wrong answer for a bad option | `parser.error("message")`: usage line, message, exit status 2 |

## An entry in docs/ai-log.md

| Section | What goes in it |
|---|---|
| Heading | Date and feature |
| Tool and files | Which assistant, or "no AI used"; which files changed |
| Request | Goal, limits and example, in short |
| What the AI gave | The change, in one or two lines |
| How I checked it | What you ran and what it showed, mistakes included |
| What I changed | Your fixes and new tests |
| Result | The final checks: expected output, no regression, tests passing |
| What I learned | One sentence to remember next time |
