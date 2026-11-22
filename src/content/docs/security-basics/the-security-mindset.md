---
title: The security mindset
description: Learn to ask "how could this fail?", to think in assets, attackers and defenses, and to test a small program with the inputs its author never expected.
lesson: "9.7"
time: 20 min
sidebar:
  order: 7
---

A developer tests the order form of a small online cake shop. One cake: correct price. Three cakes: correct price. The form works, so it goes live. A week later someone orders minus three cakes, and the shop's software happily refunds 12 euros to a stranger. The developer asked "does it work?". Nobody asked "how could it fail?". This lesson is about the second question.

## Goal

After this lesson you can:

- Look at a system and list its assets, its possible attackers and its defenses.
- Ask "how could this fail?" in a structured way, with the four questions of a threat model.
- Test a small program with unexpected inputs and fix it with an allowlist.

## Why it matters

Tools change every year, and the habit of thinking stays. Every lesson of this module was one piece of it: permission, the three goals, risk, access, people and malware. The **security mindset** ties them together: the habit of looking at anything, a program, a door or a process, and asking how someone could make it do what its owner never wanted. Employers look for this habit in interviews, and it makes you useful long before you know many tools.

## The idea

A builder and a burglar can look at the same house. The builder checks that the door opens, closes and keeps the rain out. The burglar checks how the door could be opened without the key: the hinges, the window next to it, the spare key under the plant pot. A security person learns to look with both pairs of eyes. You build things so that they work, and then you look at them again as someone who wants them to break.

### Three lists

Before you can say how something could fail, you need to know what you are looking at. Three lists, which you already met one by one, are enough:

| List | The question | For the cake shop |
|---|---|---|
| Assets | What is valuable here? | Money, customer addresses, the shop's reputation |
| Attackers | Who could want to harm it, and what can they reach? | A stranger on the internet who can fill in the form |
| Defenses | What stops them, and what notices them? | Checks on the order, a log of every payment |

Accidents belong on the attacker list too. A customer who types `30` instead of `3` by mistake breaks the shop the same way a cheater does.

### Every input is a door

The **attack surface** is every place where someone outside can reach your system: each form field, each open port, each file it reads, each person who can be phoned. An attacker does not need to find all the doors. One is enough. That is why the cake shop failed: the quantity field was a door, and nobody had checked where it led.

Three habits follow from this:

- **Never trust input.** Everything that comes from outside, a form, a file, a command-line argument, can be anything. Check it before you use it. This check is called **input validation**.
- **Allow, don't block.** An **allowlist** describes what is allowed and refuses everything else: "a whole number from 1 to 20". A **blocklist** tries to list what is forbidden: "not negative, not zero, not letters...". You will always forget something on a blocklist. An allowlist fails safe: what you did not think of is refused.
- **Use several layers.** **Defense in depth** means that one failed defense is not the end: validation in the form, a limit in the payment system, a log that someone reads, a backup. You saw it in lesson 9.2, where the checksum noticed the change and the backup repaired it.

### Four questions

Security teams write this kind of thinking down in a **threat model**: a short document about a system, what can go wrong with it and what will be done about it. A widely used method boils it down to four questions:

1. What are we working on?
2. What can go wrong?
3. What are we going to do about it?
4. Did we do a good enough job?

You will answer these four questions about `mylab` in the next lesson.

## Try it

You will write the cake shop's order function, attack it with strange inputs, and fix it. Everything runs on your own machine.

### 1. Write the first version

```bash
mkdir ~/mindset
cd ~/mindset
```

```python title="shop.py"
import sys

PRICE = 4  # one cake costs 4 euros


def order_total(quantity_text):
    quantity = int(quantity_text)
    return f"Total: {PRICE * quantity} euros"


print(order_total(sys.argv[1]))
```

The quantity arrives as text, exactly as it would from a web form. `sys.argv[1]` is the first word you type after the program's name.

### 2. Test it like the developer

```bash
python3 shop.py 1
python3 shop.py 3
```

