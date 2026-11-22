---
title: Lists, dictionaries and sets
description: Store many values in one variable with lists, dictionaries and sets, and choose the right one for each job.
lesson: "3.4"
time: 25 min
sidebar:
  order: 4
---

How would you store the 300 IP addresses that visited your server today? Three hundred variables called `ip1`, `ip2`, `ip3` would be absurd, and you could not even loop over them. Python gives you containers instead: one variable that holds many values. This lesson covers the three you will use every day, and the questions that tell you which one to pick.

## Goal

After this lesson you can:

- Store values in order with a list, and add, read and sort them.
- Look values up by name with a dictionary, and count things with it.
- Keep only unique values with a set, and choose between the three.

## Why it matters

Security and system work is mostly about collections: the lines of a log, the users on a machine, the open ports on a server, the IP addresses that failed to log in. Questions like "which IP failed most often?" or "which users are not on the allowed list?" take one or two lines once the data sits in the right container. In the wrong container, the same question takes a page of code or becomes very slow.

## The idea

A **list** holds values in order, in square brackets: `["sam", "alex", "kim"]`. Each value is an **item**, and every item has an index, counted from 0 as with strings. A list is like a numbered row of lockers: you find things by their number, and the same thing can be in two lockers.

A **dictionary**, or dict, holds pairs in curly braces: `{"ssh": 22, "http": 80}`. The part before the colon is the **key**, the part after is its **value**. You look a value up by its key, as you look up a word in a real dictionary to find its meaning. Each key appears only once.

A **set** holds unique values in curly braces, with no order: `{22, 80, 443}`. If you add a value that is already there, nothing changes. Think of a guest list at a door: a name is on it or not, and writing it twice does not let the person in twice.

| Container | Looks like | Ordered | Duplicates | Best for |
|---|---|---|---|---|
| list | `[22, 80, 22]` | yes | allowed | items in order, by position |
| dict | `{"ssh": 22}` | yes, in the order added | keys are unique | looking up a value by a key, counting |
| set | `{22, 80}` | no | never | unique values, "is it in there?" |

Lists, dicts and sets can be changed after you create them: you add, remove and replace items. That is different from strings, which never change in place.

## Try it

### 1. Make a list and read from it

```bash
mkdir -p ~/pylab/data
cd ~/pylab/data
```

```python
users = ["sam", "alex", "kim", "root"]
print(users)
print(users[0], users[-1])
print(users[1:3])
print(len(users))
print("root" in users)
```

```output
['sam', 'alex', 'kim', 'root']
sam root
['alex', 'kim']
4
True
```

Indexes and slices work exactly as they did on strings in lesson 3.1. `users[1:3]` takes the items from index 1 up to, but not including, index 3. `in` checks whether an item is in the list.

### 2. Change a list

```python
ports = [80, 443]
ports.append(22)
print(ports)
ports.remove(80)
print(ports)
ports[0] = 8443
print(ports)
print(sorted(ports))
print(ports)
```

```output
[80, 443, 22]
[443, 22]
[8443, 22]
[22, 8443]
[8443, 22]
```

`append` adds an item at the end and `remove` deletes the first item with that value. Assigning to an index replaces an item. All three change the list itself. `sorted` is different: it returns a new, sorted list and leaves the original as it was, which is what the last line shows.

### 3. Split a line into a list

```python
line = "10.0.0.5 GET /login 401"
parts = line.split()
print(parts)
ip = parts[0]
status = int(parts[3])
print(ip, status, status >= 400)
print(" | ".join(parts))
print("a,b,,c".split(","))
```

```output
['10.0.0.5', 'GET', '/login', '401']
10.0.0.5 401 True
10.0.0.5 | GET | /login | 401
['a', 'b', '', 'c']
```

`split()` with no argument cuts a string at every run of spaces (tabs and newlines count as spaces here) and returns a list of the pieces. This is how you take a log line apart, and you will do it in the project step. `split(",")` cuts at each comma instead, and keeps empty pieces. `join` goes the other way: it glues the items of a list into one string, with the string before the dot between them.

### 4. Loop over a list

```python
sizes = [120, 4300, 512, 90, 2048]
total = 0
for size in sizes:
    total += size
print("total:", total, "same as", sum(sizes))
print("biggest:", max(sizes), "smallest:", min(sizes))
print("largest two:", sorted(sizes, reverse=True)[:2])
```

