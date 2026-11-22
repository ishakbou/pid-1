---
title: Threats, vulnerabilities and risk
description: Tell assets, threats, vulnerabilities and risk apart, score risks by likelihood and impact, and decide which ones to handle first.
lesson: "9.3"
time: 20 min
sidebar:
  order: 3
---

You have one free weekend and a list of ten security problems: an old router, a weak email password, no backups, a laptop with no screen lock, and six more. You cannot fix everything. Which two do you fix first? If your answer is "the scariest ones", this lesson gives you a better method.

## Goal

After this lesson you can:

- Tell an asset, a threat, a vulnerability and a risk apart.
- Score a risk from its likelihood and its impact.
- Rank a list of risks and choose what to do about each one.

## Why it matters

No person and no company has the time or money to fix everything. People who cannot rank risks spend their effort on what was in the news last week and leave the boring, likely problems open. Ranking is also how you talk to people who are not technical: a manager does not want a list of fifty flaws, they want to know which three matter and why.

## The idea

Four words are used loosely in everyday talk and precisely in security.

An **asset** is anything of value that you want to protect: data, money, a service, a reputation.

A **threat** is something that could harm an asset. It can be a person (a thief, a criminal group, an angry former employee) or an event (a fire, a dead disk, a mistake).

A **vulnerability** is a weakness that a threat can use: a bug in software, a weak password, a door that does not lock, a person who was never trained. Using a vulnerability to cause harm is called **exploiting** it.

**Risk** is what you get when you put them together: how likely it is that a threat uses a vulnerability, and how bad the damage to the asset would be.

Take a house. The asset is the laptop on the desk. The threat is a burglar. The vulnerability is a ground-floor window that does not lock. The risk is the chance of a burglar coming in through that window, combined with what you would lose.

Now change one thing at a time. The same broken window on the thirtieth floor is still a vulnerability, but almost no threat can reach it, so the risk is low. A burglar in a street where every window locks is still a threat, but has nothing to use. Risk needs both.

### Scoring a risk

A simple and very common method gives two marks to each risk:

- **Likelihood**: how probable is it? 1 = rare, 2 = possible, 3 = likely.
- **Impact**: how bad is it if it happens? 1 = annoying, 2 = painful, 3 = serious.

Multiply them:

**risk = likelihood × impact**

| | Impact 1 | Impact 2 | Impact 3 |
|---|---|---|---|
| **Likelihood 3** | 3 | 6 | 9 |
| **Likelihood 2** | 2 | 4 | 6 |
| **Likelihood 1** | 1 | 2 | 3 |

In this lesson, 6 or more is high, 3 or 4 is medium, and 1 or 2 is low. The numbers are estimates, not measurements. Their job is to make you compare risks with each other and to let someone else disagree with a specific number.

### What you can do with a risk

There are four choices, and "fix it" is only one of them.

| Choice | Meaning | Example |
|---|---|---|
| **Reduce** | Lower the likelihood or the impact | Install the update; make backups |
| **Avoid** | Stop doing the risky thing | Do not store card numbers at all |
| **Transfer** | Let someone else carry it | Insurance; pay a provider to host the service |
| **Accept** | Decide that it is small enough to live with | A typo on the public blog |

Accepting a risk is a real decision. Ignoring a risk is not the same thing, because nobody decided anything.

## Try it

You will build a small **risk register**, which is a list of risks with their scores, and let Python rank it.

### 1. Write the register

```bash
mkdir ~/risk
cd ~/risk
```

```text title="risks.csv"
risk,likelihood,impact
Laptop stolen from the library,2,3
Email password guessed,3,3
Coffee spilled on the keyboard,2,2
Phone lost with no screen lock,1,3
Old router with the default admin password,2,3
House fire destroys the laptop,1,3
Friend sees my music playlist,2,1
```

Each line is one risk for a student, followed by its likelihood and its impact. Read the second line: your email password is short and weak today, so it is likely to be guessed (3), and the email account can reset every other password you have (3).

### 2. Write the ranking script

```python title="rank.py"
def level(score):
    if score >= 6:
        return "HIGH"
    if score >= 3:
        return "MEDIUM"
    return "LOW"


risks = []
with open("risks.csv") as f:
    next(f)  # skip the first line, which holds the column names
    for line in f:
        name, likelihood, impact = line.strip().split(",")
        score = int(likelihood) * int(impact)
        risks.append((score, name))

risks.sort(reverse=True)

for score, name in risks:
    print(score, level(score), name)
```

The script reads each line, multiplies the two marks and keeps the score with the name. `risks.sort(reverse=True)` puts the biggest score first.

### 3. Rank the risks

```bash
python3 rank.py
```

```output
9 HIGH Email password guessed
6 HIGH Old router with the default admin password
6 HIGH Laptop stolen from the library
4 MEDIUM Coffee spilled on the keyboard
3 MEDIUM Phone lost with no screen lock
3 MEDIUM House fire destroys the laptop
2 LOW Friend sees my music playlist
```

Here is your weekend plan. The email password comes first, then the router and the laptop. The house fire is the most dramatic line in the file, and it sits near the bottom, because it is rare.

### 4. Reduce one risk and rank again

You change the email password to a long, unique one and turn on a second login step (the next lesson covers both). Guessing the password becomes rare, so the likelihood drops from 3 to 1.

```bash
sed -i 's/guessed,3,3/guessed,1,3/' risks.csv
grep Email risks.csv
```

```output
Email password guessed,1,3
```

