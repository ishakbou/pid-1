---
title: "Cheat sheet: Python"
description: The Python syntax, data types, file handling, error handling, venv commands and testing tools of Module 3 on one printable page.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## Running Python

| Command | What it does |
|---|---|
| `python3 --version` | show the Python version |
| `python3 script.py` | run a script |
| `python3 -c 'print(2 + 3)'` | run one line of code |
| `python3` | interactive mode; leave with `exit()` or Ctrl+D |
| Ctrl+C | stop a running program (`KeyboardInterrupt`) |

## Types and operators

| Type | Example | Convert with |
|---|---|---|
| `int` | `22`, `1_000_000` | `int("42")` |
| `float` | `3.5` | `float("3.5")` |
| `str` | `"sam"` | `str(22)` |
| `bool` | `True`, `False` | the result of a comparison |

- `7 / 2` is `3.5`, `7 // 2` is `3`, `7 % 2` is `1`, `2 ** 10` is `1024`. `0.1 + 0.2` is `0.30000000000000004`.
- Compare: `==  !=  <  >  <=  >=`. Combine: `and`, `or`, `not`. `type(x)` shows the type.
- In `if x:`, an empty string `""`, the number `0` and other empty values count as false. Everything else counts as true.

## Strings

| Code | Result for `host = "server01.lab"` |
|---|---|
| `len(host)` | `12` |
| `host.upper()` | `'SERVER01.LAB'` |
| `host[0]`, `host[-3:]` | `'s'`, `'lab'` |
| `host.replace("01", "02")` | `'server02.lab'` (a new string) |
| `"lab" in host` | `True` |
| `"a b  c".split()`, `"a,b".split(",")` | `['a', 'b', 'c']`, `['a', 'b']` |
| `" | ".join(["a", "b"])` | `'a | b'` |
| `"  hi\n".strip()` | `'hi'` |
| `ch.isdigit()`, `ch.isupper()` | `True` or `False` |
| `f"{name} has {n} logins"` | values put into text |
| `f"{x:.2f}"`, `f"{name:6}"`, `f"{x=}"`, `f"{v!r}"` | 2 decimals, pad to 6, name and value, with quotes |

## Conditions and loops

```python
if port == 22:
    print("SSH")
elif port == 443:
    print("HTTPS")
else:
    print("other")

for i in range(5):          # 0, 1, 2, 3, 4
    total += i              # same as total = total + i
for ch in "text":           # each character
    ...
while size <= 1000:         # until the condition is false
    size = size * 2
```

- `range(1, 11)` gives 1 to 10; `range(0, 20, 5)` gives 0, 5, 10, 15.
- `break` leaves the loop. `continue` jumps to the next iteration.

## Functions

```python
def convert(size_bytes, unit="MB"):
    """Docstring: what the function does."""
    if unit == "KB":
        return size_bytes / 1_000
    return size_bytes / 1_000_000

convert(5_000_000)               # default unit
convert(5_000_000, unit="KB")    # keyword argument
```

- No `return` means the function returns `None`. Variables created inside are local.

## Lists, dictionaries, sets

| Task | List `ports = [80, 443]` | Dict `d = {"ssh": 22}` | Set `s = {22, 80}` |
|---|---|---|---|
| read | `ports[0]`, `ports[1:3]` | `d["ssh"]`, `d.get("ftp", 0)` | (no order) |
| add | `ports.append(22)` | `d["dns"] = 53` | `s.add(443)` |
| is it there? | `80 in ports` | `"ssh" in d` (keys) | `22 in s` |
| loop | `for p in ports:` | `for k, v in d.items():` | `for x in sorted(s):` |

- `sorted(x)` returns a new sorted list; `sorted(x, reverse=True)`; `sorted(counts, key=counts.get, reverse=True)` sorts keys by value.
- `ports.remove(80)` deletes the first `80`; `ports[0] = 8443` replaces an item. `sum`, `min`, `max`, `len` work on lists. `set(items)` removes duplicates. `a - b` and `a & b` on sets.
- Count: `counts[ip] = counts.get(ip, 0) + 1`, or `Counter(items).most_common(3)` from `collections`.
- `{}` is an empty dict; an empty set is `set()`. A tuple is a fixed group: `("ssh", 22)`.

## Files, CSV and JSON

| Mode | Meaning |
|---|---|
| `"r"` | read (default); error if the file is missing |
| `"w"` | write; empties the file first |
| `"a"` | append at the end |

