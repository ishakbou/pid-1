---
title: Certification roadmap overview
description: Know the main families of IT and security certifications, which ones help a beginner and which can wait, and decide by reading real job advertisements instead of rankings.
lesson: "16.6"
time: 20 min
sidebar:
  order: 6
---

Search for "best cybersecurity certification" and you get a hundred lists, each with a different winner. Many of them are written by people who sell training for the certificate at the top. This lesson does not crown a winner. It gives you a map of the main families, a simple way to tell which ones help a beginner, and a method to decide with evidence: the job advertisements in the place where you want to work.

## Goal

After this lesson you can:

- Name the main families of certifications for IT, networking, Linux, cloud and security, and their levels.
- Tell which certifications suit a beginner and which need years of experience first.
- Read job advertisements to decide which certification, if any, is worth your money now.

## Why it matters

Certifications cost money, often a lot of it, and weeks of study. Some job advertisements, and some employers' HR filters, do ask for them, and the right one at the right time can get your CV past that first filter. The wrong one at the wrong time costs you months that projects would have used better. Knowing the map lets you spend once, on purpose.

## The idea

A **certification** is a title you earn by passing a formal exam set by a certifying organisation, such as CompTIA or Cisco, which says that you met a known, published standard. It is not the same as a **certificate of completion**, which only says that you finished a course, without such an exam. Many certifications expire after a few years unless you renew them, by earning credits for further learning or by passing a newer exam, and the renewal often has a yearly fee.

A certification is like a driving licence. It proves that you passed a test on a given day, and some jobs require one. But nobody hires a driver only for the licence: they want to know that you can drive. For you, the driving is your projects.

The families below are the ones you will meet most often. Levels and requirements are as stated by the organisations at the time of writing; prices and exam versions change, so check the official page before you pay.

| Area | Entry level | Next level, later |
|---|---|---|
| IT support | CompTIA A+ | |
| Networking | CompTIA Network+ | Cisco CCNA |
| Linux | LPI Linux Essentials | LPIC-1, CompTIA Linux+, Red Hat RHCSA |
| Cloud | AWS Certified Cloud Practitioner, Microsoft Azure Fundamentals | The associate-level certifications of each cloud |
| Security | CompTIA Security+, ISC2 Certified in Cybersecurity (CC) | CompTIA CySA+, then advanced ones |

A few points that do not change quickly:

- **Vendor-neutral or vendor-specific.** CompTIA, ISC2 and LPI are not tied to one product. Cisco, Red Hat, AWS and Microsoft certify their own products. Both kinds are useful; vendor-specific ones matter most where that vendor's products are used.
- **Hands-on or multiple choice.** Most entry exams are mostly multiple-choice questions, sometimes with a few short simulated tasks. Some, such as Red Hat's RHCSA and OffSec's OSCP, are practical: you solve tasks on real systems during the exam. Practical exams are harder to pass by memorizing.
- **The ones that can wait.** ISC2's CISSP requires several years of paid work experience in security before you can hold it. OffSec's OSCP has no formal requirement, but it assumes solid hands-on skills and is a long practical exam. SANS training with GIAC exams is respected and usually far more expensive, so it is often paid for by an employer. All of these are for later, not for your first year.

The decision itself has four questions:

1. Do the jobs you want ask for it? Read real advertisements, as in the next part.
2. Will it teach you something you lack, or only confirm what you know?
3. What does it cost, in money, time and renewal?
4. What would the same time give you as a project?

## Try it

You compare a list of certifications with a set of job advertisements. The advertisements are invented for this lesson, but they follow the patterns of real ones. The outputs come from a user called `sam`.

### 1. Make a small table of certifications

```bash
mkdir -p ~/certs/ads
cd ~/certs
```

```text title="certs.csv"
name,area,level,experience_required
CompTIA A+,IT support,entry,no
CompTIA Network+,networking,entry,no
CompTIA Security+,security,entry,no
ISC2 CC,security,entry,no
LPI Linux Essentials,linux,entry,no
AWS Cloud Practitioner,cloud,entry,no
Cisco CCNA,networking,associate,no
Red Hat RHCSA,linux,associate,no
CompTIA CySA+,security,intermediate,no
OffSec OSCP,security,advanced,no
ISC2 CISSP,security,advanced,yes
```

