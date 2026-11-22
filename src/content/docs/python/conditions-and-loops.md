---
title: Conditions and loops
description: Make your programs choose between actions with if, elif and else, and repeat work with for and while loops.
lesson: "3.2"
time: 20 min
sidebar:
  order: 2
---

A login page makes the same small decision thousands of times a day: is this password right, yes or no? A log checker does one boring thing a million times: read a line, look at it, move on to the next. Those two moves, choosing and repeating, are what turn a list of instructions into a real program. Python has three words for them: `if`, `for` and `while`.

## Goal

After this lesson you can:

- Make a program choose what to do with `if`, `elif` and `else`.
- Combine conditions with `and`, `or` and `not`.
- Repeat work with `for` and `while`, and stop a loop early with `break`.

## Why it matters

Without conditions, a program does exactly the same thing every time, whatever its input. Without loops, you would need one line of code per log line, per file, per user. Almost every useful script you will write, from a backup check to a brute-force detector, is a loop with a decision inside it.

## The idea

A **condition** is an expression that is either `True` or `False`, such as `port == 22` or `size > 1000`. An `if` statement runs a block of code only when its condition is true:

```python
failed = 5
if failed >= 3:
    print("Too many failed logins")
    print("Account locked")
print("Check done")
```

```output
Too many failed logins
Account locked
Check done
```

The line with `if` ends with a colon. The lines that belong to it are indented by four spaces: that indented group is called a **block**. Python uses the indentation itself to know where the block ends, so `print("Check done")`, back at the left edge, runs whatever the condition says.

A **loop** runs a block again and again. A `for` loop goes through a series of items, one at a time. A `while` loop keeps going as long as a condition stays true. Think of `for` as "for each page of this book, read it", and `while` as "while the kettle is not boiling, wait". The first knows in advance how many times it runs; the second checks every time.

Here are the operators you use in conditions:

| Operator | Meaning | Example that is `True` |
|---|---|---|
| `==` | equal | `22 == 22` |
| `!=` | not equal | `"GET" != "POST"` |
| `<`, `>` | less than, greater than | `3 < 5` |
| `<=`, `>=` | less or equal, greater or equal | `5 >= 5` |
| `and` | both are true | `3 < 5 and 5 < 9` |
| `or` | at least one is true | `1 > 5 or 2 > 1` |
| `not` | turns true into false and back | `not False` |

## Try it

For the short examples, save the code in a file and run it with `python3`, as in lesson 3.1. The longer ones have a file name on top.

### 1. Make a choice with if, elif and else

```bash
mkdir -p ~/pylab/loops
cd ~/pylab/loops
```

```python title="service.py"
port = 443

if port == 22:
    print("SSH, remote login")
elif port == 80:
    print("HTTP, plain web")
elif port == 443:
    print("HTTPS, encrypted web")
else:
    print("Not a port I know")
```

```bash
python3 service.py
```

```output
HTTPS, encrypted web
```

Python checks the conditions from top to bottom and runs the first block whose condition is true. Then it skips the rest. `elif` is short for "else if", and you can have as many as you need. `else` has no condition: it catches everything that did not match. Change `port` to `8080`, run the script again, and you get `Not a port I know`.

### 2. Combine conditions

```python
password = "winter2026"
long_enough = len(password) >= 12
has_digit = "2" in password or "0" in password

if long_enough and has_digit:
    print("Accepted")
elif not long_enough:
    print("Too short:", len(password), "characters")
```

```output
Too short: 10 characters
```

`and` needs both sides to be true, `or` needs at least one, and `not` flips a boolean. Storing each check in a variable with a clear name, like `long_enough`, makes the `if` line read almost like a sentence. The digit check here is clumsy on purpose: step 4 does it properly.

### 3. Repeat with for and range

```python
for i in range(5):
    print("Attempt", i)
```

```output
Attempt 0
Attempt 1
Attempt 2
Attempt 3
Attempt 4
```

`range(5)` produces the numbers 0, 1, 2, 3 and 4: five numbers, starting at 0, stopping before 5. On each turn of the loop, the variable `i` holds the next number. One turn of a loop is called an **iteration**.

```python
total = 0
for n in range(1, 101):
    total = total + n
print("Sum of 1 to 100:", total)
print(list(range(0, 20, 5)))
```

```output
Sum of 1 to 100: 5050
[0, 5, 10, 15]
```

With two numbers, `range(1, 101)` starts at 1 and stops before 101. A third number is the step. `total` is an **accumulator**: a variable that starts at zero and grows on every iteration. You will use this pattern all the time, for sums and for counts. You can also write `total += n`, which means the same as `total = total + n`. The `list(...)` around the last range only makes Python show all the numbers at once; lesson 3.4 explains lists.

### 4. Loop over the characters of a string

```python title="digits.py"
password = "s3cr3t-2026"
digits = 0

for ch in password:
    if ch.isdigit():
        digits += 1

print(f"{password} has {digits} digits")
```

```bash
python3 digits.py
```

```output
s3cr3t-2026 has 6 digits
```

A `for` loop works on anything that holds several items, and a string holds characters. So `ch` is `"s"`, then `"3"`, then `"c"`, and so on. `isdigit()` is a string method that answers `True` when every character is a digit. Notice the two levels of indentation: the `if` is inside the `for`, and `digits += 1` is inside the `if`.

### 5. Repeat with while

A log file starts at 1 MB and doubles in size every day. After how many days is it bigger than 1000 MB?

