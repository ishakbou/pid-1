---
title: Searching and sorting
description: Search a list with linear and binary search, write bubble sort, merge sort and quick sort yourself, then compare them with Python's own sort.
lesson: "4.9"
time: 25 min
sidebar:
  order: 9
---

I am thinking of a whole number between 1 and 1,000. You may guess, and after each guess I say "higher" or "lower". If you guess 1, then 2, then 3, you may need a thousand guesses. If you always guess the middle of what is left, you never need more than ten. That second strategy is binary search, and it only works because the numbers are in order. This lesson is about both halves of that deal: searching fast, and sorting so that you can.

## Goal

After this lesson you can:

- Write linear search and binary search, and say when binary search is allowed.
- Explain how bubble sort, merge sort and quick sort work, and what each one costs.
- Sort real data with Python's `sorted` and `list.sort`, using `key` and `reverse`.

## Why it matters

Searching and sorting are among the most common jobs a program does: finding a user, ranking IP addresses by request count, putting log lines in time order. Writing the classic sorts yourself shows the difference between O(n²) and O(n log n) in a way you will not forget. In real code you will almost always call Python's own sort, but knowing what it does tells you how to use it well, and why "sort first, then search" is so often the right plan.

## The idea

**Linear search** checks the items one by one, from the start, until it finds the target. It works on any list, sorted or not, and costs O(n).

**Binary search** works only on a sorted list. It looks at the middle item. If that is the target, it is done. If the target is bigger, it can only be in the right half, so the left half is thrown away; if smaller, the other way round. Each step halves what is left, so it costs O(log n): about 20 steps for a million items, 30 for a billion. It is the guessing game, and the BST of lesson 4.7 without the tree.

To sort a list, there are dozens of algorithms. Three of them show the main ideas:

- **Bubble sort** walks through the list and swaps every pair of neighbours that is in the wrong order. After one pass, the biggest item has "bubbled" to the end. It repeats until a pass makes no swap. Simple, and O(n²).
- **Merge sort** splits the list in two halves, sorts each half with merge sort (recursion, lesson 4.6), and then merges the two sorted halves into one, like merging two sorted piles of exam papers by always taking the smaller top sheet. The list can be halved about log n times, and each level of halving does O(n) work, so the total is O(n log n).
- **Quick sort** picks one item, the **pivot**, and splits the list into the items smaller than the pivot, equal to it, and bigger. Then it sorts the smaller and bigger parts the same way. With good pivots it is O(n log n). With very bad ones, for example always the smallest item, each split removes only one item and it falls to O(n²).

A sort is **stable** if items that compare as equal keep the order they had before. That matters when you sort by one field and want an earlier order to survive for ties.

| Algorithm | Typical cost | Worst case | Stable |
|---|---|---|---|
| bubble sort | O(n²) | O(n²) | yes |
| merge sort | O(n log n) | O(n log n) | yes |
| quick sort | O(n log n) | O(n²) | not usually |
| Python's `sorted` (Timsort) | O(n log n) | O(n log n) | yes |

## Try it

```bash
mkdir -p ~/algo
cd ~/algo
```

### 1. Search a million numbers two ways

Create `search.py`. Both functions return the position of the target (or `-1` if it is missing) and the number of items they looked at:

```python title="search.py"
def linear_search(items, target):
    steps = 0
    for i in range(len(items)):
        steps += 1
        if items[i] == target:
            return i, steps
    return -1, steps


def binary_search(items, target):
    low = 0
    high = len(items) - 1
    steps = 0
    while low <= high:
        steps += 1
        middle = (low + high) // 2
        if items[middle] == target:
            return middle, steps
        if items[middle] < target:
            low = middle + 1
        else:
            high = middle - 1
    return -1, steps


if __name__ == "__main__":
    numbers = list(range(0, 2_000_000, 2))
    for target in [0, 1_000_000, 1_999_998, 7]:
        print(f"{target:>9}: linear {linear_search(numbers, target)}, "
              f"binary {binary_search(numbers, target)}")
```

```bash
python3 search.py
```

