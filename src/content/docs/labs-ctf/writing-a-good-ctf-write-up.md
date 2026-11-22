---
title: Writing a good CTF write-up
description: Turn your notes into a write-up with a fixed structure, explain the reasoning behind each step, use screenshots well, and remove secrets before you publish.
lesson: "14.4"
time: 20 min
sidebar:
  order: 4
---

Three months from now you will open a challenge and think: I have seen this before. You search your files and find `practice{peel_one_layer_at_a_time}`, alone in a text file. The flag is there, but how you got it is gone. A write-up fixes that. It is the difference between having solved a challenge once and knowing how to solve the next one.

## Goal

After this lesson you can:

- Write up a challenge in a fixed structure: summary, recon, steps, dead ends, flag, lessons.
- Explain the reasoning behind each step, not only the commands.
- Use screenshots where they help, and remove flags and secrets before you publish.

## Why it matters

Writing forces you to understand. If you cannot explain why a step worked, you got lucky, and the write-up shows you where. Write-ups are also how the CTF community teaches: after a competition ends, players publish theirs, and reading them is one of the fastest ways to learn. And in a job, the same skill has another name. A penetration tester's report or an incident report is a write-up for a reader who was not there.

## The idea

A **write-up** is a document that explains how you solved a challenge, written for a reader who has not solved it. That reader may be someone else, or you in three months. Think of a recipe compared with a photo of a cake. The flag is the photo: proof that it worked, but no help to anyone baking the next one. The write-up is the recipe, with notes about what burned.

Every write-up in this course uses the same sections:

| Section | What goes in it |
|---|---|
| Header | Name, platform, category, points, date solved |
| Summary | Two or three sentences: what the challenge was and the key idea. No flag. |
| Recon | What you were given and what you noticed first |
| Steps | One numbered step per idea: what you saw, what you guessed, the command, the result |
| Dead ends | What you tried that did not work, and why |
| Flag | The flag, or `REDACTED` in a public version |
| What I learned | One to three things to remember for next time |

The steps are where most write-ups fail. Compare two versions of the same step:

```text
Bad:  xxd -r -p message.txt | base64 -d
Good: The output ended with "=" and used only letters, digits, "+" and "/".
      That is what Base64 looks like, so I decoded it with base64 -d.
```

The bad one is a command. The good one is a decision. Use this shape for every step: **I saw** something, **so I guessed** something, **I tested** it with a command, and **it showed** a result.

**Screenshots** help when the evidence is visual: a web page, a browser's developer tools, a tool with windows such as Wireshark. For terminal output, paste the text instead. Text can be searched and copied, it is readable on a phone, and it never goes blurry. When you do take a screenshot, crop it to the part that matters, and give it **alt text**: a short description of the image for readers who cannot see it, written in Markdown as `![what the image shows](images/step2.png)`. Keep the images in an `images/` folder next to the write-up.

Before you publish, there is one more job: **redaction**, removing secrets from a document. A flag, a password, a token, a real person's email: anything that should not leave your computer. A solid black box hides text in a screenshot; a blur sometimes does not. And publish only what the rules allow. Many competitions forbid write-ups until the event has ended, and some platforms ask players never to publish solutions. Read the rules first.

## Try it

You write up Layers, the practice challenge from lesson 14.3. It uses the notes and files from that lesson.

<!-- lab: run
mkdir -p ~/ctf/layers
cd ~/ctf/layers
printf '63484a6859335270593256376347566c62463976626d5666624746355a58\n4a6659585266595639306157316c66516f3d0a\n' > message.txt
printf 'Layers: hex (only 0-9a-f) -> xxd -r -p\n' > notes.txt
printf 'then Base64 (ends with =) -> base64 -d -> flag\n' >> notes.txt
cd ~
-->

### 1. Start from your notes

```bash
cd ~/ctf/layers
cat notes.txt
```

```output
Layers: hex (only 0-9a-f) -> xxd -r -p
then Base64 (ends with =) -> base64 -d -> flag
```

These two lines are the skeleton. Notes taken while you work are the best material for a write-up, because they hold the reasons, and reasons are the first thing memory drops.

### 2. Write the write-up

Create `writeup.md` in **Markdown**, the plain-text format where `#` starts a heading and `-` starts a list item. Inside it, commands and their output are indented by four spaces (seven inside a numbered step), which Markdown shows as a code block; a `$` in front marks what you typed.

```markdown title="writeup.md"
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
```

Notice that every step starts with what you saw. A reader could follow your thinking even without running the commands.

### 3. Check the structure

```bash
grep '^## ' writeup.md
```

```output
## Summary
## Recon
## Steps
## Dead ends
## Flag
## What I learned
```

`^## ` matches lines that start with a second-level heading. All six sections are there, in order. On a long write-up, this one line tells you at once whether you forgot a section.

### 4. Make a public copy without the flag

Keep `writeup.md` private, with the flag. For publishing, make a copy with the flag replaced:

```bash
sed 's/practice{[^}]*}/practice{REDACTED}/g' writeup.md > writeup-public.md
grep -n 'practice{' writeup-public.md
```

```output
38:       practice{REDACTED}
47:practice{REDACTED}
```

