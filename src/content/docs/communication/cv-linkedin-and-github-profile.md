---
title: CV, LinkedIn and GitHub profile
description: Write a one-page CV that shows real work with numbers and links, check it for empty claims, and prepare your LinkedIn and GitHub profiles to back it up.
lesson: "16.4"
time: 25 min
sidebar:
  order: 4
---

<!-- lab: run
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab
mkdir -p ~/mylab/tools ~/mylab/docs ~/mylab/writeups ~/mylab/app
cd ~/mylab
printf '# mylab\n\nMy lab for the PID 1 course.\n' > README.md
git init -q
git add README.md
git commit -q -m "Start mylab"
printf '# log analyzer\n' > tools/loganalyzer.py
for t in parse_good_line parse_cut_line parse_status_not_a_number analyze_counts_and_errors failed_logins blocked_ips load_blocklist filter_status status_option_from_command_line; do printf 'def test_%s():\n    pass\n\n' "$t"; done > tools/test_loganalyzer.py
git add tools
git commit -q -m "Add the log analyzer and its tests"
printf '# app\n' > app/app.py
mkdir -p tests
for t in search_cannot_be_injected search_finds_own_notes cannot_read_another_users_note owner_can_read_own_note note_body_is_escaped security_headers failed_login_is_logged_without_password; do printf 'def test_%s(client):\n    pass\n\n' "$t"; done > tests/test_security.py
git add app tests
git commit -q -m "Add the notes app"
printf '# threat model\n' > docs/threat-model.md
printf '# TLS notes\n' > docs/tls-notes.md
printf '# hardening\n' > docs/hardening.md
printf '# AI log\n' > docs/ai-log.md
git add docs
git commit -q -m "Add security notes"
printf '# Write-ups\n' > writeups/README.md
printf '# Template\n' > writeups/TEMPLATE.md
printf '# Layers\n' > writeups/layers.md
printf '# Report\n' > writeups/report.md
git add writeups
git commit -q -m "Add two write-ups"
cd ~
-->

Two students apply for the same internship. The first CV says: "Skills: Python (expert), Linux (advanced), cybersecurity. Passionate team player." The second says: "Wrote a Python tool that finds password guessing in web server logs, with 9 automated tests. Code: github.com/..." The first student may know more. But only the second one gave the reader something to check, and that is the one who gets the call.

## Goal

After this lesson you can:

- Write a one-page CV where every project line has a number or a link.
- Find and remove empty claims with a quick check.
- Prepare your LinkedIn and GitHub profiles so that they back up the CV, and check what your public commits reveal.

## Why it matters

A CV is often read in a hurry, sometimes first by software that looks for keywords and then by a person who has many others to read. As a student you have little job experience, so your projects are your evidence. LinkedIn and GitHub are where the reader goes next to check it. If the three tell the same honest story, with links between them, you look like someone who builds things. If they contradict each other, you look like someone who decorates.

## The idea

**Show, do not claim.** A claim is a word about yourself, like "expert" or "passionate". Evidence is something the reader can check: a number, a result, a link to code. A CV works like a lab report: the reader believes the result only as much as the method and the data shown with it.

A **CV** (called a résumé in the United States and Canada) is a short document that lists your education, experience, projects and skills. For a student, these rules cover most of it:

- **One page.** Put the projects first if your work experience is small.
- **Plain layout.** One column, standard headings (Projects, Experience, Education, Skills), a readable font, saved as PDF. Many companies use an **applicant tracking system** (ATS): software that stores CVs and lets recruiters search them by keyword. Tables, columns, text boxes and pictures of text can confuse it.
- **One line per achievement**, in the form: action verb, what you did, a number or result, and a link if there is one. "Wrote a log analyzer with 9 tests" beats "Responsible for log analysis".
- **Skills you can show.** List a skill only if you could talk about where you used it for two minutes, as in lesson 16.2. No skill bars, no percentages: "Python 80%" means nothing.
- **Only the truth.** Never invent a job, a level, a certificate or a team size. A single question in an interview can expose it, and in security work, trust is the job.

Your **LinkedIn** profile is the longer, public version of the CV. The parts people see first are the **headline** (the line under your name), the About section and, at the time of writing, a Featured section where you can pin links. Use the headline for what you are and what you work on, for example "Computer Science student | Linux, Python, web security". Use the About section for a short version of your pitch from lesson 16.2.

Your **GitHub profile** is where the evidence lives. You can **pin** up to six repositories, so that they appear first on your profile. You can also add a **profile README**: a public repository with exactly the same name as your username, whose `README.md` GitHub shows at the top of your profile. Each repository has an About box with a one-line description and topics such as `python` or `security`, which make it easier to find.

## Try it

The outputs come from a user called `sam`. `~/mylab` here is a small copy with the same structure as yours; your numbers will be different, and that is the point: use your own.

### 1. Collect the evidence

```bash
cd ~/mylab
ls docs writeups
git log --oneline | wc -l
grep -c "^def test_" tools/test_loganalyzer.py tests/test_security.py
```

