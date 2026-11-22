---
title: picoCTF
description: What a CTF is, the six challenge categories of picoCTF, how to pick a first challenge, and a five-step method you can use on any of them.
lesson: "14.3"
time: 25 min
sidebar:
  order: 3
---

picoCTF comes from Carnegie Mellon University, and it was first made for school students. Yet its practice area is full of university students and working professionals, because the challenges start easy and get hard slowly. It is free, it runs in your browser, and every challenge is something you are invited to break. This lesson shows you how it is organized, which challenge to open first, and a method for the hour after you open it.

## Goal

After this lesson you can:

- Explain what a CTF and a flag are, and name the six picoCTF categories.
- Choose a first challenge that fits what you already know.
- Solve a challenge with a five-step method: read, look, guess, test, record.

## Why it matters

A CTF challenge is a small, safe copy of real security work. Taking apart an unknown file is forensics, finding the bug in a login page is web testing, and reading a program you did not write is reverse engineering. For a beginner, solved challenges with good write-ups are one of the few ways to show a future employer what you can actually do. And the method you train here, guess and test in small steps, is the same one you will use to debug your own code.

## The idea

A **CTF** (capture the flag) is a security competition in which each challenge hides a secret text, the **CTF flag**. Finding the flag proves you solved the challenge, and you submit it on the challenge page for points. In picoCTF a flag looks like `picoCTF{some_words_here}`. Most CTFs, picoCTF included, are **Jeopardy-style**: a board of separate challenges sorted by category and worth more points the harder they are, which you solve in any order.

picoCTF runs a competition once a year, for about two weeks. The rest of the year, past challenges wait in the **picoGym**, the permanent practice area, where you can solve them at your own pace. That is where you should start. You create a free account at picoctf.org, open the gym, and filter by category. At the time of writing, the gym uses these six categories:

| Category | What you do | What helps from this course |
|---|---|---|
| General Skills | Terminal, files, encodings, small scripts | Modules 1, 3 and 5 |
| Cryptography | Undo encodings and old ciphers, spot crypto used the wrong way | Module 10 |
| Forensics | Take apart files, images and network captures to find hidden data | Modules 5 and 6 |
| Web Exploitation | Find the flaw in a small website made for the challenge | Modules 8 and 12 |
| Reverse Engineering | Read a program and work out what it checks | Modules 3 and 5 |
| Binary Exploitation | Misuse memory bugs in compiled programs | Module 5, and much more reading |

Choosing a first challenge is simple: open General Skills and pick one with few points or many solves. A challenge that thousands of people solved is a good sign that it is fair for a beginner. After a few, pick one that needs a skill you almost have, not one you have never heard of.

The method works the way a doctor examines a patient. First listen to everything the patient says. Then look, without changing anything. Then form one guess, test it with the smallest possible test, and write the result in the patient's file. If the test says no, go back to guessing, not to random treatment.

1. **Read** the title, the description and every hint. Titles are often clues.
2. **Look** at what you were given without changing it: its type, its size, its first bytes. This first, careful look is called **reconnaissance**, or recon.
3. **Guess** one thing you can test: "this looks like hex".
4. **Test** the guess with one small step, and look at the result.
5. **Record** what you did and what it showed, even the dead ends.

Rules first: the challenge is yours to attack, the platform is not. CTF rules, picoCTF's included, forbid attacking the website that hosts the competition, attacking other players, and sharing flags.

## Try it

You will solve a practice challenge made for this lesson, with the method from above. Its flags use `practice{...}` instead of `picoCTF{...}`, so you never mix them up with real ones.

### 1. Read the challenge

> **Layers** (General Skills, 50 points). Our intern says the flag is safe because it was "encrypted twice". Look at `message.txt`.
>
> Hint: encoding is not encryption.

The hint is the biggest clue. Lesson 10.1 showed that an encoding, such as Base64, has no key: anyone who knows which one was used can reverse it. "Twice" suggests two layers. Create the challenge file:

```bash
mkdir -p ~/ctf/layers
cd ~/ctf/layers
```

```text title="message.txt"
63484a6859335270593256376347566c62463976626d5666624746355a58
4a6659585266595639306157316c66516f3d0a
```

### 2. Look before you touch

```bash
file message.txt
wc -c message.txt
```

```output
message.txt: ASCII text
100 message.txt
```

It is plain text, 100 bytes long. Nothing is hidden in a binary format, so the answer is in those two lines.

### 3. Make one guess

The characters look like digits and the letters `a` to `f` only. That is hexadecimal, from lesson 5.1. Check the guess instead of trusting your eyes:

```bash
grep -c '[^0-9a-f]' message.txt
```

```output
0
```

The pattern `[^0-9a-f]` matches any character that is not a hex digit, and `-c` counts the lines that contain one. Zero lines: the guess holds.

### 4. Test it with one small step

```bash
xxd -r -p message.txt
```

```output
cHJhY3RpY2V7cGVlbF9vbmVfbGF5ZXJfYXRfYV90aW1lfQo=
```

`xxd` turns bytes into hex; `-r` reverses that, and `-p` says the input is plain hex without addresses. (If your system says the command `xxd` is not found, install it with `sudo apt install xxd`.) The result is not the flag, but it is clearly something: upper and lower case letters, digits, and an `=` at the end. Those are the marks of Base64, which pads its output with `=`. One layer is off; that matches "twice".

