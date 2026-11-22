---
title: Writing a good README
description: Write a README whose first screen says what the project is, shows an example and gets a stranger running it, then check that every promise in it is true.
lesson: "16.3"
time: 25 min
sidebar:
  order: 3
---

<!-- lab: run
git config --global user.name "Sam"
git config --global user.email "sam@example.com"
git config --global init.defaultBranch main
rm -rf /tmp/wordfreq-check
-->

Picture the visitor. They clicked a link to your repository, and they will give it about as long as it takes to read one screen. In that time they want answers to three questions: what is this, is it for me, and how do I try it? A README that answers them gets the visitor to run your code. One that starts with the story of how you learned Python loses them before the first command.

## Goal

After this lesson you can:

- Write a README with the parts a reader needs, in the order they need them.
- Put a one-sentence description, an example and a quick start on the first screen.
- Check that every file and every command in a README is real, by following it in a fresh copy.

## Why it matters

On GitHub, the README is the front page of a repository: it is shown below the list of files, and for most visitors it is the only file they read. Recruiters and teachers who look at your projects read the README first and the code second, if at all. A README is also a promise. If it names a file that is not there, or a command that fails, the reader stops trusting the rest.

## The idea

A good README is built like the label on a medicine box. The name and what it is for come first, in large print. How to use it comes next. The details, the limits and the warnings come after that, for the people who need them. Nobody wants to read the chemistry before they find out what the pills are for.

In a README, that order looks like this:

| Part | What it answers | First screen? |
|---|---|---|
| Name and one sentence | What is it, and who is it for? | Yes |
| Example | What does it look like when it runs? | Yes |
| Quick start | What do I need, and how do I run it? | Yes |
| Usage | Which options are there? | |
| Files | What is in the repository? | |
| Tests | How do I check that it works? | |
| Limits | What does it not do, or not do well? | |
| License and contact | May I reuse it, and whom do I tell about a bug? | |

The **first screen** is what a visitor sees without scrolling, roughly the first 20 to 30 lines of a README on a laptop. The **quick start** is the shortest list of commands that takes a stranger from nothing to a working run. Keep it to what really is needed, and give the exact commands, not a description of them.

Two more habits make a README trustworthy. Say what you tested on ("tested with Python 3.12 on Ubuntu 24.04") instead of guessing what else might work. And write down the **limits**: what the project does not do. An honest limit makes the rest more believable, and it saves a reader from finding the problem the hard way.

## Try it

You write a README for a small tool called `wordfreq`, which prints the most common words in a text file. The outputs come from a user called `sam`.

### 1. Create the project

```bash
mkdir -p ~/readme-lab/wordfreq
cd ~/readme-lab/wordfreq
```

```python title="wordfreq.py"
#!/usr/bin/env python3
"""Print the most common words in a text file."""
import argparse
from collections import Counter


def top_words(text, n):
    """Return the n most common words, ignoring case and punctuation."""
    words = [w.strip(".,;:!?\"'()") for w in text.lower().split()]
    return Counter(w for w in words if w).most_common(n)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", help="the text file to read")
    parser.add_argument("-n", type=int, default=5,
                        help="how many words to show (default: 5)")
    args = parser.parse_args()
    with open(args.file, encoding="utf-8") as f:
        text = f.read()
    for word, count in top_words(text, args.n):
        print(f"{count:4}  {word}")


if __name__ == "__main__":
    main()
```

```text title="sample.txt"
The shell reads a line. The shell splits the line into words.
Then the shell runs the first word as a command, and the other
words become its arguments.
```

```bash
python3 wordfreq.py sample.txt -n 3
```

```output
   6  the
   3  shell
   2  a
```

The tool works. Everything in it comes from Module 3: `argparse` for the options, `Counter` for the counting, and `strip` to remove punctuation from the ends of each word, so that "line." and "line" count as one.

### 2. Look at a README that does not help

This is the kind of README that many first projects have. Save it as `README.md`:

```markdown title="README.md"
# wordfreq

I started this project in November while I was learning Python.
At first I wanted to make a big text analysis program, but then
I decided to start small. I tried a dictionary first, then I found
Counter, which is much better. It took me a while to get the
punctuation right. Maybe I will add more features later.
```

Read it with the three questions of the opening. What is it? Only the name hints at it. Is it for me? No idea. How do I try it? Not a word. All six lines are about the author. The story is not wrong, but it belongs at the end, or in a blog post.

### 3. Write it again with the template

Replace the whole file with this version. It uses `~~~` to start and end code blocks, which Markdown treats exactly like three backticks; it is used here only so that the README fits inside this lesson's own code box.

