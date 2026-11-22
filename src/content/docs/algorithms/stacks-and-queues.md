---
title: Stacks and queues
description: Use a stack (last in, first out) for an undo history and a queue (first in, first out) for a list of tasks, and see why a deque beats a list for queues.
lesson: "4.3"
time: 20 min
sidebar:
  order: 3
---

Press Ctrl+Z in a text editor and the last thing you did disappears. Press it again and the thing before that goes too. The editor never undoes your first edit before your latest one. Behind that key sits one of the simplest data structures there is, and its twin keeps order in print queues, download managers and web servers.

## Goal

After this lesson you can:

- Explain the difference between a stack (last in, first out) and a queue (first in, first out).
- Use a Python list as a stack and a `collections.deque` as a queue.
- Explain why `list.pop(0)` makes a slow queue, and measure it.

## Why it matters

Stacks and queues are not exotic. Your browser's Back button is a stack of pages. A web server that receives more requests than it can handle puts them in a queue. Python itself uses a stack to keep track of which function called which, and the error messages you have seen since Module 3 print that stack. Choosing the right one of the two also avoids the slow pattern from the last lesson, where every item of a big list moves on each step.

## The idea

A **stack** is a pile of items where you only touch the top. You **push** an item onto the top, and you **pop** the item from the top. The last item you pushed is the first one you get back, so a stack is called **LIFO**: last in, first out. Think of a pile of plates in a canteen: you put a clean plate on top, and you take the top plate. Nobody pulls one out from the bottom.

A **queue** is a line where items enter at one end and leave at the other. You **enqueue** at the back and **dequeue** from the front. The first item in is the first item out, so a queue is **FIFO**: first in, first out. It works exactly like the line at a bakery: whoever came first is served first.

| | Stack | Queue |
|---|---|---|
| Order | last in, first out (LIFO) | first in, first out (FIFO) |
| Add | push, on top | enqueue, at the back |
| Remove | pop, from the top | dequeue, from the front |
| Everyday example | undo history, Back button | print queue, a line at a counter |
| In Python | `list`: `append` and `pop()` | `collections.deque`: `append` and `popleft()` |

Why a list for one and something else for the other? Recall lesson 4.2: a list adds and removes at its end in O(1), but removing from its front shifts every other item, which is O(n). A stack only ever uses one end, so a list is perfect. A queue uses both ends, so it needs a structure that is cheap at both: a **deque** (say "deck", short for double-ended queue). Python's `collections.deque` adds and removes at either end in O(1).

## Try it

```bash
mkdir -p ~/algo
cd ~/algo
```

### 1. Build an undo history with a stack

Each edit is pushed with `append`. Undo pops the most recent one:

```python
history = []
history.append("type 'Hello'")
history.append("type ' world'")
history.append("make bold")
print("history:", history)

print("undo:", history.pop())
print("undo:", history.pop())
print("history:", history)
print("next undo would be:", history[-1])
```

```output
history: ["type 'Hello'", "type ' world'", 'make bold']
undo: make bold
undo: type ' world'
history: ["type 'Hello'"]
next undo would be: type 'Hello'
```

The edits come back in the opposite order from the one they went in: the last edit, "make bold", is undone first. `history[-1]` reads the top without removing it, which is often called **peek**. Python prints a string in double quotes when it contains a single quote, which is why the first one looks different.

### 2. Do not pop an empty stack

```python
history = []
try:
    history.pop()
except IndexError as error:
    print("error:", error)

if history:
    print("undo:", history.pop())
else:
    print("nothing to undo")
```

```output
error: pop from empty list
nothing to undo
```

Popping an empty list raises an `IndexError`. An editor must not crash when you press Ctrl+Z one time too many, so real code checks first: an empty list counts as false in an `if`, as you saw in Module 3.

### 3. Run a task queue with a deque

```python
from collections import deque

tasks = deque()
tasks.append("scan report.pdf")
tasks.append("scan photo.jpg")
tasks.append("scan backup.zip")
print("waiting:", list(tasks))

while tasks:
    task = tasks.popleft()
    print("working on:", task, "| still waiting:", len(tasks))
```

```output
waiting: ['scan report.pdf', 'scan photo.jpg', 'scan backup.zip']
working on: scan report.pdf | still waiting: 2
working on: scan photo.jpg | still waiting: 1
working on: scan backup.zip | still waiting: 0
```

`append` enqueues at the back, and `popleft` dequeues from the front. The tasks are done in the order they arrived. `while tasks:` keeps going as long as the deque is not empty, exactly like an `if` on a list. `list(tasks)` is only there to print the deque in the familiar list style.

### 4. Add work while the queue runs

A queue is most useful when the work itself produces new work. Here, opening a folder adds its files to the back of the queue:

```python
from collections import deque

folders = {
    "home": ["notes", "photos", "todo.txt"],
    "notes": ["linux.txt"],
    "photos": ["cat.jpg"],
}

queue = deque(["home"])
while queue:
    name = queue.popleft()
    print("visit", name)
    for child in folders.get(name, []):
        queue.append(child)
```

```output
visit home
visit notes
visit photos
visit todo.txt
visit linux.txt
visit cat.jpg
```

Everything directly inside `home` is visited before anything one level deeper, because the deeper items joined the queue later. `folders.get(name, [])` returns an empty list for a name that is not a folder. Keep this little program in mind: lesson 4.8 uses the same pattern to explore a network.

### 5. Measure a list used as a queue

Create `queue_speed.py`:

```python title="queue_speed.py"
import time
from collections import deque

def drain_list(n):
    items = list(range(n))
    while items:
        items.pop(0)

def drain_deque(n):
    items = deque(range(n))
    while items:
        items.popleft()

for n in [5_000, 10_000, 20_000]:
    start = time.perf_counter()
    drain_list(n)
    middle = time.perf_counter()
    drain_deque(n)
    end = time.perf_counter()
    print(f"n={n:>6,}: list.pop(0) {middle - start:.3f} s, deque.popleft() {end - middle:.3f} s")
```

