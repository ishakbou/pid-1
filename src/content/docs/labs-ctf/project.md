---
title: "Project step: your first write-ups in mylab"
description: Add a writeups folder to mylab with a template and two write-ups, plus a script that checks every write-up for missing sections and leftover flags before you commit.
lesson: "14.5"
time: 25 min
sidebar:
  order: 5
---

Your `mylab` repository holds code, a threat model and hardening notes. What it does not show yet is how you think when you face a problem you have never seen. Write-ups show exactly that. In this step you give them a permanent home in `mylab`, and because `mylab` is public on GitHub, you also add a guard that stops a flag from slipping into a commit.

## Goal

After this lesson you can:

- Keep write-ups in a project folder, with a template and an index.
- Write a complete write-up, dead end included, in the standard format.
- Check every write-up automatically for missing sections and unredacted flags before you commit.

## Why it matters

A folder of write-ups next to your code is one of the most convincing things a beginner can show: it proves practice, method and the habit of writing things down. But a public repository never forgets. A flag or a password committed once stays in the git history even after you delete the file. A small check that runs in a second, before every commit, is cheaper than cleaning a history.

## The idea

You add one folder and one script:

```text
mylab/
    writeups/
        README.md            new: the list of write-ups
        TEMPLATE.md          new: the empty format, to copy for each challenge
        layers.md            new: the public copy from lesson 14.4
        report.md            new: written in this step
    scripts/
        check-writeups.sh    new: checks sections and flags
    ...                      everything from earlier modules
```

The rule for this folder: only public copies live here. Your private notes, with the real flags, stay outside the repository, in `~/ctf`. The check script is the guard at the door. Think of it as the checklist a pilot reads before take-off: the pilot knows every item, but on a busy day one gets skipped, and a checklist does not get tired.

The script asks two questions of each write-up: are all six sections there, and is there anything that looks like a flag, meaning a word followed by text in braces, such as `practice{...}` or `picoCTF{...}`, other than `{REDACTED}`?

## Try it

This step uses your `mylab` repository and the two practice challenges from lessons 14.3 and 14.4 in `~/ctf`.

<!-- lab: run
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf ~/mylab ~/ctf
mkdir -p ~/mylab/scripts ~/mylab/notes ~/mylab/data ~/mylab/logs ~/mylab/tools ~/mylab/app/templates ~/mylab/app/static ~/mylab/docs ~/mylab/tests
cd ~/mylab
printf '# mylab\n\nMy lab for the PID 1 course.\n' > README.md
printf '.venv/\n__pycache__/\nlogs/*.log\ndata/mylab.db\n' > .gitignore
printf '#!/bin/bash\necho sysinfo\n' > scripts/sysinfo.sh
printf '#!/bin/bash\necho backup\n' > scripts/backup.sh
chmod +x scripts/sysinfo.sh scripts/backup.sh
printf '# log analyzer\n' > tools/loganalyzer.py
printf '# watch logins\n' > tools/watch_logins.py
printf '# app\n' > app/app.py
printf '# db\n' > app/db.py
printf '# threat model\n' > docs/threat-model.md
printf '# TLS notes\n' > docs/tls-notes.md
printf '# hardening\n' > docs/hardening.md
printf '# security tests\n' > tests/test_security.py
git init -q
git add .
git commit -q -m "mylab after Module 13"
mkdir -p ~/ctf/layers ~/ctf/report
cd ~/ctf/layers
cat > writeup.md <<'EOF'
# Layers

- Platform: practice challenge, lesson 14.3
- Category: General Skills, 50 points
- Solved: 2026-11-21

## Summary

The flag was hidden under two encodings, hex and then Base64. No key was
needed: recognizing each encoding and reversing it was enough.

## Recon

I was given one file, `message.txt`. The description said "encrypted
twice" and the hint said "encoding is not encryption", so I expected two
layers that need no key.

    $ file message.txt
    message.txt: ASCII text

## Steps

1. The text used only digits and the letters a to f, so I guessed hex.
   I checked that no line had any other character:

       $ grep -c '[^0-9a-f]' message.txt
       0

