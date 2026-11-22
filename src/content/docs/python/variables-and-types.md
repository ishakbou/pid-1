---
title: Variables and types
description: Run Python from the terminal, store values in variables, and work with whole numbers, decimal numbers, text and true-or-false values.
lesson: "3.1"
time: 20 min
sidebar:
  order: 1
---

Your Ubuntu already has a programming language installed, and you have not used it yet. Many of the tools that keep Ubuntu running are written in Python, so it ships with the system. In this lesson you wake it up, give it a few values to remember, and find out why Python thinks that `0.1 + 0.2` is not quite `0.3`.

## Goal

After this lesson you can:

- Run Python code from the terminal and from a file.
- Store values in variables and print them inside sentences.
- Work with numbers, strings and booleans, and convert one type into another.

## Why it matters

Bash scripts are great for gluing commands together, but they get painful as soon as you need to calculate, compare or keep track of many things. Python is the language most security and system people reach for at that point: to read logs, check configuration files, talk to servers and automate boring work. Every program you write in this module, including the log analyzer at the end, is built from the small pieces in this lesson.

## The idea

A **program** is a list of instructions that the computer runs one after the other, from top to bottom. Python reads your instructions line by line and does what each one says. A file that holds Python code is called a **script**, and its name ends in `.py`.

Programs need to remember things: a username, a price, how many failed logins there were. For that you use a **variable**: a name that points to a value. You create one with `=`, which in Python means "make this name point to this value", not "is equal to".

```python
port = 22
print(port)
```

```output
22
```

Think of a variable as a name tag stuck on a value. `port = 22` sticks the tag `port` on the number 22. If you later write `port = 8080`, you move the tag to a new value. The old 22 is not changed, it just loses its tag.

Every value has a **type**, which decides what you can do with it. You can divide numbers but not words, and you can make words uppercase but not numbers. Four types cover most of your first programs:

| Type | Name | Examples | Used for |
|---|---|---|---|
| `int` | integer | `22`, `-3`, `1_000_000` | whole numbers: counts, ports, ages |
| `float` | floating-point number | `3.5`, `0.1`, `-2.0` | numbers with a decimal point: prices, averages |
| `str` | string | `"sam"`, `'GET /'` | text, always between quotes |
| `bool` | boolean | `True`, `False` | yes-or-no answers |

Python works out the type from the value itself. You never write "this variable is a number": the quotes, the decimal point or the word `True` already say it.

## Try it

The outputs below come from Ubuntu 24.04 with Python 3.12. Your version number may be a little different; everything in this module works on Python 3.10 and newer.

### 1. Check that Python is there

```bash
python3 --version
```

```output
Python 3.12.3
```

On Ubuntu the command is `python3`, not `python`. The `3` is part of the name because Python 2, an old version, used to be installed next to it.

If you type `python3` alone, you get the **interactive mode**: a `>>>` prompt where each line runs as soon as you press Enter. It is handy for quick tests. Type `exit()` or press Ctrl+D to leave it. In this course you will mostly write scripts, because a script can be saved, run again and improved.

### 2. Write your first script

```bash
mkdir -p ~/pylab/basics
cd ~/pylab/basics
```

Every lesson of this module works in its own folder under `~/pylab`. Create a file called `hello.py` in that folder with your editor, with this content:

```python title="hello.py"
# My first Python script
print("Hello from Python")
print("2 + 3 is", 2 + 3)
```

```bash
python3 hello.py
```

```output
Hello from Python
2 + 3 is 5
```

`print` shows values on the screen. It is a function: a named piece of code that does one job when you call it, with the values for it in parentheses. Python comes with many functions, and lesson 3.3 shows you how to write your own. When you give `print` several values separated by commas, it prints them with one space between them. The first line starts with `#`: that is a **comment**, a note for humans that Python skips.

### 3. Store values in variables

```python title="login.py"
username = "sam"
failed_logins = 3
locked = False

print(username)
print(f"{username} has {failed_logins} failed logins")
print("Locked:", locked)
```

```bash
python3 login.py
```

```output
sam
sam has 3 failed logins
Locked: False
```

The second `print` uses an **f-string**: a string with an `f` before the opening quote. Inside it, anything between `{` and `}` is replaced by its value. It is the easiest way to put values into a sentence.

