---
title: Logic and Boolean algebra
description: Use AND, OR, NOT and XOR, read and build truth tables, and work with single bits in Python and Bash using the bitwise operators.
lesson: "5.2"
time: 20 min
sidebar:
  order: 2
---

In Module 1 you typed `chmod 640` and it worked. But what is 640? It is not six hundred and forty of anything. It is nine yes-or-no answers packed into three digits, and by the end of this lesson you will be able to take it apart, change one answer, and put it back together, the same way the kernel does every time you open a file.

## Goal

After this lesson you can:

- Explain AND, OR, NOT and XOR, and write the truth table of each.
- Use Python's bitwise operators `&`, `|`, `^`, `~`, `<<` and `>>` on whole numbers.
- Test, set and clear single bits, for example in a file's permission bits.

## Why it matters

Every decision a processor makes is built from a handful of logic operations, wired together billions of times. You will use the same operations directly as a programmer: permission bits, network masks in Module 6, flags in file formats and the XOR at the heart of many ciphers in Module 10 are all handled bit by bit. And a misread condition in an `if` is one of the easiest ways to put a security hole in a program.

## The idea

A **Boolean** value has only two possible states: true or false. It is named after George Boole, who in the 1840s and 1850s wrote down rules for calculating with true and false the way you calculate with numbers. A computer writes true as 1 and false as 0, which makes every bit from the last lesson a Boolean.

Four operations do almost all the work. A **truth table** lists every possible input and the result for each:

| a | b | a AND b | a OR b | a XOR b | NOT a |
|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 | 1 |
| 0 | 1 | 0 | 1 | 1 | 1 |
| 1 | 0 | 0 | 1 | 1 | 0 |
| 1 | 1 | 1 | 1 | 0 | 0 |

- **AND** is 1 only when both inputs are 1.
- **OR** is 1 when at least one input is 1.
- **XOR** ("exclusive or") is 1 when the inputs are different.
- **NOT** has one input and flips it.

Picture a lamp, a battery and two switches. Put the switches one after the other on the same wire, and the lamp lights only when both are closed: that is AND. Put them side by side, on two parallel wires, and either switch is enough: that is OR. Inside a chip, the switches are **transistors**, and a small circuit that computes one of these operations is called a **logic gate**.

**Boolean algebra** is the set of rules for rewriting such expressions without changing their result. One famous pair is **De Morgan's laws**: "not (a and b)" is the same as "(not a) or (not b)". You can check a rule like that by trying every row of the truth table, and in step 2 you let Python do exactly that.

### Bitwise operators: logic on every bit at once

A **bitwise operator** applies a logic operation to each pair of bits in the same position of two numbers. Here is 12 AND 10, bit by bit:

```text
  1100   (12)
& 1010   (10)
  ----
  1000   (8)
```

Only the leftmost position has a 1 in both numbers, so only that bit survives. The six bitwise operators in Python (and in C, Java, JavaScript and Bash) are:

| Operator | Name | What it does to each bit |
|---|---|---|
| `a & b` | AND | 1 where both are 1 |
| `a \| b` | OR | 1 where at least one is 1 |
| `a ^ b` | XOR | 1 where they differ |
| `~a` | NOT | flips every bit |
| `a << n` | left shift | moves the bits n places left (multiplies by 2 n times) |
| `a >> n` | right shift | moves the bits n places right (divides by 2 n times, dropping the remainder) |

A number used to pick out certain bits is called a **mask**. Three moves cover almost every use: `value & mask` tests bits, `value | mask` sets them to 1, and `value & ~mask` clears them to 0.

## Try it

```bash
mkdir ~/logic
cd ~/logic
```

### 1. Print the truth tables

```python title="truth.py"
print("a b | and or xor")
for a in (0, 1):
    for b in (0, 1):
        print(a, b, "|", a & b, "  ", a | b, " ", a ^ b)
```

```bash
python3 truth.py
```

```output
a b | and or xor
0 0 | 0    0   0
0 1 | 0    1   1
1 0 | 0    1   1
1 1 | 1    1   0
```

The two loops visit every combination of inputs, so this prints the whole table. With only 0 and 1 as inputs, the bitwise operators behave exactly like the logic operations in the table above.

### 2. Check a law of Boolean algebra