```markdown title="README.md"
# wordfreq

Print the most common words in a text file. A small command-line tool
for a quick look at what a text is about.

~~~bash
python3 wordfreq.py sample.txt -n 3
~~~

~~~text
   6  the
   3  shell
   2  a
~~~

## Quick start

You need Python 3, nothing else. Tested with Python 3.12 on Ubuntu 24.04.

~~~bash
git clone https://github.com/yourname/wordfreq.git
cd wordfreq
python3 wordfreq.py sample.txt
~~~

## Usage

~~~text
python3 wordfreq.py FILE [-n N]
~~~

- `FILE`: the text file to read, in UTF-8.
- `-n N`: how many words to show. The default is 5.

## Files

- `wordfreq.py`: the tool.
- `sample.txt`: a short text to try it on.
- `test_wordfreq.py`: the tests.

## Tests

~~~bash
python3 -m unittest
~~~

## Limits

- Only spaces separate words, so `well-known` counts as one word.
- The whole file is read into memory, so a very large file needs a lot of it.

## License

None yet. Until a license is added, people may read the code, but they
have no permission to reuse it.

## Contact

Found a mistake? Open an issue in this repository.
```

The first screen now holds the name, one sentence, an example with its real output, and the quick start. The example output is the one from step 1, copied, not typed from memory. The usage line follows the code you learned in lesson 16.1: `[-n N]` is optional, `FILE` is a placeholder.

### 4. Check that every file it names exists

A README names files. Check that each one is really there:

```bash
grep -o -E '`[A-Za-z0-9_./-]+\.(py|txt|md)`' README.md | tr -d '`' | sort -u | while read -r f; do
  if [ -e "$f" ]; then echo "ok       $f"; else echo "MISSING  $f"; fi
done
```

```output
ok       sample.txt
MISSING  test_wordfreq.py
ok       wordfreq.py
```

`grep -o` prints only the matching part: a name between backticks that ends in `.py`, `.txt` or `.md`. `tr -d` removes the backticks and `sort -u` drops duplicates. The last part is a new kind of loop: `while read -r f; do ... done` reads the names that come through the pipe one line at a time, puts each one in the variable `f`, and runs the lines between `do` and `done` for it. Inside, `[ -e "$f" ]` is true when `f` exists, as a file or as a directory, like the `[ -f ]` and `[ -d ]` tests of lesson 1.9. The README promises tests that do not exist. That is exactly the kind of mistake a reader finds in the first minute.

### 5. Keep the promise

Add the tests the README talks about. They use `unittest`, which comes with Python:

```python title="test_wordfreq.py"
import unittest

from wordfreq import top_words


class TopWordsTest(unittest.TestCase):
    def test_case_is_ignored(self):
        self.assertEqual(top_words("Cat cat dog", 1), [("cat", 2)])

    def test_punctuation_is_removed(self):
        self.assertEqual(top_words("end. end!", 1), [("end", 2)])


if __name__ == "__main__":
    unittest.main()
```

```bash
python3 -m unittest 2>&1 | tail -n 1
```

```output
OK
```

`python3 -m unittest`, the command in the README, finds every file in the folder whose name starts with `test` and ends in `.py`, and runs the tests in it. It prints its report on the error output, so `2>&1` sends it into the pipe, and `tail` keeps the last line. Run the check from step 4 again:

```bash
grep -o -E '`[A-Za-z0-9_./-]+\.(py|txt|md)`' README.md | tr -d '`' | sort -u | while read -r f; do
  if [ -e "$f" ]; then echo "ok       $f"; else echo "MISSING  $f"; fi
done
```

```output
ok       sample.txt
ok       test_wordfreq.py
ok       wordfreq.py
```

Every file the README names is real now. The other way to fix it, removing the line from the README, would have been honest too. What is never fine is a README that promises more than the project has.

### 6. Follow the README like a stranger

The real test of a quick start: a fresh copy, nothing but the README, and its commands typed one by one. Commit, then clone the repository into a new folder, as in Module 2:

```bash
git init -q
git add README.md sample.txt test_wordfreq.py wordfreq.py
git commit -q -m "Add wordfreq with README and tests"
rm -rf /tmp/wordfreq-check
git clone -q ~/readme-lab/wordfreq /tmp/wordfreq-check
cd /tmp/wordfreq-check
ls
```

```output
README.md  sample.txt  test_wordfreq.py  wordfreq.py
```

`rm -rf` removes an old copy first, in case you run this twice. The clone holds only what is committed, the same as what a visitor gets from GitHub. Now the commands from the README, in the order it gives them:

```bash
python3 wordfreq.py sample.txt
```

```output
   6  the
   3  shell
   2  a
   2  line
   2  words
