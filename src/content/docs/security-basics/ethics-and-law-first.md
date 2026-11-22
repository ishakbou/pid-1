---
title: Ethics and law first
description: Learn what you are allowed to test, what gets people into legal trouble, and how written permission and scope work.
lesson: "9.1"
time: 15 min
sidebar:
  order: 1
---

A student notices that the login page of the school's grades website accepts very short passwords. He is curious, so one evening he tries a few passwords on a teacher's account "just to see". He changes nothing and tells nobody. In most countries he has still broken the law, and the school's logs have his IP address. This lesson comes first in the security part of the course so that this student is never you.

## Goal

After this lesson you can:

- Say what you may test and what you may not.
- Explain what permission must contain before a security test starts.
- Check a target against a written scope before you touch it.

## Why it matters

The skills in the next modules work on real systems, and that is exactly the problem. The same command is homework on your own machine and a crime on someone else's. Courts and employers look at what you did, and good intentions do not change it. A criminal record for computer misuse can close the door to the security jobs you are studying for.

## The idea

One rule covers almost everything: **only test systems you own or have written permission to test.**

Think of a locksmith. Picking locks is a normal, legal skill. A locksmith practices on locks she bought, and she opens a customer's door when the customer asks her to. Opening a stranger's door to "check if it is safe" is burglary, even if she takes nothing. The skill is the same in all three cases. Permission is the only difference.

### What the law says

Laws differ from country to country, and this lesson is not legal advice. The common core is simple, though. In almost every country it is a crime to access a computer system, or the data in it, without permission. Examples are the Computer Fraud and Abuse Act in the United States and the Computer Misuse Act in the United Kingdom. Many other countries wrote their laws after an international treaty, the Budapest Convention on Cybercrime.

These things get people into trouble again and again:

| What they did | Why it is a problem |
|---|---|
| Logged in with a password they guessed or found | Access without permission, even if nothing was changed |
| Scanned the school or company network "to learn" | They do not own it, and nobody allowed it |
| Tested a website and told the owner afterwards | Permission must come before the test, not after |
| Had permission for one server and tried another | Outside the agreed limits, permission does not exist |
| Kept or shared data they found | A second offence on top of the first |

### How permission works

Professionals who attack systems for a living are called penetration testers. A **penetration test** is an attack that the owner ordered, to find weaknesses before a real attacker does. What makes it legal is paperwork, signed before anything starts.

That paperwork answers four questions:

1. **Who allows it?** The person who signs must really have the right to decide. A friend who works at a company cannot give you permission to test the company.
2. **What exactly?** The **scope** is the list of systems you may test, for example two addresses and one web app. Everything not on the list is out of scope.
3. **When and how?** The **rules of engagement** say the dates, the allowed methods and the forbidden ones (for example "do not delete data", "do not take the site down").
4. **Who do you call?** A contact person, in case something breaks or you find something serious.

Some organizations publish permission for everybody. A **bug bounty program** invites anyone to look for flaws in listed systems, under published rules, and often pays for valid reports. A **vulnerability disclosure policy** does the same without the money: it says how to report a flaw and promises not to sue people who follow the rules. Many sites put the contact address for such reports in a small file at `/.well-known/security.txt`.

If you find a flaw by accident, on a site with no such policy, do not test further to "confirm" it. Stop, write down what you saw, and tell the owner privately. Telling the owner first and giving them time to fix it before anything is published is called **coordinated disclosure**.

### Where you can practice freely

You never need somebody else's system to learn. This course uses only legal targets:

- Your own computer and your own virtual machines.
- Your own `mylab` project, on `localhost`.
- Apps that are built to be attacked, such as OWASP Juice Shop, run on your own machine.
- Training platforms such as OverTheWire, picoCTF and PortSwigger Web Security Academy.

## Try it

A scope is only useful if you check it every time. You will write a scope file for your own lab and a small script that refuses anything that is not on it.

### 1. Write down your scope

```bash
mkdir ~/ethics
cd ~/ethics
```

Create this file in the new folder:

```text title="scope.txt"
localhost
127.0.0.1
```

Both lines mean "this computer". `localhost` is the name and `127.0.0.1` is the address, as you saw in [Module 6](../networking/). A machine you own is a target nobody can argue about.

### 2. Write the check

```bash title="check-scope.sh"
#!/bin/bash
# Usage: ./check-scope.sh TARGET
target="$1"

if grep -qxF "$target" scope.txt; then
    echo "IN SCOPE: $target"
else
    echo "OUT OF SCOPE: $target. Stop. You have no permission."
fi
```

The script takes one target and looks for it in `scope.txt`. The three options of `grep` do the careful part: `-q` prints nothing and only reports found or not found, `-F` reads the target as plain text and not as a pattern, and `-x` accepts a match only when it is the whole line.

### 3. Check two targets

```bash
chmod +x check-scope.sh
./check-scope.sh localhost
./check-scope.sh example.com
```

```output
IN SCOPE: localhost
OUT OF SCOPE: example.com. Stop. You have no permission.
```

`example.com` is a real website that belongs to somebody else. It is not in your file, so the answer is no. Notice that the script did not connect to anything. Reading your own list is always allowed.

### 4. Try something that is almost in scope

```bash
./check-scope.sh 127.0.0.10
```

