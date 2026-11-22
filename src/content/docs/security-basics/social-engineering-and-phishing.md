---
title: Social engineering and phishing
description: Understand how attackers trick people instead of computers, take a phishing message apart line by line, and learn how to report one.
lesson: "9.5"
time: 20 min
sidebar:
  order: 5
---

"Your mailbox is 98% full. Verify your account within 24 hours or it will be closed." You have probably received a message like this, and you will receive hundreds more. No software is attacked in it. No password is cracked. The attacker simply asks, and waits for one tired person out of a thousand to answer.

## Goal

After this lesson you can:

- Explain what social engineering is and why it works on smart people.
- Find the warning signs in a message: the real sender, the pressure, the real destination of a link.
- Say what to do with a phishing message, and what to do if you already clicked.

## Why it matters

Attacking a person is usually cheaper than attacking a system. A company can spend years on firewalls and updates, and one employee who types a password into a fake page hands over a valid login. Defenders who only study technology miss the most common way in. And outside work, your own email, bank and social accounts are targets every day.

## The idea

**Social engineering** is tricking a person into doing something that helps the attacker: giving a password, opening a file, paying an invoice, holding a door open. The target is human behavior, not a software bug.

Picture someone in a bright safety vest carrying a ladder. That person walks into most buildings without a single question, because we are trained to be polite to people who look like they belong. Nobody was stupid. A normal, useful habit was used against them. Social engineering works the same way through a screen.

### The levers

Almost every trick pulls one or more of these:

| Lever | What the message says | What it wants from you |
|---|---|---|
| Urgency | "Within 24 hours", "last warning" | Act before you think |
| Authority | "From the director", "IT support", "the bank" | Obey without checking |
| Fear | "Your account will be closed" | Panic |
| Reward | "You won", "your refund is ready" | Greed or curiosity |
| Helpfulness | "Can you do me a quick favor?" | Be nice |

### The common forms

**Phishing** is social engineering by message, usually email, sent to many people at once in the hope that a few respond. The same trick by SMS or by phone call has its own nicknames (smishing, vishing), and it works the same way.

**Spear phishing** is phishing aimed at one person or one organization. The attacker first collects details, such as your name, your job and your manager's name, and writes a message that fits your life. It is much harder to spot.

**Pretexting** means inventing a role and a story: "Hi, this is Karim from IT, we are moving mailboxes today and I need the code you just received." The story is the pretext.

### What to do

When a message asks you to log in, pay, open a file or share a code:

1. **Slow down.** Pressure is the main sign. Real deadlines survive a ten-minute check.
2. **Check through another channel.** Do not use the link, phone number or reply address in the message. Type the site's address yourself, or call a number you already know.
3. **Report it.** Use the "Report phishing" button of your mail program, or forward the message to the IT or security team of your school or company. Your report protects the next person.
4. **If you already clicked:** change that password right away (on the real site, typed by hand), turn on MFA, and tell the IT team. A fast report matters far more than the embarrassment.

## Try it

You will take a suspicious email apart with tools you already know. All addresses below end in `.example`, an ending reserved for documentation, so none of them is a real site. In this story, Sam studies at a university whose real domain is `university.example`.

### 1. Save the message

```bash
mkdir ~/phish
cd ~/phish
```

```text title="message.eml"
From: "Campus IT Support" <it-support@campus-helpdesk.example>
Reply-To: account.recovery@fastmail-box.example
To: sam@university.example
Subject: URGENT: your mailbox will be closed today
Date: Mon, 16 Nov 2026 08:12:45 +0000

Dear user,

Your mailbox is 98% full. To keep your account you must verify it
within 24 hours. Accounts that are not verified will be closed.

Verify now: https://university.example.login-check.example/verify?id=4471

Campus IT Support
```

An `.eml` file is an email saved as text. Like the HTTP messages you saw in [Module 6](../networking/), it has headers at the top, then an empty line, then the body. Most mail programs can show this view under a name such as "Show original" or "View source".

### 2. Find the real sender

```bash
grep -E '^(From|Reply-To|To):' message.eml
```

```output
From: "Campus IT Support" <it-support@campus-helpdesk.example>
Reply-To: account.recovery@fastmail-box.example
To: sam@university.example
```

`grep -E` lets you give several choices separated by `|`, and `^` means "at the start of the line". Now compare. The text in quotes is the display name, and the sender can write anything there. The address between `<` and `>` is at `campus-helpdesk.example`, which is not the university's domain. And `Reply-To` sends any answer to a third domain. Three names for one "IT support" is two too many.

### 3. Find the pressure

```bash
grep -n -i -E 'urgent|must|within|closed' message.eml
```

```output
4:Subject: URGENT: your mailbox will be closed today
9:Your mailbox is 98% full. To keep your account you must verify it
10:within 24 hours. Accounts that are not verified will be closed.
```

`-n` shows line numbers and `-i` ignores capital letters. In a message of 14 lines, three push you to act now. This is the urgency and fear from the table. Notice also line 7 of the file, "Dear user": the sender does not know your name.

### 4. Pull out the link

```bash
grep -o 'https://[^ ]*' message.eml
```

```output
https://university.example.login-check.example/verify?id=4471
```

`-o` prints only the part that matched: `https://` followed by everything up to the next space. The link starts with `university.example`, which is exactly what the attacker wants your eye to stop on.

### 5. Read the link the way a browser does

```python
from urllib.parse import urlparse

link = "https://university.example.login-check.example/verify?id=4471"
host = urlparse(link).hostname
print(host)
print(".".join(host.split(".")[-2:]))
```

```output
university.example.login-check.example
login-check.example
```

