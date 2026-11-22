---
title: When not to trust AI
description: Recognize the four places where AI answers fail most often, made-up facts, outdated advice, insecure code and private data, and check each one with a command.
lesson: "15.4"
time: 25 min
sidebar:
  order: 4
---

In 2023, two lawyers in New York were fined by a judge over a court filing. It cited six earlier cases that did not exist. A chatbot had invented them, with names, dates and quotes, and when one lawyer asked it whether the cases were real, it said yes. The lawyers were not fined for using a tool. They were fined because they did not check it.

## Goal

After this lesson you can:

- Name the four kinds of AI answer you must never accept unchecked: made-up facts, outdated advice, insecure code and requests that would leak private data.
- Check a function, an option or a piece of advice against the real system and its official documentation.
- Spot an injection flaw in AI-written code and remove secrets from text before you share it.

## Why it matters

The first three lessons of this module were about answers that crash or print the wrong number. Those are the easy ones, because you see them. The mistakes in this lesson are quieter. An invented option looks like a real one, outdated advice still works for a while, insecure code passes every normal test, and a pasted password does no harm on the day you paste it. In security work, these are exactly the mistakes that end up in incident reports.

## The idea

An assistant writes text that is likely to follow your question, based on what it saw in training. That one fact explains all four dangers:

- **Made-up facts.** Text that looks right is not always true. A function name that fits the pattern of real names is likely text, so the model may write it even if it does not exist. This is the **hallucination** from lesson 0.6.
- **Outdated advice.** A model is trained on text up to a certain date, its **knowledge cutoff**. Old advice also appears far more often in that text than new advice, because it had years to be copied. Tools change faster than that.
- **Insecure code.** A great deal of example code online was written to be short, not safe. The model learned from it, and short code is what it tends to write.
- **Private data.** With an online assistant, whatever you paste leaves your computer and goes to the service that runs the model. Depending on its settings, it can be stored, read by staff or used for training.

Think of the assistant as a guidebook printed a few years ago by a well-read author who sometimes fills gaps from imagination. It is still the fastest way to find your way around a new city. But you check the opening hours before you travel, you do not follow its advice into a dark street, and you do not write your PIN code on its pages.

The defence is the same for all four: check against the real thing. The real system tells you what exists, the official documentation for your version tells you what is current, your security knowledge tells you what is safe, and a quick search of your own text tells you what is private.

## Try it

You check four claims, one per danger. Each claim is written the way an assistant would write it; I wrote them for this lesson, and each one is a mistake that real assistants make.

```bash
mkdir -p ~/ailab/trust
cd ~/ailab/trust
```

### 1. A function that does not exist

> To get the three most common items of a `Counter`, call `counts.top(3)`.

It sounds like Python. Test it:

```bash
python3 -c "from collections import Counter; print(Counter('aab').top(1))"
```

```output
Traceback (most recent call last):
  File "<string>", line 1, in <module>
AttributeError: 'Counter' object has no attribute 'top'. Did you mean: 'pop'?
```

There is no `top`. Ask Python itself whether a name exists:

```bash
python3 -c "from collections import Counter; print(hasattr(Counter, 'top'), hasattr(Counter, 'most_common'))"
```

```output
False True
```

`hasattr` answers `True` when an object has a name and `False` when it does not. The real method is `most_common`, which you used in `mylab`. The system is the final word on what exists, and asking it takes one line.

### 2. An option that does not exist

> `grep --count-unique` prints how many different matching lines a file has.

```bash
printf 'error\nok\nerror\n' > small.txt
grep --count-unique error small.txt
echo "exit status: $?"
```

```output
grep: unrecognized option '--count-unique'
Usage: grep [OPTION]... PATTERNS [FILE]...
Try 'grep --help' for more information.
exit status: 2
```

`grep` refuses, with exit status 2. Now search the real list of options:

```bash
grep --help | grep -e '--count'
```

```output
  -c, --count               print only a count of selected lines per FILE
```

`-e` tells the second `grep` that `--count` is the pattern, not an option. The real option is `--count`, and it counts matching lines, not different ones. For different lines, you already know the pipeline: `sort | uniq`.

