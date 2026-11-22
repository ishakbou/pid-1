---
title: Interview basics
description: Know the usual kinds of interviews and questions, answer behavior questions with STAR, solve a small coding question out loud, and practise without memorizing answers.
lesson: "16.5"
time: 25 min
sidebar:
  order: 5
---

"What happens when you type an address into your browser and press Enter?" It is one of the most common questions in technical interviews, and you already know the answer: DNS, TCP, TLS, HTTP, from Modules 6, 8 and 10. Knowing is not the hard part. The hard part is saying it clearly, in order, while someone watches you think. That is a skill you can practise like any other.

## Goal

After this lesson you can:

- Recognise the usual kinds of interviews and what each one checks.
- Answer a behavior question with the STAR structure, using a real story.
- Solve a small coding question out loud: clarify, give examples, write simple code, test it.

## Why it matters

An interview is a short sample of how you work. The interviewer cannot see your months of practice; they see twenty minutes of you explaining and solving. People who know a lot still fail interviews because they go silent, guess instead of asking, or recite an answer that does not fit the question. People who know less but think clearly out loud often do well. Preparation fixes most of this.

## The idea

Most entry-level hiring uses a few kinds of interviews, often in this order:

| Kind | Who you usually talk to | What it checks |
|---|---|---|
| **Screening call** | A recruiter or HR person, 15 to 30 minutes | Your motivation, basic fit, practical details |
| **Technical interview** | An engineer | Concepts, a small coding or troubleshooting task, how you think |
| **Behavior interview** | A manager or future teammate | How you worked in real situations: mistakes, teamwork, pressure |
| **Take-home assignment** | Nobody, then a discussion | A small task done at home, then explained by you |

For security roles, the technical part often includes a scenario: "You see 500 failed logins from one address in a minute. What do you do?" There is no single right answer. They want to hear your steps: confirm it in the logs, check whether any login succeeded, block or slow down the address, tell the right people, and write it down, as in Module 13.

**Prepare by understanding, not by memorizing.** A memorized answer is like a memorized route through a city: it works until one street is closed, and then you are lost. Understanding is like having the map in your head: if the question comes from a different side, you find another way. So for each topic, practise explaining it in your own words, out loud, and then answer the same question asked differently.

For **behavior questions** ("Tell me about a time when..."), use the **STAR** structure:

1. **Situation**: where and when, in one or two sentences.
2. **Task**: what you had to do.
3. **Action**: what *you* did. This is the longest part.
4. **Result**: what came out, ideally with a fact, and what you learned.

For **technical questions**, **think aloud**, which means you say what you are thinking while you work. The interviewer can follow you and help you, and a wrong turn that you notice and fix out loud counts in your favour. And when you do not know something, say so, then say what you do know and how you would find the rest. "I don't know how this tool stores it, but I would check its documentation, and I would expect a hash rather than the password itself" is a good answer.

## Try it

You build a small question bank, practise a coding question the way an interview goes, and write one STAR answer. The outputs come from a user called `sam`.

### 1. Build a question bank

```bash
mkdir -p ~/interview
cd ~/interview
```

```text title="questions.txt"
linux|What does chmod 640 do to a file?
linux|How do you find which program is listening on a port?
git|What is the difference between git revert and git reset?
python|When would you use a set instead of a list?
algorithms|Why is looking up a key in a dictionary usually faster than searching a list?
networking|What happens when you type an address into a browser and press Enter?
networking|What is the difference between TCP and UDP?
databases|What is SQL injection, and how do you prevent it?
crypto|What is the difference between hashing and encryption?
security|What is the difference between authentication and authorization?
security|You see 500 failed logins from one address in a minute. What do you do?
behavior|Tell me about a time you made a mistake.
behavior|Tell me about a project you are proud of.
behavior|Why do you want this role?
```

```bash
cut -d '|' -f 1 questions.txt | sort | uniq -c
```

```output
      1 algorithms
      3 behavior
      1 crypto
      1 databases
      1 git
      2 linux
      2 networking
      1 python
      2 security
```

Each line is a topic and a question, separated by `|`. `cut -d '|' -f 1` keeps the topic, and `sort | uniq -c` counts how many questions you have per topic, as in Module 1. Every technical question here is answered somewhere in this course. When a job advertisement mentions a topic, add questions for it.

