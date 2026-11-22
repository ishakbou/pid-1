---
title: Errors and exceptions
description: Read a Python traceback from the bottom up, and handle errors with try and except so that one bad input does not crash your whole program.
lesson: "3.6"
time: 20 min
sidebar:
  order: 6
---

Your script has read the server log every night for a month without a problem. Then, one night, a single line arrives broken, half written when the disk filled up, and the script dies on it. Nothing is reported, and the other 50,000 good lines are never checked. In this lesson you learn to read the message Python leaves behind when that happens, and to write code that expects bad input and deals with it.

## Goal

After this lesson you can:

- Read a traceback and find the line and the reason of an error.
- Catch an error with `try` and `except`, and keep the program running.
- Raise your own error when a function gets a value it cannot use.

## Why it matters

Real data is messy: files go missing, users type letters where numbers belong, log lines are cut in half. A program that crashes on the first surprise is useless at night, when nobody watches it. Error handling also matters for security: a script that crashes on strange input can be stopped by anyone who sends strange input, and an error message that shows too much can leak details about your system.

## The idea

Python can stop with two kinds of errors.

A **syntax error** means Python cannot even read your code, for example because a parenthesis is missing. It is found before the first line runs, so nothing happens at all.

An **exception** happens while the program runs: the code is valid, but one step cannot be done, such as turning `"n/a"` into a number or opening a file that does not exist. Python then **raises** the exception: it stops the normal flow and looks for code that handles it. If it finds none, the program ends and prints a **traceback**, a report of where the error happened and which calls led there.

Handling an exception is like the safety net under a trapeze. Without it, one slip ends the show. With it, the artist falls into the net, climbs back and the show goes on. In Python the net is a `try` block with an `except` part. You put the risky step inside `try`, and the `except` part runs only if that step raises the error you named.

These exceptions are the ones you will meet most:

| Exception | Typical cause |
|---|---|
| `NameError` | a variable or function name that does not exist, often a typo |
| `TypeError` | an operation on the wrong type, like `"3" + 1` |
| `ValueError` | the right type but a bad value, like `int("n/a")` |
| `KeyError` | a dictionary key that is not there |
| `IndexError` | a list index past the end |
| `FileNotFoundError` | opening a file that does not exist |
| `ZeroDivisionError` | dividing by zero |

## Try it

### 1. Meet a syntax error

```bash
mkdir -p ~/pylab/errors
cd ~/pylab/errors
```

```python title="broken.py"
print("starting")
print("hello"
```

```bash
python3 broken.py
```

```output
  File "/home/sam/pylab/errors/broken.py", line 2
    print("hello"
         ^
SyntaxError: '(' was never closed
```

Even `starting` was not printed: Python read the whole file first and refused to run it. The message gives the file, the line number and a `^` under the spot. As in earlier lessons, the path shows `sam`; you see your own username.

### 2. Read a traceback

```python title="average.py"
def to_numbers(values):
    numbers = []
    for v in values:
        numbers.append(int(v))
    return numbers

def average(values):
    numbers = to_numbers(values)
    return sum(numbers) / len(numbers)

print(average(["12", "7", "n/a", "5"]))
```

```bash
python3 average.py
```

```output
Traceback (most recent call last):
  File "/home/sam/pylab/errors/average.py", line 11, in <module>
    print(average(["12", "7", "n/a", "5"]))
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/sam/pylab/errors/average.py", line 8, in average
    numbers = to_numbers(values)
              ^^^^^^^^^^^^^^^^^^
  File "/home/sam/pylab/errors/average.py", line 4, in to_numbers
    numbers.append(int(v))
                   ^^^^^^
ValueError: invalid literal for int() with base 10: 'n/a'
```

Read a traceback from the bottom up.

1. The last line says what went wrong: a `ValueError`, because `int()` cannot turn `'n/a'` into a number. "Literal" here means the text it was given.
2. The block just above it says where: line 4, inside the function `to_numbers`.
3. The blocks higher up say how the program got there: line 11 at the top level of the script (`<module>`) called `average`, and line 8 in `average` called `to_numbers`.

