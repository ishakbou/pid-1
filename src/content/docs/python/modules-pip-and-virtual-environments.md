---
title: Modules, pip and virtual environments
description: Split your code into files you can import, use Python's standard library, install packages with pip, and keep each project's packages separate with venv.
lesson: "3.8"
time: 25 min
sidebar:
  order: 8
---

"It works on my machine" is one of the oldest jokes in programming, and one of the least funny when it happens to you. Your script runs fine on your laptop, a classmate tries it and gets `ModuleNotFoundError`. Or two of your projects need different versions of the same package, and installing one breaks the other. This lesson gives you the three tools that prevent this: modules, pip and virtual environments.

## Goal

After this lesson you can:

- Split code into several files and import from them, and use the standard library.
- Create a virtual environment for a project and install packages into it with pip.
- Record a project's packages in `requirements.txt` and install them again from it.

## Why it matters

Nobody writes everything from scratch. Python comes with hundreds of ready modules, and thousands more packages wait online: for web servers, for parsing, for talking to cloud services, for security testing. Using them well means installing them in a way that is repeatable and does not damage the system. Ubuntu itself relies on Python, so breaking the system's Python can break system tools too. And a `requirements.txt` in a repository is the first thing a reviewer looks for: it says exactly what the code needs to run.

## The idea

A **module** is a Python file you can use from another Python file. Every `.py` file is a module: `guard.py` from lesson 3.7 is a module called `guard`. The `import` statement loads a module and gives you its functions, classes and variables.

Python comes with a large collection of modules called the **standard library**: `csv` and `json` from lesson 3.5, `math`, `random`, `datetime`, `pathlib` and many more. They are always there; you only import them.

A **package** is code that someone else published for you to install. Most packages live on **PyPI**, the Python Package Index, at pypi.org. **pip** is the tool that downloads a package from PyPI and installs it.

The question is where pip installs it. If every project installs into the one Python of the system, projects fight over versions, and you may break tools of Ubuntu that depend on that Python. A **virtual environment**, or venv, is a private folder for one project, with its own `python` and `pip` commands and its own packages. The `python` inside it is only a link to the system's Python, so a venv is small and quick to make. Each project gets its own venv, and what you install in one does not exist in the others.

Think of the system Python as the shared kitchen of a student house, and a venv as your own lunch box. You can pack whatever you like in the box without moving anyone else's food, and if it gets messy, you empty it and start over.

```text
pylab/modules/
    .venv/              the virtual environment: Python and installed packages
    requirements.txt    the list of packages this project needs
    sizes.py            your own module
    report.py           a script that imports sizes
```

## Try it

### 1. Import from the standard library

```bash
mkdir -p ~/pylab/modules
cd ~/pylab/modules
```

```python
import math
from collections import Counter

print(math.sqrt(144), math.pi)

codes = ["200", "404", "200", "500", "200", "404"]
counts = Counter(codes)
print(counts)
print(counts.most_common(2))
```

```output
12.0 3.141592653589793
Counter({'200': 3, '404': 2, '500': 1})
[('200', 3), ('404', 2)]
```

`import math` loads the module, and you reach what is inside with a dot: `math.sqrt`. `from collections import Counter` takes one name out of a module, so you can write `Counter` alone. A `Counter` is a dict made for counting: it does the `counts.get(ip, 0) + 1` loop of lesson 3.4 in one call, and `most_common(2)` returns the two biggest counts as a list of tuples.

### 2. Write your own module

```python title="sizes.py"
"""Helpers to show file sizes."""

def human_size(size_bytes):
    """Return a size in bytes as a short readable text."""
    if size_bytes < 1_000:
        return f"{size_bytes} B"
    elif size_bytes < 1_000_000:
        return f"{size_bytes / 1_000:.1f} KB"
    return f"{size_bytes / 1_000_000:.1f} MB"

print("test:", human_size(2048))
```

```python title="report.py"
import sizes

for size in [512, 48_000, 3_100_000]:
    print(sizes.human_size(size))
```

```bash
python3 report.py
```

```output
test: 2.0 KB
512 B
48.0 KB
3.1 MB
```

`import sizes` found `sizes.py` because it sits in the same folder as `report.py`. Python looks for modules in the script's own folder first, then in the standard library, then in the installed packages. (A few modules, such as `math`, are built into the `python3` program itself and are always found first.) But the first line of the output is the same surprise as in lesson 3.7: importing a module runs all its code, including the test `print` at the bottom.

### 3. Run test code only when the file is the main program

Change the last line of `sizes.py`:

```python title="sizes.py"
"""Helpers to show file sizes."""

def human_size(size_bytes):
    """Return a size in bytes as a short readable text."""
    if size_bytes < 1_000:
        return f"{size_bytes} B"
    elif size_bytes < 1_000_000:
        return f"{size_bytes / 1_000:.1f} KB"
    return f"{size_bytes / 1_000_000:.1f} MB"

if __name__ == "__main__":
    print("test:", human_size(2048))
```

