---
title: Hash maps
description: Find out why looking up a key in a Python dict or set is fast whatever its size, build a small hash map by hand, and see what a collision is.
lesson: "4.4"
time: 20 min
sidebar:
  order: 4
---

How does a Python dict with a million keys find one of them without looking at the other 999,999? It does not search at all. It computes where the key must be, goes there, and checks. That trick is called hashing. It powers dicts, sets, databases and caches, and a stronger kind of hashing protects the stored passwords you will meet in Module 10.

## Goal

After this lesson you can:

- Explain how a hash map turns a key into a position, and why a lookup is O(1) on average.
- Say what a collision is and how a hash map deals with it.
- Pick a `set` or a `dict` instead of a list when your code checks "is this item in there?"

## Why it matters

In lesson 4.1, `x in my_list` was a hidden loop that made code O(n²). Replacing that list with a set is often the single biggest speed-up you can make in a script, and it takes one line. Hashing also shows up all over security: a log analyzer counting IP addresses, a blocklist of known bad domains, and even an attack where someone sends keys chosen to collide on purpose to slow a server down.

## The idea

A **hash map** (also called a hash table) stores pairs of a **key** and a **value**, like a Python dict. Inside, it is an array of slots called **buckets**. To store or find a key, it does three things:

1. It runs the key through a **hash function**: a function that turns any key into a whole number, always the same number for the same key. That number is the key's **hash**.
2. It turns the hash into a bucket index, usually with the remainder of a division: `hash % number_of_buckets`.
3. It goes straight to that bucket, as an array can in O(1), and stores or reads the pair there.

Think of a cloakroom with 100 numbered hooks. You do not hang your coat on any free hook and then search them all later. A rule says: "your hook is the last two digits of your ticket number". To get your coat back, the attendant goes straight to that hook. The rule is the hash function, the hooks are the buckets.

Two different keys can end up in the same bucket. That is a **collision**, and it is normal: there are far more possible keys than buckets. A simple way to handle it is to keep a short list in each bucket, which is called **chaining**. A lookup then goes to the right bucket and checks the few pairs in it. As long as the hash function spreads keys evenly and the map grows when it gets full, each bucket holds only a few pairs, so a lookup stays O(1) on average. Python's dict uses a different method for collisions (it tries another slot), but the idea is the same.

| Question | List | Set or dict |
|---|---|---|
| Is `x` in there? | O(n): checks items one by one | O(1) on average: computes the bucket |
| Keeps the order you added? | yes | a dict yes, a set no |
| Can hold any item? | yes | set items and dict keys must be hashable: no lists, no dicts (dict values can be anything) |

## Try it

```bash
mkdir -p ~/algo
cd ~/algo
```

### 1. Measure a lookup in a list, a set and a dict

<!-- lab: nocheck -->
```python
import timeit

n = 1_000_000
as_list = list(range(n))
as_set = set(as_list)
as_dict = dict.fromkeys(as_list, 0)

for name in ["as_list", "as_set", "as_dict"]:
    t = timeit.timeit(f"{n - 1} in {name}", globals=globals(), number=100)
    print(f"{name:8} 100 lookups: {t:.5f} s")
```

```output
as_list  100 lookups: 17.66513 s
as_set   100 lookups: 0.00027 s
as_dict  100 lookups: 0.00032 s
```

Each line looks for the last number, a hundred times. The list checks a million items on every lookup. The set and the dict compute one bucket and look there. On the test machine of this course that is tens of thousands of times faster, and the gap grows with n. `dict.fromkeys(as_list, 0)` builds a dict with every number as a key and `0` as every value.

### 2. Write a toy hash function

Create `toyhash.py`. This hash function adds up the character codes of a text (`ord` gives the number behind each character; Module 5 explains these numbers):

```python title="toyhash.py"
def toy_hash(text):
    total = 0
    for ch in text:
        total += ord(ch)
    return total

BUCKETS = 8
for word in ["cat", "dog", "ssh", "rdp", "root", "smtp", "listen", "silent"]:
    h = toy_hash(word)
    print(f"{word:7} hash {h:4}  bucket {h % BUCKETS}")
```

```bash
python3 toyhash.py
```

```output
cat     hash  312  bucket 0
dog     hash  314  bucket 2
ssh     hash  334  bucket 6
rdp     hash  326  bucket 6
root    hash  452  bucket 4
smtp    hash  452  bucket 4
listen  hash  655  bucket 7
silent  hash  655  bucket 7
```

