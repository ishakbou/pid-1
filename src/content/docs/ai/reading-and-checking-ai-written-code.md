---
title: Reading and checking AI-written code
description: Review code from an AI assistant the way you would review a teammate's change, by reading every line, running it on your example, testing the edge cases and fixing what you find.
lesson: "15.2"
time: 25 min
sidebar:
  order: 2
---

<!-- lab: run
sudo apt-get install -y -qq python3-venv > /dev/null 2>&1
mkdir -p ~/ailab/requests
cd ~/ailab/requests
cat > sample.log <<'EOF'
203.0.113.5 - - [21/Nov/2026:09:58:01 +0000] "GET / HTTP/1.1" 200 1043
198.51.100.23 - - [21/Nov/2026:09:59:14 +0000] "POST /login HTTP/1.1" 401 92
198.51.100.23 - - [21/Nov/2026:09:59:15 +0000] "POST /login HTTP/1.1" 401 92
203.0.113.80 - - [21/Nov/2026:10:04:12 +0000] "GET /.env HTTP/1.1" 404 153
203.0.113.5 - - [21/Nov/2026:10:05:30 +0000] "GET /notes HTTP/1.1" 500 61
203.0.113.80 - - [21/Nov/2026:10:06:
198.51.100.23 - - [21/Nov/2026:10:06:02 +0000] "POST /login HTTP/1.1" 200 640
EOF
cd ~
-->

Here is a question worth a minute of thought: if a script runs without an error, is it correct? Most beginners say yes. In this lesson you meet code that crashes, code that behaves well until someone imports it, and code that prints a believable wrong number. All of it is the kind of code an AI assistant writes every day.

## Goal

After this lesson you can:

- Read AI-written code line by line and write down what looks wrong before you run it.
- Run it on the example from your request and on the edge cases it forgot.
- Recognize the usual mistakes in AI-written code and fix them.

## Why it matters

When you put code into your project, it becomes your code. If it crashes on a server at night, nobody asks which tool wrote it. AI-written code is often close to right, which makes it more dangerous than code that is obviously wrong: it looks finished, it runs on the first try, and the mistake waits for the one input you did not try. A short, fixed routine catches most of these mistakes in a few minutes.

## The idea

Treat an answer from an assistant like a pull request from a new teammate. The teammate is probably skilled, and the change is probably good. You still read it before you merge it, because you do not know yet, and because after the merge it is yours. This is the **code review** you met with pull requests in lesson 2.6: reading someone else's change carefully before you accept it.

The routine has four steps:

1. **Read every line.** For each line, say what it does. Mark every line you cannot explain, and every place where the code does not match your request.
2. **Run it on your example.** The request from lesson 15.1 has a small input and the output you expect. Run the code on that input and compare.
3. **Test the edge cases.** An **edge case** is an input at the border of what the code expects: an empty file, a broken line, a missing argument. The normal case, where every input looks as expected, is called the **happy path**. AI-written code is usually good on the happy path and weak on the edges.
4. **Decide.** Keep it, fix it, or throw it away and ask again with a better request. Keep nothing you cannot explain.

Some mistakes show up again and again in AI-written code. Knowing them tells you where to look first:

| Mistake | What it looks like |
|---|---|
| Happy path only | Works on clean data, crashes on an empty file or a cut-off line |
| A limit followed in form only | The check you asked for is there, but in the wrong place |
| Code that runs on import | Work done at the top level of the file, outside any function |
| Silent failure | `except: pass`, or a wrong result instead of an error |
| Changes you did not ask for | Renamed functions, a new package, other code rewritten |
| Invented names | A function, option or package that does not exist (lesson 15.4) |

## Try it

You check the answer to the request you wrote in lesson 15.1. Real answers differ from one assistant to the next and from one day to the next, so this lesson gives one fixed answer that everybody can work on. I wrote it with mistakes that real answers often contain.

### 1. Set up the folder

```bash
mkdir -p ~/ailab/review
cd ~/ailab/review
cp ../requests/sample.log .
```

`sample.log` is the seven-line sample from lesson 15.1, with one cut-off line.

### 2. Save the answer

The assistant's answer is this script. Save it as `status_counts.py`, but do not run it yet.

```python title="status_counts.py"
import sys
from collections import Counter


def count_statuses(lines):
    counts = Counter()
    skipped = 0
    for line in lines:
        parts = line.split()
        status = parts[8]
        if len(parts) != 10:
            skipped += 1
            continue
        counts[status] += 1
    return counts, skipped


counts, skipped = count_statuses(open(sys.argv[1]))
for status, n in counts.most_common():
    print(f"{status}: {n}")
print(f"skipped: {skipped}")
```

It is short and it looks like it follows the request: a function, a `Counter`, a check for 10 fields, a skipped count.

### 3. Read every line before you run it

Go through the file from top to bottom and say what each line does. Compare with the limits of your request. Here is what a careful reading finds:

- Line 10, `status = parts[8]`, takes the ninth piece of the line. Line 11 checks whether there are 10 pieces. The check comes one line too late: on a short line, `parts[8]` does not exist.
- Lines 18 to 21 are outside any function. They run every time Python loads the file, even when another file only wants `count_statuses`.
- Line 18 opens the file without `with`, so the script never closes it itself, and it reads `sys.argv[1]` without checking that you gave an argument.

You have three suspicions and you have not run anything. Now let the computer confirm or reject them.

### 4. Run it on your example

```bash
python3 status_counts.py sample.log
```

```output
Traceback (most recent call last):
  File "/home/sam/ailab/review/status_counts.py", line 18, in <module>
    counts, skipped = count_statuses(open(sys.argv[1]))
                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/sam/ailab/review/status_counts.py", line 10, in count_statuses
    status = parts[8]
             ~~~~~^^^
IndexError: list index out of range
```

The first suspicion was right. The traceback, which you learned to read in lesson 3.6, ends on line 10: the cut-off line has only four pieces, so there is no `parts[8]`. Your path shows your own username instead of `sam`.

This is a limit followed in form only. The code contains the check you asked for, so a quick look says "done", but the check never gets a chance. Without a cut-off line in your example, you might have tried the script on a clean log and believed it.

### 5. Fix the order and compare with the expected output

Move the line that reads the status below the check, so the loop becomes:

```python
    for line in lines:
        parts = line.split()
        if len(parts) != 10:
            skipped += 1
            continue
        counts[parts[8]] += 1
```

<!-- lab: run
cd ~/ailab/review
python3 - <<'EOF'
from pathlib import Path
p = Path("status_counts.py")
s = p.read_text()
s = s.replace("        status = parts[8]\n", "")
s = s.replace("        counts[status] += 1\n", "        counts[parts[8]] += 1\n")
p.write_text(s)
EOF
-->

Then save the result you expect, from the request, and let `diff` compare it with the real output:

```bash
printf '200: 2\n401: 2\n404: 1\n500: 1\nskipped: 1\n' > expected.txt
python3 status_counts.py sample.log > actual.txt
diff expected.txt actual.txt && echo "same as expected"
```

```output
same as expected
```

`diff` prints nothing when two files are equal, and then `&&` runs the `echo`. Comparing with a tool is safer than comparing by eye: it never skims.

### 6. Test the edge cases

The happy path works now. Try the borders: an empty log, and no argument at all.

```bash
touch empty.log
python3 status_counts.py empty.log
python3 status_counts.py
```

```output
skipped: 0
Traceback (most recent call last):
  File "/home/sam/ailab/review/status_counts.py", line 17, in <module>
    counts, skipped = count_statuses(open(sys.argv[1]))
                                          ~~~~~~~~^^^
IndexError: list index out of range
```

The empty log gives a sensible answer. The missing argument gives a traceback instead of a message, which was the third suspicion. The line number is now 17, because the fix removed one line. You fix this in step 8.

### 7. Try to import it

A test file imports the function it tests. Do the same thing in one line:

```bash
python3 -c "from status_counts import count_statuses"
```

```output
Traceback (most recent call last):
  File "<string>", line 1, in <module>
  File "/home/sam/ailab/review/status_counts.py", line 17, in <module>
    counts, skipped = count_statuses(open(sys.argv[1]))
                                          ~~~~~~~~^^^
IndexError: list index out of range
```

You only asked for a function, and the whole script ran. That is the second suspicion: code at the top level runs on import. Any test of this file would crash before it starts.

### 8. Write the version you can defend

Replace `status_counts.py` with this version. The function is unchanged from step 5; the rest moves into `main`, behind the `if __name__ == "__main__":` line from lesson 3.8, and checks its argument.

```python title="status_counts.py"
import sys
from collections import Counter


def count_statuses(lines):
    counts = Counter()
    skipped = 0
    for line in lines:
        parts = line.split()
        if len(parts) != 10:
            skipped += 1
            continue
        counts[parts[8]] += 1
    return counts, skipped


def main():
    if len(sys.argv) != 2:
        print("usage: python3 status_counts.py LOGFILE", file=sys.stderr)
        sys.exit(1)
    with open(sys.argv[1], encoding="utf-8") as f:
        counts, skipped = count_statuses(f)
    for status, n in counts.most_common():
        print(f"{status}: {n}")
    print(f"skipped: {skipped}")


if __name__ == "__main__":
    main()
```

```bash
python3 status_counts.py
echo "exit status: $?"
python3 status_counts.py sample.log | diff expected.txt - && echo "same as expected"
```

```output
usage: python3 status_counts.py LOGFILE
exit status: 1
same as expected
```

The missing argument now gives a usage line and exit status 1. The `-` tells `diff` to read the second file from the pipe. The normal result has not changed, which you checked instead of assuming.

### 9. Lock it in with tests

Create `test_status_counts.py`. It feeds the function a plain list, as the tests of lesson 3.9 did, with the borders you found:

```python title="test_status_counts.py"
from status_counts import count_statuses

GOOD = '203.0.113.5 - - [21/Nov/2026:09:58:01 +0000] "GET / HTTP/1.1" 200 1043'
CUT = '203.0.113.80 - - [21/Nov/2026:10:06:'


def test_counts_and_skips():
    counts, skipped = count_statuses([GOOD, GOOD, CUT, ""])
    assert counts == {"200": 2}
    assert skipped == 2


def test_empty_input():
    counts, skipped = count_statuses([])
    assert counts == {}
    assert skipped == 0
```

<!-- lab: nocheck -->
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -q pytest
pytest -q
```

```output
..                                                                       [100%]
2 passed in 0.13s
```

Both tests pass, and the import no longer runs the script. Note that the empty string counts as skipped: an empty line has zero fields. That is a choice, and the test now records it, so a later change cannot alter it without you noticing. Your time at the end will differ.

You have now read, run, tested and fixed the answer. You can explain every line, so you can keep it.

## Exercise

The assistant offers one more function for the same tool. It should return the share of complete lines whose status is an error (400 or more), as a percentage rounded to one decimal.

```python
def error_rate(lines):
    errors = 0
    for line in lines:
        parts = line.split()
        if len(parts) == 10 and int(parts[8]) > 400:
            errors += 1
    return round(100 * errors / len(lines), 1)
```

1. Read it and write down what looks wrong. Look closely at the comparison and at the division.
2. Work out the correct answer for `sample.log` by hand: how many complete lines, how many errors?
3. Write a short script that checks the function on `sample.log`, on an empty list and on one line with status `400`. Then fix the function.

<details>
<summary>Show the solution</summary>

Three problems:

- `> 400` leaves out status 400 itself. The task said "400 or more", so it must be `>= 400`.
- The division uses `len(lines)`, all seven lines, but the share must be of the six complete lines. The cut-off line must not count.
- An empty list makes `len(lines)` zero, and dividing by zero raises an error.

For `sample.log`: six complete lines, four errors (two `401`, one `404`, one `500`). The share is 4 out of 6, so the expected answer is `66.7`.

This script runs the checks on the fixed version:

```python
def error_rate(lines):
    complete = 0
    errors = 0
    for line in lines:
        parts = line.split()
        if len(parts) != 10:
            continue
        complete += 1
        if int(parts[8]) >= 400:
            errors += 1
    if complete == 0:
        return 0.0
    return round(100 * errors / complete, 1)


with open("sample.log", encoding="utf-8") as f:
    print(error_rate(f))
print(error_rate([]))
line = '203.0.113.9 - - [21/Nov/2026:11:00:00 +0000] "GET /x HTTP/1.1" 400 10'
print(error_rate([line]))
```

```output
66.7
0.0
100.0
```

The original function gives `57.1` for the sample, which is 4 out of 7: a believable number that is wrong. It would also miss the `400` line and crash on the empty list. Returning `0.0` for no complete lines is a decision; raising a clear error would be another reasonable one. What matters is that you chose it.

</details>

## Check yourself

**1. What are the four steps of the review routine?**

<details>
<summary>Answer</summary>

Read every line, run it on your example, test the edge cases, then decide: keep it, fix it, or ask again.

</details>

**2. What is the difference between the happy path and an edge case?**

<details>
<summary>Answer</summary>

The happy path is the normal case where every input looks as expected. An edge case is an input at the border of what the code expects, such as an empty file, a cut-off line or a missing argument.

</details>

**3. The answer in this lesson contained a check for 10 fields. Why did it still crash?**

<details>
<summary>Answer</summary>

The line before the check already read `parts[8]`. On a cut-off line with four pieces, that index does not exist, so the crash happened before the check could skip the line.

</details>

**4. Why did `python3 -c "from status_counts import count_statuses"` run the whole script?**

<details>
<summary>Answer</summary>

Because the script's work was at the top level of the file, outside any function. Python runs top-level code whenever it loads the file, including on import. Moving it into `main()` behind `if __name__ == "__main__":` fixed it.

</details>

**5. Why compare with `diff` instead of reading the two outputs yourself?**

<details>
<summary>Answer</summary>

`diff` compares every character and never skims. When the files are equal it prints nothing, and with `&&` you get a clear "same as expected".

</details>

## Common mistakes

- **Running before reading.** Reading first gives you suspicions to confirm. Running first gives you a result you tend to believe.
- **Testing only on clean data.** The happy path is where AI-written code is strongest. Always try an empty input, a broken line and a missing argument.
- **Fixing the symptom.** Wrapping the crash in `try`/`except` would have hidden the cut-off line problem. Fix the cause: the order of the lines.
- **Keeping the clever part you do not understand.** If one line is a puzzle to you, ask the assistant to explain it, look it up, or rewrite it plainly.
- **Trusting tests the assistant wrote for its own code.** They test what the assistant thought, not what you need. Write at least the edge case tests yourself.

## Key terms

- **Happy path**: the normal case, where every input looks the way the code expects.
- **Edge case**: an input at the border of what the code expects, such as an empty file, a broken line or a missing argument.

## Go further

- [OWASP Code Review Guide](https://owasp.org/www-project-code-review-guide/): a free guide to reviewing code, with a focus on the mistakes that become security problems.
- [Python documentation: `__main__`](https://docs.python.org/3/library/__main__.html): why code at the top level runs on import, and how `if __name__ == "__main__":` prevents it.
- [pytest: Get started](https://docs.pytest.org/en/stable/getting-started.html): writing and running tests like the ones in step 9.
