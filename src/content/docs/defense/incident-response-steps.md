---
title: Incident response steps
description: Learn the six steps of incident response (prepare, detect, contain, remove, recover, learn) and walk through a small, harmless incident drill on your own machine.
lesson: "13.4"
time: 25 min
sidebar:
  order: 4
---

<!-- lab: run
cp ~/.ssh/authorized_keys /tmp/ak.save
pkill -f .update.sh
sed -i '/support@203.0.113.66/d' ~/.ssh/authorized_keys
crontab -r 2>/dev/null
rm -rf ~/.cache/.update.sh /tmp/.update.log /tmp/drill_key /tmp/drill_key.pub
-->

What do you do in the first ten minutes after you find out that someone else has been on your machine? Most people do one of two things. They panic and switch it off, which destroys evidence, or they start deleting whatever looks strange, and miss the one thing that lets the intruder come back. Incident response is the calm, written-down alternative, and you practice it in this lesson on an incident you plant yourself.

## Goal

After this lesson you can:

- Name the six steps of incident response and say what each one is for.
- Investigate a small incident on your own machine, and keep evidence before you change anything.
- Contain it, remove what the intruder left, check the result, and write a short report.

## Why it matters

Every organization has incidents, and the difference between a bad day and a disaster is usually the response, not the attack. Steps done in the wrong order cost a lot: an intruder who sees you coming can hide, and a machine wiped too early can no longer tell you how they got in. Interviewers for defense jobs ask "what would you do if...?" all the time, and they want to hear these steps.

## The idea

An **incident** is an event that harms, or threatens, the confidentiality, integrity or availability of a system: the CIA triad of lesson 9.2. A failed login is an event. A stranger's SSH key in your account is an incident. **Incident response** is the planned way of handling one, in six steps:

| Step | Question it answers | Example |
|---|---|---|
| 1. Prepare | Are we ready before anything happens? | Baselines, logs, backups, a written plan, who to call |
| 2. Detect | Is this real, and how big is it? | Read the alert, look for related changes, keep evidence |
| 3. Contain | How do we stop it from getting worse? | Stop the program, remove the access, isolate the machine |
| 4. Remove | How do we get rid of everything they left? | Delete their files, remove their way back in, fix the hole |
| 5. Recover | How do we get back to normal safely? | Check against the baseline, restore from backup, watch closely |
| 6. Learn | What do we change so it does not happen again? | A short report: timeline, cause, what to improve |

NIST, the US standards body, describes the same work in its incident response guide, SP 800-61, and SANS teaches the same six steps under slightly different names ("identification" for detect, "eradication" for remove, "lessons learned" for learn). Whatever the names, the order matters: you keep evidence before you remove anything, and you contain before you clean.

Think of a kitchen fire. You have an extinguisher on the wall before it starts (prepare). You check it is really a fire and not steam (detect). You put a lid on the pan and turn off the gas (contain). You throw away the burnt food and clean the hob (remove). You check the gas works safely before you cook again (recover). And you stop leaving the oil on high heat while you answer the phone (learn).

Two habits run through all six steps. Write down every action with the time, because memory is unreliable at 3 a.m. And keep **evidence**: copies of the files, lists and logs that show what happened, taken before you change them, with a checksum that proves they were not changed afterwards.

## Try it

You play two parts again. First a teammate sets up the drill on your machine, then you respond to it. Everything stays on your machine, and nothing in the drill can connect anywhere. The outputs come from a lab machine with the user `sam`.

:::caution[Your own machine only]
This drill changes your own account's SSH keys and scheduled tasks, and removes the changes again. Run it on your own Linux, in WSL or a virtual machine, never on a shared or work computer.
:::

### 1. Set up the drill, as the teammate

```bash
mkdir -p ~/ir
cd ~/ir
```