Variable names may contain letters, digits and underscores, and must not start with a digit. They are case sensitive: `Port` and `port` are two different variables. Python programmers write names in lowercase with underscores, like `failed_logins`. This style is called snake_case.

### 4. Calculate with numbers

For short examples like this one, save the code in a file such as `try.py` and run `python3 try.py`, or type the lines into the interactive mode.

```python
print(7 + 2, 7 - 2, 7 * 2)
print(7 / 2)
print(7 // 2)
print(7 % 2)
print(2 ** 10)
```

```output
9 5 14
3.5
3
1
1024
```

`/` always gives a float, even when the result is whole. `//` divides and rounds down to a whole number: for positive numbers, it simply drops the part after the decimal point. `%` gives the remainder, which is useful to check if a number is even. `**` is "to the power of".

```python
price = 19.99
quantity = 3
total = price * quantity
print(total)
print(f"Total: {total:.2f}")
print(0.1 + 0.2)
```

```output
59.97
Total: 59.97
0.30000000000000004
```

`:.2f` inside the braces means "show this float with 2 digits after the point". And the last line is not a bug in Python. Computers store floats in binary, and most decimal fractions, like 0.1, cannot be stored exactly in binary, just as 1/3 cannot be written exactly in decimal. The tiny error is normal. For money, count in cents with integers, or round when you print.

### 5. Work with strings

```python
host = "server01.lab"
print(len(host))
print(host.upper())
print(host[0])
print(host[-3:])
print(host[0:6])
print(host.replace("01", "02"))
print("lab" in host)
print("ab" * 3)
```

```output
12
SERVER01.LAB
s
lab
server
server02.lab
True
ababab
```

`len` counts the characters. `host.upper()` is a **method**: a function that belongs to a value, called with a dot. The square brackets pick characters by position, called an **index**, and Python counts from 0, so `host[0]` is the first letter. A negative index counts from the end. `[-3:]` is a **slice**: a part of the string, taken by position. It means "from the third-last character to the end". `host[0:6]` takes the characters from index 0 up to, but not including, index 6. `in` asks whether one string is inside another, and the answer is a boolean.

Strings never change in place. `host.replace(...)` gives you a new string and leaves `host` as it was. To keep the result, store it: `host = host.replace("01", "02")`.

### 6. Compare things

```python
print(5 > 3)
print(10 == 10.0)
print("sam" == "Sam")
print(type(42), type(4.2), type("42"), type(True))
```

```output
True
True
False
<class 'int'> <class 'float'> <class 'str'> <class 'bool'>
```

A comparison gives a boolean. `==` asks "are these equal?" and is not the same as `=`, which stores a value. Comparing strings is exact, so capital letters count. The `type` function tells you what type a value has, which helps a lot when something behaves strangely.

### 7. Convert between types

```python
age_text = "42"
age = int(age_text)
print(age + 1)
print(float("3.5") * 2)
print("Port " + str(22))
```

```output
43
7.0
Port 22
```

Text that your program reads from a file or gets from a user arrives as a string, even when it looks like a number. `int()`, `float()` and `str()` turn a value into another type. Now see what happens when you forget:

```python title="mix.py"
count = "3"
print(count + 1)
```

```bash
python3 mix.py
```

```output
Traceback (most recent call last):
  File "/home/sam/pylab/basics/mix.py", line 2, in <module>
    print(count + 1)
          ~~~~~~^~~
TypeError: can only concatenate str (not "int") to str
```

Python stops and prints an error. Read the last line first: it says that `+` with a string on the left can only add another string. Python does not guess whether you meant the number 4 or the text `31`, so you must convert yourself: `int(count) + 1`. Lesson 3.6 shows you how to read the whole message. The path shows the user `sam`; you see your own username.

## Exercise

Write a script `size.py` in `~/pylab/basics` that:

1. Stores a file size of `3500000` bytes in a variable.
2. Converts it to megabytes (1 megabyte is 1,000,000 bytes here).
3. Prints `Size: 3.50 MB`, with two digits after the point.
4. Prints `Bigger than 1 MB: True`, where `True` is the result of a real comparison, not typed by hand.