<!-- lab: nocheck -->
```bash
python3 queue_speed.py
```

```output
n= 5,000: list.pop(0) 0.262 s, deque.popleft() 0.006 s
n=10,000: list.pop(0) 1.058 s, deque.popleft() 0.009 s
n=20,000: list.pop(0) 4.693 s, deque.popleft() 0.051 s
```

Both functions empty a queue of n items from the front. With the list, doubling n makes the work about four times bigger, because each `pop(0)` shifts all the items that are left: O(n) per step, O(n²) in total. With the deque, the time stays tiny, because each `popleft` is O(1): at these sizes, most of what you see is the noise of the clock. Your seconds will differ from the slow test machine of this course, but the pattern should match.

## Exercise

Write a function `balanced(text)` that returns `True` when every bracket in `text` is closed in the right order, and `False` otherwise. It should handle `()`, `[]` and `{}`, and ignore every other character. Use a stack. Check it with these lines:

```python
tests = ["(a[1] + b[2])", "{[()]}", "(]", "((x)", "x)(", "print('hi')"]
for t in tests:
    print(f"{t:14} {balanced(t)}")
```

Hint: when you meet an opening bracket, push it. When you meet a closing bracket, the top of the stack must be its partner.

<details>
<summary>Show the solution</summary>

```python title="brackets.py"
PAIRS = {")": "(", "]": "[", "}": "{"}

def balanced(text):
    stack = []
    for ch in text:
        if ch in "([{":
            stack.append(ch)
        elif ch in PAIRS:
            if not stack or stack.pop() != PAIRS[ch]:
                return False
    return not stack

tests = ["(a[1] + b[2])", "{[()]}", "(]", "((x)", "x)(", "print('hi')"]
for t in tests:
    print(f"{t:14} {balanced(t)}")
```

```bash
python3 brackets.py
```

```output
(a[1] + b[2])  True
{[()]}         True
(]             False
((x)           False
x)(            False
print('hi')    True
```

`PAIRS` maps each closing bracket to its opening partner. A closing bracket fails in two cases: the stack is empty (nothing was opened, as in `x)(`), or the top is the wrong kind (as in `(]`). At the end, `return not stack` gives `True` only if every opening bracket was closed; in `((x)` one is left over. The function looks at each character once, and each push or pop is O(1), so it is O(n). Code editors and Python itself check your brackets in a similar way.

</details>

## Check yourself

**1. You push A, then B, then C onto a stack, and pop twice. What do you get, and what is left?**

<details>
<summary>Answer</summary>

You get C, then B. Only A is left. A stack gives items back in the opposite order: last in, first out.

</details>

**2. You enqueue A, then B, then C, and dequeue twice. What do you get?**

<details>
<summary>Answer</summary>

A, then B. A queue is first in, first out, so items leave in the order they arrived. C is still waiting.

</details>

**3. Why is a plain list fine for a stack but a poor choice for a big queue?**

<details>
<summary>Answer</summary>

A stack only adds and removes at the end of the list, which is O(1). A queue removes from the front, and `pop(0)` shifts every remaining item, which is O(n) per call. A `deque` does both ends in O(1).

</details>

**4. What does `history[-1]` do that `history.pop()` does not?**

<details>
<summary>Answer</summary>

It reads the top item without removing it (a peek). `pop()` removes the item and returns it.

</details>

**5. A web server gets requests faster than it can answer them. Should it keep the waiting requests in a stack or a queue? Why?**

<details>
<summary>Answer</summary>

A queue. The request that has waited longest should be answered first. With a stack, the newest request would always jump ahead, and an early request could wait forever.

</details>

## Common mistakes

- **Using `list.pop(0)` for a queue.** It works on small lists and slows down badly on big ones. Use `collections.deque` with `append` and `popleft`.
- **Popping without checking.** `pop()` on an empty list or deque raises `IndexError`. Check with `if items:` first, or catch the error.
- **Mixing up the ends of a deque.** `append` with `popleft` is a queue. `append` with `pop` on a deque is a stack. Pick one pair and stick to it.
- **Expecting `deque[i]` to be fast everywhere.** A deque is cheap at its two ends, but reading an item in the middle by index is slower than with a list. If you need fast access by position, use a list.
- **Changing a list while looping over it with `for`.** To work through a stack or queue, use `while items:` and pop inside the loop.

## Key terms

- **Stack**: a collection where you add and remove items only at one end, the top. Last in, first out.
- **Push (stack)**: add an item to the top of a stack. (In git, `push` means something else: sending commits to a remote.)
- **Pop**: remove the top item of a stack and return it.
- **Peek**: read the top item of a stack without removing it.
- **LIFO**: last in, first out, the order of a stack.
- **Queue**: a collection where items join at the back and leave from the front. First in, first out.
- **Enqueue**: add an item to the back of a queue.
- **Dequeue**: remove the item at the front of a queue.
- **FIFO**: first in, first out, the order of a queue.
- **Deque**: a double-ended queue, cheap to add to and remove from at both ends. In Python, `collections.deque`.

## Go further

- [Python documentation: collections.deque](https://docs.python.org/3/library/collections.html#collections.deque): every method of the deque, including `appendleft`, `rotate` and a maximum length.
- [Python tutorial: Using lists as stacks and queues](https://docs.python.org/3/tutorial/datastructures.html#using-lists-as-stacks): the official short explanation of the same choice.
- [Python documentation: queue](https://docs.python.org/3/library/queue.html): queues that several threads can share safely, for later when your programs do several things at once.