```output
Total: 4 euros
Total: 12 euros
```

Both answers are correct. Many programs are tested exactly this far, and no further.

### 3. Test it like an attacker

Now ask "what did the author not expect?" and try those inputs.

```bash
python3 shop.py 0
python3 shop.py -3
python3 shop.py 1000000
```

```output
Total: 0 euros
Total: -12 euros
Total: 4000000 euros
```

An order of zero cakes is accepted. Minus three cakes gives a negative total, which a payment system may treat as money to send back. A million cakes is accepted too, and the bakery has no way to make them. None of this is a crash. The program does exactly what it was written to do, and that is the problem.

```bash
python3 shop.py abc 2>&1 | tail -n 1
```

```output
ValueError: invalid literal for int() with base 10: 'abc'
```

Text that is not a number makes the program crash. `2>&1` sends the error messages into the pipe together with the normal output, and `tail -n 1` keeps only the last line of the long error report. On a website, a crash like this can show internal details to the visitor or take a page down, which is an availability problem.

### 4. Fix it with an allowlist

Change `shop.py` so that it checks the input first:

```python title="shop.py"
import sys

PRICE = 4  # one cake costs 4 euros


def order_total(quantity_text):
    try:
        quantity = int(quantity_text)
    except ValueError:
        return "Refused: not a whole number"
    if quantity < 1 or quantity > 20:
        return "Refused: you can order from 1 to 20 cakes"
    return f"Total: {PRICE * quantity} euros"


print(order_total(sys.argv[1]))
```

The new version does not try to list every bad input. It describes the good ones, a whole number from 1 to 20, and refuses the rest with a clear message instead of a crash. The `try` and `except` are the error handling you learned in Module 3.

### 5. Run the attack again

```bash
for q in 3 0 -3 1000000 abc 2.5; do python3 shop.py "$q"; done
```

```output
Total: 12 euros
Refused: you can order from 1 to 20 cakes
Refused: you can order from 1 to 20 cakes
Refused: you can order from 1 to 20 cakes
Refused: not a whole number
Refused: not a whole number
```

One loop, six inputs, six safe answers. Notice `2.5`: you never thought about decimals, and the allowlist refused it anyway. That is what "fails safe" means. Keep this list of strange inputs. Each time you change the function, run it again, so an old hole cannot come back unnoticed.

### 6. Write the three lists

Thinking is easier on paper. Write the lists for the shop in a small file:

```text title="shop-model.txt"
ASSET: money from orders
ASSET: customer addresses
ATTACKER: stranger who fills in the order form
ATTACKER: customer who makes a typing mistake
DEFENSE: allowlist on the quantity (1 to 20)
DEFENSE: log of every order
```

```bash
cut -d: -f1 shop-model.txt | sort | uniq -c
```

```output
      2 ASSET
      2 ATTACKER
      2 DEFENSE
```

`cut -d: -f1` keeps the word before the colon, and `sort | uniq -c` counts each one. A list with assets and attackers but no defenses tells you exactly where your work is. Two defenses for two attackers is a start, not the end: the next lesson does the same for a real project, with more lines in every list.

## Exercise

A note reader shows a note from the `notes` folder. Create the practice files:

```bash
mkdir -p ~/mindset/notes
cd ~/mindset
echo "buy flour and eggs" > notes/today.txt
echo "the safe code is 4417" > secret.txt
```

```python title="notes.py"
import sys


def read_note(name):
    with open("notes/" + name) as f:
        return f.read()


print(read_note(sys.argv[1]), end="")
```

1. Check that `python3 notes.py today.txt` prints the note.
2. Think like an attacker: `secret.txt` is not in `notes`. Find an input that makes the program print it anyway.
3. Fix `read_note` with an allowlist: accept only names made of lowercase letters, digits and dashes, followed by `.txt`. Refuse everything else with the message `Refused: bad note name`.

<details>
<summary>Show the solution</summary>

