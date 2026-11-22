---
title: Technical English for CS and security
description: Read usage lines, error messages and documentation words with confidence, and write a question or bug report that someone can act on.
lesson: "16.1"
time: 20 min
sidebar:
  order: 1
---

A message arrives in a team chat: "the login thing doesn't work, can someone fix it?" Nobody can. Which login, since when, and what does "doesn't work" mean: an error, a blank page, a wrong password accepted? Most of the English you need in this field is not about grammar. It is about saying exactly what happened, in words that everybody reads the same way.

## Goal

After this lesson you can:

- Read a usage line and an error message word by word, and know what each part means.
- Recognise the words that documentation and security reports use again and again.
- Write a question or bug report with steps, expected result and actual result.

## Why it matters

Almost all documentation, error messages, forums and security advisories in this field are written in English, including the ones made by people who speak something else at home. You will read far more technical English than you write, so reading it quickly saves you hours every week. And when you do write, a precise question often gets a quick answer, while a vague one gets more questions or silence.

## The idea

**Technical English** is a small part of the language with its own habits: short sentences, the same few hundred words again and again, and one meaning per word. It works like the signs in an airport. You do not need to speak the local language well to find your gate, because the same few words (Departures, Gate, Exit, Delayed) appear everywhere and always mean the same thing. Learn the words that repeat, and most texts open up.

There are three places where you meet it every day.

**Usage lines.** The first line of a command's help, or the `SYNOPSIS` in its manual page, follows a fixed code:

| Sign | Meaning | Example |
|---|---|---|
| `[ ]` | Optional: you may leave it out | `[FILE]` |
| `...` | You may repeat the item before it | `[OPTION]...` |
| `UPPERCASE` or `<name>` | A placeholder: you replace it with a real value | `SOURCE`, `<branch-name>` |
| `a \| b` | Choose one of them | `[-r \| -a]` in the help of `git branch` |

**Documentation words.** These appear in nearly every manual and API reference:

| Word | What it tells you |
|---|---|
| required / optional | You must give it / you may leave it out |
| default | The value used when you give nothing |
| returns | What a function gives back |
| raises (Python), throws (Java, JavaScript) | Which error it can produce |
| deprecated | Still works, but should no longer be used and may be removed in a later version: use the replacement |
| supported | Tested and promised to work |
| overrides | Replaces another setting that would apply otherwise |

**Security words.** A security report uses a fixed vocabulary too. From Module 9 you know two of them: a vulnerability is the weakness, and an exploit is a way to use it. The **impact** is what an attacker could do with it, and the **severity** is how bad that is, usually Low, Medium, High or Critical. A **mitigation** reduces the risk without removing the cause, and a **patch** fixes the cause. Known vulnerabilities get a public number called a **CVE**, such as `CVE-2014-0160`, the bug in OpenSSL known as Heartbleed. When a report says a version is "affected", that version has the weakness.

One concrete example of why exact words matter: "**sensitive** data" means data that must be protected, such as passwords or medical records. "Sensible data" means data that makes sense. If your first language is French or Spanish, the second one can slip out, because there it means the first. The next section has a few more of these.

## Try it

Make a folder for this lesson. The outputs come from a user called `sam`; you see your own name.

### 1. Read a usage line

```bash
mkdir -p ~/english
cd ~/english
ls --help | head -n 1
```

```output
Usage: ls [OPTION]... [FILE]...
```

Read it with the table from above. `[OPTION]...` means "zero or more options", and `[FILE]...` means "zero or more files". So `ls`, `ls -l` and `ls -l -a notes drafts` all fit this line. Nothing in it is required, which is why a bare `ls` works.

### 2. Read the alternatives

```bash
cp --help | head -n 3
```

```output
Usage: cp [OPTION]... [-T] SOURCE DEST
  or:  cp [OPTION]... SOURCE... DIRECTORY
  or:  cp [OPTION]... -t DIRECTORY SOURCE...
```

