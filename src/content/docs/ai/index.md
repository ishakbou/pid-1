---
title: "Module 15: Building with AI the Right Way"
description: Use an AI assistant as a tool whose work you check, not as a source you trust blindly, from writing the request to recording how you tested the result.
module: 15
sidebar:
  order: 0
  label: Overview
---

An AI assistant can write a script faster than you can read the question twice. That makes it very useful and a little dangerous, because a fast answer is not a checked answer. In this module you learn to ask precisely, to review AI-written code like a teammate's change, to debug with an assistant without being led in circles, and to spot the answers you must never accept unchecked. At the end you add a real feature to `mylab` this way and write down how you know it works.

## What you will learn

- How to write a request with context, a goal, limits and an example, and how to collect the context from your own terminal.
- A four-step routine to review AI-written code: read every line, run it on your example, test the edge cases, decide.
- How to ask for help with a bug: the full error, a minimal reproduction, what you tried, and three checks for any suggested fix.
- Where AI answers fail most often: made-up facts, outdated advice, insecure code and private data, with a command to check each one.
- How to add an AI-assisted feature to `mylab` and record the checks in `docs/ai-log.md`.

## Before you start

This module uses most of what came before, because you can only judge an assistant's work in a field you know yourself. You need the terminal and pipes from [Module 1](../linux/), `git diff` and commits from [Module 2](../git/), and Python with tests, `argparse` and `subprocess` from [Module 3](../python/). Lesson 15.3 builds on text encodings from [Module 5](../computers/), and lesson 15.4 on placeholders and SQL injection from [Module 7](../databases/) and [Module 12](../web-security/) and on redaction from [Module 14](../labs-ctf/). Lesson 0.6 in [Module 0](../start-here/) was about learning with AI; this module is about building with it.

You do not need an AI assistant to do this module. Every answer to review is given in the lessons, so that everybody checks the same code. If you have an assistant, you can send the requests and review its real answers with the same steps.

## Time

5 lessons, about 2 hours of reading and practice.

## Module map

```mindmap
Building with AI
  Asking
    context
    goal
    limits
    example
  Checking
    read every line
    run the example
    edge cases
    tests
  Debugging
    full error
    minimal reproduction
    verify the fix
    regressions
  Not trusting
    made-up facts
    outdated advice
    insecure code
    private data
  mylab
    status filter
    AI log
```

## Lessons

1. 15.1 [Giving clear instructions](../ai/giving-clear-instructions/): context, goal, limits and examples: write requests that get useful answers.
2. 15.2 [Reading and checking AI-written code](../ai/reading-and-checking-ai-written-code/): read every line, run it, test it, and look for the usual mistakes.
3. 15.3 [Debugging with AI](../ai/debugging-with-ai/): give the error, the code and what you tried, then verify the fix yourself.
4. 15.4 [When not to trust AI](../ai/when-not-to-trust-ai/): made-up facts, outdated advice, insecure code and private data.
5. 15.5 [Project step: one AI-assisted feature, reviewed](../ai/project/): add one small feature to mylab with AI help, and write down how you checked it.

## Project step

You add a `--status` option to the log analyzer in `mylab`, so that `--status 404` lists only the errors with that code. The assistant's change passes every test and still does not work: you find out by running it the way a user does, trace the cause to a string that should have been a number, write a test that fails on the bug, and fix it without changing the rest of the report. Then you write `docs/ai-log.md`, a short record of what you asked, what you got, how you checked it and what you changed.

## Cheat sheet

Everything from this module on one page: [Cheat sheet: Working with AI checklist](../ai/cheat-sheet/).
