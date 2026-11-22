---
title: Giving clear instructions
description: Write requests to an AI assistant with four parts, context, goal, limits and an example, so that the answer fits your problem and is easy to check.
lesson: "15.1"
time: 20 min
sidebar:
  order: 1
---

Type "write me a log parser" into an AI assistant and you get an answer in seconds. It may be eighty lines long, use a library you have never installed, expect a log format you do not have, and print a report you did not want. The assistant did its best with five words. The problem was not the answer. It was the question.

## Goal

After this lesson you can:

- Write a request with the four parts that matter: context, goal, limits and an example.
- Collect the context from your own terminal instead of guessing it.
- Work out the expected result yourself, so that you can check the answer later.

## Why it matters

An assistant knows only what is in your message and in its training. It has never seen your files, your Python version or your teacher's rules. A vague request makes it fill the gaps with guesses, and each guess is a place where the answer can be wrong without telling you. A clear request also helps you: writing it forces you to decide what you want, and the example in it becomes the first test of the answer.

## The idea

Think of a skilled colleague who works for a company in another city. They are good at their job, they reply fast, and they will never see your screen. Everything they need must be in the message: what you have, what you want, what you do not want, and what "done" looks like. A request to an AI assistant works the same way. A request like this one is often called a **prompt**: the text you send to an AI model. It has nothing to do with the shell prompt from lesson 1.1, apart from the name.

A useful request has four parts:

| Part | Question it answers | Example |
|---|---|---|
| **Context** | What do I have? | Python 3.12 on Ubuntu, a log in the Common Log Format, two real lines from it |
| **Goal** | What exactly do I want? | A script that counts the requests per status code |
| **Limits** | What must the answer respect? | Standard library only, skip broken lines, short and readable |
| **Example** | What does a correct result look like? | The exact output I expect for my small sample |

Two of the parts are easy to forget.

**Limits** are the rules the answer must follow. Without them, the assistant picks its own: a package you cannot install at school, a clever one-liner you cannot read, a design that changes code you wanted to keep. Each limit you write removes one wrong answer before it is written.

**The example** is a small input together with the output you expect for it. It is the part that removes most guessing, because an assistant can misread a sentence but rarely misreads a concrete case. It also does a second job: when the answer comes back, you run it on the same input and compare. If you cannot write the expected output yourself, you are not ready to judge any answer, and that is useful to know before you ask.

Here is the difference on one request:

| Vague | Clear |
|---|---|
| "Write a log parser in Python." | "Here are two lines of my log (Common Log Format). Write a script that prints the number of requests per status code, most common first. Standard library only. Skip lines that are cut off. For my sample of 7 lines I expect `200: 2`, `401: 2`, `404: 1`, `500: 1`, `skipped: 1`." |

The clear version is longer, but it takes two minutes to write, and it saves you from reading a long answer to a question you never asked.

One more habit: end with "If anything is unclear, ask me before you write code." It costs nothing and invites the assistant to point at a gap instead of filling it with a guess.

## Try it

In this lesson you prepare a real request: the context comes from your terminal, and the expected result comes from tools you already trust. Sending it to an assistant is optional. The course never requires an AI.

### 1. Make a folder and a small sample

```bash
mkdir -p ~/ailab/requests
cd ~/ailab/requests
```

Create `sample.log` with these seven lines. They use the Common Log Format from the [Module 3 project step](../python/project/), and the addresses are reserved for documentation, so they belong to nobody.

```text title="sample.log"
203.0.113.5 - - [21/Nov/2026:09:58:01 +0000] "GET / HTTP/1.1" 200 1043
198.51.100.23 - - [21/Nov/2026:09:59:14 +0000] "POST /login HTTP/1.1" 401 92
198.51.100.23 - - [21/Nov/2026:09:59:15 +0000] "POST /login HTTP/1.1" 401 92
203.0.113.80 - - [21/Nov/2026:10:04:12 +0000] "GET /.env HTTP/1.1" 404 153
203.0.113.5 - - [21/Nov/2026:10:05:30 +0000] "GET /notes HTTP/1.1" 500 61
203.0.113.80 - - [21/Nov/2026:10:06:
198.51.100.23 - - [21/Nov/2026:10:06:02 +0000] "POST /login HTTP/1.1" 200 640
```