```output
docs:
ai-log.md  hardening.md  threat-model.md  tls-notes.md

writeups:
README.md  TEMPLATE.md  layers.md  report.md
5
tools/test_loganalyzer.py:9
tests/test_security.py:7
```

This list is your raw material: four documents about the project's security, two write-ups next to a template and a list, a number of commits, nine tests for the log analyzer and seven security tests for the app. With two files, `grep -c` puts each file's name in front of its count. Every line of the CV's project section should point to something here.

### 2. Find the empty claims

Make a folder for your career files and save a typical first draft of a skills section:

```bash
mkdir -p ~/career
cd ~/career
```

```text title="skills-draft.txt"
Skills: Python (expert), Linux (advanced), cybersecurity
Passionate, hard-working team player
Various projects with different technologies, etc.
```

```bash
grep -n -i -w -E "expert|advanced|passionate|hard-working|team player|various|etc" skills-draft.txt
```

```output
1:Skills: Python (expert), Linux (advanced), cybersecurity
2:Passionate, hard-working team player
3:Various projects with different technologies, etc.
```

Every line contains a word that claims something without showing it. "Expert" after a few months of Python invites a hard interview question. "Passionate" is written on so many CVs that readers skip it. "Various projects" hides the projects you could have named.

### 3. Write the CV

Write it in Markdown first: it is easy to edit and to check with the terminal. Later you copy it into a word processor or a CV template and save it as PDF. Use your own name, contacts and real projects; this one is an example.

```markdown title="cv.md"
# Sam Example

Computer Science student, looking for a summer internship in IT support or security.
sam@example.com | github.com/yourname | linkedin.com/in/yourname

## Projects

### mylab: a small web app, built and secured step by step

- Wrote a Python log analyzer that finds password guessing and scans for secret files in web server logs, with 9 automated tests.
- Built a notes app with Flask and SQLite, with a login kept in a signed session cookie, served on 127.0.0.1 only.
- Found and fixed SQL injection, cross-site scripting and broken access control in the app, each proven with a test (7 security tests).
- Added a security log and a tool that raises an alert after 5 failed logins in 10 minutes.
- Wrote 4 short security documents for the project: threat model, TLS notes, Linux hardening steps and a log of AI-assisted changes.
- Code and documents: github.com/yourname/mylab

### CTF practice

- Wrote 2 CTF write-ups (encoding and forensics challenges), with each command, what it showed and what I learned.

## Skills

- Linux command line and Bash scripts, used in every part of mylab.
- Python 3: argparse, files, tests with pytest.
- Git and GitHub: branches, pull requests, GitHub Pages.
- Networking basics: TCP/IP, DNS, HTTP; curl, dig, ss.
- Web: HTML, CSS, Flask; SQL with SQLite.

## Education

- 2025 to now: BSc in Computer Science, University of Example (second year).
- 2026: PID 1, a free online course in CS and security foundations, with the mylab project.
```

Look at the project bullets. Each starts with a verb (wrote, built), says what, and gives a number or a link. The skills section names tools, and each one appears in a project above it, so the reader can see where you used it.

### 4. Check every project line for evidence

```bash
grep -n -i -w -E "expert|advanced|passionate|hard-working|team player|various|etc" cv.md || echo "no empty claims"
sed -n '/^## Projects/,/^## Skills/p' cv.md | grep '^- ' | grep -v -E '[0-9]|github\.com' || echo "every project line has a number or a link"
```

```output
no empty claims
every project line has a number or a link
```

The first line repeats the check from step 2, now on the CV. The second line uses `sed -n '/A/,/B/p'`, which prints only the lines from the first match of `A` to the next match of `B`: here, the projects section. Of those lines, `grep '^- '` keeps the bullets, and `grep -v` keeps only the bullets with no digit and no link. None are left. A check like this cannot judge whether your sentences are good, but it catches the bullet that says nothing.

### 5. Check what your commits reveal

Your GitHub profile shows your repositories, and every commit in them carries a name and an email. Before you pin a project, look at what the world will see:

```bash
cd ~/mylab
git log --format='%an <%ae>' | sort -u
```

```output
Sam <sam@example.com>
```

`%an` is the author's name and `%ae` the author's email, for every commit; `sort -u` shows each pair once. If you see a private email or an old nickname here, it is public as soon as you push. GitHub can give you a private **noreply address** to use instead: it is shown in your GitHub email settings, and you set it with `git config --global user.email`, as in Module 2. It applies to new commits only.

### 6. Write a short profile README

On GitHub, create a public repository with exactly your username as its name, for example `yourname`. Its README becomes the top of your profile. Keep it short and factual:

```markdown title="profile-README.md"
# Hi, I am Sam

Computer Science student. I learn by building and securing small projects on Linux.

- **mylab**: a log analyzer and a small Flask app, secured step by step,
  with tests and security notes. [Repository](https://github.com/yourname/mylab)
- **CTF write-ups**: how I solved practice challenges, step by step.

Currently learning: web security and incident response.
Contact: [LinkedIn](https://www.linkedin.com/in/yourname)
```

