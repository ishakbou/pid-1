---
title: Graphs
description: Model a small network as nodes and edges in Python, then explore it with breadth-first search and depth-first search to find what is reachable and how far away it is.
lesson: "4.8"
time: 25 min
sidebar:
  order: 8
---

An attacker gets control of one laptop in a small office. A defender's first questions are: which other machines can be reached from that laptop, and how many hops away is the server with the customer data? Drawing the office network on paper answers it for seven machines. For seven hundred, you want a program, and that program treats the network as a graph.

## Goal

After this lesson you can:

- Store a graph in Python as an adjacency list: a dict that maps each node to its neighbours.
- Explore a graph with breadth-first search (BFS) and find the shortest path in hops.
- Explore a graph with depth-first search (DFS), and explain why both need a set of visited nodes.

## Why it matters

Graphs are everywhere in computing. A network of machines, the links between web pages, friends on a social network, the dependencies between software packages and the roads in a map app are all graphs. In security, defenders draw graphs of who can reach what to see how far an intruder could move, and tools for Active Directory, which Module 11 introduces, map users, groups and machines the same way. BFS and DFS are the two basic ways to explore any of them.

## The idea

A **graph** is a set of **nodes** (also called vertices) and **edges**, where each edge connects two nodes. Two nodes joined by an edge are **neighbours**. In an **undirected graph**, an edge works in both directions, like a cable between two machines. In a **directed graph**, an edge has a direction, like a link from one web page to another. A tree from lesson 4.7 is a special graph: connected, with no **cycle**, which is a path that leads back to where it started. General graphs can have cycles, and that changes how you explore them.

Here is the office network of this lesson:

<figure class="diagram">
<svg viewBox="0 0 560 250" role="img" aria-labelledby="net-title net-desc">
<title id="net-title">An office network as a graph</title>
<desc id="net-desc">Seven nodes. The router is in the middle and connects to laptop, phone, printer and web. Web connects to db and backup, and db also connects to backup, so web, db and backup form a cycle. The path laptop, router, web, backup is highlighted.</desc>
<path class="d-line" d="M130 57 L220 108 M130 193 L220 142 M390 108 L430 57 M460 57 V193"/>
<path class="d-line d-hot" d="M120 125 H200 M280 125 H340 M390 142 L430 193"/>
<rect class="d-box d-hot" x="40" y="108" width="80" height="34"/>
<rect class="d-box" x="80" y="23" width="80" height="34"/>
<rect class="d-box" x="80" y="193" width="80" height="34"/>
<rect class="d-box d-hot" x="200" y="108" width="80" height="34"/>
<rect class="d-box d-hot" x="340" y="108" width="80" height="34"/>
<rect class="d-box" x="400" y="23" width="80" height="34"/>
<rect class="d-box d-hot" x="400" y="193" width="80" height="34"/>
<text x="80" y="130">laptop</text>
<text x="120" y="45">phone</text>
<text x="120" y="215">printer</text>
<text x="240" y="130">router</text>
<text x="380" y="130">web</text>
<text x="440" y="45">db</text>
<text x="440" y="215">backup</text>
</svg>
<figcaption>Seven nodes and seven edges. web, db and backup form a cycle. The highlighted path is the shortest way from laptop to backup: three hops.</figcaption>
</figure>

The usual way to store a graph in code is an **adjacency list**: for each node, the list of its neighbours. In Python, that is a dict of lists. Each edge of an undirected graph appears twice, once in the list of each end.

To explore a graph from a start node, you keep a collection of nodes that are waiting to be visited:

- **Breadth-first search (BFS)** keeps them in a queue (lesson 4.3). It visits all the neighbours of the start, then all the nodes two hops away, and so on, in rings around the start. So the first time BFS reaches a node, it has found the shortest path to it, in number of edges.
- **Depth-first search (DFS)** keeps them in a stack, or uses recursion, which is the call stack (lesson 4.6). It follows one path as deep as it can, then backs up and tries the next branch, like exploring a maze with one hand always on the wall.

Both keep a set of **visited** nodes. Without it, a search would go around a cycle forever: web, db, backup, web, db, and so on. With a set, checking "have I been here?" is O(1), thanks to lesson 4.4. Each node and each edge is handled once, so both searches are O(V + E), where V is the number of nodes and E the number of edges.

## Try it

```bash
mkdir -p ~/algo
cd ~/algo
```

### 1. Store the network

Create `network.py`:

```python title="network.py"
NETWORK = {
    "laptop":  ["router"],
    "phone":   ["router"],
    "router":  ["laptop", "phone", "web", "printer"],
    "printer": ["router"],
    "web":     ["router", "db", "backup"],
    "db":      ["web", "backup"],
    "backup":  ["web", "db"],
}
```

