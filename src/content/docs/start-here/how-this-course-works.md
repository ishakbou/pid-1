---
title: How this course works
description: See how every lesson is built, what the mylab project is, and how the site remembers which lessons you have finished.
lesson: "0.1"
time: 15 min
practiceTerminal: true
sidebar:
  order: 1
---

You watch a two-hour tutorial. You nod the whole way through. A week later you sit in front of an empty screen and cannot repeat any of it. That is not a memory problem. Watching is not practice, and this course is built so that you practice on every page.

## Goal

After this lesson you can:

- Find your way around any lesson: where to read, where to type and where to test yourself.
- Say what the `mylab` project is and how it grows during the course.
- Mark a lesson as done, and explain where that mark is kept.

## Why it matters

Every lesson in this course has the same shape. Learn the shape once, here, and you never have to think about it again: your attention goes to the content. You also need to know how your progress is saved, because it is saved in an unusual place, and people who do not know that lose it.

## The idea

Think of a cookbook that you actually cook from. You do not read forty recipes and then call yourself a cook. You read one, you make the dish, you taste it, and you notice what went wrong. This course works the same way. Every lesson is one recipe: a short explanation, then your hands on the keyboard.

### How the course is cut up

The course has three parts: Foundations, Cybersecurity and Career. The parts hold 18 modules, numbered 0 to 17. A **module** is a group of lessons about one subject, such as Linux, Python or networking.

Lessons carry two numbers. Lesson 1.2 is module 1, lesson 2. You are reading lesson 0.1 now. Follow the numbers in order, because each lesson uses what the earlier ones taught.

Every module has the same four kinds of pages:

| Page | What it is for |
|---|---|
| Overview | What the module teaches, what you need first, how long it takes |
| Lessons | One idea each, 10 to 25 minutes |
| Project step | The last lesson of the module. You add something real to your project |
| Cheat sheet | One page with the essentials, made to be printed |

A **cheat sheet** is for looking things up later, not for learning.

### How a lesson is cut up

Each lesson has the same parts, always in the same order.

| Part | What you do there |
|---|---|
| Goal | Read what you will be able to do at the end |
| Why it matters | Read the real reason this is worth your time |
| The idea | Read the explanation, with one example |
| Try it | Type commands, step by step, and compare with the real result |
| Exercise | Solve a task alone. The solution is hidden until you ask for it |
| Check yourself | Answer a few questions. The answers are hidden too |
| Common mistakes | See what usually goes wrong and how to fix it |
| Key terms | Find the new words of the lesson with short definitions |
| Go further | Free, trustworthy pages for when you want more |

The first three parts are reading. The next three are doing. The last three are for looking things up later. If you are short on time, never cut the middle. The middle is the lesson.

Every key term also lands in the **glossary**, one page with all the terms of the course in alphabetical order.

### One project from start to finish

Small exercises disappear when the lesson ends. So next to them, you build one thing that stays: a folder on your computer called `mylab`. Each module ends with a **project step**, a short lesson where you add a piece to it.

| Module | What you add to `mylab` |
|---|---|
| 1 | The folders and your first small scripts |
| 2 | A history of every change, and a copy online |
| 3 | Programs written in Python, including one that reads log files |
| 6 to 8 | A small web application with a database |
| 10 to 12 | Security: safe password storage and fixes for common web flaws |
| 13 | Logging and monitoring |
| 17 | The final polish, so you can show it to other people |

The modules that are not in the table add smaller pieces, such as notes and short documents about your project.

Some of these words may mean nothing to you yet. The point is the direction: at the end you own one project that you built, broke and secured yourself, and that you can explain line by line.

### How your progress is saved

At the bottom of every lesson you can mark the lesson as done. Do it when you finish. The Home page then shows how far you are in each module. When every lesson of the course is marked as done, the Certificate page gives you a certificate with your name on it.

There is no account and no login. The marks are kept in your browser's **local storage**, a small notebook that a browser keeps for each website, on your own device. Nothing is sent anywhere. This has three consequences:

- Another browser, or another device, starts from zero.
- A private or incognito window forgets everything when you close it.
- If you clear the browsing data of this site, your marks are gone.

The marks are only a reminder of where you stopped. What you learned stays in your head and in `mylab`, and no browser can erase those.

## Try it

A terminal is a window where you type commands as text, and the computer answers as text. Linux is the system that runs most of the world's servers, and it is the system this course teaches.

This lesson has a **practice terminal**: a small Linux computer that runs inside this page. You can type real commands into it and nothing on your own computer changes. Lesson 0.3 explains what it is and what its limits are. For now you only need it for one line.

### 1. Read a command block

```bash
echo "I am ready"
```

```output
I am ready
```

This is how every lesson shows work. The first box is what you type, followed by the Enter key. The second box is what the computer prints back. Here the command is `echo`, which repeats the text you give it.

