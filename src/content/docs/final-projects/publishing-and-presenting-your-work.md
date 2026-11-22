---
title: Publishing and presenting your work
description: Run the last checks, put your release online with its tag, present a project in five minutes, and turn feedback into the next steps.
lesson: "17.3"
time: 20 min
sidebar:
  order: 3
---

<!-- lab: run
sudo apt-get install -y -qq python3-venv > /dev/null 2>&1
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab ~/server ~/talks
mkdir -p ~/mylab/scripts ~/mylab/tools ~/mylab/docs/screenshots ~/mylab/writeups ~/mylab/data ~/server
cd ~/mylab
printf '.env\n*.tmp\n.venv/\n__pycache__/\nlogs/*.log\ndata/mylab.db\ndata/secret_key\n' > .gitignore
printf '# mylab\n\nSmall security tools and a notes web app.\n\n## License\n\nNone yet.\n' > README.md
printf '# Write-ups\n' > writeups/README.md
printf '#!/bin/bash\necho "All write-ups passed."\n' > scripts/check-writeups.sh
printf 'def test_placeholder():\n    assert True\n' > tools/test_loganalyzer.py
chmod +x scripts/check-writeups.sh
python3 -m venv .venv
.venv/bin/pip install -q pytest
.venv/bin/pip freeze > requirements.txt
git init -q
git add .
git commit -q -m "mylab after Module 16"
git init -q --bare ~/server/mylab.git
git remote add origin ~/server/mylab.git
git push -q -u origin main 2>/dev/null
cat > scripts/check-all.sh <<'EOF'
#!/bin/bash
# Run every check of mylab. All of them must pass before a release.
cd "$(dirname "$0")/.." || exit 1
status=0
echo "== tests"
.venv/bin/python -m pytest -q || status=1
echo "== write-ups"
./scripts/check-writeups.sh || status=1
echo "== files that must never be in git"
if git ls-files | grep -E '(^|/)\.env$|\.db$|secret_key|^\.venv/'; then
  status=1
else
  echo "none found"
fi
echo "== links in README.md"
missing=0
for f in $(grep -o -E '\]\([^)]+\)' README.md | sed -E 's/^\]\((.*)\)$/\1/' | grep -v -E '^(https?:|#)'); do
  if [ ! -e "$f" ]; then
    echo "missing: $f"
    missing=1
  fi
done
if [ "$missing" -eq 0 ]; then
  echo "all links work"
else
  status=1
fi
if [ "$status" -eq 0 ]; then
  echo "All checks passed."
else
  echo "Some checks FAILED."
fi
exit "$status"
EOF
chmod +x scripts/check-all.sh
printf 'MIT License\n\nCopyright (c) 2026 Sam\n' > LICENSE
printf '$ python3 tools/loganalyzer.py data/sample-access.log --top 2\n' > docs/demo.txt
printf 'png' > docs/screenshots/login.png
printf 'png' > docs/screenshots/notes.png
printf '# mylab\n\nSmall security tools and a notes web app.\n\nMore examples: [docs/demo.txt](docs/demo.txt).\n\n![The login page](docs/screenshots/login.png)\n\n## Limits\n\n- The app is for learning. Run it on 127.0.0.1 only.\n\n## License\n\nMIT, see [LICENSE](LICENSE).\n' > README.md
git add -A
git commit -q -m "Polish for release: checks, demo, screenshots, licence"
git tag -a v1.0.0 -m "mylab 1.0.0: first portfolio release"
cd ~
-->

Some students finish a good project, push it, and never mention it again. Others show a smaller project to five people, collect three pieces of advice, and get a better project and an interview out of it. The difference is not the code. This lesson covers the last stretch: putting your work online safely, showing it in five minutes, and asking the right people what they think.

## Goal

After this lesson you can:

- Check a repository one last time and publish a release with its tag.
- Present a project in five minutes, with a demo and one honest story.
- Ask for useful feedback and turn it into the next steps of the project.

## Why it matters

A repository that nobody opens is a diary, not a portfolio. Recruiters, teachers and teammates rarely dig through GitHub on their own: they look at what you show them, and they remember how you explained it. Presenting is also a skill that interviews test directly, through questions like "tell me about a project you built". And feedback from one honest reader finds problems that you can no longer see, because you know the project too well.

