---
title: "Module 4: Data Structures & Algorithms"
description: Choose the right data structure for a job, and measure how fast your code runs as its input grows.
module: 4
sidebar:
  order: 0
  label: Overview
---

Two programs can give exactly the same answer, and one of them can take a second while the other takes an hour. The difference is almost never the computer. It is the way the data is stored and the steps taken to work through it. This module shows you how to see that difference before it bites, using Python and timings you run yourself, and ends by making the `mylab` log analyzer fast on big logs.

## What you will learn

- How to describe the growth of a program's work with Big-O notation, and check it with your own timings.
- How a Python list sits in memory, and which list operations are cheap or expensive.
- When to use a stack, a queue, a hash map (dict or set) or a linked list, and what each one costs.
- How recursion works, and how the call stack keeps track of it.
- How to build and walk trees and graphs, with binary search trees, BFS and DFS.
- How the classic searching and sorting algorithms work, and how to use Python's own sort well.
- How to find the slow part of a real tool with a benchmark, and fix it with a better data structure.

## Before you start

You need Python from [Module 3](../python/): functions, lists, dictionaries and sets, classes, modules, and running scripts from the terminal. The project step continues the log analyzer that Module 3 added to `mylab`, and commits with git as in [Module 2](../git/). No mathematics beyond multiplying and halving numbers is needed.

Everything runs on Ubuntu (on WSL, in Codespaces or installed) with the Python that Ubuntu includes. Timings depend on your computer, so your seconds will differ from the ones in the lessons; the patterns are what count.

## Time

10 lessons, about 3 hours 45 minutes of reading and practice.

## Module map

```mindmap
Data Structures & Algorithms
  Measuring
    Big-O notation
    timing with perf_counter
    worst case
  Sequences
    arrays and lists
    stacks and queues
    linked lists
  Fast lookup
    hash maps
    sets and dicts
    collisions
  Nested data
    recursion
    trees
    graphs
  Algorithms
    binary search
    merge and quick sort
    Python's sorted
```

## Lessons

1. 4.1 [Big-O notation](../algorithms/big-o-notation/): measure how the work grows when the input grows, with timings you run yourself.
2. 4.2 [Arrays and lists](../algorithms/arrays-and-lists/): how a list sits in memory, and which operations are cheap or expensive.
3. 4.3 [Stacks and queues](../algorithms/stacks-and-queues/): last in first out, first in first out, with an undo history and a task queue as examples.
4. 4.4 [Hash maps](../algorithms/hash-maps/): why dictionary lookups are fast, and what a collision is.
5. 4.5 [Linked lists](../algorithms/linked-lists/): build a linked list by hand and compare it with an array.
6. 4.6 [Recursion](../algorithms/recursion/): functions that call themselves, the call stack, and base cases.
7. 4.7 [Trees](../algorithms/trees/): binary trees, binary search trees, and three ways to walk a tree.
8. 4.8 [Graphs](../algorithms/graphs/): model a network as nodes and edges, and explore it with BFS and DFS.
9. 4.9 [Searching and sorting](../algorithms/searching-and-sorting/): linear and binary search, then bubble, merge and quick sort, and what Python's own sort does.
10. 4.10 [Project step: faster tools in mylab](../algorithms/project/): speed up the log analyzer with better data structures, and measure the gain.

## Project step

The log analyzer from Module 3 gets a `--blocklist` option that flags requests from known bad IP addresses. A new script, `tools/bench.py`, creates a made-up log of 50,000 lines and a blocklist of 20,001 addresses, and times each part of the analyzer. The first version keeps the blocklist in a list, and the benchmark shows that the check is the slowest part. Changing it to a set makes it thousands of times faster without changing the answer. Two new tests cover the new functions, and you commit it all to `mylab`.

## Cheat sheet

[Cheat sheet: Big-O and data structures](../algorithms/cheat-sheet/): the costs of every structure in this module and the patterns you wrote, on one page.