```python title="demorgan.py"
for a in (False, True):
    for b in (False, True):
        left = not (a and b)
        right = (not a) or (not b)
        print(a, b, left == right)
```

```bash
python3 demorgan.py
```

```output
False False True
False True True
True False True
True True True
```

Here the words `and`, `or` and `not` are Python's logic operators on `True` and `False`. Both sides agree on all four rows, so the law holds. This is how you can simplify a tangled `if` condition and prove that you did not change its meaning.

### 3. Work on whole numbers, bit by bit

```python title="bitwise.py"
a, b = 12, 10
print(f"a      = {a:04b}")
print(f"b      = {b:04b}")
print(f"a & b  = {a & b:04b}  ({a & b})")
print(f"a | b  = {a | b:04b}  ({a | b})")
print(f"a ^ b  = {a ^ b:04b}  ({a ^ b})")
print(f"a << 1 = {a << 1:05b} ({a << 1})")
print(f"a >> 2 = {a >> 2:04b}  ({a >> 2})")
```

```bash
python3 bitwise.py
```

```output
a      = 1100
b      = 1010
a & b  = 1000  (8)
a | b  = 1110  (14)
a ^ b  = 0110  (6)
a << 1 = 11000 (24)
a >> 2 = 0011  (3)
```

Read each result column by column against `a` and `b`. Shifting left by one adds a 0 on the right, which doubles the number. Shifting right by two drops the last two bits, which divides by four.

Bash has the same operators inside `$(( ))`:

```bash
echo $((12 & 10)) $((12 | 10)) $((12 ^ 10)) $((1 << 4))
```

```output
8 14 6 16
```

### 4. Take a permission number apart

Each permission is one bit: read is 4 (`100`), write is 2 (`010`), execute is 1 (`001`). Three bits make one **octal** digit, a digit in base 8, which is why `chmod` numbers only use the digits 0 to 7. In Python an octal number starts with `0o`.

```python title="perms.py"
mode = 0o755
print(f"{mode:09b}")
print("owner can write:", bool(mode & 0o200))
print("others can write:", bool(mode & 0o002))
print(oct(mode | 0o020))
print(oct(mode & ~0o005))
```

```bash
python3 perms.py
```

```output
111101101
owner can write: True
others can write: False
0o775
0o750
```

The nine bits are `rwx r-x r-x`, the same thing `ls -l` shows as `rwxr-xr-x`. `mode & 0o200` keeps only the owner's write bit, so the result is not zero exactly when that bit is set. `mode | 0o020` sets the group's write bit. `mode & ~0o005` clears read and execute for others: `~` flips the mask, so every bit is kept except those two.

### 5. Watch the system use a mask

In Lesson 1.2, new files on Ubuntu came out as `-rw-rw-r--`. Here is why.

```bash
umask
touch new.txt
stat -c '%a %A' new.txt
```

```output
0002
664 -rw-rw-r--
```

The **umask** is a mask of bits that new files must not get. Programs ask for `666` (read and write for everyone) when they create a normal file, and the kernel clears every bit that is set in the umask, exactly as in step 4:

```bash
python3 -c 'print(oct(0o666 & ~0o002))'
```

```output
0o664
```

Same answer as `stat`. (On some systems the umask is `0022`, which gives `644` instead.)

### 6. Flip bits with XOR, and flip them back

```python title="flip.py"
print(chr(ord("a") ^ 32), chr(ord("Q") ^ 32))
secret = 0b1010
key = 0b0110
mixed = secret ^ key
print(f"{mixed:04b}", f"{mixed ^ key:04b}")
```

```bash
python3 flip.py
```

```output
A q
1100 1010
```

Remember that `a` and `A` are 32 apart? 32 is a single bit (`100000`), so XOR with 32 switches a letter between lower and upper case. The second line shows the property that cryptography relies on: XOR with a key scrambles the bits, and XOR with the same key again gives back exactly the original.

## Exercise

A file has the mode `640`. Using Python and masks only (no `chmod` yet):

1. Find out whether the group can write, and whether others can read.
2. Compute the new mode if you give the group write permission.
3. Then create a file, apply your new mode with `chmod`, and check it with `stat -c '%a %A'`.

<details>
<summary>Show the solution</summary>

