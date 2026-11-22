---
title: Classes and objects (OOP)
description: Group data and the functions that work on it into classes, create objects from them, and learn when a plain function or dict is the better choice.
lesson: "3.7"
time: 20 min
sidebar:
  order: 7
---

Here is something you have been doing since lesson 3.1 without a name for it. When you wrote `host.upper()`, you asked a string to do something with its own data. The string carried both the text and the tools to work on it. In Python every value works like that, and every value is an **object**. In this lesson you make your own kind of object, and you also learn the honest part that many tutorials skip: often you do not need one.

## Goal

After this lesson you can:

- Define a class with `__init__`, attributes and methods, and create objects from it.
- Explain what `self` is.
- Decide when a class helps, and when a function, a dict or a dataclass is enough.

## Why it matters

As a program grows, data and the code that changes it drift apart. You end up with a dict for each user in one place and ten functions that update those dicts in another, and nothing stops someone from changing a user the wrong way. A class keeps the data and the rules for it together. You will also read classes in almost every library you use, such as the web framework Flask in Module 8, so you need to know how they work even when you do not write many.

## The idea

A **class** is a blueprint for a kind of object. It says which data each object holds and what each object can do. An **instance** is one object built from that blueprint. One class `Server` can give you many instances: `web01`, `db01`, `backup`. They all have the same shape, but each one has its own data.

Think of the class as the form "new employee" and the instances as the filled-in forms. The form defines the fields, name and role. Every filled-in copy has its own values, and writing on one copy does not change the others.

Inside an object there are two kinds of things:

- **Attributes**: the data of the object, such as `server.name`. They are variables that belong to one object.
- **Methods**: the functions of the object, such as `server.ping()`. They are defined inside the class and work on the object's own attributes.

This way of building programs from objects is called **object-oriented programming**, or OOP.

```python
class Server:
    def __init__(self, name, ip):
        self.name = name
        self.ip = ip

web = Server("web01", "10.0.0.5")
db = Server("db01", "10.0.0.20")
print(web.name, web.ip)
print(db.name, db.ip)
```

```output
web01 10.0.0.5
db01 10.0.0.20
```

`class Server:` starts the definition. `__init__`, with two underscores on each side, is a special method that Python calls by itself each time you create an instance with `Server(...)`. Its job is to fill in the new object's attributes. Its first parameter, `self`, is the object being built. `self.name = name` means "store the value of the parameter `name` as the attribute `name` of this object".

You never pass `self` yourself. When you write `Server("web01", "10.0.0.5")`, Python creates an empty object and calls `__init__` with that object as `self`, `"web01"` as `name` and `"10.0.0.5"` as `ip`.

## Try it

### 1. See that you already use objects

```bash
mkdir -p ~/pylab/classes
cd ~/pylab/classes
```

```python
name = "sam"
print(type(name))
print(name.upper(), name.startswith("s"))
ports = [22, 80]
ports.append(443)
print(type(ports), ports)
```

```output
<class 'str'>
SAM True
<class 'list'> [22, 80, 443]
```

`type` answers with the word `class`: `str` and `list` are classes, and every string or list is an instance with its own methods. Your own classes work the same way.

### 2. Write a class with methods

A login guard counts failed logins for one user and locks the account after too many.

```python title="guard.py"
class LoginGuard:
    def __init__(self, username, max_failures=3):
        self.username = username
        self.max_failures = max_failures
        self.failures = 0

    def record_failure(self):
        self.failures += 1

    def record_success(self):
        if not self.is_locked():
            self.failures = 0

    def is_locked(self):
        return self.failures >= self.max_failures


sam = LoginGuard("sam")
sam.record_failure()
sam.record_failure()
print(sam.username, sam.failures, sam.is_locked())
sam.record_failure()
print(sam.username, sam.failures, sam.is_locked())
sam.record_success()
print("after a correct password:", sam.is_locked())
```

```bash
python3 guard.py
```

```output
sam 2 False
sam 3 True
after a correct password: True
```

Every method has `self` as its first parameter, so it can reach the object's attributes. When you call `sam.record_failure()`, Python passes `sam` as `self`, and `self.failures += 1` changes the count of that one guard. Methods can call each other through `self` too: `record_success` asks `self.is_locked()` first, so a correct password does not reset the count of an account that is already locked.

The rule "lock after three failures" now lives in one place, inside the class. Code that uses a `LoginGuard` cannot forget it.

### 3. Create independent instances

```python title="two_guards.py"
from guard import LoginGuard

alex = LoginGuard("alex", max_failures=5)
kim = LoginGuard("kim")
for i in range(4):
    alex.record_failure()
    kim.record_failure()

print(alex.username, alex.failures, alex.is_locked())
print(kim.username, kim.failures, kim.is_locked())
```

```bash
python3 two_guards.py
```

```output
sam 2 False
sam 3 True
after a correct password: True
alex 4 False
kim 4 True
```

The first line, `from guard import LoginGuard`, reuses the class from `guard.py`. Lesson 3.8 explains `import` in detail. For now, notice the surprise: the three `sam` lines come back, because importing a file runs all of it, including the test code at its bottom. Lesson 3.8 shows how to stop that.

Then the real result: both guards saw four failures, but `alex` has a limit of 5 and `kim` the default of 3. Each instance has its own attributes, so the two never mix.

### 4. Use a dataclass for objects that only hold data

```python
from dataclasses import dataclass

@dataclass
class LogEntry:
    ip: str
    path: str
    status: int

a = LogEntry("10.0.0.5", "/login", 401)
b = LogEntry("10.0.0.5", "/login", 401)
print(a)
print(a.status >= 400, a == b)
```