2. I turned the hex back into bytes:

       $ xxd -r -p message.txt
       cHJhY3RpY2V7cGVlbF9vbmVfbGF5ZXJfYXRfYV90aW1lfQo=

3. The result used letters and digits and ended with "=", which is how
   Base64 looks, so I decoded it:

       $ xxd -r -p message.txt | base64 -d
       practice{peel_one_layer_at_a_time}

## Dead ends

None this time. If step 3 had printed unreadable bytes, I would have
looked at its first bytes with `xxd` and `head` before guessing again.

## Flag

practice{peel_one_layer_at_a_time}

## What I learned

- Text with only 0-9 and a-f is probably hex: `xxd -r -p`.
- Base64 often ends with "=": `base64 -d`.
- "Encrypted" in a description often means "encoded".
EOF
sed 's/practice{[^}]*}/practice{REDACTED}/g' writeup.md > writeup-public.md
sed -i 's|cHJh[A-Za-z0-9+/=]*|(Base64 text removed)|' writeup-public.md
cd ~/ctf/report
printf 'H4sIAAAAAAAAA/PLL0lVKMlXKE7NSbNSKMlIVUjLSUxXyCxWKChKTC7JTE6tLikqLS6JT6osSS2O\nz8svic9LzE0truUCANU4BgE6AAAA\n' > report.b64
base64 -d report.b64 > report.txt
cd ~
-->

### 1. Create the folder and the template

```bash
cd ~/mylab
mkdir writeups
```

```markdown title="writeups/TEMPLATE.md"
# Challenge name

- Platform:
- Category:
- Solved:

## Summary

Two or three sentences: what the challenge was and the key idea. No flag.

## Recon

What I was given, and what I noticed first.

## Steps

1. I saw ..., so I guessed ... I tested it with:

       $ command
       output

## Dead ends

What I tried that did not work, and why.

## Flag

REDACTED

## What I learned

- One thing to remember next time.
```

For each new challenge you copy this file and fill it in, so you never start from a blank page and never forget a section. The step line already has the "I saw, so I guessed, I tested" shape from lesson 14.4.

### 2. Add the public Layers write-up

```bash
cp ~/ctf/layers/writeup-public.md writeups/layers.md
grep -c 'REDACTED' writeups/layers.md
```

```output
2
```

You copy the public version from lesson 14.4, never the private one. Two lines are redacted: the flag in step 3 and the one in the Flag section. The Base64 line was already replaced in lesson 14.4.

### 3. Repeat the dead end for Report

The second write-up is Report, the exercise of lesson 14.3. A good write-up includes what failed, so check the dead end for real instead of from memory:

```bash
cd ~/ctf/report
gunzip report.txt
echo "exit code: $?"
cd ~/mylab
```

```output
gzip: report.txt: unknown suffix -- ignored
exit code: 2
```

`gunzip` refuses, because it only unpacks names that end in `.gz` and similar endings. The exit code 2 confirms the failure. This error belongs in the write-up: the next reader will try `gunzip` first too.

### 4. Write the Report write-up

```markdown title="writeups/report.md"
# Report

- Platform: practice challenge, lesson 14.3
- Category: Forensics, 100 points
- Solved: 2026-11-21

## Summary

The file was called `report.txt` but held gzip data, not text. `file`
showed the real type, and `zcat` unpacked the flag.

## Recon

I was given `report.txt`. The description said it "will not open in a
text editor", so I did not trust the name and checked the type first:

    $ file report.txt
    report.txt: gzip compressed data, from Unix, original size modulo 2^32 58

## Steps

1. `file` read the magic number and found gzip, so I guessed that
   unpacking the file would give its content. `gunzip` refused (see
   Dead ends), so I used `zcat`, which unpacks to the screen whatever
   the file is called:

       $ zcat report.txt
       Note to self: the flag is practice{trust_bytes_not_names}

## Dead ends

- `gunzip report.txt` printed "unknown suffix -- ignored", because
  gunzip expects a name that ends in `.gz`.

## Flag

practice{trust_bytes_not_names}

## What I learned

- A name or an extension can lie. `file` reads the bytes.
- `zcat` unpacks gzip data whatever the file is called.
```