```bash title="plant.sh"
#!/bin/bash
# plant.sh: set up a harmless incident drill. Nothing here talks to the network.
mkdir -p ~/.ssh ~/.cache
# 1. A stranger's SSH key. The private half is deleted at once, so nobody can use it.
ssh-keygen -q -t ed25519 -N "" -C "support@203.0.113.66" -f /tmp/drill_key
cat /tmp/drill_key.pub >> ~/.ssh/authorized_keys
rm /tmp/drill_key /tmp/drill_key.pub
# 2. A hidden program that only writes the time to a file, every 30 seconds.
cat > ~/.cache/.update.sh <<'EOF'
#!/bin/bash
while true; do date >> /tmp/.update.log; sleep 30; done
EOF
chmod +x ~/.cache/.update.sh
# 3. A way back: start the program again after every reboot.
(crontab -l 2>/dev/null; echo "@reboot $HOME/.cache/.update.sh") | crontab -
nohup ~/.cache/.update.sh > /dev/null 2>&1 &
echo "Drill ready."
```

```bash
bash plant.sh
```

```output
Drill ready.
```

The script plants three things that real intruders often leave behind: an SSH key, so they can log in again; a hidden program; and a scheduled task that restarts the program. **Cron** is the Linux service that runs commands on a schedule, and `crontab` edits each user's list of scheduled commands; `@reboot` means "at every start". A way of coming back after a reboot or a password change is called **persistence**. Now forget what you just read, and switch roles.

### 2. Prepare: open your notes

```bash
note() { echo "$(date -u '+%F %T') $*" >> ~/ir/notes.txt; }
note "prepare: drill started, responder sam"
```

`note` is a small shell function: a name for a few commands, like a function in Python. `$*` stands for all the words you give it. Each call adds one line with the time in UTC to `notes.txt`. Real preparation happens long before an incident, of course: the baselines of lesson 13.1, the logs of lesson 13.2, the backups of lesson 13.5 and a plan that says who decides what.

### 3. Detect: check the alert

Imagine a monitoring rule just told you: "`~/.ssh/authorized_keys` changed." Look at it:

```bash
cut -d' ' -f3 ~/.ssh/authorized_keys
```

```output
pid1-lab-test-key
support@203.0.113.66
```

`authorized_keys` has one key per line, and the third field is the key's comment. The first line is the lab's own key; yours will show your keys. The second is a key nobody here added. An incident, not just an event. Write it down, then look for related changes. Intruders rarely stop at one:

```bash
note "detect: unknown key support@203.0.113.66 in authorized_keys"
crontab -l
```

```output
@reboot /home/sam/.cache/.update.sh
```

<!-- lab: nocheck -->
```bash
pgrep -af update.sh
```

```output
2823 /bin/bash /home/sam/.cache/.update.sh
```

`pgrep -af` lists running processes whose command line contains the text, with their PID. A scheduled task you did not create, and a running program in a hidden folder. What does it do?

```bash
cat ~/.cache/.update.sh
```

```output
#!/bin/bash
while true; do date >> /tmp/.update.log; sleep 30; done
```

In this drill it is harmless. In a real incident, you would also check the logs of lesson 11.4 to find out when the key was added and from where, because that tells you how the intruder got in.

```bash
note "detect: cron @reboot and running process ~/.cache/.update.sh"
```

### 4. Keep the evidence

Before you change anything, copy what you found, and record a checksum of each copy:

```bash
mkdir -p ~/ir/evidence
cp ~/.ssh/authorized_keys ~/ir/evidence/
cp ~/.cache/.update.sh ~/ir/evidence/update.sh
crontab -l > ~/ir/evidence/crontab.txt
pgrep -af update.sh > ~/ir/evidence/processes.txt
cd ~/ir/evidence
sha256sum * > ../SHA256SUMS
sha256sum -c ../SHA256SUMS
cd ~/ir
note "evidence: 4 files copied to ~/ir/evidence, checksums in SHA256SUMS"
```

```output
authorized_keys: OK
crontab.txt: OK
processes.txt: OK
update.sh: OK
```