```output
        0: linear (0, 1), binary (0, 19)
  1000000: linear (500000, 500001), binary (500000, 19)
  1999998: linear (999999, 1000000), binary (999999, 20)
        7: linear (-1, 1000000), binary (-1, 20)
```

`numbers` holds the million even numbers from 0 to 1,999,998, in order. Linear search is lucky with `0`, the first item, and then needs up to a million looks. Binary search never needs more than 20. `low` and `high` mark the part of the list where the target can still be, and each step moves one of them past the middle, halving that part. For `7`, an odd number, the part shrinks to nothing and the function knows the target is missing. The `if __name__ == "__main__":` line from Module 3 keeps this demo from running when another file imports the functions.

### 2. Let bisect do the binary search

The standard module `bisect` has a binary search written in C:

```python
import bisect

blocked = ["198.51.100.23", "203.0.113.5", "203.0.113.80"]
for ip in ["203.0.113.80", "203.0.113.7"]:
    i = bisect.bisect_left(blocked, ip)
    found = i < len(blocked) and blocked[i] == ip
    print(f"{ip:13} position {i}, blocked: {found}")
```

```output
203.0.113.80  position 2, blocked: True
203.0.113.7   position 2, blocked: False
```

`bisect_left` returns the position where the item is, or where it would have to be inserted to keep the list sorted. So you still check whether the item at that position is the one you want. Note that these strings are sorted as text, character by character, not as numbers: `"203.0.113.7"` comes after `"203.0.113.5"` and before `"203.0.113.80"` because `7` comes before `8`. For a pure "is it there?" question, a set from lesson 4.4 is simpler. A sorted list with `bisect` is useful when you also need order, such as "every item between A and B".

### 3. Write three sorts

Create `sorts.py`:

```python title="sorts.py"
def bubble_sort(items):
    items = items.copy()
    for end in range(len(items) - 1, 0, -1):
        swapped = False
        for i in range(end):
            if items[i] > items[i + 1]:
                items[i], items[i + 1] = items[i + 1], items[i]
                swapped = True
        if not swapped:
            break
    return items


def merge(left, right):
    result = []
    i = 0
    j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result


def merge_sort(items):
    if len(items) <= 1:
        return items
    middle = len(items) // 2
    return merge(merge_sort(items[:middle]), merge_sort(items[middle:]))


def quick_sort(items):
    if len(items) <= 1:
        return items
    pivot = items[len(items) // 2]
    smaller, equal, bigger = [], [], []
    for x in items:
        if x < pivot:
            smaller.append(x)
        elif x == pivot:
            equal.append(x)
        else:
            bigger.append(x)
    return quick_sort(smaller) + equal + quick_sort(bigger)


if __name__ == "__main__":
    data = [38, 27, 43, 3, 9, 82, 10, 3]
    print("bubble:", bubble_sort(data))
    print("merge: ", merge_sort(data))
    print("quick: ", quick_sort(data))
    print("merge of two sorted lists:", merge([3, 27, 38, 43], [3, 9, 10, 82]))
    print("data unchanged:", data)
```

```bash
python3 sorts.py
```

```output
bubble: [3, 3, 9, 10, 27, 38, 43, 82]
merge:  [3, 3, 9, 10, 27, 38, 43, 82]
quick:  [3, 3, 9, 10, 27, 38, 43, 82]
merge of two sorted lists: [3, 3, 9, 10, 27, 38, 43, 82]
data unchanged: [38, 27, 43, 3, 9, 82, 10, 3]
```

All three agree. A few details worth reading slowly:

- In `bubble_sort`, `items[i], items[i + 1] = items[i + 1], items[i]` swaps two items in one line. After each pass, the biggest remaining item is at position `end`, so the next pass can stop one place earlier. If a pass swaps nothing, the list is sorted and the loop stops early.
- `merge` is the heart of merge sort. It keeps one finger in each sorted list, always takes the smaller of the two items under the fingers, and at the end adds whatever is left. `items[:middle]` and `items[middle:]` are the two halves, as slices from Module 3.
- `quick_sort` builds three new lists around the pivot and glues the sorted results together with `+`. This version is easy to read but makes many new lists; real quick sorts move items around inside one list.