```python title="growth.py"
size = 1
days = 0

while size <= 1000:
    size = size * 2
    days += 1

print(f"After {days} days the log is {size} MB")
```

```bash
python3 growth.py
```

```output
After 10 days the log is 1024 MB
```

Before each iteration, `while` checks its condition. As long as `size` is 1000 or less, the block runs again. You did not know the number of days in advance, so `while` fits better than `for` here. The block must change something that the condition depends on, here `size`. If it never does, you have written an **infinite loop**: a loop whose condition never becomes false, so it never stops by itself.

:::caution[Stuck in a loop]
If a program keeps running and never gives the prompt back, you probably wrote a loop whose condition never becomes false. Press Ctrl+C: it stops the program, and Python prints `KeyboardInterrupt`. Then check what your loop changes on every turn.
:::

### 6. Leave a loop early with break, skip with continue

```python
for port in range(20, 30):
    if port == 23:
        print(port, "is Telnet, skipping")
        continue
    if port == 25:
        print(port, "is SMTP, stopping here")
        break
    print("Checking", port)
```

```output
Checking 20
Checking 21
Checking 22
23 is Telnet, skipping
Checking 24
25 is SMTP, stopping here
```

`continue` jumps straight to the next iteration, so `Checking 23` is never printed. `break` leaves the loop at once, so ports 26 to 29 are never reached. Both work in `for` and `while` loops.

### 7. Let Python decide what counts as true

```python
name = ""
if name:
    print("Hello", name)
else:
    print("No name given")
```

```output
No name given
```

`if` does not need a real comparison. An empty string, the number 0 and a few other empty values count as false. Every other value counts as true. `if name:` is the Python way to say "if name is not empty".

## Exercise

In `~/pylab/loops`, write `strength.py`. It starts with `password = "Blue-Kettle-42"` and:

1. Counts the uppercase letters and the digits in the password, with one `for` loop. The string method `isupper()` works like `isdigit()`.
2. Prints `Strong` if the password has at least 12 characters, at least one uppercase letter and at least one digit.
3. Otherwise prints `Weak`.
4. Prints the two counts on the last line, as in `Uppercase: 2, digits: 2`.

Then try it with `"password123"`, which should be weak.

<details>
<summary>Show the solution</summary>

```python title="strength.py"
password = "Blue-Kettle-42"
upper = 0
digits = 0

for ch in password:
    if ch.isupper():
        upper += 1
    elif ch.isdigit():
        digits += 1

if len(password) >= 12 and upper > 0 and digits > 0:
    print("Strong")
else:
    print("Weak")

print(f"Uppercase: {upper}, digits: {digits}")
```

```bash
python3 strength.py
```

```output
Strong
Uppercase: 2, digits: 2
```

With `"password123"` it prints `Weak` and `Uppercase: 0, digits: 3`: it has 11 characters and no uppercase letter. The `elif` is fine here because a character cannot be uppercase and a digit at the same time.

</details>

## Check yourself

**1. What does Python use to know which lines belong to an `if`?**

<details>
<summary>Answer</summary>

The indentation. The lines indented under the line that ends with a colon form the block. The first line back at the outer level is no longer part of it.

</details>

**2. Which numbers does `range(2, 8)` produce?**

<details>
<summary>Answer</summary>

2, 3, 4, 5, 6 and 7. It starts at the first number and stops before the second.

</details>

**3. When do you choose `while` instead of `for`?**

<details>
<summary>Answer</summary>

When you do not know in advance how many iterations you need, only the condition for going on, such as "while the file is smaller than 1000 MB". `for` fits when you go through a known series of items.

</details>

**4. What is the difference between `break` and `continue`?**

<details>
<summary>Answer</summary>

`break` leaves the loop completely. `continue` skips the rest of the current iteration and goes on with the next one.

</details>

**5. If `name = ""`, does `if name:` run its block?**

<details>
<summary>Answer</summary>

No. An empty string counts as false, so the `else` block runs if there is one.

</details>

## Common mistakes

- **Forgetting the colon.** `if port == 22` without `:` gives `SyntaxError: expected ':'`. Every `if`, `elif`, `else`, `for` and `while` line ends with a colon.
- **Mixed or missing indentation.** `IndentationError` means the spaces do not line up. Use four spaces per level, and let your editor insert them when you press Tab.
- **`=` in a condition.** `if port = 22:` is a `SyntaxError`. Comparing needs two equal signs: `if port == 22:`.
- **A while loop that never ends.** The block must change what the condition checks. Press Ctrl+C to stop the program, then fix the loop.
- **Off by one with range.** `range(1, 10)` stops at 9. If you want 10 included, write `range(1, 11)`.

## Key terms

- **Condition**: an expression that is either `True` or `False`, used by `if` and `while`.
- **Block**: the indented lines under a line that ends with a colon. They run together.
- **Loop**: code that runs a block several times.
- **Iteration**: one turn of a loop.
- **Accumulator**: a variable that starts at zero or empty and grows on every iteration, such as a total or a count.
- **Infinite loop**: a loop whose condition never becomes false, so it never ends by itself.

## Go further

- [More Control Flow Tools](https://docs.python.org/3/tutorial/controlflow.html): the official tutorial on `if`, `for`, `range`, `break` and `continue`.
- [Truth Value Testing](https://docs.python.org/3/library/stdtypes.html#truth-value-testing): the exact list of values Python treats as false.