```bash
python3 notes.py today.txt
python3 notes.py ../secret.txt
```

```output
buy flour and eggs
the safe code is 4417
```

`..` means "one folder up", as in Module 1. The program glued `notes/` and `../secret.txt` together into `notes/../secret.txt`, which leads out of the folder. This flaw is called path traversal, and Module 12 comes back to it.

```python title="notes.py"
import re
import sys


def read_note(name):
    if not re.fullmatch(r"[a-z0-9-]+\.txt", name):
        return "Refused: bad note name\n"
    with open("notes/" + name) as f:
        return f.read()


print(read_note(sys.argv[1]), end="")
```

```bash
for n in today.txt ../secret.txt /etc/passwd .txt; do python3 notes.py "$n"; done
```

```output
buy flour and eggs
Refused: bad note name
Refused: bad note name
Refused: bad note name
```

`re` is Python's module for patterns. In the pattern, `[a-z0-9-]` means "one lowercase letter, digit or dash", `+` means "one or more of them", and `\.txt` is a real dot followed by `txt`. `re.fullmatch` accepts the name only if the whole name fits the pattern. A slash or a dot anywhere else does not fit, so every path trick is refused, including ones you did not test. A blocklist such as "refuse names that contain `..`" would have missed `/etc/passwd`.

</details>

## Check yourself

**1. What is the difference between asking "does it work?" and asking "how could it fail?"**

<details>
<summary>Answer</summary>

"Does it work?" checks the inputs and actions the author expected. "How could it fail?" looks for inputs and actions the author did not expect, by mistake or on purpose, such as an order of minus three cakes.

</details>

**2. A form refuses quantities that are negative or zero. Is that an allowlist or a blocklist, and what can still go wrong?**

<details>
<summary>Answer</summary>

A blocklist: it lists what is forbidden. It still accepts a million cakes, and text such as `abc` may crash it. An allowlist, "a whole number from 1 to 20", refuses all of those at once.

</details>

**3. Name three parts of the attack surface of a small web app.**

<details>
<summary>Answer</summary>

Any three of: each form field, each page or URL it answers, the port it listens on, the files it reads, the database, and the people who run it and can be tricked.

</details>

**4. The quantity check is in place. Why would a security person still want a log of every order?**

<details>
<summary>Answer</summary>

Defense in depth. The check could have a bug, or someone could find another door. A log lets you notice a strange order and repair the damage, so one failed defense is not the end.

</details>

**5. What are the four questions of a threat model?**

<details>
<summary>Answer</summary>

What are we working on? What can go wrong? What are we going to do about it? Did we do a good enough job?

</details>

## Common mistakes

- **Testing only the happy path.** The inputs you expect are the ones least likely to break anything. Always add zero, negative, huge, empty and not-a-number cases.
- **Fixing one input at a time.** Refusing `-3` after someone used it leaves `-4` open. Describe what is allowed instead.
- **Checking only in the browser.** A check in the page can be skipped by anyone who sends the request themselves, for example with `curl`. The server must check again.
- **Thinking like an attacker against other people's systems.** The mindset is for your own systems and the ones you have permission to test, as lesson 9.1 explains.
- **Stopping at one defense.** Every defense fails sometimes. Ask what notices the failure and what repairs it.

## Key terms

- **Security mindset**: the habit of asking how something could fail or be misused, not only whether it works.
- **Attack surface**: every place where someone outside can reach a system, such as inputs, ports, files and people.
- **Input validation**: checking that data from outside has the expected form before using it.
- **Allowlist**: a rule that names what is allowed and refuses everything else.
- **Blocklist**: a rule that names what is forbidden and allows everything else.
- **Defense in depth**: using several layers of defense, so that one failure does not lead to harm.
- **Threat model**: a short document that describes a system, what can go wrong with it and what will be done about it.

## Go further

- [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/): the four questions and the values behind them, written by people who do this for a living.
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html): why allowlists beat blocklists, with examples for real apps.
- [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html): how teams run a threat model step by step.
