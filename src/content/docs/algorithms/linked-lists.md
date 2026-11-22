---
title: Linked lists
description: Build a linked list by hand in Python, out of nodes that point to the next node, and compare its costs with those of an array.
lesson: "4.5"
time: 25 min
sidebar:
  order: 5
---

Picture a treasure hunt. The first clue is under the doormat, and it says "look in the mailbox". The note in the mailbox says "look behind the clock", and so on until the last note says "the end". Nobody knows where clue number seven is without following the first six. That chain of notes is a linked list, and in this lesson you build one with your own hands.

## Goal

After this lesson you can:

- Build a linked list out of nodes in Python, and walk through it.
- Add and remove items at the front of a linked list in O(1).
- Compare a linked list with an array, and say when each one is the better choice.

## Why it matters

In lesson 4.2, adding at the front of a list shifted every item. A linked list never shifts anything, which is why it sits inside many structures you already use: Python's `deque` from lesson 4.3 is built from linked blocks, and operating systems keep lists of running processes and free memory as linked lists. Building one by hand is also the best practice there is for working with references, the idea that the trees and graphs of the next lessons are made of.

## The idea

A **linked list** stores each item in its own small object called a **node**. A node holds two things: the item, and a reference to the next node. The list itself only needs to remember the first node, called the **head**. The last node points to `None`, which marks the end.

<figure class="diagram">
<svg viewBox="0 0 640 140" role="img" aria-labelledby="ll-title ll-desc">
<title id="ll-title">A linked list with three nodes</title>
<desc id="ll-desc">A box labelled head points to the first node. Each node is a box split in two parts: a value and a next reference. The first node holds GET slash, and its next arrow points to the second node, which holds GET slash login. Its next arrow points to the third node, which holds POST slash login. The third node's next part holds None, which marks the end.</desc>
<rect class="d-box d-hot" x="5" y="50" width="60" height="40"/>
<text x="35" y="75">head</text>
<path class="d-line d-hot" d="M65 70 H85"/>
<rect class="d-box" x="85" y="50" width="110" height="40"/>
<rect class="d-box" x="195" y="50" width="40" height="40"/>
<text x="140" y="75">GET /</text>
<path class="d-line" d="M215 70 H265"/>
<rect class="d-box" x="265" y="50" width="110" height="40"/>
<rect class="d-box" x="375" y="50" width="40" height="40"/>
<text x="320" y="75">GET /login</text>
<path class="d-line" d="M395 70 H445"/>
<rect class="d-box" x="445" y="50" width="120" height="40"/>
<rect class="d-box" x="565" y="50" width="70" height="40"/>
<text x="505" y="75">POST /login</text>
<text x="600" y="75">None</text>
<text x="140" y="35">value</text>
<text x="215" y="35">next</text>
</svg>
<figcaption>Each node holds a value and a reference to the next node. The nodes can sit anywhere in memory; only the references hold the chain together.</figcaption>
</figure>

In a **doubly linked list**, each node also holds a reference to the previous node, so the chain can be walked in both directions. This lesson builds the simpler kind, a **singly linked list**, where each node only knows the next one.

Compare it with an array. An array keeps its items side by side, so it can jump to item i with one calculation. A linked list cannot: its nodes can be scattered anywhere in memory, so to reach item i you start at the head and follow i references. But the chain has its own strength. To add a node at the front, you make it point to the old head and call it the new head. Nothing moves, however long the list is.

| Operation | Array (Python list) | Linked list |
|---|---|---|
| read item i | O(1) | O(n): follow the chain |
| add or remove at the front | O(n): shift everything | O(1) |
| add at the end | O(1) amortized | O(1) if it keeps a reference to the last node |
| insert after a node you already hold | O(n): shift the rest | O(1) |
| search for a value | O(n) | O(n) |
| memory per item | one reference | a whole node object |

The analogy holds well: getting to clue seven takes seven steps, but slipping a new clue in between two others only means rewriting one note.

## Try it

```bash
mkdir -p ~/algo
cd ~/algo
```

### 1. Link three nodes by hand

```python
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

a = Node("GET /")
b = Node("GET /login")
c = Node("POST /login")
a.next = b
b.next = c

current = a
while current is not None:
    print(current.value)
    current = current.next
print("after the last node:", c.next)
```

```output
GET /
GET /login
POST /login
after the last node: None
```

Each `Node` starts with `next = None`. The two assignments `a.next = b` and `b.next = c` build the chain. The `while` loop is the heart of every linked list: start at the first node, do something with it, then move to `current.next`, until you fall off the end at `None`. Remember from lesson 4.2 that `a.next = b` stores a reference: there is still only one `b` object, and `a` now knows where it is.

### 2. Wrap the nodes in a class