```output
total: 7070 same as 7070
biggest: 4300 smallest: 90
largest two: [4300, 2048]
```

A `for` loop over a list gives you each item in turn. `sum`, `max` and `min` do the common jobs in one call. `sorted(..., reverse=True)` sorts from big to small, and `[:2]` keeps the first two.

### 5. Look things up in a dictionary

```python
services = {"ssh": 22, "http": 80, "https": 443}
print(services["ssh"])
services["dns"] = 53
services["http"] = 8080
print(services)
print("ftp" in services)
print(services.get("ftp"))
print(services.get("ftp", "unknown"))
```

```output
22
{'ssh': 22, 'http': 8080, 'https': 443, 'dns': 53}
False
None
unknown
```

`services["ssh"]` looks up the value of the key `"ssh"`. Assigning to a key adds the pair if the key is new, or replaces the value if it exists. `in` checks the keys. Asking for a missing key with square brackets stops the program with a `KeyError`, so when a key may be missing, use `get`: it returns `None`, or the default value you give as the second argument.

```python
services = {"ssh": 22, "http": 80, "https": 443}
for name, port in services.items():
    print(f"{name:6} {port}")
```

```output
ssh    22
http   80
https  443
```

`items()` gives each key with its value, and the `for` line unpacks the pair into two variables. Each pair is a **tuple**: a small fixed group of values, written in parentheses, such as `("ssh", 22)`. A tuple is like a list that cannot change. The `:6` in the f-string pads the name to 6 characters, so the numbers line up.

### 6. Count with a dictionary

This is the most useful pattern of the lesson.

```python title="count.py"
visits = ["10.0.0.5", "10.0.0.7", "10.0.0.5", "10.0.0.9", "10.0.0.5", "10.0.0.7"]

counts = {}
for ip in visits:
    counts[ip] = counts.get(ip, 0) + 1

print(counts)
for ip in sorted(counts, key=counts.get, reverse=True):
    print(ip, counts[ip])
```

```bash
python3 count.py
```

```output
{'10.0.0.5': 3, '10.0.0.7': 2, '10.0.0.9': 1}
10.0.0.5 3
10.0.0.7 2
10.0.0.9 1
```

For each IP, `counts.get(ip, 0)` gives the count so far, or 0 the first time, and the line stores that number plus one. After the loop, the dict holds one key per IP and the number of visits as its value.

The `sorted` line sorts the keys by their counts. `key=counts.get` tells `sorted` to compare the keys not by themselves, but by what `counts.get` returns for each one, so the IP with the most visits comes first. Notice that `counts.get` has no parentheses here: you hand the function itself to `sorted`, and `sorted` calls it for every key.

### 7. Keep unique values with a set

```python
visits = ["10.0.0.5", "10.0.0.7", "10.0.0.5", "10.0.0.9", "10.0.0.5"]
unique = set(visits)
print(len(visits), "visits from", len(unique), "addresses")
print(sorted(unique))

allowed = {"10.0.0.5", "10.0.0.7"}
print(sorted(unique - allowed))
print(sorted(unique & allowed))
unique.add("10.0.0.5")
print(len(unique))
```

```output
5 visits from 3 addresses
['10.0.0.5', '10.0.0.7', '10.0.0.9']
['10.0.0.9']
['10.0.0.5', '10.0.0.7']
3
```

`set(visits)` drops the duplicates. A set has no order, so printing it directly can show the items in a different order on each run; `sorted` gives a stable list. `-` keeps what is in the first set but not in the second, here the visitor who is not allowed. `&` keeps what is in both. Adding a value that is already there changes nothing, so the size stays 3.

:::tip[Which one do I need?]
Ask three questions. Do I need the items in order, or by position? Use a list. Do I need to find something by a name or count things? Use a dict. Do I only care whether something is there, with no duplicates? Use a set.
:::

## Exercise

In `~/pylab/data`, write `statuses.py`. Start with this list:

```python title="statuses.py"
lines = [
    "10.0.0.5 GET /login 401",
    "10.0.0.7 GET / 200",
    "10.0.0.5 POST /login 401",
    "10.0.0.9 GET /admin 403",
    "10.0.0.7 GET /about 200",
    "10.0.0.5 POST /login 200",
]
```

