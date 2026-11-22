---
title: Binary, hexadecimal and text encoding
description: Count in binary and hexadecimal, convert numbers between bases, and see how ASCII and UTF-8 turn bytes into the text you read.
lesson: "5.1"
time: 20 min
sidebar:
  order: 1
---

A file that contains only the word `Hi!` is four bytes long. Not three: four. By the end of this lesson you will know what the fourth byte is, you will be able to read every one of those bytes as a number, and you will see why the word `café` can look like `cafÃ©` on someone else's screen.

## Goal

After this lesson you can:

- Count in binary and hexadecimal, and convert a number between binary, decimal and hex.
- Explain what a bit and a byte are, and how many values a byte can hold.
- Read a hex dump of a text file and say how ASCII and UTF-8 store each character.

## Why it matters

Hexadecimal is everywhere once you know how to read it: colours in CSS (`#1F6F50`), memory addresses in error messages, hashes from `git log`, network addresses in Module 6. Security work leans on it even more, because file signatures, encoded attacks and captured packets are all read as hex. And encoding bugs are among the most common bugs there are: a name that turns into garbage, a file that "looks the same" but is not.

## The idea

A computer stores everything as **bits**. A bit is one tiny switch with two states, written `0` and `1`. Eight bits in a row make a **byte**, and a byte is the smallest piece of memory that has its own address.

### Binary: counting with two digits

You count in decimal: ten digits, and each place is worth ten times the place to its right. `507` means 5 hundreds, 0 tens and 7 ones.

**Binary** is the same idea with only two digits. Each place is worth twice the place to its right: 1, 2, 4, 8, 16, 32, 64, 128.

| Place value | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
|---|---|---|---|---|---|---|---|---|
| `00001011` | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 1 |

Add up the places that hold a 1: 8 + 2 + 1 = 11. So binary `1011` is decimal 11. A byte with all eight bits set is 128 + 64 + ... + 1 = 255, so one byte holds 256 different values, from 0 to 255.

Think of the odometer in an old car, but with wheels that only have the digits 0 and 1. Every time the right wheel goes past 1, it rolls back to 0 and pushes the next wheel one step. That is exactly how binary counting works: `0`, `1`, `10`, `11`, `100`.

### Hexadecimal: binary for humans

Long rows of 0s and 1s are hard to read. **Hexadecimal**, or hex, uses sixteen digits: `0` to `9`, then `a` to `f` for 10 to 15. The trick is that one hex digit covers exactly four bits, so every byte is exactly two hex digits.

| Decimal | Binary | Hex |
|---|---|---|
| 9 | `1001` | `9` |
| 10 | `1010` | `a` |
| 15 | `1111` | `f` |
| 16 | `1 0000` | `10` |
| 255 | `1111 1111` | `ff` |

To turn binary into hex, cut it into groups of four from the right and replace each group: `1100 1000` is `c8`. Programmers write `0x` in front of a hex number (`0xc8`) and `0b` in front of a binary one (`0b11001000`), so nobody mistakes them for decimal.

### Text is numbers too

A byte has no idea that it is a letter. Text works because everyone agrees on a table: number 72 is `H`, number 105 is `i`. Such an agreement is a **character encoding**.

**ASCII** is the oldest one still in use. It gives a number from 0 to 127 to the English letters, the digits, punctuation and a set of invisible control codes such as the newline (10, or `0x0a`).

ASCII has no `é`, no `ß`, no Arabic and no Chinese. **Unicode** fixes that: it gives every character in every writing system its own number, called a **code point**, written like `U+00E9` (that one is `é`). **UTF-8** is the way to store code points as bytes that almost the whole web uses. Its clever rule: the ASCII characters keep their single byte, unchanged, and every other character takes 2, 3 or 4 bytes.

## Try it

Make a folder for this lesson and work inside it:

```bash
mkdir ~/bits
cd ~/bits
```

### 1. Count from 0 to 16 in three bases

```python title="count.py"
for n in range(17):
    print(f"{n:>2}  {n:05b}  {n:x}")
```

```bash
python3 count.py
```

```output
 0  00000  0
 1  00001  1
 2  00010  2
 3  00011  3
 4  00100  4
 5  00101  5
 6  00110  6
 7  00111  7
 8  01000  8
 9  01001  9
10  01010  a
11  01011  b
12  01100  c
13  01101  d
14  01110  e
15  01111  f
16  10000  10
```