The file is called `profile-README.md` here only so that it does not clash with other files; in the profile repository it must be `README.md`. Then pin your best repositories: on your profile page, choose "Customize your pins" and select up to six. Pin `mylab` first. Give each pinned repository a one-line description and a few topics in its About box, so that the pinned card says what it is.

Finally, add the same links to LinkedIn: the repository in the Featured section, and a project entry with the one-line description. The CV, LinkedIn and GitHub now point at each other, and they say the same thing.

:::caution[Check before you pin]
A pinned repository is the first thing a recruiter opens. Look through it once as a stranger: no passwords, API keys or real personal data in any file or in the history, a README that works (lesson 16.3), and no half-finished experiments at the top level.
:::

## Exercise

Add a project to `cv.md` from your own work in this course, for example the portfolio page from lesson 8.7, [Build and publish a portfolio page](../web/build-and-publish-a-portfolio-page/), or your Bandit progress from Module 14. Write two or three bullets that start with a verb and contain a number or a link. Then run both checks from step 4 again and make sure they still pass.

<details>
<summary>Show the solution</summary>

One possible section, added after the CTF practice in `cv.md`:

<!-- lab: run
cd ~/career
python3 - <<'PYEOF'
from pathlib import Path
p = Path("cv.md")
s = p.read_text()
add = """### Portfolio page

- Built and published a one-page portfolio with HTML and CSS on GitHub Pages: yourname.github.io
- Checked it at 2 screen widths, phone and laptop, and fixed the layout for both.

"""
s = s.replace("## Skills", add + "## Skills")
p.write_text(s)
PYEOF
-->

```markdown
### Portfolio page

- Built and published a one-page portfolio with HTML and CSS on GitHub Pages: yourname.github.io
- Checked it at 2 screen widths, phone and laptop, and fixed the layout for both.
```

```bash
cd ~/career
grep -n -i -w -E "expert|advanced|passionate|hard-working|team player|various|etc" cv.md || echo "no empty claims"
sed -n '/^## Projects/,/^## Skills/p' cv.md | grep '^- ' | grep -v -E '[0-9]|github\.com|github\.io' || echo "every project line has a number or a link"
```

```output
no empty claims
every project line has a number or a link
```

The link check now also accepts `github.io`, the address of a GitHub Pages site. Write only what you really did: if you did not test on a phone, do not say so.

</details>

## Check yourself

**1. What is the difference between a claim and evidence on a CV?**

<details>
<summary>Answer</summary>

A claim is a word about yourself, such as "expert" or "passionate", that the reader cannot check. Evidence is a number, a result or a link that the reader can check.

</details>

**2. Why is a plain, one-column CV layout safer than a designed one with columns and pictures?**

<details>
<summary>Answer</summary>

Many companies read CVs with an applicant tracking system that searches them by keyword. Columns, tables, text boxes and text inside pictures can confuse it, so parts of the CV may be lost. A plain layout is also faster for a person to read.

</details>

**3. How do you put a README at the top of your GitHub profile?**

<details>
<summary>Answer</summary>

Create a public repository with exactly the same name as your username, and put a `README.md` in it. GitHub shows that README at the top of your profile.

</details>

**4. What does `git log --format='%an <%ae>' | sort -u` show, and why run it before you publish?**

<details>
<summary>Answer</summary>

Every author name and email used in the repository's commits, each pair once. Once pushed, they are public, so you check that no private email or name is in them.

</details>

**5. How many repositories can you pin on a GitHub profile?**

<details>
<summary>Answer</summary>

Up to six. Pin your best and most complete projects first.

</details>

## Common mistakes

- **Listing every technology you have heard of.** A long skills list with no projects behind it reads as padding. Keep the skills you used, and show where.
- **Inflating a level.** "Expert" or "fluent" after a few months invites the hardest questions. Describe what you did instead, and let the reader judge.
- **A different story on each site.** Dates, titles and projects that do not match between the CV, LinkedIn and GitHub make the reader doubt all three. Update them together.
- **Pinning forks and course copies.** A repository that you forked or copied without changes shows nothing about you. Pin what you built.
- **Sending a Word file with a strange name.** Send a PDF called something like `sam-example-cv.pdf`, so that it looks the same everywhere and is easy to find.

## Key terms

- **CV**: a short document that lists your education, experience, projects and skills. Called a résumé in the United States and Canada.
- **Applicant tracking system (ATS)**: software that companies use to collect CVs and search them by keyword.
- **Headline**: the line under your name on a LinkedIn profile, which says what you are and what you work on.
- **Pinned repository**: a repository you choose to show first on your GitHub profile, up to six.
- **Profile README**: the `README.md` of a public repository named exactly like your GitHub username, shown at the top of your profile.
- **Noreply address**: a private email address from GitHub that you can use for commits instead of your real one.

## Go further

- [GitHub Docs: Managing your profile README](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme): how to create the special repository, step by step.
- [GitHub Docs: Pinning items to your profile](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile): how to choose the repositories shown first.
- [GitHub Docs: Setting your commit email address](https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address): how to find your noreply address and use it in git.