A small sample is better than the whole log. You can check a result for seven lines by eye, and you can paste seven lines into a message without sending anything private.

### 2. Collect the context

```bash
python3 --version
wc -l sample.log
```

```output
Python 3.12.3
7 sample.log
```

Your version may be newer. Copy what your own terminal prints, not what you think is installed: the assistant writes different code for different versions, and a guess here is a hidden mistake in the answer.

### 3. Find the lines that will cause trouble

```bash
awk 'NF != 10' sample.log
```

```output
203.0.113.80 - - [21/Nov/2026:10:06:
```

`awk` reads a file line by line, and `NF` is the number of fields, the pieces of the line between spaces. A complete log line has 10. This prints every line that does not, and one line is cut off. That is a fact your request must mention, because a script that expects ten pieces on every line will crash on it.

### 4. Work out the expected result yourself

```bash
cut -d ' ' -f 9 sample.log | sort | uniq -c | sort -rn
```

```output
      2 401
      2 200
      1 500
      1 404
      1 
```

This is the pipeline from lesson 1.7: `cut` takes the ninth field, the status code, then `sort` and `uniq -c` count each value. The last line has a count but no code: that is the cut-off line, which has no ninth field. So the correct answer for this sample is two `200`, two `401`, one `404`, one `500` and one skipped line.

You now know the answer before you ask. That sounds odd, but it is the point: on the real log you will not know it, and the small sample is how you find out whether the assistant's script can be trusted there.

### 5. Write the request

Create `request.md`:

```markdown title="request.md"
## Context
I am learning Python. I use Python 3.12.3 on Ubuntu.
I have a web server access log in the Common Log Format. Two lines from it:

    203.0.113.5 - - [21/Nov/2026:09:58:01 +0000] "GET / HTTP/1.1" 200 1043
    198.51.100.23 - - [21/Nov/2026:09:59:14 +0000] "POST /login HTTP/1.1" 401 92

## Goal
A script, status_counts.py, that takes the log file name as its only
argument and prints how many requests got each status code, most common first.

## Limits
- Standard library only: nothing to install.
- Some lines are cut off. Skip every line that does not have 10 fields,
  and print how many lines were skipped.
- Put the counting in a function, so that I can test it.
- Short and plain: I am a beginner and must understand every line.

## Example
For my sample of 7 lines, with one cut-off line, I expect:

    200: 2
    401: 2
    404: 1
    500: 1
    skipped: 1

When two codes have the same count, any order is fine.
If anything is unclear, ask me before you write code.
```

Every sentence has a job. The context gives the version and two real lines. The goal names the file, its argument and the output. The limits forbid the usual surprises. The example is the result from step 4, written in the format you want.

### 6. Check the request before you send it

```bash
grep '^## ' request.md
wc -w request.md
```

```output
## Context
## Goal
## Limits
## Example
177 request.md
```

`grep '^## '` lists the lines that start with `## `: all four parts are there. About 180 words is a normal size. A request does not need to be long, it needs to be complete.

If you have an assistant, send the request now and keep the answer. Do not run the code yet: the next lesson is about how to read and check it first.

:::tip[Keep your requests]
Save each request you send in a file next to your work, as you did here. When the answer is wrong, you can see whether the request was missing something. When it is right, you can reuse the request next time.
:::

## Exercise

A classmate sends an assistant this message: "Write a bash script that backs up my notes."

Rewrite it as a request with the four parts. First create a small practice folder and collect real context from your terminal:

```bash
mkdir -p ~/ailab/requests/notes
cd ~/ailab/requests
touch notes/linux.md notes/git.md
bash --version | head -n 1
ls notes
```

```output
GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)
git.md  linux.md
```

