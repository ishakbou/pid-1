---
title: Functions
description: Package code into named, reusable functions that take parameters and give back a return value.
lesson: "3.3"
time: 20 min
sidebar:
  order: 3
---

Imagine you wrote four lines that turn a size in bytes into a readable text like `3.5 MB`, and you pasted them into three places of your script. Then you find a bug in those four lines. Now you have to fix it three times, and you will forget one. Functions solve exactly this problem: write the code once, give it a name, and use the name everywhere.

## Goal

After this lesson you can:

- Define a function with `def` and call it.
- Pass values in with parameters and get a result out with `return`.
- Explain why a variable created inside a function does not exist outside it.

## Why it matters

Real programs are made of many small functions, each doing one job with a clear name: `read_log`, `count_errors`, `send_alert`. Small functions are easier to read, to test and to fix, because each one can be checked on its own. In lesson 3.9 you will write tests for functions, and in the project step your log analyzer is a handful of functions working together.

## The idea

A **function** is a named block of code that runs when you call it. You have used functions since lesson 3.1: `print`, `len` and `int` are functions that come with Python. Now you write your own.

```python
def to_mb(size_bytes):
    return size_bytes / 1_000_000

print(to_mb(3_500_000))
print(to_mb(250_000) + to_mb(750_000))
```

```output
3.5
1.0
```

`def` starts a **function definition**. Then come the function's name, a pair of parentheses with its parameters, and a colon. The indented block below is the body. Defining a function does not run it. The body runs only when you **call** the function, by writing its name followed by parentheses.

A **parameter** is a variable in the definition, here `size_bytes`. An **argument** is the value you pass when you call, here `3_500_000`. When the call happens, Python puts the argument into the parameter and runs the body. `return` ends the function and hands a value back to the place where it was called. That value is the **return value**, and you can use it like any other value: print it, store it, add it to something.

A function works like a recipe card. You write it once. Each time you use it, you bring the ingredients (the arguments), follow the same steps, and get a dish back (the return value). The card itself does not cook anything until someone uses it.

## Try it

### 1. Define a function and call it

```bash
mkdir -p ~/pylab/functions
cd ~/pylab/functions
```

```python title="banner.py"
def banner():
    print("==========")
    print("  mylab")
    print("==========")

print("Starting")
banner()
banner()
```

```bash
python3 banner.py
```

```output
Starting
==========
  mylab
==========
==========
  mylab
==========
```

`Starting` comes first, even though the `def` is above it. Python reads the definition and remembers it, but runs the body only at each call. The two calls print the banner twice from one definition.

### 2. Give it parameters

```python
def greet(name, role):
    print(f"Welcome {name}, you are logged in as {role}")

greet("sam", "student")
greet("alex", "admin")
greet(role="guest", name="kim")
```

```output
Welcome sam, you are logged in as student
Welcome alex, you are logged in as admin
Welcome kim, you are logged in as guest
```

Arguments are matched to parameters by position: the first argument goes into the first parameter. In the last call they are **keyword arguments**: you write the parameter's name with `=`, and then the order does not matter. Keyword arguments make a call easier to read when a function has several parameters.

### 3. Return a value instead of printing it

```python title="sizes.py"
def to_mb(size_bytes):
    return size_bytes / 1_000_000

def show(size_bytes):
    print(size_bytes / 1_000_000)

a = to_mb(2_000_000)
b = show(2_000_000)
print("a is", a)
print("b is", b)
```

```bash
python3 sizes.py
```

```output
2.0
a is 2.0
b is None
```

Both functions do the same calculation, but only `to_mb` gives the result back. `show` prints it and returns nothing, so the program cannot use the number later. A function without `return` gives back the special value `None`, which means "no value". As a rule, let functions return results and let the main part of the program decide what to print.

### 4. Give a parameter a default value

```python
def convert(size_bytes, unit="MB"):
    if unit == "KB":
        return size_bytes / 1_000
    elif unit == "GB":
        return size_bytes / 1_000_000_000
    return size_bytes / 1_000_000

print(convert(5_000_000))
print(convert(5_000_000, "KB"))
print(convert(5_000_000, unit="GB"))
```

```output
5.0
5000.0
0.005
```

`unit="MB"` gives the parameter a **default value**: if the caller does not pass a unit, the function uses `"MB"`. Notice also that a function can have several `return` lines. The first one that runs ends the function, so the last line only runs when neither `KB` nor `GB` matched.

### 5. Return a boolean

```python title="check.py"
def is_strong(password):
    """Return True if the password is long and has a digit."""
    if len(password) < 12:
        return False
    for ch in password:
        if ch.isdigit():
            return True
    return False

print(is_strong("short1"))
print(is_strong("correct-horse-battery"))
print(is_strong("correct-horse-battery-9"))
```

```bash
python3 check.py
```

```output
False
False
True
```

A function that answers a yes-or-no question usually has a name starting with `is_` or `has_` and returns a boolean. Then the caller can write `if is_strong(pw):`, which reads like plain English. The text in triple quotes right under the `def` line is a **docstring**: a short description of what the function does. Editors show it when you use the function, and it reminds you later what the function promises to do.

### 6. See that variables inside stay inside

```python title="scope.py"
def count_digits(text):
    digits = 0
    for ch in text:
        if ch.isdigit():
            digits += 1
    return digits

print(count_digits("room 101"))
print(digits)
```

```bash
python3 scope.py
```

