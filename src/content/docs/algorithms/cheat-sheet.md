---
title: "Cheat sheet: Big-O and data structures"
description: The costs of Python's lists, deques, sets and dicts, the common growth rates, and the search, sort and graph patterns from Module 4 on one page.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## Growth rates

| Big-O | Name | When n doubles | Typical code |
|---|---|---|---|
| O(1) | constant | same work | index a list, look up a dict key |
| O(log n) | logarithmic | one step more | binary search, balanced tree |
| O(n) | linear | twice the work | one loop over the input, `x in a_list` |
| O(n log n) | n log n | a little more than twice | merge sort, `sorted` |
| O(n²) | quadratic | four times the work | a loop inside a loop over the same input |

Keep the fastest-growing part, drop constants: 5n + 300 is O(n). Big-O usually describes the worst case.

## Timing code

| Tool | Use |
|---|---|
| `start = time.perf_counter()` ... `time.perf_counter() - start` | seconds taken by the code in between |
| `timeit.timeit("code", globals=globals(), number=100)` | total seconds for 100 runs of a short piece of code |
| `sys.getsizeof(x)` | bytes used by the object itself |

Compare n with 2n on the same machine, and trust the ratio, not the last digit.

## Costs in Python

| Operation | list | deque | set or dict |
|---|---|---|---|
| read by index `x[i]` | O(1) | slower in the middle | not available |
| add at the end | O(1) amortized `append` | O(1) `append` | O(1) on average `add`, `d[k] = v` |
| remove at the end | O(1) `pop()` | O(1) `pop()` | not available |
| add or remove at the front | O(n) `insert(0, x)`, `pop(0)` | O(1) `appendleft`, `popleft` | not available |
| is `x` in there? | O(n) | O(n) | O(1) on average |

Set and dict keys must be hashable: numbers, strings, tuples. Not lists.

## Which structure

| You need | Use |
|---|---|
| items in order, read by position | `list` |
| last in, first out (undo, Back button) | `list` with `append` and `pop()` |
| first in, first out (task queue, BFS) | `collections.deque` with `append` and `popleft()` |
| fast "is it there?" | `set` |
| a value per key, or counts | `dict`, `collections.Counter` |
| cheap inserts at the front of a chain | linked list (`Node` with `value` and `next`) |
| ordered data with fast search | sorted list with `bisect`, or a balanced tree |

## Recursion

| Part | Meaning |
|---|---|
| base case | answered directly, ends the recursion |
| recursive case | calls itself on a smaller input |
| call stack | one frame per unfinished call; a traceback prints it, newest last |
| limit | about 1,000 frames, then `RecursionError` |

## Trees and graphs

| Idea | Fact |
|---|---|
| binary search tree | smaller values left, bigger right, at every node |
| search cost | the height: about log n if balanced, n if built from sorted data |
| in-order | left, node, right: a BST in sorted order |
| pre-order / post-order | node first / node last |
| adjacency list | `{"web": ["router", "db"], ...}`; an undirected edge is stored twice |
| BFS | queue, visits in rings, finds shortest paths in hops |
| DFS | stack or recursion, goes deep first |
| both | keep a `visited` set; cost O(V + E) |

## Searching and sorting

| Algorithm | Cost | Note |
|---|---|---|
| linear search | O(n) | any list |
| binary search | O(log n) | sorted list only; `bisect.bisect_left(items, x)` |
| bubble sort | O(n²) | for learning |
| merge sort | O(n log n) | split, sort halves, merge |
| quick sort | O(n log n) average, O(n²) worst | split around a pivot |
| `sorted(x)`, `x.sort()` | O(n log n) | stable; `sort` returns `None` |

| Sort call | Result |
|---|---|
| `sorted(pairs, key=by_count, reverse=True)` | biggest count first, ties keep their order |
| `sorted(pairs, key=rank)` with `rank` returning `(-count, ip)` | biggest count first, then alphabetical |
| `names.sort(key=str.lower)` | ignore capital letters |