Then write the request in a file `backup-request.md`. Include at least two limits and the exact result you expect after one run.

<details>
<summary>Show the solution</summary>

Many requests are good. A good one names the shell and its version, the folder, the result, the limits and what one run should produce. For example:

```markdown title="backup-request.md"
## Context
Ubuntu, GNU bash 5.2. My notes are in ~/ailab/requests/notes:
two Markdown files, git.md and linux.md.

## Goal
A bash script, backup-notes.sh, that copies the whole notes folder
into ~/backups as one compressed archive with today's date in its name.

## Limits
- Only commands that come with Ubuntu (tar, date, mkdir).
- Never delete or change anything inside notes.
- Create ~/backups if it does not exist.
- Stop with a clear message if the notes folder is missing.

## Example
After one run on 21 November 2026 I expect one new file:

    ~/backups/notes-2026-11-21.tar.gz

and its content listed by tar -tzf should be notes/, notes/git.md
and notes/linux.md.

If anything is unclear, ask me before you write code.
```

```bash
grep -c '^## ' backup-request.md
```

```output
4
```

Notice the limit "never delete or change anything inside notes". A backup script that damages the thing it protects is the worst possible answer, so say so before it is written.

</details>

## Check yourself

**1. What are the four parts of a clear request?**

<details>
<summary>Answer</summary>

Context (what you have), goal (what exactly you want), limits (what the answer must respect) and an example (a small input with the output you expect).

</details>

**2. Why should you copy your Python version from `python3 --version` instead of writing it from memory?**

<details>
<summary>Answer</summary>

Because the assistant writes different code for different versions, and you may be wrong about what is installed. A wrong version in the context is a hidden mistake in the answer.

</details>

**3. The example in a request does two jobs. What are they?**

<details>
<summary>Answer</summary>

It tells the assistant exactly what a correct result looks like, which removes guessing. And it gives you a first test: you run the answer on the same input and compare with the output you expected.

</details>

**4. In step 4, why did `uniq -c` print a count with no status code after it?**

<details>
<summary>Answer</summary>

The cut-off line has no ninth field, so `cut` printed an empty line for it, and `uniq -c` counted that empty line. It is the line the script must skip.

</details>

**5. Why ask the assistant to ask questions before it writes code?**

<details>
<summary>Answer</summary>

So that it points at a gap in your request instead of filling it with a guess. A question costs you a minute. A guess can cost you a wrong answer that looks right.

</details>

## Common mistakes

- **Describing the data instead of showing it.** "My log has the usual format" leaves room for guesses. Paste two real lines from a sample with nothing private in it.
- **Asking for several things at once.** "Count the statuses, make a chart and send an email" gives a long answer that is hard to check. One goal per request.
- **No limits.** The assistant then chooses for you: a package, a style, a change to your other code. Write the rules down.
- **Not knowing the expected result.** If you cannot say what the right output is for a small sample, work it out first with tools you trust, as in step 4.
- **Pasting secrets as context.** A log or a config file can hold passwords and personal data. Use a small, clean sample. Lesson 15.4 shows how to check one.

## Key terms

- **Prompt (AI)**: the text you send to an AI model, such as a question or a request. Not the same as the shell prompt.
- **Context**: the facts the assistant needs about your situation, such as versions, files and sample data.
- **Limits**: the rules an answer must follow, such as "standard library only" or "do not change other functions". Also called constraints.
- **Expected output**: the result you know is correct for a given input, worked out before you look at any answer.

## Go further

- [Anthropic: Prompt engineering overview](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview): the official starting page from the makers of Claude, with links to their advice on clear requests, context and examples.
- [OpenAI: Prompt engineering guide](https://developers.openai.com/api/docs/guides/prompt-engineering): the same topic from the makers of ChatGPT. The advice is very similar, which tells you it is not tied to one product.
- [GNU Awk User's Guide: Fields](https://www.gnu.org/software/gawk/manual/html_node/Fields.html): how `awk` splits a line into fields and what `NF` means.