The same word always gives the same hash, so it always lands in the same bucket. Now look for collisions. `ssh` and `rdp` have different hashes, but 334 and 326 leave the same remainder when divided by 8, so they share bucket 6. `root` and `smtp` are different letters that happen to add up to the same total. `listen` and `silent` use the same letters, and adding up does not care about order. This hash function is poor on purpose. Real ones mix the bits of every character, so that a small change in the key gives a very different number.

### 3. Build a hash map by hand

Create `toymap.py`, a tiny hash map with chaining. Each bucket is a list of `[key, value]` pairs:

```python title="toymap.py"
def toy_hash(text):
    total = 0
    for ch in text:
        total += ord(ch)
    return total

class ToyMap:
    def __init__(self, size=8):
        self.buckets = []
        for i in range(size):
            self.buckets.append([])

    def _bucket(self, key):
        return self.buckets[toy_hash(key) % len(self.buckets)]

    def put(self, key, value):
        bucket = self._bucket(key)
        for pair in bucket:
            if pair[0] == key:
                pair[1] = value
                return
        bucket.append([key, value])

    def get(self, key):
        for pair in self._bucket(key):
            if pair[0] == key:
                return pair[1]
        raise KeyError(key)

ports = ToyMap()
ports.put("ssh", 22)
ports.put("http", 80)
ports.put("https", 443)
ports.put("rdp", 3389)
ports.put("smtp", 25)
ports.put("telnet", 23)
ports.put("http", 8080)

for i, bucket in enumerate(ports.buckets):
    print(i, bucket)
print("rdp  ->", ports.get("rdp"))
print("http ->", ports.get("http"))
```

```bash
python3 toymap.py
```

```output
0 [['http', 8080]]
1 []
2 []
3 [['https', 443]]
4 [['smtp', 25], ['telnet', 23]]
5 []
6 [['ssh', 22], ['rdp', 3389]]
7 []
rdp  -> 3389
http -> 8080
```

`put` and `get` both go straight to one bucket, computed from the key by `_bucket`. Inside that bucket they compare keys one by one, which is cheap because a bucket holds only a few pairs. Bucket 6 holds two pairs because `ssh` and `rdp` collide, and bucket 4 holds two for `smtp` and `telnet`. Storing `http` a second time did not add a pair: `put` found the key and replaced its value, which is exactly what a dict does with `ports["http"] = 8080`. `enumerate` gives each bucket together with its number.

A real hash map adds one more rule: when the number of pairs gets close to the number of buckets, it creates a bigger array and moves every pair into it, much as a list grows in lesson 4.2. That keeps the buckets short however many keys you store.

### 4. Look at Python's own hash

```bash
python3 -c 'print(hash(42), hash(-1))'
```

```output
42 -2
```

`hash` is the built-in hash function that dicts and sets use. For a small whole number, the hash is the number itself. (`-1` is a special case inside Python, so it gets `-2`.) Now hash a string, in two separate runs:

<!-- lab: nocheck -->
```bash
python3 -c 'print(hash("cat"))'
python3 -c 'print(hash("cat"))'
```

```output
-4590586446977561044
-6719658624216513932
```

Two different numbers for the same word, and your numbers will be different again. Inside one run of Python, `"cat"` always has the same hash, which is all a dict needs. But each new run picks a random secret that changes the hash of every string. This is a security feature. If attackers could predict the hashes, they could send a web server thousands of keys that all land in the same bucket, and every lookup would turn into a slow search through one long chain. Randomizing the hash makes that attack, called **hash flooding**, much harder.

### 5. Use only hashable keys

```python
blocked = {}
try:
    blocked[["203.0.113.80", 443]] = "scanner"
except TypeError as error:
    print("error:", error)

blocked[("203.0.113.80", 443)] = "scanner"
print(blocked)
```

```output
error: unhashable type: 'list'
{('203.0.113.80', 443): 'scanner'}
```

A key's hash must never change, or the map would look for it in the wrong bucket. A list can change after you create it, so Python refuses it as a key. A tuple cannot change, so it is **hashable** and works. The same rule holds for the items of a set.

## Exercise

Lesson 4.1 had a quadratic `has_duplicates` that compared every pair of items. Write `has_duplicates_fast(numbers)` that uses a set and is O(n). Time both functions on `list(range(n))` for n = 2,000, and the fast one also for n = 1,000,000.

Hint: walk through the list once and remember what you have already seen.

<details>
<summary>Show the solution</summary>