This is the private version, with the flag, as you would write it right after solving. Keep a copy of it outside the repository:

```bash
cp writeups/report.md ~/ctf/report/writeup.md
```

### 5. Write the check script

```bash title="scripts/check-writeups.sh"
#!/bin/bash
# Check every write-up: all sections present, no flag left in.
cd "$(dirname "$0")/.." || exit 1
status=0
for file in writeups/*.md; do
  if [ "$file" = "writeups/README.md" ]; then
    continue
  fi
  for section in "Summary" "Recon" "Steps" "Dead ends" "Flag" "What I learned"; do
    if ! grep -q "^## $section\$" "$file"; then
      echo "$file: missing section: $section"
      status=1
    fi
  done
  leaks=$(grep -n -E '[A-Za-z]+\{[^}]+\}' "$file" | grep -v '{REDACTED}')
  if [ -n "$leaks" ]; then
    echo "$file: possible flag:"
    echo "$leaks"
    status=1
  fi
done
if [ "$status" -eq 0 ]; then
  echo "All write-ups passed."
fi
exit "$status"
```

Line by line, the new parts:

- `cd "$(dirname "$0")/.."` moves to the `mylab` folder, wherever you start the script from. `$0` is the script's own path, `dirname` cuts off the file name, and `..` goes one level up from `scripts`.
- `continue` skips the rest of the loop for `README.md`, which is a list, not a write-up. The template is checked like a write-up, which proves it is complete.
- `grep -q` prints nothing and only answers yes or no; `!` turns the answer around. `\$` puts a real `$` into the pattern: the end of the line, so `## Steps taken` would not count.
- `[A-Za-z]+\{[^}]+\}` finds a word directly followed by text in braces. `grep -v '{REDACTED}'` then drops the lines that are already safe. Whatever remains is a possible leak.
- `status` remembers whether anything failed, and `exit "$status"` reports it, like the scripts of lesson 1.9.

### 6. Run it and let it catch you

```bash
chmod +x scripts/check-writeups.sh
./scripts/check-writeups.sh
echo "exit code: $?"
```

```output
writeups/report.md: possible flag:
28:       Note to self: the flag is practice{trust_bytes_not_names}
37:practice{trust_bytes_not_names}
exit code: 1
```

The guard works: the Report write-up still holds its flag, twice, and the script names both lines. Redact them with the same `sed` as in lesson 14.4 and run the check again:

```bash
sed -i 's/practice{[^}]*}/practice{REDACTED}/g' writeups/report.md
./scripts/check-writeups.sh
echo "exit code: $?"
```

```output
All write-ups passed.
exit code: 0
```

Exit code 0 means every write-up, and the template, has all six sections and no flag. Your private copy in `~/ctf/report` still has the flag.

### 7. Add an index and commit

```markdown title="writeups/README.md"
# Write-ups

How I solved practice challenges, step by step. Flags are redacted.
New write-ups start from [TEMPLATE.md](TEMPLATE.md), and
`scripts/check-writeups.sh` must pass before each commit.

| Challenge | Category | What it teaches |
|---|---|---|
| [Layers](layers.md) | General Skills | Recognize and reverse hex and Base64 |
| [Report](report.md) | Forensics | Trust the bytes, not the file name |
```

```bash
git status --short
```

```output
?? scripts/check-writeups.sh
?? writeups/
```

Two new items, both expected. Nothing from `~/ctf` is in the repository, because it lives outside the `mylab` folder.

<!-- lab: nocheck -->
```bash
git add writeups scripts/check-writeups.sh
git commit -m "Add write-ups for Layers and Report, and a check script"
```

```output
[main 556450f] Add write-ups for Layers and Report, and a check script
 5 files changed, 162 insertions(+)
 create mode 100755 scripts/check-writeups.sh
 create mode 100644 writeups/README.md
 create mode 100644 writeups/TEMPLATE.md
 create mode 100644 writeups/layers.md
 create mode 100644 writeups/report.md
```

Your commit number will differ. Push it with `git push` as in Module 2, and your write-ups are online, without a single flag.

## Exercise