The bottom tells you the cause, the frames above tell you the path. Most of the time, the bug is in the lowest frame that is in your own code.

### 3. See how the program ended

```bash
python3 average.py 2> /dev/null
echo "exit status: $?"
```

```output
exit status: 1
```

`2> /dev/null` throws away the traceback, which Python writes to standard error, the stream for error messages from lesson 1.7. `$?` holds the exit status of the last command, as in lesson 1.9: 0 means success, anything else means failure. A crash gives 1, so a Bash script or a scheduler that runs your program can see that something went wrong.

### 4. Catch the error with try and except

```python title="average_safe.py"
def to_numbers(values):
    numbers = []
    for v in values:
        try:
            numbers.append(int(v))
        except ValueError:
            print(f"skipping {v!r}: not a number")
    return numbers

def average(values):
    numbers = to_numbers(values)
    return sum(numbers) / len(numbers)

print(average(["12", "7", "n/a", "5"]))
```

```bash
python3 average_safe.py
```

```output
skipping 'n/a': not a number
8.0
```

Python runs the `try` block. If `int(v)` raises a `ValueError`, it jumps to the `except ValueError` block and then carries on with the next value. Three numbers are left, so the average is 24 / 3 = 8.0. The `!r` in the f-string prints the value with its quotes, which makes empty strings and stray spaces visible in messages.

Catch only what you expect, and name it. A bare `except:` without a type also catches your own typos, such as a `NameError`, and hides them.

### 5. Handle a missing file

```python title="read_config.py"
filename = "settings.txt"

try:
    f = open(filename, encoding="utf-8")
except FileNotFoundError as e:
    print("Cannot read settings:", e)
else:
    with f:
        print("Settings:", f.read().strip())
finally:
    print("done")
```

```bash
python3 read_config.py
echo "debug=false" > settings.txt
python3 read_config.py
```

```output
Cannot read settings: [Errno 2] No such file or directory: 'settings.txt'
done
Settings: debug=false
done
```

`as e` stores the exception in `e`, and printing it gives its message. The `else` block runs only when the `try` block raised nothing, so the file is read only when it was opened. The `finally` block runs in every case, error or not; it is the place for clean-up work. The first run had no file, and the second run found the one that `echo` created.

### 6. Raise your own exception

```python title="ports.py"
def parse_port(text):
    """Turn text into a port number from 1 to 65535."""
    port = int(text)
    if port < 1 or port > 65535:
        raise ValueError(f"port out of range: {port}")
    return port

for text in ["443", "70000", "ssh"]:
    try:
        print("ok:", parse_port(text))
    except ValueError as e:
        print("bad:", e)
```

```bash
python3 ports.py
```

```output
ok: 443
bad: port out of range: 70000
bad: invalid literal for int() with base 10: 'ssh'
```

`raise` creates an exception on purpose. `70000` is a valid number but not a valid port, so `parse_port` raises a `ValueError` with a clear message. The caller handles both bad cases with one `except`: the error raised by `int()` and the one you raised yourself. A function should not quietly return a wrong value: raising an error forces the caller to decide what to do.

:::tip[Do not show tracebacks to strangers]
A traceback shows file paths, function names and lines of your code. That helps you, and it also helps an attacker learn how your program works. In a web app or any tool other people use, catch errors, show a short message, and keep the full traceback in a log file that only you can read.
:::

## Exercise

In `~/pylab/errors`, create `ports.txt` with these five lines: `22`, `http`, `443`, `70000` and `8080`. Then write `check_ports.py` that:

1. Uses `parse_port` from step 6 (copy the function into the new file).
2. Reads `ports.txt` line by line and prints `valid: 22` or `invalid line 2: ...` with the line number and the error message.
3. Prints `ports.txt not found` instead of a traceback if the file does not exist.

