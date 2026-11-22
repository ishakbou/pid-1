---
title: Arrays and lists
description: See how a Python list sits in memory as a dynamic array, and learn which list operations are cheap and which ones get slower as the list grows.
lesson: "4.2"
time: 20 min
sidebar:
  order: 2
---

Here is a strange fact. In a list of a million items, reading the last item is exactly as fast as reading the first one. But adding one item at the front of that same list makes Python move a million items. Both facts come from the way a list sits in memory, and once you see that picture, you can predict the cost of every list operation.

## Goal

After this lesson you can:

- Explain how an array stores its items in memory, and why reading by index is O(1).
- Say which list operations are cheap (index, append, pop at the end) and which are O(n) (insert or remove at the front, search).
- Avoid the most common slow pattern: inserting or deleting at the front of a big list.

## Why it matters

The list is the container you use most in Python, so its costs are everywhere in your code. A loop that calls `insert(0, ...)` or `remove(...)` on a big list can turn a one-second script into a ten-minute one, and nothing in the code looks wrong. Knowing what happens underneath also prepares you for the next lessons: stacks, queues and linked lists are all answers to "what if a list is the wrong shape for this job?"

## The idea

The memory of a computer is one long row of numbered bytes. The number of a byte is its **address**. A program asks for a block of memory, gets the address where the block starts, and keeps its data there.

An **array** is the simplest way to store many items: one block of memory, with the items side by side in slots of the same size. Because every slot has the same size, the computer can find any slot with one calculation:

```text
address of item i = start address + i × slot size
```

If the block starts at address 1000 and each slot is 8 bytes, item 3 is at 1000 + 3 × 8 = 1024. There is no searching: the cost is the same for item 3 and item 999,999. That is why reading `items[i]` is O(1). It is like a street where every house has the same width: you know where house 250 is without walking past the first 249.

A Python list is a **dynamic array**: an array that can grow. Each slot holds a **reference** to an item, which is the address where the actual object lives, so one list can hold numbers and strings side by side. Python reserves a few spare slots at the end. Its **capacity**, the number of slots reserved, is usually bigger than its length. When the spare slots run out, Python reserves a bigger block, copies all the references into it and frees the old one.

Adding at the end is cheap, because the next spare slot is free. Adding at the front is not: every item has to move one slot to the right first.

<figure class="diagram">
<svg viewBox="0 0 560 220" role="img" aria-labelledby="ins-title ins-desc">
<title id="ins-title">Inserting at the front of an array</title>
<desc id="ins-desc">Top row, before: six slots with index 0 to 5. Slots 0 to 3 hold 80, 443, 22 and 8080, slots 4 and 5 are free. Bottom row, after inserting 21 at index 0: every item has moved one slot to the right, so the slots hold 21, 80, 443, 22, 8080, and one free slot. Arrows show each of the four items moving one slot to the right.</desc>
<rect class="d-box" x="40" y="30" width="80" height="40"/>
<rect class="d-box" x="120" y="30" width="80" height="40"/>
<rect class="d-box" x="200" y="30" width="80" height="40"/>
<rect class="d-box" x="280" y="30" width="80" height="40"/>
<rect class="d-box" x="360" y="30" width="80" height="40"/>
<rect class="d-box" x="440" y="30" width="80" height="40"/>
<text x="80" y="55">80</text>
<text x="160" y="55">443</text>
<text x="240" y="55">22</text>
<text x="320" y="55">8080</text>
<text x="400" y="55">free</text>
<text x="480" y="55">free</text>
<text x="80" y="20">0</text>
<text x="160" y="20">1</text>
<text x="240" y="20">2</text>
<text x="320" y="20">3</text>
<text x="400" y="20">4</text>
<text x="480" y="20">5</text>
<path class="d-line d-hot" d="M80 70 L160 140 M160 70 L240 140 M240 70 L320 140 M320 70 L400 140"/>
<rect class="d-box d-hot" x="40" y="140" width="80" height="40"/>
<rect class="d-box" x="120" y="140" width="80" height="40"/>
<rect class="d-box" x="200" y="140" width="80" height="40"/>
<rect class="d-box" x="280" y="140" width="80" height="40"/>
<rect class="d-box" x="360" y="140" width="80" height="40"/>
<rect class="d-box" x="440" y="140" width="80" height="40"/>
<text x="80" y="165">21</text>
<text x="160" y="165">80</text>
<text x="240" y="165">443</text>
<text x="320" y="165">22</text>
<text x="400" y="165">8080</text>
<text x="480" y="165">free</text>
<text x="280" y="208">after insert(0, 21)</text>
</svg>
<figcaption>To make room at index 0, every item moves one slot to the right. With four items that is four moves; with a million items, a million.</figcaption>
</figure>

Here is the cost of the common list operations, for a list of n items:

| Operation | Example | Cost |
|---|---|---|
| read or replace by index | `items[i]`, `items[i] = x` | O(1) |
| length | `len(items)` | O(1) |
| add or remove at the end | `items.append(x)`, `items.pop()` | O(1) on average |
| add or remove at the front or middle | `items.insert(0, x)`, `items.pop(0)` | O(n) |
| search | `x in items`, `items.index(x)`, `items.remove(x)` | O(n) |

"On average" for `append` is there because of the copying: once in a while, an append has to copy the whole list into a bigger block. Python grows the block by a fraction of its size each time, so these copies become rarer as the list grows, and spread over all the appends, the cost per append stays constant. This is called **amortized** O(1).

## Try it

### 1. Read the first and the last item

```bash
mkdir -p ~/algo
cd ~/algo
```

The standard module `timeit` runs a short piece of code many times and returns the total time in seconds. That gives a more stable number than one measurement with `perf_counter`.

<!-- lab: nocheck -->
```python
import timeit

numbers = list(range(1_000_000))
first = timeit.timeit("numbers[0]", globals=globals(), number=1_000_000)
last = timeit.timeit("numbers[999_999]", globals=globals(), number=1_000_000)
print(f"numbers[0]       a million times: {first:.3f} s")
print(f"numbers[999_999] a million times: {last:.3f} s")
```

```output
numbers[0]       a million times: 0.622 s
numbers[999_999] a million times: 0.770 s
```

`globals=globals()` lets `timeit` see the variable `numbers`. The two times are close, and on another run the second one may even be the smaller. The position does not matter, because Python computes the address of the slot instead of walking to it.

### 2. Watch a list grow

`sys.getsizeof` returns the number of bytes an object takes in memory. For a list, that is the list itself with its slots, not the items the slots point to:

```python
import sys

items = []
last = sys.getsizeof(items)
print(f"length  0: {last} bytes")
for i in range(70):
    items.append(i)
    size = sys.getsizeof(items)
    if size != last:
        print(f"length {len(items):2}: {size} bytes")
        last = size
```

```output
length  0: 56 bytes
length  1: 88 bytes
length  5: 120 bytes
length  9: 184 bytes
length 17: 248 bytes
length 25: 312 bytes
length 33: 376 bytes
length 41: 472 bytes
length 53: 568 bytes
length 65: 664 bytes
```

The program prints a line only when the size changes. An empty list takes 56 bytes for its bookkeeping. The first append reserves 32 more bytes: four slots of 8 bytes each, so the capacity is 4. Appends 2, 3 and 4 cost no memory at all. The fifth append finds the block full, so Python moves to a block with 8 slots, then 16, 24, 32 and so on. The exact numbers belong to Python 3.12 on a 64-bit computer, and other versions grow a little differently; the pattern of rare jumps is the same.

### 3. Compare append with insert at the front

Create `grow.py`:

```python title="grow.py"
import time

def build_with_append(n):
    items = []
    for i in range(n):
        items.append(i)
    return items

def build_with_insert(n):
    items = []
    for i in range(n):
        items.insert(0, i)
    return items

for n in [10_000, 20_000]:
    start = time.perf_counter()
    build_with_append(n)
    middle = time.perf_counter()
    build_with_insert(n)
    end = time.perf_counter()
    print(f"n={n:,}: append {middle - start:.4f} s, insert(0) {end - middle:.4f} s")
```

<!-- lab: nocheck -->
```bash
python3 grow.py
```

```output
n=10,000: append 0.0112 s, insert(0) 0.4498 s
n=20,000: append 0.0239 s, insert(0) 1.8051 s
```

Both functions build a list of n numbers. With `append`, the time stays small and grows at most in proportion to n, as for any O(n) loop. With `insert(0, ...)`, doubling n makes it about four times slower. Each insert is O(n), because it shifts every item already in the list, and doing an O(n) step n times gives O(n²). The same is true for `pop(0)`, which removes the first item and shifts all the others to the left.

### 4. Remember that slots hold references

```python
a = [80, 443]
b = a
b.append(22)
print(a)
print(b is a)

c = a.copy()
c.append(8080)
print(a)
print(c)
```

```output
[80, 443, 22]
True
[80, 443, 22]
[80, 443, 22, 8080]
```

`b = a` does not copy the list. It makes `b` a second name for the same list in memory, so the append through `b` shows up in `a`. The operator `is` checks whether two names point to the very same object. `a.copy()` creates a new list with its own block of slots. Copying is O(n), because every reference is copied, so do it when you need an independent list, not out of habit.

## Exercise

A log has 10,000 lines, and you want to drop every line that contains `" 200 "` (the requests that went fine). A colleague wrote this:

```python
def drop_ok_slow(lines):
    for line in lines.copy():
        if " 200 " in line:
            lines.remove(line)
    return lines
```