In an f-string, `:>2` means "two places wide, pushed to the right", `:05b` means "binary, five places wide, padded with zeros", and `:x` means "hex". Watch the right column at 16: hex runs out of digits and rolls over to `10`, exactly as decimal does at ten. Watch the binary column at 8 and 16: each power of two is a 1 followed only by zeros.

### 2. Convert in both directions

```bash
python3 -c 'print(int("1011", 2), int("ff", 16), int("c8", 16))'
python3 -c 'print(bin(200), hex(200))'
```

```output
11 255 200
0b11001000 0xc8
```

`int(text, base)` reads a number written in any base. `bin()` and `hex()` go the other way and add the `0b` and `0x` prefixes.

Bash can do the same without Python. Inside `$(( ))`, the form `base#digits` reads a number in that base, and `printf` with `%x` prints in hex:

```bash
echo $((2#1011)) $((16#ff))
printf '%x\n' 200
```

```output
11 255
c8
```

### 3. Look at the bytes of a text file

```bash
printf 'Hi!\n' > hi.txt
ls -l hi.txt
```

```output
-rw-rw-r-- 1 sam sam 4 Nov 22 10:15 hi.txt
```

Four bytes, as promised. (Your output shows your own username instead of `sam`.) Now look at them with `hexdump`:

```bash
hexdump -C hi.txt
```

```output
00000000  48 69 21 0a                                       |Hi!.|
00000004
```

A **hex dump** shows the raw bytes of a file. The first column is the **offset**: how many bytes from the start of the file this line begins, in hex. Then come the bytes, two hex digits each: `48` is `H`, `69` is `i`, `21` is `!`. The fourth byte, `0a`, is the newline character that `\n` wrote. The part between the bars shows the same bytes as text, with a dot for anything that cannot be printed. The last line, `00000004`, is the total size.

### 4. Ask for a character's number

```bash
python3 -c 'print(ord("A"), ord("a"), ord("0"), chr(72))'
```

```output
65 97 48 H
```

`ord()` gives the number of a character, and `chr()` gives the character for a number. Notice that `"0"` the character is 48, not 0. The text `"42"` and the number `42` are different things in memory, which is why Python makes you call `int()` on input.

One more detail to remember for the next lesson: `a` (97) and `A` (65) are exactly 32 apart. In binary, upper and lower case differ by one single bit.

### 5. Store a character outside ASCII

```bash
printf 'café\n' > cafe.txt
hexdump -C cafe.txt
wc -c cafe.txt
wc -m cafe.txt
```

```output
00000000  63 61 66 c3 a9 0a                                 |caf...|
00000006
6 cafe.txt
5 cafe.txt
```

Five characters (four letters and the newline), but six bytes. `c`, `a` and `f` are plain ASCII, one byte each. The `é` became two bytes, `c3 a9`, and `hexdump` shows each of them as a dot because neither is ASCII. `wc -c` counts bytes and `wc -m` counts characters.

Python shows the same split between text and bytes:

```bash
python3 -c 'print(hex(ord("é")), "é".encode("utf-8"), "€".encode("utf-8"))'
python3 -c 'print(len("café"), len("café".encode("utf-8")))'
```

```output
0xe9 b'\xc3\xa9' b'\xe2\x82\xac'
4 5
```

The code point of `é` is `0xe9` (U+00E9), and UTF-8 stores it as the two bytes `c3 a9`. The euro sign needs three bytes. A Python string counts characters; `.encode()` turns it into `bytes`, which counts bytes.

### 6. Decode with the wrong table

```bash
python3 -c 'print("café".encode("utf-8").decode("latin-1"))'
```

```output
cafÃ©
```

This is the classic encoding bug, and now you can explain it. The bytes were written as UTF-8. They were read back with Latin-1, an older encoding where every byte is one character. So `c3` became `Ã` and `a9` became `©`. Nothing was lost: decode the same bytes as UTF-8 and the word comes back.

:::tip[Always say which encoding]
When a program reads or writes text files, name the encoding: `open("notes.txt", encoding="utf-8")` in Python. Leaving it out makes the program depend on the settings of whatever machine it happens to run on.
:::

## Exercise

Work in `~/bits`.

1. By hand, write 100 in binary and in hex. Check your answers with Python.
2. These bytes are an ASCII message: `48 65 78 20 69 73 20 66 75 6e`. Decode the first three by hand using step 4 (`A` is 65, `a` is 97, so `e` is 101). Then decode the whole message with Python.
3. Predict how many bytes the line `naïve` plus a newline takes in UTF-8. Check with `printf` and `wc -c`.