## The idea

Publishing has three parts, and the order matters. First **check**: once something is public, you cannot take it back, because anyone may have copied it, and git keeps every old version in the history. Then **publish**: push the commits and the tag, and turn the tag into a GitHub release with notes. Finally **show**: a five-minute talk, then ask for feedback.

A five-minute talk is like a film trailer: it does not tell the whole story. It shows what the project is, one good scene, and why it is worth a closer look. Use this shape:

| Time | Part | What you say or show |
|---|---|---|
| 0:00 | Problem | One sentence: what problem, for whom |
| 0:30 | What I built | The structure in one picture or one file list |
| 1:30 | Demo | One command or one page, live or from `docs/demo.txt` |
| 3:00 | One thing that went wrong | A real bug or dead end, and how you found it |
| 4:00 | What I learned, what is next | Two sentences each |
| 4:30 | Question | One specific question for the audience |

The "went wrong" part is not a weakness. It is the most convincing minute of the talk, because it shows how you work when things fail, which is most of the time in this field.

## Try it

This step uses `mylab` as you left it after lesson 17.1, with the tag `v1.0.0`. In the lab, `origin` is a local stand-in for GitHub, a bare repository in `~/server`, as in lesson 2.5. On your machine, `origin` is your GitHub repository from the [Module 2 project step](../git/project/), and the commands are the same.

### 1. Run the last check

```bash
cd ~/mylab
./scripts/check-all.sh > /dev/null
echo "exit status: $?"
git status --short
```

```output
exit status: 0
```

All checks pass and nothing is left uncommitted. One more question before going public: was a secret ever committed in the past, even if it was deleted later?

```bash
git log --all --oneline -- .env data/mylab.db data/secret_key
echo "lines found: $(git log --all --oneline -- .env data/mylab.db data/secret_key | wc -l)"
```

```output
lines found: 0
```

`git log -- FILE` lists only the commits that touched that file, and `--all` searches every branch. Zero lines means none of these files was ever in a commit. If a secret shows up here, deleting the file is not enough: change the secret itself (a new password, a new key) before you publish, because the old one is in the history for good.

### 2. Push the commits and the tag

```bash
git remote -v
```

```output
origin  /home/sam/server/mylab.git (fetch)
origin  /home/sam/server/mylab.git (push)
```

On your machine the address is your GitHub repository, such as `git@github.com:yourname/mylab.git`.

<!-- lab: nocheck -->
```bash
git push origin main
```

```output
To /home/sam/server/mylab.git
   526c528..367eaa1  main -> main
```

`git push` sends commits, but not tags. A tag goes up only when you name it:

```bash
git push origin v1.0.0
```

```output
To /home/sam/server/mylab.git
 * [new tag]         v1.0.0 -> v1.0.0
```

```bash
git ls-remote --tags origin | cut -f 2
```

```output
refs/tags/v1.0.0
refs/tags/v1.0.0^{}
```

`git ls-remote` lists what the remote has, without downloading anything. Each line holds a commit number and a name, separated by a tab, and `cut -f 2` keeps only the name. The tag is there. The second line, with `^{}`, is git's way of naming the commit that the annotated tag points to.

### 3. Turn the tag into a release

On GitHub, a release (lesson 17.1) is a page built on a tag, with a title, notes, and a download of the code at that version. To make one, open your repository, click Releases, then Draft a new release. Choose the tag `v1.0.0`, give it the title `mylab 1.0.0`, write the notes, and publish it. The buttons may move over time, but the release is always built from a tag that you pushed.

**Release notes** tell a reader what is in this version, in plain words. Your commit messages are the raw material:

```bash
git log --format='- %s' -n 2
```

```output
- Polish for release: checks, demo, screenshots, licence
- mylab after Module 16
```

`--format='- %s'` prints each commit's subject line as a list item. Your list is much longer. Do not paste it as it is: group it, and write for someone who has never seen the project:

```markdown title="docs/release-notes-1.0.0.md"
# mylab 1.0.0

The first release of mylab, my lab project for the PID 1 course.

## What is in it

- A log analyzer with tests, a `--blocklist` option and a `--status`
  option (Modules 3, 4 and 15).
- A notes web app with login, with injection, XSS and access control
  flaws found and fixed, each with a test (Modules 8 and 12).
- A security log, an alert on repeated failed logins, and backups that
  check themselves (Module 13).
- A threat model, a hardening record and an AI log in `docs/`.
- Two CTF write-ups, flags redacted.

## How to check it

Run `./scripts/check-all.sh`. It must end with "All checks passed."

## Known limits

See the Limits section of the README.
```

Keep the file in `docs/`, so the notes also live next to the code, and paste the same text into the release on GitHub.

Then give the repository page a description of one sentence and a few topics, such as `python`, `security` and `flask`, with the gear icon next to About. Do the same for `hardened-server` from lesson 17.2: create an empty repository on GitHub, add it as `origin`, and push.

### 4. Prepare the five-minute talk

Write **speaker notes**: short reminders, one line per idea, not a text to read aloud. Keep them outside the repository, because they are for you:

```bash
mkdir ~/talks
cd ~/talks
```

```markdown title="mylab.md"
# mylab in five minutes

## Problem (0:00)
Learning security from books did not stick. I wanted one project
that grows with every topic and that I can show.

## What I built (0:30)
Show the README: tools, notes app, docs, write-ups.
One repository, 17 modules, every change tested.

## Demo (1:30)
Run: python3 tools/loganalyzer.py data/sample-access.log --status 404
Point at the 4 failed logins from one address: that is a guessing attack.

## What went wrong (3:00)
The AI-written --status option passed all its tests and still printed
"Errors: 0". argparse gives text, not a number. The test used a number.
Fix: type=int, and a test that runs the real command.

## Learned, next (4:00)
Test a feature the way a user runs it. Next: rate-limit the login.

## Question (4:30)
"Which part of the README was unclear?"
```

Save it as `~/talks/mylab.md`, outside `mylab`. Then check its length:

```bash
wc -w mylab.md
```

```output
138 mylab.md
```

People speak about 120 to 150 words per minute, so these notes are not a script for five minutes: they are reminders, and you say each one in your own words. If your notes are longer than about 400 words, you will run out of time, or you will start reading them.

Now rehearse. Say the whole talk out loud, standing, with a timer on your phone, at least twice. The first time it usually takes seven minutes. Cut until it fits, and always cut words before you cut the demo or the story of what went wrong. Before a live demo, run the demo command once in the same terminal; and keep `docs/demo.txt` open in a second window, in case the live one fails.

### 5. Ask for feedback and act on it

General questions get general answers. "What do you think?" gets "looks good". Ask two or three people, a classmate, a teacher or someone already working in the field, specific questions:

```text
Hi, I published my course project: [link to the release].
Could you give it five minutes and answer one or two of these?
1. After reading only the first screen of the README, what does it do?
2. Which step of the Quick start did not work for you?
3. What is the first thing you would improve?
Short answers are perfect. Thank you.
```

Question 1 tests the README: if their answer is not what you meant, the README is not clear yet. Question 2 tests whether the project works on a machine that is not yours. Write the answers down where you keep your talk, without people's names, then act on them. Not all feedback is right, so for each piece decide: do it, note it as a limit, or let it go with a reason.

<!-- lab: run
cd ~/mylab
python3 - <<'PYEOF'
from pathlib import Path
p = Path("README.md")
s = p.read_text()
old = "## License\n"
assert old in s
s = s.replace(old, "## Next steps\n\n- Make the Quick start work on macOS (feedback from a classmate).\n- Rate-limit failed logins in the notes app.\n\n" + old)
p.write_text(s)
PYEOF
-->

Put what you will do into a "Next steps" section of the README, right before the licence:

```bash
cd ~/mylab
grep -A 3 '^## Next steps' README.md
```

```output
## Next steps

- Make the Quick start work on macOS (feedback from a classmate).
- Rate-limit failed logins in the notes app.
```

A "Next steps" section tells a reader that the project is alive and that you listen. Commit it with the release notes, and push:

<!-- lab: nocheck -->
```bash
git add README.md docs/release-notes-1.0.0.md
git commit -q -m "Add release notes and next steps from feedback"
git push -q origin main
git describe
```