Add code that:

1. Counts how many lines have each status code, with a dict, and prints each code with its count.
2. Prints how many different IP addresses appear, with a set.
3. Prints the sorted list of IPs that got at least one status of 400 or more.

<details>
<summary>Show the solution</summary>

```python title="statuses.py"
lines = [
    "10.0.0.5 GET /login 401",
    "10.0.0.7 GET / 200",
    "10.0.0.5 POST /login 401",
    "10.0.0.9 GET /admin 403",
    "10.0.0.7 GET /about 200",
    "10.0.0.5 POST /login 200",
]

codes = {}
ips = set()
bad_ips = set()

for line in lines:
    parts = line.split()
    ip = parts[0]
    status = parts[3]
    codes[status] = codes.get(status, 0) + 1
    ips.add(ip)
    if int(status) >= 400:
        bad_ips.add(ip)

for status, count in codes.items():
    print(status, count)
print("different IPs:", len(ips))
print("IPs with errors:", sorted(bad_ips))
```

```bash
python3 statuses.py
```

```output
401 2
200 3
403 1
different IPs: 3
IPs with errors: ['10.0.0.5', '10.0.0.9']
```

One loop does all three jobs. The codes are kept as strings for the dict keys, and converted with `int` only for the comparison. You could also use two separate loops: that is slower to write but just as correct. A set for `bad_ips` matters: `10.0.0.5` had two errors but appears only once.

</details>

## Check yourself

**1. You want the list of users in the order they signed up, and the same name can appear twice. List, dict or set?**

<details>
<summary>Answer</summary>

A list: it keeps the order and allows duplicates.

</details>

**2. What is the difference between `services["ftp"]` and `services.get("ftp")` when `"ftp"` is not a key?**

<details>
<summary>Answer</summary>

`services["ftp"]` stops the program with a `KeyError`. `services.get("ftp")` returns `None`, or the default you pass as a second argument.

</details>

**3. What does `"GET /index.html 200".split()` return?**

<details>
<summary>Answer</summary>

The list `['GET', '/index.html', '200']`. Note that `'200'` is still a string.

</details>

**4. After `ports = [443, 22]` and `sorted(ports)`, what is in `ports`?**

<details>
<summary>Answer</summary>

Still `[443, 22]`. `sorted` returns a new list and does not change the original. To sort the list itself, use `ports.sort()`, or store the result: `ports = sorted(ports)`.

</details>

**5. How do you find which items of the set `seen` are not in the set `allowed`?**

<details>
<summary>Answer</summary>

`seen - allowed`. It returns a new set with the items that are in `seen` but not in `allowed`.

</details>

## Common mistakes

- **Counting from 1.** The first item is `items[0]`, and `items[len(items)]` is one past the end, which gives `IndexError: list index out of range`. The last item is `items[-1]`.
- **`KeyError` on a missing key.** Check with `in` first, or use `get` with a default.
- **Expecting `sorted` to change the list.** It returns a new list. Store the result or use the list's own `sort()` method.
- **Writing `{}` for an empty set.** `{}` is an empty dict. An empty set is `set()`.
- **Printing a set and expecting an order.** Sets have no order. Use `sorted(my_set)` when you print, so the output is the same every time.

## Key terms

- **List**: an ordered, changeable collection of items in square brackets, such as `[22, 80]`.
- **Item**: one value inside a list, set or other collection.
- **Dictionary** (dict): a collection of key and value pairs in curly braces, such as `{"ssh": 22}`. You look values up by key.
- **Key**: the part of a dictionary pair you look up by. Each key appears only once.
- **Value** (in a dictionary): the part of a pair that a key points to.
- **Set**: an unordered collection of unique values, such as `{22, 80}`.
- **Tuple**: a small fixed group of values in parentheses, such as `("ssh", 22)`. It cannot be changed.

## Go further

- [Data Structures](https://docs.python.org/3/tutorial/datastructures.html): the official tutorial on lists, tuples, sets and dictionaries, with more methods for each.
- [Sorting Techniques](https://docs.python.org/3/howto/sorting.html): everything `sorted` and `key=` can do, from the Python documentation.