`or:` introduces another way to call the same command. The first line copies one `SOURCE` to a new name, `DEST`. The second line has `SOURCE...` with dots, so it copies several files into one `DIRECTORY`. Here `SOURCE` and `DEST` have no brackets: they are required. The help text below these lines explains each option, such as `-T` and `-t`.

### 3. Get the one-line meaning of a command

```bash
whatis ls cp grep
```

```output
ls (1)               - list directory contents
cp (1)               - copy files and directories
grep (1)             - print lines that match patterns
```

`whatis` prints the one-line description from each manual page. The `(1)` is the section of the manual: section 1 holds the commands that users type. These lines are a good model for your own writing: a verb, an object, nothing else.

### 4. Decode an error message

```bash
touch notes.txt
cp notes.txt
```

```output
cp: missing destination file operand after 'notes.txt'
Try 'cp --help' for more information.
```

Read it in three parts. Who complains: `cp`. What is wrong: a "destination file operand" is missing. An **operand** is a thing a command works on, here a file name, and the destination is where the copy goes. Where it noticed: after `notes.txt`, which it took as the source. Compare with the usage line from step 2: `SOURCE DEST`, and you gave only `SOURCE`.

Most error messages use a small set of words. Learn these and you can read nearly any of them:

| Word in the message | What it means |
|---|---|
| missing | Something required was not given |
| invalid | It was given, but in the wrong form |
| unexpected | The program found something it did not plan for at that place |
| not found | The name or path does not exist |
| permission denied | It exists, but you are not allowed |
| refused | The other side answered with "no", for example no program on that port |
| timed out | No answer came within the time limit |

### 5. Find the vague words in a bug report

A **bug report** is a written description of a problem, made so that someone else can find and fix it. Here is a bad one. Save it in `~/english` as `bug-report.txt`:

```text title="bug-report.txt"
Title: login broken

Hi, the login thing doesn't work anymore. I tried some stuff but
it's still weird. Can someone fix it ASAP?
```

```bash
grep -n -i -w -E "thing|stuff|weird|broken|doesn't work" bug-report.txt
```

```output
1:Title: login broken
3:Hi, the login thing doesn't work anymore. I tried some stuff but
4:it's still weird. Can someone fix it ASAP?
```

`-E` lets you list several words with `|`, `-i` ignores capitals, `-n` prints line numbers, and `-w` matches whole words only, so that "nothing" does not count as "thing". Three of four lines contain a word that says nothing a reader can check.

### 6. Rewrite it with steps, expected and actual

Replace the whole content of `bug-report.txt` with this version:

```text title="bug-report.txt"
Title: Login with the correct password returns 401

Steps to reproduce:
1. Start the app from the mylab folder: python3 app/app.py
2. Open http://127.0.0.1:5000/login
3. Log in as sam with the correct password.

Expected: the notes page opens.
Actual: the login page opens again, and the server prints "POST /login HTTP/1.1" 401.

Environment: Ubuntu 24.04, Python 3.12.
What I tried: a new private browser window gives the same result.
The user alex has the same problem.
```

```bash
grep -n -i -w -E "thing|stuff|weird|broken|doesn't work" bug-report.txt || echo "no vague words"
```

```output
no vague words
```

`grep` finds nothing, so it exits with a non-zero status and `||` runs the `echo`. The new report has the parts that every bug report needs. **Steps to reproduce** are the exact actions that make the problem appear. **Expected** says what should have happened, and **actual** says what happened instead. The gap between those two lines is the bug. "What I tried" saves the reader from suggesting what you already did.

The same shape works for a question on a forum or in a team chat: what you wanted, what you did, what you expected, what you got, and what you already tried.

## Exercise

A classmate sends you this message: "pip doesnt work on my ubuntu help". You sit next to them and find out the facts: on Ubuntu 24.04, outside any virtual environment, they typed `pip install flask`, and the first line of the answer was `error: externally-managed-environment`. They have not tried anything else.

Rewrite the message as a clear question that they could post. Use the parts from step 6, and keep it under ten lines. Then answer it yourself, using what you know from Module 3.

<details>
<summary>Show the solution</summary>