Lesson 14.4 showed that an image without alt text is a problem. Add a third check to the script: a write-up fails when it contains `![]`. Then test both sides: copy the template to `writeups/test.md`, add the line `![](images/step1.png)` at the end, run the script, and delete the test file afterwards.

<details>
<summary>Show the solution</summary>

Add these lines inside the outer loop, right before its last `done`:

```text
  if grep -q '!\[\]' "$file"; then
    echo "$file: image without alt text"
    status=1
  fi
```

<!-- lab: run
cd ~/mylab
cat > scripts/check-writeups.sh <<'EOF'
#!/bin/bash
# Check every write-up: all sections present, no flag left in.
cd "$(dirname "$0")/.." || exit 1
status=0
for file in writeups/*.md; do
  if [ "$file" = "writeups/README.md" ]; then
    continue
  fi
  for section in "Summary" "Recon" "Steps" "Dead ends" "Flag" "What I learned"; do
    if ! grep -q "^## $section\$" "$file"; then
      echo "$file: missing section: $section"
      status=1
    fi
  done
  leaks=$(grep -n -E '[A-Za-z]+\{[^}]+\}' "$file" | grep -v '{REDACTED}')
  if [ -n "$leaks" ]; then
    echo "$file: possible flag:"
    echo "$leaks"
    status=1
  fi
  if grep -q '!\[\]' "$file"; then
    echo "$file: image without alt text"
    status=1
  fi
done
if [ "$status" -eq 0 ]; then
  echo "All write-ups passed."
fi
exit "$status"
EOF
-->

```bash
cd ~/mylab
cp writeups/TEMPLATE.md writeups/test.md
echo '![](images/step1.png)' >> writeups/test.md
./scripts/check-writeups.sh
echo "exit code: $?"
rm writeups/test.md
./scripts/check-writeups.sh
```

```output
writeups/test.md: image without alt text
exit code: 1
All write-ups passed.
```

The new check fails on the test file and passes once it is gone, so you have seen it work both ways. As in lesson 14.4, the backslashes in `'!\[\]'` make the brackets plain characters.

</details>

## Check yourself

**1. Why does `mylab/writeups` only hold public copies?**

<details>
<summary>Answer</summary>

`mylab` is published on GitHub, and anything committed stays in the git history, even after you delete it. The private versions with real flags stay outside the repository, in `~/ctf`.

</details>

**2. What two things does `check-writeups.sh` check in each write-up?**

<details>
<summary>Answer</summary>

That all six sections are present (Summary, Recon, Steps, Dead ends, Flag, What I learned), and that nothing that looks like a flag, a word followed by text in braces, is left except `{REDACTED}`.

</details>

**3. Why does the script end with `exit "$status"` instead of just stopping?**

<details>
<summary>Answer</summary>

So that the exit code says whether the check passed: 0 for success, 1 for a problem. You can see it with `echo $?`, and other tools, such as a git hook, can react to it.

</details>

**4. Why did you run `gunzip report.txt` again before writing the Dead ends section?**

<details>
<summary>Answer</summary>

To record the real error message, not one from memory. A write-up, like a lesson, should only show output that really happened.

</details>

## Common mistakes

- **Copying the private write-up into the repository.** Copy the public one, then run the check. If a flag was already committed, deleting the file is not enough, because it stays in the history.
- **Running the check only sometimes.** Make it a habit to run it before every `git commit` that touches `writeups/`.
- **Trusting the check too much.** It finds text in braces. It does not find a Base64 copy, a password without braces or a secret in a screenshot. Read the public copy like an attacker, as in lesson 14.4.
- **Renaming a section.** `## Steps taken` fails the check, because the script looks for exact headings. Keep the headings of the template.

## Key terms

- **Template**: a file with the structure already in place, copied as the starting point for each new document.
- **Git history**: the chain of all commits in a repository. A file committed once can still be read from it after the file is deleted.

## Go further

- [Bash Reference Manual: Conditional Constructs](https://www.gnu.org/software/bash/manual/html_node/Conditional-Constructs.html): the official description of `if` and related commands used in the check script.
- [Git Book: Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks): how to make git run a script like this one automatically before each commit.