### 4. Race them

Create `race.py`. It sorts shuffled numbers with each algorithm, for n and 2n. Bubble sort gets small lists, because it would take far too long on the big ones:

```python title="race.py"
import random
import time
from sorts import bubble_sort, merge_sort, quick_sort

def race(funcs, sizes):
    for n in sizes:
        data = list(range(n))
        random.shuffle(data)
        for func in funcs:
            start = time.perf_counter()
            result = func(data)
            seconds = time.perf_counter() - start
            print(f"n={n:>7,} {func.__name__:12} {seconds:.3f} s  ok={result == list(range(n))}")

random.seed(1)
race([bubble_sort], [1_000, 2_000])
race([merge_sort, quick_sort, sorted], [50_000, 100_000])
```

<!-- lab: nocheck -->
```bash
python3 race.py
```

```output
n=  1,000 bubble_sort  0.916 s  ok=True
n=  2,000 bubble_sort  4.555 s  ok=True
n= 50,000 merge_sort   2.772 s  ok=True
n= 50,000 quick_sort   1.179 s  ok=True
n= 50,000 sorted       0.128 s  ok=True
n=100,000 merge_sort   6.887 s  ok=True
n=100,000 quick_sort   3.148 s  ok=True
n=100,000 sorted       0.216 s  ok=True
```

Bubble sort takes about four times longer, or more, when n doubles: O(n²). Sorting 2,000 numbers with it takes longer than sorting 50,000 with merge sort. Merge sort and quick sort take roughly two to three times as long when n doubles: O(n log n) predicts a little more than twice, and the rest is timing noise on the busy test machine of this course. Python's built-in `sorted` is in a class of its own: it uses the same O(n log n) idea, but it is written in C and takes advantage of runs that are already in order. `ok=True` checks that each result really is sorted. Your times will differ; compare the ratios.

### 5. Use Python's sort on real data

Python has two ways to sort: `sorted(x)` returns a new sorted list and leaves `x` alone, and `x.sort()` sorts the list `x` itself and returns `None`. Both take the same options:

```python
visits = [("203.0.113.5", 4), ("198.51.100.23", 6), ("127.0.0.1", 2), ("203.0.113.80", 4)]

def by_count(pair):
    return pair[1]

print(sorted(visits, key=by_count, reverse=True))
print(visits[0])

names = ["web", "DB", "backup", "Router"]
names.sort()
print(names)
names.sort(key=str.lower)
print(names)
```

```output
[('198.51.100.23', 6), ('203.0.113.5', 4), ('203.0.113.80', 4), ('127.0.0.1', 2)]
('203.0.113.5', 4)
['DB', 'Router', 'backup', 'web']
['backup', 'DB', 'Router', 'web']
```

`key=by_count` tells `sorted` to compare the pairs by what `by_count` returns, the count, and `reverse=True` puts the biggest first, as with `key=counts.get` in Module 3. Look at the two addresses with 4 visits: they kept their original order, `203.0.113.5` before `203.0.113.80`, because Python's sort is stable. `visits` itself is unchanged. The plain `names.sort()` puts `DB` and `Router` first, because capital letters come before small letters in the character codes that strings are compared by. `key=str.lower` compares the lowercase forms instead, and gives the order a human expects.

## Exercise

Sort these request counts so that the biggest count comes first and, when two counts are equal, the IP addresses are in alphabetical order. Use one call to `sorted` with a `key` function.

```python
visits = [("203.0.113.80", 3), ("203.0.113.5", 4), ("198.51.100.23", 6),
          ("203.0.113.9", 3), ("127.0.0.1", 2), ("192.0.2.44", 3)]
```

Hint: Python compares tuples item by item, and the negative of a count sorts the biggest count first.

<details>
<summary>Show the solution</summary>

```python title="rank.py"
visits = [("203.0.113.80", 3), ("203.0.113.5", 4), ("198.51.100.23", 6),
          ("203.0.113.9", 3), ("127.0.0.1", 2), ("192.0.2.44", 3)]

def rank(pair):
    ip, count = pair
    return (-count, ip)

for ip, count in sorted(visits, key=rank):
    print(f"{ip:15} {count}")
```

