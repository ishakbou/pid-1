---
title: Blue team vs red team
description: Learn who does what in a security team, what blue, red and purple teams are, and run a small drill where you play both sides on your own machine.
lesson: "13.1"
time: 15 min
sidebar:
  order: 1
---

A bank pays a group of people to break into its own building. They pick locks, wear fake uniforms and try to walk out with a laptop. Another group, on the same payroll, watches the cameras and tries to catch them. Nobody is a criminal here: both groups work for the bank, and the bank learns from every round. Security teams work the same way, and this lesson shows you both sides.

## Goal

After this lesson you can:

- Explain what a blue team, a red team and a purple team do, and how a red team differs from a criminal.
- Name the usual first jobs in defensive security.
- Run a small drill on your own machine: record what normal looks like, make a change as the "attacker", and find it as the defender.

## Why it matters

Job offers in security use these words all the time, and they tell you what a day in that job looks like. Most people who start in security start on the defending side, so this module teaches defense: logs, alerts, incidents and backups. And the core skill of every defender is the one you practice today: knowing what normal looks like, so that you notice when something changes.

## The idea

A **blue team** defends. It keeps systems patched, collects logs, watches alerts, and responds when something goes wrong. A **red team** attacks, but only with written permission, inside an agreed scope, and with a report at the end. It plays the part of a real attacker so that the blue team can find out whether its defenses work. You met the rules for this in lesson 9.1: the permission is what makes it legal.

When the two teams work side by side, share what they see after each attack and improve the defenses together, people call it a **purple team** exercise. Red mixed with blue. It is not a third group of people so much as a way of working: "I did this, at this time. Did you see it? If not, why not?"

Think of a football team at training. Half the players attack, half defend, and after each move the coach stops the game and asks the defenders what they missed. Nobody is trying to win the training match. The goal is a better team on Saturday.

Here are the common roles. The names vary between companies, but the work is similar everywhere.

| Role | Side | What they do all day |
|---|---|---|
| SOC analyst (level 1) | Blue | Reads alerts, decides which are real, passes serious ones on |
| Incident responder | Blue | Takes over real incidents: contains them, cleans up, writes the report |
| Detection engineer | Blue | Writes the rules that turn log lines into alerts |
| Threat hunter | Blue | Searches the logs for attackers that no rule caught yet |
| System administrator | Blue | Patches, accounts, backups: prevention, day after day |
| Penetration tester | Red | Tests one system for weaknesses during an agreed time, then reports |
| Red teamer | Red | Plays a full attacker over weeks, often to test the blue team itself |

A **SOC** (security operations centre) is the room, or the team, that watches the alerts of a whole organization. Its first-level analysts are where many careers start, together with IT support and system administration. Red team jobs usually ask for several years of experience on the blue side first, because you cannot test a defense well if you have never run one.

Every defender's first question is "what is normal here?". A **baseline** is a record of the normal state of a system: which accounts exist, which programs listen on which ports, which files are in a folder. Without a baseline, a new program listening on port 8081 is just a line on the screen. With one, it is a change that needs an explanation.

## Try it

You play both teams on your own machine. The outputs come from a lab machine with the user `sam`; your list of ports may be longer or shorter.

### 1. Record a baseline, as the blue team

<!-- lab: run
sudo systemctl stop mylab-web.service 2>/dev/null
pkill -f "http.server 8081"
-->

```bash
mkdir -p ~/drill
cd ~/drill
ss -tlnH | tr -s ' ' | sort > baseline.txt
cat baseline.txt
```

```output
LISTEN 0 4096 0.0.0.0:22 0.0.0.0:*
LISTEN 0 4096 127.0.0.53%lo:53 0.0.0.0:*
LISTEN 0 4096 127.0.0.54:53 0.0.0.0:*
LISTEN 0 4096 [::]:22 [::]:*
```

`ss -tln` lists the TCP ports that programs listen on, as in lesson 6.7, and `-H` leaves out the header line. Two helpers make the list easy to compare later. `tr -s ' '` squeezes each run of spaces into one, because `ss` changes the width of its columns when a longer address appears. `sort` puts the lines in a fixed order, because `ss` does not always list them in the same order. The `>` saves the result in a file.

On this machine, only SSH (port 22) and the local DNS helper (port 53) listen. That is the normal state.

### 2. Make a move, as the red team

Now switch sides. An intruder who gets into a machine often starts a program that waits for their connections. You play that part with something harmless, Python's small web server, listening only on your own machine:

```bash
python3 -m http.server 8081 --bind 127.0.0.1 > /dev/null 2>&1 &
```

<!-- lab: run
for i in $(seq 50); do ss -tln | grep -q ':8081 ' && break; sleep 0.2; done
-->

The `&` runs it in the background, as in lesson 1.5, and `> /dev/null 2>&1` throws away its messages. Write down the time. A red team always keeps a log of what it did and when, so that the blue team can check its own logs against it afterwards.

### 3. Spot the change, as the blue team

Back to defending. Take a new picture and compare it with the baseline:

```bash
ss -tlnH | tr -s ' ' | sort > now.txt
diff baseline.txt now.txt
```

```output
4a5
> LISTEN 0 5 127.0.0.1:8081 0.0.0.0:*
```