`sha256sum` computes a SHA-256 hash of each file, as in lesson 10.1, and `-c` checks the files against a saved list. If anyone changes a copy later, its line says `FAILED`. The copy of `.update.sh` gets a name without the dot on purpose: `*` skips hidden files, so with the dot it would have no checksum. Investigators also record who handled the evidence and when, so that it can be trusted later; that record is called the **chain of custody**. The process list must be saved now, before step 5, because it disappears the moment you stop the program.

### 5. Contain: stop the damage

```bash
pkill -f .update.sh
sed -i '/support@203.0.113.66/d' ~/.ssh/authorized_keys
pgrep -c -f update.sh
cut -d' ' -f3 ~/.ssh/authorized_keys
note "contain: process stopped, unknown key removed"
```

```output
0
pid1-lab-test-key
```

This is **containment**: stopping the incident from getting worse before you clean up. `pgrep -c` counts the matching processes: none left. `sed -i '/text/d'` deletes, in place, every line that contains the text, so only that one key is gone and yours stays. On a company network, containing often means cutting the whole machine off the network instead, which keeps the evidence on it intact.

### 6. Remove what was left behind

The program is stopped, but it would start again at the next boot. Remove the way back in, then the program:

```bash
crontab -l | grep -v update.sh | crontab -
rm ~/.cache/.update.sh /tmp/.update.log
note "remove: cron entry and ~/.cache/.update.sh deleted"
```

`grep -v` keeps every line that does not match, and `crontab -` installs the result as the new list. Any other scheduled task you had stays.

### 7. Recover: check against the baseline

```bash
grep -c support@ ~/.ssh/authorized_keys
crontab -l | grep -c update.sh
pgrep -c -f update.sh
ls ~/.cache/.update.sh
```

```output
0
0
0
ls: cannot access '/home/sam/.cache/.update.sh': No such file or directory
```

Four checks, four clean answers. On a real machine, recovery goes further: you change the passwords and keys the intruder may have seen, fix the hole they came in through, restore changed files from a backup made before the incident, and watch the machine more closely for a few weeks. When you cannot be sure that you found everything, the safe choice is to reinstall from scratch and restore your data.

### 8. Learn: read your timeline

```bash
note "recover: all checks clean"
```

<!-- lab: nocheck -->
```bash
cat notes.txt
```

```output
2026-11-22 17:32:51 prepare: drill started, responder sam
2026-11-22 17:32:51 detect: unknown key support@203.0.113.66 in authorized_keys
2026-11-22 17:32:51 detect: cron @reboot and running process ~/.cache/.update.sh
2026-11-22 17:32:52 evidence: 4 files copied to ~/ir/evidence, checksums in SHA256SUMS
2026-11-22 17:32:52 contain: process stopped, unknown key removed
2026-11-22 17:32:53 remove: cron entry and ~/.cache/.update.sh deleted
2026-11-22 17:32:53 recover: all checks clean
```

The times here are seconds apart because a test machine typed the commands; yours will be spread over several minutes. This timeline is the start of the **incident report**: what happened, when, what you did, what the cause was, and what you will change. The most important part is the last one, and it should be concrete: "an alert when `authorized_keys` changes" is an improvement; "be more careful" is not. Lesson 13.6 writes exactly that kind of alert.

<!-- lab: run
cmp -s ~/.ssh/authorized_keys /tmp/ak.save || cp /tmp/ak.save ~/.ssh/authorized_keys
-->

## Exercise

Put each action into one of the six steps. Then write a three-line "what we change" section for the drill's report.

1. Make a copy of `/var/log/auth.log` before you touch the machine.
2. Unplug the network cable of a laptop that sends data to an unknown address.
3. Test that last week's backup of the database can be restored.
4. Delete an account called `helpdesk2` that nobody created.
5. Restore `/etc/ssh/sshd_config` from the backup taken before the incident.
6. Add a rule that alerts when a new account is created.
7. Read the alert and decide whether it is a false positive.

<details>
<summary>Show the solution</summary>

| Action | Step |
|---|---|
| 1. Copy `auth.log` first | Detect (keeping evidence is part of the investigation) |
| 2. Unplug the network | Contain |
| 3. Test a restore of last week's backup | Prepare |
| 4. Delete `helpdesk2` | Remove |
| 5. Restore `sshd_config` from backup | Recover |
| 6. Alert on new accounts | Learn |
| 7. Read the alert, decide if it is real | Detect |

