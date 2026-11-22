---
title: "Module 17: Final Projects"
description: Finish mylab and one security project, then publish them, present them in five minutes and turn feedback into next steps.
module: 17
sidebar:
  order: 0
  label: Overview
---

You have built `mylab` one module at a time: scripts, a git history, Python tools, a web app, a threat model, a hardening record, write-ups. This last module adds no new topic. It turns what you made into something you can show: a polished project with a release, a second project with a security write-up, and a five-minute talk about your work. At the end, people who have never met you can see what you can do and check it for themselves.

## What you will learn

- How to polish a project: remove leftovers, run every check with one command, add screenshots, a reproducible demo and a licence.
- How to mark a release with an annotated git tag and a version number.
- How to choose a security project that is small, legal, measurable and your own, and build one: a web service locked down with a systemd sandbox.
- How to prove a result with a measured before and after, and write it up with its dead ends and limits.
- How to publish a release safely, present a project in five minutes, and ask for feedback you can use.

## Before you start

This module uses the whole course. You need `mylab` as you left it after the [Module 16 project step](../communication/project/), with its README. Lesson 17.1 builds on the tests from [Module 3](../python/), the write-up check from [Module 14](../labs-ctf/) and the AI log from [Module 15](../ai/). Lesson 17.2 uses the server from the [Module 6](../networking/) project step, `systemd-run` from [Module 5](../computers/) and the users and hardening of [Module 11](../system-security/); do it in your VM or lab machine, because it changes system settings. Lesson 17.3 pushes to the GitHub repository you created in [Module 2](../git/).

## Time

3 lessons, about 70 minutes of reading and practice, plus the time you spend rehearsing your talk and waiting for feedback.

## Module map

```mindmap
Final Projects
  Polish mylab
    remove leftovers
    check-all script
    screenshots
    demo
    licence
    tag v1.0.0
  Security project
    small, legal, measurable
    before and after
    systemd sandbox
    check script
    write-up
  Publish
    last check
    push the tag
    release notes
  Present
    five-minute talk
    rehearse
    feedback
    next steps
```

## Lessons

1. 17.1 [Polish mylab into a portfolio project](../final-projects/project/): clean the code, the tests and the README, and add screenshots and a short demo.
2. 17.2 [One security project with a write-up](../final-projects/one-security-project-with-a-write-up/): choose a project, for example a hardened home server, build it and document it.
3. 17.3 [Publishing and presenting your work](../final-projects/publishing-and-presenting-your-work/): put it online, present it in five minutes, and ask for feedback.

## Project step

In this module the project step comes first. In lesson 17.1 you clean up `mylab`, collect all its checks in `scripts/check-all.sh`, add two screenshots, a demo written by `scripts/demo.sh`, an MIT licence and an updated README, and tag the result as `v1.0.0`. Lesson 17.2 then starts a second repository, `hardened-server`, and lesson 17.3 publishes both, with release notes and a "Next steps" section shaped by the feedback you collect.

## Cheat sheet

Everything from this module on one page: [Cheat sheet: Project launch checklist](../final-projects/cheat-sheet/).