```output
LogEntry(ip='10.0.0.5', path='/login', status=401)
True True
```

Many classes only hold a few values. Writing `__init__` for them is boring, so Python offers **dataclasses**. The `@dataclass` line above the class writes the `__init__` for you from the list of fields, and also makes the object print in a readable way and compare by its values. The `: str` and `: int` parts are **type hints**: notes that say which type each field should hold. Python does not check them when the program runs, but editors and readers use them.

### 5. Know when a class is not needed

```python
def is_locked(failures, max_failures=3):
    return failures >= max_failures

print(is_locked(2), is_locked(4))

user = {"name": "kim", "role": "admin"}
print(user["role"])
```

```output
False True
admin
```

If your class would have only `__init__` and one method, it is usually a function in disguise. If it only holds data and never changes it, a dict or a dataclass does the job. Reach for a class when you have data and several operations that change it together, with rules that must not be broken, like the login guard. Many good Python scripts contain no class at all, and that is fine.

:::note[What about inheritance?]
A class can also be built on top of another class, take over all its methods and change some of them. This is called inheritance, and frameworks use it a lot. You do not need it for anything in this module. The tutorial linked in Go further shows how it works when you meet it.
:::

## Exercise

In `~/pylab/classes`, write `quota.py` with a class `Quota` for disk space:

1. `Quota(limit_mb)` creates a quota with a limit and 0 MB used.
2. `add(size_mb)` adds to the space used. If the new total would go over the limit, it raises a `ValueError` with a clear message and changes nothing.
3. `left()` returns how many MB are still free.

Test it: create a quota of 100 MB, add 30 and then 50, print what is left, then try to add 40 and print the error message.

<details>
<summary>Show the solution</summary>

```python title="quota.py"
class Quota:
    def __init__(self, limit_mb):
        self.limit_mb = limit_mb
        self.used_mb = 0

    def add(self, size_mb):
        if self.used_mb + size_mb > self.limit_mb:
            raise ValueError(f"cannot add {size_mb} MB, only {self.left()} MB left")
        self.used_mb += size_mb

    def left(self):
        return self.limit_mb - self.used_mb


q = Quota(100)
q.add(30)
q.add(50)
print("left:", q.left())
try:
    q.add(40)
except ValueError as e:
    print("error:", e)
print("still left:", q.left())
```

```bash
python3 quota.py
```

```output
left: 20
error: cannot add 40 MB, only 20 MB left
still left: 20
```

The check comes before the change, so a refused `add` leaves `used_mb` as it was, which the last line proves. Raising a `ValueError` is the same technique as in lesson 3.6: the class enforces its rule, and the caller decides what to do about it.

</details>

## Check yourself

**1. What is the difference between a class and an instance?**

<details>
<summary>Answer</summary>

A class is the blueprint: it defines which attributes and methods objects of that kind have. An instance is one object made from it, with its own values, such as `LoginGuard("sam")`.

</details>

**2. When does `__init__` run, and what is its job?**

<details>
<summary>Answer</summary>

It runs by itself each time you create an instance, such as `Server("web01", "10.0.0.5")`. Its job is to set the new object's attributes.

</details>

**3. In `sam.record_failure()`, what is `self` inside the method?**

<details>
<summary>Answer</summary>

The object `sam`. Python passes the object before the dot as the first argument, so the method changes `sam`'s own attributes.

</details>

**4. You need to store a user's name and role, and nothing ever changes them. Do you need a class with methods?**

<details>
<summary>Answer</summary>

No. A dict such as `{"name": "kim", "role": "admin"}`, or a dataclass, is enough. A class with methods helps when data and several operations on it belong together.

</details>

## Common mistakes

- **Forgetting `self` in a method.** `def is_locked():` inside a class fails when called, with `TypeError: ... takes 0 positional arguments but 1 was given`. Every method needs `self` as its first parameter.
- **Writing `failures` instead of `self.failures`.** Without `self.`, Python treats the name as a local variable of the method. `failures = 0` then changes nothing on the object, and `failures += 1` stops with `UnboundLocalError`. Write `self.failures`.
- **One underscore instead of two.** `_init_` is just an ordinary method that Python never calls. The name is `__init__`, with two underscores on each side.
- **Forgetting the parentheses when creating an object.** `guard = LoginGuard` stores the class itself, not a new instance. Write `LoginGuard("sam")`.
- **A class for everything.** If a class has no data that changes, write a function instead. Simpler code has fewer places for bugs.

## Key terms

- **Object**: a value that carries its own data and methods. In Python, every value is an object.
- **Class**: a blueprint that defines the attributes and methods of a kind of object.
- **Instance**: one object made from a class, with its own attribute values.
- **Attribute**: a variable that belongs to an object, reached with a dot, such as `guard.failures`.
- **`__init__`**: the special method Python calls when an instance is created. It sets the starting attributes.
- **`self`**: the first parameter of every method: the object the method was called on.
- **Object-oriented programming** (OOP): building programs from objects that combine data and behavior.
- **Dataclass**: a class marked with `@dataclass`, for which Python writes `__init__` and a readable printout by itself.
- **Type hint**: a note such as `ip: str` that says which type a value should have. Python does not enforce it.

## Go further

- [Classes](https://docs.python.org/3/tutorial/classes.html): the official tutorial chapter on classes, including inheritance.
- [dataclasses](https://docs.python.org/3/library/dataclasses.html): the reference for `@dataclass` and its options.
