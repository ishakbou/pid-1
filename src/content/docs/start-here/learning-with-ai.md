---
title: How to learn with AI without letting it think for you
description: Six rules for using an AI assistant as a tutor and not as an answer machine, and a way to check what it tells you.
lesson: "0.6"
time: 15 min
practiceTerminal: true
sidebar:
  order: 6
---

An AI assistant can solve every exercise in the first half of this course in a few seconds. That is exactly why it can ruin the course for you. The exercises are not there to be solved. They are there so that you become a person who can solve them.

## Goal

After this lesson you can:

- Use an AI assistant as a tutor: ask for hints and explanations, not for finished answers.
- Check what an AI tells you by running it yourself.
- Say what you must never paste into an AI tool.

## Why it matters

Your skill is what you can do when nobody helps you: in an exam, in a job interview, or at three in the morning when a server is down and you are the one on call. There is a second reason. AI assistants make mistakes, and they make them in the same calm, sure voice as their correct answers. In security work, one wrong command can delete data or open a door to an attacker. The person who can check an answer is the only one who can use these tools safely.

## The idea

An **AI assistant** is a program that answers questions in ordinary language. You type a message and it writes a reply. ChatGPT, Claude and Gemini are well-known examples. It builds its reply word by word, choosing words that are likely to follow, based on the huge amount of text it was trained on.

That explains its two faces. It has seen so many explanations that it explains very well, with endless patience, at any hour. But in an ordinary chat it does not run your command, it does not see your screen, and it does not notice when it is wrong. A false statement that an AI presents as a fact has a name: a **hallucination**. It looks exactly like a true one.

Now think of a gym. Imagine a robot that lifts the weights for you. Every weight goes up and your muscles do not change, because the lifted weight was never the point. The effort was. An exercise in this course is a weight. If the AI lifts it, the exercise is done and you are the same as before.

A good trainer is different. A trainer watches, corrects your position, and tells you which exercise comes next, but never lifts the bar. You can ask an AI to be that trainer. It depends on how you write your message.

| Answer machine | Tutor |
|---|---|
| "Solve this exercise." | "Here is what I tried and the error I got. Give me a hint, not the solution." |
| "Write the script for me." | "Explain what line 3 of my script does." |
| "Fix my code." | "My code prints 3 and I expected 3.5. Where should I look?" |
| "Summarise this lesson." | "Ask me three questions to check that I understood this lesson." |

### Six rules

1. **Try first.** Give every exercise ten minutes alone before you ask anything. Being stuck is not wasted time. It is the moment when your brain builds the thing you came for. And if you still need help after ten minutes, you know exactly what to ask.
2. **Ask for a hint, not for the answer.** Say it in so many words: "do not give me the solution". If the answer comes anyway, look away and ask again.
3. **Explain it back.** After an explanation, write it again in your own words and ask whether it is right. If you cannot write it, you have not understood it yet.
4. **Check by running.** The terminal is the judge, not the AI. A claim about a command can be tested in ten seconds, so test it.
5. **Keep nothing that you cannot explain.** If a line of your script came from an AI and you cannot say what it does, it is not yours yet. Understand it or remove it.
6. **Keep secrets out.** Never paste a password, a key (a long secret code that works like a password), or private data about you or other people into an AI tool. What you send leaves your computer.

One more point that is not about learning: if your school has rules about AI in graded work, they come before anything written here.

This lesson is about learning. Building real things together with an AI is another skill, and [Module 15](../ai/) is about it. It comes late in the course on purpose: you can only judge the work of an AI in a field that you know yourself.

## Try it

You can do the steps in the practice terminal on this page or in your own terminal. Step 2 needs an AI assistant. If you have none, or do not want one, skip that step: the course never requires an AI.

### 1. Predict before you run

Read this command. Do not run it yet. `$(( ))` asks the terminal to calculate what is inside, and `/` is a division. Decide what will be printed, and say your answer aloud.

```bash
echo $((7 / 2))
```

```output
3
```

Most people say 3.5. The terminal answers 3, because it calculates here with whole numbers only and drops everything after the point.

If you were wrong, good. A wrong prediction followed by a real result teaches more than reading the right answer. This is rule 1 in small: you tried first, so the result means something to you.

### 2. Ask like a student, not like a customer

Open an AI assistant and send this message, in your own words if you like.

```text
I am a beginner in the Linux terminal. I ran: echo $((7 / 2))
I expected 3.5 and I got 3.
Do not give me the rule. Ask me one question that helps me find the reason myself.
```

Look at how the message is built: who you are, what you did, what you expected, what you got, and what kind of help you want. Answer the question that comes back. Then write the explanation in one sentence of your own and ask if it is correct. These are rules 2 and 3.

### 3. Check a claim yourself

Suppose the assistant adds: "the `%` sign gives the remainder of a division". It sounds right. Do not file it as a fact yet. Test it. Seven divided by two is three, and one is left over, so this should print 1.