```bash
python3 report.py
python3 sizes.py
```

```output
512 B
48.0 KB
3.1 MB
test: 2.0 KB
```

Python gives every module a variable `__name__`. When you run a file directly, its `__name__` is `"__main__"`. When it is imported, `__name__` is the module's name, here `"sizes"`. So the test line runs with `python3 sizes.py`, but not when `report.py` imports it. You will see this `if` at the bottom of almost every Python script, and from now on yours will have it too.

### 4. Install the venv tool

Ubuntu splits Python into several packages, and the venv tool is not always installed. Install it once with apt, as in lesson 1.6:

<!-- lab: nocheck -->
```bash
sudo apt install -y python3-venv
```

```output
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following additional packages will be installed:
  python3-pip-whl python3-setuptools-whl python3.12-venv
The following NEW packages will be installed:
  python3-pip-whl python3-setuptools-whl python3-venv python3.12-venv
0 upgraded, 4 newly installed, 0 to remove and 62 not upgraded.
Need to get 2430 kB of archives.
After this operation, 2783 kB of additional disk space will be used.
Get:1 http://archive.ubuntu.com/ubuntu noble-updates/universe amd64 python3-pip-whl all 24.0+dfsg-1ubuntu1.3 [1707 kB]
...
Fetched 2430 kB in 18s (138 kB/s)
...
Setting up python3-setuptools-whl (68.1.2-2ubuntu1.2) ...
Setting up python3-pip-whl (24.0+dfsg-1ubuntu1.3) ...
Setting up python3.12-venv (3.12.3-1ubuntu0.17) ...
Setting up python3-venv (3.12.3-0ubuntu2.1) ...
...
```

The output is long, so some parts are cut here and shown as `...`. Your version numbers, sizes and download speed will differ. apt installs `python3-venv` and three small packages it needs. If it says `python3-venv is already the newest version`, it was there already, and that is fine.

### 5. Create and activate a virtual environment

```bash
python3 -m venv .venv
ls .venv
```

```output
bin  include  lib  lib64  pyvenv.cfg
```

`python3 -m venv .venv` runs the `venv` module of the standard library and creates the environment in a folder called `.venv`. The dot makes it a hidden folder, and `.venv` is the name most Python projects use. Inside, `bin` holds the commands and `lib` will hold the packages.

```bash
source .venv/bin/activate
which python pip
```

```output
/home/sam/pylab/modules/.venv/bin/python
/home/sam/pylab/modules/.venv/bin/pip
```

`source .venv/bin/activate` **activates** the venv: it puts `.venv/bin` at the front of your `PATH` for this terminal, so `python` and `pip` now mean the copies inside the venv. Your prompt starts with `(.venv)` to remind you. Inside an active venv you can type `python` instead of `python3`; both work. The path shows `sam`; yours shows your own username.

### 6. Install a package with pip

<!-- lab: nocheck -->
```bash
pip install tabulate
```

```output
Collecting tabulate
  Downloading tabulate-0.10.0-py3-none-any.whl.metadata (40 kB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 40.8/40.8 kB 161.0 kB/s eta 0:00:00
Downloading tabulate-0.10.0-py3-none-any.whl (39 kB)
Installing collected packages: tabulate
Successfully installed tabulate-0.10.0
```

pip found the package `tabulate` on PyPI, downloaded it and installed it into `.venv/lib`, nowhere else. The version you get may be newer. Now use it:

```python title="table.py"
from tabulate import tabulate

rows = [["web01", 22, "open"], ["web01", 80, "closed"], ["db01", 5432, "open"]]
print(tabulate(rows, headers=["host", "port", "state"]))
```

```bash
python table.py
```

```output
host      port  state
------  ------  -------
web01       22  open
web01       80  closed
db01      5432  open
```

`tabulate` lines the columns up for you, and puts numbers on the right, as tables usually do.

### 7. Record what the project needs

<!-- lab: nocheck -->
```bash
pip freeze > requirements.txt
cat requirements.txt
```

```output
tabulate==0.10.0
```

`pip freeze` lists every package installed in the active venv, with its exact version. Saving that list as `requirements.txt` is a convention every Python developer knows. Anyone, including you on another computer, can now rebuild the same environment.

### 8. Rebuild the environment from requirements.txt

```bash
deactivate
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -q -r requirements.txt
python table.py | head -n 2
```

```output
host      port  state
------  ------  -------
```

`deactivate` leaves the venv, and `rm -rf .venv` deletes it completely. That is safe: a venv holds nothing you wrote, only things you can install again. `pip install -r requirements.txt` installs everything on the list, and `-q` keeps pip quiet. The script works again. This is also why a venv never goes into git: you commit `requirements.txt`, and add `.venv/` to your `.gitignore`, as you learned in Module 2.

