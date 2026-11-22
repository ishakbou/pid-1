---
title: Debugging with AI
description: Ask an AI assistant for help with a bug by giving it the full error, the smallest code that shows it and what you already tried, then check every suggested fix yourself.
lesson: "15.3"
time: 25 min
sidebar:
  order: 3
---

It is late, the script worked yesterday, and today it prints twelve lines of traceback. You paste "it doesn't work, fix it" into an assistant, get a confident fix, paste it in, and get the same traceback again. The assistant was not careless. It was guessing, because you gave it almost nothing. This lesson shows the other way: a bug report that leads to the cause, and a check that proves the fix.

## Goal

After this lesson you can:

- Read an error yourself first and shrink it to the smallest example that still fails.
- Write a debugging request with the error, the code, what you expected and what you tried.
- Check a suggested fix by rerunning the failing case and the cases that worked before.

## Why it matters

Debugging is where an assistant can save you the most time, and where a wrong answer costs the most. A fix that removes an error message is not always a fix: it can hide the problem, drop data without a word, or break something that worked. The person who can tell a real fix from a lucky one is the person who gets trusted with the systems that matter.

## The idea

Calling a doctor about a pain works better when you say where it hurts, since when, what you already took and whether it helped. "I feel bad" gets you a general guess. Then, whatever the doctor suggests, you still watch whether you get better. A debugging request to an AI works the same way, and so does the follow-up.

A good debugging request has five parts:

1. **The command you ran**, exactly as you typed it.
2. **The full error**, copied, not retold. The last line of a traceback names the error; the lines above say where it happened.
3. **The smallest code and data that still fail.** This is called a **minimal reproduction**: you remove everything that is not needed to show the bug. It often shows you the cause before you even ask.
4. **What you expected, and what happened instead.**
5. **What you already tried**, and what each attempt showed. It stops the assistant from suggesting the same things again.

Then comes the part that matters most. A suggested fix is a **hypothesis**: an idea that might be true and must be tested. You test it in three ways:

| Check | Question |
|---|---|
| Rerun the failing case | Is the error gone? |
| Check the result | Is the output correct, not just present? |
| Rerun what worked before | Did the fix break anything else? |

The third check catches a **regression**: something that worked before a change and fails after it.

## Try it

The script and the logs here are small, so that the whole bug fits on one screen. The assistant's answers are fixed texts that I wrote for this lesson, close to the answers real assistants give for this bug.

### 1. Set up a script that works

```bash
mkdir -p ~/ailab/debug
cd ~/ailab/debug
```

Create `ip_counts.py`. It counts the requests per IP address, like the analyzer in `mylab`:

```python title="ip_counts.py"
import sys
from collections import Counter


def count_ips(path):
    counts = Counter()
    with open(path, encoding="utf-8") as f:
        for line in f:
            parts = line.split()
            if len(parts) == 10:
                counts[parts[0]] += 1
    return counts


def main():
    for ip, n in count_ips(sys.argv[1]).most_common():
        print(f"{ip} {n}")


if __name__ == "__main__":
    main()
```

And a small log that it handles well:

```text title="good.log"
203.0.113.5 - - [21/Nov/2026:11:00:01 +0000] "GET / HTTP/1.1" 200 1043
198.51.100.7 - - [21/Nov/2026:11:00:02 +0000] "GET /notes HTTP/1.1" 200 512
203.0.113.5 - - [21/Nov/2026:11:00:04 +0000] "GET /about HTTP/1.1" 200 2210
```

```bash
python3 ip_counts.py good.log
```

```output
203.0.113.5 2
198.51.100.7 1
```

This run is your reference: it is what "working" means. You will come back to it at the end.

### 2. Meet the bug

A second log comes from an older program. Its third field is the name of the logged-in user, and that program writes the name `josé` in **Latin-1**, an older text encoding where `é` is the single byte `e9` in hex. The `printf` lines create the file with that byte, written as `\xe9`:

```bash
printf '%s\n' '203.0.113.5 - - [21/Nov/2026:11:00:01 +0000] "GET / HTTP/1.1" 200 1043' > old.log
printf '%s\n' '198.51.100.7 - - [21/Nov/2026:11:00:02 +0000] "GET /notes HTTP/1.1" 200 512' >> old.log
printf '198.51.100.7 - jos\xe9 [21/Nov/2026:11:00:03 +0000] "GET /notes HTTP/1.1" 200 512\n' >> old.log
printf '%s\n' '203.0.113.5 - - [21/Nov/2026:11:00:04 +0000] "GET /about HTTP/1.1" 200 2210' >> old.log
python3 ip_counts.py old.log
```

