---
title: "Module 3: Programming with Python"
description: Write real Python programs that work with data, files and errors, test them, and turn them into small command-line tools.
module: 3
sidebar:
  order: 0
  label: Overview
---

Bash is good at running commands one after another. As soon as a task needs counting, comparing or remembering many things, you want a real programming language, and in system and security work that language is usually Python. This module takes you from your first `print` to a tested command-line tool that reads a web server log and points out the suspicious visitors in it. Every lesson ends with code you ran yourself.

## What you will learn

- How to run Python, store values in variables and work with numbers, text and booleans.
- How to make decisions with `if` and repeat work with `for` and `while`.
- How to package code into functions with parameters and return values.
- How to store collections of data in lists, dictionaries and sets, and pick the right one.
- How to read and write text files, CSV and JSON.
- How to read a traceback and handle errors with `try` and `except`.
- How to group data and behavior into classes, and when not to.
- How to split code into modules, install packages with pip and isolate each project in a virtual environment.
- How to write tests with pytest and find bugs with a calm method.
- How to write command-line scripts that take arguments, rename files and run other programs.

## Before you start

You need the terminal skills of [Module 1](../linux/): moving around folders, creating files with an editor, running commands, pipes, `sudo` and installing packages with apt. The project step adds its files to `mylab` and commits them, so you also need git from [Module 2](../git/). No programming experience is needed: the module starts from zero.

Everything runs on Ubuntu (on WSL, in Codespaces or installed) with Python 3.10 or newer, which Ubuntu already includes. Lesson 3.8 installs the venv tool with apt and a few packages from the internet.

## Time

11 lessons, about 4 hours 10 minutes of reading and practice.

## Module map

```mindmap
Programming with Python
  Basics
    variables and types
    if, for, while
    functions
  Data
    lists, dicts, sets
    text files
    CSV and JSON
  Reliable code
    tracebacks
    try and except
    tests with pytest
    debugging method
  Organizing code
    classes and objects
    modules and imports
    pip and venv
  Tools
    command-line arguments
    files and subprocess
    log analyzer
```

## Lessons

1. 3.1 [Variables and types](../python/variables-and-types/): run Python, store values, and work with numbers, strings and booleans.
2. 3.2 [Conditions and loops](../python/conditions-and-loops/): make decisions with if, and repeat work with for and while.
3. 3.3 [Functions](../python/functions/): package code into reusable functions with parameters and return values.
4. 3.4 [Lists, dictionaries and sets](../python/lists-dictionaries-and-sets/): store collections of data and pick the right one for the job.
5. 3.5 [Working with files](../python/working-with-files/): read and write text files, CSV and JSON.
6. 3.6 [Errors and exceptions](../python/errors-and-exceptions/): read a traceback, and handle errors with try and except.
7. 3.7 [Classes and objects (OOP)](../python/classes-and-objects/): group data and behavior into classes, and learn when a class is not needed.
8. 3.8 [Modules, pip and virtual environments](../python/modules-pip-and-virtual-environments/): split code into files, install packages, and keep each project isolated with venv.
9. 3.9 [Testing and debugging](../python/testing-and-debugging/): write tests with pytest, and find bugs with print, the debugger and a calm method.
10. 3.10 [Automating tasks with Python](../python/automating-tasks-with-python/): write command-line scripts that rename files, run other programs and take arguments.
11. 3.11 [Project step: a log analyzer for mylab](../python/project/): build a tool that reads a log file and reports the busiest IP addresses and the errors.

## Project step

Until now `mylab` held Bash scripts and notes. In this step it gets its first Python tool: `tools/loganalyzer.py` reads a web server access log, `data/sample-access.log`, and reports the busiest IP addresses, the errors and the broken lines. In the sample log, the report shows someone guessing a password and a scanner looking for secret files. The tool comes with pytest tests in `tools/test_loganalyzer.py`, its own `.venv` that git ignores, and a `requirements.txt`, and you commit it all. Module 4 makes the analyzer faster on big logs.

## Cheat sheet

Everything from this module on one page: [Cheat sheet: Python](../python/cheat-sheet/).