```output
v1.0.0-1-gb1801d3
```

`git describe` now says you are one commit after `v1.0.0`; the letters after `g` are the start of the commit number, so yours differ. When the next steps are done, tag `v1.1.0`, push the tag, and write a new release: the same routine as today.

## Exercise

Prepare a five-minute talk about `hardened-server` from lesson 17.2. Write the notes in `~/talks/hardened-server.md` with the six parts of the table in "The idea", and check that they stay under 400 words. Then rehearse it once with a timer.

<details>
<summary>Show the solution</summary>

One possible version. Yours uses your own numbers and your own words.

```bash
cd ~/talks
```

```markdown title="hardened-server.md"
# hardened-server in five minutes

## Problem (0:00)
A bug in a web service can give an attacker the rights of that service.
On many machines, that means root.

## What I built (0:30)
The mylab server as a systemd service: its own user, and a sandbox
of ten settings. One unit file, one check script, one write-up.

## Demo (1:30)
Run ./check.sh: seven PASS lines.
Show the evidence table: exposure 9.6 UNSAFE before, 4.5 OK after.

## What went wrong (3:00)
A typo, ProtectSystem=strickt. No error, the service started,
and the protection was off. Only systemctl show revealed it.

## Learned, next (4:00)
The file is not the result: measure what is in force.
Next: a system call filter.

## Question (4:30)
"Which other service on your machines would you sandbox first?"
```

```bash
wc -w hardened-server.md
```

```output
133 hardened-server.md
```

About 130 words: well under 400, so there is room to speak freely. The story of the typo is the "went wrong" part, and the demo is the check script, which shows the evidence in seconds. If the rehearsal runs over five minutes, shorten "What I built" first.

</details>

## Check yourself

**1. You deleted `.env` from your repository last month. Is it safe to make the repository public now?**

<details>
<summary>Answer</summary>

Not yet. The file is still in the history. Check with `git log --all --oneline -- .env`. If it shows commits, change every secret that was in the file before you publish, because anyone could read the old version.

</details>

**2. You ran `git push`, but the release page on GitHub does not offer the tag `v1.0.0`. Why?**

<details>
<summary>Answer</summary>

`git push` sends commits, not tags. Push the tag by name, `git push origin v1.0.0`, and check with `git ls-remote --tags origin`.

</details>

**3. Why does the five-minute talk include something that went wrong?**

<details>
<summary>Answer</summary>

Because it shows how you work when things fail: how you noticed the problem, found the cause and fixed it. That is what people want to know about a future colleague, and it is more convincing than a list of features.

</details>

**4. Why is "What do you think?" a poor feedback question?**

<details>
<summary>Answer</summary>

It is too general, so it gets a polite, general answer such as "looks good". A specific question, such as "what does it do, after the first screen of the README?", gives an answer you can check and act on.

</details>

**5. Where do speaker notes and feedback answers belong, and where do the resulting next steps go?**

<details>
<summary>Answer</summary>

The notes and the answers stay private, outside the repository, and without people's names. What you decide to do goes into the "Next steps" section of the README, in your own words.

</details>

## Common mistakes

- **Publishing first, checking later.** Once it is public, it may already be copied. Run the checks and look at the history before the first push.
- **Forgetting to push the tag.** `git push` alone does not send it. Push it by name, or use `git push --follow-tags`, which sends the annotated tags of the commits you push.
- **Reading the talk from the notes.** It sounds flat and runs long. Keep the notes short and speak in your own words.
- **A live demo with no fallback.** Networks and laptops fail at the worst moment. Run the demo once before you start, and have `docs/demo.txt` or a screenshot ready.
- **Arguing with feedback.** Thank the person, write it down, and decide later. You are free to disagree, but write down why.

## Key terms

- **Release notes**: a short text that says what a release contains and what changed, written for people who have not followed the work.
- **Speaker notes**: short reminders for a talk, one line per idea, that you speak about in your own words instead of reading aloud.

## Go further

- [GitHub Docs: About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases): how releases are built on tags, and how to create and edit one.
- [Git Book: Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging): the section "Sharing Tags" explains why tags need their own push.
- [GitHub Docs: Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository): what to do if a secret did reach the history.