```output
OUT OF SCOPE: 127.0.0.10. Stop. You have no permission.
```

`127.0.0.10` starts with an address from your list, but it is not the same address. It even leads back to your own computer, because every address that starts with `127` does (Module 6). Still, the scope names only `127.0.0.1`, and because of `-x`, "almost" is not enough. Real scopes work the same way: permission for `shop.example.com` says nothing about `mail.example.com`.

### 5. Write a permission note

For your own lab, you are the owner and the tester at once. Write the note anyway. It is the habit that counts, and it is the same form you will ask a client to sign one day.

```text title="permission.txt"
PERMISSION TO TEST
Owner:       Sam Example (I own this laptop and the mylab project)
Scope:       localhost, 127.0.0.1, the folder ~/mylab
Dates:       from 2026-12-01 to 2026-12-31
Allowed:     scanning my own ports, attacking my own mylab app
Not allowed: any other machine, any network I do not own, any real account
Contact:     sam@example.com
```

```bash
grep -c ': ' permission.txt
```

```output
6
```

`grep -c` counts the matching lines. Six lines have a label and a value: owner, scope, dates, allowed, not allowed, contact. If one of them is empty in a real agreement, the test does not start.

## Exercise

Your lab grows. You may now also test `::1`, which is the IPv6 address of your own computer.

1. Add `::1` to `scope.txt` from the terminal, without opening an editor.
2. Change `check-scope.sh` so that it accepts several targets at once and prints one line for each.
3. Check `::1`, `localhost` and `192.168.1.1` with a single command.

<details>
<summary>Show the solution</summary>

```bash
echo "::1" >> scope.txt
```

```bash title="check-scope.sh"
#!/bin/bash
# Usage: ./check-scope.sh TARGET [TARGET ...]
for target in "$@"; do
    if grep -qxF "$target" scope.txt; then
        echo "IN SCOPE: $target"
    else
        echo "OUT OF SCOPE: $target. Stop. You have no permission."
    fi
done
```

```bash
./check-scope.sh ::1 localhost 192.168.1.1
```

```output
IN SCOPE: ::1
IN SCOPE: localhost
OUT OF SCOPE: 192.168.1.1. Stop. You have no permission.
```

`>>` adds a line to the end of a file, and `"$@"` means "every argument that was given". The address `192.168.1.1` is often a home router. It may even be the router in your house, but it is not on the list, so it stays out until the owner agrees and you add it.

</details>

## Check yourself

**1. A friend says: "Test my employer's website, I work there, it's fine." Is that permission?**

<details>
<summary>Answer</summary>

No. Permission must come from someone who has the right to decide for that system, and it must be written. An employee who does not own or manage the site cannot give it.

</details>

**2. You have written permission to test `shop.example.com`. During the test you notice `mail.example.com`. May you test it too?**

<details>
<summary>Answer</summary>

No. It is not in the scope. Outside the scope, permission does not exist. You can tell your contact person about it and ask for the scope to be extended in writing.

</details>

**3. You find a flaw in a website by accident, and the site has no disclosure policy. What do you do?**

<details>
<summary>Answer</summary>

Stop testing, write down what you saw, and report it privately to the owner. Give them time to fix it before anything is made public. This is coordinated disclosure. Do not dig further to "prove" the flaw.

</details>

**4. Name three places where you can practice attacks legally.**

<details>
<summary>Answer</summary>

Any three of: your own computer or virtual machines, your own `mylab` app on `localhost`, an app built to be attacked (such as OWASP Juice Shop) running on your machine, and training platforms such as OverTheWire, picoCTF or PortSwigger Web Security Academy.

</details>

## Common mistakes

- **"I did not break anything."** Access without permission is the offence. Damage only makes it worse.
- **Asking for permission afterwards.** A report that starts with "I already tested your site" is a confession. Ask first, and wait for a written yes.
- **Trusting a spoken yes.** People forget, change jobs or change their mind. An email is the minimum; keep it.
- **Testing on shared networks.** The Wi-Fi of a school, a café or your employer is not yours, even when you are allowed to use it. Do your practice on `localhost` or in a virtual machine.
- **Using data you came across.** If you see data that is not yours during a legal test, do not copy it, keep it or show it to anyone except your contact.

## Key terms

- **Penetration test**: an attack on a system that its owner ordered, done to find weaknesses before a real attacker does.
- **Scope**: the exact list of systems a tester is allowed to test. Everything else is out of scope.
- **Rules of engagement**: the agreed conditions of a test: dates, allowed and forbidden methods, and who to contact.
- **Bug bounty program**: a public invitation to look for flaws in listed systems under published rules, often with a reward.
- **Vulnerability disclosure policy**: a public page that says how to report a flaw and what the owner promises in return.
- **Coordinated disclosure**: reporting a flaw to the owner privately and giving them time to fix it before it is made public.

## Go further

- [OWASP Vulnerability Disclosure Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerability_Disclosure_Cheat_Sheet.html): how to report a flaw well, and how organizations should receive reports.
- [RFC 9116: A File Format to Aid in Security Vulnerability Disclosure](https://www.rfc-editor.org/rfc/rfc9116): the standard behind the `security.txt` file.
- [The Budapest Convention on Cybercrime](https://www.coe.int/en/web/cybercrime/the-budapest-convention): the Council of Europe's page about the treaty that many national laws follow.