`urlparse` splits a URL into its parts, and `hostname` is the server's name. Read that name from right to left, the way DNS does in [lesson 6.4](../networking/dns/). The last two parts, `login-check.example`, are the **registered domain**: the name somebody actually bought. Everything to the left of it is free text chosen by that owner. So this link goes to a server of whoever owns `login-check.example`, and the university has nothing to do with it.

:::note[Two parts, usually]
Some country endings have two parts, such as `.co.uk`. Then the registered domain is the last three parts, as in `example.co.uk`. The rule stays the same: read from the right.
:::

### 6. See one more disguise

```python
from urllib.parse import urlparse

print(urlparse("https://university.example@203.0.113.9/login").hostname)
```

```output
203.0.113.9
```

In a URL, anything between `//` and `@` is a username, not the site. The real destination here is the bare address `203.0.113.9`, which is from the range kept for examples, as you saw in Module 6. A login link that points to a number is a strong warning sign on its own.

## Exercise

Sam also works part-time at a shop whose domain is `smallshop.example`. This message arrives on a Friday afternoon. Save it, analyze it with the commands from this lesson, and list every warning sign you can find. Try to reach six.

```text title="invoice.eml"
From: "Lea Martin (Director)" <lea.martin.director@mail-office.example>
To: sam@smallshop.example
Subject: Quick favor before my flight
Date: Fri, 20 Nov 2026 16:48:02 +0000

Hi Sam,

I am boarding in 10 minutes and cannot take calls. Please pay this
invoice today, the supplier changed bank account and the new details
are in the file. Keep it between us for now, I will explain on Monday.

http://smallshop.example.files-share.example/invoice_2026.pdf.exe

Lea
```

<details>
<summary>Show the solution</summary>

```bash
grep -E '^(From|Reply-To):' invoice.eml
grep -o 'http[^ ]*' invoice.eml
```

```output
From: "Lea Martin (Director)" <lea.martin.director@mail-office.example>
http://smallshop.example.files-share.example/invoice_2026.pdf.exe
```

```python
from urllib.parse import urlparse

link = "http://smallshop.example.files-share.example/invoice_2026.pdf.exe"
host = urlparse(link).hostname
print(".".join(host.split(".")[-2:]))
```

```output
files-share.example
```

The warning signs:

1. The sender's address is at `mail-office.example`, not at the shop's own domain. Only the display name says "Director".
2. Authority: the message uses the director's name to make you obey.
3. Urgency: "boarding in 10 minutes", "today".
4. It blocks the check: "cannot take calls" is there to stop you from phoning Lea.
5. Secrecy: "keep it between us" keeps colleagues from noticing.
6. It asks for a payment to a new bank account, the classic goal of this kind of fraud.
7. The link's registered domain is `files-share.example`, not the shop.
8. The file name ends in `.exe`. That is a program, not a PDF.

This one uses Sam's name and his director's name, so it is spear phishing. The right move: do not pay, do not open the file, and call Lea on the number you already have, or ask a colleague.

</details>

## Check yourself

**1. An email shows the sender as "Your Bank" and the address `alerts@secure-bank-mail.example`. Which of the two tells you more, and can you fully trust it?**

<details>
<summary>Answer</summary>

The address tells you more: the display name is free text. But the address is not proof either. Check through another channel, for example by typing the bank's address yourself.

</details>

**2. What is the registered domain in `https://accounts.mybank.example.sign-in.example/reset`?**

<details>
<summary>Answer</summary>

`sign-in.example`. Read the host name from the right: the last two parts are the registered domain. `accounts.mybank.example` on the left is only decoration.

</details>

**3. Someone phones you: "This is IT. I need the six-digit code you just got by SMS to fix your account." What is this, and what do you do?**

<details>
<summary>Answer</summary>

Pretexting: an invented role and story. Do not give the code. Hang up and contact IT yourself through a number or address you already know, then report the call.

</details>

**4. You typed your password into a page and then realized it was fake. What are your next steps?**

<details>
<summary>Answer</summary>

Change the password right away on the real site (type the address by hand), turn on MFA, and report it to the IT or security team. If you used the same password anywhere else, change it there too.

</details>

**5. Why do so many phishing messages contain a short deadline?**

<details>
<summary>Answer</summary>

Urgency makes people act before they think or check. A ten-minute check through another channel is enough to break most of these attacks, so the attacker tries to take those ten minutes away.

</details>

## Common mistakes

- **Trusting the display name.** It is free text. Always look at the address behind it.
- **Trusting the padlock.** `https` only means the connection is encrypted. Fake sites have padlocks too.
- **Looking only for spelling mistakes.** Many phishing messages are written perfectly. Check the sender, the pressure and the link instead.
- **Checking with the contact details in the message.** The phone number in a fake email reaches the attacker. Use details you already had.
- **Staying silent after a click.** People hide it because they feel ashamed, and the attacker gets hours of extra time. Report at once.

## Key terms

- **Social engineering**: tricking a person into doing something that helps an attacker.
- **Phishing**: social engineering by message, usually email, sent to many people at once.
- **Spear phishing**: phishing aimed at one person or organization, using personal details.
- **Pretexting**: inventing a role and a story to make a request look normal.
- **Registered domain**: the part of a host name that somebody bought, usually its last two parts, such as `example.com`.

## Go further

- [CISA: Recognize and Report Phishing](https://www.cisa.gov/secure-our-world/recognize-and-report-phishing): short official advice from the United States cybersecurity agency.
- [NCSC: Phishing attacks, defending your organisation](https://www.ncsc.gov.uk/guidance/phishing): how the United Kingdom's security agency tells organizations to defend in several layers.
- [MDN: What is a URL?](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL): every part of a web address, explained with examples.
