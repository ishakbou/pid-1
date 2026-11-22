---
title: Trees
description: Learn the words for trees, build a binary search tree in Python, search it, and walk it in three different orders.
lesson: "4.7"
time: 25 min
sidebar:
  order: 7
---

You have used a tree since Module 1. The Linux file system starts at one root, `/`, and every folder hangs below exactly one parent folder. The pages you will write in Module 8 are trees of HTML tags, and the JSON data of an API is a tree too. In this lesson you build a special kind of tree that keeps numbers in order and finds any of them in a handful of steps.

## Goal

After this lesson you can:

- Use the words of trees: root, parent, child, leaf, height.
- Build and search a binary search tree, and explain why a search is fast when the tree is balanced.
- Walk a tree in three orders: in-order, pre-order and post-order.

## Why it matters

Trees are how computers keep large sets of data both ordered and fast to search. The index that a database uses to speed up queries, which you will meet in Module 7, is a tree. So are the file system, the HTML of every web page, and the hierarchy of certificate authorities behind HTTPS in Module 10. Once you can walk a tree, you can walk all of them.

## The idea

A **tree** is a set of nodes connected by links, with one node at the top called the **root**. Every node except the root has exactly one **parent**, the node just above it. The nodes just below a node are its **children**. A node with no children is a **leaf**. The **height** of a tree is the number of nodes on the longest path from the root down to a leaf. Unlike real trees, computer trees are drawn upside down, with the root at the top.

A **binary tree** is a tree where every node has at most two children, called left and right. A node's left child together with everything below it is its **left subtree**, and the same goes for the right. A **binary search tree** (BST) is a binary tree with one extra rule, true at every node:

- everything in the left subtree is smaller than the node,
- everything in the right subtree is bigger (or equal).

<figure class="diagram">
<svg viewBox="0 0 520 230" role="img" aria-labelledby="bst-title bst-desc">
<title id="bst-title">A binary search tree with seven numbers</title>
<desc id="bst-desc">The root holds 50. Its left child is 30 and its right child is 70. 30 has the children 20 and 40. 70 has the children 60 and 80. The path from 50 to 70 to 60 is highlighted, showing the search for 60.</desc>
<path class="d-line" d="M240 52 L140 98 M140 132 L80 178 M140 132 L200 178 M380 132 L440 178"/>
<path class="d-line d-hot" d="M280 52 L380 98 M380 132 L320 178"/>
<rect class="d-box d-hot" x="230" y="18" width="60" height="34"/>
<rect class="d-box" x="110" y="98" width="60" height="34"/>
<rect class="d-box d-hot" x="350" y="98" width="60" height="34"/>
<rect class="d-box" x="50" y="178" width="60" height="34"/>
<rect class="d-box" x="170" y="178" width="60" height="34"/>
<rect class="d-box d-hot" x="290" y="178" width="60" height="34"/>
<rect class="d-box" x="410" y="178" width="60" height="34"/>
<text x="260" y="40">50</text>
<text x="140" y="120">30</text>
<text x="380" y="120">70</text>
<text x="80" y="200">20</text>
<text x="200" y="200">40</text>
<text x="320" y="200">60</text>
<text x="440" y="200">80</text>
</svg>
<figcaption>A binary search tree of height 3. To find 60, start at the root: 60 is bigger than 50, so go right; smaller than 70, so go left; found after three nodes.</figcaption>
</figure>

The rule turns every node into a signpost. To find a value, you start at the root and compare: smaller, go left; bigger, go right. Each step throws away a whole subtree. It works like asking for directions in a building: "lower floors to the left, upper floors to the right", and then the same question again on the next landing.

A search visits at most one node per level, so it costs as many steps as the height of the tree. A **balanced tree**, where the left and right subtrees have about the same height at every node, has a height of about log n: a million values fit in about 20 levels. But the tree takes its shape from the order of the inserts. If you insert values that are already sorted, every new value goes to the right of the last one, and the "tree" becomes one long chain, like a linked list: a search is then O(n). Real databases use trees that rebalance themselves to avoid this.

## Try it

```bash
mkdir -p ~/algo
cd ~/algo
```

### 1. Write the tree

Create `bst.py`. A node has a value and two references, `left` and `right`:

```python title="bst.py"
class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None


def insert(root, value):
    """Add value to the tree and return the root."""
    new = Node(value)
    if root is None:
        return new
    current = root
    while True:
        if value < current.value:
            if current.left is None:
                current.left = new
                return root
            current = current.left
        else:
            if current.right is None:
                current.right = new
                return root
            current = current.right


def search(root, value):
    """Return (found, number of nodes visited)."""
    steps = 0
    current = root
    while current is not None:
        steps += 1
        if value == current.value:
            return True, steps
        if value < current.value:
            current = current.left
        else:
            current = current.right
    return False, steps


def height(node):
    if node is None:
        return 0
    return 1 + max(height(node.left), height(node.right))


def in_order(node, out):
    if node is not None:
        in_order(node.left, out)
        out.append(node.value)
        in_order(node.right, out)
    return out


def pre_order(node, out):
    if node is not None:
        out.append(node.value)
        pre_order(node.left, out)
        pre_order(node.right, out)
    return out


def post_order(node, out):
    if node is not None:
        post_order(node.left, out)
        post_order(node.right, out)
        out.append(node.value)
    return out
```

