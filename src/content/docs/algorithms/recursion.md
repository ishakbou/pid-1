---
title: Recursion
description: Write functions that call themselves, give them a base case so they stop, and watch the call stack grow and shrink while they run.
lesson: "4.6"
time: 20 min
sidebar:
  order: 6
---

How many files are in a folder, counting the folders inside it, and the folders inside those, however deep they go? A `for` loop can go through one folder. But you do not know in advance how many levels there are, so how many loops do you write? The answer is one function that handles one folder, and calls itself for every folder it finds inside.

## Goal

After this lesson you can:

- Write a recursive function with a base case and a recursive case.
- Explain what the call stack is, and read it in a traceback.
- Use recursion on data shaped like a tree: nested lists and folders.

## Why it matters

Much of the data you will meet is nested: folders inside folders, HTML tags inside tags, JSON objects inside objects, and the trees and graphs of the next two lessons. Recursion is the natural way to handle data like that. It also explains the tracebacks Python has printed at you since Module 3: they are a picture of the call stack. And it is behind fast algorithms such as merge sort, which you will write in lesson 4.9.

## The idea

A **recursive function** is a function that calls itself. Each call works on a smaller piece of the problem, until the piece is so small that the answer is obvious. Every recursive function has two parts:

- The **base case**: the small case that is answered directly, without another call. It is what makes the recursion stop.
- The **recursive case**: the function does a little work and calls itself on a smaller piece.

Think of a set of nesting dolls. To count them, you open the outer doll. If there is a smaller doll inside, you count that one the same way and add one. If the doll is solid and does not open, that is the base case: it counts as one, and you stop.

How does Python keep track of all those unfinished calls? Each time a function is called, Python creates a **stack frame** (often just called a frame): a small record holding that call's local variables and the place to return to. The frames are kept on the **call stack**, which is a stack exactly like the one in lesson 4.3. A new call pushes a frame on top. When a call returns, its frame is popped, and the call below it carries on where it stopped.

## Try it

```bash
mkdir -p ~/algo
cd ~/algo
```

### 1. Count down with a function that calls itself

```python
def countdown(n):
    if n == 0:
        print("liftoff")
        return
    print(n)
    countdown(n - 1)

countdown(3)
```

```output
3
2
1
liftoff
```

`countdown(3)` prints 3 and calls `countdown(2)`, which prints 2 and calls `countdown(1)`, and so on. `countdown(0)` is the base case: it prints `liftoff` and returns without calling anything. Each call has its own `n`, stored in its own frame, so the calls do not overwrite each other's values.

### 2. Watch the stack grow and shrink

The **factorial** of n, written n!, is 1 × 2 × ... × n. It has a recursive definition: 0! is 1, and n! is n × (n - 1)!. This version prints each call, indented by its depth on the call stack:

```python
def factorial(n, depth=0):
    pad = "  " * depth
    print(f"{pad}factorial({n}) called")
    if n == 0:
        result = 1
    else:
        result = n * factorial(n - 1, depth + 1)
    print(f"{pad}factorial({n}) returns {result}")
    return result

print("answer:", factorial(3))
```

```output
factorial(3) called
  factorial(2) called
    factorial(1) called
      factorial(0) called
      factorial(0) returns 1
    factorial(1) returns 1
  factorial(2) returns 2
factorial(3) returns 6
answer: 6
```

Read the output from top to bottom. On the way in, each call stops in the middle of the line `result = n * factorial(n - 1, ...)`, because it needs the answer of the smaller call first. Four frames pile up on the call stack. `factorial(0)` is the base case, and it returns 1 at once. Then the frames are popped one by one, last in, first out: each waiting call gets its answer, multiplies, and returns.

### 3. Read the call stack in a traceback

Create `boom.py`, a countdown that crashes when it reaches zero:

```python title="boom.py"
def countdown(n):
    print(n)
    if n == 0:
        print(1 / n)
    countdown(n - 1)

countdown(2)
```

```bash
python3 boom.py
```

