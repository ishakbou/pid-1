---
title: Working with files
description: Read and write text files from Python, and handle the two most common data formats, CSV and JSON.
lesson: "3.5"
time: 25 min
sidebar:
  order: 5
---

Every program you have written so far has the memory of a goldfish. It counts, decides and prints, and the moment it ends, everything is gone. Files fix that. A program can read what another program wrote yesterday, and leave its results for tomorrow. Logs, configuration, exported user lists: almost all the data you will meet in this field lives in files.

## Goal

After this lesson you can:

- Read a text file, all at once or line by line, and write or add to one.
- Read and write CSV files, the format of spreadsheets and exports.
- Save Python data as JSON and load it back.

## Why it matters

A log analyzer reads a log file. A backup check reads a list of folders. A scanner writes its results to a report. Without files, a script can only work on data you type into its code, which is useless for real work. CSV and JSON matter just as much: CSV is what you get when you export anything from a spreadsheet or an admin panel, and JSON is the language most web services and configuration files speak.

## The idea

To use a file, a program first **opens** it, then reads or writes, then **closes** it. Python's `open` function opens a file and returns a **file object**, the handle your code uses to read or write. The **mode** says what you want to do:

| Mode | Meaning | If the file exists | If it does not exist |
|---|---|---|---|
| `"r"` | read (the default) | reads it | error |
| `"w"` | write | empties it first | creates it |
| `"a"` | append | adds at the end | creates it |

You almost always open a file inside a `with` block:

```python
with open("report.txt", "w", encoding="utf-8") as f:
    f.write("all good\n")
```

`with` opens the file, gives you the file object as `f`, and closes the file as soon as the block ends, even if something goes wrong inside. Python keeps what you write in memory for a moment and writes it out in bigger pieces; closing the file makes sure everything you wrote has really reached the file. `encoding="utf-8"` tells Python how to turn the characters into bytes. Always give it, so your script behaves the same on every computer. The `\n` at the end of the text is the **newline character**, the invisible character that ends a line.

The file name is a path, read from the working directory, exactly as in [Files and navigation](../linux/files-and-navigation/). If your script says `open("data.txt")`, Python looks for `data.txt` in the folder you ran the script from, not in the folder where the script lives.

Two text formats carry most structured data:

- **CSV**, short for comma-separated values: one record per line, fields separated by commas, often with a header line that names the columns. It is a table in plain text.
- **JSON**, short for JavaScript Object Notation: text that looks almost exactly like Python dicts and lists. It can hold nested data, such as a list inside a dict.

## Try it

### 1. Create a text file to work with

```bash
mkdir -p ~/pylab/files
cd ~/pylab/files
```

Create `servers.txt` in that folder with your editor:

```text title="servers.txt"
web01 10.0.0.5
web02 10.0.0.6
db01 10.0.0.20
backup 10.0.0.30
```

### 2. Read the whole file

```python title="read_all.py"
with open("servers.txt", encoding="utf-8") as f:
    text = f.read()

print(type(text), len(text))
print(text)
```

```bash
python3 read_all.py
```

```output
<class 'str'> 62
web01 10.0.0.5
web02 10.0.0.6
db01 10.0.0.20
backup 10.0.0.30

```

`read()` returns the whole file as one string, newlines included. That is fine for small files. A log file of 2 GB, though, would fill your memory, so for big files you read one line at a time.

### 3. Read line by line

```python title="read_lines.py"
with open("servers.txt", encoding="utf-8") as f:
    for line in f:
        name, ip = line.strip().split()
        print(f"{name:8} -> {ip}")
```

```bash
python3 read_lines.py
```

```output
web01    -> 10.0.0.5
web02    -> 10.0.0.6
db01     -> 10.0.0.20
backup   -> 10.0.0.30
```

A `for` loop over a file object gives you one line per iteration, and only that line is in memory. Each line still ends with `\n`. `strip()` removes spaces and newlines from both ends of a string. Then `split()` cuts the line in two, and `name, ip = ...` puts the two pieces into two variables, the same unpacking you used with `items()` in lesson 3.4.