```text
Title: "externally-managed-environment" when I run pip install on Ubuntu 24.04

I want to install Flask for a small project.
What I did: pip install flask, in a normal terminal, no virtual environment.
Expected: Flask is installed.
Actual: the install stops, and the first line is:
error: externally-managed-environment
Environment: Ubuntu 24.04, Python 3.12.
What I tried: nothing yet.
```

Your wording may differ. What counts: the exact error text, copied rather than retold, what they expected, and the environment.

The answer: Ubuntu does not let `pip` install packages into the system's own Python, so that it cannot break the tools that Ubuntu itself needs. Create a virtual environment with `python3 -m venv .venv`, activate it with `source .venv/bin/activate`, and run `pip install flask` inside it, as in lesson 3.8, [Modules, pip and virtual environments](../python/modules-pip-and-virtual-environments/).

</details>

## Check yourself

**1. A usage line says `cp [OPTION]... SOURCE... DIRECTORY`. What do the brackets, the dots and the capitals mean?**

<details>
<summary>Answer</summary>

Brackets mark something optional, here the options. Three dots mean the item may be repeated, so you can give several sources. Capitals are placeholders that you replace with real names.

</details>

**2. What are the three most important parts of a bug report?**

<details>
<summary>Answer</summary>

The steps to reproduce, the expected result and the actual result. With these, someone else can make the problem appear on their own machine and see the gap between what should happen and what does.

</details>

**3. The documentation says an option is "deprecated". Should you use it in new code?**

<details>
<summary>Answer</summary>

No. It still works today, but you should no longer use it, and a later version may remove it. Use the replacement that the documentation names.

</details>

**4. What is the difference between a mitigation and a patch?**

<details>
<summary>Answer</summary>

A patch fixes the cause of a vulnerability. A mitigation only reduces the risk, for example by blocking access to the weak part, while the cause stays.

</details>

**5. Which word fits in a security report: "sensible data" or "sensitive data"?**

<details>
<summary>Answer</summary>

"Sensitive data": data that must be protected. "Sensible" means reasonable, and in French and Spanish it is a false friend.

</details>

## Common mistakes

- **Retelling an error instead of copying it.** "It says something about permissions" loses the details. Copy the exact message, with the command that produced it.
- **Writing "it doesn't work".** Say what you expected and what happened instead. That one change answers most of the follow-up questions.
- **False friends.** A few English words look like words in other languages but mean something else. "Actually" means "in fact", not "currently". "Eventually" means "in the end", not "possibly". "Sensible" is not "sensitive". When in doubt, look the word up in an English-only dictionary.
- **Long sentences with many "which".** Split them. Technical English rewards one fact per sentence.
- **Skipping the usage line.** Many errors, like the one in step 4, are explained by the first line of `--help`. Read it before you search the web.

## Key terms

- **Technical English**: the plain, exact style of English used in documentation, error messages and reports, with a small vocabulary that repeats.
- **Usage line**: the first line of a command's help, showing in a fixed code which parts are optional, repeatable or placeholders.
- **Operand**: a thing a command works on, such as a file name, as opposed to an option.
- **Bug report**: a written description of a problem with steps to reproduce, the expected result and the actual result.
- **Steps to reproduce**: the exact actions that make a problem appear, so that someone else can see it too.
- **Severity**: how serious a vulnerability is, usually rated Low, Medium, High or Critical.
- **Mitigation**: a step that reduces the risk of a vulnerability without removing its cause.
- **Patch**: a change to software that fixes a problem at its cause.
- **CVE**: a public ID number for a known vulnerability, in the form `CVE-year-number`.

## Go further

- [GNU Coreutils: Common options](https://www.gnu.org/software/coreutils/manual/html_node/Common-options.html): how the standard commands describe their options, a good place to practise reading reference English.
- [CVE Program](https://www.cve.org/): search a CVE number and read the short, standard description that comes with it.
- [Python documentation: Glossary](https://docs.python.org/3/glossary.html): the official meaning of the words Python's documentation uses, in plain technical English.