```python
with open("servers.txt", encoding="utf-8") as f:
    for line in f:
        name, ip = line.strip().split()

with open("report.txt", "w", encoding="utf-8") as f:
    f.write("web01: up\n")              # write adds no newline

import csv
with open("users.csv", encoding="utf-8", newline="") as f:
    for row in csv.DictReader(f):       # each row is a dict
        print(row["username"])

import json
with open("config.json", "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2)
with open("config.json", encoding="utf-8") as f:
    config = json.load(f)
```

- Relative paths start from the working directory, not from the script's folder.

## Errors and exceptions

```python
try:
    port = int(text)
except ValueError as e:
    print("bad:", e)
else:
    print("ok")          # only if nothing was raised
finally:
    print("done")        # always

raise ValueError(f"port out of range: {port}")
```

| Exception | Typical cause |
|---|---|
| `SyntaxError` | Python cannot read the code; nothing runs |
| `NameError` | unknown name, often a typo |
| `TypeError` | wrong type, like `"3" + 1` |
| `ValueError` | right type, bad value, like `int("n/a")` |
| `KeyError` / `IndexError` | missing dict key / list index past the end |
| `FileNotFoundError` | the file does not exist |

- Read a traceback from the bottom: the last line is the cause, the frame above it is the place.
- An uncaught exception ends the script with exit status 1. Catch only the exceptions you expect, never a bare `except:`.

## Classes

```python
class LoginGuard:
    def __init__(self, username, max_failures=3):
        self.username = username
        self.failures = 0
        self.max_failures = max_failures

    def is_locked(self):
        return self.failures >= self.max_failures

guard = LoginGuard("sam")          # an instance

from dataclasses import dataclass
@dataclass
class LogEntry:
    ip: str
    status: int
```

- Use a class for data plus several operations with rules. Use a function, a dict or a dataclass when that is enough.

## Modules, pip and venv

| Command or code | What it does |
|---|---|
| `import math`, `from collections import Counter` | load a module, or one name from it |
| `if __name__ == "__main__":` | run this only when the file is run directly |
| `sudo apt install -y python3-venv` | install the venv tool on Ubuntu |
| `python3 -m venv .venv` | create a virtual environment |
| `source .venv/bin/activate` | activate it; the prompt shows `(.venv)` |
| `pip install tabulate` | install a package into the active venv |
| `pip freeze > requirements.txt` | record the installed packages |
| `pip install -r requirements.txt` | install everything on the list |
| `deactivate` | leave the venv |

- Put `.venv/` and `__pycache__/` in `.gitignore`; commit `requirements.txt`.
- Outside a venv, Ubuntu 24.04 refuses `pip install` with `externally-managed-environment`. Use a venv.
- Do not name your files like modules (`csv.py`, `json.py`).

## Testing and debugging

```python
# test_logtools.py
import pytest
from logtools import is_error, status_class

def test_bad_request_is_error():
    assert is_error(400)

def test_rejects_nonsense():
    with pytest.raises(ValueError):
        status_class(42)
```

- Run `pytest -q` in the venv. It runs functions named `test_...` in files named `test_...`.
- Method: reproduce, read, narrow down, explain in one sentence, fix, add a regression test.
- `print(f"{code=} {errors=}")` shows names and values. `breakpoint()` opens the debugger: `p x` print, `n` next line, `s` step into, `c` continue, `q` quit.

## Command-line scripts

```python
#!/usr/bin/env python3
import argparse
import subprocess
import sys
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("folder")                          # required
parser.add_argument("--dry-run", action="store_true")  # True or False
parser.add_argument("--top", type=int, default=3)
args = parser.parse_args()                             # args.folder, args.dry_run

for path in sorted(Path(args.folder).iterdir()):
    print(path.name, path.stem, path.suffix)

result = subprocess.run(["ls", "inbox"], capture_output=True, text=True)
print(result.returncode, result.stdout, result.stderr)

print("error: ...", file=sys.stderr)
sys.exit(1)
```

- `sys.argv` is the list of arguments; item 0 is the script.
- `path.exists()`, `path.is_dir()`, `path.is_file()`, `path.with_name(new)`, `path.rename(new_path)`.
- `chmod +x tool.py`, then `./tool.py`. Exit status 0 means success; argparse exits with 2 on bad arguments.
- Offer `--dry-run` before renaming or deleting, and never rename onto a file that exists.