`diff` prints only what changed. `4a5` means "after line 4 of the first file, a line 5 was added", and `>` marks a line that is only in the second file. Your line numbers may differ, because they depend on the other ports in your list. One new port, 8081. You did not have to read the whole list: the baseline did the work.

### 4. Find out who opened it

<!-- lab: nocheck -->
```bash
sudo ss -tlnp | grep 8081
```

```output
LISTEN 0      5          127.0.0.1:8081      0.0.0.0:*    users:(("python3",pid=1197,fd=3))
```

The `-p` option adds the program behind each port. It needs `sudo` to see programs of other users. The answer: a `python3` process, with its PID from lesson 1.5. Your PID will be different, so your line will too. A defender would now ask: who started it, when, and is it expected? Here you know the answer, because you started it yourself a minute ago.

### 5. Respond, then check again

```bash
pkill -f "http.server 8081"
ss -tlnH | tr -s ' ' | sort > now.txt
diff baseline.txt now.txt && echo "Back to the baseline."
```

```output
Back to the baseline.
```

`pkill -f` stops every process whose command line contains the text. `diff` prints nothing and succeeds when two files are the same, so the `&&` runs the `echo` only then. Checking after a fix is not optional: a fix you did not check is a guess.

### 6. Write it down

<!-- lab: nocheck -->
```bash
echo "$(date '+%F %H:%M') port 8081 opened by python3, expected (drill), stopped" >> notes.txt
cat notes.txt
```

```output
2026-11-22 11:42 port 8081 opened by python3, expected (drill), stopped
```

`%F` is the date as year-month-day. One line per finding: when, what, whether it was expected, what you did. That is the smallest version of the notes that incident responders keep, and lesson 13.4 makes it bigger.

## Exercise

Run the same drill with a different kind of change: a new user account.

1. As the blue team, save the list of usernames from `/etc/passwd` into `~/drill/users-before.txt`. Lesson 1.4 showed the file; `cut -d: -f1` keeps the first field.
2. As the red team, create an account called `helpdesk2` that has no home directory and cannot log in.
3. As the blue team, find the new account with `diff`.
4. Remove the account, and prove that the list is back to the baseline.

<details>
<summary>Show the solution</summary>

```bash
cd ~/drill
cut -d: -f1 /etc/passwd > users-before.txt
sudo useradd -M -s /usr/sbin/nologin helpdesk2
cut -d: -f1 /etc/passwd > users-now.txt
diff users-before.txt users-now.txt
```

```output
34a35
> helpdesk2
```

`-M` means "no home directory" and `/usr/sbin/nologin` is a shell that refuses every login, as in lesson 11.1. The line numbers depend on how many accounts your machine has. Now respond and check:

```bash
sudo userdel helpdesk2
cut -d: -f1 /etc/passwd > users-now.txt
diff users-before.txt users-now.txt && echo "Back to the baseline."
```

```output
Back to the baseline.
```

A new account is one of the first things an intruder adds, because it is a way back in that survives a password change. That is why defenders keep a baseline of accounts, too.

</details>

## Check yourself

**1. A red team and a criminal can use the same techniques. What makes the red team's work legal?**

<details>
<summary>Answer</summary>

Written permission from the owner of the systems, an agreed scope (which systems, which dates, which methods), and a report at the end. Without permission, the same actions are a crime.

</details>

**2. What makes an exercise "purple"?**

<details>
<summary>Answer</summary>

The red and blue teams work together openly: the red team says what it did and when, and the blue team checks whether it saw it and fixes what it missed.

</details>

**3. Why did the blue team save `baseline.txt` before anything happened?**

<details>
<summary>Answer</summary>

To know what normal looks like. Without it, the new port 8081 would be one line among others; with it, `diff` shows the change at once.

</details>

**4. Name two blue team jobs where many people start a career in security.**

<details>
<summary>Answer</summary>

SOC analyst (level 1) and system administrator. IT support is a common start too.

</details>

**5. After you stopped the server, why did you run `ss` and `diff` again?**

<details>
<summary>Answer</summary>

To check that the fix worked. Only the second `diff`, which found no difference, proves that the machine is back to its baseline.

</details>

## Common mistakes

- **Taking the baseline after something has already changed.** A baseline of a machine that is already broken into calls the intruder's program "normal". Record it right after a clean install or a review, and update it on purpose when you add a service.
- **Thinking red team work is the exciting part and blue team work is the boring part.** Both use the same knowledge, and blue team jobs are where most of the work, and most of the jobs, are.
- **Stopping at "I found it".** Finding the port is half the work. Who started it, was it expected, what did you do, and did the fix work? Write it down.
- **Running a drill on a machine you do not own.** A drill is an attack with permission. Use your own machine or your own lab, as in this lesson.

## Key terms

- **Blue team**: the people who defend systems: they prevent, detect and respond to attacks.
- **Red team**: people who attack an organization's systems with written permission, to test its defenses and report what they found.
- **Purple team**: red and blue teams working together openly, sharing each attack and fixing what the defense missed.
- **SOC (security operations centre)**: the team that watches an organization's alerts and responds to them, often day and night.
- **Baseline**: a record of the normal state of a system, used to notice changes.

## Go further

- [NIST: NICE Framework](https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center): the official list of security work roles, with the tasks and skills of each.
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/): how professional testers plan and run a web test, from the red side.
- [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/): a legal place to practice the terminal skills that both teams use every day.