<details>
<summary>Show the solution</summary>

```python title="size.py"
size_bytes = 3500000
size_mb = size_bytes / 1000000
print(f"Size: {size_mb:.2f} MB")
print("Bigger than 1 MB:", size_mb > 1)
```

```bash
python3 size.py
```

```output
Size: 3.50 MB
Bigger than 1 MB: True
```

Your variable names may differ, and that is fine. Without `:.2f` the script prints `3.5`, because Python does not add zeros you did not ask for. You can also write the number as `3_500_000`: Python ignores the underscores, and they make big numbers easier to read.

</details>

## Check yourself

**1. What is the difference between `=` and `==`?**

<details>
<summary>Answer</summary>

`=` stores a value in a variable: `port = 22`. `==` compares two values and gives `True` or `False`: `port == 22`.

</details>

**2. What do `7 / 2` and `7 // 2` print, and why are they different?**

<details>
<summary>Answer</summary>

`7 / 2` prints `3.5`: normal division always gives a float. `7 // 2` prints `3`: it divides and rounds down to a whole number.

</details>

**3. What type is `"80"`, and how do you add 1 to it?**

<details>
<summary>Answer</summary>

It is a string (`str`), because it is between quotes. Convert it first: `int("80") + 1` gives `81`.

</details>

**4. If `host = "web01"`, what is `host[0]`, and what is `host[-2:]`?**

<details>
<summary>Answer</summary>

`host[0]` is `"w"`, because indexes start at 0. `host[-2:]` is `"01"`, the last two characters.

</details>

**5. Why does `print(0.1 + 0.2)` not print `0.3`?**

<details>
<summary>Answer</summary>

Floats are stored in binary, and 0.1 and 0.2 cannot be stored exactly in binary. The sum has a tiny error, so Python prints `0.30000000000000004`. Round when you print, for example with `:.2f`, or count money in whole cents.

</details>

## Common mistakes

- **Typing `python` instead of `python3`.** On Ubuntu, `python` may say `command not found`. Use `python3`.
- **Mixing strings and numbers.** `"3" + 1` fails with a `TypeError`. Convert first with `int()` or `str()`, depending on what you want.
- **Forgetting the quotes.** `name = sam` makes Python look for a variable called `sam` and fail with `NameError`. Text needs quotes: `name = "sam"`.
- **Forgetting the `f`.** `print("{username} logged in")` prints the braces as they are. Write `print(f"{username} logged in")`.
- **Wrong capital letters.** `True` and `False` start with a capital letter, and `Print` is not `print`. Python is case sensitive everywhere.

## Key terms

- **Program**: a list of instructions that the computer runs in order.
- **Script**: a file of Python code, with a name ending in `.py`, that you run with `python3 file.py`.
- **Interactive mode**: the `>>>` prompt you get by typing `python3` alone. Each line runs when you press Enter.
- **Comment**: text after a `#`. Python skips it; it is a note for humans.
- **Variable**: a name that points to a value, created with `=`.
- **Type**: the kind of a value, such as `int`, `float`, `str` or `bool`. It decides what you can do with the value.
- **Integer** (`int`): a whole number, such as `22` or `-3`.
- **Float**: a number with a decimal point, such as `3.5`. It can carry tiny rounding errors.
- **String** (`str`): text between quotes.
- **Boolean** (`bool`): one of the two values `True` and `False`.
- **f-string**: a string with an `f` before the quote, where `{name}` is replaced by the value of `name`.
- **Method**: a function that belongs to a value and is called with a dot, such as `host.upper()`.
- **Index**: the position of an item, counted from 0. `host[0]` is the first character.
- **Slice**: a part of a string or list taken by position, such as `host[-3:]` or `host[0:6]`.

## Go further

- [The Python Tutorial: An Informal Introduction to Python](https://docs.python.org/3/tutorial/introduction.html): the official tutorial's first steps with numbers and text, with more examples.
- [Built-in Types](https://docs.python.org/3/library/stdtypes.html): the reference for every method of numbers and strings. Look things up here when you need them.
- [Floating-Point Arithmetic: Issues and Limitations](https://docs.python.org/3/tutorial/floatingpoint.html): the full story behind `0.1 + 0.2`, from the official documentation.
