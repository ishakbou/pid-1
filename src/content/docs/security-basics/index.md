---
title: "Module 9: Security Fundamentals"
description: The ideas behind all security work, starting with ethics and law, then the goals of security, risk, access, people, malware and the security mindset.
module: 9
sidebar:
  order: 0
  label: Overview
---

This is the first module of the security part of the course, and it has almost no new tools. You use `grep`, `chmod`, `git` and short Python programs, which you already know, plus a few small helpers such as `stat` and `sha256sum` that the lessons explain as they appear. What is new is the way you look at all of them. By the end, you can look at any system, including your own `mylab`, and say what it protects, who could harm it, and what to fix first.

## Ethics and law

Only test systems you own or have written permission to test. Everything in this module runs on your own computer, in your own folders, with harmless practice files. Lesson 9.1 explains why this rule exists, what permission must contain, and what gets people into legal trouble. Read it first, even if you are in a hurry.

## What you will learn

- What you may test, what you may not, and how a written scope works.
- The three goals of security: confidentiality, integrity and availability.
- How assets, threats, vulnerabilities and risk differ, and how to rank risks by likelihood and impact.
- The difference between proving who someone is and deciding what they may do, and why least privilege limits damage.
- How social engineering and phishing trick people, and how to take a suspicious message apart.
- The main types of malware, and how signature-based and behavior-based detection find them.
- How to think like a defender: assets, attackers, defenses, and the inputs nobody expected.

## Before you start

You need the terminal from [Module 1](../linux/), especially permissions, pipes and `grep`, and [Module 3](../python/) for the short Python programs. Lesson 9.5 reads email headers and links, which is easier after HTTP and URLs in [Module 6](../networking/). The project step works on the `mylab` web app that you built in [Module 8](../web/).

## Time

8 lessons, about 2 hours 40 minutes of reading and practice.

## Module map

```mindmap
Security Fundamentals
  Rules first
    ethics and law
    scope and permission
  Goals and risk
    CIA triad
    threats and vulnerabilities
    likelihood times impact
  Access
    authentication
    authorization
    MFA
    least privilege
  Attacks
    social engineering
    phishing
    malware types
    signature and behavior
  Thinking like a defender
    security mindset
    allowlists
    threat model
```

## Lessons

1. 9.1 [Ethics and law first](../security-basics/ethics-and-law-first/): what you may test, what gets people into trouble, and how permission works.
2. 9.2 [The CIA triad](../security-basics/the-cia-triad/): confidentiality, integrity and availability, with one real failure of each.
3. 9.3 [Threats, vulnerabilities and risk](../security-basics/threats-vulnerabilities-and-risk/): tell the three apart, and rank risks by likelihood and impact.
4. 9.4 [Authentication vs authorization](../security-basics/authentication-vs-authorization/): who you are versus what you may do: passwords, MFA and least privilege.
5. 9.5 [Social engineering and phishing](../security-basics/social-engineering-and-phishing/): how attackers trick people, and how to spot and report a phishing message.
6. 9.6 [Types of malware and how defenders detect them](../security-basics/malware-and-detection/): viruses, worms, trojans, ransomware and spyware as concepts, plus signature and behavior detection.
7. 9.7 [The security mindset](../security-basics/the-security-mindset/): ask "how could this fail?" and think in assets, attackers and defenses.
8. 9.8 [Project step: a threat model for mylab](../security-basics/project/): list what mylab holds, who could attack it, and what you will fix in the next modules.

## Project step

Until now you built `mylab` to work. In this step you look at it as a defender. You collect facts with `ls`, `stat` and `git`, find the assets, and write `docs/threat-model.md`: the parts of the project, who could attack them, seven risks scored by likelihood and impact, and a plan for each one. One risk, a database file that every user can read, is fixed on the spot. The others are the to-do list of Modules 10 to 13.

## Cheat sheet

Everything from this module on one page: [Cheat sheet: Security concepts](../security-basics/cheat-sheet/).
