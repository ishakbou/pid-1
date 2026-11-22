---
title: Testing and debugging
description: Write automatic tests with pytest, and find bugs with print, the debugger and a calm step-by-step method.
lesson: "3.9"
time: 25 min
sidebar:
  order: 9
---

<!-- lab: run
sudo apt-get install -y -qq python3-venv > /dev/null 2>&1
-->

How do you know your code works? Because you ran it once and the output looked right? Then you change one line to fix a small problem, and something else breaks, somewhere you did not look. Professional programmers do not trust their eyes for this. They write a second, small program whose only job is to check the first one, and they run it after every change.

## Goal

After this lesson you can:

- Write tests with pytest and read its report.
- Find a bug with `print` and know what the debugger can do.
- Follow a calm method from "it is broken" to "it is fixed, and it stays fixed".

## Why it matters

Every change to a program can break something that worked before. Tests catch that in seconds, so you can change code without fear. In security this matters twice: a check that quietly stops working, such as a login limit, is a hole that nobody notices until someone uses it. Debugging is the other half: when something is wrong, a method beats guessing, and it saves hours.

## The idea

A **test** is a small piece of code that runs your code with a known input and checks the result. If the result is right, the test passes. If not, it fails and tells you what came out instead.

In Python, the check is an `assert` statement: `assert is_error(404)` does nothing when the condition is true, and raises an `AssertionError` when it is false. **pytest** is the most used tool for running tests. It finds every file whose name starts with `test_`, runs every function in it whose name starts with `test_`, and prints a report.

A test is like a smoke detector. Installing it takes a minute, it stays quiet while all is well, and it shouts the moment something burns, even when you are in another room working on something else.

A **bug** is a mistake in a program that makes it behave wrongly. **Debugging** is finding and fixing it. A calm method works better than random changes:

1. **Reproduce** the bug: find an input that shows it every time.
2. **Read** the error message or the wrong output carefully.
3. **Narrow down** where it goes wrong: print values, or step through with a debugger.
4. **Explain** the cause in one sentence before you change anything.
5. **Fix** it, and add a test with the input from step 1, so the bug cannot come back unnoticed.

## Try it

### 1. Install pytest in a venv

```bash
mkdir -p ~/pylab/testing
cd ~/pylab/testing
python3 -m venv .venv
source .venv/bin/activate
pip install -q pytest
```

pytest is a package, so it goes into a venv, as you learned in lesson 3.8. `-q` keeps pip quiet. If the venv command fails, install `python3-venv` first, as shown in that lesson.

### 2. Write the code to test

```python title="logtools.py"
def status_class(code):
    """Return the class of an HTTP status code, such as 'ok' for 200."""
    if code < 100 or code > 599:
        raise ValueError(f"not an HTTP status: {code}")
    if code < 300:
        return "ok"
    elif code < 400:
        return "redirect"
    elif code < 500:
        return "client error"
    return "server error"


def is_error(code):
    """Return True for error codes, 400 and above."""
    return code > 400


def error_rate(codes):
    """Return the share of error codes in a list, from 0.0 to 1.0."""
    errors = 0
    for code in codes:
        if is_error(code):
            errors += 1
        return errors / len(codes)
```

This module sorts HTTP status codes: 200 means OK, 404 means not found, 500 means the server failed. Module 6 explains them. It has two bugs in it on purpose. Do not look for them yet: let the tests find them.

### 3. Write the first tests

```python title="test_logtools.py"
import pytest
from logtools import status_class, is_error, error_rate


def test_status_class():
    assert status_class(200) == "ok"
    assert status_class(301) == "redirect"
    assert status_class(404) == "client error"
    assert status_class(503) == "server error"


def test_status_class_rejects_nonsense():
    with pytest.raises(ValueError):
        status_class(42)


def test_not_found_is_error():
    assert is_error(404)


def test_ok_is_not_error():
    assert not is_error(200)
```

<!-- lab: nocheck -->
```bash
pytest -q
```

```output
....                                                                     [100%]
4 passed in 0.23s
```

Each dot is one test that passed. `pytest.raises(ValueError)` is a `with` block that passes only if the code inside raises that exception, which is how you test that bad input is refused. Your time at the end will differ.

Four green tests, and still two bugs. Tests only check what you thought of.

### 4. Turn a bug report into a failing test

A teammate reports: "Status 400, Bad Request, is not counted as an error." Before you touch the code, write a test that shows the bug. Add the last two functions below to the end of `test_logtools.py`; the file then looks like this:

```python title="test_logtools.py"
import pytest
from logtools import status_class, is_error, error_rate


def test_status_class():
    assert status_class(200) == "ok"
    assert status_class(301) == "redirect"
    assert status_class(404) == "client error"
    assert status_class(503) == "server error"


def test_status_class_rejects_nonsense():
    with pytest.raises(ValueError):
        status_class(42)


def test_not_found_is_error():
    assert is_error(404)


def test_ok_is_not_error():
    assert not is_error(200)


def test_bad_request_is_error():
    assert is_error(400)


def test_error_rate():
    assert error_rate([200, 404, 500, 200]) == 0.5
```

The last test checks the other function while you are at it: two error codes out of four is a rate of 0.5.

<!-- lab: nocheck -->
```bash
pytest -q
```

```output
....FF                                                                   [100%]
=================================== FAILURES ===================================
__________________________ test_bad_request_is_error ___________________________

    def test_bad_request_is_error():
>       assert is_error(400)
E       assert False
E        +  where False = is_error(400)

test_logtools.py:26: AssertionError
_______________________________ test_error_rate ________________________________

    def test_error_rate():
>       assert error_rate([200, 404, 500, 200]) == 0.5
E       assert 0.0 == 0.5
E        +  where 0.0 = error_rate([200, 404, 500, 200])

test_logtools.py:30: AssertionError
=========================== short test summary info ============================
FAILED test_logtools.py::test_bad_request_is_error - assert False
FAILED test_logtools.py::test_error_rate - assert 0.0 == 0.5
2 failed, 4 passed in 0.35s
```

An `F` is a failed test. For each failure, pytest shows the line marked with `>` and, after `E`, the values it saw: `is_error(400)` returned `False`, and `error_rate` returned `0.0` instead of `0.5`. You reproduced both bugs, and you have their inputs.

### 5. Fix the first bug

The first message is clear. `is_error(400)` is `False`, so look at `is_error`: it says `code > 400`. The cause in one sentence: "400 itself is not greater than 400". Errors start at 400, so the comparison must be `>=`. Bugs at the edge of a range, like this one, are called **off-by-one errors**, and they are among the most common bugs there are.

Change the line in `logtools.py` to `return code >= 400`:

<!-- lab: run
sed -i 's/return code > 400/return code >= 400/' logtools.py
-->

<!-- lab: nocheck -->
```bash
pytest -q
```

```output
.....F                                                                   [100%]
=================================== FAILURES ===================================
_______________________________ test_error_rate ________________________________

    def test_error_rate():
>       assert error_rate([200, 404, 500, 200]) == 0.5
E       assert 0.0 == 0.5
E        +  where 0.0 = error_rate([200, 404, 500, 200])

test_logtools.py:30: AssertionError
=========================== short test summary info ============================
FAILED test_logtools.py::test_error_rate - assert 0.0 == 0.5
1 failed, 5 passed in 0.29s
```

One down. `test_bad_request_is_error` passes now, and it stays in the file: if someone ever changes `>=` back, it fails at once. A test written for a fixed bug is called a **regression test**.

### 6. Find the second bug with print

`error_rate` returns `0.0`, and the code looks fine at first sight. Time to narrow down: make the function show what it does. Add one line inside the loop, right after `for code in codes:`:

<!-- lab: run
sed -i 's/^    for code in codes:$/    for code in codes:\n        print(f"{code=} {errors=}")/' logtools.py
-->

```python
        print(f"{code=} {errors=}")
```

Then call the function directly with the input from the test:

```bash
python3 -c "from logtools import error_rate; print(error_rate([200, 404, 500, 200]))"
```

```output
code=200 errors=0
0.0
```

`f"{code=}"` is a handy f-string form that prints the name and the value together. `python3 -c` runs the Python code you give it in quotes, without a script file, which is handy for one quick call like this one. And the output gives it away: the loop ran only once, for the first code. Something ends the function during the first iteration. Look again at `return errors / len(codes)`: it is indented inside the `for`, so the function returns after the first code. The cause in one sentence: "the return is inside the loop".

Remove the `print` line, and move the `return` four spaces to the left, to the level of `for`. The end of `error_rate` becomes:

<!-- lab: run
sed -i '/print(f"{code=} {errors=}")/d; s/^        return errors \/ len(codes)$/    return errors \/ len(codes)/' logtools.py
-->

```python
    for code in codes:
        if is_error(code):
            errors += 1
    return errors / len(codes)
```

<!-- lab: nocheck -->
```bash
pytest -q
```

```output
......                                                                   [100%]
6 passed in 0.35s
```

Six tests pass, and two of them guard against the bugs you just fixed.

### 7. Know what the debugger does

For bugs that need more than a few prints, Python has a **debugger**, a tool that pauses a running program so you can look inside it. Put the line `breakpoint()` in your code where you want to stop, and run the script as usual. Python stops there and shows a `(Pdb)` prompt, where you type commands:

| Command | What it does |
|---|---|
| `p errors` | prints the value of `errors` |
| `n` | runs the next line |
| `s` | steps into the function called on this line |
| `c` | continues until the next `breakpoint()` or the end |
| `q` | quits the program |

Pressing `n` again and again, with `p` to look at values, would have shown you the early `return` in step 6 too. Editors such as VS Code have the same debugger behind buttons: you click next to a line number to set a breakpoint, and you see all variables in a side panel. Remove `breakpoint()` lines before you commit your code.

:::tip[Tests first, then the fix]
When a bug is reported, write the failing test before you fix anything, as in step 4. It proves you understood the bug, it tells you when your fix works, and it keeps the bug from coming back.
:::

## Exercise

In `~/pylab/testing`, with the venv active:

1. Create `ports.py` with the `parse_port` function from lesson 3.6.
2. Write `test_ports.py` with three tests: `"443"` gives `443`; `"70000"` raises a `ValueError`; `"ssh"` raises a `ValueError`.
3. Add a fourth test for the edges: `"1"` and `"65535"` are valid.
4. Run pytest. All tests of the folder should pass, the new ones and the six from the lesson.

<details>
<summary>Show the solution</summary>

```python title="ports.py"
def parse_port(text):
    """Turn text into a port number from 1 to 65535."""
    port = int(text)
    if port < 1 or port > 65535:
        raise ValueError(f"port out of range: {port}")
    return port
```

```python title="test_ports.py"
import pytest
from ports import parse_port


def test_valid_port():
    assert parse_port("443") == 443


def test_port_too_big():
    with pytest.raises(ValueError):
        parse_port("70000")


def test_port_not_a_number():
    with pytest.raises(ValueError):
        parse_port("ssh")


def test_port_edges():
    assert parse_port("1") == 1
    assert parse_port("65535") == 65535
```

<!-- lab: nocheck -->
```bash
pytest -q
```

```output
..........                                                               [100%]
10 passed in 0.28s
```

`test_port_edges` is the kind of test that would have caught the `> 400` bug: always test the values right at the limits. You could also add `"0"` and `"65536"`, which must both raise a `ValueError`.

</details>

## Check yourself

**1. How does pytest know which functions are tests?**

<details>
<summary>Answer</summary>

It looks in files whose names start with `test_`, and runs every function in them whose name starts with `test_`.

</details>

**2. What does `assert is_error(400)` do when `is_error(400)` returns `False`?**

<details>
<summary>Answer</summary>

It raises an `AssertionError`, so the test fails, and pytest shows the line and the value it got.

</details>

**3. Why write a failing test before fixing a reported bug?**

<details>
<summary>Answer</summary>

It proves you can reproduce the bug, it shows when the fix works, and it stays as a regression test so the same bug cannot come back unnoticed.

</details>

**4. In step 6, what did the printed output tell you, and why did it point to the bug?**

<details>
<summary>Answer</summary>

It printed only one line, `code=200 errors=0`, for a list of four codes. So the loop ran once, which meant something ended the function in the first iteration: the `return` indented inside the loop.

</details>

**5. Which debugger command prints the value of a variable called `total`?**

<details>
<summary>Answer</summary>

`p total`.

</details>

## Common mistakes

- **A test file pytest does not find.** If pytest says `no tests ran`, check that the file and the functions start with `test_`.
- **Running the system pytest or none at all.** `pytest: command not found` usually means the venv is not active. Run `source .venv/bin/activate` first.
- **Only testing the easy cases.** Bugs hide at the limits: 0, 1, the last valid value, the first invalid one, an empty list.
- **Changing code at random.** If you cannot explain the cause in one sentence, you are guessing. Go back to printing values until you can.
- **Leaving debug prints and `breakpoint()` in.** They clutter the output or stop the program for other people. Remove them once the bug is fixed.

## Key terms

- **Test**: code that runs other code with a known input and checks the result.
- **assert**: a statement that raises an `AssertionError` when its condition is false.
- **pytest**: a popular package that finds and runs tests and reports which ones failed.
- **Bug**: a mistake in a program that makes it behave wrongly.
- **Debugging**: finding the cause of a bug and fixing it.
- **Off-by-one error**: a bug at the edge of a range, such as `>` where `>=` was needed.
- **Regression test**: a test written for a fixed bug, so that it fails if the bug ever comes back.
- **Debugger**: a tool that pauses a running program so you can look at its values and run it line by line.

## Go further

- [pytest: Get Started](https://docs.pytest.org/en/stable/getting-started.html): the official first steps with pytest, including more ways to check exceptions.
- [pdb: The Python Debugger](https://docs.python.org/3/library/pdb.html): every debugger command, from the Python documentation.