```output
3
Traceback (most recent call last):
  File "/home/sam/pylab/functions/scope.py", line 9, in <module>
    print(digits)
          ^^^^^^
NameError: name 'digits' is not defined
```

The call works and prints `3`. But `digits` was created inside the function, so it is a **local variable**: it exists only while the function runs, and it is gone afterwards. The part of a program where a name exists is its **scope**. This is a feature, not a limit: two functions can both use a variable called `count` without disturbing each other. To get a value out of a function, return it. The path shows the user `sam`; yours shows your own username.

### 7. Build functions from functions

```python
def to_mb(size_bytes):
    return size_bytes / 1_000_000

def report(name, size_bytes):
    mb = to_mb(size_bytes)
    if mb > 100:
        return f"{name}: {mb:.1f} MB, too big"
    return f"{name}: {mb:.1f} MB, ok"

print(report("auth.log", 2_400_000))
print(report("backup.tar", 730_000_000))
```

```output
auth.log: 2.4 MB, ok
backup.tar: 730.0 MB, too big
```

`report` calls `to_mb` instead of doing the division itself. If you later decide that a megabyte is 1,048,576 bytes, you change one line in `to_mb`, and every function that uses it follows.

## Exercise

In `~/pylab/functions`, write `human.py` with a function `human_size(size_bytes)` that returns a string:

- below 1,000 bytes: the number and `B`, as in `512 B`
- below 1,000,000: kilobytes with one decimal, as in `1.5 KB`
- below 1,000,000,000: megabytes with one decimal, as in `3.2 MB`
- otherwise: gigabytes with one decimal, as in `7.0 GB`

Call it with `512`, `1536`, `3_200_000` and `7_000_000_000`, and print each result.

<details>
<summary>Show the solution</summary>

```python title="human.py"
def human_size(size_bytes):
    """Return a size in bytes as a short readable text."""
    if size_bytes < 1_000:
        return f"{size_bytes} B"
    elif size_bytes < 1_000_000:
        return f"{size_bytes / 1_000:.1f} KB"
    elif size_bytes < 1_000_000_000:
        return f"{size_bytes / 1_000_000:.1f} MB"
    return f"{size_bytes / 1_000_000_000:.1f} GB"

print(human_size(512))
print(human_size(1536))
print(human_size(3_200_000))
print(human_size(7_000_000_000))
```

```bash
python3 human.py
```

```output
512 B
1.5 KB
3.2 MB
7.0 GB
```

The order of the checks matters: each `elif` only runs when the size was not smaller than the limit above it. If you printed inside the function instead of returning, move the text into a `return`: the function is more useful when the caller decides what to do with the result.

</details>

## Check yourself

**1. What is the difference between a parameter and an argument?**

<details>
<summary>Answer</summary>

A parameter is the variable named in the function definition, like `size_bytes`. An argument is the actual value passed in a call, like `3_500_000`.

</details>

**2. A function has no `return` line. What does a call to it give back?**

<details>
<summary>Answer</summary>

`None`, the special value that means "no value".

</details>

**3. Why does `print(digits)` fail after `count_digits` has run?**

<details>
<summary>Answer</summary>

`digits` is a local variable of `count_digits`. It exists only inside the function while it runs, so outside it Python reports `NameError: name 'digits' is not defined`.

</details>

**4. With `def convert(size_bytes, unit="MB")`, what does `convert(2_000_000)` use as the unit?**

<details>
<summary>Answer</summary>

`"MB"`, the default value, because the call does not pass a unit.

</details>

**5. Why is it often better to `return` a result than to `print` it?**

<details>
<summary>Answer</summary>

A returned value can be stored, compared, added up or passed to another function. A printed value only goes to the screen, and the program cannot use it any more.

</details>

## Common mistakes

- **Forgetting the parentheses.** `banner` alone does not call the function; `banner()` does.
- **Defining after calling.** If the call comes before the `def` in the file, Python stops with `NameError`, because it has not read the definition yet. Put definitions at the top.
- **Printing instead of returning.** If you get `None` where you expected a value, the function probably prints the result instead of returning it.
- **Code after `return`.** Lines after a `return` in the same block never run. Put everything the function must do before it.
- **Wrong number of arguments.** `greet("sam")` for a function with two parameters gives `TypeError: greet() missing 1 required positional argument: 'role'`. Pass every parameter that has no default value.

## Key terms

- **Function**: a named block of code that runs when it is called, and can give back a value.
- **Function definition**: the `def` line and the indented body below it. It creates the function but does not run it.
- **Call**: running a function by writing its name followed by parentheses, such as `to_mb(500)`.
- **Parameter**: a variable named in a function definition, which receives a value at each call.
- **Argument**: a value passed to a function in a call.
- **Keyword argument**: an argument passed with the parameter's name, such as `unit="GB"`.
- **Return value**: the value a function gives back with `return`. Without `return`, it is `None`.
- **Default value**: the value a parameter takes when the caller does not pass one.
- **Docstring**: a string in triple quotes right under the `def` line that describes what the function does.
- **Local variable**: a variable created inside a function. It exists only while the function runs.
- **Scope**: the part of a program where a name can be used.

## Go further

- [Defining Functions](https://docs.python.org/3/tutorial/controlflow.html#defining-functions): the official tutorial on `def`, `return`, default values and keyword arguments.
- [Built-in Functions](https://docs.python.org/3/library/functions.html): the list of functions that come with Python, such as `len`, `int`, `round` and `max`.