```output
2
1
0
Traceback (most recent call last):
  File "/home/sam/algo/boom.py", line 7, in <module>
    countdown(2)
  File "/home/sam/algo/boom.py", line 5, in countdown
    countdown(n - 1)
  File "/home/sam/algo/boom.py", line 5, in countdown
    countdown(n - 1)
  File "/home/sam/algo/boom.py", line 4, in countdown
    print(1 / n)
          ~~^~~
ZeroDivisionError: division by zero
```

A traceback is a printout of the call stack at the moment of the crash, from the bottom frame to the top one. The first entry is the main program, which called `countdown(2)`. Then come two frames of `countdown` waiting on line 5, for n = 2 and n = 1. The last entry is the frame where it broke: `countdown(0)` on line 4. "Most recent call last" means the newest frame is at the bottom of the printout. You see `sam` in the paths; your screen shows your own username.

### 4. Forget the base case

```python
import sys

def forever(n):
    return forever(n + 1)

print("limit:", sys.getrecursionlimit())
try:
    forever(0)
except RecursionError as error:
    print("error:", error)
```

```output
limit: 1000
error: maximum recursion depth exceeded
```

Without a base case, the calls never stop, and every call adds a frame. Python protects itself with a limit of about 1,000 frames and raises `RecursionError` when the stack gets that deep. Many languages have no such guard: a program that runs out of stack space simply crashes, which is called a **stack overflow**.

### 5. Add up a nested list

Recursion shines on data that is nested to an unknown depth. Here the items of a list can be numbers or other lists:

```python
def nested_sum(items):
    total = 0
    for item in items:
        if isinstance(item, list):
            total += nested_sum(item)
        else:
            total += item
    return total

print(nested_sum([1, 2, 3]))
print(nested_sum([1, [2, 3], [4, [5, [6]]]]))
```

```output
6
21
```

`isinstance(item, list)` asks "is this item a list?". If it is, the function calls itself on the inner list and adds what comes back. The base case hides in the loop: a list with no inner lists makes no further call. A plain loop cannot do this alone, because you would need one more nested loop for every level, and the depth is not known in advance.

### 6. Walk a real folder tree

Back to the question at the start of the lesson. Build a small folder tree:

```bash
mkdir -p lab/notes/linux lab/notes/git lab/photos
touch lab/todo.txt lab/notes/intro.txt lab/notes/linux/commands.txt
touch lab/notes/linux/paths.txt lab/notes/git/commits.txt lab/photos/cat.jpg
```

Create `walk.py`:

```python title="walk.py"
import os

def show(path, depth=0):
    count = 0
    for name in sorted(os.listdir(path)):
        full = os.path.join(path, name)
        if os.path.isdir(full):
            print("    " * depth + name + "/")
            count += show(full, depth + 1)
        else:
            print("    " * depth + name)
            count += 1
    return count

files = show("lab")
print(files, "files")
```

```bash
python3 walk.py
```

```output
notes/
    git/
        commits.txt
    intro.txt
    linux/
        commands.txt
        paths.txt
photos/
    cat.jpg
todo.txt
6 files
```

`os.listdir` returns the names inside a folder, and `sorted` puts them in alphabetical order. `os.path.join` glues a folder and a name into a path, and `os.path.isdir` tells a folder from a file. For each folder, `show` calls itself one level deeper; for each file, it counts one. Each call returns the number of files below it, and the counts add up on the way back. It works for any depth, which is what `ls -R` and `find` do for you on Linux.

## Exercise

Write a function `flatten(items)` that takes a nested list like the one in step 5 and returns a flat list of all the numbers, in order. Then write `depth(items)` that returns how deep the nesting goes: `[1, 2]` has depth 1, `[1, [2]]` has depth 2. Test both on `[1, [2, 3], [4, [5, [6]]]]` and on `[]`.

<details>
<summary>Show the solution</summary>

```python title="nested.py"
def flatten(items):
    flat = []
    for item in items:
        if isinstance(item, list):
            flat.extend(flatten(item))
        else:
            flat.append(item)
    return flat

def depth(items):
    deepest = 0
    for item in items:
        if isinstance(item, list):
            deepest = max(deepest, depth(item))
    return deepest + 1

data = [1, [2, 3], [4, [5, [6]]]]
print(flatten(data), depth(data))
print(flatten([]), depth([]))
```