:::caution[Invented packages]
Assistants also invent package names, for example a `pip install` of a library that sounds right but does not exist. Security researchers have shown that this is a real risk: an attacker can publish a package under a name that AI tools tend to invent, with harmful code inside. Before you install a package you have never heard of, look it up on [pypi.org](https://pypi.org/): check that it exists, who publishes it, how long it has been there and whether it links to real documentation.
:::

### 3. Advice that is out of date

> To get the current time in UTC, use `datetime.datetime.utcnow()`.

That was the usual answer for years, so it is everywhere in old code. Create `old_time.py`:

```python title="old_time.py"
import datetime

stamp = datetime.datetime.utcnow()
print(stamp.tzinfo)
```

```bash
python3 old_time.py
```

```output
/home/sam/ailab/trust/old_time.py:3: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
  stamp = datetime.datetime.utcnow()
None
```

The code still runs, but Python warns you. A **deprecated** feature still works but is planned for removal, usually because something better exists, and the warning names the replacement. The last line shows the real problem: `tzinfo` is `None`, so the result does not know it is UTC. Your path shows your own username instead of `sam`.

Now create `new_time.py` with the replacement from the warning:

```python title="new_time.py"
import datetime

stamp = datetime.datetime.now(datetime.UTC)
print(stamp.tzinfo)
```

```bash
python3 new_time.py
```

```output
UTC
```

No warning, and the time carries its time zone. The same happens outside Python. Many guides for Ubuntu still add software keys with `apt-key`:

```bash
apt-key list 2>&1 | head -n 1
```

```output
Warning: apt-key is deprecated. Manage keyring files in trusted.gpg.d instead (see apt-key(8)).
```

The tool itself says it is on the way out. When advice involves a tool or a library, check the official documentation for your version, and read warnings instead of scrolling past them.

### 4. Code that works and is not safe

> Here is a function to find all notes of one user:
>
> ```python
> def find_notes(owner):
>     query = f"SELECT body FROM notes WHERE owner = '{owner}'"
>     return [row[0] for row in con.execute(query)]
> ```

It works on every normal name. Put it in a small script with a database in memory, so nothing is written to disk:

```python title="notes_search.py"
import sqlite3
import sys

con = sqlite3.connect(":memory:")
con.execute("CREATE TABLE notes (owner TEXT, body TEXT)")
con.executemany("INSERT INTO notes VALUES (?, ?)", [
    ("sam", "buy coffee"),
    ("alex", "bank PIN hint"),
    ("alex", "exam draft"),
])


def find_notes(owner):
    query = f"SELECT body FROM notes WHERE owner = '{owner}'"
    return [row[0] for row in con.execute(query)]


print(find_notes(sys.argv[1]))
```

```bash
python3 notes_search.py sam
python3 notes_search.py "nobody' OR '1'='1"
```

```output
['buy coffee']
['buy coffee', 'bank PIN hint', 'exam draft']
```

The first run is the happy path, and it is correct. The second input is not a name: its quote ends the string inside the SQL, and `OR '1'='1'` is true for every row, so anyone who can type a name can read everybody's notes. This is **SQL injection**, the flaw from lesson 7.7 and Module 12. Every normal test passes, so only a reviewer who knows the danger catches it.

The fix is the placeholder you already know. Change the function:

```python
def find_notes(owner):
    query = "SELECT body FROM notes WHERE owner = ?"
    return [row[0] for row in con.execute(query, (owner,))]
```

<!-- lab: run
cd ~/ailab/trust
python3 - <<'EOF'
from pathlib import Path
p = Path("notes_search.py")
s = p.read_text()
s = s.replace('''    query = f"SELECT body FROM notes WHERE owner = '{owner}'"
    return [row[0] for row in con.execute(query)]''', '''    query = "SELECT body FROM notes WHERE owner = ?"
    return [row[0] for row in con.execute(query, (owner,))]''')
p.write_text(s)
EOF
-->

```bash
python3 notes_search.py sam
python3 notes_search.py "nobody' OR '1'='1"
```

```output
['buy coffee']
[]
```

Now the whole input is one value. Nobody is called `nobody' OR '1'='1`, so the answer is empty. SQL injection is one example. Watch for these in any AI-written code:

| Red flag | Why it is dangerous |
|---|---|
| Input glued into SQL or a shell command with an f-string or `+` | Injection: the input becomes code |
| `subprocess.run(..., shell=True)` with user input | The shell runs anything after a `;` |
| A password or key written in the code | Anyone who reads the code or the git history has it |
| `verify=False`, `chmod 777`, "turn off the firewall" | Removes a protection to make an error go away |
| `eval()` on text from outside | Runs any Python code it is given |

### 5. Check text before you paste it

You want help with a configuration problem and are about to paste your settings file. Create `app.env`:

```text title="app.env"
DATABASE=data/mylab.db
SECRET_KEY=3f9a1c7e5b2d8f40a6c1
ADMIN_EMAIL=sam@example.com
DEBUG=false
```

Search it for the words that usually mark something private:

```bash
grep -n -i -E 'key|password|secret|token|email' app.env
```

```output
2:SECRET_KEY=3f9a1c7e5b2d8f40a6c1
3:ADMIN_EMAIL=sam@example.com
```

`-i` ignores the difference between capital and small letters, and `-E` turns on extended patterns, where `|` means "or", as in the Module 9 project step. A secret key and a personal email address must not leave your computer. Make a copy that keeps the names and hides the values, the **redaction** from lesson 14.4:

```bash
sed -E 's/^([A-Z_]*(KEY|PASSWORD|SECRET|TOKEN|EMAIL)[A-Z_]*)=.*/\1=REDACTED/' app.env > app-share.env
cat app-share.env
```

```output
DATABASE=data/mylab.db
SECRET_KEY=REDACTED
ADMIN_EMAIL=REDACTED
DEBUG=false
```

`sed -E` uses the same extended patterns. The part in the outer parentheses matches a name that contains one of the words, and `\1` puts that name back, followed by `=REDACTED`. The assistant still sees the structure, which is what it needs to help, and the original file is unchanged.

The search finds only the words you listed, so read the shareable copy yourself before you paste it. If a real secret ever goes out by mistake, treat it as leaked and replace it.

## Exercise

An assistant suggests this function for a small tool. It should show the last lines of a log file whose name the user types.

```python
import subprocess

def show_log(name):
    subprocess.run(f"tail -n 3 logs/{name}", shell=True)
```

1. Which red flag from the table does it raise, and what could a user type to abuse it?
2. Rewrite it so that the name can only ever be one argument. Lesson 3.10 showed how.
3. Test your version with a normal name and with the name `x; echo HACKED`.

<details>
<summary>Show the solution</summary>

1. It glues user input into a shell command and runs it with `shell=True`. A name such as `x; echo HACKED` makes the shell run `tail` and then a second command. An attacker would put something far worse there.
2. Give the command as a list, without a shell. Each item is passed as one argument and nothing is read as a command:

```python title="show_log.py"
import subprocess
import sys


def show_log(name):
    subprocess.run(["tail", "-n", "3", f"logs/{name}"])


show_log(sys.argv[1])
```

3. A test with a normal name and with the attack:

```bash
mkdir -p logs
printf 'one\ntwo\nthree\nfour\n' > logs/app.log
python3 show_log.py app.log
python3 show_log.py "x; echo HACKED"
```

```output
two
three
four
tail: cannot open 'logs/x; echo HACKED' for reading: No such file or directory
```

The normal name shows the last three lines. The attack is now just a strange file name that does not exist: `tail` complains, and no second command runs. For an extra guard, refuse any name that contains `/`, so that nobody reads files outside `logs/`.

</details>

## Check yourself

**1. Why can an assistant write the name of a function that does not exist?**

<details>
<summary>Answer</summary>

It writes text that is likely to follow your question. A name that fits the pattern of real names is likely text, even when no such function exists. That is a hallucination.

</details>

**2. What is a knowledge cutoff, and why does it lead to outdated advice?**

<details>
<summary>Answer</summary>

The date up to which a model's training text goes. Anything that changed after it is unknown to the model, and old advice also appears much more often in its training text than new advice, so it tends to suggest the old way.

</details>

**3. The function `find_notes` returned the right notes for `sam`. Why was it still wrong?**

<details>
<summary>Answer</summary>

Because it glued the input into the SQL text. A crafted input such as `nobody' OR '1'='1` changed the query itself and returned everybody's notes. A placeholder keeps the input a value.

</details>

**4. What does a `DeprecationWarning` tell you?**

<details>
<summary>Answer</summary>

That the feature still works but is planned for removal, usually because something better exists. The warning often names the replacement, as the `utcnow()` warning did.

</details>

**5. You pasted a file with a real API key into an AI chat. What do you do?**

<details>
<summary>Answer</summary>

Treat the key as leaked: replace it with a new one where it was issued, so the pasted one stops working. Next time, search and redact the text before you paste it.

</details>

## Lesson map

```mindmap
When not to trust AI
  Made-up facts
    invented functions
    invented options
    invented packages
    check: the system itself
  Outdated advice
    knowledge cutoff
    deprecated features
    check: official docs
  Insecure code
    injection
    shell=True
    secrets in code
  Private data
    keys and passwords
    personal data
    check: grep, then redact
```

## Common mistakes

- **Trusting a confident tone.** A made-up answer sounds exactly as sure as a true one. Check with the system: `hasattr()`, `--help`, `man`, a one-line test.
- **Scrolling past warnings.** A `DeprecationWarning` is free advice from the people who make the tool. Read it.
- **Testing only with normal input.** Injection flaws pass every normal test. Try the input an attacker would type.
- **Pasting first, thinking later.** Search and redact before you paste. Once text is sent, you cannot take it back.

## Key terms

- **Knowledge cutoff**: the date up to which an AI model's training text goes. The model knows nothing that happened after it.
- **Deprecated**: still working, but planned for removal, usually because a better replacement exists.

## Go further

- [OWASP Top 10 for Large Language Model Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/): OWASP's list of the main risks of AI tools, from leaked data to trusting their output.
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html): why placeholders work and what else to do.
- [Python documentation: datetime](https://docs.python.org/3/library/datetime.html): the official reference, where you can see which functions are deprecated in your version.