### 5. Peel the next layer

```bash
xxd -r -p message.txt | base64 -d
```

```output
practice{peel_one_layer_at_a_time}
```

The pipe hands the first decoded layer straight to `base64 -d`, which decodes the second. Readable words in the flag format: solved. Notice what you did not do. You did not try ten tools at random. Each step came from something you saw in the step before.

### 6. Record what worked

```bash
printf 'Layers: hex (only 0-9a-f) -> xxd -r -p\n' > notes.txt
printf 'then Base64 (ends with =) -> base64 -d -> flag\n' >> notes.txt
cat notes.txt
```

```output
Layers: hex (only 0-9a-f) -> xxd -r -p
then Base64 (ends with =) -> base64 -d -> flag
```

Two lines now, a full write-up in the next lesson. Notice that the notes say why each step was chosen, in brackets. That "why" is what you will forget first, and it is what you need most when you meet a similar challenge in three months.

:::tip[When a guess fails]
If a decoding step prints garbage, you have not failed: you have learned that the guess was wrong. Write it in your notes ("not Base64: output unreadable") and go back to step 3 with a new guess.
:::

## Exercise

A second practice challenge, from the Forensics category:

> **Report** (Forensics, 100 points). We found `report.txt` on a suspect's USB stick, but it will not open in a text editor.

Create the file in its own folder with the blocks below. `report.b64` only carries the file's bytes into your terminal as text, the way a download would carry them. Do not run `cat report.txt`: the bytes are not text, and printing them can garble your terminal. Use the method to find the flag.

```bash
mkdir -p ~/ctf/report
cd ~/ctf/report
```

```text title="report.b64"
H4sIAAAAAAAAA/PLL0lVKMlXKE7NSbNSKMlIVUjLSUxXyCxWKChKTC7JTE6tLikqLS6JT6osSS2O
z8svic9LzE0truUCANU4BgE6AAAA
```

```bash
base64 -d report.b64 > report.txt
```

<details>
<summary>Show the solution</summary>

Read: "will not open in a text editor" says the content is not text, whatever the name says. Look:

```bash
file report.txt
```

```output
report.txt: gzip compressed data, from Unix, original size modulo 2^32 58
```

`file` ignores the name and reads the magic number at the start of the file, as in lesson 5.5. It is a gzip archive with the wrong extension. Guess: unpacking it gives the content. Test:

```bash
zcat report.txt
```

```output
Note to self: the flag is practice{trust_bytes_not_names}
```

`zcat` unpacks gzip data and prints it, without creating a new file. To look at the first bytes yourself, `xxd report.txt | head -1` shows `1f8b`, the magic number of gzip. The lesson for your notes: "name says text, `file` says gzip, `zcat`".

</details>

## Check yourself

**1. What is a CTF flag, and what does one look like in picoCTF?**

<details>
<summary>Answer</summary>

A secret text that proves you solved a challenge. You submit it for points. In picoCTF it has the form `picoCTF{...}`.

</details>

**2. A challenge gives you a capture of network traffic and asks what a user downloaded. Which category is it most likely in?**

<details>
<summary>Answer</summary>

Forensics: taking apart files, images and network captures to find hidden data.

</details>

**3. How do you choose your first challenges in the picoGym?**

<details>
<summary>Answer</summary>

Start with General Skills and pick challenges with few points or many solves. Later, pick challenges that need a skill you almost have.

</details>

**4. Why run `file` on a challenge file before opening it?**

<details>
<summary>Answer</summary>

A name and an extension can lie, but the bytes cannot. `file` reads the content, such as the magic number, and tells you what the file really is, before you print binary bytes to your terminal by mistake.

</details>

**5. Why was the hint "encoding is not encryption" so useful for Layers?**

<details>
<summary>Answer</summary>

It said that no key was needed: the flag was only encoded, so recognizing each encoding (hex, then Base64) and reversing it was enough.

</details>

## Common mistakes

- **Trying tools at random.** Ten random decoders may give you a flag once, but they teach you nothing. Make one guess from what you see, then test it.
- **Changing the only copy of the file.** Some steps overwrite or unpack in place. Keep the original and work on a copy (`cp message.txt work.txt`).
- **Submitting a flag with a typo or an extra space.** Flags must match exactly. Copy the text from the terminal, including the braces.
- **Starting with Binary Exploitation because it sounds impressive.** It needs the most background. Build up from General Skills and Forensics.
- **Attacking the platform instead of the challenge.** The website that hosts the CTF is out of scope. Only what the challenge points you to is a target.

## Key terms

- **CTF** (capture the flag): a security competition in which each challenge hides a secret text that proves you solved it.
- **CTF flag**: the secret text of a CTF challenge, such as `picoCTF{...}`, submitted for points.
- **Jeopardy-style CTF**: a CTF with a board of separate challenges, sorted by category and points, solved in any order.
- **picoGym**: picoCTF's permanent practice area with past challenges.
- **Reconnaissance**: the first careful look at a target to learn what it is, before you change anything. Often shortened to recon.

## Go further

- [picoCTF](https://picoctf.org/): the official site, with the picoGym and the dates of the next competition.
- [picoPrimer](https://primer.picoctf.org/): picoCTF's own free guide to the skills behind each category.
- [base64 manual page](https://man7.org/linux/man-pages/man1/base64.1.html): the options of `base64`, which you will use in many General Skills and Cryptography challenges.