A CSV file, as in Module 3: one row per certification, values separated by commas. `experience_required` says whether you must prove work experience to hold the title. "No" does not mean "easy": OSCP requires no experience on paper, but few beginners pass it.

### 2. Filter for the beginner-friendly ones

```bash
grep ',entry,no$' certs.csv | cut -d , -f 1,2
```

```output
CompTIA A+,IT support
CompTIA Network+,networking
CompTIA Security+,security
ISC2 CC,security
LPI Linux Essentials,linux
AWS Cloud Practitioner,cloud
```

`,entry,no$` matches rows whose level is `entry` and whose last field is `no`; the `$` means "at the end of the line". `cut -d , -f 1,2` keeps the name and the area. Six options, one or two per area. A beginner needs at most one of them at first, the one that fits the job they aim for.

### 3. Save some job advertisements

Create five short files in `ads/`. Real advertisements are longer, but the lines that matter look like these:

```text title="ads/1-it-support.txt"
Job: IT support technician (junior)
Required: Windows and Linux basics, good written English.
Nice to have: CompTIA A+ or Security+.
```

```text title="ads/2-soc-analyst.txt"
Job: Junior SOC analyst
Required: networking basics (TCP/IP, DNS), reading logs, Linux command line.
Nice to have: CompTIA Security+ or ISC2 CC.
```

```text title="ads/3-network.txt"
Job: Network technician
Required: CCNA or equal knowledge.
Nice to have: Linux, Python scripting.
```

```text title="ads/4-pentester.txt"
Job: Penetration tester
Required: 3 years of security experience, OSCP.
Nice to have: CISSP.
```

```text title="ads/5-cloud-intern.txt"
Job: Cloud intern
Required: Linux, Git, Python.
Nice to have: AWS Cloud Practitioner.
```

A **SOC analyst** works in a security operations centre, the team that watches logs and alerts, which is the work of Module 13. It is one of the most common first jobs in security.

### 4. Count which certifications the ads mention

```bash
certs='CompTIA A\+|Security\+|ISC2 CC|CCNA|OSCP|CISSP|Cloud Practitioner'
grep -o -h -E "$certs" ads/*.txt | sort | uniq -c | sort -rn
```

```output
      2 Security+
      1 OSCP
      1 ISC2 CC
      1 CompTIA A+
      1 Cloud Practitioner
      1 CISSP
      1 CCNA
```

The variable `certs` holds the list of names once, so you can reuse it. In `-E` patterns a `+` means "one or more", so `\+` asks for a real plus sign. `-o` prints only the matches, `-h` hides the file names, and `sort -rn` puts the biggest count first. Security+ is mentioned most, in two ads. With real ads from your region, run the same count over 20 or 30 of them, and the pattern becomes clear quickly.

### 5. Separate "required" from "nice to have"

```bash
grep -h '^Required' ads/*.txt | grep -E "$certs"
```

```output
Required: CCNA or equal knowledge.
Required: 3 years of security experience, OSCP.
```

Only two ads require a certification, and the network job accepts "equal knowledge" instead. The pentester job requires three years of experience as well, so it is not a first job, and neither are its certifications. For the three junior ads, the requirements are skills: Linux, networking, logs, Git, Python. The certifications are "nice to have".

```bash
grep -h '^Required' ads/1-it-support.txt ads/2-soc-analyst.txt ads/5-cloud-intern.txt
```

```output
Required: Windows and Linux basics, good written English.
Required: networking basics (TCP/IP, DNS), reading logs, Linux command line.
Required: Linux, Git, Python.
```

Nearly everything on these lines is something this course has taught you. That is the main lesson of this step: for a first job, the skills come first, and a certification helps most as proof of skills that you also show in your projects.

### 6. Write your plan

```markdown title="plan.md"
# My certification plan

Goal: a junior SOC analyst job.

1. Now: finish mylab and my write-ups. They prove the required skills.
2. Next: one entry security certification that the ads ask for:
   Security+ or ISC2 CC. Check the official page for price and renewal.
3. After a year of work: CySA+, or a GIAC certification if my employer pays.
4. Not now: OSCP and CISSP. They need experience I do not have yet.
```