### 2. Practise with random questions

<!-- lab: nocheck -->
```bash
shuf -n 3 questions.txt | cut -d '|' -f 2
```

```output
What is the difference between TCP and UDP?
Tell me about a project you are proud of.
What does chmod 640 do to a file?
```

`shuf` shuffles lines, and `-n 3` keeps three of them, so you get different questions each time. Yours will differ. Answer each one out loud, as if someone were listening, in about a minute. If you get stuck, that topic goes on your list to review, and you look it up in the lesson where it was taught, not in a list of ready answers.

### 3. Solve a coding question the interview way

The question: "Given a list of login events, each a pair of a username and whether the login worked, return the users with at least three failed logins."

Before writing code, ask. Does "at least three" include exactly three? Yes. In which order should the users come? Most failures first. What about an empty list? Return an empty list. Then turn the answers into examples you can run. A first try:

```python title="failed.py"
from collections import Counter


def users_to_check(events, limit=3):
    """Return the users with at least `limit` failed logins, most failures first."""
    failed = Counter(user for user, ok in events if not ok)
    return [user for user, count in failed.most_common() if count > limit]


events = [("sam", False), ("alex", True), ("sam", False),
          ("kim", False), ("sam", False), ("kim", False)]
assert users_to_check(events) == ["sam"]
assert users_to_check(events, limit=2) == ["sam", "kim"]
assert users_to_check([]) == []
print("all checks passed")
```

```bash
python3 failed.py
```

```output
Traceback (most recent call last):
  File "/home/sam/interview/failed.py", line 12, in <module>
    assert users_to_check(events) == ["sam"]
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError
```

The first example fails. Think aloud: sam has exactly three failures, and three should count, but the code says `count > limit`, which means "more than three". The question said "at least". This is the kind of mistake that examples catch in seconds, and that an interviewer is glad to see you catch yourself.

```bash
sed -i 's/count > limit/count >= limit/' failed.py
python3 failed.py
```

```output
all checks passed
```

`sed -i` changes the file in place: here it replaces `count > limit` with `count >= limit`. In an interview you would just edit the line. All three examples pass, including the empty list.

Finish the way interviewers like: say what the code costs. It goes through the list once to count, so the time grows with the number of events, O(n) in the notation of Module 4. Then the sorting inside `most_common` depends on the number of distinct users, which is usually much smaller.

### 4. Write a STAR answer from a real story

You already have a good story for "Tell me about a time you made a mistake": the `--status` option from the [Module 15 project step](../ai/project/), which passed every test and still did not work.

```text title="star-mistake.txt"
Situation: in my mylab project, I added a --status option to my log
analyzer with help from an AI assistant.

Task: the option had to list only the errors with one status code,
without changing the rest of the report.

Action: the tests passed, so I almost committed it. Then I ran the
real command, and it printed "Errors: 0" instead of 2. I made the
smallest example and found the cause: the command line gives "404" as
text, and the code compared it with the number 404. I wrote a test
that runs the tool the way a user does, saw it fail, then fixed the
type and a second problem that the change had caused.

Result: the option lists the 2 expected errors, the report without it
is unchanged, which I checked with diff, and 9 tests pass. What I
learned: tests written together with the code can share its mistake,
so I now test features the way they are used.
```

```bash
wc -w star-mistake.txt
```

```output
163 star-mistake.txt
```

About 160 words: a little over a minute out loud, which is a good length for a behavior answer. The action part is the longest, and it is all things *you* did. The result has facts (2 errors, `diff`, 9 tests) and a lesson. Notice that the story admits a real mistake. That is what the question asks for, and inventing a fake mistake that is secretly a strength ("I work too hard") is easy to see through.

:::tip[Prepare four stories, not forty answers]
Most behavior questions fit one of a few real stories: a mistake, a problem you solved, a time you worked with others, a time you learned something fast. Write one STAR text for each. Then, for each new question, pick the story that fits and tell it from the right angle.
:::

### 5. Prepare your own questions

At the end, most interviewers ask, "Do you have any questions for us?" Having two or three ready shows interest, and the answers help you decide too. Add them to your notes:

```text title="my-questions.txt"
What would a new person work on in the first month?
How are new people helped when they get stuck?
How is code reviewed in the team?
```

```bash
wc -l my-questions.txt
```

```output
3 my-questions.txt
```

After every interview, write down the questions you could not answer well. They are the most honest list of what to learn next.

## Exercise

Write a STAR answer for "Tell me about a project you are proud of", based on your own `mylab` or one of your write-ups from Module 14. Save it as `~/interview/star-project.txt`. Keep it under 250 words, and put at least one checkable fact in the result. Then check the length with `wc -w`, and say it out loud once with a timer.

<details>
<summary>Show the solution</summary>

One possible answer, saved in `~/interview`:

```text title="star-project.txt"
Situation: during my CS and security course, I built one project,
mylab, through every module instead of many small exercises.

Task: I wanted a small web app that I understood fully, and then to
make it safer step by step, the way a real team would.

Action: I wrote a Flask notes app with a login and an SQLite database.
I then stored the passwords as salted, slow hashes, tested the app
for injection, cross-site scripting and broken access control, and
fixed what I found, each fix with a test. I also wrote a log analyzer
that finds password guessing in the server logs.

Result: the repository has the app, the tests and short documents
that explain each security decision. What I am proud of is that I can
explain every line, and show the test that proves each fix.
```

```bash
wc -w star-project.txt
```

```output
140 star-project.txt
```

Your story will differ. Check that most sentences in the action part start with "I", that the result has something a listener could check (here: the tests and documents in the repository), and that every sentence is true for your own project.

</details>

## Check yourself

**1. What are the four parts of a STAR answer?**

<details>
<summary>Answer</summary>

Situation, Task, Action, Result. The action part, what you did yourself, is the longest.

</details>

**2. Why is a memorized answer risky in an interview?**

<details>
<summary>Answer</summary>

It works only when the question comes exactly as expected. Asked differently, or followed by "why?", a memorized answer breaks, while an answer you understand can be rebuilt from another side.

</details>

**3. What should you do before writing code for an interview question?**

<details>
<summary>Answer</summary>

Ask clarifying questions, such as edge cases and the expected order, and turn the answers into examples you can run. Then write a simple solution and test it on those examples.

</details>

**4. You are asked about a tool you have never used. What is a good answer?**

<details>
<summary>Answer</summary>

Say honestly that you have not used it, then say what you do know about the problem it solves and how you would find out the rest, for example from its official documentation.

</details>

**5. Why did the first version of `failed.py` fail, and what caught it?**

<details>
<summary>Answer</summary>

It used `count > limit`, "more than three", while the question asked for "at least three". The first example, where sam has exactly three failures, caught it.

</details>

## Common mistakes

- **Going silent.** Thinking quietly for a long time looks like being stuck. Say what you are considering, even if you are not sure yet.
- **Starting to code at once.** Ask first. A few questions about edge cases often decide the whole solution.
- **Bluffing.** Inventing an answer is worse than "I don't know, but...". Interviewers often ask a follow-up exactly to check.
- **"We did..." in a behavior answer.** The interviewer wants your part. Say what you did, and give the team credit for theirs.
- **No questions at the end.** It can look like a lack of interest. Prepare two or three real questions.

## Key terms

- **Screening call**: a short first interview, often with a recruiter, about motivation, fit and practical details.
- **Technical interview**: an interview where an engineer checks your knowledge and how you solve problems, often with a small task.
- **Behavior question**: a question about how you acted in a real past situation, such as "Tell me about a time you made a mistake".
- **STAR**: a structure for answering behavior questions: Situation, Task, Action, Result.
- **Thinking aloud**: saying what you are thinking while you solve a problem, so that the listener can follow and help.
- **Take-home assignment**: a small task you do at home for an employer, and then explain in an interview.

## Go further

- [Python documentation: collections.Counter](https://docs.python.org/3/library/collections.html#collections.Counter): the class used in `failed.py`, and what `most_common` returns.
- [OWASP Top 10](https://owasp.org/www-project-top-ten/): the list of common web application risks behind many security interview questions.
- [MDN: How the web works](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works): a clear walk through what happens between typing an address and seeing the page.