`insert` and `search` walk down with a loop, turning left or right at each node, exactly like the signpost idea. `insert` walks until it finds an empty spot (`None`) and hangs the new node there. `height` is recursive, as in lesson 4.6: an empty tree has height 0 (the base case), and any other tree is one level more than its taller side. The three `_order` functions are explained in step 3.

### 2. Build the tree from the diagram and search it

Create `tree_demo.py`:

```python title="tree_demo.py"
from bst import insert, search, height

root = None
for value in [50, 30, 70, 20, 40, 60, 80]:
    root = insert(root, value)

print("root:", root.value, "| left:", root.left.value, "| right:", root.right.value)
print("height:", height(root))
for target in [60, 20, 50, 65]:
    found, steps = search(root, target)
    print(f"search {target}: found={found}, visited {steps} nodes")
```

```bash
python3 tree_demo.py
```

```output
root: 50 | left: 30 | right: 70
height: 3
search 60: found=True, visited 3 nodes
search 20: found=True, visited 3 nodes
search 50: found=True, visited 1 nodes
search 65: found=False, visited 3 nodes
```

The first value, 50, became the root, and the others found their places by the rule: you get the tree in the diagram. Finding 60 took three nodes, as in the caption. Looking for 65 also stops after three: at 60 it should go right, finds `None`, and knows that 65 is not in the tree without looking anywhere else. Seven values, never more than three steps.

### 3. Walk the tree in three orders

A **traversal** visits every node of a tree once. For a binary tree, the three classic ones differ only in when a node is handled compared with its two subtrees:

| Traversal | Order at each node | Typical use |
|---|---|---|
| in-order | left subtree, the node, right subtree | a BST gives its values in sorted order |
| pre-order | the node, left subtree, right subtree | copy or print a tree, parent before children |
| post-order | left subtree, right subtree, the node | delete a tree or add up sizes, children before parent |

```python
from bst import insert, in_order, pre_order, post_order

root = None
for value in [50, 30, 70, 20, 40, 60, 80]:
    root = insert(root, value)

print("in-order:  ", in_order(root, []))
print("pre-order: ", pre_order(root, []))
print("post-order:", post_order(root, []))
```

```output
in-order:   [20, 30, 40, 50, 60, 70, 80]
pre-order:  [50, 30, 20, 40, 70, 60, 80]
post-order: [20, 40, 30, 60, 80, 70, 50]
```

In-order gives the values sorted, for free: everything smaller sits to the left of each node and is listed first. Pre-order starts with the root, so the output could rebuild the exact same tree if you inserted the values in that order. Post-order ends with the root, because each node waits for both of its children. That is the order `du`, the Linux command that shows how much disk space folders use, follows to add up folder sizes: it needs the size of every subfolder before it can give the size of the folder. Each function passes the same list `out` down the recursion and appends to it, and `[]` gives it a fresh empty list to start with.

### 4. See what the insert order does to the shape

Create `shape.py`. It inserts the numbers 0 to 499 twice: once shuffled, once in sorted order:

```python title="shape.py"
import random
from bst import insert, search, height

n = 500
numbers = list(range(n))
shuffled = numbers.copy()
random.seed(4)
random.shuffle(shuffled)

for name, order in [("shuffled", shuffled), ("sorted", numbers)]:
    root = None
    for value in order:
        root = insert(root, value)
    found, steps = search(root, n - 1)
    print(f"{name:8}: height {height(root):3}, finding {n - 1} visits {steps:3} nodes")
```

```bash
python3 shape.py
```

```output
shuffled: height  22, finding 499 visits   6 nodes
sorted  : height 500, finding 499 visits 500 nodes
```

`random.shuffle` mixes the list in place, and `random.seed(4)` makes the "random" order the same on every run, so your output should match. The shuffled tree is bushy: 500 values in 22 levels. That is more than the best possible 9, but finding 499 took only 6 steps. The sorted inserts built a chain where every node has only a right child, so the height equals the number of values, and the search walks through all 500 nodes like a linked list. Same values, same code, completely different speed. Only the order of the inserts changed.

## Exercise

Add two functions to `bst.py`:

1. `smallest(root)`: returns the smallest value in the tree. Hint: where must the smallest value be in a BST?
2. `count_leaves(node)`: returns the number of leaves, using recursion.