:::caution[Do not install packages into the system Python]
A fresh Ubuntu may have no `pip` command outside a venv at all. Where the system has one, as in the course's Codespaces lab, `pip install` outside a venv on Ubuntu 24.04 stops with the error `externally-managed-environment`. Ubuntu protects its own Python, because system tools depend on it. The error message offers an option to force the install anyway. Do not use it: create a venv instead. And only install packages you have checked on PyPI: attackers publish fake packages with names one letter away from popular ones, hoping you make a typo.
:::

## Exercise

In a new folder `~/pylab/modules2`:

1. Write a module `textstats.py` with a function `word_count(text)` that returns the number of words in a string. Add a test line that runs only when the file is run directly.
2. Write `main.py` that imports it and prints the word count of `"the quick brown fox"`.
3. Create a venv, install `tabulate` into it, save `requirements.txt`, and check with `pip freeze` that only `tabulate` is listed.

<details>
<summary>Show the solution</summary>

```bash
mkdir -p ~/pylab/modules2
cd ~/pylab/modules2
```

```python title="textstats.py"
def word_count(text):
    """Return the number of words in text."""
    return len(text.split())

if __name__ == "__main__":
    print("test:", word_count("one two three"))
```

```python title="main.py"
from textstats import word_count

print(word_count("the quick brown fox"))
```

```bash
python3 main.py
python3 textstats.py
```

```output
4
test: 3
```

<!-- lab: nocheck -->
```bash
deactivate 2> /dev/null
python3 -m venv .venv
source .venv/bin/activate
pip install -q tabulate
pip freeze > requirements.txt
pip freeze
```

```output
tabulate==0.10.0
```

`deactivate 2> /dev/null` leaves the venv of the lesson if it is still active, and stays quiet if it is not. Your version number may be newer. If `pip freeze` lists more packages, you probably installed them while another venv, or none, was active.

</details>

## Check yourself

**1. What is the difference between a module and a package?**

<details>
<summary>Answer</summary>

A module is a Python file you can import, such as `sizes.py` or `math`. A package is published code that you install with pip, usually from PyPI. An installed package gives you one or more modules to import.

</details>

**2. What does `if __name__ == "__main__":` do?**

<details>
<summary>Answer</summary>

The code under it runs only when the file is run directly, as in `python3 sizes.py`. When another file imports it, `__name__` is the module's name and that code is skipped.

</details>

**3. After `source .venv/bin/activate`, why does `pip install` put packages inside `.venv`?**

<details>
<summary>Answer</summary>

Activating puts `.venv/bin` at the front of `PATH`, so `pip` and `python` are the copies inside the venv, and they install into the venv's own `lib` folder.

</details>

**4. Why do you commit `requirements.txt` but not `.venv`?**

<details>
<summary>Answer</summary>

`requirements.txt` is a short list that anyone can use to rebuild the environment with `pip install -r requirements.txt`. `.venv` is big, belongs to one computer and can always be rebuilt, so it goes into `.gitignore`.

</details>

**5. You name your own file `csv.py`, and a script that runs `import csv` breaks. Why?**

<details>
<summary>Answer</summary>

Python looks in the script's folder first, so `import csv` finds your `csv.py` instead of the standard library module. Rename your file.

</details>

## Common mistakes

- **Naming a file like a module.** A file called `csv.py`, `json.py` or `random.py` hides the standard module with the same name. Choose names that are your own, such as `export_csv.py`.
- **Forgetting to activate.** If `import tabulate` gives `ModuleNotFoundError`, the venv is probably not active in this terminal. Run `source .venv/bin/activate` and look for `(.venv)` in the prompt.
- **Committing the venv.** `.venv` holds thousands of files that only work on your computer. Put `.venv/` in `.gitignore`.
- **Forcing pip into the system Python.** Ubuntu's `externally-managed-environment` error is there to protect you. Use a venv.
- **`python3 -m venv` fails with `ensurepip is not available`.** The `python3-venv` package is missing. Install it with `sudo apt install -y python3-venv`, delete the half-made `.venv` folder, and try again.

## Key terms

- **Module**: a Python file that other Python code can load with `import`.
- **Standard library**: the modules that come with every Python, such as `math`, `csv`, `json` and `collections`.
- **Package**: published code you install, usually from PyPI, that provides modules.
- **PyPI**: the Python Package Index at pypi.org, where most Python packages are published.
- **pip**: the tool that installs Python packages.
- **Virtual environment** (venv): a folder with its own Python and its own installed packages, for one project.
- **Activate**: to switch a terminal to a venv with `source .venv/bin/activate`, so `python` and `pip` use it.
- **requirements.txt**: a text file that lists the packages a project needs, one per line, often with exact versions.

## Go further

- [Modules](https://docs.python.org/3/tutorial/modules.html): the official tutorial on `import`, `__name__` and how Python finds modules.
- [Virtual Environments and Packages](https://docs.python.org/3/tutorial/venv.html): the official tutorial on venv and pip.
- [The Python Standard Library](https://docs.python.org/3/library/index.html): the list of everything that comes with Python. Browse it before you install a package: the tool you need may already be there.
