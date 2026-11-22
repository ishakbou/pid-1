---
title: "Cheat sheet: README, CV and interview checklist"
description: The essentials of Module 16 on one page, from usage lines and bug reports to the README, CV, interview and certification checklists.
cheatSheet: true
sidebar:
  order: 99
  label: Cheat sheet
---

## Reading technical English

| Sign in a usage line | Meaning |
|---|---|
| `[ ]` | Optional |
| `...` | May be repeated |
| `UPPERCASE` or `<name>` | Placeholder: replace it with a real value |
| `a \| b` | Choose one |

| Word in an error | Meaning |
|---|---|
| missing / invalid | Not given / given in the wrong form |
| not found / permission denied | Does not exist / exists, but you may not use it |
| refused / timed out | The other side said no / no answer in time |

| Command | What it does |
|---|---|
| `ls --help \| head -n 1` | Show the usage line of a command |
| `whatis ls cp grep` | One-line description of each command |

## Bug report or question

Title with the symptom, then: steps to reproduce, expected, actual, environment, what you tried. Copy the exact error text. Check for vague words: `grep -n -i -w -E "thing|stuff|weird|broken|doesn't work" FILE`.

## Explaining a project

| Part | Content |
|---|---|
| Problem | What was wrong or missing, for whom |
| Approach | What you built, the two or three choices that mattered |
| Result | A number, an example or a demo that can be checked |
| If time | What you learned, what comes next |

Two minutes is about 250 to 300 words. `wc -w pitch.txt` counts them. `grep -o -w -E "[A-Z]{2,}" pitch.txt | sort -u` lists the abbreviations to explain.

## README

| Order | Part |
|---|---|
| First screen | Name and one sentence, example with real output, quick start |
| Then | Usage, files, tests, limits, license, contact |

| Check | How |
|---|---|
| Every named file exists | `grep -o -E` the backticked names, then `[ -e "$f" ]` in a `while read` loop |
| The example is real | Copy it from a run; compare with `diff` |
| The quick start works | Commit, `git clone` into a new folder, run its commands one by one |

## CV, LinkedIn, GitHub

- One page, one column, standard headings, PDF.
- Each project line: verb, what, number or link.
- No "expert", "passionate", "various": `grep -n -i -w -E "expert|advanced|passionate|hard-working|team player|various|etc" cv.md`.
- What your commits reveal: `git log --format='%an <%ae>' | sort -u`.
- GitHub: pin up to six repositories; a public repository named like your username shows its `README.md` on your profile; description and topics in the About box.
- LinkedIn: headline, About (your pitch), Featured links. Same story as the CV.

## Interviews

| Kind | Checks |
|---|---|
| Screening call | Motivation, fit, practical details |
| Technical | Concepts, a small task, how you think |
| Behavior | Real past situations |
| Take-home | A task done at home, then explained |

| STAR | Content |
|---|---|
| Situation | Where and when |
| Task | What you had to do |
| Action | What you did (the longest part) |
| Result | What came out, with a fact, and what you learned |

Coding question: ask, write examples, simple code, run it on the examples, then say what it costs. Think aloud. Practise with `shuf -n 3 questions.txt | cut -d '|' -f 2`. Prepare two or three questions to ask them.

## Certifications

| Area | Entry level, no experience required |
|---|---|
| IT support | CompTIA A+ |
| Networking | CompTIA Network+ (then Cisco CCNA) |
| Linux | LPI Linux Essentials (then LPIC-1, RHCSA) |
| Cloud | AWS Cloud Practitioner, Azure Fundamentals |
| Security | CompTIA Security+, ISC2 CC |

Later: CySA+, OSCP, GIAC; CISSP needs years of work experience. Decide with job ads: does the job ask for it, what will it teach, what does it cost, what would a project give instead? Count mentions: `grep -o -h -E "$certs" ads/*.txt | sort | uniq -c | sort -rn`. Check prices, versions and renewal on the official page.