### 4. Write a file

```python title="write_report.py"
servers = {"web01": "up", "db01": "down", "backup": "up"}

with open("report.txt", "w", encoding="utf-8") as f:
    for name, state in servers.items():
        f.write(f"{name}: {state}\n")

print("report written")
```

```bash
python3 write_report.py
cat report.txt
```

```output
report written
web01: up
db01: down
backup: up
```

`write` writes exactly the string you give it, and nothing more. Unlike `print`, it does not add a newline, so you put `\n` at the end yourself. Run the script twice and `report.txt` still has three lines: mode `"w"` empties the file before writing.

### 5. Add to a file

```python title="log_run.py"
with open("runs.log", "a", encoding="utf-8") as f:
    f.write("backup finished\n")
```

```bash
python3 log_run.py
python3 log_run.py
cat runs.log
```

```output
backup finished
backup finished
```

Mode `"a"` keeps what is there and writes at the end. That is how log files grow: every run adds its lines below the old ones.

:::caution["w" empties the file at once]
Opening a file with `"w"` erases its content immediately, before you write anything. If you meant to add to a file and typed `"w"`, the old content is gone. Use `"a"` to add, and keep a copy of anything important before your script writes to it.
:::

### 6. Read a CSV file

Create `users.csv`:

```text title="users.csv"
username,role,last_login
sam,student,2026-11-20
alex,admin,2026-11-21
kim,student,2026-10-02
```

```python title="read_csv.py"
import csv

with open("users.csv", encoding="utf-8", newline="") as f:
    for row in csv.DictReader(f):
        print(row["username"], "is", row["role"])
```

```bash
python3 read_csv.py
```

```output
sam is student
alex is admin
kim is student
```

`import csv` loads Python's CSV tools, which come with every Python; lesson 3.8 explains `import`. `csv.DictReader` reads the header line and then gives you each record as a dict, with the column names as keys. That is much clearer than `parts[1]`. Why not just `split(",")`? Because real CSV files can contain a comma inside a field, written in quotes like `"Doe, Jane"`, and the `csv` module handles those cases for you. Open CSV files with `newline=""`, as the documentation of the `csv` module asks.

### 7. Write a CSV file

```python title="write_csv.py"
import csv

rows = [
    ["port", "service"],
    [22, "ssh"],
    [443, "https"],
]

with open("ports.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerows(rows)
```

```bash
python3 write_csv.py
cat ports.csv
```

```output
port,service
22,ssh
443,https
```

`csv.writer` turns each list into one line, puts commas between the fields and adds quotes where needed. `writerows` writes a whole list of rows in one call; `writerow` writes one.

### 8. Save and load JSON

```python title="config.py"
import json

config = {
    "hostname": "web01",
    "ports": [22, 443],
    "debug": False,
}

with open("config.json", "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2)
    f.write("\n")

with open("config.json", encoding="utf-8") as f:
    loaded = json.load(f)

print(loaded["ports"])
print(loaded == config)
```

```bash
python3 config.py
cat config.json
```

```output
[22, 443]
True
{
  "hostname": "web01",
  "ports": [
    22,
    443
  ],
  "debug": false
}
```

`json.dump` writes Python data as JSON text, and `indent=2` makes it readable for humans. It does not end the file with a newline, so `f.write("\n")` adds one; without it, `cat` would print your next prompt on the same line as the closing brace. `json.load` reads it back into dicts and lists, and the result is equal to what you saved. Look closely at the file: JSON writes `false` in lowercase and uses double quotes only. It looks like Python, but it is its own format, with its own small rules.

## Exercise

In `~/pylab/files`, using the `users.csv` from step 6, write `admins.py` that:

1. Reads `users.csv` with `csv.DictReader`.
2. Collects the usernames of everyone whose role is `admin` in a list.
3. Saves the result to `admins.json` as `{"admins": [...], "count": ...}`.
4. Prints the content of `admins.json`.