Line numbers start at 1. Hint: keep a counter, or look up `enumerate` in Go further.

<details>
<summary>Show the solution</summary>

```text title="ports.txt"
22
http
443
70000
8080
```

```python title="check_ports.py"
def parse_port(text):
    """Turn text into a port number from 1 to 65535."""
    port = int(text)
    if port < 1 or port > 65535:
        raise ValueError(f"port out of range: {port}")
    return port

try:
    with open("ports.txt", encoding="utf-8") as f:
        number = 0
        for line in f:
            number += 1
            try:
                print("valid:", parse_port(line.strip()))
            except ValueError as e:
                print(f"invalid line {number}: {e}")
except FileNotFoundError:
    print("ports.txt not found")
```

```bash
python3 check_ports.py
mv ports.txt ports.old
python3 check_ports.py
```

```output
valid: 22
invalid line 2: invalid literal for int() with base 10: 'http'
valid: 443
invalid line 4: port out of range: 70000
valid: 8080
ports.txt not found
```

There are two `try` blocks, one inside the other, because there are two different risks: the whole file can be missing, and a single line can be bad. The inner one keeps the loop going after a bad line. With `enumerate`, the loop becomes `for number, line in enumerate(f, start=1):` and you need no counter.

</details>

## Check yourself

**1. Where do you start reading a traceback, and what do you find there?**

<details>
<summary>Answer</summary>

At the bottom. The last line gives the type of the exception and its message. The frame just above it gives the file, line and function where it happened.

</details>

**2. What is the difference between a syntax error and an exception?**

<details>
<summary>Answer</summary>

A syntax error means Python cannot read the code, so nothing runs at all. An exception happens while the program runs, when one step cannot be done.

</details>

**3. Which exception does `int("12a")` raise, and which one does `{"a": 1}["b"]` raise?**

<details>
<summary>Answer</summary>

`int("12a")` raises a `ValueError`. `{"a": 1}["b"]` raises a `KeyError`, because the key `"b"` is not in the dictionary.

</details>

**4. When does an `else` block after `try` and `except` run? And a `finally` block?**

<details>
<summary>Answer</summary>

`else` runs only when the `try` block raised no exception. `finally` runs in every case, with or without an error.

</details>

**5. Why is a bare `except:` a bad idea?**

<details>
<summary>Answer</summary>

It catches every exception, including the ones caused by your own bugs, such as a `NameError` from a typo. The program then hides the real problem. Name the exception you expect, such as `except ValueError:`.

</details>

## Common mistakes

- **Reading the traceback from the top.** The top shows where the program started. Start at the last line, then look at the frame just above it.
- **A `try` block around everything.** If the whole script is inside one `try`, you cannot tell which step failed. Keep `try` blocks small, around the one risky step.
- **Catching and doing nothing.** `except ValueError: pass` makes errors silent. At least print or log what went wrong.
- **Catching the wrong type.** If you catch `ValueError` but the code raises `KeyError`, the program still crashes. The traceback tells you the exact type to catch.
- **Fixing the symptom only.** A `TypeError` deep in your code often comes from a wrong value much earlier, such as a number read from a file and never converted. Follow the traceback up to where the value came from.

## Key terms

- **Syntax error**: code that Python cannot read, found before anything runs.
- **Exception**: an error that happens while the program runs, such as `ValueError` or `FileNotFoundError`.
- **Raise**: to signal an exception, either by Python itself or with the `raise` statement.
- **Traceback**: the report Python prints when an exception is not handled: where it happened and which calls led there.
- **try and except**: the statement that runs risky code in `try` and handles a named exception in `except`.

## Go further

- [Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html): the official tutorial chapter, with `else`, `finally` and raising your own errors.
- [Built-in Exceptions](https://docs.python.org/3/library/exceptions.html): the full list of Python's exceptions and what each one means.
- [enumerate](https://docs.python.org/3/library/functions.html#enumerate): the built-in function that numbers the items of a loop for you.