```python
from network import NETWORK

print("nodes:", len(NETWORK))
edges = 0
for node, neighbours in NETWORK.items():
    edges += len(neighbours)
print("edges:", edges // 2)
print("neighbours of web:", NETWORK["web"])
print("is db next to router?", "db" in NETWORK["router"])
```

```output
nodes: 7
edges: 7
neighbours of web: ['router', 'db', 'backup']
is db next to router? False
```

The lists hold 14 names, but every undirected edge is written twice, so there are 7 edges. Finding the neighbours of a node is one dict lookup. `db` is not a neighbour of `router`: to reach the database from the router, traffic has to go through `web`.

### 2. Explore in rings with BFS

Create `bfs.py`:

```python title="bfs.py"
from collections import deque
from network import NETWORK

def bfs(graph, start):
    hops = {start: 0}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        print(f"visit {node:8} {hops[node]} hops")
        for neighbour in graph[node]:
            if neighbour not in hops:
                hops[neighbour] = hops[node] + 1
                queue.append(neighbour)
    return hops

bfs(NETWORK, "laptop")
```

```bash
python3 bfs.py
```

```output
visit laptop   0 hops
visit router   1 hops
visit phone    2 hops
visit web      2 hops
visit printer  2 hops
visit db       3 hops
visit backup   3 hops
```

This is the folder-walking queue from lesson 4.3, plus one dict. `hops` does two jobs: it stores the distance of each node, and its keys are the set of nodes already seen, so `neighbour not in hops` keeps the search from going around the cycle. The output comes in rings: the start, then everything one hop away, then two, then three. From the compromised laptop, every machine in the office can be reached, and the database is three hops away.

### 3. Find the shortest path

The distances tell you how far, but not which way. To get the path, remember for each node the node you came from:

```python
from collections import deque
from network import NETWORK

def shortest_path(graph, start, goal):
    came_from = {start: None}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        if node == goal:
            break
        for neighbour in graph[node]:
            if neighbour not in came_from:
                came_from[neighbour] = node
                queue.append(neighbour)
    if goal not in came_from:
        return None
    path = []
    node = goal
    while node is not None:
        path.append(node)
        node = came_from[node]
    path.reverse()
    return path

print(shortest_path(NETWORK, "laptop", "backup"))
print(shortest_path(NETWORK, "printer", "db"))
print(shortest_path(NETWORK, "db", "db"))
```

```output
['laptop', 'router', 'web', 'backup']
['printer', 'router', 'web', 'db']
['db']
```

`came_from` records, for each node, its neighbour one ring closer to the start. Once the goal is reached, the function follows those records backwards, from the goal to the start, and then reverses the list, as lesson 4.2 recommended instead of inserting at the front. The highlighted path in the diagram is the first result. If the goal cannot be reached, it never gets into `came_from`, and the function returns `None`.

### 4. Explore deep first with DFS

```python
from network import NETWORK

def dfs(graph, node, visited):
    visited.add(node)
    print("visit", node)
    for neighbour in graph[node]:
        if neighbour not in visited:
            dfs(graph, neighbour, visited)
    return visited

seen = dfs(NETWORK, "laptop", set())
print(len(seen), "nodes reached")
```

```output
visit laptop
visit router
visit phone
visit web
visit db
visit backup
visit printer
7 nodes reached
```

DFS goes as deep as it can before it turns back. From `router` it goes to `phone`, a dead end, then to `web`, and from there to `db` and on to `backup`, before it comes back up to `router` and finally visits `printer`. BFS visited `printer` early; DFS visited it last. Both reach the same nodes, but in a different order, and only BFS gives shortest paths.

The set `visited` is created once, by `set()` in the line that starts the search, and the same set is passed down to every recursive call, so all of them share it. Each call marks its node, then calls itself for every neighbour not seen yet. The recursion is the stack here: when a call returns, Python goes back to the call below, which carries on with its next neighbour. That is the "backing up" of DFS. The function returns the set, and its size shows that all 7 machines were reached.

## Exercise

The defender adds a firewall rule so that the router no longer connects to `web`: in the graph, the edge between `router` and `web` disappears. Write `reachable(graph, start)`, a DFS that uses a `while` loop and a plain list as a stack instead of recursion, and returns the sorted list of nodes it can reach. Then answer with your function: what can the laptop reach now, and what can `web` reach?

Hint: push the start, then pop a node, and push its neighbours that you have not seen yet.

<details>
<summary>Show the solution</summary>