Test them on the tree of step 2. Expected: the smallest value is 20, and there are 4 leaves.

<details>
<summary>Show the solution</summary>

<!-- lab: run
cd ~/algo
cat >> bst.py <<'EOF'


def smallest(root):
    current = root
    while current.left is not None:
        current = current.left
    return current.value


def count_leaves(node):
    if node is None:
        return 0
    if node.left is None and node.right is None:
        return 1
    return count_leaves(node.left) + count_leaves(node.right)
EOF
-->

Add to `bst.py`:

```python
def smallest(root):
    current = root
    while current.left is not None:
        current = current.left
    return current.value


def count_leaves(node):
    if node is None:
        return 0
    if node.left is None and node.right is None:
        return 1
    return count_leaves(node.left) + count_leaves(node.right)
```

And test them:

```python title="test_tree.py"
from bst import insert, smallest, count_leaves

root = None
for value in [50, 30, 70, 20, 40, 60, 80]:
    root = insert(root, value)
print("smallest:", smallest(root))
print("leaves:", count_leaves(root))
```

```bash
python3 test_tree.py
```

```output
smallest: 20
leaves: 4
```

In a BST, everything smaller than a node is on its left, so the smallest value is found by going left until there is no left child. That costs as many steps as the height of the tree, and it needs no comparisons at all. `count_leaves` has two base cases: an empty tree has no leaves, and a node without children is one leaf. Any other node has as many leaves as its two subtrees together. The 4 leaves are 20, 40, 60 and 80. Calling `smallest` on an empty tree would crash on `current.left`; a careful version would check `if root is None` first.

</details>

## Check yourself

**1. In the tree of the diagram, which nodes are leaves, and what is the parent of 40?**

<details>
<summary>Answer</summary>

The leaves are 20, 40, 60 and 80: they have no children. The parent of 40 is 30.

</details>

**2. What rule makes a binary tree a binary search tree?**

<details>
<summary>Answer</summary>

At every node, all values in the left subtree are smaller than the node, and all values in the right subtree are bigger or equal.

</details>

**3. Why is searching a balanced BST of a million values fast?**

<details>
<summary>Answer</summary>

Each comparison sends the search left or right and throws away a whole subtree, so it visits one node per level. A balanced tree of a million values has only about 20 levels, so a search takes about 20 steps: O(log n).

</details>

**4. What happens if you insert 1, 2, 3, 4, 5 in that order into an empty BST?**

<details>
<summary>Answer</summary>

Each value is bigger than all the others, so it goes to the right of the last one. The tree becomes a chain of height 5, like a linked list, and searching it is O(n).

</details>

**5. Which traversal of a BST lists its values in sorted order?**

<details>
<summary>Answer</summary>

In-order: left subtree, then the node, then the right subtree.

</details>

## Common mistakes

- **Mixing up left and right.** Smaller goes left, bigger goes right, at every node. Swapping them in one function but not in the other means searches never find what inserts stored.
- **Comparing only with the parent.** The BST rule holds for whole subtrees, not just for direct children. A value inserted with the `insert` function always respects it; a tree built by hand may not.
- **Forgetting the empty tree.** A recursive tree function needs a base case for `None`, or it crashes with `AttributeError` on the first missing child.
- **Inserting sorted data and expecting speed.** A plain BST is only fast when it is roughly balanced. Data that arrives sorted, such as timestamps, builds a chain. Real systems use self-balancing trees.
- **Recursing down a very deep tree.** A chain of 2,000 nodes makes `height` hit Python's recursion limit. Balanced trees stay shallow; deep ones need a loop instead.

## Key terms

- **Tree**: nodes connected so that there is one root at the top and every other node has exactly one parent.
- **Root**: the top node of a tree, the only node without a parent.
- **Parent**: the node directly above a node in a tree.
- **Child**: a node directly below another node in a tree.
- **Leaf**: a node with no children.
- **Height**: the number of nodes on the longest path from the root down to a leaf.
- **Binary tree**: a tree where every node has at most two children, left and right.
- **Binary search tree**: a binary tree where, at every node, smaller values are in the left subtree and bigger ones in the right.
- **Subtree**: a node of a tree together with everything below it.
- **Balanced tree**: a tree whose left and right subtrees have about the same height at every node, so its height stays about log n.
- **Traversal**: a way to visit every node of a tree or graph once, such as in-order, pre-order or post-order.

## Go further

- [Python documentation: bisect](https://docs.python.org/3/library/bisect.html): Python's standard tool for keeping a list sorted and searching it, a simpler alternative to a hand-made BST.
- [SQLite: Query planning](https://www.sqlite.org/queryplanner.html): how SQLite, the database of Module 7, uses trees for its tables and indexes.
- [Python documentation: random](https://docs.python.org/3/library/random.html): `shuffle`, `seed` and the other functions used in step 4.