<details>
<summary>Show the solution</summary>

1. 100 = 64 + 32 + 4, so the binary is `1100100`. Split it into groups of four from the right: `110 0100`, which is `6` and `4`, so hex `64`.

```bash
python3 -c 'print(bin(100), hex(100))'
```

```output
0b1100100 0x64
```

2. `48` is 4 × 16 + 8 = 72, which is `H`. `65` is 6 × 16 + 5 = 101, which is `e`. `78` is 7 × 16 + 8 = 120, which is `x`. `bytes.fromhex()` reads hex text into bytes, and `.decode()` turns them into a string:

```bash
python3 -c 'print(bytes.fromhex("48 65 78 20 69 73 20 66 75 6e").decode("ascii"))'
```

```output
Hex is fun
```

3. `n`, `a`, `v`, `e` and the newline are ASCII, one byte each. `ï` is not ASCII, so it takes two bytes. Total: 7.

```bash
printf 'naïve\n' | wc -c
```

```output
7
```

</details>

## Check yourself

**1. How many different values can one byte hold, and what are the smallest and largest?**

<details>
<summary>Answer</summary>

256 values, from 0 (`00000000`) to 255 (`11111111`, or `0xff`).

</details>

**2. What is `0x2f` in decimal?**

<details>
<summary>Answer</summary>

47. The `2` is worth 2 × 16 = 32 and the `f` is worth 15. 32 + 15 = 47.

</details>

**3. Why do programmers prefer hex to decimal when they look at bytes?**

<details>
<summary>Answer</summary>

One hex digit is exactly four bits, so every byte is exactly two hex digits and you can read the bits straight from it. Decimal does not line up with bits at all.

</details>

**4. A text file contains only English letters, digits and newlines. Is it ASCII or UTF-8?**

<details>
<summary>Answer</summary>

Both at once. UTF-8 stores the ASCII characters as the same single bytes, so any ASCII file is also a valid UTF-8 file.

</details>

**5. A name shows up as `JosÃ©` on a web page. What most likely went wrong?**

<details>
<summary>Answer</summary>

The text was saved as UTF-8 (`é` as the two bytes `c3 a9`), but it was read with a one-byte encoding such as Latin-1, so each of the two bytes was shown as its own character.

</details>

## Common mistakes

- **Mixing up characters and numbers.** The character `"7"` is the byte 55, not 7. Convert text to a number with `int()` before doing maths with it.
- **Reading hex as decimal.** `10` in hex is sixteen. When a number could be hex, look for the `0x` prefix or the letters `a` to `f`.
- **Counting characters when the limit is in bytes.** A database column or a network field may allow 20 bytes, and 20 characters of Arabic or Chinese text are much more than 20 bytes in UTF-8. Check the length of `text.encode("utf-8")`.
- **Fixing encoding bugs by guessing.** Replacing `Ã©` by `é` by hand hides the real problem. Find the place where the bytes are read and give it the right encoding.

## Key terms

- **Bit**: the smallest unit of data, a single 0 or 1.
- **Byte**: eight bits. It can hold 256 values, from 0 to 255.
- **Binary**: writing numbers with only the digits 0 and 1, where each place is worth twice the one to its right.
- **Hexadecimal**: writing numbers with sixteen digits, `0` to `9` and `a` to `f`. One hex digit is four bits.
- **Hex dump**: a view of the raw bytes of a file, written in hex, often with the offset and a text column.
- **Offset**: the position of a byte, counted from the start of a file or block of memory, starting at 0.
- **Character encoding**: an agreement on which numbers stand for which characters, and how they are stored as bytes.
- **ASCII**: an encoding of 128 characters (English letters, digits, punctuation, control codes) as the numbers 0 to 127.
- **Unicode**: the standard that gives every character of every writing system its own number.
- **Code point**: the number Unicode gives to a character, written like `U+00E9`.
- **UTF-8**: the most used way to store Unicode as bytes: one byte for ASCII characters, two to four bytes for the others.

## Go further

- [Python Unicode HOWTO](https://docs.python.org/3/howto/unicode.html): the official guide to text, bytes and encodings in Python.
- [Unicode FAQ: UTF-8, UTF-16, UTF-32 and BOM](https://www.unicode.org/faq/utf_bom.html): answers from the Unicode Consortium itself.
- [RFC 3629: UTF-8](https://www.rfc-editor.org/rfc/rfc3629): the short standard that defines exactly how UTF-8 stores each code point.