Typing `a.next = b` by hand gets old fast. Create `linked.py` with a `LinkedList` class that keeps the head, the last node (the **tail**) and the size:

```python title="linked.py"
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None


class LinkedList:
    def __init__(self):
        self.head = None
        self.tail = None
        self.size = 0

    def push_front(self, value):
        node = Node(value)
        node.next = self.head
        self.head = node
        if self.tail is None:
            self.tail = node
        self.size += 1

    def append(self, value):
        node = Node(value)
        if self.tail is None:
            self.head = node
        else:
            self.tail.next = node
        self.tail = node
        self.size += 1

    def get(self, index):
        current = self.head
        for i in range(index):
            current = current.next
        return current.value

    def remove(self, value):
        previous = None
        current = self.head
        while current is not None:
            if current.value == value:
                if previous is None:
                    self.head = current.next
                else:
                    previous.next = current.next
                if current is self.tail:
                    self.tail = previous
                self.size -= 1
                return True
            previous = current
            current = current.next
        return False

    def to_list(self):
        items = []
        current = self.head
        while current is not None:
            items.append(current.value)
            current = current.next
        return items
```

Read the methods one at a time:

- `push_front` points the new node at the old head, then makes it the head. Three assignments, whatever the size: O(1).
- `append` hangs the new node after the tail. Because the list remembers its tail, it does not have to walk to the end: O(1) too.
- `get` walks `index` steps from the head. That is the price of a linked list: O(n).
- `remove` walks with two references, `previous` and `current`. When it finds the value, it makes `previous` skip over `current`, and the node drops out of the chain.

### 3. Use the class

Create `demo.py` next to it:

```python title="demo.py"
from linked import LinkedList

requests = LinkedList()
requests.append("GET /login")
requests.append("POST /login")
requests.push_front("GET /")
print(requests.to_list(), "size", requests.size)
print("item 2:", requests.get(2))

requests.remove("GET /login")
print(requests.to_list(), "size", requests.size)
print("found it again?", requests.remove("GET /login"))
print("head:", requests.head.value, "| tail:", requests.tail.value)
```

```bash
python3 demo.py
```

```output
['GET /', 'GET /login', 'POST /login'] size 3
item 2: POST /login
['GET /', 'POST /login'] size 2
found it again? False
head: GET / | tail: POST /login
```

`push_front` put `GET /` before the two appended items, without moving them. Removing `GET /login` from the middle only changed the `next` of the node before it. The removed node is not referenced by anything any more, so Python frees its memory on its own.

### 4. Measure the front of the list

Create `front.py`, which builds a list of n items by adding each one at the front, once with a Python list and once with your linked list:

```python title="front.py"
import time
from linked import LinkedList

for n in [10_000, 20_000, 40_000]:
    start = time.perf_counter()
    items = []
    for i in range(n):
        items.insert(0, i)
    middle = time.perf_counter()
    chain = LinkedList()
    for i in range(n):
        chain.push_front(i)
    end = time.perf_counter()
    print(f"n={n:>6,}: list.insert(0) {middle - start:.3f} s, push_front {end - middle:.3f} s")
```

<!-- lab: nocheck -->
```bash
python3 front.py
```

```output
n=10,000: list.insert(0) 0.512 s, push_front 0.137 s
n=20,000: list.insert(0) 2.178 s, push_front 0.373 s
n=40,000: list.insert(0) 6.547 s, push_front 0.399 s
```

The list version grows much faster than n: from 10,000 to 20,000 items it takes about four times longer, because every insert shifts all the items already there. That is O(n²) in total, as in lesson 4.2. The linked list grows at most in proportion to n, with some noise: O(1) per item, O(n) in total. At 40,000 items it is more than ten times faster. For small n, the linked list may even lose, because creating a `Node` object in Python is much slower than shifting a few references in C. The growth rate wins as soon as n is big enough.

### 5. Measure reading by position

Now the other side of the deal. Create `index.py`:

```python title="index.py"
import time
from linked import LinkedList

n = 100_000
items = list(range(n))
chain = LinkedList()
for i in range(n):
    chain.append(i)

for position in [0, 50_000, 99_999]:
    start = time.perf_counter()
    items[position]
    middle = time.perf_counter()
    chain.get(position)
    end = time.perf_counter()
    print(f"item {position:>6,}: list {middle - start:.6f} s, linked list {end - middle:.6f} s")
```

<!-- lab: nocheck -->
```bash
python3 index.py
```

```output
item      0: list 0.000063 s, linked list 0.000083 s
item 50,000: list 0.000026 s, linked list 0.028332 s
item 99,999: list 0.000027 s, linked list 0.050504 s
```

The Python list reads any position in the same tiny time. The linked list needs longer the further you go, because `get` follows one reference per position. If your program reads items by position a lot, a linked list is the wrong choice.

## Exercise