```output
Traceback (most recent call last):
  File "/home/sam/ailab/debug/ip_counts.py", line 21, in <module>
    main()
  File "/home/sam/ailab/debug/ip_counts.py", line 16, in main
    for ip, n in count_ips(sys.argv[1]).most_common():
                 ^^^^^^^^^^^^^^^^^^^^^^
  File "/home/sam/ailab/debug/ip_counts.py", line 8, in count_ips
    for line in f:
  File "<frozen codecs>", line 322, in decode
UnicodeDecodeError: 'utf-8' codec can't decode byte 0xe9 in position 165: invalid continuation byte
```

Your path shows your own username instead of `sam`. Before you ask anyone, read it as lesson 3.6 taught: the last line first. Python tried to read the file as UTF-8 and found the byte `0xe9` where UTF-8 does not allow it. The lowest frame in your own code is line 8, `for line in f:`. The frame below it, `<frozen codecs>`, is inside Python itself, where the bytes are turned into text.

### 3. Look at the data

```bash
file old.log
cat -v old.log
```

```output
old.log: ISO-8859 text
203.0.113.5 - - [21/Nov/2026:11:00:01 +0000] "GET / HTTP/1.1" 200 1043
198.51.100.7 - - [21/Nov/2026:11:00:02 +0000] "GET /notes HTTP/1.1" 200 512
198.51.100.7 - josM-i [21/Nov/2026:11:00:03 +0000] "GET /notes HTTP/1.1" 200 512
203.0.113.5 - - [21/Nov/2026:11:00:04 +0000] "GET /about HTTP/1.1" 200 2210
```

`file` guesses the encoding from the bytes: ISO-8859 is the family of standards that Latin-1 belongs to (Latin-1 is ISO-8859-1). `cat -v` makes invisible and unusual bytes visible, and shows the byte `e9` as `M-i`. Now you know which line, and which byte.

### 4. Make the smallest example

```bash
printf 'jos\xe9\n' > tiny.txt
python3 -c "open('tiny.txt', encoding='utf-8').read()"
```

```output
Traceback (most recent call last):
  File "<string>", line 1, in <module>
  File "<frozen codecs>", line 322, in decode
UnicodeDecodeError: 'utf-8' codec can't decode byte 0xe9 in position 3: invalid continuation byte
```

Five bytes and one line of Python give the same error. That is your minimal reproduction, and it already tells you something important: the bug has nothing to do with counting IP addresses. It happens while the file is read.

### 5. Write the debugging request

Create `debug-request.md`:

```markdown title="debug-request.md"
I count requests per IP in a web server log with Python 3.12 on Ubuntu.
It works on most logs, but fails on logs from one older program.

Command: python3 ip_counts.py old.log

Error (last lines of the traceback):

      File "/home/sam/ailab/debug/ip_counts.py", line 8, in count_ips
        for line in f:
      File "<frozen codecs>", line 322, in decode
    UnicodeDecodeError: 'utf-8' codec can't decode byte 0xe9 in position 165: invalid continuation byte

Smallest example that fails the same way:

    printf 'jos\xe9\n' > tiny.txt
    python3 -c "open('tiny.txt', encoding='utf-8').read()"

The file is opened with: open(path, encoding="utf-8")

Expected: the count per IP for all 4 lines (two IPs, 2 requests each).
Instead: a crash, and no count at all.

What I tried: `file old.log` says "ISO-8859 text". `cat -v` shows the
byte as M-i in the user name "jos" + e9. Logs from other programs work.

Explain the cause first, then suggest the smallest change.
Do not rewrite the rest of the script.
```

Nothing is missing: the command, the error, a reproduction anyone can run, the expected result, what you found yourself, and the kind of help you want.

### 6. Test the first suggestion

Here is a first answer, of the kind assistants often give:

> The file contains a byte that is not valid UTF-8. Catch the error and skip the bad line:
>
> ```python
>         for line in f:
>             try:
>                 parts = line.split()
>             except UnicodeDecodeError:
>                 continue
> ```

It sounds reasonable. Apply it, then rerun the failing case:

<!-- lab: run
cd ~/ailab/debug
cp ip_counts.py ip_counts.orig.py
python3 - <<'EOF'
from pathlib import Path
p = Path("ip_counts.py")
s = p.read_text()
s = s.replace("            parts = line.split()\n", "            try:\n                parts = line.split()\n            except UnicodeDecodeError:\n                continue\n")
p.write_text(s)
EOF
-->

```bash
python3 ip_counts.py old.log 2>&1 | tail -n 3
```

```output
    for line in f:
  File "<frozen codecs>", line 322, in decode
UnicodeDecodeError: 'utf-8' codec can't decode byte 0xe9 in position 165: invalid continuation byte
```

The same error. `2>&1` sends the error output into the pipe too, so that `tail` can show its last three lines. The suggestion could not work, and your minimal reproduction says why: the error is raised by `for line in f:`, while Python reads and decodes the file. `line.split()` never even runs for that part of the file, so a `try` around it catches nothing.

The assistant sounded sure, and it was wrong. Only the rerun showed it. Undo the change:

```bash
mv ip_counts.orig.py ip_counts.py
```

### 7. Report back, test the second suggestion

You reply with the new fact: "That did not work. The traceback is the same, and the error is raised on the `for line in f:` line, before `split()` runs." A second answer:

> Then the decoding itself must be told what to do with bad bytes. Open the file with `errors="replace"`:
>
> ```python
>     with open(path, encoding="utf-8", errors="replace") as f:
> ```
>
> Every byte that is not valid UTF-8 becomes the replacement character, and the rest of the line is kept.

Before you accept it, know what the right result is. `cut` splits each line without decoding it as text, so the odd byte does not stop it, and the first field holds only plain IP addresses. The pipeline from lesson 1.7 can count for you:

```bash
cut -d ' ' -f 1 old.log | sort | uniq -c | sort -rn
```

```output
      2 203.0.113.5
      2 198.51.100.7
```

Now apply the fix: change the `open` line in `ip_counts.py` to the one in the answer.

<!-- lab: run
cd ~/ailab/debug
sed -i 's/open(path, encoding="utf-8")/open(path, encoding="utf-8", errors="replace")/' ip_counts.py
-->

```bash
grep -n 'open(' ip_counts.py
```

```output
7:    with open(path, encoding="utf-8", errors="replace") as f:
```

`grep -n` confirms that the change is in the file, on line 7. Checking the edit takes two seconds and rules out testing a file you forgot to save.

### 8. Check all three things

```bash
python3 ip_counts.py old.log
python3 ip_counts.py good.log
```

```output
203.0.113.5 2
198.51.100.7 2
203.0.113.5 2
198.51.100.7 1
```

The first two lines answer the first two checks: no error, and the counts match the ones `cut` gave you, so the line with the odd byte was kept and counted. The last two lines answer the third check: `good.log` gives exactly the reference from step 1, so nothing that worked before is broken.

One more question before you keep the fix: what did `errors="replace"` change? The name `josé` is now read as `jos` followed by the replacement character `�`. For counting IP addresses that is harmless. For a report that prints user names, it would be visible damage, and you would choose to read that program's logs with `encoding="latin-1"` instead. A fix is right for a purpose, not right in general. You can only judge that because you understood the cause.

:::caution[Silent fixes]
`errors="ignore"` is another common suggestion. It removes bad bytes without a trace. The error disappears, and so does part of your data, without any sign. Prefer a fix that keeps a visible mark, like `replace`, or one that reads the file with its real encoding.
:::

## Exercise

Create `sizes.py`, a script that adds up the bytes sent (the last field of each line), and `sizes.log`:

```python title="sizes.py"
import sys

total = 0
with open(sys.argv[1], encoding="utf-8") as f:
    for line in f:
        parts = line.split()
        total += int(parts[9])
print(f"total bytes: {total}")
```

```text title="sizes.log"
203.0.113.5 - - [21/Nov/2026:12:00:01 +0000] "GET / HTTP/1.1" 200 1043
203.0.113.5 - - [21/Nov/2026:12:00:09 +0000] "GET / HTTP/1.1" 304 -
198.51.100.7 - - [21/Nov/2026:12:00:12 +0000] "GET /notes HTTP/1.1" 200 512
```