When your screen and the second box show the same thing, you are on track. When they differ, you have found something to investigate, and that is where most of the learning happens.

### 2. Type the command yourself

Find the practice terminal on this page. If it is hidden, open it with its button. Wait until a line appears with a blinking cursor. The first start can take a little while, because your browser has to download the small Linux. Click inside the panel, type the command from step 1 exactly as shown, quotes included, and press Enter.

You should see `I am ready` on the next line. That is the first command of the course, and you ran it on a real Linux.

Type it, do not paste it. Typing is slower, and that is the point: your fingers learn the commands, and your eyes learn to see the small details, such as a space or a quote.

### 3. Make a mistake on purpose

<!-- lab: nocheck -->
```bash
ecko "I am ready"
```

This time the computer answers that it cannot find a command called `ecko`. The exact words depend on the system, but the meaning is always the same: that name does not exist. A full Ubuntu, which you install in lesson 0.4, even guesses that you meant `echo`.

Nothing broke and nothing was deleted. The terminal simply waits for your next command. An error message is the computer telling you what it did not understand. You will see hundreds of them in this course. Read them slowly: they usually say what is wrong.

### 4. Open a hidden answer

Scroll down to "Check yourself" and click the word "Answer" under the first question. The answer opens. Click again and it closes.

All solutions and answers in the course work like this. They are closed so that you can think first. An exercise that you solve after ten minutes of struggle teaches more than five exercises where you read the solution straight away.

### 5. Mark this lesson as done

Go to the bottom of this page and mark the lesson as done. Then open the Home page: Module 0 now counts one finished lesson.

Reload the page. The mark is still there, because your browser wrote it into its local storage. Come back here and finish the rest of the lesson. It is fine to mark it first this one time.

## Exercise

Two small tasks.

1. Open lesson 1.2, [Files and navigation](../linux/files-and-navigation/), in a new tab. Do not study it yet. Use what you know about the shape of a lesson to find four facts in less than two minutes: the estimated time, the number of steps in "Try it", the number of questions in "Check yourself", and the first word in "Key terms".
2. In the practice terminal, make the computer print your first name.

<details>
<summary>Show the solution</summary>

1. The time is shown at the top of the lesson: 20 minutes. "Try it" has 8 numbered steps. "Check yourself" has 5 questions. The first key term is "Directory". You did not need to understand the lesson to find them, because you knew where to look.

2. Use `echo` with your name between the quotes. With the name Sam:

```bash
echo "Sam"
```

```output
Sam
```

</details>

## Check yourself

**1. What does the lesson number 3.4 tell you?**

<details>
<summary>Answer</summary>

It is lesson 4 of module 3. The first number is the module, the second is the position of the lesson inside it.

</details>

**2. A lesson shows two boxes, one right after the other. The first contains `echo "hello"` and the second contains `hello`. Which one do you type?**

<details>
<summary>Answer</summary>

Only the first. It is the command. The second box is the output: what the computer prints after you press Enter. You compare it with your own screen.

</details>

**3. You marked ten lessons as done on your laptop. On your phone, the Home page shows no progress at all. What happened?**

<details>
<summary>Answer</summary>

Nothing is lost. The marks are kept in the local storage of the browser on your laptop. Your phone has its own browser with its own, empty storage. There is no account that could carry the marks from one device to the other.

</details>

**4. What is `mylab`, and when do you work on it?**

<details>
<summary>Answer</summary>

It is one folder on your computer that holds the project you build during the whole course. You add to it in the project step, the last lesson of each module.

</details>

## Common mistakes

- **Reading without typing.** A lesson that you only read feels clear and is gone in three days. Run every command of "Try it", even the ones that look obvious.
- **Opening the solution first.** The exercise then becomes a reading task. Try for ten minutes, then look.
- **Skipping the project steps.** They look optional and they are not. Later modules continue from the `mylab` that the earlier ones built.
- **Counting on the marks.** They live in one browser on one device. If you study on two devices, keep your own short note of where you stopped.
- **One ten-hour Sunday.** One or two lessons a day, a few days a week, leave much more behind than one long session.

## Key terms

- **Module**: a group of lessons about one subject. The course has 18, numbered 0 to 17.
- **Project step**: the last lesson of a module, where you add something to `mylab`.
- **mylab**: the folder, and later the online repository, that holds the project you build during the whole course.
- **Practice terminal**: a small Linux that runs inside a lesson page, in your browser, for typing commands.
- **Cheat sheet**: one page with the essentials of a module, for looking things up quickly.
- **Glossary**: the page that lists every key term of the course in alphabetical order.
- **Local storage**: a small space where a browser keeps data for one website, on your own device. The course keeps your "done" marks there.

## Go further

- [Creative Commons BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/): the licence of these lessons, in plain words. It says what you may do with the course: share it and adapt it with credit, but not sell it.
- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API): how local storage really works. It is written for web developers, so keep it for after Module 8.