```python title="exercise.py"
mode = 0o640
print("group can write:", bool(mode & 0o020))
print("others can read:", bool(mode & 0o004))
print(oct(mode | 0o020))
```

```bash
python3 exercise.py
```

```output
group can write: False
others can read: False
0o660
```

`640` is `110 100 000`: the owner reads and writes, the group only reads, others get nothing. Setting the group's write bit gives `110 110 000`, which is `660`.

```bash
touch report.txt
chmod 660 report.txt
stat -c '%a %A' report.txt
```

```output
660 -rw-rw----
```

</details>

## Check yourself

**1. What is `1 AND 0`, `1 OR 0` and `1 XOR 1`?**

<details>
<summary>Answer</summary>

0, 1 and 0. AND needs both inputs to be 1, OR needs at least one, and XOR is 1 only when the inputs differ.

</details>

**2. What is `6 ^ 6`, and why is the answer the same for any number?**

<details>
<summary>Answer</summary>

0. XOR gives 1 only where the bits differ, and a number has no bit that differs from itself.

</details>

**3. Which bitwise expression tells you whether others may execute a file whose mode is in `mode`?**

<details>
<summary>Answer</summary>

`mode & 0o001`. The result is 1 if the bit is set and 0 if it is not, so `bool(mode & 0o001)` gives `True` or `False`.

</details>

**4. What does `5 << 3` give, and why?**

<details>
<summary>Answer</summary>

40. Shifting left by three places multiplies by 2 three times: 5 × 8 = 40. In binary, `101` becomes `101000`.

</details>

**5. With a umask of `0022`, which mode does a new normal file get?**

<details>
<summary>Answer</summary>

`644`, shown as `rw-r--r--`. The file is requested as `666`, and the umask clears the write bit for the group and for others: `0o666 & ~0o022` is `0o644`.

</details>

## Common mistakes

- **Using `^` for powers.** In Python, `2 ^ 3` is XOR and gives 1. A power is written `2 ** 3`, which gives 8.
- **Mixing `and` with `&`.** `and` works on whole truth values and stops early. `&` works on every bit of two numbers. `6 and 3` is 3, but `6 & 3` is 2. Use `and`, `or` and `not` in conditions, and the bitwise operators when you mean bits.
- **Forgetting the `0o` prefix.** In Python, `755` is the decimal number seven hundred and fifty-five, which is a completely different set of bits from `0o755`.
- **Being surprised by `~` in Python.** `~5` gives `-6`, because Python numbers have no fixed width and `~` flips an endless row of bits. Use `~` only inside a mask expression such as `mode & ~0o022`, where it does what you expect.

## Key terms

- **Boolean**: a value that is either true or false, written 1 or 0 by a computer.
- **Truth table**: a table that lists every possible input of a logic operation and its result.
- **AND**: a logic operation that is true only when both inputs are true.
- **OR**: a logic operation that is true when at least one input is true.
- **XOR**: "exclusive or", a logic operation that is true when its two inputs differ.
- **NOT**: a logic operation that flips its single input.
- **Transistor**: a tiny electronic switch. Chips are built from billions of them.
- **Logic gate**: a small circuit, made of transistors, that computes one logic operation.
- **Boolean algebra**: the rules for calculating with true and false, and for rewriting logic expressions without changing their result.
- **De Morgan's laws**: "not (a and b)" equals "(not a) or (not b)", and "not (a or b)" equals "(not a) and (not b)".
- **Bitwise operator**: an operator such as `&`, `|`, `^` or `~` that works on each bit of a number separately.
- **Mask**: a number whose bits pick out the bits you want to test, set or clear in another number.
- **Octal**: writing numbers in base 8, with the digits 0 to 7. One octal digit is three bits.
- **umask**: a mask of permission bits that new files and directories do not get.

## Go further

- [Python: Bitwise operations on integer types](https://docs.python.org/3/library/stdtypes.html#bitwise-operations-on-integer-types): the official table of the operators and their exact rules.
- [Python: Boolean operations](https://docs.python.org/3/library/stdtypes.html#boolean-operations-and-or-not): how `and`, `or` and `not` work, including when they stop early.
- [MDN: Bitwise AND](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_AND): the same operators in JavaScript, with clear bit-by-bit examples you will need in Module 8.