Explain why it is O(n²). Then write `drop_ok_fast(lines)` that is O(n), and time both on a list made like this, where every other line is a `200`:

```python
lines = []
for i in range(10_000):
    status = 200 if i % 2 == 0 else 404
    lines.append(f"203.0.113.{i % 250} GET /page{i} {status} 512")
```

<details>
<summary>Show the solution</summary>

`lines.remove(line)` searches the list from the start for the line, which is O(n), and then shifts every item after it one slot to the left, also O(n). It runs once per matching line, so the function is O(n²). The fast version builds a new list and only ever appends to it:

```python title="drop.py"
import time

def drop_ok_slow(lines):
    for line in lines.copy():
        if " 200 " in line:
            lines.remove(line)
    return lines

def drop_ok_fast(lines):
    kept = []
    for line in lines:
        if " 200 " not in line:
            kept.append(line)
    return kept

def make_lines():
    lines = []
    for i in range(10_000):
        status = 200 if i % 2 == 0 else 404
        lines.append(f"203.0.113.{i % 250} GET /page{i} {status} 512")
    return lines

start = time.perf_counter()
slow = drop_ok_slow(make_lines())
middle = time.perf_counter()
fast = drop_ok_fast(make_lines())
end = time.perf_counter()
print(len(slow), len(fast), slow == fast)
print(f"slow {middle - start:.3f} s, fast {end - middle:.3f} s")
```

<!-- lab: nocheck -->
```bash
python3 drop.py
```

```output
5000 5000 True
slow 5.662 s, fast 0.098 s
```

Both keep the same 5,000 lines, and the fast one wins by far. These times come from the slow test machine of this course; on your computer both are faster, but the gap stays huge. `200 if i % 2 == 0 else 404` is a short form of `if` that picks one of two values. `drop_ok_fast` returns a new list instead of changing the one it received, which is usually the clearer choice anyway.

</details>

## Check yourself

**1. Why is `items[500_000]` as fast as `items[0]`?**

<details>
<summary>Answer</summary>

The slots of an array all have the same size, so Python computes the address of slot i as start + i × slot size. It goes straight there without visiting the other slots.

</details>

**2. What is the difference between the length and the capacity of a list?**

<details>
<summary>Answer</summary>

The length is the number of items in the list. The capacity is the number of slots Python has reserved, which is usually a little bigger, so that the next appends do not need a new block.

</details>

**3. Why is `append` called amortized O(1) and not simply O(1)?**

<details>
<summary>Answer</summary>

Most appends are O(1), but once in a while the block is full and Python copies all the references into a bigger block, which is O(n). Because the block grows by a fraction of its size each time, these copies are rare, and spread over all appends the average cost stays constant.

</details>

**4. Which is faster on a list of a million items, `pop()` or `pop(0)`, and why?**

<details>
<summary>Answer</summary>

`pop()`. It removes the last item and nothing else has to move. `pop(0)` removes the first item and must shift the remaining 999,999 one slot to the left.

</details>

**5. After `b = a` and `b.append(1)`, why has `a` changed too?**

<details>
<summary>Answer</summary>

`b = a` does not copy anything. Both names refer to the same list object. Use `a.copy()` when you need a separate list.

</details>

## Common mistakes

- **Building a list with `insert(0, x)`.** Append to the end instead, and call `items.reverse()` once at the end if you need the opposite order. Reversing is one O(n) pass, not n of them.
- **Using `pop(0)` to work through a list.** Each call shifts the whole list. Loop over the list with `for`, or use the queue from the next lesson.
- **Calling `remove` in a loop.** Each call searches and shifts. Build a new list with the items you want to keep.
- **Thinking `b = a` makes a copy.** It gives the same list a second name. Use `a.copy()` or `list(a)` when you need two lists.
- **Changing a list while looping over it.** Removing items from the list you are looping over makes the loop skip items. Loop over a copy, or better, build a new list.

## Key terms

- **Array**: items stored side by side in one block of memory, in slots of the same size, so any slot can be found in one step from its index.
- **Dynamic array**: an array that grows by moving to a bigger block when it is full. A Python list is one.
- **Reference**: the address of an object in memory. The slots of a Python list hold references, not the objects themselves.
- **Capacity**: the number of slots a dynamic array has reserved, used or not.
- **Amortized cost**: the average cost of an operation over many calls, when a few calls are expensive and most are cheap.

## Go further

- [Python documentation: More on lists](https://docs.python.org/3/tutorial/datastructures.html#more-on-lists): every list method, with short examples.
- [Python documentation: Design and History FAQ, how are lists implemented](https://docs.python.org/3/faq/design.html#how-are-lists-implemented-in-cpython): the official two-paragraph answer to the question of this lesson.
- [Python documentation: sys.getsizeof](https://docs.python.org/3/library/sys.html#sys.getsizeof): what the function counts and what it leaves out.