```python title="segment.py"
SEGMENTED = {
    "laptop":  ["router"],
    "phone":   ["router"],
    "router":  ["laptop", "phone", "printer"],
    "printer": ["router"],
    "web":     ["db", "backup"],
    "db":      ["web", "backup"],
    "backup":  ["web", "db"],
}

def reachable(graph, start):
    seen = {start}
    stack = [start]
    while stack:
        node = stack.pop()
        for neighbour in graph[node]:
            if neighbour not in seen:
                seen.add(neighbour)
                stack.append(neighbour)
    return sorted(seen)

print("from laptop:", reachable(SEGMENTED, "laptop"))
print("from web:   ", reachable(SEGMENTED, "web"))
```

```bash
python3 segment.py
```

```output
from laptop: ['laptop', 'phone', 'printer', 'router']
from web:    ['backup', 'db', 'web']
```

The edge is removed from both lists, `router` and `web`, because the graph is undirected. After that, the network falls apart into two separate groups: the office side and the server side. An intruder on the laptop can no longer reach the database at all, which is exactly what the firewall rule was for. Each group is called a **connected component**: nodes that can all reach each other, and none outside. The loop is the same as the BFS of step 2, except that `stack.pop()` takes the newest node instead of the oldest, which turns the search into a DFS. Real networks are less tidy, and Module 11 shows how firewall rules are written and checked on a real machine.

</details>

## Check yourself

**1. In an adjacency list of an undirected graph with 7 edges, how many names are stored in all the neighbour lists together?**

<details>
<summary>Answer</summary>

14. Each undirected edge appears twice: once in the list of each of its two ends.

</details>

**2. Which search finds the shortest path in number of hops, and which data structure does it use?**

<details>
<summary>Answer</summary>

Breadth-first search, with a queue. It visits nodes in rings of growing distance from the start, so the first time it reaches a node, it has found a shortest path to it.

</details>

**3. What happens if a search forgets to keep track of visited nodes in a graph with a cycle?**

<details>
<summary>Answer</summary>

It goes around the cycle forever: web, db, backup, web, and so on. A recursive DFS ends with a `RecursionError`, and a loop-based search never stops. The visited set prevents it.

</details>

**4. Why is the visited collection a set or a dict, and not a list?**

<details>
<summary>Answer</summary>

The search checks "have I seen this node?" for every edge. In a set or dict that check is O(1) on average; in a list it is O(n), which would make the whole search much slower on a big graph.

</details>

**5. What is the difference between a tree and a graph?**

<details>
<summary>Answer</summary>

A tree is a special graph: connected, without cycles, with one root and exactly one parent for every other node. A general graph can have cycles, nodes with many connections, and parts that are not connected at all.

</details>

## Common mistakes

- **Adding an edge in one direction only.** In an undirected graph, `a` must be in the list of `b` and `b` in the list of `a`. If you forget one, searches from one side miss the other.
- **Marking nodes as visited too late in BFS.** Mark a node when you put it in the queue, not when you take it out. Otherwise the same node can be queued many times by different neighbours.
- **Using a list for the visited nodes.** It works on seven nodes and crawls on seven thousand. Use a set, or a dict when you also store distances.
- **Expecting DFS to find shortest paths.** DFS finds a path, not the shortest one. Use BFS when the number of hops matters.
- **Using `list.pop(0)` as the BFS queue.** It shifts the whole list on every step, as in lesson 4.3. Use `collections.deque` and `popleft`.

## Key terms

- **Graph**: a set of nodes and edges, where each edge connects two nodes.
- **Edge**: a connection between two nodes of a graph.
- **Neighbour**: a node joined to another node by an edge.
- **Undirected graph**: a graph whose edges work in both directions.
- **Directed graph**: a graph whose edges go one way, from one node to another.
- **Cycle**: a path through a graph that leads back to where it started.
- **Adjacency list**: a way to store a graph where each node maps to the list of its neighbours. In Python, a dict of lists.
- **Breadth-first search (BFS)**: exploring a graph ring by ring from the start, with a queue. It finds shortest paths in number of edges.
- **Depth-first search (DFS)**: exploring a graph by following one path as deep as possible before backing up, with a stack or recursion.
- **Connected component**: a group of nodes that can all reach each other, and no node outside the group.

## Go further

- [Python documentation: graphlib](https://docs.python.org/3/library/graphlib.html): a standard module that sorts the nodes of a directed graph, for example tasks that depend on other tasks.
- [Python documentation: collections.deque](https://docs.python.org/3/library/collections.html#collections.deque): the queue behind BFS.
- [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/): a terminal game where each level leads to the next, a good place to practise the Linux skills behind network exploration, legally.
