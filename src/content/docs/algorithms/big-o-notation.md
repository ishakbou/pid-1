---
title: Big-O notation
description: Measure how the work of a function grows when its input grows, time your own code, and describe the growth with Big-O notation.
lesson: "4.1"
time: 20 min
sidebar:
  order: 1
---

Your script reads a test log of 1,000 lines in a tenth of a second. The real log on the server has 100,000 lines. Will the script take ten seconds, or three hours? You cannot answer by looking at the stopwatch once. You answer it by asking how the work grows when the input grows, and that question has a name: Big-O.

## Goal

After this lesson you can:

- Time a piece of Python code with `time.perf_counter`.
- Say how the work of a function grows when its input doubles.
- Read the Big-O of simple code from its loops: O(1), O(log n), O(n) and O(n²).

## Why it matters

Code that is fast on your small test file can be unusable on real data. A log analyzer, a password checker or a scanner usually meets inputs thousands of times bigger than the ones you tried. Big-O lets you see the problem before it happens, from the shape of the code. It is also the common language of the field: documentation, code reviews and job interviews all use it.

## The idea

An **algorithm** is a precise list of steps that solves a problem, such as "add up these numbers" or "find a name in this list". Most algorithms work on some input, and we call its size **n**: the number of lines in a log, the number of items in a list.

Seconds are a poor way to compare algorithms, because they depend on the computer. So instead you count steps, and you ask one question: when n doubles, what happens to the number of steps? **Big-O notation** writes down the answer. It keeps only the part of the count that grows fastest, and drops everything else.

Think of a thick book with n pages:

- Opening the book at the first page takes one move, whatever the size of the book. That is **constant time**, written O(1).
- Finding a word in a dictionary by opening it in the middle, then in the middle of the correct half, and so on, takes only a few moves even for a huge book. Each move halves what is left. That is **logarithmic time**, O(log n).
- Reading every page once takes n moves. Twice the pages, twice the work. That is **linear time**, O(n).
- Comparing every page with every other page takes about n × n moves. Twice the pages, four times the work. That is **quadratic time**, O(n²).

| Big-O | Name | n = 1,000 | n = 2,000 | When n doubles |
|---|---|---|---|---|
| O(1) | constant | 1 | 1 | same |
| O(log n) | logarithmic | about 10 | about 11 | one step more |
| O(n) | linear | 1,000 | 2,000 | twice the work |
| O(n²) | quadratic | 1,000,000 | 4,000,000 | four times the work |

The last column is the useful one. You can test it on any piece of code: run it with n, run it with 2n, and compare.

## Try it

### 1. Count the steps

```bash
mkdir -p ~/algo
cd ~/algo
```

This program counts the steps of four tiny functions instead of timing them. Short examples like this one have no file name on top: save them in a file such as `try.py` inside `~/algo` and run `python3 try.py`, as in Module 3. The longer ones have their own file name.

```python
def steps_constant(n):
    return 1

def steps_log(n):
    steps = 0
    while n > 1:
        n = n // 2
        steps += 1
    return steps

def steps_linear(n):
    steps = 0
    for i in range(n):
        steps += 1
    return steps

def steps_quadratic(n):
    steps = 0
    for i in range(n):
        for j in range(n):
            steps += 1
    return steps

print(f"{'n':>5} {'O(1)':>5} {'O(log n)':>9} {'O(n)':>6} {'O(n^2)':>8}")
for n in [10, 100, 1000]:
    print(f"{n:>5} {steps_constant(n):>5} {steps_log(n):>9} "
          f"{steps_linear(n):>6} {steps_quadratic(n):>8}")
```

```output
    n  O(1)  O(log n)   O(n)   O(n^2)
   10     1         3     10      100
  100     1         6    100    10000
 1000     1         9   1000  1000000
```

Each row has ten times the input of the row above. The constant column does not move. The logarithmic column grows by about three steps, because you can halve 1,000 only nine times before you reach 1. The linear column grows ten times. The quadratic column grows a hundred times, and you may even notice a small pause before the last row appears: that pause is the million steps.

### 2. Time real functions

Counting is exact, but you also want to see real seconds. Create `timing.py`:

```python title="timing.py"
import time

def total(numbers):
    result = 0
    for x in numbers:
        result += x
    return result

def has_duplicates(numbers):
    for i in range(len(numbers)):
        for j in range(i + 1, len(numbers)):
            if numbers[i] == numbers[j]:
                return True
    return False

def measure(func, n):
    numbers = list(range(n))
    start = time.perf_counter()
    func(numbers)
    return time.perf_counter() - start

for n in [100_000, 200_000, 400_000]:
    print(f"total           n={n:>7,}: {measure(total, n):.4f} s")
for n in [500, 1_000, 2_000]:
    print(f"has_duplicates  n={n:>7,}: {measure(has_duplicates, n):.4f} s")
```

