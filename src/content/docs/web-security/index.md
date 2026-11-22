---
title: "Module 12: Web Security"
description: Learn the most common web flaws from the OWASP Top 10, see injection, XSS, broken access control and misconfiguration work on your own practice apps, and fix them in mylab with tests.
module: 12
sidebar:
  order: 0
  label: Overview
---

Your `mylab` notes app works: people can log in, write notes and delete them. This module asks a different question: what happens when someone uses it in a way you did not plan? You learn the flaws that attackers find most often in web apps, you watch each one work against small practice apps on your own computer, and then you close the same doors in `mylab` and leave tests behind that prove they stay closed.

## Ethics and law

Only test systems you own or have written permission to test. Every attack in this module runs on your own computer, against `127.0.0.1`: the practice scripts you write, your own `mylab`, and OWASP Juice Shop, an app built to be attacked. PortSwigger's labs are hosted practice targets whose owner invites you to attack them. Typing `' OR 1=1 --` into a real website, or changing a number in someone else's URL to see what happens, is an attack even when you mean no harm. Lesson 9.1 explains the rules; read it again if you skipped it.

## What you will learn

- What the OWASP Top 10 is, what its ten categories mean, and how to name a flaw you find.
- How SQL injection and command injection happen, and how parameterized queries and argument lists stop them.
- How text from a user becomes a script in a page (XSS), and how escaping and a content security policy prevent it.
- Why "logged in" is not the same as "allowed", and how to check the owner and the role on every request.
- How debug mode, files served by accident, default passwords and missing headers leave an app open.
- How to practice legally on Juice Shop and PortSwigger Web Security Academy.
- How to review code for these flaws, prove them with tests that fail, fix them, and watch the tests pass.

## Before you start

You need the terminal and pipes from [Module 1](../linux/), branches and commits from [Module 2](../git/), and Python with pytest from [Module 3](../python/). SQL and placeholders come from [Module 7](../databases/), and HTTP, curl, Flask, templates and sessions from [Module 6](../networking/) and [Module 8](../web/). Authentication and authorization are explained in [Module 9](../security-basics/). The project step continues `mylab` as you left it after [Module 11](../system-security/).

Lessons 12.1 to 12.5 and the project step run on any Linux, including WSL and GitHub Codespaces. Lesson 12.6 needs Docker, which you install in the lesson.

## Time

7 lessons, about 2 hours 25 minutes of reading and practice.

## Module map

```mindmap
Web Security
  Naming flaws
    OWASP Top 10
    categories and CWEs
    writing a finding
  Injection
    SQL injection
    placeholders
    command injection
    XSS and escaping
    content security policy
  Access control
    logged in vs allowed
    IDOR
    admin pages
    deny by default
  Misconfiguration
    debug mode
    files served by accident
    default passwords
    security headers
  Practice
    Juice Shop
    PortSwigger labs
    tests that prove fixes
```

## Lessons

1. 12.1 [The OWASP Top 10 explained](../web-security/the-owasp-top-10-explained/): the most common web risks in plain English, and how to read the list.
2. 12.2 [Injection](../web-security/injection/): how SQL injection works against your own local copy of mylab, and how parameterized queries stop it.
3. 12.3 [Cross-site scripting (XSS)](../web-security/xss/): how untrusted text becomes code in a page, and how escaping and a content security policy prevent it.
4. 12.4 [Broken access control](../web-security/broken-access-control/): when users reach data that is not theirs, and why every request needs a permission check.
5. 12.5 [Security misconfiguration](../web-security/security-misconfiguration/): debug mode, default passwords, missing headers and other doors left open.
6. 12.6 [Practice in OWASP Juice Shop and PortSwigger Academy](../web-security/practice-labs/): run Juice Shop on your own machine and choose your first labs.
7. 12.7 [Project step: fix these flaws in your own mylab app](../web-security/project/): find and fix injection, XSS and access control bugs in mylab, and add tests that prove it.

## Project step

A classmate sends three new features for `mylab`: a search page, a page for each note, and line breaks in the text of a note. Each one hides a flaw from this module. You review the code with grep, prove each flaw with curl as the user alex, and write `tests/test_security.py`, whose tests fail while the flaws are there. Then you fix the code with placeholders, escaping and an owner check, add security headers to every page, watch the tests pass, and mark risks R4 and R5 of your threat model as done.

## Cheat sheet

Everything from this module on one page: [Cheat sheet: Web flaws and their fixes](../web-security/cheat-sheet/).