```

The quick start runs without `-n`, so it shows the default of five words, as the usage section says. The first three lines are the same as in the example at the top of the README.

```bash
python3 -m unittest 2>&1 | tail -n 1
```

```output
OK
```

The tests pass in the fresh copy too. Only the `git clone` line from GitHub was replaced with a local clone; on your own project, try that line as well, once it is pushed.

:::tip[Ask someone else to try]
The best README test is a classmate who has never seen the project, with your README and nothing else. Do not help them. Every place where they hesitate or ask a question is a line your README is missing.
:::

## Exercise

Add a `--min-length` option to `wordfreq.py` that skips words shorter than a given number of letters, so that `--min-length 4` drops "the" and "a". Then update the README so that it stays true: the usage section, and an example of the new option with its real output. Run the file check from step 4 and the tests again, and commit.

<details>
<summary>Show the solution</summary>

Change `top_words` and `main` in `wordfreq.py`:

```python
def top_words(text, n, min_length=1):
    """Return the n most common words, ignoring case and punctuation."""
    words = [w.strip(".,;:!?\"'()") for w in text.lower().split()]
    return Counter(w for w in words if len(w) >= min_length).most_common(n)
```

```python
    parser.add_argument("--min-length", type=int, default=1,
                        help="skip words shorter than this (default: 1)")
```

and pass it on: `top_words(text, args.n, args.min_length)`. `len(w) >= 1` also drops the empty strings, which `if w` did before.

<!-- lab: run
cd ~/readme-lab/wordfreq
python3 - <<'PYEOF'
from pathlib import Path
p = Path("wordfreq.py")
s = p.read_text()
pairs = [
    ("def top_words(text, n):", "def top_words(text, n, min_length=1):"),
    ("    return Counter(w for w in words if w).most_common(n)", "    return Counter(w for w in words if len(w) >= min_length).most_common(n)"),
    ('                        help="how many words to show (default: 5)")\n', '                        help="how many words to show (default: 5)")\n    parser.add_argument("--min-length", type=int, default=1,\n                        help="skip words shorter than this (default: 1)")\n'),
    ("top_words(text, args.n)", "top_words(text, args.n, args.min_length)"),
]
for old, new in pairs:
    assert old in s, old
    s = s.replace(old, new)
p.write_text(s)
PYEOF
-->

```bash
cd ~/readme-lab/wordfreq
python3 wordfreq.py sample.txt -n 3 --min-length 4
```

```output
   3  shell
   2  line
   2  words
```

In the README, the usage section becomes:

```text
python3 wordfreq.py FILE [-n N] [--min-length L]
```

with one more bullet: "`--min-length L`: skip words shorter than L letters. The default is 1." Add the command above and its output as a second example. Then run the file check and `python3 -m unittest`, and commit both files together with `git add README.md wordfreq.py`.

</details>

## Check yourself

**1. Which three questions must the first screen of a README answer?**

<details>
<summary>Answer</summary>

What is it, is it for me, and how do I try it? In practice: a name with one sentence, an example, and a quick start.

</details>

**2. Why copy the example output from a real run instead of typing it?**

<details>
<summary>Answer</summary>

Because a typed output can be wrong, and a reader who gets something different stops trusting the README. A copied output is exactly what the tool prints.

</details>

**3. Why does a README have a "Limits" section?**

<details>
<summary>Answer</summary>

To say honestly what the project does not do, or does not do well. It saves the reader from finding the problem the hard way, and it makes the rest of the README more believable.

</details>

**4. How do you test a quick start?**

<details>
<summary>Answer</summary>

In a fresh copy of the repository, such as a new clone, run its commands one by one exactly as written. A fresh copy has only what is committed, like a visitor's copy.

</details>

**5. The file check prints `MISSING  test_wordfreq.py`. What are your two honest options?**

<details>
<summary>Answer</summary>

Add the file the README promises, or remove the promise from the README. Either way, the README and the project match again.

</details>

## Common mistakes

- **Starting with your story.** The reader wants to know what the project does. Put the history at the end, or leave it out.
- **No example.** One command with its real output explains more than a paragraph. For a web app or a game, a screenshot does the same job.
- **"Install the dependencies" without the command.** Give the exact command. The reader does not know which tool you used.
- **A README that falls behind the code.** When you add or rename something, update the README in the same commit. The file check from step 4 catches renamed files.
- **Claims you never checked.** "Works on Windows and macOS" when you only tried Ubuntu. Write what you tested on, and nothing more.

## Key terms

- **First screen**: the part of a page that a visitor sees without scrolling. For a README, roughly its first 20 to 30 lines.
- **Quick start**: the shortest list of exact commands that takes a new user from nothing to a working run.
- **Limits**: a README section that says honestly what a project does not do, or does not do well.

## Go further

- [GitHub Docs: About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes): where GitHub looks for a README and how it shows it.
- [Choose a License](https://choosealicense.com/): a short guide from GitHub to the common open source licenses, and what happens when there is none.
- [Write the Docs: A beginner's guide to writing documentation](https://www.writethedocs.org/guide/writing/beginners-guide-to-docs/): what a README should contain, and why.