<!-- lab: nocheck -->
```bash
python3 timing.py
```

```output
total           n=100,000: 0.0565 s
total           n=200,000: 0.1204 s
total           n=400,000: 0.2456 s
has_duplicates  n=    500: 0.1237 s
has_duplicates  n=  1,000: 0.5717 s
has_duplicates  n=  2,000: 2.7111 s
```

`time.perf_counter()` reads a very precise clock. One reading alone means nothing; the difference between two readings is the time the code in between took.

Your numbers will be different. The test machine of this course is slow, and your computer is probably faster. What should match is the pattern. For `total`, each doubling of n roughly doubles the time: linear. For `has_duplicates`, each doubling multiplies the time by about four: quadratic. The list `range(n)` has no duplicates, so the function must compare every pair before it can answer `False`. With 2,000 numbers that is almost two million comparisons, and a list of 2,000 is still tiny.

:::note[Timings are noisy]
Other programs on your computer steal a little time now and then, so the same code gives slightly different numbers on each run. Run a measurement two or three times, and trust the pattern, not the last digit.
:::

### 3. Find the hidden loop

Some loops do not look like loops. `x in my_list` checks the items one by one from the start until it finds `x`:

<!-- lab: nocheck -->
```python
import time

numbers = list(range(1_000_000))
for target in [0, 500_000, 999_999, -1]:
    start = time.perf_counter()
    found = target in numbers
    elapsed = time.perf_counter() - start
    print(f"{target:>8} in numbers: {found!s:5} {elapsed:.5f} s")
```

```output
       0 in numbers: True  0.00004 s
  500000 in numbers: True  0.09525 s
  999999 in numbers: True  0.19386 s
      -1 in numbers: False 0.20103 s
```

`0` is the first item, so the search stops at once. `999999` is the last one, and `-1` is not there at all, so Python looks at all million items. Same line of code, very different cost. This is why Big-O usually describes the **worst case**: the input that makes the algorithm do the most work. "Searching a list is O(n)" means that, in the worst case, you check every item.

### 4. See why constants are dropped

Big-O ignores constant factors: 3n steps and n steps are both O(n). That can look like cheating, so check it with numbers. Here an algorithm that does 100 steps per item meets one that does n steps per item:

```python
print(f"{'n':>6} {'100 * n':>9} {'n * n':>11}")
for n in [10, 100, 1_000, 10_000]:
    print(f"{n:>6} {100 * n:>9,} {n * n:>11,}")
```

```output
     n   100 * n       n * n
    10     1,000         100
   100    10,000      10,000
  1000   100,000   1,000,000
 10000 1,000,000 100,000,000
```

For small n, the quadratic algorithm does less work. At n = 100 they are equal, and after that the quadratic one loses, by more and more. A constant factor changes where the lines cross, but not who wins in the end. Since real inputs tend to grow, the growth rate is the part worth remembering.

You can now read the Big-O of most simple code from its shape:

| Code shape | Big-O |
|---|---|
| a fixed number of steps, no loop over the input | O(1) |
| a loop that halves what is left each time | O(log n) |
| one loop over the input, or `x in my_list` | O(n) |
| two loops one after the other | O(n) + O(n), still O(n) |
| a loop inside a loop over the same input | O(n²) |

## Exercise

Create `exercise.py` with these three functions. For each one, write down its Big-O before you run anything. Then add timings with n and 2n to check your guesses.

```python
def last_item(numbers):
    return numbers[-1]

def count_even(numbers):
    count = 0
    for x in numbers:
        if x % 2 == 0:
            count += 1
    return count

def count_common(a, b):
    count = 0
    for x in a:
        if x in b:
            count += 1
    return count
```

For `count_common`, pass two lists of the same length n.

<details>
<summary>Show the solution</summary>

`last_item` is O(1): a list finds an item by its position in one step, whatever its length (the next lesson shows why). `count_even` is O(n): one loop over the input. `count_common` is O(n²): the loop over `a` runs n times, and each `x in b` is a hidden loop over up to n items of `b`.

One way to check it:

```python title="exercise.py"
import time

def last_item(numbers):
    return numbers[-1]

def count_even(numbers):
    count = 0
    for x in numbers:
        if x % 2 == 0:
            count += 1
    return count

def count_common(a, b):
    count = 0
    for x in a:
        if x in b:
            count += 1
    return count

def measure(func, *args):
    start = time.perf_counter()
    func(*args)
    return time.perf_counter() - start

for n in [200_000, 400_000]:
    numbers = list(range(n))
    print(f"n={n:>7,}: last_item {measure(last_item, numbers):.6f} s, "
          f"count_even {measure(count_even, numbers):.4f} s")
for n in [1_000, 2_000]:
    a = list(range(n))
    b = list(range(n, 2 * n))
    print(f"n={n:>7,}: count_common {measure(count_common, a, b):.4f} s")
```

<!-- lab: nocheck -->
```bash
python3 exercise.py
```

```output
n=200,000: last_item 0.000103 s, count_even 0.1433 s
n=400,000: last_item 0.000046 s, count_even 0.2983 s
n=  1,000: count_common 0.1390 s
n=  2,000: count_common 0.6307 s
```

`last_item` stays tiny: a tenth of a millisecond or less is just the noise of the clock, and here the bigger list was even the faster one. `count_even` roughly doubles, and `count_common` takes about four times longer. The O(n) and O(1) functions needed much bigger lists than `count_common` to take a measurable time at all, which already says a lot. The lists `a` and `b` share no number, so every `x in b` scans all of `b`: the worst case. `*args` in `measure` simply passes on however many arguments it receives, so the same helper times functions with one or two parameters.

</details>

## Check yourself

**1. A function takes 2 seconds for 10,000 items. It is O(n). About how long for 20,000 items? And if it were O(n²)?**

<details>
<summary>Answer</summary>

About 4 seconds if it is O(n), because doubling n doubles the work. About 8 seconds if it is O(n²), because doubling n multiplies the work by four.

</details>

**2. Why does Big-O count steps instead of seconds?**

<details>
<summary>Answer</summary>

Seconds depend on the computer, on other programs running and on luck. The way the number of steps grows with n depends only on the algorithm, so it is the same on every machine.

</details>

**3. What is the Big-O of a loop over a list that contains `if x in other_list:`, where both lists have n items?**

<details>
<summary>Answer</summary>

O(n²). The outer loop runs n times, and `in` on a list is a hidden loop of up to n steps each time.

</details>

**4. An algorithm does 5n + 300 steps. What is its Big-O, and why?**

<details>
<summary>Answer</summary>

O(n). Big-O keeps only the part that grows fastest and drops constant factors and constant additions. When n doubles, 5n + 300 roughly doubles too, as soon as n is large.

</details>

**5. What does "worst case" mean for searching a list?**

<details>
<summary>Answer</summary>

The input that makes the search do the most work: the item is last, or not in the list at all. Then every item is checked, so the worst case is O(n).

</details>

## Common mistakes

- **Timing one run on a tiny input.** A function that takes 0.0001 s tells you nothing. Time it with n and 2n, on inputs large enough to take a noticeable fraction of a second.
- **Putting `print` or setup inside the timed part.** Build the input before `start` and stop the clock before printing, or you measure the wrong thing.
- **Missing the hidden loops.** `x in my_list`, `my_list.count(x)` and `my_list.index(x)` each walk through the list. Inside another loop, they make the code O(n²).
- **Thinking O(n²) is always slower.** For small inputs, a quadratic algorithm can be faster than a linear one with a big constant, as step 4 showed. Big-O tells you what happens as n grows.
- **Comparing timings from two computers.** Compare runs on the same machine, at the same time, and look at ratios, not raw seconds.

## Key terms

- **Algorithm**: a precise list of steps that solves a problem.
- **n**: the size of the input, such as the number of items in a list or lines in a log.
- **Big-O notation**: a way to describe how the work of an algorithm grows with n, keeping only the fastest-growing part, such as O(n) or O(n²).
- **Constant time** (O(1)): the work does not depend on n.
- **Logarithmic time** (O(log n)): the work grows by one step each time n doubles, typical when each step halves what is left.
- **Linear time** (O(n)): the work grows in proportion to n. Twice the input, twice the work.
- **Quadratic time** (O(n²)): the work grows with n × n. Twice the input, four times the work.
- **Worst case**: the input of a given size that makes an algorithm do the most work.

## Go further

- [Python documentation: time.perf_counter](https://docs.python.org/3/library/time.html#time.perf_counter): the clock used in this lesson, and how it differs from the other clocks in the `time` module.
- [Python documentation: timeit](https://docs.python.org/3/library/timeit.html): a standard module that runs a small piece of code many times and reports a more stable timing.
- [Python Wiki: TimeComplexity](https://wiki.python.org/moin/TimeComplexity): the Big-O of the operations on Python's lists, dicts and sets, for later lessons of this module.