`sed` with `s/old/new/g` replaces every match on every line. The pattern `practice{[^}]*}` means the word, an opening brace, any characters except a closing brace, and the closing brace. Both copies of the flag are gone, the one in the Steps section and the one in the Flag section.

### 5. Read the public copy like an attacker

Is the flag really gone? Look at step 2 of the write-up again: it shows the Base64 text, and Base64 needs no key.

```bash
grep -o 'cHJh[A-Za-z0-9+/=]*' writeup-public.md | base64 -d
```

```output
practice{peel_one_layer_at_a_time}
```

`grep -o` prints only the part of a line that matches, not the whole line. The pattern starts with `cHJh`, the first four characters of the Base64 text, and continues over the characters Base64 uses, so it cuts out exactly that text and hands it to `base64 -d`.

The redaction failed. Anyone can decode the middle step and get the flag back. Remove that line too, then check again:

```bash
sed -i 's|cHJh[A-Za-z0-9+/=]*|(Base64 text removed)|' writeup-public.md
grep -c 'cHJh' writeup-public.md
```

```output
0
```

`sed -i` edits the file in place. The `|` replaces `/` as the separator, because the pattern itself contains a `/`. This is the real lesson of redaction: hiding the secret is not enough, you also hide every step that leads straight back to it.

:::caution[Redaction is about the whole document]
Look for anything a reader could turn back into the secret: an encoded copy, a hash of a short password, a URL with a token in it, a screenshot of a terminal. When in doubt, keep the write-up private.
:::

## Exercise

A friend wrote up Report, the Forensics challenge from the exercise of lesson 14.3, and asks for your review. Save it as `bad-writeup.md` and find at least five problems. Use `grep` for two of them: images without alt text, and an unredacted flag.

```markdown title="bad-writeup.md"
# report

![](screenshot1.png)

zcat report.txt

flag: practice{trust_bytes_not_names}

was easy
```

<details>
<summary>Show the solution</summary>

```bash
grep -n '!\[\]' bad-writeup.md
grep -n 'practice{' bad-writeup.md
```

```output
3:![](screenshot1.png)
7:flag: practice{trust_bytes_not_names}
```

`!\[\]` matches `![]`, an image with empty alt text; the backslashes make the brackets plain characters. Problems you could list:

1. No header: no platform, category, points or date.
2. No summary.
3. No reasoning. Why `zcat`? The key step, `file` showing gzip despite the `.txt` name, is missing.
4. A screenshot of a terminal, without alt text. The output should be pasted as text.
5. The flag is not redacted, so this version must not be published.
6. No dead ends and no "what I learned". "was easy" tells the reader nothing.

A better summary, for example: "The file was named `report.txt` but was really gzip data. `file` showed the real type, and `zcat` unpacked the flag." You will write the full version in the project step.

</details>

## Check yourself

**1. Name the sections of a write-up in this course's format.**

<details>
<summary>Answer</summary>

Header, Summary, Recon, Steps, Dead ends, Flag, What I learned.

</details>

**2. Why write down dead ends?**

<details>
<summary>Answer</summary>

They show your real reasoning, they save the next reader from trying the same thing, and they remind you later why an idea did not work.

</details>

**3. Terminal output: screenshot or text? Why?**

<details>
<summary>Answer</summary>

Text. It can be searched and copied, it is readable on any screen, and it is smaller. Keep screenshots for visual things such as web pages or tools with windows.

</details>

**4. You replaced the flag with `REDACTED`, but the public write-up still shows the Base64 text of step 2. Is that a problem?**

<details>
<summary>Answer</summary>

Yes. Base64 needs no key, so anyone can decode that line and get the flag back. Redact every step that leads straight to the secret, not only the secret itself.

</details>

**5. When may you publish a write-up of a competition challenge?**

<details>
<summary>Answer</summary>

Only when the rules allow it, which usually means after the competition has ended. Some platforms ask that solutions are never published; then the write-up stays private.

</details>

## Common mistakes

- **Writing only commands.** A list of commands is a script, not a write-up. Add what you saw and why you chose each step.
- **Writing it a week later.** By then the reasons are gone. Take notes while you solve, and write up the same day.
- **Screenshots of text.** They cannot be searched or copied. Paste terminal output as text.
- **Redacting the flag but not the path to it.** An encoded copy, an intermediate output or a token in a URL gives the secret back. Read the public copy like an attacker.
- **Publishing during a live competition.** It breaks the rules and spoils the event. Wait until it ends, and check the rules first.

## Key terms

- **Write-up**: a document that explains how a challenge was solved, for a reader who has not solved it.
- **Alt text**: a short text description of an image, read by screen readers and shown when the image cannot load.
- **Redaction**: removing secrets, such as flags, passwords and tokens, from a document before others see it.

## Go further

- [picoCTF](https://picoctf.org/): after you solve a picoGym challenge, write it up in this format, then compare with the reasoning in its hints.
- [The img element on MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img): the `alt` attribute, and how to write useful alt text.
- [sed manual](https://www.gnu.org/software/sed/manual/sed.html): the official manual of `sed`, including the `s` command used for redaction.