```python title="dupes.py"
import time

def has_duplicates(numbers):
    for i in range(len(numbers)):
        for j in range(i + 1, len(numbers)):
            if numbers[i] == numbers[j]:
                return True
    return False

def has_duplicates_fast(numbers):
    seen = set()
    for x in numbers:
        if x in seen:
            return True
        seen.add(x)
    return False

def measure(func, n):
    numbers = list(range(n))
    start = time.perf_counter()
    result = func(numbers)
    return result, time.perf_counter() - start

for func, n in [(has_duplicates, 2_000), (has_duplicates_fast, 2_000),
                (has_duplicates_fast, 1_000_000)]:
    result, seconds = measure(func, n)
    print(f"{func.__name__:20} n={n:>9,}: {result} {seconds:.4f} s")
print(has_duplicates_fast([5, 3, 8, 3]))
```

<!-- lab: nocheck -->
```bash
python3 dupes.py
```

```output
has_duplicates       n=    2,000: False 2.5884 s
has_duplicates_fast  n=    2,000: False 0.0070 s
has_duplicates_fast  n=1,000,000: False 1.5555 s
True
```

Each `x in seen` and each `seen.add(x)` is O(1) on average, and the loop runs n times, so the whole function is O(n). The fast version handles a million numbers in less time than the slow one needs for two thousand. The price is memory: the set keeps every number it has seen. Trading memory for speed like this is one of the most common moves in programming. `func.__name__` is the name of a function as a string, handy for labels.

</details>

## Check yourself

**1. What are the three steps a hash map takes to find a key?**

<details>
<summary>Answer</summary>

It computes the hash of the key, turns the hash into a bucket index (for example with `% number_of_buckets`), and then looks only inside that bucket, comparing the few keys stored there.

</details>

**2. What is a collision, and is it a bug?**

<details>
<summary>Answer</summary>

Two different keys that land in the same bucket. It is not a bug: there are many more possible keys than buckets, so collisions always happen. The map handles them, for example by keeping a short list in each bucket (chaining).

</details>

**3. When can a dict lookup stop being O(1)?**

<details>
<summary>Answer</summary>

When many keys end up in the same bucket, because then a lookup has to search through a long chain. That happens with a bad hash function, or when someone chooses colliding keys on purpose (hash flooding). Good hash functions, random hash secrets and resizing keep buckets short.

</details>

**4. Why does `{[1, 2]: "x"}` fail, while `{(1, 2): "x"}` works?**

<details>
<summary>Answer</summary>

A key's hash must never change. A list can be changed after it is created, so it is unhashable. A tuple cannot be changed, so it can be a key.

</details>

**5. Your script checks 100,000 times whether an IP address is in a list of 10,000 blocked addresses. What one change makes it much faster?**

<details>
<summary>Answer</summary>

Turn the list into a set once, before the loop: `blocked = set(blocked_list)`. Each check becomes O(1) on average instead of O(n).

</details>

## Common mistakes

- **Checking membership in a list inside a loop.** `if x in big_list:` in a loop is the hidden O(n²) from lesson 4.1. Build a set once, outside the loop, and check against it.
- **Building the set inside the loop.** `if x in set(big_list):` creates a new set on every pass, which is O(n) each time and even slower than the list. Create it once.
- **Expecting a set to keep order.** A set gives its items back in an order that depends on their hashes. If you need the order you added them in, use a dict (it keeps insertion order) or a separate list.
- **Using a list as a key.** It raises `TypeError: unhashable type: 'list'`. Use a tuple instead.
- **Saving `hash()` of a string to compare it in a later run.** String hashes change between runs of Python. For a stable fingerprint of data, use the `hashlib` module, which Module 10 covers.

## Key terms

- **Hash map**: a structure that stores key and value pairs in an array of buckets and finds a key by computing its bucket from its hash. Also called a hash table. A Python dict is one.
- **Bucket**: one slot of the array inside a hash map.
- **Hash function**: a function that turns a key into a whole number, always the same number for the same key.
- **Hash**: the number a hash function gives for a key.
- **Collision**: two different keys that land in the same bucket.
- **Chaining**: handling collisions by keeping a small list of pairs in each bucket.
- **Hashable**: an object whose hash never changes, so it can be a dict key or a set item. Numbers, strings and tuples of them are hashable; lists and dicts are not.
- **Hash flooding**: an attack that sends many keys chosen to collide, so that a server's hash map becomes slow.

## Go further

- [Python documentation: Mapping types, dict](https://docs.python.org/3/library/stdtypes.html#typesmapping): everything a dict can do, and the rules for keys.
- [Python glossary: hashable](https://docs.python.org/3/glossary.html#term-hashable): the official definition of which objects can be keys.
- [Python documentation: PYTHONHASHSEED](https://docs.python.org/3/using/cmdline.html#envvar-PYTHONHASHSEED): the setting behind the random string hashes in step 4.