Add a method `reverse(self)` to `LinkedList` that reverses the list in place: it changes the `next` references so that the old tail becomes the head. Do not create any new nodes and do not use a Python list. Test it on `1, 2, 3, 4`, on a list with one item, and on an empty list.

Hint: walk the list with three references, `previous`, `current` and `following`, and turn each `next` arrow around.

<details>
<summary>Show the solution</summary>

Add this method to the `LinkedList` class in `linked.py`:

```python
    def reverse(self):
        previous = None
        current = self.head
        self.tail = self.head
        while current is not None:
            following = current.next
            current.next = previous
            previous = current
            current = following
        self.head = previous
```

<!-- lab: run
cd ~/algo
cat >> linked.py <<'EOF'

    def reverse(self):
        previous = None
        current = self.head
        self.tail = self.head
        while current is not None:
            following = current.next
            current.next = previous
            previous = current
            current = following
        self.head = previous
EOF
-->

And test it:

```python title="test_reverse.py"
from linked import LinkedList

for values in [[1, 2, 3, 4], [1], []]:
    chain = LinkedList()
    for v in values:
        chain.append(v)
    chain.reverse()
    tail = chain.tail.value if chain.tail else None
    print(chain.to_list(), "tail:", tail)
```

```bash
python3 test_reverse.py
```

```output
[4, 3, 2, 1] tail: 1
[1] tail: 1
[] tail: None
```

In each pass, `following` saves the rest of the chain before `current.next` is turned around to point backwards. Then `previous` and `current` both move one node forward. When `current` falls off the end, `previous` is the old last node, which becomes the new head. The old head becomes the new tail, which the method records before it starts. Every node is visited once, so `reverse` is O(n), and it needs no extra memory. If the method had forgotten `following`, the first turned arrow would cut the list off from the rest of its nodes.

</details>

## Check yourself

**1. What two things does a node of a singly linked list hold?**

<details>
<summary>Answer</summary>

The item (its value) and a reference to the next node. The last node's reference is `None`.

</details>

**2. Why is reading item i O(1) in an array but O(n) in a linked list?**

<details>
<summary>Answer</summary>

An array's items sit side by side, so the address of item i is computed in one step. A linked list's nodes can be anywhere in memory, so the only way to reach item i is to start at the head and follow i references.

</details>

**3. Why is `push_front` O(1)?**

<details>
<summary>Answer</summary>

It creates one node, points it at the old head, and makes it the new head. No other node is touched, however long the list is.

</details>

**4. Why does the `LinkedList` class keep a reference to its tail?**

<details>
<summary>Answer</summary>

So that `append` can hang the new node after the tail directly. Without the tail reference, it would have to walk the whole list to find the last node, which is O(n).

</details>

**5. You need a collection where you read items by position all the time and rarely insert. List or linked list?**

<details>
<summary>Answer</summary>

A Python list. Reading by position is O(1) in a list and O(n) in a linked list, and the linked list's advantage (cheap inserts at the front) does not matter here.

</details>

## Common mistakes

- **Losing the rest of the chain.** If you change `current.next` before you have saved the old value, every node after it is lost. Save the next node in a variable first, as `reverse` does with `following`.
- **Forgetting the empty list.** Code that reads `self.head.value` crashes with `AttributeError: 'NoneType' object has no attribute 'value'` when the list is empty. Check `if self.head is None` first.
- **Forgetting to update the tail.** When you remove the last node, the tail must move to the node before it, or `append` hangs new nodes on a node that is no longer in the list.
- **Writing `while current.next is not None` when you mean `while current is not None`.** The first one stops one node early and skips the last item. Use the second to visit every node.
- **Using a linked list in Python for speed by default.** Python lists are written in C and very fast. A hand-made linked list only wins when you insert or remove at the front or middle a lot; for a queue, use `collections.deque`.

## Key terms

- **Linked list**: a sequence of nodes where each node holds an item and a reference to the next node.
- **Node**: one element of a linked structure, holding a value and one or more references to other nodes.
- **Head**: the first node of a linked list. The list is reached through it.
- **Tail**: the last node of a linked list. Its next reference is `None`.
- **Singly linked list**: a linked list where each node only has a reference to the next node.
- **Doubly linked list**: a linked list where each node also has a reference to the previous node, so it can be walked in both directions.

## Go further

- [Python documentation: collections.deque](https://docs.python.org/3/library/collections.html#collections.deque): the standard queue, built from linked blocks, that you should use instead of a hand-made linked list in real code.
- [Python documentation: Classes](https://docs.python.org/3/tutorial/classes.html): a refresher on the class syntax used for `Node` and `LinkedList`.
- [Python Wiki: TimeComplexity](https://wiki.python.org/moin/TimeComplexity): the costs of list and deque operations, to compare with your own table.