Before you run it, add one line to `users.csv`: `root,admin,2026-11-21`.

<details>
<summary>Show the solution</summary>

```bash
echo "root,admin,2026-11-21" >> users.csv
```

```python title="admins.py"
import csv
import json

admins = []
with open("users.csv", encoding="utf-8", newline="") as f:
    for row in csv.DictReader(f):
        if row["role"] == "admin":
            admins.append(row["username"])

with open("admins.json", "w", encoding="utf-8") as f:
    json.dump({"admins": admins, "count": len(admins)}, f, indent=2)

with open("admins.json", encoding="utf-8") as f:
    print(f.read())
```

```bash
python3 admins.py
```

```output
{
  "admins": [
    "alex",
    "root"
  ],
  "count": 2
}
```

`>>` adds a line to the end of a file from the shell, as you saw in Module 1. Opening `admins.json` with `"w"` is right here: the file is a result, and each run should replace the old one.

</details>

## Check yourself

**1. Why do you open files with `with`?**

<details>
<summary>Answer</summary>

`with` closes the file automatically when the block ends, even if an error happens inside. Closing makes sure that everything you wrote has really reached the file.

</details>

**2. What is the difference between mode `"w"` and mode `"a"`?**

<details>
<summary>Answer</summary>

`"w"` empties the file first and then writes. `"a"` keeps the content and adds at the end. Both create the file if it does not exist.

</details>

**3. Each line you read from a file ends with something you usually remove. What is it, and how do you remove it?**

<details>
<summary>Answer</summary>

The newline character, `\n`. `line.strip()` removes it, together with spaces at both ends.

</details>

**4. Why use the `csv` module instead of `line.split(",")`?**

<details>
<summary>Answer</summary>

Real CSV files can have commas inside quoted fields, like `"Doe, Jane"`. `split(",")` would cut such a field in two; the `csv` module reads it correctly. `DictReader` also gives you each row as a dict with the column names as keys.

</details>

**5. Your script runs `open("data.txt")` and fails, but `data.txt` is right next to the script. What is the likely cause?**

<details>
<summary>Answer</summary>

You ran the script from another folder. A relative path is read from the working directory, not from the script's folder. `cd` into the folder first, or use the full path.

</details>

## Common mistakes

- **`FileNotFoundError`.** The path is wrong or you are in the wrong folder. Run `pwd` and `ls`, as in Module 1. Lesson 3.6 shows how to handle the error in code.
- **Forgetting `\n` with `write`.** All your lines end up glued into one. Add `\n` at the end of each string.
- **Opening with `"w"` by mistake.** The old content is erased the moment the file opens. Use `"a"` to add.
- **Forgetting that everything read is a string.** A number read from a file or a CSV is text like `"42"`. Convert it with `int()` before you calculate.
- **Writing Python instead of JSON.** JSON needs double quotes and lowercase `true`, `false` and `null`. Let `json.dump` write it instead of building the text by hand.

## Key terms

- **File object**: what `open` returns. Your code reads from it and writes to it.
- **Mode**: the second argument of `open`: `"r"` to read, `"w"` to write from scratch, `"a"` to append.
- **Newline character** (`\n`): the invisible character that ends a line in a text file.
- **Encoding**: the rule that turns characters into bytes in a file. Use `encoding="utf-8"`.
- **CSV**: comma-separated values, a plain text table with one record per line.
- **JSON**: JavaScript Object Notation, a text format for nested data that looks like Python dicts and lists.

## Go further

- [Reading and Writing Files](https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files): the official tutorial on `open`, modes and `with`, plus a short part on JSON.
- [csv: CSV File Reading and Writing](https://docs.python.org/3/library/csv.html): the reference for the `csv` module, with examples for every function used here.
- [json: JSON encoder and decoder](https://docs.python.org/3/library/json.html): the reference for `json.dump`, `json.load` and their options.