A plan in four lines, based on the ads you read, not on a ranking. Look at it again every six months, or when your goal changes.

## Exercise

Your goal is a junior Linux system administrator job instead. Add two advertisements to `ads/` that fit this goal: one that requires "Linux command line, Bash scripting" and lists "LPIC-1 or RHCSA" as nice to have, and one that requires "RHCSA". Add `LPIC-1|RHCSA` to the `certs` pattern, then count again and print the required lines. Which certification would you plan for first, and why?

<details>
<summary>Show the solution</summary>

```text title="ads/6-linux-admin.txt"
Job: Junior Linux administrator
Required: Linux command line, Bash scripting.
Nice to have: LPIC-1 or RHCSA.
```

```text title="ads/7-linux-ops.txt"
Job: Linux operations engineer
Required: RHCSA.
Nice to have: Python, Git.
```

```bash
certs='CompTIA A\+|Security\+|ISC2 CC|CCNA|OSCP|CISSP|Cloud Practitioner|LPIC-1|RHCSA'
grep -o -h -E "$certs" ads/*.txt | sort | uniq -c | sort -rn | head -n 3
grep -h '^Required' ads/6-linux-admin.txt ads/7-linux-ops.txt | grep -E "$certs"
```

```output
      2 Security+
      2 RHCSA
      1 OSCP
Required: RHCSA.
```

RHCSA appears in both Linux ads and is required in one of them, so it is the one to plan for. It is also a practical exam, so preparing for it trains exactly the skills the job asks for. With only two ads this is a weak signal; with real ones, count more before you pay.

</details>

## Check yourself

**1. What is the difference between a certification and a certificate of completion?**

<details>
<summary>Answer</summary>

A certification is earned by passing a formal exam set by a certifying organisation against a known standard, and it often expires unless renewed. A certificate of completion only says that you finished a course.

</details>

**2. Name two entry-level security certifications that do not require work experience.**

<details>
<summary>Answer</summary>

CompTIA Security+ and ISC2 Certified in Cybersecurity (CC).

</details>

**3. Why is CISSP not a goal for your first year?**

<details>
<summary>Answer</summary>

It requires several years of paid work experience in security before you can hold it.

</details>

**4. An advertisement says "Required: CCNA or equal knowledge." What does that tell you?**

<details>
<summary>Answer</summary>

That the employer cares about the networking knowledge, and accepts other proof of it. Projects, a home lab and a clear explanation in the interview can count.

</details>

**5. What is the best source to decide which certification to take?**

<details>
<summary>Answer</summary>

Real job advertisements for the jobs you want, in the place where you want to work, read and counted. Rankings written by people who sell training are not.

</details>

## Common mistakes

- **Collecting certifications instead of skills.** Three entry certifications and no project look weaker than one certification and a good `mylab`.
- **Starting with an advanced one.** An exam that assumes years of practice is expensive to fail. Start where the ads for first jobs are.
- **Trusting old prices and exam versions.** They change. Read the official page on the day you decide, not a forum post from years ago.
- **Paying for "exam dumps".** Collections of leaked exam questions break the rules of every certifying organisation, can cost you the title, and teach you nothing.
- **Forgetting renewal.** Check how long the title is valid and what renewing costs before you start.

## Key terms

- **Certification**: a title earned by passing a formal exam set by a certifying organisation, which shows that you met a known standard. Often valid for a few years.
- **Certificate of completion**: a document saying that you finished a course, without a formal certification exam.
- **Vendor-neutral**: not tied to one company's products, like CompTIA or ISC2 certifications.
- **Practical exam**: an exam where you solve real tasks on real systems instead of answering multiple-choice questions.
- **SOC analyst**: a person in a security operations centre who watches logs and alerts and responds to incidents.

## Go further

- [CompTIA certifications](https://www.comptia.org/certifications): the official pages for A+, Network+, Security+ and the others, with the exam objectives.
- [ISC2 certifications](https://www.isc2.org/certifications): the official pages for CC and CISSP, including the experience rules.
- [Microsoft Learn: Credentials](https://learn.microsoft.com/en-us/credentials/): Microsoft's certifications and the free learning paths that prepare for them.