```bash
echo $((7 % 2))
```

```output
1
```

One test can be luck. Six divided by two leaves nothing, so this should print 0.

```bash
echo $((6 % 2))
```

```output
0
```

Two predictions, two matches. Now you have a reason to believe the claim, and the reason is your own test, not the confident tone of a machine. This is rule 4.

### 4. Catch a confident mistake

Here is another claim, written the way an AI would write it:

"The command `echo $((10 / 4 * 4))` prints 10, because dividing by 4 and then multiplying by 4 cancel each other out."

It is clear and logical. Run it.

```bash
echo $((10 / 4 * 4))
```

```output
8
```

The claim was false. I wrote it wrong on purpose, and you already know enough to see why: with whole numbers, 10 divided by 4 gives 2, and 2 times 4 gives 8. The sentence sounded as sure as a true one. Only the run showed the difference. When an AI tells you something that matters, this step is not optional.

### 5. Explain it back

Close your eyes or look away from the screen. Explain in two sentences why `echo $((7 / 2))` prints 3. Say it aloud, or write it on paper.

If the sentences come easily, the idea is yours. If they do not, go back to step 1. Rule 3 works without any AI.

:::caution[Commands you do not understand]
Never run a command from an AI, or from any website, when you cannot explain what each part does. This matters most when it contains `sudo` or `rm`, which can change or delete things for good. Ask for an explanation of every part first. If you want to see what a command does, try it in the practice terminal, where a reload repairs everything.
:::

## Exercise

**Part 1.** Each of these messages treats the AI as an answer machine. Rewrite each one as a message to a tutor.

1. "Write a script that makes a backup of my folder."
2. "What is the answer to question 3 of the quiz?"
3. "Here is my error message. Fix it."

**Part 2.** An assistant tells you: "`echo $((1 + 2 * 3))` prints 9, because the terminal calculates from left to right." Check the claim. Is it true? If not, what is the real rule?

<details>
<summary>Show the solution</summary>

**Part 1.** Many answers are good. A good one says what you tried, and asks for a hint, a question or an explanation.

1. "I want to write a script that makes a backup of my folder. I think I need to copy the folder and put the date in the name. Is that a reasonable plan? Do not write the script. Tell me which commands I should read about."
2. "Here is my answer to question 3 and my reason for it. Do not tell me the right answer. Tell me if my reasoning has a hole."
3. "Here is my error message. I think it means that the file does not exist, but the file is there. What should I check first?"

**Part 2.**

```bash
echo $((1 + 2 * 3))
```

```output
7
```

The claim is false. The terminal does the multiplication first, as in school mathematics: 2 times 3 is 6, plus 1 is 7. From left to right, the result would have been 9.

</details>

## Check yourself

**1. What is a hallucination?**

<details>
<summary>Answer</summary>

A false statement that an AI presents as a fact. It is written in the same confident style as a true statement, so you cannot recognise it by its tone.

</details>

**2. Why should you try an exercise for ten minutes before you ask an AI?**

<details>
<summary>Answer</summary>

Because the effort is what builds the skill. An exercise solved by the AI is done, but you have not changed. After ten minutes of trying, you also ask a much better question, and you understand the answer.

</details>

**3. Name two kinds of things that you never paste into an AI tool.**

<details>
<summary>Answer</summary>

Passwords and keys, and private data about you or about other people. What you send leaves your computer.

</details>

**4. An AI gives you a command that contains `sudo` and that you do not understand. It promises that the command fixes your problem. What do you do?**

<details>
<summary>Answer</summary>

You do not run it. You ask for an explanation of every part, and you run it only when you can explain it yourself. If you want to see its effect, you try it in the practice terminal, where nothing can be damaged.

</details>

## Common mistakes

- **Asking before trying.** The answer arrives, you nod, and nothing stays. Ten minutes alone first.
- **Sending an error message without reading it.** Read it slowly first. Half of the time it says what is wrong, and you need nobody.
- **Letting the AI write your notes.** Writing the summary is the learning. A summary that you did not write is one more text that you did not read.
- **Refusing AI out of pride.** That is the opposite mistake. A patient tutor that is awake at any hour is a real advantage, if you keep the six rules.

## Key terms

- **AI assistant**: a program that answers questions and writes text in ordinary language, such as ChatGPT, Claude or Gemini.
- **Hallucination**: a false statement that an AI presents as a fact, in the same confident style as a true one.

## Go further

- [Guidance for generative AI in education and research](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research): UNESCO's free guide. It explains in plain language what these tools are and where their limits are.
- [Bash manual: Shell Arithmetic](https://www.gnu.org/software/bash/manual/html_node/Shell-Arithmetic.html): the official source for today's experiment. It is where you can check that the terminal calculates with whole numbers.
- [Ubuntu manual pages](https://manpages.ubuntu.com/): the official description of every command on Ubuntu. When an AI explains a command, this is where you verify it.