Action 3 is preparation because it happens before any incident: a backup you have never restored is not yet a backup you can count on (lesson 13.5). Action 6 can come from a report, but it also prepares you for the next incident: the six steps are a circle, not a line.

A good "what we change" section names actions, owners and dates. For example:

```text
- Alert when ~/.ssh/authorized_keys or the crontab changes (sam, this week).
- Compare accounts and listening ports with the baseline every day (sam, this week).
- Find out from the SSH logs how the key was added, and close that hole first.
```

</details>

## Check yourself

**1. Why do you keep evidence before you contain or remove anything?**

<details>
<summary>Answer</summary>

Containing and removing change the system: a stopped process disappears, a deleted file is gone. Without copies you cannot later prove what happened or find out how the intruder got in.

</details>

**2. In the drill, which planted item was the persistence, and why was removing it a separate step from stopping the program?**

<details>
<summary>Answer</summary>

The `@reboot` cron entry (and the SSH key, which is a way back in too). Stopping the program contains the incident for now, but the cron entry would start it again at the next boot, so it must be removed as well.

</details>

**3. What does `sha256sum -c ../SHA256SUMS` prove?**

<details>
<summary>Answer</summary>

That each evidence file is exactly the same as when its checksum was recorded. If a single byte changed, its line would say `FAILED`.

</details>

**4. Your machine was broken into and you are not sure you found everything the intruder left. What is the safe way to recover?**

<details>
<summary>Answer</summary>

Reinstall the system from scratch and restore your data from a backup made before the incident, then change the passwords and keys and fix the way they got in.

</details>

**5. Which of these belongs in the "learn" step: "Be more careful with SSH" or "Alert when authorized_keys changes"? Why?**

<details>
<summary>Answer</summary>

"Alert when authorized_keys changes". It is a concrete action that someone can do and check. "Be more careful" changes nothing.

</details>

## Common mistakes

- **Switching the machine off at once.** A power-off loses the running processes and network connections, which are often the best evidence. Contain by cutting the network, keep evidence, then decide.
- **Cleaning before collecting.** Deleting the strange file first feels good, and destroys what you needed to find out how it got there. Evidence first, always.
- **Fixing the symptom, not the cause.** Removing the key while the hole that let the intruder add it stays open means they come back tomorrow. Find the cause in the logs.
- **Working without notes.** After two hours nobody remembers the order of their own actions. Write every step with the time, as the `note` function did.
- **Acting alone on a machine that is not yours.** At work or university, report it to the people in charge and follow their plan. Your job is to tell them quickly what you saw, not to investigate on your own.

## Key terms

- **Incident**: an event that harms or threatens the confidentiality, integrity or availability of a system.
- **Incident response**: the planned way of handling an incident: prepare, detect, contain, remove, recover, learn.
- **Containment**: stopping an incident from spreading or getting worse, before cleaning up.
- **Persistence**: a way for an intruder to keep access after a reboot or a password change, such as an SSH key or a scheduled task.
- **Cron**: the Linux service that runs commands on a schedule; each user's list of commands is their crontab.
- **Evidence**: copies of the files, lists and logs that show what happened, kept unchanged.
- **Chain of custody**: the record of who handled each piece of evidence and when, so that it can be trusted.
- **Incident report**: a written summary of an incident: timeline, cause, actions taken and what will change.

## Go further

- [NIST SP 800-61: Incident Response Recommendations](https://csrc.nist.gov/pubs/sp/800/61/r3/final): the US standard guide to incident response, in its newest revision at the time of writing.
- [CISA: Incident Response Playbooks](https://www.cisa.gov/resources-tools/resources/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks): step-by-step playbooks that a government agency gives to its teams.
- [Ubuntu manual: crontab](https://manpages.ubuntu.com/manpages/noble/man5/crontab.5.html): how scheduled tasks are written, including `@reboot` and the five time fields.