`sed -i 's/old/new/' file` replaces the text `old` with `new` inside a file. It saves you from opening an editor for a one-word change.

```bash
python3 rank.py
```

```output
6 HIGH Old router with the default admin password
6 HIGH Laptop stolen from the library
4 MEDIUM Coffee spilled on the keyboard
3 MEDIUM Phone lost with no screen lock
3 MEDIUM House fire destroys the laptop
3 MEDIUM Email password guessed
2 LOW Friend sees my music playlist
```

The email risk fell from 9 to 3. It did not fall to zero: the impact is still 3, because a stolen email account is as bad as before. What is left after a defense is called **residual risk**. The list also has a new first line, which is the point of ranking again after each fix.

## Exercise

Stay in `~/risk`.

1. Add two risks to `risks.csv` from the terminal: `Disk dies with no backup of mylab` with likelihood 2 and impact 3, and `Phishing message steals the GitHub password` with likelihood 2 and impact 3.
2. Rank the list.
3. You start making a weekly backup of `mylab`. Decide which number changes, likelihood or impact, change it to 1, and rank again.

<details>
<summary>Show the solution</summary>

```bash
echo "Disk dies with no backup of mylab,2,3" >> risks.csv
echo "Phishing message steals the GitHub password,2,3" >> risks.csv
python3 rank.py
```

```output
6 HIGH Phishing message steals the GitHub password
6 HIGH Old router with the default admin password
6 HIGH Laptop stolen from the library
6 HIGH Disk dies with no backup of mylab
4 MEDIUM Coffee spilled on the keyboard
3 MEDIUM Phone lost with no screen lock
3 MEDIUM House fire destroys the laptop
3 MEDIUM Email password guessed
2 LOW Friend sees my music playlist
```

A backup does not make the disk live longer, so the likelihood stays at 2. It changes what you lose: with a copy from last week, the impact drops from 3 to 1.

```bash
sed -i 's/backup of mylab,2,3/backup of mylab,2,1/' risks.csv
python3 rank.py
```

```output
6 HIGH Phishing message steals the GitHub password
6 HIGH Old router with the default admin password
6 HIGH Laptop stolen from the library
4 MEDIUM Coffee spilled on the keyboard
3 MEDIUM Phone lost with no screen lock
3 MEDIUM House fire destroys the laptop
3 MEDIUM Email password guessed
2 LOW Friend sees my music playlist
2 LOW Disk dies with no backup of mylab
```

Some defenses lower the likelihood (a better password), others lower the impact (a backup). Good security uses both kinds.

</details>

## Check yourself

**1. "A web server that has not been updated for a year." Is that a threat, a vulnerability or a risk?**

<details>
<summary>Answer</summary>

A vulnerability. It is a weakness. The threat would be someone who looks for old servers to attack, and the risk is the chance of that happening combined with the damage.

</details>

**2. A risk has likelihood 1 and impact 3. Another has likelihood 3 and impact 2. Which one do you handle first with the method of this lesson?**

<details>
<summary>Answer</summary>

The second one. Its score is 3 × 2 = 6 (high). The first scores 1 × 3 = 3 (medium).

</details>

**3. A shop decides not to keep customers' card numbers and lets a payment company handle them. Which of the four choices did it use?**

<details>
<summary>Answer</summary>

Avoid, for the storage: the shop stopped doing the risky thing. Paying a provider to carry the payment part is also a form of transfer. Both answers are right if you can explain them.

</details>

**4. After you turned on a second login step, the email risk was 3, not 0. What is the name for what remains, and why did it remain?**

<details>
<summary>Answer</summary>

Residual risk. The defense lowered the likelihood, but the impact of a stolen email account did not change, and no defense makes the likelihood exactly zero.

</details>

## Common mistakes

- **Mixing up threat and vulnerability.** The threat is who or what could do harm. The vulnerability is the weakness they would use. "Hackers" is a threat; "the password is 123456" is a vulnerability.
- **Ranking by fear.** Rare, dramatic events feel bigger than common, boring ones. Write the two numbers down and let the product decide.
- **Scoring only the impact.** A terrible event that is almost impossible is a low risk. Likelihood is half of the score.
- **Treating the scores as exact.** A 6 is not twice as bad as a 3. The scores sort the list, and that is all they are for.
- **Doing the ranking once.** New assets, new threats and each fix change the list. Rank again after every change.

## Key terms

- **Asset**: anything of value that you want to protect, such as data, money, a service or a reputation.
- **Threat**: a person or an event that could harm an asset.
- **Vulnerability**: a weakness that a threat can use to cause harm.
- **Exploit**: to use a vulnerability to cause harm. As a noun, the method or code that does it.
- **Risk**: the likelihood that a threat uses a vulnerability, combined with the impact on the asset.
- **Likelihood**: how probable it is that a bad event happens.
- **Impact**: how much damage a bad event causes when it happens.
- **Risk register**: a list of risks with their scores and what was decided about each one.
- **Residual risk**: the risk that remains after a defense is in place.

## Go further

- [OWASP Risk Rating Methodology](https://owasp.org/www-community/OWASP_Risk_Rating_Methodology): a more detailed way to estimate likelihood and impact for software.
- [NIST SP 800-30: Guide for Conducting Risk Assessments](https://csrc.nist.gov/pubs/sp/800/30/r1/final): the long, formal version that large organizations follow.
- [CVE](https://www.cve.org/): the public list of known software vulnerabilities, each with its own number.