1. Run `python3 sizes.py sizes.log` and read the error yourself.
2. Make a minimal reproduction in one line of Python.
3. Write a debugging request with the five parts. (In the Common Log Format, a `-` in the size field means that no body was sent, so it counts as 0.)
4. Fix the script and check the result: what total do you expect?

<details>
<summary>Show the solution</summary>

```bash
python3 sizes.py sizes.log 2>&1 | tail -n 1
python3 -c "int('-')" 2>&1 | tail -n 1
```

```output
ValueError: invalid literal for int() with base 10: '-'
ValueError: invalid literal for int() with base 10: '-'
```

The `304` line has `-` as its size, and `int('-')` cannot turn that into a number. One line of Python reproduces it.

A request with the five parts:

```text
Python 3.12 on Ubuntu. I add up the size field of a web server log.
Command: python3 sizes.py sizes.log
Error: ValueError: invalid literal for int() with base 10: '-'
       on the line: total += int(parts[9])
Reproduction: python3 -c "int('-')"
Expected: 1555 (1043 + 512; in the Common Log Format "-" means no body, so 0).
Tried: the line that fails is a 304 answer with "-" as its size.
Please suggest the smallest change and explain it.
```

The smallest fix skips the `-` instead of converting it:

<!-- lab: run
cd ~/ailab/debug
sed -i 's/^        total += int(parts\[9\])$/        if parts[9] != "-":\n            total += int(parts[9])/' sizes.py
-->

```python
        if parts[9] != "-":
            total += int(parts[9])
```

```bash
python3 sizes.py sizes.log
```

```output
total bytes: 1555
```

1043 plus 512 is 1555, the total you worked out before running it. A `try`/`except ValueError: continue` would also give 1555 here, but it would just as quietly skip a size that is broken in some other way. The check for `-` names exactly the case that is normal.

</details>

## Check yourself

**1. What are the five parts of a good debugging request?**

<details>
<summary>Answer</summary>

The command you ran, the full error, the smallest code and data that still fail, what you expected and what happened instead, and what you already tried.

</details>

**2. What is a minimal reproduction, and why make one before you ask?**

<details>
<summary>Answer</summary>

The smallest code and data that still show the bug. It removes everything that does not matter, so the assistant cannot be distracted by it, and it often shows you the cause yourself. In this lesson it showed that the bug was in reading the file, not in counting.

</details>

**3. Why did the `try`/`except` around `line.split()` not fix the error?**

<details>
<summary>Answer</summary>

The error was raised by `for line in f:`, while Python decoded the bytes of the file. The code inside the loop never ran for that part, so the `try` had nothing to catch.

</details>

**4. After a fix, what three things do you check?**

<details>
<summary>Answer</summary>

That the failing case no longer fails, that its result is correct and not just present, and that the cases that worked before still give the same result.

</details>

**5. What is a regression?**

<details>
<summary>Answer</summary>

Something that worked before a change and fails after it. You catch it by rerunning the cases that worked, as with `good.log` in step 8.

</details>

## Common mistakes

- **Retelling the error instead of copying it.** "It says something about UTF-8" loses the byte, the position and the line. Copy the last lines of the traceback exactly.
- **Pasting the whole project.** A long paste hides the bug. Shrink it to a minimal reproduction first.
- **Accepting the first fix because the error is gone.** An error that disappears is not proof. Check the result and rerun what worked before.
- **Applying fix after fix without undoing.** Each failed attempt you leave in makes the next bug harder to understand. Undo a suggestion that did not work, as in step 6.
- **Not reporting back.** When a suggestion fails, say so, with what you saw. The assistant only learns about your machine from your messages.

## Key terms

- **Minimal reproduction**: the smallest code and data that still show a bug.
- **Hypothesis**: an idea that might be true and must be tested. A suggested fix is one until you have checked it.
- **Regression**: something that worked before a change and fails after it.
- **Latin-1**: an older text encoding, also called ISO-8859-1, that stores each character in one byte. On their own, its bytes for accented letters are not valid UTF-8.

## Go further

- [Python documentation: Unicode HOWTO](https://docs.python.org/3/howto/unicode.html): how Python reads and writes text, and what the `errors` argument of `open` does.
- [Python documentation: Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html): the official tutorial on reading tracebacks and handling exceptions.
- [Python documentation: codecs, error handlers](https://docs.python.org/3/library/codecs.html#error-handlers): the full list of choices such as `strict`, `replace` and `ignore`.