```bash
python3 rank.py
```

```output
198.51.100.23   6
203.0.113.5     4
192.0.2.44      3
203.0.113.80    3
203.0.113.9     3
127.0.0.1       2
```

`rank` turns each pair into a tuple `(-count, ip)`. Tuples are compared item by item: first the negative counts, where -6 is the smallest and so comes first, and only on a tie the IP strings. That gives "biggest count first, then alphabetical" without `reverse=True`, which would have reversed the alphabetical order too. As in step 2, the IP addresses are sorted as text: `"203.0.113.80"` comes before `"203.0.113.9"`, because the character `8` comes before `9`. Sorting IP addresses by their numeric value needs the standard `ipaddress` module.

</details>

## Check yourself

**1. Binary search needs one thing from the list that linear search does not. What is it?**

<details>
<summary>Answer</summary>

The list must be sorted. Binary search throws away half of the list after each comparison, which is only correct if everything smaller is on one side and everything bigger on the other.

</details>

**2. About how many steps does binary search need for a sorted list of a million items? And linear search, in the worst case?**

<details>
<summary>Answer</summary>

About 20 for binary search, because a million can be halved about 20 times before one item is left. A million for linear search, when the item is last or missing.

</details>

**3. Why is merge sort O(n log n)?**

<details>
<summary>Answer</summary>

The list is halved again and again, which gives about log n levels. At each level, merging all the pieces touches every item once, which is O(n). So the total is O(n) per level times log n levels.

</details>

**4. When does quick sort become O(n²)?**

<details>
<summary>Answer</summary>

When the pivots are bad, for example always the smallest or biggest item. Then each split removes only the pivot, so there are about n levels of splitting instead of log n, each doing O(n) work.

</details>

**5. What does it mean that Python's sort is stable, and when is that useful?**

<details>
<summary>Answer</summary>

Items that compare as equal keep the order they had before sorting. It is useful when you sort by one field and want ties to stay in an earlier order, for example log entries with the same count that should stay in time order.

</details>

## Common mistakes

- **Binary search on an unsorted list.** It gives wrong answers without any error. Sort first, or use a set.
- **Writing `items = items.sort()`.** `sort` changes the list itself and returns `None`, so `items` becomes `None`. Write `items.sort()` alone, or `items = sorted(items)`.
- **Sorting inside a loop.** Calling `sorted` on every pass costs O(n log n) each time. Sort once, before the loop, or keep the data in a structure that stays ordered.
- **Sorting numbers stored as text.** `sorted(["10", "9", "100"])` gives `['10', '100', '9']`, because strings are compared character by character. Convert to `int` first, or use `key=int`.
- **Writing your own sort for real work.** Your bubble, merge and quick sorts are for learning. In real code, `sorted` and `list.sort` are faster, stable and well tested.

## Key terms

- **Linear search**: checking the items of a list one by one until the target is found. O(n).
- **Binary search**: searching a sorted list by looking at the middle and throwing away the half that cannot contain the target. O(log n).
- **Bubble sort**: sorting by repeatedly swapping neighbours that are in the wrong order. O(n²).
- **Merge sort**: sorting by splitting the list in halves, sorting each half, and merging the sorted halves. O(n log n).
- **Quick sort**: sorting by splitting the list around a pivot into smaller and bigger items, and sorting each part. O(n log n) on average, O(n²) in the worst case.
- **Pivot**: the item quick sort uses to split a list into smaller and bigger items.
- **Stable sort**: a sort that keeps items that compare as equal in their original order.

## Go further

- [Python documentation: Sorting Techniques](https://docs.python.org/3/howto/sorting.html): `key`, `reverse`, sorting by several fields, and stability, with examples.
- [Python documentation: bisect](https://docs.python.org/3/library/bisect.html): binary search and sorted inserts from the standard library.
- [Python documentation: list.sort](https://docs.python.org/3/library/stdtypes.html#list.sort): the official description of the sort method and its guarantees.