```bash
python3 nested.py
```

```output
[1, 2, 3, 4, 5, 6] 4
[] 1
```

`flatten` has the same shape as `nested_sum`: for an inner list it calls itself and adds all the numbers it gets back with `extend`, which appends every item of another list. `depth` asks each inner list for its depth, keeps the biggest with `max`, and adds 1 for its own level. An empty list still counts as one level, which is a choice; you could also decide that it has depth 0. Deciding what the smallest case should return is most of the work of writing a recursive function.

</details>

## Check yourself

**1. What are the two parts every recursive function needs?**

<details>
<summary>Answer</summary>

A base case, answered directly without another call, which makes the recursion stop. And a recursive case, where the function calls itself on a smaller piece of the problem.

</details>

**2. What happens if a recursive function has no base case, or never reaches it?**

<details>
<summary>Answer</summary>

It keeps calling itself, and each call adds a frame to the call stack. In Python, once the stack is about 1,000 frames deep, it raises `RecursionError: maximum recursion depth exceeded`.

</details>

**3. During `factorial(3)`, how many frames of `factorial` are on the call stack at the deepest point?**

<details>
<summary>Answer</summary>

Four: `factorial(3)`, `factorial(2)`, `factorial(1)` and `factorial(0)`. Each is waiting for the one above it, except `factorial(0)`, the base case.

</details>

**4. In a traceback, where is the function that actually crashed: at the top or at the bottom?**

<details>
<summary>Answer</summary>

At the bottom. A traceback lists the frames from the oldest call to the newest one ("most recent call last"), and the newest one is where the error happened.

</details>

**5. Why is recursion a good fit for walking a folder tree?**

<details>
<summary>Answer</summary>

A folder can contain folders to any depth, and each inner folder is the same kind of problem as the outer one. One function that handles one folder and calls itself for each subfolder works for any depth, without knowing it in advance.

</details>

## Common mistakes

- **A base case that is never reached.** `countdown(-1)` in step 1 counts down forever, because n never equals 0. Make the base case catch every small input, for example `if n <= 0:`.
- **Forgetting `return` in front of the recursive call.** If a function should return the answer of the smaller call, write `return f(n - 1)`. Without `return`, the answer is thrown away and the function returns `None`.
- **Not making the problem smaller.** Calling `f(n)` from inside `f(n)` with the same input never gets closer to the base case. Every call must move towards it.
- **Recursing very deep in Python.** A recursive function on a list of 10,000 items, one call per item, hits the limit of about 1,000 frames. For long, flat data, use a loop. Keep recursion for nested data, where the depth stays small.
- **Computing the same thing over and over.** A recursive function that calls itself twice per step, such as a naive Fibonacci function (each Fibonacci number is the sum of the two before it, so `fib(n)` calls `fib(n - 1)` and `fib(n - 2)`), repeats the same calls again and again and becomes very slow. If you notice repeated calls, store the answers in a dict.

## Key terms

- **Recursive function**: a function that calls itself to solve a smaller piece of the same problem.
- **Base case**: the input a recursive function answers directly, without calling itself, which ends the recursion.
- **Recursive case**: the part of a recursive function that calls itself on a smaller input.
- **Stack frame**: the record Python creates for one function call, holding its local variables and where to return to.
- **Call stack**: the stack of frames of all the calls that have started but not yet returned.
- **Stack overflow**: a crash that happens when the call stack runs out of space, usually because of recursion without an end.
- **Factorial**: the product 1 × 2 × ... × n, written n!. By definition, 0! is 1.

## Go further

- [Python documentation: sys.setrecursionlimit](https://docs.python.org/3/library/sys.html#sys.setrecursionlimit): the recursion limit, and why raising it can crash Python.
- [Python documentation: os.walk](https://docs.python.org/3/library/os.html#os.walk): the standard way to walk a folder tree, which does the work of step 6 for you.
- [Python tutorial: Defining functions](https://docs.python.org/3/tutorial/controlflow.html#defining-functions): a refresher on functions, local variables and `return`.
